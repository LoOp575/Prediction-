import type { Draw } from "@/types";

const DIGIT_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

function emptyDigitMap(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of DIGIT_KEYS) out[k] = 0;
  return out;
}

function normaliseInPlace(map: Record<string, number>): Record<string, number> {
  let total = 0;
  for (const k of DIGIT_KEYS) total += map[k];
  if (total <= 0) return map;
  for (const k of DIGIT_KEYS) map[k] = map[k] / total;
  return map;
}

/**
 * Global digit frequency across all draws, normalised so the ten values sum
 * to 1.0 (or all zero if there is no data).
 */
export function computeFrequency(draws: Draw[]): Record<string, number> {
  const out = emptyDigitMap();
  if (!Array.isArray(draws) || draws.length === 0) return out;
  for (const draw of draws) {
    if (!draw || !Array.isArray(draw.digits)) continue;
    for (const d of draw.digits) {
      if (Number.isFinite(d)) {
        const i = Math.trunc(d);
        if (i >= 0 && i <= 9) {
          out[String(i)] += 1;
        }
      }
    }
  }
  return normaliseInPlace(out);
}

/**
 * Modal digit-count of the input. Falls back to 4 (the project's default
 * draw width) when the input is empty.
 */
export function digitCountMode(draws: Draw[]): number {
  if (!Array.isArray(draws) || draws.length === 0) return 4;
  const counts = new Map<number, number>();
  for (const draw of draws) {
    if (!draw || !Array.isArray(draw.digits)) continue;
    const len = draw.digits.length;
    if (len <= 0) continue;
    counts.set(len, (counts.get(len) ?? 0) + 1);
  }
  let best = 4;
  let bestCount = 0;
  for (const [len, c] of counts) {
    if (c > bestCount || (c === bestCount && len > best)) {
      best = len;
      bestCount = c;
    }
  }
  return bestCount > 0 ? best : 4;
}

/**
 * Per-position digit frequency, returning one normalised 10-key map per
 * position. `positions` defaults to digitCountMode(draws).
 */
export function computePositionalFrequency(
  draws: Draw[],
  positions?: number,
): Record<string, number>[] {
  const width =
    typeof positions === "number" && positions > 0
      ? Math.trunc(positions)
      : digitCountMode(draws);
  const buckets: Record<string, number>[] = [];
  for (let p = 0; p < width; p += 1) buckets.push(emptyDigitMap());
  if (!Array.isArray(draws) || draws.length === 0) return buckets;
  for (const draw of draws) {
    if (!draw || !Array.isArray(draw.digits)) continue;
    for (let p = 0; p < width && p < draw.digits.length; p += 1) {
      const d = draw.digits[p];
      if (Number.isFinite(d)) {
        const i = Math.trunc(d);
        if (i >= 0 && i <= 9) {
          buckets[p][String(i)] += 1;
        }
      }
    }
  }
  return buckets.map(normaliseInPlace);
}
