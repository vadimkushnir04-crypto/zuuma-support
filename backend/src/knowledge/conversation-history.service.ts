// backend/src/knowledge/conversation-history.service.ts
import { Injectable } from '@nestjs/common';

interface ConversationMessage {
  role: string;
  content: string;
  timestamp?: Date;
}

@Injectable()
export class ConversationHistoryService {
  
  // Максимальное количество сообщений в истории
  private readonly MAX_HISTORY_SIZE = 20;
  
  // Количество последних сообщений для контекста
  private readonly RECENT_CONTEXT_SIZE = 10;

  /**
   * Умная обрезка истории
   * - Сохраняет только последние N сообщений
   * - Всегда сохраняет system сообщения
   */
  trimHistory(
    history: ConversationMessage[], 
    maxSize: number = this.RECENT_CONTEXT_SIZE
  ): ConversationMessage[] {
    if (!history || history.length === 0) return [];

    // Отделяем system сообщения от остальных
    const systemMessages = history.filter(m => m.role === 'system');
    const nonSystemMessages = history.filter(m => m.role !== 'system');

    // Берем последние N сообщений (без system)
    const recentMessages = nonSystemMessages.slice(-maxSize);

    // Возвращаем: [system сообщения] + [последние N сообщений]
    return [...systemMessages, ...recentMessages];
  }

  /**
   * Проверяет, нужно ли сбросить историю
   * Признаки завершения диалога:
   * - Пользователь говорит "спасибо", "всё", "понятно", "ок"
   * - И бот дал финальный ответ
   */
  shouldResetHistory(
    lastUserMessage: string,
    lastAssistantMessage: string,
    historyLength: number
  ): boolean {
    // Не сбрасываем если диалог только начался
    if (historyLength < 4) return false;

    const userSatisfactionPhrases = [
      'спасибо', 'благодарю', 'всё понятно', 'всё ясно', 
      'понял', 'поняла', 'разобрался', 'разобралась',
      'достаточно', 'хватит', 'всё', 'ок', 'окей', 'okay',
      'отлично', 'супер', 'класс', 'thanks', 'got it'
    ];

    const assistantClosingPhrases = [
      'обращайтесь', 'рад был помочь', 'всего доброго', 
      'удачи', 'до свидания', 'если что-то еще', 
      'пишите', 'если будут вопросы'
    ];

    const userLower = lastUserMessage.toLowerCase();
    const assistantLower = lastAssistantMessage.toLowerCase();

    // Проверяем удовлетворенность пользователя
    const userSatisfied = userSatisfactionPhrases.some(phrase => 
      userLower.includes(phrase)
    );

    // Проверяем завершающую фразу бота
    const botClosing = assistantClosingPhrases.some(phrase => 
      assistantLower.includes(phrase)
    );

    return userSatisfied && botClosing;
  }

  /**
   * Детектирует начало нового топика
   * Признаки:
   * - Сильное изменение темы
   * - Новое приветствие после долгого диалога
   * - Ключевые слова смены темы
   */
  isNewTopicStarting(
    currentMessage: string,
    history: ConversationMessage[]
  ): boolean {
    if (!history || history.length < 4) return false;

    const topicChangePhrases = [
      'другой вопрос', 'кстати', 'а еще', 'а можно еще',
      'теперь другое', 'меняю тему', 'другая тема',
      'а теперь', 'а вот еще'
    ];

    const messageLower = currentMessage.toLowerCase();

    return topicChangePhrases.some(phrase => messageLower.includes(phrase));
  }

  /**
   * Определяет важность сообщения для сохранения в истории
   * Менее важные можно удалять при обрезке
   */
  getMessageImportance(message: ConversationMessage): number {
    // system сообщения - самые важные
    if (message.role === 'system') return 10;

    const content = message.content.toLowerCase();

    // Высокая важность - содержит ключевую информацию
    if (
      content.includes('проблема') ||
      content.includes('ошибка') ||
      content.includes('не работает') ||
      content.includes('помогите') ||
      content.length > 100
    ) {
      return 8;
    }

    // Средняя важность - обычный диалог
    if (message.role === 'user' || message.role === 'assistant') {
      return 5;
    }

    // Низкая важность - small talk
    const smallTalkPhrases = ['привет', 'спасибо', 'ок', 'пока'];
    if (smallTalkPhrases.some(phrase => content.includes(phrase))) {
      return 2;
    }

    return 3;
  }

  /**
   * Умная очистка истории с сохранением важных сообщений
   */
  smartTrimHistory(
    history: ConversationMessage[],
    maxSize: number = this.RECENT_CONTEXT_SIZE
  ): ConversationMessage[] {
    if (!history || history.length <= maxSize) return history;

    // Добавляем важность к каждому сообщению
    const messagesWithImportance = history.map(msg => ({
      message: msg,
      importance: this.getMessageImportance(msg),
    }));

    // Всегда сохраняем system сообщения
    const systemMessages = messagesWithImportance.filter(
      m => m.message.role === 'system'
    );

    // Остальные сообщения сортируем по важности и новизне
    const nonSystemMessages = messagesWithImportance.filter(
      m => m.message.role !== 'system'
    );

    // Берем последние N сообщений + важные из прошлого
    const recentCount = Math.floor(maxSize * 0.7); // 70% - последние
    const importantCount = maxSize - recentCount - systemMessages.length; // 30% - важные

    const recentMessages = nonSystemMessages.slice(-recentCount);
    
    const importantMessages = nonSystemMessages
      .slice(0, -recentCount)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, importantCount);

    // Собираем финальную историю
    const finalHistory = [
      ...systemMessages,
      ...importantMessages,
      ...recentMessages,
    ]
      .sort((a, b) => {
        // Сортируем по timestamp если есть, иначе по порядку
        const timeA = a.message.timestamp?.getTime() || 0;
        const timeB = b.message.timestamp?.getTime() || 0;
        return timeA - timeB;
      })
      .map(m => m.message);

    console.log(`🧠 Smart history trim: ${history.length} → ${finalHistory.length} messages`);

    return finalHistory;
  }

  /**
   * Получить summary последнего N сообщений
   * Полезно для показа пользователю
   */
  getSummary(history: ConversationMessage[], lastN: number = 5): string {
    if (!history || history.length === 0) return 'История пуста';

    const recentMessages = history
      .filter(m => m.role !== 'system')
      .slice(-lastN);

    const summary = recentMessages
      .map((msg, i) => {
        const role = msg.role === 'user' ? '👤 Вы' : '🤖 Бот';
        const preview = msg.content.substring(0, 50);
        return `${i + 1}. ${role}: ${preview}${msg.content.length > 50 ? '...' : ''}`;
      })
      .join('\n');

    return summary;
  }
}