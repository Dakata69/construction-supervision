// frontend/src/components/Header.tsx
import { Layout, Menu, Button, Avatar, Dropdown, Switch, Tooltip, Space } from 'antd';
import type { MenuProps } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  ProjectOutlined,
  FileOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  BulbOutlined,
  MoonOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleBackground, toggleDayNightCycle } from '../store/uiSlice';
import type { RootState } from '../store/store';
import { api } from '../api/client';

const { Header: AntHeader } = Layout;
type MenuItem = Required<MenuProps>['items'][number];

const StyledHeader = styled(AntHeader)`
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 1000;
  
  @media (max-width: 768px) {
    padding: 0 12px;
    flex-wrap: wrap;
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  margin-right: 48px;
  text-decoration: none;
  position: relative;
  
  @media (max-width: 768px) {
    margin-right: 16px;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 0;
    height: 3px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transition: width 0.3s ease;
    border-radius: 2px;
  }
  
  &:hover::after {
    width: 100%;
  }

  &:hover h1 {
    transform: scale(1.05);
  }
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 26px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
  letter-spacing: 1.5px;
  transition: transform 0.3s ease;
  text-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
`;

const StyledMenu = styled(Menu)`
  border: none;
  flex: 1;
  
  .ant-menu-item {
    font-size: 15px;
    font-weight: 500;
    transition: all 0.3s ease;
    border-radius: 8px;
    margin: 0 4px;
    
    &:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%) !important;
      transform: translateY(-2px);
    }
    
    &.ant-menu-item-selected {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%) !important;
      color: #667eea !important;
      
      &::after {
        border-bottom: 3px solid #667eea !important;
      }
    }
  }
  
  .anticon {
    font-size: 16px;
    transition: transform 0.3s ease;
  }
  
  .ant-menu-item:hover .anticon {
    transform: scale(1.15) rotate(5deg);
  }
`;

const StyledAvatar = styled(Avatar)`
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5);
  }
`;

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const backgroundEnabled = useSelector((state: RootState) => state.ui.backgroundEnabled);
  const dayNightCycleEnabled = useSelector((state: RootState) => state.ui.dayNightCycleEnabled);
  const userRole = useSelector((state: RootState) => state.auth.role);
  const canEdit = useSelector((state: RootState) => state.auth.canEdit);
  const authInitialized = useSelector((state: RootState) => state.auth.authInitialized);
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = !!user;
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  
  // Debug logging
  console.log('Header - isAuthenticated:', isAuthenticated, 'userRole:', userRole, 'canEdit:', canEdit);
  
  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, [location]); // Re-check on location change

  // Backend API health check
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        await api.get(''); // hits /api/
        if (!cancelled) setApiHealthy(true);
      } catch {
        if (!cancelled) setApiHealthy(false);
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  
  const userMenuItems: MenuItem[] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Изход',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      localStorage.removeItem('auth_token');
      dispatch({ type: 'auth/logout' });
      navigate('/login');
    } else {
      navigate(key);
    }
  };
  
  // Build menu items dynamically based on authentication
  const menuItems: MenuItem[] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Начало',
    },
    {
      key: '/previous-projects',
      icon: <ProjectOutlined />,
      label: 'Завършени проекти',
    },
  ];
  
  // Add authenticated menu items
  if (isAuthenticated) {
    // All authenticated users can see projects immediately
    menuItems.push({
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Обекти',
    });
  }
  // Only admins can see Documents and Admin panel (after auth is resolved)
  if (authInitialized && canEdit) {
    menuItems.push(
      {
        key: '/documents',
        icon: <FileOutlined />,
        label: 'Документи',
      },
      {
        key: '/admin',
        icon: <DashboardOutlined />,
        label: 'Административен панел',
      }
    );
  }

  return (
    <StyledHeader>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <LogoLink to="/">
          <Logo>SVConsult</Logo>
        </LogoLink>
        
        <StyledMenu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          overflowedIndicator={null}
          style={{ flex: 1, minWidth: 0 }}
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Space size="middle">
          <Tooltip title={backgroundEnabled ? 'Скрий фон' : 'Покажи фон'}>
            <Switch
              checkedChildren={<EyeOutlined />}
              unCheckedChildren={<EyeInvisibleOutlined />}
              checked={backgroundEnabled}
              onChange={() => dispatch(toggleBackground())}
            />
          </Tooltip>
          {backgroundEnabled && (
            <Tooltip title={dayNightCycleEnabled ? 'Нощен режим' : 'Дневен режим'}>
              <Switch
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<BulbOutlined />}
                checked={dayNightCycleEnabled}
                onChange={() => dispatch(toggleDayNightCycle())}
              />
            </Tooltip>
          )}
        </Space>
        {authInitialized && isAuthenticated ? (
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleMenuClick,
            }}
            placement="bottomRight"
          >
            <StyledAvatar icon={<UserOutlined />} />
          </Dropdown>
        ) : (
          <Button 
            type="primary"
            onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
          >
            Вход
          </Button>
        )}
      </div>
    </StyledHeader>
  );
}