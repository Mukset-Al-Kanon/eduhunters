import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  FileText, 
  Download, 
  ExternalLink, 
  Clock, 
  ChevronDown, 
  ListVideo,
  CheckSquare,
  RotateCcw,
  X,
  Zap,
  Check,
  Lock,
  ShoppingCart,
  ShieldCheck
} from 'lucide-react';
import { masterEnglishCourseData } from '../data/masterEnglishCourseData';
import { freeCoursesData } from '../data/freeCoursesData';
import { initialData } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { loadExamQuestions } from '../utils/examBatchStorage';
import { useEnrollmentStatus } from '../utils/enrollmentService';
import Navbar from './Navbar';
import SureShotExamSystem from './SureShotExamSystem';
import CheckoutModal from './CheckoutModal';

function getEmbedUrl(url) {
  if (!url) return '';
  try {
    const trimmed = String(url).trim();
    if (!trimmed) return '';

    // 1. Bunny Stream Direct Iframe Embed URL
    // e.g. https://iframe.mediadelivery.net/embed/777670/9f4309a1-xxxx-xxxx
    if (trimmed.includes('iframe.mediadelivery.net/embed/')) {
      const glue = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${glue}autoplay=true&preload=true`;
    }

    // 2. Bunny Stream Play URL
    // e.g. https://video.bunnycdn.com/play/777670/9f4309a1-xxxx-xxxx
    if (trimmed.includes('video.bunnycdn.com/play/')) {
      const parts = trimmed.split('video.bunnycdn.com/play/')[1].split('?')[0].split('/');
      if (parts.length >= 2) {
        return `https://iframe.mediadelivery.net/embed/${parts[0]}/${parts[1]}?autoplay=true&preload=true`;
      }
    }

    // 3. Bunny shorthand: "bunny:777670/videoId"
    if (trimmed.startsWith('bunny:')) {
      const rest = trimmed.replace('bunny:', '');
      return `https://iframe.mediadelivery.net/embed/${rest}?autoplay=true&preload=true`;
    }

    // Extract YouTube ID
    let ytId = '';
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      ytId = trimmed;
    } else if (trimmed.includes('youtube.com/watch')) {
      try {
        const parsed = new URL(trimmed);
        ytId = parsed.searchParams.get('v') || '';
      } catch (e) {}
    } else if (trimmed.includes('youtu.be/')) {
      ytId = trimmed.split('youtu.be/')[1].split('?')[0].split('&')[0];
    } else if (trimmed.includes('youtube.com/embed/')) {
      ytId = trimmed.split('youtube.com/embed/')[1].split('?')[0].split('&')[0];
    } else if (trimmed.includes('youtube.com/live/')) {
      ytId = trimmed.split('youtube.com/live/')[1].split('?')[0].split('&')[0];
    } else if (trimmed.includes('vimeo.com/')) {
      const vParts = trimmed.split('vimeo.com/')[1].split('?')[0].split('/');
      if (vParts[0]) {
        return `https://player.vimeo.com/video/${vParts[0]}?autoplay=1`;
      }
    }

    if (ytId) {
      return `https://www.youtube.com/embed/${ytId}?rel=0&playsinline=1&enablejsapi=1`;
    }

    return trimmed;
  } catch {}
  return url;
}

export default function CoursePlayerPage({
  data,
  courseId,
  initialLesson,
  onNavigateCourse,
  onNavigateDashboard,
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

  // Find course object with bulletproof matching across id, slug, key, title, and index
  const course = useMemo(() => {
    const cid = courseId || 'master-english-30-days';
    const cidStr = String(cid).trim().toLowerCase();

    // 1. Check dynamic courses in state / storage first (so admin edits are live)
    const coursesList = data?.courses || initialData.courses || [];
    const foundDynamic = coursesList.find(c => {
      if (!c) return false;
      const idStr = String(c.id !== undefined ? c.id : '').trim().toLowerCase();
      const slugStr = String(c.slug || '').trim().toLowerCase();
      const keyStr = String(c.key || '').trim().toLowerCase();
      const titleStr = String(c.title || c.name || '').trim().toLowerCase();
      return (
        idStr === cidStr ||
        slugStr === cidStr ||
        (keyStr && keyStr === cidStr) ||
        (titleStr && titleStr === cidStr)
      );
    });
    if (foundDynamic) return foundDynamic;

    // Check by numeric index if passed as 0, 1, 2...
    if (!isNaN(Number(cid)) && coursesList[Number(cid)]) {
      return coursesList[Number(cid)];
    }

    // 2. Check free courses
    const foundFree = freeCoursesData.find(c => {
      if (!c) return false;
      const idStr = String(c.id !== undefined ? c.id : '').trim().toLowerCase();
      const slugStr = String(c.slug || '').trim().toLowerCase();
      return idStr === cidStr || slugStr === cidStr;
    });
    if (foundFree) return foundFree;

    // 3. Fallback to master English course
    if (cidStr === 'master-english-30-days' || cidStr === String(masterEnglishCourseData.id).toLowerCase()) {
      return masterEnglishCourseData;
    }

    return coursesList[0] || masterEnglishCourseData;
  }, [courseId, data]);

  const _isCourseEnrolled = useEnrollmentStatus(course, currentUser, data);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'admin@eduhunters.com';
  // If student is genuinely enrolled or user is admin, everything is unlocked
  const isEnrolled = _isCourseEnrolled || isAdmin;
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Flatten curriculum into ordered array of lessons with metadata
  const allLessons = useMemo(() => {
    const list = [];
    const curriculum = course.curriculum || [];

    curriculum.forEach((sec, secIdx) => {
      const secTitle = sec.name || sec.title || `Module ${secIdx + 1}`;
      const hasChapterLessons = Array.isArray(sec.chapters) && sec.chapters.some(ch => (ch.lessons || []).length > 0);

      if (hasChapterLessons) {
        sec.chapters.forEach((chap, chapIdx) => {
          const chapTitle = chap.name || chap.title || `Chapter ${chapIdx + 1}`;
          (chap.lessons || []).forEach((les, lesIdx) => {
            const isObj = typeof les === 'object' && les !== null;
            const lesId = isObj ? String(les.id !== undefined ? les.id : `s${secIdx}-c${chapIdx}-l${lesIdx}`) : `s${secIdx}-c${chapIdx}-l${lesIdx}`;
            const lesVideo = isObj ? (les.videoUrl || les.youtubeUrl || (les.videoId ? `https://www.youtube.com/watch?v=${les.videoId}` : null) || course.previewVideoUrl || course.videoUrl) : (course.previewVideoUrl || course.videoUrl);

            let resolvedPdf = null;
            let resolvedQuiz = null;
            let resolvedExamId = isObj ? les.examId : null;

            if (isObj && 'quiz' in les) {
              resolvedQuiz = les.quiz;
            } else if (isObj && 'exam' in les) {
              resolvedQuiz = les.exam;
            } else if (course.id === 'master-english-30-days' || course.slug === 'master-english-30-days') {
              const defaultLes = masterEnglishCourseData.curriculum?.[secIdx]?.chapters?.[chapIdx]?.lessons?.[lesIdx];
              if (defaultLes?.quiz) resolvedQuiz = defaultLes.quiz;
            }

            if (isObj && 'pdfUrl' in les && les.pdfUrl !== undefined) {
              resolvedPdf = les.pdfUrl;
            } else if (course.id === 'master-english-30-days' || course.slug === 'master-english-30-days') {
              const defaultLes = masterEnglishCourseData.curriculum?.[secIdx]?.chapters?.[chapIdx]?.lessons?.[lesIdx];
              if (defaultLes?.pdfUrl) resolvedPdf = defaultLes.pdfUrl;
            }

            list.push({
              id: lesId,
              title: isObj ? les.title : les,
              duration: isObj ? les.duration : null,
              videoUrl: lesVideo,
              pdfUrl: resolvedPdf,
              quiz: resolvedQuiz,
              examId: resolvedExamId,
              isFree: isObj ? Boolean(les.isFree) : false,
              sectionTitle: secTitle,
              chapterTitle: chapTitle,
              globalIndex: list.length
            });
          });
        });
      } else if (sec.lessons && sec.lessons.length > 0) {
        sec.lessons.forEach((les, lesIdx) => {
          const isObj = typeof les === 'object' && les !== null;
          const lesId = isObj ? String(les.id !== undefined ? les.id : `s${secIdx}-l${lesIdx}`) : `s${secIdx}-l${lesIdx}`;
          const lesVideo = isObj ? (les.videoUrl || les.youtubeUrl || (les.videoId ? `https://www.youtube.com/watch?v=${les.videoId}` : null) || course.previewVideoUrl || course.videoUrl) : (course.previewVideoUrl || course.videoUrl);
          list.push({
            id: lesId,
            title: isObj ? les.title : les,
            duration: isObj ? les.duration : null,
            videoUrl: lesVideo,
            pdfUrl: isObj ? les.pdfUrl : null,
            quiz: isObj ? (les.quiz || les.exam) : null,
            examId: isObj ? les.examId : null,
            isFree: isObj ? Boolean(les.isFree) : false,
            sectionTitle: secTitle,
            chapterTitle: secTitle,
            globalIndex: list.length
          });
        });
      }
    });

    if (list.length === 0 && (course.previewVideoUrl || course.videoUrl)) {
      list.push({
        id: 'overview-lesson',
        title: course.title || course.name || 'Course Lecture & Overview',
        duration: course.duration || 'Lecture',
        videoUrl: course.previewVideoUrl || course.videoUrl,
        pdfUrl: null,
        quiz: null,
        examId: null,
        isFree: true,
        sectionTitle: 'Course Lectures',
        chapterTitle: 'Overview',
        globalIndex: 0
      });
    }

    return list;
  }, [course]);

  // Determine current active lesson (prioritizes free preview for unenrolled users if first lesson is locked)
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
    // If user is not enrolled and lesson 0 is locked, jump to first free preview
    if (!isEnrolled) {
      const firstFreeIdx = allLessons.findIndex(l => l.isFree);
      if (firstFreeIdx !== -1) return firstFreeIdx;
    }
    return 0;
  });

  const currentLesson = allLessons[activeIndex] || allLessons[0] || {
    id: 'default',
    title: course.name,
    videoUrl: course.previewVideoUrl,
    duration: null,
    pdfUrl: null,
    quiz: null,
    isFree: false
  };

  const isCurrentLessonUnlocked = isEnrolled || Boolean(currentLesson.isFree);

  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);
  const activeLessonRef = useRef(null);

  // Subtle Anti-Piracy Floating Watermark (Alternates Top-Left 5s -> Hidden 12s -> Bottom-Right 5s -> Hidden 12s)
  const [watermarkPos, setWatermarkPos] = useState('top-left'); // 'top-left' | 'bottom-right'
  const [watermarkVisible, setWatermarkVisible] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timerId = null;

    const runCycle = () => {
      setWatermarkVisible(true);
      timerId = setTimeout(() => {
        if (!isMounted) return;
        setWatermarkVisible(false);
        timerId = setTimeout(() => {
          if (!isMounted) return;
          setWatermarkPos(prev => (prev === 'top-left' ? 'bottom-right' : 'top-left'));
          runCycle();
        }, 12000);
      }, 5000);
    };

    runCycle();
    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  // Practice Quiz & Exam state
  const [isQuizDropdownOpen, setIsQuizDropdownOpen] = useState(false);
  const [activeLessonExam, setActiveLessonExam] = useState(null);
  const [savedLessonScores, setSavedLessonScores] = useState(() => {
    try {
      const saved = localStorage.getItem('eduhunters_lesson_quiz_scores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Handle browser popstate to return to lesson video when activeLessonExam is open
  useEffect(() => {
    const handlePopState = () => {
      if (activeLessonExam) {
        setActiveLessonExam(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeLessonExam]);

  const handleStartQuiz = async () => {
    let qList = [];
    let durMins = Number(currentLesson.quiz?.durationMinutes) || 10;
    let negMark = currentLesson.quiz?.negativeMark !== undefined ? Number(currentLesson.quiz.negativeMark) : 0.25;
    let rawTitle = currentLesson.quiz?.title || `${currentLesson.title} - Quiz`;
    let examTitle = rawTitle.replace(/practice\s*quiz/gi, 'Quiz').trim();

    if (currentLesson.quiz?.questions && Array.isArray(currentLesson.quiz.questions) && currentLesson.quiz.questions.length > 0) {
      qList = currentLesson.quiz.questions;
    } else if (currentLesson.examId) {
      try {
        const res = await loadExamQuestions({ id: currentLesson.examId });
        if (res?.questions && res.questions.length > 0) {
          qList = res.questions;
          if (res.title) examTitle = res.title.replace(/practice\s*quiz/gi, 'Quiz').trim();
          if (res.duration_minutes) durMins = Number(res.duration_minutes);
          if (res.negative_mark !== undefined) negMark = Number(res.negative_mark);
        }
      } catch (err) {
        console.warn('Failed to load exam questions:', err);
      }
    }

    if (!qList || qList.length === 0) return;

    // Normalize questions to match SureShotExamSystem schema
    const normalizedQuestions = qList.map((q, idx) => ({
      id: q.id !== undefined ? q.id : (idx + 1),
      question_no: idx + 1,
      question: q.question || q.title || `Question ${idx + 1}`,
      options: Array.isArray(q.options) ? q.options : [],
      correct_index: q.correct_index !== undefined 
        ? Number(q.correct_index) 
        : (q.correctAnswer !== undefined ? Number(q.correctAnswer) : 0),
      explanation: q.explanation || q.hint || ''
    }));

    const examPayload = {
      id: currentLesson.quiz?.id || currentLesson.examId || `lesson-exam-${currentLesson.id}`,
      exam_id: currentLesson.quiz?.id || currentLesson.examId || `lesson-exam-${currentLesson.id}`,
      title: examTitle,
      category: 'course_lesson',
      categoryName: course.title || course.name || 'Master English',
      subCategory: null,
      subject: 'English',
      durationMinutes: durMins,
      duration_minutes: durMins,
      totalQuestions: normalizedQuestions.length,
      total_questions: normalizedQuestions.length,
      negativeMark: negMark,
      negative_mark: negMark,
      hasExplanations: true,
      questions: normalizedQuestions
    };

    try {
      window.history.pushState({ isLessonExam: true }, '', window.location.href);
    } catch (e) {}

    setActiveLessonExam(examPayload);
  };

  // Scroll to top on active lesson change and scroll active lesson into playlist view smoothly
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (activeLessonRef.current) {
      activeLessonRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIndex]);

  // When an exam is launched, render the full-featured SureShotExamSystem screen
  // matching View 3 ("Ready to Start" with Total Questions, Duration, Second Timer, Start Exam button)
  // and upon clicking Start Exam runs the live exam engine.
  if (activeLessonExam) {
    return (
      <div className={`min-h-screen transition-colors duration-200 selection:bg-[#e11438] selection:text-white ${
        isDark ? 'bg-[#0d0205] text-white' : 'bg-[#f8f9fa] text-slate-900'
      }`}>
        <Navbar 
          activePage="exams"
          courseTitle={course?.name || course?.title}
          onBackCourse={() => setActiveLessonExam(null)}
          siteSettings={data?.siteSettings || {}}
          onNavigateHome={() => { setActiveLessonExam(null); onNavigateHome?.(); }}
          onNavigateDashboard={() => { setActiveLessonExam(null); onNavigateDashboard?.(); }}
          onNavigateCourse={(cId) => { setActiveLessonExam(null); onNavigateCourse?.(cId); }}
          onNavigateExams={(cat) => { setActiveLessonExam(null); onNavigateExams?.(cat); }}
          onNavigateStore={() => { setActiveLessonExam(null); onNavigateStore?.(); }}
          onNavigateAbout={() => { setActiveLessonExam(null); onNavigateAbout?.(); }}
          onNavigateDevices={() => { setActiveLessonExam(null); onNavigateDevices?.(); }}
          onNavigateOrders={() => { setActiveLessonExam(null); onNavigateOrders?.(); }}
          onNavigatePolicies={(tab) => { setActiveLessonExam(null); onNavigatePolicies?.(tab); }}
          onOpenAdmin={() => { setActiveLessonExam(null); onOpenAdmin?.(); }}
          onLoginClick={onLoginClick}
        />
        <main className="pt-16">
          <SureShotExamSystem 
            initialStep="exam_intro"
            initialExam={activeLessonExam}
            isCourseQuiz={true}
            onBackToLesson={() => setActiveLessonExam(null)}
            onBackToCourses={() => setActiveLessonExam(null)}
            onExamComplete={(result) => {
              const totalPossible = activeLessonExam.totalMarks || activeLessonExam.totalQuestions || result.totalQuestions;
              const resultObj = {
                score: result.finalScore,
                totalPossible: totalPossible,
                correctCount: result.correct,
                wrongCount: result.wrong,
                skippedCount: result.skipped,
                totalQuestions: result.totalQuestions,
                percentage: result.percentage
              };
              setSavedLessonScores(prev => {
                const updated = {
                  ...prev,
                  [currentLesson.id]: resultObj
                };
                try {
                  localStorage.setItem('eduhunters_lesson_quiz_scores', JSON.stringify(updated));
                } catch {}
                return updated;
              });
            }}
            siteSettings={data?.siteSettings || {}}
            customExamBatches={data?.examBatches}
            onLoginClick={onLoginClick}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-[#0a0204] text-white' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      {/* Top Navbar with Course Title & Right Side Menu Drawer Toggle */}
      <Navbar 
        activePage="courses"
        courseTitle={course?.name || course?.title || 'Course Player'}
        onBackCourse={() => {
          if (window.history.length > 1) {
            window.history.back();
          } else if (onNavigateDashboard) {
            onNavigateDashboard();
          } else if (onNavigateCourse) {
            onNavigateCourse(course?.id || course?.slug || courseId);
          } else if (onNavigateHome) {
            onNavigateHome();
          }
        }}
        siteSettings={data?.siteSettings || {}}
        onNavigateHome={onNavigateHome}
        onNavigateDashboard={onNavigateDashboard}
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
            
            {/* Video Player or Locked Paywall Shield */}
            <div 
              className={`relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border select-none ${
                isDark ? 'bg-black border-[#e11438]/30 shadow-[#e11438]/10' : 'bg-black border-slate-200 shadow-slate-200'
              }`}
              onContextMenu={(e) => e.preventDefault()}
            >
              {!isCurrentLessonUnlocked ? (
                /* LOCKED PAYWALL SCREEN */
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 sm:p-10 relative overflow-hidden bg-gradient-to-br from-[#120206] via-[#1a040b] to-[#0d0104]">
                  {/* Ambient Glow */}
                  <div className="absolute w-72 h-72 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 max-w-lg space-y-4">
                    {/* Animated Glowing Lock Badge */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-red-500/30 border border-white/20">
                      <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>

                    <div className="space-y-1.5">
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                        🔒 Locked Class · শুধুমাত্র এনরোল্ড শিক্ষার্থীদের জন্য
                      </span>
                      <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
                        {currentLesson.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
                        এই প্রিমিয়াম ক্লাসটি দেখতে, অফিশিয়াল লেকচার শিট ডাউনলোড করতে এবং অধ্যায়ভিত্তিক পরীক্ষায় অংশ নিতে এখনই কোর্সে ভর্তি হোন।
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCheckoutModal(true)}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-red-600 hover:to-red-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-red-600/30 cursor-pointer border-none transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>এখনই ভর্তি হোন — ৳{course.salePrice || course.price || 499}</span>
                      </button>

                      {onNavigateCourse && (
                        <button
                          type="button"
                          onClick={() => onNavigateCourse(course.id || course.slug || courseId)}
                          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs sm:text-sm font-bold border border-white/15 cursor-pointer transition-all"
                        >
                          কোর্স বিস্তারিত দেখুন
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : currentLesson.videoUrl ? (
                <>
                  <iframe
                    key={currentLesson.id || currentLesson.videoUrl}
                    src={getEmbedUrl(currentLesson.videoUrl)}
                    title={currentLesson.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>

                  {/* Subtle Anti-Piracy Floating Watermark (Alternating Top-Left / Bottom-Right) */}
                  <div 
                    className={`absolute pointer-events-none select-none z-30 transition-all duration-700 ease-in-out ${
                      watermarkPos === 'top-left' ? 'top-3 left-3 sm:top-4 sm:left-4' : 'bottom-12 right-3 sm:bottom-14 sm:right-4'
                    } ${
                      watermarkVisible ? 'opacity-30 scale-100' : 'opacity-0 scale-95'
                    }`}
                  >
                    <div className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-xs border border-white/15 text-[10px] sm:text-xs font-mono font-medium text-white/90 tracking-wider shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{currentUser?.phone || currentUser?.email || 'EH-STUDENT'}</span>
                      <span className="opacity-60">• ID: {currentUser?.id?.slice(0, 8) || 'VERIFIED'}</span>
                    </div>
                  </div>
                </>
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
                      {!isCurrentLessonUnlocked ? (
                        /* Locked PDF State for unenrolled students */
                        <div className={`p-6 sm:p-7 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3 ${
                          isDark ? 'border-red-500/25 bg-[#170408]/70' : 'border-red-200 bg-red-50/50'
                        }`}>
                          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center">
                            <Lock className="w-6 h-6" />
                          </div>
                          <div className="max-w-md space-y-1">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                              লেকচার শিট ও PDF লক করা আছে
                            </h4>
                            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                              এই ক্লাসের অফিসিয়াল ডিজিটাল লেকচার শিট, হ্যান্ডনোট ও প্র্যাকটিস ফাইল ডাউনলোড করতে কোর্সে এনরোল করুন।
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCheckoutModal(true)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none transition-all flex items-center gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>এখনই কোর্সে ভর্তি হোন</span>
                          </button>
                        </div>
                      ) : currentLesson.pdfUrl ? (
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

              {/* 'Practice Quiz & Exam' Dropdown Box */}
              <div className="mt-3 pt-3 border-t border-gray-500/15">
                <button
                  type="button"
                  onClick={() => setIsQuizDropdownOpen(prev => !prev)}
                  className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer shadow-xs group ${
                    isQuizDropdownOpen
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
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm sm:text-base font-bold flex items-center gap-2">
                        Quiz
                      </span>
                      <p className={`text-[11px] sm:text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                        {isQuizDropdownOpen ? 'Click to collapse' : 'Test your understanding with class MCQs'}
                      </p>
                    </div>
                  </div>

                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isDark ? 'bg-white/5 text-gray-300 group-hover:text-white' : 'bg-black/5 text-slate-600 group-hover:text-slate-900'
                  }`}>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isQuizDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Dropdown Content Area */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isQuizDropdownOpen
                      ? 'grid-rows-[1fr] opacity-100 mt-3.5'
                      : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="pt-1 space-y-4">
                      {!isCurrentLessonUnlocked ? (
                        /* Locked Quiz State for unenrolled students */
                        <div className={`p-6 sm:p-7 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3 ${
                          isDark ? 'border-purple-500/25 bg-[#17040a]/70' : 'border-purple-200 bg-purple-50/50'
                        }`}>
                          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                            <Lock className="w-6 h-6" />
                          </div>
                          <div className="max-w-md space-y-1">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                              প্র্যাকটিস কুইজ ও এক্সাম লক করা আছে
                            </h4>
                            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                              এই ক্লাসের অধ্যায়ভিত্তিক এমসিকিউ টেস্ট, তাৎক্ষণিক রেজাল্ট ও ব্যাখ্যা দেখতে কোর্সে এনরোল করুন।
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCheckoutModal(true)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none transition-all flex items-center gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>এখনই কোর্সে ভর্তি হোন</span>
                          </button>
                        </div>
                      ) : (currentLesson.quiz || currentLesson.examId) ? (
                        <div
                          onClick={handleStartQuiz}
                          className={`w-full p-4 sm:px-5 sm:py-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99] select-none ${
                            isDark 
                              ? 'bg-[#1a040a] hover:bg-[#250711] border-[#e11438]/30 hover:border-red-500/50 text-white shadow-sm' 
                              : 'bg-white hover:bg-red-50/40 border-slate-200 hover:border-red-200 text-slate-900 shadow-2xs'
                          }`}
                        >
                          <span className="text-sm font-bold truncate">
                            {(currentLesson.quiz?.title || `${currentLesson.title} - Quiz`).replace(/practice\s*quiz/gi, 'Quiz')}
                          </span>

                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isDark 
                              ? 'bg-red-500/15 border border-red-500/30 text-red-400 group-hover:bg-red-500/25' 
                              : 'bg-red-50 border border-red-200 text-red-600 group-hover:bg-red-100'
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3 ${
                          isDark ? 'border-red-500/20 bg-[#16040a]/60' : 'border-slate-200 bg-slate-50/70'
                        }`}>
                          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400">
                            <CheckSquare className="w-6 h-6" />
                          </div>
                          <div className="max-w-md">
                            <h4 className="text-sm font-bold">
                              No Quiz Available Yet
                            </h4>
                            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                              The instructor has not attached an exam for this lesson yet. Practice questions will be published soon.
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
                      {allLessons.length} Total Lessons {isEnrolled ? '· 🔓 All Unlocked' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lesson Items Scrollable Container with Harmonious Smooth Scrollbar */}
              <div className="max-h-[calc(100vh-220px)] overflow-y-auto divide-y divide-gray-500/10 p-2 scroll-smooth playlist-scrollbar pr-1.5">
                {allLessons.map((les, idx) => {
                  const isActive = idx === activeIndex;
                  const isLessonUnlocked = isEnrolled || Boolean(les.isFree);

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
                      {/* Number or Playing Indicator or Lock Indicator */}
                      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5 transition-transform group-hover:scale-105 ${
                        isActive
                          ? (isLessonUnlocked ? 'bg-[#dc2626] text-white shadow-xs' : 'bg-amber-600 text-white shadow-xs')
                          : isLessonUnlocked
                            ? (isDark ? 'bg-gray-800 text-gray-400' : 'bg-slate-200 text-slate-600')
                            : (isDark ? 'bg-gray-900/90 text-gray-500 border border-white/5' : 'bg-slate-100 text-slate-400 border border-slate-200/60')
                      }`}>
                        {isActive ? (
                          isLessonUnlocked ? (
                            <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )
                        ) : isLessonUnlocked ? (
                          <span>{idx + 1}</span>
                        ) : (
                          <Lock className="w-3 h-3 text-slate-400" />
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

                          {!isEnrolled && (
                            les.isFree ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                ফ্রি ডেমো
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> লকড
                              </span>
                            )
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

      {/* Direct In-Player Enrollment Checkout Modal */}
      {showCheckoutModal && (
        <CheckoutModal
          course={course}
          siteSettings={data?.siteSettings}
          onClose={() => setShowCheckoutModal(false)}
          onSuccess={() => {
            setShowCheckoutModal(false);
          }}
        />
      )}
    </div>
  );
}
