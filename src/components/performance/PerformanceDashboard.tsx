'use client';

import React, { useState, useEffect } from 'react';
import { Target, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Award, Calendar, AlertCircle } from 'lucide-react';

// --- MOCK DATA ---
// In production, fetch this via a server action using the currently viewed userId
const MOCK_OBJECTIVES = [
  { id: '1', title: 'Q3 Deposit Mobilization', currentValue: 32500000, targetValue: 50000000, metric: 'NGN', deadline: '2026-09-30', status: 'ON_TRACK' },
  { id: '2', title: 'New Corporate Accounts', currentValue: 85, targetValue: 100, metric: 'Accounts', deadline: '2026-08-15', status: 'ON_TRACK' },
  { id: '3', title: 'Loan Recovery Rate', currentValue: 45, targetValue: 80, metric: '%', deadline: '2026-07-30', status: 'BEHIND' },
];

const MOCK_CERTS = [
  { id: '1', name: 'AML / CFT Level 2', issuer: 'Central Bank of Nigeria', issuedAt: '2025-06-10', expiresAt: '2026-06-10', status: 'EXPIRED' },
  { id: '2', name: 'Data Privacy & Protection', issuer: 'Internal Compliance', issuedAt: '2025-08-01', expiresAt: '2026-08-01', status: 'EXPIRING_SOON' },
  { id: '3', name: 'Advanced Credit Risk Analysis', issuer: 'Lagos Business School', issuedAt: '2026-01-15', expiresAt: '2028-01-15', status: 'VALID' },
];

export function PerformanceDashboard({ userId }: { userId?: string }) {
  const [objectives, setObjectives] = useState(MOCK_OBJECTIVES);
  const [certifications, setCertifications] = useState(MOCK_CERTS);
  const [isLoading, setIsLoading] = useState(false);

  // In production, use useEffect to fetch the user's specific OKRs and Certs
  // useEffect(() => { fetchPerformanceData(userId) }, [userId]);

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const getOkrColor = (status: string) => {
    switch (status) {
      case 'ON_TRACK': return 'bg-[#10b981]'; // Green
      case 'AT_RISK': return 'bg-[#ffbb00]'; // Yellow
      case 'BEHIND': return 'bg-[#ef4444]'; // Red
      case 'COMPLETED': return 'bg-[#2a27fd]'; // Blue
      default: return 'bg-gray-300';
    }
  };

  const getCertBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-300 shadow-sm flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Valid</span>;
      case 'EXPIRING_SOON':
        return <span className="px-3 py-1 bg-[#ffbb00]/20 text-[#160f29] text-[10px] font-black uppercase tracking-widest rounded-lg border border-[#ffbb00]/50 shadow-sm flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> 30 Days</span>;
      case 'EXPIRED':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-300 shadow-sm flex items-center"><XCircle className="w-3 h-3 mr-1" /> Expired</span>;
      case 'REVOKED':
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-[10px] font-black uppercase tracking-widest rounded-lg border border-gray-300 shadow-sm flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Revoked</span>;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in duration-500">
      
      {/* ========================================= */}
      {/* MODULE 1: OBJECTIVES & KEY RESULTS (OKRs) */}
      {/* ========================================= */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        <div className="bg-[#160f29] p-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-white flex items-center">
              <Target className="w-5 h-5 mr-3 text-[#ffbb00]" /> 
              Performance Matrix
            </h2>
            <p className="text-white/60 text-[10px] font-bold mt-1 uppercase tracking-widest">Active Objectives & Key Results</p>
          </div>
          <TrendingUp className="w-8 h-8 text-white/10" />
        </div>

        <div className="p-6 flex-grow flex flex-col gap-6">
          {objectives.length === 0 ? (
            <div className="flex-grow flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active targets assigned</p>
            </div>
          ) : (
            objectives.map((okr) => {
              const progress = calculateProgress(okr.currentValue, okr.targetValue);
              const barColor = getOkrColor(okr.status);
              
              return (
                <div key={okr.id} className="p-5 bg-[#fcfcff] border border-gray-100 rounded-2xl shadow-sm hover:border-[#2a27fd]/30 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-black text-[#160f29] text-base group-hover:text-[#2a27fd] transition-colors">{okr.title}</h3>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                      <Calendar className="w-3 h-3 mr-1" /> {new Date(okr.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</p>
                    <p className="font-mono font-black text-[#160f29]">
                      {okr.metric === 'NGN' && '₦'}{okr.currentValue.toLocaleString()} <span className="text-gray-400 text-xs">/ {okr.targetValue.toLocaleString()} {okr.metric !== 'NGN' && okr.metric}</span>
                    </p>
                  </div>
                  
                  {/* Progress Bar Track */}
                  <div className="w-full bg-gray-100 rounded-full h-3 mb-2 shadow-inner overflow-hidden">
                    <div 
                      className={`${barColor} h-3 rounded-full transition-all duration-1000 ease-out`} 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-end">
                     <span className="text-[10px] font-black text-[#160f29] uppercase tracking-widest">{progress}% Completed</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* MODULE 2: COMPLIANCE & CERTIFICATIONS       */}
      {/* ========================================= */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        <div className="bg-blue-50 border-b border-blue-100 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-[#160f29] flex items-center">
              <ShieldAlert className="w-5 h-5 mr-3 text-[#2a27fd]" /> 
              Compliance Vault
            </h2>
            <p className="text-[#160f29]/60 text-[10px] font-bold mt-1 uppercase tracking-widest">Regulatory Certifications</p>
          </div>
          <Award className="w-8 h-8 text-[#2a27fd]/20" />
        </div>

        <div className="p-6 flex-grow">
          {certifications.length === 0 ? (
             <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No records found</p>
             </div>
          ) : (
            <div className="space-y-4">
              {certifications.map((cert) => (
                <div key={cert.id} className={`p-5 rounded-2xl border transition-all flex justify-between items-center ${cert.status === 'EXPIRED' ? 'bg-red-50/30 border-red-100' : cert.status === 'EXPIRING_SOON' ? 'bg-[#ffbb00]/5 border-[#ffbb00]/20' : 'bg-[#fcfcff] border-gray-100 hover:border-[#2a27fd]/30'}`}>
                  <div>
                    <h3 className="font-black text-[#160f29] text-sm md:text-base">{cert.name}</h3>
                    <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{cert.issuer}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[10px] font-black text-gray-400">ISSUED: {new Date(cert.issuedAt).toLocaleDateString()}</span>
                      <span className="text-[10px] font-black text-gray-400 border-l border-gray-200 pl-3">EXPIRES: {new Date(cert.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="shrink-0 ml-4">
                    {getCertBadge(cert.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start shadow-sm">
            <AlertCircle className="w-4 h-4 text-gray-400 mr-3 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-widest">
              The internal compliance scanner audits these records daily. Lapsed certifications will automatically trigger clearance revocation protocols.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}