import React, { useState } from 'react';
import { Project } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CheckCircle2, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface ProjectTasksTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  teamMembers: { id: string, name: string, role: string }[];
}

export function ProjectTasksTab({ project, onUpdate, teamMembers }: ProjectTasksTabProps) {
  const [newTask, setNewTask] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const addTask = () => {
    if (!newTask.trim()) return;
    onUpdate({ tasks: [...project.tasks, { id: `pt-${Date.now()}`, title: newTask, completed: false, assignee: newTaskAssignee || undefined }] });
    setNewTask(''); setNewTaskAssignee('');
    toast.success('Task added! ✨');
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = project.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date() : undefined } : t);
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
    onUpdate({ tasks: updatedTasks, progress });
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
    onUpdate({ tasks: updatedTasks, progress });
    toast.success('Task removed');
  };

  const tasksDone = project.tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-4 pt-4">
      <div className="flex gap-2">
        <Input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add task..." className="journal-input flex-1" onKeyDown={e => e.key === 'Enter' && addTask()} />
        <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee} disabled={teamMembers.length === 0}>
          <SelectTrigger className="journal-input w-40 text-xs font-kalam">
            <SelectValue placeholder={teamMembers.length === 0 ? "No team added" : "Assign to..."} />
          </SelectTrigger>
          <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
            {teamMembers.map(tm => (
              <SelectItem key={tm.id} value={tm.name}>{tm.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={addTask} className="journal-btn-primary"><Plus className="w-4 h-4" /></Button>
      </div>
      
      {/* Tasks summary */}
      {project.tasks.length > 0 && (
        <div className="flex items-center gap-3 text-xs font-kalam">
          <span className="text-green-600 font-bold">{tasksDone} done</span>
          <span className="text-slate-400">·</span>
          <span className="text-amber-600 font-bold">{project.tasks.length - tasksDone} remaining</span>
          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden ml-2">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${project.tasks.length > 0 ? (tasksDone / project.tasks.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}
      
      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-2">
        {project.tasks.length === 0 ? <p className="text-center text-slate-400 py-8 font-kalam">No tasks yet. Break it down!</p> : (
          project.tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 p-3 bg-white border border-[#e8dac0] rounded-xl hover:shadow-sm transition-all group">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'}`}
                onClick={() => toggleTask(task.id)}>
                {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className={`font-kalam text-sm ${task.completed ? 'line-through text-slate-400' : 'text-[#2d2d2d]'}`}>{task.title}</span>
              {task.assignee && (
                <Badge variant="outline" className="font-kalam text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 px-1.5 py-0 h-5 ml-2">
                  <User className="w-3 h-3 mr-1" /> {task.assignee}
                </Badge>
              )}
              <div className="flex-1" />
              {task.completedAt && <span className="font-kalam text-[10px] text-slate-400">{format(new Date(task.completedAt), 'MMM d, h:mm a')}</span>}
              <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
