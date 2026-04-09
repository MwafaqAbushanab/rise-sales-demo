import { useState, useCallback, useRef } from 'react';

interface UseStreamingGenerationReturn {
  content: string;
  isGenerating: boolean;
  error: string | null;
  wordCount: number;
  generate: (endpoint: string, body: Record<string, unknown>) => Promise<void>;
  reset: () => void;
}

const API_BASE = 'http://localhost:3002';

export function useStreamingGeneration(): UseStreamingGenerationReturn {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setContent('');
    setError(null);
    setIsGenerating(false);
  }, []);

  const generate = useCallback(async (endpoint: string, body: Record<string, unknown>) => {
    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setError(null);
    setContent('');

    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to generate content (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setContent(fullContent);
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, []);

  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;

  return { content, isGenerating, error, wordCount, generate, reset };
}
