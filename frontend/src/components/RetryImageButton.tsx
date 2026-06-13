import { useState } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { Spinner } from '../design-system/Spinner';
import { api } from '../services/api';
import { useTranslation } from '../i18n';

interface RetryImageButtonProps {
  entityType: 'character' | 'item' | 'special-item' | 'world';
  entityId: string;
  showLabel?: boolean;
  className?: string;
}

export function RetryImageButton({ entityType, entityId, showLabel = false, className = '' }: RetryImageButtonProps) {
  const t = useTranslation();
  const [status, setStatus] = useState<'idle' | 'loading' | 'queued'>('idle');

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status !== 'idle') return;
    setStatus('loading');
    try {
      await api.post('/images/regenerate', { entityType, entityId });
      setStatus('queued');
      setTimeout(() => setStatus('idle'), 4000);
    } catch {
      setStatus('idle');
    }
  };

  if (status === 'queued') {
    return (
      <span className={`inline-flex items-center gap-1 text-green-400 ${showLabel ? 'text-xs' : 'text-[10px]'} ${className}`}>
        <Check size={showLabel ? 14 : 10} />
        {showLabel && t.common.imageQueued}
      </span>
    );
  }

  return (
    <button
      onClick={handleRetry}
      disabled={status === 'loading'}
      className={`inline-flex items-center gap-1 text-accent-400/70 hover:text-accent-400 transition-colors disabled:opacity-50 ${className}`}
      title={t.common.regenerateImage}
    >
      {status === 'loading' ? <Spinner size="sm" /> : <RefreshCw size={showLabel ? 14 : 10} />}
      {showLabel && <span className="text-xs">{status === 'loading' ? t.common.generating : t.common.regenerateImage}</span>}
    </button>
  );
}
