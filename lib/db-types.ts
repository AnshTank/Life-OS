export type LifeArea = "placement-prep" | "learning" | "health" | "finance" | "buy-list" | "travel" | "personal"

export type GoalCategory = "home" | "family" | "house" | "travel" | "personal" | "cars" | "technology" | "career" | "health" | "finance" | "learning" | "relationships"

export type PriorityLevel = "low" | "medium" | "high" | "critical"

export type GoalTimeframe = "long-term" | "current" // long-term: 6+ months, current: 21-90 days

export type ExpenseCategory = "food" | "transport" | "entertainment" | "shopping" | "bills" | "healthcare" | "education" | "investment" | "other"

export type TransactionType = "income" | "expense" | "investment" | "transfer"

export type InvestmentType = "stocks" | "crypto" | "mutual-funds" | "bonds" | "real-estate" | "gold" | "other"

export interface Goal {
  _id: string
  userId: string
  title: string
  description: string
  lifeArea: LifeArea
  category: GoalCategory
  timeframe: GoalTimeframe
  targetDate?: Date
  status: "active" | "completed" | "paused"
  impact: number // 1-10
  createdAt: Date
  updatedAt: Date
  sharedWithPartner: boolean
}

export interface Problem {
  _id: string
  userId: string
  title: string
  description: string
  lifeArea: LifeArea
  status: "open" | "in-progress" | "resolved"
  priority: PriorityLevel
  hasSolution: boolean
  solution?: string
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  _id: string
  userId: string
  title: string
  description?: string
  lifeArea: LifeArea
  goalId?: string

  // Smart prioritization factors
  impact: number // 1-10 (how much this moves the needle)
  urgency: number // 1-10 (how time-sensitive)
  effort: number // 1-10 (how much work required)

  // Eisenhower Matrix quadrant
  quadrant: "do" | "schedule" | "delegate" | "eliminate" // Important+Urgent, Important+Not Urgent, Not Important+Urgent, Not Important+Not Urgent
  
  // Pareto Principle (80/20 rule)
  isHighImpact: boolean // 20% effort, 80% impact tasks

  // Computed priority score
  priorityScore: number

  dueDate?: Date
  scheduledFor?: Date
  status: "todo" | "in-progress" | "completed" | "cancelled"
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface DailyLog {
  _id: string
  userId: string
  date: Date
  focusAreas: string[]
  tasksCompleted: number
  tasksTotal: number
  topTask?: string
  notes?: string
  mood?: number // 1-5
  productivity?: number // 1-5
  createdAt: Date
}

export interface ProgressMetrics {
  _id: string
  userId: string
  period: "daily" | "weekly" | "monthly" | "yearly"
  startDate: Date
  endDate: Date

  tasksCompleted: number
  tasksTotal: number
  completionRate: number

  highImpactCompleted: number
  averageImpactScore: number

  lifeAreaBreakdown: {
    area: LifeArea
    tasksCompleted: number
    progress: number
  }[]

  goalsProgress: {
    goalId: string
    progress: number
  }[]

  createdAt: Date
}

export interface WorkingPattern {
  _id: string
  userId: string

  // Learning patterns
  bestWorkHours: number[] // hours of day [9, 10, 14, 15]
  preferredTaskDuration: number // minutes
  breakFrequency: number // minutes

  // Task completion patterns
  averageTasksPerDay: number
  highestProductivityDays: string[] // ['Monday', 'Wednesday']

  // Focus areas
  mostActiveLifeAreas: LifeArea[]

  lastUpdated: Date
}

export interface AccountabilityShare {
  _id: string
  userId: string
  partnerId: string
  sharedGoalIds: string[]
  sharedMetrics: boolean
  lastSyncedAt: Date
  createdAt: Date
}

export interface Transaction {
  _id: string
  userId: string
  type: TransactionType
  category: ExpenseCategory
  amount: number
  description: string
  date: Date
  account?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Budget {
  _id: string
  userId: string
  category: ExpenseCategory
  monthlyLimit: number
  currentSpent: number
  alertThreshold: number // percentage (e.g., 80 for 80%)
  month: string // YYYY-MM format
  createdAt: Date
  updatedAt: Date
}

export interface Investment {
  _id: string
  userId: string
  type: InvestmentType
  symbol: string
  name: string
  quantity: number
  buyPrice: number
  currentPrice: number
  totalValue: number
  gainLoss: number
  gainLossPercentage: number
  purchaseDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface FinancialGoal {
  _id: string
  userId: string
  title: string
  targetAmount: number
  currentAmount: number
  targetDate: Date
  category: "emergency-fund" | "savings" | "investment" | "purchase" | "debt-payoff"
  priority: PriorityLevel
  monthlyContribution?: number
  status: "active" | "completed" | "paused"
  createdAt: Date
  updatedAt: Date
}

export interface FinancialSnapshot {
  _id: string
  userId: string
  month: string // YYYY-MM format
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  totalInvestments: number
  netWorth: number
  savingsRate: number // percentage
  expensesByCategory: { category: ExpenseCategory; amount: number }[]
  createdAt: Date
}
