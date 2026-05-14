import hkData from "@/data/HK.json";

import { parseDraws } from "@/lib/parser";
import { calculateFrequency } from "@/lib/frequency";
import { calculateTransitions } from "@/lib/transition";
import { generatePredictions } from "@/lib/probability";

export function analyzeHK() {
  const draws = parseDraws(hkData);
  const frequency = calculateFrequency(draws);
  const transitions = calculateTransitions(draws);
  const predictions = generatePredictions(frequency, 20);

  return {
    market: "HK",
    totalDraws: draws.length,
    frequency,
    transitions,
    predictions,
  };
}
