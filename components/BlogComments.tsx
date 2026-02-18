'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  user_id: string | null;
}

interface BlogCommentsProps {
  postId: string;
}

export default function BlogComments({ postId }: BlogCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    setLoading(true);
    const { data } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);

    try {
      // Get user's name from users table
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single();

      const authorName = userData?.email?.split('@')[0] || 'Anonymous';

      const { data, error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          author_name: authorName,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setComments([...comments, data]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold text-[#1E3A5F] mb-6">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a962] resize-none"
            rows={4}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="mt-2 bg-[#1E3A5F] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#152d47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            <a href="/login" className="text-[#1E3A5F] font-medium hover:underline">
              Sign in
            </a>{' '}
            to join the conversation
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading comments...</div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-[#1E3A5F]">{comment.author_name}</div>
                <div className="text-sm text-gray-500">{formatDate(comment.created_at)}</div>
              </div>
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No comments yet. Be the first to share your thoughts!
        </div>
      )}
    </div>
  );
}
