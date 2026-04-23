"use client";

import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
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

  React.useEffect(() => {
    if (isOpen && initialBook?.id) {
      setLoading(true);
      fetch(`/api/entries?bookId=${initialBook.id}`)
        .then(res => res.json())
        .then(data => {
          setEntries(Array.isArray(data) ? data : []);
        })
        .catch(err => console.error("Failed to fetch entries:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, initialBook?.id]);

  const typeInfo = bookTypeLabels[initialBook?.bookType] || bookTypeLabels.journal;

  return (
    <div className="journal-desk-overlay">
      <div className="journal-desk-bg" />
      <div className="journal-desk-vignette" />

      <button className="book-close-btn" onClick={onClose} aria-label="Close Journal">
        <X className="w-8 h-8" />
      </button>

      <div className="book-cover-stage">
        <div 
          className={`book-container ${isOpen ? 'is-open' : 'is-closed'}`}
          onClick={() => !isOpen && setIsOpen(true)}
        >
          {!isOpen ? (
            <div className="book-cover-container">
              <img src="/book/Frame 1.png" alt="Book Cover" className="cover-asset" />
              <div className="book-cover-overlay">
                <h1 className="book-cover-title">
                  {initialBook?.name || "Life OS Journal"}
                </h1>
                <div className="book-cover-date">
                  {initialBook?.startedAt && format(new Date(initialBook.startedAt), 'MMMM yyyy')}
                </div>
              </div>
            </div>
          ) : (
            <div className="book-open-content">
              {/* Heading/spread background image */}
              <img src="/book/Heading.png" alt="Open Book" className="heading-asset" />

              {/* Date header — original position on the spread */}
              <div className="book-open-header">
                {format(new Date(), 'MMMM yyyy')}
              </div>

              {/* LEFT PAGE — Watercolor illustration */}
              <div className="book-left-page-drawing">
                <img 
                  src="/book/Journal1.png" 
                  alt="Journal illustration" 
                  className="left-page-illustration"
                />
              </div>

              {/* RIGHT PAGE — book info with labels */}
              <div className="book-right-page">
                <div className="right-page-field">
                  <span className="field-label">Name</span>
                  <span className="field-value">{initialBook?.ownerName || 'Anonymous'}</span>
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

                {/* Decorative flower sketch */}
                <div className="right-page-drawing">
                  <svg viewBox="0 0 120 120" className="botanical-drawing">
                    {/* Stem */}
                    <path d="M60 120 Q58 100 60 80 Q62 65 58 55" stroke="#3b2a1a" strokeWidth="1.2" fill="none" opacity="0.5" />
                    {/* Left stem leaf */}
                    <path d="M59 90 Q45 82 40 86 Q35 90 48 92 Q55 92 59 90Z" stroke="#3b2a1a" strokeWidth="0.7" fill="rgba(59,42,26,0.1)" opacity="0.5" />
                    <path d="M58 90 Q48 86 42 88" stroke="#3b2a1a" strokeWidth="0.4" fill="none" opacity="0.35" />
                    {/* Right stem leaf */}
                    <path d="M61 78 Q75 70 80 74 Q85 78 72 80 Q65 80 61 78Z" stroke="#3b2a1a" strokeWidth="0.7" fill="rgba(59,42,26,0.1)" opacity="0.5" />
                    <path d="M62 78 Q72 73 78 75" stroke="#3b2a1a" strokeWidth="0.4" fill="none" opacity="0.35" />
                    {/* Petals */}
                    <path d="M58 55 Q50 40 42 38 Q34 36 40 46 Q46 54 58 55Z" stroke="#3b2a1a" strokeWidth="0.8" fill="rgba(59,42,26,0.08)" opacity="0.5" />
                    <path d="M58 55 Q46 48 38 52 Q30 56 42 58 Q52 58 58 55Z" stroke="#3b2a1a" strokeWidth="0.8" fill="rgba(59,42,26,0.06)" opacity="0.45" />
                    <path d="M62 55 Q70 40 78 38 Q86 36 80 46 Q74 54 62 55Z" stroke="#3b2a1a" strokeWidth="0.8" fill="rgba(59,42,26,0.08)" opacity="0.5" />
                    <path d="M62 55 Q74 48 82 52 Q90 56 78 58 Q68 58 62 55Z" stroke="#3b2a1a" strokeWidth="0.8" fill="rgba(59,42,26,0.06)" opacity="0.45" />
                    <path d="M58 53 Q54 38 58 28 Q60 22 62 28 Q66 38 62 53Z" stroke="#3b2a1a" strokeWidth="0.8" fill="rgba(59,42,26,0.08)" opacity="0.5" />
                    {/* Flower center */}
                    <circle cx="60" cy="52" r="5" stroke="#3b2a1a" strokeWidth="0.8" fill="rgba(59,42,26,0.12)" opacity="0.55" />
                    <circle cx="60" cy="52" r="2.5" stroke="#3b2a1a" strokeWidth="0.5" fill="rgba(59,42,26,0.15)" opacity="0.5" />
                    {/* Center dots */}
                    <circle cx="59" cy="51" r="0.7" fill="#3b2a1a" opacity="0.35" />
                    <circle cx="61" cy="53" r="0.7" fill="#3b2a1a" opacity="0.35" />
                    <circle cx="60" cy="50.5" r="0.5" fill="#3b2a1a" opacity="0.3" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
