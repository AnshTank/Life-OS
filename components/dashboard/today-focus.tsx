"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useConfetti } from "@/components/ui/confetti"
import { Sparkles, Plus, Zap, Target, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface FocusTask {
  _id: string
  title: string
  lifeArea: string
  priorityScore: number
  impact: number
  urgency: number
  completed?: boolean
}

export function TodayFocus() {
  const [focusTasks, setFocusTasks] = useState<FocusTask[]>([])
  const [loading, setLoading] = useState(true)
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  const { trigger: triggerConfetti, Confetti } = useConfetti()

  useEffect(() => {
    async function loadFocus() {
      try {
        const response = await fetch("/api/tasks/today-focus")
        if (response.ok) {
          const data = await response.json()
          setFocusTasks(data.tasks || [])
        }
      } catch (error) {
        console.error("[v0] Failed to load today's focus:", error)
      } finally {
        setLoading(false)
      }
    }
    loadFocus()
  }, [])

  const handleTaskComplete = (taskId: string) => {
    setCompletedTasks(prev => new Set([...prev, taskId]))
    triggerConfetti()
    
    // Add completion animation
    const button = document.querySelector(`[data-task-id="${taskId}"]`)
    if (button) {
      button.classList.add('animate-task-complete')
      setTimeout(() => {
        button.classList.remove('animate-task-complete')
      }, 600)
    }
  }

  const getLifeAreaColor = (area: string) => {
    const colors = {
      'Health': 'bg-gradient-to-r from-emerald-500 to-teal-500',
      'Career': 'bg-gradient-to-r from-blue-500 to-indigo-500',
      'Relationships': 'bg-gradient-to-r from-pink-500 to-rose-500',
      'Personal': 'bg-gradient-to-r from-purple-500 to-violet-500',
      'Finance': 'bg-gradient-to-r from-yellow-500 to-orange-500',
      'Learning': 'bg-gradient-to-r from-cyan-500 to-blue-500',
    }
    return colors[area as keyof typeof colors] || 'bg-gradient-to-r from-gray-500 to-slate-500'
  }

  return (
    <>
      <Confetti />
      <Card className="relative overflow-hidden border-0 shadow-2xl">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-cyan-500/10 animate-pulse-glow" />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 animate-float">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Today's Planned Tasks
                  </span>
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Tasks you planned yesterday for today's focus <span>🎯</span>
                </CardDescription>
              </div>
            </div>
            <Button variant="accent" size="sm" asChild className="animate-magnetic-hover">
              <Link href="/tasks">
                <Plus className="h-4 w-4 mr-2" />
                Quick Add
              </Link>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 relative">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 glass rounded-2xl animate-shimmer" />
              ))}
            </div>
          ) : focusTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Target className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-lg font-medium text-muted-foreground mb-2">No tasks planned for today</p>
              <p className="text-sm text-muted-foreground">Plan your tomorrow's tasks tonight for better focus!</p>
            </div>
          ) : (
            focusTasks.map((task, index) => {
              const isCompleted = completedTasks.has(task._id)
              return (
                <div 
                  key={task._id} 
                  className={`group p-5 rounded-2xl glass hover:shadow-xl transition-all duration-300 animate-slide-up border-l-4 ${getLifeAreaColor(task.lifeArea)} ${isCompleted ? 'opacity-75 scale-95' : ''}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
                        <h4 className={`font-semibold text-lg leading-relaxed ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs font-medium px-3 py-1 ${getLifeAreaColor(task.lifeArea)} text-white border-0`}
                        >
                          {task.lifeArea}
                        </Badge>
                        
                        {task.impact >= 8 && (
                          <Badge variant="accent" className="text-xs font-medium px-3 py-1 animate-pulse">
                            <span>🔥</span> High Impact
                          </Badge>
                        )}
                        
                        {task.urgency >= 8 && (
                          <Badge className="text-xs font-medium px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
                            <span>⚡</span> Urgent
                          </Badge>
                        )}
                        
                        <div className="text-xs text-muted-foreground font-medium">
                          Priority: {Math.round(task.priorityScore)}/10
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant={isCompleted ? "success" : "default"}
                      onClick={() => handleTaskComplete(task._id)}
                      disabled={isCompleted}
                      data-task-id={task._id}
                      className="min-w-[80px] animate-magnetic-hover"
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Done
                        </>
                      ) : (
                        'Start'
                      )}
                    </Button>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full progress-bar transition-all duration-1000 ${getLifeAreaColor(task.lifeArea)}`}
                      style={{ width: `${isCompleted ? 100 : (task.priorityScore * 10)}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
          
          {/* Floating completion counter */}
          {completedTasks.size > 0 && (
            <div className="fixed bottom-6 left-6 z-50 p-4 glass-strong rounded-2xl shadow-2xl animate-float">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm">
                  {completedTasks.size} completed today! <span>🎉</span>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
