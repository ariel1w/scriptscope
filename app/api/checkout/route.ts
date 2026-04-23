import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutUrl, LS_VARIANTS } from '@/lib/lemonsqueezy';
import { supabaseAdmin } from '@/lib/supabase';

const FIRST_SCRIPT_DISCOUNT_CODE = 'FIRST10AUTO';

export async function POST(request: NextRequest) {
  try {
    const { variantKey, email, redirectUrl, scriptId } = await request.json();

    if (!variantKey || !email) {
      return NextResponse.json({ error: 'Missing variantKey or email' }, { status: 400 });
    }

    const variant = LS_VARIANTS[variantKey];
    if (!variant) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Auto-apply $10 first-script discount for Single plan
    let discountCode: string | undefined;
    if (variantKey === 'single') {
      const { data: credit } = await supabaseAdmin
        .from('credits')
        .select('trial_used')
        .eq('email', email)
        .single();

      // First-time user: no record or trial_used is false
      if (!credit || !credit.trial_used) {
        discountCode = FIRST_SCRIPT_DISCOUNT_CODE;
      }
    }

    const checkoutUrl = await createCheckoutUrl(variant.variantId, email, redirectUrl, scriptId, discountCode);
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error('[LS checkout] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
