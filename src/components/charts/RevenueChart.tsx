'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', deposits: 4000, loans: 2400 },
  { name: 'Feb', deposits: 3000, loans: 1398 },
  { name: 'Mar', deposits: 2000, loans: 9800 },
  { name: 'Apr', deposits: 2780, loans: 3908 },
  { name: 'May', deposits: 1890, loans: 4800 },
  { name: 'Jun', deposits: 2390, loans: 3800 },
];

export default function OverviewChart() {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0A2540" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0A2540" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Area type="monotone" dataKey="deposits" stroke="#0A2540" fillOpacity={1} fill="url(#colorDeposits)" strokeWidth={2} />
          <Area type="monotone" dataKey="loans" stroke="#D4AF37" fillOpacity={1} fill="url(#colorLoans)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}