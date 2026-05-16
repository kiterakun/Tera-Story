import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { Share2, Copy, Download, Facebook, Twitter, X } from 'lucide-react';
import { showSuccess, showError } from '../../lib/toast';
import { useTranslation } from '../../i18n';

interface ShareMenuProps {
  shareType: 'story' | 'card' | 'chronicle';
  shareId: string;
  imageUrl?: string;
}

export const ShareMenu: FC<ShareMenuProps> = ({ shareType, shareId, imageUrl }) => {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const shareUrl = `${window.location.origin}/share/${shareType}/${shareId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showSuccess(t.share.copied);
      setIsOpen(false);
    } catch {
      showError(t.share.copyFailed);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) {
      showError(t.share.noImage);
      return;
    }
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tera-story-${shareType}-${shareId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(t.share.downloaded);
      setIsOpen(false);
    } catch {
      showError(t.share.downloadFailed);
    }
  };

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(t.share.twitterText)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-ink-800 border border-ink-700 px-4 py-2 text-sm font-medium text-ink-200 hover:bg-ink-700 transition-colors"
      >
        <Share2 size={16} />
        {t.share.title}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-ink-700 bg-ink-900 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700">
            <span className="text-sm font-semibold text-ink-200">{t.share.title}</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-ink-500 hover:text-ink-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-1">
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-200 hover:bg-ink-800 transition-colors"
            >
              <Copy size={16} className="text-ink-400" />
              {t.share.copyLink}
            </button>
            <button
              onClick={handleDownload}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-200 hover:bg-ink-800 transition-colors"
            >
              <Download size={16} className="text-ink-400" />
              {t.share.downloadPNG}
            </button>
            <button
              onClick={handleFacebookShare}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-200 hover:bg-ink-800 transition-colors"
            >
              <Facebook size={16} className="text-blue-400" />
              Facebook
            </button>
            <button
              onClick={handleTwitterShare}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-200 hover:bg-ink-800 transition-colors"
            >
              <Twitter size={16} className="text-sky-400" />
              Twitter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
