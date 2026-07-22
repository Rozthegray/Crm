'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, Check } from 'lucide-react';
import { getUserNotifications, markNotificationsAsRead } from '@/features/notifications/actions';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount
  useEffect(() => {
    const fetchAlerts = async () => {
      const res = await getUserNotifications();
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    };
    fetchAlerts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    // If opening and there are unread messages, mark them as read in the DB
    if (!isOpen && unreadCount > 0) {
      setUnreadCount(0); // Optimistic UI update
      await markNotificationsAsRead();
      
      // Update local state so they appear "read" in the UI without a full reload
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'APPROVAL': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'PAYROLL_DELAY': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-[#2a27fd]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* The Bell Trigger */}
      <button 
        onClick={handleOpen}
        className="relative p-2 text-[#160f29] hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {/* The Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="bg-[#160f29] p-4 flex justify-between items-center">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">System Alerts</h3>
            {unreadCount > 0 && (
              <span className="bg-[#ffbb00] text-[#160f29] text-[10px] font-black px-2 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm font-bold">
                All systems clear. No new alerts.
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 flex gap-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div>
                    <h4 className={`text-sm ${!notification.isRead ? 'font-black text-[#160f29]' : 'font-bold text-gray-700'}`}>
                      {notification.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-gray-400 font-bold mt-2 block uppercase tracking-wider">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs font-black text-[#160f29]/60 hover:text-[#160f29] transition-colors"
            >
              Close Ledger
            </button>
          </div>
        </div>
      )}
    </div>
  );
}