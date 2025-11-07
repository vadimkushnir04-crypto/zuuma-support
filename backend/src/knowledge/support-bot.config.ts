// backend/src/knowledge/support-bot.config.ts
// ✅ Версия под YandexGPT 5 — сбалансированный стиль, естественные ответы, без шаблонов

export const SupportBotConfig = {
  // --- 🚫 Токсичность (явные оскорбления) ---
  toxicWords: [
    'хуйня', 'пидор', 'сука', 'ебан', 'нахуй', 'блядь',
    'пидарас', 'мудак', 'долбоёб', 'уёбок', 'хуесос',
    'черномазый', 'чурка', 'хохол', 'москаль'
  ],

  // --- 💬 Small Talk (дружеские фразы) ---
  smallTalkPhrases: [
    'привет', 'здравствуй', 'как дела', 'спасибо', 'пока',
    'добрый день', 'добрый вечер', 'доброе утро',
    'как поживаете', 'что нового', 'рад вас видеть'
  ],

  // --- 😠 Негативные сигналы ---
  negativeWords: [
    'ненавижу', 'ужас', 'бесит', 'разочарован', 'недоволен',
    'не работает', 'проблема', 'ошибка', 'глюк', 'баг', 'вернуть'
  ],

  restrictedTopics: [
    'взлом', 'crack', 'наркотики', 'оружие', 'взрывчатка',
    'фишинг', 'порно'
  ],

  toxicResponses: [
    { answer: "Понимаю ваши эмоции 😔 Давайте спокойно разберёмся, что случилось. Что именно пошло не так?", hasContext: false },
    { answer: "Кажется, вы расстроены 😟 Давайте посмотрим, как можно это исправить.", hasContext: false },
    { answer: "Окей, давайте вместе разберёмся 🤝 Опишите, пожалуйста, проблему чуть подробнее.", hasContext: false }
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

  // --- 🧠 Системные промпты ---
  systemPrompts: {
    smallTalk: `Ты — живой человек, приветливый специалист поддержки.
Общайся тепло и по-человечески.
Можно добавить немного лёгкого юмора или эмодзи (1-2 максимум).
Отвечай коротко и по делу.
Если чего-то не знаешь — скажи честно, не выдумывай.`,

    negative: `Ты — человек, специалист поддержки, умеющий работать с недовольными клиентами.

СТИЛЬ:
- Признай эмоции ("Понимаю, это действительно неприятно")
- Говори спокойно, уверенно, по существу
- Предлагай конкретное действие ("Давайте посмотрим, как это исправить")
- Без извинений через каждые две строки

📚 ИНФОРМАЦИЯ:
{contextText}

ВАЖНО:
- Не придумывай факты, если информации нет
- Не упоминай "контекст", "базу данных", "модель" или "систему"
- Не предлагай обращаться в поддержку — ты сам и есть поддержка
- Если данных мало, скажи: "Мне нужно уточнить детали, чтобы ответить точнее."`,

    standard: `Ты — живой, внимательный специалист поддержки. Твоя цель — реально помочь клиенту, а не отписаться.

📚 ДОСТУПНАЯ ИНФОРМАЦИЯ:
{contextText}

✅ ПРАВИЛА:
1. Отвечай естественно, с лёгкой теплотой и эмодзи (1-2 максимум)
2. Будь краток (до 3-4 абзацев)
3. Если пользователь **напрямую спрашивает** о контактах (электронная почта, телефон, Telegram и т.д.), можешь предоставить их в ответе
4. Не предоставляй контакты без прямого запроса
5. Не придумывай факты, только по имеющейся информации
6. Если есть файлы — просто укажи "Вот нужный файл! 📎"`,

    toxicEscalation: `Ты — специалист по трудным ситуациям.
Будь спокойным, уважительным, но уверенным.
Избегай лишних извинений — лучше предложи реальный шаг к решению.
Дай понять, что клиент услышан.

📚 ИНФОРМАЦИЯ:
{contextText}

❌ Не говори: "обратитесь в поддержку", "свяжитесь с нами"
✅ Говори: "Давайте решим это прямо здесь."`,

    noContext: `Ты — человек, специалист поддержки.
У тебя нет данных по этому вопросу, и он не относится к теме компании.

СТИЛЬ:
- Не используй общие знания
- Вежливо и спокойно откажи
- Сохрани позитив

ПРИМЕРЫ:
"Этот вопрос не совсем по моей теме 😊 Могу подсказать по нашим услугам?"
"Похоже, запрос вне моей области, но с радостью помогу, если речь про [тему компании]."`
  },

  behavior: {
    maxHistoryMessages: 10,
    useEmojis: true,
    defaultGreeting: "Привет! 👋 Чем могу помочь сегодня?",
    maxContextLength: 10000,
    maxResponseLength: 2000,
  }
};

// --- 🔍 Утилиты ---
export class SupportBotUtils {
  static containsToxicContent(query: string): boolean {
    const lower = query.toLowerCase();
    return SupportBotConfig.toxicWords.some(w => lower.includes(w));
  }

  static isSmallTalk(query: string): boolean {
    const lower = query.toLowerCase();
    return SupportBotConfig.smallTalkPhrases.some(p => lower.includes(p));
  }

  static isNegativeTone(query: string): boolean {
    const lower = query.toLowerCase();
    const negative = SupportBotConfig.negativeWords.some(w => lower.includes(w));
    return negative;
  }

  static containsRestrictedContent(query: string): boolean {
    const lower = query.toLowerCase();
    return SupportBotConfig.restrictedTopics.some(t => lower.includes(t));
  }

  // ✅ Новая функция: проверка, спрашивает ли пользователь контакты
  static isContactRequest(query: string): boolean {
    const lower = query.toLowerCase();
    return /эл(ектронной)?\s?почт|email|e-mail|телефон|контакт|как связать/i.test(lower);
  }

  static getToxicResponse(count: number): any {
    const { maxCannedResponses, useVariedResponses } = SupportBotConfig.toxicHandlingStrategy;
    if (count >= maxCannedResponses) return null;
    return useVariedResponses
      ? SupportBotConfig.toxicResponses[count % SupportBotConfig.toxicResponses.length]
      : SupportBotConfig.toxicResponses[0];
  }

  static truncateContext(context: string, max: number = SupportBotConfig.behavior.maxContextLength): string {
    return context.length <= max ? context : context.slice(0, max) + '...';
  }

  static formatSystemPrompt(template: string, context: string): string {
    return template.replace('{contextText}', context || '(Информация отсутствует)');
  }

  static isQueryRelevant(score: number): boolean {
    return score >= SupportBotConfig.relevanceSettings.lowScoreThreshold;
  }

  static hasGoodContext(score: number): boolean {
    return score >= SupportBotConfig.relevanceSettings.minScoreThreshold;
  }
}
