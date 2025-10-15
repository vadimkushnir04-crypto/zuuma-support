// components/LanguageSwitcher.tsx
"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="language-switcher">
      <select 
        value={i18n.language} 
        onChange={(e) => changeLanguage(e.target.value)}
        className="language-select"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#E0E0E0',
          fontSize: '14px',
        }}
      >
        {languages.map((lang) => (
          <option 
            key={lang.code} 
            value={lang.code}
            style={{ background: '#2a2a2a', color: '#E0E0E0' }}
          >
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}