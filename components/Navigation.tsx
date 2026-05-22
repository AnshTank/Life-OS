"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, CheckSquare, Target, Sparkles, 
  Wallet, Users, FolderGit2, Menu, X, Bell,
  LogOut, Calendar, Settings, Type, Minus, Plus, BookOpen
} from 'lucide-react';
import { useApp, FontFamily } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar },
  { id: 'journal', label: 'Journal', path: '/journal', icon: BookOpen },
  { id: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare },
  { id: 'goals', label: 'Goals', path: '/goals', icon: Target },
  { id: 'habits', label: 'Habits', path: '/habits', icon: Sparkles },
  { id: 'money', label: 'Money', path: '/money', icon: Wallet },
  { id: 'partner', label: 'Partner', path: '/partner', icon: Users },
  { id: 'projects', label: 'Projects', path: '/projects', icon: FolderGit2 },
];

function ProfileSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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

export function Navigation() {
  const pathname = usePathname();
  const { user, logout, notifications } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Derive current page ID from pathname (e.g., "/tasks" -> "tasks")
  const currentPage = pathname?.split('/')[1] || 'dashboard';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const handleLogout = () => {
    logout();
    // Redirect handled by ClientLayout based on auth state
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'py-2' : 'py-4'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'bg-[#fdfbf7]/95 backdrop-blur-md border-b-2 border-[#2d2d2d]/10 shadow-sm' : 'bg-transparent'} rounded-xl px-4 py-2`}>
            {/* Logo */}
            <Link href="/dashboard">
              <motion.div 
                className="flex items-center gap-2 cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <img 
                  src="/logo.png" 
                  alt="Soul Sync" 
                  className="h-14 w-auto"
                />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`relative px-3 py-2 flex items-center gap-1.5 text-sm transition-all handwritten ${
                      isActive 
                        ? 'text-[#2d2d2d] font-bold' 
                        : 'text-[#5a5a5a] hover:text-[#2d2d2d]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="navUnderline"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#2d2d2d]"
                        style={{ borderRadius: '1px 3px 2px 4px' }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-full hover:bg-[#f5f0e6] transition-colors">
                    <Bell className="w-5 h-5 text-[#5a5a5a]" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-[#c97b7b] text-white text-xs rounded-full flex items-center justify-center border-2 border-[#fefdfb]">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  <div className="p-2 handwritten font-bold text-[#2d2d2d] border-b border-[#e0e0e0]">Notifications</div>
                  {notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id} 
                      className={`p-3 cursor-pointer handwritten-sm ${!notification.read ? 'bg-[#e8eef3]' : ''}`}
                      asChild
                    >
                      <Link href={notification.actionUrl || '/dashboard'}>
                        <div>
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-[#5a5a5a]">{notification.message}</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-full hover:bg-[#f5f0e6] transition-colors">
                    <Avatar className="w-8 h-8 border-2 border-[#2d2d2d]">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-[#9b8ab8] text-white text-sm handwritten">
                        {user?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#fefdfb] border-2 border-[#2d2d2d]">
                  <div className="px-3 py-2 border-b border-[#e0e0e0]">
                    <p className="handwritten font-bold">{user?.name}</p>
                    <p className="handwritten-sm text-xs text-[#5a5a5a]">{user?.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="handwritten-sm cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="handwritten-sm text-[#c97b7b] cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2 rounded-full hover:bg-[#f5f0e6] transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-[#5a5a5a]" />
                ) : (
                  <Menu className="w-5 h-5 text-[#5a5a5a]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-20 z-30 lg:hidden px-4"
          >
            <div className="bg-[#fefdfb] border-2 border-[#2d2d2d] rounded-lg shadow-xl p-4">
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-2 p-3 rounded-lg transition-all handwritten ${
                        isActive 
                          ? 'bg-[#2d2d2d] text-[#fdfbf7]' 
                          : 'bg-[#f5f0e6] text-[#2d2d2d] hover:bg-[#e8e4dc]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProfileSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
