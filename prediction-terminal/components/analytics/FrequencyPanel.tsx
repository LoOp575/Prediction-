import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";

export default function FrequencyPanel() {
  return (
    <Card>
      <SectionTitle title="Frequency" hint="placeholder" />
      <p className="text-[11px] text-terminal-muted">
        Digit frequency distribution will render here.
      </p>
    </Card>
  );
}
