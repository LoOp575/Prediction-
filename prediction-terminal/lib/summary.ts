import type { AnalysisResult, IntelligenceReport } from "@/types";

/**
 * Human-readable summary generator.
 *
 * When an IntelligenceReport is present, the summary highlights the top
 * candidate, its score, its interaction pressure, and the dominant reason.
 * Every summary appends the probabilistic-intelligence disclaimer; this
 * module never claims deterministic prediction.
 */

const DISCLAIMER = "Probabilistic intelligence only - not deterministic prediction.";

function fmt(n: number, digits = 3): string {
  if (!Number.isFinite(n)) return "0";
  return Number(n.toFixed(digits)).toString();
}

/**
 * Compose a one-paragraph summary directly from an IntelligenceReport.
 */
export function summarizeIntelligence(report: IntelligenceReport): string {
  if (!report || !report.topPick) {
    return `No interaction candidates produced. Global entropy ${fmt(report?.entropy ?? 0)}. ${DISCLAIMER}`;
  }
  const top = report.topPick;
  return (
    `Top interaction candidate ${top.number} ` +
    `(score ${fmt(top.score)}, interactionPressure ${fmt(top.interactionPressure)}, ` +
    `probability ${fmt(top.probability)}). ` +
    `${top.reason} ` +
    `Global entropy ${fmt(report.entropy)}. ${DISCLAIMER}`
  );
}

/**
 * Compose a summary for a full AnalysisResult. Falls back to a frequency /
 * transition / entropy brief when the intelligence report is missing.
 */
export function generateSummary(result: AnalysisResult): string {
  if (!result) return `No analysis result. ${DISCLAIMER}`;
  if (result.intelligence) {
    return summarizeIntelligence(result.intelligence);
  }
  const freqEntries = Object.entries(result.frequency ?? {})
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3)
    .map(([k, v]) => `${k}:${fmt(v as number)}`);
  const topRanked = (result.ranking ?? [])
    .slice(0, 3)
    .map((r) => `${r.digit}@${fmt(r.probability)}`);
  return (
    `Frequency leaders: ${freqEntries.join(", ") || "n/a"}. ` +
    `Top digits: ${topRanked.join(", ") || "n/a"}. ` +
    `Global entropy ${fmt(result.entropy ?? 0)}. ${DISCLAIMER}`
  );
}
