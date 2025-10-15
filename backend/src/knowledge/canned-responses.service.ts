// backend/src/knowledge/canned-responses.service.ts
import { Injectable } from '@nestjs/common';

interface CannedResponse {
  answer: string;
  variations?: string[];
}

@Injectable()
export class CannedResponsesService {
  
  // 👋 Приветствия
  private greetings: CannedResponse[] = [
    { answer: 'Привет! 😊 Чем могу помочь?' },
    { answer: 'Здравствуйте! Рад вас видеть! Как я могу помочь?' },
    { answer: 'Добрый день! Слушаю вас внимательно 👂' },
    { answer: 'Приветствую! Готов ответить на ваши вопросы!' },
    { answer: 'Здравствуйте! Что вас интересует?' },
    { answer: 'Привет! 👋 Рад помочь! Задавайте вопросы!' },
    { answer: 'Добро пожаловать! Чем могу быть полезен?' },
  ];

  // 👋 Прощания
  private farewells: CannedResponse[] = [
    { answer: 'До свидания! Обращайтесь, если понадобится помощь! 👋' },
    { answer: 'Пока! Всего доброго! 😊' },
    { answer: 'До встречи! Рад был помочь!' },
    { answer: 'Хорошего дня! Будут вопросы - пишите!' },
    { answer: 'Всего хорошего! Удачи! ✨' },
    { answer: 'До скорого! Обращайтесь, если что!' },
  ];

  // 🙏 Благодарности
  private thanks: CannedResponse[] = [
    { answer: 'Пожалуйста! Всегда рад помочь! 😊' },
    { answer: 'Не за что! Обращайтесь, если будут еще вопросы!' },
    { answer: 'Рад был помочь! Если что-то еще понадобится - пишите!' },
    { answer: 'На здоровье! Удачи! ✨' },
    { answer: 'Всегда пожалуйста! Я здесь, чтобы помогать!' },
    { answer: 'Рад быть полезным! 💪' },
  ];

  // 🤔 "Как дела?"
  private howAreYou: CannedResponse[] = [
    { answer: 'У меня всё отлично, спасибо! 😊 А у вас? Чем могу помочь?' },
    { answer: 'Прекрасно работаю! Готов помогать! Что вас интересует?' },
    { answer: 'Всё хорошо! Рад пообщаться. Есть вопросы?' },
    { answer: 'Отлично! Готов быть полезным! 💪 Что нужно?' },
  ];

  // ❓ "Кто ты?" / "Что ты можешь?"
  private whoAreYou: CannedResponse[] = [
    { answer: 'Я - AI-ассистент, созданный чтобы помогать вам! 🤖 Задавайте вопросы!' },
    { answer: 'Меня зовут AI-помощник! Я здесь, чтобы отвечать на ваши вопросы! 😊' },
    { answer: 'Я - виртуальный ассистент компании. Чем могу быть полезен?' },
    { answer: 'Я - умный помощник! Могу ответить на вопросы о компании и наших услугах!' },
  ];

  // 😊 "Хорошо/Отлично"
  private positive: CannedResponse[] = [
    { answer: 'Рад слышать! 😊 Если еще что-то понадобится - обращайтесь!' },
    { answer: 'Отлично! Всегда готов помочь! 💪' },
    { answer: 'Здорово! Рад был быть полезным! ✨' },
    { answer: 'Замечательно! Обращайтесь, если что!' },
  ];

  // ❌ "Нет/Не надо"
  private negative: CannedResponse[] = [
    { answer: 'Хорошо, понял! Если передумаете - пишите! 👍' },
    { answer: 'Без проблем! Обращайтесь, если понадобится!' },
    { answer: 'Окей! Буду рад помочь когда понадобится! 😊' },
  ];

  // ✅ УЛУЧШЕННЫЕ ПАТТЕРНЫ - больше вариантов распознавания
  private patterns = {
    // Приветствия - расширенный список
    greeting: /^(привет|здравствуй|доброго|добр(ый|ое|ая)\s*(день|утро|вечер)|салют|хай|хей|йоу|hi|hello|hey|sup|morning|evening)/i,
    
    // Прощания - больше вариантов
    farewell: /^(пока|до\s*свидани|до\s*встречи|спокойн|всего|удач|бывай|до\s*связи|bye|goodbye|see\s*ya|later|cya)/i,
    
    // Благодарности - включая разговорные
    thanks: /^(спасибо|благодар|пасиб|сенкс|thanks|thank\s*you|thx|ty)/i,
    
    // Как дела - больше вариаций
    howAreYou: /^(как\s*дела|как\s*сам|как\s*поживаеш|как\s*ты|как\s*дел|what'?s\s*up|how\s*are\s*you|how\s*r\s*u)/i,
    
    // Кто ты / что ты умеешь
    whoAreYou: /^(кто\s*ты|что\s*ты|кто\s*вы|что\s*ты\s*(можешь|умеешь|делаешь)|who\s*are\s*you|what\s*can\s*you)/i,
    
    // Положительные ответы
    positive: /^(хорошо|отлично|супер|класс|ок|окей|збс|круто|найс|perfect|great|cool|awesome|ok|okay)/i,
    
    // Отрицательные ответы
    negative: /^(нет|не\s*надо|не\s*нужно|не\s*хочу|no|nope|nah)/i,
  };

  /**
   * ✅ ГЛАВНЫЙ МЕТОД - Проверяет и возвращает заготовленный ответ
   */
  getCannedResponse(query: string, conversationHistory?: any[]): string | null {
    const normalizedQuery = this.normalizeQuery(query);
    
    console.log('🎯 [CANNED] Checking query:', normalizedQuery);
    console.log('📚 [CANNED] History length:', conversationHistory?.length || 0);
    
    // ============================================
    // ✅ ПРОВЕРКА ПОВТОРНОГО ПРИВЕТСТВИЯ
    // ============================================
    
    // Если в истории уже есть приветствие от бота - не здороваемся снова
    if (conversationHistory && conversationHistory.length > 0) {
      const hasGreetedAlready = conversationHistory.some(msg => 
        msg.role === 'assistant' && this.isGreetingResponse(msg.content)
      );
      
      if (hasGreetedAlready && this.patterns.greeting.test(normalizedQuery)) {
        console.log('⚠️ [CANNED] Already greeted in this conversation - skipping');
        return null; // Пусть LLM ответит естественно
      }
    }

    // ============================================
    // ✅ ПРОВЕРКА ВСЕХ ПАТТЕРНОВ
    // ============================================
    
    const checks = [
      { pattern: this.patterns.greeting, responses: this.greetings, name: 'greeting' },
      { pattern: this.patterns.farewell, responses: this.farewells, name: 'farewell' },
      { pattern: this.patterns.thanks, responses: this.thanks, name: 'thanks' },
      { pattern: this.patterns.howAreYou, responses: this.howAreYou, name: 'howAreYou' },
      { pattern: this.patterns.whoAreYou, responses: this.whoAreYou, name: 'whoAreYou' },
      { pattern: this.patterns.positive, responses: this.positive, name: 'positive' },
      { pattern: this.patterns.negative, responses: this.negative, name: 'negative' },
    ];

    for (const check of checks) {
      if (check.pattern.test(normalizedQuery)) {
        const response = this.getRandomResponse(check.responses);
        console.log(`✅ [CANNED] Matched pattern: ${check.name}`);
        console.log(`📝 [CANNED] Response: ${response.substring(0, 50)}...`);
        return response;
      }
    }

    console.log('❌ [CANNED] No pattern matched');
    return null; // Нет заготовленного ответа
  }

  /**
   * ✅ НОРМАЛИЗАЦИЯ ЗАПРОСА - убираем лишнее
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[!?.,;:]+$/, '') // Убираем пунктуацию в конце
      .replace(/\s+/g, ' '); // Нормализуем пробелы
  }

  /**
   * ✅ ПРОВЕРКА - является ли ответ приветствием
   */
  private isGreetingResponse(response: string): boolean {
    const greetingPhrases = [
      'привет', 'здравствуй', 'добрый день', 'добрый вечер', 'доброе утро',
      'рад вас видеть', 'приветствую', 'hello', 'hi', 'добро пожаловать'
    ];
    
    const lowerResponse = response.toLowerCase();
    return greetingPhrases.some(phrase => lowerResponse.includes(phrase));
  }

  /**
   * ✅ РАНДОМАЙЗЕР - возвращает случайный ответ
   */
  private getRandomResponse(responses: CannedResponse[]): string {
    if (!responses || responses.length === 0) {
      console.warn('⚠️ [CANNED] Empty responses array!');
      return 'Здравствуйте! Чем могу помочь?';
    }
    
    const randomIndex = Math.floor(Math.random() * responses.length);
    console.log(`🎲 [CANNED] Selected random index: ${randomIndex} of ${responses.length}`);
    return responses[randomIndex].answer;
  }

  /**
   * ✅ ТЕСТИРОВАНИЕ ПАТТЕРНОВ - для отладки
   */
  testPattern(query: string): { matched: boolean; patternName?: string; response?: string } {
    const normalizedQuery = this.normalizeQuery(query);
    
    const checks = [
      { pattern: this.patterns.greeting, responses: this.greetings, name: 'greeting' },
      { pattern: this.patterns.farewell, responses: this.farewells, name: 'farewell' },
      { pattern: this.patterns.thanks, responses: this.thanks, name: 'thanks' },
      { pattern: this.patterns.howAreYou, responses: this.howAreYou, name: 'howAreYou' },
      { pattern: this.patterns.whoAreYou, responses: this.whoAreYou, name: 'whoAreYou' },
      { pattern: this.patterns.positive, responses: this.positive, name: 'positive' },
      { pattern: this.patterns.negative, responses: this.negative, name: 'negative' },
    ];

    for (const check of checks) {
      if (check.pattern.test(normalizedQuery)) {
        return {
          matched: true,
          patternName: check.name,
          response: this.getRandomResponse(check.responses)
        };
      }
    }

    return { matched: false };
  }

  /**
   * ✅ СТАТИСТИКА
   */
  getStats(): { totalResponses: number; categories: string[]; responsesByCategory: Record<string, number> } {
    return {
      totalResponses: 
        this.greetings.length + 
        this.farewells.length + 
        this.thanks.length + 
        this.howAreYou.length + 
        this.whoAreYou.length + 
        this.positive.length + 
        this.negative.length,
      categories: [
        'greetings', 'farewells', 'thanks', 
        'howAreYou', 'whoAreYou', 'positive', 'negative'
      ],
      responsesByCategory: {
        greetings: this.greetings.length,
        farewells: this.farewells.length,
        thanks: this.thanks.length,
        howAreYou: this.howAreYou.length,
        whoAreYou: this.whoAreYou.length,
        positive: this.positive.length,
        negative: this.negative.length,
      }
    };
  }

  /**
   * ✅ ДОБАВИТЬ НОВЫЙ ОТВЕТ (для расширения в будущем)
   */
  addResponse(category: string, answer: string): void {
    const response: CannedResponse = { answer };
    
    switch (category) {
      case 'greeting':
        this.greetings.push(response);
        break;
      case 'farewell':
        this.farewells.push(response);
        break;
      case 'thanks':
        this.thanks.push(response);
        break;
      case 'howAreYou':
        this.howAreYou.push(response);
        break;
      case 'whoAreYou':
        this.whoAreYou.push(response);
        break;
      case 'positive':
        this.positive.push(response);
        break;
      case 'negative':
        this.negative.push(response);
        break;
      default:
        console.warn(`⚠️ Unknown category: ${category}`);
    }
    
    console.log(`✅ [CANNED] Added new response to ${category}`);
  }
}