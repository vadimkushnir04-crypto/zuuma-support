import { 
  Controller, 
  Post, 
  Get, 
  Req, 
  Res, 
  Put, 
  Body, 
  HttpException, 
  HttpStatus, 
  Headers, 
  UnauthorizedException, 
  UseGuards 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== Google OAuth ====================
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {
    // Инициирует OAuth flow, редирект на Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const { token, user } = req.user;
    
    // Редирект на фронтенд с токеном
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`
    );
  }

  // ==================== GitHub OAuth (подготовка) ====================
  // Раскомментируйте когда добавите GitHub стратегию
  /*
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth(@Req() req: Request) {
    // Инициирует OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req: any, @Res() res: Response) {
    const { token, user } = req.user;
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`
    );
  }
  */

  // ==================== Telegram Auth (подготовка) ====================
  /*
  @Post('telegram')
  async telegramAuth(@Body() body: {
    id: string;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
  }) {
    // Верифицируем данные от Telegram Widget
    // TODO: Добавить проверку hash
    
    const result = await this.authService.validateTelegramUser({
      telegramId: body.id,
      firstName: body.first_name,
      lastName: body.last_name,
      username: body.username,
      photoUrl: body.photo_url,
    });
    
    return { success: true, ...result };
  }
  */

  // ==================== Email/Password Auth (удалено - только OAuth) ====================
  // Методы register() и login() удалены, так как используется только OAuth

  // ==================== Profile Management ====================
  @Get('profile')
  async getProfile(@Headers('authorization') authHeader: string) {
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
  async updateProfile(@Headers('authorization') authHeader: string, @Body() body: { fullName?: string }) {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Токен не предоставлен');
      }
      
      const token = authHeader.substring(7);
      const updatedUser = await this.authService.updateProfile(token, body.fullName);
      return { success: true, user: updatedUser };
    } catch (err) {
      throw new HttpException(
        { success: false, error: err.message }, 
        HttpStatus.BAD_REQUEST
      );
    }
  }
}