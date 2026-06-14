'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';
import GlobalCommsWidget from '@/components/chat/GlobalCommsWidget';
import { Menu } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Automatically close the mobile sidebar whenever the user clicks a link and routes change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Prevent UI flashing while checking authentication
  if (status === 'loading') {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"></div>;
  }

  // SECURITY: If not logged in, or on the login page, render ONLY the content (Hide Sidebar/Navbar)
// SECURITY: If not logged in, or on an auth page, render ONLY the content (Hide Sidebar/Navbar)
// FORCE HIDE navigation components on the landing page, login, and register
  const isAuthPage = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register');
      if (!session || isAuthPage) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      
      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Smooth sliding drawer on mobile, static on desktop */}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'}`}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        
        {/* Mobile Top Header (Only visible on small screens to trigger the drawer) */}
        <div className="lg:hidden flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200 shadow-sm z-30">
          <span className="text-xl font-black text-bank-blue-dark tracking-tight">EnterpriseCRM</span>
          <button 
            onClick={() => setIsMobileOpen(true)} 
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-bank-blue transition-colors shadow-sm"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Desktop Navbar (Hidden on mobile to save vertical space) */}
        <div className="hidden lg:block">
          <Navbar />
        </div>

        {/* The Actual Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Persistent Global Comms */}
      <GlobalCommsWidget />
    </div>
  );
}