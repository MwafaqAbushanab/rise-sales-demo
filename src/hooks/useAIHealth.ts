import { useState, useEffect } from 'react';
import { checkAIHealth } from '../api/aiService';

export function useAIHealth() {
  const [aiConnected, setAiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkAIHealth().then(setAiConnected);
    const interval = setInterval(() => {
      checkAIHealth().then(setAiConnected);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return { aiConnected };
}
