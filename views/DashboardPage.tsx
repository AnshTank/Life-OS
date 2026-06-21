"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CheckSquare, Target, Sparkles, Wallet, Plus, TrendingUp,
  Clock, Flame, Zap, Star, Heart, Users, Square
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
import { formatCurrency, getCurrencySymbol, SUPPORTED_CURRENCIES, fetchExchangeRate } from '@/utils/currency';

// Quick Add Task Modal
function QuickAddTaskModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addTask, user } = useApp();
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
      userId: user?.id || 'user-1',
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
  const { addGoal, user } = useApp();
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
      userId: user?.id || 'user-1',
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
  const { addHabit, user } = useApp();
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
      userId: user?.id || 'user-1',
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
  const { addTransaction, user, currencyPreference } = useApp();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [txCurrency, setTxCurrency] = useState(currencyPreference || 'INR');
  const [isConverting, setIsConverting] = useState(false);

  // Sync default currency
  useEffect(() => {
    if (isOpen && currencyPreference) {
      setTxCurrency(currencyPreference);
    }
  }, [isOpen, currencyPreference]);

  const categories = type === 'income' 
    ? ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
    : ['Food', 'Rent', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other'];

  const handleSubmit = async () => {
    if (!amount || !category) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsConverting(true);
    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        toast.error('Invalid amount');
        return;
      }

      let finalAmount = parsedAmount;
      let extraNote = "";

      if (txCurrency !== currencyPreference) {
        const rate = await fetchExchangeRate(txCurrency, currencyPreference);
        finalAmount = parsedAmount * rate;
        extraNote = ` [Converted from ${getCurrencySymbol(txCurrency)}${parsedAmount.toFixed(2)} at rate of ${rate.toFixed(4)}]`;
      }

      addTransaction({
        userId: user?.id || 'user-1',
        type,
        category,
        amount: finalAmount,
        description: (description || category) + extraNote,
        date: new Date(),
        tags: txCurrency !== currencyPreference ? ['converted', txCurrency] : [],
      });

      setAmount('');
      setCategory('');
      setDescription('');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to convert currency');
    } finally {
      setIsConverting(false);
    }
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
              disabled={isConverting}
            >
              Income
            </Button>
            <Button 
              onClick={() => setType('expense')}
              className={`flex-1 ${type === 'expense' ? 'journal-btn-red' : 'journal-btn'}`}
              disabled={isConverting}
            >
              Expense
            </Button>
          </div>

          <div>
            <label className="font-kalam text-sm mb-1 block">Amount</label>
            <div className="flex gap-2">
              <Select value={txCurrency} onValueChange={setTxCurrency} disabled={isConverting}>
                <SelectTrigger className="journal-input w-28 shrink-0 bg-white border-2 border-slate-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  {SUPPORTED_CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.code} ({c.symbol})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input 
                type="number"
                step="any"
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00"
                className="journal-input flex-1 bg-white border-2 border-slate-400 font-caveat text-xl"
                disabled={isConverting}
                autoFocus
              />
            </div>
            {txCurrency !== currencyPreference && (
              <p className="text-xs font-kalam text-slate-500 mt-1 italic animate-pulse">
                Will be logged in {currencyPreference} using live rates.
              </p>
            )}
          </div>

          <div>
            <label className="font-kalam text-sm mb-1 block">Category</label>
            <Select value={category} onValueChange={setCategory} disabled={isConverting}>
              <SelectTrigger className="journal-input bg-white border-2 border-slate-400">
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
              className="journal-input bg-white border-2 border-slate-400"
              disabled={isConverting}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} className="flex-1 journal-btn-primary" disabled={isConverting}>
              {isConverting ? "Converting..." : <>
                <Plus className="w-4 h-4 mr-1" />
                Add Transaction
              </>}
            </Button>
            <Button onClick={onClose} variant="outline" className="journal-btn border-2 border-slate-400" disabled={isConverting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DashboardPage() {
  const { 
    user, stats, getTodayTasks, goals, habits, getMonthlySummary,
    projects, partners, journalEntries, isLoading, completeTask,
    currencyPreference
  } = useApp();
  
  const router = useRouter();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  
  const todayTasks = getTodayTasks();
  const monthlySummary = getMonthlySummary();
  const isProfit = stats.totalPnl >= 0;

  const activeProjects = projects.filter(p => p.status === 'in-progress' || p.status === 'planning');
  const recentJournal = journalEntries.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Journal Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-[#fef9e6] p-8 sm:p-12 border-2 border-[#e8dac0] shadow-[6px_6px_0px_#e8dac0]"
      >
        <div className="relative z-10">
          <Badge className="bg-[#f9f7f4] text-[#5a5a5a] border-2 border-[#e8dac0] hover:bg-[#fdfbf7] mb-4 font-kalam">
            Life OS Overview
          </Badge>
          <h1 className="font-caveat text-5xl md:text-6xl text-[#2d2d2d]">
            {greeting()}, <span className="text-[#8ab896]">{user?.name || 'Friend'}!</span>
          </h1>
          <p className="font-kalam text-xl text-[#5a5a5a] mt-2 max-w-xl">
            Here's a snapshot of your journey today. Keep writing your story.
          </p>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <Button onClick={() => setShowTaskModal(true)} className="journal-btn bg-[#e8f0e9] border-[#8ab896] text-[#5a9468] hover:bg-[#d8eadd] shadow-[3px_3px_0px_#8ab896]">
              <CheckSquare className="w-4 h-4 mr-2" /> Add Task
            </Button>
            <Button onClick={() => setShowGoalModal(true)} className="journal-btn bg-[#e8eef3] border-[#7a9eb8] text-[#5a7a94] hover:bg-[#d8e4ed] shadow-[3px_3px_0px_#7a9eb8]">
              <Target className="w-4 h-4 mr-2" /> New Goal
            </Button>
            <Button onClick={() => setShowHabitModal(true)} className="journal-btn bg-[#fef9e6] border-[#d9b896] text-[#a88a5a] hover:bg-[#fcf2c9] shadow-[3px_3px_0px_#d9b896]">
              <Sparkles className="w-4 h-4 mr-2" /> Track Habit
            </Button>
            <Button onClick={() => setShowTransactionModal(true)} className="journal-btn bg-[#f5e8e8] border-[#d49191] text-[#a85a5a] hover:bg-[#f0dada] shadow-[3px_3px_0px_#d49191]">
              <Wallet className="w-4 h-4 mr-2" /> Add Transaction
            </Button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20 pointer-events-none">
          <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 40 Q 100 20, 160 40 T 160 160 Q 100 180, 40 160 T 40 40" fill="none" stroke="#e8dac0" strokeWidth="2" />
            <circle cx="100" cy="100" r="50" fill="none" stroke="#e8dac0" strokeWidth="2" strokeDasharray="5,5" />
          </svg>
        </div>
      </motion.div>

      {/* Top Level Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        {[
          { label: "Today's Tasks", value: todayTasks.length, icon: CheckSquare, color: "text-[#5a9468]", bg: "bg-[#e8f0e9]" },
          { label: "Active Goals", value: stats.activeGoals, icon: Target, color: "text-[#d49191]", bg: "bg-[#f5e8e8]" },
          { label: "Habit Streaks", value: stats.activeStreaks, icon: Flame, color: "text-[#c97b7b]", bg: "bg-[#f9eaea]" },
          { label: "Portfolio PnL", value: `${isProfit ? '+' : ''}${formatCurrency(stats.totalPnl, currencyPreference, true)}`, icon: TrendingUp, color: isProfit ? "text-[#5a9468]" : "text-[#c97b7b]", bg: isProfit ? "bg-[#e8f0e9]" : "bg-[#f5e8e8]" },
          { label: "Partner Network", value: partners.length, icon: Users, color: "text-[#7a9eb8]", bg: "bg-[#e8eef3]" }
        ].map((stat, i) => (
          <div key={i} className="bg-[#fdfbf7] p-5 rounded-xl border-2 border-[#e8dac0] shadow-[2px_2px_0px_#e8dac0] hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 rounded-full ${stat.bg} border border-[#e8dac0] flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="font-caveat text-3xl font-bold text-[#2d2d2d]">{stat.value}</p>
            <p className="font-kalam text-sm text-[#5a5a5a]">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column (Tasks & Journal) */}
        <div className="md:col-span-5 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#fdfbf7] rounded-xl p-6 border-2 border-[#e8dac0] shadow-[4px_4px_0px_#e8dac0]"
          >
            <div className="flex items-center justify-between mb-6 border-b-2 border-dashed border-[#e8dac0] pb-2">
              <h2 className="font-caveat text-3xl flex items-center gap-2 text-[#2d2d2d]">
                <Zap className="w-6 h-6 text-[#d49191]" />
                Focus Tasks
              </h2>
              <Badge className="bg-[#fef9e6] text-[#5a5a5a] border-2 border-[#e8dac0] font-kalam">
                {todayTasks.filter(t => t.status === 'completed').length}/{todayTasks.length} done
              </Badge>
            </div>
            
            <div className="space-y-3">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 mx-auto mb-2 text-[#e8dac0]" />
                  <p className="font-kalam text-[#5a5a5a]">All caught up for today!</p>
                </div>
              ) : (
                todayTasks.map((task, index) => (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    task.status === 'completed' ? 'bg-[#f9f7f4] border-[#e8dac0] opacity-60' : 'bg-white border-[#e8dac0] hover:border-[#8ab896] shadow-sm'
                  }`}>
                    <button
                      onClick={() => task.status !== 'completed' && completeTask(task.id)}
                      disabled={task.status === 'completed'}
                      className={`flex-shrink-0 transition-colors ${
                        task.status === 'completed' ? 'text-[#5a9468] cursor-default' : 'text-[#8a8a8a] hover:text-[#5a9468]'
                      }`}
                    >
                      {task.status === 'completed' ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className={`font-kalam font-bold ${task.status === 'completed' ? 'line-through text-[#5a5a5a]' : 'text-[#2d2d2d]'}`}>
                         {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs text-[#5a5a5a] font-kalam flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(task.dueDate), 'h:mm a')}
                        </p>
                      )}
                    </div>
                    <Badge className={`font-kalam text-xs ${task.status === 'completed' ? 'bg-[#e8dac0] text-[#5a5a5a]' : 'bg-[#fef9e6] text-[#c97b7b] border border-[#c97b7b]'}`}>
                      {task.priorityScore?.toFixed(1) || 'N/A'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Journal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#fef9e6] rounded-xl p-6 border-2 border-[#e8dac0] shadow-[4px_4px_0px_#e8dac0] relative overflow-hidden group"
          >
            <h2 className="font-caveat text-2xl flex items-center gap-2 mb-4 text-[#2d2d2d] border-b-2 border-dashed border-[#e8dac0] pb-2">
              <Heart className="w-5 h-5 text-[#d49191]" />
              Latest Journal
            </h2>
            {recentJournal ? (
              <div>
                <p className="font-kalam text-sm text-[#5a5a5a] mb-1">{format(new Date(recentJournal.createdAt), 'MMMM d, yyyy')}</p>
                <p className="font-kalam text-[#2d2d2d] line-clamp-3">{recentJournal.content}</p>
              </div>
            ) : (
              <p className="font-kalam text-[#5a5a5a]">No entries yet. How are you feeling today?</p>
            )}
          </motion.div>
        </div>

        {/* Center Column (Projects & Goals) */}
        <div className="md:col-span-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#fdfbf7] rounded-xl p-6 border-2 border-[#e8dac0] shadow-[4px_4px_0px_#e8dac0]"
          >
            <h2 className="font-caveat text-3xl flex items-center gap-2 mb-6 text-[#2d2d2d] border-b-2 border-dashed border-[#e8dac0] pb-2">
              <Target className="w-6 h-6 text-[#7a9eb8]" />
              Active Projects
            </h2>
            <div className="space-y-4">
              {activeProjects.slice(0, 3).map(project => (
                <div 
                  key={project.id} 
                  className="group cursor-pointer hover:bg-[#f9f7f4] p-2 -m-2 rounded-lg transition-all"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-kalam font-bold text-[#2d2d2d] group-hover:text-[#7a9eb8] transition-colors">{project.title}</p>
                    <span className="font-caveat text-xl text-[#7a9eb8]">{project.progress}%</span>
                  </div>
                  <div className="h-3 w-full bg-[#f9f7f4] rounded-full overflow-hidden border border-[#e8dac0]">
                    <div 
                      className="h-full bg-[#7a9eb8] transition-all duration-1000"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              ))}
              {activeProjects.length === 0 && (
                <p className="font-kalam text-[#5a5a5a] text-center py-4">No active projects.</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#fdfbf7] rounded-xl p-6 border-2 border-[#e8dac0] shadow-[4px_4px_0px_#e8dac0]"
          >
            <h2 className="font-caveat text-2xl flex items-center gap-2 mb-4 text-[#2d2d2d] border-b-2 border-dashed border-[#e8dac0] pb-2">
              <Wallet className="w-5 h-5 text-[#8ab896]" />
              This Month
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#f9f7f4] p-3 rounded-lg border border-[#e8dac0]">
                <span className="font-kalam text-sm text-[#5a5a5a]">Income</span>
                <span className="font-caveat text-xl text-[#5a9468]">+{formatCurrency(monthlySummary.income, currencyPreference)}</span>
              </div>
              <div className="flex justify-between items-center bg-[#f9f7f4] p-3 rounded-lg border border-[#e8dac0]">
                <span className="font-kalam text-sm text-[#5a5a5a]">Expenses</span>
                <span className="font-caveat text-xl text-[#c97b7b]">-{formatCurrency(monthlySummary.expenses, currencyPreference)}</span>
              </div>
              <div className="flex justify-between items-center bg-[#e8f0e9] p-3 rounded-lg border border-[#8ab896] mt-2">
                <span className="font-kalam text-sm font-bold text-[#2d2d2d]">Net Savings</span>
                <span className={`font-caveat text-2xl ${monthlySummary.savings >= 0 ? 'text-[#5a9468]' : 'text-[#c97b7b]'}`}>
                  {formatCurrency(monthlySummary.savings, currencyPreference)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column (Partners & Habits) */}
        <div className="md:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-[#fdfbf7] rounded-xl p-6 border-2 border-[#e8dac0] shadow-[4px_4px_0px_#e8dac0]"
          >
            <h2 className="font-caveat text-2xl flex items-center gap-2 mb-4 text-[#2d2d2d] border-b-2 border-dashed border-[#e8dac0] pb-2">
              <Users className="w-5 h-5 text-[#9b8ab8]" />
              Key Partners
            </h2>
            <div className="space-y-3">
              {partners.slice(0, 4).map(partner => (
                <div key={partner.id} className="flex items-center gap-3 bg-[#f9f7f4] p-2 rounded-lg border border-[#e8dac0]">
                  <div className="w-8 h-8 rounded-full bg-[#f3eef8] border border-[#9b8ab8] flex items-center justify-center text-[#9b8ab8] font-bold font-kalam">
                    {partner.name[0]}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-kalam text-sm font-bold text-[#2d2d2d] truncate">{partner.name}</p>
                    <p className="text-[10px] text-[#5a5a5a] uppercase tracking-wider">{partner.partnerType}</p>
                  </div>
                </div>
              ))}
              {partners.length === 0 && (
                <p className="font-kalam text-[#5a5a5a] text-center text-sm py-2">Expand your network.</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-[#fdfbf7] rounded-xl p-6 border-2 border-[#e8dac0] shadow-[4px_4px_0px_#e8dac0]"
          >
            <h2 className="font-caveat text-2xl flex items-center gap-2 mb-4 text-[#2d2d2d] border-b-2 border-dashed border-[#e8dac0] pb-2">
              <Flame className="w-5 h-5 text-[#c97b7b]" />
              Habit Streaks
            </h2>
            <div className="space-y-3">
              {habits.slice(0, 3).map((habit) => (
                <div key={habit.id} className="flex justify-between items-center border-b border-dashed border-[#e8dac0] pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center border border-[#e8dac0]" style={{ backgroundColor: `${habit.color}15` }}>
                      <Sparkles className="w-3 h-3" style={{ color: habit.color }} />
                    </div>
                    <span className="font-kalam text-sm text-[#2d2d2d]">{habit.title}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#fef9e6] px-2 py-1 rounded-lg border border-[#e8dac0]">
                    <Flame className="w-3 h-3 text-[#c97b7b]" />
                    <span className="font-caveat font-bold text-[#c97b7b]">{habit.streak}</span>
                  </div>
                </div>
              ))}
              {habits.length === 0 && (
                <p className="font-kalam text-[#5a5a5a] text-center text-sm py-2">No habits tracked.</p>
              )}
            </div>
          </motion.div>
        </div>

      </div>

      {/* Modals */}
      <QuickAddTaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} />
      <QuickAddGoalModal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} />
      <QuickAddHabitModal isOpen={showHabitModal} onClose={() => setShowHabitModal(false)} />
      <QuickAddTransactionModal isOpen={showTransactionModal} onClose={() => setShowTransactionModal(false)} />
    </div>
  );
}
