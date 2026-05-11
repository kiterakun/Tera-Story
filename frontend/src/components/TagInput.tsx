import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent, type DragEvent } from 'react';
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInputValue('');
  }, [tags, onChange]);

  const removeTag = useCallback((index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  }, [tags, onChange]);

  const startEditing = useCallback((index: number) => {
    if (disabled) return;
    setEditingIndex(index);
    setEditValue(tags[index] ?? '');
  }, [disabled, tags]);

  const saveEdit = useCallback(() => {
    if (editingIndex === null) return;
    
    const trimmed = editValue.trim();
    
    // If empty, remove the tag
    if (!trimmed) {
      removeTag(editingIndex);
      setEditingIndex(null);
      setEditValue('');
      return;
    }
    
    // Check for duplicate (excluding the current tag being edited)
    const isDuplicate = tags.some((tag, i) => i !== editingIndex && tag === trimmed);
    if (isDuplicate) {
      // Cancel edit on duplicate
      setEditingIndex(null);
      setEditValue('');
      return;
    }
    
    // Update the tag
    const newTags = [...tags];
    newTags[editingIndex] = trimmed;
    onChange(newTags);
    setEditingIndex(null);
    setEditValue('');
  }, [editingIndex, editValue, tags, onChange, removeTag]);

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditValue('');
  }, []);

  const handleEditKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }, [saveEdit, cancelEdit]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }, [inputValue, tags, addTag, removeTag]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleEditChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  }, []);

  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: DragEvent<HTMLSpanElement>, index: number) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, [disabled]);

  const handleDragOver = useCallback((e: DragEvent<HTMLSpanElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    
    if (index !== dropTargetIndex) {
      setDropTargetIndex(index);
    }
  }, [draggedIndex, dropTargetIndex]);

  const handleDragLeave = useCallback(() => {
    setDropTargetIndex(null);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLSpanElement>, dropIndex: number) => {
    e.preventDefault();
    
    const draggedIdx = Number(e.dataTransfer.getData('text/plain'));
    if (isNaN(draggedIdx) || draggedIdx === dropIndex) {
      setDraggedIndex(null);
      setDropTargetIndex(null);
      return;
    }
    
    const newTags = [...tags];
    const [removed] = newTags.splice(draggedIdx, 1);
    if (removed !== undefined) {
      newTags.splice(dropIndex, 0, removed);
      onChange(newTags);
    }
    
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, [tags, onChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, []);

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
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md transition-all ${
            editingIndex === i
              ? 'bg-ink-700 border-2 border-accent-400 ring-2 ring-accent-400/30 scale-105'
              : draggedIndex === i
                ? 'opacity-50 bg-accent-600/20 text-accent-400 border border-accent-400/30'
                : dropTargetIndex === i
                  ? 'bg-accent-600/20 text-accent-400 border-l-2 border-l-accent-400 border-t border-t-accent-400/30 border-r border-r-accent-400/30 border-b border-b-accent-400/30'
                  : 'bg-accent-600/20 text-accent-400 border border-accent-400/30'
          }`}
          draggable={!disabled && editingIndex === null}
          onDragStart={(e) => handleDragStart(e, i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, i)}
          onDragEnd={handleDragEnd}
          onClick={() => startEditing(i)}
        >
          {editingIndex === i ? (
            <input
              ref={editInputRef}
              type="text"
              className="bg-ink-800 border-none outline-none text-xs font-medium text-accent-400 w-auto min-w-[40px] px-0.5"
              value={editValue}
              onChange={handleEditChange}
              onKeyDown={handleEditKeyDown}
              onBlur={saveEdit}
              disabled={disabled}
              autoFocus
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            tag
          )}
          {editingIndex !== i && (
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
          )}
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
