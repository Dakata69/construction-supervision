// frontend/src/pages/Login.tsx
import { Form, Input, Button, Card, Typography, message, Space, Modal } from 'antd';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { UserOutlined, LockOutlined, LoginOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/authSlice';
import { api, setAuthHeader } from '../api/client';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useState } from 'react';

const { Title, Text, Paragraph } = Typography;

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: moveBackground 20s linear infinite;
  }

  @keyframes moveBackground {
    0% { transform: translate(0, 0); }
    100% { transform: translate(50px, 50px); }
  }
`;

const StyledCard = styled(motion.div)`
  max-width: 450px;
  width: 100%;
  position: relative;
  z-index: 1;

  .ant-card {
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
      border-radius: 12px;
    }
  }
    overflow: hidden;
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.95);
  }
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 32px;
  padding: 32px 32px 0;
  
  .logo-icon {
    font-size: 64px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 16px;
    display: inline-block;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;

const StyledForm = styled(Form)`
  padding: 0 32px 32px;

  .ant-form-item {
    margin-bottom: 24px;
  }

  .ant-input-affix-wrapper {
    padding: 12px 16px;
    border-radius: 10px;
    border: 2px solid #e8e8e8;
    transition: all 0.3s ease;
    font-size: 15px;

    &:hover, &:focus, &.ant-input-affix-wrapper-focused {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .anticon {
      color: #667eea;
      font-size: 18px;
    }
  }

  .ant-input {
    font-size: 15px;
  }
`;

const StyledButton = styled(Button)`
  width: 100%;
  height: 50px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    background: linear-gradient(135deg, #7c8ef0 0%, #8a5bb2 100%);
  }

  &:active {
    transform: translateY(0);
  }

  .anticon {
    font-size: 18px;
  }
`;

const InfoBox = styled.div`
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  padding: 16px;
  border-radius: 10px;
  margin-bottom: 24px;
  border-left: 4px solid #667eea;
`;

export default function Login() {
    const backgroundEnabled = useSelector((state: RootState) => state.ui.backgroundEnabled);
  const [form] = Form.useForm();
  const [forgotPasswordForm] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Use JWT token endpoint
      const res = await api.post('token/', { 
        username: values.username, 
        password: values.password 
      });
      
      const token = res.data?.access;
      const userData = res.data?.user; // Get user data from response
      
      if (token) {
        // Persist token and set header
        try { 
          localStorage.setItem('auth_token', token); 
        } catch (e) {
          console.error('Failed to save token', e);
        }
        
        setAuthHeader(token);
        
        // Dispatch user data including role
        console.log('Login userData:', userData); // Debug log
        dispatch(setUser(userData || { username: values.username, is_staff: false, role: 'privileged' }));
        
        message.success({
          content: 'Добре дошли! Влизане успешно.',
          duration: 2,
        });
        
        // Redirect to home page after successful login
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        message.error('Неуспешен вход — няма токен');
        setLoading(false);
      }
    } catch (e: any) {
      console.error('Login failed', e);
      
      if (e.response?.status === 401) {
        message.error({
          content: 'Грешно потребителско име или парола',
          duration: 3,
        });
      } else {
        message.error({
          content: 'Възникна грешка при влизане. Моля опитайте отново.',
          duration: 3,
        });
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (values: any) => {
    setForgotPasswordLoading(true);
    try {
      await api.post('/auth/request-password-reset/', { email: values.email });
      message.success({
        content: 'Линкът за възстановяване на парола е изпратен по имейл',
        duration: 3,
      });
      setForgotPasswordVisible(false);
      forgotPasswordForm.resetFields();
    } catch (error: any) {
      message.error({
        content: error.response?.data?.message || 'Грешка при изпращане. Проверете имейла и опитайте отново.',
        duration: 3,
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <LoginContainer>
      <StyledCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card bordered={false}>
          <LogoSection>
            <SafetyCertificateOutlined className="logo-icon" />
            <Title level={2} style={{ 
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              SVConsult
            </Title>
            <Text type="secondary" style={{ fontSize: '15px' }} className={backgroundEnabled ? 'background-active-dim' : ''}>
              Строителен надзор и контрол
            </Text>
          </LogoSection>

          <InfoBox>
            <Space direction="vertical" size={4}>
              <Text strong style={{ color: '#667eea' }}>
                <LockOutlined /> Вход за служители
              </Text>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Само упълномощени служители на фирмата имат достъп до системата
              </Text>
            </Space>
          </InfoBox>

          <StyledForm
            form={form}
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Моля въведете потребителско име' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Потребителско име"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Моля въведете парола' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Парола"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <StyledButton
                type="primary"
                htmlType="submit"
                icon={<LoginOutlined />}
                loading={loading}
              >
                {loading ? 'Влизане...' : 'Вход'}
              </StyledButton>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
              <Button 
                type="link" 
                onClick={() => setForgotPasswordVisible(true)}
                style={{ color: '#667eea' }}
              >
                Забравена парола?
              </Button>
            </Form.Item>
          </StyledForm>

          <div style={{ textAlign: 'center', padding: '0 32px 24px', marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              Ако имате проблеми с влизането, свържете се с администратор
            </Text>
          </div>

          <Modal
            title="Възстановяване на парола"
            open={forgotPasswordVisible}
            onCancel={() => {
              setForgotPasswordVisible(false);
              forgotPasswordForm.resetFields();
            }}
            footer={[
              <Button key="cancel" onClick={() => {
                setForgotPasswordVisible(false);
                forgotPasswordForm.resetFields();
              }}>
                Отказ
              </Button>,
              <Button 
                key="submit" 
                type="primary" 
                loading={forgotPasswordLoading}
                onClick={() => forgotPasswordForm.submit()}
              >
                Изпрати
              </Button>,
            ]}
          >
            <Form 
              form={forgotPasswordForm} 
              layout="vertical" 
              onFinish={handleForgotPassword}
              style={{ marginTop: 24 }}
            >
              <Form.Item
                label="Имейл"
                name="email"
                rules={[
                  { required: true, message: 'Имейлът е задължителен' },
                  { type: 'email', message: 'Въведете валиден имейл' },
                ]}
              >
                <Input 
                  placeholder="user@example.com"
                  prefix={<LockOutlined />}
                />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Линкът за възстановяване на парола ще бъде изпратен по указания имейл адрес.
              </Text>
            </Form>
          </Modal>
        </Card>
      </StyledCard>
    </LoginContainer>
  );
}
