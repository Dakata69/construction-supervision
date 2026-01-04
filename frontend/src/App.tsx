// frontend/src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout, ConfigProvider, theme, App as AntApp } from 'antd';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, logout, initializeAuth } from './store/authSlice';
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
import Analytics from './pages/Analytics';
import BudgetTracking from './pages/BudgetTracking';
import WeatherLogging from './pages/WeatherLogging';
import TemplateLibrary from './pages/TemplateLibrary';
import Header from './components/Header';
import AnimatedCityBackground from './components/AnimatedCityBackground';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import { initTaskDeadlineAlerts } from './utils/deadlineNotifications';
import { registerPush } from './utils/push';

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
        try {
          initTaskDeadlineAlerts(response.data?.id);
        } catch {}
        // Best-effort push registration
        try {
          registerPush();
        } catch {}
      }).catch(error => {
        console.error('Failed to restore user from /api/me/:', error);
        // Only logout if we get a 401 (unauthorized) response
        // Otherwise, keep the token and trust the login state
        if (error.response?.status === 401) {
          try { localStorage.removeItem('auth_token'); } catch {}
          setAuthHeader(); // Clear auth header
          dispatch(logout());
        } else {
          // Mark auth as initialized even if /api/me/ fails (network issue, server error, etc.)
          // The user is already logged in from the login endpoint
          console.log('API unavailable or server error during user restore - keeping auth state');
          dispatch(initializeAuth());
        }
      });
    } else {
      // No token — ensure auth is marked initialized to avoid UI flicker
      dispatch(logout());
    }
  }, []);
  
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
        <AntApp>
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
                    <Route 
                      path="/analytics" 
                      element={
                        <ProtectedRoute>
                          <Analytics />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/templates" 
                      element={
                        <RoleProtectedRoute requireEdit={true}>
                          <TemplateLibrary />
                        </RoleProtectedRoute>
                      } 
                    />
                  </Routes>
                </Content>
              </Layout>
          </Layout>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
