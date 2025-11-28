// frontend/src/pages/Projects.tsx
import { useProjects } from '../api/hooks';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Tag } from 'antd';

const statusLabels: Record<string, string> = {
  'planning': 'Планиране',
  'in_progress': 'В ход',
  'on_hold': 'На пауза',
  'completed': 'Завършен',
  'cancelled': 'Отменен',
};

const statusColors: Record<string, string> = {
  'planning': 'blue',
  'in_progress': 'green',
  'on_hold': 'orange',
  'completed': 'default',
  'cancelled': 'red',
};

export default function Projects() {
  const { data, loading } = useProjects();
  if (loading) return <p>Зареждане...</p>;
  
  // Helper to get Bulgarian label
  const getStatusLabel = (status: string) => statusLabels[status] || status;
  
  return (
    <div style={{ padding: '24px' }}>
      <h2>Обекти</h2>
      <Row gutter={[16, 16]}>
        {data.map((p: any) => (
          <Col xs={24} sm={12} md={8} lg={6} key={p.id}>
            <Link to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <Card
                hoverable
                title={
                  <div>
                    <div style={{ marginBottom: '8px' }}>{p.name}</div>
                    <Tag color={statusColors[p.status] || 'default'}>
                      {getStatusLabel(p.status)}
                    </Tag>
                  </div>
                }
              >
                <p><strong>Локация:</strong> {p.location || '—'}</p>
                <p><strong>Изпълнител:</strong> {p.contractor || '—'}</p>
                {p.start_date && p.end_date && (
                  <p><strong>Начало:</strong> {p.start_date} • <strong>Край:</strong> {p.end_date}</p>
                )}
                {p.start_date && !p.end_date && <p><strong>Начало:</strong> {p.start_date}</p>}
                {!p.start_date && p.end_date && <p><strong>Край:</strong> {p.end_date}</p>}
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}
