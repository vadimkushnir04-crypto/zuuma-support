// backend/ai.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "lm-studio", // фейковый ключ
  baseURL: "http://127.0.0.1:1234/v1", // LM Studio API
});

/**
 * Запрос к LM Studio для генерации ответа
 * @param {string} systemPrompt - Системная инструкция
 * @param {string} userQuery - Вопрос пользователя
 * @returns {Promise<string>}
 */
export async function queryAI(systemPrompt, userQuery) {
  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-20b", // твоя модель в LM Studio
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
      temperature: 0.2,
    });

    const answer = response.choices?.[0]?.message?.content?.trim();

    return answer || "⚠️ LM Studio вернул пустой ответ";
  } catch (error) {
    console.error("Ошибка запроса в LM Studio:", error.message);
    return "⚠️ Ошибка при обращении к LM Studio";
  }
}
