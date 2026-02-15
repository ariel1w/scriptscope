import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { priceId, email } = await request.json();

    if (!priceId || !email) {
      return NextResponse.json({ error: 'Missing priceId or email' }, { status: 400 });
    }

    // TODO: Implement actual Paddle checkout creation
    // For now, return a placeholder
    // In production, you would use Paddle's API to create a checkout session

    const checkoutUrl = `https://buy.paddle.com/checkout?price_id=${priceId}&email=${email}&success_url=${encodeURIComponent(
      process.env.NEXT_PUBLIC_APP_URL + '/analyze?success=true'
    )}`;

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
