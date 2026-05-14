import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";

export default function TransitionMatrix() {
  return (
    <Card>
      <SectionTitle title="Transition Matrix" hint="placeholder" />
      <p className="text-[11px] text-terminal-muted">
        P(next | prev) heatmap will render here.
      </p>
    </Card>
  );
}
