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
  UseGuards
} from '@nestjs/common';
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

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; fullName?: string },
    @Req() req: any,
  ) {
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    try {
      const result = await this.authService.register(body.email, body.password, body.fullName);
      
      // Логируем регистрацию
      await this.auditLogService.log({
        userId: result.user.id,
        action: AuditAction.LOGIN, // Используем LOGIN как регистрацию тоже
        details: {
          type: 'registration',
          email: body.email,
        },
        ipAddress,
        userAgent,
        status: 'success',
      });

      return { success: true, ...result };
    } catch (err) {
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
      const result = await this.authService.login(body.email, body.password);
      
      // Логируем успешный вход
      await this.auditLogService.log({
        userId: result.user.id,
        action: AuditAction.LOGIN,
        details: {
          type: 'login',
          email: body.email,
        },
        ipAddress,
        userAgent,
        status: 'success',
      });

      return { success: true, ...result };
    } catch (err) {
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
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';

    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Токен не предоставлен');
      }
      
      const token = authHeader.substring(7);
      const userProfile = await this.authService.getProfile(token);

      // Логируем просмотр профиля (опционально, можно убрать если слишком много логов)
      // await this.auditLogService.log({
      //   userId,
      //   action: AuditAction.PROFILE_UPDATED,
      //   details: { type: 'profile_view' },
      //   ipAddress,
      //   userAgent,
      //   status: 'success',
      // });

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
    @Body() body: { companyId?: string; fullName?: string; email?: string },
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
      const updatedUser = await this.authService.updateProfile(token, body.companyId);

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

    return { success: true, message: 'Logged out successfully' };
  }

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