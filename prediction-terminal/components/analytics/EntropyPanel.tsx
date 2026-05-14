import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";

export default function EntropyPanel() {
  return (
    <Card>
      <SectionTitle title="Entropy" hint="placeholder" />
      <p className="text-[11px] text-terminal-muted">
        Shannon entropy & volatility metrics will render here.
      </p>
    </Card>
  );
}
