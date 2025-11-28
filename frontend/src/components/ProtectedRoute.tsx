import { Navigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Check if user is authenticated by looking for token in localStorage
  const token = localStorage.getItem('auth_token');
  
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

  return <>{children}</>;
}
