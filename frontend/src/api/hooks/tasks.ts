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
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<any[]>(['tasks']);
      const optimisticTask = {
        ...newTask,
        id: `temp-${Date.now()}`,
        optimistic: true,
      };
      queryClient.setQueryData<any[]>(['tasks'], (old = []) => [...old, optimisticTask]);

      let previousProjectTasks: any[] | undefined;
      if (newTask?.project) {
        await queryClient.cancelQueries({ queryKey: ['projects', newTask.project, 'tasks'] });
        previousProjectTasks = queryClient.getQueryData<any[]>(['projects', newTask.project, 'tasks']);
        queryClient.setQueryData<any[]>(['projects', newTask.project, 'tasks'], (old = []) => [...old, optimisticTask]);
      }

      return { previousTasks, previousProjectTasks, projectId: newTask?.project };
    },
    onError: (_err, _newTask, context) => {
      if (!context) return;
      queryClient.setQueryData(['tasks'], context.previousTasks ?? []);
      if (context.projectId) {
        queryClient.setQueryData(['projects', context.projectId, 'tasks'], context.previousProjectTasks ?? []);
      }
    },
    onSuccess: (data, _vars, context) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (data?.project) {
        queryClient.invalidateQueries({
          queryKey: ['projects', data.project, 'tasks'],
        });
      }
      // Replace optimistic entry in project tasks if present
      if (context?.projectId) {
        queryClient.setQueryData<any[]>(['projects', context.projectId, 'tasks'], (old = []) => {
          return old.map((t) => (t.id?.toString().startsWith('temp-') ? data : t));
        });
      }
    },
  });
};

export const useUpdateTask = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.put(`/tasks/${id}`, data).then((res) => res.data),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', id] });
      const previousTask = queryClient.getQueryData<any>(['tasks', id]);
      queryClient.setQueryData(['tasks', id], { ...previousTask, ...updates });

      const projectId = previousTask?.project || updates?.project;
      let previousProjectTasks: any[] | undefined;
      if (projectId) {
        await queryClient.cancelQueries({ queryKey: ['projects', projectId, 'tasks'] });
        previousProjectTasks = queryClient.getQueryData<any[]>(['projects', projectId, 'tasks']);
        queryClient.setQueryData<any[]>(['projects', projectId, 'tasks'], (old = []) =>
          old.map((t) => (t.id === previousTask?.id ? { ...t, ...updates } : t))
        );
      }

      return { previousTask, previousProjectTasks, projectId };
    },
    onError: (_err, _updates, context) => {
      if (!context) return;
      queryClient.setQueryData(['tasks', id], context.previousTask);
      if (context.projectId) {
        queryClient.setQueryData(['projects', context.projectId, 'tasks'], context.previousProjectTasks ?? []);
      }
    },
    onSuccess: (data, _vars, context) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      if (data?.project) {
        queryClient.invalidateQueries({
          queryKey: ['projects', data.project, 'tasks'],
        });
      }
      if (context?.projectId) {
        queryClient.setQueryData<any[]>(['projects', context.projectId, 'tasks'], (old = []) =>
          old.map((t) => (t.id === data.id ? data : t))
        );
      }
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