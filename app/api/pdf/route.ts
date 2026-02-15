import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateAnalysisPDF } from '@/lib/pdf';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scriptId = searchParams.get('scriptId');

    if (!scriptId) {
      return NextResponse.json({ error: 'Missing scriptId' }, { status: 400 });
    }

    // Get script with analysis
    const { data: script, error } = await supabaseAdmin
      .from('scripts')
      .select('*')
      .eq('id', scriptId)
      .single();

    if (error || !script) {
      console.error('Script fetch error:', error);
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    if (!script.analysis) {
      return NextResponse.json({ error: 'Analysis not complete' }, { status: 400 });
    }

    // Generate PDF
    const pdfBuffer = await generateAnalysisPDF(script.analysis, script.title);

    // Sanitize title for filename (ASCII-safe for HTTP headers)
    const sanitizedTitle = script.title
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filesystem characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();

    // Return PDF (use regular hyphen for HTTP header compatibility)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ScriptScope - ${sanitizedTitle}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
