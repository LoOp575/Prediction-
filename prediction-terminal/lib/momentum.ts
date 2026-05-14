import type { Draw } from "@/types";
import { normalizeScores, clamp01 } from "@/lib/normalization";

/**
 * Digit momentum and momentum-acceleration helpers.
 *
 * These functions feed the M term of the interaction-mathematics engine
 * (see lib/intelligence.ts). They are pure: no I/O, no side-effects.
 *
 * Output is probabilistic intelligence, NOT deterministic prediction.
 */

const DIGIT_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

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

function safeNumber(x: number, fallback = 0): number {
  return Number.isFinite(x) ? x : fallback;
}

/**
 * Exponentially-weighted recency score per digit.
 *
 * Walks draws newest-first and adds Math.pow(0.5, age/halfLife) for every
 * occurrence of a digit. Result is min-max normalised so the strongest
 * digit maps to 1.0 (and a flat history yields all zeros).
 */
export function computeDigitMomentum(
  draws: Draw[],
  halfLife?: number,
): Record<string, number> {
  const out = emptyDigitMap();
  if (!Array.isArray(draws) || draws.length === 0) return out;
  const hl =
    typeof halfLife === "number" && halfLife > 0
      ? halfLife
      : Math.max(3, draws.length / 4);
  for (let age = 0; age < draws.length; age += 1) {
    const draw = draws[draws.length - 1 - age];
    if (!draw || !Array.isArray(draw.digits)) continue;
    const weight = Math.pow(0.5, age / hl);
    if (!Number.isFinite(weight)) continue;
    for (const d of draw.digits) {
      if (Number.isFinite(d)) {
        const i = Math.trunc(d as number);
        if (i >= 0 && i <= 9) {
          out[String(i)] = safeNumber(out[String(i)]) + weight;
        }
      }
    }
  }
  return normalizeScores(out);
}

/**
 * Momentum acceleration: how much more / less frequent each digit is in the
 * recent window relative to the global history. Mapped to [0,1] so it can
 * plug into the M slot of the interaction formula.
 *
 * acceleration_raw = (recent - global) / (recent + global + eps)   in [-1,1]
 * mapped to [0,1] via (x + 1) / 2.
 */
export function computeMomentumAcceleration(
  draws: Draw[],
  window?: number,
): Record<string, number> {
  const out = emptyDigitMap();
  for (const k of DIGIT_KEYS) out[k] = 0.5; // neutral baseline
  if (!Array.isArray(draws) || draws.length === 0) return out;

  const fallbackWindow = Math.max(5, Math.floor(draws.length / 3));
  const w =
    typeof window === "number" && window > 0
      ? Math.min(Math.trunc(window), draws.length)
      : Math.min(fallbackWindow, draws.length);

  const recentDraws = draws.slice(Math.max(0, draws.length - w));

  const globalCounts = emptyDigitMap();
  let globalTotal = 0;
  for (const d of flattenDigits(draws)) {
    globalCounts[String(d)] += 1;
    globalTotal += 1;
  }

  const recentCounts = emptyDigitMap();
  let recentTotal = 0;
  for (const d of flattenDigits(recentDraws)) {
    recentCounts[String(d)] += 1;
    recentTotal += 1;
  }

  if (globalTotal === 0 || recentTotal === 0) return out;

  const eps = 1e-9;
  for (const k of DIGIT_KEYS) {
    const g = safeNumber(globalCounts[k]) / globalTotal;
    const r = safeNumber(recentCounts[k]) / recentTotal;
    let raw = (r - g) / (r + g + eps);
    if (!Number.isFinite(raw)) raw = 0;
    if (raw < -1) raw = -1;
    if (raw > 1) raw = 1;
    out[k] = clamp01((raw + 1) / 2);
  }
  return out;
}

/**
 * Convenience accessor used by the intelligence engine when iterating
 * candidate digits.
 */
export function momentumFor(
  digit: string,
  accel: Record<string, number>,
): number {
  if (!accel) return 0.5;
  const v = accel[digit];
  return Number.isFinite(v) ? clamp01(v) : 0.5;
}
