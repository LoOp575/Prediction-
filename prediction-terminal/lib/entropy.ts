import type { Draw } from "@/types";
import { clamp01 } from "@/lib/normalization";

/**
 * Entropy / repetition / noise helpers feeding the E, R, N stabiliser terms
 * of the interaction-mathematics engine (lib/intelligence.ts).
 *
 * All outputs are normalised to [0,1] so they slot directly into the
 * (1+E)(1+R)(1+N) denominator factors. Output is probabilistic
 * intelligence, NOT deterministic prediction.
 */

const DIGIT_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const LOG2_TEN = Math.log(10) / Math.log(2);
const REPETITION_DIVISOR = 4;

function flattenDigits(draws: Draw[]): number[] {
  const out: number[] = [];
  if (!Array.isArray(draws)) return out;
  for (const draw of draws) {
    if (!draw || !Array.isArray(draw.digits)) continue;
    for (const d of draw.digits) {
      if (Number.isFinite(d)) {
        const i = Math.trunc(d as number);
        if (i >= 0 && i <= 9) out.push(i);
      }
    }
  }
  return out;
}

function emptyDigitMap(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of DIGIT_KEYS) out[k] = 0;
  return out;
}

/**
 * Shannon entropy of the global digit distribution, divided by log2(10) so
 * the result lives in [0,1]. 1 = uniform, 0 = single digit.
 */
export function computeEntropy(draws: Draw[]): number {
  const seq = flattenDigits(draws);
  if (seq.length === 0) return 0;
  const counts = emptyDigitMap();
  for (const d of seq) counts[String(d)] += 1;
  const total = seq.length;
  let h = 0;
  for (const k of DIGIT_KEYS) {
    const p = counts[k] / total;
    if (p > 0) h -= p * (Math.log(p) / Math.log(2));
  }
  const norm = h / LOG2_TEN;
  return clamp01(Number.isFinite(norm) ? norm : 0);
}

/**
 * Per-digit repetition risk in [0,1]. Counts the run length of consecutive
 * appearances at the END of the flattened sequence, divided by 4 and
 * clamped. A digit that just repeated three times in a row gets 0.75;
 * digits that did not appear in the trailing run get 0.
 */
export function computeRepetitionRisk(draws: Draw[]): Record<string, number> {
  const out = emptyDigitMap();
  const seq = flattenDigits(draws);
  if (seq.length === 0) return out;
  // Walk backwards from the end, count run length per terminating digit.
  // The "end" digit's run length is straightforward; for other digits we
  // record their longest trailing run (the most-recent occurrence backward).
  // For simplicity & spec compliance: the trailing-run length of the LAST
  // digit gets credited to that digit, and any digit not in that run is 0.
  const last = seq[seq.length - 1];
  let run = 1;
  for (let i = seq.length - 2; i >= 0; i -= 1) {
    if (seq[i] === last) run += 1;
    else break;
  }
  out[String(last)] = clamp01(run / REPETITION_DIVISOR);
  return out;
}

/**
 * Global noise score in [0,1]. 1 = highly noisy / no autocorrelation,
 * 0 = perfectly deterministic. Computed as 1 - |lag-1 autocorrelation| of
 * the flattened digit sequence, treated as numbers in [0,9].
 */
export function computeNoiseScore(draws: Draw[]): number {
  const seq = flattenDigits(draws);
  if (seq.length < 3) return 1;
  const n = seq.length;
  let mean = 0;
  for (const x of seq) mean += x;
  mean /= n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n - 1; i += 1) {
    num += (seq[i] - mean) * (seq[i + 1] - mean);
  }
  for (let i = 0; i < n; i += 1) {
    den += (seq[i] - mean) * (seq[i] - mean);
  }
  if (den <= 0 || !Number.isFinite(den)) return 1;
  const r = num / den;
  if (!Number.isFinite(r)) return 1;
  return clamp01(1 - Math.abs(r));
}

/**
 * Per-character Shannon entropy of just the candidate string, normalised
 * to [0,1]. A single repeated digit returns 0; a string with all distinct
 * digits returns 1 for length >= 2.
 */
export function entropyOfNumber(numberStr: string): number {
  if (typeof numberStr !== "string" || numberStr.length === 0) return 0;
  const counts: Record<string, number> = {};
  let total = 0;
  for (const ch of numberStr) {
    if (ch < "0" || ch > "9") continue;
    counts[ch] = (counts[ch] ?? 0) + 1;
    total += 1;
  }
  if (total === 0) return 0;
  if (total === 1) return 0;
  let h = 0;
  for (const k of Object.keys(counts)) {
    const p = counts[k] / total;
    if (p > 0) h -= p * (Math.log(p) / Math.log(2));
  }
  // Normalise by log2(min(total, 10)) so a length-N string of all-distinct
  // digits maps to 1.0.
  const distinct = Object.keys(counts).length;
  if (distinct <= 1) return 0;
  const max = Math.log(Math.min(total, 10)) / Math.log(2);
  if (max <= 0 || !Number.isFinite(max)) return 0;
  return clamp01(h / max);
}
