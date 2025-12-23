"use client"

import { useState, useEffect } from "react"
import type { User } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  TrendingUp, 
  Target, 
  MessageCircle, 
  Trophy, 
  Flame, 
  Heart, 
  Zap, 
  Star,
  Send,
  Award,
  Calendar,
  Activity,
  BarChart3
} from "lucide-react"

interface PartnerViewProps {
  user: User
}

interface PartnerData {
  connected: boolean
  partner?: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  sharedGoals: any[]
  partnerStats?: {
    weeklyTasks: number
    weeklyCompletion: number
    streak: number
    totalPoints: number
    level: number
  }
  messages: any[]
  challenges: any[]
}

export function PartnerView({ user }: PartnerViewProps) {
  const [data, setData] = useState<PartnerData>({
    connected: true, // Demo mode
    partner: {
      _id: "partner1",
      name: "Alex Johnson",
      email: "alex@example.com",
      avatar: "AJ"
    },
    sharedGoals: [
      {
        _id: "g1",
        title: "Complete React Advanced Course",
        description: "Master advanced React patterns and hooks",
        lifeArea: "learning",
        impact: 9,
        progress: 75,
        isOwn: true,
        dueDate: new Date("2024-02-15")
      },
      {
        _id: "g2",
        title: "Run 5K Marathon",
        description: "Train for and complete a 5K marathon",
        lifeArea: "health",
        impact: 8,
        progress: 60,
        isOwn: false,
        dueDate: new Date("2024-03-01")
      }
    ],
    partnerStats: {
      weeklyTasks: 23,
      weeklyCompletion: 87,
      streak: 15,
      totalPoints: 2450,
      level: 7
    },
    messages: [
      {
        _id: "m1",
        from: "partner",
        message: "Great job on completing your React tasks! 🚀",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: "encouragement"
      },
      {
        _id: "m2",
        from: "user",
        message: "Thanks! Your running progress is inspiring me to start exercising too 💪",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        type: "encouragement"
      }
    ],
    challenges: [
      {
        _id: "c1",
        title: "7-Day Productivity Sprint",
        description: "Complete at least 5 tasks daily for 7 consecutive days",
        type: "streak",
        duration: 7,
        progress: { user: 5, partner: 6 },
        status: "active",
        reward: "100 points",
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        _id: "c2",
        title: "Goal Completion Race",
        description: "First to complete 3 goals wins",
        type: "race",
        progress: { user: 2, partner: 1 },
        status: "active",
        reward: "Achievement Badge",
        target: 3
      }
    ]
  })
  const [loading, setLoading] = useState(false)
  const [connectEmail, setConnectEmail] = useState("")
  const [connecting, setConnecting] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    setSendingMessage(true)
    
    // Simulate sending message
    setTimeout(() => {
      setData(prev => ({
        ...prev,
        messages: [...prev.messages, {
          _id: `m${Date.now()}`,
          from: "user",
          message: newMessage,
          timestamp: new Date(),
          type: "encouragement"
        }]
      }))
      setNewMessage("")
      setSendingMessage(false)
    }, 500)
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <div className="glass-strong border-b relative z-10">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
          <div className="animate-slide-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Accountability Partner
                </h1>
                <p className="text-muted-foreground text-base md:text-lg mt-1">
                  Share your journey, stay motivated, and achieve more together
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="flex items-center gap-2 p-2 md:p-3 glass rounded-lg md:rounded-xl">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Your Level</p>
                  <p className="font-bold text-base md:text-lg">Level 8</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 md:p-3 glass rounded-lg md:rounded-xl">
                <Flame className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Joint Streak</p>
                  <p className="font-bold text-base md:text-lg">12 days</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 md:p-3 glass rounded-lg md:rounded-xl">
                <Star className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Points</p>
                  <p className="font-bold text-base md:text-lg">3,240</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 md:p-3 glass rounded-lg md:rounded-xl">
                <Award className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Challenges Won</p>
                  <p className="font-bold text-base md:text-lg">7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl relative z-10">
        <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
          <div className="flex justify-center animate-slide-up">
            <div className="w-full max-w-4xl overflow-x-auto">
              <TabsList className="inline-flex h-12 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground min-w-max">
                <TabsTrigger value="overview" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="goals" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Goals</span>
                </TabsTrigger>
                <TabsTrigger value="challenges" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm">Challenges</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">Messages</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm">Analytics</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="overview" className="animate-slide-up">
            {/* Partner Connection Card */}
            <Card className="mb-6 relative overflow-hidden border-0 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                      {data.partner?.avatar}
                    </div>
                    <div>
                      <CardTitle className="text-xl">Connected with {data.partner?.name}</CardTitle>
                      <CardDescription className="text-base">{data.partner?.email}</CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm text-green-600">Online now</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Settings
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Performance Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Your Stats */}
              <Card className="relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      You
                    </div>
                    Your Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 glass rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">28</div>
                      <div className="text-xs text-muted-foreground">Tasks This Week</div>
                    </div>
                    <div className="text-center p-3 glass rounded-lg">
                      <div className="text-2xl font-bold text-green-600">89%</div>
                      <div className="text-xs text-muted-foreground">Completion Rate</div>
                    </div>
                    <div className="text-center p-3 glass rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">18</div>
                      <div className="text-xs text-muted-foreground">Day Streak</div>
                    </div>
                    <div className="text-center p-3 glass rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">8</div>
                      <div className="text-xs text-muted-foreground">Level</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Partner Stats */}
              <Card className="relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {data.partner?.avatar}
                    </div>
                    {data.partner?.name}'s Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 glass rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{data.partnerStats?.weeklyTasks}</div>
                      <div className="text-xs text-muted-foreground">Tasks This Week</div>
                    </div>
                    <div className="text-center p-3 glass rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{data.partnerStats?.weeklyCompletion}%</div>
                      <div className="text-xs text-muted-foreground">Completion Rate</div>
                    </div>
                    <div className="text-center p-3 glass rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{data.partnerStats?.streak}</div>
                      <div className="text-xs text-muted-foreground">Day Streak</div>
                    </div>
                    <div className="text-center p-3 glass rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{data.partnerStats?.level}</div>
                      <div className="text-xs text-muted-foreground">Level</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { user: "You", action: "completed 5 tasks", time: "2 hours ago", type: "success" },
                    { user: data.partner?.name, action: "achieved a goal", time: "4 hours ago", type: "achievement" },
                    { user: "You", action: "started a new challenge", time: "6 hours ago", type: "challenge" },
                    { user: data.partner?.name, action: "sent encouragement", time: "8 hours ago", type: "message" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 glass rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'achievement' ? 'bg-yellow-500' :
                        activity.type === 'challenge' ? 'bg-purple-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <span className="font-medium">{activity.user}</span>
                        <span className="text-muted-foreground"> {activity.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="goals" className="animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Shared Goals */}
              <Card className="relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Your Shared Goals
                  </CardTitle>
                  <CardDescription>Goals you're sharing with your partner</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    {data.sharedGoals.filter(g => g.isOwn).map((goal) => (
                      <div key={goal._id} className="p-4 glass rounded-xl">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{goal.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          </div>
                          <Badge className="bg-blue-500/10 text-blue-700">
                            Impact: {goal.impact}/10
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Due: {goal.dueDate?.toLocaleDateString()}</span>
                            <span className="text-green-600">On track</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Partner's Goals */}
              <Card className="relative overflow-hidden border-0 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {data.partner?.name}'s Goals
                  </CardTitle>
                  <CardDescription>Goals your partner is sharing with you</CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    {data.sharedGoals.filter(g => !g.isOwn).map((goal) => (
                      <div key={goal._id} className="p-4 glass rounded-xl">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{goal.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          </div>
                          <Badge className="bg-purple-500/10 text-purple-700">
                            Impact: {goal.impact}/10
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Due: {goal.dueDate?.toLocaleDateString()}</span>
                            <Button size="sm" variant="outline" className="h-6 text-xs">
                              <Heart className="h-3 w-3 mr-1" />
                              Encourage
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="animate-slide-up">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Active Challenges
                    </CardTitle>
                    <CardDescription>Compete and motivate each other</CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                    <Trophy className="h-4 w-4 mr-2" />
                    New Challenge
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {data.challenges.map((challenge) => (
                    <div key={challenge._id} className="p-6 glass rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full -mr-10 -mt-10" />
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{challenge.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{challenge.description}</p>
                          </div>
                          <Badge className="bg-yellow-500/10 text-yellow-700">
                            {challenge.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">You</span>
                              <span className="text-sm font-bold">{challenge.progress.user}/{challenge.target || challenge.duration}</span>
                            </div>
                            <Progress value={(challenge.progress.user / (challenge.target || challenge.duration)) * 100} className="h-2" />
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{data.partner?.name}</span>
                              <span className="text-sm font-bold">{challenge.progress.partner}/{challenge.target || challenge.duration}</span>
                            </div>
                            <Progress value={(challenge.progress.partner / (challenge.target || challenge.duration)) * 100} className="h-2" />
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="text-xs text-muted-foreground">
                              Reward: {challenge.reward}
                            </div>
                            {challenge.endDate && (
                              <div className="text-xs text-muted-foreground">
                                Ends: {challenge.endDate.toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="animate-slide-up">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Encouragement Messages
                </CardTitle>
                <CardDescription>Send motivation and support to each other</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto mb-4">
                  {data.messages.map((message) => (
                    <div key={message._id} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.from === 'user' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' 
                          : 'glass'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.from === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                        }`}>
                          {formatTimeAgo(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Send encouragement..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={sendingMessage}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={sendingMessage || !newMessage.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="animate-slide-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Comparison
                  </CardTitle>
                  <CardDescription>Weekly task completion comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 relative">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      <defs>
                        <pattern id="comparisonGrid" width="40" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#comparisonGrid)" />
                      
                      {[
                        { week: 'W1', you: 85, partner: 78 },
                        { week: 'W2', you: 92, partner: 88 },
                        { week: 'W3', you: 78, partner: 95 },
                        { week: 'W4', you: 89, partner: 87 }
                      ].map((data, index) => {
                        const x = 50 + index * 80
                        const youHeight = (data.you / 100) * 150
                        const partnerHeight = (data.partner / 100) * 150
                        
                        return (
                          <g key={index}>
                            <rect
                              x={x - 15}
                              y={180 - youHeight}
                              width="12"
                              height={youHeight}
                              fill="#3b82f6"
                              rx="2"
                            />
                            <rect
                              x={x + 3}
                              y={180 - partnerHeight}
                              width="12"
                              height={partnerHeight}
                              fill="#8b5cf6"
                              rx="2"
                            />
                            <text
                              x={x}
                              y="195"
                              textAnchor="middle"
                              className="text-xs fill-current text-muted-foreground"
                            >
                              {data.week}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      <span className="text-sm">You</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded" />
                      <span className="text-sm">{data.partner?.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Joint Achievements
                  </CardTitle>
                  <CardDescription>Milestones you've reached together</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: "First Week Together", description: "Completed your first week as partners", date: "2 weeks ago", icon: Users, color: "bg-blue-500" },
                      { title: "Goal Achievers", description: "Both completed a major goal", date: "1 week ago", icon: Target, color: "bg-green-500" },
                      { title: "Streak Masters", description: "Maintained 10+ day streaks together", date: "3 days ago", icon: Flame, color: "bg-orange-500" },
                      { title: "Challenge Champions", description: "Won your first challenge together", date: "1 day ago", icon: Trophy, color: "bg-yellow-500" }
                    ].map((achievement, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 glass rounded-lg">
                        <div className={`p-2 rounded-lg ${achievement.color}`}>
                          <achievement.icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{achievement.title}</h4>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{achievement.date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}