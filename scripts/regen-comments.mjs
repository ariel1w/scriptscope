/**
 * Delete all existing blog comments and regenerate with new rules:
 * - 40% ultra-short reactions (curated bank, no API)
 * - 25% short (1-2 sentences, Haiku)
 * - 20% medium (2-4 sentences, Haiku)
 * - 10% high-quality long (Sonnet, writer-helping-writer)
 * -  5% negative/dismissive (bank or Haiku)
 * - 30% of later comments on a post reference an earlier commenter by name
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Curated ultra-short bank ──────────────────────────────────────────────────
const SHORT_BANK = {
  agreeing:   ["so true", "needed this", "this is gold", "yep been there", "facts", "saving this", "THIS", "finally", "preach", "100%", "bookmarked", "every time", "real", "and I oop", "ok yes"],
  excited:    ["YESSS", "omg yes", "FINALLY", "screaming", "ok this is it", "saying this louder for the back", "THANK YOU", "wait YES", "WHERE WAS THIS"],
  relatable:  ["literally me rn", "me @ my script rn", "lmaooo same", "this is fine (it's not fine)", "ugh same", "crying", "currently living this", "me every tuesday", "lol ouch"],
  humorous:   ["my villain is literally just me on a bad day", "cool so i'm doing everything wrong. cool.", "lmao welp", "ok but why does this describe my entire draft", "my protagonist's biggest flaw is that I wrote him"],
  frustrated: ["ugh", "ok but WHY is this so hard", "i hate this craft", "rip my second act", "WHY IS THIS SO HARD", "ugh i needed this a year ago", "i want a refund on my draft"],
  sarcastic:  ["wow who knew", "groundbreaking stuff", "thanks i am healed", "oh wow so easy", "noted, will do the good writing", "revolutionary advice", "oh cool another thing i'm doing wrong"],
  curious:    ["wait what", "explain more", "never thought of that", "ok but how", "hmm interesting", "wait is that why", "following for the comments"],
  negative:   ["meh", "nah disagree", "idk about this", "not convinced", "miss for me", "easier said than done", "disagree with basically all of this", "this doesn't apply to tv at all", "cool story"],
};

const EMOTION_INSTRUCTIONS = {
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

const PERSONALITY_HINTS = {
  casual:    'Lowercase fine, informal, short is natural.',
  formal:    'Measured and thoughtful even when frustrated.',
  technical: 'Craft-focused, may reference specific films or screenwriting terms.',
  balanced:  'Mix of personal anecdote and craft observation.',
  friendly:  'Warm, relatable, sometimes asks questions.',
  skeptical: 'Tends to push back or question assumptions.',
};

const RANDOM_NAMES = ['Mike','Lisa','John','Amy','Steve','Rachel','Tom','Nina','Brad','Kelly','Dan','Sophie','Mark','Jess','Ryan','Maya','Chris','Emma','Jake','Priya'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function pickTier() {
  const r = Math.random();
  if (r < 0.40) return 'ultra-short';  // 40% — curated bank, no API
  if (r < 0.65) return 'short';        // 25% — 1-2 sentences, Haiku
  if (r < 0.85) return 'medium';       // 20% — 2-4 sentences, Haiku
  if (r < 0.95) return 'long';         // 10% — 4-6 sentences, Sonnet
  return 'negative';                    //  5% — dismissive
}

function pickEmotion(tier) {
  if (tier === 'negative') return 'negative';
  if (tier === 'long') return Math.random() < 0.65 ? 'helping' : pick(['agreeing', 'grateful', 'frustrated', 'excited']);
  return pick(['agreeing', 'excited', 'relatable', 'humorous', 'frustrated', 'sarcastic', 'curious']);
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

function buildPrompt(personaName, postTitle, postContent, tier, emotion, personalityHint, prevCommenters) {
  let lengthInstr;
  if (tier === 'short')    lengthInstr = '1-2 sentences max. Direct and punchy. No filler.';
  else if (tier === 'medium')   lengthInstr = '2-4 sentences. Share an experience, give a tip, ask a real question, or genuinely engage with the article.';
  else if (tier === 'long')     lengthInstr = '4-6 sentences. Be genuinely useful — share a specific technique you use, a mini story about your own script, recommend a resource (book, video, method), or answer a question other writers might have. Make it worth reading and bookmarking.';
  else /* negative */           lengthInstr = '1-2 sentences. Dismiss or disagree with something specific. Civil but unimpressed.';

  let referenceClause = '';
  if (prevCommenters.length >= 2 && Math.random() < 0.30) {
    const ref = pick(prevCommenters);
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
- Write ONLY the comment. No quotes, no "Comment:" prefix.

Article excerpt:
${postContent.substring(0, 600)}`;
}

async function callApi(model, maxTokens, prompt) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const msg = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });
      let text = msg.content[0].type === 'text' ? msg.content[0].text : 'so true';
      return text.replace(/^["']|["']$/g, '').trim();
    } catch (err) {
      const isOverload = err.status === 529 || String(err.message).includes('overload');
      if (isOverload && attempt < 4) {
        const wait = (attempt + 1) * 10000;
        process.stdout.write(`    [overloaded — retry ${attempt + 1}/4, waiting ${wait / 1000}s]\n`);
        await sleep(wait);
      } else {
        throw err;
      }
    }
  }
}

async function genComments(postId, postTitle, postContent, postDate, personas) {
  const numPersonas = Math.floor(Math.random() * 4) + 3; // 3-6
  const selected = [...personas].sort(() => Math.random() - 0.5).slice(0, numPersonas);
  const prevCommenters = [];
  let total = 0;

  for (let i = 0; i < selected.length; i++) {
    const persona = selected[i];
    const tier = pickTier();
    const emotion = pickEmotion(tier);
    const personalityHint = PERSONALITY_HINTS[persona.personality] ?? 'Conversational.';

    const minH = 4 + i * 5;
    const delay = (minH + Math.random() * Math.max(96 - minH, 8)) * 3_600_000;
    const commentDate = new Date(postDate.getTime() + delay);

    let text;
    if (tier === 'ultra-short') {
      text = pick(SHORT_BANK[emotion] ?? SHORT_BANK.agreeing);
    } else if (tier === 'negative' && Math.random() < 0.5) {
      text = pick(SHORT_BANK.negative);
    } else {
      const model = tier === 'long' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
      const maxTokens = tier === 'long' ? 380 : tier === 'medium' ? 180 : 120;
      const prompt = buildPrompt(persona.name, postTitle, postContent, tier, emotion, personalityHint, prevCommenters);
      text = await callApi(model, maxTokens, prompt);
    }

    text = applyStyle(text, persona.writing_style);

    await supabase.from('blog_comments').insert({
      post_id: postId,
      persona_id: persona.id,
      author_name: persona.name,
      content: text,
      created_at: commentDate.toISOString(),
    });

    prevCommenters.push(persona.name);
    total++;

    if (tier !== 'ultra-short') await sleep(500);
  }

  // 55% chance of random-name commenter
  if (Math.random() < 0.55) {
    const name = pick(RANDOM_NAMES);
    const delay = (20 + Math.random() * 130) * 3_600_000;
    const commentDate = new Date(postDate.getTime() + delay);
    const tier = pickTier();
    const emotion = pickEmotion(tier);

    let text;
    if (tier === 'ultra-short') {
      text = pick(SHORT_BANK[emotion] ?? SHORT_BANK.agreeing);
    } else if (tier === 'negative' && Math.random() < 0.5) {
      text = pick(SHORT_BANK.negative);
    } else {
      const safeTier = tier === 'long' ? 'medium' : tier;
      const prompt = buildPrompt(name, postTitle, postContent, safeTier, emotion, 'Casual internet commenter, not a professional screenwriter.', prevCommenters);
      text = await callApi('claude-haiku-4-5-20251001', 150, prompt);
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

  console.log(`  ✓ ${total} comments`);
  return total;
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('\n=== Regenerating all blog comments (5-tier system) ===\n');

const { data: posts } = await supabase
  .from('content_queue')
  .select('id, title, content, posted_at')
  .eq('platform', 'blog')
  .eq('status', 'posted')
  .order('posted_at', { ascending: true });

if (!posts?.length) { console.log('No posts found.'); process.exit(0); }
console.log(`Found ${posts.length} posts.\n`);

const { data: personas } = await supabase
  .from('ai_personas')
  .select('*')
  .eq('is_randomizer', false);

if (!personas?.length) { console.error('No AI personas found. Run the migration first.'); process.exit(1); }
console.log(`Using ${personas.length} AI personas.\n`);

const { error: delErr } = await supabase
  .from('blog_comments')
  .delete()
  .in('post_id', posts.map(p => p.id));
if (delErr) console.error('Delete error:', delErr.message);
else console.log('Deleted all existing comments.\n');

let grandTotal = 0;
for (let i = 0; i < posts.length; i++) {
  const post = posts[i];
  const postDate = post.posted_at ? new Date(post.posted_at) : new Date();
  console.log(`[${i + 1}/${posts.length}] "${post.title.substring(0, 60)}"`);
  console.log(`  Published: ${postDate.toDateString()}`);
  try {
    const n = await genComments(post.id, post.title, post.content, postDate, personas);
    grandTotal += n;
  } catch (err) {
    console.error('  ✗ Error:', err.message);
  }
  if (i < posts.length - 1) {
    process.stdout.write('  Pausing 2s...\n\n');
    await sleep(2000);
  }
}

console.log(`\n=== Done! ${grandTotal} total comments across ${posts.length} posts ===\n`);
