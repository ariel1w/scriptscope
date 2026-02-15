import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const RETENTION_HOURS = 24;

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find scripts older than 24 hours
    const cutoffTime = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000).toISOString();

    const { data: oldScripts, error } = await supabaseAdmin
      .from('scripts')
      .select('id')
      .lt('created_at', cutoffTime)
      .is('deleted_at', null);

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Soft delete by setting deleted_at and clearing sensitive data
    if (oldScripts && oldScripts.length > 0) {
      const ids = oldScripts.map((s) => s.id);

      await supabaseAdmin
        .from('scripts')
        .update({
          deleted_at: new Date().toISOString(),
          raw_text: null, // Clear the script text
        })
        .in('id', ids);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      deleted: oldScripts?.length || 0,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
