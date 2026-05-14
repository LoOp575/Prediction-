// lib/probability.ts

import type { FrequencyResult, PredictionResult } from "@/types";

export function generatePredictions(
  frequency: FrequencyResult[],
  limit = 20
): PredictionResult[] {
  const topDigits = [...frequency]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5)
    .map((item) => item.digit);

  const results: PredictionResult[] = [];

  for (const a of topDigits) {
    for (const b of topDigits) {
      for (const c of topDigits) {
        for (const d of topDigits) {
          const number = `${a}${b}${c}${d}`;

          const score =
            frequency[a].probability *
            frequency[b].probability *
            frequency[c].probability *
            frequency[d].probability;

          results.push({
            number,
            score,
            probability: score,
            reason: "Frequency interaction model",
          });
        }
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
