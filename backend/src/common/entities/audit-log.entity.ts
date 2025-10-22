import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../entities/user.entity';

export enum AuditAction {
  // Действия с ассистентами
  ASSISTANT_CREATED = 'assistant_created',
  ASSISTANT_UPDATED = 'assistant_updated',
  ASSISTANT_DELETED = 'assistant_deleted',
  
  // Действия с функциями (КРИТИЧНО!)
  FUNCTION_CREATED = 'function_created',
  FUNCTION_UPDATED = 'function_updated',
  FUNCTION_DELETED = 'function_deleted',
  FUNCTION_EXECUTED = 'function_executed',
  
  // Действия с файлами
  FILE_UPLOADED = 'file_uploaded',
  FILE_DELETED = 'file_deleted',
  
  // Действия с интеграциями
  INTEGRATION_CONNECTED = 'integration_connected',
  INTEGRATION_DISCONNECTED = 'integration_disconnected',
  
  // Действия с подпиской
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPGRADED = 'subscription_upgraded',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  
  // Действия в чате
  CHAT_MESSAGE_SENT = 'chat_message_sent',
  CHAT_SESSION_STARTED = 'chat_session_started',
  
  // Действия с аккаунтом
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  PROFILE_UPDATED = 'profile_updated',
  
  // Потенциально опасные действия
  API_KEY_CREATED = 'api_key_created',
  API_KEY_DELETED = 'api_key_deleted',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: AuditAction })
  @Index()
  action: AuditAction;

  // Детали действия (например, какую функцию создал, с каким кодом)
  @Column({ type: 'jsonb', nullable: true })
  details: {
    functionName?: string;
    functionCode?: string;
    endpoint?: string;
    method?: string;
    assistantId?: string;
    fileName?: string;
    subscriptionPlan?: string;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
    requestBody?: any;
    responseStatus?: number;
    [key: string]: any;
  };

  // IP адрес пользователя
  @Column({ type: 'varchar', length: 45, nullable: true })
  @Index()
  ipAddress: string;

  // User Agent браузера
  @Column({ type: 'text', nullable: true })
  userAgent: string;

  // Результат действия (success/failure)
  @Column({ type: 'varchar', length: 50, default: 'success' })
  status: 'success' | 'failure' | 'pending';

  // Сообщение об ошибке (если было)
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  // Дополнительные метаданные
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    assistantName?: string;
    tokensCost?: number;
    duration?: number;
    [key: string]: any;
  };
}