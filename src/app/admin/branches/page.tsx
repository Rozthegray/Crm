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
        // Adding the || '' ensures it's always a string, keeping TypeScript happy!
        setAdminName(res.adminName || 'Admin');
        setBranchName(res.branchName || 'Unassigned Branch');
        setBranchLocation(res.branchLocation || 'Location Pending');
        setActiveStaff(res.active || []);
      } else {
        // Adding the fallback string satisfies the TypeScript compiler perfectly
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
    const res = await approveEmployeeAccount(id);
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
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-bank-gold animate-spin mb-4" />
        <h2 className="text-xl font-black text-bank-blue-dark">Loading Local Branch Data...</h2>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-extrabold text-slate-900">Clearance Denied</h1>
        <p className="text-slate-600 font-medium mt-2">{errorMsg}</p>
        <button onClick={() => window.location.href = '/dashboard'} className="mt-6 px-6 py-2 bg-bank-blue text-white rounded-lg font-bold">
          Return to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 animate-in fade-in duration-300 relative">
      
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center">
              {branchName} 
            </h1>
            <p className="text-bank-blue font-black mt-2 text-lg">Welcome back, {adminName}</p>
            <p className="text-slate-500 font-bold mt-1 flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-bank-gold" /> {branchLocation} • Local Command Center
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mt-8">
          <button onClick={() => setActiveTab('OVERVIEW')} className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'OVERVIEW' ? 'bg-bank-blue text-white shadow-sm' : 'bg-white border border-gray-200 text-slate-600 hover:text-bank-blue'}`}>
            <Activity className="w-4 h-4 inline mr-2" /> Live Operations
          </button>
          <button onClick={() => setActiveTab('PERSONNEL')} className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center ${activeTab === 'PERSONNEL' ? 'bg-bank-blue text-white shadow-sm' : 'bg-white border border-gray-200 text-slate-600 hover:text-bank-blue'}`}>
            <Users className="w-4 h-4 inline mr-2" /> Branch Directory
            {pendingStaff.length > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingStaff.length}</span>}
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Active Personnel" value={activeStaff.length.toString()} trend="Current Roster" isPositive={true} Icon={Users} />
            <StatCard title="Pending KYC Approvals" value={pendingStaff.length.toString()} trend="Action Required" isPositive={pendingStaff.length === 0} Icon={ShieldAlert} />
            <StatCard title="Total Registered Accounts" value={(activeStaff.length + pendingStaff.length).toString()} trend="All Time" isPositive={true} Icon={ShieldCheck} />
          </div>
        </div>
      )}

      {/* PERSONNEL TAB */}
      {activeTab === 'PERSONNEL' && (
        <div className="animate-in fade-in duration-300 space-y-8">
          
          {/* Pending Staff Queue */}
          {pendingStaff.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-md overflow-hidden">
              <div className="p-5 border-b border-red-200 bg-red-100 flex items-center">
                <ShieldAlert className="w-6 h-6 text-red-700 mr-2.5" />
                <h2 className="text-xl font-black text-red-900">Pending Onboarding & KYC</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-900">
                  <thead className="bg-red-50/50 text-xs uppercase text-red-800 border-b border-red-200">
                    <tr>
                      <th className="px-6 py-4 font-black">Applicant Profile</th>
                      <th className="px-6 py-4 font-black text-right">Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {pendingStaff.map((req) => (
                      <tr key={req.id} className="hover:bg-red-100/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-black text-slate-900 text-base">{req.name}</div>
                          <div className="text-sm text-slate-600 font-medium">{req.email}</div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button onClick={() => handleApprove(req.id)} disabled={isProcessingId === req.id} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-black shadow-sm disabled:opacity-50">
                            {isProcessingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1.5" /> Approve</>}
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
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
             <div className="p-6 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900">Active Personnel Directory</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-900">
                <thead className="bg-bank-blue text-xs uppercase text-white tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Employee Profile</th>
                    <th className="px-6 py-4 font-bold">Role</th>
                    <th className="px-6 py-4 font-bold text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeStaff.length === 0 ? (
                     <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-bold">No active employees found in this branch.</td></tr>
                  ) : (
                    activeStaff.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-black text-slate-900 text-base">{emp.name}</div>
                          <div className="text-xs font-mono text-slate-500 font-bold mt-1">{emp.email}</div>
                        </td>
                        <td className="px-6 py-4 font-black text-slate-800">{emp.role}</td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/hr/employees/${emp.id}`} className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-black inline-flex items-center">
                            <Edit className="w-3.5 h-3.5 mr-2" /> View Profile
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