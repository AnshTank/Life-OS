"use client";

import { useApp, FontFamily } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Type, Minus, Plus } from 'lucide-react';

export function ProfileSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { fontSettings, updateFontSettings } = useApp();

  const fontOptions: { value: FontFamily; label: string }[] = [
    { value: 'kalam', label: 'Kalam (Default)' },
    { value: 'caveat', label: 'Caveat' },
    { value: 'indie', label: 'Indie Flower' },
    { value: 'patrick', label: 'Patrick Hand' },
    { value: 'architects', label: 'Architects Daughter' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="journal-modal max-w-md">
        <DialogHeader>
          <DialogTitle className="font-caveat text-2xl">Profile Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-4">
            <h3 className="font-caveat text-xl flex items-center gap-2 border-b border-[#e0e0e0] pb-2">
              <Type className="w-5 h-5" />
              Appearance
            </h3>
            
            <div className="space-y-3">
              <Label className="font-kalam text-base">Font Style</Label>
              <Select 
                value={fontSettings.family} 
                onValueChange={(v) => updateFontSettings({ family: v as FontFamily })}
              >
                <SelectTrigger className="journal-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  {fontOptions.map(font => (
                    <SelectItem key={font.value} value={font.value} className="font-kalam">
                      <span style={{ fontFamily: font.value === 'kalam' ? 'Kalam' : font.value === 'caveat' ? 'Caveat' : font.value === 'indie' ? 'Indie Flower' : font.value === 'patrick' ? 'Patrick Hand' : 'Architects Daughter' }}>
                        {font.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="font-kalam text-base">Font Size</Label>
                <span className="font-caveat text-lg">{fontSettings.size}px</span>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 rounded-full border-2 border-[#2d2d2d]"
                  onClick={() => updateFontSettings({ size: Math.max(12, fontSettings.size - 1) })}
                  disabled={fontSettings.size <= 12}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Slider 
                  value={[fontSettings.size]} 
                  onValueChange={(v) => updateFontSettings({ size: v[0] })}
                  min={12}
                  max={24}
                  step={1}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 rounded-full border-2 border-[#2d2d2d]"
                  onClick={() => updateFontSettings({ size: Math.min(24, fontSettings.size + 1) })}
                  disabled={fontSettings.size >= 24}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-[#f9f7f4] rounded-xl border border-[#e0e0e0] mt-4">
              <p className="text-center" style={{ 
                fontFamily: fontSettings.family === 'kalam' ? 'Kalam' : fontSettings.family === 'caveat' ? 'Caveat' : fontSettings.family === 'indie' ? 'Indie Flower' : fontSettings.family === 'patrick' ? 'Patrick Hand' : 'Architects Daughter',
                fontSize: `${fontSettings.size}px`
              }}>
                The quick brown fox jumps over the lazy dog.
                <br />
                1234567890
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
