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

    // Get blog posts without comments (look back 30 days to catch backdated posts)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: posts } = await supabaseAdmin
      .from('content_queue')
      .select('id, title, content, posted_at')
      .eq('platform', 'blog')
      .eq('status', 'posted')
      .gte('posted_at', thirtyDaysAgo.toISOString());

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
        const postDate = post.posted_at ? new Date(post.posted_at) : undefined;
        await generateCommentForPost(post.id, post.title, post.content, postDate);
      }
    }

    return NextResponse.json({ success: true, message: 'Comments generated' });
  } catch (error) {
    console.error('Comment generation error:', error);
    return NextResponse.json({ error: 'Failed to generate comments' }, { status: 500 });
  }
}
