import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWorldStore } from '../stores/worldStore';

export default function WorldDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorld, isLoading, fetchWorld, deleteWorld } = useWorldStore();

  useEffect(() => {
    if (id) {
      fetchWorld(id).catch(console.error);
    }
  }, [id, fetchWorld]);

  const handleDelete = async () => {
    if (!currentWorld || !window.confirm(`Are you sure you want to delete "${currentWorld.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteWorld(currentWorld._id);
      navigate('/worlds');
    } catch (error) {
      console.error('Failed to delete world:', error);
      alert('Failed to delete world');
    }
  };

  if (isLoading && !currentWorld) {
    return <div className="text-center py-12 text-ink-200">Loading world details...</div>;
  }

  if (!currentWorld) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center pt-24">
        <h2 className="text-2xl font-display text-ink-200 mb-4">World not found</h2>
        <Link to="/worlds" className="text-accent-400 hover:text-accent-600 transition-colors">
          &larr; Return to Worlds
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Top Nav */}
      <div className="mb-8">
        <Link to="/worlds" className="text-ink-200/50 hover:text-accent-400 hover:underline transition-colors text-sm font-medium flex gap-2 items-center">
          &larr; Back to Worlds
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Info */}
          <div className="bg-ink-800 border border-ink-700 rounded-xl p-8 sticky top-4 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl font-display text-accent-400 mb-3">{currentWorld.name}</h1>
                <span className="px-3 py-1 bg-ink-950 border border-ink-700 text-xs uppercase tracking-wider text-ink-200 rounded-full inline-block">
                  {currentWorld.genre}
                </span>
              </div>
            </div>
            
            <p className="text-ink-100/80 leading-relaxed text-lg whitespace-pre-wrap">
              {currentWorld.description || 'No description provided.'}
            </p>
          </div>
          
          {/* Recent Playthroughs */}
          <div className="bg-ink-800 border border-ink-700 rounded-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display text-ink-200">Playthroughs</h2>
              <button
                className="px-4 py-2 bg-accent-600 hover:bg-accent-400 text-white rounded-lg transition-colors font-medium text-sm shadow-md"
                title="Start a new adventure in this world"
                onClick={() => alert('New Playthrough logic handled in T14.')}
              >
                + Start Journey
              </button>
            </div>
            
            {/* Playthroughs list stub */}
            <div className="border border-dashed border-ink-700 py-8 text-center rounded-lg bg-ink-950/50">
              <p className="text-ink-200/50 text-sm">No active characters in this world yet.</p>
              <p className="text-ink-200/30 text-xs mt-2">Playthroughs feature implementation is coming in Task #14.</p>
            </div>
          </div>
        </div>

        {/* Sidebar (1 col) */}
        <div className="space-y-8">
          {/* World Settings / Actions Sidebar Block */}
          <div className="bg-ink-800 border border-ink-700 rounded-xl p-6">
             <h3 className="text-lg font-display text-ink-200 border-b border-ink-700 pb-4 mb-4">World Management</h3>
             <p className="text-xs text-ink-200/50 mb-6">Created on {new Date(currentWorld.createdAt).toLocaleDateString()}</p>
             
             <div className="space-y-3">
               <button className="w-full px-4 py-2 border border-ink-700 hover:border-accent-400 bg-ink-950 text-ink-200 rounded-lg transition-colors text-sm font-medium">
                 Edit World Info
               </button>
               <button 
                onClick={handleDelete}
                className="w-full px-4 py-2 border border-ink-700 hover:border-red-400/50 hover:bg-red-400/10 text-red-400/80 hover:text-red-400 rounded-lg transition-colors text-sm font-medium"
               >
                 Delete World
               </button>
             </div>
          </div>

          {/* Resources Summary Sidebar Block */}
          <div className="bg-ink-800 border border-ink-700 rounded-xl p-6">
            <h3 className="text-lg font-display text-ink-200 border-b border-ink-700 pb-4 mb-4">Resource Templates</h3>
            
            {currentWorld.resourceTemplates?.length === 0 ? (
              <p className="text-sm text-ink-200/50">No resources defined.</p>
            ) : (
              <ul className="space-y-4">
                {currentWorld.resourceTemplates?.map((res, i) => (
                  <li key={i} className="flex flex-col bg-ink-950 p-3 rounded-lg border border-ink-800 relative group text-sm">
                    <div className="font-bold text-ink-100 flex justify-between">
                      <span>{res.key}</span>
                      <span className="text-xs font-normal text-ink-200/50 border border-ink-700 px-2 rounded tracking-wide">
                        {res.type}
                      </span>
                    </div>
                    
                    {(res.type === 'number' || res.type === 'progress') && (
                      <div className="text-xs text-ink-200/70 mt-2 flex gap-4">
                        <span>Def: {res.defaultValue ?? '-'}</span>
                        <span>[ {res.min ?? '-∞'} ... {res.max ?? '∞'} ]</span>
                      </div>
                    )}
                    
                    {res.type === 'text' && (
                       <div className="text-xs text-ink-200/70 mt-2 truncate">
                         Def: "{res.defaultValue || ''}"
                       </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
