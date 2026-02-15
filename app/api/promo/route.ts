import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    // Check master code (case insensitive)
    if (code.toLowerCase() === 'arielweisbrod') {
      return NextResponse.json({
        valid: true,
        discount_percent: 100,
      });
    }

    // Validate promo code using database function
    const { data, error } = await supabaseAdmin.rpc('use_promo_code', {
      promo_code: code,
    });

    if (error) {
      console.error('Promo code validation error:', error);
      return NextResponse.json({ error: 'Failed to validate code' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const result = data[0];

    return NextResponse.json({
      valid: result.valid,
      discount_percent: result.discount_percent,
    });
  } catch (error) {
    console.error('Promo code error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
