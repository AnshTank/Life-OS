"use client";

import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import '@/styles/journal-book.css';

interface JournalBookViewProps {
  book: any;
  onUpdate?: () => void;
  onClose: () => void;
}

const bookTypeLabels: Record<string, { icon: string; label: string }> = {
  'journal': { icon: '📔', label: 'Journal' },
  'daily-log': { icon: '📝', label: 'Daily Log' },
  'notebook': { icon: '📓', label: 'Notebook' },
  'project': { icon: '📋', label: 'Project Book' },
  'custom': { icon: '✨', label: 'Custom' },
};

export function JournalBookView({ book: initialBook, onUpdate, onClose }: JournalBookViewProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [entries, setEntries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(0); // 0 is title page, 1+ are entries

  React.useEffect(() => {
    if (isOpen && initialBook?.id) {
      setLoading(true);
      // Using context would be better but keeping the fetch logic if it's preferred
      fetch(`/api/entries?bookId=${initialBook.id}`)
        .then(res => res.json())
        .then(data => {
          const sorted = Array.isArray(data) ? data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
          setEntries(sorted);
        })
        .catch(err => console.error("Failed to fetch entries:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, initialBook?.id]);

  const typeInfo = bookTypeLabels[initialBook?.bookType] || bookTypeLabels.journal;

  const nextPage = () => {
    if (currentPage < entries.length) {
      setCurrentPage(p => p + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    }
  };

  const currentEntry = currentPage > 0 ? entries[currentPage - 1] : null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="journal-desk-overlay"
    >
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.9 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="journal-desk-bg" 
      />
      <div className="journal-desk-vignette" />

      <button className="book-close-btn" onClick={onClose} aria-label="Close Journal">
        <X className="w-8 h-8" />
      </button>

      <div className="book-cover-stage">
        <motion.div 
          layout
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className={`book-container ${isOpen ? 'is-open' : 'is-closed'}`}
          onClick={() => !isOpen && setIsOpen(true)}
        >
          <AnimatePresence mode="wait">
            {!isOpen ? (
              <motion.div 
                key="closed"
                initial={{ opacity: 0, scale: 0.8, y: 50, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 1.05, rotateY: -90, x: -120, filter: "blur(2px)" }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="book-cover-container"
              >
                <img src="/book/Frame 1.png" alt="Book Cover" className="cover-asset" />
                <div className="book-cover-overlay">
                  <h1 className="book-cover-title">
                    {initialBook?.name || "Life OS Journal"}
                  </h1>
                  <div className="book-cover-date">
                    {initialBook?.startedAt && format(new Date(initialBook.startedAt), 'MMMM yyyy')}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="open"
                initial={{ opacity: 0, scale: 0.9, rotateY: 90, x: 120, filter: "blur(2px)" }}
                animate={{ opacity: 1, scale: 1, rotateY: 0, x: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="book-open-content"
                style={{ perspective: 1500 }}
              >
                <img src="/book/Heading.png" alt="Open Book" className="heading-asset" />

                {/* Navigation Arrows */}
                <div className="book-nav-controls">
                  {currentPage > 0 && (
                    <button onClick={prevPage} className="book-nav-btn prev">
                      <span className="sr-only">Previous Page</span>
                    </button>
                  )}
                  {currentPage < entries.length && (
                    <button onClick={nextPage} className="book-nav-btn next">
                      <span className="sr-only">Next Page</span>
                    </button>
                  )}
                </div>

                {/* Page Number */}
                <div className="book-page-number">
                  {currentPage === 0 ? "Title Page" : `Entry ${currentPage} of ${entries.length}`}
                </div>

                {/* LEFT PAGE */}
                <div className="book-left-page">
                  <AnimatePresence>
                    {currentPage === 0 ? (
                      <motion.div 
                        key="left-title"
                        initial={{ opacity: 0, x: -15, filter: "blur(2px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: 15, filter: "blur(2px)" }}
                        transition={{ duration: 0.3 }}
                        className="book-left-page-drawing"
                      >
                        <img 
                          src="/book/Journal1.png" 
                          alt="Journal illustration" 
                          className="left-page-illustration"
                        />
                      </motion.div>
                    ) : (
                      <motion.div 
                        key={`left-entry-${currentEntry?.id}`}
                        initial={{ opacity: 0, x: -30, filter: "blur(2px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: 30, filter: "blur(2px)" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="entry-content-page lined-paper-left"
                      >
                        <h2 className="entry-title-handwritten">{currentEntry?.title}</h2>
                        <div className="entry-date-handwritten">
                          {currentEntry?.date && format(new Date(currentEntry.date), 'EEEE, MMM do, yyyy')}
                        </div>
                        {currentEntry?.mood && (
                          <div className="entry-mood-sticker">
                            Mood: {currentEntry.mood}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* RIGHT PAGE */}
                <div className="book-right-page">
                  <AnimatePresence>
                    {currentPage === 0 ? (
                      <motion.div 
                        key="right-title"
                        initial={{ opacity: 0, x: 15, filter: "blur(2px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: -15, filter: "blur(2px)" }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full flex flex-col"
                      >
                        <div className="right-page-field">
                          <span className="field-label">Name</span>
                          <span className="field-value">{initialBook?.ownerName || 'Ansh'}</span>
                        </div>

                        <div className="right-page-divider" />

                        <div className="right-page-field">
                          <span className="field-label">Type</span>
                          <span className="field-value">{typeInfo.icon} {typeInfo.label}</span>
                        </div>

                        {initialBook?.purpose && (
                          <>
                            <div className="right-page-divider" />
                            <div className="right-page-field">
                              <span className="field-label">Purpose</span>
                              <span className="field-value field-value-italic">{initialBook.purpose}</span>
                            </div>
                          </>
                        )}

                        <div className="right-page-divider" />

                        <div className="right-page-field">
                          <span className="field-label">Created</span>
                          <span className="field-value">
                            {initialBook?.startedAt 
                              ? format(new Date(initialBook.startedAt), 'MMMM d, yyyy')
                              : format(new Date(initialBook?.createdAt || new Date()), 'MMMM d, yyyy')
                            }
                          </span>
                        </div>

                        <div className="right-page-drawing">
                          <svg viewBox="0 0 120 120" className="botanical-drawing">
                            <path d="M60 120 Q58 100 60 80 Q62 65 58 55" stroke="#3b2a1a" strokeWidth="1.2" fill="none" opacity="0.5" />
                            <circle cx="60" cy="52" r="5" stroke="#3b2a1a" strokeWidth="0.8" fill="rgba(59,42,26,0.12)" opacity="0.55" />
                          </svg>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key={`right-entry-${currentEntry?.id}`}
                        initial={{ opacity: 0, x: 30, filter: "blur(2px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: -30, filter: "blur(2px)" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="entry-body-page scrollable-content lined-paper"
                      >
                        <p className="entry-text-handwritten">{currentEntry?.content}</p>
                        {currentEntry?.tags?.length > 0 && (
                          <div className="entry-tags-handwritten">
                            {currentEntry.tags.map((tag: string) => `#${tag} `)}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
