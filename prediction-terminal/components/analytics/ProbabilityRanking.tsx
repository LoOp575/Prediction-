import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";

export default function ProbabilityRanking() {
  return (
    <Card>
      <SectionTitle title="Probability Ranking" hint="placeholder" />
      <p className="text-[11px] text-terminal-muted">
        Ranked digit probabilities will render here.
      </p>
    </Card>
  );
}
