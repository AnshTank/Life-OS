"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface Stats {
  todayCompleted: number
  todayTotal: number
  weekStreak: number
  impactScore: number
}

export function QuickStats() {
  const [stats, setStats] = useState<Stats>({
    todayCompleted: 0,
    todayTotal: 0,
    weekStreak: 0,
    impactScore: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch("/api/stats/quick")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("[v0] Failed to load stats:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const completionRate = stats.todayTotal > 0 ? (stats.todayCompleted / stats.todayTotal) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Today at a glance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="h-16 bg-muted/50 rounded animate-pulse" />
            <div className="h-16 bg-muted/50 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tasks completed</span>
                <span className="font-medium">
                  {stats.todayCompleted}/{stats.todayTotal}
                </span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Week streak</p>
                <p className="text-2xl font-semibold">{stats.weekStreak}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Impact score</p>
                <p className="text-2xl font-semibold">{stats.impactScore.toFixed(1)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
