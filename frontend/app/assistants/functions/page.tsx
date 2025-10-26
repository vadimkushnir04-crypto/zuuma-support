// frontend/app/assistants/functions/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Save, Trash2, Play, Settings, Search, 
  Code, Zap, CheckCircle, XCircle, AlertCircle, 
  Copy, Users, ArrowRight, Bot
} from 'lucide-react';

import AuthGuard from '../../../components/AuthGuard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zuuma.ru/api';

// Типы
interface FunctionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description: string;
  defaultValue?: string;
  testValue?: string; // Добавляем тестовое значение
}

interface GlobalFunction {
  id?: string;
  name: string;
  description: string;
  endpoint_url: string;
  method: string;
  headers: Record<string, string>;
  parameters: FunctionParameter[];
  is_active: boolean;
  created_at?: string;
  usage_count?: number;
}

interface Assistant {
  id: string;
  name: string;
  has_function?: boolean;
}

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
}

export default function GlobalFunctionsPage() {
  const [functions, setFunctions] = useState<GlobalFunction[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<GlobalFunction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  // Добавляем состояние для статистики использования функций
  const [usageStats, setUsageStats] = useState<Record<string, number>>({});

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log("DEBUG: fetchData стартует...");
      try {
        await Promise.all([loadFunctions(), loadAssistants(), loadUsageStats()]);
        console.log("DEBUG: все загрузки завершились");
      } catch (err) {
        console.error("DEBUG: ошибка в fetchData", err);
      } finally {
        setLoading(false);
        console.log("DEBUG: setLoading(false)");
      }
    };
    fetchData();
  }, []);

  const loadFunctions = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}/assistants/functions/global`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (data.success) {
      setFunctions(data.data);
    }
  } catch (error) {
    console.error('Ошибка загрузки функций:', error);
  }
};

const loadAssistants = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.error('No auth token');
      setAssistants([]);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/assistants`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();

    if (Array.isArray(data.data?.assistants)) {
      setAssistants(data.data.assistants);
    } else {
      setAssistants([]);
    }
  } catch (err) {
    console.error("Ошибка загрузки ассистентов:", err);
    setAssistants([]);
  }
};

// Загрузка статистики использования функций
const loadUsageStats = async () => {
  console.log("DEBUG: loadUsageStats вызван");
  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}/assistants/functions/usage-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("DEBUG: response status:", response.status);
    const text = await response.text();
    console.log("DEBUG: raw response text:", text);
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("DEBUG: не удалось распарсить JSON:", e);
      return;
    }

    console.log("DEBUG usage-stats response (JSON):", data);
    if (data.success) {
      const statsMap: Record<string, number> = {};
      data.data.forEach((stat: any) => {
        statsMap[stat.functionId] = stat.usageCount;
      });
      console.log("DEBUG: построен statsMap:", statsMap);
      setUsageStats(statsMap);
    }
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
  }
};

// Создание новой функции
const createNewFunction = () => {
  const newFunction: GlobalFunction = {
    name: 'Новая глобальная функция',
    description: 'Описание функции для взаимодействия с внешним API',
    endpoint_url: 'https://api.example.com/endpoint',
    method: 'GET',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
    parameters: [],
    is_active: true
  };
  setSelectedFunction(newFunction);
  setIsEditing(true);
};

// Удаление функции
const deleteFunction = async (functionId: string) => {
  if (!confirm('Вы уверены, что хотите удалить эту функцию? Она будет удалена у всех ботов.')) return;

  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}/assistants/functions/global/${functionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      await loadFunctions();
      await loadUsageStats();
      setSelectedFunction(null);
      alert('Функция удалена');
    }
  } catch (error) {
    console.error('Ошибка удаления:', error);
  }
};

// Тестирование функции
const testFunction = async () => {
  if (!selectedFunction?.id) return;

  try {
    const token = localStorage.getItem('auth_token');
    const testParams: Record<string, any> = {};

    selectedFunction.parameters.forEach(param => {
      if (param.testValue) {
        if (param.type === 'string') testParams[param.name] = param.testValue;
        else if (param.type === 'number') testParams[param.name] = parseFloat(param.testValue) || 0;
        else if (param.type === 'boolean') testParams[param.name] = param.testValue.toLowerCase() === 'true';
      } else {
        if (param.type === 'string') testParams[param.name] = param.defaultValue || 'test-value';
        else if (param.type === 'number') testParams[param.name] = parseFloat(param.defaultValue || '123') || 123;
        else if (param.type === 'boolean') testParams[param.name] = param.defaultValue === 'true';
      }
    });

    const response = await fetch(`${API_BASE_URL}/assistants/functions/global/${selectedFunction.id}/test`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ testParameters: testParams }),
    });

    const data = await response.json();
    setTestResult(data);

  } catch (error: any) {
    setTestResult({
      success: false,
      message: 'Не удалось выполнить тест',
      error: error.message,
    });
  }
};

// Назначение функции боту
const assignFunctionToBot = async (assistantId: string, functionId: string) => {
  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${API_BASE_URL}/assistants/${assistantId}/functions/assign`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ globalFunctionId: functionId })
    });

    const data = await response.json();
    if (data.success || response.ok) {
      alert('Функция назначена боту!');
      setShowAssignModal(false);
      await loadFunctions();
      await loadUsageStats();
    } else {
      alert('Ошибка назначения функции: ' + (data.error || 'Неизвестная ошибка'));
    }
  } catch (error) {
    console.error('Ошибка назначения:', error);
    alert('Ошибка назначения функции');
  }
};

  // Копирование функции
  const duplicateFunction = (func: GlobalFunction) => {
    const copy = {
      ...func,
      id: undefined,
      name: func.name + ' (Копия)',
    };
    setSelectedFunction(copy);
    setIsEditing(true);
  };

  // Обновление поля функции - исправляем проблему с перезаписью состояния
  const updateFunctionField = useCallback((field: keyof GlobalFunction, value: any) => {
    setSelectedFunction(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  }, []);

  // Обновление параметра функции - исправляем проблему с перезаписью состояния
  const updateParameter = useCallback((index: number, field: keyof FunctionParameter, value: any) => {
    setSelectedFunction(prev => {
      if (!prev) return null;
      const updatedParams = [...prev.parameters];
      updatedParams[index] = { ...updatedParams[index], [field]: value };
      return { ...prev, parameters: updatedParams };
    });
  }, []);

  // Добавление параметра
  const addParameter = useCallback(() => {
    setSelectedFunction(prev => {
      if (!prev) return null;
      const newParam: FunctionParameter = {
        name: 'newParam',
        type: 'string',
        required: false,
        description: 'Описание параметра',
        defaultValue: '',
        testValue: '' // Добавляем тестовое значение
      };
      return { ...prev, parameters: [...prev.parameters, newParam] };
    });
  }, []);

  // Удаление параметра
  const removeParameter = useCallback((index: number) => {
    setSelectedFunction(prev => {
      if (!prev) return null;
      return { 
        ...prev, 
        parameters: prev.parameters.filter((_, i) => i !== index) 
      };
    });
  }, []);

  // Компонент редактора функций
const FunctionEditor = () => {
  const [formData, setFormData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedFunction) {
      setFormData({ ...selectedFunction });
    }
  }, [selectedFunction]);

  if (!formData) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleParamChange = (index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const newParams = [...prev.parameters];
      newParams[index] = { ...newParams[index], [field]: value };
      return { ...prev, parameters: newParams };
    });
  };

  const addParameter = () => {
    setFormData((prev: any) => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        { name: "", type: "string", description: "", defaultValue: "", testValue: "", required: false },
      ],
    }));
  };

  const removeParameter = (index: number) => {
    setFormData((prev: any) => {
      const newParams = [...prev.parameters];
      newParams.splice(index, 1);
      return { ...prev, parameters: newParams };
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/functions/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Ошибка сохранения функции");
      setIsEditing(false);
    } catch (err) {
      console.error("Ошибка сохранения:", err);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    if (selectedFunction) {
      // возвращаем данные из оригинального объекта
      setFormData({ ...selectedFunction });
    }
    setIsEditing(false);
  };

  return (
    <div className="function-editor">
      <div className="function-editor-header">
        <h3 className="function-editor-title">
          {isEditing ? "Редактирование функции" : "Просмотр функции"}
        </h3>
        <div className="function-editor-actions">
          {!isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                <Settings size={16} />
                Редактировать
              </button>
              <button onClick={testFunction} className="btn btn-success">
                <Play size={16} />
                Тестировать
              </button>
              <button onClick={() => setShowAssignModal(true)} className="btn btn-outline">
                <Users size={16} />
                Назначить ботам
              </button>
              <button onClick={() => duplicateFunction(formData)} className="btn btn-outline">
                <Copy size={16} />
                Копировать
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button onClick={handleSave} disabled={loading} className="btn btn-success">
                {loading ? "Сохранение..." : "Сохранить"}
              </button>
              <button onClick={cancelEdit} className="btn btn-outline">
                Отмена
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- форма --- */}
      <div className="function-editor-content">
        {/* Основная информация */}
        <div className="form-row">
          <div className="form-group">
            <label>Название функции</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={!isEditing}
              className="form-input"
              placeholder="Например: Проверить статус заказа"
            />
          </div>

          <div className="form-group">
            <label>HTTP метод</label>
            <select
              value={formData.method}
              onChange={(e) => handleChange("method", e.target.value)}
              disabled={!isEditing}
              className="form-select"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            disabled={!isEditing}
            rows={3}
            className="form-textarea"
            placeholder="Подробное описание того, что делает эта функция"
          />
        </div>

        <div className="form-group">
          <label>URL эндпоинта</label>
          <input
            type="url"
            value={formData.endpoint_url}
            onChange={(e) => handleChange("endpoint_url", e.target.value)}
            disabled={!isEditing}
            className="form-input"
            placeholder="https://api.example.com/orders/{orderId}"
          />
          <p className="form-hint">Используйте {'{параметр}'} для подстановки значений</p>
        </div>

        <div className="form-group">
          <label>HTTP заголовки (JSON)</label>
          <textarea
            value={JSON.stringify(formData.headers, null, 2)}
            onChange={(e) => {
              try {
                const headers = JSON.parse(e.target.value);
                handleChange("headers", headers);
              } catch {}
            }}
            disabled={!isEditing}
            rows={4}
            className="form-textarea code"
            placeholder='{"Authorization": "Bearer YOUR_TOKEN"}'
          />
        </div>

        {/* Параметры */}
        <div className="form-group">
          <div className="form-group-header">
            <label>Параметры функции</label>
            {isEditing && (
              <button onClick={addParameter} className="btn btn-outline btn-sm" type="button">
                <Plus size={16} />
                Добавить параметр
              </button>
            )}
          </div>

          {formData.parameters.length === 0 ? (
            <div className="empty-state">
              <Code size={32} />
              <p>Нет параметров</p>
              <span>Добавьте параметры для функции</span>
            </div>
          ) : (
            <div className="parameters-list">
              {formData.parameters.map((param: any, index: number) => (
                <div key={`param-${index}`} className="parameter-item">
                  <div className="parameter-fields">
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => handleParamChange(index, "name", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Имя параметра"
                      className="form-input"
                    />

                    <select
                      value={param.type}
                      onChange={(e) => handleParamChange(index, "type", e.target.value)}
                      disabled={!isEditing}
                      className="form-select"
                    >
                      <option value="string">Строка</option>
                      <option value="number">Число</option>
                      <option value="boolean">Булево</option>
                    </select>

                    <input
                      type="text"
                      value={param.description}
                      onChange={(e) => handleParamChange(index, "description", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Описание"
                      className="form-input"
                    />

                    <input
                      type="text"
                      value={param.defaultValue || ""}
                      onChange={(e) => handleParamChange(index, "defaultValue", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Значение по умолчанию"
                      className="form-input"
                    />

                    <input
                      type="text"
                      value={param.testValue || ""}
                      onChange={(e) => handleParamChange(index, "testValue", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Тестовое значение"
                      className="form-input"
                      style={{ backgroundColor: "#f0f8ff", borderColor: "#4169e1" }}
                      title="Это значение будет использоваться при тестировании функции"
                    />

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={param.required}
                        onChange={(e) => handleParamChange(index, "required", e.target.checked)}
                        disabled={!isEditing}
                      />
                      Обязательный
                    </label>
                  </div>

                  {isEditing && (
                    <button
                      onClick={() => removeParameter(index)}
                      type="button"
                      className="btn btn-danger btn-icon"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Активность */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleChange("is_active", e.target.checked)}
              disabled={!isEditing}
            />
            Функция активна
          </label>
        </div>

        {/* Результат тестирования */}
        {testResult && (
          <div className={`test-result ${testResult.success ? "success" : "error"}`}>
            <div className="test-result-header">
              {testResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <span>{testResult.success ? "Тест прошел успешно" : "Ошибка тестирования"}</span>
            </div>
            <p>{testResult.message}</p>
            {testResult.data && (
              <details>
                <summary>Данные ответа</summary>
                <pre className="test-response">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};



  const unassignFunctionFromBot = async (assistantId: string, functionId: string) => {
  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(
      `${API_BASE_URL}/assistants/${assistantId}/functions/${functionId}`,
      {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      alert("Функция отвязана от бота!");
      await loadFunctions();
      await loadAssistants();
      await loadUsageStats();
    } else {
      alert("Ошибка отвязки: " + (data.error || "Неизвестная ошибка"));
    }
  } catch (error) {
    console.error("Ошибка отвязки:", error);
    alert("Ошибка отвязки функции");
  }
};

// Модальное окно назначения ботам
const AssignModal = () => {
  const [assistantFunctions, setAssistantFunctions] = useState<Record<string, GlobalFunction[]>>({});
  const [loadingFunctions, setLoadingFunctions] = useState<Record<string, boolean>>({});

  if (!showAssignModal || !selectedFunction) return null;

  const fetchAssistantFunctions = useCallback(async (assistantId: string) => {
    if (assistantFunctions[assistantId]) return;

    setLoadingFunctions(prev => ({ ...prev, [assistantId]: true }));

    try {
      const token = localStorage.getItem('auth_token');
      
      const res = await fetch(`${API_BASE_URL}/assistants/${assistantId}/functions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      const data: GlobalFunction[] = json.data || [];
      setAssistantFunctions(prev => ({ ...prev, [assistantId]: data }));
    } catch (error) {
      console.error('Ошибка при загрузке функций ассистента:', error);
    } finally {
      setLoadingFunctions(prev => ({ ...prev, [assistantId]: false }));
    }
  }, [assistantFunctions]);

    return (
      <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Назначить функцию ботам</h3>
            <button onClick={() => setShowAssignModal(false)} className="modal-close">×</button>
          </div>

          <div className="modal-body">
            <p>Выберите ботов, которым хотите назначить функцию "{selectedFunction.name}":</p>
            <div className="assistants-grid">
              {(Array.isArray(assistants) ? assistants : []).map(assistant => {
                const functions = assistantFunctions[assistant.id] || [];
                const isAssigned = functions.some(f => f.id === selectedFunction.id);

                useEffect(() => {
                  fetchAssistantFunctions(assistant.id);
                }, [assistant.id, fetchAssistantFunctions]);

                return (
                  <div key={assistant.id} className="assign-assistant-card">
                    <div className="assign-assistant-info">
                      <Bot size={20} />
                      <span>{assistant.name}</span>
                    </div>

                    {loadingFunctions[assistant.id] ? (
                      <button className="btn btn-secondary" disabled>Загрузка...</button>
                    ) : isAssigned ? (
                      <button
                        className="btn btn-assigned"
                        style={{
                          backgroundColor: '#10b981 !important',
                          color: 'white !important',
                          border: '1px solid #10b981 !important'
                        }}
                        onClick={() => {
                          if (window.confirm(`Функция уже назначена боту "${assistant.name}". Отвязать?`)) {
                            unassignFunctionFromBot(assistant.id, selectedFunction.id!);
                            setAssistantFunctions(prev => ({
                              ...prev,
                              [assistant.id]: prev[assistant.id].filter(f => f.id !== selectedFunction.id),
                            }));
                          }
                        }}
                      >
                        ✔ Назначено
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          await assignFunctionToBot(assistant.id, selectedFunction.id!);
                          setAssistantFunctions(prev => ({
                            ...prev,
                            [assistant.id]: [...(prev[assistant.id] || []), selectedFunction],
                          }));
                        }}
                      >
                        <ArrowRight size={16} /> Назначить
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredFunctions = functions.filter(func =>
    func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    func.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка функций...</p>
      </div>
    );
  }

  return (
  <AuthGuard requireAuth={true}>
    <div className="functions-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-title-section">
            <div>
              <h1>API Функции</h1>
              <p>Создавайте функции один раз и используйте для любых ботов</p>
            </div>
          </div>
          <button onClick={createNewFunction} className="btn btn-primary">
            <Plus size={20} />
            Создать функцию
          </button>
        </div>
      </div>

      <div className="functions-content">
        {/* Sidebar */}
        <div className="functions-sidebar">
          <div className="sidebar-header">
            <h3>Функции ({functions.length})</h3>
            
            {/* Search */}
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Поиск функций..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="functions-list">
            {filteredFunctions.length === 0 ? (
              <div className="empty-state">
                <Zap size={32} />
                <p>Нет функций</p>
                <span>Создайте первую глобальную API функцию</span>
                <button onClick={createNewFunction} className="btn btn-primary btn-sm">
                  Создать функцию
                </button>
              </div>
            ) : (
              filteredFunctions.map((func) => {
                const usageCount = usageStats[func.id || ''] || 0;
                return (
                  <div
                    key={func.id}
                    onClick={() => {
                      setSelectedFunction(func);
                      setIsEditing(false);
                      setTestResult(null);
                    }}
                    className={`function-card ${selectedFunction?.id === func.id ? 'active' : ''}`}
                  >
                    <div className="function-card-header">
                      <h4>{func.name}</h4>
                      <div className="function-badges">
                        <span className={`method-badge ${func.method.toLowerCase()}`}>
                          {func.method}
                        </span>
                        <span className={`status-badge ${func.is_active ? 'active' : 'inactive'}`}>
                          {func.is_active ? 'Активна' : 'Неактивна'}
                        </span>
                      </div>
                    </div>
                    <p>{func.description}</p>
                    
                    {/* Статистика использования */}
                    <div className="usage-stats">
                      <Users size={14} />
                      <span>Используют {usageCount} {usageCount === 1 ? 'бот' : usageCount > 1 && usageCount < 5 ? 'бота' : 'ботов'}</span>
                    </div>

                    {func.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFunction(func.id!);
                        }}
                        className="function-delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Help */}
          <div className="sidebar-help">
            <AlertCircle size={16} />
            <div>
              <strong>Глобальные функции</strong>
              <ul>
                <li>Создайте функцию один раз</li>
                <li>Назначьте любым ботам</li>
                <li>Редактируйте централизованно</li>
                <li>Отслеживайте использование</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="functions-main">
          {selectedFunction ? (
            <FunctionEditor />
          ) : (
            <div className="empty-state-main">
              <Zap size={64} />
              <h3>Выберите функцию</h3>
              <p>Выберите функцию из списка или создайте новую для настройки глобальной API интеграции</p>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно */}
      <AssignModal />
    </div>
  </AuthGuard>
  );
}