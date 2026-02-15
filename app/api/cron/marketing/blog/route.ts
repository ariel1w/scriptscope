import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get next queued blog post
    const { data: queuedPosts, error } = await supabaseAdmin
      .from('content_queue')
      .select('*')
      .eq('platform', 'blog')
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
        message: 'No blog posts in queue',
      });
    }

    const post = queuedPosts[0];

    // Note: In a real implementation, you would create the blog post file or database entry here
    // For now, we'll just mark it as posted

    try {
      // Update status
      await supabaseAdmin
        .from('content_queue')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        slug: post.slug,
      });
    } catch (publishError) {
      console.error('Blog publish error:', publishError);

      // Mark as failed
      await supabaseAdmin
        .from('content_queue')
        .update({
          status: 'failed',
        })
        .eq('id', post.id);

      return NextResponse.json({ error: 'Failed to publish blog post' }, { status: 500 });
    }
  } catch (error) {
    console.error('Blog cron error:', error);
    return NextResponse.json({ error: 'Blog cron failed' }, { status: 500 });
  }
}
