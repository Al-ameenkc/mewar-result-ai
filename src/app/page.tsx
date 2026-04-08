"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowRight, BookOpen, GraduationCap, Building2, Calendar,
  School, ArrowLeft, LayoutDashboard, Users, FileText, 
  Settings, HelpCircle, ChevronDown, Download, Plus, TrendingUp, 
  TrendingDown, MoreHorizontal, BrainCircuit, UserCheck, AlertCircle,
  Mail, Lock, X
} from 'lucide-react';

// --- Types ---
type Step = 'faculty' | 'department' | 'level' | 'semester' | 'assessment-type' | 'input-scores' | 'analyzing';

type Course = {
  id: string;
  faculty: string;
  department: string;
  level: string;
  semester: string;
  code: string;
  title: string;
  units: number;
};

// --- Structural Data ---
const MIU_DATA = {
  faculties: ['Computing', 'Sciences', 'Management', 'Law'],
  departments: {
    'Computing': ['Software Engineering', 'Cyber Security', 'Computer Science'],
    'Sciences': ['Biotechnology', 'Industrial Chemistry', 'Physics with Electronics'],
    'Management': ['Accounting', 'Public Administration', 'Economics', 'Entrepreneurship', 'Banking and Finance', 'International Relations', 'Political Science', 'Sociology', 'Procurement Management'],
    'Law': ['Commercial Law', 'Islamic Law', 'International Law'],
  },
  levels: [100, 200, 300, 400],
  semesters: [1, 2],
};

export default function ModernChatBoard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('faculty');
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selections, setSelections] = useState({
    faculty: '', department: '', level: '', semester: '', assessmentType: ''
  });
  const [scores, setScores] = useState<Record<string, number>>({});
  
  // Auth & Session States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const saved = localStorage.getItem('miu_courses');
    if (saved) {
      setAllCourses(JSON.parse(saved));
    }
    // Check if user was previously logged in
    const user = localStorage.getItem('miu_user_session');
    if (user) setIsLoggedIn(true);
  }, []);

  const handleSelection = (field: keyof typeof selections, value: string | number) => {
    setSelections(prev => ({ ...prev, [field]: value.toString() }));
    if (field === 'faculty') setStep('department');
    if (field === 'department') setStep('level');
    if (field === 'level') setStep('semester');
    if (field === 'semester') setStep('assessment-type');
    if (field === 'assessmentType') setStep('input-scores');
  };

  const handleScoreChange = (code: string, val: string) => {
    const numericValue = parseInt(val) || 0;
    setScores(prev => ({ ...prev, [code]: numericValue }));
  };

  const goBack = () => {
    switch (step) {
      case 'department': setStep('faculty'); break;
      case 'level': setStep('department'); break;
      case 'semester': setStep('level'); break;
      case 'assessment-type': setStep('semester'); break;
      case 'input-scores': setStep('assessment-type'); break;
      default: break;
    }
  };

  const executeAnalysis = () => {
    const sessionData = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      faculty: selections.faculty,
      department: selections.department,
      level: selections.level,
      semester: selections.semester,
      assessmentType: selections.assessmentType,
      scores: scores,
      courses: filteredCourses.map(c => ({
        code: c.code,
        title: c.title,
        units: Number(c.units)
      }))
    };

    localStorage.setItem('miu_current_session', JSON.stringify(sessionData));
    const existingHistory = JSON.parse(localStorage.getItem('miu_analysis_history') || '[]');
    localStorage.setItem('miu_analysis_history', JSON.stringify([sessionData, ...existingHistory]));

    setIsAuthOpen(false);
    setStep('analyzing');
    setTimeout(() => {
      router.push('/analytics');
    }, 2500);
  };

  const startAnalysis = () => {
    if (!isLoggedIn) {
      setAuthMode('login');
      setIsAuthOpen(true);
      return;
    }
    executeAnalysis();
  };

  const handleMockAuth = () => {
    // Simulate successful login/signup
    setIsLoggedIn(true);
    localStorage.setItem('miu_user_session', 'active');
    
    // If they were in the middle of generating a prediction, continue
    if (step === 'input-scores') {
      executeAnalysis();
    } else {
      setIsAuthOpen(false);
    }
  };

  const getAssessmentConfig = () => {
    switch (selections.assessmentType) {
      case 'CA': return { max: 40, label: '/ 40' };
      case 'Attendance': return { max: 100, label: '/ 100%' };
      default: return { max: 100, label: '/ 100' };
    }
  };

  const { max: currentMax, label: currentLabel } = getAssessmentConfig();

  const filteredCourses = allCourses.filter(c => 
    c.faculty === selections.faculty &&
    c.department === selections.department &&
    c.level === selections.level &&
    c.semester === selections.semester
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] relative overflow-hidden font-sans text-gray-900 pb-20">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-3xl mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[60%] bg-indigo-50/50 rounded-full blur-3xl mix-blend-multiply" />
      </div>

      {/* --- AUTH MODAL --- */}
      <AnimatePresence>
        {isAuthOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              <button 
                onClick={() => setIsAuthOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X size={20} />
              </button>

              <div className="p-8">
                <div className="flex flex-col items-center mb-8">
                  <div className="bg-black text-white p-2.5 rounded-xl mb-4 shadow-lg shadow-black/10">
                    <School size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {authMode === 'login' ? 'Login to access your MIU AI dashboard' : 'Join MIU AI for smart academic insights'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="email" 
                        placeholder="name@example.com"
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleMockAuth}
                    className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/5 mt-2"
                  >
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Or continue with</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleMockAuth} className="flex items-center justify-center gap-2 border border-gray-100 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" /> Google
                    </button>
                    <button onClick={handleMockAuth} className="flex items-center justify-center gap-2 border border-gray-100 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium">
                      <img src="https://www.svgrepo.com/show/511330/apple-173.svg" className="w-4 h-4" alt="Apple" /> Apple
                    </button>
                  </div>
                </div>

                <p className="text-center text-sm text-gray-500 mt-8">
                  {authMode === 'login' ? "Don't have an account?" : "Already have an account?"} {' '}
                  <button 
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-black font-bold hover:underline"
                  >
                    {authMode === 'login' ? 'Sign up' : 'Log in'}
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div 
          className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer" 
          onClick={() => router.push('/')}
        >
          <div className="bg-black text-white p-1.5 rounded-md"><School size={18} /></div>
          MIU AI
        </div>
        <div className="hidden md:flex items-center bg-white rounded-full p-1.5 shadow-sm border border-gray-100">
          <button 
            onClick={() => router.push('/')} 
            className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium transition-all"
          >
            Home
          </button>
          <button 
            onClick={() => router.push('/history')} 
            className="text-gray-500 hover:text-black px-6 py-2 rounded-full text-sm font-medium transition-all"
          >
            History
          </button>
        </div>
        {!isLoggedIn ? (
          <button 
            onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }}
            className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-md"
          >
            Login
          </button>
        ) : (
          <div className="flex items-center gap-3">
             <button 
              onClick={() => { setIsLoggedIn(false); localStorage.removeItem('miu_user_session'); }}
              className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
            >
              Logout
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm border-2 border-white">
              KA
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-16 flex flex-col items-center">
        <div className="bg-white border border-gray-100 shadow-sm px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold text-gray-600 mb-8">
          <Sparkles size={14} className="text-blue-500" /> Mewar International University Analytics
        </div>

        <h1 className="text-5xl md:text-6xl font-medium text-center tracking-tight mb-4 text-gray-900">
          Predict Results Instantly <br /> with <span className="font-bold">AI Analysis</span>
        </h1>
        <p className="text-gray-500 text-center max-w-xl mb-12 text-sm md:text-base leading-relaxed">
          Provide your academic details, and our AI will process your historical data to predict future performance and identify at-risk trends.
        </p>

        <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
          <AnimatePresence mode="wait">
            {step !== 'input-scores' && step !== 'analyzing' && (
              <motion.div key="prompt-text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 text-gray-400">
                  {step !== 'faculty' && (
                    <button onClick={goBack} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors border border-gray-100" title="Go Back">
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Sparkles size={16} /></div>
                  <span className="text-sm">
                    {step === 'faculty' && "Select your Faculty to begin..."}
                    {step === 'department' && `Choose your Department in ${selections.faculty}...`}
                    {step === 'level' && "What is your current academic level?"}
                    {step === 'semester' && "Which semester's results are we analyzing?"}
                    {step === 'assessment-type' && "What type of assessment are we analyzing?"}
                  </span>
                </div>
                <div className="flex gap-2">
                  {selections.faculty && <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-600 truncate max-w-[80px]">{selections.faculty}</span>}
                  {selections.department && <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-600 truncate max-w-[80px]">{selections.department}</span>}
                  {selections.assessmentType && <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-600 truncate max-w-[80px]">{selections.assessmentType}</span>}
                </div>
              </motion.div>
            )}

            {step === 'input-scores' && (
              <motion.div key="score-form" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={goBack} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors border border-gray-100"><ArrowLeft size={16} /></button>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Enter {selections.assessmentType} Scores</h3>
                    <p className="text-xs text-gray-400">{selections.department} • Level {selections.level} • Semester {selections.semester} • {selections.assessmentType}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6 max-h-[350px] overflow-y-auto pr-1">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-semibold text-sm text-gray-700">{course.code}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">{course.title} ({course.units} Units)</p>
                        </div>
                        <input 
                          type="number" 
                          max={currentMax}
                          placeholder={currentLabel} 
                          onChange={(e) => handleScoreChange(course.code, e.target.value)} 
                          className="w-[72px] h-10 p-2 text-center text-sm font-bold bg-white border border-gray-200 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" 
                        />
                      </div>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                      <AlertCircle className="text-amber-400 mb-2" size={24} />
                      <p className="text-sm font-bold text-gray-700">No Courses Registered</p>
                    </div>
                  )}
                </div>

                {filteredCourses.length > 0 && (
                  <button onClick={startAnalysis} className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all">
                    <Sparkles size={16} /> Generate Prediction
                  </button>
                )}
              </motion.div>
            )}

            {step === 'analyzing' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12">
                <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
                  <Sparkles size={20} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">Analyzing historical data & predicting performance...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step !== 'input-scores' && step !== 'analyzing' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl px-4">
            <AnimatePresence mode="popLayout">
              {(() => {
                if (step === 'faculty') return MIU_DATA.faculties.map(f => ({ label: f, icon: <Building2 className="w-5 h-5 text-gray-400" />, value: f, type: 'faculty' }));
                if (step === 'department') return (MIU_DATA.departments[selections.faculty as keyof typeof MIU_DATA.departments] || []).map(d => ({ label: d, icon: <BookOpen className="w-5 h-5 text-gray-400" />, value: d, type: 'department' }));
                if (step === 'level') return MIU_DATA.levels.map(l => ({ label: `${l} Level`, icon: <GraduationCap className="w-5 h-5 text-gray-400" />, value: l, type: 'level' }));
                if (step === 'semester') return MIU_DATA.semesters.map(s => ({ label: `Semester ${s}`, icon: <Calendar className="w-5 h-5 text-gray-400" />, value: s, type: 'semester' }));
                if (step === 'assessment-type') return [
                  { label: 'Exams (/100)', icon: <FileText className="w-5 h-5 text-gray-400" />, value: 'Exams', type: 'assessmentType' },
                  { label: 'CA (/40)', icon: <LayoutDashboard className="w-5 h-5 text-gray-400" />, value: 'CA', type: 'assessmentType' },
                  { label: 'Attendance (%)', icon: <UserCheck className="w-5 h-5 text-gray-400" />, value: 'Attendance', type: 'assessmentType' }
                ];
                return [];
              })().map((opt, idx) => (
                <motion.button key={opt.value} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.05 }} onClick={() => handleSelection(opt.type as keyof typeof selections, opt.value)} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all text-left flex flex-col justify-between h-28 group">
                  <div>
                    <span className="text-[10px] text-gray-400 font-medium mb-1 block">Select</span>
                    <p className="text-sm font-semibold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">{opt.label}</p>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    {opt.icon}
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}