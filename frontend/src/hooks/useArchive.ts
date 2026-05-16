import { useState, useCallback } from 'react';
import * as archiveApi from '../services/archiveApi';
import type { ArchivedEntities } from '../services/archiveApi';

export function useArchive(playthroughId: string) {
  const [archived, setArchived] = useState<ArchivedEntities | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArchived = useCallback(async () => {
    if (!playthroughId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await archiveApi.getArchivedEntities(playthroughId);
      setArchived(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch archived entities');
    } finally {
      setIsLoading(false);
    }
  }, [playthroughId]);

  const restoreEntity = useCallback(
    async (entityType: 'character' | 'item' | 'special-item' | 'location' | 'organization', entityId: string) => {
      try {
        await archiveApi.restoreEntity(playthroughId, entityType, entityId);
        // Refresh archived list after restore
        await fetchArchived();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to restore entity');
      }
    },
    [playthroughId, fetchArchived]
  );

  return {
    archived,
    isLoading,
    error,
    fetchArchived,
    restoreEntity,
  };
}
