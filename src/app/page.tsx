'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Activity, Users, FileText, ArrowRight, Building2 } from 'lucide-react';

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#fcfcff] selection:bg-[#ffbb00] selection:text-[#160f29]">
      
      {/* Navigation Bar */}
      <header className="bg-[#160f29] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#2a27fd] rounded-xl flex items-center justify-center shadow-lg border border-[#2a27fd]/50">
              <Building2 className="w-5 h-5 text-[#ffbb00]" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              Enterprise<span className="text-[#ffbb00]">CRM</span>
            </span>
          </div>
          <nav>
            <Link 
              href="/login" 
              className="px-5 py-2 sm:px-6 sm:py-2.5 bg-[#ffbb00] text-[#160f29] text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl hover:bg-[#ffd043] transition-all shadow-md flex items-center"
            >
              System Login <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-grow flex flex-col justify-center relative overflow-hidden bg-[#160f29]">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#2a27fd] blur-[120px] opacity-30 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#ffbb00] blur-[120px] opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 relative z-10 text-center flex flex-col items-center">
          <span className="inline-block py-1.5 px-4 rounded-lg bg-white/5 text-[#ffbb00] border border-white/10 text-[10px] sm:text-xs font-black tracking-widest uppercase mb-8 backdrop-blur-sm">
            Internal Operations Network
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#fcfcff] tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
            Branch Operations <span className="text-[#2a27fd]">Portal</span>
          </h1>
          <p className="text-base sm:text-lg text-white/60 font-bold mb-10 max-w-2xl mx-auto leading-relaxed">
            Secure access to your internal workspace, HR resources, and payroll systems. Authorized personnel only.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-[#2a27fd] text-white font-black uppercase tracking-wider text-sm rounded-xl hover:bg-[#1a18d0] transition-all shadow-lg flex items-center justify-center"
            >
              Staff Login
            </Link>
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-[#fcfcff] text-[#160f29] font-black uppercase tracking-wider text-sm rounded-xl hover:bg-gray-100 transition-all shadow-sm flex items-center justify-center border border-gray-200"
            >
              New Employee Setup
            </Link>
          </div>
        </div>
      </section>

      {/* Core Modules Grid */}
      <section className="bg-[#fcfcff] py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-[#160f29] tracking-tight">Core Modules</h2>
            <p className="text-[#160f29]/60 font-bold mt-3 uppercase tracking-widest text-sm">System Capabilities & Tools</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <FeatureCard 
              icon={ShieldCheck} 
              title="Security & Auditing" 
              description="Every administrative and HR action is logged to ensure full corporate compliance." 
            />
            <FeatureCard 
              icon={Activity} 
              title="Automated Payroll" 
              description="Manage employee base salaries, trigger disbursements, and track payment histories." 
            />
            <FeatureCard 
              icon={Users} 
              title="Staff Onboarding" 
              description="Secure processing of employee records, including NIN and BVN verification." 
            />
            <FeatureCard 
              icon={FileText} 
              title="Document Vault" 
              description="Encrypted cloud storage for official identification and curriculum vitae." 
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#160f29] border-t border-white/10 py-10 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center mb-4 opacity-50">
            <Building2 className="w-5 h-5 text-white mr-2" />
            <span className="text-white font-black tracking-widest uppercase text-xs">Enterprise CRM</span>
          </div>
          <p className="text-sm font-bold text-white/40">&copy; {new Date().getFullYear()} Operations Network. All rights reserved.</p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-red-400/80">Confidential & Proprietary. Unauthorized access is strictly prohibited.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white border border-gray-200 hover:border-[#2a27fd]/30 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all group">
      <div className="w-14 h-14 bg-[#fcfcff] rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6 group-hover:bg-[#2a27fd] transition-colors duration-300">
        <Icon className="w-7 h-7 text-[#2a27fd] group-hover:text-white transition-colors duration-300" />
      </div>
      <h3 className="text-lg font-black text-[#160f29] mb-3">{title}</h3>
      <p className="text-sm font-medium text-[#160f29]/60 leading-relaxed">{description}</p>
    </div>
  );
}