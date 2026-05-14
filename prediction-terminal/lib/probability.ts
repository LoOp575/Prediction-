import type { Draw, PredictionResult } from "@/types";
import { computeFrequency, computePositionalFrequency } from "@/lib/frequency";
import { computeMomentumAcceleration } from "@/lib/momentum";
import { normalizeScores, softmax } from "@/lib/normalization";

/**
 * Per-digit probability ranking.
 *
 * Combines three signals:
 *   - global frequency (50%)
 *   - positional frequency averaged across positions (30%)
 *   - momentum acceleration (20%)
 *
 * Output is probabilistic intelligence, NOT deterministic prediction.
 */

const DIGIT_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const W_FREQ = 0.5;
const W_POS = 0.3;
const W_MOM = 0.2;

function safe(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/**
 * Pre-softmax weighted score per digit. Exposed so the intelligence engine
 * can reuse it for candidate-pool selection without recomputing.
 */
export function combinedDigitWeights(
  draws: Draw[],
): Record<string, number> {
  const freq = computeFrequency(draws);
  const positional = computePositionalFrequency(draws);
  const accel = computeMomentumAcceleration(draws);

  // Average positional frequency across positions.
  const avgPos: Record<string, number> = {};
  for (const k of DIGIT_KEYS) avgPos[k] = 0;
  if (positional.length > 0) {
    for (const slot of positional) {
      for (const k of DIGIT_KEYS) avgPos[k] += safe(slot[k]);
    }
    for (const k of DIGIT_KEYS) avgPos[k] /= positional.length;
  }

  const raw: Record<string, number> = {};
  for (const k of DIGIT_KEYS) {
    raw[k] = W_FREQ * safe(freq[k]) + W_POS * safe(avgPos[k]) + W_MOM * safe(accel[k]);
  }
  return normalizeScores(raw);
}

/**
 * Ranked PredictionResult[] for the ten digits 0..9.
 *
 * Always returns 10 entries. Probabilities sum to 1.0 (within softmax
 * floating-point error). Ranks are 1..10 in descending probability order.
 */
export function computeProbabilityRanking(draws: Draw[]): PredictionResult[] {
  const weights = combinedDigitWeights(draws);
  const probs = softmax(weights);

  const entries: PredictionResult[] = [];
  for (const k of DIGIT_KEYS) {
    entries.push({
      digit: Number(k),
      probability: safe(probs[k]),
      rank: 0,
    });
  }
  entries.sort((a, b) => {
    if (b.probability !== a.probability) return b.probability - a.probability;
    return a.digit - b.digit;
  });
  for (let i = 0; i < entries.length; i += 1) entries[i].rank = i + 1;
  return entries;
}
