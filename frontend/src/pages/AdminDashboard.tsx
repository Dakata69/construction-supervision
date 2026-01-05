import { Card, Row, Col, Statistic, Button, Modal, message, Space, Typography, Select, List, Tag, Spin } from 'antd';
import { UserOutlined, ProjectOutlined, FileOutlined, UserAddOutlined, CopyOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { api } from '../api/client';
import { useRecentActivities, useUpcomingTasks } from '../api/hooks/useActivityLogs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/bg';

dayjs.extend(relativeTime);
dayjs.locale('bg');

const { Text, Paragraph } = Typography;

export default function AdminDashboard() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState('privileged');
  
  // Fetch real data
  const { data: recentActivities, isLoading: activitiesLoading } = useRecentActivities(5);
  const { data: upcomingTasks, isLoading: tasksLoading } = useUpcomingTasks(5, 30);

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      const response = await api.post('/users/create-privileged/', {
        role: selectedRole
      });
      setCredentials(response.data);
      message.success('Потребителят е създаден успешно!');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Грешка при създаване на потребител');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label} копирано`);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setCredentials(null);
    setSelectedRole('privileged');
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'rgba(0, 0, 0, 0.85)' }}>Административен панел</h1>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => setIsModalVisible(true)}
          size="large"
        >
          Създай привилегирован потребител
        </Button>
      </div>
      
      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Активни проекти"
              value={5}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Документи"
              value={12}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Потребители"
              value={8}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={12}>
          <Card 
            title="Последни действия" 
            extra={activitiesLoading && <Spin size="small" />}
          >
            {activitiesLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin />
              </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              <List
                dataSource={recentActivities}
                renderItem={(activity) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />}
                      title={activity.description}
                      description={
                        <Space>
                          <Text type="secondary">{activity.username || 'Система'}</Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">
                            {dayjs(activity.created_at).fromNow()}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">Няма налични действия</Text>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title="Предстоящи задачи" 
            extra={tasksLoading && <Spin size="small" />}
          >
            {tasksLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin />
              </div>
            ) : upcomingTasks && upcomingTasks.length > 0 ? (
              <List
                dataSource={upcomingTasks}
                renderItem={(task) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<ClockCircleOutlined style={{ color: '#1890ff', fontSize: 16 }} />}
                      title={
                        <Space>
                          {task.title}
                          {task.priority === 'urgent' && <Tag color="red">Спешно</Tag>}
                          {task.priority === 'high' && <Tag color="orange">Високо</Tag>}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          {task.description && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {task.description}
                            </Text>
                          )}
                          <Space>
                            {task.assigned_to_name && (
                              <>
                                <Text type="secondary">Възложена на: {task.assigned_to_name}</Text>
                                <Text type="secondary">•</Text>
                              </>
                            )}
                            <Text type="secondary">
                              Краен срок: {dayjs(task.due_date).fromNow()}
                            </Text>
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">Няма предстоящи задачи</Text>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="Създай нов потребител"
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        {!credentials ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Изберете роля:</Text>
              <Select
                value={selectedRole}
                onChange={setSelectedRole}
                style={{ width: '100%', marginTop: 8 }}
              >
                <Select.Option value="privileged">Привилегирован - Може да вижда всички проекти (без редакция)</Select.Option>
                <Select.Option value="admin">Администратор - Пълен достъп (служител)</Select.Option>
              </Select>
            </div>
            <Button
              type="primary"
              onClick={handleCreateUser}
              loading={loading}
              block
              size="large"
              style={{ marginTop: 16 }}
            >
              Генерирай потребител
            </Button>
          </div>
        ) : (
          <div>
            <Card
              style={{
                background: '#f0f2f5',
                border: '2px solid #52c41a',
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <Text strong style={{ fontSize: 16 }}>✅ Потребителят е създаден успешно!</Text>
                </div>

                <div>
                  <Text strong>Потребителско име:</Text>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <Text
                      code
                      copyable={{ text: credentials.username }}
                      style={{ fontSize: 16, flex: 1 }}
                    >
                      {credentials.username}
                    </Text>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(credentials.username, 'Потребителско име')}
                    >
                      Копирай
                    </Button>
                  </div>
                </div>

                <div>
                  <Text strong>Парола:</Text>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <Text
                      code
                      copyable={{ text: credentials.password }}
                      style={{ fontSize: 16, flex: 1, wordBreak: 'break-all' }}
                    >
                      {credentials.password}
                    </Text>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(credentials.password, 'Парола')}
                    >
                      Копирай
                    </Button>
                  </div>
                </div>

                <div>
                  <Text strong>Роля:</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text code style={{ fontSize: 16 }}>
                      {credentials.role === 'privileged' && 'Привилегирован'}
                      {credentials.role === 'employee' && 'Служител'}
                      {credentials.role === 'client' && 'Клиент'}
                      {credentials.role === 'admin' && 'Администратор'}
                    </Text>
                  </div>
                </div>

                <Paragraph type="warning" style={{ margin: 0 }}>
                  ⚠️ Запазете тези данни! Паролата не може да бъде възстановена.
                </Paragraph>
              </Space>
            </Card>

            <Button
              type="primary"
              onClick={handleCloseModal}
              block
              size="large"
              style={{ marginTop: 16 }}
            >
              Готово
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
