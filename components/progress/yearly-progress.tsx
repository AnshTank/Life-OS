"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface YearlyData {
  year: number
  totalTasks: number
  completedTasks: number
  averageImpact: number
  topLifeAreas: { area: string; count: number }[]
  goalsCompleted: number
}

export function YearlyProgress() {
  const [data, setData] = useState<YearlyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadYearlyData()
  }, [])

  async function loadYearlyData() {
    try {
      const response = await fetch("/api/progress/yearly")
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("[v0] Failed to load yearly data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-3">
              <div className="h-6 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">No data available for this year yet</p>
        </CardContent>
      </Card>
    )
  }

  const completionRate = data.totalTasks > 0 ? (data.completedTasks / data.totalTasks) * 100 : 0

  const chartData = data.topLifeAreas.map((area) => ({
    area: area.area,
    count: area.count,
  }))

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="text-2xl">{data.year} at a glance</CardTitle>
          <CardDescription>Your yearly progress summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tasks completed</p>
              <p className="text-3xl font-bold">{data.completedTasks}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Completion rate</p>
              <p className="text-3xl font-bold">{completionRate.toFixed(0)}%</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Average impact</p>
              <p className="text-3xl font-bold">{data.averageImpact.toFixed(1)}/10</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Goals completed</p>
              <p className="text-3xl font-bold">{data.goalsCompleted}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Focus distribution</CardTitle>
          <CardDescription>Tasks completed by life area this year</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks completed this year yet</p>
          ) : (
            <ChartContainer
              config={{
                count: {
                  label: "Tasks",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="area" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top focus areas</CardTitle>
          <CardDescription>Where you invested the most effort</CardDescription>
        </CardHeader>
        <CardContent>
          {data.topLifeAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data available yet</p>
          ) : (
            <div className="space-y-4">
              {data.topLifeAreas.map((area, index) => (
                <div key={area.area} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <Badge variant="outline" className="flex-1">
                    {area.area}
                  </Badge>
                  <div className="font-semibold">{area.count} tasks</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
