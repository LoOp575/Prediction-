/**
 * Interaction-mathematics intelligence engine.
 *
 * The engine adapts the structure of the multi-variable integral
 *
 *     I = integral integral 1 / ((1 - xy)(1 + x)(1 + y)) dx dy
 *
 * into a per-candidate scoring formula
 *
 *     P = (F * PF * T * M * C) / ((1 - FM) * (1 + N) * (1 + R) * (1 + E))
 *
 * where FM = F * M acts as the (1 - xy) interaction-pressure term. F, PF,
 * T, M, C are amplifiers (numerator), and E, R, N are stabilisers
 * (denominator). The (1 - FM) factor is the interaction "pressure" itself
 * and is clamped (FM <= 0.99) so the denominator never collapses to zero.
 *
 * IMPORTANT: this engine produces probabilistic intelligence, NOT
 * deterministic prediction. The notice constant below is surfaced through
 * every IntelligenceReport and through /api/analyze responses so consumers
 * never mistake it for a guarantee.
 */

import type {
  Draw,
  IntelligenceReport,
  InteractionTerms,
  PredictionResult,
  RankedNumber,
} from "@/types";
import { computeFrequency, computePositionalFrequency, digitCountMode } from "@/lib/frequency";
import { computeTransitionMatrix, transitionConfidence } from "@/lib/transition";
import { computeMomentumAcceleration, momentumFor } from "@/lib/momentum";
import { detectDigitClusters, clusterConfidenceForNumber } from "@/lib/cluster";
import {
  computeEntropy,
  computeNoiseScore,
  computeRepetitionRisk,
  entropyOfNumber,
} from "@/lib/entropy";
import { combinedDigitWeights, computeProbabilityRanking } from "@/lib/probability";
import { clamp01, normalizeScores, softmax } from "@/lib/normalization";

/**
 * Probabilistic-intelligence disclaimer surfaced in every report and API
 * response. Do not edit lightly: the contract with consumers is that this
 * notice must contain the words "probabilistic" and signal that this is
 * NOT deterministic prediction.
 */
export const notice =
  "Probabilistic intelligence only. Not deterministic prediction. Output models hidden statistical pressure via interaction mathematics inspired by the multi-variable integral 1/((1-xy)(1+x)(1+y)). Do not use as financial advice.";

const EPS = 1e-9;
const FM_CAP = 0.99;
const DIGIT_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export interface IntelligenceOptions {
  numberLength?: number;
  topK?: number;
  candidatePool?: number;
}

interface EngineContext {
  draws: Draw[];
  numberLength: number;
  freq: Record<string, number>;
  positional: Record<string, number>[];
  matrix: Record<string, Record<string, number>>;
  accel: Record<string, number>;
  cluster: Record<string, number>;
  noise: number;
  repetition: Record<string, number>;
  globalEntropy: number;
  digitWeights: Record<string, number>;
}

function safe(x: number, fallback = 0): number {
  return Number.isFinite(x) ? x : fallback;
}

function geometricMean(values: number[]): number {
  if (!values || values.length === 0) return 0;
  let sumLog = 0;
  for (const v of values) {
    const safeV = Math.max(safe(v), 0);
    sumLog += Math.log(safeV + EPS);
  }
  const m = Math.exp(sumLog / values.length);
  return Number.isFinite(m) ? m : 0;
}

function buildContext(draws: Draw[], numberLength: number): EngineContext {
  const safeDraws = Array.isArray(draws) ? draws : [];
  return {
    draws: safeDraws,
    numberLength,
    freq: computeFrequency(safeDraws),
    positional: computePositionalFrequency(safeDraws, numberLength),
    matrix: computeTransitionMatrix(safeDraws),
    accel: computeMomentumAcceleration(safeDraws),
    cluster: detectDigitClusters(safeDraws),
    noise: computeNoiseScore(safeDraws),
    repetition: computeRepetitionRisk(safeDraws),
    globalEntropy: computeEntropy(safeDraws),
    digitWeights: combinedDigitWeights(safeDraws),
  };
}

/**
 * Compute the full set of interaction terms for one candidate string.
 *
 * F, PF, T, M, C are computed as geometric means of per-digit signals so
 * a weak digit drags the candidate down. FM = clamp(F*M, 0, 0.99) keeps
 * the (1 - FM) denominator finite. R is the worst-case repetition risk
 * across the candidate's digits. E is the candidate's own entropy.
 */
export function computeInteractionTerms(
  numberStr: string,
  ctx: EngineContext,
): InteractionTerms {
  const digits: string[] = [];
  for (const ch of numberStr) {
    if (ch >= "0" && ch <= "9") digits.push(ch);
  }
  if (digits.length === 0) {
    return {
      F: 0,
      PF: 0,
      T: 0,
      M: 0,
      C: 0,
      FM: 0,
      N: clamp01(ctx.noise),
      R: 0,
      E: 0,
      numerator: 0,
      denominator: 1,
    };
  }

  const freqVals = digits.map((d) => safe(ctx.freq[d]));
  const F = clamp01(geometricMean(freqVals));

  const posVals: number[] = [];
  for (let i = 0; i < digits.length; i += 1) {
    const slot = ctx.positional[i];
    posVals.push(slot ? safe(slot[digits[i]]) : 0);
  }
  const PF = clamp01(geometricMean(posVals));

  let T: number;
  if (digits.length < 2) {
    T = 0.1; // single-digit candidates cannot exhibit transitions; use floor
  } else {
    const tVals: number[] = [];
    for (let i = 0; i < digits.length - 1; i += 1) {
      const v = transitionConfidence(ctx.matrix, digits[i], digits[i + 1]);
      tVals.push(safe(v) > 0 ? v : 0.1); // 0.1 fallback when row is empty
    }
    T = clamp01(geometricMean(tVals));
  }

  const accelVals = digits.map((d) => momentumFor(d, ctx.accel));
  const M = clamp01(geometricMean(accelVals));

  const C = clamp01(clusterConfidenceForNumber(numberStr, ctx.cluster));

  const fmRaw = F * M;
  const FM = Math.min(Math.max(safe(fmRaw), 0), FM_CAP);

  const N = clamp01(ctx.noise);

  let R = 0;
  for (const d of digits) {
    const r = safe(ctx.repetition[d]);
    if (r > R) R = r;
  }
  R = clamp01(R);

  const E = clamp01(entropyOfNumber(numberStr));

  const numerator = F * PF * T * M * C;
  const denominator = (1 - FM) * (1 + N) * (1 + R) * (1 + E);
  const safeDenom = denominator > 0 && Number.isFinite(denominator) ? denominator : EPS;

  return {
    F,
    PF,
    T,
    M,
    C,
    FM,
    N,
    R,
    E,
    numerator: safe(numerator),
    denominator: safeDenom,
  };
}

/**
 * Enumerate every digit string of the given length. Refuses to produce
 * more than 10^4 = 10000 entries to avoid combinatorial blow-up; the main
 * engine path uses generateCandidates() instead.
 */
export function enumerateAllCandidates(numberLength: number): string[] {
  const len = Math.max(1, Math.trunc(numberLength) || 0);
  if (len > 4) return [];
  const out: string[] = [];
  const total = Math.pow(10, len);
  for (let i = 0; i < total; i += 1) out.push(i.toString().padStart(len, "0"));
  return out;
}

/**
 * Produce a bounded candidate list using a digit-pool strategy.
 *
 * 1. Pick the top digits by combined weight (probability.ts).
 * 2. Pool size = min(10, max(numberLength, ceil(candidatePool^(1/length))*2,
 *    ceil(sqrt(candidatePool))))
 * 3. Cartesian product over `numberLength` positions, deduplicated.
 * 4. Sorted by per-position positional-frequency product as a cheap
 *    pre-rank, trimmed to candidatePool.
 */
export function generateCandidates(
  ctx: EngineContext,
  options: Required<IntelligenceOptions>,
): string[] {
  const len = Math.max(1, Math.trunc(options.numberLength));
  const pool = Math.max(1, Math.trunc(options.candidatePool));

  const expansionCap = Math.max(
    Math.ceil(Math.pow(pool, 1 / len)) * 2,
    Math.ceil(Math.sqrt(pool)),
  );
  const poolSize = Math.min(10, Math.max(len, expansionCap));

  // Rank digits by combinedDigitWeights, ties broken by global frequency.
  const digitsRanked = [...DIGIT_KEYS].sort((a, b) => {
    const wa = safe(ctx.digitWeights[a]);
    const wb = safe(ctx.digitWeights[b]);
    if (wb !== wa) return wb - wa;
    return safe(ctx.freq[b]) - safe(ctx.freq[a]);
  });
  const selected = digitsRanked.slice(0, poolSize);

  // Enumerate Cartesian product. With poolSize <= 10 and len <= 4 the
  // upper bound is 10^4 = 10000, well within memory.
  const combos: string[] = [];
  const indices = new Array(len).fill(0);
  const guard = Math.pow(poolSize, len);
  if (!Number.isFinite(guard) || guard > 10000) {
    // Length too large to enumerate even from a pool; fall back to a
    // straight permutation of the top digits.
    for (let i = 0; i < Math.min(pool, selected.length); i += 1) {
      combos.push(selected[i].repeat(len));
    }
  } else {
    while (true) {
      let s = "";
      for (let i = 0; i < len; i += 1) s += selected[indices[i]];
      combos.push(s);
      // increment
      let pos = len - 1;
      while (pos >= 0) {
        indices[pos] += 1;
        if (indices[pos] < selected.length) break;
        indices[pos] = 0;
        pos -= 1;
      }
      if (pos < 0) break;
    }
  }

  // Deduplicate while preserving order.
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const c of combos) {
    if (!seen.has(c)) {
      seen.add(c);
      unique.push(c);
    }
  }

  // Pre-rank by positional-frequency product.
  const scored = unique.map((numStr) => {
    let prod = 1;
    for (let i = 0; i < numStr.length; i += 1) {
      const slot = ctx.positional[i];
      const v = slot ? safe(slot[numStr[i]]) : 0;
      prod *= v + EPS;
    }
    return { numStr, prod };
  });
  scored.sort((a, b) => {
    if (b.prod !== a.prod) return b.prod - a.prod;
    return a.numStr < b.numStr ? -1 : 1;
  });

  const trimmed = scored.slice(0, pool).map((e) => e.numStr);
  return trimmed.length > 0 ? trimmed : unique.slice(0, pool);
}

/**
 * Reason-string composer. Picks the top 2 amplifiers from {F,PF,T,M,C}
 * and the lowest stabiliser from {E,R,N} and assembles a deterministic
 * sentence. No randomness.
 */
const AMP_LABELS: Record<string, string> = {
  F: "frequency presence",
  PF: "positional alignment",
  T: "transition confidence",
  M: "momentum acceleration",
  C: "cluster cohesion",
};
const STAB_LABELS: Record<string, string> = {
  E: "entropy",
  R: "repetition risk",
  N: "noise",
};

export function reasonFor(terms: InteractionTerms): string {
  const amps: Array<[string, number]> = [
    ["F", safe(terms.F)],
    ["PF", safe(terms.PF)],
    ["T", safe(terms.T)],
    ["M", safe(terms.M)],
    ["C", safe(terms.C)],
  ];
  amps.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0] < b[0] ? -1 : 1;
  });
  const stabs: Array<[string, number]> = [
    ["E", safe(terms.E)],
    ["R", safe(terms.R)],
    ["N", safe(terms.N)],
  ];
  stabs.sort((a, b) => {
    if (a[1] !== b[1]) return a[1] - b[1];
    return a[0] < b[0] ? -1 : 1;
  });

  const amp1 = AMP_LABELS[amps[0][0]];
  const amp2 = AMP_LABELS[amps[1][0]];
  const stab = STAB_LABELS[stabs[0][0]];
  return `Strong ${amp1} with ${amp2} and low ${stab}.`;
}

/**
 * Main entry point. Build context, generate candidates, score every
 * candidate via the interaction formula, then return a ranked report.
 *
 * Probabilistic intelligence, NOT deterministic prediction.
 */
export function rankByInteraction(
  draws: Draw[],
  options?: IntelligenceOptions,
): IntelligenceReport {
  const safeDraws = Array.isArray(draws) ? draws : [];
  const numberLength = Math.max(
    1,
    Math.trunc(
      options?.numberLength && options.numberLength > 0
        ? options.numberLength
        : digitCountMode(safeDraws) || 4,
    ),
  );
  const topK = Math.max(1, Math.trunc(options?.topK ?? 10));
  const candidatePool = Math.max(
    topK,
    Math.trunc(options?.candidatePool ?? Math.max(50, topK * 5)),
  );

  const ctx = buildContext(safeDraws, numberLength);
  const opts: Required<IntelligenceOptions> = {
    numberLength,
    topK,
    candidatePool,
  };

  const candidateStrings = generateCandidates(ctx, opts);

  // Score every candidate. rawScores keyed by candidate string for softmax.
  const termsByNumber: Record<string, InteractionTerms> = {};
  const rawScores: Record<string, number> = {};
  for (const numStr of candidateStrings) {
    const terms = computeInteractionTerms(numStr, ctx);
    termsByNumber[numStr] = terms;
    const denomSafe = terms.denominator > 0 ? terms.denominator : EPS;
    let raw = terms.numerator / denomSafe;
    if (!Number.isFinite(raw)) raw = 0;
    rawScores[numStr] = raw;
  }

  const scoreNorm = normalizeScores(rawScores);
  const probabilities = softmax(rawScores);

  const ranked: RankedNumber[] = candidateStrings.map((numStr) => {
    const terms = termsByNumber[numStr];
    const fmRaw = terms.F * terms.M;
    const fm = Math.min(Math.max(safe(fmRaw), 0), FM_CAP);
    const pressure = clamp01(fm / (1 - fm + EPS));
    const score = clamp01(safe(scoreNorm[numStr]));
    const probability = clamp01(safe(probabilities[numStr]));
    const entropy = clamp01(safe(terms.E));
    return {
      number: numStr,
      interactionPressure: pressure,
      entropy,
      score,
      probability,
      reason: reasonFor(terms),
      rank: 0,
    };
  });

  ranked.sort((a, b) => {
    if (b.probability !== a.probability) return b.probability - a.probability;
    if (b.score !== a.score) return b.score - a.score;
    return a.number < b.number ? -1 : 1;
  });
  for (let i = 0; i < ranked.length; i += 1) ranked[i].rank = i + 1;

  const top = ranked.slice(0, topK);

  const perDigit: PredictionResult[] = computeProbabilityRanking(safeDraws);

  return {
    candidates: top,
    topPick: top[0] ?? null,
    perDigit,
    entropy: clamp01(ctx.globalEntropy),
    generatedAt: new Date().toISOString(),
    notice,
  };
}
