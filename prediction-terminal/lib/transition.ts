import type { Draw } from "@/types";

/**
 * Placeholder transition matrix builder.
 * Will return P(next | prev) keyed by digit pairs.
 */
export function computeTransitionMatrix(
  _draws: Draw[],
): Record<string, Record<string, number>> {
  return {};
}
