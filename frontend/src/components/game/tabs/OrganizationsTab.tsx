import type { Dispatch, SetStateAction } from 'react';
import type { EntityData } from '../../EntityDetailModal';
import type { useTranslation } from '../../../i18n';
import { useStoryStore } from '../../../stores/storyStore';
import { ORGANIZATION_STATUS_STYLES } from '../../../design-system/colors';

interface OrganizationsTabProps {
  setDetailEntity: Dispatch<SetStateAction<EntityData | null>>;
  t: ReturnType<typeof useTranslation>;
}

export function OrganizationsTab({ setDetailEntity, t }: OrganizationsTabProps) {
  const { organizations } = useStoryStore();

  if (organizations.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-ink-200/40">
        <p className="text-sm font-sans">
          {t.playthrough.noOrganizations ?? 'No organizations discovered yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {organizations.map((org) => {
        const statusStyle =
          ORGANIZATION_STATUS_STYLES[org.status as keyof typeof ORGANIZATION_STATUS_STYLES] ||
          'text-ink-200/50 bg-ink-800';
        return (
          <button
            key={org._id}
            type="button"
            onClick={() => setDetailEntity({ type: 'organization', data: org })}
            className="w-full bg-ink-950/50 rounded-xl border border-ink-700/50 p-4 cursor-pointer hover:border-accent-400/30 transition-all text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-ink-100 truncate">{org.name}</h4>
                <p className="text-xs text-ink-200/50 mt-0.5 capitalize">{org.type}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusStyle}`}>
                {t.entityStatus[org.status as keyof typeof t.entityStatus] || org.status}
              </span>
            </div>
            {org.description && (
              <p className="text-xs text-ink-200/60 mt-2 line-clamp-2">{org.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-ink-200/40">
              <span>
                {t.characterPanel.membersCount.replace(
                  '{count}',
                  String(Array.isArray(org.memberIds) ? org.memberIds.length : 0),
                )}
              </span>
              {org.dynamicStats.length > 0 && (
                <span>
                  {t.characterPanel.statsCount.replace('{count}', String(org.dynamicStats.length))}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
