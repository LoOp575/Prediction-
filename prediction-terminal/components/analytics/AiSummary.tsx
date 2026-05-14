import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";

export default function AiSummary() {
  return (
    <Card>
      <SectionTitle title="AI Summary" hint="placeholder" />
      <p className="text-[11px] text-terminal-muted">
        Narrative interpretation of the analysis will render here.
      </p>
    </Card>
  );
}
