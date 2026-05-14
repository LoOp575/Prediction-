import type { Draw } from "@/types";

/**
 * Parse user-supplied draw history into Draw[].
 *
 * Accepted shapes:
 *   1. JSON object with a `draws` array (matches data/sample-history.json).
 *   2. JSON array of objects shaped { id, digits } or { id, number }.
 *   3. Plain text: one draw per non-empty line, optional `id,` prefix
 *      followed by digits in any of `1234`, `1 2 3 4`, `1-2-3-4`, `1,2,3,4`.
 *
 * Non-digit characters in the digit segment are silently dropped. Each digit
 * is coerced into [0,9]. Lines without at least one digit are skipped.
 */

interface RawDrawObject {
  id?: unknown;
  digits?: unknown;
  number?: unknown;
}

function coerceDigits(value: unknown): number[] {
  if (Array.isArray(value)) {
    const out: number[] = [];
    for (const entry of value) {
      const n = Number(entry);
      if (Number.isFinite(n)) {
        const i = Math.trunc(n);
        if (i >= 0 && i <= 9) out.push(i);
      }
    }
    return out;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return digitsFromString(String(Math.trunc(Math.abs(value))));
  }
  if (typeof value === "string") {
    return digitsFromString(value);
  }
  return [];
}

function digitsFromString(raw: string): number[] {
  const out: number[] = [];
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      out.push(ch.charCodeAt(0) - 48);
    }
  }
  return out;
}

function fromObject(obj: RawDrawObject, index: number): Draw | null {
  let digits: number[] = [];
  if (obj.digits !== undefined) {
    digits = coerceDigits(obj.digits);
  } else if (obj.number !== undefined) {
    digits = coerceDigits(obj.number);
  }
  if (digits.length === 0) return null;
  const id =
    typeof obj.id === "string" || typeof obj.id === "number"
      ? String(obj.id)
      : `draw-${index + 1}`;
  return { id, digits };
}

function parseFromJson(input: string): Draw[] | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed[0] !== "{" && trimmed[0] !== "[") return null;
  const parsed: unknown = JSON.parse(trimmed);
  if (Array.isArray(parsed)) {
    const out: Draw[] = [];
    parsed.forEach((entry, i) => {
      if (entry && typeof entry === "object") {
        const draw = fromObject(entry as RawDrawObject, i);
        if (draw) out.push(draw);
      } else {
        const digits = coerceDigits(entry);
        if (digits.length > 0) out.push({ id: `draw-${i + 1}`, digits });
      }
    });
    return out;
  }
  if (parsed && typeof parsed === "object") {
    const root = parsed as { draws?: unknown };
    if (Array.isArray(root.draws)) {
      const out: Draw[] = [];
      root.draws.forEach((entry, i) => {
        if (entry && typeof entry === "object") {
          const draw = fromObject(entry as RawDrawObject, i);
          if (draw) out.push(draw);
        }
      });
      return out;
    }
  }
  return null;
}

function parseFromText(input: string): Draw[] {
  const out: Draw[] = [];
  const lines = input.split(/\r?\n/);
  let index = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let id: string | null = null;
    let digitSegment = trimmed;
    // Optional `id,` prefix: only treat as id if the prefix contains a
    // non-digit character (otherwise `1,2,3,4` would lose its first digit).
    const commaIdx = trimmed.indexOf(",");
    if (commaIdx > 0) {
      const head = trimmed.slice(0, commaIdx);
      if (/[^0-9\s]/.test(head)) {
        id = head.trim();
        digitSegment = trimmed.slice(commaIdx + 1);
      }
    }
    const digits = digitsFromString(digitSegment);
    if (digits.length === 0) continue;
    out.push({ id: id ?? `draw-${index + 1}`, digits });
    index += 1;
  }
  return out;
}

/**
 * Strict parser: throws on malformed JSON when the input clearly looks like
 * JSON (starts with `{` or `[`). Returns Draw[] otherwise.
 */
export function parseDrawsStrict(input: string): Draw[] {
  if (typeof input !== "string") {
    throw new TypeError("parseDrawsStrict: input must be a string");
  }
  const trimmed = input.trim();
  if (!trimmed) return [];
  if (trimmed[0] === "{" || trimmed[0] === "[") {
    const json = parseFromJson(trimmed);
    if (json === null) {
      throw new SyntaxError("parseDrawsStrict: JSON did not contain draws");
    }
    return json;
  }
  return parseFromText(trimmed);
}

/**
 * Loose parser: never throws, returns [] on any failure. This is the default
 * `parseDraws` export.
 */
export function parseDrawsLoose(input: string): Draw[] {
  if (typeof input !== "string") return [];
  const trimmed = input.trim();
  if (!trimmed) return [];
  try {
    if (trimmed[0] === "{" || trimmed[0] === "[") {
      const json = parseFromJson(trimmed);
      if (json !== null) return json;
    }
  } catch {
    // fall through to text parsing
  }
  try {
    return parseFromText(trimmed);
  } catch {
    return [];
  }
}

/**
 * Default parser. Loose by design: callers pass arbitrary user input and
 * expect a best-effort Draw[] without exceptions.
 */
export function parseDraws(input: string): Draw[] {
  return parseDrawsLoose(input);
}
