import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: posts } = await supabase
  .from('content_queue')
  .select('id, title, content, posted_at')
  .eq('platform', 'blog').eq('status', 'posted')
  .order('posted_at', { ascending: true });

for (const post of posts) {
  const { data: comments } = await supabase
    .from('blog_comments')
    .select('id, author_name, content, created_at, user_id, persona_id')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true });

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`POST: ${post.title}`);
  console.log(`${'─'.repeat(70)}`);
  for (const c of (comments || [])) {
    const tag = c.user_id ? '[real-user]' : c.persona_id ? '[persona]' : '[random]';
    console.log(`  [${c.created_at?.substring(0,10)}] ${c.author_name} ${tag}`);
    console.log(`  "${c.content}"\n`);
  }
}
