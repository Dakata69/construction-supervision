import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Tabs,
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  Badge,
  Timeline,
  Modal,
  message,
  Popconfirm,
  Form,
  Select,
  DatePicker,
  Input,
  Skeleton,
} from 'antd';
import dayjs from 'dayjs';
import type { TabsProps } from 'antd';
import {
  FileOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  LinkOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DollarOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import { useProject, useProjectTasks } from '../api/hooks/projects';
import { api } from '../api/client';
import BudgetTracking from './BudgetTracking';
import WeatherLogging from './WeatherLogging';

// Removed project progress UI

const statusColors = {
  planning: 'blue',
  in_progress: 'green',
  on_hold: 'orange',
  completed: 'purple',
  cancelled: 'red',
} as const;

const statusLabels: Record<string, string> = {
  planning: 'Планиране',
  in_progress: 'В ход',
  on_hold: 'На пауза',
  completed: 'Завършен',
  cancelled: 'Отменен',
};

// Task-level mappings
const taskStatusColors = {
  pending: 'blue',
  in_progress: 'green',
  completed: 'purple',
  blocked: 'red',
} as const;

const taskStatusLabels: Record<string, string> = {
  pending: 'За изпълнение',
  in_progress: 'В процес',
  completed: 'Завършена',
  blocked: 'Блокирана',
};

const taskPriorityLabels: Record<string, string> = {
  low: 'Нисък',
  medium: 'Среден',
  high: 'Висок',
  urgent: 'Спешен',
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = useSelector((state: any) => state.auth.canEdit);
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [linkedDocuments, setLinkedDocuments] = useState<any[]>([]);
  const [allDocuments, setAllDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [form] = Form.useForm();
  
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(id);
  const { data: tasksRaw, isLoading: tasksLoading } = useProjectTasks(id);

  // Fetch linked documents for this project
  useEffect(() => {
    if (!id) return;
    setDocumentsLoading(true);
    api.get(`/projects/${id}/linked_documents/`)
      .then(res => setLinkedDocuments(res.data))
      .catch(err => console.error('Error fetching linked documents:', err))
      .finally(() => setDocumentsLoading(false));
  }, [id]);

  // Populate edit form when modal opens
  useEffect(() => {
    if (!isEditModalVisible || !project) return;
    form.setFieldsValue({
      status: project.status,
      start_date: project.start_date ? dayjs(project.start_date) : null,
      end_date: project.end_date ? dayjs(project.end_date) : null,
      progress: project.progress || 0,
      notes: project.notes || '',
    });
  }, [isEditModalVisible, project, form]);

  // Fetch all documents when modal opens
  useEffect(() => {
    if (!isLinkModalVisible) return;
    api.get('/documents/')
      .then(res => {
        console.log('Fetched documents:', res.data);
        // Handle both paginated and non-paginated responses
        let docs = [];
        if (Array.isArray(res.data)) {
          docs = res.data;
        } else if (res.data && Array.isArray(res.data.results)) {
          docs = res.data.results;
        }
        console.log('Setting allDocuments to:', docs);
        setAllDocuments(docs);
      })
      .catch(err => console.error('Error fetching documents:', err));
  }, [isLinkModalVisible]);

  const handleLinkDocument = async (documentId: number) => {
    if (!id) return;
    try {
      await api.post(`/projects/${id}/link_document/`, { document_id: documentId });
      message.success('Документът е свързан с проекта');
      // Refresh linked documents
      const res = await api.get(`/projects/${id}/linked_documents/`);
      setLinkedDocuments(res.data);
      setIsLinkModalVisible(false);
    } catch (error) {
      message.error('Грешка при свързване на документ');
    }
  };

  const handleUnlinkDocument = async (documentId: number) => {
    if (!id) return;
    try {
      await api.post(`/projects/${id}/unlink_document/`, { document_id: documentId });
      message.success('Документът е премахнат от проекта');
      // Refresh linked documents
      const res = await api.get(`/projects/${id}/linked_documents/`);
      setLinkedDocuments(res.data);
    } catch (error) {
      message.error('Грешка при премахване на документ');
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    try {
      await api.delete(`/projects/${id}/`);
      message.success('Проектът е изтрит успешно');
      navigate('/projects');
    } catch (error) {
      message.error('Грешка при изтриване на проект');
    }
  };

  const handleUpdateProject = async () => {
    if (!id) return;
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        start_date: values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : null,
        end_date: values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : null,
      };
      await api.patch(`/projects/${id}/`, payload);
      message.success('Проектът е актуализиран успешно');
      setIsEditModalVisible(false);
      window.location.reload();
    } catch (error) {
      message.error('Грешка при актуализиране на проект');
    }
  };

  // Normalize tasks to an array even if hook returned paginated object earlier
  const tasks: any[] = React.useMemo(() => {
    if (Array.isArray(tasksRaw)) return tasksRaw;
    if (tasksRaw && Array.isArray((tasksRaw as any).results)) return (tasksRaw as any).results;
    return [];
  }, [tasksRaw]);

  // Get available documents to link (exclude already linked ones)
  const availableDocuments = React.useMemo(() => {
    console.log('Computing availableDocuments:', { allDocuments, linkedDocuments });
    const linkedIds = new Set(linkedDocuments.map(d => d.id));
    const available = allDocuments.filter(d => !linkedIds.has(d.id));
    console.log('Available documents after filter:', available);
    return available;
  }, [allDocuments, linkedDocuments]);

  const documentColumns = [
    {
      title: 'Заглавие',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Създаден',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('bg-BG'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {record.file_pdf && (
            <Button
              type="link"
              icon={<DownloadOutlined />}
              href={record.file_pdf}
              target="_blank"
            >
              PDF
            </Button>
          )}
          {record.file_docx && (
            <Button
              type="link"
              icon={<DownloadOutlined />}
              href={record.file_docx}
              target="_blank"
            >
              DOCX
            </Button>
          )}
          {canEdit && (
            <Popconfirm
              title="Сигурни ли сте, че искате да премахнете този документ от проекта?"
              onConfirm={() => handleUnlinkDocument(record.id)}
              okText="Да"
              cancelText="Не"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Премахни
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const availableDocumentColumns = [
    {
      title: 'Заглавие',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Създаден',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('bg-BG'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          type="primary"
          icon={<LinkOutlined />}
          onClick={() => handleLinkDocument(record.id)}
        >
          Добави
        </Button>
      ),
    },
  ];

  const taskColumns = [
    {
      title: 'Задача',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof taskStatusColors) => (
        <Badge color={taskStatusColors[status]} text={taskStatusLabels[status] || status} />
      ),
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => taskPriorityLabels[priority] || priority,
    },
    {
      title: 'Изпълнител',
      dataIndex: 'assigned_to_name',
      key: 'assigned_to_name',
      render: (name: string | null) => name || '—',
    },
    {
      title: 'Краен срок',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date: string) => (date ? dayjs(date).format('DD.MM.YYYY') : '—'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <Space>
          {canEdit && (
            <Button 
              type="link"
              size="small"
              onClick={() => navigate(`/projects/${id}/tasks/${record.id}/edit`)}
            >
              Редактирай
            </Button>
          )}
          {canEdit && (
            <Popconfirm
              title="Сигурни ли сте, че искате да изтриете тази задача?"
              onConfirm={async () => {
                try {
                  await api.delete(`/tasks/${record.id}/`);
                  message.success('Задачата е изтрита успешно');
                  window.location.reload();
                } catch (error) {
                  message.error('Грешка при изтриване на задача');
                }
              }}
              okText="Да"
              cancelText="Отказ"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger size="small">
                Изтрий
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (projectLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Skeleton active title={{ width: 200 }} paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  // If project failed to load (e.g. 404 or server error)
  if (projectError || !project) {
    console.error('Project error:', projectError);
    return (
      <Card style={{ margin: 24 }}>
        <h3>Проектът не можа да бъде зареден.</h3>
        <p>Може да е изтрит или да има временен проблем.</p>
        {projectError && <p style={{ color: 'red' }}>Грешка: {JSON.stringify(projectError)}</p>}
        <Button onClick={() => navigate('/projects')}>Обратно към списъка</Button>
      </Card>
    );
  }

  console.log('Rendering project:', project);

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Информация за проекта</h2>
          {canEdit && (
            <Space>
              <Button 
                type="default" 
                icon={<CheckCircleOutlined />}
                onClick={() => setIsEditModalVisible(true)}
              >
                Редактирай
              </Button>
              <Popconfirm
                title="Сигурни ли сте, че искате да изтриете този проект?"
                description="Това действие е необратимо и ще изтрие всички свързани данни."
                onConfirm={handleDeleteProject}
                okText="Да, изтрий"
                cancelText="Отказ"
                okButtonProps={{ danger: true }}
              >
                <Button type="primary" danger icon={<DeleteOutlined />}>
                  Изтрий проект
                </Button>
              </Popconfirm>
            </Space>
          )}
        </div>
        <Descriptions title={null} bordered>
          <Descriptions.Item label="Име">{project?.name}</Descriptions.Item>
          <Descriptions.Item label="Местоположение">
            {project?.location || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Изпълнител">
            {project?.contractor || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Статус">
            <Badge
              color={statusColors[project?.status as keyof typeof statusColors]}
              text={statusLabels[project?.status] || project?.status}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Начална дата">
            {project?.start_date}
          </Descriptions.Item>
          <Descriptions.Item label="Крайна дата">
            {project?.end_date}
          </Descriptions.Item>
          <Descriptions.Item label="Бележки" span={3}>
            {project?.notes || 'Няма бележки'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Tabs
          defaultActiveKey="tasks"
          items={[
            {
              key: 'tasks',
              label: (
                <span>
                  <CheckCircleOutlined />
                  Задачи
                </span>
              ),
              children: (
                <>
                  {canEdit && (
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={() => navigate(`/projects/${id}/tasks/new`)}
                      style={{ marginBottom: 16 }}
                    >
                      Нова задача
                    </Button>
                  )}
                  <Table
                    columns={taskColumns}
                    dataSource={tasks}
                    loading={tasksLoading}
                    locale={{ emptyText: tasksLoading ? 'Зареждане...' : 'Няма задачи' }}
                    rowKey="id"
                  />
                </>
              ),
            },
            {
              key: 'documents',
              label: (
                <span>
                  <FileOutlined />
                  Документи
                </span>
              ),
              children: (
                <div>
                  <Space style={{ marginBottom: 16 }}>
                    {canEdit && (
                      <Button 
                        type="primary" 
                        icon={<LinkOutlined />}
                        onClick={() => setIsLinkModalVisible(true)}
                      >
                        Добави документ
                      </Button>
                    )}
                    <Button type="link" onClick={() => navigate('/documents')}>
                      Отвори всички документи
                    </Button>
                  </Space>
                  <Table
                    columns={documentColumns}
                    dataSource={linkedDocuments}
                    loading={documentsLoading}
                    locale={{ 
                      emptyText: documentsLoading 
                        ? 'Зареждане...' 
                        : 'Няма свързани документи' 
                    }}
                    rowKey="id"
                  />
                </div>
              ),
            },
            {
              key: 'budget',
              label: (
                <span>
                  <DollarOutlined />
                  Бюджет
                </span>
              ),
              children: <BudgetTracking projectId={Number(id)} />,
            },
            {
              key: 'weather',
              label: (
                <span>
                  <CloudOutlined />
                  Метеорология
                </span>
              ),
              children: <WeatherLogging projectId={Number(id)} />,
            },
          ]}
        />
      </Card>

      <Modal
        title="Добави документ към проекта"
        open={isLinkModalVisible}
        onCancel={() => setIsLinkModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          columns={availableDocumentColumns}
          dataSource={availableDocuments}
          locale={{ 
            emptyText: 'Няма налични документи за добавяне' 
          }}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Modal>

      <Modal
        title="Редактирай проект"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={handleUpdateProject}
        okText="Запази"
        cancelText="Отказ"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Статус" name="status">
            <Select>
              <Select.Option value="planning">Планиране</Select.Option>
              <Select.Option value="in_progress">В ход</Select.Option>
              <Select.Option value="on_hold">На пауза</Select.Option>
              <Select.Option value="completed">Завършен</Select.Option>
              <Select.Option value="cancelled">Отменен</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Начална дата" name="start_date">
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item label="Крайна дата" name="end_date">
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item label="Бележки" name="notes">
            <Input.TextArea
              rows={4}
              placeholder="Добавете бележки за проекта..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;