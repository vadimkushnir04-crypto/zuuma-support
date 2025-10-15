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
  @Post(':botToken')
  async handleWebhook(
    @Param('botToken') botToken: string,
    @Body() update: any,
  ) {
    console.log(`📨 Webhook received for bot: ${botToken.substring(0, 10)}...`);
    
    await this.webhookService.handleUpdate(botToken, update);
    
    return { ok: true };
  }
}