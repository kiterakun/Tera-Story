import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldStore } from '../stores/worldStore';
import { ResourceTemplate, World } from '../services/worldApi';

export default function WorldCreatePage() {
  const navigate = useNavigate();
  const { createWorld } = useWorldStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState<World['genre']>('fantasy');
  
  const [resources, setResources] = useState<ResourceTemplate[]>([
    { key: 'HP', type: 'progress', min: 0, max: 100, defaultValue: 100 }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddResource = () => {
    setResources([...resources, { key: `Res${resources.length + 1}`, type: 'number', defaultValue: 0 }]);
  };

  const handleRemoveResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const handleResourceChange = (index: number, field: keyof ResourceTemplate, value: string | number) => {
    const updated = [...resources];
    const item = updated[index];
    
    // Type casting here since we know what we're updating
    if (field === 'type') {
      item.type = value as ResourceTemplate['type'];
    } else if (field === 'key') {
      item.key = value as string;
    } else if (field === 'displayFormat') {
      item.displayFormat = value as string;
    } else if (field === 'min' || field === 'max' || field === 'defaultValue') {
      // Handle number casting if it's not a text field
      if (item.type !== 'text' && value !== '') {
        (item as any)[field] = Number(value);
      } else {
        (item as any)[field] = value;
      }
    }
    
    setResources(updated);
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
        resourceTemplates: resources
      });
      navigate(`/worlds/${newWorld._id}`);
    } catch (error) {
      console.error('Failed to create world:', error);
      alert('Failed to create world');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-display text-accent-400">Forge New World</h1>
        <p className="text-ink-200/70 mt-2">Define the rules, resources, and setting of your universe.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Card */}
        <div className="bg-ink-800 border border-ink-700 rounded-xl p-6">
          <h2 className="text-xl font-display text-ink-200 mb-6">General Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-200 mb-2">World Name <span className="text-red-400">*</span></label>
              <input
                required
                className="w-full bg-ink-950 border border-ink-700 rounded-lg px-4 py-3 text-ink-100 placeholder:text-ink-200/30 focus:border-accent-400 focus:outline-none transition-colors"
                placeholder="e.g. Aethelgard"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-200 mb-2">Genre</label>
              <select
                className="w-full bg-ink-950 border border-ink-700 rounded-lg px-4 py-3 text-ink-100 focus:border-accent-400 focus:outline-none transition-colors"
                value={genre}
                onChange={(e) => setGenre(e.target.value as World['genre'])}
              >
                <option value="fantasy">Fantasy</option>
                <option value="sci-fi">Sci-Fi</option>
                <option value="wuxia">Wuxia / Cultivation</option>
                <option value="modern">Modern</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-200 mb-2">Description</label>
              <textarea
                rows={4}
                className="w-full bg-ink-950 border border-ink-700 rounded-lg px-4 py-3 text-ink-100 placeholder:text-ink-200/30 focus:border-accent-400 focus:outline-none transition-colors resize-none"
                placeholder="Describe the setting, lore, and atmosphere..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Resources Card */}
        <div className="bg-ink-800 border border-ink-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-display text-ink-200">Resource Templates</h2>
              <p className="text-sm text-ink-200/70">What stats to track globally or per character.</p>
            </div>
            <button
              type="button"
              onClick={handleAddResource}
              className="text-accent-400 hover:text-accent-600 font-medium px-4 py-2 bg-ink-950 border border-ink-700 rounded-lg transition-colors text-sm"
            >
              + Add Resource
            </button>
          </div>

          <div className="space-y-4">
            {resources.map((res, index) => (
              <div key={index} className="flex gap-4 items-start bg-ink-950 p-4 border border-ink-700 rounded-lg">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                  
                  {/* Key */}
                  <div className="col-span-2">
                    <label className="block text-xs text-ink-200/70 mb-1">Resource Name/Key</label>
                    <input
                      required
                      className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm text-ink-100 focus:border-accent-400 focus:outline-none"
                      placeholder="e.g. Gold"
                      value={res.key}
                      onChange={(e) => handleResourceChange(index, 'key', e.target.value)}
                    />
                  </div>
                  
                  {/* Type */}
                  <div className="col-span-1">
                    <label className="block text-xs text-ink-200/70 mb-1">Type</label>
                    <select
                      className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm text-ink-100 focus:border-accent-400 focus:outline-none"
                      value={res.type}
                      onChange={(e) => handleResourceChange(index, 'type', e.target.value)}
                    >
                      <option value="number">Number</option>
                      <option value="progress">Progress/Gauge</option>
                      <option value="text">Text</option>
                      <option value="enum">Enum/Options</option>
                    </select>
                  </div>

                  {/* Min / Max options mostly for progress or numbers */}
                  {(res.type === 'number' || res.type === 'progress') ? (
                    <>
                      <div className="col-span-1">
                        <label className="block text-xs text-ink-200/70 mb-1">Default</label>
                        <input
                          type="number"
                          className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm text-ink-100 focus:border-accent-400 focus:outline-none"
                          value={res.defaultValue ?? ''}
                          onChange={(e) => handleResourceChange(index, 'defaultValue', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex gap-2">
                        <div className="w-1/2">
                          <label className="block text-xs text-ink-200/70 mb-1">Min</label>
                          <input
                            type="number"
                            className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm text-ink-100 focus:border-accent-400 focus:outline-none"
                            value={res.min ?? ''}
                            onChange={(e) => handleResourceChange(index, 'min', e.target.value)}
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-xs text-ink-200/70 mb-1">Max</label>
                          <input
                            type="number"
                            className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm text-ink-100 focus:border-accent-400 focus:outline-none"
                            value={res.max ?? ''}
                            onChange={(e) => handleResourceChange(index, 'max', e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2">
                        <label className="block text-xs text-ink-200/70 mb-1">Default (Text)</label>
                        <input
                          type="text"
                          className="w-full bg-ink-800 border border-ink-700 rounded-md px-3 py-2 text-sm text-ink-100 focus:border-accent-400 focus:outline-none"
                          value={res.defaultValue ?? ''}
                          onChange={(e) => handleResourceChange(index, 'defaultValue', e.target.value)}
                        />
                    </div>
                  )}

                </div>
                
                <button
                  type="button"
                  onClick={() => handleRemoveResource(index)}
                  className="mt-6 text-ink-200/50 hover:text-red-400 p-2 border border-transparent hover:border-red-400/30 rounded-md transition-colors"
                  title="Remove Resource"
                >
                  X
                </button>
              </div>
            ))}
            
            {resources.length === 0 && (
              <div className="text-center py-6 border border-dashed border-ink-700 rounded-lg text-ink-200/50 text-sm">
                No resources defined. World stats will be empty by default.
              </div>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/worlds')}
            className="px-6 py-3 font-medium text-ink-200 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-accent-600 hover:bg-accent-400 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? 'Forging World...' : 'Create World'}
          </button>
        </div>
      </form>
    </div>
  );
}
