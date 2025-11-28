# Template Placeholder Mapping Guide

## Instructions for Creating DOCX Templates

Since the system cannot directly create binary DOCX files, follow these steps:

### For Act 14 (act14_bg.docx):
1. Open Microsoft Word
2. Open the file: `act14_bg_TEMPLATE.txt`
3. Copy all content
4. Create a new Word document
5. Paste the content
6. Format as needed (fonts, spacing, alignment)
7. **Save as**: `backend\media\templates\act14_bg.docx`
8. Delete or move the old `act14_bg_OLD_BACKUP.docx` if testing is successful

### For Act 15 (act15_bg.docx):
1. Follow the same steps using `act15_bg_TEMPLATE.txt`
2. **Save as**: `backend\media\templates\act15_bg.docx`

---

## Act 14 Placeholder Mapping

### Available from Frontend Form (Act14Context):
- `{{project_name}}` - From project selection
- `{{project_location}}` - From project selection
- `{{client_name}}` - From project selection
- `{{designer_name}}` - Form field
- `{{contractor_name}}` - Form field
- `{{supervisor_name}}` - Form field
- `{{inspection_findings}}` - Form field
- `{{documentation}}` - Form field
- `{{conclusion}}` - Form field
- `{{notes}}` - Form field

### Additional Placeholders Needed (currently missing from form):
- `{{consultant_name}}` - Строителен надзор
- `{{act_date}}` - Дата на акта
- `{{tech_supervisor_name}}` - Технически правоспособно лице
- `{{additional_documents}}` - Допълнителни документи
- `{{defects_description}}` - Описание на недостатъци
- `{{designer_signature}}` - Подпис на проектант
- `{{contractor_signature}}` - Подпис на строител
- `{{supervisor_signature}}` - Подпис на надзор
- `{{consultant_footer}}` - Управител - строителен надзор

### Recommended Frontend Form Updates for Act 14:
Add these fields to the Act14Context interface and form:
```typescript
interface Act14Context extends DocumentContext {
  designer_name: string;
  contractor_name: string;
  supervisor_name: string;
  consultant_name: string; // NEW
  tech_supervisor_name: string; // NEW
  act_date: string; // NEW
  additional_documents: string; // NEW
  defects_description: string; // NEW
  inspection_findings: string;
  documentation: string;
  conclusion: string;
  notes: string;
}
```

---

## Act 15 Placeholder Mapping

### Available from Frontend Form (Act15Context):
- `{{project_name}}` - From project selection
- `{{project_location}}` - From project selection
- `{{client_name}}` - From project selection
- `{{contractor_name}}` - Form field
- `{{tech_supervisor_name}}` - Form field
- `{{supervisor_name}}` - Form field
- `{{start_date}}` - Form field
- `{{end_date}}` - Form field
- `{{execution_details}}` - Form field
- `{{documentation}}` - Form field
- `{{deviations}}` - Form field
- `{{conclusion}}` - Form field
- `{{notes}}` - Form field

### Additional Placeholders Needed (currently missing from form):
- `{{designer_name}}` - Проектант
- `{{consultant_name}}` - Консултант (строителен надзор)
- `{{act_date}}` - Дата на акта
- `{{client_representative}}` - Представител на възложител
- `{{designer_company}}` - Фирмена регистрация на проектант
- `{{designer_representative}}` - Представител на проектант
- `{{contractor_representative}}` - Представител на строител
- `{{contractor_part1}}` - Строител по част 1
- `{{contractor_part2}}` - Строител по част 2
- `{{permit_number}}` - Номер на разрешение за строеж
- `{{permit_date}}` - Дата на разрешение
- `{{permit_issuer}}` - Издател на разрешение
- `{{municipality}}` - Община/район
- `{{legalization_number}}` - Номер на акт за узаконяване
- `{{legalization_date}}` - Дата на узаконяване
- `{{legalization_municipality}}` - Община за узаконяване
- `{{approval_date}}` - Дата на одобрение на проекти
- `{{approval_authority}}` - Орган одобрил проектите
- `{{approved_projects}}` - Одобрени проекти
- `{{construction_contracts}}` - Договори за строителство
- `{{documentation_findings}}` - Констатации по документация
- `{{execution_findings}}` - Констатации по изпълнение
- `{{site_condition}}` - Състояние на площадка
- `{{surrounding_condition}}` - Състояние на околно пространство
- `{{defect_removal_start}}` - Начална дата за отстраняване на недостатъци
- `{{defect_description}}` - Описание на недостатъци
- `{{defect_removal_deadline}}` - Краен срок за отстраняване
- `{{temporary_removal_deadline}}` - Срок за премахване на временни сгради
- `{{temporary_removal_location}}` - Местоположение на временни сгради
- `{{attached_documents_a}}` - Приложени документи (а)
- `{{attached_documents_b}}` - Приложени документи (б)
- `{{authorized_representative}}` - Упълномощено лице
- `{{handover_notes}}` - Бележки за предаване
- `{{client_signature}}` - Подпис на възложител
- `{{designer_signature}}` - Подпис на проектант
- `{{contractor_signature}}` - Подпис на строител
- `{{consultant_signature}}` - Подпис на консултант

### Recommended Frontend Form Updates for Act 15:
Act 15 is much more complex. Consider adding these essential fields:
```typescript
interface Act15Context extends DocumentContext {
  contractor_name: string;
  designer_name: string; // NEW
  consultant_name: string; // NEW
  tech_supervisor_name: string;
  supervisor_name: string;
  act_date: string; // NEW
  permit_number: string; // NEW
  permit_date: string; // NEW
  start_date: string;
  end_date: string;
  execution_details: string;
  documentation_findings: string; // NEW (renamed from documentation)
  execution_findings: string; // NEW
  site_condition: string; // NEW
  surrounding_condition: string; // NEW
  deviations: string;
  conclusion: string;
  notes: string;
}
```

---

## Empty Placeholder Handling

The system automatically replaces empty placeholders with blank space:
- If a field is not filled or is empty, `{{field_name}}` will be replaced with `""`
- This prevents ugly `{{field_name}}` text from appearing in generated documents
- No action needed for this - it's handled in `document_generator.py`

---

## Next Steps

1. **Create DOCX files**: Use the .txt templates to create proper .docx files in Word
2. **Test generation**: Generate Act 14 and Act 15 documents to verify formatting
3. **Update frontend forms**: Add missing fields to capture all required data
4. **Iterate**: Adjust template formatting in Word as needed for proper appearance
