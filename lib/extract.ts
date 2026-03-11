export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {

    // pdf-parse is declared as serverExternalPackages in next.config.ts so it
    // resolves from node_modules at runtime (works in both dev and production).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');

    const data = await pdfParse(buffer);


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
