import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStoryStore } from '../stores/storyStore';
import CharacterCard from '../components/CharacterCard';

export default function PlaythroughPage() {
  const { worldId, id } = useParams<{ worldId: string, id: string }>();
  const navigate = useNavigate();
  
  const { currentPlaythrough, characters, arcs, isLoading, fetchPlaythrough, fetchCharacters, fetchArcs } = useStoryStore(state => ({
    currentPlaythrough: state.currentPlaythrough,
    characters: state.characters,
    arcs: state.arcs,
    isLoading: state.isLoading,
    fetchPlaythrough: state.fetchPlaythrough,
    fetchCharacters: state.fetchCharacters,
    fetchArcs: state.fetchArcs
  }));

  useEffect(() => {
    if (id) {
      fetchPlaythrough(id);
      fetchCharacters(id);
      fetchArcs(id);
    }
  }, [id, fetchPlaythrough, fetchCharacters, fetchArcs]);

  if (isLoading && !currentPlaythrough) {
    return <div className="p-8 text-ink-200">Loading story data...</div>;
  }

  if (!currentPlaythrough) {
    return <div className="p-8 text-red-500">Playthrough not found</div>;
  }

  const protagonist = characters.find(c => c.role === 'protagonist');
  const npcs = characters.filter(c => c.role === 'npc');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to={`/worlds/${worldId}`} className="text-accent-400 hover:text-accent-600 text-sm font-sans mb-2 inline-block">
            &larr; Back to World
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-5xl font-display text-ink-100">{currentPlaythrough.name}</h1>
            <span className={`px-2 py-1 rounded text-xs font-sans uppercase tracking-wider
              ${currentPlaythrough.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                currentPlaythrough.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
              {currentPlaythrough.status}
            </span>
          </div>
          <p className="text-ink-200/60 mt-1 font-sans text-sm">Created {new Date(currentPlaythrough.createdAt).toLocaleDateString()}</p>
        </div>
        
        <Link 
          to={`/play/${id}`}
          className="bg-accent-600 hover:bg-accent-500 text-white px-6 py-3 rounded-lg font-sans font-medium transition-colors"
        >
          Continue Story
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* Left Column: Characters */}
        <div className="lg:col-span-1 space-y-8">
          {/* Protagonist */}
          <section>
            <div className="flex items-center justify-between mb-4 border-b border-ink-700 pb-2">
              <h2 className="text-xl font-display text-ink-100">Protagonist</h2>
              {!protagonist && (
                <Link
                  to={`/worlds/${worldId}/playthroughs/${id}/characters/create`}
                  className="text-accent-400 hover:text-accent-500 text-sm flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  Create
                </Link>
              )}
            </div>
            
            {protagonist ? (
              <CharacterCard character={protagonist} />
            ) : (
              <div className="bg-ink-800/50 border border-ink-700 border-dashed rounded-xl p-6 text-center">
                <p className="text-ink-200/60 mb-3 text-sm font-sans">No protagonist defined.</p>
                <Link
                  to={`/worlds/${worldId}/playthroughs/${id}/characters/create`}
                  className="inline-block bg-ink-700 hover:bg-ink-700/80 text-ink-200 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Create Protagonist
                </Link>
              </div>
            )}
          </section>

          {/* NPCs */}
          <section>
             <div className="flex items-center justify-between mb-4 border-b border-ink-700 pb-2">
              <h2 className="text-xl font-display text-ink-100">Key NPCs</h2>
              <Link
                to={`/worlds/${worldId}/playthroughs/${id}/characters/create`}
                className="text-accent-400 hover:text-accent-500 text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Add
              </Link>
            </div>
            
            <div className="space-y-4">
              {npcs.length > 0 ? (
                npcs.map(npc => (
                  <CharacterCard key={npc._id} character={npc} />
                ))
              ) : (
                <p className="text-ink-200/50 text-sm italic font-serif">No NPCs encountered yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Arcs / Story Structure */}
        <div className="lg:col-span-2">
          <section>
            <h2 className="text-2xl font-display text-ink-100 mb-6 border-b border-ink-700 pb-2">Story Arcs</h2>
            
            {arcs.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-ink-700 before:to-transparent">
                {arcs.map((arc, idx) => (
                  <div key={arc._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Timeline dot */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-ink-950 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow
                      ${arc.status === 'completed' ? 'bg-accent-600' : arc.status === 'active' ? 'bg-accent-400' : 'bg-ink-700'}`}>
                      <span className="text-xs font-bold text-white">{idx + 1}</span>
                    </div>
                    {/* Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-ink-800 p-4 rounded-xl border border-ink-700">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-display text-lg text-ink-100">{arc.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${arc.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-accent-400/20 text-accent-400'}`}>
                          {arc.status}
                        </span>
                      </div>
                      <p className="text-ink-200/70 text-sm font-serif">{arc.summary || 'The story unfolds...'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-ink-800 border border-ink-700 rounded-xl p-8 text-center text-ink-200/60 font-serif">
                The story has not begun. 
                <div className="mt-4">
                  <button onClick={() => navigate(`/play/${id}`)} className="text-accent-400 hover:text-accent-500 underline font-sans text-sm">Start first chapter</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
