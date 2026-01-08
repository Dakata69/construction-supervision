import { Card, Row, Col, Typography, Image, Button, Modal, Form, Input, Upload, message, Popconfirm } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const StyledCard = styled(motion.div)`
  margin: 16px;
  cursor: pointer;
  
  .ant-card {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
    }
  }

  .project-image {
    height: 240px;
    object-fit: cover;
    transition: transform 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
    }
  }
`;

// Sample project data (replace with real data from your API)
const projects = [
  {
    id: 1,
    title: 'Жилищна сграда "Хоризонт"',
    description: 'Модерен 12-етажен жилищен комплекс с подземен паркинг',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500',
    year: 2024,
  },
  {
    id: 2,
    title: 'Офис център "Панорама"',
    description: 'Бизнес център клас А с LEED сертификация',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500',
    year: 2023,
  },
  {
    id: 3,
    title: 'Търговски център "Централ Плаза"',
    description: 'Многофункционален търговски център с развлекателна зона',
    image: 'https://images.unsplash.com/photo-1577493340887-b7bfff550145?w=500',
    year: 2023,
  },
  {
    id: 4,
    title: 'Логистичен център "Изток"',
    description: 'Модерен логистичен комплекс с автоматизирани системи',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500',
    year: 2022,
  },
];

const PreviousProjects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [projectList, setProjectList] = useState(projects);
  const [fileList, setFileList] = useState<any[]>([]);
  
  // Get user role from Redux
  const userRole = useSelector((state: RootState) => state.auth.role);
  const canEdit = useSelector((state: RootState) => state.auth.canEdit);
  
  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem('auth_token');
  
  // Only non-privileged users can add/delete projects
  const canModifyProjects = isAuthenticated && canEdit;

  const showModal = () => {
    if (!isAuthenticated) {
      message.warning('Моля, влезте в профила си, за да добавите проект');
      return;
    }
    if (!canModifyProjects) {
      message.error('Нямате право да добавяте проекти');
      return;
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setFileList([]);
  };

  const handleSubmit = async (values: any) => {
    try {
      // Here you would typically send the data to your backend API
      // For now, we'll add it to the local state
      const newProject = {
        id: projectList.length + 1,
        title: values.title,
        description: values.description,
        image: fileList.length > 0 ? URL.createObjectURL(fileList[0].originFileObj) : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500',
        year: values.year || new Date().getFullYear(),
      };

      setProjectList([newProject, ...projectList]);
      message.success('Проектът беше добавен успешно!');
      handleCancel();
    } catch (error) {
      message.error('Грешка при добавяне на проект');
    }
  };

  const handleDelete = (projectId: number) => {
    if (!isAuthenticated) {
      message.warning('Моля, влезте в профила си, за да изтриете проект');
      return;
    }
    if (!canModifyProjects) {
      message.error('Нямате право да изтривате проекти');
      return;
    }
    try {
      // Here you would typically send a DELETE request to your backend API
      setProjectList(projectList.filter(p => p.id !== projectId));
      message.success('Проектът беше изтрит успешно!');
    } catch (error) {
      message.error('Грешка при изтриване на проект');
    }
  };

  const uploadProps = {
    fileList,
    beforeUpload: (file: any) => {
      setFileList([file]);
      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: 0 }}>
          Завършени проекти
        </h1>
        {canModifyProjects && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showModal}
            size="large"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            }}
          >
            Добави проект
          </Button>
        )}
      </div>

      <Row gutter={[24, 24]} justify="center">
        {projectList.map((project) => (
          <Col xs={24} sm={12} lg={8} key={project.id}>
            <StyledCard
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card
                cover={
                  <div style={{ overflow: 'hidden' }}>
                    <Image
                      alt={project.title}
                      src={project.image}
                      className="project-image"
                      preview={false}
                    />
                  </div>
                }
                actions={canModifyProjects ? [
                  <Popconfirm
                    title="Изтриване на проект"
                    description="Сигурни ли сте, че искате да изтриете този проект?"
                    onConfirm={() => handleDelete(project.id)}
                    okText="Да"
                    cancelText="Не"
                    okButtonProps={{
                      danger: true,
                    }}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      style={{ width: '100%' }}
                    >
                      Изтрий
                    </Button>
                  </Popconfirm>,
                ] : undefined}
              >
                <Card.Meta
                  title={
                    <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                      {project.title}
                    </div>
                  }
                  description={
                    <>
                      <Paragraph>{project.description}</Paragraph>
                      <Paragraph type="secondary">
                        Завършен: {project.year}
                      </Paragraph>
                    </>
                  }
                />
              </Card>
            </StyledCard>
          </Col>
        ))}
      </Row>

      <Modal
        title={
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            Добави завършен проект
          </div>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            label="Име на проекта"
            name="title"
            rules={[{ required: true, message: 'Моля въведете име на проекта' }]}
          >
            <Input placeholder="Напр. Жилищна сграда 'Хоризонт'" size="large" />
          </Form.Item>

          <Form.Item
            label="Описание"
            name="description"
            rules={[{ required: true, message: 'Моля въведете описание' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Опишете проекта..." 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Година на завършване"
            name="year"
            rules={[{ required: true, message: 'Моля въведете година' }]}
          >
            <Input 
              type="number" 
              placeholder="2024" 
              size="large"
              min={1900}
              max={new Date().getFullYear()}
            />
          </Form.Item>

          <Form.Item
            label="Снимка на проекта"
            name="image"
          >
            <Upload {...uploadProps} listType="picture" maxCount={1}>
              <Button icon={<UploadOutlined />} size="large">
                Избери снимка
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '32px' }}>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel} size="large">
                Отказ
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                }}
              >
                Добави проект
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PreviousProjects;