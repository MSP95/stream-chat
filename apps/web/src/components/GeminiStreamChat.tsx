import React, { useState, useRef, useEffect } from 'react';
import { useGeminiStream } from '../hooks/useGeminiStream';
import type { ChatMessage } from '../hooks/useGeminiStream';
import { chatStyles } from '../styles/chatStyles';

const WORKER_URL = '/chat'; // Update this with your worker URL

const GeminiStreamChat: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, isLoading, error, sendPrompt, clearMessages } = useGeminiStream(WORKER_URL);

  // Scroll to the bottom of the messages whenever messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendPrompt = async () => {
    if (prompt.trim()) {
      await sendPrompt(prompt);
      setPrompt('');
    }
  };

  const handleClearMessages = () => {
    clearMessages();
    setPrompt('');
  };

  const renderMessage = (message: ChatMessage) => (
    <div
      key={message.id}
      style={{
        ...chatStyles.messageBubble,
        ...(message.isUser ? chatStyles.userMessage : chatStyles.aiMessage),
      }}
    >
      <div style={chatStyles.messageText}>{message.content}</div>
    </div>
  );

  return (
    <div style={chatStyles.container}>
      <div style={chatStyles.header}>
        <h1 style={chatStyles.heading}>Gemini Streaming Chat</h1>
      </div>
      
      <div style={chatStyles.chatArea}>
        <div style={chatStyles.messagesContainer}>
          {error && <p style={chatStyles.errorText}>Error: {error}</p>}
          
          {messages.length === 0 && !error && (
            <div style={chatStyles.welcomeMessage}>
              Enter a prompt below to start chatting with Gemini
            </div>
          )}
          
          {messages.map(renderMessage)}
          
          {isLoading && (
            <div style={chatStyles.typingIndicator}>
              Gemini is typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
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
                onClick={handleClearMessages}
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
