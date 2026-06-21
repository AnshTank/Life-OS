"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle2, 
  HelpCircle, Sparkles, BookOpen, BarChart2, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { format, subDays, isAfter } from 'date-fns';

interface Mistake {
  id: string;
  title: string;
  description: string;
  rootCause: string;
  severity: string; // low, medium, high, critical
  category: string; // requirement, testing, deployment, communication, technical
  preventionStrategy: string;
  createdAt: string;
}

export default function FullProjectMistakesPage() {
  const { id: projectId } = useParams();
  const router = useRouter();
  const { projects } = useApp();

  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [category, setCategory] = useState('technical');
  const [preventionStrategy, setPreventionStrategy] = useState('');

  const project = useMemo(() => {
    return projects.find(p => p.id === projectId || p.slug === projectId) || null;
  }, [projects, projectId]);

  const loadMistakes = async () => {
    if (!project) return;
    try {
      setIsPageLoading(true);
      const res = await fetch(`/api/mistakes?projectId=${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setMistakes(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load mistakes');
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    if (project) {
      loadMistakes();
    } else {
      setIsPageLoading(false);
    }
  }, [project]);

  const handleAddMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !project) return;

    try {
      const res = await fetch('/api/mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          rootCause,
          severity,
          category,
          preventionStrategy,
          projectId: project.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMistakes(prev => [data, ...prev]);
        toast.success('Mistake logged in journal! 📝');
        
        // Reset form
        setTitle('');
        setDescription('');
        setRootCause('');
        setSeverity('medium');
        setCategory('technical');
        setPreventionStrategy('');
      } else {
        toast.error('Failed to create mistake');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error logging mistake');
    }
  };

  const handleDeleteMistake = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mistake entry?')) return;
    try {
      const res = await fetch(`/api/mistakes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMistakes(prev => prev.filter(m => m.id !== id));
        toast.success('Mistake log deleted');
      } else {
        toast.error('Failed to delete mistake');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting mistake');
    }
  };

  // Severity configurations
  const severityColors: Record<string, string> = {
    low: '#3b82f6',     // blue
    medium: '#f59e0b',  // amber
    high: '#ea580c',    // orange
    critical: '#ef4444' // red
  };

  const categoryLabels: Record<string, string> = {
    technical: 'Technical Code',
    requirement: 'Requirements Gap',
    testing: 'QA Testing Gap',
    deployment: 'Deployment guardian',
    communication: 'Client Communication'
  };

  // Pie chart: Severity distribution
  const severityChartData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    mistakes.forEach(m => {
      const sev = m.severity.toLowerCase();
      if (sev in counts) {
        (counts as any)[sev]++;
      }
    });

    return [
      { name: 'Low Severity', value: counts.low, color: '#3b82f6' },
      { name: 'Medium Severity', value: counts.medium, color: '#f59e0b' },
      { name: 'High Severity', value: counts.high, color: '#ea580c' },
      { name: 'Critical Severity', value: counts.critical, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [mistakes]);

  // Line chart: Mistake count trends (past 7 days)
  const lineChartData = useMemo(() => {
    const days = [];
    const counts: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const dateStr = format(subDays(new Date(), i), 'MMM dd');
      days.push(dateStr);
      counts[dateStr] = 0;
    }

    mistakes.forEach(m => {
      const dateStr = format(new Date(m.createdAt), 'MMM dd');
      if (dateStr in counts) {
        counts[dateStr]++;
      }
    });

    return days.map(day => ({
      day,
      count: counts[day]
    }));
  }, [mistakes]);

  // Weekly mistakes summary
  const weeklyMistakesCount = useMemo(() => {
    const oneWeekAgo = subDays(new Date(), 7);
    return mistakes.filter(m => isAfter(new Date(m.createdAt), oneWeekAgo)).length;
  }, [mistakes]);

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fefdfb]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d2d2d]"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#fefdfb] flex flex-col items-center justify-center p-8">
        <h2 className="font-caveat text-3xl font-bold text-[#2d2d2d] mb-4">Project Not Found</h2>
        <Button onClick={() => router.push('/projects')} className="journal-btn-primary">Back to Projects</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefdfb] p-4 md:p-6 pt-20 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-4">
        
        {/* Navigation & Title */}
        <div className="flex items-center justify-between pb-2 border-b border-[#2d2d2d]/10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="font-kalam text-slate-500 hover:text-[#2d2d2d]" asChild>
              <Link href={`/projects/${project.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
              </Link>
            </Button>
            <h1 className="font-caveat text-3xl font-bold text-[#2d2d2d]">
              {project.title} / <span className="text-red-700">Mistake Journal</span>
            </h1>
          </div>
          <Badge className="font-kalam bg-red-50 text-red-800 border-2 border-red-500/20 px-3 py-1 rounded-full text-xs">
            Failure Prevention ledger
          </Badge>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* COLUMN 1: Log form (col-span-5) */}
          <div className="lg:col-span-5 bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 shadow-[4px_4px_0px_rgba(45,45,45,1)] flex flex-col justify-between">
            <form onSubmit={handleAddMistake} className="space-y-4">
              <h3 className="font-caveat text-2xl font-bold text-[#2d2d2d] flex items-center gap-1.5 border-b pb-2">
                <BookOpen className="w-5 h-5 text-red-500" /> Log a Project Mistake
              </h3>
              
              <div className="space-y-1">
                <label className="font-kalam text-xs font-bold text-slate-500">Mistake Summary</label>
                <Input 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Broken database indexes, typo in Stripe webhook URL" 
                  className="journal-input text-xs h-9 bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-kalam text-xs font-bold text-slate-500">Description</label>
                <Textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what occurred, and what files/functions were affected..." 
                  className="journal-input min-h-[70px] text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-kalam text-xs font-bold text-slate-500">Root Cause</label>
                <Textarea 
                  value={rootCause}
                  onChange={e => setRootCause(e.target.value)}
                  placeholder="Why did it happen? (e.g. lack of local verification, copy-paste error)" 
                  className="journal-input min-h-[60px] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-kalam text-xs font-bold text-slate-500">Severity</label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="h-9 text-xs font-kalam border-[#2d2d2d]/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d] font-kalam">
                      <SelectItem value="low">Low (UI/Minor)</SelectItem>
                      <SelectItem value="medium">Medium (Flow Block)</SelectItem>
                      <SelectItem value="high">High (Data Loss/API Bug)</SelectItem>
                      <SelectItem value="critical">Critical (Crash/Security)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="font-kalam text-xs font-bold text-slate-500">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-9 text-xs font-kalam border-[#2d2d2d]/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d] font-kalam">
                      <SelectItem value="technical">Technical Code</SelectItem>
                      <SelectItem value="requirement">Requirements Gap</SelectItem>
                      <SelectItem value="testing">QA Testing Gap</SelectItem>
                      <SelectItem value="deployment">Deployment Check</SelectItem>
                      <SelectItem value="communication">Client Comms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-kalam text-xs font-bold text-slate-500">Action Plan (How to prevent repeat)</label>
                <Textarea 
                  value={preventionStrategy}
                  onChange={e => setPreventionStrategy(e.target.value)}
                  placeholder="e.g. Add validation test case in QA check, use env validation script..." 
                  className="journal-input min-h-[70px] text-xs"
                />
              </div>

              <Button type="submit" className="w-full journal-btn-primary flex items-center justify-center gap-1.5 pt-2">
                <Plus className="w-4 h-4" /> Log Entry in Journal
              </Button>
            </form>
          </div>

          {/* COLUMN 2: Analytics & Mistake List (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_rgba(45,45,45,1)]">
                <CardContent className="p-4 text-center">
                  <span className="font-caveat text-3xl font-bold text-slate-800">{mistakes.length}</span>
                  <span className="font-kalam text-[10px] text-slate-500 block uppercase font-bold mt-1">Total Logs</span>
                </CardContent>
              </Card>
              <Card className="bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_rgba(45,45,45,1)]">
                <CardContent className="p-4 text-center">
                  <span className="font-caveat text-3xl font-bold text-red-600">{weeklyMistakesCount}</span>
                  <span className="font-kalam text-[10px] text-slate-500 block uppercase font-bold mt-1">Logged (7 Days)</span>
                </CardContent>
              </Card>
              <Card className="bg-white border-2 border-[#2d2d2d] shadow-[3px_3px_0px_rgba(45,45,45,1)]">
                <CardContent className="p-4 text-center">
                  <span className="font-caveat text-3xl font-bold text-amber-600">
                    {mistakes.filter(m => m.severity === 'critical' || m.severity === 'high').length}
                  </span>
                  <span className="font-kalam text-[10px] text-slate-500 block uppercase font-bold mt-1">High/Critical</span>
                </CardContent>
              </Card>
            </div>

            {/* Interactive Charts card */}
            <Card className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_rgba(45,45,45,1)] flex-1">
              <CardHeader className="p-4 pb-2 border-b border-[#2d2d2d]/10 flex flex-row items-center gap-2">
                <BarChart2 className="w-5 h-5 text-amber-600" />
                <CardTitle className="font-caveat text-xl font-bold">Failure Trends & severity metrics</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Severity Pie Chart */}
                <div className="h-[200px] flex flex-col justify-between">
                  <span className="font-kalam text-[11px] font-bold text-slate-500 block text-center mb-1">Severity Distribution</span>
                  {severityChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                        >
                          {severityChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontFamily: 'Kalam', fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex-1 flex items-center justify-center font-kalam text-xs text-slate-400 italic">No severity data</div>
                  )}
                  {severityChartData.length > 0 && (
                    <div className="flex justify-center gap-3 text-[9px] font-kalam font-bold mt-1 flex-wrap">
                      {severityChartData.map(item => (
                        <span key={item.name} className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Counts Line Chart */}
                <div className="h-[200px] flex flex-col justify-between">
                  <span className="font-kalam text-[11px] font-bold text-slate-500 block text-center mb-1">Mistakes Logged Trends</span>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d10" />
                      <XAxis dataKey="day" tick={{ fontFamily: 'Kalam', fontSize: 9 }} stroke="#2d2d2d50" />
                      <YAxis tick={{ fontFamily: 'Kalam', fontSize: 9 }} stroke="#2d2d2d50" allowDecimals={false} />
                      <Tooltip contentStyle={{ fontFamily: 'Kalam', fontSize: 11 }} />
                      <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

              </CardContent>
            </Card>

            {/* List of journal entries */}
            <Card className="bg-white border-2 border-[#2d2d2d] shadow-[4px_4px_0px_rgba(45,45,45,1)] max-h-[300px] overflow-y-auto custom-pencil-scrollbar">
              <CardHeader className="p-4 pb-2 border-b border-[#2d2d2d]/10 flex flex-row items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <CardTitle className="font-caveat text-xl font-bold">Logged Mistakes History</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5">
                {mistakes.map((m) => (
                  <div key={m.id} className="p-3 bg-[#fdfbf7]/40 border-2 border-[#2d2d2d]/10 rounded-xl relative hover:border-[#2d2d2d]/30 transition-all">
                    
                    {/* Delete button */}
                    <button 
                      onClick={() => handleDeleteMistake(m.id)}
                      className="absolute right-3 top-3 p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all border border-transparent hover:border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="pr-8 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="font-kalam text-[9px] uppercase font-bold text-white" style={{ backgroundColor: severityColors[m.severity] || '#94a3b8' }}>
                          {m.severity}
                        </Badge>
                        <Badge variant="outline" className="font-kalam text-[9px] border-[#2d2d2d]/25 text-slate-600 bg-slate-50">
                          {categoryLabels[m.category] || m.category}
                        </Badge>
                        <span className="font-kalam text-[10px] text-slate-400">{format(new Date(m.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                      
                      <h4 className="font-caveat text-xl font-bold text-[#2d2d2d] leading-none">{m.title}</h4>
                      
                      {m.description && (
                        <p className="font-kalam text-xs text-slate-600 leading-snug">{m.description}</p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#2d2d2d]/5 text-[11px] font-kalam">
                        <div>
                          <span className="font-bold text-amber-800 block">Root Cause:</span>
                          <span className="text-slate-600">{m.rootCause || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="font-bold text-green-800 block">Prevention Protocol:</span>
                          <span className="text-slate-600">{m.preventionStrategy || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}

                {mistakes.length === 0 && (
                  <p className="font-kalam text-xs text-slate-400 italic text-center py-12">No mistakes logged in journal yet.</p>
                )}
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
}
