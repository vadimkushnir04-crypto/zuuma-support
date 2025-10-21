// public/chat-widget.js - НОВЫЙ ДИЗАЙН

(function() {
    if (window.ChatWidgetLoaded) return;
    window.ChatWidgetLoaded = true;

    const config = window.chatConfig || {
        assistantId: 'YOUR_ASSISTANT_ID',
        serverUrl: 'https://zuuma.ru/api',
        theme: 'dark', // dark или light
        assistantName: 'AI Agent',
        customGreeting: 'Hi, how can I help?',
        primaryColor: '#de8434', // Оранжевый как на картинке
        accentColor: '#1A1A2E' // Темный фон
    };

    if (!config.assistantId || config.assistantId === 'YOUR_ASSISTANT_ID') {
        console.error('❌ ChatWidget: assistantId is required in chatConfig');
        return;
    }

    // Загружаем Socket.IO
    const loadSocketIO = () => {
        return new Promise((resolve, reject) => {
            if (window.io) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // 🎨 НОВЫЕ СТИЛИ (темная тема как на картинке)
    const styles = `
        .chat-widget-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
        }
        
        .chat-widget-button {
            width: 56px;
            height: 56px;
            background: ${config.primaryColor};
            border-radius: 50%;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .chat-widget-button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 30px rgba(255, 107, 53, 0.4);
        }
        
        .chat-widget-button svg {
            width: 24px;
            height: 24px;
            transition: transform 0.3s ease;
        }
        
        .chat-widget-button.open svg {
            transform: rotate(180deg);
        }
        
        .chat-widget-window {
            position: absolute;
            bottom: 72px;
            right: 0;
            width: 380px;
            height: 600px;
            background: ${config.theme === 'dark' ? '#1A1A2E' : '#FFFFFF'};
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            display: none;
            flex-direction: column;
            overflow: hidden;
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .chat-widget-window.open {
            display: flex;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .chat-header {
            background: ${config.theme === 'dark' ? '#0F0F1E' : '#FFFFFF'};
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid ${config.theme === 'dark' ? '#2A2A3E' : '#E5E7EB'};
        }
        
        .chat-avatar {
            width: 36px;
            height: 36px;
            background: ${config.primaryColor};
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            color: white;
            font-size: 14px;
            flex-shrink: 0;
        }
        
        .chat-info {
            flex: 1;
        }
        
        .chat-info h3 {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
            color: ${config.theme === 'dark' ? '#FFFFFF' : '#1A1A2E'};
        }
        
        .chat-info p {
            margin: 2px 0 0 0;
            font-size: 13px;
            color: ${config.theme === 'dark' ? '#8B8B9A' : '#6B7280'};
        }
        
        .chat-actions {
            display: flex;
            gap: 8px;
        }
        
        .chat-action-btn {
            background: none;
            border: none;
            color: ${config.theme === 'dark' ? '#8B8B9A' : '#6B7280'};
            cursor: pointer;
            padding: 4px;
            border-radius: 6px;
            transition: all 0.2s;
        }
        
        .chat-action-btn:hover {
            background: ${config.theme === 'dark' ? '#2A2A3E' : '#F3F4F6'};
            color: ${config.theme === 'dark' ? '#FFFFFF' : '#1A1A2E'};
        }
        
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: ${config.theme === 'dark' ? '#1A1A2E' : '#F9FAFB'};
        }
        
        .chat-messages::-webkit-scrollbar {
            width: 6px;
        }
        
        .chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .chat-messages::-webkit-scrollbar-thumb {
            background: ${config.theme === 'dark' ? '#2A2A3E' : '#D1D5DB'};
            border-radius: 3px;
        }
        
        .message {
            max-width: 85%;
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.5;
            word-wrap: break-word;
            animation: messageIn 0.3s ease;
        }
        
        @keyframes messageIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message.user {
            background: ${config.primaryColor};
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }
        
        .message.assistant {
            background: ${config.theme === 'dark' ? '#0F0F1E' : '#FFFFFF'};
            color: ${config.theme === 'dark' ? '#E0E0E0' : '#1A1A2E'};
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            border: 1px solid ${config.theme === 'dark' ? '#2A2A3E' : '#E5E7EB'};
        }
        
        .message.typing {
            background: ${config.theme === 'dark' ? '#0F0F1E' : '#FFFFFF'};
            color: ${config.theme === 'dark' ? '#8B8B9A' : '#6B7280'};
            align-self: flex-start;
            border: 1px solid ${config.theme === 'dark' ? '#2A2A3E' : '#E5E7EB'};
        }
        
        .typing-indicator {
            display: inline-flex;
            gap: 4px;
            align-items: center;
        }
        
        .typing-dot {
            width: 6px;
            height: 6px;
            background: ${config.theme === 'dark' ? '#8B8B9A' : '#9CA3AF'};
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }
        
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
            0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
            30% { opacity: 1; transform: translateY(-4px); }
        }
        
        .chat-input-container {
            padding: 16px 20px 20px 20px;
            background: ${config.theme === 'dark' ? '#0F0F1E' : '#FFFFFF'};
            border-top: 1px solid ${config.theme === 'dark' ? '#2A2A3E' : '#E5E7EB'};
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }
        
        .chat-input-wrapper {
            flex: 1;
            position: relative;
            display: flex;
            align-items: center;
            background: ${config.theme === 'dark' ? '#1A1A2E' : '#F3F4F6'};
            border-radius: 12px;
            padding: 0 12px;
            border: 1px solid ${config.theme === 'dark' ? '#2A2A3E' : '#E5E7EB'};
            transition: all 0.2s;
        }
        
        .chat-input-wrapper:focus-within {
            border-color: ${config.primaryColor};
            box-shadow: 0 0 0 3px ${config.primaryColor}20;
        }
        
        .chat-input {
            flex: 1;
            padding: 12px 8px;
            background: transparent;
            border: none;
            outline: none;
            color: ${config.theme === 'dark' ? '#E0E0E0' : '#1A1A2E'};
            font-size: 14px;
            resize: none;
            max-height: 120px;
            font-family: inherit;
        }
        
        .chat-input::placeholder {
            color: ${config.theme === 'dark' ? '#8B8B9A' : '#9CA3AF'};
        }
        
        .chat-send {
            width: 44px;
            height: 44px;
            background: ${config.primaryColor};
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        
        .chat-send:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 4px 12px ${config.primaryColor}40;
        }
        
        .chat-send:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        @media (max-width: 480px) {
            .chat-widget-container {
                bottom: 16px;
                right: 16px;
            }
            .chat-widget-window {
                width: calc(100vw - 32px);
                height: calc(100vh - 100px);
                right: -16px;
            }
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // HTML разметка
    const widgetHTML = `
        <div class="chat-widget-container">
            <button class="chat-widget-button" id="chat-toggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </button>
            <div class="chat-widget-window" id="chat-window">
                <div class="chat-header">
                    <div class="chat-avatar" id="chat-avatar">
                        ${config.assistantName.charAt(0).toUpperCase()}
                    </div>
                    <div class="chat-info">
                        <h3 id="assistant-name">${config.assistantName}</h3>
                        <p id="assistant-status">Online</p>
                    </div>
                    <div class="chat-actions">
                        <button class="chat-action-btn" id="chat-minimize" title="Minimize">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                        <button class="chat-action-btn" id="chat-close" title="Close">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="message assistant" id="welcome-message">
                        ${config.customGreeting}
                    </div>
                </div>
                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <textarea 
                            class="chat-input" 
                            id="chat-input" 
                            placeholder="Type a message..."
                            rows="1"
                        ></textarea>
                    </div>
                    <button class="chat-send" id="chat-send">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // Переменные
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatMinimize = document.getElementById('chat-minimize');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    let isOpen = false;
    let conversationId = null;
    let isLoading = false;
    let socket = null;
    let sessionId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let chatSessionId = null;

    // Инициализация
    async function initWidget() {
        try {
            await loadSocketIO();
            console.log('✅ Socket.IO loaded');
            setupWebSocket();
        } catch (error) {
            console.error('Widget init error:', error);
        }
        setupEventListeners();
    }

    function setupWebSocket() {
        if (!window.io) return;

        try {
            socket = io(config.serverUrl, {
                path: '/socket.io/',
                transports: ['websocket', 'polling'],
            });

            socket.on('connect', () => {
                console.log('✅ Widget WebSocket connected');
                if (chatSessionId) {
                    socket.emit('join', { sessionId: chatSessionId });
                }
            });

            socket.on('message', (payload) => {
                if (payload.senderType === 'manager' && payload.content) {
                    addMessage(payload.content, 'assistant');
                }
            });

            socket.on('disconnect', () => {
                console.log('❌ Widget WebSocket disconnected');
            });
        } catch (err) {
            console.error('WebSocket error:', err);
        }
    }

    function setupEventListeners() {
        chatToggle.addEventListener('click', toggleChat);
        chatClose.addEventListener('click', closeChat);
        chatMinimize.addEventListener('click', closeChat);
        chatSend.addEventListener('click', sendMessage);
        
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        chatInput.addEventListener('input', adjustTextareaHeight);
    }

    function toggleChat() {
        if (isOpen) {
            closeChat();
        } else {
            openChat();
        }
    }

    function openChat() {
        isOpen = true;
        chatWindow.classList.add('open');
        chatToggle.classList.add('open');
        chatInput.focus();
    }

    function closeChat() {
        isOpen = false;
        chatWindow.classList.remove('open');
        chatToggle.classList.remove('open');
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || isLoading) return;

        addMessage(message, 'user');
        chatInput.value = '';
        chatInput.style.height = 'auto';

        const typingIndicator = showTypingIndicator();
        isLoading = true;
        chatSend.disabled = true;

        try {
            const response = await fetch(`${config.serverUrl}/chat/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    assistantId: config.assistantId,
                    conversationId: conversationId,
                    sessionId: sessionId,
                    userIdentifier: sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }

            const data = await response.json();
            
            if (data.chatSessionId && data.chatSessionId !== chatSessionId) {
                chatSessionId = data.chatSessionId;
                if (socket?.connected) {
                    socket.emit('join', { sessionId: chatSessionId });
                }
            }
            
            if (data.answer) {
                conversationId = data.conversationId;
                addMessage(data.answer, 'assistant');
            }

        } catch (error) {
            console.error('Send error:', error);
            addMessage('Sorry, something went wrong. Please try again.', 'assistant');
        } finally {
            hideTypingIndicator(typingIndicator);
            isLoading = false;
            chatSend.disabled = false;
        }
    }

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message typing';
        typingDiv.innerHTML = `
            <span class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </span>
        `;
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
        return typingDiv;
    }

    function hideTypingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function adjustTextareaHeight() {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    }

    // API для внешнего управления
    window.ChatWidget = {
        open: openChat,
        close: closeChat,
        toggle: toggleChat,
        sendMessage: (message) => {
            chatInput.value = message;
            sendMessage();
        },
        isOpen: () => isOpen
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }

})();