"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, Plus, Search, Trash2, ArrowLeft,
  Sparkles, FileText, Download, Tag, Link2,
  BrainCircuit, Bold, Italic, Heading1, Heading2, Heading3,
  Palette, ChevronLeft, ChevronRight, CalendarDays, Layers,
  Star, Command, Sun, Moon, FileArchive, Keyboard, X, GripVertical,
  List, ListOrdered, ListChecks, Indent, Outdent,
  Save, Undo2, Redo2, Table, Maximize2, Minimize2, User, FolderPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { RichTextEditor, RichTextEditorHandle, htmlToPlainText, htmlToMarkdown, migrateMarkdownToHtml } from './RichTextEditor';

interface Note {
  id: string;
  title: string;
  content: string;
  originalContent?: string | null;
  refinedContent?: string | null;
  canvasData?: string | null;
  folder: string;
  section?: string | null;
  tags: string[];
  backlinks: string[];
  isFav: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CanvasBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: string;
  groupId?: string | null;
}

interface CanvasGroup {
  id: string;
  title: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---- Note templates -------------------------------------------------
// Pre-filled structure so daily call notes start consistent every time.
// Stored as HTML to match the rich text editor's content model.
const NOTE_TEMPLATES: Record<string, { title: string; content: string }> = {
  'Meeting Notes': {
    title: 'Meeting Notes —',
    content:
      '<h2>Attendees</h2><ul><li>\u200B</li></ul>' +
      '<h2>Agenda</h2><ul><li>\u200B</li></ul>' +
      '<h2>Decisions</h2><ul><li>\u200B</li></ul>' +
      '<h2>Action items</h2><ul><li>\u200B</li></ul>',
  },
  'Morning Call': {
    title: 'Morning Call —',
    content:
      '<h2>Attendees</h2><ul><li>\u200B</li></ul>' +
      '<h2>Yesterday</h2><ul><li>\u200B</li></ul>' +
      '<h2>Today\'s plan</h2><ul><li>\u200B</li></ul>' +
      '<h2>Blockers</h2><ul><li>\u200B</li></ul>',
  },
  'Evening Call': {
    title: 'Evening Call —',
    content:
      '<h2>Attendees</h2><ul><li>\u200B</li></ul>' +
      '<h2>Completed today</h2><ul><li>\u200B</li></ul>' +
      '<h2>Carried over</h2><ul><li>\u200B</li></ul>' +
      '<h2>Notes for tomorrow</h2><ul><li>\u200B</li></ul>',
  },
  'Client Meetings': {
    title: 'Client Meeting —',
    content:
      '<h2>Attendees</h2><ul><li>\u200B</li></ul>' +
      '<h2>Agenda</h2><ul><li>\u200B</li></ul>' +
      '<h2>Decisions</h2><ul><li>\u200B</li></ul>' +
      '<h2>Action items</h2><ul><li>\u200B</li></ul>',
  },
};

const DEFAULT_TEMPLATE = { title: 'New Note', content: '<div>Start writing...</div>' };

const SIDEBAR_DEFAULT_WIDTH = 248;
const SIDEBAR_MIN_WIDTH = 72;
const SIDEBAR_COLLAPSED_WIDTH = 64;
const LIST_DEFAULT_WIDTH = 320;
const LIST_MIN_WIDTH = 220;
const LIST_MAX_WIDTH = 520;

export default function FullProjectNotesPage() {
  const [isFocusMode, setIsFocusMode] = useState(false);
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

  // Layout & Custom States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'workspace' | 'timeline'>('workspace');
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [listWidth, setListWidth] = useState(LIST_DEFAULT_WIDTH);
  const resizingRef = useRef<'sidebar' | 'list' | null>(null);

  // Editor states
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editOriginalContent, setEditOriginalContent] = useState<string>('');
  const [editRefinedContent, setEditRefinedContent] = useState<string>('');
  const [noteTab, setNoteTab] = useState<'original' | 'refined'>('refined');

  const [editFolder, setEditFolder] = useState('General');
  const [editSection, setEditSection] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [editBacklinks, setEditBacklinks] = useState<string[]>([]);
  const [backlinkTarget, setBacklinkTarget] = useState<string>('none');

  // Lightbox Image Preview Modal state
  const [previewImage, setPreviewImage] = useState<{ src: string; caption: string; cardId: string } | null>(null);
  const [previewCaptionInput, setPreviewCaptionInput] = useState('');

  // Canvas / Draggable Text Blocks / Grouping state (tldr style)
  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([]);
  const [canvasGroups, setCanvasGroups] = useState<CanvasGroup[]>([]);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [isCanvasActive, setIsCanvasActive] = useState(false);

  // Section Divider Menu state
  const [showDividerMenu, setShowDividerMenu] = useState(false);

  // Font family & size states
  const [editorFont, setEditorFont] = useState<string>('kalam');
  const [editorFontSize, setEditorFontSize] = useState<number>(16);

  // Rich text editor ref + live "what's active at the caret" state,
  // used to highlight the Bold/Italic/List buttons like macOS Notes does.
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, ul: false, ol: false, inTable: false });

  // New feature states
  const [filterTab, setFilterTab] = useState<'all' | 'pinned' | 'recent'>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false);
  const [quickSwitcherQuery, setQuickSwitcherQuery] = useState('');
  const [recentNoteIds, setRecentNoteIds] = useState<string[]>([]);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const quickSwitcherInputRef = useRef<HTMLInputElement>(null);

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

  const [customFolders, setCustomFolders] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('notes_custom_folders');
    if (saved) {
      try {
        setCustomFolders(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveCustomFolders = (newFolders: string[]) => {
    setCustomFolders(newFolders);
    localStorage.setItem('notes_custom_folders', JSON.stringify(newFolders));
  };

  const defaultFolders = [
    'All',
    'Meeting Notes',
    'Ideas & Brainstorm',
    'Personal',
    'Business',
    'Projects',
    'Resources',
    'Archive',
    'Templates',
    'AI Generated',
    'Trash'
  ];

  const folders = useMemo(() => {
    const noteFolders = notes.map(n => n.folder).filter(Boolean);
    const combined = [...defaultFolders, ...customFolders, ...noteFolders];
    const unique = Array.from(new Set(combined));
    const filtered = unique.filter(f => f !== 'All' && f !== 'Trash');
    return ['All', ...filtered, 'Trash'];
  }, [notes, customFolders]);

  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => {
      const matchesFolder = activeFolder === 'Trash'
        ? n.folder === 'Trash'
        : (activeFolder === 'All' ? n.folder !== 'Trash' : n.folder === activeFolder);
        
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            n.content.toLowerCase().includes(searchQuery.toLowerCase());
                            
      const matchesPin = filterTab !== 'pinned' || n.isFav;
      
      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && new Date(n.createdAt) >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(n.createdAt) <= end;
      }
      
      return matchesFolder && matchesSearch && matchesPin && matchesDate;
    });
    
    if (filterTab === 'recent') {
      result = [...result].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return result;
  }, [notes, activeFolder, searchQuery, filterTab, startDate, endDate]);

  const selectedNote = useMemo(() => {
    return notes.find(n => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  // Chronological grouping: Today, This Week, Older
  const chronologicalGroups = useMemo(() => {
    const today: Note[] = [];
    const thisWeek: Note[] = [];
    const older: Note[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

    filteredNotes.forEach(n => {
      const noteDate = new Date(n.createdAt);
      if (noteDate >= startOfToday) {
        today.push(n);
      } else if (noteDate >= startOfThisWeek) {
        thisWeek.push(n);
      } else {
        older.push(n);
      }
    });

    return [
      { name: 'Today', notes: today },
      { name: 'This Week', notes: thisWeek },
      { name: 'Older', notes: older }
    ].filter(group => group.notes.length > 0);
  }, [filteredNotes]);

  const notesByDay = useMemo(() => {
    const groups: Record<string, Note[]> = {};
    notes.forEach(n => {
      const date = new Date(n.createdAt);
      const dateStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'long'
      }).format(date) + ' (IST)';

      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(n);
    });

    return Object.entries(groups).sort((a, b) => {
      const getFirstTime = (groupArr: Note[]) => {
        return Math.min(...groupArr.map(n => new Date(n.createdAt).getTime()));
      };
      return getFirstTime(b[1]) - getFirstTime(a[1]);
    });
  }, [notes]);

  // Recently opened notes, most-recent-first, for the quick switcher.
  const recentNotes = useMemo(() => {
    return recentNoteIds
      .map(id => notes.find(n => n.id === id))
      .filter((n): n is Note => Boolean(n));
  }, [recentNoteIds, notes]);

  const quickSwitcherResults = useMemo(() => {
    if (!quickSwitcherQuery.trim()) {
      return recentNotes.slice(0, 8);
    }
    const q = quickSwitcherQuery.toLowerCase();
    return notes
      .filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .slice(0, 8);
  }, [quickSwitcherQuery, notes, recentNotes]);

  // Refs to store the latest editing state values to prevent stale closures in async saves
  const lastSavedState = useRef({ id: '', title: '', content: '', folder: '', section: '', originalContent: '', refinedContent: '', canvasData: '' });

  const editTitleRef = useRef(editTitle);
  const editContentRef = useRef(editContent);
  const editFolderRef = useRef(editFolder);
  const editSectionRef = useRef(editSection);
  const editOriginalContentRef = useRef(editOriginalContent);
  const editRefinedContentRef = useRef(editRefinedContent);
  const canvasBlocksRef = useRef(canvasBlocks);
  const canvasGroupsRef = useRef(canvasGroups);

  useEffect(() => { editTitleRef.current = editTitle; }, [editTitle]);
  useEffect(() => { editContentRef.current = editContent; }, [editContent]);
  useEffect(() => { editFolderRef.current = editFolder; }, [editFolder]);
  useEffect(() => { editSectionRef.current = editSection; }, [editSection]);
  useEffect(() => { editOriginalContentRef.current = editOriginalContent; }, [editOriginalContent]);
  useEffect(() => { editRefinedContentRef.current = editRefinedContent; }, [editRefinedContent]);
  useEffect(() => { canvasBlocksRef.current = canvasBlocks; }, [canvasBlocks]);
  useEffect(() => { canvasGroupsRef.current = canvasGroups; }, [canvasGroups]);

  const flushPendingSave = useCallback(async () => {
    const noteId = lastSavedState.current.id;
    if (!noteId) return;

    const currentTitle = editTitleRef.current;
    const currentContent = editContentRef.current;
    const currentFolder = editFolderRef.current;
    const currentSection = editSectionRef.current;
    const currentOriginal = editOriginalContentRef.current;
    const currentRefined = editRefinedContentRef.current;
    const currentCanvasData = JSON.stringify({ blocks: canvasBlocksRef.current, groups: canvasGroupsRef.current });

    const last = lastSavedState.current;
    const isDifferent =
      currentTitle !== last.title ||
      currentContent !== last.content ||
      currentFolder !== last.folder ||
      currentSection !== last.section ||
      currentOriginal !== last.originalContent ||
      currentRefined !== last.refinedContent ||
      currentCanvasData !== last.canvasData;

    if (isDifferent) {
      lastSavedState.current = {
        id: noteId,
        title: currentTitle,
        content: currentContent,
        folder: currentFolder,
        section: currentSection,
        originalContent: currentOriginal,
        refinedContent: currentRefined,
        canvasData: currentCanvasData,
      };

      setNotes(prev => prev.map(n => n.id === noteId ? {
        ...n,
        title: currentTitle,
        content: currentContent,
        folder: currentFolder,
        section: currentSection || null,
        originalContent: currentOriginal || null,
        refinedContent: currentRefined || null,
        canvasData: currentCanvasData
      } : n));

      try {
        const res = await fetch(`/api/notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentTitle,
            content: currentContent,
            folder: currentFolder,
            section: currentSection || null,
            originalContent: currentOriginal || null,
            refinedContent: currentRefined || null,
            canvasData: currentCanvasData
          })
        });
        if (res.ok) {
          const data = await res.json();
          setNotes(prev => prev.map(n => n.id === noteId ? {
            ...n,
            title: data.title,
            content: data.content,
            folder: data.folder,
            section: data.section,
            originalContent: data.originalContent,
            refinedContent: data.refinedContent,
            canvasData: data.canvasData
          } : n));
        }
      } catch (err) {
        console.error('Failed to auto-save note:', err);
      }
    }
  }, []);

  const selectNote = (note: Note) => {
    flushPendingSave();

    setSelectedNoteId(note.id);
    setEditTitle(note.title);
    editTitleRef.current = note.title;

    const contentHtml = migrateMarkdownToHtml(note.content);
    const origHtml = note.originalContent ? migrateMarkdownToHtml(note.originalContent) : contentHtml;
    const refHtml = note.refinedContent ? migrateMarkdownToHtml(note.refinedContent) : '';

    setEditOriginalContent(origHtml);
    setEditRefinedContent(refHtml);

    if (refHtml && note.refinedContent) {
      setNoteTab('refined');
      setEditContent(refHtml);
      editContentRef.current = refHtml;
    } else {
      setNoteTab('original');
      setEditContent(contentHtml);
      editContentRef.current = contentHtml;
    }

    setEditFolder(note.folder);
    editFolderRef.current = note.folder;

    setEditSection(note.section || '');
    editSectionRef.current = note.section || '';

    setEditTags(note.tags || []);
    setEditBacklinks(note.backlinks || []);
    setTagInput('');

    // Parse canvasData
    if (note.canvasData) {
      try {
        const parsed = JSON.parse(note.canvasData);
        setCanvasBlocks(parsed.blocks || []);
        setCanvasGroups(parsed.groups || []);
      } catch (e) {
        setCanvasBlocks([]);
        setCanvasGroups([]);
      }
    } else {
      setCanvasBlocks([]);
      setCanvasGroups([]);
    }

    setSelectedBlockIds([]);

    lastSavedState.current = {
      id: note.id,
      title: note.title,
      content: contentHtml,
      folder: note.folder,
      section: note.section || '',
      originalContent: origHtml,
      refinedContent: refHtml,
      canvasData: note.canvasData || '',
    };

    setRecentNoteIds(prev => [note.id, ...prev.filter(id => id !== note.id)].slice(0, 10));
  };

  const createNewNote = async (templateFolder?: string) => {
    if (!project) return;
    try {
      const folderName = templateFolder || (activeFolder === 'All' ? 'General' : activeFolder);
      const template = NOTE_TEMPLATES[folderName] || DEFAULT_TEMPLATE;
      const dateLabel = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' }).format(new Date());
      const title = template === DEFAULT_TEMPLATE ? template.title : `${template.title} ${dateLabel}`;

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: template.content,
          folder: folderName,
          section: '',
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
    
    // Optimistically update notes state synchronously
    setNotes(prev => prev.map(n => n.id === selectedNoteId ? { ...n, ...updatedFields } : n));
    
    try {
      const res = await fetch(`/api/notes/${selectedNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(prev => prev.map(n => n.id === selectedNoteId ? data : n));
        // Keep lastSavedState in sync for any fields updated
        if (updatedFields.title !== undefined) lastSavedState.current.title = updatedFields.title;
        if (updatedFields.content !== undefined) lastSavedState.current.content = updatedFields.content;
        if (updatedFields.folder !== undefined) lastSavedState.current.folder = updatedFields.folder;
        if (updatedFields.section !== undefined) lastSavedState.current.section = updatedFields.section || '';
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!selectedNoteId || !selectedNote) return;

    if (selectedNote.folder !== 'Trash') {
      try {
        const res = await fetch(`/api/notes/${selectedNoteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder: 'Trash' })
        });
        if (res.ok) {
          const updatedNote = await res.json();
          const remaining = notes.map(n => n.id === selectedNoteId ? updatedNote : n);
          setNotes(remaining);
          
          setEditFolder('Trash');
          editFolderRef.current = 'Trash';
          lastSavedState.current.folder = 'Trash';

          const currentFolderNotes = remaining.filter(n => {
            const matchesFolder = activeFolder === 'Trash'
              ? n.folder === 'Trash'
              : (activeFolder === 'All' ? n.folder !== 'Trash' : n.folder === activeFolder);
            return matchesFolder;
          });

          if (currentFolderNotes.length > 0) {
            selectNote(currentFolderNotes[0]);
          } else {
            setSelectedNoteId(null);
          }
          toast.success('Note moved to Trash 🗑️');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to move note to Trash');
      }
    } else {
      if (!confirm('Are you sure you want to permanently delete this note? This action cannot be undone.')) return;
      try {
        const res = await fetch(`/api/notes/${selectedNoteId}`, { method: 'DELETE' });
        if (res.ok) {
          const remaining = notes.filter(n => n.id !== selectedNoteId);
          setNotes(remaining);

          const currentFolderNotes = remaining.filter(n => {
            const matchesFolder = activeFolder === 'Trash'
              ? n.folder === 'Trash'
              : (activeFolder === 'All' ? n.folder !== 'Trash' : n.folder === activeFolder);
            return matchesFolder;
          });

          if (currentFolderNotes.length > 0) {
            selectNote(currentFolderNotes[0]);
          } else {
            setSelectedNoteId(null);
          }
          toast.success('Note permanently deleted 🗑️');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete note');
      }
    }
  };

  const handleRestore = async () => {
    if (!selectedNoteId || !selectedNote) return;
    try {
      const res = await fetch(`/api/notes/${selectedNoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'General' })
      });
      if (res.ok) {
        const updatedNote = await res.json();
        setNotes(prev => prev.map(n => n.id === selectedNoteId ? updatedNote : n));
        
        setEditFolder('General');
        editFolderRef.current = 'General';
        lastSavedState.current.folder = 'General';
        
        toast.success('Note restored to General folder 📝');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to restore note');
    }
  };

  const handleAddFolder = () => {
    const name = prompt('Enter new folder name:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (folders.includes(trimmed)) {
      toast.error('Folder already exists!');
      return;
    }
    const updated = [...customFolders, trimmed];
    saveCustomFolders(updated);
    setActiveFolder(trimmed);
    toast.success(`Folder "${trimmed}" created! 📂`);
  };

  const handleDeleteFolder = async (folderName: string) => {
    if (!confirm(`Are you sure you want to delete folder "${folderName}"? All notes in this folder will be moved to Trash.`)) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderFrom: folderName, folderTo: 'Trash', projectId: project?.id })
      });
      if (res.ok) {
        setNotes(prev => prev.map(n => n.folder === folderName ? { ...n, folder: 'Trash' } : n));
        
        const updatedCustom = customFolders.filter(cf => cf !== folderName);
        saveCustomFolders(updatedCustom);
        
        if (activeFolder === folderName) {
          setActiveFolder('All');
        }
        
        toast.success(`Folder "${folderName}" and its notes moved to Trash 🗑️`);
      } else {
        toast.error('Failed to update folder notes on server');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete folder');
    }
  };

  const togglePin = (note: Note) => {
    const newVal = !note.isFav;
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, isFav: newVal } : n));
    if (note.id === selectedNoteId) {
      // keep local state in sync, handled via notes array above
    }
    fetch(`/api/notes/${note.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFav: newVal })
    }).catch(err => console.error(err));
    toast.success(newVal ? 'Pinned to top 📌' : 'Unpinned');
  };

  // Debounced auto-save title, content, folder & section
  useEffect(() => {
    if (!selectedNoteId) return;
    const delayDebounce = setTimeout(() => {
      flushPendingSave();
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [editTitle, editContent, editFolder, editSection, selectedNoteId, flushPendingSave]);

  // Flush pending changes on unmount/navigate-away
  useEffect(() => {
    return () => {
      flushPendingSave();
    };
  }, [flushPendingSave]);

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

  // ---- Rich text toolbar commands -------------------------------------
  // These call into the contentEditable editor via its imperative handle.
  // (Replaces the old markdown-prefix `insertFormatting` helper.)
  const applyInline = useCallback((command: string) => {
    editorRef.current?.exec(command);
  }, []);

  const applyBlock = useCallback((tag: 'h1' | 'h2' | 'h3' | 'p') => {
    editorRef.current?.exec('formatBlock', tag);
  }, []);

  const applyList = useCallback((type: 'ul' | 'ol') => {
    editorRef.current?.exec(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
  }, []);

  const applyChecklist = useCallback(() => {
    const el = editorRef.current?.getEl();
    if (!el) return;
    el.focus();
    document.execCommand('insertUnorderedList');
    // Tag the newly created <li> as a checkbox item
    const sel = window.getSelection();
    let node: Node | null = sel?.rangeCount ? sel.getRangeAt(0).startContainer : null;
    while (node && node !== el) {
      if (node.nodeType === 1 && (node as HTMLElement).tagName === 'LI') {
        (node as HTMLElement).classList.add('rte-checkbox-item');
        (node as HTMLElement).setAttribute('data-checked', 'false');
        break;
      }
      node = node.parentNode;
    }
    setEditContent(el.innerHTML);
  }, []);

  const applyHighlight = useCallback((bg: string) => {
    editorRef.current?.insertHighlight(bg);
  }, []);

  // Download Note as Markdown file (HTML content is converted to clean markdown)
  const downloadNote = () => {
    if (!selectedNote) return;
    const markdownBody = htmlToMarkdown(editContent);
    const fileContent = `# ${editTitle}\n\nFolder: ${editFolder}\nTags: ${editTags.join(', ')}\n\n${markdownBody}`;
    const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${editTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Markdown file downloaded! 📥');
  };

  // Export every note in this project as a .zip of markdown files.
  // JSZip is loaded from a CDN on demand so the page bundle stays lean.
  const exportAllNotes = async () => {
    if (notes.length === 0) {
      toast.error('No notes to export yet.');
      return;
    }
    setIsExporting(true);
    try {
      if (!(window as any).JSZip) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load export library'));
          document.body.appendChild(script);
        });
      }
      const JSZip = (window as any).JSZip;
      const zip = new JSZip();
      const usedNames = new Set<string>();

      notes.forEach(n => {
        let baseName = n.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'untitled';
        let fileName = `${baseName}.md`;
        let i = 2;
        while (usedNames.has(fileName)) {
          fileName = `${baseName}-${i}.md`;
          i++;
        }
        usedNames.add(fileName);

        const markdownBody = htmlToMarkdown(migrateMarkdownToHtml(n.content));
        const fileContent = `# ${n.title}\n\nFolder: ${n.folder}${n.section ? `\nSection: ${n.section}` : ''}\nTags: ${(n.tags || []).join(', ')}\nCreated: ${n.createdAt}\n\n${markdownBody}`;
        zip.folder(n.folder || 'General')?.file(fileName, fileContent);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project?.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'notes'}-export.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${notes.length} notes as .zip 📦`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export notes');
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleNoteTab = (targetTab: 'original' | 'refined') => {
    if (targetTab === noteTab) return;
    if (noteTab === 'original') {
      setEditOriginalContent(editContent);
      editOriginalContentRef.current = editContent;
      const targetContent = editRefinedContent || editContent;
      setEditContent(targetContent);
      editContentRef.current = targetContent;
      setNoteTab('refined');
      handleSave({ originalContent: editContent, content: targetContent });
    } else {
      setEditRefinedContent(editContent);
      editRefinedContentRef.current = editContent;
      const targetContent = editOriginalContent || editContent;
      setEditContent(targetContent);
      editContentRef.current = targetContent;
      setNoteTab('original');
      handleSave({ refinedContent: editContent, content: targetContent });
    }
  };

  // AI Helper: call Gemini
  const runAiHelper = async (type: 'summarize' | 'refine' | 'extract-meeting' | 'refine-layman') => {
    const plainText = htmlToPlainText(editContent);
    if (!plainText.trim()) {
      toast.error('Write some content first before calling AI helper.');
      return;
    }
    setIsAiLoading(true);
    try {
      let endpointBody: any = {};
      if (type === 'summarize' || type === 'extract-meeting') {
        endpointBody = {
          action: 'extract-meeting-notes',
          transcript: plainText
        };
      } else if (type === 'refine') {
        endpointBody = {
          action: 'refine-requirements',
          laymanText: plainText
        };
      } else if (type === 'refine-layman') {
        endpointBody = {
          action: 'refine-layman-notes',
          noteContent: plainText
        };
      }

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpointBody)
      });

      if (res.ok) {
        const data = await res.json();
        const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (type === 'summarize' || type === 'extract-meeting') {
          const html =
            `<h2>AI Meeting Summary</h2><div>${esc(data.summary || '')}</div>` +
            `<h3>Decisions</h3><ul>${(data.decisions || []).map((d: string) => `<li>${esc(d)}</li>`).join('') || '<li>\u200B</li>'}</ul>` +
            `<h3>Action Items</h3><ul>${(data.actionItems || []).map((a: any) => `<li>${esc(a.task)} (${esc(a.assignee || 'TBD')})</li>`).join('') || '<li>\u200B</li>'}</ul>` +
            `<h3>Risks</h3><ul>${(data.risks || []).map((r: string) => `<li>${esc(r)}</li>`).join('') || '<li>\u200B</li>'}</ul>`;
          const updatedVal = editContent + html;
          setEditContent(updatedVal);
          editContentRef.current = updatedVal;
          handleSave({ content: updatedVal });
          toast.success('Meeting summary added! 🧠');
        } else if (type === 'refine') {
          const origVal = editOriginalContent || editContent;
          const html =
            `<h2>AI Technical Specification</h2>` +
            `<h3>Functional Requirements</h3><ul>${(data.functionalReqs || []).map((f: string) => `<li>${esc(f)}</li>`).join('') || '<li>\u200B</li>'}</ul>` +
            `<h3>Tech Specs</h3><ul><li>APIs: ${esc((data.technicalSpecs?.apis || []).join(', '))}</li><li>Database: ${esc((data.technicalSpecs?.database || []).join(', '))}</li></ul>` +
            `<h3>Edge Cases</h3><ul>${(data.edgeCases || []).map((e: string) => `<li>${esc(e)}</li>`).join('') || '<li>\u200B</li>'}</ul>`;
          const updatedVal = editContent + html;
          setEditOriginalContent(origVal);
          setEditRefinedContent(updatedVal);
          setEditContent(updatedVal);
          editContentRef.current = updatedVal;
          setNoteTab('refined');
          handleSave({ originalContent: origVal, refinedContent: updatedVal, content: updatedVal });
          toast.success('Technical specs appended! 🏗️');
        } else if (type === 'refine-layman') {
          const origVal = editOriginalContent || editContent;
          const refinedVal = migrateMarkdownToHtml(data.refinedNotes || '');
          setEditOriginalContent(origVal);
          setEditRefinedContent(refinedVal);
          setEditContent(refinedVal);
          editContentRef.current = refinedVal;
          setNoteTab('refined');
          handleSave({ originalContent: origVal, refinedContent: refinedVal, content: refinedVal });
          toast.success('Layman text beautifully refined! ✨');
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

  // Canvas Block & Grouping handlers
  const addCanvasBlock = (x = 40, y = 40, text = 'New Canvas Note...') => {
    const newBlock: CanvasBlock = {
      id: 'block-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      x,
      y,
      width: 220,
      height: 120,
      content: text,
      color: '#fff9c4'
    };
    const updated = [...canvasBlocks, newBlock];
    setCanvasBlocks(updated);
    canvasBlocksRef.current = updated;
    flushPendingSave();
    toast.success('Added freeform text block! 📝');
  };

  const updateCanvasBlock = (id: string, updates: Partial<CanvasBlock>) => {
    const updated = canvasBlocks.map(b => b.id === id ? { ...b, ...updates } : b);
    setCanvasBlocks(updated);
    canvasBlocksRef.current = updated;
  };

  const deleteCanvasBlock = (id: string) => {
    const updated = canvasBlocks.filter(b => b.id !== id);
    setCanvasBlocks(updated);
    canvasBlocksRef.current = updated;
    setSelectedBlockIds(prev => prev.filter(bId => bId !== id));
    flushPendingSave();
  };

  const toggleSelectBlock = (id: string, multi = false) => {
    if (multi) {
      setSelectedBlockIds(prev => prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]);
    } else {
      setSelectedBlockIds([id]);
    }
  };

  const groupSelectedBlocks = () => {
    if (selectedBlockIds.length < 2) {
      toast.error('Select at least 2 canvas blocks to group them.');
      return;
    }
    const targetBlocks = canvasBlocks.filter(b => selectedBlockIds.includes(b.id));
    if (targetBlocks.length === 0) return;

    const minX = Math.min(...targetBlocks.map(b => b.x)) - 16;
    const minY = Math.min(...targetBlocks.map(b => b.y)) - 36;
    const maxX = Math.max(...targetBlocks.map(b => b.x + b.width)) + 16;
    const maxY = Math.max(...targetBlocks.map(b => b.y + b.height)) + 16;

    const newGroup: CanvasGroup = {
      id: 'group-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: 'Grouped Section ' + (canvasGroups.length + 1),
      color: '#f1f5f9',
      x: Math.max(0, minX),
      y: Math.max(0, minY),
      width: Math.max(260, maxX - minX),
      height: Math.max(160, maxY - minY)
    };

    const updatedBlocks = canvasBlocks.map(b => selectedBlockIds.includes(b.id) ? { ...b, groupId: newGroup.id } : b);
    const updatedGroups = [...canvasGroups, newGroup];

    setCanvasBlocks(updatedBlocks);
    setCanvasGroups(updatedGroups);
    canvasBlocksRef.current = updatedBlocks;
    canvasGroupsRef.current = updatedGroups;
    flushPendingSave();
    toast.success(`Grouped ${selectedBlockIds.length} items together! 📦`);
  };

  const ungroupBlocks = (groupId: string) => {
    const updatedGroups = canvasGroups.filter(g => g.id !== groupId);
    const updatedBlocks = canvasBlocks.map(b => b.groupId === groupId ? { ...b, groupId: undefined } : b);

    setCanvasGroups(updatedGroups);
    setCanvasBlocks(updatedBlocks);
    canvasGroupsRef.current = updatedGroups;
    canvasBlocksRef.current = updatedBlocks;
    flushPendingSave();
    toast.success('Ungrouped items 🔓');
  };


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

  // Word count + reading time for the active note (computed from plain
  // text, not raw HTML, so tags don't inflate the character count)
  const editorStats = useMemo(() => {
    const plain = htmlToPlainText(editContent).trim();
    const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
    const chars = plain.length;
    const readingMins = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readingMins };
  }, [editContent]);

  // Parse headings from the content for the floating smart scroll Table of Contents
  const headings = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(editContent || '', 'text/html');
    const elements = doc.querySelectorAll('h1, h2, h3');
    return Array.from(elements).map((el, index) => ({
      tag: el.tagName.toLowerCase() as 'h1' | 'h2' | 'h3',
      text: el.textContent || '',
      index,
    }));
  }, [editContent]);

  // ---- Drag-to-resize handlers ----------------------------------------
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      if (resizingRef.current === 'sidebar') {
        const next = Math.min(420, Math.max(SIDEBAR_MIN_WIDTH, e.clientX - 24));
        setSidebarWidth(next);
        if (isSidebarCollapsed && next > SIDEBAR_MIN_WIDTH) setIsSidebarCollapsed(false);
      } else if (resizingRef.current === 'list') {
        const sidebarEl = (isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth) + 24;
        const next = Math.min(LIST_MAX_WIDTH, Math.max(LIST_MIN_WIDTH, e.clientX - sidebarEl));
        setListWidth(next);
      }
    };
    const handleMouseUp = () => { resizingRef.current = null; document.body.style.cursor = ''; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSidebarCollapsed, sidebarWidth]);

  const startResizing = (which: 'sidebar' | 'list') => (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = which;
    document.body.style.cursor = 'col-resize';
  };

  // ---- Keyboard shortcuts ----------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+K: quick switcher (works everywhere)
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSwitcherOpen(prev => !prev);
        return;
      }

      // Escape closes overlays
      if (e.key === 'Escape') {
        if (isQuickSwitcherOpen) setIsQuickSwitcherOpen(false);
        if (isTypographyOpen) setIsTypographyOpen(false);
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        return;
      }

      // Cmd/Ctrl+N: new note (works everywhere, but don't fight typing "n")
      if (isMod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewNote();
        return;
      }

      // Cmd/Ctrl+S: force save now
      if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (selectedNoteId) {
          handleSave({ title: editTitle, content: editContent, folder: editFolder, section: editSection || null });
          toast.success('Saved ✓');
        }
        return;
      }

      // Cmd/Ctrl+Shift+F: toggle full screen Focus Mode
      if (isMod && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFocusMode(prev => !prev);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickSwitcherOpen, isTypographyOpen, isShortcutsOpen, selectedNoteId, editTitle, editContent, editFolder, editSection, isFocusMode]);

  // Lock body scroll in Focus Mode
  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isFocusMode]);

  // Focus quick switcher input when opened
  useEffect(() => {
    if (isQuickSwitcherOpen) {
      setQuickSwitcherQuery('');
      setTimeout(() => quickSwitcherInputRef.current?.focus(), 30);
    }
  }, [isQuickSwitcherOpen]);

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
    <div className="h-screen bg-[#fefdfb] lg:pt-16 flex flex-col relative overflow-hidden">
      <div className="max-w-full mx-auto w-full flex-1 flex flex-col space-y-4 h-full min-h-0 px-4 pb-4">

        {/* Navigation & Header */}
        {!isFocusMode && (
          <div className="lg:absolute lg:top-[20px] lg:left-[140px] lg:right-[145px] lg:z-[10005] lg:bg-transparent lg:px-0 lg:py-0 lg:border-0 lg:shadow-none flex max-w-full flex-col lg:flex-row lg:items-center justify-between pb-2 border-b border-[#2d2d2d]/10 lg:border-b-0 gap-4">
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

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsQuickSwitcherOpen(true)}
                variant="ghost"
                className="font-kalam text-xs h-9 gap-2 border-2 border-[#2d2d2d]/10 bg-white hover:bg-slate-50 rounded-xl text-slate-500 hidden sm:flex"
                title="Quick switcher"
              >
                <Search className="w-3.5 h-3.5" /> Jump to note
                <kbd className="flex items-center gap-0.5 text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 ml-1">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </Button>

              <Button
                onClick={exportAllNotes}
                disabled={isExporting}
                variant="ghost"
                size="icon"
                className="h-9 w-9 border-2 border-[#2d2d2d]/10 bg-white hover:bg-slate-50 rounded-xl text-slate-500"
                title="Export all notes as .zip"
              >
                {isExporting ? <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" /> : <FileArchive className="w-4 h-4" />}
              </Button>

              <Button
                onClick={() => setIsShortcutsOpen(true)}
                variant="ghost"
                size="icon"
                className="h-9 w-9 border-2 border-[#2d2d2d]/10 bg-white hover:bg-slate-50 rounded-xl text-slate-500"
                title="Keyboard shortcuts"
              >
                <Keyboard className="w-4 h-4" />
              </Button>

              {/* View Mode Tabs */}
              <div className="flex gap-1 bg-[#f5f0e6] p-1 rounded-xl border-2 border-[#2d2d2d] shadow-sm">
                <Button
                  onClick={() => setActiveTab('workspace')}
                  variant={activeTab === 'workspace' ? 'default' : 'ghost'}
                  className={`font-kalam text-xs h-8 px-3 rounded-lg ${activeTab === 'workspace' ? 'bg-[#2d2d2d] text-white hover:bg-slate-800' : 'text-[#2d2d2d] hover:bg-[#2d2d2d]/10'}`}
                >
                  Workspace
                </Button>
                <Button
                  onClick={() => setActiveTab('timeline')}
                  variant={activeTab === 'timeline' ? 'default' : 'ghost'}
                  className={`font-kalam text-xs h-8 px-3 rounded-lg ${activeTab === 'timeline' ? 'bg-[#2d2d2d] text-white hover:bg-slate-800' : 'text-[#2d2d2d] hover:bg-[#2d2d2d]/10'}`}
                >
                  Daily Timeline
                </Button>
              </div>

              <Button
                onClick={() => setIsFocusMode(prev => !prev)}
                variant="ghost"
                size="icon"
                className="h-9 w-9 border-2 border-[#2d2d2d]/10 bg-white hover:bg-slate-50 rounded-xl text-slate-500"
                title={isFocusMode ? "Exit Full Screen (Ctrl+Shift+F)" : "Full Screen Focus (Ctrl+Shift+F)"}
              >
                {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>

              <Badge className="font-kalam bg-amber-50 text-amber-800 border-2 border-amber-500/20 px-3 py-1 rounded-full text-xs hidden md:inline-flex">
                Personal Notebook
              </Badge>
            </div>
          </div>
        )}

        {isFocusMode && <div className="fixed inset-0 bg-[#fefdfb] z-[19999]" />}

        {activeTab === 'workspace' ? (
          /* 3-Column Smart Notes Workspace — widths driven by inline style
             (not Tailwind template-literal classes) so collapse + drag-resize
             both work, and the editor column always fills remaining space. */
          <div className={isFocusMode
            ? "fixed inset-4 md:inset-6 z-[20000] flex min-h-0 border-2 border-[#2d2d2d] rounded-2xl overflow-hidden bg-white shadow-[6px_6px_0px_rgba(45,45,45,1)]"
            : "flex-1 flex min-h-0 h-full border-2 border-[#2d2d2d] rounded-2xl overflow-hidden bg-white shadow-[6px_6px_0px_rgba(45,45,45,1)]"
          }>

            {/* COLUMN 1: Sidebar Folder Navigation */}
            <div
              style={{ width: isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth, flex: '0 0 auto' }}
              className="bg-[#f5f0e6]/30 border-r-2 border-[#2d2d2d] flex flex-col p-3 relative"
            >
              <div className="flex items-center justify-between mb-4">
                {!isSidebarCollapsed ? (
                  <h2 className="font-caveat text-2xl font-bold text-[#2d2d2d] flex items-center gap-1.5">
                    <BrainCircuit className="w-5 h-5 text-amber-600" /> Folders
                  </h2>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 border border-[#2d2d2d]/10 rounded-lg bg-white shadow-sm hover:bg-slate-50"
                    title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                  >
                    {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </Button>
                  {!isSidebarCollapsed && (
                    <>
                      <Button onClick={handleAddFolder} variant="ghost" size="icon" className="h-8 w-8 border border-[#2d2d2d] rounded-lg bg-white shadow-sm hover:translate-y-[-1px] transition-all" title="New folder">
                        <FolderPlus className="w-4 h-4 text-[#2d2d2d]" />
                      </Button>
                      <Button onClick={() => createNewNote()} variant="ghost" size="icon" className="h-8 w-8 border border-[#2d2d2d] rounded-lg bg-white shadow-sm hover:translate-y-[-1px] transition-all" title="New note (⌘N)">
                        <Plus className="w-4 h-4 text-[#2d2d2d]" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {!isSidebarCollapsed && (
                <button
                  onClick={() => setFilterTab(p => p === 'pinned' ? 'all' : 'pinned')}
                  className={`w-full text-left font-kalam text-xs py-2 px-3 rounded-xl border-2 flex items-center gap-2 mb-2 transition-all ${
                    filterTab === 'pinned'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-500 border-[#2d2d2d]/10 hover:border-[#2d2d2d]/30'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${filterTab === 'pinned' ? 'fill-amber-500 text-amber-500' : ''}`} />
                  Pinned only
                </button>
              )}

              <div className={`space-y-1 pr-1 ${isSidebarCollapsed ? 'flex-1 overflow-y-auto' : 'max-h-[48%] overflow-y-auto border-b border-[#2d2d2d]/10 pb-3 mb-2'}`}>
                {folders.map(f => {
                  const count = f === 'All'
                    ? notes.filter(n => n.folder !== 'Trash').length
                    : notes.filter(n => n.folder === f).length;
                  const hasTemplate = Boolean(NOTE_TEMPLATES[f]);
                  return (
                    <div key={f} className="group relative">
                      <button
                        onClick={() => setActiveFolder(f)}
                        className={`w-full text-left font-kalam text-sm py-2.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                          isSidebarCollapsed ? 'px-2 justify-center' : 'px-3'
                        } ${
                          activeFolder === f
                            ? 'bg-[#2d2d2d] text-white border-[#2d2d2d] shadow-sm'
                            : 'bg-white text-[#2d2d2d] border-[#2d2d2d]/10 hover:border-[#2d2d2d]/30'
                        }`}
                        title={f}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Folder className={`w-4 h-4 shrink-0 ${activeFolder === f ? 'text-amber-300' : 'text-amber-500'}`} />
                          {!isSidebarCollapsed && <span className="truncate">{f}</span>}
                        </span>
                        {!isSidebarCollapsed && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {f !== 'All' && f !== 'Trash' && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(f);
                                }}
                                className={`p-0.5 rounded transition-all hover:bg-red-500 hover:text-white ${
                                  activeFolder === f ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-white'
                                }`}
                                title={`Delete folder "${f}"`}
                              >
                                <X className="w-3 h-3" />
                              </span>
                            )}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold shrink-0 ${activeFolder === f ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 border'}`}>
                              {count}
                            </span>
                          </div>
                        )}
                      </button>
                      {!isSidebarCollapsed && hasTemplate && (
                        <button
                          onClick={(e) => { e.stopPropagation(); createNewNote(f); }}
                          className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all h-6 w-6 flex items-center justify-center rounded-full bg-amber-500 text-white shadow-md hover:bg-amber-600"
                          title={`New ${f} note from template`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isSidebarCollapsed && (
                <div className="flex-1 flex flex-col min-h-0 pt-2">
                  <h3 className="font-caveat text-xl font-bold text-[#2d2d2d] flex items-center gap-1.5 mb-2 shrink-0">
                    <FileText className="w-4 h-4 text-amber-600" /> Recent Notes
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[100px]">
                    {recentNotes.length > 0 ? (
                      recentNotes.map(rn => (
                        <button
                          key={rn.id}
                          onClick={() => selectNote(rn)}
                          className={`w-full text-left font-kalam text-xs p-2 rounded-lg border flex items-center gap-2 transition-all ${
                            selectedNoteId === rn.id
                              ? 'bg-[#fffacd] border-[#2d2d2d] text-[#2d2d2d] shadow-sm'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border-[#2d2d2d]/10'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate flex-1">{rn.title || 'Untitled'}</span>
                        </button>
                      ))
                    ) : (
                      <p className="font-kalam text-[11px] text-slate-400 italic px-2">No recent notes</p>
                    )}
                  </div>
                </div>
              )}

              {/* Drag handle for sidebar */}
              <div
                onMouseDown={startResizing('sidebar')}
                className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-amber-400/40 transition-colors group/handle z-10"
              >
                <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-3 h-8 rounded-full bg-white border border-[#2d2d2d]/20 opacity-0 group-hover/handle:opacity-100 flex items-center justify-center shadow-sm">
                  <GripVertical className="w-2.5 h-2.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* COLUMN 2: Notes List inside selected folder */}
            <div
              style={{ width: listWidth, flex: '0 0 auto' }}
              className="border-r-2 border-[#2d2d2d] flex flex-col p-4 bg-[#fdfbf7]/40 relative"
            >
              <div className="flex gap-1.5 mb-2 relative">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search notes..."
                    className="pl-8 journal-input text-xs h-9 border-[#2d2d2d]/25 bg-white"
                  />
                </div>
                <Button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 border-2 rounded-xl transition-all ${
                    showDatePicker || startDate || endDate
                      ? 'bg-amber-100 border-amber-500 text-amber-800'
                      : 'bg-white border-[#2d2d2d]/10 hover:border-[#2d2d2d]/30 text-slate-500'
                  }`}
                  title="Date Range Filter"
                >
                  <CalendarDays className="w-4 h-4" />
                </Button>
              </div>

              {showDatePicker && (
                <div className="bg-[#f5f0e6]/50 border-2 border-[#2d2d2d]/20 rounded-xl p-2.5 mb-3 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="font-kalam text-[11px] font-bold text-[#2d2d2d]">Filter by Date Range:</span>
                    {(startDate || endDate) && (
                      <button
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                        className="font-kalam text-[10px] text-red-600 hover:text-red-700 font-bold"
                      >
                        Clear Range
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <span className="font-kalam text-[9px] text-slate-500">From</span>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="h-8 text-xs font-kalam bg-white border-[#2d2d2d]/20 p-1"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-kalam text-[9px] text-slate-500">To</span>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="h-8 text-xs font-kalam bg-white border-[#2d2d2d]/20 p-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-1 bg-[#f5f0e6] p-1 rounded-xl border-2 border-[#2d2d2d]/20 shadow-sm mb-3">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`flex-1 text-center font-kalam text-xs py-1.5 rounded-lg transition-all ${
                    filterTab === 'all'
                      ? 'bg-[#2d2d2d] text-white font-bold'
                      : 'text-slate-600 hover:bg-[#2d2d2d]/5'
                  }`}
                >
                  All Notes
                </button>
                <button
                  onClick={() => setFilterTab('pinned')}
                  className={`flex-1 text-center font-kalam text-xs py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                    filterTab === 'pinned'
                      ? 'bg-[#2d2d2d] text-white font-bold'
                      : 'text-slate-600 hover:bg-[#2d2d2d]/5'
                  }`}
                >
                  <Star className={`w-3 h-3 ${filterTab === 'pinned' ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  Pinned
                </button>
                <button
                  onClick={() => setFilterTab('recent')}
                  className={`flex-1 text-center font-kalam text-xs py-1.5 rounded-lg transition-all ${
                    filterTab === 'recent'
                      ? 'bg-[#2d2d2d] text-white font-bold'
                      : 'text-slate-600 hover:bg-[#2d2d2d]/5'
                  }`}
                >
                  Recent
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {chronologicalGroups.map(group => (
                  <div key={group.name} className="space-y-2">
                    <div className="flex items-center gap-1.5 border-b border-[#2d2d2d]/10 pb-1 mb-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-caveat text-base font-bold text-slate-700">{group.name}</span>
                      <span className="text-[10px] text-slate-400 font-kalam ml-auto">({group.notes.length})</span>
                    </div>

                    <div className="space-y-2">
                      {group.notes.map(n => (
                        <div
                          key={n.id}
                          onClick={() => selectNote(n)}
                          className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all hover:scale-[1.01] relative ${
                            selectedNoteId === n.id
                              ? 'bg-[#fffacd] border-[#2d2d2d] shadow-[3px_3px_0px_rgba(45,45,45,1)]'
                              : 'bg-white border-[#2d2d2d]/10 hover:border-[#2d2d2d]/30 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-caveat text-xl font-bold text-[#2d2d2d] truncate flex-1">{n.title}</h3>
                            <button
                              onClick={(e) => { e.stopPropagation(); togglePin(n); }}
                              className="shrink-0 p-0.5 -mt-0.5 -mr-0.5 hover:scale-110 transition-transform"
                              title={n.isFav ? 'Unpin' : 'Pin to top'}
                            >
                              <Star className={`w-4 h-4 ${n.isFav ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                            </button>
                          </div>
                          <p className="font-kalam text-xs text-slate-500 line-clamp-2 leading-snug mb-2">
                            {htmlToPlainText(n.content)}
                          </p>
                          <div className="flex items-center justify-between flex-wrap gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="outline" className="text-[9px] font-kalam py-0 bg-slate-50">{n.folder}</Badge>
                              {n.tags?.slice(0, 2).map(t => (
                                <Badge key={t} variant="secondary" className="text-[9px] font-kalam py-0 bg-amber-50 text-amber-700 border-amber-200">{t}</Badge>
                              ))}
                            </div>
                            <span className="text-[9px] font-kalam text-slate-400">
                              {new Date(n.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'short' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredNotes.length === 0 && (
                  <p className="font-kalam text-xs text-slate-400 italic text-center py-12">
                    {filterTab === 'pinned' ? 'No pinned notes in this folder' : 'No notes in this folder'}
                  </p>
                )}
              </div>

              {/* Drag handle for list column */}
              <div
                onMouseDown={startResizing('list')}
                className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-amber-400/40 transition-colors group/handle z-10"
              >
                <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-3 h-8 rounded-full bg-white border border-[#2d2d2d]/20 opacity-0 group-hover/handle:opacity-100 flex items-center justify-center shadow-sm">
                  <GripVertical className="w-2.5 h-2.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* COLUMN 3: Rich Notebook Editor & Markdown Preview — fills all remaining width */}
            <div className="flex-1 min-w-0 flex flex-col p-4 bg-white relative">
              {selectedNote ? (
                <div className="flex flex-col h-full space-y-3">

                  {/* Note Header Info */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2d2d2d]/10 pb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <button
                        onClick={() => togglePin(selectedNote)}
                        className="shrink-0 hover:scale-110 transition-transform"
                        title={selectedNote.isFav ? 'Unpin' : 'Pin to top'}
                      >
                        <Star className={`w-5 h-5 ${selectedNote.isFav ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                      </button>
                      <input
                        value={editTitle}
                        onChange={e => {
                          const val = e.target.value;
                          setEditTitle(val);
                          editTitleRef.current = val;
                        }}
                        placeholder="Untitled Note"
                        className="bg-transparent font-caveat text-3xl font-bold border-b-2 border-transparent hover:border-slate-200 focus:border-[#2d2d2d] outline-none text-[#2d2d2d] py-1 flex-1 min-w-0"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-kalam text-xs text-slate-400">Section:</span>
                        <Input
                          value={editSection}
                          onChange={e => {
                            const val = e.target.value;
                            setEditSection(val);
                            editSectionRef.current = val;
                          }}
                          placeholder="Section/Tag..."
                          className="h-8 text-xs font-kalam w-28 border-[#2d2d2d]/30"
                        />
                      </div>

                      <Select value={editFolder} onValueChange={val => {
                        setEditFolder(val);
                        editFolderRef.current = val;
                      }}>
                        <SelectTrigger className="h-8 text-xs font-kalam w-28 border-[#2d2d2d]/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d] font-kalam">
                          {folders.filter(f => f !== 'All').map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedNote.folder === 'Trash' && (
                        <Button
                          onClick={handleRestore}
                          variant="ghost"
                          className="h-8 px-3 font-kalam text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 gap-1.5"
                          title="Restore Note"
                        >
                          <Undo2 className="w-3.5 h-3.5" /> Restore
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          if (selectedNoteId) {
                            handleSave({ title: editTitle, content: editContent, folder: editFolder, section: editSection || null });
                            toast.success('Saved ✓');
                          }
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50"
                        title="Save Note (⌘S)"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button onClick={downloadNote} variant="ghost" size="icon" className="h-8 w-8 text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50" title="Download Markdown">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button onClick={handleDelete} variant="ghost" size="icon" className="h-8 w-8 text-red-500 border border-red-200 rounded-lg hover:bg-red-50" title={selectedNote.folder === 'Trash' ? 'Permanently Delete' : 'Move to Trash'} >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setIsFocusMode(prev => !prev)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50"
                        title={isFocusMode ? "Exit Full Screen (Ctrl+Shift+F)" : "Full Screen Focus (Ctrl+Shift+F)"}
                      >
                        {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Advanced Editor Controls Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border-2 border-[#2d2d2d]/10 rounded-xl">
                    {/* Font Settings Toggle & Freeform Canvas */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        onClick={() => setIsTypographyOpen(true)}
                        variant="ghost"
                        size="sm"
                        className="h-8 font-kalam text-xs gap-1.5 border border-[#2d2d2d]/20 bg-white hover:bg-slate-50 shadow-sm rounded-lg"
                      >
                        <Palette className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        Style Lab
                      </Button>

                      {/* Section Divider Dropdown */}
                      <div className="relative">
                        <Button
                          onClick={() => setShowDividerMenu(!showDividerMenu)}
                          variant="ghost"
                          size="sm"
                          className="h-8 font-kalam text-xs gap-1 border border-[#2d2d2d]/20 bg-white hover:bg-slate-50 shadow-sm rounded-lg text-slate-700"
                          title="Insert Section Divider Line"
                        >
                          <Layers className="w-3.5 h-3.5 text-amber-600" />
                          Section Divider
                        </Button>
                        {showDividerMenu && (
                          <div className="absolute left-0 top-full mt-1 bg-white border-2 border-[#2d2d2d] rounded-xl shadow-lg p-2 z-50 w-44 space-y-1 font-kalam text-xs">
                            <button
                              onClick={() => { editorRef.current?.insertSectionDivider('wavy'); setShowDividerMenu(false); }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-50 font-bold flex items-center justify-between"
                            >
                              <span>Wavy Line</span>
                              <span className="text-[10px] text-amber-600">〰️</span>
                            </button>
                            <button
                              onClick={() => { editorRef.current?.insertSectionDivider('dashed'); setShowDividerMenu(false); }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-50 font-bold flex items-center justify-between"
                            >
                              <span>Dashed Line</span>
                              <span className="text-[10px] text-slate-500">---</span>
                            </button>
                            <button
                              onClick={() => { editorRef.current?.insertSectionDivider('gradient'); setShowDividerMenu(false); }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-50 font-bold flex items-center justify-between"
                            >
                              <span>Gradient Glow</span>
                              <span className="text-[10px] text-purple-600">✨</span>
                            </button>
                            <button
                              onClick={() => { editorRef.current?.insertSectionDivider('vintage'); setShowDividerMenu(false); }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-50 font-bold flex items-center justify-between"
                            >
                              <span>Vintage Double</span>
                              <span className="text-[10px] text-amber-800">═</span>
                            </button>
                            <button
                              onClick={() => { editorRef.current?.insertSectionDivider('stitched'); setShowDividerMenu(false); }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-50 font-bold flex items-center justify-between"
                            >
                              <span>Stitched Dotted</span>
                              <span className="text-[10px] text-amber-700">···</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Freeform Canvas & Grouping Tools */}
                      <Button
                        onClick={() => setIsCanvasActive(!isCanvasActive)}
                        variant="ghost"
                        size="sm"
                        className={`h-8 font-kalam text-xs gap-1 border-2 transition-all rounded-lg ${
                          isCanvasActive ? 'bg-amber-100 border-amber-600 text-amber-900 font-bold' : 'border-[#2d2d2d]/20 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        ✍️ Canvas Notes
                      </Button>
                      {isCanvasActive && (
                        <>
                          <Button
                            onClick={() => addCanvasBlock(60, 60)}
                            variant="ghost"
                            size="sm"
                            className="h-8 font-kalam text-xs bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-lg"
                          >
                            + Text Box
                          </Button>
                          <Button
                            onClick={groupSelectedBlocks}
                            variant="ghost"
                            size="sm"
                            disabled={selectedBlockIds.length < 2}
                            className="h-8 font-kalam text-xs bg-purple-50 border border-purple-300 text-purple-800 hover:bg-purple-100 disabled:opacity-50 rounded-lg"
                            title="Group selected items (tldr style)"
                          >
                            📦 Group ({selectedBlockIds.length})
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Undo / Redo */}
                    <div className="flex items-center gap-1 border-l pl-2 border-[#2d2d2d]/10">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded hover:bg-slate-200"
                        onClick={() => editorRef.current?.exec('undo')}
                        title="Undo (⌘Z)"
                      >
                        <Undo2 className="w-3.5 h-3.5 text-slate-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded hover:bg-slate-200"
                        onClick={() => editorRef.current?.exec('redo')}
                        title="Redo (⌘Y / ⌘⇧Z)"
                      >
                        <Redo2 className="w-3.5 h-3.5 text-slate-700" />
                      </Button>
                    </div>

                    {/* Text & List Toolbar */}
                    <div className="flex items-center gap-1 border-l pl-2 border-[#2d2d2d]/10">
                      <Button
                        variant="ghost" size="icon"
                        className={`h-6 w-6 rounded hover:bg-slate-200 ${activeFormats.bold ? 'bg-slate-800 text-white hover:bg-slate-800' : ''}`}
                        onClick={() => applyInline('bold')} title="Bold (⌘B)"
                      ><Bold className="w-3 h-3" /></Button>
                      <Button
                        variant="ghost" size="icon"
                        className={`h-6 w-6 rounded hover:bg-slate-200 ${activeFormats.italic ? 'bg-slate-800 text-white hover:bg-slate-800' : ''}`}
                        onClick={() => applyInline('italic')} title="Italic (⌘I)"
                      ><Italic className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-200" onClick={() => applyBlock('h1')} title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-200" onClick={() => applyBlock('h2')} title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-200" onClick={() => applyBlock('h3')} title="Heading 3"><Heading3 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-200" onClick={() => editorRef.current?.insertTable()} title="Insert Table"><Table className="w-3.5 h-3.5" /></Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded hover:bg-slate-200 text-amber-700"
                        onClick={() => {
                          const name = prompt('Enter Assignee Name or Tag text:');
                          if (name?.trim()) {
                            editorRef.current?.insertPill(name.trim());
                          }
                        }}
                        title="Insert Assignee/Tag Pill"
                      >
                        <User className="w-3.5 h-3.5" />
                      </Button>

                      {/* List controls — bullets, numbered, checkboxes, indent/outdent */}
                      <div className="flex items-center gap-0.5 border-l pl-1.5 border-[#2d2d2d]/10">
                        <Button
                          variant="ghost" size="icon"
                          className={`h-6 w-6 rounded hover:bg-slate-200 ${activeFormats.ul ? 'bg-slate-800 text-white hover:bg-slate-800' : ''}`}
                          onClick={() => applyList('ul')} title="Bulleted list"
                        ><List className="w-3.5 h-3.5" /></Button>
                        <Button
                          variant="ghost" size="icon"
                          className={`h-6 w-6 rounded hover:bg-slate-200 ${activeFormats.ol ? 'bg-slate-800 text-white hover:bg-slate-800' : ''}`}
                          onClick={() => applyList('ol')} title="Numbered list"
                        ><ListOrdered className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-200" onClick={applyChecklist} title="Checklist"><ListChecks className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-200" onClick={() => applyInline('outdent')} title="Outdent (Shift+Tab)"><Outdent className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-slate-200" onClick={() => applyInline('indent')} title="Indent (Tab)"><Indent className="w-3.5 h-3.5" /></Button>
                      </div>

                      {/* Highlighter Colors — Includes RED color */}
                      <div className="flex items-center gap-0.5 border-l pl-1.5 border-[#2d2d2d]/10">
                        <button onClick={() => applyHighlight('#fecdd3')} className="w-4 h-4 rounded-full bg-[#fecdd3] border border-[#2d2d2d]/20 hover:scale-110 transition-transform" title="Red Highlight" />
                        <button onClick={() => applyHighlight('#fef08a')} className="w-4 h-4 rounded-full bg-[#fef08a] border border-[#2d2d2d]/20 hover:scale-110 transition-transform" title="Yellow Highlight" />
                        <button onClick={() => applyHighlight('#d1fae5')} className="w-4 h-4 rounded-full bg-[#d1fae5] border border-[#2d2d2d]/20 hover:scale-110 transition-transform" title="Green Highlight" />
                        <button onClick={() => applyHighlight('#dbeafe')} className="w-4 h-4 rounded-full bg-[#dbeafe] border border-[#2d2d2d]/20 hover:scale-110 transition-transform" title="Blue Highlight" />
                        <button onClick={() => applyHighlight('#fce7f3')} className="w-4 h-4 rounded-full bg-[#fce7f3] border border-[#2d2d2d]/20 hover:scale-110 transition-transform" title="Pink Highlight" />
                        <button onClick={() => applyHighlight('#ffedd5')} className="w-4 h-4 rounded-full bg-[#ffedd5] border border-[#2d2d2d]/20 hover:scale-110 transition-transform" title="Orange Highlight" />
                      </div>

                      {/* Text Colors */}
                      <div className="flex items-center gap-0.5 border-l pl-1.5 border-[#2d2d2d]/10">
                        <button onClick={() => editorRef.current?.exec('foreColor', '#2d2d2d')} className="w-4 h-4 rounded-full border border-[#2d2d2d]/20 flex items-center justify-center text-[10px] font-bold text-slate-700 bg-white" title="Default Text Color">A</button>
                        <button onClick={() => editorRef.current?.exec('foreColor', '#e11d48')} className="w-4 h-4 rounded-full border border-[#2d2d2d]/20 flex items-center justify-center text-[10px] font-bold text-white bg-[#e11d48]" title="Red Text">A</button>
                        <button onClick={() => editorRef.current?.exec('foreColor', '#2563eb')} className="w-4 h-4 rounded-full border border-[#2d2d2d]/20 flex items-center justify-center text-[10px] font-bold text-white bg-[#2563eb]" title="Blue Text">A</button>
                        <button onClick={() => editorRef.current?.exec('foreColor', '#16a34a')} className="w-4 h-4 rounded-full border border-[#2d2d2d]/20 flex items-center justify-center text-[10px] font-bold text-white bg-[#16a34a]" title="Green Text">A</button>
                        <button onClick={() => editorRef.current?.exec('foreColor', '#7c3aed')} className="w-4 h-4 rounded-full border border-[#2d2d2d]/20 flex items-center justify-center text-[10px] font-bold text-white bg-[#7c3aed]" title="Purple Text">A</button>
                      </div>
                    </div>

                    <div className="font-kalam text-[10px] text-slate-400 px-2 hidden sm:block">
                      {editorStats.words} words · {editorStats.readingMins} min read
                    </div>
                  </div>


                  {/* Excel-like Table Actions toolbar */}
                  {activeFormats.inTable && (
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-amber-50/50 border-2 border-[#2d2d2d] rounded-xl shadow-[3px_3px_0px_rgba(45,45,45,1)] shrink-0">
                      <span className="font-kalam text-xs font-bold text-amber-900 mr-1 flex items-center gap-1">
                        <Table className="w-3.5 h-3.5 text-amber-700" /> Table Options:
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => editorRef.current?.tableAddRow(true)}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] font-kalam bg-white border border-[#2d2d2d] text-[#2d2d2d] hover:bg-slate-50 shadow-sm px-2 pt-0.5"
                        >
                          Row Above
                        </Button>
                        <Button
                          onClick={() => editorRef.current?.tableAddRow(false)}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] font-kalam bg-white border border-[#2d2d2d] text-[#2d2d2d] hover:bg-slate-50 shadow-sm px-2 pt-0.5"
                        >
                          Row Below
                        </Button>
                        <Button
                          onClick={() => editorRef.current?.tableDeleteRow()}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] font-kalam bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 shadow-sm px-2 pt-0.5"
                        >
                          Delete Row
                        </Button>
                      </div>
                      <div className="h-4 w-[1px] bg-[#2d2d2d]/15 mx-1" />
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => editorRef.current?.tableAddColumn(true)}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] font-kalam bg-white border border-[#2d2d2d] text-[#2d2d2d] hover:bg-slate-50 shadow-sm px-2 pt-0.5"
                        >
                          Col Left
                        </Button>
                        <Button
                          onClick={() => editorRef.current?.tableAddColumn(false)}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] font-kalam bg-white border border-[#2d2d2d] text-[#2d2d2d] hover:bg-slate-50 shadow-sm px-2 pt-0.5"
                        >
                          Col Right
                        </Button>
                        <Button
                          onClick={() => editorRef.current?.tableDeleteColumn()}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] font-kalam bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 shadow-sm px-2 pt-0.5"
                        >
                          Delete Col
                        </Button>
                      </div>
                      <div className="h-4 w-[1px] bg-[#2d2d2d]/15 mx-1" />
                      <div className="flex items-center gap-1.5">
                        <span className="font-kalam text-[10px] text-slate-500">Fill:</span>
                        <button onClick={() => editorRef.current?.tableHighlightCell('#fef9c3')} className="w-4 h-4 rounded-full bg-[#fef9c3] border border-[#2d2d2d]/20" title="Yellow Fill" />
                        <button onClick={() => editorRef.current?.tableHighlightCell('#d1fae5')} className="w-4 h-4 rounded-full bg-[#d1fae5] border border-[#2d2d2d]/20" title="Green Fill" />
                        <button onClick={() => editorRef.current?.tableHighlightCell('#dbeafe')} className="w-4 h-4 rounded-full bg-[#dbeafe] border border-[#2d2d2d]/20" title="Blue Fill" />
                        <button onClick={() => editorRef.current?.tableHighlightCell('#fce7f3')} className="w-4 h-4 rounded-full bg-[#fce7f3] border border-[#2d2d2d]/20" title="Pink Fill" />
                        <button onClick={() => editorRef.current?.tableHighlightCell('#ffedd5')} className="w-4 h-4 rounded-full bg-[#ffedd5] border border-[#2d2d2d]/20" title="Orange Fill" />
                        <button onClick={() => editorRef.current?.tableHighlightCell('clear')} className="w-4 h-4 rounded-full border border-red-400 bg-white flex items-center justify-center text-red-500 font-bold text-[8px]" title="Clear Fill">×</button>
                      </div>
                      <div className="h-4 w-[1px] bg-[#2d2d2d]/15 mx-1" />
                      <Button
                        onClick={() => editorRef.current?.tableDelete()}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] font-kalam bg-red-100 border border-red-400 text-red-700 hover:bg-red-200 shadow-sm px-2 pt-0.5 ml-auto animate-pulse"
                      >
                        Delete Table
                      </Button>
                    </div>
                  )}

                  {/* AI Assistant panel & Original/Refined Toggle */}
                  <div className="flex items-center justify-between gap-1.5 p-2 bg-[#fdfbf7] border border-dashed border-[#e8dac0] rounded-xl shrink-0 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
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
                        <Button
                          onClick={() => runAiHelper('refine-layman')}
                          disabled={isAiLoading}
                          size="sm"
                          className="h-6 text-[9px] font-kalam bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 shadow-sm"
                        >
                          Refine Layman Notes ✨
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
                      {isAiLoading && <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />}
                    </div>

                    {/* Original vs Refined Sync Toggle Pills */}
                    {(editOriginalContent || editRefinedContent) && (
                      <div className="flex items-center gap-1 bg-[#2d2d2d]/5 p-0.5 rounded-lg border border-[#2d2d2d]/10">
                        <button
                          onClick={() => handleToggleNoteTab('original')}
                          className={`font-kalam text-[10px] px-2 py-0.5 rounded-md transition-all font-bold ${
                            noteTab === 'original'
                              ? 'bg-[#2d2d2d] text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          📜 Original Note
                        </button>
                        <button
                          onClick={() => handleToggleNoteTab('refined')}
                          className={`font-kalam text-[10px] px-2 py-0.5 rounded-md transition-all font-bold ${
                            noteTab === 'refined'
                              ? 'bg-purple-700 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ✨ Refined Note
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Main Content Area: Editor vs Freeform Canvas */}
                  <div className={`flex-1 relative border-2 border-[#2d2d2d]/10 rounded-xl overflow-hidden shadow-inner p-1 flex flex-col ${
                    isFocusMode ? "min-h-0 h-full" : "min-h-[300px] max-h-[600px]"
                  }`}>
                    {/* Smart Scroll Floating TOC */}
                    {headings.length > 0 && editorStats.words > 500 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 py-3 px-1.5 bg-[#fefdfb]/80 backdrop-blur-sm border-2 border-[#2d2d2d]/10 rounded-full shadow-lg max-h-[80%] overflow-y-auto">
                        {headings.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const el = editorRef.current?.getEl();
                              if (el) {
                                const headingEls = el.querySelectorAll('h1, h2, h3');
                                if (headingEls[i]) {
                                  headingEls[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                              }
                            }}
                            className="group relative flex items-center justify-center w-5 h-5 hover:scale-125 transition-all"
                            title={h.text}
                          >
                            <span className={`rounded-full transition-all duration-150 ${
                              h.tag === 'h1' ? 'w-3 h-1 bg-[#b45309]' :
                              h.tag === 'h2' ? 'w-2 h-1 bg-[#d97706]' :
                              'w-1.5 h-0.5 bg-[#f59e0b]/70'
                            } group-hover:bg-[#2d2d2d] group-hover:w-3.5`} />
                            
                            <span className="pointer-events-none absolute right-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2d2d2d] text-white text-[10px] font-kalam py-1 px-2.5 rounded-lg whitespace-nowrap shadow-md border border-slate-700">
                              {h.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

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

                    {/* Rich Text Editor */}
                    <div className="relative flex-1 h-full overflow-hidden flex flex-col">
                      <RichTextEditor
                        ref={editorRef}
                        html={editContent}
                        onChange={val => {
                          setEditContent(val);
                          editContentRef.current = val;
                        }}
                        placeholder="Write notes, meeting transcripts, or log items..."
                        fontClass={editorFontClass}
                        fontSize={editorFontSize}
                        onImagePreview={(data) => {
                          setPreviewImage(data);
                          setPreviewCaptionInput(data.caption);
                        }}
                        onSelectionFormatsChange={setActiveFormats}
                      />

                      {/* Freeform Canvas Layer (tldr style) */}
                      {isCanvasActive && (
                        <div
                          className="absolute inset-0 bg-slate-50/70 backdrop-blur-[1px] z-20 overflow-auto p-4 border-2 border-dashed border-amber-400 rounded-lg select-none"
                          onDoubleClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            addCanvasBlock(e.clientX - rect.left, e.clientY - rect.top);
                          }}
                        >
                          <div className="absolute top-2 left-2 bg-amber-100 border border-amber-300 text-amber-900 font-kalam text-[10px] px-2.5 py-1 rounded-full shadow-sm pointer-events-none font-bold">
                            ✍️ Canvas Active — Double click empty space to write note blocks, select 2+ items & click Group (⌘G)
                          </div>

                          {/* Render Canvas Groups */}
                          {canvasGroups.map(group => (
                            <div
                              key={group.id}
                              style={{ left: group.x, top: group.y, width: group.width, height: group.height }}
                              className="absolute border-2 border-dashed border-purple-500 rounded-2xl bg-purple-50/40 p-2 shadow-sm pointer-events-auto"
                            >
                              <div className="flex items-center justify-between font-kalam text-xs font-bold text-purple-900 bg-purple-100/90 px-2 py-0.5 rounded-lg border border-purple-200 mb-2">
                                <span className="flex items-center gap-1">📦 {group.title}</span>
                                <button
                                  onClick={() => ungroupBlocks(group.id)}
                                  className="text-purple-600 hover:text-purple-950 text-[10px] underline ml-2"
                                >
                                  Ungroup
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Render Canvas Blocks */}
                          {canvasBlocks.map(block => {
                            const isSelected = selectedBlockIds.includes(block.id);
                            return (
                              <div
                                key={block.id}
                                style={{
                                  left: block.x,
                                  top: block.y,
                                  width: block.width,
                                  backgroundColor: block.color,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelectBlock(block.id, e.shiftKey || e.metaKey || e.ctrlKey);
                                }}
                                className={`absolute p-3 rounded-2xl border-2 shadow-[3px_3px_0px_rgba(45,45,45,1)] transition-all cursor-move ${
                                  isSelected ? 'border-purple-600 ring-2 ring-purple-400' : 'border-[#2d2d2d]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 border-b border-[#2d2d2d]/10 pb-1 mb-2">
                                  <span className="font-kalam text-[10px] font-bold text-slate-600">Note Card</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); deleteCanvasBlock(block.id); }}
                                      className="text-red-500 font-bold text-xs hover:text-red-700 px-1"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                                <textarea
                                  value={block.content}
                                  onChange={(e) => updateCanvasBlock(block.id, { content: e.target.value })}
                                  placeholder="Write notes here..."
                                  className="w-full bg-transparent font-kalam text-xs outline-none resize-none leading-relaxed min-h-[60px]"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Word count / reading time footer */}
                    <div className="absolute bottom-2 right-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-[#2d2d2d]/10 rounded-full px-3 py-1 shadow-sm pointer-events-none z-30">
                      <span className="font-kalam text-[10px] text-slate-500">{editorStats.words} words</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-kalam text-[10px] text-slate-500">{editorStats.chars} chars</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-kalam text-[10px] text-slate-500">{editorStats.readingMins} min read</span>
                    </div>
                  </div>

                  {/* Tags section */}
                  <div className="space-y-1">
                    <label className="font-kalam text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Tags
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex flex-wrap gap-1 border border-[#2d2d2d]/10 p-1.5 rounded-lg min-h-8 bg-slate-50">
                        {editTags.map(t => {
                          const tagColors = [
                            { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' }, // Peach
                            { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' }, // Blue
                            { bg: '#d1fae5', text: '#047857', border: '#a7f3d0' }, // Green
                            { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' }  // Purple
                          ];
                          const hash = t.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                          const color = tagColors[hash % tagColors.length];
                          return (
                            <Badge
                              key={t}
                              style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
                              className="font-kalam text-[10px] flex items-center gap-1 px-2.5 py-0.5 rounded-full border shadow-sm"
                            >
                              {t}
                              <button onClick={() => removeTag(t)} className="opacity-60 hover:opacity-100 font-bold text-xs ml-1">×</button>
                            </Badge>
                          );
                        })}
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
                          <Badge
                            key={b}
                            variant="outline"
                            className="font-kalam text-[10px] flex items-center gap-1.5 border-blue-200 text-blue-700 bg-blue-50/80 hover:bg-blue-50 px-2.5 py-0.5 rounded-full shadow-sm"
                          >
                            <Link2 className="w-3.5 h-3.5 text-blue-500" />
                            {notes.find(n => n.id === b)?.title || 'Linked Note'}
                            <button onClick={() => removeBacklink(b)} className="text-red-500 hover:text-red-700 font-bold ml-1">×</button>
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
                  <div className="flex gap-2">
                    <Button onClick={() => createNewNote()} className="journal-btn-primary"><Plus className="w-4 h-4 mr-1.5" /> Create Note</Button>
                    {isFocusMode && (
                      <Button onClick={() => setIsFocusMode(false)} variant="outline" className="font-kalam border-2 border-[#2d2d2d] text-[#2d2d2d] bg-white rounded-xl shadow-sm hover:bg-slate-50">
                        <Minimize2 className="w-4 h-4 mr-1.5" /> Exit Full Screen
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Day-wise Timeline View tab */
          <div className="flex-1 overflow-y-auto space-y-8 max-w-4xl mx-auto py-4 bg-white/60 p-6 rounded-2xl border-2 border-[#2d2d2d]/10 shadow-sm w-full min-h-0">
            <h2 className="font-caveat text-4xl font-bold text-[#2d2d2d] flex items-center gap-2 border-b border-[#2d2d2d]/10 pb-2">
              <CalendarDays className="w-8 h-8 text-amber-600" /> Daily Note Stream (IST)
            </h2>
            <div className="space-y-8 mt-6">
              {notesByDay.map(([dayStr, dayNotes]) => {
                const morningNotes = dayNotes.filter(n => n.folder === 'Morning Call');
                const eveningNotes = dayNotes.filter(n => n.folder === 'Evening Call');
                const remainingNotes = dayNotes.filter(n => n.folder !== 'Morning Call' && n.folder !== 'Evening Call');
                const hasLinkedPair = morningNotes.length > 0 && eveningNotes.length > 0;

                return (
                  <div key={dayStr} className="relative border-l-4 border-amber-500 pl-6 space-y-4">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[10px] top-1.5 w-4 h-4 rounded-full bg-amber-500 border-4 border-white ring-2 ring-amber-500/20" />

                    <h3 className="font-caveat text-2xl font-bold text-slate-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200/50 inline-block">
                      {dayStr}
                    </h3>

                    {/* Side-by-side linked Morning / Evening Calls */}
                    {hasLinkedPair && (
                      <div className="grid md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#fffef3] border-2 border-amber-200/60 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-amber-600 text-white font-kalam text-[10px] px-3 py-0.5 rounded-bl-xl font-bold uppercase tracking-wider">
                          Linked Daily Sync 🔗
                        </div>

                        {/* Morning Column */}
                        <div className="space-y-2 border-r border-[#2d2d2d]/10 pr-4">
                          <span className="font-kalam text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full inline-block">🌅 Morning Call</span>
                          {morningNotes.map(n => (
                            <div key={n.id} className="p-3 bg-white border border-[#2d2d2d]/10 rounded-xl space-y-1">
                              <h4 className="font-caveat text-lg font-bold text-slate-800 truncate">{n.title}</h4>
                              <p className="font-kalam text-[11px] text-slate-500 line-clamp-3 leading-snug">{n.content}</p>
                              <Button variant="link" onClick={() => { selectNote(n); setActiveTab('workspace'); }} className="h-6 p-0 font-kalam text-xs text-amber-700 hover:text-amber-800">Open in Workspace</Button>
                            </div>
                          ))}
                        </div>

                        {/* Evening Column */}
                        <div className="space-y-2 pl-2">
                          <span className="font-kalam text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full inline-block">🌌 Evening Call</span>
                          {eveningNotes.map(n => (
                            <div key={n.id} className="p-3 bg-white border border-[#2d2d2d]/10 rounded-xl space-y-1">
                              <h4 className="font-caveat text-lg font-bold text-slate-800 truncate">{n.title}</h4>
                              <p className="font-kalam text-[11px] text-slate-500 line-clamp-3 leading-snug">{n.content}</p>
                              <Button variant="link" onClick={() => { selectNote(n); setActiveTab('workspace'); }} className="h-6 p-0 font-kalam text-xs text-amber-700 hover:text-amber-800">Open in Workspace</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remaining individual notes */}
                    {(remainingNotes.length > 0 || (!hasLinkedPair && (morningNotes.length > 0 || eveningNotes.length > 0))) && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {!hasLinkedPair && [...morningNotes, ...eveningNotes].map(n => (
                          <div key={n.id} className="p-4 bg-white border-2 border-[#2d2d2d]/10 rounded-2xl hover:border-amber-400 transition-all space-y-2">
                            <div className="flex justify-between items-center">
                              <Badge className="font-kalam text-[9px] bg-slate-50 text-slate-600">{n.folder}</Badge>
                              {n.section && <Badge variant="secondary" className="font-kalam text-[9px] bg-purple-50 text-purple-700">{n.section}</Badge>}
                            </div>
                            <h4 className="font-caveat text-xl font-bold text-slate-800 truncate">{n.title}</h4>
                            <p className="font-kalam text-xs text-slate-500 line-clamp-3 leading-relaxed">{n.content}</p>
                            <Button variant="link" onClick={() => { selectNote(n); setActiveTab('workspace'); }} className="h-6 p-0 font-kalam text-xs text-amber-700">Open in Workspace</Button>
                          </div>
                        ))}

                        {remainingNotes.map(n => (
                          <div key={n.id} className="p-4 bg-white border-2 border-[#2d2d2d]/10 rounded-2xl hover:border-amber-400 transition-all space-y-2">
                            <div className="flex justify-between items-center">
                              <Badge className="font-kalam text-[9px] bg-slate-50 text-slate-600">{n.folder}</Badge>
                              {n.section && <Badge variant="secondary" className="font-kalam text-[9px] bg-purple-50 text-purple-700">{n.section}</Badge>}
                            </div>
                            <h4 className="font-caveat text-xl font-bold text-slate-800 truncate">{n.title}</h4>
                            <p className="font-kalam text-xs text-slate-500 line-clamp-3 leading-relaxed">{n.content}</p>
                            <Button variant="link" onClick={() => { selectNote(n); setActiveTab('workspace'); }} className="h-6 p-0 font-kalam text-xs text-amber-700">Open in Workspace</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {notesByDay.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <FileText className="w-16 h-16 mx-auto text-slate-300 mb-2" />
                  <h3 className="font-caveat text-2xl text-slate-500 font-bold">No Notes Logged Yet</h3>
                  <p className="font-kalam text-sm text-slate-400">Add notes in the workspace to populate this timeline view</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Image Lightbox Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 md:p-6"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white border-2 border-[#2d2d2d] rounded-3xl w-full max-w-6xl max-h-[92vh] shadow-[10px_10px_0px_rgba(45,45,45,1)] flex flex-col md:flex-row overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 text-white hover:bg-slate-700 border-2 border-slate-600 flex items-center justify-center font-bold text-xl shadow-lg z-50 transition-transform hover:scale-110"
                title="Close Preview (Esc)"
              >
                ×
              </button>

              {/* Image Preview Viewport Container */}
              <div className="flex-1 bg-slate-950 p-6 flex items-center justify-center relative min-h-[350px] md:min-h-[550px] overflow-auto">
                <img
                  src={previewImage.src}
                  alt="Image full preview"
                  className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-xl shadow-2xl border-2 border-slate-800"
                />
              </div>

              {/* Image Notes / Caption Panel */}
              <div className="w-full md:w-96 p-6 bg-[#fefdfb] border-t-2 md:border-t-0 md:border-l-2 border-[#2d2d2d] flex flex-col justify-between space-y-4 shrink-0 font-kalam">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-[#2d2d2d]/10">
                    <h3 className="font-caveat text-3xl font-bold text-[#2d2d2d] flex items-center gap-2">
                      🖼️ Image Notes & Specs
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <label className="font-kalam text-xs font-bold text-slate-600 uppercase tracking-wider block">Image Caption / Notes</label>
                    <textarea
                      value={previewCaptionInput}
                      onChange={e => setPreviewCaptionInput(e.target.value)}
                      placeholder="Write notes, requirements, or descriptions for this image..."
                      className="w-full h-52 p-3 font-kalam text-xs leading-relaxed border-2 border-[#2d2d2d]/20 rounded-2xl bg-white focus:border-[#2d2d2d] outline-none resize-none shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#2d2d2d]/10">
                  <Button
                    onClick={() => {
                      if (!previewImage) return;
                      // Sync caption back into editor DOM HTML
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(editContent, 'text/html');
                      const card = doc.getElementById(previewImage.cardId);
                      if (card) {
                        const captionDiv = card.querySelector('.rte-image-caption');
                        if (captionDiv) {
                          captionDiv.textContent = previewCaptionInput;
                        }
                      }
                      const updatedHtml = doc.body.innerHTML;
                      setEditContent(updatedHtml);
                      editContentRef.current = updatedHtml;
                      handleSave({ content: updatedHtml });
                      setPreviewImage(null);
                      toast.success('Image notes saved and synced! 🖼️');
                    }}
                    className="w-full journal-btn-primary py-2.5 text-xs font-kalam font-bold rounded-xl"
                  >
                    Save & Sync Notes 💾
                  </Button>
                  <Button
                    onClick={() => setPreviewImage(null)}
                    variant="outline"
                    className="w-full font-kalam text-xs rounded-xl border-2 border-[#2d2d2d]"
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Switcher (⌘K) */}
      <AnimatePresence>
        {isQuickSwitcherOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#2d2d2d]/30 backdrop-blur-sm z-50 flex items-start justify-center pt-[12vh] p-4"
            onClick={() => setIsQuickSwitcherOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.97, y: -8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: -8 }}
              transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              className="bg-white border-2 border-[#2d2d2d] rounded-2xl w-full max-w-lg shadow-[6px_6px_0px_rgba(45,45,45,1)] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-[#2d2d2d]/10">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  ref={quickSwitcherInputRef}
                  value={quickSwitcherQuery}
                  onChange={e => setQuickSwitcherQuery(e.target.value)}
                  placeholder="Jump to a note..."
                  className="flex-1 bg-transparent outline-none font-kalam text-sm text-[#2d2d2d] placeholder:text-slate-400"
                />
                <button onClick={() => setIsQuickSwitcherOpen(false)} className="text-slate-300 hover:text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {!quickSwitcherQuery.trim() && quickSwitcherResults.length > 0 && (
                  <p className="font-kalam text-[10px] uppercase tracking-wider text-slate-400 px-2 py-1">Recent</p>
                )}
                {quickSwitcherResults.map(n => (
                  <button
                    key={n.id}
                    onClick={() => {
                      selectNote(n);
                      setActiveTab('workspace');
                      setIsQuickSwitcherOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#fffacd] transition-colors flex items-center justify-between gap-2 group"
                  >
                    <div className="min-w-0">
                      <p className="font-caveat text-lg font-bold text-[#2d2d2d] truncate">{n.title}</p>
                      <p className="font-kalam text-[11px] text-slate-400 truncate">{n.folder}{n.section ? ` · ${n.section}` : ''}</p>
                    </div>
                    {n.isFav && <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />}
                  </button>
                ))}
                {quickSwitcherResults.length === 0 && (
                  <p className="font-kalam text-xs text-slate-400 italic text-center py-10">No matching notes</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts help */}
      <AnimatePresence>
        {isShortcutsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#2d2d2d]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsShortcutsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white border-2 border-[#2d2d2d] rounded-2xl p-5 w-80 shadow-[6px_6px_0px_rgba(45,45,45,1)] space-y-3"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-2 border-[#2d2d2d]/10">
                <h3 className="font-caveat text-2xl font-bold text-[#2d2d2d] flex items-center gap-1.5">
                  <Keyboard className="w-5 h-5 text-amber-500" /> Shortcuts
                </h3>
                <button className="text-slate-400 hover:text-[#2d2d2d] font-bold text-lg leading-none" onClick={() => setIsShortcutsOpen(false)}>×</button>
              </div>
              <div className="space-y-2 font-kalam text-xs text-slate-600">
                {[
                  ['⌘ K', 'Jump to note'],
                  ['⌘ N', 'New note'],
                  ['⌘ S', 'Save now'],
                  ['⌘ ⇧ F', 'Focus Mode'],
                  ['⌘ B', 'Bold selection'],
                  ['⌘ I', 'Italic selection'],
                  ['Esc', 'Close any popup'],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span>{label}</span>
                    <kbd className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-[10px] text-slate-500">{key}</kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}