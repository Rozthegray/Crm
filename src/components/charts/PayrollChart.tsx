'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const payrollData = [
  { department: 'Retail Banking', base: 120000, allowances: 25000, deductions: 15000 },
  { department: 'Corporate', base: 250000, allowances: 45000, deductions: 35000 },
  { department: 'IT & Security', base: 180000, allowances: 30000, deductions: 22000 },
  { department: 'HR & Admin', base: 90000, allowances: 15000, deductions: 10000 },
  { department: 'Customer Service', base: 85000, allowances: 12000, deductions: 8000 },
];

export default function PayrollChart() {
  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={payrollData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="department" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
          />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }} />
          <Bar dataKey="base" name="Base Salary" stackId="a" fill="#0A2540" radius={[0, 0, 4, 4]} />
          <Bar dataKey="allowances" name="Allowances" stackId="a" fill="#D4AF37" />
          {/* Deductions are shown on a separate stack to visualize them against total gross */}
          <Bar dataKey="deductions" name="Deductions (Taxes/Benefits)" stackId="b" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}