import DataInput from "@/components/input/DataInput";
import UploadBox from "@/components/input/UploadBox";
import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";

export default function LeftPanel() {
  return (
    <aside className="border-r border-terminal-border p-3 flex flex-col gap-3 overflow-y-auto">
      <Card>
        <SectionTitle title="Input" hint="LEFT" />
        <p className="text-[11px] text-terminal-muted">
          Provide historical draws as text or upload a file.
        </p>
      </Card>
      <DataInput />
      <UploadBox />
    </aside>
  );
}
