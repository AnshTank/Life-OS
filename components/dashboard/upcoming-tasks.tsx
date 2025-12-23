"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Task {
  _id: string
  title: string
  lifeArea: string
  status: string
  dueDate?: string
  impact: number
  urgency: number
  effort: number
}

export function UpcomingTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTasks() {
      try {
        const response = await fetch("/api/tasks/upcoming")
        if (response.ok) {
          const data = await response.json()
          setTasks(data.tasks || [])
        }
      } catch (error) {
        console.error("[v0] Failed to load upcoming tasks:", error)
      } finally {
        setLoading(false)
      }
    }
    loadTasks()
  }, [])

  async function toggleTask(taskId: string, completed: boolean) {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: completed ? "completed" : "todo" }),
      })
      setTasks(tasks.filter((t) => t._id !== taskId))
    } catch (error) {
      console.error("[v0] Failed to update task:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming tasks</CardTitle>
            <CardDescription>Prioritized by impact, urgency, and effort</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/tasks">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No upcoming tasks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <Checkbox
                  checked={false}
                  onCheckedChange={(checked) => toggleTask(task._id, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-balance leading-relaxed">{task.title}</p>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-xs">
                      {task.lifeArea}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Impact: {task.impact} · Urgency: {task.urgency}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
