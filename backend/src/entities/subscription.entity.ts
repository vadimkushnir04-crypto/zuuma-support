// backend/src/entities/subscription.entity.ts
// ✅ ИСПРАВЛЕНО: Правильный порядок полей + добавлен 'payment_failed'

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Plan } from '../tokens/plan.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  // ✅ ИСПРАВЛЕНО: Добавлен 'payment_failed' в union type
  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'active' 
  })
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'payment_failed';

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'can_refund', type: 'boolean', default: true })
  canRefund: boolean;

  @Column({ name: 'refund_deadline', type: 'timestamp', nullable: true })
  refundDeadline?: Date;

  @Column({ name: 'auto_renew', type: 'boolean', default: true })
  autoRenew: boolean;

  // ✅ ПРАВИЛЬНЫЙ ПОРЯДОК: Поля рекуррентных платежей ПЕРЕД @CreateDateColumn
  @Column({ name: 'payment_method_id', type: 'varchar', length: 255, nullable: true })
  paymentMethodId?: string;

  @Column({ name: 'next_billing_date', type: 'timestamp', nullable: true })
  nextBillingDate?: Date;

  @Column({ name: 'last_payment_attempt', type: 'timestamp', nullable: true })
  lastPaymentAttempt?: Date;

  @Column({ name: 'failed_payments_count', type: 'int', default: 0 })
  failedPaymentsCount: number;

  // ✅ Декораторы создания/обновления В КОНЦЕ
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}