"use client";

import React from "react";
import { AlertTriangle, ShieldOff, Code, Database, Zap } from "lucide-react";
import Link from "next/link";

export default function DisclaimerPage() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <AlertTriangle size={40} style={{ color: '#ff6b6b' }} />
        <h1 style={styles.title}>Отказ от ответственности</h1>
        <p style={styles.subtitle}>
          Важная информация об ограничении ответственности платформы
        </p>
      </div>

      {/* Предупреждение */}
      <div style={styles.criticalWarning}>
        <h3 style={{margin: '0 0 12px 0', fontSize: '18px'}}>
          ⚠️ КРИТИЧЕСКИ ВАЖНО: ВНИМАТЕЛЬНО ПРОЧИТАЙТЕ
        </h3>
        <p style={{margin: 0, lineHeight: '1.6'}}>
          Используя платформу Zuuma, вы подтверждаете, что понимаете и принимаете все риски, 
          связанные с использованием AI-технологий и пользовательских API-функций. 
          Платформа предоставляется «как есть» (AS IS), без гарантий каких-либо результатов, 
          точности, непрерывности или соответствия конкретным целям. 
          Исполнитель не несёт ответственности за любые последствия использования сервиса.
        </p>
      </div>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Code size={24} />
          <h2 style={styles.sectionTitle}>1. Ответственность за API-функции</h2>
        </div>
        <div style={styles.textBlock}>
          <h4 style={styles.subheading}>1.1. Пользовательские функции</h4>
          <p style={styles.paragraph}>
            <strong>Пользователь самостоятельно несёт ответственность</strong> за API-функции, которые он создает и использует на платформе.
          </p>

          <div style={styles.dangerBox}>
            <p style={{margin: '0 0 12px 0', fontWeight: 'bold'}}>
              🔴 ОПАСНЫЕ ОПЕРАЦИИ:
            </p>
            <ul style={styles.list}>
              <li>DELETE FROM — удаление данных из базы</li>
              <li>DROP TABLE — удаление таблиц</li>
              <li>DROP DATABASE — удаление базы данных</li>
              <li>TRUNCATE — очистка таблиц</li>
              <li>ALTER TABLE — изменение структуры БД</li>
              <li>Любые деструктивные команды в API</li>
            </ul>
          </div>

          <h4 style={styles.subheading}>1.2. Что НЕ делает платформа:</h4>
          <ul style={styles.list}>
            <li>❌ НЕ проверяет безопасность кода функций</li>
            <li>❌ НЕ блокирует опасные операции</li>
            <li>❌ НЕ предупреждает об удалении данных</li>
            <li>❌ НЕ создает резервные копии ваших данных</li>
            <li>❌ НЕ может отменить выполненные операции</li>
          </ul>

          <div style={styles.highlightBox}>
            <p style={{margin: '0 0 8px 0', fontWeight: 'bold'}}>
              📋 Для защиты обеих сторон:
            </p>
            <p style={{margin: 0}}>
              Все ваши действия с API-функциями логируются, включая полный код функции, 
              время создания/изменения/выполнения и IP-адрес.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Zap size={24} />
          <h2 style={styles.sectionTitle}>2. Ответственность за AI-контент</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            AI-ассистенты генерируют ответы с использованием технологий искусственного интеллекта. 
            Платформа не гарантирует точность, полноту или применимость сгенерированной информации. 
            Любые решения, принятые Пользователем на основании AI-контента, совершаются на его собственный риск.
          </p>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <ShieldOff size={24} />
          <h2 style={styles.sectionTitle}>3. Общие ограничения ответственности</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Платформа Zuuma предоставляется на условиях «как есть» (AS IS). 
            Исполнитель не несёт ответственности за:
          </p>
          <ul style={styles.list}>
            <li>ошибки, сбои и перерывы в работе сервиса;</li>
            <li>утрату данных, вызванную действиями Пользователя или третьих лиц;</li>
            <li>несовместимость с оборудованием или программным обеспечением Пользователя;</li>
            <li>косвенные, случайные или последующие убытки любого рода.</li>
          </ul>
          <p style={styles.paragraph}>
            Максимальная ответственность Исполнителя ограничена стоимостью оплаченного Пользователем периода использования.
          </p>
        </div>
      </section>

      <div style={styles.footerNote}>
        <p style={{margin: 0}}>
          Дата обновления: 21 октября 2025 года
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 20px',
    backgroundColor: '#121212',
    color: '#E0E0E0',
  },
  header: {
    textAlign: 'center',
    marginBottom: '60px',
    paddingBottom: '30px',
    borderBottom: '1px solid #333',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginTop: '20px',
    marginBottom: '12px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#999',
  },
  criticalWarning: {
    background: '#2A0A0A',
    border: '2px solid #ff6b6b',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '40px',
  },
  section: {
    marginBottom: '48px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    color: '#ff6b6b',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: 0,
  },
  textBlock: {
    background: '#1E1E1E',
    borderRadius: '12px',
    padding: '28px',
    border: '1px solid #333',
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
    color: '#ff9800',
  },
  dangerBox: {
    background: '#2A1515',
    border: '2px solid #ff6b6b',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '16px',
  },
  highlightBox: {
    background: '#1a2f1a',
    borderLeft: '4px solid #de8434',
    padding: '16px 20px',
    marginTop: '20px',
    borderRadius: '4px',
  },
  footerNote: {
    textAlign: 'center',
    marginTop: '60px',
    paddingTop: '30px',
    borderTop: '1px solid #333',
    color: '#999',
  },
};