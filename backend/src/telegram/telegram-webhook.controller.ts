// backend/src/telegram/telegram-webhook.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { TelegramWebhookService } from './telegram-webhook.service';

@Controller('telegram/webhook')
export class TelegramWebhookController {
  constructor(
    private readonly webhookService: TelegramWebhookService,
  ) {}

  // ✅ Webhook endpoint для каждого бота
  @Post(':botId')
  async handleWebhook(
    @Param('botId') botId: string,
    @Body() update: any,
  ) {
    console.log(`📨 Webhook received for bot ID: ${botId}`);
    console.log(`📦 Update data:`, JSON.stringify(update, null, 2));
    
    await this.webhookService.handleUpdate(botId, update);
    
    return { ok: true };
  }

  
}