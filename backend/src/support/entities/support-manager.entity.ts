// backend/src/support/entities/support-manager.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('support_managers')
@Index(['companyId', 'active'])
export class SupportManager {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  @Index()
  companyId: string; // связь с user.company_id

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: ['viewer', 'responder'],
    default: 'responder',
  })
  role: 'viewer' | 'responder'; // viewer - только смотрит, responder - может отвечать

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'created_by_user_id' })
  createdByUserId: string; // кто создал этого менеджера

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}