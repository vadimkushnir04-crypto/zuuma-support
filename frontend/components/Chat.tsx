// components/Chat.tsx
"use client";
import { useState, useRef, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { SelectedAssistantContext } from "./UploadTextForm";
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  sources?: number;
  files?: Array<{
    fileUrl: string;
    fileName: string;
    fileType: string;
    pageNumber?: number;
  }>;
}

export default function Chat() {
  const { t } = useTranslation('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [userIdentifier, setUserIdentifier] = useState<string>(`frontend:${Date.now()}`);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { selectedAssistantId } = useContext(SelectedAssistantContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Инициализация при выборе ассистента
  useEffect(() => {
    if (selectedAssistantId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      let identifier = localStorage.getItem(`userIdentifier_${selectedAssistantId}`);
      if (!identifier) {
        identifier = `frontend:${Date.now()}`;
        localStorage.setItem(`userIdentifier_${selectedAssistantId}`, identifier);
        console.log('🆕 Created new userIdentifier:', identifier);
      } else {
        console.log('♻️ Reusing existing userIdentifier:', identifier);
      }
      setUserIdentifier(identifier);

      // Загружаем историю чата
      loadChatHistory(selectedAssistantId, identifier);
    }
  }, [selectedAssistantId, t]);

    // Загрузка истории сообщений
    const loadChatHistory = async (assistantId: string, userIdent: string) => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/support/sessions/by-identifier?assistantId=${assistantId}&userIdentifier=${userIdent}`,
          { credentials: 'include' } // ✅ cookie
        );

        if (res.ok) {
          const data = await res.json();

          if (data.session && data.messages && data.messages.length > 0) {
            console.log('📜 Loaded chat history:', data.messages.length, 'messages');
            setChatSessionId(data.session.id);

            const loadedMessages: Message[] = data.messages.map((msg: any) => {
              // ✅ ДЕБАГ: Проверяем содержимое сообщения
              if (msg.content && typeof msg.content === 'string' && msg.content.endsWith('0')) {
                console.warn('⚠️ Message with trailing 0 detected:', {
                  id: msg.id,
                  rawContent: msg.content,
                  sources: msg.metadata?.sources,
                });
              }
              
              return {
                id: msg.id,
                text: msg.content,  // ✅ Берем content как есть
                sender: msg.senderType === 'user' ? 'user' : 'assistant',
                timestamp: new Date(msg.createdAt),
                // ✅ Проверяем тип sources
                sources: typeof msg.metadata?.sources === 'number' 
                  ? msg.metadata.sources 
                  : 0,
                // ✅ Проверяем что files - это массив
                files: Array.isArray(msg.metadata?.files) 
                  ? msg.metadata.files 
                  : [],
              };
            });

            setMessages(loadedMessages);
          } else {
            // Нет истории - показываем приветствие
            setMessages([{
              id: `welcome-${Date.now()}`,
              text: t('welcomeMessage'),
              sender: "assistant",
              timestamp: new Date(),
            }]);
          }
        } else {
          console.error('❌ Failed to load chat history:', res.status);
          setMessages([{
            id: `welcome-${Date.now()}`,
            text: t('welcomeMessage'),
            sender: "assistant",
            timestamp: new Date(),
          }]);
        }
      } catch (err) {
        console.error('❌ Error loading chat history:', err);
        setMessages([{
          id: `welcome-${Date.now()}`,
          text: t('welcomeMessage'),
          sender: "assistant",
          timestamp: new Date(),
        }]);
      }
    };

  const isDuplicate = (newMessage: Message): boolean => {
    return messages.some(msg => {
      // Проверка по ID
      if (msg.id === newMessage.id) return true;
      
      // Проверка по содержимому + времени + отправителю
      const timeDiff = Math.abs(msg.timestamp.getTime() - newMessage.timestamp.getTime());
      const sameContent = msg.text.trim() === newMessage.text.trim();
      const sameSender = msg.sender === newMessage.sender;
      
      // Дубль, если одинаковое содержимое и отправитель в течение 3 секунд
      if (sameContent && sameSender && timeDiff < 3000) {
        console.log('🚫 Duplicate detected:', {
          existingId: msg.id,
          newId: newMessage.id,
          text: newMessage.text.substring(0, 30),
          timeDiff: `${timeDiff}ms`
        });
        return true;
      }
      
      return false;
    });
  };

  const addMessageIfNotExists = (newMessage: Message) => {
    if (isDuplicate(newMessage)) {
      console.log('🚫 Duplicate prevented:', newMessage.id);
      return;
    }
    
    console.log('✅ Adding message:', {
      id: newMessage.id,
      sender: newMessage.sender,
      text: newMessage.text.substring(0, 30),
      files: newMessage.files?.length || 0
    });
    
    setMessages(prev => [...prev, newMessage]);
  };

  // Отправка сообщения
  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedAssistantId) return;

    const messageText = input;
    setInput("");

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };
    addMessageIfNotExists(userMessage);

    setIsLoading(true);

    try {
      let currentSessionId = chatSessionId;

      if (!currentSessionId) {
        currentSessionId = `temp-${Date.now()}`;
        setChatSessionId(currentSessionId);

        await new Promise(resolve => setTimeout(resolve, 200));

        if (socketRef.current?.connected) {
          socketRef.current.emit('join', { sessionId: currentSessionId });
          socketRef.current.emit('joinAssistant', {
            assistantId: selectedAssistantId,
            userIdentifier: userIdentifier,
            sessionId: currentSessionId,
          });
          console.log('📌 Pre-joined to temp room:', currentSessionId);

          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const response = await fetch(`${API_BASE_URL}/chat/ask`, {
        method: "POST",
        credentials: 'include', // ✅ cookie
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          assistantId: selectedAssistantId,
          conversationId: conversationId,
          chatSessionId: currentSessionId,
          userIdentifier: userIdentifier,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.chatSessionId && data.chatSessionId !== currentSessionId) {
          setChatSessionId(data.chatSessionId);
        }

        if (data.escalated || data.status === 'pending_human' || data.status === 'human_active') {
          setIsLoading(false);
        }

      } else {
        if (response.status === 401) {
          throw new Error('Сессия истекла. Пожалуйста, войдите снова');
        }
        throw new Error(`${t('errors.status')} ${response.status}`);
      }
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: error instanceof Error ? error.message : t('errors.requestError'),
        sender: "assistant",
        timestamp: new Date(),
      };

      addMessageIfNotExists(errorMessage);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // WebSocket подключение
  useEffect(() => {
    if (!selectedAssistantId) return;

    console.log('🔌 Initializing WebSocket connection...');

    const socket = io('https://zuuma.ru', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,  // ← УБЕДИСЬ ЧТО ЭТО ЕСТЬ!
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket connected, socket ID:', socket.id);

      socket.emit('joinAssistant', {
        assistantId: selectedAssistantId,
        userIdentifier: userIdentifier,
        sessionId: chatSessionId,
      });

      if (chatSessionId) {
        socket.emit('join', { sessionId: chatSessionId });
        console.log('📌 Joined session room:', chatSessionId);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connect error:', error.message);
    });

    socket.on('assistant:message', (payload) => {
      console.log('📨 Received assistant message:', payload);
      
      const newMessage: Message = {
        id: payload.id || `ws-${Date.now()}`,
        text: payload.content || 'No content',
        sender: payload.senderType === 'user' ? 'user' : 'assistant',
        timestamp: new Date(payload.createdAt || Date.now()),
        // ✅ Проверяем тип sources
        sources: typeof (payload.metadata?.sources || payload.sources) === 'number' 
          ? (payload.metadata?.sources || payload.sources) 
          : 0,
        // ✅ Проверяем что files - это массив
        files: Array.isArray(payload.files) 
          ? payload.files 
          : (Array.isArray(payload.metadata?.files) ? payload.metadata.files : []),
      };
      
      addMessageIfNotExists(newMessage);
      setIsLoading(false);
    });

    return () => {
      console.log('🔌 Disconnecting WebSocket...');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedAssistantId, userIdentifier]);

  // ✅ Отслеживание chatSessionId - ВТОРОЙ useEffect
  useEffect(() => {
    if (chatSessionId && socketRef.current?.connected) {
      console.log('🔄 ChatSessionId changed, joining room:', chatSessionId);
      
      socketRef.current.emit('join', { sessionId: chatSessionId });
      socketRef.current.emit('joinAssistant', {
        assistantId: selectedAssistantId,
        userIdentifier: userIdentifier,
        sessionId: chatSessionId,
      });
      
      console.log('📌 Joined session room:', chatSessionId);
    }
  }, [chatSessionId, selectedAssistantId, userIdentifier]);

  // Если не выбран ассистент
    if (!selectedAssistantId) {
      return (
        <div className="chat-wrapper">
          <div className="chat-messages">
            <div className="chat-empty">
              {t('noAssistant')}
            </div>
          </div>
          <div className="chat-input-wrapper">
            <textarea
              placeholder={t('placeholders.selectAssistant')}
              disabled
              className="disabled"
              rows={1}
            />
            <button disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" 
                      stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

  // Основной чат
  return (
    <div className="chat-wrapper">
      {/* Контейнер сообщений - ВАЖНО: flex: 1, overflow-y: auto, min-height: 0 */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">{t('askQuestion')}</div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.sender}`}>
                <div className="chat-bubble">
                  {message.text}
                  
                  {/* Файлы */}
                  {message.files && message.files.length > 0 && (
                    <div className="message-files">
                      {message.files.map((file, idx) => (
                        <div key={idx} className="file-attachment">
                          {file.fileType === 'image' ? (
                            <a 
                              href={`${API_BASE_URL}${file.fileUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="image-preview-link"
                            >
                              <img 
                                src={`${API_BASE_URL}${file.fileUrl}`} 
                                alt={file.fileName}
                                className="message-image"
                              />
                              <div className="file-name">📷 {file.fileName}</div>
                            </a>
                          ) : (
                            <a 
                              href={`${API_BASE_URL}${file.fileUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="file-link"
                            >
                              <span className="file-icon">
                                {file.fileType === 'pdf' ? '📄' : '📎'}
                              </span>
                              <span className="file-name">{file.fileName}</span>
                              {file.pageNumber && (
                                <span className="page-number">(стр. {file.pageNumber})</span>
                              )}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Источники */}
                  {message.sources && message.sources > 0 && (
                    <div className="message-sources">
                      📄 {t('sources', { count: message.sources })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Индикатор загрузки */}
            {isLoading && (
              <div className="chat-message assistant">
                <div className="chat-bubble thinking">
                  <div className="dots">
                    <div></div><div></div><div></div>
                  </div>
                  {t('thinking')}
                </div>
              </div>
            )}
            
            {/* Автоскролл к последнему сообщению */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Поле ввода - ВАЖНО: flex-shrink: 0 */}
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (textareaRef.current) {
              const textarea = textareaRef.current;
              const lineHeight = 24;
              const maxRows = 5;
              const maxHeight = lineHeight * maxRows;

              textarea.style.height = 'auto';
              const newHeight = Math.min(textarea.scrollHeight, maxHeight);
              textarea.style.height = `${newHeight}px`;
              textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
            }
          }}
          onKeyDown={handleKeyPress}
          placeholder={t('placeholders.askQuestion')}
          disabled={isLoading}
          rows={1}
          style={{
            resize: 'none',
            overflowY: 'hidden',
            maxHeight: `${24 * 5}px`,
          }}
        />
        <button onClick={sendMessage} disabled={!input.trim() || isLoading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" 
                  stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {/* ========================================
          СТИЛИ - Добавь в конец компонента перед закрывающей скобкой
          ======================================== */}
      <style jsx>{`
        /* Обёртка чата - flex контейнер */
        .chat-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background: var(--bg-default, #121212);
        }

        /* Контейнер сообщений - КРИТИЧЕСКИ ВАЖНЫЕ СВОЙСТВА */
        .chat-messages {
          flex: 1; /* Занимает всё доступное пространство */
          overflow-y: auto; /* Скролл по вертикали */
          overflow-x: hidden; /* Скрываем горизонтальный скролл */
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 0; /* КРИТИЧЕСКИ ВАЖНО для правильной работы flex и scroll */
        }

        /* Кастомный скроллбар */
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: var(--border-color, #2D2D2D);
          border-radius: 3px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: var(--fg-muted, #666);
        }

        /* Пустое состояние */
        .chat-empty {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: var(--fg-muted, #999);
          font-size: 0.95rem;
        }

        /* Сообщение */
        .chat-message {
          display: flex;
          flex-direction: column;
          margin-bottom: 0.5rem;
        }

        .chat-message.user {
          align-items: flex-end;
        }

        .chat-message.assistant {
          align-items: flex-start;
        }

        /* Пузырь сообщения */
        .chat-bubble {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          max-width: 80%;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .chat-message.user .chat-bubble {
          background: var(--primary-color, #4169E1);
          color: white;
        }

        .chat-message.assistant .chat-bubble {
          background: var(--bg-elevated, #1E1E1E);
          border: 1px solid var(--border-color, #2D2D2D);
          color: var(--fg-default, #E0E0E0);
        }

        /* Анимация "думает" */
        .chat-bubble.thinking {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dots {
          display: flex;
          gap: 4px;
        }

        .dots div {
          width: 6px;
          height: 6px;
          background: var(--fg-muted, #999);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .dots div:nth-child(1) {
          animation-delay: -0.32s;
        }

        .dots div:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        /* Файлы */
        .message-files {
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .file-attachment a {
          text-decoration: none;
          color: inherit;
        }

        .image-preview-link {
          display: block;
        }

        .message-image {
          max-width: 300px;
          border-radius: 8px;
          margin-top: 8px;
          display: block;
        }

        .file-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 6px;
          margin-top: 8px;
          transition: background 0.2s;
        }

        .file-link:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .file-name {
          font-size: 0.9rem;
        }

        .page-number {
          font-size: 0.85rem;
          opacity: 0.7;
        }

        /* Источники */
        .message-sources {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          opacity: 0.8;
        }

        /* Поле ввода - НЕ СЖИМАЕТСЯ */
        .chat-input-wrapper {
          padding: 1rem;
          border-top: 1px solid var(--border-color, #2D2D2D);
          background: var(--bg-elevated, #1E1E1E);
          flex-shrink: 0; /* КРИТИЧЕСКИ ВАЖНО - не сжимается */
          display: flex;
          gap: 0.5rem;
          align-items: flex-end;
        }

        /* Textarea */
        .chat-input-wrapper textarea {
          flex: 1;
          padding: 0.75rem 1rem;
          background: var(--bg-default, #121212);
          border: 1px solid var(--border-color, #2D2D2D);
          border-radius: 8px;
          color: var(--fg-default, #E0E0E0);
          font-size: 0.95rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          line-height: 24px;
          min-height: 24px;
        }

        .chat-input-wrapper textarea:focus {
          border-color: var(--primary-color, #4169E1);
        }

        .chat-input-wrapper textarea:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Кнопка отправки */
        .chat-input-wrapper button {
          padding: 0.75rem;
          background: var(--primary-color, #4169E1);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
          height: 40px;
        }

        .chat-input-wrapper button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .chat-input-wrapper button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-input-wrapper button svg {
          transform: rotate(0deg);
        }
      `}</style>
    </div>
  );
}