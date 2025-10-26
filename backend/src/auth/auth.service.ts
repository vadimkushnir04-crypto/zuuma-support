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
    // Инициализация Resend для отправки писем
    if (process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      this.resend = new Resend(process.env.RESEND_API_KEY);
      console.log('📧 Resend initialized');
    } else {
      console.warn('⚠️ RESEND_API_KEY not found, emails disabled');
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
      user.avatar_url = googleData.picture || user.avatar_url;
      user.email_verified = true;
      // ✅ НЕ МЕНЯЕМ provider! Пользователь может входить обоими способами
      user = await this.userRepository.save(user);
    } else {
      console.log('✅ Existing Google user login:', user.id);
    }

    user.last_login_at = new Date();
    await this.userRepository.save(user);

    const token = this.generateToken(user.id, user.email);
    return { user: this.sanitizeUser(user), token };
  }

  // ================================
  // РЕГИСТРАЦИЯ (Email + пароль)
  // ================================

/**
 * Регистрация нового пользователя по email и паролю
 * - Проверяет существование пользователя
 * - Для Google-аккаунтов добавляет пароль
 * - Генерирует токен верификации email
 * - Отправляет письмо с подтверждением
 */
async register(
  email: string, 
  password: string, 
  fullName?: string, 
  ipAddress?: string
) {
  console.log('📝 Register attempt:', { email, fullName });
  
  // ============================================
  // 1. Проверяем существует ли пользователь
  // ============================================
  const existingUser = await this.userRepository.findOne({ 
    where: { email } 
  });
  
  if (existingUser) {
    // ✅ Случай: пользователь зарегистрирован через Google, хочет добавить пароль
    if (!existingUser.password) {
      console.log('🔗 Adding password to existing Google account:', existingUser.id);
      
      // Валидация пароля
      if (password.length < 8) {
        throw new BadRequestException('Пароль должен содержать минимум 8 символов');
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      existingUser.password = hashedPassword;
      existingUser.updated_at = new Date();
      
      const updatedUser = await this.userRepository.save(existingUser);
      const token = this.generateToken(updatedUser.id, updatedUser.email);
      
      console.log('✅ Password added to Google account:', updatedUser.id);
      
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
          emailVerified: updatedUser.email_verified,
        },
        token,
      };
    }
    
    // Пользователь уже существует с паролем
    throw new BadRequestException('Email уже зарегистрирован');
  }

  // ============================================
  // 2. Валидация нового пользователя
  // ============================================
  if (password.length < 8) {
    throw new BadRequestException('Пароль должен содержать минимум 8 символов');
  }

  // ============================================
  // 3. Подготовка данных
  // ============================================
  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = randomBytes(32).toString('hex');

  // ============================================
  // 4. Создание пользователя
  // ============================================
  const user = this.userRepository.create({
    email,
    password: hashedPassword,
    full_name: fullName || null,
    provider: 'local',
    plan: 'free',
    tokens_limit: 100000,
    tokens_used: 0,
    assistants_limit: 3,
    email_verified: false,
    email_verification_token: verificationToken,
    consent_given_at: new Date(),
    consent_ip_address: ipAddress || null,
    agreed_to_data_transfer: false,
    last_login_at: new Date(),
  });

  const savedUser = await this.userRepository.save(user);
  
  console.log('✅ User created:', savedUser.id);

  // ============================================
  // 5. Отправка письма с подтверждением
  // ============================================
  try {
    await this.sendVerificationEmail(savedUser);
    console.log('📧 Verification email sent to:', email);
  } catch (emailError) {
    console.error('⚠️ Failed to send verification email:', emailError.message);
    // Не бросаем ошибку - регистрация прошла успешно
  }

  // ============================================
  // 6. Генерация JWT токена
  // ============================================
  const token = this.generateToken(savedUser.id, savedUser.email);

  console.log('✅ Registration successful:', savedUser.id);

  // ============================================
  // 7. Возврат результата
  // ============================================
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
      emailVerified: savedUser.email_verified,
    },
    token,
  };
}

    // ============================================
    // МЕТОД: Отправка письма с верификацией
    // ============================================
    
    async sendVerificationEmail(user: User): Promise<void> {
      if (!user.email_verification_token) {
        console.error('❌ No verification token for user:', user.id);
        return;
      }
      
      if (!this.resend) {
        console.error('❌ Resend not initialized');
        return;
      }

      const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.email_verification_token}`;

      try {
        console.log('📧 Sending verification email to:', user.email);
        
      await this.resend.emails.send({
        from: 'Zuuma <noreply@zuuma.ru>',
        to: user.email,
        subject: 'Добро пожаловать в Zuuma — подтвердите ваш email',
        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 24px;
            border: 1px solid #eee;
            border-radius: 10px;
            background: #fafafa;
          ">
            <h2 style="color: #10b981; margin-bottom: 16px;">
              Привет! Меня зовут Вадим — я основатель платформы <strong>Zuuma</strong>
            </h2>

            <p style="font-size: 15px; color: #333; line-height: 1.6;">
              Благодарю, что выбрали мою платформу!  
              Мне действительно приятно видеть, что вы с нами.  
              Чтобы начать пользоваться Zuuma, подтвердите свой email:
            </p>

            <a href="${verifyUrl}" style="
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 24px 0;
            ">
              Подтвердить email
            </a>

            <p style="margin-top: 16px; font-size: 13px; color: #555;">
              Или перейдите по ссылке: <br>
              <a href="${verifyUrl}" style="color: #10b981;">${verifyUrl}</a>
            </p>

            <hr style="margin: 28px 0; border: 0; border-top: 1px solid #eee;">

            <p style="font-size: 12px; color: #888; line-height: 1.5;">
              Спасибо, что доверяете <strong>Zuuma</strong> — это действительно важно для меня.<br>
              Это письмо отправлено автоматически, но если хотите связаться лично —  
              напишите мне на <a href="mailto:vadim.kushnir.04@gmail.com" style="color: #10b981;">vadim.kushnir.04@gmail.com</a>.
            </p>
          </div>
        `,
      });
        
        console.log('✅ Verification email sent successfully');
      } catch (error) {
        console.error('❌ Resend error:', error);
        throw error;
      }
    }

    // ============================================
    // МЕТОД: Верификация email по токену
    // ============================================
    async verifyEmail(token: string) {
      const user = await this.userRepository.findOne({
        where: { email_verification_token: token }
      });

      if (!user) {
        throw new BadRequestException('Неверный или устаревший токен');
      }

      if (user.email_verified) {
        throw new BadRequestException('Email уже подтвержден');
      }

      user.email_verified = true;
      user.email_verification_token = null;
      user.updated_at = new Date();

      await this.userRepository.save(user);

      return {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
      };
    }

  // ================================
  // ВХОД
  // ================================

  async login(email: string, password: string, ipAddress?: string) {
    console.log('🔑 Login attempt:', { email });
    
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id', 'email', 'password', 'full_name', 'avatar_url', 
        'provider', 'plan', 'tokens_used', 'tokens_limit', 
        'assistants_limit', 'created_at', 'email_verified', 'google_id'
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // ✅ ИСПРАВЛЕННАЯ ЛОГИКА: Проверяем только наличие пароля
    if (!user.password) {
      // Пользователь зарегистрирован через Google и не установил пароль
      throw new BadRequestException({
        message: 'Этот email зарегистрирован через Google. Используйте вход через Google или установите пароль через регистрацию.',
        provider: 'google',
        hasGoogleAccount: true
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    user.last_login_at = new Date();
    await this.userRepository.save(user);

    const token = this.generateToken(user.id, user.email);

    console.log('✅ Login successful:', user.id);

    return {
      user: {
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
      },
      token,
    };
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

    // ============================================
    // ПРИВАТНЫЙ МЕТОД: Генерация JWT токена
    // ============================================
    private generateToken(userId: string, email: string): string {
      const payload = { id: userId, email };
      console.log('🔐 Generating token with payload:', payload);
      return this.jwtService.sign(payload);
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