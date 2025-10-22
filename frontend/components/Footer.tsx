import React from 'react';
import Link from 'next/link';
import { FileText, Shield, Scale, CreditCard } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* Main footer content */}
        <div style={styles.grid}>
          {/* Company info */}
          <div style={styles.column}>
            <h3 style={styles.heading}>Zuuma</h3>
            <p style={styles.description}>
              Платформа для создания AI-ассистентов и автоматизации бизнес-процессов
            </p>
            <div style={styles.contact}>
              <p style={styles.contactItem}>ИНН: 263516890557</p>
              <p style={styles.contactItem}>
                <a href="mailto:delovoi.acount@gmail.com" style={styles.link}>
                  delovoi.acount@gmail.com
                </a>
              </p>
              <p style={styles.contactItem}>
                <a href="tel:+79633873434" style={styles.link}>
                  +7 (963) 387-34-34
                </a>
              </p>
            </div>
          </div>

          {/* Legal documents */}
          <div style={styles.column}>
            <h4 style={styles.columnTitle}>
              <Scale size={16} style={{ marginRight: '8px' }} />
              Юридические документы
            </h4>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <Link href="/offer" style={styles.link}>
                  <FileText size={14} style={{ marginRight: '6px' }} />
                  Публичная оферта
                </Link>
              </li>
              <li style={styles.listItem}>
                <Link href="/terms" style={styles.link}>
                  <FileText size={14} style={{ marginRight: '6px' }} />
                  Пользовательское соглашение
                </Link>
              </li>
              <li style={styles.listItem}>
                <Link href="/privacy" style={styles.link}>
                  <Shield size={14} style={{ marginRight: '6px' }} />
                  Политика конфиденциальности
                </Link>
              </li>
              <li style={styles.listItem}>
                <Link href="/offer#refund" style={styles.link}>
                  <CreditCard size={14} style={{ marginRight: '6px' }} />
                  Возврат средств
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div style={styles.column}>
            <h4 style={styles.columnTitle}>Быстрые ссылки</h4>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <Link href="/assistants" style={styles.link}>
                  AI-ассистенты
                </Link>
              </li>
              <li style={styles.listItem}>
                <Link href="/tutorials" style={styles.link}>
                  Руководства
                </Link>
              </li>
              <li style={styles.listItem}>
                <Link href="/integrations" style={styles.link}>
                  Интеграции
                </Link>
              </li>
              <li style={styles.listItem}>
                <Link href="/support" style={styles.link}>
                  Поддержка
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment info */}
          <div style={styles.column}>
            <h4 style={styles.columnTitle}>Способы оплаты</h4>
            <p style={styles.smallText}>
              Платежи обрабатываются через ЮKassa (ООО «ЮМани»)
            </p>
            <p style={{...styles.smallText, marginTop: '12px'}}>
              Принимаем: Visa, MasterCard, Мир, ЮMoney, QIWI
            </p>
            <div style={styles.securityBadge}>
              🔒 PCI DSS Certified
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={styles.bottomBar}>
          <div style={styles.bottomLeft}>
            <p style={styles.copyright}>
              © {currentYear} Кушнир Вадим Олегович (самозанятый)
            </p>
            <p style={styles.disclaimer}>
              Все права защищены. ИНН: 263516890557
            </p>
          </div>
          <div style={styles.bottomRight}>
            <p style={styles.smallText}>
              Используя сайт, вы соглашаетесь с{' '}
              <Link href="/terms" style={styles.highlightLink}>
                условиями использования
              </Link>{' '}
              и{' '}
              <Link href="/privacy" style={styles.highlightLink}>
                политикой конфиденциальности
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  footer: {
    backgroundColor: '#1a1a1a',
    borderTop: '1px solid #333',
    marginTop: 'auto',
    padding: '48px 20px 24px',
    color: '#E0E0E0',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '32px',
    marginBottom: '40px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#4CAF50',
  },
  description: {
    fontSize: '14px',
    color: '#999',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  contact: {
    marginTop: '8px',
  },
  contactItem: {
    fontSize: '14px',
    margin: '6px 0',
    color: '#ccc',
  },
  columnTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#E0E0E0',
    display: 'flex',
    alignItems: 'center',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    marginBottom: '10px',
  },
  link: {
    color: '#999',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  highlightLink: {
    color: '#4CAF50',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  smallText: {
    fontSize: '13px',
    color: '#999',
    lineHeight: '1.6',
  },
  securityBadge: {
    marginTop: '16px',
    padding: '8px 12px',
    backgroundColor: '#2a2a2a',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#4CAF50',
    fontWeight: '500',
    display: 'inline-block',
  },
  bottomBar: {
    borderTop: '1px solid #333',
    paddingTop: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  bottomLeft: {
    flex: '1',
  },
  bottomRight: {
    flex: '1',
    textAlign: 'right',
  },
  copyright: {
    fontSize: '14px',
    color: '#999',
    margin: '4px 0',
  },
  disclaimer: {
    fontSize: '12px',
    color: '#666',
    margin: '4px 0',
  },
};