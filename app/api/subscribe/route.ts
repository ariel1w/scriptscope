import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSubscriberWelcomeEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('email_subscribers')
      .upsert(
        { email: email.toLowerCase().trim(), source: source || 'unknown' },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('[Subscribe] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save email' }, { status: 500 });
    }

    // Send welcome email in background — don't block response
    sendSubscriberWelcomeEmail(email).catch((err) =>
      console.error('[Subscribe] Welcome email error:', err)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Subscribe] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
