import React from 'react';
import {
  GraduationCap,
  Copy,
  MessageCircle,
  BookOpen,
  Check,
  X
} from 'lucide-react';
import { getCanonicalCourses } from '../../../utils/enrollmentService';
import { EXAM_CATEGORIES_METADATA } from '../../../data/examCategoriesData';
import CourseSearchSelect from '../../CourseSearchSelect';

export default function UserDetailsModal({
  selectedUserDetails,
  setSelectedUserDetails,
  onClose,
  userTabInsideModal,
  setUserTabInsideModal,
  handleCopyText,
  handleChangeUserRole,
  handleToggleUserStatus,
  courses = [],
  bundles = [],
  selectedCourseToEnroll,
  setSelectedCourseToEnroll,
  handleAssignCourseToUser,
  handleRevokeCourseFromUser,
  setQuickEnrollUser
}) {
  if (!selectedUserDetails) return null;

  const canonicalUserCourses = getCanonicalCourses(
    selectedUserDetails.enrolledCourses,
    { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA }
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#5d5bf6] to-[#7c7afc] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer border-none transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-4">
            <img 
              src={selectedUserDetails.avatar} 
              alt={selectedUserDetails.name} 
              className="w-16 h-16 rounded-full object-cover ring-4 ring-white/30 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">{selectedUserDetails.name}</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-white/20 uppercase tracking-wider">
                  {selectedUserDetails.role}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">{selectedUserDetails.email}</p>
              <p className="text-[11px] text-white/70 mt-0.5 font-mono">
                ID: {selectedUserDetails.id} • Joined: {selectedUserDetails.joinedDate}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Tabs Bar */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setUserTabInsideModal('profile')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              userTabInsideModal === 'profile'
                ? 'border-[#5d5bf6] text-[#5d5bf6]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Profile & Security
          </button>
          <button
            onClick={() => setUserTabInsideModal('courses')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              userTabInsideModal === 'courses'
                ? 'border-[#5d5bf6] text-[#5d5bf6]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Enrolled Courses ({canonicalUserCourses.length})
          </button>
          <button
            onClick={() => setUserTabInsideModal('transactions')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              userTabInsideModal === 'transactions'
                ? 'border-[#5d5bf6] text-[#5d5bf6]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Financial History
          </button>
        </div>

        {/* Modal Tab Body */}
        <div className="p-6">
          {userTabInsideModal === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp / Contact Phone</div>
                  <div className="text-xs font-extrabold text-slate-800 mt-1 flex items-center justify-between flex-wrap gap-1">
                    <span>{selectedUserDetails.whatsapp || selectedUserDetails.phone || 'N/A'}</span>
                    {(selectedUserDetails.whatsapp || selectedUserDetails.phone) && (
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleCopyText(selectedUserDetails.whatsapp || selectedUserDetails.phone, 'Contact number')} 
                          className="text-slate-400 hover:text-slate-600 bg-transparent border-none p-0 cursor-pointer"
                          title="Copy number"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`https://wa.me/${(selectedUserDetails.whatsapp || selectedUserDetails.phone).replace(/[^0-9]/g, '').replace(/^0/, '880')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">College / Institution</div>
                  <div className="text-xs font-extrabold text-slate-800 mt-1 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="truncate" title={selectedUserDetails.college || selectedUserDetails.institution || 'Not specified'}>
                      {selectedUserDetails.college || selectedUserDetails.institution || <span className="text-slate-400 italic font-normal">Not specified</span>}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HSC Batch</div>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200/80">
                      {selectedUserDetails.hscBatch || selectedUserDetails.batch || 'Not specified'}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Device</div>
                  <div className="text-xs font-extrabold text-slate-800 mt-1 truncate" title={selectedUserDetails.device}>
                    {selectedUserDetails.device || 'Web Session'}
                  </div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joined Date</div>
                  <div className="text-xs font-extrabold text-slate-800 mt-1">{selectedUserDetails.joinedDate || 'Recently'}</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Activity</div>
                  <div className="text-xs font-extrabold text-slate-800 mt-1">{selectedUserDetails.lastActive || 'Recently'}</div>
                </div>
              </div>

              {/* Role and Status Modification */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-800">Quick Role & Permission Controls</div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-500 font-semibold">Change Role:</label>
                  <select
                    value={selectedUserDetails.role}
                    onChange={(e) => {
                      handleChangeUserRole(selectedUserDetails.id, e.target.value);
                      setSelectedUserDetails(prev => ({ ...prev, role: e.target.value }));
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="Student">Student</option>
                    <option value="Instructor">Instructor</option>
                    <option value="Moderator">Moderator</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-500 font-semibold">Account Status:</label>
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleUserStatus(selectedUserDetails.id);
                      setSelectedUserDetails(prev => ({ ...prev, status: prev.status === 'Active' ? 'Suspended' : 'Active' }));
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer border ${
                      selectedUserDetails.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {selectedUserDetails.status === 'Active' ? '🟢 Active (Click to Suspend)' : '🔴 Suspended (Click to Activate)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {userTabInsideModal === 'courses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">অ্যাসাইন করা কোর্স ও এক্সাম ব্যাচসমূহ</span>
                  <p className="text-[11px] text-slate-400">এই শিক্ষার্থী বর্তমানে যেসকল কোর্সের পূর্ণাঙ্গ এক্সেস উপভোগ করছেন</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (setQuickEnrollUser) setQuickEnrollUser(selectedUserDetails);
                    if (setSelectedCourseToEnroll) setSelectedCourseToEnroll(courses[0]?.title || '');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold cursor-pointer border-none shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>+ কোর্স এক্সেস দিন</span>
                </button>
              </div>

              {/* Direct In-Tab Course Assign Form */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 rounded-2xl border border-indigo-100/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex-1 min-w-0">
                  <CourseSearchSelect
                    value={selectedCourseToEnroll}
                    onChange={(val) => setSelectedCourseToEnroll(val)}
                    courses={courses}
                    bundles={bundles}
                    examBatches={EXAM_CATEGORIES_METADATA}
                    enrolledCourses={canonicalUserCourses}
                    placeholder="Choose Course, Bundle or Exam Batch..."
                  />
                </div>

                <button
                  type="button"
                  disabled={!selectedCourseToEnroll}
                  onClick={() => {
                    handleAssignCourseToUser(selectedUserDetails.id, selectedCourseToEnroll);
                    setSelectedCourseToEnroll('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] disabled:opacity-50 text-white text-xs font-bold shrink-0 cursor-pointer border-none shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Grant Access</span>
                </button>
              </div>

              {canonicalUserCourses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  <p className="text-xs font-bold text-slate-600">No active courses</p>
                  <p className="text-[11px] text-slate-400">Select a course from the dropdown above to grant access.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {canonicalUserCourses.map((cTitle, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#5d5bf6]/10 text-[#5d5bf6] flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{cTitle}</div>
                          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active Access Pass</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevokeCourseFromUser(selectedUserDetails.id, cTitle)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 cursor-pointer transition-colors"
                      >
                        Revoke Access
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {userTabInsideModal === 'transactions' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800">Payment & Transaction Statements</div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Total Revenue Contributed:</span>
                  <strong className="text-emerald-600 font-extrabold text-sm">৳{(selectedUserDetails.totalSpent || 0).toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Account Status:</span>
                  <strong className="text-slate-800 font-bold">{selectedUserDetails.status}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Account Type:</span>
                  <strong className="text-slate-800 font-bold">{selectedUserDetails.role}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer border-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
