"use client";

import { useState, useMemo, useRef, useCallback, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HTMLFlipBook from 'react-pageflip';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Pencil, Trash2,
  BookOpen, FileText, Bell, Smile,
} from 'lucide-react';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type { JournalBook, JournalEntry, JournalEntryType, JournalMood } from '@/types';

// ---------- page wrapper (forwardRef required by react-pageflip) ----------
const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode; bgImage: string; className?: string }>(
  ({ children, bgImage, className = '' }, ref) => (
    <div ref={ref} className={`book-page ${className}`} style={{ background: `url(${bgImage}) center/cover no-repeat` }}>
      <div className="book-page-content">
        {children}
      </div>
    </div>
  )
);
BookPage.displayName = 'BookPage';

// ---------- mood helpers ----------
const moodEmojis: Record<JournalMood, string> = {
  great: '😄', good: '🙂', okay: '😐', bad: '😞', terrible: '😢',
};
const moodLabels: Record<JournalMood, string> = {
  great: 'Great', good: 'Good', okay: 'Okay', bad: 'Bad', terrible: 'Terrible',
};

// ---------- types ----------
interface BookReaderProps {
  book: JournalBook;
  entries: JournalEntry[];
  onBack: () => void;
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  onDeleteEntry: (id: string) => void;
}

// ========================= MAIN COMPONENT =========================
export function BookReader({ book, entries, onBack, onAddEntry, onUpdateEntry, onDeleteEntry }: BookReaderProps) {
  const flipBookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  // form states
  const [formType, setFormType] = useState<JournalEntryType>('journal');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMood, setFormMood] = useState<JournalMood | ''>('');
  const [formChapter, setFormChapter] = useState('');
  const [formTags, setFormTags] = useState('');

  // entries sorted
  const sortedEntries = useMemo(() =>
    [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [entries]
  );

  // entries for selected date
  const dayEntries = useMemo(() => {
    if (!selectedDate) return [];
    return sortedEntries.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === selectedDate);
  }, [sortedEntries, selectedDate]);

  // calendar month data
  const daysInMonth = getDaysInMonth(viewMonth);
  const monthStart = startOfMonth(viewMonth);

  const datesWithEntries = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => set.add(format(new Date(e.date), 'yyyy-MM-dd')));
    return set;
  }, [entries]);

  // handlers
  const resetForm = () => {
    setFormType('journal'); setFormTitle(''); setFormContent('');
    setFormMood(''); setFormChapter(''); setFormTags('');
    setEditingEntry(null);
  };

  const openNewEntry = () => {
    resetForm();
    setEntryFormOpen(true);
  };

  const openEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormType(entry.type);
    setFormTitle(entry.title);
    setFormContent(entry.content);
    setFormMood(entry.mood || '');
    setFormChapter(entry.chapter || '');
    setFormTags(entry.tags.join(', '));
    setEntryFormOpen(true);
  };

  const handleSubmitEntry = () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
    if (editingEntry) {
      onUpdateEntry(editingEntry.id, {
        type: formType, title: formTitle, content: formContent,
        mood: formMood || undefined, chapter: formChapter || undefined, tags,
      });
    } else {
      onAddEntry({
        userId: 'user-1', bookId: book.id, type: formType,
        title: formTitle, content: formContent,
        mood: formMood || undefined, chapter: formChapter || undefined,
        tags, date: selectedDate ? new Date(selectedDate) : new Date(),
      });
    }
    setEntryFormOpen(false);
    resetForm();
  };

  const handleFlip = useCallback((e: any) => {
    setCurrentPage(e.data);
  }, []);

  const goNext = () => flipBookRef.current?.pageFlip()?.flipNext();
  const goPrev = () => flipBookRef.current?.pageFlip()?.flipPrev();

  // ============================== RENDER ==============================
  return (
    <div className="relative min-h-[80vh] rounded-2xl overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center hidden md:block" style={{ backgroundImage: 'url(/book/Desk.png)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 md:hidden" />
      <div className="absolute inset-0 bg-black/10" />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-amber-200/90 hover:text-amber-100 transition-colors bg-black/30 backdrop-blur-sm rounded-full px-4 py-2"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Close Book</span>
        </motion.button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-amber-900/60 border-amber-700/50 text-amber-200 hover:bg-amber-800/70"
            onClick={openNewEntry}
          >
            <Plus className="w-4 h-4 mr-1" />
            Write
          </Button>
        </div>
      </div>

      {/* Book flip area */}
      <div className="relative z-10 flex items-center justify-center py-4 px-4">
        {/* Prev button */}
        <button
          className="hidden md:flex absolute left-4 z-30 items-center justify-center w-10 h-10 rounded-full bg-black/30 text-amber-200 hover:bg-black/50 transition-colors backdrop-blur-sm"
          onClick={goPrev}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* FlipBook */}
        <div className="flip-book-container">
          {/* @ts-ignore - react-pageflip types */}
          <HTMLFlipBook
            ref={flipBookRef}
            width={550}
            height={400}
            size="stretch"
            minWidth={280}
            maxWidth={1100}
            minHeight={350}
            maxHeight={800}
            showCover={false}
            mobileScrollSupport={true}
            onFlip={handleFlip}
            className="book-flip"
            style={{}}
            startPage={0}
            drawShadow={true}
            flippingTime={600}
            usePortrait={false}
            startZIndex={0}
            autoSize={true}
            maxShadowOpacity={0.5}
            showPageCorners={true}
            disableFlipByClick={false}
            useMouseEvents={true}
            swipeDistance={30}
            clickEventForward={true}
          >
            {/* PAGE 1: Days / Calendar */}
            <BookPage bgImage="/book/Days.png">
              <div className="h-full flex">
                {/* Left page — chapter list */}
                <div className="w-1/2 p-6 flex flex-col">
                  <h3 className="text-amber-900/80 text-base font-bold mb-4" style={{ fontFamily: "'Georgia', serif" }}>
                    {book.name}
                  </h3>
                  <div className="text-xs text-amber-800/60 mb-4 italic">{book.purpose}</div>
                  <div className="text-xs text-amber-900/70 font-semibold mb-2">Chapters</div>
                  {book.chapters.map((ch, i) => (
                    <div key={i} className="text-xs text-amber-800/70 py-1 border-b border-amber-800/10 last:border-0">
                      {i + 1}. {ch}
                    </div>
                  ))}
                  <div className="mt-auto text-xs text-amber-800/40">
                    {entries.length} entries
                  </div>
                </div>
                {/* Right page — calendar */}
                <div className="w-1/2 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))} className="text-amber-800/60 hover:text-amber-900 text-sm">‹</button>
                    <span className="text-sm font-bold text-amber-900/80">{format(viewMonth, 'MMMM yyyy')}</span>
                    <button onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))} className="text-amber-800/60 hover:text-amber-900 text-sm">›</button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} className="text-[10px] text-amber-800/50 font-semibold py-1">{d}</div>
                    ))}
                    {/* Empty cells for first day offset */}
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                      <div key={`e-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = format(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day), 'yyyy-MM-dd');
                      const hasEntry = datesWithEntries.has(dateStr);
                      const isSelected = selectedDate === dateStr;
                      const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                      return (
                        <button
                          key={day}
                          onClick={() => { setSelectedDate(isSelected ? null : dateStr); }}
                          className={`text-[11px] py-1 rounded transition-all ${
                            isSelected ? 'bg-amber-800 text-amber-100 font-bold' :
                            isToday ? 'ring-1 ring-amber-700/50 text-amber-900 font-semibold' :
                            hasEntry ? 'text-amber-900 font-semibold bg-amber-200/30' :
                            'text-amber-800/50 hover:bg-amber-200/20'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </BookPage>

            {/* PAGE 2: Daily Log / selected date entries */}
            <BookPage bgImage="/book/DailyLogs.png">
              <div className="h-full flex">
                {/* Left page — date info */}
                <div className="w-1/2 p-6 flex flex-col">
                  <h3 className="text-amber-900/80 text-base font-bold mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                    {selectedDate ? format(new Date(selectedDate), 'EEEE') : 'Select a Day'}
                  </h3>
                  <p className="text-sm text-amber-800/60 mb-4">
                    {selectedDate ? format(new Date(selectedDate), 'MMMM d, yyyy') : 'Tap a date on the calendar page'}
                  </p>
                  {dayEntries.length > 0 ? (
                    <div className="space-y-2 overflow-y-auto flex-1">
                      {dayEntries.map(entry => (
                        <div
                          key={entry.id}
                          className="p-2 rounded bg-amber-100/20 cursor-pointer hover:bg-amber-100/40 transition-colors"
                          onClick={() => setViewingEntry(entry)}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {entry.type === 'journal' ? <BookOpen className="w-3 h-3 text-amber-800/60" /> :
                             entry.type === 'note' ? <FileText className="w-3 h-3 text-blue-800/60" /> :
                             <Bell className="w-3 h-3 text-orange-800/60" />}
                            <span className="text-xs font-semibold text-amber-900/80 truncate">{entry.title}</span>
                          </div>
                          <p className="text-[10px] text-amber-800/50 line-clamp-2">{entry.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : selectedDate ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <p className="text-xs text-amber-800/50 mb-2">No entries for this day</p>
                      <Button
                        variant="outline" size="sm"
                        className="bg-amber-100/30 border-amber-700/30 text-amber-800 text-xs"
                        onClick={openNewEntry}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Write something
                      </Button>
                    </div>
                  ) : null}
                </div>
                {/* Right page — writing area */}
                <div className="w-1/2 p-6 flex flex-col">
                  <div className="text-xs text-amber-800/40 mb-3" style={{ fontFamily: "'Georgia', serif" }}>Quick Write</div>
                  <div className="flex-1 flex flex-col gap-2">
                    <Input
                      placeholder="Title..."
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      className="bg-transparent border-amber-800/20 text-amber-900 text-xs placeholder:text-amber-800/30"
                    />
                    <textarea
                      placeholder="Start writing your thoughts..."
                      value={formContent}
                      onChange={e => setFormContent(e.target.value)}
                      className="flex-1 bg-transparent border border-amber-800/20 rounded-md p-2 text-amber-900 text-xs placeholder:text-amber-800/30 resize-none outline-none focus:border-amber-700/40"
                      style={{ lineHeight: '1.8em' }}
                    />
                    <div className="flex gap-1">
                      {(Object.keys(moodEmojis) as JournalMood[]).map(m => (
                        <button
                          key={m}
                          onClick={() => setFormMood(formMood === m ? '' : m)}
                          className={`text-sm p-1 rounded transition-colors ${formMood === m ? 'bg-amber-200/50 scale-110' : 'opacity-50 hover:opacity-100'}`}
                          title={moodLabels[m]}
                        >
                          {moodEmojis[m]}
                        </button>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      className="bg-amber-800 text-amber-100 hover:bg-amber-700 text-xs"
                      onClick={() => {
                        if (formTitle.trim() && formContent.trim()) {
                          onAddEntry({
                            userId: 'user-1', bookId: book.id, type: 'journal',
                            title: formTitle, content: formContent,
                            mood: formMood || undefined, tags: [],
                            date: selectedDate ? new Date(selectedDate) : new Date(),
                          });
                          setFormTitle(''); setFormContent(''); setFormMood('');
                        }
                      }}
                      disabled={!formTitle.trim() || !formContent.trim()}
                    >
                      Save Entry
                    </Button>
                  </div>
                </div>
              </div>
            </BookPage>

            {/* PAGE 3: Heading — stats/overview */}
            <BookPage bgImage="/book/Heading.png">
              <div className="h-full flex">
                {/* Left page — blank heading page */}
                <div className="w-1/2 p-6 flex flex-col items-center justify-center text-center">
                  <h3 className="text-lg font-bold text-amber-900/80 mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                    {book.name}
                  </h3>
                  <div className="w-16 h-px bg-amber-700/30 my-2" />
                  <p className="text-xs text-amber-800/50 italic">A collection of thoughts, ideas, and memories</p>
                </div>
                {/* Right page — stats */}
                <div className="w-1/2 p-6">
                  <h4 className="text-sm font-bold text-amber-900/70 mb-4" style={{ fontFamily: "'Georgia', serif" }}>Overview</h4>
                  <div className="space-y-3 text-xs text-amber-800/70">
                    <div className="flex justify-between border-b border-amber-800/10 pb-2">
                      <span>Total Entries</span>
                      <span className="font-bold text-amber-900">{entries.length}</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-800/10 pb-2">
                      <span>Journal Entries</span>
                      <span className="font-bold text-amber-900">{entries.filter(e => e.type === 'journal').length}</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-800/10 pb-2">
                      <span>Notes</span>
                      <span className="font-bold text-amber-900">{entries.filter(e => e.type === 'note').length}</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-800/10 pb-2">
                      <span>Reminders</span>
                      <span className="font-bold text-amber-900">{entries.filter(e => e.type === 'reminder').length}</span>
                    </div>
                    <div className="flex justify-between border-b border-amber-800/10 pb-2">
                      <span>Chapters</span>
                      <span className="font-bold text-amber-900">{book.chapters.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </BookPage>

            {/* Dynamic pages for each entry (latest first) */}
            {sortedEntries.slice(0, 20).map((entry, i) => (
              <BookPage key={entry.id} bgImage="/book/DailyLogs.png">
                <div className="h-full flex">
                  {/* Left — entry meta */}
                  <div className="w-1/2 p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      {entry.type === 'journal' ? <BookOpen className="w-4 h-4 text-amber-800/60" /> :
                       entry.type === 'note' ? <FileText className="w-4 h-4 text-blue-800/60" /> :
                       <Bell className="w-4 h-4 text-orange-800/60" />}
                      <span className="text-xs text-amber-800/50 uppercase tracking-wider">{entry.type}</span>
                    </div>
                    <h3 className="text-base font-bold text-amber-900/80 mb-1" style={{ fontFamily: "'Georgia', serif" }}>
                      {entry.title}
                    </h3>
                    <p className="text-xs text-amber-800/50 mb-4">{format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}</p>
                    {entry.mood && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-lg">{moodEmojis[entry.mood]}</span>
                        <span className="text-xs text-amber-800/60">Feeling {moodLabels[entry.mood]}</span>
                      </div>
                    )}
                    {entry.chapter && (
                      <div className="text-xs text-amber-800/50">
                        Chapter: <span className="font-semibold">{entry.chapter}</span>
                      </div>
                    )}
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {entry.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-amber-200/30 text-amber-900/60 px-1.5 py-0.5 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto flex gap-1">
                      <button
                        className="text-xs text-amber-800/50 hover:text-amber-900 p-1 rounded hover:bg-amber-100/30"
                        onClick={() => openEditEntry(entry)}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        className="text-xs text-red-800/50 hover:text-red-900 p-1 rounded hover:bg-red-100/30"
                        onClick={() => onDeleteEntry(entry.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {/* Right — entry content */}
                  <div className="w-1/2 p-6 overflow-y-auto">
                    <div className="text-xs text-amber-900/70 whitespace-pre-wrap leading-relaxed" style={{ lineHeight: '1.8em' }}>
                      {entry.content}
                    </div>
                  </div>
                </div>
              </BookPage>
            ))}
          </HTMLFlipBook>
        </div>

        {/* Next button */}
        <button
          className="hidden md:flex absolute right-4 z-30 items-center justify-center w-10 h-10 rounded-full bg-black/30 text-amber-200 hover:bg-black/50 transition-colors backdrop-blur-sm"
          onClick={goNext}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Page indicator */}
      <div className="relative z-20 text-center pb-4">
        <span className="text-amber-300/60 text-xs">
          Pages {currentPage + 1}–{currentPage + 2} of {3 + Math.min(sortedEntries.length, 20)}
        </span>
      </div>

      {/* Entry Form Modal */}
      <Dialog open={entryFormOpen} onOpenChange={setEntryFormOpen}>
        <DialogContent className="bg-amber-50 border-amber-300 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-900">
              {editingEntry ? 'Edit Entry' : 'New Entry'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={formType} onValueChange={(v) => setFormType(v as JournalEntryType)}>
              <SelectTrigger className="bg-white border-amber-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="journal">📖 Journal</SelectItem>
                <SelectItem value="note">📝 Note</SelectItem>
                <SelectItem value="reminder">🔔 Reminder</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Title"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="bg-white border-amber-300"
            />
            <textarea
              placeholder="Write here..."
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              className="w-full h-32 bg-white border border-amber-300 rounded-md p-3 text-sm resize-none outline-none focus:border-amber-500"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-800/60">Mood:</span>
              {(Object.keys(moodEmojis) as JournalMood[]).map(m => (
                <button
                  key={m}
                  onClick={() => setFormMood(formMood === m ? '' : m)}
                  className={`text-lg p-1 rounded transition-all ${formMood === m ? 'bg-amber-200 scale-110' : 'opacity-40 hover:opacity-80'}`}
                >
                  {moodEmojis[m]}
                </button>
              ))}
            </div>
            {book.chapters.length > 0 && (
              <Select value={formChapter} onValueChange={setFormChapter}>
                <SelectTrigger className="bg-white border-amber-300">
                  <SelectValue placeholder="Chapter (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {book.chapters.map(ch => (
                    <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              placeholder="Tags (comma separated)"
              value={formTags}
              onChange={e => setFormTags(e.target.value)}
              className="bg-white border-amber-300"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setEntryFormOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button
                className="bg-amber-800 text-white hover:bg-amber-700"
                onClick={handleSubmitEntry}
                disabled={!formTitle.trim() || !formContent.trim()}
              >
                {editingEntry ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entry Viewer Modal */}
      <Dialog open={!!viewingEntry} onOpenChange={() => setViewingEntry(null)}>
        <DialogContent className="bg-amber-50 border-amber-300 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-amber-900 flex items-center gap-2">
              {viewingEntry?.mood && <span className="text-xl">{moodEmojis[viewingEntry.mood]}</span>}
              {viewingEntry?.title}
            </DialogTitle>
          </DialogHeader>
          {viewingEntry && (
            <div className="space-y-3">
              <p className="text-xs text-amber-700/60">{format(new Date(viewingEntry.date), 'EEEE, MMMM d, yyyy')}</p>
              <div className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed bg-white/50 rounded-lg p-4">
                {viewingEntry.content}
              </div>
              {viewingEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {viewingEntry.tags.map(tag => (
                    <span key={tag} className="text-xs bg-amber-200/50 text-amber-800 px-2 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { openEditEntry(viewingEntry); setViewingEntry(null); }}>
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-300" onClick={() => { onDeleteEntry(viewingEntry.id); setViewingEntry(null); }}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Inline styles for page-flip */}
      <style>{`
        .flip-book-container {
          display: flex;
          justify-content: center;
          max-width: 1100px;
          margin: 0 auto;
        }
        .book-page {
          position: relative;
          overflow: hidden;
        }
        .book-page-content {
          position: absolute;
          inset: 6% 4%;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .book-page-content {
            inset: 4% 3%;
          }
        }
      `}</style>
    </div>
  );
}
