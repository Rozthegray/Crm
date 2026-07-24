'use client';

import React, { useState, useEffect } from 'react';
import { Laptop, Send, Clock, CheckCircle2, XCircle, ShieldCheck, Loader2, HardDrive } from 'lucide-react';
import { requestAsset, getPendingAssetRequests, processAssetRequest } from '@/features/assets/actions';

export function RequisitionPanel({ currentUser }: { currentUser: any }) {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State (Employee)
  const [deviceType, setDeviceType] = useState('');
  const [reason, setReason] = useState('');

  // Fulfillment State (IT)
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [hardwareIdInput, setHardwareIdInput] = useState('');

  const isITClearance = ['IT_DIGITAL', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

  const loadData = async () => {
    setIsLoading(true);
    if (isITClearance) {
      const res = await getPendingAssetRequests();
      if (res.success) setPendingRequests(res.requests || []);
    }
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, [isITClearance]);

  // ============================================================================
  // EMPLOYEE: SUBMIT REQUEST
  // ============================================================================
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceType || !reason) return alert("All fields are required.");

    setIsSubmitting(true);
    const res = await requestAsset(deviceType, reason);
    if (res.success) {
      alert("Requisition ticket submitted successfully. IT has been notified.");
      setDeviceType('');
      setReason('');
      if (isITClearance) loadData(); // If IT requested for themselves, refresh the queue
    } else {
      alert(res.error);
    }
    setIsSubmitting(false);
  };

  // ============================================================================
  // IT: PROCESS REQUEST
  // ============================================================================
  const handleProcess = async (requestId: string, action: 'REJECT' | 'FULFILL') => {
    if (action === 'REJECT') {
      if (!confirm("Are you sure you want to deny this request?")) return;
      await processAssetRequest(requestId, action);
      loadData();
      return;
    }

    if (action === 'FULFILL') {
      if (!hardwareIdInput) {
        alert("You must provide the specific Hardware Asset ID from the inventory ledger to fulfill this ticket.");
        return;
      }
      setIsSubmitting(true);
      const res = await processAssetRequest(requestId, action, hardwareIdInput);
      if (res?.success) {
          setFulfillingId(null);
        setHardwareIdInput('');
        loadData();
      } else {
        alert(res.error);
      }
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-[#2a27fd] animate-spin" /></div>;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
      
      {/* Header */}
      <div className={`p-6 md:p-8 flex items-center justify-between ${isITClearance ? 'bg-[#160f29]' : 'bg-[#2a27fd]'}`}>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center">
            {isITClearance ? <ShieldCheck className="w-6 h-6 mr-3 text-[#ffbb00]" /> : <Laptop className="w-6 h-6 mr-3 text-blue-200" />}
            {isITClearance ? 'IT Requisition Queue' : 'Asset Requisition'}
          </h2>
          <p className="text-white/70 text-xs font-bold mt-2 uppercase tracking-widest">
            {isITClearance ? 'Pending Hardware Tickets' : 'Request Corporate Hardware'}
          </p>
        </div>
        <HardDrive className="w-12 h-12 text-white/10 hidden md:block" />
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left: The Request Form */}
        <div>
          <h3 className="text-sm font-black text-[#160f29] uppercase tracking-widest mb-6">New Ticket</h3>
          <form onSubmit={handleSubmitRequest} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[#160f29]/50">Device Type</label>
              <input 
                type="text" 
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                placeholder="e.g., MacBook Pro M3, Teller Scanner"
                className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-black focus:border-[#2a27fd] transition-all outline-none"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[#160f29]/50">Business Justification</label>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this hardware required for your role?"
                className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-bold focus:border-[#2a27fd] transition-all outline-none h-32 resize-none"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#2a27fd] hover:bg-[#1a18d0] text-white rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center transition-all shadow-lg shadow-[#2a27fd]/30 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />} 
              Submit Requisition
            </button>
          </form>
        </div>

        {/* Right: IT Queue (Only visible to IT/Admins) */}
        {isITClearance && (
          <div className="border-t lg:border-t-0 lg:border-l border-gray-100 pt-8 lg:pt-0 lg:pl-10">
            <h3 className="text-sm font-black text-[#160f29] uppercase tracking-widest mb-6 flex items-center justify-between">
              Pending Tickets
              <span className="bg-[#ffbb00] text-[#160f29] px-2 py-0.5 rounded-full text-[10px] font-black">{pendingRequests.length}</span>
            </h3>

            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No pending requisitions</p>
                </div>
              ) : (
                pendingRequests.map(ticket => (
                  <div key={ticket.id} className="p-5 bg-white border border-[#2a27fd]/20 rounded-2xl shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#ffbb00]"></div>
                    
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-base font-black text-[#160f29]">{ticket.user.name}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{ticket.user.role} • {ticket.user.branch?.name}</p>
                      </div>
                      <span className="flex items-center text-[10px] font-black text-[#ffbb00] uppercase tracking-widest bg-[#ffbb00]/10 px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl mb-4">
                      <p className="text-xs font-black text-[#160f29]">{ticket.deviceType}</p>
                      <p className="text-xs text-gray-600 font-medium mt-1 italic">"{ticket.reason}"</p>
                    </div>

                    {/* Action Controls */}
                    {fulfillingId === ticket.id ? (
                      <div className="space-y-3 animate-in fade-in">
                        <input 
                          type="text" 
                          value={hardwareIdInput}
                          onChange={(e) => setHardwareIdInput(e.target.value)}
                          placeholder="Enter Hardware Tag/ID to assign..."
                          className="w-full px-3 py-2 border border-[#2a27fd] rounded-lg text-xs font-bold focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleProcess(ticket.id, 'FULFILL')} className="flex-1 py-2 bg-green-500 text-white text-[10px] font-black uppercase rounded-lg">Confirm Fulfillment</button>
                          <button onClick={() => setFulfillingId(null)} className="px-3 py-2 bg-gray-100 text-gray-600 text-[10px] font-black uppercase rounded-lg">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => setFulfillingId(ticket.id)} className="flex-1 py-2.5 bg-[#160f29] hover:bg-[#2a27fd] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center transition-colors">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Fulfill
                        </button>
                        <button onClick={() => handleProcess(ticket.id, 'REJECT')} className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}