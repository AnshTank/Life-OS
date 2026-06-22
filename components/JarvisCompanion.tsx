"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Minimize2, Maximize2, Sparkles, MessageSquare, Zap, ArrowRight, Mic, Volume2, Phone, Trash2, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAiAvatarUrl } from '@/components/SettingChangeOverlay';
import { toast } from 'sonner';

interface JarvisCompanionProps {
  currentPage: string;
}

const quickSuggestions: Record<string, string[]> = {
  dashboard: ['How am I doing today?', 'What should I focus on?', 'Show my priorities'],
  tasks: ['Which task first?', 'Help me prioritize', 'What\'s overdue?'],
  goals: ['Goal progress?', 'Am I on track?', 'Suggest next milestone'],
  habits: ['Habit streaks?', 'Which habit to build?', 'Missed any habits?'],
  money: ['Portfolio status?', 'Investment advice?', 'Spending review'],
  calendar: ['What\'s today?', 'Upcoming events?', 'Schedule suggestion'],
  projects: ['Project status?', 'Time tracking?', 'Earnings this month?'],
};

const fullScreenActions = [
  { label: 'Plan My Day', prompt: 'Help me plan my day based on my tasks and goals.', icon: Calendar },
  { label: 'Financial Review', prompt: 'Analyze my spending and investments.', icon: Zap },
  { label: 'Journaling Session', prompt: 'I want to reflect on my day. Ask me some questions.', icon: MessageSquare },
  { label: 'Motivation Boost', prompt: 'I\'m feeling stuck. Give me some motivation.', icon: Sparkles },
];

import { Calendar } from 'lucide-react'; // Import missing icon

function SoundwaveVisualizer() {
  return (
    <div className="flex items-center justify-center gap-[3px] h-6 px-2">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] bg-gradient-to-t from-[#9b8ab8] to-[#d49191] rounded-full"
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

export function JarvisCompanion({ currentPage }: JarvisCompanionProps) {
  const { 
    aiMessages, sendAIMessage, stats, tasks, goals, habits, aiName, aiAvatar, aiVoicePreference, aiLanguage,
    conversations, activeConversationId, loadConversation, startNewConversation, deleteConversation, deleteConversationsByDateRange
  } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [contextualTip, setContextualTip] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude?: number; longitude?: number }>({});  const messagesEndRef = useRef<HTMLDivElement>(null);
  const callTranscriptScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll call transcripts to bottom
  useEffect(() => {
    if (callTranscriptScrollRef.current) {
      callTranscriptScrollRef.current.scrollTop = callTranscriptScrollRef.current.scrollHeight;
    }
  }, [aiMessages]);


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

  const SpeechRecognition = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

  const [isWakeWordListening, setIsWakeWordListening] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakOutput, setSpeakOutput] = useState(true);
  const [isCallModeActive, setIsCallModeActive] = useState(false);

  const recognitionRef = useRef<any>(null);
  const wakeWordRecognitionRef = useRef<any>(null);
  const callRecognitionRef = useRef<any>(null);

  // Play electronic wake beep using Web Audio API
  const playWakeSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.12);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context beep error:", e);
    }
  };

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

  const startVoiceRecording = () => {
    if (!SpeechRecognition) return;
    setIsVoiceActive(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
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
        await sendAIMessage(speechText, { currentPage, ...coordinates });
        setIsTyping(false);
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      console.warn("Speech recognition error:", e.error);
      setIsVoiceActive(false);
    };

    rec.onend = () => {
      setIsVoiceActive(false);
    };

    try {
      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      console.error("Failed to start voice recorder:", e);
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
    setIsOpen(true);
    setIsMinimized(false);
    playWakeSound();
  };

  const endCall = () => {
    setIsCallModeActive(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsVoiceActive(false);
  };

  // Call Mode continuous SpeechRecognition loop
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
          await sendAIMessage(cleanText, { currentPage, isCallMode: true, ...coordinates });
          setIsTyping(false);
        }
      };


      rec.onerror = (e: any) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        console.warn("Call speech recognition error:", e.error);
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
        console.error("Failed to start call SpeechRecognition:", err);
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
  }, [isCallModeActive, isTyping, aiLanguage, currentPage, coordinates]);

  // Background Wake Word listener ("hey potato")
  useEffect(() => {
    if (!SpeechRecognition) return;

    let activeRec: any = null;
    let shouldListen = isWakeWordListening && !isOpen && !isCallModeActive;

    const startWakeWordListening = () => {
      if (!shouldListen) return;

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const resultText = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        const triggerWord = `hey ${aiName.toLowerCase()}`;
        const triggerWord2 = aiName.toLowerCase();

        if (resultText.includes(triggerWord) || resultText.includes(triggerWord2) || resultText.includes("hey potato")) {
          setIsOpen(true);
          setUnreadCount(0);
          setIsMinimized(false);
          playWakeSound();
          setTimeout(() => {
            startVoiceRecording();
          }, 400);
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        console.warn("Wake word error:", e.error);
        if (e.error === 'not-allowed') {
          setIsWakeWordListening(false);
        }
      };

      rec.onend = () => {
        if (shouldListen) {
          setTimeout(() => {
            startWakeWordListening();
          }, 300);
        }
      };

      try {
        rec.start();
        activeRec = rec;
        wakeWordRecognitionRef.current = rec;
      } catch (e) {
        console.error("Failed to start wake word SpeechRecognition:", e);
      }
    };

    if (shouldListen) {
      startWakeWordListening();
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
  }, [isWakeWordListening, isOpen, isCallModeActive, aiName]);

  // Clear any queued browser-level SpeechSynthesis on mount (prevents speak on page reload/refresh)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const isInitialMount = useRef(true);
  // Speech synthesis for AI responses
  useEffect(() => {
    if (aiMessages.length <= 1 || !speakOutput) return;

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

  // Generate contextual tips based on current page and data
  useEffect(() => {
    const tips: Record<string, () => string> = {
      dashboard: () => {
        const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
        const activeGoals = goals.filter(g => g.status === 'active').length;
        return `You have ${pendingTasks} tasks and ${activeGoals} active goals today!`;
      },
      tasks: () => {
        const highPriority = tasks.filter(t => t.priorityScore >= 7 && t.status !== 'completed');
        return highPriority.length > 0 
          ? `Focus on "${highPriority[0]?.title}" first - highest priority!`
          : 'All high priority tasks done! Great job!';
      },
      goals: () => {
        const goal = goals.find(g => g.status === 'active' && g.progress < 100);
        return goal 
          ? `"${goal.title}" is at ${goal.progress}% - keep going!`
          : 'All goals on track! You\'re crushing it!';
      },
      habits: () => {
        const bestStreak = Math.max(...habits.map(h => h.streak), 0);
        return bestStreak > 0 
          ? `Your best streak is ${bestStreak} days! Don't break it!`
          : 'Start building habits today!';
      },
      money: () => {
        const pnl = stats.totalPnl;
        return pnl >= 0 
          ? `Portfolio up $${pnl.toLocaleString()}! 📈`
          : `Portfolio down $${Math.abs(pnl).toLocaleString()} - hold strong!`;
      },
    };

    const tipGenerator = tips[currentPage];
    if (tipGenerator) {
      setContextualTip(tipGenerator());
    }
  }, [currentPage, tasks, goals, habits, stats]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, isOpen, isFullScreen]);

  // Show notification dot for new messages when closed
  useEffect(() => {
    if (!isOpen && aiMessages.length > 1) {
      const lastMessage = aiMessages[aiMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [aiMessages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const message = input;
    setInput('');
    setIsTyping(true);
    
    await sendAIMessage(message, { currentPage, ...coordinates });
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = async (suggestion: string) => {
    setIsTyping(true);
    await sendAIMessage(suggestion, { currentPage, ...coordinates });
    setIsTyping(false);
  };

  const suggestions = quickSuggestions[currentPage] || ['How can you help me?'];

  return (
    <>
      {/* Floating JARVIS Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => {
                setIsOpen(true);
                setUnreadCount(0);
                setIsMinimized(false);
              }}
              className="relative group"
            >
              {/* Pulsing glow ring */}
              <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 blur-sm opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse" />
              
              {/* Main button */}
              <div className="relative w-16 h-16 rounded-full bg-white/80 backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(155,138,184,0.3)] flex items-center justify-center transition-transform group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(155,138,184,0.6)]">
                <img 
                  src={getAiAvatarUrl(aiAvatar)} 
                  alt={aiName} 
                  className="w-12 h-12 object-contain"
                />
              </div>
              
              {/* Notification badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-[#c97b7b] text-white text-xs rounded-full flex items-center justify-center border-2 border-[#fefdfb]">
                  {unreadCount}
                </span>
              )}
              
              {/* Tooltip */}
              {contextualTip && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute right-full mr-3 top-1/2 -translate-y-1/2 w-48 p-2 bg-[#fefdfb] border-2 border-[#2d2d2d] rounded-lg shadow-lg"
                >
                  <p className="text-xs handwritten text-[#2d2d2d]">{contextualTip}</p>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 w-3 h-3 bg-[#fefdfb] border-r-2 border-t-2 border-[#2d2d2d] rotate-45" />
                </motion.div>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for Full Screen */}
            {isFullScreen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                onClick={() => setIsFullScreen(false)}
              />
            )}

            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
              }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className={`fixed z-50 flex flex-col bg-white/75 backdrop-blur-xl border-2 rounded-2xl shadow-2xl overflow-hidden animate-neon-pulse`}
              style={{ 
                width: isFullScreen ? '90%' : isMinimized ? 288 : 384,
                height: isFullScreen ? '85%' : isMinimized ? 72 : 500,
                right: isFullScreen ? '5%' : 24,
                bottom: isFullScreen ? '7.5%' : 24,
                maxHeight: isFullScreen ? '90vh' : 'auto',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-[#f5f0e6]/60 backdrop-blur-md border-b border-black/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#2d2d2d] flex items-center justify-center p-1">
                    <img 
                      src={getAiAvatarUrl(aiAvatar)} 
                      alt={aiName} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-bold handwritten text-lg leading-none">{aiName}</p>
                    <p className="text-xs text-[#5a5a5a] handwritten-sm">Life OS Companion</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!isMinimized && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 hover:bg-[#e8e4dc] ${isWakeWordListening ? 'text-[#9b8ab8] animate-pulse' : 'text-[#5a5a5a]'}`}
                        onClick={() => setIsWakeWordListening(!isWakeWordListening)}
                        title={isWakeWordListening ? "Disable voice wakeup" : "Enable background voice wakeup ('Hey Potato')"}
                      >
                        <Mic className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 hover:bg-[#e8e4dc] ${isCallModeActive ? 'text-green-600 animate-pulse' : 'text-[#5a5a5a]'}`}
                        onClick={isCallModeActive ? endCall : startCall}
                        title={isCallModeActive ? "End active voice call" : "Start active voice call"}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 hover:bg-[#e8e4dc] ${showHistory ? 'text-purple-600 bg-[#e8e4dc]' : 'text-[#5a5a5a]'}`}
                        onClick={() => {
                          setShowHistory(!showHistory);
                          setIsFullScreen(false);
                        }}
                        title="Chat History Logs"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 hover:bg-[#e8e4dc] ${speakOutput ? 'text-green-600' : 'text-[#5a5a5a]'}`}
                        onClick={() => {
                          setSpeakOutput(!speakOutput);
                          if (speakOutput && typeof window !== 'undefined' && window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                          }
                          setIsSpeaking(false);
                        }}
                        title={speakOutput ? "Mute audio output" : "Unmute audio output"}
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-[#e8e4dc]"
                        onClick={() => {
                          setIsFullScreen(!isFullScreen);
                          setIsMinimized(false);
                        }}
                        title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                      >
                        {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </Button>
                    </>
                  )}

                  {!isFullScreen && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-[#e8e4dc]"
                      onClick={() => setIsMinimized(!isMinimized)}
                      title={isMinimized ? "Expand Companion" : "Collapse Companion"}
                    >
                      {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                    onClick={() => setIsOpen(false)}
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                isCallModeActive ? (
                  /* Holographic Call Screen */
                  <div className="flex-1 flex flex-col items-center justify-between p-8 bg-gradient-to-br from-[#f5f0e6]/90 via-[#fefdfb]/90 to-[#efe8f5]/90 backdrop-blur-xl relative overflow-hidden font-kalam select-none min-h-[350px]">
                    {/* Decorative background visualizer orb */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <motion.div
                        animate={{
                          scale: isSpeaking || isVoiceActive ? [1, 1.15, 1] : [1, 1.05, 1],
                          rotate: [0, 360],
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                        className="w-56 h-56 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 blur-2xl animate-pulse"
                      />
                    </div>

                    {/* Top status */}
                    <div className="text-center z-10">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        <p className="text-[10px] text-[#5a5a5a] font-bold uppercase tracking-wider">Voice Call Live</p>
                      </div>
                      <h3 className="font-caveat text-3xl font-bold text-slate-800">{aiName}</h3>
                    </div>

                    {/* Center pulsating orb with Sketchy theme */}
                    <div className="flex flex-col items-center justify-center z-10 gap-4">
                      <div className="relative w-28 h-28 flex items-center justify-center">
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
                          className="absolute -inset-3 border-2 border-dashed border-[#5a5a5a]/30"
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
                              ? '0 0 25px rgba(155,138,184,0.5)'
                              : isSpeaking
                              ? '0 0 20px rgba(244,114,182,0.4)'
                              : '0 0 10px rgba(155,138,184,0.1)',
                          }}
                          transition={{ 
                            duration: isVoiceActive ? 2.5 : isSpeaking ? 3.5 : 6, 
                            repeat: Infinity, 
                            ease: 'easeInOut' 
                          }}
                          className="absolute inset-0 bg-gradient-to-tr from-purple-400/75 via-pink-400/75 to-cyan-400/75 opacity-90 border-2 border-[#5a5a5a]"
                        />
                        <div className="absolute inset-1.5 bg-[#fefdfb] rounded-full flex items-center justify-center shadow-inner overflow-hidden border border-[#5a5a5a]/20">
                          <img src={getAiAvatarUrl(aiAvatar)} alt={aiName} className="w-16 h-16 object-contain" />
                        </div>
                      </div>

                      {/* Interactive soundwave display */}
                      <div className="h-10 flex flex-col items-center justify-center gap-1.5">
                        {isVoiceActive ? (
                          <>
                            <SoundwaveVisualizer />
                            <span className="text-[10px] text-purple-600 font-bold italic animate-pulse">listening...</span>
                          </>
                        ) : isSpeaking ? (
                          <>
                            <SoundwaveVisualizer />
                            <span className="text-[10px] text-pink-600 font-bold italic animate-pulse">speaking...</span>
                          </>
                        ) : isTyping ? (
                          <span className="text-xs text-slate-500 font-bold animate-pulse">thinking...</span>
                        ) : (
                          <span className="text-xs text-slate-400">Say something to talk</span>
                        )}                      </div>
                    </div>

                    {/* Compact scrollable transcripts area */}
                    <div className="w-full max-w-[320px] flex flex-col gap-2 z-10 pointer-events-auto select-text">
                      <div
                        ref={callTranscriptScrollRef}
                        className="max-h-[140px] overflow-y-auto pr-2 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-purple-200 text-xs"
                      >
                        {aiMessages.map((msg, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 0.9, y: 0, scale: 1 }}
                            className={`p-2.5 rounded-xl border ${
                              msg.role === 'user'
                                ? 'self-end bg-purple-500/10 border-purple-500/10 text-slate-800 max-w-[85%]'
                                : 'self-start bg-white/80 border-black/5 text-slate-800 max-w-[85%]'
                            }`}
                          >
                            <span className="text-[8px] uppercase font-bold tracking-wider opacity-60 block mb-0.5">
                              {msg.role === 'user' ? 'You' : aiName}
                            </span>
                            <p className="handwritten-sm whitespace-pre-wrap">{msg.content}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Hang Up Action */}
                    <div className="z-10 w-full max-w-[200px]">
                      <Button 
                        onClick={endCall}
                        className="w-full h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center gap-2 border-2 border-red-700 shadow-md font-bold text-sm transition-transform active:scale-95"
                      >
                        <Phone className="w-4 h-4 rotate-[135deg]" />
                        Hang Up
                      </Button>
                    </div>
                  </div>
                ) : showHistory ? (
                  /* Conversation History Panel */
                  <div className="flex-1 flex flex-col min-h-0 bg-[#fdfbf7] p-4 font-kalam select-text overflow-y-auto">
                    <div className="flex items-center justify-between mb-4 border-b border-black/10 pb-2 shrink-0">
                      <h3 className="font-caveat text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-600" /> Chat Logs (IST)
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowHistory(false)}
                        className="text-slate-500 hover:text-slate-800 text-xs h-7 px-2 border"
                      >
                        ← Back
                      </Button>
                    </div>

                    <Button 
                      onClick={() => {
                        startNewConversation();
                        setShowHistory(false);
                      }}
                      className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center justify-center gap-2 border-2 border-purple-800 shadow-sm font-bold text-sm mb-4 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Start New Chat
                    </Button>

                    <div className="p-3 bg-[#fff0f0] border border-red-200 rounded-xl space-y-2 mb-4 shrink-0">
                      <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Bulk Delete Logs</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="date" 
                          value={historyStartDate}
                          onChange={e => setHistoryStartDate(e.target.value)}
                          className="flex-1 text-[10px] px-1.5 py-1 border border-slate-200 rounded bg-white text-slate-800 outline-none w-20"
                        />
                        <span className="text-[10px] text-slate-400">to</span>
                        <input 
                          type="date" 
                          value={historyEndDate}
                          onChange={e => setHistoryEndDate(e.target.value)}
                          className="flex-1 text-[10px] px-1.5 py-1 border border-slate-200 rounded bg-white text-slate-800 outline-none w-20"
                        />
                        <Button 
                          onClick={async () => {
                            if (!historyStartDate && !historyEndDate) {
                              toast.error("Please select a date range first");
                              return;
                            }
                            if (confirm("Delete conversations in this range? This cannot be undone.")) {
                              await deleteConversationsByDateRange(historyStartDate, historyEndDate);
                              setHistoryStartDate('');
                              setHistoryEndDate('');
                            }
                          }}
                          size="icon" 
                          className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded-lg border border-red-700 shrink-0"
                          title="Delete range"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                      {conversations.map(c => {
                        const date = new Date(c.updatedAt);
                        const dateStr = new Intl.DateTimeFormat('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        }).format(date) + ' (IST)';

                        const isActive = activeConversationId === c.id;

                        return (
                          <div 
                            key={c.id}
                            className={`p-2.5 border-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                              isActive 
                                ? 'bg-purple-50/50 border-purple-500 shadow-sm' 
                                : 'bg-white border-[#2d2d2d]/10 hover:border-[#2d2d2d]/30'
                            }`}
                            onClick={() => {
                              loadConversation(c.id);
                              setShowHistory(false);
                            }}
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <h4 className="font-bold text-slate-800 truncate text-xs">{c.title || 'Conversation'}</h4>
                              <p className="text-[9px] text-slate-400 mt-0.5">{dateStr}</p>
                            </div>
                            <Button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm("Delete this conversation?")) {
                                  await deleteConversation(c.id);
                                }
                              }}
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                      {conversations.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-8">No saved chat sessions</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 min-h-0 overflow-hidden">
                  {/* Sidebar (Full Screen Only) */}
                  {isFullScreen && (
                    <div className="w-64 bg-[#faf9f7] border-r border-[#e0e0e0] p-4 hidden md:flex flex-col gap-4">
                      <h3 className="font-caveat text-xl">Quick Actions</h3>
                      <div className="space-y-2">
                        {fullScreenActions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestion(action.prompt)}
                            className="w-full text-left p-3 rounded-xl bg-white border border-[#e0e0e0] hover:border-[#2d2d2d] hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <action.icon className="w-4 h-4 text-[#9b8ab8]" />
                              <span className="font-bold handwritten-sm">{action.label}</span>
                            </div>
                            <p className="text-xs text-[#5a5a5a] line-clamp-2">{action.prompt}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-white/50 scrollbar-thin scrollbar-thumb-purple-200">
                      <div className="space-y-4 max-w-3xl mx-auto">
                        {aiMessages.map((message, index) => (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                                message.role === 'user' ? 'bg-[#2d2d2d] text-white' : 'bg-white border-[#2d2d2d]'
                              }`}>
                                {message.role === 'user' ? (
                                  <span className="text-xs font-bold">ME</span>
                                ) : (
                                  <img src={getAiAvatarUrl(aiAvatar)} alt="AI" className="w-5 h-5 object-contain" />
                                )}
                              </div>
                              <div 
                                className={`p-4 text-sm shadow-sm ${
                                  message.role === 'user'
                                    ? 'bg-[#2d2d2d] text-[#fdfbf7] rounded-2xl rounded-tr-sm'
                                    : 'bg-[#fefdfb] text-[#2d2d2d] border border-[#e0e0e0] rounded-2xl rounded-tl-sm'
                                }`}
                              >
                                <p className="handwritten whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="bg-[#fefdfb] border border-[#e0e0e0] p-4 rounded-2xl rounded-tl-sm ml-11">
                              <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-[#9b8ab8] rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-[#9b8ab8] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <span className="w-2 h-2 bg-[#9b8ab8] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>


                    {/* Quick Suggestions (Compact Mode) */}
                    {!isFullScreen && (
                      <div className="px-4 py-2 bg-white/40 border-t border-black/5">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                          {suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestion(suggestion)}
                              className="flex-shrink-0 px-3 py-1.5 text-xs bg-white text-[#5a5a5a] rounded-full border border-[#e0e0e0] hover:border-[#9b8ab8] hover:text-[#9b8ab8] transition-colors handwritten-sm whitespace-nowrap"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-[#f5f0e6]/60 backdrop-blur-md border-t border-black/10">
                      <div className="max-w-3xl mx-auto flex gap-3">
                        {isVoiceActive ? (
                          <div className="flex-1 flex items-center justify-between px-4 py-2 bg-white/70 border-2 border-[#9b8ab8] rounded-xl shadow-inner h-[50px]">
                            <span className="text-[#9b8ab8] text-sm font-bold italic animate-pulse">Listening to you...</span>
                            <SoundwaveVisualizer />
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Ask ${aiName}...`}
                            className="flex-1 px-4 py-3 bg-white/90 border-2 border-[#5a5a5a] rounded-xl text-base handwritten focus:outline-none focus:border-[#2d2d2d] focus:ring-2 focus:ring-[#9b8ab8]/20 transition-all placeholder:text-[#8a8a8a]"
                            autoFocus
                          />
                        )}
                        {isSpeaking && (
                          <Button 
                            onClick={() => {
                              if (typeof window !== 'undefined' && window.speechSynthesis) {
                                window.speechSynthesis.cancel();
                              }
                              setIsSpeaking(false);
                            }}
                            className="h-[50px] px-3 bg-red-500 hover:bg-red-600 text-white rounded-xl border-2 border-red-700 font-bold font-kalam text-xs transition-transform active:scale-95 shrink-0 animate-pulse"
                            title="Stop Speaking"
                          >
                            Stop ⏹️
                          </Button>
                        )}
                        <Button 
                          onClick={isVoiceActive ? stopVoiceRecording : startVoiceRecording}
                          className={`h-[50px] px-4 border-2 border-[#5a5a5a] ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-[#2d2d2d] hover:bg-[#f5f0e6]'} rounded-xl transition-all`}
                          title="Speak command"
                        >
                          <Mic className="w-5 h-5" />
                        </Button>
                        <Button 
                          onClick={handleSend}
                          disabled={!input.trim() || isTyping}
                          className="h-[50px] px-5 bg-[#2d2d2d] text-[#fdfbf7] hover:bg-[#3d3d3d] rounded-xl transition-transform active:scale-95"
                        >
                          <Send className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )
          }
        </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
