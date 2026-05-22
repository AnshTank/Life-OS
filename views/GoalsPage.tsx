"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, CheckCircle2, Circle, Trophy, Calendar, 
  TrendingUp, MoreHorizontal, Trash2, Edit2, Flag, Home,
  Plane, Heart, Car, Laptop, Briefcase, DollarSign, BookOpen,
  Users, X, Sparkles
} from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { Goal, LifeArea, GoalCategory, GoalStatus } from '@/types';
import { lifeAreas } from '@/data/mockData';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

const categoryIcons: Record<GoalCategory, React.ElementType> = {
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
  relationships: Users,
};

const categoryLabels: Record<GoalCategory, string> = {
  home: 'Home',
  family: 'Family',
  house: 'House',
  travel: 'Travel',
  personal: 'Personal',
  cars: 'Cars',
  technology: 'Technology',
  career: 'Career',
  health: 'Health',
  finance: 'Finance',
  learning: 'Learning',
  relationships: 'Relationships',
};

// Goal Form Component
function GoalForm({ 
  onSubmit, 
  onCancel, 
  initialData 
}: { 
  onSubmit: (goal: Partial<Goal>) => void; 
  onCancel: () => void;
  initialData?: Goal;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [lifeArea, setLifeArea] = useState<LifeArea>(initialData?.lifeArea || 'career');
  const [category, setCategory] = useState<GoalCategory>(initialData?.category || 'personal');
  const [targetDate, setTargetDate] = useState(initialData?.targetDate ? format(initialData.targetDate, 'yyyy-MM-dd') : '');
  const [impact, setImpact] = useState(initialData?.impact || 5);
  const [hasMilestones, setHasMilestones] = useState(initialData ? initialData.milestones.length > 0 : true);
  const [milestones, setMilestones] = useState<string[]>(
    initialData?.milestones.map(m => m.title) || ['']
  );
  const [partnerId, setPartnerId] = useState(initialData?.partnerId || '');
  const { partners } = useApp();

  const addMilestoneField = () => setMilestones([...milestones, '']);
  const updateMilestone = (index: number, value: string) => {
    const newMilestones = [...milestones];
    newMilestones[index] = value;
    setMilestones(newMilestones);
  };
  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }
    
    const goalMilestones = hasMilestones 
      ? milestones.filter(m => m.trim()).map((m, i) => ({ 
          id: `m-${Date.now()}-${i}`, 
          title: m, 
          completed: false 
        }))
      : [];

    onSubmit({
      title,
      description,
      lifeArea,
      category,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      impact,
      progress: initialData?.progress || 0,
      milestones: goalMilestones,
      status: 'active',
      sharedWithPartner: !!partnerId,
      partnerId: partnerId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pr-2 max-h-[75vh] overflow-y-auto no-scrollbar">
      <div>
        <label className="font-kalam text-sm mb-1 block">Goal Title</label>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-kalam text-sm mb-1 block">Category</label>
          <Select value={category} onValueChange={(v) => setCategory(v as GoalCategory)}>
            <SelectTrigger className="journal-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
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

      <div>
        <label className="font-kalam text-sm mb-1 block">Impact (1-10)</label>
        <Slider value={[impact]} onValueChange={(v) => setImpact(v[0])} max={10} min={1} />
        <p className="text-right text-sm text-[#8a8a8a] font-kalam">{impact}/10</p>
      </div>

      <div><label className="font-kalam text-sm mb-1 block">Assign Partner</label>
        <Select value={partnerId} onValueChange={setPartnerId}>
          <SelectTrigger className="journal-input">
            <SelectValue placeholder="Select a partner (optional)" />
          </SelectTrigger>
          <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
            <SelectItem value="none">No Partner</SelectItem>
            {partners.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select></div>

      <div className="flex items-center gap-2 p-3 bg-[#f5f0e6] rounded-lg">
        <input 
          type="checkbox" 
          checked={hasMilestones}
          onChange={(e) => setHasMilestones(e.target.checked)}
          className="journal-checkbox"
        />
        <label className="font-kalam text-sm">This goal has milestones (for big goals)</label>
      </div>

      {hasMilestones && (
        <div className="space-y-2">
          <label className="font-kalam text-sm">Milestones</label>
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={m}
                onChange={(e) => updateMilestone(i, e.target.value)}
                placeholder={`Step ${i + 1} to achieve your goal`}
                className="journal-input flex-1"
              />
              {milestones.length > 1 && (
                <button 
                  type="button"
                  onClick={() => removeMilestone(i)}
                  className="p-2 hover:bg-[#f5e8e8] rounded"
                >
                  <X className="w-4 h-4 text-[#a85a5a]" />
                </button>
              )}
            </div>
          ))}
          <Button type="button" onClick={addMilestoneField} variant="outline" className="journal-btn w-full">
            <Plus className="w-4 h-4 mr-1" />
            Add Milestone
          </Button>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 journal-btn-primary">
          {initialData ? 'Update Goal' : 'Create Goal'}
        </Button>
        <Button type="button" onClick={onCancel} variant="outline" className="journal-btn">
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Goal Card Component
function GoalCard({ 
  goal, 
  onCompleteMilestone, 
  onEdit, 
  onDelete 
}: { 
  goal: Goal; 
  onCompleteMilestone: (milestoneId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const area = lifeAreas.find(a => a.id === goal.lifeArea);
  const CategoryIcon = categoryIcons[goal.category] || Target;
  const daysLeft = goal.targetDate ? differenceInDays(new Date(goal.targetDate), new Date()) : null;
  const completedMilestones = goal.milestones.filter(m => m.completed).length;
  const hasMilestones = goal.milestones.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className="journal-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#f5f0e6] border-2 border-[#2d2d2d] flex items-center justify-center">
            <CategoryIcon className="w-6 h-6 text-[#5a5a5a]" />
          </div>
          <div>
            <h3 className="font-caveat text-xl font-bold">{goal.title}</h3>
            <p className="font-kalam text-sm text-[#8a8a8a]">{goal.description}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-[#f5f0e6] rounded">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
            <DropdownMenuItem onClick={onEdit} className="font-kalam">
              <Edit2 className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="font-kalam text-[#a85a5a]">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="category-tag bg-[#e8eef3] border-[#7a9eb8] text-[#5a7a94]">
          {categoryLabels[goal.category]}
        </span>
        {area && (
          <span className="category-tag bg-[#f5f0e6] border-[#c0c0c0] text-[#5a5a5a]">
            {area.name}
          </span>
        )}
        {daysLeft !== null && (
          <span className={`category-tag ${daysLeft < 7 ? 'bg-[#f5e8e8] border-[#d49191] text-[#a85a5a]' : 'bg-[#e8f0e9] border-[#8ab896] text-[#5a9468]'}`}>
            <Calendar className="w-3 h-3 mr-1" />
            {daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
          </span>
        )}
      </div>

      {/* AI Random Quote for Small Goals */}
      {goal.aiQuote && (
        <div className="mb-4 p-3 bg-[#e8f0e9] border border-[#8ab896] rounded-lg">
          <p className="italic font-kalam text-sm text-[#5a9468] text-center">
            {goal.aiQuote}
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="font-kalam text-sm text-[#5a5a5a]">Progress</span>
          <span className="font-caveat text-xl text-[#5a9468]">{goal.progress}%</span>
        </div>
        <div className="journal-progress h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 0.5 }}
            className="journal-progress-fill"
          />
        </div>
        {hasMilestones && (
          <p className="text-xs text-[#8a8a8a] font-kalam mt-1">
            {completedMilestones}/{goal.milestones.length} milestones completed
          </p>
        )}
      </div>

      {/* Milestones */}
      {hasMilestones && (
        <div className="space-y-2 pt-3 border-t border-dashed border-[#c0c0c0]">
          <p className="font-kalam text-sm font-bold">Milestones</p>
          {goal.milestones.map((milestone) => (
            <div 
              key={milestone.id} 
              className="flex items-center gap-2 p-2 rounded hover:bg-[#f5f0e6] cursor-pointer transition-colors"
              onClick={() => onCompleteMilestone(milestone.id)}
            >
              {milestone.completed ? (
                <CheckCircle2 className="w-5 h-5 text-[#8ab896]" />
              ) : (
                <Circle className="w-5 h-5 text-[#c0c0c0]" />
              )}
              <span className={`font-kalam text-sm flex-1 ${milestone.completed ? 'line-through text-[#8a8a8a]' : ''}`}>
                {milestone.title}
              </span>
              {milestone.completed && milestone.completedAt && (
                <span className="text-xs text-[#8a8a8a] font-kalam">
                  {format(new Date(milestone.completedAt), 'MMM d')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Simple goal completion for non-milestone goals */}
      {!hasMilestones && goal.progress < 100 && (
        <div className="pt-3 border-t border-dashed border-[#c0c0c0]">
          <button 
            onClick={() => onCompleteMilestone('')}
            className="w-full p-2 bg-[#e8f0e9] hover:bg-[#d8e8dc] rounded-lg border border-[#8ab896] font-kalam text-sm text-[#5a9468] transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Mark as Complete
          </button>
        </div>
      )}
    </motion.div>
  );
}

export function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, toggleMilestone } = useGoals();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filterCategory, setFilterCategory] = useState<GoalCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('all');

  const filteredGoals = goals.filter(goal => {
    if (filterCategory !== 'all' && goal.category !== filterCategory) return false;
    if (filterStatus !== 'all' && goal.status !== filterStatus) return false;
    return true;
  });

  const goalStats = {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    totalProgress: goals.length > 0 
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) 
      : 0,
  };

  const handleAddGoal = async (goalData: Partial<Goal>) => {
    await addGoal(goalData);
    setIsAddDialogOpen(false);
    toast.success('Goal created! Let\'s make it happen! 🎯');
  };

  const handleEditGoal = async (goalData: Partial<Goal>) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, goalData);
      setEditingGoal(null);
      toast.success('Goal updated!');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteGoal(id);
    toast.success('Goal deleted');
  };

  const handleCompleteMilestone = async (goalId: string, milestoneId: string) => {
    await toggleMilestone(goalId, milestoneId);
    toast.success('Milestone updated! ✓');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-caveat text-4xl text-[#2d2d2d]">Goals</h1>
          <p className="font-kalam text-[#5a5a5a]">Dream big, achieve bigger</p>
        </div>
        <Button 
          className="journal-btn-primary"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="journal-card bg-[#e8f0e9] border-[#8ab896]">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#5a9468]" />
            <div>
              <p className="font-caveat text-3xl">{goalStats.total}</p>
              <p className="font-kalam text-xs text-[#5a5a5a]">Total Goals</p>
            </div>
          </div>
        </div>
        <div className="journal-card">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-[#7a9eb8]" />
            <div>
              <p className="font-caveat text-3xl">{goalStats.active}</p>
              <p className="font-kalam text-xs text-[#5a5a5a]">Active</p>
            </div>
          </div>
        </div>
        <div className="journal-card">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-[#8ab896]" />
            <div>
              <p className="font-caveat text-3xl">{goalStats.completed}</p>
              <p className="font-kalam text-xs text-[#5a5a5a]">Completed</p>
            </div>
          </div>
        </div>
        <div className="journal-card">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#a99bc4]" />
            <div>
              <p className="font-caveat text-3xl">{goalStats.totalProgress}%</p>
              <p className="font-kalam text-xs text-[#5a5a5a]">Avg Progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as GoalCategory | 'all')}>
          <SelectTrigger className="journal-input w-40">
            <Flag className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as GoalStatus | 'all')}>
          <SelectTrigger className="journal-input w-36">
            <Sparkles className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Goals Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onCompleteMilestone={(milestoneId) => handleCompleteMilestone(goal.id, milestoneId)}
              onEdit={() => setEditingGoal(goal)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredGoals.length === 0 && (
        <div className="text-center py-16">
          <Target className="w-16 h-16 mx-auto text-[#c0c0c0] mb-4" />
          <p className="font-kalam text-[#5a5a5a]">No goals found</p>
          <Button 
            variant="outline" 
            className="journal-btn mt-4" 
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create your first goal
          </Button>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="journal-modal max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-caveat text-2xl">Create New Goal</DialogTitle>
          </DialogHeader>
          <GoalForm onSubmit={handleAddGoal} onCancel={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
        <DialogContent className="journal-modal max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-caveat text-2xl">Edit Goal</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <GoalForm 
              onSubmit={handleEditGoal} 
              onCancel={() => setEditingGoal(null)} 
              initialData={editingGoal}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
