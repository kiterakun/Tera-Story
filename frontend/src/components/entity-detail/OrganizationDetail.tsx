import { Landmark } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { Organization } from '../../types/entities';
import { useStoryStore } from '../../stores/storyStore';
import { DynamicStatList } from '../DynamicStatDisplay';
import { EntityCard } from '../../design-system/EntityCard';
import { ORGANIZATION_STATUS_STYLES } from '../../design-system/colors';

export function OrganizationDetail({ data }: { data: Organization }) {
  const t = useTranslation();
  const { world } = useStoryStore();
  const statusStyle = ORGANIZATION_STATUS_STYLES[data.status as keyof typeof ORGANIZATION_STATUS_STYLES] ?? ORGANIZATION_STATUS_STYLES.hidden;
  return (
    <div className="space-y-4">
      <EntityCard
        variant="organization"
        name={data.name}
        subtitle={data.type}
        description={data.description}
        status={data.status}
        statusLabel={t.entityStatus[data.status as keyof typeof t.entityStatus] || data.status}
        imageFallback={
          <div className="w-full h-full flex items-center justify-center bg-accent-600/20">
            <Landmark size={24} className="text-accent-400" aria-hidden="true" />
          </div>
        }
        className="p-3"
      >
        <span className={`mt-1 inline-flex items-center text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${statusStyle.text} ${statusStyle.bg}`}>
          {t.entityStatus[data.status as keyof typeof t.entityStatus] || data.status}
        </span>
      </EntityCard>

      {data.goals && (
        <div>
          <h4 className="text-xs text-ink-200/60 uppercase tracking-wider mb-1 font-medium">Goals</h4>
          <p className="text-sm text-ink-200/80">{data.goals}</p>
        </div>
      )}
      {data.structure && (
        <div>
          <h4 className="text-xs text-ink-200/60 uppercase tracking-wider mb-1 font-medium">Structure</h4>
          <p className="text-sm text-ink-200/80">{data.structure}</p>
        </div>
      )}
      {data.dynamicStats.length > 0 && (
        <div>
          <h4 className="text-xs text-ink-200/60 uppercase tracking-wider mb-2 font-medium">Stats</h4>
          <DynamicStatList stats={data.dynamicStats} templates={world?.resourceTemplates} />
        </div>
      )}
      {Array.isArray(data.memberIds) && data.memberIds.length > 0 && (
        <div>
          <h4 className="text-xs text-ink-200/60 uppercase tracking-wider mb-2 font-medium">Members</h4>
          <div className="flex flex-wrap gap-2">
            {data.memberIds.map((member) => {
              const name = typeof member === 'string' ? member : member.name;
              return (
                <span key={name} className="text-xs px-2 py-1 bg-ink-800 rounded-lg text-ink-200/80">
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
