import { useTranslation } from '../../i18n';
import { Check } from 'lucide-react';
import type { World } from '../../services/worldApi';
import type { ResourceTemplate } from '../../services/worldApi';

interface WizardSummaryProps {
  world: World;
  resources: ResourceTemplate[];
  specialCount: number;
  organizationCount: number;
}

export function WizardSummary({ world, resources, specialCount, organizationCount }: WizardSummaryProps) {
  const t = useTranslation();
  return (
    <div className="bg-ink-800 border border-ink-700 rounded-2xl p-5">
      <h3 className="text-sm font-display text-ink-100 mb-4 flex items-center gap-2">
        <Check size={16} className="text-accent-400" aria-hidden="true" />
        World Preview
      </h3>
      <div className="space-y-3">
        <div className="p-3 bg-ink-950/50 rounded-xl border border-ink-700/50">
          <p className="text-[10px] uppercase tracking-wider text-ink-200/40 mb-1">Name</p>
          <p className="text-sm text-ink-100 font-medium truncate">{world.name || 'Unnamed World'}</p>
        </div>
        <div className="p-3 bg-ink-950/50 rounded-xl border border-ink-700/50">
          <p className="text-[10px] uppercase tracking-wider text-ink-200/40 mb-1">Genre</p>
          <p className="text-sm text-ink-100 font-medium capitalize">{world.genre}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-ink-950/50 rounded-xl border border-ink-700/50 text-center">
            <p className="text-[10px] uppercase tracking-wider text-ink-200/40 mb-1">Stats</p>
            <p className="text-lg font-display text-accent-400">{resources.length}</p>
          </div>
          <div className="p-3 bg-ink-950/50 rounded-xl border border-ink-700/50 text-center">
            <p className="text-[10px] uppercase tracking-wider text-ink-200/40 mb-1">Items</p>
            <p className="text-lg font-display text-purple-400">{specialCount}</p>
          </div>
        </div>
        <div className="text-[10px] text-ink-200/40 text-center">
          {(t.worldCreate.organizationCount ?? '{count} organizations').replace('{count}', String(organizationCount))}
        </div>
      </div>
    </div>
  );
}
