'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Task, TaskStatus, LifeArea } from '@/types';
import { toast } from 'sonner';

// ---- Types ----

export interface TaskFilters {
  status?: TaskStatus | 'all';
  lifeArea?: LifeArea | 'all';
  search?: string;
  sortBy?: 'priority' | 'dueDate' | 'created';
  page?: number;
  limit?: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
}

export interface UseTasksReturn {
  // Data
  tasks: Task[];
  stats: TaskStats;
  total: number;
  page: number;
  totalPages: number;
  
  // State
  isLoading: boolean;
  isStatsLoading: boolean;

  // Actions
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  addTask: (data: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleCompleteTask: (id: string, currentStatus: string) => Promise<boolean>;
  bulkAction: (action: 'delete' | 'complete' | 'updateStatus', ids: string[], status?: string) => Promise<boolean>;
  refreshStats: () => Promise<void>;
}

// ---- Hook ----

export function useTasks(initialFilters?: TaskFilters): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0, inProgress: 0, todo: 0, overdue: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Track current filters to refetch after mutations
  const currentFilters = useRef<TaskFilters>(initialFilters || {});

  // ---- Fetch tasks ----
  const fetchTasks = useCallback(async (filters?: TaskFilters) => {
    try {
      setIsLoading(true);
      const f = filters || currentFilters.current;
      currentFilters.current = f;

      const params = new URLSearchParams();
      if (f.status && f.status !== 'all') params.set('status', f.status);
      if (f.lifeArea && f.lifeArea !== 'all') params.set('lifeArea', f.lifeArea);
      if (f.search) params.set('search', f.search);
      if (f.sortBy) params.set('sortBy', f.sortBy);
      if (f.page) params.set('page', f.page.toString());
      if (f.limit) params.set('limit', f.limit.toString());

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch tasks');

      const data = await res.json();
      setTasks(data.tasks || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---- Fetch stats ----
  const refreshStats = useCallback(async () => {
    try {
      setIsStatsLoading(true);
      const res = await fetch('/api/tasks/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // ---- Add task ----
  const addTask = useCallback(async (data: Partial<Task>): Promise<Task | null> => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create task');
      }
      const task = await res.json();
      // Refetch to get correct sorted position
      await Promise.all([fetchTasks(), refreshStats()]);
      return task;
    } catch (error) {
      console.error('Failed to add task:', error);
      toast.error('Failed to create task');
      return null;
    }
  }, [fetchTasks, refreshStats]);

  // ---- Update task ----
  const updateTask = useCallback(async (id: string, data: Partial<Task>): Promise<Task | null> => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update task');
      }
      const task = await res.json();
      await Promise.all([fetchTasks(), refreshStats()]);
      return task;
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
      return null;
    }
  }, [fetchTasks, refreshStats]);

  // ---- Delete task (soft) ----
  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      await Promise.all([fetchTasks(), refreshStats()]);
      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
      return false;
    }
  }, [fetchTasks, refreshStats]);

  // ---- Toggle Complete task ----
  const toggleCompleteTask = useCallback(async (id: string, currentStatus: string): Promise<boolean> => {
    try {
      const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to toggle task completion');
      await Promise.all([fetchTasks(), refreshStats()]);
      return true;
    } catch (error) {
      console.error('Failed to toggle task:', error);
      toast.error('Failed to update task status');
      return false;
    }
  }, [fetchTasks, refreshStats]);

  // ---- Bulk action ----
  const bulkAction = useCallback(async (
    action: 'delete' | 'complete' | 'updateStatus',
    ids: string[],
    status?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids, status }),
      });
      if (!res.ok) throw new Error('Bulk operation failed');
      const data = await res.json();
      await Promise.all([fetchTasks(), refreshStats()]);
      return data.success;
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Bulk operation failed');
      return false;
    }
  }, [fetchTasks, refreshStats]);

  // ---- Initial fetch ----
  useEffect(() => {
    fetchTasks(initialFilters);
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    tasks,
    stats,
    total,
    page,
    totalPages,
    isLoading,
    isStatsLoading,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleCompleteTask,
    bulkAction,
    refreshStats,
  };
}
