import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Play, 
  FileText, 
  Download, 
  ExternalLink, 
  Clock, 
  ChevronDown, 
  BookOpen, 
  Layers, 
  Share2, 
  Lock,
  ListVideo,
  Sparkles
} from 'lucide-react';
import { masterEnglishCourseData } from '../data/masterEnglishCourseData';
import { freeCoursesData } from '../data/freeCoursesData';
import { initialData } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useEnrollmentStatus } from '../utils/enrollmentService';
import Navbar from './Navbar';

function getEmbedUrl(url) {
  if (!url) return '';
  try {
    if (url.includes('youtube.com/watch')) {
      const v = new URL(url).searchParams.get('v');
      if (v) return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    }
    if (url.includes('youtu.be/')) {
      const v = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
      if (v) return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    }
    if (url.includes('youtube.com/embed/')) {
      const glue = url.includes('?') ? '&' : '?';
      return `${url}${glue}autoplay=1&enablejsapi=1`;
    }
    if (url.includes('youtube.com/shorts/')) {
      const v = url.split('youtube.com/shorts/')[1].split('?')[0];
      if (v) return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    }
  } catch {}
  return url;
}

export default function CoursePlayerPage({
  data,
  courseId,
  initialLesson,
  onNavigateCourse,
  onNavigateHome,
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
  const { currentUser } = useAuth();

  // Find course object
  const course = useMemo(() => {
    const cid = courseId || 'master-english-30-days';
    const foundFree = freeCoursesData.find(c => c.id === cid || c.slug === cid);
    if (foundFree) return foundFree;

    if (cid === 'master-english-30-days' || cid === masterEnglishCourseData.id) {
      return masterEnglishCourseData;
    }

    const coursesList = data?.courses || initialData.courses;
    const found = coursesList.find(c => c.id === cid || c.slug === cid);
    if (found) return found;

    return masterEnglishCourseData;
  }, [courseId, data]);

  const isCourseEnrolled = useEnrollmentStatus(course, currentUser, data);

  // Flatten curriculum into ordered array of lessons with metadata
  const allLessons = useMemo(() => {
    const list = [];
    const curriculum = course.curriculum || [];

    curriculum.forEach((sec, secIdx) => {
      const secTitle = sec.name || sec.title || `Module ${secIdx + 1}`;
      if (sec.lessons && sec.lessons.length > 0) {
        sec.lessons.forEach((les, lesIdx) => {
          const isObj = typeof les === 'object' && les !== null;
          const lesId = isObj ? String(les.id !== undefined ? les.id : `s${secIdx}-l${lesIdx}`) : `s${secIdx}-l${lesIdx}`;
          list.push({
            id: lesId,
            title: isObj ? les.title : les,
            duration: isObj ? les.duration : null,
            videoUrl: isObj ? (les.videoUrl || course.previewVideoUrl) : course.previewVideoUrl,
            pdfUrl: isObj ? les.pdfUrl : null,
            isFree: isObj ? Boolean(les.isFree) : false,
            sectionTitle: secTitle,
            chapterTitle: secTitle,
            globalIndex: list.length
          });
        });
      } else if (sec.chapters && sec.chapters.length > 0) {
        sec.chapters.forEach((chap, chapIdx) => {
          const chapTitle = chap.name || chap.title || `Chapter ${chapIdx + 1}`;
          (chap.lessons || []).forEach((les, lesIdx) => {
            const isObj = typeof les === 'object' && les !== null;
            const lesId = isObj ? String(les.id !== undefined ? les.id : `s${secIdx}-c${chapIdx}-l${lesIdx}`) : `s${secIdx}-c${chapIdx}-l${lesIdx}`;
            list.push({
              id: lesId,
              title: isObj ? les.title : les,
              duration: isObj ? les.duration : null,
              videoUrl: isObj ? (les.videoUrl || course.previewVideoUrl) : course.previewVideoUrl,
              pdfUrl: isObj ? les.pdfUrl : null,
              isFree: isObj ? Boolean(les.isFree) : false,
              sectionTitle: secTitle,
              chapterTitle: chapTitle,
              globalIndex: list.length
            });
          });
        });
      }
    });

    return list;
  }, [course]);

  // Determine current active lesson
  const [activeIndex, setActiveIndex] = useState(() => {
    if (initialLesson) {
      if (typeof initialLesson === 'number' && initialLesson >= 0) return initialLesson;
      if (typeof initialLesson === 'object') {
        if (initialLesson.globalIndex !== undefined) return initialLesson.globalIndex;
        if (initialLesson.lessonIdx !== undefined) return initialLesson.lessonIdx;
        if (initialLesson.id) {
          const idx = allLessons.findIndex(l => String(l.id) === String(initialLesson.id));
          if (idx !== -1) return idx;
        }
        if (initialLesson.title) {
          const idx = allLessons.findIndex(l => l.title === initialLesson.title);
          if (idx !== -1) return idx;
        }
      }
    }
    return 0;
  });

  const currentLesson = allLessons[activeIndex] || allLessons[0] || {
    id: 'default',
    title: course.name,
    videoUrl: course.previewVideoUrl,
    duration: null,
    pdfUrl: null
  };

  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const activeLessonRef = useRef(null);

  // Scroll to top on active lesson change and scroll active lesson into playlist view smoothly
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (activeLessonRef.current) {
      activeLessonRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIndex]);

  const handleShare = () => {
    try {
      if (navigator?.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2500);
      }
    } catch {}
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-[#0a0204] text-white' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      {/* Top Navbar with Course Title & Right Side Menu Drawer Toggle */}
      <Navbar 
        activePage="courses"
        courseTitle={course?.name || course?.title || 'Course Player'}
        onBackCourse={() => {
          if (onNavigateCourse) {
            onNavigateCourse(course?.id || course?.slug || courseId);
          } else if (onNavigateHome) {
            onNavigateHome();
          }
        }}
        siteSettings={data?.siteSettings || {}}
        onNavigateHome={onNavigateHome}
        onNavigateCourse={onNavigateCourse}
        onNavigateExams={onNavigateExams}
        onNavigateStore={onNavigateStore}
        onNavigateAbout={onNavigateAbout}
        onNavigateDevices={onNavigateDevices}
        onNavigateOrders={onNavigateOrders}
        onNavigatePolicies={onNavigatePolicies}
        onOpenAdmin={onOpenAdmin}
        onLoginClick={onLoginClick}
      />

      {/* Main Watch Page Body with clearance for sticky navbar */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-20 sm:pt-22 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: YouTube Video Player, Title, and PDF Options */}
          <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
            
            {/* YouTube-like Video Player */}
            <div className={`relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border ${
              isDark ? 'bg-black border-[#e11438]/30 shadow-[#e11438]/10' : 'bg-black border-slate-200 shadow-slate-200'
            }`}>
              {currentLesson.videoUrl ? (
                <iframe
                  src={getEmbedUrl(currentLesson.videoUrl)}
                  title={currentLesson.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <Play className="w-16 h-16 text-red-500/80 mb-3 animate-pulse" />
                  <p className="text-base font-bold text-gray-200">This lesson's video will be uploaded soon</p>
                  <p className="text-xs text-gray-400 mt-1">Please explore available lessons from the playlist</p>
                </div>
              )}
            </div>

            {/* Video Title & Meta Bar (Directly below video) */}
            <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-colors ${
              isDark ? 'bg-[#140307]/80 border-[#e11438]/25' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div>
                <h1 className="text-lg sm:text-2xl font-black leading-tight text-balance">
                  {currentLesson.title}
                </h1>
              </div>

              {/* 'Lecture Sheet & PDF' Dropdown Box */}
              <div className="mt-4 pt-4 border-t border-gray-500/15">
                <button
                  type="button"
                  onClick={() => setIsPdfDropdownOpen(prev => !prev)}
                  className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer shadow-xs group ${
                    isPdfDropdownOpen
                      ? (isDark 
                          ? 'bg-[#1e050d] border-red-500/40 text-white' 
                          : 'bg-red-50/80 border-red-300 text-slate-900')
                      : (isDark 
                          ? 'bg-[#150409]/90 hover:bg-[#1f060e] border-[#e11438]/25 text-gray-200 hover:text-white hover:border-[#e11438]/40' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 hover:border-slate-300')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isDark 
                        ? 'bg-red-500/15 text-red-400 group-hover:bg-red-500/25' 
                        : 'bg-red-100 text-red-600 group-hover:bg-red-200'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm sm:text-base font-bold flex items-center gap-2">
                        Lecture Sheet & PDF
                        {currentLesson.pdfUrl ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                            PDF Available ✓
                          </span>
                        ) : null}
                      </span>
                      <p className={`text-[11px] sm:text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        {isPdfDropdownOpen ? 'Click to collapse' : 'Click to view PDF & lecture notes'}
                      </p>
                    </div>
                  </div>

                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isDark ? 'bg-white/5 text-gray-300 group-hover:text-white' : 'bg-black/5 text-slate-600 group-hover:text-slate-900'
                  }`}>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isPdfDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Dropdown Content Area with Smooth IN / OUT Transition */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isPdfDropdownOpen
                      ? 'grid-rows-[1fr] opacity-100 mt-3.5'
                      : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="pt-1 space-y-4">
                      {currentLesson.pdfUrl ? (
                        <div className="space-y-4">
                          <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isDark 
                              ? 'bg-gradient-to-r from-[#1f060d] to-[#170308] border-[#e11438]/30' 
                              : 'bg-gradient-to-r from-red-50/60 to-orange-50/40 border-red-200/80'
                          }`}>
                            <div className="flex items-center gap-3.5">
                              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-[#dc2626] flex items-center justify-center shrink-0 shadow-inner">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-sm sm:text-base font-bold leading-tight">
                                  {currentLesson.title} - Official Lecture Sheet & Notes
                                </h3>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                  Official digital lecture notes & PDF resources
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={currentLesson.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#dc2626] hover:bg-red-700 text-white text-xs font-bold text-decoration-none shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open PDF</span>
                              </a>

                              <a
                                href={currentLesson.pdfUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-decoration-none border transition-all cursor-pointer ${
                                  isDark 
                                    ? 'border-[#e11438]/30 bg-[#1a040a] hover:bg-[#280711] text-gray-200' 
                                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Download</span>
                              </a>
                            </div>
                          </div>

                          {/* Embedded PDF / Viewer Box */}
                          <div className={`w-full rounded-2xl overflow-hidden border ${
                            isDark ? 'border-[#e11438]/20 bg-[#0d0205]' : 'border-slate-200 bg-slate-50'
                          }`}>
                            <div className="p-3 bg-gray-500/10 flex items-center justify-between text-xs px-4">
                              <span className="font-bold flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-red-500" />
                                PDF Preview Window
                              </span>
                              <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                Scroll to read document
                              </span>
                            </div>
                            <div className="w-full h-[520px] bg-slate-900/5">
                              <iframe
                                src={
                                  currentLesson.pdfUrl.includes('drive.google.com')
                                    ? currentLesson.pdfUrl.replace('/view', '/preview')
                                    : currentLesson.pdfUrl.endsWith('.pdf')
                                      ? `https://docs.google.com/viewer?url=${encodeURIComponent(currentLesson.pdfUrl)}&embedded=true`
                                      : currentLesson.pdfUrl
                                }
                                title="Lecture Sheet Preview"
                                className="w-full h-full border-0"
                              ></iframe>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Clean empty state when admin hasn't added PDF yet */
                        <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3 ${
                          isDark ? 'border-[#e11438]/15 bg-[#170408]/60' : 'border-slate-200 bg-slate-50/70'
                        }`}>
                          <div className="w-12 h-12 rounded-2xl bg-gray-500/10 flex items-center justify-center text-gray-400">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="max-w-md">
                            <h4 className="text-sm font-bold">
                              No Lecture Sheet or PDF Uploaded Yet
                            </h4>
                            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                              As soon as lecture sheets or PDF notes are added in the admin panel, students will be able to view and download them directly from here.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Course Curriculum Playlist (YouTube / Udemy style) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className={`sticky top-20 rounded-2xl sm:rounded-3xl border overflow-hidden transition-colors ${
              isDark ? 'bg-[#140307]/90 border-[#e11438]/25 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              
              {/* Playlist Header */}
              <div className={`p-4 border-b flex items-center justify-between gap-3 ${
                isDark ? 'border-[#e11438]/20 bg-[#1a050c]' : 'border-slate-100 bg-slate-50'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
                    <ListVideo className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black leading-tight">Course Playlist</h3>
                    <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      {allLessons.length} Total Lessons
                    </p>
                  </div>
                </div>
              </div>

              {/* Lesson Items Scrollable Container with Harmonious Smooth Scrollbar */}
              <div className="max-h-[calc(100vh-220px)] overflow-y-auto divide-y divide-gray-500/10 p-2 scroll-smooth playlist-scrollbar pr-1.5">
                {allLessons.map((les, idx) => {
                  const isActive = idx === activeIndex;

                  return (
                    <div
                      key={les.id || idx}
                      ref={isActive ? activeLessonRef : null}
                      onClick={() => setActiveIndex(idx)}
                      className={`group flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? (isDark ? 'bg-red-500/15 border border-red-500/30' : 'bg-red-50 border border-red-200/80')
                          : (isDark ? 'hover:bg-[#20050d] border border-transparent' : 'hover:bg-slate-100/70 border border-transparent')
                      }`}
                    >
                      {/* Number or Playing Indicator */}
                      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5 transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'bg-[#dc2626] text-white shadow-xs'
                          : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-slate-200 text-slate-600')
                      }`}>
                        {isActive ? (
                          <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      {/* Title & Info */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs sm:text-sm font-semibold line-clamp-2 leading-snug transition-colors ${
                          isActive
                            ? 'text-red-500 font-bold'
                            : (isDark ? 'text-gray-200 group-hover:text-red-400' : 'text-slate-800 group-hover:text-[#dc2626]')
                        }`}>
                          {les.title}
                        </p>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {les.duration && (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-mono ${
                              isDark ? 'text-gray-400' : 'text-slate-500'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {les.duration}
                            </span>
                          )}

                          {les.pdfUrl && (
                            <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                              📄 PDF
                            </span>
                          )}

                          {isActive && (
                            <span className="text-[10px] text-red-500 font-bold px-1.5 py-0.2 rounded bg-red-500/10 animate-pulse">
                              Playing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
