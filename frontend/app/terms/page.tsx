import React from "react";
import { FileText, CheckCircle, XCircle, AlertTriangle, Scale } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <FileText size={40} style={{ color: '#4CAF50' }} />
        <h1 style={styles.title}>Пользовательское соглашение</h1>
        <p style={styles.subtitle}>
          Условия использования платформы Zuuma
        </p>
      </div>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <CheckCircle size={24} />
          <h2 style={styles.sectionTitle}>1. Принятие условий</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения 
            между Кушнир Вадимом Олеговичем (ИНН: 263516890557) (далее — «Исполнитель») 
            и пользователем платформы Zuuma (далее — «Пользователь»).
          </p>
          <p style={styles.paragraph}>
            <strong>Регистрируясь на Платформе или используя её</strong>, вы подтверждаете, что:
          </p>
          <ul style={styles.list}>
            <li>Вам исполнилось 18 лет</li>
            <li>Вы прочитали, поняли и согласны с условиями настоящего Соглашения</li>
            <li>Вы обладаете необходимыми полномочиями для заключения данного Соглашения</li>
          </ul>

          <div style={styles.warningBox}>
            <p style={{margin: 0}}>
              ⚠️ Если вы не согласны с условиями Соглашения, немедленно прекратите использование Платформы.
            </p>
          </div>
          <p style={styles.paragraph}>
            Использование Платформы не создает между Сторонами трудовых отношений, партнерства, агентских 
            отношений или отношений поручения. Пользователь действует от своего имени и на свой риск.
          </p>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>2. Описание услуг</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Платформа Zuuma предоставляет следующие услуги:
          </p>
          <ul style={styles.list}>
            <li>Создание и настройка AI-ассистентов на базе языковых моделей</li>
            <li>Загрузка и обработка документов для обучения AI-ассистентов</li>
            <li>Создание пользовательских API-функций для расширения возможностей ассистентов</li>
            <li>Интеграция с Telegram ботами</li>
            <li>API доступ для интеграции с внешними системами</li>
            <li>Веб-виджет для встраивания на сайты</li>
          </ul>

          <div style={styles.infoBox}>
            <p style={{margin: 0}}>
              📋 Полный список функций зависит от выбранного тарифного плана.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <CheckCircle size={24} />
          <h2 style={styles.sectionTitle}>3. Права и обязанности Пользователя</h2>
        </div>
        <div style={styles.textBlock}>
          <h4 style={styles.subheading}>3.1. Пользователь имеет право:</h4>
          <ul style={styles.list}>
            <li>Использовать Платформу в соответствии с выбранным тарифным планом</li>
            <li>Создавать AI-ассистентов и настраивать их параметры</li>
            <li>Загружать документы для обучения ассистентов</li>
            <li>Создавать API-функции</li>
            <li>Интегрировать Платформу с внешними сервисами</li>
            <li>Получать техническую поддержку</li>
          </ul>

          <h4 style={styles.subheading}>3.2. Пользователь обязуется:</h4>
          <ul style={styles.list}>
            <li>Предоставлять достоверную информацию при регистрации</li>
            <li>Сохранять конфиденциальность учетных данных (логин и пароль)</li>
            <li>Немедленно уведомлять о несанкционированном доступе к аккаунту</li>
            <li>Не использовать Платформу для незаконной деятельности</li>
            <li>Не нарушать авторские права при загрузке документов</li>
            <li>Не пытаться получить несанкционированный доступ к системе</li>
            <li>Не создавать контент, нарушающий законодательство РФ</li>
          </ul>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <XCircle size={24} style={{ color: '#ff6b6b' }} />
          <h2 style={styles.sectionTitle}>4. Запрещенное использование</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            <strong>Запрещается использовать Платформу для:</strong>
          </p>
          <ul style={styles.list}>
            <li>Создания контента, пропагандирующего насилие, экстремизм или дискриминацию</li>
            <li>Распространения вредоносного ПО, вирусов или троянов</li>
            <li>Фишинга, мошенничества или обмана пользователей</li>
            <li>Спама или массовых рассылок</li>
            <li>Нарушения авторских прав или интеллектуальной собственности</li>
            <li>Сбора персональных данных третьих лиц без их согласия</li>
            <li>Перепродажи доступа к Платформе без разрешения</li>
            <li>DDoS-атак или перегрузки системы</li>
            <li>Обхода ограничений тарифных планов</li>
          </ul>

          <div style={styles.dangerBox}>
            <p style={{margin: 0}}>
              🔴 <strong>Внимание:</strong> Нарушение этих правил приведет к немедленной блокировке 
              аккаунта без возврата средств.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <AlertTriangle size={24} style={{ color: '#ff9800' }} />
          <h2 style={styles.sectionTitle}>5. Ответственность за API-функции</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            <strong>КРИТИЧЕСКИ ВАЖНО:</strong> Пользователь несет полную ответственность за 
            API-функции, которые он создает и использует.
          </p>

          <h4 style={styles.subheading}>5.1. Пользователь понимает и соглашается:</h4>
          <ul style={styles.list}>
            <li>API-функции выполняются от имени Пользователя и на его риск</li>
            <li>Платформа НЕ контролирует код функций и НЕ несет ответственности за их действия</li>
            <li>Пользователь обязан тестировать функции перед использованием в продакшене</li>
            <li>Особую осторожность следует проявлять с функциями, выполняющими операции DELETE, DROP, TRUNCATE</li>
            <li>Платформа НЕ возмещает ущерб от неправильно работающих функций</li>
          </ul>

          <h4 style={styles.subheading}>5.2. Логирование действий</h4>
          <p style={styles.paragraph}>
            Все действия с API-функциями логируются и могут быть использованы в качестве 
            доказательств в спорных ситуациях, включая:
          </p>
          <ul style={styles.list}>
            <li>Создание функции с сохранением кода</li>
            <li>Изменение функции с сохранением нового кода</li>
            <li>Удаление функции</li>
            <li>Выполнение функции с записью параметров и результатов</li>
            <li>IP-адрес и время выполнения действий</li>
          </ul>

          <div style={styles.warningBox}>
            <p style={{margin: 0}}>
              ⚠️ <strong>Пример:</strong> Если вы создадите функцию с SQL-запросом "DELETE FROM users" 
              и выполните её, вся ответственность за удаление данных лежит на вас. У нас будут 
              доказательства (логи), что функцию создали и вызвали именно вы.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Scale size={24} />
          <h2 style={styles.sectionTitle}>6. Права и обязанности Исполнителя</h2>
        </div>
        <div style={styles.textBlock}>
          <h4 style={styles.subheading}>6.1. Исполнитель обязуется:</h4>
          <ul style={styles.list}>
            <li>Предоставить доступ к Платформе после оплаты</li>
            <li>Защищать персональные данные Пользователя</li>
            <li>Предоставлять техническую поддержку в рабочие часы</li>
          </ul>

          <h4 style={styles.subheading}>6.2. Исполнитель имеет право:</h4>
          <ul style={styles.list}>
            <li>Изменять функциональность Платформы</li>
            <li>Изменять тарифные планы с уведомлением за 14 дней</li>
            <li>Приостановить доступ при нарушении условий Соглашения</li>
            <li>Заблокировать аккаунт при подозрении на мошенничество</li>
            <li>Удалить аккаунт при неактивности более 12 месяцев (с уведомлением)</li>
            <li>Проводить технические работы с временным отключением сервиса</li>
          </ul>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>7. Интеллектуальная собственность</h2>
        </div>
        <div style={styles.textBlock}>
          <h4 style={styles.subheading}>7.1. Права Исполнителя:</h4>
          <ul style={styles.list}>
            <li>Все права на Платформу, её код и дизайн принадлежат Исполнителю</li>
            <li>Логотип, название "Zuuma" и другие товарные знаки принадлежат Исполнителю</li>
            <li>Копирование, воспроизведение или реверс-инжиниринг Платформы запрещены</li>
          </ul>

          <h4 style={styles.subheading}>7.2. Права Пользователя:</h4>
          <ul style={styles.list}>
            <li>Пользователь сохраняет все права на загруженные документы</li>
            <li>Пользователь сохраняет права на созданные API-функции</li>
            <li>Пользователь сохраняет права на контент, созданный AI (но Платформа не гарантирует его уникальность)</li>
          </ul>

          <div style={styles.infoBox}>
            <p style={{margin: 0}}>
              📋 <strong>Важно:</strong> AI может генерировать похожий контент для разных пользователей. 
              Мы не можем гарантировать уникальность AI-контента.
            </p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <AlertTriangle size={24} />
          <h2 style={styles.sectionTitle}>8. Ограничение ответственности</h2>
        </div>
        <div style={styles.textBlock}>
          <h4 style={styles.subheading}>8.1. Исполнитель НЕ несет ответственности за:</h4>
          <ul style={styles.list}>
            <li>Действия и последствия выполнения пользовательских API-функций</li>
            <li>Точность и актуальность ответов AI-ассистентов</li>
            <li>Решения, принятые на основе контента, созданного AI</li>
            <li>Утрату данных по вине Пользователя</li>
            <li>Ущерб от действий третьих лиц (взлом, DDoS)</li>
            <li>Несовместимость Платформы с оборудованием/ПО Пользователя</li>
            <li>Упущенную выгоду Пользователя</li>
            <li>Косвенные убытки любого рода</li>
            <li>Действия и решения, совершённые Пользователем с использованием Платформы, включая последствия использования сгенерированного контента.</li>
          </ul>

          <div style={styles.dangerBox}>
            <p style={{margin: 0}}>
              🔴 <strong>Максимальная ответственность:</strong> Возмещение ограничено стоимостью 
              подписки Пользователя за текущий месяц.
            </p>
          </div>

          <h4 style={styles.subheading}>8.2. Отказ от гарантий:</h4>
          <ul style={styles.list}>
            <li>Платформа предоставляется "как есть" (AS IS)</li>
            <li>Исполнитель не гарантирует бесперебойную работу</li>
            <li>Исполнитель не гарантирует отсутствие ошибок</li>
            <li>Исполнитель не гарантирует 100% защиту от взлома</li>
          </ul>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>9. Оплата и возврат средств</h2>
        </div>
        <div style={styles.textBlock}>
          <h4 style={styles.subheading}>9.1. Условия оплаты:</h4>
          <ul style={styles.list}>
            <li>Оплата производится через платежную систему ЮKassa</li>
            <li>Подписка активируется автоматически после оплаты</li>
            <li>Автоматическое продление можно отключить в настройках</li>
            <li>При отмене подписки доступ сохраняется до конца оплаченного периода</li>
            <li>Неиспользованные токены не переносятся на следующий период</li>
          </ul>

          <h4 style={styles.subheading}>9.2. Возврат средств:</h4>
          <ul style={styles.list}>
            <li>Возврат возможен в исключительных случаях по усмотрению Исполнителя, как правило — в течение 7 дней с момента оплаты; при этом токены не должны быть использованы.</li>
            <li>Если токены потрачены частично, возврат не производится.</li>
            <li>Возврат обрабатывается в течение 14 рабочих дней.</li>
            <li>Комиссии платежных систем не возвращаются.</li>
          </ul>

        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>10. Прекращение использования</h2>
        </div>
        <div style={styles.textBlock}>
          <h4 style={styles.subheading}>10.1. По инициативе Пользователя:</h4>
          <ul style={styles.list}>
            <li>Пользователь может удалить аккаунт в любой момент через настройки</li>
            <li>После удаления все данные удаляются в течение 30 дней</li>
            <li>Возврат средств при удалении аккаунта не производится</li>
          </ul>

         <h4 style={styles.subheading}>10.2. По инициативе Исполнителя:</h4>
          <ul style={styles.list}>
            <li>При нарушении условий Соглашения — Исполнитель вправе ограничить или прекратить доступ к Платформе. Возврат средств в этом случае не производится.</li>
            <li>При неоплате подписки более 14 дней (с уведомлением)</li>
            <li>При неактивности более 12 месяцев (с уведомлением за 30 дней)</li>
            <li>По решению суда</li>
          </ul>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>11. Конфиденциальность</h2>
        </div>
        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Обработка персональных данных регулируется нашей{' '}
            <a href="/privacy" style={styles.link}>Политикой конфиденциальности</a>.
          </p>
          <p style={styles.paragraph}>
            Используя Платформу, вы соглашаетесь с условиями Политики конфиденциальности.
          </p>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>12. Изменения в Соглашении</h2>
        </div>
        <div style={styles.textBlock}>
          <ul style={styles.list}>
            <li>Исполнитель имеет право изменять условия Соглашения</li>
            <li>О существенных изменениях вы будете уведомлены по email за 14 дней</li>
            <li>Продолжение использования после изменений означает принятие новых условий</li>
            <li>Актуальная версия Соглашения всегда доступна на сайте</li>
          </ul>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>13. Контактная информация</h2>
        </div>
        <div style={styles.textBlock}>
          <div style={styles.contactBox}>
            <p style={{margin: 0}}>
              <strong>Исполнитель:</strong> Кушнир Вадим Олегович<br/>
              <strong>Статус:</strong> Самозанятый<br/>
              <strong>ИНН:</strong> 263516890557<br/>
              <strong>Email:</strong> <a href="mailto:delovoi.acount@gmail.com" style={styles.link}>delovoi.acount@gmail.com</a><br/>
              <strong>Телефон:</strong> +7 (963) 387-34-34<br/>
              <strong>Сайт:</strong> <a href="https://zuuma.ru" style={styles.link} target="_blank" rel="noopener noreferrer">https://zuuma.ru</a>
            </p>
          </div>
        </div>
      </section>

      <div style={styles.footerNote}>
        <p style={{margin: '0 0 8px 0', fontSize: '14px'}}>
          <strong>Дата вступления в силу:</strong> 21 октября 2025 года
        </p>
        <p style={{margin: 0, fontSize: '12px'}}>
          Используя Платформу, вы подтверждаете, что прочитали, поняли и согласны с условиями 
          настоящего Пользовательского соглашения.
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
  highlightBox: {
    background: '#2A2A2A',
    borderLeft: '4px solid #4CAF50',
    padding: '16px 20px',
    marginTop: '20px',
    marginBottom: '20px',
    borderRadius: '4px',
  },
  warningBox: {
    background: '#2A1515',
    borderLeft: '4px solid #ff9800',
    padding: '16px 20px',
    marginTop: '20px',
    marginBottom: '20px',
    borderRadius: '4px',
  },
  dangerBox: {
    background: '#2A1515',
    border: '2px solid #ff6b6b',
    padding: '16px 20px',
    marginTop: '16px',
    marginBottom: '16px',
    borderRadius: '8px',
  },
  infoBox: {
    background: '#2A2A2A',
    border: '1px solid #4CAF50',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px',
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