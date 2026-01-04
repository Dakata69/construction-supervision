import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Table,
  Tag,
  Space,
  Statistic,
  Progress,
  message,
} from 'antd';
import {
  PlusOutlined,
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useProjectBudget, useCreateBudget, useCreateExpense, useExpenses } from '../api/hooks/useFeatures';
import dayjs from 'dayjs';
import 'dayjs/locale/bg';

dayjs.locale('bg');

interface BudgetTrackingProps {
  projectId: number;
}

const EXPENSE_CATEGORIES = [
  { value: 'materials', label: 'Материали' },
  { value: 'labor', label: 'Работна сила' },
  { value: 'equipment', label: 'Оборудване' },
  { value: 'subcontractor', label: 'Подизпълнители' },
  { value: 'permits', label: 'Разрешителни' },
  { value: 'transport', label: 'Транспорт' },
  { value: 'utilities', label: 'Комунални услуги' },
  { value: 'insurance', label: 'Застраховка' },
  { value: 'other', label: 'Други' },
];

const BudgetTracking: React.FC<BudgetTrackingProps> = ({ projectId }) => {
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [budgetForm] = Form.useForm();
  const [expenseForm] = Form.useForm();

  const { data: budget, isLoading } = useProjectBudget(projectId);
  const { data: expenses = [] } = useExpenses(budget?.id, projectId);
  const createBudget = useCreateBudget();
  const createExpense = useCreateExpense();

  const handleCreateBudget = async (values: any) => {
    try {
      await createBudget.mutateAsync({
        project: projectId,
        ...values,
      });
      message.success('Бюджетът е създаден успешно');
      setBudgetModalOpen(false);
      budgetForm.resetFields();
    } catch (error) {
      message.error('Грешка при създаване на бюджет');
    }
  };

  const handleCreateExpense = async (values: any) => {
    if (!budget?.id) {
      message.error('Моля, създайте бюджет първо');
      return;
    }

    try {
      await createExpense.mutateAsync({
        budget: budget.id,
        date: values.date.format('YYYY-MM-DD'),
        ...values,
      });
      message.success('Разходът е добавен успешно');
      setExpenseModalOpen(false);
      expenseForm.resetFields();
    } catch (error) {
      message.error('Грешка при добавяне на разход');
    }
  };

  const expenseColumns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
      sorter: (a: any, b: any) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Категория',
      dataIndex: 'category_display',
      key: 'category',
      filters: EXPENSE_CATEGORIES.map(cat => ({ text: cat.label, value: cat.value })),
      onFilter: (value: any, record: any) => record.category === value,
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Доставчик',
      dataIndex: 'vendor',
      key: 'vendor',
    },
    {
      title: 'Фактура №',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
    },
    {
      title: 'Сума',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string) => `${parseFloat(amount).toFixed(2)} лв.`,
      sorter: (a: any, b: any) => parseFloat(a.amount) - parseFloat(b.amount),
    },
    {
      title: 'Добавен от',
      dataIndex: 'created_by_name',
      key: 'created_by',
    },
  ];

  if (isLoading) {
    return <div>Зареждане...</div>;
  }

  const budgetUsagePercent = budget?.budget_usage_percentage || 0;

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        {/* Budget Overview */}
        {budget ? (
          <>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Планиран бюджет"
                  value={parseFloat(budget.initial_budget)}
                  precision={2}
                  suffix={budget.currency}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Изразходвано"
                  value={parseFloat(budget.total_expenses)}
                  precision={2}
                  suffix={budget.currency}
                  valueStyle={{ color: budget.is_over_budget ? '#cf1322' : '#3f8600' }}
                  prefix={budget.is_over_budget ? <WarningOutlined /> : <CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Остатък"
                  value={parseFloat(budget.remaining_budget)}
                  precision={2}
                  suffix={budget.currency}
                  valueStyle={{ color: parseFloat(budget.remaining_budget) < 0 ? '#cf1322' : '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card>
                <div style={{ marginBottom: '16px' }}>
                  <strong>Използване на бюджета:</strong>
                  {budget.is_over_budget && (
                    <Tag color="error" style={{ marginLeft: '8px' }}>
                      Надвишен бюджет!
                    </Tag>
                  )}
                </div>
                <Progress
                  percent={Math.round(budgetUsagePercent)}
                  status={budget.is_over_budget ? 'exception' : budgetUsagePercent > 80 ? 'normal' : 'success'}
                  strokeColor={budget.is_over_budget ? '#ff4d4f' : budgetUsagePercent > 80 ? '#faad14' : '#52c41a'}
                />
                {budget.notes && (
                  <div style={{ marginTop: '16px' }}>
                    <strong>Бележки:</strong> {budget.notes}
                  </div>
                )}
              </Card>
            </Col>
          </>
        ) : (
          <Col span={24}>
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: '16px', marginBottom: '16px' }}>
                  Няма създаден бюджет за този проект
                </p>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setBudgetModalOpen(true)}>
                  Създай бюджет
                </Button>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* Expenses Table */}
      {budget && (
        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Card
              title="Разходи"
              extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setExpenseModalOpen(true)}>
                  Добави разход
                </Button>
              }
            >
              <Table
                dataSource={expenses}
                columns={expenseColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Create Budget Modal */}
      <Modal
        title="Създай бюджет"
        open={budgetModalOpen}
        onCancel={() => {
          setBudgetModalOpen(false);
          budgetForm.resetFields();
        }}
        onOk={() => budgetForm.submit()}
        confirmLoading={createBudget.isPending}
      >
        <Form form={budgetForm} layout="vertical" onFinish={handleCreateBudget}>
          <Form.Item
            label="Планиран бюджет"
            name="initial_budget"
            rules={[{ required: true, message: 'Моля, въведете бюджет' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              addonAfter="лв."
            />
          </Form.Item>
          <Form.Item label="Валута" name="currency" initialValue="BGN">
            <Select>
              <Select.Option value="BGN">BGN (лв.)</Select.Option>
              <Select.Option value="EUR">EUR (€)</Select.Option>
              <Select.Option value="USD">USD ($)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Бележки" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Expense Modal */}
      <Modal
        title="Добави разход"
        open={expenseModalOpen}
        onCancel={() => {
          setExpenseModalOpen(false);
          expenseForm.resetFields();
        }}
        onOk={() => expenseForm.submit()}
        confirmLoading={createExpense.isPending}
        width={600}
      >
        <Form form={expenseForm} layout="vertical" onFinish={handleCreateExpense}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Категория"
                name="category"
                rules={[{ required: true, message: 'Изберете категория' }]}
              >
                <Select options={EXPENSE_CATEGORIES} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Дата"
                name="date"
                rules={[{ required: true, message: 'Изберете дата' }]}
                initialValue={dayjs()}
              >
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Описание"
            name="description"
            rules={[{ required: true, message: 'Въведете описание' }]}
          >
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Доставчик" name="vendor">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Фактура №" name="invoice_number">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Сума"
            name="amount"
            rules={[{ required: true, message: 'Въведете сума' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              addonAfter="лв."
            />
          </Form.Item>
          <Form.Item label="Допълнителни бележки" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BudgetTracking;
