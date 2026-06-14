'use client';

import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Loader2, Building2, AlertCircle, Lock, User as UserIcon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const errorMsg = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      const displayError = res.error === 'CredentialsSignin' 
        ? 'Invalid credentials. Access denied.' 
        : res.error;
      
      setError(displayError);
      setIsLoading(false);
    } else {
      const session = await getSession();
      const role = session?.user?.role;

      if (callbackUrl && callbackUrl !== '/' && callbackUrl !== '/login') {
        router.push(callbackUrl);
      } else if (role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (role === 'ADMIN' || role === 'HR') {
        router.push('/hr/employees'); 
      } else {
        router.push('/dashboard'); 
      }
      
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#160f29] via-[#160f29] to-[#2a27fd] flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="mx-auto w-20 h-20 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl mb-6 border border-white/10">
          <Building2 className="w-10 h-10 text-[#ffbb00] drop-shadow-md" />
        </div>
        <h2 className="text-3xl font-black text-[#fcfcff] tracking-tight">Enterprise Command</h2>
        <p className="mt-2 text-sm text-white/80 font-black tracking-widest uppercase">Secure Access Only</p>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#fcfcff] py-10 px-6 shadow-2xl sm:rounded-3xl sm:px-12 relative overflow-hidden border border-gray-200">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2a27fd] via-[#ffbb00] to-[#2a27fd]"></div>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {errorMsg === 'SessionExpired' && (
              <div className="p-4 bg-yellow-50 border border-yellow-300 text-yellow-900 text-sm font-bold rounded-xl flex items-center shadow-sm">
                <Shield className="w-5 h-5 mr-3 flex-shrink-0" /> Your session has expired due to inactivity.
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-300 text-red-800 text-sm font-bold rounded-xl flex items-start shadow-sm">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">Network ID (Email)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-[#160f29]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-[#160f29] placeholder:text-gray-400 focus:outline-none focus:border-[#2a27fd] focus:ring-2 focus:ring-[#2a27fd]/30 transition-all shadow-sm"
                  placeholder="firstname.lastname@bank.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">Secure Passkey</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#160f29]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-[#160f29] placeholder:text-gray-400 focus:outline-none focus:border-[#2a27fd] focus:ring-2 focus:ring-[#2a27fd]/30 transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 rounded-xl shadow-lg text-sm font-black text-[#160f29] bg-[#ffbb00] hover:bg-[#ffd043] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffbb00] transition-all disabled:opacity-70 mt-6"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#160f29]" /> : 'Authenticate & Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}