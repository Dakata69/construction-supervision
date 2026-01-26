// frontend/src/components/Header.tsx
import { Layout, Button, Avatar, Dropdown, Switch, Tooltip, Space, message } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  ProjectOutlined,
  FileOutlined,
  UserOutlined,
  LogoutOutlined,
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  BulbOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleBackground, toggleDayNightCycle } from '../store/uiSlice';
import { logout } from '../store/authSlice';
import type { RootState } from '../store/store';
import { api } from '../api/client';
import { registerPush, unregisterPush } from '../utils/push';
import { usePendingReminders, useDismissReminder } from '../api/hooks/useFeatures';
import type { Reminder } from '../api/hooks/useFeatures';

const { Header: AntHeader } = Layout;

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

const NavContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  
  @media (max-width: 768px) {
    gap: 4px;
  }
`;

const NavLink = styled(Link)<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  text-decoration: none;
  color: rgba(0, 0, 0, 0.88);
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    transform: translateY(-2px);
    color: #667eea;
  }

  ${props => props.$isActive && `
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
    color: #667eea;
    border-bottom: 3px solid #667eea;
  `}

  svg {
    font-size: 16px;
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: scale(1.15) rotate(5deg);
  }

  @media (max-width: 1024px) {
    padding: 6px 10px;
    font-size: 13px;

    svg {
      font-size: 14px;
    }
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
  const canEdit = useSelector((state: RootState) => state.auth.canEdit);
  const authInitialized = useSelector((state: RootState) => state.auth.authInitialized);
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = !!user;
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  
  const { data: reminders = [] } = usePendingReminders();
  const dismissReminder = useDismissReminder();
  
  useEffect(() => {
    const checkPush = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setPushSupported(supported);
      if (!supported) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        setPushEnabled(!!sub);
      } catch (e) {
        setPushEnabled(false);
      }
    };
    checkPush();
  }, []);

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      localStorage.removeItem('auth_token');
      dispatch(logout());
      navigate('/login');
    }
  };

  const handlePushToggle = async () => {
    if (!pushSupported) {
      message.warning('Браузърът не поддържа push известия.');
      return;
    }
    setPushLoading(true);
    try {
      if (pushEnabled) {
        const ok = await unregisterPush();
        setPushEnabled(false);
        if (ok) message.success('Push известията са изключени.');
      } else {
        const result = await registerPush();
        if (result.success) {
          setPushEnabled(true);
          message.success('Push известията са включени.');
        } else {
          setPushEnabled(false);
          const errorMsg = result.error || 'Неуспешно включване на push известия.';
          // Show multi-line error message with better formatting
          message.error({
            content: errorMsg,
            duration: 8,
            style: { whiteSpace: 'pre-line' }
          });
        }
      }
    } catch (e) {
      message.error('Възникна грешка при push настройките.');
    } finally {
      setPushLoading(false);
    }
  };

  const handleDismissReminder = async (reminderId: number) => {
    try {
      await dismissReminder.mutateAsync(reminderId);
      message.success('Напомнянето е маркирано като прочетено');
    } catch (error) {
      message.error('Грешка при маркиране на напомнянето');
    }
  };

  const reminderMenuItems = reminders.map((reminder: Reminder) => ({
    key: reminder.id,
    label: (
      <div style={{ width: '300px', padding: '8px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{reminder.title}</div>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          {reminder.message}
        </div>
        {reminder.project_name && (
          <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
            Проект: {reminder.project_name}
          </div>
        )}
        <Button 
          size="small" 
          type="link" 
          onClick={(e) => {
            e.stopPropagation();
            handleDismissReminder(reminder.id);
          }}
        >
          Маркирай като прочетено
        </Button>
      </div>
    ),
  }));

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Изход',
      danger: true,
    },
  ];

  return (
    <StyledHeader>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <LogoLink to="/">
          <Logo>SVConsult</Logo>
        </LogoLink>
        
        <NavContainer>
          <NavLink to="/" $isActive={location.pathname === '/'}>
            <HomeOutlined />
            Начало
          </NavLink>
          
          <NavLink to="/previous-projects" $isActive={location.pathname === '/previous-projects'}>
            <ProjectOutlined />
            Завършени проекти
          </NavLink>
          
          {isAuthenticated ? (
            <>
              <NavLink to="/projects" $isActive={location.pathname.startsWith('/projects')}>
                <ProjectOutlined />
                Обекти
              </NavLink>
              <NavLink to="/analytics" $isActive={location.pathname === '/analytics'}>
                <BarChartOutlined />
                Аналитика
              </NavLink>
              {authInitialized && canEdit && (
                <>
                  <NavLink to="/documents" $isActive={location.pathname === '/documents'}>
                    <FileOutlined />
                    Документи
                  </NavLink>
                  <NavLink to="/admin" $isActive={location.pathname === '/admin'}>
                    <DashboardOutlined />
                    Админ
                  </NavLink>
                </>
              )}
            </>
          ) : null}
        </NavContainer>
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
          {isAuthenticated && reminders.length > 0 && (
            <Dropdown
              menu={{ items: reminderMenuItems.length > 0 ? reminderMenuItems : [{ key: 'none', label: 'Няма напомняния', disabled: true }] }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                size="small"
                icon={<BellOutlined />}
                style={{ position: 'relative' }}
              >
                {reminders.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#ff4d4f',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '0 6px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                  }}>
                    {reminders.length}
                  </span>
                )}
              </Button>
            </Dropdown>
          )}
          {isAuthenticated && pushSupported && canEdit && (
            <Tooltip title={pushEnabled ? 'Изключи push' : 'Включи push'}>
              <Button
                size="small"
                type={pushEnabled ? 'primary' : 'default'}
                icon={<BellOutlined />}
                loading={pushLoading}
                onClick={handlePushToggle}
              />
            </Tooltip>
          )}
        </Space>
        {isAuthenticated ? (
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
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