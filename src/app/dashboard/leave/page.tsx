'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Calendar, Loader2, Clock, History, ArrowRight, 
  PlaneTakeoff, Heart, Sparkles, Plus, X 
} from 'lucide-react';
import { submitLeaveRequest, getMyLeaveHistory } from '@/features/leave/actions';

export default function LeaveManagementPortal() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Form State
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchHistory = async () => {
    setIsLoading(true);
    const res = await getMyLeaveHistory();
    if (res.success) {
      setHistory(res.history || res.data || res.leaves || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return alert("Please select your leave dates.");
    
    setIsSubmitting(true);
    const res = await submitLeaveRequest({ type: leaveType, startDate, endDate, reason });
    
    if (res.success) {
      alert("Leave request successfully submitted to the Authorization Queue.");
      setStartDate('');
      setEndDate('');
      setReason('');
      setShowApplyForm(false);
      fetchHistory(); 
    } else {
      alert(res.error || "Failed to submit request.");
    }
    setIsSubmitting(false);
  };

  const currentLeave = history?.find(l => l.status === 'ACTIVE' || l.status === 'APPROVED');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcff] flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-[#2a27fd]/20 rounded-full animate-ping"></div>
          <Loader2 className="w-12 h-12 text-[#2a27fd] animate-spin relative z-10" />
        </div>
        <h2 className="text-2xl font-black text-[#160f29] tracking-tight">Decrypting Timeline...</h2>
      </div>
    );
  }

  const daysElapsed = currentLeave ? currentLeave.totalDays - currentLeave.daysRemaining : 0;
  const currentDayIndex = currentLeave?.status === 'ACTIVE' ? daysElapsed + 1 : 0;

  return (
    <div className="min-h-screen bg-[#fcfcff] p-4 md:p-8 font-sans overflow-x-hidden selection:bg-[#ffbb00] selection:text-[#160f29] animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#160f29] flex items-center tracking-tight">
            <Calendar className="w-8 h-8 mr-3 text-[#2a27fd]" /> Leave Portal
          </h1>
          <p className="text-[#160f29]/60 mt-2 font-medium">Manage your time off, track active leaves, and audit your personal history.</p>
        </div>
        
        {!showApplyForm && (
          <button 
            onClick={() => setShowApplyForm(true)}
            className="w-full sm:w-auto bg-[#2a27fd] hover:bg-[#1a18d0] text-white font-black px-6 py-4 rounded-2xl transition-all shadow-[0_10px_20px_rgba(42,39,253,0.3)] hover:shadow-[0_15px_30px_rgba(42,39,253,0.4)] flex items-center justify-center transform hover:-translate-y-1"
          >
            <Plus className="w-5 h-5 mr-2" /> Request Time Off
          </button>
        )}
      </div>

      {/* --- 3D LIVE DAY-TO-DAY TRACKER WIDGET --- */}
      {currentLeave && (
        <div className="mb-10 bg-[#160f29] rounded-[2rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(22,15,41,0.2)] text-[#fcfcff] relative overflow-hidden group animate-in slide-in-from-bottom-8 duration-700">
          
          {/* 3D Glassmorphism Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#2a27fd] rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#ffbb00] rounded-full blur-[90px] opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
          <PlaneTakeoff className="absolute -bottom-10 -right-10 w-72 h-72 opacity-5 text-white pointer-events-none transform -rotate-12" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-12">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className={`w-5 h-5 ${currentLeave.status === 'ACTIVE' ? 'text-[#ffbb00]' : 'text-[#2a27fd]'}`} />
                <span className={`px-4 py-1.5 text-xs font-black rounded-lg uppercase tracking-widest backdrop-blur-md border ${
                  currentLeave.status === 'ACTIVE' ? 'bg-[#ffbb00]/20 text-[#ffbb00] border-[#ffbb00]/30' : 'bg-[#2a27fd]/20 text-[#2a27fd] border-[#2a27fd]/30'
                }`}>
                  {currentLeave.status === 'ACTIVE' ? 'Currently on Leave' : 'Upcoming Leave Approved'}
                </span>
              </div>
              
              <h2 className="text-5xl md:text-6xl font-black mt-2 mb-4 tracking-tighter">
                {currentLeave.status === 'ACTIVE' 
                  ? `Day ${currentDayIndex} of ${currentLeave.totalDays}` 
                  : `Starts in ${Math.ceil((new Date(currentLeave.startDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} Days`
                }
              </h2>
              
              <p className={`text-lg font-bold ${currentLeave.status === 'ACTIVE' ? 'text-white/80' : 'text-white/60'}`}>
                {new Date(currentLeave.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — {new Date(currentLeave.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>

              {/* High-Contrast Timeline Visualizer */}
              <div className="mt-10">
                <p className="text-xs font-black uppercase tracking-widest mb-4 opacity-60">Timeline Visualizer</p>
                <div className="flex flex-wrap gap-2.5">
                  {Array.from({ length: currentLeave.totalDays }).map((_, index) => {
                    const dayNum = index + 1;
                    const isPast = dayNum < currentDayIndex && currentLeave.status === 'ACTIVE';
                    const isToday = dayNum === currentDayIndex && currentLeave.status === 'ACTIVE';
                    
                    let bgClass = "bg-white/5 border-white/10 text-white/30"; // Future
                    if (isPast) bgClass = "bg-[#2a27fd]/30 text-white border-[#2a27fd]/50 font-black shadow-inner"; // Past
                    if (isToday) bgClass = "bg-[#ffbb00] text-[#160f29] border-[#ffbb00] font-black scale-110 shadow-[0_0_20px_rgba(255,187,0,0.5)] z-10 relative"; // Today
                    if (currentLeave.status === 'APPROVED') bgClass = "bg-white/10 border-white/20 text-white/50"; // Approved (Future)

                    return (
                      <div 
                        key={dayNum} 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm border transition-all duration-500 ${bgClass}`}
                        title={`Day ${dayNum}`}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={`p-8 rounded-[2rem] backdrop-blur-xl border flex flex-col items-center justify-center min-w-[240px] shadow-2xl ${
              currentLeave.status === 'ACTIVE' ? 'bg-white/10 border-white/10' : 'bg-[#2a27fd]/10 border-[#2a27fd]/20'
            }`}>
              <p className="text-sm font-black uppercase tracking-widest mb-2 opacity-80">Days Remaining</p>
              <p className="text-8xl font-black tracking-tighter text-[#ffbb00] drop-shadow-lg">{currentLeave.daysRemaining}</p>
            </div>
          </div>

          <div className="relative z-10 mt-10 pt-8 border-t border-white/10 flex items-center bg-white/5 p-4 rounded-2xl backdrop-blur-sm">
            <Heart className={`w-6 h-6 mr-4 flex-shrink-0 ${currentLeave.status === 'ACTIVE' ? 'text-red-500 animate-pulse' : 'text-[#ffbb00]'}`} />
            <p className="font-bold text-sm md:text-base tracking-wide">
              {currentLeave.status === 'ACTIVE' 
                ? `Enjoy your leave and stay healthy! We already miss you at the command center, ${firstName}.` 
                : `Your request has been fully authorized, ${firstName}. Prepare for your upcoming time off!`}
            </p>
          </div>
        </div>
      )}

      {/* --- OPTIONAL REQUEST FORM (High Contrast) --- */}
      {showApplyForm && (
        <div className="mb-10 bg-white border border-gray-100 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 md:p-10 animate-in slide-in-from-top-8 duration-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2a27fd] to-[#ffbb00]"></div>
          
          <button 
            onClick={() => setShowApplyForm(false)}
            className="absolute top-8 right-8 text-[#160f29]/40 hover:text-[#160f29] transition-colors bg-[#fcfcff] p-3 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="text-2xl font-black text-[#160f29] mb-8 border-b border-gray-100 pb-4">Draft New Leave Request</h2>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-xs font-black text-[#160f29]/60 uppercase tracking-widest mb-3">Leave Category</label>
                <select 
                  value={leaveType} 
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-5 py-4 bg-[#fcfcff] border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2a27fd] text-[#160f29] transition-all shadow-sm hover:border-[#2a27fd]/50"
                >
                  <option value="ANNUAL">Annual / Vacation</option>
                  <option value="SICK">Medical / Sick Leave</option>
                  <option value="PREGNANCY_MATERNITY">Maternity Leave</option>
                  <option value="UNPAID">Unpaid Personal Leave</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-black text-[#160f29]/60 uppercase tracking-widest mb-3">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-[#fcfcff] border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2a27fd] text-[#160f29] transition-all shadow-sm hover:border-[#2a27fd]/50"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-black text-[#160f29]/60 uppercase tracking-widest mb-3">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-[#fcfcff] border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2a27fd] text-[#160f29] transition-all shadow-sm hover:border-[#2a27fd]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#160f29]/60 uppercase tracking-widest mb-3">Reason (Optional)</label>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide context for your branch manager..."
                rows={3}
                className="w-full px-5 py-4 bg-[#fcfcff] border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2a27fd] text-[#160f29] transition-all resize-none shadow-sm hover:border-[#2a27fd]/50"
              />
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => setShowApplyForm(false)}
                className="px-8 py-4 text-sm font-black text-[#160f29]/60 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                Cancel Draft
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#160f29] hover:bg-black text-[#ffbb00] px-10 py-4 font-black rounded-2xl transition-all shadow-lg flex justify-center items-center disabled:opacity-50 min-w-[220px]"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit to Queue'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- PERSONAL MASTER HISTORY --- */}
      <div className="bg-white border border-gray-100 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center bg-[#fcfcff]">
          <History className="w-6 h-6 mr-3 text-[#2a27fd]" />
          <h2 className="text-xl font-black text-[#160f29] tracking-tight">Personal Ledger</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#160f29]">
            <thead className="bg-white text-[10px] uppercase text-[#160f29]/50 font-black tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Timeline</th>
                <th className="px-8 py-5 text-center">Duration</th>
                <th className="px-8 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center bg-[#fcfcff]">
                    <Clock className="w-12 h-12 text-[#160f29]/20 mx-auto mb-4" />
                    <p className="text-[#160f29]/60 font-black">You have no recorded leave history.</p>
                  </td>
                </tr>
              ) : (
                history.map((leave: any) => (
                  <tr key={leave.id} className="hover:bg-[#fcfcff] transition-colors group">
                    <td className="px-8 py-6 font-black text-[#160f29] group-hover:text-[#2a27fd] transition-colors">{leave.type.replace('_', ' ')}</td>
                    <td className="px-8 py-6 font-bold text-[#160f29]/80">
                      {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} 
                      <ArrowRight className="inline w-4 h-4 mx-3 text-[#160f29]/30" /> 
                      {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
                    </td>
                    <td className="px-8 py-6 text-center font-black text-[#2a27fd] text-lg">
                      {leave.totalDays}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`px-4 py-2 text-[10px] font-black rounded-lg uppercase tracking-wider shadow-sm border ${
                        leave.status === 'APPROVED' || leave.status === 'COMPLETED' ? 'bg-green-100 text-green-800 border-green-200' : 
                        leave.status === 'ACTIVE' ? 'bg-[#2a27fd]/10 text-[#2a27fd] border-[#2a27fd]/20' :
                        leave.status === 'PENDING' ? 'bg-[#ffbb00]/20 text-[#160f29] border-[#ffbb00]/30' : 
                        'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}