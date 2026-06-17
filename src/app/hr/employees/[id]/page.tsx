'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, FileText, ArrowLeft, Edit, Trash2, Shield, 
  Loader2, MapPin, Mail, Phone, X, Download, AlertTriangle, CheckCircle, XCircle, Save, DollarSign, ArrowRight
} from 'lucide-react';
import { getEmployeeById, approveEmployeeAccount, adminUpdateEmployee } from '@/features/hr/actions';

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  
  // Live Data States
  const [employee, setEmployee] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Modals & Drawers
  const [documentViewer, setDocumentViewer] = useState<{ isOpen: boolean, type: 'CV' | 'AVATAR', url: string, name: string } | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({ 
    firstName: '', 
    lastName: '', 
    phone: '', 
    address: '', 
    nin: '', 
    birthDate: '',
    role: '', 
    status: '', 
    baseSalary: '' 
  });

  const fetchEmployeeData = async () => {
    if (!id) return;
    setIsLoading(true);
    const res = await getEmployeeById(id);
    if (res.success) {
  setEmployee(res.employee);
       
       const employeeName = res.employee?.name || '';
       const nameParts = employeeName ? employeeName.split(' ') : ['', ''];
       
       setEditForm({
         firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: res.employee.phone || '', 
        address: res.employee.address || '',
        nin: res.employee.nin || '',
        birthDate: res.employee.birthDate ? new Date(res.employee.birthDate).toISOString().split('T')[0] : '',
        role: res.employee.role,
        status: res.employee.status,
        baseSalary: res.employee.baseSalary?.toString() || ''
      });
    } else {
      setErrorMsg(res.error || "Failed to load personnel data.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  // THE VAULT CONTROLLER: Opens Cloudinary links in the secure iframe/img modal
  const openVault = (type: 'CV' | 'AVATAR', url: string | null) => {
    if (!url) return alert(`No ${type} document has been uploaded by this user yet.`);
    
    // SECURITY PATCH: Ensure the URL has 'https://' so external viewers don't break
    let secureUrl = url;
    if (!secureUrl.startsWith('http')) {
      // Removes any accidental leading slashes and adds https://
      secureUrl = `https://${secureUrl.replace(/^\/+/, '')}`; 
    }

    setDocumentViewer({ isOpen: true, type, url: secureUrl, name: employee.name });
  };

  // --- ACTIONS ---
  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this personnel for network access?")) return;
    setIsProcessing(true);
    const res = await (approveEmployeeAccount as any)(id);;
    if (res.success) {
      alert("Personnel Approved Successfully.");
      fetchEmployeeData();
    } else alert(res.error);
    setIsProcessing(false);
  };

  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const fullName = `${editForm.firstName} ${editForm.lastName}`.trim();
    
    const res = await adminUpdateEmployee(id, {
      name: fullName,
      phone: editForm.phone,
      address: editForm.address,
      nin: editForm.nin,
      birthDate: editForm.birthDate,
      role: editForm.role,
      status: editForm.status,
      baseSalary: parseFloat(editForm.baseSalary) || null
    });
    
    if (res.success) {
      alert("Personnel record updated.");
      setIsEditDrawerOpen(false);
      fetchEmployeeData();
    } else alert(res.error);
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcff] flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-[#2a27fd]/20 rounded-full animate-ping"></div>
          <Loader2 className="w-12 h-12 text-[#2a27fd] animate-spin relative z-10" />
        </div>
        <h2 className="text-2xl font-black text-[#160f29] tracking-tight">Decrypting Personnel File...</h2>
      </div>
    );
  }

  if (errorMsg || !employee) {
    return (
      <div className="min-h-screen bg-[#fcfcff] flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-extrabold text-[#160f29]">Access Restricted</h1>
        <p className="text-[#160f29]/60 font-medium mt-2">{errorMsg}</p>
        <button onClick={() => router.back()} className="mt-6 px-6 py-3 bg-[#2a27fd] hover:bg-[#1a18d0] text-white rounded-xl font-bold transition-colors">
          Return to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-[#fcfcff] min-h-screen relative animate-in fade-in duration-300 overflow-x-hidden">
      
      {/* --- CLOUDINARY DOCUMENT VAULT MODAL --- */}
      {documentViewer?.isOpen && (
        <div className="fixed inset-0 bg-[#160f29]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8 animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20">
            <div className="p-5 bg-[#160f29] text-white flex justify-between items-center border-b border-white/10">
              <div>
                <h3 className="font-black text-lg text-[#fcfcff]">{documentViewer.name}'s {documentViewer.type === 'CV' ? 'Curriculum Vitae' : 'Official Identification'}</h3>
                <p className="text-xs text-[#ffbb00] font-bold flex items-center mt-1 uppercase tracking-wider">
                  <Shield className="w-3 h-3 mr-1" /> Secure Cloudinary Vault
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setDocumentViewer(null)} className="p-2.5 bg-white/5 hover:bg-red-500 rounded-xl transition-colors" title="Close Vault">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-[#fcfcff] flex items-center justify-center relative overflow-hidden p-4 md:p-6">
              {documentViewer.url.toLowerCase().includes('.pdf') ? (
                <div className="flex flex-col items-center justify-center w-full max-w-lg bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 text-center">
                  <div className="w-24 h-24 bg-[#2a27fd]/10 rounded-full flex items-center justify-center mb-6 border border-[#2a27fd]/20">
                    <FileText className="w-12 h-12 text-[#2a27fd]" />
                  </div>
                  <h2 className="text-2xl font-black text-[#160f29] mb-3">Protected PDF Document</h2>
                  <p className="text-[#160f29]/60 font-bold text-sm mb-8 leading-relaxed">
                    Browser security policies prevent inline viewing of encrypted PDFs. Click below to safely open this document in a native viewer.
                  </p>
                  <div className="flex gap-4 w-full">
                    <a 
                      href={documentViewer.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex-1 py-4 bg-[#2a27fd] hover:bg-[#1a18d0] text-white font-black rounded-xl transition-all shadow-lg flex items-center justify-center"
                    >
                      View Document Securely <ArrowRight className="w-5 h-5 ml-2" />
                    </a>
                  </div>
                </div>
              ) : (
                <img src={documentViewer.url} alt="Document" className="max-w-full max-h-full object-contain rounded-2xl shadow-xl border border-gray-200 bg-white" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <button onClick={() => router.back()} className="text-[#160f29]/50 hover:text-[#2a27fd] flex items-center font-black mb-6 transition-colors text-sm uppercase tracking-wider">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
      </button>

      {/* --- APPROVAL BANNER (Only shows for Pending users) --- */}
      {employee.status === 'PENDING_APPROVAL' && (
        <div className="mb-8 bg-gradient-to-r from-[#ffbb00] to-[#ffd043] rounded-3xl p-6 md:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 border border-[#ffbb00]/50 animate-pulse">
          <div>
            <h2 className="text-2xl font-black text-[#160f29] flex items-center">
              <Shield className="w-6 h-6 mr-3" /> Awaiting Clearance
            </h2>
            <p className="text-[#160f29]/80 font-bold mt-1 text-sm md:text-base">Review documents below before granting network access.</p>
          </div>
          <div className="flex w-full md:w-auto gap-3">
            <button 
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex-1 md:flex-none px-8 py-3.5 bg-[#160f29] hover:bg-black text-white rounded-xl font-black shadow-md transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5 mr-2" /> Approve Access</>}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT: Profile Card & Avatar Display --- */}
        <div className="bg-[#160f29] p-8 rounded-3xl shadow-xl text-center relative overflow-hidden flex flex-col group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#2a27fd] rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
          
          {/* SECURE AVATAR DISPLAY */}
          <div className="relative w-32 h-32 mx-auto mb-6 z-10">
            {employee.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={employee.avatarUrl} alt={employee.name} className="w-full h-full rounded-2xl object-cover border-4 border-[#2a27fd]/30 shadow-2xl bg-white transform -rotate-2 group-hover:rotate-0 transition-transform" />
            ) : (
              <div className="w-full h-full bg-[#160f29] rounded-2xl flex items-center justify-center border-4 border-[#2a27fd]/30 shadow-2xl text-[#ffbb00] transform -rotate-2 group-hover:rotate-0 transition-transform">
                <User className="w-12 h-12" />
              </div>
            )}
            <span className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-[#160f29] ${employee.status === 'ACTIVE' ? 'bg-green-500' : employee.status === 'PENDING_APPROVAL' ? 'bg-[#ffbb00]' : 'bg-red-500'}`} title={employee.status}></span>
          </div>

          <h1 className="text-3xl font-black text-[#fcfcff] tracking-tight relative z-10">{employee.name}</h1>
          
          <div className="flex flex-wrap justify-center gap-2 mt-3 relative z-10">
            <span className="px-3 py-1 bg-[#2a27fd]/20 text-[#2a27fd] text-[10px] font-black rounded-lg border border-[#2a27fd]/30 uppercase tracking-widest backdrop-blur-sm">
              {employee.role.replace('_', ' ')}
            </span>
            <span className="px-3 py-1 bg-white/5 text-white/70 text-[10px] font-black rounded-lg border border-white/10 uppercase tracking-widest backdrop-blur-sm">
              {employee.branch?.name || 'Unassigned'}
            </span>
          </div>
          
          <div className="mt-8 space-y-3 text-left border-t border-white/10 pt-6 relative z-10">
            <p className="flex items-center text-sm font-bold text-[#fcfcff]/80 bg-white/5 p-3 rounded-xl border border-white/5">
              <Mail className="w-4 h-4 mr-3 text-[#ffbb00]" /> {employee.email}
            </p>
            <p className="flex items-center text-sm font-bold text-[#fcfcff]/80 bg-white/5 p-3 rounded-xl border border-white/5">
              <Phone className="w-4 h-4 mr-3 text-[#ffbb00]" /> {employee.phone || 'No phone recorded'}
            </p>
            <p className="flex items-center text-sm font-bold text-[#fcfcff]/80 bg-white/5 p-3 rounded-xl border border-white/5">
              <MapPin className="w-4 h-4 mr-3 text-[#ffbb00]" /> {employee.address || 'No address recorded'}
            </p>
          </div>
        </div>

        {/* --- RIGHT: KYC, Docs & Controls --- */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h2 className="text-xl font-black text-[#160f29] flex items-center tracking-tight">
                <Shield className="w-6 h-6 mr-3 text-[#2a27fd]" /> KYC Compliance Data
              </h2>
              <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border shadow-sm ${
                employee.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-300' : 
                employee.status === 'PENDING_APPROVAL' ? 'bg-[#ffbb00]/20 text-[#160f29] border-[#ffbb00]/50' : 
                'bg-red-100 text-red-800 border-red-300'
              }`}>
                {employee.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#fcfcff] p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-[#160f29]/40 uppercase tracking-widest mb-2">National ID (NIN)</p>
                <p className="font-mono font-black text-2xl text-[#2a27fd] tracking-tight">{employee.nin || 'Not Provided'}</p>
              </div>
              <div className="bg-[#fcfcff] p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-[#160f29]/40 uppercase tracking-widest mb-2">Bank Verification (BVN)</p>
                <p className="font-mono font-black text-2xl text-[#2a27fd] tracking-tight">{employee.bvn || 'Not Provided'}</p>
              </div>
            </div>
            
            <h3 className="font-black text-[#160f29] mb-4 text-xs uppercase tracking-widest opacity-70">Cloudinary Document Vault</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* TRIGGER FOR PDF VIEW */}
              <button 
                onClick={() => openVault('CV', employee.cvUrl)} 
                className="flex-1 py-4 bg-[#2a27fd] text-white font-black rounded-xl hover:bg-[#1a18d0] flex items-center justify-center shadow-lg transition-all"
              >
                <FileText className="w-5 h-5 mr-2" /> Inspect Resume / CV
              </button>
              
              {/* TRIGGER FOR AVATAR VAULT VIEW */}
              <button 
                onClick={() => openVault('AVATAR', employee.avatarUrl)}
                className="flex-1 py-4 bg-[#fcfcff] border border-gray-200 text-[#160f29] font-black rounded-xl hover:bg-gray-100 flex items-center justify-center shadow-sm transition-all"
              >
                <User className="w-5 h-5 mr-2" /> Verify ID Avatar
              </button>
            </div>
          </div>

          {/* Admin Command Center */}
          <div className="bg-gradient-to-br from-slate-100 to-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-6 justify-between items-center">
            <div>
              <h3 className="text-[#160f29] font-black text-xl tracking-tight">Admin Command Center</h3>
              <p className="text-[#160f29]/60 text-sm font-bold mt-1">Modify credentials, roles, or revoke access.</p>
            </div>
            <div className="flex w-full sm:w-auto gap-3">
              <button 
                onClick={() => setIsEditDrawerOpen(true)}
                className="flex-1 sm:flex-none px-6 py-3.5 bg-[#160f29] text-white font-black rounded-xl hover:bg-black flex items-center justify-center shadow-lg transition-all"
              >
                <Edit className="w-4 h-4 mr-2" /> Modify Profile
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* --- EDIT EMPLOYEE SLIDING DRAWER --- */}
      {isEditDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-[#160f29]/60 backdrop-blur-sm transition-opacity" onClick={() => setIsEditDrawerOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right-full duration-300 flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-black text-[#160f29] flex items-center tracking-tight">
                <Edit className="w-5 h-5 mr-2 text-[#2a27fd]" /> Modify Personnel
              </h2>
              <button onClick={() => setIsEditDrawerOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form id="admin-edit-form" onSubmit={handleAdminUpdate} className="space-y-6">
                
                {/* --- HR COMPLIANCE FIELDS --- */}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-4">
                  <p className="text-xs font-bold text-bank-blue-dark">Supervisory Override Mode Active. Ensure modifications comply with corporate guidelines.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#160f29] mb-2 tracking-wider">First Name</label>
                    <input 
                      type="text" 
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2a27fd] transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#160f29] mb-2 tracking-wider">Last Name</label>
                    <input 
                      type="text" 
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2a27fd] transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#160f29] mb-2 tracking-wider">Date of Birth</label>
                    <input 
                      type="date" 
                      value={editForm.birthDate}
                      onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
                      className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2a27fd] transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#160f29] mb-2 tracking-wider">Phone Number</label>
                    <input 
                      type="tel" 
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2a27fd] transition-all" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-[#160f29] mb-2 tracking-wider">National ID (NIN)</label>
                  <input 
                    type="text" 
                    value={editForm.nin}
                    onChange={(e) => setEditForm({...editForm, nin: e.target.value})}
                    className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-[#2a27fd] transition-all" 
                    maxLength={11}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-[#160f29] mb-2 tracking-wider">Residential Address</label>
                  <textarea 
                    rows={2}
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-bold resize-none focus:ring-2 focus:ring-[#2a27fd] transition-all" 
                  />
                </div>

                <div className="w-full h-px bg-gray-200 my-6"></div>

                {/* --- HR CLEARANCE FIELDS --- */}

                <div>
  <label className="block text-[10px] font-black uppercase text-[#160f29] mb-2 tracking-wider">Access Level (Role)</label>
  <select 
    value={editForm.role}
    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
    className="w-full px-4 py-3.5 bg-slate-50 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2a27fd] transition-all" 
  >
    <option value="STAFF">Standard Staff</option>
    <option value="HR">Human Resources</option>
    <option value="ADMIN">Branch Manager</option>
    <option value="EXEC">Executive (Execo)</option>
    <option value="IT_DIGITAL">IT &amp; Digital</option>
    <option value="FINANCE_TREASURY">Finance / Treasury</option>
    <option value="LEGAL">Legal</option>
    <option value="OPERATIONS">Operations</option>
    <option value="COMPLIANCE">Compliance</option>
    <option value="MARKETING_COMMUNICATION">Marketing &amp; Comm</option>
    <option value="CREDIT_RISK">Credit Risk</option>
    <option value="AUDIT">Audit</option>
    <option value="RECOVERY">Recovery</option>
    <option value="CUSTOMER_EXPERIENCE">Customer Experience</option>
    <option value="SAVINGS_MOBILISATION">Savings Mobilisation</option>
    <option value="ENGINEERING">Engineering</option>
  </select>
</div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-[#160f29] mb-2 tracking-wider">Account Status</label>
                  <select 
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2a27fd] transition-all" 
                  >
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-[#160f29] mb-2 tracking-wider">Base Salary (₦)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#160f29]/40" />
                    <input 
                      type="number" 
                      value={editForm.baseSalary}
                      onChange={(e) => setEditForm({...editForm, baseSalary: e.target.value})}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#2a27fd] transition-all" 
                      placeholder="0.00" 
                    />
                  </div>
                  <p className="text-[10px] text-[#160f29]/50 font-bold mt-2 uppercase tracking-wider">Updates will trigger the next payroll epoch</p>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-white">
              <button 
                type="submit" 
                form="admin-edit-form"
                disabled={isProcessing}
                className="w-full py-4 bg-[#2a27fd] hover:bg-[#1a18d0] text-white rounded-xl font-black flex items-center justify-center transition-colors shadow-lg disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Commit Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
