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
  Save, Undo2, Redo2, Table, Maximize2, Minimize2, User, FolderPlus,
  Settings, ChevronDown, Pencil, Underline, Strikethrough, Clock,
  Share2, HardDrive, Highlighter, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { RichTextEditor, RichTextEditorHandle, htmlToPlainText, htmlToMarkdown, migrateMarkdownToHtml } from './RichTextEditor';
import { cn } from '@/lib/utils';

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

// Notional quota for the sidebar storage meter. Notes have no size column in
// the schema, so usage is derived from the loaded note payloads instead.
const STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Compact relative timestamps: "just now", "2 min ago", "1 hr ago", "2d ago", "3w ago".
function formatRelativeTime(input: string | number | Date): string {
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  if (diff < 45 * 1000) return 'just now';

  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins} min ago`;

  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;

  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.round(days / 365)}y ago`;
}

// Shared class recipes so the borderless look stays consistent across the page.
// Every colour/shadow resolves from the `.notes-suite` token scope in globals.css.
const NS = {
  iconBtn:
    'h-9 w-9 rounded-full text-[var(--ns-ink-muted)] hover:text-[var(--ns-ink)] hover:bg-black/[0.04] transition-colors',
  iconBtnSm:
    'h-7 w-7 rounded-lg text-[var(--ns-ink-soft)] hover:text-[var(--ns-ink)] hover:bg-black/[0.05] transition-colors',
  chip:
    'inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[var(--ns-surface-muted)] text-[12px] text-[var(--ns-ink-soft)] hover:bg-black/[0.06] transition-colors',
  softInput:
    'bg-[var(--ns-surface-muted)] border-0 rounded-lg text-[13px] text-[var(--ns-ink)] placeholder:text-[var(--ns-ink-muted)] focus-visible:ring-1 focus-visible:ring-[var(--ns-hairline-strong)] focus-visible:ring-offset-0',
  label:
    'text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--ns-ink-muted)]',
  inkBtn:
    'bg-[var(--ns-ink)] text-white hover:bg-[var(--ns-ink)]/90 rounded-full text-[12.5px] font-medium shadow-none',
  divider: 'w-px h-4 bg-[var(--ns-hairline)] shrink-0',
  toolBtn:
    'h-7 w-7 rounded-[var(--ns-radius-sm)] text-[var(--ns-ink-soft)] hover:text-[var(--ns-ink)] hover:bg-black/[0.05] transition-colors',
  toolBtnOn:
    'bg-[var(--ns-ink)] text-white hover:bg-[var(--ns-ink)] hover:text-white',
  toolChip:
    'h-7 gap-1.5 px-2.5 rounded-full text-[12px] text-[var(--ns-ink-soft)] hover:text-[var(--ns-ink)] hover:bg-black/[0.05] shadow-none transition-colors',
  tableChip:
    'h-6 px-2 rounded-md text-[11px] font-normal text-[var(--ns-ink-soft)] bg-[var(--ns-surface)] hover:bg-[var(--ns-surface)] hover:text-[var(--ns-ink)] shadow-[var(--ns-shadow-card)] transition-colors',
} as const;

// Editor palettes. The swatch dot is painted straight from the CSS token, and
// the value handed to document.execCommand is read back out of the same token at
// click time (execCommand can't consume a `var()` string), so retuning a colour
// means editing globals.css — nothing here holds the source of truth.
function readNsToken(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const scope = document.querySelector('.notes-suite');
  if (!scope) return fallback;
  const value = getComputedStyle(scope).getPropertyValue(name).trim();
  return value || fallback;
}

const HIGHLIGHT_SWATCHES = [
  { label: 'Red', token: '--ns-hl-red', fallback: '#fecdd3' },
  { label: 'Yellow', token: '--ns-hl-yellow', fallback: '#fef08a' },
  { label: 'Green', token: '--ns-hl-green', fallback: '#d1fae5' },
  { label: 'Blue', token: '--ns-hl-blue', fallback: '#dbeafe' },
  { label: 'Pink', token: '--ns-hl-pink', fallback: '#fce7f3' },
  { label: 'Amber', token: '--ns-hl-amber', fallback: '#ffedd5' },
] as const;

const TEXT_SWATCHES = [
  { label: 'Default', token: '--ns-fg-default', fallback: '#1c1c1a', onDark: false },
  { label: 'Red', token: '--ns-fg-red', fallback: '#e11d48', onDark: true },
  { label: 'Blue', token: '--ns-fg-blue', fallback: '#2563eb', onDark: true },
  { label: 'Green', token: '--ns-fg-green', fallback: '#16a34a', onDark: true },
  { label: 'Purple', token: '--ns-fg-purple', fallback: '#7c3aed', onDark: true },
] as const;

// Tag chips pick a tone by hashing the tag name. Values live in the token layer;
// `var()` resolves fine inside an inline style attribute, so no read-back needed.
const TAG_PALETTE = [
  { bg: '--ns-tag-1-bg', bgFallback: '#ffedd5', fg: '--ns-tag-1-fg', fgFallback: '#9a3412' },
  { bg: '--ns-tag-2-bg', bgFallback: '#dbeafe', fg: '--ns-tag-2-fg', fgFallback: '#1d4ed8' },
  { bg: '--ns-tag-3-bg', bgFallback: '#d1fae5', fg: '--ns-tag-3-fg', fgFallback: '#047857' },
  { bg: '--ns-tag-4-bg', bgFallback: '#f3e8ff', fg: '--ns-tag-4-fg', fgFallback: '#6b21a8' },
] as const;

// Canvas surfaces. These get persisted into `Note.canvasData`, and `var()`
// resolves inside an inline style attribute, so canvases saved from here follow
// the token layer. `CANVAS_LEGACY_FILLS` are the literals older canvases were
// saved with — remapped on render so they don't stay sticky-note yellow.
const CANVAS_BLOCK_FILL = 'var(--ns-canvas-block, #fffdf7)';
const CANVAS_GROUP_FILL = 'var(--ns-canvas-group, #f7f7f5)';
const CANVAS_LEGACY_FILLS: Record<string, string> = {
  '#fff9c4': CANVAS_BLOCK_FILL,
  '#f1f5f9': CANVAS_GROUP_FILL,
};

const DIVIDER_STYLES = [
  { id: 'wavy', label: 'Wavy Line', glyph: '〰️' },
  { id: 'dashed', label: 'Dashed Line', glyph: '---' },
  { id: 'gradient', label: 'Gradient Glow', glyph: '✨' },
  { id: 'vintage', label: 'Vintage Double', glyph: '═' },
  { id: 'stitched', label: 'Stitched Dotted', glyph: '···' },
] as const;

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

  // "New Note" split-button template dropdown
  const [showNewNoteMenu, setShowNewNoteMenu] = useState(false);

  // Timestamp of the last successful persist, shown as "Last saved: …"
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  // Ticks every 30s so relative timestamps stay honest without a save.
  const [, setClockTick] = useState(0);

  // Font family & size states
  const [editorFont, setEditorFont] = useState<string>('sans');
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

  // Chronological grouping: Today, This Week, This Month, Earlier
  const chronologicalGroups = useMemo(() => {
    const today: Note[] = [];
    const thisWeek: Note[] = [];
    const thisMonth: Note[] = [];
    const earlier: Note[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    filteredNotes.forEach(n => {
      const noteDate = new Date(n.createdAt);
      if (noteDate >= startOfToday) {
        today.push(n);
      } else if (noteDate >= startOfThisWeek) {
        thisWeek.push(n);
      } else if (noteDate >= startOfThisMonth) {
        thisMonth.push(n);
      } else {
        earlier.push(n);
      }
    });

    return [
      { name: 'Today', notes: today },
      { name: 'This Week', notes: thisWeek },
      { name: 'This Month', notes: thisMonth },
      { name: 'Earlier', notes: earlier }
    ].filter(group => group.notes.length > 0);
  }, [filteredNotes]);

  // Storage meter for the sidebar. Notes have no size column in the schema, so
  // usage is derived from the byte length of the loaded note payloads.
  const storageUsage = useMemo(() => {
    const bytes = notes.reduce((total, n) => {
      const payload = [n.title, n.content, n.originalContent, n.refinedContent, n.canvasData]
        .filter(Boolean)
        .join('');
      return total + new Blob([payload]).size;
    }, 0);
    const pct = (bytes / STORAGE_QUOTA_BYTES) * 100;
    return {
      bytes,
      used: formatBytes(bytes),
      quota: formatBytes(STORAGE_QUOTA_BYTES),
      percent: pct,
      percentLabel: pct < 0.1 && pct > 0 ? '<0.1%' : `${pct.toFixed(1)}%`,
    };
  }, [notes]);

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
          setLastSavedAt(new Date());
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
        setLastSavedAt(new Date());
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

  // Share = copy the note as portable markdown to the clipboard.
  const shareNote = async () => {
    if (!selectedNote) return;
    const markdownBody = htmlToMarkdown(editContent);
    const payload = `# ${editTitle}\n\n${markdownBody}`;
    try {
      await navigator.clipboard.writeText(payload);
      toast.success('Note copied as markdown — ready to paste anywhere 📋');
    } catch (err) {
      console.error('Clipboard write failed:', err);
      toast.error('Could not access the clipboard. Try the download button instead.');
    }
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
      color: CANVAS_BLOCK_FILL
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
      color: CANVAS_GROUP_FILL,
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
        if (showNewNoteMenu) setShowNewNoteMenu(false);
        if (showDividerMenu) setShowDividerMenu(false);
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
  }, [isQuickSwitcherOpen, isTypographyOpen, isShortcutsOpen, showNewNoteMenu, showDividerMenu, selectedNoteId, editTitle, editContent, editFolder, editSection, isFocusMode]);

  // Keep "2 min ago" style timestamps honest without re-rendering the world
  useEffect(() => {
    const interval = setInterval(() => setClockTick(tick => tick + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Click anywhere else to dismiss the popover menus
  useEffect(() => {
    if (!showNewNoteMenu && !showDividerMenu) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-ns-menu]')) return;
      setShowNewNoteMenu(false);
      setShowDividerMenu(false);
    };
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [showNewNoteMenu, showDividerMenu]);

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
      <div className="notes-suite flex items-center justify-center min-h-screen bg-[var(--ns-page)]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--ns-hairline-strong)] border-t-[var(--ns-ink)]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="notes-suite min-h-screen bg-[var(--ns-page)] flex flex-col items-center justify-center p-8">
        <h2 className="font-sans text-[20px] font-semibold text-[var(--ns-ink)] mb-4">Project Not Found</h2>
        <Button onClick={() => router.push('/projects')} className={cn(NS.inkBtn, 'h-9 px-4')}>Back to Projects</Button>
      </div>
    );
  }

  return (
    <div className="notes-suite h-screen bg-[var(--ns-page)] lg:pt-16 flex flex-col relative overflow-hidden font-sans">
      <div className="max-w-full mx-auto w-full flex-1 flex flex-col space-y-4 h-full min-h-0 px-4 pb-4">

        {/* Navigation & Header — slots into the gap inside the fixed global top
            bar, between the "Soul Sync" logo and the bell/avatar cluster. */}
        {!isFocusMode && (
          <div className="lg:absolute lg:top-[20px] lg:left-[140px] lg:right-[145px] lg:z-[10005] lg:bg-transparent lg:px-0 lg:py-0 lg:border-0 lg:shadow-none flex max-w-full flex-col lg:flex-row lg:items-center justify-between pb-2 border-b border-[var(--ns-hairline)] lg:border-b-0 gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="icon" className={NS.iconBtn} title="Back to project" asChild>
                <Link href={`/projects/${project.id}`}>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <h1 className="text-[14px] font-medium text-[var(--ns-ink-soft)] truncate">
                {project.title} <span className="text-[var(--ns-ink-muted)] mx-1">/</span>
                <span className="text-[var(--ns-accent)] font-semibold">Notes Suite</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Search pill — opens the quick switcher (⌘K) */}
              <button
                onClick={() => setIsQuickSwitcherOpen(true)}
                className="hidden sm:flex items-center gap-2 h-9 w-[220px] px-3.5 rounded-full bg-[var(--ns-surface)] shadow-[var(--ns-shadow-card)] text-[13px] text-[var(--ns-ink-muted)] hover:shadow-[var(--ns-shadow-pop)] transition-shadow"
                title="Search notes (⌘K)"
              >
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 text-left">Search notes...</span>
                <kbd className="flex items-center gap-0.5 text-[10px] bg-[var(--ns-surface-muted)] rounded px-1.5 py-0.5 text-[var(--ns-ink-muted)]">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </button>

              <Button
                onClick={exportAllNotes}
                disabled={isExporting}
                variant="ghost"
                size="icon"
                className={NS.iconBtn}
                title="Export all notes as .zip"
              >
                {isExporting ? <div className="w-4 h-4 rounded-full border-2 border-[var(--ns-accent-line)] border-t-transparent animate-spin" /> : <FileArchive className="w-4 h-4" />}
              </Button>

              <Button
                onClick={() => setIsShortcutsOpen(true)}
                variant="ghost"
                size="icon"
                className={NS.iconBtn}
                title="Keyboard shortcuts"
              >
                <Keyboard className="w-4 h-4" />
              </Button>

              {/* View Mode segmented control */}
              <div className="flex gap-1 bg-[var(--ns-surface-muted)] p-1 rounded-full">
                {([['workspace', 'Workspace'], ['timeline', 'Daily Timeline']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={cn(
                      'h-7 px-3.5 rounded-full text-[12px] font-medium transition-colors',
                      activeTab === key
                        ? 'bg-[var(--ns-ink)] text-white'
                        : 'text-[var(--ns-ink-soft)] hover:text-[var(--ns-ink)]'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <Button
                onClick={() => setIsFocusMode(prev => !prev)}
                variant="ghost"
                size="icon"
                className={NS.iconBtn}
                title={isFocusMode ? "Exit Full Screen (Ctrl+Shift+F)" : "Full Screen Focus (Ctrl+Shift+F)"}
              >
                {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>

              {/* Notebook chip */}
              <button
                onClick={() => setIsTypographyOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full bg-[var(--ns-accent-soft)] text-[12px] font-medium text-[var(--ns-accent-ink)] hover:brightness-[0.98] transition-all"
                title="Notebook settings"
              >
                Personal Notebook
                <Pencil className="w-3 h-3 opacity-60" />
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            </div>
          </div>
        )}

        {isFocusMode && <div className="fixed inset-0 bg-[var(--ns-page)] z-[19999]" />}

        {activeTab === 'workspace' ? (
          /* 3-Column Smart Notes Workspace — widths driven by inline style
             (not Tailwind template-literal classes) so collapse + drag-resize
             both work, and the editor column always fills remaining space. */
          <div className={isFocusMode
            ? "fixed inset-4 md:inset-6 z-[20000] flex min-h-0 rounded-[var(--ns-radius)] overflow-hidden bg-[var(--ns-surface)] shadow-[var(--ns-shadow-shell)]"
            : "flex-1 flex min-h-0 h-full rounded-[var(--ns-radius)] overflow-hidden bg-[var(--ns-surface)] shadow-[var(--ns-shadow-shell)]"
          }>

            {/* COLUMN 1: Sidebar Folder Navigation */}
            <div
              style={{ width: isSidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth, flex: '0 0 auto' }}
              className="bg-[var(--ns-surface-soft)] border-r border-[var(--ns-hairline)] flex flex-col p-3 relative"
            >
              {/* New Note split button + collapse toggle */}
              <div className="flex items-center gap-1.5 mb-4 shrink-0">
                {!isSidebarCollapsed ? (
                  <div className="relative flex-1 flex" data-ns-menu>
                    <button
                      onClick={() => createNewNote()}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-l-[var(--ns-radius-sm)] bg-[var(--ns-ink)] text-white text-[12.5px] font-medium hover:bg-[var(--ns-ink)]/90 transition-colors"
                      title="New note (⌘N)"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Note
                    </button>
                    <span className="w-px bg-white/20 my-1.5" />
                    <button
                      onClick={() => setShowNewNoteMenu(p => !p)}
                      className="w-8 h-9 flex items-center justify-center rounded-r-[var(--ns-radius-sm)] bg-[var(--ns-ink)] text-white hover:bg-[var(--ns-ink)]/90 transition-colors"
                      title="New note from template"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <AnimatePresence>
                      {showNewNoteMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.14 }}
                          className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-[var(--ns-surface)] rounded-[var(--ns-radius-md)] shadow-[var(--ns-shadow-pop)] p-1.5"
                        >
                          <p className={cn(NS.label, 'px-2 py-1')}>From template</p>
                          {Object.keys(NOTE_TEMPLATES).map(tpl => (
                            <button
                              key={tpl}
                              onClick={() => { setShowNewNoteMenu(false); createNewNote(tpl); }}
                              className="w-full text-left text-[12.5px] text-[var(--ns-ink-soft)] hover:text-[var(--ns-ink)] hover:bg-black/[0.04] rounded-[var(--ns-radius-sm)] px-2 py-1.5 flex items-center gap-2 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-[var(--ns-accent-line)]" /> {tpl}
                            </button>
                          ))}
                          <div className="h-px bg-[var(--ns-hairline)] my-1.5" />
                          <button
                            onClick={() => { setShowNewNoteMenu(false); handleAddFolder(); }}
                            className="w-full text-left text-[12.5px] text-[var(--ns-ink-soft)] hover:text-[var(--ns-ink)] hover:bg-black/[0.04] rounded-[var(--ns-radius-sm)] px-2 py-1.5 flex items-center gap-2 transition-colors"
                          >
                            <FolderPlus className="w-3.5 h-3.5" /> New folder…
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Button
                    onClick={() => createNewNote()}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-[var(--ns-radius-sm)] bg-[var(--ns-ink)] text-white hover:bg-[var(--ns-ink)]/90"
                    title="New note (⌘N)"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  variant="ghost"
                  size="icon"
                  className={cn(NS.iconBtnSm, 'shrink-0')}
                  title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
              </div>

              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between mb-1.5 shrink-0">
                  <span className={NS.label}>Folders</span>
                  <button
                    onClick={() => setFilterTab(p => p === 'pinned' ? 'all' : 'pinned')}
                    className={cn(
                      'flex items-center gap-1 text-[10.5px] font-medium rounded-full px-2 py-0.5 transition-colors',
                      filterTab === 'pinned'
                        ? 'bg-[var(--ns-accent-soft)] text-[var(--ns-accent)]'
                        : 'text-[var(--ns-ink-muted)] hover:text-[var(--ns-ink-soft)]'
                    )}
                    title="Show pinned notes only"
                  >
                    <Star className={cn('w-3 h-3', filterTab === 'pinned' && 'fill-[var(--ns-accent-line)] text-[var(--ns-accent-line)]')} />
                    Pinned
                  </button>
                </div>
              )}

              <div className={`space-y-0.5 pr-1 ${isSidebarCollapsed ? 'flex-1 overflow-y-auto' : 'max-h-[42%] overflow-y-auto pb-3 mb-2'}`}>
                {folders.map(f => {
                  const count = f === 'All'
                    ? notes.filter(n => n.folder !== 'Trash').length
                    : notes.filter(n => n.folder === f).length;
                  const hasTemplate = Boolean(NOTE_TEMPLATES[f]);
                  const isActive = activeFolder === f;
                  return (
                    <div key={f} className="group relative">
                      <button
                        onClick={() => setActiveFolder(f)}
                        className={cn(
                          'w-full text-left text-[13px] py-2 rounded-[var(--ns-radius-sm)] flex items-center justify-between transition-colors',
                          isSidebarCollapsed ? 'px-2 justify-center' : 'px-2.5',
                          isActive
                            ? 'bg-[var(--ns-accent-soft)] text-[var(--ns-accent)] font-medium'
                            : 'text-[var(--ns-ink-soft)] hover:bg-black/[0.03] hover:text-[var(--ns-ink)]'
                        )}
                        title={f}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Folder className={cn('w-4 h-4 shrink-0', isActive ? 'text-[var(--ns-accent-line)]' : 'text-[var(--ns-ink-muted)]')} />
                          {!isSidebarCollapsed && <span className="truncate">{f}</span>}
                        </span>
                        {!isSidebarCollapsed && (
                          <div className="flex items-center gap-1 shrink-0">
                            {f !== 'All' && f !== 'Trash' && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(f);
                                }}
                                className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 text-[var(--ns-ink-muted)] hover:text-rose-600 transition-all"
                                title={`Delete folder "${f}"`}
                              >
                                <X className="w-3 h-3" />
                              </span>
                            )}
                            <span className={cn('text-[11px] tabular-nums', isActive ? 'text-[var(--ns-accent)]' : 'text-[var(--ns-ink-muted)]')}>
                              {count}
                            </span>
                          </div>
                        )}
                      </button>
                      {!isSidebarCollapsed && hasTemplate && (
                        <button
                          onClick={(e) => { e.stopPropagation(); createNewNote(f); }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 flex items-center justify-center rounded-full bg-[var(--ns-accent-line)] text-white hover:brightness-95"
                          title={`New ${f} note from template`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isSidebarCollapsed && (
                <div className="flex-1 flex flex-col min-h-0 pt-1">
                  <span className={cn(NS.label, 'mb-1.5 shrink-0')}>Recent Notes</span>
                  <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 min-h-[80px]">
                    {recentNotes.length > 0 ? (
                      recentNotes.map(rn => (
                        <button
                          key={rn.id}
                          onClick={() => selectNote(rn)}
                          className={cn(
                            'w-full text-left text-[12.5px] px-2.5 py-2 rounded-[var(--ns-radius-sm)] flex items-center gap-2 transition-colors',
                            selectedNoteId === rn.id
                              ? 'bg-[var(--ns-accent-soft)] text-[var(--ns-accent)] font-medium'
                              : 'text-[var(--ns-ink-soft)] hover:bg-black/[0.03] hover:text-[var(--ns-ink)]'
                          )}
                        >
                          <FileText className={cn('w-3.5 h-3.5 shrink-0', selectedNoteId === rn.id ? 'text-[var(--ns-accent-line)]' : 'text-[var(--ns-ink-muted)]')} />
                          <span className="truncate flex-1">{rn.title || 'Untitled'}</span>
                          <span className="text-[10.5px] text-[var(--ns-ink-muted)] shrink-0">{formatRelativeTime(rn.updatedAt)}</span>
                        </button>
                      ))
                    ) : (
                      <p className="text-[11.5px] text-[var(--ns-ink-muted)] italic px-2.5">No recent notes</p>
                    )}
                  </div>
                </div>
              )}

              {!isSidebarCollapsed && (
                <>
                  {/* Notes Storage — derived from actual note payload sizes */}
                  <div className="shrink-0 mt-2 rounded-[var(--ns-radius-md)] bg-[var(--ns-surface)] shadow-[var(--ns-shadow-card)] p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-[var(--ns-ink-muted)]" />
                      <span className="text-[12px] font-medium text-[var(--ns-ink)]">Notes Storage</span>
                    </div>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-[11px] text-[var(--ns-ink-muted)]">{storageUsage.used} of {storageUsage.quota} used</span>
                      <span className="text-[11px] font-medium text-[var(--ns-ink-soft)] tabular-nums">{storageUsage.percentLabel}</span>
                    </div>
                    <div className="h-1 rounded-full bg-[var(--ns-surface-muted)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--ns-accent-line)] transition-[width] duration-500"
                        style={{ width: `${Math.min(100, Math.max(storageUsage.percent, storageUsage.bytes > 0 ? 2 : 0))}%` }}
                      />
                    </div>
                  </div>

                  {/* Utility row */}
                  <div className="shrink-0 flex items-center justify-around mt-2 pt-2 border-t border-[var(--ns-hairline)]">
                    <Button onClick={() => setIsTypographyOpen(true)} variant="ghost" size="icon" className={NS.iconBtnSm} title="Typography & Style Lab">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setFilterTab(p => p === 'pinned' ? 'all' : 'pinned')}
                      variant="ghost"
                      size="icon"
                      className={cn(NS.iconBtnSm, filterTab === 'pinned' && 'text-[var(--ns-accent)]')}
                      title="Pinned notes"
                    >
                      <Star className={cn('w-4 h-4', filterTab === 'pinned' && 'fill-[var(--ns-accent-line)] text-[var(--ns-accent-line)]')} />
                    </Button>
                    <Button
                      onClick={() => setActiveFolder('Trash')}
                      variant="ghost"
                      size="icon"
                      className={cn(NS.iconBtnSm, activeFolder === 'Trash' && 'text-[var(--ns-accent)]')}
                      title="Trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setIsFocusMode(p => !p)}
                      variant="ghost"
                      size="icon"
                      className={NS.iconBtnSm}
                      title="Focus mode (⌘⇧F)"
                    >
                      <Moon className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}

              {/* Drag handle for sidebar */}
              <div
                onMouseDown={startResizing('sidebar')}
                className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[var(--ns-accent-line)]/30 transition-colors group/handle z-10"
              >
                <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-3 h-8 rounded-full bg-[var(--ns-surface)] shadow-[var(--ns-shadow-card)] opacity-0 group-hover/handle:opacity-100 flex items-center justify-center">
                  <GripVertical className="w-2.5 h-2.5 text-[var(--ns-ink-muted)]" />
                </div>
              </div>
            </div>

            {/* COLUMN 2: Notes List inside selected folder */}
            <div
              style={{ width: listWidth, flex: '0 0 auto' }}
              className="border-r border-[var(--ns-hairline)] flex flex-col p-4 bg-[var(--ns-surface)] relative"
            >
              <div className="flex gap-1.5 mb-3 relative">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ns-ink-muted)]" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search notes..."
                    className={cn(NS.softInput, 'pl-9 h-9')}
                  />
                </div>
                <Button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-9 w-9 rounded-[var(--ns-radius-sm)] transition-colors',
                    showDatePicker || startDate || endDate
                      ? 'bg-[var(--ns-accent-soft)] text-[var(--ns-accent)]'
                      : 'text-[var(--ns-ink-muted)] hover:text-[var(--ns-ink)] hover:bg-black/[0.04]'
                  )}
                  title="Date Range Filter"
                >
                  <CalendarDays className="w-4 h-4" />
                </Button>
              </div>

              {showDatePicker && (
                <div className="bg-[var(--ns-surface-muted)] rounded-[var(--ns-radius-md)] p-3 mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={NS.label}>Filter by date range</span>
                    {(startDate || endDate) && (
                      <button
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                        className="text-[10.5px] font-medium text-rose-600 hover:text-rose-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[var(--ns-ink-muted)]">From</span>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className={cn(NS.softInput, 'h-8 bg-[var(--ns-surface)] px-2 text-[12px]')}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-[var(--ns-ink-muted)]">To</span>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className={cn(NS.softInput, 'h-8 bg-[var(--ns-surface)] px-2 text-[12px]')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Underline filter tabs */}
              <div className="flex items-center gap-5 mb-3 border-b border-[var(--ns-hairline)]">
                {([['all', 'All Notes'], ['pinned', 'Pinned'], ['recent', 'Recent']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilterTab(key)}
                    className={cn(
                      'relative -mb-px pb-2 text-[12.5px] transition-colors flex items-center gap-1',
                      filterTab === key
                        ? 'text-[var(--ns-ink)] font-semibold border-b-2 border-[var(--ns-ink)]'
                        : 'text-[var(--ns-ink-muted)] hover:text-[var(--ns-ink-soft)] border-b-2 border-transparent'
                    )}
                  >
                    {key === 'pinned' && (
                      <Star className={cn('w-3 h-3', filterTab === 'pinned' ? 'fill-[var(--ns-accent-line)] text-[var(--ns-accent-line)]' : '')} />
                    )}
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto space-y-5 pr-1 -mx-1 px-1">
                {chronologicalGroups.map(group => (
                  <div key={group.name} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 px-1">
                      <span className={NS.label}>{group.name}</span>
                      <span className="text-[10px] text-[var(--ns-ink-muted)] bg-[var(--ns-surface-muted)] rounded-full px-1.5 py-px tabular-nums">
                        {group.notes.length}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {group.notes.map(n => {
                        const isActive = selectedNoteId === n.id;
                        return (
                          <div
                            key={n.id}
                            onClick={() => selectNote(n)}
                            className={cn(
                              'group relative overflow-hidden p-3 rounded-[var(--ns-radius-md)] cursor-pointer transition-colors',
                              isActive
                                ? 'bg-[var(--ns-accent-soft)]'
                                : 'hover:bg-black/[0.025]'
                            )}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-[var(--ns-accent-line)]" />
                            )}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className={cn(
                                'text-[13.5px] font-semibold truncate flex-1',
                                isActive ? 'text-[var(--ns-accent-ink)]' : 'text-[var(--ns-ink)]'
                              )}>
                                {n.title || 'Untitled'}
                              </h3>
                              <button
                                onClick={(e) => { e.stopPropagation(); togglePin(n); }}
                                className={cn(
                                  'shrink-0 p-0.5 -mt-0.5 -mr-0.5 transition-opacity',
                                  n.isFav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                )}
                                title={n.isFav ? 'Unpin' : 'Pin to top'}
                              >
                                <Star className={cn('w-3.5 h-3.5', n.isFav ? 'fill-[var(--ns-accent-line)] text-[var(--ns-accent-line)]' : 'text-[var(--ns-ink-muted)]')} />
                              </button>
                            </div>
                            <p className="text-[12px] italic text-[var(--ns-ink-muted)] line-clamp-2 leading-relaxed mb-2">
                              {htmlToPlainText(n.content) || 'No content yet'}
                            </p>
                            <div className="flex items-center justify-between flex-wrap gap-1.5">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[10px] text-[var(--ns-ink-soft)] bg-[var(--ns-surface-muted)] rounded px-1.5 py-0.5">{n.folder}</span>
                                {n.tags?.slice(0, 2).map(t => (
                                  <span key={t} className="text-[10px] text-[var(--ns-accent-ink)] bg-[var(--ns-accent-soft)] rounded px-1.5 py-0.5">{t}</span>
                                ))}
                              </div>
                              <span className="text-[10px] text-[var(--ns-ink-muted)]">
                                {formatRelativeTime(n.updatedAt)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredNotes.length === 0 && (
                  <p className="text-[12px] text-[var(--ns-ink-muted)] italic text-center py-12">
                    {filterTab === 'pinned' ? 'No pinned notes in this folder' : 'No notes in this folder'}
                  </p>
                )}
              </div>

              {/* Drag handle for list column */}
              <div
                onMouseDown={startResizing('list')}
                className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[var(--ns-accent-line)]/30 transition-colors group/handle z-10"
              >
                <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-3 h-8 rounded-full bg-[var(--ns-surface)] shadow-[var(--ns-shadow-card)] opacity-0 group-hover/handle:opacity-100 flex items-center justify-center">
                  <GripVertical className="w-2.5 h-2.5 text-[var(--ns-ink-muted)]" />
                </div>
              </div>
            </div>

            {/* COLUMN 3: Rich Notebook Editor & Markdown Preview — fills all remaining width */}
            <div className="flex-1 min-w-0 flex flex-col p-4 bg-[var(--ns-surface)] relative">
              {selectedNote ? (
                <div className="flex flex-col h-full space-y-3">

                  {/* Note Header Info */}
                  <div className="flex flex-col gap-2 border-b border-[var(--ns-hairline)] pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-[var(--ns-ink-muted)] shrink-0" />
                      <input
                        value={editTitle}
                        onChange={e => {
                          const val = e.target.value;
                          setEditTitle(val);
                          editTitleRef.current = val;
                        }}
                        placeholder="Untitled Note"
                        className="bg-transparent text-[20px] font-semibold outline-none text-[var(--ns-ink)] placeholder:text-[var(--ns-ink-muted)] py-0.5 flex-1 min-w-0"
                      />
                      <button
                        onClick={() => togglePin(selectedNote)}
                        className="shrink-0 p-1 rounded-full hover:bg-black/[0.04] transition-colors"
                        title={selectedNote.isFav ? 'Unpin' : 'Pin to top'}
                      >
                        <Star className={cn('w-4 h-4', selectedNote.isFav ? 'fill-[var(--ns-accent-line)] text-[var(--ns-accent-line)]' : 'text-[var(--ns-ink-muted)]')} />
                      </button>
                    </div>

                    {/* Metadata row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select value={editFolder} onValueChange={val => {
                        setEditFolder(val);
                        editFolderRef.current = val;
                      }}>
                        <SelectTrigger className="h-7 w-auto gap-1.5 px-2.5 text-[11.5px] rounded-full border-0 bg-[var(--ns-surface-muted)] text-[var(--ns-ink-soft)] focus:ring-0 focus:ring-offset-0 shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--ns-surface)] border-0 shadow-[var(--ns-shadow-pop)] rounded-[var(--ns-radius-md)] text-[12.5px]">
                          {folders.filter(f => f !== 'All').map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Inline tag entry — same state the Tags footer uses */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {editTags.map(t => (
                          <span
                            key={t}
                            className="group inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-[var(--ns-accent-soft)] text-[11.5px] text-[var(--ns-accent-ink)]"
                          >
                            {t}
                            <button onClick={() => removeTag(t)} className="opacity-0 group-hover:opacity-100 transition-opacity" title={`Remove "${t}"`}>
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                        <input
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                          placeholder="Add tags..."
                          className="h-7 w-24 bg-transparent outline-none text-[11.5px] text-[var(--ns-ink)] placeholder:text-[var(--ns-ink-muted)]"
                        />
                      </div>

                      {/* Section / sub-grouping */}
                      <Input
                        value={editSection}
                        onChange={e => {
                          const val = e.target.value;
                          setEditSection(val);
                          editSectionRef.current = val;
                        }}
                        placeholder="Section..."
                        className={cn(NS.softInput, 'h-7 w-24 rounded-full px-2.5 text-[11.5px]')}
                      />

                      {lastSavedAt && (
                        <span className="hidden xl:flex items-center gap-1 text-[11px] text-[var(--ns-ink-muted)]">
                          <Clock className="w-3 h-3" /> Last saved: {formatRelativeTime(lastSavedAt)}
                        </span>
                      )}

                      <div className="flex items-center gap-0.5 ml-auto">
                        {selectedNote.folder === 'Trash' && (
                          <Button onClick={handleRestore} variant="ghost" size="icon" className={NS.iconBtnSm} title="Restore Note">
                            <Undo2 className="w-4 h-4" />
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
                          className={NS.iconBtnSm}
                          title="Save Note (⌘S)"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button onClick={downloadNote} variant="ghost" size="icon" className={NS.iconBtnSm} title="Download Markdown">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={handleDelete}
                          variant="ghost"
                          size="icon"
                          className={cn(NS.iconBtnSm, 'hover:text-rose-600')}
                          title={selectedNote.folder === 'Trash' ? 'Permanently Delete' : 'Move to Trash'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setIsFocusMode(prev => !prev)}
                          variant="ghost"
                          size="icon"
                          className={NS.iconBtnSm}
                          title={isFocusMode ? "Exit Full Screen (Ctrl+Shift+F)" : "Full Screen Focus (Ctrl+Shift+F)"}
                        >
                          {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </Button>
                        <Button onClick={shareNote} className={cn(NS.inkBtn, 'h-7 px-3 ml-1 gap-1.5')} title="Copy note as markdown">
                          <Share2 className="w-3 h-3" /> Share
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* ── Toolbar row 1: inline formatting, blocks, lists, colours ── */}
                  <div className="flex flex-wrap items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className={cn(NS.toolBtn, activeFormats.bold && NS.toolBtnOn)} onClick={() => applyInline('bold')} title="Bold (⌘B)"><Bold className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className={cn(NS.toolBtn, activeFormats.italic && NS.toolBtnOn)} onClick={() => applyInline('italic')} title="Italic (⌘I)"><Italic className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className={NS.toolBtn} onClick={() => applyInline('underline')} title="Underline (⌘U)"><Underline className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className={NS.toolBtn} onClick={() => applyInline('strikeThrough')} title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></Button>

                    <span className={NS.divider} />

                    <Button variant="ghost" size="icon" className={NS.toolBtn} onClick={() => applyBlock('h1')} title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className={NS.toolBtn} onClick={() => applyBlock('h2')} title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className={NS.toolBtn} onClick={() => applyBlock('h3')} title="Heading 3"><Heading3 className="w-3.5 h-3.5" /></Button>

                    <span className={NS.divider} />

                    <Button variant="ghost" size="icon" className={cn(NS.toolBtn, activeFormats.ul && NS.toolBtnOn)} onClick={() => applyList('ul')} title="Bulleted list"><List className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className={cn(NS.toolBtn, activeFormats.ol && NS.toolBtnOn)} onClick={() => applyList('ol')} title="Numbered list"><ListOrdered className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className={NS.toolBtn} onClick={applyChecklist} title="Checklist"><ListChecks className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className={NS.toolBtn} onClick={() => applyInline('outdent')} title="Outdent (Shift+Tab)"><Outdent className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className={NS.toolBtn} onClick={() => applyInline('indent')} title="Indent (Tab)"><Indent className="w-3.5 h-3.5" /></Button>

                    <span className={NS.divider} />

                    <Button variant="ghost" size="icon" className={NS.toolBtn} onClick={() => editorRef.current?.insertTable()} title="Insert Table"><Table className="w-3.5 h-3.5" /></Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={NS.toolBtn}
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

                    <span className={NS.divider} />

                    {/* Highlighter colours */}
                    <Highlighter className="w-3.5 h-3.5 text-[var(--ns-ink-muted)] mr-0.5" />
                    {HIGHLIGHT_SWATCHES.map(sw => (
                      <button
                        key={sw.label}
                        onClick={() => applyHighlight(readNsToken(sw.token, sw.fallback))}
                        className="w-4 h-4 rounded-full ring-1 ring-inset ring-black/[0.06] hover:scale-110 transition-transform"
                        style={{ backgroundColor: `var(${sw.token}, ${sw.fallback})` }}
                        title={`${sw.label} highlight`}
                      />
                    ))}

                    <span className={NS.divider} />

                    {/* Text colours */}
                    {TEXT_SWATCHES.map(sw => (
                      <button
                        key={sw.label}
                        onClick={() => editorRef.current?.exec('foreColor', readNsToken(sw.token, sw.fallback))}
                        className={cn(
                          'w-4 h-4 rounded-full ring-1 ring-inset ring-black/[0.06] flex items-center justify-center text-[9px] font-bold hover:scale-110 transition-transform',
                          sw.onDark ? 'text-white' : 'text-[var(--ns-ink)]'
                        )}
                        style={{ backgroundColor: sw.onDark ? `var(${sw.token}, ${sw.fallback})` : 'var(--ns-surface)' }}
                        title={`${sw.label} text`}
                      >
                        A
                      </button>
                    ))}

                    <span className="ml-auto text-[11px] text-[var(--ns-ink-muted)] hidden sm:block">
                      {editorStats.words} words · {editorStats.readingMins} min read
                    </span>
                  </div>

                  {/* ── Toolbar row 2: Style Lab, dividers, canvas, history ── */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <Button onClick={() => setIsTypographyOpen(true)} variant="ghost" size="sm" className={NS.toolChip}>
                      <Palette className="w-3.5 h-3.5 text-[var(--ns-accent-line)]" />
                      Style Lab
                    </Button>

                    {/* Section Divider Dropdown */}
                    <div className="relative" data-ns-menu>
                      <Button
                        onClick={() => setShowDividerMenu(!showDividerMenu)}
                        variant="ghost"
                        size="sm"
                        className={NS.toolChip}
                        title="Insert Section Divider Line"
                      >
                        <Layers className="w-3.5 h-3.5 text-[var(--ns-accent-line)]" />
                        Section Divider
                      </Button>
                      <AnimatePresence>
                        {showDividerMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.14 }}
                            className="absolute left-0 top-full mt-1.5 bg-[var(--ns-surface)] rounded-[var(--ns-radius-md)] shadow-[var(--ns-shadow-pop)] p-1.5 z-50 w-48 space-y-0.5"
                          >
                            {DIVIDER_STYLES.map(dv => (
                              <button
                                key={dv.id}
                                onClick={() => { editorRef.current?.insertSectionDivider(dv.id); setShowDividerMenu(false); }}
                                className="w-full text-left px-2 py-1.5 rounded-[var(--ns-radius-sm)] text-[12.5px] text-[var(--ns-ink-soft)] hover:text-[var(--ns-ink)] hover:bg-black/[0.04] flex items-center justify-between transition-colors"
                              >
                                <span>{dv.label}</span>
                                <span className="text-[11px] text-[var(--ns-ink-muted)]">{dv.glyph}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Freeform Canvas & Grouping Tools */}
                    <Button
                      onClick={() => setIsCanvasActive(!isCanvasActive)}
                      variant="ghost"
                      size="sm"
                      className={cn(NS.toolChip, isCanvasActive && 'bg-[var(--ns-accent-soft)] text-[var(--ns-accent)] font-medium')}
                      title="Freeform canvas"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Canvas Notes
                    </Button>
                    {isCanvasActive && (
                      <>
                        <Button onClick={() => addCanvasBlock(60, 60)} variant="ghost" size="sm" className={NS.toolChip}>
                          <Plus className="w-3.5 h-3.5" /> Text Box
                        </Button>
                        <Button
                          onClick={groupSelectedBlocks}
                          variant="ghost"
                          size="sm"
                          disabled={selectedBlockIds.length < 2}
                          className={cn(NS.toolChip, 'disabled:opacity-40')}
                          title="Group selected items (⌘G)"
                        >
                          <Layers className="w-3.5 h-3.5" /> Group ({selectedBlockIds.length})
                        </Button>
                      </>
                    )}

                    <span className={NS.divider} />

                    <Button variant="ghost" size="icon" className={NS.toolBtn} onClick={() => editorRef.current?.exec('undo')} title="Undo (⌘Z)">
                      <Undo2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className={NS.toolBtn} onClick={() => editorRef.current?.exec('redo')} title="Redo (⌘Y / ⌘⇧Z)">
                      <Redo2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>


                  {/* Excel-like Table Actions toolbar */}
                  {activeFormats.inTable && (
                    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-[var(--ns-surface-muted)] rounded-[var(--ns-radius-md)] shrink-0">
                      <span className="text-[11.5px] font-medium text-[var(--ns-ink-soft)] mr-1 flex items-center gap-1.5">
                        <Table className="w-3.5 h-3.5 text-[var(--ns-ink-muted)]" /> Table
                      </span>
                      <Button onClick={() => editorRef.current?.tableAddRow(true)} variant="ghost" size="sm" className={NS.tableChip}>Row Above</Button>
                      <Button onClick={() => editorRef.current?.tableAddRow(false)} variant="ghost" size="sm" className={NS.tableChip}>Row Below</Button>
                      <Button onClick={() => editorRef.current?.tableDeleteRow()} variant="ghost" size="sm" className={cn(NS.tableChip, 'text-rose-600 hover:text-rose-700')}>Delete Row</Button>

                      <span className={NS.divider} />

                      <Button onClick={() => editorRef.current?.tableAddColumn(true)} variant="ghost" size="sm" className={NS.tableChip}>Col Left</Button>
                      <Button onClick={() => editorRef.current?.tableAddColumn(false)} variant="ghost" size="sm" className={NS.tableChip}>Col Right</Button>
                      <Button onClick={() => editorRef.current?.tableDeleteColumn()} variant="ghost" size="sm" className={cn(NS.tableChip, 'text-rose-600 hover:text-rose-700')}>Delete Col</Button>

                      <span className={NS.divider} />

                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-[var(--ns-ink-muted)] mr-0.5">Fill</span>
                        {HIGHLIGHT_SWATCHES.map(sw => (
                          <button
                            key={sw.label}
                            onClick={() => editorRef.current?.tableHighlightCell(readNsToken(sw.token, sw.fallback))}
                            className="w-4 h-4 rounded-full ring-1 ring-inset ring-black/[0.06] hover:scale-110 transition-transform"
                            style={{ backgroundColor: `var(${sw.token}, ${sw.fallback})` }}
                            title={`${sw.label} fill`}
                          />
                        ))}
                        <button
                          onClick={() => editorRef.current?.tableHighlightCell('clear')}
                          className="w-4 h-4 rounded-full bg-[var(--ns-surface)] ring-1 ring-inset ring-black/[0.1] flex items-center justify-center text-rose-500 font-bold text-[8px] hover:scale-110 transition-transform"
                          title="Clear fill"
                        >
                          ×
                        </button>
                      </div>

                      <Button
                        onClick={() => editorRef.current?.tableDelete()}
                        variant="ghost"
                        size="sm"
                        className={cn(NS.tableChip, 'ml-auto text-rose-600 hover:text-rose-700 hover:bg-rose-50')}
                      >
                        Delete Table
                      </Button>
                    </div>
                  )}

                  {/* Toolbar row 3 — AI Copilot & Original/Refined toggle */}
                  <div className="flex items-center justify-between gap-1.5 shrink-0 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--ns-accent-line)] shrink-0" />
                      <span className="text-[11.5px] font-medium text-[var(--ns-ink-soft)] mr-1.5">AI Copilot</span>
                      <Button
                        onClick={() => runAiHelper('summarize')}
                        disabled={isAiLoading}
                        variant="ghost"
                        size="sm"
                        className={NS.toolChip}
                      >
                        Summarize
                      </Button>
                      <Button
                        onClick={() => runAiHelper('refine')}
                        disabled={isAiLoading}
                        variant="ghost"
                        size="sm"
                        className={NS.toolChip}
                      >
                        Refine Specs
                      </Button>
                      <Button
                        onClick={() => runAiHelper('refine-layman')}
                        disabled={isAiLoading}
                        variant="ghost"
                        size="sm"
                        className={NS.toolChip}
                      >
                        <Sparkles className="w-3 h-3" /> Refine Layman Notes
                      </Button>
                      {editFolder === 'Client Meetings' && (
                        <Button
                          onClick={() => runAiHelper('extract-meeting')}
                          disabled={isAiLoading}
                          variant="ghost"
                          size="sm"
                          className={NS.toolChip}
                        >
                          Extract Meetings
                        </Button>
                      )}
                      {isAiLoading && (
                        <div className="w-3.5 h-3.5 ml-1 rounded-full border-2 border-[var(--ns-accent-line)] border-t-transparent animate-spin" />
                      )}
                    </div>

                    {/* Original vs Refined Sync Toggle Pills */}
                    {(editOriginalContent || editRefinedContent) && (
                      <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-[var(--ns-surface-muted)]">
                        {([['original', 'Original'], ['refined', 'Refined']] as const).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => handleToggleNoteTab(key)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-[11px] transition-colors',
                              noteTab === key
                                ? 'bg-[var(--ns-surface)] text-[var(--ns-ink)] font-medium shadow-[var(--ns-shadow-card)]'
                                : 'text-[var(--ns-ink-muted)] hover:text-[var(--ns-ink)]'
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Main Content Area: Editor vs Freeform Canvas */}
                  <div className={`flex-1 relative rounded-[var(--ns-radius-md)] overflow-hidden bg-[var(--ns-surface-sunken)] p-1 flex flex-col ${
                    isFocusMode ? "min-h-0 h-full" : "min-h-[300px] max-h-[600px]"
                  }`}>
                    {/* Smart Scroll Floating TOC */}
                    {headings.length > 0 && editorStats.words > 500 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1.5 py-3 px-1.5 bg-[var(--ns-surface)]/85 backdrop-blur-sm rounded-full shadow-[var(--ns-shadow-pop)] max-h-[80%] overflow-y-auto">
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
                              h.tag === 'h1' ? 'w-3 h-1 bg-[var(--ns-accent)]' :
                              h.tag === 'h2' ? 'w-2 h-1 bg-[var(--ns-accent-line)]' :
                              'w-1.5 h-0.5 bg-[var(--ns-ink-muted)]'
                            } group-hover:bg-[var(--ns-ink)] group-hover:w-3.5`} />

                            <span className="pointer-events-none absolute right-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--ns-ink)] text-white text-[10px] py-1 px-2.5 rounded-lg whitespace-nowrap shadow-[var(--ns-shadow-pop)]">
                              {h.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Style Lab Overlay */}
                    <AnimatePresence>
                      {isTypographyOpen && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-[var(--ns-ink)]/10 backdrop-blur-sm z-40 flex items-center justify-center p-4"
                          onClick={() => setIsTypographyOpen(false)}
                        >
                          <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="bg-[var(--ns-surface)] rounded-[var(--ns-radius)] p-5 w-80 shadow-[var(--ns-shadow-pop)] space-y-4"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--ns-hairline)]">
                              <h3 className="text-[15px] font-semibold text-[var(--ns-ink)] flex items-center gap-1.5">
                                <Palette className="w-4 h-4 text-[var(--ns-accent-line)]" /> Style Lab
                              </h3>
                              <button
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--ns-ink-muted)] hover:text-[var(--ns-ink)] hover:bg-black/[0.05] transition-colors text-base leading-none"
                                onClick={() => setIsTypographyOpen(false)}
                              >
                                ×
                              </button>
                            </div>

                            <div className="space-y-2">
                              <label className={cn(NS.label, 'block')}>Font Family</label>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: 'sans', label: 'System Sans', style: 'font-sans' },
                                  { id: 'kalam', label: 'Kalam', style: 'font-kalam' },
                                  { id: 'caveat', label: 'Caveat', style: 'font-caveat' },
                                  { id: 'indie', label: 'Indie Flower', style: 'font-indie' },
                                  { id: 'patrick', label: 'Patrick Hand', style: 'font-patrick' },
                                  { id: 'architects', label: 'Architects', style: 'font-architects' },
                                ].map(f => (
                                  <button
                                    key={f.id}
                                    onClick={() => setEditorFont(f.id)}
                                    className={cn(
                                      'p-2 rounded-[var(--ns-radius-sm)] text-left transition-colors',
                                      editorFont === f.id
                                        ? 'bg-[var(--ns-accent-soft)] text-[var(--ns-accent)]'
                                        : 'bg-[var(--ns-surface-muted)] text-[var(--ns-ink-soft)] hover:bg-black/[0.05]'
                                    )}
                                  >
                                    <p className="text-[11.5px] font-medium leading-tight">{f.label}</p>
                                    <p className={`${f.style} text-[9px] truncate mt-0.5 opacity-70`}>The quick brown fox</p>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className={NS.label}>Font Size</label>
                                <span className="text-[11px] font-medium text-[var(--ns-ink)] bg-[var(--ns-surface-muted)] px-2 py-0.5 rounded-full tabular-nums">{editorFontSize}px</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-[var(--ns-ink-muted)]">A</span>
                                <input
                                  type="range"
                                  min="12"
                                  max="28"
                                  value={editorFontSize}
                                  onChange={e => setEditorFontSize(parseInt(e.target.value))}
                                  className="flex-1 accent-[var(--ns-ink)] cursor-pointer"
                                />
                                <span className="text-base text-[var(--ns-ink-soft)]">A</span>
                              </div>
                            </div>

                            <Button onClick={() => setIsTypographyOpen(false)} className={cn(NS.inkBtn, 'w-full h-9')}>
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
                          className="absolute inset-0 bg-[var(--ns-surface-muted)]/70 backdrop-blur-[1px] z-20 overflow-auto p-4 rounded-[var(--ns-radius-md)] ring-1 ring-inset ring-[var(--ns-accent-line)]/40 select-none"
                          onDoubleClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            addCanvasBlock(e.clientX - rect.left, e.clientY - rect.top);
                          }}
                        >
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[var(--ns-accent-soft)] text-[var(--ns-accent)] text-[10.5px] px-2.5 py-1 rounded-full shadow-[var(--ns-shadow-card)] pointer-events-none font-medium">
                            <Pencil className="w-3 h-3" /> Canvas active — double click empty space to add a block, select 2+ &amp; Group (⌘G)
                          </div>

                          {/* Render Canvas Groups */}
                          {canvasGroups.map(group => (
                            <div
                              key={group.id}
                              style={{ left: group.x, top: group.y, width: group.width, height: group.height }}
                              className="absolute rounded-[var(--ns-radius-md)] bg-[var(--ns-surface)]/60 ring-1 ring-inset ring-[var(--ns-hairline-strong)] p-2 shadow-[var(--ns-shadow-card)] pointer-events-auto"
                            >
                              <div className="flex items-center justify-between text-[11px] font-medium text-[var(--ns-ink-soft)] bg-[var(--ns-surface-muted)] px-2 py-1 rounded-full mb-2">
                                <span className="flex items-center gap-1.5 truncate"><Layers className="w-3 h-3 shrink-0" /> {group.title}</span>
                                <button
                                  onClick={() => ungroupBlocks(group.id)}
                                  className="text-[10px] text-[var(--ns-ink-muted)] hover:text-[var(--ns-ink)] ml-2 shrink-0"
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
                                  backgroundColor: CANVAS_LEGACY_FILLS[block.color] ?? block.color,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelectBlock(block.id, e.shiftKey || e.metaKey || e.ctrlKey);
                                }}
                                className={cn(
                                  'absolute p-3 rounded-[var(--ns-radius-md)] shadow-[var(--ns-shadow-card)] transition-shadow cursor-move',
                                  isSelected
                                    ? 'ring-2 ring-[var(--ns-accent-line)] shadow-[var(--ns-shadow-pop)]'
                                    : 'ring-1 ring-inset ring-black/[0.06]'
                                )}
                              >
                                <div className="flex items-center justify-between gap-1 border-b border-black/[0.06] pb-1 mb-2">
                                  <span className="text-[10.5px] font-medium text-[var(--ns-ink-soft)]">Note Card</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteCanvasBlock(block.id); }}
                                    className="text-rose-500 hover:text-rose-700 text-xs leading-none px-1"
                                  >
                                    ×
                                  </button>
                                </div>
                                <textarea
                                  value={block.content}
                                  onChange={(e) => updateCanvasBlock(block.id, { content: e.target.value })}
                                  placeholder="Write notes here..."
                                  className="w-full bg-transparent text-[12px] text-[var(--ns-ink)] placeholder:text-[var(--ns-ink-muted)] outline-none resize-none leading-relaxed min-h-[60px]"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Word count / reading time footer */}
                    <div className="absolute bottom-2 right-3 flex items-center gap-1.5 bg-[var(--ns-surface)]/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-[var(--ns-shadow-card)] pointer-events-none z-30 text-[10.5px] text-[var(--ns-ink-muted)] tabular-nums">
                      <span>{editorStats.words} words</span>
                      <span>·</span>
                      <span>{editorStats.chars} chars</span>
                      <span>·</span>
                      <span>{editorStats.readingMins} min read</span>
                    </div>
                  </div>

                  {/* Tags section */}
                  <div className="space-y-1.5 shrink-0">
                    <label className={cn(NS.label, 'flex items-center gap-1.5')}>
                      <Tag className="w-3 h-3" /> Tags
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex flex-wrap items-center gap-1 p-1.5 rounded-[var(--ns-radius-sm)] min-h-8 bg-[var(--ns-surface-muted)]">
                        {editTags.map(t => {
                          const hash = t.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                          const tone = TAG_PALETTE[hash % TAG_PALETTE.length];
                          return (
                            <Badge
                              key={t}
                              style={{
                                backgroundColor: `var(${tone.bg}, ${tone.bgFallback})`,
                                color: `var(${tone.fg}, ${tone.fgFallback})`,
                              }}
                              className="text-[10.5px] font-medium flex items-center gap-1 px-2.5 py-0.5 rounded-full border-0 shadow-none"
                            >
                              {t}
                              <button onClick={() => removeTag(t)} className="opacity-50 hover:opacity-100 text-[11px] leading-none ml-0.5">×</button>
                            </Badge>
                          );
                        })}
                        {editTags.length === 0 && <span className="text-[11px] text-[var(--ns-ink-muted)] italic">No tags added</span>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Input
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
                          placeholder="Add tag..."
                          className={cn(NS.softInput, 'h-8 w-24')}
                        />
                        <Button onClick={addTag} size="sm" className={cn(NS.inkBtn, 'h-8 px-3')}>Add</Button>
                      </div>
                    </div>
                  </div>

                  {/* Backlinks Section */}
                  <div className="space-y-1.5 border-t border-[var(--ns-hairline)] pt-2.5 shrink-0">
                    <label className={cn(NS.label, 'flex items-center gap-1.5')}>
                      <Link2 className="w-3 h-3" /> Document Backlinks
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex flex-wrap items-center gap-1 p-1.5 rounded-[var(--ns-radius-sm)] min-h-8 bg-[var(--ns-surface-muted)]">
                        {editBacklinks.map(b => (
                          <Badge
                            key={b}
                            className="text-[10.5px] font-medium flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border-0 shadow-none bg-[var(--ns-surface)] text-[var(--ns-ink-soft)]"
                          >
                            <Link2 className="w-3 h-3 text-[var(--ns-ink-muted)]" />
                            {notes.find(n => n.id === b)?.title || 'Linked Note'}
                            <button onClick={() => removeBacklink(b)} className="text-[var(--ns-ink-muted)] hover:text-rose-600 text-[11px] leading-none ml-0.5">×</button>
                          </Badge>
                        ))}
                        {editBacklinks.length === 0 && <span className="text-[11px] text-[var(--ns-ink-muted)] italic">No backlinks</span>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Select value={backlinkTarget} onValueChange={setBacklinkTarget}>
                          <SelectTrigger className={cn(NS.softInput, 'h-8 w-36')}>
                            <SelectValue placeholder="Link note..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[var(--ns-surface)] border-0 shadow-[var(--ns-shadow-pop)] rounded-[var(--ns-radius-md)]">
                            <SelectItem value="none">Choose note...</SelectItem>
                            {notes.filter(n => n.id !== selectedNoteId).map(n => (
                              <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={addBacklink} size="sm" className={cn(NS.inkBtn, 'h-8 px-3')}>Link</Button>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[var(--ns-surface-sunken)] rounded-[var(--ns-radius)]">
                  <FileText className="w-14 h-14 text-[var(--ns-hairline-strong)] mb-3" />
                  <h3 className="text-[16px] font-semibold text-[var(--ns-ink-soft)]">No note selected</h3>
                  <p className="text-[13px] text-[var(--ns-ink-muted)] max-w-xs mb-4 mt-1">Choose a note from the list, or create a brand new note to get started.</p>
                  <div className="flex gap-2">
                    <Button onClick={() => createNewNote()} className={cn(NS.inkBtn, 'h-9 px-4 gap-1.5')}><Plus className="w-4 h-4" /> Create Note</Button>
                    {isFocusMode && (
                      <Button onClick={() => setIsFocusMode(false)} variant="ghost" className={cn(NS.chip, 'h-9 px-4')}>
                        <Minimize2 className="w-4 h-4" /> Exit Full Screen
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Day-wise Timeline View tab */
          <div className="flex-1 overflow-y-auto max-w-4xl mx-auto p-6 bg-[var(--ns-surface)] rounded-[var(--ns-radius)] shadow-[var(--ns-shadow-shell)] w-full min-h-0">
            <h2 className="text-[17px] font-semibold text-[var(--ns-ink)] flex items-center gap-2 border-b border-[var(--ns-hairline)] pb-3">
              <CalendarDays className="w-4.5 h-4.5 text-[var(--ns-accent)]" /> Daily Note Stream (IST)
            </h2>
            <div className="space-y-8 mt-6">
              {notesByDay.map(([dayStr, dayNotes]) => {
                const morningNotes = dayNotes.filter(n => n.folder === 'Morning Call');
                const eveningNotes = dayNotes.filter(n => n.folder === 'Evening Call');
                const remainingNotes = dayNotes.filter(n => n.folder !== 'Morning Call' && n.folder !== 'Evening Call');
                const hasLinkedPair = morningNotes.length > 0 && eveningNotes.length > 0;

                return (
                  <div key={dayStr} className="relative border-l-2 border-[var(--ns-hairline-strong)] pl-6 space-y-4">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-[var(--ns-accent-line)] ring-4 ring-[var(--ns-surface)]" />

                    <h3 className="text-[13px] font-semibold text-[var(--ns-ink)] bg-[var(--ns-surface-muted)] px-3 py-1 rounded-full inline-block">
                      {dayStr}
                    </h3>

                    {/* Side-by-side linked Morning / Evening Calls */}
                    {hasLinkedPair && (
                      <div className="grid md:grid-cols-2 gap-4 p-4 rounded-[var(--ns-radius-md)] bg-[var(--ns-accent-soft)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 flex items-center gap-1 bg-[var(--ns-accent)] text-white text-[9.5px] px-3 py-0.5 rounded-bl-[var(--ns-radius-sm)] font-medium uppercase tracking-[0.08em]">
                          <Link2 className="w-2.5 h-2.5" /> Linked Daily Sync
                        </div>

                        {/* Morning Column */}
                        <div className="space-y-2 md:border-r border-[var(--ns-hairline-strong)] md:pr-4">
                          <span className="text-[11px] font-medium text-[var(--ns-ink-soft)] bg-[var(--ns-surface)] px-2.5 py-0.5 rounded-full inline-block">Morning Call</span>
                          {morningNotes.map(n => (
                            <div key={n.id} className="p-3 bg-[var(--ns-surface)] rounded-[var(--ns-radius-sm)] shadow-[var(--ns-shadow-card)] space-y-1">
                              <h4 className="text-[13.5px] font-semibold text-[var(--ns-ink)] truncate">{n.title}</h4>
                              <p className="text-[11.5px] text-[var(--ns-ink-muted)] line-clamp-3 leading-snug">{n.content}</p>
                              <Button variant="link" onClick={() => { selectNote(n); setActiveTab('workspace'); }} className="h-6 p-0 text-[11.5px] text-[var(--ns-accent)] hover:text-[var(--ns-accent-ink)]">Open in Workspace</Button>
                            </div>
                          ))}
                        </div>

                        {/* Evening Column */}
                        <div className="space-y-2 md:pl-2">
                          <span className="text-[11px] font-medium text-[var(--ns-ink-soft)] bg-[var(--ns-surface)] px-2.5 py-0.5 rounded-full inline-block">Evening Call</span>
                          {eveningNotes.map(n => (
                            <div key={n.id} className="p-3 bg-[var(--ns-surface)] rounded-[var(--ns-radius-sm)] shadow-[var(--ns-shadow-card)] space-y-1">
                              <h4 className="text-[13.5px] font-semibold text-[var(--ns-ink)] truncate">{n.title}</h4>
                              <p className="text-[11.5px] text-[var(--ns-ink-muted)] line-clamp-3 leading-snug">{n.content}</p>
                              <Button variant="link" onClick={() => { selectNote(n); setActiveTab('workspace'); }} className="h-6 p-0 text-[11.5px] text-[var(--ns-accent)] hover:text-[var(--ns-accent-ink)]">Open in Workspace</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remaining individual notes */}
                    {(remainingNotes.length > 0 || (!hasLinkedPair && (morningNotes.length > 0 || eveningNotes.length > 0))) && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[...(hasLinkedPair ? [] : [...morningNotes, ...eveningNotes]), ...remainingNotes].map(n => (
                          <div key={n.id} className="p-4 bg-[var(--ns-surface)] rounded-[var(--ns-radius-md)] shadow-[var(--ns-shadow-card)] hover:shadow-[var(--ns-shadow-pop)] transition-shadow space-y-2">
                            <div className="flex justify-between items-center gap-2">
                              <Badge className="text-[9.5px] font-medium border-0 shadow-none bg-[var(--ns-surface-muted)] text-[var(--ns-ink-soft)]">{n.folder}</Badge>
                              {n.section && <Badge className="text-[9.5px] font-medium border-0 shadow-none bg-[var(--ns-accent-soft)] text-[var(--ns-accent)]">{n.section}</Badge>}
                            </div>
                            <h4 className="text-[14px] font-semibold text-[var(--ns-ink)] truncate">{n.title}</h4>
                            <p className="text-[12px] text-[var(--ns-ink-muted)] line-clamp-3 leading-relaxed">{n.content}</p>
                            <Button variant="link" onClick={() => { selectNote(n); setActiveTab('workspace'); }} className="h-6 p-0 text-[11.5px] text-[var(--ns-accent)] hover:text-[var(--ns-accent-ink)]">Open in Workspace</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {notesByDay.length === 0 && (
                <div className="text-center py-20 bg-[var(--ns-surface-sunken)] rounded-[var(--ns-radius)]">
                  <FileText className="w-14 h-14 mx-auto text-[var(--ns-hairline-strong)] mb-3" />
                  <h3 className="text-[16px] font-semibold text-[var(--ns-ink-soft)]">No notes logged yet</h3>
                  <p className="text-[13px] text-[var(--ns-ink-muted)] mt-1">Add notes in the workspace to populate this timeline view</p>
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
            className="fixed inset-0 bg-[var(--ns-ink)]/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 md:p-6"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[var(--ns-surface)] rounded-[var(--ns-radius)] w-full max-w-6xl max-h-[92vh] shadow-[var(--ns-shadow-pop)] flex flex-col md:flex-row overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-xl leading-none z-50 transition-colors"
                title="Close Preview (Esc)"
              >
                ×
              </button>

              {/* Image Preview Viewport Container */}
              <div className="flex-1 bg-[var(--ns-ink)] p-6 flex items-center justify-center relative min-h-[350px] md:min-h-[550px] overflow-auto">
                <img
                  src={previewImage.src}
                  alt="Image full preview"
                  className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-[var(--ns-radius-md)] shadow-[var(--ns-shadow-pop)]"
                />
              </div>

              {/* Image Notes / Caption Panel */}
              <div className="w-full md:w-96 p-6 bg-[var(--ns-surface)] border-t md:border-t-0 md:border-l border-[var(--ns-hairline)] flex flex-col justify-between gap-4 shrink-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3 border-[var(--ns-hairline)]">
                    <h3 className="text-[16px] font-semibold text-[var(--ns-ink)] flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[var(--ns-ink-muted)]" /> Image Notes &amp; Specs
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <label className={cn(NS.label, 'block')}>Image Caption / Notes</label>
                    <textarea
                      value={previewCaptionInput}
                      onChange={e => setPreviewCaptionInput(e.target.value)}
                      placeholder="Write notes, requirements, or descriptions for this image..."
                      className="w-full h-52 p-3 text-[12.5px] leading-relaxed rounded-[var(--ns-radius-md)] bg-[var(--ns-surface-muted)] text-[var(--ns-ink)] placeholder:text-[var(--ns-ink-muted)] outline-none resize-none focus:ring-1 focus:ring-[var(--ns-hairline-strong)]"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-[var(--ns-hairline)]">
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
                      toast.success('Image notes saved and synced');
                    }}
                    className={cn(NS.inkBtn, 'w-full h-9')}
                  >
                    Save &amp; Sync Notes
                  </Button>
                  <Button
                    onClick={() => setPreviewImage(null)}
                    variant="ghost"
                    className={cn(NS.chip, 'w-full h-9 justify-center')}
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
            className="fixed inset-0 bg-[var(--ns-ink)]/25 backdrop-blur-sm z-50 flex items-start justify-center pt-[12vh] p-4"
            onClick={() => setIsQuickSwitcherOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.97, y: -8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: -8 }}
              transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              className="bg-[var(--ns-surface)] rounded-[var(--ns-radius)] w-full max-w-lg shadow-[var(--ns-shadow-pop)] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[var(--ns-hairline)]">
                <Search className="w-4 h-4 text-[var(--ns-ink-muted)] shrink-0" />
                <input
                  ref={quickSwitcherInputRef}
                  value={quickSwitcherQuery}
                  onChange={e => setQuickSwitcherQuery(e.target.value)}
                  placeholder="Jump to a note..."
                  className="flex-1 bg-transparent outline-none text-[14px] text-[var(--ns-ink)] placeholder:text-[var(--ns-ink-muted)]"
                />
                <button onClick={() => setIsQuickSwitcherOpen(false)} className="text-[var(--ns-ink-muted)] hover:text-[var(--ns-ink)] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {!quickSwitcherQuery.trim() && quickSwitcherResults.length > 0 && (
                  <p className={cn(NS.label, 'px-2 py-1.5')}>Recent</p>
                )}
                {quickSwitcherResults.map(n => (
                  <button
                    key={n.id}
                    onClick={() => {
                      selectNote(n);
                      setActiveTab('workspace');
                      setIsQuickSwitcherOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-[var(--ns-radius-md)] hover:bg-[var(--ns-accent-soft)] transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium text-[var(--ns-ink)] truncate">{n.title}</p>
                      <p className="text-[11.5px] text-[var(--ns-ink-muted)] truncate">{n.folder}{n.section ? ` · ${n.section}` : ''}</p>
                    </div>
                    {n.isFav && <Star className="w-3.5 h-3.5 fill-[var(--ns-accent-line)] text-[var(--ns-accent-line)] shrink-0" />}
                  </button>
                ))}
                {quickSwitcherResults.length === 0 && (
                  <p className="text-[12.5px] text-[var(--ns-ink-muted)] italic text-center py-10">No matching notes</p>
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
            className="fixed inset-0 bg-[var(--ns-ink)]/25 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsShortcutsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[var(--ns-surface)] rounded-[var(--ns-radius)] p-5 w-80 shadow-[var(--ns-shadow-pop)] space-y-3"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-2.5 border-[var(--ns-hairline)]">
                <h3 className="text-[15px] font-semibold text-[var(--ns-ink)] flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-[var(--ns-accent-line)]" /> Shortcuts
                </h3>
                <button
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--ns-ink-muted)] hover:text-[var(--ns-ink)] hover:bg-black/[0.05] transition-colors text-base leading-none"
                  onClick={() => setIsShortcutsOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 text-[12.5px] text-[var(--ns-ink-soft)]">
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
                    <kbd className="bg-[var(--ns-surface-muted)] rounded-md px-2 py-0.5 text-[10.5px] text-[var(--ns-ink-muted)]">{key}</kbd>
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