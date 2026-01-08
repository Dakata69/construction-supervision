import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message, Spin, Alert } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { api } from '../api/client';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;

  h1 {
    font-size: 28px;
    font-weight: bold;
    margin: 0 0 8px 0;
    color: #1890ff;
  }

  p {
    color: rgba(0, 0, 0, 0.65);
    margin: 0;
  }
`;

const SuccessContainer = styled.div`
  text-align: center;
  padding: 40px 20px;
`;

const SuccessIcon = styled(CheckCircleOutlined)`
  font-size: 64px;
  color: #52c41a;
  margin-bottom: 16px;
`;

const PasswordReset: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMessage('No password reset token provided');
      setLoading(false);
      return;
    }

    // Validate token
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await api.get(`/auth/validate-reset-token/?token=${token}`);
      if (response.data.valid) {
        setTokenValid(true);
        setErrorMessage('');
      } else {
        setErrorMessage(response.data.message || 'Invalid or expired password reset token');
        setTokenValid(false);
      }
    } catch (error) {
      setErrorMessage('Failed to validate password reset token');
      setTokenValid(false);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setValidating(true);
    try {
      const response = await api.post('/auth/reset-password/', {
        token: token,
        password: values.password,
        password_confirm: values.passwordConfirm,
      });

      setSuccess(true);
      message.success('Password has been reset successfully!');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.password?.[0] ||
                      'Failed to reset password. Please try again.';
      message.error(errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Spin size="large" />
      </Container>
    );
  }

  if (success) {
    return (
      <Container>
        <StyledCard>
          <SuccessContainer>
            <SuccessIcon />
            <h2>Password Reset Successful</h2>
            <p>Your password has been changed successfully.</p>
            <p>Redirecting to login...</p>
          </SuccessContainer>
        </StyledCard>
      </Container>
    );
  }

  if (!tokenValid) {
    return (
      <Container>
        <StyledCard>
          <Header>
            <h1>Reset Password</h1>
            <p>Invalid or Expired Link</p>
          </Header>
          <Alert
            message="Error"
            description={errorMessage || 'This password reset link is invalid or has expired.'}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            block
            onClick={() => navigate('/login')}
          >
            Back to Login
          </Button>
        </StyledCard>
      </Container>
    );
  }

  return (
    <Container>
      <StyledCard>
        <Header>
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </Header>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="New Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your new password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="passwordConfirm"
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm your password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={validating}
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </StyledCard>
    </Container>
  );
};

export default PasswordReset;
