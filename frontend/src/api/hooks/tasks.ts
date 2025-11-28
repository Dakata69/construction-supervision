import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then((res) => res.data),
  });
};

export const useTask = (id: string | undefined) => {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get(`/tasks/${id}`).then((res) => res.data),
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.post('/tasks', data).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({
        queryKey: ['projects', data.project, 'tasks'],
      });
    },
  });
};

export const useUpdateTask = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.put(`/tasks/${id}`, data).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({
        queryKey: ['projects', data.project, 'tasks'],
      });
    },
  });
};

export const useTaskComments = (taskId: string | undefined) => {
  return useQuery({
    queryKey: ['tasks', taskId, 'comments'],
    queryFn: () =>
      api.get(`/tasks/${taskId}/comments`).then((res) => res.data),
    enabled: !!taskId,
  });
};

export const useAddTaskComment = (taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.post(`/tasks/${taskId}/add_comment`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', taskId, 'comments'],
      });
    },
  });
};

export const useCompleteTask = (taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post(`/tasks/${taskId}/complete`).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({
        queryKey: ['projects', data.project, 'tasks'],
      });
    },
  });
};