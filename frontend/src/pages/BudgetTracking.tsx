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
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useProjectBudget, useCreateBudget, useUpdateBudget, useCreateExpense, useUpdateExpense, useDeleteExpense, useExpenses } from '../api/hooks/useFeatures';
import { useQueryClient } from '@tanstack/react-query';
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
  { value: 'subcontractors', label: 'Подизпълнители' },
  { value: 'permits', label: 'Разрешителни' },
  { value: 'transport', label: 'Транспорт' },
  { value: 'utilities', label: 'Комунални услуги' },
  { value: 'insurance', label: 'Застраховка' },
  { value: 'other', label: 'Други' },
];

const BudgetTracking: React.FC<BudgetTrackingProps> = ({ projectId }) => {
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [budgetForm] = Form.useForm();
  const [expenseForm] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: budget, isLoading } = useProjectBudget(projectId);
  const { data: expenses = [] } = useExpenses(budget?.id, projectId);
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

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

  const formatDualCurrency = (amount: string | number, currency: string = 'BGN'): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (currency === 'EUR') {
      // Amount is in EUR, show EUR first, then BGN
      const bgn = convertToBGN(num).toFixed(2);
      return `${num.toFixed(2)} € / ${bgn} лв.`;
    } else {
      // Amount is in BGN (default), show EUR first, then BGN
      const eur = convertToEUR(num).toFixed(2);
      return `${eur} € / ${num.toFixed(2)} лв.`;
    }
  };

  const handleCreateBudget = async (values: any) => {
    try {
      if (budget?.id) {
        await updateBudget.mutateAsync({ id: budget.id, data: values });
        message.success('Бюджетът е обновен успешно');
      } else {
        await createBudget.mutateAsync({
          project: projectId,
          ...values,
        });
        message.success('Бюджетът е създаден успешно');
      }
      // Ensure UI refreshes with the latest values
      await queryClient.invalidateQueries({ queryKey: ['budgets'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false });
      // Wait for data to reload
      await queryClient.refetchQueries({ queryKey: ['budgets', 'project', projectId] });
      setBudgetModalOpen(false);
      budgetForm.resetFields();
    } catch (error: any) {
      const data = error?.response?.data;
      const detail: string | undefined = data?.detail;
      const projectErr: string | string[] | undefined = data?.project;
      if (projectErr) {
        const msg = Array.isArray(projectErr) ? projectErr[0] : projectErr;
        message.error(msg || 'Грешка при създаване на бюджет');
      } else if (detail) {
        // Common cases: authentication required or generic error
        if (/credentials|authenticated|authorization|permission/i.test(detail)) {
          message.error('Необходим е вход в системата');
        } else {
          message.error(detail);
        }
      } else {
        message.error('Грешка: неуспешно записване на бюджета');
      }
    }
  };

  const handleCreateExpense = async (values: any) => {
    if (!budget?.id) {
      message.error('Моля, създайте бюджет първо');
      return;
    }

    try {
      // Client-side guard against exceeding budget
      const amountNum = Number(values.amount);
      const remainingNum = Number(budget.remaining_budget);
      if (!editingExpenseId && remainingNum <= 0) {
        message.error('Достигнат е лимитът на бюджета');
        return;
      }
      if (!editingExpenseId && amountNum > remainingNum) {
        message.error('Достигнат е лимитът на бюджета');
        return;
      }

      const { date, ...otherValues } = values;
      const expenseData = {
        budget: budget.id,
        date: date.format('YYYY-MM-DD'),
        ...otherValues,
      };

      if (editingExpenseId) {
        await updateExpense.mutateAsync({
          id: editingExpenseId,
          data: expenseData,
        });
        message.success('Разходът е обновен успешно');
      } else {
        await createExpense.mutateAsync(expenseData);
        message.success('Разходът е добавен успешно');
      }
      // Ensure totals refresh immediately
      await queryClient.invalidateQueries({ queryKey: ['budgets'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['budgets', 'project', projectId] });
      await queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false });
      
      setExpenseModalOpen(false);
      setEditingExpenseId(null);
      expenseForm.resetFields();
    } catch (error: any) {
      console.error('Error details:', error.response?.data);
      const backendMsg = error.response?.data?.detail as string | undefined;
      if (backendMsg && /budget|over/i.test(backendMsg)) {
        message.error('Достигнат е лимитът на бюджета');
      } else {
        message.error('Грешка: неуспешно добавяне на разход');
      }
    }
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpenseId(expense.id);
    expenseForm.setFieldsValue({
      category: expense.category,
      date: dayjs(expense.date),
      description: expense.description,
      vendor: expense.vendor,
      invoice_number: expense.invoice_number,
      amount: parseFloat(expense.amount),
      expense_currency: expense.expense_currency || 'BGN',
      notes: expense.notes,
    });
    setExpenseModalOpen(true);
  };

  const handleDeleteExpense = (id: number) => {
    Modal.confirm({
      title: 'Изтрий разход',
      content: 'Сигурен ли си, че искаш да изтриеш този разход?',
      okText: 'Да, изтрий',
      cancelText: 'Отказ',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteExpense.mutateAsync(id);
          message.success('Разходът е изтрит успешно');
          await queryClient.invalidateQueries({ queryKey: ['budgets'], exact: false });
          await queryClient.refetchQueries({ queryKey: ['budgets', 'project', projectId] });
          await queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false });
        } catch (error) {
          message.error('Грешка при изтриване на разход');
        }
      },
    });
  };

  const handleCloseModal = () => {
    setExpenseModalOpen(false);
    setEditingExpenseId(null);
    expenseForm.resetFields();
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
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
        return cat?.label || category;
      },
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
      render: (amount: string, record: any) => formatDualCurrency(amount, record.expense_currency || 'BGN'),
      sorter: (a: any, b: any) => parseFloat(a.amount) - parseFloat(b.amount),
    },
    {
      title: 'Добавен от',
      dataIndex: 'created_by_name',
      key: 'created_by',
    },
    {
      title: 'Промени',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditExpense(record)}
          >
            Редактирай
          </Button>
          <Button 
            type="link" 
            danger 
            size="small" 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteExpense(record.id)}
          >
            Изтрий
          </Button>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return <div>Зареждане...</div>;
  }

  const budgetUsagePercent = budget?.budget_usage_percentage || 0;
  const roundedBudgetUsage = Math.round(budgetUsagePercent);

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
                  value={formatDualCurrency(budget.initial_budget, budget.currency)}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Изразходвано"
                  value={formatDualCurrency(budget.total_expenses, budget.currency)}
                  valueStyle={{ color: budget.is_over_budget ? '#cf1322' : '#3f8600' }}
                  prefix={budget.is_over_budget ? <WarningOutlined /> : <CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Остатък"
                  value={formatDualCurrency(budget.remaining_budget, budget.currency)}
                  valueStyle={{ color: parseFloat(budget.remaining_budget) < 0 ? '#cf1322' : '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <strong>Използване на бюджета:</strong>
                    {budget.is_over_budget && (
                      <Tag color="error" style={{ marginLeft: '8px' }}>
                        Надвишен бюджет!
                      </Tag>
                    )}
                  </div>
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => {
                      budgetForm.setFieldsValue({
                        initial_budget: parseFloat(budget.initial_budget),
                        currency: budget.currency,
                        notes: budget.notes || '',
                      });
                      setBudgetModalOpen(true);
                    }}
                  >
                    Промени бюджет
                  </Button>
                </div>
                <Progress
                  percent={roundedBudgetUsage}
                  showInfo
                  format={() => `${roundedBudgetUsage}%`}
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
        title={budget ? 'Промени бюджет' : 'Създай бюджет'}
        open={budgetModalOpen}
        onCancel={() => {
          setBudgetModalOpen(false);
          budgetForm.resetFields();
        }}
        onOk={() => budgetForm.submit()}
        confirmLoading={budget ? updateBudget.isPending : createBudget.isPending}
      >
        <Form form={budgetForm} layout="vertical" onFinish={handleCreateBudget}>
          <Form.Item label="Валута" name="currency" initialValue="BGN">
            <Select>
              <Select.Option value="BGN">BGN (лв.)</Select.Option>
              <Select.Option value="EUR">EUR (€)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.currency !== curr.currency}>
            {({ getFieldValue }) => (
              <Form.Item
                label="Планиран бюджет"
                name="initial_budget"
                rules={[{ required: true, message: 'Моля, въведете бюджет' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  addonAfter={getCurrencySymbol(getFieldValue('currency') || 'BGN')}
                />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item label="Бележки" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Expense Modal */}
      <Modal
        title={editingExpenseId ? 'Редактирай разход' : 'Добави разход'}
        open={expenseModalOpen}
        onCancel={handleCloseModal}
        onOk={() => expenseForm.submit()}
        confirmLoading={editingExpenseId ? updateExpense.isPending : createExpense.isPending}
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
            // Optional description
            rules={[]}
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
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label="Сума"
                name="amount"
                rules={[{ required: true, message: 'Въведете сума' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Валута"
                name="expense_currency"
                initialValue="BGN"
              >
                <Select>
                  <Select.Option value="BGN">BGN (лв.)</Select.Option>
                  <Select.Option value="EUR">EUR (€)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Допълнителни бележки" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BudgetTracking;
