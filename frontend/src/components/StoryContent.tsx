import { useMemo, type ReactNode } from 'react';
import type { ItemRarity } from '../services/playthroughApi';
import { useTranslation } from '../i18n';
import { RARITY_STYLES } from '../design-system/colors';
import { cn } from '../design-system';

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

// Character buttons always use the accent color (they're not rarity-graded).
const CHAR_STYLE = { text: 'text-accent-400', bg: 'bg-accent-500/10', glow: '' };

// Parses [[char:Name]], [[item:Name:rarity]], [[special:Name:rarity]]
const ENTITY_REGEX = /\[\[(char|item|special):([^\]]+?)\]\]/g;
// Pull-quote line (Markdown-style > quote text on its own paragraph)
const QUOTE_LINE_REGEX = /^>\s+(.*)$/;

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

type TextSegment = { kind: 'text'; content: string };
type EntitySegment = { kind: 'entity'; entity: EntityRef };
type Segment = TextSegment | EntitySegment;

interface ParsedParagraph {
  key: string;
  /** "p" for paragraph, "quote" for pull-quote */
  kind: 'p' | 'quote';
  segments: Segment[];
}

function parseContent(text: string): ParsedParagraph[] {
  return text
    .split(/\n{2,}/)
    .map((para, i) => {
      const quoteMatch = para.match(QUOTE_LINE_REGEX);
      if (quoteMatch) {
        return {
          key: `q-${i}`,
          kind: 'quote' as const,
          segments: [{ kind: 'text' as const, content: quoteMatch[1] ?? para }],
        };
      }
      return {
        key: `p-${i}`,
        kind: 'p' as const,
        segments: parseParagraphSegments(para),
      };
    });
}

function parseParagraphSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  // Reset regex state (regex is global, must reset before use)
  ENTITY_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ENTITY_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ kind: 'entity', entity: parseEntityTag(match[1] || '', match[2] || '') });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: 'text', content: text.slice(lastIndex) });
  }
  return segments;
}

function renderSegments(
  segments: Segment[],
  onEntityClick: StoryContentProps['onEntityClick'],
  t: ReturnType<typeof useTranslation>,
): ReactNode {
  return segments.map((seg, i) => {
    if (seg.kind === 'text') {
      return <span key={i}>{seg.content}</span>;
    }
    const { entity } = seg;
    const style = entity.type === 'char'
      ? CHAR_STYLE
      : RARITY_STYLES[entity.rarity || 'common'];
    const label = entity.type === 'char'
      ? t.entityTypes.character
      : entity.type === 'item'
        ? t.entityTypes.item
        : t.entityTypes.specialItem;
    return (
      <button
        key={i}
        type="button"
        onClick={() => onEntityClick?.(entity)}
        className={cn(
          'inline cursor-pointer font-medium px-0.5 rounded',
          'transition-all duration-base ease-standard',
          'hover:brightness-125 focus:outline-none',
          'focus-visible:ring-2 focus-visible:ring-accent-500',
          'focus-visible:ring-offset-1 focus-visible:ring-offset-ink-950',
          style.text,
          style.bg,
          style.glow,
        )}
        title={`${label}: ${entity.name}`}
        aria-label={`${label}: ${entity.name}`}
      >
        {entity.name}
      </button>
    );
  });
}

export function StoryContent({ text, onEntityClick, className }: StoryContentProps) {
  const t = useTranslation();
  const paragraphs = useMemo(() => parseContent(text), [text]);

  return (
    <div
      className={cn(
        'font-serif text-ink-100',
        // Prose typography (per spec section 2.1)
        'text-[1.0625rem] leading-[1.7]',
        // Heading hierarchy
        '[&_h1]:font-display [&_h1]:text-2xl [&_h1]:text-gold-500 [&_h1]:mt-8 [&_h1]:mb-4',
        '[&_h2]:font-display [&_h2]:text-xl [&_h2]:text-gold-400 [&_h2]:mt-6 [&_h2]:mb-3',
        '[&_h3]:font-display [&_h3]:text-lg [&_h3]:text-ink-100 [&_h3]:mt-4 [&_h3]:mb-2',
        className,
      )}
    >
      {paragraphs.map(({ key, kind, segments }, idx) => {
        const rendered = renderSegments(segments, onEntityClick, t);
        if (kind === 'quote') {
          return (
            <blockquote
              key={key}
              className="my-6 pl-4 border-l-4 border-gold-400 font-display italic text-gold-300"
            >
              {rendered}
            </blockquote>
          );
        }
        // First paragraph gets the drop-cap (only on chapters with multiple paragraphs)
        const isFirst = idx === 0 && paragraphs.length > 1;
        return (
          <p
            key={key}
            className={cn(
              'mb-5',
              isFirst && 'first-paragraph',
            )}
          >
            {rendered}
          </p>
        );
      })}
    </div>
  );
}

export type { EntityRef, ItemRarity };
