import { useState, useCallback } from 'react';
import { Habit } from '@/types';
import { toast } from 'sonner';

interface UseHabitsOptions {
  lifeArea?: string;
  search?: string;
}

export function useHabits(initialOptions?: UseHabitsOptions) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async (options?: UseHabitsOptions) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      const lifeArea = options?.lifeArea || initialOptions?.lifeArea;
      const search = options?.search || initialOptions?.search;
      
      if (lifeArea && lifeArea !== 'all') params.append('lifeArea', lifeArea);
      if (search) params.append('search', search);

      const url = `/api/habits${params.toString() ? `?${params.toString()}` : ''}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch habits');
      
      const data = await res.json();
      setHabits(data.habits || []);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  }, [initialOptions]);

  const addHabit = async (habitData: Partial<Habit>) => {
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitData),
      });

      if (!res.ok) throw new Error('Failed to create habit');
      
      toast.success('Habit created successfully');
      await fetchHabits();
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Failed to update habit');
      
      toast.success('Habit updated successfully');
      await fetchHabits();
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete habit');
      
      toast.success('Habit deleted successfully');
      await fetchHabits();
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  // Toggle check-in for boolean habits, or add a unit for quantifiable habits
  const toggleCheckin = async (habitId: string, date: Date, note?: string, value: number = 1) => {
    try {
      // Optimistic update for boolean habits
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      const habit = habits.find(h => h.id === habitId);
      if (habit && habit.habitType !== 'quantifiable') {
        // Boolean optimistic update
        setHabits(prev => prev.map((h: Habit) => {
          if (h.id === habitId) {
            const hasCheckedIn = h.checkins?.some(c => {
               const cDate = new Date(c.date);
               cDate.setHours(0,0,0,0);
               return cDate.getTime() === normalizedDate.getTime();
            });
            
            let newCheckins = [...(h.checkins || [])];
            if (hasCheckedIn) {
              newCheckins = newCheckins.filter(c => {
                 const cDate = new Date(c.date);
                 cDate.setHours(0,0,0,0);
                 return cDate.getTime() !== normalizedDate.getTime();
              });
            } else {
              newCheckins.push({
                 id: 'temp-' + Date.now(),
                 date,
                 note,
                 value: 1,
              } as any);
            }

            return { ...h, checkins: newCheckins };
          }
          return h;
        }));
      }

      const res = await fetch(`/api/habits/${habitId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: date.toISOString(), note, value }),
      });

      if (!res.ok) throw new Error('Failed to toggle checkin');
      
      const updatedHabit = await res.json();
      setHabits(prev => prev.map((h: Habit) => h.id === habitId ? updatedHabit : h));
    } catch (error: any) {
      toast.error(error.message);
      await fetchHabits();
      throw error;
    }
  };

  // Remove a specific check-in by ID (for quantifiable habits)
  const removeCheckin = async (habitId: string, checkinId: string) => {
    try {
      // Optimistic: remove from local state
      setHabits(prev => prev.map((h: Habit) => {
        if (h.id === habitId) {
          return { ...h, checkins: h.checkins.filter(c => c.id !== checkinId) };
        }
        return h;
      }));

      const res = await fetch(`/api/habits/${habitId}/checkin?checkinId=${checkinId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove checkin');
      
      const updatedHabit = await res.json();
      setHabits(prev => prev.map((h: Habit) => h.id === habitId ? updatedHabit : h));
    } catch (error: any) {
      toast.error(error.message);
      await fetchHabits();
      throw error;
    }
  };

  return {
    habits,
    isLoading,
    error,
    fetchHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCheckin,
    removeCheckin,
  };
}
