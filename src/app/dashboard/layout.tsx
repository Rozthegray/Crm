import React from 'react';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-bank-bg">
      {/* Persistent Sidebar */}
     
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
    
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}