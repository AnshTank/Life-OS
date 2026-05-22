"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Minimize2, Maximize2, Sparkles, MessageSquare, Zap, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export function JarvisCompanion({ currentPage }: JarvisCompanionProps) {
  const { aiMessages, sendAIMessage, stats, tasks, goals, habits } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [contextualTip, setContextualTip] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    
    await sendAIMessage(message);
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
    await sendAIMessage(suggestion);
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
              {/* Pulsing ring */}
              <span className="absolute inset-0 rounded-full bg-[#9b8ab8] animate-ping opacity-30" />
              
              {/* Main button */}
              <div className="relative w-16 h-16 rounded-full bg-[#fefdfb] border-2 border-[#2d2d2d] shadow-lg flex items-center justify-center transition-transform group-hover:scale-110">
                <img 
                  src="/jarvis-character.png" 
                  alt="JARVIS" 
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
                width: isFullScreen ? '90%' : isMinimized ? 288 : 384,
                height: isFullScreen ? '85%' : isMinimized ? 'auto' : 500,
                right: isFullScreen ? '5%' : 24,
                bottom: isFullScreen ? '7.5%' : 24,
                top: isFullScreen ? '7.5%' : 'auto',
              }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed z-50 flex flex-col bg-[#fefdfb] border-2 border-[#2d2d2d] rounded-2xl shadow-2xl overflow-hidden`}
              style={{ maxHeight: isFullScreen ? '90vh' : 'auto' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-[#f5f0e6] border-b-2 border-[#2d2d2d] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#2d2d2d] flex items-center justify-center p-1">
                    <img 
                      src="/jarvis-character.png" 
                      alt="JARVIS" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-bold handwritten text-lg leading-none">JARVIS</p>
                    <p className="text-xs text-[#5a5a5a] handwritten-sm">Life OS Companion</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!isFullScreen && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-[#e8e4dc]"
                      onClick={() => setIsMinimized(!isMinimized)}
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                  )}
                   <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-[#e8e4dc]"
                      onClick={() => {
                        setIsFullScreen(!isFullScreen);
                        setIsMinimized(false);
                      }}
                    >
                      {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {!isMinimized && (
                <div className="flex flex-1 overflow-hidden">
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

                  <div className="flex flex-col flex-1 min-w-0">
                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4 bg-white/50">
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
                                  <img src="/jarvis-character.png" alt="AI" className="w-5 h-5 object-contain" />
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
                    </ScrollArea>

                    {/* Quick Suggestions (Compact Mode) */}
                    {!isFullScreen && (
                      <div className="px-4 py-2 bg-[#faf9f7] border-t border-[#e0e0e0]">
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
                    <div className="p-4 bg-[#f5f0e6] border-t-2 border-[#2d2d2d]">
                      <div className="max-w-3xl mx-auto flex gap-3">
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-3 bg-[#fefdfb] border-2 border-[#5a5a5a] rounded-xl text-base handwritten focus:outline-none focus:border-[#2d2d2d] focus:ring-2 focus:ring-[#9b8ab8]/20 transition-all placeholder:text-[#8a8a8a]"
                          autoFocus
                        />
                        <Button 
                          onClick={handleSend}
                          disabled={!input.trim() || isTyping}
                          className="h-auto px-5 bg-[#2d2d2d] text-[#fdfbf7] hover:bg-[#3d3d3d] rounded-xl transition-transform active:scale-95"
                        >
                          <Send className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
