import { useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface UseGeminiStreamReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendPrompt: (prompt: string) => Promise<void>;
  clearMessages: () => void;
}

export const useGeminiStream = (workerUrl: string): UseGeminiStreamReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendPrompt = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: prompt,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setError(null);
    setIsLoading(true);

    // Add AI message placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      content: '',
      isUser: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);

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
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, content: msg.content + text }
                      : msg
                  )
                );
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

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendPrompt,
    clearMessages,
  };
};
