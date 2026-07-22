'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Loader2, ShieldCheck } from 'lucide-react';
import { getBranchRoster, assignShift } from '@/features/shifts/actions';
import { getDepartmentTeam } from '@/features/department/actions';

export function ShiftRoster() {
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '', startTime: '08:00', endTime: '17:00', station: 'TELLER_COUNTER', notes: ''
  });

  const loadMatrix = async () => {
    setIsLoading(true);
    const [rosterRes, teamRes] = await Promise.all([
      getBranchRoster(new Date(currentDate)),
      getDepartmentTeam()
    ]);

    if (rosterRes.success) setShifts(rosterRes.shifts || []);
    if (teamRes.success) setTeam(teamRes.team || []);
    setIsLoading(false);
  };

  useEffect(() => { loadMatrix(); }, [currentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAssigning(true);
    const res = await assignShift({ ...formData, date: currentDate });
    if (res.success) {
      setShowForm(false);
      loadMatrix();
    } else {
      alert(res.error);
    }
    setIsAssigning(false);
  };

  const formatStation = (station: string) => station.replace('_', ' ');

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
      
      {/* Header Panel */}
      <div className="bg-[#160f29] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center">
            <ShieldCheck className="w-6 h-6 mr-3 text-[#ffbb00]" /> 
            Tactical Shift Roster
          </h2>
          <p className="text-white/60 text-xs font-bold mt-2 uppercase tracking-widest">
            Branch Coverage & Station Assignments
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input 
            type="date" 
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="px-4 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl text-sm font-black focus:outline-none focus:border-[#ffbb00] transition-all w-full md:w-auto"
          />
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 bg-[#ffbb00] hover:bg-[#ffd043] text-[#160f29] rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-md flex items-center shrink-0"
          >
            <Plus className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Assign</span>
          </button>
        </div>
      </div>

      {/* Assignment Form (Toggled) */}
      {showForm && (
        <div className="p-6 bg-blue-50/50 border-b border-blue-100 animate-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#160f29]/60">Personnel</label>
              <select 
                value={formData.userId} onChange={(e) => setFormData({...formData, userId: e.target.value})}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:border-[#2a27fd] transition-all" required
              >
                <option value="">Select Staff...</option>
                {team.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#160f29]/60">Station</label>
              <select 
                value={formData.station} onChange={(e) => setFormData({...formData, station: e.target.value})}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:border-[#2a27fd] transition-all"
              >
                <option value="TELLER_COUNTER">Teller Counter</option>
                <option value="VAULT_CUSTODIAN">Vault Custodian</option>
                <option value="CUSTOMER_SERVICE">Customer Service</option>
                <option value="SECURITY_DESK">Security Desk</option>
                <option value="BACK_OFFICE">Back Office</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="space-y-2 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#160f29]/60">Start</label>
                <input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold" required />
              </div>
              <div className="space-y-2 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#160f29]/60">End</label>
                <input type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold" required />
              </div>
            </div>
            <button type="submit" disabled={isAssigning} className="w-full py-2.5 bg-[#2a27fd] text-white rounded-xl font-black uppercase tracking-wider text-xs hover:bg-[#1a18d0] transition-all">
              {isAssigning ? 'Saving...' : 'Deploy'}
            </button>
          </form>
        </div>
      )}

      {/* Roster Matrix */}
      <div className="p-6 md:p-8">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-[#2a27fd] animate-spin" /></div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No shifts scheduled for this date</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shifts.map((shift) => (
              <div key={shift.id} className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm hover:border-[#2a27fd]/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 bg-[#160f29] text-[#ffbb00] text-[9px] font-black uppercase tracking-widest rounded-md shadow-sm">
                    {formatStation(shift.station)}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${shift.status === 'SCHEDULED' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                </div>
                
                <h3 className="font-black text-[#160f29] text-lg">{shift.user.name}</h3>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-xs font-bold text-[#160f29]/60">
                    <Clock className="w-3.5 h-3.5 mr-2 text-[#2a27fd]" />
                    {new Date(shift.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(shift.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}