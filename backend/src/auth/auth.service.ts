import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ✅ Новый метод для Google OAuth
  async validateGoogleUser(googleData: {
    email: string;
    fullName: string;
    picture?: string;
    googleId: string;
  }) {
    console.log('🔍 Validating Google user:', googleData.email);

    // Ищем пользователя по google_id или email
    let user = await this.userRepository.findOne({
      where: [
        { google_id: googleData.googleId },
        { email: googleData.email }
      ]
    });

    if (!user) {
      console.log('✨ Creating new user from Google');
      // Создаем нового пользователя
      const newUser = this.userRepository.create({
        email: googleData.email,
        google_id: googleData.googleId,
        full_name: googleData.fullName,
        avatar_url: googleData.picture || null,
      });
      user = await this.userRepository.save(newUser);
    } else if (!user.google_id) {
      // Привязываем Google к существующему аккаунту
      console.log('🔗 Linking Google to existing user');
      user.google_id = googleData.googleId;
      user.full_name = googleData.fullName;
      user.avatar_url = googleData.picture || null;
      user = await this.userRepository.save(user);
    }

    const token = this.generateToken(user.id, user.email);
    
    console.log('✅ Google auth successful, user ID:', user.id);
    
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
      }, 
      token 
    };
  }

  // ✅ Метод для GitHub (подготовка на будущее)
  async validateGithubUser(githubData: {
    email: string;
    fullName: string;
    picture?: string;
    githubId: string;
  }) {
    let user = await this.userRepository.findOne({
      where: [
        { github_id: githubData.githubId },
        { email: githubData.email }
      ]
    });

    if (!user) {
      const newUser = this.userRepository.create({
        email: githubData.email,
        github_id: githubData.githubId,
        full_name: githubData.fullName,
        avatar_url: githubData.picture || null,
      });
      user = await this.userRepository.save(newUser);
    } else if (!user.github_id) {
      user.github_id = githubData.githubId;
      user.full_name = githubData.fullName;
      user.avatar_url = githubData.picture || null;
      user = await this.userRepository.save(user);
    }

    const token = this.generateToken(user.id, user.email);
    
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
      }, 
      token 
    };
  }

  // ✅ Метод для Telegram (подготовка на будущее)
  async validateTelegramUser(telegramData: {
    telegramId: string;
    firstName: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
  }) {
    let user = await this.userRepository.findOne({
      where: { telegram_id: telegramData.telegramId }
    });

    const fullName = `${telegramData.firstName} ${telegramData.lastName || ''}`.trim();
    const email = telegramData.username 
      ? `${telegramData.username}@telegram.temp`
      : `tg${telegramData.telegramId}@telegram.temp`;

    if (!user) {
      const newUser = this.userRepository.create({
        email: email,
        telegram_id: telegramData.telegramId,
        full_name: fullName,
        avatar_url: telegramData.photoUrl || null,
      });
      user = await this.userRepository.save(newUser);
    }

    const token = this.generateToken(user.id, user.email);
    
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
      }, 
      token 
    };
  }

  // Старые методы (оставляем для совместимости)
  async getProfile(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      
      const user = await this.userRepository.findOne({ 
        where: { id: payload.id || payload.userId } 
      });
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }

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
      };
    } catch (error) {
      throw new Error('Недействительный токен');
    }
  }

  async updateProfile(token: string, fullName?: string) {
    try {
      const payload = this.jwtService.verify(token);
      
      const user = await this.userRepository.findOne({ 
        where: { id: payload.id || payload.userId } 
      });
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      if (fullName) {
        user.full_name = fullName;
      }
      user.updated_at = new Date();
      
      const updatedUser = await this.userRepository.save(user);

      return {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        avatarUrl: updatedUser.avatar_url,
        plan: updatedUser.plan,
        tokensUsed: updatedUser.tokens_used,
        tokensLimit: updatedUser.tokens_limit,
        assistantsLimit: updatedUser.assistants_limit,
        createdAt: updatedUser.created_at?.toISOString(),
      };
    } catch (error) {
      if (error.message === 'Пользователь не найден') {
        throw error;
      }
      throw new Error('Ошибка при обновлении профиля');
    }
  }

  verifyToken(token: string): { id: string; email: string } {
    try {
      const payload = this.jwtService.verify(token);
      
      const id = payload.id || payload.userId;
      
      if (!id || !payload.email) {
        console.error('JWT payload missing required fields:', payload);
        throw new Error('Недействительный токен');
      }
      
      return { id, email: payload.email };
    } catch (error) {
      console.error('JWT verification error:', error.message || error);
      throw new Error('Недействительный токен');
    }
  }

  private generateToken(userId: string, email: string) {
    const payload = { id: userId, email };
    console.log('🔑 Generating token with payload:', payload);
    return this.jwtService.sign(payload);
  }

  // Регистрация
async register(email: string, password: string, fullName?: string, ipAddress?: string) {
  const existingUser = await this.userRepository.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('Email уже зарегистрирован');
  }

  if (password.length < 8) {
    throw new Error('Пароль должен содержать минимум 8 символов');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = this.userRepository.create({
    email,
    password: hashedPassword,
    full_name: fullName || null,
    provider: 'local',
    consent_given_at: new Date(),
    consent_ip_address: ipAddress || null,
    agreed_to_data_transfer: false,
    last_login_at: new Date(),
  });

  const savedUser = await this.userRepository.save(user);
  const token = this.generateToken(savedUser.id, savedUser.email);

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
    },
    token,
  };
}

// Вход
async login(email: string, password: string, ipAddress?: string) {
  const user = await this.userRepository.findOne({
    where: { email },
    select: ['id', 'email', 'password', 'full_name', 'avatar_url', 'provider', 'plan', 'tokens_used', 'tokens_limit', 'assistants_limit', 'created_at'],
  });

  if (!user) {
    throw new Error('Неверный email или пароль');
  }

  if (user.provider !== 'local' || !user.password) {
    throw new Error('Этот email зарегистрирован через Google');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new Error('Неверный email или пароль');
  }

  user.last_login_at = new Date();
  await this.userRepository.save(user);

  const token = this.generateToken(user.id, user.email);

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
    },
    token,
  };
}

}