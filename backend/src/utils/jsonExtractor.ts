/**
 * Robustly extract JSON from LLM text response.
 * Handles: reasoning models (<think> blocks), markdown fences, leading/trailing text, raw JSON.
 */
export function extractJson<T = unknown>(text: string): T {
  // Strip <think> blocks if present (from reasoning models like DeepSeek R1)
  const textWithoutThink = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strategy 1: Try to find JSON inside markdown code fences
  const fenceMatch = textWithoutThink.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse((fenceMatch[1] || '').trim()) as T;
    } catch {
      /* fall through */
    }
  }

  // Strategy 2: Find first { or [ and last } or ]
  const firstBrace = textWithoutThink.indexOf('{');
  const lastBrace = textWithoutThink.lastIndexOf('}');
  const firstBracket = textWithoutThink.indexOf('[');
  const lastBracket = textWithoutThink.lastIndexOf(']');

  // Check if it's an array or object
  const isArray = firstBracket !== -1 && lastBracket > firstBracket && (firstBrace === -1 || firstBracket < firstBrace);
  const isObject = firstBrace !== -1 && lastBrace > firstBrace && (firstBracket === -1 || firstBrace < firstBracket);

  if (isArray) {
    try {
      return JSON.parse(textWithoutThink.slice(firstBracket, lastBracket + 1)) as T;
    } catch {
      /* fall through */
    }
  } else if (isObject) {
    try {
      return JSON.parse(textWithoutThink.slice(firstBrace, lastBrace + 1)) as T;
    } catch {
      /* fall through */
    }
  }

  // Strategy 3: Try parsing the whole text as-is
  try {
    return JSON.parse(textWithoutThink) as T;
  } catch {
    /* fall through */
  }

  throw new Error(`Failed to extract JSON from LLM response. Cleaned text snippet: ${textWithoutThink.slice(0, 200)}...`);
}
