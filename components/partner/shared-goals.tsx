"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target } from "lucide-react"

interface Goal {
  _id: string
  title: string
  description: string
  lifeArea: string
  impact: number
  progress: number
  isOwn: boolean
}

interface SharedGoalsProps {
  title: string
  goals: Goal[]
}

const lifeAreaLabels: Record<string, string> = {
  "placement-prep": "Placement Prep",
  learning: "Learning",
  health: "Health",
  finance: "Finance",
  "buy-list": "Buy List",
  travel: "Travel",
  personal: "Personal",
}

export function SharedGoals({ title, goals }: SharedGoalsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No shared goals yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal._id} className="space-y-2 p-3 rounded-lg border">
                <div>
                  <h4 className="font-medium text-sm text-balance leading-relaxed">{goal.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 text-pretty line-clamp-2">{goal.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {lifeAreaLabels[goal.lifeArea]}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Target className="h-3 w-3" />
                    Impact: {goal.impact}/10
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
