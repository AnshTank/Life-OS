import React, { useState } from 'react';
import { Project } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StickyNote, User, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { encodeStructuredNote } from '@/utils/projectParsers';

interface ProjectNotesTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
  structuredNotes: { id: string; category: string; content: string }[];
}

export function ProjectNotesTab({ project, onUpdate, structuredNotes }: ProjectNotesTabProps) {
  const [newNote, setNewNote] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');

  const addNote = () => {
    if (!newNote.trim()) return;
    onUpdate({ notes: [...project.notes, encodeStructuredNote(noteCategory, newNote)] });
    setNewNote('');
    toast.success('Note added! 📝');
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="bg-white border-2 border-[#e8dac0] rounded-xl p-4">
        <div className="flex gap-2 mb-2">
          <Select value={noteCategory} onValueChange={setNoteCategory}>
            <SelectTrigger className="journal-input w-[140px] text-xs font-bold"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
              <SelectItem value="General">📝 General</SelectItem>
              <SelectItem value="Meeting">👥 Meeting Note</SelectItem>
              <SelectItem value="Architecture">🏗️ Architecture</SelectItem>
              <SelectItem value="Blocker">🚧 Blocker</SelectItem>
              <SelectItem value="Client">🤝 Client</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button onClick={addNote} className="journal-btn-primary" size="sm">Add Note</Button>
        </div>
        <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Jot down a note..." className="journal-input min-h-[60px]" />
      </div>
      
      <div className="grid gap-3">
        {structuredNotes.length === 0 ? <p className="text-center text-slate-400 py-6 font-kalam text-sm">No notes yet.</p> : (
          [...structuredNotes].reverse().map((note) => {
            let bgColor = 'bg-[#fef9e6]'; let borderColor = 'border-[#e8dac0]'; let icon = StickyNote; let iconColor = 'text-amber-400';
            if (note.category === 'Meeting') { bgColor = 'bg-blue-50'; borderColor = 'border-blue-200'; iconColor = 'text-blue-500'; icon = User; }
            else if (note.category === 'Architecture') { bgColor = 'bg-purple-50'; borderColor = 'border-purple-200'; iconColor = 'text-purple-500'; icon = Target; }
            else if (note.category === 'Blocker') { bgColor = 'bg-red-50'; borderColor = 'border-red-200'; iconColor = 'text-red-500'; icon = AlertTriangle; }
            else if (note.category === 'Client') { bgColor = 'bg-emerald-50'; borderColor = 'border-emerald-200'; iconColor = 'text-emerald-500'; icon = CheckCircle2; }
            
            const IconComp = icon;
            return (
              <div key={note.id} className={`p-4 ${bgColor} border ${borderColor} rounded-xl relative shadow-sm`}>
                <div className="flex items-center gap-2 mb-2">
                  <IconComp className={`w-4 h-4 ${iconColor}`} />
                  <span className={`font-kalam text-xs font-bold ${iconColor}`}>{note.category}</span>
                </div>
                <p className="font-kalam text-sm text-[#2d2d2d] whitespace-pre-wrap">{note.content}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
