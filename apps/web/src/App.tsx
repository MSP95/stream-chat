import React, { useState, useRef } from 'react';
import './App.css'; // Assuming you have an App.css for basic styles

function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Replace with the actual URL of your deployed Cloudflare Worker
  const WORKER_URL = '/chat';

  const responseEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the response area whenever response updates
  React.useEffect(() => {
    if (responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }

    setResponse(''); // Clear previous response
    setError(null);
    setIsLoading(true);

    try {
      const fetchResponse = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // The structure expected by your Cloudflare Worker
          contents: [{ parts: [{ text: prompt }] }],
          // Optionally, add generation config or safety settings here
          // generationConfig: {
          //   temperature: 0.7,
          //   maxOutputTokens: 200,
          // },
        }),
      });

      if (!fetchResponse.ok) {
        const errorBody = await fetchResponse.text();
        throw new Error(`Worker Error: ${fetchResponse.status} - ${errorBody}`);
      }

      // Get a readable stream from the response body
      const reader = fetchResponse.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      if (!reader) {
        throw new Error('Could not get reader from response body.');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break; // Stream finished
        }
        // Decode the chunk and append to the state
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setResponse(accumulatedResponse); // Update state with each new chunk
      }

    } catch (err: any) {
      console.error('Error fetching stream:', err);
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Gemini Streaming Chat</h1>
      <p style={styles.subtitle}>Powered by Cloudflare Worker & Google Gemini API</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          style={styles.textarea}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          rows={4}
          disabled={isLoading}
        />
        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Stream'}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {response && (
        <div style={styles.responseContainer}>
          <h2 style={styles.responseTitle}>Response:</h2>
          <div style={styles.responseContent}>
            {/* Display the response. Using dangerouslySetInnerHTML might be needed
                if the API returns formatted HTML/Markdown, but for plain text,
                just showing it directly is fine. */}
            <p>{response}</p>
            <div ref={responseEndRef} /> {/* For auto-scrolling */}
          </div>
        </div>
      )}
    </div>
  );
}

// Basic inline styles for demonstration
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '800px',
    margin: '40px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    backgroundColor: '#f9f9f9',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '10px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px',
    fontSize: '0.9em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '30px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    resize: 'vertical',
    minHeight: '80px',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  buttonHover: {
    backgroundColor: '#0056b3',
  },
  buttonDisabled: {
    backgroundColor: '#a0c7ed',
    cursor: 'not-allowed',
  },
  error: {
    color: 'red',
    backgroundColor: '#ffe0e0',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  responseContainer: {
    backgroundColor: '#e9ecef',
    padding: '20px',
    borderRadius: '4px',
    border: '1px solid #dee2e6',
  },
  responseTitle: {
    color: '#333',
    marginTop: '0',
    marginBottom: '15px',
    borderBottom: '1px solid #ccc',
    paddingBottom: '10px',
  },
  responseContent: {
    whiteSpace: 'pre-wrap', // Preserves whitespace and line breaks
    maxHeight: '400px', // Limit height for long responses
    overflowY: 'auto', // Enable scrolling if content exceeds maxHeight
    paddingRight: '10px', // Prevent scrollbar from overlapping text
  },
};

export default App;