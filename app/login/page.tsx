"use client";

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Sparkles, ArrowRight, Star, Heart, Coffee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function LoginForm() {
  const { login } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.push(callbackUrl);
      }
    } catch (error) {
      // toast is handled in AppContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const success = await login('anshtank9@gmail.com', 'abc@123');
      if (success) {
        router.push(callbackUrl);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="paper-card p-8 shadow-xl relative overflow-hidden"
      >
        {/* Decorative corner doodle */}
        <div className="absolute -top-2 -right-2 text-2xl rotate-12 opacity-20 pointer-events-none">✨</div>
        <div className="absolute -bottom-2 -left-2 text-2xl -rotate-12 opacity-20 pointer-events-none">✎</div>

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-[#fefdfb] border-2 border-[#2d2d2d] flex items-center justify-center shadow-sm">
              <Sparkles className="w-6 h-6 text-[#9b8ab8]" />
            </div>
            <span className="handwritten-lg text-2xl text-[#2d2d2d]">Life OS</span>
          </Link>
          <h1 className="handwritten-lg text-3xl text-[#2d2d2d] mb-2">Welcome Back</h1>
          <p className="handwritten-sm text-[#5a5a5a]">Continue your journey where you left off</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="handwritten text-sm mb-1.5 ml-1 block text-[#2d2d2d]">Email Address</label>
            <Input 
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sketch-input h-12"
            />
          </div>
          <div>
            <label className="handwritten text-sm mb-1.5 ml-1 block text-[#2d2d2d]">Secret Password</label>
            <Input 
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="sketch-input h-12"
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 sketch-btn-primary text-lg"
          >
            {isLoading ? 'Opening Journal...' : 'Sign In'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>

        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-[#c0c0c0]"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#fefdfb] px-2 handwritten-sm text-[#8a8a8a]">Or choose another path</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            variant="outline"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full h-11 sketch-btn flex items-center justify-center gap-2 border-[#9b8ab8] text-[#7a6b94] hover:bg-[#f3f0f7]"
          >
            <Star className="w-4 h-4 fill-current" />
            Sign in with Demo Account
          </Button>
          
          <p className="text-center handwritten-sm text-xs text-[#8a8a8a] mt-4">
            New here? <Link href="/#join" className="underline hover:text-[#2d2d2d]">Create your life OS</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[10%] left-[5%] rotate-12"><Star className="w-12 h-12 text-[#d4c574]" /></div>
        <div className="absolute bottom-[15%] right-[8%] -rotate-12"><Coffee className="w-16 h-16 text-[#d4a574]" /></div>
        <div className="absolute top-[60%] left-[12%] -rotate-6"><Heart className="w-8 h-8 text-[#c97b7b]" /></div>
        <div className="coffee-stain top-1/4 right-1/4" />
        <div className="coffee-stain bottom-10 left-10 scale-50 opacity-20" />
      </div>

      <Suspense fallback={
        <div className="handwritten text-xl animate-pulse text-[#5a5a5a]">
          Preparing your journal...
        </div>
      }>
        <LoginForm />
      </Suspense>

      <footer className="mt-12 handwritten-sm text-[#8a8a8a] text-sm text-center max-w-xs mx-auto">
        "The first step towards getting anywhere is to decide you are not going to stay where you are."
      </footer>
    </div>
  );
}
