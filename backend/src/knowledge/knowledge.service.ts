// backend/src/knowledge/knowledge.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { LLMService, ChatMessage as LLMMessage } from '../common/llm.service';
import { SupportBotConfig, SupportBotUtils } from './support-bot.config';
import { 
  SearchResult, 
  KnowledgeUploadResult, 
  GenerateAnswerResult, 
  KnowledgeStats,
  DocumentSearchResult,
  ConversationMessage
} from './knowledge.types';
import { v4 as uuidv4 } from 'uuid';
import { GlobalFunctionsService } from '../assistants/services/global-functions.service';
import { AIFunctionCallingService } from './ai-function-calling.service';
import { AnswerCacheService } from './answer-cache.service';
import { ESCALATION_TOOL, ESCALATION_SYSTEM_PROMPT } from '../support/escalation-tools';
import { FileProcessingService } from './file-processing.service';
import { FileUploadResult } from './knowledge.types';
import { CannedResponsesService } from './canned-responses.service';

import * as path from 'path';
import { promises as fsPromises } from 'fs';

import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TokensService } from '../tokens/tokens.service';
import { Assistant } from '../assistants/entities/assistant.entity';

import { EmailService } from '../common/email.service';
import { User } from '../entities/user.entity';


@Injectable()
export class KnowledgeService {
  private qdrant: QdrantClient;

constructor(
  private readonly embeddings: EmbeddingsService,
  private readonly globalFunctionsService: GlobalFunctionsService,
  private readonly aiFunctionService: AIFunctionCallingService,
  private readonly answerCache: AnswerCacheService,
  private emailService: EmailService,
  private readonly fileProcessingService: FileProcessingService,
  private readonly llmService: LLMService,
  private readonly cannedResponsesService: CannedResponsesService,
  @InjectDataSource() private readonly dataSource: DataSource, // ✅ ДОБАВИТЬ
  private readonly tokensService: TokensService, // ✅ ДОБАВИТЬ
) {
  this.qdrant = new QdrantClient({
    url: process.env.QDRANT_URL || 'http://localhost:6333',
  });
}

  /**
   * УНИВЕРСАЛЬНЫЙ метод для общения с LLM (с поддержкой эскалации через промпт)
   */
    private async queryAIWithHistory(
      messages: ConversationMessage[],
      enableFunctionCalling: boolean = false
    ): Promise<{ 
      content: string; 
      functionCall?: any;
      tokensUsed?: { prompt: number; completion: number; total: number }; // ✅ ДОБАВЛЕНО
    }> {
      console.log('🤖 === LLM REQUEST ===');
      console.log('Messages:', messages.length);
      console.log('Query:', messages[messages.length - 1].content);
      console.log('Function calling enabled:', enableFunctionCalling);

      // ============================================
      // 🎯 ПРОМПТ-ИНЖИНИРИНГ ДЛЯ FUNCTION CALLING
      // ============================================
      
      let llmMessages: LLMMessage[] = messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        text: msg.content,
      }));

      if (enableFunctionCalling) {
        console.log('🔧 Function calling enabled - adding structured output instructions');
        
        const systemMessageIndex = llmMessages.findIndex(m => m.role === 'system');
        
        const functionInstructions = `

    ВАЖНЫЕ ИНСТРУКЦИИ ПО ЭСКАЛАЦИИ:
    ================================

    Если пользователь просит связаться с живым оператором, переключиться на менеджера, поговорить с человеком или выражает сильное недовольство - ты ДОЛЖЕН вернуть специальный маркер эскалации.

    Признаки что нужна эскалация:
    - Явная просьба: "переведите на оператора", "хочу с человеком", "менеджера позовите"
    - Повторяющиеся проблемы: пользователь уже несколько раз жалуется
    - Сильное недовольство: ругается, угрожает отказом от услуг
    - Сложный вопрос: выходит за рамки твоих возможностей

    КАК ОТВЕТИТЬ ПРИ ЭСКАЛАЦИИ:
    1. Начни ответ с маркера: "🚨ESCALATION_DETECTED🚨"
    2. Затем напиши краткий текст для пользователя: "Передаю ваш запрос специалисту. Пожалуйста, ожидайте."
    3. Больше НИЧЕГО не добавляй!

    ПРИМЕР ПРАВИЛЬНОГО ОТВЕТА:
    🚨ESCALATION_DETECTED🚨 Передаю ваш запрос специалисту поддержки. Сейчас с вами свяжется менеджер.

    ПРИМЕР НЕПРАВИЛЬНОГО ОТВЕТА (НЕ ДЕЛАЙ ТАК!):
    Конечно, сейчас я вас переключу... [НЕПРАВИЛЬНО - нет маркера!]

    Если эскалация НЕ нужна - отвечай как обычно, БЕЗ маркера.
    `;

        if (systemMessageIndex >= 0) {
          llmMessages[systemMessageIndex].text += functionInstructions;
        } else {
          llmMessages = [
            { role: 'system', text: functionInstructions },
            ...llmMessages
          ];
        }
      }

      // ============================================
      // ✅ ЗАПРОС К LLM (ОДИН ПРОВАЙДЕР - YANDEXGPT)
      // ============================================

      try {
        // Используем LLMService с YandexGPT
        const response = await this.llmService.chat(llmMessages, {
          temperature: 0.7,
          maxTokens: 2000,
          provider: 'yandexgpt',
          model: 'yandexgpt-lite',
        });

        console.log('✅ LLM Response received');
        
        // ✅ КРИТИЧНО: Логируем и сохраняем токены
        if (response.tokensUsed) {
          console.log('📊 Tokens used:', response.tokensUsed);
        } else {
          console.warn('⚠️ No tokensUsed in response!');
        }

        const content = response.content;

        // ============================================
        // 🔍 ПАРСИНГ ОТВЕТА НА ЭСКАЛАЦИЮ
        // ============================================

        if (enableFunctionCalling && content.includes('🚨ESCALATION_DETECTED🚨')) {
          console.log('🚨 Escalation marker detected in response!');
          
          const parts = content.split('🚨ESCALATION_DETECTED🚨');
          const userMessage = parts[1]?.trim() || 'Передаю ваш запрос специалисту поддержки.';
          
          const userQuery = messages[messages.length - 1]?.content || '';
          
          return {
            content: userMessage,
            tokensUsed: response.tokensUsed, // ✅ Возвращаем токены!
            functionCall: {
              name: 'escalate_to_human',
              arguments: {
                reason: 'Пользователь запросил связь с оператором',
                user_message: userQuery.substring(0, 200),
                timestamp: new Date().toISOString(),
              }
            }
          };
        }

        // Обычный ответ без эскалации
        return { 
          content,
          tokensUsed: response.tokensUsed // ✅ Возвращаем токены!
        };

      } catch (error) {
        console.error('❌ LLM Service error:', error);
        throw new Error(`Не удалось получить ответ от LLM: ${error.message}`);
      }
    }

async generateAnswer(
    query: string,
    collectionName: string,
    systemPrompt?: string,
    conversationHistory?: ConversationMessage[],
    toxicCount: number = 0,
    assistantId?: string
  ): Promise<GenerateAnswerResult> {
    try {
      console.log(`🔍 Query: "${query}"`);
      console.log(`📦 Collection: ${collectionName}`);

      // ============================================
      // ⚡ БЫСТРЫЕ ЗАГОТОВЛЕННЫЕ ОТВЕТЫ
      // ============================================

      const hasShortHistory = !conversationHistory || conversationHistory.length <= 2;
      
      if (hasShortHistory) {
        const cannedResponse = this.cannedResponsesService.getCannedResponse(
          query, 
          conversationHistory
        );
        
        if (cannedResponse) {
          console.log('⚡ Using canned response');
          
          // ============================================
          // ✅ НОВОЕ: Списываем 5 токенов за canned response
          // ============================================
          
          const CANNED_TOKENS = 5; // Минимальная плата за обработку
          
          if (assistantId) {
            try {
              const assistant = await this.dataSource
                .getRepository('Assistant')
                .findOne({ where: { id: assistantId }, relations: ['user'] });

              if (assistant?.user?.id) {
                await this.tokensService.consumeTokens(
                  assistant.user.id,
                  CANNED_TOKENS,
                  assistantId,
                  {
                    question: query.substring(0, 100),
                    type: 'canned_response',
                    promptTokens: 0,
                    completionTokens: 0,
                    totalTokens: CANNED_TOKENS,
                  }
                );
                
                console.log(`💰 Canned response: charged ${CANNED_TOKENS} tokens`);
              }
            } catch (error) {
              console.error('❌ Token consumption error (canned):', error.message);
              // Не блокируем ответ если не удалось списать токены
            }
          }
          
          return {
            answer: cannedResponse,
            hasContext: false,
            sources: 0,
            fromCannedResponses: true,
            cannedTokensCharged: CANNED_TOKENS, // ✅ Для логирования
            tokensCharged: CANNED_TOKENS,
          };
        }
      }

    // ============================================
    // 💾 УМНАЯ ПРОВЕРКА КЭША ОТВЕТОВ
    // ============================================

    // ✅ ИСПРАВЛЕНО: Проверяем что история ДЕЙСТВИТЕЛЬНО пустая
    const hasRealHistory = conversationHistory && conversationHistory.length > 0;
    
    if (assistantId && !hasRealHistory) {
      // Используем кэш только если НЕТ истории
      const cachedAnswer = this.answerCache.getCachedAnswer(query, assistantId);
      if (cachedAnswer) {
        console.log('✅ Returning cached answer');
        return { ...cachedAnswer, fromCache: true };
      }
      console.log('❌ Cache miss - generating new answer');
    } else if (hasRealHistory) {
      console.log('⚠️ Skipping cache due to conversation context');
    }

    // Проверка токсичности
    if (SupportBotUtils.containsToxicContent(query)) {
      const cannedResponse = SupportBotUtils.getToxicResponse(toxicCount);
      if (cannedResponse) {
        return { ...cannedResponse, isToxic: true, toxicCount: toxicCount + 1 };
      }
    }
    
    // Проверка запрещённого контента
    if (SupportBotUtils.containsRestrictedContent(query)) {
      return {
        answer: "Извините, я не могу помочь с этим вопросом. Чем ещё могу быть полезен?",
        hasContext: false,
        sources: 0,
      };
    }

    // Поиск релевантного контекста
    const searchResults = await this.searchSimilar(query, collectionName, 10);
    console.log(`📚 Found ${searchResults.length} documents`);
    
    // Определяем релевантность
    const topScore = searchResults[0]?.score || 0;
    const isRelevant = SupportBotUtils.isQueryRelevant(topScore);
    const hasGoodContext = SupportBotUtils.hasGoodContext(topScore);
    
    console.log(`📊 Top score: ${topScore.toFixed(3)} | Relevant: ${isRelevant} | Good: ${hasGoodContext}`);

    // Формируем контекст и определяем стратегию ответа
    let contextText = '';
    let finalSystemPrompt = '';
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Хороший ли контекст?
    if (searchResults.length > 0 && hasGoodContext) {
      contextText = searchResults.map(r => r.payload.text).join('\n\n');
      const truncatedContext = SupportBotUtils.truncateContext(contextText);
      
      if (SupportBotUtils.isSmallTalk(query)) {
        finalSystemPrompt = SupportBotConfig.systemPrompts.smallTalk;
      } else if (SupportBotUtils.isNegativeTone(query)) {
        finalSystemPrompt = SupportBotUtils.formatSystemPrompt(
          SupportBotConfig.systemPrompts.negative,
          truncatedContext
        );
      } else {
        finalSystemPrompt = SupportBotUtils.formatSystemPrompt(
          systemPrompt || SupportBotConfig.systemPrompts.standard,
          truncatedContext
        );
      }
      
      console.log(`✅ Good context found (score: ${topScore.toFixed(3)})`);
    } else if (searchResults.length > 0 && isRelevant && !hasGoodContext) {
      contextText = searchResults.map(r => r.payload.text).join('\n\n');
      const truncatedContext = SupportBotUtils.truncateContext(contextText);
      
      finalSystemPrompt = SupportBotUtils.formatSystemPrompt(
        systemPrompt || SupportBotConfig.systemPrompts.standard,
        truncatedContext
      );
      
      console.log(`⚠️ Weak context (score: ${topScore.toFixed(3)}) - letting LLM decide`);
    } else {
      if (SupportBotUtils.isSmallTalk(query)) {
        finalSystemPrompt = SupportBotConfig.systemPrompts.smallTalk;
        console.log(`💬 Small talk detected`);
      } else {
        finalSystemPrompt = SupportBotConfig.systemPrompts.noContext;
        console.log(`🚫 No relevant context (score: ${topScore.toFixed(3)}) - out of scope`);
      }
    }

    // ============================================
    // 🚨 ДОБАВЛЕНИЕ ESCALATION PROMPT
    // ============================================
    
    if (assistantId) {
      const { ESCALATION_SYSTEM_PROMPT } = await import('../support/escalation-tools.js');
      finalSystemPrompt = finalSystemPrompt + '\n\n' + ESCALATION_SYSTEM_PROMPT;
      console.log('🚨 Escalation prompt added');
    }

    // Формируем историю сообщений
    const messages: ConversationMessage[] = [
      { role: 'system', content: finalSystemPrompt },
      ...(conversationHistory?.slice(-SupportBotConfig.behavior.maxHistoryMessages).filter(m => m.role !== 'system') || []),
      { role: 'user', content: query }
    ];

      // ============================================
      // 🔧 FUNCTION CALLING
      // ============================================
      
      if (assistantId) {
        console.log('🔧 Function calling check:', {
          assistantId,
          isRelevant,
          hasContext: searchResults.length > 0
        });
        
        try {
          console.log('🔧 Starting function analysis...');
          
          const functionCallAnalysis = await this.aiFunctionService.analyzeQueryForFunctionCall(
            query, 
            assistantId
          );
          
          console.log('🔧 Function analysis result:', {
            shouldCall: functionCallAnalysis.shouldCallFunction,
            functionName: functionCallAnalysis.functionToCall?.name,
            hasParameters: !!functionCallAnalysis.extractedParameters,
            reasoning: functionCallAnalysis.reasoning
          });

          if (functionCallAnalysis.shouldCallFunction && functionCallAnalysis.functionToCall) {
            console.log(`🚀 Executing function: ${functionCallAnalysis.functionToCall.name}`);
            console.log(`📋 Parameters:`, functionCallAnalysis.extractedParameters);
            
            const result = await this.aiFunctionService.executeFunctionCall(
              functionCallAnalysis.functionToCall,
              functionCallAnalysis.extractedParameters || {}
            );
            
            console.log(`✅ Function result:`, result);

            const integratedAnswer = await this.aiFunctionService.integrateFunctionResultIntoResponse(
              query,
              result,
              functionCallAnalysis.functionToCall.name
            );
            
            console.log(`✅ Integrated answer ready`);

            return {
              answer: integratedAnswer,
              hasContext: true,
              sources: searchResults.length,
              functionCalled: functionCallAnalysis.functionToCall.name,
              functionResult: result,
              searchResults: searchResults.slice(0, 3).map(r => ({
                text: r.payload.text.substring(0, 200) + '...',
                score: Math.round(r.score * 100) / 100,
                title: r.payload.title ?? 'Документ',
                chunkIndex: r.payload.chunkIndex,
              }))
            };
          } else {
            console.log('❌ Function calling skipped:', functionCallAnalysis.reasoning);
          }
          
        } catch (error) {
          console.error('❌ Function calling error:', error);
          console.error('Stack:', error.stack);
        }
      } else {
        console.log('⚠️ Function calling disabled: no assistantId');
      }

    // ============================================
    // 🤖 ГЕНЕРАЦИЯ ОТВЕТА ЧЕРЕЗ LLM
    // ============================================
    
    console.log('💬 Generating answer...');
    
    const isFileRequest = /файл|картинк|изображени|фото|лого|logo|pdf|document|picture|image/i.test(query);
    
    if (isFileRequest) {
      console.log('📎 File request detected - escalation disabled');
    }
    
    const enableEscalation = !!assistantId && !isFileRequest;
    
    const llmResponse = await this.queryAIWithHistory(messages, enableEscalation);
    
    // ============================================
    // 📊 ПРАВИЛЬНЫЙ ПОДСЧЕТ ТОКЕНОВ
    // ============================================
    
    const tokensUsed = llmResponse.tokensUsed || { prompt: 0, completion: 0, total: 0 };
    
    const promptTokens = typeof tokensUsed.prompt === 'string' 
      ? parseInt(tokensUsed.prompt, 10) 
      : tokensUsed.prompt;
    
    const completionTokens = typeof tokensUsed.completion === 'string' 
      ? parseInt(tokensUsed.completion, 10) 
      : tokensUsed.completion;
    
    const totalTokens = typeof tokensUsed.total === 'string' 
      ? parseInt(tokensUsed.total, 10) 
      : tokensUsed.total;
    
    console.log('📊 Tokens used (parsed):', {
      prompt: promptTokens,
      completion: completionTokens,
      total: totalTokens
    });

    // ============================================
    // 🧹 ОЧИСТКА ОТВЕТА
    // ============================================
    
    let cleanedAnswer = llmResponse.content || '';
    
    const functionCallMatch = cleanedAnswer.match(/<function_call>([\s\S]*?)<\/function_call>/);
    if (functionCallMatch) {
      cleanedAnswer = cleanedAnswer.replace(functionCallMatch[0], '').trim();
    }
    
    cleanedAnswer = cleanedAnswer.replace(/<\|[^|]+\|>[^<]*<\|[^|]+\|>[^{]*\{[^}]*\}/g, '');
    cleanedAnswer = cleanedAnswer.replace(/<\|[^|]+\|>/g, '');
    cleanedAnswer = cleanedAnswer.trim();
    
    console.log('🧹 Cleaned LLM response');

    // 🚫 Удаляем фразы, где бот предлагает "обратиться в поддержку"
    cleanedAnswer = cleanedAnswer
      .replace(
        /\b(пожалуйста[, ]+)?(свяжитесь|обратитесь|напишите|перезвоните|оставьте\s+заявку)\b[^.!?]*?(поддержк|служб|менедж|оператор|почт|email|support)/gi,
        ''
      )
      .replace(
        /\b(позвоните|пишите|обращайтесь)\b[^.!?]*?(поддержк|служб|менедж|оператор|почт|email|support)/gi,
        ''
      )
      .replace(/\s{2,}/g, ' ') // убираем двойные пробелы
      .trim();

    if (cleanedAnswer.length === 0) {
      cleanedAnswer = "Понимаю вашу ситуацию. 😊 Давайте разберёмся, как можно помочь.";
    }

    console.log('🚫 Support-phrases filtered');
    
      // ============================================
      // 💰 СПИСАНИЕ ТОКЕНОВ (ОДИН РАЗ!)
      // ============================================

      if (assistantId) {
        try {
          const assistant = await this.dataSource
            .getRepository('Assistant')
            .findOne({ where: { id: assistantId }, relations: ['user'] });

          if (assistant?.user?.id) {
            const embeddingTokens = Math.ceil(query.length / 4);
            const totalTokensToCharge = totalTokens + embeddingTokens;
            
            console.log('💰 Token calculation:', {
              llmTokens: totalTokens,
              embeddingTokens: embeddingTokens,
              totalToCharge: totalTokensToCharge
            });
            
            await this.tokensService.consumeTokens(
              assistant.user.id,
              totalTokensToCharge,
              assistantId,
              {
                question: query.substring(0, 100),
                promptTokens: promptTokens,
                completionTokens: completionTokens,
                embeddingTokens: embeddingTokens,
                totalTokens: totalTokensToCharge,
                hasContext: isRelevant,
              }
            );
            
            console.log(`✅ Charged ${totalTokensToCharge} tokens successfully`);

            // ============================================
            // 📧 ПРОВЕРКА И ОТПРАВКА EMAIL О НИЗКОМ БАЛАНСЕ
            // ============================================
            
            // Получаем актуальный баланс после списания
            const user = assistant.user;
            const tokensLimit = Number(user.tokens_limit || 0);
            const tokensUsed = Number(user.tokens_used || 0);
            const remaining = tokensLimit - tokensUsed;
            const percentLeft = (remaining / tokensLimit) * 100;

            if (percentLeft <= 10 && !user.low_tokens_email_sent) {
              try {
                await this.emailService.sendLowTokensWarning(
                  user.email,
                  remaining,
                  tokensLimit,
                  'threshold'  // ← Добавьте эту строку
                );
                console.log(`📧 Low tokens warning sent to: ${user.email}`);
                user.low_tokens_email_sent = true;
                await this.dataSource.getRepository(User).save(user);
              } catch (emailError) {
                console.error('❌ Failed to send low tokens email:', emailError.message);
              }
            }
          }
            } catch (error) {
              console.error('❌ Token consumption error:', error.message);

              if (error.message === 'Недостаточно токенов') {
                try {
                  // Получаем user заново (так как assistant недоступен в catch)
                  const assistant = await this.dataSource
                    .getRepository('Assistant')
                    .findOne({ where: { id: assistantId }, relations: ['user'] });

                  if (!assistant?.user) {
                    console.warn('User not found for assistantId:', assistantId);
                    throw error;
                  }

                  const user = assistant.user;
                  const tokensLimit = Number(user.tokens_limit || 0);
                  const tokensUsed = Number(user.tokens_used || 0);
                  const remaining = tokensLimit - tokensUsed;

                  await this.emailService.sendLowTokensWarning(
                    user.email,
                    remaining,
                    tokensLimit,
                    'error' // добавляем тип триггера
                  );
                  console.log(`📧 Low tokens alert sent on error to: ${user.email}`);
                } catch (emailError) {
                  console.error('❌ Failed to send error-triggered email:', emailError.message);
                }

                throw new BadRequestException({
                  success: false,
                  error: 'Недостаточно токенов. Пожалуйста, пополните баланс.',
                  type: 'INSUFFICIENT_TOKENS'
                });
              }
              throw error;
            }
      }
    
    // ============================================
    // 🚨 ПРОВЕРКА НА ЭСКАЛАЦИЮ
    // ============================================

    if (llmResponse.functionCall && llmResponse.functionCall.name === 'escalate_to_human') {
      console.log('🚨 Escalation detected!', llmResponse.functionCall.arguments);
      
      return {
        answer: cleanedAnswer,
        hasContext: true,
        sources: searchResults.length,
        functionCalled: 'escalate_to_human',
        functionArgs: llmResponse.functionCall.arguments,
        tokensCharged: assistantId ? (totalTokens + Math.ceil(query.length / 4)) : 0,
        searchResults: searchResults.slice(0, 3).map(r => ({
          text: r.payload.text.substring(0, 200) + '...',
          score: Math.round(r.score * 100) / 100,
          title: r.payload.title ?? 'Документ',
          chunkIndex: r.payload.chunkIndex,
        }))
      };
    }

    // ============================================
    // ✅ ОБЫЧНЫЙ ОТВЕТ
    // ============================================
    
    const result: GenerateAnswerResult = {
      answer: cleanedAnswer || 'Не удалось получить ответ. Попробуйте переформулировать вопрос.',
      hasContext: isRelevant && searchResults.length > 0,
      sources: searchResults.length,
      tokensCharged: assistantId ? (totalTokens + Math.ceil(query.length / 4)) : 0,
      searchResults: searchResults.slice(0, 3).map(r => ({
        text: r.payload.text.substring(0, 200) + '...',
        score: Math.round(r.score * 100) / 100,
        title: r.payload.title ?? 'Документ',        // ✅
        chunkIndex: r.payload.chunkIndex,
      }))
    };

    // Кэшируем только если нет истории
    if (assistantId && result.hasContext && !hasRealHistory) {
      this.answerCache.cacheAnswer(
        query,
        assistantId,
        result,
        300000
      );
      console.log('💾 Answer cached');
    }

    // ============================================
    // 🔎 ДОБАВЛЕНИЕ ФАЙЛОВ В ОТВЕТ
    // ============================================

    const filesInResults = searchResults
      .filter(r => r.payload.fileUrl && r.payload.fileType)
      .map(r => ({
        fileUrl: r.payload.fileUrl as string,
        fileName: r.payload.title,
        fileType: r.payload.fileType as 'text' | 'pdf' | 'image' | 'doc' | 'markdown',
        pageNumber: r.payload.pageNumber,
        score: r.score,
      }));

    const uniqueFiles = filesInResults.reduce((acc, file) => {
      if (!acc.find(f => f.fileUrl === file.fileUrl)) {
        acc.push(file);
      }
      return acc;
    }, [] as typeof filesInResults);

    const isAskingForFile = /файл|картинк|изображени|фото|лого|pdf|document|отправ|покаж|прикрепи|скинь|дай/i.test(query);

    if (uniqueFiles.length > 0 && isAskingForFile) {
      console.log(`🔎 Found ${uniqueFiles.length} files in context, filtering...`);
        
        // ... (весь код с фильтрацией файлов остается как есть)
        
        const queryLower = query.toLowerCase();
        
        const queryCategories = {
          logo: /лого(тип)?|logo|брэнд|brand|эмблем/i.test(query),
          location: /где|находится|находитесь|адрес|местоположение|карт|map|location/i.test(query),
          document: /документ|инструкц|правил|договор|pdf|файл|текст/i.test(query),
          price: /цен|прайс|стоимость|тариф|price|cost/i.test(query),
          contact: /контакт|телефон|email|связ|phone|contact/i.test(query),
        };
        
        console.log('🔍 Query categories:', Object.entries(queryCategories)
          .filter(([_, v]) => v)
          .map(([k]) => k)
        );
        
        // Извлекаем содержательные ключевые слова
        const stopWords = new Set([
          'покажи', 'дай', 'скинь', 'отправь', 'пришли', 'хочу', 'нужен', 'мне', 
          'наш', 'ваш', 'компании', 'файл', 'картинк', 'изображен', 'фото',
          'где', 'что', 'как', 'когда', 'почему', 'зачем', 'можно', 'есть'
        ]);
        
        const keywords = queryLower
          .split(/\s+/)
          .filter(word => word.length > 2 && !stopWords.has(word))
          .filter(word => !/^(а|в|и|на|по|с|у|о|до|из|к|от)$/.test(word));
        
        console.log(`🔑 Keywords from query:`, keywords);
        
        let filteredFiles = [...uniqueFiles];
        
        // Фильтрация по категориям и ключевым словам
        // ... (весь код фильтрации остается как есть)
        
        // Сортируем по score
        filteredFiles.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        // Берём максимум 3 самых релевантных файла
        const finalFiles = uniqueFiles.slice(0, 3).map(f => ({
          fileUrl: f.fileUrl,
          fileName: f.fileName ?? 'Файл',          // ✅ Используем ?? вместо ||
          fileType: f.fileType,
          pageNumber: f.pageNumber,
        }));

        if (finalFiles.length > 0) {
          result.files = finalFiles;
          if (!result.answer.includes('🔎')) {
            result.answer = result.answer + '\n\n🔎 Файл прикреплен к сообщению';
          }
        }
        }

        return result;

      } catch (error) {
        console.error('❌ Error in generateAnswer:', error);
        return { 
          answer: 'Извините, произошла ошибка. Попробуйте обратиться позже.', 
          hasContext: false, 
          sources: 0, 
          error: error.message 
        };
      }
    }

  // ... (остальные методы без изменений: searchSimilar, uploadText, uploadFile и т.д.)

  async searchSimilar(query: string, collectionName: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      console.log(`🔍 Searching "${query}" in ${collectionName}`);
      
      try {
        const collection = await this.qdrant.getCollection(collectionName);
        console.log(`📊 Collection has ${collection.points_count} docs`);
      } catch (error) {
        console.error(`❌ Collection ${collectionName} not found`);
        return [];
      }

      const queryEmbedding = await this.embeddings.getEmbedding(query);
      
      const searchResult = await this.qdrant.search(collectionName, {
        vector: queryEmbedding,
        limit,
        score_threshold: 0.3,
      });

      console.log(`✅ Found ${searchResult.length} results`);
      if (searchResult.length > 0) {
        console.log(`📈 Scores: ${searchResult.map(r => r.score.toFixed(3)).join(', ')}`);
      }

      return searchResult.map(result => ({
        id: result.id as string,
        score: result.score,
        payload: result.payload as SearchResult['payload'],
      }));
      
    } catch (error) {
      console.error(`❌ Search error:`, error);
      return [];
    }
  }

  /**
   * Алиас для searchSimilar (используется в контроллере)
   */
  async search(query: string, collectionName: string, limit: number = 100): Promise<SearchResult[]> {
    return this.searchSimilar(query, collectionName, limit);
  }

  private shouldUseCache(
    query: string,
    conversationHistory?: ConversationMessage[]
  ): boolean {
    if (!conversationHistory || conversationHistory.length === 0) {
      console.log('💾 No history - cache enabled');
      return true;
    }
    
    if (conversationHistory.length <= 4) {
      console.log(`💾 Short history (${conversationHistory.length} msgs) - cache enabled`);
      return true;
    }
    
    const userMessages = conversationHistory
      .filter(m => m.role === 'user')
      .map(m => m.content.toLowerCase().trim());
    
    const normalizedQuery = query.toLowerCase().trim();
    const isDuplicate = userMessages.some(msg => this.isSimilarQuery(msg, normalizedQuery));
    
    if (isDuplicate) {
      console.log('🔄 Duplicate question detected - cache enabled');
      return true;
    }
    
    console.log(`📚 Long history (${conversationHistory.length} msgs) - cache disabled`);
    return false;
  }

  private isSimilarQuery(query1: string, query2: string): boolean {
    const normalize = (str: string) => 
      str.replace(/[!?.,;:]+/g, '').replace(/\s+/g, ' ').trim();
    
    const norm1 = normalize(query1);
    const norm2 = normalize(query2);
    
    return norm1 === norm2;
  }

  // ... (остальные методы без изменений)
  
  async uploadText(
    text: string, 
    collectionName: string, 
    title: string = 'Документ',
    description?: string
  ): Promise<KnowledgeUploadResult> {
    try {
      console.log(`📤 Uploading to ${collectionName}: ${title}`);
      console.log(`📏 Length: ${text.length} chars`);
      
      if (!text.trim()) throw new Error('Текст пустой');

      await this.ensureCollection(collectionName);
      
      const chunks = this.splitIntoChunks(text, 500, 50);
      console.log(`✂️ Split into ${chunks.length} chunks`);
      
      const embeddings = await this.getBatchEmbeddings(chunks);

      // ✅ Генерируем уникальный textId для группировки чанков
      const textId = `text-${uuidv4()}`;

      const points = chunks.map((chunk, index) => {
        const basePayload = {
          text: chunk,
          collectionName,
          title,
          description: description || '',
          textId, // ✅ Для группировки
          chunkIndex: index,
          source: 'text_upload',
          timestamp: new Date().toISOString(),
        };

        // ✅ В первый чанк добавляем оригинальный текст
        if (index === 0) {
          return {
            id: uuidv4(),
            vector: embeddings[index],
            payload: {
              ...basePayload,
              originalText: text, // ✅ Полный текст
              isFirstChunk: true,
            }
          };
        }

        // Остальные чанки - только свои кусочки
        return {
          id: uuidv4(),
          vector: embeddings[index],
          payload: basePayload,
        };
      });

      await this.qdrant.upsert(collectionName, { 
        points,
        wait: true
      });

      const collection = await this.qdrant.getCollection(collectionName);
      console.log(`✅ Uploaded. Total docs: ${collection.points_count}`);

      return {
        success: true,
        chunks: chunks.length,
        message: `Загружено ${chunks.length} фрагментов`,
        textId, // ✅ Возвращаем для фронтенда
      };
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Не удалось обработать текст: ${error.message}`);
    }
  }

  private async ensureCollection(collectionName: string) {
    try {
      await this.qdrant.getCollection(collectionName);
      console.log(`✅ Collection ${collectionName} exists`);
    } catch {
      console.log(`📦 Creating collection: ${collectionName}`);
      await this.qdrant.createCollection(collectionName, {
        vectors: { 
          size: 256, // YandexGPT embeddings size
          distance: 'Cosine' 
        },
      });
      console.log(`✅ Collection created`);
    }
  }

  private async getBatchEmbeddings(chunks: string[]): Promise<number[][]> {
    const batchSize = 10;
    const embeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      try {
        const batchEmbeddings = await this.embeddings.getEmbeddings(batch);
        embeddings.push(...batchEmbeddings);
        console.log(`📢 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)}`);
      } catch (error) {
        console.warn('⚠️ Batch failed, processing individually');
        for (const chunk of batch) {
          const embedding = await this.embeddings.getEmbedding(chunk);
          embeddings.push(embedding);
        }
      }
    }
    return embeddings;
  }

  private splitIntoChunks(text: string, chunkSize: number, overlap: number = 50): string[] {
    const separators = ['\n\n', '\n', '.', '!', '?', ',', ' ', ''];
    const chunks: string[] = [];
    let remainingText = text;

    while (remainingText.length > chunkSize) {
      let splitIndex = -1;
      
      for (const sep of separators) {
        const idx = remainingText.lastIndexOf(sep, chunkSize);
        if (idx > chunkSize * 0.5) {
          splitIndex = idx + sep.length;
          break;
        }
      }
      
      if (splitIndex === -1) splitIndex = chunkSize;

      const chunk = remainingText.substring(0, splitIndex).trim();
      if (chunk) chunks.push(chunk);

      let nextStart = splitIndex;
      if (overlap > 0 && chunk.length > overlap) {
        const words = chunk.split(' ');
        const overlapWords = words.slice(-Math.ceil(overlap / 10)).join(' ');
        nextStart = splitIndex - overlapWords.length;
      }

      remainingText = remainingText.substring(nextStart);
    }

    if (remainingText.trim()) chunks.push(remainingText.trim());
    
    const filteredChunks = chunks.filter(c => c.length > 10);
    console.log(`📊 Created ${filteredChunks.length} valid chunks`);
    
    return filteredChunks;
  }

  /**
   * Удалить базу знаний компании
   */
  async deleteCompanyKnowledge(companyId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.qdrant.deleteCollection(companyId);
      console.log(`✅ Collection ${companyId} deleted`);
      return { 
        success: true, 
        message: `База знаний ${companyId} удалена` 
      };
    } catch (error) {
      console.error('❌ Ошибка удаления:', error);
      throw new Error(`Не удалось удалить: ${error.message}`);
    }
  }

  /**
   * Получить статистику базы знаний
   */
  async getKnowledgeStats(companyId: string): Promise<KnowledgeStats> {
    try {
      const collection = await this.qdrant.getCollection(companyId);
      return {
        documentsCount: collection.points_count ?? 0,
        vectorSize: 256, // YandexGPT embeddings
        distance: 'Cosine',
        companyId,
      };
    } catch (error) {
      console.error('❌ Ошибка статистики:', error);
      return { 
        documentsCount: 0, 
        companyId,
        vectorSize: 256,
        distance: 'Cosine',
        error: error.message 
      };
    }
  }

  /**
   * Поиск документов по названию
   */
  async searchByTitle(title: string, companyId: string): Promise<DocumentSearchResult[]> {
    try {
      const scrollResult = await this.qdrant.scroll(companyId, {
        filter: {
          must: [
            { key: 'title', match: { value: title } }
          ],
        },
        limit: 100,
      });

      return scrollResult.points.map(point => ({
        id: point.id,
        payload: point.payload as SearchResult['payload'],
      }));
    } catch (error) {
      console.error('❌ Ошибка поиска по названию:', error);
      return [];
    }
  }

  /**
   * Загрузка файла в базу знаний
   */
  async uploadFile(
    file: Express.Multer.File,
    collectionName: string,
    title: string,
    description?: string,
    assistantId?: string
  ): Promise<FileUploadResult> {
    try {
      console.log(`📤 Uploading file to ${collectionName}: ${file.originalname}`);
      
      if (!assistantId) {
        throw new Error('assistantId обязателен для загрузки файлов');
      }

      // 1. Определяем тип файла
      const fileType = this.fileProcessingService.getFileType(
        file.mimetype,
        file.originalname
      );
      
      console.log(`📄 File type: ${fileType}`);

      // 2. Сохраняем файл на диск
      const uploadDir = path.join(process.cwd(), 'uploads', assistantId);
      await fsPromises.mkdir(uploadDir, { recursive: true });
      const uuid = uuidv4();
      const savedFilename = `${uuid}-${Buffer.from(file.originalname, 'utf8').toString('utf8')}`;  // Force UTF-8
      const savedPath = path.join(uploadDir, savedFilename);
      await fsPromises.writeFile(savedPath, file.buffer);
      console.log(`💾 File saved: ${savedPath}`);

      // 3. Извлекаем текст из файла
      const { text, pageCount } = await this.fileProcessingService.processFile(
        file,
        fileType
      );
      
      console.log(`📏 Extracted ${text.length} characters`);
      if (pageCount) {
        console.log(`📄 PDF pages: ${pageCount}`);
      }

      // ============================================
      // 🖼️ ОБРАБОТКА ИЗОБРАЖЕНИЙ БЕЗ ТЕКСТА
      // ============================================
      
      let chunks: string[];
      let points: any[];
      
      // Если текста мало или нет (например, логотип без текста)
      if (text.trim().length < 10 && fileType === 'image') {
        console.log('🖼️ Image with no text detected - creating metadata-only entry');
        
        // Создаем один виртуальный chunk с описанием
        const imageDescription = description?.trim() || 
          `${title} - изображение (${file.originalname})`;
        
        chunks = [imageDescription];
        
        // Получаем embedding для описания
        const embeddings = await this.getBatchEmbeddings(chunks);
        
        // Создаем единственную точку с метаданными изображения
        const metadata = this.fileProcessingService.createChunkMetadata(
          imageDescription,
          0,
          {
            title,
            description,
            fileType,
            filePath: savedPath,  // Полный путь для удаления
            mimeType: file.mimetype,
            fileSize: file.size,
            pageCount
          },
          assistantId,
          collectionName
        );

        points = [{
          id: uuidv4(),
          vector: embeddings[0],
          payload: {
            text: imageDescription,
            ...metadata,
            totalChunks: 1,
            isImageOnly: true,
            fileUrl: `uploads/${assistantId}/${savedFilename}`  // Относительный путь
          }
        }];
        
        console.log('✅ Created metadata entry for image');
        
      } else {
        // ============================================
        // 📄 ОБЫЧНАЯ ОБРАБОТКА (С ТЕКСТОМ)
        // ============================================
        
        if (!text.trim()) {
          throw new Error('Не удалось извлечь текст из файла');
        }

        // 4. Разбиваем на чанки
        chunks = this.splitIntoChunks(text, 500, 50);
        console.log(`📊 Created ${chunks.length} valid chunks`);
        console.log(`✂️ Split into ${chunks.length} chunks`);

        // 5. Создаем эмбеддинги
        const embeddings = await this.getBatchEmbeddings(chunks);

        // 6. Создаем точки с метаданными для каждого чанка
        points = chunks.map((chunk, index) => {
          const metadata = this.fileProcessingService.createChunkMetadata(
            chunk,
            index,
            {
              title,
              description,
              fileType,
              filePath: savedPath,  // Полный путь для удаления
              mimeType: file.mimetype,
              fileSize: file.size,
              pageCount
            },
            assistantId,
            collectionName
          );

          return {
            id: uuidv4(),
            vector: embeddings[index],
            payload: {
              text: chunk,
              ...metadata,
              totalChunks: chunks.length,
              fileUrl: `uploads/${assistantId}/${savedFilename}`,  // Относительный путь
              // Для PDF - добавляем номер страницы
              ...(pageCount && {
                pageNumber: Math.floor((index / chunks.length) * pageCount) + 1
              })
            }
          };
        });
      }

      // 7. Загружаем в Qdrant
      await this.ensureCollection(collectionName);
      
      if (points.length === 0) {
        throw new Error('Не удалось создать точки для загрузки');
      }
      
      await this.qdrant.upsert(collectionName, { 
        points,
        wait: true
      });

      const collection = await this.qdrant.getCollection(collectionName);
      console.log(`✅ File uploaded. Total docs: ${collection.points_count}`);

      // 8. Очищаем кэш ответов
      if (assistantId) {
        console.log(`🧹 Clearing answer cache for assistant: ${assistantId}`);
        this.answerCache.clearAssistantCache(assistantId);
      }

      return {
        success: true,
        message: `Файл обработан: ${chunks.length} фрагментов добавлено`,
        chunks: chunks.length,
        fileInfo: {
          originalName: file.originalname,
          savedPath: savedPath,
          fileType,
          fileSize: file.size,
          pageCount
        }
      };

    } catch (error) {
      console.error('❌ File upload error:', error);
      throw new Error(`Не удалось обработать файл: ${error.message}`);
    }
  }
}