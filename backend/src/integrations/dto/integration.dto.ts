// backend/src/integrations/dto/integration.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateTelegramBotDto {
  botName: string;
  botUsername?: string;
  description?: string;
  assistantId: string;
  creationMethod: 'auto' | 'manual';
  commands?: string[]; // базовое объявление
}

export class CreateAutoBotDto extends CreateTelegramBotDto {
  declare creationMethod: 'auto';  // ✅ declare вместо override
  declare botUsername: string;     // обязательно для auto
}

export class ConnectManualBotDto extends CreateTelegramBotDto {
  declare creationMethod: 'manual';
  
  @IsString()
  @IsNotEmpty()
  botToken: string;
  
}

export class TelegramAuthDto {
  phone: string;
}

export class TelegramCodeDto {
  phone: string;
  code: string;
}

export class IntegrationDto {
  id: string;
  name: string;
  type: 'telegram' | 'widget' | 'api' | 'whatsapp';
  assistant: string;
  status: 'active' | 'inactive' | 'pending' | 'creating';
  config?: any;
  created: string;
}
