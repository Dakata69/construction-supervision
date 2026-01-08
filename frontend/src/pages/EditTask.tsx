import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, DatePicker, message, Card, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import dayjs from 'dayjs';

const { TextArea } = Input;

const EditTask: React.FC = () => {
  const navigate = useNavigate();
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<any>(null);

  useEffect(() => {
    if (!taskId) return;
    // Fetch task details
    api.get(`tasks/${taskId}/`)
      .then(res => {
        setTask(res.data);
        form.setFieldsValue({
          title: res.data.title,
          description: res.data.description || '',
          status: res.data.status,
          priority: res.data.priority,
          assigned_to: res.data.assigned_to || undefined,
          due_date: res.data.due_date ? dayjs(res.data.due_date) : undefined,
        });
      })
      .catch(err => {
        console.error('Error fetching task:', err);
        message.error('Грешка при зареждане на задачата');
      })
      .finally(() => setLoading(false));
  }, [taskId, form]);

  const handleSubmit = async (values: any) => {
    try {
      const taskData = {
        title: values.title,
        description: values.description || '',
        status: values.status || 'pending',
        priority: values.priority || 'medium',
        assigned_to_name: values.assigned_to || '',
        due_date: values.due_date ? values.due_date.endOf('day').toISOString() : null,
      };

      await api.patch(`tasks/${taskId}/`, taskData);
      message.success('Задачата е актуализирана успешно!');
      navigate(`/projects/${projectId}`);
    } catch (error: any) {
      console.error('Error updating task:', error);
      const errorMessage = error.response?.data?.message || 'Възникна грешка при актуализиране на задачата';
      message.error(errorMessage);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>Зареждане...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Редактирай задача</h2>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Заглавие"
            name="title"
            rules={[{ required: true, message: 'Моля въведете заглавие на задачата' }]}
          >
            <Input placeholder="Напр. Подготовка на документация" />
          </Form.Item>

          <Form.Item
            label="Описание"
            name="description"
          >
            <TextArea rows={4} placeholder="Детайли за задачата..." />
          </Form.Item>

          <Form.Item
            label="Статус"
            name="status"
            initialValue="pending"
          >
            <Select>
              <Select.Option value="pending">За изпълнение</Select.Option>
              <Select.Option value="in_progress">В процес</Select.Option>
              <Select.Option value="completed">Завършена</Select.Option>
              <Select.Option value="blocked">Блокирана</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Приоритет"
            name="priority"
            initialValue="medium"
          >
            <Select>
              <Select.Option value="low">Нисък</Select.Option>
              <Select.Option value="medium">Среден</Select.Option>
              <Select.Option value="high">Висок</Select.Option>
              <Select.Option value="urgent">Спешен</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Изпълнител"
            name="assigned_to"
          >
            <Input
              placeholder="Въведете име на потребител"
            />
          </Form.Item>

          <Form.Item
            label="Краен срок"
            name="due_date"
          >
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Обнови задача
              </Button>
              <Button onClick={() => navigate(`/projects/${projectId}`)}>
                Отказ
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditTask;
