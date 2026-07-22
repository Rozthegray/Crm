'use client';

/**
 * REQUIRES: npm install papaparse
 *
 * Renders the admin/HR payroll ledger from real data returned by
 * getPayrollCommandData() — no mock rows. Pass `pendingPayrolls` and
 * `historicalPayrolls` straight through from that action's response.
 *
 * Two exports are provided per the current workflow:
 *   - "This Month's Payment List"  -> the pending (isPaid: false) batch,
 *      i.e. the run about to be bulk-disbursed.
 *   - "All-Time Payroll History"   -> paid records, most recent first.
 *      Note: the backend currently caps this at the last 50 records
 *      (see `take: 50` in getPayrollCommandData) — bump that limit or
 *      add pagination if you need the full lifetime archive exported.
 */

import React, { useState } from 'react';
import { MoreVertical, FileSpreadsheet, Loader2, CalendarClock, History } from 'lucide-react';

type PayrollUser = {
  name: string;
  role: string;
  bankName: string | null;
  salaryAccountNumber: string | null;
};

type PayrollRecord = {
  id: string;
  baseSalary: number;
  allowances: number;
  dedctions: number; // matches the schema's field name
  netPay: number;
  payPeriod: string;
  isPaid: boolean;
  createdAt: string | Date;
  user: PayrollUser;
};

interface PayrollTableProps {
  pendingPayrolls: PayrollRecord[];
  historicalPayrolls: PayrollRecord[];
}

export default function PayrollTable({ pendingPayrolls, historicalPayrolls }: PayrollTableProps) {
  const [isExporting, setIsExporting] = useState<'month' | 'history' | null>(null);

  const rows = [...pendingPayrolls, ...historicalPayrolls].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const toExportRows = (records: PayrollRecord[]) =>
    records.map(p => ({
      'Employee Name': p.user.name,
      'Department': p.user.role.replace(/_/g, ' '),
      'Base Salary': p.baseSalary,
      'Allowances': p.allowances,
      'Deductions': p.dedctions,
      'Net Pay': p.netPay,
      'Bank Name': p.user.bankName || 'Not on file',
      'Account Number': p.user.salaryAccountNumber || 'Not on file',
      'Pay Period': p.payPeriod,
      'Status': p.isPaid ? 'Paid' : 'Pending',
      'Date': new Date(p.createdAt).toLocaleDateString(),
    }));

  const downloadCSV = async (records: PayrollRecord[], filename: string, key: 'month' | 'history') => {
    if (records.length === 0) {
      alert('There is nothing to export yet.');
      return;
    }
    setIsExporting(key);
    try {
      const Papa = (await import('papaparse')).default;
      const csv = Papa.unparse(toExportRows(records));
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Could not generate the export.');
    } finally {
      setIsExporting(null);
    }
  };

  const exportThisMonth = () =>
    downloadCSV(pendingPayrolls, `payroll_this_month_${new Date().toISOString().split('T')[0]}.csv`, 'month');

  const exportHistory = () =>
    downloadCSV(historicalPayrolls, `payroll_history_all_time_${new Date().toISOString().split('T')[0]}.csv`, 'history');

  return (
    <div>
      {/* Export Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={exportThisMonth}
          disabled={isExporting !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-bank-blue/10 hover:bg-bank-blue/20 text-bank-blue rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          {isExporting === 'month' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
          Export This Month's Payment List
        </button>
        <button
          onClick={exportHistory}
          disabled={isExporting !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-bank-gold/10 hover:bg-bank-gold/20 text-bank-gold-dark rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          {isExporting === 'history' ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
          Export All-Time History (CSV)
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-gray-200">
          <FileSpreadsheet className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-semibold text-sm text-center">No payroll records found for your branch yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Employee Details</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Gross Pay</th>
                <th className="px-6 py-4 font-semibold">Net Pay</th>
                <th className="px-6 py-4 font-semibold">Pay Period</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{row.user.name}</div>
                    <div className="text-xs text-slate-500">
                      {row.user.bankName || 'No bank on file'}
                      {row.user.salaryAccountNumber ? ` · ${row.user.salaryAccountNumber}` : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4">{row.user.role.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4">${(row.baseSalary + row.allowances).toLocaleString()}</td>
                  <td className="px-6 py-4 font-semibold text-bank-blue">${row.netPay.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs">{row.payPeriod}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      row.isPaid
                        ? 'bg-green-100 text-green-700'
                        : 'bg-bank-gold-light/20 text-bank-gold'
                    }`}>
                      {row.isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-bank-blue transition-colors">
                      <MoreVertical className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}