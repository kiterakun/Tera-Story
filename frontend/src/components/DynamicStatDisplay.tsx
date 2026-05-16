import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import type { DynamicStat, ResourceTemplate } from '@/types';

interface DynamicStatDisplayProps {
  stat: DynamicStat;
  template?: ResourceTemplate;
  compact?: boolean;
}

/**
 * Shared component for rendering a single dynamic stat.
 * Handles all stat types: number, text, progress, enum, pool, object.
 * Object type renders as a collapsible group with indented children.
 */
export function DynamicStatDisplay({ stat, template, compact = false }: DynamicStatDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Object type: collapsible group with children
  if (stat.t === 'object' && stat.children && stat.children.length > 0) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-ink-200/70 hover:text-ink-200 transition-colors w-full"
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span>{stat.k}</span>
        </button>
        {isExpanded && (
          <div className="ml-4 space-y-1.5 border-l border-ink-700/50 pl-3">
            {stat.children.map((child, idx) => {
              const childTemplate = template?.children?.find((t) => t.key === child.k);
              return (
                <DynamicStatDisplay
                  key={idx}
                  stat={child}
                  template={childTemplate}
                  compact={compact}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Pool type: current / max with progress bar
  if (stat.t === 'pool') {
    const current = typeof stat.v === 'number' ? stat.v : 0;
    const max = stat.maxV ?? current;
    const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;

    return (
      <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
        <div className="flex items-center justify-between">
          <span className={`${compact ? 'text-xs' : 'text-sm'} text-ink-200/60`}>{stat.k}</span>
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-ink-100`}>
            {current}/{max}
          </span>
        </div>
        <div className="w-full bg-ink-800 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  // Progress type: progress bar (0-100)
  if (stat.t === 'progress') {
    const val = typeof stat.v === 'number' ? stat.v : 0;
    const max = template?.max ?? 100;
    const pct = max > 0 ? Math.min((val / max) * 100, 100) : 0;

    return (
      <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
        <div className="flex items-center justify-between">
          <span className={`${compact ? 'text-xs' : 'text-sm'} text-ink-200/60`}>{stat.k}</span>
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-ink-100`}>{val}</span>
        </div>
        <div className="w-full bg-ink-800 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-accent-600 to-accent-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  // Enum type: value with validation warning
  if (stat.t === 'enum') {
    const isValid = !template?.options || template.options.length === 0 || template.options.includes(String(stat.v));

    return (
      <div className="flex items-center justify-between">
        <span className={`${compact ? 'text-xs' : 'text-sm'} text-ink-200/60`}>{stat.k}</span>
        <div className="flex items-center gap-1.5">
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium ${isValid ? 'text-ink-100' : 'text-red-400'}`}>
            {String(stat.v)}
          </span>
          {!isValid && (
            <AlertTriangle size={12} className="text-red-400" />
          )}
        </div>
      </div>
    );
  }

  // Default: number, text, or unknown types
  const formattedValue = template?.displayFormat
    ? template.displayFormat.replace('{v}', String(stat.v))
    : String(stat.v);

  return (
    <div className="flex items-center justify-between">
      <span className={`${compact ? 'text-xs' : 'text-sm'} text-ink-200/60`}>{stat.k}</span>
      <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-ink-100`}>{formattedValue}</span>
    </div>
  );
}

interface DynamicStatListProps {
  stats: DynamicStat[];
  templates?: ResourceTemplate[];
  compact?: boolean;
}

/**
 * Renders a list of dynamic stats with proper templates.
 */
export function DynamicStatList({ stats, templates, compact = false }: DynamicStatListProps) {
  if (stats.length === 0) return null;

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      {stats.map((stat, idx) => {
        const template = templates?.find((t) => t.key === stat.k);
        return (
          <DynamicStatDisplay
            key={idx}
            stat={stat}
            template={template}
            compact={compact}
          />
        );
      })}
    </div>
  );
}
