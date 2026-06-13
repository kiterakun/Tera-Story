import type { Dispatch, SetStateAction } from 'react';
import { ChevronLeft, List, Swords, Compass } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { MobileDrawer } from '../MobileDrawer';
import ChapterNav from '../ChapterNav';
import RPGDrawer from '../RPGDrawer';
import type { Chapter } from '../../types/story';
import { useTranslation } from '../../i18n';
import { useStoryStore } from '../../stores/storyStore';
import type { EntityData } from '../EntityDetailModal';
import type { Relationship, Character, Item, SpecialItem } from '../../types';
import { cn } from '../../design-system';

type RpgTab = 'stats' | 'inventory' | 'abilities' | 'relations';

interface ReaderMobileNavProps {
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  rpgOpen: boolean;
  setRpgOpen: (open: boolean) => void;
  chapters: Chapter[];
  goToChapter: (idx: number) => void;
  isOnLatest: boolean;
  currentChapterIdx: number;
  totalChapters: number;
  contextTokens: number | null;
  handleSummarizeArc: () => void;
  isSummarizingArc: boolean;
  isGenerating: boolean;
  activeChapter: Chapter | undefined;
  isLatestFailed: boolean;
  isLatestToolsFailed: boolean;
  isNewGame: boolean;
  handleBeginStory: () => void;
  navigateBack: () => void;
  // RPG Panel props
  rpgTab: RpgTab;
  setRpgTab: Dispatch<SetStateAction<RpgTab>>;
  tabLabels: Record<string, string>;
  protagonist: Character | null;
  sortedNpcs: Character[];
  sortedItems: Item[];
  sortedSpecialItems: SpecialItem[];
  characters: Character[];
  relationships: Relationship[];
  setDetailEntity: Dispatch<SetStateAction<EntityData | null>>;
  setIsRelationshipModalOpen: Dispatch<SetStateAction<boolean>>;
  isRelationshipModalOpen: boolean;
}

const navButtonClass = (active: boolean) =>
  cn(
    'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]',
    'transition-colors duration-base ease-standard',
    'active:bg-ink-800/50',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
    'focus-visible:ring-inset',
    active ? 'text-accent-400' : 'text-ink-200/60 hover:text-ink-100',
  );

export function ReaderMobileNav({
  navOpen,
  setNavOpen,
  rpgOpen,
  setRpgOpen,
  chapters,
  goToChapter,
  isOnLatest,
  currentChapterIdx,
  totalChapters,
  contextTokens,
  handleSummarizeArc,
  isSummarizingArc,
  isGenerating,
  activeChapter,
  isLatestFailed,
  isLatestToolsFailed,
  isNewGame,
  handleBeginStory,
  navigateBack,
  rpgTab,
  setRpgTab,
  tabLabels,
  protagonist,
  sortedNpcs,
  sortedItems,
  sortedSpecialItems,
  characters,
  relationships,
  setDetailEntity,
  setIsRelationshipModalOpen,
  isRelationshipModalOpen
}: ReaderMobileNavProps) {
  const t = useTranslation();
  const world = useStoryStore((state) => state.world);
  const navigate = useNavigate();
  const { playthroughId } = useParams<{ playthroughId: string }>();

  return (
    <>
      {/* Mobile RPG drawer (Phase 5 RPGDrawer, uses Drawer primitive) */}
      <RPGDrawer
        open={rpgOpen}
        onClose={() => setRpgOpen(false)}
        rpgTab={rpgTab}
        setRpgTab={setRpgTab}
        tabLabels={tabLabels}
        protagonist={protagonist}
        sortedNpcs={sortedNpcs}
        sortedItems={sortedItems}
        sortedSpecialItems={sortedSpecialItems}
        characters={characters}
        relationships={relationships}
        setDetailEntity={setDetailEntity}
        setIsRelationshipModalOpen={setIsRelationshipModalOpen}
        isRelationshipModalOpen={isRelationshipModalOpen}
        resourceTemplates={world?.resourceTemplates}
      />

      {/* Mobile chapter navigation drawer (slides from left) */}
      <MobileDrawer
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        title={t.storyReader.storyNavigation}
        side="left"
      >
        <ChapterNav
          chapters={chapters}
          goToChapter={(idx) => { goToChapter(idx); setNavOpen(false); }}
          isOnLatest={isOnLatest}
          currentChapterIdx={currentChapterIdx}
          totalChapters={totalChapters}
          contextTokens={contextTokens}
          handleSummarizeArc={handleSummarizeArc}
          isSummarizingArc={isSummarizingArc}
          isGenerating={isGenerating}
          t={t}
          activeChapter={activeChapter}
          isLatestFailed={isLatestFailed}
          isLatestToolsFailed={isLatestToolsFailed}
          isNewGame={isNewGame}
          handleBeginStory={handleBeginStory}
        />
      </MobileDrawer>

      {/* Mobile bottom navigation bar — only visible <lg (1024px) */}
      <nav
        aria-label="Mobile reader navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-ink-900/95 backdrop-blur-md border-t border-ink-700 safe-area-bottom"
      >
        <div className="flex items-stretch h-14">
          <button
            type="button"
            onClick={navigateBack}
            aria-label={t.storyReader.mobileBack}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]',
              'text-ink-200/60 hover:text-ink-100 active:bg-ink-800/50',
              'transition-colors duration-base ease-standard',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
            )}
          >
            <ChevronLeft size={20} aria-hidden="true" />
            <span className="text-[10px] font-medium">{t.storyReader.mobileBack}</span>
          </button>
          <button
            type="button"
            onClick={() => { setNavOpen(!navOpen); setRpgOpen(false); }}
            aria-label={t.storyReader.mobileChapters}
            aria-expanded={navOpen}
            aria-current={navOpen ? 'page' : undefined}
            className={navButtonClass(navOpen)}
          >
            <div className="relative">
              <List size={20} aria-hidden="true" />
              {totalChapters > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-2.5 text-[9px] font-bold bg-accent-600 text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5"
                >
                  {totalChapters}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{t.storyReader.mobileChapters}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/playthroughs/${playthroughId}/map`)}
            aria-label={t.map.title}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px]',
              'text-ink-200/60 hover:text-ink-100 active:bg-ink-800/50',
              'transition-colors duration-base ease-standard',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
            )}
          >
            <Compass size={20} aria-hidden="true" />
            <span className="text-[10px] font-medium">{t.map.title}</span>
          </button>
          <button
            type="button"
            onClick={() => { setRpgOpen(!rpgOpen); setNavOpen(false); }}
            aria-label={t.storyReader.mobileRpg}
            aria-expanded={rpgOpen}
            aria-current={rpgOpen ? 'page' : undefined}
            className={navButtonClass(rpgOpen)}
          >
            <Swords size={20} aria-hidden="true" />
            <span className="text-[10px] font-medium">{t.storyReader.mobileRpg}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
