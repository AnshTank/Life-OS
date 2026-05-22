import React, { useState } from 'react';
import { Project } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Target, Calendar, DollarSign, AlertTriangle, RefreshCw, Plus, Github, ExternalLink, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { encodeMilestone } from '@/utils/projectParsers';

interface ProjectOverviewTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  milestones: { id: string; title: string; completed: boolean; target?: string }[];
  tasksDone: number;
  msDone: number;
  isOverdue: boolean;
  daysLeft: number | null;
  healthScore: number;
  healthLabel: string;
  healthColor: string;
  typeConfig: any;
}

export function ProjectOverviewTab({
  project, onUpdate, milestones, tasksDone, msDone, isOverdue, daysLeft, healthScore, healthLabel, healthColor, typeConfig
}: ProjectOverviewTabProps) {
  const [newMilestone, setNewMilestone] = useState('');
  const [milestoneTarget, setMilestoneTarget] = useState('');

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    const entry = encodeMilestone(`ms-${Date.now()}`, newMilestone.trim(), false, milestoneTarget || undefined);
    onUpdate({ notes: [...project.notes, entry] });
    setNewMilestone(''); setMilestoneTarget('');
    toast.success('Milestone added! 🏁');
  };

  const toggleMilestone = (msId: string) => {
    const updatedNotes = project.notes.map(n => {
      if (!n.startsWith('🏁|')) return n;
      const [, id, title, completed, target] = n.split('|');
      if (id !== msId) return n;
      return encodeMilestone(id, title, completed !== '1', target);
    });
    onUpdate({ notes: updatedNotes });
  };

  const deleteMilestone = (msId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't toggle when deleting
    const updatedNotes = project.notes.filter(n => {
      if (!n.startsWith('🏁|')) return true;
      const [, id] = n.split('|');
      return id !== msId;
    });
    onUpdate({ notes: updatedNotes });
    toast.success('Milestone removed');
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ progress: parseInt(e.target.value, 10) });
  };

  const handleAutoSyncProgress = () => {
    const completedCount = project.tasks.filter(t => t.completed).length;
    const p = project.tasks.length > 0 ? Math.round((completedCount / project.tasks.length) * 100) : 0;
    onUpdate({ progress: p });
    toast.success(`Progress synced to ${p}% 🔄`);
  };

  return (
    <div className="space-y-5 pt-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: Clock, label: 'Hours', value: `${project.hoursSpent.toFixed(1)}h`, color: '#3b82f6' },
          { icon: CheckCircle2, label: 'Tasks', value: `${tasksDone}/${project.tasks.length}`, color: '#22c55e' },
          { icon: Target, label: 'Milestones', value: `${msDone}/${milestones.length}`, color: '#8b5cf6' },
          { icon: Calendar, label: 'Deadline', value: project.targetDate ? format(new Date(project.targetDate), 'MMM d') : '—', color: isOverdue ? '#ef4444' : '#8b5cf6' },
          { icon: DollarSign, label: 'Earned', value: project.earnings ? `₹${(project.earnings / 1000).toFixed(0)}K` : '—', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bg-[#f9f7f4] border border-[#e8dac0] rounded-xl p-3 text-center">
            <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
            <p className="font-caveat text-xl font-bold text-[#2d2d2d]">{s.value}</p>
            <p className="font-kalam text-[10px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Overdue Warning */}
      {isOverdue && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="font-kalam text-sm text-red-700"><strong>{Math.abs(daysLeft!)} days overdue</strong> — update the deadline or move to On Hold.</p>
        </div>
      )}

      {/* Health + Progress */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e8dac0] rounded-xl p-4">
          <h4 className="font-caveat text-lg font-bold mb-3">Project Health</h4>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={healthColor} strokeWidth="3.5" strokeDasharray={`${healthScore}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="font-caveat text-base font-bold">{healthScore}</span></div>
            </div>
            <div>
              <p className="font-kalam text-sm font-bold" style={{ color: healthColor }}>{healthLabel}</p>
              <p className="font-kalam text-[11px] text-slate-500 mt-0.5">
                {healthScore >= 75 ? 'On track, keep shipping!' : healthScore >= 45 ? 'Some areas need attention' : 'Review tasks and deadlines'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#e8dac0] rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-caveat text-lg font-bold">Process Tracker</h4>
            <Button variant="outline" size="sm" onClick={handleAutoSyncProgress} className="h-6 text-[10px] font-kalam gap-1 px-2 border-blue-200 text-blue-600 hover:bg-blue-50">
              <RefreshCw className="w-3 h-3" /> Auto-Sync from Tasks
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-kalam text-xs text-slate-500">Overall Progress</span>
                <span className="font-kalam text-xs font-bold" style={{ color: typeConfig.color }}>{Math.round(project.progress)}%</span>
              </div>
              <input type="range" min="0" max="100" value={project.progress} onChange={handleProgressChange} className="w-full accent-[#2d2d2d] cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none" style={{ accentColor: typeConfig.color }} />
              <p className="font-kalam text-[10px] text-slate-400 mt-1 text-center">Drag to update or sync automatically</p>
            </div>
            {milestones.length > 0 && (
              <div>
                <div className="flex justify-between mb-1"><span className="font-kalam text-[11px] text-slate-500">Milestones</span><span className="font-kalam text-[11px] font-bold">{msDone}/{milestones.length}</span></div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${milestones.length > 0 ? (msDone / milestones.length) * 100 : 0}%` }} /></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white border border-[#e8dac0] rounded-xl p-4">
        <h4 className="font-caveat text-lg font-bold mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-purple-500" /> Milestones</h4>
        <div className="space-y-2 mb-3">
          {milestones.length === 0 ? <p className="font-kalam text-xs text-slate-400 py-2 italic">No milestones yet — add key goals below</p> : (
            milestones.map(ms => (
              <div key={ms.id} className="flex items-center gap-3 p-2.5 bg-[#f9f7f4] border border-[#e8dac0] rounded-lg cursor-pointer hover:shadow-sm transition-all group" onClick={() => toggleMilestone(ms.id)}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${ms.completed ? 'bg-purple-500 border-purple-500' : 'border-slate-300'}`}>
                  {ms.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className={`flex-1 font-kalam text-sm ${ms.completed ? 'line-through text-slate-400' : 'text-[#2d2d2d] font-bold'}`}>{ms.title}</span>
                {ms.target && <span className="font-kalam text-[10px] text-slate-400 shrink-0 mr-1">{ms.target}</span>}
                <button 
                  onClick={(e) => deleteMilestone(ms.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input value={newMilestone} onChange={e => setNewMilestone(e.target.value)} placeholder="Add milestone..." className="journal-input text-sm flex-1" onKeyDown={e => e.key === 'Enter' && addMilestone()} />
          <Input type="date" value={milestoneTarget} onChange={e => setMilestoneTarget(e.target.value)} className="journal-input text-sm w-36" />
          <Button onClick={addMilestone} className="journal-btn-primary" size="sm"><Plus className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      {/* Description & Tech */}
      <div className="grid md:grid-cols-2 gap-4">
        <div><h4 className="font-caveat text-lg font-bold mb-2">Description</h4><p className="font-kalam text-sm text-slate-600 leading-relaxed">{project.description}</p></div>
        <div><h4 className="font-caveat text-lg font-bold mb-2">Tech Stack</h4>
          <div className="flex flex-wrap gap-1.5">
            {project.techStack.map(tech => <Badge key={tech} variant="secondary" className="bg-slate-100 text-slate-600 font-kalam border-slate-200 text-[11px]">{tech}</Badge>)}
          </div>
          {(project.repositoryUrl || project.demoUrl) && (
            <div className="flex gap-3 mt-3">
              {project.repositoryUrl && <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline font-kalam text-xs"><Github className="w-3.5 h-3.5" /> Repo</a>}
              {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-purple-600 hover:underline font-kalam text-xs"><ExternalLink className="w-3.5 h-3.5" /> Demo</a>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
