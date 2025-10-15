// backend/src/support/dto/support.dto.ts
import { IsNotEmpty } from 'class-validator';

export class EscalateChatDto {
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  chatSessionId?: string;
}

export class CreateManagerDto {
  email: string;
  name: string;
  password: string;
  role?: 'viewer' | 'responder';
}

export class SendMessageDto {
  @IsNotEmpty({ message: 'Content не может быть пустым' })
  content: string;
}

export class AssignManagerDto {
  chatSessionId: string;
  managerId: string;
}

export class ResolveChatDto {
  chatSessionId: string;
  resolution?: string;
}

export class ChatFilterDto {
  status?: 'ai' | 'pending_human' | 'human_active' | 'resolved';
  assistantId?: string;
  managerId?: string;
  integrationType?: string;
  limit?: number;
  offset?: number;
}