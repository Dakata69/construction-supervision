import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

// Projects
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then((res) => {
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    }),
  });
};

export const useProject = (id: string | undefined) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.get(`/projects/${id}`).then((res) => res.data),
    enabled: !!id,
  });
};

export const useProjectTasks = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: () =>
      api.get(`/tasks?project=${projectId}`).then((res) => {
        const data = res.data;
        if (Array.isArray(data)) return data; // non-paginated
        if (data && Array.isArray(data.results)) return data.results; // paginated DRF
        return []; // fallback to empty array
      }),
    enabled: !!projectId,
  });
};

export const useProjectTeams = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['projects', projectId, 'teams'],
    queryFn: () =>
      api.get(`/projects/${projectId}/teams`).then((res) => res.data),
    enabled: !!projectId,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.post('/projects', data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.put(`/projects/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/projects/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};