"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { 
  Task, Goal, Habit, Investment, Transaction, 
  Budget, EMI, SIP, Project, PartnerConnection,
  User, Notification, DashboardStats, LifeArea,
  TaskStatus, GoalStatus, GoalCategory,
  JournalEntry, JournalBook, JournalEntryType, JournalMood,
  SavingsGoal, Subscription, PurchaseLog
} from '@/types';
import { 
  mockTasks, mockGoals, mockHabits, mockInvestments, 
  mockTransactions, mockBudgets, mockEMIs, mockSIPs, 
  mockProjects, mockPartner, currentUser, 
  mockNotifications, mockDashboardStats,
  mockJournalEntries, mockJournalBooks
} from '@/data/mockData';
import { toast } from 'sonner';

// Font settings
export type FontFamily = 'kalam' | 'caveat' | 'indie' | 'patrick' | 'architects';

interface FontSettings {
  family: FontFamily;
  size: number;
}

interface AppContextType {
  // User & Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  
  // Font Settings
  fontSettings: FontSettings;
  updateFontSettings: (settings: Partial<FontSettings>) => void;
  
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  getTasksByArea: (area: LifeArea) => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTodayTasks: () => Task[];
  getUpcomingTasks: (days: number) => Task[];
  
  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  completeMilestone: (goalId: string, milestoneId: string) => void;
  addMilestone: (goalId: string, title: string) => void;
  getGoalsByArea: (area: LifeArea) => Goal[];
  getGoalsByCategory: (category: GoalCategory) => Goal[];
  getGoalsByStatus: (status: GoalStatus) => Goal[];
  
  // Habits
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'streak' | 'longestStreak' | 'completedDates'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  completeHabit: (id: string, note?: string) => void;
  getHabitStats: (id: string) => { completionRate: number; weeklyProgress: number[] };
  
  // Money
  investments: Investment[];
  transactions: Transaction[];
  budgets: Budget[];
  emis: EMI[];
  sips: SIP[];
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  addEMI: (emi: Omit<EMI, 'id'>) => void;
  addSIP: (sip: Omit<SIP, 'id' | 'totalInvested' | 'projectedValue'>) => void;
  getMonthlySummary: () => { income: number; expenses: number; savings: number };
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, 'id'>) => void;
  deleteSubscription: (id: string) => void;
  purchaseLogs: PurchaseLog[];
  addPurchaseLog: (log: Omit<PurchaseLog, 'id'>) => void;
  deletePurchaseLog: (id: string) => void;
  
  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  

  // Partner
  partner: PartnerConnection | null;
  invitePartner: (email: string) => void;
  acceptPartner: (id: string) => void;
  shareGoalWithPartner: (goalId: string) => void;
  shareTaskWithPartner: (taskId: string) => void;
  
  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  
  // Journal
  journalEntries: JournalEntry[];
  journalBooks: JournalBook[];
  activeBookId: string | null;
  setActiveBookId: (id: string | null) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  addJournalBook: (book: Omit<JournalBook, 'id' | 'createdAt'>) => void;
  updateJournalBook: (id: string, updates: Partial<JournalBook>) => void;
  deleteJournalBook: (id: string) => void;
  
  // Stats
  stats: DashboardStats;
  refreshStats: () => void;
  
  // AI
  aiMessages: { role: 'user' | 'assistant'; content: string; timestamp: Date }[];
  sendAIMessage: (message: string) => Promise<void>;
  clearAIChat: () => void;
  getAIInsights: () => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Static credentials for simple auth
const STATIC_CREDENTIALS = {
  email: 'admin@lifeos.com',
  password: 'lifeos123',
};
const AUTH_STORAGE_KEY = 'life_os_auth';

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Font Settings
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    family: 'kalam',
    size: 16,
  });
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>(mockInvestments);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
  const [emis, setEmis] = useState<EMI[]>(mockEMIs);
  const [sips, setSips] = useState<SIP[]>(mockSIPs);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([
    { id: 'sg-1', userId: 'user-1', name: 'MacBook Pro', targetAmount: 200000, currentSaved: 65000, deadline: new Date('2026-12-31'), priority: 'high', color: '#7a9eb8', icon: '💻', monthlySavingTarget: 15000, createdAt: new Date(), updatedAt: new Date() },
    { id: 'sg-2', userId: 'user-1', name: 'Emergency Fund', targetAmount: 300000, currentSaved: 180000, priority: 'high', color: '#22c55e', icon: '🛡️', monthlySavingTarget: 20000, createdAt: new Date(), updatedAt: new Date() },
    { id: 'sg-3', userId: 'user-1', name: 'Euro Trip', targetAmount: 500000, currentSaved: 120000, deadline: new Date('2027-06-01'), priority: 'medium', color: '#a855f7', icon: '✈️', monthlySavingTarget: 25000, createdAt: new Date(), updatedAt: new Date() },
  ]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    { id: 'sub-1', userId: 'user-1', name: 'Netflix', amount: 649, frequency: 'monthly', category: 'Entertainment', startDate: new Date('2024-01-01'), nextBillingDate: new Date('2026-05-15'), isActive: true },
    { id: 'sub-2', userId: 'user-1', name: 'Spotify', amount: 119, frequency: 'monthly', category: 'Entertainment', startDate: new Date('2023-06-01'), nextBillingDate: new Date('2026-05-10'), isActive: true },
    { id: 'sub-3', userId: 'user-1', name: 'ChatGPT Plus', amount: 1650, frequency: 'monthly', category: 'Productivity', startDate: new Date('2024-03-01'), nextBillingDate: new Date('2026-05-01'), isActive: true },
    { id: 'sub-4', userId: 'user-1', name: 'iCloud 200GB', amount: 219, frequency: 'monthly', category: 'Cloud', startDate: new Date('2022-01-01'), nextBillingDate: new Date('2026-05-20'), isActive: true },
    { id: 'sub-5', userId: 'user-1', name: 'GitHub Pro', amount: 300, frequency: 'monthly', category: 'Productivity', startDate: new Date('2024-08-01'), nextBillingDate: new Date('2026-05-08'), isActive: true },
  ]);
  const [purchaseLogs, setPurchaseLogs] = useState<PurchaseLog[]>([
    { id: 'pl-1', userId: 'user-1', name: 'Sony WH-1000XM5', amount: 24990, date: new Date('2026-02-15'), category: 'Electronics', satisfactionRating: 5, notes: 'Best headphones ever' },
    { id: 'pl-2', userId: 'user-1', name: 'Office Chair', amount: 15000, date: new Date('2026-01-10'), category: 'Furniture', satisfactionRating: 4 },
  ]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [partner, setPartner] = useState<PartnerConnection | null>(mockPartner);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [stats, setStats] = useState<DashboardStats>(mockDashboardStats);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalBooks, setJournalBooks] = useState<JournalBook[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);

  // Fetch initial data — journals + all entries
  useEffect(() => {
    fetch('/api/journals')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setJournalBooks(data);
      })
      .catch(err => console.error("Failed to fetch journals:", err));

    fetch('/api/entries')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setJournalEntries(data);
      })
      .catch(err => console.error("Failed to fetch entries:", err));

    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(err => console.error("Failed to fetch projects:", err));

    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.tasks)) setTasks(data.tasks);
      })
      .catch(err => console.error("Failed to fetch tasks:", err));

    fetch('/api/goals')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.goals)) setGoals(data.goals);
      })
      .catch(err => console.error("Failed to fetch goals:", err));

    fetch('/api/habits')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.habits)) {
          const formattedHabits = data.habits.map((h: any) => ({
            ...h,
            completedDates: h.checkins ? h.checkins.map((c: any) => c.date) : []
          }));
          setHabits(formattedHabits);
        }
      })
      .catch(err => console.error("Failed to fetch habits:", err));
  }, []);

  // Refetch entries for active book (or all if deselected)
  useEffect(() => {
    const url = activeBookId ? `/api/entries?bookId=${activeBookId}` : '/api/entries';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setJournalEntries(data);
      })
      .catch(err => console.error("Failed to fetch entries:", err));
  }, [activeBookId]);

  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([
    { role: 'assistant', content: 'Hello! I\'m JARVIS, your Life OS companion. I can help you with tasks, goals, investments, and more. What would you like to know?', timestamp: new Date() }
  ]);

  // Apply font settings to body
  useEffect(() => {
    document.body.style.fontFamily = fontSettings.family === 'kalam' ? "'Kalam', cursive" :
      fontSettings.family === 'caveat' ? "'Caveat', cursive" :
      fontSettings.family === 'indie' ? "'Indie Flower', cursive" :
      fontSettings.family === 'patrick' ? "'Patrick Hand', cursive" :
      "'Architects Daughter', cursive";
    document.body.style.fontSize = `${fontSettings.size}px`;
  }, [fontSettings]);

  // Calculate Priority Score
  const calculatePriorityScore = (impact: number, urgency: number, effort: number): number => {
    return Math.round((impact * 0.4 + urgency * 0.4 + (10 - effort) * 0.2) * 10) / 10;
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored === 'true') {
        setUser(currentUser);
        setIsAuthenticated(true);
      }
    } catch {
      // localStorage unavailable (SSR / private browsing)
    }
  }, []);

  // Auth Actions
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (
      email.toLowerCase() === STATIC_CREDENTIALS.email &&
      password === STATIC_CREDENTIALS.password
    ) {
      setUser(currentUser);
      setIsAuthenticated(true);
      try { localStorage.setItem(AUTH_STORAGE_KEY, 'true'); } catch {}
      toast.success('Welcome to your Life Journal!');
      return true;
    }
    toast.error('Invalid email or password');
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch {}
    toast.info('See you soon!');
  }, []);

  const updateUserProfile = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    toast.success('Profile updated!');
  }, []);

  const updateFontSettings = useCallback((settings: Partial<FontSettings>) => {
    setFontSettings(prev => ({ ...prev, ...settings }));
  }, []);

  // Task Actions
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore'>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!response.ok) throw new Error('Failed to create task');
      const newTask = await response.json();
      setTasks(prev => [newTask, ...prev]);
      toast.success('Task added!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add task');
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    // Optimistic UI update
    setTasks(prev => prev.map(task => {
      if (task.id !== id) return task;
      const newImpact = updates.impact ?? task.impact;
      const newUrgency = updates.urgency ?? task.urgency;
      const newEffort = updates.effort ?? task.effort;
      return {
        ...task,
        ...updates,
        priorityScore: calculatePriorityScore(newImpact, newUrgency, newEffort),
        updatedAt: new Date(),
      };
    }));

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update task');
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync task update');
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    toast.success('Task deleted');
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const completeTask = useCallback(async (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, status: 'completed' as TaskStatus, completedAt: new Date(), updatedAt: new Date() }
        : task
    ));
    toast.success('Task completed! ✓', { icon: '✓' });
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const getTasksByArea = useCallback((area: LifeArea) => {
    return tasks.filter(task => task.lifeArea === area);
  }, [tasks]);

  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  const getTodayTasks = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(task => {
      if (task.scheduledFor) {
        const scheduled = new Date(task.scheduledFor);
        return scheduled >= today && scheduled < tomorrow;
      }
      if (task.dueDate) {
        const due = new Date(task.dueDate);
        return due >= today && due < tomorrow;
      }
      return false;
    }).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  }, [tasks]);

  const getUpcomingTasks = useCallback((days: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const future = new Date(today);
    future.setDate(future.getDate() + days);
    
    return tasks.filter(task => {
      if (task.dueDate) {
        const due = new Date(task.dueDate);
        return due >= today && due <= future && task.status !== 'completed';
      }
      return false;
    }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [tasks]);

  // Goal Actions
  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      });
      if (!response.ok) throw new Error('Failed to create goal');
      const newGoal = await response.json();
      setGoals(prev => [newGoal, ...prev]);
      toast.success('Goal created! Let\'s make it happen!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add goal');
    }
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id 
        ? { ...goal, ...updates, updatedAt: new Date() }
        : goal
    ));
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update goal');
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync goal update');
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
    toast.success('Goal deleted');
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const completeMilestone = useCallback(async (goalId: string, milestoneId: string) => {
    let updatedMilestones: any[] = [];
    let progress = 0;
    setGoals(prev => prev.map(goal => {
      if (goal.id !== goalId) return goal;
      updatedMilestones = goal.milestones.map(m => 
        m.id === milestoneId 
          ? { ...m, completed: true, completedAt: new Date() }
          : m
      );
      const completedCount = updatedMilestones.filter(m => m.completed).length;
      progress = Math.round((completedCount / updatedMilestones.length) * 100);
      return {
        ...goal,
        milestones: updatedMilestones,
        progress,
        status: progress === 100 ? 'completed' as GoalStatus : goal.status,
        updatedAt: new Date(),
      };
    }));
    toast.success('Milestone completed! Keep going!');
    
    try {
      await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          milestones: updatedMilestones,
          progress,
          status: progress === 100 ? 'completed' : undefined
        }),
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const addMilestone = useCallback(async (goalId: string, title: string) => {
    let updatedMilestones: any[] = [];
    let progress = 0;
    setGoals(prev => prev.map(goal => {
      if (goal.id !== goalId) return goal;
      updatedMilestones = [...goal.milestones, { id: `m-${Date.now()}`, title, completed: false }];
      const completedCount = updatedMilestones.filter(m => m.completed).length;
      progress = Math.round((completedCount / updatedMilestones.length) * 100);
      return {
        ...goal,
        milestones: updatedMilestones,
        progress,
        updatedAt: new Date(),
      };
    }));
    toast.success('Milestone added!');
    
    try {
      await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          milestones: updatedMilestones,
          progress
        }),
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const getGoalsByArea = useCallback((area: LifeArea) => {
    return goals.filter(goal => goal.lifeArea === area);
  }, [goals]);

  const getGoalsByCategory = useCallback((category: GoalCategory) => {
    return goals.filter(goal => goal.category === category);
  }, [goals]);

  const getGoalsByStatus = useCallback((status: GoalStatus) => {
    return goals.filter(goal => goal.status === status);
  }, [goals]);

  // Habit Actions
  // Habit Actions
  const addHabit = useCallback(async (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'streak' | 'longestStreak' | 'completedDates'>) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habit),
      });
      if (!response.ok) throw new Error('Failed to create habit');
      const newHabit = await response.json();
      setHabits(prev => [{ ...newHabit, completedDates: [] }, ...prev]);
      toast.success('Habit created! Let\'s build consistency!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add habit');
    }
  }, []);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(habit => 
      habit.id === id 
        ? { ...habit, ...updates, updatedAt: new Date() }
        : habit
    ));
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update habit');
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync habit update');
    }
  }, []);

  const deleteHabit = useCallback(async (id: string) => {
    setHabits(prev => prev.filter(habit => habit.id !== id));
    toast.success('Habit deleted');
    try {
      await fetch(`/api/habits/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const completeHabit = useCallback(async (id: string, note?: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setHabits(prev => prev.map(habit => {
      if (habit.id !== id) return habit;
      
      const alreadyCompleted = habit.completedDates.some(date => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
      
      if (alreadyCompleted) return habit;
      
      const newStreak = habit.streak + 1;
      return {
        ...habit,
        streak: newStreak,
        longestStreak: Math.max(newStreak, habit.longestStreak),
        completedDates: [...habit.completedDates, new Date()],
        checkins: [...(habit.checkins || []), { id: `c-${Date.now()}`, date: new Date(), note, value: 1 }],
        updatedAt: new Date(),
      };
    }));
    toast.success('Habit done! Keep the streak alive!');

    try {
      const res = await fetch(`/api/habits/${id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, note, value: 1 }),
      });
      if (res.ok) {
        const updatedHabit = await res.json();
        // Background sync to ensure accurate streaks
        setHabits(prev => prev.map(habit => 
          habit.id === id 
            ? { ...updatedHabit, completedDates: updatedHabit.checkins?.map((c: any) => c.date) || [] }
            : habit
        ));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const getHabitStats = useCallback((id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return { completionRate: 0, weeklyProgress: [0, 0, 0, 0, 0, 0, 0] };
    
    const totalDays = Math.max(1, habit.completedDates.length + 10);
    const completionRate = (habit.completedDates.length / totalDays) * 100;
    
    const weeklyProgress = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const completed = habit.completedDates.some(d => {
        const cd = new Date(d);
        return cd.toDateString() === date.toDateString();
      });
      weeklyProgress[6 - i] = completed ? 1 : 0;
    }
    
    return { completionRate, weeklyProgress };
  }, [habits]);

  // Money Actions
  const addInvestment = useCallback((investment: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newInvestment: Investment = {
      ...investment,
      id: `inv-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setInvestments(prev => [...prev, newInvestment]);
    toast.success('Investment added!');
  }, []);

  const updateInvestment = useCallback((id: string, updates: Partial<Investment>) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === id 
        ? { ...inv, ...updates, updatedAt: new Date() }
        : inv
    ));
  }, []);

  const deleteInvestment = useCallback((id: string) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
    toast.success('Investment removed');
  }, []);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `trans-${Date.now()}`,
      createdAt: new Date(),
    };
    setTransactions(prev => [...prev, newTransaction]);
    toast.success('Transaction recorded!');
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success('Transaction deleted');
  }, []);

  const addBudget = useCallback((budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBudget: Budget = {
      ...budget,
      id: `budget-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setBudgets(prev => [...prev, newBudget]);
    toast.success('Budget set!');
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => 
      b.id === id 
        ? { ...b, ...updates, updatedAt: new Date() }
        : b
    ));
  }, []);

  const addEMI = useCallback((emi: Omit<EMI, 'id'>) => {
    const newEMI: EMI = {
      ...emi,
      id: `emi-${Date.now()}`,
    };
    setEmis(prev => [...prev, newEMI]);
    toast.success('EMI added!');
  }, []);

  const addSIP = useCallback((sip: Omit<SIP, 'id' | 'totalInvested' | 'projectedValue'>) => {
    const newSIP: SIP = {
      ...sip,
      id: `sip-${Date.now()}`,
      totalInvested: 0,
      projectedValue: sip.amount * sip.tenureYears * 12 * (1 + sip.expectedReturn / 100),
    };
    setSips(prev => [...prev, newSIP]);
    toast.success('SIP started!');
  }, []);

  const getMonthlySummary = useCallback(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, savings: income - expenses };
  }, [transactions]);

  // Savings Goals Actions
  const addSavingsGoal = useCallback((goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newGoal: SavingsGoal = { ...goal, id: `sg-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
    setSavingsGoals(prev => [...prev, newGoal]);
    toast.success('Savings goal created!');
  }, []);

  const updateSavingsGoal = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates, updatedAt: new Date() } : g));
  }, []);

  const deleteSavingsGoal = useCallback((id: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
    toast.success('Goal deleted');
  }, []);

  // Subscription Actions
  const addSubscription = useCallback((sub: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = { ...sub, id: `sub-${Date.now()}` };
    setSubscriptions(prev => [...prev, newSub]);
    toast.success('Subscription added!');
  }, []);

  const deleteSubscription = useCallback((id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    toast.success('Subscription removed');
  }, []);

  // Purchase Log Actions
  const addPurchaseLog = useCallback((log: Omit<PurchaseLog, 'id'>) => {
    const newLog: PurchaseLog = { ...log, id: `pl-${Date.now()}` };
    setPurchaseLogs(prev => [...prev, newLog]);
    toast.success('Purchase logged!');
  }, []);

  const deletePurchaseLog = useCallback((id: string) => {
    setPurchaseLogs(prev => prev.filter(p => p.id !== id));
    toast.success('Purchase removed');
  }, []);

  // Project Actions
  const addProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      const newProject = await response.json();
      setProjects(prev => [newProject, ...prev]);
      toast.success('Project created!');
    } catch (err) {
      console.error("Failed to add project:", err);
      toast.error("Failed to save project");
    }
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    // Optimistic UI update
    setProjects(prev => prev.map(project => 
      project.id === id 
        ? { ...project, ...updates, updatedAt: new Date() }
        : project
    ));
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Failed to update project:", err);
      toast.error("Failed to sync project update");
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
    toast.success('Project deleted');
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  }, []);

  // Partner Actions
  const invitePartner = useCallback((email: string) => {
    const newPartner: PartnerConnection = {
      id: `partner-${Date.now()}`,
      userId: user?.id || '',
      partnerId: '',
      partnerName: '',
      partnerEmail: email,
      status: 'pending',
      sharedGoals: [],
      sharedTasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPartner(newPartner);
    toast.success('Invitation sent!');
  }, [user]);

  const acceptPartner = useCallback((_id: string) => {
    setPartner(prev => prev ? { ...prev, status: 'accepted' as const, updatedAt: new Date() } : null);
    toast.success('Partner connected!');
  }, []);

  const shareGoalWithPartner = useCallback((goalId: string) => {
    setGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, sharedWithPartner: true, updatedAt: new Date() } : g
    ));
    toast.success('Goal shared with partner!');
  }, []);

  const shareTaskWithPartner = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, sharedWithPartner: true, updatedAt: new Date() } : t
    ));
    toast.success('Task shared with partner!');
  }, []);

  // Notification Actions
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Journal Actions
  const addJournalEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      const newEntry = await response.json();
      setJournalEntries(prev => [...prev, newEntry]);
      toast.success(entry.type === 'reminder' ? 'Reminder saved!' : 'Entry written!');
    } catch (err) {
      console.error("Failed to add entry:", err);
      toast.error("Failed to save entry");
    }
  }, []);

  const updateJournalEntry = useCallback((id: string, updates: Partial<JournalEntry>) => {
    setJournalEntries(prev => prev.map(e =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
    ));
  }, []);

  const deleteJournalEntry = useCallback((id: string) => {
    setJournalEntries(prev => prev.filter(e => e.id !== id));
    toast.success('Entry deleted');
  }, []);

  const addJournalBook = useCallback(async (book: Omit<JournalBook, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      });
      const newBook = await response.json();
      setJournalBooks(prev => [...prev, newBook]);
      toast.success('New book created!');
    } catch (err) {
      console.error("Failed to add book:", err);
      toast.error("Failed to create book");
    }
  }, []);

  const updateJournalBook = useCallback(async (id: string, updates: Partial<JournalBook>) => {
    // Note: PATCH API not yet implemented, but updating local state for now
    setJournalBooks(prev => prev.map(b =>
      b.id === id ? { ...b, ...updates } : b
    ));
    toast.success('Book updated!');
  }, []);

  const deleteJournalBook = useCallback((id: string) => {
    setJournalBooks(prev => prev.filter(b => b.id !== id));
    setJournalEntries(prev => prev.filter(e => e.bookId !== id));
    if (activeBookId === id) setActiveBookId(null);
    toast.success('Book deleted');
  }, [activeBookId]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  // Stats Actions
  const refreshStats = useCallback(() => {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const activeStreaks = habits.filter(h => h.streak > 0).length;
    const portfolioValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
    const totalPnl = portfolioValue - totalInvested;
    const monthlySummary = getMonthlySummary();
    
    setStats(prev => ({
      ...prev,
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks: tasks.length - completedTasks,
      totalGoals: goals.length,
      activeGoals,
      completedGoals,
      totalHabits: habits.length,
      activeStreaks,
      portfolioValue,
      totalInvested,
      totalPnl,
      monthlyIncome: monthlySummary.income,
      monthlyExpenses: monthlySummary.expenses,
    }));
  }, [tasks, goals, habits, investments, getMonthlySummary]);

  // AI Actions
  const sendAIMessage = useCallback(async (message: string) => {
    setAiMessages(prev => [...prev, { role: 'user', content: message, timestamp: new Date() }]);
    
    setTimeout(() => {
      const responses = [
        "Based on your data, I'd recommend focusing on your high-priority tasks first. You have some urgent items!",
        "Looking at your goals, you're making great progress! Keep the momentum going.",
        "Your portfolio is looking healthy. Consider diversifying a bit more into ETFs.",
        "Your habit streaks are impressive! Don't break the chain!",
        "I noticed you have some upcoming deadlines. Want me to help prioritize?",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setAiMessages(prev => [...prev, { role: 'assistant', content: randomResponse, timestamp: new Date() }]);
    }, 800);
  }, []);

  const clearAIChat = useCallback(() => {
    setAiMessages([{ 
      role: 'assistant', 
      content: 'Hello! I\'m JARVIS, your Life OS companion. How can I help you today?', 
      timestamp: new Date() 
    }]);
  }, []);

  const getAIInsights = useCallback(() => {
    const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const bestStreak = Math.max(...habits.map(h => h.streak), 0);
    return `You have ${pendingTasks} pending tasks, ${activeGoals} active goals, and your best habit streak is ${bestStreak} days!`;
  }, [tasks, goals, habits]);

  const value = useMemo(() => ({
    user, isAuthenticated, login, logout, updateUserProfile,
    fontSettings, updateFontSettings,
    journalEntries, journalBooks, activeBookId, setActiveBookId, addJournalEntry, updateJournalEntry, deleteJournalEntry, addJournalBook, updateJournalBook, deleteJournalBook,
    tasks, addTask, updateTask, deleteTask, completeTask, getTasksByArea, getTasksByStatus, getTodayTasks, getUpcomingTasks,
    goals, addGoal, updateGoal, deleteGoal, completeMilestone, addMilestone, getGoalsByArea, getGoalsByCategory, getGoalsByStatus,
    habits, addHabit, updateHabit, deleteHabit, completeHabit, getHabitStats,
    investments, transactions, budgets, emis, sips, addInvestment, updateInvestment, deleteInvestment, addTransaction, deleteTransaction, addBudget, updateBudget, addEMI, addSIP, getMonthlySummary, savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, subscriptions, addSubscription, deleteSubscription, purchaseLogs, addPurchaseLog, deletePurchaseLog,
    projects, addProject, updateProject, deleteProject,
    partner, invitePartner, acceptPartner, shareGoalWithPartner, shareTaskWithPartner,
    notifications, markNotificationRead, clearNotifications, addNotification,
    stats, refreshStats,
    aiMessages, sendAIMessage, clearAIChat, getAIInsights,
  }), [
    user, isAuthenticated, login, logout, updateUserProfile,
    fontSettings, updateFontSettings,
    journalEntries, journalBooks, activeBookId, setActiveBookId, addJournalEntry, updateJournalEntry, deleteJournalEntry, addJournalBook, updateJournalBook, deleteJournalBook,
    tasks, addTask, updateTask, deleteTask, completeTask, getTasksByArea, getTasksByStatus, getTodayTasks, getUpcomingTasks,
    goals, addGoal, updateGoal, deleteGoal, completeMilestone, addMilestone, getGoalsByArea, getGoalsByCategory, getGoalsByStatus,
    habits, addHabit, updateHabit, deleteHabit, completeHabit, getHabitStats,
    investments, transactions, budgets, emis, sips, addInvestment, updateInvestment, deleteInvestment, addTransaction, deleteTransaction, addBudget, updateBudget, addEMI, addSIP, getMonthlySummary, savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, subscriptions, addSubscription, deleteSubscription, purchaseLogs, addPurchaseLog, deletePurchaseLog,
    projects, addProject, updateProject, deleteProject,
    partner, invitePartner, acceptPartner, shareGoalWithPartner, shareTaskWithPartner,
    notifications, markNotificationRead, clearNotifications, addNotification,
    stats, refreshStats,
    aiMessages, sendAIMessage, clearAIChat, getAIInsights,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
