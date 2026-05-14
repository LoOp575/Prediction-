import FrequencyPanel from "@/components/analytics/FrequencyPanel";
import TransitionMatrix from "@/components/analytics/TransitionMatrix";
import ProbabilityRanking from "@/components/analytics/ProbabilityRanking";

export default function CenterPanel() {
  return (
    <section className="p-3 flex flex-col gap-3 overflow-y-auto">
      <FrequencyPanel />
      <TransitionMatrix />
      <ProbabilityRanking />
    </section>
  );
}
