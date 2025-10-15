import Link from "next/link";
import { Bot, Database, Zap, MessageCircle, CheckCircle, Smile, Upload, Puzzle, ArrowRight, Sparkles, Users, BarChart3 } from "lucide-react";

export default function Home() {
  const workflowSteps = [
    { 
      id: 1, 
      title: "1. Создайте ассистента", 
      description: "Настройте личность и стиль общения",
      icon: Bot,
      color: "from-blue-500 to-blue-600"
    },
    { 
      id: 2, 
      title: "2. Загрузите данные", 
      description: "Текст/MD/PDF/и другие. Можете добавить API запросы",
      icon: Upload,
      color: "from-green-500 to-green-600"
    },
    { 
      id: 3, 
      title: "3. Векторизация", 
      description: "Данных в Qdrant для более быстрого поиска",
      icon: Puzzle,
      color: "from-purple-500 to-purple-600"
    },
    { 
      id: 4, 
      title: "4. База данных", 
      description: "Сохранение в векторную БД обучающего материала и функций",
      icon: Database,
      color: "from-orange-500 to-orange-600"
    },
    { 
      id: 5, 
      title: "5. Клиент спрашивает", 
      description: "Вопрос поступает в чат",
      icon: MessageCircle,
      color: "from-pink-500 to-pink-600"
    },
    { 
      id: 6, 
      title: "6. Поиск контекста", 
      description: "LLM находит релевантную информацию",
      icon: Zap,
      color: "from-yellow-500 to-yellow-600"
    },
    { 
      id: 7, 
      title: "7. Ответ клиенту", 
      description: "Построенный ИИ на основе обучающих данных",
      icon: CheckCircle,
      color: "from-emerald-500 to-emerald-600"
    },
    { 
      id: 8, 
      title: "8. Довольный клиент", 
      description: "Ваш клиент получил ответ, как будто от реального человека",
      icon: Smile,
      color: "from-emerald-500 to-emerald-600"
    }
  ];


  return (
    <div className="modern-home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          
          <h1 className="hero-title">
            AI-ассистенты для вашего бизнеса
          </h1>
          
          <p className="hero-subtitle">
            Превратите свои документы и знания в интеллектуальных помощников, 
            которые будут отвечать на вопросы клиентов 24/7
          </p>

          <div className="hero-actions">
            <Link href="/assistants/create" className="hero-btn-primary">
              <Bot className="w-5 h-5" />
              Создать ассистента
            </Link>
            <Link href="/tutorials" className="hero-btn-secondary">
              Посмотреть документы
            </Link>
          </div>

        </div>
      </section>

      {/* How it works */}
      <section className="workflow-section">
        <div className="workflow-grid">
          {workflowSteps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={step.id} className="workflow-card">
                <div className="workflow-card-header">
                  <div className={`workflow-icon bg-gradient-to-r ${step.color}`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                </div>
                
                <div className="workflow-content">
                  <h3 className="workflow-title">{step.title}</h3>
                  <p className="workflow-description">{step.description}</p>
                </div>
                
                {index < workflowSteps.length - 1 && (
                  <div className="workflow-arrow">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>


      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Готовы начать?</h2>
          <p className="cta-subtitle">
            Создайте своего первого AI-ассистента прямо сейчас
          </p>
          <Link href="/assistants/create" className="cta-button">
            <Bot className="w-5 h-5" />
            Создать ассистента бесплатно
          </Link>
        </div>
      </section>

    </div>
  );
}