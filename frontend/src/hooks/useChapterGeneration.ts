import { useState, useCallback, useRef } from 'react';
import * as storyApi from '../services/storyApi';
import type { GenerateChapterResponse, GenerationState } from '../services/storyApi';

interface UseChapterGenerationReturn {
  isGenerating: boolean;
  isRetryingTools: boolean;
  isStreaming: boolean;
  streamingText: string;
  streamPhase: string;
  error: string | null;
  errorDetails: { phase?: string; details?: string } | null;
  generationState: GenerationState | null;
  isAwaitingUser: boolean;
  generateChapter: (playthroughId: string, choice: string) => Promise<GenerateChapterResponse | null>;
  generateChapterStream: (playthroughId: string, choice: string) => Promise<GenerateChapterResponse | null>;
  retryChapter: (chapterId: string) => Promise<GenerateChapterResponse | null>;
  retryTools: (chapterId: string) => Promise<GenerateChapterResponse | null>;
  resumeChapter: (playthroughId: string) => Promise<GenerateChapterResponse | null>;
  setGenerationState: (state: GenerationState | null) => void;
  clearError: () => void;
  cancelStream: () => void;
}

export function useChapterGeneration(): UseChapterGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRetryingTools, setIsRetryingTools] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamPhase, setStreamPhase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{ phase?: string; details?: string } | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const isAwaitingUser = generationState?.status === 'awaiting_user';

  const generateChapter = useCallback(async (playthroughId: string, choice: string): Promise<GenerateChapterResponse | null> => {
    setIsGenerating(true);
    setError(null);
    setErrorDetails(null);

    try {
      const result = await storyApi.generateChapter(playthroughId, choice);
      return result;
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          || 'Generation failed'
        : err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      console.error('Chapter generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateChapterStream = useCallback((playthroughId: string, choice: string): Promise<GenerateChapterResponse | null> => {
    setIsGenerating(true);
    setIsStreaming(true);
    setStreamingText('');
    setStreamPhase('writing');
    setError(null);
    setErrorDetails(null);
    setGenerationState(null);

    return new Promise((resolve) => {
      const { cancel } = storyApi.generateChapterStream(playthroughId, choice, {
        onToken: (token) => {
          setStreamingText((prev) => prev + token);
        },
        onPhase: (phase) => {
          setStreamPhase(phase);
        },
        onComplete: (data) => {
          setIsGenerating(false);
          setIsStreaming(false);
          setStreamPhase('');
          resolve(data);
        },
        onError: (err) => {
          setError(err);
          setIsGenerating(false);
          setIsStreaming(false);
          setStreamPhase('');
          resolve(null);
        },
      });

      cancelRef.current = cancel;
    });
  }, []);

  const resumeChapter = useCallback((playthroughId: string): Promise<GenerateChapterResponse | null> => {
    setIsGenerating(true);
    setIsStreaming(true);
    setStreamingText('');
    setError(null);
    setErrorDetails(null);

    return new Promise((resolve) => {
      const { cancel } = storyApi.resumeChapterStream(playthroughId, {
        onToken: (token) => {
          setStreamingText((prev) => prev + token);
        },
        onPhase: (phase) => {
          setStreamPhase(phase);
        },
        onComplete: (data) => {
          setIsGenerating(false);
          setIsStreaming(false);
          setStreamPhase('');
          setGenerationState(null);
          resolve(data);
        },
        onError: (err, details) => {
          setError(err);
          setErrorDetails(details ?? null);
          setIsGenerating(false);
          setIsStreaming(false);
          setStreamPhase('');
          resolve(null);
        },
      });

      cancelRef.current = cancel;
    });
  }, []);

  const cancelStream = useCallback(() => {
    cancelRef.current?.();
    setIsGenerating(false);
    setIsStreaming(false);
    setStreamPhase('');
  }, []);

  const retryChapter = useCallback(async (chapterId: string): Promise<GenerateChapterResponse | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await storyApi.retryChapter(chapterId);
      return result;
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          || 'Retry failed'
        : err instanceof Error ? err.message : 'Retry failed';
      setError(message);
      console.error('Chapter retry error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const retryTools = useCallback(async (chapterId: string): Promise<GenerateChapterResponse | null> => {
    setIsRetryingTools(true);
    setError(null);

    try {
      const result = await storyApi.retryChapterTools(chapterId);
      return result;
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          || 'Retry tools failed'
        : err instanceof Error ? err.message : 'Retry tools failed';
      setError(message);
      console.error('Chapter retry tools error:', err);
      return null;
    } finally {
      setIsRetryingTools(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
  }, []);

  return {
    isGenerating,
    isRetryingTools,
    isStreaming,
    streamingText,
    streamPhase,
    error,
    errorDetails,
    generationState,
    isAwaitingUser,
    generateChapter,
    generateChapterStream,
    retryChapter,
    retryTools,
    resumeChapter,
    setGenerationState,
    clearError,
    cancelStream,
  };
}
