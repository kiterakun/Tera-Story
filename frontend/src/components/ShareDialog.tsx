import { useEffect, useState } from 'react';
import { Copy, Check, Link2, ExternalLink, Eye, Calendar } from 'lucide-react';
import { Button, Card, CardBody, cn } from '../design-system';
import { showSuccess, showError } from '../lib/toast';

/**
 * ShareDialog — mints a share token for a playthrough, shows the public
 * URL, copy button, view count, and expiry date. Self-contained modal.
 */

const API = '/api/v1/playthroughs';

interface ShareInfo {
  token: string;
  expiresAt: string;
}

interface ShareDialogProps {
  playthroughId: string;
  open: boolean;
  onClose: () => void;
}

export function ShareDialog({ playthroughId, open, onClose }: ShareDialogProps) {
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      // Defer resets out of the effect body to avoid cascading renders.
      const resetTimer = setTimeout(() => {
        setInfo(null);
        setCopied(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }
    let cancelled = false;
    const loadTimer = setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      fetch(`${API}/${playthroughId}/share`, {
        method: 'POST',
        credentials: 'include',
      })
        .then((r) => r.json())
        .then((body) => {
          if (cancelled) return;
          if (body?.status === 'success' && body.data?.token) {
            setInfo({
              token: body.data.token,
              expiresAt: body.data.expiresAt,
            });
          } else {
            showError('Could not create share link');
            onClose();
          }
        })
        .catch(() => {
          if (!cancelled) {
            showError('Could not create share link');
            onClose();
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(loadTimer);
    };
  }, [open, playthroughId, onClose]);

  if (!open) return null;

  const shareUrl = info
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${info.token}`
    : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showSuccess('Share link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Failed to copy link');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Share playthrough"
      onClick={onClose}
    >
      <Card
        variant="elevated"
        className={cn('w-full max-w-md animate-fade-in')}
        onClick={(e) => e.stopPropagation()}
      >
        <CardBody>
          <header className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-ink-100">Share playthrough</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="min-h-[44px] min-w-[44px] rounded-lg text-ink-200 hover:text-ink-100 hover:bg-ink-800 flex items-center justify-center"
            >
              ×
            </button>
          </header>

          {loading && (
            <p className="text-sm text-ink-200/60">Generating share link…</p>
          )}

          {info && !loading && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-[0.18em] text-ink-200/60 mb-1 block">
                  Public URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    aria-label="Share URL"
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 bg-ink-950 border border-ink-700 rounded-lg px-3 py-2 text-xs font-mono text-ink-200"
                  />
                  <Button variant="gold" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-ink-700/60 bg-ink-950/40 p-3 flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-gold-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-ink-200/60">Expires</p>
                    <p className="text-ink-100">
                      {new Date(info.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-ink-700/60 bg-ink-950/40 p-3 flex items-start gap-2">
                  <Eye className="h-4 w-4 text-gold-400 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-ink-200/60">View count</p>
                    <p className="text-ink-100">tracked on share page</p>
                  </div>
                </div>
              </div>

              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-gold-400 hover:text-gold-500"
              >
                <Link2 className="h-4 w-4" aria-hidden="true" />
                Open in new tab
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
