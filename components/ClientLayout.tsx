"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/context/AppContext';
import FloatingNav from '@/components/FloatingNav';
import { JarvisCompanion } from '@/components/JarvisCompanion';
import { Toaster } from '@/components/ui/sonner';
import { LandingPage } from '@/views/LandingPage';
import { SessionProvider } from 'next-auth/react';
import { SettingChangeOverlay } from '@/components/SettingChangeOverlay';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fdfbf7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d2d2d]"></div>
      </div>
    );
  }

  const handleLogin = () => {
    router.push('/dashboard');
  };

  let content;
  if (!isAuthenticated) {
    if (pathname === '/login' || pathname === '/register') {
      content = (
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      );
    } else {
      content = <LandingPage onLogin={handleLogin} />;
    }
  } else {
    content = (
      <>
        <FloatingNav
          siteName="Life OS"
          logoSrc="/logo.png"
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Calendar",  href: "/calendar" },
            { label: "Journal",   href: "/journal" },
            { label: "Tasks",     href: "/tasks" },
            { label: "Goals",     href: "/goals" },
            { label: "Habits",    href: "/habits" },
            { label: "Money",     href: "/money" },
            { label: "Partner",   href: "/partner" },
            { label: "Projects",  href: "/projects" },
          ]}
        />
        <JarvisCompanion currentPage={pathname?.replace('/', '') || 'dashboard'} />
        
        <main className="pt-12 pb-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {content}
      <SettingChangeOverlay />
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            fontFamily: 'Kalam, cursive',
            background: '#fefdfb',
            border: '2px solid #2d2d2d',
            borderRadius: '4px 8px 6px 10px',
            color: '#2d2d2d',
          },
          classNames: {
            success: '!bg-[#e8f0e9] !border-[#8ab896] !text-[#5a9468]',
            error: '!bg-[#f5e8e8] !border-[#d49191] !text-[#a85a5a]',
          }
        }}
      />
    </div>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppProvider>
        <LayoutContent>{children}</LayoutContent>
      </AppProvider>
    </SessionProvider>
  );
}
