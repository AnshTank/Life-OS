
// Life OS - Type Definitions

export type LifeArea = 
  | 'health' 
  | 'career' 
  | 'finance' 
  | 'relationships' 
  | 'learning' 
  | 'fun' 
  | 'spirituality' 
  | 'environment'
  | 'home'
  | 'family';

export type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'cancelled';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';
export type GoalCategory = 
  | 'home' 
  | 'family' 
  | 'house' 
  | 'travel' 
  | 'personal' 
  | 'cars' 
  | 'technology' 
  | 'career' 
  | 'health' 
  | 'finance' 
  | 'learning' 
  | 'relationships';

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';
export type InvestmentType = 'stock' | 'mutual_fund' | 'etf' | 'crypto' | 'bond' | 'fd' | 'sip';
export type ProjectType = 'company' | 'freelance' | 'personal' | 'side_hustle';
export type ProjectStatus = 'idea' | 'planning' | 'in-progress' | 'completed' | 'on-hold';

// User
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  partnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tasks
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  lifeArea: LifeArea;
  goalId?: string;
  impact: number; // 1-10
  urgency: number; // 1-10
  effort: number; // 1-10
  priorityScore: number; // Computed
  dueDate?: Date;
  scheduledFor?: Date;
  reminderAt?: Date;
  status: TaskStatus;
  completedAt?: Date;
  isRecurring: boolean;
  recurringPattern?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  sharedWithPartner: boolean;
}

// Goals
export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  lifeArea: LifeArea;
  category: GoalCategory;
  targetDate?: Date;
  status: GoalStatus;
  impact: number; // 1-10
  progress: number; // 0-100
  aiQuote?: string;
  milestones: Milestone[];
  createdAt: Date;
  updatedAt: Date;
  sharedWithPartner: boolean;
  partnerId?: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

// Habits
export type HabitType = 'boolean' | 'quantifiable';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  lifeArea: LifeArea;
  frequency: HabitFrequency;
  targetDays: number; // per week or month
  streak: number;
  longestStreak: number;
  completedDates: Date[];
  color: string;
  icon: string;
  reminderTime?: string;
  // Quantifiable fields
  habitType: HabitType;
  targetValue?: number; // e.g., 10 glasses
  unit?: string; // 'glass', 'step', 'page', etc.
  unitIcon?: string; // visual icon key
  createdAt: Date;
  updatedAt: Date;
  checkins: HabitCheckin[];
}

export interface HabitCheckin {
  id: string;
  date: Date;
  note?: string;
  value: number; // units logged in this check-in
}

// Money - Investments
export interface Investment {
  id: string;
  userId: string;
  name: string;
  symbol?: string;
  type: InvestmentType;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  sector?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Money - Transactions
export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: Date;
  tags: string[];
  createdAt: Date;
}

// Money - Budget
export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'yearly';
  createdAt: Date;
  updatedAt: Date;
}

// Money - EMI
export interface EMI {
  id: string;
  userId: string;
  name: string;
  principal: number;
  interestRate: number; // annual
  tenureMonths: number;
  emiAmount: number;
  startDate: Date;
  endDate: Date;
  totalInterest: number;
  totalAmount: number;
  paidMonths: number;
  remainingMonths: number;
  status: 'active' | 'completed';
}

// Money - SIP
export interface SIP {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'daily';
  startDate: Date;
  expectedReturn: number; // annual percentage
  tenureYears: number;
  totalInvested: number;
  projectedValue: number;
  status: 'active' | 'paused' | 'stopped';
}

// Money - Savings Goals
export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  deadline?: Date;
  priority: 'high' | 'medium' | 'low';
  color: string;
  icon: string;
  monthlySavingTarget: number;
  createdAt: Date;
  updatedAt: Date;
}

// Money - Subscriptions
export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  category: string;
  startDate: Date;
  nextBillingDate: Date;
  isActive: boolean;
  notes?: string;
}

// Money - Purchase Log
export interface PurchaseLog {
  id: string;
  userId: string;
  name: string;
  amount: number;
  date: Date;
  category: string;
  satisfactionRating: number; // 1-5
  notes?: string;
}

// Partner
export interface PartnerConnection {
  id: string;
  userId: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  sharedGoals: string[];
  sharedTasks: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Projects/Ideas
export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  techStack: string[];
  startDate?: Date;
  targetDate?: Date;
  completedDate?: Date;
  progress: number;
  hoursSpent: number;
  earnings?: number;
  clientName?: string;
  repositoryUrl?: string;
  demoUrl?: string;
  notes: string[];
  tasks: ProjectTask[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
  assignee?: string;
}

// AI Conversation
export interface AIConversation {
  id: string;
  userId: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any;
}

// Journal / Diary
export type JournalEntryType = 'journal' | 'note' | 'reminder';
export type JournalMood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export interface JournalEntry {
  id: string;
  userId: string;
  bookId: string;
  type: JournalEntryType;
  title: string;
  content: string;
  mood?: JournalMood;
  chapter?: string;
  tags: string[];
  reminderDate?: Date;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalBook {
  id: string;
  name: string;
  ownerName: string;
  bookType: 'journal' | 'daily-log' | 'notebook' | 'project' | 'custom';
  color: string;
  purpose?: string;
  description?: string;
  icon?: string;
  isPrivate?: boolean;
  tags?: string[];
  coverImage?: string;
  startedAt: Date;
  chapters: string[];
  createdAt: Date;
}

// Daily Quote
export interface DailyQuote {
  text: string;
  author: string;
  date: string;
}

// Life Area Config
export interface LifeAreaConfig {
  id: LifeArea;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  description: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  totalHabits: number;
  activeStreaks: number;
  portfolioValue: number;
  totalInvested: number;
  totalPnl: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  lifeAreaProgress: LifeAreaProgress[];
}

export interface LifeAreaProgress {
  area: LifeArea;
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'goal' | 'habit' | 'money' | 'partner' | 'system';
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}
