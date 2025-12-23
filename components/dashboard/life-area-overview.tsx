"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { LifeArea } from "@/lib/db-types"

interface AreaProgress {
  area: LifeArea
  activeTasks: number
  completionRate: number
}

const areaLabels: Record<LifeArea, string> = {
  "placement-prep": "Placement Prep",
  learning: "Learning",
  health: "Health",
  finance: "Finance",
  "buy-list": "Buy List",
  travel: "Travel",
  personal: "Personal",
}

const areaColors: Record<LifeArea, string> = {
  "placement-prep": "bg-blue-500",
  learning: "bg-purple-500",
  health: "bg-green-500",
  finance: "bg-yellow-500",
  "buy-list": "bg-pink-500",
  travel: "bg-cyan-500",
  personal: "bg-orange-500",
}

export function LifeAreaOverview() {
  const [areas, setAreas] = useState<AreaProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAreas() {
      try {
        const response = await fetch("/api/stats/life-areas")
        if (response.ok) {
          const data = await response.json()
          setAreas(data.areas || [])
        }
      } catch (error) {
        console.error("[v0] Failed to load life areas:", error)
      } finally {
        setLoading(false)
      }
    }
    loadAreas()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Life areas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        ) : areas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No active areas yet</p>
        ) : (
          areas.map((area) => (
            <div key={area.area} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${areaColors[area.area]}`} />
                  <span className="text-sm font-medium">{areaLabels[area.area]}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {area.activeTasks}
                </Badge>
              </div>
              <Progress value={area.completionRate} className="h-1.5" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
