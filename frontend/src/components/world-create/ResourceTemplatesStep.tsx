import type { Dispatch, SetStateAction } from 'react';
import type { ResourceTemplate } from '../../services/worldApi';
import { useTranslation } from '../../i18n';
import { ResourceTemplateEditor } from './ResourceTemplateEditor';

interface ResourceTemplatesStepProps {
  resources: ResourceTemplate[];
  setResources: Dispatch<SetStateAction<ResourceTemplate[]>>;
  locationResources: ResourceTemplate[];
  setLocationResources: Dispatch<SetStateAction<ResourceTemplate[]>>;
}

export function ResourceTemplatesStep({
  resources,
  setResources,
  locationResources,
  setLocationResources,
}: ResourceTemplatesStepProps) {
  const t = useTranslation();
  return (
    <section aria-label={t.worldCreate.resourceTemplatesStep} className="space-y-6">
      <ResourceTemplateEditor
        resources={resources}
        onChange={setResources}
        title={t.worldCreate.resourceTemplates}
        hint={t.worldCreate.resourceHint}
        addLabel={t.worldCreate.add}
        nameLabel={t.worldCreate.nameKey}
        namePlaceholder={t.worldCreate.nameKeyPlaceholder}
      />
      <ResourceTemplateEditor
        resources={locationResources}
        onChange={setLocationResources}
        title={t.worldCreate.locationResources}
        hint={t.worldCreate.locationResourcesHint}
        addLabel={t.worldCreate.add}
        nameLabel={t.worldCreate.statKey}
        namePlaceholder={t.worldCreate.nameKeyPlaceholder}
        accentColor="bg-emerald-400"
      />
    </section>
  );
}
