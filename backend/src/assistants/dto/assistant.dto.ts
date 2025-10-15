// backend/src/assistants/dto/assistant.dto.ts

export class CreateAssistantDto {
  name: string;
  description?: string;
  trained?: boolean;
  systemPrompt?: string;
  isActive?: boolean;
  settings?: {
    temperature?: number;
    maxTokens?: number;
    maxHistoryMessages?: number;
    enableToxicityFilter?: boolean;
    allowSmallTalk?: boolean;
    searchLimit?: number;
    minSearchScore?: number;
    customGreeting?: string;
    fallbackMessage?: string;
    theme?: 'light' | 'dark' | 'auto';
    primaryColor?: string;
    avatar?: string;
  };
}

export class UpdateAssistantDto {
  name?: string;
  description?: string;
  systemPrompt?: string;
  isActive?: boolean;
  trained?: boolean;
  settings?: {
    temperature?: number;
    maxTokens?: number;
    maxHistoryMessages?: number;
    enableToxicityFilter?: boolean;
    allowSmallTalk?: boolean;
    searchLimit?: number;
    minSearchScore?: number;
    customGreeting?: string;
    fallbackMessage?: string;
    theme?: 'light' | 'dark' | 'auto';
    primaryColor?: string;
    avatar?: string;
  };
}

export class AssignFunctionDto {
  globalFunctionId: string;
}