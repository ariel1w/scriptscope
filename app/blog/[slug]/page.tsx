import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { data: post } = await supabaseAdmin
    .from('content_queue')
    .select('*')
    .eq('platform', 'blog')
    .eq('slug', params.slug)
    .eq('status', 'posted')
    .single();

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <article className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <Link
          href="/blog"
          className="text-[#1E3A5F] hover:underline mb-4 inline-block"
        >
          ← Back to Blog
        </Link>

        <h1 className="text-4xl font-bold text-[#1E3A5F] mb-4">{post.title}</h1>

        <div className="text-sm text-gray-500 mb-8">
          {post.posted_at && new Date(post.posted_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>

        <div className="prose prose-lg max-w-none">
          {post.content.split('\n\n').map((paragraph: string, idx: number) => (
            <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-[#1E3A5F] mb-2">
              Get Professional Script Coverage
            </h3>
            <p className="text-gray-600 mb-4">
              Want detailed feedback on your screenplay? Try ScriptScope for fast, comprehensive analysis.
            </p>
            <Link
              href="/analyze"
              className="bg-[#1E3A5F] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#152d47] transition-colors inline-block"
            >
              Analyze Your Script
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
