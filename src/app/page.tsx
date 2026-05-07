"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowRight, BookOpen, GraduationCap, Building2, Calendar,
  School, ArrowLeft, FileText, Mail, Lock, X, Loader2, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { generateAIAnalysis } from '@/app/actions/analysis';

// --- Types ---
type Step = 'faculty' | 'department' | 'level' | 'semester' | 'input-scores' | 'analyzing';

type Course = {
  id: string;
  faculty: string;
  department: string;
  level: string;
  semester: string;
  code: string;
  title: string;
  units: number;
  max_exam: number;
  max_ca: number;
  max_attendance: number;
};
type ScoreEntry = { ca: number | null; exam: number | null };

const COURSES_CACHE_KEY = 'miu_courses_cache_v1';
const COURSES_CACHE_TTL_MS = 1000 * 60 * 5;

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
    faculty: '', department: '', level: '', semester: ''
  });
  const [scores, setScores] = useState<Record<string, ScoreEntry>>({});
  
  // Auth & Session States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchCourses = async () => {
      const cachedRaw = localStorage.getItem(COURSES_CACHE_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as { ts: number; data: Course[] };
          if (Date.now() - cached.ts < COURSES_CACHE_TTL_MS && Array.isArray(cached.data)) {
            setAllCourses(cached.data);
          }
        } catch {
          localStorage.removeItem(COURSES_CACHE_KEY);
        }
      }

      const { data, error } = await supabase.from('courses').select('*');
      if (!error && data) {
        setAllCourses(data as Course[]);
        localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      }
    };
    
    fetchCourses();
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSelection = (field: keyof typeof selections, value: string | number) => {
    setSelections(prev => ({ ...prev, [field]: value.toString() }));
    if (field === 'faculty') setStep('department');
    if (field === 'department') setStep('level');
    if (field === 'level') setStep('semester');
    if (field === 'semester') setStep('input-scores');
  };

  const handleScoreChange = (code: string, type: 'ca' | 'exam', val: string) => {
    if (val.trim() === '') {
      setScores(prev => ({
        ...prev,
        [code]: {
          ca: prev[code]?.ca ?? null,
          exam: prev[code]?.exam ?? null,
          [type]: null,
        },
      }));
      return;
    }

    const parsed = parseInt(val);
    const targetCourse = filteredCourses.find((course) => course.code === code);
    const caMax = Number((targetCourse?.max_ca ?? 30) + (targetCourse?.max_attendance ?? 10));
    const examMax = Number(targetCourse?.max_exam ?? 60);
    const allowedMax = type === 'ca' ? caMax : examMax;
    const isInvalid = !Number.isFinite(parsed) || parsed < 0 || parsed > allowedMax;
    const nextValue = isInvalid ? null : parsed;

    setScores(prev => ({
      ...prev,
      [code]: {
        ca: prev[code]?.ca ?? null,
        exam: prev[code]?.exam ?? null,
        [type]: nextValue,
      },
    }));
  };

  const goBack = () => {
    switch (step) {
      case 'department': setStep('faculty'); break;
      case 'level': setStep('department'); break;
      case 'semester': setStep('level'); break;
      case 'input-scores': setStep('semester'); break;
      default: break;
    }
  };

  const executeAnalysis = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setAuthMode('login');
      setIsAuthOpen(true);
      return;
    }

    const hasEmptyScore = filteredCourses.some((course) =>
      scores[course.code]?.ca === null ||
      scores[course.code]?.ca === undefined ||
      scores[course.code]?.exam === null ||
      scores[course.code]?.exam === undefined
    );

    if (hasEmptyScore) {
      alert('Please enter valid CA+Attendance and Exam scores for all listed courses before generating analytics.');
      setStep('input-scores');
      return;
    }

    const scoredCourses = filteredCourses.map((course) => {
      const caScore = Number(scores[course.code]?.ca ?? 0);
      const examScore = Number(scores[course.code]?.exam ?? 0);
      const maxCa = Number((course.max_ca ?? 30) + (course.max_attendance ?? 10));
      const maxExam = Number(course.max_exam ?? 60);
      const totalScore = caScore + examScore;
      const totalMax = maxCa + maxExam;

      return {
        code: course.code,
        title: course.title,
        units: Number(course.units),
        caScore,
        examScore,
        max_ca: maxCa,
        max_exam: maxExam,
        totalScore,
        totalMax,
        caPercentage: Number(((caScore / Math.max(1, maxCa)) * 100).toFixed(2)),
        examPercentage: Number(((examScore / Math.max(1, maxExam)) * 100).toFixed(2)),
        totalPercentage: Number(((totalScore / Math.max(1, totalMax)) * 100).toFixed(2)),
      };
    });

    const sessionData = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      faculty: selections.faculty,
      department: selections.department,
      level: selections.level,
      semester: selections.semester,
      scores: scores,
      courses: scoredCourses,
      aiAnalysis: null as any
    };
    
    // Call AI to generate assessment
    setStep('analyzing');
    const aiResult = await generateAIAnalysis(sessionData);
    if (aiResult.success) {
       sessionData.aiAnalysis = aiResult.analysis;
    }

    localStorage.setItem('miu_current_session', JSON.stringify(sessionData));

    const payload = {
      user_id: session.user.id,
      faculty: selections.faculty,
      department: selections.department,
      level: selections.level,
      semester: selections.semester,
      assessment_type: 'Combined',
      scores: scores,
      courses: sessionData.courses,
      ai_analysis: sessionData.aiAnalysis
    };

    let { error: saveError } = await supabase.from('analysis_sessions').insert(payload);

    // Backward compatibility for older schemas that do not yet have ai_analysis.
    if (saveError?.message?.includes("Could not find the 'ai_analysis' column")) {
      const legacyPayload = {
        user_id: session.user.id,
        faculty: selections.faculty,
        department: selections.department,
        level: selections.level,
        semester: selections.semester,
        assessment_type: 'Combined',
        scores: scores,
        courses: sessionData.courses,
      };
      const fallbackResult = await supabase.from('analysis_sessions').insert(legacyPayload);
      saveError = fallbackResult.error;
    }

    if (saveError) {
      alert(`Could not save prediction to history: ${saveError.message}`);
      setStep('input-scores');
      return;
    }

    setIsAuthOpen(false);
    
    setTimeout(() => {
      router.push('/analytics');
    }, 500);
  };

  const startAnalysis = () => {
    if (!isLoggedIn) {
      setAuthMode('login');
      setIsAuthOpen(true);
      return;
    }
    executeAnalysis();
  };

  const handleAuth = async () => {
    setAuthLoading(true);
    setAuthError('');
    
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      // If they were in the middle of generating a prediction, continue
      if (step === 'input-scores') {
        executeAnalysis();
      } else {
        setIsAuthOpen(false);
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-12 outline-none focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {authError && <p className="text-red-500 text-xs font-semibold text-center mt-4">{authError}</p>}

                  <button 
                    onClick={handleAuth}
                    disabled={authLoading}
                    className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/5 mt-6 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {authLoading && <Loader2 size={16} className="animate-spin" />}
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
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

      <nav className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8 md:py-6 max-w-6xl mx-auto gap-3">
        <div 
          className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight cursor-pointer shrink-0" 
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
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={() => router.push('/history')}
            className="md:hidden bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
          >
            History
          </button>
          {!isLoggedIn ? (
            <button 
              type="button"
              onClick={() => { setAuthMode('login'); setIsAuthOpen(true); }}
              className="bg-black text-white px-4 md:px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-md"
            >
              Login
            </button>
          ) : (
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                type="button"
                onClick={async () => { await supabase.auth.signOut(); setIsLoggedIn(false); }}
                className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors"
              >
                Logout
              </button>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm border-2 border-white">
                {userEmail ? userEmail.substring(0, 2).toUpperCase() : 'KA'}
              </div>
            </div>
          )}
        </div>
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
              <motion.div key="prompt-text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 text-gray-400 min-w-0">
                  {step !== 'faculty' && (
                    <button onClick={goBack} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors border border-gray-100" title="Go Back">
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Sparkles size={16} /></div>
                  <span className="text-sm break-words">
                    {step === 'faculty' && "Select your Faculty to begin..."}
                    {step === 'department' && `Choose your Department in ${selections.faculty}...`}
                    {step === 'level' && "What is your current academic level?"}
                    {step === 'semester' && "Which semester's results are we analyzing?"}
                    {step === 'input-scores' && "Enter your CA and Exam scores for each course."}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end max-w-full">
                  {selections.faculty && <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-600 break-words max-w-full sm:max-w-[140px]">{selections.faculty}</span>}
                  {selections.department && <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-600 break-words max-w-full sm:max-w-[170px]">{selections.department}</span>}
                  {selections.level && <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-600 break-words max-w-full sm:max-w-[100px]">Level {selections.level}</span>}
                  {selections.semester && <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-600 break-words max-w-full sm:max-w-[120px]">Semester {selections.semester}</span>}
                </div>
              </motion.div>
            )}

            {step === 'input-scores' && (
              <motion.div key="score-form" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={goBack} className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors border border-gray-100"><ArrowLeft size={16} /></button>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Enter CA and Exam Scores</h3>
                    <p className="text-xs text-gray-400">{selections.department} • Level {selections.level} • Semester {selections.semester}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6 max-h-[350px] overflow-y-auto pr-1">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => {
                      return (
                        <div key={course.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="font-semibold text-sm text-gray-700">{course.code}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{course.title} ({course.units} Units)</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              max={(course.max_ca ?? 30) + (course.max_attendance ?? 10)}
                              placeholder={`CA+ATT/${(course.max_ca ?? 30) + (course.max_attendance ?? 10)}`}
                              value={scores[course.code]?.ca ?? ''}
                              onChange={(e) => handleScoreChange(course.code, 'ca', e.target.value)}
                              className="w-[86px] h-10 p-2 text-center text-xs font-bold bg-white border border-gray-200 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                            />
                            <input
                              type="number"
                              max={course.max_exam ?? 60}
                              placeholder={`EX/${course.max_exam ?? 60}`}
                              value={scores[course.code]?.exam ?? ''}
                              onChange={(e) => handleScoreChange(course.code, 'exam', e.target.value)}
                              className="w-[86px] h-10 p-2 text-center text-xs font-bold bg-white border border-gray-200 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                            />
                          </div>
                        </div>
                      )
                    })
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full max-w-3xl px-1 sm:px-4">
            {(() => {
              if (step === 'faculty') return MIU_DATA.faculties.map(f => ({ label: f, icon: <Building2 className="w-5 h-5 text-gray-400" />, value: f, type: 'faculty' }));
              if (step === 'department') return (MIU_DATA.departments[selections.faculty as keyof typeof MIU_DATA.departments] || []).map(d => ({ label: d, icon: <BookOpen className="w-5 h-5 text-gray-400" />, value: d, type: 'department' }));
              if (step === 'level') return MIU_DATA.levels.map(l => ({ label: `${l} Level`, icon: <GraduationCap className="w-5 h-5 text-gray-400" />, value: l, type: 'level' }));
              if (step === 'semester') return MIU_DATA.semesters.map(s => ({ label: `Semester ${s}`, icon: <Calendar className="w-5 h-5 text-gray-400" />, value: s, type: 'semester' }));
              return [];
            })().map((opt, idx) => (
              <motion.button key={opt.value} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} onClick={() => handleSelection(opt.type as keyof typeof selections, opt.value)} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_-3px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all text-left flex flex-col justify-between h-28 group">
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
          </div>
        )}
      </main>
    </div>
  );
}