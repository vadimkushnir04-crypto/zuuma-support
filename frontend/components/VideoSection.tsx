'use client';

import { useState } from 'react';

export default function VideoSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
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
              className="btn video-btn video-btn-rutube"
              onClick={openModal}
            >
              <svg className="video-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              Смотреть видео
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
              <iframe
                width="100%"
                height="100%"
                src="https://rutube.ru/play/embed/77217ed2fd9ddc2c7f7bb71d7c54b51e/?p=null&skinColor=000000"
                title="Rutube video player"
                allow="clipboard-write"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}