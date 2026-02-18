import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const { data: posts } = await supabaseAdmin
    .from('content_queue')
    .select('id, title, slug, content, posted_at, meta_description')
    .eq('platform', 'blog')
    .eq('status', 'posted')
    .order('posted_at', { ascending: false })
    .limit(20);

  // Fetch comment counts for all posts in one query
  const postIds = posts?.map((p) => p.id) ?? [];
  const commentCounts: Record<string, number> = {};

  if (postIds.length > 0) {
    const { data: commentRows } = await supabaseAdmin
      .from('blog_comments')
      .select('post_id')
      .in('post_id', postIds)
      .lte('created_at', new Date().toISOString());

    commentRows?.forEach((row) => {
      commentCounts[row.post_id] = (commentCounts[row.post_id] ?? 0) + 1;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1E3A5F] mb-4">ScriptScope Community</h1>
          <p className="text-lg text-gray-600">
            Screenwriting insights from an{' '}
            <span className="font-bold text-[#c9a962] text-xl">Emmy-winning producer</span>
            {' '}and the writers who use them.
          </p>
        </div>

        {posts && posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => {
              const count = commentCounts[post.id] ?? 0;
              const excerpt = post.meta_description || post.content.substring(0, 160);
              const isNew = post.posted_at &&
                Date.now() - new Date(post.posted_at).getTime() < 24 * 60 * 60 * 1000;

              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-xl font-bold text-[#1E3A5F] leading-snug">{post.title}</h2>
                    {isNew && (
                      <span className="flex-shrink-0 text-xs font-semibold bg-[#c9a962] text-white px-2 py-0.5 rounded-full mt-0.5">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-2">{excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      {post.posted_at && new Date(post.posted_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                      💬 {count} {count === 1 ? 'comment' : 'comments'}
                    </span>
                  </div>
                </Link>
              );
            })}
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
