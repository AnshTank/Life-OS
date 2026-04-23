import React, { useState } from 'react';
import { Project } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { encodeTimeLog } from '@/utils/projectParsers';

interface ProjectTimeLogTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  timeLogs: { id: string; date: string; hours: number; desc: string }[];
}

export function ProjectTimeLogTab({ project, onUpdate, timeLogs }: ProjectTimeLogTabProps) {
  const [logHours, setLogHours] = useState('');
  const [logDesc, setLogDesc] = useState('');

  const addManualTimeLog = () => {
    const h = parseFloat(logHours);
    if (!h || h <= 0) { toast.error('Enter valid hours'); return; }
    const logEntry = encodeTimeLog(`tl-${Date.now()}`, new Date().toISOString(), h, logDesc.trim() || 'Manual entry');
    onUpdate({ hoursSpent: project.hoursSpent + h, notes: [...project.notes, logEntry] });
    setLogHours(''); setLogDesc('');
    toast.success(`${h}h logged!`);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="font-caveat text-2xl font-bold text-blue-600">{project.hoursSpent.toFixed(1)}h</p>
          <p className="font-kalam text-[11px] text-blue-600">Total Hours</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <p className="font-caveat text-2xl font-bold text-purple-600">{timeLogs.length}</p>
          <p className="font-kalam text-[11px] text-purple-600">Log Entries</p>
        </div>
      </div>

      {/* Manual log */}
      <div className="bg-white border border-[#e8dac0] rounded-xl p-4">
        <h4 className="font-kalam text-sm font-bold mb-2">Log Time Manually</h4>
        <div className="flex gap-2">
          <Input type="number" step="0.25" value={logHours} onChange={e => setLogHours(e.target.value)} placeholder="Hours..." className="journal-input w-24" />
          <Input value={logDesc} onChange={e => setLogDesc(e.target.value)} placeholder="What did you work on?" className="journal-input flex-1" onKeyDown={e => e.key === 'Enter' && addManualTimeLog()} />
          <Button onClick={addManualTimeLog} className="journal-btn-primary"><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Time log history */}
      <div className="space-y-1.5">
        {timeLogs.length === 0 ? (
          <p className="text-center text-slate-400 py-6 font-kalam text-sm">No time entries yet. Use the timer or log manually above.</p>
        ) : (
          [...timeLogs].reverse().map(log => (
            <div key={log.id} className="flex items-center gap-3 p-3 bg-white border border-[#e8dac0] rounded-lg">
              <Clock className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-kalam text-sm text-[#2d2d2d]">{log.desc}</p>
                <p className="font-kalam text-[10px] text-slate-400">
                  {log.date.includes('T') ? format(new Date(log.date), 'MMM d, h:mm a') : format(new Date(log.date), 'MMM d, yyyy')}
                </p>
              </div>
              <span className="font-caveat text-lg font-bold text-blue-600 shrink-0">{log.hours}h</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
