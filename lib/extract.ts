export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    console.log('[PDF Extract] Starting PDF extraction...');

    // Use eval require to bypass module resolution issues with Turbopack
    // pdf-parse 1.1.1 exports a function directly
    const pdfParse = eval('require')('pdf-parse');

    console.log('[PDF Extract] Calling pdf-parse...');
    const data = await pdfParse(buffer);

    console.log('[PDF Extract] Extraction complete!');
    console.log('[PDF Extract] Pages:', data.numpages);
    console.log('[PDF Extract] Text length:', data.text.length);

    return {
      text: data.text,
      pageCount: data.numpages,
    };
  } catch (error) {
    console.error('[PDF Extract] Error:', error);
    console.error('[PDF Extract] Error details:', (error as Error).message, (error as Error).stack);
    throw new Error('Failed to extract text from PDF');
  }
}

export function extractTextFromTXT(buffer: Buffer): { text: string; pageCount: number } {
  const text = buffer.toString('utf-8');
  // Rough estimate: 250 words per page, average 5 chars per word
  const estimatedPageCount = Math.ceil(text.length / 1250);
  return {
    text,
    pageCount: estimatedPageCount,
  };
}

export function getScriptTitle(text: string): string {
  // Try to extract title from the first few lines
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // If first line is all caps or quoted, likely the title
    if (firstLine === firstLine.toUpperCase() || /^["'].*["']$/.test(firstLine)) {
      return firstLine.replace(/['"]/g, '');
    }
  }
  return 'Untitled Script';
}
