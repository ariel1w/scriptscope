import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendRefundIssuedEmail } from '@/lib/resend';

const MAX_RETRY_ATTEMPTS = 3;
const STUCK_THRESHOLD_MINUTES = 15;

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find stuck scripts (processing for > 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    const { data: stuckScripts, error } = await supabaseAdmin
      .from('scripts')
      .select('*')
      .eq('status', 'processing')
      .lt('processing_started_at', fifteenMinutesAgo);

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const results = {
      checked: stuckScripts.length,
      retried: 0,
      refunded: 0,
    };

    for (const script of stuckScripts) {
      // TODO: Track retry attempts
      // For now, just mark as failed and refund

      // Mark as failed
      await supabaseAdmin
        .from('scripts')
        .update({
          status: 'failed',
          error_message: 'Analysis timed out',
        })
        .eq('id', script.id);

      // Refund credit
      const { data: credit } = await supabaseAdmin
        .from('credits')
        .select('*')
        .eq('email', script.email)
        .single();

      if (credit) {
        await supabaseAdmin
          .from('credits')
          .update({
            credits_remaining: credit.credits_remaining + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('email', script.email);
      }

      // Send refund email
      await sendRefundIssuedEmail(script.email, 1);

      results.refunded++;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}
