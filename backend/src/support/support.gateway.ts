// backend/src/support/support.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [
          'https://zuuma.ru',
          'https://www.zuuma.ru',
        ]
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'null',
        ],
    credentials: true,
  },
  transports: ['websocket', 'polling'], // ✅ Поддержка fallback
})
@Injectable()
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('SupportGateway');
  
  private socketToUser = new Map<string, string>();
  private sessionToRoom = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`✅ Client connected: ${client.id}`);
    
    try {
      // ✅ Извлекаем токен из auth или cookie
      let token = client.handshake.auth?.token;
      
      // Fallback: парсим cookie вручную
      if (!token && client.handshake.headers.cookie) {
        const cookies = client.handshake.headers.cookie
          .split(';')
          .map(c => c.trim());
        
        const tokenCookie = cookies.find(c => c.startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
          this.logger.log(`🍪 Token extracted from cookie for ${client.id}`);
        }
      }
      
      if (token) {
        this.socketToUser.set(client.id, `user-${client.id}`);
        this.logger.log(`🔐 Token found for client ${client.id}`);
      } else {
        this.logger.warn(`⚠️ No token found for client ${client.id}`);
      }
    } catch (err) {
      this.logger.error('Error extracting user from socket:', err);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
    this.socketToUser.delete(client.id);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, payload: { sessionId: string }) {
    const { sessionId } = payload;
    if (!sessionId) {
      this.logger.warn(`⚠️ Join attempt without sessionId from ${client.id}`);
      return;
    }
    
    client.join(sessionId);
    this.logger.log(`✅ Client ${client.id} joined session: ${sessionId}`);
  }

  @SubscribeMessage('joinAssistant')
  handleJoinAssistant(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { 
      assistantId: string; 
      userIdentifier?: string;
      sessionId?: string;
    }
  ) {
    const { assistantId, userIdentifier, sessionId } = payload;
    
    if (!assistantId) {
      this.logger.warn(`⚠️ joinAssistant without assistantId from ${client.id}`);
      return;
    }
    
    const room = userIdentifier 
      ? `assistant:${assistantId}:${userIdentifier}`
      : `assistant:${assistantId}:frontend:${client.id}`;
    
    // Присоединяем к комнате ассистента
    client.join(room);
    client.data.assistantRoom = room;
    
    // Если есть sessionId - присоединяем и к нему
    if (sessionId) {
      client.join(sessionId);
      this.sessionToRoom.set(sessionId, room);
      this.logger.log(`✅ Client ${client.id} joined BOTH: ${room} AND ${sessionId}`);
    } else {
      this.logger.log(`✅ Client ${client.id} joined assistant: ${room}`);
    }
  }

  // === EMITTERS ===

  emitMessageToSession(sessionId: string, payload: any) {
    this.logger.log(`🚀 Emit to session ${sessionId}: ${payload?.content?.slice?.(0, 50)}`);
    
    const room = this.server.sockets.adapter.rooms.get(sessionId);
    if (!room || room.size === 0) {
      this.logger.warn(`⚠️ Room ${sessionId} has no clients!`);
    } else {
      this.logger.log(`📤 Room ${sessionId} has ${room.size} client(s)`);
    }
    
    // ✅ Отправляем в комнату сессии
    this.server.to(sessionId).emit('message', payload);
    
    // ✅ ВАЖНО: Также пробуем отправить в assistant room
    const assistantRoom = this.sessionToRoom.get(sessionId);
    if (assistantRoom) {
      const assistantRoomClients = this.server.sockets.adapter.rooms.get(assistantRoom);
      if (assistantRoomClients && assistantRoomClients.size > 0) {
        this.logger.log(`📤 Also emitting to assistant room: ${assistantRoom}`);
        this.server.to(assistantRoom).emit('message', payload);  // ✅ ДОБАВЛЕНО
      }
    }
  }

  emitSessionUpdate(sessionId: string, session: any) {
    this.logger.log(`📤 Session update -> ${sessionId}`);
    this.server.to(sessionId).emit('session:update', session);
  }

  emitToAssistantRoom(assistantId: string, payload: any) {
    const userIdentifier = payload.userIdentifier || payload.chatSessionId;
    
    if (userIdentifier) {
      const room = `assistant:${assistantId}:${userIdentifier}`;
      this.logger.log(`📤 Emit to specific room: ${room}`);
      this.server.to(room).emit('assistant:message', payload);
    } else {
      const room = `assistant:${assistantId}`;
      this.logger.log(`📤 Emit to assistant room (fallback): ${room}`);
      this.server.to(room).emit('assistant:message', payload);
    }
  }
}