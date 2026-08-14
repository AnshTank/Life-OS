"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Plus, X, Settings, FileText, CheckSquare, BookOpen, 
  Calendar, Target, Wallet, Sparkles, Send, ExternalLink
} from 'lucide-react';
import { 
  MenuItem, 
  DEFAULT_MENU_ITEMS, 
  getIconComponent, 
  UtilityMenuSettingsModal 
} from '@/components/UtilityMenuSettingsModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const LOCAL_STORAGE_KEY = 'life-os-quarter-menu-config';

export function QuarterUtilityMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);

  // Menu Items State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);

  // Quick Note Drawer State
  const [quickNoteTitle, setQuickNoteTitle] = useState('');
  const [quickNoteContent, setQuickNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Load menu items from LocalStorage & listen to custom trigger events
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMenuItems(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load quarter menu settings:', e);
    }

    const handleCustomOpenSettings = () => {
      setIsSettingsOpen(true);
    };
    window.addEventListener('open-utility-menu-settings', handleCustomOpenSettings);
    return () => window.removeEventListener('open-utility-menu-settings', handleCustomOpenSettings);
  }, []);

  const saveMenuItems = (items: MenuItem[]) => {
    setMenuItems(items);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save quarter menu settings:', e);
    }
  };

  // Execute Action for a Menu Item
  const handleItemClick = useCallback((item: MenuItem) => {
    setIsOpen(false);

    if (item.actionType === 'settings') {
      setIsSettingsOpen(true);
      return;
    }

    if (item.actionType === 'quick-note') {
      setIsQuickNoteOpen(true);
      return;
    }

    if (item.actionType === 'navigate' && item.url) {
      let targetRoute = item.url.trim();
      if (!targetRoute.startsWith('/') && !targetRoute.startsWith('http://') && !targetRoute.startsWith('https://')) {
        targetRoute = '/' + targetRoute;
      }

      if (targetRoute.startsWith('http://') || targetRoute.startsWith('https://')) {
        window.open(targetRoute, '_blank');
      } else {
        router.push(targetRoute);
      }
      toast.success(`Opening ${item.label} 🚀`);
      return;
    }
  }, [router]);

  // Global Keyboard Macro / Hotkey Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Build key string e.g. "alt+n" or "ctrl+shift+n"
      const keys: string[] = [];
      if (e.ctrlKey) keys.push('ctrl');
      if (e.altKey) keys.push('alt');
      if (e.shiftKey) keys.push('shift');
      if (e.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        keys.push(e.key.toLowerCase());
      }
      const pressedCombo = keys.join('+');

      // Check matching items
      const matched = menuItems.find(item => item.macroCommand && item.macroCommand === pressedCombo);
      if (matched) {
        e.preventDefault();
        toast.info(`Macro [${matched.hotkeyDisplay}]: ${matched.label}`);
        handleItemClick(matched);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuItems, handleItemClick]);

  // Save Quick Note Handler
  const handleSaveQuickNote = async () => {
    if (!quickNoteTitle.trim() && !quickNoteContent.trim()) {
      toast.error('Please write some content for your note');
      return;
    }

    setIsSavingNote(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickNoteTitle.trim() || 'Quick Captured Note',
          content: `<p>${quickNoteContent.replace(/\n/g, '<br/>')}</p>`,
          folder: 'General',
          tags: ['quick-capture'],
        }),
      });

      if (res.ok) {
        toast.success('Quick note saved! 📝');
        setQuickNoteTitle('');
        setQuickNoteContent('');
        setIsQuickNoteOpen(false);
      } else {
        toast.error('Failed to save quick note');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Compute Layer Polar Arc Positions
  // Bottom-Left Corner Fan-out (pointing Top-Right: angles 0° to 90°)
  const layerRadii = { 1: 110, 2: 180, 3: 250 };

  const getLayerPositions = (layerNum: 1 | 2 | 3) => {
    const layerItems = menuItems.filter(item => item.layer === layerNum);
    const count = layerItems.length;
    const radius = layerRadii[layerNum];

    if (count === 0) return [];

    return layerItems.map((item, idx) => {
      // Angle distribution from 0° (pointing right) to 90° (pointing up)
      const startAngle = 0;
      const endAngle = 90;
      const angleDeg = count === 1
        ? 45
        : startAngle + (idx / (count - 1)) * (endAngle - startAngle);

      const angleRad = (angleDeg * Math.PI) / 180;
      const x = radius * Math.cos(angleRad);
      const y = -radius * Math.sin(angleRad);

      return { item, x, y };
    });
  };

  const allPositions = [
    ...getLayerPositions(1),
    ...getLayerPositions(2),
    ...getLayerPositions(3),
  ];

  return (
    <>
      {/* Quarter Utility FAB Container — Positioned at Bottom-Left Corner */}
      <div className="fixed bottom-6 left-6 z-50 flex items-center justify-center font-kalam select-none">
        
        {/* Layer-by-Layer Concentric Arc Radial Fan-Out Menu Items */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Semi-transparent Backdrop click-away */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-30"
                onClick={() => setIsOpen(false)}
              />

              {/* Concentric Arc Layer Guide Rings (Visual Layer Rings) */}
              {[1, 2, 3].map(layerNum => {
                const layerItems = menuItems.filter(i => i.layer === layerNum);
                if (layerItems.length === 0) return null;
                const r = layerRadii[layerNum as 1 | 2 | 3];
                return (
                  <motion.div
                    key={`ring-${layerNum}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.35 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300, delay: layerNum * 0.05 }}
                    style={{
                      width: r * 2,
                      height: r * 2,
                      left: -r + 28,
                      top: -r + 28,
                    }}
                    className="absolute rounded-full border-2 border-dashed border-amber-600/70 pointer-events-none z-35"
                  />
                );
              })}

              {/* Arc Menu Buttons */}
              {allPositions.map(({ item, x, y }, index) => {
                const IconComp = getIconComponent(item.iconName);
                const delay = item.layer * 0.06 + (index % 3) * 0.03;
                const isHovered = hoveredItemId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{ x, y, scale: 1, opacity: 1 }}
                    exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 340,
                      damping: 22,
                      delay,
                    }}
                    style={{ zIndex: isHovered ? 100 : 40 }}
                    className="absolute group"
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                  >
                    <button
                      onClick={() => handleItemClick(item)}
                      style={{ backgroundColor: item.color }}
                      className="w-13 h-13 rounded-full border-2 border-[#2d2d2d] shadow-[4px_4px_0px_rgba(45,45,45,1)] hover:scale-115 active:scale-95 transition-transform flex items-center justify-center text-white relative group"
                      title={item.label}
                    >
                      <IconComp className="w-5.5 h-5.5 drop-shadow-md" />

                      {/* Tooltip Badge on Hover — Life OS Hand-drawn Theme & Unclipped Z-Index */}
                      <span className="pointer-events-none absolute left-15 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#fefdfb] text-[#2d2d2d] border-2 border-[#2d2d2d] text-xs font-bold py-1.5 px-3 rounded-2xl whitespace-nowrap shadow-[4px_4px_0px_rgba(45,45,45,1)] flex items-center gap-2 z-[110]">
                        <span className="font-kalam">{item.label}</span>
                        {item.hotkeyDisplay && (
                          <span className="bg-amber-400 text-[#2d2d2d] border border-[#2d2d2d] font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold shadow-xs">
                            {item.hotkeyDisplay}
                          </span>
                        )}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Main Launcher Button (Quarter / FAB Trigger) — Life OS Theme Styled */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1, rotate: isOpen ? 135 : 12 }}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 border-2 border-[#2d2d2d] shadow-[5px_5px_0px_rgba(45,45,45,1)] flex items-center justify-center text-[#2d2d2d] font-bold z-50 relative group"
        >
          {isOpen ? (
            <X className="w-7 h-7 stroke-[2.5]" />
          ) : (
            <Plus className="w-8 h-8 stroke-[2.5] text-[#2d2d2d] transition-transform" />
          )}

          {/* Glowing Outer Quarter Arc Pulse */}
          <span className="absolute -inset-1 rounded-full bg-amber-400/30 blur-md pointer-events-none animate-pulse" />
        </motion.button>
      </div>

      {/* Quick Note Fast Capture Drawer Modal */}
      <AnimatePresence>
        {isQuickNoteOpen && (
          <Dialog open={isQuickNoteOpen} onOpenChange={setIsQuickNoteOpen}>
            <DialogContent className="max-w-lg bg-[#fefdfb] border-2 border-[#2d2d2d] rounded-3xl shadow-[8px_8px_0px_rgba(45,45,45,1)] p-6 font-kalam z-[100]">
              <DialogHeader className="border-b pb-3 border-[#2d2d2d]/10 flex flex-row items-center justify-between">
                <DialogTitle className="font-caveat text-3xl font-bold text-[#2d2d2d] flex items-center gap-2">
                  ⚡ Fast Note Capture
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Note Title</label>
                  <Input
                    value={quickNoteTitle}
                    onChange={e => setQuickNoteTitle(e.target.value)}
                    placeholder="e.g. Meeting Idea, Quick Thought..."
                    className="h-10 text-sm font-caveat text-xl font-bold border-2 border-[#2d2d2d]/20 focus:border-[#2d2d2d]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Content</label>
                  <textarea
                    value={quickNoteContent}
                    onChange={e => setQuickNoteContent(e.target.value)}
                    placeholder="Jot down notes, bullet points, or reminders..."
                    className="w-full h-40 p-3 font-kalam text-xs leading-relaxed border-2 border-[#2d2d2d]/20 rounded-2xl bg-white focus:border-[#2d2d2d] outline-none resize-none shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setIsQuickNoteOpen(false);
                      router.push('/projects');
                    }}
                    variant="outline"
                    className="text-xs font-kalam border-2 border-[#2d2d2d] rounded-xl flex items-center gap-1.5"
                  >
                    Open Full Notes Workspace <ExternalLink className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    onClick={handleSaveQuickNote}
                    disabled={isSavingNote}
                    className="journal-btn-primary py-2 px-5 text-xs font-bold font-kalam rounded-xl"
                  >
                    {isSavingNote ? 'Saving...' : 'Save Fast Note 📝'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Utility Menu & Macro Settings Modal */}
      <UtilityMenuSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        items={menuItems}
        onSaveItems={saveMenuItems}
      />
    </>
  );
}
