import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, DatePicker, Select, Card, message, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { api } from '../api/client';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const NewProject: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const projectData = {
        name: values.name,
        description: values.description || '',
        location: values.location || '',
        contractor: values.contractor || '',
        status: values.status || 'planning',
        start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : null,
        end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : null,
      };

      await api.post('projects/', projectData);
      message.success('Проектът е създаден успешно!');
      navigate('/projects');
    } catch (error: any) {
      console.error('Error creating project:', error);
      console.error('Error response:', error.response?.data);
      const errorData = error.response?.data;
      let errorMessage = 'Възникна грешка при създаването на проекта';
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else {
          // Show first field error
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else {
            errorMessage = String(firstError);
          }
        }
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/projects')}
        >
          Назад
        </Button>
      </Space>

      <Card title="Създаване на нов проект">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Име на проект"
            name="name"
            rules={[{ required: true, message: 'Моля, въведете име на проекта' }]}
          >
            <Input placeholder="Например: Жилищна сграда - София" />
          </Form.Item>

          <Form.Item
            label="Описание"
            name="description"
          >
            <TextArea 
              rows={4} 
              placeholder="Подробно описание на проекта..."
            />
          </Form.Item>

          <Form.Item
            label="Местоположение"
            name="location"
          >
            <Input placeholder="Например: София, бул. Витоша 100" />
          </Form.Item>

          <Form.Item
            label="Изпълнител"
            name="contractor"
          >
            <Input placeholder="Име на изпълнителската фирма" />
          </Form.Item>

          <Form.Item
            label="Статус"
            name="status"
            initialValue="planning"
          >
            <Select>
              <Option value="planning">Планиране</Option>
              <Option value="in_progress">В процес</Option>
              <Option value="on_hold">На изчакване</Option>
              <Option value="completed">Завършен</Option>
              <Option value="cancelled">Отменен</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Начална дата"
            name="start_date"
          >
            <DatePicker 
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              placeholder="Изберете дата"
            />
          </Form.Item>

          <Form.Item
            label="Крайна дата"
            name="end_date"
          >
            <DatePicker 
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              placeholder="Изберете дата"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Създай проект
              </Button>
              <Button onClick={() => navigate('/projects')}>
                Отказ
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default NewProject;
