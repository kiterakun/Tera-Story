import type { Dispatch, SetStateAction } from 'react';
import type { OrganizationTemplate } from '../../types/entities';
import { useTranslation } from '../../i18n';
import { OrganizationTemplateEditor } from './OrganizationTemplateEditor';

interface OrganizationTemplatesStepProps {
  templates: OrganizationTemplate[];
  setTemplates: Dispatch<SetStateAction<OrganizationTemplate[]>>;
}

export function OrganizationTemplatesStep({ templates, setTemplates }: OrganizationTemplatesStepProps) {
  const t = useTranslation();
  return (
    <section aria-label={t.worldCreate.organizationsStep} className="space-y-6">
      <OrganizationTemplateEditor templates={templates} onChange={setTemplates} />
    </section>
  );
}
