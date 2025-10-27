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
      console.error('❌ [EmailService] CRITICAL: SMTP credentials not configured!');
      console.error('❌ [EmailService] Required variables:');
      console.error('   - SMTP_HOST:', smtpHost ? '✓' : '✗');
      console.error('   - SMTP_PORT:', smtpPort ? '✓' : '✗');
      console.error('   - SMTP_USER:', smtpUser ? '✓' : '✗');
      console.error('   - SMTP_PASS:', smtpPass ? '✓' : '✗');
      console.error('❌ [EmailService] Email sending is DISABLED');
      console.error('❌ [EmailService] Registration will NOT work without email verification!');
      this.isEnabled = false;
      return;
    }

    console.log('📧 [EmailService] SMTP Configuration:');
    console.log('   - Host:', smtpHost);
    console.log('   - Port:', smtpPort);
    console.log('   - User:', smtpUser);
    console.log('   - Secure:', smtpSecure);

    // Создаем транспорт
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true for 465, false for 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      // Добавляем таймауты
      connectionTimeout: 10000, // 10 секунд
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Проверка подключения
    console.log('📧 [EmailService] Testing SMTP connection...');
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ [EmailService] SMTP connection FAILED!');
        console.error('❌ [EmailService] Error:', error.message);
        console.error('❌ [EmailService] Error code:', error.code);
        
        // Детальная диагностика
        if (error.message.includes('authentication failed')) {
          console.error('❌ [EmailService] Authentication problem:');
          console.error('   1. Check SMTP_USER and SMTP_PASS are correct');
          console.error('   2. For Gmail: Enable App Passwords (https://myaccount.google.com/apppasswords)');
          console.error('   3. For Yandex: Create App Password (https://id.yandex.ru/security/app-passwords)');
          console.error('   4. For Mail.ru: Check password for external apps is enabled');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
          console.error('❌ [EmailService] Connection problem:');
          console.error('   1. Check SMTP_HOST is correct:', smtpHost);
          console.error('   2. Check SMTP_PORT is correct:', smtpPort);
          console.error('   3. Check firewall/network settings');
        } else if (error.message.includes('certificate')) {
          console.error('❌ [EmailService] SSL/TLS problem:');
          console.error('   1. For port 465: Set SMTP_SECURE=true');
          console.error('   2. For port 587: Set SMTP_SECURE=false');
        }
        
        this.isEnabled = false;
      } else {
        console.log('✅ [EmailService] SMTP connection successful!');
        console.log('✅ [EmailService] Email sending is ENABLED');
        this.isEnabled = true;
      }
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.isEnabled || !this.transporter) {
      const errorMsg = 'Email sending is temporarily unavailable. Please contact administrator to configure SMTP settings.';
      console.error('❌ [EmailService] Cannot send email - SMTP not configured');
      throw new Error(errorMsg);
    }

    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    console.log('📧 [EmailService] Preparing verification email...');
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
    } catch (error) {
      console.error('❌ [EmailService] Failed to send email');
      console.error('❌ [EmailService] To:', email);
      console.error('❌ [EmailService] Error:', error.message);
      
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