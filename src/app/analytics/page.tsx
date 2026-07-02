"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Sparkles, AlertCircle, Download, PieChart as PieIcon, BarChart3, Activity
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { SessionData } from '@/types/academic';

export default function PersonalAnalytics() {
  const router = useRouter();
  const [data, setData] = useState<SessionData | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/?login=required');
        return;
      }

      const stored = localStorage.getItem('miu_current_session');
      if (!stored) {
        router.replace('/');
        return;
      }

      const parsed = JSON.parse(stored) as SessionData;
      const hasEmpty = parsed.courses.some(
        (c) => c.caScore === null || c.caScore === undefined || c.examScore === null || c.examScore === undefined
      );
      if (hasEmpty) {
        router.replace('/');
        return;
      }
      setData(parsed);
    };

    loadSession();
  }, [router, supabase]);

  const exportPDF = () => {
    window.print();
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white border border-gray-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="text-gray-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">No Analysis Data</h2>
        <p className="text-gray-500 max-w-xs mt-2 text-sm leading-relaxed">Please complete an assessment prediction on the home page first.</p>
        <button onClick={() => router.push('/')} className="mt-6 px-8 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-md">Return Home</button>
      </div>
    );
  }

  const analysis = data.aiAnalysis;
  const chartColors = ['#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#db2777', '#0891b2', '#dc2626', '#4f46e5'];
  const letterGrade = (percent: number) => {
    if (percent >= 70) return 'A';
    if (percent >= 60) return 'B';
    if (percent >= 50) return 'C';
    if (percent >= 45) return 'D';
    if (percent >= 40) return 'E';
    return 'F';
  };

  const renderCharts = (title: string, percentages: number[], labels: string[]) => {
    const safePercentages = percentages.map((p) => Math.max(0, Math.min(100, p)));
    const total = Math.max(1, safePercentages.reduce((sum, p) => sum + p, 0));
    let cumulative = 0;
    const pieSlices = safePercentages.map((value, idx) => {
      const part = (value / total) * 100;
      const start = cumulative;
      cumulative += part;
      const x1 = Math.cos(2 * Math.PI * (start / 100));
      const y1 = Math.sin(2 * Math.PI * (start / 100));
      const x2 = Math.cos(2 * Math.PI * (cumulative / 100));
      const y2 = Math.sin(2 * Math.PI * (cumulative / 100));
      const largeArcFlag = part > 50 ? 1 : 0;
      return {
        d: `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
        color: chartColors[idx % chartColors.length],
      };
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><PieIcon size={14}/> {title} Pie</div>
          <div className="h-36 flex items-center justify-center">
            <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-28 h-28 -rotate-90">
              {pieSlices.map((slice, i) => <path key={`pie-${i}`} d={slice.d} fill={slice.color} />)}
              <circle cx="0" cy="0" r="0.58" fill="white" />
            </svg>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><BarChart3 size={14}/> {title} Bars</div>
          <div className="h-36 flex items-end gap-2">
            {safePercentages.map((value, i) => (
              <div key={`bar-${i}`} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-white rounded-md border border-gray-100 h-28 flex items-end overflow-hidden">
                  <div className="w-full rounded-t-md" style={{ height: `${value}%`, backgroundColor: chartColors[i % chartColors.length] }} />
                </div>
                <span className="text-[9px] text-gray-500 mt-1 truncate w-full text-center">{labels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Activity size={14}/> {title} Trend</div>
          <div className="h-36">
            <svg viewBox="0 0 100 50" className="w-full h-full">
              <polyline
                fill="none"
                stroke="#111827"
                strokeWidth="1.2"
                points={safePercentages.map((v, i) => {
                  const x = safePercentages.length > 1 ? (i / (safePercentages.length - 1)) * 100 : 50;
                  const y = 50 - (v / 100) * 50;
                  return `${x},${y}`;
                }).join(' ')}
              />
              {safePercentages.map((v, i) => {
                const x = safePercentages.length > 1 ? (i / (safePercentages.length - 1)) * 100 : 50;
                const y = 50 - (v / 100) * 50;
                return <circle key={`pt-${i}`} cx={x} cy={y} r="1.2" fill={chartColors[i % chartColors.length]} />;
              })}
            </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900 p-6 md:p-12 relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-3xl mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[60%] bg-indigo-50/50 rounded-full blur-3xl mix-blend-multiply" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analysis Report</h1>
              <p className="text-sm text-gray-500 mt-1">
                {data.department} • Level {data.level} • Semester {data.semester}
              </p>
            </div>
          </div>
          <button onClick={exportPDF} className="print:hidden flex items-center gap-2 px-6 py-3 bg-black rounded-full text-sm font-medium text-white hover:bg-gray-800 transition-all shadow-lg shadow-black/5">
            <Download size={16} />
            Export Report
          </button>
        </header>

        <div id="analytics-report-capture" className="space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-3">CA Analytics</h2>
            <p className="text-sm text-gray-600 mb-2">{analysis?.caAnalysis?.diagnosticSummary}</p>
            <div className="text-xs text-gray-700">Average: {analysis?.caAnalysis?.average}%</div>
            <div className="text-xs text-gray-700">Needs improvement: {(analysis?.caAnalysis?.improvementCourses ?? []).join(', ') || 'None'}</div>
            <div className="text-xs text-gray-700">Strengths: {(analysis?.caAnalysis?.strengthCourses ?? []).join(', ') || 'None'}</div>
            {renderCharts('CA', data.courses.map((c) => Number(c.caPercentage ?? 0)), data.courses.map((c) => c.code))}
          </section>

          <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-3">Exam Analytics</h2>
            <p className="text-sm text-gray-600 mb-2">{analysis?.examAnalysis?.diagnosticSummary}</p>
            <div className="text-xs text-gray-700">Average: {analysis?.examAnalysis?.average}%</div>
            <div className="text-xs text-gray-700">Needs improvement: {(analysis?.examAnalysis?.improvementCourses ?? []).join(', ') || 'None'}</div>
            <div className="text-xs text-gray-700">Strengths: {(analysis?.examAnalysis?.strengthCourses ?? []).join(', ') || 'None'}</div>
            {renderCharts('Exam', data.courses.map((c) => Number(c.examPercentage ?? 0)), data.courses.map((c) => c.code))}
          </section>

          <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-3">Total Analytics</h2>
            <div className="mb-2 text-sm"><span className="font-semibold">CPG:</span> {analysis?.totalAnalysis?.currentGpa}</div>
            <div className="mb-2 text-sm"><span className="font-semibold">Standing:</span> {analysis?.totalAnalysis?.standing}</div>
            <p className="text-sm text-gray-600 mb-2">{analysis?.totalAnalysis?.diagnosticSummary}</p>
            <div className="text-xs text-gray-700 mb-1">Needs improvement: {(analysis?.totalAnalysis?.improvementCourses ?? []).join(', ') || 'None'}</div>
            <div className="text-xs text-gray-700 mb-2">Strengths: {(analysis?.totalAnalysis?.strengthCourses ?? []).join(', ') || 'None'}</div>
            <div className="text-xs text-gray-700 mb-2">Study tips: {(analysis?.totalAnalysis?.studyTips ?? []).join(' | ')}</div>
            <div className="text-xs text-blue-700"><span className="font-semibold">Next Semester Prediction:</span> {analysis?.totalAnalysis?.nextSemesterPrediction}</div>
            {renderCharts('Total', data.courses.map((c) => Number(c.totalPercentage ?? 0)), data.courses.map((c) => c.code))}
          </section>

          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-4">Detailed Scorecard</h3>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                    <th className="pb-3">Course</th>
                    <th className="pb-3 text-center">Units</th>
                    <th className="pb-3 text-center">Score</th>
                    <th className="pb-3 text-center">Grade</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-gray-700">
                  {data.courses.map((course) => (
                    <tr key={course.code} className="border-b border-gray-50">
                      <td className="py-4">
                        <div className="font-semibold text-gray-900">{course.code}</div>
                        <div className="text-xs text-gray-500">{course.title}</div>
                      </td>
                      <td className="py-4 text-center">{course.units}</td>
                      <td className="py-4 text-center">
                        <div className="font-semibold text-gray-800">{course.totalScore ?? 0}/{course.totalMax ?? 100}</div>
                      </td>
                      <td className="py-4 text-center font-semibold">{letterGrade(Number(course.totalPercentage ?? 0))}</td>
                      <td className="py-4 text-center">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${['A', 'B'].includes(letterGrade(Number(course.totalPercentage ?? 0))) ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {['A', 'B'].includes(letterGrade(Number(course.totalPercentage ?? 0))) ? 'Good' : 'Improve'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}