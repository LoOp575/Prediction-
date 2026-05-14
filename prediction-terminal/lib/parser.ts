import type { Draw } from "@/types";

/**
 * Parse JSON market history into Draw[]
 */
export function parseDraws(data: any[]): Draw[] {
  return data.map((item) => ({
    date: item.date,
    result: item.result,
    digits: item.result.split("").map(Number),
  }));
}
