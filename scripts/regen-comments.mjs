/**
 * Delete all existing blog comments and regenerate with new rules:
 * - 60% tiny (2-5 words, from curated bank)
 * - 25% short (1-2 sentences, Haiku)
 * - 15% long (3-5 sentences, Sonnet)
 * - 10% of all comments are negative/dismissive
 * - Full emotion range: excited, frustrated, self-deprecating, humorous, sarcastic, negative
 * Run: node scripts/regen-comments.mjs
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

// ── Curated tiny reactions ────────────────────────────────────────────────────
const TINY_BANK = {
  agreeing:   ['so true', 'needed this', 'this is gold', 'yep been there', 'facts', 'saving this', 'THIS', 'finally', 'preach', '100%', 'and I oop'],
  excited:    ['YESSS', 'omg yes', 'FINALLY', 'screaming', 'ok this is it', 'saying this louder for the back', 'THANK YOU'],
  relatable:  ['literally me rn', 'me @ my script rn', 'lmaooo same', "this is fine (it's not fine)", 'ugh same', 'crying', 'currently living this'],
  humorous:   ['my villain is literally just me on a bad day', "cool so i'm doing everything wrong. cool.", 'lmao welp', 'ok but why does this describe my entire draft'],
  frustrated: ['ugh', 'ok but WHY is this so hard', 'i hate this craft', 'rip my second act', 'WHY IS THIS SO HARD', 'ugh i needed this a year ago', 'i want a refund on my draft'],
  sarcastic:  ['wow who knew', 'groundbreaking stuff', 'thanks i am healed', 'oh wow so easy', 'noted, will do the good writing', 'revolutionary advice'],
  curious:    ['wait what', 'explain more', 'never thought of that', 'ok but how', 'hmm interesting', 'wait is that why'],
  negative:   ['meh', 'nah disagree', 'idk about this', 'not convinced', 'miss for me', 'hard pass', "disagree with basically all of this", "this doesn't apply to tv at all", 'cool story', 'whatever'],
};

const EMOTION_INSTRUCTIONS = {
  agreeing:   "Agree or validate something specific. Genuine, not sycophantic.",
  excited:    "React with genuine excitement or relief — like you've been waiting for this. CAPS ok. Example: 'FINALLY someone addresses this without the three-act lecture'.",
  relatable:  "Self-deprecating or relatable humor. Reference your own script situation. Example: 'me reading this while my pilot has been in final draft for 6 months lol'.",
  humorous:   "Light humor about yourself or the craft. Example: 'my antagonist is literally just me on a bad day, this article confirmed it'.",
  frustrated: "Express mild frustration — at yourself, at the craft, at learning this too late. Example: 'ugh I rewrote act two nine times last month and THIS is why'.",
  sarcastic:  "Gently sarcastic or deadpan. Example: 'wow groundbreaking, just write better dialogue. noted.'",
  curious:    "Ask a specific follow-up question or express curiosity about something in the article.",
  negative:   "Be mildly dismissive, critical, or disagree. Could be 'disagree with most of this', or point out a flaw. Civil but unimpressed.",
};

const PERSONALITY_HINTS = {
  casual:    'Lowercase fine, informal, short is natural.',
  formal:    'Measured and thoughtful even when frustrated.',
  technical: 'Craft-focused, may reference specific films or terms.',
  balanced:  'Mix of personal anecdote and craft observation.',
  friendly:  'Warm, relatable, sometimes asks questions.',
  skeptical: 'Tends to push back or question assumptions.',
};

const RANDOM_NAMES = ['Mike','Lisa','John','Amy','Steve','Rachel','Tom','Nina','Brad','Kelly','Dan','Sophie','Mark','Jess','Ryan','Maya'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickTier() {
  const r = Math.random();
  if (r < 0.60) return 'tiny';
  if (r < 0.85) return 'short';
  return 'long';
}
function pickEmotion(forceNeg) {
  if (forceNeg) return 'negative';
  return pick(['agreeing','excited','relatable','humorous','frustrated','sarcastic','curious']);
}
function applyStyle(text, style) {
  let r = text;
  if (style?.lowercase) {
    r = r.toLowerCase();
    r = r.replace(/\bi\b/g, () => (Math.random() > 0.3 ? 'i' : 'I'));
  }
  if (style?.mistakes && Math.random() > 0.7) {
    const typos = { the: 'teh', really: 'realy', definitely: 'definately' };
    for (const [c, t] of Object.entries(typos)) {
      if (Math.random() > 0.8) r = r.replace(new RegExp(`\\b${c}\\b`, 'i'), t);
    }
  }
  return r;
}

async function callApi(model, maxTokens, personaName, postTitle, postContent, tier, emotion, personalityHint) {
  const lengthInstr = tier === 'short'
    ? '1-2 sentences max. Direct and punchy.'
    : '3-5 sentences. Detailed but conversational.';

  const msg = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{
      role: 'user',
      content: `You are ${personaName}, leaving a comment on a screenwriting blog post.

Post: "${postTitle}"

Length: ${lengthInstr}
Tone: ${EMOTION_INSTRUCTIONS[emotion]}
Your personality: ${personalityHint}

RULES:
- NEVER use: "great insights", "thanks for sharing", "well written", "love this", "fantastic"
- No AI-sounding phrases. Sound like a real person typing quickly.
- Fragments and informal punctuation are fine.
- Write ONLY the comment. No quotes, no prefix.

Article excerpt:
${postContent.substring(0, 500)}`,
    }],
  });
  let text = msg.content[0].type === 'text' ? msg.content[0].text : 'so true';
  return text.replace(/^["']|["']$/g, '').trim();
}

async function genComments(postId, postTitle, postContent, postDate, personas) {
  const numComments = Math.floor(Math.random() * 3) + 2; // 2-4
  const selected = [...personas].sort(() => Math.random() - 0.5).slice(0, numComments);
  let total = selected.length;

  for (let i = 0; i < selected.length; i++) {
    const persona = selected[i];
    const isNeg = Math.random() < 0.10;
    const tier = pickTier();
    const emotion = pickEmotion(isNeg);
    const personalityHint = PERSONALITY_HINTS[persona.personality] ?? 'Conversational.';

    const minH = 6 + i * 8;
    const delay = (minH + Math.random() * Math.max(96 - minH, 12)) * 3_600_000;
    const commentDate = new Date(postDate.getTime() + delay);

    let text;
    if (tier === 'tiny') {
      text = pick(TINY_BANK[emotion] ?? TINY_BANK.agreeing);
    } else {
      const model = tier === 'long' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
      const maxTokens = tier === 'long' ? 280 : 100;
      text = await callApi(model, maxTokens, persona.name, postTitle, postContent, tier, emotion, personalityHint);
    }

    text = applyStyle(text, persona.writing_style);

    await supabase.from('blog_comments').insert({
      post_id: postId,
      persona_id: persona.id,
      author_name: persona.name,
      content: text,
      created_at: commentDate.toISOString(),
    });
  }

  // 40% randomizer
  if (Math.random() > 0.6) {
    const name = pick(RANDOM_NAMES);
    const delay = (24 + Math.random() * 120) * 3_600_000;
    const commentDate = new Date(postDate.getTime() + delay);
    const isNeg = Math.random() < 0.10;
    const tier = pickTier();
    const emotion = pickEmotion(isNeg);

    let text;
    if (tier === 'tiny') {
      text = pick(TINY_BANK[emotion] ?? TINY_BANK.agreeing);
    } else {
      text = await callApi('claude-haiku-4-5-20251001', 100, name, postTitle, postContent, tier, emotion, 'Casual internet commenter.');
    }
    if (Math.random() > 0.5) text = text.toLowerCase();

    await supabase.from('blog_comments').insert({
      post_id: postId,
      persona_id: null,
      author_name: name,
      content: text,
      created_at: commentDate.toISOString(),
    });
    total++;
  }

  console.log(`  ✓ ${total} comments (tier breakdown: 60% tiny / 25% short / 15% long)`);
  return total;
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('\n=== Regenerating all blog comments with new rules ===\n');

// Fetch all blog posts
const { data: posts } = await supabase
  .from('content_queue')
  .select('id, title, content, posted_at')
  .eq('platform', 'blog')
  .eq('status', 'posted')
  .order('posted_at', { ascending: true });

if (!posts?.length) { console.log('No posts found.'); process.exit(0); }
console.log(`Found ${posts.length} posts.\n`);

// Fetch personas once
const { data: personas } = await supabase
  .from('ai_personas')
  .select('*')
  .eq('is_randomizer', false);

if (!personas?.length) { console.error('No AI personas found. Run the migration first.'); process.exit(1); }
console.log(`Using ${personas.length} AI personas.\n`);

// Delete ALL existing comments
const { error: delErr } = await supabase
  .from('blog_comments')
  .delete()
  .in('post_id', posts.map(p => p.id));
if (delErr) console.error('Delete error:', delErr.message);
else console.log(`Deleted all existing comments.\n`);

// Regenerate
for (let i = 0; i < posts.length; i++) {
  const post = posts[i];
  const postDate = post.posted_at ? new Date(post.posted_at) : new Date();
  console.log(`[${i + 1}/${posts.length}] "${post.title.substring(0, 55)}..."`);
  console.log(`  Published: ${postDate.toDateString()}`);
  try {
    await genComments(post.id, post.title, post.content, postDate, personas);
  } catch (err) {
    console.error('  ✗ Error:', err.message);
  }
  if (i < posts.length - 1) {
    process.stdout.write('  Pausing 1.5s...\n\n');
    await new Promise(r => setTimeout(r, 1500));
  }
}

console.log('\n=== Done! ===\n');
