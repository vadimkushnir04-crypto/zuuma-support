import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    let token: string | undefined;

    // ✅ ВАЖНО: Сначала проверяем cookie, потом header
    // Это даёт приоритет cookie и игнорирует старые токены из localStorage
    if (request.cookies && request.cookies.token) {
      token = request.cookies.token;
      console.log('🍪 Token from cookie');
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // Fallback на header только если нет cookie
      token = authHeader.substring(7);
      console.log('🔑 Token from header (fallback)');
    }

    if (!token) {
      console.error('❌ No token found in header or cookies');
      throw new UnauthorizedException('No token provided');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      
      request.user = payload;
      console.log('✅ Authenticated user:', payload.id);
      return true;
    } catch (error) {
      console.error('❌ JWT verification failed:', error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }
}