import { useState } from 'react';
import { useGallery } from '../hooks/useGallery';
import { shareCard } from '../services/galleryApi';
import type { StoryCard } from '../services/galleryApi';
import { Image, Filter, Share2, Download, X, Grid3x3 } from 'lucide-react';
import { useTranslation, useLanguage } from '../i18n';

const RARITY_COLORS: Record<string, string> = {
  common: 'border-ink-600 bg-ink-800/50',
  uncommon: 'border-emerald-500 bg-emerald-500/10',
  rare: 'border-blue-500 bg-blue-500/10',
  epic: 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-400/30',
};

function CardDetailModal({ card, onClose }: { card: StoryCard | null; onClose: () => void }) {
  const t = useTranslation();
  const lang = useLanguage();
  if (!card) return null;

  const rarityLabels: Record<string, string> = {
    common: t.rarity.common,
    uncommon: t.rarity.uncommon,
    rare: t.rarity.rare,
    epic: t.rarity.epic,
  };

  const handleShare = async () => {
    try {
      const res = await shareCard(card._id);
      await navigator.clipboard.writeText(
        `${window.location.origin}/share/card/${res.data.publicShareUrl}`
      );
    } catch {
      // share silently fails
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-2xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full bg-ink-800 p-1.5 text-ink-400 hover:bg-ink-700 hover:text-ink-200 transition-colors"
        >
          <X size={18} />
        </button>
        <div className="relative aspect-[4/3] w-full md:w-3/5 shrink-0 bg-ink-950">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-600">
              <Image size={48} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none opacity-[0.07]">
            <span className="text-white text-4xl font-bold -rotate-[20deg] tracking-[0.3em] drop-shadow-lg">
              TERA-STORY
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between p-5">
          <div>
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${RARITY_COLORS[card.rarity]}`}
            >
              {rarityLabels[card.rarity]}
            </span>
            <h2 className="mt-2 text-xl font-bold text-accent-400">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-narration">{card.description}</p>
            <p className="mt-3 text-xs text-ink-500">
              {new Date(card.unlockedAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 shadow-sm transition-colors"
            >
              <Share2 size={16} /> {t.gallery.share}
            </button>
            {card.imageUrl && (
              <a
                href={card.imageUrl}
                download
                className="flex items-center gap-2 rounded-lg border border-ink-700 px-4 py-2 text-sm text-ink-300 hover:bg-ink-800 transition-colors"
              >
                <Download size={16} /> {t.gallery.download}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryCardItem({ card, onClick }: { card: StoryCard; onClick: () => void }) {
  const t = useTranslation();
  
  const rarityLabels: Record<string, string> = {
    common: t.rarity.common,
    uncommon: t.rarity.uncommon,
    rare: t.rarity.rare,
    epic: t.rarity.epic,
  };

  return (
    <button
      onClick={onClick}
      className={`group relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 ${RARITY_COLORS[card.rarity]} transition-transform hover:scale-105 focus:scale-105`}
    >
      {card.thumbnailUrl || card.imageUrl ? (
        <img
          src={card.thumbnailUrl || card.imageUrl}
          alt={card.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-ink-800 text-ink-600">
          <Image size={40} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent p-3 pt-8">
        <p className="text-sm font-medium text-ink-100 line-clamp-2">{card.title}</p>
        <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${RARITY_COLORS[card.rarity]}`}>
          {rarityLabels[card.rarity]}
        </span>
      </div>
      <div className="absolute inset-0 bg-ink-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
        <p className="text-xs text-ink-200 line-clamp-4">{card.description}</p>
      </div>
    </button>
  );
}

export default function GalleryPage() {
  const t = useTranslation();
  const [selectedCard, setSelectedCard] = useState<StoryCard | null>(null);
  const [filters, setFilters] = useState<{
    rarity?: string;
    category?: string;
    sort?: string;
  }>({});

  const rarityLabels: Record<string, string> = {
    common: t.rarity.common,
    uncommon: t.rarity.uncommon,
    rare: t.rarity.rare,
    epic: t.rarity.epic,
  };

  const { cards, total, stats, isLoading, error, refetch } = useGallery(filters);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={refetch} className="mt-4 rounded-lg bg-accent-600 px-4 py-2 text-sm text-white hover:bg-accent-500 shadow-sm transition-all">
          {t.gallery.retry}
        </button>
      </div>
    );
  }

  if (isLoading || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Grid3x3 size={48} className="text-ink-600" />
        <p className="mt-4 text-lg text-narration">{t.gallery.empty}</p>
        <p className="mt-1 text-sm text-ink-500">{t.gallery.emptyHint}</p>
        {isLoading && (
          <div className="mt-4 h-5 w-5 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Stats header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-accent-400">{t.gallery.title}</h1>
        <p className="mt-1 text-sm text-narration">
          {stats
            ? t.gallery.stats
                .replace('{total}', String(stats.totalCards))
                .replace('{common}', String(stats.byRarity?.common || 0))
                .replace('{uncommon}', String(stats.byRarity?.uncommon || 0))
                .replace('{rare}', String(stats.byRarity?.rare || 0))
                .replace('{epic}', String(stats.byRarity?.epic || 0))
            : `${total} ${t.gallery.cards}`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-ink-500" />
        {(['all', 'common', 'uncommon', 'rare', 'epic'] as const).map((r) => (
          <button
            key={r}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                rarity: r === 'all' ? undefined : r,
              }))
            }
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (r === 'all' && !filters.rarity) || filters.rarity === r
                ? 'bg-accent-600 text-white shadow-sm'
                : 'bg-ink-800 text-ink-400 hover:bg-ink-700'
            }`}
          >
            {r === 'all' ? t.gallery.all : rarityLabels[r]}
          </button>
        ))}
        <select
          value={filters.sort || 'newest'}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
          className="ml-auto rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-sm text-ink-300"
        >
          <option value="newest">{t.gallery.newest}</option>
          <option value="rarity">{t.gallery.rarity}</option>
        </select>
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <StoryCardItem key={card._id} card={card} onClick={() => setSelectedCard(card)} />
        ))}
      </div>

      {/* Detail modal */}
      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
}
