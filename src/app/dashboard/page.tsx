'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getEmployeeDashboardData, updateEmployeeProfile } from '@/features/dashboard/actions';
import {
  FileText, Download, Calendar, Clock, Gift, User,
  Loader2, Edit3, Activity, Wallet, Timer, ArrowRight, Zap, X, Save, Shield, Upload,
  Users, Landmark, Plus, Trash2, FileDown, FileSpreadsheet, ChevronDown, Briefcase
} from 'lucide-react';

// Lazy load heavy UI components for maximum performance (Fixed Next.js module resolution)
const PayrollTable = dynamic(() => Promise.resolve({ default: PayrollLedger }), { ssr: false });
const ActivityFeed = dynamic(() => Promise.resolve({ default: ActivityLog }), { ssr: false });

type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

type DrawerTab = 'overview' | 'personal' | 'bank';

export default function StaffDashboardPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Real-time Payday Countdown Engine
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  // Edit Profile Drawer State
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<DrawerTab>('overview');
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', phone: '', address: '', nin: '', birthDate: '', avatarUrl: ''
  });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Export State
  const [isExporting, setIsExporting] = useState<'pdf' | 'csv' | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // OPTIMIZATION: Memoized data fetching to prevent unnecessary re-creations
  const fetchData = useCallback(async () => {
    if (status === 'authenticated') {
      const res = await getEmployeeDashboardData();
      if (res.success) {
        setData(res);
        
        // Pre-fill the edit form with existing data (Safely handle missing names)
        const nameParts = res.userData?.name ? res.userData.name.split(' ') : ['', ''];
        setEditForm({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            phone: (res.userData as any)?.phone || '',
            address: (res.userData as any)?.address || '',
            nin: (res.userData as any)?.nin || '',
            birthDate: (res.userData as any)?.birthDate ? new Date((res.userData as any).birthDate).toISOString().split('T')[0] : '',
            avatarUrl: (res.userData as any)?.avatarUrl || ''
        });

        // FIX: Pre-fill bank accounts with Type Override to silence TS errors
        const uData = res.userData as any; 

        if (Array.isArray(uData.bankAccounts) && uData.bankAccounts.length > 0) {
          setBankAccounts(
            uData.bankAccounts.map((acc: any, idx: number) => ({
              id: acc.id || `existing-${idx}`,
              bankName: acc.bankName || '',
              accountNumber: acc.accountNumber || acc.salaryAccountNumber || '',
              accountName: acc.accountName || '',
            }))
          );
        } else if (uData.bankName || uData.salaryAccountNumber || uData.accountNumber) {
          setBankAccounts([{
            id: 'existing-0',
            bankName: uData.bankName || '',
            // Map directly to actual Prisma DB field
            accountNumber: uData.salaryAccountNumber || uData.accountNumber || '', 
            accountName: uData.accountName || uData.name || '',
          }]);
        } else {
          setBankAccounts([{ id: `new-${Date.now()}`, bankName: '', accountNumber: '', accountName: '' }]);
        }
      }
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // OPTIMIZATION: Timer Initialization (Calculate target once, not every second)
  useEffect(() => {
    if (!data?.userData?.nextPayDate) return;

    const target = new Date(data.userData.nextPayDate).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          mins: Math.floor((difference / 1000 / 60) % 60),
          secs: Math.floor((difference / 1000) % 60)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.userData?.nextPayDate]);

  // --- CLOUDINARY UPLOADER FOR AVATAR ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('Uploading Profile...');
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';
      if (!cloudName) throw new Error("Cloudinary missing.");

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Upload failed');

      setEditForm(prev => ({ ...prev, avatarUrl: json.secure_url }));
      setUploadStatus('Complete!');
      setTimeout(() => setUploadStatus(''), 2000);
    } catch (err: any) {
      alert(err.message || "Failed to upload image.");
      setUploadStatus('');
    }
  };

  // --- BANK ACCOUNT HELPERS ---
  const addBankAccount = () => {
    setBankAccounts(prev => [...prev, { id: `new-${Date.now()}`, bankName: '', accountNumber: '', accountName: '' }]);
  };

  const removeBankAccount = (id: string) => {
    setBankAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const updateBankAccount = (id: string, field: keyof Omit<BankAccount, 'id'>, value: string) => {
    setBankAccounts(prev => prev.map(acc => (acc.id === id ? { ...acc, [field]: value } : acc)));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const fullName = `${editForm.firstName} ${editForm.lastName}`.trim();

    const res = await updateEmployeeProfile({
        name: fullName,
        phone: editForm.phone,
        address: editForm.address,
        nin: editForm.nin,
        birthDate: editForm.birthDate,
        avatarUrl: editForm.avatarUrl,
        bankAccounts: bankAccounts
        .filter(acc => acc.bankName || acc.accountNumber || acc.accountName)
        .map(({ bankName, accountNumber, accountName }) => ({ bankName, accountNumber, accountName })),
      } as any);

    if (res.success) {
      alert("Profile updated successfully!");
      setIsEditDrawerOpen(false);
      fetchData();
    } else {
      alert(res.error || "Failed to update profile.");
    }
    setIsSaving(false);
  };

  // --- EXPORT: fetch a remote image and convert it to a base64 data URL ---
  const toDataURL = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // --- EXPORT: CSV (profile + bank + payroll + leave) ---
  const generateCSV = async () => {
    if (!data) return;
    setIsExporting('csv');
    try {
      // FIX: Destructure data inside the function scope to prevent ReferenceError
     const { userData, payrolls, leaveData } = data;
      
      // @ts-ignore
      const Papa = (await import('papaparse') as any).default;

      const profileRows = [
        ['Field', 'Value'],
        ['Full Name', userData.name || ''],
        ['Role', userData.role?.replace('_', ' ') || ''],
        ['Branch', userData.branch?.name || 'Unassigned'],
        ['Team Lead', userData.teamLead?.name || 'Unassigned'],
        ['Phone', userData.phone || ''],
        ['Address', userData.address || ''],
        ['National ID (NIN)', userData.nin || ''],
        ['Date of Birth', userData.birthDate ? new Date(userData.birthDate).toLocaleDateString() : ''],
        ['Base Salary (NGN)', userData.baseSalary ?? ''],
        ['Leave Balance (days)', leaveData.remainingAnnualLeave ?? ''],
        ['Profile Photo URL', userData.avatarUrl || ''],
      ];

      const bankBody = bankAccounts.filter(acc => acc.bankName || acc.accountNumber || acc.accountName);
      const bankRows = [
        ['Bank Name', 'Account Number', 'Account Name'],
        ...bankBody.map(acc => [acc.bankName, acc.accountNumber, acc.accountName]),
      ];

      const payrollRows = [
        ['Pay Period', 'Net Pay (NGN)', 'Status'],
        ...payrolls.map((p: any) => [p.payPeriod, p.netPay, p.isPaid ? 'Cleared' : 'Pending']),
      ];

      const leaveRows = [
        ['Leave Type', 'Start Date', 'End Date', 'Status'],
        ...leaveData.recentLeaves.map((l: any) => [
          l.type?.replace('_', ' '),
          new Date(l.startDate).toLocaleDateString(),
          new Date(l.endDate).toLocaleDateString(),
          l.status,
        ]),
      ];

      const csv = [
        'PROFILE SUMMARY', Papa.unparse(profileRows),
        '', 'BANK DETAILS', Papa.unparse(bankRows),
        '', 'PAYROLL HISTORY', Papa.unparse(payrollRows),
        '', 'LEAVE HISTORY', Papa.unparse(leaveRows),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(userData.name || 'employee').replace(/\s+/g, '_')}_export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Could not generate CSV export.');
    } finally {
      setIsExporting(null);
      setShowExportMenu(false);
    }
  };

  // --- EXPORT: PDF report (profile + photo + bank + payroll + leave) ---
  const generatePDF = async () => {
    if (!data) return;
    setIsExporting('pdf');
    try {
      // FIX: Destructure data inside the function scope to prevent ReferenceError
      const { userData, payrolls, leaveData } = data;

      const { jsPDF } = await import('jspdf') as any;
      const autoTableModule: any = await import('jspdf-autotable');
      const autoTable = autoTableModule.default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header band
      doc.setFillColor(22, 15, 41); // #160f29
      doc.rect(0, 0, pageWidth, 32, 'F');
      doc.setTextColor(252, 252, 255);
      doc.setFontSize(16);
      doc.text('Employee Profile Report', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(255, 187, 0);
      doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 23);

      if (userData.avatarUrl) {
        const dataUrl = await toDataURL(userData.avatarUrl);
        if (dataUrl) {
          try { doc.addImage(dataUrl, 'JPEG', pageWidth - 34, 6, 20, 20); } catch { /* unsupported format, skip */ }
        }
      }

      let cursorY = 42;
      doc.setTextColor(22, 15, 41);
      doc.setFontSize(14);
      doc.text(userData.name || 'Employee', 14, cursorY);
      cursorY += 8;

      autoTable(doc, {
        startY: cursorY,
        head: [['Field', 'Value']],
        body: [
          ['Role', userData.role?.replace('_', ' ') || ''],
          ['Branch', userData.branch?.name || 'Unassigned'],
          ['Team Lead', userData.teamLead?.name || 'Unassigned'],
          ['Phone', userData.phone || ''],
          ['Address', userData.address || ''],
          ['National ID (NIN)', userData.nin || ''],
          ['Date of Birth', userData.birthDate ? new Date(userData.birthDate).toLocaleDateString() : ''],
          ['Base Salary', userData.baseSalary ? `NGN ${userData.baseSalary.toLocaleString()}` : 'Pending HR Setup'],
          ['Leave Balance', `${leaveData.remainingAnnualLeave} days`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [42, 39, 253] },
        margin: { left: 14, right: 14 },
      });

      const bankBody = bankAccounts
        .filter(acc => acc.bankName || acc.accountNumber || acc.accountName)
        .map(acc => [acc.bankName, acc.accountNumber, acc.accountName]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Bank Name', 'Account Number', 'Account Name']],
        body: bankBody.length ? bankBody : [['No bank details on file', '', '']],
        theme: 'grid',
        headStyles: { fillColor: [255, 187, 0], textColor: [22, 15, 41] },
        margin: { left: 14, right: 14 },
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Pay Period', 'Net Pay (NGN)', 'Status']],
        body: payrolls.length
          ? payrolls.map((p: any) => [p.payPeriod, p.netPay.toLocaleString(), p.isPaid ? 'Cleared' : 'Pending'])
          : [['No payroll records', '', '']],
        theme: 'grid',
        headStyles: { fillColor: [42, 39, 253] },
        margin: { left: 14, right: 14 },
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Leave Type', 'Start', 'End', 'Status']],
        body: leaveData.recentLeaves.length
          ? leaveData.recentLeaves.map((l: any) => [
              l.type?.replace('_', ' '),
              new Date(l.startDate).toLocaleDateString(),
              new Date(l.endDate).toLocaleDateString(),
              l.status,
            ])
          : [['No leave records', '', '', '']],
        theme: 'grid',
        headStyles: { fillColor: [255, 187, 0], textColor: [22, 15, 41] },
        margin: { left: 14, right: 14 },
      });

      doc.save(`${(userData.name || 'employee').replace(/\s+/g, '_')}_profile_report.pdf`);
    } catch (err) {
      console.error(err);
      alert('Could not generate PDF report.');
    } finally {
      setIsExporting(null);
      setShowExportMenu(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcff] flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-[#2a27fd]/20 rounded-full animate-ping"></div>
          <Loader2 className="w-12 h-12 text-[#2a27fd] animate-spin relative z-10" />
        </div>
        <h2 className="text-2xl font-black text-[#160f29] tracking-tight">Initializing Workspace...</h2>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-[#160f29] font-bold">Error loading workspace.</div>;

  const { userData, payrolls, leaveData } = data;
  
  // FIX: Bulletproof First Name Fallback
  const firstName = userData?.name ? userData.name.split(' ')[0] : 'Personnel';

  const drawerTabs: { id: DrawerTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'bank', label: 'Bank Details', icon: Landmark },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcff] p-4 md:p-6 lg:p-8 font-sans overflow-x-hidden selection:bg-[#ffbb00] selection:text-[#160f29] relative">

      {/* --- BIRTHDAY OVERRIDE ENGINE --- */}
      {userData.isBirthday && (
        <div className="mb-6 lg:mb-8 relative overflow-hidden rounded-2xl shadow-[0_10px_40px_rgba(255,187,0,0.3)] animate-in slide-in-from-top-6 duration-700">
          <div className="absolute inset-0 bg-gradient-to-r from-[#ffbb00] to-[#ffd043] z-0"></div>
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/20 blur-3xl rounded-full z-0"></div>
          <div className="relative z-10 p-6 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 bg-[#160f29] rounded-2xl flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.2)] transform rotate-3">
                <Gift className="w-8 h-8 text-[#ffbb00]" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#160f29] tracking-tight">Happy Birthday, {firstName}! 🎉</h2>
                <p className="text-[#160f29]/80 font-bold mt-1 text-sm">We appreciate your dedication to the network. Have a prosperous year ahead!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 3D COMMAND HEADER (Fully Responsive) --- */}
      <div className="mb-8 lg:mb-10 flex flex-col lg:flex-row gap-6 animate-in fade-in duration-700 delay-100">

        {/* Profile Card */}
        <div className="flex-1 bg-[#160f29] rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(22,15,41,0.2)] group w-full">
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-[#2a27fd] rounded-full blur-[80px] sm:blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start lg:items-center justify-between gap-6 text-center sm:text-left h-full">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">

              {/* Glowing Avatar Ring */}
              <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#2a27fd] to-[#ffbb00] rounded-full animate-spin-slow opacity-70 blur-sm"></div>
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-br from-[#2a27fd] to-[#1a18d0] shadow-[0_10px_30px_rgba(42,39,253,0.4)] z-10">
                  <div className="w-full h-full bg-[#160f29] rounded-full flex items-center justify-center overflow-hidden border-2 border-[#160f29]">
                      {userData.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-[#ffbb00]" />
                      )}
                  </div>
                </div>
                {/* Active Status Dot */}
                <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-[#160f29] bg-green-500 z-20" title="Active"></span>
              </div>

              <div className="flex-1 w-full overflow-hidden">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                  <span className="px-3 py-1 bg-[#2a27fd]/20 text-[#2a27fd] text-[10px] font-black rounded-lg border border-[#2a27fd]/30 uppercase tracking-widest backdrop-blur-sm">
                    {userData.role?.replace('_', ' ') || 'EMPLOYEE'}
                  </span>
                  <span className="px-3 py-1 bg-[#ffbb00]/10 text-[#ffbb00] text-[10px] font-black rounded-lg border border-[#ffbb00]/20 uppercase tracking-widest hidden sm:inline-block">
                    {userData.branch?.name || 'Lagos Network'}
                  </span>
                  <span className="px-3 py-1 bg-white/5 text-white/70 text-[10px] font-black rounded-lg border border-white/10 uppercase tracking-widest hidden sm:inline-flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> {userData.teamLead?.name || 'No Team Lead'}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#fcfcff] tracking-tight break-words">{userData.name || 'Personnel'}</h1>
                <p className="text-[#fcfcff]/60 font-bold mt-1 text-sm sm:text-base">Enterprise Command Workspace</p>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:hidden mt-3">
                  <span className="px-3 py-1 bg-[#ffbb00]/10 text-[#ffbb00] text-[10px] font-black rounded-lg border border-[#ffbb00]/20 uppercase tracking-widest inline-block">
                    {userData.branch?.name || 'Lagos Network'}
                  </span>
                  <span className="px-3 py-1 bg-white/5 text-white/70 text-[10px] font-black rounded-lg border border-white/10 uppercase tracking-widest inline-flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> {userData.teamLead?.name || 'No Team Lead'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
              <button
                onClick={() => { setActiveDrawerTab('overview'); setIsEditDrawerOpen(true); }}
                className="flex items-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[#fcfcff] rounded-xl font-bold transition-all backdrop-blur-md shadow-lg flex-1 sm:flex-none justify-center"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>

              <div className="relative flex-1 sm:flex-none">
                <button
                  onClick={() => setShowExportMenu(v => !v)}
                  className="flex items-center gap-2 px-5 py-3.5 bg-[#2a27fd] hover:bg-[#1a18d0] text-white rounded-xl font-bold transition-all shadow-lg w-full justify-center"
                >
                  <Download className="w-4 h-4" /> Export <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>

                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowExportMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-40 text-left">
                      <button
                        onClick={generatePDF}
                        disabled={isExporting !== null}
                        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-xs font-black text-[#160f29] hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {isExporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin text-[#2a27fd]" /> : <FileDown className="w-4 h-4 text-[#2a27fd]" />}
                        Download PDF Report
                      </button>
                      <button
                        onClick={generateCSV}
                        disabled={isExporting !== null}
                        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-xs font-black text-[#160f29] hover:bg-gray-50 transition-colors border-t border-gray-100 disabled:opacity-50"
                      >
                        {isExporting === 'csv' ? <Loader2 className="w-4 h-4 animate-spin text-[#ffbb00]" /> : <FileSpreadsheet className="w-4 h-4 text-[#ffbb00]" />}
                        Download CSV Export
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Payroll Countdown Widget */}
        <div className="w-full lg:w-[350px] xl:w-[400px] bg-gradient-to-br from-[#2a27fd] to-[#1a18d0] rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(42,39,253,0.3)] text-[#fcfcff] flex-shrink-0">
          <div className="absolute -bottom-10 -right-10 opacity-10">
            <Timer className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black tracking-widest uppercase text-xs sm:text-sm opacity-80 flex items-center">
                <Wallet className="w-4 h-4 mr-2" /> Next Disbursement
              </h3>
              <Zap className="w-5 h-5 text-[#ffbb00] animate-pulse" />
            </div>

            {userData.nextPayDate ? (
              <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
                <div className="bg-[#160f29]/40 backdrop-blur-md rounded-2xl p-2 sm:p-3 border border-white/10 shadow-inner">
                  <span className="block text-2xl sm:text-3xl font-black text-[#ffbb00]">{timeLeft.days}</span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold opacity-70 tracking-wider">Days</span>
                </div>
                <div className="bg-[#160f29]/40 backdrop-blur-md rounded-2xl p-2 sm:p-3 border border-white/10 shadow-inner">
                  <span className="block text-2xl sm:text-3xl font-black">{timeLeft.hours}</span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold opacity-70 tracking-wider">Hrs</span>
                </div>
                <div className="bg-[#160f29]/40 backdrop-blur-md rounded-2xl p-2 sm:p-3 border border-white/10 shadow-inner">
                  <span className="block text-2xl sm:text-3xl font-black">{timeLeft.mins}</span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold opacity-70 tracking-wider">Min</span>
                </div>
                <div className="bg-[#160f29]/40 backdrop-blur-md rounded-2xl p-2 sm:p-3 border border-white/10 shadow-inner">
                  <span className="block text-2xl sm:text-3xl font-black text-[#ffbb00]">{timeLeft.secs}</span>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold opacity-70 tracking-wider">Sec</span>
                </div>
              </div>
            ) : (
              <div className="h-[76px] sm:h-[88px] flex items-center justify-center bg-[#160f29]/40 backdrop-blur-md rounded-2xl border border-white/10">
                <p className="font-bold text-[#ffbb00] text-sm">Awaiting HR Assignment</p>
              </div>
            )}

            <p className="text-xs sm:text-sm font-medium mt-6 opacity-80">
              {userData.nextPayDate
                ? `Funds clear on ${new Date(userData.nextPayDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                : 'Contact your branch administrator.'}
            </p>
          </div>
        </div>
      </div>

      {/* --- MAIN GRID (Tracker / Leave / Activity) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 animate-in fade-in duration-700 delay-200">

        {/* LEFT COLUMN: Payroll & Activity */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">

          {/* 3D Payroll Ledger */}
          <div className="bg-white rounded-3xl p-1 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2a27fd] to-[#ffbb00]"></div>
            <div className="p-4 sm:p-6 md:p-8 bg-white rounded-[22px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-[#160f29] flex items-center tracking-tight">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-[#2a27fd]" /> Payroll History
                </h2>
              </div>
              <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#2a27fd]"/></div>}>
                <PayrollTable payrolls={payrolls} />
              </Suspense>
            </div>
          </div>

          {/* Activity Log Engine */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
            <h2 className="text-lg sm:text-xl font-black text-[#160f29] flex items-center mb-6 tracking-tight">
              <Activity className="w-5 h-5 mr-3 text-[#ffbb00]" /> Network Activity
            </h2>
            <Suspense fallback={<div className="h-32 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#2a27fd]"/></div>}>
              <ActivityFeed />
            </Suspense>
          </div>

        </div>

        {/* RIGHT COLUMN: Leave Engine */}
        <div className="space-y-6 lg:space-y-8">

          {/* Annual Leave 3D Card */}
          <div className="bg-[#160f29] rounded-3xl p-6 sm:p-8 shadow-[0_20px_40px_rgba(22,15,41,0.2)] text-[#fcfcff] relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#ffbb00] rounded-full blur-[70px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative z-10">
              <h2 className="text-xs sm:text-sm font-black tracking-widest uppercase opacity-80 mb-6 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-[#ffbb00]" /> Leave Balance
              </h2>
              <div className="flex items-baseline space-x-2">
                <span className="text-6xl sm:text-7xl font-black text-[#ffbb00] tracking-tighter drop-shadow-md">
                  {leaveData?.remainingAnnualLeave ?? 0}
                </span>
                <span className="text-xs sm:text-sm font-bold opacity-60">Days</span>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                <p className="text-[10px] sm:text-xs font-bold opacity-60 uppercase tracking-wider">Renews Jan 1</p>
                <Link href="/dashboard/leave" className="text-xs font-black text-[#2a27fd] bg-[#2a27fd]/10 px-4 py-2.5 rounded-lg hover:bg-[#2a27fd] hover:text-white transition-colors flex items-center">
                  Apply <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Leaves Wrapper */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100">
            <h2 className="text-xs sm:text-sm font-black text-[#160f29] mb-4 flex items-center uppercase tracking-widest opacity-80">
              <Clock className="w-4 h-4 mr-2" /> Recent Requests
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {!leaveData?.recentLeaves || leaveData.recentLeaves.length === 0 ? (
                <div className="p-6 bg-[#fcfcff] rounded-2xl border border-gray-100 text-center">
                  <p className="text-xs sm:text-sm font-bold text-[#160f29]/40">No recent timeline activity.</p>
                </div>
              ) : (
                leaveData.recentLeaves.map((leave: any) => (
                  <div key={leave.id} className="p-3 sm:p-4 rounded-2xl bg-[#fcfcff] border border-gray-100 hover:border-[#2a27fd]/30 transition-colors group">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <p className="font-black text-[#160f29] text-xs sm:text-sm group-hover:text-[#2a27fd] transition-colors">{leave.type.replace('_', ' ')}</p>
                      <span className={`px-2 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm whitespace-nowrap ${
                        leave.status === 'APPROVED' ? 'text-white bg-[#160f29]' :
                        leave.status === 'PENDING' ? 'text-[#160f29] bg-[#ffbb00]' :
                        'text-white bg-red-500'
                      }`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-[#160f29]/60 font-bold flex items-center">
                      <Calendar className="w-3 h-3 mr-1 opacity-50" />
                      {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})} - {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* --- EDIT PROFILE SLIDING DRAWER --- */}
      {isEditDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#160f29]/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsEditDrawerOpen(false)}
          ></div>

          {/* Drawer Panel */}
          <div className="relative w-full sm:max-w-md bg-[#fcfcff] h-full shadow-2xl animate-in slide-in-from-right-full duration-300 flex flex-col">
            <div className="p-5 md:p-6 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm z-10">
              <h2 className="text-xl font-black text-[#160f29] flex items-center tracking-tight">
                <Edit3 className="w-5 h-5 mr-2 text-[#2a27fd]" /> Manage Profile
              </h2>
              <button
                onClick={() => setIsEditDrawerOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#160f29]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 bg-white z-10">
              {drawerTabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDrawerTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3.5 text-[11px] sm:text-xs font-black uppercase tracking-wider border-b-2 transition-colors ${
                    activeDrawerTab === tab.id
                      ? 'border-[#2a27fd] text-[#2a27fd]'
                      : 'border-transparent text-[#160f29]/40 hover:text-[#160f29]/70'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* --- OVERVIEW TAB: read-only corporate status + export --- */}
              {activeDrawerTab === 'overview' && (
                <div className="p-5 md:p-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#160f29]/50 mb-3 flex items-center">
                      <Shield className="w-4 h-4 mr-1.5" /> Corporate Status (Read-Only)
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-3">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <span className="text-[10px] font-black uppercase text-[#160f29]/50">Department Role</span>
                        <span className="text-sm font-black text-[#160f29] bg-gray-100 px-2 py-1 rounded">{userData.role?.replace('_', ' ') || 'EMPLOYEE'}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <span className="text-[10px] font-black uppercase text-[#160f29]/50">Branch Assignment</span>
                        <span className="text-sm font-black text-[#160f29]">{userData.branch?.name || 'Unassigned'}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                        <span className="text-[10px] font-black uppercase text-[#160f29]/50 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Team Lead</span>
                        <span className="text-sm font-black text-[#160f29]">{userData.teamLead?.name || 'Unassigned'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-[#160f29]/50">Base Wages (₦)</span>
                        <span className="text-sm font-black text-[#2a27fd]">
                          {userData.baseSalary ? `₦${userData.baseSalary.toLocaleString()}` : 'Pending HR Setup'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#160f29]/50 mb-3 flex items-center">
                      <Download className="w-4 h-4 mr-1.5" /> Export My Records
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                      <p className="text-xs text-[#160f29]/50 font-bold mb-4">
                        Get a copy of your profile, bank details, payroll history and leave records.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={generatePDF}
                          disabled={isExporting !== null}
                          className="flex items-center justify-center gap-2 py-3 bg-[#2a27fd]/10 hover:bg-[#2a27fd]/20 text-[#2a27fd] rounded-xl font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          {isExporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} PDF Report
                        </button>
                        <button
                          type="button"
                          onClick={generateCSV}
                          disabled={isExporting !== null}
                          className="flex items-center justify-center gap-2 py-3 bg-[#ffbb00]/10 hover:bg-[#ffbb00]/20 text-[#160f29] rounded-xl font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          {isExporting === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} CSV Export
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- PERSONAL + BANK TABS: share one form so Save covers both --- */}
              <form id="edit-profile-form" onSubmit={handleProfileUpdate}>

                {/* PERSONAL INFO TAB */}
                <div className={activeDrawerTab === 'personal' ? 'p-5 md:p-6 space-y-5' : 'hidden'}>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#160f29]/50 mb-1">Personal Information</h3>

                  {/* Avatar Uploader */}
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-2xl hover:bg-white transition-colors relative">
                    <div className="w-20 h-20 rounded-full bg-gray-100 mb-3 overflow-hidden border-2 border-gray-200 flex items-center justify-center">
                      {editForm.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="text-center relative">
                      <input
                        type="file"
                        onChange={handleAvatarUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*"
                      />
                      <button type="button" className="text-xs font-black text-[#2a27fd] bg-[#2a27fd]/10 px-4 py-2 rounded-lg flex items-center justify-center">
                        <Upload className="w-3 h-3 mr-1.5" /> Change Picture
                      </button>
                      {uploadStatus && <p className="text-[10px] font-bold text-[#ffbb00] mt-2">{uploadStatus}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-[#160f29] mb-1.5 tracking-wider">First Name</label>
                      <input
                        type="text"
                        required
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-[#160f29] focus:ring-2 focus:ring-[#2a27fd] transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-[#160f29] mb-1.5 tracking-wider">Last Name</label>
                      <input
                        type="text"
                        required
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-[#160f29] focus:ring-2 focus:ring-[#2a27fd] transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-[#160f29] mb-1.5 tracking-wider">Date of Birth</label>
                      <input
                        type="date"
                        required
                        value={editForm.birthDate}
                        onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-[#160f29] focus:ring-2 focus:ring-[#2a27fd] transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-[#160f29] mb-1.5 tracking-wider">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-[#160f29] focus:ring-2 focus:ring-[#2a27fd] transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#160f29] mb-1.5 tracking-wider">National ID (NIN)</label>
                    <input
                      type="text"
                      required
                      value={editForm.nin}
                      onChange={(e) => setEditForm({...editForm, nin: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono font-black text-[#160f29] focus:ring-2 focus:ring-[#2a27fd] transition-all shadow-sm"
                      placeholder="11-Digit NIN"
                      maxLength={11}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-[#160f29] mb-1.5 tracking-wider">Home Address</label>
                    <textarea
                      rows={2}
                      required
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-[#160f29] resize-none focus:ring-2 focus:ring-[#2a27fd] transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* BANK DETAILS TAB */}
                <div className={activeDrawerTab === 'bank' ? 'p-5 md:p-6 space-y-4' : 'hidden'}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#160f29]/50">Bank Accounts</h3>
                    <button
                      type="button"
                      onClick={addBankAccount}
                      className="flex items-center gap-1 text-[10px] font-black text-[#2a27fd] bg-[#2a27fd]/10 px-3 py-1.5 rounded-lg hover:bg-[#2a27fd]/20 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Account
                    </button>
                  </div>

                  {bankAccounts.length === 0 && (
                    <div className="p-6 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                      <Landmark className="w-8 h-8 text-[#160f29]/20 mx-auto mb-2" />
                      <p className="text-xs font-bold text-[#160f29]/40">No bank accounts on file yet.</p>
                    </div>
                  )}

                  {bankAccounts.map((account, idx) => (
                    <div key={account.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-[#160f29]/40 tracking-wider">Account {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeBankAccount(account.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-[#160f29] mb-1.5 tracking-wider">Bank Name</label>
                        <input
                          type="text"
                          value={account.bankName}
                          onChange={(e) => updateBankAccount(account.id, 'bankName', e.target.value)}
                          className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-black text-[#160f29] focus:ring-2 focus:ring-[#2a27fd] transition-all"
                          placeholder="e.g. GTBank"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-[#160f29] mb-1.5 tracking-wider">Account Number</label>
                          <input
                            type="text"
                            value={account.accountNumber}
                            onChange={(e) => updateBankAccount(account.id, 'accountNumber', e.target.value)}
                            maxLength={10}
                            className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-mono font-black text-[#160f29] focus:ring-2 focus:ring-[#2a27fd] transition-all"
                            placeholder="0123456789"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-[#160f29] mb-1.5 tracking-wider">Account Name</label>
                          <input
                            type="text"
                            value={account.accountName}
                            onChange={(e) => updateBankAccount(account.id, 'accountName', e.target.value)}
                            className="w-full px-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-black text-[#160f29] focus:ring-2 focus:ring-[#2a27fd] transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </form>
            </div>

            <div className="p-5 md:p-6 border-t border-gray-200 bg-white z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
              {activeDrawerTab === 'overview' ? (
                <p className="text-center text-[10px] font-black text-[#160f29]/40 uppercase tracking-wider">
                  Switch to Personal Info or Bank Details to make changes
                </p>
              ) : (
                <button
                  type="submit"
                  form="edit-profile-form"
                  disabled={isSaving}
                  className="w-full py-4 bg-[#2a27fd] hover:bg-[#1a18d0] text-white rounded-xl font-black flex items-center justify-center transition-colors shadow-lg disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- SUB-COMPONENTS (Memoized for peak rendering speed) ---

const PayrollLedger = React.memo(function PayrollLedger({ payrolls }: { payrolls: any[] }) {
  if (!payrolls || payrolls.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center bg-[#fcfcff] rounded-2xl border border-dashed border-gray-200">
        <Wallet className="w-10 h-10 text-[#160f29]/20 mb-3" />
        <p className="text-[#160f29]/60 font-black text-sm text-center">No payroll records found in your ledger.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-[#160f29] min-w-[500px]">
        <thead className="text-[10px] uppercase tracking-widest text-[#160f29]/50 font-black border-b border-gray-100">
          <tr>
            <th className="px-4 py-4">Pay Period</th>
            <th className="px-4 py-4">Disbursed</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4 text-right">Ledger</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {payrolls.map((payroll: any) => (
            <tr key={payroll.id} className="hover:bg-[#fcfcff] transition-colors group">
              <td className="px-4 py-5 font-black text-[#160f29]">{payroll.payPeriod}</td>
              <td className="px-4 py-5 font-black text-[#2a27fd]">₦{payroll.netPay?.toLocaleString() || 0}</td>
              <td className="px-4 py-5">
                <span className={`px-3 py-1.5 text-[9px] sm:text-[10px] font-black rounded-md uppercase tracking-wider shadow-sm whitespace-nowrap ${
                  payroll.isPaid ? 'bg-green-100 text-green-700' : 'bg-[#ffbb00]/20 text-[#160f29]'
                }`}>
                  {payroll.isPaid ? 'Cleared' : 'Pending'}
                </span>
              </td>
              <td className="px-4 py-5 text-right">
                <button
                  disabled={!payroll.isPaid}
                  className="inline-flex items-center justify-center w-10 h-10 bg-[#fcfcff] border border-gray-200 text-[#160f29] hover:bg-[#2a27fd] hover:text-white hover:border-[#2a27fd] rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-[#fcfcff] disabled:hover:text-[#160f29]"
                >
                  <Download className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const ActivityLog = React.memo(function ActivityLog() {
  const activities = [
    { id: 1, action: "Secure System Login", time: "Just now", icon: User, color: "text-[#2a27fd]", bg: "bg-[#2a27fd]/10" },
    { id: 2, action: "Leave Timeline Updated", time: "2 days ago", icon: Calendar, color: "text-[#ffbb00]", bg: "bg-[#ffbb00]/20" },
    { id: 3, action: "Payroll Disbursed", time: "Last month", icon: Wallet, color: "text-green-600", bg: "bg-green-100" },
  ];

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
      {activities.map((item) => (
        <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${item.bg} ${item.color} shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10`}>
            <item.icon className="w-4 h-4" />
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#fcfcff] p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-[#160f29] text-sm">{item.action}</h4>
            </div>
            <p className="text-[10px] font-bold text-[#160f29]/50 uppercase tracking-wider mt-1">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
});