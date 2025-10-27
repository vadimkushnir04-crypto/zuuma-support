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
  private postboxApiUrl: string;

  constructor(private configService: ConfigService) {
    const oauthToken = this.configService.get<string>('YANDEX_OAUTH_TOKEN');
    this.folderId = this.configService.get<string>('YANDEX_FOLDER_ID') || '';
    this.fromEmail = this.configService.get<string>('POSTBOX_FROM_EMAIL') || 'noreply@zuuma.ru';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://zuuma.ru';
    this.postboxApiUrl = this.configService.get<string>('YANDEX_POSTBOX_API_URL') || 'https://postbox.cloud.yandex.net';

    console.log('📧 [EmailService] Initializing...');
    console.log('📧 [EmailService] From Email:', this.fromEmail);
    console.log('📧 [EmailService] Folder ID:', this.folderId ? `${this.folderId.substring(0, 10)}...` : 'NOT SET');
    console.log('📧 [EmailService] Postbox API URL:', this.postboxApiUrl);
    console.log('📧 [EmailService] Frontend URL:', this.frontendUrl);

    if (!oauthToken || !this.folderId) {
      console.warn('⚠️  [EmailService] Yandex Postbox credentials not found');
      console.warn('⚠️  [EmailService] Email sending is DISABLED');
      console.warn('⚠️  [EmailService] Add YANDEX_OAUTH_TOKEN and YANDEX_FOLDER_ID to environment');
      this.isEnabled = false;
      return;
    }

    this.initializeIAMToken(oauthToken);
  }

  private async initializeIAMToken(oauthToken: string): Promise<void> {
    try {
      console.log('🔑 [EmailService] Requesting IAM token...');
      
      const response = await axios.post(
        'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        { yandexPassportOauthToken: oauthToken },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      this.iamToken = response.data.iamToken;
      this.isEnabled = true;
      console.log('✅ [EmailService] Yandex Postbox initialized successfully');
      console.log('✅ [EmailService] IAM token obtained');
      console.log('📧 [EmailService] Email sending is ENABLED');

      // Обновляем IAM токен каждые 11 часов (токены живут 12 часов)
      setInterval(() => this.refreshIAMToken(oauthToken), 11 * 60 * 60 * 1000);
    } catch (error) {
      console.error('❌ [EmailService] Failed to get IAM token:');
      console.error('❌ [EmailService] Error:', error.message);
      if (error.response) {
        console.error('❌ [EmailService] Response status:', error.response.status);
        console.error('❌ [EmailService] Response data:', JSON.stringify(error.response.data, null, 2));
      }
      console.warn('⚠️  [EmailService] Email sending is DISABLED');
      this.isEnabled = false;
    }
  }

  private async refreshIAMToken(oauthToken: string): Promise<void> {
    try {
      console.log('🔄 [EmailService] Refreshing IAM token...');
      
      const response = await axios.post(
        'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        { yandexPassportOauthToken: oauthToken },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      this.iamToken = response.data.iamToken;
      console.log('✅ [EmailService] IAM token refreshed successfully');
    } catch (error) {
      console.error('❌ [EmailService] Failed to refresh IAM token:', error.message);
      if (error.response) {
        console.error('❌ [EmailService] Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.isEnabled || !this.iamToken) {
      const errorMsg = '⚠️  [EmailService] Postbox not configured - email sending disabled';
      console.warn(errorMsg);
      throw new Error(errorMsg);
    }

    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    console.log('📧 [EmailService] Preparing to send verification email...');
    console.log('📧 [EmailService] To:', email);
    console.log('📧 [EmailService] From:', this.fromEmail);
    console.log('📧 [EmailService] Folder ID:', this.folderId);
    console.log('📧 [EmailService] Verification URL:', verificationUrl);

    const emailPayload = {
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
    };

    console.log('📧 [EmailService] Email payload:', JSON.stringify({
      ...emailPayload,
      html: '[HTML CONTENT]', // Не логируем HTML для читаемости
    }, null, 2));

    try {
      const url = `${this.postboxApiUrl}/v1/send`;
      console.log('📧 [EmailService] Sending POST request to:', url);
      
      const response = await axios.post(
        url,
        emailPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.iamToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 секунд таймаут
        }
      );

      console.log('✅ [EmailService] Email sent successfully!');
      console.log('✅ [EmailService] Response status:', response.status);
      console.log('✅ [EmailService] Response data:', JSON.stringify(response.data, null, 2));
      console.log('✅ [EmailService] Verification email sent to:', email);
      
    } catch (error) {
      console.error('❌ [EmailService] Failed to send email');
      console.error('❌ [EmailService] To:', email);
      console.error('❌ [EmailService] Error message:', error.message);
      
      if (error.response) {
        console.error('❌ [EmailService] Response status:', error.response.status);
        console.error('❌ [EmailService] Response headers:', JSON.stringify(error.response.headers, null, 2));
        console.error('❌ [EmailService] Response data:', JSON.stringify(error.response.data, null, 2));
        
        // Проверяем специфичные ошибки Yandex Postbox
        if (error.response.data) {
          const errorData = error.response.data;
          
          if (errorData.code) {
            console.error('❌ [EmailService] Error code:', errorData.code);
          }
          
          if (errorData.message) {
            console.error('❌ [EmailService] Error message:', errorData.message);
          }
          
          if (errorData.details) {
            console.error('❌ [EmailService] Error details:', JSON.stringify(errorData.details, null, 2));
          }
        }
      } else if (error.request) {
        console.error('❌ [EmailService] No response received');
        console.error('❌ [EmailService] Request:', error.request);
      }
      
      // Пробрасываем ошибку дальше
      throw new Error(`Failed to send email: ${error.response?.data?.message || error.message}`);
    }
  }

  isEmailServiceEnabled(): boolean {
    return this.isEnabled;
  }
}