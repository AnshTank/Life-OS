import React, { useState, useMemo, useCallback } from 'react';
import { Project } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CheckCircle2, Trash2, Users, Filter, Calendar, Flag, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface ProjectTasksTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  teamMembers: { id: string, name: string, role: string }[];
}

const priorityConfig = {
  urgent: { label: 'Urgent', color: '#ef4444', bg: 'bg-red-50 border-red-200 text-red-700' },
  high: { label: 'High', color: '#f59e0b', bg: 'bg-amber-50 border-amber-200 text-amber-700' },
  medium: { label: 'Medium', color: '#3b82f6', bg: 'bg-blue-50 border-blue-200 text-blue-700' },
  low: { label: 'Low', color: '#6b7280', bg: 'bg-slate-50 border-slate-200 text-slate-600' },
};

export function ProjectTasksTab({ project, onUpdate, teamMembers }: ProjectTasksTabProps) {
  const [newTask, setNewTask] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done'>('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAssignee = useCallback((name: string) => {
    setSelectedAssignees(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  }, []);

  const addTask = useCallback(() => {
    if (!newTask.trim()) return;
    const task = {
      id: `pt-${Date.now()}`,
      title: newTask.trim(),
      completed: false,
      assignees: selectedAssignees.length > 0 ? selectedAssignees : undefined,
      assignee: selectedAssignees.length === 1 ? selectedAssignees[0] : undefined,
      priority: newPriority,
      dueDate: newDueDate ? new Date(newDueDate) : undefined,
    };
    onUpdate({ tasks: [...project.tasks, task] });
    setNewTask('');
    setSelectedAssignees([]);
    setNewDueDate('');
    setShowAdvanced(false);
    toast.success('Task added! ✨');
  }, [newTask, selectedAssignees, newPriority, newDueDate, project.tasks, onUpdate]);

  const toggleTask = useCallback((taskId: string) => {
    const updatedTasks = project.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date() : undefined } : t
    );
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
    onUpdate({ tasks: updatedTasks, progress });
  }, [project.tasks, onUpdate]);

  const deleteTask = useCallback((taskId: string) => {
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const progress = updatedTasks.length > 0 ? Math.round((completedCount / updatedTasks.length) * 100) : 0;
    onUpdate({ tasks: updatedTasks, progress });
    toast.success('Task removed');
  }, [project.tasks, onUpdate]);

  const filteredTasks = useMemo(() => {
    let tasks = [...project.tasks];
    if (filterStatus === 'pending') tasks = tasks.filter(t => !t.completed);
    if (filterStatus === 'done') tasks = tasks.filter(t => t.completed);
    if (filterAssignee !== 'all') {
      tasks = tasks.filter(t => {
        const assignees = t.assignees || (t.assignee ? [t.assignee] : []);
        return assignees.includes(filterAssignee);
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q));
    }
    // Sort: incomplete first, then by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (priorityOrder[a.priority || 'medium'] || 2) - (priorityOrder[b.priority || 'medium'] || 2);
    });
    return tasks;
  }, [project.tasks, filterStatus, filterAssignee, searchQuery]);

  const tasksDone = project.tasks.filter(t => t.completed).length;
  const getAssignees = (task: typeof project.tasks[0]) => task.assignees || (task.assignee ? [task.assignee] : []);

  return (
    <div className="space-y-4 pt-4">
      {/* Add Task */}
      <div className="bg-white border-2 border-[#e8dac0] rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="Add task..."
            className="journal-input flex-1"
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
          <Button onClick={() => setShowAdvanced(!showAdvanced)} variant="outline" className="journal-btn px-2">
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button onClick={addTask} className="journal-btn-primary"><Plus className="w-4 h-4" /></Button>
        </div>

        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-dashed border-[#e8dac0]">
            {/* Multi-Assignee Chips */}
            <div>
              <label className="font-kalam text-xs text-slate-500 mb-1.5 block">Assign to (multi-select)</label>
              {teamMembers.length === 0 ? (
                <p className="font-kalam text-xs text-slate-400 italic">Add team members in the Team tab first</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {teamMembers.map(tm => {
                    const isSelected = selectedAssignees.includes(tm.name);
                    return (
                      <button
                        key={tm.id}
                        type="button"
                        onClick={() => toggleAssignee(tm.name)}
                        className={`px-2.5 py-1 rounded-full text-xs font-kalam border-2 transition-all ${
                          isSelected
                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {tm.name} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Priority */}
              <div>
                <label className="font-kalam text-xs text-slate-500 mb-1 block">Priority</label>
                <Select value={newPriority} onValueChange={(v) => setNewPriority(v as any)}>
                  <SelectTrigger className="journal-input text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                    {Object.entries(priorityConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Due Date */}
              <div>
                <label className="font-kalam text-xs text-slate-500 mb-1 block">Due Date</label>
                <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="journal-input text-xs" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary + Filters */}
      {project.tasks.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-3 text-xs font-kalam flex-1">
            <span className="text-green-600 font-bold">{tasksDone} done</span>
            <span className="text-slate-400">·</span>
            <span className="text-amber-600 font-bold">{project.tasks.length - tasksDone} remaining</span>
            <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden ml-2 max-w-[120px]">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${project.tasks.length > 0 ? (tasksDone / project.tasks.length) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="journal-input text-xs h-7 pl-6 w-28" />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="journal-input text-[10px] h-7 w-20 px-2"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            {teamMembers.length > 0 && (
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="journal-input text-[10px] h-7 w-24 px-2"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  <SelectItem value="all">Everyone</SelectItem>
                  {teamMembers.map(tm => (
                    <SelectItem key={tm.id} value={tm.name}>{tm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-2">
        {filteredTasks.length === 0 ? (
          <p className="text-center text-slate-400 py-8 font-kalam">
            {project.tasks.length === 0 ? 'No tasks yet. Break it down!' : 'No tasks match your filters.'}
          </p>
        ) : (
          filteredTasks.map(task => {
            const assignees = getAssignees(task);
            const prio = task.priority || 'medium';
            const prioConf = priorityConfig[prio];
            return (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-white border border-[#e8dac0] rounded-xl hover:shadow-sm transition-all group">
                {/* Priority indicator */}
                <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: prioConf.color }} />

                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'
                  }`}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className={`font-kalam text-sm block ${task.completed ? 'line-through text-slate-400' : 'text-[#2d2d2d]'}`}>
                    {task.title}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {/* Assignee badges */}
                    {assignees.map(name => (
                      <Badge key={name} variant="outline" className="font-kalam text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 px-1.5 py-0 h-5">
                        {name}
                      </Badge>
                    ))}
                    {assignees.length > 1 && (
                      <Badge variant="outline" className="font-kalam text-[10px] bg-purple-50 text-purple-600 border-purple-200 px-1.5 py-0 h-5">
                        <Users className="w-2.5 h-2.5 mr-0.5" /> {assignees.length}
                      </Badge>
                    )}
                    {/* Priority badge */}
                    <Badge variant="outline" className={`font-kalam text-[10px] px-1.5 py-0 h-5 ${prioConf.bg}`}>
                      <Flag className="w-2.5 h-2.5 mr-0.5" /> {prioConf.label}
                    </Badge>
                    {/* Due date */}
                    {task.dueDate && (
                      <Badge variant="outline" className="font-kalam text-[10px] bg-slate-50 text-slate-600 border-slate-200 px-1.5 py-0 h-5">
                        <Calendar className="w-2.5 h-2.5 mr-0.5" /> {format(new Date(task.dueDate), 'MMM d')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Completed timestamp */}
                {task.completedAt && (
                  <span className="font-kalam text-[10px] text-slate-400 shrink-0">
                    {format(new Date(task.completedAt), 'MMM d, h:mm a')}
                  </span>
                )}

                {/* Delete */}
                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all shrink-0">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
