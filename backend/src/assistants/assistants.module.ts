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
import { FilesController, FileServeController } from './files.controller'; // ✅ Добавили FileServeController
import { Assistant } from './entities/assistant.entity';
import { GlobalFunction } from './entities/global-function.entity';
import { AuthModule } from '../auth/auth.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assistant, GlobalFunction]),
    AuthModule,
    forwardRef(() => KnowledgeModule),
  ],
  controllers: [
    AssistantsController,
    FunctionsController,
    GlobalFunctionsController,
    FilesController,
    FileServeController, // ✅ Добавили контроллер для раздачи файлов
  ],
  providers: [
    AssistantsService,
    FunctionsService,
    GlobalFunctionsService,
    PromptBuilderService,
  ],
  exports: [
    AssistantsService,
    GlobalFunctionsService,
    PromptBuilderService,
  ],
})
export class AssistantsModule {}