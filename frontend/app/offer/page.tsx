"use client";

import React from "react";
import { FileText, Package, Truck, ShieldCheck, Mail, Phone, MapPin, User, CreditCard } from "lucide-react";

export default function OfferPage() {
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <FileText size={40} style={{ color: '#ffffffff' }} />
        <h1 style={styles.title}>Публичная оферта и реквизиты</h1>
        <p style={styles.subtitle}>
          Информация об услугах, ценах и условиях предоставления
        </p>
      </div>

      {/* 1. Услуги и тарифы */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Package size={24} />
          <h2 style={styles.sectionTitle}>1. Предоставляемые услуги и тарифы</h2>
        </div>
        
        <div style={styles.servicesGrid}>
          <div style={styles.serviceCard}>
            <div style={styles.planBadge}>Бесплатный</div>
            <h3 style={styles.serviceTitle}>Free Plan</h3>
            <div style={styles.servicePrice}>0 ₽<span style={styles.pricePeriod}> / месяц</span></div>
            <ul style={styles.serviceFeatures}>
              <li>✓ 100,000 токенов в месяц</li>
              <li>✓ 1 AI-ассистент</li>
              <li>✓ Telegram Bot интеграция</li>
              <li>✓ Интеграция в веб-виджет</li>
            </ul>
            <div style={styles.serviceNote}>
              Идеально для тестирования платформы
            </div>
          </div>

          <div style={{...styles.serviceCard, ...styles.popularCard}}>
            <div style={{...styles.planBadge, ...styles.popularBadge}}>Базовый</div>
            <h3 style={styles.serviceTitle}>Pro Plan</h3>
            <div style={styles.servicePrice}>1,499 ₽<span style={styles.pricePeriod}> / месяц</span></div>
            <ul style={styles.serviceFeatures}>
              <li>✓ 1,500,000 токенов в месяц</li>
              <li>✓ До 10 AI-ассистентов</li>
              <li>✓ Кастомизация интерфейса</li>
              <li>✓ API доступ</li>
              <li>✓ Telegram Bot интеграция</li>
              <li>✓ Интеграция в веб-виджет</li>
            </ul>
            <div style={styles.serviceNote}>
              Для малого и среднего бизнеса
            </div>
          </div>

          <div style={styles.serviceCard}>
            <div style={styles.planBadge}>Максимум</div>
            <h3 style={styles.serviceTitle}>Max Plan</h3>
            <div style={styles.servicePrice}>4,990 ₽<span style={styles.pricePeriod}> / месяц</span></div>
            <ul style={styles.serviceFeatures}>
              <li>✓ 5,000,000 токенов в месяц</li>
              <li>✓ До 50 AI-ассистентов</li>
              <li>✓ Кастомизация интерфейса</li>
              <li>✓ API доступ</li>
              <li>✓ Telegram Bot интеграция</li>
              <li>✓ Интеграция в веб-виджет</li>
            </ul>
            <div style={styles.serviceNote}>
              Для крупного бизнеса и корпораций
            </div>
          </div>
        </div>

        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>Что входит в услугу:</h4>
          <ul style={styles.list}>
            <li>Доступ к платформе Zuuma для создания AI-ассистентов</li>
            <li>Обучение ассистентов на ваших документах (PDF, TXT, MD и др.)</li>
            <li>Векторная база данных для хранения знаний</li>
            <li>Интеграция с Telegram ботами</li>
            <li>API для интеграции с вашими системами</li>
            <li>Техническая поддержка</li>
          </ul>
        </div>
      </section>

      {/* 2. Порядок предоставления услуг */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Truck size={24} />
          <h2 style={styles.sectionTitle}>2. Порядок предоставления услуг</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            После оплаты подписки вы <strong>немедленно получаете доступ</strong> к платформе Zuuma:
          </p>
          <ul style={styles.list}>
            <li>Активация происходит автоматически в течение 1 минуты после оплаты</li>
            <li>Доступ к функциям согласно выбранному тарифу</li>
            <li>Токены зачисляются на ваш баланс автоматически</li>
            <li>Возможность создания AI-ассистентов и обучения их на документах</li>
            <li>Доступ к панели управления и аналитике</li>
          </ul>
          <div style={styles.highlightBox}>
            <p style={{margin: 0}}>
              ✅ <strong>Важно:</strong> Возврат средств возможен в течение 7 дней с момента оплаты, 
              если услуга не была использована (токены не потрачены).
            </p>
          </div>
        </div>
      </section>

      {/* 3. Публичная оферта */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <ShieldCheck size={24} />
          <h2 style={styles.sectionTitle}>3. Условия публичной оферты</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Настоящая оферта является официальным публичным предложением 
            самозанятого лица предоставить услуги на следующих условиях:
          </p>
          
          <div style={styles.requisitesBox}>
            <h4 style={styles.requisitesTitle}>Реквизиты исполнителя:</h4>
            <div style={styles.requisitesGrid}>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>ФИО:</span>
                <span style={styles.requisiteValue}>Кушнир Вадим Олегович</span>
              </div>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>Статус:</span>
                <span style={styles.requisiteValue}>Самозанятый</span>
              </div>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>ИНН:</span>
                <span style={styles.requisiteValue}>263516890557</span>
              </div>
            </div>
          </div>

          <h4 style={styles.subheading}>Условия оказания услуг:</h4>
          <ul style={styles.list}>
            <li>Оплата услуг означает полное и безоговорочное принятие условий настоящей оферты</li>
            <li>Подписка активируется автоматически после успешной оплаты</li>
            <li>Подписка продлевается ежемесячно автоматически (при выборе рекуррентных платежей)</li>
            <li>Вы можете отменить подписку в любой момент в личном кабинете</li>
            <li>При отмене подписки токены сохраняются до конца оплаченного периода</li>
            <li>Неиспользованные токены не переносятся на следующий период</li>
            <li>Возврат средств возможен в течение 7 дней при условии неиспользования услуги</li>
          </ul>

          <h4 style={styles.subheading}>Права и обязанности:</h4>
          <ul style={styles.list}>
            <li>Исполнитель обязуется предоставить доступ к платформе в течение 1 минуты после оплаты</li>
            <li>Исполнитель обеспечивает работоспособность сервиса 99% времени</li>
            <li>Заказчик обязуется использовать сервис в соответствии с законодательством РФ</li>
            <li>Все права на программное обеспечение и материалы защищены законодательством РФ</li>
            <li>Запрещается использовать сервис для создания контента, нарушающего законодательство</li>
          </ul>
        </div>
      </section>

      {/* 4. Контактная информация */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Mail size={24} />
          <h2 style={styles.sectionTitle}>4. Контактная информация</h2>
        </div>
        <div style={styles.contactsGrid}>
          <div style={styles.contactCard}>
            <User size={20} style={{ color: '#de8434' }} />
            <div>
              <div style={styles.contactLabel}>Исполнитель</div>
              <div style={styles.contactValue}>Кушнир Вадим Олегович</div>
            </div>
          </div>

          <div style={styles.contactCard}>
            <FileText size={20} style={{ color: '#de8434' }} />
            <div>
              <div style={styles.contactLabel}>ИНН</div>
              <div style={styles.contactValue}>263516890557</div>
            </div>
          </div>

          <div style={styles.contactCard}>
            <Mail size={20} style={{ color: '#de8434' }} />
            <div>
              <div style={styles.contactLabel}>Email для связи</div>
              <a href="mailto:delovoi.acount@gmail.com" style={styles.contactLink}>
                delovoi.acount@gmail.com
              </a>
            </div>
          </div>

          <div style={styles.contactCard}>
            <Phone size={20} style={{ color: '#de8434' }} />
            <div>
              <div style={styles.contactLabel}>Телефон</div>
              <a href="tel:+79633873434" style={styles.contactLink}>
                +7 (963) 387-34-34
              </a>
              <div style={styles.contactNote}>Рабочие часы: 10:00-19:00 МСК</div>
            </div>
          </div>

          <div style={styles.contactCard}>
            <MapPin size={20} style={{ color: '#de8434' }} />
            <div>
              <div style={styles.contactLabel}>Официальный сайт</div>
              <a href="https://zuuma.ru" style={styles.contactLink} target="_blank" rel="noopener noreferrer">
                https://zuuma.ru
              </a>
            </div>
          </div>

          <div style={styles.contactCard}>
            <CreditCard size={20} style={{ color: '#de8434' }} />
            <div>
              <div style={styles.contactLabel}>Платёжная система</div>
              <div style={styles.contactValue}>ЮKassa (ООО «ЮМани»)</div>
            </div>
          </div>
        </div>

        <div style={styles.infoBox}>
          <p style={{margin: 0}}>
            📧 <strong>По всем вопросам</strong> пишите на email: <a href="mailto:delovoi.acount@gmail.com" style={styles.contactLink}>delovoi.acount@gmail.com</a>
            <br/>
            Мы отвечаем в течение 24 часов в рабочие дни.
          </p>
        </div>
      </section>

      {/* 5. Способы оплаты */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <CreditCard size={24} />
          <h2 style={styles.sectionTitle}>5. Способы оплаты</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Оплата производится через платёжную систему <strong>ЮKassa</strong>. 
            Доступные способы оплаты:
          </p>
          <ul style={styles.list}>
            <li>Банковские карты (Visa, MasterCard, Мир)</li>
            <li>ЮMoney</li>
            <li>QIWI кошелёк</li>
            <li>Сбербанк Онлайн</li>
            <li>Альфа-Клик</li>
          </ul>
          <div style={styles.highlightBox}>
            <p style={{margin: 0}}>
              🔒 <strong>Безопасность:</strong> Все платежи защищены по стандарту PCI DSS. 
              Мы не храним данные ваших банковских карт.
            </p>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <div style={styles.footerNote}>
        <p style={{margin: '0 0 8px 0', fontSize: '14px'}}>
          Дата публикации оферты: 19 октября 2025 года
        </p>
        <p style={{margin: 0, fontSize: '12px', color: '#999'}}>
          Совершая оплату, вы подтверждаете, что ознакомились с условиями оферты и согласны с ними.
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    backgroundColor: '#121212',
    color: '#E0E0E0',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '60px',
    paddingBottom: '30px',
    borderBottom: '1px solid #333',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginTop: '20px',
    marginBottom: '12px',
    color: '#E0E0E0',
  },
  subtitle: {
    fontSize: '18px',
    color: '#999',
  },
  section: {
    marginBottom: '48px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    color: '#ffffffff',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  serviceCard: {
    background: '#1E1E1E',
    borderRadius: '12px',
    padding: '28px 24px',
    border: '1px solid #333',
    position: 'relative' as const,
    transition: 'transform 0.2s, border-color 0.2s',
  },
  popularCard: {
    borderColor: '#ffffffff',
    boxShadow: '0 0 20px rgba(76, 175, 80, 0.2)',
  },
  planBadge: {
    position: 'absolute' as const,
    top: '12px',
    right: '12px',
    background: '#333',
    color: '#E0E0E0',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  popularBadge: {
    background: '#ffffffff',
    color: '#000',
  },
  serviceTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '12px',
    marginTop: '8px',
  },
  servicePrice: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#ffffffff',
    marginBottom: '20px',
  },
  pricePeriod: {
    fontSize: '16px',
    fontWeight: 'normal',
    color: '#999',
  },
  serviceFeatures: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 16px 0',
    fontSize: '14px',
    lineHeight: '2',
  },
  serviceNote: {
    fontSize: '13px',
    color: '#999',
    fontStyle: 'italic' as const,
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #333',
  },
  textBlock: {
    background: '#1E1E1E',
    borderRadius: '12px',
    padding: '28px',
    border: '1px solid #333',
    lineHeight: '1.8',
  },
  paragraph: {
    marginBottom: '16px',
    lineHeight: '1.8',
  },
  list: {
    marginTop: '12px',
    marginBottom: '16px',
    paddingLeft: '24px',
    lineHeight: '1.8',
  },
  subheading: {
    fontSize: '18px',
    fontWeight: '600',
    marginTop: '24px',
    marginBottom: '12px',
    color: '#ffffffff',
  },
  highlightBox: {
    background: '#2A2A2A',
    borderLeft: '4px solid #ffffffff',
    padding: '16px 20px',
    marginTop: '20px',
    marginBottom: '20px',
    borderRadius: '4px',
  },
  infoBox: {
    background: '#1E1E1E',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#ffffffff',
  },
  requisitesBox: {
    background: '#2A2A2A',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '16px',
    marginBottom: '24px',
    border: '1px solid #ffffffff',
  },
  requisitesTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#ffffffff',
  },
  requisitesGrid: {
    display: 'grid',
    gap: '12px',
  },
  requisiteItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #333',
  },
  requisiteLabel: {
    fontSize: '14px',
    color: '#999',
  },
  requisiteValue: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#E0E0E0',
  },
  contactsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  contactCard: {
    background: '#1E1E1E',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #333',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  },
  contactLabel: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '6px',
  },
  contactValue: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#E0E0E0',
  },
  contactLink: {
    fontSize: '16px',
    color: '#ffffffff',
    textDecoration: 'none',
    display: 'block',
  },
  contactNote: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
  },
  footerNote: {
    textAlign: 'center' as const,
    marginTop: '60px',
    paddingTop: '30px',
    borderTop: '1px solid #333',
    color: '#999',
  },
};