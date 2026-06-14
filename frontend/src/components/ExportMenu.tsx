import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button, cn } from '../design-system';
import { showError } from '../lib/toast';

/**
 * ExportMenu — three buttons (PDF / Markdown / ePub) that POST to
 * /api/v1/playthroughs/:id/export and trigger a browser download.
 * Shows per-format progress + disabled state while a request is in
 * flight. Lifts state up to the parent so the page can show a single
 * ExportMenu for any playthrough.
 */

const API = '/api/v1/playthroughs';

type Format = 'pdf' | 'md' | 'epub';

interface ExportMenuProps {
  playthroughId: string;
  className?: string;
}

const EXTENSIONS: Record<Format, string> = { pdf: 'pdf', md: 'md', epub: 'epub' };

export function ExportMenu({ playthroughId, className }: ExportMenuProps) {
  const [busy, setBusy] = useState<Format | null>(null);

  const download = async (format: Format) => {
    setBusy(format);
    try {
      const res = await fetch(`${API}/${playthroughId}/export`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      if (!res.ok) {
        showError('Export failed');
        return;
      }
      const blob = await res.blob();
      const safeName = `tera-story-${playthroughId}.${EXTENSIONS[format]}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showError('Export failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {(['pdf', 'md', 'epub'] as Format[]).map((fmt) => {
        const labels: Record<Format, string> = { pdf: 'PDF', md: 'Markdown', epub: 'ePub' };
        const isBusy = busy === fmt;
        return (
          <Button
            key={fmt}
            variant="gold"
            size="sm"
            onClick={() => download(fmt)}
            disabled={busy !== null}
            className="min-w-[7rem]"
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileDown className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{labels[fmt]}</span>
          </Button>
        );
      })}
    </div>
  );
}
