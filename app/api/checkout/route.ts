import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutUrl, LS_VARIANTS } from '@/lib/lemonsqueezy';

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

    const checkoutUrl = await createCheckoutUrl(variant.variantId, email, redirectUrl, scriptId);
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error('[LS checkout] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
