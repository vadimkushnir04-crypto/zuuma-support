// backend/src/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Assistant } from '../assistants/entities/assistant.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true, default: 'free' })
  plan: string | null;

  @Column({ type: 'uuid', nullable: true })
  plan_id: string | null;

  @Column({ type: 'bigint', nullable: true, default: 0 })
  tokens_used: number;

  @Column({ type: 'bigint', nullable: true, default: 300000 })
  tokens_limit: number;

  @Column({ type: 'integer', nullable: true, default: 1 })
  assistants_limit: number;

  // ✅ OAuth поля
  @Column({ type: 'varchar', nullable: true, unique: true })
  google_id: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  github_id: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  telegram_id: string | null;

  // ✅ Дополнительные поля профиля
  @Column({ type: 'varchar', nullable: true })
  full_name: string | null;

  @Column({ type: 'text', nullable: true })
  avatar_url: string | null;

  @Column({ type: 'timestamp', nullable: true, default: () => 'now()' })
  created_at: Date | null;

  @Column({ type: 'timestamp', nullable: true, default: () => 'now()' })
  updated_at: Date | null;

  @Column({ type: 'boolean', nullable: true, default: false })
  has_support_manager: boolean | null;

  @Column({ type: 'boolean', nullable: true, default: true })
  escalation_enabled: boolean | null;

  // ✅ Связь с ассистентами
  @OneToMany(() => Assistant, (assistant) => assistant.user)
  assistants: Assistant[];
}