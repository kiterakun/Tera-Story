import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldStore } from '../stores/worldStore';
import { useTranslation } from '../i18n';
import type { ResourceTemplate, SpecialItemTemplate, SpecialItemFieldDefinition, World } from '../services/worldApi';
import * as supportApi from '../services/supportApi';
import { Sparkles, Loader2 } from 'lucide-react';
export default function WorldCreatePage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const { createWorld } = useWorldStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState<World['genre']>('fantasy');
  
  const [resources, setResources] = useState<ResourceTemplate[]>([
    { key: 'HP', type: 'progress', min: 0, max: 100, defaultValue: 100 }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [specialItemTemplates, setSpecialItemTemplates] = useState<SpecialItemTemplate[]>([]);
  const [isEnrichingWorld, setIsEnrichingWorld] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleAddResource = () => {
    setResources([...resources, { key: `Res${resources.length + 1}`, type: 'number', defaultValue: 0 }]);
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleResourceChange = (index: number, field: keyof ResourceTemplate, value: string | number) => {
    const updated = [...resources];
    const item = updated[index];
    
    if (field === 'type') {
      item.type = value as ResourceTemplate['type'];
    } else if (field === 'key') {
      item.key = value as string;
    } else if (field === 'displayFormat') {
      item.displayFormat = value as string;
    } else if (field === 'min' || field === 'max' || field === 'defaultValue') {
      if (item.type !== 'text' && value !== '') {
        (item as any)[field] = Number(value);
      } else {
        (item as any)[field] = value;
      }
    }
    
    setResources(updated);
  };

  // Special Item Template handlers
  const handleAddSpecialItemTemplate = () => {
    setSpecialItemTemplates([...specialItemTemplates, { category: '', description: '', fields: [] }]);
  };

  const handleRemoveSpecialItemTemplate = (index: number) => {
    setSpecialItemTemplates(specialItemTemplates.filter((_, i) => i !== index));
  };

  const handleSpecialItemChange = (index: number, field: 'category' | 'description', value: string) => {
    const updated = [...specialItemTemplates];
    updated[index] = { ...updated[index], [field]: value };
    setSpecialItemTemplates(updated);
  };

  const handleAddField = (templateIndex: number) => {
    const updated = [...specialItemTemplates];
    updated[templateIndex] = {
      ...updated[templateIndex],
      fields: [...updated[templateIndex].fields, { name: '', type: 'text' }],
    };
    setSpecialItemTemplates(updated);
  };

  const handleRemoveField = (templateIndex: number, fieldIndex: number) => {
    const updated = [...specialItemTemplates];
    updated[templateIndex] = {
      ...updated[templateIndex],
      fields: updated[templateIndex].fields.filter((_, i) => i !== fieldIndex),
    };
    setSpecialItemTemplates(updated);
  };

  const handleFieldChange = (templateIndex: number, fieldIndex: number, key: keyof SpecialItemFieldDefinition, value: string) => {
    const updated = [...specialItemTemplates];
    const fields = [...updated[templateIndex].fields];
    fields[fieldIndex] = { ...fields[fieldIndex], [key]: key === 'type' ? value as SpecialItemFieldDefinition['type'] : value };
    updated[templateIndex] = { ...updated[templateIndex], fields };
    setSpecialItemTemplates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const newWorld = await createWorld({
        name,
        description,
        genre,
        resourceTemplates: resources,
        specialItemTemplates: specialItemTemplates.filter(t => t.category.trim()),
      });
      navigate(`/worlds/${newWorld._id}`);
    } catch (error) {
      console.error('Failed to create world:', error);
      alert(t.worldCreate.failedToCreate);
      setIsSubmitting(false);
    }
  };

  const handleAiGenerateWorld = async () => {
    if (!aiPrompt.trim()) return;
    setIsEnrichingWorld(true);
    try {
      const result = await supportApi.enrichWorld(aiPrompt.trim());
      if (result.name) setName(result.name);
      if (result.description) setDescription(result.description);
      if (result.genre) {
        const validGenres: World['genre'][] = ['fantasy', 'sci-fi', 'wuxia', 'modern', 'custom'];
        setGenre(validGenres.includes(result.genre as World['genre']) ? result.genre as World['genre'] : 'custom');
      }
      if (result.resourceTemplates?.length) {
        setResources(result.resourceTemplates.map(rt => ({
          key: rt.key,
          type: rt.type as ResourceTemplate['type'],
          min: rt.min,
          max: rt.max,
          defaultValue: rt.defaultValue,
        })));
      }
      if ((result as any).specialItemTemplates?.length) {
        setSpecialItemTemplates((result as any).specialItemTemplates.map((sit: any) => ({
          category: sit.category || '',
          description: sit.description || '',
          fields: (sit.fields || []).map((f: any) => ({ name: f.name || '', type: f.type || 'text' })),
        })));
      }
    } catch (err) {
      console.error('AI world generation failed:', err);
    } finally {
      setIsEnrichingWorld(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-display text-ink-100">{t.worldCreate.title}</h1>
        <p className="text-ink-200/60 mt-2 text-sm">{t.worldCreate.subtitle}</p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent-400/60 via-accent-600/30 to-transparent" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AI World Generation */}
        <div className="bg-gradient-to-br from-accent-600/10 to-purple-600/10 border border-accent-400/20 rounded-2xl p-6">
          <h2 className="text-lg font-display text-ink-100 mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-accent-400" />
            {t.worldCreate.aiGenerateTitle}
          </h2>
          <p className="text-xs text-ink-200/60 mb-4">{t.worldCreate.aiGenerateHint}</p>
          <textarea
            rows={3}
            className="w-full bg-ink-950 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all resize-none text-sm mb-3"
            placeholder={t.worldCreate.aiPromptPlaceholder}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            disabled={isEnrichingWorld}
          />
          <button
            type="button"
            onClick={handleAiGenerateWorld}
            disabled={isEnrichingWorld || !aiPrompt.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm disabled:opacity-50"
          >
            {isEnrichingWorld ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t.worldCreate.aiGenerating}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {t.worldCreate.aiGenerateWorld}
              </>
            )}
          </button>
        </div>

        {/* Basic Info Card */}
        <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
          <h2 className="text-lg font-display text-ink-100 mb-5 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-accent-400 rounded-full" />
            {t.worldCreate.generalInfo}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.worldCreate.worldName} <span className="text-red-400">*</span></label>
              <input
                required
                className="w-full bg-ink-950 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all text-sm"
                placeholder={t.worldCreate.worldNamePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.worldCreate.genre}</label>
              <select
                className="w-full bg-ink-950 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all text-sm"
                value={genre}
                onChange={(e) => setGenre(e.target.value as World['genre'])}
              >
                <option value="fantasy">{t.worldCreate.genreFantasy}</option>
                <option value="sci-fi">{t.worldCreate.genreSciFi}</option>
                <option value="wuxia">{t.worldCreate.genreWuxia}</option>
                <option value="modern">{t.worldCreate.genreModern}</option>
                <option value="custom">{t.worldCreate.genreCustom}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-200/80 mb-1.5">{t.worldCreate.description}</label>
              <textarea
                rows={4}
                className="w-full bg-ink-950 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all resize-none text-sm"
                placeholder={t.worldCreate.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Resources Card */}
        <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-display text-ink-100 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-accent-400 rounded-full" />
                {t.worldCreate.resourceTemplates}
              </h2>
              <p className="text-xs text-ink-200/60 mt-1 ml-4">{t.worldCreate.resourceHint}</p>
            </div>
            <button
              type="button"
              onClick={handleAddResource}
              className="inline-flex items-center gap-1.5 text-accent-400 hover:text-accent-500 font-medium px-3 py-2 bg-ink-950/50 border border-ink-700 rounded-xl transition-all duration-200 text-sm hover:border-accent-400/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
              {t.worldCreate.add}
            </button>
          </div>

          <div className="space-y-3">
            {resources.map((res, index) => (
              <div key={index} className="flex gap-3 items-start bg-ink-950/50 p-4 border border-ink-700/50 rounded-xl">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                  
                  {/* Key */}
                  <div className="col-span-2">
                    <label className="block text-xs text-ink-200/60 mb-1">{t.worldCreate.nameKey}</label>
                    <input
                      required
                      className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-accent-400 outline-none transition-all"
                      placeholder={t.worldCreate.nameKeyPlaceholder}
                      value={res.key}
                      onChange={(e) => handleResourceChange(index, 'key', e.target.value)}
                    />
                  </div>
                  
                  {/* Type */}
                  <div className="col-span-1">
                    <label className="block text-xs text-ink-200/60 mb-1">{t.worldCreate.type}</label>
                    <select
                      className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-accent-400 outline-none transition-all"
                      value={res.type}
                      onChange={(e) => handleResourceChange(index, 'type', e.target.value)}
                    >
                      <option value="number">{t.worldCreate.typeNumber}</option>
                      <option value="progress">{t.worldCreate.typeProgress}</option>
                      <option value="text">{t.worldCreate.typeText}</option>
                      <option value="enum">{t.worldCreate.typeEnum}</option>
                    </select>
                  </div>

                  {(res.type === 'number' || res.type === 'progress') ? (
                    <>
                      <div className="col-span-1">
                        <label className="block text-xs text-ink-200/60 mb-1">{t.worldCreate.defaultVal}</label>
                        <input
                          type="number"
                          className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-accent-400 outline-none transition-all"
                          value={res.defaultValue ?? ''}
                          onChange={(e) => handleResourceChange(index, 'defaultValue', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex gap-2">
                        <div className="w-1/2">
                          <label className="block text-xs text-ink-200/60 mb-1">{t.worldCreate.min}</label>
                          <input
                            type="number"
                            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-accent-400 outline-none transition-all"
                            value={res.min ?? ''}
                            onChange={(e) => handleResourceChange(index, 'min', e.target.value)}
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-xs text-ink-200/60 mb-1">{t.worldCreate.max}</label>
                          <input
                            type="number"
                            className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-accent-400 outline-none transition-all"
                            value={res.max ?? ''}
                            onChange={(e) => handleResourceChange(index, 'max', e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2">
                      <label className="block text-xs text-ink-200/60 mb-1">{t.worldCreate.defaultText}</label>
                      <input
                        type="text"
                        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-accent-400 outline-none transition-all"
                        value={res.defaultValue ?? ''}
                        onChange={(e) => handleResourceChange(index, 'defaultValue', e.target.value)}
                      />
                    </div>
                  )}

                </div>
                
                <button
                  type="button"
                  onClick={() => handleRemoveResource(index)}
                  className="mt-5 text-ink-200/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all"
                  title={t.worldCreate.removeResource}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            
            {resources.length === 0 && (
              <div className="text-center py-8 border border-dashed border-ink-700 rounded-xl text-ink-200/40 text-sm">
                {t.worldCreate.noResources}
              </div>
            )}
          </div>
        </div>

        {/* Special Item Templates Card */}
        <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-display text-ink-100 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-purple-400 rounded-full" />
                {t.worldCreate.specialItemTemplates}
              </h2>
              <p className="text-xs text-ink-200/60 mt-1 ml-4">{t.worldCreate.specialItemHint}</p>
            </div>
            <button
              type="button"
              onClick={handleAddSpecialItemTemplate}
              className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-medium px-3 py-2 bg-ink-950/50 border border-ink-700 rounded-xl transition-all duration-200 text-sm hover:border-purple-400/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
              {t.worldCreate.add}
            </button>
          </div>

          <div className="space-y-4">
            {specialItemTemplates.map((sit, tIdx) => (
              <div key={tIdx} className="bg-ink-950/50 p-4 border border-ink-700/50 rounded-xl space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-ink-200/60 mb-1">{t.worldCreate.categoryName}</label>
                      <input
                        required
                        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-purple-400 outline-none transition-all"
                        placeholder={t.worldCreate.categoryNamePlaceholder}
                        value={sit.category}
                        onChange={(e) => handleSpecialItemChange(tIdx, 'category', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-200/60 mb-1">{t.worldCreate.categoryDescription}</label>
                      <input
                        className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-purple-400 outline-none transition-all"
                        placeholder={t.worldCreate.categoryDescriptionPlaceholder}
                        value={sit.description}
                        onChange={(e) => handleSpecialItemChange(tIdx, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecialItemTemplate(tIdx)}
                    className="mt-5 text-ink-200/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-all"
                    title={t.worldCreate.removeCategory}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Custom Fields */}
                <div className="ml-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-ink-200/50 font-medium">{t.worldCreate.customFields}</span>
                    <button
                      type="button"
                      onClick={() => handleAddField(tIdx)}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      + {t.worldCreate.addField}
                    </button>
                  </div>
                  {sit.fields.map((field, fIdx) => (
                    <div key={fIdx} className="flex gap-2 items-center mb-2">
                      <input
                        className="flex-1 bg-ink-800 border border-ink-700 rounded-lg px-3 py-1.5 text-xs text-ink-100 focus:border-purple-400 outline-none transition-all"
                        placeholder={t.worldCreate.fieldName}
                        value={field.name}
                        onChange={(e) => handleFieldChange(tIdx, fIdx, 'name', e.target.value)}
                      />
                      <select
                        className="bg-ink-800 border border-ink-700 rounded-lg px-2 py-1.5 text-xs text-ink-100 focus:border-purple-400 outline-none transition-all"
                        value={field.type}
                        onChange={(e) => handleFieldChange(tIdx, fIdx, 'type', e.target.value)}
                      >
                        <option value="text">{t.worldCreate.typeText}</option>
                        <option value="number">{t.worldCreate.typeNumber}</option>
                        <option value="enum">{t.worldCreate.typeEnum}</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(tIdx, fIdx)}
                        className="text-ink-200/40 hover:text-red-400 p-1 rounded transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {specialItemTemplates.length === 0 && (
              <div className="text-center py-8 border border-dashed border-ink-700 rounded-xl text-ink-200/40 text-sm">
                {t.worldCreate.noSpecialItems}
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/worlds')}
            className="px-5 py-2.5 font-medium text-ink-200 hover:text-ink-100 transition-colors text-sm rounded-xl hover:bg-ink-800"
            disabled={isSubmitting}
          >
            {t.worldCreate.cancel}
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 text-sm shadow-sm hover:shadow-lg hover:shadow-accent-600/20"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                {t.worldCreate.forging}
              </span>
            ) : t.worldCreate.createWorld}
          </button>
        </div>
      </form>
    </div>
  );
}
