import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import BlogComments from '@/components/BlogComments';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await supabaseAdmin
    .from('content_queue')
    .select('*')
    .eq('platform', 'blog')
    .eq('slug', slug)
    .eq('status', 'posted')
    .single();

  if (!post) {
    return {
      title: 'Post Not Found | ScriptScope',
    };
  }

  return {
    title: `${post.title} | ScriptScope Blog`,
    description: post.meta_description || post.content.substring(0, 155),
    keywords: post.seo_keywords || [],
    openGraph: {
      title: post.title,
      description: post.meta_description || post.content.substring(0, 155),
      url: `https://scriptscope.online/blog/${slug}`,
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: post } = await supabaseAdmin
    .from('content_queue')
    .select('*')
    .eq('platform', 'blog')
    .eq('slug', slug)
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
          {post.content.split('\n\n').map((paragraph: string, idx: number) => {
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-2xl font-bold text-[#1E3A5F] mt-8 mb-4">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            return (
              <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>

        <BlogComments postId={post.id} />
      </article>
    </div>
  );
}
