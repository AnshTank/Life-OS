"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PartnerProgressProps {
  partnerId: string
}

export function PartnerProgress({ partnerId }: PartnerProgressProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (partnerId) {
      loadProgressData()
    }
  }, [partnerId])

  async function loadProgressData() {
    try {
      const response = await fetch(`/api/partner/progress?partnerId=${partnerId}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data || [])
      }
    } catch (error) {
      console.error("[v0] Failed to load partner progress:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress comparison</CardTitle>
        <CardDescription>Your task completion rates over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">Not enough data yet</div>
        ) : (
          <ChartContainer
            config={{
              you: {
                label: "You",
                color: "hsl(var(--primary))",
              },
              partner: {
                label: "Partner",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="you"
                  stroke="var(--color-you)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="You"
                />
                <Line
                  type="monotone"
                  dataKey="partner"
                  stroke="var(--color-partner)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Partner"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
