/**
 * Core domain types for the Prediction Market Intelligence Terminal.
 *
 * These types span both the legacy single-digit ranking world and the new
 * interaction-mathematics intelligence engine. The engine output is
 * probabilistic intelligence, NOT deterministic prediction. See
 * lib/intelligence.ts (FEAT-002) for the engine that emits RankedNumber and
 * IntelligenceReport.
 */

/**
 * A single historical draw / observation in the input series.
 */
export interface Draw {
  /** ISO timestamp or arbitrary identifier for ordering. */
  id: string;
  /** Sequence of digits / outcomes that make up this draw. */
  digits: number[];
}

/**
 * Score attached to a single digit by one of the analytical engines.
 */
export interface DigitScore {
  digit: number;
  score: number;
}

/**
 * A ranked prediction produced by the per-digit probability engine.
 * Kept for backward compatibility with the original scaffold; the new
 * interaction engine emits RankedNumber for multi-digit candidates.
 */
export interface PredictionResult {
  digit: number;
  probability: number;
  rank: number;
}

/**
 * A multi-digit candidate produced by the interaction-mathematics engine.
 * Shape matches the user-supplied example output exactly.
 */
export interface RankedNumber {
  /** The candidate as a fixed-width digit string, e.g. "1234". */
  number: string;
  /** F*M / (1 - FM) compressed into [0,1]. Reflects (1-xy) interaction term. */
  interactionPressure: number;
  /** Per-candidate Shannon entropy of its digit string in [0,1]. */
  entropy: number;
  /** Min-max normalised raw interaction score in [0,1]. The top candidate
   *  always reports score === 1 because of the min-max scale - use rawScore
   *  to compare absolute interaction strength across reports. */
  score: number;
  /** Raw F*PF*T*M*C / ((1-FM)(1+N)(1+R)(1+E)) before any normalisation.
   *  Not bounded to [0,1]; can be tiny (e.g. ~1e-10 on no-data input). Use
   *  to detect low-signal reports where every candidate is weak. */
  rawScore: number;
  /** Softmax-normalised probability across all candidates, in [0,1]. */
  probability: number;
  /** Human readable narrative built from dominant signal terms. */
  reason: string;
  /** 1-indexed rank, descending by probability. */
  rank: number;
}

/**
 * Snapshot of the interaction terms used to score one candidate.
 *
 * Mirrors the mathematical decomposition adapted from
 *   I = integral integral 1 / ((1 - xy)(1 + x)(1 + y)) dx dy
 * into
 *   P = (F * PF * T * M * C) / ((1 - FM) * (1 + N) * (1 + R) * (1 + E))
 * where FM = F * M is the (1 - xy) interaction pressure term.
 */
export interface InteractionTerms {
  /** Global digit frequency contribution. */
  F: number;
  /** Positional digit frequency contribution. */
  PF: number;
  /** Transition confidence contribution along the digit chain. */
  T: number;
  /** Momentum / acceleration contribution. */
  M: number;
  /** Cluster confidence contribution. */
  C: number;
  /** F * M, clamped below 1 to keep (1 - FM) finite. */
  FM: number;
  /** Global noise / autocorrelation-derived scalar. */
  N: number;
  /** Repetition risk for the candidate. */
  R: number;
  /** Per-candidate entropy. */
  E: number;
  /** Numerator: F * PF * T * M * C. */
  numerator: number;
  /** Denominator: (1 - FM) * (1 + N) * (1 + R) * (1 + E). */
  denominator: number;
}

/**
 * Top-level intelligence report returned by the interaction engine.
 */
export interface IntelligenceReport {
  /** Top-K candidates sorted descending by probability. */
  candidates: RankedNumber[];
  /** Convenience pointer to candidates[0], or null if no candidates. */
  topPick: RankedNumber | null;
  /** Per-digit single-digit ranking from the legacy probability module. */
  perDigit: PredictionResult[];
  /** Global Shannon entropy of the input draw stream, normalised to [0,1]. */
  entropy: number;
  /** ISO timestamp the report was produced. */
  generatedAt: string;
  /** Probabilistic-intelligence disclaimer text. */
  notice: string;
}

/**
 * Full analysis payload returned by /api/analyze.
 *
 * `intelligence` is optional so consumers built against the original scaffold
 * keep compiling; FEAT-002 populates it.
 */
export interface AnalysisResult {
  frequency: Record<string, number>;
  transition: Record<string, Record<string, number>>;
  ranking: PredictionResult[];
  entropy: number;
  summary: string;
  intelligence?: IntelligenceReport;
}
