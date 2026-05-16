import { } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { ResourceTemplate } from '../../types/entities';
import { typeColors, typeIcons, typeLabelColors } from '../../utils/statStyles';

interface ResourceTemplateEditorProps {
  resources: ResourceTemplate[];
  onChange: (resources: ResourceTemplate[]) => void;
  title: string;
  hint?: string;
  addLabel: string;
  nameLabel: string;
  namePlaceholder: string;
}


export function ResourceTemplateEditor({
  resources,
  onChange,
  title,
  hint,
  addLabel,
  nameLabel,
  namePlaceholder,
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
        item.defaultValue = item.type !== 'text' && item.type !== 'enum' && value !== '' ? Number(value) : (value as string);
      } else {
        item[field] = value !== '' ? Number(value) : undefined;
      }
    }

    onChange(updated);
  };

  return (
    <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-display text-ink-100 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-accent-400 rounded-full" />
            {title}
          </h2>
          {hint && (
            <p className="text-xs text-ink-200/60 mt-1 ml-4">{hint}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 text-accent-400 hover:text-accent-500 font-medium px-3 py-2 bg-ink-950/50 border border-ink-700 rounded-xl transition-all duration-200 text-sm hover:border-accent-400/30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" />
          </svg>
          {addLabel}
        </button>
      </div>

      <div className="space-y-3">
        {resources.map((res, index) => (
          <div
            key={index}
            className={`bg-ink-950/50 p-4 border border-ink-700/50 rounded-xl border-l-2 ${typeColors[res.type]}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {typeIcons[res.type](16)}
                <span className="text-sm font-medium text-ink-100">{res.key || 'Unnamed'}</span>
                <span className={`text-[10px] font-medium uppercase ${typeLabelColors[res.type]}`}>{res.type}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-ink-200/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Key */}
              <div>
                <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{nameLabel}</label>
                <input
                  required
                  className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 placeholder:text-ink-500 focus:border-accent-400 outline-none transition-all"
                  placeholder={namePlaceholder}
                  value={res.key}
                  onChange={(e) => handleChange(index, 'key', e.target.value)}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.worldCreate.type}</label>
                <select
                  className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 focus:border-accent-400 outline-none transition-all"
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

              {/* Type-specific fields */}
              {res.type === 'number' || res.type === 'progress' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.worldCreate.defaultVal}</label>
                    <input
                      type="number"
                      className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 focus:border-accent-400 outline-none transition-all"
                      value={res.defaultValue ?? ''}
                      onChange={(e) => handleChange(index, 'defaultValue', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.worldCreate.min}</label>
                      <input
                        type="number"
                        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 focus:border-accent-400 outline-none transition-all"
                        value={res.min ?? ''}
                        onChange={(e) => handleChange(index, 'min', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.worldCreate.max}</label>
                      <input
                        type="number"
                        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 focus:border-accent-400 outline-none transition-all"
                        value={res.max ?? ''}
                        onChange={(e) => handleChange(index, 'max', e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : res.type === 'enum' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.worldCreate.defaultVal}</label>
                    <input
                      type="text"
                      className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 focus:border-accent-400 outline-none transition-all"
                      value={res.defaultValue ?? ''}
                      onChange={(e) => handleChange(index, 'defaultValue', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.worldCreate.options}</label>
                    <div className="space-y-2">
                      {(res.options ?? []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-2 items-center">
                          <input
                            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 placeholder:text-ink-500 focus:border-accent-400 outline-none transition-all"
                            placeholder={t.worldCreate.optionsPlaceholder}
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...(res.options ?? [])];
                              newOptions[optIdx] = e.target.value;
                              handleChange(index, 'options', newOptions);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = (res.options ?? []).filter((_, i) => i !== optIdx);
                              handleChange(index, 'options', newOptions);
                            }}
                            className="text-ink-200/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                        className="text-sm text-accent-400 hover:text-accent-300 transition-colors"
                      >
                        + {t.worldCreate.addOption}
                      </button>
                    </div>
                  </div>
                </>
              ) : res.type === 'object' ? (
                <ObjectChildrenEditor
                  children={res.children ?? []}
                  onChange={(children) => handleChange(index, 'children', children)}
                  depth={0}
                />
              ) : (
                <div>
                  <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.worldCreate.defaultVal}</label>
                  <input
                    type="text"
                    className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 focus:border-accent-400 outline-none transition-all"
                    value={res.defaultValue ?? ''}
                    onChange={(e) => handleChange(index, 'defaultValue', e.target.value)}
                  />
                </div>
              )}

              {/* Display Format */}
              <div>
                <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.worldCreate.displayFormat}</label>
                <input
                  className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-base text-ink-100 placeholder:text-ink-500 focus:border-accent-400 outline-none transition-all"
                  placeholder={t.worldCreate.displayFormatPlaceholder}
                  value={res.displayFormat ?? ''}
                  onChange={(e) => handleChange(index, 'displayFormat', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
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
              <input
                className={`flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 ${depth > 0 ? 'text-xs' : 'text-sm'} text-ink-100 placeholder:text-ink-500 focus:border-accent-400 outline-none`}
                placeholder={t.worldCreate.statKey ?? 'Key'}
                value={child.key}
                onChange={(e) => handleChange(childIdx, 'key', e.target.value)}
              />
              <select
                className={`bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 ${depth > 0 ? 'text-xs' : 'text-sm'} text-ink-100 focus:border-accent-400 outline-none`}
                value={child.type}
                onChange={(e) => handleChange(childIdx, 'type', e.target.value)}
              >
                <option value="number">{depth > 0 ? '#' : t.worldCreate.typeNumber}</option>
                <option value="text">{depth > 0 ? 'T' : t.worldCreate.typeText}</option>
                <option value="enum">{depth > 0 ? 'E' : t.worldCreate.typeEnum}</option>
                <option value="pool">{depth > 0 ? 'P' : t.worldCreate.typePool}</option>
                {depth < maxDepth && (
                  <option value="object">{depth > 0 ? 'O' : t.worldCreate.typeObject ?? 'Object'}</option>
                )}
              </select>
              <button
                type="button"
                onClick={() => handleRemove(childIdx)}
                className="text-ink-200/40 hover:text-red-400 p-1 rounded-lg hover:bg-red-400/10 transition-all shrink-0"
              >
                <svg className={`${depth > 0 ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Recursive nested children */}
            {child.type === 'object' && depth < maxDepth && (
              <ObjectChildrenEditor
                children={child.children ?? []}
                onChange={(newChildren) => {
                  const updated = [...children];
                  updated[childIdx] = { ...child, children: newChildren };
                  onChange(updated);
                }}
                depth={depth + 1}
              />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={handleAdd}
          className={`${depth > 0 ? 'text-xs' : 'text-sm'} text-accent-400 hover:text-accent-300 transition-colors`}
        >
          + {t.worldCreate.addSubProperty ?? 'Add Sub-Property'}
        </button>
      </div>
    </div>
  );
}
