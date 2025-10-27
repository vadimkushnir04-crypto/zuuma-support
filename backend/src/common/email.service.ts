// backend/src/common/email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class EmailService {
  private iamToken: string | null = null;
  private fromEmail: string;
  private frontendUrl: string;
  private isEnabled: boolean = false;
  private folderId: string;

  constructor(private configService: ConfigService) {
    const oauthToken = this.configService.get<string>('YANDEX_OAUTH_TOKEN');
    this.folderId = this.configService.get<string>('YANDEX_FOLDER_ID') || '';
    this.fromEmail = this.configService.get<string>('POSTBOX_FROM_EMAIL') || 'noreply@zuuma.ru';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://zuuma.ru';

    if (!oauthToken || !this.folderId) {
      console.warn('⚠️  Yandex Postbox credentials not found');
      console.warn('⚠️  Email sending is DISABLED');
      console.warn('⚠️  Add YANDEX_OAUTH_TOKEN and YANDEX_FOLDER_ID to environment');
      this.isEnabled = false;
      return;
    }

    this.initializeIAMToken(oauthToken);
  }

  private async initializeIAMToken(oauthToken: string): Promise<void> {
    try {
      const response = await axios.post(
        'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        { yandexPassportOauthToken: oauthToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      this.iamToken = response.data.iamToken;
      this.isEnabled = true;
      console.log('✅ Yandex Postbox initialized successfully');
      console.log('📧 Email sending is ENABLED');

      // Обновляем IAM токен каждые 11 часов (токены живут 12 часов)
      setInterval(() => this.refreshIAMToken(oauthToken), 11 * 60 * 60 * 1000);
    } catch (error) {
      console.error('❌ Failed to get IAM token:', error.message);
      console.warn('⚠️  Email sending is DISABLED');
      this.isEnabled = false;
    }
  }

  private async refreshIAMToken(oauthToken: string): Promise<void> {
    try {
      const response = await axios.post(
        'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        { yandexPassportOauthToken: oauthToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      this.iamToken = response.data.iamToken;
      console.log('🔄 IAM token refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh IAM token:', error.message);
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.isEnabled || !this.iamToken) {
      console.warn(`⚠️  Skipping email to ${email} - Postbox not configured`);
      return;
    }

    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    try {
      await axios.post(
        'https://postbox.api.cloud.yandex.net/v1/send',
        {
          folderId: this.folderId,
          from: `Zuuma <${this.fromEmail}>`,
          to: [{ email }],
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
        },
        {
          headers: {
            'Authorization': `Bearer ${this.iamToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Verification email sent to:', email);
    } catch (error) {
      console.error('❌ Failed to send email to', email, ':', error.response?.data || error.message);
    }
  }

  isEmailServiceEnabled(): boolean {
    return this.isEnabled;
  }
}