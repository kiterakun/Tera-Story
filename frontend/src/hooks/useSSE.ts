import { useEffect, useRef, useState } from 'react';

type SSEEventHandler = (data: unknown) => void;

interface UseSSEOptions {
  onImageCompleted?: SSEEventHandler;
  onChapterCompleted?: SSEEventHandler;
  onCombatResolved?: SSEEventHandler;
  onEntityUpdated?: SSEEventHandler;
  onAchievementUnlock?: SSEEventHandler;
  onLevelUp?: SSEEventHandler;
}

/**
 * Server-Sent Events hook for real-time push notifications.
 * Connects to GET /api/events/:playthroughId via EventSource.
 * Auth: cookies sent automatically for same-origin; token query param as fallback.
 * Auto-reconnects with exponential backoff (1s, 2s, 4s, max 30s).
 */
export function useSSE(
  playthroughId: string | undefined,
  token: string | undefined,
  options: UseSSEOptions = {},
) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectDelayRef = useRef(1000);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!playthroughId) return;

    function connect() {
      // Build URL with optional token query param
      const url = token
        ? `/api/events/${playthroughId}?token=${encodeURIComponent(token)}`
        : `/api/events/${playthroughId}`;

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        reconnectDelayRef.current = 1000; // reset backoff on successful connection
      };

      es.addEventListener('connected', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Connected to playthrough:', data.playthroughId);
        } catch { /* ignore parse errors */ }
      });

      es.addEventListener('chapter:completed', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Chapter completed:', data);
          optionsRef.current.onChapterCompleted?.(data);
        } catch { /* ignore */ }
      });

      es.addEventListener('combat:resolved', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Combat resolved:', data);
          optionsRef.current.onCombatResolved?.(data);
        } catch { /* ignore */ }
      });

      es.addEventListener('image:completed', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Image completed:', data);
          optionsRef.current.onImageCompleted?.(data);
        } catch { /* ignore */ }
      });

      es.addEventListener('entity:updated', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Entity updated:', data);
          optionsRef.current.onEntityUpdated?.(data);
        } catch { /* ignore */ }
      });

      es.addEventListener('character:created', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Character created:', data);
          optionsRef.current.onEntityUpdated?.(data);
        } catch { /* ignore */ }
      });

      es.addEventListener('item:created', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Item created:', data);
          optionsRef.current.onEntityUpdated?.(data);
        } catch { /* ignore */ }
      });

      es.addEventListener('special_item:created', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Special item created:', data);
          optionsRef.current.onEntityUpdated?.(data);
        } catch { /* ignore */ }
      });

      es.addEventListener('achievement_unlock', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Achievement unlocked:', data);
          optionsRef.current.onAchievementUnlock?.(data);
        } catch { /* ignore */ }
      });

      es.addEventListener('level_up', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[SSE] Level up:', data);
          optionsRef.current.onLevelUp?.(data);
        } catch { /* ignore */ }
      });

      es.onerror = () => {
        setIsConnected(false);
        es.close();

        // Exponential backoff reconnect: 1s → 2s → 4s → ... → max 30s
        const delay = reconnectDelayRef.current;
        reconnectTimerRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(delay * 2, 30000);
          connect();
        }, delay);
      };
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [playthroughId, token]);

  return { isConnected };
}
