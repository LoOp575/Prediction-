import type { Draw } from "@/types";
import { softmax, clamp01 } from "@/lib/normalization";

/**
 * Digit cluster detection helpers.
 *
 * "Cluster confidence" measures how often a digit co-occurs (within a small
 * sliding window of the flattened digit stream) with neighbours that share
 * its parity (even/odd) AND its half (low 0-4 / high 5-9). Digits that tend
 * to travel with similar digits are considered to have higher cluster
 * cohesion. The output is a probability-shaped distribution (softmax over
 * the raw counts), and a per-candidate aggregator that re-spreads the
 * geometric mean back into [0,1] for use as the C term of the
 * interaction-mathematics engine.
 *
 * Output is probabilistic intelligence, NOT deterministic prediction.
 */

const DIGIT_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const WINDOW_SIZE = 3;
const SHARPNESS_K = 10;

function emptyDigitMap(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of DIGIT_KEYS) out[k] = 0;
  return out;
}

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

function isSimilar(a: number, b: number): boolean {
  // share parity AND share half (0-4 vs 5-9)
  return a % 2 === b % 2 && a < 5 === b < 5;
}

/**
 * Per-digit cluster confidence in [0,1]. Counts how often each digit appears
 * in a sliding window of size 3 alongside another digit that shares parity
 * AND half (low/high). The raw counts are softmaxed so the distribution
 * sums to 1, giving a probability-shaped cluster signal.
 */
export function detectDigitClusters(draws: Draw[]): Record<string, number> {
  const counts = emptyDigitMap();
  const seq = flattenDigits(draws);
  if (seq.length === 0) {
    // softmax on all-zero is uniform 0.1 each - that is fine.
    return softmax(counts);
  }
  for (let i = 0; i < seq.length; i += 1) {
    const center = seq[i];
    const start = Math.max(0, i - WINDOW_SIZE + 1);
    const end = Math.min(seq.length - 1, i + WINDOW_SIZE - 1);
    for (let j = start; j <= end; j += 1) {
      if (j === i) continue;
      if (isSimilar(center, seq[j])) {
        counts[String(center)] += 1;
      }
    }
  }
  return softmax(counts);
}

/**
 * Aggregate per-digit cluster confidence into a single C value for a
 * multi-digit candidate. Uses the geometric mean (numerically stable via
 * log-sum-exp style averaging) and re-spreads the result back into a
 * usable [0,1] range using 1 - exp(-k*x).
 */
export function clusterConfidenceForNumber(
  numberStr: string,
  perDigit: Record<string, number>,
): number {
  if (typeof numberStr !== "string" || numberStr.length === 0) return 0;
  let sumLog = 0;
  let n = 0;
  for (const ch of numberStr) {
    if (ch < "0" || ch > "9") continue;
    const v = perDigit ? perDigit[ch] : undefined;
    const safe = Number.isFinite(v as number) ? (v as number) : 0;
    sumLog += Math.log(safe + 1e-9);
    n += 1;
  }
  if (n === 0) return 0;
  const geo = Math.exp(sumLog / n);
  if (!Number.isFinite(geo) || geo <= 0) return 0;
  // softmax outputs are tiny (~0.1 average across 10 digits); re-spread.
  return clamp01(1 - Math.exp(-SHARPNESS_K * geo));
}
