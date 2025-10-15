import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('token_balances')
export class TokenBalance {
  @PrimaryColumn('uuid')
  user_id: string;

  @Column({ type: 'bigint', default: 0 })
  total_tokens: string; // use string to store bigint safely

  @Column({ type: 'bigint', default: 0 })
  used_tokens: string;

  @UpdateDateColumn()
  updated_at: Date;
}
