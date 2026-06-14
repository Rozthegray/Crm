'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const [dateStr, setDateStr] = useState<string>('Syncing Chronology...');

  useEffect(() => {
    // Ensures date rendering strictly matches the client to prevent hydration mismatches
    setDateStr(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    }));
  }, []);

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0 shadow-sm">
      <div className="flex items-center">
        <ShieldCheck className="w-5 h-5 text-green-500 mr-2" />
        <span className="text-sm font-black text-slate-700">
          Secure Network Active <span className="text-slate-400 font-medium ml-2 hidden md:inline">| {dateStr}</span>
        </span>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search personnel, records, ledgers..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bank-blue-light focus:border-transparent transition-all text-slate-700"
          />
        </div>
        
        <button className="relative p-2 bg-slate-50 border border-gray-200 rounded-full text-slate-500 hover:text-bank-blue hover:border-bank-blue-light transition-colors shadow-sm">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}