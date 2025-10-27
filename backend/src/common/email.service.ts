// backend/src/common/email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private frontendUrl: string;
  private isEnabled: boolean = false;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('POSTBOX_FROM_EMAIL') || 'noreply@zuuma.ru';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'https://zuuma.ru';

    console.log('📧 [EmailService] Initializing...');
    console.log('📧 [EmailService] From Email:', this.fromEmail);
    console.log('📧 [EmailService] Frontend URL:', this.frontendUrl);

    // Проверяем SMTP настройки
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpSecure = this.configService.get<boolean>('SMTP_SECURE') ?? true;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.warn('⚠️  [EmailService] SMTP credentials not configured');
      console.warn('⚠️  [EmailService] Email sending is DISABLED');
      console.warn('⚠️  [EmailService] Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to environment');
      this.isEnabled = false;
      return;
    }

    console.log('📧 [EmailService] SMTP Host:', smtpHost);
    console.log('📧 [EmailService] SMTP Port:', smtpPort);
    console.log('📧 [EmailService] SMTP User:', smtpUser);
    console.log('📧 [EmailService] SMTP Secure:', smtpSecure);

    // Создаем транспорт
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true for 465, false for 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Проверка подключения
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ [EmailService] SMTP connection failed:', error.message);
        this.isEnabled = false;
      } else {
        console.log('✅ [EmailService] SMTP server ready');
        console.log('📧 [EmailService] Email sending is ENABLED');
        this.isEnabled = true;
      }
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.isEnabled || !this.transporter) {
      const errorMsg = '⚠️  [EmailService] SMTP not configured - email sending disabled';
      console.warn(errorMsg);
      throw new Error(errorMsg);
    }

    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    console.log('📧 [EmailService] Preparing to send verification email...');
    console.log('📧 [EmailService] To:', email);
    console.log('📧 [EmailService] From:', this.fromEmail);
    console.log('📧 [EmailService] Verification URL:', verificationUrl);

    try {
      const info = await this.transporter.sendMail({
        from: `Zuuma <${this.fromEmail}>`,
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

      console.log('✅ [EmailService] Email sent successfully!');
      console.log('✅ [EmailService] Message ID:', info.messageId);
      console.log('✅ [EmailService] Response:', info.response);
      console.log('✅ [EmailService] Verification email sent to:', email);
    } catch (error) {
      console.error('❌ [EmailService] Failed to send email');
      console.error('❌ [EmailService] To:', email);
      console.error('❌ [EmailService] Error message:', error.message);
      
      if (error.code) {
        console.error('❌ [EmailService] Error code:', error.code);
      }
      
      if (error.response) {
        console.error('❌ [EmailService] SMTP response:', error.response);
      }
      
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  isEmailServiceEnabled(): boolean {
    return this.isEnabled;
  }
}