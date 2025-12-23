"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { format, subDays } from "date-fns"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface DailyLog {
  date: string
  tasksCompleted: number
  tasksTotal: number
  mood?: number
  productivity?: number
  notes?: string
}

export function DailyProgress() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [todayLog, setTodayLog] = useState({
    mood: 3,
    productivity: 3,
    notes: "",
  })

  useEffect(() => {
    loadDailyLogs()
  }, [])

  async function loadDailyLogs() {
    try {
      const response = await fetch("/api/progress/daily")
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        if (data.today) {
          setTodayLog({
            mood: data.today.mood || 3,
            productivity: data.today.productivity || 3,
            notes: data.today.notes || "",
          })
        }
      }
    } catch (error) {
      console.error("[v0] Failed to load daily logs:", error)
    } finally {
      setLoading(false)
    }
  }

  async function saveToday() {
    try {
      await fetch("/api/progress/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todayLog),
      })
      loadDailyLogs()
    } catch (error) {
      console.error("[v0] Failed to save daily log:", error)
    }
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dateStr = format(date, "yyyy-MM-dd")
    const log = logs.find((l) => l.date === dateStr)
    return {
      date: format(date, "EEE"),
      completionRate: log && log.tasksTotal > 0 ? (log.tasksCompleted / log.tasksTotal) * 100 : 0,
      completed: log?.tasksCompleted || 0,
      total: log?.tasksTotal || 0,
    }
  })

  const todayData = last7Days[last7Days.length - 1]
  const yesterdayData = last7Days[last7Days.length - 2]
  const trend =
    todayData.completionRate > yesterdayData.completionRate
      ? "up"
      : todayData.completionRate < yesterdayData.completionRate
        ? "down"
        : "same"

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's completion</CardTitle>
            <CardDescription>Your task completion rate today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-3xl font-bold">{todayData.completionRate.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">
                  {todayData.completed} of {todayData.total} tasks
                </div>
              </div>
              <div className="flex items-center gap-2">
                {trend === "up" && (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-500">Up from yesterday</span>
                  </>
                )}
                {trend === "down" && (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-500">Down from yesterday</span>
                  </>
                )}
                {trend === "same" && (
                  <>
                    <Minus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Same as yesterday</span>
                  </>
                )}
              </div>
            </div>
            <Progress value={todayData.completionRate} className="h-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7-day overview</CardTitle>
            <CardDescription>Your completion rates this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {last7Days.map((day, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{day.date}</span>
                    <span className="font-medium">{day.total > 0 ? `${day.completed}/${day.total}` : "No tasks"}</span>
                  </div>
                  <Progress value={day.completionRate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's reflection</CardTitle>
          <CardDescription>Log your mood, productivity, and thoughts for the day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label>Mood: {todayLog.mood}/5</Label>
              <Slider
                value={[todayLog.mood]}
                onValueChange={([value]) => setTodayLog({ ...todayLog, mood: value })}
                min={1}
                max={5}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>Neutral</span>
                <span>High</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Productivity: {todayLog.productivity}/5</Label>
              <Slider
                value={[todayLog.productivity]}
                onValueChange={([value]) => setTodayLog({ ...todayLog, productivity: value })}
                min={1}
                max={5}
                step={1}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Daily notes</Label>
            <Textarea
              value={todayLog.notes}
              onChange={(e) => setTodayLog({ ...todayLog, notes: e.target.value })}
              placeholder="What went well? What could be improved? Any insights?"
              rows={4}
            />
          </div>

          <Button onClick={saveToday} className="w-full">
            Save today's reflection
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
