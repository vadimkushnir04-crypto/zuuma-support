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
const OFFER_EFFECTIVE_DATE = "28 октября 2025 г.";

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
          {/* Free Plan */}
          <div style={styles.serviceCard}>
            <div style={styles.planBadge}>Бесплатный</div>
            <h3 style={styles.serviceTitle}>Free Plan</h3>
            <div style={styles.servicePrice}>
              0 ₽<span style={styles.pricePeriod}> / месяц</span>
            </div>
            <ul style={styles.serviceFeatures}>
              <li>✓ 100 000 токенов в месяц</li>
              <li>✓ 1 AI-ассистент</li>
              <li>✓ Интеграция с Telegram Bot</li>
              <li>✓ Веб-виджет</li>
            </ul>
            <div style={styles.serviceNote}>Идеально для тестирования платформы</div>
          </div>

          {/* Pro Plan */}
          <div style={{ ...styles.serviceCard, ...styles.popularCard }}>
            <div style={{ ...styles.planBadge, ...styles.popularBadge }}>Популярный</div>
            <h3 style={styles.serviceTitle}>Pro Plan</h3>
            <div style={styles.servicePrice}>
              990 ₽<span style={styles.pricePeriod}> / месяц</span>
            </div>
            <ul style={styles.serviceFeatures}>
              <li>✓ <strong>2 000 000 токенов</strong> в месяц</li>
              <li>✓ До 10 AI-ассистентов</li>
              <li>✓ API-доступ</li>
              <li>✓ Интеграция с Telegram Bot</li>
              <li>✓ Веб-виджет</li>
            </ul>
            <div style={styles.serviceNote}>Для малого и среднего бизнеса</div>
          </div>

          {/* Max Plan */}
          <div style={styles.serviceCard}>
            <div style={styles.planBadge}>Максимум</div>
            <h3 style={styles.serviceTitle}>Max Plan</h3>
            <div style={styles.servicePrice}>
              2 990 ₽<span style={styles.pricePeriod}> / месяц</span>
            </div>
            <ul style={styles.serviceFeatures}>
              <li>✓ <strong>6 000 000 токенов</strong> в месяц</li>
              <li>✓ До 50 AI-ассистентов</li>
              <li>✓ API-доступ</li>
              <li>✓ Интеграция с Telegram Bot</li>
              <li>✓ Веб-виджет</li>
            </ul>
            <div style={styles.serviceNote}>Для крупного бизнеса и корпораций</div>
          </div>
        </div>

        <div style={styles.infoBox}>
          <h4 style={styles.infoTitle}>Что входит в услугу</h4>
          <ul style={styles.list}>
            <li>Доступ к веб-интерфейсу и API платформы Zuuma;</li>
            <li>Возможность обучения ассистентов на загруженных Пользователем документах (формат TXT и другие указанные форматы);</li>
            <li>Хранение векторных представлений (векторная БД) для целей RAG/поиска по знаниям;</li>
            <li>Интеграции с Telegram и иными внешними сервисами по запросу Пользователя;</li>
            <li>Техническая поддержка в рамках выбранного тарифа.</li>
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
            2.1. После успешной оплаты подписки доступ к соответствующим услугам предоставляется автоматически.
            Сроки активации и объём предоставляемых ресурсов соответствуют выбранному тарифу.
          </p>

          <ul style={styles.list}>
            <li>Активация: автоматическая, мгновенно после подтверждения платежа.</li>
            <li>Токены: зачисляются на баланс Пользователя в соответствии с тарифом.</li>
            <li>Продление: при выборе рекуррентных платежей подписка продлевается автоматически каждый платёжный период.</li>
          </ul>

          <div style={styles.highlightBox}>
            <p style={{ margin: 0 }}>
              ✅ <strong>Возврат средств:</strong> Пользователь вправе отказаться от услуги в течение 7 дней с момента оплаты, 
              если доступ не был использован (токены не израсходованы). 
              Возврат осуществляется по заявлению Пользователя в порядке, установленном Исполнителем и платёжным провайдером. 
              В остальных случаях возврат возможен по усмотрению Исполнителя.
            </p>
          </div>

          <p style={styles.paragraph}>
            2.2. <strong>Согласие на автосписание:</strong> оформляя подписку с автоматическим продлением,
            Пользователь даёт согласие на регулярное списание средств через платёжную систему ЮKassa.
            Пользователь вправе отозвать согласие (отменить автосписание) в личном кабинете или обратившись в
            службу поддержки без автоматического возврата средств. Детали и порядок отмены автосписания также доступны в личном кабинете.
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
            3.1. Исполнитель предоставляет услуги в статусе самозанятого (плательщика налога на профессиональный доход)
            в соответствии с Федеральным законом №422-ФЗ. Реквизиты Исполнителя:
          </p>

          <div style={styles.requisitesBox}>
            <div style={styles.requisitesGrid}>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>ФИО:</span>
                <span style={styles.requisiteValue}>Кушнир Вадим Олегович</span>
              </div>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>Статус:</span>
                <span style={styles.requisiteValue}>Самозанятый (НПД)</span>
              </div>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>ИНН:</span>
                <span style={styles.requisiteValue}>263516890557</span>
              </div>
              <div style={styles.requisiteItem}>
                <span style={styles.requisiteLabel}>Адрес регистрации:</span>
                <span style={styles.requisiteValue}>Российская Федерация, г. Ставрополь</span>
              </div>
            </div>
          </div>

          <h4 style={styles.subheading}>Условия оказания услуг</h4>
          <ul style={styles.list}>
            <li>Оплата услуг означает акцепт настоящей Оферты и всех её условий;</li>
            <li>Подписка активируется автоматически после успешной оплаты;</li>
            <li>Пользователь может отменить подписку в личном кабинете; при отмене доступ сохраняется до окончания оплаченного периода;</li>
            <li>Неиспользованные токены не переносятся на следующий период (если иное не согласовано отдельно).</li>
          </ul>

          <h4 style={styles.subheading}>Права и обязанности сторон</h4>
          <ul style={styles.list}>
            <li>Исполнитель стремится обеспечивать доступность сервиса на уровне 99% времени, но не гарантирует отсутствие сбоев;</li>
            <li>Пользователь обязуется использовать сервис в соответствии с законодательством РФ и условиями данной Оферты, не для незаконных целей;</li>
            <li>Исполнитель сохраняет за собой исключительные права на программное обеспечение и документацию платформы;</li>
            <li>Пользователь имеет права по ЗоЗПП №2300-1: на информацию, качество услуг, безопасность и защиту интересов.</li>
          </ul>
        </div>
      </section>

      {/* 4. Отказ от ответственности и обработка рисков */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <AlertTriangle size={24} style={{ color: "#ff6b6b" }} />
          <h2 style={styles.sectionTitle}>4. Отказ от ответственности и обработка рисков</h2>
        </div>

        <div style={{ ...styles.textBlock, borderLeft: "4px solid #ff6b6b" }}>
          <p style={styles.paragraph}>
            4.1. <strong>Обработка персональных данных (ФЗ-152 с изменениями от 01.09.2025):</strong> 
            Акцепт настоящей Оферты не является согласием на обработку персональных данных. 
            Согласие получается отдельно в соответствии со ст. 9 ФЗ-152 через специальную форму при регистрации. 
            Исполнитель является оператором персональных данных (контактные данные, e-mail, IP и др.) 
            и обеспечивает их обработку в соответствии с законодательством РФ. 
            Персональные данные хранятся на серверах, локализованных в РФ (ч. 5 ст. 18 ФЗ-152). 
            Политика конфиденциальности доступна по адресу: 
            <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer"> {PRIVACY_URL}</a>.
          </p>

          <h4 style={styles.subheading}>4.2. Ответственность за API-функции и пользовательский код</h4>
          <ul style={styles.list}>
            <li>Пользователь самостоятельно создаёт и размещает пользовательские функции и интеграции;</li>
            <li>Исполнитель не осуществляет обязательной проверки пользовательского кода и не несёт ответственности за его исполнение;</li>
            <li>В частности, Исполнитель не отвечает за последствия выполнения операций, приводящих к удалению или порче данных (DELETE, DROP и т.п.).</li>
            <li>Пользователь обязан тестировать код в безопасной среде перед использованием в production.</li>
          </ul>

          <h4 style={styles.subheading}>4.3. Ответственность за результаты работы AI</h4>
          <ul style={styles.list}>
            <li>AI-ассистенты генерируют ответы на основе предоставленных данных и встроенных моделей;</li>
            <li>Исполнитель не гарантирует полноту, точность или актуальность предоставляемых AI-ответов;</li>
            <li>Исполнитель не является разработчиком внешних моделей ИИ и предоставляет только интерфейс доступа к ним;</li>
            <li>Решения, принятые Пользователем на основании ответов AI, осуществляются на риск Пользователя.</li>
          </ul>

          <h4 style={styles.subheading}>4.4. Ограничение ответственности</h4>
          <div style={styles.limitBox}>
            <p style={{ margin: "0 0 12px 0", fontWeight: "bold" }}>Максимальная ответственность Исполнителя ограничена:</p>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li>стоимостью подписки за текущий оплаченный период (ст. 400 ГК РФ), кроме случаев умысла или грубой неосторожности;</li>
              <li>Исполнитель не возмещает упущенную выгоду или косвенные убытки;</li>
              <li>Исполнитель не отвечает за действия третьих лиц, сторонних сервисов (Telegram, API) и сбои, не зависящие от него, с оговоркой на ст. 15 ЗоЗПП (компенсация вреда здоровью/имуществу).</li>
            </ul>
          </div>

          <h4 style={styles.subheading}>4.5. Логирование и хранение доказательств</h4>
          <p style={styles.paragraph}>
            Для защиты прав сторон платформа ведёт журнал действий: изменения конфигураций, исполнения функций,
            IP-адреса и временные метки. Эти записи могут использоваться в качестве доказательной базы при рассмотрении споров.
          </p>

          <h4 style={styles.subheading}>4.6. Удаление данных и резервное копирование</h4>
          <ul style={styles.list}>
            <li>Удаление данных Пользователем считается необратимым — Исполнитель рекомендует иметь резервные копии;</li>
            <li>Исполнитель не несёт ответственности за потерю данных, если она вызвана действиями Пользователя или третьих лиц.</li>
          </ul>
        </div>
      </section>

      {/* 5. Контакты */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <Mail size={24} />
          <h2 style={styles.sectionTitle}>5. Контактная информация</h2>
        </div>

        <div style={styles.contactsGrid}>
          <div style={styles.contactCard}>
            <User size={20} style={{ color: "#de8434" }} />
            <div>
              <div style={styles.contactLabel}>Исполнитель</div>
              <div style={styles.contactValue}>Кушнир Вадим Олегович</div>
            </div>
          </div>

          <div style={styles.contactCard}>
            <FileText size={20} style={{ color: "#de8434" }} />
            <div>
              <div style={styles.contactLabel}>ИНН</div>
              <div style={styles.contactValue}>263516890557</div>
            </div>
          </div>

          <div style={styles.contactCard}>
            <Mail size={20} style={{ color: "#de8434" }} />
            <div>
              <div style={styles.contactLabel}>Email для связи</div>
              <a href="mailto:delovoi.acount@gmail.com" style={styles.contactLink}>delovoi.acount@gmail.com</a>
            </div>
          </div>

          <div style={styles.contactCard}>
            <Phone size={20} style={{ color: "#de8434" }} />
            <div>
              <div style={styles.contactLabel}>Телефон</div>
              <a href="tel:+79633873434" style={styles.contactLink}>+7 (963) 387-34-34</a>
              <div style={styles.contactNote}>Рабочие часы: 10:00–19:00 МСК</div>
            </div>
          </div>

          <div style={styles.contactCard}>
            <MapPin size={20} style={{ color: "#de8434" }} />
            <div>
              <div style={styles.contactLabel}>Официальный сайт</div>
              <a href="https://zuuma.ru" style={styles.contactLink} target="_blank" rel="noopener noreferrer">https://zuuma.ru</a>
            </div>
          </div>

          <div style={styles.contactCard}>
            <CreditCard size={20} style={{ color: "#de8434" }} />
            <div>
              <div style={styles.contactLabel}>Платёжная система</div>
              <div style={styles.contactValue}>ЮKassa (ООО «ЮМани»)</div>
            </div>
          </div>
        </div>

        <div style={styles.infoBox}>
          <p style={{ margin: 0 }}>
            📧 <strong>По всем вопросам</strong> обращайтесь: <a href="mailto:delovoi.acount@gmail.com" style={styles.contactLink}>delovoi.acount@gmail.com</a>
          </p>
        </div>
      </section>

      {/* 6. Способы оплаты */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <CreditCard size={24} />
          <h2 style={styles.sectionTitle}>6. Способы оплаты</h2>
        </div>

        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            Оплата производится через платёжную систему <strong>ЮKassa</strong>. Доступные способы зависят от настроек платёжного провайдера
            и могут включать: банковские карты (Visa, MasterCard, Мир), ЮMoney, QIWI, Сбербанк-Онлайн, Альфа-Клик и т.д.
          </p>
          <div style={styles.highlightBox}>
            <p style={{ margin: 0 }}>
              🔒 <strong>Безопасность:</strong> платёжная информация обрабатывается платёжным провайдером. Исполнитель не хранит данные карт.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Разрешение споров и прочие условия */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <ShieldCheck size={24} />
          <h2 style={styles.sectionTitle}>7. Прочие условия</h2>
        </div>

        <div style={styles.textBlock}>
          <p style={styles.paragraph}>
            7.1. Действие Оферты и применимое право: настоящая Оферта действует с момента публикации на сайте. Все споры
            разрешаются в соответствии с законодательством Российской Федерации (ГК РФ, ЗоЗПП №2300-1, ФЗ-152). При возможных претензиях стороны
            стремятся разрешить спор путем переговоров; при недостижении согласия спор рассматривается в суде по месту нахождения Исполнителя, если иное не предусмотрено императивными нормами законодательства РФ.
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