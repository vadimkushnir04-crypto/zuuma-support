import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class FunctionsService {
  private readonly logger = new Logger(FunctionsService.name);

  private functions: Record<string, any[]> = {};

  getFunctions(assistantId: string) {
    this.logger.debug(`Запрос функций для ассистента: ${assistantId}`);
    return this.functions[assistantId] || [];
  }

  createFunction(assistantId: string, func: any) {
    this.logger.log(`Создание функции для ассистента ${assistantId}: ${func.name}`);
    const newFunc = { id: 'func_' + Date.now(), ...func };
    if (!this.functions[assistantId]) this.functions[assistantId] = [];
    this.functions[assistantId].push(newFunc);
    return newFunc;
  }

  updateFunction(assistantId: string, functionId: string, body: any) {
    this.logger.warn(`Обновление функции ${functionId} у ассистента ${assistantId}`);
    const funcs = this.functions[assistantId] || [];
    const index = funcs.findIndex((f) => f.id === functionId);
    if (index >= 0) {
      funcs[index] = { ...funcs[index], ...body };
      return funcs[index];
    }
    return null;
  }

  deleteFunction(assistantId: string, functionId: string) {
    const funcs = this.functions[assistantId] || [];
    const before = funcs.length;

    this.functions[assistantId] = funcs.filter((f) => f.id !== functionId);

    const after = this.functions[assistantId].length;

    if (before === after) {
      this.logger.warn(`Функция ${functionId} для ассистента ${assistantId} не найдена при удалении`);
    } else {
      this.logger.log(`Функция ${functionId} для ассистента ${assistantId} удалена`);
    }
  }

  async testFunction(assistantId: string, functionId: string, body: any) {
    this.logger.debug(`Тест функции ${functionId} ассистента ${assistantId} с параметрами: ${JSON.stringify(body)}`);

    const { testParameters } = body;
    const func = (this.functions[assistantId] || []).find((f) => f.id === functionId);
    if (!func) {
      this.logger.error(`Функция ${functionId} не найдена!`);
      return { success: false, message: 'Функция не найдена' };
    }

    let url = func.endpoint_url;
    for (const [key, value] of Object.entries(testParameters)) {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    }

    this.logger.log(`Вызов внешнего API: ${url}`);

    try {
      const response = await fetch(url, { method: func.method });
      const data = await response.json();
      this.logger.debug(`Ответ API: ${JSON.stringify(data).slice(0, 200)}...`);
      return { success: true, data, message: 'Функция выполнена успешно' };
    } catch (error) {
      this.logger.error(`Ошибка вызова API: ${error.message}`);
      return { success: false, message: 'Ошибка при вызове API: ' + error.message };
    }
  }
}
