'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Users, Shield, Plus, MoreHorizontal, 
  CheckCircle2, Loader2, UserPlus, ShieldAlert, CheckCircle, 
  XCircle, FileText, User, ChevronLeft, Edit, Trash2, DollarSign, Eye, X
} from 'lucide-react';
import { createNewBranch, getGlobalDashboardData, approveBranchManager } from '@/features/admin/branches';

export default function SuperAdminDashboard() {
  // --- View & Loading States ---
  const [view, setView] = useState<'GLOBAL' | 'BRANCH_DETAIL'>('GLOBAL');
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // --- Modal States ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentViewer, setDocumentViewer] = useState<{ isOpen: boolean, type: 'CV' | 'AVATAR', url: string, name: string } | null>(null);

  // --- Live Data States ---
  const [metrics, setMetrics] = useState({ totalBranches: 0, totalStaff: 0, activeManagers: 0, globalPendingApprovals: 0 });
  const [branches, setBranches] = useState<any[]>([]);
  const [pendingAdmins, setPendingAdmins] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    const res = await getGlobalDashboardData();
    if (res.success) {
      setMetrics(res.metrics as any);
      // For the mind-blowing drill down, we map mock nested data if the backend hasn't supplied it yet
      const enhancedBranches = (res.branches as any[]).map(b => ({
        ...b,
        monthlyPayout: Math.floor(Math.random() * 50000) + 15000, // Simulated Payout
        departments: ['Retail', 'Corporate', 'IT Security'],
        employees: Array.from({ length: Math.min(b.staffCount, 5) }).map((_, i) => ({
          id: `EMP-${b.id}-${i}`, name: `Staff Member ${i+1}`, role: i === 0 ? 'Admin' : 'Officer', department: 'Retail'
        }))
      }));
      setBranches(enhancedBranches);
      setPendingAdmins(res.pendingAdmins as any[]);
    } else {
      setErrorMsg(res.error || "Access Denied.");
    }
    setIsLoadingData(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await createNewBranch(formData);
    if (res.success) {
      setIsCreateModalOpen(false);
      await fetchDashboardData();
    } else {
      alert(res.error);
    }
    setIsSubmitting(false);
  };

  const handleApproveAdmin = async (userId: string) => {
    setProcessingId(userId);
    const res = await approveBranchManager(userId);
    if (res.success) {
      await fetchDashboardData();
    } else {
      alert(res.error);
    }
    setProcessingId(null);
  };

  const openDocument = (type: 'CV' | 'AVATAR', url: string, name: string) => {
    setDocumentViewer({ isOpen: true, type, url, name });
  };

  const viewBranchDetails = (branch: any) => {
    setSelectedBranch(branch);
    setView('BRANCH_DETAIL');
  };

  // --- RENDER: Loading & Error ---
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-bank-gold animate-spin mb-4" />
        <h2 className="text-xl font-extrabold text-bank-blue-dark">Synchronizing Global Infrastructure...</h2>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-extrabold text-slate-900">Clearance Denied</h1>
        <p className="text-slate-600 font-medium mt-2">{errorMsg}</p>
        <button onClick={() => window.location.href = '/dashboard'} className="mt-6 px-6 py-2.5 bg-bank-blue text-white rounded-lg font-bold shadow-sm hover:bg-bank-blue-dark transition-all">
          Return to Workspace
        </button>
      </div>
    );
  }

  // --- RENDER: Branch Drill-Down View ---
  if (view === 'BRANCH_DETAIL' && selectedBranch) {
    return (
      <div className="p-8 bg-[#f8fafc] min-h-screen animate-in fade-in slide-in-from-right-4 duration-300">
        <button onClick={() => setView('GLOBAL')} className="flex items-center text-slate-500 hover:text-bank-blue-dark font-bold mb-6 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Global Network
        </button>

        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900">{selectedBranch.name}</h1>
            <p className="text-slate-600 font-medium mt-1 flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-bank-gold" /> {selectedBranch.location} • Est. {selectedBranch.established}
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-white border border-gray-200 text-slate-700 rounded-lg font-bold flex items-center shadow-sm hover:bg-slate-50">
              <Edit className="w-4 h-4 mr-2" /> Edit Branch
            </button>
            <button className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg font-bold flex items-center shadow-sm hover:bg-red-100">
              <Trash2 className="w-4 h-4 mr-2" /> Decommission
            </button>
          </div>
        </div>

        {/* Branch Financials & KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-bank-blue">
            <p className="text-sm font-bold text-slate-500 mb-1">Branch Leadership</p>
            <p className="text-xl font-black text-slate-900 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-bank-gold" /> {selectedBranch.manager}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
            <p className="text-sm font-bold text-slate-500 mb-1">Monthly Payroll Liability</p>
            <p className="text-2xl font-black text-slate-900 flex items-center">
              <DollarSign className="w-6 h-6 text-green-500 mr-1" /> {selectedBranch.monthlyPayout.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-bank-gold">
            <p className="text-sm font-bold text-slate-500 mb-1">Active Headcount</p>
            <p className="text-2xl font-black text-slate-900 flex items-center">
              <Users className="w-6 h-6 text-bank-gold mr-2" /> {selectedBranch.staffCount}
            </p>
          </div>
        </div>

        {/* Branch Employee Roster */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-slate-900">Branch Personnel Directory</h2>
            <button className="text-sm font-bold text-bank-blue hover:underline">View Full Roster</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-900">
              <thead className="bg-bank-blue text-xs uppercase text-white">
                <tr>
                  <th className="px-6 py-4 font-bold">Employee</th>
                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold">Department</th>
                  <th className="px-6 py-4 font-bold text-right">Verification Docs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedBranch.employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{emp.name}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{emp.role}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{emp.department}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openDocument('CV', '#', emp.name)} className="px-3 py-1.5 bg-slate-100 text-bank-blue-dark rounded-md text-xs font-bold hover:bg-slate-200 mr-2">View CV</button>
                      <button onClick={() => openDocument('AVATAR', '#', emp.name)} className="px-3 py-1.5 bg-slate-100 text-bank-blue-dark rounded-md text-xs font-bold hover:bg-slate-200">View ID</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: Global Super Admin View ---
  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen relative animate-in fade-in duration-300">
      
      {/* Document Viewer Modal Overlay */}
      {documentViewer?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 bg-bank-blue text-white flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-lg">{documentViewer.name}'s {documentViewer.type === 'CV' ? 'Curriculum Vitae' : 'Identification'}</h3>
                <p className="text-xs text-bank-blue-light font-medium">Secure In-Site Document Verification</p>
              </div>
              <button onClick={() => setDocumentViewer(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-8">
              {/* Simulated Document View - In prod, replace with <iframe src={url} /> or <img src={url} /> */}
              <div className="w-full h-full bg-white border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-slate-400">
                {documentViewer.type === 'CV' ? <FileText className="w-20 h-20 mb-4 text-bank-gold" /> : <User className="w-20 h-20 mb-4 text-bank-gold" />}
                <p className="font-extrabold text-slate-600 text-xl">Secure Vault Document Loaded</p>
                <p className="text-sm font-medium mt-2">Displaying file securely from AWS S3 / Vercel Blob.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 bg-slate-900 text-bank-gold text-xs font-black tracking-widest uppercase rounded-full shadow-sm flex items-center">
              <ShieldAlert className="w-4 h-4 mr-1.5" /> SUPREME COMMAND
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Global Infrastructure</h1>
          <p className="text-slate-600 mt-1 font-bold">Manage regional branches, assign directors, and verify personnel.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-bank-gold hover:bg-bank-gold-light text-bank-blue-dark font-extrabold px-6 py-3 rounded-xl transition-all shadow-md flex items-center border border-yellow-400"
        >
          <Plus className="w-5 h-5 mr-2 font-black" /> Provision New Branch
        </button>
      </div>

      {/* Global KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-blue-50 text-bank-blue rounded-xl flex items-center justify-center mr-4 border border-blue-100">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Total Branches</p>
            <p className="text-3xl font-black text-slate-900">{metrics.totalBranches}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-blue-50 text-bank-blue rounded-xl flex items-center justify-center mr-4 border border-blue-100">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Global Headcount</p>
            <p className="text-3xl font-black text-slate-900">{metrics.totalStaff.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-yellow-50 text-bank-gold rounded-xl flex items-center justify-center mr-4 border border-yellow-200">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Active Directors</p>
            <p className="text-3xl font-black text-slate-900">{metrics.activeManagers}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mr-4 border border-red-200">
            <UserPlus className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Pending Apps</p>
            <p className="text-3xl font-black text-slate-900">{metrics.globalPendingApprovals}</p>
          </div>
        </div>
      </div>

      {/* Pending Directors Action Table */}
      {pendingAdmins.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl shadow-md overflow-hidden mb-10">
          <div className="p-5 border-b border-red-200 bg-red-100 flex items-center justify-between">
            <div className="flex items-center">
              <ShieldAlert className="w-6 h-6 text-red-700 mr-2.5" />
              <h2 className="text-xl font-black text-red-900">Pending Leadership Approvals</h2>
            </div>
            <span className="bg-red-700 text-white px-3 py-1 text-xs font-black rounded-full shadow-sm">ACTION REQUIRED</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-900">
              <thead className="bg-red-50/50 text-xs uppercase text-red-800 border-b border-red-200">
                <tr>
                  <th className="px-6 py-4 font-black">Applicant Profile</th>
                  <th className="px-6 py-4 font-black">Target Branch</th>
                  <th className="px-6 py-4 font-black">Compliance (KYC)</th>
                  <th className="px-6 py-4 font-black text-center">Verify Documents</th>
                  <th className="px-6 py-4 font-black text-right">Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {pendingAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-red-100/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-black text-slate-900 text-base">{admin.name}</div>
                      <div className="text-sm text-slate-600 font-medium">{admin.email}</div>
                      <div className="text-xs text-red-700 font-bold mt-1">Applied: {new Date(admin.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-5 font-black text-red-900">{admin.branch?.name || 'Unassigned'}</td>
                    <td className="px-6 py-5">
                      <div className="text-xs font-mono font-bold text-slate-900"><span className="text-slate-500">NIN:</span> {admin.nin || 'N/A'}</div>
                      <div className="text-xs font-mono font-bold text-slate-900 mt-1"><span className="text-slate-500">BVN:</span> {admin.bvn || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center space-x-2">
                        <button onClick={() => openDocument('CV', '#', admin.name)} className="px-3 py-2 bg-white border border-red-200 text-red-700 font-bold text-xs rounded-lg hover:bg-red-50 flex items-center shadow-sm transition-all">
                          <FileText className="w-4 h-4 mr-1.5" /> View CV
                        </button>
                        <button onClick={() => openDocument('AVATAR', '#', admin.name)} className="px-3 py-2 bg-white border border-red-200 text-red-700 font-bold text-xs rounded-lg hover:bg-red-50 flex items-center shadow-sm transition-all">
                          <User className="w-4 h-4 mr-1.5" /> View ID
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => handleApproveAdmin(admin.id)}
                        disabled={processingId === admin.id}
                        className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-bank-gold rounded-lg hover:bg-black shadow-md transition-all font-black text-sm disabled:opacity-50"
                      >
                        {processingId === admin.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Authorize Director</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Network Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900">Active Branch Network</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-900">
            <thead className="bg-bank-blue text-xs uppercase text-white tracking-wider">
              <tr>
                <th className="px-6 py-5 font-bold">Branch Identification</th>
                <th className="px-6 py-5 font-bold">Location</th>
                <th className="px-6 py-5 font-bold">Branch Director</th>
                <th className="px-6 py-5 font-bold text-center">Active Headcount</th>
                <th className="px-6 py-5 font-bold text-right">Command</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-bold text-lg">
                    No branches detected. Provision a new branch to begin establishing the network.
                  </td>
                </tr>
              ) : (
                branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-black text-lg text-bank-blue-dark">{branch.name}</div>
                      <div className="text-xs font-mono text-slate-500 font-bold mt-1">ID: {branch.id}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center text-slate-700 font-bold">
                        <MapPin className="w-4 h-4 mr-2 text-bank-gold" /> {branch.location}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {branch.manager === 'Unassigned' ? (
                        <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-black tracking-wide uppercase rounded flex w-fit items-center">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Unassigned
                        </span>
                      ) : (
                        <span className="font-black text-bank-blue-dark flex items-center text-base">
                          <Shield className="w-5 h-5 mr-2 text-green-600" /> {branch.manager}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-100 border border-slate-200 text-slate-800 text-sm font-black rounded-full">
                        <Users className="w-4 h-4 mr-1.5 text-slate-400" /> {branch.staffCount}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => viewBranchDetails(branch)}
                        className="inline-flex items-center px-4 py-2 bg-bank-blue/5 border border-bank-blue/20 text-bank-blue-dark rounded-lg hover:bg-bank-blue hover:text-white transition-all font-bold text-sm shadow-sm"
                      >
                        <Eye className="w-4 h-4 mr-1.5" /> Drill Down
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Branch Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-bank-blue p-6 text-white">
              <h2 className="text-2xl font-black">Provision New Branch</h2>
              <p className="text-bank-blue-light font-medium text-sm mt-1">Initialize a new physical location.</p>
            </div>
            
            <form onSubmit={handleCreateBranch} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-1.5">Branch Designation (Name)</label>
                  <input type="text" name="name" required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:border-bank-blue focus:ring-1 focus:ring-bank-blue bg-slate-50 focus:bg-white transition-colors" placeholder="e.g. Abuja Central HQ" />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-1.5">Geographical Location</label>
                  <input type="text" name="location" required className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:outline-none focus:border-bank-blue focus:ring-1 focus:ring-bank-blue bg-slate-50 focus:bg-white transition-colors" placeholder="e.g. Abuja, Nigeria" />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 border border-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-bank-gold text-bank-blue-dark rounded-xl text-sm font-black shadow-md flex items-center disabled:opacity-70 hover:bg-bank-gold-light transition-all"
                >
                  {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Provisioning...</> : 'Establish Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}