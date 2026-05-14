import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";

export default function DataInput() {
  return (
    <Card>
      <SectionTitle title="Data Input" hint="paste series" />
      <textarea
        readOnly
        placeholder="// Paste historical draws here..."
        className="w-full h-28 bg-black/40 border border-terminal-border text-terminal-text text-xs p-2 rounded-sm resize-none focus:outline-none"
      />
    </Card>
  );
}
