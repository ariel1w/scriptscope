import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { postToLinkedIn } from '@/lib/linkedin';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get next queued LinkedIn post
    const { data: queuedPosts, error } = await supabaseAdmin
      .from('content_queue')
      .select('*')
      .eq('platform', 'linkedin')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!queuedPosts || queuedPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No LinkedIn posts in queue',
      });
    }

    const post = queuedPosts[0];

    try {
      // Post to LinkedIn
      const postId = await postToLinkedIn(post.content);

      // Update status
      await supabaseAdmin
        .from('content_queue')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
          external_id: postId,
        })
        .eq('id', post.id);

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        postId,
      });
    } catch (postError) {
      console.error('LinkedIn post error:', postError);

      // Mark as failed
      await supabaseAdmin
        .from('content_queue')
        .update({
          status: 'failed',
        })
        .eq('id', post.id);

      return NextResponse.json({ error: 'Failed to post to LinkedIn' }, { status: 500 });
    }
  } catch (error) {
    console.error('LinkedIn cron error:', error);
    return NextResponse.json({ error: 'LinkedIn cron failed' }, { status: 500 });
  }
}
