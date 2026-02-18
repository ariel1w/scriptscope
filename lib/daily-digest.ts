import { supabaseAdmin } from './supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDailyDigest(): Promise<void> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get blog posts published yesterday
  const { data: newPosts } = await supabaseAdmin
    .from('content_queue')
    .select('title, slug')
    .eq('platform', 'blog')
    .eq('status', 'posted')
    .gte('posted_at', yesterday.toISOString())
    .lt('posted_at', today.toISOString());

  // Get comments posted yesterday
  const { data: newComments } = await supabaseAdmin
    .from('blog_comments')
    .select('id')
    .gte('created_at', yesterday.toISOString())
    .lt('created_at', today.toISOString());

  // Get page views yesterday
  const { data: pageViews } = await supabaseAdmin
    .from('page_views')
    .select('id, visitor_id')
    .gte('created_at', yesterday.toISOString())
    .lt('created_at', today.toISOString());

  const totalPageViews = pageViews?.length || 0;
  const uniqueVisitors = new Set(pageViews?.map(v => v.visitor_id) || []).size;

  // Get signups yesterday (new users)
  const { data: newUsers } = await supabaseAdmin
    .from('users')
    .select('id')
    .gte('created_at', yesterday.toISOString())
    .lt('created_at', today.toISOString());

  // Get daily stats for revenue
  const yesterdayDate = yesterday.toISOString().split('T')[0];
  const { data: stats } = await supabaseAdmin
    .from('daily_stats')
    .select('*')
    .eq('date', yesterdayDate)
    .single();

  const revenue = stats?.revenue || 0;
  const scriptsAnalyzed = stats?.scripts_analyzed || 0;

  // Anthropic has no public REST endpoint for credit balance.
  // Link directly to the billing console instead.
  const anthropicBalanceLink = 'https://console.anthropic.com/settings/billing';

  // Build email HTML
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1E3A5F; border-bottom: 2px solid #c9a962; padding-bottom: 10px;">
        ScriptScope Daily Digest
      </h1>
      <p style="color: #666; margin-bottom: 30px;">
        ${yesterday.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <h2 style="color: #1E3A5F; margin-top: 30px;">📊 Site Traffic</h2>
      <ul style="list-style: none; padding: 0;">
        <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>Page Views:</strong> ${totalPageViews.toLocaleString()}
        </li>
        <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>Unique Visitors:</strong> ${uniqueVisitors.toLocaleString()}
        </li>
        <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>New Signups:</strong> ${newUsers?.length || 0}
        </li>
      </ul>

      <h2 style="color: #1E3A5F; margin-top: 30px;">📝 Blog Activity</h2>
      <ul style="list-style: none; padding: 0;">
        <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>New Posts Published:</strong> ${newPosts?.length || 0}
        </li>
        <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>New Comments:</strong> ${newComments?.length || 0}
        </li>
      </ul>

      ${newPosts && newPosts.length > 0 ? `
        <h3 style="color: #1E3A5F; margin-top: 20px;">Published Posts:</h3>
        <ul>
          ${newPosts.map(post => `
            <li style="margin-bottom: 10px;">
              <a href="https://scriptscope.online/blog/${post.slug}" style="color: #c9a962; text-decoration: none;">
                ${post.title}
              </a>
            </li>
          `).join('')}
        </ul>
      ` : ''}

      <h2 style="color: #1E3A5F; margin-top: 30px;">💰 Revenue & Usage</h2>
      <ul style="list-style: none; padding: 0;">
        <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>Revenue:</strong> $${revenue.toFixed(2)}
        </li>
        <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>Scripts Analyzed:</strong> ${scriptsAnalyzed}
        </li>
      </ul>

      <h2 style="color: #1E3A5F; margin-top: 30px;">🤖 API Credits</h2>
      <ul style="list-style: none; padding: 0;">
        <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>Anthropic Balance:</strong>
          <a href="${anthropicBalanceLink}" style="color: #c9a962; text-decoration: none;">View in Anthropic Console →</a>
        </li>
      </ul>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
        <p>This is an automated daily digest for ScriptScope.</p>
      </div>
    </div>
  `;

  // Send email
  await resend.emails.send({
    from: 'ScriptScope Daily <digest@scriptscope.online>',
    to: process.env.OWNER_EMAIL || 'ariel1w@gmail.com',
    subject: `ScriptScope Daily Digest - ${yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    html: emailHtml,
  });

  console.log('Daily digest sent successfully');
}
