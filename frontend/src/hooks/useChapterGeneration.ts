import { useState, useCallback } from 'react';
import * as storyApi from '../services/storyApi';
import type { GenerateChapterResponse } from '../services/storyApi';

interface UseChapterGenerationReturn {
  isGenerating: boolean;
  error: string | null;
  generateChapter: (playthroughId: string, choice: string) => Promise<GenerateChapterResponse | null>;
  retryChapter: (chapterId: string) => Promise<GenerateChapterResponse | null>;
  clearError: () => void;
}

export function useChapterGeneration(): UseChapterGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateChapter = useCallback(async (playthroughId: string, choice: string): Promise<GenerateChapterResponse | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await storyApi.generateChapter(playthroughId, choice);
      return result;
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Generation failed';
      setError(message);
      console.error('Chapter generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const retryChapter = useCallback(async (chapterId: string): Promise<GenerateChapterResponse | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await storyApi.retryChapter(chapterId);
      return result;
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Retry failed';
      setError(message);
      console.error('Chapter retry error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { isGenerating, error, generateChapter, retryChapter, clearError };
}
