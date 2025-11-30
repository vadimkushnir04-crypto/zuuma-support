import React from "react";
import { Shield, Lock, Eye, Database, UserCheck, FileText } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Shield size={40} style={{ color: '#de8434' }} />
        <h1 style={styles.title}>Политика конфиденциальности</h1>
        <p style={styles.subtitle}>
          Как мы собираем, используем и защищаем ваши данные
        </p>
      </div>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>1. Общие положения</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты 
            персональных данных пользователей платформы Zuuma (далее — «Платформа»).
          </p>
          <p style={styles.paragraph}>
            Используя Платформу, вы соглашаетесь с условиями настоящей Политики конфиденциальности.
          </p>
          <div style={styles.infoBox}>
            <p style={{margin: 0}}>
              <strong>Оператор персональных данных:</strong> Кушнир Вадим Олегович (самозанятый)<br/>
              <strong>ИНН:</strong> 263516890557<br/>
              <strong>Email:</strong> delovoi.acount@gmail.com
            </p>
            <p style={styles.paragraph}>
              Обработка персональных данных осуществляется в целях предоставления доступа к функционалу Платформы, 
              выполнения обязательств по оказанию услуг и соблюдения требований законодательства Российской Федерации. 
              Исполнитель действует как оператор персональных данных в соответствии с ФЗ-152 «О персональных данных».
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Database size={24} />
          <h2 style={styles.sectionTitle}>2. Какие данные мы собираем</h2>
        </div>
        <div style={styles.textBlock}>
          <h4 style={styles.subheading}>2.1. Данные при регистрации</h4>
          <ul style={styles.list}>
            <li>Email адрес</li>
            <li>Имя (опционально)</li>
            <li>Пароль (в зашифрованном виде)</li>
          </ul>

          <h4 style={styles.subheading}>2.2. Данные при использовании сервиса</h4>
          <ul style={styles.list}>
            <li>История действий в личном кабинете (audit log)</li>
            <li>Загруженные документы и файлы</li>
            <li>Созданные AI-ассистенты и их настройки</li>
            <li>API-функции и их код</li>
            <li>История чатов с AI-ассистентами</li>
            <li>IP-адреса и User-Agent браузера</li>
          </ul>

          <h4 style={styles.subheading}>2.3. Данные при оплате</h4>
          <ul style={styles.list}>
            <li>Информация о платежах (обрабатывается через ЮKassa)</li>
            <li>История подписок и транзакций</li>
            <li>
              Мы не обрабатываем и не храним данные банковских карт. 
              Платёжная информация обрабатывается исключительно сервисом ЮKassa 
              (ООО «ЮКасса», ОГРН 1167746597059) в соответствии с их политикой конфиденциальности.
            </li>
          </ul>

          <h4 style={styles.subheading}>2.4. Технические данные</h4>
          <ul style={styles.list}>
            <li>Cookies (для аутентификации)</li>
            <li>Логи ошибок и производительности</li>
            <li>Данные аналитики (анонимно)</li>
          </ul>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Eye size={24} />
          <h2 style={styles.sectionTitle}>3. Как мы используем данные</h2>
        </div>
        <div style={styles.textBlock}>
          <ul style={styles.list}>
            <li><strong>Предоставление услуг:</strong> Для работы AI-ассистентов и обработки ваших запросов</li>
            <li><strong>Аутентификация:</strong> Для входа в личный кабинет</li>
            <li><strong>Биллинг:</strong> Для управления подписками и платежами</li>
            <li><strong>Поддержка:</strong> Для ответов на ваши вопросы и решения проблем</li>
            <li><strong>Безопасность:</strong> Для защиты от мошенничества и злоупотреблений</li>
            <li><strong>Улучшение сервиса:</strong> Для анализа использования и улучшения функционала</li>
            <li><strong>Юридическая защита:</strong> Audit logs используются для разрешения споров</li>
          </ul>

          <div style={styles.highlightBox}>
            <p style={{margin: 0}}>
              ✅ <strong>Мы НЕ продаем и НЕ передаем</strong> ваши персональные данные третьим лицам 
              в маркетинговых целях.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Lock size={24} />
          <h2 style={styles.sectionTitle}>4. Как мы защищаем данные</h2>
        </div>
        <div style={styles.textBlock}>
          <h4 style={styles.subheading}>Меры безопасности:</h4>
          <ul style={styles.list}>
            <li><strong>Шифрование паролей:</strong> Используем bcrypt для хеширования паролей</li>
            <li><strong>HTTPS:</strong> Все данные передаются по защищенному протоколу</li>
            <li><strong>JWT токены:</strong> Для безопасной аутентификации</li>
            <li><strong>Резервное копирование:</strong> Регулярные бэкапы базы данных</li>
            <li><strong>Ограничение доступа:</strong> Только авторизованный персонал имеет доступ к данным</li>
            <li><strong>Мониторинг:</strong> Отслеживание подозрительной активности</li>
          </ul>

          <div style={styles.warningBox}>
            <p style={{margin: 0}}>
              ⚠️ <strong>Важно:</strong> Несмотря на применение современных методов защиты, 
              ни один способ передачи данных через интернет или электронного хранения 
              не может гарантировать абсолютную безопасность. Пользователь понимает и принимает этот риск.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <UserCheck size={24} />
          <h2 style={styles.sectionTitle}>5. Ваши права</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>Вы имеете право:</p>
          <ul style={styles.list}>
            <li><strong>Доступ к данным:</strong> Запросить копию ваших персональных данных</li>
            <li><strong>Исправление:</strong> Обновить или исправить неточные данные</li>
            <li><strong>Удаление:</strong> Запросить удаление вашего аккаунта и всех данных</li>
            <li><strong>Экспорт:</strong> Получить ваши данные в машиночитаемом формате</li>
            <li><strong>Отзыв согласия:</strong> Отозвать согласие на обработку персональных данных</li>
          </ul>

          <div style={styles.infoBox}>
            <p style={{margin: 0}}>
              📧 Для реализации ваших прав напишите на: 
              <a href="mailto:delovoi.acount@gmail.com" style={styles.link}> delovoi.acount@gmail.com</a>
              <br/>
              Мы ответим в течение 30 дней.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Database size={24} />
          <h2 style={styles.sectionTitle}>6. Хранение данных</h2>
        </div>
        <div style={styles.textBlock}>
          <ul style={styles.list}>
            <li><strong>Данные аккаунта:</strong> Хранятся до удаления аккаунта</li>
            <li><strong>Audit logs:</strong> Хранятся 3 года (для юридической защиты)</li>
            <li><strong>История платежей:</strong> Хранятся 5 лет (требование законодательства)</li>
            <li><strong>Резервные копии:</strong> Удаляются через 30 дней после удаления аккаунта</li>
            <li><strong>Логи ошибок:</strong> Хранятся 6 месяцев</li>
          </ul>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>7. Cookies</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>Мы используем cookies для:</p>
          <ul style={styles.list}>
            <li><strong>Аутентификации:</strong> Сохранение вашей сессии</li>
            <li><strong>Настройки:</strong> Язык интерфейса, тема оформления</li>
            <li><strong>Аналитика:</strong> Понимание использования сервиса (анонимно)</li>
          </ul>

          <p style={styles.paragraph}>
            Вы можете отключить cookies в настройках браузера, но это может ограничить 
            функциональность сервиса.
          </p>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Shield size={24} />
          <h2 style={styles.sectionTitle}>8. Передача данных третьим лицам</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>Мы можем передавать данные следующим третьим лицам:</p>
          <ul style={styles.list}>
            <li><strong>ЮKassa:</strong> Для обработки платежей (они имеют свою политику конфиденциальности)</li>
            <li><strong>Хостинг-провайдер:</strong> Для хранения данных на серверах</li>
            <li><strong>Государственные органы:</strong> По требованию закона</li>
          </ul>

          <p style={styles.paragraph}>
            Исполнитель не несёт ответственности за обработку данных третьими лицами, 
            если такая обработка осуществляется ими на законных основаниях и в рамках их собственных политик конфиденциальности.
          </p>

          <div style={styles.highlightBox}>
            <p style={{margin: 0}}>
              🔒 Все третьи лица обязаны соблюдать конфиденциальность ваших данных.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>9. Дети</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Наш сервис не предназначен для лиц младше 18 лет. Мы сознательно не собираем 
            персональные данные детей. Если вы узнали, что ребенок предоставил нам свои данные, 
            свяжитесь с нами для их удаления.
          </p>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>10. Изменения в политике</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Мы можем время от времени обновлять настоящую Политику конфиденциальности. 
            Актуальная версия всегда доступна на сайте Платформы. 
            Продолжая использование сервиса после изменений, вы соглашаетесь с обновлённой редакцией.
          </p>
          <p style={styles.paragraph}>
            <strong>Дата последнего обновления:</strong> 21 октября 2025 года
          </p>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>11. Контакты</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Если у вас есть вопросы по поводу этой Политики конфиденциальности, свяжитесь с нами:
          </p>
          <div style={styles.contactBox}>
            <p style={{margin: 0}}>
              <strong>Email:</strong> <a href="mailto:delovoi.acount@gmail.com" style={styles.link}>delovoi.acount@gmail.com</a><br/>
              <strong>Телефон:</strong> +7 (963) 387-34-34<br/>
              <strong>Сайт:</strong> <a href="https://zuuma.ru" style={styles.link} target="_blank" rel="noopener noreferrer">https://zuuma.ru</a>
            </p>
          </div>
        </div>
      </section>

      <div style={styles.footerNote}>
        <p style={{margin: 0}}>
          Используя Платформу, вы подтверждаете, что прочитали и согласны с настоящей 
          Политикой конфиденциальности.
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
    color: '#de8434',
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
    color: '#de8434',
  },
  highlightBox: {
    background: '#2A2A2A',
    borderLeft: '4px solid #de8434',
    padding: '16px 20px',
    marginTop: '20px',
    marginBottom: '20px',
    borderRadius: '4px',
  },
  warningBox: {
    background: '#2A1515',
    borderLeft: '4px solid #ff6b6b',
    padding: '16px 20px',
    marginTop: '20px',
    marginBottom: '20px',
    borderRadius: '4px',
  },
  infoBox: {
    background: '#2A2A2A',
    border: '1px solid #de8434',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px',
  },
  contactBox: {
    background: '#2A2A2A',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '16px',
  },
  link: {
    color: '#de8434',
    textDecoration: 'none',
  },
  footerNote: {
    textAlign: 'center',
    marginTop: '60px',
    paddingTop: '30px',
    borderTop: '1px solid #333',
    color: '#999',
    fontSize: '14px',
  },
};