import React from 'react';
import { GraduationCap, X, CheckCircle2 } from 'lucide-react';
import { getCanonicalCourses } from '../../../utils/enrollmentService';
import { EXAM_CATEGORIES_METADATA } from '../../../data/examCategoriesData';
import CourseSearchSelect from '../../CourseSearchSelect';

export default function QuickEnrollModal({
  quickEnrollUser,
  onClose,
  courses = [],
  bundles = [],
  selectedCourseToEnroll,
  setSelectedCourseToEnroll,
  handleAssignCourseToUser,
  handleRevokeCourseFromUser
}) {
  if (!quickEnrollUser) return null;

  const canonicalActive = getCanonicalCourses(
    quickEnrollUser.enrolledCourses,
    { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA }
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5d5bf6]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Grant Course Access</h3>
              <p className="text-xs text-slate-500 font-medium">
                Student: <strong className="text-slate-800">{quickEnrollUser.name}</strong> • {quickEnrollUser.email || quickEnrollUser.phone || 'N/A'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Courses (Canonical & De-duplicated) */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Courses ({canonicalActive.length}):
            </span>
            <span className="text-[11px] font-extrabold text-[#5d5bf6]">
              {canonicalActive.length} Active Course{canonicalActive.length !== 1 ? 's' : ''}
            </span>
          </div>
          {canonicalActive.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {canonicalActive.map((c, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate max-w-[210px]">{c}</span>
                  <button
                    type="button"
                    onClick={() => handleRevokeCourseFromUser(quickEnrollUser.id, c)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 ml-1 border-none bg-transparent cursor-pointer"
                    title="Revoke access"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No active courses currently assigned to this student.</p>
          )}
        </div>

        {/* Professional Course Search & Select Component */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Select Course or Batch to Grant:
          </label>
          <CourseSearchSelect
            value={selectedCourseToEnroll}
            onChange={(val) => setSelectedCourseToEnroll(val)}
            courses={courses}
            bundles={bundles}
            examBatches={EXAM_CATEGORIES_METADATA}
            enrolledCourses={canonicalActive}
            placeholder="Choose Course, Bundle or Exam Batch..."
          />
        </div>

        {/* Live Preview Info Banner */}
        {selectedCourseToEnroll && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Selected: {selectedCourseToEnroll}</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed pl-5">
              Clicking &quot;Grant Course Access&quot; will immediately unlock all chapters, video classes, lecture notes, and quizzes for this student.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border-none transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedCourseToEnroll}
            onClick={() => handleAssignCourseToUser(quickEnrollUser.id, selectedCourseToEnroll)}
            className="px-5 py-2.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none flex items-center gap-1.5 transition-all active:scale-95"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Grant Course Access</span>
          </button>
        </div>
      </div>
    </div>
  );
}
