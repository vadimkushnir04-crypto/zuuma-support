// backend/src/knowledge/canned-responses.service.ts
import { Injectable } from '@nestjs/common';

interface CannedResponse {
  answer: string;
}

@Injectable()
export class CannedResponsesService {
  
  private greetings: CannedResponse[] = [
    { answer: 'Привет! 😊 Чем могу помочь?' },
    { answer: 'Здравствуйте! Рад вас видеть! Как я могу помочь?' },
  ];

  private farewells: CannedResponse[] = [
    { answer: 'До свидания! Обращайтесь, если понадобится помощь! 👋' },
    { answer: 'Пока! Всего доброго! 😊' },
  ];

  private thanks: CannedResponse[] = [
    { answer: 'Пожалуйста! Всегда рад помочь! 😊' },
    { answer: 'Не за что! Обращайтесь, если будут еще вопросы!' },
  ];

  // ✅ КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Паттерны теперь требуют, чтобы это была ЕДИНСТВЕННАЯ фраза
  private patterns = {
    // Только если сообщение ЦЕЛИКОМ - это приветствие (не начинается с, а РАВНО)
    greeting: /^(привет|здравствуй|доброе утро|добрый день|добрый вечер|хай|hi|hello)[\s!.,?]*$/i,
    
    // Только если сообщение ЦЕЛИКОМ - это прощание
    farewell: /^(пока|до свидания|до встречи|bye|goodbye)[\s!.,?]*$/i,
    
    // Только если сообщение ЦЕЛИКОМ - это благодарность
    thanks: /^(спасибо|благодарю|спс|thanks|thank you)[\s!.,?]*$/i,
  };

  getCannedResponse(query: string, conversationHistory?: any[]): string | null {
    const normalizedQuery = query.toLowerCase().trim();
    
    console.log('🎯 [CANNED] Checking:', normalizedQuery);
    
    // ✅ Если уже поздоровались - не здороваемся снова
    if (conversationHistory && conversationHistory.length > 0) {
      const hasGreeted = conversationHistory.some(msg => 
        msg.role === 'assistant' && this.isGreetingResponse(msg.content)
      );
      
      if (hasGreeted && this.patterns.greeting.test(normalizedQuery)) {
        console.log('⚠️ [CANNED] Already greeted - skipping');
        return null;
      }
    }

    // ✅ Проверяем паттерны
    if (this.patterns.greeting.test(normalizedQuery)) {
      console.log('✅ [CANNED] Matched: greeting');
      return this.getRandomResponse(this.greetings);
    }

    if (this.patterns.farewell.test(normalizedQuery)) {
      console.log('✅ [CANNED] Matched: farewell');
      return this.getRandomResponse(this.farewells);
    }

    if (this.patterns.thanks.test(normalizedQuery)) {
      console.log('✅ [CANNED] Matched: thanks');
      return this.getRandomResponse(this.thanks);
    }

    console.log('❌ [CANNED] No match - forwarding to LLM');
    return null;
  }

  private isGreetingResponse(response: string): boolean {
    const greetingPhrases = ['привет', 'здравствуй', 'добрый день', 'рад вас видеть'];
    const lowerResponse = response.toLowerCase();
    return greetingPhrases.some(phrase => lowerResponse.includes(phrase));
  }

  private getRandomResponse(responses: CannedResponse[]): string {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex].answer;
  }
}