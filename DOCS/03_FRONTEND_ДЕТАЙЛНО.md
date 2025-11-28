# Frontend (React + TypeScript) - Детайлно обяснение

## Какво е Frontend?

Frontend е **"лицето"** на приложението - частта, която:
- Потребителят вижда и с която взаимодейства
- Показва данни красиво и удобно
- Изпраща заявки към backend
- Обработва потребителски действия

**Аналогия**: Ако backend е кухня, frontend е интериора на ресторанта и менюто.

---

## Структура на frontend папката

```
frontend/
├── index.html                  ← Главен HTML файл (entry point)
├── package.json                ← Dependencies и scripts
├── tsconfig.json               ← TypeScript настройки
├── vite.config.ts              ← Vite build tool конфигурация
│
├── public/                     ← Статични файлове (копират се директно)
│   └── team/
│       └── README.md
│
└── src/                        ← Основен код
    ├── main.tsx                ← Точката на влизане в приложението
    ├── App.tsx                 ← Главен компонент (routing)
    │
    ├── api/                    ← Комуникация с backend
    │   ├── client.ts           ← Axios instance + auth
    │   └── hooks.ts            ← React Query hooks
    │
    ├── components/             ← Reusable компоненти
    │   ├── Header.tsx
    │   ├── Sidebar.tsx
    │   ├── ProtectedRoute.tsx
    │   └── ...
    │
    ├── pages/                  ← Страници (routes)
    │   ├── Home.tsx
    │   ├── Login.tsx
    │   ├── Documents.tsx
    │   ├── GenerateAct.tsx
    │   └── ...
    │
    ├── store/                  ← Redux Toolkit (state management)
    │   ├── store.ts            ← Store конфигурация
    │   ├── authSlice.ts        ← Auth state
    │   └── uiSlice.ts          ← UI state
    │
    ├── styles/                 ← CSS файлове
    │   ├── mobile.css          ← Mobile responsive
    │   └── ...
    │
    └── types/                  ← TypeScript type definitions
        └── index.ts
```

---

## Технологии и защо са избрани

| Технология | Какво е | Защо е избрана |
|-----------|---------|---------------|
| **React** | JavaScript библиотека за UI | Компонентен подход, голяма екосистема, лесно за научаване |
| **TypeScript** | JavaScript + типове | Намалява грешките, по-добър autocomplete, по-четим код |
| **Vite** | Build tool | Много бърз development server, fast hot reload |
| **React Router** | Routing библиотека | Управление на URL-и и навигация |
| **Redux Toolkit** | State management | Глобално състояние (user, auth, UI), по-прост от чист Redux |
| **Ant Design** | UI библиотека | Готови компоненти (Button, Table, Form), професионален вид |
| **Axios** | HTTP client | По-лесен API за заявки от fetch, interceptors за auth |
| **React Query** | Data fetching | Автоматичен caching, refetch, loading states |

---

## Как работи React? (Основи)

### Компоненти

Компонент е **функция която връща JSX** (HTML-подобен синтаксис).

```tsx
// Прост компонент
function Welcome() {
  return <h1>Добре дошли!</h1>;
}

// Компонент с props (parameters)
function Greeting({ name }: { name: string }) {
  return <h1>Здравей, {name}!</h1>;
}

// Използване:
<Greeting name="Иван" />
// Резултат: <h1>Здравей, Иван!</h1>
```

### State (Състояние)

State е **данни които се променят** и при промяна компонентът се re-render-ва.

```tsx
import { useState } from 'react';

function Counter() {
  // useState връща [стойност, функция за промяна]
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Брой: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Увеличи
      </button>
    </div>
  );
}
```

**Как работи:**

```
1. count = 0
2. Показва "Брой: 0"
3. Потребителят кликва бутона
4. setCount(1) → count става 1
5. React re-render-ва компонента
6. Сега показва "Брой: 1"
```

### Props (Properties)

Props са **параметри** които parent компонент подава на child компонент.

```tsx
// Parent компонент
function ProjectList() {
  return (
    <div>
      <ProjectCard 
        name="Жилищна сграда" 
        status="active"
        progress={75}
      />
      <ProjectCard 
        name="Офис сграда" 
        status="completed"
        progress={100}
      />
    </div>
  );
}

// Child компонент
interface ProjectCardProps {
  name: string;
  status: string;
  progress: number;
}

function ProjectCard({ name, status, progress }: ProjectCardProps) {
  return (
    <div className="card">
      <h3>{name}</h3>
      <p>Статус: {status}</p>
      <p>Прогрес: {progress}%</p>
    </div>
  );
}
```

---

## Файл по файл обяснение

### 1. main.tsx - Точка на влизане

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';        // Redux
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';  // React Query
import App from './App';
import { store } from './store/store';
import './styles/mobile.css';

// Конфигурация на React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // Не refetch-ва при focus на прозореца
      retry: 1,                      // Retry само веднъж при грешка
      staleTime: 5 * 60 * 1000,     // Данните са "fresh" за 5 минути
    },
  },
});

// Render приложението
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>              {/* Redux store */}
      <QueryClientProvider client={queryClient}>  {/* React Query */}
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
```

**Какво се случва тук:**

1. Импортва се React, ReactDOM, и библиотеки
2. Създава се QueryClient за React Query (caching, refetch)
3. Приложението се обвива в:
   - `<Provider>` → Дава достъп до Redux store
   - `<QueryClientProvider>` → Дава достъп до React Query
4. `<App />` се рендерира в `<div id="root">`

---

### 2. App.tsx - Главен компонент и Routing

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { useSelector } from 'react-redux';

// Компоненти
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Страници
import Home from './pages/Home';
import Login from './pages/Login';
import Documents from './pages/Documents';
import GenerateAct from './pages/GenerateAct';
import Projects from './pages/Projects';
import AdminDashboard from './pages/AdminDashboard';

// Redux selector
import { RootState } from './store/store';

const { Content } = Layout;

function App() {
  // Взема isAuthenticated от Redux store
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        
        {/* Header винаги се показва */}
        <Header />
        
        <Layout>
          {/* Sidebar само за authenticated потребители */}
          {isAuthenticated && <Sidebar />}
          
          <Content style={{ padding: '24px' }}>
            <Routes>
              {/* Публични routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              
              {/* Защитени routes (изискват login) */}
              <Route 
                path="/documents" 
                element={
                  <ProtectedRoute>
                    <Documents />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/generate-act" 
                element={
                  <ProtectedRoute>
                    <GenerateAct />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/projects" 
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin route */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Fallback - redirect към home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Content>
        </Layout>
        
      </Layout>
    </BrowserRouter>
  );
}

export default App;
```

**Как работи routing:**

```
URL: http://localhost:5173/documents
       │
       ├─> BrowserRouter match-ва path="/documents"
       │
       ├─> Проверява ProtectedRoute
       │   │
       │   ├─> isAuthenticated = true → Показва <Documents />
       │   └─> isAuthenticated = false → Redirect към /login
       │
       └─> Рендерира:
           <Layout>
             <Header />
             <Sidebar />
             <Content>
               <Documents />  ← Тази страница се показва
             </Content>
           </Layout>
```

---

### 3. api/client.ts - Axios Client (Комуникация с Backend)

Това е **КЛЮЧОВИЯТ** файл за комуникация с backend!

```tsx
import axios from 'axios';

// Създава Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',  // Backend URL
  withCredentials: true,                   // Изпраща cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor (добавя auth token)
api.interceptors.request.use(
  (config) => {
    // Взема token от localStorage
    const token = localStorage.getItem('authToken');
    
    // Ако има token, добави го в header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (обработва грешки)
api.interceptors.response.use(
  (response) => {
    // Всичко ОК, върни response
    return response;
  },
  (error) => {
    // Ако е 401 Unauthorized → token е невалиден
    if (error.response?.status === 401) {
      // Изтрий token
      localStorage.removeItem('authToken');
      
      // Redirect към login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Helper функция за set auth header
export function setAuthHeader(token: string) {
  localStorage.setItem('authToken', token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Helper функция за изчистване на auth
export function clearAuth() {
  localStorage.removeItem('authToken');
  delete api.defaults.headers.common['Authorization'];
}

export default api;
```

**Как се използва:**

```tsx
import api from '../api/client';

// GET заявка
async function fetchProjects() {
  try {
    const response = await api.get('/projects/');
    console.log(response.data);  // Масив от проекти
  } catch (error) {
    console.error('Грешка:', error);
  }
}

// POST заявка
async function createProject(data) {
  try {
    const response = await api.post('/projects/', data);
    console.log('Създаден проект:', response.data);
  } catch (error) {
    console.error('Грешка при създаване:', error);
  }
}

// PUT заявка (обновяване)
async function updateProject(id, data) {
  const response = await api.put(`/projects/${id}/`, data);
  return response.data;
}

// DELETE заявка
async function deleteProject(id) {
  await api.delete(`/projects/${id}/`);
}
```

**Какво се случва при заявка:**

```
1. Frontend извиква: api.get('/projects/')
   │
2. Request Interceptor добавя token
   │
3. Axios изпраща HTTP заявка към:
   http://localhost:8000/api/projects/
   Headers:
     Authorization: Bearer eyJ0eXAiOiJKV1Q...
     Content-Type: application/json
   │
4. Backend обработва заявката
   │
5. Връща JSON response:
   {
     "id": 1,
     "name": "Проект X",
     ...
   }
   │
6. Response Interceptor проверява за 401
   │
7. Данните се връщат във frontend
```

---

### 4. store/authSlice.ts - Redux Slice за Authentication

Redux Toolkit използва "slices" за управление на state.

```tsx
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Интерфейс за User
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
}

// Интерфейс за Auth State
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

// Начално състояние
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('authToken'),  // Зарежда от localStorage
  loading: false,
};

// Създаване на slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login success
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      
      // Запази token в localStorage
      localStorage.setItem('authToken', action.payload.token);
    },
    
    // Logout
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      
      // Изтрий token от localStorage
      localStorage.removeItem('authToken');
    },
    
    // Set loading
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Update user
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
});

// Export actions
export const { loginSuccess, logout, setLoading, updateUser } = authSlice.actions;

// Export reducer
export default authSlice.reducer;
```

**Как се използва в компонент:**

```tsx
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../store/authSlice';
import { RootState } from '../store/store';

function MyComponent() {
  // useSelector - взема данни от store
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  // useDispatch - изпраща actions
  const dispatch = useDispatch();
  
  const handleLogin = () => {
    dispatch(loginSuccess({
      user: { id: 1, username: 'ivan', ... },
      token: 'abc123...'
    }));
  };
  
  const handleLogout = () => {
    dispatch(logout());
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Здравей, {user?.first_name}!</p>
      ) : (
        <p>Не си влязъл</p>
      )}
    </div>
  );
}
```

**Redux Flow:**

```
Component
   │
   ├─> dispatch(loginSuccess({user, token}))
   │
   ▼
Redux Store
   │
   ├─> authSlice reducer обработва action
   ├─> Променя state.auth.isAuthenticated = true
   ├─> Променя state.auth.user = {...}
   │
   ▼
Component re-render-ва
   │
   └─> Сега useSelector връща нови данни
```

---

### 5. components/ProtectedRoute.tsx - Route Guard

Компонент, който проверява дали потребителят е logged in.

```tsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;  // Опционално: само за admin
}

function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  // Взема auth данни от Redux
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  // Не е authenticated → redirect към login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // adminOnly = true, но потребителят не е admin
  if (adminOnly && !user?.is_admin) {
    return <Navigate to="/" replace />;
  }
  
  // Всичко ОК → показва children компонента
  return <>{children}</>;
}

export default ProtectedRoute;
```

**Използване:**

```tsx
// В App.tsx
<Route 
  path="/admin" 
  element={
    <ProtectedRoute adminOnly>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

**Flow:**

```
Потребител отваря /admin
   │
   ▼
<ProtectedRoute adminOnly> проверява:
   │
   ├─> isAuthenticated? 
   │   └─> false → Navigate to="/login"
   │
   ├─> user.is_admin?
   │   └─> false → Navigate to="/"
   │
   └─> true → Показва <AdminDashboard />
```

---

### 6. pages/Documents.tsx - Пример за страница

```tsx
import { useState, useEffect } from 'react';
import { Button, Table, message, Row, Col, Card } from 'antd';
import { DownloadOutlined, FileWordOutlined } from '@ant-design/icons';
import api from '../api/client';

// TypeScript интерфейс за Document
interface Document {
  id: number;
  title: string;
  type: string;
  project: number;
  project_name: string;
  created_at: string;
  docx_file: string;
  pdf_file: string;
}

function Documents() {
  // State за documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Зарежда documents при mount
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  // Функция за fetch на documents
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/documents/');
      setDocuments(response.data);
    } catch (error) {
      message.error('Грешка при зареждане на документи');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Функция за download на документ
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };
  
  // Колони за таблицата
  const columns = [
    {
      title: 'Заглавие',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Проект',
      dataIndex: 'project_name',
      key: 'project_name',
    },
    {
      title: 'Дата',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('bg-BG'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Document) => (
        <>
          <Button
            type="link"
            icon={<FileWordOutlined />}
            onClick={() => handleDownload(record.docx_file, `${record.title}.docx`)}
          >
            Word
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.pdf_file, `${record.title}.pdf`)}
          >
            PDF
          </Button>
        </>
      ),
    },
  ];
  
  return (
    <div className="documents-page">
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Документи">
            <Table
              dataSource={documents}
              columns={columns}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Documents;
```

**Какво прави този компонент:**

1. **useState** - Създава state за documents и loading
2. **useEffect** - При mount извиква fetchDocuments()
3. **fetchDocuments** - Прави GET заявка към `/api/documents/`
4. **columns** - Дефинира колони за Ant Design Table
5. **handleDownload** - Създава temp link и download-ва файл
6. **render** - Показва таблица с documents

**Lifecycle:**

```
Component mount
   │
   ├─> useEffect(() => {...}, []) се изпълнява
   │
   ├─> fetchDocuments() извиква api.get('/documents/')
   │
   ├─> Backend връща масив от documents
   │
   ├─> setDocuments(response.data) → state се обновява
   │
   └─> Component re-render с нови documents

Потребител кликва "Word" бутон
   │
   ├─> handleDownload(url, filename) се извиква
   │
   └─> Браузърът download-ва файла
```

---

### 7. pages/GenerateAct.tsx - Генериране на документи

```tsx
import { useState } from 'react';
import { Form, Input, Button, Select, DatePicker, message } from 'antd';
import api from '../api/client';

function GenerateAct() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // Submit handler
  const handleSubmit = async (values: any) => {
    setLoading(true);
    
    try {
      // Подготви context данни
      const context = {
        project_name: values.project_name,
        act_number: values.act_number,
        act_date: values.act_date.format('DD.MM.YYYY'),
        location: values.location,
        client_name: values.client_name,
        consultant_name: values.consultant_name,
        designer_name: values.designer_name,
        contractor_name: values.contractor_name,
      };
      
      // Изпрати POST заявка към backend
      const response = await api.post('/documents/generate/', {
        template_name: 'act14_bg.docx',
        context: context,
      });
      
      message.success('Акт 14 е генериран успешно!');
      
      // Download Word файла
      if (response.data.docx_url) {
        window.open(response.data.docx_url, '_blank');
      }
      
      // Reset формата
      form.resetFields();
      
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Грешка при генериране');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Генериране на Акт 14</h2>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Име на проект"
          name="project_name"
          rules={[{ required: true, message: 'Въведете име на проект' }]}
        >
          <Input placeholder="Жилищна сграда" />
        </Form.Item>
        
        <Form.Item
          label="Номер на акт"
          name="act_number"
          rules={[{ required: true, message: 'Въведете номер' }]}
        >
          <Input placeholder="14-2025-001" />
        </Form.Item>
        
        <Form.Item
          label="Дата на акт"
          name="act_date"
          rules={[{ required: true, message: 'Изберете дата' }]}
        >
          <DatePicker format="DD.MM.YYYY" />
        </Form.Item>
        
        <Form.Item
          label="Местонахождение"
          name="location"
          rules={[{ required: true }]}
        >
          <Input placeholder="гр. София" />
        </Form.Item>
        
        <Form.Item
          label="Възложител"
          name="client_name"
          rules={[{ required: true }]}
        >
          <Input placeholder="Строй ЕООД" />
        </Form.Item>
        
        <Form.Item
          label="Консултант"
          name="consultant_name"
          rules={[{ required: true }]}
        >
          <Input placeholder="Инж. Иван Иванов" />
        </Form.Item>
        
        <Form.Item
          label="Проектант"
          name="designer_name"
          rules={[{ required: true }]}
        >
          <Input placeholder="Арх. Петър Петров" />
        </Form.Item>
        
        <Form.Item
          label="Изпълнител"
          name="contractor_name"
          rules={[{ required: true }]}
        >
          <Input placeholder="Билдинг ООД" />
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            block
          >
            Генерирай Акт 14
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default GenerateAct;
```

**Flow на генериране:**

```
1. Потребител попълва формата
   │
2. Кликва "Генерирай"
   │
3. handleSubmit() се извиква
   │
4. Подготвя context обект:
   {
     project_name: "Жилищна сграда",
     act_date: "28.11.2025",
     ...
   }
   │
5. Изпраща POST към /api/documents/generate/
   Body:
   {
     template_name: "act14_bg.docx",
     context: {...}
   }
   │
6. Backend:
   - Зарежда act14_bg.docx шаблон
   - Заменя {{placeholders}}
   - Генерира Word файл
   - Връща URL-и
   │
7. Frontend получава response:
   {
     docx_url: "/media/generated/act14_20251128_153000.docx",
     pdf_url: "/media/generated/act14_20251128_153000.pdf"
   }
   │
8. Отваря docx_url в нов таб
   │
9. Потребителят download-ва файла
```

---

## Ant Design Components

Ant Design предоставя готови UI компоненти.

### Често използвани компоненти:

```tsx
// Button
<Button type="primary" onClick={handleClick}>
  Кликни
</Button>

// Table
<Table 
  dataSource={data} 
  columns={columns} 
  rowKey="id" 
/>

// Form
<Form onFinish={handleSubmit}>
  <Form.Item label="Име" name="name">
    <Input />
  </Form.Item>
  <Button htmlType="submit">Submit</Button>
</Form>

// Card
<Card title="Заглавие">
  <p>Съдържание</p>
</Card>

// Modal
<Modal 
  title="Заглавие" 
  open={isOpen} 
  onOk={handleOk} 
  onCancel={handleCancel}
>
  <p>Съдържание</p>
</Modal>

// Message (notifications)
message.success('Успех!');
message.error('Грешка!');
message.warning('Внимание!');

// Select
<Select 
  options={[
    { value: 'active', label: 'Активен' },
    { value: 'paused', label: 'Спрян' },
  ]}
  onChange={handleChange}
/>

// DatePicker
<DatePicker format="DD.MM.YYYY" />
```

---

## TypeScript - Основи

TypeScript добавя **типове** към JavaScript.

### Основни типове:

```tsx
// Primitives
let name: string = "Иван";
let age: number = 30;
let isActive: boolean = true;

// Arrays
let numbers: number[] = [1, 2, 3];
let names: string[] = ["Иван", "Петър"];

// Objects
let person: { name: string; age: number } = {
  name: "Иван",
  age: 30
};

// Interfaces (по-добър начин за objects)
interface Person {
  name: string;
  age: number;
  email?: string;  // Опционално поле
}

let user: Person = {
  name: "Иван",
  age: 30
};

// Functions
function add(a: number, b: number): number {
  return a + b;
}

// Arrow functions
const multiply = (a: number, b: number): number => {
  return a * b;
};
```

### Защо TypeScript:

```tsx
// Без TypeScript (JavaScript)
function fetchUser(id) {
  // id може да е число, string, undefined...
  // Няма гаранция какво ще върне
  return api.get(`/users/${id}`);
}

// С TypeScript
async function fetchUser(id: number): Promise<User> {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
  // Сега VS Code знае че връща User обект
  // Autocomplete работи!
}
```

---

## React Hooks - Често използвани

### useState - State management

```tsx
const [count, setCount] = useState<number>(0);
const [name, setName] = useState<string>("");
const [user, setUser] = useState<User | null>(null);
```

### useEffect - Side effects

```tsx
// Изпълнява се при mount
useEffect(() => {
  fetchData();
}, []);

// Изпълнява се когато count се промени
useEffect(() => {
  console.log('Count changed:', count);
}, [count]);

// Cleanup function
useEffect(() => {
  const timer = setInterval(() => {
    console.log('Tick');
  }, 1000);
  
  // Cleanup при unmount
  return () => {
    clearInterval(timer);
  };
}, []);
```

### useRef - Reference към DOM елемент

```tsx
const inputRef = useRef<HTMLInputElement>(null);

const focusInput = () => {
  inputRef.current?.focus();
};

return <Input ref={inputRef} />;
```

### useMemo - Memoization

```tsx
// Изчислява се само когато data се промени
const expensiveValue = useMemo(() => {
  return data.reduce((acc, item) => acc + item.value, 0);
}, [data]);
```

---

## Пълен пример: Component с всичко

```tsx
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Table, Form, Input, message } from 'antd';
import api from '../api/client';
import { RootState } from '../store/store';

interface Project {
  id: number;
  name: string;
  status: string;
}

function ProjectsPage() {
  // Redux
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  
  // Local state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // Fetch projects при mount
  useEffect(() => {
    fetchProjects();
  }, []);
  
  // Fetch function
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/projects/');
      setProjects(response.data);
    } catch (error) {
      message.error('Грешка при зареждане');
    } finally {
      setLoading(false);
    }
  };
  
  // Create project
  const handleCreate = async (values: any) => {
    try {
      await api.post('/projects/', values);
      message.success('Проектът е създаден');
      form.resetFields();
      fetchProjects();  // Refresh списъка
    } catch (error) {
      message.error('Грешка при създаване');
    }
  };
  
  // Table columns
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Име', dataIndex: 'name', key: 'name' },
    { title: 'Статус', dataIndex: 'status', key: 'status' },
  ];
  
  return (
    <div>
      <h2>Здравей, {user?.first_name}!</h2>
      
      {/* Форма за създаване */}
      <Form form={form} onFinish={handleCreate} layout="inline">
        <Form.Item name="name" rules={[{ required: true }]}>
          <Input placeholder="Име на проект" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Създай
          </Button>
        </Form.Item>
      </Form>
      
      {/* Таблица */}
      <Table
        dataSource={projects}
        columns={columns}
        loading={loading}
        rowKey="id"
      />
    </div>
  );
}

export default ProjectsPage;
```

---

## Build Process (Vite)

### Development:

```bash
cd frontend
npm install
npm run dev
```

Vite стартира dev server на `http://localhost:5173`.

### Production Build:

```bash
npm run build
```

Създава `dist/` папка с оптимизиран код.

---

## Следваща стъпка

Вижте **[04_ГЕНЕРИРАНЕ_НА_ДОКУМЕНТИ.md](./04_ГЕНЕРИРАНЕ_НА_ДОКУМЕНТИ.md)** за детайлно обяснение на документ генерирането.
