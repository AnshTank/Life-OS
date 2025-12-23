"use client"

import React, { useState, useEffect } from "react"
import type { User } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomChart } from "@/components/ui/custom-chart"
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Calendar, 
  CheckCircle2, 
  BarChart3, 
  Activity, 
  Award, 
  Clock, 
  Users, 
  Brain, 
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Trophy,
  Flame,
  Heart,
  Briefcase,
  GraduationCap,
  Home,
  Plane,
  DollarSign,
  Gamepad2,
  Timer,
  Eye,
  AlertTriangle
} from "lucide-react"

interface ProgressViewProps {
  user: User
}

interface LifeAreaProgress {
  area: string
  icon: any
  color: string
  progress: number
  tasksCompleted: number
  totalTasks: number
  goalsAchieved: number
  totalGoals: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
}

interface OverallStats {
  totalTasks: number
  completedTasks: number
  totalGoals: number
  achievedGoals: number
  activeProblems: number
  solvedProblems: number
  productivityScore: number
  weeklyStreak: number
  monthlyStreak: number
  lifeSatisfactionScore: number
}

export function ProgressView({ user }: ProgressViewProps) {
  const [loading, setLoading] = useState(true)
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalTasks: 47,
    completedTasks: 32,
    totalGoals: 18,
    achievedGoals: 12,
    activeProblems: 5,
    solvedProblems: 8,
    productivityScore: 87,
    weeklyStreak: 12,
    monthlyStreak: 3,
    lifeSatisfactionScore: 8.4
  })

  const [lifeAreaProgress, setLifeAreaProgress] = useState<LifeAreaProgress[]>([
    {
      area: "Health & Fitness",
      icon: Heart,
      color: "from-slate-600 to-slate-700",
      progress: 78,
      tasksCompleted: 15,
      totalTasks: 20,
      goalsAchieved: 3,
      totalGoals: 4,
      trend: 'up',
      trendValue: 12
    },
    {
      area: "Career & Work",
      icon: Briefcase,
      color: "from-slate-700 to-slate-800",
      progress: 92,
      tasksCompleted: 23,
      totalTasks: 25,
      goalsAchieved: 5,
      totalGoals: 6,
      trend: 'up',
      trendValue: 8
    },
    {
      area: "Learning & Growth",
      icon: GraduationCap,
      color: "from-slate-600 to-slate-700",
      progress: 65,
      tasksCompleted: 8,
      totalTasks: 12,
      goalsAchieved: 2,
      totalGoals: 4,
      trend: 'stable',
      trendValue: 0
    },
    {
      area: "Personal & Family",
      icon: Home,
      color: "from-slate-700 to-slate-800",
      progress: 84,
      tasksCompleted: 12,
      totalTasks: 14,
      goalsAchieved: 3,
      totalGoals: 3,
      trend: 'up',
      trendValue: 15
    },
    {
      area: "Travel & Adventure",
      icon: Plane,
      color: "from-slate-600 to-slate-700",
      progress: 45,
      tasksCompleted: 3,
      totalTasks: 8,
      goalsAchieved: 1,
      totalGoals: 3,
      trend: 'down',
      trendValue: -5
    },
    {
      area: "Finance & Wealth",
      icon: DollarSign,
      color: "from-slate-700 to-slate-800",
      progress: 71,
      tasksCompleted: 7,
      totalTasks: 10,
      goalsAchieved: 2,
      totalGoals: 3,
      trend: 'up',
      trendValue: 18
    }
  ])

  useEffect(() => {
    setLoading(false)
  }, [])

  const completionRate = Math.round((overallStats.completedTasks / overallStats.totalTasks) * 100)
  const goalAchievementRate = Math.round((overallStats.achievedGoals / overallStats.totalGoals) * 100)
  const problemSolutionRate = Math.round((overallStats.solvedProblems / (overallStats.activeProblems + overallStats.solvedProblems)) * 100)

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-3 w-3 text-green-500" />
      case 'down': return <ArrowDown className="h-3 w-3 text-red-500" />
      case 'stable': return <Minus className="h-3 w-3 text-gray-500" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      case 'stable': return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <div className="glass-strong border-b relative z-10">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
          <div className="animate-slide-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500">
                <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Life Progress Analytics
                </h1>
                <p className="text-muted-foreground text-base md:text-lg mt-1">
                  Comprehensive analysis of your life optimization journey
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="flex items-center gap-2 p-2 md:p-3 glass rounded-lg md:rounded-xl">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Overall Score</p>
                  <p className="font-bold text-base md:text-lg">{overallStats.productivityScore}/100</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 md:p-3 glass rounded-lg md:rounded-xl">
                <Flame className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Weekly Streak</p>
                  <p className="font-bold text-base md:text-lg">{overallStats.weeklyStreak} days</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 md:p-3 glass rounded-lg md:rounded-xl">
                <Star className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Life Satisfaction</p>
                  <p className="font-bold text-base md:text-lg">{overallStats.lifeSatisfactionScore}/10</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 md:p-3 glass rounded-lg md:rounded-xl">
                <Target className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Goals Hit Rate</p>
                  <p className="font-bold text-base md:text-lg">{goalAchievementRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl relative z-10">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="overview" className="flex items-center gap-2 px-4 py-3">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="life-areas" className="flex items-center gap-2 px-4 py-3">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Areas</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 px-4 py-3">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 px-4 py-3">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Insights</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="animate-slide-up">
            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="relative overflow-hidden border-0 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-700">Tasks</Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold mt-4">Task Completion</CardTitle>
                  <CardDescription>Your task execution performance</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold mb-2">{completionRate}%</div>
                  <Progress value={completionRate} className="h-3 mb-4" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{overallStats.completedTasks} completed</span>
                    <span>{overallStats.totalTasks} total</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-green-500/10 text-green-700">Goals</Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold mt-4">Goal Achievement</CardTitle>
                  <CardDescription>Your goal completion success rate</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold mb-2">{goalAchievementRate}%</div>
                  <Progress value={goalAchievementRate} className="h-3 mb-4" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{overallStats.achievedGoals} achieved</span>
                    <span>{overallStats.totalGoals} total</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-purple-500/10 text-purple-700">Problems</Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold mt-4">Problem Solving</CardTitle>
                  <CardDescription>Your problem resolution efficiency</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-4xl font-bold mb-2">{problemSolutionRate}%</div>
                  <Progress value={problemSolutionRate} className="h-3 mb-4" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{overallStats.solvedProblems} solved</span>
                    <span>{overallStats.activeProblems} active</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Life Balance Radar */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Life Balance Overview
                </CardTitle>
                <CardDescription>Visual representation of your progress across all life areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {lifeAreaProgress.map((area, index) => {
                    const Icon = area.icon
                    return (
                      <div key={area.area} className="p-4 glass rounded-xl hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${area.color}`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{area.area}</h4>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(area.trend)}
                              <span className={`text-xs ${getTrendColor(area.trend)}`}>
                                {area.trend === 'stable' ? 'Stable' : `${Math.abs(area.trendValue)}%`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Progress</span>
                            <span className="font-medium">{area.progress}%</span>
                          </div>
                          <Progress value={area.progress} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Tasks: {area.tasksCompleted}/{area.totalTasks}</span>
                            <span>Goals: {area.goalsAchieved}/{area.totalGoals}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="life-areas" className="animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {lifeAreaProgress.map((area, index) => {
                const Icon = area.icon
                return (
                  <Card key={area.area} className="border shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${area.color}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{area.area}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {getTrendIcon(area.trend)}
                              <span className={`text-sm ${getTrendColor(area.trend)}`}>
                                {area.trend === 'stable' ? 'Stable performance' : 
                                 area.trend === 'up' ? `+${area.trendValue}% this week` : 
                                 `${area.trendValue}% this week`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{area.progress}%</div>
                          <div className="text-xs text-muted-foreground">Overall</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress value={area.progress} className="h-3" />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Tasks</span>
                          </div>
                          <div className="text-lg font-bold">{area.tasksCompleted}/{area.totalTasks}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((area.tasksCompleted / area.totalTasks) * 100)}% completed
                          </div>
                        </div>
                        
                        <div className="p-3 bg-muted/50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Goals</span>
                          </div>
                          <div className="text-lg font-bold">{area.goalsAchieved}/{area.totalGoals}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((area.goalsAchieved / area.totalGoals) * 100)}% achieved
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="animate-slide-up">
            {/* Discipline & Motivation Hub */}
            <Card className="mb-8 relative overflow-hidden border-0 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600">
                      <Flame className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Discipline & Motivation Engine</CardTitle>
                      <CardDescription className="text-base">Your mental strength and consistency metrics</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-indigo-500/10 text-indigo-700 px-4 py-2 text-sm font-medium">
                    Elite Level
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Discipline Score */}
                  <div className="text-center p-6 glass rounded-2xl">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-muted stroke-current"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-indigo-500 stroke-current animate-pulse"
                          strokeWidth="3"
                          strokeDasharray="89, 100"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          style={{ animation: 'progress-fill 2s ease-out' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-indigo-600 animate-bounce">89</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Discipline Score</h3>
                    <p className="text-sm text-muted-foreground">Consistency in tough days</p>
                    <Badge className="mt-2 bg-indigo-500/10 text-indigo-700">Warrior</Badge>
                  </div>

                  {/* Motivation Level */}
                  <div className="text-center p-6 glass rounded-2xl">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-muted stroke-current"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-purple-500 stroke-current animate-pulse"
                          strokeWidth="3"
                          strokeDasharray="76, 100"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          style={{ animation: 'progress-fill 2s ease-out 0.5s both' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-purple-600 animate-bounce" style={{ animationDelay: '0.5s' }}>76</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Motivation Level</h3>
                    <p className="text-sm text-muted-foreground">Energy & enthusiasm</p>
                    <Badge className="mt-2 bg-purple-500/10 text-purple-700">High</Badge>
                  </div>

                  {/* Mental Resilience */}
                  <div className="text-center p-6 glass rounded-2xl">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-muted stroke-current"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500 stroke-current animate-pulse"
                          strokeWidth="3"
                          strokeDasharray="82, 100"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          style={{ animation: 'progress-fill 2s ease-out 1s both' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-emerald-600 animate-bounce" style={{ animationDelay: '1s' }}>82</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Mental Resilience</h3>
                    <p className="text-sm text-muted-foreground">Bounce back ability</p>
                    <Badge className="mt-2 bg-emerald-500/10 text-emerald-700">Strong</Badge>
                  </div>

                  {/* Flow State Frequency */}
                  <div className="text-center p-6 glass rounded-2xl">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-muted stroke-current"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-cyan-500 stroke-current animate-pulse"
                          strokeWidth="3"
                          strokeDasharray="68, 100"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          style={{ animation: 'progress-fill 2s ease-out 1.5s both' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-cyan-600 animate-bounce" style={{ animationDelay: '1.5s' }}>68</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Flow State</h3>
                    <p className="text-sm text-muted-foreground">Deep focus frequency</p>
                    <Badge className="mt-2 bg-cyan-500/10 text-cyan-700">Good</Badge>
                  </div>
                </div>

                {/* Discipline Insights */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 glass rounded-2xl">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-indigo-500" />
                      Discipline Patterns
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                        <span className="text-sm">Monday Momentum</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="w-4/5 h-full bg-gradient-to-r from-green-500 to-emerald-500 animate-slide-right" style={{ animationDelay: '0.2s' }} />
                          </div>
                          <span className="text-xs font-medium">94%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                        <span className="text-sm">Weekend Consistency</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="w-3/5 h-full bg-gradient-to-r from-yellow-500 to-orange-500 animate-slide-right" style={{ animationDelay: '0.4s' }} />
                          </div>
                          <span className="text-xs font-medium">67%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                        <span className="text-sm">Tough Day Recovery</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="w-4/5 h-full bg-gradient-to-r from-purple-500 to-violet-500 animate-slide-right" style={{ animationDelay: '0.6s' }} />
                          </div>
                          <span className="text-xs font-medium">89%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 glass rounded-2xl">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-500" />
                      Motivation Triggers
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        <span className="text-sm flex-1">Progress visualization</span>
                        <span className="text-xs text-green-600 font-medium">+23% boost</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" style={{ animationDelay: '0.5s' }} />
                        <span className="text-sm flex-1">Achievement unlocks</span>
                        <span className="text-xs text-blue-600 font-medium">+18% boost</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" style={{ animationDelay: '1s' }} />
                        <span className="text-sm flex-1">Streak milestones</span>
                        <span className="text-xs text-purple-600 font-medium">+31% boost</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" style={{ animationDelay: '1.5s' }} />
                        <span className="text-sm flex-1">Social accountability</span>
                        <span className="text-xs text-orange-600 font-medium">+15% boost</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Visualization Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Progress Trend Line Chart */}
              <Card className="relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Progress Trajectory (30 Days)
                  </CardTitle>
                  <CardDescription>Your optimization journey with trend analysis</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="h-64 relative">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      {/* Grid lines */}
                      <defs>
                        <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      
                      {/* Progress line */}
                      <path
                        d="M 50 150 Q 120 140 150 120 T 250 80 T 350 50"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      
                      {/* Area under curve */}
                      <path
                        d="M 50 150 Q 120 140 150 120 T 250 80 T 350 50 L 350 180 L 50 180 Z"
                        fill="url(#areaGradient)"
                        fillOpacity="0.1"
                      />
                      
                      <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Data points */}
                      {[
                        { x: 50, y: 150, value: 65, week: 'Week 1' },
                        { x: 150, y: 120, value: 72, week: 'Week 2' },
                        { x: 250, y: 80, value: 78, week: 'Week 3' },
                        { x: 350, y: 50, value: 87, week: 'Week 4' }
                      ].map((point, index) => (
                        <g key={`point-${index}`}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="6"
                            fill="#6366f1"
                            className="cursor-pointer hover:r-8 transition-all"
                          />
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="12"
                            fill="#6366f1"
                            fillOpacity="0.2"
                          />
                          <text
                            x={point.x}
                            y={point.y - 15}
                            textAnchor="middle"
                            className="text-xs font-medium fill-current"
                          >
                            {point.value}
                          </text>
                        </g>
                      ))}
                      
                      {/* Prediction line */}
                      <path
                        d="M 350 50 Q 380 40 400 35"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    </svg>
                  </div>
                  <div className="mt-4 p-3 glass rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-green-600">+22 points improvement</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Predicted: 92 by next week
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Life Balance Radar Chart */}
              <Card className="relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Life Balance Radar
                  </CardTitle>
                  <CardDescription>360° view of your life optimization</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="h-64 flex items-center justify-center">
                    <svg className="w-64 h-64" viewBox="0 0 200 200">
                      {/* Radar grid */}
                      <g>
                        {[1, 2, 3, 4, 5].map(ring => (
                          <circle
                            key={ring}
                            cx="100"
                            cy="100"
                            r={ring * 15}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.5"
                            className="text-muted-foreground/30"
                          />
                        ))}
                        
                        {/* Radar axes */}
                        {lifeAreaProgress.map((area, index) => {
                          const angle = (index * 60) - 90
                          const x2 = 100 + Math.cos(angle * Math.PI / 180) * 75
                          const y2 = 100 + Math.sin(angle * Math.PI / 180) * 75
                          return (
                            <line
                              key={`axis-${index}`}
                              x1="100"
                              y1="100"
                              x2={x2}
                              y2={y2}
                              stroke="currentColor"
                              strokeWidth="0.5"
                              className="text-muted-foreground/30"
                            />
                          )
                        })}
                      </g>
                      
                      {/* Data polygon */}
                      <polygon
                        points={lifeAreaProgress.map((area, index) => {
                          const angle = (index * 60) - 90
                          const radius = (area.progress / 100) * 75
                          const x = 100 + Math.cos(angle * Math.PI / 180) * radius
                          const y = 100 + Math.sin(angle * Math.PI / 180) * radius
                          return `${x},${y}`
                        }).join(' ')}
                        fill="#6366f1"
                        fillOpacity="0.2"
                        stroke="#6366f1"
                        strokeWidth="2"
                      />
                      
                      {/* Data points */}
                      {lifeAreaProgress.map((area, index) => {
                        const angle = (index * 60) - 90
                        const radius = (area.progress / 100) * 75
                        const x = 100 + Math.cos(angle * Math.PI / 180) * radius
                        const y = 100 + Math.sin(angle * Math.PI / 180) * radius
                        return (
                          <g key={`data-point-${index}`}>
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#6366f1"
                              className="cursor-pointer"
                            />
                            <text
                              x={x + 10}
                              y={y - 10}
                              className="text-xs font-medium fill-current"
                            >
                              {area.progress}%
                            </text>
                          </g>
                        )
                      })}
                      
                      {/* Labels */}
                      {lifeAreaProgress.map((area, index) => {
                        const angle = (index * 60) - 90
                        const labelRadius = 85
                        const x = 100 + Math.cos(angle * Math.PI / 180) * labelRadius
                        const y = 100 + Math.sin(angle * Math.PI / 180) * labelRadius
                        return (
                          <text
                            key={`label-${index}`}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-xs font-medium fill-current"
                          >
                            {area.area.split(' ')[0]}
                          </text>
                        )
                      })}
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Task Completion Donut Chart */}
              <Card className="relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Task Completion
                  </CardTitle>
                  <CardDescription>Overall task performance</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="h-48 flex items-center justify-center">
                    <svg className="w-32 h-32" viewBox="0 0 42 42">
                      <circle
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <circle
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke="#6366f1"
                        strokeWidth="3"
                        strokeDasharray={`${completionRate} ${100 - completionRate}`}
                        strokeDashoffset="25"
                        strokeLinecap="round"
                      />
                      <text
                        x="21"
                        y="21"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-bold fill-current"
                      >
                        {completionRate}%
                      </text>
                    </svg>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {overallStats.completedTasks} of {overallStats.totalTasks} tasks completed
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <ArrowUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+8% this week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Goal Achievement Donut Chart */}
              <Card className="relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goal Achievement
                  </CardTitle>
                  <CardDescription>Success rate tracking</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="h-48 flex items-center justify-center">
                    <svg className="w-32 h-32" viewBox="0 0 42 42">
                      <circle
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <circle
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeDasharray={`${goalAchievementRate} ${100 - goalAchievementRate}`}
                        strokeDashoffset="25"
                        strokeLinecap="round"
                      />
                      <text
                        x="21"
                        y="21"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-bold fill-current"
                      >
                        {goalAchievementRate}%
                      </text>
                    </svg>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {overallStats.achievedGoals} of {overallStats.totalGoals} goals achieved
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <ArrowUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+12% this month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Problem Resolution Donut Chart */}
              <Card className="relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Problem Resolution
                  </CardTitle>
                  <CardDescription>Solution efficiency</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="h-48 flex items-center justify-center">
                    <svg className="w-32 h-32" viewBox="0 0 42 42">
                      <circle
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <circle
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="transparent"
                        stroke="#8b5cf6"
                        strokeWidth="3"
                        strokeDasharray={`${problemSolutionRate} ${100 - problemSolutionRate}`}
                        strokeDashoffset="25"
                        strokeLinecap="round"
                      />
                      <text
                        x="21"
                        y="21"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-bold fill-current"
                      >
                        {problemSolutionRate}%
                      </text>
                    </svg>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {overallStats.solvedProblems} problems solved
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <ArrowUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+5% this week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Horizontal Performance Timeline */}
            <Card className="mb-6 relative overflow-hidden border-0 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Timeline (Last 30 Days)
                </CardTitle>
                <CardDescription>Daily productivity scores with trend analysis</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="h-32 relative">
                  <svg className="w-full h-full" viewBox="0 0 800 120">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="timelineGrid" width="26.67" height="24" patternUnits="userSpaceOnUse">
                        <path d="M 26.67 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/10" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#timelineGrid)" />
                    
                    {/* Baseline */}
                    <line x1="40" y1="100" x2="760" y2="100" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/30" />
                    
                    {/* Performance bars */}
                    {Array.from({ length: 30 }, (_, i) => {
                      const x = 40 + (i * 24)
                      const score = Math.floor(Math.random() * 80) + 20
                      const height = (score / 100) * 80
                      const color = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#ef4444'
                      
                      return (
                        <g key={`bar-${i}`}>
                          <rect
                            x={x - 8}
                            y={100 - height}
                            width="16"
                            height={height}
                            fill={color}
                            rx="2"
                            className="hover:opacity-80 cursor-pointer"
                          />
                          {i % 5 === 0 && (
                            <text
                              x={x}
                              y="115"
                              textAnchor="middle"
                              className="text-xs fill-current text-muted-foreground"
                            >
                              {i + 1}
                            </text>
                          )}
                        </g>
                      )
                    })}
                    
                    {/* Average line */}
                    <line x1="40" y1="35" x2="760" y2="35" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" />
                    <text x="765" y="39" className="text-xs fill-current text-purple-600">Avg: 65%</text>
                  </svg>
                </div>
                
                <div className="mt-4 grid grid-cols-4 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span>Excellent (80%+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span>Good (60-79%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded" />
                    <span>Fair (40-59%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <span>Needs Work (&lt;40%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Life Area Performance Bar Chart */}
            <Card className="mb-6 relative overflow-hidden border-0 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Life Area Performance Analysis
                </CardTitle>
                <CardDescription>Detailed breakdown of progress across all life areas</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-6">
                  {lifeAreaProgress.map((area, index) => {
                    const Icon = area.icon
                    return (
                      <div key={area.area} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${area.color}`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{area.area}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Tasks: {area.tasksCompleted}/{area.totalTasks}</span>
                                <span>•</span>
                                <span>Goals: {area.goalsAchieved}/{area.totalGoals}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  {getTrendIcon(area.trend)}
                                  <span className={getTrendColor(area.trend)}>
                                    {area.trend === 'stable' ? 'Stable' : `${Math.abs(area.trendValue)}%`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{area.progress}%</div>
                            <div className="text-xs text-muted-foreground">Overall</div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="relative">
                          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${area.color} transition-all duration-1000 ease-out relative`}
                              style={{ width: `${area.progress}%` }}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white drop-shadow-sm">
                              {area.progress}% Complete
                            </span>
                          </div>
                        </div>
                        
                        {/* Sub-metrics */}
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div className="text-center p-2 glass rounded-lg">
                            <div className="font-medium">Task Rate</div>
                            <div className="text-muted-foreground">
                              {Math.round((area.tasksCompleted / area.totalTasks) * 100)}%
                            </div>
                          </div>
                          <div className="text-center p-2 glass rounded-lg">
                            <div className="font-medium">Goal Rate</div>
                            <div className="text-muted-foreground">
                              {Math.round((area.goalsAchieved / area.totalGoals) * 100)}%
                            </div>
                          </div>
                          <div className="text-center p-2 glass rounded-lg">
                            <div className="font-medium">Efficiency</div>
                            <div className="text-muted-foreground">
                              {((area.tasksCompleted + area.goalsAchieved) / (area.tasksCompleted + area.goalsAchieved + 1) * 10).toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Compact Productivity Heatmap */}
            <Card className="mb-6 relative overflow-hidden border-0 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Weekly Productivity Pattern
                </CardTitle>
                <CardDescription>Last 2 weeks performance overview</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-3">
                  {/* Week labels and compact heatmap */}
                  <div className="grid grid-cols-8 gap-2">
                    <div></div>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <div key={day} className="text-xs text-center text-muted-foreground p-1">{day}</div>
                    ))}
                    
                    {Array.from({ length: 2 }, (_, weekIndex) => (
                      <React.Fragment key={`week-fragment-${weekIndex}`}>
                        <div key={`week-${weekIndex}`} className="text-xs text-muted-foreground flex items-center">
                          Week {weekIndex + 1}
                        </div>
                        {Array.from({ length: 7 }, (_, dayIndex) => {
                          const intensity = Math.floor(Math.random() * 5)
                          const colors = [
                            'bg-muted hover:bg-muted/80',
                            'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700',
                            'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600',
                            'bg-slate-400 dark:bg-slate-600 hover:bg-slate-500 dark:hover:bg-slate-500',
                            'bg-slate-500 dark:bg-slate-500 hover:bg-slate-600 dark:hover:bg-slate-400'
                          ]
                          return (
                            <div
                              key={`${weekIndex}-${dayIndex}`}
                              className={`aspect-square rounded-sm ${colors[intensity]} hover:scale-110 transition-all cursor-pointer relative group`}
                              title={`Week ${weekIndex + 1}, Day ${dayIndex + 1}: ${intensity * 25}% productivity`}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm" />
                            </div>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Less productive</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-sm ${
                          i === 0 ? 'bg-muted' :
                          i === 1 ? 'bg-slate-200 dark:bg-slate-800' :
                          i === 2 ? 'bg-slate-300 dark:bg-slate-700' :
                          i === 3 ? 'bg-slate-400 dark:bg-slate-600' :
                          'bg-slate-500 dark:bg-slate-500'
                        }`} />
                      ))}
                    </div>
                    <span>More productive</span>
                  </div>
                  
                  {/* Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs font-medium">Peak Days</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Tue & Wed (89% avg)</p>
                    </div>
                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-xs font-medium">Opportunity</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Weekend +23% potential</p>
                    </div>
                    <div className="p-3 glass rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-medium">Pattern</span>
                      </div>
                      <p className="text-xs text-muted-foreground">4-day cycles detected</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
                <CardContent className="p-6 relative">
                  <div className="p-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{overallStats.productivityScore}</div>
                  <div className="text-sm text-muted-foreground mb-3">Elite Performance Score</div>
                  <div className="flex items-center justify-center gap-2">
                    <ArrowUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">+12 this week</span>
                  </div>
                  <Badge className="mt-3 bg-indigo-500/10 text-indigo-700">Top 5% Performer</Badge>
                </CardContent>
              </Card>

              <Card className="text-center relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5" />
                <CardContent className="p-6 relative">
                  <div className="p-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Flame className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{overallStats.weeklyStreak}</div>
                  <div className="text-sm text-muted-foreground mb-3">Consistency Streak</div>
                  <div className="flex items-center justify-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-orange-600 font-medium">Longest: 28 days</span>
                  </div>
                  <Badge className="mt-3 bg-emerald-500/10 text-emerald-700">Unstoppable</Badge>
                </CardContent>
              </Card>

              <Card className="text-center relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5" />
                <CardContent className="p-6 relative">
                  <div className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{overallStats.lifeSatisfactionScore}</div>
                  <div className="text-sm text-muted-foreground mb-3">Life Satisfaction Index</div>
                  <div className="flex items-center justify-center gap-2">
                    <ArrowUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">+0.8 this month</span>
                  </div>
                  <Badge className="mt-3 bg-purple-500/10 text-purple-700">Thriving</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Psychological Performance Analysis */}
              <Card className="relative overflow-hidden border-0 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5" />
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Psychological Performance</CardTitle>
                      <CardDescription>Deep analysis of your mental patterns and triggers</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  {/* Mental State Tracking */}
                  <div className="p-5 glass rounded-2xl">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-slate-600" />
                      Mental State Patterns
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Peak Performance</span>
                          <span className="text-sm text-slate-600">9-11 AM</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Creative Flow</span>
                          <span className="text-sm text-slate-600">2-4 PM</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Decision Fatigue</span>
                          <span className="text-sm text-slate-600">6-8 PM</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Stress Threshold</span>
                          <span className="text-sm text-slate-600">7.2/10</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Recovery Rate</span>
                          <span className="text-sm text-slate-600">Fast</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Adaptation Speed</span>
                          <span className="text-sm text-slate-600">High</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Behavioral Triggers */}
                  <div className="p-5 glass rounded-2xl">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-slate-600" />
                      Performance Triggers
                    </h4>
                    <div className="space-y-3">
                      {[
                        { trigger: 'Visual progress tracking', impact: '+34%', type: 'positive' },
                        { trigger: 'Social accountability', impact: '+28%', type: 'positive' },
                        { trigger: 'Perfectionism tendency', impact: '-15%', type: 'negative' },
                        { trigger: 'Multitasking attempts', impact: '-22%', type: 'negative' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                          <span className="text-sm">{item.trigger}</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              item.type === 'positive' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span className={`text-xs font-medium ${
                              item.type === 'positive' ? 'text-green-600' : 'text-red-600'
                            }`}>{item.impact}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cognitive Load Analysis */}
                  <div className="p-5 glass rounded-2xl">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-slate-600" />
                      Cognitive Load Distribution
                    </h4>
                    <div className="space-y-4">
                      {[
                        { category: 'Deep Work', load: 45, optimal: true },
                        { category: 'Administrative', load: 25, optimal: true },
                        { category: 'Communication', load: 20, optimal: true },
                        { category: 'Context Switching', load: 10, optimal: false }
                      ].map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{item.load}%</span>
                              {item.optimal ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                          </div>
                          <Progress value={item.load} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personalized Optimization Engine */}
              <Card className="relative overflow-hidden border-0 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5" />
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 animate-pulse">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>Optimization Engine</CardTitle>
                      <CardDescription>AI-powered recommendations for peak performance</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  {/* Priority Optimization */}
                  <div className="p-5 glass rounded-2xl border-l-4 border-slate-500">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-slate-600" />
                      <span className="font-semibold text-slate-700">Critical Optimization</span>
                    </div>
                    <h4 className="font-medium mb-2">Discipline Consistency Gap</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your weekend discipline drops 27% compared to weekdays. Implementing a "Weekend Warrior" protocol could boost overall consistency by 15-20%.
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-500/10 text-slate-700">High Impact</Badge>
                      <Badge className="bg-slate-500/10 text-slate-700">Quick Win</Badge>
                    </div>
                  </div>

                  {/* Behavioral Insights */}
                  <div className="p-5 glass rounded-2xl border-l-4 border-slate-600">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-4 w-4 text-slate-600" />
                      <span className="font-semibold text-slate-700">Behavioral Pattern</span>
                    </div>
                    <h4 className="font-medium mb-2">Flow State Optimization</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      You enter flow state 68% faster when starting with 5-minute preparation rituals. Consider implementing "Flow Triggers" before deep work sessions.
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-500/10 text-slate-700">Proven Pattern</Badge>
                      <Badge className="bg-slate-500/10 text-slate-700">+68% Efficiency</Badge>
                    </div>
                  </div>

                  {/* Strategic Recommendations */}
                  <div className="p-5 glass rounded-2xl border-l-4 border-slate-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-slate-600" />
                      <span className="font-semibold text-slate-700">Strategic Focus</span>
                    </div>
                    <h4 className="font-medium mb-2">Energy Investment Rebalancing</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your Career area (92%) is overshadowing Travel (45%). Allocating 20% of career momentum to travel planning could create better life balance without performance loss.
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-500/10 text-slate-700">Balance Optimization</Badge>
                      <Badge className="bg-slate-500/10 text-slate-700">Sustainable</Badge>
                    </div>
                  </div>

                  {/* Motivation Maintenance */}
                  <div className="p-5 glass rounded-2xl border-l-4 border-slate-500">
                    <div className="flex items-center gap-2 mb-3">
                      <Flame className="h-4 w-4 text-slate-600" />
                      <span className="font-semibold text-slate-700">Motivation Engine</span>
                    </div>
                    <h4 className="font-medium mb-2">Streak Milestone Strategy</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your 12-day streak shows strong momentum. Setting micro-milestones at 15, 20, and 30 days with specific rewards will maintain motivation through the "plateau phase".
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-500/10 text-slate-700">Momentum Keeper</Badge>
                      <Badge className="bg-slate-500/10 text-slate-700">Psychological</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Metrics Dashboard */}
            <Card className="relative overflow-hidden border-0 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Advanced Performance Metrics
                </CardTitle>
                <CardDescription>Comprehensive analysis of your optimization journey</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    {
                      title: "Discipline Coefficient",
                      value: "0.89",
                      subtitle: "Consistency under pressure",
                      trend: "+0.12",
                      icon: Flame,
                      description: "Measures ability to maintain standards during challenging periods"
                    },
                    {
                      title: "Adaptation Velocity",
                      value: "2.3x",
                      subtitle: "Learning curve acceleration",
                      trend: "+0.4x",
                      icon: Brain,
                      description: "Speed of integrating new habits and optimizations"
                    },
                    {
                      title: "Motivation Sustainability",
                      value: "76%",
                      subtitle: "Long-term drive retention",
                      trend: "+8%",
                      icon: Star,
                      description: "Ability to maintain enthusiasm over extended periods"
                    },
                    {
                      title: "System Resilience",
                      value: "8.4/10",
                      subtitle: "Recovery from setbacks",
                      trend: "+1.2",
                      icon: Trophy,
                      description: "Capacity to bounce back and maintain progress after disruptions"
                    }
                  ].map((metric, index) => (
                    <div key={index} className="p-6 glass rounded-2xl text-center group hover:shadow-lg transition-all duration-300">
                      <div className="p-3 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 w-12 h-12 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <metric.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold mb-1">{metric.value}</div>
                      <div className="text-sm font-medium mb-2">{metric.title}</div>
                      <div className="text-xs text-muted-foreground mb-3">{metric.subtitle}</div>
                      <div className="flex items-center justify-center gap-1 mb-3">
                        <ArrowUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">{metric.trend}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{metric.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
