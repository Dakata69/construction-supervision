import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

// Fetch all acts (optionally filtered by project or act_type)
export const useActs = (projectId?: string, actType?: string) => {
  return useQuery({
    queryKey: ['acts', projectId, actType],
    queryFn: () => {
      const params: any = {};
      if (projectId) params.project = projectId;
      if (actType) params.act_type = actType;
      return api.get('/acts', { params }).then((res) => {
        const data = res.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
      });
    },
  });
};

// Fetch single act by ID
export const useAct = (id: string | undefined) => {
  return useQuery({
    queryKey: ['acts', id],
    queryFn: () => api.get(`/acts/${id}`).then((res) => res.data),
    enabled: !!id,
  });
};

// Generate act (POST /acts/generate)
export const useGenerateAct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.post('/acts/generate', data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acts'] });
    },
  });
};

// Update act
export const useUpdateAct = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.put(`/acts/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acts', id] });
      queryClient.invalidateQueries({ queryKey: ['acts'] });
    },
  });
};

// Delete act
export const useDeleteAct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/acts/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acts'] });
    },
  });
};
