import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Table,
  Tag,
  Space,
  message,
  Tabs,
} from 'antd';
import { PlusOutlined, FileTextOutlined, CopyOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import dayjs from 'dayjs';
import 'dayjs/locale/bg';

dayjs.locale('bg');

interface DocumentTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  category_display: string;
  file_path: string;
  default_content: any;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface TextSnippet {
  id: number;
  name: string;
  category: string;
  category_display: string;
  content: string;
  tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

const TEMPLATE_CATEGORIES = [
  { value: 'act', label: 'Актове' },
  { value: 'contract', label: 'Договори' },
  { value: 'report', label: 'Отчети' },
  { value: 'invoice', label: 'Фактури' },
  { value: 'protocol', label: 'Протоколи' },
  { value: 'letter', label: 'Писма' },
  { value: 'other', label: 'Други' },
];

const SNIPPET_CATEGORIES = [
  { value: 'legal', label: 'Правни клаузи' },
  { value: 'technical', label: 'Технически описания' },
  { value: 'safety', label: 'Безопасност' },
  { value: 'quality', label: 'Качество' },
  { value: 'standard', label: 'Стандартни текстове' },
  { value: 'other', label: 'Други' },
];

const TemplateLibrary: React.FC = () => {
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [snippetModalOpen, setSnippetModalOpen] = useState(false);
  const [templateForm] = Form.useForm();
  const [snippetForm] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<DocumentTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await api.get('/templates/');
      return response.data.results || response.data;
    },
  });

  // Fetch snippets
  const { data: snippets = [], isLoading: snippetsLoading } = useQuery<TextSnippet[]>({
    queryKey: ['snippets'],
    queryFn: async () => {
      const response = await api.get('/snippets/');
      return response.data.results || response.data;
    },
  });

  // Create template
  const createTemplate = useMutation({
    mutationFn: async (data: Partial<DocumentTemplate>) => {
      const response = await api.post('/templates/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      message.success('Шаблонът е създаден успешно');
      setTemplateModalOpen(false);
      templateForm.resetFields();
    },
    onError: () => {
      message.error('Грешка при създаване на шаблон');
    },
  });

  // Create snippet
  const createSnippet = useMutation({
    mutationFn: async (data: Partial<TextSnippet>) => {
      const response = await api.post('/snippets/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      message.success('Текстовият фрагмент е създаден успешно');
      setSnippetModalOpen(false);
      snippetForm.resetFields();
    },
    onError: () => {
      message.error('Грешка при създаване на текстов фрагмент');
    },
  });

  const handleCopySnippet = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('Копирано в клипборда');
  };

  const templateColumns = [
    {
      title: 'Име',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Категория',
      dataIndex: 'category_display',
      key: 'category',
      filters: TEMPLATE_CATEGORIES.map(cat => ({ text: cat.label, value: cat.value })),
      onFilter: (value: any, record: any) => record.category === value,
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Използвания',
      dataIndex: 'usage_count',
      key: 'usage_count',
      sorter: (a: any, b: any) => a.usage_count - b.usage_count,
    },
    {
      title: 'Създаден',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
      sorter: (a: any, b: any) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: DocumentTemplate) => (
        <Space>
          <Button size="small" icon={<FileTextOutlined />}>
            Преглед
          </Button>
          <Button size="small" icon={<CopyOutlined />}>
            Използвай
          </Button>
        </Space>
      ),
    },
  ];

  const snippetColumns = [
    {
      title: 'Име',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Категория',
      dataIndex: 'category_display',
      key: 'category',
      filters: SNIPPET_CATEGORIES.map(cat => ({ text: cat.label, value: cat.value })),
      onFilter: (value: any, record: any) => record.category === value,
    },
    {
      title: 'Тагове',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags.map(tag => (
            <Tag key={tag} color="blue">{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: 'Използвания',
      dataIndex: 'usage_count',
      key: 'usage_count',
      sorter: (a: any, b: any) => a.usage_count - b.usage_count,
    },
    {
      title: 'Съдържание',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: '30%',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: TextSnippet) => (
        <Space>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopySnippet(record.content)}
          >
            Копирай
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Библиотека с шаблони</h1>

      <Tabs
        defaultActiveKey="templates"
        items={[
          {
            key: 'templates',
            label: (
              <span>
                <FileTextOutlined />
                Документни шаблони
              </span>
            ),
            children: (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setTemplateModalOpen(true)}
                  >
                    Добави шаблон
                  </Button>
                </div>
                <Table
                  dataSource={templates}
                  columns={templateColumns}
                  rowKey="id"
                  loading={templatesLoading}
                  pagination={{ pageSize: 10 }}
                />
              </>
            ),
          },
          {
            key: 'snippets',
            label: (
              <span>
                <CopyOutlined />
                Текстови фрагменти
              </span>
            ),
            children: (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setSnippetModalOpen(true)}
                  >
                    Добави фрагмент
                  </Button>
                </div>
                <Table
                  dataSource={snippets}
                  columns={snippetColumns}
                  rowKey="id"
                  loading={snippetsLoading}
                  pagination={{ pageSize: 10 }}
                />
              </>
            ),
          },
        ]}
      />

      {/* Create Template Modal */}
      <Modal
        title="Добави документен шаблон"
        open={templateModalOpen}
        onCancel={() => {
          setTemplateModalOpen(false);
          templateForm.resetFields();
        }}
        onOk={() => templateForm.submit()}
        confirmLoading={createTemplate.isPending}
      >
        <Form
          form={templateForm}
          layout="vertical"
          onFinish={(values) => createTemplate.mutate(values)}
        >
          <Form.Item
            label="Име на шаблона"
            name="name"
            rules={[{ required: true, message: 'Въведете име' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Категория"
            name="category"
            rules={[{ required: true, message: 'Изберете категория' }]}
          >
            <Select options={TEMPLATE_CATEGORIES} />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            label="Път до файл"
            name="file_path"
            rules={[{ required: true, message: 'Въведете път до файл' }]}
          >
            <Input placeholder="/templates/example_template.docx" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Snippet Modal */}
      <Modal
        title="Добави текстов фрагмент"
        open={snippetModalOpen}
        onCancel={() => {
          setSnippetModalOpen(false);
          snippetForm.resetFields();
        }}
        onOk={() => snippetForm.submit()}
        confirmLoading={createSnippet.isPending}
        width={700}
      >
        <Form
          form={snippetForm}
          layout="vertical"
          onFinish={(values) => {
            // Parse tags as array
            const tags = values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [];
            createSnippet.mutate({ ...values, tags });
          }}
        >
          <Form.Item
            label="Име на фрагмента"
            name="name"
            rules={[{ required: true, message: 'Въведете име' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Категория"
            name="category"
            rules={[{ required: true, message: 'Изберете категория' }]}
          >
            <Select options={SNIPPET_CATEGORIES} />
          </Form.Item>
          <Form.Item
            label="Съдържание"
            name="content"
            rules={[{ required: true, message: 'Въведете съдържание' }]}
          >
            <Input.TextArea rows={6} />
          </Form.Item>
          <Form.Item
            label="Тагове (разделени със запетая)"
            name="tags"
            tooltip="Напр.: правен, договор, клауза"
          >
            <Input placeholder="правен, договор, клауза" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateLibrary;
