import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../entities/user.entity';

export enum AuditAction {
  // Действия с ассистентами
  ASSISTANT_CREATED = 'assistant_created',
  ASSISTANT_UPDATED = 'assistant_updated',
  ASSISTANT_DELETED = 'assistant_deleted',
  ASSISTANT_VIEWED = 'assistant_viewed',
  
  // Действия с функциями (КРИТИЧНО!)
  FUNCTION_CREATED = 'function_created',
  FUNCTION_UPDATED = 'function_updated',
  FUNCTION_DELETED = 'function_deleted',
  FUNCTION_EXECUTED = 'function_executed',
  FUNCTION_VIEWED = 'function_viewed',
  
  // Действия с файлами
  FILE_UPLOADED = 'file_uploaded',
  FILE_DELETED = 'file_deleted',
  FILE_DOWNLOADED = 'file_downloaded',
  FILE_VIEWED = 'file_viewed',
  
  // Действия с интеграциями
  INTEGRATION_CONNECTED = 'integration_connected',
  INTEGRATION_DISCONNECTED = 'integration_disconnected',
  INTEGRATION_UPDATED = 'integration_updated',
  
  // Действия с подпиской
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPGRADED = 'subscription_upgraded',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  
  // Действия в чате
  CHAT_MESSAGE_SENT = 'chat_message_sent',
  CHAT_SESSION_STARTED = 'chat_session_started',
  CHAT_SESSION_ENDED = 'chat_session_ended',
  
  // Действия с Telegram
  TELEGRAM_BOT_CREATED = 'telegram_bot_created',
  TELEGRAM_BOT_UPDATED = 'telegram_bot_updated',
  TELEGRAM_BOT_DELETED = 'telegram_bot_deleted',
  TELEGRAM_MESSAGE_RECEIVED = 'telegram_message_received',
  
  // Действия с аккаунтом
  LOGIN = 'login',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  PROFILE_UPDATED = 'profile_updated',
  EMAIL_VERIFIED = 'email_verified',
  
  // Потенциально опасные действия
  API_KEY_CREATED = 'api_key_created',
  API_KEY_DELETED = 'api_key_deleted',
  API_KEY_USED = 'api_key_used',
  
  // Административные действия
  ADMIN_ACTION = 'admin_action',
  USER_BANNED = 'user_banned',
  USER_UNBANNED = 'user_unbanned',
  
  // Системные события
  SYSTEM_ERROR = 'system_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
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

  // Детали действия
  @Column({ type: 'jsonb', nullable: true })
  details: {
    functionName?: string;
    functionCode?: string;
    endpoint?: string;
    method?: string;
    assistantId?: string;
    fileName?: string;
    fileSize?: number;
    subscriptionPlan?: string;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
    requestBody?: any;
    responseStatus?: number;
    telegramBotId?: string;
    messageText?: string;
    [key: string]: any;
  };

  // IP адрес пользователя
  @Column({ type: 'varchar', length: 45, nullable: true })
  @Index()
  ipAddress: string;

  // User Agent браузера
  @Column({ type: 'text', nullable: true })
  userAgent: string;

  // Результат действия
  @Column({ type: 'varchar', length: 50, default: 'success' })
  @Index()
  status: 'success' | 'failure' | 'pending';

  // Сообщение об ошибке
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
    browserInfo?: string;
    deviceType?: string;
    location?: string;
    [key: string]: any;
  };
}