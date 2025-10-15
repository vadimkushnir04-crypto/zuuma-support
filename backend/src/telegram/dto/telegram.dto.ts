// backend/src/telegram/dto/telegram.dto.ts
import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CreateTelegramBotDto {
  @IsString()
  @IsNotEmpty()
  botToken: string;

  @IsString()
  @IsNotEmpty()
  botName: string;

  @IsString()
  @IsNotEmpty()
  assistantId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  commands?: string[];

  @IsString()
  @IsNotEmpty()
  creationMethod: 'manual';  // 🔑 обязательно, чтобы совпадало с фронтом

  @IsString()
  @IsOptional()
  integrationId?: string;
}

export class UpdateTelegramBotDto {
  @IsString()
  @IsOptional()
  botName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  commands?: string[];
}
