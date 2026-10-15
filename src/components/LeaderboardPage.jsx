import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft,
  Search,
  Sparkles,
  Trophy,
  ChevronRight,
  ChevronDown,
  Flame,
  Award,
  Clock,
  Layers,
  BarChart3,
  X,
  Check,
  Zap,
  BookOpen
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { 
  fetchLessonLeaderboard, 
  fetchCourseLeaderboard, 
  checkQuizLiveStatus 
} from '../services/quizService';
import { isItemEnrolled, normalizeStr } from '../utils/enrollmentService';

// ============================================================================
// 1. SCALLOPED ROSETTE MEDAL BADGE (12-Point Flower Sunburst Ribbon Medal)
// Exact match to reference mockup's pinned rank badges on avatars 1, 2, and 3
// ============================================================================
function RosetteBadge({ rank }) {
  const configs = {
    1: {
      gradId: 'gold-rosette-grad',
      fill: 'url(#gold-rosette-grad)',
      textColor: 'text-amber-950',
      strokeColor: '#fffbeb',
      glow: 'shadow-[0_4px_14px_rgba(245,158,11,0.7)]'
    },
    2: {
      gradId: 'silver-rosette-grad',
      fill: 'url(#silver-rosette-grad)',
      textColor: 'text-slate-900',
      strokeColor: '#ffffff',
      glow: 'shadow-[0_4px_12px_rgba(203,213,225,0.6)]'
    },
    3: {
      gradId: 'bronze-rosette-grad',
      fill: 'url(#bronze-rosette-grad)',
      textColor: 'text-amber-50',
      strokeColor: '#ffedd5',
      glow: 'shadow-[0_4px_12px_rgba(234,88,12,0.6)]'
    }
  };

  const c = configs[rank] || configs[1];

  return (
    <div className={`relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 ${c.glow} shrink-0 select-none`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id="gold-rosette-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="silver-rosette-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="bronze-rosette-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>
        </defs>

        {/* 12-Lobed Scalloped Petal Rosette Path */}
        <path
          d="M 50,6 
             C 55,6 58,13 63,14 
             C 68,15 74,10 78,15 
             C 82,19 80,26 84,31 
             C 88,36 95,39 96,45 
             C 97,51 92,56 92,62 
             C 92,68 97,73 96,79 
             C 94,85 87,88 84,93 
             C 80,98 81,105 77,109 
             C 72,112 66,108 61,109 
             C 56,110 54,117 50,117 
             C 46,117 44,110 39,109 
             C 34,108 28,112 23,109 
             C 19,105 20,98 16,93 
             C 13,88 6,85 4,79 
             C 3,73 8,68 8,62 
             C 8,56 3,51 4,45 
             C 5,39 12,36 16,31 
             C 20,26 18,19 22,15 
             C 26,10 32,15 37,14 
             C 42,13 45,6 50,6 Z"
          transform="scale(0.8) translate(12, -4)"
          fill={c.fill}
          stroke={c.strokeColor}
          strokeWidth="2.5"
        />
      </svg>

      {/* Rosette Medal Number */}
      <span className={`absolute font-black text-[11px] sm:text-xs leading-none ${c.textColor} drop-shadow-xs`}>
        {rank}
      </span>
    </div>
  );
}

// ============================================================================
// 2. TOKEN PILL (Points number)
// Clean marks pill without any "T" icon as requested
// ============================================================================
function TokenPill({ points, size = 'sm' }) {
  const isLarge = size === 'lg';
  return (
    <div className={`inline-flex items-center justify-center rounded-full bg-[#270811]/95 border border-[#e11438]/40 shadow-[0_3px_10px_rgba(0,0,0,0.6)] text-white font-mono font-bold select-none ${
      isLarge ? 'px-3.5 py-0.5 text-xs' : 'px-3 py-0.5 text-[11px]'
    }`}>
      <span className="tracking-tight text-white/95">{points}</span>
    </div>
  );
}

// Helper to format total seconds into minimal, compact minute & second representation (e.g. 24m 15s)
function formatMinimalTime(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

// Helper to extract clean lesson list from any course curriculum
function getCourseLessons(course) {
  const list = [];
  if (course?.curriculum && Array.isArray(course.curriculum)) {
    course.curriculum.forEach((sec, sIdx) => {
      const chapters = Array.isArray(sec.chapters) ? sec.chapters : [];
      chapters.forEach((ch, cIdx) => {
        const lessons = Array.isArray(ch.lessons) ? ch.lessons : [];
        lessons.forEach((les, lIdx) => {
          if (les && typeof les === 'object') {
            const fullTitle = les.title || `Class ${lIdx + 1}`;
            const cleanShort = fullTitle
              .replace(/^Chapter\s*\d+[\s:.-]*/i, '')
              .replace(/^Class\s*\d+[\s:.-]*/i, '')
              .trim();

            list.push({
              lessonId: les.id || `les-${sIdx}-${cIdx}-${lIdx}`,
              title: fullTitle,
              shortTitle: cleanShort || fullTitle,
              chapterName: ch.name || `Chapter ${cIdx + 1}`,
              quiz: les.quiz || null
            });
          }
        });
      });

      if (Array.isArray(sec.lessons)) {
        sec.lessons.forEach((les, lIdx) => {
          if (les && typeof les === 'object') {
            const lid = les.id || `les-${sIdx}-${lIdx}`;
            if (!list.some(item => item.lessonId === lid)) {
              const fullTitle = les.title || `Class ${lIdx + 1}`;
              const cleanShort = fullTitle
                .replace(/^Chapter\s*\d+[\s:.-]*/i, '')
                .replace(/^Class\s*\d+[\s:.-]*/i, '')
                .trim();
              list.push({
                lessonId: lid,
                title: fullTitle,
                shortTitle: cleanShort || fullTitle,
                chapterName: sec.name || `Section ${sIdx + 1}`,
                quiz: les.quiz || null
              });
            }
          }
        });
      }
    });
  }

  // Realistic curriculum fallback for Finishing Touch series if empty in localStorage
  if (list.length === 0) {
    const cTitle = (course?.title || course?.name || '').toLowerCase();
    if (cTitle.includes('physics') || cTitle.includes('finishing')) {
      return [
        { lessonId: 'les-01', title: 'Chapter 1: ভৌতজগৎ ও পরিমাপ', shortTitle: 'ভৌতজগৎ ও পরিমাপ', chapterName: 'অধ্যায় ০১' },
        { lessonId: 'les-02', title: 'Chapter 2: ভেক্টর', shortTitle: 'ভেক্টর', chapterName: 'অধ্যায় ০২' },
        { lessonId: 'les-03', title: 'Chapter 3: গতিবিদ্যা', shortTitle: 'গতিবিদ্যা', chapterName: 'অধ্যায় ০৩' },
        { lessonId: 'les-04', title: 'Chapter 4: নিউটনীয় বলবিদ্যা', shortTitle: 'নিউটনীয় বলবিদ্যা', chapterName: 'অধ্যায় ০৪' },
        { lessonId: 'les-05', title: 'Chapter 5: কাজ, শক্তি ও ক্ষমতা', shortTitle: 'কাজ, শক্তি ও ক্ষমতা', chapterName: 'অধ্যায় ০৫' },
        { lessonId: 'les-06', title: 'Chapter 6: মহাকর্ষ ও অভিকর্ষ', shortTitle: 'মহাকর্ষ ও অভিকর্ষ', chapterName: 'অধ্যায় ০৬' }
      ];
    }
  }

  return list;
}

export default function LeaderboardPage({
  courses = [],
  currentUser = null,
  siteSettings = {},
  onNavigateHome,
  onNavigateDashboard,
  onNavigateCourse,
  onNavigateExams,
  onNavigateStore,
  onNavigateAbout,
  onNavigateDevices,
  onNavigateOrders,
  onNavigatePolicies,
  onOpenAdmin,
  onLoginClick
}) {
  const { isDark } = useTheme();

  // Find default course (Physics Finishing Touch if present, else first course)
  const defaultCourse = useMemo(() => {
    if (!Array.isArray(courses) || courses.length === 0) return null;
    return courses.find(c => 
      (c.title && c.title.toLowerCase().includes('finishing')) ||
      (c.name && c.name.toLowerCase().includes('finishing')) ||
      (c.slug && c.slug.toLowerCase().includes('finishing')) ||
      (c.title && c.title.toLowerCase().includes('physics')) ||
      (c.name && c.name.toLowerCase().includes('physics')) ||
      (c.slug && c.slug.toLowerCase().includes('physics'))
    ) || courses[0];
  }, [courses]);

  const [selectedCourseId, setSelectedCourseId] = useState(() => defaultCourse?.id || defaultCourse?.slug || 'physics-finishing-touch-series');
  
  // viewMode: 'overall' (cumulative course total) | 'lesson' (individual class exam)
  const [viewMode, setViewMode] = useState('overall');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Side Drawer state for selecting Course and Chapters/Exams
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Active selected course object
  const activeCourse = useMemo(() => {
    if (!Array.isArray(courses) || courses.length === 0) return defaultCourse;
    return courses.find(c => String(c.id) === String(selectedCourseId) || c.slug === selectedCourseId) || defaultCourse;
  }, [courses, selectedCourseId, defaultCourse]);

  // Lessons list extracted dynamically from course curriculum
  const availableLessons = useMemo(() => {
    return getCourseLessons(activeCourse);
  }, [activeCourse]);

  // Filter to only enrolled courses for the student (or active course fallback)
  const userEnrolledCourses = useMemo(() => {
    if (!Array.isArray(courses) || courses.length === 0) {
      return defaultCourse ? [defaultCourse] : [];
    }

    if (currentUser) {
      // 1. Check genuine enrolled items (with forDashboard: true so admin pass doesn't automatically pull every single course)
      const genuineEnrolled = courses.filter(c => 
        isItemEnrolled(c, currentUser, { courses }, { forDashboard: true })
      );
      if (genuineEnrolled.length > 0) return genuineEnrolled;

      // 2. Check explicit array of enrolled courses
      if (Array.isArray(currentUser.enrolledCourses) && currentUser.enrolledCourses.length > 0) {
        const matched = courses.filter(c =>
          currentUser.enrolledCourses.some(ec =>
            String(ec) === String(c.id) ||
            normalizeStr(ec) === normalizeStr(c.title) ||
            normalizeStr(ec) === normalizeStr(c.name)
          )
        );
        if (matched.length > 0) return matched;
      }
    }

    // Default / guest: show the active or default course (e.g. Physics Finishing Touch)
    if (activeCourse) return [activeCourse];
    if (defaultCourse) return [defaultCourse];
    return [courses[0]];
  }, [courses, currentUser, activeCourse, defaultCourse]);

  // Dropdown accordion expanded state (defaults to selectedCourseId)
  const [expandedCourseId, setExpandedCourseId] = useState(() => selectedCourseId);

  // Keep expandedCourseId in sync if selectedCourseId changes
  useEffect(() => {
    if (selectedCourseId) {
      setExpandedCourseId(selectedCourseId);
    }
  }, [selectedCourseId]);

  const toggleCourseExpand = (cId) => {
    setExpandedCourseId(prev => (prev === cId ? null : cId));
  };

  // Active selected lesson object (if in lesson mode)
  const currentActiveLesson = useMemo(() => {
    if (viewMode !== 'lesson' || !selectedLessonId) return null;
    return availableLessons.find(l => l.lessonId === selectedLessonId) || availableLessons[0] || null;
  }, [viewMode, selectedLessonId, availableLessons]);

  // Clean Navigation Title requested by User:
  // Shows ONLY "Finishing Touch" or "গতিবিদ্যা" or "ভেক্টর" without subtitle text!
  const navTitle = useMemo(() => {
    if (viewMode === 'overall') {
      if (activeCourse?.title && activeCourse.title.toLowerCase().includes('finishing')) {
        return 'Finishing Touch';
      }
      return activeCourse?.title || 'Finishing Touch';
    }
    return currentActiveLesson?.shortTitle || 'Leaderboard';
  }, [viewMode, activeCourse, currentActiveLesson]);

  // Load Leaderboard data
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const courseId = activeCourse?.id || activeCourse?.slug || selectedCourseId;
        const courseTitle = activeCourse?.title || activeCourse?.name || '';
        if (viewMode === 'overall') {
          const res = await fetchCourseLeaderboard(courseId, courseTitle);
          if (isMounted) setLeaderboardData(res || []);
        } else {
          const lessonIdToFetch = selectedLessonId || availableLessons[0]?.lessonId || 'les-01';
          const res = await fetchLessonLeaderboard(courseId, lessonIdToFetch);
          if (isMounted) setLeaderboardData(res || []);
        }
      } catch (err) {
        console.warn('Failed to load leaderboard:', err);
        if (isMounted) setLeaderboardData([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [activeCourse, selectedCourseId, viewMode, selectedLessonId, availableLessons]);

  // Filtered leaderboard data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return leaderboardData;
    const term = searchTerm.toLowerCase().trim();
    return leaderboardData.filter(item => 
      (item.student_name && item.student_name.toLowerCase().includes(term)) ||
      (item.student_username && item.student_username.toLowerCase().includes(term)) ||
      (item.student_id && item.student_id.toLowerCase().includes(term))
    );
  }, [leaderboardData, searchTerm]);

  // Top 3 Podium Participants
  const rank1 = filteredData[0] || null;
  const rank2 = filteredData[1] || null;
  const rank3 = filteredData[2] || null;

  // Remaining participants for bottom sheet list (Ranks 4 to N)
  const remainingList = useMemo(() => {
    return filteredData.slice(3);
  }, [filteredData]);

  // Current logged in student entry
  const userRankEntry = useMemo(() => {
    if (!currentUser) return null;
    const userId = currentUser.id || currentUser.phone || currentUser.email;
    return leaderboardData.find(item => item.student_id === userId) || null;
  }, [leaderboardData, currentUser]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#28050c] via-[#100205] to-[#070102] text-white selection:bg-[#e11438] selection:text-white relative overflow-x-hidden font-sans">
      
      {/* 1. CINEMATIC AMBIENT LIGHTING & DEEP WINE GLOW (Matching Navbar Side Drawer Theme) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] sm:w-[900px] h-[550px] bg-gradient-to-b from-[#e11438]/25 via-[#800a20]/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[380px] h-[280px] bg-purple-700/10 rounded-full blur-[120px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. DEDICATED TOP NAVIGATION BAR (Perfect Symmetry)                        */}
      {/* Left: Circular Back Arrow (←)                                            */}
      {/* Center: ONLY Active Exam Name (e.g. "গতিবিদ্যা" or "Finishing Touch")    */}
      {/* Right: Circular Chart Icon Button (Opens Side Navigation Drawer)         */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[#28050c]/85 border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-md sm:max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Left: Circular Glass Back Arrow (←) */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center border border-white/15 backdrop-blur-md shadow-md transition-all cursor-pointer shrink-0"
            title="Go Back to Home"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Center: Clean Bold Active Title ONLY (Subtitle removed as requested) */}
          <div className="text-center min-w-0 flex-1 px-2">
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight truncate">
              {navTitle}
            </h1>
          </div>

          {/* Right: Circular Chart Type Button (Opens Side Navigation Drawer) */}
          <button
            type="button"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#e11438]/30 active:scale-95 text-white flex items-center justify-center border border-white/15 backdrop-blur-md shadow-md transition-all cursor-pointer shrink-0 group"
            title="Open Exam & Course Selector"
          >
            <BarChart3 className="w-5 h-5 text-white/90 group-hover:text-white group-hover:scale-105 transition-transform" />
          </button>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. SIDE NAVIGATION DRAWER (Opened via Right Circular Chart Button)        */}
      {/* Sleek, minimal English interface with rounded dropdown accordion boxes     */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. SIDE NAVIGATION DRAWER (Opened via Right Circular Chart Button)        */}
      {/* Exact aesthetic match to Main Website Side Nav (rounded-l-[36px], glowing red) */}
      {/* ========================================================================= */}
      {isFilterDrawerOpen && (
        <>
          {/* Dimmed Backdrop */}
          <div 
            onClick={() => setIsFilterDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] transition-opacity duration-300 cursor-pointer animate-in fade-in"
          />

          {/* Slide-out Drawer Panel with rounded-l-[36px] matching Main Website Side Nav */}
          <div className="fixed inset-y-0 right-0 w-[310px] sm:w-[330px] max-w-[88vw] flex flex-col justify-between p-6 sm:p-7 z-[10000] rounded-l-[36px] bg-gradient-to-b from-[#2e050c] via-[#0f0305] to-[#070102] text-white shadow-[-16px_0_50px_rgba(0,0,0,0.9)] border-l border-[#e11438]/25 overflow-hidden animate-in slide-in-from-right duration-300">
            
            {/* Top Red Wine Ambient Radial Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#e11438]/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 relative z-10">
              
              {/* Top Notch & Glowing Red Close Button matching Main Website Side Nav */}
              <div className="flex items-center justify-between pb-2">
                <span className="w-8 h-1 rounded-full bg-white/20"></span>
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer bg-gradient-to-tr from-[#dc2626] to-[#ff2a55] text-white shadow-[0_0_16px_rgba(225,20,56,0.65)] hover:shadow-[0_0_24px_rgba(225,20,56,0.95)] hover:scale-105 active:scale-95 border border-white/25"
                  title="Close"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Drawer Header (English & Minimal) */}
              <div className="flex items-center gap-3 pt-2 pb-1">
                <div className="w-10 h-10 rounded-2xl bg-[#e11438]/20 border border-[#e11438]/30 flex items-center justify-center text-[#ff3358] shadow-[0_0_15px_rgba(225,20,56,0.25)] shrink-0">
                  <BarChart3 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white tracking-tight leading-tight">
                    Select Exam
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Choose your course & chapter
                  </p>
                </div>
              </div>

              {/* Sleek Gradient Divider Line matching Navbar.jsx */}
              <div className="h-[1px] my-4 w-full shrink-0 bg-gradient-to-r from-transparent via-[#e11438]/30 to-transparent"></div>

              {/* Courses & Chapters Accordion List */}
              <div className="py-2 space-y-3 flex-1">
                {userEnrolledCourses.map((c) => {
                  const cKey = c.id || c.slug;
                  const isSelected = String(c.id) === String(selectedCourseId) || c.slug === selectedCourseId;
                  const isExpanded = expandedCourseId === cKey;
                  const cLessons = getCourseLessons(c);

                  return (
                    <div 
                      key={cKey}
                      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isSelected 
                          ? 'border-[#e11438]/50 bg-gradient-to-b from-[#e11438]/15 via-white/[0.03] to-white/[0.02] shadow-[0_4px_25px_rgba(225,20,56,0.2)]' 
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                      }`}
                    >
                      {/* Rounded Course Dropdown Header */}
                      <button
                        type="button"
                        onClick={() => toggleCourseExpand(cKey)}
                        className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-white/[0.05] transition-colors gap-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isSelected 
                              ? 'bg-[#e11438]/30 border-[#e11438] text-white shadow-[0_0_12px_rgba(225,20,56,0.3)]' 
                              : 'bg-white/10 border-white/10 text-white/70'
                          }`}>
                            <BookOpen className="w-4 h-4 text-[#ff3358]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate leading-snug">
                              {c.title || c.name || 'Course'}
                            </h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {cLessons.length} Chapters • Click to expand
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center text-white/60">
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'rotate-0'}`} />
                        </div>
                      </button>

                      {/* Expanded Chapters & Exams List */}
                      {isExpanded && (
                        <div className="border-t border-white/[0.08] bg-black/45 p-2.5 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                          
                          {/* Overall Course Ranking Option */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCourseId(cKey);
                              setViewMode('overall');
                              setSelectedLessonId('');
                              setIsFilterDrawerOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                              isSelected && viewMode === 'overall'
                                ? 'bg-gradient-to-r from-[#e11438]/35 to-[#800a20]/35 border-[#e11438] text-white shadow-[0_0_12px_rgba(225,20,56,0.25)]'
                                : 'bg-white/[0.04] border-white/5 text-gray-200 hover:bg-white/[0.08] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                                <Trophy className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">Overall Standing</div>
                                <div className="text-[9.5px] text-gray-400">Cumulative course result</div>
                              </div>
                            </div>
                            {isSelected && viewMode === 'overall' && (
                              <Check className="w-4 h-4 text-amber-400 shrink-0" />
                            )}
                          </button>

                          {/* Individual Chapter Exams */}
                          {cLessons.map((les, lIdx) => {
                            const isLesActive = isSelected && viewMode === 'lesson' && selectedLessonId === les.lessonId;
                            return (
                              <button
                                key={les.lessonId}
                                type="button"
                                onClick={() => {
                                  setSelectedCourseId(cKey);
                                  setViewMode('lesson');
                                  setSelectedLessonId(les.lessonId);
                                  setIsFilterDrawerOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer border ${
                                  isLesActive
                                    ? 'bg-[#e11438]/30 border-[#e11438] text-white shadow-xs'
                                    : 'bg-white/[0.02] border-white/5 text-gray-300 hover:bg-white/[0.07] hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    isLesActive ? 'bg-[#e11438] text-white' : 'bg-white/10 text-white/60'
                                  }`}>
                                    {lIdx + 1}
                                  </div>
                                  <span className="text-xs font-semibold truncate text-white/90">
                                    {les.title}
                                  </span>
                                </div>
                                {isLesActive && (
                                  <Check className="w-4 h-4 text-[#ff3358] shrink-0" />
                                )}
                              </button>
                            );
                          })}

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Drawer Bottom Close Button with glowing red accent */}
            <div className="pt-3 border-t border-white/10 relative z-10">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#e11438]/20 to-[#ff3358]/20 hover:from-[#e11438]/35 hover:to-[#ff3358]/35 text-white text-xs font-bold transition-all cursor-pointer border border-[#e11438]/40 shadow-[0_0_15px_rgba(225,20,56,0.2)] hover:shadow-[0_0_20px_rgba(225,20,56,0.35)] active:scale-95"
              >
                Close
              </button>
            </div>

          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="w-full max-w-md sm:max-w-lg mx-auto px-3 sm:px-6 pb-20 relative z-10 flex flex-col min-h-screen">
        
        {/* ========================================================================= */}
        {/* 3. 100% WIDE OPEN SPACIOUS BREATHING SPACE (ফুল ফাঁকা ও অ্যাম্বিয়েন্ট গ্লো)  */}
        {/* The horizontal slider is completely removed as requested by the user.     */}
        {/* Avatars float high in this majestic open negative space!                  */}
        {/* ========================================================================= */}
        <div className="pt-16 sm:pt-20 pb-0 relative w-full">
          
          {/* Ground Soft Cast Ambient Shadow underneath the podium base */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[94%] h-16 bg-black/95 rounded-full blur-2xl pointer-events-none z-0" />

          {/* Unified 3-Column Podium Stage */}
          <div className="relative flex items-end justify-center w-full max-w-[360px] sm:max-w-[420px] mx-auto z-10">
            
            {/* ------------------------------------------------------ */}
            {/* RANK 2 (SILVER - LEFT BLOCK) */}
            {/* ------------------------------------------------------ */}
            <div className="w-[32%] min-w-0 flex flex-col items-center relative z-10 -mr-1">
              
              {/* Floating Avatar 2 */}
              <div className="flex flex-col items-center mb-3 animate-in fade-in duration-300 w-full">
                <div className="relative group shrink-0">
                  {/* Floating Elevation Shadow */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/85 rounded-full blur-[3px]" />
                  
                  {/* Avatar Circle with Crisp White Rim */}
                  <img 
                    src={rank2?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'} 
                    alt={rank2?.student_name || 'Rank 2'}
                    className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-full object-cover border-[2.5px] border-white shadow-[0_10px_22px_rgba(0,0,0,0.7)] relative z-10 shrink-0"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/avatar.svg'; }}
                  />
                </div>

                {/* Username */}
                <span className="text-[11px] sm:text-xs font-semibold text-white/90 truncate max-w-full px-1 text-center mt-1.5 tracking-tight block">
                  {rank2?.student_username || rank2?.student_name?.split(' ')[0] || 'examinee'}
                </span>

                {/* Marks Pill */}
                <div className="mt-1">
                  <TokenPill points={viewMode === 'overall' ? (rank2?.total_score || 0) : (rank2?.score || 0)} />
                </div>
              </div>

              {/* 3D Pillar #2 (Medium Height) */}
              <div className="w-full flex flex-col items-center relative">
                
                {/* 3D Top Face Cap (Clean, full-width illuminated slab) */}
                <div className="w-full h-8 sm:h-9 bg-gradient-to-b from-[#3a0e1a] via-[#260811] to-[#17040b] border-t border-l border-white/20 shadow-inner relative z-10">
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-white/10 via-white/30 to-white/10" />
                </div>

                {/* 3D Front Vertical Face with Monolithic Shading */}
                <div className="w-full h-36 sm:h-40 bg-gradient-to-b from-[#1e060d] via-[#110207] to-[#070103] border-l border-b border-white/10 pt-5 sm:pt-6 flex flex-col items-center justify-start relative overflow-hidden shadow-[inset_0_10px_20px_rgba(0,0,0,0.6)]">
                  {/* Subtle Top Specular Edge Line */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  {/* Chiseled Embossed Numeral 2 (Clean watermark engraved into stone) */}
                  <span 
                    className="font-black text-5xl sm:text-6xl select-none leading-none"
                    style={{
                      color: 'rgba(255, 255, 255, 0.09)',
                      textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 -1px 1px rgba(255,255,255,0.1)'
                    }}
                  >
                    2
                  </span>
                </div>
              </div>

            </div>

            {/* ------------------------------------------------------ */}
            {/* RANK 1 (GOLD - CENTER - TALLEST & PROTRUDING FORWARD) */}
            {/* ------------------------------------------------------ */}
            <div className="w-[36%] min-w-0 flex flex-col items-center relative z-20">
              
              {/* Floating Avatar 1 (Highest elevation & largest) */}
              <div className="flex flex-col items-center mb-3.5 animate-in fade-in duration-300 w-full">
                <div className="relative group shrink-0">
                  {/* Floating Elevation Shadow */}
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-black/90 rounded-full blur-[4px]" />

                  {/* Avatar Circle with Crisp White Rim */}
                  <img 
                    src={rank1?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                    alt={rank1?.student_name || 'Rank 1'}
                    className="w-[74px] h-[74px] sm:w-[84px] sm:h-[84px] rounded-full object-cover border-[3px] border-white shadow-[0_12px_28px_rgba(245,158,11,0.4)] relative z-10 shrink-0"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/avatar.svg'; }}
                  />
                </div>

                {/* Username */}
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-full px-1 text-center mt-1.5 tracking-tight block">
                  {rank1?.student_username || rank1?.student_name?.split(' ')[0] || 'examinee'}
                </span>

                {/* Marks Pill (Slightly larger for #1) */}
                <div className="mt-1">
                  <TokenPill points={viewMode === 'overall' ? (rank1?.total_score || 0) : (rank1?.score || 0)} size="lg" />
                </div>
              </div>

              {/* 3D Pillar #1 (Tallest Center Block with Drop Shadows on both sides) */}
              <div className="w-full flex flex-col items-center relative z-20 shadow-[-16px_0_35px_rgba(0,0,0,0.92),16px_0_35px_rgba(0,0,0,0.92)]">
                
                {/* 3D Top Face Cap (Clean, full-width illuminated slab - perfectly flush with front face) */}
                <div className="w-full h-9 sm:h-10 bg-gradient-to-b from-[#551425] via-[#380c19] to-[#22050f] border-t border-x border-white/25 shadow-inner relative z-10">
                  {/* Top Specular Rim */}
                  <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-white/15 via-white/45 to-white/15" />
                </div>

                {/* 3D Front Vertical Face with Monolithic Shading */}
                <div className="w-full h-48 sm:h-56 bg-gradient-to-b from-[#270610] via-[#150209] to-[#080104] border-x border-b border-white/15 pt-6 sm:pt-8 flex flex-col items-center justify-start relative overflow-hidden shadow-[inset_0_12px_24px_rgba(0,0,0,0.7)]">
                  {/* Subtle Top Specular Edge Line */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

                  {/* Chiseled Embossed Numeral 1 (Clean watermark engraved into stone) */}
                  <span 
                    className="font-black text-6xl sm:text-7xl select-none leading-none"
                    style={{
                      color: 'rgba(255, 255, 255, 0.12)',
                      textShadow: '0 3px 6px rgba(0,0,0,0.95), 0 -1px 1px rgba(255,255,255,0.15)'
                    }}
                  >
                    1
                  </span>
                </div>
              </div>

            </div>

            {/* ------------------------------------------------------ */}
            {/* RANK 3 (BRONZE - RIGHT BLOCK) */}
            {/* ------------------------------------------------------ */}
            <div className="w-[32%] min-w-0 flex flex-col items-center relative z-10 -ml-1">
              
              {/* Floating Avatar 3 */}
              <div className="flex flex-col items-center mb-3 animate-in fade-in duration-300 w-full">
                <div className="relative group shrink-0">
                  {/* Floating Elevation Shadow */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-black/85 rounded-full blur-[3px]" />

                  {/* Avatar Circle with Crisp White Rim */}
                  <img 
                    src={rank3?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'} 
                    alt={rank3?.student_name || 'Rank 3'}
                    className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-full object-cover border-[2.5px] border-white shadow-[0_10px_22px_rgba(0,0,0,0.7)] relative z-10 shrink-0"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/avatar.svg'; }}
                  />
                </div>

                {/* Username */}
                <span className="text-[11px] sm:text-xs font-semibold text-white/90 truncate max-w-full px-1 text-center mt-1.5 tracking-tight block">
                  {rank3?.student_username || rank3?.student_name?.split(' ')[0] || 'examinee'}
                </span>

                {/* Marks Pill */}
                <div className="mt-1">
                  <TokenPill points={viewMode === 'overall' ? (rank3?.total_score || 0) : (rank3?.score || 0)} />
                </div>
              </div>

              {/* 3D Pillar #3 (Shortest Height) */}
              <div className="w-full flex flex-col items-center relative">
                
                {/* 3D Top Face Cap (Clean, full-width illuminated slab) */}
                <div className="w-full h-8 sm:h-9 bg-gradient-to-b from-[#3a0e1a] via-[#260811] to-[#17040b] border-t border-r border-white/20 shadow-inner relative z-10">
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-white/10 via-white/30 to-white/10" />
                </div>

                {/* 3D Front Vertical Face with Monolithic Shading */}
                <div className="w-full h-28 sm:h-32 bg-gradient-to-b from-[#1e060d] via-[#110207] to-[#070103] border-r border-b border-white/10 pt-4 sm:pt-5 flex flex-col items-center justify-start relative overflow-hidden shadow-[inset_0_10px_20px_rgba(0,0,0,0.6)]">
                  {/* Subtle Top Specular Edge Line */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  {/* Chiseled Embossed Numeral 3 (Clean watermark engraved into stone) */}
                  <span 
                    className="font-black text-4xl sm:text-5xl select-none leading-none"
                    style={{
                      color: 'rgba(255, 255, 255, 0.09)',
                      textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 -1px 1px rgba(255,255,255,0.1)'
                    }}
                  >
                    3
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. ROUNDED BOTTOM SHEET (Ranks 4+ and Search) */}
        {/* Slides up and interlocks with the base of the podium */}
        {/* ========================================================= */}
        <div className="relative z-30 -mt-6 sm:-mt-8 rounded-t-[36px] sm:rounded-t-[42px] bg-gradient-to-b from-[#18040b] via-[#0e0206] to-[#070102] backdrop-blur-2xl border-t border-x border-white/10 pt-4 px-3 sm:px-6 pb-28 shadow-[0_-20px_50px_rgba(0,0,0,0.95)] flex-1">
          
          {/* Native Mobile Sheet Top Handle */}
          <div className="w-10 h-1 bg-white/25 rounded-full mx-auto mb-4" />

          {/* List of remaining examinees (Rank 4 to N) */}
          <div className="divide-y divide-white/[0.04]">
            {remainingList.length === 0 && (
              <div className="py-10 text-center text-xs text-white/40">
                {isLoading ? 'Loading participants...' : 'No other participants in this bracket.'}
              </div>
            )}

            {remainingList.map((student, idx) => {
              const rankNum = idx + 4;
              const points = viewMode === 'overall' ? (student.total_score || 0) : (student.score || 0);

              return (
                <div
                  key={student.student_id || idx}
                  className="flex items-center justify-between gap-3 py-3 px-1 rounded-2xl hover:bg-white/[0.03] transition-colors"
                >
                  {/* Left: Rank, Profile Picture & Vertically Center-Aligned Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-center text-sm font-semibold text-white/50 shrink-0">
                      {rankNum}
                    </span>

                    <img 
                      src={student.avatar || '/avatar.svg'} 
                      alt={student.student_name}
                      className="w-10 h-10 rounded-full object-cover border border-white/15 shadow-sm bg-white/5 shrink-0"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/avatar.svg'; }}
                    />

                    <h4 className="text-sm font-semibold text-white truncate leading-none tracking-tight">
                      {student.student_username || student.student_name}
                    </h4>
                  </div>

                  {/* Right side: Marks on top, Time with seconds below (same font & color as 24m) */}
                  <div className="text-right shrink-0">
                    <span className="font-bold text-white text-sm block leading-tight">
                      {points}
                    </span>
                    <span className="text-xs text-white/40 block leading-tight mt-0.5">
                      {formatMinimalTime(viewMode === 'overall' ? student.total_time_seconds : student.time_taken_seconds)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </main>

      {/* Floating Sticky Bottom Bar for Current Student Standing (If logged in) */}
      {userRankEntry && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
          <div className="p-3.5 rounded-2xl bg-[#22040c]/95 border border-[#e11438]/50 shadow-[0_12px_35px_rgba(225,20,56,0.4)] flex items-center justify-between gap-3 backdrop-blur-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#e11438] to-[#ff2a5f] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                #{userRankEntry.rank}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">
                  Your Current Standing
                </span>
                <h4 className="text-xs font-bold text-white truncate">
                  {userRankEntry.student_name || 'You'}
                </h4>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="font-mono font-black text-[#ff4d6d] text-sm block">
                {viewMode === 'overall' ? userRankEntry.total_score : userRankEntry.score} pts
              </span>
              <span className="text-[10px] text-white/60 font-mono">
                Accuracy: {userRankEntry.percentage}%
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
