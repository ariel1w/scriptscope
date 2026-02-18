import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  // Get published blog posts from content queue
  const { data: posts } = await supabaseAdmin
    .from('content_queue')
    .select('*')
    .eq('platform', 'blog')
    .eq('status', 'posted')
    .order('posted_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A5F] mb-4">ScriptScope Blog</h1>
          <p className="text-lg text-gray-600">
            Insights on screenwriting craft, industry trends, and what readers actually look for.
          </p>
        </div>

        {posts && posts.length > 0 ? (
          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <h2 className="text-2xl font-bold text-[#1E3A5F] mb-2">{post.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-3">{post.content.substring(0, 200)}...</p>
                <div className="text-sm text-gray-500">
                  {post.posted_at && new Date(post.posted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No blog posts yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
