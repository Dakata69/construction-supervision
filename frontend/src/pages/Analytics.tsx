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

// Localized labels for expense categories
const CATEGORY_LABELS: Record<string, string> = {
  materials: 'Материали',
  labor: 'Работна сила',
  equipment: 'Оборудване',
  subcontractors: 'Подизпълнители',
  permits: 'Разрешителни',
  transport: 'Транспорт',
  utilities: 'Комунални услуги',
  insurance: 'Застраховка',
  other: 'Други',
};

const Analytics: React.FC = () => {
  const { data, isLoading } = useAnalyticsDashboard();
  const getCurrencySymbol = (code?: string) => {
    switch (code) {
      case 'EUR':
        return 'EUR (€)';
      case 'BGN':
      default:
        return 'BGN (лв.)';
    }
  };

  // Exchange rate: 1 EUR = 1.96 BGN (approximate)
  const EUR_TO_BGN_RATE = 1.96;

  const convertToEUR = (amountBGN: number): number => {
    return amountBGN / EUR_TO_BGN_RATE;
  };

  const convertToBGN = (amountEUR: number): number => {
    return amountEUR * EUR_TO_BGN_RATE;
  };

  const formatDualCurrency = (amount: number, curr: string = 'BGN'): string => {
    if (curr === 'EUR') {
      // Amount is in EUR, show EUR first, then BGN
      const bgn = convertToBGN(amount).toFixed(2);
      return `${amount.toFixed(2)} € / ${bgn} лв.`;
    } else {
      // Amount is in BGN (default), show EUR first, then BGN
      const eur = convertToEUR(amount).toFixed(2);
      return `${eur} € / ${amount.toFixed(2)} лв.`;
    }
  };

  if (isLoading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const currency = (data as any).budget?.currency || 'BGN';

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
      render: (category: string) => CATEGORY_LABELS[category] ?? category,
    },
    {
      title: 'Обща сума',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => formatDualCurrency(total, currency),
    },
    {
      title: 'Процент',
      width: 220,
      key: 'percentage',
      render: (_: any, record: any) => {
        // Calculate category percentage relative to total budget (not total spent)
        const denominator = data.budget.total_budget;
        const percentage = denominator > 0
          ? (record.total / denominator) * 100
          : 0;
        const rounded = Math.round(percentage);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <span style={{ minWidth: 46, fontVariantNumeric: 'tabular-nums' }}>{rounded}%</span>
            <Progress
              percent={rounded}
              size="small"
              style={{ flex: 1, minWidth: 140, marginBottom: 0 }}
              status={percentage > 90 ? 'exception' : percentage > 60 ? 'normal' : 'success'}
              strokeColor={percentage > 90 ? '#cf1322' : percentage > 60 ? '#faad14' : '#52c41a'}
            />
          </div>
        );
      },
    },
  ];

  const budgetUsagePercent = data.budget.total_budget > 0
    ? (data.budget.total_spent / data.budget.total_budget) * 100
    : 0;

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ margin: 0, marginBottom: '24px' }}>Аналитично табло</h1>

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
              value={formatDualCurrency(data.budget.total_spent, currency)}
              prefix={<DollarOutlined />}
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
                  value={formatDualCurrency(data.budget.total_budget, currency)}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Изразходвано"
                  value={formatDualCurrency(data.budget.total_spent, currency)}
                  valueStyle={{ color: budgetUsagePercent > 100 ? '#cf1322' : '#3f8600' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Остатък"
                  value={formatDualCurrency(data.budget.remaining, currency)}
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
