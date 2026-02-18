import { NextRequest, NextResponse } from 'next/server';
import { generateBlogPost } from '@/lib/blog-generator';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await generateBlogPost();

    return NextResponse.json({ success: true, message: 'Blog post generated' });
  } catch (error) {
    console.error('Blog generation error:', error);
    return NextResponse.json({ error: 'Failed to generate blog post' }, { status: 500 });
  }
}
