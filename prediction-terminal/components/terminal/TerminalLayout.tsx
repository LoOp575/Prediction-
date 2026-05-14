import LeftPanel from "@/components/terminal/LeftPanel";
import CenterPanel from "@/components/terminal/CenterPanel";
import RightPanel from "@/components/terminal/RightPanel";

export default function TerminalLayout() {
  return (
    <div
      className="grid h-[calc(100vh-49px)] w-full"
      style={{ gridTemplateColumns: "280px 1fr 320px" }}
    >
      <LeftPanel />
      <CenterPanel />
      <RightPanel />
    </div>
  );
}
