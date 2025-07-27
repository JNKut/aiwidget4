#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, cpSync } from 'fs';

console.log('🚀 Railway-specific build (no vite)');

try {
  // Clean and create directories
  execSync('rm -rf dist', { stdio: 'inherit' });
  mkdirSync('dist/public', { recursive: true });

  console.log('📦 Creating static HTML without vite...');
  
  // Create production HTML with embedded React widget
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Chat Widget - Shop Twist and Thread</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
    .widget-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 9999;
      transition: all 0.3s ease;
      border: none;
    }
    .widget-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(0,0,0,0.4);
    }
    .chat-panel {
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 9998;
      display: none;
      flex-direction: column;
    }
    .chat-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      border-radius: 12px 12px 0 0;
      font-weight: bold;
    }
    .chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
    }
    .chat-input {
      border-top: 1px solid #eee;
      padding: 16px;
      display: flex;
      gap: 8px;
    }
    .chat-input input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 8px 12px;
      outline: none;
    }
    .chat-input button {
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
    }
    .message {
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      max-width: 80%;
    }
    .message.user {
      background: #e3f2fd;
      margin-left: auto;
    }
    .message.assistant {
      background: #f5f5f5;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    const { useState, useEffect } = React;
    
    function AIWidget() {
      const [isOpen, setIsOpen] = useState(false);
      const [messages, setMessages] = useState([]);
      const [inputValue, setInputValue] = useState('');
      const [conversationId, setConversationId] = useState(null);
      const [isLoading, setIsLoading] = useState(false);
      
      useEffect(() => {
        // Initialize conversation
        fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Chat with AI Assistant' })
        }).then(res => res.json())
          .then(data => setConversationId(data.sessionId))
          .catch(console.error);
      }, []);
      
      const sendMessage = async () => {
        if (!inputValue.trim() || !conversationId || isLoading) return;
        
        const userMessage = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        
        try {
          const response = await fetch(\`/api/conversations/\${conversationId}/messages\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: userMessage })
          });
          
          const data = await response.json();
          setMessages(prev => [...prev, { role: 'assistant', content: data.aiMessage.content }]);
        } catch (error) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
          setIsLoading(false);
        }
      };
      
      return React.createElement('div', null,
        React.createElement('button', {
          className: 'widget-button',
          onClick: () => setIsOpen(!isOpen),
          title: 'Chat with AI Assistant'
        }, isOpen ? '✕' : '💬'),
        
        React.createElement('div', {
          className: 'chat-panel',
          style: { display: isOpen ? 'flex' : 'none' }
        },
          React.createElement('div', { className: 'chat-header' }, 'Shop Twist & Thread Assistant'),
          React.createElement('div', { className: 'chat-messages' },
            messages.length === 0 ? 
              React.createElement('div', { style: { textAlign: 'center', color: '#666', marginTop: '20px' } }, 
                'Hello! I can help you with questions about our custom sewing services, Class of 2026 collection, and orders.') :
              messages.map((msg, idx) => 
                React.createElement('div', {
                  key: idx,
                  className: \`message \${msg.role}\`
                }, msg.content)
              ),
            isLoading && React.createElement('div', { className: 'message assistant' }, 'Typing...')
          ),
          React.createElement('div', { className: 'chat-input' },
            React.createElement('input', {
              type: 'text',
              placeholder: 'Ask about our services...',
              value: inputValue,
              onChange: (e) => setInputValue(e.target.value),
              onKeyPress: (e) => e.key === 'Enter' && sendMessage()
            }),
            React.createElement('button', { onClick: sendMessage }, 'Send')
          )
        )
      );
    }
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(AIWidget));
  </script>
</body>
</html>`;
  
  writeFileSync('dist/public/index.html', html);
  
  console.log('📁 Copying knowledge base file...');
  cpSync('server/knowledge-base.txt', 'dist/knowledge-base.txt');

  console.log('🔧 Building backend (Railway-compatible)...');
  execSync(
    'npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js',
    { stdio: 'inherit' }
  );

  console.log('✅ Railway build completed successfully!');
  
} catch (error) {
  console.error('❌ Railway build failed:', error.message);
  process.exit(1);
}