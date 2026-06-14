import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Search, Filter, Download } from 'lucide-react';
// import { db } from '@/lib/db'; // In production, fetch your logs via Prisma here

// Mock data reflecting the schema for demonstration
const mockLogs = [
  { id: 'log_901', action: 'PAYROLL_QUEUED', entityType: 'Payroll', user: 'Eleanor Vance (HR)', severity: 'INFO', ip: '192.168.1.45', time: 'Just now' },
  { id: 'log_902', action: 'FAILED_LOGIN_ATTEMPT', entityType: 'Auth', user: 'Unknown', severity: 'WARNING', ip: '104.28.19.14', time: '2 mins ago' },
  { id: 'log_903', action: 'DB_CONNECTION_DROP', entityType: 'System', user: 'System', severity: 'CRITICAL', ip: 'Internal', time: '15 mins ago' },
  { id: 'log_904', action: 'WIRE_TRANSFER_APPROVED', entityType: 'Transaction', user: 'Marcus Sterling (Admin)', severity: 'INFO', ip: '10.0.0.12', time: '1 hour ago' },
  { id: 'log_905', action: 'ROLE_ELEVATION', entityType: 'User', user: 'Marcus Sterling (Admin)', severity: 'WARNING', ip: '10.0.0.12', time: '2 hours ago' },
];

const SeverityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'CRITICAL': return <ShieldAlert className="w-5 h-5 text-red-500" />;
    case 'WARNING': return <AlertTriangle className="w-5 h-5 text-bank-gold" />;
    default: return <ShieldCheck className="w-5 h-5 text-green-500" />;
  }
};

const SeverityBadge = ({ type }: { type: string }) => {
  const styles = {
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
    WARNING: 'bg-bank-gold-light/20 text-bank-gold border-bank-gold/30',
    INFO: 'bg-green-50 text-green-700 border-green-200',
  }[type] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span className={`px-2.5 py-1 text-xs font-bold border rounded-full ${styles}`}>
      {type}
    </span>
  );
};

export default async function AuditLogsPage() {
  // const logs = await db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });

  return (
    <div className="min-h-screen bg-bank-bg p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-bank-blue">Security & Audit Logs</h1>
          <p className="text-slate-500 mt-1">System-wide event tracking and immutable compliance records.</p>
        </div>
        <button className="bg-white border border-gray-200 text-bank-blue-dark font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center">
          <Download className="w-4 h-4 mr-2" />
          Export CSV Log
        </button>
      </div>

      {/* Control Bar (Filters & Search) */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-100 border-b-0 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by IP, User, or Action ID..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bank-blue-light focus:border-transparent transition-all"
          />
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <button className="flex items-center px-4 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
            <Filter className="w-4 h-4 mr-2" /> Severity
          </button>
          <button className="flex items-center px-4 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
             Date Range
          </button>
        </div>
      </div>

      {/* Audit Log Data Table */}
      <div className="bg-white border border-gray-100 rounded-b-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-bank-blue text-white text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold w-12"></th>
              <th className="px-6 py-4 font-semibold">Timestamp</th>
              <th className="px-6 py-4 font-semibold">Action Event</th>
              <th className="px-6 py-4 font-semibold">Actor / IP</th>
              <th className="px-6 py-4 font-semibold">Target Entity</th>
              <th className="px-6 py-4 font-semibold">Severity</th>
              <th className="px-6 py-4 font-semibold text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/70 transition-colors group">
                <td className="px-6 py-4 text-center">
                  <SeverityIcon type={log.severity} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-slate-900">{log.time}</div>
                  <div className="text-xs text-slate-400">{log.id}</div>
                </td>
                <td className="px-6 py-4 font-bold text-bank-blue-dark">
                  {log.action}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{log.user}</div>
                  <div className="text-xs font-mono text-slate-500">{log.ip}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {log.entityType}
                </td>
                <td className="px-6 py-4">
                  <SeverityBadge type={log.severity} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-bank-blue font-medium hover:text-bank-gold transition-colors text-xs underline">
                    View Payload
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-sm text-slate-500">Showing 1 to 50 of 12,402 entries</span>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-200 text-slate-500 rounded hover:bg-white disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 border border-gray-200 text-slate-500 rounded hover:bg-white">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}