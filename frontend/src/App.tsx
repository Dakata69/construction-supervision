// frontend/src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout, ConfigProvider, theme } from 'antd';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, logout } from './store/authSlice';
import type { RootState } from './store/store';
import { api, setAuthHeader } from './api/client';
import Home from './pages/Home';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import NewTask from './pages/NewTask';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Documents from './pages/Documents';
import PreviousProjects from './pages/PreviousProjects';
import GenerateAct from './pages/GenerateAct';
import Header from './components/Header';
import AnimatedCityBackground from './components/AnimatedCityBackground';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';

const { Content } = Layout;
const queryClient = new QueryClient();

export default function App() {
  const dispatch = useDispatch();
  const backgroundEnabled = useSelector((state: RootState) => state.ui.backgroundEnabled);
  const textDimOpacity = useSelector((state: RootState) => state.ui.textDimOpacity);
  
  // Restore auth state on app mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setAuthHeader(token);
      // Fetch current user data
      api.get('me/').then(response => {
        console.log('Restored user from /api/me/:', response.data);
        dispatch(setUser(response.data));
      }).catch(error => {
        console.error('Failed to restore user:', error);
        // Token might be invalid, clear it and mark auth as initialized
        try { localStorage.removeItem('auth_token'); } catch {}
        dispatch(logout());
      });
    } else {
      // No token — ensure auth is marked initialized to avoid UI flicker
      dispatch(logout());
    }
  }, [dispatch]);
  
  // Sync CSS variable for dynamic opacity
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--text-dim-opacity', String(textDimOpacity));
  }
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <Layout className="app">
          {backgroundEnabled && <AnimatedCityBackground />}
          <Header />
          <Layout className="page-container">
            <Content
              style={{
                background: '#fff',
                padding: 24,
                margin: 0,
                borderRadius: 'var(--border-radius)',
                minHeight: 280,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/previous-projects" element={<PreviousProjects />} />
                  <Route 
                    path="/projects" 
                    element={
                      <ProtectedRoute>
                        <ProjectList />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects/new" 
                    element={
                      <ProtectedRoute>
                        <NewProject />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects/:id" 
                    element={
                      <ProtectedRoute>
                        <ProjectDetail />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects/:projectId/tasks/new" 
                    element={
                      <ProtectedRoute>
                        <NewTask />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/projects/:projectId/acts/generate" 
                    element={
                      <ProtectedRoute>
                        <GenerateAct />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/documents" 
                    element={
                      <RoleProtectedRoute requireEdit={true}>
                        <Documents />
                      </RoleProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={
                      <RoleProtectedRoute requireEdit={true}>
                        <AdminDashboard />
                      </RoleProtectedRoute>
                    } 
                  />
                </Routes>
              </Content>
            </Layout>
        </Layout>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
