import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { OneToMany } from 'typeorm';
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
  @Column({ nullable: true, select: false })
  password: string | null;

  @Column({ nullable: true })
  full_name: string | null;

  @Column({ nullable: true })
  avatar_url: string | null;

  // Откуда пришел пользователь
  @Column({ default: 'local' })
  provider: 'local' | 'google' | 'yandex' | 'vk';

  // OAuth IDs (ИСПРАВЛЕНО: убрал sparse)
  @Column({ nullable: true, unique: true })
  google_id: string | null;

  @Column({ nullable: true, unique: true })
  yandex_id: string | null;

  @Column({ nullable: true, unique: true })
  vk_id: string | null;

  @Column({ nullable: true })
  telegram_id: string | null;

  @Column({ nullable: true })
  github_id: string | null;

  // Подписка и токены
  @Column({ default: 'free' })
  plan: 'free' | 'pro' | 'max';

  @Column({ type: 'bigint', default: 0 })
  tokens_used: number;

  @Column({ type: 'bigint', default: 100000 })
  tokens_limit: number;

  @Column({ type: 'int', default: 1 })
  assistants_limit: number;

  // 152-ФЗ: согласие на обработку ПД
  @Column({ type: 'timestamp', nullable: true })
  consent_given_at: Date | null;

  @Column({ default: false })
  agreed_to_data_transfer: boolean;

  @Column({ nullable: true })
  consent_ip_address: string | null;

  // Подтверждение email
  @Column({ default: false })
  email_verified: boolean;

  @Column({ nullable: true })
  email_verification_token: string | null;

  // Даты
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date | null;
}