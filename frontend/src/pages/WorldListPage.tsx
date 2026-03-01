import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorldStore } from '../stores/worldStore';

export default function WorldListPage() {
  const navigate = useNavigate();
  const { worlds, isLoading, fetchWorlds, createFromTemplate } = useWorldStore();

  useEffect(() => {
    fetchWorlds().catch(console.error);
  }, [fetchWorlds]);

  const handleTemplateCreate = async (templateId: string, name: string) => {
    try {
      const newWorld = await createFromTemplate(templateId, name);
      navigate(`/worlds/${newWorld._id}`);
    } catch (error) {
      console.error('Failed to create world from template:', error);
      alert('Failed to create world');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-display text-accent-400">My Worlds</h1>
        <Link
          to="/worlds/create"
          className="px-4 py-2 bg-accent-600 hover:bg-accent-400 text-white rounded-lg transition-colors"
        >
          + Create World
        </Link>
      </div>

      {isLoading && worlds.length === 0 ? (
        <div className="text-center py-12 text-ink-200">Loading worlds...</div>
      ) : worlds.length === 0 ? (
        <div className="bg-ink-800 border border-ink-700 rounded-xl p-12 text-center">
          <h2 className="text-2xl font-display text-ink-200 mb-4">No worlds yet</h2>
          <p className="text-ink-200/70 mb-8">Create your first world or use a template to get started.</p>
          
          <div className="flex justify-center gap-4">
            <Link
              to="/worlds/create"
              className="px-6 py-3 bg-accent-600 hover:bg-accent-400 text-white rounded-lg transition-colors font-medium"
            >
              Start from Scratch
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {worlds.map((world) => (
            <Link
              key={world._id}
              to={`/worlds/${world._id}`}
              className="block bg-ink-800 border border-ink-700 rounded-xl p-6 hover:border-accent-400 transition-colors group"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-display text-ink-200 group-hover:text-accent-400 transition-colors">
                  {world.name}
                </h2>
                <span className="px-3 py-1 bg-ink-700 text-xs uppercase tracking-wider text-ink-200 rounded-full">
                  {world.genre}
                </span>
              </div>
              
              <p className="text-ink-200/70 mb-6 line-clamp-3">
                {world.description || 'No description provided.'}
              </p>

              <div className="flex justify-between items-center text-sm text-ink-200/50">
                <span>{world.resourceTemplates?.length || 0} resources</span>
                <span>{new Date(world.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-16">
        <h3 className="text-xl font-display text-ink-200 mb-6">Quick Start Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleTemplateCreate('fantasy', 'New Fantasy World')}
            className="p-6 bg-ink-800 border border-ink-700 rounded-xl hover:border-accent-400 transition-colors text-left"
          >
            <h4 className="text-lg font-bold text-ink-100 mb-2">Fantasy Realm</h4>
            <p className="text-sm text-ink-200/70">Classic RPG setting with HP, MP, Gold, and Experience templates.</p>
          </button>
          
          <button
            onClick={() => handleTemplateCreate('wuxia', 'New Martial World')}
            className="p-6 bg-ink-800 border border-ink-700 rounded-xl hover:border-accent-400 transition-colors text-left"
          >
            <h4 className="text-lg font-bold text-ink-100 mb-2">Wuxia / Cultivation</h4>
            <p className="text-sm text-ink-200/70">Cultivation setting with Qi, Realm, Spirit, and Talent templates.</p>
          </button>
          
          <button
            onClick={() => handleTemplateCreate('sci-fi', 'New Sci-Fi World')}
            className="p-6 bg-ink-800 border border-ink-700 rounded-xl hover:border-accent-400 transition-colors text-left"
          >
            <h4 className="text-lg font-bold text-ink-100 mb-2">Sci-Fi Universe</h4>
            <p className="text-sm text-ink-200/70">Space setting with Credits, Energy, Tech Level, and Reputation.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
