// backend/src/assistants/functions.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { FunctionsService } from './functions.service';

@Controller('assistants/:assistantId/functions')
export class FunctionsController {
  constructor(private readonly functionsService: FunctionsService) {}

  @Get()
  getFunctions(@Param('assistantId') assistantId: string) {
    return { success: true, data: this.functionsService.getFunctions(assistantId) };
  }

  @Post()
  createFunction(@Param('assistantId') assistantId: string, @Body() body: any) {
    return { success: true, data: this.functionsService.createFunction(assistantId, body) };
  }

  @Put(':functionId')
  updateFunction(
    @Param('assistantId') assistantId: string,
    @Param('functionId') functionId: string,
    @Body() body: any,
  ) {
    return { success: true, data: this.functionsService.updateFunction(assistantId, functionId, body) };
  }

  @Delete(':functionId')
  deleteFunction(@Param('assistantId') assistantId: string, @Param('functionId') functionId: string) {
    this.functionsService.deleteFunction(assistantId, functionId);
    return { success: true };
  }

  @Post(':functionId/test')
  async testFunction(
    @Param('assistantId') assistantId: string,
    @Param('functionId') functionId: string,
    @Body() body: any,
  ) {
    const result = await this.functionsService.testFunction(assistantId, functionId, body);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }
}
