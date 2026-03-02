import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStoryStore } from '../stores/storyStore';
import { useTranslation } from '../i18n';
import { showSuccess, showError } from '../lib/toast';
import CharacterCard from '../components/CharacterCard';
import { Search, UserRound, Plus, ChevronLeft, Play, BookOpen, Trash2 } from 'lucide-react';
import { getImageUrl } from '../utils/url';
import * as playthroughApi from '../services/playthroughApi';
import { RetryImageButton } from '../components/RetryImageButton';

export default function PlaythroughPage() {
  const t = useTranslation();
  const { worldId, id } = useParams<{ worldId: string, id: string }>();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePlaythrough = async () => {
    if (!id || !currentPlaythrough) return;
    if (!window.confirm(t.playthrough.deleteConfirmMsg.replace('{name}', currentPlaythrough.name))) return;
    setIsDeleting(true);
    try {
      await playthroughApi.deletePlaythrough(id);
      showSuccess(t.toast.playthroughDeleted);
      navigate(`/worlds/${worldId}`);
    } catch (err) {
      console.error('Failed to delete playthrough:', err);
      showError(t.toast.playthroughDeleteFailed);
      setIsDeleting(false);
    }
  };
  
  const currentPlaythrough = useStoryStore(s => s.currentPlaythrough);
  const characters = useStoryStore(s => s.characters);
  const arcs = useStoryStore(s => s.arcs);
  const items = useStoryStore(s => s.items);
  const specialItems = useStoryStore(s => s.specialItems);
  const isLoading = useStoryStore(s => s.isLoading);
  const fetchPlaythrough = useStoryStore(s => s.fetchPlaythrough);
  const fetchCharacters = useStoryStore(s => s.fetchCharacters);
  const fetchArcs = useStoryStore(s => s.fetchArcs);
  const fetchItems = useStoryStore(s => s.fetchItems);
  const fetchSpecialItems = useStoryStore(s => s.fetchSpecialItems);

  useEffect(() => {
    if (id) {
      fetchPlaythrough(id);
      fetchCharacters(id);
      fetchArcs(id);
      fetchItems(id);
      fetchSpecialItems(id);
    }
  }, [id, fetchPlaythrough, fetchCharacters, fetchArcs, fetchItems, fetchSpecialItems]);

  if (isLoading && !currentPlaythrough) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center py-20">
        <svg className="animate-spin w-8 h-8 mx-auto text-accent-400 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        <p className="text-ink-200/60">{t.playthrough.loading}</p>
      </div>
    );
  }

  if (!currentPlaythrough) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center pt-24">
        <div className="w-16 h-16 rounded-2xl bg-ink-700/50 flex items-center justify-center mx-auto mb-5"><Search size={28} className="text-ink-200/60" /></div>
        <h2 className="text-2xl font-display text-ink-100 mb-4">{t.playthrough.notFound}</h2>
      </div>
    );
  }

  const protagonist = characters.find(c => c.role === 'protagonist');
  const npcs = characters.filter(c => c.role === 'npc');

  const statusStyles: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to={`/worlds/${worldId}`} className="inline-flex items-center gap-1.5 text-ink-200/50 hover:text-accent-400 transition-colors text-sm font-medium mb-3">
          <ChevronLeft size={16} />
            {t.playthrough.backToWorld}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-display text-ink-100">{currentPlaythrough.name}</h1>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase tracking-wider border ${statusStyles[currentPlaythrough.status] || statusStyles.paused}`}>
              {currentPlaythrough.status}
            </span>
          </div>
          <p className="text-ink-200/50 mt-1 text-sm">{t.playthrough.created} {new Date(currentPlaythrough.createdAt).toLocaleDateString()}</p>
        </div>
        
        <Link 
          to={`/play/${id}`}
          className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-accent-600/20 text-sm self-start"
        >
          <Play size={16} />
          {t.playthrough.continueStory}
        </Link>
        <button
          onClick={handleDeletePlaythrough}
          disabled={isDeleting}
          className="inline-flex items-center gap-2 border border-ink-700 hover:border-red-400/30 hover:bg-red-400/5 text-red-400/70 hover:text-red-400 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm self-start disabled:opacity-50"
        >
          <Trash2 size={16} />
          {t.playthrough.deletePlaythrough}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Left Column: Characters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Protagonist */}
          <section>
            <div className="flex items-center justify-between mb-4 border-b border-ink-700 pb-3">
              <h2 className="text-lg font-display text-ink-100">{t.playthrough.protagonist}</h2>
              {!protagonist && (
                <Link
                  to={`/worlds/${worldId}/playthroughs/${id}/characters/create`}
                  className="inline-flex items-center gap-1 text-accent-400 hover:text-accent-500 text-sm transition-colors"
                >
                  <Plus size={16} />
                  {t.playthrough.create}
                </Link>
              )}
            </div>
            
            {protagonist ? (
              <CharacterCard character={protagonist} />
            ) : (
              <div className="bg-ink-800/50 border border-dashed border-ink-700 rounded-2xl p-6 text-center">
                <div className="mb-3"><UserRound size={28} className="mx-auto text-ink-200/40" /></div>
                <p className="text-ink-200/50 mb-3 text-sm">{t.playthrough.noProtagonist}</p>
                <Link
                  to={`/worlds/${worldId}/playthroughs/${id}/characters/create`}
                  className="inline-block bg-ink-700/50 hover:bg-ink-700 text-ink-200 px-4 py-2 rounded-xl text-sm transition-all duration-200"
                >
                  {t.playthrough.createProtagonist}
                </Link>
              </div>
            )}
          </section>

          {/* NPCs */}
          <section>
            <div className="flex items-center justify-between mb-4 border-b border-ink-700 pb-3">
              <h2 className="text-lg font-display text-ink-100">{t.playthrough.keyNPCs}</h2>
              <Link
                to={`/worlds/${worldId}/playthroughs/${id}/characters/create`}
                className="inline-flex items-center gap-1 text-accent-400 hover:text-accent-500 text-sm transition-colors"
              >
                <Plus size={16} />
                {t.playthrough.add}
              </Link>
            </div>
            
            <div className="space-y-3">
              {npcs.length > 0 ? (
                npcs.map(npc => (
                  <CharacterCard key={npc._id} character={npc} />
                ))
              ) : (
                <p className="text-ink-200/40 text-sm italic font-serif">{t.playthrough.noNPCs}</p>
              )}
            </div>
          </section>

          {/* Inventory */}
          <section>
            <div className="flex items-center justify-between mb-4 border-b border-ink-700 pb-3">
              <h2 className="text-lg font-display text-ink-100">{t.playthrough.inventory}</h2>
              <span className="text-xs text-ink-200/50">{items.length} {t.playthrough.itemCount}</span>
            </div>
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item._id} className="bg-ink-800 border border-ink-700 rounded-xl p-3 flex items-center gap-3 hover:border-ink-600 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-ink-950 border border-ink-700 flex items-center justify-center overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img src={getImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs text-ink-500 font-bold">{item.name.substring(0, 2).toUpperCase()}</span>
                          <RetryImageButton entityType="item" entityId={item._id} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-ink-100 font-medium truncate">{item.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${
                          item.rarity === 'legendary' ? 'bg-amber-500/10 text-amber-400' :
                          item.rarity === 'epic' ? 'bg-purple-500/10 text-purple-400' :
                          item.rarity === 'rare' ? 'bg-blue-500/10 text-blue-400' :
                          item.rarity === 'uncommon' ? 'bg-green-500/10 text-green-400' :
                          'bg-ink-700/50 text-ink-200/60'
                        }`}>{(t.rarity as Record<string, string>)[item.rarity] || item.rarity}</span>
                      </div>
                      <p className="text-xs text-ink-200/50 line-clamp-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ink-200/40 text-sm italic font-serif">{t.playthrough.noItems}</p>
            )}
          </section>

          {/* Special Items */}
          <section>
            <div className="flex items-center justify-between mb-4 border-b border-ink-700 pb-3">
              <h2 className="text-lg font-display text-ink-100">{t.playthrough.specialAbilities}</h2>
              <span className="text-xs text-ink-200/50">{specialItems.length} {t.playthrough.itemCount}</span>
            </div>
            {specialItems.length > 0 ? (
              <div className="space-y-2">
                {specialItems.map(si => (
                  <div key={si._id} className="bg-ink-800 border border-ink-700 rounded-xl p-3 hover:border-ink-600 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-ink-100 font-medium">{si.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium uppercase tracking-wider">{si.category}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${
                        si.rarity === 'legendary' ? 'bg-amber-500/10 text-amber-400' :
                        si.rarity === 'epic' ? 'bg-purple-500/10 text-purple-400' :
                        si.rarity === 'rare' ? 'bg-blue-500/10 text-blue-400' :
                        si.rarity === 'uncommon' ? 'bg-green-500/10 text-green-400' :
                        'bg-ink-700/50 text-ink-200/60'
                      }`}>{(t.rarity as Record<string, string>)[si.rarity] || si.rarity}</span>
                    </div>
                    <p className="text-xs text-ink-200/50 line-clamp-2">{si.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ink-200/40 text-sm italic font-serif">{t.playthrough.noSpecialItems}</p>
            )}
          </section>
        </div>

        {/* Right Column: Arcs */}
        <div className="lg:col-span-2">
          <section>
            <h2 className="text-xl font-display text-ink-100 mb-6 border-b border-ink-700 pb-3">{t.playthrough.storyArcs}</h2>
            
            {arcs.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:left-5 before:top-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-accent-400/30 before:via-ink-700 before:to-transparent">
                {arcs.map((arc, idx) => (
                  <div key={arc._id} className="relative flex gap-4 ml-0">
                    {/* Timeline dot */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 border-ink-800 shrink-0 z-10 shadow-sm ${
                      arc.status === 'completed' ? 'bg-accent-600 text-white' : arc.status === 'active' ? 'bg-accent-400 text-white' : 'bg-ink-700 text-ink-200'
                    }`}>
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                    {/* Card */}
                    <div className="flex-1 bg-ink-800 p-5 rounded-2xl border border-ink-700 hover:border-ink-600 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-display text-base text-ink-100">{arc.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                          arc.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-accent-400/10 text-accent-400'
                        }`}>
                          {arc.status}
                        </span>
                      </div>
                      <p className="text-ink-200/60 text-sm font-serif">{arc.summary || t.playthrough.storyUnfolds}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-ink-800 border border-ink-700 rounded-2xl p-10 text-center">
                <div className="mb-3"><BookOpen size={28} className="mx-auto text-ink-200/40" /></div>
                <p className="text-ink-200/50 font-serif">{t.playthrough.storyNotBegun}</p>
                <div className="mt-4">
                  <button onClick={() => navigate(`/play/${id}`)} className="text-accent-400 hover:text-accent-500 text-sm font-medium transition-colors">
                    {t.playthrough.startFirstChapter}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
