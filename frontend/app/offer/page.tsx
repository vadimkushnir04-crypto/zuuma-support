// offer/page.tsx
import React from "react";
import {
  FileText,
  Package,
  Truck,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  User,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

/**
 * Юридически уточнённая версия публичной оферты для самозанятого (SaaS).
 * Содержит дополнения: обработка персональных данных (ФЗ-152 с изменениями от 01.09.2025),
 * статус самозанятого (ФЗ-422), положение о защите прав потребителей (№2300-1),
 * согласие на рекуррентные платежи и другие обязательные формулировки.
 *
 * ПРИМЕЧАНИЕ:
 * - Вставь реальные ссылки на Политику конфиденциальности и Пользовательское соглашение
 *   в поля POLICY_URL и PRIVACY_URL.
 * - Не является юридической консультацией — рекомендуется согласовать финальный текст с юристом.
 */

const POLICY_URL = "https://zuuma.ru/terms"; // <- вставь реальную ссылку
const PRIVACY_URL = "https://zuuma.ru/privacy"; // <- вставь реальную ссылку
const OFFER_EFFECTIVE_DATE = "04 декабря 2025 г.";

export default function OfferPage() {
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <FileText size={40} style={{ color: "#fff" }} />
        <h1 style={styles.title}>Публичная оферта и реквизиты</h1>
        <p style={styles.subtitle}>Информация об услугах, ценах и условиях предоставления</p>
      </div>

      {/* 1. Предмет договора и тарифы */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Package size={24} />
          <h2 style={styles.sectionTitle}>1. Предмет договора и тарифы</h2>
        </div>

        <p style={styles.paragraph}>
          1.1. Настоящая публичная оферта (далее — «Оферта») регулирует отношения между
          Исполнителем и Пользователем в части предоставления доступа к SaaS-платформе
          <strong> Zuuma</strong> для создания, обучения и использования AI-ассистентов в соответствии с ГК РФ, ФЗ-422 и ЗоЗПП №2300-1.
        </p>

        <div style={styles.servicesGrid}>
          {/* Basic Plan */}
          <div style={styles.serviceCard}>
            <div style={styles.planBadge}>Basic</div>
            <h3 style={styles.serviceTitle}>Basic Plan</h3>
            <div style={styles.servicePrice}>
              990 ₽<span style={styles.pricePeriod}> / разовая покупка</span>
            </div>
            <ul style={styles.serviceFeatures}>
              <li>✓ 1 000 000 токенов на 30 дней</li>
              <li>✓ До 10 AI-ассистентов</li>
              <li>✓ Интеграция с Telegram Bot</li>
              <li>✓ Веб-виджет</li>
            </ul>
            <div style={styles.serviceNote}>Идеально для Старта</div>
          </div>

          {/* Business Plan */}
          <div style={{ ...styles.serviceCard, ...styles.popularCard }}>
            <div style={styles.planBadge}>Business</div>
            <h3 style={styles.serviceTitle}>Business Plan</h3>
            <div style={styles.servicePrice}>
              4 490 ₽<span style={styles.pricePeriod}> / разовая покупка</span>
            </div>
            <ul style={styles.serviceFeatures}>
              <li>✓ 5 000 000 токенов на 30 дней</li>
              <li>✓ До 50 AI-ассистентов</li>
              <li>✓ API-доступ</li>
              <li>✓ Интеграция с Telegram Bot</li>
              <li>✓ Веб-виджет</li>
            </ul>
            <div style={styles.serviceNote}>Для малого и среднего бизнеса</div>
          </div>

          {/* Enterprise Plan */}
          <div style={styles.serviceCard}>
            <div style={styles.planBadge}>Enterprise</div>
            <h3 style={styles.serviceTitle}>Enterprise Plan</h3>
            <div style={styles.servicePrice}>
              7 990 ₽<span style={styles.pricePeriod}> / разовая покупка</span>
            </div>
            <ul style={styles.serviceFeatures}>
              <li>✓ 10 000 000 токенов на 30 дней</li>
              <li>✓ До 100 AI-ассистентов</li>
              <li>✓ API-доступ</li>
              <li>✓ Интеграция с Telegram Bot</li>
              <li>✓ Веб-виджет</li>
            </ul>
            <div style={styles.serviceNote}>Для крупного бизнеса и корпораций</div>
          </div>
        </div>

        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>Кастомная покупка</h4>
          <p style={styles.paragraph}>
            Купите нужное количество токенов. Цена: 99 ₽ за 100 000 токенов. Минимум: 1 пакет.
          </p>
          <p style={styles.paragraph}>
            Токены из любого пакета действуют 30 дней с момента покупки. После истечения срока неиспользованные токены сгорают.
          </p>
        </div>

        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>Что входит в услугу</h4>
          <ul style={styles.list}>
            <li>Доступ к веб-интерфейсу и API платформы Zuuma;</li>
            <li>Возможность обучения ассистентов на загруженных Пользователем документах (формат TXT и другие указанные форматы);</li>
            <li>Хранение векторных представлений (векторная БД) для целей RAG/поиска по знаниям;</li>
            <li>Интеграции с Telegram и иными внешними сервисами по запросу Пользователя;</li>
            <li>Техническая поддержка в рамках выбранного пакета.</li>
          </ul>
        </div>
      </section>

      {/* 2. Порядок предоставления услуг и оплата */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Truck size={24} />
          <h2 style={styles.sectionTitle}>2. Порядок предоставления услуг и оплата</h2>
        </div>

        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            2.1. После успешной оплаты пакета токенов доступ к соответствующим услугам предоставляется автоматически.
            Сроки активации и объём предоставляемых ресурсов соответствуют выбранному пакету. Токены действуют 30 дней с момента покупки.
          </p>

          <ul style={styles.list}>
            <li>Активация: автоматическая, мгновенно после подтверждения платежа.</li>
            <li>Токены: зачисляются на баланс Пользователя в соответствии с пакетом и действуют 30 дней. После истечения срока неиспользованные токены сгорают.</li>
            <li>Покупка: разовая, без автоматического продления. Пользователь может купить новый пакет в любой момент.</li>
          </ul>

          <div style={styles.highlightBox}>
            <p style={{ margin: 0 }}>
              ✅ <strong>Возврат средств:</strong> Пользователь вправе отказаться от услуги в течение 7 дней с момента оплаты, 
              если токены не были использованы. 
              Возврат осуществляется по заявлению Пользователя в порядке, установленном Исполнителем и платёжным провайдером. 
              В остальных случаях возврат возможен по усмотрению Исполнителя.
            </p>
          </div>

          <p style={styles.paragraph}>
            2.2. Оплата пакетов осуществляется через платёжную систему ЮKassa.
            Пользователь вправе отменить покупку в личном кабинете или обратившись в службу поддержки без автоматического возврата средств, если токены уже были использованы.
          </p>
        </div>
      </section>

      {/* 3. Публичная оферта — реквизиты и статус */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <ShieldCheck size={24} />
          <h2 style={styles.sectionTitle}>3. Условия публичной оферты и реквизиты</h2>
        </div>

        <div style={styles.textBlock}>
        <p style={styles.paragraph}>
          3.1. Исполнитель является плательщиком НПД (налога на профессиональный доход) и оказывает услуги как самозанятый в соответствии с действующим законодательством — Федеральным законом № 422-ФЗ.
          При получении оплаты за услуги Исполнитель обязуется сформировать чек через уполномоченное приложение/сервис (например, «Мой налог») и передать его Пользователю (Заказчику) в порядке, предусмотренном законом.
        </p>

          <div style={styles.requisitesBox}>
            <h4 style={styles.requisitesTitle}>Реквизиты Исполнителя</h4>
            <div style={styles.requisitesGrid}>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>ФИО</span>
                <span style={styles.requisiteValue}>Кушнир Вадим Олегович</span>
              </div>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>ИНН</span>
                <span style={styles.requisiteValue}>263516890557</span>
              </div>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>Статус</span>
                <span style={styles.requisiteValue}>Самозанятый (плательщик НПД)</span>
              </div>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>Адрес</span>
                <span style={styles.requisiteValue}>г. Ставрополь</span>
              </div>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>Email</span>
                <span style={styles.requisiteValue}>delovoi.acount@gmail.com</span>
              </div>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>Телефон</span>
                <span style={styles.requisiteValue}>+7 (963) 387-34-34</span>
              </div>
            </div>
          </div>

          <p style={styles.paragraph}>
            3.2. Акцепт Оферты осуществляется путём оплаты пакета токенов. С этого момента Оферта считается заключённой и вступившей в силу.  
            После получения оплаты — и при условии подтверждения перевода — Исполнитель формирует и направляет Пользователю чек, как предусмотрено законом (см. п. 3.1).
          </p>

          <p style={styles.paragraph}>
            3.3. Услуги предоставляются на условиях «как есть» (AS IS). Исполнитель не несёт ответственности за убытки, возникшие по вине Пользователя — включая неправильное использование сервиса или интеграций.
          </p>
        </div>
      </section>


      {/* 4. Обработка персональных данных */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <User size={24} />
          <h2 style={styles.sectionTitle}>4. Обработка персональных данных</h2>
        </div>

        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            4.1. Оформляя покупку пакета токенов, Пользователь даёт согласие на обработку своих персональных данных в соответствии с Федеральным законом 
            от 27.07.2006 № 152-ФЗ «О персональных данных» (с изменениями от 01.09.2025). Обработка осуществляется в целях предоставления услуг, 
            включая авторизацию, биллинг и техническую поддержку.
          </p>

          <p style={styles.paragraph}>
            4.2. Персональные данные включают: ФИО, email, номер телефона, платёжные реквизиты (обрабатываются платёжным провайдером).
            Подробности — в Политике конфиденциальности по ссылке: <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">{PRIVACY_URL}</a>.
          </p>

          <p style={styles.paragraph}>
            4.3. Согласие действует в течение срока использования услуг и 3 лет после его окончания. Пользователь вправе отозвать согласие, 
            направив заявление на email: delovoi.acount@gmail.com, что может повлечь прекращение предоставления услуг.
          </p>

          <div style={styles.warningBox}>
            <p style={{ margin: 0 }}>
              ⚠️ <strong>Важно:</strong> Пользователь несёт ответственность за достоверность предоставляемых данных. 
              В случае предоставления данных третьих лиц Пользователь гарантирует наличие их согласия.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Права и обязанности сторон */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <CreditCard size={24} />
          <h2 style={styles.sectionTitle}>5. Права и обязанности сторон</h2>
        </div>

        <div style={styles.textBlock}>
          <h4 style={styles.subheading}>5.1. Обязанности Исполнителя</h4>
          <ul style={styles.list}>
            <li>Предоставить доступ к платформе в соответствии с выбранным пакетом;</li>
            <li>Обеспечить техническую поддержку (email, чат в рабочее время);</li>
            <li>Соблюдать конфиденциальность данных Пользователя;</li>
            <li>Уведомлять о существенных изменениях в условиях предоставления услуг за 10 дней.</li>
          </ul>

          <h4 style={styles.subheading}>5.2. Права Исполнителя</h4>
          <ul style={styles.list}>
            <li>Приостановить доступ в случае нарушения Оферты или законодательства;</li>
            <li>Изменять тарифы с уведомлением за 30 дней;</li>
            <li>Отказать в предоставлении услуг без объяснения причин;</li>
            <li>Использовать обезличенные данные для улучшения сервиса.</li>
          </ul>

          <h4 style={styles.subheading}>5.3. Обязанности Пользователя</h4>
          <ul style={styles.list}>
            <li>Оплачивать пакеты токенов в полном объёме;</li>
            <li>Не использовать платформу для незаконных целей;</li>
            <li>Не передавать доступ третьим лицам;</li>
            <li>Своевременно информировать о проблемах в работе сервиса.</li>
          </ul>

          <h4 style={styles.subheading}>5.4. Права Пользователя</h4>
          <ul style={styles.list}>
            <li>Использовать услуги в рамках пакета;</li>
            <li>Получать техническую поддержку;</li>
            <li>Запрашивать информацию о статусе услуг;</li>
            <li>Отказаться от услуг с возвратом в установленных случаях.</li>
          </ul>

          <div style={styles.limitBox}>
            <p style={{ margin: 0 }}>
              📌 <strong>Ограничение ответственности:</strong> Исполнитель не несёт ответственности за косвенные убытки, 
              упущенную выгоду или потерю данных. Максимальная сумма ответственности — стоимость оплаченного пакета.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Контактная информация */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Mail size={24} />
          <h2 style={styles.sectionTitle}>6. Контактная информация</h2>
        </div>

        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Для вопросов, жалоб или предложений обращайтесь по следующим каналам:
          </p>

          <div style={styles.contactsGrid}>
            <div style={styles.contactCard}>
              <Mail size={20} style={{ color: "#de8434" }} />
              <div>
                <span style={styles.contactLabel}>Email</span>
                <a href="mailto:delovoi.acount@gmail.com" style={styles.contactLink}>delovoi.acount@gmail.com</a>
                <span style={styles.contactNote}>Ответ в течение 24 часов</span>
              </div>
            </div>

            <div style={styles.contactCard}>
              <Phone size={20} style={{ color: "#de8434" }} />
              <div>
                <span style={styles.contactLabel}>Телефон</span>
                <span style={styles.contactValue}>+7 (963) 387-34-34</span>
                <span style={styles.contactNote}>Пн-Пт: 10:00-18:00 МСК</span>
              </div>
            </div>

            <div style={styles.contactCard}>
              <MapPin size={20} style={{ color: "#de8434" }} />
              <div>
                <span style={styles.contactLabel}>Адрес</span>
                <span style={styles.contactValue}>г. Ставрополь, ул. Доваторцев, 44/2, кв. 93</span>
                <span style={styles.contactNote}>Только почтовая связь</span>
              </div>
            </div>
          </div>

          <div style={styles.dangerBox}>
            <AlertTriangle size={16} style={{ color: "#ff6b6b", marginRight: "8px" }} />
            <p style={{ margin: 0, display: "inline" }}>
              <strong>Внимание:</strong> Чеки об оплате формируются автоматически в соответствии с ФЗ-54 и отправляются на email Пользователя.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Заключительные положения */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <FileText size={24} />
          <h2 style={styles.sectionTitle}>7. Заключительные положения</h2>
        </div>

        <div style={styles.textBlock}>
          <h4 style={styles.subheading}>7.1. Разрешение споров</h4>
          <p style={styles.paragraph}>
            Стороны стремятся разрешить спор путем переговоров; при недостижении согласия спор рассматривается в суде по месту нахождения Исполнителя, если иное не предусмотрено императивными нормами законодательства РФ.
          </p>

          <h4 style={styles.subheading}>7.2. Форс-мажор</h4>
          <p style={styles.paragraph}>
            Стороны освобождаются от ответственности за неисполнение обязательств, если оно вызвано обстоятельствами непреодолимой силы (форс-мажор), подтвержденными документами.
          </p>

          <h4 style={styles.subheading}>7.3. Изменения Оферты</h4>
          <p style={styles.paragraph}>
            Исполнитель вправе вносить изменения в Оферту, уведомив Пользователя за 10 дней via email или на сайте. Продолжение использования = акцепт изменений.
          </p>

          <p style={styles.paragraph}>
            7.4. Полезные ссылки:
            <br />
            — Политика конфиденциальности: <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">{PRIVACY_URL}</a>
            <br />
            — Контакты поддержки: <a href="mailto:delovoi.acount@gmail.com">delovoi.acount@gmail.com</a>
          </p>
        </div>

        <h4 style={styles.subheading}>7.5. Отказ от гарантий результата</h4>
          <p style={styles.paragraph}>
            Исполнитель предоставляет сервис «как есть» (AS IS) и не гарантирует конкретного результата, 
            прибыльности, роста продаж или иных показателей. Пользователь использует сервис по собственному усмотрению и риску.
          </p>
      </section>

      {/* Footer */}
      <div style={styles.footerNote}>
        <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
          Дата публикации оферты: {OFFER_EFFECTIVE_DATE}
        </p>
        <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>
          Совершая оплату, Вы подтверждаете, что ознакомились и согласны с условиями данной Публичной оферты.
          Согласие на обработку персональных данных предоставляется отдельно.
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
    color: '#fff',
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
    position: 'relative',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  popularCard: {
    borderColor: '#de8434',
    boxShadow: '0 0 20px rgba(76, 175, 80, 0.2)',
  },
  planBadge: {
    position: 'absolute',
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
    background: '#de8434',
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
    color: '#de8434',
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
    fontStyle: 'italic',
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
  limitBox: {
    background: '#2A2A2A',
    border: '1px solid #555',
    padding: '16px 20px',
    marginTop: '12px',
    borderRadius: '8px',
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
    color: '#de8434',
  },
  requisitesBox: {
    background: '#2A2A2A',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '16px',
    marginBottom: '24px',
    border: '1px solid #de8434',
  },
  requisitesTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#de8434',
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
    color: '#de8434',
    textDecoration: 'none',
    display: 'block',
  },
  contactNote: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
  },
  footerNote: {
    textAlign: 'center',
    marginTop: '60px',
    paddingTop: '30px',
    borderTop: '1px solid #333',
    color: '#999',
  },
};