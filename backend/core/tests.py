from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()

class DocumentGenerationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_generate_act14(self):
        """Test generating Act 14 document"""
        url = reverse('document-generate')
        payload = {
            'template_name': 'act14_bg.docx',
            'context': {
                'project_name': 'Test Project',
                'date': '01.11.2025',
                'location': 'Test Location',
                'client_name': 'Test Client',
                'permit_number': 'TEST-123',
                'permit_date': '01.01.2025',
                'designer_name': 'Test Designer',
                'contractor_name': 'Test Contractor',
                'supervisor_name': 'Test Supervisor',
                'inspection_findings': 'Test findings',
                'documentation': 'Test documentation',
                'conclusion': 'Test conclusion',
                'notes': 'Test notes'
            }
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('docx', response.data)
        self.assertIn('pdf', response.data)