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
  Switch,
  message,
  Calendar,
  Badge,
  Tooltip,
} from 'antd';
import { PlusOutlined, CloudOutlined, WarningOutlined } from '@ant-design/icons';
import { useWeatherLogs, useCreateWeatherLog } from '../api/hooks/useFeatures';
import type { WeatherLog } from '../api/hooks/useFeatures';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/bg';

dayjs.locale('bg');

interface WeatherLoggingProps {
  projectId: number;
}

const WEATHER_CONDITIONS = [
  { value: 'sunny', label: '☀️ Слънчево' },
  { value: 'partly_cloudy', label: '⛅ Частично облачно' },
  { value: 'cloudy', label: '☁️ Облачно' },
  { value: 'rainy', label: '🌧️ Дъждовно' },
  { value: 'stormy', label: '⛈️ Бурно' },
  { value: 'snowy', label: '🌨️ Снежно' },
  { value: 'foggy', label: '🌫️ Мъгливо' },
  { value: 'windy', label: '💨 Ветровито' },
];

const WeatherLogging: React.FC<WeatherLoggingProps> = ({ projectId }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [form] = Form.useForm();

  const { data: weatherLogs = [], isLoading } = useWeatherLogs(projectId);
  const createWeatherLog = useCreateWeatherLog();

  const handleCreateWeatherLog = async (values: any) => {
    try {
      const { date, ...otherValues } = values;
      const weatherData = {
        project: projectId,
        date: date.format('YYYY-MM-DD'),
        ...otherValues,
      };
      
      await createWeatherLog.mutateAsync(weatherData);
      message.success('Метеорологичният запис е добавен успешно');
      setModalOpen(false);
      form.resetFields();
    } catch (error: any) {
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.date) {
        message.error('Вече съществува запис за тази дата');
      } else if (error.response?.data) {
        // Show detailed backend error if available
        const errorMsg = Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ') || 'Грешка при добавяне на запис';
        message.error(errorMsg);
      } else {
        message.error('Грешка при добавяне на запис');
      }
    }
  };

  const columns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
      sorter: (a: any, b: any) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Условие',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition: string) => {
        const cond = WEATHER_CONDITIONS.find(c => c.value === condition);
        return cond ? cond.label : condition;
      },
      filters: WEATHER_CONDITIONS.map(c => ({ text: c.label, value: c.value })),
      onFilter: (value: any, record: any) => record.condition === value,
    },
    {
      title: 'Температура',
      key: 'temperature',
      render: (_: any, record: WeatherLog) => {
        if (record.temperature_min !== null && record.temperature_max !== null) {
          return `${record.temperature_min}°C / ${record.temperature_max}°C`;
        }
        return 'Няма данни';
      },
    },
    {
      title: 'Валежи',
      dataIndex: 'precipitation',
      key: 'precipitation',
      render: (val: number | null) => (val !== null ? `${val} мм` : '-'),
    },
    {
      title: 'Вятър',
      dataIndex: 'wind_speed',
      key: 'wind_speed',
      render: (val: number | null) => (val !== null ? `${val} км/ч` : '-'),
    },
    {
      title: 'Влажност',
      dataIndex: 'humidity',
      key: 'humidity',
      render: (val: number | null) => (val !== null ? `${val}%` : '-'),
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_: any, record: WeatherLog) => {
        if (record.work_stopped) {
          return <Tag color="error">Работата спряна</Tag>;
        }
        if (record.is_unfavorable) {
          return <Tag color="warning">Неблагоприятни условия</Tag>;
        }
        return <Tag color="success">Нормални условия</Tag>;
      },
      filters: [
        { text: 'Работата спряна', value: 'stopped' },
        { text: 'Неблагоприятни', value: 'unfavorable' },
        { text: 'Нормални', value: 'normal' },
      ],
      onFilter: (value: any, record: any) => {
        if (value === 'stopped') return record.work_stopped;
        if (value === 'unfavorable') return record.is_unfavorable && !record.work_stopped;
        return !record.is_unfavorable && !record.work_stopped;
      },
    },
    {
      title: 'Бележки',
      dataIndex: 'impact_notes',
      key: 'impact_notes',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
  ];

  // Calendar cell renderer
  const dateCellRender = (value: Dayjs) => {
    const log = weatherLogs.find(log => dayjs(log.date).isSame(value, 'day'));
    if (!log) return null;

    const condition = WEATHER_CONDITIONS.find(c => c.value === log.condition);
    
    return (
      <Tooltip title={condition?.label}>
        <div style={{ textAlign: 'center' }}>
          {log.work_stopped ? (
            <Badge status="error" text={condition?.label.split(' ')[0]} />
          ) : log.is_unfavorable ? (
            <Badge status="warning" text={condition?.label.split(' ')[0]} />
          ) : (
            <Badge status="success" text={condition?.label.split(' ')[0]} />
          )}
        </div>
      </Tooltip>
    );
  };

  const unfavorableDays = weatherLogs.filter(log => log.is_unfavorable || log.work_stopped).length;
  const totalDays = weatherLogs.length;
  const workStoppedDays = weatherLogs.filter(log => log.work_stopped).length;

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        {/* Statistics */}
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CloudOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                {totalDays}
              </div>
              <div style={{ color: '#666' }}>Записани дни</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <WarningOutlined style={{ fontSize: '32px', color: '#faad14' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                {unfavorableDays}
              </div>
              <div style={{ color: '#666' }}>Неблагоприятни дни</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <WarningOutlined style={{ fontSize: '32px', color: '#ff4d4f' }} />
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>
                {workStoppedDays}
              </div>
              <div style={{ color: '#666' }}>Спрени работни дни</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Calendar View */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="Календар">
            <Calendar
              cellRender={dateCellRender}
              onSelect={(date) => {
                setSelectedDate(date);
                const existingLog = weatherLogs.find(log => dayjs(log.date).isSame(date, 'day'));
                if (!existingLog) {
                  form.setFieldsValue({ date });
                  setModalOpen(true);
                }
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Table View */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card
            title="Метеорологични записи"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                Добави запис
              </Button>
            }
          >
            <Table
              dataSource={weatherLogs}
              columns={columns}
              rowKey="id"
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Create Weather Log Modal */}
      <Modal
        title="Добави метеорологичен запис"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setSelectedDate(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={createWeatherLog.isPending}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateWeatherLog}>
          <Form.Item
            label="Дата"
            name="date"
            rules={[{ required: true, message: 'Изберете дата' }]}
            initialValue={selectedDate || dayjs()}
          >
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item
            label="Метеорологични условия"
            name="condition"
            rules={[{ required: true, message: 'Изберете условие' }]}
          >
            <Select options={WEATHER_CONDITIONS} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Мин. температура (°C)" name="temperature_min">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Макс. температура (°C)" name="temperature_max">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Валежи (мм)" name="precipitation">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Скорост на вятъра (км/ч)" name="wind_speed">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Влажност (%)" name="humidity">
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item
            label="Работата е спряна"
            name="work_stopped"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="Да" unCheckedChildren="Не" />
          </Form.Item>
          <Form.Item label="Въздействие/Бележки" name="impact_notes">
            <Input.TextArea rows={3} placeholder="Опишете как времето е повлияло на работата..." />
          </Form.Item>
          <Form.Item label="API източник" name="api_source">
            <Input placeholder="Напр. OpenWeatherMap, Manual" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WeatherLogging;
