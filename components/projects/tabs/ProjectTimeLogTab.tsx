import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, TimeLogCategory } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Plus, Play, Pause, Square, Phone, Code, Users, Pencil, TestTube, Eye, ClipboardList, MoreHorizontal, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { encodeTimeLog } from '@/utils/projectParsers';

interface ProjectTimeLogTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  timeLogs: { id: string; date: string; hours: number; desc: string }[];
}

const categoryConfig: Record<TimeLogCategory, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  'development': { label: 'Development', icon: Code, color: '#3b82f6', bg: 'bg-blue-50 border-blue-200 text-blue-700' },
  'client-call': { label: 'Client Call', icon: Phone, color: '#22c55e', bg: 'bg-green-50 border-green-200 text-green-700' },
  'meeting': { label: 'Meeting', icon: Users, color: '#8b5cf6', bg: 'bg-purple-50 border-purple-200 text-purple-700' },
  'design': { label: 'Design', icon: Pencil, color: '#ec4899', bg: 'bg-pink-50 border-pink-200 text-pink-700' },
  'testing': { label: 'Testing', icon: TestTube, color: '#f59e0b', bg: 'bg-amber-50 border-amber-200 text-amber-700' },
  'review': { label: 'Review', icon: Eye, color: '#14b8a6', bg: 'bg-teal-50 border-teal-200 text-teal-700' },
  'planning': { label: 'Planning', icon: ClipboardList, color: '#6366f1', bg: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  'other': { label: 'Other', icon: MoreHorizontal, color: '#6b7280', bg: 'bg-slate-50 border-slate-200 text-slate-600' },
};

export function ProjectTimeLogTab({ project, onUpdate, timeLogs }: ProjectTimeLogTabProps) {
  const [logHours, setLogHours] = useState('');
  const [logDesc, setLogDesc] = useState('');
  const [logCategory, setLogCategory] = useState<TimeLogCategory>('development');

  // Live timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerCategory, setTimerCategory] = useState<TimeLogCategory>('development');
  const [timerDesc, setTimerDesc] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const startTimer = () => { setTimerRunning(true); };
  const pauseTimer = () => { setTimerRunning(false); };
  const stopTimer = useCallback(() => {
    setTimerRunning(false);
    if (timerSeconds < 60) { toast.error('Timer must run at least 1 minute'); return; }
    const hours = parseFloat((timerSeconds / 3600).toFixed(2));
    const desc = timerDesc.trim() || `${categoryConfig[timerCategory].label} session`;
    const catPrefix = `[${timerCategory}] `;
    const logEntry = encodeTimeLog(`tl-${Date.now()}`, new Date().toISOString(), hours, catPrefix + desc);
    onUpdate({ hoursSpent: project.hoursSpent + hours, notes: [...project.notes, logEntry] });
    setTimerSeconds(0);
    setTimerDesc('');
    toast.success(`${hours}h logged from timer! ⏱️`);
  }, [timerSeconds, timerCategory, timerDesc, project, onUpdate]);

  const addManualTimeLog = useCallback(() => {
    const h = parseFloat(logHours);
    if (!h || h <= 0) { toast.error('Enter valid hours'); return; }
    const catPrefix = `[${logCategory}] `;
    const desc = logDesc.trim() || 'Manual entry';
    const logEntry = encodeTimeLog(`tl-${Date.now()}`, new Date().toISOString(), h, catPrefix + desc);
    onUpdate({ hoursSpent: project.hoursSpent + h, notes: [...project.notes, logEntry] });
    setLogHours('');
    setLogDesc('');
    toast.success(`${h}h logged!`);
  }, [logHours, logDesc, logCategory, project, onUpdate]);

  // Parse category from desc
  const parseCategory = (desc: string): { category: TimeLogCategory; cleanDesc: string } => {
    const match = desc.match(/^\[([^\]]+)\]\s*/);
    if (match) {
      const cat = match[1] as TimeLogCategory;
      if (cat in categoryConfig) return { category: cat, cleanDesc: desc.replace(match[0], '') };
    }
    return { category: 'other', cleanDesc: desc };
  };

  // Category breakdown for stats
  const categoryBreakdown = timeLogs.reduce((acc, log) => {
    const { category } = parseCategory(log.desc);
    acc[category] = (acc[category] || 0) + log.hours;
    return acc;
  }, {} as Record<string, number>);

  const thisWeekHours = timeLogs.filter(log => {
    const d = new Date(log.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return d >= weekAgo;
  }).reduce((sum, l) => sum + l.hours, 0);

  return (
    <div className="space-y-4 pt-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="font-caveat text-2xl font-bold text-blue-600">{project.hoursSpent.toFixed(1)}h</p>
          <p className="font-kalam text-[11px] text-blue-600">Total Hours</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <p className="font-caveat text-2xl font-bold text-purple-600">{thisWeekHours.toFixed(1)}h</p>
          <p className="font-kalam text-[11px] text-purple-600">This Week</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
          <p className="font-caveat text-2xl font-bold text-teal-600">{timeLogs.length}</p>
          <p className="font-kalam text-[11px] text-teal-600">Log Entries</p>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <div className="bg-white border border-[#e8dac0] rounded-xl p-4">
          <h4 className="font-kalam text-sm font-bold mb-3">Time by Category</h4>
          <div className="space-y-2">
            {Object.entries(categoryBreakdown).sort(([,a],[,b]) => b - a).map(([cat, hours]) => {
              const cfg = categoryConfig[cat as TimeLogCategory] || categoryConfig.other;
              const CatIcon = cfg.icon;
              const pct = project.hoursSpent > 0 ? (hours / project.hoursSpent) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-2">
                  <CatIcon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />
                  <span className="font-kalam text-xs w-20 shrink-0">{cfg.label}</span>
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                  </div>
                  <span className="font-kalam text-xs font-bold w-10 text-right shrink-0">{hours.toFixed(1)}h</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Timer */}
      <div className={`border-2 rounded-xl p-4 transition-all ${timerRunning ? 'border-green-400 bg-green-50/50 shadow-md' : 'border-[#e8dac0] bg-white'}`}>
        <h4 className="font-kalam text-sm font-bold mb-3 flex items-center gap-2">
          <Timer className="w-4 h-4 text-green-600" />
          Live Timer {timerRunning && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        </h4>
        <div className="flex items-center gap-3 mb-3">
          <div className={`font-mono text-3xl font-bold tracking-wider ${timerRunning ? 'text-green-600' : 'text-slate-700'}`}>
            {formatTimer(timerSeconds)}
          </div>
          <div className="flex gap-1.5">
            {!timerRunning ? (
              <Button onClick={startTimer} size="sm" className="h-8 px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg">
                <Play className="w-3.5 h-3.5 mr-1" /> Start
              </Button>
            ) : (
              <Button onClick={pauseTimer} size="sm" className="h-8 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg">
                <Pause className="w-3.5 h-3.5 mr-1" /> Pause
              </Button>
            )}
            {timerSeconds > 0 && (
              <Button onClick={stopTimer} size="sm" className="h-8 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg">
                <Square className="w-3.5 h-3.5 mr-1" /> Stop & Log
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={timerCategory} onValueChange={(v) => setTimerCategory(v as TimeLogCategory)}>
            <SelectTrigger className="journal-input text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
              {Object.entries(categoryConfig).map(([key, cfg]) => {
                const CatIcon = cfg.icon;
                return (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-1.5">
                      <CatIcon className="w-3 h-3" style={{ color: cfg.color }} />
                      {cfg.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Input value={timerDesc} onChange={e => setTimerDesc(e.target.value)} placeholder="What are you working on?" className="journal-input flex-1 text-xs" />
        </div>
      </div>

      {/* Manual Log */}
      <div className="bg-white border border-[#e8dac0] rounded-xl p-4">
        <h4 className="font-kalam text-sm font-bold mb-2">Log Time Manually</h4>
        <div className="flex gap-2">
          <Input type="number" step="0.25" value={logHours} onChange={e => setLogHours(e.target.value)} placeholder="Hours..." className="journal-input w-20 text-xs" />
          <Select value={logCategory} onValueChange={(v) => setLogCategory(v as TimeLogCategory)}>
            <SelectTrigger className="journal-input text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
              {Object.entries(categoryConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={logDesc} onChange={e => setLogDesc(e.target.value)} placeholder="Description..." className="journal-input flex-1 text-xs" onKeyDown={e => e.key === 'Enter' && addManualTimeLog()} />
          <Button onClick={addManualTimeLog} className="journal-btn-primary"><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Log History */}
      <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
        {timeLogs.length === 0 ? (
          <p className="text-center text-slate-400 py-6 font-kalam text-sm">No time entries yet. Use the timer or log manually above.</p>
        ) : (
          [...timeLogs].reverse().map(log => {
            const { category, cleanDesc } = parseCategory(log.desc);
            const cfg = categoryConfig[category] || categoryConfig.other;
            const CatIcon = cfg.icon;
            return (
              <div key={log.id} className="flex items-center gap-3 p-3 bg-white border border-[#e8dac0] rounded-lg group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cfg.color}15` }}>
                  <CatIcon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-kalam text-sm text-[#2d2d2d] truncate">{cleanDesc}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className={`font-kalam text-[9px] px-1.5 py-0 h-4 ${cfg.bg}`}>{cfg.label}</Badge>
                    <span className="font-kalam text-[10px] text-slate-400">
                      {log.date.includes('T') ? format(new Date(log.date), 'MMM d, h:mm a') : format(new Date(log.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <span className="font-caveat text-lg font-bold shrink-0" style={{ color: cfg.color }}>{log.hours}h</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
