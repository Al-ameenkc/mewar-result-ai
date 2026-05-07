'use client';

import React, { useState } from 'react';
import { verifyAdminKey } from './actions';
import { Lock, ArrowRight, Loader2, School } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLoginForm() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await verifyAdminKey(key);
      if (res.success) {
        router.refresh(); // Refresh to trigger layout cookie check
      } else {
        setError(res.error || 'Access denied');
      }
    } catch (err) {
      setError('An error occurred verifying the key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 selection:bg-black selection:text-white">
      <div className="max-w-sm w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10 mb-4">
            <School size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Security Clearance Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter administrative key"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-gray-900"
              />
            </div>
          </div>
          
          {error && <p className="text-red-500 font-semibold text-xs text-center">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/5 flex items-center justify-center gap-2 disabled:opacity-70 group"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Authenticate'}
            {!loading && <ArrowRight size={16} className="text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />}
          </button>
        </form>
      </div>
    </div>
  );
}
