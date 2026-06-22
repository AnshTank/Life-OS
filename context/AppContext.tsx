"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import type { 
  Task, Goal, Habit, Investment, Transaction, 
  Budget, EMI, SIP, Project, PartnerConnection, Partner,
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

function calculatePriorityScore(impact: number, urgency: number, effort: number): number {
  return Math.round((impact * 0.4 + urgency * 0.4 + (10 - effort) * 0.2) * 10) / 10;
}

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
  monthlyIncomeSetting: number;
  updateMonthlyIncomeSetting: (value: number) => void;
  resetFinancialData: () => Promise<void>;
  cashSetting: number;
  updateCashSetting: (value: number) => void;
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
  

  // Partners (Management)
  partners: Partner[];
  addPartner: (partner: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePartner: (id: string, updates: Partial<Partner>) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  
  // Partner (Legacy Sync)
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
  sendAIMessage: (message: string, clientContext?: { currentPage?: string; latitude?: number; longitude?: number; isCallMode?: boolean }) => Promise<void>;
  clearAIChat: () => void;
  getAIInsights: () => string;
  aiName: string;
  conversations: any[];
  activeConversationId: string | null;
  loadConversation: (id: string) => Promise<void>;
  startNewConversation: () => void;
  deleteConversation: (id: string) => Promise<void>;
  deleteConversationsByDateRange: (startDate: string, endDate: string) => Promise<void>;
  aiLanguage: string;
  aiVoicePreference: string;
  aiAvatar: string;
  updateAISettings: (settings: { aiName?: string; aiLanguage?: string; aiVoicePreference?: string; aiAvatar?: string }) => void;
  settingChangeAnimation: {
    active: boolean;
    type: 'font' | 'size' | 'avatar' | 'voice' | 'name' | 'language' | 'general';
    value: string;
    label: string;
  } | null;
  triggerSettingChangeAnimation: (
    type: 'font' | 'size' | 'avatar' | 'voice' | 'name' | 'language' | 'general',
    value: string,
    label: string,
    applyCallback: () => void
  ) => void;

  // Currency Settings
  currencyPreference: string;
  updateCurrencyPreference: (currency: string) => void;

  // Global Loading
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync session with local state
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser({
        id: (session.user as any).id || 'user-1',
        name: session.user.name || 'User',
        email: session.user.email || '',
        avatar: session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.name}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setIsAuthenticated(true);
    } else if (status === 'unauthenticated') {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [session, status]);
  
  // Font Settings
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    family: 'kalam',
    size: 16,
  });
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [emis, setEmis] = useState<EMI[]>([]);
  const [sips, setSips] = useState<SIP[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [purchaseLogs, setPurchaseLogs] = useState<PurchaseLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partner, setPartner] = useState<PartnerConnection | null>(mockPartner);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalHabits: 0,
    activeStreaks: 0,
    portfolioValue: 0,
    totalInvested: 0,
    totalPnl: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    lifeAreaProgress: [],
  });
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalBooks, setJournalBooks] = useState<JournalBook[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);

  // Fetch initial data — only when authenticated
  useEffect(() => {
    if (status !== 'authenticated') {
        if (status === 'unauthenticated') setIsLoading(false);
        return;
    }

    setIsLoading(true);

    const fetchAllData = async () => {
      try {
        const [
          journals, entries, projectsRes, tasksRes, goalsRes, habitsRes, partnersRes,
          investmentsRes, transactionsRes, budgetsRes, emisRes, sipsRes, savingsGoalsRes,
          subscriptionsRes, purchaseLogsRes, conversationsRes
        ] = await Promise.all([
          fetch('/api/journals').then(res => res.json()),
          fetch('/api/entries').then(res => res.json()),
          fetch('/api/projects').then(res => res.json()),
          fetch('/api/tasks').then(res => res.json()),
          fetch('/api/goals').then(res => res.json()),
          fetch('/api/habits').then(res => res.json()),
          fetch('/api/partners').then(res => res.json()),
          fetch('/api/investments').then(res => res.json()),
          fetch('/api/transactions').then(res => res.json()),
          fetch('/api/budgets').then(res => res.json()),
          fetch('/api/emis').then(res => res.json()),
          fetch('/api/sips').then(res => res.json()),
          fetch('/api/savings-goals').then(res => res.json()),
          fetch('/api/subscriptions').then(res => res.json()),
          fetch('/api/purchase-logs').then(res => res.json()),
          fetch('/api/ai/conversations').then(res => res.json()),
        ]);

        if (Array.isArray(journals)) setJournalBooks(journals);
        if (Array.isArray(entries)) setJournalEntries(entries);
        if (Array.isArray(projectsRes)) setProjects(projectsRes);
        if (tasksRes && Array.isArray(tasksRes.tasks)) setTasks(tasksRes.tasks);
        if (goalsRes && Array.isArray(goalsRes.goals)) setGoals(goalsRes.goals);
        if (habitsRes && Array.isArray(habitsRes.habits)) {
          const formattedHabits = habitsRes.habits.map((h: any) => ({
            ...h,
            completedDates: h.checkins ? h.checkins.map((c: any) => c.date) : []
          }));
          setHabits(formattedHabits);
        }
        if (Array.isArray(partnersRes)) setPartners(partnersRes);
        if (Array.isArray(investmentsRes)) setInvestments(investmentsRes);
        if (Array.isArray(transactionsRes)) setTransactions(transactionsRes);
        if (Array.isArray(budgetsRes)) setBudgets(budgetsRes);
        if (Array.isArray(emisRes)) setEmis(emisRes);
        if (Array.isArray(sipsRes)) setSips(sipsRes);
        if (Array.isArray(savingsGoalsRes)) {
          setSavingsGoals(savingsGoalsRes.map((g: any) => ({
            ...g,
            deadline: g.deadline ? new Date(g.deadline) : null,
            createdAt: new Date(g.createdAt),
            updatedAt: new Date(g.updatedAt)
          })));
        }
        if (Array.isArray(subscriptionsRes)) {
          setSubscriptions(subscriptionsRes.map((s: any) => ({
            ...s,
            startDate: new Date(s.startDate),
            nextBillingDate: new Date(s.nextBillingDate)
          })));
        }
        if (Array.isArray(purchaseLogsRes)) {
          setPurchaseLogs(purchaseLogsRes.map((p: any) => ({
            ...p,
            date: new Date(p.date)
          })));
        }
        if (Array.isArray(conversationsRes)) {
          setConversations(conversationsRes);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [status]);

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

  const [aiName, setAiName] = useState<string>("Potato");
  const [aiLanguage, setAiLanguage] = useState<string>("Auto-detect");
  const [aiVoicePreference, setAiVoicePreference] = useState<string>("Mei");
  const [aiAvatar, setAiAvatar] = useState<string>("classic");
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([]);
  const [settingChangeAnimation, setSettingChangeAnimation] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  // Currency preference state
  const [currencyPreference, setCurrencyPreference] = useState<string>("INR");
  const [monthlyIncomeSetting, setMonthlyIncomeSetting] = useState<number>(0);
  const [cashSetting, setCashSetting] = useState<number>(0);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("soul-sync-ai-name") || "Potato";
      const savedLanguage = localStorage.getItem("soul-sync-ai-language") || "Auto-detect";
      const savedVoice = localStorage.getItem("soul-sync-ai-voice-preference") || "Mei";
      const savedAvatar = localStorage.getItem("soul-sync-ai-avatar") || "classic";
      const savedCurrency = localStorage.getItem("soul-sync-currency") || "INR";
      const savedIncome = localStorage.getItem("soul-sync-monthly-income-setting") || "0";
      const savedCash = localStorage.getItem("soul-sync-cash-setting") || "0";
      
      setAiName(savedName);
      setAiLanguage(savedLanguage);
      setAiVoicePreference(savedVoice);
      setAiAvatar(savedAvatar);
      setCurrencyPreference(savedCurrency);
      setMonthlyIncomeSetting(parseFloat(savedIncome));
      setCashSetting(parseFloat(savedCash));
      setAiMessages([
        { role: 'assistant', content: `Hello! I'm ${savedName}, your Life OS companion. I can help you with tasks, goals, investments, and more. What would you like to know?`, timestamp: new Date() }
      ]);
    }
  }, []);

  const updateMonthlyIncomeSetting = useCallback((value: number) => {
    setMonthlyIncomeSetting(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("soul-sync-monthly-income-setting", String(value));
    }
  }, []);

  const updateCashSetting = useCallback((value: number) => {
    setCashSetting(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("soul-sync-cash-setting", String(value));
    }
  }, []);

  const updateAISettings = useCallback((settings: { aiName?: string; aiLanguage?: string; aiVoicePreference?: string; aiAvatar?: string }) => {
    if (settings.aiName !== undefined) {
      setAiName(settings.aiName);
      if (typeof window !== "undefined") {
        localStorage.setItem("soul-sync-ai-name", settings.aiName);
      }
      setAiMessages(prev => prev.map((msg, idx) => {
        if (idx === 0 && msg.role === 'assistant' && msg.content.includes("your Life OS companion")) {
          return {
            ...msg,
            content: `Hello! I'm ${settings.aiName}, your Life OS companion. I can help you with tasks, goals, investments, and more. What would you like to know?`
          };
        }
        return msg;
      }));
    }
    if (settings.aiLanguage !== undefined) {
      setAiLanguage(settings.aiLanguage);
      if (typeof window !== "undefined") {
        localStorage.setItem("soul-sync-ai-language", settings.aiLanguage);
      }
    }
    if (settings.aiVoicePreference !== undefined) {
      setAiVoicePreference(settings.aiVoicePreference);
      if (typeof window !== "undefined") {
        localStorage.setItem("soul-sync-ai-voice-preference", settings.aiVoicePreference);
      }
    }
    if (settings.aiAvatar !== undefined) {
      setAiAvatar(settings.aiAvatar);
      if (typeof window !== "undefined") {
        localStorage.setItem("soul-sync-ai-avatar", settings.aiAvatar);
      }
    }
  }, []);

  const updateCurrencyPreference = useCallback((currency: string) => {
    setCurrencyPreference(currency);
    if (typeof window !== "undefined") {
      localStorage.setItem("soul-sync-currency", currency);
    }
  }, []);
  const triggerSettingChangeAnimation = useCallback((
    type: 'font' | 'size' | 'avatar' | 'voice' | 'name' | 'language' | 'general',
    value: string,
    label: string,
    applyCallback: () => void
  ) => {
    setSettingChangeAnimation({ active: true, type, value, label });
    setTimeout(() => {
      applyCallback();
    }, 5500);
    setTimeout(() => {
      setSettingChangeAnimation(null);
    }, 7500);
  }, []);

  // Apply font settings to body
  useEffect(() => {
    document.body.style.fontFamily = fontSettings.family === 'kalam' ? "'Kalam', cursive" :
      fontSettings.family === 'caveat' ? "'Caveat', cursive" :
      fontSettings.family === 'indie' ? "'Indie Flower', cursive" :
      fontSettings.family === 'patrick' ? "'Patrick Hand', cursive" :
      "'Architects Daughter', cursive";
    document.body.style.fontSize = `${fontSettings.size}px`;
  }, [fontSettings]);

  // Auth Actions
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error(result.error === "CredentialsSignin" ? "Invalid email or password" : "Login failed");
      return false;
    }

    toast.success('Welcome to your Life Journal!');
    return true;
  }, []);

  const logout = useCallback(async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
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
  const addInvestment = useCallback(async (investment: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(investment),
      });
      const data = await res.json();
      setInvestments(prev => [...prev, data]);
      toast.success('Investment added!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add investment');
    }
  }, []);

  const updateInvestment = useCallback(async (id: string, updates: Partial<Investment>) => {
    try {
      setInvestments(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates, updatedAt: new Date() } : inv));
      await fetch(`/api/investments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const deleteInvestment = useCallback(async (id: string) => {
    try {
      setInvestments(prev => prev.filter(inv => inv.id !== id));
      await fetch(`/api/investments/${id}`, { method: 'DELETE' });
      toast.success('Investment removed');
    } catch (err) {
      console.error(err);
    }
  }, []);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });
      const data = await res.json();
      setTransactions(prev => [...prev, data]);
      toast.success('Transaction recorded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add transaction');
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      setTransactions(prev => prev.filter(t => t.id !== id));
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      toast.success('Transaction deleted');
    } catch (err) {
      console.error(err);
    }
  }, []);

  const addBudget = useCallback(async (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budget),
      });
      const data = await res.json();
      setBudgets(prev => [...prev, data]);
      toast.success('Budget set!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add budget');
    }
  }, []);

  const updateBudget = useCallback(async (id: string, updates: Partial<Budget>) => {
    try {
      setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b));
      await fetch(`/api/budgets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const addEMI = useCallback(async (emi: Omit<EMI, 'id'>) => {
    try {
      const res = await fetch('/api/emis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emi),
      });
      const data = await res.json();
      setEmis(prev => [...prev, data]);
      toast.success('EMI added!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add EMI');
    }
  }, []);

  const addSIP = useCallback(async (sip: Omit<SIP, 'id' | 'totalInvested' | 'projectedValue'>) => {
    try {
      const res = await fetch('/api/sips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sip),
      });
      const data = await res.json();
      setSips(prev => [...prev, data]);
      toast.success('SIP started!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add SIP');
    }
  }, []);

  const getMonthlySummary = useCallback(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, savings: income - expenses };
  }, [transactions]);

  // Savings Goals Actions
  const addSavingsGoal = useCallback(async (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      });
      const data = await res.json();
      setSavingsGoals(prev => [...prev, data]);
      toast.success('Savings goal created!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add savings goal');
    }
  }, []);

  const updateSavingsGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
    try {
      setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates, updatedAt: new Date() } : g));
      await fetch(`/api/savings-goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    try {
      setSavingsGoals(prev => prev.filter(g => g.id !== id));
      await fetch(`/api/savings-goals/${id}`, { method: 'DELETE' });
      toast.success('Goal deleted');
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Subscription Actions
  const addSubscription = useCallback(async (sub: Omit<Subscription, 'id'>) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
      const data = await res.json();
      setSubscriptions(prev => [...prev, data]);
      toast.success('Subscription added!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add subscription');
    }
  }, []);

  const deleteSubscription = useCallback(async (id: string) => {
    try {
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      toast.success('Subscription removed');
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Purchase Log Actions
  const addPurchaseLog = useCallback(async (log: Omit<PurchaseLog, 'id'>) => {
    try {
      const res = await fetch('/api/purchase-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      const data = await res.json();
      setPurchaseLogs(prev => [...prev, data]);
      toast.success('Purchase logged!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to log purchase');
    }
  }, []);

  const deletePurchaseLog = useCallback(async (id: string) => {
    try {
      setPurchaseLogs(prev => prev.filter(p => p.id !== id));
      await fetch(`/api/purchase-logs/${id}`, { method: 'DELETE' });
      toast.success('Purchase removed');
    } catch (err) {
      console.error(err);
    }
  }, []);

  const resetFinancialData = useCallback(async () => {
    try {
      const res = await fetch('/api/money/reset', { method: 'POST' });
      if (res.ok) {
        setInvestments([]);
        setTransactions([]);
        setBudgets([]);
        setEmis([]);
        setSips([]);
        setSavingsGoals([]);
        setSubscriptions([]);
        setPurchaseLogs([]);
        toast.success('All financial data reset successfully!');
      } else {
        toast.error('Failed to reset financial data');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error resetting financial data');
    }
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

  // Partners Management Actions
  const addPartner = useCallback(async (partner: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partner),
      });
      if (!response.ok) throw new Error('Failed to create partner');
      const newPartner = await response.json();
      setPartners(prev => [newPartner, ...prev]);
      toast.success('Partner added successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add partner');
    }
  }, []);

  const updatePartner = useCallback(async (id: string, updates: Partial<Partner>) => {
    let originalPartner: Partner | undefined;
    setPartners(prev => {
      originalPartner = prev.find(p => p.id === id);
      return prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p);
    });

    try {
      const res = await fetch(`/api/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update partner');
      const updatedPartner = await res.json();
      
      // Update state with actual server-returned partner
      setPartners(prev => prev.map(p => p.id === id ? updatedPartner : p));
      toast.success('Partner updated!');
    } catch (err) {
      console.error(err);
      // Rollback to original partner on failure
      if (originalPartner) {
        setPartners(prev => prev.map(p => p.id === id ? originalPartner! : p));
      }
      toast.error('Failed to sync partner update');
    }
  }, []);

  const deletePartner = useCallback(async (id: string) => {
    setPartners(prev => prev.filter(p => p.id !== id));
    toast.success('Partner deleted');
    try {
      await fetch(`/api/partners/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
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
    
    const areas: LifeArea[] = ['health', 'career', 'finance', 'relationships', 'learning', 'fun', 'spirituality', 'environment', 'home', 'family'];
    const lifeAreaProgress = areas.map(area => {
      const areaTasks = tasks.filter(t => t.lifeArea === area);
      const tasksTotal = areaTasks.length;
      const tasksCompleted = areaTasks.filter(t => t.status === 'completed').length;
      const progress = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
      return { area, progress, tasksCompleted, tasksTotal };
    });

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
      monthlyIncome: monthlySummary.income || monthlyIncomeSetting,
      monthlyExpenses: monthlySummary.expenses,
      lifeAreaProgress,
    }));
  }, [tasks, goals, habits, investments, getMonthlySummary, monthlyIncomeSetting]);

  useEffect(() => {
    refreshStats();
  }, [tasks, goals, habits, investments, transactions, refreshStats]);

  // AI Actions
  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setAiMessages([
      { role: 'assistant', content: `Hello! I'm ${aiName}, your Life OS companion. I can help you with tasks, goals, investments, and more. What would you like to know?`, timestamp: new Date() }
    ]);
  }, [aiName]);

  const sendAIMessage = useCallback(async (message: string, clientContext?: { currentPage?: string; latitude?: number; longitude?: number; isCallMode?: boolean }) => {
    const newUserMessage = { role: 'user' as const, content: message, timestamp: new Date() };
    const updatedMessages = [...aiMessages, newUserMessage];
    setAiMessages(updatedMessages);

    try {
      const historyPayload = clientContext?.isCallMode 
        ? [] 
        : aiMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: historyPayload,
          currentPage: clientContext?.currentPage,
          latitude: clientContext?.latitude,
          longitude: clientContext?.longitude,
          aiName,
          aiLanguage,
          isCallMode: clientContext?.isCallMode,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch response');
      }

      const data = await res.json();
      const rawReply = data.response || "";

      // Parse settings tags
      const settingRegex = /\[SETTING:\s*([^|\]]+)\s*\|\s*([^\]]+)\]/g;
      let match;
      const settingsToApply: { type: string; value: string }[] = [];

      while ((match = settingRegex.exec(rawReply)) !== null) {
        settingsToApply.push({
          type: match[1].trim().toLowerCase(),
          value: match[2].trim()
        });
      }

      const cleanedReply = rawReply.replace(settingRegex, '').trim();
      const assistantMessage = { role: 'assistant' as const, content: cleanedReply, timestamp: new Date() };
      const finalMessages = [...updatedMessages, assistantMessage];
      setAiMessages(finalMessages);

      // Save to DB (only in non-call mode to persist chat logs)
      if (!clientContext?.isCallMode) {
        if (!activeConversationId) {
          const convRes = await fetch('/api/ai/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: message.slice(0, 30) || 'New Chat',
              messages: finalMessages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp.toISOString()
              }))
            })
          });
          if (convRes.ok) {
            const newConv = await convRes.json();
            setActiveConversationId(newConv.id);
            setConversations(prev => [newConv, ...prev]);
          }
        } else {
          const convRes = await fetch(`/api/ai/conversations/${activeConversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: finalMessages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp.toISOString()
              }))
            })
          });
          if (convRes.ok) {
            const updatedConv = await convRes.json();
            setConversations(prev => prev.map(c => c.id === activeConversationId ? updatedConv : c));
          }
        }
      }

      // Process settings updates
      if (settingsToApply.length > 0) {
        const item = settingsToApply[0];
        const val = item.value;

        if (item.type === 'font-family') {
          const fontVal = val.toLowerCase();
          if (['kalam', 'caveat', 'indie', 'patrick', 'architects'].includes(fontVal)) {
            triggerSettingChangeAnimation('font', fontVal, `Font Style: ${fontVal}`, () => {
              updateFontSettings({ family: fontVal as any });
            });
          }
        } else if (item.type === 'font-size') {
          let newSize = fontSettings.size;
          if (val.startsWith('+') || val.startsWith('-')) {
            const delta = parseInt(val, 10);
            if (!isNaN(delta)) {
              newSize = Math.max(12, Math.min(24, fontSettings.size + delta));
            }
          } else {
            const target = parseInt(val, 10);
            if (!isNaN(target)) {
              newSize = Math.max(12, Math.min(24, target));
            }
          }
          triggerSettingChangeAnimation('size', String(newSize), `Font Size: ${newSize}px`, () => {
            updateFontSettings({ size: newSize });
          });
        } else if (item.type === 'voice') {
          if (['Mei', 'Ansh', 'Mary'].includes(val)) {
            triggerSettingChangeAnimation('voice', val, `Voice: ${val}`, () => {
              updateAISettings({ aiVoicePreference: val });
            });
          }
        } else if (item.type === 'avatar') {
          if (['classic', 'sakura', 'ansh', 'mary'].includes(val)) {
            triggerSettingChangeAnimation('avatar', val, `Avatar: ${val}`, () => {
              updateAISettings({ aiAvatar: val });
            });
          }
        } else if (item.type === 'language') {
          triggerSettingChangeAnimation('language', val, `Language: ${val}`, () => {
            updateAISettings({ aiLanguage: val });
          });
        } else if (item.type === 'name') {
          triggerSettingChangeAnimation('name', val, `Companion Name: ${val}`, () => {
            updateAISettings({ aiName: val });
          });
        }
      }
    } catch (err: any) {
      console.error("AI Chat companion error:", err);
      setAiMessages(prev => [...prev, { 
        role: 'assistant' as const, 
        content: `Sorry, I'm having trouble connecting right now (${err.message || 'connection failed'}). Please check your connection or try again later.`, 
        timestamp: new Date() 
      }]);
    }
  }, [aiMessages, aiName, aiLanguage, fontSettings, updateFontSettings, updateAISettings, triggerSettingChangeAnimation, activeConversationId]);

  const clearAIChat = useCallback(() => {
    startNewConversation();
  }, [startNewConversation]);

  const loadConversation = useCallback(async (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setActiveConversationId(id);
      const mappedMessages = (conv.messages as any[]).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));
      setAiMessages(mappedMessages);
    }
  }, [conversations]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConversationId === id) {
          startNewConversation();
        }
        toast.success("Conversation deleted successfully");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete conversation");
    }
  }, [activeConversationId, startNewConversation]);

  const deleteConversationsByDateRange = useCallback(async (startDate: string, endDate: string) => {
    try {
      const res = await fetch(`/api/ai/conversations?startDate=${startDate}&endDate=${endDate}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const result = await res.json();
        const listRes = await fetch('/api/ai/conversations');
        if (listRes.ok) {
          const data = await listRes.json();
          setConversations(data);
        }
        startNewConversation();
        toast.success(`Deleted ${result.count} conversations`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete conversations in date range");
    }
  }, [startNewConversation]);

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
    monthlyIncomeSetting, updateMonthlyIncomeSetting, resetFinancialData,
    cashSetting, updateCashSetting,
    projects, addProject, updateProject, deleteProject,
    partners, addPartner, updatePartner, deletePartner,
    partner, invitePartner, acceptPartner, shareGoalWithPartner, shareTaskWithPartner,
    notifications, markNotificationRead, clearNotifications, addNotification,
    stats, refreshStats,
    aiMessages, sendAIMessage, clearAIChat, getAIInsights,
    aiName, aiLanguage, aiVoicePreference, aiAvatar, updateAISettings,
    settingChangeAnimation, triggerSettingChangeAnimation,
    currencyPreference, updateCurrencyPreference,
    conversations, activeConversationId, loadConversation, startNewConversation, deleteConversation, deleteConversationsByDateRange,
    isLoading,
  }), [
    user, isAuthenticated, login, logout, updateUserProfile,
    fontSettings, updateFontSettings,
    journalEntries, journalBooks, activeBookId, setActiveBookId, addJournalEntry, updateJournalEntry, deleteJournalEntry, addJournalBook, updateJournalBook, deleteJournalBook,
    tasks, addTask, updateTask, deleteTask, completeTask, getTasksByArea, getTasksByStatus, getTodayTasks, getUpcomingTasks,
    goals, addGoal, updateGoal, deleteGoal, completeMilestone, addMilestone, getGoalsByArea, getGoalsByCategory, getGoalsByStatus,
    habits, addHabit, updateHabit, deleteHabit, completeHabit, getHabitStats,
    investments, transactions, budgets, emis, sips, addInvestment, updateInvestment, deleteInvestment, addTransaction, deleteTransaction, addBudget, updateBudget, addEMI, addSIP, getMonthlySummary, savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, subscriptions, addSubscription, deleteSubscription, purchaseLogs, addPurchaseLog, deletePurchaseLog,
    monthlyIncomeSetting, updateMonthlyIncomeSetting, resetFinancialData,
    cashSetting, updateCashSetting,
    projects, addProject, updateProject, deleteProject,
    partners, addPartner, updatePartner, deletePartner,
    partner, invitePartner, acceptPartner, shareGoalWithPartner, shareTaskWithPartner,
    notifications, markNotificationRead, clearNotifications, addNotification,
    stats, refreshStats,
    aiMessages, sendAIMessage, clearAIChat, getAIInsights,
    aiName, aiLanguage, aiVoicePreference, aiAvatar, updateAISettings,
    settingChangeAnimation, triggerSettingChangeAnimation,
    currencyPreference, updateCurrencyPreference,
    conversations, activeConversationId, loadConversation, startNewConversation, deleteConversation, deleteConversationsByDateRange,
    isLoading,
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
