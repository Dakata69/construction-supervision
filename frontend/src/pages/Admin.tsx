import React, { useState } from 'react';
import { Tabs, Card, Row, Col, Statistic, List, Space, Typography, Spin } from 'antd';
import { TeamOutlined, ProjectOutlined, FileOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import UserManagement from './UserManagement';
import { useRecentActivities, useUpcomingTasks } from '../api/hooks/useActivityLogs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/bg';

dayjs.extend(relativeTime);
dayjs.locale('bg');

const { Text } = Typography;

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Admin: React.FC = () => {
  const [activeKey, setActiveKey] = useState('overview');
  
  // Fetch real data
  const { data: recentActivities, isLoading: activitiesLoading } = useRecentActivities(5);
  const { data: upcomingTasks, isLoading: tasksLoading } = useUpcomingTasks(5, 30);

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <ProjectOutlined />
          Преглед
        </span>
      ),
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: '24px' }}>
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
                  value={3}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
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
                          title={task.title}
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
        </div>
      ),
    },
    {
      key: 'users',
      label: (
        <span>
          <TeamOutlined />
          Управление на потребители
        </span>
      ),
      children: <UserManagement />,
    },
  ];

  return (
    <PageContainer>
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        items={tabItems}
        size="large"
        style={{ background: '#fff', padding: '20px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        tabBarStyle={{ fontSize: '16px' }}
      />
    </PageContainer>
  );
};

export default Admin;