"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, Send, Sparkles, TrendingUp, Target, 
  Wallet, CheckSquare, Lightbulb, Zap, User, 
  Trash2, BarChart3
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export function AIAgentPage() {
  const { aiMessages, sendAIMessage, clearAIChat, stats } = useApp();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const message = input;
    setInput('');
    setIsTyping(true);
    
    await sendAIMessage(message);
    setIsTyping(false);
  };

  const handleSuggestion = async (query: string) => {
    setIsTyping(true);
    await sendAIMessage(query);
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
            <h1 className="text-2xl font-bold">JARVIS</h1>
            <p className="text-sm text-slate-500">Your Personal Life OS Assistant</p>
          </div>
        </div>
        <div className="flex gap-2">
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
      <Card className="flex-1 border-0 shadow-lg overflow-hidden flex flex-col">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          <div className="space-y-4">
            {aiMessages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
          <div className="px-4 py-3 border-t bg-slate-50/50">
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
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask JARVIS anything about your life, goals, finances..."
              className="flex-1 h-12 rounded-xl"
            />
            <Button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="h-12 px-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
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
