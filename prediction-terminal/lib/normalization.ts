/**
 * Normalisation helpers used across the analytics modules.
 *
 * All functions are pure and isomorphic: no I/O, no DOM, no Node-only APIs.
 */

/**
 * Min-max scale a Record<string, number> into [0, 1].
 *
 * If all values are equal (including the all-empty case), every output is 0.
 * Non-finite inputs are treated as 0.
 */
export function normalizeScores(
  scores: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  const keys = Object.keys(scores);
  if (keys.length === 0) return out;

  let min = Infinity;
  let max = -Infinity;
  for (const k of keys) {
    const v = Number.isFinite(scores[k]) ? (scores[k] as number) : 0;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min;
  for (const k of keys) {
    const v = Number.isFinite(scores[k]) ? (scores[k] as number) : 0;
    out[k] = span > 0 ? (v - min) / span : 0;
  }
  return out;
}

/**
 * Numerically stable softmax over a Record<string, number>. Output sums to
 * 1.0 (or all equal probabilities when the input is empty/all-equal).
 */
export function softmax(
  scores: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  const keys = Object.keys(scores);
  if (keys.length === 0) return out;

  let max = -Infinity;
  for (const k of keys) {
    const v = Number.isFinite(scores[k]) ? (scores[k] as number) : 0;
    if (v > max) max = v;
  }
  if (!Number.isFinite(max)) max = 0;

  let total = 0;
  const exps: Record<string, number> = {};
  for (const k of keys) {
    const v = Number.isFinite(scores[k]) ? (scores[k] as number) : 0;
    const e = Math.exp(v - max);
    exps[k] = e;
    total += e;
  }
  if (total <= 0 || !Number.isFinite(total)) {
    const equal = 1 / keys.length;
    for (const k of keys) out[k] = equal;
    return out;
  }
  for (const k of keys) out[k] = exps[k] / total;
  return out;
}

/**
 * Clamp a scalar to [0, 1]. Non-finite inputs collapse to 0.
 */
export function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
