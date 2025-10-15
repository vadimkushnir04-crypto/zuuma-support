// backend/src/support/escalation-tools.ts

export const ESCALATION_TOOL = {
  type: 'function' as const,
  function: {
    name: 'escalate_to_human',
    description: `⚠️ EMERGENCY ONLY - Transfer to human support agent.

🚫 NEVER USE FOR:
- File/image/logo/document requests (files attach automatically!)
- Information requests (use knowledge base!)
- Normal questions (answer them yourself!)
- First-time requests (try helping first!)

✅ ONLY USE WHEN:
- User EXPLICITLY demands human 3+ times ("give me operator NOW!")
- User extremely angry, cursing repeatedly
- Legal/refund demands
- Technically impossible without admin access

DEFAULT: DO NOT ESCALATE. Help the user yourself.`,
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Причина эскалации (краткое описание проблемы)',
        },
        urgency: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Уровень срочности: low - обычный вопрос, medium - требует внимания, high - критическая ситуация',
        },
      },
      required: ['reason', 'urgency'],
    },
  },
};

export const ESCALATION_SYSTEM_PROMPT = `
🚨 CRITICAL ESCALATION RULES:

❌ NEVER ESCALATE FOR:
1. File/image/logo requests - YOU CAN PROVIDE THEM (they attach automatically)
2. Information in knowledge base - USE IT
3. Normal customer questions - ANSWER THEM
4. First contact - HELP FIRST

✅ ONLY ESCALATE IF:
1. User demands human 3+ times explicitly
2. User extremely angry (cursing repeatedly across multiple messages)
3. Legal threats or refund demands
4. Technically impossible (needs database/admin access)

📎 FILES ARE AUTOMATIC:
When user asks "show logo", "send file", "give document" - files attach to YOUR response automatically. DO NOT escalate. Just say "Here's the file!" confidently.

DEFAULT ACTION: SOLVE IT YOURSELF. Escalation is LAST RESORT only.
`;