// backend/src/support/entities/chat-session.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';

export type ChatStatus = 'ai' | 'pending_human' | 'human_active' | 'resolved';

@Entity('chat_sessions')
@Index(['assistantId', 'status'])
@Index(['assignedManagerId', 'status'])
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assistant_id' })
  @Index()
  assistantId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'conversation_id', type: 'varchar', nullable: true })
  @Index()
  conversationId?: string;

  @Column({ name: 'integration_type' })
  integrationType: string;

  @Column({ name: 'external_chat_id', nullable: true })
  externalChatId: string;

  @Column({
    type: 'enum',
    enum: ['ai', 'pending_human', 'human_active', 'resolved'],
    default: 'ai',
  })
  @Index()
  status: ChatStatus;

  @Column({ name: 'escalation_reason', type: 'text', nullable: true })
  escalationReason?: string;

  @Column({ name: 'escalation_urgency', nullable: true })
  escalationUrgency?: 'low' | 'medium' | 'high';

  @Column({ name: 'escalated_at', type: 'timestamp', nullable: true })
  escalatedAt?: Date;

  @Column({ name: 'assigned_manager_id', nullable: true })
  assignedManagerId?: string;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolved_by', nullable: true })
  resolvedBy?: string;

  @Column({ name: 'user_identifier' })
  userIdentifier: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ChatMessage, (msg) => msg.chatSession)
  messages: ChatMessage[];
}
