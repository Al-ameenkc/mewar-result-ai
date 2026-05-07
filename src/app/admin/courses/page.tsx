"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  School, Plus, Save, X, Edit2, Trash2, 
  BookOpen, Building2, GraduationCap, Calendar, Hash, FileText,
  Search, Filter, Loader2, LogOut, ChevronDown, CheckCircle2, ChevronRight
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { logoutAdmin } from '../actions';
import { useRouter } from 'next/navigation';

// --- Types ---
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

type SupabaseError = {
  message?: string;
};

const ADMIN_COURSES_CACHE_KEY = 'miu_admin_courses_cache_v1';
const ADMIN_COURSES_CACHE_TTL_MS = 1000 * 60 * 5;

// --- Base MIU Structural Data ---
const MIU_DATA = {
  faculties: ['Computing', 'Sciences', 'Management', 'Law'],
  departments: {
    'Computing': ['Software Engineering', 'Cyber Security', 'Computer Science'],
    'Sciences': ['Biotechnology', 'Industrial Chemistry', 'Physics with Electronics'],
    'Management': ['Accounting', 'Public Administration', 'Economics', 'Entrepreneurship', 'Banking and Finance', 'International Relations', 'Political Science', 'Sociology', 'Procurement Management'],
    'Law': ['Commercial Law', 'Islamic Law', 'International Law'],
  },
  levels: ['100', '200', '300', '400'],
  semesters: ['1', '2'],
};

const NativeSelect = ({ 
  name, 
  value, 
  options, 
  icon: Icon, 
  label, 
  disabled = false,
  onChange
}: { 
  name: string, value: string, options: string[], icon: any, label: string, disabled?: boolean, onChange: (e: any) => void
}) => {
  return (
    <div className="relative">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Icon size={12}/> {label}</label>
      <div className="relative">
        <select 
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full h-11 px-4 pr-10 text-sm font-semibold bg-gray-50 border border-gray-200 rounded-xl appearance-none outline-none transition-all text-gray-900 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-black hover:bg-white focus:ring-2 focus:ring-black/5 focus:border-black'}`}
        >
          <option value="" disabled>Select {label}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>
              {name === 'level' ? `${opt}L` : name === 'semester' ? `Semester ${opt}` : opt}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default function AdminCoursePortal() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    faculty: '',
    department: '',
    level: '',
    semester: '',
    code: '',
    title: '',
    units: 1,
    max_exam: 60,
    max_ca: 30,
    max_attendance: 10
  });

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdowns on outside click (simplified)
  useEffect(() => {
    const handleClick = () => setActiveDropdown(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'faculty') newData.department = '';
      return newData;
    });
  };

  const supabase = createClient();
  const isMissingColumnError = (error: SupabaseError | null) =>
    error?.message?.includes("Could not find the") ?? false;

  const normalizeCourse = (course: Partial<Course>): Course => ({
    id: course.id ?? '',
    faculty: course.faculty ?? '',
    department: course.department ?? '',
    level: course.level ?? '',
    semester: course.semester ?? '',
    code: course.code ?? '',
    title: course.title ?? '',
    units: Number(course.units ?? 1),
    max_exam: Number(course.max_exam ?? 60),
    max_ca: Number(course.max_ca ?? 30),
    max_attendance: Number(course.max_attendance ?? 10),
  });

  const persistCoursesCache = (nextCourses: Course[]) => {
    localStorage.setItem(ADMIN_COURSES_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: nextCourses }));
  };

  const fetchCourses = async () => {
    setLoading(true);
    const cachedRaw = localStorage.getItem(ADMIN_COURSES_CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as { ts: number; data: Course[] };
        if (Date.now() - cached.ts < ADMIN_COURSES_CACHE_TTL_MS && Array.isArray(cached.data)) {
          setCourses(cached.data);
          setLoading(false);
        }
      } catch {
        localStorage.removeItem(ADMIN_COURSES_CACHE_KEY);
      }
    }

    const { data: dbCourses, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (!error && dbCourses) {
      const normalized = (dbCourses as Partial<Course>[]).map(normalizeCourse);
      setCourses(normalized);
      persistCoursesCache(normalized);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);


  // Submit Form (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalMarks = Number(formData.max_exam) + Number(formData.max_ca) + Number(formData.max_attendance);
    if (totalMarks !== 100) {
      alert(`Error: The course max marks must sum up to exactly 100. Currently they sum to ${totalMarks} (${formData.max_exam} + ${formData.max_ca} + ${formData.max_attendance}).`);
      return;
    }
    
    if (isEditing && editingId) {
       const fullPayload = {
         ...formData,
         units: Number(formData.units),
         max_exam: Number(formData.max_exam),
         max_ca: Number(formData.max_ca),
         max_attendance: Number(formData.max_attendance),
       };

       let { error } = await supabase.from('courses').update(fullPayload).eq('id', editingId);

       if (isMissingColumnError(error)) {
         const legacyPayload = {
           faculty: formData.faculty,
           department: formData.department,
           level: formData.level,
           semester: formData.semester,
           code: formData.code,
           title: formData.title,
           units: Number(formData.units),
         };
         const fallback = await supabase.from('courses').update(legacyPayload).eq('id', editingId);
         error = fallback.error;
       }

       if (!error) {
         const updatedCourses = courses.map(c => c.id === editingId ? normalizeCourse({
           ...c,
           ...formData,
           id: editingId,
           units: Number(formData.units),
         }) : c);
         setCourses(updatedCourses);
         persistCoursesCache(updatedCourses);
       } else {
         alert(`Failed to update course: ${error.message}`);
       }
    } else {
       const fullPayload = {
         ...formData,
         units: Number(formData.units),
         max_exam: Number(formData.max_exam),
         max_ca: Number(formData.max_ca),
         max_attendance: Number(formData.max_attendance),
       };

       let { data, error } = await supabase.from('courses').insert([fullPayload]).select().single();

       if (isMissingColumnError(error)) {
         const legacyPayload = {
           faculty: formData.faculty,
           department: formData.department,
           level: formData.level,
           semester: formData.semester,
           code: formData.code,
           title: formData.title,
           units: Number(formData.units),
         };
         const fallback = await supabase.from('courses').insert([legacyPayload]).select().single();
         data = fallback.data;
         error = fallback.error;
       }

       if (!error && data) {
         const updatedCourses = [normalizeCourse(data as Partial<Course>), ...courses];
         setCourses(updatedCourses);
         persistCoursesCache(updatedCourses);
       } else if (error) {
         alert(`Failed to create course: ${error.message}`);
       }
    }

    // Reset UI State
    setIsEditing(false);
    setEditingId(null);
    setFormData(prev => ({ ...prev, code: '', title: '', units: 1, max_exam: 60, max_ca: 30, max_attendance: 10 }));
  };

  // Edit Course
  const handleEdit = (course: Course) => {
    setFormData({
      faculty: course.faculty,
      department: course.department,
      level: course.level,
      semester: course.semester,
      code: course.code,
      title: course.title,
      units: course.units,
      max_exam: course.max_exam ?? 60,
      max_ca: course.max_ca ?? 30,
      max_attendance: course.max_attendance ?? 10
    });
    setIsEditing(true);
    setEditingId(course.id);
  };

  // Delete Course
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this course?")) {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (!error) {
        const updatedCourses = courses.filter(course => course.id !== id);
        setCourses(updatedCourses);
        persistCoursesCache(updatedCourses);
      }
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(prev => ({ ...prev, code: '', title: '', units: 1, max_exam: 60, max_ca: 30, max_attendance: 10 }));
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] relative overflow-hidden font-sans text-gray-900 pb-20">
      {/* Background Blurs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-3xl mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[60%] bg-indigo-50/50 rounded-full blur-3xl mix-blend-multiply" />
      </div>

      {/* Admin Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-gray-200/50 mb-8">
        <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
          <div className="bg-black text-white p-2 rounded-lg"><School size={20} /></div>
          <div>
            MIU Admin <span className="text-sm font-medium text-gray-500 block leading-none">Curriculum Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Admin Active
          </div>
          <button onClick={async () => { await logoutAdmin(); router.refresh(); }} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-full border border-red-100 transition-all">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: The Configuration Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                {isEditing ? <Edit2 size={20} className="text-blue-500"/> : <Plus size={20} className="text-blue-500"/>}
                {isEditing ? 'Edit Course' : 'Assign New Course'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">Configure academic parameters and course details.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <NativeSelect name="faculty" label="Faculty" icon={Building2} options={MIU_DATA.faculties} value={formData.faculty} onChange={handleChange} />
                <NativeSelect name="department" label="Department" icon={BookOpen} options={MIU_DATA.departments[formData.faculty as keyof typeof MIU_DATA.departments] || []} value={formData.department} disabled={!formData.faculty} onChange={handleChange} />
                <div className="grid grid-cols-2 gap-3">
                  <NativeSelect name="level" label="Level" icon={GraduationCap} options={MIU_DATA.levels} value={formData.level} onChange={handleChange} />
                  <NativeSelect name="semester" label="Semester" icon={Calendar} options={MIU_DATA.semesters} value={formData.semester} onChange={handleChange} />
                </div>
              </div>

              <div className="w-full h-px bg-gray-100 my-4"></div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Hash size={12}/> Course Code</label>
                    <input type="text" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. SEN414" className="w-full h-11 px-4 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5 transition-all uppercase" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FileText size={12}/> Units</label>
                    <input type="number" name="units" value={formData.units} onChange={handleChange} required min="1" max="6" className="w-full h-11 px-4 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5 transition-all text-center" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><BookOpen size={12}/> Course Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Human Computer Interaction" className="w-full h-11 px-4 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5 transition-all" />
                </div>
              </div>

              {/* Assessment Grading Configuration */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mt-6">
                <div className="mb-3">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-blue-500"/> Grading Matrix
                  </h4>
                  <p className="text-[10px] text-blue-600 font-medium mt-0.5">Define max marks. Total must equal exactly 100.</p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl p-2.5 border border-blue-100/50 shadow-sm flex flex-col justify-center items-center">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Exam</label>
                    <input type="number" name="max_exam" value={formData.max_exam} onChange={handleChange} required min="0" max="100" className="w-full text-center font-bold text-lg text-gray-900 bg-transparent outline-none" />
                  </div>
                  <div className="bg-white rounded-xl p-2.5 border border-blue-100/50 shadow-sm flex flex-col justify-center items-center">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">CA</label>
                    <input type="number" name="max_ca" value={formData.max_ca} onChange={handleChange} required min="0" max="100" className="w-full text-center font-bold text-lg text-gray-900 bg-transparent outline-none" />
                  </div>
                  <div className="bg-white rounded-xl p-2.5 border border-blue-100/50 shadow-sm flex flex-col justify-center items-center">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">ATT</label>
                    <input type="number" name="max_attendance" value={formData.max_attendance} onChange={handleChange} required min="0" max="100" className="w-full text-center font-bold text-lg text-gray-900 bg-transparent outline-none" />
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between px-1">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Sum</div>
                  <div className={`text-sm font-bold flex items-center gap-1 ${Number(formData.max_exam) + Number(formData.max_ca) + Number(formData.max_attendance) === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {Number(formData.max_exam) + Number(formData.max_ca) + Number(formData.max_attendance)} / 100
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-md">
                  <Save size={16} /> {isEditing ? 'Save Changes' : 'Create Course'}
                </button>
                {isEditing && (
                  <button type="button" onClick={cancelEdit} className="px-4 bg-red-50 text-red-600 py-3 rounded-xl text-sm font-semibold flex items-center justify-center hover:bg-red-100 transition-all border border-red-100">
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: The Data Table */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900">Curriculum Database</h3>
                <p className="text-xs text-gray-500">Manage all registered courses across departments.</p>
              </div>
              <div className="flex gap-2">
                <div className="bg-white border border-gray-200 rounded-full px-3 py-1.5 flex items-center gap-2">
                  <Search size={14} className="text-gray-400" />
                  <input type="text" placeholder="Search courses..." className="bg-transparent text-sm outline-none w-32 focus:w-48 transition-all" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12">
                   <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
                   <p className="text-sm font-medium">Loading courses...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12">
                  <BookOpen size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">No courses registered yet.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">Code</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">Course Title</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">Class</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 text-center">Units</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <AnimatePresence>
                      {courses.map((course) => (
                        <motion.tr 
                          key={course.id} 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, x: -20 }}
                          className={`hover:bg-gray-50/50 transition-colors ${editingId === course.id ? 'bg-blue-50/30' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded-md">{course.code}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">{course.title}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                            {course.level}L • {course.department}
                            <div className="mt-1 flex items-center gap-2 text-[9px] font-bold text-gray-400">
                               <span title="Exam Max Mark">EXM:{course.max_exam ?? 60}</span>
                               <span title="CA Max Mark">CA:{course.max_ca ?? 30}</span>
                               <span title="Attendance Max Mark">ATT:{course.max_attendance ?? 10}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                              {course.units}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEdit(course)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDelete(course.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}