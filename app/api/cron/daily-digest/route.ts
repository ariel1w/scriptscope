import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendDailyDigestEmail } from '@/lib/resend';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    // Get stats
    const { data: stats } = await supabaseAdmin
      .from('daily_stats')
      .select('*')
      .eq('date', dateStr)
      .single();

    const statsData = stats || {
      date: dateStr,
      revenue: 0,
      scripts_analyzed: 0,
      signups: 0,
      refunds: 0,
    };

    // Check for any issues
    const issues: string[] = [];

    // Check for failed scripts in the last 24 hours
    const { data: failedScripts } = await supabaseAdmin
      .from('scripts')
      .select('id')
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (failedScripts && failedScripts.length > 0) {
      issues.push(`${failedScripts.length} failed script analyses`);
    }

    // Send digest email
    await sendDailyDigestEmail({
      ...statsData,
      issues,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: statsData,
      issues,
    });
  } catch (error) {
    console.error('Daily digest error:', error);
    return NextResponse.json({ error: 'Daily digest failed' }, { status: 500 });
  }
}
