// backend/src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  HttpException,
  HttpStatus,
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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {
    // Guard автоматически перенаправит на страницу входа Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    try {
      const { token } = req.user;
      const frontendUrl = process.env.FRONTEND_URL || 'https://zuuma.ru';

      console.log('🔐 Setting cookie for Google auth');
      
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(`${frontendUrl}/`);
    } catch (error: any) {
      console.error('❌ Google auth error:', error);
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

    console.log('📝 Register attempt:', { email: body.email, fullName: body.fullName });

    try {
      const result = await this.authService.register(
        body.email,
        body.password,
        body.fullName,
        ipAddress,
      );

      console.log('✅ Registration successful:', result.user.id);

      return {
        success: true,
        message: result.message || 'Регистрация успешна. Проверьте почту для подтверждения email.',
        user: result.user,
        requiresVerification: result.requiresVerification || false,
      };
    } catch (err: any) {
      console.error('❌ Registration error:', err.message);
      
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
  async verifyEmail(
    @Body() body: { token: string },
    @Req() req: any,
  ) {
    try {
      if (!body.token) {
        throw new Error('Токен не предоставлен');
      }

      const result = await this.authService.verifyEmail(body.token);

      return {
        success: true,
        message: result.message,
        user: {
          userId: result.userId,
          email: result.email,
          fullName: result.fullName,
        },
      };
    } catch (err: any) {
      throw new HttpException(
        { success: false, error: err.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ============================================
  // ПОВТОРНАЯ ОТПРАВКА ПИСЬМА
  // ============================================

  @Post('resend-verification')
  async resendVerification(
    @Body() body: { email: string },
  ) {
    try {
      if (!body.email) {
        throw new Error('Email не предоставлен');
      }

      const result = await this.authService.resendVerificationEmail(body.email);

      return {
        success: true,
        message: result.message,
      };
    } catch (err: any) {
      throw new HttpException(
        { success: false, error: err.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ============================================
  // ВХОД
  // ============================================

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: any,
    @Res() res: Response,
  ) {
    const ipAddress = this.getClientIp(req);

    console.log('🔑 Login attempt:', { email: body.email });

    try {
      const result = await this.authService.login(body.email, body.password, ipAddress);
      
      console.log('🔐 Setting cookie for email login');
      
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      console.log('✅ Login successful:', result.user.id);

      return res.json({ success: true, user: result.user });
    } catch (err: any) {
      console.error('❌ Login error:', err.message);
      
      // ✅ Специальная обработка ошибки неподтвержденного email
      if (err.response?.requiresVerification) {
        throw new HttpException(
          {
            success: false,
            error: err.response.message,
            requiresVerification: true,
            email: err.response.email,
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
      
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
  async getProfile(@Req() req: any) {
    const userId = req.user.id || req.user.userId;

    console.log('👤 Getting profile for user:', userId);

    try {
      const userProfile = await this.authService.getProfileById(userId);
      return { success: true, user: userProfile };
    } catch (err: any) {
      console.error('❌ Profile error:', err.message);
      throw new HttpException(
        { success: false, error: err.message },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Body() body: { fullName?: string },
    @Req() req: any,
  ) {
    const userId = req.user.id || req.user.userId;

    console.log('✏️ Updating profile for user:', userId);

    try {
      const updatedUser = await this.authService.updateProfileById(userId, body.fullName);
      return { success: true, user: updatedUser };
    } catch (err: any) {
      console.error('❌ Profile update error:', err.message);
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
    console.log('👋 User logging out');
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