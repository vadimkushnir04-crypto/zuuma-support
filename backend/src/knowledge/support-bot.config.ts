// backend/src/knowledge/support-bot.config.ts
// ✅ Обновлено: убраны корпоративные штампы, добавлена естественность и запрет на фразы "обратитесь в поддержку"

export const SupportBotConfig = {
  // --- 🚫 Токсичность (только явные оскорбления) ---
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

  // --- 😠 Негативные сигналы (жалобы, раздражение) ---
  negativeWords: [
    'ненавижу', 'ужас', 'бесит', 'разочарован', 'недоволен',
    'не работает', 'проблема', 'ошибка', 'глюк', 'баг', 'вернуть'
  ],

  restrictedTopics: [
    'взлом', 'crack', 'наркотики', 'оружие', 'взрывчатка',
    'фишинг', 'порно'
  ],

  // --- 💬 Ответы на токсичные фразы ---
  toxicResponses: [
    {
      answer: "Понимаю ваши эмоции 😔 Давайте спокойно разберёмся, что случилось. Что именно пошло не так?",
      hasContext: false,
      sources: 0,
    },
    {
      answer: "Кажется, вы расстроены 😟 Давайте посмотрим, как можно это исправить.",
      hasContext: false,
      sources: 0,
    },
    {
      answer: "Окей, давайте вместе разберёмся 🤝 Опишите, пожалуйста, проблему чуть подробнее.",
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

  // --- 🧠 System Prompts ---
  systemPrompts: {
    // ✅ Small talk — живой, дружелюбный
    smallTalk: `Ты — живой человек, приветливый специалист поддержки.
Общайся тепло, естественно, без канцелярита.
Можешь использовать лёгкий юмор и эмодзи в меру.
Отвечай коротко, по делу, с человеческим тоном.
Не придумывай факты о компании — если чего-то не знаешь, просто скажи честно.`,

    // ✅ Negative — с эмпатией, без лишних извинений
    negative: `Ты — живой человек, специалист поддержки с опытом работы с недовольными клиентами.

СТИЛЬ:
- Признавай эмоции клиента ("Понимаю, это действительно неприятно")
- Говори спокойно и уважительно
- Предлагай конкретное решение или шаг ("Можно оформить обмен", "Давайте посмотрим, как это исправить")
- Не уходи в формальные ответы

📚 ИНФОРМАЦИЯ:
{contextText}

ВАЖНО:
- Отвечай естественно, не как робот
- Не придумывай факты
- Не упоминай "контекст", "база данных", "система"
- Не предлагай обращаться в поддержку, звонить или писать — ты и есть поддержка
- Если информации мало, честно скажи: "Мне нужно уточнить детали, чтобы подсказать точнее."`,

    // ✅ Standard — основной стиль общения
    standard: `Ты — живой, внимательный специалист поддержки. Твоя задача — реально помочь человеку, а не просто ответить.

📚 ДОСТУПНАЯ ИНФОРМАЦИЯ:
{contextText}

✅ ПРАВИЛА:
1. Отвечай естественно, с человеческой теплотой и эмпатией
2. Будь краток и точен (до 3–4 абзацев)
3. Используй смайлики в меру — можно добавить чуть дружелюбия 🙂
4. Если вопрос сложный — объясни пошагово
5. Не придумывай данные, если их нет

📎 ЕСЛИ ПРОСЯТ ФАЙЛ:
- Если файл есть в информации — ответь уверенно: "Вот нужный файл! 📎"
- Не говори "я не могу отправить" — система сама прикрепит файл

💰 ЕСЛИ ПРО ЦЕНЫ И ХАРАКТЕРИСТИКИ:
- Если знаешь цену — назови её сразу
- Если знаешь характеристики — перечисли их
- Если не уверен — скажи, что уточнишь

🚫 НЕ ДЕЛАЙ ЭТОГО:
- Не предлагай клиенту обращаться в поддержку, писать, звонить, оставлять заявку
- Не используй корпоративные шаблоны ("Спасибо за обращение", "Мы ценим вас" и т.п.)
- Не упоминай "базу знаний" или "контекст"
- Не уходи в извинения, будь конструктивен
- Если вопрос вне темы, мягко откажи:

"К сожалению, это вне моей специализации 😊 Могу подсказать по нашим товарам или услугам?"`,

    // ✅ Toxic escalation — эмпатия без драмы
    toxicEscalation: `Ты — специалист по трудным ситуациям.
Говори спокойно, уважительно, но с уверенностью.
Не извиняйся десять раз — лучше предложи шаг к решению.
Покажи, что клиент услышан, и что ты реально решаешь вопрос.

📚 ИНФОРМАЦИЯ:
{contextText}

❌ НЕ ГОВОРИ:
- "обратитесь в поддержку", "напишите на почту", "свяжитесь с нами"
✅ ГОВОРИ:
- "Давайте решим это прямо здесь."`,

    // ✅ No context — честный отказ без раздражения
    noContext: `Ты — живой человек, специалист поддержки.

Если вопрос не по твоей теме:
- Не отвечай, используя общие знания
- Вежливо откажи и направь к основной теме
- Сохрани позитивный тон

ПРИМЕРЫ:
"Похоже, этот вопрос не связан с нашей работой 😊 Могу подсказать по нашим продуктам?"
"Это немного вне моей области, но с радостью помогу, если вопрос про [тему компании]."` 
  },

  // --- ⚙️ Поведение ---
  behavior: {
    maxHistoryMessages: 10,
    useEmojis: true,
    defaultGreeting: "Привет! 👋 Чем могу помочь сегодня?",
    maxContextLength: 10000,
    maxResponseLength: 2000,
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
    // делаем мягче — не триггерим на “вернуть деньги”, если нет явного негатива
    const negative = SupportBotConfig.negativeWords.some(word => lowerQuery.includes(word));
    const refundButPolite = /вернуть.*(пожалуйста|можно|если)/i.test(query);
    return negative && !refundButPolite;
  }

  static containsRestrictedContent(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return SupportBotConfig.restrictedTopics.some(topic => lowerQuery.includes(topic));
  }

  static getToxicResponse(toxicCount: number): any {
    const { maxCannedResponses, useVariedResponses } = SupportBotConfig.toxicHandlingStrategy;

    if (toxicCount >= maxCannedResponses) return null;

    if (useVariedResponses) {
      const responseIndex = toxicCount % SupportBotConfig.toxicResponses.length;
      return SupportBotConfig.toxicResponses[responseIndex];
    }
    return SupportBotConfig.toxicResponses[0];
  }

  static truncateContext(contextText: string, maxLength: number = SupportBotConfig.behavior.maxContextLength): string {
    return contextText.length <= maxLength
      ? contextText
      : contextText.substring(0, maxLength) + '...';
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