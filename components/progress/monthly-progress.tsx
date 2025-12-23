"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format } from "date-fns"

interface MonthlyData {
  month: string
  tasksCompleted: number
  completionRate: number
  averageImpact: number
  lifeAreaBreakdown: { area: string; count: number }[]
}

export function MonthlyProgress() {
  const [data, setData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMonthlyData()
  }, [])

  async function loadMonthlyData() {
    try {
      const response = await fetch("/api/progress/monthly")
      if (response.ok) {
        const result = await response.json()
        setData(result.months || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load monthly data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-3">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const currentMonth = data[data.length - 1] || {
    month: format(new Date(), "MMM yyyy"),
    tasksCompleted: 0,
    completionRate: 0,
    averageImpact: 0,
    lifeAreaBreakdown: [],
  }

  const chartData = data.map((d) => ({
    month: d.month,
    completed: d.tasksCompleted,
    rate: d.completionRate,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks completed</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentMonth.tasksCompleted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion rate</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentMonth.completionRate.toFixed(0)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average impact</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentMonth.averageImpact.toFixed(1)}/10</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>6-month trend</CardTitle>
          <CardDescription>Your task completion over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              completed: {
                label: "Tasks completed",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--color-completed)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Focus areas this month</CardTitle>
          <CardDescription>Where you spent your time and energy</CardDescription>
        </CardHeader>
        <CardContent>
          {currentMonth.lifeAreaBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks completed this month yet</p>
          ) : (
            <div className="space-y-3">
              {currentMonth.lifeAreaBreakdown
                .sort((a, b) => b.count - a.count)
                .map((area) => (
                  <div key={area.area} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{area.area}</Badge>
                    </div>
                    <div className="font-medium">{area.count} tasks</div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
