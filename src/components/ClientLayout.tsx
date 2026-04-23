"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navigation } from '@/components/Navigation';
import { JarvisCompanion } from '@/components/JarvisCompanion';
import { Toaster } from '@/components/ui/sonner';
import { LandingPage } from '@/views/LandingPage';
import { SessionProvider } from 'next-auth/react';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Simple auth check: if not authenticated and trying to access protected route (anything other than root),
  // we might want to show LandingPage. But LandingPage is shown below if !isAuthenticated.
  // The only edge case is if we are at '/' and authenticated, page.tsx redirects to /dashboard.
  // So we don't need complex router.push logic here anymore.

  if (!isMounted) {
    return null; // or a loading spinner
  }

  const handleLogin = () => {
    router.push('/dashboard');
  };

  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <Navigation />
      <JarvisCompanion currentPage={pathname?.replace('/', '') || 'dashboard'} />
      
      <main className="pt-28 pb-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

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
