// backend/src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
let Resend: any; // Динамический импорт

@Injectable()
export class AuthService {
  private resend: any;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    // Динамический импорт Resend (если не установлен — fallback)
    if (process.env.RESEND_API_KEY) {
      Resend = require('resend').Resend;
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  // ================================
  // GOOGLE OAUTH
  // ================================

  async validateGoogleUser(googleData: {
    email: string;
    fullName: string;
    picture?: string;
    googleId: string;
  }) {
    let user = await this.userRepository.findOne({
      where: [{ google_id: googleData.googleId }, { email: googleData.email }],
    });

    if (!user) {
      // Новый пользователь через Google
      user = this.userRepository.create({
        email: googleData.email,
        google_id: googleData.googleId,
        full_name: googleData.fullName,
        avatar_url: googleData.picture || null,
        provider: 'google',
        email_verified: true,
        consent_given_at: new Date(),
      });
      user = await this.userRepository.save(user);
      console.log('✅ New Google user created:', user.id);
    } else if (!user.google_id) {
      // Привязываем Google к существующему аккаунту
      console.log(`🔗 Linking Google to existing ${user.provider} account:`, user.id);
      user.google_id = googleData.googleId;
      user.full_name = googleData.fullName;
      user.avatar_url = googleData.picture || null;
      user.email_verified = true;
      // ✅ НЕ МЕНЯЕМ provider! Оставляем 'local' если был local
      user = await this.userRepository.save(user);
    } else {
      console.log('✅ Existing Google user login:', user.id);
    }

    const token = this.generateToken(user.id, user.email);
    return { user: this.sanitizeUser(user), token };
  }

  // ================================
  // РЕГИСТРАЦИЯ (Email + пароль)
  // ================================

  async register(email: string, password: string, fullName?: string, ipAddress?: string) {
    
    console.log('📝 Register attempt:', { email, fullName });
    
    // Проверяем существует ли пользователь
    const existingUser = await this.userRepository.findOne({ where: { email } });
    
    if (existingUser) {
      // ✅ Если пользователь есть но без пароля (Google) - добавляем пароль
      if (!existingUser.password && existingUser.provider === 'google') {
        console.log('🔗 Adding password to existing Google account:', existingUser.id);
        
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUser.password = hashedPassword;
        existingUser.provider = 'local'; // Теперь может входить и по паролю
        existingUser.updated_at = new Date();
        
        const updatedUser = await this.userRepository.save(existingUser);
        const token = this.generateToken(updatedUser.id, updatedUser.email);
        
        console.log('✅ Registration successful:', updatedUser.id);
        
        return {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            fullName: updatedUser.full_name,
            avatarUrl: updatedUser.avatar_url,
            plan: updatedUser.plan,
            tokensUsed: updatedUser.tokens_used,
            tokensLimit: updatedUser.tokens_limit,
            assistantsLimit: updatedUser.assistants_limit,
            createdAt: updatedUser.created_at?.toISOString(),
          },
          token,
        };
      }
      
      throw new Error('Email уже зарегистрирован');
    }

    // Валидация пароля
    if (password.length < 8) {
      throw new Error('Пароль должен содержать минимум 8 символов');
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ✅ Генерируем токен для верификации email
    const verificationToken = randomBytes(32).toString('hex');

    // Создаем пользователя
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      full_name: fullName || null,
      provider: 'local',
      email_verified: false, // ✅ Пока не подтвержден
      email_verification_token: verificationToken, // ✅ Токен для подтверждения
      consent_given_at: new Date(),
      consent_ip_address: ipAddress || null,
      agreed_to_data_transfer: false,
      last_login_at: new Date(),
    });

    const savedUser = await this.userRepository.save(user);
    
    // ✅ Отправляем письмо с подтверждением
    try {
      await this.sendVerificationEmail(savedUser);
      console.log('📧 Verification email sent to:', email);
    } catch (emailError) {
      console.error('⚠️ Failed to send verification email:', emailError);
      // Не бросаем ошибку - регистрация прошла успешно
    }
    
    const token = this.generateToken(savedUser.id, savedUser.email);

    console.log('✅ Registration successful:', savedUser.id);

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        fullName: savedUser.full_name,
        avatarUrl: savedUser.avatar_url,
        plan: savedUser.plan,
        tokensUsed: savedUser.tokens_used,
        tokensLimit: savedUser.tokens_limit,
        assistantsLimit: savedUser.assistants_limit,
        createdAt: savedUser.created_at?.toISOString(),
        emailVerified: savedUser.email_verified, // ✅ Добавлено
      },
      token,
    };
  }

  // ================================
  // ОТПРАВКА ПИСЬМА
  // ================================

  async sendVerificationEmail(user: User) {
    if (!user.email_verification_token || !this.resend) return; // Fallback если нет Resend

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.email_verification_token}`;

    try {
      await this.resend.emails.send({
        from: 'Vadim Zuuma <no-reply@zuuma.ru>',
        to: user.email,
        subject: 'Подтвердите ваш email — Zuuma',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #10b981;">Здравствуй! Меня зовут Вадим — я основатель платформы Zuuma</h2>
            <p>Подтвердите email, чтобы начать:</p>
            <a href="${verifyUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Подтвердить email
            </a>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">
              Или перейдите по ссылке: <br>
              <a href="${verifyUrl}" style="color: #10b981;">${verifyUrl}</a>
            </p>
            <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #aaa;">
              Спасибо за то, что выбрали платформу Zuuma, это ценно для меня! Это письмо отправлено автоматически, на него ответить не получится, но если хотите задать мне вопрос лично, напишите на почту vadim.kushnir.04@gmail.com
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Resend error:', error);
      // Не бросаем ошибку — регистрация прошла
    }
  }

  // ================================
  // ПОДТВЕРЖДЕНИЕ EMAIL
  // ================================

  async verifyEmail(token: string) {
    try {
      console.log('🔍 Verifying email with token:', token.substring(0, 10) + '...');

      // Ищем пользователя по токену
      const user = await this.userRepository.findOne({
        where: { email_verification_token: token }
      });

      if (!user) {
        console.error('❌ User not found for token');
        throw new Error('Неверный или устаревший токен');
      }

      if (user.email_verified) {
        console.log('⚠️ Email already verified');
        throw new Error('Email уже подтвержден');
      }

      // Подтверждаем email
      user.email_verified = true;
      user.email_verification_token = null; // Удаляем токен после использования
      user.updated_at = new Date();

      await this.userRepository.save(user);

      console.log('✅ Email verified for user:', user.id);

      return {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
      };
    } catch (error) {
      console.error('❌ Email verification error:', error.message);
      throw error;
    }
  }

  // ================================
  // ВХОД
  // ================================

  async login(email: string, password: string, ipAddress?: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'full_name',
        'avatar_url',
        'provider',
        'plan',
        'tokens_used',
        'tokens_limit',
        'assistants_limit',
        'created_at',
        'google_id',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // ✅ Проверяем наличие пароля, а не только provider
    if (!user.password) {
      // Пользователь зарегистрирован ТОЛЬКО через Google (нет пароля)
      throw new BadRequestException(
        'Этот email зарегистрирован через Google. Используйте вход через Google.',
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    user.last_login_at = new Date();
    await this.userRepository.save(user);

    const token = this.generateToken(user.id, user.email);
    return { user: this.sanitizeUser(user), token };
  }

  // ================================
  // ПРОФИЛЬ
  // ================================

  async getProfile(token: string) {
    const payload = this.verifyToken(token);
    const user = await this.userRepository.findOne({ where: { id: payload.id } });
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    return this.sanitizeUser(user);
  }

  async updateProfile(token: string, fullName?: string) {
    const payload = this.verifyToken(token);
    const user = await this.userRepository.findOne({ where: { id: payload.id } });
    if (!user) throw new UnauthorizedException('Пользователь не найден');

    if (fullName) user.full_name = fullName;
    user.updated_at = new Date();

    const updated = await this.userRepository.save(user);
    return this.sanitizeUser(updated);
  }

  // ================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ================================

  verifyToken(token: string): { id: string; email: string } {
    try {
      const payload = this.jwtService.verify(token);
      const id = payload.id || payload.userId;
      if (!id || !payload.email) throw new Error();
      return { id, email: payload.email };
    } catch {
      throw new UnauthorizedException('Недействительный токен');
    }
  }

  private generateToken(userId: string, email: string) {
    return this.jwtService.sign({ id: userId, email });
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      plan: user.plan,
      tokensUsed: user.tokens_used,
      tokensLimit: user.tokens_limit,
      assistantsLimit: user.assistants_limit,
      createdAt: user.created_at?.toISOString(),
      emailVerified: user.email_verified,
    };
  }

    // ================================
  // МЕТОДЫ ДЛЯ GUARD-PROTECTED ENDPOINTS
  // ================================

  async getProfileById(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    return this.sanitizeUser(user);
  }

  async updateProfileById(userId: string, fullName?: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Пользователь не найден');

    if (fullName) user.full_name = fullName;
    user.updated_at = new Date();

    const updated = await this.userRepository.save(user);
    return this.sanitizeUser(updated);
  }

}