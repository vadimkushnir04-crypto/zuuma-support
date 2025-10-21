"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Zap, Globe, BookOpen } from "lucide-react";
import Link from "next/link";

export default function JavaScriptTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const installCode = `<!-- Через CDN -->
<script src="https://cdn.yourplatform.com/chatbot-sdk.min.js"></script>

<!-- Или через npm -->
npm install chatbot-sdk-js`;

  const basicExample = `// Инициализация бота
const chatBot = new ChatBot({
    apiKey: 'your_api_key_here',
    baseURL: 'https://zuuma.ru/api//chat/ask'
});

// Отправка сообщения
async function sendMessage() {
    try {
        const response = await chatBot.sendMessage({
            text: 'Привет! Как дела?',
            userId: 'user_123'
        });
        
        console.log('Ответ:', response.text);
        displayMessage('bot', response.text);
        
    } catch (error) {
        console.error('Ошибка:', error);
        displayMessage('error', 'Что-то пошло не так');
    }
}`;

  const chatInterfaceExample = `<!DOCTYPE html>
<html>
<head>
    <title>Чат с ботом</title>
    <script src="https://cdn.yourplatform.com/chatbot-sdk.min.js"></script>
    <style>
        .chat-container {
            max-width: 600px;
            margin: 50px auto;
            border: 1px solid #ddd;
            border-radius: 10px;
            overflow: hidden;
        }
        
        .chat-messages {
            height: 400px;
            overflow-y: scroll;
            padding: 20px;
            background: #f9f9f9;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px 15px;
            border-radius: 20px;
            max-width: 80%;
        }
        
        .user-message {
            background: #007bff;
            color: white;
            margin-left: auto;
            text-align: right;
        }
        
        .bot-message {
            background: white;
            border: 1px solid #eee;
        }
        
        .chat-input {
            display: flex;
            padding: 20px;
            background: white;
        }
        
        .chat-input input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin-right: 10px;
        }
        
        .chat-input button {
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .typing-indicator {
            font-style: italic;
            color: #666;
            padding: 10px 15px;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-messages" id="messages">
            <div class="message bot-message">
                Привет! 👋 Я ваш ассистент. Чем могу помочь?
            </div>
        </div>
        
        <div class="chat-input">
            <input 
                type="text" 
                id="messageInput" 
                placeholder="Введите сообщение..."
                onkeypress="handleKeyPress(event)"
            />
            <button onclick="sendMessage()">Отправить</button>
        </div>
    </div>
    
    <script>
        // Инициализация чат-бота
        const chatBot = new ChatBot({
            apiKey: 'your_api_key_here'
        });
        
        const messagesContainer = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        
        function addMessage(type, text) {
            const message = document.createElement('div');
            message.className = \`message \${type}-message\`;
            message.textContent = text;
            messagesContainer.appendChild(message);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function showTyping() {
            const typing = document.createElement('div');
            typing.className = 'typing-indicator';
            typing.id = 'typing';
            typing.textContent = 'Бот печатает...';
            messagesContainer.appendChild(typing);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        function hideTyping() {
            const typing = document.getElementById('typing');
            if (typing) typing.remove();
        }
        
        async function sendMessage() {
            const text = messageInput.value.trim();
            if (!text) return;
            
            // Добавляем сообщение пользователя
            addMessage('user', text);
            messageInput.value = '';
            
            // Показываем индикатор печатания
            showTyping();
            
            try {
                const response = await chatBot.sendMessage({
                    text: text,
                    userId: 'web_user_' + Date.now()
                });
                
                hideTyping();
                addMessage('bot', response.text);
                
            } catch (error) {
                hideTyping();
                addMessage('bot', 'Извините, произошла ошибка. Попробуйте еще раз.');
                console.error('Chat error:', error);
            }
        }
        
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }
    </script>
</body>
</html>`;

  const reactExample = `import React, { useState, useEffect, useRef } from 'react';
import { ChatBot } from 'chatbot-sdk-js';

const ChatInterface = () => {
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Привет! Чем могу помочь?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    const chatBot = new ChatBot({
        apiKey: process.env.REACT_APP_CHATBOT_API_KEY
    });
    
    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;
        
        const userMessage = inputValue.trim();
        setInputValue('');
        setIsLoading(true);
        
        // Добавляем сообщение пользователя
        setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
        setIsTyping(true);
        
        try {
            const response = await chatBot.sendMessage({
                text: userMessage,
                userId: 'react_user',
                context: {
                    timestamp: new Date().toISOString(),
                    platform: 'web'
                }
            });
            
            setIsTyping(false);
            setMessages(prev => [...prev, { 
                type: 'bot', 
                text: response.text,
                sources: response.sources 
            }]);
            
        } catch (error) {
            setIsTyping(false);
            setMessages(prev => [...prev, { 
                type: 'bot', 
                text: 'Извините, произошла ошибка. Попробуйте позже.' 
            }]);
            console.error('Chat error:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>Чат с ассистентом</h3>
            </div>
            
            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div key={index} className={\`message \${message.type}-message\`}>
                        <div className="message-content">
                            {message.text}
                        </div>
                        {message.sources && (
                            <div className="message-sources">
                                Источники: {message.sources.join(', ')}
                            </div>
                        )}
                    </div>
                ))}
                
                {isTyping && (
                    <div className="typing-indicator">
                        <span>Бот печатает</span>
                        <span className="dots">
                            <span>.</span><span>.</span><span>.</span>
                        </span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input">
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите сообщение..."
                    disabled={isLoading}
                    rows={1}
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                >
                    {isLoading ? '⏳' : '📤'}
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;`;

  const vueExample = `<template>
  <div class="chat-interface">
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="(message, index) in messages" 
        :key="index"
        :class="['message', \`\${message.type}-message\`]"
      >
        {{ message.text }}
      </div>
      
      <div v-if="isTyping" class="typing-indicator">
        Бот печатает...
      </div>
    </div>
    
    <div class="chat-input">
      <input
        v-model="newMessage"
        @keypress.enter="sendMessage"
        placeholder="Введите сообщение..."
        :disabled="isLoading"
      />
      <button @click="sendMessage" :disabled="isLoading">
        Отправить
      </button>
    </div>
  </div>
</template>

<script>
import { ChatBot } from 'chatbot-sdk-js';

export default {
  name: 'ChatInterface',
  data() {
    return {
      messages: [
        { type: 'bot', text: 'Привет! Как дела?' }
      ],
      newMessage: '',
      isTyping: false,
      isLoading: false,
      chatBot: null
    };
  },
  
  created() {
    this.chatBot = new ChatBot({
      apiKey: process.env.VUE_APP_CHATBOT_API_KEY
    });
  },
  
  methods: {
    async sendMessage() {
      if (!this.newMessage.trim() || this.isLoading) return;
      
      const userMessage = this.newMessage.trim();
      this.messages.push({ type: 'user', text: userMessage });
      this.newMessage = '';
      this.isLoading = true;
      this.isTyping = true;
      
      try {
        const response = await this.chatBot.sendMessage({
          text: userMessage,
          userId: 'vue_user'
        });
        
        this.isTyping = false;
        this.messages.push({ type: 'bot', text: response.text });
        
      } catch (error) {
        this.isTyping = false;
        this.messages.push({ 
          type: 'bot', 
          text: 'Извините, произошла ошибка.' 
        });
      } finally {
        this.isLoading = false;
        this.$nextTick(() => this.scrollToBottom());
      }
    },
    
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      container.scrollTop = container.scrollHeight;
    }
  }
};
</script>`;

  return (
    <div className="tutorial-page">
      {/* Header */}
      <div className="tutorial-header">
        <div className="tutorial-header-content">
          <Link href="/tutorials" className="tutorial-back-link">
            <ArrowLeft size={20} />
            Назад к туториалам
          </Link>
          
          <div className="tutorial-header-main">
            <div className="tutorial-icon-wrapper">
              <Zap className="tutorial-icon" size={32} />
            </div>
            <div>
              <h1 className="tutorial-title">JavaScript SDK</h1>
              <p className="tutorial-subtitle">
                Клиентская интеграция чат-бота для веб-приложений
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Установка и подключение</h2>
          <p className="tutorial-text">
            JavaScript SDK можно подключить через CDN для быстрого старта или установить через npm 
            для использования в современных веб-приложениях.
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">HTML/Bash</span>
              <button 
                onClick={() => copyToClipboard(installCode, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{installCode}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Базовое использование</h2>
          <p className="tutorial-text">
            Простой пример инициализации бота и отправки сообщения:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">JavaScript</span>
              <button 
                onClick={() => copyToClipboard(basicExample, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{basicExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Полный чат интерфейс</h2>
          <p className="tutorial-text">
            Создание полноценного чат-интерфейса с HTML, CSS и JavaScript:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">HTML</span>
              <button 
                onClick={() => copyToClipboard(chatInterfaceExample, 3)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 3 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{chatInterfaceExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Интеграция с React</h2>
          <p className="tutorial-text">
            Пример компонента чата для React приложений:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">React</span>
              <button 
                onClick={() => copyToClipboard(reactExample, 4)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 4 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 4 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{reactExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Интеграция с Vue.js</h2>
          <p className="tutorial-text">
            Компонент чата для Vue.js приложений:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Vue.js</span>
              <button 
                onClick={() => copyToClipboard(vueExample, 5)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 5 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 5 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{vueExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Конфигурация SDK</h2>
          <div className="tutorial-table">
            <div className="tutorial-table-row tutorial-table-header">
              <div>Параметр</div>
              <div>Тип</div>
              <div>Описание</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>apiKey</code></div>
              <div>string</div>
              <div>API ключ бота (обязательный)</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>baseURL</code></div>
              <div>string</div>
              <div>Базовый URL API</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>timeout</code></div>
              <div>number</div>
              <div>Таймаут запросов (мс)</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>retries</code></div>
              <div>number</div>
              <div>Количество повторов при ошибке</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>debug</code></div>
              <div>boolean</div>
              <div>Режим отладки</div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/tutorials/html-widget" className="tutorial-next-card">
              <Globe size={24} />
              <div>
                <h3>HTML Widget</h3>
                <p>Простое встраивание без программирования</p>
              </div>
            </Link>
            
            <Link href="/tutorials/nodejs" className="tutorial-next-card">
              <Zap size={24} />
              <div>
                <h3>Node.js Integration</h3>
                <p>Серверная интеграция для бэкенда</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}