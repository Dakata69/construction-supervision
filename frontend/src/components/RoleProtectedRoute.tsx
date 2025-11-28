import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Roles that can access this route
  requireEdit?: boolean; // If true, requires canEdit permission
}

export default function RoleProtectedRoute({ 
  children, 
  allowedRoles,
  requireEdit = false 
}: RoleProtectedRouteProps) {
  const token = localStorage.getItem('auth_token');
  const userRole = useSelector((state: RootState) => state.auth.role);
  const canEdit = useSelector((state: RootState) => state.auth.canEdit);
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);
  
  // First check authentication
  if (!token) {
    return (
      <Result
        status="403"
        icon={<LockOutlined style={{ color: '#667eea' }} />}
        title="Достъпът е ограничен"
        subTitle="Моля, влезте в профила си, за да видите тази страница."
        extra={
          <Button 
            type="primary" 
            href="/login"
            size="large"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
          >
            Вход
          </Button>
        }
      />
    );
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(userRole) && !isAdmin) {
    return (
      <Result
        status="403"
        icon={<LockOutlined style={{ color: '#667eea' }} />}
        title="Нямате достъп до тази страница"
        subTitle="Вашата роля не позволява достъп до този ресурс."
        extra={
          <Button 
            type="primary" 
            href="/"
            size="large"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
          >
            Към началото
          </Button>
        }
      />
    );
  }

  // Check edit permission
  if (requireEdit && !canEdit && !isAdmin) {
    return (
      <Result
        status="403"
        icon={<LockOutlined style={{ color: '#667eea' }} />}
        title="Нямате права за редакция"
        subTitle="Вашата роля позволява само преглед."
        extra={
          <Button 
            type="primary" 
            href="/"
            size="large"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
          >
            Към началото
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
