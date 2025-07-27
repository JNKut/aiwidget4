#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';

console.log('🚀 Railway-compatible build (no vite)...');

try {
  // Clean build
  if (existsSync('dist')) {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }
  
  mkdirSync('dist/public', { recursive: true });

  console.log('📄 Creating standalone HTML page...');
  
  // Create a complete standalone page that works without any build tools
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat Widget - Shop Twist and Thread</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: system-ui, -apple-system, sans-serif;
        }
        .widget-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: transform 0.2s;
        }
        .widget-button:hover {
            transform: scale(1.05);
        }
        .chat-panel {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .chat-header {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            padding: 16px;
            font-weight: 600;
        }
        .chat-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #f9fafb;
        }
        .message {
            margin-bottom: 12px;
            padding: 10px 14px;
            border-radius: 12px;
            max-width: 85%;
            word-wrap: break-word;
        }
        .message.user {
            background: #4f46e5;
            color: white;
            margin-left: auto;
        }
        .message.assistant {
            background: white;
            border: 1px solid #e5e7eb;
        }
        .chat-input {
            border-top: 1px solid #e5e7eb;
            padding: 16px;
            background: white;
            display: flex;
            gap: 8px;
        }
        .chat-input input {
            flex: 1;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 10px 12px;
            outline: none;
            font-size: 14px;
        }
        .chat-input input:focus {
            border-color: #4f46e5;
        }
        .send-button {
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 16px;
            cursor: pointer;
            font-weight: 500;
        }
        .send-button:disabled {
            opacity: 0.5;
        }
        .welcome-message {
            text-align: center;
            color: #6b7280;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="widget-container" id="ai-widget"></div>
    
    <script>
        const { useState, useEffect } = React;
        
        function AIWidget() {
            const [isOpen, setIsOpen] = useState(false);
            const [messages, setMessages] = useState([]);
            const [inputValue, setInputValue] = useState('');
            const [conversationId, setConversationId] = useState(null);
            const [isLoading, setIsLoading] = useState(false);
            
            useEffect(() => {
                // Create conversation when widget loads
                fetch('/api/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: 'AI Chat Session' })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.sessionId) {
                        setConversationId(data.sessionId);
                    }
                })
                .catch(err => console.error('Failed to create conversation:', err));
            }, []);
            
            const sendMessage = async () => {
                if (!inputValue.trim() || !conversationId || isLoading) return;
                
                const userMessage = inputValue.trim();
                setInputValue('');
                setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
                setIsLoading(true);
                
                try {
                    const response = await fetch(\`/api/conversations/\${conversationId}/messages\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: userMessage })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.aiMessage && data.aiMessage.content) {
                            setMessages(prev => [...prev, { 
                                role: 'assistant', 
                                content: data.aiMessage.content 
                            }]);
                        }
                    } else {
                        throw new Error('Server error');
                    }
                } catch (error) {
                    console.error('Message send error:', error);
                    setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        content: 'Sorry, I had trouble processing your message. Please try again.' 
                    }]);
                } finally {
                    setIsLoading(false);
                }
            };
            
            const handleKeyPress = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            };
            
            return React.createElement('div', null,
                React.createElement('button', {
                    className: 'widget-button',
                    onClick: () => setIsOpen(!isOpen),
                    title: 'Chat with AI Assistant'
                }, isOpen ? '✕' : '💬'),
                
                isOpen && React.createElement('div', { className: 'chat-panel' },
                    React.createElement('div', { className: 'chat-header' }, 
                        'Shop Twist & Thread Assistant'
                    ),
                    
                    React.createElement('div', { className: 'chat-messages' },
                        messages.length === 0 ? 
                            React.createElement('div', { className: 'welcome-message' },
                                'Hi! I\\'m here to help with questions about our custom sewing services, Class of 2026 collection, and order information.'
                            ) : 
                            messages.map((msg, idx) => 
                                React.createElement('div', {
                                    key: idx,
                                    className: \`message \${msg.role}\`
                                }, msg.content)
                            ),
                        
                        isLoading && React.createElement('div', {
                            className: 'message assistant'
                        }, 'Typing...')
                    ),
                    
                    React.createElement('div', { className: 'chat-input' },
                        React.createElement('input', {
                            type: 'text',
                            placeholder: 'Ask me anything...',
                            value: inputValue,
                            onChange: (e) => setInputValue(e.target.value),
                            onKeyPress: handleKeyPress,
                            disabled: isLoading
                        }),
                        React.createElement('button', {
                            className: 'send-button',
                            onClick: sendMessage,
                            disabled: isLoading || !inputValue.trim()
                        }, 'Send')
                    )
                )
            );
        }
        
        // Initialize widget
        const container = document.getElementById('ai-widget');
        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(AIWidget));
    </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', htmlContent);
  
  console.log('📁 Copying knowledge base...');
  cpSync('server/knowledge-base.txt', 'dist/knowledge-base.txt');

  console.log('🔧 Building server...');
  execSync(
    'npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js --log-level=warning',
    { stdio: 'inherit' }
  );

  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}