import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get('scriptId');

    if (!scriptId) {
      return NextResponse.json({ error: 'Missing scriptId' }, { status: 400 });
    }

    // Get user session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get script status from database with user_id
    const { data: script, error } = await supabaseAdmin
      .from('scripts')
      .select('id, title, status, analysis, error_message, processing_started_at, processing_completed_at, email, user_id')
      .eq('id', scriptId)
      .single();

    if (error || !script) {
      console.error('Script status fetch error:', error);
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    // Verify ownership - check either user_id (new) or email (legacy)
    const userEmail = session.user.email;
    const userId = session.user.id;

    if (script.user_id && script.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!script.user_id && script.email !== userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      id: script.id,
      title: script.title,
      status: script.status,
      analysis: script.analysis,
      error_message: script.error_message,
      processing_started_at: script.processing_started_at,
      processing_completed_at: script.processing_completed_at,
    });
  } catch (error) {
    console.error('Script status error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
