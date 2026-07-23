'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare, Send, Loader2, User as UserIcon, Search, ShieldCheck, ArrowLeft, Image as ImageIcon, Trash2 } from 'lucide-react';
import { getChatDirectory, getChatHistory, sendDirectMessage, deleteMessage } from '@/features/chat/actions';
import Pusher from 'pusher-js';

export default function CommsNetworkPage() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeContact, setActiveContact] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [message, setMessage] = useState('');
  const [activeChatHistory, setActiveChatHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Mobile View State
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Directory
  useEffect(() => {
    const fetchContacts = async () => {
      const res = await getChatDirectory();
      if (res.success) setContacts(res.contacts || []);
      setIsLoading(false);
    };
    fetchContacts();
  }, []);

  // 2. Fetch Chat History when a contact is selected
  useEffect(() => {
    const loadHistory = async () => {
      if (!activeContact) return;
      setIsLoadingChat(true);
      const res = await getChatHistory(activeContact.id);
      
      if (res.success) {
        const formattedHistory = res.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.content,
          imageUrl: msg.imageUrl,
          isDeleted: msg.isDeleted,
          isMe: msg.senderId === session?.user?.id,
          time: new Date(msg.createdAt)
        }));
        setActiveChatHistory(formattedHistory);
      }
      setIsLoadingChat(false);
    };
    loadHistory();
  }, [activeContact, session?.user?.id]);

  // 3. Initialize Real-Time Listener
  useEffect(() => {
    if (!session?.user?.id) return;

    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });

    const channel = pusherClient.subscribe(`private-user-${session.user.id}`);

    // Listen for incoming messages
    channel.bind('secure-message', (data: any) => {
      setActiveContact((currentActive: any) => {
        if (currentActive && currentActive.id === data.senderId) {
          setActiveChatHistory(prev => [
            ...prev, 
            { 
              id: data.id,
              text: data.message, 
              imageUrl: data.imageUrl,
              isDeleted: data.isDeleted,
              isMe: false, 
              time: data.timestamp ? new Date(data.timestamp) : new Date() 
            }
          ]);
        }
        return currentActive; 
      });
    });

    // Listen for deletions in real-time
    channel.bind('message-deleted', (data: { messageId: string }) => {
      setActiveChatHistory(prev => prev.map(m => m.id === data.messageId ? { ...m, isDeleted: true } : m));
    });

   return () => {
      if (session?.user?.id) {
        pusherClient.unsubscribe(`private-user-${session.user.id}`);
      }
    };
  }, [session]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatHistory]);

  // ============================================================================
  // SEND MESSAGE HANDLER
  // ============================================================================
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeContact || !session?.user?.id) return;

    const textToSend = message;
    setMessage('');
    
    // Optimistic UI (Assign a temp ID so we can track it before the DB responds)
    const tempId = `temp-${Date.now()}`;
    setActiveChatHistory(prev => [
      ...prev,
      { id: tempId, text: textToSend, imageUrl: null, isDeleted: false, isMe: true, time: new Date() }
    ]);
    
    setIsSending(true);
    const res = await sendDirectMessage(activeContact.id, textToSend);
    
    if (res.success && res.message) {
      // Swap temp ID for real DB ID so deletion works immediately
      setActiveChatHistory(prev => prev.map(m => m.id === tempId ? { ...m, id: res.message.id } : m));
    } else {
      alert("Message failed to send. Please check your connection.");
    }
    setIsSending(false);
  };

  // ============================================================================
  // SECURE IMAGE UPLOAD HANDLER
  // ============================================================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;

    setIsSending(true);
    // Note: Replace this with your actual UploadThing / AWS S3 upload logic in production
    const mockUploadedUrl = URL.createObjectURL(file); 
    
    const tempId = `temp-${Date.now()}`;
    setActiveChatHistory(prev => [
      ...prev,
      { id: tempId, text: null, imageUrl: mockUploadedUrl, isDeleted: false, isMe: true, time: new Date() }
    ]);

    const res = await sendDirectMessage(activeContact.id, undefined, mockUploadedUrl);
    
    if (res.success && res.message) {
      setActiveChatHistory(prev => prev.map(m => m.id === tempId ? { ...m, id: res.message.id } : m));
    } else {
      alert("Failed to securely upload file.");
    }
    setIsSending(false);
  };

  // ============================================================================
  // DELETE MESSAGE HANDLER (Soft Delete)
  // ============================================================================
  const handleDelete = async (msgId: string) => {
    // Instantly mask locally
    setActiveChatHistory(prev => prev.map(m => m.id === msgId ? { ...m, isDeleted: true } : m));
    // Execute backend protocol
    await deleteMessage(msgId);
  };

  const handleContactSelect = (contact: any) => {
    setActiveContact(contact);
    setShowMobileChat(true);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcff] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#2a27fd] animate-spin mb-4" />
        <h2 className="text-xl font-black text-[#160f29] tracking-widest uppercase">Securing Network Channels...</h2>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-0px)] lg:h-[calc(100vh-0px)] bg-[#fcfcff] p-4 md:p-6 lg:p-8 flex flex-col animate-in fade-in duration-300">
      
      <div className="mb-4 md:mb-6 hidden md:block">
        <h1 className="text-3xl font-black text-[#160f29] flex items-center tracking-tight">
          <MessageSquare className="w-8 h-8 mr-3 text-[#2a27fd]" /> Enterprise Comms
        </h1>
        <p className="text-[#160f29]/60 mt-1 font-medium">End-to-end encrypted messaging across the banking network.</p>
      </div>

      <div className="flex-1 bg-white border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex overflow-hidden relative">
        
        {/* LEFT PANEL: Directory */}
        <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-gray-100 flex flex-col bg-[#fcfcff] transition-all duration-300 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-5 border-b border-gray-100 bg-white">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-[#2a27fd]/50" />
              <input 
                type="text" 
                placeholder="Search colleagues..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-bold text-[#160f29] focus:outline-none focus:border-[#2a27fd] focus:ring-2 focus:ring-[#2a27fd]/20 transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredContacts.length === 0 ? (
              <p className="text-center text-[#160f29]/40 font-bold mt-10 text-sm">No colleagues found.</p>
            ) : (
              filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  className={`w-full flex items-center p-3.5 rounded-2xl transition-all border ${
                    activeContact?.id === contact.id 
                      ? 'bg-[#160f29] border-[#160f29] text-white shadow-md' 
                      : 'bg-white border-transparent hover:border-gray-200 hover:bg-slate-50 text-[#160f29]'
                  }`}
                >
                  <div className="relative mr-4 flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 ${
                      activeContact?.id === contact.id ? 'border-white/20' : 'border-[#2a27fd]/10 shadow-sm'
                    } bg-[#fcfcff]`}>
                      {contact.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className={`w-6 h-6 ${activeContact?.id === contact.id ? 'text-[#ffbb00]' : 'text-[#2a27fd]/40'}`} />
                      )}
                    </div>
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className={`font-black text-base truncate ${activeContact?.id === contact.id ? 'text-white' : 'text-[#160f29]'}`}>
                      {contact.name}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider truncate mt-0.5 ${activeContact?.id === contact.id ? 'text-[#ffbb00]' : 'text-[#160f29]/50'}`}>
                      {contact.role.replace('_', ' ')}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Chat Window */}
        <div className={`flex-1 flex flex-col bg-white transition-all duration-300 ${!showMobileChat ? 'hidden md:flex' : 'flex absolute inset-0 md:relative z-20'}`}>
          {activeContact ? (
            <>
              {/* Chat Header */}
              <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10">
                <div className="flex items-center">
                  <button 
                    onClick={() => setShowMobileChat(false)}
                    className="mr-4 p-2 bg-slate-50 hover:bg-slate-100 rounded-full md:hidden text-[#160f29]"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="w-12 h-12 rounded-full bg-[#fcfcff] flex items-center justify-center overflow-hidden border border-[#2a27fd]/20 mr-4 shadow-sm">
                    {activeContact.avatarUrl ? (
                       // eslint-disable-next-line @next/next/no-img-element
                      <img src={activeContact.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-[#2a27fd]/40" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-black text-lg text-[#160f29]">{activeContact.name}</h2>
                    <p className="text-[10px] font-black uppercase tracking-wider text-green-600 flex items-center mt-0.5">
                      <ShieldCheck className="w-3 h-3 mr-1" /> DB Encrypted Channel
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#fcfcff] flex flex-col gap-4">
                {isLoadingChat ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#2a27fd] animate-spin" />
                  </div>
                ) : activeChatHistory.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-[#160f29]/30">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                      <MessageSquare className="w-8 h-8 text-[#2a27fd]/40" />
                    </div>
                    <p className="font-bold text-sm">Secure transmission log empty.</p>
                    <p className="font-medium text-xs mt-1">Initiate protocol with {activeContact.name.split(' ')[0]}.</p>
                  </div>
                ) : (
                  activeChatHistory.map((msg, idx) => (
                    <div key={msg.id || idx} className={`group flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`relative max-w-[85%] md:max-w-[70%] p-4 rounded-3xl text-sm font-bold shadow-sm ${
                        msg.isDeleted 
                          ? 'bg-gray-100 text-gray-400 border border-gray-200' 
                          : msg.isMe 
                            ? 'bg-[#2a27fd] text-white rounded-br-sm' 
                            : 'bg-white border border-gray-100 text-[#160f29] rounded-bl-sm shadow-[0_4px_10px_rgba(0,0,0,0.03)]'
                      }`}>
                        
                        {msg.isDeleted ? (
                          <span className="italic font-medium">This message was removed.</span>
                        ) : (
                          <>
                            {msg.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={msg.imageUrl} alt="Secure Upload" className="max-w-full rounded-xl mb-2 border border-black/10 object-cover" />
                            )}
                            {msg.text && <span>{msg.text}</span>}
                          </>
                        )}
                        
                        <p className={`text-[9px] mt-2 font-black uppercase tracking-wider text-right ${msg.isDeleted ? 'text-gray-400' : msg.isMe ? 'text-white/60' : 'text-[#160f29]/40'}`}>
                          {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>

                        {/* Hover Delete Action (Only for sender or Admins, if not already deleted) */}
                        {!msg.isDeleted && msg.isMe && !msg.id?.startsWith('temp') && (
                          <button 
                            onClick={() => handleDelete(msg.id)}
                            className="absolute -left-10 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                            title="Scrub Message"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Container */}
              <div className="p-4 md:p-6 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="flex gap-3 items-center">
                  
                  {/* File Upload Button */}
                  <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 text-[#160f29]/60 w-14 h-14 rounded-2xl flex items-center justify-center transition-all border border-gray-200 flex-shrink-0">
                    <ImageIcon className="w-6 h-6" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={isSending} 
                    />
                  </label>

                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a secure message..."
                    className="flex-1 bg-[#fcfcff] border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-[#160f29] focus:outline-none focus:ring-2 focus:ring-[#2a27fd]/20 focus:border-[#2a27fd] transition-all shadow-inner"
                  />
                  
                  <button 
                    type="submit"
                    disabled={!message.trim() || isSending}
                    className="bg-[#ffbb00] hover:bg-yellow-400 text-[#160f29] w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md disabled:opacity-50 flex-shrink-0"
                  >
                    {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 ml-1" />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#160f29]/40 bg-[#fcfcff]">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mb-6 transform rotate-3">
                <MessageSquare className="w-10 h-10 text-[#2a27fd]/30" />
              </div>
              <h3 className="text-2xl font-black text-[#160f29] mb-2 tracking-tight">Comms Network Active</h3>
              <p className="font-bold text-sm text-center max-w-xs">Select a colleague from the directory to initiate a secure channel.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}