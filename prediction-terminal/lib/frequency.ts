import type { Draw } from "@/types";

export function calculateFrequency(draws: Draw[]) {
  const counts = Array(10).fill(0);

  for (const draw of draws) {
    for (const digit of draw.digits) {
      counts[digit]++;
    }
  }

  const total = counts.reduce((a, b) => a + b, 0);

  return counts.map((count, digit) => ({
    digit,
    count,
    probability:
      total === 0 ? 0 : count / total,
  }));
}
