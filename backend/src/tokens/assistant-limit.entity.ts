// backend/src/tokens/assistant-limit.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('assistant_limits')
export class AssistantLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  assistant_id: string;

  @Column({ type: 'bigint', nullable: true })
  max_tokens_per_month: string;

  @Column({ type: 'int', nullable: true })
  max_tokens_per_chat: number;

  @UpdateDateColumn()
  updated_at: Date;
}
