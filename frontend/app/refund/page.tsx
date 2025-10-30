import React from "react";
import { CreditCard, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <CreditCard size={40} style={{ color: '#4CAF50' }} />
        <h1 style={styles.title}>Политика возврата средств</h1>
        <p style={styles.subtitle}>
          Условия и порядок возврата оплаты за подписку
        </p>
      </div>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <CheckCircle size={24} />
          <h2 style={styles.sectionTitle}>1. Условия возврата</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Мы стремимся обеспечить высокое качество услуг и понимаем, что иногда могут возникнуть ситуации, 
            при которых возврат возможен. Решение о возврате принимается Исполнителем после проверки факта 
            использования услуги и в соответствии с условиями настоящей политики.
          </p>

          <h4 style={styles.subheading}>1.1. Когда возможен возврат:</h4>
          <div style={styles.successBox}>
            <p style={{margin: '0 0 12px 0', fontWeight: 'bold'}}>
              ✅ Возврат ВОЗМОЖЕН в следующих случаях:
            </p>
            <p style={{margin: '0 0 12px 0', fontSize: '14px'}}>
              Эти условия описывают случаи, когда возврат может быть рассмотрен, но не гарантируется.
            </p>
            <ul style={styles.list}>
              <li>Прошло не более <strong>7 дней</strong> с момента оплаты</li>
              <li>Токены <strong>НЕ были использованы</strong> (баланс = 100%)</li>
              <li>Вы не создавали AI-ассистентов</li>
              <li>Вы не загружали документы</li>
              <li>Вы не использовали API</li>
            </ul>
          </div>

          <h4 style={styles.subheading}>1.2. Когда возврат НЕВОЗМОЖЕН:</h4>
          <div style={styles.errorBox}>
            <p style={{margin: '0 0 12px 0', fontWeight: 'bold'}}>
              ❌ Возврат НЕВОЗМОЖЕН в следующих случаях:
            </p>
            <ul style={styles.list}>
              <li>Прошло более 7 дней с момента оплаты</li>
              <li>Токены были использованы (даже частично)</li>
              <li>Были созданы AI-ассистенты</li>
              <li>Были загружены документы для обучения</li>
              <li>Использовался API доступ</li>
              <li>Были интеграции с Telegram или другими сервисами</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Clock size={24} />
          <h2 style={styles.sectionTitle}>2. Сроки возврата</h2>
        </div>
        <div style={styles.textBlock}>
          <div style={styles.timeline}>
            <div style={styles.timelineItem}>
              <div style={styles.timelineDot}></div>
              <div style={styles.timelineContent}>
                <h4 style={styles.timelineTitle}>День 1-7</h4>
                <p style={styles.timelineText}>
                  Период, в течение которого можно запросить возврат (при условии неиспользования услуги)
                </p>
              </div>
            </div>

            <div style={styles.timelineItem}>
              <div style={styles.timelineDot}></div>
              <div style={styles.timelineContent}>
                <h4 style={styles.timelineTitle}>День 8-14</h4>
                <p style={styles.timelineText}>
                  Рассмотрение заявки на возврат. Мы проверяем использование токенов и активность аккаунта
                </p>
              </div>
            </div>

            <div style={styles.timelineItem}>
              <div style={styles.timelineDot}></div>
              <div style={styles.timelineContent}>
                <h4 style={styles.timelineTitle}>День 15-30</h4>
                <p style={styles.timelineText}>
                  Возврат средств на вашу карту (через платежную систему ЮKassa)
                </p>
              </div>
            </div>
          </div>

          <div style={styles.infoBox}>
            <p style={{margin: 0}}>
              ⏱️ <strong>Максимальный срок возврата:</strong> 30 рабочих дней с момента одобрения заявки
            </p>
          </div>
          <p style={styles.paragraph}>
            Исполнитель не несёт ответственности за задержки, вызванные платёжными системами или банками, 
            а также за действия третьих лиц, участвующих в процессе перевода средств.
          </p>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <AlertTriangle size={24} style={{ color: '#ff9800' }} />
          <h2 style={styles.sectionTitle}>3. Как запросить возврат</h2>
        </div>
        <div style={styles.textBlock}>
          <h4 style={styles.subheading}>Шаг 1: Отправьте запрос</h4>
          <p style={styles.paragraph}>
            Напишите письмо на email: <a href="mailto:delovoi.acount@gmail.com" style={styles.link}>delovoi.acount@gmail.com</a>
          </p>

          <h4 style={styles.subheading}>Шаг 2: Укажите информацию</h4>
          <div style={styles.codeBlock}>
            <p style={{margin: '0 0 8px 0', fontWeight: 'bold'}}>Тема письма: Запрос на возврат средств</p>
            <p style={{margin: '0 0 4px 0'}}>В письме укажите:</p>
            <ul style={{margin: '8px 0', paddingLeft: '20px'}}>
              <li>Email, использованный при регистрации</li>
              <li>Номер платежа (из ЮKassa)</li>
              <li>Дата оплаты</li>
              <li>Сумма платежа</li>
              <li>Причина возврата</li>
            </ul>
          </div>

          <h4 style={styles.subheading}>Шаг 3: Дождитесь ответа</h4>
          <p style={styles.paragraph}>
            Мы рассмотрим вашу заявку в течение <strong>3 рабочих дней</strong> и сообщим о решении.
          </p>

          <div style={styles.warningBox}>
            <p style={{margin: 0}}>
              ⚠️ <strong>Важно:</strong> Мы проверяем использование токенов и активность аккаунта. 
              Если услуга была использована, возврат будет отклонен.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <CreditCard size={24} />
          <h2 style={styles.sectionTitle}>4. Способ возврата</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Возврат средств производится <strong>на ту же карту</strong>, с которой была произведена оплата, 
            через платежную систему ЮKassa.
          </p>

          <h4 style={styles.subheading}>Что НЕ возвращается:</h4>
          <ul style={styles.list}>
            <li>Комиссии платежной системы (2-3%)</li>
            <li>Комиссии банка (если были)</li>
            <li>Стоимость использованных токенов (если были потрачены)</li>
          </ul>

          <div style={styles.highlightBox}>
            <p style={{margin: 0}}>
              💳 <strong>Пример:</strong> Вы оплатили Pro Plan за 990 ₽. 
              После проверки заявки возврат производится за вычетом комиссий платёжных систем, если таковые применяются.
            </p>
            <p style={{margin: '10px 0 0 0', fontSize: '13px', color: '#888'}}>
              Точная сумма возврата зависит от условий ЮKassa и вашего банка.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <XCircle size={24} style={{ color: '#ff6b6b' }} />
          <h2 style={styles.sectionTitle}>5. Причины отказа в возврате</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Мы можем отказать в возврате средств в следующих случаях:
          </p>

          <ul style={styles.list}>
            <li>Прошло более 7 дней с момента оплаты</li>
            <li>Токены были использованы (даже 1 токен)</li>
            <li>Были созданы AI-ассистенты</li>
            <li>Были загружены документы</li>
            <li>Был получен доступ к API</li>
            <li>Были интеграции с внешними сервисами</li>
            <li>Нарушены условия Пользовательского соглашения</li>
            <li>Обнаружено мошенничество или злоупотребление</li>
          </ul>

          <p style={styles.paragraph}>
            Отказ в возврате осуществляется в соответствии с Гражданским кодексом РФ и условиями публичной оферты, 
            если услуга считается оказанной в полном объёме.
          </p>

          <div style={styles.errorBox}>
            <p style={{margin: 0}}>
              🔴 <strong>Внимание:</strong> Если вы создали AI-ассистента и обучили его на своих документах, 
              возврат средств НЕВОЗМОЖЕН, так как услуга была оказана.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <CheckCircle size={24} />
          <h2 style={styles.sectionTitle}>6. Альтернатива возврату</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Если вы не удовлетворены услугой, мы предлагаем следующие альтернативы:
          </p>

          <div style={styles.alternativeCard}>
            <h4 style={{margin: '0 0 8px 0', color: '#4CAF50'}}>🔄 Перенос токенов</h4>
            <p style={{margin: 0, fontSize: '14px', lineHeight: '1.6'}}>
              Мы можем перенести неиспользованные токены на следующий период (в исключительных случаях).
            </p>
          </div>

          <div style={styles.alternativeCard}>
            <h4 style={{margin: '0 0 8px 0', color: '#4CAF50'}}>📉 Понижение тарифа</h4>
            <p style={{margin: 0, fontSize: '14px', lineHeight: '1.6'}}>
              Вы можете перейти на более низкий тарифный план с возвратом разницы.
            </p>
          </div>

          <div style={styles.alternativeCard}>
            <h4 style={{margin: '0 0 8px 0', color: '#4CAF50'}}>🆓 Дополнительные токены</h4>
            <p style={{margin: 0, fontSize: '14px', lineHeight: '1.6'}}>
              При технических проблемах мы можем добавить бесплатные токены в качестве компенсации.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <AlertTriangle size={24} />
          <h2 style={styles.sectionTitle}>7. Контакты для возврата</h2>
        </div>
        <div style={styles.textBlock}>
          <div style={styles.contactBox}>
            <p style={{margin: '0 0 12px 0', fontWeight: 'bold', fontSize: '16px'}}>
              Для запроса возврата обращайтесь:
            </p>
            <p style={{margin: '8px 0'}}>
              📧 <strong>Email:</strong>{' '}
              <a href="mailto:delovoi.acount@gmail.com" style={styles.link}>
                delovoi.acount@gmail.com
              </a>
            </p>
            <p style={{margin: '8px 0'}}>
              📞 <strong>Телефон:</strong>{' '}
              <a href="tel:+79633873434" style={styles.link}>
                +7 (963) 387-34-34
              </a>
              <span style={{fontSize: '13px', color: '#999', marginLeft: '8px'}}>
                (10:00-19:00 МСК)
              </span>
            </p>
            <p style={{margin: '8px 0'}}>
              <strong>Исполнитель:</strong> Кушнир Вадим Олегович
            </p>
            <p style={{margin: '8px 0'}}>
              <strong>ИНН:</strong> 263516890557
            </p>
          </div>

          <div style={styles.infoBox}>
            <p style={{margin: 0}}>
              💡 <strong>Совет:</strong> Перед запросом возврата попробуйте связаться с нашей поддержкой. 
              Возможно, мы сможем решить вашу проблему без возврата средств!
            </p>
          </div>
        </div>
      </section>

      <div style={styles.footerNote}>
        <p style={{margin: '0 0 8px 0', fontSize: '14px'}}>
          Дата обновления: 21 октября 2025 года
        </p>
        <p style={{margin: 0, fontSize: '12px'}}>
          Эта политика возврата является частью{' '}
          <a href="/offer" style={styles.link}>Публичной оферты</a>
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
    color: '#4CAF50',
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
    color: '#4CAF50',
  },
  successBox: {
    background: '#1a2f1a',
    border: '1px solid #4CAF50',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '20px',
  },
  errorBox: {
    background: '#2A1515',
    border: '1px solid #ff6b6b',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '20px',
  },
  warningBox: {
    background: '#2A1A1A',
    border: '1px solid #ff9800',
    borderRadius: '8px',
    padding: '16px 20px',
    marginTop: '20px',
  },
  highlightBox: {
    background: '#2A2A2A',
    borderLeft: '4px solid #4CAF50',
    padding: '16px 20px',
    marginTop: '20px',
    borderRadius: '4px',
  },
  infoBox: {
    background: '#2A2A2A',
    border: '1px solid #4CAF50',
    borderRadius: '8px',
    padding: '16px 20px',
    marginTop: '20px',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '30px',
  },
  timelineItem: {
    position: 'relative',
    paddingBottom: '30px',
  },
  timelineDot: {
    position: 'absolute',
    left: '-30px',
    top: '5px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#4CAF50',
    border: '2px solid #1E1E1E',
  },
  timelineContent: {
    paddingLeft: '0',
  },
  timelineTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#4CAF50',
  },
  timelineText: {
    fontSize: '14px',
    color: '#ccc',
    margin: 0,
    lineHeight: '1.6',
  },
  codeBlock: {
    background: '#2A2A2A',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '12px',
    fontFamily: 'monospace',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  alternativeCard: {
    background: '#2A2A2A',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #333',
  },
  contactBox: {
    background: '#2A2A2A',
    borderRadius: '8px',
    padding: '20px',
    lineHeight: '1.8',
  },
  link: {
    color: '#4CAF50',
    textDecoration: 'none',
  },
  footerNote: {
    textAlign: 'center',
    marginTop: '60px',
    paddingTop: '30px',
    borderTop: '1px solid #333',
    color: '#999',
  },
};