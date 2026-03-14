import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function getDailyBaseline(): number {
  const dateStr = new Date().toISOString().split('T')[0]; // e.g. "2026-03-12"
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = (seed * 31 + dateStr.charCodeAt(i)) % 2147483647;
  }
  return 25 + (seed % 51); // range: 25–75 inclusive
}

export async function GET() {
  const baseline = getDailyBaseline();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from('scripts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('processing_completed_at', since);

  const real = error ? 0 : (count ?? 0);

  return NextResponse.json({ count: baseline + real });
}
