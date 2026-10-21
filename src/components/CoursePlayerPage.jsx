import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Play, 
  FileText, 
  Download, 
  ExternalLink, 
  Clock, 
  ChevronDown, 
  ListVideo, 
  Lock, 
  ShoppingCart, 
  Trophy,
  AlertCircle,
  Timer,
  Calendar,
  Zap
} from 'lucide-react';
import { masterEnglishCourseData } from '../data/masterEnglishCourseData';
import { physicsFinishingTouchCourseData } from '../data/physicsFinishingTouchData';
import { freeCoursesData } from '../data/freeCoursesData';
import { initialData } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getAdminSession } from '../services/adminAuthService';
import { loadExamQuestions, getQuestionCorrectIndex, cleanExplanation } from '../utils/examBatchStorage';
import { useEnrollmentStatus } from '../utils/enrollmentService';
import Navbar from './Navbar';
import SureShotExamSystem from './SureShotExamSystem';
import CheckoutModal from './CheckoutModal';
import ProfileModal from './ProfileModal';
import { isStudentProfileComplete, getResolvedStudent } from '../utils/studentProfile';
import { recordQuizSubmission } from '../services/quizService';
import { getQuizScheduleState } from '../utils/quizScheduleHelper';

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

export function getGoogleDrivePreviewUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (trimmed.includes('drive.google.com/file/d/')) {
    return trimmed.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview');
  }
  return trimmed;
}

export default function CoursePlayerPage({
  data,
  courseId,
  initialLesson,
  onNavigateCourse,
  onNavigateDashboard,
  onNavigateHome,
  onNavigateExams,
  onNavigateLeaderboard,
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
    const cleanTarget = cidStr.replace(/[^a-z0-9]/g, '');

    const isPhysicsTarget = (
      cleanTarget.includes('physicsfinishing') ||
      cleanTarget.includes('course1791887161017') ||
      cidStr.includes('physics')
    );

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
        (titleStr && titleStr === cidStr) ||
        (idStr && idStr.replace(/[^a-z0-9]/g, '') === cleanTarget) ||
        (slugStr && slugStr.replace(/[^a-z0-9]/g, '') === cleanTarget)
      );
    });
    if (foundDynamic) {
      if (isPhysicsTarget) {
        const dynamicCurr = Array.isArray(foundDynamic.curriculum) && foundDynamic.curriculum.length > 0
          ? [...foundDynamic.curriculum]
          : [...physicsFinishingTouchCourseData.curriculum];

        const defaultSec2 = physicsFinishingTouchCourseData.curriculum[1];
        const hasSec2 = dynamicCurr[1] && (
          (dynamicCurr[1].lessons && dynamicCurr[1].lessons.length > 0) ||
          (dynamicCurr[1].chapters && dynamicCurr[1].chapters.some(c => c.lessons && c.lessons.length > 0))
        );
        if (!hasSec2) {
          dynamicCurr[1] = defaultSec2;
        }

        return {
          ...physicsFinishingTouchCourseData,
          ...foundDynamic,
          curriculum: dynamicCurr
        };
      }
      return foundDynamic;
    }

    // Check by numeric index if passed as 0, 1, 2...
    if (!isNaN(Number(cid)) && coursesList[Number(cid)]) {
      const indexedCourse = coursesList[Number(cid)];
      if (isPhysicsTarget || String(indexedCourse?.slug || '').includes('physics')) {
        const dynamicCurr = Array.isArray(indexedCourse.curriculum) && indexedCourse.curriculum.length > 0
          ? [...indexedCourse.curriculum]
          : [...physicsFinishingTouchCourseData.curriculum];

        const defaultSec2 = physicsFinishingTouchCourseData.curriculum[1];
        const hasSec2 = dynamicCurr[1] && (
          (dynamicCurr[1].lessons && dynamicCurr[1].lessons.length > 0) ||
          (dynamicCurr[1].chapters && dynamicCurr[1].chapters.some(c => c.lessons && c.lessons.length > 0))
        );
        if (!hasSec2) {
          dynamicCurr[1] = defaultSec2;
        }

        return {
          ...physicsFinishingTouchCourseData,
          ...indexedCourse,
          curriculum: dynamicCurr
        };
      }
      return indexedCourse;
    }

    // 2. Check free courses
    const foundFree = freeCoursesData.find(c => {
      if (!c) return false;
      const idStr = String(c.id !== undefined ? c.id : '').trim().toLowerCase();
      const slugStr = String(c.slug || '').trim().toLowerCase();
      return idStr === cidStr || slugStr === cidStr;
    });
    if (foundFree) return foundFree;

    // Check if target is Physics Finishing Touch before master english
    if (isPhysicsTarget) {
      return physicsFinishingTouchCourseData;
    }

    // 3. Check for dynamic master english course before falling back to static
    const masterInList = coursesList.find(c => 
      (c.id && c.id.includes('master-english')) || 
      (c.slug && c.slug.includes('master-english')) ||
      (c.title && c.title.toLowerCase().includes('master english'))
    );
    if (masterInList) return masterInList;

    // Fallback to static master English course only if not found dynamically
    if (cidStr === 'master-english-30-days' || cidStr === String(masterEnglishCourseData.id).toLowerCase()) {
      return masterEnglishCourseData;
    }

    return coursesList[0] || masterEnglishCourseData;
  }, [courseId, data]);

  const _isCourseEnrolled = useEnrollmentStatus(course, currentUser, data);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'admin@eduhunters.com' || Boolean(getAdminSession());
  const isFreeCourse = Boolean(course?.isFree) || (course?.salePrice !== undefined && Number(course?.salePrice) === 0 && Number(course?.price || 0) === 0);
  // If student is genuinely enrolled, user is admin, or course is free, everything is unlocked
  const isEnrolled = _isCourseEnrolled || isAdmin || isFreeCourse;
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingPlaylistIndex, setPendingPlaylistIndex] = useState(null);

  // Flatten curriculum into ordered array of lessons with metadata
  const allLessons = useMemo(() => {
    const list = [];
    const curriculum = course.curriculum || [];
    const isPhysicsCourse = (
      course.id === 'course-1791887161017' ||
      course.slug === 'physics-finishing-touch-series' ||
      String(course.title || course.name || '').toLowerCase().includes('physics finishing')
    );

    curriculum.forEach((sec, secIdx) => {
      const secTitle = sec.name || sec.title || `Module ${secIdx + 1}`;
      const hasChapterLessons = Array.isArray(sec.chapters) && sec.chapters.some(ch => (ch.lessons || []).length > 0);

      // Only check seed lessons for section 0 (Physics 1st Paper); section 1+ (2nd Paper etc.) belongs strictly to user
      const seedSec = (isPhysicsCourse && secIdx === 0) ? physicsFinishingTouchCourseData.curriculum?.[0] : null;
      let seedLessons = [];
      if (seedSec?.chapters && seedSec.chapters[0]?.lessons) {
        seedLessons = seedSec.chapters[0].lessons;
      } else if (seedSec?.lessons) {
        seedLessons = seedSec.lessons;
      }

      if (hasChapterLessons) {
        sec.chapters.forEach((chap, chapIdx) => {
          const chapTitle = chap.name || chap.title || `Chapter ${chapIdx + 1}`;
          (chap.lessons || []).forEach((les, lesIdx) => {
            const isObj = typeof les === 'object' && les !== null;
            const lesId = isObj ? String(les.id !== undefined ? les.id : `s${secIdx}-c${chapIdx}-l${lesIdx}`) : `s${secIdx}-c${chapIdx}-l${lesIdx}`;
            let lesVideo = isObj ? (les.videoUrl || les.youtubeUrl || (les.videoId ? `https://www.youtube.com/watch?v=${les.videoId}` : null)) : null;
            if (isPhysicsCourse && secIdx === 0 && !lesVideo) {
              const seedLes = seedLessons[lesIdx];
              if (seedLes?.videoUrl) lesVideo = seedLes.videoUrl;
            }
            if (!lesVideo && secIdx === 0) {
              lesVideo = course.previewVideoUrl || course.videoUrl;
            }

            let resolvedPdf = null;
            let resolvedQuiz = null;
            let resolvedExamId = isObj ? les.examId : null;

            if (isObj && 'quiz' in les && les.quiz) {
              resolvedQuiz = les.quiz;
            } else if (isObj && 'exam' in les && les.exam) {
              resolvedQuiz = les.exam;
            } else if (course.id === 'master-english-30-days' || course.slug === 'master-english-30-days') {
              const defaultLes = masterEnglishCourseData.curriculum?.[secIdx]?.chapters?.[chapIdx]?.lessons?.[lesIdx];
              if (defaultLes?.quiz) resolvedQuiz = defaultLes.quiz;
            } else if (isPhysicsCourse && secIdx === 0) {
              const seedLes = seedLessons[lesIdx];
              if (seedLes?.quiz) resolvedQuiz = seedLes.quiz;
            }

            if (isObj && 'pdfUrl' in les && les.pdfUrl) {
              resolvedPdf = les.pdfUrl;
            } else if (course.id === 'master-english-30-days' || course.slug === 'master-english-30-days') {
              const defaultLes = masterEnglishCourseData.curriculum?.[secIdx]?.chapters?.[chapIdx]?.lessons?.[lesIdx];
              if (defaultLes?.pdfUrl) resolvedPdf = defaultLes.pdfUrl;
            } else if (isPhysicsCourse && secIdx === 0) {
              const seedLes = seedLessons[lesIdx];
              if (seedLes?.pdfUrl) resolvedPdf = seedLes.pdfUrl;
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
          let lesVideo = isObj ? (les.videoUrl || les.youtubeUrl || (les.videoId ? `https://www.youtube.com/watch?v=${les.videoId}` : null)) : null;
          if (isPhysicsCourse && secIdx === 0 && !lesVideo) {
            const seedLes = seedLessons[lesIdx];
            if (seedLes?.videoUrl) lesVideo = seedLes.videoUrl;
          }
          if (!lesVideo && secIdx === 0) {
            lesVideo = course.previewVideoUrl || course.videoUrl;
          }

          let resolvedPdf = isObj ? les.pdfUrl : null;
          let resolvedQuiz = isObj ? (les.quiz || les.exam) : null;

          if (isPhysicsCourse && secIdx === 0) {
            const seedLes = seedLessons[lesIdx];
            if (!resolvedPdf && seedLes?.pdfUrl) resolvedPdf = seedLes.pdfUrl;
            if (!resolvedQuiz && seedLes?.quiz) resolvedQuiz = seedLes.quiz;
          }

          list.push({
            id: lesId,
            title: isObj ? les.title : les,
            duration: isObj ? les.duration : null,
            videoUrl: lesVideo,
            pdfUrl: resolvedPdf,
            quiz: resolvedQuiz,
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
  const resolveActiveIndex = (targetLesson, lessonsList) => {
    if (!lessonsList || lessonsList.length === 0) return 0;
    if (targetLesson) {
      if (typeof targetLesson === 'number' && targetLesson >= 0 && targetLesson < lessonsList.length) {
        return targetLesson;
      }
      if (typeof targetLesson === 'object') {
        if (targetLesson.id) {
          const idx = lessonsList.findIndex(l => String(l.id) === String(targetLesson.id));
          if (idx !== -1) return idx;
        }
        if (targetLesson.title) {
          const cleanTargetTitle = String(targetLesson.title).trim().toLowerCase();
          const idx = lessonsList.findIndex(l => String(l.title).trim().toLowerCase() === cleanTargetTitle);
          if (idx !== -1) return idx;
        }
        if (targetLesson.globalIndex !== undefined && targetLesson.globalIndex >= 0 && targetLesson.globalIndex < lessonsList.length) {
          return targetLesson.globalIndex;
        }
        if (targetLesson.secIdx !== undefined && targetLesson.lessonIdx !== undefined) {
          let count = 0;
          for (let s = 0; s < targetLesson.secIdx; s++) {
            const sec = course.curriculum?.[s];
            if (sec) {
              const c = (sec.lessons || []).length || (sec.chapters || []).reduce((a, ch) => a + (ch.lessons || []).length, 0);
              count += c;
            }
          }
          count += targetLesson.lessonIdx;
          if (count >= 0 && count < lessonsList.length) return count;
        }
      }
    }
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const vParam = urlParams.get('v');
      if (vParam !== null && !isNaN(Number(vParam))) {
        const vNum = Number(vParam);
        if (vNum >= 0 && vNum < lessonsList.length) return vNum;
      }
    } catch (e) {}
    // If user is not enrolled and lesson 0 is locked, jump to first free preview
    if (!isEnrolled) {
      const firstFreeIdx = lessonsList.findIndex(l => l.isFree);
      if (firstFreeIdx !== -1) return firstFreeIdx;
    }
    return 0;
  };

  const [activeIndex, setActiveIndex] = useState(() => resolveActiveIndex(initialLesson, allLessons));

  // Reactive sync when initialLesson or allLessons changes
  useEffect(() => {
    if (initialLesson && allLessons.length > 0) {
      const newIdx = resolveActiveIndex(initialLesson, allLessons);
      setActiveIndex(newIdx);
    }
  }, [initialLesson, allLessons]);

  // Reactive sync when URL param ?v= changes
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const vParam = urlParams.get('v');
      if (vParam !== null && !isNaN(Number(vParam))) {
        const vNum = Number(vParam);
        if (vNum >= 0 && vNum < allLessons.length && vNum !== activeIndex) {
          setActiveIndex(vNum);
        }
      }
    } catch (e) {}
  }, [allLessons.length]);

  // Keep browser URL ?v= in sync with activeIndex
  useEffect(() => {
    try {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('v') !== String(activeIndex)) {
        currentUrl.searchParams.set('v', activeIndex);
        window.history.replaceState(null, '', currentUrl.toString());
      }
    } catch (e) {}
  }, [activeIndex]);

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
  const isProfileNeededForFree = !_isCourseEnrolled && Boolean(currentLesson.isFree) && (!currentUser || !isStudentProfileComplete(currentUser));
  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(() => Boolean(currentLesson?.pdfUrl));

  // Auto-expand PDF dropdown whenever current lesson has a PDF attached
  useEffect(() => {
    if (currentLesson?.pdfUrl) {
      setIsPdfDropdownOpen(true);
    }
  }, [currentLesson?.id, currentLesson?.pdfUrl]);

  const activeLessonRef = useRef(null);


  // Practice Quiz & Exam state
  const [activeLessonExam, setActiveLessonExam] = useState(null);
  const [clockTime, setClockTime] = useState(() => Date.now());

  // Real-time ticker for scheduled exam locks and countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    // Strictly prevent starting upcoming scheduled exams before start date
    if (currentLesson.quiz) {
      const sched = getQuizScheduleState(currentLesson.quiz, clockTime);
      if (sched.isUpcoming) {
        alert(`এই পরীক্ষাটি নির্ধারিত সময়ের আগে শুরু করা যাবে না। পরীক্ষা শুরু হওয়ার নির্ধারিত সময়: ${sched.formattedStartBn}`);
        return;
      }
    }

    let qList = [];
    let durMins = Number(currentLesson.quiz?.durationMinutes) || 10;
    let negMark = currentLesson.quiz?.negativeMark !== undefined ? Number(currentLesson.quiz.negativeMark) : 0.25;
    let rawTitle = currentLesson.quiz?.title || currentLesson.title || 'Class Quiz';
    let examTitle = rawTitle.replace(/\s*-\s*quiz/gi, '').replace(/\bquiz\b/gi, '').trim();
    if (!examTitle.endsWith('Quiz')) examTitle = `${examTitle} - Quiz`;

    if (currentLesson.quiz?.questions && Array.isArray(currentLesson.quiz.questions) && currentLesson.quiz.questions.length > 0) {
      qList = currentLesson.quiz.questions;
    } else if (currentLesson.examId) {
      try {
        const res = await loadExamQuestions({ id: currentLesson.examId });
        if (res?.questions && res.questions.length > 0) {
          qList = res.questions;
          if (res.title) {
            let cleanResTitle = res.title.replace(/\s*-\s*quiz/gi, '').replace(/\bquiz\b/gi, '').trim();
            examTitle = cleanResTitle.endsWith('Quiz') ? cleanResTitle : `${cleanResTitle} - Quiz`;
          }
          if (res.duration_minutes) durMins = Number(res.duration_minutes);
          if (res.negative_mark !== undefined) negMark = Number(res.negative_mark);
        }
      } catch (err) {
        console.warn('Failed to load exam questions:', err);
      }
    }

    if (!qList || qList.length === 0) return;

    // Normalize questions to match SureShotExamSystem schema
    const normalizedQuestions = qList.map((q, idx) => {
      const options = Array.isArray(q.options) ? q.options : [];
      const qWithOptions = { ...q, options };
      const cIdx = getQuestionCorrectIndex(qWithOptions);
      return {
        ...q,
        id: q.id !== undefined ? q.id : `q-${idx + 1}`,
        question_no: idx + 1,
        question: q.question || q.title || `Question ${idx + 1}`,
        options,
        correct_index: cIdx,
        correctIndex: cIdx,
        explanation: cleanExplanation(q.explanation || q.hint || '', qWithOptions)
      };
    });

    const examPayload = {
      id: currentLesson.quiz?.id || currentLesson.examId || `lesson-exam-${currentLesson.id}`,
      exam_id: currentLesson.quiz?.id || currentLesson.examId || `lesson-exam-${currentLesson.id}`,
      title: examTitle,
      category: 'course_lesson',
      categoryName: course.title || course.name || 'Master English',
      subCategory: null,
      subject: course.subject || 'Physics',
      durationMinutes: durMins,
      duration_minutes: durMins,
      totalQuestions: normalizedQuestions.length,
      total_questions: normalizedQuestions.length,
      negativeMark: negMark,
      negative_mark: negMark,
      hasExplanations: true,
      questions: normalizedQuestions,
      startDate: currentLesson.quiz?.startDate,
      endDate: currentLesson.quiz?.endDate
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
          onNavigateLeaderboard={() => { setActiveLessonExam(null); onNavigateLeaderboard?.(); }}
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
            onExamComplete={async (result) => {
              const totalPossible = activeLessonExam.totalMarks || activeLessonExam.totalQuestions || result.totalQuestions;
              const resultObj = {
                score: result.finalScore,
                totalPossible: totalPossible,
                correctCount: result.correct,
                wrongCount: result.wrong,
                skippedCount: result.skipped,
                totalQuestions: result.totalQuestions,
                percentage: result.percentage,
                timeTakenSeconds: result.timeTakenSeconds || 0
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

              try {
                const resolvedStudent = getResolvedStudent(currentUser);
                await recordQuizSubmission({
                  student: resolvedStudent,
                  course,
                  lesson: currentLesson,
                  quiz: currentLesson.quiz,
                  result: resultObj,
                  timeTakenSeconds: result.timeTakenSeconds || 0
                });
              } catch (e) {
                console.warn('[CoursePlayer] Failed to record quiz submission:', e);
              }
            }}
            siteSettings={data?.siteSettings || {}}
            customExamBatches={data?.examBatches}
            courses={data?.courses}
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
        onNavigateLeaderboard={onNavigateLeaderboard}
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
              ) : isProfileNeededForFree ? (
                /* FREE TRIAL PROFILE COMPLETION REQUIRED SCREEN */
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 sm:p-10 relative overflow-hidden bg-gradient-to-br from-[#120206] via-[#1a040b] to-[#0d0104]">
                  {/* Ambient Glow */}
                  <div className="absolute w-72 h-72 rounded-full bg-[#e11438]/20 blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 max-w-lg space-y-4">
                    {/* Glowing Free Trial Badge */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#991b1b] via-[#e11438] to-[#ff4d6d] text-white flex items-center justify-center mx-auto shadow-2xl shadow-red-500/30 border border-white/20">
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white ml-1" />
                    </div>

                    <div className="space-y-1.5">
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        🎁 ফ্রি ট্রায়াল ক্লাস · Free Trial
                      </span>
                      <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
                        {currentLesson.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
                        ফ্রি ট্রায়াল ক্লাসটি চালু করতে আপনার নাম, সচল মোবাইল নম্বর, কলেজ ও ক্লাস পূরণ করুন। সংরক্ষণ করা মাত্রই ক্লাসটি স্বয়ংক্রিয়ভাবে চালু হয়ে যাবে।
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!currentUser) {
                            if (onLoginClick) onLoginClick();
                          } else {
                            setShowProfileModal(true);
                          }
                        }}
                        className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#e11438] to-[#ff2a55] hover:opacity-95 text-white text-xs sm:text-sm font-black shadow-lg shadow-red-600/30 cursor-pointer border-none transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>{!currentUser ? 'লগইন করে ক্লাস শুরু করুন' : 'প্রোফাইল পূরণ করে ক্লাস দেখুন'}</span>
                      </button>
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
                              Lecture Sheet & PDF Locked
                            </h4>
                            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                              Enroll in the course to download official digital lecture sheets, notes, and practice files.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCheckoutModal(true)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none transition-all flex items-center gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Enroll in Course Now</span>
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
                                  {currentLesson.title}
                                </h3>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                  অফিশিয়াল লেকচার শিট ও প্র্যাকটিস নোট
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <a
                                href={currentLesson.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#e11438] to-[#ff2a55] hover:opacity-95 text-white text-xs font-bold text-decoration-none shadow-md shadow-red-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer min-w-[110px]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open PDF</span>
                              </a>

                              <a
                                href={currentLesson.pdfUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-decoration-none border transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] min-w-[110px] ${
                                  isDark 
                                    ? 'border-[#e11438]/40 bg-[#24060f] hover:bg-[#320815] text-red-200 hover:text-white' 
                                    : 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700'
                                }`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>

                          {/* Direct In-App Google Drive / PDF Preview Window */}
                          <div className={`w-full h-[520px] sm:h-[650px] rounded-2xl overflow-hidden border shadow-lg ${
                            isDark ? 'border-[#e11438]/25 bg-[#0d0205]' : 'border-slate-200 bg-white'
                          }`}>
                            <iframe
                              src={getGoogleDrivePreviewUrl(currentLesson.pdfUrl)}
                              title={`${currentLesson.title} - Lecture Sheet`}
                              className="w-full h-full border-0"
                              allow="autoplay"
                            />
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
                              No Lecture Sheet or PDF Attached Yet
                            </h4>
                            <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                              Lecture sheets and PDFs will appear here once published for this class.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Class Exam & Quiz Section (Always Directly Visible / Expanded) */}
              {(!isCurrentLessonUnlocked || currentLesson.quiz || currentLesson.examId) && (
                <div className="mt-4 pt-4 border-t border-gray-500/15 space-y-4">
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
                              Class Exam is Locked
                            </h4>
                            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                              Enroll in the course to access chapter MCQs and live exams.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCheckoutModal(true)}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none transition-all flex items-center gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Enroll in Course Now</span>
                          </button>
                        </div>
                      ) : (currentLesson.quiz || currentLesson.examId) ? (() => {
                        const sched = getQuizScheduleState(currentLesson.quiz, clockTime);
                        const savedScore = savedLessonScores[currentLesson.id];
                        const totalQs = currentLesson.quiz?.questions?.length || currentLesson.quiz?.totalQuestions || 50;
                        const durMins = currentLesson.quiz?.durationMinutes || 30;
                        const negMark = currentLesson.quiz?.negativeMark !== undefined ? currentLesson.quiz.negativeMark : 0.25;
                        const rawQuizTitle = (currentLesson.quiz?.title || currentLesson.title || 'Class Quiz')
                          .replace(/\s*-\s*quiz/gi, '')
                          .replace(/\s*-\s*পরীক্ষা/gi, '')
                          .replace(/\bquiz\b/gi, '')
                          .trim();
                        const quizTitle = rawQuizTitle || 'Class Quiz';

                        // -------------------------------------------------------------
                        // STATE 1: UPCOMING (STRICTLY LOCKED UNTIL START DATE & TIME)
                        // -------------------------------------------------------------
                        if (sched.isUpcoming) {
                          return (
                            <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all relative overflow-hidden ${
                              isDark 
                                ? 'bg-gradient-to-br from-[#1a040b]/95 via-[#120206] to-[#0a0104] border-[#e11438]/30 shadow-[0_8px_30px_rgba(225,20,56,0.1)]' 
                                : 'bg-gradient-to-br from-red-50/80 via-rose-50/40 to-white border-red-200/90 shadow-sm'
                            }`}>
                              {/* Ambient Red Glow in Dark Mode */}
                              {isDark && (
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#e11438]/10 rounded-full blur-3xl pointer-events-none" />
                              )}

                              <div className="relative z-10 space-y-4">
                                {/* Title & Exam Meta Chips (Center Aligned) */}
                                <div className="text-center space-y-2">
                                  <h4 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                                    {quizTitle}
                                  </h4>
                                  <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-medium">
                                    <span className={`px-2.5 py-1 rounded-lg border ${
                                      isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                    }`}>
                                      {totalQs} Questions
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg border ${
                                      isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                    }`}>
                                      {durMins} Minutes
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg border ${
                                      isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                    }`}>
                                      Total Marks: {totalQs}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg border ${
                                      isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
                                    }`}>
                                      Neg Mark: {negMark}
                                    </span>
                                  </div>
                                </div>

                                {/* Scheduled Start Time Callout */}
                                <div className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  isDark ? 'bg-[#1a040b]/80 border-red-500/20 text-red-300/90' : 'bg-red-100/60 border-red-300/70 text-red-900'
                                }`}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
                                      <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                                        Exam Scheduled Start Time
                                      </p>
                                      <p className="text-sm sm:text-base font-bold text-red-500 dark:text-red-400 mt-0.5">
                                        {sched.formattedStartEn || sched.formattedStartBn}
                                      </p>
                                    </div>
                                  </div>

                                  {sched.endDate && (
                                    <div className="text-left sm:text-right text-[11px] font-medium opacity-80">
                                      <span>Ends: {sched.formattedEndEn || sched.formattedEndBn}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Real-time Countdown Box */}
                                <div className={`p-4 rounded-2xl border text-center space-y-2.5 ${
                                  isDark ? 'bg-black/40 border-red-500/25' : 'bg-white border-red-200'
                                }`}>
                                  <p className={`text-xs font-semibold flex items-center justify-center gap-1.5 ${
                                    isDark ? 'text-red-400' : 'text-red-700'
                                  }`}>
                                    <Timer className="w-4 h-4 text-red-500" />
                                    <span>Time Remaining Until Exam Starts</span>
                                  </p>

                                  <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                                    {sched.countdown?.days > 0 && (
                                      <div className={`px-3 py-2 rounded-xl border min-w-[64px] text-center ${
                                        isDark ? 'bg-[#180a04] border-red-500/30' : 'bg-red-50 border-red-200'
                                      }`}>
                                        <span className="text-xl sm:text-2xl font-black font-mono text-red-500 block leading-tight">
                                          {sched.countdown.days}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Days</span>
                                      </div>
                                    )}
                                    <div className={`px-3 py-2 rounded-xl border min-w-[64px] text-center ${
                                      isDark ? 'bg-[#180a04] border-red-500/30' : 'bg-red-50 border-red-200'
                                    }`}>
                                      <span className="text-xl sm:text-2xl font-black font-mono text-red-500 block leading-tight">
                                        {sched.countdown?.hours ?? 0}
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hours</span>
                                    </div>
                                    <div className={`px-3 py-2 rounded-xl border min-w-[64px] text-center ${
                                      isDark ? 'bg-[#180a04] border-red-500/30' : 'bg-red-50 border-red-200'
                                    }`}>
                                      <span className="text-xl sm:text-2xl font-black font-mono text-red-500 block leading-tight">
                                        {sched.countdown?.minutes ?? 0}
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mins</span>
                                    </div>
                                    <div className={`px-3 py-2 rounded-xl border min-w-[64px] text-center ${
                                      isDark ? 'bg-[#180a04] border-red-500/30' : 'bg-red-50 border-red-200'
                                    }`}>
                                      <span className="text-xl sm:text-2xl font-black font-mono text-red-500 block leading-tight">
                                        {sched.countdown?.seconds ?? 0}
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Secs</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Information & Instructions */}
                                <div className={`p-3 rounded-xl text-xs leading-relaxed flex items-start gap-2.5 ${
                                  isDark ? 'bg-white/5 text-gray-300' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                  <p>
                                    This official exam will unlock automatically at the scheduled time. Official merit ranking and leaderboard will be prepared from first-attempt submissions.
                                  </p>
                                </div>

                                {/* Disabled Locked CTA Button */}
                                <button
                                  type="button"
                                  disabled
                                  className="w-full py-3.5 px-6 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500/80 font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-not-allowed select-none opacity-85 transition-all"
                                >
                                  <Lock className="w-4 h-4" />
                                  <span>Exam Unlocks at Scheduled Time ({sched.countdown?.text || 'Wait'})</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                            <div className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all relative overflow-hidden ${
                              isDark 
                                ? 'bg-gradient-to-br from-[#1a040b]/95 via-[#120206] to-[#0a0104] border-[#e11438]/35 shadow-[0_8px_30px_rgba(225,20,56,0.14)]' 
                                : 'bg-gradient-to-br from-red-50/90 via-rose-50/40 to-white border-red-200 shadow-sm'
                            }`}>
                              {/* Ambient Red Glow in Dark Mode */}
                              {isDark && (
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#e11438]/10 rounded-full blur-3xl pointer-events-none" />
                              )}

                              <div className="relative z-10 space-y-4">
                                {/* Title & Exam Meta Chips (Center Aligned) */}
                                <div className="text-center space-y-2">
                                  <h4 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                                    {quizTitle}
                                  </h4>
                                  <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-medium">
                                    <span className={`px-2.5 py-1 rounded-lg border ${
                                      isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                    }`}>
                                      {totalQs} Questions
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg border ${
                                      isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                    }`}>
                                      {durMins} Minutes
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg border ${
                                      isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                    }`}>
                                      Total Marks: {totalQs}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg border ${
                                      isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
                                    }`}>
                                      Neg Mark: {negMark}
                                    </span>
                                  </div>
                                </div>

                                {sched.endDate && (
                                  <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium ${
                                    isDark ? 'bg-red-950/25 border-red-500/25 text-red-300' : 'bg-red-50 border-red-200 text-red-900'
                                  }`}>
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="w-4 h-4 text-red-500" />
                                      Live Ends: {sched.formattedEndEn || sched.formattedEndBn}
                                    </span>
                                    {sched.countdown && (
                                      <span className="font-mono font-bold text-red-500 dark:text-red-400">
                                        Time Left: {sched.countdown.text || sched.countdown.bnText}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {savedScore && (
                                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                                    isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                  }`}>
                                    <span>Official Score: <strong>{savedScore.score} / {savedScore.totalPossible}</strong></span>
                                    <span className="text-[11px] opacity-75">1st Attempt Ranked on Leaderboard</span>
                                  </div>
                                )}

                                {onNavigateLeaderboard && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigateLeaderboard(course?.id || course?.slug || courseId, currentLesson?.id)}
                                    className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer border shadow-sm hover:scale-[1.01] active:scale-[0.99] ${
                                      isDark 
                                        ? 'bg-[#22060f] hover:bg-[#320816] text-[#ff4d6d] hover:text-white border-[#e11438]/35 hover:border-[#e11438]/60 shadow-red-950/30' 
                                        : 'bg-red-50/90 hover:bg-red-100 text-[#dc2626] border-red-200 shadow-xs'
                                    }`}
                                  >
                                    <Trophy className="w-4 h-4 text-[#ff4d6d]" />
                                    <span>Live Leaderboard</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={handleStartQuiz}
                                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#e11438] to-[#ff2a55] hover:opacity-95 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border-none"
                                >
                                  <Play className="w-4 h-4 fill-white" />
                                  <span>{savedScore ? 'Retake Exam (Practice)' : 'Start Exam'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })() : null}
                </div>
              )}

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
                  <h3 className="text-sm sm:text-base font-black leading-tight">Course Playlist</h3>
                </div>

                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                  isDark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-slate-200/70 text-slate-700'
                }`}>
                  {allLessons.length} Classes
                </span>
              </div>

              {/* Lesson Items Scrollable Container with Harmonious Smooth Scrollbar */}
              <div className="max-h-[calc(100vh-220px)] overflow-y-auto divide-y divide-gray-500/10 p-2 scroll-smooth playlist-scrollbar pr-1.5">
                {allLessons.map((les, idx) => {
                  const isActive = idx === activeIndex;
                  const isLessonUnlocked = isEnrolled || Boolean(les.isFree);

                  return (
                    <div
                      key={les.id || idx}
                      onClick={() => {
                        if (!isLessonUnlocked) {
                          setShowCheckoutModal(true);
                          return;
                        }
                        if (!_isCourseEnrolled && les.isFree && (!currentUser || !isStudentProfileComplete(currentUser))) {
                          if (!currentUser) {
                            if (onLoginClick) onLoginClick();
                          } else {
                            setPendingPlaylistIndex(idx);
                            setShowProfileModal(true);
                          }
                          return;
                        }
                        setActiveIndex(idx);
                      }}
                      className={`group flex items-center justify-between gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? (isDark ? 'bg-red-500/15 border border-red-500/30' : 'bg-red-50 border border-red-200/80')
                          : (isDark ? 'hover:bg-[#20050d] border border-transparent' : 'hover:bg-slate-100/70 border border-transparent')
                      }`}
                    >
                      {/* Left: Circle icon + Title */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-105 ${
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
                            <Lock className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className={`text-xs sm:text-sm font-semibold line-clamp-2 leading-snug transition-colors ${
                            isActive
                              ? 'text-red-500 font-bold'
                              : (isDark ? 'text-gray-200 group-hover:text-red-400' : 'text-slate-800 group-hover:text-[#dc2626]')
                          }`}>
                            {les.title}
                          </p>
                          {(les.pdfUrl || les.quiz) && (
                            <div className="flex items-center gap-2 mt-1">
                              {les.pdfUrl && (
                                <span className="text-gray-400 hover:text-white transition-colors" title="লেকচার শিট PDF">
                                  <FileText className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {les.quiz && (
                                <span className="text-gray-400 hover:text-white transition-colors" title="কুইজ">
                                  <Zap className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Badges (FREE demo class indicator) */}
                      {!isEnrolled && les.isFree && (
                        <div className="shrink-0 flex items-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25 select-none">
                            FREE
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Profile Completion Gate Modal for Free Trial Classes */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setPendingPlaylistIndex(null);
        }}
        requireCompletion={true}
        title="প্রোফাইল তথ্য পূরণ করুন"
        subtitle="ফ্রি ট্রায়াল ক্লাসটি চালু করতে আপনার নাম, মোবাইল নম্বর, কলেজ এবং ক্লাস/ব্যাচ পূরণ করুন।"
        submitText="সংরক্ষণ করে ক্লাস শুরু করুন"
        hintNotice="✅ তথ্যগুলো সংরক্ষণ করার সাথে সাথেই ফ্রি ট্রায়াল ক্লাসটি চালু হয়ে যাবে।"
        onSaveSuccess={(updatedProfile) => {
          setShowProfileModal(false);
          if (pendingPlaylistIndex !== null) {
            setActiveIndex(pendingPlaylistIndex);
            setPendingPlaylistIndex(null);
          }
        }}
      />

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
