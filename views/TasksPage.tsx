"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, Plus, Filter, Search, Calendar, Clock,
  Flame, Zap, TrendingUp, MoreHorizontal, Trash2, Edit2,
  ArrowUpDown, Flag, LayoutGrid, List, Columns3, Target,
  Timer, Play, Pause, RotateCcw, Brain, Sparkles,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Circle, Square, X, Coffee, Lightbulb, Briefcase, Home,
  Phone, Laptop, ShoppingBag, BarChart3, ArrowRight,
  Focus, Repeat, TrendingDown, Award, Send
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { Task, LifeArea, TaskStatus, TaskPriority } from '@/types';
import { lifeAreas } from '@/data/mockData';
import { format, isToday, isTomorrow, isPast, differenceInDays, startOfDay } from 'date-fns';
import { toast } from 'sonner';

// ═══════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════
const priorityConfig: Record<TaskPriority, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  urgent: { color: 'text-red-600', bg: 'bg-red-100', icon: Flame, label: 'Urgent' },
  high: { color: 'text-orange-600', bg: 'bg-orange-100', icon: TrendingUp, label: 'High' },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Zap, label: 'Medium' },
  low: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckSquare, label: 'Low' },
};

type ViewMode = 'list' | 'kanban' | 'matrix';

const energyLevels = [
  { id: 'deep', label: 'Deep Focus', icon: Brain, color: '#7c3aed' },
  { id: 'normal', label: 'Normal', icon: Briefcase, color: '#3b82f6' },
  { id: 'low', label: 'Low Energy', icon: Coffee, color: '#f59e0b' },
  { id: 'creative', label: 'Creative', icon: Lightbulb, color: '#ec4899' },
];

const contexts = [
  { id: '@computer', label: '@computer', icon: Laptop },
  { id: '@phone', label: '@phone', icon: Phone },
  { id: '@errands', label: '@errands', icon: ShoppingBag },
  { id: '@home', label: '@home', icon: Home },
  { id: '@office', label: '@office', icon: Briefcase },
];

function getPriority(score: number): TaskPriority {
  if (score >= 8) return 'urgent';
  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

// ═══════════════════════════════════════════
// SUBTASK TYPE (client-side only)
// ═══════════════════════════════════════════
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

// ═══════════════════════════════════════════
// JARVIS NOTE (reusable)
// ═══════════════════════════════════════════
function JarvisNote({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
      className="relative bg-[#fef9e6] border-2 border-[#e8dac0] rounded-xl p-4 flex gap-3 hover:shadow-md transition-all"
      style={{ transform: 'rotate(-0.3deg)' }}>
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-12 h-4 bg-[#e2e8f0] opacity-70 rounded-sm" />
      <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-kalam text-xs font-bold text-amber-700 uppercase tracking-wide mb-0.5">JARVIS Task Intelligence</p>
        <p className="font-kalam text-sm text-[#2d2d2d] leading-relaxed">{children}</p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// QUICK ADD BAR (inline task creation)
// ═══════════════════════════════════════════
function QuickAddBar({ onAdd }: { onAdd: (taskData: Partial<Task>) => void }) {
  const [title, setTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [lifeArea, setLifeArea] = useState<LifeArea>('career');
  const [dueToday, setDueToday] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      lifeArea,
      impact: 5,
      urgency: dueToday ? 8 : 5,
      effort: 5,
      status: 'todo',
      dueDate: dueToday ? new Date() : undefined,
      isRecurring: false,
      tags: [],
      sharedWithPartner: false,
    });
    setTitle('');
    setIsExpanded(false);
    setDueToday(false);
  };

  return (
    <div className="bg-white border-2 border-dashed border-[#e8dac0] rounded-xl p-3 hover:border-[#d4a574] transition-all group">
      <div className="flex items-center gap-3">
        <Plus className="w-5 h-5 text-[#d4a574] flex-shrink-0" />
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') { setIsExpanded(false); setTitle(''); } }}
          placeholder="Quick add a task... (press Enter)"
          className="flex-1 bg-transparent outline-none font-kalam text-[#2d2d2d] placeholder:text-slate-400"
        />
        {title.trim() && (
          <button onClick={handleSubmit} className="px-3 py-1.5 bg-[#2d2d2d] text-white rounded-lg text-xs font-kalam font-bold flex items-center gap-1 hover:bg-[#1a1a1a] transition-all">
            <Send className="w-3 h-3" /> Add
          </button>
        )}
      </div>
      <AnimatePresence>
        {isExpanded && title.trim() && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f0ebe3]">
              <Select value={lifeArea} onValueChange={v => setLifeArea(v as LifeArea)}>
                <SelectTrigger className="h-7 w-28 text-[11px] font-kalam border-[#e8dac0]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">{lifeAreas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
              <button onClick={() => setDueToday(!dueToday)}
                className={`px-2 py-1 rounded-md text-[11px] font-kalam font-bold border transition-all ${dueToday ? 'bg-red-50 border-red-300 text-red-600' : 'bg-white border-[#e8dac0] text-slate-500 hover:border-slate-400'}`}>
                <Calendar className="w-3 h-3 inline mr-1" />Due Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════
// TODAY'S FOCUS (top 3 tasks)
// ═══════════════════════════════════════════
function TodaysFocus({ tasks, onToggle, onFocus }: { tasks: Task[]; onToggle: (t: Task) => void; onFocus: (t: Task) => void }) {
  const todayTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        // Overdue first, then by priority
        const aOverdue = a.dueDate && isPast(new Date(a.dueDate)) ? 1 : 0;
        const bOverdue = b.dueDate && isPast(new Date(b.dueDate)) ? 1 : 0;
        if (bOverdue !== aOverdue) return bOverdue - aOverdue;
        return b.priorityScore - a.priorityScore;
      })
      .slice(0, 3);
  }, [tasks]);

  if (todayTasks.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-[#fef9e6] to-[#fefdfb] border border-[#e8dac0] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-amber-600" />
        <h3 className="font-caveat text-lg font-bold text-[#2d2d2d]">Today&apos;s Focus</h3>
        <span className="font-kalam text-[11px] text-slate-500 ml-auto">Top {todayTasks.length} priorities</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {todayTasks.map((task, i) => {
          const priority = getPriority(task.priorityScore);
          const isOverdue = task.dueDate && isPast(new Date(task.dueDate));
          return (
            <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
              isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-[#e8dac0]'}`}>
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2d2d2d] text-white font-caveat text-sm font-bold shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="font-kalam text-sm font-bold text-[#2d2d2d] truncate">{task.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge className={`text-[9px] px-1.5 py-0 ${priorityConfig[priority].bg} ${priorityConfig[priority].color}`}>{priority}</Badge>
                  {isOverdue && <span className="text-[9px] font-kalam text-red-500">overdue</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onFocus(task)} className="p-1 hover:bg-red-50 rounded transition-all" title="Focus"><Timer className="w-3.5 h-3.5 text-red-400" /></button>
                <button onClick={() => onToggle(task)} className="p-1 hover:bg-green-50 rounded transition-all" title="Complete"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PRODUCTIVITY ANALYTICS
// ═══════════════════════════════════════════
function ProductivityPanel({ tasks, stats }: { tasks: Task[]; stats: { total: number; completed: number; inProgress: number; todo: number; overdue: number } }) {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // Tasks per life area
  const areaBreakdown = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    tasks.forEach(t => {
      if (!map[t.lifeArea]) map[t.lifeArea] = { total: 0, done: 0 };
      map[t.lifeArea].total++;
      if (t.status === 'completed') map[t.lifeArea].done++;
    });
    return Object.entries(map)
      .map(([area, data]) => ({ area, ...data, pct: data.total > 0 ? Math.round((data.done / data.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [tasks]);

  // Average priority of active tasks
  const avgPriority = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'completed');
    if (active.length === 0) return 0;
    return active.reduce((sum, t) => sum + t.priorityScore, 0) / active.length;
  }, [tasks]);

  // Completed today
  const completedToday = tasks.filter(t => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt))).length;

  return (
    <div className="bg-white border border-[#e8dac0] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4.5 h-4.5 text-[#a99bc4]" />
        <h3 className="font-caveat text-xl font-bold text-[#2d2d2d]">Productivity Pulse</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {/* Completion Ring */}
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-1.5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                stroke={completionRate >= 75 ? '#22c55e' : completionRate >= 40 ? '#f59e0b' : '#ef4444'} strokeWidth="3.5" strokeDasharray={`${completionRate}, 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="font-caveat text-lg font-bold text-[#2d2d2d]">{completionRate}%</span></div>
          </div>
          <p className="font-kalam text-[11px] text-slate-500">Complete</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <p className="font-caveat text-3xl font-bold text-green-600">{completedToday}</p>
          <p className="font-kalam text-[11px] text-slate-500">Done Today</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <p className="font-caveat text-3xl font-bold text-[#2d2d2d]">{avgPriority.toFixed(1)}</p>
          <p className="font-kalam text-[11px] text-slate-500">Avg Priority</p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <p className="font-caveat text-3xl font-bold" style={{ color: stats.overdue > 0 ? '#ef4444' : '#22c55e' }}>{stats.overdue}</p>
          <p className="font-kalam text-[11px] text-slate-500">Overdue</p>
        </div>
      </div>

      {/* Area breakdown */}
      {areaBreakdown.length > 0 && (
        <div className="space-y-2">
          <p className="font-kalam text-xs font-bold text-slate-500 uppercase tracking-wide">By Life Area</p>
          {areaBreakdown.map(a => {
            const area = lifeAreas.find(la => la.id === a.area);
            return (
              <div key={a.area} className="flex items-center gap-3">
                <span className="font-kalam text-xs text-[#2d2d2d] w-20 truncate">{area?.name || a.area}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${a.pct}%`, backgroundColor: area?.color || '#8b5cf6' }} />
                </div>
                <span className="font-kalam text-[11px] text-slate-500 w-16 text-right">{a.done}/{a.total}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// FOCUS TIMER (Pomodoro)
// ═══════════════════════════════════════════
function FocusTimer({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      if (mode === 'work') {
        setSessions(s => s + 1);
        toast.success('Pomodoro complete! Take a break 🎉');
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        toast.success('Break over! Ready for another round?');
        setMode('work');
        setTimeLeft(25 * 60);
      }
      setIsRunning(false);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft, mode]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progress = mode === 'work' ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  if (!task) return null;

  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      className="fixed bottom-6 right-6 z-50 bg-white border-2 border-[#2d2d2d] rounded-2xl shadow-[4px_4px_0px_#2d2d2d] p-5 w-72">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-caveat text-lg font-bold text-[#2d2d2d]">
          {mode === 'work' ? '🍅 Focus Mode' : '☕ Break Time'}
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-all"><X className="w-4 h-4" /></button>
      </div>
      <p className="font-kalam text-xs text-slate-500 truncate mb-3">{task.title}</p>

      <div className="relative w-32 h-32 mx-auto mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
            stroke={mode === 'work' ? '#ef4444' : '#22c55e'} strokeWidth="3" strokeDasharray={`${progress}, 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-caveat text-3xl font-bold text-[#2d2d2d]">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setIsRunning(!isRunning)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRunning ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button onClick={() => { setIsRunning(false); setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60); }}
          className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-all">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < sessions ? 'bg-red-400' : 'bg-slate-200'}`} />
        ))}
        <span className="font-kalam text-[11px] text-slate-500 ml-1">{sessions}/4 sessions</span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// TASK FORM (Enhanced)
// ═══════════════════════════════════════════
function TaskForm({ onSubmit, onCancel, initialData }: { 
  onSubmit: (task: Partial<Task>) => void; 
  onCancel: () => void;
  initialData?: Task;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [lifeArea, setLifeArea] = useState<LifeArea>(initialData?.lifeArea || 'career');
  const [impact, setImpact] = useState(initialData?.impact || 5);
  const [urgency, setUrgency] = useState(initialData?.urgency || 5);
  const [effort, setEffort] = useState(initialData?.effort || 5);
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? format(new Date(initialData.dueDate), 'yyyy-MM-dd') : '');
  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduledFor ? format(new Date(initialData.scheduledFor), "yyyy-MM-dd'T'HH:mm") : '');
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [recurringPattern, setRecurringPattern] = useState(initialData?.recurringPattern || 'daily');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [partnerId, setPartnerId] = useState(initialData?.partnerId || '');
  const { partners } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Please enter a task title'); return; }
    onSubmit({
      title, description, lifeArea, impact, urgency, effort,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      scheduledFor: scheduledDate ? new Date(scheduledDate) : undefined,
      status: initialData?.status || 'todo',
      isRecurring, recurringPattern: isRecurring ? recurringPattern : undefined,
      tags: selectedTags, 
      sharedWithPartner: !!partnerId,
      partnerId: partnerId || undefined,
    });
  };

  const priorityScore = (impact * 0.4 + urgency * 0.4 + (10 - effort) * 0.2).toFixed(1);
  const priority = getPriority(parseFloat(priorityScore));

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="text-sm font-kalam font-bold mb-1 block">Task Title</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" className="journal-input text-lg font-kalam" /></div>
      <div><label className="text-sm font-kalam font-bold mb-1 block">Description</label>
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Add details..." className="journal-input" /></div>

      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-kalam font-bold mb-1 block">Life Area</label>
          <Select value={lifeArea} onValueChange={v => setLifeArea(v as LifeArea)}>
            <SelectTrigger className="journal-input"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">{lifeAreas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select></div>
        <div><label className="text-sm font-kalam font-bold mb-1 block">Due Date</label>
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="journal-input" /></div>
      </div>

      <div><label className="text-sm font-kalam font-bold mb-1 block">Assign Partner</label>
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

      <div><label className="text-sm font-kalam font-bold mb-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Schedule For</label>
        <Input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="journal-input" /></div>

      {/* Energy / Context Tags */}
      <div>
        <label className="text-sm font-kalam font-bold mb-2 block">Context Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {[...energyLevels.map(e => e.id), ...contexts.map(c => c.id)].map(tag => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-kalam font-bold border-2 transition-all ${selectedTags.includes(tag) ? 'bg-[#2d2d2d] text-white border-[#2d2d2d]' : 'bg-white text-slate-500 border-[#e8dac0] hover:border-slate-400'}`}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 p-3 bg-[#e8eef3] border-2 border-[#7a9eb8] rounded-xl">
        <label className="flex items-center gap-2 cursor-pointer text-[#5a7a94] font-kalam">
          <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="w-4 h-4" /> Recurring?
        </label>
        {isRecurring && (
          <Select value={recurringPattern} onValueChange={setRecurringPattern}>
            <SelectTrigger className="journal-input py-1 h-auto w-32 border-[#7a9eb8]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]"><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
          </Select>
        )}
      </div>

      {/* Priority Scoring */}
      <div className="space-y-3 pt-3 border-t border-[#e8dac0]">
        <p className="font-kalam text-sm font-bold text-[#2d2d2d]">Priority Scoring</p>
        {[{ label: 'Impact', value: impact, set: setImpact }, { label: 'Urgency', value: urgency, set: setUrgency }, { label: 'Effort (lower = easier)', value: effort, set: setEffort }].map(s => (
          <div key={s.label}><div className="flex justify-between text-xs font-kalam mb-1"><span>{s.label}</span><span className="font-bold">{s.value}/10</span></div>
            <Slider value={[s.value]} onValueChange={v => s.set(v[0])} max={10} min={1} /></div>
        ))}
        <div className={`flex items-center justify-between p-3 rounded-xl ${priorityConfig[priority].bg}`}>
          <span className="font-kalam text-sm font-bold">Priority: {priorityConfig[priority].label}</span>
          <span className={`font-caveat text-xl font-bold ${priorityConfig[priority].color}`}>{priorityScore}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 journal-btn-primary">{initialData ? 'Update' : 'Add Task'}</Button>
        <Button type="button" variant="outline" onClick={onCancel} className="journal-btn">Cancel</Button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════
// TASK CARD (Enhanced with Subtasks)
// ═══════════════════════════════════════════
function TaskCard({ task, onToggleComplete, onEdit, onDelete, onStartFocus, onChangeStatus, compact = false }: { 
  task: Task; onToggleComplete: () => void; onEdit: () => void; onDelete: () => void; onStartFocus: () => void; onChangeStatus?: (status: TaskStatus) => void; compact?: boolean;
}) {
  const area = lifeAreas.find(a => a.id === task.lifeArea);
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'completed';
  const priority = getPriority(task.priorityScore);
  const PriorityIcon = priorityConfig[priority].icon;
  const daysUntilDue = task.dueDate ? differenceInDays(new Date(task.dueDate), new Date()) : null;

  // Client-side subtasks
  const [subtasks, setSubtasks] = useState<Subtask[]>(() => {
    return (task.tags || []).filter(t => t.startsWith('sub:')).map(t => {
      const parts = t.replace('sub:', '').split('|');
      return { id: parts[0], title: parts[1] || '', completed: parts[2] === '1' };
    });
  });
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const subtaskProgress = subtasks.length > 0 ? (subtasks.filter(s => s.completed).length / subtasks.length) * 100 : 0;

  if (compact) {
    return (
      <div className={`px-3 py-2 rounded-lg border transition-all group cursor-pointer ${
        task.status === 'completed' ? 'bg-[#e8f0e9] border-[#8ab896] opacity-60'
        : isOverdue ? 'bg-[#f5e8e8] border-[#d49191]'
        : 'bg-white border-[#e8dac0] hover:border-[#a99bc4]'
      }`}>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={task.status === 'completed'} onChange={onToggleComplete} className="journal-checkbox shrink-0" />
          <p className={`font-kalam text-sm font-bold truncate flex-1 ${task.status === 'completed' ? 'line-through text-[#8a8a8a]' : 'text-[#2d2d2d]'}`}>{task.title}</p>
          <Badge className={`text-[10px] ${priorityConfig[priority].bg} ${priorityConfig[priority].color} shrink-0`}>
            <PriorityIcon className="w-2.5 h-2.5 mr-0.5" />{priority}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative transition-all ${
        task.status === 'completed' ? 'journal-card bg-[#e8f0e9] border-[#8ab896] opacity-75'
        : isOverdue ? 'journal-card bg-[#f5e8e8] border-[#d49191] hover:shadow-md'
        : 'journal-card hover:border-[#a99bc4] hover:shadow-sm'}`}>
      <div className="flex items-start gap-4 p-4">
        <input type="checkbox" checked={task.status === 'completed'} onChange={onToggleComplete} className="journal-checkbox mt-1 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`font-kalam text-lg font-bold ${task.status === 'completed' ? 'line-through text-[#8a8a8a]' : 'text-[#2d2d2d]'}`}>{task.title}</p>
              {task.description && <p className="text-sm text-[#5a5a5a] mt-0.5 font-kalam line-clamp-2">{task.description}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={onStartFocus} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all" title="Start Focus Timer">
                <Timer className="w-4 h-4 text-red-500" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  <DropdownMenuItem onClick={onEdit}><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                  {onChangeStatus && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onChangeStatus('todo')}><Circle className="w-4 h-4 mr-2 text-blue-500" /> Move to To Do</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onChangeStatus('in-progress')}><Clock className="w-4 h-4 mr-2 text-amber-500" /> Move to In Progress</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onChangeStatus('completed')}><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Mark Complete</DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={onDelete} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Subtask Progress */}
          {subtasks.length > 0 && (
            <div className="mt-2">
              <button onClick={() => setShowSubtasks(!showSubtasks)} className="flex items-center gap-1.5 text-xs font-kalam text-slate-500 hover:text-[#2d2d2d] transition-colors">
                {showSubtasks ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {subtasks.filter(s => s.completed).length}/{subtasks.length} subtasks
              </button>
              <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${subtaskProgress}%` }} />
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {area && <Badge variant="outline" className="text-[11px] font-kalam" style={{ borderColor: area.color, color: area.color }}>{area.name}</Badge>}
            <Badge className={`text-[11px] font-kalam ${priorityConfig[priority].bg} ${priorityConfig[priority].color}`}>
              <PriorityIcon className="w-3 h-3 mr-0.5" />{priority}
            </Badge>
            {task.dueDate && (
              <Badge variant="outline" className={`text-[11px] font-kalam ${isOverdue ? 'text-red-600 border-red-300 bg-red-50' : ''}`}>
                <Calendar className="w-3 h-3 mr-1" />
                {isToday(new Date(task.dueDate)) ? 'Today' : isTomorrow(new Date(task.dueDate)) ? 'Tomorrow'
                  : isOverdue ? `${Math.abs(daysUntilDue || 0)}d overdue` : format(new Date(task.dueDate), 'MMM d')}
              </Badge>
            )}
            {task.scheduledFor && (
              <Badge variant="outline" className="text-[11px] font-kalam"><Clock className="w-3 h-3 mr-1" />{format(new Date(task.scheduledFor), 'h:mm a')}</Badge>
            )}
            {task.isRecurring && <Badge variant="outline" className="text-[11px] font-kalam text-purple-600 border-purple-300">🔁 {task.recurringPattern}</Badge>}
            {(task.tags || []).filter(t => t.startsWith('@') || energyLevels.some(e => e.id === t)).map(tag => (
              <Badge key={tag} variant="outline" className="text-[11px] font-kalam text-slate-600 border-slate-300">{tag}</Badge>
            ))}
            <Badge variant="secondary" className="text-[11px] font-kalam">{task.priorityScore.toFixed(1)}</Badge>
          </div>

          {/* Subtask Details */}
          <AnimatePresence>
            {showSubtasks && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mt-3 space-y-1.5 overflow-hidden">
                {subtasks.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 pl-1">
                    <input type="checkbox" checked={sub.completed} onChange={() => setSubtasks(prev => prev.map(s => s.id === sub.id ? { ...s, completed: !s.completed } : s))}
                      className="w-3.5 h-3.5 rounded border-slate-300" />
                    <span className={`font-kalam text-sm ${sub.completed ? 'line-through text-slate-400' : 'text-[#2d2d2d]'}`}>{sub.title}</span>
                  </div>
                ))}
                <div className="flex gap-1.5 mt-1">
                  <Input value={newSubtask} onChange={e => setNewSubtask(e.target.value)} placeholder="Add subtask..." className="h-7 text-xs font-kalam"
                    onKeyDown={e => { if (e.key === 'Enter' && newSubtask.trim()) { setSubtasks(prev => [...prev, { id: `st-${Date.now()}`, title: newSubtask.trim(), completed: false }]); setNewSubtask(''); } }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// VIEW: KANBAN BOARD (Enhanced)
// ═══════════════════════════════════════════
function KanbanView({ tasks, onToggle, onEdit, onDelete, onFocus, onChangeStatus }: {
  tasks: Task[]; onToggle: (t: Task) => void; onEdit: (t: Task) => void; onDelete: (id: string) => void; onFocus: (t: Task) => void; onChangeStatus: (id: string, status: TaskStatus) => void;
}) {
  const columns: { id: TaskStatus; label: string; color: string; icon: typeof Circle }[] = [
    { id: 'todo', label: 'To Do', color: '#3b82f6', icon: Circle },
    { id: 'in-progress', label: 'In Progress', color: '#f59e0b', icon: Clock },
    { id: 'completed', label: 'Done', color: '#22c55e', icon: CheckCircle2 },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} className="bg-white border border-[#e8dac0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8dac0] flex items-center justify-between" style={{ backgroundColor: `${col.color}10` }}>
              <div className="flex items-center gap-2">
                <col.icon className="w-4 h-4" style={{ color: col.color }} />
                <h3 className="font-caveat text-lg font-bold text-[#2d2d2d]">{col.label}</h3>
              </div>
              <span className="font-kalam text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full border border-[#e8dac0]">{colTasks.length}</span>
            </div>
            <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto no-scrollbar">
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task} compact onToggleComplete={() => onToggle(task)} onEdit={() => onEdit(task)} onDelete={() => onDelete(task.id)} onStartFocus={() => onFocus(task)}
                  onChangeStatus={(status) => onChangeStatus(task.id, status)} />
              ))}
              {colTasks.length === 0 && (
                <p className="font-kalam text-sm text-slate-400 text-center py-8 italic">No tasks here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// VIEW: EISENHOWER MATRIX
// ═══════════════════════════════════════════
function MatrixView({ tasks, onToggle, onEdit, onDelete, onFocus, onChangeStatus }: {
  tasks: Task[]; onToggle: (t: Task) => void; onEdit: (t: Task) => void; onDelete: (id: string) => void; onFocus: (t: Task) => void; onChangeStatus: (id: string, status: TaskStatus) => void;
}) {
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const quadrants = [
    { id: 'do', label: 'Do First', sub: 'Urgent & Important', color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200', tasks: activeTasks.filter(t => t.urgency >= 6 && t.impact >= 6) },
    { id: 'schedule', label: 'Schedule', sub: 'Important, Not Urgent', color: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200', tasks: activeTasks.filter(t => t.urgency < 6 && t.impact >= 6) },
    { id: 'delegate', label: 'Delegate', sub: 'Urgent, Not Important', color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', tasks: activeTasks.filter(t => t.urgency >= 6 && t.impact < 6) },
    { id: 'eliminate', label: "Don't Do", sub: 'Neither', color: '#8b5cf6', bg: 'bg-purple-50', border: 'border-purple-200', tasks: activeTasks.filter(t => t.urgency < 6 && t.impact < 6) },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4 font-kalam text-xs text-slate-500">
        <span>← Less Urgent</span><span className="font-bold text-[#2d2d2d]">URGENCY →</span><span>More Urgent →</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {quadrants.map(q => (
          <div key={q.id} className={`${q.bg} ${q.border} border-2 rounded-xl overflow-hidden`}>
            <div className="px-4 py-2.5 border-b" style={{ borderColor: q.color + '40' }}>
              <h3 className="font-caveat text-lg font-bold" style={{ color: q.color }}>{q.label}</h3>
              <p className="font-kalam text-[11px] text-slate-500">{q.sub} · {q.tasks.length} tasks</p>
            </div>
            <div className="p-3 space-y-1.5 min-h-[120px] max-h-[280px] overflow-y-auto no-scrollbar">
              {q.tasks.map(task => (
                <TaskCard key={task.id} task={task} compact onToggleComplete={() => onToggle(task)} onEdit={() => onEdit(task)} onDelete={() => onDelete(task.id)} onStartFocus={() => onFocus(task)}
                  onChangeStatus={(status) => onChangeStatus(task.id, status)} />
              ))}
              {q.tasks.length === 0 && <p className="font-kalam text-xs text-slate-400 text-center py-6 italic">Empty — great!</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════
export function TasksPage() {
  const {
    tasks: filteredTasks, stats, isLoading,
    addTask: apiAddTask, updateTask: apiUpdateTask,
    deleteTask: apiDeleteTask, toggleCompleteTask: apiToggleCompleteTask,
    fetchTasks,
  } = useTasks();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterArea, setFilterArea] = useState<LifeArea | 'all'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'created'>('priority');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  // Debounce search
  useEffect(() => { const t = setTimeout(() => setSearchQuery(searchInput), 300); return () => clearTimeout(t); }, [searchInput]);
  useEffect(() => { fetchTasks({ status: filterStatus, lifeArea: filterArea, search: searchQuery, sortBy }); }, [filterStatus, filterArea, searchQuery, sortBy, fetchTasks]);

  const handleAddTask = async (taskData: Partial<Task>) => { await apiAddTask(taskData); setIsAddDialogOpen(false); toast.success('Task added!'); };
  const handleQuickAdd = async (taskData: Partial<Task>) => { await apiAddTask(taskData); toast.success('Task added!'); };
  const handleEditTask = async (taskData: Partial<Task>) => { if (editingTask) { await apiUpdateTask(editingTask.id, taskData); setEditingTask(null); toast.success('Updated!'); } };
  const handleDelete = async (id: string) => { await apiDeleteTask(id); toast.success('Deleted!'); };
  const handleToggle = async (task: Task) => {
    await apiToggleCompleteTask(task.id, task.status);
    toast.success(task.status === 'completed' ? 'Moved back to todo' : 'Task completed! 🎉');
  };
  const handleChangeStatus = async (id: string, status: TaskStatus) => {
    await apiUpdateTask(id, { status });
    toast.success(`Moved to ${status === 'in-progress' ? 'In Progress' : status === 'completed' ? 'Done' : 'To Do'}`);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    for (const id of Array.from(selectedTasks)) { await apiDeleteTask(id); }
    setSelectedTasks(new Set());
    toast.success(`${selectedTasks.size} tasks deleted`);
  };
  const handleBulkComplete = async () => {
    for (const id of Array.from(selectedTasks)) {
      const t = filteredTasks.find(task => task.id === id);
      if (t && t.status !== 'completed') await apiToggleCompleteTask(id, t.status);
    }
    setSelectedTasks(new Set());
    toast.success(`Tasks completed! 🎉`);
  };
  const toggleSelectTask = (id: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // JARVIS Insight
  const jarvisInsight = useMemo(() => {
    const overdue = stats.overdue;
    const urgent = filteredTasks.filter(t => t.priorityScore >= 8 && t.status !== 'completed');
    const topTask = filteredTasks.filter(t => t.status !== 'completed').sort((a, b) => b.priorityScore - a.priorityScore)[0];
    if (overdue > 0) return `⚠️ You have ${overdue} overdue task${overdue > 1 ? 's' : ''}. ${topTask ? `Focus on "${topTask.title}" first (score ${topTask.priorityScore.toFixed(1)}).` : 'Clear them ASAP.'}`;
    if (urgent.length > 0) return `🔥 ${urgent.length} urgent task${urgent.length > 1 ? 's' : ''} need attention. "${urgent[0].title}" has the highest priority.`;
    if (stats.completed > 0 && stats.todo === 0) return `🎉 All tasks completed! You're killing it today. Time to plan tomorrow.`;
    if (topTask) return `📋 Next up: "${topTask.title}" (${getPriority(topTask.priorityScore)} priority, score ${topTask.priorityScore.toFixed(1)}). Start a focus session to crush it.`;
    return `✨ Clean slate! Add your first task to get started.`;
  }, [stats, filteredTasks]);

  return (
    <div className="max-w-7xl mx-auto px-2 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-caveat text-[#2d2d2d] flex items-center gap-2"><CheckSquare className="w-7 h-7 text-[#d4a574]" /> Tasks</h1>
          <p className="text-slate-500 font-kalam text-sm mt-0.5">Manage, prioritize, and conquer</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Analytics Toggle */}
          <button onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-kalam font-bold border transition-all ${showAnalytics ? 'bg-[#a99bc4] text-white border-[#a99bc4]' : 'bg-white text-slate-500 border-[#e8dac0] hover:bg-slate-50'}`}>
            <BarChart3 className="w-3.5 h-3.5" />Analytics
          </button>
          {/* View Mode Toggle */}
          <div className="flex bg-white border border-[#e8dac0] rounded-lg overflow-hidden">
            {[{ id: 'list' as const, icon: List, label: 'List' }, { id: 'kanban' as const, icon: Columns3, label: 'Kanban' }, { id: 'matrix' as const, icon: LayoutGrid, label: 'Matrix' }].map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-kalam font-bold transition-all ${viewMode === v.id ? 'bg-[#2d2d2d] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                <v.icon className="w-3.5 h-3.5" />{v.label}
              </button>
            ))}
          </div>
          <Button className="journal-btn-primary" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-1.5" /> Add Task</Button>
        </div>
      </div>

      {/* JARVIS Insight */}
      <JarvisNote>{jarvisInsight}</JarvisNote>

      {/* Today's Focus */}
      <TodaysFocus tasks={filteredTasks} onToggle={handleToggle} onFocus={t => setFocusTask(t)} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: '#2d2d2d', bg: 'bg-[#fdfbf7]', border: 'border-[#e8dac0]' },
          { label: 'To Do', value: stats.todo, color: '#5a7a94', bg: 'bg-[#e8eef3]', border: 'border-[#7a9eb8]' },
          { label: 'In Progress', value: stats.inProgress, color: '#a8a05a', bg: 'bg-[#fef9e6]', border: 'border-[#e0d4a0]' },
          { label: 'Completed', value: stats.completed, color: '#5a9468', bg: 'bg-[#e8f0e9]', border: 'border-[#8ab896]' },
          { label: 'Overdue', value: stats.overdue, color: '#a85a5a', bg: 'bg-[#f5e8e8]', border: 'border-[#d49191]' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4 text-center`}>
            <p className="font-caveat text-3xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</p>
            <p className="font-kalam text-xs" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Analytics Panel (collapsible) */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ProductivityPanel tasks={filteredTasks} stats={stats} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add */}
      <QuickAddBar onAdd={handleQuickAdd} />

      {/* Filters */}
      <div className="bg-white border border-[#e8dac0] rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search tasks..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="pl-10 journal-input" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as TaskStatus | 'all')}>
              <SelectTrigger className="w-32 journal-input"><Filter className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]"><SelectItem value="all">All Status</SelectItem><SelectItem value="todo">To Do</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
            </Select>
            <Select value={filterArea} onValueChange={v => setFilterArea(v as LifeArea | 'all')}>
              <SelectTrigger className="w-36 journal-input"><Flag className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]"><SelectItem value="all">All Areas</SelectItem>{lifeAreas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-36 journal-input"><ArrowUpDown className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]"><SelectItem value="priority">Priority</SelectItem><SelectItem value="dueDate">Due Date</SelectItem><SelectItem value="created">Created</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedTasks.size > 0 && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#2d2d2d] text-white rounded-xl px-5 py-3 flex items-center gap-4 shadow-2xl">
            <span className="font-kalam text-sm">{selectedTasks.size} selected</span>
            <button onClick={handleBulkComplete} className="px-3 py-1.5 bg-green-600 rounded-lg text-xs font-kalam font-bold hover:bg-green-700 transition-all flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete
            </button>
            <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-600 rounded-lg text-xs font-kalam font-bold hover:bg-red-700 transition-all flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button onClick={() => setSelectedTasks(new Set())} className="p-1 hover:bg-white/10 rounded transition-all"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Content */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map(task => (
              <TaskCard key={task.id} task={task}
                onToggleComplete={() => handleToggle(task)}
                onEdit={() => setEditingTask(task)}
                onDelete={() => handleDelete(task.id)}
                onStartFocus={() => setFocusTask(task)}
                onChangeStatus={(status) => handleChangeStatus(task.id, status)} />
            ))}
          </AnimatePresence>
          {filteredTasks.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <CheckSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-kalam text-lg">No tasks found</p>
              <Button variant="outline" className="mt-4 journal-btn" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add your first task
              </Button>
            </div>
          )}
        </div>
      )}

      {viewMode === 'kanban' && (
        <KanbanView tasks={filteredTasks} onToggle={handleToggle} onEdit={t => setEditingTask(t)} onDelete={handleDelete} onFocus={t => setFocusTask(t)} onChangeStatus={handleChangeStatus} />
      )}

      {viewMode === 'matrix' && (
        <MatrixView tasks={filteredTasks} onToggle={handleToggle} onEdit={t => setEditingTask(t)} onDelete={handleDelete} onFocus={t => setFocusTask(t)} onChangeStatus={handleChangeStatus} />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-[#d4a574] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="font-kalam text-sm text-slate-500">Loading tasks...</p>
        </div>
      )}

      {/* Focus Timer */}
      <AnimatePresence>
        {focusTask && <FocusTimer task={focusTask} onClose={() => setFocusTask(null)} />}
      </AnimatePresence>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="journal-modal max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-caveat text-2xl">Add New Task</DialogTitle></DialogHeader>
          <TaskForm onSubmit={handleAddTask} onCancel={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="journal-modal max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-caveat text-2xl">Edit Task</DialogTitle></DialogHeader>
          {editingTask && <TaskForm onSubmit={handleEditTask} onCancel={() => setEditingTask(null)} initialData={editingTask} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
