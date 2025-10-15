import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { Integration } from './entities/integration.entity';
import { Assistant } from '../assistants/entities/assistant.entity';
import { TelegramModule } from '../telegram/telegram.module'; // ← импорт
import { AuthModule } from '../auth/auth.module';
import { TelegramBot } from '../telegram/entities/telegram-bot.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Integration, Assistant, TelegramBot]),
    forwardRef(() => TelegramModule), // ← добавьте это (forwardRef для избежания циклических зависимостей)
    CommonModule,
    AuthModule,
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}