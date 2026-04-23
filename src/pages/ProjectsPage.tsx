"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderGit2, Plus, Code2, Briefcase, User, Rocket, 
  Clock, DollarSign, Github, ExternalLink, MoreHorizontal,
  Trash2, Edit2, CheckCircle2, Circle, Cpu, Play, Square,
  Calendar, StickyNote, ArrowRight, Search, Filter,
  LayoutGrid, Columns3, List, Sparkles, Lightbulb,
  Timer, X, ChevronDown, ChevronRight, TrendingUp,
  AlertTriangle, Zap, Target, BarChart3, Send, Layers,
  Pause, Archive, Eye, ArrowUpDown, Tag, RefreshCw
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { parseTimeLogs, encodeTimeLog, parseStandups, encodeStandup, parseMilestones, encodeMilestone, parseTechDebt, encodeTechDebt, parseInvoices, encodeInvoice, parseTeamMembers, encodeTeamMember, parseStructuredNotes, encodeStructuredNote } from '@/utils/projectParsers';
import { ProjectOverviewTab } from '@/components/projects/tabs/ProjectOverviewTab';
import { ProjectTasksTab } from '@/components/projects/tabs/ProjectTasksTab';
import { ProjectTeamTab } from '@/components/projects/tabs/ProjectTeamTab';
import { ProjectCodeTab } from '@/components/projects/tabs/ProjectCodeTab';
import { ProjectFinanceTab } from '@/components/projects/tabs/ProjectFinanceTab';
import { ProjectTimeLogTab } from '@/components/projects/tabs/ProjectTimeLogTab';
import { ProjectStandupsTab } from '@/components/projects/tabs/ProjectStandupsTab';
import { ProjectNotesTab } from '@/components/projects/tabs/ProjectNotesTab';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { Project, ProjectType, ProjectStatus } from '@/types';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

// ═══════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════
type ViewMode = 'grid' | 'kanban' | 'list';

const projectTypeConfig: Record<ProjectType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  company: { label: 'Company', icon: Briefcase, color: '#3b82f6', bg: 'bg-blue-50' },
  freelance: { label: 'Freelance', icon: DollarSign, color: '#22c55e', bg: 'bg-green-50' },
  personal: { label: 'Personal', icon: User, color: '#8b5cf6', bg: 'bg-purple-50' },
  side_hustle: { label: 'Side Hustle', icon: Rocket, color: '#f59e0b', bg: 'bg-amber-50' },
};

const projectStatusConfig: Record<ProjectStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  idea: { label: 'Idea', color: '#94a3b8', bg: 'bg-slate-50', icon: Lightbulb },
  planning: { label: 'Planning', color: '#f59e0b', bg: 'bg-amber-50', icon: Target },
  'in-progress': { label: 'In Progress', color: '#3b82f6', bg: 'bg-blue-50', icon: Zap },
  completed: { label: 'Completed', color: '#22c55e', bg: 'bg-green-50', icon: CheckCircle2 },
  'on-hold': { label: 'On Hold', color: '#ef4444', bg: 'bg-red-50', icon: Pause },
};

const techStackOptions = [
  'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Django', 'FastAPI',
  'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'TypeScript', 'JavaScript', 'Tailwind CSS',
  'Docker', 'AWS', 'Vercel', 'Firebase', 'Supabase', 'Prisma', 'tRPC', 'WebSocket',
  'OpenAI', 'TensorFlow', 'PyTorch', 'Flutter', 'React Native', 'Swift', 'Kotlin',
  'Go', 'Rust', 'Express', 'NestJS', 'Stripe', 'Shadcn', 'Framer Motion',
];

// ═══════════════════════════════════════════
// JARVIS NOTE
// ═══════════════════════════════════════════
function JarvisNote({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
      className="relative bg-[#fef9e6] border-2 border-[#e8dac0] rounded-xl p-4 flex gap-3 hover:shadow-md transition-all"
      style={{ transform: 'rotate(-0.3deg)' }}>
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-12 h-4 bg-[#e2e8f0] opacity-70 rounded-sm" />
      <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-kalam text-xs font-bold text-amber-700 uppercase tracking-wide mb-0.5">JARVIS Project Advisor</p>
        <p className="font-kalam text-sm text-[#2d2d2d] leading-relaxed">{children}</p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// QUICK IDEA CAPTURE
// ═══════════════════════════════════════════
function QuickIdeaCapture({ onAdd }: { onAdd: (project: Partial<Project>) => void }) {
  const [title, setTitle] = useState('');
  const [showExtra, setShowExtra] = useState(false);
  const [type, setType] = useState<ProjectType>('personal');
  const [desc, setDesc] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      description: desc.trim() || `Quick idea: ${title.trim()}`,
      type,
      status: 'idea',
      techStack: [],
      progress: 0,
      hoursSpent: 0,
      notes: [],
      tasks: [],
    });
    setTitle('');
    setDesc('');
    setShowExtra(false);
    toast.success('💡 Idea captured!');
  };

  return (
    <div className="bg-white border-2 border-dashed border-[#e8dac0] rounded-xl p-3 hover:border-[#d4a574] transition-all">
      <div className="flex items-center gap-3">
        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <input value={title} onChange={e => setTitle(e.target.value)} onFocus={() => setShowExtra(true)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') { setShowExtra(false); setTitle(''); } }}
          placeholder="Capture an idea... (press Enter)"
          className="flex-1 bg-transparent outline-none font-kalam text-[#2d2d2d] placeholder:text-slate-400" />
        {title.trim() && (
          <button onClick={handleSubmit} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-kalam font-bold flex items-center gap-1 hover:bg-amber-600 transition-all">
            <Send className="w-3 h-3" /> Capture
          </button>
        )}
      </div>
      <AnimatePresence>
        {showExtra && title.trim() && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f0ebe3]">
              <Select value={type} onValueChange={v => setType(v as ProjectType)}>
                <SelectTrigger className="h-7 w-32 text-[11px] font-kalam border-[#e8dac0]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">{Object.entries(projectTypeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
              <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Quick description..." className="h-7 text-[11px] font-kalam flex-1 border-[#e8dac0]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════
// PROJECT FORM (Enhanced)
// ═══════════════════════════════════════════
function ProjectForm({ onSubmit, onCancel, initialData }: { 
  onSubmit: (project: Partial<Project>) => void; 
  onCancel: () => void;
  initialData?: Project;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<ProjectType>(initialData?.type || 'personal');
  const [status, setStatus] = useState<ProjectStatus>(initialData?.status || 'idea');
  const [techStack, setTechStack] = useState<string[]>(initialData?.techStack || []);
  const [targetDate, setTargetDate] = useState(initialData?.targetDate ? format(initialData.targetDate, 'yyyy-MM-dd') : '');
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [earnings, setEarnings] = useState(initialData?.earnings || 0);
  const [repositoryUrl, setRepositoryUrl] = useState(initialData?.repositoryUrl || '');
  const [demoUrl, setDemoUrl] = useState(initialData?.demoUrl || '');
  const [techSearch, setTechSearch] = useState('');

  const filteredTech = techStackOptions.filter(t => t.toLowerCase().includes(techSearch.toLowerCase()) && !techStack.includes(t));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Please enter a project name'); return; }
    onSubmit({
      title, description, type, status, techStack,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      clientName: clientName || undefined,
      earnings: earnings || undefined,
      repositoryUrl: repositoryUrl || undefined,
      demoUrl: demoUrl || undefined,
      progress: initialData?.progress || 0,
      hoursSpent: initialData?.hoursSpent || 0,
      notes: initialData?.notes || [],
      tasks: initialData?.tasks || [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div><label className="font-kalam text-sm font-bold mb-1 block">Project Name</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="What are you building?" className="journal-input text-lg font-kalam" /></div>
      <div><label className="font-kalam text-sm font-bold mb-1 block">Description</label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the vision..." className="journal-input min-h-[80px]" /></div>

      <div className="grid grid-cols-2 gap-4">
        <div><label className="font-kalam text-sm font-bold mb-1 block">Type</label>
          <Select value={type} onValueChange={v => setType(v as ProjectType)}>
            <SelectTrigger className="journal-input"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">{Object.entries(projectTypeConfig).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent>
          </Select></div>
        <div><label className="font-kalam text-sm font-bold mb-1 block">Status</label>
          <Select value={status} onValueChange={v => setStatus(v as ProjectStatus)}>
            <SelectTrigger className="journal-input"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">{Object.entries(projectStatusConfig).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent>
          </Select></div>
      </div>

      {(type === 'freelance') && (
        <div className="grid grid-cols-2 gap-4">
          <div><label className="font-kalam text-sm font-bold mb-1 block">Client</label>
            <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Who's paying?" className="journal-input" /></div>
          <div><label className="font-kalam text-sm font-bold mb-1 block">Earnings (₹)</label>
            <Input type="number" value={earnings} onChange={e => setEarnings(Number(e.target.value))} className="journal-input" /></div>
        </div>
      )}

      <div><label className="font-kalam text-sm font-bold mb-1 block">Target Date</label>
        <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="journal-input" /></div>

      <div><label className="font-kalam text-sm font-bold mb-1 block">Tech Stack</label>
        <Input value={techSearch} onChange={e => setTechSearch(e.target.value)} placeholder="Search technologies..." className="journal-input mb-2" />
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {techStack.map(tech => (
              <button key={tech} type="button" onClick={() => setTechStack(p => p.filter(t => t !== tech))}
                className="px-2.5 py-1 bg-[#2d2d2d] text-white rounded-lg text-xs font-kalam font-bold flex items-center gap-1 hover:bg-red-600 transition-all">
                {tech} <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-[#e8dac0]">
          {filteredTech.slice(0, 15).map(tech => (
            <button key={tech} type="button" onClick={() => setTechStack(p => [...p, tech])}
              className="px-2.5 py-1 bg-white text-slate-600 border border-[#e8dac0] rounded-lg text-xs font-kalam hover:bg-purple-50 hover:border-purple-300 transition-all">{tech}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><label className="font-kalam text-sm font-bold mb-1 block">Repository URL</label>
          <Input value={repositoryUrl} onChange={e => setRepositoryUrl(e.target.value)} placeholder="https://github.com/..." className="journal-input" /></div>
        <div><label className="font-kalam text-sm font-bold mb-1 block">Demo URL</label>
          <Input value={demoUrl} onChange={e => setDemoUrl(e.target.value)} placeholder="https://..." className="journal-input" /></div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 journal-btn-primary">{initialData ? 'Update' : 'Create Project'}</Button>
        <Button type="button" variant="outline" onClick={onCancel} className="journal-btn">Cancel</Button>
      </div>
    </form>
  );
}

// ═══════════════════════════════════════════
// PROJECT DETAILS MODAL (Phase 2 — Rich Detail)
// ═══════════════════════════════════════════

// Parsers are now in src/utils/projectParsers.ts

function ProjectDetailsModal({ project, isOpen, onClose, onEdit, onDelete, onUpdate }: { 
  project: Project; isOpen: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void;
  onUpdate: (updates: Partial<Project>) => void;
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  // Parsed data
  const timeLogs = parseTimeLogs(project.notes);
  const standups = parseStandups(project.notes);
  const milestones = parseMilestones(project.notes);
  const techDebts = parseTechDebt(project.notes);
  const invoices = parseInvoices(project.notes);
  const teamMembers = parseTeamMembers(project.notes);
  const structuredNotes = parseStructuredNotes(project.notes);
  const totalLoggedHours = timeLogs.reduce((s, l) => s + l.hours, 0);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) { interval = setInterval(() => setTimerSeconds(s => s + 1), 1000); }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleTimer = () => {
    if (isTimerRunning) {
      const hoursToAdd = timerSeconds / 3600;
      const logEntry = encodeTimeLog(`tl-${Date.now()}`, new Date().toISOString(), Math.round(hoursToAdd * 100) / 100, 'Timer session');
      onUpdate({ hoursSpent: project.hoursSpent + hoursToAdd, notes: [...project.notes, logEntry] });
      setTimerSeconds(0);
      setIsTimerRunning(false);
      toast.success(`Logged ${(hoursToAdd * 60).toFixed(0)} minutes! ⏱️`);
    } else { setIsTimerRunning(true); }
  };


  const typeConfig = projectTypeConfig[project.type];
  const TypeIcon = typeConfig.icon;
  const daysLeft = project.targetDate ? differenceInDays(new Date(project.targetDate), new Date()) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0 && project.status !== 'completed';
  const tasksDone = project.tasks.filter(t => t.completed).length;
  const msDone = milestones.filter(m => m.completed).length;

  // Health score
  const healthScore = useMemo(() => {
    let score = 70;
    if (project.progress >= 80) score += 15;
    else if (project.progress >= 50) score += 5;
    if (isOverdue) score -= 25;
    if (project.tasks.length > 0 && tasksDone / project.tasks.length >= 0.5) score += 10;
    if (standups.length > 0) score += 5;
    return Math.max(0, Math.min(100, score));
  }, [project, isOverdue, tasksDone, standups]);

  const healthColor = healthScore >= 75 ? '#22c55e' : healthScore >= 45 ? '#f59e0b' : '#ef4444';
  const healthLabel = healthScore >= 75 ? 'Healthy' : healthScore >= 45 ? 'Needs Attention' : 'At Risk';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="journal-modal max-w-[90vw] w-[960px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2" style={{ backgroundColor: typeConfig.color + '15', borderColor: typeConfig.color + '40', color: typeConfig.color }}>
                <TypeIcon className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="font-caveat text-3xl">{project.title}</DialogTitle>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="font-kalam text-xs" style={{ backgroundColor: projectStatusConfig[project.status].color + '15', borderColor: projectStatusConfig[project.status].color + '40', color: projectStatusConfig[project.status].color }}>
                    {projectStatusConfig[project.status].label}
                  </Badge>
                  <Badge variant="outline" className="font-kalam text-xs" style={{ borderColor: typeConfig.color + '40', color: typeConfig.color }}>{typeConfig.label}</Badge>
                  {project.clientName && <Badge variant="outline" className="font-kalam text-xs">{project.clientName}</Badge>}
                  <Badge variant="outline" className="font-kalam text-xs" style={{ borderColor: healthColor + '60', color: healthColor, backgroundColor: healthColor + '10' }}>
                    {healthLabel} ({healthScore}%)
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className={`journal-btn gap-2 ${isTimerRunning ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : ''}`} onClick={toggleTimer}>
                {isTimerRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                {isTimerRunning ? format(new Date(0, 0, 0, 0, 0, timerSeconds), 'HH:mm:ss') : '▶ Track Time'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-5 h-5 text-slate-400" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  <DropdownMenuItem onClick={() => { onClose(); onEdit(); }}><Edit2 className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { onClose(); onDelete(); }} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="flex w-full bg-[#f5f0e6] p-1 border border-[#e0e0e0] rounded-lg overflow-x-auto hide-scrollbar">
            <TabsTrigger value="overview" className="flex-1 min-w-[80px] font-kalam text-[11px] px-2 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7]">Overview</TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1 min-w-[60px] font-kalam text-[11px] px-2 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7]">Tasks</TabsTrigger>
            <TabsTrigger value="team" className="flex-1 min-w-[60px] font-kalam text-[11px] px-2 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7]">Team</TabsTrigger>
            <TabsTrigger value="code" className="flex-1 min-w-[80px] font-kalam text-[11px] px-2 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7]">Code & Debt</TabsTrigger>
            {(project.type === 'freelance' || project.type === 'side_hustle' || project.earnings) ? (
              <TabsTrigger value="finance" className="flex-1 min-w-[80px] font-kalam text-[11px] px-2 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7]">Finance</TabsTrigger>
            ) : null}
            <TabsTrigger value="timelog" className="flex-1 min-w-[80px] font-kalam text-[11px] px-2 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7]">Time Log</TabsTrigger>
            <TabsTrigger value="standup" className="flex-1 min-w-[80px] font-kalam text-[11px] px-2 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7]">Standups</TabsTrigger>
            <TabsTrigger value="notes" className="flex-1 min-w-[60px] font-kalam text-[11px] px-2 data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7]">Notes</TabsTrigger>
          </TabsList>

          {/* ─── OVERVIEW TAB ──────────────────────── */}
          <TabsContent value="overview" className="focus-visible:outline-none">
            <ProjectOverviewTab 
              project={project} 
              onUpdate={onUpdate} 
              milestones={milestones}
              tasksDone={tasksDone}
              msDone={msDone}
              isOverdue={isOverdue}
              daysLeft={daysLeft}
              healthScore={healthScore}
              healthLabel={healthLabel}
              healthColor={healthColor}
              typeConfig={typeConfig}
            />
          </TabsContent>

          {/* ─── TASKS TAB ──────────────────────── */}
          <TabsContent value="tasks" className="focus-visible:outline-none">
            <ProjectTasksTab project={project} onUpdate={onUpdate} teamMembers={teamMembers} />
          </TabsContent>

          {/* ─── TEAM TAB ──────────────────────── */}
          <TabsContent value="team" className="focus-visible:outline-none">
            <ProjectTeamTab project={project} onUpdate={onUpdate} teamMembers={teamMembers} />
          </TabsContent>

          {/* ─── TIME LOG TAB ──────────────────────── */}
          <TabsContent value="timelog" className="focus-visible:outline-none">
            <ProjectTimeLogTab project={project} onUpdate={onUpdate} timeLogs={timeLogs} />
          </TabsContent>

          {/* ─── STANDUP TAB ──────────────────────── */}
          <TabsContent value="standup" className="focus-visible:outline-none">
            <ProjectStandupsTab project={project} onUpdate={onUpdate} standups={standups} />
          </TabsContent>

          {/* ─── NOTES TAB ──────────────────────── */}
          <TabsContent value="notes" className="focus-visible:outline-none">
            <ProjectNotesTab project={project} onUpdate={onUpdate} structuredNotes={structuredNotes} />
          </TabsContent>

          {/* ─── CODE & DEBT TAB ──────────────────────── */}
          <TabsContent value="code" className="focus-visible:outline-none">
            <ProjectCodeTab project={project} onUpdate={onUpdate} techDebts={techDebts} />
          </TabsContent>

          {/* ─── FINANCE TAB ──────────────────────── */}
          <TabsContent value="finance" className="focus-visible:outline-none">
            <ProjectFinanceTab project={project} onUpdate={onUpdate} invoices={invoices} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════
// PROJECT CARD (Enhanced)
// ═══════════════════════════════════════════
function ProjectCard({ project, onClick, onChangeStatus }: { project: Project; onClick: () => void; onChangeStatus: (status: ProjectStatus) => void }) {
  const typeConfig = projectTypeConfig[project.type];
  const statusConfig = projectStatusConfig[project.status];
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;
  const daysLeft = project.targetDate ? differenceInDays(new Date(project.targetDate), new Date()) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0 && project.status !== 'completed';
  const tasksDone = project.tasks.filter(t => t.completed).length;

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }} className="cursor-pointer group">
      <div className={`journal-card hover:shadow-lg transition-all h-full flex flex-col overflow-hidden ${isOverdue ? 'border-red-300' : ''}`} onClick={onClick}>
        <div className="h-1.5 w-full" style={{ backgroundColor: typeConfig.color }} />
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center border" style={{ backgroundColor: typeConfig.color + '15', borderColor: typeConfig.color + '30', color: typeConfig.color }}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-caveat text-xl font-bold text-[#2d2d2d] leading-tight">{project.title}</h3>
                <Badge variant="outline" className="text-[10px] font-kalam mt-0.5" style={{ backgroundColor: statusConfig.color + '15', borderColor: statusConfig.color + '30', color: statusConfig.color }}>
                  <StatusIcon className="w-3 h-3 mr-0.5" />{statusConfig.label}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#fefdfb] border-2 border-[#2d2d2d]" onClick={e => e.stopPropagation()}>
                {Object.entries(projectStatusConfig).filter(([k]) => k !== project.status).map(([k, v]) => (
                  <DropdownMenuItem key={k} onClick={() => onChangeStatus(k as ProjectStatus)}>
                    <v.icon className="w-4 h-4 mr-2" style={{ color: v.color }} /> Move to {v.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-xs text-slate-500 font-kalam mb-3 line-clamp-2 flex-1">{project.description}</p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[11px] font-kalam text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{tasksDone}/{project.tasks.length}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{project.hoursSpent.toFixed(0)}h</span>
              {project.earnings && <span className="flex items-center gap-1 text-green-600"><DollarSign className="w-3 h-3" />₹{(project.earnings / 1000).toFixed(0)}K</span>}
              {daysLeft !== null && (
                <span className={`flex items-center gap-1 ml-auto ${isOverdue ? 'text-red-500 font-bold' : daysLeft < 7 ? 'text-amber-500' : ''}`}>
                  <Calendar className="w-3 h-3" />{isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                </span>
              )}
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${project.progress}%`, backgroundColor: project.progress >= 80 ? '#22c55e' : project.progress >= 40 ? '#3b82f6' : typeConfig.color }} />
            </div>

            <div className="flex flex-wrap gap-1">
              {project.techStack.slice(0, 3).map(tech => (
                <span key={tech} className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[10px] text-slate-500 font-kalam">{tech}</span>
              ))}
              {project.techStack.length > 3 && <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[10px] text-slate-500 font-kalam">+{project.techStack.length - 3}</span>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// VIEW: KANBAN BOARD
// ═══════════════════════════════════════════
function KanbanView({ projects, onSelect, onChangeStatus }: {
  projects: Project[]; onSelect: (p: Project) => void; onChangeStatus: (id: string, status: ProjectStatus) => void;
}) {
  const columns: { id: ProjectStatus; label: string; color: string; icon: React.ElementType }[] = [
    { id: 'idea', label: '💡 Ideas', color: '#94a3b8', icon: Lightbulb },
    { id: 'planning', label: '📋 Planning', color: '#f59e0b', icon: Target },
    { id: 'in-progress', label: '🔥 In Progress', color: '#3b82f6', icon: Zap },
    { id: 'completed', label: '✅ Done', color: '#22c55e', icon: CheckCircle2 },
    { id: 'on-hold', label: '⏸️ On Hold', color: '#ef4444', icon: Pause },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
      {columns.map(col => {
        const colProjects = projects.filter(p => p.status === col.id);
        return (
          <div key={col.id} className="bg-white border border-[#e8dac0] rounded-xl min-w-[260px] flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-[#e8dac0] flex items-center justify-between" style={{ backgroundColor: col.color + '08' }}>
              <h3 className="font-caveat text-base font-bold text-[#2d2d2d]">{col.label}</h3>
              <span className="font-kalam text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-[#e8dac0]">{colProjects.length}</span>
            </div>
            <div className="p-2.5 space-y-2 flex-1 max-h-[550px] overflow-y-auto no-scrollbar">
              {colProjects.map(project => {
                const tc = projectTypeConfig[project.type];
                const TI = tc.icon;
                return (
                  <div key={project.id} onClick={() => onSelect(project)}
                    className="p-3 bg-white border border-[#e8dac0] rounded-lg hover:shadow-sm hover:border-[#a99bc4] cursor-pointer transition-all group">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: tc.color + '15', color: tc.color }}><TI className="w-3.5 h-3.5" /></div>
                      <p className="font-kalam text-sm font-bold text-[#2d2d2d] truncate flex-1">{project.title}</p>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full mb-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${project.progress}%`, backgroundColor: col.color }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-kalam text-slate-500">
                      <span>{Math.round(project.progress)}%</span>
                      <span>{project.hoursSpent.toFixed(0)}h</span>
                    </div>
                  </div>
                );
              })}
              {colProjects.length === 0 && <p className="font-kalam text-xs text-slate-400 text-center py-6 italic">Empty</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════
export function ProjectsPage() {
  const { projects, addProject, updateProject, deleteProject } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ProjectType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'hours'>('recent');

  // Filtered projects
  const filteredProjects = useMemo(() => {
    let result = projects;
    if (filterType !== 'all') result = result.filter(p => p.type === filterType);
    if (filterStatus !== 'all') result = result.filter(p => p.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.techStack.some(t => t.toLowerCase().includes(q)));
    }
    switch (sortBy) {
      case 'progress': return [...result].sort((a, b) => b.progress - a.progress);
      case 'hours': return [...result].sort((a, b) => b.hoursSpent - a.hoursSpent);
      default: return [...result].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  }, [projects, filterType, filterStatus, searchQuery, sortBy]);

  const projectStats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => p.status === 'in-progress').length,
    ideas: projects.filter(p => p.status === 'idea').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalHours: projects.reduce((s, p) => s + p.hoursSpent, 0),
    earnings: projects.filter(p => p.earnings).reduce((s, p) => s + (p.earnings || 0), 0),
    overdue: projects.filter(p => p.targetDate && differenceInDays(new Date(p.targetDate), new Date()) < 0 && p.status !== 'completed').length,
  }), [projects]);

  const handleAddProject = (data: Partial<Project>) => { addProject(data as any); setIsAddDialogOpen(false); toast.success('Project created! 🚀'); };
  const handleEditProject = (data: Partial<Project>) => { if (editingProject) { updateProject(editingProject.id, data); setEditingProject(null); toast.success('Updated!'); } };
  const handleDelete = (id: string) => { deleteProject(id); toast.success('Project deleted'); };
  const handleChangeStatus = (id: string, status: ProjectStatus) => { updateProject(id, { status }); toast.success(`Moved to ${projectStatusConfig[status].label}`); };

  // JARVIS Insight
  const jarvisInsight = useMemo(() => {
    if (projectStats.overdue > 0) return `⚠️ ${projectStats.overdue} project${projectStats.overdue > 1 ? 's are' : ' is'} overdue. Review deadlines or move to On Hold.`;
    const inProgress = projects.filter(p => p.status === 'in-progress');
    if (inProgress.length > 3) return `🔥 You have ${inProgress.length} active projects. Consider focusing on fewer to ship faster.`;
    const topProject = inProgress.sort((a, b) => b.progress - a.progress)[0];
    if (topProject) return `📋 "${topProject.title}" is at ${topProject.progress}% — ${topProject.progress >= 80 ? 'almost there! Push to finish.' : 'keep building momentum.'}`;
    if (projectStats.ideas > 0) return `💡 You have ${projectStats.ideas} idea${projectStats.ideas > 1 ? 's' : ''} waiting. Pick one and start planning!`;
    return `✨ Ready to build something new? Capture an idea below.`;
  }, [projects, projectStats]);

  return (
    <div className="max-w-7xl mx-auto px-2 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-caveat text-[#2d2d2d] flex items-center gap-2"><FolderGit2 className="w-7 h-7 text-[#a99bc4]" /> Projects & Ideas</h1>
          <p className="text-slate-500 font-kalam text-sm mt-0.5">Build, ship, and track everything you create</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-[#e8dac0] rounded-lg overflow-hidden">
            {[{ id: 'grid' as const, icon: LayoutGrid, label: 'Grid' }, { id: 'kanban' as const, icon: Columns3, label: 'Kanban' }, { id: 'list' as const, icon: List, label: 'List' }].map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-kalam font-bold transition-all ${viewMode === v.id ? 'bg-[#2d2d2d] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                <v.icon className="w-3.5 h-3.5" />{v.label}
              </button>
            ))}
          </div>
          <Button className="journal-btn-primary" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-1.5" /> New Project</Button>
        </div>
      </div>

      {/* JARVIS */}
      <JarvisNote>{jarvisInsight}</JarvisNote>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total', value: projectStats.total, color: '#2d2d2d', bg: 'bg-[#fdfbf7]', border: 'border-[#e8dac0]' },
          { label: 'Active', value: projectStats.active, color: '#3b82f6', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Ideas', value: projectStats.ideas, color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Done', value: projectStats.completed, color: '#22c55e', bg: 'bg-green-50', border: 'border-green-200' },
          { label: 'Overdue', value: projectStats.overdue, color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200' },
          { label: 'Hours', value: `${projectStats.totalHours.toFixed(0)}h`, color: '#8b5cf6', bg: 'bg-purple-50', border: 'border-purple-200' },
          { label: 'Earned', value: `₹${(projectStats.earnings / 1000).toFixed(0)}K`, color: '#22c55e', bg: 'bg-green-50', border: 'border-green-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3 text-center`}>
            <p className="font-caveat text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="font-kalam text-[11px]" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Idea Capture */}
      <QuickIdeaCapture onAdd={handleAddProject} />

      {/* Filters */}
      <div className="bg-white border border-[#e8dac0] rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search projects, tech..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 journal-input" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filterType} onValueChange={v => setFilterType(v as ProjectType | 'all')}>
              <SelectTrigger className="w-32 journal-input"><Tag className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(projectTypeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as ProjectStatus | 'all')}>
              <SelectTrigger className="w-36 journal-input"><Filter className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(projectStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-32 journal-input"><ArrowUpDown className="w-3.5 h-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]"><SelectItem value="recent">Recent</SelectItem><SelectItem value="progress">Progress</SelectItem><SelectItem value="hours">Hours</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} onChangeStatus={status => handleChangeStatus(project.id, status)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {viewMode === 'kanban' && (
        <KanbanView projects={filteredProjects} onSelect={p => setSelectedProject(p)} onChangeStatus={handleChangeStatus} />
      )}

      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredProjects.map(project => {
            const tc = projectTypeConfig[project.type];
            const sc = projectStatusConfig[project.status];
            const TI = tc.icon;
            const daysLeft = project.targetDate ? differenceInDays(new Date(project.targetDate), new Date()) : null;
            return (
              <div key={project.id} onClick={() => setSelectedProject(project)}
                className="flex items-center gap-4 p-4 bg-white border border-[#e8dac0] rounded-xl hover:shadow-sm hover:border-[#a99bc4] cursor-pointer transition-all">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tc.color + '15', color: tc.color }}><TI className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-kalam text-base font-bold text-[#2d2d2d] truncate">{project.title}</p>
                  <p className="font-kalam text-xs text-slate-500 truncate">{project.description}</p>
                </div>
                <Badge className="text-[10px] font-kalam shrink-0" style={{ backgroundColor: sc.color + '15', color: sc.color, borderColor: sc.color + '30' }}>{sc.label}</Badge>
                <div className="w-24 shrink-0">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${project.progress}%`, backgroundColor: tc.color }} /></div>
                  <p className="font-kalam text-[10px] text-slate-500 text-right mt-0.5">{Math.round(project.progress)}%</p>
                </div>
                <span className="font-kalam text-xs text-slate-500 shrink-0">{project.hoursSpent.toFixed(0)}h</span>
                {daysLeft !== null && <span className={`font-kalam text-xs shrink-0 ${daysLeft < 0 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>{daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}</span>}
              </div>
            );
          })}
        </div>
      )}

      {filteredProjects.length === 0 && (
        <div className="text-center py-16 bg-[#f9f7f4] rounded-2xl border-2 border-dashed border-[#e0e0e0]">
          <Cpu className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="font-caveat text-2xl text-slate-500 mb-2">No projects found</p>
          <p className="font-kalam text-slate-400 mb-6">Time to start something new?</p>
          <Button className="journal-btn-primary" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create your first project</Button>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="journal-modal max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-caveat text-2xl">Create New Project</DialogTitle></DialogHeader>
          <ProjectForm onSubmit={handleAddProject} onCancel={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent className="journal-modal max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-caveat text-2xl">Edit Project</DialogTitle></DialogHeader>
          {editingProject && <ProjectForm onSubmit={handleEditProject} onCancel={() => setEditingProject(null)} initialData={editingProject} />}
        </DialogContent>
      </Dialog>

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject} isOpen={!!selectedProject} onClose={() => setSelectedProject(null)}
          onEdit={() => { setEditingProject(selectedProject); setSelectedProject(null); }}
          onDelete={() => { handleDelete(selectedProject.id); setSelectedProject(null); }}
          onUpdate={updates => { updateProject(selectedProject.id, updates); setSelectedProject({ ...selectedProject, ...updates } as Project); }}
        />
      )}
    </div>
  );
}
