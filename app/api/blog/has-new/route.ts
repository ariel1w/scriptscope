import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Revalidate once per hour — no need to hit the DB on every page load
export const revalidate = 3600;

export async function GET() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const { count } = await supabaseAdmin
    .from('content_queue')
    .select('id', { count: 'exact', head: true })
    .eq('platform', 'blog')
    .eq('status', 'posted')
    .gte('posted_at', oneDayAgo.toISOString());

  return NextResponse.json({ hasNew: (count ?? 0) > 0 });
}
