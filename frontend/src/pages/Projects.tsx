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
    <div style={{ padding: '24px', width: '100%' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 600 }}>Обекти</h2>
      <Row gutter={[16, 16]}>
        {data.map((p: any) => (
          <Col xs={24} sm={24} md={12} lg={12} xl={8} key={p.id}>
            <Link to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <Card
                hoverable
                style={{ height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                title={
                  <div style={{ paddingBottom: '8px' }}>
                    <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>{p.name}</div>
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
