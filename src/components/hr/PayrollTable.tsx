import React from 'react';
import { MoreVertical } from 'lucide-react';

const mockLedger = [
  { id: 'PAY-1042', name: 'Eleanor Vance', role: 'Senior Risk Analyst', gross: 9500, net: 7250, status: 'Paid', date: 'June 2026' },
  { id: 'PAY-1043', name: 'Marcus Sterling', role: 'Branch Manager', gross: 11200, net: 8400, status: 'Paid', date: 'June 2026' },
  { id: 'PAY-1044', name: 'Aisha Rahman', role: 'Security Engineer', gross: 10500, net: 7980, status: 'Pending', date: 'June 2026' },
  { id: 'PAY-1045', name: 'David Chen', role: 'Teller', gross: 4200, net: 3450, status: 'Pending', date: 'June 2026' },
];

export default function PayrollTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 font-semibold">Transaction ID</th>
            <th className="px-6 py-4 font-semibold">Employee Details</th>
            <th className="px-6 py-4 font-semibold">Gross Pay</th>
            <th className="px-6 py-4 font-semibold">Net Pay</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {mockLedger.map((row) => (
            <tr key={row.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 font-medium text-bank-blue-dark">{row.id}</td>
              <td className="px-6 py-4">
                <div className="font-medium text-slate-900">{row.name}</div>
                <div className="text-xs text-slate-500">{row.role}</div>
              </td>
              <td className="px-6 py-4">${row.gross.toLocaleString()}</td>
              <td className="px-6 py-4 font-semibold text-bank-blue">${row.net.toLocaleString()}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  row.status === 'Paid' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-bank-gold-light/20 text-bank-gold'
                }`}>
                  {row.status}
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
  );
}