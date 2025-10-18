'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

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

  // ✅ Загрузка чата
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
        console.log('✅ Chat loaded:', {
          sessionId: data.session.id,
          messagesCount: data.messages.length,
          status: data.session.status,
        });
      } catch (err) {
        console.error('❌ Ошибка загрузки чата:', err);
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [sessionId]);

  // ✅ WebSocket подключение
  useEffect(() => {
    if (!sessionId || loading) return;
    
    const token = localStorage.getItem('auth_token');

    if (socketRef.current) {
      console.log('🔌 Disconnecting previous socket');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // ✅ ИСПРАВЛЕНО: Убрали /support из URL
    const socket = io('${API_BASE_URL}', {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Support page WebSocket connected:', socket.id);
      
      // ✅ Присоединяемся к комнате sessionId
      socket.emit('join', { sessionId });
      console.log('🔌 Joined session room:', sessionId);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    socket.on('message', (payload: any) => {
      console.log('📨 WS message received on support page:', {
        id: payload.id,
        senderType: payload.senderType,
        content: payload.content?.substring(0, 50),
        chatSessionId: payload.chatSessionId,
        currentSessionId: sessionId,
        files: payload.files?.length || 0,
      });
      
      // ✅ Проверяем, что сообщение для нашей сессии
      if (payload.chatSessionId !== sessionId) {
        console.log('⚠️ Message for different session, ignoring');
        return;
      }
      
      setMessages(prev => {
        // Проверка на дубликаты
        const exists = prev.some(m => m.id === payload.id);
        if (exists) {
          console.log('🚫 Duplicate message prevented:', payload.id);
          return prev;
        }
        
        console.log('✅ Adding message to support page:', payload.id);
        
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
      console.log('📊 Session updated:', s.status);
      setSession(s);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Support page WS disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        setTimeout(() => socket.connect(), 1000);
      }
    });

    return () => {
      console.log('🧹 Support page WebSocket cleanup');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('message');
      socket.off('session:update');
      socket.off('disconnect');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, loading]);

  // ✅ Автоскролл
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      
      console.log('✅ Message sent from support page');
      setNewMessage('');
    } catch (err) {
      console.error('❌ Send message error:', err);
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
      
      console.log('✅ Chat returned to AI');
      setShowReturnModal(false);
      setReturnMessage('');
      router.push('/support');
    } catch (err) {
      console.error('❌ Return to AI error:', err);
      alert('Не удалось вернуть чат на AI');
    }
  };

  const resolveChat = async () => {
    if (!confirm('Вы уверены, что хотите закрыть чат?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await fetch('${API_BASE_URL}/support/chats/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatSessionId: sessionId }),
      });
      
      console.log('✅ Chat resolved');
      router.push('/support');
    } catch (err) {
      console.error('❌ Resolve chat error:', err);
      alert('Не удалось закрыть чат');
    }
  };

  const getSenderBadge = (senderType: string) => {
    const colors: Record<string, string> = {
      user: 'bg-blue-100 text-blue-800',
      ai: 'bg-purple-100 text-purple-800',
      manager: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      user: 'Пользователь',
      ai: 'AI',
      manager: 'Менеджер',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[senderType]}`}>
        {labels[senderType]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Загрузка чата...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/support')}
              className="text-blue-500 hover:text-blue-700 mb-2"
            >
              ← Назад к списку
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Чат: {session?.userIdentifier.slice(0, 30)}
            </h1>
            <p className="text-sm text-gray-500">
              {session?.integrationType} • {session?.status}
            </p>
          </div>

          {session?.status !== 'resolved' && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowReturnModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                🔄 Вернуть на AI
              </button>
              <button
                onClick={resolveChat}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                ✅ Закрыть чат
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-5xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl rounded-lg p-4 ${
                  msg.senderType === 'user'
                    ? 'bg-blue-500 text-white'
                    : msg.senderType === 'ai'
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-green-100 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getSenderBadge(msg.senderType)}
                  <span className="text-xs opacity-75">
                    {new Date(msg.createdAt).toLocaleTimeString('ru-RU')}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                
                {/* ✅ Отображение файлов */}
                {msg.files && msg.files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.files.map((file, idx) => (
                      <div key={idx} className="border-t pt-2">
                        {file.fileType === 'image' ? (
                          <a 
                            href={`${API_BASE_URL}${file.fileUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <img 
                              src={`${API_BASE_URL}${file.fileUrl}`} 
                              alt={file.fileName}
                              className="max-w-xs rounded"
                            />
                          </a>
                        ) : (
                          <a 
                            href={`${API_BASE_URL}${file.fileUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-2"
                          >
                            📎 {file.fileName}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {session?.status !== 'resolved' && (
        <div className="bg-white border-t p-4">
          <div className="max-w-5xl mx-auto flex gap-2">
            <input
              type="text"
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
              className="flex-1 border rounded-lg p-2"
            />

            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300"
            >
              {sending ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>
      )}

      {/* Modal для возврата на AI */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Вернуть чат на AI</h2>
            <p className="text-gray-600 mb-4">
              Вы можете отправить финальное сообщение клиенту перед возвратом чата на AI (необязательно):
            </p>
            <textarea
              value={returnMessage}
              onChange={(e) => setReturnMessage(e.target.value)}
              placeholder="Например: 'Рад был помочь! Если возникнут ещё вопросы, AI всегда на связи.'"
              className="w-full border rounded-lg p-2 mb-4 h-24 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnMessage('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Отмена
              </button>
              <button
                onClick={returnToAi}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Вернуть на AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}