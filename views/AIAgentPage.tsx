"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, Sparkles, TrendingUp, Target, 
  Wallet, CheckSquare, Lightbulb, Zap, User, 
  Trash2, BarChart3, Mic, Phone
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAiAvatarUrl } from '@/components/SettingChangeOverlay';
// import { toast } from 'sonner';

interface SuggestionChip {
  icon: React.ElementType;
  label: string;
  query: string;
  color: string;
}

const suggestionChips: SuggestionChip[] = [
  { icon: Wallet, label: 'Portfolio Analysis', query: 'Analyze my investment portfolio and suggest improvements', color: 'bg-green-100 text-green-700' },
  { icon: Target, label: 'Goal Progress', query: 'How am I doing on my goals? What should I focus on?', color: 'bg-purple-100 text-purple-700' },
  { icon: CheckSquare, label: 'Task Priority', query: 'What are my highest priority tasks for today?', color: 'bg-blue-100 text-blue-700' },
  { icon: TrendingUp, label: 'SIP Advice', query: 'Should I increase my SIP amount?', color: 'bg-amber-100 text-amber-700' },
  { icon: BarChart3, label: 'Spending Review', query: 'Review my spending patterns this month', color: 'bg-rose-100 text-rose-700' },
  { icon: Lightbulb, label: 'Project Ideas', query: 'Suggest some side project ideas based on my skills', color: 'bg-cyan-100 text-cyan-700' },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 p-3 bg-slate-100 rounded-2xl rounded-tl-sm w-fit">
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
        className="w-2 h-2 bg-slate-400 rounded-full"
      />
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
        className="w-2 h-2 bg-slate-400 rounded-full"
      />
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
        className="w-2 h-2 bg-slate-400 rounded-full"
      />
    </div>
  );
}

function AIOrb() {
  return (
    <div className="relative w-16 h-16">
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-30 blur-md"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
      >
        <Sparkles className="w-8 h-8 text-white" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full" />
      </motion.div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-pink-400 rounded-full" />
      </motion.div>
    </div>
  );
}

function SoundwaveVisualizer() {
  return (
    <div className="flex items-center justify-center gap-[3px] h-6 px-2">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] bg-gradient-to-t from-purple-500 to-pink-500 rounded-full"
          animate={{
            height: [4, 20, 8, 16, 4],
          }}
          transition={{
            duration: 0.5 + Math.random() * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.04,
          }}
          style={{ minHeight: "4px" }}
        />
      ))}
    </div>
  );
}

function getFemaleVoice(lang: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(lang.toLowerCase().split('-')[0]));
  if (langVoices.length === 0) return undefined;

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

function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  let cleaned = text;
  cleaned = cleaned.replace(/[*_#`~]/g, ' ');
  cleaned = cleaned.replace(/`[^`]+`/g, ' ');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, ' ');
  cleaned = cleaned.replace(/!/g, '. ');
  cleaned = cleaned.replace(/\?/g, '. ');
  cleaned = cleaned.replace(/[:;]/g, ', ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

export function AIAgentPage() {
  const { aiMessages, sendAIMessage, clearAIChat, stats, aiName, aiAvatar, aiVoicePreference, aiLanguage } = useApp();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude?: number; longitude?: number }>({});
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isCallModeActive, setIsCallModeActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakOutput, setSpeakOutput] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const callTranscriptScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const callRecognitionRef = useRef<any>(null);
  const isInitialMount = useRef(true);

  // Play electronic hangup beep using Web Audio API
  const playHangupSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.12);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context beep error:", e);
    }
  };

  const isStopWord = (text: string): boolean => {
    const clean = text.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "");
    const words = clean.split(/\s+/);
    if (words.length > 3) return false;
    const stopWords = ["stop", "shop", "hang up", "hangup", "exit", "quit", "cancel", "shut up", "bye", "disconnect", "close"];
    return words.some(w => stopWords.includes(w));
  };

  // Scroll transcripts to bottom
  useEffect(() => {
    if (callTranscriptScrollRef.current) {
      callTranscriptScrollRef.current.scrollTop = callTranscriptScrollRef.current.scrollHeight;
    }
  }, [aiMessages]);

  const SpeechRecognition = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

  const startVoiceRecording = () => {
    if (!SpeechRecognition) return;
    setIsVoiceActive(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = async (event: any) => {
      const speechText = event.results[0][0].transcript;
      if (speechText.trim()) {
        setInput(speechText);
        setIsTyping(true);
        await sendAIMessage(speechText, { currentPage: 'ai', ...coordinates });
        setIsTyping(false);
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      console.warn("AIAgentPage Speech error:", e.error);
      setIsVoiceActive(false);
    };

    rec.onend = () => {
      setIsVoiceActive(false);
    };

    try {
      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      console.error("Failed to start voice recorder in page:", e);
      setIsVoiceActive(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsVoiceActive(false);
  };

  const startCall = () => {
    setIsCallModeActive(true);
  };

  const endCall = () => {
    setIsCallModeActive(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsVoiceActive(false);
  };

  // Continuous speech loop for AIAgentPage Call Mode
  useEffect(() => {
    if (!SpeechRecognition) return;

    let activeRec: any = null;
    let shouldListen = isCallModeActive && !isTyping;

    const startCallListening = () => {
      if (!shouldListen) return;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;

      // Select language
      rec.lang = aiLanguage === 'Hindi' ? 'hi-IN' :
                 aiLanguage === 'Gujarati' ? 'gu-IN' :
                 aiLanguage === 'Japanese' ? 'ja-JP' :
                 aiLanguage === 'English' ? 'en-US' : 'en-US';

      rec.onresult = async (event: any) => {
        let hasInterimText = false;
        let finalSpeechText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            finalSpeechText = text;
          } else if (text.trim().length > 0) {
            hasInterimText = true;
          }
        }

        // Zero-latency barge-in: cut off speech synthesis the moment a syllable is detected
        if (hasInterimText || finalSpeechText) {
          if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
          }
        }

        if (finalSpeechText.trim()) {
          const cleanText = finalSpeechText.trim();
          // Intercept layman stop/hangup commands locally
          if (isStopWord(cleanText)) {
            playHangupSound();
            endCall();
            return;
          }

          setIsTyping(true);
          await sendAIMessage(cleanText, { currentPage: 'ai', isCallMode: true, ...coordinates });
          setIsTyping(false);
        }
      };


      rec.onerror = (e: any) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        console.warn("AIAgentPage Call recognition error:", e.error);
        setIsVoiceActive(false);
      };

      rec.onend = () => {
        setIsVoiceActive(false);
        if (shouldListen) {
          setTimeout(() => {
            startCallListening();
          }, 300);
        }
      };

      try {
        rec.start();
        activeRec = rec;
        callRecognitionRef.current = rec;
        setIsVoiceActive(true);
      } catch (err) {
        console.error("Failed to start call SpeechRecognition in page:", err);
        setIsVoiceActive(false);
      }
    };

    if (shouldListen) {
      startCallListening();
    } else {
      setIsVoiceActive(false);
    }

    return () => {
      shouldListen = false;
      if (activeRec) {
        try {
          activeRec.onend = null;
          activeRec.onerror = null;
          activeRec.stop();
        } catch (e) {}
      }
    };
  }, [isCallModeActive, isTyping, aiLanguage, coordinates]);
  // Clear any queued browser-level SpeechSynthesis on mount (prevents speak on page reload/refresh)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Speech synthesis for AI responses
  useEffect(() => {
    if (aiMessages.length <= 1 || !speakOutput || !isCallModeActive) return;

    const lastMessage = aiMessages[aiMessages.length - 1];
    
    // Explicitly do not speak the default intro greeting welcome message
    if (lastMessage.role === 'assistant' && (
      lastMessage.content.includes("your Life OS companion") || 
      lastMessage.content.includes("What would you like to know") ||
      lastMessage.content.includes("How can I help you today")
    )) {
      return;
    }

    // Skip speaking on first render / page load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (lastMessage.role === 'assistant' && typeof window !== 'undefined' && window.speechSynthesis) {
      const rawContent = lastMessage.content;
      const cleanText = cleanTextForSpeech(rawContent);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();

      // Adjust voice pitch/rate based on emotional keywords/emojis in raw message
      let pitch = 1.0;
      let rate = 1.0;

      const happyKeywords = ['😃', '😊', '🎉', '❤️', '👍', 'smile', 'happy', 'great', 'awesome', 'excited', '😄', '😂'];
      const sadKeywords = ['😢', '😭', 'sad', 'sorry', 'bad', 'wrong', 'pain', 'disappointed'];
      const angryKeywords = ['😡', '😠', 'angry', 'annoyed', 'irritated', 'stop'];

      if (happyKeywords.some(kw => rawContent.toLowerCase().includes(kw))) {
        pitch = 1.15;
        rate = 1.05;
      } else if (sadKeywords.some(kw => rawContent.toLowerCase().includes(kw))) {
        pitch = 0.9;
        rate = 0.9;
      } else if (angryKeywords.some(kw => rawContent.toLowerCase().includes(kw))) {
        pitch = 0.95;
        rate = 1.1;
      }

      utterance.pitch = pitch;
      utterance.rate = rate;

      // Prioritize setting language over characters
      if (aiLanguage === 'Hindi') {
        utterance.lang = 'hi-IN';
      } else if (aiLanguage === 'Gujarati') {
        utterance.lang = 'gu-IN';
      } else if (aiLanguage === 'Japanese') {
        utterance.lang = 'ja-JP';
      } else if (aiLanguage === 'English') {
        utterance.lang = 'en-US';
      } else {
        // Fallback to auto-detecting character checks
        const hasDevanagari = /[\u0900-\u097F]/.test(rawContent);
        const hasGujarati = /[\u0A80-\u0AFF]/.test(rawContent);
        if (hasDevanagari) utterance.lang = 'hi-IN';
        else if (hasGujarati) utterance.lang = 'gu-IN';
        else utterance.lang = 'en-US';
      }

      const matchVoice = getSelectedVoice(utterance.lang, aiVoicePreference, voices);
      if (matchVoice) {
        utterance.voice = matchVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [aiMessages, speakOutput, isCallModeActive, aiVoicePreference, aiLanguage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages, isTyping]);

  // Capture user coordinates on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation not enabled/available:", error.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 600000 }
      );
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const message = input;
    setInput('');
    setIsTyping(true);
    
    await sendAIMessage(message, { currentPage: 'ai', ...coordinates });
    setIsTyping(false);
  };

  const handleSuggestion = async (query: string) => {
    setIsTyping(true);
    await sendAIMessage(query, { currentPage: 'ai', ...coordinates });
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Contextual response generation - used by the AI
  // const generateContextualResponse = (query: string) => {
  //   // Response logic here
  // };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AIOrb />
          <div>
            <h1 className="text-2xl font-bold">{aiName}</h1>
            <p className="text-sm text-slate-500">Your Personal Life OS Assistant</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`font-kalam font-bold hover:bg-slate-100 ${isCallModeActive ? 'text-green-600 animate-pulse' : 'text-slate-500'}`}
            onClick={isCallModeActive ? endCall : startCall}
            title={isCallModeActive ? "End active voice call" : "Start active voice call"}
          >
            <Phone className="w-4 h-4 mr-1.5" />
            {isCallModeActive ? "End Call" : "Voice Call"}
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAIChat}>
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
          <Badge className="bg-purple-100 text-purple-700">
            <Zap className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 border-2 shadow-2xl overflow-hidden flex flex-col bg-white/70 backdrop-blur-xl animate-neon-pulse">
        {isCallModeActive ? (
          /* Holographic Glassmorphic Call Screen Overlay */
          <div className="flex-1 flex flex-col items-center justify-between p-12 bg-white/10 backdrop-blur-2xl border-none relative overflow-hidden font-kalam select-none min-h-[400px]">
            {/* Animated floating background neon orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
              <motion.div
                animate={{
                  x: [0, 80, -40, 0],
                  y: [0, -60, 40, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-purple-400/35 blur-3xl animate-pulse"
              />
              <motion.div
                animate={{
                  x: [0, -80, 50, 0],
                  y: [0, 70, -30, 0],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-pink-400/35 blur-3xl animate-pulse"
              />
              <motion.div
                animate={{
                  x: [0, 50, -60, 0],
                  y: [0, 40, 80, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full bg-cyan-400/25 blur-3xl animate-pulse"
              />
            </div>

            {/* Top status */}
            <div className="text-center z-10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                <p className="text-xs text-slate-700 font-bold uppercase tracking-wider">Voice Call Live</p>
              </div>
              <h3 className="font-caveat text-4xl font-bold text-slate-800">{aiName}</h3>
            </div>

            {/* Center pulsating orb with Sketchy theme */}
            <div className="flex flex-col items-center justify-center z-10 gap-6">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Outer sketchy dashed border */}
                <motion.div
                  animate={{
                    rotate: -360,
                    borderRadius: [
                      "48% 52% 55% 45% / 55% 45% 48% 52%",
                      "52% 48% 40% 60% / 40% 60% 52% 48%",
                      "45% 55% 50% 50% / 50% 50% 45% 55%",
                      "48% 52% 55% 45% / 55% 45% 48% 52%"
                    ]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-4 border-2 border-dashed border-slate-700/30"
                />
                {/* Morphing sketchy orb */}
                <motion.div
                  animate={{
                    scale: isVoiceActive ? [1, 1.15, 1.05, 1.2, 1] : isSpeaking ? [1, 1.1, 1.02, 1.12, 1] : [1, 1.02, 0.98, 1.03, 1],
                    borderRadius: [
                      "50% 50% 50% 50% / 50% 50% 50% 50%",
                      "45% 55% 48% 52% / 52% 48% 55% 45%",
                      "40% 60% 55% 45% / 45% 55% 40% 60%",
                      "55% 45% 40% 60% / 60% 40% 55% 45%",
                      "50% 50% 50% 50% / 50% 50% 50% 50%"
                    ],
                    rotate: [0, 90, 180, 270, 360],
                    boxShadow: isVoiceActive
                      ? '0 0 35px rgba(155,138,184,0.6)'
                      : isSpeaking
                      ? '0 0 25px rgba(244,114,182,0.5)'
                      : '0 0 15px rgba(155,138,184,0.15)',
                  }}
                  transition={{ 
                    duration: isVoiceActive ? 2.5 : isSpeaking ? 3.5 : 6, 
                    repeat: Infinity, 
                    ease: 'easeInOut' 
                  }}
                  className="absolute inset-0 bg-gradient-to-tr from-purple-500/75 via-pink-400/75 to-cyan-400/75 opacity-90 border-2 border-slate-800"
                />
                <div className="absolute inset-2 bg-[#fefdfb] rounded-full flex items-center justify-center shadow-inner overflow-hidden border border-slate-700/20">
                  <img src={getAiAvatarUrl(aiAvatar)} alt={aiName} className="w-24 h-24 object-contain" />
                </div>
              </div>

              {/* Interactive soundwave display */}
              <div className="h-10 flex flex-col items-center justify-center gap-1.5">
                {isVoiceActive ? (
                  <>
                    <SoundwaveVisualizer />
                    <span className="text-xs text-purple-700 font-bold italic animate-pulse">listening...</span>
                  </>
                ) : isSpeaking ? (
                  <>
                    <SoundwaveVisualizer />
                    <span className="text-xs text-pink-700 font-bold italic animate-pulse">speaking...</span>
                  </>
                ) : isTyping ? (
                  <span className="text-sm text-slate-600 font-bold animate-pulse">thinking...</span>
                ) : (
                  <span className="text-sm text-slate-500">Say something to talk</span>
                )}
              </div>
            </div>
            {/* Real-time floating subtitles/transcript cards */}
            <div className="w-full max-w-xl flex flex-col gap-3 z-10 mt-2 pointer-events-auto select-text">
              <div 
                ref={callTranscriptScrollRef}
                className="max-h-60 overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-purple-200"
              >
                {aiMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 0.9, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className={`p-4 rounded-2xl border text-sm max-w-[85%] ${
                      msg.role === 'user'
                        ? 'self-end bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/20 text-slate-800'
                        : 'self-start bg-white/70 backdrop-blur-md border-black/10 text-slate-800'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block mb-1">
                      {msg.role === 'user' ? 'You' : aiName}
                    </span>
                    <p className="handwritten whitespace-pre-wrap">{msg.content}</p>
                  </motion.div>
                ))}
              </div>
            </div>


            {/* Hang Up Action */}
            <div className="z-10 w-full max-w-xs">
              <Button 
                onClick={endCall}
                className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center gap-2 border-2 border-red-700 shadow-md font-bold text-base transition-transform active:scale-95"
              >
                <Phone className="w-5 h-5 rotate-[135deg]" />
                Hang Up
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {aiMessages.map((message, index) => (
                    <motion.div
                      key={index}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                            : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className={`p-3 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-tr-sm'
                            : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                        }`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <TypingIndicator />
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Suggestion Chips */}
            {aiMessages.length < 3 && (
              <div className="px-4 py-3 border-t border-slate-200/40 bg-slate-50/30 backdrop-blur-sm">
                <p className="text-xs text-slate-500 mb-2">Try asking about:</p>
                <div className="flex gap-2 flex-wrap">
                  {suggestionChips.map((chip, index) => {
                    const Icon = chip.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSuggestion(chip.query)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 ${chip.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200/50 bg-white/45 backdrop-blur-md">
              <div className="flex gap-2">
                {isVoiceActive ? (
                  <div className="flex-1 flex items-center justify-between px-4 h-12 bg-white/60 border-2 border-purple-400 rounded-xl shadow-inner">
                    <span className="text-purple-600 text-sm font-semibold animate-pulse">Listening...</span>
                    <SoundwaveVisualizer />
                  </div>
                ) : (
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask ${aiName} anything about your life, goals, finances...`}
                    className="flex-1 h-12 rounded-xl bg-white/80 border-2 focus:border-purple-400"
                  />
                )}
                <Button 
                  onClick={isVoiceActive ? stopVoiceRecording : startVoiceRecording}
                  className={`h-12 px-4 border-2 border-purple-200 ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-700 hover:bg-slate-50'} rounded-xl transition-all`}
                  title="Speak command"
                >
                  <Mic className="w-5 h-5" />
                </Button>
                <Button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="h-12 px-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl transition-transform active:scale-95 shadow-md"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        {[
          { label: 'Tasks', value: stats.pendingTasks, icon: CheckSquare },
          { label: 'Goals', value: stats.activeGoals, icon: Target },
          { label: 'Portfolio', value: `$${(stats.portfolioValue / 1000).toFixed(0)}k`, icon: Wallet },
          { label: 'Habits', value: stats.activeStreaks, icon: Sparkles },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2">
                <Icon className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
