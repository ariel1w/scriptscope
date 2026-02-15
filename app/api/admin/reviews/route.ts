import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { reviewId, action, password } = await request.json();

    // Verify admin password
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!reviewId || !action) {
      return NextResponse.json({ error: 'Missing reviewId or action' }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get review
    const { data: review, error: fetchError } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.status !== 'pending') {
      return NextResponse.json({ error: 'Review already processed' }, { status: 400 });
    }

    // Update review status
    const { error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        approved_at: action === 'approve' ? new Date().toISOString() : null,
      })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Review update error:', updateError);
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    // If approved, grant 1 credit
    if (action === 'approve') {
      const { data: existingCredit } = await supabaseAdmin
        .from('credits')
        .select('*')
        .eq('email', review.email)
        .single();

      if (existingCredit) {
        await supabaseAdmin
          .from('credits')
          .update({
            credits_remaining: existingCredit.credits_remaining + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('email', review.email);
      } else {
        await supabaseAdmin.from('credits').insert({
          email: review.email,
          credits_remaining: 1,
          trial_used: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Review ${action}d successfully`,
    });
  } catch (error) {
    console.error('Admin review action error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
