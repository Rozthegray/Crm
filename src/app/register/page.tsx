'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, ArrowRight, Upload, CheckCircle2, Loader2, Shield, User, AlertCircle } from 'lucide-react';
import { submitEmployeeApplication } from '@/features/employee-management/register';

export default function EmployeeRegistrationPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cvName, setCvName] = useState<string | null>(null);
  const [avatarName, setAvatarName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setUploadStatus('Encrypting & Uploading Documents...');
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset'; 

      if (!cloudName) {
        throw new Error("Cloudinary missing. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to .env");
      }

      const cvFile = formData.get('cvDocument') as File;
      const avatarFile = formData.get('avatarImage') as File;

      const uploadToCloudinary = async (file: File) => {
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', uploadPreset);
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: data
        });
        
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Document upload failed');
        return json.secure_url;
      };

      if (cvFile && cvFile.size > 0) {
        const cvUrl = await uploadToCloudinary(cvFile);
        formData.set('cvUrl', cvUrl);
      }
      
      if (avatarFile && avatarFile.size > 0) {
        const avatarUrl = await uploadToCloudinary(avatarFile);
        formData.set('avatarUrl', avatarUrl);
      }

      setUploadStatus('Transmitting to Headquarters...');
      const result = await submitEmployeeApplication(formData);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Submission failed. Please check your details.");
      }
    } catch (err: any) {
      setError(err.message || "A critical error occurred while communicating with the server.");
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#fcfcff] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full bg-white p-12 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-200 text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border-8 border-green-100">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-[#160f29] mb-4 tracking-tight">Application Received</h2>
          <p className="text-[#160f29] mb-8 font-bold leading-relaxed">
            Your registration has been securely transmitted. Your account is currently <strong className="text-[#160f29] bg-[#ffbb00] px-2 py-1 rounded">Pending Approval</strong> by the HR department at your selected branch.
          </p>
          <Link href="/login" className="bg-[#160f29] text-white px-8 py-4 rounded-xl font-black hover:bg-black transition-all inline-block w-full shadow-lg">
            Return to Login Console
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcff] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center animate-in fade-in duration-500">
      
      <div className="mb-10 text-center">
        <div className="mx-auto w-16 h-16 bg-[#160f29] rounded-2xl flex items-center justify-center shadow-xl mb-6 border-2 border-[#2a27fd]/30 transform rotate-3">
          <Building2 className="w-8 h-8 text-[#ffbb00]" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-[#160f29] tracking-tight">Staff Onboarding</h2>
        <p className="mt-3 text-xs sm:text-sm text-[#160f29] font-black uppercase tracking-widest">Secure Registration Portal</p>
      </div>

      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2a27fd] via-[#ffbb00] to-[#2a27fd]"></div>
        
        {/* Progress Bar */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {['Personal Details', 'Security & KYC', 'Placement & Docs'].map((label, index) => (
            <div key={index} className={`flex-1 py-5 text-center text-[10px] sm:text-xs font-black uppercase tracking-widest border-b-4 transition-all ${step === index + 1 ? 'border-[#ffbb00] text-[#2a27fd] bg-white shadow-sm' : 'border-transparent text-gray-500'}`}>
              <span className="hidden sm:inline">Step {index + 1}:</span> {label}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 md:p-12">
          
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start text-sm font-bold shadow-sm">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* STEP 1: Personal Details */}
          <div className={`transition-all duration-300 ${step === 1 ? 'block animate-in slide-in-from-right-4' : 'hidden'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">First Name</label>
                <input type="text" name="firstName" required className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-[#160f29] placeholder:text-gray-400 focus:ring-2 focus:ring-[#2a27fd]/30 focus:border-[#2a27fd] transition-all shadow-sm" placeholder="e.g. Chibuzor" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">Last Name</label>
                <input type="text" name="lastName" required className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-[#160f29] placeholder:text-gray-400 focus:ring-2 focus:ring-[#2a27fd]/30 focus:border-[#2a27fd] transition-all shadow-sm" placeholder="e.g. Osemene" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">Date of Birth</label>
                <input type="date" name="birthDate" required className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-[#160f29] focus:ring-2 focus:ring-[#2a27fd]/30 focus:border-[#2a27fd] transition-all shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">Phone Number</label>
                <input type="tel" name="phone" required className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-[#160f29] placeholder:text-gray-400 focus:ring-2 focus:ring-[#2a27fd]/30 focus:border-[#2a27fd] transition-all shadow-sm" placeholder="+234 (0) 800 000 0000" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">Home Address</label>
                <textarea name="address" required rows={2} className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-[#160f29] placeholder:text-gray-400 resize-none focus:ring-2 focus:ring-[#2a27fd]/30 focus:border-[#2a27fd] transition-all shadow-sm" placeholder="Full residential address"></textarea>
              </div>
            </div>
          </div>

          {/* STEP 2: Security & KYC */}
          <div className={`transition-all duration-300 ${step === 2 ? 'block animate-in slide-in-from-right-4' : 'hidden'}`}>
            <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex items-start mb-8 shadow-sm">
              <Shield className="w-6 h-6 text-[#2a27fd] mr-4 flex-shrink-0" />
              <p className="text-sm font-black text-[#160f29] leading-relaxed">For strict financial compliance, your National Identity Number (NIN) and Bank Verification Number (BVN) are required securely.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">Email Address</label>
                <input type="email" name="email" required className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-[#160f29] placeholder:text-gray-400 focus:ring-2 focus:ring-[#2a27fd]/30 focus:border-[#2a27fd] transition-all shadow-sm" placeholder="your.name@example.com" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">Create Password</label>
                <input type="password" name="password" required className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-[#160f29] placeholder:text-gray-400 focus:ring-2 focus:ring-[#2a27fd]/30 focus:border-[#2a27fd] transition-all shadow-sm" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">Confirm Password</label>
                <input type="password" required className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-[#160f29] placeholder:text-gray-400 focus:ring-2 focus:ring-[#2a27fd]/30 focus:border-[#2a27fd] transition-all shadow-sm" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">NIN Number</label>
                <input type="text" name="nin" required className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-mono font-black text-[#160f29] placeholder:text-gray-400 focus:ring-2 focus:ring-[#2a27fd]/30 focus:border-[#2a27fd] transition-all shadow-sm" placeholder="11-digit NIN" maxLength={11} />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">BVN Number</label>
                <input type="text" name="bvn" required className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-mono font-black text-[#160f29] placeholder:text-gray-400 focus:ring-2 focus:ring-[#2a27fd]/30 focus:border-[#2a27fd] transition-all shadow-sm" placeholder="11-digit BVN" maxLength={11} />
              </div>
            </div>
          </div>

          {/* STEP 3: Placement & Documents */}
          <div className={`transition-all duration-300 ${step === 3 ? 'block animate-in slide-in-from-right-4' : 'hidden'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-8">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">Branch Selection</label>
                <select name="branchId" required className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-[#160f29] focus:ring-2 focus:ring-[#2a27fd]/30 focus:border-[#2a27fd] transition-all shadow-sm">
                  <option value="br_1">Lagos Mainland HQ</option>
                  <option value="br_2">Victoria Island Branch</option>
                  <option value="br_3">Abuja Central</option>
                </select>
              </div>
              <div>
  <label className="block text-xs font-black uppercase tracking-widest text-[#160f29] mb-2">Requested Role / Department</label>
  <select name="role" required className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-[#160f29] focus:ring-2 focus:ring-[#2a27fd]/30 focus:border-[#2a27fd] transition-all shadow-sm">
    <option value="STAFF">Standard Employee (General)</option>
    <option value="HR">Human Resources (HR)</option>
    <option value="ADMIN">Branch Manager (Admin)</option>
    <option value="EXEC">Executive (Execo)</option>
    <option value="IT_DIGITAL">IT &amp; Digital</option>
    <option value="FINANCE_TREASURY">Finance / Treasury</option>
    <option value="LEGAL">Legal Department</option>
    <option value="OPERATIONS">Operations</option>
    <option value="COMPLIANCE">Compliance</option>
    <option value="MARKETING_COMMUNICATION">Marketing &amp; Communication</option>
    <option value="CREDIT_RISK">Credit Risk</option>
    <option value="AUDIT">Internal Audit</option>
    <option value="RECOVERY">Recovery Unit</option>
    <option value="CUSTOMER_EXPERIENCE">Customer Experience</option>
    <option value="SAVINGS_MOBILISATION">Savings Mobilisation</option>
    <option value="ENGINEERING">Core Engineering</option>
  </select>
</div>
            </div>

            <div className="space-y-4">
              <div className={`border-2 border-dashed rounded-2xl p-6 text-center relative transition-all ${cvName ? 'border-green-500 bg-green-50' : 'border-gray-400 hover:bg-gray-50'}`}>
                <input type="file" name="cvDocument" required onChange={(e) => setCvName(e.target.files?.[0]?.name || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.doc,.docx" />
                <Upload className={`w-8 h-8 mx-auto mb-3 ${cvName ? 'text-green-600' : 'text-[#160f29]'}`} />
                <p className="text-sm font-black text-[#160f29]">Upload Professional CV <span className="text-red-600">*</span></p>
                <p className="text-xs font-bold text-gray-600 mt-1">{cvName || 'Required: PDF or DOCX'}</p>
                {cvName && <CheckCircle2 className="w-6 h-6 text-green-600 absolute top-4 right-4" />}
              </div>

              <div className={`border-2 border-dashed rounded-2xl p-6 text-center relative transition-all ${avatarName ? 'border-green-500 bg-green-50' : 'border-gray-400 hover:bg-gray-50'}`}>
                <input type="file" name="avatarImage" onChange={(e) => setAvatarName(e.target.files?.[0]?.name || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                <User className={`w-8 h-8 mx-auto mb-3 ${avatarName ? 'text-green-600' : 'text-[#160f29]'}`} />
                <p className="text-sm font-black text-[#160f29]">Profile Picture (Optional)</p>
                <p className="text-xs font-bold text-gray-600 mt-1">{avatarName || 'PNG or JPG'}</p>
                {avatarName && <CheckCircle2 className="w-6 h-6 text-green-600 absolute top-4 right-4" />}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} disabled={isSubmitting} className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 text-[#160f29] border border-gray-300 rounded-xl text-sm font-black hover:bg-gray-200 disabled:opacity-50 transition-colors shadow-sm">
                Previous
              </button>
            ) : <div className="hidden sm:block"></div>}

            {step < 3 ? (
              <button type="button" onClick={() => setStep(step + 1)} className="w-full sm:w-auto px-8 py-3.5 bg-[#160f29] text-white rounded-xl text-sm font-black hover:bg-black flex items-center justify-center transition-all shadow-lg">
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting || !cvName} className="w-full sm:w-auto px-8 py-3.5 bg-[#ffbb00] text-[#160f29] rounded-xl text-sm font-black shadow-lg flex items-center justify-center disabled:opacity-50 transition-all hover:bg-[#ffd043] min-w-[220px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin text-[#160f29]" />
                    <span className="truncate">{uploadStatus}</span>
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="mt-8 text-center text-sm font-black text-[#160f29] uppercase tracking-widest">
        Already have an approved account? <Link href="/login" className="text-[#2a27fd] hover:text-[#1a18d0] transition-colors underline ml-1">Return to Login</Link>
      </div>
    </div>
  );
}