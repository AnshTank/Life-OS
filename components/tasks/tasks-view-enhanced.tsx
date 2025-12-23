"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/auth"
import type { Task } from "@/lib/db-types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Plus, Target, Clock, Zap, TrendingUp, Grid3X3, BarChart3, Calendar, CheckCircle2, Circle, Timer } from "lucide-react"
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
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="animate-slide-up">
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Smart Tasks
                </span>
                <span className="text-4xl">🎯</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-4">
                Prioritized using Eisenhower Matrix & Pareto Principle
              </p>
              
              {/* Enhanced stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">{highImpactTasks.length} high-impact</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">{completedTasks} completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
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
              className="animate-magnetic-hover bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="text-white font-medium">New Task</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <Tabs defaultValue="matrix" className="space-y-6">
          <div className="flex items-center justify-between animate-slide-up">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="matrix" className="flex items-center gap-2 text-sm">
                <Grid3X3 className="h-4 w-4" />
                Matrix
              </TabsTrigger>
              <TabsTrigger value="pareto" className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                80/20 Rule
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" />
                Add Task
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="matrix" className="animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${config.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{config.label}</CardTitle>
                          <CardDescription>{config.description}</CardDescription>
                        </div>
                        <Badge variant="outline">{quadrantTasks.length}</Badge>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quadrant Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3X3 className="h-5 w-5" />
                    Quadrant Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quadrantStats.map(stat => {
                    const config = quadrantConfig[stat.quadrant as keyof typeof quadrantConfig]
                    const percentage = totalTasks > 0 ? Math.round((stat.count / totalTasks) * 100) : 0
                    return (
                      <div key={stat.quadrant} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{config.label}</span>
                          <span className="text-muted-foreground">{stat.count} tasks ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statusStats.map(stat => {
                    const config = statusConfig[stat.status as keyof typeof statusConfig]
                    const percentage = totalTasks > 0 ? Math.round((stat.count / totalTasks) * 100) : 0
                    return (
                      <div key={stat.status} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{config.label}</span>
                          <span className="text-muted-foreground">{stat.count} tasks ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Impact Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
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
                      <span className="font-medium">Avg Effort Score</span>
                      <span className="text-orange-600 font-medium">{(tasks.reduce((sum, t) => sum + t.effort, 0) / tasks.length).toFixed(1)}/10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="add" className="animate-slide-up">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Quick Add Task
                </CardTitle>
                <CardDescription>
                  Create a new task with smart prioritization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="w-full h-20 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-6 w-6 mr-3" />
                  Create New Task
                </Button>
                
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Smart Features:</h4>
                    <ul className="space-y-1">
                      <li>• Auto quadrant assignment</li>
                      <li>• Impact-effort analysis</li>
                      <li>• Priority score calculation</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Task Types:</h4>
                    <ul className="space-y-1">
                      <li>• Daily tasks</li>
                      <li>• Project milestones</li>
                      <li>• Long-term goals</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => {}} />
    </div>
  )
}