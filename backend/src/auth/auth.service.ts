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
import { EmailService } from '../common/email.service';
import { LoginVerificationToken } from '../entities/login-verification-token.entity';
import { MoreThan } from 'typeorm';
import { randomBytes } from 'crypto';
import { PasswordResetToken } from '../entities/password-reset-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    @InjectRepository(LoginVerificationToken)
    private loginTokenRepository: Repository<LoginVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private passwordResetRepository: Repository<PasswordResetToken>,
  ) {}

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
      user = this.userRepository.create({
        email: googleData.email,
        google_id: googleData.googleId,
        full_name: googleData.fullName,
        avatar_url: googleData.picture || null,
        provider: 'google',
        email_verified: true, // Google OAuth автоматически верифицирует email
        consent_given_at: new Date(),
      });
      user = await this.userRepository.save(user);
      console.log('✅ New Google user created:', user.id);
    } else if (!user.google_id) {
      // ✅ КРИТИЧНО: Разрешаем связывание ТОЛЬКО если email уже подтвержден
      if (!user.email_verified) {
        console.log('❌ Cannot link Google to unverified account:', user.id);
        throw new BadRequestException({
          message: 'Сначала подтвердите ваш email. Проверьте почту или запросите новое письмо.',
          requiresVerification: true,
          email: user.email,
        });
      }
      
      console.log(`🔗 Linking Google to existing ${user.provider} account:`, user.id);
      user.google_id = googleData.googleId;
      user.full_name = googleData.fullName;
      user.avatar_url = googleData.picture || user.avatar_url;
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

  async register(
    email: string, 
    password: string, 
    fullName?: string, 
    ipAddress?: string
  ) {
    console.log('📝 Register attempt:', { email, fullName });
    
    // 1. Проверяем существует ли пользователь
    const existingUser = await this.userRepository.findOne({ 
      where: { email } 
    });
    
    if (existingUser) {
      // ❌ КРИТИЧНО: Блокируем регистрацию если email уже используется
      if (existingUser.provider === 'google') {
        console.log('❌ Email already registered via Google:', existingUser.id);
        throw new BadRequestException({
          message: 'Этот email уже зарегистрирован через Google. Используйте вход через Google.',
          provider: 'google',
        });
      }
      
      // Если пользователь уже существует с паролем
      if (existingUser.password) {
        throw new BadRequestException('Email уже зарегистрирован');
      }
      
      // Если пользователь существует без пароля (неожиданная ситуация)
      throw new BadRequestException('Этот email уже используется. Попробуйте войти.');
    }

    // 2. Валидация нового пользователя
    if (password.length < 8) {
      throw new BadRequestException('Пароль должен содержать минимум 8 символов');
    }

    // 3. Подготовка данных
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString('hex');

    // 4. Создание пользователя
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      full_name: fullName || null,
      provider: 'local',
      plan: 'free',
      tokens_limit: 100000,
      tokens_used: 0,
      assistants_limit: 3,
      email_verified: false, // ❗ ВАЖНО: email НЕ подтвержден
      email_verification_token: verificationToken,
      consent_given_at: new Date(),
      consent_ip_address: ipAddress || null,
      agreed_to_data_transfer: false,
      last_login_at: new Date(),
    });

    const savedUser = await this.userRepository.save(user);
    
    console.log('✅ User created:', savedUser.id);

    // 5. ✅ Отправка письма через EmailService
    try {
      await this.emailService.sendVerificationEmail(savedUser.email, verificationToken);
      console.log('📧 Verification email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      // ⚠️ ВАЖНО: Удаляем пользователя если письмо не отправлено
      await this.userRepository.remove(savedUser);
      throw new BadRequestException({
        message: 'Не удалось отправить письмо с подтверждением. Проверьте правильность email или попробуйте позже.',
        emailError: true,
      });
    }

    // 6. ❗ НЕ генерируем JWT токен - пользователь должен подтвердить email!
    
    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        fullName: savedUser.full_name,
        emailVerified: false, // ❗ ВАЖНО: показываем что email не подтвержден
      },
      message: 'Регистрация успешна. Проверьте почту для подтверждения email.',
      requiresVerification: true, // ❗ Флаг для фронтенда
    };
  }

  // ================================
  // ВЕРИФИКАЦИЯ EMAIL
  // ================================

  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne({
      where: { email_verification_token: token }
    });

    if (!user) {
      throw new BadRequestException('Неверный или устаревший токен подтверждения');
    }

    if (user.email_verified) {
      throw new BadRequestException('Email уже подтвержден');
    }

    // ✅ Подтверждаем email
    user.email_verified = true;
    user.email_verification_token = null;
    user.updated_at = new Date();

    await this.userRepository.save(user);

    console.log('✅ Email verified for user:', user.id);

    // ✅ Генерируем JWT для автовхода
    const jwtToken = this.generateToken(user.id, user.email);

    return {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      message: 'Email успешно подтвержден. Теперь вы можете войти в систему.',
      token: jwtToken, // ← Добавь
      user: {          // ← Добавь
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        emailVerified: user.email_verified,
      },
    };
  }

  // ================================
  // ПОВТОРНАЯ ОТПРАВКА ПИСЬМА
  // ================================

  async resendVerificationEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('Пользователь с таким email не найден');
    }

    if (user.email_verified) {
      throw new BadRequestException('Email уже подтвержден');
    }

    // Генерируем новый токен
    const verificationToken = randomBytes(32).toString('hex');
    user.email_verification_token = verificationToken;
    user.updated_at = new Date();
    
    await this.userRepository.save(user);

    // Отправляем письмо
    try {
      await this.emailService.sendVerificationEmail(email, verificationToken);
      console.log('📧 Verification email resent to:', email);
      
      return {
        success: true,
        message: 'Письмо с подтверждением отправлено повторно. Проверьте почту.',
      };
    } catch (emailError) {
      console.error('❌ Failed to resend verification email:', emailError);
      throw new BadRequestException({
        message: 'Не удалось отправить письмо. Попробуйте позже.',
        error: emailError.message,
      });
    }
  }

  // ================================
  // ВХОД
  // ================================

  async login(email: string, password: string, ipAddress?: string) {
    console.log('🔑 Login attempt:', { email });

    // ✅ Тестовая учётная запись обхода email verification
    const TEST_EMAIL = 'test@test.com';
    const TEST_PASSWORD = 'qwerty12345678';
    if (email === TEST_EMAIL && password === TEST_PASSWORD) {
      let user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        // Создаём тестового пользователя прямо в базе, если нет
        user = this.userRepository.create({
          email: TEST_EMAIL,
          full_name: 'Тестовый пользователь',
          password: await bcrypt.hash(TEST_PASSWORD, 10),
          provider: 'local',
          plan: 'free',
          tokens_limit: 100000,
          tokens_used: 0,
          assistants_limit: 3,
          email_verified: true,
          consent_given_at: new Date(),
        });
        await this.userRepository.save(user);
        console.log('✅ Test user created:', user.id);
      }

      // Генерируем JWT сразу
      const token = this.generateToken(user.id, user.email);
      return {
        token,
        user: this.sanitizeUser(user),
        message: 'Тестовый вход выполнен успешно',
      };
    }
    
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

    // Проверка: если аккаунт через Google без пароля
    if (!user.password) {
      throw new BadRequestException({
        message: 'Этот email зарегистрирован через Google. Используйте вход через Google.',
        provider: 'google',
        hasGoogleAccount: true
      });
    }

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // ✅ КРИТИЧНО: Проверка подтверждения email
    if (!user.email_verified) {
      console.log('❌ Login blocked: email not verified for user:', user.id);
      throw new UnauthorizedException({
        message: 'Пожалуйста, подтвердите ваш email перед входом. Проверьте почту или запросите новое письмо.',
        requiresVerification: true,
        email: user.email,
      });
    }

    // ✅ Rate limiting: не более 3 писем за 15 минут
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentTokens = await this.loginTokenRepository.count({
      where: {
        user_id: user.id,
        created_at: MoreThan(fifteenMinutesAgo), // Импортируй: import { MoreThan } from 'typeorm';
      },
    });

    if (recentTokens >= 3) {
      console.log('⚠️ Rate limit exceeded for user:', user.id);
      throw new BadRequestException(
        'Слишком много попыток входа. Подождите 15 минут и попробуйте снова.'
      );
    }

    // ✅ Генерируем токен для подтверждения входа
    const loginToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 минут

    await this.loginTokenRepository.save({
      user_id: user.id,
      token: loginToken,
      expires_at: expiresAt,
      used: false,
    });

    // ✅ Отправляем письмо для подтверждения входа
    try {
      await this.emailService.sendLoginVerificationEmail(user.email, loginToken);
      console.log('📧 Login verification email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send login verification email:', emailError);
      throw new BadRequestException('Не удалось отправить письмо. Попробуйте позже.');
    }

    // ✅ Возвращаем флаг requiresLoginVerification
    return {
      requiresLoginVerification: true,
      message: '📧 Письмо для подтверждения входа отправлено! Проверьте почту.',
      email: user.email,
    };
  }

  // Новый метод для подтверждения входа
    async verifyLoginToken(token: string) {
      const loginToken = await this.loginTokenRepository.findOne({
        where: { token, used: false },
        relations: ['user'],
      });

      if (!loginToken) {
        throw new BadRequestException('Недействительная или устаревшая ссылка для входа');
      }

      if (new Date() > loginToken.expires_at) {
        throw new BadRequestException('Ссылка для входа истекла. Попробуйте войти заново.');
      }

      // Помечаем токен как использованный
      loginToken.used = true;
      await this.loginTokenRepository.save(loginToken);

      const user = loginToken.user;

      // Обновляем last_login_at
      user.last_login_at = new Date();
      await this.userRepository.save(user);

      // Генерируем JWT
      const jwtToken = this.generateToken(user.id, user.email);

      console.log('✅ Login verified for user:', user.id);

      return {
        token: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          emailVerified: user.email_verified,
        },
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

  // ✅ Запрос на сброс пароля
  async requestPasswordReset(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // ⚠️ Не говорим что пользователя нет (безопасность)
      return {
        success: true,
        message: 'Если аккаунт существует, письмо будет отправлено на указанный email.',
      };
    }

    // Проверка Google аккаунта
    if (user.provider === 'google' && !user.password) {
      throw new BadRequestException(
        'Этот аккаунт зарегистрирован через Google. Используйте вход через Google.'
      );
    }

    // Rate limiting: не более 3 запросов за 15 минут
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentTokens = await this.passwordResetRepository.count({
      where: {
        user_id: user.id,
        created_at: MoreThan(fifteenMinutesAgo),
      },
    });

    if (recentTokens >= 3) {
      throw new BadRequestException(
        'Слишком много запросов на сброс пароля. Подождите 15 минут.'
      );
    }

    // Генерируем токен
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 час

    await this.passwordResetRepository.save({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt,
      used: false,
    });

    // Отправляем письмо
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken);
      console.log('📧 Password reset email sent to:', email);
    } catch (error) {
      console.error('❌ Failed to send reset email:', error);
      throw new BadRequestException('Не удалось отправить письмо. Попробуйте позже.');
    }

    return {
      success: true,
      message: 'Если аккаунт существует, письмо с инструкциями отправлено на email.',
    };
  }

  // ✅ Сброс пароля
  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.passwordResetRepository.findOne({
      where: { token, used: false },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Недействительная или использованная ссылка.');
    }

    if (new Date() > resetToken.expires_at) {
      throw new BadRequestException('Ссылка для сброса пароля истекла.');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Пароль должен содержать минимум 8 символов.');
    }

    // Обновляем пароль
    const user = resetToken.user;
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    // Помечаем токен как использованный
    resetToken.used = true;
    await this.passwordResetRepository.save(resetToken);

    console.log('✅ Password reset for user:', user.id);

    return {
      success: true,
      message: 'Пароль успешно изменён. Теперь вы можете войти с новым паролем.',
    };
  }

}