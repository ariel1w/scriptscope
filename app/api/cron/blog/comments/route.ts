import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateCommentForPost } from '@/lib/ai-commenter';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent blog posts without comments (posted in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { data: posts } = await supabaseAdmin
      .from('content_queue')
      .select('id, title, content, posted_at')
      .eq('platform', 'blog')
      .eq('status', 'posted')
      .gte('posted_at', sevenDaysAgo.toISOString());

    if (!posts || posts.length === 0) {
      return NextResponse.json({ success: true, message: 'No posts to comment on' });
    }

    for (const post of posts) {
      // Check if this post already has AI comments
      const { data: existingComments } = await supabaseAdmin
        .from('blog_comments')
        .select('id')
        .eq('post_id', post.id);

      if (!existingComments || existingComments.length === 0) {
        // Generate comments for this post
        await generateCommentForPost(post.id, post.title, post.content);
      }
    }

    return NextResponse.json({ success: true, message: 'Comments generated' });
  } catch (error) {
    console.error('Comment generation error:', error);
    return NextResponse.json({ error: 'Failed to generate comments' }, { status: 500 });
  }
}
