"use client";

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Sparkles, ArrowRight, Star, Heart, Coffee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';

function RegisterForm() {
  const { login } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      toast.success("Welcome aboard! Preparing your journal...");

      // Automatically log the user in after registration
      const success = await login(email, password);
      if (success) {
        router.push(callbackUrl);
      } else {
        router.push('/login');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
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
          <h1 className="handwritten-lg text-3xl text-[#2d2d2d] mb-2">Create Account</h1>
          <p className="handwritten-sm text-[#5a5a5a]">Start organizing your life's beautiful mess</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="handwritten text-sm mb-1 ml-1 block text-[#2d2d2d]">Your Name</label>
            <Input 
              type="text"
              required
              placeholder="Alex Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="sketch-input h-11"
            />
          </div>
          <div>
            <label className="handwritten text-sm mb-1 ml-1 block text-[#2d2d2d]">Email Address</label>
            <Input 
              type="email"
              required
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sketch-input h-11"
            />
          </div>
          <div>
            <label className="handwritten text-sm mb-1 ml-1 block text-[#2d2d2d]">Secret Password</label>
            <Input 
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="sketch-input h-11"
            />
          </div>
          <div>
            <label className="handwritten text-sm mb-1 ml-1 block text-[#2d2d2d]">Confirm Password</label>
            <Input 
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="sketch-input h-11"
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 sketch-btn-primary text-lg mt-2"
          >
            {isLoading ? 'Creating Journal...' : 'Sign Up'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-[#c0c0c0]"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#fefdfb] px-2 handwritten-sm text-[#8a8a8a]">Or choose another path</span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="handwritten-sm text-xs text-[#8a8a8a]">
            Already have an account? <Link href="/login" className="underline hover:text-[#2d2d2d]">Sign in instead</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Back to Home Button */}
      <Link href="/" className="absolute top-4 left-4 inline-flex items-center gap-2 handwritten-sm hover:underline text-[#5a5a5a] bg-white border border-[#2d2d2d] px-3 py-1.5 rounded shadow-sm hover:-translate-y-0.5 transition-all duration-200 z-50">
        <span>←</span> Back to Home
      </Link>

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
          Preparing your registration...
        </div>
      }>
        <RegisterForm />
      </Suspense>

      <footer className="mt-8 handwritten-sm text-[#8a8a8a] text-sm text-center max-w-xs mx-auto">
        "The first step towards getting anywhere is to decide you are not going to stay where you are."
      </footer>
    </div>
  );
}
