import React from 'react';
import { Form, Input, Button, Select, DatePicker, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

const { TextArea } = Input;

const NewTask: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      const taskData = {
        project: projectId ? parseInt(projectId, 10) : undefined,
        title: values.title,
        description: values.description || '',
        status: values.status || 'pending',
        priority: values.priority || 'medium',
        // Backend expects DateTime; send end-of-day ISO when a date is chosen
        due_date: values.due_date ? values.due_date.endOf('day').toISOString() : null,
      };

      await api.post('tasks/', taskData);
      message.success('Задачата е създадена успешно!');
      navigate(`/projects/${projectId}`);
    } catch (error: any) {
      console.error('Error creating task:', error);
      const errorMessage = error.response?.data?.message || 'Възникна грешка при създаването на задачата';
      message.error(errorMessage);
      
      if (error.response?.data) {
        const errors = error.response.data;
        Object.keys(errors).forEach(key => {
          if (Array.isArray(errors[key])) {
            errors[key].forEach((msg: string) => message.error(`${key}: ${msg}`));
          }
        });
      }
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Нова задача</h2>
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
          label="Краен срок"
          name="due_date"
        >
          <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
            Създай задача
          </Button>
          <Button onClick={() => navigate(`/projects/${projectId}`)}>
            Отказ
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default NewTask;
