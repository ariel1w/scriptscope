import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { analyzeScript } from '@/lib/claude';
import { SCRIPT_ANALYSIS_PROMPT } from '@/lib/prompts/analysis';
import { sendReportReadyEmail, sendAnalysisFailedEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { scriptId, email, promoDiscount = 0, internalSecret } = await request.json();

    if (!scriptId || !email) {
      return NextResponse.json({ error: 'Missing scriptId or email' }, { status: 400 });
    }

    const isFreeWithPromo = promoDiscount === 100;
    // Trusted internal call from webhook (payment already verified by LS signature)
    const isWebhookTriggered = internalSecret === process.env.CRON_SECRET;

    if (!isFreeWithPromo && !isWebhookTriggered) {
      // Check and deduct credit via supabaseAdmin directly
      const { data: creditRow } = await supabaseAdmin
        .from('credits')
        .select('credits_remaining')
        .eq('email', email)
        .single();

      if (!creditRow || creditRow.credits_remaining <= 0) {
        return NextResponse.json({ error: 'No credits available' }, { status: 403 });
      }

      await supabaseAdmin
        .from('credits')
        .update({
          credits_remaining: creditRow.credits_remaining - 1,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);
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
      const analysis = await analyzeScript(script.raw_text, SCRIPT_ANALYSIS_PROMPT);

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

      // Increment daily stats
      const today = new Date().toISOString().split('T')[0];
      const { data: existingStats } = await supabaseAdmin
        .from('daily_stats')
        .select('*')
        .eq('date', today)
        .single();

      if (existingStats) {
        await supabaseAdmin
          .from('daily_stats')
          .update({ scripts_analyzed: existingStats.scripts_analyzed + 1 })
          .eq('date', today);
      } else {
        await supabaseAdmin
          .from('daily_stats')
          .insert({ date: today, scripts_analyzed: 1, revenue: 0, signups: 0, refunds: 0 });
      }

      const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/results/${scriptId}`;
      await sendReportReadyEmail(email, script.title, reportUrl);

      return NextResponse.json({ success: true, analysis, scriptId });
    } catch (analysisError) {
      console.error('[Analyze] Analysis error:', analysisError);

      await supabaseAdmin
        .from('scripts')
        .update({
          status: 'failed',
          error_message: (analysisError as Error).message,
        })
        .eq('id', scriptId);

      // Restore credit on failure (unless free or webhook-triggered — webhook will handle refund separately)
      if (!isFreeWithPromo && !isWebhookTriggered) {
        const { data: creditRow } = await supabaseAdmin
          .from('credits')
          .select('credits_remaining')
          .eq('email', email)
          .single();
        if (creditRow) {
          await supabaseAdmin
            .from('credits')
            .update({ credits_remaining: creditRow.credits_remaining + 1 })
            .eq('email', email);
        }
      }

      await sendAnalysisFailedEmail(email, script.title);

      return NextResponse.json({
        error: 'Analysis failed',
        details: (analysisError as Error).message,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Analyze] Top-level error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: (error as Error).message,
    }, { status: 500 });
  }
}
