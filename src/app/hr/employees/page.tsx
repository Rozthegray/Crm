'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, ShieldAlert, FileText, User, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { getBranchDirectory } from '@/features/hr/actions';

export default function EmployeeDirectoryPage() {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'PENDING'>('PENDING');
  
  // Live State
  const [pendingStaff, setPendingStaff] = useState<any[]>([]);
  const [activeStaff, setActiveStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch branch data on component mount
  const fetchDirectory = async () => {
    setIsLoading(true);
    try {
      const res = await getBranchDirectory();
      if (res.success) {
        setPendingStaff(res.pending);
        setActiveStaff(res.active);
      }
    } catch (error) {
      console.error("Failed to load branch directory.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  return (
    <div className="p-4 md:p-8 bg-[#fcfcff] min-h-screen animate-in fade-in duration-300">
      
      {/* --- HEADER --- */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#160f29] tracking-tight">Branch Personnel Management</h1>
          <p className="text-[#160f29]/60 mt-2 font-medium">Review pending KYC applications and manage active staff in your branch.</p>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex bg-[#160f29]/5 border border-[#160f29]/10 p-1.5 rounded-xl w-full md:w-fit mb-8 shadow-inner overflow-x-auto">
        <button 
          onClick={() => setActiveTab('PENDING')}
          className={`flex-1 md:flex-none px-6 py-3 text-sm font-black rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'PENDING' 
              ? 'bg-[#160f29] text-white shadow-md' 
              : 'text-[#160f29]/60 hover:text-[#160f29] hover:bg-[#160f29]/5'
          }`}
        >
          Pending Approvals 
          {pendingStaff.length > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'PENDING' ? 'bg-[#ffbb00] text-[#160f29]' : 'bg-[#ffbb00] text-[#160f29]'}`}>
              {pendingStaff.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('DIRECTORY')}
          className={`flex-1 md:flex-none px-6 py-3 text-sm font-black rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'DIRECTORY' 
              ? 'bg-[#160f29] text-white shadow-md' 
              : 'text-[#160f29]/60 hover:text-[#160f29] hover:bg-[#160f29]/5'
          }`}
        >
          Active Directory 
          <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'DIRECTORY' ? 'bg-white/20 text-white' : 'bg-[#160f29]/10 text-[#160f29]'}`}>
            {activeStaff.length}
          </span>
        </button>
      </div>

      {/* --- DATA TABLE CONTAINER --- */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden min-h-[400px]">
        
        {/* Search & Filter Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#fcfcff]">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-[#2a27fd]/50" />
            <input 
              type="text" 
              placeholder="Search by name, email, or ID..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#160f29] focus:outline-none focus:border-[#2a27fd] focus:ring-2 focus:ring-[#2a27fd]/20 transition-all shadow-sm"
            />
          </div>
          <button className="flex items-center justify-center px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-[#160f29] hover:bg-[#fcfcff] hover:border-gray-300 w-full sm:w-auto shadow-sm transition-all">
            <Filter className="w-4 h-4 mr-2 text-[#ffbb00]" /> Filter Roles
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#2a27fd]" />
            <p className="font-black text-sm text-[#160f29]/50 tracking-widest uppercase">Synchronizing Database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#160f29] min-w-[800px]">
              <thead className="bg-[#160f29] text-xs uppercase tracking-widest text-[#fcfcff]">
                <tr>
                  <th className="px-6 py-5 font-black">Personnel Data</th>
                  <th className="px-6 py-5 font-black">Designation</th>
                  {activeTab === 'PENDING' ? (
                    <>
                      <th className="px-6 py-5 font-black">Compliance Check</th>
                      <th className="px-6 py-5 font-black text-right">Security Action</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-5 font-black">Network Status</th>
                      <th className="px-6 py-5 font-black text-right">Command</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                
                {/* --- PENDING TAB --- */}
                {activeTab === 'PENDING' && pendingStaff.map((req) => (
                  <tr key={req.id} className="hover:bg-[#2a27fd]/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-black text-[#160f29] text-base group-hover:text-[#2a27fd] transition-colors">{req.name}</div>
                      <div className="text-xs text-[#160f29]/60 font-bold mt-0.5">{req.email}</div>
                      <div className="text-[10px] text-[#ffbb00] font-black mt-2 uppercase tracking-wider bg-[#ffbb00]/10 inline-block px-2 py-0.5 rounded">
                        Applied: {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-[#160f29]">{req.role.replace('_', ' ')}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="text-xs font-mono font-bold text-[#160f29] bg-[#fcfcff] px-2 py-1 rounded border border-gray-100 w-fit">
                          <span className="text-[#160f29]/40 mr-2">NIN:</span> {req.nin ? 'Provided' : 'Missing'}
                        </div>
                        <div className="text-xs font-mono font-bold text-[#160f29] bg-[#fcfcff] px-2 py-1 rounded border border-gray-100 w-fit">
                          <span className="text-[#160f29]/40 mr-2">BVN:</span> {req.bvn ? 'Provided' : 'Missing'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {/* SECURITY UPGRADE: Force admin to view details before approving */}
                      <Link 
                        href={`/hr/employees/${req.id}`} 
                        className="inline-flex items-center px-6 py-3 bg-[#160f29] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-black transition-all shadow-md group-hover:shadow-lg"
                      >
                        <ShieldAlert className="w-4 h-4 mr-2 text-[#ffbb00]" /> Review to Approve
                      </Link>
                    </td>
                  </tr>
                ))}

                {/* --- DIRECTORY TAB --- */}
                {activeTab === 'DIRECTORY' && activeStaff.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#2a27fd]/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-black text-[#160f29] text-base group-hover:text-[#2a27fd] transition-colors">{emp.name}</div>
                      <div className="text-xs text-[#160f29]/60 font-bold mt-0.5">{emp.email}</div>
                      <div className="text-[10px] font-mono text-[#160f29]/40 font-black mt-1 uppercase tracking-wider">ID: {emp.id.split('-')[0]}</div>
                    </td>
                    <td className="px-6 py-5 font-black text-[#160f29]">{emp.role.replace('_', ' ')}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 text-xs font-black rounded-lg border shadow-sm uppercase tracking-wider ${
                        emp.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800 border-green-300' 
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link 
                        href={`/hr/employees/${emp.id}`} 
                        className="inline-flex items-center px-6 py-3 bg-[#fcfcff] border border-gray-200 text-[#160f29] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#2a27fd] hover:text-white hover:border-[#2a27fd] transition-all shadow-sm"
                      >
                        Open File <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </td>
                  </tr>
                ))}

                {/* --- EMPTY STATES --- */}
                {activeTab === 'PENDING' && pendingStaff.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <p className="text-lg font-black text-[#160f29]">Queue is Clear</p>
                      <p className="text-sm font-medium text-[#160f29]/50 mt-1">No pending applications require review.</p>
                    </td>
                  </tr>
                )}
                
                {activeTab === 'DIRECTORY' && activeStaff.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="w-16 h-16 bg-[#160f29]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-[#160f29]/30" />
                      </div>
                      <p className="text-lg font-black text-[#160f29]">Directory Empty</p>
                      <p className="text-sm font-medium text-[#160f29]/50 mt-1">No active personnel found in this branch.</p>
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}