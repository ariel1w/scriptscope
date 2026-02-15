import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { PADDLE_CREDITS, verifyPaddleWebhook } from '@/lib/paddle';
import { sendPurchaseConfirmationEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('paddle-signature') || '';

    // Verify webhook signature
    if (!verifyPaddleWebhook(signature, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Handle different event types
    if (event.event_type === 'transaction.completed') {
      const { customer, items } = event.data;
      const email = customer.email;
      const priceId = items[0].price.id;
      const credits = PADDLE_CREDITS[priceId] || 0;

      if (credits > 0) {
        // Add credits to user account
        const { data: existingCredit } = await supabaseAdmin
          .from('credits')
          .select('*')
          .eq('email', email)
          .single();

        if (existingCredit) {
          // Update existing record
          await supabaseAdmin
            .from('credits')
            .update({
              credits_remaining: existingCredit.credits_remaining + credits,
              updated_at: new Date().toISOString(),
            })
            .eq('email', email);
        } else {
          // Create new record
          await supabaseAdmin
            .from('credits')
            .insert({
              email,
              credits_remaining: credits,
              trial_used: false,
            });
        }

        // Update daily stats
        const today = new Date().toISOString().split('T')[0];
        const amount = items[0].totals.total / 100; // Convert cents to dollars

        const { data: existingStats } = await supabaseAdmin
          .from('daily_stats')
          .select('*')
          .eq('date', today)
          .single();

        if (existingStats) {
          await supabaseAdmin
            .from('daily_stats')
            .update({
              revenue: existingStats.revenue + amount,
              signups: existingStats.signups + 1,
            })
            .eq('date', today);
        } else {
          await supabaseAdmin
            .from('daily_stats')
            .insert({
              date: today,
              revenue: amount,
              signups: 1,
              scripts_analyzed: 0,
              refunds: 0,
            });
        }

        // Send confirmation email
        await sendPurchaseConfirmationEmail(email, credits);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
