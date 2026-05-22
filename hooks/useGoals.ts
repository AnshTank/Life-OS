'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Goal, Milestone, LifeArea, GoalCategory, GoalStatus } from '@/types';
import { toast } from 'sonner';

export interface UseGoalsReturn {
  goals: Goal[];
  isLoading: boolean;
  
  fetchGoals: (filters?: { lifeArea?: LifeArea | 'all'; category?: GoalCategory | 'all'; status?: GoalStatus | 'all'; search?: string }) => Promise<void>;
  addGoal: (data: Partial<Goal>) => Promise<Goal | null>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<Goal | null>;
  deleteGoal: (id: string) => Promise<boolean>;
  toggleMilestone: (goalId: string, milestoneId: string) => Promise<boolean>;
}

export function useGoals(initialFetch = true): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoals = useCallback(async (filters?: { lifeArea?: string; category?: string; status?: string; search?: string }) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters?.lifeArea && filters.lifeArea !== 'all') params.set('lifeArea', filters.lifeArea);
      if (filters?.category && filters.category !== 'all') params.set('category', filters.category);
      if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);

      const res = await fetch(`/api/goals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch goals');
      const data = await res.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addGoal = useCallback(async (data: Partial<Goal>): Promise<Goal | null> => {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create goal');
      const newGoal = await res.json();
      await fetchGoals();
      return newGoal;
    } catch (error) {
      console.error('Failed to add goal:', error);
      toast.error('Failed to create goal');
      return null;
    }
  }, [fetchGoals]);

  const updateGoal = useCallback(async (id: string, data: Partial<Goal>): Promise<Goal | null> => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update goal');
      const updatedGoal = await res.json();
      await fetchGoals();
      return updatedGoal;
    } catch (error) {
      console.error('Failed to update goal:', error);
      toast.error('Failed to update goal');
      return null;
    }
  }, [fetchGoals]);

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete goal');
      await fetchGoals();
      return true;
    } catch (error) {
      console.error('Failed to delete goal:', error);
      toast.error('Failed to delete goal');
      return false;
    }
  }, [fetchGoals]);

  const toggleMilestone = useCallback(async (goalId: string, milestoneId: string): Promise<boolean> => {
    try {
      // Optimistic Update
      setGoals(current => current.map(goal => {
        if (goal.id === goalId) {
          const updatedMilestones = goal.milestones.map(m => 
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          );
          const completedCount = updatedMilestones.filter(m => m.completed).length;
          const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);
          
          let newStatus = goal.status;
          if (newProgress === 100) newStatus = 'completed';
          else if (newProgress < 100 && goal.status === 'completed') newStatus = 'active';

          return { ...goal, milestones: updatedMilestones, progress: newProgress, status: newStatus };
        }
        return goal;
      }));

      const res = await fetch(`/api/goals/${goalId}/milestone/${milestoneId}`, {
        method: 'PATCH',
      });
      
      if (!res.ok) {
        throw new Error('Failed to toggle milestone');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to toggle milestone:', error);
      toast.error('Failed to update milestone status');
      // Revert optimism on error by fetching real data
      await fetchGoals();
      return false;
    }
  }, [fetchGoals]);

  useEffect(() => {
    if (initialFetch) {
      fetchGoals();
    }
  }, [initialFetch, fetchGoals]);

  return {
    goals,
    isLoading,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,
  };
}
