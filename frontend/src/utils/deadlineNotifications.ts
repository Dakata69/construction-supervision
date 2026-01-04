import { api } from '../api/client';
import { notification } from 'antd';

type Task = {
  id: number;
  title: string;
  status?: string;
  due_date?: string | null;
  assigned_to?: any;
};

type AlertLog = Record<string, string>; // key -> ISO date last shown

function getAlertLog(): AlertLog {
  try {
    const raw = localStorage.getItem('task_deadline_alerts');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAlertLog(log: AlertLog) {
  try {
    localStorage.setItem('task_deadline_alerts', JSON.stringify(log));
  } catch {}
}

function daysUntil(dueISO: string): number {
  const now = new Date();
  const due = new Date(dueISO);
  // Normalize to midnight to avoid off-by-one jitter
  const msPerDay = 24 * 60 * 60 * 1000;
  const n = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const d = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  return Math.ceil((d - n) / msPerDay);
}

function shouldNotify(key: string): boolean {
  const log = getAlertLog();
  const last = log[key];
  const today = new Date().toISOString().slice(0, 10);
  if (last === today) return false; // already shown today
  log[key] = today;
  saveAlertLog(log);
  return true;
}

function notifyDue(task: Task, days: number) {
  const title = task.title || 'Без заглавие';
  if (days > 0) {
    notification.warning({
      message: 'Предстоящ срок',
      description: `Задачата "${title}" изтича след ${days} ${days === 1 ? 'ден' : 'дни'}.`,
      placement: 'bottomRight',
      duration: 6,
    });
  } else if (days === 0) {
    notification.error({
      message: 'Срокът е днес',
      description: `Задачата "${title}" има краен срок днес.`,
      placement: 'bottomRight',
      duration: 8,
    });
  } else {
    notification.error({
      message: 'Просрочена задача',
      description: `Задачата "${title}" е просрочена с ${Math.abs(days)} ${Math.abs(days) === 1 ? 'ден' : 'дни'}.`,
      placement: 'bottomRight',
      duration: 8,
    });
  }
}

export async function checkTaskDeadlines(currentUserId?: number) {
  try {
    const res = await api.get('/tasks');
    const data: Task[] = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.results)
        ? res.data.results
        : [];

    const openTasks = data.filter((t) => t.status !== 'completed' && t.due_date);
    for (const t of openTasks) {
      const dueISO = t.due_date as string;
      const d = daysUntil(dueISO);
      // Milestones: 7 days, 3 days, 1 day, due today (0), overdue (<0)
      const milestones = [7, 3, 1, 0];
      for (const m of milestones) {
        if (d === m) {
          const key = `${t.id}:DUE-${m}`;
          if (shouldNotify(key)) notifyDue(t, d);
        }
      }
      if (d < 0) {
        const key = `${t.id}:OVERDUE`;
        if (shouldNotify(key)) notifyDue(t, d);
      }
    }
  } catch (e) {
    // Best-effort only; do nothing on failure
  }
}

export function initTaskDeadlineAlerts(currentUserId?: number) {
  // Initial check shortly after app loads
  setTimeout(() => checkTaskDeadlines(currentUserId), 1500);
  // Re-check periodically (every 6 hours)
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  setInterval(() => checkTaskDeadlines(currentUserId), SIX_HOURS);
}
