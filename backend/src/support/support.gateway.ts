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
  // ✅ Убрали namespace - теперь root namespace для совместимости
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'null'],
    credentials: true,
  },
})

@Injectable()
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('SupportGateway');
  
  private socketToUser = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    try {
      const token = client.handshake.auth?.token;
      if (token) {
        this.socketToUser.set(client.id, `user-${client.id}`);
      }
    } catch (err) {
      console.error('Error extracting user from socket:', err);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.socketToUser.delete(client.id);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, payload: { sessionId: string }) {
    const { sessionId } = payload;
    if (!sessionId) return;
    client.join(sessionId);
    this.logger.log(`Client ${client.id} joined session room: ${sessionId}`);
  }

  @SubscribeMessage('joinAssistant')
  handleJoinAssistant(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { assistantId: string; userIdentifier?: string }
  ) {
    const { assistantId, userIdentifier } = payload;
    if (!assistantId) return;
    
    const room = userIdentifier 
      ? `assistant:${assistantId}:${userIdentifier}`
      : `assistant:${assistantId}:frontend:${client.id}`;
    
    client.join(room);
    client.data.assistantRoom = room;
    
    this.logger.log(`Client ${client.id} joined assistant room: ${room}`);
  }

  // === EMITTERS ===

  emitMessageToSession(sessionId: string, payload: any) {
    this.logger.log(`🚀 emitMessageToSession -> ${sessionId}: ${payload?.content?.slice?.(0, 50)}`);
    this.logger.log(`Emit to session ${sessionId}: ${payload?.content?.slice?.(0, 80)}`);
    this.server.to(sessionId).emit('message', payload);
  }

  emitSessionUpdate(sessionId: string, session: any) {
    this.logger.log(`Emit session:update -> ${sessionId}`);
    this.server.to(sessionId).emit('session:update', session);
  }

  emitToAssistantRoom(assistantId: string, payload: any) {
    const userIdentifier = payload.userIdentifier || payload.chatSessionId;
    
    if (userIdentifier) {
      const room = `assistant:${assistantId}:${userIdentifier}`;
      this.logger.log(`Emit to specific user room: ${room}`);
      this.server.to(room).emit('assistant:message', payload);
    } else {
      const room = `assistant:${assistantId}`;
      this.logger.log(`Emit to assistant room (fallback): ${room}`);
      this.server.to(room).emit('assistant:message', payload);
    }
  }
}