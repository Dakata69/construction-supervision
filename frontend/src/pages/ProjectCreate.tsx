import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, DatePicker, Select, InputNumber, message, Card } from 'antd';
import dayjs from 'dayjs';
import { api } from '../api/client';

const { RangePicker } = DatePicker;

const statusOptions = [
  { label: 'planning', value: 'planning' },
  { label: 'in_progress', value: 'in_progress' },
  { label: 'on_hold', value: 'on_hold' },
  { label: 'completed', value: 'completed' },
  { label: 'cancelled', value: 'cancelled' },
];

const ProjectCreate: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      const payload = {
        name: values.name,
        location: values.location,
        client: values.client,
        contractor: values.contractor,
        status: values.status,
        progress_percentage: values.progress_percentage || 0,
        start_date: values.dates ? dayjs(values.dates[0]).format('YYYY-MM-DD') : null,
        end_date: values.dates ? dayjs(values.dates[1]).format('YYYY-MM-DD') : null,
      };

  const res = await api.post('projects', payload);
      message.success('Проектът е създаден');
      // Navigate to the created project's detail page if id returned
      if (res.data && res.data.id) {
        navigate(`/projects/${res.data.id}`);
      } else {
        navigate('/projects');
      }
    } catch (error: any) {
      console.error('Error creating project', error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        message.error('Трябва да влезете в системата, за да създадете проект');
        navigate('/login');
      } else {
        message.error('Възникна грешка при създаването на проекта');
      }
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="Нов проект">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Име на проект" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>

          <Form.Item name="location" label="Местоположение">
            <Input />
          </Form.Item>

          <Form.Item name="client" label="Възложител">
            <Input />
          </Form.Item>

          <Form.Item name="contractor" label="Изпълнител">
            <Input />
          </Form.Item>

          <Form.Item name="dates" label="Начална и крайна дата">
            <RangePicker />
          </Form.Item>

          <Form.Item name="status" label="Статус" initialValue="planning">
            <Select options={statusOptions} />
          </Form.Item>

          <Form.Item name="progress_percentage" label="Прогрес (%)" initialValue={0}>
            <InputNumber min={0} max={100} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Създай
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProjectCreate;
