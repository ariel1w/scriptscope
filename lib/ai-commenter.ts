import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from './supabase';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  'Mike', 'Lisa', 'John', 'Amy', 'Steve', 'Rachel', 'Tom', 'Nina',
  'Brad', 'Kelly', 'Dan', 'Sophie', 'Mark', 'Jess', 'Ryan', 'Maya',
];

// ── Curated tiny reactions — no API call, pick straight from these ────────────
const TINY_BANK: Record<string, string[]> = {
  agreeing:   ['so true', 'needed this', 'this is gold', 'yep been there', 'facts', 'saving this', 'THIS', 'finally', 'preach', '100%', 'and I oop'],
  excited:    ['YESSS', 'omg yes', 'FINALLY', 'screaming', 'ok this is it', 'saying this louder for the back', 'THANK YOU'],
  relatable:  ['literally me rn', 'me @ my script rn', 'lmaooo same', "this is fine (it's not fine)", 'ugh same', 'crying', 'currently living this'],
  humorous:   ['my villain is literally just me on a bad day', "cool so i'm doing everything wrong. cool.", 'lmao welp', 'ok but why does this describe my entire draft'],
  frustrated: ['ugh', 'ok but WHY is this so hard', 'i hate this craft', 'rip my second act', 'WHY IS THIS SO HARD', 'ugh i needed this a year ago', 'i want a refund on my draft'],
  sarcastic:  ['wow who knew', 'groundbreaking stuff', 'thanks i am healed', 'oh wow so easy', 'noted, will do the good writing', 'revolutionary advice'],
  curious:    ['wait what', 'explain more', 'never thought of that', 'ok but how', 'hmm interesting', 'wait is that why'],
  negative:   ['meh', 'nah disagree', 'idk about this', 'not convinced', 'miss for me', 'hard pass', "disagree with basically all of this", "this doesn't apply to tv at all", 'cool story', 'whatever'],
};

type EmotionType = keyof typeof TINY_BANK;
type TierType = 'tiny' | 'short' | 'long';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 60% tiny, 25% short, 15% long
function pickTier(): TierType {
  const r = Math.random();
  if (r < 0.60) return 'tiny';
  if (r < 0.85) return 'short';
  return 'long';
}

// 10% of all comments are negative/dismissive
function pickEmotion(forceNegative: boolean): EmotionType {
  if (forceNegative) return 'negative';
  return pickRandom(['agreeing', 'excited', 'relatable', 'humorous', 'frustrated', 'sarcastic', 'curious']);
}

function applyWritingStyle(text: string, style: AIPersona['writing_style']): string {
  let result = text;
  if (style.lowercase) {
    result = result.toLowerCase();
    result = result.replace(/\bi\b/g, () => (Math.random() > 0.3 ? 'i' : 'I'));
  }
  if (style.mistakes && Math.random() > 0.7) {
    const typos: Record<string, string> = { the: 'teh', really: 'realy', definitely: 'definately' };
    Object.entries(typos).forEach(([c, t]) => {
      if (Math.random() > 0.8) result = result.replace(new RegExp(`\\b${c}\\b`, 'i'), t);
    });
  }
  return result;
}

const EMOTION_INSTRUCTIONS: Record<EmotionType, string> = {
  agreeing:   "Agree or validate something specific. Genuine, not sycophantic. Example: 'yep this is exactly where my pilot fell apart'.",
  excited:    "React with genuine excitement or relief — like you've been waiting for this. CAPS ok. Example: 'FINALLY someone addresses act two pacing without the Save the Cat stuff'.",
  relatable:  "Self-deprecating or relatable humor. Reference your own script situation. Example: 'me reading this while my pilot has been in final draft for 6 months lol'.",
  humorous:   "Light humor about yourself or the craft. A joke. Example: 'my antagonist is literally just me on a bad day, this article confirmed it'.",
  frustrated: "Express mild frustration — at yourself, at the craft, at learning this too late. Example: 'ugh I rewrote act two nine times last month and THIS is why'.",
  sarcastic:  "Gently sarcastic or deadpan. Example: 'wow groundbreaking, just write better dialogue. noted.'",
  curious:    "Ask a specific follow-up question or express curiosity about something in the article.",
  negative:   "Be mildly dismissive, critical, or disagree. Could be 'disagree with most of this', or point out a flaw. Keep it civil — just unimpressed or unconvinced.",
};

const PERSONALITY_HINTS: Record<string, string> = {
  casual:    'Lowercase fine, informal, short is natural.',
  formal:    'Measured and thoughtful even when frustrated.',
  technical: 'Craft-focused, may reference specific films or terms.',
  balanced:  'Mix of personal anecdote and craft observation.',
  friendly:  'Warm, relatable, sometimes asks questions.',
  skeptical: 'Tends to push back or question assumptions.',
};

function buildApiPrompt(
  personaName: string,
  postTitle: string,
  postContent: string,
  tier: TierType,
  emotion: EmotionType,
  personalityHint: string,
): string {
  const lengthInstr = tier === 'short'
    ? '1-2 sentences max. Direct and punchy.'
    : '3-5 sentences. More detailed but still conversational.';

  return `You are ${personaName}, leaving a comment on a screenwriting blog post.

Post: "${postTitle}"

Length: ${lengthInstr}
Tone: ${EMOTION_INSTRUCTIONS[emotion]}
Your personality: ${personalityHint}

RULES — non-negotiable:
- NEVER use: "great insights", "thanks for sharing", "well written", "love this", "fantastic", "valuable"
- No AI-sounding phrases. Sound like a real person typing quickly.
- Fragments and informal punctuation are fine.
- Write ONLY the comment. No quotes around it, no prefix like "Comment:".

Article excerpt:
${postContent.substring(0, 500)}`;
}

// postDate: the post's publish date — comments stagger forward from here
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

  if (!personas?.length) return;

  const numComments = Math.floor(Math.random() * 3) + 2; // 2–4
  const selected = [...personas].sort(() => Math.random() - 0.5).slice(0, numComments);

  for (let i = 0; i < selected.length; i++) {
    const persona = selected[i] as AIPersona;
    const isNegative = Math.random() < 0.10;
    const tier = pickTier();
    const emotion = pickEmotion(isNegative);
    const personalityHint = PERSONALITY_HINTS[persona.personality] ?? 'Conversational.';

    // Stagger 6h–4 days from post date, each persona slightly later
    const minH = 6 + i * 8;
    const delayHours = minH + Math.random() * Math.max(96 - minH, 12);
    const commentDate = new Date(baseDate.getTime() + delayHours * 3_600_000);

    let commentText: string;

    if (tier === 'tiny') {
      commentText = pickRandom(TINY_BANK[emotion] ?? TINY_BANK.agreeing);
    } else {
      const model = tier === 'long' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
      const maxTokens = tier === 'long' ? 280 : 100;
      const prompt = buildApiPrompt(persona.name, postTitle, postContent, tier, emotion, personalityHint);

      const msg = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });
      commentText = msg.content[0].type === 'text' ? msg.content[0].text : 'so true';
      commentText = commentText.replace(/^["']|["']$/g, '').trim();
    }

    commentText = applyWritingStyle(commentText, persona.writing_style);

    await supabaseAdmin.from('blog_comments').insert({
      post_id: postId,
      persona_id: persona.id,
      author_name: persona.name,
      content: commentText,
      created_at: commentDate.toISOString(),
    });
  }

  // 40% chance of randomizer comment
  if (Math.random() > 0.6) {
    await generateRandomizerComment(postId, postTitle, postContent, baseDate);
  }

  console.log(`Generated ${numComments} comments for: ${postTitle}`);
}

async function generateRandomizerComment(
  postId: string,
  postTitle: string,
  postContent: string,
  postDate: Date,
): Promise<void> {
  const name = pickRandom(RANDOM_NAMES);
  const delay = (24 + Math.random() * 120) * 3_600_000;
  const commentDate = new Date(postDate.getTime() + delay);
  const isNegative = Math.random() < 0.10;
  const tier = pickTier();
  const emotion = pickEmotion(isNegative);

  let text: string;

  if (tier === 'tiny') {
    text = pickRandom(TINY_BANK[emotion] ?? TINY_BANK.agreeing);
  } else {
    const prompt = buildApiPrompt(name, postTitle, postContent, tier, emotion, 'Casual internet commenter, not a professional screenwriter.');
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });
    text = msg.content[0].type === 'text' ? msg.content[0].text : 'interesting';
    text = text.replace(/^["']|["']$/g, '').trim();
  }

  if (Math.random() > 0.5) text = text.toLowerCase();

  await supabaseAdmin.from('blog_comments').insert({
    post_id: postId,
    persona_id: null,
    author_name: name,
    content: text,
    created_at: commentDate.toISOString(),
  });
}
