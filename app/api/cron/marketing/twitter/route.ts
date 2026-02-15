import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { postTweet } from '@/lib/twitter';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get next queued tweet
    const { data: queuedTweets, error } = await supabaseAdmin
      .from('content_queue')
      .select('*')
      .eq('platform', 'twitter')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!queuedTweets || queuedTweets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tweets in queue',
      });
    }

    const tweet = queuedTweets[0];

    try {
      // Post to Twitter
      const tweetId = await postTweet(tweet.content);

      // Update status
      await supabaseAdmin
        .from('content_queue')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
          external_id: tweetId,
        })
        .eq('id', tweet.id);

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        tweetId,
      });
    } catch (postError) {
      console.error('Twitter post error:', postError);

      // Mark as failed
      await supabaseAdmin
        .from('content_queue')
        .update({
          status: 'failed',
        })
        .eq('id', tweet.id);

      return NextResponse.json({ error: 'Failed to post tweet' }, { status: 500 });
    }
  } catch (error) {
    console.error('Twitter cron error:', error);
    return NextResponse.json({ error: 'Twitter cron failed' }, { status: 500 });
  }
}
