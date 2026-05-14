/**
 * Core domain types for the Prediction Market Intelligence Terminal.
 * These are intentionally minimal placeholders for the scaffold stage.
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
 * A ranked prediction produced by the probability engine.
 */
export interface PredictionResult {
  digit: number;
  probability: number;
  rank: number;
}

/**
 * Full analysis payload returned by /api/analyze.
 */
export interface AnalysisResult {
  frequency: Record<string, number>;
  transition: Record<string, Record<string, number>>;
  ranking: PredictionResult[];
  entropy: number;
  summary: string;
}
