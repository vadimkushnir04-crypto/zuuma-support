// backend/src/auth/admin.guard.ts

import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  UnauthorizedException, 
  ForbiddenException 
} from '@nestjs/common';

const ADMIN_EMAILS = [
  'delovoi.acount@gmail.com', 
];

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Из JwtAuthGuard
    
    if (!user || !user.email) {
      throw new UnauthorizedException('Не авторизован');
    }
    
    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      throw new ForbiddenException('Доступ запрещен');
    }
    
    return true;
  }
}