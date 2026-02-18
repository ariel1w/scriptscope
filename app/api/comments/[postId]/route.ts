import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// GET /api/comments/[postId] — public, uses admin client to bypass RLS
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;

  const { data, error } = await supabaseAdmin
    .from('blog_comments')
    .select('id, author_name, content, created_at, user_id, persona_id, ai_personas(avatar_url, username)')
    .eq('post_id', postId)
    .lte('created_at', new Date().toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Comments fetch error:', error);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }

  const ownerUserId = process.env.OWNER_USER_ID;
  const annotated = (data ?? []).map((c) => ({
    ...c,
    is_owner: !!(ownerUserId && c.user_id === ownerUserId),
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

  const { data, error } = await supabaseAdmin
    .from('blog_comments')
    .insert({ post_id: postId, user_id: user.id, author_name: authorName, content })
    .select('id, author_name, content, created_at, user_id, persona_id, ai_personas(avatar_url, username)')
    .single();

  if (error) {
    console.error('Comment insert error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
