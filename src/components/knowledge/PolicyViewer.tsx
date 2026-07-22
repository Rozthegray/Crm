'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Shield, FileText, Plus, Save, Loader2, Search } from 'lucide-react';
import { getPolicies, publishPolicy } from '@/features/knowledge/actions';

export function PolicyViewer({ currentUser }: { currentUser: any }) {
  const [policies, setPolicies] = useState<any[]>([]);
  const [activePolicy, setActivePolicy] = useState<any | null>(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Composer State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('HR_GUIDELINES');

  const hasPublishClearance = ['HR', 'COMPLIANCE', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

  const loadPolicies = async () => {
    setIsLoading(true);
    const res = await getPolicies(activeCategory);
    if (res.success) {
      setPolicies(res.policies || []);
      if (res.policies && res.policies.length > 0 && !isComposing) {
        setActivePolicy(res.policies[0]);
      } else if (res.policies?.length === 0) {
        setActivePolicy(null);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => { loadPolicies(); }, [activeCategory]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return alert("Title and Content are required.");

    setIsSubmitting(true);
    const res = await publishPolicy(newTitle, newContent, newCategory);
    if (res.success) {
      setIsComposing(false);
      setNewTitle('');
      setNewContent('');
      setActiveCategory(newCategory); // Switch view to the new category
      loadPolicies();
    } else {
      alert(res.error);
    }
    setIsSubmitting(false);
  };

  const categories = [
    { id: 'ALL', label: 'All Documents' },
    { id: 'HR_GUIDELINES', label: 'HR Guidelines' },
    { id: 'IT_SECURITY', label: 'IT & Security' },
    { id: 'COMPLIANCE_AML', label: 'Compliance (AML)' },
    { id: 'BRANCH_OPERATIONS', label: 'Branch Operations' },
    { id: 'GENERAL', label: 'General' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col md:flex-row min-h-[700px]">
      
      {/* ========================================= */}
      {/* LEFT PANE: DIRECTORY INDEX                  */}
      {/* ========================================= */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-[#fcfcff] border-r border-gray-100 flex flex-col">
        <div className="p-6 bg-[#160f29] text-white">
          <h2 className="text-lg font-black flex items-center">
            <BookOpen className="w-5 h-5 mr-3 text-[#ffbb00]" /> 
            Knowledge Base
          </h2>
          <p className="text-white/60 text-[10px] font-bold mt-1 uppercase tracking-widest">
            Corporate Policies & Protocols
          </p>
        </div>

        {/* Directory Controls */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select 
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-[#160f29] focus:outline-none focus:border-[#2a27fd] appearance-none"
            >
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
            </select>
          </div>

          {hasPublishClearance && (
            <button 
              onClick={() => { setIsComposing(true); setActivePolicy(null); }}
              className="w-full py-2.5 bg-[#2a27fd]/10 hover:bg-[#2a27fd]/20 text-[#2a27fd] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" /> New Document
            </button>
          )}
        </div>

        {/* Document List */}
        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#2a27fd] animate-spin" /></div>
          ) : policies.length === 0 ? (
            <div className="text-center py-8 text-xs font-bold text-gray-400 uppercase tracking-widest">No documents found</div>
          ) : (
            policies.map(policy => (
              <button
                key={policy.id}
                onClick={() => { setIsComposing(false); setActivePolicy(policy); }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  activePolicy?.id === policy.id && !isComposing
                    ? 'bg-white border-[#2a27fd] shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start">
                  <FileText className={`w-4 h-4 mr-3 shrink-0 mt-0.5 ${activePolicy?.id === policy.id && !isComposing ? 'text-[#2a27fd]' : 'text-gray-400'}`} />
                  <div>
                    <h4 className="text-sm font-black text-[#160f29] leading-tight line-clamp-2">{policy.title}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      {new Date(policy.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* RIGHT PANE: DOCUMENT VIEWER / COMPOSER      */}
      {/* ========================================= */}
      <div className="w-full md:w-2/3 lg:w-3/4 bg-white flex flex-col h-full min-h-[500px]">
        
        {/* VIEW MODE */}
        {!isComposing && activePolicy && (
          <div className="animate-in fade-in h-full flex flex-col">
            <div className="p-8 md:p-10 border-b border-gray-100 flex justify-between items-start">
              <div>
                <span className="px-3 py-1 bg-gray-100 text-[#160f29] text-[10px] font-black uppercase tracking-widest rounded-md mb-4 inline-block">
                  {activePolicy.category.replace('_', ' ')}
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-[#160f29] mb-4">{activePolicy.title}</h1>
                <div className="flex items-center text-xs font-bold text-gray-500">
                  <Shield className="w-4 h-4 mr-2 text-green-600" />
                  Published by {activePolicy.author?.name} ({activePolicy.author?.role})
                </div>
              </div>
            </div>
            
            <div className="p-8 md:p-10 flex-grow overflow-y-auto">
              <div className="prose prose-sm max-w-none prose-headings:font-black prose-headings:text-[#160f29] prose-p:text-gray-700 prose-a:text-[#2a27fd] whitespace-pre-wrap font-medium leading-relaxed">
                {activePolicy.content}
              </div>
            </div>
          </div>
        )}

        {/* COMPOSE MODE */}
        {isComposing && (
          <form onSubmit={handlePublish} className="h-full flex flex-col animate-in slide-in-from-right-4">
            <div className="p-6 md:p-8 border-b border-gray-100 bg-[#fcfcff]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-[#160f29]">Draft Corporate Policy</h2>
                <button 
                  type="button" 
                  onClick={() => setIsComposing(false)}
                  className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-[#160f29]"
                >
                  Cancel
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#160f29]/60">Document Title</label>
                  <input 
                    type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Q3 AML Compliance Update"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black focus:border-[#2a27fd] transition-all outline-none" required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#160f29]/60">Category</label>
                  <select 
                    value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black focus:border-[#2a27fd] transition-all outline-none"
                  >
                    {categories.filter(c => c.id !== 'ALL').map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-grow p-6 md:p-8 flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#160f29]/60 mb-2">Markdown Content</label>
              <textarea 
                value={newContent} onChange={(e) => setNewContent(e.target.value)}
                placeholder="Use Markdown to format your policy document...&#10;&#10;## Section 1&#10;**Bold text** and *italics*."
                className="w-full flex-grow px-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-mono text-gray-800 focus:border-[#2a27fd] focus:bg-white transition-all outline-none resize-none" required
              />
              
              <div className="mt-6 flex justify-end">
                <button 
                  type="submit" disabled={isSubmitting}
                  className="px-8 py-3.5 bg-[#2a27fd] hover:bg-[#1a18d0] text-white rounded-xl text-sm font-black uppercase tracking-wider flex items-center shadow-lg shadow-[#2a27fd]/30 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />} 
                  Publish to Network
                </button>
              </div>
            </div>
          </form>
        )}

        {/* EMPTY STATE */}
        {!isComposing && !activePolicy && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center text-gray-400">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-lg font-black text-[#160f29]">No Document Selected</h3>
            <p className="text-sm font-bold mt-2">Select a policy from the directory to view its contents.</p>
          </div>
        )}

      </div>
    </div>
  );
}