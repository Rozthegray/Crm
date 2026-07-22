'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';
import { MessageSquare, X, Send, BellRing, ImageIcon, Megaphone } from 'lucide-react';
import { transmitSecureMessage } from '@/features/chat/actions';

export default function GlobalCommsWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;

    // 1. Initialize Client Socket
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });
    
    // 2. Tune into the user's secure private channel & global broadcast channel
    const privateChannel = pusherClient.subscribe(`private-user-${session.user.id}`);
    const globalChannel = pusherClient.subscribe('global-channel');

    const handleNewData = (data: any) => {
      setMessages((prev) => [...prev, data]);
      if (!isOpen) setUnread((prev) => prev + 1);
    };

    // 3. Listen for specific events
    privateChannel.bind('incoming-message', handleNewData);
    privateChannel.bind('secure-message', handleNewData);
    globalChannel.bind('new-broadcast', handleNewData);

    // 4. Handle real-time soft deletions
    const handleDeletion = (data: { messageId: string }) => {
      setMessages((prev) => prev.map(msg => msg.id === data.messageId ? { ...msg, isDeleted: true } : msg));
    };
    privateChannel.bind('message-deleted', handleDeletion);
    globalChannel.bind('message-deleted', handleDeletion);

    return () => {
      pusherClient.unsubscribe(`private-user-${session.user.id}`);
      pusherClient.unsubscribe('global-channel');
    };
  }, [session, isOpen]);

  const handleTestPing = async () => {
    if (session?.user?.id) {
      await transmitSecureMessage(session.user.id, "Testing the Global Socket Network!");
    }
  };

  if (!session) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end animate-in slide-in-from-bottom-5">
      
      {/* The Chat Window */}
      {isOpen && (
        <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl w-80 mb-4 overflow-hidden flex flex-col h-96">
          <div className="bg-bank-blue p-4 flex justify-between items-center text-white">
            <h3 className="font-black flex items-center">
              <BellRing className="w-4 h-4 mr-2 text-bank-gold" /> Secure Comms
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
            {messages.length === 0 ? (
              <p className="text-xs text-center text-slate-400 font-bold mt-10">Channel is silent.</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`p-3 rounded-xl shadow-sm ${msg.isDeleted ? 'bg-gray-100 border-gray-200 border' : 'bg-white border border-gray-100'}`}>
                  <p className="text-xs font-black text-bank-blue mb-1 flex items-center">
                    {msg.isBroadcast && <Megaphone className="w-3 h-3 mr-1 text-red-500" />}
                    {msg.senderName || 'System Message'}
                  </p>
                  
                  {msg.isDeleted ? (
                    <p className="text-xs font-medium text-slate-400 italic">This message was removed.</p>
                  ) : (
                    <>
                      {msg.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={msg.imageUrl} alt="Attachment" className="max-w-full rounded-lg mb-2 object-cover border border-gray-100" />
                      )}
                      {msg.content && <p className="text-sm font-medium text-slate-700">{msg.content}</p>}
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-100 bg-white">
            <button 
              onClick={handleTestPing}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-black flex items-center justify-center hover:bg-black transition-colors"
            >
              <Send className="w-3 h-3 mr-2" /> Ping System (Test Socket)
            </button>
          </div>
        </div>
      )}

      {/* The Floating Toggle Button */}
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          setUnread(0);
        }}
        className="w-14 h-14 bg-bank-gold rounded-full flex items-center justify-center shadow-xl border-2 border-white hover:scale-105 transition-transform relative"
      >
        <MessageSquare className="w-6 h-6 text-bank-blue-dark" />
        {unread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}