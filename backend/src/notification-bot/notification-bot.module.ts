// backend/src/notification-bot/notification-bot.module.ts

import { Module } from '@nestjs/common';
import { NotificationBotService } from './notification-bot.service';

@Module({
  providers: [NotificationBotService],
  exports: [NotificationBotService],
})
export class NotificationBotModule {}