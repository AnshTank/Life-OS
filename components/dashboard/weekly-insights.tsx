"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, Calendar, Zap, Award, Clock } from "lucide-react"

interface WeeklyInsights {
  completionRate: number
  totalTasks: number
  completedTasks: number
  topLifeArea: string
  streak: number
  weeklyGoal: number
  thisWeekProgress: number
  upcomingDeadlines: number
}

export function WeeklyInsights() {
  const [insights, setInsights] = useState<WeeklyInsights>({
    completionRate: 0,
    totalTasks: 0,
    completedTasks: 0,
    topLifeArea: "Health",
    streak: 0,
    weeklyGoal: 20,
    thisWeekProgress: 65,
    upcomingDeadlines: 3
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadInsights() {
      try {
        // Simulate API call - replace with actual endpoint
        setTimeout(() => {
          setInsights({
            completionRate: 78,
            totalTasks: 23,
            completedTasks: 18,
            topLifeArea: "Career",
            streak: 5,
            weeklyGoal: 20,
            thisWeekProgress: 85,
            upcomingDeadlines: 4
          })
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Failed to load insights:", error)
        setLoading(false)
      }
    }
    loadInsights()
  }, [])

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-shimmer rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-shimmer rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Weekly Insights 📊
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">This Week's Progress</span>
            <span className="text-sm font-bold text-green-600">{insights.thisWeekProgress}%</span>
          </div>
          <Progress value={insights.thisWeekProgress} variant="success" className="h-2" />
          <p className="text-xs text-muted-foreground">
            {insights.completedTasks} of {insights.weeklyGoal} weekly goal completed
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl glass text-center">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 w-fit mx-auto mb-2">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div className="text-lg font-bold text-foreground">{insights.completedTasks}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>

          <div className="p-3 rounded-xl glass text-center">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 w-fit mx-auto mb-2">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="text-lg font-bold text-foreground">{insights.streak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>

        {/* Top Performing Area */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-5 w-5 text-purple-500" />
            <span className="font-semibold text-sm">Top Performing Area</span>
          </div>
          <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
            🏆 {insights.topLifeArea}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            You're crushing it in this area this week!
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between p-3 rounded-xl glass">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">{insights.upcomingDeadlines} deadlines this week</span>
          </div>
          <Badge variant="outline" className="text-xs">
            View Calendar
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}