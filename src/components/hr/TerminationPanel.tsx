'use client';

import React, { useState, useEffect } from 'react';
import { AlertOctagon, UserX, Laptop, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
import { getStaffForOffboarding, terminateEmployee } from '@/features/offboarding/actions';

export function TerminationPanel() {
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmText, setConfirmText] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMode, setSuccessMode] = useState(false);

  const loadStaff = async () => {
    setIsLoading(true);
    const res = await getStaffForOffboarding();
    if (res.success) setStaff(res.staff || []);
    setIsLoading(false);
  };

  useEffect(() => { loadStaff(); }, []);

  const selectedUser = staff.find(s => s.id === selectedUserId);
  const isConfirmValid = confirmText === 'TERMINATE';

  const handleTermination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !isConfirmValid) return;

    setIsSubmitting(true);
    const res = await terminateEmployee(selectedUser.id, notes);
    
    if (res.success) {
      setSuccessMode(true);
      setTimeout(() => {
        setSuccessMode(false);
        setSelectedUserId('');
        setNotes('');
        setConfirmText('');
        loadStaff(); // Refresh the list
      }, 3000);
    } else {
      alert(res.error);
    }
    setIsSubmitting(false);
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 text-red-500 animate-spin" /></div>;

  if (successMode) {
    return (
      <div className="bg-white rounded-3xl border border-red-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-black text-[#160f29]">Termination Protocol Executed</h2>
        <p className="text-gray-500 mt-2 font-bold">Access revoked, payroll frozen, and audit logs sealed.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-red-100 shadow-[0_8px_30px_rgba(220,38,38,0.06)] overflow-hidden">
      {/* Danger Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 md:p-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center">
            <AlertOctagon className="w-6 h-6 mr-3 text-red-200" /> 
            Offboarding Command
          </h2>
          <p className="text-red-100/80 text-xs font-bold mt-2 uppercase tracking-widest">
            Idempotent Employee Termination Engine
          </p>
        </div>
        <UserX className="w-12 h-12 text-white/10 hidden md:block" />
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left: Selection & Assets */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-[#160f29]/50">Target Personnel</label>
            <select 
              value={selectedUserId} 
              onChange={(e) => { setSelectedUserId(e.target.value); setConfirmText(''); }}
              className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-black focus:border-red-500 transition-all outline-none"
            >
              <option value="">-- Select Employee --</option>
              {staff.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
              ))}
            </select>
          </div>

          {selectedUser && (
            <div className="p-5 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in">
              <h3 className="text-xs font-black text-red-800 uppercase tracking-widest mb-3 flex items-center">
                <Laptop className="w-4 h-4 mr-2" /> Pending Hardware Recovery
              </h3>
              
              {selectedUser.assets.length === 0 ? (
                <p className="text-sm font-bold text-red-600/70">No active assets assigned to this user.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedUser.assets.map((asset: any) => (
                    <li key={asset.id} className="text-sm font-bold text-red-900 bg-white/60 p-2.5 rounded-lg border border-red-200/50 flex justify-between">
                      <span>{asset.deviceType}</span>
                      <span className="font-mono text-xs opacity-70">{asset.tagNumber}</span>
                    </li>
                  ))}
                </ul>
              )}
              {selectedUser.assets.length > 0 && (
                <div className="mt-4 text-[10px] uppercase tracking-widest font-black text-red-600 flex items-start">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Terminating will automatically flag IT for asset recovery.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: The Danger Zone Form */}
        <div className="border-t lg:border-t-0 lg:border-l border-gray-100 pt-8 lg:pt-0 lg:pl-10">
          <form onSubmit={handleTermination} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-[#160f29]/50">Offboarding Notes (Audit Ledger)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for termination, final handover notes..."
                className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-bold focus:border-red-500 transition-all outline-none h-24 resize-none"
                disabled={!selectedUser}
                required
              />
            </div>

            <div className="p-5 border-2 border-red-100 bg-white rounded-2xl space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-red-600 block">
                Type "TERMINATE" to unlock
              </label>
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="TERMINATE"
                className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-black text-red-700 placeholder:text-red-300 focus:border-red-500 focus:bg-white transition-all outline-none text-center"
                disabled={!selectedUser}
              />
              
              <button 
                type="submit"
                disabled={!isConfirmValid || isSubmitting || !selectedUser}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black uppercase tracking-wider flex items-center justify-center transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:shadow-none"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UserX className="w-5 h-5 mr-2" />} 
                Execute Termination
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}