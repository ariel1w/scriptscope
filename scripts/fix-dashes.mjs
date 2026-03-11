/**
 * Replace all em dashes (—) and en dashes (–) in blog comments and blog posts.
 * Run: node scripts/fix-dashes.mjs
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function replaceDashes(text) {
  if (!text) return text;
  return text
    .replace(/\n *[—–] */g, '\n- ')  // line-start dash → list hyphen
    .replace(/ *[—–] */g, ', ');       // inline dash → comma+space
}

// ── Fix blog_comments ─────────────────────────────────────────────────────────
console.log('Fetching all blog comments...');
const { data: comments, error: commentsError } = await supabase
  .from('blog_comments')
  .select('id, content');

if (commentsError) {
  console.error('Error fetching comments:', commentsError.message);
  process.exit(1);
}

const commentsThatNeedFix = (comments ?? []).filter(
  c => c.content && (c.content.includes('—') || c.content.includes('–'))
);
console.log(`Found ${commentsThatNeedFix.length} comments with em/en dashes (out of ${comments?.length ?? 0} total).`);

let commentFixed = 0;
for (const comment of commentsThatNeedFix) {
  const fixed = replaceDashes(comment.content);
  const { error } = await supabase
    .from('blog_comments')
    .update({ content: fixed })
    .eq('id', comment.id);
  if (error) {
    console.error(`  Error updating comment ${comment.id}:`, error.message);
  } else {
    commentFixed++;
  }
}
console.log(`Fixed ${commentFixed} blog comments.\n`);

// ── Fix content_queue (blog posts) ────────────────────────────────────────────
console.log('Fetching all blog posts...');
const { data: posts, error: postsError } = await supabase
  .from('content_queue')
  .select('id, title, content, meta_description')
  .eq('platform', 'blog');

if (postsError) {
  console.error('Error fetching posts:', postsError.message);
  process.exit(1);
}

console.log(`Found ${posts?.length ?? 0} blog posts to check.`);

let postFixed = 0;
for (const post of (posts ?? [])) {
  const fixedTitle = replaceDashes(post.title);
  const fixedContent = replaceDashes(post.content);
  const fixedMeta = replaceDashes(post.meta_description);

  if (fixedTitle !== post.title || fixedContent !== post.content || fixedMeta !== post.meta_description) {
    const { error } = await supabase
      .from('content_queue')
      .update({
        title: fixedTitle,
        content: fixedContent,
        meta_description: fixedMeta,
      })
      .eq('id', post.id);
    if (error) {
      console.error(`  Error updating post ${post.id}:`, error.message);
    } else {
      postFixed++;
      console.log(`  Fixed: "${fixedTitle.substring(0, 70)}"`);
    }
  }
}

console.log(`\nFixed ${postFixed} blog posts.`);
console.log('\n=== Done ===');
