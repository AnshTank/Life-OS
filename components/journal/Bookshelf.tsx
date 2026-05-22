"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

interface BookshelfProps {
  books: any[];
  onOpenBook: (id: string) => void;
  onDeleteBook: (id: string) => void;
  onNewBook: () => void;
  entryCountGetter: (bookId: string) => number;
}

export function Bookshelf({ books, onOpenBook, onDeleteBook, onNewBook, entryCountGetter }: BookshelfProps) {
  return (
    <div className="relative w-full py-12">
      {/* The Shelf Layer */}
      <div className="absolute bottom-10 inset-x-0 h-4 bg-[#e8ddd0] shadow-[0_10px_20px_rgba(0,0,0,0.1)] border-t border-white/40" />
      <div className="absolute bottom-6 inset-x-2 h-4 bg-[#d9ccb8] border-t border-black/5" />
      
      <div className="relative flex items-end gap-1 px-4 overflow-x-auto pb-10 no-scrollbar min-h-[220px]">
        {books.map((book, idx) => {
          const entryCount = entryCountGetter(book.id);
          const rotation = (idx % 2 === 0 ? 1 : -1) * (Math.random() * 2);
          
          return (
            <motion.div 
              key={book.id}
              whileHover={{ y: -10, rotate: 0 }}
              style={{ rotate: rotation }}
              className="relative group cursor-pointer transition-all flex-shrink-0"
              onClick={() => onOpenBook(book.id)}
            >
              {/* Book Spine / Cover */}
              <div 
                className="w-12 md:w-16 h-48 md:h-64 rounded-l-sm rounded-r-md shadow-lg flex flex-col justify-between p-2 md:p-3 relative overflow-hidden border-l-4 border-black/10"
                style={{ 
                  backgroundColor: book.color || '#7a9eb8',
                  backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.1) 100%)'
                }}
              >
                {/* Decorative lines on spine */}
                <div className="absolute top-4 inset-x-2 h-px bg-white/20" />
                <div className="absolute bottom-4 inset-x-2 h-px bg-white/20" />
                
                <div className="writing-vertical font-caveat text-white/90 text-sm md:text-lg font-bold truncate max-h-[70%] select-none">
                  {book.name}
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg md:text-xl">{book.icon || '📔'}</span>
                  <div className="w-1 h-1 rounded-full bg-white/40" />
                </div>

                {/* Hover info overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center text-white">
                  <p className="font-kalam text-[10px] uppercase opacity-70">Entries</p>
                  <p className="font-caveat text-xl">{entryCount}</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this book?')) onDeleteBook(book.id);
                    }}
                    className="mt-4 p-1.5 rounded-full bg-white/10 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Shadow on the shelf */}
              <div className="absolute -bottom-2 inset-x-2 h-4 bg-black/20 blur-md -z-10" />
            </motion.div>
          );
        })}

        {/* Add New Book Placeholder */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-12 md:w-16 h-48 md:h-64 rounded-md border-2 border-dashed border-[#d9b896] bg-[#fef9e6]/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#fef9e6]/40 transition-all flex-shrink-0 ml-4"
          onClick={onNewBook}
        >
          <Plus className="text-[#d9b896]" size={24} />
          <span className="writing-vertical font-kalam text-[10px] text-[#d9b896] uppercase">Add Book</span>
        </motion.div>
      </div>

      <style jsx>{`
        .writing-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
          align-self: center;
        }
      `}</style>
    </div>
  );
}
