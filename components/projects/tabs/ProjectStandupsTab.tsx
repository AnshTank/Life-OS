import React, { useState } from 'react';
import { Project } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { encodeStandup } from '@/utils/projectParsers';

interface ProjectStandupsTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  standups: { id: string; date: string; done: string; doing: string; blockers: string }[];
}

export function ProjectStandupsTab({ project, onUpdate, standups }: ProjectStandupsTabProps) {
  const [standupDone, setStandupDone] = useState('');
  const [standupDoing, setStandupDoing] = useState('');
  const [standupBlockers, setStandupBlockers] = useState('');

  const addStandup = () => {
    if (!standupDone.trim() && !standupDoing.trim()) { toast.error('Fill at least one field'); return; }
    const entry = encodeStandup(`su-${Date.now()}`, format(new Date(), 'yyyy-MM-dd'), standupDone.trim(), standupDoing.trim(), standupBlockers.trim());
    onUpdate({ notes: [...project.notes, entry] });
    setStandupDone(''); setStandupDoing(''); setStandupBlockers('');
    toast.success('Standup logged! 📋');
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="bg-white border-2 border-[#e8dac0] rounded-xl p-4 space-y-3">
        <h4 className="font-caveat text-lg font-bold flex items-center gap-2">📋 Daily Standup — {format(new Date(), 'EEEE, MMM d')}</h4>
        <div>
          <label className="font-kalam text-xs font-bold text-green-700 mb-1 block">✅ What I did</label>
          <Textarea value={standupDone} onChange={e => setStandupDone(e.target.value)} placeholder="Completed tasks, shipped features, fixed bugs..." className="journal-input min-h-[50px] text-sm" />
        </div>
        <div>
          <label className="font-kalam text-xs font-bold text-blue-700 mb-1 block">🔨 What I&apos;m doing next</label>
          <Textarea value={standupDoing} onChange={e => setStandupDoing(e.target.value)} placeholder="Today's focus, next tasks..." className="journal-input min-h-[50px] text-sm" />
        </div>
        <div>
          <label className="font-kalam text-xs font-bold text-red-700 mb-1 block">🚧 Blockers</label>
          <Input value={standupBlockers} onChange={e => setStandupBlockers(e.target.value)} placeholder="Anything blocking progress? (optional)" className="journal-input text-sm" />
        </div>
        <Button onClick={addStandup} className="journal-btn-primary w-full">Submit Standup</Button>
      </div>

      <div className="space-y-3">
        {standups.length === 0 ? <p className="text-center text-slate-400 py-4 font-kalam text-sm">No standups yet. Start your first one above!</p> : (
          [...standups].reverse().map(su => (
            <div key={su.id} className="bg-[#f9f7f4] border border-[#e8dac0] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-kalam text-xs font-bold text-[#2d2d2d]">📅 {su.date}</span>
              </div>
              {su.done && <div><span className="font-kalam text-[10px] font-bold text-green-700 uppercase">Done:</span><p className="font-kalam text-sm text-[#2d2d2d] mt-0.5">{su.done}</p></div>}
              {su.doing && <div><span className="font-kalam text-[10px] font-bold text-blue-700 uppercase">Next:</span><p className="font-kalam text-sm text-[#2d2d2d] mt-0.5">{su.doing}</p></div>}
              {su.blockers && <div><span className="font-kalam text-[10px] font-bold text-red-700 uppercase">Blockers:</span><p className="font-kalam text-sm text-red-700 mt-0.5">{su.blockers}</p></div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
