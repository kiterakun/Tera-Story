import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { ConsequenceSeed } from '../services/playthroughApi';

interface ConsequenceFlashbackProps {
  consequences: ConsequenceSeed[];
}

export function ConsequenceFlashback({ consequences }: ConsequenceFlashbackProps) {
  const [activeNotification, setActiveNotification] = useState<ConsequenceSeed | null>(null);
  const [queue, setQueue] = useState<ConsequenceSeed[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (consequences.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQueue((prev) => [...prev, ...consequences]);
    }
  }, [consequences]);

  function handleDismiss() {
    setIsVisible(false);
    setTimeout(() => {
      setActiveNotification(null);
    }, 500); // Wait for exit animation
  }

  useEffect(() => {
    if (queue.length > 0 && !activeNotification) {
      const next = queue[0];
      if (!next) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQueue((prev) => prev.slice(1));
      setActiveNotification(next);
      setIsVisible(true);

      // Auto dismiss after 8 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [queue, activeNotification]);

  if (!activeNotification) return null;

  return (
    <div 
      className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md transition-all duration-500 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-gradient-to-r from-accent-950 via-ink-900 to-accent-900 border border-accent-500/40 p-4 rounded-2xl shadow-[0_0_40px_-10px_rgba(139,92,246,0.3)] relative overflow-hidden group">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-accent-500/10 blur-2xl rounded-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
        
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-ink-400 hover:text-ink-200 bg-ink-950/50 rounded-full p-1 transition-colors z-10"
        >
          <X size={14} />
        </button>

        <div className="relative z-10 flex items-start gap-4">
          <div className="bg-accent-500/20 p-2.5 rounded-xl text-accent-300 border border-accent-500/30 shadow-[0_0_15px_rgba(139,92,246,0.4)] animate-pulse">
            <Sparkles size={20} />
          </div>
          
          <div className="flex-1 pr-6">
            <h4 className="text-xs font-display font-semibold text-accent-300 uppercase tracking-widest mb-1">
              Butterfly Effect
            </h4>
            <p className="text-sm text-ink-100 leading-relaxed font-serif">
              {activeNotification.description}
            </p>
            <div className="mt-2 text-[10px] text-ink-400">
              <span className="inline-block px-1.5 py-0.5 rounded bg-ink-950/50 border border-ink-800">
                Impact: {activeNotification.impact}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
