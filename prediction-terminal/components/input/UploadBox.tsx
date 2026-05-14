import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";

export default function UploadBox() {
  return (
    <Card>
      <SectionTitle title="Upload" hint=".csv / .json" />
      <div className="border border-dashed border-terminal-border rounded-sm h-20 flex items-center justify-center text-[11px] text-terminal-muted">
        drop file or click to browse
      </div>
    </Card>
  );
}
