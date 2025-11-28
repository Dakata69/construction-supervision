import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../api/hooks/projects';
import { useGenerateAct } from '../api/hooks/acts';

interface ActFormData {
  project: string;
  act_type: string;
  act_number: string;
  act_date: string;
  representative_builder: string;
  representative_supervision: string;
  representative_designer: string;
  // Act 7
  level_from?: string;
  level_to?: string;
  work_description?: string;
  concrete_class?: string;
  concrete_work?: string;
  // Act 14
  referenced_acts?: string;
  quality_protocols?: string;
  conclusion_text?: string;
  // Act 15
  all_designers?: string;
  all_supervision?: string;
  referenced_documents?: string;
  findings_permits?: string;
  findings_execution?: string;
  findings_site?: string;
  decision_text?: string;
}

export default function GenerateAct() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { data: project } = useProject(projectId);
  const generateMutation = useGenerateAct();

  const [formData, setFormData] = useState<ActFormData>({
    project: projectId || '',
    act_type: 'act7',
    act_number: '',
    act_date: new Date().toISOString().split('T')[0],
    representative_builder: '',
    representative_supervision: '',
    representative_designer: '',
  });

  const [generatedAct, setGeneratedAct] = useState<any>(null);

  useEffect(() => {
    if (project) {
      setFormData((prev) => ({
        ...prev,
        project: project.id.toString(),
      }));
    }
  }, [project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = (): string | null => {
    // Allow generation with partial input; backend handles blanks.
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }
    
    try {
      const result = await generateMutation.mutateAsync(formData);
      setGeneratedAct(result);
    } catch (err) {
      console.error('Generation failed:', err);
      alert('Грешка при генериране: ' + (err as any)?.response?.data?.error || 'Неизвестна грешка');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h2>Генериране на Акт</h2>
      {project && <p>Проект: {project.name}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          Вид акт:
          <select name="act_type" value={formData.act_type} onChange={handleChange} required>
            <option value="act7">Акт 7 - Приемане по нива</option>
            <option value="act14">Акт 14 - Приемане на конструкция</option>
            <option value="act15">Акт 15 - Годност за приемане</option>
          </select>
        </label>

        <label>
          Номер на акт:
          <input type="text" name="act_number" value={formData.act_number} onChange={handleChange} />
        </label>

        <label>
          Дата:
          <input type="date" name="act_date" value={formData.act_date} onChange={handleChange} />
        </label>

        <h3>Представители</h3>
        <label>
          Представител на строител:
          <input type="text" name="representative_builder" value={formData.representative_builder} onChange={handleChange} />
        </label>
        <label>
          Представител на надзор:
          <input type="text" name="representative_supervision" value={formData.representative_supervision} onChange={handleChange} />
        </label>
        <label>
          Представител на проектант:
          <input type="text" name="representative_designer" value={formData.representative_designer} onChange={handleChange} />
        </label>

        {formData.act_type === 'act7' && (
          <>
            <h3>Специфични полета за Акт 7</h3>
            <label>
              Ниво от:
              <input type="text" name="level_from" value={formData.level_from || ''} onChange={handleChange} placeholder="напр. -1.55" />
            </label>
            <label>
              Ниво до:
              <input type="text" name="level_to" value={formData.level_to || ''} onChange={handleChange} placeholder="напр. -1.05" />
            </label>
            <label>
              Описание на работа:
              <textarea name="work_description" value={formData.work_description || ''} onChange={handleChange} rows={3} placeholder="Кофражни работи, армировъчни работи..." />
            </label>
            <label>
              Клас бетон:
              <input type="text" name="concrete_class" value={formData.concrete_class || ''} onChange={handleChange} placeholder="напр. С20/25" />
            </label>
            <label>
              Бетонови работи:
              <input type="text" name="concrete_work" value={formData.concrete_work || ''} onChange={handleChange} />
            </label>
          </>
        )}

        {formData.act_type === 'act14' && (
          <>
            <h3>Специфични полета за Акт 14</h3>
            <label>
              Referencing Acts (списък):
              <textarea name="referenced_acts" value={formData.referenced_acts || ''} onChange={handleChange} rows={5} placeholder="Акт образец 7 от ..., Акт образец 12 от ..." />
            </label>
            <label>
              Протоколи за качество:
              <textarea name="quality_protocols" value={formData.quality_protocols || ''} onChange={handleChange} rows={3} placeholder="Протокол за качеството на бетона..." />
            </label>
            <label>
              Заключение:
              <textarea name="conclusion_text" value={formData.conclusion_text || ''} onChange={handleChange} rows={3} placeholder="Конструкцията е изпълнена в съответствие с проекта..." />
            </label>
          </>
        )}

        {formData.act_type === 'act15' && (
          <>
            <h3>Специфични полета за Акт 15</h3>
            <label>
              Всички проектанти:
              <textarea name="all_designers" value={formData.all_designers || ''} onChange={handleChange} rows={5} placeholder="част Архитектурна - арх. ..., част Конструкции - инж. ..." />
            </label>
            <label>
              Всички от надзор:
              <textarea name="all_supervision" value={formData.all_supervision || ''} onChange={handleChange} rows={5} placeholder="част Архитектурна - арх. ..., част Конструкции - инж. ..." />
            </label>
            <label>
              Referencing Documents (списък):
              <textarea name="referenced_documents" value={formData.referenced_documents || ''} onChange={handleChange} rows={5} placeholder="Протокол образец 2 от ..., Акт образец 6 от ..." />
            </label>
            <label>
              Констатации - разрешителни:
              <textarea name="findings_permits" value={formData.findings_permits || ''} onChange={handleChange} rows={2} />
            </label>
            <label>
              Констатации - изпълнение:
              <textarea name="findings_execution" value={formData.findings_execution || ''} onChange={handleChange} rows={2} />
            </label>
            <label>
              Констатации - площадка:
              <textarea name="findings_site" value={formData.findings_site || ''} onChange={handleChange} rows={2} />
            </label>
            <label>
              Решение:
              <textarea name="decision_text" value={formData.decision_text || ''} onChange={handleChange} rows={3} placeholder="Приемаме, че строителството е изпълнено съгласно одобрените проекти..." />
            </label>
          </>
        )}

        <button type="submit" disabled={generateMutation.isPending}>
          {generateMutation.isPending ? 'Генериране...' : 'Генерирай акт'}
        </button>
      </form>

      {generatedAct && (
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #4caf50', borderRadius: 8, background: '#e8f5e9' }}>
          <h3>Актът е генериран успешно!</h3>
          <p>Акт ID: {generatedAct.id}</p>
          {generatedAct.docx_url && (
            <p>
              <a href={generatedAct.docx_url} download>
                Свали DOCX
              </a>
            </p>
          )}
          {generatedAct.pdf_url && (
            <p>
              <a href={generatedAct.pdf_url} download>
                Свали PDF
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
