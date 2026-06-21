import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, Plus, Search, Star, Trash2, Edit3, 
  Sparkles, FileText, Share2, Tag, Link2, 
  CornerDownRight, CheckSquare, BrainCircuit, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Project } from '@/types';

interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  backlinks: string[];
  isFav: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectMacNotesTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export function ProjectMacNotesTab({ project, onUpdate }: ProjectMacNotesTabProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Editor states
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editFolder, setEditFolder] = useState('General');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [editBacklinks, setEditBacklinks] = useState<string[]>([]);
  const [backlinkTarget, setBacklinkTarget] = useState<string>('none');

  // Load project-scoped notes from DB
  const loadNotes = async () => {
    try {
      const res = await fetch(`/api/notes?projectId=${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        if (data.length > 0 && !selectedNoteId) {
          selectNote(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notes');
    }
  };

  useEffect(() => {
    loadNotes();
  }, [project.id]);

  const folders = ['All', 'Client Meetings', 'Architecture', 'Blockers', 'General', 'Scratch'];

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesFolder = activeFolder === 'All' || n.folder === activeFolder;
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFolder && matchesSearch;
    });
  }, [notes, activeFolder, searchQuery]);

  const selectedNote = useMemo(() => {
    return notes.find(n => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  const selectNote = (note: Note) => {
    setSelectedNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditFolder(note.folder);
    setEditTags(note.tags || []);
    setEditBacklinks(note.backlinks || []);
    setTagInput('');
  };

  const createNewNote = async () => {
    try {
      const folderName = activeFolder === 'All' ? 'General' : activeFolder;
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Note',
          content: 'Start writing...',
          folder: folderName,
          projectId: project.id,
          tags: [],
          backlinks: [],
          isFav: false
        })
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes(prev => [newNote, ...prev]);
        selectNote(newNote);
        toast.success('New note created! 📝');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to create note');
    }
  };

  const handleSave = async (updatedFields: Partial<Note>) => {
    if (!selectedNoteId) return;
    try {
      const res = await fetch(`/api/notes/${selectedNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(prev => prev.map(n => n.id === selectedNoteId ? data : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!selectedNoteId) return;
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await fetch(`/api/notes/${selectedNoteId}`, { method: 'DELETE' });
      if (res.ok) {
        const remaining = notes.filter(n => n.id !== selectedNoteId);
        setNotes(remaining);
        if (remaining.length > 0) {
          selectNote(remaining[0]);
        } else {
          setSelectedNoteId(null);
        }
        toast.success('Note deleted 🗑️');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete note');
    }
  };

  // Debounced auto-save title & content
  useEffect(() => {
    if (!selectedNote) return;
    const delayDebounce = setTimeout(() => {
      if (editTitle !== selectedNote.title || editContent !== selectedNote.content || editFolder !== selectedNote.folder) {
        handleSave({ title: editTitle, content: editContent, folder: editFolder });
      }
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [editTitle, editContent, editFolder]);

  // Tags actions
  const addTag = () => {
    if (!tagInput.trim() || editTags.includes(tagInput.trim())) return;
    const newTags = [...editTags, tagInput.trim()];
    setEditTags(newTags);
    setTagInput('');
    handleSave({ tags: newTags });
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = editTags.filter(t => t !== tagToRemove);
    setEditTags(newTags);
    handleSave({ tags: newTags });
  };

  // Backlink action
  const addBacklink = () => {
    if (backlinkTarget === 'none' || editBacklinks.includes(backlinkTarget)) return;
    const newBacklinks = [...editBacklinks, backlinkTarget];
    setEditBacklinks(newBacklinks);
    handleSave({ backlinks: newBacklinks });
    toast.success('Backlink added!');
  };

  const removeBacklink = (backlinkToRemove: string) => {
    const newBacklinks = editBacklinks.filter(b => b !== backlinkToRemove);
    setEditBacklinks(newBacklinks);
    handleSave({ backlinks: newBacklinks });
  };

  // AI Helper: call Gemini
  const runAiHelper = async (type: 'summarize' | 'refine' | 'extract-meeting' | 'create-task') => {
    if (!editContent.trim()) {
      toast.error('Write some content first before calling AI helper.');
      return;
    }
    setIsAiLoading(true);
    try {
      let endpointBody: any = {};
      if (type === 'summarize') {
        endpointBody = {
          action: 'extract-meeting-notes', // Reusing the notes extractor block
          transcript: editContent
        };
      } else if (type === 'refine') {
        endpointBody = {
          action: 'refine-requirements',
          laymanText: editContent
        };
      } else if (type === 'extract-meeting') {
        endpointBody = {
          action: 'extract-meeting-notes',
          transcript: editContent
        };
      } else if (type === 'create-task') {
        toast.info('Converting notes to active checklist tasks...');
        const prompt = `Based on these notes, extract a bulleted list of executable task items: "${editContent}"`;
        // Quick REST call to generic AI
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''; // fallback or call generic AI
      }

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpointBody)
      });

      if (res.ok) {
        const data = await res.json();
        if (type === 'summarize' || type === 'extract-meeting') {
          // Append structured meeting details to note content
          const formattedSummary = `\n\n=== AI MEETING SUMMARY ===\nSummary: ${data.summary}\n\nDecisions:\n${data.decisions?.map((d:string)=>`- ${d}`).join('\n')}\n\nAction Items:\n${data.actionItems?.map((a:any)=>`- ${a.task} (${a.assignee || 'TBD'})`).join('\n')}\n\nRisks:\n${data.risks?.map((r:string)=>`- ${r}`).join('\n')}`;
          setEditContent(prev => prev + formattedSummary);
          handleSave({ content: editContent + formattedSummary });
          toast.success('Meeting summary added! 🧠');
        } else if (type === 'refine') {
          // Append refined technical specs
          const formattedSpecs = `\n\n=== AI TECHNICAL SPECIFICATION ===\nFunctional Reqs:\n${data.functionalReqs?.map((f:string)=>`- ${f}`).join('\n')}\n\nTech Specs:\n- APIs: ${data.technicalSpecs?.apis?.join(', ')}\n- Database: ${data.technicalSpecs?.database?.join(', ')}\n\nEdge Cases:\n${data.edgeCases?.map((e:string)=>`- ${e}`).join('\n')}`;
          setEditContent(prev => prev + formattedSpecs);
          handleSave({ content: editContent + formattedSpecs });
          toast.success('Technical specs appended! 🏗️');
        }
      } else {
        toast.error('AI response error. Please try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to run AI helper');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="pt-2 grid grid-cols-12 gap-4 h-[650px] border-2 border-[#2d2d2d] rounded-2xl overflow-hidden bg-white shadow-[4px_4px_0px_rgba(45,45,45,1)]">
      
      {/* COLUMN 1: Folder Sidebar */}
      <div className="col-span-3 bg-[#f5f0e6]/40 border-r-2 border-[#2d2d2d] flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-caveat text-2xl font-bold text-[#2d2d2d] flex items-center gap-1.5">
            <BrainCircuit className="w-5 h-5 text-amber-600" /> Folders
          </h2>
          <Button onClick={createNewNote} variant="ghost" size="icon" className="h-8 w-8 border border-[#2d2d2d] rounded-lg bg-white shadow-sm hover:translate-y-[-1px] transition-all">
            <Plus className="w-4 h-4 text-[#2d2d2d]" />
          </Button>
        </div>

        <div className="space-y-1 flex-1 overflow-y-auto pr-1">
          {folders.map(f => (
            <button
              key={f}
              onClick={() => setActiveFolder(f)}
              className={`w-full text-left font-kalam text-sm px-3 py-2 rounded-lg border-2 flex items-center justify-between transition-all ${
                activeFolder === f 
                  ? 'bg-[#2d2d2d] text-white border-[#2d2d2d] shadow-sm' 
                  : 'bg-white text-[#2d2d2d] border-[#2d2d2d]/10 hover:border-[#2d2d2d]/30'
              }`}
            >
              <span className="flex items-center gap-2">
                <Folder className={`w-4 h-4 ${activeFolder === f ? 'text-amber-300' : 'text-amber-500'}`} />
                {f}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeFolder === f ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 border'}`}>
                {f === 'All' ? notes.length : notes.filter(n => n.folder === f).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* COLUMN 2: Notes list in folder */}
      <div className="col-span-3 border-r-2 border-[#2d2d2d] flex flex-col p-4 bg-[#fdfbf7]/60">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes..." 
            className="pl-8 journal-input text-xs h-9 border-[#2d2d2d]/25 bg-white" 
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredNotes.map(n => (
            <div
              key={n.id}
              onClick={() => selectNote(n)}
              className={`p-3 border-2 rounded-xl cursor-pointer transition-all hover:scale-[1.01] ${
                selectedNoteId === n.id 
                  ? 'bg-[#fffacd] border-[#2d2d2d] shadow-[2px_2px_0px_rgba(45,45,45,1)]' 
                  : 'bg-white border-[#2d2d2d]/10 hover:border-[#2d2d2d]/30 shadow-sm'
              }`}
            >
              <h3 className="font-caveat text-lg font-bold text-[#2d2d2d] truncate mb-1">{n.title}</h3>
              <p className="font-kalam text-xs text-slate-500 line-clamp-2 leading-tight mb-2">{n.content}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-[9px] font-kalam py-0 bg-slate-50">{n.folder}</Badge>
                {n.tags?.slice(0,2).map(t => (
                  <Badge key={t} variant="secondary" className="text-[9px] font-kalam py-0 bg-amber-50 text-amber-700 border-amber-200">{t}</Badge>
                ))}
              </div>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <p className="font-kalam text-xs text-slate-400 italic text-center py-8">No notes in this folder</p>
          )}
        </div>
      </div>

      {/* COLUMN 3: Rich Notebook Editor */}
      <div className="col-span-6 flex flex-col p-4 bg-white relative">
        {selectedNote ? (
          <div className="flex flex-col h-full space-y-3">
            {/* Note Header Inputs */}
            <div className="flex items-start justify-between gap-4">
              <input 
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Untitled Note"
                className="flex-1 bg-transparent font-caveat text-3xl font-bold border-b-2 border-transparent hover:border-slate-200 focus:border-[#2d2d2d] outline-none text-[#2d2d2d] py-1" 
              />
              <div className="flex gap-1">
                <Select value={editFolder} onValueChange={setEditFolder}>
                  <SelectTrigger className="h-8 text-xs font-kalam w-28 border-[#2d2d2d]/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d] font-kalam">
                    {folders.filter(f => f !== 'All').map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleDelete} variant="ghost" size="icon" className="h-8 w-8 text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* AI Assistant Bar */}
            <div className="flex items-center gap-1.5 p-2 bg-[#fdfbf7] border-2 border-dashed border-[#e8dac0] rounded-xl">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="font-kalam text-xs font-bold text-amber-700 mr-2">AI Assistant:</span>
              <div className="flex gap-1.5 flex-wrap">
                <Button 
                  onClick={() => runAiHelper('summarize')}
                  disabled={isAiLoading}
                  size="sm" 
                  className="h-7 text-[10px] font-kalam bg-white border border-[#2d2d2d] text-[#2d2d2d] hover:bg-slate-50 shadow-sm"
                >
                  Summarize Notes
                </Button>
                <Button 
                  onClick={() => runAiHelper('refine')}
                  disabled={isAiLoading}
                  size="sm" 
                  className="h-7 text-[10px] font-kalam bg-white border border-[#2d2d2d] text-[#2d2d2d] hover:bg-slate-50 shadow-sm"
                >
                  Refine requirements
                </Button>
                {editFolder === 'Client Meetings' && (
                  <Button 
                    onClick={() => runAiHelper('extract-meeting')}
                    disabled={isAiLoading}
                    size="sm" 
                    className="h-7 text-[10px] font-kalam bg-amber-50 border border-[#d4a574] text-amber-800 hover:bg-amber-100 shadow-sm"
                  >
                    Extract Meetings Info
                  </Button>
                )}
              </div>
              {isAiLoading && <div className="ml-auto w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />}
            </div>

            {/* Editor Textarea */}
            <div className="flex-1 relative border-2 border-[#2d2d2d]/10 rounded-xl overflow-hidden shadow-inner p-1">
              <Textarea 
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                placeholder="Write requirements, markdown notes, transcripts..." 
                className="w-full h-full resize-none border-0 focus-visible:ring-0 font-kalam text-sm leading-relaxed p-3 bg-[#fdfbf7]/20"
              />
            </div>

            {/* Tags section */}
            <div className="space-y-1.5">
              <label className="font-kalam text-xs font-bold text-slate-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Tags
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex flex-wrap gap-1 border border-[#2d2d2d]/10 p-1.5 rounded-lg min-h-8 bg-slate-50">
                  {editTags.map(t => (
                    <Badge key={t} className="font-kalam text-[10px] flex items-center gap-1 bg-[#2d2d2d] text-white">
                      {t}
                      <button onClick={() => removeTag(t)} className="text-white/60 hover:text-white font-bold">×</button>
                    </Badge>
                  ))}
                  {editTags.length === 0 && <span className="text-[10px] font-kalam text-slate-400 italic">No tags added</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Input 
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
                    placeholder="New tag..." 
                    className="h-8 w-24 text-xs font-kalam border-[#2d2d2d]/30" 
                  />
                  <Button onClick={addTag} size="sm" className="h-8 px-2 font-kalam bg-[#2d2d2d] text-white hover:bg-slate-800">Add</Button>
                </div>
              </div>
            </div>

            {/* Backlinks Section */}
            <div className="space-y-1.5 border-t border-[#2d2d2d]/10 pt-2">
              <label className="font-kalam text-xs font-bold text-slate-500 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-blue-500" /> Document Backlinks
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex flex-wrap gap-1 p-1 bg-slate-50 border border-slate-100 rounded-lg min-h-8">
                  {editBacklinks.map(b => (
                    <Badge key={b} variant="outline" className="font-kalam text-[10px] flex items-center gap-1 border-blue-200 text-blue-700 bg-blue-50">
                      {notes.find(n => n.id === b)?.title || 'Linked Note'}
                      <button onClick={() => removeBacklink(b)} className="text-red-500 font-bold ml-1">×</button>
                    </Badge>
                  ))}
                  {editBacklinks.length === 0 && <span className="text-[10px] font-kalam text-slate-400 italic">No backlinks</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Select value={backlinkTarget} onValueChange={setBacklinkTarget}>
                    <SelectTrigger className="h-8 w-36 text-xs font-kalam border-[#2d2d2d]/30">
                      <SelectValue placeholder="Link note..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d] font-kalam">
                      <SelectItem value="none">Choose note...</SelectItem>
                      {notes.filter(n => n.id !== selectedNoteId).map(n => (
                        <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addBacklink} size="sm" className="h-8 px-2 font-kalam bg-blue-600 text-white hover:bg-blue-700">Link</Button>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
            <FileText className="w-16 h-16 text-slate-300 mb-2" />
            <h3 className="font-caveat text-2xl text-slate-500 font-bold">No Note Selected</h3>
            <p className="font-kalam text-sm text-slate-400 max-w-xs mb-4">Choose a note from the list, or create a brand new note to get started.</p>
            <Button onClick={createNewNote} className="journal-btn-primary"><Plus className="w-4 h-4 mr-1.5" /> Create Note</Button>
          </div>
        )}
      </div>

    </div>
  );
}
