import { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, BookOpen, Coffee, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

interface LandingPageProps {
  onLogin: () => void;
}

// Floating doodle component
function FloatingDoodle({ 
  children, 
  delay = 0, 
  x = '0%', 
  y = '0%',
  rotate = 0
}: { 
  children: React.ReactNode; 
  delay?: number; 
  x?: string; 
  y?: string;
  rotate?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -10, 0],
        rotate: [rotate - 5, rotate + 5, rotate - 5]
      }}
      transition={{ 
        opacity: { delay, duration: 0.5 },
        scale: { delay, duration: 0.5, type: 'spring' },
        y: { delay: delay + 0.5, duration: 3, repeat: Infinity, ease: 'easeInOut' },
        rotate: { delay: delay + 0.5, duration: 4, repeat: Infinity, ease: 'easeInOut' }
      }}
      style={{ position: 'absolute', left: x, top: y }}
      className="pointer-events-none"
    >
      {children}
    </motion.div>
  );
}

// Hand-drawn SVG line
function SketchLine({ className = '' }: { className?: string }) {
  return (
    <svg className={`${className}`} viewBox="0 0 200 10" fill="none">
      <motion.path
        d="M2 5 Q 50 2, 100 5 T 198 5"
        stroke="#2d2d2d"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

// Story section component
function StorySection({ 
  title, 
  description, 
  image,
  reverse = false 
}: { 
  title: string; 
  description: string; 
  image: string;
  reverse?: boolean;
}) {
  return (
    <motion.div 
      className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-16`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex-1 space-y-4">
        <h3 className="handwritten-lg text-3xl md:text-4xl text-[#2d2d2d]">{title}</h3>
        <SketchLine className="w-32" />
        <p className="handwritten text-lg text-[#5a5a5a] leading-relaxed">{description}</p>
      </div>
      <div className="flex-1 relative">
        <div className="relative">
          <img 
            src={image} 
            alt={title}
            className="w-full rounded-lg border-2 border-[#2d2d2d] shadow-lg"
            style={{ transform: reverse ? 'rotate(2deg)' : 'rotate(-2deg)' }}
          />
          {/* Tape effect */}
          <div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#fffacd] opacity-70"
            style={{ transform: 'rotate(-3deg)' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      // Updated to match the new real user account
      const success = await login('anshtank9@gmail.com', 'abc@123');
      if (success) onLogin();
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) onLogin();
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-[#fdfbf7]">
      {/* Coffee stains background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="coffee-stain top-20 left-10" />
        <div className="coffee-stain bottom-40 right-20" style={{ transform: 'scale(0.7)' }} />
        <div className="coffee-stain top-1/2 left-1/3 opacity-10" />
      </div>

      {/* Floating doodles */}
      <FloatingDoodle x="5%" y="15%" delay={0.2} rotate={-15}>
        <div className="text-4xl">✓</div>
      </FloatingDoodle>
      <FloatingDoodle x="90%" y="20%" delay={0.4} rotate={10}>
        <Star className="w-8 h-8 text-[#d4c574]" style={{ width: '32px', height: '32px' }} />
      </FloatingDoodle>
      <FloatingDoodle x="8%" y="60%" delay={0.6} rotate={-10}>
        <Heart className="w-6 h-6 text-[#c97b7b]" style={{ width: '24px', height: '24px' }} />
      </FloatingDoodle>
      <FloatingDoodle x="85%" y="70%" delay={0.8} rotate={15}>
        <Coffee className="w-10 h-10 text-[#d4a574]" style={{ width: '40px', height: '40px' }} />
      </FloatingDoodle>
      <FloatingDoodle x="15%" y="85%" delay={1} rotate={-5}>
        <BookOpen className="w-8 h-8 text-[#6b8cae]" style={{ width: '32px', height: '32px' }} />
      </FloatingDoodle>

      {/* Hero Section */}
      <motion.section 
        style={{ y, opacity }}
        className="relative min-h-screen flex items-center px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Story Content */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#e8f0e9] text-[#7ba085] rounded-full handwritten text-sm border border-[#7ba085]">
                  <Sparkles className="w-4 h-4" />
                  Your Personal Life Journal
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="handwritten-lg text-5xl md:text-7xl text-[#2d2d2d] leading-tight"
              >
                Life is a{' '}
                <span className="relative inline-block">
                  beautiful
                  <SketchLine className="absolute -bottom-2 left-0 w-full" />
                </span>{' '}
                mess...
                <br />
                <span className="text-[#9b8ab8]">Let's organize it!</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="handwritten text-xl text-[#5a5a5a] max-w-lg"
              >
                A hand-drawn, personal space to track your tasks, goals, habits, 
                money, and dreams. With JARVIS by your side, every step of the way.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap gap-4"
              >
                <Button
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="sketch-btn-primary text-lg px-8 py-6"
                >
                  {isLoading ? 'Opening...' : 'Open Your Journal'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex gap-8 pt-4"
              >
                {[
                  { value: '10K+', label: 'Tasks Done' },
                  { value: '5K+', label: 'Goals Reached' },
                  { value: '$2M+', label: 'Wealth Tracked' },
                ].map((stat, i) => (
                  <div key={i}>
                    <p className="handwritten-lg text-3xl text-[#2d2d2d]">{stat.value}</p>
                    <p className="handwritten-sm text-sm text-[#5a5a5a]">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right - Hero Image with 3D effect */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative">
                <img 
                  src="/hero-sketch.png" 
                  alt="Life OS Hero"
                  className="w-full rounded-lg border-2 border-[#2d2d2d] shadow-xl"
                />
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#e8f0e9] rounded-full border-2 border-[#2d2d2d] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#7ba085]" />
                </div>
                <div className="absolute -bottom-3 -left-3 px-4 py-2 bg-[#fef9e6] border-2 border-[#2d2d2d] rounded-lg transform -rotate-3">
                  <p className="handwritten text-sm">Your story starts here ✨</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Story Sections */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-32">
          <StorySection
            title="Track Everything That Matters"
            description="From daily tasks to lifelong dreams, keep it all in one beautiful, hand-drawn space. Set priorities, track progress, and watch your life unfold like a story."
            image="/calendar-sketch.png"
          />
          
          <StorySection
            title="Build Habits, One Day at a Time"
            description="See your consistency visualized in a beautiful heatmap. Every checkmark is a small win, and small wins lead to big changes."
            image="/life-balance.png"
            reverse
          />

          <StorySection
            title="JARVIS: Your Personal Companion"
            description="An AI assistant that knows your life. Ask about your portfolio, get task priorities, or just chat about your goals. JARVIS is always there, floating by your side."
            image="/jarvis-character.png"
          />
        </div>
      </section>

      {/* Login Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="paper-card p-8"
          >
            <div className="text-center mb-6">
              <h2 className="handwritten-lg text-3xl mb-2">Welcome Back</h2>
              <p className="handwritten-sm text-[#5a5a5a]">Sign in to continue your journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="handwritten text-sm mb-1 block">Email</label>
                <Input 
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="sketch-input"
                />
              </div>
              <div>
                <label className="handwritten text-sm mb-1 block">Password</label>
                <Input 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="sketch-input"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sketch-btn-primary"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="handwritten-sm text-[#5a5a5a] mb-3">Or</p>
              <Button
                variant="outline"
                onClick={handleDemoLogin}
                className="sketch-btn w-full"
              >
                <Sparkles className="w-4 h-4 mr-2 text-[#9b8ab8]" />
                Try Demo Account
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-dashed border-[#c0c0c0] text-center">
              <p className="handwritten-sm text-xs text-[#8a8a8a]">
                Use: anshtank9@gmail.com / abc@123
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t-2 border-dashed border-[#c0c0c0]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#fefdfb] border-2 border-[#2d2d2d] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#9b8ab8]" />
            </div>
            <span className="handwritten-lg text-xl">Life OS</span>
          </div>
          <p className="handwritten-sm text-[#5a5a5a]">
            Crafted with ❤️ for better living
          </p>
        </div>
      </footer>
    </div>
  );
}
