import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateMarketingContent } from '@/lib/claude';
import { MARKETING_PROMPT } from '@/lib/prompts/marketing';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const generated = {
      twitter: 0,
      linkedin: 0,
      blog: 0,
    };

    // Generate 3 tweets for the day
    for (let i = 0; i < 3; i++) {
      try {
        const result = await generateMarketingContent('twitter', MARKETING_PROMPT);
        await supabaseAdmin.from('content_queue').insert({
          platform: 'twitter',
          content: result.content,
          status: 'queued',
        });
        generated.twitter++;
      } catch (error) {
        console.error('Twitter generation error:', error);
      }
    }

    // Generate 1 LinkedIn post
    try {
      const result = await generateMarketingContent('linkedin', MARKETING_PROMPT);
      await supabaseAdmin.from('content_queue').insert({
        platform: 'linkedin',
        content: result.content,
        status: 'queued',
      });
      generated.linkedin++;
    } catch (error) {
      console.error('LinkedIn generation error:', error);
    }

    // Generate 1 blog post (for twice-weekly publishing)
    try {
      const result = await generateMarketingContent('blog', MARKETING_PROMPT);
      await supabaseAdmin.from('content_queue').insert({
        platform: 'blog',
        content: result.content,
        title: result.title,
        slug: result.slug,
        status: 'queued',
      });
      generated.blog++;
    } catch (error) {
      console.error('Blog generation error:', error);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      generated,
    });
  } catch (error) {
    console.error('Marketing generation error:', error);
    return NextResponse.json({ error: 'Marketing generation failed' }, { status: 500 });
  }
}
