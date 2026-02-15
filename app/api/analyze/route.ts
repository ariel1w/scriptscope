import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeScript } from '@/lib/claude';
import { SCRIPT_ANALYSIS_PROMPT } from '@/lib/prompts/analysis';
import { sendReportReadyEmail, sendAnalysisFailedEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { scriptId, email, testKey, promoDiscount = 0 } = await request.json();

    if (!scriptId || !email) {
      return NextResponse.json({ error: 'Missing scriptId or email' }, { status: 400 });
    }

    // Check if test key is valid and skip credit check
    const isTestMode = testKey && testKey === process.env.TEST_SECRET_KEY;
    // Check if promo gives 100% discount
    const isFreeWithPromo = promoDiscount === 100;

    // Deduct credit (skip in test mode or 100% promo)
    if (!isTestMode && !isFreeWithPromo) {
      const creditResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'use' }),
      });

      if (!creditResponse.ok) {
        return NextResponse.json({ error: 'No credits available' }, { status: 403 });
      }
    }

    // Get script
    const { data: script, error: fetchError } = await supabaseAdmin
      .from('scripts')
      .select('*')
      .eq('id', scriptId)
      .single();

    if (fetchError || !script) {
      console.error('Script fetch error:', fetchError);
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    // Update status to processing
    await supabaseAdmin
      .from('scripts')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
      })
      .eq('id', scriptId);

    // Run analysis
    try {
      console.log('[Analyze] Starting AI analysis for script:', scriptId);
      const analysis = await analyzeScript(script.raw_text, SCRIPT_ANALYSIS_PROMPT);
      console.log('[Analyze] AI analysis complete');

      // Save analysis
      console.log('[Analyze] Saving analysis to database...');
      const { error: updateError } = await supabaseAdmin
        .from('scripts')
        .update({
          status: 'completed',
          analysis,
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', scriptId);

      if (updateError) {
        console.error('[Analyze] Update error:', updateError);
        throw new Error('Failed to save analysis');
      }

      console.log('[Analyze] Analysis saved successfully');

      // Mark first discount as used if FIRST10 code was applied
      if (promoDiscount === 74 && script.user_id) {
        console.log('[Analyze] Marking first discount as used for user:', script.user_id);
        await supabaseAdmin
          .from('users')
          .update({ first_discount_used: true })
          .eq('id', script.user_id);
      }

      // Increment daily stats counter
      const today = new Date().toISOString().split('T')[0];
      const { data: existingStats } = await supabaseAdmin
        .from('daily_stats')
        .select('*')
        .eq('date', today)
        .single();

      if (existingStats) {
        await supabaseAdmin
          .from('daily_stats')
          .update({
            scripts_analyzed: existingStats.scripts_analyzed + 1,
          })
          .eq('date', today);
      } else {
        await supabaseAdmin
          .from('daily_stats')
          .insert({
            date: today,
            scripts_analyzed: 1,
            revenue: 0,
            signups: 0,
            refunds: 0,
          });
      }

      // Send email with link to results page
      const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/results/${scriptId}`;
      await sendReportReadyEmail(email, script.title, reportUrl);

      return NextResponse.json({
        success: true,
        analysis,
        scriptId,
      });
    } catch (analysisError) {
      console.error('[Analyze] Analysis error:', analysisError);
      console.error('[Analyze] Error details:', {
        message: (analysisError as Error).message,
        stack: (analysisError as Error).stack,
      });

      // Mark as failed
      await supabaseAdmin
        .from('scripts')
        .update({
          status: 'failed',
          error_message: (analysisError as Error).message,
        })
        .eq('id', scriptId);

      // Refund credit (skip in test mode or 100% promo)
      if (!isTestMode && !isFreeWithPromo) {
        console.log('[Analyze] Refunding credit to:', email);
        await supabaseAdmin.rpc('increment_credits', {
          user_email: email,
          amount: 1,
        });
      }

      // Send failure email
      await sendAnalysisFailedEmail(email, script.title);

      return NextResponse.json({
        error: 'Analysis failed',
        details: (analysisError as Error).message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Analyze] Top-level error:', error);
    console.error('[Analyze] Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    return NextResponse.json({
      error: 'Server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}
