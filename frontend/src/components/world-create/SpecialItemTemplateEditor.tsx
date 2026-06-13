import { useTranslation } from '../../i18n';
import { Input } from '../../design-system/Input';
import type { SpecialItemTemplate, SpecialItemFieldDefinition } from '../../types/entities';

interface SpecialItemTemplateEditorProps {
  templates: SpecialItemTemplate[];
  onChange: (templates: SpecialItemTemplate[]) => void;
}

export function SpecialItemTemplateEditor({ templates, onChange }: SpecialItemTemplateEditorProps) {
  const t = useTranslation();

  const handleAdd = () => {
    onChange([...templates, { category: '', description: '', fields: [] }]);
  };

  const handleRemove = (index: number) => {
    onChange(templates.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: 'category' | 'description', value: string) => {
    const updated = [...templates];
    const item = updated[index];
    if (!item) return;
    updated[index] = { ...item, [field]: value };
    onChange(updated);
  };

  const handleAddField = (templateIndex: number) => {
    const updated = [...templates];
    const item = updated[templateIndex];
    if (!item) return;
    updated[templateIndex] = {
      ...item,
      fields: [...item.fields, { name: '', type: 'text' }],
    };
    onChange(updated);
  };

  const handleRemoveField = (templateIndex: number, fieldIndex: number) => {
    const updated = [...templates];
    const item = updated[templateIndex];
    if (!item) return;
    updated[templateIndex] = {
      ...item,
      fields: item.fields.filter((_, i) => i !== fieldIndex),
    };
    onChange(updated);
  };

  const handleFieldChange = (
    templateIndex: number,
    fieldIndex: number,
    key: keyof SpecialItemFieldDefinition,
    value: unknown,
  ) => {
    const updated = [...templates];
    const item = updated[templateIndex];
    if (!item) return;
    const fields = [...item.fields];
    const field = fields[fieldIndex];
    if (!field) return;

    fields[fieldIndex] = {
      ...field,
      [key]:
        key === 'type'
          ? (value as SpecialItemFieldDefinition['type'])
          : key === 'options'
            ? (Array.isArray(value) ? value : (value as string).split(',').map((s) => s.trim()).filter(Boolean))
            : value,
    } as SpecialItemFieldDefinition;
    updated[templateIndex] = { ...item, fields };
    onChange(updated);
  };

  return (
    <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-display text-ink-100 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-purple-400 rounded-full" aria-hidden="true" />
            {t.worldCreate.specialItemTemplates}
          </h2>
          <p className="text-xs text-ink-200/60 mt-1 ml-4">
            {t.worldCreate.specialItemHint}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-medium px-3 py-2 bg-ink-950/50 border border-ink-700 rounded-xl transition-all duration-200 text-sm hover:border-purple-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v16m8-8H4" />
          </svg>
          {t.worldCreate.add}
        </button>
      </div>

      <div className="space-y-4">
        {templates.map((template, index) => {
          const categoryError = !template.category.trim()
            ? t.worldCreate.categoryRequired ?? 'Category is required'
            : undefined;
          return (
            <div
              key={index}
              className="bg-ink-950/50 p-4 border border-ink-700/50 rounded-xl border-l-2 border-l-purple-400"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-ink-100">
                  {template.category || t.worldCreate.unnamedCategory}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  aria-label={`${t.worldCreate.remove ?? 'Remove'} ${template.category || index + 1}`}
                  className="text-ink-200/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <Input
                  label={t.worldCreate.category}
                  placeholder={t.worldCreate.categoryPlaceholder}
                  value={template.category}
                  onChange={(e) => handleChange(index, 'category', e.target.value)}
                  required
                  error={categoryError}
                  inputClassName="bg-ink-800"
                />
                <Input
                  label={t.worldCreate.description}
                  placeholder={t.worldCreate.categoryDescPlaceholder}
                  value={template.description}
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  inputClassName="bg-ink-800"
                />

                <fieldset>
                  <legend className="text-xs font-medium text-ink-200/80 mb-1.5">
                    {t.worldCreate.fields}
                  </legend>
                  <div className="space-y-2">
                    {template.fields.map((field, fieldIdx) => (
                      <div key={fieldIdx} className="flex gap-2 items-center">
                        <Input
                          placeholder={t.worldCreate.fieldName}
                          value={field.name || (field as { key?: string }).key || ''}
                          onChange={(e) => handleFieldChange(index, fieldIdx, 'name', e.target.value)}
                          inputClassName="bg-ink-800"
                          containerClassName="flex-1"
                        />
                        <select
                          className="w-full min-h-[44px] bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm text-ink-100 focus:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 transition-colors"
                          value={field.type}
                          onChange={(e) => handleFieldChange(index, fieldIdx, 'type', e.target.value)}
                        >
                          <option value="text">{t.worldCreate.typeText}</option>
                          <option value="number">{t.worldCreate.typeNumber}</option>
                          <option value="enum">{t.worldCreate.typeEnum}</option>
                        </select>
                        {field.type === 'enum' && (
                          <Input
                            placeholder={t.worldCreate.enumOptionsPlaceholder}
                            value={field.options?.join(', ') ?? ''}
                            onChange={(e) => handleFieldChange(index, fieldIdx, 'options', e.target.value)}
                            inputClassName="bg-ink-800"
                            containerClassName="flex-1"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveField(index, fieldIdx)}
                          aria-label={`${t.worldCreate.remove ?? 'Remove'} ${field.name || fieldIdx + 1}`}
                          className="text-ink-200/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddField(index)}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-md px-2 py-1"
                    >
                      + {t.worldCreate.addField}
                    </button>
                  </div>
                </fieldset>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
