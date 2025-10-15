// backend/src/knowledge/ai-function-calling.service.ts
import { Injectable } from '@nestjs/common';
import { GlobalFunctionsService } from '../assistants/services/global-functions.service';
import { GlobalFunction } from '../assistants/entities/global-function.entity';
import { LLMService, ChatMessage } from '../common/llm.service';

interface FunctionCallResult {
  shouldCallFunction: boolean;
  functionToCall?: GlobalFunction;
  extractedParameters?: Record<string, any>;
  reasoning?: string;
}

@Injectable()
export class AIFunctionCallingService {
  constructor(
    private readonly globalFunctionsService: GlobalFunctionsService,
    private readonly llmService: LLMService, // ← Добавили!
  ) {}

  // Анализ запроса пользователя и определение нужно ли вызывать функцию
  async analyzeQueryForFunctionCall(
    query: string, 
    assistantId: string
  ): Promise<FunctionCallResult> {
    try {
      // Получаем активные функции ассистента через ManyToMany связь
      const availableFunctions = await this.globalFunctionsService.getAssistantFunctions(assistantId);
      
      if (availableFunctions.length === 0) {
        return { shouldCallFunction: false };
      }

      // Создаем промпт для анализа
      const functionCallPrompt = this.buildFunctionSelectionPrompt(query, availableFunctions);
      
      console.log('📋 Анализируем запрос на function calling:', {
        query,
        availableFunctions: availableFunctions.length,
        functions: availableFunctions.map(f => f.name)
      });

      // Отправляем запрос в AI для анализа
      const analysisResult = await this.queryAIForFunctionAnalysis(functionCallPrompt);
      
      // Парсим ответ AI
      return this.parseFunctionCallResponse(analysisResult, availableFunctions);
      
    } catch (error) {
      console.error('Ошибка анализа function calling:', error);
      return { shouldCallFunction: false };
    }
  }

  // Выполнение функции с извлеченными параметрами
  async executeFunctionCall(
    functionToCall: GlobalFunction,
    parameters: Record<string, any>
  ) {
    console.log(`🚀 Выполняем функцию "${functionToCall.name}" с параметрами:`, parameters);
    
    return await this.globalFunctionsService.executeFunction(functionToCall.id, parameters);
  }

  // Построение промпта для выбора функции
  private buildFunctionSelectionPrompt(query: string, functions: GlobalFunction[]): string {
    const functionsDescription = functions.map(func => {
      const paramsDesc = func.parameters.map(p => 
        `${p.name}: ${p.type} (${p.required ? 'обязательный' : 'опциональный'}) - ${p.description}`
      ).join(', ');

      return `{
  "name": "${func.name}",
  "description": "${func.description}",
  "parameters": [${paramsDesc}],
  "endpoint": "${func.endpoint_url}",
  "method": "${func.method}"
}`;
    }).join('\n\n');

    return `Ты - анализатор запросов пользователя для определения нужно ли вызывать внешнюю API функцию.

ДОСТУПНЫЕ ФУНКЦИИ:
${functionsDescription}

ЗАПРОС ПОЛЬЗОВАТЕЛЯ: "${query}"

ТВОЯ ЗАДАЧА:
1. Определи, нужно ли для ответа на запрос пользователя вызывать одну из доступных функций
2. Если да - выбери подходящую функцию и извлеки нужные параметры из запроса
3. Если нет - объясни почему

ФОРМАТ ОТВЕТА (строго JSON):
{
  "shouldCall": true/false,
  "functionName": "название_функции" или null,
  "parameters": {
    "param1": "значение1",
    "param2": "значение2"
  } или {},
  "reasoning": "объяснение решения"
}

ПРАВИЛА:
- Отвечай ТОЛЬКО в формате JSON
- Если функция нужна, но не хватает параметров, все равно верни shouldCall: true
- Если запрос об информации которую может дать функция - вызывай её
- Извлекай параметры из естественного языка (например "Москва" -> "city": "Moscow")

ОТВЕТ:`;
  }

  /**
   * ОБНОВЛЕНО: Теперь использует LLMService вместо прямых fetch
   */
  private async queryAIForFunctionAnalysis(prompt: string): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        {
          role: 'user',
          text: prompt,
        }
      ];

      // Используем LLMService с низкой температурой для предсказуемости
      const response = await this.llmService.chat(messages, {
        temperature: 0.1, // Низкая температура для более предсказуемого ответа
        maxTokens: 500,
        provider: 'yandexgpt',
        model: 'yandexgpt-lite', // Lite достаточно для анализа
      });

      console.log('✅ Function analysis response received');
      return response.content;

    } catch (error) {
      console.error('Ошибка запроса к AI для function calling:', error);
      throw error;
    }
  }

  // Парсинг ответа AI и определение функции для вызова
  private parseFunctionCallResponse(
    aiResponse: string, 
    availableFunctions: GlobalFunction[]
  ): FunctionCallResult {
    try {
      console.log('📄 Ответ AI на function calling:', aiResponse);
      
      // Пытаемся извлечь JSON из ответа
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { shouldCallFunction: false, reasoning: 'Не удалось распарсить ответ AI' };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.shouldCall) {
        return { 
          shouldCallFunction: false, 
          reasoning: parsed.reasoning || 'AI решил, что функция не нужна' 
        };
      }

      // Ищем функцию по имени
      const functionToCall = availableFunctions.find(f => f.name === parsed.functionName);
      if (!functionToCall) {
        return { 
          shouldCallFunction: false, 
          reasoning: `Функция "${parsed.functionName}" не найдена` 
        };
      }

      return {
        shouldCallFunction: true,
        functionToCall,
        extractedParameters: parsed.parameters || {},
        reasoning: parsed.reasoning
      };

    } catch (error) {
      console.error('Ошибка парсинга function call response:', error);
      return { 
        shouldCallFunction: false, 
        reasoning: `Ошибка парсинга: ${error.message}` 
      };
    }
  }

  /**
   * ОБНОВЛЕНО: Интеграция результата функции в ответ AI
   */
  async integrateFunctionResultIntoResponse(
    originalQuery: string,
    functionResult: any,
    functionName: string
  ): Promise<string> {
    const integrationPrompt = `Пользователь спросил: "${originalQuery}"

Я вызвал функцию "${functionName}" и получил результат:
${JSON.stringify(functionResult, null, 2)}

Сформулируй естественный, дружелюбный ответ пользователю на основе этих данных. 
Не упоминай технические детали о вызове функции, просто дай полезный ответ.

ОТВЕТ:`;

    try {
      const messages: ChatMessage[] = [
        {
          role: 'user',
          text: integrationPrompt,
        }
      ];

      const response = await this.llmService.chat(messages, {
        temperature: 0.7,
        maxTokens: 1000,
        provider: 'yandexgpt',
        model: 'yandexgpt-lite',
      });

      return response.content || 'Получен результат, но не удалось его обработать';

    } catch (error) {
      console.error('Ошибка интеграции результата функции:', error);
      return `Получены данные: ${JSON.stringify(functionResult, null, 2)}`;
    }
  }
}