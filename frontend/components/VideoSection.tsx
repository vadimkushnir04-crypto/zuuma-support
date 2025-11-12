'use client';

import { useState } from 'react';

export default function VideoSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'youtube' | 'rutube'>('youtube');

  const openModal = (platform: 'youtube' | 'rutube') => {
    setActivePlatform(platform);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <section className="business-video">
        <div className="container">
          <h2 className="section-title">Как создать AI-чат бота</h2>
          <p className="section-subtitle">
            Пошаговая видео-инструкция по созданию и настройке вашего первого ассистента
          </p>

          <div className="video-buttons">
            <button 
              className="btn video-btn video-btn-youtube"
              onClick={() => openModal('youtube')}
            >
              <svg className="video-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube
            </button>
            
            <button 
              className="btn video-btn video-btn-rutube"
              onClick={() => openModal('rutube')}
            >
              <svg className="video-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              Rutube
            </button>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {isModalOpen && (
        <div className="video-modal-overlay" onClick={closeModal}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={closeModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className="video-modal-player">
              {activePlatform === 'youtube' ? (
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/jlrZK5DUXMg?autoplay=1"
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <iframe
                  width="100%"
                  height="100%"
                  src="https://rutube.ru/play/embed/77217ed2fd9ddc2c7f7bb71d7c54b51e/?p=null&skinColor=000000&autoplay=1"
                  title="Rutube video player"
                  allow="clipboard-write; autoplay"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}