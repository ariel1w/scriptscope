import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from './supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AIPersona {
  id: string;
  name: string;
  username: string;
  personality: string;
  writing_style: {
    lowercase: boolean;
    slang: boolean;
    detailed: boolean;
    mistakes: boolean;
  };
}

const RANDOM_NAMES = [
  'Mike', 'Lisa', 'John', 'Amy', 'Steve', 'Rachel', 'Tom', 'Nina', 'Brad', 'Kelly',
  'Dan', 'Sophie', 'Mark', 'Jess', 'Ryan', 'Maya', 'Jake', 'Emma', 'Alex', 'Zoe',
];

function getRandomName(): string {
  return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
}

function applyWritingStyle(text: string, style: AIPersona['writing_style']): string {
  let result = text;

  if (style.lowercase) {
    result = result.toLowerCase();
    // Randomly capitalize some I's
    result = result.replace(/\bi\b/g, () => (Math.random() > 0.3 ? 'i' : 'I'));
  }

  if (style.mistakes && Math.random() > 0.7) {
    // Add occasional typos
    const typos: Record<string, string> = {
      'the': 'teh',
      'really': 'realy',
      'definitely': 'definately',
      'separate': 'seperate',
    };
    Object.entries(typos).forEach(([correct, typo]) => {
      if (Math.random() > 0.8) {
        result = result.replace(new RegExp(`\\b${correct}\\b`, 'i'), typo);
      }
    });
  }

  return result;
}

export async function generateCommentForPost(postId: string, postTitle: string, postContent: string): Promise<void> {
  // Get AI personas
  const { data: personas } = await supabaseAdmin
    .from('ai_personas')
    .select('*')
    .eq('is_randomizer', false);

  if (!personas || personas.length === 0) return;

  // Decide how many personas will comment (1-4)
  const numComments = Math.floor(Math.random() * 4) + 1;
  const selectedPersonas = personas
    .sort(() => Math.random() - 0.5)
    .slice(0, numComments);

  for (let i = 0; i < selectedPersonas.length; i++) {
    const persona = selectedPersonas[i] as AIPersona;

    // Stagger comments over time
    const delayHours = Math.random() * 48; // 0-48 hours
    const commentDate = new Date(Date.now() + delayHours * 60 * 60 * 1000);

    const personalityPrompts: Record<string, string> = {
      casual: 'You\'re a casual commenter. Keep it short (1-3 sentences). Use lowercase sometimes. Reference your own experience vaguely. Be friendly but not overly enthusiastic.',
      formal: 'You\'re a formal, thoughtful commenter. Write 2-4 sentences. Be analytical. Reference specific points from the article. Sometimes politely disagree or add nuance.',
      technical: 'You\'re a technical screenwriter. Reference industry terms, scripts you\'ve read, or structural elements. Be precise and detailed (3-5 sentences).',
      balanced: 'You\'re a balanced commenter. Mix casual and formal. Sometimes agree, sometimes add your own perspective. 2-4 sentences.',
      friendly: 'You\'re supportive and encouraging. Share how the article helped you. Ask follow-up questions sometimes. 2-3 sentences.',
      skeptical: 'You\'re skeptical but fair. Point out exceptions, alternative viewpoints, or limitations. Not negative, just thoughtful. 3-4 sentences.',
    };

    const personalityPrompt = personalityPrompts[persona.personality] || personalityPrompts.balanced;

    const prompt = `You are ${persona.name}, commenting on this blog post: "${postTitle}"

${personalityPrompt}

Article excerpt: ${postContent.substring(0, 500)}

Write a natural, human comment. NO AI phrases like "great insights", "thanks for sharing", "well written". Be specific. Reference actual content from the article. Sound like a real person having a conversation.

Respond with ONLY the comment text, no JSON, no quotation marks.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    let commentText = message.content[0].type === 'text' ? message.content[0].text : '';
    commentText = commentText.replace(/^["']|["']$/g, '').trim();
    commentText = applyWritingStyle(commentText, persona.writing_style);

    // Insert comment with staggered timestamp
    await supabaseAdmin.from('blog_comments').insert({
      post_id: postId,
      persona_id: persona.id,
      author_name: persona.name,
      content: commentText,
      created_at: commentDate.toISOString(),
    });
  }

  // Maybe add a randomizer comment too (30% chance)
  if (Math.random() > 0.7) {
    await generateRandomizerComment(postId, postTitle, postContent);
  }

  console.log(`Generated ${numComments} AI comments for post: ${postTitle}`);
}

async function generateRandomizerComment(postId: string, postTitle: string, postContent: string): Promise<void> {
  const randomName = getRandomName();
  const delayHours = Math.random() * 72; // 0-72 hours
  const commentDate = new Date(Date.now() + delayHours * 60 * 60 * 1000);

  const styles = [
    'Write 1 short sentence. Be casual and quick.',
    'Write 2-3 sentences. Share a quick personal story.',
    'Write 1 sentence asking a specific question about the article.',
    'Write 2 sentences disagreeing with one point politely.',
  ];

  const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

  const prompt = `You are ${randomName}, a casual visitor commenting on: "${postTitle}"

${selectedStyle}

Article excerpt: ${postContent.substring(0, 300)}

Write a natural, human comment. Be specific to the article. NO generic praise.

Respond with ONLY the comment text.`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  });

  let commentText = message.content[0].type === 'text' ? message.content[0].text : '';
  commentText = commentText.replace(/^["']|["']$/g, '').trim();

  // Randomizers often use lowercase
  if (Math.random() > 0.5) {
    commentText = commentText.toLowerCase();
  }

  await supabaseAdmin.from('blog_comments').insert({
    post_id: postId,
    persona_id: null,
    author_name: randomName,
    content: commentText,
    created_at: commentDate.toISOString(),
  });
}
