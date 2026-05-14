import type { Draw } from "@/types";

export function calculateTransitions(
  draws: Draw[]
) {
  const matrix = Array.from(
    { length: 10 },
    () => Array(10).fill(0)
  );

  for (const draw of draws) {
    for (
      let i = 0;
      i < draw.digits.length - 1;
      i++
    ) {
      const from = draw.digits[i];
      const to = draw.digits[i + 1];

      matrix[from][to]++;
    }
  }

  return matrix;
}
