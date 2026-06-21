"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, Plus, Search, Trash2, ArrowLeft,
  Sparkles, FileText, Download, Tag, Link2, 
  CornerDownRight, BrainCircuit, Type, Bold, Italic, Heading1, Heading2, Heading3, 
  Palette, Eye, Edit3, Check, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

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

export default function FullProjectNotesPage() {
  const { id: projectId } = useParams();
  const router = useRouter();
  const { projects, isLoading: isContextLoading } = useApp();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isTypographyOpen, setIsTypographyOpen] = useState(false);

  // Editor states
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editFolder, setEditFolder] = useState('General');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [editBacklinks, setEditBacklinks] = useState<string[]>([]);
  const [backlinkTarget, setBacklinkTarget] = useState<string>('none');

  // Font family & size states
  const [editorFont, setEditorFont] = useState<string>('kalam');
  const [editorFontSize, setEditorFontSize] = useState<number>(16);

  // Edit vs Preview mode state
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');

  const project = useMemo(() => {
    return projects.find(p => p.id === projectId || p.slug === projectId) || null;
  }, [projects, projectId]);

  // Load project-scoped notes from DB
  const loadNotes = async () => {
    if (!project) return;
    try {
      setIsPageLoading(true);
      const res = await fetch(`/api/notes?projectId=${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
        if (data.length > 0) {
          selectNote(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notes');
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    if (project) {
      loadNotes();
    } else if (!isContextLoading) {
      setIsPageLoading(false);
    }
  }, [project, isContextLoading]);

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
    if (!project) return;
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

  // Insert markdown helpers at current selection/cursor
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = prefix + selected + suffix;
    
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setEditContent(newContent);
    handleSave({ content: newContent });

    // Refocus and place cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // Download Note as Markdown file
  const downloadNote = () => {
    if (!selectedNote) return;
    const fileContent = `# ${editTitle}\n\nFolder: ${editFolder}\nTags: ${editTags.join(', ')}\n\n${editContent}`;
    const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${editTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Markdown file downloaded! 📥');
  };

  // AI Helper: call Gemini
  const runAiHelper = async (type: 'summarize' | 'refine' | 'extract-meeting') => {
    if (!editContent.trim()) {
      toast.error('Write some content first before calling AI helper.');
      return;
    }
    setIsAiLoading(true);
    try {
      let endpointBody: any = {};
      if (type === 'summarize' || type === 'extract-meeting') {
        endpointBody = {
          action: 'extract-meeting-notes',
          transcript: editContent
        };
      } else if (type === 'refine') {
        endpointBody = {
          action: 'refine-requirements',
          laymanText: editContent
        };
      }

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpointBody)
      });

      if (res.ok) {
        const data = await res.json();
        if (type === 'summarize' || type === 'extract-meeting') {
          const formattedSummary = `\n\n=== AI MEETING SUMMARY ===\nSummary: ${data.summary}\n\nDecisions:\n${data.decisions?.map((d:string)=>`- ${d}`).join('\n')}\n\nAction Items:\n${data.actionItems?.map((a:any)=>`- ${a.task} (${a.assignee || 'TBD'})`).join('\n')}\n\nRisks:\n${data.risks?.map((r:string)=>`- ${r}`).join('\n')}`;
          const updatedVal = editContent + formattedSummary;
          setEditContent(updatedVal);
          handleSave({ content: updatedVal });
          toast.success('Meeting summary added! 🧠');
        } else if (type === 'refine') {
          const formattedSpecs = `\n\n=== AI TECHNICAL SPECIFICATION ===\nFunctional Reqs:\n${data.functionalReqs?.map((f:string)=>`- ${f}`).join('\n')}\n\nTech Specs:\n- APIs: ${data.technicalSpecs?.apis?.join(', ')}\n- Database: ${data.technicalSpecs?.database?.join(', ')}\n\nEdge Cases:\n${data.edgeCases?.map((e:string)=>`- ${e}`).join('\n')}`;
          const updatedVal = editContent + formattedSpecs;
          setEditContent(updatedVal);
          handleSave({ content: updatedVal });
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

  // Regex markdown rendering parser
  const renderedHtml = useMemo(() => {
    if (!editContent) return '';
    let html = editContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Headings #, ##, ###
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold font-caveat text-amber-800 mt-3 mb-1">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold font-caveat text-amber-800 mt-4 mb-1.5 border-b pb-1">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold font-caveat text-amber-950 mt-5 mb-2">$1</h1>');
    
    // Bullet lists
    html = html.replace(/^- (.*?)$/gm, '<li class="list-disc ml-5 font-kalam text-sm text-slate-700">$1</li>');

    // Custom highlighting:
    // ==g:text== -> green highlight
    // ==b:text== -> blue highlight
    // ==p:text== -> pink highlight
    // ==o:text== -> orange highlight
    // ==text== -> yellow highlight
    html = html.replace(/==([g|b|p|o]):(.*?)==/g, (match, color, val) => {
      const bgClass = color === 'g' ? 'bg-[#d1fae5] text-[#065f46]' : // green
                      color === 'b' ? 'bg-[#dbeafe] text-[#1e40af]' : // blue
                      color === 'p' ? 'bg-[#fce7f3] text-[#9d174d]' : // pink
                      'bg-[#ffedd5] text-[#9a3412]'; // orange
      return `<mark class="${bgClass} px-1.5 py-0.5 rounded border-b border-black/10">${val}</mark>`;
    });
    html = html.replace(/==(.*?)==/g, '<mark class="bg-[#fef08a] text-[#854d0e] px-1.5 py-0.5 rounded border-b border-black/10">$1</mark>');

    // Breaklines
    html = html.replace(/\n/g, '<br/>');

    return html;
  }, [editContent]);

  // Dynamic font styles class
  const editorFontClass = useMemo(() => {
    switch (editorFont) {
      case 'kalam': return 'font-kalam';
      case 'caveat': return 'font-caveat';
      case 'indie': return 'font-indie';
      case 'patrick': return 'font-patrick';
      case 'architects': return 'font-architects';
      default: return 'font-sans';
    }
  }, [editorFont]);

  if (isContextLoading || isPageLoading) {
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
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#2d2d2d]/10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="font-kalam text-slate-500 hover:text-[#2d2d2d]" asChild>
              <Link href={`/projects/${project.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
              </Link>
            </Button>
            <h1 className="font-caveat text-3xl font-bold text-[#2d2d2d] truncate">
              {project.title} / <span className="text-amber-700">Notes Suite</span>
            </h1>
          </div>
          <Badge className="font-kalam bg-amber-50 text-amber-800 border-2 border-amber-500/20 px-3 py-1 rounded-full text-xs">
            Personal Developer Notebook
          </Badge>
        </div>

        {/* 3-Column Smart Notes Workspace */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-[600px] border-2 border-[#2d2d2d] rounded-2xl overflow-hidden bg-white shadow-[6px_6px_0px_rgba(45,45,45,1)]">
          
          {/* COLUMN 1: Sidebar Folder Navigation */}
          <div className="col-span-12 md:col-span-3 bg-[#f5f0e6]/30 border-r-2 border-[#2d2d2d] flex flex-col p-4">
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
                  className={`w-full text-left font-kalam text-sm px-3 py-2.5 rounded-xl border-2 flex items-center justify-between transition-all ${
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

          {/* COLUMN 2: Notes List inside selected folder */}
          <div className="col-span-12 md:col-span-3 border-r-2 border-[#2d2d2d] flex flex-col p-4 bg-[#fdfbf7]/40">
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
                  className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all hover:scale-[1.01] ${
                    selectedNoteId === n.id 
                      ? 'bg-[#fffacd] border-[#2d2d2d] shadow-[3px_3px_0px_rgba(45,45,45,1)]' 
                      : 'bg-white border-[#2d2d2d]/10 hover:border-[#2d2d2d]/30 shadow-sm'
                  }`}
                >
                  <h3 className="font-caveat text-xl font-bold text-[#2d2d2d] truncate mb-1">{n.title}</h3>
                  <p className="font-kalam text-xs text-slate-500 line-clamp-2 leading-snug mb-2">{n.content}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[9px] font-kalam py-0 bg-slate-50">{n.folder}</Badge>
                    {n.tags?.slice(0,3).map(t => (
                      <Badge key={t} variant="secondary" className="text-[9px] font-kalam py-0 bg-amber-50 text-amber-700 border-amber-200">{t}</Badge>
                    ))}
                  </div>
                </div>
              ))}
              {filteredNotes.length === 0 && (
                <p className="font-kalam text-xs text-slate-400 italic text-center py-12">No notes in this folder</p>
              )}
            </div>
          </div>

          {/* COLUMN 3: Rich Notebook Editor & Markdown Preview */}
          <div className="col-span-12 md:col-span-6 flex flex-col p-4 bg-white relative">
            {selectedNote ? (
              <div className="flex flex-col h-full space-y-3">
                
                {/* Note Header Info */}
                <div className="flex items-start justify-between gap-4">
                  <input 
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Untitled Note"
                    className="flex-1 bg-transparent font-caveat text-3xl font-bold border-b-2 border-transparent hover:border-slate-200 focus:border-[#2d2d2d] outline-none text-[#2d2d2d] py-1" 
                  />
                  <div className="flex gap-1.5">
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
                    <Button onClick={downloadNote} variant="ghost" size="icon" className="h-8 w-8 text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50" title="Download Markdown">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button onClick={handleDelete} variant="ghost" size="icon" className="h-8 w-8 text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Advanced Editor Controls Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border-2 border-[#2d2d2d]/10 rounded-xl">
                  {/* Font Settings Toggle */}
                  <div className="flex items-center gap-1.5">
                    <Button 
                      onClick={() => setIsTypographyOpen(true)}
                      variant="ghost" 
                      size="sm" 
                      className="h-8 font-kalam text-xs gap-1.5 border border-[#2d2d2d]/20 bg-white hover:bg-slate-50 shadow-sm rounded-lg"
                    >
                      <Palette className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      Style Lab
                    </Button>
                  </div>

                  {/* Highlights Toolbar */}
                  <div className="flex items-center gap-1 border-l pl-2 border-[#2d2d2d]/10">
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-200" onClick={() => insertFormatting('**', '**')} title="Bold"><Bold className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-200" onClick={() => insertFormatting('*', '*')} title="Italic"><Italic className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-200" onClick={() => insertFormatting('\n# ', '\n')} title="H1"><Heading1 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-200" onClick={() => insertFormatting('\n## ', '\n')} title="H2"><Heading2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-200" onClick={() => insertFormatting('\n### ', '\n')} title="H3"><Heading3 className="w-3.5 h-3.5" /></Button>

                    <div className="flex items-center gap-0.5 border-l pl-1.5 border-[#2d2d2d]/10">
                      <button onClick={() => insertFormatting('==', '==')} className="w-4 h-4 rounded-full bg-[#fef08a] border border-[#2d2d2d]/20" title="Yellow Highlight" />
                      <button onClick={() => insertFormatting('==g:', '==')} className="w-4 h-4 rounded-full bg-[#d1fae5] border border-[#2d2d2d]/20" title="Green Highlight" />
                      <button onClick={() => insertFormatting('==b:', '==')} className="w-4 h-4 rounded-full bg-[#dbeafe] border border-[#2d2d2d]/20" title="Blue Highlight" />
                      <button onClick={() => insertFormatting('==p:', '==')} className="w-4 h-4 rounded-full bg-[#fce7f3] border border-[#2d2d2d]/20" title="Pink Highlight" />
                      <button onClick={() => insertFormatting('==o:', '==')} className="w-4 h-4 rounded-full bg-[#ffedd5] border border-[#2d2d2d]/20" title="Orange Highlight" />
                    </div>
                  </div>

                  {/* Mode Toggler */}
                  <div className="flex gap-1 bg-white border border-slate-200 p-0.5 rounded-lg">
                    <Button 
                      size="sm" 
                      onClick={() => setEditorMode('edit')}
                      className={`h-6 text-[10px] font-kalam px-2 ${editorMode === 'edit' ? 'bg-[#2d2d2d] text-white hover:bg-slate-800' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Edit3 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setEditorMode('preview')}
                      className={`h-6 text-[10px] font-kalam px-2 ${editorMode === 'preview' ? 'bg-[#2d2d2d] text-white hover:bg-slate-800' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Eye className="w-3 h-3 mr-1" /> Preview
                    </Button>
                  </div>
                </div>

                {/* AI Assistant panel */}
                <div className="flex items-center gap-1.5 p-2 bg-[#fdfbf7] border border-dashed border-[#e8dac0] rounded-xl shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span className="font-kalam text-[11px] font-bold text-amber-700 mr-2">AI Copilot:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    <Button 
                      onClick={() => runAiHelper('summarize')}
                      disabled={isAiLoading}
                      size="sm" 
                      className="h-6 text-[9px] font-kalam bg-white border border-[#2d2d2d] text-[#2d2d2d] hover:bg-slate-50 shadow-sm"
                    >
                      Summarize
                    </Button>
                    <Button 
                      onClick={() => runAiHelper('refine')}
                      disabled={isAiLoading}
                      size="sm" 
                      className="h-6 text-[9px] font-kalam bg-white border border-[#2d2d2d] text-[#2d2d2d] hover:bg-slate-50 shadow-sm"
                    >
                      Refine Specs
                    </Button>
                    {editFolder === 'Client Meetings' && (
                      <Button 
                        onClick={() => runAiHelper('extract-meeting')}
                        disabled={isAiLoading}
                        size="sm" 
                        className="h-6 text-[9px] font-kalam bg-amber-50 border border-[#d4a574] text-amber-800 hover:bg-amber-100 shadow-sm"
                      >
                        Extract Meetings
                      </Button>
                    )}
                  </div>
                  {isAiLoading && <div className="ml-auto w-3.5 h-3.5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />}
                </div>

                {/* Main Content Area: Editor vs Preview */}
                <div className="flex-1 relative border-2 border-[#2d2d2d]/10 rounded-xl overflow-hidden shadow-inner p-1 min-h-[300px]">
                  {/* Style Lab Glassmorphic Overlay */}
                  <AnimatePresence>
                    {isTypographyOpen && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#2d2d2d]/10 backdrop-blur-sm z-40 flex items-center justify-center p-4"
                        onClick={() => setIsTypographyOpen(false)}
                      >
                        <motion.div
                          initial={{ scale: 0.95, y: 10 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.95, y: 10 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                          className="bg-white/80 backdrop-blur-md border-2 border-[#2d2d2d] rounded-2xl p-5 w-80 shadow-[6px_6px_0px_rgba(45,45,45,1)] space-y-4"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between border-b pb-2 border-[#2d2d2d]/10">
                            <h3 className="font-caveat text-2xl font-bold text-[#2d2d2d] flex items-center gap-1.5">
                              <Palette className="w-5 h-5 text-amber-500" /> Typography Settings
                            </h3>
                            <button className="text-slate-400 hover:text-[#2d2d2d] font-bold text-lg leading-none" onClick={() => setIsTypographyOpen(false)}>×</button>
                          </div>

                          <div className="space-y-2">
                            <label className="font-kalam text-xs font-bold text-slate-500 uppercase tracking-wider block">Font Family</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'kalam', label: 'Kalam', style: 'font-kalam' },
                                { id: 'caveat', label: 'Caveat', style: 'font-caveat' },
                                { id: 'indie', label: 'Indie Flower', style: 'font-indie' },
                                { id: 'patrick', label: 'Patrick Hand', style: 'font-patrick' },
                                { id: 'architects', label: 'Architects', style: 'font-architects' },
                                { id: 'sans', label: 'System Sans', style: 'font-sans' },
                              ].map(f => (
                                <button
                                  key={f.id}
                                  onClick={() => setEditorFont(f.id)}
                                  className={`p-2 rounded-xl border-2 text-left transition-all duration-200 ${
                                    editorFont === f.id 
                                      ? 'bg-[#2d2d2d] text-white border-[#2d2d2d] shadow-sm' 
                                      : 'bg-white/60 hover:bg-white text-[#2d2d2d] border-[#2d2d2d]/10'
                                  }`}
                                >
                                  <p className="text-xs font-bold font-kalam leading-tight">{f.label}</p>
                                  <p className={`${f.style} text-[9px] truncate mt-0.5 opacity-80`}>The quick brown fox</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="font-kalam text-xs font-bold text-slate-500 uppercase tracking-wider">Font Size</label>
                              <span className="font-kalam text-xs font-bold text-[#2d2d2d] bg-white/80 border border-slate-200 px-2 py-0.5 rounded-lg">{editorFontSize}px</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-kalam text-[10px] text-slate-400 font-bold">A</span>
                              <input 
                                type="range" 
                                min="12" 
                                max="28" 
                                value={editorFontSize}
                                onChange={e => setEditorFontSize(parseInt(e.target.value))}
                                className="flex-1 accent-[#2d2d2d] cursor-pointer" 
                              />
                              <span className="font-kalam text-base text-slate-700 font-bold">A</span>
                            </div>
                          </div>

                          <Button onClick={() => setIsTypographyOpen(false)} className="w-full journal-btn-primary py-2 text-xs pt-1.5">
                            Apply settings
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {editorMode === 'edit' ? (
                    <Textarea 
                      ref={textareaRef}
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      placeholder="Write markdown specs, meeting transcripts, or log items..." 
                      className={`w-full h-full resize-none border-0 focus-visible:ring-0 leading-relaxed p-3 bg-[#fdfbf7]/25 transition-all duration-300 ease-out ${editorFontClass}`}
                      style={{ fontSize: `${editorFontSize}px` }}
                    />
                  ) : (
                    <div 
                      className={`w-full h-full overflow-y-auto p-4 leading-relaxed prose prose-stone bg-[#fdfbf7]/40 max-w-none transition-all duration-300 ease-out ${editorFontClass}`}
                      style={{ fontSize: `${editorFontSize}px` }}
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                  )}
                </div>

                {/* Tags section */}
                <div className="space-y-1">
                  <label className="font-kalam text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Tags
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex flex-wrap gap-1 border border-[#2d2d2d]/10 p-1.5 rounded-lg min-h-8 bg-slate-50">
                      {editTags.map(t => (
                        <Badge key={t} className="font-kalam text-[10px] flex items-center gap-1 bg-[#2d2d2d] text-white">
                          {t}
                          <button onClick={() => removeTag(t)} className="text-white/60 hover:text-white font-bold text-xs">×</button>
                        </Badge>
                      ))}
                      {editTags.length === 0 && <span className="text-[10px] font-kalam text-slate-400 italic">No tags added</span>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Input 
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
                        placeholder="Add tag..." 
                        className="h-8 w-24 text-xs font-kalam border-[#2d2d2d]/30" 
                      />
                      <Button onClick={addTag} size="sm" className="h-8 px-2 font-kalam bg-[#2d2d2d] text-white hover:bg-slate-800">Add</Button>
                    </div>
                  </div>
                </div>

                {/* Backlinks Section */}
                <div className="space-y-1.5 border-t border-[#2d2d2d]/10 pt-2 shrink-0">
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

      </div>
    </div>
  );
}
