"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Edit2, Trash2, MoreHorizontal, Play, Square, 
  CheckCircle2, Clock, Calendar, Zap, Target, Share2,
  ExternalLink, Github, Globe
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { 
  parseTimeLogs, parseStandups, parseMilestones, 
  parseTechDebt, parseInvoices, parseTeamMembers, 
  parseStructuredNotes, encodeTimeLog 
} from '@/utils/projectParsers';
import { ProjectOverviewTab } from '@/components/projects/tabs/ProjectOverviewTab';
import { ProjectTasksTab } from '@/components/projects/tabs/ProjectTasksTab';
import { ProjectTeamTab } from '@/components/projects/tabs/ProjectTeamTab';
import { ProjectCodeTab } from '@/components/projects/tabs/ProjectCodeTab';
import { ProjectFinanceTab } from '@/components/projects/tabs/ProjectFinanceTab';
import { ProjectTimeLogTab } from '@/components/projects/tabs/ProjectTimeLogTab';
import { ProjectStandupsTab } from '@/components/projects/tabs/ProjectStandupsTab';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import type { Project, ProjectStatus, ProjectType } from '@/types';

const projectStatusConfig: Record<ProjectStatus, { label: string; color: string; bg: string; icon: any }> = {
  idea: { label: 'Idea', color: '#94a3b8', bg: 'bg-slate-50', icon: Target },
  planning: { label: 'Planning', color: '#f59e0b', bg: 'bg-amber-50', icon: Target },
  'in-progress': { label: 'In Progress', color: '#3b82f6', bg: 'bg-blue-50', icon: Zap },
  completed: { label: 'Completed', color: '#22c55e', bg: 'bg-green-50', icon: CheckCircle2 },
  'on-hold': { label: 'On Hold', color: '#ef4444', bg: 'bg-red-50', icon: Square },
};

const projectTypeConfig: Record<ProjectType, { label: string; icon: any; color: string }> = {
  company: { label: 'Company', icon: Target, color: '#3b82f6' },
  freelance: { label: 'Freelance', icon: Target, color: '#22c55e' },
  personal: { label: 'Personal', icon: Target, color: '#8b5cf6' },
  side_hustle: { label: 'Side Hustle', icon: Zap, color: '#f59e0b' },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { projects, updateProject, deleteProject, isLoading: isContextLoading } = useApp();
  const [localProject, setLocalProject] = useState<Project | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Find project by id in context OR fetch if missing
  useEffect(() => {
    if (isContextLoading) return; // Wait for context

    const foundInContext = projects.find(p => p.id === id || p.slug === id);
    if (foundInContext) {
      setLocalProject(foundInContext);
      setIsFetching(false);
    } else {
      // If projects are loaded but this one isn't there, try fetching it directly
      setIsFetching(true);
      fetch(`/api/projects/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setLocalProject(data);
          } else {
            toast.error("Project not found");
            router.push('/projects');
          }
        })
        .catch(() => {
          toast.error("Error loading project");
          router.push('/projects');
        })
        .finally(() => setIsFetching(false));
    }
  }, [projects, id, router, isContextLoading]);

  const project = localProject;

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) { interval = setInterval(() => setTimerSeconds(s => s + 1), 1000); }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  if ((isFetching || isContextLoading) && !project) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d2d2d]"></div>
    </div>
  );

  if (!project) return null; // This case should be handled by the redirect in useEffect

  const toggleTimer = () => {
    if (isTimerRunning) {
      const hoursToAdd = timerSeconds / 3600;
      const logEntry = encodeTimeLog(`tl-${Date.now()}`, new Date().toISOString(), Math.round(hoursToAdd * 100) / 100, 'Timer session');
      updateProject(project.id, { hoursSpent: project.hoursSpent + hoursToAdd, notes: [...project.notes, logEntry] });
      setTimerSeconds(0);
      setIsTimerRunning(false);
      toast.success(`Logged ${(hoursToAdd * 60).toFixed(0)} minutes! ⏱️`);
    } else { setIsTimerRunning(true); }
  };

  const onUpdate = (updates: Partial<Project>) => updateProject(project.id, updates);
  const onDelete = () => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject(project.id);
      router.push('/projects');
      toast.success("Project deleted");
    }
  };

  // Parsed Data
  const timeLogs = parseTimeLogs(project.notes);
  const standups = parseStandups(project.notes);
  const milestones = parseMilestones(project.notes);
  const techDebts = parseTechDebt(project.notes);
  const invoices = parseInvoices(project.notes);
  const teamMembers = parseTeamMembers(project.notes);
  const structuredNotes = parseStructuredNotes(project.notes);
  const tasksDone = project.tasks.filter(t => t.completed).length;
  const msDone = milestones.filter(m => m.completed).length;
  const daysLeft = project.targetDate ? differenceInDays(new Date(project.targetDate), new Date()) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0 && project.status !== 'completed';

  const typeConfig = projectTypeConfig[project.type];
  const statusConfig = projectStatusConfig[project.status];

  // Health Score
  const healthScore = (() => {
    let score = 70;
    if (project.progress >= 80) score += 15;
    if (isOverdue) score -= 25;
    if (project.tasks.length > 0 && tasksDone / project.tasks.length >= 0.5) score += 10;
    return Math.max(0, Math.min(100, score));
  })();

  const healthColor = healthScore >= 75 ? '#22c55e' : healthScore >= 45 ? '#f59e0b' : '#ef4444';
  const healthLabel = healthScore >= 75 ? 'Healthy' : healthScore >= 45 ? 'Needs Attention' : 'At Risk';

  return (
    <div className="min-h-screen bg-[#fefdfb] p-4 md:p-8 pt-20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="font-kalam text-slate-500 hover:text-[#2d2d2d]" asChild>
            <Link href="/projects">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
            </Link>
          </Button>
          <div className="flex items-center gap-3">
             <Button variant="outline" className={`journal-btn gap-2 h-10 ${isTimerRunning ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : ''}`} onClick={toggleTimer}>
                {isTimerRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                {isTimerRunning ? format(new Date(0, 0, 0, 0, 0, timerSeconds), 'HH:mm:ss') : 'Track Time'}
              </Button>
              <Button variant="outline" className="journal-btn h-10" onClick={() => toast.info("Edit mode coming soon!")}>
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 border-2 border-[#2d2d2d] rounded-xl">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  <DropdownMenuItem className="font-kalam" onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success("Link copied!"))}>
                    <Share2 className="w-4 h-4 mr-2" /> Share Project
                  </DropdownMenuItem>
                  <DropdownMenuItem className="font-kalam text-red-600" onClick={onDelete}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </div>

        {/* Hero Section - Paper Notebook Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white border-2 border-[#2d2d2d] rounded-3xl p-8 shadow-[8px_8px_0px_rgba(45,45,45,1)] overflow-hidden"
        >
          {/* Paper Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
          
          <div className="relative flex flex-col md:flex-row gap-8 items-start">
            {/* Left Side: Identity */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="font-kalam text-xs" style={{ backgroundColor: statusConfig.color + '20', color: statusConfig.color, borderColor: statusConfig.color + '40' }}>
                  {statusConfig.label}
                </Badge>
                <Badge className="font-kalam text-xs" style={{ backgroundColor: typeConfig.color + '20', color: typeConfig.color, borderColor: typeConfig.color + '40' }}>
                  {typeConfig.label}
                </Badge>
                <Badge className="font-kalam text-xs border-[#2d2d2d]/20 text-slate-500" variant="outline">
                  Health: {healthLabel} ({healthScore}%)
                </Badge>
              </div>
              
              <h1 className="text-5xl font-caveat font-bold text-[#2d2d2d] leading-tight">
                {project.title}
              </h1>
              
              <p className="font-kalam text-lg text-slate-600 max-w-2xl leading-relaxed">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                {project.repositoryUrl && (
                  <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-kalam text-sm text-slate-500 hover:text-[#2d2d2d] transition-colors">
                    <Github className="w-4 h-4" /> Code Repository <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {project.demoUrl && (
                  <a href={project.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-kalam text-sm text-slate-500 hover:text-[#2d2d2d] transition-colors">
                    <Globe className="w-4 h-4" /> Live Demo <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Right Side: Quick Stats */}
            <div className="w-full md:w-64 space-y-6">
              <div className="bg-[#fdfbf7] border-2 border-[#2d2d2d]/10 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-kalam font-bold text-slate-500">
                    <span>Overall Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 border border-[#2d2d2d]/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      className="h-full bg-[#2d2d2d] rounded-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-caveat font-bold text-[#2d2d2d]">{tasksDone}/{project.tasks.length}</p>
                    <p className="text-[10px] font-kalam text-slate-500 uppercase tracking-wider">Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-caveat font-bold text-[#2d2d2d]">{project.hoursSpent.toFixed(1)}h</p>
                    <p className="text-[10px] font-kalam text-slate-500 uppercase tracking-wider">Invested</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2d2d2d]/5 flex items-center justify-between">
                   <div className="flex flex-col">
                      <p className="text-[10px] font-kalam text-slate-400 uppercase tracking-wider">Target</p>
                      <p className="text-xs font-kalam font-bold text-slate-600">
                        {project.targetDate ? format(new Date(project.targetDate), 'MMM dd, yyyy') : 'No goal set'}
                      </p>
                   </div>
                   {daysLeft !== null && (
                      <div className={`px-2 py-1 rounded text-[10px] font-bold font-kalam ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                        {isOverdue ? `${Math.abs(daysLeft)}d Overdue` : `${daysLeft}d Left`}
                      </div>
                   )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {project.techStack.map(tech => (
                  <span key={tech} className="px-2 py-1 bg-slate-100 border border-[#2d2d2d]/5 rounded text-[10px] font-kalam text-slate-600 uppercase tracking-tighter">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Detailed Controls Section */}
        <div className="bg-white border-2 border-[#2d2d2d] rounded-3xl p-6 shadow-sm min-h-[500px]">
           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex w-full bg-[#f5f0e6] p-1 border border-[#e0e0e0] rounded-xl overflow-x-auto hide-scrollbar mb-6">
                <TabsTrigger value="overview" className="flex-1 font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Overview</TabsTrigger>
                <TabsTrigger value="tasks" className="flex-1 font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Tasks</TabsTrigger>
                <TabsTrigger value="team" className="flex-1 font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Team</TabsTrigger>
                <TabsTrigger value="code" className="flex-1 font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Code & Debt</TabsTrigger>
                {(project.type === 'freelance' || project.type === 'side_hustle' || project.earnings) && (
                  <TabsTrigger value="finance" className="flex-1 font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Finance</TabsTrigger>
                )}
                <TabsTrigger value="timelog" className="flex-1 font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Time Log</TabsTrigger>
                <TabsTrigger value="standup" className="flex-1 font-kalam text-xs data-[state=active]:bg-[#2d2d2d] data-[state=active]:text-[#fdfbf7] rounded-lg">Standups</TabsTrigger>
              </TabsList>

              <div className="mt-2">
                <TabsContent value="overview" className="focus-visible:outline-none">
                  <ProjectOverviewTab project={project} onUpdate={onUpdate} milestones={milestones} tasksDone={tasksDone} msDone={msDone} isOverdue={isOverdue} daysLeft={daysLeft} healthScore={healthScore} healthLabel={healthLabel} healthColor={healthColor} typeConfig={typeConfig} />
                </TabsContent>

                <TabsContent value="tasks" className="focus-visible:outline-none">
                  <ProjectTasksTab project={project} onUpdate={onUpdate} teamMembers={teamMembers} />
                </TabsContent>

                <TabsContent value="team" className="focus-visible:outline-none">
                  <ProjectTeamTab project={project} onUpdate={onUpdate} teamMembers={teamMembers} />
                </TabsContent>

                <TabsContent value="code" className="focus-visible:outline-none">
                  <ProjectCodeTab project={project} onUpdate={onUpdate} techDebts={techDebts} />
                </TabsContent>

                <TabsContent value="finance" className="focus-visible:outline-none">
                  <ProjectFinanceTab project={project} onUpdate={onUpdate} invoices={invoices} />
                </TabsContent>

                <TabsContent value="timelog" className="focus-visible:outline-none">
                  <ProjectTimeLogTab project={project} onUpdate={onUpdate} timeLogs={timeLogs} />
                </TabsContent>

                <TabsContent value="standup" className="focus-visible:outline-none">
                  <ProjectStandupsTab project={project} onUpdate={onUpdate} standups={standups} />
                </TabsContent>
              </div>
           </Tabs>
        </div>

      </div>
    </div>
  );
}
