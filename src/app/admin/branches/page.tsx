'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { 
  Users, Activity, ShieldAlert, Edit, 
  CheckCircle, XCircle, Loader2, MapPin, 
  ShieldCheck, LogOut, FileText, Eye, Fingerprint
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';

// THE CORRECT ACTIONS
import { getBranchDirectory, approveEmployeeAccount, rejectEmployeeAccount } from '@/features/hr/actions';

export default function RealBranchAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PERSONNEL'>('OVERVIEW');
  
  // Live Data States
  const [adminName, setAdminName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchLocation, setBranchLocation] = useState("");
  const [activeStaff, setActiveStaff] = useState<any[]>([]);
  const [pendingStaff, setPendingStaff] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // New High-End UI States
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [reviewUser, setReviewUser] = useState<any | null>(null); // The Dossier Modal State

  const fetchBranchData = async () => {
    setIsLoadingData(true);
    try {
      const res = await getBranchDirectory();
      if (res.success) {
        setAdminName(res.adminName || 'Admin');
        setBranchName(res.branchName || 'Unassigned Branch');
        setBranchLocation(res.branchLocation || 'Location Pending');
        setActiveStaff(res.active || []);
        setPendingStaff(res.pending || []);
      } else {
        setErrorMsg(res.error || "Failed to load branch data.");
      }
    } catch (error) {
      setErrorMsg("Failed to connect to branch secure database.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchBranchData();
  }, []);

  const handleApprove = async (id: string) => {
    setIsProcessingId(id);
    const res = await approveEmployeeAccount(id, undefined as any);
    if (res.success) {
      setReviewUser(null);
      await fetchBranchData(); 
    } else {
      alert(res.error);
    }
    setIsProcessingId(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to permanently reject this clearance?")) return;
    setIsProcessingId(id);
    const res = await rejectEmployeeAccount(id); // Ensure this exists in your actions!
    if (res.success) {
      setReviewUser(null);
      await fetchBranchData();
    } else {
      alert(res.error);
    }
    setIsProcessingId(null);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const handleImpersonate = (userName: string) => {
    // Placeholder for real impersonation logic
    alert(`Ghost Protocol Initiated.\n\nSimulating terminal access for ${userName}... (Backend session generation required)`);
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2a27fd]/10 via-[#0a0a0f] to-[#0a0a0f]"></div>
        <div className="relative flex items-center justify-center w-32 h-32 mb-6">
          <div className="absolute inset-0 border-4 border-t-[#2a27fd] border-r-transparent border-b-[#ffbb00] border-l-transparent rounded-full animate-spin duration-1000"></div>
          <Fingerprint className="w-12 h-12 text-white/50 animate-pulse relative z-10" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-widest mt-4 animate-pulse">Decrypting Command Center...</h2>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="w-24 h-24 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        <h1 className="text-5xl font-black text-white tracking-tight">Clearance Denied</h1>
        <p className="text-gray-400 font-bold mt-4 max-w-md text-lg">{errorMsg}</p>
        <button onClick={handleLogout} className="mt-8 px-10 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black shadow-lg transition-all uppercase tracking-widest">
          Terminate Session
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-4 md:p-8 animate-in fade-in duration-500 relative overflow-x-hidden font-sans">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <div className="flex justify-between items-center mb-10 bg-white p-4 md:p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#160f29] tracking-tight flex items-center">
            {branchName} 
          </h1>
          <p className="text-[#160f29]/50 font-bold mt-1 flex items-center text-sm md:text-base">
            <MapPin className="w-4 h-4 mr-1.5 text-[#2a27fd]" /> {branchLocation} • Sector Command
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right mr-4">
            <p className="text-[#160f29] font-black">{adminName}</p>
            <p className="text-xs text-[#2a27fd] font-bold uppercase tracking-widest">Commanding Officer</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all shadow-sm flex items-center justify-center group"
            title="Log Out"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* --- COMMAND TABS --- */}
      <div className="flex w-full md:w-auto bg-white border border-gray-100 p-2 rounded-2xl shadow-sm overflow-x-auto mb-8 relative z-10">
        <button 
          onClick={() => setActiveTab('OVERVIEW')} 
          className={`flex-1 md:flex-none px-8 py-3.5 text-sm font-black rounded-xl transition-all whitespace-nowrap flex items-center justify-center ${activeTab === 'OVERVIEW' ? 'bg-[#160f29] text-white shadow-md' : 'text-[#160f29]/60 hover:text-[#160f29] hover:bg-gray-50'}`}
        >
          <Activity className="w-4 h-4 mr-2" /> Telemetry & Ops
        </button>
        <button 
          onClick={() => setActiveTab('PERSONNEL')} 
          className={`flex-1 md:flex-none px-8 py-3.5 text-sm font-black rounded-xl transition-all whitespace-nowrap flex items-center justify-center ${activeTab === 'PERSONNEL' ? 'bg-[#160f29] text-white shadow-md' : 'text-[#160f29]/60 hover:text-[#160f29] hover:bg-gray-50'}`}
        >
          <Users className="w-4 h-4 mr-2" /> Roster Management
          {pendingStaff.length > 0 && (
            <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs animate-pulse ${activeTab === 'PERSONNEL' ? 'bg-[#ffbb00] text-[#160f29]' : 'bg-[#ffbb00] text-[#160f29]'}`}>
              {pendingStaff.length}
            </span>
          )}
        </button>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'OVERVIEW' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Active Operatives" value={activeStaff.length.toString()} trend="Fully Cleared" isPositive={true} Icon={ShieldCheck} />
            <StatCard title="Pending KYC" value={pendingStaff.length.toString()} trend="Action Required" isPositive={pendingStaff.length === 0} Icon={ShieldAlert} />
            <StatCard title="Total Identities" value={(activeStaff.length + pendingStaff.length).toString()} trend="Database Wide" isPositive={true} Icon={Users} />
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mt-8 text-center h-64 flex flex-col items-center justify-center">
            <Activity className="w-16 h-16 text-gray-200 mb-4" />
            <h3 className="text-xl font-black text-gray-400">System Telemetry Online</h3>
            <p className="text-gray-400 font-medium mt-2">All branch financial indicators are operating within normal parameters.</p>
          </div>
        </div>
      )}

      {/* --- PERSONNEL TAB --- */}
      {activeTab === 'PERSONNEL' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-10">
          
          {/* PENDING QUEUE (High Priority) */}
          {pendingStaff.length > 0 && (
            <div className="bg-gradient-to-br from-[#160f29] to-[#201540] rounded-3xl shadow-2xl overflow-hidden border border-[#2a27fd]/30 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#2a27fd]/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              
              <div className="p-6 md:p-8 border-b border-white/10 flex items-center relative z-10">
                <ShieldAlert className="w-7 h-7 text-[#ffbb00] mr-4 animate-pulse" />
                <h2 className="text-2xl font-black text-white tracking-tight">Requires Command Authorization</h2>
              </div>
              
              <div className="overflow-x-auto relative z-10 p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {pendingStaff.map((req) => (
                    <div key={req.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all backdrop-blur-md">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-black text-white text-lg">{req.name}</h3>
                          <p className="text-sm text-gray-400 font-medium">{req.email}</p>
                        </div>
                        <span className="px-3 py-1 bg-[#ffbb00]/20 text-[#ffbb00] text-xs font-black rounded-full uppercase tracking-wider">
                          Pending
                        </span>
                      </div>
                      
                      <div className="mt-6">
                        <button 
                          onClick={() => setReviewUser(req)}
                          className="w-full py-3 bg-[#2a27fd] hover:bg-[#3d3aff] text-white font-black rounded-xl text-sm transition-colors shadow-lg shadow-[#2a27fd]/20 flex items-center justify-center uppercase tracking-widest"
                        >
                          <Eye className="w-4 h-4 mr-2" /> Review Dossier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE ROSTER */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 bg-[#fcfcff] flex justify-between items-center">
              <h2 className="text-2xl font-black text-[#160f29] tracking-tight">Active Operatives</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#160f29] min-w-[700px]">
                <thead className="bg-[#fcfcff] text-xs uppercase text-gray-400 font-black tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5">Identity</th>
                    <th className="px-8 py-5">Clearance Role</th>
                    <th className="px-8 py-5 text-right">Terminal Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeStaff.length === 0 ? (
                    <tr><td colSpan={3} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest">No active personnel assigned to this sector.</td></tr>
                  ) : (
                    activeStaff.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-[#160f29] text-white flex items-center justify-center font-black text-lg mr-4">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-black text-[#160f29] text-base">{emp.name}</div>
                              <div className="text-xs font-mono text-gray-500 font-bold mt-0.5">{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-gray-100 text-[#160f29] rounded-lg text-xs font-black uppercase tracking-wider">
                            {emp.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleImpersonate(emp.name)}
                              className="p-2.5 bg-gray-100 text-gray-600 hover:bg-[#160f29] hover:text-white rounded-lg transition-all"
                              title="Login as User (Ghost Protocol)"
                            >
                              <Fingerprint className="w-4 h-4" />
                            </button>
                            <Link 
                              href={`/hr/employees/${emp.id}`} 
                              className="inline-flex items-center px-5 py-2.5 bg-white text-[#160f29] font-black text-xs uppercase tracking-wider rounded-lg border border-gray-200 hover:border-[#2a27fd] hover:text-[#2a27fd] transition-all shadow-sm"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1.5" /> Modify
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- THE DOSSIER MODAL (Review User) --- */}
      {reviewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Frosted Glass Backdrop */}
          <div 
            className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setReviewUser(null)}
          ></div>
          
          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-[#160f29] p-6 text-white flex justify-between items-start">
              <div>
                <span className="text-[#ffbb00] text-xs font-black uppercase tracking-widest mb-1 block">Security Clearance Review</span>
                <h2 className="text-3xl font-black">{reviewUser.name}</h2>
                <p className="text-gray-400 font-mono mt-1">{reviewUser.email}</p>
              </div>
              <button 
                onClick={() => setReviewUser(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 bg-gray-50">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Requested Role</p>
                  <p className="text-[#160f29] font-black text-lg">{reviewUser.role?.replace('_', ' ') || 'Unknown'}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Phone Protocol</p>
                  <p className="text-[#160f29] font-black text-lg">{reviewUser.phone || 'N/A'}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">NIN Identifier</p>
                  <p className="text-[#160f29] font-black font-mono">{reviewUser.nin || 'N/A'}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">BVN Identifier</p>
                  <p className="text-[#160f29] font-black font-mono">{reviewUser.bvn || 'N/A'}</p>
                </div>
                <div className="col-span-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Registered Address</p>
                  <p className="text-[#160f29] font-bold">{reviewUser.address || 'No address provided on file.'}</p>
                </div>
              </div>

              {/* Attachments (If CV or Avatar exists) */}
              {(reviewUser.cvUrl || reviewUser.avatarUrl) && (
                <div className="mt-6 flex gap-4">
                  {reviewUser.cvUrl && (
                     <a href={reviewUser.cvUrl} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center p-4 bg-[#2a27fd]/10 text-[#2a27fd] rounded-xl font-black text-sm uppercase tracking-wider hover:bg-[#2a27fd]/20 transition-colors">
                       <FileText className="w-4 h-4 mr-2" /> View Resume
                     </a>
                  )}
                  {reviewUser.avatarUrl && (
                     <a href={reviewUser.avatarUrl} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center p-4 bg-[#160f29]/10 text-[#160f29] rounded-xl font-black text-sm uppercase tracking-wider hover:bg-[#160f29]/20 transition-colors">
                       <Fingerprint className="w-4 h-4 mr-2" /> View ID Scan
                     </a>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-white flex gap-4">
              <button 
                onClick={() => handleReject(reviewUser.id)}
                disabled={isProcessingId === reviewUser.id}
                className="flex-1 py-4 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessingId === reviewUser.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reject & Purge'}
              </button>
              <button 
                onClick={() => handleApprove(reviewUser.id)}
                disabled={isProcessingId === reviewUser.id}
                className="flex-[2] py-4 bg-[#160f29] hover:bg-black text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessingId === reviewUser.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authorize Clearance'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}