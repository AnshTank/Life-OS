"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, Calendar, Zap, Award, Clock, CheckCircle2 } from "lucide-react"

interface UnifiedStats {
  // Today's Stats
  todayCompleted: number
  todayTotal: number
  todayProgress: number
  
  // Weekly Stats
  weeklyCompleted: number
  weeklyGoal: number
  weeklyProgress: number
  currentStreak: number
  
  // Insights
  topLifeArea: string
  impactScore: number
  upcomingDeadlines: number
}

export function UnifiedInsights() {
  const [stats, setStats] = useState<UnifiedStats>({
    todayCompleted: 0,
    todayTotal: 0,
    todayProgress: 0,
    weeklyCompleted: 0,
    weeklyGoal: 20,
    weeklyProgress: 0,
    currentStreak: 0,
    topLifeArea: "Career",
    impactScore: 8.5,
    upcomingDeadlines: 3
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        // Simulate API call - replace with actual endpoint
        setTimeout(() => {
          setStats({
            todayCompleted: 4,
            todayTotal: 6,
            todayProgress: 67,
            weeklyCompleted: 18,
            weeklyGoal: 20,
            weeklyProgress: 90,
            currentStreak: 5,
            topLifeArea: "Career",
            impactScore: 8.7,
            upcomingDeadlines: 3
          })
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Failed to load stats:", error)
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="h-6 w-40 bg-muted animate-shimmer rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-muted animate-shimmer rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl h-full">
      <CardHeader>
        <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Progress & Insights
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Today's Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Today's Progress
            </span>
            <span className="text-sm font-bold text-green-600">{stats.todayProgress}%</span>
          </div>
          <Progress value={stats.todayProgress} variant="success" className="h-2" />
          <p className="text-xs text-muted-foreground">
            {stats.todayCompleted} of {stats.todayTotal} planned tasks completed
          </p>
        </div>

        {/* Weekly Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              This Week
            </span>
            <span className="text-sm font-bold text-purple-600">{stats.weeklyProgress}%</span>
          </div>
          <Progress value={stats.weeklyProgress} variant="gradient" className="h-2" />
          <p className="text-xs text-muted-foreground">
            {stats.weeklyCompleted} of {stats.weeklyGoal} weekly goal
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl glass text-center">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 w-fit mx-auto mb-2">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="text-lg font-bold text-foreground">{stats.currentStreak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>

          <div className="p-3 rounded-xl glass text-center">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 w-fit mx-auto mb-2">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div className="text-lg font-bold text-foreground">{stats.impactScore}</div>
            <div className="text-xs text-muted-foreground">Impact Score</div>
          </div>

          <div className="p-3 rounded-xl glass text-center">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 w-fit mx-auto mb-2">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div className="text-lg font-bold text-foreground">{stats.upcomingDeadlines}</div>
            <div className="text-xs text-muted-foreground">Deadlines</div>
          </div>
        </div>

        {/* Top Performing Area */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-purple-500" />
              <span className="font-semibold text-sm">Top Area This Week</span>
            </div>
            <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
              🏆 {stats.topLifeArea}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            You're crushing it in this area! Keep the momentum going 🚀
          </p>
        </div>

      </CardContent>
    </Card>
  )
}