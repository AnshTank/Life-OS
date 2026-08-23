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
  Save, Undo2, Redo2, Table, Maximize2, Minimize2, User, FolderPlus, FolderOpen,
  Settings, ChevronDown, Pencil, Underline, Strikethrough, Clock,
  Share2, HardDrive, Highlighter, Image as ImageIcon,
  ZoomIn, ZoomOut, Copy, RotateCcw, PanelRightClose, PanelRightOpen
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
  // `canvasData` is a JSON string column, so new optional fields need no migration.
  collapsed?: boolean;
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
//
// Borderless is not the same as invisible: every interactive recipe carries a
// resting surface + hairline ring + soft shadow, so a control reads as a control
// before you hover it. Hover lifts the surface and the shadow, `active:` presses
// it back down, and the disabled treatment is identical everywhere. Editing a
// recipe here propagates to every call site at once.
const NS = {
  iconBtn:
    'h-9 w-9 rounded-full bg-[var(--ns-btn-surface)] ring-1 ring-inset ring-[var(--ns-btn-ring)] shadow-[var(--ns-btn-shadow)] text-[var(--ns-ink-soft)] hover:bg-[var(--ns-btn-surface-hover)] hover:text-[var(--ns-ink)] hover:shadow-[var(--ns-btn-shadow-hover)] active:translate-y-px active:shadow-none disabled:opacity-40 disabled:pointer-events-none transition-all duration-150',
  iconBtnSm:
    'h-7 w-7 rounded-[var(--ns-radius-sm)] bg-[var(--ns-btn-surface)] ring-1 ring-inset ring-[var(--ns-btn-ring)] shadow-[var(--ns-btn-shadow)] text-[var(--ns-ink-soft)] hover:bg-[var(--ns-btn-surface-hover)] hover:text-[var(--ns-ink)] hover:shadow-[var(--ns-btn-shadow-hover)] active:translate-y-px active:shadow-none disabled:opacity-40 disabled:pointer-events-none transition-all duration-150',
  chip:
    'inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[var(--ns-btn-surface)] ring-1 ring-inset ring-[var(--ns-btn-ring)] shadow-[var(--ns-btn-shadow)] text-[12px] text-[var(--ns-ink-soft)] hover:bg-[var(--ns-btn-surface-hover)] hover:text-[var(--ns-ink)] hover:shadow-[var(--ns-btn-shadow-hover)] active:translate-y-px active:shadow-none disabled:opacity-40 disabled:pointer-events-none transition-all duration-150',
  softInput:
    'bg-[var(--ns-surface)] border-0 ring-1 ring-inset ring-[var(--ns-btn-ring)] rounded-[var(--ns-radius-sm)] text-[13px] text-[var(--ns-ink)] placeholder:text-[var(--ns-ink-muted)] focus-visible:ring-1 focus-visible:ring-[var(--ns-accent-line)] focus-visible:ring-offset-0',
  label:
    'text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--ns-ink-muted)]',
  inkBtn:
    'bg-[var(--ns-ink)] text-white hover:bg-[var(--ns-ink)]/90 rounded-full text-[12.5px] font-medium shadow-[var(--ns-btn-shadow-hover)] active:translate-y-px active:shadow-none disabled:opacity-40 disabled:pointer-events-none transition-all duration-150',
  accentBtn:
    'bg-[var(--ns-accent)] text-white hover:bg-[var(--ns-accent-ink)] rounded-full text-[12.5px] font-medium shadow-[var(--ns-btn-shadow-hover)] active:translate-y-px active:shadow-none disabled:opacity-40 disabled:pointer-events-none transition-all duration-150',
  divider: 'w-px h-4 bg-[var(--ns-hairline-strong)] shrink-0',
  toolBtn:
    'h-7 w-7 rounded-[var(--ns-radius-sm)] bg-[var(--ns-btn-surface)] ring-1 ring-inset ring-[var(--ns-btn-ring)] shadow-[var(--ns-btn-shadow)] text-[var(--ns-ink-soft)] hover:bg-[var(--ns-btn-surface-hover)] hover:text-[var(--ns-ink)] hover:shadow-[var(--ns-btn-shadow-hover)] active:translate-y-px active:shadow-none disabled:opacity-40 disabled:pointer-events-none transition-all duration-150',
  toolBtnOn:
    'bg-[var(--ns-ink)] text-white ring-[var(--ns-ink)] shadow-[var(--ns-btn-shadow-hover)] hover:bg-[var(--ns-ink)] hover:text-white',
  toolChip:
    'h-7 gap-1.5 px-2.5 rounded-full bg-[var(--ns-btn-surface)] ring-1 ring-inset ring-[var(--ns-btn-ring)] shadow-[var(--ns-btn-shadow)] text-[12px] text-[var(--ns-ink-soft)] hover:bg-[var(--ns-btn-surface-hover)] hover:text-[var(--ns-ink)] hover:shadow-[var(--ns-btn-shadow-hover)] active:translate-y-px active:shadow-none disabled:opacity-40 disabled:pointer-events-none transition-all duration-150',
  tableChip:
    'h-6 px-2 rounded-md text-[11px] font-normal bg-[var(--ns-btn-surface)] ring-1 ring-inset ring-[var(--ns-btn-ring)] shadow-[var(--ns-btn-shadow)] text-[var(--ns-ink-soft)] hover:bg-[var(--ns-btn-surface-hover)] hover:text-[var(--ns-ink)] hover:shadow-[var(--ns-btn-shadow-hover)] active:translate-y-px active:shadow-none transition-all duration-150',
  // Non-button surfaces: a read-only tag/backlink pill must NOT borrow the button
  // affordance, or the distinction the buttons just earned is lost again.
  flatPill:
    'inline-flex items-center gap-1 h-6 px-2 rounded-full text-[11px] leading-none',
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

// Colour tags for canvas groups. `group.color` finally gets read at render, and
// every value is a token reference so the palette stays retunable from globals.
const CANVAS_GROUP_PALETTE = [
  { label: 'Neutral', value: CANVAS_GROUP_FILL },
  { label: 'Amber', value: 'var(--ns-canvas-group-1, #fef3c7)' },
  { label: 'Blue', value: 'var(--ns-canvas-group-2, #dbeafe)' },
  { label: 'Green', value: 'var(--ns-canvas-group-3, #dcfce7)' },
  { label: 'Purple', value: 'var(--ns-canvas-group-4, #ede9fe)' },
  { label: 'Rose', value: 'var(--ns-canvas-group-5, #ffe4e6)' },
] as const;

// Bullet / list-marker colours. Unlike execCommand, a CSS custom property accepts
// an arbitrary token stream and resolves it at use time — so the swatch writes the
// literal `var(--ns-fg-blue, …)` string and the colour stays token-driven.
// `null` removes the property, falling back to the system marker colour.
const MARKER_SWATCHES = [
  { label: 'System', value: null as string | null, token: '--rte-marker', fallback: '#78716c' },
  { label: 'Ink', value: 'var(--ns-fg-default, #1c1c1a)', token: '--ns-fg-default', fallback: '#1c1c1a' },
  { label: 'Amber', value: 'var(--ns-accent, #b4530a)', token: '--ns-accent', fallback: '#b4530a' },
  { label: 'Red', value: 'var(--ns-fg-red, #e11d48)', token: '--ns-fg-red', fallback: '#e11d48' },
  { label: 'Blue', value: 'var(--ns-fg-blue, #2563eb)', token: '--ns-fg-blue', fallback: '#2563eb' },
  { label: 'Green', value: 'var(--ns-fg-green, #16a34a)', token: '--ns-fg-green', fallback: '#16a34a' },
  { label: 'Purple', value: 'var(--ns-fg-purple, #7c3aed)', token: '--ns-fg-purple', fallback: '#7c3aed' },
] as const;

// Lightbox zoom bounds. The stored source is capped at 1600px on its longest
// edge (see the compression ladder in RichTextEditor), so 8× is already well
// past useful magnification — it exists for reading fine print in screenshots.
const PREVIEW_ZOOM_MIN = 0.2;
const PREVIEW_ZOOM_MAX = 8;

// The catch-all bucket label when grouping by a field the note hasn't set.
const UNGROUPED_LABEL = 'Unsectioned';

const GROUP_BY_MODES = [
  { id: 'date' as const, label: 'Date' },
  { id: 'section' as const, label: 'Section' },
  { id: 'folder' as const, label: 'Folder' },
];

/** Does a note belong in the given folder view?
 *
 *  "All" means everything except Trash, and "Trash" means only Trash. This
 *  expression used to be inlined verbatim in three places — including the two
 *  that decide which note to select after a delete — so any change to folder
 *  semantics had to be made three times or the post-delete selection would
 *  quietly disagree with the list. */
function noteMatchesFolder(note: { folder: string }, activeFolder: string): boolean {
  if (activeFolder === 'Trash') return note.folder === 'Trash';
  if (activeFolder === 'All') return note.folder !== 'Trash';
  return note.folder === activeFolder;
}

// The lightbox chrome sits on a near-black stage, so it needs its own button
// affordance — the light `NS.*` recipes would disappear against it.
const PREVIEW_BTN =
  'h-8 min-w-8 px-2 inline-flex items-center justify-center gap-1.5 rounded-full text-[11.5px] font-medium ' +
  'text-white/85 bg-white/10 ring-1 ring-inset ring-white/15 hover:bg-white/20 hover:text-white ' +
  'active:translate-y-px disabled:opacity-35 disabled:pointer-events-none transition-all duration-150';

// Canvas chrome sits on tinted group frames and coloured block cards, so it
// borrows the frosted-glass treatment instead of the opaque `NS.*` surfaces —
// but keeps the same §3 rule: a visible resting surface, not hover-only.
const CANVAS_BTN =
  'h-6 min-w-6 px-1.5 inline-flex items-center justify-center gap-1 rounded-full text-[10px] font-medium ' +
  'text-[var(--ns-ink-soft)] bg-white/70 ring-1 ring-inset ring-black/[0.07] shadow-[var(--ns-btn-shadow)] ' +
  'hover:bg-white hover:text-[var(--ns-ink)] active:translate-y-px transition-all duration-150';

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
  // Every image card in the current note, so ←/→ can walk the note's gallery.
  const [previewGallery, setPreviewGallery] = useState<{ src: string; caption: string; cardId: string }[]>([]);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [isCaptionPanelOpen, setIsCaptionPanelOpen] = useState(true);
  const previewOverlayRef = useRef<HTMLDivElement>(null);
  const previewPanRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  // The wheel listener has to be registered non-passive to call preventDefault,
  // which means a native listener in an effect — so zoom/pan need mirror refs
  // the handler can read without being re-bound on every pixel of movement.
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const previewZoomRef = useRef(1);
  const previewPanValueRef = useRef({ x: 0, y: 0 });

  // Canvas / Draggable Text Blocks / Grouping state (tldr style)
  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([]);
  const [canvasGroups, setCanvasGroups] = useState<CanvasGroup[]>([]);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [isCanvasActive, setIsCanvasActive] = useState(false);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [groupColorMenuId, setGroupColorMenuId] = useState<string | null>(null);
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const canvasSurfaceRef = useRef<HTMLDivElement>(null);
  // Live drag bookkeeping. Kept in a ref so the mousemove handler never reads a
  // stale closure and never forces a re-render per frame.
  const canvasDragRef = useRef<{
    kind: 'block' | 'group';
    id: string;
    startX: number;
    startY: number;
    blocks: { id: string; x: number; y: number }[];
    groups: { id: string; x: number; y: number }[];
  } | null>(null);
  const marqueeRef = useRef<{ x1: number; y1: number } | null>(null);

  // Note-list grouping + multi-select
  const [groupBy, setGroupBy] = useState<'date' | 'section' | 'folder'>('date');
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [lastClickedNoteId, setLastClickedNoteId] = useState<string | null>(null);
  const [bulkSectionOpen, setBulkSectionOpen] = useState(false);
  const [bulkSectionValue, setBulkSectionValue] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Section Divider Menu state
  const [showDividerMenu, setShowDividerMenu] = useState(false);
  // Bullet / list-marker colour popover
  const [showMarkerMenu, setShowMarkerMenu] = useState(false);

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

  // Load project-scoped notes from DB.
  //
  // A one-shot repair runs first: an older build let opening a refined note
  // overwrite `content` with the refined text, so `content` is restored from
  // `originalContent` wherever that exact damage signature is present. It runs
  // before the fetch so the notes that land in state are already clean.
  const loadNotes = async () => {
    if (!project) return;
    try {
      setIsPageLoading(true);

      if (!sessionStorage.getItem('notes_refined_repair_v1')) {
        sessionStorage.setItem('notes_refined_repair_v1', '1');
        try {
          const repairRes = await fetch('/api/notes/repair-refined', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: project.id }),
          });
          if (repairRes.ok) {
            const { repaired = 0, unrecoverable = 0 } = await repairRes.json();
            if (repaired > 0) {
              toast.success(
                `Restored the original text of ${repaired} note${repaired === 1 ? '' : 's'} ✓`
              );
            }
            if (unrecoverable > 0) {
              toast.warning(
                `${unrecoverable} note${unrecoverable === 1 ? '' : 's'} lost their original text before this fix — no backup to restore from.`
              );
            }
          }
        } catch (repairErr) {
          // Never block the page on the repair pass.
          console.error('Refined-note repair pass failed:', repairErr);
        }
      }

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

  // Restore the UI preferences that used to reset on every reload.
  useEffect(() => {
    const readJson = <T,>(key: string, fallback: T): T => {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      try {
        return JSON.parse(raw) as T;
      } catch (e) {
        console.error(`Ignoring malformed ${key} in localStorage:`, e);
        return fallback;
      }
    };

    setCustomFolders(readJson<string[]>('notes_custom_folders', []));
    setCollapsedGroups(readJson<string[]>('notes_collapsed_groups', []));

    const savedGroupBy = localStorage.getItem('notes_group_by');
    if (savedGroupBy === 'date' || savedGroupBy === 'section' || savedGroupBy === 'folder') {
      setGroupBy(savedGroupBy);
    }
    const savedFont = localStorage.getItem('notes_editor_font');
    if (savedFont) setEditorFont(savedFont);
    const savedSize = Number(localStorage.getItem('notes_editor_font_size'));
    if (Number.isFinite(savedSize) && savedSize >= 12 && savedSize <= 28) {
      setEditorFontSize(savedSize);
    }
  }, []);

  const saveCustomFolders = (newFolders: string[]) => {
    setCustomFolders(newFolders);
    localStorage.setItem('notes_custom_folders', JSON.stringify(newFolders));
  };

  const changeGroupBy = (next: 'date' | 'section' | 'folder') => {
    setGroupBy(next);
    localStorage.setItem('notes_group_by', next);
  };

  const toggleGroupCollapsed = (key: string) => {
    setCollapsedGroups(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      localStorage.setItem('notes_collapsed_groups', JSON.stringify(next));
      return next;
    });
  };

  const changeEditorFont = (font: string) => {
    setEditorFont(font);
    localStorage.setItem('notes_editor_font', font);
  };

  const changeEditorFontSize = (size: number) => {
    setEditorFontSize(size);
    localStorage.setItem('notes_editor_font_size', String(size));
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
    const needle = searchQuery.toLowerCase();
    let result = notes.filter(n => {
      const matchesFolder = noteMatchesFolder(n, activeFolder);

      const matchesSearch = n.title.toLowerCase().includes(needle) ||
                            n.content.toLowerCase().includes(needle);

      const matchesPin = filterTab !== 'pinned' || n.isFav;

      // Clicking a tag chip on a card narrows the list to that tag.
      const matchesTag = !activeTag || (n.tags || []).includes(activeTag);

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

      return matchesFolder && matchesSearch && matchesPin && matchesTag && matchesDate;
    });

    const recency = (n: Note) =>
      filterTab === 'recent' ? new Date(n.updatedAt).getTime() : new Date(n.createdAt).getTime();

    // Pinned first. `togglePin` has always claimed "Pinned to top 📌" while
    // nothing actually sorted on isFav, so a pin was purely decorative.
    result = [...result].sort((a, b) => {
      if (a.isFav !== b.isFav) return a.isFav ? -1 : 1;
      return recency(b) - recency(a);
    });

    return result;
  }, [notes, activeFolder, searchQuery, filterTab, activeTag, startDate, endDate]);

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

  // The list column's actual grouping. Keeps `chronologicalGroups`' contract —
  // `{ name, notes }[]`, empty groups dropped — so the date branch is a pure
  // delegation and the render path doesn't care which mode is active.
  const listGroups = useMemo(() => {
    if (groupBy === 'date') return chronologicalGroups;

    const buckets = new Map<string, Note[]>();
    filteredNotes.forEach(n => {
      const key = groupBy === 'section'
        ? (n.section?.trim() || UNGROUPED_LABEL)
        : (n.folder?.trim() || 'All');
      const existing = buckets.get(key);
      if (existing) existing.push(n);
      else buckets.set(key, [n]);
    });

    // Alphabetical, but the catch-all bucket always sinks to the bottom —
    // "Unsectioned" sorting between "Specs" and "Zoning" reads as a real
    // section and hides how much is still unfiled.
    return Array.from(buckets.entries())
      .map(([name, groupNotes]) => ({ name, notes: groupNotes }))
      .sort((a, b) => {
        if (a.name === UNGROUPED_LABEL) return 1;
        if (b.name === UNGROUPED_LABEL) return -1;
        return a.name.localeCompare(b.name);
      });
  }, [groupBy, chronologicalGroups, filteredNotes]);

  /** Flattened visible order — the sequence shift-click ranges walk. */
  const visibleNoteOrder = useMemo(
    () => listGroups.flatMap(group => (collapsedGroups.includes(group.name) ? [] : group.notes.map(n => n.id))),
    [listGroups, collapsedGroups]
  );

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
  const noteTabRef = useRef(noteTab);
  const canvasBlocksRef = useRef(canvasBlocks);
  const canvasGroupsRef = useRef(canvasGroups);

  useEffect(() => { editTitleRef.current = editTitle; }, [editTitle]);
  useEffect(() => { editContentRef.current = editContent; }, [editContent]);
  useEffect(() => { editFolderRef.current = editFolder; }, [editFolder]);
  useEffect(() => { editSectionRef.current = editSection; }, [editSection]);
  useEffect(() => { editOriginalContentRef.current = editOriginalContent; }, [editOriginalContent]);
  useEffect(() => { editRefinedContentRef.current = editRefinedContent; }, [editRefinedContent]);
  useEffect(() => { noteTabRef.current = noteTab; }, [noteTab]);
  useEffect(() => { canvasBlocksRef.current = canvasBlocks; }, [canvasBlocks]);
  useEffect(() => { canvasGroupsRef.current = canvasGroups; }, [canvasGroups]);

  // ---- Which persisted field is the editor buffer standing in for? -----
  // `editContent` is a *view*: on the Original tab it is `Note.content`, on the
  // Refined tab it is `Note.refinedContent`. Everything that persists must go
  // through here, or an edit made on one tab lands in the other field — which is
  // exactly how refining a note used to overwrite the original.
  //
  // `originalContent` is kept as a mirror of `content` so the pre-existing
  // column stays meaningful (and so /api/notes/repair-refined has something to
  // restore from), but `content` is the single source of truth for the original.
  const buildContentPayload = useCallback(() => {
    const buffer = editContentRef.current;
    const onRefined = noteTabRef.current === 'refined';
    const content = onRefined ? editOriginalContentRef.current : buffer;
    const refinedContent = onRefined ? buffer : editRefinedContentRef.current;
    return { content, originalContent: content, refinedContent };
  }, []);

  const flushPendingSave = useCallback(async () => {
    const noteId = lastSavedState.current.id;
    if (!noteId) return;

    const currentTitle = editTitleRef.current;
    const currentFolder = editFolderRef.current;
    const currentSection = editSectionRef.current;
    const { content: currentContent, originalContent: currentOriginal, refinedContent: currentRefined } = buildContentPayload();
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
  }, [buildContentPayload]);

  const selectNote = (note: Note) => {
    flushPendingSave();

    setSelectedNoteId(note.id);
    setEditTitle(note.title);
    editTitleRef.current = note.title;

    // `content` is the original. `refinedContent` is the AI pass. The editor
    // buffer shows whichever tab is active; `editOriginalContent` always holds
    // the original so switching tabs (and every save) has it to hand.
    const contentHtml = migrateMarkdownToHtml(note.content);
    const refHtml = note.refinedContent ? migrateMarkdownToHtml(note.refinedContent) : '';

    setEditOriginalContent(contentHtml);
    editOriginalContentRef.current = contentHtml;
    setEditRefinedContent(refHtml);
    editRefinedContentRef.current = refHtml;

    if (refHtml) {
      setNoteTab('refined');
      noteTabRef.current = 'refined';
      setEditContent(refHtml);
      editContentRef.current = refHtml;
    } else {
      setNoteTab('original');
      noteTabRef.current = 'original';
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
    let nextBlocks: CanvasBlock[] = [];
    let nextGroups: CanvasGroup[] = [];
    if (note.canvasData) {
      try {
        const parsed = JSON.parse(note.canvasData);
        nextBlocks = parsed.blocks || [];
        nextGroups = parsed.groups || [];
      } catch (e) {
        console.error('Malformed canvasData, starting from an empty canvas:', e);
      }
    }
    setCanvasBlocks(nextBlocks);
    setCanvasGroups(nextGroups);
    canvasBlocksRef.current = nextBlocks;
    canvasGroupsRef.current = nextGroups;

    setSelectedBlockIds([]);

    lastSavedState.current = {
      id: note.id,
      title: note.title,
      content: contentHtml,
      folder: note.folder,
      section: note.section || '',
      originalContent: contentHtml,
      refinedContent: refHtml,
      // Must match what flushPendingSave serialises, or every note selection
      // marks the note dirty and triggers a pointless PATCH.
      canvasData: JSON.stringify({ blocks: nextBlocks, groups: nextGroups }),
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
        // Keep lastSavedState in sync for any fields updated, or the next
        // autosave tick sees a phantom diff and re-PATCHes the same values.
        if (updatedFields.title !== undefined) lastSavedState.current.title = updatedFields.title;
        if (updatedFields.content !== undefined) lastSavedState.current.content = updatedFields.content;
        if (updatedFields.folder !== undefined) lastSavedState.current.folder = updatedFields.folder;
        if (updatedFields.section !== undefined) lastSavedState.current.section = updatedFields.section || '';
        if (updatedFields.originalContent !== undefined) lastSavedState.current.originalContent = updatedFields.originalContent || '';
        if (updatedFields.refinedContent !== undefined) lastSavedState.current.refinedContent = updatedFields.refinedContent || '';
        if (updatedFields.canvasData !== undefined) lastSavedState.current.canvasData = updatedFields.canvasData || '';
        setLastSavedAt(new Date());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Force-save the editor buffer into whichever field the active tab owns.
  // Used by Cmd+S and the explicit Save button so neither can cross-write.
  const saveEditorBuffer = () => {
    if (!selectedNoteId) return;
    handleSave({
      title: editTitle,
      folder: editFolder,
      section: editSection || null,
      ...buildContentPayload(),
    });
  };

  // Replace the editor buffer and persist it, keeping the stashed copy of the
  // field the buffer stands for in step. Anything that rewrites the whole
  // document (AI append, caption sync) goes through here.
  const commitBuffer = (nextBuffer: string) => {
    setEditContent(nextBuffer);
    editContentRef.current = nextBuffer;
    if (noteTabRef.current === 'refined') {
      setEditRefinedContent(nextBuffer);
      editRefinedContentRef.current = nextBuffer;
    } else {
      setEditOriginalContent(nextBuffer);
      editOriginalContentRef.current = nextBuffer;
    }
    handleSave(buildContentPayload());
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

          const currentFolderNotes = remaining.filter(n => noteMatchesFolder(n, activeFolder));

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

          const currentFolderNotes = remaining.filter(n => noteMatchesFolder(n, activeFolder));

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

  // ── Note multi-select ────────────────────────────────────────────────────
  // Ranges walk `visibleNoteOrder` (the flattened, collapse-aware list order),
  // not the group a card happens to live in, so shift-clicking across a group
  // boundary selects everything in between the way a file manager would.
  const toggleSelectNote = (noteId: string, e?: React.MouseEvent) => {
    const isRange = !!e?.shiftKey;
    setSelectedNoteIds(prev => {
      if (isRange && lastClickedNoteId) {
        const from = visibleNoteOrder.indexOf(lastClickedNoteId);
        const to = visibleNoteOrder.indexOf(noteId);
        if (from !== -1 && to !== -1) {
          const span = visibleNoteOrder.slice(Math.min(from, to), Math.max(from, to) + 1);
          return Array.from(new Set([...prev, ...span]));
        }
      }
      return prev.includes(noteId) ? prev.filter(id => id !== noteId) : [...prev, noteId];
    });
    setLastClickedNoteId(noteId);
  };

  const toggleSelectGroup = (groupNotes: Note[]) => {
    const ids = groupNotes.map(n => n.id);
    const allSelected = ids.every(id => selectedNoteIds.includes(id));
    setSelectedNoteIds(prev =>
      allSelected
        ? prev.filter(id => !ids.includes(id))
        : Array.from(new Set([...prev, ...ids]))
    );
  };

  /** One bulk PATCH against the selection, applied optimistically. The route
   *  scopes `updateMany` to the signed-in user, so a stale id in the selection
   *  is a no-op rather than someone else's note being edited. */
  const applyBulkUpdate = async (
    patch: { folder?: string; section?: string | null; isFav?: boolean },
    describe: (count: number) => string
  ) => {
    const ids = selectedNoteIds;
    if (ids.length === 0) return;
    setNotes(prev => prev.map(n => (ids.includes(n.id) ? { ...n, ...patch } as Note : n)));
    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds: ids, ...patch }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(describe(ids.length));
      setSelectedNoteIds([]);
      // A bulk move can pull the open note out from under the editor.
      if (patch.folder && selectedNoteId && ids.includes(selectedNoteId)) {
        setEditFolder(patch.folder);
        editFolderRef.current = patch.folder;
      }
    } catch (err) {
      console.error(err);
      toast.error('Bulk update failed — reloading notes');
      loadNotes();
    }
  };

  const applyBulkSection = () => {
    const trimmed = bulkSectionValue.trim();
    applyBulkUpdate(
      { section: trimmed || null },
      count => trimmed
        ? `${count} note${count === 1 ? '' : 's'} → "${trimmed}"`
        : `Cleared the section on ${count} note${count === 1 ? '' : 's'}`
    );
    setBulkSectionOpen(false);
    setBulkSectionValue('');
  };

  // Debounced auto-save. Every field flushPendingSave reads must be listed, or
  // a change to it never schedules a flush and is lost on navigate-away.
  useEffect(() => {
    if (!selectedNoteId) return;
    const delayDebounce = setTimeout(() => {
      flushPendingSave();
    }, 800);
    return () => clearTimeout(delayDebounce);
  }, [editTitle, editContent, editOriginalContent, editRefinedContent, noteTab, editFolder, editSection, selectedNoteId, flushPendingSave]);

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

  // Recolour the markers of the list the caret sits in. `null` means "System" —
  // the property is removed and the marker falls back to --rte-marker.
  const applyMarkerColor = useCallback((color: string | null) => {
    setShowMarkerMenu(false);
    const applied = editorRef.current?.setListMarkerColor(color);
    if (!applied) {
      toast.error('Put your cursor inside a list first.');
      return;
    }
    toast.success(color === null ? 'Bullets back to system colour' : 'Bullet colour applied');
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

  // Swap which field the editor buffer is showing. Stash the buffer back into
  // the field it came from, load the other one, and persist both — `content`
  // only ever receives text that was authored on the Original tab.
  const handleToggleNoteTab = (targetTab: 'original' | 'refined') => {
    if (targetTab === noteTab) return;

    if (noteTab === 'original') {
      const original = editContent;
      const refined = editRefinedContent || editContent;
      setEditOriginalContent(original);
      editOriginalContentRef.current = original;
      setEditContent(refined);
      editContentRef.current = refined;
      setEditRefinedContent(refined);
      editRefinedContentRef.current = refined;
      setNoteTab('refined');
      noteTabRef.current = 'refined';
      handleSave({ content: original, originalContent: original, refinedContent: refined });
    } else {
      const refined = editContent;
      const original = editOriginalContent || editContent;
      setEditRefinedContent(refined);
      editRefinedContentRef.current = refined;
      setEditContent(original);
      editContentRef.current = original;
      setEditOriginalContent(original);
      editOriginalContentRef.current = original;
      setNoteTab('original');
      noteTabRef.current = 'original';
      handleSave({ content: original, originalContent: original, refinedContent: refined });
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
          commitBuffer(updatedVal);
          toast.success('Meeting summary added! 🧠');
        } else if (type === 'refine') {
          // The original is whatever the user actually wrote: the live buffer if
          // they are on the Original tab, otherwise the stashed copy. `content`
          // is written back unchanged — the AI output only ever lands in
          // `refinedContent`.
          const origVal = noteTab === 'refined' ? editOriginalContent : editContent;
          const html =
            `<h2>AI Technical Specification</h2>` +
            `<h3>Functional Requirements</h3><ul>${(data.functionalReqs || []).map((f: string) => `<li>${esc(f)}</li>`).join('') || '<li>\u200B</li>'}</ul>` +
            `<h3>Tech Specs</h3><ul><li>APIs: ${esc((data.technicalSpecs?.apis || []).join(', '))}</li><li>Database: ${esc((data.technicalSpecs?.database || []).join(', '))}</li></ul>` +
            `<h3>Edge Cases</h3><ul>${(data.edgeCases || []).map((e: string) => `<li>${esc(e)}</li>`).join('') || '<li>\u200B</li>'}</ul>`;
          const updatedVal = editContent + html;
          setEditOriginalContent(origVal);
          editOriginalContentRef.current = origVal;
          setEditRefinedContent(updatedVal);
          editRefinedContentRef.current = updatedVal;
          setEditContent(updatedVal);
          editContentRef.current = updatedVal;
          setNoteTab('refined');
          noteTabRef.current = 'refined';
          handleSave({ content: origVal, originalContent: origVal, refinedContent: updatedVal });
          toast.success('Technical specs saved to Refined — original untouched 🏗️');
        } else if (type === 'refine-layman') {
          const origVal = noteTab === 'refined' ? editOriginalContent : editContent;
          const refinedVal = migrateMarkdownToHtml(data.refinedNotes || '');
          setEditOriginalContent(origVal);
          editOriginalContentRef.current = origVal;
          setEditRefinedContent(refinedVal);
          editRefinedContentRef.current = refinedVal;
          setEditContent(refinedVal);
          editContentRef.current = refinedVal;
          setNoteTab('refined');
          noteTabRef.current = 'refined';
          handleSave({ content: origVal, originalContent: origVal, refinedContent: refinedVal });
          toast.success('Saved to Refined — original untouched ✨');
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

  // ---------------------------------------------------------------------------
  // Canvas: blocks, groups, drag, marquee
  //
  // Every mutation follows the same idiom: setState -> mirror the ref -> flush.
  // The refs exist because `flushPendingSave` reads them synchronously; skipping
  // the mirror step means the save serialises the *previous* canvas.
  // ---------------------------------------------------------------------------

  // Padding a group frame leaves around its members. `y` gets extra room for the
  // group header strip.
  const GROUP_PAD = { x: 16, top: 38, bottom: 16 };

  const groupBoundsFor = (blocks: CanvasBlock[]) => {
    if (blocks.length === 0) return { x: 0, y: 0, width: 260, height: 160 };
    const minX = Math.min(...blocks.map(b => b.x)) - GROUP_PAD.x;
    const minY = Math.min(...blocks.map(b => b.y)) - GROUP_PAD.top;
    const maxX = Math.max(...blocks.map(b => b.x + b.width)) + GROUP_PAD.x;
    const maxY = Math.max(...blocks.map(b => b.y + b.height)) + GROUP_PAD.bottom;
    return {
      x: Math.max(0, minX),
      y: Math.max(0, minY),
      width: Math.max(260, maxX - Math.max(0, minX)),
      height: Math.max(160, maxY - Math.max(0, minY)),
    };
  };

  // After anything moves, every group re-hugs its members. Collapsed groups keep
  // their header-height frame — refitting them would make them jump on expand.
  const refitGroups = (blocks: CanvasBlock[], groups: CanvasGroup[]) =>
    groups.map(g => {
      if (g.collapsed) return g;
      const members = blocks.filter(b => b.groupId === g.id);
      if (members.length === 0) return g;
      return { ...g, ...groupBoundsFor(members) };
    });

  // Single commit point for the canvas so no call site can forget a step.
  const commitCanvas = (blocks: CanvasBlock[], groups: CanvasGroup[], persist = true) => {
    setCanvasBlocks(blocks);
    setCanvasGroups(groups);
    canvasBlocksRef.current = blocks;
    canvasGroupsRef.current = groups;
    if (persist) flushPendingSave();
  };

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
    commitCanvas([...canvasBlocks, newBlock], canvasGroups);
    setSelectedBlockIds([newBlock.id]);
    toast.success('Added freeform text block! 📝');
  };

  // Typing in a block shouldn't hit the network on every keystroke — the debounce
  // effect picks it up, so this only mirrors state.
  const updateCanvasBlock = (id: string, updates: Partial<CanvasBlock>) => {
    const updated = canvasBlocks.map(b => b.id === id ? { ...b, ...updates } : b);
    setCanvasBlocks(updated);
    canvasBlocksRef.current = updated;
  };

  const deleteCanvasBlock = (id: string) => {
    const updated = canvasBlocks.filter(b => b.id !== id);
    commitCanvas(updated, refitGroups(updated, canvasGroups));
    setSelectedBlockIds(prev => prev.filter(bId => bId !== id));
  };

  const toggleSelectBlock = (id: string, multi = false) => {
    if (multi) {
      setSelectedBlockIds(prev => prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]);
    } else {
      setSelectedBlockIds([id]);
    }
  };

  const groupSelectedBlocks = useCallback(() => {
    if (selectedBlockIds.length < 2) {
      toast.error('Select at least 2 canvas blocks to group them.');
      return;
    }
    const targetBlocks = canvasBlocks.filter(b => selectedBlockIds.includes(b.id));
    if (targetBlocks.length < 2) return;

    const newGroup: CanvasGroup = {
      id: 'group-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: 'Group ' + (canvasGroups.length + 1),
      // Walk the palette so consecutive groups don't all land on the same colour.
      color: CANVAS_GROUP_PALETTE[(canvasGroups.length + 1) % CANVAS_GROUP_PALETTE.length].value,
      ...groupBoundsFor(targetBlocks),
    };

    const updatedBlocks = canvasBlocks.map(b => selectedBlockIds.includes(b.id) ? { ...b, groupId: newGroup.id } : b);
    commitCanvas(updatedBlocks, [...canvasGroups, newGroup]);
    toast.success(`Grouped ${targetBlocks.length} blocks 📦`);
  }, [canvasBlocks, canvasGroups, selectedBlockIds, flushPendingSave]);

  const ungroupBlocks = (groupId: string) => {
    const updatedGroups = canvasGroups.filter(g => g.id !== groupId);
    const updatedBlocks = canvasBlocks.map(b => b.groupId === groupId ? { ...b, groupId: null } : b);
    commitCanvas(updatedBlocks, updatedGroups);
    toast.success('Ungrouped 🔓');
  };

  // ⌘⇧G: dissolve every group that owns a selected block.
  const ungroupSelectedBlocks = useCallback(() => {
    const doomed = new Set(
      canvasBlocks.filter(b => selectedBlockIds.includes(b.id) && b.groupId).map(b => b.groupId as string)
    );
    if (doomed.size === 0) {
      toast.error('Select a grouped block first.');
      return;
    }
    const updatedGroups = canvasGroups.filter(g => !doomed.has(g.id));
    const updatedBlocks = canvasBlocks.map(b => (b.groupId && doomed.has(b.groupId)) ? { ...b, groupId: null } : b);
    commitCanvas(updatedBlocks, updatedGroups);
    toast.success(`Ungrouped ${doomed.size} group${doomed.size === 1 ? '' : 's'} 🔓`);
  }, [canvasBlocks, canvasGroups, selectedBlockIds, flushPendingSave]);

  const renameCanvasGroup = (groupId: string, title: string) => {
    const updated = canvasGroups.map(g => g.id === groupId ? { ...g, title } : g);
    setCanvasGroups(updated);
    canvasGroupsRef.current = updated;
  };

  const setCanvasGroupColor = (groupId: string, color: string) => {
    commitCanvas(canvasBlocks, canvasGroups.map(g => g.id === groupId ? { ...g, color } : g));
    setGroupColorMenuId(null);
  };

  const toggleCanvasGroupCollapsed = (groupId: string) => {
    const updated = canvasGroups.map(g => {
      if (g.id !== groupId) return g;
      if (g.collapsed) {
        // Expanding: re-hug the members, which may have been dragged meanwhile.
        const members = canvasBlocks.filter(b => b.groupId === g.id);
        return { ...g, collapsed: false, ...(members.length ? groupBoundsFor(members) : {}) };
      }
      // Collapsed height = 12px frame padding + the 24px header row + the
      // "N blocks hidden" line, so the frame hugs its own chrome exactly.
      return { ...g, collapsed: true, height: 56 };
    });
    commitCanvas(canvasBlocks, updated);
  };

  const selectGroupMembers = (groupId: string) => {
    setSelectedBlockIds(canvasBlocks.filter(b => b.groupId === groupId).map(b => b.id));
  };

  // --- Drag -----------------------------------------------------------------
  // Both drags share one mousemove/mouseup pair. Start positions are snapshotted
  // into a ref so the handler never reads a stale closure and never re-renders
  // per frame beyond the state write it needs.

  const beginCanvasDrag = (
    e: React.MouseEvent,
    kind: 'block' | 'group',
    id: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const blocks = canvasBlocksRef.current;
    const groups = canvasGroupsRef.current;

    // Which blocks move with this drag?
    let movingBlockIds: string[];
    let movingGroupIds: string[];
    if (kind === 'group') {
      movingGroupIds = [id];
      movingBlockIds = blocks.filter(b => b.groupId === id).map(b => b.id);
    } else {
      // A modifier-press is a selection gesture, not a drag. Handling it here
      // rather than in a click handler is what keeps drag and select from
      // fighting: a mouseup after a real drag would otherwise fire a click and
      // undo the very selection the drag was operating on.
      if (e.shiftKey || e.metaKey || e.ctrlKey) {
        toggleSelectBlock(id, true);
        return;
      }
      // Dragging a block inside a multi-selection moves the whole selection.
      movingBlockIds = selectedBlockIds.includes(id) && selectedBlockIds.length > 1
        ? selectedBlockIds
        : [id];
      movingGroupIds = [];
      if (!selectedBlockIds.includes(id)) setSelectedBlockIds([id]);
    }

    canvasDragRef.current = {
      kind,
      id,
      startX: e.clientX,
      startY: e.clientY,
      blocks: blocks.filter(b => movingBlockIds.includes(b.id)).map(b => ({ id: b.id, x: b.x, y: b.y })),
      groups: groups.filter(g => movingGroupIds.includes(g.id)).map(g => ({ id: g.id, x: g.x, y: g.y })),
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = canvasDragRef.current;
      if (drag) {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        const movedBlocks = new Map(drag.blocks.map(b => [b.id, b]));
        const movedGroups = new Map(drag.groups.map(g => [g.id, g]));

        const nextBlocks = canvasBlocksRef.current.map(b => {
          const start = movedBlocks.get(b.id);
          if (!start) return b;
          return { ...b, x: Math.max(0, start.x + dx), y: Math.max(0, start.y + dy) };
        });
        let nextGroups = canvasGroupsRef.current.map(g => {
          const start = movedGroups.get(g.id);
          if (!start) return g;
          return { ...g, x: Math.max(0, start.x + dx), y: Math.max(0, start.y + dy) };
        });
        // A block drag re-hugs its group; a group drag already moved the frame.
        if (drag.kind === 'block') nextGroups = refitGroups(nextBlocks, nextGroups);

        setCanvasBlocks(nextBlocks);
        setCanvasGroups(nextGroups);
        canvasBlocksRef.current = nextBlocks;
        canvasGroupsRef.current = nextGroups;
        return;
      }

      const start = marqueeRef.current;
      if (start && canvasSurfaceRef.current) {
        const rect = canvasSurfaceRef.current.getBoundingClientRect();
        setMarquee({
          x1: start.x1,
          y1: start.y1,
          x2: e.clientX - rect.left + canvasSurfaceRef.current.scrollLeft,
          y2: e.clientY - rect.top + canvasSurfaceRef.current.scrollTop,
        });
      }
    };

    const onUp = () => {
      if (canvasDragRef.current) {
        canvasDragRef.current = null;
        flushPendingSave();
      }
      if (marqueeRef.current) {
        marqueeRef.current = null;
        setMarquee(current => {
          if (current) {
            const left = Math.min(current.x1, current.x2);
            const right = Math.max(current.x1, current.x2);
            const top = Math.min(current.y1, current.y2);
            const bottom = Math.max(current.y1, current.y2);
            // A click (not a drag) clears the selection instead of selecting all.
            if (right - left < 6 && bottom - top < 6) {
              setSelectedBlockIds([]);
            } else {
              setSelectedBlockIds(
                canvasBlocksRef.current
                  .filter(b => b.x < right && b.x + b.width > left && b.y < bottom && b.y + b.height > top)
                  .map(b => b.id)
              );
            }
          }
          return null;
        });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [flushPendingSave]);

  const beginMarquee = (e: React.MouseEvent) => {
    // Only a press on the bare canvas starts a rubber band.
    if (e.target !== e.currentTarget) return;
    if (!canvasSurfaceRef.current) return;
    const rect = canvasSurfaceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + canvasSurfaceRef.current.scrollLeft;
    const y = e.clientY - rect.top + canvasSurfaceRef.current.scrollTop;
    marqueeRef.current = { x1: x, y1: y };
    setMarquee({ x1: x, y1: y, x2: x, y2: y });
  };


  // ══ Image lightbox: note-wide gallery, zoom/pan, true fullscreen ════════
  //
  // The overlay is rendered under `.notes-suite`, deliberately NOT inside
  // `.rte-root`, so the editor's `img { width: 100% !important }` normalisation
  // cannot reach it. Fullscreen is requested on the *overlay*, never on the
  // in-editor <img>, for exactly the same reason.

  /** Every image card in the current buffer, in document order. */
  const harvestGallery = useCallback((html: string) => {
    if (typeof window === 'undefined') return [];
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    return Array.from(doc.querySelectorAll('.rte-image-card'))
      .map((card, i) => ({
        src: card.querySelector('img')?.getAttribute('src') || '',
        caption: card.querySelector('.rte-image-caption')?.textContent || '',
        cardId: card.id || `rte-card-${i}`,
      }))
      .filter(item => item.src);
  }, []);

  /** Write both zoom and pan in one shot, keeping the mirror refs in step.
   *  Panning is meaningless at or below fit, so it's zeroed there. */
  const applyPreviewView = useCallback((zoom: number, pan: { x: number; y: number }) => {
    const clamped = Math.min(PREVIEW_ZOOM_MAX, Math.max(PREVIEW_ZOOM_MIN, zoom));
    const nextPan = clamped <= 1.001 ? { x: 0, y: 0 } : pan;
    previewZoomRef.current = clamped;
    previewPanValueRef.current = nextPan;
    setPreviewZoom(clamped);
    setPreviewPan(nextPan);
  }, []);

  const resetPreviewView = useCallback(() => applyPreviewView(1, { x: 0, y: 0 }), [applyPreviewView]);

  /** Double-click toggles fit ↔ true 1:1 pixels. At scale 1 the <img> is laid
   *  out contained, so `naturalWidth / clientWidth` is exactly the factor that
   *  brings it back to its stored resolution. */
  const togglePreviewNaturalSize = () => {
    const img = previewImgRef.current;
    if (!img) return;
    if (previewZoomRef.current > 1.001) { resetPreviewView(); return; }
    const natural = img.clientWidth > 0 ? img.naturalWidth / img.clientWidth : 1;
    applyPreviewView(Math.max(1, natural), { x: 0, y: 0 });
  };

  const openImagePreview = useCallback((data: { src: string; caption: string; cardId: string }) => {
    setPreviewImage(data);
    setPreviewCaptionInput(data.caption);
    setPreviewGallery(harvestGallery(editContentRef.current));
    setIsCaptionPanelOpen(true);
    applyPreviewView(1, { x: 0, y: 0 });
  }, [harvestGallery, applyPreviewView]);

  const closeImagePreview = useCallback(() => {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setPreviewImage(null);
    setPreviewGallery([]);
    previewPanRef.current = null;
    applyPreviewView(1, { x: 0, y: 0 });
  }, [applyPreviewView]);

  const previewIndex = useMemo(
    () => (previewImage ? previewGallery.findIndex(item => item.cardId === previewImage.cardId) : -1),
    [previewImage, previewGallery]
  );

  /** Push the caption box back into the note HTML. Returns true if it wrote. */
  const commitPreviewCaption = () => {
    const target = previewImage;
    if (!target || previewCaptionInput === target.caption) return false;
    const doc = new DOMParser().parseFromString(editContentRef.current || '', 'text/html');
    const card = doc.getElementById(target.cardId);
    if (!card) return false;
    let captionDiv = card.querySelector('.rte-image-caption');
    if (!captionDiv) {
      captionDiv = doc.createElement('div');
      captionDiv.className = 'rte-image-caption';
      captionDiv.setAttribute('contenteditable', 'true');
      card.appendChild(captionDiv);
    }
    captionDiv.textContent = previewCaptionInput;
    // commitBuffer routes the write to `content` or `refinedContent` by tab, so
    // a caption edited on the Refined tab can't touch the original.
    commitBuffer(doc.body.innerHTML);
    // Keep the in-memory copies honest so stepping away and back doesn't show
    // the pre-edit caption.
    setPreviewImage({ ...target, caption: previewCaptionInput });
    setPreviewGallery(prev =>
      prev.map(item => (item.cardId === target.cardId ? { ...item, caption: previewCaptionInput } : item))
    );
    return true;
  };

  /** Walk the note's gallery. Unsaved caption text is committed rather than
   *  silently discarded — arrowing away should never lose typing. */
  const stepPreview = (delta: number) => {
    if (previewGallery.length < 2) return;
    commitPreviewCaption();
    const current = previewIndex < 0 ? 0 : previewIndex;
    const next = (current + delta + previewGallery.length) % previewGallery.length;
    const item = previewGallery[next];
    setPreviewImage(item);
    setPreviewCaptionInput(item.caption);
    applyPreviewView(1, { x: 0, y: 0 });
  };

  const togglePreviewFullscreen = useCallback(() => {
    const el = previewOverlayRef.current;
    if (!el) return;
    const request = document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen();
    Promise.resolve(request).catch(() => toast.error('The browser blocked fullscreen for this page.'));
  }, []);

  // The user can also leave fullscreen with F11 or the browser's own Escape
  // handling, so the flag has to follow the document, not our button.
  useEffect(() => {
    const onChange = () => setIsPreviewFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Wheel-zoom anchored at the cursor: the pixel under the pointer stays put.
  useEffect(() => {
    const el = previewViewportRef.current;
    if (!el || !previewImage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      const prevZoom = previewZoomRef.current;
      const nextZoom = Math.min(
        PREVIEW_ZOOM_MAX,
        Math.max(PREVIEW_ZOOM_MIN, prevZoom * Math.exp(-e.deltaY * 0.0015))
      );
      const ratio = nextZoom / prevZoom;
      const pan = previewPanValueRef.current;
      applyPreviewView(nextZoom, {
        x: cx - (cx - pan.x) * ratio,
        y: cy - (cy - pan.y) * ratio,
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [previewImage, applyPreviewView]);

  const beginPreviewPan = (e: React.MouseEvent) => {
    if (previewZoomRef.current <= 1.001) return;
    e.preventDefault();
    previewPanRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: previewPanValueRef.current.x,
      originY: previewPanValueRef.current.y,
    };
  };

  useEffect(() => {
    if (!previewImage) return;
    const onMove = (e: MouseEvent) => {
      const start = previewPanRef.current;
      if (!start) return;
      applyPreviewView(previewZoomRef.current, {
        x: start.originX + (e.clientX - start.startX),
        y: start.originY + (e.clientY - start.startY),
      });
    };
    const onUp = () => { previewPanRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [previewImage, applyPreviewView]);

  const downloadPreviewImage = () => {
    if (!previewImage) return;
    const ext = /^data:image\/(\w+)/.exec(previewImage.src)?.[1] || 'png';
    const slug = (editTitle || 'note').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'note';
    const a = document.createElement('a');
    a.href = previewImage.src;
    a.download = `${slug}-image-${previewIndex >= 0 ? previewIndex + 1 : 1}.${ext === 'jpeg' ? 'jpg' : ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyPreviewImage = async () => {
    if (!previewImage) return;
    try {
      const ClipboardItemCtor = (window as any).ClipboardItem;
      if (!ClipboardItemCtor || !navigator.clipboard) throw new Error('unsupported');
      const blob = await (await fetch(previewImage.src)).blob();
      await (navigator.clipboard as any).write([new ClipboardItemCtor({ [blob.type]: blob })]);
      toast.success('Image copied to clipboard');
    } catch {
      toast.error('Your browser blocked the image clipboard write.');
    }
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

      // The lightbox swallows navigation and zoom keys while it is open, so the
      // note list underneath can't scroll away behind it. Bare-key shortcuts are
      // skipped while the caption box has focus — typing "-" there must type.
      if (previewImage) {
        const target = e.target as HTMLElement | null;
        const isTyping = !!target && (
          target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable
        );
        if (e.key === 'ArrowRight' && !isTyping) { e.preventDefault(); stepPreview(1); return; }
        if (e.key === 'ArrowLeft' && !isTyping) { e.preventDefault(); stepPreview(-1); return; }
        if (!isTyping) {
          if (e.key === '+' || e.key === '=') { e.preventDefault(); applyPreviewView(previewZoomRef.current * 1.25, previewPanValueRef.current); return; }
          if (e.key === '-' || e.key === '_') { e.preventDefault(); applyPreviewView(previewZoomRef.current / 1.25, previewPanValueRef.current); return; }
          if (e.key === '0') { e.preventDefault(); resetPreviewView(); return; }
          if (e.key.toLowerCase() === 'f' && !isMod) { e.preventDefault(); togglePreviewFullscreen(); return; }
        }
      }

      // Escape dismisses the topmost layer only, so one press never closes two
      // things at once. The lightbox and Focus Mode were both advertised as
      // Escape-dismissable but never wired up.
      if (e.key === 'Escape') {
        if (previewImage) { closeImagePreview(); return; }
        if (isQuickSwitcherOpen) { setIsQuickSwitcherOpen(false); return; }
        if (isShortcutsOpen) { setIsShortcutsOpen(false); return; }
        if (isTypographyOpen) { setIsTypographyOpen(false); return; }
        if (showNewNoteMenu || showDividerMenu || showMarkerMenu || groupColorMenuId || renamingGroupId) {
          setShowNewNoteMenu(false);
          setShowDividerMenu(false);
          setShowMarkerMenu(false);
          setGroupColorMenuId(null);
          setRenamingGroupId(null);
          return;
        }
        if (selectedBlockIds.length > 0) { setSelectedBlockIds([]); return; }
        if (selectedNoteIds.length > 0) { setSelectedNoteIds([]); return; }
        if (isFocusMode) { setIsFocusMode(false); return; }
        return;
      }

      // Cmd/Ctrl+N: new note (works everywhere, but don't fight typing "n")
      if (isMod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewNote();
        return;
      }

      // Cmd/Ctrl+S: force save now — routed through the tab-aware payload so a
      // manual save on the Refined tab can't overwrite the original.
      if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (selectedNoteId) {
          saveEditorBuffer();
          toast.success('Saved ✓');
        }
        return;
      }

      // Cmd/Ctrl+Shift+G / Cmd/Ctrl+G: group / ungroup canvas selection
      if (isMod && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupSelectedBlocks();
        } else {
          groupSelectedBlocks();
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
  }, [isQuickSwitcherOpen, isTypographyOpen, isShortcutsOpen, showNewNoteMenu, showDividerMenu, showMarkerMenu, groupColorMenuId, renamingGroupId, previewImage, previewGallery, previewIndex, previewCaptionInput, selectedNoteIds, selectedNoteId, selectedBlockIds, isFocusMode, saveEditorBuffer, groupSelectedBlocks, ungroupSelectedBlocks, createNewNote, applyPreviewView, resetPreviewView, closeImagePreview, togglePreviewFullscreen]);

  // Keep "2 min ago" style timestamps honest without re-rendering the world
  useEffect(() => {
    const interval = setInterval(() => setClockTick(tick => tick + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Click anywhere else to dismiss the popover menus. Every popover marks its
  // wrapper with `data-ns-menu` so a press inside it is not a dismissal.
  useEffect(() => {
    if (!showNewNoteMenu && !showDividerMenu && !showMarkerMenu && !groupColorMenuId) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-ns-menu]')) return;
      setShowNewNoteMenu(false);
      setShowDividerMenu(false);
      setShowMarkerMenu(false);
      setGroupColorMenuId(null);
    };
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [showNewNoteMenu, showDividerMenu, showMarkerMenu, groupColorMenuId]);

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
    <div className="notes-suite h-[100dvh] max-h-[100dvh] bg-[var(--ns-page)] pt-[var(--ns-chrome-top)] flex flex-col relative overflow-hidden font-sans">
      <div className="w-full flex-1 flex flex-col min-h-0 px-3 pb-3">

        {/* Navigation & Header — slots into the gap inside FloatingNav's fixed
            band, between the "Life OS" wordmark and the icon cluster on the
            right. The wrapper is pointer-events-none so the nav flyout can still
            be clicked through the empty middle; each cluster opts back in. */}
        {!isFocusMode && (
          <div className="lg:pointer-events-none lg:absolute lg:top-[var(--ns-nav-top)] lg:left-[var(--ns-nav-left)] lg:right-[var(--ns-nav-right)] lg:z-[10005] lg:bg-transparent lg:px-0 lg:py-0 lg:border-0 lg:shadow-none flex max-w-full flex-col lg:flex-row lg:items-center justify-between pb-2 mb-2 border-b border-[var(--ns-hairline)] lg:border-b-0 lg:mb-0 lg:pb-0 gap-3">
            <div className="flex items-center gap-2 min-w-0 lg:pointer-events-auto">
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

            <div className="flex items-center gap-2 lg:pointer-events-auto">
              {/* Search pill — opens the quick switcher (⌘K) */}
              <button
                onClick={() => setIsQuickSwitcherOpen(true)}
                className="hidden xl:flex items-center gap-2 h-9 w-[200px] px-3.5 rounded-full bg-[var(--ns-btn-surface)] ring-1 ring-inset ring-[var(--ns-btn-ring)] shadow-[var(--ns-btn-shadow)] text-[13px] text-[var(--ns-ink-muted)] hover:bg-[var(--ns-btn-surface-hover)] hover:shadow-[var(--ns-btn-shadow-hover)] active:translate-y-px transition-all duration-150"
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
              <div className="flex gap-1 bg-[var(--ns-zone-toolbar)] ring-1 ring-inset ring-[var(--ns-btn-ring)] p-1 rounded-full">
                {([['workspace', 'Workspace'], ['timeline', 'Daily Timeline']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={cn(
                      'h-7 px-3.5 rounded-full text-[12px] font-medium transition-all duration-150',
                      activeTab === key
                        ? 'bg-[var(--ns-ink)] text-white shadow-[var(--ns-btn-shadow-hover)]'
                        : 'text-[var(--ns-ink-soft)] hover:bg-[var(--ns-btn-surface)] hover:text-[var(--ns-ink)]'
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
              className="bg-[var(--ns-zone-sidebar)] border-r border-[var(--ns-zone-sidebar-edge)] flex flex-col p-2.5 relative"
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
                  <span className={cn(NS.label, 'flex items-center gap-1.5 text-[var(--ns-head-folders)]')}>
                    <FolderOpen className="w-3 h-3" />
                    Folders
                  </span>
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
                  <span className={cn(NS.label, 'mb-1.5 shrink-0 flex items-center gap-1.5 text-[var(--ns-head-recent)]')}>
                    <Clock className="w-3 h-3" />
                    Recent Notes
                  </span>
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
              className="border-r border-[var(--ns-zone-list-edge)] flex flex-col p-3 bg-[var(--ns-zone-list)] relative"
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

              {/* Group-by segmented control. `Note.section` already existed in
                  the schema but was display-only; this is what makes it do
                  something. Persisted to localStorage next to the folder list. */}
              <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
                <span className={cn(NS.label, 'shrink-0')}>Group by</span>
                <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-[var(--ns-zone-toolbar)] ring-1 ring-inset ring-[var(--ns-btn-ring)]">
                  {GROUP_BY_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => changeGroupBy(mode.id)}
                      className={cn(
                        'h-6 px-2.5 rounded-full text-[11px] font-medium transition-all duration-150',
                        groupBy === mode.id
                          ? 'bg-[var(--ns-surface)] text-[var(--ns-ink)] shadow-[var(--ns-btn-shadow-hover)]'
                          : 'text-[var(--ns-ink-muted)] hover:text-[var(--ns-ink-soft)]'
                      )}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mx-1 px-1">
                {listGroups.map(group => {
                  const isCollapsed = collapsedGroups.includes(group.name);
                  const groupIds = group.notes.map(n => n.id);
                  const allSelected = groupIds.length > 0 && groupIds.every(id => selectedNoteIds.includes(id));
                  return (
                  <div key={group.name} className="space-y-1.5">
                    <div className="group/head flex items-center gap-1.5 px-1">
                      <button
                        onClick={() => toggleGroupCollapsed(group.name)}
                        className="flex items-center gap-1.5 min-w-0 flex-1 text-left"
                        title={isCollapsed ? 'Expand group' : 'Collapse group'}
                      >
                        <ChevronDown
                          className={cn(
                            'w-3 h-3 shrink-0 text-[var(--ns-head-group-fg)] transition-transform duration-150',
                            isCollapsed && '-rotate-90'
                          )}
                        />
                        <span
                          className={cn(NS.label, 'truncate')}
                          style={{ color: 'var(--ns-head-group-fg, #92400e)' }}
                        >
                          {group.name}
                        </span>
                        <span
                          className="text-[10px] rounded-full px-1.5 py-px tabular-nums shrink-0"
                          style={{
                            backgroundColor: 'var(--ns-head-count-bg, #f4ead9)',
                            color: 'var(--ns-head-count-fg, #7c3d08)',
                          }}
                        >
                          {group.notes.length}
                        </span>
                      </button>
                      <button
                        onClick={() => toggleSelectGroup(group.notes)}
                        className={cn(
                          'shrink-0 text-[10px] font-medium px-1.5 py-px rounded transition-opacity',
                          'text-[var(--ns-ink-muted)] hover:text-[var(--ns-ink)]',
                          allSelected || selectedNoteIds.length > 0 ? 'opacity-100' : 'opacity-0 group-hover/head:opacity-100'
                        )}
                        title={allSelected ? 'Deselect this group' : 'Select every note in this group'}
                      >
                        {allSelected ? 'none' : 'all'}
                      </button>
                    </div>

                    {!isCollapsed && (
                    <div className="space-y-1">
                      {group.notes.map(n => {
                        const isActive = selectedNoteId === n.id;
                        const isChecked = selectedNoteIds.includes(n.id);
                        return (
                          <div
                            key={n.id}
                            onClick={(e) => {
                              // ⌘/Ctrl-click and shift-click extend the selection
                              // without swapping the editor out from under you.
                              if (e.metaKey || e.ctrlKey || e.shiftKey) {
                                toggleSelectNote(n.id, e);
                                return;
                              }
                              selectNote(n);
                            }}
                            className={cn(
                              'group relative overflow-hidden p-3 pl-7 rounded-[var(--ns-radius-md)] cursor-pointer transition-colors',
                              isChecked
                                ? 'bg-[var(--ns-head-group-bg)] ring-1 ring-inset ring-[var(--ns-accent-line)]'
                                : isActive
                                  ? 'bg-[var(--ns-accent-soft)]'
                                  : 'hover:bg-black/[0.025]'
                            )}
                          >
                            {isActive && !isChecked && (
                              <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-[var(--ns-accent-line)]" />
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSelectNote(n.id, e); }}
                              className={cn(
                                'absolute left-2 top-3 w-3.5 h-3.5 rounded-[3px] flex items-center justify-center transition-all duration-150',
                                isChecked
                                  ? 'bg-[var(--ns-ink)] text-white'
                                  : 'bg-[var(--ns-surface)] ring-1 ring-inset ring-[var(--ns-btn-ring)] opacity-0 group-hover:opacity-100'
                              )}
                              title={isChecked ? 'Deselect' : 'Select (⇧ for a range)'}
                            >
                              {isChecked && <ListChecks className="w-2.5 h-2.5" />}
                            </button>
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
                                {n.section && (
                                  <span className="text-[10px] rounded px-1.5 py-0.5" style={{ backgroundColor: 'var(--ns-head-count-bg, #f4ead9)', color: 'var(--ns-head-count-fg, #7c3d08)' }}>{n.section}</span>
                                )}
                                {n.tags?.slice(0, 2).map(t => (
                                  <button
                                    key={t}
                                    onClick={(e) => { e.stopPropagation(); setActiveTag(prev => (prev === t ? null : t)); }}
                                    className={cn(
                                      'text-[10px] rounded px-1.5 py-0.5 transition-colors',
                                      activeTag === t
                                        ? 'bg-[var(--ns-ink)] text-white'
                                        : 'text-[var(--ns-accent-ink)] bg-[var(--ns-accent-soft)] hover:bg-[var(--ns-accent-line)]/30'
                                    )}
                                    title={activeTag === t ? `Clear the "${t}" filter` : `Show only notes tagged "${t}"`}
                                  >
                                    {t}
                                  </button>
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
                    )}
                  </div>
                  );
                })}
                {filteredNotes.length === 0 && (
                  <p className="text-[12px] text-[var(--ns-ink-muted)] italic text-center py-12">
                    {activeTag
                      ? `No notes tagged "${activeTag}" here`
                      : filterTab === 'pinned' ? 'No pinned notes in this folder' : 'No notes in this folder'}
                  </p>
                )}
              </div>

              {/* Bulk action bar — pinned to the bottom of the list column so it
                  never covers a note card, and only present when it can act. */}
              <AnimatePresence>
                {selectedNoteIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="shrink-0 mt-2 p-2 rounded-[var(--ns-radius-md)] bg-[var(--ns-zone-toolbar)] ring-1 ring-inset ring-[var(--ns-btn-ring)] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11.5px] font-semibold text-[var(--ns-ink)] tabular-nums">
                        {selectedNoteIds.length} selected
                      </span>
                      <button
                        onClick={() => setSelectedNoteIds([])}
                        className="text-[10.5px] font-medium text-[var(--ns-ink-muted)] hover:text-[var(--ns-ink)]"
                        title="Clear selection (Esc)"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Select
                        value="none"
                        onValueChange={val => {
                          if (val === 'none') return;
                          applyBulkUpdate({ folder: val }, count => `Moved ${count} note${count === 1 ? '' : 's'} to "${val}"`);
                        }}
                      >
                        <SelectTrigger className={cn(NS.softInput, 'h-7 w-[118px] px-2 text-[11px]')}>
                          <SelectValue placeholder="Move to…" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--ns-surface)] border-0 shadow-[var(--ns-shadow-pop)] rounded-[var(--ns-radius-md)]">
                          <SelectItem value="none">Move to…</SelectItem>
                          {folders.filter(f => f !== 'Trash').map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => setBulkSectionOpen(prev => !prev)}
                        className={cn(NS.chip, 'h-7 px-2.5 text-[11px]', bulkSectionOpen && 'bg-[var(--ns-ink)] text-white hover:bg-[var(--ns-ink)] hover:text-white')}
                      >
                        <Layers className="w-3 h-3" /> Section
                      </Button>
                      <Button
                        onClick={() => applyBulkUpdate({ isFav: true }, count => `Pinned ${count} note${count === 1 ? '' : 's'}`)}
                        className={cn(NS.chip, 'h-7 px-2.5 text-[11px]')}
                      >
                        <Star className="w-3 h-3" /> Pin
                      </Button>
                      <Button
                        onClick={() => applyBulkUpdate({ isFav: false }, count => `Unpinned ${count} note${count === 1 ? '' : 's'}`)}
                        className={cn(NS.chip, 'h-7 px-2.5 text-[11px]')}
                      >
                        Unpin
                      </Button>
                      <Button
                        onClick={() => applyBulkUpdate({ folder: 'Trash' }, count => `Moved ${count} note${count === 1 ? '' : 's'} to Trash 🗑️`)}
                        className={cn(NS.chip, 'h-7 px-2.5 text-[11px] text-[var(--ns-danger)] hover:text-[var(--ns-danger)]')}
                      >
                        <Trash2 className="w-3 h-3" /> Trash
                      </Button>
                    </div>

                    {bulkSectionOpen && (
                      <div className="flex items-center gap-1">
                        <Input
                          value={bulkSectionValue}
                          onChange={e => setBulkSectionValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') applyBulkSection(); }}
                          placeholder="Section name (blank clears)"
                          autoFocus
                          className={cn(NS.softInput, 'h-7 flex-1 px-2 text-[11px]')}
                        />
                        <Button onClick={applyBulkSection} className={cn(NS.inkBtn, 'h-7 px-2.5 text-[11px]')}>
                          Apply
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

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
            <div className="flex-1 min-w-0 flex flex-col p-3 bg-[var(--ns-zone-editor)] relative">
              {selectedNote ? (
                <div className="flex flex-col h-full min-h-0 space-y-2">

                  {/* Note header — title, placement and actions on ONE row so the
                      editor keeps the height the old stacked pair spent. Tags
                      moved down to the merged footer strip. */}
                  <div className="flex items-center gap-2 min-w-0 shrink-0 border-b border-[var(--ns-hairline)] pb-2">
                    <FileText className="w-4 h-4 text-[var(--ns-ink-muted)] shrink-0" />
                    <input
                      value={editTitle}
                      onChange={e => {
                        const val = e.target.value;
                        setEditTitle(val);
                        editTitleRef.current = val;
                      }}
                      placeholder="Untitled Note"
                      className="bg-transparent text-[18px] font-semibold outline-none text-[var(--ns-ink)] placeholder:text-[var(--ns-ink-muted)] py-0 flex-1 min-w-[80px]"
                    />
                    <button
                      onClick={() => togglePin(selectedNote)}
                      className={cn(NS.iconBtnSm, 'shrink-0 inline-flex items-center justify-center')}
                      title={selectedNote.isFav ? 'Unpin' : 'Pin to top'}
                    >
                      <Star className={cn('w-3.5 h-3.5', selectedNote.isFav ? 'fill-[var(--ns-accent-line)] text-[var(--ns-accent-line)]' : '')} />
                    </button>

                    <Select value={editFolder} onValueChange={val => {
                      setEditFolder(val);
                      editFolderRef.current = val;
                    }}>
                      <SelectTrigger className="h-7 w-auto gap-1.5 px-2.5 text-[11.5px] rounded-full border-0 bg-[var(--ns-btn-surface)] ring-1 ring-inset ring-[var(--ns-btn-ring)] shadow-[var(--ns-btn-shadow)] text-[var(--ns-ink-soft)] focus:ring-1 focus:ring-offset-0 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--ns-surface)] border-0 shadow-[var(--ns-shadow-pop)] rounded-[var(--ns-radius-md)] text-[12.5px]">
                        {folders.filter(f => f !== 'All').map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Section / sub-grouping — also drives "Group by: Section" */}
                    <Input
                      value={editSection}
                      onChange={e => {
                        const val = e.target.value;
                        setEditSection(val);
                        editSectionRef.current = val;
                      }}
                      placeholder="Section..."
                      className={cn(NS.softInput, 'h-7 w-24 shrink-0 rounded-full px-2.5 text-[11.5px]')}
                    />

                    {lastSavedAt && (
                      <span className="hidden 2xl:flex items-center gap-1 text-[11px] text-[var(--ns-ink-muted)] shrink-0">
                        <Clock className="w-3 h-3" /> {formatRelativeTime(lastSavedAt)}
                      </span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {selectedNote.folder === 'Trash' && (
                        <Button onClick={handleRestore} variant="ghost" size="icon" className={NS.iconBtnSm} title="Restore Note">
                          <Undo2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          if (selectedNoteId) {
                            saveEditorBuffer();
                            toast.success('Saved ✓');
                          }
                        }}
                        variant="ghost"
                        size="icon"
                        className={NS.iconBtnSm}
                        title="Save Note (⌘S)"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </Button>
                      <Button onClick={downloadNote} variant="ghost" size="icon" className={NS.iconBtnSm} title="Download Markdown">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        onClick={handleDelete}
                        variant="ghost"
                        size="icon"
                        className={cn(NS.iconBtnSm, 'hover:text-rose-600')}
                        title={selectedNote.folder === 'Trash' ? 'Permanently Delete' : 'Move to Trash'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        onClick={() => setIsFocusMode(prev => !prev)}
                        variant="ghost"
                        size="icon"
                        className={NS.iconBtnSm}
                        title={isFocusMode ? "Exit Full Screen (Ctrl+Shift+F)" : "Full Screen Focus (Ctrl+Shift+F)"}
                      >
                        {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                      </Button>
                      <Button onClick={shareNote} className={cn(NS.inkBtn, 'h-7 px-3 gap-1.5')} title="Copy note as markdown">
                        <Share2 className="w-3 h-3" /> Share
                      </Button>
                    </div>
                  </div>

                  {/* ── Toolbars: all three rows stay visible, on one shared grey
                      surface so they read as a single tool region against the
                      white page rather than three floating strips. ── */}
                  <div className="shrink-0 rounded-[var(--ns-radius-md)] bg-[var(--ns-zone-toolbar)] ring-1 ring-inset ring-[var(--ns-btn-ring)] px-2 py-1.5 space-y-1">
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

                    {/* Bullet / number colour. Scoped to the list the caret is in,
                        written as an inline --rte-bullet custom property, so it
                        persists in the note HTML and stays token-driven. */}
                    <div className="relative" data-ns-menu>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={NS.toolBtn}
                        onClick={() => setShowMarkerMenu(v => !v)}
                        title="Bullet colour"
                      >
                        <span className="relative flex items-center justify-center w-3.5 h-3.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: 'var(--rte-marker, #78716c)' }}
                          />
                        </span>
                      </Button>
                      <AnimatePresence>
                        {showMarkerMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.14 }}
                            className="absolute left-0 top-full mt-1.5 bg-[var(--ns-surface)] rounded-[var(--ns-radius-md)] shadow-[var(--ns-shadow-pop)] p-1.5 z-50 w-44 space-y-0.5"
                          >
                            <p className={cn(NS.label, 'px-2 pt-0.5 pb-1')}>Bullet colour</p>
                            {MARKER_SWATCHES.map(sw => (
                              <button
                                key={sw.label}
                                onClick={() => applyMarkerColor(sw.value)}
                                className="w-full text-left px-2 py-1.5 rounded-[var(--ns-radius-sm)] text-[12.5px] text-[var(--ns-ink-soft)] hover:text-[var(--ns-ink)] hover:bg-black/[0.04] flex items-center gap-2 transition-colors"
                              >
                                <span
                                  className="w-3 h-3 rounded-full ring-1 ring-inset ring-black/[0.08] shrink-0"
                                  style={{ backgroundColor: `var(${sw.token}, ${sw.fallback})` }}
                                />
                                <span>{sw.label}</span>
                                {sw.value === null && (
                                  <span className="ml-auto text-[10px] text-[var(--ns-ink-muted)]">default</span>
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

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

                    <span className="ml-auto text-[11px] text-[var(--ns-ink-muted)] hidden 2xl:block">
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
                    <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 bg-[var(--ns-surface)] ring-1 ring-inset ring-[var(--ns-btn-ring)] rounded-[var(--ns-radius-sm)] shrink-0">
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
                      <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-[var(--ns-btn-surface)] ring-1 ring-inset ring-[var(--ns-btn-ring)]">
                        {([['original', 'Original'], ['refined', 'Refined']] as const).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => handleToggleNoteTab(key)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-[11px] transition-colors',
                              noteTab === key
                                ? 'bg-[var(--ns-ink)] text-white font-medium'
                                : 'text-[var(--ns-ink-soft)] hover:text-[var(--ns-ink)]'
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                  {/* ── /toolbars ── */}

                  {/* Main Content Area: Editor vs Freeform Canvas.
                      No min/max height: the editor is the flex child that eats
                      every pixel the chrome above and below doesn't claim, so it
                      keeps growing on a bigger monitor instead of stopping at
                      600px and pushing the footer out of the clipped shell. */}
                  <div className="flex-1 min-h-0 relative rounded-[var(--ns-radius-md)] overflow-hidden bg-[var(--ns-surface)] flex flex-col">
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
                                    onClick={() => changeEditorFont(f.id)}
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
                                  onChange={e => changeEditorFontSize(parseInt(e.target.value))}
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
                        onImagePreview={openImagePreview}
                        onSelectionFormatsChange={setActiveFormats}
                      />

                      {/* Freeform Canvas Layer (tldr style) */}
                      {isCanvasActive && (
                        <div
                          ref={canvasSurfaceRef}
                          className="absolute inset-0 bg-[var(--ns-surface-muted)]/70 backdrop-blur-[1px] z-20 overflow-auto rounded-[var(--ns-radius-md)] ring-1 ring-inset ring-[var(--ns-accent-line)]/40 select-none"
                          onMouseDown={beginMarquee}
                          onDoubleClick={(e) => {
                            // Only bare canvas spawns a block — a double-click on a
                            // card or a group frame bubbles here too.
                            if (e.target !== e.currentTarget) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            addCanvasBlock(
                              e.clientX - rect.left + e.currentTarget.scrollLeft,
                              e.clientY - rect.top + e.currentTarget.scrollTop
                            );
                          }}
                        >
                          {/* No padding on the surface: absolute children position
                              against its padding box, while pointer maths works off
                              the border box, so any padding would offset every drop
                              point and the marquee by exactly that much. */}
                          <div className="sticky top-0 left-0 z-30 m-2 flex items-center gap-1.5 bg-[var(--ns-accent-soft)] text-[var(--ns-accent)] text-[10.5px] px-2.5 py-1 rounded-full shadow-[var(--ns-shadow-card)] pointer-events-none font-medium w-fit">
                            <Pencil className="w-3 h-3" /> Double-click empty space to add · drag the grip to move · drag empty space to marquee-select · ⌘G group · ⌘⇧G ungroup
                          </div>

                          {/* ── Groups and blocks share one absolute coordinate
                              space, z-ordered so a frame sits behind its members
                              rather than containing them. `groupBoundsFor` and the
                              drag math both work in canvas coordinates; nesting
                              would force a relative/absolute conversion on every
                              move for no visual gain. ─────────────────────────── */}
                          {canvasGroups.map(group => {
                            const members = canvasBlocks.filter(b => b.groupId === group.id);
                            const isRenaming = renamingGroupId === group.id;
                            return (
                              <div
                                key={group.id}
                                style={{
                                  left: group.x,
                                  top: group.y,
                                  width: group.width,
                                  height: group.height,
                                  backgroundColor: CANVAS_LEGACY_FILLS[group.color] ?? group.color,
                                }}
                                className="absolute z-0 rounded-[var(--ns-radius-md)] ring-1 ring-inset ring-[var(--ns-hairline-strong)] p-1.5 shadow-[var(--ns-shadow-card)]"
                              >
                                <div className="flex items-center justify-between gap-1 h-6">
                                  {/* Left cluster is the drag surface; the buttons
                                      on the right must not start a drag. */}
                                  <div
                                    onMouseDown={(e) => beginCanvasDrag(e, 'group', group.id)}
                                    onDoubleClick={(e) => { e.stopPropagation(); setRenamingGroupId(group.id); }}
                                    className="flex items-center gap-1 min-w-0 flex-1 cursor-grab active:cursor-grabbing"
                                    title="Drag to move the group and its blocks · double-click to rename"
                                  >
                                    <GripVertical className="w-3 h-3 shrink-0 text-[var(--ns-ink-muted)]" />
                                    {isRenaming ? (
                                      <input
                                        autoFocus
                                        value={group.title}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onChange={(e) => renameCanvasGroup(group.id, e.target.value)}
                                        onBlur={() => { setRenamingGroupId(null); flushPendingSave(); }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === 'Escape') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setRenamingGroupId(null);
                                            flushPendingSave();
                                          }
                                        }}
                                        className="min-w-0 flex-1 bg-white/80 rounded-full px-2 h-5 text-[11px] font-medium text-[var(--ns-ink)] outline-none ring-1 ring-inset ring-[var(--ns-accent-line)]"
                                      />
                                    ) : (
                                      <span className="text-[11px] font-medium text-[var(--ns-ink-soft)] truncate">
                                        {group.title}
                                      </span>
                                    )}
                                    <span className="shrink-0 text-[9.5px] tabular-nums px-1.5 rounded-full bg-white/70 text-[var(--ns-ink-muted)]">
                                      {members.length}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={() => toggleCanvasGroupCollapsed(group.id)}
                                      className={CANVAS_BTN}
                                      title={group.collapsed ? 'Expand group' : 'Collapse group'}
                                    >
                                      <ChevronDown className={cn('w-3 h-3 transition-transform', group.collapsed && '-rotate-90')} />
                                    </button>

                                    {/* Colour tag — `group.color` is finally read at
                                        render, and every swatch is a token
                                        reference so the palette stays retunable. */}
                                    <div className="relative" data-ns-menu>
                                      <button
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={() => setGroupColorMenuId(current => current === group.id ? null : group.id)}
                                        className={CANVAS_BTN}
                                        title="Group colour"
                                      >
                                        <Palette className="w-3 h-3" />
                                      </button>
                                      <AnimatePresence>
                                        {groupColorMenuId === group.id && (
                                          <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.14 }}
                                            className="absolute right-0 top-full mt-1 z-40 flex items-center gap-1 p-1.5 rounded-full bg-[var(--ns-surface)] shadow-[var(--ns-shadow-pop)]"
                                          >
                                            {CANVAS_GROUP_PALETTE.map(swatch => (
                                              <button
                                                key={swatch.label}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={() => setCanvasGroupColor(group.id, swatch.value)}
                                                style={{ backgroundColor: swatch.value }}
                                                className={cn(
                                                  'w-4 h-4 rounded-full ring-1 ring-inset ring-black/10 hover:scale-110 transition-transform',
                                                  group.color === swatch.value && 'ring-2 ring-[var(--ns-accent-line)]'
                                                )}
                                                title={swatch.label}
                                              />
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>

                                    <button
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={() => selectGroupMembers(group.id)}
                                      className={CANVAS_BTN}
                                      title="Select every block in this group"
                                    >
                                      <ListChecks className="w-3 h-3" />
                                    </button>
                                    <button
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={() => ungroupBlocks(group.id)}
                                      className={CANVAS_BTN}
                                      title="Ungroup"
                                    >
                                      Ungroup
                                    </button>
                                  </div>
                                </div>

                                {group.collapsed && (
                                  <p className="mt-1 px-1 text-[10px] text-[var(--ns-ink-muted)] italic">
                                    {members.length} block{members.length === 1 ? '' : 's'} hidden
                                  </p>
                                )}
                              </div>
                            );
                          })}

                          {/* Render Canvas Blocks */}
                          {canvasBlocks.map(block => {
                            const isSelected = selectedBlockIds.includes(block.id);
                            const owner = block.groupId
                              ? canvasGroups.find(g => g.id === block.groupId)
                              : undefined;
                            // A collapsed group hides its members rather than
                            // leaving them floating over the shrunken frame.
                            if (owner?.collapsed) return null;
                            return (
                              <div
                                key={block.id}
                                style={{
                                  left: block.x,
                                  top: block.y,
                                  width: block.width,
                                  backgroundColor: CANVAS_LEGACY_FILLS[block.color] ?? block.color,
                                }}
                                className={cn(
                                  'absolute z-10 p-2.5 rounded-[var(--ns-radius-md)] shadow-[var(--ns-shadow-card)] transition-shadow',
                                  isSelected
                                    ? 'ring-2 ring-[var(--ns-accent-line)] shadow-[var(--ns-shadow-pop)]'
                                    : 'ring-1 ring-inset ring-black/[0.06]'
                                )}
                              >
                                <div className="flex items-center justify-between gap-1 border-b border-black/[0.06] pb-1 mb-2">
                                  {/* The grip is the drag surface so the textarea
                                      below still types and selects normally. */}
                                  <div
                                    onMouseDown={(e) => beginCanvasDrag(e, 'block', block.id)}
                                    className="flex items-center gap-1 min-w-0 flex-1 cursor-grab active:cursor-grabbing"
                                    title="Drag to move · ⌘/⇧ click to multi-select"
                                  >
                                    <GripVertical className="w-3 h-3 shrink-0 text-[var(--ns-ink-muted)]" />
                                    <span className="text-[10.5px] font-medium text-[var(--ns-ink-soft)] truncate">
                                      {owner ? owner.title : 'Note Card'}
                                    </span>
                                  </div>
                                  <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); deleteCanvasBlock(block.id); }}
                                    className={cn(CANVAS_BTN, 'hover:text-[var(--ns-danger)]')}
                                    title="Delete block"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                <textarea
                                  value={block.content}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onChange={(e) => updateCanvasBlock(block.id, { content: e.target.value })}
                                  onBlur={() => flushPendingSave()}
                                  placeholder="Write notes here..."
                                  className="w-full bg-transparent text-[12px] text-[var(--ns-ink)] placeholder:text-[var(--ns-ink-muted)] outline-none resize-none leading-relaxed min-h-[60px] cursor-text"
                                />
                              </div>
                            );
                          })}

                          {/* Marquee rubber band */}
                          {marquee && (
                            <div
                              className="absolute z-20 pointer-events-none rounded-[var(--ns-radius-sm)] bg-[var(--ns-accent-soft)]/40 ring-1 ring-[var(--ns-accent-line)]"
                              style={{
                                left: Math.min(marquee.x1, marquee.x2),
                                top: Math.min(marquee.y1, marquee.y2),
                                width: Math.abs(marquee.x2 - marquee.x1),
                                height: Math.abs(marquee.y2 - marquee.y1),
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* ── One merged footer strip: tags · backlinks · stats ────
                      The old stacked pair (a Tags block and a Backlinks block,
                      each with its own uppercase label row) cost ~130px of the
                      editor column and was the first thing the shell's
                      `overflow-hidden` clipped — which is why the Backlinks row
                      kept vanishing. One 36px row, nothing hidden, and the
                      floating word-count pill folded in at the right so it stops
                      covering the last line of text. */}
                  <div className="shrink-0 h-9 flex items-center gap-1.5 px-2 rounded-[var(--ns-radius-md)] bg-[var(--ns-zone-footer)] ring-1 ring-inset ring-[var(--ns-btn-ring)]">

                    {/* Tags */}
                    <Tag className="w-3.5 h-3.5 shrink-0 text-[var(--ns-head-folders)]" />
                    <div className="flex items-center gap-1 overflow-x-auto min-w-0 max-w-[42%] ns-strip-scroll">
                      {editTags.length === 0 && (
                        <span className="text-[10.5px] text-[var(--ns-ink-muted)] italic whitespace-nowrap">no tags</span>
                      )}
                      {editTags.map(t => {
                        const hash = t.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        const tone = TAG_PALETTE[hash % TAG_PALETTE.length];
                        return (
                          <span
                            key={t}
                            style={{
                              backgroundColor: `var(${tone.bg}, ${tone.bgFallback})`,
                              color: `var(${tone.fg}, ${tone.fgFallback})`,
                            }}
                            className={cn(NS.flatPill, 'font-medium shrink-0 whitespace-nowrap')}
                          >
                            {t}
                            <button
                              onClick={() => removeTag(t)}
                              className="opacity-50 hover:opacity-100 text-[12px] leading-none"
                              title={`Remove "${t}"`}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                    <Input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
                      placeholder="+ tag"
                      className={cn(NS.softInput, 'h-6 w-[74px] shrink-0 px-2 text-[11px]')}
                    />
                    <Button
                      onClick={addTag}
                      size="icon"
                      className={cn(NS.iconBtnSm, 'h-6 w-6 shrink-0')}
                      title="Add tag"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>

                    <span className={NS.divider} />

                    {/* Backlinks */}
                    <Link2 className="w-3.5 h-3.5 shrink-0 text-[var(--ns-head-recent)]" />
                    <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1 ns-strip-scroll">
                      {editBacklinks.length === 0 && (
                        <span className="text-[10.5px] text-[var(--ns-ink-muted)] italic whitespace-nowrap">no links</span>
                      )}
                      {editBacklinks.map(b => (
                        <span
                          key={b}
                          className={cn(NS.flatPill, 'shrink-0 whitespace-nowrap bg-[var(--ns-surface)] text-[var(--ns-ink-soft)] ring-1 ring-inset ring-[var(--ns-btn-ring)]')}
                        >
                          {notes.find(n => n.id === b)?.title || 'Linked note'}
                          <button
                            onClick={() => removeBacklink(b)}
                            className="text-[var(--ns-ink-muted)] hover:text-[var(--ns-danger)] text-[12px] leading-none"
                            title="Remove backlink"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <Select value={backlinkTarget} onValueChange={setBacklinkTarget}>
                      <SelectTrigger className={cn(NS.softInput, 'h-6 w-[104px] shrink-0 px-2 text-[11px]')}>
                        <SelectValue placeholder="Link…" />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--ns-surface)] border-0 shadow-[var(--ns-shadow-pop)] rounded-[var(--ns-radius-md)]">
                        <SelectItem value="none">Choose note…</SelectItem>
                        {notes.filter(n => n.id !== selectedNoteId).map(n => (
                          <SelectItem key={n.id} value={n.id}>{n.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={addBacklink}
                      size="icon"
                      className={cn(NS.iconBtnSm, 'h-6 w-6 shrink-0')}
                      title="Add backlink"
                    >
                      <Link2 className="w-3 h-3" />
                    </Button>

                    <span className={NS.divider} />

                    <span className="shrink-0 whitespace-nowrap tabular-nums text-[10.5px] text-[var(--ns-ink-muted)]">
                      {editorStats.words}w
                      <span className="hidden 2xl:inline"> · {editorStats.chars}c</span>
                      {' · '}{editorStats.readingMins}m
                    </span>
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

      {/* ══ Image Lightbox ══════════════════════════════════════════════════
          Rendered under `.notes-suite` but outside `.rte-root`, so the editor's
          `img { width: 100% !important }` normalisation can't reach the stage.
          Fullscreen is requested on this overlay, never on the in-editor card. */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            ref={previewOverlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0b0b0c] flex flex-col select-none"
          >
            {/* ── Chrome ────────────────────────────────────────────────── */}
            <div className="shrink-0 h-11 px-2.5 flex items-center justify-between gap-2 bg-white/[0.04] border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-3.5 h-3.5 text-white/50 shrink-0" />
                <span className="text-[11.5px] text-white/70 truncate">
                  {editTitle || 'Untitled note'}
                </span>
                {previewGallery.length > 1 && (
                  <span className="text-[11px] text-white/45 tabular-nums shrink-0">
                    {(previewIndex < 0 ? 0 : previewIndex) + 1} / {previewGallery.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => applyPreviewView(previewZoom / 1.25, previewPan)}
                  disabled={previewZoom <= PREVIEW_ZOOM_MIN + 0.001}
                  className={PREVIEW_BTN}
                  title="Zoom out (−)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetPreviewView}
                  className={cn(PREVIEW_BTN, 'tabular-nums px-2.5')}
                  title="Reset to fit (0)"
                >
                  {Math.round(previewZoom * 100)}%
                </button>
                <button
                  onClick={() => applyPreviewView(previewZoom * 1.25, previewPan)}
                  disabled={previewZoom >= PREVIEW_ZOOM_MAX - 0.001}
                  className={PREVIEW_BTN}
                  title="Zoom in (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <span className="w-px h-5 bg-white/15 mx-1" />

                <button onClick={togglePreviewFullscreen} className={PREVIEW_BTN} title={isPreviewFullscreen ? 'Exit full screen (F)' : 'Full screen (F)'}>
                  {isPreviewFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button onClick={downloadPreviewImage} className={PREVIEW_BTN} title="Download image">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={copyPreviewImage} className={PREVIEW_BTN} title="Copy image to clipboard">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsCaptionPanelOpen(prev => !prev)}
                  className={PREVIEW_BTN}
                  title={isCaptionPanelOpen ? 'Hide notes panel' : 'Show notes panel'}
                >
                  {isCaptionPanelOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                </button>

                <span className="w-px h-5 bg-white/15 mx-1" />

                <button onClick={closeImagePreview} className={cn(PREVIEW_BTN, 'hover:bg-[var(--ns-danger)] hover:ring-[var(--ns-danger)]')} title="Close (Esc)">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ── Stage + notes panel ───────────────────────────────────── */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row">
              <div
                ref={previewViewportRef}
                className="flex-1 min-w-0 min-h-0 relative overflow-hidden flex items-center justify-center"
                onMouseDown={beginPreviewPan}
                onDoubleClick={togglePreviewNaturalSize}
                style={{ cursor: previewZoom > 1.001 ? (previewPanRef.current ? 'grabbing' : 'grab') : 'zoom-in' }}
              >
                <img
                  ref={previewImgRef}
                  src={previewImage.src}
                  alt={previewImage.caption || 'Note image, full preview'}
                  draggable={false}
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                  style={{
                    transform: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewZoom})`,
                    transformOrigin: 'center center',
                    transition: previewPanRef.current ? 'none' : 'transform 120ms ease-out',
                    imageRendering: previewZoom > 2 ? 'pixelated' : 'auto',
                  }}
                />

                {previewGallery.length > 1 && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); stepPreview(-1); }}
                      onMouseDown={e => e.stopPropagation()}
                      className={cn(PREVIEW_BTN, 'absolute left-3 top-1/2 -translate-y-1/2 !h-10 !w-10 !rounded-full bg-black/45')}
                      title="Previous image (←)"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); stepPreview(1); }}
                      onMouseDown={e => e.stopPropagation()}
                      className={cn(PREVIEW_BTN, 'absolute right-3 top-1/2 -translate-y-1/2 !h-10 !w-10 !rounded-full bg-black/45')}
                      title="Next image (→)"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/45 text-[10.5px] text-white/55 pointer-events-none whitespace-nowrap">
                  Scroll to zoom · drag to pan · double-click 1:1 · F full screen · Esc close
                </div>
              </div>

              {isCaptionPanelOpen && (
                <aside className="w-full md:w-80 shrink-0 flex flex-col gap-3 p-4 bg-white/[0.04] border-t md:border-t-0 md:border-l border-white/10 select-text">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-white/85">Image notes &amp; specs</h3>
                  </div>
                  <textarea
                    value={previewCaptionInput}
                    onChange={e => setPreviewCaptionInput(e.target.value)}
                    placeholder="Write notes, requirements, or descriptions for this image..."
                    className="flex-1 min-h-[120px] w-full p-3 text-[12.5px] leading-relaxed rounded-[var(--ns-radius-md)] bg-black/30 text-white/90 placeholder:text-white/35 outline-none resize-none ring-1 ring-inset ring-white/12 focus:ring-white/30"
                  />
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        if (commitPreviewCaption()) toast.success('Image notes saved and synced');
                        else toast.info('No caption changes to save');
                      }}
                      className={cn(PREVIEW_BTN, '!h-9 w-full !bg-white/20 hover:!bg-white/30 !text-white')}
                    >
                      Save &amp; sync notes
                    </Button>
                    <Button
                      onClick={closeImagePreview}
                      className={cn(PREVIEW_BTN, '!h-9 w-full')}
                    >
                      Close preview
                    </Button>
                  </div>
                </aside>
              )}
            </div>
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
              className="bg-[var(--ns-surface)] rounded-[var(--ns-radius)] p-5 w-80 shadow-[var(--ns-shadow-pop)] space-y-3 max-h-[80vh] overflow-y-auto"
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
              {/* Grouped so the sheet stays scannable now that every binding it
                  lists is actually wired up. */}
              {([
                ['Workspace', [
                  ['⌘ K', 'Jump to note'],
                  ['⌘ N', 'New note'],
                  ['⌘ S', 'Save now'],
                  ['⌘ ⇧ F', 'Focus Mode'],
                  ['⌘ B', 'Bold selection'],
                  ['⌘ I', 'Italic selection'],
                  ['Esc', 'Dismiss the topmost layer'],
                ]],
                ['Canvas', [
                  ['⌘ G', 'Group selected blocks'],
                  ['⌘ ⇧ G', 'Ungroup selection'],
                  ['⇧ / ⌘ click', 'Multi-select blocks'],
                  ['Drag empty space', 'Marquee select'],
                ]],
                ['Image preview', [
                  ['← / →', 'Previous / next image'],
                  ['+ / −', 'Zoom in / out'],
                  ['0', 'Reset to fit'],
                  ['F', 'True full screen'],
                  ['Double-click', 'Fit ↔ 1:1'],
                ]],
              ] as [string, [string, string][]][]).map(([section, rows]) => (
                <div key={section} className="space-y-2 text-[12.5px] text-[var(--ns-ink-soft)]">
                  <p className={cn(NS.label, 'pt-1')}>{section}</p>
                  {rows.map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span>{label}</span>
                      <kbd className="shrink-0 bg-[var(--ns-surface-muted)] rounded-md px-2 py-0.5 text-[10.5px] text-[var(--ns-ink-muted)] whitespace-nowrap">{key}</kbd>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}