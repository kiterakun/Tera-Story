import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWorldStore } from '../stores/worldStore';
import { useTranslation } from '../i18n';
import { Search, BookOpen, Plus, ChevronLeft, Calendar } from 'lucide-react';

export default function WorldDetailPage() {
  const t = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorld, isLoading, fetchWorld, deleteWorld } = useWorldStore();

  useEffect(() => {
    if (id) {
      fetchWorld(id).catch(console.error);
    }
  }, [id, fetchWorld]);

  const handleDelete = async () => {
    if (!currentWorld || !window.confirm(t.worldDetail.confirmDelete.replace('{name}', currentWorld.name))) {
      return;
    }

    try {
      await deleteWorld(currentWorld._id);
      navigate('/worlds');
    } catch (error) {
      console.error('Failed to delete world:', error);
      alert(t.worldDetail.failedToDelete);
    }
  };

  if (isLoading && !currentWorld) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center py-20">
        <svg className="animate-spin w-8 h-8 mx-auto text-accent-400 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        <p className="text-ink-200/60">{t.worldDetail.loading}</p>
      </div>
    );
  }

  if (!currentWorld) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center pt-24">
        <div className="w-16 h-16 rounded-2xl bg-ink-700/50 flex items-center justify-center mx-auto mb-5"><Search size={28} className="text-ink-200/60" /></div>
        <h2 className="text-2xl font-display text-ink-100 mb-4">{t.worldDetail.worldNotFound}</h2>
        <Link to="/worlds" className="text-accent-400 hover:text-accent-500 transition-colors font-medium text-sm">
          {t.worldDetail.returnToWorlds}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Top Nav */}
      <div className="mb-8">
        <Link to="/worlds" className="inline-flex items-center gap-1.5 text-ink-200/50 hover:text-accent-400 transition-colors text-sm font-medium">
          <ChevronLeft size={16} />
          {t.worldDetail.backToWorlds}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Info */}
          <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-display text-ink-100 mb-3">{currentWorld.name}</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-ink-700/50 text-xs uppercase tracking-wider text-ink-200/70 rounded-lg font-medium">
                  {currentWorld.genre}
                </span>
              </div>
            </div>
            
            <p className="text-ink-200/80 leading-relaxed text-base whitespace-pre-wrap">
              {currentWorld.description || t.worldDetail.noDescription}
            </p>
          </div>
          
          {/* Playthroughs */}
          <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display text-ink-100">{t.worldDetail.playthroughs}</h2>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm"
                title="Start a new adventure in this world"
                onClick={() => alert('New Playthrough logic handled in T14.')}
              >
                <Plus size={16} />
                {t.worldDetail.startJourney}
              </button>
            </div>
            
            <div className="border border-dashed border-ink-700 py-10 text-center rounded-xl bg-ink-950/30">
              <div className="mb-3"><BookOpen size={28} className="mx-auto text-ink-200/40" /></div>
              <p className="text-ink-200/50 text-sm">{t.worldDetail.noCharactersYet}</p>
              <p className="text-ink-200/30 text-xs mt-1">{t.worldDetail.startJourneyHint}</p>
            </div>
          </div>
        </div>

        {/* Sidebar (1 col) */}
        <div className="space-y-6">
          {/* World Management */}
          <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
            <h3 className="text-base font-display text-ink-100 border-b border-ink-700 pb-4 mb-4">{t.worldDetail.worldManagement}</h3>
            <p className="text-xs text-ink-200/50 mb-5 flex items-center gap-1.5">
              <Calendar size={14} className="text-ink-200/50" />
              {t.worldDetail.created} {new Date(currentWorld.createdAt).toLocaleDateString()}
            </p>
             
            <div className="space-y-2.5">
              <button className="w-full px-4 py-2.5 border border-ink-700 hover:border-accent-400/50 bg-ink-950/50 text-ink-200 rounded-xl transition-all duration-200 text-sm font-medium hover:text-ink-100">
                {t.worldDetail.editWorldInfo}
              </button>
              <button 
                onClick={handleDelete}
                className="w-full px-4 py-2.5 border border-ink-700 hover:border-red-400/30 hover:bg-red-400/5 text-red-400/70 hover:text-red-400 rounded-xl transition-all duration-200 text-sm font-medium"
              >
                {t.worldDetail.deleteWorld}
              </button>
            </div>
          </div>

          {/* Resources Summary */}
          <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
            <h3 className="text-base font-display text-ink-100 border-b border-ink-700 pb-4 mb-4">{t.worldDetail.resourceTemplates}</h3>
            
            {currentWorld.resourceTemplates?.length === 0 ? (
              <p className="text-sm text-ink-200/50">{t.worldDetail.noResourcesDefined}</p>
            ) : (
              <ul className="space-y-3">
                {currentWorld.resourceTemplates?.map((res, i) => (
                  <li key={i} className="bg-ink-950/50 p-3 rounded-xl border border-ink-700/50 text-sm">
                    <div className="font-semibold text-ink-100 flex justify-between items-center">
                      <span>{res.key}</span>
                      <span className="text-xs font-normal text-ink-200/50 bg-ink-700/50 px-2 py-0.5 rounded-lg">
                        {res.type}
                      </span>
                    </div>
                    
                    {(res.type === 'number' || res.type === 'progress') && (
                      <div className="text-xs text-ink-200/60 mt-2 flex gap-4">
                        <span>{t.worldDetail.defaultLabel} {res.defaultValue ?? '-'}</span>
                        <span>[ {res.min ?? '-∞'} ... {res.max ?? '∞'} ]</span>
                      </div>
                    )}
                    
                    {res.type === 'text' && (
                       <div className="text-xs text-ink-200/60 mt-2 truncate">
                         {t.worldDetail.defaultLabel} "{res.defaultValue || ''}"
                       </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Special Item Templates */}
          <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6">
            <h3 className="text-base font-display text-ink-100 border-b border-ink-700 pb-4 mb-4">{t.worldDetail.specialItemTemplates}</h3>
            
            {(!currentWorld.specialItemTemplates || currentWorld.specialItemTemplates.length === 0) ? (
              <p className="text-sm text-ink-200/50">{t.worldDetail.noSpecialItems}</p>
            ) : (
              <ul className="space-y-3">
                {currentWorld.specialItemTemplates.map((tmpl, i) => (
                  <li key={i} className="bg-ink-950/50 p-3 rounded-xl border border-purple-400/10 text-sm">
                    <div className="font-semibold text-ink-100">{tmpl.category}</div>
                    {tmpl.description && (
                      <p className="text-xs text-ink-200/60 mt-1">{tmpl.description}</p>
                    )}
                    {tmpl.fields && tmpl.fields.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-ink-200/50">{t.worldDetail.fieldsLabel}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {tmpl.fields.map((f, fi) => (
                            <span key={fi} className="text-[10px] bg-ink-700/50 text-ink-200/70 px-2 py-0.5 rounded">
                              {f.name} ({f.type})
                            </span>
                          ))}
                        </div>
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
