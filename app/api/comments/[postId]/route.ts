import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// GET /api/comments/[postId] — public, uses admin client to bypass RLS
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;

  const { data, error } = await supabaseAdmin
    .from('blog_comments')
    .select('id, author_name, content, created_at, user_id, persona_id, parent_comment_id, ai_personas(avatar_url, username)')
    .eq('post_id', postId)
    .lte('created_at', new Date().toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    // Fallback: parent_comment_id column may not exist yet (pending migration)
    if (error.message?.includes('parent_comment_id')) {
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('blog_comments')
        .select('id, author_name, content, created_at, user_id, persona_id, ai_personas(avatar_url, username)')
        .eq('post_id', postId)
        .lte('created_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (fallbackError) {
        console.error('Comments fetch error:', fallbackError);
        return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
      }

      const ownerUserId = process.env.OWNER_USER_ID;
      return NextResponse.json((fallbackData ?? []).map((c) => ({
        ...c,
        parent_comment_id: null,
        is_owner: !!(ownerUserId && c.user_id === ownerUserId),
        is_script_doctor: (c.ai_personas as any)?.username === 'scriptdoctor',
        upvote_count: 0,
        user_upvoted: false,
      })));
    }
    console.error('Comments fetch error:', error);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }

  const comments = data ?? [];

  // Fetch upvote counts for all comments in one query
  let upvoteMap: Record<string, number> = {};
  let userUpvotedSet: Set<string> = new Set();

  if (comments.length > 0) {
    const commentIds = comments.map((c) => c.id);

    // Gracefully handle missing comment_upvotes table (pending migration)
    try {
      const { data: upvotes } = await supabaseAdmin
        .from('comment_upvotes')
        .select('comment_id')
        .in('comment_id', commentIds);

      for (const u of upvotes ?? []) {
        upvoteMap[u.comment_id] = (upvoteMap[u.comment_id] || 0) + 1;
      }
    } catch { /* upvotes table not yet created */ }

    // If user is authenticated, also return which comments they've upvoted
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (token) {
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data: { user } } = await anonClient.auth.getUser(token);
      if (user) {
        try {
          const { data: userUpvotes } = await supabaseAdmin
            .from('comment_upvotes')
            .select('comment_id')
            .eq('user_id', user.id)
            .in('comment_id', commentIds);
          for (const u of userUpvotes ?? []) {
            userUpvotedSet.add(u.comment_id);
          }
        } catch { /* upvotes table not yet created */ }
      }
    }
  }

  const ownerUserId = process.env.OWNER_USER_ID;
  const annotated = comments.map((c) => ({
    ...c,
    is_owner: !!(ownerUserId && c.user_id === ownerUserId),
    is_script_doctor: (c.ai_personas as any)?.username === 'scriptdoctor',
    upvote_count: upvoteMap[c.id] || 0,
    user_upvoted: userUpvotedSet.has(c.id),
  }));

  return NextResponse.json(annotated);
}

// POST /api/comments/[postId] — requires auth, uses admin client to insert
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;

  // Verify user session using the anon client + JWT from Authorization header
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const content = body.content?.trim();
  const parentCommentId = body.parent_comment_id ?? null;

  if (!content) {
    return NextResponse.json({ error: 'Content required' }, { status: 400 });
  }

  // Get display name from users table
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('name, email')
    .eq('id', user.id)
    .single();

  const authorName =
    userData?.name ||
    userData?.email?.split('@')[0] ||
    user.email?.split('@')[0] ||
    'Anonymous';

  const insertPayload: Record<string, any> = {
    post_id: postId,
    user_id: user.id,
    author_name: authorName,
    content,
  };
  if (parentCommentId) insertPayload.parent_comment_id = parentCommentId;

  const { data, error } = await supabaseAdmin
    .from('blog_comments')
    .insert(insertPayload)
    .select('id, author_name, content, created_at, user_id, persona_id, parent_comment_id, ai_personas(avatar_url, username)')
    .single();

  if (error) {
    console.error('Comment insert error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }

  const ownerUserId = process.env.OWNER_USER_ID;
  return NextResponse.json({
    ...data,
    is_owner: !!(ownerUserId && user.id === ownerUserId),
    is_script_doctor: false,
    upvote_count: 0,
    user_upvoted: false,
  }, { status: 201 });
}
