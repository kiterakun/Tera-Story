import { useTranslation } from '../../i18n';
import { Input } from '../../design-system/Input';
import { cn } from '../../design-system/cn';
import type { ResourceTemplate } from '../../types/entities';
import { typeIcons, typeLabelColors } from '../../utils/statStyles';

interface ResourceTemplateEditorProps {
  resources: ResourceTemplate[];
  onChange: (resources: ResourceTemplate[]) => void;
  title: string;
  hint?: string;
  addLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  accentColor?: string;
}

export function ResourceTemplateEditor({
  resources,
  onChange,
  title,
  hint,
  addLabel,
  nameLabel,
  namePlaceholder,
  accentColor = 'bg-accent-400',
}: ResourceTemplateEditorProps) {
  const t = useTranslation();

  const handleAdd = () => {
    onChange([...resources, { key: `Res${resources.length + 1}`, type: 'number', defaultValue: 0 }]);
  };

  const handleRemove = (index: number) => {
    onChange(resources.filter((_, i) => i !== index));
  };

  const handleChange = (
    index: number,
    field: keyof ResourceTemplate,
    value: string | string[] | ResourceTemplate[],
  ) => {
    const updated = [...resources];
    const item = updated[index];
    if (!item) return;

    if (field === 'type') {
      const newType = value as ResourceTemplate['type'];
      item.type = newType;
      if (newType === 'object') {
        item.children = item.children ?? [];
      } else {
        delete item.children;
      }
    } else if (field === 'key') {
      item.key = value as string;
    } else if (field === 'displayFormat') {
      item.displayFormat = value as string;
    } else if (field === 'options') {
      item.options = value as string[];
    } else if (field === 'children') {
      item.children = value as ResourceTemplate[];
    } else if (field === 'min' || field === 'max' || field === 'defaultValue') {
      if (field === 'defaultValue') {
        item.defaultValue =
          item.type !== 'text' && item.type !== 'enum' && value !== '' ? Number(value) : (value as string);
      } else {
        item[field] = value !== '' ? Number(value) : undefined;
      }
    }

    onChange(updated);
  };

  const validateKey = (key: string) => key.trim().length > 0;

  return (
    <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-display text-ink-100 flex items-center gap-2">
            <span className={`w-1.5 h-5 ${accentColor} rounded-full`} aria-hidden="true" />
            {title}
          </h2>
          {hint && (
            <p className="text-xs text-ink-200/60 mt-1 ml-4">{hint}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 text-accent-400 hover:text-accent-500 font-medium px-3 py-2 bg-ink-950/50 border border-ink-700 rounded-xl transition-all duration-200 text-sm hover:border-accent-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v16m8-8H4" />
          </svg>
          {addLabel}
        </button>
      </div>

      <div className="space-y-3">
        {resources.map((res, index) => {
          const Icon = typeIcons[res.type];
          const labelColor = typeLabelColors[res.type];
          const keyError = !validateKey(res.key) ? t.worldCreate.keyRequired ?? 'Key is required' : undefined;

          return (
            <div key={index} className="bg-ink-950/50 border border-ink-700/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {Icon && <Icon size={14} className={labelColor} aria-hidden="true" />}
                  <span className={cn('text-xs uppercase tracking-wider', labelColor)}>
                    {res.type}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  aria-label={`${t.worldCreate.remove ?? 'Remove'} ${res.key || index + 1}`}
                  className="text-ink-200/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label={nameLabel}
                  placeholder={namePlaceholder}
                  value={res.key}
                  onChange={(e) => handleChange(index, 'key', e.target.value)}
                  required
                  error={keyError}
                  inputClassName="bg-ink-800"
                />

                <div>
                  <label
                    htmlFor={`res-type-${index}`}
                    className="block text-xs font-medium text-ink-200/80 mb-1.5"
                  >
                    {t.worldCreate.type ?? 'Type'}
                  </label>
                  <select
                    id={`res-type-${index}`}
                    className="w-full min-h-[44px] bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm text-ink-100 focus:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 transition-colors"
                    value={res.type}
                    onChange={(e) => handleChange(index, 'type', e.target.value)}
                  >
                    <option value="number">{t.worldCreate.typeNumber}</option>
                    <option value="progress">{t.worldCreate.typeProgress}</option>
                    <option value="text">{t.worldCreate.typeText}</option>
                    <option value="enum">{t.worldCreate.typeEnum}</option>
                    <option value="pool">{t.worldCreate.typePool}</option>
                    <option value="object">{t.worldCreate.typeObject ?? 'Object (nested)'}</option>
                  </select>
                </div>

                {res.type === 'number' || res.type === 'progress' ? (
                  <div className="space-y-4">
                    <Input
                      type="number"
                      label={t.worldCreate.defaultVal}
                      value={res.defaultValue ?? ''}
                      onChange={(e) => handleChange(index, 'defaultValue', e.target.value)}
                      inputClassName="bg-ink-800"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        label={t.worldCreate.min}
                        value={res.min ?? ''}
                        onChange={(e) => handleChange(index, 'min', e.target.value)}
                        inputClassName="bg-ink-800"
                      />
                      <Input
                        type="number"
                        label={t.worldCreate.max}
                        value={res.max ?? ''}
                        onChange={(e) => handleChange(index, 'max', e.target.value)}
                        inputClassName="bg-ink-800"
                      />
                    </div>
                  </div>
                ) : res.type === 'enum' ? (
                  <div className="space-y-4">
                    <Input
                      label={t.worldCreate.defaultVal}
                      value={(res.defaultValue as string) ?? ''}
                      onChange={(e) => handleChange(index, 'defaultValue', e.target.value)}
                      inputClassName="bg-ink-800"
                    />
                    <fieldset>
                      <legend className="text-xs font-medium text-ink-200/80 mb-1.5">
                        {t.worldCreate.options}
                      </legend>
                      <div className="space-y-2">
                        {(res.options ?? []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-2 items-center">
                            <Input
                              placeholder={t.worldCreate.optionsPlaceholder}
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...(res.options ?? [])];
                                newOptions[optIdx] = e.target.value;
                                handleChange(index, 'options', newOptions);
                              }}
                              inputClassName="bg-ink-800"
                              containerClassName="flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = (res.options ?? []).filter((_, i) => i !== optIdx);
                                handleChange(index, 'options', newOptions);
                              }}
                              aria-label={`${t.worldCreate.remove ?? 'Remove'} option ${optIdx + 1}`}
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
                          onClick={() => {
                            const newOptions = [...(res.options ?? []), ''];
                            handleChange(index, 'options', newOptions);
                          }}
                          className="text-sm text-accent-400 hover:text-accent-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-md px-2 py-1"
                        >
                          + {t.worldCreate.addOption}
                        </button>
                      </div>
                    </fieldset>
                  </div>
                ) : res.type === 'object' ? (
                  <ObjectChildrenEditor
                    children={res.children ?? []}
                    onChange={(children) => handleChange(index, 'children', children)}
                    depth={0}
                  />
                ) : (
                  <Input
                    label={t.worldCreate.defaultVal}
                    value={(res.defaultValue as string) ?? ''}
                    onChange={(e) => handleChange(index, 'defaultValue', e.target.value)}
                    inputClassName="bg-ink-800"
                  />
                )}

                <Input
                  label={t.worldCreate.displayFormat}
                  placeholder={t.worldCreate.displayFormatPlaceholder}
                  value={res.displayFormat ?? ''}
                  onChange={(e) => handleChange(index, 'displayFormat', e.target.value)}
                  inputClassName="bg-ink-800"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ObjectChildrenEditorProps {
  children: ResourceTemplate[];
  onChange: (children: ResourceTemplate[]) => void;
  depth: number;
}

function ObjectChildrenEditor({ children, onChange, depth }: ObjectChildrenEditorProps) {
  const t = useTranslation();
  const maxDepth = 2;

  const handleAdd = () => {
    onChange([...children, { key: '', type: 'number' }]);
  };

  const handleRemove = (index: number) => {
    onChange(children.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof ResourceTemplate, value: string | ResourceTemplate[]) => {
    const updated = [...children];
    const item = updated[index];
    if (!item) return;

    if (field === 'key') {
      item.key = value as string;
    } else if (field === 'type') {
      const newType = value as ResourceTemplate['type'];
      item.type = newType;
      if (newType === 'object') {
        item.children = item.children ?? [];
      } else {
        delete item.children;
      }
    } else if (field === 'displayFormat') {
      item.displayFormat = value as string;
    } else if (field === 'children') {
      item.children = value as ResourceTemplate[];
    }

    onChange(updated);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
        {t.worldCreate.subProperties ?? 'Sub-Properties'}
      </label>
      <div className={`space-y-2 ${depth > 0 ? 'ml-2' : 'ml-3'} border-l-2 border-ink-700 pl-3`}>
        {children.map((child, childIdx) => (
          <div key={childIdx} className="bg-ink-800/50 rounded-lg p-3 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder={t.worldCreate.statKey ?? 'Key'}
                  value={child.key}
                  onChange={(e) => handleChange(childIdx, 'key', e.target.value)}
                  inputClassName={depth > 0 ? 'bg-ink-800 text-xs' : 'bg-ink-800 text-sm'}
                />
                <select
                  className="w-full min-h-[44px] bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm text-ink-100 focus:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 transition-colors"
                  value={child.type}
                  onChange={(e) => handleChange(childIdx, 'type', e.target.value)}
                  disabled={depth >= maxDepth && child.type !== 'object'}
                >
                  <option value="number">number</option>
                  <option value="progress">progress</option>
                  <option value="text">text</option>
                  <option value="enum">enum</option>
                  <option value="pool">pool</option>
                  {depth < maxDepth && <option value="object">object</option>}
                </select>
                {child.type === 'object' && depth < maxDepth && (
                  <ObjectChildrenEditor
                    children={child.children ?? []}
                    onChange={(newChildren) => handleChange(childIdx, 'children', newChildren)}
                    depth={depth + 1}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(childIdx)}
                aria-label={`${t.worldCreate.remove ?? 'Remove'} ${child.key || childIdx + 1}`}
                className="text-ink-200/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all shrink-0 self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAdd}
          className="text-sm text-accent-400 hover:text-accent-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-md px-2 py-1"
        >
          + {t.worldCreate.addSubProperty ?? 'Add sub-property'}
        </button>
      </div>
    </div>
  );
}
