// backend/src/tokens/plan.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ type: 'bigint' })
  monthly_tokens: string;

  @Column({ type: 'int', nullable: true })
  tokens_per_chat: number;

  @Column({ type: 'bigint', default: 0 })
  price_cents: string;

  @CreateDateColumn()
  created_at: Date;
}
