// backend/src/auth/auth.controller.ts
import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  HttpException, 
  HttpStatus, 
  Headers, 
  UnauthorizedException,
  Req,
  Res,
  UseGuards
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuditLogService } from '../common/audit-log.service';
import { AuditAction } from '../common/entities/audit-log.entity';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ============================================
  // GOOGLE OAUTH ROUTES
  // ============================================

  /**
   * Инициирует процесс Google OAuth
   * GET /api/auth/google
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {
    // Guard автоматически перенаправит на страницу входа Google
    // Этот метод не выполняется, используется только для активации Guard
  }

  /**
   * Обработка callback от Google после успешной авторизации
   * GET /api/auth/google/callback
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    try {
      // Получаем данные пользователя из req.user (установлены GoogleStrategy)
      const { user, token } = req.user;

      console.log('✅ Google OAuth успешен, user ID:', user.id);

      // Логируем успешный вход через Google
      await this.auditLogService.log({
        userId: user.id,
        action: AuditAction.LOGIN,
        details: {
          type: 'google_oauth',
          email: user.email,
          provider: 'google',
        },
        ipAddress,
        userAgent,
        status: 'success',
      });

      // Перенаправляем на фронтенд с токеном
      const frontendUrl = process.env.FRONTEND_URL || 'https://zuuma.ru';
      
      // ✅ Фронтенд должен извлечь токен из URL и сохранить в localStorage
      res.redirect(`${frontendUrl}?token=${token}`);
    } catch (error) {
      console.error('❌ Google OAuth ошибка:', error);

      // Логируем неудачную попытку входа через Google
      await this.auditLogService.log({
        userId: 'anonymous',
        action: AuditAction.LOGIN,
        details: {
          type: 'google_oauth_failed',
          errorMessage: error.message,
        },
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: error.message,
      });

      // Перенаправляем на фронтенд с сообщением об ошибке
      const frontendUrl = process.env.FRONTEND_URL || 'https://zuuma.ru';
      res.redirect(`${frontendUrl}?error=${encodeURIComponent(error.message)}`);
    }
  }

  // ============================================
  // REGULAR AUTH ROUTES
  // ============================================

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; fullName?: string },
    @Req() req: any,
  ) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    try {
      // ✅ ИСПРАВЛЕНО: передаем ipAddress в метод register
      const result = await this.authService.register(
        body.email, 
        body.password, 
        body.fullName, 
        ipAddress
      );
      
      // Логируем регистрацию
      await this.auditLogService.log({
        userId: result.user.id,
        action: AuditAction.LOGIN,
        details: {
          type: 'registration',
          email: body.email,
          fullName: body.fullName,
          provider: 'local',
        },
        ipAddress,
        userAgent,
        status: 'success',
      });

      console.log('✅ Регистрация успешна, user ID:', result.user.id);

      return { success: true, ...result };
    } catch (err) {
      console.error('❌ Ошибка регистрации:', err.message);

      // Логируем неудачную попытку регистрации
      await this.auditLogService.log({
        userId: 'anonymous',
        action: AuditAction.LOGIN,
        details: {
          type: 'registration_failed',
          email: body.email,
        },
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: err.message,
      });

      throw new HttpException(
        { success: false, error: err.message }, 
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: any,
  ) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    try {
      // ✅ ИСПРАВЛЕНО: передаем ipAddress в метод login
      const result = await this.authService.login(body.email, body.password, ipAddress);
      
      // Логируем успешный вход
      await this.auditLogService.log({
        userId: result.user.id,
        action: AuditAction.LOGIN,
        details: {
          type: 'login',
          email: body.email,
          provider: 'local',
        },
        ipAddress,
        userAgent,
        status: 'success',
      });

      console.log('✅ Вход успешен, user ID:', result.user.id);

      return { success: true, ...result };
    } catch (err) {
      console.error('❌ Ошибка входа:', err.message);

      // Логируем неудачную попытку входа
      await this.auditLogService.log({
        userId: 'anonymous',
        action: AuditAction.LOGIN,
        details: {
          type: 'login_failed',
          email: body.email,
        },
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: err.message,
      });

      throw new HttpException(
        { success: false, error: err.message }, 
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @Headers('authorization') authHeader: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;

    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Токен не предоставлен');
      }
      
      const token = authHeader.substring(7);
      const userProfile = await this.authService.getProfile(token);

      return { success: true, user: userProfile };
    } catch (err) {
      throw new HttpException(
        { success: false, error: err.message }, 
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Headers('authorization') authHeader: string, 
    @Body() body: { fullName?: string },
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Токен не предоставлен');
      }
      
      const token = authHeader.substring(7);
      // ✅ ИСПРАВЛЕНО: передаем fullName вместо companyId
      const updatedUser = await this.authService.updateProfile(token, body.fullName);

      // Логируем обновление профиля
      await this.auditLogService.log({
        userId,
        action: AuditAction.PROFILE_UPDATED,
        details: {
          type: 'profile_update',
          changes: body,
        },
        ipAddress,
        userAgent,
        status: 'success',
      });

      return { success: true, user: updatedUser };
    } catch (err) {
      await this.auditLogService.log({
        userId,
        action: AuditAction.PROFILE_UPDATED,
        details: {
          type: 'profile_update_failed',
          changes: body,
        },
        ipAddress,
        userAgent,
        status: 'failure',
        errorMessage: err.message,
      });

      throw new HttpException(
        { success: false, error: err.message }, 
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    const userId = req.user.id;
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    // Логируем выход
    await this.auditLogService.log({
      userId,
      action: AuditAction.LOGOUT,
      details: {
        type: 'logout',
      },
      ipAddress,
      userAgent,
      status: 'success',
    });

    console.log('✅ Выход выполнен, user ID:', userId);

    return { success: true, message: 'Logged out successfully' };
  }

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================

  private getClientIp(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }
}

/*
 * ✅ ИСПРАВЛЕНИЯ В ЭТОМ ФАЙЛЕ:
 * 
 * 1. Добавлены роуты для Google OAuth:
 *    - GET /api/auth/google
 *    - GET /api/auth/google/callback
 * 
 * 2. Добавлены импорты:
 *    - Response из express
 *    - AuthGuard из @nestjs/passport
 * 
 * 3. Улучшено логирование всех действий
 * 
 * 4. Добавлены console.log для отладки
 * 
 * Это исправляет ошибку:
 * "GET /api/auth/google 404 (Not Found)"
 */