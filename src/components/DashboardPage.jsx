import React, { useState, useMemo, useRef, useEffect } from 'react';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isItemEnrolled } from '../utils/enrollmentService';
import { EXAM_CATEGORIES_METADATA } from '../data/examCategoriesData';

export default function DashboardPage({
  data = {},
  onNavigateHome,
  onNavigateCourse,
  onNavigateCoursePlayer,
  onNavigateExams,
  onNavigateLeaderboard,
  onNavigateStore,
  onNavigateAbout,
  onNavigateDevices,
  onNavigateOrders,
  onNavigatePolicies,
  onOpenAdmin,
  onLoginClick,
  onOpenProfile
}) {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'courses' | 'exams'
  const [searchQuery, setSearchQuery] = useState('');
  const [syncVersion, setSyncVersion] = useState(0);

  // Live real-time listener for enrollment approval and order sync
  useEffect(() => {
    const handleSync = () => {
      setSyncVersion(v => v + 1);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('eh:enrollment_approved', handleSync);
      window.addEventListener('eh:enrollment_updated', handleSync);
      window.addEventListener('eh:orders_updated', handleSync);
      window.addEventListener('storage', handleSync);
      window.addEventListener('eduhunters_data_updated', handleSync);
    }

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('eduhunters_sync_channel');
        bc.onmessage = (e) => {
          if (
            e.data?.type === 'ENROLLMENT_APPROVED' || 
            e.data?.type === 'ENROLLMENT_UPDATED' || 
            e.data?.type === 'DATA_SYNC'
          ) {
            handleSync();
          }
        };
      } catch (err) {}
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('eh:enrollment_approved', handleSync);
        window.removeEventListener('eh:enrollment_updated', handleSync);
        window.removeEventListener('eh:orders_updated', handleSync);
        window.removeEventListener('storage', handleSync);
        window.removeEventListener('eduhunters_data_updated', handleSync);
      }
      if (bc) bc.close();
    };
  }, []);

  const EXAM_BATCH_KEYS = useMemo(() => new Set(['sureshot', 'medical', 'rtds', 'english_master', 'gk_course', 'medilogy']), []);

  const tabRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // 1. Resolve All Enrolled Academic Courses (Excluding Exam Batches)
  const enrolledCourses = useMemo(() => {
    const allCourses = Array.isArray(data?.courses) ? data.courses : [];
    const filtered = allCourses.filter(course => {
      const isExam = course.isExamBatch ||
                     course.category === 'EXAM BATCH' ||
                     EXAM_BATCH_KEYS.has(course.id) ||
                     EXAM_BATCH_KEYS.has(course.slug) ||
                     EXAM_BATCH_KEYS.has(course.key);
      if (isExam) return false;
      return isItemEnrolled(course, currentUser, data, { forDashboard: true });
    });
    const seen = new Set();
    return filtered.filter(c => {
      const id = c.id || c.slug || c.title;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [data?.courses, currentUser, data, EXAM_BATCH_KEYS, syncVersion]);

  // 2. Resolve All Enrolled Exam Batches (Deduplicated)
  const enrolledBatches = useMemo(() => {
    const rawBatches = Array.isArray(data?.examBatches) && data.examBatches.length > 0
      ? data.examBatches
      : EXAM_CATEGORIES_METADATA;

    const filtered = rawBatches.filter(batch => isItemEnrolled(batch, currentUser, data, { forDashboard: true }));
    const seen = new Set();
    return filtered.filter(b => {
      const key = b.key || b.id || b.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data?.examBatches, currentUser, data, syncVersion]);

  // 3. Combined Filtered Items
  const displayedItems = useMemo(() => {
    let items = [];

    if (activeTab === 'all' || activeTab === 'courses') {
      const mappedCourses = enrolledCourses.map(c => ({
        ...c,
        itemType: 'course',
        displayTitle: c.title || c.name || 'Academic Course',
        displaySubtitle: c.instructor ? `Instructor: ${c.instructor}` : (c.category ? `Category: ${c.category}` : 'Video Lectures & Classes'),
        displayImage: c.image || c.thumbnailUrl || c.thumbnail || '/master_english_30_days.png',
        actionLabel: 'Continue Learning',
        secondaryLabel: 'Curriculum'
      }));
      items = [...items, ...mappedCourses];
    }

    if (activeTab === 'all' || activeTab === 'exams') {
      const mappedBatches = enrolledBatches.map(b => ({
        ...b,
        itemType: 'exam',
        displayTitle: b.title || b.name || 'Exam Batch',
        displaySubtitle: b.subtitle || b.tagline || 'Live Model Tests & Performance Analytics',
        displayImage: b.bannerImage || b.image || '/sureshot_banner.jpg',
        actionLabel: 'Enter Exam Batch',
        secondaryLabel: 'Routine & Tests'
      }));
      items = [...items, ...mappedBatches];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(it => 
        (it.displayTitle && it.displayTitle.toLowerCase().includes(q)) ||
        (it.displaySubtitle && it.displaySubtitle.toLowerCase().includes(q))
      );
    }

    return items;
  }, [activeTab, enrolledCourses, enrolledBatches, searchQuery]);

  const totalCount = enrolledCourses.length + enrolledBatches.length;

  // Dynamic sliding indicator measurement for active tab pill
  useEffect(() => {
    const updateIndicator = () => {
      const el = tabRefs.current[activeTab];
      if (el) {
        setIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          opacity: 1
        });
      }
    };
    updateIndicator();
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab, totalCount, enrolledCourses.length, enrolledBatches.length]);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#070102] text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Top Main Sticky Navbar */}
      <Navbar
        activePage="dashboard"
        siteSettings={data?.siteSettings}
        onNavigateHome={onNavigateHome}
        onNavigateDashboard={() => {}}
        onNavigateCourse={onNavigateCourse}
        onNavigateExams={onNavigateExams}
        onNavigateLeaderboard={onNavigateLeaderboard}
        onNavigateStore={onNavigateStore}
        onNavigateAbout={onNavigateAbout}
        onNavigateDevices={onNavigateDevices}
        onNavigateOrders={onNavigateOrders}
        onNavigatePolicies={onNavigatePolicies}
        onOpenAdmin={onOpenAdmin}
        onLoginClick={onLoginClick}
        onOpenProfile={onOpenProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        
        {/* Header Section */}
        <div className="mb-8 pb-6 border-b border-white/10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5 max-w-2xl leading-relaxed">
              {currentUser
                ? `Welcome back, ${currentUser.displayName || currentUser.email}. Access your enrolled lectures, exam batches, and preparation routine.`
                : 'Sign in to access your enrolled courses, lectures, and examination schedule.'}
            </p>
          </div>

          {/* Quick Metrics & Edit Profile (Clean & Minimal) */}
          {currentUser && (
            <div className="flex items-center flex-wrap gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (onOpenProfile) onOpenProfile();
                  else window.dispatchEvent(new CustomEvent('eh_open_profile_modal'));
                }}
                className={`px-4 py-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 active:scale-95 ${
                  isDark
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white'
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800 shadow-sm'
                }`}
                title="Edit your student profile"
              >
                <svg className="w-3.5 h-3.5 text-[#ff4d6d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
                <span className="text-xs font-semibold">Edit Profile</span>
              </button>

              <div className={`px-4 py-2.5 rounded-2xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Enrolled Courses</div>
                <div className="text-lg font-black text-[#e11438]">{enrolledCourses.length}</div>
              </div>

              <div className={`px-4 py-2.5 rounded-2xl border ${
                isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Exam Batches</div>
                <div className="text-lg font-black text-amber-500">{enrolledBatches.length}</div>
              </div>
            </div>
          )}
        </div>

        {/* Guest / Not Signed In State */}
        {!currentUser ? (
          <div className={`p-8 sm:p-12 rounded-3xl border text-center max-w-xl mx-auto my-12 ${
            isDark ? 'bg-[#100306] border-white/10' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-[#e11438]/10 text-[#e11438] border border-[#e11438]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
            <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed max-w-md mx-auto">
              Please sign in with your student email to view your active course enrollments, lecture player, and exam batches.
            </p>
            <button
              onClick={() => onLoginClick && onLoginClick()}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#e11438] to-[#ff2a55] text-white font-bold text-xs sm:text-sm hover:opacity-95 shadow-md active:scale-98 transition-all cursor-pointer border-none"
            >
              Sign In to Account
            </button>
          </div>
        ) : (
          <>
            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              {/* Tab Pills with Smooth Hardware-Accelerated Sliding Indicator */}
              <div className={`relative inline-flex items-center p-1 rounded-2xl border backdrop-blur-md transition-colors ${
                isDark ? 'bg-white/[0.04] border-white/10' : 'bg-gray-100 border-gray-200'
              }`}>
                {/* Active Sliding Pill Indicator */}
                <div 
                  className="absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-[#e11438] to-[#ff2a55] shadow-[0_2px_14px_rgba(225,20,56,0.45)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                  style={{
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                    opacity: indicatorStyle.opacity
                  }}
                />

                {[
                  { id: 'all', label: 'All', count: totalCount },
                  { id: 'courses', label: 'Courses', count: enrolledCourses.length },
                  { id: 'exams', label: 'Exam Batches', count: enrolledBatches.length }
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => { tabRefs.current[tab.id] = el; }}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative z-10 inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-200 cursor-pointer border-none bg-transparent select-none whitespace-nowrap ${
                        isActive
                          ? 'text-white font-bold'
                          : isDark
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span className="tracking-tight">{tab.label}</span>
                      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isDark
                            ? 'bg-white/[0.06] text-gray-400'
                            : 'bg-black/[0.06] text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Minimal Search Input */}
              {totalCount > 0 && (
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search enrolled items..."
                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none transition-colors border ${
                      isDark
                        ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-500 focus:border-[#e11438]'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#e11438]'
                    }`}
                  />
                  <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              )}
            </div>

            {/* Enrolled Items Grid */}
            {displayedItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedItems.map((item, idx) => {
                  const isCourse = item.itemType === 'course';
                  const identifier = item.id || item.slug || item.key;

                  return (
                    <div
                      key={`${item.itemType}_${identifier || idx}`}
                      className={`group rounded-3xl border overflow-hidden flex flex-col transition-all duration-200 hover:translate-y-[-2px] ${
                        isDark
                          ? 'bg-[#100306]/70 border-white/10 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                      }`}
                    >
                      {/* Card Thumbnail */}
                      <div className="relative aspect-video w-full overflow-hidden bg-black/40 shrink-0">
                        <img
                          src={item.displayImage}
                          alt={item.displayTitle}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = isCourse ? '/master_english_30_days.png' : '/sureshot_banner.jpg';
                          }}
                        />
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-base sm:text-lg font-bold leading-snug line-clamp-2 mb-1.5 group-hover:text-[#e11438] transition-colors">
                            {item.displayTitle}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                            {item.displaySubtitle}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-white/10 flex items-center">
                          {isCourse ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateCoursePlayer) {
                                  onNavigateCoursePlayer(identifier);
                                } else if (onNavigateCourse) {
                                  onNavigateCourse(identifier);
                                }
                              }}
                              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#e11438] to-[#ff2a55] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer border-none"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                              <span>Continue Learning</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onNavigateExams && onNavigateExams(item.key || identifier)}
                              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#e11438] to-[#ff2a55] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer border-none"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                <path d="m9 14 2 2 4-4" />
                              </svg>
                              <span>Enter Exam Batch</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty Enrollments State */
              <div className={`p-10 sm:p-14 rounded-3xl border text-center max-w-lg mx-auto my-12 ${
                isDark ? 'bg-[#100306]/50 border-white/10' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 text-gray-400 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                    <line x1="10" y1="6" x2="16" y2="6" />
                    <line x1="10" y1="10" x2="16" y2="10" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-1.5">No Active Enrollments</h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  {searchQuery.trim()
                    ? 'No enrolled courses or exam batches match your search criteria.'
                    : "You haven't enrolled in any courses or exam batches yet. Explore our course catalog to start learning."}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateCourse && onNavigateCourse()}
                    className="px-5 py-2.5 rounded-full bg-[#e11438] hover:bg-[#ff2a55] text-white font-bold text-xs transition-colors cursor-pointer border-none"
                  >
                    Explore Courses
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateExams && onNavigateExams()}
                    className={`px-5 py-2.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                      isDark ? 'bg-white/[0.04] border-white/10 text-gray-300 hover:text-white' : 'bg-gray-100 border-gray-300 text-gray-800'
                    }`}
                  >
                    Exam Batches
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className={`border-t py-8 text-center text-xs transition-colors ${
        isDark ? 'bg-[#060102] border-white/10 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-600'
      }`}>
        <p className="tracking-wide">
          &copy; {new Date().getFullYear()} Edu Hunters. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
