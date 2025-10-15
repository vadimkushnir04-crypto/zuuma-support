// backend/src/assistants/services/prompt-builder.service.ts
import { Injectable } from '@nestjs/common';

export interface AssistantBehaviorSettings {
  // Базовые настройки (для обратной совместимости)
  temperature?: number;
  maxTokens?: number;
  maxHistoryMessages?: number;
  enableToxicityFilter?: boolean;
  allowSmallTalk?: boolean;
  searchLimit?: number;
  minSearchScore?: number;
  customGreeting?: string;
  fallbackMessage?: string;
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  humanImitation?: any; // Если у вас есть этот тип
  
  // Новые настройки поведения
  allowVPN?: boolean;
  allowCompetitorPrices?: boolean;
  allowProfanity?: boolean;
  allowPersonalAdvice?: boolean;
  mood?: 'energetic' | 'cheerful' | 'calm' | 'formal';
  useEmojis?: boolean;
  maxResponseLength?: 'short' | 'medium' | 'long';
  customSystemPrompt?: string;
  
  // Разрешаем любые дополнительные поля
  [key: string]: any;
}

@Injectable()
export class PromptBuilderService {
  
  buildSystemPrompt(settings: AssistantBehaviorSettings = {}): string {
    // Если есть кастомный промпт - используем его
    if (settings.customSystemPrompt?.trim()) {
      return settings.customSystemPrompt;
    }

    // Иначе собираем автоматически
    const mood = settings.mood || 'cheerful';
    const useEmojis = settings.useEmojis ?? true;
    const maxLength = settings.maxResponseLength || 'medium';

    let prompt = this.getMoodBasePrompt(mood, useEmojis);
    
    // Добавляем правила длины ответа
    prompt += this.getLengthInstructions(maxLength);
    
    // Добавляем разрешённые темы
    prompt += this.getAllowedTopicsInstructions(settings);
    
    // Добавляем общие правила
    prompt += this.getGeneralRules(settings);

    return prompt;
  }

  private getMoodBasePrompt(mood: string, useEmojis: boolean): string {
    const emojiNote = useEmojis ? 'Используй эмодзи умеренно.' : 'Не используй эмодзи.';
    
    const moods: Record<string, string> = {
      energetic: `Ты — энергичный и мотивированный помощник службы поддержки!
Отвечай динамично, с энтузиазмом. ${emojiNote}
Твоя задача — вдохновлять и помогать быстро решать вопросы.

КОНТЕКСТ:
{contextText}

`,

      cheerful: `Ты — дружелюбный и отзывчивый сотрудник службы поддержки.
Общайся тепло и по-человечески. ${emojiNote}
Будь позитивным, но не навязчивым.

КОНТЕКСТ:
{contextText}

`,

      calm: `Ты — спокойный и профессиональный консультант.
Отвечай размеренно, без лишних эмоций. ${emojiNote}
Будь терпеливым и обстоятельным.

КОНТЕКСТ:
{contextText}

`,

      formal: `Вы — профессиональный консультант службы поддержки.
Используйте формальный стиль общения, обращайтесь на "Вы".
Избегайте разговорной лексики и чрезмерной эмоциональности.

КОНТЕКСТ:
{contextText}

`
    };

    return moods[mood] || moods.cheerful;
  }

  private getLengthInstructions(maxLength: string): string {
    const lengths: Record<string, string> = {
      short: 'ВАЖНО: Отвечай кратко (1-2 предложения), только суть.\n',
      medium: 'Отвечай развёрнуто, но ограничивай ответ 3-4 абзацами.\n',
      long: 'Можешь давать подробные, детальные ответы с примерами.\n'
    };
    
    return lengths[maxLength] || lengths.medium;
  }

  private getAllowedTopicsInstructions(settings: AssistantBehaviorSettings): string {
    let instructions = '\nРАЗРЕШЁННЫЕ ТЕМЫ:\n';
    
    if (settings.allowVPN) {
      instructions += '- Можешь консультировать по VPN и обходу блокировок при необходимости\n';
    } else {
      instructions += '- НЕ давай советы по VPN или обходу блокировок\n';
    }
    
    if (settings.allowCompetitorPrices) {
      instructions += '- Можешь упоминать цены конкурентов для сравнения\n';
    } else {
      instructions += '- НЕ упоминай конкурентов и их цены\n';
    }
    
    if (settings.allowProfanity) {
      instructions += '- Можешь использовать неформальную лексику, если это уместно в контексте\n';
    } else {
      instructions += '- Используй только нейтральную лексику\n';
    }
    
    if (settings.allowPersonalAdvice) {
      instructions += '- Можешь давать личные советы и рекомендации\n';
    } else {
      instructions += '- Фокусируйся только на услугах компании\n';
    }

    return instructions + '\n';
  }

  private getGeneralRules(settings: AssistantBehaviorSettings): string {
    return `СТРОГИЕ ПРАВИЛА:
- Отвечай ТОЛЬКО на основе информации из раздела КОНТЕКСТ
- Если информации нет в контексте - честно скажи об этом
- НЕ придумывай факты, цены или детали
- Отвечай на том же языке, на котором задан вопрос

КРИТИЧНО: Используй информацию из КОНТЕКСТА дословно (особенно цены и названия).`;
  }
}