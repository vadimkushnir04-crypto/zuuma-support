// backend/src/assistants/entities/global-function.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface FunctionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description: string;
  defaultValue?: string;
}

@Entity('global_functions')
export class GlobalFunction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 500 })
  endpoint_url: string;

  @Column({ type: 'varchar', length: 10, default: 'GET' })
  method: string;

  @Column({ type: 'simple-json', default: '{}' })
  headers: Record<string, string>;

  @Column({ type: 'simple-json', default: '[]' })
  parameters: FunctionParameter[];

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // Добавляем user_id для привязки к пользователю
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  user_id?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}