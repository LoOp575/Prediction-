import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  tone?: "default" | "accent" | "warn";
}

export default function Badge({ children, tone = "default" }: BadgeProps) {
  const toneClass =
    tone === "accent"
      ? "border-terminal-accent text-terminal-accent"
      : tone === "warn"
        ? "border-terminal-warn text-terminal-warn"
        : "border-terminal-border text-terminal-muted";

  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest border rounded-sm ${toneClass}`}
    >
      {children}
    </span>
  );
}
