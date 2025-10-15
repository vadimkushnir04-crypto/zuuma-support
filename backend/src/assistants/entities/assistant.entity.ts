// backend/src/assistants/entities/assistant.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GlobalFunction } from './global-function.entity';
import { User } from '../../entities/user.entity';
import { AssistantBehaviorSettings } from '../services/prompt-builder.service';

export interface HumanImitationConfig {
  enabled: boolean;
  minReadDelay: number;
  maxReadDelay: number;
  charsPerSecond: number;
  randomPauses: boolean;
  pauseProbability: number;
  minPauseMs: number;
  maxPauseMs: number;
}

// Расширяем AssistantBehaviorSettings для совместимости
interface AssistantSettings extends AssistantBehaviorSettings {
  avatar?: string;
  humanImitation?: HumanImitationConfig;
}

@Entity('assistants')
export class Assistant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne(() => User, (user) => user.assistants, { 
    onDelete: 'CASCADE',
    nullable: true 
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'collectionName', unique: true })
  collectionName: string;

  @Column({ name: 'apiKey', unique: true })
  apiKey: string;

  @Column({ name: 'systemPrompt', type: 'text', nullable: true })
  systemPrompt?: string;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  trained: boolean;

  @Column({ type: 'simple-json', nullable: true })
  settings?: AssistantSettings;

  @Column({ name: 'totalQueries', type: 'int', default: 0 })
  totalQueries: number;

  @Column({ name: 'lastUsed', type: 'timestamp', nullable: true })
  lastUsed?: Date;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @ManyToMany(() => GlobalFunction, { cascade: true })
  @JoinTable({
    name: 'assistant_global_functions',
    joinColumn: { name: 'assistant_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'global_function_id', referencedColumnName: 'id' },
  })
  functions: GlobalFunction[];

  getHumanImitationConfig(): HumanImitationConfig {
    return this.settings?.humanImitation || {
      enabled: true,
      minReadDelay: 1500,
      maxReadDelay: 3500,
      charsPerSecond: 35,
      randomPauses: true,
      pauseProbability: 0.15,
      minPauseMs: 300,
      maxPauseMs: 1200,
    };
  }
}