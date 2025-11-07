import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, DeleteDateColumn } from 'typeorm';
import { Assistant } from '../assistants/entities/assistant.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => Assistant, (assistant) => assistant.user)
  assistants: Assistant[];

  // Для локальной регистрации (Email + пароль)
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  full_name: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url: string | null;

  // Откуда пришел пользователь (оставляем только local и google)
  @Column({ type: 'varchar', length: 20, default: 'local' })
  provider: 'local' | 'google';

  // OAuth IDs (оставляем только google_id)
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  google_id: string | null;

  // Подписка и токены
  @Column({ type: 'varchar', length: 20, default: 'free' })
  plan: 'free' | 'pro' | 'max';

  @Column({ type: 'uuid', nullable: true })
  plan_id: string | null;

  @Column({ type: 'bigint', default: 0 })
  tokens_used: number;

  @Column({ type: 'bigint', default: 100000 })
  tokens_limit: number;

  @Column({ type: 'int', default: 1 })
  assistants_limit: number;

  // 152-ФЗ: согласие на обработку ПД
  @Column({ type: 'timestamp', nullable: true })
  consent_given_at: Date | null;

  @Column({ type: 'boolean', default: false })
  agreed_to_data_transfer: boolean;

  @Column({ type: 'varchar', length: 45, nullable: true })
  consent_ip_address: string | null;

  // Подтверждение email
  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'varchar', nullable: true })
  email_verification_token: string | null;

  // Даты
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date | null;
}