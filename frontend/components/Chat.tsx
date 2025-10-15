// components/Chat.tsx
"use client";
import { useState, useRef, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { SelectedAssistantContext } from "./UploadTextForm";
import { io, Socket } from 'socket.io-client';

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
  
  const { selectedAssistantId } = useContext(SelectedAssistantContext);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedAssistantId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      const newUserIdentifier = `frontend:${Date.now()}`;
      setUserIdentifier(newUserIdentifier);
      
      setMessages([{
        id: `welcome-${Date.now()}`,
        text: t('welcomeMessage'),
        sender: "assistant",
        timestamp: new Date(),
      }]);
      setConversationId(null);
      setChatSessionId(null);
    }
  }, [selectedAssistantId, t]);

  const isDuplicate = (newMessage: Message): boolean => {
    return messages.some(msg => {
      if (msg.id === newMessage.id) {
        return true;
      }
      
      const timeDiff = Math.abs(msg.timestamp.getTime() - newMessage.timestamp.getTime());
      const sameContent = msg.text.trim() === newMessage.text.trim();
      const sameSender = msg.sender === newMessage.sender;
      
      if (sameContent && sameSender && timeDiff < 2000) {
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedAssistantId) return;

    const messageText = input;
    setInput("");
    setIsLoading(true);

    // ✅ НЕ добавляем сообщение локально - оно придёт через WebSocket
    // Это избегает дублирования

    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`http://localhost:4000/chat/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageText,
          assistantId: selectedAssistantId,
          conversationId: conversationId,
          chatSessionId: chatSessionId,
          userIdentifier: userIdentifier,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        if (data.chatSessionId && data.chatSessionId !== chatSessionId) {
          setChatSessionId(data.chatSessionId);
          console.log('💾 Chat session ID:', data.chatSessionId);
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

  // ✅ ИСПРАВЛЕННОЕ WebSocket подключение
  useEffect(() => {
    if (!selectedAssistantId) return;

    const token = localStorage.getItem('auth_token');
    
    // ✅ Убрали /support - теперь root namespace
    const socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'], // ✅ Добавили fallback на polling
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    console.log('🔌 WebSocket connecting for assistant:', selectedAssistantId);
    console.log('🔑 UserIdentifier:', userIdentifier);

    socket.on('connect', () => {
      console.log('✅ WebSocket connected, socket ID:', socket.id);
      
      // ✅ Присоединяемся к комнате ассистента
      socket.emit('joinAssistant', { 
        assistantId: selectedAssistantId,
        userIdentifier: userIdentifier
      });
      console.log('🔌 Joined assistant room:', `assistant:${selectedAssistantId}:${userIdentifier}`);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    socket.on('assistant:message', (payload) => {
      console.log('📨 WS assistant:message received:', {
        id: payload.id,
        content: payload.content?.substring(0, 50),
        senderType: payload.senderType,
        files: payload.files?.length || 0,
        createdAt: payload.createdAt
      });
      
      const newMessage: Message = {
        id: payload.id || `ws-${Date.now()}`,
        text: payload.content,
        sender: payload.senderType === 'user' ? 'user' : 'assistant',
        timestamp: new Date(payload.createdAt || Date.now()),
        sources: payload.metadata?.sources || payload.sources,
        files: payload.files || [],
      };
      
      addMessageIfNotExists(newMessage);
      
      if (payload.senderType !== 'user') {
        setIsLoading(false);
      }
    });

    socket.on('message', (payload) => {
      console.log('💬 WS message received:', {
        id: payload.id,
        content: payload.content?.substring(0, 50),
        senderType: payload.senderType,
        files: payload.files?.length || 0,
        createdAt: payload.createdAt
      });
      
      const newMessage: Message = {
        id: payload.id || `ws-${Date.now()}`,
        text: payload.content,
        sender: payload.senderType === 'user' ? 'user' : 'assistant',
        timestamp: new Date(payload.createdAt || Date.now()),
        sources: payload.metadata?.sources || payload.sources,
        files: payload.files || [],
      };
      
      addMessageIfNotExists(newMessage);
      
      if (payload.senderType !== 'user') {
        setIsLoading(false);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    return () => {
      console.log('🔌 WebSocket cleanup - disconnecting');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedAssistantId, userIdentifier]);

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

  return (
    <div className="chat-wrapper">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">{t('askQuestion')}</div>
        ) : (
          <div className="chat-message-list">
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.sender}`}>
                <div className="chat-bubble">
                  {message.text}
                  
                  {/* Отображение файлов */}
                  {message.files && message.files.length > 0 && (
                    <div className="message-files">
                      {message.files.map((file, idx) => (
                        <div key={idx} className="file-attachment">
                          {file.fileType === 'image' ? (
                            <a 
                              href={`http://localhost:4000${file.fileUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="image-preview-link"
                            >
                              <img 
                                src={`http://localhost:4000${file.fileUrl}`} 
                                alt={file.fileName}
                                className="message-image"
                                style={{ maxWidth: '300px', borderRadius: '8px', marginTop: '8px' }}
                              />
                              <div className="file-name">📷 {file.fileName}</div>
                            </a>
                          ) : (
                            <a 
                              href={`http://localhost:4000${file.fileUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="file-link"
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                padding: '8px 12px',
                                background: 'rgba(0,0,0,0.05)',
                                borderRadius: '6px',
                                marginTop: '8px',
                                textDecoration: 'none',
                                color: 'inherit'
                              }}
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
                  
                  {message.sources && message.sources > 0 && (
                    <div className="message-sources">
                      📄 {t('sources', { count: message.sources })}
                    </div>
                  )}
                </div>
              </div>
            ))}
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="chat-input-wrapper">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={t('placeholders.askQuestion')}
          disabled={isLoading}
          rows={1}
        />
        <button onClick={sendMessage} disabled={!input.trim() || isLoading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" 
                  stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}