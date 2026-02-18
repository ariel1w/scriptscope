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

function applyWritingStyle(text: string, style: AIPersona['writing_style']): string {
  let result = text;

  if (style.lowercase) {
    result = result.toLowerCase();
    result = result.replace(/\bi\b/g, () => (Math.random() > 0.3 ? 'i' : 'I'));
  }

  if (style.mistakes && Math.random() > 0.7) {
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

// postDate: the blog post's publish date. Comments are staggered AFTER this date
// so they appear to trickle in organically over 4 days.
export async function generateCommentForPost(
  postId: string,
  postTitle: string,
  postContent: string,
  postDate?: Date,
): Promise<void> {
  const baseDate = postDate ?? new Date();

  const { data: personas } = await supabaseAdmin
    .from('ai_personas')
    .select('*')
    .eq('is_randomizer', false);

  if (!personas || personas.length === 0) return;

  // 2–4 personas comment per post
  const numComments = Math.floor(Math.random() * 3) + 2;
  const selectedPersonas = personas
    .sort(() => Math.random() - 0.5)
    .slice(0, numComments);

  const personalityPrompts: Record<string, string> = {
    casual: `You're a casual working screenwriter who comments online. Keep it short (1–3 sentences). Lowercase is fine. Reference your own current script or a recent rewrite experience. Sound like a real person, not a fan.
Tone examples: "been dealing with this exact issue on my pilot", "yeah this cost me a whole act on my last draft", "i keep making this mistake lol"`,

    formal: `You're an experienced screenwriter leaving a thoughtful, analytical comment. 2–4 sentences. Reference a specific point from the article. Occasionally add nuance or a counterpoint from your own experience.
Tone examples: "The point about subtext tracking holds up, though I'd argue it breaks down in procedurals where dialogue has to carry exposition.", "This maps to what my showrunner told me after my first staffing job — took me two more years to actually apply it."`,

    technical: `You're a craft-focused screenwriter. Reference specific structural elements, named screenplays, or industry terminology. Precise and detailed, 3–5 sentences.
Tone examples: "The Blake Snyder framing here is fine but the McKee gap is the more useful lens for this problem.", "Checked my Chinatown notes after reading this — Towne does exactly what you're describing in act two."`,

    balanced: `You're a working screenwriter mixing personal anecdote with craft observation. 2–4 sentences. Personal experience + a craft takeaway.
Tone examples: "I'm on my third rewrite of a pilot and this hit home. The antagonist note especially — mine's been too reactive and I couldn't name why until now.", "My last feature had this exact problem in act two. Took a producer note to see it."`,

    friendly: `You're encouraging and share a personal experience. 2–3 sentences. What did this change for you? Optionally ask a specific follow-up question.
Tone examples: "Saved this. Working on my first feature and the opening scene has been killing me — tried the approach you describe and it clicked.", "The part about planting the theme early without announcing it — that's the thing I keep missing. How early is too early?"`,

    skeptical: `You're fair but skeptical. Push back gently on one point, or name an exception from a real film. 2–4 sentences. Not dismissive — just honest.
Tone examples: "Good points, though the 'avoid flashbacks entirely' advice is too absolute — Arrival and Memento would disagree.", "I'd push back a bit on the three-act framing here. Most TV doesn't work that way and it's starting to bleed into features too."`,
  };

  for (let i = 0; i < selectedPersonas.length; i++) {
    const persona = selectedPersonas[i] as AIPersona;
    const personalityPrompt = personalityPrompts[persona.personality] ?? personalityPrompts.balanced;

    // Spread comments: 6h to 4 days AFTER the post's publish date
    const minHours = 6 + i * 8; // stagger each persona slightly later
    const maxHours = 96;
    const delayHours = minHours + Math.random() * (maxHours - minHours);
    const commentDate = new Date(baseDate.getTime() + delayHours * 3_600_000);

    const prompt = `You are ${persona.name}, a screenwriter leaving a comment on a blog post.

Post title: "${postTitle}"

${personalityPrompt}

Hard rules:
- NEVER say: "great insights", "thanks for sharing", "well written", "love this", "fantastic", "excellent point"
- Reference something SPECIFIC from the article — a technique, a specific phrase used, a concrete example
- Sound like you've actually worked on screenplays — mention your own script, a rewrite, a note you got, a film you studied
- One consistent voice. Don't shift styles.
- Length matches personality — some short, some longer

Article excerpt:
${postContent.substring(0, 700)}

Write ONLY the comment text. No quotation marks around it. No "Comment:" prefix.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    });

    let commentText = message.content[0].type === 'text' ? message.content[0].text : '';
    commentText = commentText.replace(/^["']|["']$/g, '').trim();
    commentText = applyWritingStyle(commentText, persona.writing_style);

    await supabaseAdmin.from('blog_comments').insert({
      post_id: postId,
      persona_id: persona.id,
      author_name: persona.name,
      content: commentText,
      created_at: commentDate.toISOString(),
    });
  }

  // 40% chance of a one-off randomizer comment
  if (Math.random() > 0.6) {
    await generateRandomizerComment(postId, postTitle, postContent, baseDate);
  }

  console.log(`Generated ${numComments} AI comments for: ${postTitle}`);
}

async function generateRandomizerComment(
  postId: string,
  postTitle: string,
  postContent: string,
  postDate: Date,
): Promise<void> {
  const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];

  // Randomizers show up 1–6 days after post
  const delayHours = 24 + Math.random() * 120;
  const commentDate = new Date(postDate.getTime() + delayHours * 3_600_000);

  const styles = [
    'Write exactly 1 casual sentence. Quick gut reaction.',
    'Write 2 short sentences. A specific personal experience related to the article.',
    'Write 1 sentence asking a specific question about something in the article.',
    'Write 2 sentences politely pushing back on one point.',
  ];
  const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

  const prompt = `You are ${randomName}, a casual visitor who found this screenwriting blog: "${postTitle}"

${selectedStyle}

Rules: No generic praise. Reference something specific from the article. Sound like a real person, not a fan.

Article excerpt: ${postContent.substring(0, 350)}

Write ONLY the comment. No quotes.`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  });

  let commentText = message.content[0].type === 'text' ? message.content[0].text : '';
  commentText = commentText.replace(/^["']|["']$/g, '').trim();
  if (Math.random() > 0.5) commentText = commentText.toLowerCase();

  await supabaseAdmin.from('blog_comments').insert({
    post_id: postId,
    persona_id: null,
    author_name: randomName,
    content: commentText,
    created_at: commentDate.toISOString(),
  });
}
