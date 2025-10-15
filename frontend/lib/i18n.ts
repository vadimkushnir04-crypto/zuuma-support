// lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Импортируем переводы статически
const resources = {
  en: {
    common: {
      "loading": "Loading assistants...",
      "createAssistant": "Create Assistant",
      "nav": {
        "dashboard": "Dashboard",
        "assistant": "Creating an assistant",
        "login": "Login",
        "register": "Register"
      }
    },
    homepage: {
      "emptyState": {
        "title": "You don't have any assistants yet",
        "description": "Create your first AI assistant to automate customer support",
        "createButton": "Create Assistant"
      },
      "uploadSection": {
        "title": "Upload Training Material"
      },
      "testingSection": {
        "title": "How to test?",
        "steps": {
          "1": "Select an assistant for training from the list above",
          "2": "Upload text with information about your company",
          "3": "Wait for upload confirmation",
          "4": "Ask a question in the chat on the right",
          "5": "AI will respond based on the uploaded information"
        },
        "example": {
          "label": "Example:",
          "text": "Select \"Banking Assistant\", upload FAQ about returns, then ask \"How to process a return?\""
        }
      },
      "chat": {
        "title": "Test Chat"
      }
    },
    sidebar: {
      "createAssistant": "Create Assistant",
      "trainAssistant": "Train Assistant", 
      "myAssistants": "My Assistants",
      "tutorials": "Docs",
      "statistics": "Statistics",
      "users": "Users",
      "models": "Models",
      "apiFunctions": "API Functions"
    },
    uploadForm: {
      "errors": {
        "selectAssistant": "Select an assistant for training",
        "enterText": "Enter text for training",
        "uploadError": "Error",
        "networkError": "Network error",
        "loadAssistants": "Error loading assistants",
        "connectionError": "Failed to load assistants. Check server connection."
      },
      "defaultTitle": "Document without title",
      "warnings": {
        "selectFirst": "First select an assistant for training from the list above"
      },
      "fields": {
        "title": "Material title",
        "content": "Content"
      },
      "placeholders": {
        "title": "Returns FAQ",
        "content": "Paste document content, FAQ, instructions, etc. here"
      },
      "buttons": {
        "uploading": "Uploading...",
        "upload": "Upload"
      },
      "loading": {
        "assistants": "Loading assistants..."
      },
      "dropdown": {
        "label": "Select assistant for training",
        "placeholder": "Select assistant",
        "selected": "Selected"
      }
    },
    chat: {
      "welcomeMessage": "Hello! I'm your AI assistant. Ask a question about the uploaded materials.",
      "noAssistant": "First select an assistant for testing",
      "askQuestion": "Ask a question about the uploaded materials",
      "thinking": "Thinking...",
      "sources": "Based on {{count}} document(s)",
      "errors": {
        "status": "Error",
        "requestError": "Sorry, an error occurred while processing your request."
      },
      "placeholders": {
        "selectAssistant": "Select assistant...",
        "askQuestion": "Ask a question..."
      }
    }
  },
  ru: {
    common: {
      "loading": "Загрузка ассистентов...",
      "createAssistant": "Создать ассистента",
      "nav": {
        "dashboard": "Панель управления",
        "assistant": "Создание ассистента",
        "login": "Войти",
        "register": "Регистрация"
      }
    },
    homepage: {
      "emptyState": {
        "title": "У вас пока нет ассистентов",
        "description": "Создайте своего первого AI ассистента для автоматизации поддержки клиентов",
        "createButton": "Создать ассистента"
      },
      "uploadSection": {
        "title": "Загрузка обучающего материала"
      },
      "testingSection": {
        "title": "Как тестировать?",
        "steps": {
          "1": "Выберите ассистента для обучения из списка выше",
          "2": "Загрузите текст с информацией о вашей компании",
          "3": "Дождитесь подтверждения загрузки",
          "4": "Задайте вопрос в чате справа",
          "5": "AI ответит на основе загруженной информации"
        },
        "example": {
          "label": "Пример:",
          "text": "Выберите \"Банковский помощник\", загрузите FAQ о возвратах, потом спросите \"Как оформить возврат?\""
        }
      },
      "chat": {
        "title": "Тестовый чат"
      }
    },
    sidebar: {
      "createAssistant": "Создать ассистента",
      "trainAssistant": "Обучить ассистента",
      "myAssistants": "Мои ассистенты", 
      "tutorials": "Документы",
      "statistics": "Статистика",
      "users": "Пользователи",
      "models": "Модели",
      "apiFunctions": "API Функции"
    },
    uploadForm: {
      "errors": {
        "selectAssistant": "Выберите ассистента для обучения",
        "enterText": "Введите текст для обучения", 
        "uploadError": "Ошибка",
        "networkError": "Ошибка сети",
        "loadAssistants": "Ошибка загрузки ассистентов",
        "connectionError": "Не удалось загрузить ассистентов. Проверьте соединение с сервером."
      },
      "defaultTitle": "Документ без названия",
      "warnings": {
        "selectFirst": "Сначала выберите ассистента для обучения из списка выше"
      },
      "fields": {
        "title": "Название материала",
        "content": "Содержимое"
      },
      "placeholders": {
        "title": "FAQ по возвратам",
        "content": "Вставьте сюда содержимое документа, FAQ, инструкции и т.д."
      },
      "buttons": {
        "uploading": "Загружаю...",
        "upload": "Загрузить"
      },
      "loading": {
        "assistants": "Загрузка ассистентов..."
      },
      "dropdown": {
        "label": "Выберите ассистента для обучения",
        "placeholder": "Выберите ассистента",
        "selected": "Выбран"
      }
    },
    chat: {
      "welcomeMessage": "Здравствуйте! Я ваш AI ассистент. Задайте вопрос по загруженным материалам.",
      "noAssistant": "Сначала выберите ассистента для тестирования",
      "askQuestion": "Задайте вопрос по загруженным материалам",
      "thinking": "Думаю...",
      "sources": "Основано на {{count}} документах",
      "errors": {
        "status": "Ошибка",
        "requestError": "Извините, произошла ошибка при обработке вашего запроса."
      },
      "placeholders": {
        "selectAssistant": "Выберите ассистента...",
        "askQuestion": "Задайте вопрос..."
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru', // по умолчанию русский, как на скриншоте
    fallbackLng: 'en',
    debug: true, // включаем для отладки
    
    interpolation: {
      escapeValue: false,
    },
    
    // Настройки для правильной работы с namespace
    defaultNS: 'common',
    ns: ['common', 'homepage', 'sidebar', 'uploadForm', 'chat'],
    
    react: {
      useSuspense: false, // важно для SSR
    }
  });

export default i18n;