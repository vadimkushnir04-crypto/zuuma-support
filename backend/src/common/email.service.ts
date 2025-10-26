// backend/src/common/email.service.ts
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private resend: Resend;
  private frontendUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    
    if (!apiKey) {
      console.warn('⚠️  RESEND_API_KEY not found - email disabled');
    }
    
    this.resend = new Resend(apiKey);
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://zuuma.ru';
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: 'Zuuma <onboarding@resend.dev>', // Для production: noreply@zuuma.ru
        to: email,
        subject: 'Подтвердите ваш email',
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Подтверждение регистрации на Zuuma</h2>
              <p>Здравствуйте!</p>
              <p>Для активации аккаунта подтвердите ваш email:</p>
              <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #888888; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Подтвердить email
              </a>
              <p>Или скопируйте ссылку:</p>
              <p style="word-break: break-all; color: #888;">${verificationUrl}</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">Если вы не регистрировались, проигнорируйте письмо.</p>
            </body>
          </html>
        `,
      });

      console.log('✅ Verification email sent to:', email);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw new Error('Не удалось отправить письмо');
    }
  }
}