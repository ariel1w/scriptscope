import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = 'https://scriptscope.online';
const FROM = 'ScriptScope Community <community@scriptscope.online>';
const REPLY_TO = 'ariel1w@gmail.com';
const OWNER_EMAIL = 'ariel1w@gmail.com';

// Vary the subject line each week based on the day-of-year
const SUBJECTS = [
  'New screenwriting insights this week',
  'This week in the ScriptScope Community',
  'Fresh takes on the craft — this week',
  'What writers are reading this week',
  'Your weekly screenwriting digest',
  'New posts from the community this week',
  'This week: craft, story, and the writing life',
];

const INTROS = [
  "Here's what landed in the community this week — a few posts worth reading if you're in the middle of a draft.",
  "Good things this week. A handful of new posts covering craft, structure, and the stuff nobody tells you in film school.",
  "Quick digest of what's new in the ScriptScope community. Short reads, practical insights.",
  "We've been busy. Here's everything published this week — dig in.",
  "Another week, another set of posts designed to make your next draft better.",
  "A few new pieces from the community this week. Worth a read between writing sessions.",
  "This week's roundup is here. Some sharp stuff on craft and story — see what resonates.",
];

function pickByWeek<T>(arr: T[]): T {
  const week = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
  return arr[week % arr.length];
}

function buildEmailHtml(posts: PostRow[], hotPost: PostRow | null, unsubEmail: string): string {
  const unsubUrl = `${BASE_URL}/api/unsubscribe?email=${encodeURIComponent(unsubEmail)}`;
  const subject = pickByWeek(SUBJECTS);
  const intro = pickByWeek(INTROS);

  const postRows = posts.map((p) => {
    const excerpt = p.meta_description
      ? p.meta_description.length > 140
        ? p.meta_description.slice(0, 137) + '...'
        : p.meta_description
      : '';
    const url = `${BASE_URL}/blog/${p.slug}`;
    const isHot = hotPost && p.id === hotPost.id;

    return `
      <div style="margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid #f3f4f6;">
        ${isHot ? `<div style="display: inline-block; background: #c9a962; color: #0a1628; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 3px 10px; border-radius: 20px; margin-bottom: 10px;">🔥 Hot Discussion</div>` : ''}
        <h3 style="margin: 0 0 8px; font-size: 17px; line-height: 1.4;">
          <a href="${url}" style="color: #0a1628; text-decoration: none;">${p.title}</a>
        </h3>
        ${excerpt ? `<p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.6;">${excerpt}</p>` : ''}
        ${isHot && (p.comment_count ?? 0) > 0 ? `<p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; font-style: italic;">${p.comment_count} writers are discussing this — join the conversation.</p>` : ''}
        <a href="${url}" style="color: #c9a962; font-weight: 600; font-size: 14px; text-decoration: none;">Read More →</a>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333;">
  <div style="max-width: 580px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0a1628 0%, #1a3a5f 100%); border-radius: 10px 10px 0 0; padding: 28px 32px; text-align: center; border-bottom: 3px solid #c9a962;">
      <div style="color: #c9a962; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px;">ScriptScope Community</div>
      <h1 style="margin: 0; color: white; font-size: 22px; font-weight: 700; line-height: 1.3;">${subject}</h1>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">

      <p style="margin: 0 0 28px; color: #444; font-size: 15px; line-height: 1.7;">${intro}</p>

      <!-- Posts -->
      ${postRows}

      <!-- CTA -->
      <div style="text-align: center; padding: 20px 0 8px;">
        <a href="${BASE_URL}/blog" style="display: inline-block; background: #c9a962; color: #0a1628; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
          Join the conversation — it's free →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0 0 6px;">© ${new Date().getFullYear()} ScriptScope. All rights reserved.</p>
      <p style="margin: 0;">
        <a href="${unsubUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

interface PostRow {
  id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  created_at: string;
  comment_count?: number;
}

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Get new blog posts from the last 7 days
    const { data: posts, error: postsErr } = await supabaseAdmin
      .from('content_queue')
      .select('id, title, slug, meta_description, created_at')
      .eq('platform', 'blog')
      .eq('status', 'posted')
      .gte('created_at', oneWeekAgo)
      .order('created_at', { ascending: false });

    if (postsErr) {
      console.error('[Newsletter] Posts error:', postsErr);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // 2. Skip if no new posts this week
    if (!posts || posts.length === 0) {
      console.log('[Newsletter] No new posts this week — skipping send.');
      return NextResponse.json({ skipped: true, reason: 'No new posts this week' });
    }

    // 3. Count comments per post to find the "hot" discussion
    const postIds = posts.map((p) => p.id);
    const { data: comments } = await supabaseAdmin
      .from('blog_comments')
      .select('post_id')
      .in('post_id', postIds);

    // Tally comment counts
    const commentCounts: Record<string, number> = {};
    for (const c of comments || []) {
      commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
    }

    const postsWithCounts: PostRow[] = posts.map((p) => ({
      ...p,
      comment_count: commentCounts[p.id] || 0,
    }));

    // Hot post = most comments (only highlight if it has at least 1)
    const hotPost = postsWithCounts.reduce<PostRow | null>((best, p) => {
      if (!best) return (p.comment_count ?? 0) > 0 ? p : null;
      return (p.comment_count ?? 0) > (best.comment_count ?? 0) ? p : null;
    }, null);

    // 4. Get all subscribers
    const { data: subscribers, error: subErr } = await supabaseAdmin
      .from('email_subscribers')
      .select('email');

    if (subErr) {
      console.error('[Newsletter] Subscribers error:', subErr);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'No subscribers' });
    }

    // 5. Send to each subscriber with their personal unsubscribe link
    const subject = pickByWeek(SUBJECTS);
    let sent = 0;
    let failed = 0;

    for (const sub of subscribers) {
      try {
        const html = buildEmailHtml(postsWithCounts, hotPost, sub.email);
        await resend.emails.send({
          from: FROM,
          to: sub.email,
          replyTo: REPLY_TO,
          subject,
          html,
        });
        sent++;
      } catch (err) {
        console.error(`[Newsletter] Failed to send to ${sub.email}:`, err);
        failed++;
      }
    }

    console.log(`[Newsletter] Sent: ${sent}, Failed: ${failed}, Posts: ${posts.length}`);
    return NextResponse.json({
      success: true,
      sent,
      failed,
      posts: posts.length,
      subscribers: subscribers.length,
    });
  } catch (error) {
    console.error('[Newsletter] Unexpected error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
