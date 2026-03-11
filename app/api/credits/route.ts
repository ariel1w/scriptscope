import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, action } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    let { data: credit, error } = await supabaseAdmin
      .from('credits')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newCredit, error: insertError } = await supabaseAdmin
        .from('credits')
        .insert({
          email,
          credits_remaining: 0,
          trial_used: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Credits API] Insert error:', insertError);
        return NextResponse.json({
          error: 'Database error',
          details: insertError.message
        }, { status: 500 });
      }

      credit = newCredit;
    } else if (error) {
      console.error('[Credits API] Database error:', error);
      return NextResponse.json({
        error: 'Database error',
        details: error.message,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    if (action === 'check') {
      const hasAccess = credit.credits_remaining > 0;
      return NextResponse.json({
        hasAccess,
        credits: credit.credits_remaining,
      });
    }

    if (action === 'use') {
      if (credit.credits_remaining > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('credits')
          .update({
            credits_remaining: credit.credits_remaining - 1,
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);

        if (updateError) {
          console.error('Update error:', updateError);
          return NextResponse.json({ error: 'Failed to deduct credit' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          creditsRemaining: credit.credits_remaining - 1,
        });
      } else {
        return NextResponse.json({ error: 'No credits available' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Credits error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
