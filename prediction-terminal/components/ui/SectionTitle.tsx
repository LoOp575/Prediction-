interface SectionTitleProps {
  title: string;
  hint?: string;
}

export default function SectionTitle({ title, hint }: SectionTitleProps) {
  return (
    <div className="flex items-baseline justify-between mb-2">
      <h2 className="text-xs uppercase tracking-widest text-terminal-accent">
        {title}
      </h2>
      {hint ? (
        <span className="text-[10px] text-terminal-muted">{hint}</span>
      ) : null}
    </div>
  );
}
