// frontend/components/FileManager.tsx

import React, { useState, useEffect } from 'react';
import { X, Trash2, Eye, FileText, Image, Download } from 'lucide-react';

// Добавляем типы
interface FileItem {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'image' | 'pdf' | 'text' | 'doc' | 'markdown';
  fileSize?: number;
  mimeType?: string;
  chunks?: number;
  createdAt?: string;
}

interface FileManagerProps {
  assistantId: string;
  onClose: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

export default function FileManager({ assistantId, onClose }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [assistantId]);

  const loadFiles = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/assistants/${assistantId}/files`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();

        // ✅ ПРАВИЛЬНАЯ ФИКСАЦИЯ URL
        const fixedFiles = (data.files || []).map((file: FileItem) => {
          let fileUrl = file.fileUrl || '';

          // Если полный URL - оставляем как есть
          if (fileUrl.startsWith('http')) {
            return { ...file, fileUrl };
          }

          // Убираем /api если есть
          if (fileUrl.startsWith('/api/')) {
            fileUrl = fileUrl.replace('/api/', '/');
          }

          // Добавляем базовый URL
          if (!fileUrl.startsWith('/')) {
            fileUrl = '/' + fileUrl;
          }

          fileUrl = `${API_BASE_URL}${fileUrl}`;

          console.log('📎 Fixed file URL:', fileUrl);

          return { ...file, fileUrl };
        });

        setFiles(fixedFiles);
      }
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Удалить файл "${fileName}"?`)) return;

    setDeleting(fileId);

    const cleanFileId = fileId.split('/').pop() || fileId;  // Очистка пути

    try {
      const response = await fetch(
        `${API_BASE_URL}/assistants/${assistantId}/files/${cleanFileId}`,
        {
          method: 'DELETE',
          credentials: 'include', // ✅ Отправляем cookie
        }
      );

      if (response.ok) {
        setFiles(files.filter(f => f.id !== fileId));
        if (selectedFile?.id === fileId) {
          setSelectedFile(null);
        }
      } else {
        alert('Ошибка удаления файла');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка удаления файла');
    } finally {
      setDeleting(null);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'image') return <Image size={24} />;
    return <FileText size={24} />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="file-manager-overlay">
      <div className="file-manager-modal">
        <div className="modal-header">
          <h2>📁 Загруженные файлы</h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Загрузка файлов...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <p>Файлы не загружены</p>
            </div>
          ) : (
            <div className="files-grid">
              {files.map((file) => (
                <div key={file.id} className="file-card">
                  <div className="file-preview">
                    {file.fileType === 'image' ? (
                      <img
                        src={file.fileUrl}
                        alt={file.title}
                        className="preview-image"
                      />
                    ) : (
                      <div className="preview-placeholder">
                        {getFileIcon(file.fileType)}
                      </div>
                    )}
                  </div>

                  <div className="file-info">
                    <h3 className="file-title">{file.title}</h3>
                    {file.description && (
                      <p className="file-description">{file.description}</p>
                    )}
                    <div className="file-meta">
                      <span className="file-size">
                        {formatFileSize(file.fileSize)}
                      </span>
                      <span className="file-chunks">
                        {file.chunks || 0} фрагментов
                      </span>
                    </div>
                  </div>

                  <div className="file-actions">
                    <button
                      onClick={() => setSelectedFile(file)}
                      className="action-btn view-btn"
                      title="Просмотр"
                    >
                      <Eye size={16} />
                    </button>
                    <a
                      href={file.fileUrl}
                      download
                      className="action-btn download-btn"
                      title="Скачать"
                    >
                      <Download size={16} />
                    </a>
                    <button
                      onClick={() => deleteFile(file.id, file.title)}
                      disabled={deleting === file.id}
                      className="action-btn delete-btn"
                      title="Удалить"
                    >
                      {deleting === file.id ? (
                        <div className="mini-spinner" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="preview-overlay" onClick={() => setSelectedFile(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{selectedFile.title}</h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <div className="preview-content">
              {selectedFile.fileType === 'image' ? (
                <img
                  src={selectedFile.fileUrl}
                  alt={selectedFile.title}
                  className="full-preview-image"
                />
              ) : (
                <div className="text-preview">
                  <p>Предварительный просмотр недоступен для этого типа файла.</p>
                  <a
                    href={selectedFile.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-link"
                  >
                    Открыть в новой вкладке
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .file-manager-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .file-manager-modal {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          width: 100%;
          max-width: 1100px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #333;
          background: #222;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
        }

        .close-btn {
          background: #2a2a2a;
          border: 1px solid #444;
          cursor: pointer;
          color: #aaa;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #333;
          color: #fff;
          border-color: #555;
        }

        .modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #1a1a1a;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #333;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .empty-state svg {
          color: #444;
          margin-bottom: 16px;
        }

        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }

        .file-card {
          background: #222;
          border: 1px solid #333;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
          cursor: pointer;
        }

        .file-card:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .file-preview {
          aspect-ratio: 1;
          background: #2a2a2a;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-placeholder {
          color: #555;
        }

        .file-info {
          padding: 10px;
        }

        .file-title {
          font-size: 0.8rem;
          font-weight: 500;
          color: #ddd;
          margin: 0 0 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-description {
          font-size: 0.7rem;
          color: #777;
          margin: 0 0 6px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        .file-meta {
          display: flex;
          gap: 8px;
          font-size: 0.65rem;
          color: #666;
        }

        .file-actions {
          display: flex;
          gap: 4px;
          padding: 6px;
          border-top: 1px solid #2a2a2a;
          background: #1f1f1f;
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          background: #2a2a2a;
          border: 1px solid #333;
          border-radius: 4px;
          cursor: pointer;
          color: #aaa;
          text-decoration: none;
          transition: all 0.2s;
        }

        .action-btn:hover:not(:disabled) {
          background: #333;
          border-color: #444;
        }

        .view-btn:hover {
          color: #667eea;
          border-color: #667eea;
        }

        .download-btn:hover {
          color: #10b981;
          border-color: #10b981;
        }

        .delete-btn:hover:not(:disabled) {
          color: #ef4444;
          border-color: #ef4444;
        }

        .action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .mini-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #444;
          border-top-color: #ef4444;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .preview-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 20px;
        }

        .preview-modal {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          max-width: 900px;
          max-height: 90vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
        }

        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #333;
          background: #222;
        }

        .preview-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
        }

        .preview-content {
          flex: 1;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: #0a0a0a;
        }

        .full-preview-image {
          max-width: 100%;
          max-height: 100%;
          border-radius: 8px;
        }

        .text-preview {
          text-align: center;
          color: #888;
        }

        .open-link {
          display: inline-block;
          margin-top: 16px;
          padding: 10px 20px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .open-link:hover {
          background: #5568d3;
        }

        @media (max-width: 768px) {
          .files-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}