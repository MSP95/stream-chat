// src/App.tsx (or App.jsx)

// src/components/GeminiStreamChat.tsx

import React, { useState, useCallback } from 'react';

const WORKER_URL = '/chat'; // <<< IMPORTANT: Replace with your Worker's URL

const GeminiStreamChat: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [response, setResponse] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSendPrompt = useCallback(async () => {
        if (!prompt.trim()) {
            alert('Please enter a prompt!');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResponse(''); // Clear previous response

        try {
            const fetchResponse = await fetch(WORKER_URL, {
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
                    // You can add generationConfig and safetySettings here if needed
                    // generationConfig: { temperature: 0.9, topK: 1, topP: 1 },
                    // safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }]
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
                        // Raw JSON without data: prefix
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
    }, [prompt]); // Re-create handler if prompt changes

    return (
        <div style={styles.container}>
            <h1 style={styles.heading}>Gemini Streaming Chat</h1>
            <textarea
                style={styles.textarea}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                rows={6}
                disabled={isLoading}
            />
            <button
                style={styles.button}
                onClick={handleSendPrompt}
                disabled={isLoading}
            >
                {isLoading ? 'Generating...' : 'Send Prompt'}
            </button>

            {error && <p style={styles.errorText}>Error: {error}</p>}

            <div style={styles.responseContainer}>
                <strong>Response:</strong>
                <pre style={styles.responsePre}>{response}</pre>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        fontFamily: 'Arial, sans-serif',
        maxWidth: '700px',
        margin: '40px auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
    },
    heading: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '20px',
    },
    textarea: {
        width: 'calc(100% - 22px)', // Account for padding/border
        padding: '10px',
        marginBottom: '15px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '16px',
        resize: 'vertical',
    },
    button: {
        width: '100%',
        padding: '12px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
    },
    buttonHover: { // For future :hover pseudo-class handling if needed
        backgroundColor: '#0056b3',
    },
    responseContainer: {
        marginTop: '25px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #eee',
        borderRadius: '4px',
    },
    responsePre: {
        whiteSpace: 'pre-wrap', // Preserve whitespace and wrap lines
        wordBreak: 'break-word',
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#333',
    },
    errorText: {
        color: 'red',
        marginTop: '10px',
        textAlign: 'center',
    }
};

function App() {
  return (
    <div className="App">
      <GeminiStreamChat />
    </div>
  );
}

export default App;