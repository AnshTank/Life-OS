"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Smile, Tag, Plus, Pencil, Save, X, BookOpen, FileText, Bell } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { LeftPageSketch } from './LeftPageSketches';
import type { JournalMood, JournalEntryType } from '@/types';

const moodConfig: Record<JournalMood, { emoji: string; label: string; color: string }> = {
  great:    { emoji: '😄', label: 'Great',    color: '#8ab896' },
  good:     { emoji: '🙂', label: 'Good',     color: '#7a9eb8' },
  okay:     { emoji: '😐', label: 'Okay',     color: '#d9b896' },
  bad:      { emoji: '😞', label: 'Bad',      color: '#d49191' },
  terrible: { emoji: '😢', label: 'Terrible', color: '#a85a5a' },
};

export function DailySpread() {
  const { journalEntries, journalBooks, addJournalEntry, user } = useApp();
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<JournalMood | ''>('');
  const [entryType, setEntryType] = useState<JournalEntryType>('journal');

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todaysEntries = journalEntries.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === todayStr);

  const handleSave = () => {
    if (!content.trim()) return;
    addJournalEntry({
      userId: user?.id || 'user-1',
      title: title || 'Untitled Reflection',
      content,
      type: entryType,
      mood: mood || undefined,
      date: new Date(),
      tags: [],
      bookId: journalBooks[0]?.id || 'default'
    });
    setTitle('');
    setContent('');
    setMood('');
    setIsWriting(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-5xl mx-auto mb-12 px-4"
    >
      {/* The Open Book Meta-Container */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full bg-[#fdfbf7] rounded-sm shadow-2xl border-x-[12px] border-[#2d2d2d] overflow-hidden">
        
        {/* Book Texture Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]" />
        
        {/* Center Spine Line */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-black/10 shadow-[0_0_10px_rgba(0,0,0,0.1)] z-10" />

        <div className="flex h-full">
          
          {/* LEFT PAGE: Art & Context */}
          <div className="flex-1 relative p-8 md:p-12 border-r border-black/5">
            <div className="h-full flex flex-col">
              <div className="mb-4">
                <span className="font-kalam text-sm text-[#8a8a8a] uppercase tracking-widest">
                  {format(today, 'EEEE')}
                </span>
                <h1 className="font-caveat text-4xl md:text-5xl text-[#2d2d2d]">
                  {format(today, 'MMMM do, yyyy')}
                </h1>
              </div>

              <div className="flex-1 flex items-center justify-center relative overflow-hidden opacity-80">
                <LeftPageSketch bookType="journal" />
              </div>

              {todaysEntries.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dashed border-[#d9b896]">
                  <p className="font-kalam text-xs text-[#8a8a8a] mb-2 uppercase">Today's Highlights</p>
                  <div className="space-y-1">
                    {todaysEntries.slice(0, 3).map(e => (
                      <div key={e.id} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#d9b896]" />
                        <span className="font-kalam text-sm text-[#5a5a5a] truncate">{e.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PAGE: The Writing/Reading Space */}
          <div className="flex-1 relative p-8 md:p-12">
            {!isWriting ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-[#f5f0e6] border-2 border-dashed border-[#d9b896] flex items-center justify-center">
                  <Pencil className="w-8 h-8 text-[#a88a5a] opacity-50" />
                </div>
                <div>
                  <h2 className="font-caveat text-3xl text-[#2d2d2d]">What's on your mind?</h2>
                  <p className="font-kalam text-[#8a8a8a] max-w-xs mx-auto">
                    Capture a thought, a lesson, or a moment from today.
                  </p>
                </div>
                <button 
                  onClick={() => setIsWriting(true)}
                  className="px-8 py-3 bg-[#2d2d2d] text-white font-kalam rounded-full hover:scale-105 transition-transform shadow-lg"
                >
                  Start Writing
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="h-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    {(['journal', 'note', 'reminder'] as const).map(t => (
                      <button 
                        key={t}
                        onClick={() => setEntryType(t)}
                        className={`p-1.5 rounded transition-colors ${entryType === t ? 'bg-[#2d2d2d] text-white' : 'text-[#8a8a8a] hover:bg-black/5'}`}
                      >
                        {t === 'journal' ? <BookOpen size={16} /> : t === 'note' ? <FileText size={16} /> : <Bell size={16} />}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setIsWriting(false)} className="text-[#8a8a8a] hover:text-[#2d2d2d]">
                    <X size={20} />
                  </button>
                </div>

                <input 
                  autoFocus
                  placeholder="Title (optional)..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-transparent border-none outline-none font-caveat text-3xl text-[#2d2d2d] mb-2 placeholder:text-black/10"
                />

                <textarea 
                  placeholder="Begin your reflection..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full flex-1 bg-transparent border-none outline-none font-kalam text-lg text-[#5a5a5a] resize-none placeholder:text-black/5 leading-relaxed"
                  style={{
                    backgroundImage: 'linear-gradient(transparent, transparent 31px, #d9b89633 31px)',
                    backgroundSize: '100% 32px',
                    backgroundAttachment: 'local'
                  }}
                />

                <div className="mt-4 pt-4 border-t border-dashed border-[#d9b896] flex items-center justify-between">
                  <div className="flex gap-3">
                    {(Object.keys(moodConfig) as JournalMood[]).map(m => (
                      <button 
                        key={m}
                        onClick={() => setMood(m === mood ? '' : m)}
                        className={`text-xl grayscale hover:grayscale-0 transition-all ${mood === m ? 'grayscale-0 scale-125' : 'opacity-40 hover:opacity-100'}`}
                        title={moodConfig[m].label}
                      >
                        {moodConfig[m].emoji}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleSave}
                    disabled={!content.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-[#2d2d2d] text-white font-kalam rounded-full disabled:opacity-30 transition-all shadow-md hover:shadow-lg"
                  >
                    <Save size={16} />
                    Seal Entry
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Paper Corner Folds (Decorations) */}
        <div className="absolute top-0 right-0 w-12 h-12 bg-black/5 rounded-bl-3xl z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-12 h-12 bg-black/5 rounded-tr-3xl z-20 pointer-events-none" />
      </div>

      {/* Aesthetic Shadows & Reflections */}
      <div className="absolute -bottom-6 inset-x-8 h-12 bg-black/10 blur-2xl rounded-[100%] -z-10" />
    </motion.div>
  );
}
