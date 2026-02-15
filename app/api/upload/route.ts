import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractTextFromPDF, extractTextFromTXT, getScriptTitle } from '@/lib/extract';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const email = formData.get('email') as string;

    if (!file || !email) {
      return NextResponse.json({ error: 'Missing file or email' }, { status: 400 });
    }

    // Get user session
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text based on file type
    let text: string;
    let pageCount: number;

    if (file.type === 'application/pdf') {
      const result = await extractTextFromPDF(buffer);
      text = result.text;
      pageCount = result.pageCount;
    } else if (file.type === 'text/plain') {
      const result = extractTextFromTXT(buffer);
      text = result.text;
      pageCount = result.pageCount;
    } else {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Extract title
    const title = getScriptTitle(text);

    // Validate script length (max ~110 pages for complete analysis)
    const MAX_CHARS = 165000; // ~110 pages (allows full scripts through ~105 pages)
    const MAX_PAGES = 150;

    if (text.length > MAX_CHARS) {
      console.log(`[Upload] Script too long (${text.length} chars), truncating to ${MAX_CHARS}`);
      text = text.substring(0, MAX_CHARS) + '\n\n[Note: Script truncated at ~110 pages for analysis.]';
    }

    if (pageCount > MAX_PAGES) {
      console.log(`[Upload] Script has ${pageCount} pages, will analyze first ${MAX_PAGES} pages`);
    }

    console.log(`[Upload] Script: ${title}, Pages: ${pageCount}, Characters: ${text.length}`);

    // Create script record
    const { data: script, error } = await supabaseAdmin
      .from('scripts')
      .insert({
        email,
        user_id: userId,
        title,
        file_name: file.name,
        page_count: pageCount,
        status: 'uploaded',
        raw_text: text,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      scriptId: script.id,
      title: script.title,
      pageCount: script.page_count,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
