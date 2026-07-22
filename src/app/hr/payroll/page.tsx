'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Banknote, FileText, CheckCircle, AlertCircle, Loader2, 
  Users, Send, Search, Filter, ArrowUpDown, Clock, Download, ShieldAlert
} from 'lucide-react';
import { getPayrollCommandData, updateBaseSalary, disbursePayrolls, forceManualPayout } from '@/features/payroll/actions';

export default function HrPayrollPage() {
  const [activeTab, setActiveTab] = useState<'COMPENSATION' | 'QUEUE' | 'LEDGER'>('QUEUE');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Bulk Selection & Form State
  const [selectedPayrolls, setSelectedPayrolls] = useState<Set<string>>(new Set());
  const [salaryInputs, setSalaryInputs] = useState<Record<string, string>>({});

  // Search, Filter, and Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

  const fetchData = async () => {
    setIsLoading(true);
    const res = await getPayrollCommandData();
    if (res.success) {
      setData(res);
      const initialSalaries: Record<string, string> = {};
      (res.employees || []).forEach((emp: any) => {
        initialSalaries[emp.id] = emp.baseSalary ? emp.baseSalary.toString() : '';
      });
      setSalaryInputs(initialSalaries);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- ACTIONS ---
  const handleSalarySave = async (userId: string) => {
    const amount = parseFloat(salaryInputs[userId]);
    if (isNaN(amount) || amount <= 0) return alert("Enter a valid salary amount.");
    
    setIsProcessing(true);
    const res = await updateBaseSalary(userId, amount);
    if (res.success) {
      alert("Compensation updated. 30-day epoch cycle initialized.");
      fetchData();
    } else {
      alert(res.error);
    }
    setIsProcessing(false);
  };

  const handleForcePayout = async (userId: string, baseSalary: number) => {
    if (!baseSalary) return alert("Assign a base salary first.");
    if (!confirm("Force an immediate payout? This resets their 30-day clock.")) return;
    
    setIsProcessing(true);
    const res = await forceManualPayout(userId, baseSalary);
    if (res.success) fetchData();
    setIsProcessing(false);
  };

  const handleBulkDisburse = async () => {
    if (selectedPayrolls.size === 0) return alert("Select at least one ledger to disburse.");
    
    setIsProcessing(true);
    const res = await disbursePayrolls(Array.from(selectedPayrolls));
    if (res.success) {
      alert(`Successfully disbursed ${selectedPayrolls.size} payrolls! 30-day counters restarted.`);
      setSelectedPayrolls(new Set());
      fetchData();
    } else {
      alert(res.error);
    }
    setIsProcessing(false);
  };

  // --- SELECT ALL LOGIC ---
  const toggleSelection = (id: string) => {
    const next = new Set(selectedPayrolls);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPayrolls(next);
  };

  const handleSelectAll = (filteredIds: string[]) => {
    if (selectedPayrolls.size === filteredIds.length) {
      setSelectedPayrolls(new Set()); // Deselect all
    } else {
      setSelectedPayrolls(new Set(filteredIds)); // Select all visible
    }
  };

  // --- SORTING LOGIC ---
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // --- FILTER & SORT ENGINE ---
  const processData = (list: any[], type: 'EMPLOYEE' | 'PAYROLL') => {
    if (!list) return [];
    
    // 1. Filter
    let filtered = list.filter(item => {
      const name = type === 'EMPLOYEE' ? item.name : item.user.name;
      const role = type === 'EMPLOYEE' ? item.role : item.user.role;
      
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || role === roleFilter;
      return matchesSearch && matchesRole;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      let valA, valB;
      
      if (sortConfig.key === 'name') {
        valA = type === 'EMPLOYEE' ? a.name : a.user.name;
        valB = type === 'EMPLOYEE' ? b.name : b.user.name;
      } else if (sortConfig.key === 'amount') {
        valA = type === 'EMPLOYEE' ? (a.baseSalary || 0) : a.netPay;
        valB = type === 'EMPLOYEE' ? (b.baseSalary || 0) : b.netPay;
      } else if (sortConfig.key === 'date') {
        valA = type === 'EMPLOYEE' ? new Date(a.nextPayDate || 0).getTime() : new Date(a.createdAt).getTime();
        valB = type === 'EMPLOYEE' ? new Date(b.nextPayDate || 0).getTime() : new Date(b.createdAt).getTime();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const calculateDaysLeft = (dateString: string | null) => {
    if (!dateString) return null;
    const diff = new Date(dateString).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#fcfcff] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#2a27fd] animate-spin mb-4" />
        <h2 className="text-xl font-black text-[#160f29] uppercase tracking-widest">Loading Financial Engine...</h2>
      </div>
    );
  }

  // Processed Lists
  const processedEmployees = processData(data.employees, 'EMPLOYEE');
  const processedPending = processData(data.pendingPayrolls, 'PAYROLL');
  const processedHistorical = processData(data.historicalPayrolls, 'PAYROLL');

  return (
    <div className="min-h-screen bg-[#fcfcff] p-4 md:p-8 animate-in fade-in duration-300">
      
      {/* --- HEADER --- */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#160f29] tracking-tight">Payroll Engine</h1>
          <p className="text-[#160f29]/60 mt-1 font-medium">Bulk disbursements, department sorting, and dynamic tracking.</p>
        </div>
        
        {/* TABS */}
        <div className="flex w-full md:w-auto bg-[#160f29]/5 border border-[#160f29]/10 p-1.5 rounded-xl shadow-inner overflow-x-auto">
          <button onClick={() => setActiveTab('QUEUE')} className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg text-sm font-black flex items-center justify-center transition-all whitespace-nowrap ${activeTab === 'QUEUE' ? 'bg-[#160f29] text-white shadow-md' : 'text-[#160f29]/60 hover:text-[#160f29] hover:bg-[#160f29]/5'}`}>
            <AlertCircle className="w-4 h-4 mr-2" /> Pending Queue
            {data.kpis.pendingCount > 0 && <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'QUEUE' ? 'bg-[#ffbb00] text-[#160f29]' : 'bg-[#ffbb00] text-[#160f29]'}`}>{data.kpis.pendingCount}</span>}
          </button>
          <button onClick={() => setActiveTab('COMPENSATION')} className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg text-sm font-black flex items-center justify-center transition-all whitespace-nowrap ${activeTab === 'COMPENSATION' ? 'bg-[#160f29] text-white shadow-md' : 'text-[#160f29]/60 hover:text-[#160f29] hover:bg-[#160f29]/5'}`}>
            <Users className="w-4 h-4 mr-2" /> Compensation
          </button>
          <button onClick={() => setActiveTab('LEDGER')} className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg text-sm font-black flex items-center justify-center transition-all whitespace-nowrap ${activeTab === 'LEDGER' ? 'bg-[#160f29] text-white shadow-md' : 'text-[#160f29]/60 hover:text-[#160f29] hover:bg-[#160f29]/5'}`}>
            <FileText className="w-4 h-4 mr-2" /> Master Ledger
          </button>
        </div>
      </div>

      {/* --- PHASE 2: SECURE FINANCE EXPORT MODULE --- */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm mb-8">
        <div>
          <h3 className="text-sm font-black text-[#160f29] flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2 text-[#2a27fd]" />
            Secure Finance Handoff
          </h3>
          <p className="text-xs font-bold text-[#160f29]/70 mt-1">
            Export the encrypted CSV masterlist containing active personnel salaries and banking routing details.
          </p>
        </div>
        
        {/* The One-Click Download Trigger */}
        <a 
          href="/api/hr/export-payroll" 
          className="px-6 py-3.5 bg-[#2a27fd] hover:bg-[#1a18d0] text-white rounded-xl font-black shadow-lg transition-all flex items-center justify-center whitespace-nowrap"
        >
          <Download className="w-4 h-4 mr-2" />
          Generate CSV for Finance
        </a>
      </div>

      {/* --- KPI GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center justify-between"><h3 className="text-[#160f29]/50 font-black text-xs uppercase tracking-widest">Total Disbursed</h3><Banknote className="w-5 h-5 text-green-500" /></div>
          <p className="text-3xl font-black text-[#160f29] mt-3 tracking-tight">₦{data.kpis.totalDisbursed.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center justify-between"><h3 className="text-[#160f29]/50 font-black text-xs uppercase tracking-widest">Pending Disbursals</h3><AlertCircle className="w-5 h-5 text-[#ffbb00]" /></div>
          <p className="text-3xl font-black text-[#160f29] mt-3 tracking-tight">₦{data.kpis.totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-[#160f29] p-6 rounded-3xl border border-[#160f29] shadow-[0_8px_30px_rgba(22,15,41,0.2)]">
          <div className="flex items-center justify-between"><h3 className="text-white/60 font-black text-xs uppercase tracking-widest">Actionable Ledgers</h3><FileText className="w-5 h-5 text-[#2a27fd]" /></div>
          <p className="text-3xl font-black text-[#ffbb00] mt-3 tracking-tight">{data.kpis.pendingCount}</p>
        </div>
      </div>

      {/* --- SEARCH & FILTER TOOLBAR --- */}
      <div className="bg-white p-5 rounded-t-3xl border border-gray-100 border-b-0 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-[#2a27fd]/50" />
          <input 
            type="text" 
            placeholder="Search personnel..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-bold text-[#160f29] focus:outline-none focus:ring-2 focus:ring-[#2a27fd]/20 focus:border-[#2a27fd] transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center w-full sm:w-auto gap-3">
          <Filter className="w-5 h-5 text-[#ffbb00] shrink-0" />
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto pl-4 pr-8 py-3 bg-[#fcfcff] border border-gray-200 rounded-xl text-sm font-black text-[#160f29] focus:outline-none focus:ring-2 focus:ring-[#2a27fd]/20 focus:border-[#2a27fd] shadow-sm"
          >
            <option value="ALL">All Departments</option>
            <option value="STAFF">Standard Staff</option>
            <option value="HR">Human Resources</option>
            <option value="ADMIN">Branch Manager</option>
            <option value="EXEC">Executive (Execo)</option>
            <option value="IT_DIGITAL">IT &amp; Digital</option>
            <option value="FINANCE_TREASURY">Finance / Treasury</option>
            <option value="LEGAL">Legal Department</option>
            <option value="OPERATIONS">Operations</option>
            <option value="COMPLIANCE">Compliance</option>
            <option value="MARKETING_COMMUNICATION">Marketing &amp; Comm</option>
            <option value="CREDIT_RISK">Credit Risk</option>
            <option value="AUDIT">Internal Audit</option>
            <option value="RECOVERY">Recovery Unit</option>
            <option value="CUSTOMER_EXPERIENCE">Customer Experience</option>
            <option value="SAVINGS_MOBILISATION">Savings Mobilisation</option>
            <option value="ENGINEERING">Core Engineering</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: DISBURSEMENT QUEUE (Bulk Pay) */}
      {activeTab === 'QUEUE' && (
        <div className="bg-white border border-gray-100 rounded-b-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#fcfcff]">
            <h2 className="text-lg font-black text-[#160f29]">Pending Queue</h2>
            <button 
              onClick={handleBulkDisburse}
              disabled={selectedPayrolls.size === 0 || isProcessing}
              className="w-full sm:w-auto bg-[#2a27fd] hover:bg-[#1a18d0] text-white font-black px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
              Disburse Selected ({selectedPayrolls.size})
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#160f29] min-w-[900px]">
              <thead className="bg-[#160f29] text-xs uppercase tracking-widest text-[#fcfcff]">
                <tr>
                  <th className="px-6 py-5 w-16">
                    <input 
                      type="checkbox" 
                      checked={selectedPayrolls.size > 0 && selectedPayrolls.size === processedPending.length}
                      onChange={() => handleSelectAll(processedPending.map(p => p.id))}
                      className="w-5 h-5 rounded border-gray-400 text-[#2a27fd] focus:ring-[#2a27fd] cursor-pointer"
                      title="Select All Visible"
                    />
                  </th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-black transition-colors font-black" onClick={() => handleSort('name')}>
                    Employee <ArrowUpDown className="inline w-4 h-4 ml-1 text-[#ffbb00]"/>
                  </th>
                  <th className="px-6 py-5 font-black">Account Details</th>
                  <th className="px-6 py-5 font-black">Pay Period</th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-black transition-colors font-black" onClick={() => handleSort('amount')}>
                    Net Pay <ArrowUpDown className="inline w-4 h-4 ml-1 text-[#ffbb00]"/>
                  </th>
                  <th className="px-6 py-5 text-right font-black">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedPending.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-[#160f29]/50 font-bold">No pending payrolls match your filters.</td></tr>
                ) : (
                  processedPending.map((payroll: any) => (
                    <tr key={payroll.id} className={`hover:bg-[#2a27fd]/5 transition-colors group ${selectedPayrolls.has(payroll.id) ? 'bg-[#2a27fd]/10' : ''}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedPayrolls.has(payroll.id)}
                          onChange={() => toggleSelection(payroll.id)}
                          className="w-5 h-5 rounded border-gray-300 text-[#2a27fd] focus:ring-[#2a27fd] cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4"><p className="font-black text-[#160f29] text-base group-hover:text-[#2a27fd] transition-colors">{payroll.user.name}</p><p className="text-xs text-[#160f29]/60 font-bold mt-0.5">{payroll.user.role}</p></td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#160f29]">{payroll.user.bankName || 'Not Provided'}</p>
                        <p className="text-xs font-mono text-[#160f29]/60">{payroll.user.salaryAccountNumber || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#160f29]/80">{payroll.payPeriod}</td>
                      <td className="px-6 py-4 font-black text-[#2a27fd] text-base">₦{payroll.netPay.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-3 py-1.5 bg-[#ffbb00]/20 text-[#160f29] text-[10px] uppercase tracking-wider font-black rounded-lg border border-[#ffbb00]/50 shadow-sm whitespace-nowrap">
                          Pending Approval
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: COMPENSATION MANAGEMENT */}
      {activeTab === 'COMPENSATION' && (
        <div className="bg-white border border-gray-100 rounded-b-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#160f29] min-w-[1000px]">
              <thead className="bg-[#160f29] text-xs uppercase tracking-widest text-[#fcfcff]">
                <tr>
                  <th className="px-6 py-5 cursor-pointer hover:bg-black transition-colors font-black" onClick={() => handleSort('name')}>
                    Employee <ArrowUpDown className="inline w-4 h-4 ml-1 text-[#ffbb00]"/>
                  </th>
                  <th className="px-6 py-5 font-black">Account Details</th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-black transition-colors font-black" onClick={() => handleSort('date')}>
                    Auto-Cron Counter <ArrowUpDown className="inline w-4 h-4 ml-1 text-[#ffbb00]"/>
                  </th>
                  <th className="px-6 py-5 w-80 font-black">Base Salary (₦)</th>
                  <th className="px-6 py-5 text-right font-black">Manual Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedEmployees.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-16 text-center text-[#160f29]/50 font-bold">No employees found.</td></tr>
                ) : (
                  processedEmployees.map((emp: any) => {
                    const daysLeft = calculateDaysLeft(emp.nextPayDate);
                    
                    return (
                      <tr key={emp.id} className="hover:bg-[#2a27fd]/5 transition-colors group">
                        <td className="px-6 py-5"><p className="font-black text-[#160f29] text-base group-hover:text-[#2a27fd] transition-colors">{emp.name}</p><p className="text-xs text-[#160f29]/60 font-bold mt-0.5">{emp.role}</p></td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-[#160f29]">{emp.bankName || 'Not Provided'}</p>
                          <p className="text-xs font-mono text-[#160f29]/60">{emp.salaryAccountNumber || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-5">
                          {daysLeft === null ? (
                            <span className="text-[#160f29]/40 font-bold italic text-xs">Unassigned</span>
                          ) : (
                            <div className="flex items-center">
                              <span className="font-bold text-[#160f29]/80 mr-3">{new Date(emp.nextPayDate).toLocaleDateString()}</span>
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm ${daysLeft <= 3 ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-[#2a27fd]/10 text-[#2a27fd] border border-[#2a27fd]/20'}`}>
                                {daysLeft <= 0 ? 'DUE NOW' : `${daysLeft} Days`}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex space-x-3">
                            <div className="relative flex-1">
                              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#160f29]/40" />
                              <input 
                                type="number" 
                                value={salaryInputs[emp.id] || ''}
                                onChange={(e) => setSalaryInputs({...salaryInputs, [emp.id]: e.target.value})}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-black text-[#160f29] focus:outline-none focus:ring-2 focus:ring-[#2a27fd]/20 focus:border-[#2a27fd] bg-[#fcfcff] shadow-inner transition-all"
                                placeholder="0.00"
                              />
                            </div>
                            <button 
                              onClick={() => handleSalarySave(emp.id)}
                              disabled={isProcessing}
                              className="bg-[#160f29] hover:bg-black text-white px-5 py-2.5 rounded-xl font-black text-xs transition-colors shadow-md disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => handleForcePayout(emp.id, emp.baseSalary)}
                            disabled={!emp.baseSalary || isProcessing}
                            className="px-5 py-2.5 bg-white text-[#160f29] hover:bg-[#ffbb00] rounded-xl font-black text-xs uppercase tracking-wider transition-all border border-gray-200 hover:border-[#ffbb00] shadow-sm disabled:opacity-50 flex items-center justify-end w-full sm:w-auto ml-auto whitespace-nowrap"
                          >
                            <Clock className="w-4 h-4 mr-2" /> Force Payout
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: MASTER LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white border border-gray-100 rounded-b-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#160f29] min-w-[950px]">
              <thead className="bg-[#160f29] text-xs uppercase tracking-widest text-[#fcfcff]">
                <tr>
                  <th className="px-6 py-5 cursor-pointer hover:bg-black transition-colors font-black" onClick={() => handleSort('date')}>Date Cleared <ArrowUpDown className="inline w-4 h-4 ml-1 text-[#ffbb00]"/></th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-black transition-colors font-black" onClick={() => handleSort('name')}>Employee <ArrowUpDown className="inline w-4 h-4 ml-1 text-[#ffbb00]"/></th>
                  <th className="px-6 py-5 font-black">Account Details</th>
                  <th className="px-6 py-5 font-black">Pay Period</th>
                  <th className="px-6 py-5 cursor-pointer hover:bg-black transition-colors font-black" onClick={() => handleSort('amount')}>Net Disbursed <ArrowUpDown className="inline w-4 h-4 ml-1 text-[#ffbb00]"/></th>
                  <th className="px-6 py-5 text-right font-black">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedHistorical.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-[#160f29]/50 font-bold">No historical data available.</td></tr>
                ) : (
                  processedHistorical.map((payroll: any) => (
                    <tr key={payroll.id} className="hover:bg-[#2a27fd]/5 transition-colors group">
                      <td className="px-6 py-5 font-bold text-[#160f29]/70">{new Date(payroll.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-5"><p className="font-black text-[#160f29] text-base group-hover:text-[#2a27fd] transition-colors">{payroll.user.name}</p><p className="text-xs text-[#160f29]/60 font-bold mt-0.5">{payroll.user.role}</p></td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-[#160f29]">{payroll.user.bankName || 'Not Provided'}</p>
                        <p className="text-xs font-mono text-[#160f29]/60">{payroll.user.salaryAccountNumber || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-5 font-bold text-[#160f29]/80">{payroll.payPeriod}</td>
                      <td className="px-6 py-5 font-black text-[#2a27fd] text-base">₦{payroll.netPay.toLocaleString()}</td>
                      <td className="px-6 py-5 text-right">
                        <span className="px-3 py-1.5 bg-green-100 text-green-800 text-[10px] uppercase tracking-wider font-black rounded-lg border border-green-300 shadow-sm whitespace-nowrap">
                          <CheckCircle className="w-3 h-3 inline mr-1" /> PAID
                        </span>
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