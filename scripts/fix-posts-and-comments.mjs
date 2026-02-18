/**
 * Backdates all of today's blog posts and regenerates AI persona comments.
 * Run from the project root: node scripts/fix-posts-and-comments.mjs
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// ── Load .env.local ───────────────────────────────────────────────────────────
const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Backdate targets (relative to today) ─────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9, 0, 0, 0); // published at 9am
  return d;
}

// ── Fetch all blog posts created today ───────────────────────────────────────
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const { data: posts, error: postsError } = await supabase
  .from('content_queue')
  .select('id, title, content, posted_at, slug')
  .eq('platform', 'blog')
  .eq('status', 'posted')
  .gte('posted_at', todayStart.toISOString())
  .order('posted_at', { ascending: true });

if (postsError) { console.error('Error fetching posts:', postsError); process.exit(1); }
if (!posts?.length) { console.log('No posts from today found.'); process.exit(0); }

console.log(`\nFound ${posts.length} post(s) from today. Backdating...\n`);

// Spread posts evenly over the last 3 weeks
const backdates = posts.map((_, i) => {
  const totalPosts = posts.length;
  // Space evenly between 21 days ago and 5 days ago
  const daysBack = Math.round(21 - (i * (16 / Math.max(totalPosts - 1, 1))));
  return daysAgo(Math.max(daysBack, 5));
});

// ── Writing style + persona helpers ──────────────────────────────────────────
const RANDOM_NAMES = ['Mike','Lisa','John','Amy','Steve','Rachel','Tom','Nina','Brad','Kelly','Dan','Sophie','Mark','Jess','Ryan','Maya'];

function applyStyle(text, style) {
  let result = text;
  if (style?.lowercase) {
    result = result.toLowerCase();
    result = result.replace(/\bi\b/g, () => (Math.random() > 0.3 ? 'i' : 'I'));
  }
  if (style?.mistakes && Math.random() > 0.7) {
    const typos = { the: 'teh', really: 'realy', definitely: 'definately' };
    for (const [c, t] of Object.entries(typos)) {
      if (Math.random() > 0.8) result = result.replace(new RegExp(`\\b${c}\\b`, 'i'), t);
    }
  }
  return result;
}

const personalityPrompts = {
  casual: `You're a casual working screenwriter who comments online. Keep it short (1–3 sentences). Lowercase is fine. Reference your own current script or a recent rewrite.
Tone: "been dealing with this exact issue on my pilot", "yeah this cost me a whole act on my last draft"`,

  formal: `You're an experienced screenwriter leaving a thoughtful, analytical comment. 2–4 sentences. Reference a specific point. Occasionally add nuance from your own experience.
Tone: "The subtext point holds up, though I'd argue it breaks down in procedurals.", "This is what my showrunner told me after my first staffing job."`,

  technical: `You're craft-focused. Reference specific structural elements, named screenplays, or industry terms. Precise, 3–5 sentences.
Tone: "The Blake Snyder framing is fine but the McKee gap is the more useful lens here.", "Checked my Chinatown notes after reading this."`,

  balanced: `Working screenwriter mixing personal anecdote with craft observation. 2–4 sentences.
Tone: "I'm on my third rewrite of a pilot and this hit home.", "My last feature had this exact problem in act two. Took a producer note to see it."`,

  friendly: `Encouraging, shares personal experience. 2–3 sentences. What did this change for you?
Tone: "Saved this. Working on my first feature and the opening scene has been killing me.", "How early is too early to plant the theme?"`,

  skeptical: `Fair but skeptical. Push back on one point. 2–4 sentences. Not dismissive.
Tone: "Good points, though the 'avoid flashbacks entirely' advice is too absolute.", "I'd push back on the three-act framing — most TV doesn't work that way."`,
};

// ── Generate comments for a post ─────────────────────────────────────────────
async function generateComments(postId, postTitle, postContent, postDate) {
  const { data: personas } = await supabase
    .from('ai_personas')
    .select('*')
    .eq('is_randomizer', false);

  if (!personas?.length) {
    console.error('  ✗ No AI personas found');
    return;
  }

  const numComments = Math.floor(Math.random() * 3) + 2; // 2–4
  const selected = personas.sort(() => Math.random() - 0.5).slice(0, numComments);

  for (let i = 0; i < selected.length; i++) {
    const persona = selected[i];
    const prompt = personalityPrompts[persona.personality] ?? personalityPrompts.balanced;

    // Stagger: 6h to 4 days after post, each persona a bit later
    const minHours = 6 + i * 8;
    const maxHours = 96;
    const delay = (minHours + Math.random() * (maxHours - minHours)) * 3_600_000;
    const commentDate = new Date(postDate.getTime() + delay);

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 350,
      messages: [{
        role: 'user',
        content: `You are ${persona.name}, a screenwriter leaving a comment on a blog post.

Post title: "${postTitle}"

${prompt}

Hard rules:
- NEVER say: "great insights", "thanks for sharing", "well written", "love this", "fantastic"
- Reference something SPECIFIC from the article — a technique, phrase, or example
- Mention your own script, rewrite, producer note, or film you studied
- One consistent voice. Length matches personality.

Article excerpt:
${postContent.substring(0, 700)}

Write ONLY the comment. No quotes around it.`,
      }],
    });

    let text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    text = text.replace(/^["']|["']$/g, '').trim();
    text = applyStyle(text, persona.writing_style);

    await supabase.from('blog_comments').insert({
      post_id: postId,
      persona_id: persona.id,
      author_name: persona.name,
      content: text,
      created_at: commentDate.toISOString(),
    });
  }

  // 40% chance of randomizer comment
  if (Math.random() > 0.6) {
    const name = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const delay = (24 + Math.random() * 120) * 3_600_000;
    const commentDate = new Date(postDate.getTime() + delay);
    const styles = [
      'Write exactly 1 casual sentence. Quick gut reaction.',
      'Write 2 short sentences. A specific personal experience.',
      'Write 1 sentence asking a specific question from the article.',
      'Write 2 sentences politely pushing back on one point.',
    ];

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `You are ${name}, a casual visitor on this screenwriting blog: "${postTitle}"
${styles[Math.floor(Math.random() * styles.length)]}
No generic praise. Reference something specific.
Article: ${postContent.substring(0, 350)}
Write ONLY the comment.`,
      }],
    });

    let text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    text = text.replace(/^["']|["']$/g, '').trim();
    if (Math.random() > 0.5) text = text.toLowerCase();

    await supabase.from('blog_comments').insert({
      post_id: postId,
      persona_id: null,
      author_name: name,
      content: text,
      created_at: commentDate.toISOString(),
    });

    selected.push({ name }); // for count display
  }

  console.log(`  ✓ ${selected.length} comments generated (backdated from ${postDate.toDateString()})`);
}

// ── Main loop ─────────────────────────────────────────────────────────────────
for (let i = 0; i < posts.length; i++) {
  const post = posts[i];
  const newDate = backdates[i];

  console.log(`[${i + 1}/${posts.length}] "${post.title.substring(0, 60)}..."`);
  console.log(`  Backdating to: ${newDate.toDateString()}`);

  // Update the post date
  const { error: updateError } = await supabase
    .from('content_queue')
    .update({ posted_at: newDate.toISOString() })
    .eq('id', post.id);

  if (updateError) {
    console.error('  ✗ Failed to backdate:', updateError.message);
    continue;
  }
  console.log('  ✓ Post date updated');

  // Delete any existing comments (stale future-dated ones)
  await supabase.from('blog_comments').delete().eq('post_id', post.id);
  console.log('  ✓ Old comments cleared');

  // Generate fresh comments backdated from the new post date
  console.log('  Generating AI persona comments...');
  try {
    await generateComments(post.id, post.title, post.content, newDate);
  } catch (err) {
    console.error('  ✗ Comment generation error:', err.message);
  }

  if (i < posts.length - 1) {
    process.stdout.write('  Pausing 2s...\n\n');
    await new Promise(r => setTimeout(r, 2000));
  }
}

console.log('\n=== Done! All posts backdated with fresh comments. ===\n');
