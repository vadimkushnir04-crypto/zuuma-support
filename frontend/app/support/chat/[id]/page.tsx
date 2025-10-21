'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, RotateCcw, CheckCircle2, Send, Paperclip, User, Bot as BotIcon, UserCircle } from 'lucide-react';

interface Message {
  id: string;
  senderType: 'user' | 'ai' | 'manager';
  content: string;
  createdAt: string;
  files?: Array<{
    fileUrl: string;
    fileName: string;
    fileType: string;
  }>;
}

interface ChatSession {
  id: string;
  status: string;
  escalationReason?: string;
  escalationUrgency?: string;
  userIdentifier: string;
  integrationType: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [returnMessage, setReturnMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!sessionId) return;

    const loadChat = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE_URL}/support/chats/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load chat');
        const data = await res.json();
        setSession(data.session);
        setMessages(data.messages);
      } catch (err) {
        console.error('Ошибка загрузки чата:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || loading) return;
    
    const token = localStorage.getItem('auth_token');

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { sessionId });
    });

    socket.on('message', (payload: any) => {
      if (payload.chatSessionId !== sessionId) return;
      
      setMessages(prev => {
        const exists = prev.some(m => m.id === payload.id);
        if (exists) return prev;
        
        return [
          ...prev,
          {
            id: payload.id || Date.now().toString(),
            senderType: payload.senderType || 'manager',
            content: payload.content,
            createdAt: payload.createdAt || new Date().toISOString(),
            files: payload.files || payload.metadata?.files || [],
          },
        ];
      });
    });

    socket.on('session:update', (s: any) => {
      setSession(s);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, loading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;
    setSending(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/support/chats/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Ошибка при отправке сообщения');
      
      setNewMessage('');
    } catch (err) {
      console.error('Send message error:', err);
      alert('Ошибка при отправке сообщения');
    } finally {
      setSending(false);
    }
  };

  const returnToAi = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${API_BASE_URL}/support/chats/${sessionId}/return-to-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: returnMessage.trim() || undefined }),
      });
      
      setShowReturnModal(false);
      setReturnMessage('');
      router.push('/support');
    } catch (err) {
      console.error('Return to AI error:', err);
      alert('Не удалось вернуть чат на AI');
    }
  };

  const resolveChat = async () => {
    if (!confirm('Вы уверены, что хотите закрыть чат?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${API_BASE_URL}/support/chats/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatSessionId: sessionId }),
      });
      
      router.push('/support');
    } catch (err) {
      console.error('Resolve chat error:', err);
      alert('Не удалось закрыть чат');
    }
  };

  const getSenderConfig = (senderType: string) => {
    const configs = {
      user: {
        label: 'Пользователь',
        class: 'badge-info',
        icon: User,
        bubbleColor: 'var(--info)',
        align: 'right'
      },
      ai: {
        label: 'AI',
        class: 'badge',
        icon: BotIcon,
        bubbleColor: 'var(--bg-elevated)',
        align: 'left'
      },
      manager: {
        label: 'Менеджер',
        class: 'badge-success',
        icon: UserCircle,
        bubbleColor: 'var(--success)',
        align: 'left'
      },
    };
    return configs[senderType as keyof typeof configs] || configs.ai;
  };

  if (loading) {
    return (
    <div className="new-design-system">
      <div className="page-container">
        <div className="loading">
          <div className="spinner"></div>
          <span style={{ marginLeft: 'var(--space-md)' }}>Загрузка чата...</span>
        </div>
      </div>
    </div>
    );
  }

  return (
  <div className="new-design-system">
    <div className="page-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-xl)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/support')}
                className="btn btn-ghost btn-sm mb-md"
                style={{ padding: '0' }}
              >
                <ArrowLeft size={16} />
                Назад к списку
              </button>
              <h1 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xs)' }}>
                {session?.userIdentifier.slice(0, 40)}
              </h1>
              <div className="flex items-center gap-md">
                <span className="badge">{session?.integrationType}</span>
                <span className="text-small text-muted">•</span>
                <span className="text-small text-muted">{session?.status}</span>
              </div>
            </div>

            {session?.status !== 'resolved' && (
              <div className="flex gap-md">
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="btn btn-outline"
                >
                  <RotateCcw size={16} />
                  Вернуть на AI
                </button>
                <button
                  onClick={resolveChat}
                  className="btn btn-success"
                >
                  <CheckCircle2 size={16} />
                  Закрыть чат
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: 'var(--space-xl)',
        background: 'var(--bg-main)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {messages.map((msg) => {
            const config = getSenderConfig(msg.senderType);
            const Icon = config.icon;
            const isUser = msg.senderType === 'user';
            
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{ maxWidth: '70%' }}>
                  {/* Sender Badge */}
                  <div className="flex items-center gap-sm mb-sm" style={{ 
                    justifyContent: isUser ? 'flex-end' : 'flex-start' 
                  }}>
                    <span className={`badge ${config.class}`}>
                      <Icon size={12} />
                      {config.label}
                    </span>
                    <span className="text-tiny text-muted">
                      {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      padding: 'var(--space-lg)',
                      borderRadius: 'var(--radius-lg)',
                      background: isUser ? config.bubbleColor : 'var(--bg-elevated)',
                      color: isUser ? '#fff' : 'var(--text-primary)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {msg.content}

                    {/* Files */}
                    {msg.files && msg.files.length > 0 && (
                      <div style={{ marginTop: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {msg.files.map((file, idx) => (
                          <div key={idx}>
                            {file.fileType === 'image' ? (
                              <a 
                                href={`${API_BASE_URL}${file.fileUrl}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <img 
                                  src={`${API_BASE_URL}${file.fileUrl}`} 
                                  alt={file.fileName}
                                  style={{ 
                                    maxWidth: '300px', 
                                    borderRadius: 'var(--radius)',
                                    marginTop: 'var(--space-sm)'
                                  }}
                                />
                              </a>
                            ) : (
                              <a 
                                href={`${API_BASE_URL}${file.fileUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-sm"
                                style={{ 
                                  color: isUser ? '#fff' : 'var(--accent)',
                                  textDecoration: 'underline'
                                }}
                              >
                                <Paperclip size={14} />
                                {file.fileName}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {session?.status !== 'resolved' && (
        <div style={{
          padding: 'var(--space-xl)',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex gap-md items-end">
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Введите сообщение..."
                  disabled={sending}
                  className="form-textarea"
                  style={{
                    minHeight: '48px',
                    maxHeight: '200px',
                    resize: 'none',
                    overflow: 'hidden'
                  }}
                />
              </div>

              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                className="btn btn-primary"
                style={{ height: '48px' }}
              >
                {sending ? (
                  <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return to AI Modal */}
      {showReturnModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowReturnModal(false)}></div>
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Вернуть чат на AI</h2>
              <p className="modal-description">
                Вы можете отправить финальное сообщение клиенту перед возвратом чата на AI (необязательно)
              </p>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Финальное сообщение (необязательно)</label>
                <textarea
                  value={returnMessage}
                  onChange={(e) => setReturnMessage(e.target.value)}
                  placeholder="Например: 'Рад был помочь! Если возникнут ещё вопросы, AI всегда на связи.'"
                  className="form-textarea"
                  style={{ minHeight: '100px' }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnMessage('');
                }}
                className="btn btn-outline"
              >
                Отмена
              </button>
              <button
                onClick={returnToAi}
                className="btn btn-primary"
              >
                <RotateCcw size={16} />
                Вернуть на AI
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
  );
}