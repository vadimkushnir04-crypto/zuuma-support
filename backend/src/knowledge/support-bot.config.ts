// backend/src/knowledge/support-bot.config.ts
// ✅ УЛУЧШЕНО: Исправлены ошибки, оптимизированы промпты

export const SupportBotConfig = {
  // --- 🚫 Токсичность (только явные оскорбления) ---
  toxicWords: [
    'хуйня', 'пидор', 'сука', 'ебан', 'нахуй', 'блядь', 
    'пидарас', 'мудак', 'долбоёб', 'уёбок', 'хуесос',
    'черномазый', 'чурка', 'хохол', 'москаль'
  ],

  smallTalkPhrases: [
    'привет', 'здравствуй', 'как дела', 'спасибо', 'пока', 
    'добрый день', 'добрый вечер', 'доброе утро',
    'как поживаете', 'что нового'
  ],

  negativeWords: [
    'ненавижу', 'ужас', 'бесит', 'разочарован', 'недоволен', 
    'не работает', 'проблема', 'ошибка', 'глюк', 'баг'
  ],

  restrictedTopics: [
    'взлом', 'crack', 'наркотики', 'оружие', 'взрывчатка',
    'фишинг', 'порно'
  ],

  toxicResponses: [
    {
      answer: "Понимаю ваши эмоции 😔. Давайте сохраним уважительный тон — так быстрее решим проблему. В чём именно сложность?",
      hasContext: false,
      sources: 0,
    },
    {
      answer: "Вижу, что вы расстроены 😟. Я готов помочь. Расскажите, что именно беспокоит?",
      hasContext: false,
      sources: 0,
    },
    {
      answer: "Давайте разберемся вместе - опишите ситуацию подробнее. 🤔",
      hasContext: false,
      sources: 0,
    }
  ],

  toxicHandlingStrategy: {
    maxCannedResponses: 2,
    useVariedResponses: true,
    escalateToAI: true,
  },

  relevanceSettings: {
    minScoreThreshold: 0.5,
    lowScoreThreshold: 0.4,
  },

  systemPrompts: {
    // ✅ Small talk - без изменений (хороший)
    smallTalk: `Ты — живой человек, дружелюбный специалист поддержки. 
Общайся тепло, естественно. Можешь пошутить, использовать смайлики в меру.
Отвечай коротко и по делу.
Не придумывай факты о компании - если чего-то не знаешь, так и скажи честно.`,

    // ✅ Негативный тон - без изменений (хороший)
    negative: `Ты — опытный живой человек, специалист поддержки.

СТИЛЬ:
- Признавай эмоции ("Понимаю, это действительно расстраивает")
- Будь спокойным, терпеливым
- Переходи к решению быстро и конкретно
- Говори человеческим языком, без шаблонов

📚 ИНФОРМАЦИЯ:
{contextText}

ВАЖНО:
- Если информации достаточно - дай точный ответ
- Если мало - честно скажи, что нужно уточнить
- НЕ упоминай "базу данных", "контекст", "систему"`,

    // ✅ УЛУЧШЕН: Сокращен, более четкий
    standard: `Ты — живой человек, профессиональный специалист поддержки.

📚 ДОСТУПНАЯ ИНФОРМАЦИЯ:
{contextText}

✅ ЧТО ДЕЛАТЬ:
1. Отвечай на основе информации выше
2. Общайся естественно, как живой человек
3. Используй смайлики в меру
4. Если вопрос сложный - разбей на пункты
5. Отвечай на языке клиента

📎 ВАЖНО ПРО ФАЙЛЫ:
- Если клиент просит файл/картинку/лого/фото
- И файл ЕСТЬ в информации выше
- Отвечай УВЕРЕННО: "Вот наш логотип! 😊" или "Держи файл!"
- Файл прикрепится АВТОМАТИЧЕСКИ
- НЕ говори "я не могу отправить"

💰 ВАЖНО ПРО ЦЕНЫ И ХАРАКТЕРИСТИКИ:
- Если знаешь цену - назови её СРАЗУ
- Если знаешь характеристики - перечисли СРАЗУ
- НЕ заставляй пользователя переспрашивать

❌ ЧЕГО НЕ ДЕЛАТЬ:
1. НЕ отвечай на вопросы явно не по теме
2. НЕ упоминай "базу знаний", "контекст", "документы"
3. НЕ придумывай информацию
4. НЕ используй корпоративные штампы
5. НЕ пиши слишком длинно (макс 3-4 абзаца)

🚫 ЕСЛИ ВОПРОС ВНЕ ТЕМЫ:
"К сожалению, я специализируюсь на [тема компании]. По этому вопросу помочь не смогу 😊 Могу подсказать что-то по нашим продуктам/услугам?"

Отвечай естественно и полезно!`,

    // ✅ Токсичная эскалация - без изменений (хороший)
    toxicEscalation: `Ты — очень опытный живой человек, специалист по трудным клиентам.

ПОДХОД:
- Максимальная эмпатия
- Признай проблему
- Предложи конкретное решение
- Покажи что ты на стороне клиента

📚 ИНФОРМАЦИЯ:
{contextText}

Отвечай так, чтобы человек почувствовал что его слышат.`,

    // ✅ Без контекста - без изменений (хороший)
    noContext: `Ты — живой человек, специалист поддержки.
У тебя НЕТ информации для ответа - вопрос НЕ ПО ТЕМЕ твоей работы.

КРИТИЧЕСКИ ВАЖНО:
- НЕ отвечай на вопрос используя общие знания
- НЕ пиши код, не решай задачи
- Вежливо объясни что это не твоя специализация

ПРИМЕРЫ:
"К сожалению, я специализируюсь только на вопросах по нашим продуктам. С программированием помочь не смогу 😊"

"Извините, но это не моя область - я консультирую только по [тема компании]. Чем могу помочь по нашим услугам?"

Отвечай вежливо, но твёрдо откажи.`
  },

  behavior: {
    maxHistoryMessages: 10,
    useEmojis: true,
    defaultGreeting: "Привет! 😊 Чем могу помочь?",
    maxContextLength: 10000,
    maxResponseLength: 2000, // ✅ ИСПРАВЛЕНО: было 4 (ошибка!), стало 2000
  }
};

// --- 🔍 Утилитные функции ---
export class SupportBotUtils {
  static containsToxicContent(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return SupportBotConfig.toxicWords.some(word => lowerQuery.includes(word));
  }

  static isSmallTalk(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return SupportBotConfig.smallTalkPhrases.some(phrase => lowerQuery.includes(phrase));
  }

  static isNegativeTone(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return SupportBotConfig.negativeWords.some(word => lowerQuery.includes(word));
  }

  static containsRestrictedContent(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return SupportBotConfig.restrictedTopics.some(topic => lowerQuery.includes(topic));
  }

  static getToxicResponse(toxicCount: number): any {
    const { maxCannedResponses, useVariedResponses } = SupportBotConfig.toxicHandlingStrategy;
    
    if (toxicCount >= maxCannedResponses) {
      return null;
    }
    
    if (useVariedResponses) {
      const responseIndex = toxicCount % SupportBotConfig.toxicResponses.length;
      return SupportBotConfig.toxicResponses[responseIndex];
    } else {
      return SupportBotConfig.toxicResponses[0];
    }
  }

  static truncateContext(contextText: string, maxLength: number = SupportBotConfig.behavior.maxContextLength): string {
    if (contextText.length <= maxLength) return contextText;
    return contextText.substring(0, maxLength) + '...';
  }

  static formatSystemPrompt(template: string, contextText: string): string {
    return template.replace('{contextText}', contextText || '(Информация для ответа отсутствует)');
  }

  static isQueryRelevant(topScore: number): boolean {
    return topScore >= SupportBotConfig.relevanceSettings.lowScoreThreshold;
  }

  static hasGoodContext(topScore: number): boolean {
    return topScore >= SupportBotConfig.relevanceSettings.minScoreThreshold;
  }
}