import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated via their JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS and fetch by email
    const { data, error } = await supabaseAdmin
      .from('scripts')
      .select('id, title, created_at, status, analysis')
      .eq('email', user.email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ scripts: data || [] });
  } catch (error) {
    console.error('[my-reports] Error:', error);
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 });
  }
}
