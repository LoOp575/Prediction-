import type { Draw } from "@/types";

const DIGIT_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

function emptyRow(): Record<string, number> {
  const row: Record<string, number> = {};
  for (const k of DIGIT_KEYS) row[k] = 0;
  return row;
}

function emptyMatrix(): Record<string, Record<string, number>> {
  const m: Record<string, Record<string, number>> = {};
  for (const k of DIGIT_KEYS) m[k] = emptyRow();
  return m;
}

function flattenDigits(draws: Draw[]): number[] {
  const out: number[] = [];
  for (const draw of draws) {
    if (!draw || !Array.isArray(draw.digits)) continue;
    for (const d of draw.digits) {
      if (Number.isFinite(d)) {
        const i = Math.trunc(d);
        if (i >= 0 && i <= 9) out.push(i);
      }
    }
  }
  return out;
}

/**
 * Build a digit -> digit transition matrix by flattening all draws into a
 * single sequence and counting consecutive pairs. Rows are normalised so
 * that each non-empty row sums to 1.0; rows that observed no transitions
 * remain all zero.
 */
export function computeTransitionMatrix(
  draws: Draw[],
): Record<string, Record<string, number>> {
  const matrix = emptyMatrix();
  if (!Array.isArray(draws) || draws.length === 0) return matrix;
  const seq = flattenDigits(draws);
  if (seq.length < 2) return matrix;
  for (let i = 0; i < seq.length - 1; i += 1) {
    const a = String(seq[i]);
    const b = String(seq[i + 1]);
    matrix[a][b] += 1;
  }
  for (const k of DIGIT_KEYS) {
    const row = matrix[k];
    let total = 0;
    for (const j of DIGIT_KEYS) total += row[j];
    if (total > 0) {
      for (const j of DIGIT_KEYS) row[j] = row[j] / total;
    }
  }
  return matrix;
}

/**
 * Read a single edge of the transition matrix. Returns 0 if either digit is
 * unknown so callers can fall back to a uniform prior.
 */
export function transitionConfidence(
  matrix: Record<string, Record<string, number>>,
  prev: string,
  next: string,
): number {
  if (!matrix) return 0;
  const row = matrix[prev];
  if (!row) return 0;
  const v = row[next];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
