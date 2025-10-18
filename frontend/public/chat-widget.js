// public/chat-widget.js

(function() {
    if (window.ChatWidgetLoaded) return;
    window.ChatWidgetLoaded = true;

    // Конфигурация
    const config = window.chatConfig || {
        apiKey: 'your_assistant_api_key',
        serverUrl: 'https://zuuma.ru/api',
    };

    // 🔥 Подключаем Socket.IO CDN
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

    // Стили (без изменений)
    const styles = `
        .chat-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .chat-widget-button {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            color: white;
        }
        .chat-widget-button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
        }
        .chat-widget-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            display: none;
            flex-direction: column;
            overflow: hidden;
        }
        .chat-widget-window.open {
            display: flex;
            animation: slideUp 0.3s ease;
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .chat-avatar {
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        .chat-info h3 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
        }
        .chat-info p {
            margin: 2px 0 0 0;
            font-size: 12px;
            opacity: 0.9;
        }
        .chat-close {
            margin-left: auto;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            opacity: 0.8;
        }
        .chat-close:hover {
            opacity: 1;
        }
        .chat-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .message {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 14px;
            line-height: 1.4;
        }
        .message.user {
            background: #007bff;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }
        .message.assistant {
            background: #f1f3f5;
            color: #333;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
        }
        .message.typing {
            background: #f1f3f5;
            color: #666;
            align-self: flex-start;
            font-style: italic;
        }
        .chat-input-container {
            padding: 16px;
            border-top: 1px solid #e9ecef;
            display: flex;
            gap: 8px;
        }
        .chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #e9ecef;
            border-radius: 24px;
            outline: none;
            font-size: 14px;
            resize: none;
            max-height: 100px;
        }
        .chat-input:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }
        .chat-send {
            width: 40px;
            height: 40px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .chat-send:hover:not(:disabled) {
            background: #5a6fd8;
        }
        .chat-send:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .error-message {
            color: #dc3545;
            font-size: 12px;
            text-align: center;
            padding: 8px;
            background: #f8d7da;
            border-radius: 8px;
            margin: 8px;
        }
        @media (max-width: 480px) {
            .chat-widget-container {
                bottom: 10px;
                right: 10px;
            }
            .chat-widget-window {
                width: calc(100vw - 20px);
                height: calc(100vh - 100px);
                right: -10px;
            }
        }
        .typing-indicator {
            display: inline-flex;
            gap: 2px;
        }
        .typing-dot {
            width: 6px;
            height: 6px;
            background: #999;
            border-radius: 50%;
            animation: typing 1.5s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
            0%, 60%, 100% { opacity: 0.3; }
            30% { opacity: 1; }
        }

            .file-message {
        max-width: 90% !important;
    }

    .file-preview {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
    }

    .file-header {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .file-icon {
        font-size: 20px;
        flex-shrink: 0;
    }

    .file-title {
        font-weight: 600;
        color: #333;
    }

    .file-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
    }

    .file-link {
        color: #667eea;
        text-decoration: none;
        font-weight: 500;
        word-break: break-word;
    }

    .file-link:hover {
        text-decoration: underline;
    }

    .file-image {
        width: 100%;
        max-width: 300px;
        height: auto;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s;
    }

    .file-image:hover {
        transform: scale(1.02);
    }

    .file-description {
        font-size: 12px;
        color: #666;
        font-style: italic;
        margin-top: 4px;
    }

    .file-error {
        padding: 12px;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 8px;
        color: #721c24;
        font-size: 14px;
    }

    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    const widgetHTML = `
        <div class="chat-widget-container">
            <button class="chat-widget-button" id="chat-toggle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22H2L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8 12H16M8 8H16M8 16H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
            <div class="chat-widget-window" id="chat-window">
                <div class="chat-header">
                    <div class="chat-avatar" id="chat-avatar">AI</div>
                    <div class="chat-info">
                        <h3 id="assistant-name">AI Ассистент</h3>
                        <p id="assistant-status">Онлайн</p>
                    </div>
                    <button class="chat-close" id="chat-close">×</button>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="message assistant" id="welcome-message">
                        Здравствуйте! Я ваш AI ассистент. Чем могу помочь?
                    </div>
                </div>
                <div class="chat-input-container">
                    <textarea 
                        class="chat-input" 
                        id="chat-input" 
                        placeholder="Напишите ваш вопрос..."
                        rows="1"
                    ></textarea>
                    <button class="chat-send" id="chat-send">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const assistantName = document.getElementById('assistant-name');
    const welcomeMessage = document.getElementById('welcome-message');

    let isOpen = false;
    let conversationId = null;
    let isLoading = false;
    let assistantInfo = null;
    let socket = null;
    let sessionId = null; // 🔥 ID сессии виджета
    let chatSessionId = null; // 🔥 ID чат-сессии для WebSocket

    // 🔥 Инициализация виджета
    async function initWidget() {
        try {
            // Загружаем Socket.IO
            await loadSocketIO();
            console.log('✅ Socket.IO loaded');

            assistantInfo = {
                name: config.assistantName || "AI Ассистент",
                settings: {
                    customGreeting: config.customGreeting || "Здравствуйте! Я ваш AI ассистент. Чем могу помочь?",
                    primaryColor: config.primaryColor || "#667eea"
                }
            };

            console.log('🎨 Applying widget settings:', {
                name: assistantInfo.name,
                greeting: assistantInfo.settings.customGreeting,
                color: assistantInfo.settings.primaryColor
            });

            assistantName.textContent = assistantInfo.name;
            welcomeMessage.textContent = assistantInfo.settings.customGreeting;
            
            if (assistantInfo.settings?.primaryColor) {
                applyTheme(assistantInfo.settings.primaryColor);
            }

            if (config.theme === 'dark') {
                chatWindow.classList.add('dark-theme');
            }

            // 🔥 Генерируем уникальный ID сессии для виджета
            sessionId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            console.log('🆔 Widget session ID:', sessionId);

            // 🔥 Подключаем WebSocket для получения сообщений от менеджера
            setupWebSocket();

        } catch (error) {
            console.error('Ошибка инициализации виджета:', error);
        }

        setupEventListeners();
    }

    // 🔥 Новая функция для настройки WebSocket
    function setupWebSocket() {
        if (!window.io) {
            console.warn('Socket.IO not loaded, skipping WebSocket setup');
            return;
        }

        try {
            socket = io(`${config.serverUrl}/support`, {
                transports: ['websocket'],
                path: '/socket.io/',
            });

            socket.on('connect', () => {
                console.log('✅ Widget WebSocket connected');
                
                // 🔥 Присоединяемся к комнате сессии, если она есть
                if (chatSessionId) {
                    socket.emit('join', { sessionId: chatSessionId });
                    console.log('🔌 Joined session room:', chatSessionId);
                }
            });

            socket.on('message', (payload) => {
                console.log('📨 Widget received message:', payload);
                
                // Добавляем сообщения от менеджера
                if (payload.senderType === 'manager' && payload.content) {
                    addMessage(payload.content, 'assistant');
                }
            });

            socket.on('disconnect', () => {
                console.log('❌ Widget WebSocket disconnected');
            });

        } catch (err) {
            console.error('WebSocket setup error:', err);
        }
    }

    function setupEventListeners() {
        chatToggle.addEventListener('click', toggleChat);
        chatClose.addEventListener('click', closeChat);
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
        chatInput.focus();
    }

    function closeChat() {
        isOpen = false;
        chatWindow.classList.remove('open');
    }

    // 🔥 Отправка сообщения
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || isLoading) return;

        addMessage(message, 'user');
        chatInput.value = '';

        const typingIndicator = showTypingIndicator();
        isLoading = true;
        chatSend.disabled = true;

        try {
            console.log('📤 Sending request with apiKey:', config.apiKey);
            
            const response = await fetch(`${config.serverUrl}/chat/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    apiKey: config.apiKey,
                    conversationId: conversationId,
                    sessionId: sessionId // 🔥 Отправляем ID сессии виджета
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Server error:', errorData);
                throw new Error(errorData.error || `Ошибка ${response.status}`);
            }

            const data = await response.json();
            console.log('📥 Response data:', data);

            // ✅ ДОБАВЬТЕ ЭТИ СТРОКИ ДЛЯ ОТЛАДКИ:
            console.log('📎 Files in response:', data.files);
            console.log('🔍 Has files?', !!data.files);
            console.log('🔢 Files count:', data.files?.length);

            if (data.answer) {
                conversationId = data.conversationId;
                
                // 📎 Сохраняем chatSessionId и присоединяемся к комнате
                if (data.chatSessionId && data.chatSessionId !== chatSessionId) {
                    chatSessionId = data.chatSessionId;
                    console.log('💾 Chat session ID:', chatSessionId);
                    
                    if (socket?.connected) {
                        socket.emit('join', { sessionId: chatSessionId });
                        console.log('🔌 Joined session room:', chatSessionId);
                    }
                }
                
                addMessage(data.answer, 'assistant');

                // ============================================
                // 📎 ОТОБРАЖЕНИЕ ФАЙЛОВ В ВИДЖЕТЕ
                // ============================================

                console.log('🔍 Checking for files...');
                console.log('data.files exists?', !!data.files);
                console.log('data.files length:', data.files?.length);

                if (data.files && data.files.length > 0) {
                    console.log(`📎 Displaying ${data.files.length} file(s)`);
                    console.log('📦 Files data:', JSON.stringify(data.files, null, 2));
                    
                    data.files.forEach(file => {
                        console.log('🖼️ Processing file:', file);
                        addFileMessage(file, config.serverUrl);
                    });
                } else {
                    console.log('❌ No files in response');
                }

                if (data.sources > 0) {
                    addSourcesInfo(data.sources, data.searchResults);
                }
            } else {
                throw new Error('Нет ответа от сервера');
            }

        } catch (error) {
            console.error('Ошибка:', error);
            addMessage(
                'Извините, произошла ошибка. Попробуйте позже.',
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

    function addFileMessage(file, serverUrl) {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'message assistant file-message';
        
        console.log('📎 Adding file to widget:', file); // Для отладки
        
        // ИСПРАВЛЕНИЕ: Проверяем file.fileUrl вместо file.url
        const fileUrl = file.fileUrl?.startsWith('http') 
            ? file.fileUrl 
            : file.url?.startsWith('http')
            ? file.url
            : `${serverUrl}${file.fileUrl || file.url}`;
        
        console.log('🔗 File URL:', fileUrl); // Для отладки
        
        // Определяем тип файла
        const isImage = file.fileType === 'image' || 
                    file.contentType?.startsWith('image/') || 
                    /\.(jpg|jpeg|png|gif|webp)$/i.test(file.fileName || file.filename);
        
        const fileName = file.fileName || file.title || file.filename || 'Файл';
        
        if (isImage) {
            // Для изображений показываем превью
            fileDiv.innerHTML = `
                <div class="file-preview">
                    <div class="file-header">
                        <span class="file-icon">🖼️</span>
                        <span class="file-title">${fileName}</span>
                    </div>
                    <a href="${fileUrl}" target="_blank" rel="noopener noreferrer">
                        <img 
                            src="${fileUrl}" 
                            alt="${fileName}"
                            class="file-image"
                            loading="lazy"
                            onerror="console.error('Failed to load image:', this.src); this.parentElement.parentElement.innerHTML='<div class=\\'file-error\\'>❌ Ошибка загрузки изображения</div>'"
                        />
                    </a>
                    ${file.description ? `<div class="file-description">${file.description}</div>` : ''}
                </div>
            `;
        } else {
            // Для других файлов показываем ссылку
            const fileIcon = getFileIcon(file.fileType || file.contentType || fileName);
            fileDiv.innerHTML = `
                <div class="file-preview">
                    <div class="file-header">
                        <span class="file-icon">${fileIcon}</span>
                        <div class="file-info">
                            <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="file-link">
                                ${fileName}
                            </a>
                            ${file.description ? `<div class="file-description">${file.description}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
        
        chatMessages.appendChild(fileDiv);
        scrollToBottom();
    }

    function getFileIcon(contentTypeOrFilename) {
        const type = contentTypeOrFilename.toLowerCase();
        
        if (type.includes('pdf')) return '📄';
        if (type.includes('word') || type.includes('doc')) return '📝';
        if (type.includes('excel') || type.includes('sheet')) return '📊';
        if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
        if (type.includes('zip') || type.includes('archive')) return '📦';
        if (type.includes('video')) return '🎥';
        if (type.includes('audio')) return '🎵';
        if (type.includes('text')) return '📃';
        
        return '📎';
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
            Печатает...
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

    function addSourcesInfo(count, sources) {
        const sourceDiv = document.createElement('div');
        sourceDiv.className = 'message assistant';
        sourceDiv.style.fontSize = '12px';
        sourceDiv.style.opacity = '0.7';
        sourceDiv.style.fontStyle = 'italic';
        
        let text = `Ответ основан на ${count} документ${count > 1 ? (count > 4 ? 'ах' : 'а') : 'е'}`;
        
        if (sources && sources.length > 0) {
            text += ':\n';
            sources.forEach((source) => {
                text += `• ${source.title} (релевантность: ${Math.round(source.score * 100)}%)\n`;
            });
        }
        
        sourceDiv.textContent = text;
        chatMessages.appendChild(sourceDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function adjustTextareaHeight() {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
    }

    function applyTheme(primaryColor) {
        console.log('🎨 Applying theme color:', primaryColor);
        
        const style = document.createElement('style');
        style.textContent = `
            .chat-widget-button {
                background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%) !important;
            }
            .chat-header {
                background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%) !important;
            }
            .chat-send {
                background: ${primaryColor} !important;
            }
            .chat-send:hover:not(:disabled) {
                background: ${primaryColor}dd !important;
            }
            .message.user {
                background: ${primaryColor} !important;
            }
            .chat-input:focus {
                border-color: ${primaryColor} !important;
                box-shadow: 0 0 0 2px ${primaryColor}20 !important;
            }
            .chat-avatar {
                background: ${primaryColor}33 !important;
            }
        `;
        document.head.appendChild(style);
    }

    function saveState() {
        if (conversationId) {
            localStorage.setItem('chatWidgetConversation', conversationId);
        }
    }

    function restoreState() {
        const savedConversationId = localStorage.getItem('chatWidgetConversation');
        if (savedConversationId) {
            conversationId = savedConversationId;
        }
    }

    setInterval(saveState, 30000);

    window.addEventListener('offline', () => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Нет подключения к интернету';
        chatMessages.appendChild(errorDiv);
        scrollToBottom();
    });

    window.ChatWidget = {
        open: openChat,
        close: closeChat,
        toggle: toggleChat,
        sendMessage: (message) => {
            chatInput.value = message;
            sendMessage();
        },
        isOpen: () => isOpen,
        clear: () => {
            chatMessages.innerHTML = `
                <div class="message assistant" id="welcome-message">
                    ${assistantInfo?.settings?.customGreeting || 'Здравствуйте! Я ваш AI ассистент. Чем могу помочь?'}
                </div>
            `;
            conversationId = null;
            localStorage.removeItem('chatWidgetConversation');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            restoreState();
            initWidget();
        });
    } else {
        restoreState();
        initWidget();
    }

})();