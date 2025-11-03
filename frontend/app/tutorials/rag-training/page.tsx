"use client";

import { useState } from "react";
import { ArrowLeft, Copy, CheckCircle, Brain, Upload, FileText, Zap, BookOpen, Database } from "lucide-react";
import Link from "next/link";

export default function RagTrainingTutorial() {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const uploadExample = `import requests

def upload_document(api_key, file_path, metadata=None):
    """Загрузка документа в RAG систему"""
    
    url = "https://api.yourplatform.com/v1/documents/upload"
    headers = {"Authorization": f"Bearer {api_key}"}
    
    with open(file_path, 'rb') as file:
        files = {'document': file}
        data = {
            'metadata': json.dumps(metadata or {}),
            'chunk_size': 1000,  # Размер чанков
            'overlap': 200       # Перекрытие между чанками
        }
        
        response = requests.post(url, headers=headers, files=files, data=data)
        return response.json()

# Пример использования
result = upload_document(
    api_key="your_api_key",
    file_path="company_docs.pdf",
    metadata={
        "category": "documentation",
        "version": "1.0",
        "department": "support"
    }
)
print(f"Документ загружен: {result['document_id']}")`;

  const queryExample = `from chatbot_sdk import ChatBot

bot = ChatBot(api_key="your_api_key")

# Запрос с использованием RAG
response = bot.send_message(
    message="Как подключить API?",
    use_rag=True,
    rag_params={
        "categories": ["documentation"],  # Поиск только в документации
        "max_chunks": 5,                  # Максимум чанков для контекста
        "similarity_threshold": 0.7       # Порог схожести
    }
)

print(f"Ответ: {response.text}")
print(f"Источники: {response.sources}")`;

  const batchUpload = `import os
import json
from pathlib import Path

def batch_upload_documents(api_key, folder_path):
    """Массовая загрузка документов из папки"""
    
    supported_formats = ['.pdf', '.docx', '.txt', '.md', '.html']
    uploaded = []
    
    for file_path in Path(folder_path).rglob('*'):
        if file_path.suffix.lower() in supported_formats:
            try:
                # Автоматическое извлечение метаданных из пути
                metadata = {
                    "filename": file_path.name,
                    "folder": str(file_path.parent.name),
                    "size": file_path.stat().st_size,
                    "type": file_path.suffix[1:]  # без точки
                }
                
                result = upload_document(api_key, str(file_path), metadata)
                uploaded.append(result)
                print(f"✅ Загружен: {file_path.name}")
                
            except Exception as e:
                print(f"❌ Ошибка при загрузке {file_path.name}: {e}")
    
    return uploaded

# Загрузка всех документов из папки
results = batch_upload_documents("your_api_key", "./knowledge_base/")
print(f"Загружено документов: {len(results)}")`;

  return (
    <div className="tutorial-page">
      {/* Header */}
      <div className="tutorial-header">
        <div className="tutorial-header-content">
          <Link href="/tutorials" className="tutorial-back-link">
            <ArrowLeft size={20} />
            Назад к туториалам
          </Link>
          
          <div className="tutorial-header-main">
            <div className="tutorial-icon-wrapper">
              <Brain className="tutorial-icon" size={32} />
            </div>
            <div>
              <h1 className="tutorial-title">Обучение RAG Системы</h1>
              <p className="tutorial-subtitle">
                Загрузка знаний и настройка Retrieval-Augmented Generation
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* Content */}
      <div className="tutorial-content">
        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что такое RAG?</h2>
          <p className="tutorial-text">
            RAG (Retrieval-Augmented Generation) — это технология, которая позволяет чат-боту 
            использовать ваши документы для генерации более точных и релевантных ответов. 
            Система автоматически находит нужную информацию в загруженных документах и 
            использует её для формирования ответа.
          </p>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Подготовка документов</h2>
          <div className="tutorial-steps">
            <div className="tutorial-step">
              <div className="tutorial-step-number">1</div>
              <div className="tutorial-step-content">
                <h3>Форматы файлов</h3>
                <p>Пока что поддерживаются: PDF, TXT, PNG, JPG. Убедитесь, что текст читаемый и структурированный.</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">2</div>
              <div className="tutorial-step-content">
                <h3>Структура контента</h3>
                <p>Используйте заголовки, списки и четкие разделы. Это поможет системе лучше понимать контекст.</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">3</div>
              <div className="tutorial-step-content">
                <h3>Качество данных</h3>
                <p>Проверьте документы на ошибки, удалите дублирующуюся информацию и устаревшие данные.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Загрузка одного документа</h2>
          <p className="tutorial-text">
            Пример программной загрузки документа в RAG систему с настройкой параметров:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Python</span>
              <button 
                onClick={() => copyToClipboard(uploadExample, 1)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 1 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{uploadExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Массовая загрузка</h2>
          <p className="tutorial-text">
            Для загрузки больших объемов документов используйте пакетную обработку:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Python</span>
              <button 
                onClick={() => copyToClipboard(batchUpload, 2)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 2 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 2 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{batchUpload}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Использование RAG в запросах</h2>
          <p className="tutorial-text">
            Как настроить поиск и использование загруженных документов в ответах:
          </p>
          
          <div className="tutorial-code-block">
            <div className="tutorial-code-header">
              <span className="tutorial-code-language">Python</span>
              <button 
                onClick={() => copyToClipboard(queryExample, 3)}
                className="tutorial-copy-btn"
              >
                {copiedCode === 3 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {copiedCode === 3 ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <pre className="tutorial-code">
              <code>{queryExample}</code>
            </pre>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Параметры конфигурации RAG</h2>
          <div className="tutorial-table">
            <div className="tutorial-table-row tutorial-table-header">
              <div>Параметр</div>
              <div>Описание</div>
              <div>Рекомендуемые значения</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>chunk_size</code></div>
              <div>Размер текстовых блоков</div>
              <div>800-1500 символов</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>overlap</code></div>
              <div>Перекрытие между блоками</div>
              <div>100-300 символов</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>max_chunks</code></div>
              <div>Максимум блоков в контексте</div>
              <div>3-7 блоков</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>similarity_threshold</code></div>
              <div>Порог схожести для поиска</div>
              <div>0.6-0.8</div>
            </div>
            <div className="tutorial-table-row">
              <div><code>categories</code></div>
              <div>Фильтр по категориям</div>
              <div>Список категорий</div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Лучшие практики</h2>
          <div className="tutorial-steps">
            <div className="tutorial-step">
              <div className="tutorial-step-number">💡</div>
              <div className="tutorial-step-content">
                <h3>Структурируйте знания</h3>
                <p>Разделяйте документы по темам и категориям. Используйте метаданные для лучшей фильтрации.</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">🎯</div>
              <div className="tutorial-step-content">
                <h3>Оптимизируйте размер чанков</h3>
                <p>Для FAQ используйте маленькие чанки (500-800). Для статей — средние (1000-1500).</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">🔄</div>
              <div className="tutorial-step-content">
                <h3>Регулярно обновляйте</h3>
                <p>Удаляйте устаревшие документы и добавляйте новые. Мониторьте качество ответов.</p>
              </div>
            </div>
            
            <div className="tutorial-step">
              <div className="tutorial-step-number">📊</div>
              <div className="tutorial-step-content">
                <h3>Тестируйте и анализируйте</h3>
                <p>Проверяйте, какие документы чаще всего используются, и оптимизируйте их содержимое.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="tutorial-section">
          <h2 className="tutorial-section-title">Что дальше?</h2>
          <div className="tutorial-next-steps">
            <Link href="/tutorials/python" className="tutorial-next-card">
              <Database size={24} />
              <div>
                <h3>Python SDK</h3>
                <p>Интеграция RAG в Python приложения</p>
              </div>
            </Link>
            
            <Link href="/tutorials/json-config" className="tutorial-next-card">
              <FileText size={24} />
              <div>
                <h3>JSON Configuration</h3>
                <p>Настройка через конфигурационные файлы</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}