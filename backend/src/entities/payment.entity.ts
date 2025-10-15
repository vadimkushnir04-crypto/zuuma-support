// backend/src/entities/payment.entity.ts
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
import { Subscription } from './subscription.entity';
import { Plan } from '../tokens/plan.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId?: string;

  @ManyToOne(() => Subscription)
  @JoinColumn({ name: 'subscription_id' })
  subscription?: Subscription;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  // ЮКасса данные
  @Column({ name: 'yookassa_payment_id', type: 'varchar', length: 255, unique: true, nullable: true })
  yookassaPaymentId?: string;

  @Column({ name: 'yookassa_status', type: 'varchar', length: 50, nullable: true })
  yookassaStatus?: string;

  // Суммы
  @Column({ name: 'amount_cents', type: 'bigint' })
  amountCents: number;

  @Column({ type: 'varchar', length: 3, default: 'RUB' })
  currency: string;

  // Возврат
  @Column({ type: 'boolean', default: false })
  refunded: boolean;

  @Column({ name: 'refund_amount_cents', type: 'bigint', default: 0 })
  refundAmountCents: number;

  @Column({ name: 'refunded_at', type: 'timestamp', nullable: true })
  refundedAt?: Date;

  @Column({ name: 'yookassa_refund_id', type: 'varchar', length: 255, nullable: true })
  yookassaRefundId?: string;

  // Метаданные
  @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
  paymentMethod?: string;

  @Column({ name: 'confirmation_url', type: 'text', nullable: true })
  confirmationUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}