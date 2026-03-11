import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// POST /api/upvotes — toggle upvote for authenticated user
// body: { commentId: string }
// returns: { upvoted: boolean, count: number }
export async function POST(req: NextRequest) {
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
  const commentId = body.commentId;
  if (!commentId) {
    return NextResponse.json({ error: 'commentId required' }, { status: 400 });
  }

  // Check if user already upvoted this comment
  // Gracefully handles missing comment_upvotes table
  let existing: any = null;
  try {
    const { data } = await supabaseAdmin
      .from('comment_upvotes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();
    existing = data;
  } catch {
    return NextResponse.json({ error: 'Upvotes not yet available' }, { status: 503 });
  }

  let upvoted: boolean;

  if (existing) {
    // Remove upvote
    await supabaseAdmin
      .from('comment_upvotes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id);
    upvoted = false;
  } else {
    // Add upvote
    await supabaseAdmin
      .from('comment_upvotes')
      .insert({ comment_id: commentId, user_id: user.id });
    upvoted = true;
  }

  // Return new count
  const { count } = await supabaseAdmin
    .from('comment_upvotes')
    .select('id', { count: 'exact', head: true })
    .eq('comment_id', commentId);

  return NextResponse.json({ upvoted, count: count ?? 0 });
}
