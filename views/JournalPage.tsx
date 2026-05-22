"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, FileText, Bell, Plus, Pencil, Trash2,
  ChevronLeft, ChevronRight, Smile, Calendar, TrendingUp,
  Search, LayoutGrid, LayoutList, Sparkles, Tag, ArrowRight, X,
} from 'lucide-react';
import { format, getDaysInMonth, startOfMonth, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { JournalBookView } from '@/components/journal/JournalBookView';
import { DailySpread } from '@/components/journal/DailySpread';
import { Bookshelf } from '@/components/journal/Bookshelf';
import type { JournalEntry, JournalEntryType, JournalMood } from '@/types';

// ─── Constants ───────────────────────────────────────────
const moodConfig: Record<JournalMood, { emoji: string; label: string; color: string; handwritten: string }> = {
  great:    { emoji: '😄', label: 'Great',    color: '#8ab896', handwritten: '✧ Wonderful ✧' },
  good:     { emoji: '🙂', label: 'Good',     color: '#7a9eb8', handwritten: '~ Feeling good ~' },
  okay:     { emoji: '😐', label: 'Okay',     color: '#d9b896', handwritten: '• So-so •' },
  bad:      { emoji: '😞', label: 'Bad',      color: '#d49191', handwritten: '… Not great …' },
  terrible: { emoji: '😢', label: 'Terrible', color: '#a85a5a', handwritten: '× Rough day ×' },
};

const typeIcons: Record<JournalEntryType, typeof BookOpen> = {
  journal: BookOpen, note: FileText, reminder: Bell,
};
const typeColors: Record<JournalEntryType, { bg: string; text: string; border: string }> = {
  journal:  { bg: '#e8eef3', text: '#5a7a94', border: '#7a9eb8' },
  note:     { bg: '#e8f0e9', text: '#5a9468', border: '#8ab896' },
  reminder: { bg: '#fef9e6', text: '#a88a5a', border: '#e0d4a0' },
};

const ENTRIES_PER_PAGE = 6;

// ═══════════ MAIN COMPONENT ═══════════
export function JournalPage() {
  const {
    journalEntries, journalBooks, activeBookId, setActiveBookId,
    addJournalEntry, updateJournalEntry, deleteJournalEntry,
    addJournalBook, deleteJournalBook,
  } = useApp();

  // ─── View State ───
  const [readerOpen, setReaderOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<JournalEntryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // ─── Entry Modal State ───
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  // ─── Form State ───
  const [formType, setFormType] = useState<JournalEntryType>('journal');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMood, setFormMood] = useState<JournalMood | ''>('');
  const [formTags, setFormTags] = useState('');
  const [formBookId, setFormBookId] = useState('');

  // ─── Create Book ───
  const [createBookOpen, setCreateBookOpen] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookOwner, setNewBookOwner] = useState('Ansh');
  const [newBookPurpose, setNewBookPurpose] = useState('');
  const [newBookDescription, setNewBookDescription] = useState('');
  const [newBookChapters, setNewBookChapters] = useState('');
  const [newBookType, setNewBookType] = useState<'journal' | 'daily-log' | 'notebook' | 'project' | 'custom'>('journal');
  const [newBookColor, setNewBookColor] = useState('#7a9eb8');
  const [newBookIcon, setNewBookIcon] = useState('');
  const [newBookIsPrivate, setNewBookIsPrivate] = useState(false);
  const [newBookTags, setNewBookTags] = useState('');
  const [formStep, setFormStep] = useState(1); // Multi-step form

  const bookTypePresets = [
    { type: 'journal' as const, icon: '📔', label: 'Journal', desc: 'Personal reflections & thoughts', defaultIcon: '📔' },
    { type: 'daily-log' as const, icon: '📝', label: 'Daily Log', desc: 'Quick daily notes & logs', defaultIcon: '📝' },
    { type: 'notebook' as const, icon: '📓', label: 'Notebook', desc: 'Organized notes with sections', defaultIcon: '📓' },
    { type: 'project' as const, icon: '📋', label: 'Project', desc: 'Project tracking & phases', defaultIcon: '📋' },
    { type: 'custom' as const, icon: '✨', label: 'Custom', desc: 'Create your own structure', defaultIcon: '✨' },
  ];
  const coverColors = [
    '#7a9eb8', '#b87a7a', '#7ab87a', '#b8a67a', '#8a7ab8', '#b87aab', '#7ab8b8', '#5a5a5a',
    '#d4a574', '#6b8e6b', '#9b7cb8', '#c4956a', '#5a8a9a', '#a07a5a', '#7a8a5a', '#8a5a7a',
  ];
  const bookIcons = ['📔', '📝', '📓', '📋', '✨', '📖', '📚', '🎯', '💡', '🌟', '🔮', '🎨', '🌿', '☕', '🏔️', '🌊', '🔥', '💎', '🦋', '🌸'];
  const showChapters = newBookType === 'notebook' || newBookType === 'project' || newBookType === 'custom';

  // ─── Computed ───
  const sortedEntries = useMemo(() =>
    [...journalEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [journalEntries]
  );

  const filteredEntries = useMemo(() => {
    let entries = sortedEntries;
    if (filterType !== 'all') entries = entries.filter(e => e.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(e => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q));
    }
    if (selectedDate) entries = entries.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === selectedDate);
    return entries;
  }, [sortedEntries, filterType, searchQuery, selectedDate]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE));
  const pagedEntries = filteredEntries.slice((page - 1) * ENTRIES_PER_PAGE, page * ENTRIES_PER_PAGE);

  const stats = useMemo(() => ({
    total: journalEntries.length,
    journals: journalEntries.filter(e => e.type === 'journal').length,
    notes: journalEntries.filter(e => e.type === 'note').length,
    reminders: journalEntries.filter(e => e.type === 'reminder').length,
  }), [journalEntries]);

  // Mood distribution — respects selectedDate for sync
  const moodStats = useMemo(() => {
    const pool = selectedDate
      ? journalEntries.filter(e => e.mood && format(new Date(e.date), 'yyyy-MM-dd') === selectedDate)
      : journalEntries.filter(e => e.mood && new Date(e.date) >= subDays(new Date(), 30));
    const counts: Record<JournalMood, number> = { great: 0, good: 0, okay: 0, bad: 0, terrible: 0 };
    pool.forEach(e => { if (e.mood) counts[e.mood]++; });
    return { counts, total: pool.length };
  }, [journalEntries, selectedDate]);

  // AI-style mood insight based on mood distribution
  const moodInsight = useMemo(() => {
    if (moodStats.total === 0) return null;
    const { counts, total } = moodStats;
    const positiveRatio = (counts.great + counts.good) / total;
    const negativeRatio = (counts.bad + counts.terrible) / total;
    const greatPct = Math.round((counts.great / total) * 100);
    const goodPct = Math.round((counts.good / total) * 100);

    if (positiveRatio >= 0.7) {
      return {
        emoji: '✨',
        lines: [
          `${greatPct}% of your days felt wonderful — that's amazing!`,
          `You're carrying a beautiful energy this month.`,
          `Keep doing what makes your soul shine. 💛`,
        ],
      };
    } else if (positiveRatio >= 0.5) {
      return {
        emoji: '🌤️',
        lines: [
          `More bright days than cloudy ones — you're doing great!`,
          `${greatPct + goodPct}% positive moods shows real resilience.`,
          `Every good day is proof you've got this. Keep going! 🌱`,
        ],
      };
    } else if (negativeRatio >= 0.5) {
      return {
        emoji: '🤗',
        lines: [
          `Tough stretches don't define you — they refine you.`,
          `You showed up and journaled even on hard days. That's strength.`,
          `Better days are ahead, and you're already building them. 💪`,
        ],
      };
    } else {
      return {
        emoji: '🌊',
        lines: [
          `Life's been a mix of highs and lows — and that's okay.`,
          `Balance means you're feeling everything fully.`,
          `You're growing through every experience. Stay present. 🧘`,
        ],
      };
    }
  }, [moodStats]);

  // Calendar
  const daysInMonth = getDaysInMonth(viewMonth);
  const monthStart = startOfMonth(viewMonth);
  const datesWithEntries = useMemo(() => {
    const set = new Set<string>();
    journalEntries.forEach(e => set.add(format(new Date(e.date), 'yyyy-MM-dd')));
    return set;
  }, [journalEntries]);

  // Active book
  const activeBook = useMemo(
    () => journalBooks.find(b => b.id === activeBookId) || null, [journalBooks, activeBookId]);
  const bookEntries = useMemo(
    () => activeBookId ? journalEntries.filter(e => e.bookId === activeBookId) : [], [journalEntries, activeBookId]);

  // ─── Handlers ───
  const resetForm = () => {
    setFormType('journal'); setFormTitle(''); setFormContent('');
    setFormMood(''); setFormTags(''); setFormBookId(''); setEditingEntry(null);
  };
  const openNewEntry = () => { resetForm(); setEntryFormOpen(true); };
  const openEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry); setFormType(entry.type); setFormTitle(entry.title);
    setFormContent(entry.content); setFormMood(entry.mood || '');
    setFormTags(entry.tags.join(', ')); setFormBookId(entry.bookId); setEntryFormOpen(true);
  };
  const handleSubmitEntry = () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
    const bookId = formBookId || journalBooks[0]?.id || 'book-1';
    if (editingEntry) {
      updateJournalEntry(editingEntry.id, { type: formType, title: formTitle, content: formContent, mood: formMood || undefined, tags, bookId });
    } else {
      addJournalEntry({ userId: 'user-1', bookId, type: formType, title: formTitle, content: formContent, mood: formMood || undefined, tags, date: selectedDate ? new Date(selectedDate) : new Date() });
    }
    setEntryFormOpen(false); resetForm();
  };
  const handleOpenBook = (bookId: string) => { setActiveBookId(bookId); setReaderOpen(true); };
  const handleCloseReader = () => { setReaderOpen(false); setActiveBookId(null); };
  const handleCreateBook = () => {
    if (!newBookName.trim() || !newBookOwner.trim()) return;
    const chapters = showChapters ? newBookChapters.split(',').map(c => c.trim()).filter(Boolean) : [];
    const tags = newBookTags.split(',').map(t => t.trim()).filter(Boolean);
    const selectedIcon = newBookIcon || bookTypePresets.find(p => p.type === newBookType)?.defaultIcon || '📔';
    addJournalBook({ 
      name: newBookName, 
      ownerName: newBookOwner, 
      bookType: newBookType,
      color: newBookColor,
      purpose: newBookPurpose || undefined,
      description: newBookDescription || undefined,
      icon: selectedIcon,
      isPrivate: newBookIsPrivate,
      tags,
      startedAt: new Date(), 
      chapters 
    });
    setCreateBookOpen(false); 
    setNewBookName(''); 
    setNewBookOwner('Ansh');
    setNewBookPurpose('');
    setNewBookDescription('');
    setNewBookChapters('');
    setNewBookType('journal');
    setNewBookColor('#7a9eb8');
    setNewBookIcon('');
    setNewBookIsPrivate(false);
    setNewBookTags('');
    setFormStep(1);
  };
  const handleCalendarDateClick = (dateStr: string) => {
    if (selectedDate === dateStr) {
      setSelectedDate(null); // deselect → remove filter
    } else {
      setSelectedDate(dateStr);
      // auto-adjust filter pills to 'all' so date filter is the primary
      setFilterType('all');
      setSearchQuery('');
    }
  };

  useEffect(() => { setPage(1); }, [filterType, searchQuery, selectedDate]);

  // ═══════════ RENDER ═══════════

  // Full-screen BookReader overlay
  if (readerOpen && activeBook) {
    return (
      <JournalBookView
        book={activeBook}
        onClose={handleCloseReader}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#d9b896] shadow-sm">
            <img src="/book/book theme icon.png" alt="Journal" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-caveat text-4xl font-bold text-[#2d2d2d]">My Journal</h1>
            <p className="font-kalam text-[#5a5a5a] text-lg">Capture your thoughts, ideas, and memories</p>
          </div>
        </div>
        <Button className="journal-btn-primary" onClick={openNewEntry}>
          <Plus className="w-4 h-4 mr-2" /> Write Entry
        </Button>
      </motion.div>

      {/* ═══ Stats ═══ */}
      {/* ═══ Daily Spread (New Hero Section) ═══ */}
      <DailySpread />

      {/* ═══ Stats (Compact) ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Entries', count: stats.total, icon: BookOpen, iconBg: '#f5f0e6', iconBorder: '#d9b896', iconColor: '#a88a5a' },
          { label: 'Books',   count: stats.journals, icon: BookOpen, iconBg: '#e8eef3', iconBorder: '#7a9eb8', iconColor: '#5a7a94' },
          { label: 'Notes',   count: stats.notes, icon: FileText, iconBg: '#e8f0e9', iconBorder: '#8ab896', iconColor: '#5a9468' },
          { label: 'Reminds', count: stats.reminders, icon: Bell, iconBg: '#fef9e6', iconBorder: '#e0d4a0', iconColor: '#a88a5a' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="journal-card py-2 px-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: s.iconBg, border: `1px solid ${s.iconBorder}` }}>
                <Icon className="w-4 h-4" style={{ color: s.iconColor }} />
              </div>
              <div className="min-w-0">
                <p className="font-kalam text-[10px] text-[#8a8a8a] uppercase leading-none mb-0.5">{s.label}</p>
                <p className="font-caveat text-xl leading-none">{s.count}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* ═══ Main Content Grid ═══ */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: Recent Entries (2 cols) ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 journal-page p-5">

          {/* Title + View Toggle */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-caveat text-2xl flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#d9b896]" />
              Recent Entries
              {selectedDate && (
                <Badge className="font-kalam text-xs bg-[#e8eef3] text-[#5a7a94] border border-[#7a9eb8] ml-2">
                  {format(new Date(selectedDate), 'MMM d')}
                  <button onClick={() => setSelectedDate(null)} className="ml-1 hover:text-[#2d2d2d]">×</button>
                </Badge>
              )}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-[#2d2d2d] text-white' : 'text-[#8a8a8a] hover:bg-[#f5f0e6]'}`}>
                <LayoutList className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-[#2d2d2d] text-white' : 'text-[#8a8a8a] hover:bg-[#f5f0e6]'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter pills + Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'journal', 'note', 'reminder'] as const).map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-kalam transition-all ${
                    filterType === t ? 'bg-[#2d2d2d] text-white' : 'bg-[#f5f0e6] text-[#5a5a5a] hover:bg-[#e8e2d4]'
                  }`}>
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a8a]" />
              <Input placeholder="Search entries..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#f9f7f4] border-[#e0e0e0] font-kalam h-8 text-sm" />
            </div>
          </div>

          {/* Results count */}
          <p className="font-kalam text-xs text-[#8a8a8a] mb-3">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} found
            {selectedDate && ` on ${format(new Date(selectedDate), 'MMMM d, yyyy')}`}
          </p>

          {/* ── List View ── */}
          {viewMode === 'list' && (
            <div className="space-y-2 min-h-[280px]">
              <AnimatePresence mode="popLayout">
                {pagedEntries.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center py-12 text-[#8a8a8a]">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="font-kalam">No entries found</p>
                    <Button onClick={openNewEntry} className="journal-btn mt-3">
                      <Plus className="w-4 h-4 mr-1" /> Write your first entry
                    </Button>
                  </motion.div>
                ) : pagedEntries.map((entry, idx) => {
                  const Icon = typeIcons[entry.type] || typeIcons.journal;
                  const colors = typeColors[entry.type] || typeColors.journal;
                  return (
                    <motion.div key={entry.id}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }} transition={{ delay: idx * 0.03 }}
                      className="relative flex items-start gap-3 p-4 rounded-lg bg-white/50 border-b border-[#e0d4a0]/30 hover:bg-[#f5f0e6] transition-all cursor-pointer group shadow-[2px_2px_0px_rgba(0,0,0,0.02)]"
                      onClick={() => setViewingEntry(entry)}>
                      
                      {/* Paper clip or staple decoration for "Linked" entries */}
                      {idx % 3 === 0 && (
                        <div className="absolute -top-1 -left-1 w-6 h-6 rotate-[-15deg] opacity-40">
                          <svg viewBox="0 0 24 24" fill="none" stroke="#a88a5a" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                        </div>
                      )}

                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                        <Icon className="w-5 h-5" style={{ color: colors.text }} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <p className="font-caveat text-xl text-[#2d2d2d] truncate">{entry.title}</p>
                            {entry.mood && <span className="text-sm">{moodConfig[entry.mood].emoji}</span>}
                          </div>
                          <span className="text-[10px] text-[#8a8a8a] font-kalam">{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                        </div>
                        
                        <p className="text-sm text-[#5a5a5a] font-kalam line-clamp-2 leading-relaxed mb-2">{entry.content}</p>
                        
                        <div className="flex items-center gap-3">
                          {entry.tags.map(tag => (
                            <span key={tag} className="text-[10px] text-[#7a9eb8] font-kalam">#{tag}</span>
                          ))}
                          
                          {/* Productivity Links (Placeholders) */}
                          <div className="flex gap-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-[10px] font-kalam text-[#8ab896] hover:underline flex items-center gap-1">
                              <Plus size={10} /> Link Task
                            </button>
                            <button className="text-[10px] font-kalam text-[#7a9eb8] hover:underline flex items-center gap-1">
                              <Sparkles size={10} /> Magic Log
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button className="p-1.5 rounded-full hover:bg-[#e8eef3] text-[#5a5a5a]" onClick={e => { e.stopPropagation(); openEditEntry(entry); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-full hover:bg-[#f5e8e8] text-[#a85a5a]" onClick={e => { e.stopPropagation(); deleteJournalEntry(entry.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* ── Grid View ── */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-h-[280px]">
              <AnimatePresence mode="popLayout">
                {pagedEntries.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="col-span-full text-center py-12 text-[#8a8a8a]">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="font-kalam">No entries found</p>
                  </motion.div>
                ) : pagedEntries.map((entry, idx) => {
                  const Icon = typeIcons[entry.type] || typeIcons.journal;
                  const colors = typeColors[entry.type] || typeColors.journal;
                  return (
                    <motion.div key={entry.id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.03 }}
                      className="p-4 rounded-xl bg-[#f9f7f4] hover:bg-[#f5f0e6] border border-[#e0e0e0] hover:border-[#d9b896] transition-all cursor-pointer group hover:shadow-sm"
                      onClick={() => setViewingEntry(entry)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: colors.text }} />
                        </div>
                        {entry.mood && <span className="text-lg">{moodConfig[entry.mood].emoji}</span>}
                      </div>
                      <h4 className="font-kalam font-bold text-sm text-[#2d2d2d] mb-1 line-clamp-1">{entry.title}</h4>
                      <p className="text-xs text-[#8a8a8a] font-kalam line-clamp-3 mb-2 leading-relaxed">{entry.content}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[10px] text-[#8a8a8a] font-kalam">{format(new Date(entry.date), 'MMM d')}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 rounded hover:bg-[#e8eef3]" onClick={e => { e.stopPropagation(); openEditEntry(entry); }}>
                            <Pencil className="w-3 h-3 text-[#5a5a5a]" />
                          </button>
                          <button className="p-1 rounded hover:bg-[#f5e8e8]" onClick={e => { e.stopPropagation(); deleteJournalEntry(entry.id); }}>
                            <Trash2 className="w-3 h-3 text-[#a85a5a]" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-[#e0e0e0]">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded hover:bg-[#f5f0e6] disabled:opacity-30 text-[#5a5a5a]">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-full text-xs font-kalam transition-all ${
                    page === p ? 'bg-[#2d2d2d] text-white' : 'text-[#5a5a5a] hover:bg-[#f5f0e6]'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-[#f5f0e6] disabled:opacity-30 text-[#5a5a5a]">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Right Column ── */}
        <div className="space-y-6">

          {/* ── Mini Calendar ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="journal-page p-5">
            <h2 className="font-caveat text-xl flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-[#7a9eb8]" /> Calendar
            </h2>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                className="p-1 rounded hover:bg-[#f5f0e6] text-[#5a5a5a]"><ChevronLeft className="w-4 h-4" /></button>
              <span className="font-kalam text-sm font-bold text-[#2d2d2d]">{format(viewMonth, 'MMMM yyyy')}</span>
              <button onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                className="p-1 rounded hover:bg-[#f5f0e6] text-[#5a5a5a]"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-[10px] text-[#8a8a8a] font-kalam font-bold py-1">{d}</div>
              ))}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = format(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day), 'yyyy-MM-dd');
                const hasEntry = datesWithEntries.has(dateStr);
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                return (
                  <button key={day} onClick={() => handleCalendarDateClick(dateStr)}
                    className={`text-xs py-1.5 rounded-lg transition-all font-kalam relative ${
                      isSelected ? 'bg-[#2d2d2d] text-white font-bold' :
                      isToday ? 'ring-1 ring-[#7a9eb8] text-[#2d2d2d] font-bold' :
                      hasEntry ? 'bg-[#e8eef3] text-[#2d2d2d] font-semibold' :
                      'text-[#8a8a8a] hover:bg-[#f5f0e6]'
                    }`}>
                    {day}
                    {hasEntry && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#7a9eb8]" />
                    )}
                  </button>
                );
              })}
            </div>
            {selectedDate && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t border-[#e0e0e0]">
                <div className="flex items-center justify-between">
                  <span className="font-kalam text-sm text-[#2d2d2d] font-bold">
                    {format(new Date(selectedDate), 'MMMM d, yyyy')}
                  </span>
                  <button onClick={() => setSelectedDate(null)} className="text-xs text-[#7a9eb8] font-kalam hover:underline">
                    Clear filter
                  </button>
                </div>
                <p className="text-xs text-[#8a8a8a] font-kalam mt-1">
                  Showing {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* ── Mood Tracker ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="journal-page p-5">
            <h2 className="font-caveat text-xl flex items-center gap-2 mb-1">
              <Smile className="w-5 h-5 text-[#d9b896]" /> How You've Felt
            </h2>
            <p className="font-kalam text-[10px] text-[#8a8a8a] mb-4">
              {selectedDate ? `On ${format(new Date(selectedDate), 'MMM d')}` : 'Last 30 days'}
            </p>

            {moodStats.total === 0 ? (
              <div className="text-center py-6">
                <div className="font-caveat text-5xl mb-2 opacity-30">🌱</div>
                <p className="font-kalam text-xs text-[#8a8a8a]">No mood data yet</p>
                <p className="font-kalam text-[10px] text-[#b0b0b0]">Add moods when writing entries!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(Object.keys(moodConfig) as JournalMood[]).map((mood, i) => {
                  const cfg = moodConfig[mood];
                  const count = moodStats.counts[mood];
                  const pct = moodStats.total > 0 ? (count / moodStats.total) * 100 : 0;
                  return (
                    <motion.div key={mood} initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                      className="flex items-center gap-3">
                      {/* Handwritten emoji */}
                      <div className="flex flex-col items-center w-12 flex-shrink-0">
                        <span className="text-2xl leading-none">{cfg.emoji}</span>
                      </div>
                      {/* Bar */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-caveat text-sm" style={{ color: cfg.color }}>{cfg.handwritten}</span>
                          <span className="font-kalam text-xs text-[#5a5a5a]">{count}</span>
                        </div>
                        <div className="h-3 bg-[#f5f0e6] rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.6 + i * 0.1 }}
                            className="h-full rounded-full relative"
                            style={{ backgroundColor: cfg.color }}>
                            {pct > 15 && (
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-white font-bold">
                                {Math.round(pct)}%
                              </span>
                            )}
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {/* Total footer */}
                <div className="pt-2 mt-1 border-t border-[#e0e0e0] flex items-center justify-between">
                  <span className="font-kalam text-xs text-[#8a8a8a]">Total mood entries</span>
                  <span className="font-caveat text-lg text-[#2d2d2d]">{moodStats.total}</span>
                </div>

                {/* AI-style motivational insight */}
                {moodInsight && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className="mt-4 p-4 rounded-2xl relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #fdf6ee 0%, #fef3e2 50%, #fdf0f5 100%)' }}>
                    {/* Decorative sparkle */}
                    <div className="absolute top-2 right-3 opacity-40">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg flex-shrink-0 mt-0.5">{moodInsight.emoji}</span>
                      <div className="space-y-0.5">
                        {moodInsight.lines.map((line, i) => (
                          <motion.p
                            key={i}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.4 + i * 0.15 }}
                            className={`font-kalam text-xs leading-relaxed ${
                              i === 0 ? 'text-[#5a4a3a] font-medium' : 'text-[#7a6a5a]'
                            }`}>
                            {line}
                          </motion.p>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="font-caveat text-[10px] text-[#b0a090] italic">~ your journal companion</span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ═══ My Bookshelf ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="journal-page p-8 mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-caveat text-3xl flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-[#7a9eb8]" /> The Archive
            </h2>
            <p className="font-kalam text-xs text-[#8a8a8a] mt-1">Your collection of physical journals and notes</p>
          </div>
          <Button className="journal-btn px-6" onClick={() => setCreateBookOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Commission New Book
          </Button>
        </div>
        
        <Bookshelf 
          books={journalBooks}
          onOpenBook={handleOpenBook}
          onDeleteBook={deleteJournalBook}
          onNewBook={() => setCreateBookOpen(true)}
          entryCountGetter={(id) => journalEntries.filter(e => e.bookId === id).length}
        />
      </motion.div>

      {/* ═══ MODALS ═══ */}

      {/* Entry Form */}
      <Dialog open={entryFormOpen} onOpenChange={setEntryFormOpen}>
        <DialogContent className="journal-modal max-w-md">
          <DialogHeader>
            <DialogTitle className="font-caveat text-2xl">{editingEntry ? 'Edit Entry' : 'New Entry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={formType} onValueChange={(v) => setFormType(v as JournalEntryType)}>
              <SelectTrigger className="bg-[#f9f7f4] border-[#e0e0e0] font-kalam"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="journal">📖 Journal</SelectItem>
                <SelectItem value="note">📝 Note</SelectItem>
                <SelectItem value="reminder">🔔 Reminder</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Title" value={formTitle} onChange={e => setFormTitle(e.target.value)}
              className="bg-[#f9f7f4] border-[#e0e0e0] font-kalam" />
            <textarea placeholder="Write here..." value={formContent} onChange={e => setFormContent(e.target.value)}
              className="w-full h-32 bg-[#f9f7f4] border border-[#e0e0e0] rounded-md p-3 text-sm font-kalam resize-none outline-none focus:border-[#7a9eb8]" />
            {/* Mood picker — handwritten style */}
            <div>
              <span className="font-kalam text-xs text-[#5a5a5a] mb-1.5 block">How are you feeling?</span>
              <div className="flex gap-1.5">
                {(Object.keys(moodConfig) as JournalMood[]).map(m => {
                  const cfg = moodConfig[m];
                  const isActive = formMood === m;
                  return (
                    <button key={m} onClick={() => setFormMood(formMood === m ? '' : m)}
                      className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all flex-1 ${
                        isActive ? 'scale-105 shadow-sm outline outline-2' : 'opacity-50 hover:opacity-80 hover:bg-[#f5f0e6]'
                      }`}
                      style={isActive ? { backgroundColor: `${cfg.color}18`, outlineColor: cfg.color } : {}}>
                      <span className="text-xl">{cfg.emoji}</span>
                      <span className="font-caveat text-[10px]" style={{ color: isActive ? cfg.color : '#8a8a8a' }}>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {journalBooks.length > 0 && (
              <Select value={formBookId || journalBooks[0]?.id} onValueChange={setFormBookId}>
                <SelectTrigger className="bg-[#f9f7f4] border-[#e0e0e0] font-kalam"><SelectValue placeholder="Select book" /></SelectTrigger>
                <SelectContent>{journalBooks.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <Input placeholder="Tags (comma separated)" value={formTags} onChange={e => setFormTags(e.target.value)}
              className="bg-[#f9f7f4] border-[#e0e0e0] font-kalam" />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setEntryFormOpen(false); resetForm(); }} className="font-kalam">Cancel</Button>
              <Button className="journal-btn-primary" onClick={handleSubmitEntry} disabled={!formTitle.trim() || !formContent.trim()}>
                {editingEntry ? 'Update' : 'Save Entry'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entry Detail (Enhanced & Linked) */}
      <Dialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-2xl overflow-visible">
          {viewingEntry && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="relative bg-[#fdfbf7] p-10 md:p-14 shadow-[20px_20px_60px_rgba(0,0,0,0.2)] overflow-visible min-h-[500px] flex flex-col"
              style={{ 
                backgroundImage: 'url("https://www.transparenttextures.com/patterns/parchment.png")',
                clipPath: 'polygon(2% 0%, 98% 1%, 100% 2%, 100% 98%, 98% 100%, 2% 99%, 0% 98%, 0% 2%)' 
              }}
            >
              {/* Paper Texture Overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

              {/* Header */}
              <div className="relative mb-8 border-b border-dashed border-[#d9b896] pb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-kalam text-xs text-[#8a8a8a] uppercase tracking-tighter">
                      {format(new Date(viewingEntry.date), 'EEEE · MMMM do, yyyy')}
                    </span>
                    {viewingEntry.mood && (
                      <span className="px-2 py-0.5 rounded-full bg-[#f5f0e6] border border-[#d9b896] font-caveat text-xs">
                        Feeling {moodConfig[viewingEntry.mood].label} {moodConfig[viewingEntry.mood].emoji}
                      </span>
                    )}
                  </div>
                  <h2 className="font-caveat text-4xl text-[#2d2d2d] leading-none">{viewingEntry.title}</h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { openEditEntry(viewingEntry); setViewingEntry(null); }} className="p-2 rounded-full hover:bg-black/5 text-[#5a5a5a] transition-colors">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => setViewingEntry(null)} className="p-2 rounded-full hover:bg-black/5 text-[#5a5a5a] transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="relative flex-1 font-kalam text-lg text-[#4a4a4a] leading-relaxed whitespace-pre-wrap mb-10 overflow-y-auto max-h-[40vh] pr-4 custom-pencil-scrollbar">
                {viewingEntry.content}
              </div>

              {/* Footer / Linking Section */}
              <div className="relative mt-auto pt-6 border-t border-dashed border-[#d9b896]">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={16} className="text-[#a88a5a]" />
                  <span className="font-caveat text-xl text-[#a88a5a]">Magic Links</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-lg border border-dashed border-[#d9b896] bg-[#fdfbf7]/50 flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#8ab896]/10 flex items-center justify-center">
                        <Plus size={14} className="text-[#8ab896]" />
                      </div>
                      <div>
                        <p className="font-kalam text-xs font-bold text-[#5a5a5a]">Transform to Task</p>
                        <p className="font-kalam text-[9px] text-[#8a8a8a]">Convert this reflection into action</p>
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-[#8a8a8a] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} className="p-3 rounded-lg border border-dashed border-[#d9b896] bg-[#fdfbf7]/50 flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#7a9eb8]/10 flex items-center justify-center">
                        <Tag size={14} className="text-[#7a9eb8]" />
                      </div>
                      <div>
                        <p className="font-kalam text-xs font-bold text-[#5a5a5a]">Relate to Goal</p>
                        <p className="font-kalam text-[9px] text-[#8a8a8a]">Link this to your quarterly milestones</p>
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-[#8a8a8a] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {viewingEntry.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-[#2d2d2d] text-white font-kalam text-[10px]">#{tag}</span>
                  ))}
                  <button className="px-3 py-1 rounded-full border border-[#d9b896] text-[#a88a5a] font-kalam text-[10px] hover:bg-[#f5f0e6] transition-colors">
                    Add Tag +
                  </button>
                </div>
              </div>

              {/* Visual Decorations */}
              <div className="absolute -top-4 -right-4 w-16 h-16 opacity-40 rotate-12">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 50 Q 50 10 90 50" stroke="#a88a5a" strokeWidth="2" strokeDasharray="4 4"/>
                  <path d="M10 60 Q 50 20 90 60" stroke="#a88a5a" strokeWidth="2" strokeDasharray="4 4"/>
                </svg>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Book — Enhanced Multi-Step Form */}
      <Dialog open={createBookOpen} onOpenChange={(open) => { setCreateBookOpen(open); if (!open) setFormStep(1); }}>
        <DialogContent className="journal-modal max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-caveat text-2xl flex items-center gap-2">
              {formStep === 1 ? '📖 Create New Book' : '🎨 Customize Your Book'}
            </DialogTitle>
            <p className="font-kalam text-xs text-[#888] mt-1">
              {formStep === 1 ? 'Choose a type and fill in the basics' : 'Make it uniquely yours'}
            </p>
            {/* Step Indicator */}
            <div className="flex items-center gap-2 mt-3">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${formStep >= 1 ? 'bg-[#7a9eb8]' : 'bg-[#e0e0e0]'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${formStep >= 2 ? 'bg-[#7a9eb8]' : 'bg-[#e0e0e0]'}`} />
            </div>
          </DialogHeader>

          {formStep === 1 ? (
            /* ─── STEP 1: Essentials ─── */
            <div className="space-y-4">
              {/* Book Type Selector */}
              <div>
                <label className="font-kalam text-xs text-[#5a5a5a] mb-2 block">Book Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {bookTypePresets.map(preset => (
                    <button
                      key={preset.type}
                      onClick={() => { setNewBookType(preset.type); if (!newBookIcon) setNewBookIcon(preset.defaultIcon); }}
                      className={`p-2.5 rounded-lg border-2 text-center transition-all cursor-pointer ${
                        newBookType === preset.type
                          ? 'border-[#7a9eb8] bg-[#7a9eb8]/10 shadow-sm'
                          : 'border-[#e0e0e0] bg-[#f9f7f4] hover:border-[#c0c0c0]'
                      }`}
                    >
                      <span className="text-xl block">{preset.icon}</span>
                      <span className="font-kalam text-xs font-semibold block mt-1">{preset.label}</span>
                      <span className="font-kalam text-[10px] text-[#888] block leading-tight">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Book Name */}
              <div>
                <label className="font-kalam text-xs text-[#5a5a5a] mb-1 block">Book Name *</label>
                <Input placeholder={newBookType === 'daily-log' ? 'e.g. Feb 2026 Log' : newBookType === 'project' ? 'e.g. Life OS Project' : 'e.g. My Journal'}
                  value={newBookName} onChange={e => setNewBookName(e.target.value)}
                  className="bg-[#f9f7f4] border-[#e0e0e0] font-kalam" />
              </div>

              {/* Owner Name */}
              <div>
                <label className="font-kalam text-xs text-[#5a5a5a] mb-1 block">Owner Name *</label>
                <Input placeholder="Your Name" value={newBookOwner} onChange={e => setNewBookOwner(e.target.value)}
                  className="bg-[#f9f7f4] border-[#e0e0e0] font-kalam" />
              </div>

              {/* Purpose */}
              <div>
                <label className="font-kalam text-xs text-[#5a5a5a] mb-1 block">Purpose (Optional)</label>
                <textarea placeholder="What is this book for?" value={newBookPurpose} onChange={e => setNewBookPurpose(e.target.value)}
                  className="w-full h-16 bg-[#f9f7f4] border border-[#e0e0e0] rounded-md p-3 text-sm font-kalam resize-none outline-none focus:border-[#7a9eb8]" />
              </div>

              {/* Step 1 Actions */}
              <div className="flex justify-between gap-2 pt-1">
                <Button variant="outline" onClick={() => { setCreateBookOpen(false); setFormStep(1); }} className="font-kalam text-sm">Cancel</Button>
                <div className="flex gap-2">
                  <Button
                    className="text-sm px-6 font-kalam text-white transition-all"
                    style={{ backgroundColor: newBookColor }}
                    onClick={handleCreateBook}
                    disabled={!newBookName.trim() || !newBookOwner.trim()}
                  >
                    Quick Create
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm px-4 font-kalam border-[#7a9eb8] text-[#7a9eb8]"
                    onClick={() => setFormStep(2)}
                    disabled={!newBookName.trim() || !newBookOwner.trim()}
                  >
                    Customize →
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* ─── STEP 2: Customization ─── */
            <div className="space-y-4">
              {/* Live Preview */}
              <div className="p-3 rounded-xl border-2 border-dashed border-[#e0e0e0] bg-[#faf8f5]">
                <p className="font-kalam text-[10px] text-[#aaa] mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shadow-sm border"
                    style={{ backgroundColor: newBookColor + '22', borderColor: newBookColor }}
                  >
                    {newBookIcon || bookTypePresets.find(p => p.type === newBookType)?.defaultIcon || '📔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-caveat text-lg leading-tight truncate">{newBookName || 'Untitled Book'}</p>
                    <p className="font-kalam text-xs text-[#888]">by {newBookOwner} · {bookTypePresets.find(p => p.type === newBookType)?.label}</p>
                    {newBookTags && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {newBookTags.split(',').filter(Boolean).slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-1.5 py-0.5 text-[10px] font-kalam rounded-full bg-[#e8eef3] text-[#5a7a94]">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {newBookIsPrivate && <span className="text-lg" title="Private">🔒</span>}
                </div>
              </div>

              {/* Book Icon Picker */}
              <div>
                <label className="font-kalam text-xs text-[#5a5a5a] mb-2 block">Book Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {bookIcons.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNewBookIcon(icon)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer border-2 ${
                        (newBookIcon || bookTypePresets.find(p => p.type === newBookType)?.defaultIcon) === icon 
                          ? 'border-[#7a9eb8] bg-[#7a9eb8]/10 scale-110 shadow-sm' 
                          : 'border-[#e0e0e0] bg-[#f9f7f4] hover:border-[#c0c0c0] hover:scale-105'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Color — expanded palette */}
              <div>
                <label className="font-kalam text-xs text-[#5a5a5a] mb-2 block">Cover Color</label>
                <div className="flex flex-wrap gap-2">
                  {coverColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewBookColor(color)}
                      className={`w-7 h-7 rounded-full transition-all cursor-pointer border-2 ${
                        newBookColor === color ? 'border-[#333] scale-110 shadow-md' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-kalam text-xs text-[#5a5a5a] mb-1 block">Description (Optional)</label>
                <textarea placeholder="A brief description of this book..." value={newBookDescription} onChange={e => setNewBookDescription(e.target.value)}
                  className="w-full h-14 bg-[#f9f7f4] border border-[#e0e0e0] rounded-md p-3 text-sm font-kalam resize-none outline-none focus:border-[#7a9eb8]" />
              </div>

              {/* Tags */}
              <div>
                <label className="font-kalam text-xs text-[#5a5a5a] mb-1 block">Tags (Optional)</label>
                <Input placeholder="e.g. personal, growth, 2026" value={newBookTags} onChange={e => setNewBookTags(e.target.value)}
                  className="bg-[#f9f7f4] border-[#e0e0e0] font-kalam" />
                <p className="font-kalam text-[10px] text-[#aaa] mt-1">Comma separated — helps with search & filters</p>
              </div>

              {/* Chapters — conditional */}
              {showChapters && (
                <div>
                  <label className="font-kalam text-xs text-[#5a5a5a] mb-1 block">
                    {newBookType === 'project' ? 'Phases (comma separated)' : 'Sections (comma separated)'}
                  </label>
                  <Input
                    placeholder={newBookType === 'project' ? 'e.g. Planning, Development, Testing' : 'e.g. Ideas, Notes, References'}
                    value={newBookChapters} onChange={e => setNewBookChapters(e.target.value)}
                    className="bg-[#f9f7f4] border-[#e0e0e0] font-kalam" />
                  <p className="font-kalam text-[10px] text-[#aaa] mt-1">Optional — you can always add more later</p>
                </div>
              )}

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between p-3 bg-[#f9f7f4] rounded-lg border border-[#e0e0e0]">
                <div>
                  <p className="font-kalam text-sm font-semibold">Private Book</p>
                  <p className="font-kalam text-[10px] text-[#888]">Only visible to you, hidden from shared views</p>
                </div>
                <button
                  onClick={() => setNewBookIsPrivate(!newBookIsPrivate)}
                  className={`w-11 h-6 rounded-full transition-all relative ${
                    newBookIsPrivate ? 'bg-[#7a9eb8]' : 'bg-[#d0d0d0]'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${
                    newBookIsPrivate ? 'left-[22px]' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Step 2 Actions */}
              <div className="flex justify-between gap-2 pt-1">
                <Button variant="outline" onClick={() => setFormStep(1)} className="font-kalam text-sm">← Back</Button>
                <Button
                  className="text-sm px-8 font-kalam text-white transition-all"
                  style={{ backgroundColor: newBookColor }}
                  onClick={handleCreateBook}
                  disabled={!newBookName.trim() || !newBookOwner.trim()}
                >
                  ✨ Create Book
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
