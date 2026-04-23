import React, { useState } from 'react';
import { Project } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Github, ExternalLink, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { encodeTechDebt } from '@/utils/projectParsers';

interface ProjectCodeTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  techDebts: { id: string; title: string; severity: string; status: string }[];
}

export function ProjectCodeTab({ project, onUpdate, techDebts }: ProjectCodeTabProps) {
  const [newDebt, setNewDebt] = useState('');
  const [debtSeverity, setDebtSeverity] = useState('medium');

  const addTechDebt = () => {
    if (!newDebt.trim()) return;
    const entry = encodeTechDebt(`td-${Date.now()}`, newDebt.trim(), debtSeverity, 'open');
    onUpdate({ notes: [...project.notes, entry] });
    setNewDebt(''); setDebtSeverity('medium');
    toast.success('Tech debt logged! 🐛');
  };

  const toggleTechDebt = (debtId: string) => {
    const updatedNotes = project.notes.map(n => {
      if (!n.startsWith('🐛|')) return n;
      const [, id, title, severity, status] = n.split('|');
      if (id !== debtId) return n;
      return encodeTechDebt(id, title, severity, status === 'open' ? 'resolved' : 'open');
    });
    onUpdate({ notes: updatedNotes });
  };

  return (
    <div className="space-y-4 pt-4">
      {(project.repositoryUrl || project.demoUrl) ? (
        <div className="grid md:grid-cols-2 gap-4">
          {project.repositoryUrl && (
            <div className="bg-white border border-[#e8dac0] rounded-xl p-4 flex flex-col justify-center items-center gap-2 hover:border-blue-300 transition-colors">
              <Github className="w-8 h-8 text-slate-700" />
              <span className="font-kalam text-sm font-bold text-slate-700">Source Repository</span>
              <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="font-kalam text-xs text-blue-500 hover:underline break-all text-center">
                {project.repositoryUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {project.demoUrl && (
            <div className="bg-white border border-[#e8dac0] rounded-xl p-4 flex flex-col justify-center items-center gap-2 hover:border-purple-300 transition-colors">
              <ExternalLink className="w-8 h-8 text-purple-600" />
              <span className="font-kalam text-sm font-bold text-slate-700">Live Environment</span>
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="font-kalam text-xs text-purple-500 hover:underline break-all text-center">
                {project.demoUrl.replace(/^https?:\/\//, '')}
              </a>
              <Badge className="mt-1 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">🟢 Deployed</Badge>
            </div>
          )}
        </div>
      ) : null}

      <div className="bg-white border-2 border-[#e8dac0] rounded-xl p-4">
        <h4 className="font-caveat text-lg font-bold flex items-center gap-2 mb-3">🐛 Tech Debt & Bugs</h4>
        <div className="flex gap-2 mb-4">
          <Input value={newDebt} onChange={e => setNewDebt(e.target.value)} placeholder="Log a bug or technical debt..." className="journal-input text-sm flex-1" onKeyDown={e => e.key === 'Enter' && addTechDebt()} />
          <Select value={debtSeverity} onValueChange={setDebtSeverity}>
            <SelectTrigger className="journal-input w-[110px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
              <SelectItem value="low">Low Impact</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">Critical Data</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addTechDebt} className="journal-btn-primary" size="sm"><Plus className="w-4 h-4" /></Button>
        </div>

        <div className="space-y-2">
          {techDebts.length === 0 ? <p className="text-center text-slate-400 py-4 font-kalam text-sm">Codebase is clean! No technical debt logged.</p> : (
            techDebts.map(debt => (
              <div key={debt.id} className={`flex items-center gap-3 p-3 rounded-lg border ${debt.status === 'resolved' ? 'bg-[#f8f9fa] border-slate-200 opacity-60' : 'bg-white border-[#e8dac0]'}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${debt.status === 'resolved' ? 'bg-slate-300 border-slate-300' : 'border-slate-400 hover:border-red-400'}`} onClick={() => toggleTechDebt(debt.id)}>
                  {debt.status === 'resolved' && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className={`flex-1 font-kalam text-sm ${debt.status === 'resolved' ? 'line-through text-slate-500' : 'text-[#2d2d2d]'}`}>{debt.title}</span>
                <Badge variant="outline" className={`font-kalam text-[10px] uppercase border px-1.5 py-0 ${debt.severity === 'high' ? 'bg-red-50 text-red-600 border-red-200' : debt.severity === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                  {debt.severity}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
