import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  Icon: LucideIcon;
}

export default function StatCard({ title, value, trend, isPositive, Icon }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="p-2 bg-bank-blue/5 rounded-lg">
          <Icon className="w-5 h-5 text-bank-gold" />
        </div>
      </div>
      <div className="flex items-baseline space-x-2">
        <h2 className="text-2xl font-bold text-bank-blue-dark">{value}</h2>
      </div>
      <p className={`text-xs mt-2 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '↑' : '↓'} {trend} from last month
      </p>
    </div>
  );
}