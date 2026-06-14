'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Activity, ArrowRight, ShieldAlert, 
  Edit, Trash2, FileText, User, 
  CheckCircle, XCircle, Loader2, MapPin, ShieldCheck
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';

// THE CORRECT ACTION FOR BRANCH MANAGERS
import { getBranchDirectory, approveEmployeeAccount } from '@/features/hr/actions';

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
  
  const [documentViewer, setDocumentViewer] = useState<{ isOpen: boolean, type: 'CV' | 'AVATAR', name: string } | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

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
    // Passing undefined as any satisfies TypeScript's 2-argument requirement
    const res = await approveEmployeeAccount(id, undefined as any);
    if (res.success) {
      await fetchBranchData(); 
    } else {
      alert(res.error);
    }
    setIsProcessingId(null);
  };

  const openDocument = (type: 'CV' | 'AVATAR', name: string) => {
    setDocumentViewer({ isOpen: true, type, name });
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#fcfcff] flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-[#2a27fd]/20 rounded-full animate-ping"></div>
          <Loader2 className="w-12 h-12 text-[#2a27fd] animate-spin relative z-10" />
        </div>
        <h2 className="text-xl font-black text-[#160f29] uppercase tracking-widest mt-4">Loading Command Center...</h2>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#fcfcff] flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6 drop-shadow-md" />
        <h1 className="text-4xl font-black text-[#160f29] tracking-tight">Clearance Denied</h1>
        <p className="text-[#160f29]/60 font-bold mt-3 max-w-md">{errorMsg}</p>
        <button onClick={() => window.location.href = '/dashboard'} className="mt-8 px-8 py-3.5 bg-[#2a27fd] hover:bg-[#1a18d0] text-white rounded-xl font-black shadow-lg transition-all">
          Return to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcff] p-4 md:p-8 animate-in fade-in duration-300 relative overflow-x-hidden">
      
      {/* --- HEADER --- */}
      <div className="mb-8 border-b border-gray-100 pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#160f29] tracking-tight flex items-center">
              {branchName} 
            </h1>
            <p className="text-[#2a27fd] font-black mt-2 text-lg">Welcome back, {adminName}</p>
            <p className="text-[#160f29]/50 font-bold mt-1 flex items-center text-sm md:text-base">
              <MapPin className="w-4 h-4 mr-1.5 text-[#ffbb00]" /> {branchLocation} • Local Command Center
            </p>
          </div>
        </div>

        {/* --- TABS (Fully Responsive Scrollable) --- */}
        <div className="flex w-full md:w-auto bg-[#160f29]/5 border border-[#160f29]/10 p-1.5 rounded-xl shadow-inner overflow-x-auto mt-8">
          <button 
            onClick={() => setActiveTab('OVERVIEW')} 
            className={`flex-1 md:flex-none px-6 py-3 text-sm font-black rounded-lg transition-all whitespace-nowrap flex items-center justify-center ${activeTab === 'OVERVIEW' ? 'bg-[#160f29] text-white shadow-md' : 'text-[#160f29]/60 hover:text-[#160f29] hover:bg-[#160f29]/5'}`}
          >
            <Activity className="w-4 h-4 mr-2" /> Live Operations
          </button>
          <button 
            onClick={() => setActiveTab('PERSONNEL')} 
            className={`flex-1 md:flex-none px-6 py-3 text-sm font-black rounded-lg transition-all whitespace-nowrap flex items-center justify-center ${activeTab === 'PERSONNEL' ? 'bg-[#160f29] text-white shadow-md' : 'text-[#160f29]/60 hover:text-[#160f29] hover:bg-[#160f29]/5'}`}
          >
            <Users className="w-4 h-4 mr-2" /> Branch Directory
            {pendingStaff.length > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'PERSONNEL' ? 'bg-[#ffbb00] text-[#160f29]' : 'bg-[#ffbb00] text-[#160f29]'}`}>{pendingStaff.length}</span>}
          </button>
        </div>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'OVERVIEW' && (
        <div className="animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard title="Active Personnel" value={activeStaff.length.toString()} trend="Current Roster" isPositive={true} Icon={Users} />
            <StatCard title="Pending KYC Approvals" value={pendingStaff.length.toString()} trend="Action Required" isPositive={pendingStaff.length === 0} Icon={ShieldAlert} />
            <StatCard title="Total Registered Accounts" value={(activeStaff.length + pendingStaff.length).toString()} trend="All Time" isPositive={true} Icon={ShieldCheck} />
          </div>
        </div>
      )}

      {/* --- PERSONNEL TAB --- */}
      {activeTab === 'PERSONNEL' && (
        <div className="animate-in fade-in duration-300 space-y-8">
          
          {/* Pending Staff Queue */}
          {pendingStaff.length > 0 && (
            <div className="bg-gradient-to-br from-[#ffbb00] to-[#ffd043] rounded-3xl shadow-[0_10px_40px_rgba(255,187,0,0.2)] overflow-hidden border border-[#ffbb00]/50">
              <div className="p-5 md:p-6 border-b border-[#160f29]/10 bg-white/20 backdrop-blur-md flex items-center">
                <ShieldAlert className="w-6 h-6 text-[#160f29] mr-3" />
                <h2 className="text-xl font-black text-[#160f29] tracking-tight">Pending Onboarding & KYC</h2>
              </div>
              <div className="overflow-x-auto bg-[#fcfcff]">
                <table className="w-full text-left text-sm text-[#160f29] min-w-[500px]">
                  <thead className="bg-[#160f29] text-xs uppercase text-[#fcfcff] tracking-widest border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-5 font-black">Applicant Profile</th>
                      <th className="px-6 py-5 font-black text-right">Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingStaff.map((req) => (
                      <tr key={req.id} className="hover:bg-[#2a27fd]/5 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="font-black text-[#160f29] text-base group-hover:text-[#2a27fd] transition-colors">{req.name}</div>
                          <div className="text-xs text-[#160f29]/60 font-bold mt-1">{req.email}</div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => handleApprove(req.id)} 
                            disabled={isProcessingId === req.id} 
                            className="inline-flex items-center px-6 py-3 bg-[#160f29] hover:bg-black text-white rounded-xl text-xs font-black shadow-md disabled:opacity-50 transition-all uppercase tracking-wider"
                          >
                            {isProcessingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2 text-[#ffbb00]" /> Approve</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active Roster */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
             <div className="p-6 md:p-8 border-b border-gray-100 bg-[#fcfcff] flex justify-between items-center">
              <h2 className="text-xl md:text-2xl font-black text-[#160f29] tracking-tight">Active Personnel Directory</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#160f29] min-w-[600px]">
                <thead className="bg-[#160f29] text-xs uppercase text-[#fcfcff] tracking-widest border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5 font-black">Employee Profile</th>
                    <th className="px-6 py-5 font-black">Role</th>
                    <th className="px-6 py-5 font-black text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeStaff.length === 0 ? (
                     <tr><td colSpan={3} className="px-6 py-16 text-center text-[#160f29]/50 font-bold uppercase tracking-widest">No active employees found in this branch.</td></tr>
                  ) : (
                    activeStaff.map((emp) => (
                      <tr key={emp.id} className="hover:bg-[#2a27fd]/5 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="font-black text-[#160f29] text-base group-hover:text-[#2a27fd] transition-colors">{emp.name}</div>
                          <div className="text-[10px] font-mono text-[#160f29]/50 font-black mt-1 uppercase tracking-wider">{emp.email}</div>
                        </td>
                        <td className="px-6 py-5 font-black text-[#160f29]">{emp.role.replace('_', ' ')}</td>
                        <td className="px-6 py-5 text-right">
                          <Link 
                            href={`/hr/employees/${emp.id}`} 
                            className="inline-flex items-center px-6 py-3 bg-[#fcfcff] text-[#160f29] font-black text-xs uppercase tracking-wider rounded-xl border border-gray-200 hover:border-[#2a27fd] hover:bg-[#2a27fd] hover:text-white transition-all shadow-sm"
                          >
                            <Edit className="w-4 h-4 mr-2" /> View Profile
                          </Link>
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
    </div>
  );
}