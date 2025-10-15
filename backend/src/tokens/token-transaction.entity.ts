import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('token_transactions')
export class TokenTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column()
  type: 'topup'|'consume'|'refund';

  @Column({ type: 'bigint' })
  amount: string;

  @Column({ type: 'uuid', nullable: true })
  assistant_id?: string;

  @Column({ type: 'jsonb', nullable: true })
  meta?: any;

  @CreateDateColumn()
  created_at: Date;
}
