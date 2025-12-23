"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import type { User } from "@/lib/auth"
import { TodayFocus } from "./today-focus"
import { UnifiedInsights } from "./unified-insights"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  Zap, 
  Brain, 
  Heart,
  DollarSign,
  BookOpen,
  Users,
  Briefcase,
  Plus
} from "lucide-react"

interface DashboardViewProps {
  user: User
}

export function DashboardView({ user }: DashboardViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const [lifeStats, setLifeStats] = useState({
    totalTasks: 0,
    completedToday: 0,
    weeklyProgress: 0,
    currentStreak: 0,
    lifeAreas: [
      { name: 'Health', progress: 75, color: 'from-emerald-500 to-teal-500', icon: Heart },
      { name: 'Career', progress: 85, color: 'from-blue-500 to-indigo-500', icon: Briefcase },
      { name: 'Learning', progress: 60, color: 'from-purple-500 to-violet-500', icon: BookOpen },
      { name: 'Finance', progress: 90, color: 'from-yellow-500 to-orange-500', icon: DollarSign },
      { name: 'Relationships', progress: 70, color: 'from-pink-500 to-rose-500', icon: Users },
      { name: 'Personal', progress: 80, color: 'from-cyan-500 to-blue-500', icon: Brain },
    ]
  })
  const [dailyQuote, setDailyQuote] = useState({ quote: "Loading inspiration...", author: "Life OS" })
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrentDate(new Date()), 60000)
    
    // Fetch daily quote (only once per day)
    async function fetchDailyQuote() {
      try {
        const today = new Date().toDateString()
        const cachedQuote = localStorage.getItem('dailyQuote')
        const cacheDate = localStorage.getItem('quoteDate')
        
        // Check if we have today's quote cached
        if (cachedQuote && cacheDate === today) {
          setDailyQuote(JSON.parse(cachedQuote))
          return
        }
        
        // Fetch new quote for today
        const response = await fetch('/api/quotes')
        if (response.ok) {
          const quoteData = await response.json()
          setDailyQuote(quoteData)
          
          // Cache the quote for today
          localStorage.setItem('dailyQuote', JSON.stringify(quoteData))
          localStorage.setItem('quoteDate', today)
        }
      } catch (error) {
        console.error('Failed to fetch quote:', error)
        // Use fallback if no cached quote
        if (!localStorage.getItem('dailyQuote')) {
          setDailyQuote({ quote: "Your only limit is your mind.", author: "Life OS" })
        }
      }
    }
    
    fetchDailyQuote()
    return () => clearInterval(timer)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-float" />
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }} />
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '6s' }} />
        </div>
        <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl relative z-10">
          <div className="mb-6 md:mb-8 text-center">
            <div className="h-12 w-96 mx-auto animate-shimmer rounded-lg mb-4" />
            <div className="h-6 w-64 mx-auto animate-shimmer rounded-lg mb-2" />
            <div className="h-5 w-48 mx-auto animate-shimmer rounded-lg" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border bg-card/50 backdrop-blur-sm">
                <div className="h-12 w-12 mx-auto animate-shimmer rounded-xl mb-3" />
                <div className="h-6 w-16 mx-auto animate-shimmer rounded mb-2" />
                <div className="h-4 w-20 mx-auto animate-shimmer rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="h-48 animate-shimmer rounded-xl" />
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="h-64 animate-shimmer rounded-xl" />
              <div className="h-64 animate-shimmer rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  const getGreeting = () => {
    const hour = currentDate.getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  const getMotivationalMessage = () => {
    const messages = [
      "Ready to conquer today?",
      "Your future self will thank you!",
      "Every small step counts!",
      "Progress, not perfection!",
      "You're building something amazing!"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-float" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '6s' }} />
      </div>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl relative z-10">
        {/* Hero Section */}
        <motion.div 
          className="mb-6 md:mb-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 bg-clip-text text-transparent">
              {getGreeting()}, {user.name || 'Champion'}!
            </span>
            <span className="ml-2">🚀</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-1 md:mb-2">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-base md:text-lg font-medium bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            {getMotivationalMessage()}
          </p>
        </motion.div>

        {/* Quick Stats Row */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg backdrop-blur-sm bg-card/80 hover:bg-card/90 transition-all duration-300">
            <CardContent className="p-3 md:p-4 text-center">
              <motion.div 
                className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 w-fit mx-auto mb-2 md:mb-3"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <Target className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </motion.div>
              <motion.div 
                className="text-xl md:text-2xl font-bold text-foreground"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                {lifeStats.totalTasks}
              </motion.div>
              <div className="text-xs md:text-sm text-muted-foreground">Total Tasks</div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up border-0 shadow-lg" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-3 md:p-4 text-center">
              <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 w-fit mx-auto mb-2 md:mb-3">
                <Zap className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-foreground">{lifeStats.completedToday}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Completed Today</div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up border-0 shadow-lg" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-3 md:p-4 text-center">
              <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 w-fit mx-auto mb-2 md:mb-3">
                <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-foreground">{lifeStats.weeklyProgress}%</div>
              <div className="text-xs md:text-sm text-muted-foreground">Weekly Progress</div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up border-0 shadow-lg" style={{ animationDelay: '400ms' }}>
            <CardContent className="p-3 md:p-4 text-center">
              <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 w-fit mx-auto mb-2 md:mb-3">
                <Calendar className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-foreground">{lifeStats.currentStreak}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <motion.div 
          className="space-y-4 md:space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Today's Planned Tasks - Full Width */}
          <div className="animate-slide-up" style={{ animationDelay: '700ms' }}>
            <TodayFocus />
          </div>
          
          {/* Bottom Row - Two Cards Aligned */}
          <div className="grid gap-4 md:gap-6 xl:grid-cols-2 xl:grid-rows-1">
            {/* Life Areas Progress */}
            <Card className="animate-slide-up border-0 shadow-xl" style={{ animationDelay: '750ms' }}>
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg font-bold">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Life Areas Progress
                    </span>
                  </CardTitle>
                  <Button variant="outline" size="sm" className="animate-magnetic-hover hidden md:flex">
                    <Plus className="h-4 w-4 mr-2" />
                    Customize
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {lifeStats.lifeAreas.map((area, index) => {
                    const Icon = area.icon
                    return (
                      <motion.div 
                        key={area.name} 
                        className="p-4 md:p-6 rounded-xl glass cursor-pointer group text-center"
                        whileHover={{ 
                          scale: 1.02,
                          y: -4,
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                        }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <motion.div 
                          className={`p-3 rounded-xl bg-gradient-to-r ${area.color} w-fit mx-auto mb-3 shadow-lg`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </motion.div>
                        <h3 className="font-semibold text-sm mb-2 text-foreground">{area.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3 font-medium">{area.progress}%</p>
                        <Progress value={area.progress} variant="gradient" className="h-2" />
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Unified Insights */}
            <div className="animate-slide-up" style={{ animationDelay: '800ms' }}>
              <UnifiedInsights />
            </div>
          </div>
        </motion.div>

        {/* Floating Quick Actions */}
        <motion.div 
          className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-50 flex flex-col gap-3"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 20 }}
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Button className="fab w-12 h-12 md:w-14 md:h-14 rounded-full shadow-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" size="icon">
              <Plus className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Motivational Footer */}
        <motion.div 
          className="mt-8 md:mt-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <motion.div 
            className="p-4 md:p-6 glass-strong rounded-xl md:rounded-2xl max-w-2xl mx-auto"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg md:text-xl font-bold mb-2">
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                "{dailyQuote.quote}"
              </span>
              <span className="ml-2">💪</span>
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              — {dailyQuote.author}
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
