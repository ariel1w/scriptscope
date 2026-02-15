import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('[Test DB] Testing Supabase connection...');
    console.log('[Test DB] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[Test DB] Anon key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
    console.log('[Test DB] Service key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

    // Try to query the credits table
    const { data, error, count } = await supabaseAdmin
      .from('credits')
      .select('*', { count: 'exact', head: false })
      .limit(1);

    if (error) {
      console.error('[Test DB] Error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        hint: error.hint,
        code: error.code,
        details: error.details,
      });
    }

    console.log('[Test DB] Success! Data:', data);
    return NextResponse.json({
      success: true,
      message: 'Supabase connection working',
      tableExists: true,
      rowCount: count,
      sampleData: data,
    });
  } catch (error: any) {
    console.error('[Test DB] Exception:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
