import { useTranslation } from '../../i18n';
import { ResourceTemplateEditor } from './ResourceTemplateEditor';
import type { OrganizationTemplate, ResourceTemplate } from '../../types/entities';

interface OrganizationTemplateEditorProps {
  templates: OrganizationTemplate[];
  onChange: (templates: OrganizationTemplate[]) => void;
}

export function OrganizationTemplateEditor({ templates, onChange }: OrganizationTemplateEditorProps) {
  const t = useTranslation();

  const handleAdd = () => {
    onChange([
      ...templates,
      { type: '', description: '', defaultStats: [] },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(templates.filter((_, i) => i !== index));
  };

  const handleTypeChange = (index: number, value: string) => {
    const updated = [...templates];
    const item = updated[index];
    if (!item) return;
    updated[index] = { ...item, type: value };
    onChange(updated);
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const updated = [...templates];
    const item = updated[index];
    if (!item) return;
    updated[index] = { ...item, description: value };
    onChange(updated);
  };

  const handleStatsChange = (index: number, stats: ResourceTemplate[]) => {
    const updated = [...templates];
    const item = updated[index];
    if (!item) return;
    updated[index] = { ...item, defaultStats: stats };
    onChange(updated);
  };

  return (
    <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-display text-ink-100 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-400 rounded-full" />
            {t.worldCreate.organizationTemplates ?? 'Organization Templates'}
          </h2>
          <p className="text-xs text-ink-200/60 mt-1 ml-4">
            {t.worldCreate.organizationTemplatesHint ?? 'Define types of organizations (guilds, kingdoms, factions) with their default stats.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium px-3 py-2 bg-ink-950/50 border border-ink-700 rounded-xl transition-all duration-200 text-sm hover:border-emerald-400/30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" />
          </svg>
          {t.worldCreate.add}
        </button>
      </div>

      <div className="space-y-4">
        {templates.map((template, index) => (
          <div key={index} className="bg-ink-950/50 p-4 border border-ink-700/50 rounded-xl border-l-2 border-l-emerald-400">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-ink-100">
                {template.type || (t.worldCreate.unnamedType ?? 'Unnamed Type')}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-ink-200/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                  {t.worldCreate.orgType ?? 'Type'}
                </label>
                <input
                  className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 placeholder:text-ink-500 focus:border-accent-400 outline-none transition-all"
                  placeholder={t.worldCreate.orgTypePlaceholder ?? 'e.g. guild, kingdom, cult, faction'}
                  value={template.type}
                  onChange={(e) => handleTypeChange(index, e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                  {t.worldCreate.description}
                </label>
                <input
                  className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 placeholder:text-ink-500 focus:border-accent-400 outline-none transition-all"
                  placeholder={t.worldCreate.orgDescPlaceholder ?? 'Describe this organization type...'}
                  value={template.description}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                />
              </div>

              {/* Default Stats */}
              <div>
                <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                  {t.worldCreate.defaultStats ?? 'Default Stats'}
                </label>
                <div className="ml-3 border-l-2 border-ink-700 pl-3">
                  <ResourceTemplateEditor
                    resources={template.defaultStats ?? []}
                    onChange={(stats) => handleStatsChange(index, stats)}
                    title=""
                    addLabel={t.worldCreate.addStat ?? '+ Add Stat'}
                    nameLabel={t.worldCreate.statKey ?? 'Key'}
                    namePlaceholder={t.worldCreate.statKeyPlaceholder ?? 'e.g. influence, treasury'}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
