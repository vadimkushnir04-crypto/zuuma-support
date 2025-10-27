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

    // ✅ Yandex Cloud Postbox использует AWS SES-совместимый SMTP
    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.postbox.cloud.yandex.net';
    const smtpPort = this.configService.get<number>('SMTP_PORT') || 587;
    const smtpUser = this.configService.get<string>('POSTBOX_SMTP_USER');
    const smtpPass = this.configService.get<string>('POSTBOX_SMTP_PASS');

    if (!smtpUser || !smtpPass) {
      console.error('❌ [EmailService] CRITICAL: Postbox SMTP credentials not configured!');
      console.error('❌ [EmailService] Required variables:');
      console.error('   - POSTBOX_SMTP_USER (from Yandex Cloud Postbox)');
      console.error('   - POSTBOX_SMTP_PASS (from Yandex Cloud Postbox)');
      console.error('');
      console.error('📝 How to get credentials:');
      console.error('   1. Go to: https://console.cloud.yandex.ru/folders');
      console.error('   2. Select your folder');
      console.error('   3. Go to: Postbox → Addresses → zuuma.ru');
      console.error('   4. Click "Generate SMTP credentials"');
      console.error('   5. Copy username and password');
      console.error('');
      this.isEnabled = false;
      return;
    }

    console.log('📧 [EmailService] Postbox SMTP Configuration:');
    console.log('   - Host:', smtpHost);
    console.log('   - Port:', smtpPort);
    console.log('   - User:', smtpUser);

    // Создаем транспорт для Yandex Cloud Postbox
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // Postbox uses STARTTLS on port 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false, // Для совместимости
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Проверка подключения
    console.log('📧 [EmailService] Testing Postbox SMTP connection...');
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ [EmailService] Postbox SMTP connection FAILED!');
        console.error('❌ [EmailService] Error:', error.message);
        console.error('');
        console.error('🔧 Troubleshooting:');
        console.error('   1. Check POSTBOX_SMTP_USER and POSTBOX_SMTP_PASS are correct');
        console.error('   2. Make sure credentials are from Yandex Cloud Postbox');
        console.error('   3. Verify domain zuuma.ru is verified in Postbox');
        console.error('   4. Check if Postbox address is active');
        console.error('');
        this.isEnabled = false;
      } else {
        console.log('✅ [EmailService] Postbox SMTP connection successful!');
        console.log('✅ [EmailService] Email sending is ENABLED');
        console.log('✅ [EmailService] Using Yandex Cloud Postbox');
        this.isEnabled = true;
      }
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.isEnabled || !this.transporter) {
      const errorMsg = 'Email sending is temporarily unavailable. Please configure Yandex Cloud Postbox credentials.';
      console.error('❌ [EmailService] Cannot send email - Postbox not configured');
      throw new Error(errorMsg);
    }

    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    console.log('📧 [EmailService] Preparing verification email...');
    console.log('📧 [EmailService] To:', email);
    console.log('📧 [EmailService] From:', this.fromEmail);
    console.log('📧 [EmailService] Via: Yandex Cloud Postbox');
    console.log('📧 [EmailService] Verification URL:', verificationUrl);

    try {
    const info = await this.transporter.sendMail({
      from: `Vadim from Zuuma <${this.fromEmail}>`,
      to: email,
      subject: 'Добро пожаловать в Zuuma — подтвердите ваш email',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #333;">
            <p>Привет 👋</p>

            <p>Меня зовут Вадим — я создатель Zuuma.</p>
            <p>Мы начали Zuuma, потому что хотели сделать простой и мощный инструмент для бизнеса — 
            чтобы создавать AI-ассистентов, которые помогают вашим клиентам и командам без сложных настроек.</p>

            <p>Перед тем как начать, подтвердите ваш email:</p>
            <a href="${verificationUrl}" style="display: inline-block; background-color: #4a4a4a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Подтвердить email
            </a>

            <p>Или просто скопируйте ссылку:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>

            <p>✨ Спасибо, что присоединились!</p>

            <p style="font-size: 13px; color: #777; margin-top: 40px;">
              📧 По всем вопросам: <a href="mailto:delovoi.acount@gmail.com" style="color: #555;">delovoi.acount@gmail.com</a>
            </p>

            <p style="margin-top: 10px; font-size: 12px; color: #999;">
              Если вы не регистрировались, просто проигнорируйте это письмо.
            </p>
          </body>
        </html>
      `,
    });

      console.log('✅ [EmailService] Email sent successfully via Postbox!');
      console.log('✅ [EmailService] Message ID:', info.messageId);
      console.log('✅ [EmailService] Response:', info.response);
    } catch (error: any) {
      console.error('❌ [EmailService] Failed to send email via Postbox');
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