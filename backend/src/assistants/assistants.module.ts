// backend/src/assistants/assistants.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssistantsController } from './assistants.controller';
import { AssistantsService } from './assistants.service';

import { FunctionsController } from './functions.controller';
import { FunctionsService } from './functions.service';

import { GlobalFunctionsController } from './controllers/global-functions.controller';
import { GlobalFunctionsService } from './services/global-functions.service';

import { PromptBuilderService } from './services/prompt-builder.service';
import { FilesController, FileServeController } from './files.controller';

import { Assistant } from './entities/assistant.entity';
import { GlobalFunction } from './entities/global-function.entity';
import { User } from '../entities/user.entity';

import { AuthModule } from '../auth/auth.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [
    // Объединяем в один вызов TypeOrmModule.forFeature
    TypeOrmModule.forFeature([Assistant, GlobalFunction, User]),

    AuthModule,
    forwardRef(() => KnowledgeModule),
  ],

  controllers: [
    AssistantsController,
    FunctionsController,
    GlobalFunctionsController,
    FilesController,
    FileServeController,
  ],

  providers: [
    AssistantsService,
    FunctionsService,
    GlobalFunctionsService,
    PromptBuilderService,
  ],

  // ❗ Экспортируем TypeOrmModule, чтобы ChatModule смог использовать @InjectRepository(Assistant)
  exports: [
    AssistantsService,
    GlobalFunctionsService,
    PromptBuilderService,
    TypeOrmModule, // ← главное исправление
  ],
})
export class AssistantsModule {}
