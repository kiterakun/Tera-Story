import { useState } from 'react';
import { Swords, Shield, Heart, Skull, Wind } from 'lucide-react';
import type { CombatEncounter, CombatActionResponse } from '../services/playthroughApi';
import { performCombatAction } from '../services/playthroughApi';

interface CombatPanelProps {
  combat: CombatEncounter;
  onCombatUpdate: (combat: CombatEncounter) => void;
  onCombatEnd: () => void;
}

export function CombatPanel({ combat, onCombatUpdate, onCombatEnd }: CombatPanelProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [roundNarrative, setRoundNarrative] = useState('');
  const [error, setError] = useState('');

  const playerCombatants = combat.combatants.filter((c) => c.side === 'player');
  const enemyCombatants = combat.combatants.filter((c) => c.side === 'enemy');

  const handleAction = async (action: string) => {
    setIsResolving(true);
    setError('');

    try {
      const result: CombatActionResponse = await performCombatAction(combat._id, action);
      setRoundNarrative(result.narrative);
      onCombatUpdate(result.combat);

      if (result.combat.status !== 'active') {
        setTimeout(() => onCombatEnd(), 3000);
      }
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Action failed'
        : err instanceof Error ? err.message : 'Action failed';
      setError(message);
    } finally {
      setIsResolving(false);
    }
  };

  const getHpColor = (current: number, max: number) => {
    const pct = (current / max) * 100;
    if (pct > 60) return 'bg-emerald-500';
    if (pct > 30) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusIcon = () => {
    if (combat.status === 'victory') return <span className="text-emerald-400 font-bold text-lg">⚔️ Victory!</span>;
    if (combat.status === 'defeat') return <span className="text-red-400 font-bold text-lg">💀 Defeat...</span>;
    if (combat.status === 'fled') return <span className="text-amber-400 font-bold text-lg">🏃 Fled!</span>;
    return null;
  };

  return (
    <div className="bg-gradient-to-b from-red-950/40 to-ink-900/90 border border-red-800/40 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 text-red-300">
        <Swords size={20} className="text-red-400" />
        <h3 className="font-bold text-lg">Combat</h3>
        {combat.rounds.length > 0 && (
          <span className="text-xs text-red-400/60 ml-auto">Round {combat.rounds.length}</span>
        )}
      </div>

      {/* Scene context */}
      <p className="text-sm text-ink-300 italic">{combat.context}</p>

      {/* Combatant display */}
      <div className="grid grid-cols-2 gap-3">
        {/* Player side */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-emerald-400 uppercase flex items-center gap-1">
            <Shield size={12} /> Player
          </div>
          {playerCombatants.map((c) => (
            <div key={c.name} className={`p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/30 ${c.defeated ? 'opacity-40' : ''}`}>
              <div className="flex items-center gap-1.5">
                {c.defeated ? <Skull size={12} className="text-red-400" /> : <Heart size={12} className="text-emerald-400" />}
                <span className="text-sm font-medium text-ink-100">{c.name}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-ink-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getHpColor(c.currentHp, c.maxHp)}`}
                    style={{ width: `${Math.max(0, (c.currentHp / c.maxHp) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-ink-400 tabular-nums">{c.currentHp}/{c.maxHp}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Enemy side */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-red-400 uppercase flex items-center gap-1">
            <Skull size={12} /> Enemy
          </div>
          {enemyCombatants.map((c) => (
            <div key={c.name} className={`p-2 rounded-lg bg-red-950/30 border border-red-800/30 ${c.defeated ? 'opacity-40' : ''}`}>
              <div className="flex items-center gap-1.5">
                {c.defeated ? <Skull size={12} className="text-ink-500" /> : <Swords size={12} className="text-red-400" />}
                <span className="text-sm font-medium text-ink-100">{c.name}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-ink-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getHpColor(c.currentHp, c.maxHp)}`}
                    style={{ width: `${Math.max(0, (c.currentHp / c.maxHp) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-ink-400 tabular-nums">{c.currentHp}/{c.maxHp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Round narrative */}
      {roundNarrative && (
        <div className="p-3 bg-ink-800/50 rounded-lg border border-ink-700/50">
          <p className="text-sm text-ink-200 leading-relaxed whitespace-pre-wrap">{roundNarrative}</p>
        </div>
      )}

      {/* Combat ended status */}
      {combat.status !== 'active' && (
        <div className="text-center py-3">
          {getStatusIcon()}
        </div>
      )}

      {/* Action buttons */}
      {combat.status === 'active' && (
        <div className="space-y-2">
          <p className="text-xs text-ink-400 font-medium">Choose your action:</p>
          <div className="grid grid-cols-2 gap-2">
            {combat.availableActions.map((action) => (
              <button
                key={action}
                onClick={() => handleAction(action)}
                disabled={isResolving}
                className="px-3 py-2 bg-red-900/40 hover:bg-red-800/60 border border-red-700/40 rounded-lg text-sm text-red-100 font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                {isResolving ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Resolving...
                  </span>
                ) : (
                  action
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
