import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { LS_VARIANTS } from '@/lib/lemonsqueezy';
import {
  sendPurchaseConfirmationEmail,
  sendVIPConfirmationEmail,
  sendOwnerPurchaseNotification,
} from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature');
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!secret || !signature) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    if (expected !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventName = event.meta?.event_name;

    if (eventName !== 'order_created') {
      return NextResponse.json({ received: true });
    }

    const order = event.data?.attributes;
    if (order?.status !== 'paid') {
      return NextResponse.json({ received: true });
    }

    const email: string = order.user_email;
    const variantId: number = event.data?.relationships?.variant?.data?.id
      ? parseInt(event.data.relationships.variant.data.id)
      : 0;
    const amount: number = (order.total ?? 0) / 100;
    // scriptId passed through checkout custom data
    const scriptId: string | undefined = event.meta?.custom_data?.script_id;

    // Find the plan by variant ID
    const planEntry = Object.entries(LS_VARIANTS).find(
      ([, v]) => v.variantId === variantId,
    );
    if (!planEntry) {
      console.error('[LS webhook] Unknown variant:', variantId);
      return NextResponse.json({ received: true });
    }
    const [, plan] = planEntry;

    // Credit the user
    const { data: existing } = await supabaseAdmin
      .from('credits')
      .select('credits_remaining')
      .eq('email', email)
      .single();

    if (existing) {
      await supabaseAdmin
        .from('credits')
        .update({
          credits_remaining: existing.credits_remaining + plan.credits,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);
    } else {
      await supabaseAdmin
        .from('credits')
        .insert({ email, credits_remaining: plan.credits, trial_used: true });
    }

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    const { data: stats } = await supabaseAdmin
      .from('daily_stats')
      .select('revenue, signups')
      .eq('date', today)
      .single();

    if (stats) {
      await supabaseAdmin
        .from('daily_stats')
        .update({ revenue: stats.revenue + amount, signups: stats.signups + 1 })
        .eq('date', today);
    } else {
      await supabaseAdmin
        .from('daily_stats')
        .insert({ date: today, revenue: amount, signups: 1, scripts_analyzed: 0, refunds: 0 });
    }

    // Trigger analysis automatically if a scriptId was passed through checkout
    if (scriptId && !plan.isVip) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://scriptscope.online';
      fetch(`${appUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId,
          email,
          internalSecret: process.env.CRON_SECRET,
        }),
      }).catch(err => console.error('[LS webhook] Analyze trigger failed:', err));
    }

    // Send emails
    const payerName = order.user_name || 'Customer';
    if (plan.isVip) {
      sendVIPConfirmationEmail(email).catch(console.error);
    } else {
      sendPurchaseConfirmationEmail(email, plan.credits).catch(console.error);
    }
    sendOwnerPurchaseNotification(
      payerName, email, plan.name, amount, new Date().toISOString(),
    ).catch(console.error);

    console.log(`[LS webhook] Order complete: ${email} → ${plan.name}${scriptId ? ` (auto-analyzing script ${scriptId})` : ''}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[LS webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
