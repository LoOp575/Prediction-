import TerminalLayout from "@/components/terminal/TerminalLayout";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-terminal-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-terminal-accent">●</span>
          <h1 className="text-sm tracking-widest uppercase">
            Prediction Market Intelligence Terminal
          </h1>
        </div>
        <span className="text-xs text-terminal-muted">v0.1.0 // scaffold</span>
      </header>
      <TerminalLayout />
    </main>
  );
}
