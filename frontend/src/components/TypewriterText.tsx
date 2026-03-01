interface TypewriterTextProps {
  text: string;
  isActive: boolean;
  className?: string;
}

export function TypewriterText({ text, isActive, className }: TypewriterTextProps) {
  return (
    <span className={className}>
      {text}
      {isActive && <span className="animate-pulse">▋</span>}
    </span>
  );
}
