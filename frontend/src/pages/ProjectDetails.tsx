// frontend/src/pages/ProjectDetails.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useUpdateProject, useDeleteProject } from '../api/hooks/projects';
import { useState, useEffect } from 'react';

interface ProjectMember {
  id: number;
  employee: {
    user: {
      first_name: string;
      last_name: string;
    };
  };
  role: string;
  workload_percent: number;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  location: string;
  status: string;
  progress: number;
  progress_percentage: number;
  members?: ProjectMember[];
}

export default function ProjectDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id);
  const updateMutation = useUpdateProject(id || '');
  const deleteMutation = useDeleteProject();

  const [status, setStatus] = useState<string>('planning');
  const [progress, setProgress] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setStatus(project.status);
      setProgress(project.progress);
    }
  }, [project]);

  const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'planning', label: 'Планиране' },
    { value: 'in_progress', label: 'В процес' },
    { value: 'on_hold', label: 'На пауза' },
    { value: 'completed', label: 'Завършен' },
    { value: 'cancelled', label: 'Отменен' },
  ];

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ status, progress });
    } catch (e) {
      // optionally surface error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Сигурни ли сте, че искате да изтриете проекта?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/projects');
    } catch (e) {
      // optionally surface error
    }
  };

  if (isLoading || !project) return <p>Зареждане...</p>;
  
  return (
    <div>
      <h2>{project.name}</h2>
      <p>Локация: {project.location}</p>
      <p>Статус: {STATUS_OPTIONS.find(o => o.value === status)?.label}</p>
      <div style={{marginTop: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: 8, maxWidth: 480}}>
        <h3 style={{marginTop: 0}}>Редакция</h3>
        <label style={{display: 'block', marginBottom: 8}}>Статус:
          <select value={status} onChange={e => setStatus(e.target.value)} style={{marginLeft: 8}}>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label style={{display: 'block', marginBottom: 8}}>Прогрес (%):
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={e => setProgress(Number(e.target.value))}
            style={{width: '100%', display: 'block'}}
          />
          <input
            type="number"
            min={0}
            max={100}
            value={progress}
            onChange={e => setProgress(Number(e.target.value))}
            style={{width: '100%', marginTop: 4}}
          />
        </label>
        <div style={{fontSize: 12, color: '#555', marginBottom: 8}}>
          Автоматичен прогрес (от задачи): {Math.round(project.progress_percentage)}%
        </div>
        <button onClick={handleSave} disabled={saving} style={{marginRight: 8}}>{saving ? 'Запазване...' : 'Запази'}</button>
        <button onClick={handleDelete} style={{background: '#d32f2f', color: '#fff'}}>Изтрий</button>
      </div>
      <div style={{marginTop: '2rem', padding: '1rem', border: '1px solid #1890ff', borderRadius: 8, maxWidth: 480, background: '#e6f7ff'}}>
        <h3 style={{marginTop: 0}}>Документи</h3>
        <button 
          onClick={() => navigate(`/projects/${id}/acts/generate`)}
          style={{background: '#1890ff', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer'}}
        >
          Генериране на Акт
        </button>
      </div>
      {project.members && project.members.length > 0 && (
        <>
          <h3 style={{marginTop: '2rem'}}>Екип</h3>
          <ul>
            {project.members.map((m: ProjectMember) => (
              <li key={m.id}>{m.employee.user.first_name} {m.employee.user.last_name} — {m.role} ({m.workload_percent}%)</li>
            ))}
          </ul>
        </>
      )}
      <h3 style={{marginTop: '2rem'}}>Задачи</h3>
      {/* Тук може да добавиш компоненти за задачи и коментари */}
    </div>
  );
}
