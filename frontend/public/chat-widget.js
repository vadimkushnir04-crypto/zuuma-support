// public/chat-widget.js - УЛУЧШЕННАЯ ВЕРСИЯ С ОТЛАДКОЙ

(function() {
    console.log('🔍 Chat widget script started');
    
    if (window.ChatWidgetLoaded) {
        console.log('⚠️ Widget already loaded, skipping');
        return;
    }
    window.ChatWidgetLoaded = true;

    const config = window.chatConfig || {
        assistantId: 'YOUR_ASSISTANT_ID',
        serverUrl: 'https://zuuma.ru/api',
        theme: 'dark',
        assistantName: 'AI Agent',
        customGreeting: 'Hi, how can I help?',
        primaryColor: '#de8434',
        accentColor: '#1A1A2E',
        autoOpen: false,
        alwaysVisible: true,
        hideUntilUsed: false,
    };

    console.log('📋 Widget config:', config);

    if (!config.assistantId || config.assistantId === 'YOUR_ASSISTANT_ID') {
        console.error('❌ ChatWidget: assistantId is required in chatConfig');
        return;
    }

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

    // 🎨 СТИЛИ С ПОВЫШЕННЫМ Z-INDEX
    const styles = `
        .chat-widget-container {
            position: fixed !important;
            bottom: 24px !important;
            right: 24px !important;
            z-index: 999999 !important;  /* ✅ Очень высокий z-index */
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
            pointer-events: auto !important;
        }
        
        .chat-widget-button {
            width: 56px;
            height: 56px;
            background: #18181B;
            border-radius: 50%;
            border: 1px solid #27272A;
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2);
            display: flex !important;
            align-items: center;
            justify-content: center;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            color: #FAFAFA;
            position: relative;
            backdrop-filter: blur(8px);
            pointer-events: auto !important;
        }
        
        .chat-widget-button:hover {
            background: #27272A;
            border-color: #3F3F46;
            transform: translateY(-1px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .chat-widget-button:active {
            transform: translateY(0);
        }
        
        .chat-widget-button svg {
            width: 22px;
            height: 22px;
            transition: transform 0.3s ease;
            stroke-width: 2;
        }
        
        .chat-widget-button.open svg {
            transform: rotate(90deg);
        }
        
        .chat-widget-window {
            position: absolute;
            bottom: 72px;
            right: 0;
            width: 400px;
            height: 640px;
            background: #18181B;
            border-radius: 16px;
            border: 1px solid #27272A;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4);
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
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .chat-header {
            background: #18181B;
            padding: 18px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid #27272A;
        }
        
        .chat-avatar {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #3F3F46 0%, #27272A 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            color: #FAFAFA;
            font-size: 14px;
            flex-shrink: 0;
            border: 1px solid #3F3F46;
        }
        
        .chat-info {
            flex: 1;
        }
        
        .chat-info h3 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: #FAFAFA;
            letter-spacing: -0.3px;
        }
        
        .chat-info p {
            margin: 3px 0 0 0;
            font-size: 12px;
            color: #71717A;
        }
        
        .chat-actions {
            display: flex;
            gap: 6px;
        }
        
        .chat-action-btn {
            background: transparent;
            border: none;
            color: #71717A;
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            transition: all 0.2s;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .chat-action-btn:hover {
            background: #27272A;
            color: #A1A1AA;
        }
        
        .chat-action-btn:active {
            transform: scale(0.95);
        }
        
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #09090B;
        }
        
        .chat-messages::-webkit-scrollbar {
            width: 5px;
        }
        
        .chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .chat-messages::-webkit-scrollbar-thumb {
            background: #27272A;
            border-radius: 3px;
        }
        
        .chat-messages::-webkit-scrollbar-thumb:hover {
            background: #3F3F46;
        }
        
        .message {
            max-width: 75%;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.5;
            word-wrap: break-word;
            animation: messageIn 0.25s ease;
            position: relative;
        }
        
        @keyframes messageIn {
            from {
                opacity: 0;
                transform: translateY(8px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message.user {
            background: #FAFAFA;
            color: #09090B;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
            margin-left: 25%;
        }
        
        .message.assistant {
            background: #18181B;
            color: #E4E4E7;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            margin-right: 25%;
            border: 1px solid #27272A;
        }
        
        .message.typing {
            background: #18181B;
            color: #71717A;
            align-self: flex-start;
            border: 1px solid #27272A;
            padding: 14px 18px;
        }
        
        .typing-indicator {
            display: inline-flex;
            gap: 5px;
            align-items: center;
        }
        
        .typing-dot {
            width: 6px;
            height: 6px;
            background: #52525B;
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }
        
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
            0%, 60%, 100% { 
                opacity: 0.3; 
                transform: scale(0.8);
            }
            30% { 
                opacity: 1; 
                transform: scale(1);
            }
        }
        
        .chat-input-container {
            padding: 16px 20px 20px 20px;
            background: #18181B;
            border-top: 1px solid #27272A;
            display: flex;
            gap: 12px;
            align-items: flex-end;
        }
        
        .chat-input-wrapper {
            flex: 1;
            position: relative;
            display: flex;
            align-items: center;
            background: #09090B;
            border-radius: 10px;
            padding: 0 14px;
            border: 1px solid #27272A;
            transition: all 0.2s;
        }
        
        .chat-input-wrapper:focus-within {
            border-color: #52525B;
            background: #18181B;
        }
        
        .chat-input {
            flex: 1;
            padding: 11px 2px;
            background: transparent;
            border: none;
            outline: none;
            color: #FAFAFA;
            font-size: 14px;
            resize: none;
            max-height: 100px;
            font-family: inherit;
        }
        
        .chat-input::placeholder {
            color: #52525B;
        }
        
        .chat-send {
            width: 40px;
            height: 40px;
            background: #FAFAFA;
            color: #09090B;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        
        .chat-send:hover:not(:disabled) {
            background: #E4E4E7;
            transform: translateY(-1px);
        }
        
        .chat-send:active:not(:disabled) {
            transform: translateY(0);
        }
        
        .chat-send:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        
        .chat-send svg {
            stroke-width: 2;
        }
        
        @media (max-width: 480px) {
            .chat-widget-container {
                bottom: 16px !important;
                right: 16px !important;
            }
            .chat-widget-button {
                width: 52px;
                height: 52px;
            }
            .chat-widget-window {
                width: calc(100vw - 32px);
                height: calc(100vh - 100px);
                bottom: 72px;
                right: -16px;
                border-radius: 20px 20px 0 0;
            }
            .message {
                max-width: 80%;
            }
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    console.log('✅ Widget styles injected');

    // HTML разметка
    const widgetHTML = `
        <div class="chat-widget-container" id="chat-widget-container" style="display: block !important;">
            <button class="chat-widget-button" id="chat-toggle">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3">
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

    let chatToggle, chatWindow, chatClose, chatMinimize, chatMessages, chatInput, chatSend;
    let isOpen = false;
    let conversationId = null;
    let isLoading = false;
    let socket = null;
    let sessionId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let chatSessionId = null;

    async function initWidget() {
        console.log('🎬 Initializing chat widget...');
        
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        console.log('✅ Widget HTML inserted');
        
        chatToggle = document.getElementById('chat-toggle');
        chatWindow = document.getElementById('chat-window');
        chatClose = document.getElementById('chat-close');
        chatMinimize = document.getElementById('chat-minimize');
        chatMessages = document.getElementById('chat-messages');
        chatInput = document.getElementById('chat-input');
        chatSend = document.getElementById('chat-send');

        console.log('✅ Widget elements initialized:', {
            chatToggle: !!chatToggle,
            chatWindow: !!chatWindow,
            chatInput: !!chatInput
        });
        
        try {
            await loadSocketIO();
            setupWebSocket();
        } catch (error) {
            console.error('❌ Widget init error:', error);
        }
        
        setupEventListeners();
        
        window.ChatWidget.ready = true;
        if (window._chatWidgetResolve) {
            window._chatWidgetResolve();
        }
        
        // ✅ ПРИНУДИТЕЛЬНАЯ ВИДИМОСТЬ
        const container = document.getElementById('chat-widget-container');
        if (container) {
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            console.log('✅ Widget container forced visible');
            
            // Проверяем позицию
            setTimeout(() => {
                const rect = container.getBoundingClientRect();
                console.log('📍 Widget position:', {
                    bottom: rect.bottom,
                    right: rect.right,
                    visible: rect.width > 0 && rect.height > 0
                });
            }, 100);
        }
        
        // Автооткрываем если настроено
        if (config.autoOpen) {
            setTimeout(() => {
                openChat();
                localStorage.setItem('chatWidgetUsed', 'true');
            }, 500);
        }
        
        console.log('✅ Widget fully initialized');
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
            console.error('❌ WebSocket error:', err);
        }
    }

    function setupEventListeners() {
        chatToggle.addEventListener('click', () => {
            console.log('🖱️ Widget button clicked');
            toggleChat();
        });
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
        console.log('📖 Opening chat');
        isOpen = true;
        chatWindow.classList.add('open');
        chatToggle.classList.add('open');
        chatInput.focus();
        localStorage.setItem('chatWidgetUsed', 'true');
    }

    function closeChat() {
        console.log('📕 Closing chat');
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
                headers: { 
                    'Content-Type': 'application/json' 
                },
                credentials: 'include',
                body: JSON.stringify({
                    message: message,
                    assistantId: config.assistantId,
                    sessionId: sessionId,
                    conversationId: conversationId || undefined,
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            const data = await response.json();
            
            if (data.chatSessionId && data.chatSessionId !== chatSessionId) {
                chatSessionId = data.chatSessionId;
                if (socket?.connected) {
                    socket.emit('join', { sessionId: chatSessionId });
                }
            }
            
            if (data.conversationId) {
                conversationId = data.conversationId;
            }
            
            if (data.answer) {
                addMessage(data.answer, 'assistant');
            } else {
                throw new Error('No answer received');
            }

        } catch (error) {
            console.error('❌ Send error:', error);
            addMessage(
                error.message || 'Sorry, something went wrong. Please try again.', 
                'assistant'
            );
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

    window.ChatWidget = {
        open: openChat,
        close: closeChat,
        toggle: toggleChat,
        sendMessage: (message) => {
            chatInput.value = message;
            sendMessage();
        },
        isOpen: () => isOpen,
        ready: false
    };

    window.ChatWidgetReady = new Promise((resolve) => {
        window._chatWidgetResolve = resolve;
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }

})();