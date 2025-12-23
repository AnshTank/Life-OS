"use client"

import type { Goal, GoalCategory } from "@/lib/db-types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Target, Calendar, Share2, Zap, Trophy, Clock, Star, Heart, Home, Users, Car, Laptop, Plane, Briefcase, DollarSign, BookOpen, UserCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface GoalsListProps {
  goals: Goal[]
  loading: boolean
  onUpdate: () => void
}

const categoryIcons = {
  home: Home,
  family: Users,
  house: Home,
  travel: Plane,
  personal: Heart,
  cars: Car,
  technology: Laptop,
  career: Briefcase,
  health: Heart,
  finance: DollarSign,
  learning: BookOpen,
  relationships: UserCheck,
}

const categoryColors = {
  home: "from-blue-500 to-cyan-500",
  family: "from-pink-500 to-rose-500",
  house: "from-green-500 to-emerald-500",
  travel: "from-purple-500 to-violet-500",
  personal: "from-red-500 to-pink-500",
  cars: "from-orange-500 to-yellow-500",
  technology: "from-indigo-500 to-blue-500",
  career: "from-gray-600 to-gray-800",
  health: "from-green-400 to-emerald-600",
  finance: "from-yellow-500 to-orange-500",
  learning: "from-purple-600 to-indigo-600",
  relationships: "from-pink-400 to-rose-600",
}

export function GoalsList({ goals, loading, onUpdate }: GoalsListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-64 md:h-80 border-0 shadow-lg animate-shimmer">
            <CardHeader className="space-y-3">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <Card className="border-0 shadow-xl glass">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 mb-6">
            <Target className="h-12 w-12 text-purple-500" />
          </div>
          <h3 className="font-bold text-2xl mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            No goals yet! 🎯
          </h3>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            Start your journey by creating your first goal. Dream big and break it down into achievable milestones!
          </p>
        </CardContent>
      </Card>
    )
  }

  const activeGoals = goals.filter((g) => g.status === "active")
  const completedGoals = goals.filter((g) => g.status === "completed")
  const pausedGoals = goals.filter((g) => g.status === "paused")

  return (
    <div className="space-y-8">
      {activeGoals.length > 0 && (
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
              <Zap className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Active Goals ({activeGoals.length})
            </h3>
          </div>
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal, index) => (
              <div key={goal._id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <GoalCard goal={goal} onUpdate={onUpdate} />
              </div>
            ))}
          </div>
        </div>
      )}

      {completedGoals.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500">
              <Trophy className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Completed Goals ({completedGoals.length}) 🏆
            </h3>
          </div>
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal, index) => (
              <div key={goal._id} className="animate-slide-up" style={{ animationDelay: `${300 + index * 100}ms` }}>
                <GoalCard goal={goal} onUpdate={onUpdate} />
              </div>
            ))}
          </div>
        </div>
      )}

      {pausedGoals.length > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Paused Goals ({pausedGoals.length})
            </h3>
          </div>
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pausedGoals.map((goal, index) => (
              <div key={goal._id} className="animate-slide-up" style={{ animationDelay: `${500 + index * 100}ms` }}>
                <GoalCard goal={goal} onUpdate={onUpdate} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function GoalCard({ goal, onUpdate }: { goal: Goal; onUpdate: () => void }) {
  const CategoryIcon = categoryIcons[goal.category] || Target
  const categoryColor = categoryColors[goal.category] || "from-gray-500 to-slate-500"
  
  const statusConfig = {
    active: { 
      color: "from-green-500 to-emerald-500", 
      text: "Active", 
      icon: Zap,
      bgColor: "bg-green-500/10",
      textColor: "text-green-700 dark:text-green-400"
    },
    completed: { 
      color: "from-blue-500 to-cyan-500", 
      text: "Completed", 
      icon: Trophy,
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-700 dark:text-blue-400"
    },
    paused: { 
      color: "from-yellow-500 to-orange-500", 
      text: "Paused", 
      icon: Clock,
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-700 dark:text-yellow-400"
    },
  }
  
  const status = statusConfig[goal.status]
  const StatusIcon = status.icon
  
  // Calculate progress based on time elapsed (dummy calculation)
  const now = new Date()
  const created = new Date(goal.createdAt)
  const target = goal.targetDate ? new Date(goal.targetDate) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
  const totalTime = target.getTime() - created.getTime()
  const elapsedTime = now.getTime() - created.getTime()
  const timeProgress = Math.min(Math.max((elapsedTime / totalTime) * 100, 0), 100)
  const progress = goal.status === "completed" ? 100 : Math.min(timeProgress + (goal.impact * 5), 95)

  return (
    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 interactive-card group overflow-hidden relative">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${categoryColor} opacity-5 group-hover:opacity-10 transition-opacity`} />
      
      {/* Status indicator */}
      <div className={`absolute top-4 right-4 p-2 rounded-full bg-gradient-to-r ${status.color} shadow-lg`}>
        <StatusIcon className="h-4 w-4 text-white" />
      </div>
      
      <CardHeader className="relative pb-3 md:pb-4">
        <div className="flex items-start gap-3 md:gap-4">
          <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-r ${categoryColor} shadow-lg group-hover:scale-110 transition-transform`}>
            <CategoryIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg font-bold leading-tight mb-1 md:mb-2 group-hover:text-primary transition-colors">
              {goal.title}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm leading-relaxed line-clamp-2">
              {goal.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 md:space-y-4 relative">
        {/* Progress bar */}
        <div className="space-y-1 md:space-y-2">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="font-medium">Progress</span>
            <span className="font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} variant="gradient" className="h-1.5 md:h-2" />
        </div>
        
        {/* Badges */}
        <div className="flex items-center gap-1 md:gap-2 flex-wrap">
          <Badge className={`text-xs font-semibold ${status.bgColor} ${status.textColor} border-0`}>
            {status.text}
          </Badge>
          
          <Badge variant="outline" className="text-xs font-medium">
            {goal.category}
          </Badge>
          
          <div className="flex items-center gap-1 text-xs font-medium">
            <Star className="h-3 w-3 text-yellow-500" />
            <span className="hidden sm:inline">Impact: </span>
            <span>{goal.impact}/10</span>
          </div>
          
          {goal.sharedWithPartner && (
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              <Share2 className="h-3 w-3 mr-1" />
              Shared
            </Badge>
          )}
        </div>

        {/* Target date */}
        {goal.targetDate && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 md:h-4 md:w-4" />
            <span className="truncate">{formatDistanceToNow(new Date(goal.targetDate), { addSuffix: true })}</span>
          </div>
        )}

        {/* Action button */}
        <Button 
          size="sm" 
          variant={goal.status === "completed" ? "success" : "default"} 
          className="w-full animate-magnetic-hover font-semibold text-xs md:text-sm"
        >
          {goal.status === "completed" ? "View Achievement" : "View Details"}
        </Button>
      </CardContent>
    </Card>
  )
}
