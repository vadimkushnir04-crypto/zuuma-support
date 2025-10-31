// backend/src/assistants/controllers/global-functions.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request as Req } from '@nestjs/common';
import { GlobalFunctionsService } from '../services/global-functions.service';
import { GlobalFunction } from '../entities/global-function.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('assistants/functions')
export class GlobalFunctionsController {
  constructor(
    private readonly globalFunctionsService: GlobalFunctionsService,
  ) {}

  // GET /functions/global - Получить все глобальные функции пользователя
  @Get('global')
  @UseGuards(JwtAuthGuard)
  async getAllFunctions(@Req() req: any) {
    try {
      const userId = req.user?.id;
      const functions = await this.globalFunctionsService.getAllFunctions(userId);
      return {
        success: true,
        data: functions,
        count: functions.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  // POST /functions/global - Создать новую глобальную функцию
  @Post('global')
  @UseGuards(JwtAuthGuard)
  async createFunction(@Req() req: any, @Body() functionData: Partial<GlobalFunction>) {
    try {
      const userId = req.user?.id;
      const newFunction = await this.globalFunctionsService.createFunction(userId, functionData);
      return {
        success: true,
        data: newFunction,
        message: 'Функция создана успешно',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // PUT /functions/global/:id - Обновить функцию
  @Put('global/:id')
  @UseGuards(JwtAuthGuard)
  async updateFunction(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updates: Partial<GlobalFunction>
  ) {
    try {
      const userId = req.user?.id;
      const updatedFunction = await this.globalFunctionsService.updateFunction(userId, id, updates);
      if (!updatedFunction) {
        return {
          success: false,
          error: 'Функция не найдена',
        };
      }
      return {
        success: true,
        data: updatedFunction,
        message: 'Функция обновлена успешно',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // DELETE /functions/global/:id - Удалить функцию
  @Delete('global/:id')
  @UseGuards(JwtAuthGuard)
  async deleteFunction(@Req() req: any, @Param('id') id: string) {
    try {
      const userId = req.user?.id;
      await this.globalFunctionsService.deleteFunction(userId, id);
      return {
        success: true,
        message: 'Функция удалена успешно',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // GET /functions/global/:id - Получить функцию по ID
  @Get('global/:id')
  @UseGuards(JwtAuthGuard)
  async getFunction(@Req() req: any, @Param('id') id: string) {
    try {
      const userId = req.user?.id;
      const func = await this.globalFunctionsService.getFunctionById(userId, id);
      if (!func) {
        return {
          success: false,
          error: 'Функция не найдена',
        };
      }
      return {
        success: true,
        data: func,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // POST /functions/global/:id/test - Тестировать функцию
  @Post('global/:id/test')
  @UseGuards(JwtAuthGuard)
  async testFunction(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { testParameters?: Record<string, any> }
  ) {
    try {
      const userId = req.user?.id;
      const result = await this.globalFunctionsService.testFunction(userId, id, body.testParameters);
      return {
        success: result.success,
        data: result.data,
        message: result.success ? 'Функция выполнена успешно' : 'Ошибка выполнения функции',
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Ошибка тестирования функции',
      };
    }
  }

  @Get('usage-stats')
  @UseGuards(JwtAuthGuard)
  async getUsageStats(@Req() req: any) {
    try {
      const userId = req.user?.id;
      const stats = await this.globalFunctionsService.getUsageStats(userId);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}