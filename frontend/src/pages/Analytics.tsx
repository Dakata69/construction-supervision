import React from 'react';
import { Card, Row, Col, Statistic, Table, Progress, Tag, Spin } from 'antd';
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useAnalyticsDashboard } from '../api/hooks/useFeatures';
import dayjs from 'dayjs';
import 'dayjs/locale/bg';

dayjs.locale('bg');

const Analytics: React.FC = () => {
  const { data, isLoading } = useAnalyticsDashboard();

  if (isLoading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const columns = [
    {
      title: 'Проект',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Създаден',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
    },
    {
      title: 'Краен срок',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string | null) =>
        date ? dayjs(date).format('DD.MM.YYYY') : 'Не е указан',
    },
  ];

  const expenseColumns = [
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Обща сума',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `${total.toFixed(2)} лв.`,
    },
    {
      title: 'Процент',
      key: 'percentage',
      render: (_: any, record: any) => {
        const percentage = data.budget.total_spent > 0
          ? (record.total / data.budget.total_spent) * 100
          : 0;
        return (
          <Progress
            percent={Math.round(percentage)}
            size="small"
            status={percentage > 50 ? 'exception' : 'active'}
          />
        );
      },
    },
  ];

  const budgetUsagePercent = data.budget.total_budget > 0
    ? (data.budget.total_spent / data.budget.total_budget) * 100
    : 0;

  return (
    <div style={{ padding: '24px' }}>
      <h1>Аналитична табло</h1>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Общо проекти"
              value={data.projects.total}
              prefix={<ProjectOutlined />}
              suffix={
                <Tag color="blue" style={{ marginLeft: '8px' }}>
                  {data.projects.active} активни
                </Tag>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Задачи"
              value={data.tasks.completed}
              prefix={<CheckCircleOutlined />}
              suffix={`/ ${data.tasks.total}`}
            />
            <Progress
              percent={Math.round(data.tasks.completion_rate)}
              status={data.tasks.completion_rate > 75 ? 'success' : 'active'}
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Просрочени задачи"
              value={data.tasks.overdue}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: data.tasks.overdue > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Бюджет"
              value={data.budget.total_spent}
              prefix={<DollarOutlined />}
              suffix={`/ ${data.budget.total_budget.toFixed(0)} лв.`}
              precision={2}
            />
            <Progress
              percent={Math.round(budgetUsagePercent)}
              status={budgetUsagePercent > 100 ? 'exception' : budgetUsagePercent > 80 ? 'normal' : 'success'}
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Budget Warning */}
      {data.budget.over_budget_projects > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={24}>
            <Card style={{ background: '#fff2e8', borderColor: '#ffbb96' }}>
              <Statistic
                title="Проекти с надвишен бюджет"
                value={data.budget.over_budget_projects}
                prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Charts and Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Последни проекти">
            <Table
              dataSource={data.projects.recent}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Топ категории разходи">
            <Table
              dataSource={data.top_expense_categories}
              columns={expenseColumns}
              rowKey="category"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Budget Summary */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="Обща бюджетна информация">
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Общ бюджет"
                  value={data.budget.total_budget}
                  precision={2}
                  suffix="лв."
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Изразходвано"
                  value={data.budget.total_spent}
                  precision={2}
                  suffix="лв."
                  valueStyle={{ color: budgetUsagePercent > 100 ? '#cf1322' : '#3f8600' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Остатък"
                  value={data.budget.remaining}
                  precision={2}
                  suffix="лв."
                  valueStyle={{ color: data.budget.remaining < 0 ? '#cf1322' : '#3f8600' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
