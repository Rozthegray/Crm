'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, Users, FileText, Calendar, Clock, LogOut, MessageSquare, ShieldAlert, Activity, Globe } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  // Define route visibility based on the upgraded RBAC
  const navigation = [
    { name: 'My Workspace', href: '/dashboard', icon: LayoutDashboard, roles: ['STAFF', 'HR', 'ADMIN', 'SUPER_ADMIN'] },
    { name: 'Leave Portal', href: '/dashboard/leave', icon: Clock, roles: ['STAFF', 'HR', 'ADMIN', 'SUPER_ADMIN'] },
    { name: 'Leave Approvals', href: '/hr/leaves', icon: Clock, roles: ['HR', 'ADMIN', 'SUPER_ADMIN'] },
    { name: 'Personnel & HR', href: '/hr/employees', icon: Users, roles: ['HR', 'ADMIN', 'SUPER_ADMIN'] },
    { name: 'Payroll Engine', href: '/hr/payroll', icon: FileText, roles: ['HR', 'ADMIN', 'SUPER_ADMIN'] },
    { name: 'Local Command', href: '/admin/branches', icon: Activity, roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'Global God Mode', href: '/admin/branches', icon: Globe, roles: ['SUPER_ADMIN'] },
    { name: 'Comms Network', href: '/dashboard/chat', icon: MessageSquare, roles: ['STAFF', 'HR', 'ADMIN', 'SUPER_ADMIN'] },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldAlert, roles: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  // Filter links the user is authorized to see
  const authorizedLinks = navigation.filter(item => item.roles.includes(role || ''));

  return (
    <div className="w-64 bg-slate-900 min-h-screen text-slate-300 flex flex-col border-r border-slate-800 shadow-xl z-20">
      <div className="h-20 flex items-center px-6 border-b border-white/10 bg-slate-950">
        <span className="text-xl font-black text-white tracking-tight">Enterprise<span className="text-bank-gold">CRM</span></span>
      </div>

      <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-hide">
        <p className="px-2 text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Command Modules</p>
        
        {authorizedLinks.map((item) => {
          // Precise active path matching to prevent highlighting parent routes accidentally
          const isStrictlyActive = item.href === '/dashboard' ? pathname === '/dashboard' : 
                                   item.href === '/admin' ? pathname === '/admin' :
                                   pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-all ${
                isStrictlyActive 
                  ? 'bg-bank-blue text-white shadow-md' 
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isStrictlyActive ? 'text-bank-gold' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10 bg-slate-950">
        <div className="flex items-center px-3 py-2 mb-2 bg-slate-900 rounded-xl border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-bank-blue text-bank-gold flex items-center justify-center font-black text-sm shadow-sm mr-3 uppercase">
            {session?.user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-black text-white truncate">{session?.user?.name || 'Authenticating...'}</p>
            <p className="text-xs text-bank-gold font-bold truncate">{role || 'Establishing Link'}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-black text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-4 h-4 mr-2" /> Terminate Session
        </button>
      </div>
    </div>
  );
}