import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';

// Analytics
export interface AnalyticsDashboard {
  projects: {
    total: number;
    active: number;
    recent: Array<{
      id: number;
      name: string;
      created_at: string;
      end_date: string | null;
    }>;
  };
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    completion_rate: number;
  };
  budget: {
    total_budget: number;
    total_spent: number;
    remaining: number;
    over_budget_projects: number;
  };
  top_expense_categories: Array<{
    category: string;
    total: number;
  }>;
}

// Budget
export interface ProjectBudget {
  id: number;
  project: number;
  initial_budget: string;
  currency: string;
  notes: string;
  total_expenses: string;
  remaining_budget: string;
  budget_usage_percentage: number;
  is_over_budget: boolean;
  expenses: BudgetExpense[];
  created_at: string;
  updated_at: string;
}

export interface BudgetExpense {
  id: number;
  budget: number;
  category: string;
  category_display: string;
  description: string;
  amount: string;
  date: string;
  invoice_number: string;
  vendor: string;
  notes: string;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

// Weather
export interface WeatherLog {
  id: number;
  project: number;
  date: string;
  temperature_min: number | null;
  temperature_max: number | null;
  condition: string;
  precipitation: number | null;
  wind_speed: number | null;
  humidity: number | null;
  work_stopped: boolean;
  impact_notes: string;
  is_unfavorable: boolean;
  api_source: string;
  created_at: string;
  updated_at: string;
}

// Reminders
export interface Reminder {
  id: number;
  reminder_type: string;
  reminder_type_display: string;
  title: string;
  message: string;
  project: number | null;
  project_name: string | null;
  task: number | null;
  task_title: string | null;
  trigger_date: string;
  sent_at: string | null;
  recipient: number;
  recipient_name: string;
  status: string;
  status_display: string;
  push_sent: boolean;
  created_at: string;
  updated_at: string;
}

// Analytics Dashboard
export const useAnalyticsDashboard = () => {
  return useQuery<AnalyticsDashboard>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard/');
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
};

// Budgets
export const useProjectBudget = (projectId: number) => {
  return useQuery<ProjectBudget>({
    queryKey: ['budgets', 'project', projectId],
    queryFn: async () => {
      const response = await api.get(`/budgets/?project=${projectId}`);
      return response.data.results?.[0] || response.data[0];
    },
    enabled: !!projectId,
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProjectBudget>) => {
      const response = await api.post('/budgets/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<BudgetExpense>) => {
      const response = await api.post('/expenses/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};

export const useExpenses = (budgetId?: number, projectId?: number) => {
  return useQuery<BudgetExpense[]>({
    queryKey: ['expenses', budgetId, projectId],
    queryFn: async () => {
      let url = '/expenses/';
      const params = new URLSearchParams();
      if (budgetId) params.append('budget', budgetId.toString());
      if (projectId) params.append('project', projectId.toString());
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await api.get(url);
      return response.data.results || response.data;
    },
  });
};

// Weather
export const useWeatherLogs = (projectId: number) => {
  return useQuery<WeatherLog[]>({
    queryKey: ['weather', projectId],
    queryFn: async () => {
      const response = await api.get(`/weather/?project=${projectId}`);
      return response.data.results || response.data;
    },
    enabled: !!projectId,
  });
};

export const useCreateWeatherLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<WeatherLog>) => {
      const response = await api.post('/weather/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weather'] });
    },
  });
};

// Reminders
export const usePendingReminders = () => {
  return useQuery<Reminder[]>({
    queryKey: ['reminders', 'pending'],
    queryFn: async () => {
      const response = await api.get('/reminders/pending/');
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useDismissReminder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reminderId: number) => {
      const response = await api.post(`/reminders/${reminderId}/dismiss/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });
};

// Bulgarian ID Validation
export const useValidateBulgarianId = () => {
  return useMutation({
    mutationFn: async (data: { type: 'bulstat' | 'vat' | 'egn'; value: string }) => {
      const response = await api.post('/validate/bulgarian-id/', data);
      return response.data;
    },
  });
};
