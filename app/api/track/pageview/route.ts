import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { page_path, user_id, visitor_id, referrer, user_agent } = await request.json();

    await supabaseAdmin.from('page_views').insert({
      page_path,
      user_id,
      visitor_id,
      referrer: referrer || null,
      user_agent: user_agent || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Page view tracking error:', error);
    // Return success even on error - tracking shouldn't break the site
    return NextResponse.json({ success: true });
  }
}
