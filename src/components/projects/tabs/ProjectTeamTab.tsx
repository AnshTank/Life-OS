import React, { useState } from 'react';
import { Project } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { encodeTeamMember } from '@/utils/projectParsers';

interface ProjectTeamTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  teamMembers: { id: string; name: string; role: string }[];
}

export function ProjectTeamTab({ project, onUpdate, teamMembers }: ProjectTeamTabProps) {
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  const addTeamMember = () => {
    if (!newMemberName.trim()) return;
    const entry = encodeTeamMember(`tm-${Date.now()}`, newMemberName.trim(), newMemberRole || 'Developer');
    onUpdate({ notes: [...project.notes, entry] });
    setNewMemberName(''); setNewMemberRole('');
    toast.success('Team member added! 👥');
  };

  const removeTeamMember = (id: string) => {
    const updatedNotes = project.notes.filter(n => {
      if (!n.startsWith('👥|')) return true;
      const [, memberId] = n.split('|');
      return memberId !== id;
    });
    onUpdate({ notes: updatedNotes });
    toast.success('Team member removed');
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="bg-white border-2 border-[#e8dac0] rounded-xl p-4">
        <h4 className="font-caveat text-lg font-bold mb-3 flex items-center gap-2"><User className="w-5 h-5 text-indigo-500" /> Build Your Team</h4>
        <div className="flex gap-2">
          <Input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Name (e.g. Alex)" className="journal-input flex-1" onKeyDown={e => e.key === 'Enter' && addTeamMember()} />
          <Input value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} placeholder="Role (e.g. Lead)" className="journal-input w-32 font-kalam text-xs" onKeyDown={e => e.key === 'Enter' && addTeamMember()} />
          <Button onClick={addTeamMember} className="journal-btn-primary"><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="space-y-3">
        {teamMembers.length === 0 ? <p className="text-center text-slate-400 py-6 font-kalam text-sm">No team members yet. Add someone!</p> : (
          teamMembers.map(tm => {
            const memberTasks = project.tasks.filter(t => t.assignee === tm.name);
            const completedMemberTasks = memberTasks.filter(t => t.completed).length;
            const workloadProgress = memberTasks.length > 0 ? Math.round((completedMemberTasks / memberTasks.length) * 100) : 0;
            
            return (
              <div key={tm.id} className="bg-[#f9f7f4] border border-[#e8dac0] rounded-xl p-3 flex flex-col gap-3 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center text-indigo-700 font-bold font-kalam">
                      {tm.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-kalam font-bold text-sm text-[#2d2d2d] leading-none">{tm.name}</p>
                      <span className="font-kalam text-[10px] text-slate-500">{tm.role}</span>
                    </div>
                  </div>
                  <button onClick={() => removeTeamMember(tm.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
                
                {/* Workload Matrix */}
                <div className="bg-white rounded-lg p-2 border border-[#e8dac0]">
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-kalam text-[10px] font-bold text-slate-500">Workload: {completedMemberTasks}/{memberTasks.length} tasks</span>
                    <span className="font-kalam text-[10px] font-bold text-indigo-600">{workloadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${workloadProgress}%` }} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
