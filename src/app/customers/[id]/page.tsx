import React from 'react';
import { User, ShieldCheck, ShieldAlert, CreditCard, FileText, Activity } from 'lucide-react';

// Mock data matching our new schema
const mockCustomer = {
  id: 'CUST-8492',
  firstName: 'Alexander',
  lastName: 'Sterling',
  email: 'alex.sterling@example.com',
  phone: '+1 (555) 019-8372',
  kycStatus: 'PENDING',
  totalAssets: 1450000,
  accounts: [
    { id: 'ACC-1101', type: 'CHECKING', balance: 45000, currency: 'USD', status: 'Active' },
    { id: 'ACC-1102', type: 'INVESTMENT', balance: 1405000, currency: 'USD', status: 'Active' },
  ],
  documents: [
    { type: 'PASSPORT', status: 'Uploaded', date: 'Oct 12, 2026' },
    { type: 'PROOF_OF_ADDRESS', status: 'Missing', date: '-' },
  ]
};

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
  const isKycVerified = mockCustomer.kycStatus === 'VERIFIED';

  return (
    <div className="min-h-screen bg-bank-bg p-8">
      {/* Header & Identity Section */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-bank-blue text-bank-gold rounded-full flex items-center justify-center text-3xl font-bold shadow-sm">
            {mockCustomer.firstName[0]}{mockCustomer.lastName[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-bank-blue-dark">
              {mockCustomer.firstName} {mockCustomer.lastName}
            </h1>
            <p className="text-slate-500 mt-1 font-mono text-sm">{mockCustomer.id} • {mockCustomer.email}</p>
            <div className="flex items-center mt-3 space-x-3">
              <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center ${
                isKycVerified ? 'bg-green-100 text-green-700' : 'bg-bank-gold-light/30 text-bank-gold border border-bank-gold/20'
              }`}>
                {isKycVerified ? <ShieldCheck className="w-4 h-4 mr-1" /> : <ShieldAlert className="w-4 h-4 mr-1" />}
                KYC {mockCustomer.kycStatus}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 border border-bank-gold text-bank-gold font-medium rounded-lg hover:bg-bank-gold hover:text-bank-blue-dark transition-colors shadow-sm">
            Request Documents
          </button>
          <button className="bg-bank-blue hover:bg-bank-blue-light text-white font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
            Verify Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Financial Portfolio */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-bank-blue-dark mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-bank-gold" /> Active Accounts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockCustomer.accounts.map((acc) => (
                <div key={acc.id} className="p-4 rounded-lg border border-gray-100 bg-slate-50/50 hover:border-bank-blue/30 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{acc.type}</span>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">{acc.status}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-bank-blue">${acc.balance.toLocaleString()}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-2">{acc.id}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-bank-blue-dark mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-bank-gold" /> Recent Activity
            </h2>
            <p className="text-sm text-slate-500">Transaction history integration will be displayed here.</p>
          </div>
        </div>

        {/* Right Column: KYC & Compliance */}
        <div className="space-y-6">
          <div className="bg-bank-blue p-6 rounded-xl shadow-sm text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-bank-gold" /> Compliance Vault
            </h2>
            <div className="space-y-4">
              {mockCustomer.documents.map((doc, idx) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b border-white/10 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{doc.type.replace('_', ' ')}</p>
                    <p className="text-xs text-bank-blue-light mt-0.5">{doc.date}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    doc.status === 'Uploaded' ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Contact Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Phone</span>
                <span className="font-medium text-slate-900">{mockCustomer.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-slate-900">{mockCustomer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timezone</span>
                <span className="font-medium text-slate-900">EST (UTC-5)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}