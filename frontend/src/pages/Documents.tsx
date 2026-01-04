// frontend/src/pages/Documents.tsx
import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import { Button, Form, Input, DatePicker, message, Card, Space, Divider, Popconfirm, Row, Col, Select, Modal, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';

interface DocumentContext {
  project_name: string;
  location: string;
  client_name: string;
  permit_number: string;
  permit_date: string;
  date: string;
  [key: string]: string;
}

interface Act14Context extends DocumentContext {
  designer_name: string;
  contractor_name: string;
  consultant_name: string;
  tech_supervisor_name: string;
  additional_documents: string;
  defects_description: string;
}

interface Act15Context extends DocumentContext {
  designer_name: string;
  contractor_name: string;
  consultant_name: string;
  execution_findings: string;
  site_condition: string;
  surrounding_condition: string;
}

export default function Documents() {
  const [docs, setDocs] = useState<any[]>([]);
  const [form7] = Form.useForm();
  const [form14] = Form.useForm();
  const [form15] = Form.useForm();
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  // Dark theme removed

  const autoTriggered = useRef(false);

  // Upload modal state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadForm] = Form.useForm();
  const [fileListDocx, setFileListDocx] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Shared fields to mirror across forms
  const sharedFieldNames = [
    'date', // UI field; mapped to act_date placeholder
    'act_date',
    'project_name',
    'location', // UI field; mapped to project_location placeholder
    'project_location',
    'client_name',
    'contractor_name',
    'designer_name',
    'consultant_name',
    'supervisor_name', // may not be in template but we keep sync
  ];

  // Debounce for shared field synchronization
  const syncRef = (window as any).syncRef || { timer: null };
  (window as any).syncRef = syncRef;

  function performSync(changedValues: Record<string, any>, source: 'act7' | 'act14' | 'act15') {
    const payload: Record<string, any> = {};
    let hasShared = false;
    for (const key of Object.keys(changedValues)) {
      if (sharedFieldNames.includes(key)) {
        payload[key] = changedValues[key];
        hasShared = true;
      }
    }
    if (!hasShared) return;

    if (source !== 'act7') {
      form7.setFieldsValue(payload);
    }
    if (source !== 'act14') {
      form14.setFieldsValue(payload);
    }
    if (source !== 'act15') {
      form15.setFieldsValue(payload);
    }
    if (hasShared) setTick(t => t + 1);
  }

  // (superseded by enhanced version later; original removed)
  
  // Delete a document by id
  async function handleDelete(id: number) {
    try {
      const msgKey = `del-${id}-${Date.now()}`;
      const warnKey = `${msgKey}-warn`;
      const slowTimer = setTimeout(() => {
        message.open({ type: 'loading', content: 'Изтриването отнема повече време от обичайното...', key: msgKey, duration: 0 });
      }, 5000);
      const verySlowTimer = setTimeout(() => {
        message.open({ type: 'warning', content: 'Все още изтриваме документа... моля, изчакайте още малко.', key: warnKey, duration: 0 });
      }, 15000);

      await api.delete(`documents/${id}/`);

      clearTimeout(slowTimer);
      clearTimeout(verySlowTimer);
      message.destroy(msgKey);
      message.destroy(warnKey);
      message.success('Документът е изтрит');
      // Remove from local state without extra request
      setDocs(prev => prev.filter((d: any) => d.id !== id));
    } catch (err) {
      console.error('Error deleting document:', err);
      message.destroy();
      message.error('Грешка при изтриване на документа');
    }
  }

  async function handleUpload() {
    try {
      const values = await uploadForm.validateFields();
      
      // Validate that DOCX file is provided
      if (fileListDocx.length === 0 || !fileListDocx[0].originFileObj) {
        message.error('Моля изберете DOCX файл');
        return;
      }
      
      setUploading(true);
      const msgKey = `upload-${Date.now()}`;
      const warnKey = `${msgKey}-warn`;
      const slowTimer = setTimeout(() => {
        message.open({ type: 'loading', content: 'Качването отнема повече време от обичайното...', key: msgKey, duration: 0 });
      }, 5000);
      const verySlowTimer = setTimeout(() => {
        message.open({ type: 'warning', content: 'Все още качваме документа... моля, изчакайте още малко.', key: warnKey, duration: 0 });
      }, 15000);

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('file_docx', fileListDocx[0].originFileObj);

      const response = await api.post('documents/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearTimeout(slowTimer);
      clearTimeout(verySlowTimer);
      message.destroy(msgKey);
      message.destroy(warnKey);
      message.success('Документът е качен успешно');
      setDocs(prev => [response.data, ...prev]);
      setUploadModalVisible(false);
      uploadForm.resetFields();
      setFileListDocx([]);
    } catch (err: any) {
      console.error('Error uploading document:', err);
      message.destroy();
      message.error(err.response?.data?.error || 'Грешка при качване на документа');
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    api.get('documents/')
      .then(res => {
        // Handle paginated response or array
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setDocs(data);
      })
      .catch(err => {
        console.error('Error fetching documents:', err);
        setDocs([]);
      });
  }, []);

  // Load projects for autofill
  useEffect(() => {
    setProjectsLoading(true);
    api.get('projects/')
      .then(res => {
        const arr = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setProjects(arr);
        // Restore previously selected project if exists
        try {
          const stored = localStorage.getItem('selected_project_id');
          if (stored) {
            const pid = parseInt(stored, 10);
            const p = arr.find((x:any) => x.id === pid);
            if (p) {
              setSelectedProjectId(pid);
              applyProjectToForms(p);
            }
          }
        } catch(e) { /* ignore */ }
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        setProjects([]);
      })
      .finally(() => setProjectsLoading(false));
  }, []);

  // Apply prefill (from New Project flow) if available
  useEffect(() => {
    try {
      const raw = localStorage.getItem('documents_prefill');
      if (!raw) return;
      const prefill = JSON.parse(raw);
      if (prefill?.act7) form7.setFieldsValue(prefill.act7);
      if (prefill?.act14) form14.setFieldsValue(prefill.act14);
      if (prefill?.act15) form15.setFieldsValue(prefill.act15);
      setTick(t => t + 1);
      localStorage.removeItem('documents_prefill');
    } catch(e) { /* ignore */ }
  }, []);

  function applyProjectToForms(p: any) {
    if (!p) return;
    const values = {
      project_name: p.name || '',
      location: p.location || '',
      project_location: p.location || '',
      contractor_name: p.contractor || '',
      client_name: p.client_name || '',
      supervisor_name: p.supervisor_name || '',
    } as any;
    form7.setFieldsValue(values);
    form14.setFieldsValue(values);
    form15.setFieldsValue(values);
    // Autofill representative_builder from contractor if empty (Act 7)
    if (!form7.getFieldValue('representative_builder') && p.contractor) {
      form7.setFieldsValue({ representative_builder: p.contractor });
    }
    setTick(t => t + 1);
  }

  // Auto-generate when redirected with ?auto=act7|act14|act15
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auto = params.get('auto');
    if (!auto || autoTriggered.current) return;

    const doGenerate = async () => {
      // Give a moment for forms to populate from selected project
      await new Promise(r => setTimeout(r, 250));
      if (auto === 'act7') {
        const vals = form7.getFieldsValue();
        preSubmitValidate('act7', vals, 'act7_bg.docx');
      } else if (auto === 'act14') {
        const vals = form14.getFieldsValue();
        preSubmitValidate('act14', vals as Act14Context, 'act14_bg.docx');
      } else if (auto === 'act15') {
        const vals = form15.getFieldsValue();
        preSubmitValidate('act15', vals as Act15Context, 'act15_bg.docx');
      }
      autoTriggered.current = true;
      try {
        params.delete('auto');
        const qs = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${qs ? '?' + qs : ''}`);
      } catch(e) { /* ignore */ }
    };

    doGenerate();
  }, [selectedProjectId, projectsLoading, tick]);



  // Placeholder sets per template - marking required fields only
  const act7Placeholders = ['act_date','client_name','contractor_name','project_location','project_name'];
  const act14Placeholders = ['act_date','client_name','contractor_name','designer_name','project_location','project_name'];
  const act15Placeholders = ['act_date','client_name','contractor_name','designer_name','project_location','project_name'];

  function buildContext(raw: any) {
    const ctx: any = { ...raw };
    if (raw?.date) {
      const d = dayjs(raw.date).format('DD.MM.YYYY');
      ctx.date = d;
      ctx.act_date = d;
    }
    if (raw?.location && !raw.project_location) ctx.project_location = raw.location;
    if (raw?.permit_date) ctx.permit_date = dayjs(raw.permit_date).format('DD.MM.YYYY');
    if (raw?.start_date) ctx.start_date = dayjs(raw.start_date).format('DD.MM.YYYY');
    if (raw?.end_date) ctx.end_date = dayjs(raw.end_date).format('DD.MM.YYYY');
    return ctx;
  }

  function getMissing(placeholders: string[], values: any) {
    const missing: string[] = [];
    for (const ph of placeholders) {
      // map placeholder to form field name
      const field = ph === 'act_date' ? 'date' : ph === 'project_location' ? 'location' : ph;
      const val = values[field];
      if (val === undefined || val === null || val === '') missing.push(ph);
    }
    return missing;
  }

  function translatePlaceholder(ph: string): string {
    const labels: Record<string, string> = {
      'act_date': 'Дата',
      'date': 'Дата',
      'client_name': 'Възложител',
      'consultant_name': 'Консултант',
      'contractor_name': 'Строител',
      'designer_name': 'Проектант',
      'project_name': 'Строеж',
      'project_location': 'Местоположение',
      'location': 'Местоположение',
      'representative_builder': 'Представител на строителя',
      'supervisor_name': 'Надзор',
    };
    return labels[ph] || ph;
  }

  async function generateDocument(template: string, values: any) {
    try {
      const slowThresholdMs = 5000;
      const verySlowThresholdMs = 15000;
      const msgKey = `doc-gen-${Date.now()}`;
      const warnKey = `${msgKey}-warn`;

      const slowTimer = setTimeout(() => {
        message.open({ type: 'loading', content: 'Генерирането отнема повече време от обичайното...', key: msgKey, duration: 0 });
      }, slowThresholdMs);

      const verySlowTimer = setTimeout(() => {
        message.open({ type: 'warning', content: 'Все още подготвяме документа. Може да отнеме още малко време...', key: warnKey, duration: 0 });
      }, verySlowThresholdMs);
      
      // Format dates only if provided
      let formattedValues: any = { ...values };
      if (values?.date) {
        const d = dayjs(values.date).format('DD.MM.YYYY');
        formattedValues.date = d; // keep original key for UI reference
        formattedValues.act_date = d; // template placeholder
      }
      if (values?.permit_date) {
        formattedValues.permit_date = dayjs(values.permit_date).format('DD.MM.YYYY');
      }

      // Add start_date and end_date formatting for Act 15
      if (template === 'act15_bg.docx') {
        const act15Values = values as Act15Context;
        if (act15Values?.start_date) {
          formattedValues.start_date = dayjs(act15Values.start_date).format('DD.MM.YYYY');
        }
        if (act15Values?.end_date) {
          formattedValues.end_date = dayjs(act15Values.end_date).format('DD.MM.YYYY');
        }
      }

      // Map location to project_location if present
      if (formattedValues.location && !formattedValues.project_location) {
        formattedValues.project_location = formattedValues.location;
      }

      const res = await api.post('documents/generate/', {
        template_name: template,
        context: formattedValues,
      });

      clearTimeout(slowTimer);
      clearTimeout(verySlowTimer);
      message.destroy(msgKey);
      message.destroy(warnKey);
      message.success('Документът е генериран успешно');

      // Reload documents list
      const docsRes = await api.get('documents/');
      const data = Array.isArray(docsRes.data) ? docsRes.data : (docsRes.data.results || []);
      setDocs(data);

      // Don't automatically open/download the document
      // User can download from the documents list if needed
    } catch (error: any) {
      message.destroy();
      const detail = error?.response?.data?.error || error?.message || '';
      const status = error?.response?.status;
      if (status === 401) {
        message.error('Сесията е изтекла или нямате достъп (401).');
      } else if (detail) {
        message.error(`Грешка при генериране: ${detail}`);
      } else {
        message.error('Грешка при генериране на документа');
      }
      console.error('Generate error:', error?.response?.data || error);
    } finally {
      // no-op
    }
  }

  // Critical placeholders (act-specific) used for pre-submit validation
  const criticalAct7 = ['act_date','project_name','project_location','representative_builder','contractor_name','client_name'];
  const criticalAct14 = ['act_date','project_name','project_location','contractor_name','client_name','designer_name'];
  const criticalAct15 = ['act_date','project_name','project_location','contractor_name','client_name'];

  function preSubmitValidate(act: 'act7'|'act14'|'act15', values: any, template: string) {
    const placeholderMap = { act7: criticalAct7, act14: criticalAct14, act15: criticalAct15 } as Record<string,string[]>;
    const list = placeholderMap[act];
    const missing = getMissing(list, values);
    if (missing.length) {
      Modal.confirm({
        title: 'Липсват критични полета',
        content: <div>Следните полета са празни: <strong>{missing.map(translatePlaceholder).join(', ')}</strong><br/>Да продължим ли с генериране?</div>,
        okText: 'Продължи',
        cancelText: 'Откажи',
        onOk: () => generateDocument(template, values)
      });
    } else {
      generateDocument(template, values);
    }
  }

  // Sync helper: if contractor_name changes and representative_builder empty -> autofill
  function syncSharedFields(changedValues: Record<string, any>, source: 'act7' | 'act14' | 'act15') {
    if (syncRef.timer) clearTimeout(syncRef.timer);
    // Autofill representative_builder if contractor_name changed
    if (changedValues.contractor_name && !form7.getFieldValue('representative_builder')) {
      form7.setFieldsValue({ representative_builder: changedValues.contractor_name });
    }
    syncRef.timer = setTimeout(() => performSync(changedValues, source), 150);
  }

  return (
    <div className="documents-page" style={{ padding: '24px' }}>
      <h2>Документи</h2>
      <Divider />
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card bordered>
          <Space direction="vertical" style={{ width: '100%' }}>
            <strong>Изберете обект за авто-попълване</strong>
            <Select
              placeholder="Избор на обект"
              loading={projectsLoading}
              value={selectedProjectId ?? undefined}
              onChange={(id: number) => {
                setSelectedProjectId(id);
                const p = projects.find((x: any) => x.id === id);
                applyProjectToForms(p);
                try { localStorage.setItem('selected_project_id', String(id)); } catch(e) { /* ignore */ }
              }}
              options={projects.map((p: any) => ({
                label: `${p.name}${p.location ? ' — ' + p.location : ''}`,
                value: p.id,
              }))}
              showSearch
              optionFilterProp="label"
              style={{ maxWidth: 500 }}
            />
          </Space>
        </Card>
        <Row gutter={[16, 16]} className={'act-cards'}>
          <Col xs={24} md={8}>
            <Card title="Акт 7" bordered style={{ height: '100%' }} headStyle={{ textAlign: 'center', fontSize: '20px', fontWeight: 600 }}>
              <Form
                form={form7}
                layout="vertical"
                onValuesChange={(changed) => { syncSharedFields(changed, 'act7'); setTick(t=>t+1); }}
                onFinish={(values: any) => preSubmitValidate('act7', values, 'act7_bg.docx')}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item name="date" label="Дата" className={getMissing(act7Placeholders, form7.getFieldsValue()).includes('act_date') ? 'missing-field' : ''}>
                    <DatePicker format="DD.MM.YYYY" />
                  </Form.Item>

                  <Form.Item name="project_name" label="Строеж" className={getMissing(act7Placeholders, form7.getFieldsValue()).includes('project_name') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>

                  <Form.Item name="location" label="Местоположение" className={getMissing(act7Placeholders, form7.getFieldsValue()).includes('project_location') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>

                  <Form.Item name="client_name" label="Възложител" className={getMissing(act7Placeholders, form7.getFieldsValue()).includes('client_name') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>

                  <Form.Item name="consultant_name" label="Консултант" className={getMissing(act7Placeholders, form7.getFieldsValue()).includes('consultant_name') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>

                  <Form.Item name="representative_builder" label="Представител на строителя" className={getMissing(act7Placeholders, form7.getFieldsValue()).includes('representative_builder') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>

                  <Form.Item name="contractor_name" label="Строител">
                    <Input />
                  </Form.Item>

                  <Form.Item name="supervisor_name" label="Надзор">
                    <Input />
                  </Form.Item>

                  <Form.Item name="designer_name" label="Проектант">
                    <Input />
                  </Form.Item>

                  <Divider orientation="left" style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '16px' }}>Детайли за Акт 7</Divider>
                  
                  <Form.Item name="level_from" label="Ниво от" tooltip="Начално ниво на конструкцията">
                    <Input placeholder="напр. -1.55" />
                  </Form.Item>
                  <Form.Item name="level_to" label="Ниво до" tooltip="Крайно ниво на конструкцията">
                    <Input placeholder="напр. -1.05" />
                  </Form.Item>
                  <Form.Item name="work_description" label="Описание на работа" tooltip="Извършени СМР по нива и елементи">
                    <Input.TextArea rows={3} placeholder="Кофражни работи, армировъчни работи, поставяне на фусове..." />
                  </Form.Item>
                  <Form.Item name="execution" label="Изпълнението на" tooltip="Следващи работи които се разрешават">
                    <Input.TextArea rows={2} placeholder="Бетониране на фундаменти, монтаж на плоча..." />
                  </Form.Item>

                  <Button type="primary" htmlType="submit">
                    Генерирай Акт 7
                  </Button>
                  {(() => {
                    const vals = form7.getFieldsValue();
                    const missing = getMissing(act7Placeholders, vals);
                    return missing.length ? <div style={{ color:'#faad14' }}>Незапълнени: {missing.map(translatePlaceholder).join(', ')}</div> : <div style={{ color:'#52c41a' }}>Всички попълнени или незадължителни.</div>;
                  })()}
                </Space>
              </Form>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Акт 14" bordered style={{ height: '100%' }} headStyle={{ textAlign: 'center', fontSize: '20px', fontWeight: 600 }}>
              <Form
                form={form14}
                layout="vertical"
                onValuesChange={(changed) => { syncSharedFields(changed, 'act14'); setTick(t=>t+1); }}
                onFinish={(values: any) => preSubmitValidate('act14', values as Act14Context, 'act14_bg.docx')}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item name="date" label="Дата" className={getMissing(act14Placeholders, form14.getFieldsValue()).includes('act_date') ? 'missing-field' : ''}>
                    <DatePicker format="DD.MM.YYYY" />
                  </Form.Item>
                  
                  <Form.Item name="project_name" label="Строеж" className={getMissing(act14Placeholders, form14.getFieldsValue()).includes('project_name') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>
                  
                  <Form.Item name="location" label="Местоположение" className={getMissing(act14Placeholders, form14.getFieldsValue()).includes('project_location') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>
                  
                  <Form.Item name="client_name" label="Възложител" className={getMissing(act14Placeholders, form14.getFieldsValue()).includes('client_name') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>

                  <Form.Item name="consultant_name" label="Консултант" className={getMissing(act14Placeholders, form14.getFieldsValue()).includes('consultant_name') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>
                  
                  <Form.Item name="designer_name" label="Проектант">
                    <Input />
                  </Form.Item>
                  
                  <Form.Item name="contractor_name" label="Изпълнител">
                    <Input />
                  </Form.Item>
                  
                  <Form.Item name="tech_supervisor_name" label="Технически правоспособно лице">
                    <Input />
                  </Form.Item>
                  
                  <Form.Item name="additional_documents" label="Допълнителни документи">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  
                  <Form.Item name="defects_description" label="Недостатъци (отстранени)">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  
                  <Button type="primary" htmlType="submit">
                    Генерирай Акт 14
                  </Button>
                  {(() => {
                    const vals = form14.getFieldsValue();
                    const missing = getMissing(act14Placeholders, vals);
                    return missing.length ? <div style={{ color:'#faad14' }}>Незапълнени: {missing.map(translatePlaceholder).join(', ')}</div> : <div style={{ color:'#52c41a' }}>Всички попълнени или незадължителни.</div>;
                  })()}
                </Space>
              </Form>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Акт 15" bordered style={{ height: '100%' }} headStyle={{ textAlign: 'center', fontSize: '20px', fontWeight: 600 }}>
              <Form
                form={form15}
                layout="vertical"
                onValuesChange={(changed) => { syncSharedFields(changed, 'act15'); setTick(t=>t+1); }}
                onFinish={(values: any) => preSubmitValidate('act15', values as Act15Context, 'act15_bg.docx')}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Form.Item name="date" label="Дата" className={getMissing(act15Placeholders, form15.getFieldsValue()).includes('act_date') ? 'missing-field' : ''}>
                    <DatePicker format="DD.MM.YYYY" />
                  </Form.Item>
                  
                  <Form.Item name="project_name" label="Строеж" className={getMissing(act15Placeholders, form15.getFieldsValue()).includes('project_name') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>
                  
                  <Form.Item name="location" label="Местоположение" className={getMissing(act15Placeholders, form15.getFieldsValue()).includes('project_location') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>
                  
                  <Form.Item name="client_name" label="Възложител" className={getMissing(act15Placeholders, form15.getFieldsValue()).includes('client_name') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>

                  <Form.Item name="consultant_name" label="Консултант" className={getMissing(act15Placeholders, form15.getFieldsValue()).includes('consultant_name') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>
                  
                  <Form.Item name="designer_name" label="Проектант" className={getMissing(act15Placeholders, form15.getFieldsValue()).includes('designer_name') ? 'missing-field' : ''}>
                    <Input />
                  </Form.Item>
                  
                  <Form.Item name="contractor_name" label="Строител">
                    <Input />
                  </Form.Item>
                  
                  <Form.Item name="execution_findings" label="Констатации по изпълнението">
                    <Input.TextArea rows={4} />
                  </Form.Item>
                  
                  <Form.Item name="site_condition" label="Състояние на строителната площадка">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  
                  <Form.Item name="surrounding_condition" label="Състояние на околното пространство">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  
                  <Button type="primary" htmlType="submit">
                    Генерирай Акт 15
                  </Button>
                  {(() => {
                    const vals = form15.getFieldsValue();
                    const missing = getMissing(act15Placeholders, vals);
                    return missing.length ? <div style={{ color:'#faad14' }}>Незапълнени: {missing.map(translatePlaceholder).join(', ')}</div> : <div style={{ color:'#52c41a' }}>Всички попълнени или незадължителни.</div>;
                  })()}
                </Space>
              </Form>
            </Card>
          </Col>
        </Row>

        <Card 
          title="Списък на документи" 
          bordered
          extra={
            <Button 
              type="primary" 
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
            >
              Качи документ
            </Button>
          }
        >
          <ul>
            {docs.map(d => (
              <li key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div>
                    <strong>{d.title}</strong>
                    {d.created_at && (
                      <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                        ({dayjs(d.created_at).format('DD.MM.YYYY HH:mm')})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    {d.file_docx && (
                      <a href={d.file_docx} target="_blank" rel="noopener noreferrer" style={{ marginRight: 12 }}>
                        📄 DOCX
                      </a>
                    )}
                    {d.file_pdf && (
                      <a href={d.file_pdf} target="_blank" rel="noopener noreferrer" style={{ marginRight: 12 }}>
                        📑 PDF
                      </a>
                    )}
                    {d.zip_url && (
                      <a href={d.zip_url} target="_blank" rel="noopener noreferrer">
                        🗜️ ZIP
                      </a>
                    )}
                  </div>
                </div>
                <Popconfirm
                  title="Изтриване на документ"
                  description="Сигурни ли сте, че искате да изтриете този документ?"
                  okText="Да"
                  cancelText="Не"
                  onConfirm={() => handleDelete(d.id)}
                >
                  <Button danger size="small">Изтрий</Button>
                </Popconfirm>
              </li>
            ))}
          </ul>
        </Card>

        {/* Upload Modal */}
        <Modal
          title="Качи документ"
          open={uploadModalVisible}
          onOk={handleUpload}
          onCancel={() => {
            setUploadModalVisible(false);
            uploadForm.resetFields();
            setFileListDocx([]);
          }}
          confirmLoading={uploading}
          okText="Качи"
          cancelText="Отказ"
        >
          <Form form={uploadForm} layout="vertical">
            <Form.Item
              name="title"
              label="Заглавие на документ"
              rules={[{ required: true, message: 'Моля въведете заглавие' }]}
            >
              <Input placeholder="Напр: Проект X - Акт 14" />
            </Form.Item>

            <Form.Item label="DOCX файл">
              <Upload
                fileList={fileListDocx}
                onChange={({ fileList }) => setFileListDocx(fileList)}
                beforeUpload={() => false}
                accept=".docx,.doc"
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Избери DOCX</Button>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </div>
  );
}

// Mobile-specific styles
const mobileStyles = `
  @media (max-width: 768px) {
    .documents-page {
      padding: 12px !important;
    }
    
    .documents-page ul li {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 12px !important;
    }
    
    .documents-page ul li > div:first-child {
      width: 100%;
    }
    
    .documents-page .ant-card-extra {
      margin-top: 8px;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = mobileStyles;
  document.head.appendChild(styleEl);
}
