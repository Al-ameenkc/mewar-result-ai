"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, School, Clock, ChevronRight, 
  Trash2, BrainCircuit, Calendar, FileText, Loader2
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type HistoryItem = {
  id: string;
  date: string;
  faculty: string;
  department: string;
  level: string;
  semester: string;
  assessmentType: string;
  scores: Record<string, number>;
  courses: Array<{ code: string; title: string; units: number }>;
};

const HISTORY_CACHE_TTL_MS = 1000 * 60 * 2;

export default function AnalysisHistory() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setIsLoggedIn(true);
        const userCacheKey = `miu_history_cache_${session.user.id}`;
        const cachedRaw = localStorage.getItem(userCacheKey);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as { ts: number; data: HistoryItem[] };
            if (Date.now() - cached.ts < HISTORY_CACHE_TTL_MS && Array.isArray(cached.data)) {
              setHistory(cached.data);
              setLoading(false);
            }
          } catch {
            localStorage.removeItem(userCacheKey);
          }
        }

        const { data, error } = await supabase
          .from('analysis_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (!error && data) {
          // Map DB columns back to frontend shape
          const formatted = data.map(dbItem => ({
            id: dbItem.id,
            date: new Date(dbItem.created_at).toLocaleDateString(),
            faculty: dbItem.faculty,
            department: dbItem.department,
            level: dbItem.level,
            semester: dbItem.semester,
            assessmentType: dbItem.assessment_type,
            scores: dbItem.scores,
            courses: dbItem.courses
          }));
          setHistory(formatted);
          localStorage.setItem(userCacheKey, JSON.stringify({ ts: Date.now(), data: formatted }));
        } else {
          setHistory([]);
        }
      } else {
        setIsLoggedIn(false);
        setHistory([]);
      }
      setLoading(false);
    };
    
    fetchHistory();
  }, []);

  const viewAnalysis = (item: HistoryItem) => {
    localStorage.setItem('miu_current_session', JSON.stringify(item));
    router.push('/analytics');
  };

  const deleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Optimistic UI update
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);

    // Delete from Supabase
    await supabase.from('analysis_sessions').delete().eq('id', id);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 md:p-12 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-3xl mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[60%] bg-indigo-50/50 rounded-full blur-3xl mix-blend-multiply" />
      </div>

      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/')}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analysis History</h1>
              <p className="text-sm text-gray-500 mt-1">
                Your past AI predictions and reports
              </p>
            </div>
          </div>
          <div className="bg-black text-white p-2.5 rounded-xl shadow-lg shadow-black/10">
            <School size={24} />
          </div>
        </header>

        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item) => (
              <div 
                key={item.id}
                onClick={() => viewAnalysis(item)}
                className="group bg-white p-6 rounded-[24px] border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-black group-hover:text-white transition-all">
                    <BrainCircuit size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 leading-tight">{item.department}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        <Calendar size={13} className="text-gray-400" /> {item.date}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        <FileText size={13} /> {item.assessmentType}
                      </span>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Level {item.level} • Sem {item.semester}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button 
                    onClick={(e) => deleteHistory(item.id, e)}
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    title="Delete Record"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:translate-x-1 transition-all border border-gray-100">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : loading ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-dashed border-gray-200 p-20 flex flex-col items-center text-center shadow-sm">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
               <Loader2 size={32} className="text-blue-500 animate-spin" />
             </div>
             <h2 className="text-xl font-semibold text-gray-900">Fetching History</h2>
             <p className="text-gray-500 text-sm mt-2 max-w-sm leading-relaxed">
               Loading your past AI predictions and analysis reports.
             </p>
          </div>
        ) : !isLoggedIn ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-dashed border-gray-200 p-20 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Clock size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Login Required</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-sm leading-relaxed">
              Please login to view your personal analysis history.
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-8 px-8 py-3 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
            >
              Go to Home
            </button>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-dashed border-gray-200 p-20 flex flex-col items-center text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Clock size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">No History Yet</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-sm leading-relaxed">
              Perform your first AI assessment to see your performance trajectory and analytics here.
            </p>
            <button 
              onClick={() => router.push('/')}
              className="mt-8 px-8 py-3 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
            >
              Start New Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}