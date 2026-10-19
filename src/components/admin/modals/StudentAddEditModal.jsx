import React from 'react';
import { GraduationCap, X, Check } from 'lucide-react';

export default function StudentAddEditModal({
  isOpen,
  onClose,
  editingStudentId,
  newStudentData,
  setNewStudentData,
  onSubmit,
  courses = [],
  data = {}
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-pink-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center font-bold shadow-md shadow-pink-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingStudentId ? 'Update Student Information' : 'Manual Student Enrollment'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingStudentId ? 'Update details and save changes' : 'Directly enroll a new student into a course or exam batch'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center border-none cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Row 1: Student Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Student Full Name <span className="text-pink-600">*</span>
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. Tanvir Hasan"
              value={newStudentData.name}
              onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all font-medium"
            />
          </div>

          {/* Row 2: Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mobile Phone Number <span className="text-pink-600">*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="017xxxxxxxx"
                value={newStudentData.phone}
                onChange={(e) => setNewStudentData({ ...newStudentData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address (Optional)
              </label>
              <input 
                type="email" 
                placeholder="student@gmail.com"
                value={newStudentData.email}
                onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all"
              />
            </div>
          </div>

          {/* Row 3: Course Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Course / Batch <span className="text-pink-600">*</span>
            </label>
            <select 
              value={newStudentData.courseName}
              onChange={(e) => {
                const selCourse = courses.find(c => c.title === e.target.value);
                setNewStudentData({ 
                  ...newStudentData, 
                  courseName: e.target.value,
                  batch: selCourse?.category ? (selCourse.category === 'Medical' ? 'Medical 25' : selCourse.category) : newStudentData.batch
                });
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all font-medium cursor-pointer"
            >
              <optgroup label="Online Courses">
                {courses.map(c => (
                  <option key={c.id} value={c.title}>
                    {c.title} {c.category ? `(${c.category})` : ''}
                  </option>
                ))}
              </optgroup>
              {data?.examBatches && data.examBatches.length > 0 && (
                <optgroup label="SureShot Exam Batches">
                  {data.examBatches.map(b => (
                    <option key={b.key || b.id} value={b.title}>
                      {b.title} {b.targetBatch ? `(${b.targetBatch})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Other Batches">
                <option value="Biology Extra Info + Exam Batch">Biology Extra Info + Exam Batch</option>
                <option value="Ketab Sir Higher Math MCQ Solve">Ketab Sir Higher Math MCQ Solve</option>
              </optgroup>
            </select>
          </div>

          {/* Row 4: Batch & Status */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Batch Category</label>
              <select 
                value={newStudentData.batch}
                onChange={(e) => setNewStudentData({ ...newStudentData, batch: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 font-bold cursor-pointer"
              >
                <option value="HSC 25">HSC 25</option>
                <option value="HSC 26">HSC 26</option>
                <option value="HSC 27">HSC 27</option>
                <option value="HSC 28">HSC 28</option>
                <option value="Medical 25">Medical 25</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Enrollment Status</label>
              <select 
                value={newStudentData.status}
                onChange={(e) => setNewStudentData({ ...newStudentData, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 font-bold cursor-pointer"
              >
                <option value="Active">🟢 Active (Approved)</option>
                <option value="Pending">🟡 Pending (Under Review)</option>
              </select>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border-none cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 border-none cursor-pointer shadow-md shadow-pink-600/25 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingStudentId ? 'Save Changes' : 'Confirm Enrollment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
