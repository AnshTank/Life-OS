"use client"

import type { Task } from "@/lib/db-types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { CheckSquare, Calendar, Target, Zap, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface TasksListProps {
  tasks: Task[]
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

export function TasksList({ tasks, loading, onUpdate }: TasksListProps) {
  async function toggleTask(taskId: string, completed: boolean) {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: completed ? "completed" : "todo",
          completedAt: completed ? new Date() : undefined,
        }),
      })
      onUpdate()
    } catch (error) {
      console.error("[v0] Failed to update task:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-muted/50 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No tasks yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Create your first task and let the system help you prioritize based on impact, urgency, and effort.
          </p>
        </CardContent>
      </Card>
    )
  }

  const activeTasks = tasks.filter((t) => t.status !== "completed")
  const completedTasks = tasks.filter((t) => t.status === "completed")

  return (
    <div className="space-y-6">
      {activeTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Active tasks ({activeTasks.length})</h3>
            <div className="text-xs text-muted-foreground">Sorted by priority score</div>
          </div>
          <div className="space-y-3">
            {activeTasks.map((task) => (
              <TaskCard key={task._id} task={task} onToggle={toggleTask} />
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Completed ({completedTasks.length})</h3>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <TaskCard key={task._id} task={task} onToggle={toggleTask} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, onToggle }: { task: Task; onToggle: (id: string, completed: boolean) => void }) {
  const isCompleted = task.status === "completed"
  const priorityPercent = (task.priorityScore / 30) * 100

  return (
    <Card className={`hover:border-primary/40 transition-colors ${isCompleted ? "opacity-60" : ""}`}>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => onToggle(task._id, checked as boolean)}
            className="mt-1"
          />

          <div className="flex-1 space-y-3">
            <div>
              <h3 className={`font-medium text-balance leading-relaxed ${isCompleted ? "line-through" : ""}`}>
                {task.title}
              </h3>
              {task.description && <p className="text-sm text-muted-foreground mt-1 text-pretty">{task.description}</p>}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {lifeAreaLabels[task.lifeArea]}
              </Badge>

              {task.goalId && (
                <Badge variant="secondary" className="text-xs">
                  Linked to goal
                </Badge>
              )}

              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Target className="h-3.5 w-3.5" />
                  <span>Impact</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={(task.impact / 10) * 100} className="h-1.5 flex-1" />
                  <span className="text-sm font-medium w-8">{task.impact}/10</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Urgency</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={(task.urgency / 10) * 100} className="h-1.5 flex-1" />
                  <span className="text-sm font-medium w-8">{task.urgency}/10</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Effort</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={(task.effort / 10) * 100} className="h-1.5 flex-1" />
                  <span className="text-sm font-medium w-8">{task.effort}/10</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Priority score</div>
                <div className="flex items-center gap-2">
                  <Progress value={priorityPercent} className="h-2 w-24" />
                  <span className="text-sm font-semibold">{task.priorityScore.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
