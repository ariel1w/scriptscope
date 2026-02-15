import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, imdbUrl, testimonial } = await request.json();

    // Validate inputs
    if (!email || !imdbUrl || !testimonial) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Validate IMDB URL
    if (!imdbUrl.startsWith('https://www.imdb.com/name/')) {
      return NextResponse.json(
        { error: 'Invalid IMDB URL. Must start with https://www.imdb.com/name/' },
        { status: 400 }
      );
    }

    // Validate testimonial length
    if (testimonial.length > 280) {
      return NextResponse.json(
        { error: 'Testimonial must be 280 characters or less' },
        { status: 400 }
      );
    }

    // Check if IMDB URL already exists
    const { data: existingReview } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('imdb_url', imdbUrl)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'This IMDB profile has already submitted a review' },
        { status: 400 }
      );
    }

    // Create review
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        email,
        imdb_url: imdbUrl,
        testimonial,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Review creation error:', error);
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully! We\'ll review it and grant your free credit soon.',
      review,
    });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabaseAdmin.from('reviews').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data: reviews, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Reviews fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
