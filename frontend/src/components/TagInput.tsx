import { useState, useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function TagInput({
  tags,
  onChange,
  placeholder = 'Add tag...',
  className = '',
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 min-h-[2.5rem] bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 cursor-text transition-all focus-within:border-accent-400 focus-within:ring-2 focus-within:ring-accent-400/20 ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
      onClick={handleContainerClick}
      role="listbox"
      aria-label="Tag input"
    >
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-accent-600/20 text-accent-400 border border-accent-400/30 transition-colors"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(i);
            }}
            className="w-3.5 h-3.5 flex items-center justify-center rounded-sm hover:bg-accent-400/30 transition-colors"
            aria-label={`Remove ${tag}`}
            disabled={disabled}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-sm text-ink-100 placeholder:text-ink-500 py-0.5"
        placeholder={tags.length === 0 ? placeholder : ''}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
    </div>
  );
}
