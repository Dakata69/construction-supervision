import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export interface Document {
  id: number;
  title: string;
  file_docx: string | null;
  file_pdf: string | null;
  zip_url: string | null;
  created_at: string;
  updated_at: string;
}

// Get all documents
export const useDocuments = () => {
  return useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await api.get('/documents/');
      return response.data;
    },
  });
};

// Get project linked documents
export const useProjectDocuments = (projectId?: string) => {
  return useQuery<Document[]>({
    queryKey: ['projects', projectId, 'linked-documents'],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await api.get(`/projects/${projectId}/linked_documents/`);
      return response.data;
    },
    enabled: !!projectId,
  });
};

// Link document to project
export const useLinkDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, documentId }: { projectId: string; documentId: number }) => {
      const response = await api.post(`/projects/${projectId}/link_document/`, {
        document_id: documentId,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'linked-documents'] });
    },
  });
};

// Unlink document from project
export const useUnlinkDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, documentId }: { projectId: string; documentId: number }) => {
      const response = await api.post(`/projects/${projectId}/unlink_document/`, {
        document_id: documentId,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'linked-documents'] });
    },
  });
};
