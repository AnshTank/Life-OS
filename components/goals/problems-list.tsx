"use client"

import type { Problem } from "@/lib/db-types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ProblemsListProps {
  problems: Problem[]
  loading: boolean
  onUpdate: () => void
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

const priorityColors = {
  critical: "bg-red-500/10 text-red-700 dark:text-red-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  low: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
}

export function ProblemsList({ problems, loading, onUpdate }: ProblemsListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-3">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (problems.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No current work</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Track problems and challenges you're currently working on solving.
          </p>
        </CardContent>
      </Card>
    )
  }

  const openProblems = problems.filter((p) => p.status === "open")
  const inProgressProblems = problems.filter((p) => p.status === "in-progress")
  const resolvedProblems = problems.filter((p) => p.status === "resolved")

  return (
    <div className="space-y-6">
      {inProgressProblems.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">In Progress</h3>
          <div className="space-y-3">
            {inProgressProblems.map((problem) => (
              <ProblemCard key={problem._id} problem={problem} onUpdate={onUpdate} />
            ))}
          </div>
        </div>
      )}

      {openProblems.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Open</h3>
          <div className="space-y-3">
            {openProblems.map((problem) => (
              <ProblemCard key={problem._id} problem={problem} onUpdate={onUpdate} />
            ))}
          </div>
        </div>
      )}

      {resolvedProblems.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Resolved</h3>
          <div className="space-y-3">
            {resolvedProblems.map((problem) => (
              <ProblemCard key={problem._id} problem={problem} onUpdate={onUpdate} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProblemCard({ problem, onUpdate }: { problem: Problem; onUpdate: () => void }) {
  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base text-balance leading-relaxed">{problem.title}</CardTitle>
              {problem.hasSolution && (
                <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs">
                  ✓ Solution
                </Badge>
              )}
            </div>
            <CardDescription className="text-pretty">{problem.description}</CardDescription>
            {problem.hasSolution && problem.solution && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Solution:</p>
                <p className="text-sm text-green-700 dark:text-green-300">{problem.solution}</p>
              </div>
            )}
          </div>
          <Button size="sm" variant="outline">
            Update
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {lifeAreaLabels[problem.lifeArea]}
          </Badge>
          <Badge className={`text-xs ${priorityColors[problem.priority]}`}>{problem.priority}</Badge>
          <Badge variant="secondary" className="text-xs">
            {problem.status}
          </Badge>
          {!problem.hasSolution && (
            <Badge variant="destructive" className="text-xs">
              No solution
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
