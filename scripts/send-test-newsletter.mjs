import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf-8').split('\n').forEach(l => {
  const m = l.match(/^([^#\s][^=]*)=(.*)/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const RESEND_KEY = env.RESEND_API_KEY;
const TO = 'ariel1w@gmail.com';
const BASE_URL = 'https://scriptscope.online';
const FROM = 'ScriptScope Community <onboarding@resend.dev>';

// Get posts from last 30 days (wider window so test has content)
const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

const { data: posts, error } = await sb
  .from('content_queue')
  .select('id, title, slug, meta_description, created_at')
  .eq('platform', 'blog')
  .eq('status', 'posted')
  .gte('created_at', since)
  .order('created_at', { ascending: false })
  .limit(6);

if (error) { console.error('Posts error:', error.message); process.exit(1); }
console.log(`Found ${posts.length} posts`);

// Get comment counts
const postIds = posts.map(p => p.id);
const { data: comments } = await sb.from('blog_comments').select('post_id').in('post_id', postIds);
const counts = {};
for (const c of (comments || [])) counts[c.post_id] = (counts[c.post_id] || 0) + 1;

const postsWithCounts = posts.map(p => ({ ...p, comment_count: counts[p.id] || 0 }));
const hotPost = postsWithCounts.reduce((best, p) => {
  if (!best) return p.comment_count > 0 ? p : null;
  return p.comment_count > best.comment_count ? p : best;
}, null);

const unsubUrl = `${BASE_URL}/api/unsubscribe?email=${encodeURIComponent(TO)}`;

const postRows = postsWithCounts.map(p => {
  const excerpt = p.meta_description
    ? p.meta_description.length > 140 ? p.meta_description.slice(0, 137) + '...' : p.meta_description
    : '';
  const url = `${BASE_URL}/blog/${p.slug}`;
  const isHot = hotPost && p.id === hotPost.id;
  return `
    <div style="margin-bottom:28px;padding-bottom:28px;border-bottom:1px solid #f3f4f6;">
      ${isHot ? `<div style="display:inline-block;background:#c9a962;color:#0a1628;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 10px;border-radius:20px;margin-bottom:10px;">🔥 Hot Discussion</div>` : ''}
      <h3 style="margin:0 0 8px;font-size:17px;line-height:1.4;">
        <a href="${url}" style="color:#0a1628;text-decoration:none;">${p.title}</a>
      </h3>
      ${excerpt ? `<p style="margin:0 0 10px;color:#6b7280;font-size:14px;line-height:1.6;">${excerpt}</p>` : ''}
      ${isHot && p.comment_count > 0 ? `<p style="margin:0 0 10px;color:#6b7280;font-size:13px;font-style:italic;">${p.comment_count} writers are discussing this — join the conversation.</p>` : ''}
      <a href="${url}" style="color:#c9a962;font-weight:600;font-size:14px;text-decoration:none;">Read More →</a>
    </div>`;
}).join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;">
  <div style="max-width:580px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#0a1628 0%,#1a3a5f 100%);border-radius:10px 10px 0 0;padding:28px 32px;text-align:center;border-bottom:3px solid #c9a962;">
      <div style="color:#c9a962;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">ScriptScope Community</div>
      <h1 style="margin:0;color:white;font-size:22px;font-weight:700;line-height:1.3;">This week in the ScriptScope Community</h1>
    </div>
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;">
      <p style="margin:0 0 28px;color:#444;font-size:15px;line-height:1.7;">Here's what landed in the community this week — a few posts worth reading if you're in the middle of a draft.</p>
      ${postRows}
      <div style="text-align:center;padding:20px 0 8px;">
        <a href="${BASE_URL}/blog" style="display:inline-block;background:#c9a962;color:#0a1628;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">Join the conversation — it's free →</a>
      </div>
    </div>
    <div style="text-align:center;padding:20px 0;color:#9ca3af;font-size:12px;">
      <p style="margin:0 0 6px;">© ${new Date().getFullYear()} ScriptScope. All rights reserved.</p>
      <p style="margin:0;"><a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;

console.log(`Sending to ${TO}...`);
const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from: FROM, to: TO, subject: '[TEST] This week in the ScriptScope Community', html }),
});
const result = await res.json();
if (res.ok) {
  console.log('Sent! Email ID:', result.id);
} else {
  console.error('Failed:', JSON.stringify(result));
}
