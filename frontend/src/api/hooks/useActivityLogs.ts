import { useQuery } from '@tanstack/react-query';
import { api } from '../client';

export interface ActivityLog {
  id: number;
  user: number;
  username: string;
  action_type: string;
  action_display: string;
  description: string;
  content_type: string;
  object_id: number | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UpcomingTask {
  id: number;
  project: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: number | null;
  assigned_to_name: string | null;
  due_date: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
}

/**
 * Hook to fetch recent activity logs for dashboard
 * @param limit - Number of recent activities to fetch (default: 10)
 */
export const useRecentActivities = (limit: number = 10) => {
  return useQuery<ActivityLog[]>({
    queryKey: ['activities', 'recent', limit],
    queryFn: async () => {
      const response = await api.get(`/activity-logs/recent/?limit=${limit}`);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

/**
 * Hook to fetch upcoming tasks for dashboard
 * @param limit - Number of tasks to fetch (default: 10)
 * @param days - Number of days ahead to look (default: 30)
 */
export const useUpcomingTasks = (limit: number = 10, days: number = 30) => {
  return useQuery<UpcomingTask[]>({
    queryKey: ['tasks', 'upcoming', limit, days],
    queryFn: async () => {
      const response = await api.get(`/tasks/upcoming/?limit=${limit}&days=${days}`);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};
