import EntropyPanel from "@/components/analytics/EntropyPanel";
import AiSummary from "@/components/analytics/AiSummary";

export default function RightPanel() {
  return (
    <aside className="border-l border-terminal-border p-3 flex flex-col gap-3 overflow-y-auto">
      <EntropyPanel />
      <AiSummary />
    </aside>
  );
}
