import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabaseAdmin
    .from('scripts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('processing_completed_at', since);

  if (error) {
    return NextResponse.json({ count: 25 });
  }

  const real = count ?? 0;
  const displayed = real < 25 ? 25 : real;

  return NextResponse.json({ count: displayed });
}
