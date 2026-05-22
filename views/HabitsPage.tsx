"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Plus, Flame, Calendar, TrendingUp, MoreHorizontal,
  Trash2, Edit2, CheckCircle2, Droplets, BookOpen,
  Dumbbell, Ban, PenLine, Heart, Sun, Moon, Music, Coffee,
  X, History, Loader2, GlassWater, Footprints, Timer, BookMarked,
  LayoutGrid, List, Columns, Search, Filter, SlidersHorizontal
} from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Habit, LifeArea, HabitFrequency, HabitType } from '@/types';
import { lifeAreas } from '@/data/mockData';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';
import { toast } from 'sonner';

// ===== CONFIG =====

const habitIcons = [
  { value: 'Flame', icon: Flame },
  { value: 'Droplets', icon: Droplets },
  { value: 'BookOpen', icon: BookOpen },
  { value: 'Dumbbell', icon: Dumbbell },
  { value: 'Ban', icon: Ban },
  { value: 'PenLine', icon: PenLine },
  { value: 'Heart', icon: Heart },
  { value: 'Sun', icon: Sun },
  { value: 'Moon', icon: Moon },
  { value: 'Music', icon: Music },
  { value: 'Coffee', icon: Coffee },
  { value: 'GlassWater', icon: GlassWater },
  { value: 'Footprints', icon: Footprints },
  { value: 'Timer', icon: Timer },
];

const habitColors = [
  { value: '#7a9eb8', name: 'Blue' },
  { value: '#d49191', name: 'Red' },
  { value: '#8ab896', name: 'Green' },
  { value: '#d9b896', name: 'Orange' },
  { value: '#a99bc4', name: 'Purple' },
  { value: '#d9a8c4', name: 'Pink' },
  { value: '#7db8a8', name: 'Teal' },
  { value: '#8a8a8a', name: 'Slate' },
];

const unitPresets = [
  { value: 'glass', label: '🥛 Glass', icon: '🥛' },
  { value: 'bottle', label: '🍶 Bottle', icon: '🍶' },
  { value: 'litre', label: '💧 Litre', icon: '💧' },
  { value: 'step', label: '👣 Steps', icon: '👣' },
  { value: 'page', label: '📖 Pages', icon: '📖' },
  { value: 'minute', label: '⏱ Minutes', icon: '⏱' },
  { value: 'km', label: '🏃 Kilometers', icon: '🏃' },
  { value: 'rep', label: '💪 Reps', icon: '💪' },
  { value: 'set', label: '🔄 Sets', icon: '🔄' },
  { value: 'calorie', label: '🔥 Calories', icon: '🔥' },
  { value: 'custom', label: '✏️ Custom', icon: '✏️' },
];

// ===== HABIT FORM =====

function HabitForm({ onSubmit, onCancel, initialData }: { 
  onSubmit: (habit: Partial<Habit>) => void; 
  onCancel: () => void;
  initialData?: Habit;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [lifeArea, setLifeArea] = useState<LifeArea>(initialData?.lifeArea || 'health');
  const [frequency, setFrequency] = useState<HabitFrequency>(initialData?.frequency || 'daily');
  const [targetDays, setTargetDays] = useState(initialData?.targetDays || 7);
  const [icon, setIcon] = useState(initialData?.icon || 'Flame');
  const [color, setColor] = useState(initialData?.color || '#7a9eb8');
  const [reminderTime, setReminderTime] = useState(initialData?.reminderTime || '');
  
  // Quantifiable fields
  const [habitType, setHabitType] = useState<HabitType>(initialData?.habitType || 'boolean');
  const [targetValue, setTargetValue] = useState(initialData?.targetValue || 10);
  const [unit, setUnit] = useState(initialData?.unit || 'glass');
  const [customUnit, setCustomUnit] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a habit title');
      return;
    }
    const finalUnit = unit === 'custom' ? customUnit : unit;
    onSubmit({
      title,
      description,
      lifeArea,
      frequency,
      targetDays,
      icon,
      color,
      reminderTime: reminderTime || undefined,
      habitType,
      targetValue: habitType === 'quantifiable' ? targetValue : undefined,
      unit: habitType === 'quantifiable' ? finalUnit : undefined,
      unitIcon: habitType === 'quantifiable' ? unit : undefined,
    } as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pr-2 max-h-[75vh] overflow-y-auto no-scrollbar">
      <div>
        <label className="font-kalam text-sm mb-1 block">Habit Name</label>
        <Input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="What habit do you want to build?"
          className="journal-input"
        />
      </div>
      
      <div>
        <label className="font-kalam text-sm mb-1 block">Description</label>
        <Input 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Add details..."
          className="journal-input"
        />
      </div>

      {/* Habit Type Toggle */}
      <div>
        <label className="font-kalam text-sm mb-2 block">Habit Type</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setHabitType('boolean')}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              habitType === 'boolean' 
                ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white shadow-md' 
                : 'border-[#e0e0e0] bg-[#fefdfb] hover:border-[#8a8a8a]'
            }`}
          >
            <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
            <p className="font-kalam text-sm font-bold">Yes / No</p>
            <p className="font-kalam text-xs opacity-70">Simple daily check</p>
          </button>
          <button
            type="button"
            onClick={() => setHabitType('quantifiable')}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              habitType === 'quantifiable' 
                ? 'border-[#7a9eb8] bg-[#e8eef3] text-[#5a7a94] shadow-md' 
                : 'border-[#e0e0e0] bg-[#fefdfb] hover:border-[#8a8a8a]'
            }`}
          >
            <GlassWater className="w-6 h-6 mx-auto mb-1" />
            <p className="font-kalam text-sm font-bold">Measurable</p>
            <p className="font-kalam text-xs opacity-70">Track units / progress</p>
          </button>
        </div>
      </div>

      {/* Quantifiable Settings */}
      {habitType === 'quantifiable' && (
        <div className="space-y-3 p-4 bg-[#e8eef3] border-2 border-[#7a9eb8] rounded-xl">
          <p className="font-kalam text-sm font-bold text-[#5a7a94]">📊 Target Settings</p>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-kalam text-xs mb-1 block text-[#5a7a94]">Daily Target</label>
              <Input 
                type="number"
                min={1}
                max={1000}
                value={targetValue} 
                onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                className="journal-input border-[#7a9eb8]"
              />
            </div>
            <div>
              <label className="font-kalam text-xs mb-1 block text-[#5a7a94]">Unit</label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="journal-input border-[#7a9eb8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  {unitPresets.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {unit === 'custom' && (
            <div>
              <label className="font-kalam text-xs mb-1 block text-[#5a7a94]">Custom Unit Name</label>
              <Input 
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="e.g., pushups, laps..."
                className="journal-input border-[#7a9eb8]"
              />
            </div>
          )}

          <p className="font-kalam text-xs text-[#5a7a94] italic">
            Example: Drink {targetValue} {unit === 'custom' ? (customUnit || 'units') : unit}{targetValue > 1 ? 's' : ''} per day
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
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
          <Select value={frequency} onValueChange={(v) => setFrequency(v as HabitFrequency)}>
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
        <label className="font-kalam text-sm mb-1 block">Target Days per {frequency === 'daily' ? 'Week' : frequency === 'weekly' ? 'Month' : 'Year'}</label>
        <Input 
          type="number" 
          min={1} 
          max={frequency === 'daily' ? 7 : frequency === 'weekly' ? 4 : 12}
          value={targetDays} 
          onChange={(e) => setTargetDays(parseInt(e.target.value))}
          className="journal-input"
        />
      </div>

      <div>
        <label className="font-kalam text-sm mb-1 block">Reminder Time (optional)</label>
        <Input 
          type="time" 
          value={reminderTime} 
          onChange={(e) => setReminderTime(e.target.value)}
          className="journal-input"
        />
      </div>

      <div>
        <label className="font-kalam text-sm mb-2 block">Icon</label>
        <div className="flex flex-wrap gap-2">
          {habitIcons.map(({ value: iconVal, icon: IconComp }) => (
            <button
              key={iconVal}
              type="button"
              onClick={() => setIcon(iconVal)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all ${
                icon === iconVal 
                  ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white scale-110' 
                  : 'border-[#e0e0e0] hover:border-[#8a8a8a]'
              }`}
            >
              <IconComp className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="font-kalam text-sm mb-2 block">Color</label>
        <div className="flex flex-wrap gap-2">
          {habitColors.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                color === c.value ? 'scale-125 border-[#2d2d2d] shadow-md' : 'border-transparent'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 journal-btn-primary">
          {initialData ? 'Update Habit' : 'Create Habit'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="journal-btn">
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ===== GLASS FILL VISUALIZATION =====

function GlassProgress({ 
  current, target, color, unit, onAdd, onRemove 
}: { 
  current: number; target: number; color: string; unit: string;
  onAdd: () => void; onRemove: () => void;
}) {
  const unitEmoji = unitPresets.find(u => u.value === unit)?.icon || '🔘';
  const pct = Math.min((current / target) * 100, 100);
  const isFull = current >= target;

  return (
    <div className="space-y-3">
      {/* Glass Icons Row */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {Array.from({ length: target }).map((_, i) => {
          const filled = i < current;
          return (
            <motion.button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); filled ? onRemove() : onAdd(); }}
              initial={false}
              animate={{ 
                scale: filled ? [1, 1.2, 1] : 1,
                opacity: filled ? 1 : 0.4,
              }}
              transition={{ duration: 0.3 }}
              className={`text-lg cursor-pointer select-none transition-all ${
                filled ? 'drop-shadow-md' : 'grayscale'
              }`}
              title={filled ? 'Click to remove' : 'Click to add'}
            >
              {unitEmoji}
            </motion.button>
          );
        })}
      </div>
      
      {/* Animated Progress Bar */}
      <div className="relative h-3 bg-[#e8e4dc] rounded-full overflow-hidden border border-[#c0c0c0]">
        <motion.div 
          className="h-full rounded-full relative"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {isFull && (
            <motion.div
              className="absolute inset-0 bg-white/30"
              animate={{ opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>

      <div className="flex justify-between items-center">
        <p className="font-kalam text-xs text-[#5a5a5a]">
          {current}/{target} {unit}{target > 1 ? 's' : ''}
        </p>
        {isFull && (
          <motion.span 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xs font-kalam text-[#5a9468] font-bold flex items-center gap-1"
          >
            ✨ Target reached!
          </motion.span>
        )}
      </div>
    </div>
  );
}

// ===== BOTTLE FILL VISUALIZATION ===== 

function BottleProgress({ 
  current, target, color, onAdd
}: { 
  current: number; target: number; color: string; onAdd: () => void;
}) {
  const pct = Math.min((current / target) * 100, 100);
  
  return (
    <div className="flex items-end justify-center gap-2 py-2">
      {/* SVG Bottle */}
      <button 
        className="relative w-12 h-24 hover:scale-105 active:scale-95 transition-transform cursor-pointer focus:outline-none"
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        title="Click to add"
      >
        {/* Bottle outline */}
        <svg viewBox="0 0 48 96" className="w-full h-full drop-shadow-sm">
          {/* Bottle neck */}
          <rect x="16" y="0" width="16" height="16" rx="3" fill="none" stroke="#8a8a8a" strokeWidth="2" />
          {/* Bottle body */}
          <path d="M12 16 Q12 24 8 32 L8 88 Q8 92 12 92 L36 92 Q40 92 40 88 L40 32 Q36 24 36 16" fill="none" stroke="#8a8a8a" strokeWidth="2" />
          {/* Water fill */}
          <defs>
            <clipPath id="bottleClip">
              <path d="M12 16 Q12 24 8 32 L8 88 Q8 92 12 92 L36 92 Q40 92 40 88 L40 32 Q36 24 36 16" />
            </clipPath>
          </defs>
          <motion.rect 
            x="8" 
            width="32" 
            rx="2"
            fill={`${color}cc`}
            clipPath="url(#bottleClip)"
            initial={{ y: 92, height: 0 }}
            animate={{ 
              y: 92 - (76 * pct / 100), 
              height: 76 * pct / 100 
            }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          {/* Wave effect on top of water */}
          {pct > 0 && pct < 100 && (
            <motion.ellipse
              cx="24"
              rx="14"
              ry="2"
              fill={`${color}44`}
              clipPath="url(#bottleClip)"
              animate={{ 
                cy: [92 - (76 * pct / 100), 92 - (76 * pct / 100) - 2, 92 - (76 * pct / 100)],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </svg>
      </button>
      <div className="text-center">
        <p className="font-caveat text-2xl font-bold" style={{ color }}>{Math.round(pct)}%</p>
        <p className="font-kalam text-xs text-[#5a5a5a]">{current}/{target}</p>
      </div>
    </div>
  );
}

// ===== HEATMAP =====

function HabitHeatmap({ habit }: { habit: Habit }) {
  const today = new Date();
  const weeks = 7;
  const daysPerWeek = 7;
  
  return (
    <div className="flex gap-1">
      {Array.from({ length: weeks }).map((_, weekIdx) => (
        <div key={weekIdx} className="flex flex-col gap-1">
          {Array.from({ length: daysPerWeek }).map((_, dayIdx) => {
            const daysAgo = (weeks - 1 - weekIdx) * daysPerWeek + (daysPerWeek - 1 - dayIdx);
            const cellDate = subDays(today, daysAgo);
            
            let completed = false;
            if (habit.habitType === 'quantifiable' && habit.targetValue) {
              const dayCheckins = habit.checkins?.filter(c => isSameDay(new Date(c.date), cellDate)) || [];
              const dayTotal = dayCheckins.reduce((sum, c) => sum + (c.value || 1), 0);
              completed = dayTotal >= habit.targetValue;
            } else {
              completed = habit.checkins?.some(c => isSameDay(new Date(c.date), cellDate)) || false;
            }
            
            return (
              <div
                key={dayIdx}
                className="w-4 h-4 rounded-sm border transition-colors"
                style={{
                  backgroundColor: completed ? habit.color : '#f0ede6',
                  borderColor: completed ? habit.color : '#e0ddd6',
                  opacity: completed ? 1 : 0.5,
                }}
                title={`${format(cellDate, 'MMM d')} — ${completed ? 'Done ✓' : 'Missed'}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ===== HABIT DETAILS MODAL =====

function HabitDetailsModal({ habit, isOpen, onClose, onEdit, onDelete }: {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="journal-modal max-w-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
        <DialogHeader>
          <DialogTitle className="font-caveat text-2xl flex items-center gap-2">
            {habit.title}
            {habit.habitType === 'quantifiable' && (
              <Badge className="text-xs bg-[#e8eef3] text-[#5a7a94] border-[#7a9eb8]">
                📊 {habit.targetValue} {habit.unit}s/day
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-[#f9f7f4] rounded-lg border border-[#e0e0e0] text-center">
              <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <p className="font-caveat text-2xl font-bold">{habit.streak}</p>
              <p className="font-kalam text-xs text-slate-500">Current Streak</p>
            </div>
            <div className="p-4 bg-[#f9f7f4] rounded-lg border border-[#e0e0e0] text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <p className="font-caveat text-2xl font-bold">{habit.longestStreak}</p>
              <p className="font-kalam text-xs text-slate-500">Best Streak</p>
            </div>
            <div className="p-4 bg-[#f9f7f4] rounded-lg border border-[#e0e0e0] text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="font-caveat text-2xl font-bold">{habit.checkins?.length || 0}</p>
              <p className="font-kalam text-xs text-slate-500">Total Check-ins</p>
            </div>
          </div>

          <div>
            <h3 className="font-caveat text-xl mb-3">Consistency (Last 7 Weeks)</h3>
            <div className="flex justify-center p-4 bg-[#f9f7f4] rounded-xl border border-[#e0e0e0]">
              <HabitHeatmap habit={habit} />
            </div>
          </div>

          <div>
            <h3 className="font-caveat text-xl mb-3 flex items-center gap-2">
              <History className="w-5 h-5" />
              History & Notes
            </h3>
            <div className="space-y-3 relative max-h-48 overflow-y-auto no-scrollbar">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-[#e0e0e0] border-l-2 border-dashed border-[#c0c0c0]" />
              {habit.checkins && habit.checkins.length > 0 ? (
                [...habit.checkins].slice(0, 20).map((checkin) => (
                  <div key={checkin.id} className="relative pl-10">
                    <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-white border-2 border-[#2d2d2d] z-10" />
                    <div className="p-3 bg-[#fff] rounded-lg border border-[#e0e0e0] shadow-sm">
                      <p className="font-kalam text-xs text-slate-400 mb-1">
                        {format(new Date(checkin.date), 'MMM d, yyyy')}
                        {habit.habitType === 'quantifiable' && ` — ${checkin.value || 1} ${habit.unit}`}
                      </p>
                      {checkin.note && <p className="font-kalam text-slate-700 italic">"{checkin.note}"</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="pl-10 font-kalam text-slate-500">No notes recorded yet.</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onEdit} className="journal-btn flex-1">
              <Edit2 className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button onClick={onDelete} className="journal-btn-red">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HabitCard({ 
  habit, 
  viewMode: pageViewMode,
  onComplete, 
  onAddUnit,
  onRemoveUnit,
  onClick 
}: { 
  habit: Habit; 
  viewMode: 'masonry' | 'grid' | 'list';
  onComplete: () => void;
  onAddUnit: () => void;
  onRemoveUnit: () => void;
  onClick: () => void;
}) {
  const Icon = habitIcons.find(i => i.value === habit.icon)?.icon || Flame;
  const today = new Date();
  const [progressView, setProgressView] = useState<'glass' | 'bottle' | 'bar'>('glass');

  const todayCheckins = useMemo(() => {
    return habit.checkins?.filter(c => isSameDay(new Date(c.date), today)) || [];
  }, [habit.checkins, today]);

  const todayTotal = useMemo(() => {
    return todayCheckins.reduce((sum, c) => sum + (c.value || 1), 0);
  }, [todayCheckins]);

  const isCompletedToday = habit.habitType === 'quantifiable' 
    ? todayTotal >= (habit.targetValue || 1) 
    : todayCheckins.length > 0;

  // ===== LIST VIEW =====
  if (pageViewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
      >
        <div 
          onClick={onClick}
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md group ${
            isCompletedToday 
              ? 'bg-[#e8f0e9] border-[#8ab896]/40' 
              : 'bg-[#fefdfb] border-[#e8dac0] hover:border-[#d9b896]'
          }`}
        >
          {/* Left color bar */}
          <div className="w-1.5 h-12 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
          
          {/* Icon */}
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-[#e0e0e0]"
            style={{ backgroundColor: `${habit.color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: habit.color }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-caveat text-lg font-bold leading-tight ${isCompletedToday ? 'line-through text-[#8a8a8a]' : 'text-[#2d2d2d]'}`}>
              {habit.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-kalam text-xs text-[#8a8a8a]">{habit.frequency}</span>
              {habit.habitType === 'quantifiable' && (
                <span className="font-kalam text-xs text-[#5a7a94]">
                  {todayTotal}/{habit.targetValue} {habit.unit}s
                </span>
              )}
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Flame className="w-4 h-4 text-[#d9b896]" />
            <span className="font-caveat text-lg font-bold">{habit.streak}</span>
          </div>

          {/* Mini heatmap (7 days) */}
          <div className="hidden sm:flex gap-0.5 shrink-0">
            {Array.from({ length: 7 }).map((_, i) => {
              const cellDate = subDays(today, 6 - i);
              const completed = habit.checkins?.some(c => isSameDay(new Date(c.date), cellDate)) || false;
              return (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor: completed ? habit.color : '#f0ede6',
                    opacity: completed ? 1 : 0.4,
                  }}
                />
              );
            })}
          </div>

          {/* Action button */}
          {habit.habitType !== 'quantifiable' ? (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 border-2 ${
                isCompletedToday
                  ? 'bg-gradient-to-br from-[#8ab896] to-[#5a9468] text-white border-transparent'
                  : 'bg-white border-dashed border-slate-300 text-slate-300 hover:border-solid hover:border-[#8ab896] hover:text-[#8ab896]'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onAddUnit(); }}
              className="journal-btn-primary text-xs py-1.5 px-3 shrink-0"
            >
              +1
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // ===== MASONRY / GRID VIEW =====
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
    >
      <div 
        onClick={onClick}
        className={`journal-card group cursor-pointer relative overflow-hidden transition-all hover:shadow-xl ${
          isCompletedToday ? 'bg-[#e8f0e9]' : ''
        }`}
        style={{ borderColor: habit.color }}
      >
        <div className="absolute top-0 left-0 w-2 h-full transition-opacity opacity-70" style={{ backgroundColor: habit.color }} />
        
        <CardContent className="p-5 pl-7">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-[#e0e0e0]"
                style={{ backgroundColor: `${habit.color}15` }}
              >
                <Icon className="w-6 h-6" style={{ color: habit.color }} />
              </div>
              <div>
                <h3 className={`font-caveat text-xl font-bold leading-none mb-1 transition-all ${isCompletedToday ? 'scratch-out text-[#8a8a8a]' : 'text-[#2d2d2d]'}`}>
                  {habit.title}
                </h3>
                <p className="font-kalam text-xs text-slate-500 max-w-[200px] truncate">{habit.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="outline" className="text-[10px] h-5 bg-white/50" style={{ borderColor: habit.color, color: habit.color }}>
                    🔥 {habit.streak} day streak
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {habit.frequency}
                  </Badge>
                  {habit.habitType === 'quantifiable' && (
                    <Badge className="text-[10px] h-5 bg-[#e8eef3] text-[#5a7a94] border border-[#7a9eb8]">
                      📊 {habit.targetValue} {habit.unit}s
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Boolean toggle button */}
            {habit.habitType !== 'quantifiable' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm border-2 ${
                  isCompletedToday
                    ? 'bg-gradient-to-br from-[#8ab896] to-[#5a9468] text-white border-transparent scale-105'
                    : 'bg-white border-dashed border-slate-300 text-slate-300 hover:border-solid hover:border-[#8ab896] hover:text-[#8ab896] hover:scale-110 hover:shadow-md'
                }`}
              >
                <CheckCircle2 className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Mini Heatmap for masonry view */}
          {pageViewMode === 'masonry' && (
            <div className="mb-3 flex justify-center p-2 bg-[#f9f7f4] rounded-lg border border-[#e0e0e0]">
              <HabitHeatmap habit={habit} />
            </div>
          )}

          {/* Quantifiable Progress */}
          {habit.habitType === 'quantifiable' && habit.targetValue && (
            <div onClick={(e) => e.stopPropagation()}>
              {/* View Toggle */}
              <div className="flex justify-end gap-1 mb-2">
                {(['glass', 'bottle', 'bar'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setProgressView(mode)}
                    className={`px-2 py-0.5 rounded text-[10px] font-kalam border transition-all ${
                      progressView === mode 
                        ? 'bg-[#2d2d2d] text-white border-[#2d2d2d]' 
                        : 'bg-white border-[#e0e0e0] text-[#8a8a8a] hover:border-[#2d2d2d]'
                    }`}
                  >
                    {mode === 'glass' ? '☐' : mode === 'bottle' ? '🍶' : '━'}
                  </button>
                ))}
              </div>

              {progressView === 'glass' && (
                <GlassProgress 
                  current={todayTotal}
                  target={habit.targetValue}
                  color={habit.color}
                  unit={habit.unit || 'unit'}
                  onAdd={onAddUnit}
                  onRemove={onRemoveUnit}
                />
              )}
              
              {progressView === 'bottle' && (
                <BottleProgress 
                  current={todayTotal}
                  target={habit.targetValue}
                  color={habit.color}
                  onAdd={onAddUnit}
                />
              )}

              {progressView === 'bar' && (
                <div className="space-y-2">
                  <div className="relative h-6 bg-[#e8e4dc] rounded-full overflow-hidden border border-[#c0c0c0]">
                    <motion.div 
                      className="h-full rounded-full flex items-center justify-end pr-2"
                      style={{ background: `linear-gradient(90deg, ${habit.color}88, ${habit.color})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((todayTotal / habit.targetValue) * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    >
                      {todayTotal > 0 && (
                        <span className="text-[10px] text-white font-bold">{todayTotal}/{habit.targetValue}</span>
                      )}
                    </motion.div>
                  </div>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={onRemoveUnit}
                      disabled={todayTotal <= 0}
                      className="journal-btn text-xs py-1 px-3 disabled:opacity-30"
                    >
                      −
                    </button>
                    <button
                      onClick={onAddUnit}
                      className="journal-btn-primary text-xs py-1 px-3"
                    >
                      +1 {habit.unit}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </motion.div>
  );
}

// ===== MAIN PAGE =====

export function HabitsPage() {
  const { habits, isLoading, fetchHabits, addHabit, updateHabit, deleteHabit, toggleCheckin, removeCheckin } = useHabits();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [viewMode, setViewMode] = useState<'masonry' | 'grid' | 'list'>('masonry');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'streak' | 'name' | 'recent'>('streak');

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const habitStats = {
    total: habits.length,
    activeStreaks: habits.filter((h: Habit) => h.streak > 0).length,
    totalCompletions: habits.reduce((sum: number, h: Habit) => sum + (h.checkins?.length || 0), 0),
    bestStreak: habits.length > 0 ? Math.max(...habits.map((h: Habit) => h.longestStreak)) : 0,
  };

  const filteredHabits = useMemo(() => {
    let result = [...habits];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(h => h.title.toLowerCase().includes(q) || h.description?.toLowerCase().includes(q));
    }
    if (filterArea !== 'all') {
      result = result.filter(h => h.lifeArea === filterArea);
    }
    if (sortBy === 'streak') result.sort((a, b) => b.streak - a.streak);
    else if (sortBy === 'name') result.sort((a, b) => a.title.localeCompare(b.title));
    else result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return result;
  }, [habits, searchQuery, filterArea, sortBy]);

  const handleAddHabit = (habitData: Partial<Habit>) => {
    addHabit(habitData as any);
    setIsAddDialogOpen(false);
    toast.success('Habit created! Let\'s build consistency! 💪');
  };

  const handleEditHabit = (habitData: Partial<Habit>) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, habitData);
      setEditingHabit(null);
      toast.success('Habit updated!');
    }
  };

  const handleDelete = (id: string) => {
    deleteHabit(id);
    toast.success('Habit deleted');
  };

  const viewModes = [
    { mode: 'masonry' as const, icon: Columns, label: 'Masonry' },
    { mode: 'grid' as const, icon: LayoutGrid, label: 'Grid' },
    { mode: 'list' as const, icon: List, label: 'List' },
  ];

  const gridClassName = viewMode === 'masonry'
    ? 'columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5 [&>*]:break-inside-avoid'
    : viewMode === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
    : 'flex flex-col gap-4 max-w-3xl mx-auto';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-caveat text-4xl font-bold text-[#2d2d2d]">Habits & Rituals</h1>
          <p className="font-kalam text-slate-500 text-lg">Build lasting habits with streaks and visual tracking</p>
        </div>
        <Button 
          className="journal-btn-primary"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Habit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="journal-card bg-[#fef9e6] border-[#e0d4a0]">
          <CardContent className="p-4">
            <Sparkles className="w-8 h-8 mb-2 text-[#d9b896]" />
            <p className="text-3xl font-bold font-caveat text-[#2d2d2d]">{habitStats.total}</p>
            <p className="text-sm text-[#5a5a5a] font-kalam">Total Habits</p>
          </CardContent>
        </Card>
        <Card className="journal-card">
          <CardContent className="p-4">
            <Flame className="w-8 h-8 mb-2 text-[#d9b896]" />
            <p className="text-3xl font-bold font-caveat text-[#2d2d2d]">{habitStats.activeStreaks}</p>
            <p className="text-sm text-[#5a5a5a] font-kalam">Active Streaks</p>
          </CardContent>
        </Card>
        <Card className="journal-card">
          <CardContent className="p-4">
            <CheckCircle2 className="w-8 h-8 mb-2 text-[#8ab896]" />
            <p className="text-3xl font-bold font-caveat text-[#2d2d2d]">{habitStats.totalCompletions}</p>
            <p className="text-sm text-[#5a5a5a] font-kalam">Total Check-ins</p>
          </CardContent>
        </Card>
        <Card className="journal-card">
          <CardContent className="p-4">
            <TrendingUp className="w-8 h-8 mb-2 text-[#a99bc4]" />
            <p className="text-3xl font-bold font-caveat text-[#2d2d2d]">{habitStats.bestStreak}</p>
            <p className="text-sm text-[#5a5a5a] font-kalam">Best Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar: Search, Filter, Sort, View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center gap-3 p-4 bg-[#fefdfb] rounded-xl border-2 border-[#e8dac0] shadow-sm"
      >
        {/* Search */}
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a8a]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search habits..."
            className="journal-input pl-9 w-full"
          />
        </div>

        {/* Filter by Life Area */}
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="journal-input w-full md:w-44">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-[#8a8a8a]" />
            <SelectValue placeholder="All Areas" />
          </SelectTrigger>
          <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
            <SelectItem value="all">All Areas</SelectItem>
            {lifeAreas.map(area => (
              <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="journal-input w-full md:w-40">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-[#8a8a8a]" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
            <SelectItem value="streak">🔥 Streak</SelectItem>
            <SelectItem value="name">🔤 Name</SelectItem>
            <SelectItem value="recent">🕐 Recent</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex gap-1 p-1 bg-[#f0ede6] rounded-lg border border-[#e0ddd6]">
          {viewModes.map(({ mode, icon: ModeIcon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-2 rounded-md transition-all ${
                viewMode === mode
                  ? 'bg-[#2d2d2d] text-white shadow-sm'
                  : 'text-[#8a8a8a] hover:text-[#2d2d2d] hover:bg-white/60'
              }`}
              title={label}
            >
              <ModeIcon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Habits Grid / Masonry / List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : filteredHabits.length === 0 && habits.length > 0 ? (
        <div className="text-center py-16 bg-[#f9f7f4] rounded-2xl border-2 border-dashed border-[#e0e0e0] mx-auto max-w-2xl">
          <Search className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="font-caveat text-2xl text-slate-500 mb-2">No habits match your search</p>
          <p className="font-kalam text-slate-400">Try adjusting your filters or search query.</p>
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16 bg-[#f9f7f4] rounded-2xl border-2 border-dashed border-[#e0e0e0] mx-auto max-w-2xl">
          <Sparkles className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="font-caveat text-2xl text-slate-500 mb-2">No habits yet</p>
          <p className="font-kalam text-slate-400 mb-6">Start small, build consistency, and watch your life change.</p>
          <Button 
            className="journal-btn-primary" 
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create your first habit
          </Button>
        </div>
      ) : (
        <div className={gridClassName}>
          <AnimatePresence mode="popLayout">
            {filteredHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                viewMode={viewMode}
                onComplete={() => {
                  toggleCheckin(habit.id, new Date(), "");
                  const isCheckingIn = !habit.checkins?.some(c => isSameDay(new Date(c.date), new Date()));
                  toast.success(isCheckingIn ? 'Habit checked-in! 🔥' : 'Habit un-checked.');
                }}
                onAddUnit={() => {
                  toggleCheckin(habit.id, new Date(), "", 1);
                  toast.success(`+1 ${habit.unit}!`);
                }}
                onRemoveUnit={() => {
                  const todayCheckins = habit.checkins?.filter(c => isSameDay(new Date(c.date), new Date())) || [];
                  if (todayCheckins.length > 0) {
                    const lastCheckin = todayCheckins[todayCheckins.length - 1];
                    removeCheckin(habit.id, lastCheckin.id);
                    toast.success(`-1 ${habit.unit}`);
                  }
                }}
                onClick={() => setSelectedHabit(habit)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="journal-modal max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-caveat text-2xl">Create New Habit</DialogTitle>
          </DialogHeader>
          <HabitForm onSubmit={handleAddHabit} onCancel={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingHabit} onOpenChange={() => setEditingHabit(null)}>
        <DialogContent className="journal-modal max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-caveat text-2xl">Edit Habit</DialogTitle>
          </DialogHeader>
          {editingHabit && (
            <HabitForm 
              onSubmit={handleEditHabit} 
              onCancel={() => setEditingHabit(null)} 
              initialData={editingHabit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Details/History Modal */}
      {selectedHabit && (
        <HabitDetailsModal 
          habit={selectedHabit}
          isOpen={!!selectedHabit}
          onClose={() => setSelectedHabit(null)}
          onEdit={() => {
            setEditingHabit(selectedHabit);
            setSelectedHabit(null);
          }}
          onDelete={() => {
            handleDelete(selectedHabit.id);
            setSelectedHabit(null);
          }}
        />
      )}
    </div>
  );
}
