import React from 'react';
import { Users, UserPlus, Briefcase, TrendingUp } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import Link from 'next/link';

export default function HrDashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-bank-blue">HR Command Center</h1>
          <p className="text-slate-500 mt-1">Manage personnel, onboarding, and organizational metrics.</p>
        </div>
        <Link 
          href="/hr/employees"
          className="bg-bank-blue hover:bg-bank-blue-light text-white font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          Manage Employees
        </Link>
      </div>

      {/* High-Level HR Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Headcount" value="1,245" trend="12" isPositive={true} Icon={Users} />
        <StatCard title="New Hires (YTD)" value="84" trend="15%" isPositive={true} Icon={UserPlus} />
        <StatCard title="Open Requisitions" value="23" trend="3" isPositive={false} Icon={Briefcase} />
        <StatCard title="Retention Rate" value="94.2%" trend="1.1%" isPositive={true} Icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Links / Actions */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-bank-blue-dark mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/hr/employees" className="block p-4 rounded-lg border border-gray-100 bg-slate-50 hover:border-bank-blue/30 transition-colors">
              <h3 className="font-bold text-bank-blue">Employee Directory</h3>
              <p className="text-sm text-slate-500 mt-1">View, edit, and manage all staff profiles and roles.</p>
            </Link>
            <Link href="/hr/payroll" className="block p-4 rounded-lg border border-gray-100 bg-slate-50 hover:border-bank-blue/30 transition-colors">
              <h3 className="font-bold text-bank-blue">Payroll Processing</h3>
              <p className="text-sm text-slate-500 mt-1">Review pending disbursements and generate payslips.</p>
            </Link>
          </div>
        </div>

        {/* Recent Onboarding Feed */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold text-bank-blue-dark mb-4">Recent Onboardings</h2>
          <div className="space-y-4">
            {[
              { name: 'Sarah Jenkins', role: 'Compliance Officer', date: 'Oct 12' },
              { name: 'Michael Chang', role: 'Senior Developer', date: 'Oct 10' },
              { name: 'Aisha Rahman', role: 'Risk Analyst', date: 'Oct 08' }
            ].map((hire, i) => (
              <div key={i} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-bank-blue/10 text-bank-blue flex items-center justify-center font-bold text-sm">
                    {hire.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{hire.name}</p>
                    <p className="text-xs text-slate-500">{hire.role}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-400">{hire.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}