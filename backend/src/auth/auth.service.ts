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
import { randomBytes } from 'crypto';
import { EmailService } from '../common/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
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
      console.log(`🔗 Linking Google to existing ${user.provider} account:`, user.id);
      user.google_id = googleData.googleId;
      user.full_name = googleData.fullName;
      user.avatar_url = googleData.picture || user.avatar_url;
      user.email_verified = true; // Google OAuth верифицирует email
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
      // Случай: пользователь зарегистрирован через Google, хочет добавить пароль
      if (!existingUser.password) {
        console.log('🔗 Adding password to existing Google account:', existingUser.id);
        
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
      
      throw new BadRequestException('Email уже зарегистрирован');
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
      console.error('⚠️ Failed to send verification email:', emailError.message);
      // Не бросаем ошибку - регистрация прошла успешно
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

    return {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      message: 'Email успешно подтвержден. Теперь вы можете войти в систему.',
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
    } catch (emailError) {
      console.error('⚠️ Failed to resend verification email:', emailError.message);
      throw new BadRequestException('Не удалось отправить письмо. Попробуйте позже.');
    }

    return {
      success: true,
      message: 'Письмо с подтверждением отправлено повторно. Проверьте почту.',
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

    // Проверка: если аккаунт через Google без пароля
    if (!user.password) {
      throw new BadRequestException({
        message: 'Этот email зарегистрирован через Google. Используйте вход через Google или установите пароль через регистрацию.',
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

    // ✅ Все проверки пройдены - разрешаем вход
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
}