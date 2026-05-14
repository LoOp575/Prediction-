import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-terminal-panel border border-terminal-border rounded-sm p-3 ${className}`}
    >
      {children}
    </div>
  );
}
