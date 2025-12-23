"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/auth"
import type { Task } from "@/lib/db-types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { CustomChart } from "@/components/ui/custom-chart"
import { Plus, Target, Clock, Zap, TrendingUp, Grid3X3, BarChart3, Calendar, CheckCircle2, Circle, Timer, List, CalendarDays, Activity, Filter, X } from "lucide-react"
import { TaskDialog } from "./task-dialog"

interface TasksViewProps {
  user: User
}

const quadrantConfig = {
  do: { label: "Do First", color: "from-red-500 to-red-600", bgColor: "bg-red-50 dark:bg-red-900/20", borderColor: "border-red-200 dark:border-red-800", icon: Target, description: "Important & Urgent" },
  schedule: { label: "Schedule", color: "from-blue-500 to-blue-600", bgColor: "bg-blue-50 dark:bg-blue-900/20", borderColor: "border-blue-200 dark:border-blue-800", icon: Clock, description: "Important & Not Urgent" },
  delegate: { label: "Delegate", color: "from-yellow-500 to-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-900/20", borderColor: "border-yellow-200 dark:border-yellow-800", icon: TrendingUp, description: "Not Important & Urgent" },
  eliminate: { label: "Eliminate", color: "from-gray-500 to-gray-600", bgColor: "bg-gray-50 dark:bg-gray-900/20", borderColor: "border-gray-200 dark:border-gray-800", icon: Grid3X3, description: "Not Important & Not Urgent" }
}

const statusConfig = {
  todo: { label: "To Do", color: "text-gray-600", bgColor: "bg-gray-100", icon: Circle },
  "in-progress": { label: "In Progress", color: "text-blue-600", bgColor: "bg-blue-100", icon: Timer },
  completed: { label: "Completed", color: "text-green-600", bgColor: "bg-green-100", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-600", bgColor: "bg-red-100", icon: Circle }
}

export function TasksView({ user }: TasksViewProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    quadrant: 'all',
    impact: 'all'
  })

  // Enhanced dummy tasks
  const dummyTasks: Task[] = [
    {
      _id: "t1",
      userId: "user1",
      title: "Complete React project for client",
      description: "Finish the e-commerce dashboard with payment integration",
      lifeArea: "learning",
      impact: 9,
      urgency: 9,
      effort: 7,
      quadrant: "do",
      isHighImpact: true,
      priorityScore: 95,
      dueDate: new Date("2024-01-25"),
      status: "in-progress",
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-22")
    },
    {
      _id: "t2",
      userId: "user1",
      title: "Plan Europe trip itinerary",
      description: "Research destinations, book accommodations, create day-by-day plan",
      lifeArea: "travel",
      impact: 8,
      urgency: 3,
      effort: 5,
      quadrant: "schedule",
      isHighImpact: true,
      priorityScore: 75,
      dueDate: new Date("2024-02-15"),
      status: "todo",
      createdAt: new Date("2024-01-18"),
      updatedAt: new Date("2024-01-18")
    },
    {
      _id: "t3",
      userId: "user1",
      title: "Respond to non-urgent emails",
      description: "Clear inbox of promotional and low-priority emails",
      lifeArea: "personal",
      impact: 2,
      urgency: 7,
      effort: 3,
      quadrant: "delegate",
      isHighImpact: false,
      priorityScore: 35,
      status: "todo",
      createdAt: new Date("2024-01-21"),
      updatedAt: new Date("2024-01-21")
    },
    {
      _id: "t4",
      userId: "user1",
      title: "Organize old photos",
      description: "Sort through and organize photos from last 2 years",
      lifeArea: "personal",
      impact: 3,
      urgency: 2,
      effort: 6,
      quadrant: "eliminate",
      isHighImpact: false,
      priorityScore: 15,
      status: "todo",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15")
    },
    {
      _id: "t5",
      userId: "user1",
      title: "Learn advanced TypeScript patterns",
      description: "Study generics, utility types, and advanced patterns for better code",
      lifeArea: "learning",
      impact: 9,
      urgency: 4,
      effort: 8,
      quadrant: "schedule",
      isHighImpact: true,
      priorityScore: 80,
      status: "in-progress",
      createdAt: new Date("2024-01-19"),
      updatedAt: new Date("2024-01-19")
    },
    {
      _id: "t6",
      userId: "user1",
      title: "Fix critical bug in production",
      description: "Payment gateway failing for 20% of users - immediate fix needed",
      lifeArea: "learning",
      impact: 10,
      urgency: 10,
      effort: 4,
      quadrant: "do",
      isHighImpact: true,
      priorityScore: 100,
      dueDate: new Date("2024-01-23"),
      status: "completed",
      completedAt: new Date("2024-01-22"),
      createdAt: new Date("2024-01-22"),
      updatedAt: new Date("2024-01-22")
    },
    {
      _id: "t7",
      userId: "user1",
      title: "Weekly grocery shopping",
      description: "Buy groceries for the week, meal prep ingredients",
      lifeArea: "personal",
      impact: 6,
      urgency: 8,
      effort: 4,
      quadrant: "delegate",
      isHighImpact: false,
      priorityScore: 60,
      status: "completed",
      completedAt: new Date("2024-01-21"),
      createdAt: new Date("2024-01-21"),
      updatedAt: new Date("2024-01-21")
    },
    {
      _id: "t8",
      userId: "user1",
      title: "Update LinkedIn profile",
      description: "Add recent projects and skills to LinkedIn profile",
      lifeArea: "personal",
      impact: 7,
      urgency: 3,
      effort: 3,
      quadrant: "schedule",
      isHighImpact: false,
      priorityScore: 65,
      status: "todo",
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16")
    }
  ]

  useEffect(() => {
    setTasks(dummyTasks)
    setLoading(false)
  }, [])

  const getQuadrantTasks = (quadrant: string) => tasks.filter(t => t.quadrant === quadrant)
  const highImpactTasks = tasks.filter(t => t.isHighImpact)
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false
    if (filters.quadrant !== 'all' && task.quadrant !== filters.quadrant) return false
    if (filters.impact === 'high' && !task.isHighImpact) return false
    if (filters.impact === 'low' && task.isHighImpact) return false
    return true
  })

  const resetFilters = () => {
    setFilters({ status: 'all', quadrant: 'all', impact: 'all' })
  }

  // Analytics data
  const quadrantStats = Object.keys(quadrantConfig).map(key => ({
    quadrant: key,
    count: getQuadrantTasks(key).length,
    completed: getQuadrantTasks(key).filter(t => t.status === 'completed').length
  }))

  const statusStats = Object.keys(statusConfig).map(key => ({
    status: key,
    count: tasks.filter(t => t.status === key).length
  }))

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-40 h-40 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-gradient-to-r from-green-400/10 to-cyan-400/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Header */}
      <div className="glass-strong border-b relative z-10">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="animate-slide-up flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Smart Tasks
                </span>
                <span className="text-3xl md:text-4xl">🎯</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mb-3 md:mb-4">
                Prioritized using Eisenhower Matrix & Pareto Principle
              </p>
              
              {/* Enhanced stats */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                  <span className="text-sm font-medium">{highImpactTasks.length} high-impact</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                  <span className="text-sm font-medium">{completedTasks} completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                  <span className="text-sm font-medium">{tasks.filter(t => t.status === 'in-progress').length} in progress</span>
                </div>
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 ease-out"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-green-600">{completionRate}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setDialogOpen(true)}
              className="animate-magnetic-hover bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="text-white font-medium">New Task</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl relative z-10">
        <Tabs defaultValue="matrix" className="space-y-6">
          <div className="flex justify-center animate-slide-up">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="matrix" className="flex items-center gap-2 px-4 py-3">
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Matrix</span>
              </TabsTrigger>
              <TabsTrigger value="pareto" className="flex items-center gap-2 px-4 py-3">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">80/20</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 px-4 py-3">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="all-tasks" className="flex items-center gap-2 px-4 py-3">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Tasks</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="matrix" className="animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {Object.entries(quadrantConfig).map(([key, config]) => {
                const quadrantTasks = getQuadrantTasks(key)
                const Icon = config.icon
                const isSelected = selectedQuadrant === key
                return (
                  <Card 
                    key={key} 
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                    }`}
                    onClick={() => setSelectedQuadrant(isSelected ? null : key)}
                  >
                    <CardHeader className="pb-3 md:pb-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-r ${config.color}`}>
                          <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base md:text-lg">{config.label}</CardTitle>
                          <CardDescription className="text-xs md:text-sm">{config.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">{quadrantTasks.length}</Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        {quadrantTasks.slice(0, isSelected ? 10 : 3).map(task => {
                          const StatusIcon = statusConfig[task.status].icon
                          return (
                            <div key={task._id} className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{task.title}</h4>
                                <div className="flex items-center gap-2">
                                  <StatusIcon className={`h-4 w-4 ${statusConfig[task.status].color}`} />
                                  <Badge variant="outline" className="text-xs">
                                    {statusConfig[task.status].label}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Impact: {task.impact}/10</span>
                                <span>Urgency: {task.urgency}/10</span>
                                <span>Effort: {task.effort}/10</span>
                                <span className="font-medium">Score: {task.priorityScore}</span>
                              </div>
                              {task.dueDate && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>Due: {task.dueDate.toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {quadrantTasks.length > 3 && !isSelected && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            +{quadrantTasks.length - 3} more tasks (click to expand)
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="pareto" className="animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* High Impact Tasks */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>High Impact Tasks</CardTitle>
                      <CardDescription>20% effort, 80% impact</CardDescription>
                    </div>
                    <Badge className="bg-green-500/10 text-green-700">{highImpactTasks.length}</Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {highImpactTasks.map(task => {
                      const StatusIcon = statusConfig[task.status].icon
                      return (
                        <div key={task._id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${statusConfig[task.status].color}`} />
                              <Badge variant="outline" className="text-xs">{statusConfig[task.status].label}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="text-green-600 font-medium">Priority: {task.priorityScore}</span>
                            <span>Impact: {task.impact}/10</span>
                            <span>Effort: {task.effort}/10</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Regular Tasks */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle>Regular Tasks</CardTitle>
                      <CardDescription>Standard effort & impact</CardDescription>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-700">{tasks.filter(t => !t.isHighImpact).length}</Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {tasks.filter(t => !t.isHighImpact).map(task => {
                      const StatusIcon = statusConfig[task.status].icon
                      return (
                        <div key={task._id} className="p-3 bg-background/50 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${statusConfig[task.status].color}`} />
                              <Badge variant="outline" className="text-xs">{statusConfig[task.status].label}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Priority: {task.priorityScore}</span>
                            <span>Impact: {task.impact}/10</span>
                            <span>Effort: {task.effort}/10</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="animate-slide-up">
            {/* Key Insights Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-700">{Math.round((completedTasks / totalTasks) * 100)}%</p>
                      <p className="text-sm text-blue-600">Completion Rate</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    <Progress value={(completedTasks / totalTasks) * 100} className="h-2" />
                    <p className="text-xs text-blue-600 mt-1">{completedTasks} of {totalTasks} tasks done</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-700">{Math.round((highImpactTasks.length / totalTasks) * 100)}%</p>
                      <p className="text-sm text-green-600">High Impact</p>
                    </div>
                    <Zap className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-2">
                    <Progress value={(highImpactTasks.length / totalTasks) * 100} className="h-2" />
                    <p className="text-xs text-green-600 mt-1">{highImpactTasks.length} high-impact tasks</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-700">{((tasks.reduce((sum, t) => sum + t.impact, 0) / tasks.reduce((sum, t) => sum + t.effort, 0)) * 10).toFixed(1)}</p>
                      <p className="text-sm text-purple-600">Efficiency Ratio</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-purple-600">Impact per unit effort</p>
                    <p className="text-xs text-purple-500 font-medium">Higher = Better</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-orange-700">{(tasks.reduce((sum, t) => sum + t.impact, 0) / tasks.length).toFixed(1)}</p>
                      <p className="text-sm text-orange-600">Avg Impact</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-500" />
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-orange-600">Out of 10 scale</p>
                    <p className="text-xs text-orange-500 font-medium">Focus on 7+ impact</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Enhanced Task Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3X3 className="h-5 w-5" />
                    Eisenhower Matrix Distribution
                  </CardTitle>
                  <CardDescription>How your tasks are distributed across quadrants</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(quadrantConfig).map(([key, config]) => {
                      const count = getQuadrantTasks(key).length
                      const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
                      const Icon = config.icon
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color} flex-shrink-0`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{config.label}</span>
                              <span className="text-sm font-bold">{count} tasks ({percentage}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">💡 Optimization Tips:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Aim for 60%+ tasks in "Do First" and "Schedule" quadrants</li>
                      <li>• Minimize "Eliminate" quadrant tasks (should be &lt;20%)</li>
                      <li>• "Delegate" tasks can be automated or assigned</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Task Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Task Status Analysis
                  </CardTitle>
                  <CardDescription>Current status of all your tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(statusConfig).map(([key, config]) => {
                      const count = tasks.filter(t => t.status === key).length
                      const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0
                      const Icon = config.icon
                      const colors = {
                        todo: { bg: 'bg-gray-500', text: 'text-gray-700' },
                        'in-progress': { bg: 'bg-blue-500', text: 'text-blue-700' },
                        completed: { bg: 'bg-green-500', text: 'text-green-700' },
                        cancelled: { bg: 'bg-red-500', text: 'text-red-700' }
                      }
                      const color = colors[key as keyof typeof colors]
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${color.bg}/10 flex-shrink-0`}>
                            <Icon className={`h-4 w-4 ${color.text}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{config.label}</span>
                              <span className="text-sm font-bold">{count} tasks ({percentage}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">📊 Status Insights:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Completion rate: {Math.round((completedTasks / totalTasks) * 100)}%</li>
                      <li>• Active tasks: {tasks.filter(t => t.status === 'in-progress').length}</li>
                      <li>• Pending tasks: {tasks.filter(t => t.status === 'todo').length}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Priority Score Analysis */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Priority Score Analysis
                </CardTitle>
                <CardDescription>Understanding your task priorities and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">🎯 High Priority Tasks (80+)</h4>
                    {tasks.filter(t => t.priorityScore >= 80).map(task => (
                      <div key={task._id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{task.title}</span>
                          <Badge className="bg-red-500/10 text-red-700 text-xs">{task.priorityScore}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Impact: {task.impact}</span>
                          <span>Urgency: {task.urgency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">⚡ Medium Priority Tasks (50-79)</h4>
                    {tasks.filter(t => t.priorityScore >= 50 && t.priorityScore < 80).map(task => (
                      <div key={task._id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{task.title}</span>
                          <Badge className="bg-yellow-500/10 text-yellow-700 text-xs">{task.priorityScore}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Impact: {task.impact}</span>
                          <span>Urgency: {task.urgency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">📋 Low Priority Tasks (&lt;50)</h4>
                    {tasks.filter(t => t.priorityScore < 50).map(task => (
                      <div key={task._id} className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{task.title}</span>
                          <Badge className="bg-gray-500/10 text-gray-700 text-xs">{task.priorityScore}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>Impact: {task.impact}</span>
                          <span>Urgency: {task.urgency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Enhanced Analytics Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Impact Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">High Impact Tasks</span>
                      <span className="text-green-600 font-medium">{Math.round((highImpactTasks.length / totalTasks) * 100)}%</span>
                    </div>
                    <Progress value={(highImpactTasks.length / totalTasks) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Avg Impact Score</span>
                      <span className="text-blue-600 font-medium">{(tasks.reduce((sum, t) => sum + t.impact, 0) / tasks.length).toFixed(1)}/10</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Efficiency Ratio</span>
                      <span className="text-purple-600 font-medium">{((tasks.reduce((sum, t) => sum + t.impact, 0) / tasks.reduce((sum, t) => sum + t.effort, 0)) * 10).toFixed(1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3X3 className="h-5 w-5" />
                    Quadrant Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomChart
                    type="bar"
                    data={quadrantStats.map(stat => {
                      const config = quadrantConfig[stat.quadrant as keyof typeof quadrantConfig]
                      return {
                        name: config.label,
                        value: stat.count,
                        color: "#3b82f6"
                      }
                    })}
                    className="space-y-3"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomChart
                    type="bar"
                    data={statusStats.map(stat => {
                      const colors = {
                        todo: "#6b7280",
                        "in-progress": "#3b82f6",
                        completed: "#10b981",
                        cancelled: "#ef4444"
                      }
                      const config = statusConfig[stat.status as keyof typeof statusConfig]
                      return {
                        name: config.label,
                        value: stat.count,
                        color: colors[stat.status as keyof typeof colors]
                      }
                    })}
                    className="space-y-3"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="all-tasks" className="animate-slide-up">
            <div className="space-y-6">
              {/* Task Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <List className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{filteredTasks.length}</p>
                        <p className="text-sm text-muted-foreground">Filtered Tasks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{filteredTasks.filter(t => t.status === 'completed').length}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/10">
                        <Timer className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{filteredTasks.filter(t => t.status === 'in-progress').length}</p>
                        <p className="text-sm text-muted-foreground">In Progress</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Zap className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{filteredTasks.filter(t => t.isHighImpact).length}</p>
                        <p className="text-sm text-muted-foreground">High Impact</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* All Tasks List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <List className="h-5 w-5" />
                        All Tasks
                      </CardTitle>
                      <CardDescription>Complete list of all your tasks sorted by priority</CardDescription>
                    </div>
                    
                    {/* Filter Button */}
                    <div className="flex items-center gap-2">
                      {(filters.status !== 'all' || filters.quadrant !== 'all' || filters.impact !== 'all') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                          className="text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={filterOpen ? 'bg-primary text-primary-foreground' : ''}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </div>
                  
                  {/* Filter Panel */}
                  {filterOpen && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Status Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Status</label>
                          <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full p-2 border rounded-md bg-background text-sm"
                          >
                            <option value="all">All Status</option>
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        
                        {/* Quadrant Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Quadrant</label>
                          <select
                            value={filters.quadrant}
                            onChange={(e) => setFilters(prev => ({ ...prev, quadrant: e.target.value }))}
                            className="w-full p-2 border rounded-md bg-background text-sm"
                          >
                            <option value="all">All Quadrants</option>
                            <option value="do">Do First</option>
                            <option value="schedule">Schedule</option>
                            <option value="delegate">Delegate</option>
                            <option value="eliminate">Eliminate</option>
                          </select>
                        </div>
                        
                        {/* Impact Filter */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Impact Level</label>
                          <select
                            value={filters.impact}
                            onChange={(e) => setFilters(prev => ({ ...prev, impact: e.target.value }))}
                            className="w-full p-2 border rounded-md bg-background text-sm"
                          >
                            <option value="all">All Impact Levels</option>
                            <option value="high">High Impact Only</option>
                            <option value="low">Regular Impact Only</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-muted-foreground">
                        Showing {filteredTasks.length} of {totalTasks} tasks
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredTasks.sort((a, b) => b.priorityScore - a.priorityScore).map(task => {
                      const StatusIcon = statusConfig[task.status].icon
                      const quadrant = quadrantConfig[task.quadrant as keyof typeof quadrantConfig]
                      return (
                        <div key={task._id} className="p-4 rounded-lg border hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg bg-gradient-to-r ${quadrant.color}`}>
                                <quadrant.icon className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <h4 className="font-medium">{task.title}</h4>
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${statusConfig[task.status].color}`} />
                              <Badge variant="outline" className="text-xs">
                                {statusConfig[task.status].label}
                              </Badge>
                              {task.isHighImpact && (
                                <Badge className="bg-green-500/10 text-green-700 text-xs">
                                  High Impact
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <span>Impact: {task.impact}/10</span>
                              <span>Urgency: {task.urgency}/10</span>
                              <span>Effort: {task.effort}/10</span>
                              <span className="font-medium text-foreground">Priority: {task.priorityScore}</span>
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{task.dueDate.toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    
                    {filteredTasks.length === 0 && (
                      <div className="text-center py-12">
                        <div className="text-muted-foreground mb-2">
                          <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No tasks match your filters</p>
                          <p className="text-sm">Try adjusting your filter criteria</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={resetFilters}
                          className="mt-4"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="daily" className="animate-slide-up">
            <div className="space-y-6">
              {/* Today's Focus */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Today's Focus
                  </CardTitle>
                  <CardDescription>Your most important tasks for today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* High Priority Today */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-red-600 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Do First (Urgent & Important)
                      </h4>
                      {getQuadrantTasks("do").slice(0, 3).map(task => (
                        <div key={task._id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <h5 className="font-medium text-sm">{task.title}</h5>
                          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-red-500/10 text-red-700 text-xs">Priority: {task.priorityScore}</Badge>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">Due: {task.dueDate.toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Schedule for Today */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-600 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Schedule (Important & Not Urgent)
                      </h4>
                      {getQuadrantTasks("schedule").slice(0, 3).map(task => (
                        <div key={task._id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h5 className="font-medium text-sm">{task.title}</h5>
                          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-blue-500/10 text-blue-700 text-xs">Priority: {task.priorityScore}</Badge>
                            {task.isHighImpact && (
                              <Badge className="bg-green-500/10 text-green-700 text-xs">High Impact</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Progress */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Today's Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">{completionRate}%</div>
                      <p className="text-sm text-muted-foreground">Tasks Completed</p>
                      <Progress value={completionRate} className="mt-3" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">High Impact Focus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{highImpactTasks.length}</div>
                      <p className="text-sm text-muted-foreground">High Impact Tasks</p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        {Math.round((highImpactTasks.length / totalTasks) * 100)}% of total tasks
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Efficiency Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {((tasks.reduce((sum, t) => sum + t.impact, 0) / tasks.reduce((sum, t) => sum + t.effort, 0)) * 10).toFixed(1)}
                      </div>
                      <p className="text-sm text-muted-foreground">Impact/Effort Ratio</p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Higher is better
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>


        </Tabs>
      </div>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => {}} />
    </div>
  )
}