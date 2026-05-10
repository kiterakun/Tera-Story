import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWorldStore } from '../stores/worldStore';
import { useTranslation } from '../i18n';
import { showSuccess, showError } from '../lib/toast';
import { Search, BookOpen, Plus, ChevronLeft, Calendar, Play, X, Trash2, ImageIcon } from 'lucide-react';
import * as playthroughApi from '../services/playthroughApi';
import type { Playthrough } from '../services/playthroughApi';
import { RetryImageButton } from '../components/RetryImageButton';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { getImageUrl } from '../utils/url';

const statusColor: Record<string, string> = {
  active: 'bg-green-400/10 text-green-400 border-green-400/20',
  paused: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  completed: 'bg-ink-200/10 text-ink-200/60 border-ink-700',
};

export default function WorldDetailPage() {
  const t = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentWorld, currentWorldTemplates, isLoading, fetchWorld, deleteWorld } = useWorldStore();

  const [playthroughs, setPlaythroughs] = useState<Playthrough[]>([]);
  const [isLoadingPlaythroughs, setIsLoadingPlaythroughs] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWorld(id).catch(console.error);
      loadPlaythroughs(id);
    }
  }, [id, fetchWorld]);

  const loadPlaythroughs = async (worldId: string) => {
    setIsLoadingPlaythroughs(true);
    try {
      const list = await playthroughApi.listPlaythroughs(worldId);
      setPlaythroughs(list);
    } catch (error) {
      console.error('Failed to load playthroughs:', error);
    } finally {
      setIsLoadingPlaythroughs(false);
    }
  };

  const handleCreatePlaythrough = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newName.trim()) return;

    setIsCreating(true);
    try {
      const created = await playthroughApi.createPlaythrough(id, newName.trim());
      setShowCreateModal(false);
      setNewName('');
      showSuccess(t.toast.playthroughCreated);
      navigate(`/worlds/${id}/playthroughs/${created._id}`);
    } catch (error) {
      console.error('Failed to create playthrough:', error);
      showError(t.toast.playthroughCreateFailed);
      setIsCreating(false);
    }
  };

  const handleDeletePlaythrough = async (ptId: string, ptName: string) => {
    if (!window.confirm(t.worldDetail.confirmDeletePlaythrough.replace('{name}', ptName))) return;
    try {
      await playthroughApi.deletePlaythrough(ptId);
      showSuccess(t.toast.playthroughDeleted);
      if (id) loadPlaythroughs(id);
    } catch (err) {
      console.error('Failed to delete playthrough:', err);
      showError(t.toast.playthroughDeleteFailed);
    }
  };

  const handleDelete = async () => {
    if (!currentWorld || !window.confirm(t.worldDetail.confirmDelete.replace('{name}', currentWorld.name))) {
      return;
    }

    try {
      await deleteWorld(currentWorld._id);
      showSuccess(t.toast.worldDeleted);
      navigate('/worlds');
    } catch (error) {
      console.error('Failed to delete world:', error);
      showError(t.toast.worldDeleteFailed);
    }
  };

  if (isLoading && !currentWorld) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <LoadingSkeleton variant="detail" />
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

  const statusLabel: Record<string, string> = {
    active: t.worldDetail.active,
    paused: t.worldDetail.paused,
    completed: t.worldDetail.completed,
  };

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
          <div className="bg-ink-800 border border-ink-700 rounded-2xl overflow-hidden">
            {/* World Image Banner */}
            <div className="relative w-full h-48 sm:h-64 bg-ink-900">
              {currentWorld.imageUrl ? (
                <img src={getImageUrl(currentWorld.imageUrl)} alt={currentWorld.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-800 to-ink-900">
                  <ImageIcon size={40} className="text-ink-200/20" />
                  <RetryImageButton entityType="world" entityId={currentWorld._id} showLabel className="mt-1" />
                </div>
              )}
              {currentWorld.imageUrl && (
                <div className="absolute bottom-3 right-3">
                  <RetryImageButton entityType="world" entityId={currentWorld._id} className="bg-black/50 backdrop-blur-sm rounded-lg p-1.5" />
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8">
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
          </div>
          
          {/* Playthroughs */}
          <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display text-ink-100">{t.worldDetail.playthroughs}</h2>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} />
                {t.worldDetail.startJourney}
              </button>
            </div>
            
            {isLoadingPlaythroughs ? (
              <div className="py-8 text-center">
                <svg className="animate-spin w-6 h-6 mx-auto text-accent-400 mb-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              </div>
            ) : playthroughs.length === 0 ? (
              <div className="border border-dashed border-ink-700 py-10 text-center rounded-xl bg-ink-950/30">
                <div className="mb-3"><BookOpen size={28} className="mx-auto text-ink-200/40" /></div>
                <p className="text-ink-200/50 text-sm">{t.worldDetail.noPlaythroughsYet}</p>
                <p className="text-ink-200/30 text-xs mt-1">{t.worldDetail.startJourneyHint}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {playthroughs.map(pt => (
                  <Link
                    key={pt._id}
                    to={`/worlds/${currentWorld._id}/playthroughs/${pt._id}`}
                    className="group flex items-center justify-between p-4 bg-ink-950/50 border border-ink-700/50 rounded-xl hover:border-accent-400/30 hover:bg-ink-800/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-accent-600/10 border border-accent-400/20 flex items-center justify-center shrink-0">
                        <Play size={14} className="text-accent-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-ink-100 text-sm font-medium truncate group-hover:text-accent-400 transition-colors">{pt.name}</p>
                        <p className="text-ink-200/40 text-xs">{new Date(pt.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-lg border ${statusColor[pt.status] || statusColor.active}`}>
                        {statusLabel[pt.status] || pt.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeletePlaythrough(pt._id, pt.name);
                        }}
                        className="p-1.5 rounded-lg text-ink-200/30 hover:text-red-400 hover:bg-red-400/10 group-hover:opacity-100"
                        title={t.worldDetail.deletePlaythroughBtn}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
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

                    {res.type === 'enum' && (
                      <div className="text-xs text-ink-200/60 mt-2">
                        <span className="block mb-1">{t.worldDetail.defaultLabel} {res.defaultValue || '-'}</span>
                        {res.options && res.options.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {res.options.map((opt, oi) => (
                              <span key={oi} className="bg-ink-800 px-1.5 py-0.5 rounded border border-ink-700">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
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
            
            {currentWorldTemplates.length === 0 ? (
              <p className="text-sm text-ink-200/50">{t.worldDetail.noSpecialItems}</p>
            ) : (
              <ul className="space-y-3">
                {currentWorldTemplates.map((tmpl, i) => (
                  <li key={tmpl._id || i} className="bg-ink-950/50 p-3 rounded-xl border border-purple-400/10 text-sm">
                    <div className="font-semibold text-ink-100">{tmpl.category}</div>
                    {tmpl.description && (
                      <p className="text-xs text-ink-200/60 mt-1">{tmpl.description}</p>
                    )}
                    {tmpl.fields && tmpl.fields.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-ink-200/50">{t.worldDetail.fieldsLabel}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {tmpl.fields.map((f, fi) => (
                            <span key={fi} className="text-[10px] bg-ink-700/50 text-ink-200/70 px-2 py-0.5 rounded flex flex-col">
                              <span>{f.name} ({f.type})</span>
                              {f.type === 'enum' && f.options && f.options.length > 0 && (
                                <span className="text-ink-200/40 mt-0.5">[{f.options.join(', ')}]</span>
                              )}
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

      {/* Create Playthrough Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-ink-800 border border-ink-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-display text-ink-100">{t.worldDetail.startJourney}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-700 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreatePlaythrough}>
              <div className="mb-5">
                <label className="block text-xs font-medium text-ink-200/80 mb-1.5">
                  {t.worldDetail.newPlaythroughName} <span className="text-red-400">*</span>
                </label>
                <input
                  autoFocus
                  required
                  className="w-full bg-ink-950 border border-ink-700 rounded-xl px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none transition-all text-sm"
                  placeholder={t.worldDetail.newPlaythroughPlaceholder}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-ink-200 hover:text-ink-100 text-sm font-medium rounded-xl hover:bg-ink-700 transition-colors"
                  disabled={isCreating}
                >
                  {t.worldDetail.cancelCreate}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm disabled:opacity-50"
                  disabled={isCreating || !newName.trim()}
                >
                  {isCreating ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      {t.worldDetail.creating}
                    </span>
                  ) : t.worldDetail.createPlaythrough}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
