import { useState, useCallback } from 'react';

interface UseGeminiStreamReturn {
  response: string;
  isLoading: boolean;
  error: string | null;
  sendPrompt: (prompt: string) => Promise<void>;
  clearResponse: () => void;
}

export const useGeminiStream = (workerUrl: string): UseGeminiStreamReturn => {
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendPrompt = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    setResponse('');
    setError(null);
    setIsLoading(true);

    try {
      const fetchResponse = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
        }),
      });

      if (!fetchResponse.ok || !fetchResponse.body) {
        const errorText = await fetchResponse.text();
        throw new Error(`Worker Error: ${fetchResponse.status} - ${errorText}`);
      }

      const reader = fetchResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines from the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          let data = '';
          
          if (line.startsWith('data: ')) {
            data = line.slice(6).trim();
          } else if (line.trim().startsWith('{')) {
            data = line.trim();
          }
          
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (text) {
                setResponse(prev => prev + text);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
      console.log('Stream finished.');

    } catch (err: any) {
      console.error('Streaming error:', err);
      setError(err.message || 'An unknown error occurred during streaming.');
    } finally {
      setIsLoading(false);
    }
  }, [workerUrl]);

  const clearResponse = useCallback(() => {
    setResponse('');
    setError(null);
  }, []);

  return {
    response,
    isLoading,
    error,
    sendPrompt,
    clearResponse,
  };
};
