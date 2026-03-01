import { useMemo } from 'react';
import type { ItemRarity } from '../services/playthroughApi';

interface EntityRef {
  type: 'char' | 'item' | 'special';
  name: string;
  rarity?: ItemRarity;
}

interface StoryContentProps {
  text: string;
  onEntityClick?: (entity: EntityRef) => void;
  className?: string;
}

const RARITY_STYLES: Record<ItemRarity, { text: string; bg: string; glow: string }> = {
  common: { text: 'text-gray-300', bg: 'bg-gray-500/10', glow: '' },
  uncommon: { text: 'text-green-400', bg: 'bg-green-500/10', glow: '' },
  rare: { text: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'drop-shadow-[0_0_4px_rgba(96,165,250,0.5)]' },
  epic: { text: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]' },
  legendary: { text: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]' },
};

const CHAR_STYLE = { text: 'text-accent-400', bg: 'bg-accent-500/10', glow: '' };

// Parses [[char:Name]], [[item:Name:rarity]], [[special:Name:rarity]]
const ENTITY_REGEX = /\[\[(char|item|special):([^\]]+?)\]\]/g;

function parseEntityTag(type: string, content: string): EntityRef {
  if (type === 'char') {
    return { type: 'char', name: content };
  }
  // item and special have format Name:rarity
  const lastColon = content.lastIndexOf(':');
  if (lastColon > 0) {
    const name = content.slice(0, lastColon);
    const rarity = content.slice(lastColon + 1) as ItemRarity;
    return { type: type as 'item' | 'special', name, rarity };
  }
  return { type: type as 'item' | 'special', name: content, rarity: 'common' };
}

interface TextSegment {
  kind: 'text';
  content: string;
}
interface EntitySegment {
  kind: 'entity';
  entity: EntityRef;
}
type Segment = TextSegment | EntitySegment;

function parseContent(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  // Reset regex state
  ENTITY_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = ENTITY_REGEX.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ kind: 'entity', entity: parseEntityTag(match[1], match[2]) });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    segments.push({ kind: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

export function StoryContent({ text, onEntityClick, className = '' }: StoryContentProps) {
  const paragraphs = useMemo(() => {
    return text.split('\n\n').map((para, i) => ({
      key: i,
      segments: parseContent(para),
    }));
  }, [text]);

  return (
    <div className={className}>
      {paragraphs.map(({ key, segments }) => (
        <p key={key} className="mb-4 leading-[1.8]">
          {segments.map((seg, i) => {
            if (seg.kind === 'text') {
              return <span key={i}>{seg.content}</span>;
            }
            const { entity } = seg;
            const style = entity.type === 'char'
              ? CHAR_STYLE
              : RARITY_STYLES[entity.rarity || 'common'];

            return (
              <button
                key={i}
                onClick={() => onEntityClick?.(entity)}
                className={`inline cursor-pointer font-medium px-0.5 rounded transition-all duration-200 hover:brightness-125 ${style.text} ${style.bg} ${style.glow}`}
                title={`${entity.type === 'char' ? 'Character' : entity.type === 'item' ? 'Item' : 'Special Item'}: ${entity.name}`}
              >
                {entity.name}
              </button>
            );
          })}
        </p>
      ))}
    </div>
  );
}

export type { EntityRef, ItemRarity };
