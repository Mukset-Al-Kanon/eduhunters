import React from 'react';
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Users,
  Check,
  Plus,
  Search,
  X,
  Edit2,
  Copy,
  Eye,
  ChevronDown,
  Filter,
  RefreshCw,
  Trash2
} from 'lucide-react';

export default function AdminOverviewTab({
  setActiveTab,
  dashboardAnalytics = {},
  dashboardMainTab,
  setDashboardMainTab,
  pendingCount = 0,
  accountingTotals = {},
  accounting = {},
  handleVerifyAllPending,
  courses = [],
  setEditingStudentId,
  setNewStudentData,
  setShowAddStudentModal,
  verificationSearchQuery,
  setVerificationSearchQuery,
  verificationFilter,
  setVerificationFilter,
  verificationList = [],
  editingTrxAmountId,
  setEditingTrxAmountId,
  editingTrxAmountVal,
  setEditingTrxAmountVal,
  handleSaveTrxAmount,
  handleCopyText,
  copiedTrxId,
  copiedPhone,
  handleApproveAndEnrollStudent,
  handleRejectTrx,
  setSelectedTxDetails,
  handleUpdateTrxStatus,
  studentSearchQuery,
  setStudentSearchQuery,
  studentBatchFilter,
  setStudentBatchFilter,
  handleManualRefreshUsers,
  isRefreshingUsers,
  filteredStudents = [],
  enrolledStudents = [],
  handleToggleStudentStatus,
  handleDeleteStudent
}) {
  return (
    <div className="space-y-6">
      {/* TOP TITLE & THREE CANDY PASTEL CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard
          </h2>
        </div>

        {/* 1. TOP ACTIVITY STATS: TODAY'S ACTIVITY & LIVE STUDENT METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* CARD 1: Joined Today */}
          <div 
            onClick={() => setActiveTab('users')}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">আজকের জয়েনিং</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                Today
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-3">
              {dashboardAnalytics.joinedTodayCount || 0}
            </div>
          </div>

          {/* CARD 2: Enrolled Today */}
          <div 
            onClick={() => setActiveTab('accounting')}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">আজকের এনরোলমেন্ট</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                <TrendingUp className="w-3 h-3" />
                Today
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-none mt-3">
              {dashboardAnalytics.enrollmentsTodayCount || 0}
            </div>
          </div>

          {/* CARD 3: Pending Verification */}
          <div 
            onClick={() => setDashboardMainTab('verification')}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">পেন্ডিং ভেরিফিকেশন</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="Needs review" />
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight leading-none mt-3">
              {pendingCount}
            </div>
          </div>

          {/* CARD 4: Total Active Students */}
          <div 
            onClick={() => setDashboardMainTab('students')}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">মোট সক্রিয় শিক্ষার্থী</span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
                Total
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-3">
              {(dashboardAnalytics.totalActiveStudents || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* 2. REVENUE PERFORMANCE MATRIX (আয় ও অর্থ বিবরণী: আজ, ৭ দিন, ৩০ দিন, মোট লাভ) */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>আয় ও অর্থ বিবরণী (Financial Revenue Matrix)</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                সময় অনুযায়ী আয়ের লাইভ পরিসংখ্যান
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('accounting')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#5d5bf6] hover:text-[#4b49e0] transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              <span>লেজার দেখুন</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
            {/* Today Revenue */}
            <div 
              onClick={() => setActiveTab('accounting')}
              className="bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">আজকের আয়</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">আজ</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight leading-none mt-2.5">
                ৳{(dashboardAnalytics.todayRevenue || 0).toLocaleString()}
              </div>
            </div>

            {/* Last 7 Days Revenue */}
            <div 
              onClick={() => setActiveTab('accounting')}
              className="bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">গত ৭ দিনের আয়</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">৭ দিন</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight leading-none mt-2.5">
                ৳{(dashboardAnalytics.revenue7Days || 0).toLocaleString()}
              </div>
            </div>

            {/* Last 30 Days Revenue */}
            <div 
              onClick={() => setActiveTab('accounting')}
              className="bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">গত ১ মাসের আয়</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">৩০ দিন</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-indigo-600 tracking-tight leading-none mt-2.5">
                ৳{(dashboardAnalytics.revenue30Days || 0).toLocaleString()}
              </div>
            </div>

            {/* Net Profit All-Time */}
            <div 
              onClick={() => setActiveTab('accounting')}
              className="bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl p-3.5 sm:p-4 border border-slate-200/70 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">সর্বমোট নেট প্রফিট</span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-100 text-violet-800">মোট</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none mt-2.5">
                ৳{(accountingTotals.netProfit || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD CONTENT: VERIFICATION HUB & STUDENT MANAGEMENT */}
      <div className="w-full">
        {/* UNIFIED SaaS CARD CONTAINER (CLEAN, MINIMAL & PROFESSIONAL) */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          
          {/* SLEEK SAAS HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-white">
            {/* Segmented Pill Tabs */}
            <div className="flex items-center gap-1 bg-[#f4f6fa] p-1 sm:p-1.5 rounded-2xl border border-slate-200/70 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setDashboardMainTab('verification')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
                  dashboardMainTab === 'verification'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${dashboardMainTab === 'verification' ? 'text-[#5d5bf6]' : 'text-slate-400'}`} />
                <span><span className="hidden sm:inline">Payment </span>Verifications</span>
                {pendingCount > 0 ? (
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                    {pendingCount}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">
                    0
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDashboardMainTab('students')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
                  dashboardMainTab === 'students'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${dashboardMainTab === 'students' ? 'text-[#5d5bf6]' : 'text-slate-400'}`} />
                <span>Student<span className="hidden sm:inline"> Database</span></span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">
                  {enrolledStudents.length}
                </span>
              </button>
            </div>

            {/* Header Right Action */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {dashboardMainTab === 'verification' ? (
                <>
                  {pendingCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleVerifyAllPending}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs shadow-emerald-600/20 cursor-pointer border-none transition-all active:scale-95"
                      title="Approve and enroll all pending transactions"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve All Pending ({pendingCount})</span>
                    </button>
                  ) : (
                    <div className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>All Caught Up</span>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingStudentId(null);
                    setNewStudentData({
                      name: '',
                      phone: '',
                      email: '',
                      batch: 'HSC 26',
                      courseName: courses[0]?.title || 'Mastering Text Book Combo HSC 25,26,27',
                      status: 'Active'
                    });
                    setShowAddStudentModal(true);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/20 cursor-pointer border-none transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Student</span>
                </button>
              )}
            </div>
          </div>

          {/* CARD BODY */}
          <div className="p-3 sm:p-5 space-y-4">
            
            {/* TAB 1: PAYMENT & TRXID VERIFICATION HUB */}
            {dashboardMainTab === 'verification' && (
              <div className="space-y-4">
                
                {/* Search Bar & Filter Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 w-full max-w-sm">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search by TrxID, name, or phone..."
                      value={verificationSearchQuery}
                      onChange={(e) => setVerificationSearchQuery(e.target.value)}
                      className="w-full bg-[#f4f6fa] border border-slate-200/80 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] focus:ring-2 focus:ring-[#5d5bf6]/15 transition-all font-medium placeholder:text-slate-400"
                    />
                    {verificationSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setVerificationSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer text-xs"
                        title="Clear"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Status Filter Tabs (Segmented Controller - Horizontally Scrollable on Mobile) */}
                  <div className="flex items-center gap-1 bg-[#f4f6fa] p-1 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200/60 overflow-x-auto no-scrollbar w-full sm:w-auto">
                    {[
                      { key: 'PENDING', label: 'Pending', count: (accounting?.transactions || []).filter(t => {
                        const s = (t.status || '').toLowerCase();
                        return s === 'pending' || (s !== 'completed' && s !== 'paid' && s !== 'rejected');
                      }).length },
                      { key: 'ALL', label: 'All', count: (accounting?.transactions || []).filter(t => (t.type || '').toUpperCase() === 'INCOME' || !t.type).length },
                      { key: 'COMPLETED', label: 'Verified', count: (accounting?.transactions || []).filter(t => {
                        const s = (t.status || '').toLowerCase();
                        return s === 'completed' || s === 'paid' || Boolean(t.isApproved);
                      }).length },
                      { key: 'REJECTED', label: 'Rejected', count: (accounting?.transactions || []).filter(t => (t.status || '').toLowerCase() === 'rejected').length },
                    ].map((tab) => {
                      const isActive = verificationFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setVerificationFilter(tab.key)}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer border-none flex items-center gap-1.5 text-xs whitespace-nowrap select-none ${
                            isActive
                              ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                              : 'text-slate-500 hover:text-slate-800 bg-transparent'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                            tab.key === 'PENDING' && tab.count > 0 
                              ? 'bg-amber-100 text-amber-800' 
                              : isActive ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/70 text-slate-500'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Transactions Verification List / Table */}
                {verificationList.length === 0 ? (
                  <div className="py-12 text-center bg-[#f4f6fa]/60 rounded-2xl border border-dashed border-slate-200 p-8">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-white shadow-2xs text-slate-400 flex items-center justify-center mb-3">
                      <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No payment records found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {verificationSearchQuery ? `No matching transaction for "${verificationSearchQuery}".` : 'There are no transactions in this category.'}
                    </p>
                    {verificationSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setVerificationSearchQuery('')}
                        className="mt-3 text-xs font-bold text-slate-700 hover:text-slate-900 border-none bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                      >
                        Reset Search
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* MOBILE VIEW (< md): Responsive clean touch-friendly card list */}
                    <div className="md:hidden space-y-3">
                      {verificationList.map((tx) => {
                        const st = (tx.status || '').toLowerCase();
                        const isPending = st === 'pending' || (st !== 'completed' && st !== 'paid' && st !== 'rejected');
                        const isCompleted = st === 'completed' || st === 'paid' || Boolean(tx.isApproved);
                        const methodLower = (tx.method || '').toLowerCase();

                        return (
                          <div 
                            key={tx.id}
                            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2.5 transition-all"
                          >
                            {/* Row 1: Student Name, Course, Amount */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 text-sm truncate">
                                  {tx.studentName || tx.customer || 'New Student'}
                                </div>
                                <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                                  {tx.itemTitle || tx.category || 'Course Enrollment'}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {editingTrxAmountId === tx.id ? (
                                  <div className="flex items-center gap-1 mt-1 justify-end">
                                    <input
                                      type="number"
                                      value={editingTrxAmountVal}
                                      onChange={(e) => setEditingTrxAmountVal(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTrxAmount(tx.id);
                                        if (e.key === 'Escape') setEditingTrxAmountId(null);
                                      }}
                                      className="w-16 px-1.5 py-0.5 text-xs font-bold border border-[#5d5bf6] rounded-md bg-white text-slate-800"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveTrxAmount(tx.id)}
                                      className="p-1 rounded-md bg-emerald-600 text-white cursor-pointer border-none"
                                      title="Save"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingTrxAmountId(null)}
                                      className="p-1 rounded-md bg-slate-200 text-slate-600 cursor-pointer border-none"
                                      title="Cancel"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 justify-end">
                                    <div className="font-black text-slate-900 text-base leading-tight">
                                      ৳{Number(tx.amount || 0).toLocaleString()}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingTrxAmountId(tx.id);
                                        setEditingTrxAmountVal(String(tx.amount || 0));
                                      }}
                                      className="p-0.5 text-slate-400 hover:text-[#5d5bf6] bg-transparent border-none cursor-pointer"
                                      title="Edit Amount"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                                <div className="text-[10px] text-slate-400 mt-0.5">{tx.date}</div>
                              </div>
                            </div>

                            {/* Row 2: Clean Info Line (Phone · Method · TrxID) */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl font-medium">
                              <span className="font-mono text-slate-700">{tx.studentPhone || tx.phone || 'N/A'}</span>
                              <span className="text-slate-300">·</span>
                              <span className={`font-bold ${
                                methodLower.includes('bkash') ? 'text-pink-600' :
                                methodLower.includes('nagad') ? 'text-amber-600' : 'text-slate-700'
                              }`}>
                                {tx.method || 'bKash'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(tx.trxId, 'trxId')}
                                className="font-mono font-bold text-slate-800 hover:text-blue-600 border-none bg-transparent cursor-pointer p-0 text-xs inline-flex items-center gap-1"
                                title="Click to copy TrxID"
                              >
                                <span>{tx.trxId || 'N/A'}</span>
                                {copiedTrxId === tx.trxId ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400" />
                                )}
                              </button>
                            </div>

                            {/* Row 3: Status Badge & Minimal Actions */}
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border ${
                                isPending
                                  ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                                  : isCompleted
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                                  : 'bg-rose-50 text-rose-800 border-rose-200/60'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isPending ? 'bg-amber-500 animate-pulse' : isCompleted ? 'bg-emerald-500' : 'bg-rose-500'
                                }`} />
                                <span>{isPending ? 'Pending' : isCompleted ? 'Approved' : 'Rejected'}</span>
                              </span>

                              <div className="flex items-center gap-1.5">
                                {isPending && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveAndEnrollStudent(tx)}
                                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer border-none active:scale-95"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectTrx(tx.id)}
                                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer bg-white"
                                      title="Reject"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setSelectedTxDetails(tx)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer bg-white"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* DESKTOP VIEW (>= md): Full Table */}
                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                            <th className="py-2.5 pl-3.5 pr-2">Student & Contact</th>
                            <th className="py-2.5 px-2">Course / Batch</th>
                            <th className="py-2.5 px-2">Payment & TrxID</th>
                            <th className="py-2.5 px-2">Amount</th>
                            <th className="py-2.5 px-2">Status</th>
                            <th className="py-2.5 pr-3.5 pl-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {verificationList.map((tx) => {
                            const st = (tx.status || '').toLowerCase();
                            const isPending = st === 'pending' || (st !== 'completed' && st !== 'paid' && st !== 'rejected');
                            const isCompleted = st === 'completed' || st === 'paid' || Boolean(tx.isApproved);
                            const methodLower = (tx.method || '').toLowerCase();
                            const initialChar = (tx.studentName || tx.customer || 'S').trim()[0] || 'S';

                            return (
                              <tr 
                                key={tx.id}
                                className={`hover:bg-slate-50/70 transition-colors ${
                                  isPending ? 'bg-amber-50/20' : ''
                                }`}
                              >
                                {/* Col 1: Student Name & Contact */}
                                <td className="py-2.5 pl-3.5 pr-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-[#5d5bf6]/10 border border-[#5d5bf6]/20 text-[#5d5bf6] font-black text-xs flex items-center justify-center shrink-0 select-none">
                                      {initialChar}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-extrabold text-slate-900 text-xs leading-snug truncate max-w-[120px]">
                                        {tx.studentName || tx.customer || 'New Student'}
                                      </div>
                                      <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px] mt-0.5">
                                        <span>{tx.studentPhone || tx.phone || 'N/A'}</span>
                                        {(tx.studentPhone || tx.phone) && (
                                          <button
                                            type="button"
                                            onClick={() => handleCopyText(tx.studentPhone || tx.phone, 'phone')}
                                            className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer p-0.5"
                                            title="Copy phone number"
                                          >
                                            {copiedPhone === (tx.studentPhone || tx.phone) ? (
                                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                                            ) : (
                                              <Copy className="w-2.5 h-2.5" />
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Col 2: Course / Batch & Date */}
                                <td className="py-2.5 px-2 max-w-[150px]">
                                  <div className="font-bold text-slate-800 truncate text-[11px]" title={tx.itemTitle}>
                                    {tx.itemTitle || tx.category || 'Course Enrollment'}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {tx.date}
                                  </div>
                                </td>

                                {/* Col 3: Payment Method & TrxID with 1-click Copy */}
                                <td className="py-2.5 px-2 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider border select-none ${
                                      methodLower.includes('bkash') ? 'bg-[#d12053]/10 text-[#d12053] border-[#d12053]/25' :
                                      methodLower.includes('nagad') ? 'bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/25' :
                                      methodLower.includes('rocket') ? 'bg-[#7b1fa2]/10 text-[#7b1fa2] border-[#7b1fa2]/25' :
                                      'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}>
                                      {tx.method || 'Online'}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(tx.trxId, 'trxId')}
                                      className="font-mono font-bold text-[11px] text-slate-800 bg-[#f4f6fa] hover:bg-slate-200/90 px-2 py-0.5 rounded-lg border border-slate-200/80 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                      title="Click to copy TrxID"
                                    >
                                      <span>{tx.trxId || 'N/A'}</span>
                                      {copiedTrxId === tx.trxId ? (
                                        <span className="text-emerald-600 text-[9px] font-bold flex items-center">
                                          <Check className="w-2.5 h-2.5" />
                                        </span>
                                      ) : (
                                        <Copy className="w-2.5 h-2.5 text-slate-400 hover:text-slate-700" />
                                      )}
                                    </button>
                                  </div>
                                </td>

                                {/* Col 4: Amount (Editable Inline) */}
                                <td className="py-2.5 px-2 font-black text-slate-900 text-xs whitespace-nowrap">
                                  {editingTrxAmountId === tx.id ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-400 text-xs font-bold">৳</span>
                                      <input
                                        type="number"
                                        value={editingTrxAmountVal}
                                        onChange={(e) => setEditingTrxAmountVal(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveTrxAmount(tx.id);
                                          if (e.key === 'Escape') setEditingTrxAmountId(null);
                                        }}
                                        className="w-20 px-2 py-1 text-xs font-bold border border-[#5d5bf6] rounded-md focus:outline-none bg-white text-slate-800"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveTrxAmount(tx.id)}
                                        className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer border-none"
                                        title="Save Amount"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingTrxAmountId(null)}
                                        className="p-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-600 cursor-pointer border-none"
                                        title="Cancel"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 group">
                                      <span>৳{Number(tx.amount || 0).toLocaleString()}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingTrxAmountId(tx.id);
                                          setEditingTrxAmountVal(String(tx.amount || 0));
                                        }}
                                        className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-[#5d5bf6] transition-colors cursor-pointer border-none"
                                        title="Edit Amount"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>

                                {/* Col 5: Status Badge (Interactive Status Dropdown) */}
                                <td className="py-2.5 px-2 whitespace-nowrap">
                                  <div className="relative inline-block">
                                    <select
                                      value={tx.status || 'Pending'}
                                      onChange={(e) => handleUpdateTrxStatus(tx, e.target.value)}
                                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer outline-none transition-all appearance-none pr-6 ${
                                        isPending
                                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                          : isCompleted
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                          : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                      }`}
                                      title="Click to change status (Pending / Approved / Rejected)"
                                    >
                                      <option value="Pending">⏳ Pending</option>
                                      <option value="Completed">✓ Approved</option>
                                      <option value="Rejected">✕ Rejected</option>
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </div>
                                </td>

                                {/* Col 6: Action Buttons */}
                                <td className="py-2.5 pr-3.5 pl-2 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isPending ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleApproveAndEnrollStudent(tx)}
                                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-2xs shadow-emerald-600/20 flex items-center gap-1 cursor-pointer border-none active:scale-95"
                                          title="Approve Transaction & Enroll Student"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Approve</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleRejectTrx(tx.id)}
                                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer bg-white"
                                          title="Reject Transaction"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateTrxStatus(tx, isCompleted ? 'Pending' : 'Completed')}
                                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                          isCompleted 
                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
                                            : 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                                        }`}
                                        title="Click to toggle status"
                                      >
                                        {isCompleted ? '✓ Approved' : '✕ Rejected'}
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => setSelectedTxDetails(tx)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer bg-white"
                                      title="View Full Details & Receipt"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
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
              </div>
            )}

            {/* TAB 2: ACTIVE ENROLLED STUDENTS DATABASE TABLE */}
            {dashboardMainTab === 'students' && (
              <div className="space-y-4">
                {/* Search Bar & Batch Filter Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search by name, phone or roll ID..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all font-medium placeholder:text-slate-400"
                    />
                    {studentSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setStudentSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 shrink-0">
                    <Filter className="w-3 h-3 text-slate-400" />
                    <select 
                      value={studentBatchFilter} 
                      onChange={(e) => setStudentBatchFilter(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="ALL">All Batches</option>
                      <option value="HSC 25">HSC 25</option>
                      <option value="HSC 26">HSC 26</option>
                      <option value="HSC 27">HSC 27</option>
                      <option value="HSC 28">HSC 28</option>
                      <option value="Medical 25">Medical 25</option>
                      <option value="Engineering">Engineering</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleManualRefreshUsers}
                    disabled={isRefreshingUsers}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80 shrink-0 cursor-pointer transition-all active:scale-95 disabled:opacity-60"
                    title="Sync Student Database from Cloud"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingUsers ? 'animate-spin text-[#5d5bf6]' : 'text-slate-500'}`} />
                    <span className="hidden sm:inline">{isRefreshingUsers ? 'Syncing...' : 'Sync Database'}</span>
                  </button>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="py-12 text-center bg-[#f4f6fa]/60 rounded-2xl border border-dashed border-slate-200 p-8">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-white shadow-2xs text-slate-400 flex items-center justify-center mb-3">
                      <Users className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">No students found</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {studentSearchQuery ? `No matching students for "${studentSearchQuery}".` : 'No enrolled students match the filter.'}
                    </p>
                    {studentSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setStudentSearchQuery('')}
                        className="mt-3 text-xs font-bold text-slate-700 hover:text-slate-900 border-none bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors"
                      >
                        Reset Search
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* MOBILE VIEW (< md): Touch-Friendly Clean Student Cards */}
                    <div className="md:hidden space-y-3">
                      {filteredStudents.map((st) => (
                        <div key={st.id} className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs space-y-3">
                          {/* Top: Avatar, Name, Batch */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img 
                                src={st.avatar} 
                                alt={st.name} 
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-900 text-xs truncate">{st.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{st.studentId}</div>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                              st.batch.includes('Medical') ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              st.batch.includes('Engineering') ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {st.batch}
                            </span>
                          </div>

                          {/* Enrolled Course & Contact */}
                          <div className="bg-[#f8fafc] rounded-xl p-2.5 border border-slate-100 flex flex-col gap-1.5">
                            <div className="text-[11px] font-bold text-slate-800 truncate" title={st.courseName}>
                              {st.courseName}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Joined: {st.joinedDate}</span>
                              <div className="flex items-center gap-1 font-mono text-slate-600 font-semibold">
                                <span>{st.phone}</span>
                                {st.phone && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(st.phone, 'phone')}
                                    className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer p-0.5"
                                    title="Copy phone"
                                  >
                                    {copiedPhone === st.phone ? (
                                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Bottom Row: Status Toggle & Action Buttons */}
                          <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleToggleStudentStatus(st.id)}
                              title="Click to toggle status (Active <-> Pending)"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
                                st.status === 'Active' 
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80 hover:bg-emerald-100' 
                                  : 'text-amber-700 bg-amber-50 border-amber-200/80 hover:bg-amber-100'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span>{st.status}</span>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button 
                                type="button" 
                                onClick={() => {
                                  setEditingStudentId(st.id);
                                  setNewStudentData({
                                    name: st.name,
                                    phone: st.phone,
                                    email: st.email || '',
                                    batch: st.batch,
                                    courseName: st.courseName,
                                    status: st.status
                                  });
                                  setShowAddStudentModal(true);
                                }}
                                title="Edit Student Info"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors cursor-pointer bg-white"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleDeleteStudent(st.id)}
                                title="Permanently Delete Student"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer bg-white"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* DESKTOP VIEW (>= md): Full Table */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80">
                      <table className="w-full text-left border-collapse min-w-full">
                        <thead>
                          <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                            <th className="py-2.5 px-3 rounded-l-xl">Student Name</th>
                            <th className="py-2.5 px-3">Enrolled Course</th>
                            <th className="py-2.5 px-3">Batch</th>
                            <th className="py-2.5 px-3">Phone / Contact</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-center rounded-r-xl">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {filteredStudents.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={st.avatar} 
                                    alt={st.name} 
                                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-900 leading-tight">{st.name}</div>
                                    <div className="text-[11px] text-slate-400 font-mono">{st.studentId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-medium text-slate-800 line-clamp-1 max-w-[200px]" title={st.courseName}>
                                  {st.courseName}
                                </div>
                                <div className="text-[10px] text-slate-400">{st.joinedDate}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                                  st.batch.includes('Medical') ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  st.batch.includes('Engineering') ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                  'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {st.batch}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                                <div>{st.phone}</div>
                                <div className="text-[10px] text-slate-400">{st.email}</div>
                              </td>
                              <td className="py-3 px-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStudentStatus(st.id)}
                                  title="Click to toggle status (Active <-> Pending)"
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all ${
                                    st.status === 'Active' 
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80 hover:bg-emerald-100' 
                                      : 'text-amber-700 bg-amber-50 border-amber-200/80 hover:bg-amber-100'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                  <span>{st.status}</span>
                                </button>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setEditingStudentId(st.id);
                                      setNewStudentData({
                                        name: st.name,
                                        phone: st.phone,
                                        email: st.email || '',
                                        batch: st.batch,
                                        courseName: st.courseName,
                                        status: st.status
                                      });
                                      setShowAddStudentModal(true);
                                    }}
                                    title="Edit Student Info"
                                    className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => handleDeleteStudent(st.id)}
                                    title="Permanently Delete Student"
                                    className="p-1.5 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
