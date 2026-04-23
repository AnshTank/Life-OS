"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Send, Target, CheckSquare, Link2, 
  Mail, CheckCircle2, Gift, Calendar, MessageCircle,
  Zap, Trophy, Bell, Star
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format, subMinutes, subHours } from 'date-fns';

const mockActivityFeed = [
  {
    id: 'act-1',
    user: 'Sarah',
    action: 'completed a task',
    target: 'Morning Yoga',
    time: subMinutes(new Date(), 15),
    icon: CheckCircle2,
    color: 'text-green-500'
  },
  {
    id: 'act-2',
    user: 'Sarah',
    action: 'achieved a milestone',
    target: 'Save $10k',
    time: subHours(new Date(), 2),
    icon: Trophy,
    color: 'text-yellow-500'
  },
  {
    id: 'act-3',
    user: 'Sarah',
    action: 'added a new goal',
    target: 'Learn Italian',
    time: subHours(new Date(), 5),
    icon: Target,
    color: 'text-purple-500'
  },
];

const mockChallenges = [
  {
    id: 'ch-1',
    title: 'Digital Detox',
    description: 'No screens after 9PM for a week',
    progress: 4,
    total: 7,
    status: 'active',
    participants: ['You', 'Sarah']
  },
  {
    id: 'ch-2',
    title: 'Weekend Hike',
    description: 'Hike 10km this weekend',
    progress: 0,
    total: 10,
    status: 'pending',
    participants: ['You', 'Sarah']
  }
];

export function PartnerPage() {
  const { partner, goals, tasks, invitePartner, user } = useApp();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const sharedGoals = goals.filter(g => g.sharedWithPartner);
  const sharedTasks = tasks.filter(t => t.sharedWithPartner);

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    setIsInviting(true);
    setTimeout(() => {
      invitePartner(inviteEmail);
      setIsInviting(false);
      setInviteEmail('');
      toast.success('Invitation sent! 💌');
    }, 1000);
  };

  const sendNudge = (type: 'love' | 'nudge' | 'cheer') => {
    const messages = {
      love: 'Sent some love! ❤️',
      nudge: 'Gentle nudge sent! 👉',
      cheer: 'Cheering them on! 🎉'
    };
    toast.success(messages[type]);
  };

  // No partner connected yet
  if (!partner || partner.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-caveat mb-2">Partner Sync</h1>
          <p className="text-slate-500 font-kalam text-lg">Share goals and tasks with your partner for mutual accountability</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="journal-card overflow-hidden">
            <div className="h-2 bg-[#d9a8c4]" />
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f5e8f0] border-2 border-[#d9a8c4] flex items-center justify-center">
                <Heart className="w-10 h-10 text-[#c97b7b]" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2 font-caveat">Connect with Your Partner</h2>
              <p className="text-slate-500 mb-8 font-kalam">
                Invite your partner to share goals, track habits together, and support each other's growth.
              </p>

              <div className="flex gap-3 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    placeholder="partner@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-10 h-12 journal-input"
                  />
                </div>
                <Button 
                  onClick={handleInvite}
                  disabled={isInviting}
                  className="h-12 journal-btn-primary"
                >
                  {isInviting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Invite
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-[#f5f0e6] rounded-xl border border-[#e0d4a0]">
                  <Target className="w-6 h-6 mx-auto mb-2 text-[#a99bc4]" />
                  <p className="text-sm font-medium font-kalam">Shared Goals</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckSquare className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm font-medium font-kalam">Shared Tasks</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <Link2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-sm font-medium font-kalam">Progress Sync</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: 'Shared Goals', desc: 'Work together on common objectives', icon: Target },
            { title: 'Task Collaboration', desc: 'Assign and track shared tasks', icon: CheckSquare },
            { title: 'Progress Updates', desc: 'See each other\'s achievements', icon: CheckCircle2 },
            { title: 'Mutual Support', desc: 'Celebrate wins together', icon: Heart },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-100"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium font-kalam">{feature.title}</p>
                <p className="text-sm text-slate-500 font-kalam">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Partner connected
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-[#a99bc4] text-white text-xl">
                {user?.name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-slate-300 rounded-full" />
            <Heart className="w-6 h-6 text-rose-400 fill-rose-400 animate-pulse" />
            <div className="h-1 w-8 bg-slate-300 rounded-full" />
          </div>
          <div className="relative">
            <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-[#d9a8c4] text-white text-xl">
                {partner.partnerName?.[0] || 'S'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold font-caveat">{partner.partnerName || 'Sarah'}</h1>
            <p className="text-slate-500 font-kalam text-sm">Connected since {format(new Date(partner.createdAt), 'MMM d, yyyy')}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="journal-btn gap-2" onClick={() => sendNudge('love')}>
            <Heart className="w-4 h-4 text-rose-500" />
            Send Love
          </Button>
          <Button variant="outline" className="journal-btn gap-2" onClick={() => sendNudge('nudge')}>
            <Zap className="w-4 h-4 text-yellow-500" />
            Nudge
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="journal-card bg-[#f5e8f0] border-[#d9a8c4]">
          <CardContent className="p-4">
            <Heart className="w-8 h-8 mb-2 text-[#c97b7b]" />
            <p className="text-3xl font-bold font-caveat text-[#2d2d2d]">{sharedGoals.length}</p>
            <p className="text-sm text-[#5a5a5a] font-kalam">Shared Goals</p>
          </CardContent>
        </Card>
        <Card className="journal-card">
          <CardContent className="p-4">
            <CheckSquare className="w-8 h-8 mb-2 text-[#7a9eb8]" />
            <p className="text-3xl font-bold font-caveat text-[#2d2d2d]">{sharedTasks.length}</p>
            <p className="text-sm text-[#5a5a5a] font-kalam">Shared Tasks</p>
          </CardContent>
        </Card>
        <Card className="journal-card">
          <CardContent className="p-4">
            <CheckCircle2 className="w-8 h-8 mb-2 text-green-500" />
            <p className="text-3xl font-bold font-caveat text-[#2d2d2d]">
              {sharedGoals.filter(g => g.status === 'completed').length}
            </p>
            <p className="text-sm text-[#5a5a5a] font-kalam">Goals Achieved</p>
          </CardContent>
        </Card>
        <Card className="journal-card">
          <CardContent className="p-4">
            <Calendar className="w-8 h-8 mb-2 text-orange-500" />
            <p className="text-3xl font-bold font-caveat text-[#2d2d2d]">
              {Math.floor((Date.now() - new Date(partner.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
            </p>
            <p className="text-sm text-[#5a5a5a] font-kalam">Days Together</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-full">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shared Goals */}
          <Card className="border-0 shadow-lg h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-caveat text-2xl">
                <Target className="w-5 h-5 text-purple-500" />
                Shared Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sharedGoals.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-kalam">No shared goals yet</p>
                </div>
              ) : (
                sharedGoals.map((goal) => (
                  <div key={goal.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium font-kalam text-lg">{goal.title}</p>
                      <Badge variant="outline" className="bg-white">{goal.progress}%</Badge>
                    </div>
                    <Progress value={goal.progress} className="h-2 mb-2" />
                    <div className="flex justify-between items-center text-xs text-slate-500 font-kalam">
                      <span>{goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones</span>
                      <span>Target: {goal.targetDate ? format(new Date(goal.targetDate), 'MMM d') : 'No date'}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Shared Tasks */}
          <Card className="border-0 shadow-lg h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-caveat text-2xl">
                <CheckSquare className="w-5 h-5 text-blue-500" />
                Shared Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sharedTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-kalam">No shared tasks yet</p>
                </div>
              ) : (
                sharedTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      task.status === 'completed' 
                        ? 'bg-green-50 border-green-100 opacity-70' 
                        : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-slate-300'
                    }`}>
                      {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`flex-1 font-kalam ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-[#2d2d2d]'}`}>
                      {task.title}
                    </span>
                    <Badge variant="outline" className="text-xs font-kalam">
                      {task.priorityScore.toFixed(1)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <Card className="border-0 shadow-lg bg-[#f9f7f4]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-caveat text-2xl">
                <Bell className="w-5 h-5 text-orange-500" />
                Latest Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockActivityFeed.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className={`mt-1 bg-white p-1 rounded-full h-fit shadow-sm border border-slate-100 ${activity.color}`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-[#2d2d2d] font-kalam">
                      <span className="font-bold">{activity.user}</span> {activity.action} <span className="underline decoration-slate-300 underline-offset-2">{activity.target}</span>
                    </p>
                    <p className="text-xs text-slate-400 font-kalam mt-1">
                      {format(activity.time, 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Challenges */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-caveat text-2xl">
                <Trophy className="w-5 h-5 text-purple-600" />
                Active Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockChallenges.map((challenge) => (
                <div key={challenge.id} className="bg-white/60 p-3 rounded-xl border border-purple-100">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold font-kalam text-[#2d2d2d]">{challenge.title}</h4>
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">Active</Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-kalam mb-3">{challenge.description}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-kalam text-slate-600">
                      <span>Progress</span>
                      <span>{challenge.progress}/{challenge.total} days</span>
                    </div>
                    <Progress value={(challenge.progress / challenge.total) * 100} className="h-1.5" />
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full journal-btn text-xs h-8">
                Create New Challenge
              </Button>
            </CardContent>
          </Card>

          {/* Anniversary */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-2xl">
                  🎁
                </div>
                <div>
                  <p className="font-bold font-caveat text-xl">Coming Up</p>
                  <p className="text-slate-600 font-kalam text-sm">Your 1-year anniversary is in 45 days!</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 bg-white/50 hover:bg-white text-rose-600 border-rose-200 font-kalam">
                Plan Something Special
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
