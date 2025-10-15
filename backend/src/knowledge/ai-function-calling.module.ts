// backend/src/knowledge/ai-function-calling.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AIFunctionCallingService } from './ai-function-calling.service';
import { AssistantsModule } from '../assistants/assistants.module';

@Module({
  imports: [forwardRef(() => AssistantsModule)],
  providers: [AIFunctionCallingService],
  exports: [AIFunctionCallingService],
})
export class AIFunctionCallingModule {}
