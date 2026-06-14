'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Loader2, User as UserIcon, List, FileText } from 'lucide-react';
import { getPendingLeaveRequests, resolveLeaveRequest, getCompanyLeaveLedger } from '@/features/leave/actions';

export default function LeaveCommandCenter() {
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'LEDGER'>('QUEUE');
  
  const [queue, setQueue] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchEngine = async () => {
    setIsLoading(true);
    const [queueRes, ledgerRes] = await Promise.all([
      getPendingLeaveRequests(),
      getCompanyLeaveLedger()
    ]);
    
    if (queueRes.success) setQueue(queueRes.pendingLeaves || []);
    if (ledgerRes.success) setLedger(ledgerRes.ledger || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEngine();
  }, []);

  const handleResolution = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(leaveId);
    const res = await resolveLeaveRequest(leaveId, status);
    
    if (res.success) {
      const processedLeave = queue.find(l => l.id === leaveId);
      if (processedLeave) {
        processedLeave.status = status;
        setLedger(prev => [processedLeave, ...prev]);
        setQueue(prev => prev.filter(l => l.id !== leaveId));
      }
    } else {
      alert(res.error);
    }
    setProcessingId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-bank-gold animate-spin mb-4" />
        <h2 className="text-xl font-black text-bank-blue-dark">Decrypting Command Center...</h2>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="mb-8 border-b border-gray-200 pb-6 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="w-full lg:w-auto">
          <h1 className="text-2xl md:text-3xl font-black text-bank-blue-dark flex items-center tracking-tight">
            <Calendar className="w-7 h-7 md:w-8 md:h-8 mr-3 text-bank-gold" /> Leave Command Center
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">Authorize requests and audit historical personnel timelines.</p>
        </div>
        
        {/* Tab Navigation - Fully Responsive & Scrollable on Mobile */}
        <div className="flex w-full lg:w-auto bg-slate-200/70 p-1.5 rounded-xl overflow-x-auto shadow-inner">
          <button 
            onClick={() => setActiveTab('QUEUE')} 
            className={`flex-1 lg:flex-none justify-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-black flex items-center transition-all whitespace-nowrap ${activeTab === 'QUEUE' ? 'bg-white text-bank-blue shadow-sm' : 'text-slate-500 hover:text-bank-blue-dark'}`}
          >
            <List className="w-4 h-4 mr-2" /> Action Queue
            {queue.length > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{queue.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('LEDGER')} 
            className={`flex-1 lg:flex-none justify-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-black flex items-center transition-all whitespace-nowrap ${activeTab === 'LEDGER' ? 'bg-white text-bank-blue shadow-sm' : 'text-slate-500 hover:text-bank-blue-dark'}`}
          >
            <FileText className="w-4 h-4 mr-2" /> Master Ledger
          </button>
        </div>
      </div>

      {/* VIEW 1: QUEUE */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-4">
          {queue.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-12 text-center shadow-sm">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-black text-bank-blue-dark">Queue is Clear</h3>
              <p className="text-slate-500 font-medium mt-1">There are no pending leave requests requiring your authorization.</p>
            </div>
          ) : (
            queue.map((leave) => (
              <div key={leave.id} className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between hover:shadow-md transition-shadow">
                
                {/* User Info & Leave Details */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full flex-1">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {leave.user?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={leave.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="w-full">
                    <h3 className="text-lg font-black text-bank-blue-dark flex flex-wrap items-center gap-2">
                      {leave.user?.name} 
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] md:text-xs font-bold rounded uppercase tracking-wider border border-gray-200">
                        {leave.user?.role}
                      </span>
                    </h3>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs md:text-sm font-medium text-slate-600">
                      <p><strong className="text-bank-gold mr-1">Type:</strong> {leave.type.replace('_', ' ')}</p>
                      <p><strong className="text-bank-gold mr-1">Duration:</strong> {leave.totalDays} Days</p>
                    </div>
                    
                    {leave.reason && (
                      <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-gray-100">
                        <p className="text-sm text-slate-600 italic">"{leave.reason}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex w-full xl:w-auto gap-3 flex-shrink-0 pt-4 xl:pt-0 border-t border-gray-100 xl:border-none">
                  <button 
                    onClick={() => handleResolution(leave.id, 'APPROVED')} 
                    disabled={processingId === leave.id} 
                    className="flex-1 xl:flex-none px-6 py-3 md:py-3.5 bg-bank-blue hover:bg-bank-blue-light text-white font-black rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {processingId === leave.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5 mr-2" /> Approve</>}
                  </button>
                  <button 
                    onClick={() => handleResolution(leave.id, 'REJECTED')} 
                    disabled={processingId === leave.id} 
                    className="flex-1 xl:flex-none px-6 py-3 md:py-3.5 bg-white hover:bg-red-50 text-red-600 font-black rounded-xl border border-red-200 transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
                  >
                    {processingId === leave.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><XCircle className="w-5 h-5 mr-2" /> Reject</>}
                  </button>
                </div>
                
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-800 min-w-[600px]">
              <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase text-slate-500 font-black tracking-wider">
                <tr>
                  <th className="px-6 py-5">Personnel</th>
                  <th className="px-6 py-5">Category</th>
                  <th className="px-6 py-5 text-center">Days Total</th>
                  <th className="px-6 py-5 text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledger.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-16 text-center text-slate-500 font-bold">Ledger is currently empty.</td></tr>
                ) : (
                  ledger.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-black text-bank-blue-dark text-base">{item.user?.name}</p>
                        <p className="text-xs text-slate-500 font-bold mt-0.5">{item.user?.role}</p>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-700">{item.type.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-center font-mono font-black text-bank-blue text-base">{item.totalDays}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-3 py-1.5 text-xs font-black rounded-full border shadow-sm whitespace-nowrap ${
                          item.status === 'APPROVED' || item.status === 'COMPLETED' ? 'bg-green-100 text-green-800 border-green-300' : 
                          item.status === 'ACTIVE' ? 'bg-bank-blue text-white border-bank-blue-dark' :
                          item.status === 'PENDING' ? 'bg-bank-gold/20 text-yellow-800 border-bank-gold' : 
                          'bg-red-100 text-red-800 border-red-300'
                        }`}>{item.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}