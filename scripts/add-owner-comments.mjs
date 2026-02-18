/**
 * Generate owner (host) responses to specific community questions.
 * The owner chimes in on ~5 posts, answering real questions from commenters.
 * Run: node scripts/add-owner-comments.mjs
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

// Get owner user_id dynamically
const { data: { users } } = await supabase.auth.admin.listUsers();
const owner = users?.find(u => u.email === (env.OWNER_EMAIL || 'ariel1w@gmail.com'));
if (!owner) { console.error('Owner user not found'); process.exit(1); }
const OWNER_USER_ID = owner.id;
const OWNER_NAME = 'Ariel W.';
console.log(`Owner: ${OWNER_NAME} (${owner.email}) — id: ${OWNER_USER_ID}\n`);

// Fetch posts
const { data: posts } = await supabase
  .from('content_queue')
  .select('id, title, content, slug, posted_at')
  .eq('platform', 'blog').eq('status', 'posted')
  .order('posted_at', { ascending: true });

const bySlug = {};
for (const p of posts) bySlug[p.slug] = p;
const byTitle = {};
for (const p of posts) byTitle[p.title.substring(0, 40)] = p;

// Helper: find post by partial title match
function findPost(partial) {
  return posts.find(p => p.title.toLowerCase().includes(partial.toLowerCase()));
}

// Helper: generate owner response
async function ownerResponse(postTitle, postContent, question, questionerName, context) {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 320,
    messages: [{
      role: 'user',
      content: `You are Ariel W., an Emmy-winning TV producer who created ScriptScope, a screenplay analysis tool. You occasionally jump into the comments on your own blog to answer specific questions from writers.

Post title: "${postTitle}"

${questionerName} asked: "${question}"

Context about your voice:
- You've read thousands of scripts professionally. You give the kind of note a development exec gives, not a writing teacher.
- Direct and specific. No "great question!" No flattery. Just answer the thing.
- Warm but efficient. You respect writers enough not to hedge.
- Use a real example when it sharpens the answer — a specific film, scene, or technique.
- 3-5 sentences. Not a lecture, just the thing they need to know.
- Sound like a person typing a reply, not writing an essay.
${context ? `\nAdditional context: ${context}` : ''}

Article excerpt:
${postContent.substring(0, 400)}

Write ONLY the comment reply. No quotes around it, no prefix.`,
    }],
  });
  return msg.content[0].type === 'text' ? msg.content[0].text.replace(/^["']|["']$/g, '').trim() : '';
}

async function insertOwnerComment(postId, text, timestamp) {
  const { error } = await supabase.from('blog_comments').insert({
    post_id: postId,
    user_id: OWNER_USER_ID,
    persona_id: null,
    author_name: OWNER_NAME,
    content: text,
    created_at: timestamp,
  });
  if (error) console.error('  Insert error:', error.message);
  else console.log('  ✓ Inserted');
}

// ── Responses ─────────────────────────────────────────────────────────────────

const responses = [
  {
    postSlug: 'how-to-write-memorable-opening-scenes-that-hook-readers-instantly',
    questionerName: 'Robert',
    question: 'when you say start in the middle of something, does that apply to quieter character pieces too, or is that more of a thriller/action rule?',
    context: 'The answer should reassure him it applies to all genres — but clarify that for quieter pieces, "in the middle of something" means emotional momentum, not physical action. A character mid-decision, mid-grief, mid-realization is just as arresting as a car chase if it\'s specific.',
    // 2 days after Robert's Jan 28 comment
    timestamp: '2026-01-30T11:23:00',
  },
  {
    postSlug: 'subtext-in-dialogue-examples-from-real-screenplays-that-actually-work',
    questionerName: 'Emma',
    question: 'Do you have thoughts on how much subtext is too much? I feel like there\'s a line where it gets so buried the audience just gets confused instead of intrigued.',
    context: 'The practical test: the surface scene should work even if the viewer misses the subtext entirely. If the literal exchange makes zero sense, you\'ve gone too far. The other thing: subtext works when ONE person in the scene knows more than they\'re saying. When BOTH characters are simultaneously obscuring their meaning and the audience has no handhold, it just reads as bad writing.',
    // 2 days after Emma's Feb 4 comment
    timestamp: '2026-02-06T09:45:00',
  },
  {
    postSlug: 'writing-compelling-antagonists-how-to-make-your-villain-unforgettable',
    questionerName: 'David',
    question: 'if your villain\'s motivation is rooted in legitimate trauma or a value system that directly opposes your protagonist\'s, does that automatically give them coherence, or is there a way to mess that up?',
    context: 'Trauma is a starting point, not a destination. You can mess it up by showing the wound without showing what the character concluded from it. The villain needs to have drawn specific, warped conclusions from their trauma — conclusions that are internally logical even if morally wrong. "My father abandoned me" → flat. "My father abandoned me, which proved that loyalty is a transaction and anyone who disagrees is naive" → now you have a worldview that generates behavior.',
    // 2 days after David's Feb 8 comment
    timestamp: '2026-02-10T14:12:00',
  },
  {
    postSlug: 'how-to-avoid-cliche-character-types-in-your-screenplay-and-write-people-who-actually-feel-real',
    questionerName: 'David',
    question: 'just realized my mentor character literally dies right before the third act and now I\'m paranoid he\'s a placeholder in a costume.',
    context: 'Give a direct, slightly funny answer: if he only exists to die, he probably is one. The quick fix is to give him something he wants for himself that has NOTHING to do with the protagonist — even if it\'s just one scene. A mentor with his own unresolved longing becomes a person; a mentor who only exists to mentor and then die is a function, not a character.',
    // 1 day after David's Feb 16 comment
    timestamp: '2026-02-17T10:35:00',
  },
  {
    postSlug: 'protagonist-not-driving-story-reactive-vs-proactive',
    questionerName: 'Chris',
    question: 'Wait—are you saying a character actively pursuing a bad goal they don\'t understand is still "reactive"? Or does agency require they actually *know* what they\'re after?',
    context: 'No — pursuing the wrong goal is NOT reactive, it\'s often the best kind of agency. Think Walter White, Fletcher in Whiplash. Reactive means the PLOT moves first and the character responds. Agency means the CHARACTER moves and the plot responds. Pursuing a misguided goal with full commitment is arguably the most compelling form of agency — the gap between what they think they want and what they actually need IS the story.',
    // ~4 hours after Chris's Feb 18 comment (same day, later)
    timestamp: '2026-02-18T13:40:00',
  },
];

console.log(`Generating ${responses.length} owner responses...\n`);

for (const r of responses) {
  const post = posts.find(p => p.slug === r.postSlug);
  if (!post) { console.log(`  ✗ Post not found: ${r.postSlug}`); continue; }

  console.log(`[${r.questionerName}] "${post.title.substring(0, 55)}..."`);
  try {
    const text = await ownerResponse(post.title, post.content, r.question, r.questionerName, r.context);
    console.log(`  → ${text.substring(0, 80)}...`);
    await insertOwnerComment(post.id, text, r.timestamp);
    await sleep(800);
  } catch (err) {
    console.error('  ✗ Error:', err.message);
  }
  console.log();
}

console.log('=== Done ===');
console.log(`Owner user_id: ${OWNER_USER_ID}`);
console.log(`Add to .env.local and Vercel: OWNER_USER_ID=${OWNER_USER_ID}`);
