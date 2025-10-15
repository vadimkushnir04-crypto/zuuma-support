'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderType: 'user' | 'ai' | 'manager';
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  status: string;
  escalationReason?: string;
  escalationUrgency?: string;
  userIdentifier: string;
  integrationType: string;
}

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

  useEffect(() => {
    if (!sessionId) return;

    const loadChat = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`http://localhost:4000/support/chats/${sessionId}`, {
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

    const socket = io('http://localhost:4000/support', {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
      socket.emit('join', { sessionId });
    });

    socket.on('message', (payload: any) => {
      console.log('📨 WS message:', payload);
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
          },
        ];
      });
    });

    socket.on('session:update', (s: any) => setSession(s));

    socket.on('disconnect', reason => {
      console.log('❌ WS disconnected:', reason);
      setTimeout(() => socket.connect(), 1000);
    });

    return () => {
      socket.off('connect');
      socket.off('message');
      socket.off('session:update');
      socket.off('disconnect');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, loading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;
    setSending(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:4000/support/chats/${sessionId}/message`, {
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
      console.error(err);
      alert('Ошибка при отправке сообщения');
    } finally {
      setSending(false);
    }
  };

  const returnToAi = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`http://localhost:4000/support/chats/${sessionId}/return-to-ai`, {
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
      console.error('Ошибка при возврате на AI:', err);
      alert('Не удалось вернуть чат на AI');
    }
  };

  const resolveChat = async () => {
    if (!confirm('Вы уверены, что хотите закрыть чат?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await fetch('http://localhost:4000/support/chats/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatSessionId: sessionId }),
      });
      router.push('/support');
    } catch (err) {
      console.error('Ошибка при закрытии чата:', err);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
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
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
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