'use client';

import { useState } from 'react';

export default function VideoSection() {
  const [activePlatform, setActivePlatform] = useState<'youtube' | 'rutube'>('youtube');

  return (
    <section className="business-video">
      <div className="container">
        <h2 className="section-title">Как создать AI-чат бота</h2>
        <p className="section-subtitle">
          Пошаговая видео-инструкция по созданию и настройке вашего первого ассистента
        </p>

        <div className="video-container">
          <div className="video-platform-selector">
            <button 
              className={`platform-btn platform-btn-youtube ${activePlatform === 'youtube' ? 'active' : ''}`}
              onClick={() => setActivePlatform('youtube')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube
            </button>
            
            <button 
              className={`platform-btn platform-btn-rutube ${activePlatform === 'rutube' ? 'active' : ''}`}
              onClick={() => setActivePlatform('rutube')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              Rutube
            </button>
          </div>

          <div className="video-player-wrapper">
            <div 
              className="video-frame video-frame-youtube" 
              style={{ display: activePlatform === 'youtube' ? 'block' : 'none' }}
            >
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/jlrZK5DUXMg"
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div 
              className="video-frame video-frame-rutube" 
              style={{ display: activePlatform === 'rutube' ? 'block' : 'none' }}
            >
              <iframe
                width="100%"
                height="100%"
                src="https://rutube.ru/play/embed/77217ed2fd9ddc2c7f7bb71d7c54b51e/?p=null&skinColor=000000"
                title="Rutube video player"
                allow="clipboard-write; autoplay"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}