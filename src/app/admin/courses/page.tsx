"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  School, Plus, Save, X, Edit2, Trash2, 
  BookOpen, Building2, GraduationCap, Calendar, Hash, FileText,
  Search, Filter
} from 'lucide-react';

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
};

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

export default function AdminCoursePortal() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    faculty: '',
    department: '',
    level: '',
    semester: '',
    code: '',
    title: '',
    units: 1
  });

  // Load courses from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('miu_courses');
    if (saved) {
      setCourses(JSON.parse(saved));
    }
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

  // Submit Form (Create or Update)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedCourses = isEditing && editingId
      ? courses.map(c => c.id === editingId ? { ...formData, id: editingId, units: Number(formData.units) } : c)
      : [{ ...formData, id: Date.now().toString(), units: Number(formData.units) }, ...courses];

    // Update State
    setCourses(updatedCourses);
    
    // Save to LocalStorage for the Home Page to access
    localStorage.setItem('miu_courses', JSON.stringify(updatedCourses));

    // Reset UI State
    setIsEditing(false);
    setEditingId(null);
    setFormData(prev => ({ ...prev, code: '', title: '', units: 1 }));
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
      units: course.units
    });
    setIsEditing(true);
    setEditingId(course.id);
  };

  // Delete Course
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to remove this course?")) {
      const updatedCourses = courses.filter(course => course.id !== id);
      setCourses(updatedCourses);
      localStorage.setItem('miu_courses', JSON.stringify(updatedCourses));
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(prev => ({ ...prev, code: '', title: '', units: 1 }));
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
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Building2 size={12}/> Faculty</label>
                  <select name="faculty" value={formData.faculty} onChange={handleChange} required className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all">
                    <option value="" disabled>Select Faculty</option>
                    {MIU_DATA.faculties.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><BookOpen size={12}/> Department</label>
                  <select name="department" value={formData.department} onChange={handleChange} required disabled={!formData.faculty} className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all disabled:opacity-50">
                    <option value="" disabled>Select Department</option>
                    {formData.faculty && (MIU_DATA.departments[formData.faculty as keyof typeof MIU_DATA.departments] || []).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><GraduationCap size={12}/> Level</label>
                    <select name="level" value={formData.level} onChange={handleChange} required className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all">
                      <option value="" disabled>Level</option>
                      {MIU_DATA.levels.map(l => <option key={l} value={l}>{l}L</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Calendar size={12}/> Semester</label>
                    <select name="semester" value={formData.semester} onChange={handleChange} required className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all">
                      <option value="" disabled>Semester</option>
                      {MIU_DATA.semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-gray-100 my-4"></div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Hash size={12}/> Course Code</label>
                    <input type="text" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. SEN414" className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><FileText size={12}/> Units</label>
                    <input type="number" name="units" value={formData.units} onChange={handleChange} required min="1" max="6" className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><BookOpen size={12}/> Course Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Human Computer Interaction" className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" />
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
              {courses.length === 0 ? (
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