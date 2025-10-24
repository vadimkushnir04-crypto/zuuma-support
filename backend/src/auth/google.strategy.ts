// backend/src/auth/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { name, emails, photos } = profile;

      // ✅ Добавь лог сюда:
      console.log('✅ GoogleStrategy validate:', profile.id, emails?.[0]?.value);

      // Собираем имя
      const fullName = [name?.givenName, name?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim() || 'User';

      // Валидируем или создаём пользователя
      const user = await this.authService.validateGoogleUser({
        email: emails[0].value,
        fullName: fullName,
        picture: photos?.[0]?.value,
        googleId: profile.id,
      });

      done(null, user);
    } catch (error) {
      console.error('❌ GoogleStrategy error:', error);
      done(error, false);
    }
  }
}
