"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, CheckSquare, Target, Sparkles, 
  Wallet, Users, FolderGit2, Calendar, BookOpen,
  Bell, Settings, LogOut, Menu, X
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ProfileSettingsModal } from '@/components/ProfileSettingsModal';

const iconMap: Record<string, any> = {
  '/dashboard': LayoutDashboard,
  '/calendar': Calendar,
  '/journal': BookOpen,
  '/tasks': CheckSquare,
  '/goals': Target,
  '/habits': Sparkles,
  '/money': Wallet,
  '/partner': Users,
  '/projects': FolderGit2,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
}

interface FloatingNavProps {
  items?: NavItem[];
  logoSrc?: string;
  siteName?: string;
}

const DEFAULT_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
];

const STAGGER_BASE = 40; // ms

// ─── Component ────────────────────────────────────────────────────────────────
export default function FloatingNav({
  items = DEFAULT_ITEMS,
  logoSrc,
  siteName = "Life OS",
}: FloatingNavProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const currentPage = pathname?.split('/')[1] || 'dashboard';

  // Top Right Actions
  const { user, logout, notifications } = useApp();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setUnreadCount(notifications?.filter(n => !n.read).length || 0);
  }, [notifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <style>{`
        /* ── Design tokens ───────────────────────────────────────────────── */
        :root {
          --fn-ink:         #2d2d2d;
          --fn-ink-soft:    #5a5a5a;
          --fn-ink-h:       #2d2d2d;
          --fn-ease:  cubic-bezier(0.34,1.56,0.64,1);
          --fn-eout:  cubic-bezier(0.16,1,0.3,1);
        }

        /* ── Left Navigation Container ─────────────────────────────── */
        .fn-root {
          position: fixed;
          top: 24px;
          left: 24px;
          z-index: 10000;
          display: flex;
          align-items: center;
        }

        /* ── Logo Button (No borders, just image/text) ──────────────── */
        .fn-logo-btn {
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          outline: none;
          transition: transform 180ms ease;
          display: flex;
          align-items: center;
          position: relative;
          z-index: 2;
        }
        .fn-logo-btn:hover {
          transform: scale(1.05);
        }
        .fn-logo-btn:active {
          transform: scale(0.95);
        }

        .fn-logo-img {
          height: 48px;
          object-fit: contain;
          display: block;
        }

        .fn-logo-text {
          font-family: "Caveat", cursive;
          font-size: 28px;
          font-weight: 700;
          color: var(--fn-ink);
        }

        /* ── Nav Items Container ─────────────────────────────────────────── */
        .fn-items {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-left: 16px;
          background: #fefdfb !important; /* Solid background */
          border: 2px solid var(--fn-ink);
          padding: 8px 24px;
          border-radius: 99px;
          box-shadow: 8px 8px 0 rgba(45,45,45,0.15); /* Stronger shadow */
          opacity: 0;
          transform: translateX(-20px) scale(0.95);
          pointer-events: none;
          transition: all 400ms var(--fn-ease);
          backdrop-filter: none; /* Ensure no transparency effects */
        }

        .fn-items.fn-open {
          opacity: 1;
          transform: translateX(0) scale(1);
          pointer-events: auto;
        }

        .fn-nav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: "Kalam", cursive;
          font-size: 16px;
          font-weight: 400;
          color: var(--fn-ink-soft);
          text-decoration: none;
          white-space: nowrap;
          transition: color 180ms ease;
        }
        
        .fn-nav-link:hover {
          color: var(--fn-ink-h);
        }

        .fn-nav-link.fn-active {
          color: var(--fn-ink);
          font-weight: 700;
        }

        /* Removed separate animation for links as they are now in a container */

        /* ── Top Right Actions ─────────────────────────────── */
        .fn-top-right {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .fn-icon-btn {
          background: #fefdfb !important;
          border: 2px solid var(--fn-ink);
          color: var(--fn-ink-h);
          opacity: 1 !important;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 200ms ease;
          position: relative;
        }
        .fn-icon-btn:hover {
          color: var(--fn-ink-h);
          background: #fdfbf7;
          border-color: rgba(45,45,45,0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(44,32,16,0.08);
        }

        @media (max-width: 768px) {
          .fn-root { top: 16px; left: 16px; }
          .fn-top-right { top: 16px; right: 16px; }
          .fn-logo-img { height: 36px; }
          .fn-nav-link { font-size: 14px; }
          .fn-icon-btn { width: 38px; height: 38px; }
          
          .fn-items {
            flex-direction: column;
            align-items: flex-start;
            position: absolute;
            top: 60px;
            left: 0;
            margin-left: 0;
            border-radius: 12px;
            padding: 16px;
            gap: 12px;
            width: 180px;
            box-shadow: 10px 10px 0 rgba(45,45,45,0.1);
          }
        }
      `}</style>

      {/* ── Left Navigation ─────────────────────────────────────────────────── */}
      <div ref={rootRef} className="fn-root">
        <button
          className="fn-logo-btn"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {logoSrc ? (
            <img src={logoSrc} alt={siteName} className="fn-logo-img" />
          ) : (
            <span className="fn-logo-text">{siteName}</span>
          )}
        </button>

        <nav
          className={`fn-items${open ? " fn-open" : ""}`}
          aria-label="Site navigation"
          aria-hidden={!open}
          inert={!open}
        >
          {items.map((item, i) => {
            const isActive = currentPage === item.href.split('/')[1];
            const Icon = iconMap[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`fn-nav-link ${isActive ? 'fn-active' : ''}`}
                style={{
                  transitionDelay: open ? `${STAGGER_BASE + i * 30}ms` : "0ms",
                }}
                onClick={() => setOpen(false)}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="fnNavUnderline"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#2d2d2d]"
                    style={{ borderRadius: '2px' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Top Right Actions ────────────────────────────────────────────────── */}
      <div className="fn-top-right">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="fn-icon-btn">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c97b7b] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#fdfbf7]">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-[#fefdfb] border-2 border-[#2d2d2d] mt-2">
            <div className="p-2 handwritten font-bold text-[#2d2d2d] border-b border-[#e0e0e0]">Notifications</div>
            {notifications && notifications.length > 0 ? notifications.slice(0, 5).map((notification) => (
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
            )) : (
              <div className="p-4 text-center text-[#5a5a5a] handwritten text-sm">No new notifications</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="fn-icon-btn !p-0 overflow-hidden border-2 border-[#2d2d2d]">
              <Avatar className="w-full h-full rounded-full">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-[#9b8ab8] text-white text-sm handwritten">
                  {user?.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#fefdfb] border-2 border-[#2d2d2d] mt-2">
            <div className="px-3 py-2 border-b border-[#e0e0e0]">
              <p className="handwritten font-bold">{user?.name || 'Guest'}</p>
              <p className="handwritten-sm text-xs text-[#5a5a5a]">{user?.email}</p>
            </div>
            <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} className="handwritten-sm cursor-pointer hover:bg-[#f5f0e6]">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#e0e0e0]" />
            <DropdownMenuItem onClick={() => logout()} className="handwritten-sm text-[#c97b7b] cursor-pointer hover:bg-[#f5e8e8]">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}