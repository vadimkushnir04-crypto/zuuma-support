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
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  }

  /**
   * Обработка callback от Google после успешной авторизации
   * GET /api/auth/google/callback
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    try {
      const { token } = req.user;
      const frontendUrl = process.env.FRONTEND_URL || 'https://zuuma.ru';

      // Ставим куку с токеном
      res.cookie('token', token, {
        httpOnly: true,      // защищает от XSS
        secure: true,        // только HTTPS
        sameSite: 'lax',     // совместимость с редиректами
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      });

      // Редиректим на главную
      return res.redirect(`${frontendUrl}/`);
    } catch (error: any) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://zuuma.ru';
      return res.redirect(`${frontendUrl}?error=${encodeURIComponent(error.message)}`);
    }
  }
  // ============================================
  // РЕГИСТРАЦИЯ
  // ============================================

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; fullName?: string },
    @Req() req: any,
  ) {
    const ipAddress = this.getClientIp(req);

    try {
      const result = await this.authService.register(
        body.email,
        body.password,
        body.fullName,
        ipAddress,
      );

      // Отправляем письмо с подтверждением
      await this.authService.sendVerificationEmail(result.user);

      return {
        success: true,
        message: 'Регистрация успешна. Проверьте почту для подтверждения email.',
        user: result.user,
      };
    } catch (err: any) {
      // Специальная ошибка для Google
      if (err.message.includes('Google') || err.message.includes('google')) {
        throw new BadRequestException(
          'Этот email зарегистрирован через Google. Используйте вход через Google.',
        );
      }

      throw new HttpException(
        { success: false, error: err.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ============================================
  // ПОДТВЕРЖДЕНИЕ EMAIL
  // ============================================

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    try {
      await this.authService.verifyEmail(body.token);
      return { success: true, message: 'Email успешно подтверждён.' };
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Неверный или просроченный токен.');
    }
  }

  // ============================================
  // ВХОД
  // ============================================

  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Req() req: any) {
    const ipAddress = this.getClientIp(req);

    try {
      const result = await this.authService.login(body.email, body.password, ipAddress);
      return { success: true, ...result };
    } catch (err: any) {
      // Специальная ошибка для Google
      if (err.message.includes('Google') || err.message.includes('google')) {
        throw new BadRequestException(
          'Этот email зарегистрирован через Google. Используйте вход через Google.',
        );
      }

      throw new HttpException(
        { success: false, error: err.message },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  // ============================================
  // ПРОФИЛЬ
  // ============================================

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Headers('authorization') authHeader: string, @Req() req: any) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Токен не предоставлен');
    }

    const token = authHeader.substring(7);
    try {
      const userProfile = await this.authService.getProfile(token);
      return { success: true, user: userProfile };
    } catch (err: any) {
      throw new HttpException(
        { success: false, error: err.message },
        HttpStatus.UNAUTHORIZED,
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
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Токен не предоставлен');
    }

    const token = authHeader.substring(7);

    try {
      const updatedUser = await this.authService.updateProfile(token, body.fullName);
      return { success: true, user: updatedUser };
    } catch (err: any) {
      throw new HttpException(
        { success: false, error: err.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ============================================
  // ВЫХОД
  // ============================================

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res() res: Response) {
    res.clearCookie('token');
    return res.json({ success: true, message: 'Выход выполнен успешно.' });
  }

  // ============================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ============================================

  private getClientIp(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      (req as any).ip ||
      'unknown'
    );
  }
}