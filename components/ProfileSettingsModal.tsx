"use client";

import { useState, useRef, useEffect } from 'react';
import { useApp, FontFamily } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Type, Minus, Plus, Sparkles, User, Volume2, Mic, Play, Square, Settings, Coins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { getAiAvatarUrl } from '@/components/SettingChangeOverlay';
import { SUPPORTED_CURRENCIES } from '@/utils/currency';

function getSelectedVoice(lang: string, preference: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(lang.toLowerCase().split('-')[0]));
  if (langVoices.length === 0) return undefined;

  const isMalePref = preference === 'Ansh';
  
  if (isMalePref) {
    const maleKeywords = ['male', 'david', 'ravi', 'ichiro', 'george', 'mark', 'google us english male', 'microsoft david', 'alex', 'fred', 'daniel', 'rishi', 'oliver', 'yuri'];
    for (const kw of maleKeywords) {
      const found = langVoices.find(v => v.name.toLowerCase().includes(kw));
      if (found) return found;
    }
    const anyMale = langVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('google'));
    return anyMale || langVoices[0];
  } else {
    if (preference === 'Mary' && lang.toLowerCase().startsWith('en')) {
      const maryKeywords = ['samantha', 'victoria', 'zira', 'hazel', 'karen', 'microsoft zira'];
      for (const kw of maryKeywords) {
        const found = langVoices.find(v => v.name.toLowerCase().includes(kw) && v.lang.toLowerCase().includes('us'));
        if (found) return found;
      }
    }
    
    const femaleKeywords = [
      'female', 'girl', 'zira', 'hazel', 'samantha', 'victoria', 'karen', 'moira', 
      'tessa', 'susan', 'heera', 'kalpana', 'swara', 'haruka', 'nanako', 'kyoko', 'siri'
    ];
    for (const kw of femaleKeywords) {
      const found = langVoices.find(v => v.name.toLowerCase().includes(kw));
      if (found) return found;
    }
    const notMale = langVoices.find(v => !v.name.toLowerCase().includes('male'));
    return notMale || langVoices[0];
  }
}

export function ProfileSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { 
    fontSettings, updateFontSettings, 
    aiName, aiLanguage, aiVoicePreference, aiAvatar, updateAISettings,
    currencyPreference, updateCurrencyPreference
  } = useApp();

  // Local pending states
  const [localFont, setLocalFont] = useState<FontFamily>('kalam');
  const [localFontSize, setLocalFontSize] = useState(16);
  const [localName, setLocalName] = useState("Potato");
  const [localLanguage, setLocalLanguage] = useState("Auto-detect");
  const [localVoice, setLocalVoice] = useState("Mei");
  const [localAvatar, setLocalAvatar] = useState("classic");
  const [localCurrency, setLocalCurrency] = useState("INR");

  // Save/Testing states
  const [isSaving, setIsSaving] = useState(false);
  const [saveType, setSaveType] = useState<'font' | 'size' | 'avatar' | 'voice' | 'general'>('general');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [testText, setTestText] = useState("Hey there! Let's test out my vocal settings inside this sandbox.");
  const [isTestSpeaking, setIsTestSpeaking] = useState(false);
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopSampleAudio = () => {
    if (sampleAudioRef.current) {
      try {
        sampleAudioRef.current.pause();
      } catch (e) {}
      sampleAudioRef.current = null;
    }
    setIsPlayingSample(false);
  };

  const playSampleAudio = (voice: string) => {
    try {
      stopSampleAudio();
      
      // Stop speech synthesis test if active
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsTestSpeaking(false);
      
      const audioPath = 
        voice === 'Mei' ? '/Audio/Welcome to Luminary .mp3' :
        voice === 'Ansh' ? '/Audio/Welcome to Luminary  (1).mp3' :
        '/Audio/Welcome to Luminary  (2).mp3';
      
      const audio = new Audio(audioPath);
      audio.volume = 0.6;
      audio.onended = () => setIsPlayingSample(false);
      audio.onerror = () => setIsPlayingSample(false);
      
      sampleAudioRef.current = audio;
      setIsPlayingSample(true);
      audio.play();
    } catch (e) {
      console.warn("Failed to play sample audio:", e);
      setIsPlayingSample(false);
    }
  };

  // Initialize local states from context whenever modal opens / cleanup on close
  useEffect(() => {
    if (isOpen) {
      setLocalFont(fontSettings.family);
      setLocalFontSize(fontSettings.size);
      setLocalName(aiName);
      setLocalLanguage(aiLanguage);
      setLocalVoice(aiVoicePreference);
      setLocalAvatar(aiAvatar);
      setLocalCurrency(currencyPreference);
      setIsSaving(false);
    } else {
      stopSampleAudio();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsTestSpeaking(false);
    }
  }, [isOpen, fontSettings, aiName, aiLanguage, aiVoicePreference, aiAvatar, currencyPreference]);


  const speakPlaygroundTest = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Stop sample audio playback if running
    stopSampleAudio();

    if (isTestSpeaking) {
      window.speechSynthesis.cancel();
      setIsTestSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(testText);
    const voices = window.speechSynthesis.getVoices();

    // Select language based on local selection or character inspection
    if (localLanguage === 'Hindi') {
      utterance.lang = 'hi-IN';
    } else if (localLanguage === 'Gujarati') {
      utterance.lang = 'gu-IN';
    } else if (localLanguage === 'Japanese') {
      utterance.lang = 'ja-JP';
    } else if (localLanguage === 'English') {
      utterance.lang = 'en-US';
    } else {
      // Auto-detect check based on characters in sandbox text
      const hasDevanagari = /[\u0900-\u097F]/.test(testText);
      const hasGujarati = /[\u0A80-\u0AFF]/.test(testText);
      if (hasDevanagari) utterance.lang = 'hi-IN';
      else if (hasGujarati) utterance.lang = 'gu-IN';
      else utterance.lang = 'en-US';
    }

    const matchVoice = getSelectedVoice(utterance.lang, localVoice, voices);
    if (matchVoice) {
      utterance.voice = matchVoice;
    }

    utterance.onstart = () => setIsTestSpeaking(true);
    utterance.onend = () => setIsTestSpeaking(false);
    utterance.onerror = () => setIsTestSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    // Determine the main change type for specific animation
    let type: 'font' | 'size' | 'avatar' | 'voice' | 'general' = 'general';
    if (localFont !== fontSettings.family) {
      type = 'font';
    } else if (localFontSize !== fontSettings.size) {
      type = 'size';
    } else if (localAvatar !== aiAvatar) {
      type = 'avatar';
    } else if (localVoice !== aiVoicePreference || localLanguage !== aiLanguage) {
      type = 'voice';
    }

    setSaveType(type);
    setIsSaving(true);
    setPhraseIdx(0);

    // Rotate phrases slower (2.5 seconds per phrase, total 7.5 seconds)
    const t1 = setTimeout(() => setPhraseIdx(1), 2500);
    const t2 = setTimeout(() => setPhraseIdx(2), 5000);

    // Apply setting changes at the end of the funny loading animation
    setTimeout(() => {
      updateFontSettings({ family: localFont, size: localFontSize });
      updateAISettings({ 
        aiName: localName, 
        aiLanguage: localLanguage, 
        aiVoicePreference: localVoice, 
        aiAvatar: localAvatar 
      });
      updateCurrencyPreference(localCurrency);
    }, 5500);

    setTimeout(() => {
      onClose();
    }, 7500);
  };


  // Emojis/Phrases for funny save animations
  const saveConfigs = {
    font: {
      emojis: ['✍️', '🎨', '✨', 'A', 'B', 'C', 'D'],
      phrases: [
        "Casting typography spell... 🧚‍♀️",
        "Polishing curves of letters... ✍️",
        "Applying notebook font magic! 💫"
      ],
      avatarAnim: { rotate: [0, 360], scale: [1, 1.15, 0.9, 1] }
    },
    size: {
      emojis: ['🔍', '📏', '➕', '↕️', '📈', '📊'],
      phrases: [
        "Stretching pages to fit... 📜",
        "Telescoping all paragraph widths... 🔭",
        "Font scaling applied! 🔍"
      ],
      avatarAnim: { scale: [1, 1.3, 0.8, 1], y: [0, -10, 5, 0] }
    },
    avatar: {
      emojis: ['🎭', '👕', '👗', '💅', '🧬', '🕶️'],
      phrases: [
        `Recompiling companion DNA... 🧬`,
        "Polishing avatar pixels... 🎨",
        "Evolved avatar shape applied! ✨"
      ],
      avatarAnim: { rotateY: [0, 720], scale: [1, 1.2, 0.9, 1] }
    },
    voice: {
      emojis: ['🗣️', '🎙️', '💬', '🔊', '🎵', '🎧'],
      phrases: [
        `Clearing companion's throat... 🗣️`,
        "Calibrating pitch arrays... 🎙️",
        "Vocal harmonics fully loaded! 🔊"
      ],
      avatarAnim: { scale: [1, 1.05, 0.95, 1.1, 1], x: [0, -4, 4, -4, 0] }
    },
    general: {
      emojis: ['⚙️', '🔧', '⚡', '🤖', '🔋'],
      phrases: [
        "Tweaking dashboard cogwheels... ⚙️",
        "Aligning matrix coordinates... 🔧",
        "Application settings updated! ⚡"
      ],
      avatarAnim: { rotate: [0, 15, -15, 0], y: [0, -8, 0] }
    }
  };

  const currentSaveConfig = saveConfigs[saveType];

  return (
    <Dialog open={isOpen} onOpenChange={() => { if (!isSaving) onClose(); }}>
      <DialogContent 
        showCloseButton={!isSaving}
        className={`transition-all duration-500 font-kalam ${
          isSaving 
            ? 'fixed inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !max-w-none !h-screen !bg-transparent !border-0 !shadow-none !p-0 !outline-none !rounded-none' 
            : 'max-w-5xl w-full border-2 border-[#2d2d2d] rounded-2xl shadow-2xl bg-[#fefdfb]/90 backdrop-blur-md p-6'
        }`}
      >
        <AnimatePresence mode="wait">
          {!isSaving ? (
            <motion.div
              key="settings-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-5"
            >
              <DialogHeader>
                <DialogTitle className="font-caveat text-3xl font-bold flex items-center gap-2 border-b-2 border-slate-700/10 pb-2">
                  <Settings className="w-6 h-6 text-purple-600 animate-spin-slow" />
                  Profile Settings
                </DialogTitle>
              </DialogHeader>

              <ScrollArea className="max-h-[70vh] pr-2 overflow-y-auto">
                <div className="space-y-6 pt-2">
                  
                  {/* SECTION 1: COMPANION AVATAR & NAME */}
                  <div className="space-y-4 p-2">
                    <h3 className="font-caveat text-xl font-bold text-slate-700 flex items-center gap-2 border-b border-[#2d2d2d]/10 pb-1">
                      <User className="w-5 h-5 text-purple-500" />
                      1. Companion Persona & Avatar
                    </h3>
                    
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'classic', label: 'Classic' },
                        { id: 'sakura', label: 'Sakura' },
                        { id: 'ansh', label: 'Ansh' },
                        { id: 'mary', label: 'Mary' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setLocalAvatar(item.id)}
                          className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                            localAvatar === item.id 
                              ? 'border-[#2d2d2d] bg-[#f5f0e6]/60 shadow-md scale-105' 
                              : 'border-slate-200 bg-white/50 hover:bg-slate-50'
                          }`}
                        >
                          <img 
                            src={getAiAvatarUrl(item.id)} 
                            alt={item.label} 
                            className="w-10 h-10 object-contain rounded-full border border-black/5" 
                          />
                          <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Companion Name</Label>
                      <Input
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        className="journal-input h-10 border-2 border-slate-400 bg-white"
                        placeholder="e.g. Potato"
                      />
                    </div>
                  </div>

                  <div className="border-t border-[#2d2d2d]/10 my-4" />

                  {/* SECTION 2: APPEARANCE */}
                  <div className="space-y-4 p-4">
                    <h3 className="font-caveat text-xl font-bold text-slate-700 flex items-center gap-2 border-b border-[#2d2d2d]/10 pb-1">
                      <Type className="w-5 h-5 text-pink-500" />
                      2. Notebook Typography
                    </h3>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Font Style</Label>
                      <Select 
                        value={localFont} 
                        onValueChange={(v) => setLocalFont(v as FontFamily)}
                      >
                        <SelectTrigger className="journal-input border-2 border-slate-400 bg-white h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                          {[
                            { value: 'kalam', label: 'Kalam (Default)' },
                            { value: 'caveat', label: 'Caveat' },
                            { value: 'indie', label: 'Indie Flower' },
                            { value: 'patrick', label: 'Patrick Hand' },
                            { value: 'architects', label: 'Architects Daughter' },
                          ].map(font => (
                            <SelectItem key={font.value} value={font.value} className="font-kalam">
                              <span style={{ fontFamily: font.value === 'kalam' ? 'Kalam' : font.value === 'caveat' ? 'Caveat' : font.value === 'indie' ? 'Indie Flower' : font.value === 'patrick' ? 'Patrick Hand' : 'Architects Daughter' }}>
                                {font.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-bold">Font Size</Label>
                        <span className="font-caveat text-lg font-bold">{localFontSize}px</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 rounded-full border-2 border-[#2d2d2d] bg-white hover:bg-slate-50"
                          onClick={() => setLocalFontSize(Math.max(12, localFontSize - 1))}
                          disabled={localFontSize <= 12}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Slider 
                          value={[localFontSize]} 
                          onValueChange={(v) => setLocalFontSize(v[0])}
                          min={12}
                          max={24}
                          step={1}
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-8 w-8 rounded-full border-2 border-[#2d2d2d] bg-white hover:bg-slate-50"
                          onClick={() => setLocalFontSize(Math.min(24, localFontSize + 1))}
                          disabled={localFontSize >= 24}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#2d2d2d]/10 my-4" />

                  {/* SECTION 3: VOCAL DIALECTS & SANDBOX */}
                  <div className="space-y-4 p-4">
                    <h3 className="font-caveat text-xl font-bold text-slate-700 flex items-center gap-2 border-b border-[#2d2d2d]/10 pb-1">
                      <Volume2 className="w-5 h-5 text-cyan-500" />
                      3. Vocal Settings & Playground
                    </h3>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Preferred Language</Label>
                      <Select 
                        value={localLanguage} 
                        onValueChange={(v) => setLocalLanguage(v)}
                      >
                        <SelectTrigger className="journal-input border-2 border-slate-400 bg-white h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                          <SelectItem value="Auto-detect" className="font-kalam">Auto-detect</SelectItem>
                          <SelectItem value="English" className="font-kalam">English</SelectItem>
                          <SelectItem value="Hindi" className="font-kalam">Hindi (हिन्दी)</SelectItem>
                          <SelectItem value="Gujarati" className="font-kalam">Gujarati (ગુજરાતી)</SelectItem>
                          <SelectItem value="Japanese" className="font-kalam">Japanese (日本語)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Companion Voice Model</Label>
                      <div className="flex gap-2 items-center">
                        <Select 
                          value={localVoice} 
                          onValueChange={(v) => {
                            setLocalVoice(v);
                            stopSampleAudio();
                          }}
                        >
                          <SelectTrigger className="journal-input border-2 border-slate-400 bg-white h-10 flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                            <SelectItem value="Mei" className="font-kalam">Mei (Female Multilingual)</SelectItem>
                            <SelectItem value="Ansh" className="font-kalam">Mary (American Young Female)</SelectItem>
                            <SelectItem value="Mary" className="font-kalam">
                              Ansh (Young Male)
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          onClick={() => isPlayingSample ? stopSampleAudio() : playSampleAudio(localVoice)}
                          className={`h-10 px-3 border-2 border-[#2d2d2d] flex items-center gap-1.5 font-bold shrink-0 ${
                            isPlayingSample ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-white hover:bg-slate-50'
                          }`}
                          title={isPlayingSample ? "Stop playing sample file" : "Play high-quality sample file"}
                        >
                          {isPlayingSample ? <Square className="w-4 h-4 fill-red-600" /> : <Volume2 className="w-4 h-4 text-cyan-600 animate-pulse" />}
                          {isPlayingSample ? "Stop" : "Sample MP3"}
                        </Button>
                      </div>
                    </div>


                    {/* AI Agent testing playground */}
                    <div className="p-4 bg-slate-100/70 border border-slate-300 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Voice Testing Playground</Label>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={testText}
                          onChange={(e) => setTestText(e.target.value)}
                          className="flex-1 h-9 text-xs border border-slate-300 bg-white"
                          placeholder="Type something to speak..."
                        />
                        <Button
                          onClick={speakPlaygroundTest}
                          size="sm"
                          className="h-9 px-3 bg-slate-700 hover:bg-slate-800 text-white flex items-center gap-1"
                        >
                          {isTestSpeaking ? <Square className="w-3 h-3 text-red-400 fill-red-400" /> : <Play className="w-3 h-3 text-green-400 fill-green-400" />}
                          {isTestSpeaking ? "Stop" : "Test"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#2d2d2d]/10 my-4" />

                  {/* SECTION 4: CURRENCY PREFERENCE */}
                  <div className="space-y-4 p-4">
                    <h3 className="font-caveat text-xl font-bold text-slate-700 flex items-center gap-2 border-b border-[#2d2d2d]/10 pb-1">
                      <Coins className="w-5 h-5 text-emerald-500" />
                      4. Preferred Currency
                    </h3>

                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Default Currency</Label>
                      <Select 
                        value={localCurrency} 
                        onValueChange={(v) => setLocalCurrency(v)}
                      >
                        <SelectTrigger className="journal-input border-2 border-slate-400 bg-white h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#fefdfb] border-2 border-[#2d2d2d]">
                          {SUPPORTED_CURRENCIES.map(curr => (
                            <SelectItem key={curr.code} value={curr.code} className="font-kalam">
                              {curr.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Typography Live Preview */}
                  <div className="p-4 bg-[#f9f7f4] rounded-xl border-2 border-slate-400 mt-4 select-none">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Typography Preview:</span>
                    <p className="text-center italic" style={{ 
                      fontFamily: localFont === 'kalam' ? 'Kalam' : localFont === 'caveat' ? 'Caveat' : localFont === 'indie' ? 'Indie Flower' : localFont === 'patrick' ? 'Patrick Hand' : 'Architects Daughter',
                      fontSize: `${localFontSize}px`
                    }}>
                      "The notebook ink bends to your character curves. 12345"
                    </p>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex gap-3 justify-end pt-3 border-t-2 border-slate-700/10">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="border-2 border-slate-500 bg-white hover:bg-slate-50 rounded-xl px-5 h-11 text-base"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  className="bg-[#2d2d2d] text-[#fdfbf7] hover:bg-[#3d3d3d] border-2 border-black rounded-xl px-6 h-11 text-base shadow-md transition-transform active:scale-95"
                >
                  Save Settings
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="saving-screen"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/25 backdrop-blur-md overflow-hidden pointer-events-auto"
            >
              {/* Animated background gradient orbs */}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <motion.div
                  animate={{
                    x: [-120, 120, -120],
                    y: [-80, 80, -80],
                    scale: [1, 1.25, 0.9, 1],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 blur-3xl"
                />
                <motion.div
                  animate={{
                    x: [120, -120, 120],
                    y: [80, -80, 80],
                    scale: [1.2, 0.95, 1.2],
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 blur-3xl"
                />
              </div>

              {/* Centered card containing the saving animation */}
              <div className="relative max-w-sm w-full p-8 bg-white/75 backdrop-blur-xl border-2 border-[#2d2d2d] rounded-2xl shadow-2xl flex flex-col items-center justify-center font-kalam text-center border-dashed z-10">
                {/* Emojis floating up */}
                {currentSaveConfig.emojis.map((emoji, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ 
                      opacity: 0, 
                      y: 20, 
                      x: (Math.random() - 0.5) * 60, 
                      scale: 0.5 
                    }}
                    animate={{ 
                      opacity: [0, 1, 1, 0], 
                      y: -100, 
                      x: (Math.random() - 0.5) * 100, 
                      scale: [0.5, 1.2, 1, 0.8],
                      rotate: (Math.random() - 0.5) * 45
                    }}
                    transition={{ 
                      duration: 2.2, 
                      delay: idx * 0.25, 
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    className="absolute text-2xl pointer-events-none select-none"
                    style={{ bottom: "60px" }}
                  >
                    {emoji}
                  </motion.span>
                ))}

                {/* Pulsing Avatar Container */}
                <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                  <motion.div
                    animate={{
                      borderRadius: [
                        "48% 52% 55% 45% / 55% 45% 48% 52%",
                        "52% 48% 40% 60% / 40% 60% 52% 48%",
                        "45% 55% 50% 50% / 50% 50% 45% 55%",
                        "48% 52% 55% 45% / 55% 45% 48% 52%"
                      ],
                      rotate: 360
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-2 border-2 border-dashed border-[#2d2d2d]/30"
                  />
                  
                  <motion.div
                    animate={currentSaveConfig.avatarAnim}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-full bg-white border-2 border-[#2d2d2d] flex items-center justify-center p-2 shadow-md overflow-hidden"
                  >
                    <img 
                      src={getAiAvatarUrl(localAvatar)} 
                      alt={localName} 
                      className="w-16 h-16 object-contain"
                    />
                  </motion.div>
                </div>

                {/* Humorous changing status text */}
                <div className="h-14 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={phraseIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-lg font-bold text-[#2d2d2d]"
                    >
                      {currentSaveConfig.phrases[phraseIdx]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  className="text-xs text-slate-500 italic mt-2"
                >
                  "Applying customizations... We value your voice! ✨"
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
