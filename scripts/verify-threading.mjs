import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf-8').split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: posts } = await sb.from('content_queue').select('id, slug, title')
  .eq('platform', 'blog').eq('status', 'posted');

const slugsToCheck = [
  'writing-compelling-antagonists-how-to-make-your-villain-unforgettable',
  'subtext-in-dialogue-examples-from-real-screenplays-that-actually-work',
  'protagonist-not-driving-story-reactive-vs-proactive',
];

for (const slug of slugsToCheck) {
  const post = posts.find(p => p.slug === slug);
  if (!post) { console.log('Post not found: ' + slug); continue; }

  const { data: comments } = await sb.from('blog_comments')
    .select('id, author_name, parent_comment_id, created_at')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true });

  const ids = comments.map(c => c.id);
  const { data: upvotes } = await sb.from('comment_upvotes').select('comment_id').in('comment_id', ids);
  const counts = {};
  for (const u of (upvotes ?? [])) counts[u.comment_id] = (counts[u.comment_id] || 0) + 1;

  console.log('\n' + post.title);
  console.log('─'.repeat(60));
  for (const c of comments) {
    const indent = c.parent_comment_id ? '  └─ ' : '     ';
    const votes = counts[c.id] ? ' [up:' + counts[c.id] + ']' : '';
    const tag = c.parent_comment_id ? ' (reply)' : '';
    console.log(indent + c.author_name + votes + tag);
  }
}
