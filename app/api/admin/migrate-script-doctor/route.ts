import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/admin/migrate-script-doctor
// Converts all existing owner (Ariel W.) comments to use the Script Doctor persona.
// Protected by ADMIN_PASSWORD.
export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  if (secret !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ownerUserId = process.env.OWNER_USER_ID;
  if (!ownerUserId) {
    return NextResponse.json({ error: 'OWNER_USER_ID not set' }, { status: 500 });
  }

  // Find Script Doctor persona
  const { data: scriptDoctor } = await supabaseAdmin
    .from('ai_personas')
    .select('id')
    .eq('username', 'scriptdoctor')
    .single();

  if (!scriptDoctor) {
    return NextResponse.json({ error: 'Script Doctor persona not found — run setup-blog first' }, { status: 404 });
  }

  // Update all owner comments to use Script Doctor persona
  const { data, error } = await supabaseAdmin
    .from('blog_comments')
    .update({
      persona_id: scriptDoctor.id,
      user_id: null,
      author_name: 'Script Doctor',
    })
    .eq('user_id', ownerUserId)
    .select('id');

  if (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    migrated: data?.length ?? 0,
    message: `Converted ${data?.length ?? 0} Ariel W. comments to Script Doctor`,
  });
}
