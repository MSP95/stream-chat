import React, { useState, useRef, useEffect } from 'react';
import { useGeminiStream } from '../hooks/useGeminiStream';
import { chatStyles } from '../styles/chatStyles';

const WORKER_URL = '/chat'; // Update this with your worker URL

const GeminiStreamChat: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const responseEndRef = useRef<HTMLDivElement>(null);
  
  const { response, isLoading, error, sendPrompt, clearResponse } = useGeminiStream(WORKER_URL);

  // Scroll to the bottom of the response area whenever response updates
  useEffect(() => {
    if (responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response]);

  const handleSendPrompt = async () => {
    await sendPrompt(prompt);
  };

  const handleClearResponse = () => {
    clearResponse();
    setPrompt('');
  };

  return (
    <div style={chatStyles.container}>
      <div style={chatStyles.header}>
        <h1 style={chatStyles.heading}>Gemini Streaming Chat</h1>
      </div>
      
      <div style={chatStyles.chatArea}>
        <div style={chatStyles.responseContainer}>
          {error && <p style={chatStyles.errorText}>Error: {error}</p>}
          
          {response && (
            <>
              <pre style={chatStyles.responsePre}>{response}</pre>
              <div ref={responseEndRef} />
            </>
          )}
          
          {!response && !error && (
            <div style={{ 
              padding: '20px',
              color: '#666',
              fontSize: '16px'
            }}>
              Enter a prompt below to start chatting with Gemini
            </div>
          )}
        </div>
        
        <div style={chatStyles.inputArea}>
          <div style={chatStyles.inputContainer}>
            <textarea
              style={chatStyles.textarea}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPrompt();
                }
              }}
            />
            
            <div style={chatStyles.buttonContainer}>
              <button
                style={chatStyles.button}
                onClick={handleSendPrompt}
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Send Prompt'}
              </button>
              
              <button
                style={chatStyles.clearButton}
                onClick={handleClearResponse}
                disabled={isLoading}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiStreamChat;
