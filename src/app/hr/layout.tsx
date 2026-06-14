import React from 'react';
import Sidebar from '@/components/sidebar';
import Navbar from '@/components/navbar';

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-bank-bg">
  
      <div className="flex-1 flex flex-col overflow-hidden">

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}