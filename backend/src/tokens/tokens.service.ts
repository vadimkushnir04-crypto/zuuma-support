import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenBalance } from './token-balance.entity';
import { TokenTransaction } from './token-transaction.entity';
import { AssistantLimit } from './assistant-limit.entity';
import { Plan } from './plan.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class TokensService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getBalance(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }
    
    return {
      total_tokens: String(user.tokens_limit || 0),
      used_tokens: String(user.tokens_used || 0),
      plan: user.plan || 'free'
    };
  }

  async consumeTokens(userId: string, amount: number, assistantId?: string, meta?: any) {

    console.log('🔍 consumeTokens called from:', new Error().stack?.split('\n')[2]);

    return this.dataSource.transaction(async manager => {
      const userRepo = manager.getRepository(User);
      const txRepo = manager.getRepository(TokenTransaction);

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) throw new BadRequestException('Пользователь не найден');

      // ✅ ИСПРАВЛЕНО: Правильная конвертация BigInt → Number
      const tokensUsed = Number(user.tokens_used || 0);
      const tokensLimit = Number(user.tokens_limit || 0);
      const remaining = tokensLimit - tokensUsed;
      
      console.log('💰 Token check:', {
        userId,
        amount,
        used: tokensUsed,
        limit: tokensLimit,
        remaining
      });

      // ✅ ИСПРАВЛЕНО: Проверяем ПЕРЕД списанием
      if (amount > remaining) {
        console.error('❌ Insufficient tokens:', { amount, remaining });
        throw new BadRequestException('Недостаточно токенов');
      }

      // ✅ ИСПРАВЛЕНО: Правильное сложение
      const newTokensUsed = tokensUsed + amount;
      
      // Обновляем tokens_used в таблице users
      user.tokens_used = newTokensUsed;
      await userRepo.save(user);

      // Сохраняем транзакцию
      const tx = txRepo.create({ 
        user_id: userId, 
        type: 'consume', 
        amount: amount.toString(), // Сохраняем как строку для БД
        assistant_id: assistantId, 
        meta 
      });
      await txRepo.save(tx);

      const newRemaining = tokensLimit - newTokensUsed;
      console.log(`✅ Списано токенов: ${amount}. Осталось: ${newRemaining}`);

      return { 
        balance: {
          total_tokens: String(tokensLimit),
          used_tokens: String(newTokensUsed),
          remaining: String(newRemaining)
        }, 
        tx 
      };
    });
  }

  /**
   * Начисление токенов пользователю (для подписок и покупок)
   */
  async topUpTokens(
    userId: string,
    amount: number,
    description?: string
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Создаем транзакцию пополнения
      const transaction = manager.create('token_transactions', {
        user_id: userId,
        type: 'topup',
        amount: amount,
        meta: {
          description: description || 'Пополнение токенов',
          timestamp: new Date(),
        },
      });

      await manager.save('token_transactions', transaction);

      // Обновляем баланс пользователя
      await manager.query(
        `
        INSERT INTO token_balances (user_id, total_tokens, used_tokens, updated_at)
        VALUES ($1, $2, 0, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET 
          total_tokens = token_balances.total_tokens + $2,
          updated_at = NOW()
        `,
        [userId, amount]
      );

      // Обновляем лимит в таблице users
      await manager.query(
        `
        UPDATE users 
        SET tokens_limit = tokens_limit + $1,
            updated_at = NOW()
        WHERE id = $2
        `,
        [amount, userId]
      );

      console.log(`✅ Начислено ${amount} токенов пользователю ${userId}`);
    });
  }

  async getTransactions(userId: string): Promise<TokenTransaction[]> {
    const txRepo = this.dataSource.getRepository(TokenTransaction);
    return txRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 50
    });
  }

  async syncUserWithPlan(userId: string) {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (!user) throw new BadRequestException('Пользователь не найден');

  const plan = await this.dataSource.getRepository(Plan).findOne({ 
    where: { slug: user.plan || 'free' } 
  });
  
  if (!plan) throw new BadRequestException('План не найден');

  // Синхронизируем лимиты
  user.tokens_limit = parseInt(plan.monthly_tokens);
  user.assistants_limit = 
    plan.slug === 'free' ? 1 :
    plan.slug === 'pro' ? 10 :
    plan.slug === 'max' ? 50 : 1;

  await this.userRepository.save(user);

  return {
    plan: user.plan,
    tokensLimit: user.tokens_limit,
    tokensUsed: user.tokens_used,
    assistantsLimit: user.assistants_limit,
  };
}

  async upgradePlan(userId: string, newPlanSlug: string) {
    // ✅ Используем dataSource вместо planRepository
    const newPlan = await this.dataSource.getRepository(Plan).findOne({ 
      where: { slug: newPlanSlug } 
    });
    
    if (!newPlan) {
      throw new Error('План не найден');
    }

    const user = await this.userRepository.findOne({ 
      where: { id: userId } 
    });
    
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // ✅ Обновляем ОБА поля
    user.plan = newPlan.slug as 'free' | 'pro' | 'max';
    user.tokens_limit = parseInt(newPlan.monthly_tokens);
    user.tokens_used = 0;
    user.assistants_limit = 
      newPlan.slug === 'free' ? 1 :
      newPlan.slug === 'pro' ? 10 :
      newPlan.slug === 'max' ? 50 : 1;

    await this.userRepository.save(user);

    return {
      success: true,
      plan: newPlan.slug,
      tokensLimit: user.tokens_limit,
      assistantsLimit: user.assistants_limit,
    };
  }

    // ✅ ДОБАВЬТЕ СЮДА:
  async getAllPlans() {
    const plans = await this.dataSource.getRepository(Plan).find({
      order: { price_cents: 'ASC' },
    });
    
    return plans;
  }

  async getDetailedAnalytics(userId: string, range: string = '30d') {
    const txRepo = this.dataSource.getRepository('TokenTransaction');
    const userRepo = this.dataSource.getRepository(User);
    
    const user = await userRepo.findOne({ where: { id: userId }});
    
    // ✅ Определяем даты на основе range
    let daysAgo = 30;
    if (range === '7d') daysAgo = 7;
    else if (range === '30d') daysAgo = 30;
    else if (range === '3m') daysAgo = 90;
    
    const from = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
    const to = new Date();
    
    // ✅ Дневное использование токенов
    const dailyUsage = await txRepo
      .createQueryBuilder('tx')
      .select("TO_CHAR(tx.created_at, 'DD.MM') as date")
      .addSelect('SUM(CASE WHEN tx.type = \'consume\' THEN CAST(tx.amount AS bigint) ELSE 0 END) as tokens')
      .addSelect('COUNT(CASE WHEN tx.type = \'consume\' THEN 1 END) as chats')
      .where('tx.user_id = :userId', { userId })
      .andWhere('tx.created_at BETWEEN :from AND :to', { from, to })
      .groupBy('date')
      .orderBy('MIN(tx.created_at)', 'ASC')
      .getRawMany();

    // ✅ ИСПРАВЛЕНО: Использование по ассистентам С ИМЕНАМИ
    const assistantUsage = await this.dataSource.query(`
      SELECT 
        a.id as assistant_id,
        a.name as assistant_name,
        COUNT(tx.id) as requests,
        SUM(CAST(tx.amount AS bigint)) as total_tokens
      FROM token_transactions tx
      LEFT JOIN assistants a ON tx.assistant_id = a.id
      WHERE tx.user_id = $1
        AND tx.type = 'consume'
        AND tx.created_at BETWEEN $2 AND $3
      GROUP BY a.id, a.name
      ORDER BY total_tokens DESC
    `, [userId, from, to]);

    // ✅ Активность по часам (последние 7 дней)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const hourlyActivity = await txRepo
      .createQueryBuilder('tx')
      .select("EXTRACT(HOUR FROM tx.created_at) as hour")
      .addSelect('COUNT(*) as activity')
      .where('tx.user_id = :userId', { userId })
      .andWhere('tx.created_at > :sevenDaysAgo', { sevenDaysAgo })
      .groupBy('hour')
      .orderBy('hour')
      .getRawMany();

    // ✅ НОВАЯ СТАТИСТИКА: Общая за период
    const periodStats = await txRepo
      .createQueryBuilder('tx')
      .select('COUNT(*) as total_requests')
      .addSelect('SUM(CAST(tx.amount AS bigint)) as total_tokens_used')
      .addSelect('AVG(CAST(tx.amount AS bigint)) as avg_tokens_per_request')
      .where('tx.user_id = :userId', { userId })
      .andWhere('tx.type = :type', { type: 'consume' })
      .andWhere('tx.created_at BETWEEN :from AND :to', { from, to })
      .getRawOne();

    // ✅ НОВАЯ СТАТИСТИКА: Топ-3 ассистента
    const topAssistants = assistantUsage.slice(0, 3);

    // ✅ НОВАЯ СТАТИСТИКА: Прогноз окончания токенов
    const tokensUsed = Number(user?.tokens_used || 0);
    const tokensLimit = Number(user?.tokens_limit || 0);
    const remaining = tokensLimit - tokensUsed;
    
    const avgPerDay = periodStats.total_tokens_used 
      ? Number(periodStats.total_tokens_used) / daysAgo 
      : 0;
    
    const daysLeft = avgPerDay > 0 ? Math.floor(remaining / avgPerDay) : -1;

    return {
      dailyUsage,
      assistantUsage,
      hourlyActivity,
      periodStats: {
        totalRequests: Number(periodStats.total_requests || 0),
        totalTokensUsed: Number(periodStats.total_tokens_used || 0),
        avgTokensPerRequest: Math.round(Number(periodStats.avg_tokens_per_request || 0)),
        daysInPeriod: daysAgo,
        avgTokensPerDay: Math.round(avgPerDay),
        daysLeft: daysLeft > 0 ? daysLeft : null,
      },
      topAssistants,
      user
    };
  }
}