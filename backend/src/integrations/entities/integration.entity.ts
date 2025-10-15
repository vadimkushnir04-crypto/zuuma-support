// backend/src/integrations/entities/integration.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface IntegrationConfig {
  telegramUrl?: string;
  webhookUrl?: string;
  commands?: string[];
  description?: string;
}

@Entity('integrations')
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['telegram', 'widget', 'api', 'whatsapp'],
  })
  type: string;

  @Column({ name: 'assistant_id' })
  assistantId: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'pending', 'creating'],
    default: 'creating',
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['auto', 'manual'],
    name: 'creation_method',
    default: 'auto',
  })
  creationMethod: string;

  @Column({ name: 'telegram_username', nullable: true })
  telegramUsername: string;

  @Column({ name: 'telegram_token', nullable: true })
  telegramToken: string;

  @Column('json', { nullable: true })
  config: IntegrationConfig | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
