"use client";

import React from "react";

export default function OfferPage() {
  return (
    <div className="dashboard">
      <h1 className="dashboard-header">Онлайн-оферта и реквизиты</h1>

      <section className="mb-6">
        <h2 className="dashboard-title">1. Оказываемые услуги / продаваемые товары</h2>
        <ul className="list-disc list-inside">
          <li>
            <strong>Услуга 1:</strong> Консультация по продукту XYZ<br />
            Цена: 2 000 ₽<br />
            Описание: Онлайн-консультация продолжительностью 1 час.
          </li>
          <li>
            <strong>Услуга 2:</strong> Обучающий курс ABC<br />
            Цена: 5 000 ₽<br />
            Описание: Доступ к видеоурокам и материалам курса.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Порядок доставки / получения</h2>
        <p>
          Если это физические товары, доставка осуществляется через курьерскую службу, почту или самовывоз по согласованию.<br />
          Для цифровых товаров: после оплаты клиент получает доступ к материалам на сайте или на электронную почту.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Пользовательское соглашение / оферта</h2>
        <p>
          Настоящая оферта является официальным предложением (публичной офертой) индивидуального предпринимателя / самозанятого: 
          <strong>Иванов Иван Иванович, ИНН 123456789012</strong>.<br />
          Оплата услуг означает полное принятие условий оферты.<br />
          Все права на материалы и услуги защищены законодательством РФ.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Контактная информация</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p><strong>ФИО:</strong> Иванов Иван Иванович</p>
          <p><strong>ИНН:</strong> 123456789012</p>
          <p><strong>Email:</strong> <a href="mailto:info@mysite.ru">info@mysite.ru</a></p>
          <p><strong>Телефон:</strong> +7 999 123-45-67</p>
          <p><strong>Адрес сайта:</strong> <a href="https://mysite.ru">https://mysite.ru</a></p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Ссылка на страницу с реквизитами</h2>
        <p>Полные реквизиты для ЮKassa доступны по ссылке: <a href="/offer">https://mysite.ru/offer</a></p>
      </section>
    </div>
  );
}
