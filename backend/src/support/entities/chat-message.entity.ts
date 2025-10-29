// backend/src/support/entities/chat-message.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

@Entity('chat_messages')
@Index(['chatSessionId', 'createdAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'chat_session_id' })
  @Index()
  chatSessionId: string;

  @ManyToOne(() => ChatSession, (session) => session.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_session_id' })
  chatSession: ChatSession;

  @Column({
    name: 'sender_type',
    type: 'enum',
    enum: ['user', 'ai', 'manager'],
  })
  senderType: 'user' | 'ai' | 'manager';

  @Column({ name: 'sender_id', nullable: true })
  senderId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    sources?: number;
    functionCalled?: string;
    fromCache?: boolean;
    escalated?: boolean;
    reason?: string;
    urgency?: string;
    hasContext?: boolean;  // ✅ ДОБАВЛЕНО
    files?: Array<{  // ✅ ДОБАВЛЕНО
      fileUrl: string;
      fileName: string;
      fileType: string;
      pageNumber?: number;
    }>;
  };

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}