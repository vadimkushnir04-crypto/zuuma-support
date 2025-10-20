// backend/src/common/api-access.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

/**
 * Guard для проверки доступа к API
 * API доступен только для тарифов Pro и Max
 */
@Injectable()
export class ApiAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    
    if (!userId) {
      throw new ForbiddenException('Пользователь не авторизован');
    }
    
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new ForbiddenException('Пользователь не найден');
    }
    
    // ✅ API доступен только для Pro и Max
    if (user.plan === 'free') {
      throw new ForbiddenException(
        'API доступ доступен только на тарифах Pro и Max. ' +
        'Обновите тариф для использования API.'
      );
    }
    
    console.log(`✅ API access granted for user ${userId} (plan: ${user.plan})`);
    return true;
  }
}