"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Plus, Clock, CalendarDays,
  CheckSquare, Target, Flame, ListTodo, Eye, LayoutGrid,
  Calendar as CalIcon, Sunrise, Sun, Sunset, Moon as MoonIcon,
  Edit3, Trash2, RefreshCw, PartyPopper, BookOpen, MapPin, Sparkles
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay, addMonths, subMonths,
  isToday, addWeeks, subWeeks, subDays, getDaysInMonth
} from 'date-fns';
import { toast } from 'sonner';
import { useSession, signIn } from 'next-auth/react';
import type { LifeArea } from '@/types';
import confetti from 'canvas-confetti';
import { lifeAreas } from '@/data/mockData';

// ===== TYPES =====
interface CalendarEvent {
  id: string; googleId?: string; title: string; description?: string;
  date: Date; type: 'task' | 'goal' | 'habit' | 'reminder' | 'meeting' | 'holiday';
  color: string; completed?: boolean; time?: string; endTime?: string;
  lifeArea?: string; source?: 'local' | 'google' | 'holiday';
}
type ViewMode = 'month' | 'week' | 'day';

// ===== CONFIG =====
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WORK_HOURS_START = 6;
const WORK_HOURS_END = 22;
const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const eventTypeConfig: Record<string, { icon: typeof CheckSquare; label: string; color: string }> = {
  task:     { icon: CheckSquare, label: 'Task',     color: '#60a5fa' }, // Blue Crayon
  goal:     { icon: Target,      label: 'Goal',     color: '#a78bfa' }, // Purple Crayon
  habit:    { icon: Flame,       label: 'Habit',    color: '#34d399' }, // Green Crayon
  reminder: { icon: Clock,       label: 'Reminder', color: '#fbbf24' }, // Yellow/Orange Crayon
  meeting:  { icon: CalIcon,     label: 'Meeting',  color: '#fb7185' }, // Pink Crayon
  holiday:  { icon: PartyPopper, label: 'Holiday',  color: '#f472b6' }, // Pink/Rose Crayon
};

// ===== DAY TIMELINE =====
function DayTimeline({ date, events, onAddEvent, onEventClick }: {
  date: Date; events: CalendarEvent[];
  onAddEvent: (hour: number) => void; onEventClick: (event: CalendarEvent) => void;
}) {
  const dayEvents = events.filter(e => isSameDay(new Date(e.date), date));
  const timedEvents = dayEvents.filter(e => e.time);
  const allDayEvents = dayEvents.filter(e => !e.time);
  const getEventHour = (e: CalendarEvent) => e.time ? parseInt(e.time.split(':')[0], 10) : 0;
  
  const now = new Date();
  const isCurrentDay = isSameDay(date, now);
  const currentTimeTop = ((now.getHours() - WORK_HOURS_START) * 60) + (now.getMinutes() / 60) * 60;

  return (
    <div className="flex flex-col h-full bg-[#fcfbf9] rounded-xl border border-[#e8dac0] overflow-hidden shadow-sm">
      {allDayEvents.length > 0 && (
        <div className="bg-[#f5f0e6] p-4 border-b border-[#e8dac0]">
          <p className="font-kalam text-xs text-[#a09080] mb-2 uppercase tracking-wide font-bold">All Day Events</p>
          <div className="flex flex-col gap-2">
            {allDayEvents.map(ev => {
              const Icon = eventTypeConfig[ev.type]?.icon || CheckSquare;
              return (
                <div key={ev.id} onClick={() => onEventClick(ev)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white border cursor-pointer hover:shadow-md transition-all"
                  style={{ borderColor: `${ev.color}40`, borderLeft: `4px solid ${ev.color}` }}>
                  <div className="p-1.5 rounded-md" style={{ backgroundColor: `${ev.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: ev.color }} />
                  </div>
                  <span className={`font-kalam text-sm flex-1 ${ev.completed ? 'line-through text-[#a0a0a0]' : 'text-[#2d2d2d] font-bold'}`}>{ev.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto relative no-scrollbar bg-white">
        {isCurrentDay && now.getHours() >= WORK_HOURS_START && now.getHours() <= WORK_HOURS_END && (
          <div className="absolute left-0 right-0 z-30 flex items-center pointer-events-none" style={{ top: `${currentTimeTop}px` }}>
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm border-2 border-white ml-2" />
            <div className="flex-1 h-[2px] bg-red-500 opacity-60" />
          </div>
        )}
        {HOURS.filter(h => h >= WORK_HOURS_START && h <= WORK_HOURS_END).map(hour => {
          const hourEvents = timedEvents.filter(e => getEventHour(e) === hour);
          return (
            <div key={hour} className="flex border-b border-dashed border-[#e0d0c0] group min-h-[60px] hover:bg-[#faf5ea] transition-colors cursor-pointer"
              onClick={() => onAddEvent(hour)}>
              <div className="w-20 flex-shrink-0 pr-3 pt-2 text-right border-r border-[#e0d0c0] bg-[#fdfaf5]">
                <span className="font-kalam text-xs text-[#a09080] font-bold">{format(new Date(2000, 0, 1, hour), 'h a')}</span>
              </div>
              <div className="flex-1 pl-3 py-1.5 relative">
                {hourEvents.length === 0 && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center pl-4 pointer-events-none">
                    <span className="font-kalam text-xs text-[#c0b0a0] flex items-center gap-1.5 bg-white px-2 py-1 rounded shadow-sm border border-[#e8dac0]"><Plus className="w-3.5 h-3.5" />Click to add event</span>
                  </div>
                )}
                <div className="flex flex-col gap-1.5 absolute inset-x-3 top-1.5 z-10">
                  {hourEvents.map(ev => {
                    const Icon = eventTypeConfig[ev.type]?.icon || CheckSquare;
                    return (
                      <motion.div key={ev.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white border shadow-sm cursor-pointer hover:shadow-md transition-all"
                        style={{ borderColor: `${ev.color}30`, borderLeft: `4px solid ${ev.color}` }}
                        onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}>
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: ev.color }} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-kalam text-sm truncate ${ev.completed ? 'line-through text-[#a0a0a0]' : 'text-[#2d2d2d] font-bold'}`}>{ev.title}</p>
                          <span className="font-kalam text-[10px] text-[#8a7a6a]">{ev.time}{ev.endTime ? ` – ${ev.endTime}` : ''}</span>
                        </div>
                        {ev.source === 'google' && <CalIcon className="w-3.5 h-3.5 text-blue-400 mr-1" />}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== EVENT DETAIL DIALOG =====
function EventDetailDialog({ event, open, onClose, onEdit, onDelete }: {
  event: CalendarEvent | null; open: boolean; onClose: () => void;
  onEdit: () => void; onDelete: (e: CalendarEvent) => void;
}) {
  const [aiSummary, setAiSummary] = useState<{ summary: string; link: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (open && event?.source === 'holiday') {
      setLoadingAi(true);
      fetch('/api/ai/calendar-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'holiday-summary', eventName: event.title }),
      })
      .then(res => res.json())
      .then(data => { if (data.summary) setAiSummary(data); })
      .finally(() => setLoadingAi(false));
    } else {
      setAiSummary(null);
    }
  }, [open, event]);

  if (!event) return null;
  const Icon = eventTypeConfig[event.type]?.icon || CheckSquare;
  const isGoogle = event.source === 'google';
  const isHol = event.source === 'holiday';
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="journal-modal max-w-md">
        <DialogHeader>
          <DialogTitle className="font-caveat text-3xl text-left flex items-center gap-3 pb-3 border-b-2 border-dashed border-[#e0d0c0]">
            <div className="p-2 rounded-xl bg-[#f5f0e6] shadow-sm"><Icon className="w-6 h-6" style={{ color: event.color }} /></div>
            <span className="text-[#2d2d2d] font-bold">{event.title}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-kalam font-bold bg-[#f5f0e6] text-[#5a4a3a] border border-[#e0d0c0]">
               Type: {eventTypeConfig[event.type]?.label}
            </span>
            {isGoogle && <span className="text-xs font-kalam bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-1"><CalIcon className="w-3.5 h-3.5" /> Google Sync</span>}
            {isHol && <span className="text-xs font-kalam bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg border border-orange-100 flex items-center gap-1"><PartyPopper className="w-3.5 h-3.5" /> Public Holiday</span>}
          </div>
          
          <div className="bg-[#fcfbf9] p-4 rounded-xl border border-[#e8dac0] space-y-3 shadow-inner">
            <div className="flex items-center gap-3 font-kalam text-sm text-[#5a5a5a]">
              <CalendarDays className="w-5 h-5 text-[#c29c76]" />
              <span className="font-bold text-[#2d2d2d]">{format(new Date(event.date), 'EEEE, MMMM do, yyyy')}</span>
            </div>
            {event.time && (
              <div className="flex items-center gap-3 font-kalam text-sm text-[#5a5a5a]">
                <Clock className="w-5 h-5 text-[#c29c76]" />
                <span className="font-bold text-[#2d2d2d]">{event.time}{event.endTime ? ` to ${event.endTime}` : ''}</span>
              </div>
            )}
            {event.lifeArea && (
              <div className="flex items-center gap-3 font-kalam text-sm text-[#5a5a5a]">
                <MapPin className="w-5 h-5 text-[#c29c76]" />
                <span className="capitalize">{event.lifeArea.replace('-', ' ')}</span>
              </div>
            )}
          </div>

          {event.description && (
            <div className="p-4 bg-[url('/textures/paper-texture.png')] bg-cover border border-[#e0d0c0] rounded-xl shadow-sm">
              <p className="font-kalam text-sm text-[#2d2d2d] whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>
          )}

          {isHol && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl shadow-sm relative overflow-hidden">
               <div className="flex items-center gap-2 mb-2">
                 <Sparkles className="w-4 h-4 text-indigo-500" />
                 <span className="font-kalam font-bold text-indigo-700 text-sm">Gemini AI Insight</span>
               </div>
               {loadingAi ? (
                 <div className="animate-pulse space-y-2">
                   <div className="h-2 bg-indigo-200/50 rounded w-full"></div>
                   <div className="h-2 bg-indigo-200/50 rounded w-5/6"></div>
                 </div>
               ) : aiSummary ? (
                 <>
                   <p className="font-kalam text-sm text-slate-700 leading-relaxed mb-2">{aiSummary.summary}</p>
                   {aiSummary.link && (
                     <a href={aiSummary.link} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline transition-colors">
                       Read more about {event.title} &rarr;
                     </a>
                   )}
                 </>
               ) : null}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {isGoogle && !isHol && (
              <>
                <Button onClick={onEdit} className="flex-1 journal-btn font-kalam text-base py-2"><Edit3 className="w-4 h-4 mr-2" />Edit Event</Button>
                <Button onClick={() => onDelete(event)} className="journal-btn-red font-kalam text-base py-2 px-4 shadow-sm"><Trash2 className="w-4 h-4" /></Button>
              </>
            )}
            <Button onClick={onClose} className="journal-btn font-kalam text-base flex-1 py-2">Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== MAIN =====
export function CalendarPage() {
  const { tasks, goals, habits, addTask } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('month');
  const { data: session } = useSession();
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [holidayEvents, setHolidayEvents] = useState<CalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Visibility filters
  const [showTasks, setShowTasks] = useState(true);
  const [showHabits, setShowHabits] = useState(true);
  const [showGoals, setShowGoals] = useState(true);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  // Form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventType, setEventType] = useState<string>('task');
  const [eventLifeArea, setEventLifeArea] = useState<LifeArea>('career');
  const [syncToGoogle, setSyncToGoogle] = useState(true);
  const [eventImpact, setEventImpact] = useState(5);
  const [eventUrgency, setEventUrgency] = useState(5);
  const [eventEffort, setEventEffort] = useState(5);

  const [checkedMonths, setCheckedMonths] = useState<Record<string, boolean>>({});

  // Fetchers
  const fetchGoogleEvents = useCallback(async () => {
    if (!session) return; setIsSyncing(true);
    try {
      const s = startOfMonth(subMonths(currentDate, 1)).toISOString();
      const e = endOfMonth(addMonths(currentDate, 2)).toISOString();
      const res = await fetch(`/api/calendar/events?start=${s}&end=${e}`);
      if (!res.ok) throw new Error(); const data = await res.json(); setGoogleEvents(data.events || []);
    } catch { toast.error('Sync failed'); } finally { setIsSyncing(false); }
  }, [session, currentDate]);

  const fetchHolidays = useCallback(async () => {
    if (!session) return;
    try {
      const s = new Date(currentDate.getFullYear(), 0, 1).toISOString();
      const e = new Date(currentDate.getFullYear(), 11, 31).toISOString();
      const res = await fetch(`/api/calendar/holidays?start=${s}&end=${e}`);
      const data = await res.json(); setHolidayEvents(data.holidays || []);
    } catch { /* silent */ }
  }, [session, currentDate]);

  useEffect(() => { if (session) { fetchGoogleEvents(); fetchHolidays(); } }, [session, fetchGoogleEvents, fetchHolidays]);

  // Events
  const events = useMemo(() => {
    let result: CalendarEvent[] = [...googleEvents, ...holidayEvents];

    if (showTasks) {
      result.push(...tasks.filter(t => t.dueDate).map(tk => ({
        id: `task-${tk.id}`, title: tk.title, description: tk.description, date: new Date(tk.dueDate!),
        type: 'task', color: tk.status === 'completed' ? '#9ca3af' : eventTypeConfig.task.color, completed: tk.status === 'completed',
        time: tk.scheduledFor ? format(new Date(tk.scheduledFor), 'HH:mm') : undefined, lifeArea: tk.lifeArea, source: 'local' as const,
      } as CalendarEvent)));
    }

    if (showGoals) {
      goals.forEach(gl => {
        const base = {
          description: gl.description, type: 'goal' as const, color: gl.status === 'completed' ? '#9ca3af' : eventTypeConfig.goal.color,
          completed: gl.status === 'completed', lifeArea: gl.lifeArea, source: 'local' as const,
        };
        // Show goal on creation date
        if (gl.createdAt) {
          result.push({ ...base, id: `goal-start-${gl.id}`, title: `[Start] ${gl.title}`, date: new Date(gl.createdAt) });
        }
        // Show goal on target date
        if (gl.targetDate) {
          result.push({ ...base, id: `goal-end-${gl.id}`, title: `[Due] ${gl.title}`, date: new Date(gl.targetDate) });
        }
      });
    }

    if (showHabits) {
      result.push(...habits.flatMap(hab => 
        hab.completedDates.map((dStr, idx) => ({
          id: `habit-${hab.id}-${idx}`, title: hab.title, description: hab.description, date: new Date(dStr),
          type: 'habit', color: eventTypeConfig.habit.color, completed: true, lifeArea: hab.lifeArea, source: 'local' as const,
        } as CalendarEvent))
      ));
    }
    
    return result;
  }, [tasks, goals, habits, googleEvents, holidayEvents, showTasks, showHabits, showGoals]);

  // Calendar math
  const monthDays = useMemo(() => {
    const ms = startOfMonth(currentDate); const me = endOfMonth(ms);
    const cs = startOfWeek(ms); const ce = endOfWeek(me);
    const d: Date[] = []; let c = cs; while (c <= ce) { d.push(c); c = addDays(c, 1); } return d;
  }, [currentDate]);
  
  const weekDays = useMemo(() => { const ws = startOfWeek(currentDate); return Array.from({ length: 7 }, (_, i) => addDays(ws, i)); }, [currentDate]);
  const getEventsForDay = useCallback((date: Date) => events.filter(e => isSameDay(new Date(e.date), date)), [events]);
  const getDayHoliday = useCallback((date: Date) => holidayEvents.find(h => isSameDay(new Date(h.date), date)), [holidayEvents]);
  const selectedDayEvents = getEventsForDay(selectedDate);

  // AI Animations (Optimized)
  useEffect(() => {
    const monthKey = format(currentDate, 'yyyy-MM');
    if (checkedMonths[monthKey]) return;
    
    // Fast local filter to prevent empty AI token drain
    const monthEvs = events.filter(e => isSameMonth(new Date(e.date), currentDate));
    const celebrationKeywords = /(birthday|bday|anniversary|wedding|graduation|milestone|party|celebration)/i;
    const potentialCelebrations = monthEvs.filter(e => celebrationKeywords.test(e.title)).map(e => e.title);
    
    if (potentialCelebrations.length === 0) {
      setCheckedMonths(prev => ({ ...prev, [monthKey]: true }));
      return; 
    }

    fetch('/api/ai/calendar-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'animation-check', monthEvents: potentialCelebrations }),
    })
    .then(res => res.json())
    .then(data => {
      setCheckedMonths(prev => ({ ...prev, [monthKey]: true }));
      if (data.type === 'confetti') {
        // High quality, lag-free staggered burst
        const colors = ['#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#38bdf8'];
        const fire = (opt: any) => confetti(Object.assign({}, { origin: { y: 0.6 }, colors, zIndex: 100 }, opt));
        fire({ spread: 26, startVelocity: 55, particleCount: 80 });
        fire({ spread: 60, particleCount: 60 });
        setTimeout(() => fire({ spread: 100, decay: 0.91, scalar: 0.8, particleCount: 100 }), 250);
        setTimeout(() => fire({ spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, particleCount: 60 }), 500);
        setTimeout(() => fire({ spread: 120, startVelocity: 45, particleCount: 80 }), 750);
      } else if (data.type === 'fireworks') {
        // Throttle fireworks to 250ms intervals instead of every frame
        const duration = 2.5 * 1000; const end = Date.now() + duration;
        const interval = setInterval(() => {
          if (Date.now() > end) return clearInterval(interval);
          confetti({ particleCount: 50, startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, origin: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.5 + 0.1 }, colors: ['#a78bfa', '#38bdf8', '#fbbf24', '#f472b6'] });
        }, 250);
      } else if (data.type) { 
        // Default generic burst
        confetti({ particleCount: 150, spread: 100, zIndex: 100, origin: { y: 0.6 }, colors: ['#fbbf24', '#f472b6', '#34d399', '#818cf8'] });
      }
    }).catch(e => console.error(e));
  }, [currentDate, events, checkedMonths]);

  const handlePrev = () => { if (view === 'month') setCurrentDate(subMonths(currentDate, 1)); else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1)); else setCurrentDate(subDays(currentDate, 1)); };
  const handleNext = () => { if (view === 'month') setCurrentDate(addMonths(currentDate, 1)); else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1)); else setCurrentDate(addDays(currentDate, 1)); };
  const handleToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date()); };
  const resetForm = () => { setEventTitle(''); setEventDescription(''); setEventTime(''); setEventEndTime(''); setEventType('task'); setEventLifeArea('career'); setSyncToGoogle(true); setEventImpact(5); setEventUrgency(5); setEventEffort(5); };

  // CRUD
  const handleAddEvent = async () => {
    if (!eventTitle.trim()) return;
    const td = selectedDate || new Date();
    const due = eventTime ? new Date(`${format(td, 'yyyy-MM-dd')}T${eventTime}`) : td;
    addTask({ userId: 'user-1', title: eventTitle, description: eventDescription, lifeArea: eventLifeArea, impact: eventImpact, urgency: eventUrgency, effort: eventEffort, dueDate: due, scheduledFor: eventTime ? due : undefined, status: 'todo', isRecurring: false, tags: [], sharedWithPartner: false });
    if (syncToGoogle && session) {
      try {
        const startDT = due.toISOString();
        let endDT; if (eventEndTime) { endDT = new Date(`${format(td, 'yyyy-MM-dd')}T${eventEndTime}`).toISOString(); } else { const d = new Date(due); d.setHours(d.getHours() + 1); endDT = d.toISOString(); }
        await fetch('/api/calendar/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: eventTitle, description: eventDescription, start: startDT, end: endDT }) });
        toast.success('Synced to Google 🗓️'); fetchGoogleEvents();
      } catch { toast.error('Google sync failed'); }
    }
    resetForm(); setIsAddDialogOpen(false); toast.success('Added to planner! 📌');
  };
  const handleUpdateEvent = async () => {
    if (!detailEvent?.googleId) return;
    try {
      const td = new Date(detailEvent.date);
      const s = editTime ? new Date(`${format(td, 'yyyy-MM-dd')}T${editTime}`).toISOString() : undefined;
      const e = editEndTime ? new Date(`${format(td, 'yyyy-MM-dd')}T${editEndTime}`).toISOString() : undefined;
      await fetch('/api/calendar/events', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: detailEvent.googleId, title: editTitle, description: editDescription, start: s, end: e }) });
      toast.success('Updated ✏️'); setIsEditMode(false); setIsDetailOpen(false); fetchGoogleEvents();
    } catch { toast.error('Update failed'); }
  };
  const handleDeleteEvent = async (ev: CalendarEvent) => {
    if (!ev.googleId) return toast.error('Only Google events');
    if (!confirm('Delete from Google Calendar?')) return;
    try { await fetch(`/api/calendar/events?eventId=${ev.googleId}`, { method: 'DELETE' }); toast.success('Deleted 🗑️'); setIsDetailOpen(false); fetchGoogleEvents(); } catch { toast.error('Delete failed'); }
  };
  const handleEventClick = (ev: CalendarEvent) => {
    setDetailEvent(ev); setEditTitle(ev.title); setEditDescription(ev.description || '');
    setEditTime(ev.time || ''); setEditEndTime(ev.endTime || ''); setIsEditMode(false); setIsDetailOpen(true);
  };
  const openAddForHour = (h: number) => { setEventTime(`${String(h).padStart(2,'0')}:00`); setEventEndTime(`${String(h+1).padStart(2,'0')}:00`); setIsAddDialogOpen(true); };

  const headerTitle = view === 'day' ? format(currentDate, 'MMMM do, yyyy')
    : view === 'week' ? `${format(weekDays[0], 'MMM do')} – ${format(weekDays[6], 'MMM do')}`
    : format(currentDate, 'MMMM yyyy');

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6">

      {/* ═══ PREMIUM NOTEBOOK CONTAINER ═══ */}
      <div className="relative bg-[#ffffff] rounded-2xl overflow-hidden flex flex-col shadow-xl" 
           style={{ 
             height: 'calc(100vh - 120px)',
             border: '1px solid #e2e8f0',
             boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05), inset 0 0 100px rgba(248, 250, 252, 0.5)'
           }}>
        
        {/* Book spine shadow effect */}
        <div className="absolute top-0 bottom-0 left-[340px] w-8 z-10 pointer-events-none" 
             style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.0) 100%)' }} />

        {/* ═══ TOP CONTROL BAR ═══ */}
        <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-8 py-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#e2e8f0] flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-caveat text-4xl font-bold text-[#1e293b] leading-none">The Master Planner</h1>
              <p className="font-kalam text-sm text-[#64748b] mt-0.5 tracking-wide">Design your beautiful life.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {session && (
              <div className="hidden lg:flex items-center gap-3 mr-4">
                <span className="font-kalam text-xs bg-white text-[#5a7a94] px-3 py-1.5 rounded-lg border border-[#7a9eb8]/30 shadow-sm font-bold flex items-center gap-1.5"><CalIcon className="w-3.5 h-3.5"/> {googleEvents.length} Events</span>
                <span className="font-kalam text-xs bg-white text-[#b87333] px-3 py-1.5 rounded-lg border border-[#e8a87c]/30 shadow-sm font-bold flex items-center gap-1.5"><PartyPopper className="w-3 h-3"/> {holidayEvents.length} Holidays</span>
              </div>
            )}
            
            <div className="flex bg-white p-1 rounded-xl border border-[#e8dac0] shadow-sm">
              {[
                { key: 'month' as ViewMode, label: 'Month', icon: LayoutGrid },
                { key: 'week' as ViewMode, label: 'Week', icon: CalIcon },
                { key: 'day' as ViewMode, label: 'Day', icon: Eye },
              ].map(v => (
                <button key={v.key} onClick={() => setView(v.key)}
                  className={`px-4 py-2 rounded-lg font-kalam text-sm font-bold transition-all flex items-center gap-2 ${
                    view === v.key ? 'bg-slate-100 text-slate-800 border border-slate-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                  }`}>
                  <v.icon className="w-4 h-4" />{v.label}
                </button>
              ))}
            </div>

            {/* Visibility Filters */}
            <div className="flex bg-white px-3 py-1 rounded-xl border border-[#e2e8f0] shadow-sm items-center gap-4 ml-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-kalam text-slate-600 font-bold">
                <Checkbox checked={showTasks} onCheckedChange={(c) => setShowTasks(!!c)} className="w-4 h-4 border-slate-300" />
                Tasks
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-kalam text-slate-600 font-bold">
                <Checkbox checked={showGoals} onCheckedChange={(c) => setShowGoals(!!c)} className="w-4 h-4 border-slate-300" />
                Goals
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-kalam text-slate-600 font-bold">
                <Checkbox checked={showHabits} onCheckedChange={(c) => setShowHabits(!!c)} className="w-4 h-4 border-slate-300" />
                Habits
              </label>
            </div>

            <div className="w-px h-8 bg-[#e2e8f0] mx-2" />

            {!session ? (
              <Button onClick={() => signIn('google')} className="journal-btn font-kalam text-sm bg-white text-[#2d2d2d] hover:bg-[#f5f0e6] border-[#e8dac0]">
                <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4 mr-2" />Connect Google
              </Button>
            ) : (
              <Button onClick={() => { fetchGoogleEvents(); fetchHolidays(); }} className="journal-btn font-kalam text-sm bg-white text-[#2d2d2d] hover:bg-[#f5f0e6] border-[#e8dac0]" disabled={isSyncing}>
                <RefreshCw className={`w-4 h-4 mr-1.5 ${isSyncing ? 'animate-spin text-[#c29c76]' : ''}`} />{isSyncing ? 'Syncing...' : 'Sync'}
              </Button>
            )}
            <Button onClick={() => setIsAddDialogOpen(true)} className="journal-btn-primary font-kalam text-sm px-5 py-2.5 shadow-md">
              <Plus className="w-5 h-5 mr-1" />New Event
            </Button>
          </div>
        </div>

        {/* ═══ TWO COLUMN BULLET JOURNAL LAYOUT ═══ */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* ── LEFT PAGE (Sidebar) ── */}
          <div className="w-[340px] flex-shrink-0 border-r border-[#e2e8f0] bg-[#f8fafc] p-6 overflow-y-auto no-scrollbar flex flex-col gap-6">
            
            {/* Header / Month Nav */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-caveat text-3xl font-bold text-[#1e293b]">{format(currentDate, 'MMMM yyyy')}</h2>
              <div className="flex items-center gap-1">
                <button onClick={handlePrev} className="p-2 bg-white border border-[#e2e8f0] hover:bg-slate-50 rounded-xl transition-all shadow-sm"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                <button onClick={handleToday} className="px-3 py-2 bg-white border border-[#e2e8f0] hover:bg-slate-50 rounded-xl transition-all shadow-sm font-kalam text-sm font-bold text-slate-700">Today</button>
                <button onClick={handleNext} className="p-2 bg-white border border-[#e2e8f0] hover:bg-slate-50 rounded-xl transition-all shadow-sm"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
              </div>
            </div>

            {/* Selected Day Focus Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-200" />
              
              <h3 className="font-caveat text-2xl font-bold text-slate-700 border-b border-dashed border-slate-200 pb-3 mb-3 flex items-center justify-between">
                <span>{isToday(selectedDate) ? 'Daily Focus' : format(selectedDate, 'EEEE')}</span>
                <span className="text-xl font-kalam text-slate-400">{format(selectedDate, 'do')}</span>
              </h3>

              {getDayHoliday(selectedDate) && (
                <div 
                  className="mb-4 bg-orange-50/50 p-3 rounded-xl border border-orange-200 flex items-start gap-3 shadow-sm cursor-pointer hover:bg-orange-100 transition-colors group"
                  onClick={(e) => { e.stopPropagation(); handleEventClick(getDayHoliday(selectedDate)!); }}
                >
                  <div className="p-1.5 bg-orange-100 rounded-lg group-hover:scale-110 transition-transform"><PartyPopper className="w-4 h-4 text-orange-500" /></div>
                  <div>
                    <p className="font-kalam text-sm font-bold text-orange-700 leading-tight mt-0.5">{getDayHoliday(selectedDate)?.title}</p>
                    <p className="font-kalam text-[10px] text-orange-500 uppercase tracking-wide">Public Holiday</p>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar pr-2">
                {selectedDayEvents.filter(e => e.type !== 'holiday').map(ev => {
                  const Icon = eventTypeConfig[ev.type]?.icon || CheckSquare;
                  return (
                    <div key={ev.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer group transition-all border border-transparent hover:border-slate-100" onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }}>
                      <div className="p-1.5 rounded-lg flex-shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: `${ev.color}20` }}>
                        <Icon className="w-4 h-4" style={{ color: ev.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-kalam text-sm leading-tight truncate ${ev.completed ? 'line-through text-slate-400' : 'text-slate-800 font-bold'}`}>{ev.title}</p>
                        {ev.time && <p className="font-kalam text-xs text-slate-500 mt-0.5">{ev.time}{ev.endTime ? ` – ${ev.endTime}` : ''}</p>}
                      </div>
                    </div>
                  );
                })}
                {selectedDayEvents.filter(e => e.type !== 'holiday').length === 0 && (
                  <div className="text-center py-6 text-[#b0a090] font-kalam">
                    <p className="text-sm italic">Nothing planned today.</p>
                    <button onClick={() => setIsAddDialogOpen(true)} className="text-xs text-[#c29c76] font-bold mt-2 hover:underline">Add an event +</button>
                  </div>
                )}
              </div>
            </div>

            {/* Mini Overview Month Grid */}
            <div className="bg-white rounded-2xl border border-[#e8dac0] p-4 shadow-sm">
              <div className="grid grid-cols-7 mb-2">
                {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className={`text-center font-kalam text-[10px] font-bold ${i===0?'text-red-400':'text-[#b0a090]'}`}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                 {/* Fill empty days */}
                {Array.from({ length: startOfWeek(startOfMonth(currentDate)).getDay() }).map((_, i) => <div key={`e-${i}`} />)}
                {/* Render days of current month */}
                {Array.from({ length: getDaysInMonth(currentDate) }).map((_, i) => {
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
                  const isCurToday = isToday(date);
                  const isSel = isSameDay(date, selectedDate);
                  const hasEv = events.some(e => isSameDay(new Date(e.date), date) && e.type !== 'holiday');
                  const isHol = holidayEvents.some(h => isSameDay(new Date(h.date), date));
                  const isSun = date.getDay() === 0;

                  return (
                    <button key={i} onClick={() => setSelectedDate(date)} onDoubleClick={() => { setSelectedDate(date); setView('day'); }}
                      className={`
                        aspect-square rounded-full flex flex-col items-center justify-center relative font-kalam text-xs transition-all hover:bg-[#fafaf8] border
                        ${isCurToday ? 'bg-[#2d2d2d] text-white border-[#2d2d2d] font-bold shadow-md hover:bg-[#2d2d2d]' : 
                          isSel ? 'border-[#c29c76] bg-[#fdf8f0] text-[#5a4a3a] font-bold shadow-inner' : 'border-transparent text-[#5a5a5a]'}
                        ${isSun && !isCurToday && !isSel ? 'text-red-400 font-bold' : ''}
                      `}>
                      <span>{i + 1}</span>
                      {/* Dots for info */}
                      <div className="flex gap-[2px] absolute bottom-1">
                        {hasEv && !isCurToday && <div className="w-1 h-1 rounded-full bg-[#7a9eb8]" />}
                        {isHol && !isCurToday && <div className="w-1 h-1 rounded-full bg-orange-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quote of the day area */}
            <div className="mt-auto p-4 border-t border-dashed border-slate-200">
               <p className="font-caveat text-xl text-slate-500 text-center leading-tight">"A goal without a plan is just a wish."</p>
               <p className="font-kalam text-[10px] text-center text-slate-400 mt-2 uppercase tracking-widest">— Antoine de Saint-Exupéry</p>
            </div>

          </div>

          {/* ── RIGHT PAGE (Main Calendar Area) ── */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
            
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.2]" style={{ backgroundImage: "url('/textures/paper-texture.png')", backgroundSize: 'cover' }} />

            <div className="flex-1 flex flex-col z-10 overflow-hidden">
              {/* ═══ MONTH VIEW ═══ */}
              {view === 'month' && (
                <div className="flex-1 flex flex-col p-6">
                  {/* Styled Header */}
                  <div className="grid grid-cols-7 flex-shrink-0 mb-3 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {weekDayNames.map((d, i) => (
                      <div key={d} className={`text-center font-caveat text-xl py-3 border-r border-[#e8dac0] last:border-r-0 font-bold
                        ${i === 0 ? 'text-red-400 bg-red-50/30' : i === 6 ? 'text-blue-400 bg-blue-50/30' : 'text-[#4a4a4a]'}
                      `}>{d}</div>
                    ))}
                  </div>

                  {/* Clean Dotted Grid */}
                  <div className="grid grid-cols-7 flex-1 rounded-xl border-t border-l border-dashed border-slate-200 overflow-hidden bg-white shadow-inner" style={{ gridAutoRows: '1fr' }}>
                    {monthDays.map((day, index) => {
                      const dayEvents = getEventsForDay(day);
                      const nonHolEvents = dayEvents.filter(e => e.type !== 'holiday');
                      const inMonth = isSameMonth(day, currentDate);
                      const td = isToday(day);
                      const isHol = getDayHoliday(day);
                      const isSun = day.getDay() === 0;
                      
                      return (
                        <div key={index} 
                          onClick={() => setSelectedDate(day)}
                          onDoubleClick={() => { setSelectedDate(day); setView('day'); }}
                          className={`
                            border-b border-r border-dashed border-slate-200 p-2 relative flex flex-col group cursor-pointer hover:bg-slate-50 transition-colors
                            ${!inMonth ? 'bg-slate-50/50' : ''}
                            ${td ? 'bg-indigo-50/30' : ''}
                          `}>
                          
                          {/* Date Header */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-1.5">
                              {/* Date Number */}
                              <span className={`font-kalam text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full
                                ${td ? 'bg-[#2d2d2d] text-white shadow-md' : isSun && inMonth ? 'text-red-400' : !inMonth ? 'text-[#c0b0a0]' : 'text-[#2d2d2d]'}
                              `}>
                                {format(day, 'd')}
                              </span>
                              
                              {/* Holiday Mini-tag */}
                              {isHol && inMonth && (
                                <span className="text-[9px] font-kalam bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded border border-orange-200 font-bold truncate max-w-[80px]" title={isHol.title}>
                                  🎉 {isHol.title}
                                </span>
                              )}
                            </div>

                            <button onClick={(e) => { e.stopPropagation(); setSelectedDate(day); setIsAddDialogOpen(true); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white border border-slate-200 rounded shadow-sm text-slate-400 hover:text-slate-800 hover:border-slate-300">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Events Display - Clear & Legible Blocks */}
                          <div className="flex-1 overflow-hidden space-y-1.5 pr-1">
                            {nonHolEvents.slice(0, 3).map(ev => {
                              const Icon = eventTypeConfig[ev.type]?.icon || CheckSquare;
                              return (
                                <div key={ev.id} onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }}
                                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-xs cursor-pointer hover:shadow-sm"
                                  style={{ backgroundColor: `${ev.color}15`, borderColor: `${ev.color}40`, color: '#2d2d2d' }}>
                                  <div className="w-1 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                                  <span className={`font-kalam font-bold truncate flex-1 ${ev.completed ? 'line-through text-[#8a8a8a]' : ''}`}>{ev.title}</span>
                                  {ev.time && <span className="font-kalam text-[9px] font-bold opacity-60 flex-shrink-0">{ev.time}</span>}
                                </div>
                              );
                            })}
                            {nonHolEvents.length > 3 && (
                               <div className="text-[10px] font-kalam font-bold text-slate-500 pl-1 mt-1">
                                 +{nonHolEvents.length - 3} more
                               </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══ WEEK VIEW ═══ */}
              {view === 'week' && (
                <div className="flex flex-col h-full p-6">
                  <div className="grid grid-cols-8 border border-slate-200 rounded-t-xl bg-slate-50 shadow-sm flex-shrink-0">
                    <div className="w-20 border-r border-slate-200 bg-white" />
                    {weekDays.map((day, i) => {
                      const td = isToday(day); const hol = getDayHoliday(day);
                      return (
                        <div key={i} onClick={() => setSelectedDate(day)}
                          className={`text-center py-3 border-r border-slate-200 last:border-r-0 cursor-pointer ${td ? 'bg-indigo-50/30' : 'hover:bg-white'}`}>
                          <p className={`font-kalam text-xs font-bold uppercase tracking-wider ${i === 0 ? 'text-red-400' : 'text-slate-500'}`}>{weekDayNames[i]}</p>
                          <p className={`font-caveat text-3xl font-bold mt-1 ${td ? 'text-indigo-500' : 'text-slate-800'}`}>{format(day, 'd')}</p>
                          {hol && <p className="font-kalam text-[9px] text-[#b87333] mt-1 bg-orange-100 rounded px-1 max-w-[80%] mx-auto truncate border border-orange-200">🎉 {hol.title}</p>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar border-b border-l border-r border-slate-200 rounded-b-xl bg-white shadow-inner">
                    {HOURS.filter(h => h >= WORK_HOURS_START && h <= WORK_HOURS_END).map(hour => (
                      <div key={hour} className="grid grid-cols-8 min-h-[60px] border-b border-dashed border-slate-200">
                        <div className="w-20 border-r border-slate-200 bg-slate-50/50 pr-3 pt-2 text-right">
                          <span className="font-kalam text-xs text-slate-400 font-bold">{format(new Date(2000,0,1,hour), 'h a')}</span>
                        </div>
                        {weekDays.map((day, i) => {
                          const hEvs = getEventsForDay(day).filter(e => e.time && parseInt(e.time.split(':')[0]) === hour);
                          return (
                            <div key={i} className={`border-r border-dashed border-slate-200 last:border-r-0 p-1 cursor-pointer hover:bg-slate-50 ${isToday(day) ? 'bg-indigo-50/10' : ''}`}
                              onClick={() => { setSelectedDate(day); openAddForHour(hour); }}>
                              {hEvs.map(ev => (
                                <div key={ev.id} className="px-2 py-1.5 rounded-md border text-xs cursor-pointer mb-1 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
                                  style={{ backgroundColor: `${ev.color}15`, borderColor: `${ev.color}40`, borderLeft: `3px solid ${ev.color}` }}
                                  onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }}>
                                  <span className="font-kalam font-bold text-[#2d2d2d] truncate">{ev.title}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ DAY VIEW ═══ */}
              {view === 'day' && (
                <div className="flex-1 p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                     <h2 className="font-caveat text-4xl font-bold text-slate-800 flex items-center gap-3">
                       <Clock className="w-8 h-8 text-indigo-400" /> Daily Schedule
                     </h2>
                     {getDayHoliday(currentDate) && (
                       <div className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer" onClick={() => handleEventClick(getDayHoliday(currentDate)!)}>
                         <PartyPopper className="w-5 h-5 text-orange-500" />
                         <span className="font-kalam font-bold text-orange-700">{getDayHoliday(currentDate)?.title}</span>
                       </div>
                     )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <DayTimeline date={currentDate} events={events} onAddEvent={(h) => { setSelectedDate(currentDate); openAddForHour(h); }} onEventClick={handleEventClick} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ADD EVENT DIALOG ═══ */}
      <Dialog open={isAddDialogOpen} onOpenChange={(o) => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="journal-modal max-w-lg">
          <DialogHeader><DialogTitle className="font-caveat text-3xl pb-3 border-b-2 border-dashed border-[#e0d0c0] text-[#2d2d2d] flex items-center gap-2"><Plus className="w-6 h-6 text-[#c29c76]"/> New Calendar Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="font-kalam text-sm font-bold block text-[#5a4a3a] mb-1.5">What is it?</label>
              <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Title (e.g., Team Sync, Gym...)" className="journal-input font-kalam text-base py-3" autoFocus />
            </div>
            <div>
               <label className="font-kalam text-sm font-bold block text-[#5a4a3a] mb-1.5">Details</label>
               <Textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Notes, descriptions, links..." className="journal-input font-kalam min-h-[80px]" rows={3} />
            </div>
            
            <div>
              <label className="font-kalam text-sm font-bold block text-slate-700 mb-2">Category Type</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(eventTypeConfig).filter(([k]) => k !== 'holiday' && k !== 'habit' && k !== 'goal').map(([key, cfg]) => (
                  <button key={key} type="button" onClick={() => setEventType(key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-kalam text-sm border-2 transition-all font-bold ${
                      eventType === key ? 'border-slate-800 bg-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                    }`}><cfg.icon className="w-4 h-4" />{cfg.label}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><label className="font-kalam text-sm font-bold block text-[#5a4a3a] mb-1.5">Start</label><Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="journal-input font-kalam" /></div>
              <div><label className="font-kalam text-sm font-bold block text-[#5a4a3a] mb-1.5">End</label><Input type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} className="journal-input font-kalam" /></div>
              <div><label className="font-kalam text-sm font-bold block text-[#5a4a3a] mb-1.5">Area</label>
                <Select value={eventLifeArea} onValueChange={(v) => setEventLifeArea(v as LifeArea)}>
                  <SelectTrigger className="journal-input h-[42px] font-kalam capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-[#e8dac0] font-kalam rounded-xl shadow-lg">{lifeAreas.map(a => <SelectItem key={a.id} value={a.id} className="capitalize">{a.name.replace('-',' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {eventType === 'task' && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="font-kalam text-xs font-bold block text-slate-500 mb-1">Impact (1-10)</label>
                  <Input type="number" min="1" max="10" value={eventImpact} onChange={(e) => setEventImpact(Number(e.target.value))} className="journal-input font-kalam text-sm h-8 bg-white" />
                </div>
                <div>
                  <label className="font-kalam text-xs font-bold block text-slate-500 mb-1">Urgency (1-10)</label>
                  <Input type="number" min="1" max="10" value={eventUrgency} onChange={(e) => setEventUrgency(Number(e.target.value))} className="journal-input font-kalam text-sm h-8 bg-white" />
                </div>
                <div>
                  <label className="font-kalam text-xs font-bold block text-slate-500 mb-1">Effort (1-10)</label>
                  <Input type="number" min="1" max="10" value={eventEffort} onChange={(e) => setEventEffort(Number(e.target.value))} className="journal-input font-kalam text-sm h-8 bg-white" />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 py-3 px-4 bg-[#fcfaf5] rounded-xl border border-[#e8dac0]">
              <Checkbox id="sync-gh" checked={syncToGoogle} onCheckedChange={(c) => setSyncToGoogle(!!c)} disabled={!session} className="border-[#c29c76] w-5 h-5 rounded" />
              <label htmlFor="sync-gh" className={`font-kalam text-sm font-bold cursor-pointer ${!session ? 'text-[#b0a090]' : 'text-[#2d2d2d]'}`}>
                Sync active with Google Calendar {session ? `(${session.user?.email})` : ''}
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-dashed border-[#e8dac0]">
              <Button onClick={() => { setIsAddDialogOpen(false); resetForm(); }} className="journal-btn font-kalam text-base py-6 flex-1 bg-white text-[#2d2d2d] hover:bg-[#f5f0e6]">Cancel</Button>
              <Button onClick={handleAddEvent} disabled={!eventTitle.trim()} className="journal-btn-primary font-kalam text-base py-6 flex-[2] shadow-md"><Plus className="w-5 h-5 mr-1.5" />Add to Planner</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT DIALOG ═══ */}
      {isEditMode && !!detailEvent && (
        <Dialog open={isDetailOpen} onOpenChange={(o) => { if (!o) { setIsDetailOpen(false); setIsEditMode(false); } }}>
          <DialogContent className="journal-modal max-w-lg">
            <DialogHeader><DialogTitle className="font-caveat text-3xl pb-3 border-b-2 border-dashed border-[#e0d0c0] text-[#2d2d2d] flex items-center gap-2"><Edit3 className="w-6 h-6 text-[#c29c76]"/> Edit Event</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="font-kalam text-sm font-bold block text-[#5a4a3a] mb-1.5">Title</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="journal-input font-kalam text-base py-3" />
              </div>
              <div>
                 <label className="font-kalam text-sm font-bold block text-[#5a4a3a] mb-1.5">Details</label>
                 <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="journal-input font-kalam min-h-[80px]" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="font-kalam text-sm font-bold block text-[#5a4a3a] mb-1.5">Start Time</label><Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="journal-input font-kalam" /></div>
                <div><label className="font-kalam text-sm font-bold block text-[#5a4a3a] mb-1.5">End Time</label><Input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="journal-input font-kalam" /></div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-dashed border-[#e8dac0]">
                <Button onClick={() => setIsEditMode(false)} className="journal-btn font-kalam text-base py-6 flex-1 bg-white text-[#2d2d2d] hover:bg-[#f5f0e6]">Cancel</Button>
                <Button onClick={handleUpdateEvent} disabled={!editTitle.trim()} className="journal-btn-primary font-kalam text-base py-6 flex-[2] shadow-md"><Edit3 className="w-5 h-5 mr-1.5" />Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {!isEditMode && !!detailEvent && (
        <EventDetailDialog event={detailEvent} open={isDetailOpen} onClose={() => { setIsDetailOpen(false); setDetailEvent(null); }} onEdit={() => setIsEditMode(true)} onDelete={handleDeleteEvent} />
      )}
    </div>
  );
}
