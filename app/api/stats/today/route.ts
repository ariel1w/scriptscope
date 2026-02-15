import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getDailyBaseline, getTodayDateString } from '@/lib/daily-baseline';

export async function GET() {
  try {
    const today = getTodayDateString();

    // Get today's stats from database
    const { data: stats } = await supabaseAdmin
      .from('daily_stats')
      .select('scripts_analyzed')
      .eq('date', today)
      .single();

    const realCount = stats?.scripts_analyzed || 0;
    const baseline = getDailyBaseline();
    const totalCount = baseline + realCount;

    return NextResponse.json({
      count: totalCount,
      baseline,
      real: realCount,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);

    // Fallback to baseline only if database fails
    const baseline = getDailyBaseline();
    return NextResponse.json({
      count: baseline,
      baseline,
      real: 0,
    });
  }
}

// Revalidate every 30 seconds
export const revalidate = 30;
