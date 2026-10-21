import React, { useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  RefreshCw,
  Copy,
  MessageCircle,
  Eye,
  GraduationCap,
  Edit2,
  Trash2,
  Clock
} from 'lucide-react';
import { formatOrderDateTime, getUserTimestamp } from '../adminHelpers';
import { getCanonicalCourses } from '../../../utils/enrollmentService';
import { EXAM_CATEGORIES_METADATA } from '../../../data/examCategoriesData';

export default function AdminUsersTab({
  usersList = [],
  filteredUsers = [],
  userMetrics = { total: 0, activeStudents: 0, staffCount: 0, suspendedCount: 0 },
  userSearchQuery = '',
  setUserSearchQuery,
  userRoleFilter = 'ALL',
  setUserRoleFilter,
  userStatusFilter = 'ALL',
  setUserStatusFilter,
  userBatchFilter = 'ALL',
  setUserBatchFilter,
  userSortBy = 'newest',
  setUserSortBy,
  courses = [],
  bundles = [],
  isRefreshingUsers = false,
  handleManualRefreshUsers,
  handleExportUsersCSV,
  handleCopyText,
  handleToggleUserStatus,
  handleOpenEditUser,
  handleDeleteUser,
  setSelectedUserDetails,
  setUserTabInsideModal,
  setQuickEnrollUser,
  setSelectedCourseToEnroll,
  setShowAddUserModal,
  setEditingUserId,
  setUserForm
}) {
  // Chronological registration serial number mapping:
  // The very first registered user (earliest timestamp) gets #1.
  // Each subsequent registered user gets an incremented serial (#2, #3, ... #N).
  // The table is sorted newest-first, so the newest user displays the highest serial at the top,
  // while the oldest user displays #1 at the bottom.
  const userSerialMap = useMemo(() => {
    const allSource = [...(usersList || []), ...(filteredUsers || [])];
    const seen = new Set();
    const unique = [];

    allSource.forEach(u => {
      if (!u) return;
      const key = (u.id || u.uid || u.email || '').toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push(u);
      }
    });

    // Sort CHRONOLOGICALLY ASCENDING: Oldest first -> index 0 gets serial 1
    unique.sort((a, b) => {
      const timeA = getUserTimestamp(a);
      const timeB = getUserTimestamp(b);
      if (timeA !== timeB) return timeA - timeB;
      const dateA = a.createdAt || a.created_at || a.joinedDate || '';
      const dateB = b.createdAt || b.created_at || b.joinedDate || '';
      if (dateA !== dateB) return String(dateA).localeCompare(String(dateB));
      return (a.name || '').localeCompare(b.name || '');
    });

    const map = new Map();
    unique.forEach((u, idx) => {
      const serial = idx + 1;
      if (u.id) map.set(String(u.id), serial);
      if (u.uid) map.set(String(u.uid), serial);
      if (u.email) map.set(u.email.toLowerCase().trim(), serial);
      const cleanP = (u.whatsapp || u.phone || '').replace(/[^0-9]/g, '');
      if (cleanP.length >= 8) map.set(cleanP.slice(-8), serial);
    });

    return map;
  }, [usersList, filteredUsers]);

  const getUserSerial = (user, fallbackIdx) => {
    if (!user) return fallbackIdx + 1;
    const idKey = user.id ? String(user.id) : null;
    const uidKey = user.uid ? String(user.uid) : null;
    const emailKey = user.email ? user.email.toLowerCase().trim() : null;
    const cleanP = (user.whatsapp || user.phone || '').replace(/[^0-9]/g, '');
    const phoneKey = cleanP.length >= 8 ? cleanP.slice(-8) : null;

    return (
      (idKey && userSerialMap.get(idKey)) ||
      (uidKey && userSerialMap.get(uidKey)) ||
      (emailKey && userSerialMap.get(emailKey)) ||
      (phoneKey && userSerialMap.get(phoneKey)) ||
      (fallbackIdx + 1)
    );
  };
  return (
    <div className="space-y-5">
      {/* Top 4-Card KPI Stat Row (Minimal, 2 Side-by-Side on Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Users */}
        <div 
          onClick={() => {
            setUserRoleFilter('ALL');
            setUserStatusFilter('ALL');
            setUserBatchFilter('ALL');
          }}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="text-xs sm:text-sm font-bold text-slate-500 truncate">Total Users</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-3">
            {userMetrics.total}
          </div>
        </div>

        {/* Active Students */}
        <div 
          onClick={() => {
            setUserRoleFilter('Student');
            setUserStatusFilter('Active');
          }}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="text-xs sm:text-sm font-bold text-slate-500 truncate">Active Students</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-none mt-3">
            {userMetrics.activeStudents}
          </div>
        </div>

        {/* Faculty & Staff */}
        <div 
          onClick={() => {
            setUserRoleFilter('Instructor');
            setUserStatusFilter('ALL');
          }}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="text-xs sm:text-sm font-bold text-slate-500 truncate">Faculty & Staff</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight leading-none mt-3">
            {userMetrics.staffCount}
          </div>
        </div>

        {/* Suspended Accounts */}
        <div 
          onClick={() => {
            setUserStatusFilter('Suspended');
          }}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="text-xs sm:text-sm font-bold text-slate-500 truncate">Suspended Accounts</div>
          <div className={`text-2xl sm:text-3xl font-black tracking-tight leading-none mt-3 ${userMetrics.suspendedCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {userMetrics.suspendedCount}
          </div>
        </div>
      </div>

      {/* Search, Action, and Filter Toolbar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by student name, phone, email, ID, or batch..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full bg-[#f4f6fa] border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-slate-400 transition-all font-medium placeholder:text-slate-400"
            />
            {userSearchQuery && (
              <button 
                type="button"
                onClick={() => setUserSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-transparent border-none cursor-pointer p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Top Actions: Add User & Export */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (typeof setEditingUserId === 'function') setEditingUserId(null);
                if (typeof setUserForm === 'function') {
                  setUserForm({
                    name: '',
                    email: '',
                    phone: '',
                    whatsapp: '',
                    college: '',
                    role: 'Student',
                    status: 'Active',
                    batch: 'HSC 26',
                    password: ''
                  });
                }
                if (typeof setShowAddUserModal === 'function') setShowAddUserModal(true);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer border-none transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add User</span>
            </button>

            <button
              type="button"
              onClick={handleExportUsersCSV}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-all"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              type="button"
              onClick={handleManualRefreshUsers}
              disabled={isRefreshingUsers}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
              title="Sync Users from Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingUsers ? 'animate-spin text-[#5d5bf6]' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{isRefreshingUsers ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-3 sm:flex sm:items-center sm:justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Batch Select */}
          <div className="relative">
            <select
              value={userBatchFilter}
              onChange={(e) => setUserBatchFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-white"
            >
              <option value="ALL">All Batches</option>
              <option value="HSC 25">HSC 25</option>
              <option value="HSC 26">HSC 26</option>
              <option value="HSC 27">HSC 27</option>
              <option value="HSC 28">HSC 28</option>
            </select>
          </div>

          {/* Role Select */}
          <div className="relative">
            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-white"
            >
              <option value="ALL">All Roles</option>
              <option value="Student">Student</option>
              <option value="Instructor">Instructor</option>
              <option value="Moderator">Moderator</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Status Select */}
          <div className="relative">
            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="col-span-3 sm:col-auto sm:ml-auto">
            <select
              value={userSortBy}
              onChange={(e) => setUserSortBy(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-white"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="spend">Sort: Highest Spend</option>
              <option value="courses">Sort: Most Courses</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Directory Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 p-8">
            <Users className="w-9 h-9 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No users found</p>
            <p className="text-xs text-slate-400 mt-1">
              {userSearchQuery ? `No results matching "${userSearchQuery}"` : 'No users match the selected filters.'}
            </p>
            {userSearchQuery && (
              <button
                type="button"
                onClick={() => setUserSearchQuery('')}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 cursor-pointer"
              >
                Reset Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* MOBILE VIEW (< md): Clean Touch-Friendly Cards */}
            <div className="md:hidden p-3 space-y-3">
              {filteredUsers.map((user, userIdx) => {
                const isActive = user.status === 'Active';
                const isPending = user.status === 'Pending';
                const contactNum = user.whatsapp || user.phone || '';
                const cleanDigits = contactNum.replace(/[^0-9]/g, '');
                const waPhone = cleanDigits.startsWith('880') ? cleanDigits : (cleanDigits.startsWith('0') ? '88' + cleanDigits : ('880' + cleanDigits));
                const canonicalCourses = getCanonicalCourses(user.enrolledCourses, { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA });
                const enrolledTitle = canonicalCourses.length > 0
                  ? (canonicalCourses[0] + (canonicalCourses.length > 1 ? ` (+${canonicalCourses.length - 1})` : ''))
                  : 'No enrolled courses';

                return (
                  <div 
                    key={user.id} 
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-2.5 transition-all"
                  >
                    {/* Row 1: Student Name, Course/Enrolled, Total Spent */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div 
                          className="font-bold text-slate-900 text-sm truncate cursor-pointer hover:text-blue-600"
                          onClick={() => setSelectedUserDetails && setSelectedUserDetails(user)}
                        >
                          {user.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {enrolledTitle}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-extrabold text-emerald-600 text-sm leading-tight">
                          {user.totalSpent > 0 ? `৳${user.totalSpent.toLocaleString()}` : '৳0'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          <span className="font-bold text-slate-500">#{getUserSerial(user, userIdx)}</span> · {formatOrderDateTime(user.createdAt || user.created_at || user.joinedDate).full}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Info Line (Batch · Role/College · Contact) */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl font-medium">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-slate-700">{user.hscBatch || user.batch || 'Not Set'}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500 truncate max-w-[120px]">{user.college || user.role || 'Student'}</span>
                      </div>
                      {contactNum ? (
                        <div className="flex items-center gap-1 shrink-0 font-mono text-slate-700">
                          <span>{contactNum}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(contactNum, 'Phone')}
                            className="p-0.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                            title="Copy Phone"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <a
                            href={`https://wa.me/${waPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp"
                            className="text-emerald-600 hover:text-emerald-700 p-0.5 inline-flex items-center"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md text-[10px] border border-amber-200/60">
                          Pending Contact
                        </span>
                      )}
                    </div>

                    {/* Row 3: Status Toggle & Minimal Actions */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(user.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border cursor-pointer transition-all ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60 hover:bg-emerald-100'
                            : isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-200/60 hover:bg-amber-100'
                            : 'bg-rose-50 text-rose-800 border-rose-200/60 hover:bg-rose-100'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-emerald-500' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                        }`} />
                        <span>{user.status === 'Active' ? 'Active' : user.status}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedUserDetails && setSelectedUserDetails(user)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer bg-white"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof setQuickEnrollUser === 'function') setQuickEnrollUser(user);
                            if (typeof setSelectedCourseToEnroll === 'function') setSelectedCourseToEnroll(courses[0]?.title || '');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-[#5d5bf6] text-[#5d5bf6] hover:text-white border border-indigo-200/80 font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                          title="Grant Course Access"
                        >
                          <GraduationCap className="w-3 h-3" />
                          <span>Grant Course</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditUser && handleOpenEditUser(user)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer bg-white"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser && handleDeleteUser(user.id, user.name)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer bg-white"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW (>= md): Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Student / Description</th>
                    <th className="py-3 px-4">Course / Product</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">College / Institution</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredUsers.map((user, userIdx) => {
                    const isActive = user.status === 'Active';
                    const isPending = user.status === 'Pending';
                    const contactNum = user.whatsapp || user.phone || '';
                    const cleanDigits = contactNum.replace(/[^0-9]/g, '');
                    const waPhone = cleanDigits.startsWith('880') ? cleanDigits : (cleanDigits.startsWith('0') ? '88' + cleanDigits : ('880' + cleanDigits));

                    // Enrolled courses display (Canonicalized - No Duplicates)
                    const canonicalCourses = getCanonicalCourses(user.enrolledCourses, { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA });

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors">
                        {/* # */}
                        <td className="py-3.5 px-4 text-xs font-mono font-bold text-slate-400 whitespace-nowrap">
                          #{getUserSerial(user, userIdx)}
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {(() => {
                            const dt = formatOrderDateTime(user.createdAt || user.created_at || user.joinedDate);
                            return (
                              <div>
                                <div className="font-semibold text-slate-800">{dt.date}</div>
                                {dt.time && (
                                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{dt.time}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Student / Description */}
                        <td className="py-3.5 px-4">
                          <div className="min-w-[150px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <div 
                                className="font-bold text-xs text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate max-w-[140px]"
                                onClick={() => setSelectedUserDetails && setSelectedUserDetails(user)}
                              >
                                {user.name}
                              </div>
                              {user.authProvider === 'google.com' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0" title="Signed up with Google OAuth">
                                  <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/><path fill="#FBBC05" d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.9 6.4C.7 8.8 0 10.8 0 12s.7 3.2 1.9 5.6l3.7-2.9z"/><path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z"/></svg>
                                  Google
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0" title="Email and Password Account">
                                  Email
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 font-normal truncate max-w-[200px]">
                              {user.email}
                            </div>
                          </div>
                        </td>

                        {/* Course / Product */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {canonicalCourses.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof setSelectedUserDetails === 'function') setSelectedUserDetails(user);
                                  if (typeof setUserTabInsideModal === 'function') setUserTabInsideModal('courses');
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-[#5d5bf6] hover:bg-indigo-100 border border-indigo-200/80 transition-all cursor-pointer shadow-2xs"
                                title={canonicalCourses.join('\n')}
                              >
                                <GraduationCap className="w-3.5 h-3.5 shrink-0 text-[#5d5bf6]" />
                                <span className="truncate max-w-[170px]">{canonicalCourses[0]}</span>
                                {canonicalCourses.length > 1 && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-[#5d5bf6] text-white">
                                    +{canonicalCourses.length - 1}
                                  </span>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof setQuickEnrollUser === 'function') setQuickEnrollUser(user);
                                  if (typeof setSelectedCourseToEnroll === 'function') setSelectedCourseToEnroll(courses[0]?.title || '');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-[#5d5bf6] hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-300 transition-colors cursor-pointer bg-transparent"
                              >
                                <span>+ Grant Course</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Batch (Method Pill Style) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {(user.hscBatch || user.batch) ? (
                            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                              {user.hscBatch || user.batch}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal italic text-[11px]">
                              Not set
                            </span>
                          )}
                        </td>

                        {/* College / Institution */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-medium text-slate-700 truncate max-w-[170px]" title={user.college || user.institution}>
                            {user.college || user.institution || (
                              <span className="text-slate-400 font-normal italic">Not specified</span>
                            )}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {contactNum ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                              <span className="font-mono">{contactNum}</span>
                              <button 
                                onClick={() => handleCopyText && handleCopyText(contactNum, 'Phone')} 
                                title="Copy number"
                                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer bg-transparent border-none"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <a
                                href={`https://wa.me/${waPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chat on WhatsApp"
                                className="text-emerald-600 hover:text-emerald-700 p-0.5"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                              Pending Profile
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleUserStatus && handleToggleUserStatus(user.id)}
                            title="Click to toggle status"
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium cursor-pointer border transition-colors ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70'
                            }`}
                          >
                            {user.status === 'Active' ? 'Approved' : user.status}
                          </button>
                        </td>

                        {/* Amount / Spent */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold text-xs text-emerald-700">
                          {user.totalSpent > 0 ? `+৳${user.totalSpent.toLocaleString()}` : '৳0'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof setQuickEnrollUser === 'function') setQuickEnrollUser(user);
                                if (typeof setSelectedCourseToEnroll === 'function') setSelectedCourseToEnroll(courses[0]?.title || '');
                              }}
                              title="Grant Course Access"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-[#5d5bf6] text-[#5d5bf6] hover:text-white border border-indigo-200/80 font-bold text-[11px] transition-all cursor-pointer shadow-2xs active:scale-95"
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>Grant Course</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedUserDetails && setSelectedUserDetails(user)}
                              title="View Profile & Enrollments"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditUser && handleOpenEditUser(user)}
                              title="Edit User Info"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUser && handleDeleteUser(user.id, user.name)}
                              title="Delete User"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Footer Count Bar */}
        <div className="p-3.5 bg-[#f8fafc] border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong className="text-slate-800">{filteredUsers.length}</strong> of <strong className="text-slate-800">{usersList.length}</strong> total registered accounts</span>
          <span className="text-[11px] text-slate-400">All user roles & status changes update in real time.</span>
        </div>
      </div>
    </div>
  );
}
