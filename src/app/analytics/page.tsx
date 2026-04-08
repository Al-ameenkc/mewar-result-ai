"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  Target, 
  BookOpen, 
  AlertCircle, 
  Download, 
  BrainCircuit, 
  Activity, 
  PieChart as PieIcon 
} from 'lucide-react';

// --- Types ---
type SessionData = {
  faculty: string;
  department: string;
  level: string;
  semester: string;
  assessmentType: string;
  scores: Record<string, number>;
  courses: Array<{
    code: string;
    title: string;
    units: number;
  }>;
};

export default function PersonalAnalytics() {
  const router = useRouter();
  const [data, setData] = useState<SessionData | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('miu_current_session');
    if (session) {
      setData(JSON.parse(session));
    }
  }, []);

  const calculateMetrics = () => {
    if (!data) return { gpa: "0.00", standing: "N/A", riskCourse: "None", strength: "None", totalUnits: 0 };

    let totalPoints = 0;
    let totalUnits = 0;
    let lowestScore = 101;
    let highestScore = -1;
    let riskCourse = "";
    let strength = "";

    data.courses.forEach(course => {
      const score = data.scores[course.code] || 0;
      totalUnits += Number(course.units);

      let points = 0;
      const normalizedScore = data.assessmentType === 'CA' ? (score / 40) * 100 : 
                              data.assessmentType === 'Attendance' ? (score / 10) * 100 : score;

      if (normalizedScore >= 70) points = 5;
      else if (normalizedScore >= 60) points = 4;
      else if (normalizedScore >= 50) points = 3;
      else if (normalizedScore >= 45) points = 2;
      else if (normalizedScore >= 40) points = 1;

      totalPoints += (points * Number(course.units));

      if (score < lowestScore) {
        lowestScore = score;
        riskCourse = course.code;
      }
      if (score > highestScore) {
        highestScore = score;
        strength = course.code;
      }
    });

    const gpa = totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : "0.00";
    
    let standing = "Pass";
    if (Number(gpa) >= 4.5) standing = "First Class";
    else if (Number(gpa) >= 3.5) standing = "Second Class Upper";
    else if (Number(gpa) >= 2.4) standing = "Second Class Lower";

    return { gpa, standing, riskCourse, strength, totalUnits };
  };

  const metrics = calculateMetrics();

  const getPieSlices = () => {
    if (!data || metrics.totalUnits === 0) return [];
    let cumulativePercent = 0;
    return data.courses.map((course, i) => {
      const percent = (course.units / metrics.totalUnits) * 100;
      const startPercent = cumulativePercent;
      cumulativePercent += percent;
      
      const x1 = Math.cos(2 * Math.PI * (startPercent / 100));
      const y1 = Math.sin(2 * Math.PI * (startPercent / 100));
      const x2 = Math.cos(2 * Math.PI * (cumulativePercent / 100));
      const y2 = Math.sin(2 * Math.PI * (cumulativePercent / 100));
      
      const largeArcFlag = percent > 50 ? 1 : 0;
      const pathData = `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      
      const colors = ['#000000', '#374151', '#6b7280', '#9ca3af', '#1f2937', '#4b5563'];
      return { path: pathData, color: colors[i % colors.length], code: course.code };
    });
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

  const assessmentMax = data.assessmentType === 'CA' ? 40 : (data.assessmentType === 'Attendance' ? 10 : 100);

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
                {data.department} • Level {data.level} • {data.assessmentType}
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-black rounded-full text-sm font-medium text-white hover:bg-gray-800 transition-all shadow-lg shadow-black/5">
            <Download size={16} />
            Export Report
          </button>
        </header>

        {/* HERO SECTION */}
        <section className="bg-white p-8 md:p-10 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center relative z-10">
            <div className="flex flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-gray-100 pb-8 md:pb-0 md:pr-12">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <BrainCircuit size={18} />
                <h2 className="text-xs font-bold uppercase tracking-wider">Projected GPA</h2>
              </div>
              <div className="text-7xl font-bold text-gray-900 tracking-tighter mb-3">{metrics.gpa}</div>
              <div className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[11px] font-semibold tracking-wide">{metrics.standing}</div>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-amber-500" /> AI Diagnostic Summary
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-6 text-lg">
                Your performance in <span className="text-gray-900 font-bold">{data.assessmentType}</span> suggests a <span className="text-gray-900 font-bold">{metrics.standing}</span> trajectory. 
                Pay closer attention to <span className="text-gray-900 font-bold">{metrics.riskCourse}</span> to elevate your results.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                  <Target size={16} className="text-blue-600" />
                  <span className="text-xs font-semibold text-gray-700">Focus: {metrics.riskCourse}</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                  <TrendingUp size={16} className="text-green-600" />
                  <span className="text-xs font-semibold text-gray-700">Strength: {metrics.strength}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHARTS GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COURSE BREAKDOWN: Fixed Bar Visibility */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Course Breakdown</h3>
              <BookOpen size={16} className="text-gray-300" />
            </div>
            <div className="flex items-end justify-between h-40 gap-2">
              {data.courses.map((course, idx) => {
                const score = data.scores[course.code] || 0;
                const percentage = Math.min((score / assessmentMax) * 100, 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full">
                    <div className="w-full h-32 bg-gray-50 rounded-md relative overflow-hidden flex flex-col justify-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${percentage}%` }}
                        transition={{ duration: 1, delay: idx * 0.05 }}
                        className={`w-full ${score < (assessmentMax * 0.5) ? 'bg-amber-400' : 'bg-black'}`}
                      />
                    </div>
                    <span className="text-[8px] font-bold text-gray-400 truncate w-full text-center">{course.code}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PERFORMANCE PROFILE: Tightened Labels */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Performance Profile</h3>
              <Activity size={16} className="text-gray-300" />
            </div>
            <div className="w-full relative">
              <div className="h-40 w-full">
                <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="blackFade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#000000" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path 
                    d={`M 0 50 ${data.courses.map((c, i) => {
                      const divisor = data.courses.length > 1 ? data.courses.length - 1 : 1;
                      const x = (i / divisor) * 100;
                      const y = 50 - ((data.scores[c.code] || 0) / assessmentMax) * 50;
                      return `L ${x} ${y}`;
                    }).join(' ')} L 100 50 Z`}
                    fill="url(#blackFade)"
                  />
                  <path 
                    d={data.courses.map((c, i) => {
                      const divisor = data.courses.length > 1 ? data.courses.length - 1 : 1;
                      const x = (i / divisor) * 100;
                      const y = 50 - ((data.scores[c.code] || 0) / assessmentMax) * 50;
                      return (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
                    }).join(' ')}
                    fill="none" stroke="#000000" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"
                  />
                  {data.courses.map((c, i) => {
                     const divisor = data.courses.length > 1 ? data.courses.length - 1 : 1;
                     return (
                      <circle 
                        key={i} 
                        cx={(i / divisor) * 100} 
                        cy={50 - ((data.scores[c.code] || 0) / assessmentMax) * 50} 
                        r="0.8" fill="white" stroke="#000000" strokeWidth="0.8"
                      />
                    )
                  })}
                </svg>
              </div>
              <div className="flex justify-between mt-1 px-0.5">
                {data.courses.map((c, i) => (
                  <span key={i} className="text-[8px] font-bold text-gray-400">
                    {c.code}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CREDIT LOAD: Slim Donut */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Credit Load</h3>
              <PieIcon size={16} className="text-gray-300" />
            </div>
            <div className="flex items-center justify-center h-32 relative">
              <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-28 h-28 -rotate-90">
                {getPieSlices().map((slice, i) => (
                  <path key={i} d={slice.path} fill={slice.color} />
                ))}
                <circle cx="0" cy="0" r="0.9" fill="white" /> 
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-bold text-gray-900">{metrics.totalUnits}</span>
                <span className="text-[9px] font-medium text-gray-400">Units</span>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {data.courses.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[9px] font-semibold text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getPieSlices()[i]?.color }}></div>
                  {c.code}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SCORECARD TABLE */}
        <section className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden p-8">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-6">Detailed Scorecard</h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="pb-4">Course Code</th>
                  <th className="pb-4">Course Title</th>
                  <th className="pb-4 text-center">Units</th>
                  <th className="pb-4 text-center">Score</th>
                  <th className="pb-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-gray-700">
                {data.courses.map((course, idx) => {
                  const score = data.scores[course.code] || 0;
                  const isRisk = score < (assessmentMax * 0.5);
                  return (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 font-mono text-xs font-semibold">{course.code}</td>
                      <td className="py-5">{course.title}</td>
                      <td className="py-5 text-center">{course.units}</td>
                      <td className="py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isRisk ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-700'}`}>
                          {score}/{assessmentMax}
                        </span>
                      </td>
                      <td className={`py-5 text-right text-[11px] font-bold tracking-wide ${isRisk ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {isRisk ? 'IMPROVEMENT NEEDED' : 'OPTIMAL'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}