import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get('scriptId');
    const userId = searchParams.get('userId');

    if (!scriptId || !userId) {
      return NextResponse.json({ error: 'Missing scriptId or userId' }, { status: 400 });
    }

    // Get script status from database
    const { data: script, error } = await supabaseAdmin
      .from('scripts')
      .select('id, title, status, analysis, error_message, processing_started_at, processing_completed_at, email, user_id')
      .eq('id', scriptId)
      .single();

    if (error || !script) {
      console.error('Script status fetch error:', error);
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    // Verify ownership
    if (script.user_id && script.user_id !== userId) {
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
