import { useState, useCallback, useRef } from 'react';

interface UseStoryStreamReturn {
  streamedText: string;
  isStreaming: boolean;
  isThinking: boolean; // true while waiting for first chunk
  startStream: (playthroughId: string, choice: string, token: string) => Promise<void>;
  skipToEnd: () => void;
  reset: () => void;
}

export function useStoryStream(): UseStoryStreamReturn {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const fullTextRef = useRef(''); // accumulate full text for skip
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (playthroughId: string, choice: string, token: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    
    setStreamedText('');
    fullTextRef.current = '';
    setIsStreaming(true);
    setIsThinking(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/story/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ playthroughId, choice }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) throw new Error('Stream failed');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      setIsThinking(false);

      // Typewriter: accumulate text then reveal character by character
      let displayIndex = 0;
      
      // Start typewriter interval
      const typewriterInterval = setInterval(() => {
        if (displayIndex < fullTextRef.current.length) {
          displayIndex++;
          setStreamedText(fullTextRef.current.slice(0, displayIndex));
        }
      }, 20); // ~50 chars/sec

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        // AI SDK streams text in data: prefix format — extract text content
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('0:')) {
            // Text delta format from AI SDK
            try {
              const jsonStr = line.slice(2).trim();
              const text = JSON.parse(jsonStr);
              if (typeof text === 'string') {
                fullTextRef.current += text;
              }
            } catch {}
          }
        }
      }
      
      clearInterval(typewriterInterval);
      // Ensure full text is shown after stream ends
      setStreamedText(fullTextRef.current);
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error('Stream error:', err);
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
    }
  }, []);

  const skipToEnd = useCallback(() => {
    setStreamedText(fullTextRef.current);
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setStreamedText('');
    setIsStreaming(false);
    setIsThinking(false);
    fullTextRef.current = '';
  }, []);

  return { streamedText, isStreaming, isThinking, startStream, skipToEnd, reset };
}
