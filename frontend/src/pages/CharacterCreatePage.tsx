import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStoryStore } from '../stores/storyStore';

export default function CharacterCreatePage() {
  const { worldId, playthroughId } = useParams<{ worldId: string, playthroughId: string }>();
  const navigate = useNavigate();
  const createCharacter = useStoryStore(state => state.createCharacter);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState<'protagonist' | 'npc'>('protagonist');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createCharacter(playthroughId!, { name, description, role });
      navigate(`/worlds/${worldId}/playthroughs/${playthroughId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create character');
      setIsSubmitting(false);
    }
  };

  const handleAiQuickCreate = () => {
    alert("AI Quick Create: Coming soon (Wired in T18)");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <Link 
          to={`/worlds/${worldId}/playthroughs/${playthroughId}`} 
          className="text-accent-400 hover:text-accent-600 text-sm font-sans mb-4 inline-block"
        >
          &larr; Back to Playthrough
        </Link>
        <h1 className="text-3xl font-display text-ink-100">Forge Character</h1>
        <p className="text-ink-200/60 font-serif mt-2">Breathe life into a new entity within your story.</p>
      </div>

      <div className="bg-ink-800 border border-ink-700 rounded-xl p-6 md:p-8">
        <div className="flex justify-end mb-6">
           <button 
             onClick={handleAiQuickCreate}
             className="px-4 py-2 bg-gradient-to-r from-accent-600/20 to-purple-600/20 text-accent-400 border border-accent-600/30 rounded-lg text-sm font-sans flex items-center gap-2 hover:from-accent-600/30 hover:to-purple-600/30 transition-colors"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
             AI Quick Create
           </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink-200 mb-1 font-sans">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-ink-950 border border-ink-700 rounded-lg p-3 text-ink-100 placeholder-ink-200/30 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400 font-sans"
              placeholder="E.g. Elara Vance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-200 mb-1 font-sans">Role</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-colors ${role === 'protagonist' ? 'bg-accent-600/10 border-accent-400 text-accent-400' : 'bg-ink-950 border-ink-700 text-ink-200/60 hover:bg-ink-900'}`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="protagonist" 
                  checked={role === 'protagonist'} 
                  onChange={() => setRole('protagonist')}
                  className="sr-only" 
                />
                <span className="font-display text-lg">Protagonist</span>
                <span className="text-xs text-center px-2">The main character whose perspective drives the story.</span>
              </label>
              <label className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-colors ${role === 'npc' ? 'bg-ink-700 border-ink-500 text-ink-100' : 'bg-ink-950 border-ink-700 text-ink-200/60 hover:bg-ink-900'}`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="npc" 
                  checked={role === 'npc'} 
                  onChange={() => setRole('npc')}
                  className="sr-only" 
                />
                <span className="font-display text-lg">NPC</span>
                <span className="text-xs text-center px-2">A supporting character, ally, or antagonist.</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-200 mb-1 font-sans">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-ink-950 border border-ink-700 rounded-lg p-3 text-ink-100 placeholder-ink-200/30 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400 font-serif min-h-[120px] resize-y"
              placeholder="Physical appearance, personality, backstory snippet..."
            />
          </div>

          <div className="bg-ink-950/50 rounded-lg p-4 border border-ink-700/50">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p className="text-sm text-ink-200/70 font-sans leading-relaxed">
                Stats (Health, Mana, Dynamics) will be automatically initialized by matching against the World's stat templates when the character is created.
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-ink-700">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-ink-950 border border-ink-700 hover:bg-ink-900 text-ink-200 px-4 py-3 rounded-lg font-sans font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-accent-600 hover:bg-accent-500 disabled:bg-accent-600/50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-sans font-medium transition-colors"
            >
              {isSubmitting ? 'Forging...' : 'Forge Character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
