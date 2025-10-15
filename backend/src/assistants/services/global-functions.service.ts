// backend/src/assistants/services/global-functions.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalFunction } from '../entities/global-function.entity';
import { Assistant } from '../entities/assistant.entity';

@Injectable()
export class GlobalFunctionsService {
  constructor(
    @InjectRepository(GlobalFunction)
    private functionsRepository: Repository<GlobalFunction>,
    @InjectRepository(Assistant)
    private assistantsRepository: Repository<Assistant>,
  ) {}

  // Получить все глобальные функции пользователя
  async getAllFunctions(userId?: string): Promise<GlobalFunction[]> {
    if (!userId) {
      return [];
    }
    
    return this.functionsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // Создать новую функцию для пользователя
  async createFunction(userId: string, functionData: Partial<GlobalFunction>): Promise<GlobalFunction> {
    const newFunction = this.functionsRepository.create({
      ...functionData,
      user_id: userId
    });
    return this.functionsRepository.save(newFunction);
  }

  // Обновить функцию (проверяем, что она принадлежит пользователю)
  async updateFunction(userId: string, id: string, updates: Partial<GlobalFunction>): Promise<GlobalFunction | null> {
    // Проверяем, что функция принадлежит пользователю
    const func = await this.functionsRepository.findOne({ 
      where: { id, user_id: userId } 
    });
    
    if (!func) {
      throw new Error('Функция не найдена или не принадлежит пользователю');
    }
    
    await this.functionsRepository.update(id, updates);
    return this.functionsRepository.findOne({ where: { id } });
  }

  // Удалить функцию (проверяем владельца)
  async deleteFunction(userId: string, id: string): Promise<void> {
    const func = await this.functionsRepository.findOne({ 
      where: { id, user_id: userId } 
    });
    
    if (!func) {
      throw new Error('Функция не найдена или не принадлежит пользователю');
    }
    
    await this.functionsRepository.delete(id);
  }

  // Получить функцию по ID (с проверкой владельца)
  async getFunctionById(userId: string, id: string): Promise<GlobalFunction | null> {
    return this.functionsRepository.findOne({ 
      where: { id, user_id: userId } 
    });
  }

  // Остальные методы остаются без изменений...
  async getAssistantFunctions(assistantId: string): Promise<GlobalFunction[]> {
    const assistant = await this.assistantsRepository.findOne({
      where: { id: assistantId },
      relations: ['functions'],
    });
    return assistant?.functions || [];
  }

  async assignFunctionToAssistant(assistantId: string, functionId: string): Promise<void> {
    const assistant = await this.assistantsRepository.findOne({
      where: { id: assistantId },
      relations: ['functions'],
    });
    
    const func = await this.functionsRepository.findOne({ where: { id: functionId } });
    
    if (!assistant || !func) {
      throw new Error('Ассистент или функция не найдены');
    }

    const alreadyAssigned = assistant.functions.some(f => f.id === functionId);
    if (!alreadyAssigned) {
      assistant.functions.push(func);
      await this.assistantsRepository.save(assistant);
    }
  }

  async removeFunctionFromAssistant(assistantId: string, functionId: string): Promise<void> {
    const assistant = await this.assistantsRepository.findOne({
      where: { id: assistantId },
      relations: ['functions'],
    });

    if (assistant) {
      assistant.functions = assistant.functions.filter(f => f.id !== functionId);
      await this.assistantsRepository.save(assistant);
    }
  }

  async executeFunction(functionId: string, parameters: Record<string, any>): Promise<any> {
    const func = await this.functionsRepository.findOne({ where: { id: functionId } });
    if (!func || !func.is_active) {
      throw new Error('Функция не найдена или неактивна');
    }

    let url = func.endpoint_url;
    Object.entries(parameters).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    });

    const requestOptions: RequestInit = {
      method: func.method,
      headers: {
        'Content-Type': 'application/json',
        ...func.headers,
      },
    };

    if (['POST', 'PUT', 'PATCH'].includes(func.method.toUpperCase())) {
      requestOptions.body = JSON.stringify(parameters);
    }

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async testFunction(userId: string, functionId: string, testParameters?: Record<string, any>): Promise<any> {
    const func = await this.getFunctionById(userId, functionId);
    if (!func) {
      throw new Error('Функция не найдена');
    }

    const params = testParameters || {};
    func.parameters.forEach(param => {
      if (!params[param.name]) {
        if (param.type === 'string') params[param.name] = param.defaultValue || 'test';
        else if (param.type === 'number') params[param.name] = Number(param.defaultValue) || 123;
        else if (param.type === 'boolean') params[param.name] = Boolean(param.defaultValue) || false;
      }
    });

    return this.executeFunction(functionId, params);
  }

  async getUsageStats(userId: string) {
    const query = `
      SELECT 
        gf.id as "functionId",
        COUNT(DISTINCT agf.assistant_id) as "usageCount"
      FROM global_functions gf
      LEFT JOIN assistant_global_functions agf ON agf.global_function_id = gf.id
      WHERE gf.user_id = $1
      GROUP BY gf.id
    `;

    const result = await this.functionsRepository.query(query, [userId]);
    
    return result.map((row: any) => ({
      functionId: row.functionId,
      usageCount: parseInt(row.usageCount) || 0,
    }));
  }
}