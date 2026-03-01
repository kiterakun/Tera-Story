interface TypewriterTextProps {
  text: string;
  isActive: boolean;
  className?: string;
}

export function TypewriterText({ text, isActive, className }: TypewriterTextProps) {
  return (
    <span className={className}>
      {text}
      {isActive && <span className="inline-block w-0.5 h-5 bg-accent-400 ml-0.5 animate-pulse align-middle" />}
    </span>
  );
}
