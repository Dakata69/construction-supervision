import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Space,
  message,
  Modal,
  Select,
  Row,
  Col,
  Tag,
  Spin,
  Alert,
} from 'antd';
import { PlusOutlined, MailOutlined, LockOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '../api/client';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const UserManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/user-management/');
      setUsers(response.data.results || response.data);
    } catch (error) {
      message.error('Грешка при зареждане на потребителите');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (values: any) => {
    setSubmitting(true);
    try {
      const response = await api.post('/auth/create-user/', values);
      message.success('Потребителят е създаден! Данните за вход са изпратени по имейл.');
      form.resetFields();
      setModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.username?.[0] ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.error ||
        'Неуспешно създаване на потребител';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCredentials = async (userId: number) => {
    Modal.confirm({
      title: 'Изпрати отново данни за вход',
      content: 'Да изпратим ли имейл с данните за вход?',
      okText: 'Да',
      cancelText: 'Не',
      onOk: async () => {
        try {
          await api.post(`/user-management/${userId}/resend_credentials/`);
          message.success('Имейлът с данните за вход е изпратен отново');
        } catch (error) {
          message.error('Неуспешно изпращане на данните за вход');
        }
      },
    });
  };

  const handleResetPassword = async (userId: number) => {
    Modal.confirm({
      title: 'Нулирай парола',
      content: 'Да изпратим ли линк за нулиране на паролата?',
      okText: 'Да',
      cancelText: 'Не',
      onOk: async () => {
        try {
          await api.post(`/user-management/${userId}/reset_user_password/`);
          message.success('Линкът за нулиране на парола е изпратен');
        } catch (error) {
          message.error('Неуспешно изпращане на линк за нулиране');
        }
      },
    });
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    Modal.confirm({
      title: 'Изтриване на потребител',
      content: `Сигурни ли сте, че искате окончателно да изтриете "${username}"? Действието е необратимо и потребителят няма да може да влиза повече в системата.`,
      okText: 'Изтрий',
      okType: 'danger',
      cancelText: 'Отказ',
      onOk: async () => {
        try {
          await api.delete(`/user-management/${userId}/`);
          message.success(`Потребителят ${username} бе изтрит`);
          fetchUsers();
        } catch (error) {
          message.error('Неуспешно изтриване на потребител');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Потребителско име',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Имейл',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Име',
      key: 'name',
      render: (_: any, record: any) =>
        `${record.first_name} ${record.last_name}`.trim() || '-',
    },
    {
      title: 'Роля',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colors: Record<string, string> = {
          admin: 'red',
          privileged: 'blue',
          viewer: 'default',
        };
        const labels: Record<string, string> = {
          admin: 'Админ',
          privileged: 'Привилегирован',
          viewer: 'Наблюдател',
        };
        return <Tag color={colors[role]}>{labels[role] || 'Привилегирован'}</Tag>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<MailOutlined />}
            onClick={() => handleResendCredentials(record.id)}
          >
            Изпрати отново
          </Button>
          <Button
            type="link"
            size="small"
            icon={<LockOutlined />}
            onClick={() => handleResetPassword(record.id)}
          >
            Нулирай парола
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record.id, record.username)}
          >
            Изтрий
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title="Управление на потребители"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalOpen(true)}
              >
                Създай потребител
              </Button>
            }
          >
            <Alert
              message="Създайте потребители и им изпратете данни за вход"
              description="Новите потребители получават потребителско име, временна парола и линк за задаване на собствена парола."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Създай нов потребител"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateUser}
          autoComplete="off"
        >
          <Form.Item
            label="Потребителско име"
            name="username"
            rules={[
              { required: true, message: 'Потребителското име е задължително' },
              {
                pattern: /^[a-zA-Z0-9_.-]+$/,
                message: 'Позволени са букви, цифри, точка, долна черта и тире',
              },
            ]}
          >
            <Input placeholder="напр. ivan.ivanov" />
          </Form.Item>

          <Form.Item
            label="Имейл"
            name="email"
            rules={[
              { required: true, message: 'Имейлът е задължителен' },
              { type: 'email', message: 'Въведете валиден имейл' },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Form.Item
            label="Име"
            name="first_name"
            rules={[{ required: true, message: 'Името е задължително' }]}
          >
            <Input placeholder="Иван" />
          </Form.Item>

          <Form.Item
            label="Фамилия"
            name="last_name"
            rules={[{ required: true, message: 'Фамилията е задължителна' }]}
          >
            <Input placeholder="Иванов" />
          </Form.Item>

          <Form.Item
            label="Роля"
            name="role"
            initialValue="privileged"
            rules={[{ required: true, message: 'Ролята е задължителна' }]}
          >
            <Select>
              <Select.Option value="privileged">
                Привилегирован (може да редактира)
              </Select.Option>
              <Select.Option value="admin">Админ</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserManagement;
