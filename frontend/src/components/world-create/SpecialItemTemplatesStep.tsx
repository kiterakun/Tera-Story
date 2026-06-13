import type { Dispatch, SetStateAction } from 'react';
import type { SpecialItemTemplate } from '../../types/entities';
import { useTranslation } from '../../i18n';
import { SpecialItemTemplateEditor } from './SpecialItemTemplateEditor';

interface SpecialItemTemplatesStepProps {
  templates: SpecialItemTemplate[];
  setTemplates: Dispatch<SetStateAction<SpecialItemTemplate[]>>;
}

export function SpecialItemTemplatesStep({ templates, setTemplates }: SpecialItemTemplatesStepProps) {
  const t = useTranslation();
  return (
    <section aria-label={t.worldCreate.specialItemsStep} className="space-y-6">
      <SpecialItemTemplateEditor templates={templates} onChange={setTemplates} />
    </section>
  );
}
