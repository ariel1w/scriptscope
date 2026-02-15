/**
 * Attempts to repair common JSON formatting issues
 */
export function repairJSON(jsonString: string): string {
  let repaired = jsonString;

  // Remove any text before the first {
  const firstBrace = repaired.indexOf('{');
  if (firstBrace > 0) {
    repaired = repaired.substring(firstBrace);
  }

  // Remove any text after the last }
  const lastBrace = repaired.lastIndexOf('}');
  if (lastBrace !== -1 && lastBrace < repaired.length - 1) {
    repaired = repaired.substring(0, lastBrace + 1);
  }

  // Fix common issues
  repaired = repaired
    // Remove trailing commas before closing braces/brackets
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing commas between properties (common AI mistake)
    .replace(/"\s*\n\s*"/g, '",\n"')
    // Fix array closed with } instead of ] (look for string followed by },\n"property)
    .replace(/("\s*\n\s*)\},(\s*\n\s*")/g, '$1],$2')
    // Remove comments (shouldn't be in JSON but sometimes AI adds them)
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  return repaired;
}

/**
 * Attempts to parse JSON with multiple strategies
 */
export function parseJSON(text: string): any {
  // Strategy 1: Try direct parse
  try {
    return JSON.parse(text);
  } catch (e1) {
    console.log('[JSON] Direct parse failed, attempting repair...');

    // Strategy 2: Try with repair
    try {
      const repaired = repairJSON(text);
      return JSON.parse(repaired);
    } catch (e2) {
      console.log('[JSON] Repair failed, trying to extract valid portion...');

      // Strategy 3: Try to find the longest valid JSON substring
      try {
        return extractValidJSON(text);
      } catch (e3) {
        console.error('[JSON] All parsing strategies failed');
        console.error('[JSON] Original error:', (e1 as Error).message);
        console.error('[JSON] Text length:', text.length);
        console.error('[JSON] First 500 chars:', text.substring(0, 500));
        console.error('[JSON] Last 500 chars:', text.substring(Math.max(0, text.length - 500)));

        // Save the problematic JSON for debugging
        if (typeof window === 'undefined') {
          const fs = require('fs');
          const path = require('path');
          const debugPath = path.join(process.cwd(), 'debug-json-error.txt');
          fs.writeFileSync(debugPath, text, 'utf8');
          console.error('[JSON] Saved problematic JSON to:', debugPath);
        }

        throw new Error(`Failed to parse JSON: ${(e1 as Error).message}`);
      }
    }
  }
}

/**
 * Attempts to extract valid JSON by progressively removing content from the end
 */
function extractValidJSON(text: string): any {
  // Try to find matching braces
  let openBraces = 0;
  let closeBraces = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') openBraces++;
      if (char === '}') closeBraces++;

      // Found a complete object
      if (openBraces > 0 && openBraces === closeBraces) {
        const validJSON = text.substring(0, i + 1);
        try {
          return JSON.parse(validJSON);
        } catch (e) {
          // Continue searching
        }
      }
    }
  }

  throw new Error('Could not extract valid JSON');
}

/**
 * Validates if a JSON object has required fields
 */
export function validateAnalysisJSON(obj: any): boolean {
  // Check for essential top-level fields
  const requiredFields = ['summary', 'classification', 'characters'];
  const hasRequiredFields = requiredFields.every(field => obj.hasOwnProperty(field));

  if (!hasRequiredFields) {
    console.warn('[JSON] Missing required fields:', requiredFields.filter(f => !obj.hasOwnProperty(f)));
    return false;
  }

  return true;
}
