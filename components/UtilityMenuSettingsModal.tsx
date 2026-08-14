"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, CheckSquare, BookOpen, Calendar, Target, Wallet, 
  Settings, Sparkles, Plus, Trash2, Edit3, Keyboard, Layers, Zap,
  Globe, Command, Heart, Dumbbell, Trophy, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export interface MenuItem {
  id: string;
  label: string;
  iconName: string;
  color: string;
  actionType: 'navigate' | 'quick-note' | 'macro' | 'settings';
  url?: string;
  macroCommand?: string;
  hotkeyDisplay?: string;
  layer: 1 | 2 | 3;
}

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'fast-notes',
    label: 'Fast Notes',
    iconName: 'FileText',
    color: '#3b82f6',
    actionType: 'quick-note',
    url: '/projects',
    macroCommand: 'alt+n',
    hotkeyDisplay: 'Alt+N',
    layer: 1,
  },
  {
    id: 'quick-tasks',
    label: 'Tasks',
    iconName: 'CheckSquare',
    color: '#10b981',
    actionType: 'navigate',
    url: '/tasks',
    macroCommand: 'alt+t',
    hotkeyDisplay: 'Alt+T',
    layer: 1,
  },
  {
    id: 'quick-journal',
    label: 'Journal',
    iconName: 'BookOpen',
    color: '#f59e0b',
    actionType: 'navigate',
    url: '/journal',
    macroCommand: 'alt+j',
    hotkeyDisplay: 'Alt+J',
    layer: 1,
  },
  {
    id: 'quick-calendar',
    label: 'Calendar',
    iconName: 'Calendar',
    color: '#8b5cf6',
    actionType: 'navigate',
    url: '/calendar',
    macroCommand: 'alt+c',
    hotkeyDisplay: 'Alt+C',
    layer: 2,
  },
  {
    id: 'quick-goals',
    label: 'Goals',
    iconName: 'Target',
    color: '#ec4899',
    actionType: 'navigate',
    url: '/goals',
    macroCommand: 'alt+g',
    hotkeyDisplay: 'Alt+G',
    layer: 2,
  },
  {
    id: 'quick-money',
    label: 'Money',
    iconName: 'Wallet',
    color: '#06b6d4',
    actionType: 'navigate',
    url: '/money',
    macroCommand: 'alt+m',
    hotkeyDisplay: 'Alt+M',
    layer: 2,
  },
  {
    id: 'settings-item',
    label: 'Config',
    iconName: 'Settings',
    color: '#64748b',
    actionType: 'settings',
    hotkeyDisplay: 'Alt+S',
    macroCommand: 'alt+s',
    layer: 3,
  },
];

export const AVAILABLE_ICONS = [
  { name: 'FileText', icon: FileText, label: 'Notes' },
  { name: 'CheckSquare', icon: CheckSquare, label: 'Tasks' },
  { name: 'BookOpen', icon: BookOpen, label: 'Journal' },
  { name: 'Calendar', icon: Calendar, label: 'Calendar' },
  { name: 'Target', icon: Target, label: 'Goals' },
  { name: 'Wallet', icon: Wallet, label: 'Money' },
  { name: 'Sparkles', icon: Sparkles, label: 'AI Helper' },
  { name: 'Zap', icon: Zap, label: 'Macro' },
  { name: 'Globe', icon: Globe, label: 'Web Link' },
  { name: 'Heart', icon: Heart, label: 'Health' },
  { name: 'Dumbbell', icon: Dumbbell, label: 'Habits' },
  { name: 'Trophy', icon: Trophy, label: 'Milestones' },
  { name: 'Settings', icon: Settings, label: 'Settings' },
];

export const COLOR_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#e11d48', '#7c3aed', '#059669', '#d97706', '#64748b'
];

export function getIconComponent(iconName: string) {
  const item = AVAILABLE_ICONS.find(i => i.name === iconName);
  return item ? item.icon : Zap;
}

export function UtilityMenuSettingsModal({
  isOpen,
  onClose,
  items,
  onSaveItems,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  onSaveItems: (items: MenuItem[]) => void;
}) {
  const [localItems, setLocalItems] = useState<MenuItem[]>(items);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form fields
  const [label, setLabel] = useState('');
  const [iconName, setIconName] = useState('Zap');
  const [color, setColor] = useState('#3b82f6');
  const [actionType, setActionType] = useState<'navigate' | 'quick-note' | 'macro' | 'settings'>('navigate');
  const [url, setUrl] = useState('');
  const [hotkeyDisplay, setHotkeyDisplay] = useState('');
  const [layer, setLayer] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    setLocalItems(items);
  }, [items, isOpen]);

  const handleEdit = (item: MenuItem) => {
    setEditingItemId(item.id);
    setLabel(item.label);
    setIconName(item.iconName);
    setColor(item.color);
    setActionType(item.actionType);
    setUrl(item.url || '');
    setHotkeyDisplay(item.hotkeyDisplay || '');
    setLayer(item.layer);
  };

  const handleResetForm = () => {
    setEditingItemId(null);
    setLabel('');
    setIconName('Zap');
    setColor('#3b82f6');
    setActionType('navigate');
    setUrl('');
    setHotkeyDisplay('');
    setLayer(1);
  };

  const handleSaveItem = () => {
    if (!label.trim()) {
      toast.error('Please enter a menu label');
      return;
    }

    const macroCmd = hotkeyDisplay.trim().toLowerCase().replace(/\s+/g, '');

    let formattedUrl = url.trim() || '/dashboard';
    if (actionType === 'navigate') {
      if (!formattedUrl.startsWith('/') && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = '/' + formattedUrl;
      }
    }

    const newItem: MenuItem = {
      id: editingItemId || `custom-${Date.now()}`,
      label: label.trim(),
      iconName,
      color,
      actionType,
      url: formattedUrl,
      hotkeyDisplay: hotkeyDisplay.trim(),
      macroCommand: macroCmd,
      layer,
    };

    let updated: MenuItem[];
    if (editingItemId) {
      updated = localItems.map(i => i.id === editingItemId ? newItem : i);
    } else {
      updated = [...localItems, newItem];
    }

    setLocalItems(updated);
    onSaveItems(updated);
    handleResetForm();
    toast.success(editingItemId ? 'Menu item updated!' : 'New menu item added!');
  };

  const handleDeleteItem = (id: string) => {
    const updated = localItems.filter(i => i.id !== id);
    setLocalItems(updated);
    onSaveItems(updated);
    if (editingItemId === id) handleResetForm();
    toast.success('Menu item deleted');
  };

  const handleResetDefaults = () => {
    setLocalItems(DEFAULT_MENU_ITEMS);
    onSaveItems(DEFAULT_MENU_ITEMS);
    handleResetForm();
    toast.success('Reset menu to defaults 🔄');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#fefdfb] border-2 border-[#2d2d2d] rounded-3xl shadow-[8px_8px_0px_rgba(45,45,45,1)] p-6 font-kalam z-[100]">
        <DialogHeader className="border-b pb-3 border-[#2d2d2d]/10 flex flex-row items-center justify-between">
          <DialogTitle className="font-caveat text-3xl font-bold text-[#2d2d2d] flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-500" /> Utility Radial Arc & Macro Settings
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 items-start">
          {/* Left Column: Menu Items list grouped by layers */}
          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#2d2d2d] uppercase tracking-wider">Active Arc Layers</h4>
              <Button onClick={handleResetDefaults} variant="ghost" size="sm" className="h-7 text-xs text-amber-800 hover:bg-amber-50">
                Reset Defaults
              </Button>
            </div>

            {[1, 2, 3].map(layerNum => {
              const layerItems = localItems.filter(i => i.layer === layerNum);
              return (
                <div key={layerNum} className="border-2 border-[#2d2d2d]/15 rounded-2xl p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between border-b pb-1 border-[#2d2d2d]/10">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Layer {layerNum} Arc
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{layerItems.length} items</span>
                  </div>

                  {layerItems.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2 text-center">Empty layer — add items below</p>
                  ) : (
                    <div className="space-y-1.5">
                      {layerItems.map(item => {
                        const IconComp = getIconComponent(item.iconName);
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                              editingItemId === item.id ? 'border-amber-500 bg-amber-50/50 shadow-sm' : 'border-[#2d2d2d]/10 hover:border-[#2d2d2d]/30 bg-slate-50/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                style={{ backgroundColor: item.color }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#2d2d2d] truncate">{item.label}</p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {item.actionType === 'quick-note' ? 'Fast Notes' : item.url}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.hotkeyDisplay && (
                                <Badge className="bg-[#2d2d2d] text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                                  {item.hotkeyDisplay}
                                </Badge>
                              )}
                              <button onClick={() => handleEdit(item)} className="p-1 hover:text-amber-600 text-slate-400">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteItem(item.id)} className="p-1 hover:text-red-600 text-slate-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Add / Edit Item Form */}
          <div className="space-y-4 border-2 border-[#2d2d2d] rounded-2xl p-4 bg-white shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-[#2d2d2d]/10">
                <h4 className="font-bold text-sm text-[#2d2d2d]">
                  {editingItemId ? '✏️ Edit Menu Item' : '✨ Add New Menu Item'}
                </h4>
                {editingItemId && (
                  <button onClick={handleResetForm} className="text-xs text-slate-400 hover:text-[#2d2d2d]">
                    Cancel Edit
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Menu Label</Label>
                <Input
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Quick Notes, Workouts"
                  className="h-8 text-xs font-kalam border-[#2d2d2d]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Action Type</Label>
                  <Select value={actionType} onValueChange={(val: any) => setActionType(val)}>
                    <SelectTrigger className="h-8 text-xs font-kalam border-[#2d2d2d]/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="font-kalam text-xs z-[110]">
                      <SelectItem value="navigate">Navigate URL</SelectItem>
                      <SelectItem value="quick-note">Fast Notes Popup</SelectItem>
                      <SelectItem value="settings">Open Settings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Layer Arc</Label>
                  <Select value={String(layer)} onValueChange={(val: any) => setLayer(Number(val) as 1 | 2 | 3)}>
                    <SelectTrigger className="h-8 text-xs font-kalam border-[#2d2d2d]/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="font-kalam text-xs z-[110]">
                      <SelectItem value="1">Layer 1 (Inner Arc)</SelectItem>
                      <SelectItem value="2">Layer 2 (Middle Arc)</SelectItem>
                      <SelectItem value="3">Layer 3 (Outer Arc)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {actionType === 'navigate' && (
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Page Route / URL</Label>
                  <Input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="e.g. /projects or /habits"
                    className="h-8 text-xs font-kalam border-[#2d2d2d]/30"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Keyboard Macro / Hotkey (Optional)</Label>
                <Input
                  value={hotkeyDisplay}
                  onChange={e => setHotkeyDisplay(e.target.value)}
                  placeholder="e.g. Alt+N or Alt+1"
                  className="h-8 text-xs font-kalam font-mono border-[#2d2d2d]/30"
                />
                <p className="text-[10px] text-slate-400">Pressing this key combo anywhere triggers the action!</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Icon Choice</Label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-[#2d2d2d]/10 rounded-xl">
                  {AVAILABLE_ICONS.map(i => {
                    const Icon = i.icon;
                    return (
                      <button
                        key={i.name}
                        onClick={() => setIconName(i.name)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          iconName === i.name ? 'border-[#2d2d2d] bg-[#2d2d2d] text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                        title={i.label}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600">Color Palette</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full border border-[#2d2d2d]/20 transition-transform ${color === c ? 'ring-2 ring-offset-1 ring-[#2d2d2d] scale-110' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveItem}
              className="w-full journal-btn-primary py-2 text-xs font-bold font-kalam mt-3"
            >
              {editingItemId ? 'Update Item' : 'Add Item to Arc'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
