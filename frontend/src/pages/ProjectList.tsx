import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import {
  Button,
  Row,
  Col,
  Tag,
  Card,
  Input,
  Select,
  Empty,
  Alert,
  Skeleton,
  Space,
  Statistic,
  Flex,
} from 'antd';
import { PlusOutlined, FolderOpenOutlined, SearchOutlined } from '@ant-design/icons';
import { useProjects } from '../api/hooks';

type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

interface Project {
  id: number;
  name: string;
  location?: string;
  contractor?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
}

const statusColors: Record<ProjectStatus, string> = {
  planning: 'blue',
  in_progress: 'green',
  on_hold: 'orange',
  completed: 'purple',
  cancelled: 'red',
};

const statusLabels: Record<ProjectStatus, string> = {
  planning: 'Планиране',
  in_progress: 'В процес',
  on_hold: 'На пауза',
  completed: 'Завършен',
  cancelled: 'Отменен',
};

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading, error } = (useProjects() as any);
  const canEdit = useSelector((state: RootState) => state.auth.canEdit);

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<ProjectStatus | 'all'>('all');

  const filtered = React.useMemo(() => {
    return (projects as Project[])
      .filter(p => (statusFilter === 'all' ? true : p.status === statusFilter))
      .filter(p => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return (
          p.name.toLowerCase().includes(term) ||
          (p.location || '').toLowerCase().includes(term) ||
          (p.contractor || '').toLowerCase().includes(term)
        );
      });
  }, [projects, search, statusFilter]);

  const counts = React.useMemo(() => {
    const c: Record<ProjectStatus, number> = {
      planning: 0,
      in_progress: 0,
      on_hold: 0,
      completed: 0,
      cancelled: 0,
    };
    (projects as Project[]).forEach(p => c[p.status]++);
    return c;
  }, [projects]);

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16,16]} align="middle" justify="space-between" style={{ marginBottom: 8 }}>
        <Col flex="none">
          <h1 style={{ margin: 0 }}>Обекти <span style={{ color: '#888' }}>({projects.length})</span></h1>
        </Col>
        <Col flex="auto">
          <Space style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Търси (име, локация, изпълнител)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 260 }}
            />
            <Select
              value={statusFilter}
              onChange={v => setStatusFilter(v)}
              style={{ width: 180 }}
              options={[{ label: 'Всички статуси', value: 'all' },
                { label: 'Планиране', value: 'planning' },
                { label: 'В процес', value: 'in_progress' },
                { label: 'На пауза', value: 'on_hold' },
                { label: 'Завършен', value: 'completed' },
                { label: 'Отменен', value: 'cancelled' }]}
            />
            {canEdit && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/projects/new')}>Нов проект</Button>
            )}
          </Space>
        </Col>
      </Row>

      {error && (
        <Alert
          message="Грешка при зареждане"
          description={String(error)}
          type="error"
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small"><Statistic title="Планиране" value={counts.planning} /></Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small"><Statistic title="В процес" value={counts.in_progress} /></Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small"><Statistic title="На пауза" value={counts.on_hold} /></Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small"><Statistic title="Завършени" value={counts.completed} /></Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small"><Statistic title="Отменени" value={counts.cancelled} /></Card>
        </Col>
      </Row>

      {isLoading && (
        <Row gutter={[16,16]}> {Array.from({ length: 6 }).map((_,i) => (
          <Col key={i} xs={24} sm={12} md={8} lg={6}>
            <Card><Skeleton active paragraph={{ rows: 3 }} /></Card>
          </Col>
        ))} </Row>
      )}

      {!isLoading && filtered.length === 0 && (
        <Empty description="Няма намерени проекти" />
      )}

      {!isLoading && filtered.length > 0 && (
        <Row gutter={[16,16]}>
          {filtered.map(p => (
            <Col key={p.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                size="small"
                title={<div style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.25 }}>{p.name}</div>}
                extra={<Tag color={statusColors[p.status]}>{statusLabels[p.status]}</Tag>}
                actions={[
                  <FolderOpenOutlined key="open" onClick={() => navigate(`/projects/${p.id}`)} />,
                ]}
              >
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <div><strong>Локация:</strong> {p.location || '—'}</div>
                  <div><strong>Изпълнител:</strong> {p.contractor || '—'}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {p.start_date ? `Начало: ${p.start_date}` : ''}{p.end_date ? ` • Край: ${p.end_date}` : ''}
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ProjectList;