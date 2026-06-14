import { lazy, Suspense } from 'react';
import { Spinner } from '../../design-system';

const DirectorPanel = lazy(() => import('../story-reader/DirectorPanel').then((m) => ({ default: m.DirectorPanel })));
const MemoryInspector = lazy(() =>
  import('../story-reader/MemoryInspector').then((m) => ({ default: m.MemoryInspector })),
);

export interface DirectorTabContentProps {
  playthroughId: string;
}

/**
 * DirectorTabContent — tab body for the Director + Memory tab in
 * GamePanel. Two sub-panels (Director and Memory) stacked
 * vertically, each lazy-loaded to keep GamePanel's initial render
 * small.
 */
export function DirectorTabContent({ playthroughId }: DirectorTabContentProps) {
  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Spinner size="md" />
          </div>
        }
      >
        <DirectorPanel playthroughId={playthroughId} />
        <MemoryInspector playthroughId={playthroughId} />
      </Suspense>
    </div>
  );
}
