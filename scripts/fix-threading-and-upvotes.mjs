/**
 * Fix comment threading and seed upvotes from AI personas.
 *
 * Threading: Sets parent_comment_id on all Script Doctor reply comments so they
 * nest correctly under the commenter they're responding to.
 *
 * Upvotes: AI personas upvote substantive comments they would genuinely appreciate.
 *
 * Run: node scripts/fix-threading-and-upvotes.mjs
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── Load reference data ────────────────────────────────────────────────────────

const { data: posts } = await sb
  .from('content_queue')
  .select('id, slug')
  .eq('platform', 'blog')
  .eq('status', 'posted');

const postBySlug = Object.fromEntries(posts.map(p => [p.slug, p.id]));

const { data: personas } = await sb
  .from('ai_personas')
  .select('id, username');

const personaByUsername = Object.fromEntries(personas.map(p => [p.username, p.id]));

// Fetch ALL comments up front, keyed by post_id
const { data: allComments } = await sb
  .from('blog_comments')
  .select('id, post_id, author_name, content, created_at, persona_id')
  .order('created_at', { ascending: true });

function commentsForPost(postId) {
  return allComments.filter(c => c.post_id === postId);
}

// Find a specific comment: first match of author (case-insensitive prefix) + content snippet
function findComment(postId, authorPrefix, contentSnippet) {
  const comments = commentsForPost(postId);
  return comments.find(c =>
    c.author_name.toLowerCase().startsWith(authorPrefix.toLowerCase()) &&
    c.content.toLowerCase().includes(contentSnippet.toLowerCase())
  ) ?? null;
}

// Find the Script Doctor comment on a post (there's at most one per post in existing data)
function findSDComment(postId) {
  const sdId = personaByUsername['scriptdoctor'];
  return commentsForPost(postId).find(c => c.persona_id === sdId) ?? null;
}

let threadingFixed = 0;
let upvotesAdded = 0;

async function setParent(childId, parentId, label) {
  if (!childId || !parentId) { console.log(`  ✗ ${label}: comment not found`); return; }
  const { error } = await sb
    .from('blog_comments')
    .update({ parent_comment_id: parentId })
    .eq('id', childId);
  if (error) { console.error(`  ✗ ${label}: ${error.message}`); return; }
  threadingFixed++;
  console.log(`  ✓ ${label}`);
}

async function addUpvote(commentId, voterUsername, commentLabel) {
  const personaId = personaByUsername[voterUsername];
  if (!personaId || !commentId) return;
  const { error } = await sb
    .from('comment_upvotes')
    .insert({ comment_id: commentId, persona_id: personaId });
  if (error?.code === '23505') return; // already upvoted — skip silently
  if (error) { console.error(`    ✗ upvote ${voterUsername}→${commentLabel}: ${error.message}`); return; }
  upvotesAdded++;
}

// ── ① THREADING — link each Script Doctor reply to its parent ─────────────────

console.log('\n=== THREADING ===\n');

// 1. Opening Scenes: SD → Robert Thompson's coffee-grinding question
{
  const slug = 'how-to-write-memorable-opening-scenes-that-hook-readers-instantly';
  const postId = postBySlug[slug];
  const parent = findComment(postId, 'Robert', 'coffee');
  const child  = findSDComment(postId);
  await setParent(child?.id, parent?.id, 'Opening Scenes: SD → Robert');
}

// 2. Subtext: SD → Emma Wilson's "how much subtext is too much" question
{
  const slug = 'subtext-in-dialogue-examples-from-real-screenplays-that-actually-work';
  const postId = postBySlug[slug];
  const parent = findComment(postId, 'Emma', 'how much subtext is too much');
  const child  = findSDComment(postId);
  await setParent(child?.id, parent?.id, 'Subtext: SD → Emma');
}

// 3. Antagonists: SD → David Park's villain-trauma coherence question
{
  const slug = 'writing-compelling-antagonists-how-to-make-your-villain-unforgettable';
  const postId = postBySlug[slug];
  const parent = findComment(postId, 'David', 'trauma');
  const child  = findSDComment(postId);
  await setParent(child?.id, parent?.id, 'Antagonists: SD → David');
}

// 4. Cliche Characters: SD → David Park's "mentor character literally dies" comment
{
  const slug = 'how-to-avoid-cliche-character-types-in-your-screenplay-and-write-people-who-actually-feel-real';
  const postId = postBySlug[slug];
  const parent = findComment(postId, 'David', 'mentor character literally dies');
  const child  = findSDComment(postId);
  await setParent(child?.id, parent?.id, 'Cliche Characters: SD → David');
}

// 5. Protagonist: SD → Chris Anderson's "pursuing a bad goal" question
{
  const slug = 'protagonist-not-driving-story-reactive-vs-proactive';
  const postId = postBySlug[slug];
  const parent = findComment(postId, 'Chris', 'pursuing a bad goal');
  const child  = findSDComment(postId);
  await setParent(child?.id, parent?.id, 'Protagonist: SD → Chris');
}

// ── ② UPVOTES — AI personas upvote the substantive comments ──────────────────

console.log('\n=== UPVOTES ===\n');

// Helper: upvote a comment by multiple voters
async function upvoteBy(comment, voters, label) {
  if (!comment) { console.log(`  ✗ not found: ${label}`); return; }
  console.log(`  Upvoting "${label}" (${comment.author_name})`);
  for (const v of voters) await addUpvote(comment.id, v, label);
}

// ── Opening Scenes ─────────────────────────────────────────────────────────────
{
  const postId = postBySlug['how-to-write-memorable-opening-scenes-that-hook-readers-instantly'];

  // Dr. Michael Chen's long "last moment before everything changes" comment — the most helpful thing on the post
  const mchenComment = findComment(postId, 'Dr. Michael', 'last moment before everything changes');
  await upvoteBy(mchenComment, ['scriptdoctor', 'alexia_rose', 'tyler_m', 'sarahwrites'], 'Dr. Chen - last moment technique');

  // Robert Thompson's opening question — quality engagement that kicked off the thread
  const robertComment = findComment(postId, 'Robert', 'coffee');
  await upvoteBy(robertComment, ['emmawilson', 'davidpark'], 'Robert - coffee question');

  // David Park's ensemble question — good follow-up
  const davidComment = findComment(postId, 'David', 'ensemble');
  await upvoteBy(davidComment, ['robthompson', 'mchenphd'], 'David - ensemble question');

  // Script Doctor reply — direct and useful
  const sdComment = findSDComment(postId);
  await upvoteBy(sdComment, ['robthompson', 'alexia_rose', 'jamiek_writer'], 'SD - opening scenes reply');
}

// ── Action Lines ───────────────────────────────────────────────────────────────
{
  const postId = postBySlug['how-to-write-action-lines-that-directors-love-and-readers-actually-finish'];

  // Robert Thompson's long "police report" comment — specific, cites Shane Black
  const robertComment = findComment(postId, 'Robert', 'Shane Black');
  await upvoteBy(robertComment, ['scriptdoctor', 'jamiek_writer', 'davidpark', 'mchenphd', 'tyler_m'], 'Robert - Shane Black tip');

  // Jamie K's follow-up question — relatable and specific
  const jamieComment = findComment(postId, 'Jamie', 'descriptive vs');
  await upvoteBy(jamieComment, ['sarahwrites', 'alexia_rose'], 'Jamie K - descriptive question');

  // Chris Anderson's "IKEA instruction manual" line — sharp observation
  const chrisComment = findComment(postId, 'Chris', 'IKEA');
  await upvoteBy(chrisComment, ['robthompson', 'davidpark'], 'Chris - IKEA line');
}

// ── Subtext ────────────────────────────────────────────────────────────────────
{
  const postId = postBySlug['subtext-in-dialogue-examples-from-real-screenplays-that-actually-work'];

  // Emma Wilson's comment — great specific example (dishes), plus good question
  const emmaComment = findComment(postId, 'Emma', 'dishes in the sink');
  await upvoteBy(emmaComment, ['scriptdoctor', 'pat_rodriguez', 'chrisanderson', 'sarahwrites'], 'Emma - dishes example');

  // Script Doctor's Heat example — the best comment on this post
  const sdComment = findSDComment(postId);
  await upvoteBy(sdComment, ['emmawilson', 'davidpark', 'tyler_m', 'alexia_rose', 'robthompson'], 'SD - Heat example');
}

// ── Antagonists ────────────────────────────────────────────────────────────────
{
  const postId = postBySlug['writing-compelling-antagonists-how-to-make-your-villain-unforgettable'];

  // Robert Thompson's Dramatica technique comment — very substantive
  const robertComment = findComment(postId, 'Robert', 'Dramatica');
  await upvoteBy(robertComment, ['scriptdoctor', 'davidpark', 'sarahwrites', 'chrisanderson'], 'Robert - Dramatica technique');

  // David Park's trauma question — long, specific, worth engaging
  const davidComment = findComment(postId, 'David', 'trauma');
  await upvoteBy(davidComment, ['sarahwrites', 'tyler_m', 'emmawilson'], 'David - trauma question');

  // Script Doctor's Amy Dunne breakdown — best comment on this post
  const sdComment = findSDComment(postId);
  await upvoteBy(sdComment, ['davidpark', 'robthompson', 'alexia_rose', 'mchenphd', 'jamiek_writer'], 'SD - Amy Dunne breakdown');
}

// ── Cliche Characters ──────────────────────────────────────────────────────────
{
  const postId = postBySlug['how-to-avoid-cliche-character-types-in-your-screenplay-and-write-people-who-actually-feel-real'];

  // tyler_m's "contradiction list" comment — specific, practical, cites Truby
  const tylerComment = findComment(postId, 'tyler', 'contradiction list');
  await upvoteBy(tylerComment, ['scriptdoctor', 'robthompson', 'emmawilson', 'pat_rodriguez', 'mchenphd'], 'Tyler - contradiction list');

  // Chris Anderson's Uta Hagen comment — very long and specific
  const chrisComment = findComment(postId, 'Chris', 'Uta Hagen');
  await upvoteBy(chrisComment, ['scriptdoctor', 'tyler_m', 'mchenphd', 'davidpark'], 'Chris - Uta Hagen');

  // Script Doctor's "one selfish want" reply
  const sdComment = findSDComment(postId);
  await upvoteBy(sdComment, ['davidpark', 'alexia_rose', 'jamiek_writer', 'emmawilson'], 'SD - one selfish want');

  // David Park's mentor panic comment — relatable and gets a direct SD reply
  const davidComment = findComment(postId, 'David', 'mentor character literally dies');
  await upvoteBy(davidComment, ['emmawilson', 'alexia_rose', 'sarahwrites'], 'David - mentor panic');
}

// ── Protagonist ────────────────────────────────────────────────────────────────
{
  const postId = postBySlug['protagonist-not-driving-story-reactive-vs-proactive'];

  // Chris Anderson's incisive question — the whole SD reply hinges on it
  const chrisComment = findComment(postId, 'Chris', 'pursuing a bad goal');
  await upvoteBy(chrisComment, ['scriptdoctor', 'tyler_m', 'jamiek_writer', 'sarahwrites'], 'Chris - bad goal question');

  // Script Doctor's Fletcher/Whiplash breakdown — best comment on this post
  const sdComment = findSDComment(postId);
  await upvoteBy(sdComment, ['chrisanderson', 'emmawilson', 'tyler_m', 'jamiek_writer', 'alexia_rose'], 'SD - Fletcher breakdown');
}

// ── Character Arc ──────────────────────────────────────────────────────────────
{
  const postId = postBySlug['5-character-arc-mistakes-that-kill-your-screenplay-and-how-to-fix-them'];
  if (postId) {
    // David Park's Walter White comment — funny and specific
    const davidComment = findComment(postId, 'David', 'Walter');
    await upvoteBy(davidComment, ['scriptdoctor', 'sarahwrites', 'tyler_m', 'mchenphd'], 'David - Walter speedrun');

    // tyler_m's "two scenes" comment — specific craft observation
    const tylerComment = findComment(postId, 'tyler', 'two scenes');
    await upvoteBy(tylerComment, ['robthompson', 'davidpark'], 'Tyler - two scenes');
  }
}

// ── Summary ────────────────────────────────────────────────────────────────────

console.log(`\n=== DONE ===`);
console.log(`Threading fixed: ${threadingFixed} comments linked to their parent`);
console.log(`Upvotes added:   ${upvotesAdded}`);
