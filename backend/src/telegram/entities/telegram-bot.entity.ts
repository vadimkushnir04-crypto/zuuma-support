// backend/src/telegram/entities/telegram-bot.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Integration } from '../../integrations/entities/integration.entity';
import { User } from '../../entities/user.entity';
import { Assistant } from '../../assistants/entities/assistant.entity';

@Entity('telegram_bots')
export class TelegramBot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'integration_id', type: 'uuid' })
  integrationId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'assistant_id', type: 'uuid' })
  assistantId: string;

  // Encrypted token
  @Column({ name: 'bot_token', type: 'varchar', length: 255 })
  botToken: string;

  @Column({ name: 'bot_username', type: 'varchar', length: 255, unique: true })
  @Index()
  botUsername: string;

  @Column({ name: 'bot_name', type: 'varchar', length: 255 })
  botName: string;

  @Column({ name: 'bot_id', type: 'bigint', unique: true })
  botId: string;

  @Column({ name: 'webhook_url', type: 'varchar', length: 500, nullable: true })
  webhookUrl: string;

  @Column({ name: 'webhook_secret', type: 'varchar', length: 100, nullable: true })
  webhookSecret: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'inactive',
  })
  @Index()
  status: 'active' | 'inactive' | 'error' | 'creating';

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: [] })
  commands: string[];

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ name: 'total_messages', type: 'integer', default: 0 })
  totalMessages: number;

  @Column({ name: 'total_users', type: 'integer', default: 0 })
  totalUsers: number;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Integration, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'integration_id' })
  integration: Integration;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Assistant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assistant_id' })
  assistant: Assistant;
}