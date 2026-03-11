'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';

interface PersonaData {
  avatar_url: string;
  username: string;
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  user_id: string | null;
  persona_id: string | null;
  parent_comment_id: string | null;
  is_owner: boolean;
  is_script_doctor: boolean;
  ai_personas: PersonaData | null;
  upvote_count: number;
  user_upvoted: boolean;
}

interface CommentNode {
  comment: Comment;
  replies: Comment[];
}

interface BlogCommentsProps {
  postId: string;
}

function buildCommentTree(comments: Comment[]): CommentNode[] {
  const topLevel: Comment[] = [];
  const repliesMap: Record<string, Comment[]> = {};

  for (const c of comments) {
    if (!c.parent_comment_id) {
      topLevel.push(c);
    } else {
      if (!repliesMap[c.parent_comment_id]) repliesMap[c.parent_comment_id] = [];
      repliesMap[c.parent_comment_id].push(c);
    }
  }

  return topLevel.map((c) => ({ comment: c, replies: repliesMap[c.id] ?? [] }));
}

// ── Avatars ────────────────────────────────────────────────────────────────────

function ScriptDoctorAvatar({ size = 'md' }: { size?: 'md' | 'sm' }) {
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div
      className={`${cls} rounded-full flex-shrink-0 flex items-center justify-center font-bold leading-none`}
      style={{ backgroundColor: '#1E3A5F', color: '#c9a962' }}
    >
      SD
    </div>
  );
}

function Avatar({
  name,
  avatarUrl,
  isOwner,
  size = 'md',
}: {
  name: string;
  avatarUrl?: string | null;
  isOwner?: boolean;
  size?: 'md' | 'sm';
}) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const bgColors = ['#1E3A5F', '#2d6a4f', '#7b2d8b', '#b5451b', '#16a085', '#8e44ad', '#c0392b', '#d35400'];
  const bg = isOwner ? '#c9a962' : bgColors[name.charCodeAt(0) % bgColors.length];
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${cls} rounded-full flex-shrink-0 object-cover`} />;
  }

  return (
    <div
      className={`${cls} rounded-full flex-shrink-0 flex items-center justify-center font-semibold`}
      style={{ backgroundColor: bg, color: isOwner ? '#0a1628' : '#fff' }}
    >
      {initials}
    </div>
  );
}

// ── Date formatting ────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Reply form ─────────────────────────────────────────────────────────────────

interface ReplyFormProps {
  parentAuthor: string;
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
}

function ReplyForm({ parentAuthor, onSubmit, onCancel }: ReplyFormProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pt-1">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Reply to ${parentAuthor}…`}
        rows={3}
        disabled={submitting}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a962] resize-none text-sm bg-white"
      />
      <div className="flex gap-2 mt-1.5">
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="bg-[#1E3A5F] text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-[#152d47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Posting…' : 'Post Reply'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 px-3 py-1.5 rounded-lg text-xs hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Single comment card ────────────────────────────────────────────────────────

interface CommentCardProps {
  comment: Comment;
  user: any;
  session: any;
  onReplyClick?: () => void;
  isReplying?: boolean;
  isReply?: boolean;
  onUpvoteToggle: (commentId: string, upvoted: boolean, newCount: number) => void;
}

function CommentCard({
  comment,
  user,
  session,
  onReplyClick,
  isReplying,
  isReply,
  onUpvoteToggle,
}: CommentCardProps) {
  const [upvoting, setUpvoting] = useState(false);
  const isSD = comment.is_script_doctor;
  const isOwner = comment.is_owner;

  async function handleUpvote() {
    if (!user || !session || upvoting) return;
    setUpvoting(true);
    try {
      const res = await fetch('/api/upvotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ commentId: comment.id }),
      });
      if (res.ok) {
        const { upvoted, count } = await res.json();
        onUpvoteToggle(comment.id, upvoted, count);
      }
    } catch (err) {
      console.error('Upvote error:', err);
    } finally {
      setUpvoting(false);
    }
  }

  // Special background for Script Doctor and Owner at the top-level only
  const cardBg = !isReply && isSD
    ? 'bg-[#eef3fa] border border-[#1E3A5F]/15 rounded-lg px-3 py-2.5 -mx-3'
    : !isReply && isOwner
    ? 'bg-[#fdf7ed] border border-[#c9a962]/30 rounded-lg px-3 py-2.5 -mx-3'
    : '';

  return (
    <div className={cardBg}>
      <div className="flex gap-3">
        {/* Avatar */}
        {isSD ? (
          <ScriptDoctorAvatar size={isReply ? 'sm' : 'md'} />
        ) : (
          <Avatar
            name={comment.author_name}
            avatarUrl={comment.ai_personas?.avatar_url}
            isOwner={isOwner}
            size={isReply ? 'sm' : 'md'}
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Author row */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`font-semibold text-[#1E3A5F] ${isReply ? 'text-xs' : 'text-sm'}`}>
              {comment.author_name}
            </span>
            {isSD && (
              <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#1E3A5F] text-[#c9a962] leading-none">
                Script Doctor
              </span>
            )}
            {isOwner && !isSD && (
              <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-[#c9a962] text-[#0a1628] leading-none">
                Host
              </span>
            )}
            {!isOwner && !isSD && comment.ai_personas?.username && (
              <span className="text-gray-400 text-xs">@{comment.ai_personas.username}</span>
            )}
            <span className="text-gray-400 text-xs ml-auto flex-shrink-0">{formatDate(comment.created_at)}</span>
          </div>

          {/* Body */}
          <p className={`text-gray-700 leading-relaxed whitespace-pre-wrap ${isReply ? 'text-xs' : 'text-sm'}`}>
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            {/* Upvote */}
            <button
              onClick={handleUpvote}
              disabled={!user || upvoting}
              title={user ? (comment.user_upvoted ? 'Remove upvote' : 'Upvote this comment') : 'Sign in to upvote'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all select-none ${
                comment.user_upvoted
                  ? 'bg-[#fdf3d8] border-[#c9a962] text-[#c9a962]'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-[#1E3A5F] hover:text-[#1E3A5F]'
              } ${!user ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
            >
              <span className="text-sm leading-none">▲</span>
              <span>
                {comment.upvote_count > 0
                  ? `${comment.upvote_count} Upvote${comment.upvote_count !== 1 ? 's' : ''}`
                  : 'Upvote'}
              </span>
            </button>

            {/* Reply button — only on top-level comments, not on replies */}
            {!isReply && (
              user ? (
                <button
                  onClick={onReplyClick}
                  className={`text-xs transition-colors ${
                    isReplying ? 'text-[#1E3A5F] font-medium' : 'text-gray-400 hover:text-[#1E3A5F]'
                  }`}
                >
                  {isReplying ? 'Cancel reply' : 'Reply'}
                </button>
              ) : (
                <a href="/login" className="text-xs text-gray-400 hover:text-[#1E3A5F] transition-colors">
                  Reply
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Full thread: parent + replies + reply form ─────────────────────────────────

interface CommentThreadProps {
  node: CommentNode;
  user: any;
  session: any;
  postId: string;
  replyingToId: string | null;
  onReplyToggle: (id: string | null) => void;
  onReplySubmit: (parentId: string, text: string) => Promise<void>;
  onUpvoteToggle: (commentId: string, upvoted: boolean, newCount: number) => void;
}

function CommentThread({
  node,
  user,
  session,
  postId,
  replyingToId,
  onReplyToggle,
  onReplySubmit,
  onUpvoteToggle,
}: CommentThreadProps) {
  const { comment, replies } = node;
  const isReplying = replyingToId === comment.id;
  const hasThread = replies.length > 0 || isReplying;

  return (
    <div>
      {/* Top-level comment */}
      <CommentCard
        comment={comment}
        user={user}
        session={session}
        onReplyClick={() => onReplyToggle(isReplying ? null : comment.id)}
        isReplying={isReplying}
        onUpvoteToggle={onUpvoteToggle}
      />

      {/* Thread: replies + reply form, all grouped under a left border */}
      {hasThread && (
        <div className="mt-2 ml-4 pl-3 border-l-2 border-gray-200 space-y-3">
          {/* Existing replies in order */}
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              user={user}
              session={session}
              isReply
              onUpvoteToggle={onUpvoteToggle}
            />
          ))}

          {/* Reply form at the bottom of the thread */}
          {isReplying && (
            <ReplyForm
              parentAuthor={comment.author_name}
              onSubmit={(text) => onReplySubmit(comment.id, text)}
              onCancel={() => onReplyToggle(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────

export default function BlogComments({ postId }: BlogCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s));
  }, [user]);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    setLoading(true);
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (s?.access_token) headers['Authorization'] = `Bearer ${s.access_token}`;
      const res = await fetch(`/api/comments/${postId}`, { headers });
      if (res.ok) setComments(await res.json());
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
    setLoading(false);
  }

  async function handleNewCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setSubmitting(true);
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) throw new Error('No session');
      const res = await fetch(`/api/comments/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.access_token}` },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const newData = await res.json();
      setComments((prev) => [...prev, newData]);
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplySubmit(parentId: string, text: string) {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s) throw new Error('No session');
    const res = await fetch(`/api/comments/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.access_token}` },
      body: JSON.stringify({ content: text, parent_comment_id: parentId }),
    });
    if (!res.ok) throw new Error(await res.text());
    const reply: Comment = await res.json();
    setComments((prev) => [...prev, reply]);
    setReplyingToId(null);
  }

  function handleUpvoteToggle(commentId: string, upvoted: boolean, newCount: number) {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, upvote_count: newCount, user_upvoted: upvoted } : c))
    );
  }

  const tree = buildCommentTree(comments);
  const topLevelCount = comments.filter((c) => !c.parent_comment_id).length;
  const replyCount = comments.length - topLevelCount;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-xl font-bold text-[#1E3A5F] mb-6">
        {comments.length > 0
          ? `${topLevelCount} Comment${topLevelCount !== 1 ? 's' : ''}${replyCount > 0 ? ` · ${replyCount} repl${replyCount !== 1 ? 'ies' : 'y'}` : ''}`
          : 'Comments'}
      </h3>

      {/* New top-level comment form */}
      {user ? (
        <form onSubmit={handleNewCommentSubmit} className="mb-10">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts…"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a962] resize-none text-sm"
            rows={4}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="mt-2 bg-[#1E3A5F] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#152d47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting…' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">
            <a href="/login" className="text-[#1E3A5F] font-semibold hover:underline">Sign in</a>{' '}
            to join the conversation
          </p>
        </div>
      )}

      {/* Comment threads */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading comments…</div>
      ) : tree.length > 0 ? (
        <div className="space-y-6">
          {tree.map((node) => (
            <CommentThread
              key={node.comment.id}
              node={node}
              user={user}
              session={session}
              postId={postId}
              replyingToId={replyingToId}
              onReplyToggle={setReplyingToId}
              onReplySubmit={handleReplySubmit}
              onUpvoteToggle={handleUpvoteToggle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          No comments yet. Be the first to share your thoughts.
        </div>
      )}
    </div>
  );
}
