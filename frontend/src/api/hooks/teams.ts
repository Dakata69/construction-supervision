import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => api.get('/teams').then((res) => res.data),
  });
};

export const useTeam = (id: string | undefined) => {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => api.get(`/teams/${id}`).then((res) => res.data),
    enabled: !!id,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.post('/teams', data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useUpdateTeam = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.put(`/teams/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', id] });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/teams/${id}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useTeamMembers = (teamId: string | undefined) => {
  return useQuery({
    queryKey: ['teams', teamId, 'members'],
    queryFn: () =>
      api.get(`/teams/${teamId}/members`).then((res) => res.data),
    enabled: !!teamId,
  });
};

export const useAddTeamMember = (teamId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api.post(`/teams/${teamId}/add_member`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teams', teamId, 'members'],
      });
    },
  });
};

export const useRemoveTeamMember = (teamId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/teams/${teamId}/members/${memberId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['teams', teamId, 'members'],
      });
    },
  });
};