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
  'Chris', 'Emma', 'Jake', 'Priya',
];

// ── Curated ultra-short reactions — no API call ───────────────────────────────
const SHORT_BANK: Record<string, string[]> = {
  agreeing:   ['so true', 'needed this', 'this is gold', 'yep been there', 'facts', 'saving this', 'THIS', 'finally', 'preach', '100%', 'bookmarked', 'every time', 'real', 'and I oop', 'ok yes'],
  excited:    ['YESSS', 'omg yes', 'FINALLY', 'screaming', 'ok this is it', 'saying this louder for the back', 'THANK YOU', 'wait YES', 'WHERE WAS THIS'],
  relatable:  ['literally me rn', 'me @ my script rn', 'lmaooo same', "this is fine (it's not fine)", 'ugh same', 'crying', 'currently living this', 'me every tuesday', 'lol ouch'],
  humorous:   ["my villain is literally just me on a bad day", "cool so i'm doing everything wrong. cool.", 'lmao welp', 'ok but why does this describe my entire draft', "my protagonist's biggest flaw is that I wrote him"],
  frustrated: ['ugh', 'ok but WHY is this so hard', 'i hate this craft', 'rip my second act', 'WHY IS THIS SO HARD', 'ugh i needed this a year ago', 'i want a refund on my draft'],
  sarcastic:  ['wow who knew', 'groundbreaking stuff', 'thanks i am healed', 'oh wow so easy', 'noted, will do the good writing', 'revolutionary advice', "oh cool another thing i'm doing wrong"],
  curious:    ['wait what', 'explain more', 'never thought of that', 'ok but how', 'hmm interesting', 'wait is that why', 'following for the comments'],
  negative:   ['meh', 'nah disagree', 'idk about this', 'not convinced', 'miss for me', 'easier said than done', 'disagree with basically all of this', "this doesn't apply to tv at all", 'cool story'],
};

type EmotionType = 'agreeing' | 'excited' | 'relatable' | 'humorous' | 'frustrated' | 'sarcastic' | 'curious' | 'negative' | 'helping' | 'grateful';
type TierType = 'ultra-short' | 'short' | 'medium' | 'long' | 'negative';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 40% ultra-short | 25% short | 20% medium | 10% long | 5% negative
function pickTier(): TierType {
  const r = Math.random();
  if (r < 0.40) return 'ultra-short';
  if (r < 0.65) return 'short';
  if (r < 0.85) return 'medium';
  if (r < 0.95) return 'long';
  return 'negative';
}

function pickEmotion(tier: TierType): EmotionType {
  if (tier === 'negative') return 'negative';
  if (tier === 'long') return Math.random() < 0.65 ? 'helping' : pickRandom(['agreeing', 'grateful', 'frustrated', 'excited'] as EmotionType[]);
  return pickRandom(['agreeing', 'excited', 'relatable', 'humorous', 'frustrated', 'sarcastic', 'curious'] as EmotionType[]);
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
  agreeing:   "Agree or validate something specific from the article. Genuine, not sycophantic. Example: 'yep this is exactly where my pilot fell apart'.",
  excited:    "React with genuine excitement or relief. CAPS ok. Like you've been waiting for someone to say this. Example: 'FINALLY someone talks about this without the Save the Cat stuff'.",
  relatable:  "Self-deprecating or relatable humor. Reference your own script situation. Example: 'me reading this while my pilot has been on page 30 for six months lol'.",
  humorous:   "Light humor about yourself or the craft. A real joke. Example: 'my protagonist's biggest flaw is that I wrote him, this article confirmed it'.",
  frustrated: "Express frustration — at yourself, at the craft, at learning this too late. Example: 'ugh I rewrote act two nine times last month and THIS is why'.",
  sarcastic:  "Gently sarcastic or deadpan. Example: 'oh cool, just write better dialogue. noted.'",
  curious:    "Ask a specific follow-up question or express curiosity about something concrete in the article.",
  negative:   "Be mildly dismissive, critical, or disagree with something specific. Civil but unimpressed. Example: 'this doesn't really apply to limited series writing at all'.",
  helping:    "Share a concrete technique, mini story, or resource that helped you deal with the exact issue in the article. Be specific — name a method, reference a script, or give a step. This is a comment someone bookmarks.",
  grateful:   "Express specific gratitude — reference exactly what you tried or applied from the article and what happened. Not 'great post', something like 'ok I literally just applied this to my cold open and it works, wtf'.",
};

const PERSONALITY_HINTS: Record<string, string> = {
  casual:    'Lowercase fine, informal, short is natural.',
  formal:    'Measured and thoughtful even when frustrated.',
  technical: 'Craft-focused, may reference specific films or screenwriting terms.',
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
  prevCommenters: string[] = [],
): string {
  let lengthInstr: string;
  if (tier === 'short')    lengthInstr = '1-2 sentences max. Direct and punchy. No filler.';
  else if (tier === 'medium')   lengthInstr = '2-4 sentences. Share an experience, give a tip, ask a real question, or genuinely engage with the article.';
  else if (tier === 'long')     lengthInstr = '4-6 sentences. Be genuinely useful — share a specific technique you use, a mini story about your own script, recommend a resource (book, video, method), or answer a question other writers might have. Make it worth reading and bookmarking.';
  else /* negative */           lengthInstr = '1-2 sentences. Dismiss or disagree with something specific. Civil but unimpressed.';

  let referenceClause = '';
  if (prevCommenters.length >= 2 && Math.random() < 0.30) {
    const ref = pickRandom(prevCommenters);
    referenceClause = `\nIf it feels natural, reference ${ref} — e.g. "building on what ${ref} said..." or "disagree with ${ref} though". Skip it if it doesn't fit.`;
  }

  return `You are ${personaName}, leaving a comment on a screenwriting blog post.

Post: "${postTitle}"

Length: ${lengthInstr}
Tone: ${EMOTION_INSTRUCTIONS[emotion]}
Your personality: ${personalityHint}${referenceClause}

RULES — non-negotiable:
- NEVER use: "great insights", "thanks for sharing", "well written", "love this", "fantastic", "valuable", "delve", "crucial"
- No AI-sounding phrases. Sound like a real person typing quickly.
- Fragments and informal punctuation are fine.
- Write ONLY the comment. No quotes around it, no prefix like "Comment:".

Article excerpt:
${postContent.substring(0, 600)}`;
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

  const numComments = Math.floor(Math.random() * 4) + 3; // 3–6
  const selected = [...personas].sort(() => Math.random() - 0.5).slice(0, numComments);
  const prevCommenters: string[] = [];

  for (let i = 0; i < selected.length; i++) {
    const persona = selected[i] as AIPersona;
    const tier = pickTier();
    const emotion = pickEmotion(tier);
    const personalityHint = PERSONALITY_HINTS[persona.personality] ?? 'Conversational.';

    const minH = 4 + i * 5;
    const delayHours = minH + Math.random() * Math.max(96 - minH, 8);
    const commentDate = new Date(baseDate.getTime() + delayHours * 3_600_000);

    let commentText: string;

    if (tier === 'ultra-short') {
      commentText = pickRandom(SHORT_BANK[emotion] ?? SHORT_BANK.agreeing);
    } else if (tier === 'negative' && Math.random() < 0.5) {
      commentText = pickRandom(SHORT_BANK.negative);
    } else {
      const model = tier === 'long' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
      const maxTokens = tier === 'long' ? 380 : tier === 'medium' ? 180 : 120;
      const prompt = buildApiPrompt(persona.name, postTitle, postContent, tier, emotion, personalityHint, prevCommenters);

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

    prevCommenters.push(persona.name);
  }

  // 55% chance of a random-name commenter
  if (Math.random() < 0.55) {
    await generateRandomizerComment(postId, postTitle, postContent, baseDate, prevCommenters);
  }

  console.log(`Generated comments for: ${postTitle}`);
}

async function generateRandomizerComment(
  postId: string,
  postTitle: string,
  postContent: string,
  postDate: Date,
  prevCommenters: string[] = [],
): Promise<void> {
  const name = pickRandom(RANDOM_NAMES);
  const delay = (20 + Math.random() * 130) * 3_600_000;
  const commentDate = new Date(postDate.getTime() + delay);
  const tier = pickTier();
  const emotion = pickEmotion(tier);

  let text: string;

  if (tier === 'ultra-short') {
    text = pickRandom(SHORT_BANK[emotion] ?? SHORT_BANK.agreeing);
  } else if (tier === 'negative' && Math.random() < 0.5) {
    text = pickRandom(SHORT_BANK.negative);
  } else {
    const safeTier = tier === 'long' ? 'medium' : tier;
    const prompt = buildApiPrompt(name, postTitle, postContent, safeTier, emotion, 'Casual internet commenter, not a professional screenwriter.', prevCommenters);
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
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
