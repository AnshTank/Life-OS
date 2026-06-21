import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, AlertTriangle, Search, Filter, Cpu, 
  ChevronDown, RefreshCw, BarChart2, ShieldAlert, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Project } from '@/types';

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

interface ProjectMistakesTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

const severityConfig: Record<string, { label: string; bg: string; color: string }> = {
  low: { label: '🟢 Low', bg: 'bg-green-50', color: 'text-green-700' },
  medium: { label: '🟡 Medium', bg: 'bg-amber-50', color: 'text-amber-700' },
  high: { label: '🟠 High', bg: 'bg-orange-50', color: 'text-orange-700' },
  critical: { label: '🔴 Critical', bg: 'bg-red-50', color: 'text-red-700' },
};

const categoryConfig: Record<string, string> = {
  requirement: '📋 Requirement Error',
  testing: '🧪 Testing Error',
  deployment: '🚀 Deployment Error',
  communication: '🗣️ Communication Error',
  technical: '💻 Technical Error',
};

export function ProjectMistakesTab({ project, onUpdate }: ProjectMistakesTabProps) {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [category, setCategory] = useState('technical');
  const [preventionStrategy, setPreventionStrategy] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const loadMistakes = async () => {
    try {
      const res = await fetch(`/api/mistakes?projectId=${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setMistakes(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMistakes();
  }, [project.id]);

  const filteredMistakes = useMemo(() => {
    return mistakes.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [mistakes, searchQuery, filterCategory]);

  const handleAddMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      const res = await fetch('/api/mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, rootCause, severity, category, preventionStrategy,
          projectId: project.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMistakes(prev => [data, ...prev]);
        setIsAddOpen(false);
        // Reset form
        setTitle('');
        setDescription('');
        setRootCause('');
        setSeverity('medium');
        setCategory('technical');
        setPreventionStrategy('');
        toast.success('Mistake logged! Let\'s learn from it. 💡');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to log mistake');
    }
  };

  // Run AI Pattern Analysis
  const runAiAnalysis = async () => {
    if (mistakes.length === 0) {
      toast.error('Log some mistakes first to generate pattern analysis.');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-mistakes',
          mistakes: mistakes.map(m => ({ title: m.title, category: m.category, rootCause: m.rootCause }))
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiReport(data);
        toast.success('AI Pattern Analysis complete! 🧠');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Category statistics counts
  const categoryStats = useMemo(() => {
    const counts = { requirement: 0, testing: 0, deployment: 0, communication: 0, technical: 0 };
    mistakes.forEach(m => {
      if (counts.hasOwnProperty(m.category)) {
        (counts as any)[m.category]++;
      }
    });
    return counts;
  }, [mistakes]);

  return (
    <div className="pt-2 space-y-4">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-caveat text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" /> Mistake Journal
          </h3>
          <p className="font-kalam text-xs text-slate-500">Log errors, identify recurring patterns, and establish prevention habits.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={runAiAnalysis} disabled={isAiLoading} size="sm" className="h-9 font-kalam text-xs border border-[#2d2d2d] bg-white text-[#2d2d2d] hover:bg-slate-50 shadow-sm">
            {isAiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <BarChart2 className="w-3.5 h-3.5 text-amber-600 mr-1.5" />}
            AI Trend Report
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="journal-btn-primary h-9"><Plus className="w-4 h-4 mr-1.5" /> Log Mistake</Button>
        </div>
      </div>

      {/* Visual Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(categoryConfig).map(([key, label]) => {
          const count = (categoryStats as any)[key] || 0;
          return (
            <div key={key} className="bg-white border-2 border-[#2d2d2d]/10 rounded-xl p-3 text-center shadow-sm">
              <p className="font-caveat text-3xl font-bold text-[#2d2d2d]">{count}</p>
              <p className="font-kalam text-[10px] text-slate-500 truncate">{label}</p>
            </div>
          );
        })}
      </div>

      {/* AI Trend report panel */}
      {aiReport && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-amber-50/20 border-2 border-dashed border-amber-300 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800 border-b border-amber-200 pb-1.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h4 className="font-caveat text-2xl font-bold">AI Prevention Strategy Report</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-kalam text-xs text-slate-700">
            <div>
              <span className="font-bold text-slate-800 block mb-1">Patterns Detected:</span>
              <ul className="list-disc pl-4 space-y-1">
                {aiReport.patternsDetected?.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div>
              <span className="font-bold text-slate-800 block mb-1">Trend Alarms:</span>
              <ul className="list-disc pl-4 space-y-1">
                {aiReport.trendAlerts?.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div>
              <span className="font-bold text-slate-800 block mb-1">Mitigation Checklist:</span>
              <ul className="list-disc pl-4 space-y-1">
                {aiReport.mitigationPlan?.map((item: string, i: number) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 bg-white border border-[#2d2d2d]/10 rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search mistakes, root causes..." 
            className="pl-8 journal-input h-9 text-xs" 
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48 journal-input h-9 text-xs font-kalam">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d] font-kalam">
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mistake Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMistakes.map(m => {
          const sev = severityConfig[m.severity] || severityConfig.medium;
          return (
            <div key={m.id} className="bg-white border-2 border-[#2d2d2d] rounded-2xl p-4 shadow-[3px_3px_0px_rgba(45,45,45,1)] flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-caveat text-xl font-bold text-[#2d2d2d]">{m.title}</h4>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge variant="outline" className={`font-kalam text-[9px] ${sev.bg} ${sev.color}`}>{sev.label}</Badge>
                    <Badge variant="outline" className="font-kalam text-[9px] bg-slate-50">{categoryConfig[m.category] || m.category}</Badge>
                  </div>
                </div>
                <p className="font-kalam text-xs text-slate-500 leading-tight">{m.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#2d2d2d]/10 font-kalam text-[11px] text-slate-600">
                <div>
                  <span className="font-bold block text-slate-700">Root Cause</span>
                  <p className="line-clamp-2 leading-none italic">{m.rootCause || 'None stated'}</p>
                </div>
                <div>
                  <span className="font-bold block text-slate-700">Prevention Strategy</span>
                  <p className="line-clamp-2 leading-none italic">{m.preventionStrategy || 'None stated'}</p>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMistakes.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
            <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-kalam text-sm text-slate-400 italic">No mistakes logged under this category.</p>
          </div>
        )}
      </div>

      {/* Log mistake dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="journal-modal max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-caveat text-2xl">Log Journal Mistake</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMistake} className="space-y-4 font-kalam text-sm">
            <div>
              <label className="font-bold mb-1 block">Mistake Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Forgot payment status check on checkout" className="journal-input" />
            </div>

            <div>
              <label className="font-bold mb-1 block">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What went wrong?" className="journal-input min-h-[60px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold mb-1 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="journal-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d] font-kalam">
                    {Object.entries(categoryConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-bold mb-1 block">Severity</label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="journal-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d] font-kalam">
                    {Object.entries(severityConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="font-bold mb-1 block">Root Cause</label>
              <Textarea value={rootCause} onChange={e => setRootCause(e.target.value)} placeholder="Why did this happen?" className="journal-input min-h-[50px]" />
            </div>

            <div>
              <label className="font-bold mb-1 block">Prevention Strategy</label>
              <Textarea value={preventionStrategy} onChange={e => setPreventionStrategy(e.target.value)} placeholder="How will we prevent this next time?" className="journal-input min-h-[50px]" />
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" className="journal-btn-primary flex-1">Save Log</Button>
              <Button type="button" onClick={() => setIsAddOpen(false)} variant="outline" className="journal-btn">Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
