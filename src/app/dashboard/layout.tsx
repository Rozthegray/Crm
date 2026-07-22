import React from 'react';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-bank-bg">
      {/* Persistent Sidebar */}
  
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}

    
        {/* Scrollable Page Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          
          {/* 1. The Delegation Banner sits neatly at the very top */}
        
          
          {/* 2. Your actual page content renders directly below it */}
          {children}
          
        </main>
      </div>
    </div>
  );
}