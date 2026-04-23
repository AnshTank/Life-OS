"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, Target, Sparkles, Wallet, Plus, TrendingUp,
  Clock, Flame, Zap, Star
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { lifeAreas } from '@/data/mockData';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { LifeArea, GoalCategory } from '@/types';

// Quick Add Task Modal
function QuickAddTaskModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addTask } = useApp();
  const [title, setTitle] = useState('');
  const [lifeArea, setLifeArea] = useState<LifeArea>('career');
  const [impact, setImpact] = useState(5);
  const [urgency, setUrgency] = useState(5);
  const [effort, setEffort] = useState(5);
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    addTask({
      userId: 'user-1',
      title,
      description: '',
      lifeArea,
      impact,
      urgency,
      effort,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'todo',
      isRecurring: false,
      tags: [],
      sharedWithPartner: false,
    });
    setTitle('');
    setImpact(5);
    setUrgency(5);
    setEffort(5);
    setDueDate('');
    onClose();
  };

  const priorityScore = (impact * 0.4 + urgency * 0.4 + (10 - effort) * 0.2).toFixed(1);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="journal-modal max-w-md">
        <DialogHeader>
          <DialogTitle className="font-caveat text-2xl">Add New Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="font-kalam text-sm mb-1 block">What needs to be done?</label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Enter task..."
              className="journal-input"
              autoFocus
            />
          </div>
          
          <div>
            <label className="font-kalam text-sm mb-1 block">Life Area</label>
            <Select value={lifeArea} onValueChange={(v) => setLifeArea(v as LifeArea)}>
              <SelectTrigger className="journal-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                {lifeAreas.map(area => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="font-kalam text-sm mb-1 block">Due Date</label>
            <Input 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)}
              className="journal-input"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-dashed border-[#c0c0c0]">
            <p className="font-kalam text-sm font-bold">Priority Score</p>
            
            <div>
              <div className="flex justify-between text-sm mb-1 font-kalam">
                <span>Impact</span>
                <span>{impact}/10</span>
              </div>
              <Slider value={[impact]} onValueChange={(v) => setImpact(v[0])} max={10} min={1} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 font-kalam">
                <span>Urgency</span>
                <span>{urgency}/10</span>
              </div>
              <Slider value={[urgency]} onValueChange={(v) => setUrgency(v[0])} max={10} min={1} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1 font-kalam">
                <span>Effort (lower = easier)</span>
                <span>{effort}/10</span>
              </div>
              <Slider value={[effort]} onValueChange={(v) => setEffort(v[0])} max={10} min={1} />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#e8eef3] rounded-lg border border-[#7a9eb8]">
              <span className="font-kalam text-sm">Priority Score</span>
              <span className="font-caveat text-xl font-bold text-[#5a7a94]">{priorityScore}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} className="flex-1 journal-btn-primary">
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </Button>
            <Button onClick={onClose} variant="outline" className="journal-btn">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick Add Goal Modal
function QuickAddGoalModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addGoal } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [lifeArea, setLifeArea] = useState<LifeArea>('career');
  const [targetDate, setTargetDate] = useState('');
  const [hasMilestones, setHasMilestones] = useState(true);
  const [milestones, setMilestones] = useState(['']);

  const goalCategories: { value: GoalCategory; label: string }[] = [
    { value: 'home', label: '🏠 Home' },
    { value: 'family', label: '👥 Family' },
    { value: 'house', label: '🏡 House' },
    { value: 'travel', label: '✈️ Travel' },
    { value: 'personal', label: '❤️ Personal' },
    { value: 'cars', label: '🚗 Cars' },
    { value: 'technology', label: '💻 Technology' },
    { value: 'career', label: '💼 Career' },
    { value: 'health', label: '💚 Health' },
    { value: 'finance', label: '💰 Finance' },
    { value: 'learning', label: '📚 Learning' },
    { value: 'relationships', label: '🤝 Relationships' },
  ];

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }
    
    const goalMilestones = hasMilestones 
      ? milestones.filter(m => m.trim()).map((m, i) => ({ id: `m-${i}`, title: m, completed: false }))
      : [];

    addGoal({
      userId: 'user-1',
      title,
      description,
      lifeArea,
      category,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      status: 'active',
      impact: 5,
      progress: 0,
      milestones: goalMilestones,
      sharedWithPartner: false,
    });
    
    setTitle('');
    setDescription('');
    setMilestones(['']);
    onClose();
  };

  const addMilestoneField = () => setMilestones([...milestones, '']);
  const updateMilestone = (index: number, value: string) => {
    const newMilestones = [...milestones];
    newMilestones[index] = value;
    setMilestones(newMilestones);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="journal-modal max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-caveat text-2xl">Create New Goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="font-kalam text-sm mb-1 block">What do you want to achieve?</label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Buy binoculars, Run a marathon..."
              className="journal-input"
              autoFocus
            />
          </div>
          
          <div>
            <label className="font-kalam text-sm mb-1 block">Why is this important?</label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Add some motivation..."
              className="journal-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-kalam text-sm mb-1 block">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v as GoalCategory)}>
                <SelectTrigger className="journal-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  {goalCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-kalam text-sm mb-1 block">Life Area</label>
              <Select value={lifeArea} onValueChange={(v) => setLifeArea(v as LifeArea)}>
                <SelectTrigger className="journal-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  {lifeAreas.map(area => (
                    <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="font-kalam text-sm mb-1 block">Target Date</label>
            <Input 
              type="date" 
              value={targetDate} 
              onChange={(e) => setTargetDate(e.target.value)}
              className="journal-input"
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={hasMilestones}
              onChange={(e) => setHasMilestones(e.target.checked)}
              className="journal-checkbox"
            />
            <label className="font-kalam text-sm">This goal has milestones</label>
          </div>

          {hasMilestones && (
            <div className="space-y-2">
              <label className="font-kalam text-sm">Milestones</label>
              {milestones.map((m, i) => (
                <Input
                  key={i}
                  value={m}
                  onChange={(e) => updateMilestone(i, e.target.value)}
                  placeholder={`Milestone ${i + 1}`}
                  className="journal-input"
                />
              ))}
              <Button onClick={addMilestoneField} variant="outline" className="journal-btn w-full">
                <Plus className="w-4 h-4 mr-1" />
                Add Milestone
              </Button>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} className="flex-1 journal-btn-primary">
              <Target className="w-4 h-4 mr-1" />
              Create Goal
            </Button>
            <Button onClick={onClose} variant="outline" className="journal-btn">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick Add Habit Modal
function QuickAddHabitModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addHabit } = useApp();
  const [title, setTitle] = useState('');
  const [lifeArea, setLifeArea] = useState<LifeArea>('health');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [targetDays, setTargetDays] = useState(7);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a habit name');
      return;
    }
    addHabit({
      userId: 'user-1',
      title,
      description: '',
      lifeArea,
      frequency,
      targetDays,
      color: '#8ab896',
      icon: 'Sparkles',
      checkins: [],
      habitType: 'boolean',
    });
    setTitle('');
    setTargetDays(7);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="journal-modal max-w-md">
        <DialogHeader>
          <DialogTitle className="font-caveat text-2xl">Track New Habit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="font-kalam text-sm mb-1 block">What habit do you want to build?</label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Drink 3L water, Read 30 mins..."
              className="journal-input"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-kalam text-sm mb-1 block">Life Area</label>
              <Select value={lifeArea} onValueChange={(v) => setLifeArea(v as LifeArea)}>
                <SelectTrigger className="journal-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  {lifeAreas.map(area => (
                    <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-kalam text-sm mb-1 block">Frequency</label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as 'daily' | 'weekly' | 'monthly')}>
                <SelectTrigger className="journal-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="font-kalam text-sm mb-1 block">Target: {targetDays} days per {frequency === 'daily' ? 'week' : frequency === 'weekly' ? 'month' : 'year'}</label>
            <Slider 
              value={[targetDays]} 
              onValueChange={(v) => setTargetDays(v[0])} 
              max={frequency === 'daily' ? 7 : frequency === 'weekly' ? 4 : 12} 
              min={1} 
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} className="flex-1 journal-btn-primary">
              <Sparkles className="w-4 h-4 mr-1" />
              Start Tracking
            </Button>
            <Button onClick={onClose} variant="outline" className="journal-btn">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick Add Transaction Modal
function QuickAddTransactionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addTransaction } = useApp();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const categories = type === 'income' 
    ? ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
    : ['Food', 'Rent', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other'];

  const handleSubmit = () => {
    if (!amount || !category) {
      toast.error('Please fill in all fields');
      return;
    }
    addTransaction({
      userId: 'user-1',
      type,
      category,
      amount: parseFloat(amount),
      description,
      date: new Date(),
      tags: [],
    });
    setAmount('');
    setCategory('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="journal-modal max-w-md">
        <DialogHeader>
          <DialogTitle className="font-caveat text-2xl">Add Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="flex gap-2">
            <Button 
              onClick={() => setType('income')}
              className={`flex-1 ${type === 'income' ? 'journal-btn-green' : 'journal-btn'}`}
            >
              Income
            </Button>
            <Button 
              onClick={() => setType('expense')}
              className={`flex-1 ${type === 'expense' ? 'journal-btn-red' : 'journal-btn'}`}
            >
              Expense
            </Button>
          </div>

          <div>
            <label className="font-kalam text-sm mb-1 block">Amount ($)</label>
            <Input 
              type="number"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00"
              className="journal-input"
              autoFocus
            />
          </div>

          <div>
            <label className="font-kalam text-sm mb-1 block">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="journal-input">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="font-kalam text-sm mb-1 block">Description (optional)</label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="What was this for?"
              className="journal-input"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} className="flex-1 journal-btn-primary">
              <Plus className="w-4 h-4 mr-1" />
              Add Transaction
            </Button>
            <Button onClick={onClose} variant="outline" className="journal-btn">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DashboardPage() {
  const { user, stats, getTodayTasks, goals, habits, getMonthlySummary } = useApp();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  
  const todayTasks = getTodayTasks();
  const monthlySummary = getMonthlySummary();
  const isProfit = stats.totalPnl >= 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <h1 className="font-caveat text-4xl md:text-5xl text-[#2d2d2d]">
          {greeting()}, <span className="text-[#7a9eb8]">{user?.name || 'Friend'}!</span>
        </h1>
        <p className="font-kalam text-lg text-[#5a5a5a] mt-1">
          Here's what's happening in your life today.
        </p>
        <div className="coffee-stain top-0 right-20 opacity-30" />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        <Button onClick={() => setShowTaskModal(true)} className="journal-btn-blue">
          <CheckSquare className="w-4 h-4 mr-2" />
          Add Task
        </Button>
        <Button onClick={() => setShowGoalModal(true)} className="journal-btn-green">
          <Target className="w-4 h-4 mr-2" />
          New Goal
        </Button>
        <Button onClick={() => setShowHabitModal(true)} className="journal-btn">
          <Sparkles className="w-4 h-4 mr-2" />
          Track Habit
        </Button>
        <Button onClick={() => setShowTransactionModal(true)} className="journal-btn">
          <Wallet className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="journal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-kalam text-sm text-[#5a5a5a]">Today's Tasks</p>
              <p className="font-caveat text-3xl">{todayTasks.length}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#e8eef3] border border-[#7a9eb8] flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-[#5a7a94]" />
            </div>
          </div>
        </div>

        <div className="journal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-kalam text-sm text-[#5a5a5a]">Active Goals</p>
              <p className="font-caveat text-3xl">{stats.activeGoals}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#e8f0e9] border border-[#8ab896] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#5a9468]" />
            </div>
          </div>
        </div>

        <div className="journal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-kalam text-sm text-[#5a5a5a]">Habit Streaks</p>
              <p className="font-caveat text-3xl">{stats.activeStreaks}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#fef9e6] border border-[#e0d4a0] flex items-center justify-center">
              <Flame className="w-5 h-5 text-[#a8a05a]" />
            </div>
          </div>
        </div>

        <div className="journal-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-kalam text-sm text-[#5a5a5a]">Portfolio</p>
              <p className={`font-caveat text-3xl ${isProfit ? 'text-[#5a9468]' : 'text-[#a85a5a]'}`}>
                {isProfit ? '+' : ''}${(stats.totalPnl / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f0f7f2] border border-[#8ab896] flex items-center justify-center">
              <TrendingUp className={`w-5 h-5 ${isProfit ? 'text-[#5a9468]' : 'text-[#a85a5a]'}`} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 journal-page p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-caveat text-2xl flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#d9b896]" />
              Today's Focus
            </h2>
            <Badge className="bg-[#e8eef3] text-[#5a7a94] border border-[#7a9eb8] font-kalam">
              {todayTasks.filter(t => t.status === 'completed').length}/{todayTasks.length} done
            </Badge>
          </div>

          <div className="space-y-2">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-[#8a8a8a]">
                <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-kalam">No tasks for today</p>
                <Button onClick={() => setShowTaskModal(true)} className="journal-btn mt-3">
                  <Plus className="w-4 h-4 mr-1" />
                  Add your first task
                </Button>
              </div>
            ) : (
              todayTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    task.status === 'completed' 
                      ? 'bg-[#e8f0e9]' 
                      : 'bg-[#f9f7f4] hover:bg-[#f5f0e6]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => {}}
                    className="journal-checkbox"
                  />
                  <div className="flex-1">
                    <p className={`font-kalam ${task.status === 'completed' ? 'line-through text-[#8a8a8a]' : ''}`}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-[#8a8a8a] font-kalam flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(task.dueDate), 'h:mm a')}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border font-kalam ${
                    (task.priorityScore || 0) >= 8 ? 'bg-[#f5e8e8] text-[#a85a5a] border-[#d49191]' :
                    (task.priorityScore || 0) >= 6 ? 'bg-[#f5ece3] text-[#a88a5a] border-[#d9b896]' :
                    'bg-[#e8f0e9] text-[#5a9468] border-[#8ab896]'
                  }`}>
                    {(task.priorityScore || 0).toFixed(1)}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Habit Streaks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="journal-page p-5"
          >
            <h2 className="font-caveat text-xl flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-[#d9b896]" />
              Habit Streaks
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {habits.slice(0, 4).map((habit) => (
                <div key={habit.id} className="p-3 bg-[#fef9e6] rounded-lg border border-[#e0d4a0]">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${habit.color}40` }}
                    >
                      <Sparkles className="w-3 h-3" style={{ color: habit.color }} />
                    </div>
                    <span className="font-kalam text-xs truncate">{habit.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-[#d9b896]" />
                    <span className="font-caveat text-xl">{habit.streak}</span>
                    <span className="font-kalam text-xs text-[#8a8a8a]">days</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Monthly Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="journal-page p-5"
          >
            <h2 className="font-caveat text-xl flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-[#8ab896]" />
              This Month
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-kalam text-sm text-[#5a5a5a]">Income</span>
                <span className="font-caveat text-lg text-[#5a9468]">+${monthlySummary.income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-kalam text-sm text-[#5a5a5a]">Expenses</span>
                <span className="font-caveat text-lg text-[#a85a5a]">-${monthlySummary.expenses.toLocaleString()}</span>
              </div>
              <div className="journal-divider my-2" />
              <div className="flex justify-between items-center">
                <span className="font-kalam text-sm font-bold">Savings</span>
                <span className={`font-caveat text-xl ${monthlySummary.savings >= 0 ? 'text-[#5a9468]' : 'text-[#a85a5a]'}`}>
                  ${monthlySummary.savings.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Active Goals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="journal-page p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-caveat text-2xl flex items-center gap-2">
            <Target className="w-5 h-5 text-[#a99bc4]" />
            Active Goals
          </h2>
          <Button onClick={() => setShowGoalModal(true)} className="journal-btn text-sm">
            <Plus className="w-4 h-4 mr-1" />
            New Goal
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.filter(g => g.status === 'active').slice(0, 3).map((goal) => (
            <div key={goal.id} className="p-4 bg-[#f9f7f4] rounded-lg border border-[#e0e0e0]">
              <div className="flex items-start justify-between mb-2">
                <p className="font-kalam font-medium">{goal.title}</p>
                <span className="font-caveat text-lg text-[#a99bc4]">{goal.progress}%</span>
              </div>
              <div className="journal-progress h-2">
                <div 
                  className="journal-progress-fill"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <p className="text-xs text-[#8a8a8a] font-kalam mt-2">
                {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Modals */}
      <QuickAddTaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} />
      <QuickAddGoalModal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} />
      <QuickAddHabitModal isOpen={showHabitModal} onClose={() => setShowHabitModal(false)} />
      <QuickAddTransactionModal isOpen={showTransactionModal} onClose={() => setShowTransactionModal(false)} />
    </div>
  );
}
