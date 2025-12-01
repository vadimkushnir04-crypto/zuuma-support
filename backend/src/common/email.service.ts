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
            <p>Привет! 👋</p>

            <p>Я Вадим, создатель Zuuma. Мы делаем простой и мощный инструмент, чтобы вы могли легко создавать AI‑ассистентов для вашего бизнеса.</p>

            <p>Для начала работы подтвердите email:</p>

            <a href="${verificationUrl}" style="display: inline-block; background-color: #007bff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
              Подтвердить email
            </a>

            <p>Или скопируйте ссылку:</p>
            <p style="word-break: break-all; color: #666; font-size: 13px;">${verificationUrl}</p>

            <p>Спасибо, что выбрали Zuuma! ✨</p>


            <p style="font-size: 13px; color: #777; margin-top: 40px;">
              По вопросам: <a href="mailto:delovoi.acount@gmail.com" style="color: #007bff;">delovoi.acount@gmail.com</a>
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

  async sendLoginVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.isEnabled || !this.transporter) {
      throw new Error('Email sending is temporarily unavailable.');
    }

    const verificationUrl = `${this.frontendUrl}/verify-login?token=${token}`;

    console.log('📧 [EmailService] Sending LOGIN verification email to:', email);

    try {
      await this.transporter.sendMail({
        from: `Vadim from Zuuma <${this.fromEmail}>`,
        to: email,
        subject: '🔐 Подтвердите вход в Zuuma',
        text: `Кто-то пытается войти в ваш аккаунт. Если это вы, перейдите по ссылке: ${verificationUrl}`,
        html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #333;">
            <h2 style="margin-top: 0;">Подтвердите вход</h2>

            <p>Кто-то попытался войти в ваш аккаунт: <strong>${email}</strong>.</p>

            <p>Если это вы — перейдите по ссылке ниже. Ссылка действительна <strong>15 минут</strong>.</p>


            <a href="${verificationUrl}" style="display: inline-block; background-color: #007bff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
              Войти в аккаунт
            </a>

            <p>Или скопируйте ссылку:</p>
            <p style="word-break: break-all; color: #666; font-size: 13px;">${verificationUrl}</p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 32px 0;" />

            <p style="color: #d9534f; font-weight: bold; margin-bottom: 8px;">Если это не вы:</p>
            <ul style="color: #666; margin-left: 20px;">
              <li>Не переходите по ссылке</li>
              <li>Смените пароль как можно скорее</li>
              <li><a href="mailto:delovoi.acount@gmail.com" style="color: #d9534f;">Напишите нам</a>, если нужна помощь</li>
            </ul>


            <p style="margin-top: 32px; font-size: 12px; color: #999;">
              Это автоматическое письмо. Не отвечайте на него.
            </p>
          </body>
        </html>
        `,
      });

      console.log('✅ [EmailService] Login verification email sent');
    } catch (error: any) {
      console.error('❌ [EmailService] Failed to send login email:', error.message);
      throw new Error(`Failed to send login verification: ${error.message}`);
    }
  }

  isEmailServiceEnabled(): boolean {
    return this.isEnabled;
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    if (!this.isEnabled || !this.transporter) {
      throw new Error('Email sending is temporarily unavailable.');
    }

    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    console.log('📧 [EmailService] Sending password reset email to:', email);

    try {
      await this.transporter.sendMail({
        from: `Vadim from Zuuma <${this.fromEmail}>`,
        to: email,
        subject: '🔑 Сброс пароля - Zuuma',
        html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #333;">
            <h2 style="margin-top: 0;">Сброс пароля</h2>

            <p>Мы получили запрос на сброс пароля для аккаунта: <strong>${email}</strong>.</p>

            <p>Чтобы создать новый пароль, перейдите по ссылке ниже. Ссылка действительна <strong>1 час</strong>.</p>

            <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
              Создать новый пароль
            </a>

            <p>Или скопируйте ссылку:</p>
            <p style="word-break: break-all; color: #666; font-size: 13px;">${resetUrl}</p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 32px 0;" />

            <p style="color: #d9534f; font-weight: bold; margin-bottom: 8px;">Если вы не запрашивали сброс:</p>
            <ul style="color: #666; margin-left: 20px;">
              <li>Проигнорируйте это письмо</li>
              <li>Ваш пароль останется прежним</li>
              <li>Если подозреваете взлом — смените пароль в настройках</li>
            </ul>

            <p style="margin-top: 32px; font-size: 12px; color: #999;">
              Вопросы? Пишите: <a href="mailto:delovoi.acount@gmail.com" style="color: #007bff;">delovoi.acount@gmail.com</a>
            </p>
          </body>
        </html>
        `,
      });

      console.log('✅ [EmailService] Password reset email sent');
    } catch (error: any) {
      console.error('❌ [EmailService] Failed to send reset email:', error.message);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async sendLowTokensWarning(
    email: string,
    remainingTokens: number,
    totalLimit: number,
    triggerType: 'threshold' | 'error'
  ): Promise<void> {
    if (!this.isEnabled || !this.transporter) {
      throw new Error('Email sending is temporarily unavailable.');
    }

    const percentLeft = Math.round((remainingTokens / totalLimit) * 100);
    const subject = triggerType === 'threshold'
      ? `⚠️ Внимание: осталось ${percentLeft}% токенов`
      : `🚨 Критично: не хватило токенов для обработки запроса`;


    const preheader = triggerType === 'threshold'
      ? 'Ваш баланс токенов ниже 10%. Пополните, чтобы избежать прерывания работы.'
      : 'Ваш запрос не обработан из-за нехватки токенов. Срочно пополните баланс.';


    const callToAction = triggerType === 'threshold'
      ? 'Обновить тариф'
      : 'Пополнить баланс сейчас';


    const explanation = triggerType === 'threshold'
      ? `<p>При текущем уровне использования ваши клиенты скоро могут перестать получать ответы от AI‑ассистента.</p>`
      : `<p>Ваш последний запрос не был обработан из-за недостатка токенов. Чтобы возобновить работу, срочно пополните баланс.</p>`;


    try {
      await this.transporter.sendMail({
        from: `Vadim from Zuuma <${this.fromEmail}>`,
        to: email,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            </head>
            <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #333;">
              <h2>${subject}</h2>
              
              <p>Здравствуйте!</p>
              
              ${explanation}
              
              <ul style="margin: 16px 0; padding-left: 20px;">
                <li><strong>${remainingTokens} токенов</strong> из ${totalLimit}</li>
                <li>Это составляет <strong>${percentLeft}%</strong> от общего лимита</li>
              </ul>
              
              <p>Чтобы избежать прерывания обслуживания, рекомендуем как можно скорее обновить тарифный план:</p>
              
              <a href="${this.frontendUrl}/profile" style="display: inline-block; background-color: ${triggerType === 'error' ? '#dc3545' : '#d9534f'}; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">
                ${callToAction}
              </a>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 32px 0;" />
              
              <h3>Почему это важно?</h3>
              <ul style="color: #666;">
                <li>Прерывание ответов AI может негативно повлиять на опыт ваших клиентов</li>
                <li>Возобновление работы потребует времени на пополнение баланса</li>
                <li>Проактивное обновление тарифа гарантирует бесперебойную работу</li>
              </ul>

              ${triggerType === 'threshold' ? `
              <div style="margin-top: 24px; padding: 16px; background-color: #f8f9fa; border-left: 4px solid #007bff;">
                <p style="margin: 0; color: #495057;">
                  <strong>Совет:</strong> Рассмотрите тариф с большим лимитом токенов — это поможет избежать частых уведомлений и обеспечит стабильную работу ассистента.
                </p>
              </div>
              ` : ''}

              <p style="margin-top: 32px; font-size: 14px; color: #999;">
                Если у вас возникли вопросы, напишите нам: <a href="mailto:delovoi.acount@gmail.com">delovoi.acount@gmail.com</a>
              </p>
              
              <p style="margin-top: 10px; font-size: 12px; color: #999;">
                Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.
              </p>
            </body>
          </html>
        `,
        // Для почтовых клиентов (прехедер)
        text: preheader,
      });

      console.log(`✅ [EmailService] ${triggerType === 'threshold' ? 'Warning' : 'Alert'} sent to: ${email}`);
    } catch (error: any) {
      console.error(`❌ [EmailService] Failed to send ${triggerType} email to ${email}:`, error.message);
      if (error.code) console.error('❌ [EmailService] Error code:', error.code);
      if (error.response) console.error('❌ [EmailService] SMTP response:', error.response);
      throw new Error(`Failed to send ${triggerType} email: ${error.message}`);
    }
  }

/**
 * 📧 Универсальный метод отправки email
 */
async sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    if (!this.transporter) {
      console.warn('⚠️ Email transporter not configured, skipping email');
      return;
    }

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@zuuma.ru',
      to,
      subject,
      html
    });
    
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
}


}