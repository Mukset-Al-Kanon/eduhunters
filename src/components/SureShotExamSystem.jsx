import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, Clock, HelpCircle, BookOpen, CheckCircle2, 
  Send, RefreshCw, Trophy, Award, Check, X, AlertTriangle, 
  ChevronDown, ChevronUp, ChevronRight, Eye, ShieldAlert,
  Search, Filter, Sparkles, Flame, Bookmark, History,
  BarChart3, CheckSquare, XCircle, Grid, ListFilter, ArrowRight, User, FileText,
  Lock, Play, SlidersHorizontal
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { EXAM_CATEGORIES_METADATA, EXAM_PAGE_FILTER_TABS } from '../data/examCategoriesData';
import CategoryDetailModal from './CategoryDetailModal';
import ExamDetailPage from './ExamDetailPage';
import CheckoutModal from './CheckoutModal';
import RtdsCurriculumView from './RtdsCurriculumView';
import MasterEnglishCurriculumView from './MasterEnglishCurriculumView';
import { stripEmoji } from '../utils/textUtils';
import { getMergedExamManifest, loadExamQuestions, getQuestionCorrectIndex, cleanExplanation, getUserAnswer } from '../utils/examBatchStorage';
import { getStoredEnrolledBatches, isItemEnrolled } from '../utils/enrollmentService';
import { recordQuizSubmission, fetchLessonLeaderboard } from '../services/quizService';
import { getResolvedStudent } from '../utils/studentProfile';


// Fallback initial lists for instant rendering before manifest loads
const INITIAL_SURE_SHOT = [
  { id: "sureshot-1", title: "Botany Exam (Sure Shot)", category: "sureshot", subCategory: "General", subject: "Biology", filePath: "sureshot/Botany Exam (Sure Shot).json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-2", title: "Chemistry 1st paper - Sure shot", category: "sureshot", subCategory: "General", subject: "Chemistry", filePath: "sureshot/Chemistry 1st paper - Sure shot.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-3", title: "Chemistry 1st part - Sure Shot", category: "sureshot", subCategory: "General", subject: "Chemistry", filePath: "sureshot/Chemistry 1st part - Sure Shot.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-4", title: "Chemistry 2nd Paper - Sure shot", category: "sureshot", subCategory: "General", subject: "Chemistry", filePath: "sureshot/Chemistry 2nd Paper - Sure shot.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-5", title: "Chemistry 2nd part - Sure Shot", category: "sureshot", subCategory: "General", subject: "Chemistry", filePath: "sureshot/Chemistry 2nd part - Sure Shot.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-6", title: "English Vocabulary", category: "sureshot", subCategory: "General", subject: "English", filePath: "sureshot/English Vocabulary.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-7", title: "English grammar", category: "sureshot", subCategory: "General", subject: "English", filePath: "sureshot/English grammar.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-8", title: "English subject Final - Sure Shot", category: "sureshot", subCategory: "General", subject: "English", filePath: "sureshot/English subject Final - Sure Shot.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-9", title: "GK - Subject Final", category: "sureshot", subCategory: "General", subject: "General Knowledge", filePath: "sureshot/GK - Subject Final.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-10", title: "GK Bangladesh part (Sure Shot)", category: "sureshot", subCategory: "General", subject: "General Knowledge", filePath: "sureshot/GK Bangladesh part (Sure Shot).json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-11", title: "GK international - sure shot", category: "sureshot", subCategory: "General", subject: "General Knowledge", filePath: "sureshot/GK international - sure shot.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-12", title: "Mega exam - Sure Shot", category: "sureshot", subCategory: "General", subject: "Medical", filePath: "sureshot/Mega exam - Sure Shot.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-13", title: "Physics 1st Paper (Sure Shot)", category: "sureshot", subCategory: "General", subject: "Physics", filePath: "sureshot/Physics 1st Paper (Sure Shot).json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-14", title: "Physics 2nd Paper (Sure Shot)", category: "sureshot", subCategory: "General", subject: "Physics", filePath: "sureshot/Physics 2nd Paper (Sure Shot).json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-15", title: "Sure shot - Botany extra writer", category: "sureshot", subCategory: "General", subject: "Biology", filePath: "sureshot/Sure shot - Botany extra writer.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-16", title: "Zoology - Other writers", category: "sureshot", subCategory: "General", subject: "Biology", filePath: "sureshot/Zoology - Other writers.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true },
  { id: "sureshot-17", title: "Zoology Exam Sure Shot", category: "sureshot", subCategory: "General", subject: "Biology", filePath: "sureshot/Zoology Exam Sure Shot.json", totalQuestions: 100, durationMinutes: 40, totalMarks: 100, negativeMark: 0.25, hasExplanations: true }
];

const CATEGORY_TABS = [
  { key: 'all', name: 'সব ক্যাটাগরি', count: '৯৭০টি', icon: '🌟' },
  { key: 'sureshot', name: 'Sure Shot Carnival', count: '১৭টি', icon: '🎯' },
  { key: 'medical', name: 'মেডিকেল বিগত ১১ বছর (MAT)', count: '১১টি', icon: '🩺' },
  { key: 'rtds', name: 'অনুশীলনী ও মেডিকেল প্রশ্নব্যাংক', count: '৩৭৭টি', icon: '🔬' },
  { key: 'english_master', name: 'ইংলিশ মাস্টার ৫০', count: '২৬৭টি', icon: '🔤' },
  { key: 'gk_course', name: 'জিকে ফুল কোর্স ২৬', count: '২৫৫টি', icon: '🌍' },
  { key: 'medilogy', name: 'মেডিলজি ডেইলি প্ল্যানার', count: '৪৩টি', icon: '📖' },
  { key: 'history', name: 'আমার এক্সাম হিস্টোরি', count: '', icon: '📊' }
];

const SUBJECT_FILTERS = [
  { key: 'all', label: 'All Subjects' },
  { key: 'Biology', label: '🌿 Biology' },
  { key: 'Physics', label: '⚛️ Physics' },
  { key: 'Chemistry', label: '🧪 Chemistry' },
  { key: 'English', label: '🔤 English' },
  { key: 'General Knowledge', label: '🌍 GK' },
  { key: 'Medical', label: '🩺 Medical' },
  { key: 'BCS', label: '🏛️ BCS' }
];

const BENGALI_LETTERS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

const calcDiscount = (orig, curr) => {
  if (!orig || !curr) return 400;
  const bnMap = { '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9 };
  const toEnNum = (val) => {
    let s = String(val);
    let res = '';
    for (let char of s) {
      if (bnMap[char] !== undefined) res += bnMap[char];
      else if (char >= '0' && char <= '9') res += char;
    }
    return parseInt(res, 10) || 0;
  };
  const o = toEnNum(orig);
  const c = toEnNum(curr);
  return (o > c) ? (o - c) : 400;
};

export default function SureShotExamSystem({ 
  onBackToCourses, 
  initialStep = 'category_cards', 
  initialCategory = null, 
  initialExam = null,
  isCourseQuiz: isCourseQuizProp = false,
  onBackToLesson = null,
  onExamComplete = null,
  onSwitchToBoard, 
  siteSettings, 
  customExamBatches = null,
  courses = null,
  isFromBundle = false,
  onBackToBundle = null,
  onLoginClick = null
}) {
  const { isDark } = useTheme();
  const categoriesMetadata = (customExamBatches && customExamBatches.length > 0)
    ? customExamBatches
    : EXAM_CATEGORIES_METADATA;

  const isCategoryActive = useCallback((cat) => {
    if (!cat) return false;
    if (cat.isHidden) return false;
    if (cat.isActive === false) return false;
    if (Array.isArray(courses) && courses.length > 0) {
      const match = courses.find(c =>
        (c.key && cat.key && c.key === cat.key) ||
        (c.id && cat.key && c.id === cat.key) ||
        (c.slug && cat.key && c.slug === cat.key) ||
        (c.id && cat.id && c.id === cat.id) ||
        (c.title && cat.title && c.title.trim().toLowerCase() === cat.title.trim().toLowerCase())
      );
      if (match && match.isActive === false) return false;
    }
    return true;
  }, [courses]);

  const isCourseQuiz = Boolean(
    isCourseQuizProp ||
    onBackToLesson ||
    initialExam
  );

  const handleBackToClass = () => {
    if (onBackToLesson) {
      onBackToLesson();
    } else if (onBackToCourses) {
      onBackToCourses();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      try {
        window.location.href = '/courses/master-english-30-days/watch';
      } catch (e) {}
    }
  };

  // Navigation states: 'category_cards' | 'category_detail' | 'course_card' | 'exam_list' | 'exam_intro' | 'exam_live' | 'exam_result'
  const [step, setStep] = useState(() => {
    if (initialExam || isCourseQuizProp) return initialStep || 'exam_intro';
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlStep = urlParams.get('step');
      const urlCat = urlParams.get('category');
      const urlExam = urlParams.get('exam');

      // Only enter exam_result if URL explicitly specifies step=exam_result
      if (urlStep === 'exam_result') {
        return 'exam_result';
      }

      // Check if user was actively taking this specific exam and refreshed after submitting
      const activeSaved = sessionStorage.getItem('eduhunters_active_exam_result');
      if (activeSaved && urlStep === 'exam_live' && urlExam) {
        try {
          const parsed = JSON.parse(activeSaved);
          if (parsed.examId === urlExam) {
            return 'exam_result';
          }
        } catch (e) {}
      }

      if (urlStep) return urlStep;
      if (urlCat && urlCat !== 'all') return 'category_detail';
      if (initialCategory && initialCategory !== 'all') return initialStep || 'category_detail';
    } catch (e) {}
    return initialStep || 'category_cards';
  });
  
  // Category Cards & Detail Page states
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCat = urlParams.get('category') || initialCategory;
      if (urlCat && urlCat !== 'all') {
        return categoriesMetadata.find(c => c.key === urlCat) || null;
      }
    } catch (e) {}
    return null;
  });

  // Keep selectedCategoryDetail synced if customized in Admin Panel
  React.useEffect(() => {
    if (selectedCategoryDetail) {
      const fresh = categoriesMetadata.find(c => c.key === selectedCategoryDetail.key);
      if (fresh && (fresh.title !== selectedCategoryDetail.title || fresh.price !== selectedCategoryDetail.price || fresh.image !== selectedCategoryDetail.image || fresh.enrolledCount !== selectedCategoryDetail.enrolledCount)) {
        setSelectedCategoryDetail(fresh);
      }
    }
  }, [categoriesMetadata]);
  const [selectedCategoryModal, setSelectedCategoryModal] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const { currentUser } = useAuth();
  const [guestStudentName, setGuestStudentName] = useState(() => {
    try {
      return localStorage.getItem('eh_guest_student_name') || '';
    } catch {
      return '';
    }
  });
  const [liveExamLeaderboard, setLiveExamLeaderboard] = useState([]);
  const [isLoadingExamLeaderboard, setIsLoadingExamLeaderboard] = useState(false);
  const [examClockTime, setExamClockTime] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setExamClockTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Enrolled batch keys (e.g. ['sureshot', 'medical'])
  const [enrolledBatches, setEnrolledBatches] = useState(() => {
    return getStoredEnrolledBatches();
  });

  useEffect(() => {
    const handleUpdate = () => {
      setEnrolledBatches(getStoredEnrolledBatches());
    };
    window.addEventListener('eh:enrollment_updated', handleUpdate);
    window.addEventListener('eh:orders_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('eh:enrollment_updated', handleUpdate);
      window.removeEventListener('eh:orders_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Modal state for checkout
  const [checkoutCategory, setCheckoutCategory] = useState(null);

  const handleOpenCheckoutModal = (cat) => {
    if (!currentUser) {
      if (onLoginClick) {
        onLoginClick(() => {
          setCheckoutCategory(cat);
        });
      }
      return;
    }
    setCheckoutCategory(cat);
  };

  const handleEnrollBatch = (catKey) => {
    setEnrolledBatches(prev => {
      if (prev.includes(catKey)) return prev;
      return [...prev, catKey];
    });
  };

  const isBatchEnrolled = (catKey) => {
    if (!catKey || catKey === 'all') return true;
    if (enrolledBatches.includes(catKey)) return true;
    return isItemEnrolled(catKey, currentUser);
  };

  // Manifest data state
  const [manifestData, setManifestData] = useState(null);
  const [allExams, setAllExams] = useState(INITIAL_SURE_SHOT);
  const [isLoadingManifest, setIsLoadingManifest] = useState(true);

  // Sync state if initialCategory or initialStep changes
  React.useEffect(() => {
    // If running in course quiz mode (e.g. from CoursePlayerPage lesson quiz),
    // strictly keep step in exam flow (exam_intro / exam_live / exam_result)
    // and never reset or fallback to category_cards or category_detail!
    if (isCourseQuiz || initialExam) {
      if (step !== 'exam_live' && step !== 'exam_result') {
        setStep(initialStep || 'exam_intro');
      }
      return;
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlStep = urlParams.get('step');
      const urlExam = urlParams.get('exam');
      const urlCat = urlParams.get('category') || initialCategory;

      if (urlStep === 'exam_result') {
        setStep('exam_result');
        if (urlCat && urlCat !== 'all') {
          const cat = categoriesMetadata.find(c => c.key === urlCat);
          if (cat) {
            setSelectedCategoryDetail(cat);
            setSelectedCategory(urlCat);
          }
        }
        return;
      }

      // If user was taking this live exam and refreshed after submitting
      const activeSaved = sessionStorage.getItem('eduhunters_active_exam_result');
      if (activeSaved && urlStep === 'exam_live' && urlExam) {
        try {
          const parsed = JSON.parse(activeSaved);
          if (parsed.examId === urlExam) {
            setStep('exam_result');
            if (urlCat && urlCat !== 'all') {
              const cat = categoriesMetadata.find(c => c.key === urlCat);
              if (cat) {
                setSelectedCategoryDetail(cat);
                setSelectedCategory(urlCat);
              }
            }
            return;
          }
        } catch (e) {}
      }

      if (urlStep) {
        setStep(urlStep);
        if (urlCat && urlCat !== 'all') {
          const cat = categoriesMetadata.find(c => c.key === urlCat);
          if (cat) {
            setSelectedCategoryDetail(cat);
            setSelectedCategory(urlCat);
          }
        }
        return;
      }
    } catch (e) {}

    if (initialCategory && initialCategory !== 'all') {
      const cat = categoriesMetadata.find(c => c.key === initialCategory);
      if (cat) {
        setSelectedCategoryDetail(cat);
        setSelectedCategory(initialCategory);
        setStep(initialStep || 'category_detail');
      }
    } else {
      setSelectedCategoryDetail(null);
      setSelectedCategory('all');
      setStep('category_cards');
    }
  }, [initialCategory, initialStep, categoriesMetadata, isCourseQuiz, initialExam]);

  // Handle browser popstate / back-forward within exam views
  React.useEffect(() => {
    const onPop = () => {
      // In course quiz mode, do not let browser popstate switch to category_cards
      if (isCourseQuiz || initialExam) {
        return;
      }
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlStep = urlParams.get('step');
        const urlCat = urlParams.get('category');
        const urlExam = urlParams.get('exam');
        if (urlCat && urlCat !== 'all') {
          const cat = categoriesMetadata.find(c => c.key === urlCat);
          if (cat) {
            setSelectedCategoryDetail(cat);
            setSelectedCategory(urlCat);
          }
        }
        if (urlExam && allExams && allExams.length > 0) {
          const found = allExams.find(e => e.id === urlExam);
          if (found) setSelectedExamMeta(found);
        }
        if (urlStep) {
          setStep(urlStep);
        } else if (urlCat && urlCat !== 'all') {
          setStep('category_detail');
        } else {
          setStep('category_cards');
        }
      } catch (e) {}
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [allExams, categoriesMetadata, isCourseQuiz, initialExam]);

  // View states for streamlined Category Exam List (matching user screenshot)
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const subjectDropdownRef = useRef(null);
  const [isEnglishSuggestOpen, setIsEnglishSuggestOpen] = useState(false);
  const englishSearchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target)) {
        setIsSubjectDropdownOpen(false);
      }
      if (englishSearchRef.current && !englishSearchRef.current.contains(e.target)) {
        setIsEnglishSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCat = urlParams.get('category') || initialCategory;
      if (urlCat && urlCat !== 'all') return urlCat;
    } catch (e) {}
    return 'all';
  });
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedSubCat, setSelectedSubCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(24);

  // Helper to change step and keep URL in sync for perfect refresh retention
  const updateExamStep = (newStep, catKey = null, activeExamId = null) => {
    const doUpdate = () => {
      setStep(newStep);
      setIsExpanded(false);
      if (isCourseQuiz || initialExam || onBackToLesson) {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        } catch (e) {}
        return;
      }
      try {
        const currentCat = catKey || selectedCategory || (selectedCategoryDetail?.key);
        const params = new URLSearchParams();
        if (currentCat && currentCat !== 'all') params.set('category', currentCat);
        if (newStep && newStep !== 'category_detail' && newStep !== 'category_cards') {
          params.set('step', newStep);
        }
        const examIdToSet = activeExamId || selectedExamMeta?.id || examData?.exam_id || examResult?.examId;
        if (examIdToSet && (newStep === 'exam_intro' || newStep === 'exam_live' || newStep === 'exam_result')) {
          params.set('exam', examIdToSet);
        }
        const qs = params.toString() ? `?${params.toString()}` : '';
        window.history.pushState(null, '', `/exams${qs}`);
      } catch (e) {}
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (e) {}
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      document.documentElement.classList.add('page-navigating');
      try {
        const transition = document.startViewTransition(() => {
          doUpdate();
        });
        transition.finished.finally(() => {
          document.documentElement.classList.remove('page-navigating');
        });
      } catch (e) {
        document.documentElement.classList.remove('page-navigating');
        doUpdate();
      }
    } else {
      doUpdate();
    }
  };

  // Handler to enter specific exam category from card
  const handleEnterCategory = (categoryKey) => {
    const cat = categoriesMetadata.find(c => c.key === categoryKey);
    if (cat) setSelectedCategoryDetail(cat);
    setSelectedCategory(categoryKey);
    setSelectedSubCat('all');
    updateExamStep('category_detail', categoryKey);
  };

  // Active Exam Selection states
  const [selectedExamMeta, setSelectedExamMeta] = useState(() => {
    if (initialExam) return initialExam;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlExamId = urlParams.get('exam');
      const saved = sessionStorage.getItem('eduhunters_active_exam_meta');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!urlExamId || parsed.id === urlExamId) {
          return parsed;
        }
      }
      if (urlExamId) {
        const found = INITIAL_SURE_SHOT.find(e => e.id === urlExamId);
        if (found) return found;
      }
    } catch (e) {}
    return INITIAL_SURE_SHOT[0];
  });
  const [examData, setExamData] = useState(() => {
    if (initialExam) {
      return {
        ...initialExam,
        exam_id: initialExam.id,
        questions: initialExam.questions || []
      };
    }
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlExamId = urlParams.get('exam');
      const saved = sessionStorage.getItem('eduhunters_active_exam_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!urlExamId || parsed.exam_id === urlExamId || parsed.id === urlExamId) {
          return parsed;
        }
      }
      // Check active exam result questions if examData not separately saved
      const savedResult = sessionStorage.getItem('eduhunters_active_exam_result') ||
                          (urlExamId ? localStorage.getItem(`eduhunters_result_${urlExamId}`) : null) ||
                          localStorage.getItem('eduhunters_latest_result');
      if (savedResult) {
        const parsed = JSON.parse(savedResult);
        if (parsed.questions && parsed.questions.length > 0) {
          return {
            exam_id: parsed.examId || urlExamId,
            id: parsed.examId || urlExamId,
            title: parsed.title,
            category: parsed.category,
            questions: parsed.questions,
            total_questions: parsed.totalQuestions,
            negative_mark: parsed.negPerWrong || 0.25
          };
        }
      }
    } catch (e) {}
    return null;
  });

  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [examMode, setExamMode] = useState('real'); // 'real' | 'practice'

  // Live Exam States
  const [userAnswers, setUserAnswers] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlExam = urlParams.get('exam');
      const saved = sessionStorage.getItem('eduhunters_active_user_answers');
      if (saved) return JSON.parse(saved);
      const savedResult = sessionStorage.getItem('eduhunters_active_exam_result') ||
                          (urlExam ? localStorage.getItem(`eduhunters_result_${urlExam}`) : null) ||
                          localStorage.getItem('eduhunters_latest_result');
      if (savedResult) {
        const parsed = JSON.parse(savedResult);
        if (parsed.userAnswers) return parsed.userAnswers;
      }
    } catch (e) {}
    return {};
  });
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [practiceRevealed, setPracticeRevealed] = useState({});
  const [timeLeft, setTimeLeft] = useState(40 * 60);
  const [showSeconds, setShowSeconds] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [examResult, setExamResult] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlExam = urlParams.get('exam');
      const saved = sessionStorage.getItem('eduhunters_active_exam_result');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!urlExam || parsed.examId === urlExam) return parsed;
      }
      if (urlExam) {
        const byId = localStorage.getItem(`eduhunters_result_${urlExam}`);
        if (byId) return JSON.parse(byId);
      }
      const latest = localStorage.getItem('eduhunters_latest_result');
      if (latest) {
        const parsed = JSON.parse(latest);
        if (!urlExam || parsed.examId === urlExam) return parsed;
      }
      const hist = localStorage.getItem('eduhunters_exam_history');
      if (hist) {
        const parsed = JSON.parse(hist);
        if (parsed.length > 0) {
          if (urlExam) {
            const found = parsed.find(item => item.examId === urlExam);
            if (found) return found;
          }
          return parsed[0];
        }
      }
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [submitWarningModal, setSubmitWarningModal] = useState(false);
  const [questionPaletteOpen, setQuestionPaletteOpen] = useState(false);

  // Result Review Filter state: 'all' | 'wrong' | 'correct' | 'skipped'
  const [solutionFilter, setSolutionFilter] = useState('all');

  // Exam History stored locally
  const [examHistory, setExamHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('eduhunters_exam_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const timerRef = useRef(null);
  const questionRefs = useRef({});
  const examStartTimeRef = useRef(null);
  const currentExamIdRef = useRef(initialExam?.id || null);

  // Keep state synchronized whenever initialExam is passed or changes
  useEffect(() => {
    if (initialExam) {
      const isDifferentExam = currentExamIdRef.current && currentExamIdRef.current !== initialExam.id;
      currentExamIdRef.current = initialExam.id;

      setSelectedExamMeta(initialExam);
      setExamData(prev => ({
        ...prev,
        ...initialExam,
        exam_id: initialExam.id,
        questions: (initialExam.questions && initialExam.questions.length > 0) ? initialExam.questions : (prev?.questions || [])
      }));

      // In course quiz mode, ensure step is in exam flow
      if (isDifferentExam || (step !== 'exam_live' && step !== 'exam_result')) {
        setStep(initialStep || 'exam_intro');
      }

      if (isDifferentExam) {
        setUserAnswers({});
        setIsSubmitted(false);
        setExamResult(null);
      }
    }
  }, [initialExam, initialStep]);

  // 1. Fetch Master Manifest on mount (with overrides)
  useEffect(() => {
    let isMounted = true;
    async function loadManifest() {
      try {
        setIsLoadingManifest(true);
        const data = await getMergedExamManifest();
        if (isMounted && data.exams && data.exams.length > 0) {
          const cleanedExams = data.exams.map(e => ({
            ...e,
            title: stripEmoji(e.title)
          }));
          const combinedExams = [
            ...INITIAL_SURE_SHOT,
            ...cleanedExams.filter(ce => !INITIAL_SURE_SHOT.some(ise => ise.id === ce.id))
          ];
          setManifestData({ ...data, exams: combinedExams });
          setAllExams(combinedExams);
          
          // Check if active exam is specified in URL or already selected
          const urlParams = new URLSearchParams(window.location.search);
          const urlExamId = urlParams.get('exam');
          const targetExamId = urlExamId || selectedExamMeta?.id;
          
          if (targetExamId) {
            const found = combinedExams.find(e => e.id === targetExamId);
            if (found) {
              setSelectedExamMeta(found);
              try {
                sessionStorage.setItem('eduhunters_active_exam_meta', JSON.stringify(found));
              } catch (e) {}
              // Preload question content if not yet loaded
              if (!examData || !examData.questions || examData.questions.length === 0) {
                loadExamQuestions(found).then(qData => {
                  if (isMounted && qData) {
                    setExamData(qData);
                    try {
                      sessionStorage.setItem('eduhunters_active_exam_data', JSON.stringify(qData));
                    } catch (e) {}
                  }
                }).catch(e => console.warn(e));
              }
            }
          } else if (!selectedExamMeta || selectedExamMeta.id === 'sureshot-1') {
            setSelectedExamMeta(combinedExams[0]);
          }
        }
      } catch (err) {
        console.warn("Using fallback exam list:", err);
      } finally {
        if (isMounted) setIsLoadingManifest(false);
      }
    }
    loadManifest();
    return () => { isMounted = false; };
  }, []);

  // 1b. Ensure URL and storage stay synchronized when in exam_result
  useEffect(() => {
    if (isCourseQuiz || initialExam) return;
    if (step === 'exam_result') {
      try {
        const cat = selectedCategory || selectedExamMeta?.category || 'sureshot';
        const examId = selectedExamMeta?.id || examResult?.examId || examData?.exam_id;
        const params = new URLSearchParams(window.location.search);
        params.set('step', 'exam_result');
        if (cat && cat !== 'all') params.set('category', cat);
        if (examId) params.set('exam', examId);
        const targetSearch = `?${params.toString()}`;
        if (window.location.search !== targetSearch) {
          window.history.replaceState(null, '', `/exams${targetSearch}`);
        }
      } catch (e) {}
    }
  }, [step, selectedCategory, selectedExamMeta, examResult, examData, isCourseQuiz, initialExam]);

  // Ensure 'All' filter is selected by default when entering exam result
  useEffect(() => {
    if (step === 'exam_result') {
      setSolutionFilter('all');
    }
  }, [step, examResult?.examId]);

  // 2. Countdown timer for Live Exam
  useEffect(() => {
    if (step === 'exam_live' && !isSubmitted && examMode === 'real') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            calculateAndFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, isSubmitted, examMode]);

  // Available Subcategories for currently selected Category
  const availableSubCategories = useMemo(() => {
    if (!manifestData || selectedCategory === 'all' || selectedCategory === 'history') return [];
    const cat = manifestData.categories?.find(c => c.key === selectedCategory);
    return cat?.subCategories || [];
  }, [manifestData, selectedCategory]);

  // Filtered Exam List
  const filteredExams = useMemo(() => {
    if (selectedCategory === 'history') return [];
    return allExams.filter(exam => {
      // Category filter
      if (selectedCategory !== 'all' && exam.category !== selectedCategory) {
        return false;
      }
      // Subject filter
      if (selectedSubject !== 'all' && exam.subject !== selectedSubject) {
        return false;
      }
      // SubCategory filter
      if (selectedSubCat !== 'all' && exam.subCategory !== selectedSubCat) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = exam.title?.toLowerCase().includes(q);
        const matchesSub = exam.subCategory?.toLowerCase().includes(q);
        const matchesSubject = exam.subject?.toLowerCase().includes(q);
        const matchesCat = exam.categoryName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSub && !matchesSubject && !matchesCat) {
          return false;
        }
      }
      return true;
    });
  }, [allExams, selectedCategory, selectedSubject, selectedSubCat, searchQuery]);

  // Load Exam JSON and smoothly navigate to next page immediately
  const handleSelectExam = (examMeta) => {
    const catKey = examMeta.category || selectedCategory;
    const catExams = allExams.filter(e => e.category === catKey);
    const catExamIndex = catExams.findIndex(e => e.id === examMeta.id);
    const isFreeExam = examMeta.isFree || examMeta.isTrial || catExamIndex === 0;
    if (!isCurrentCatEnrolled && !isFreeExam) {
      const targetCat = categoriesMetadata.find(c => c.key === catKey) || {
        key: catKey,
        title: CATEGORY_TABS.find(t => t.key === catKey)?.name || 'এক্সাম ব্যাচ',
        price: 399,
        originalPrice: 799
      };
      handleOpenCheckoutModal(targetCat);
      return;
    }

    setSelectedExamMeta(examMeta);
    if (catKey) setSelectedCategory(catKey);
    try {
      sessionStorage.setItem('eduhunters_active_exam_meta', JSON.stringify(examMeta));
    } catch (e) {}

    const totalQs = examMeta.totalQuestions || 50;
    const durationMins = examMeta.durationMinutes || Math.max(1, Math.round(totalQs * 0.6));

    const rawNegVal = examMeta.negativeMark !== undefined ? examMeta.negativeMark : 0.25;
    let parsedNeg = typeof rawNegVal === 'string' 
      ? parseFloat(rawNegVal.replace(/[০-৯]/g, d => ({ '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' })[d]))
      : Number(rawNegVal);
    if (isNaN(parsedNeg) || parsedNeg <= 0) parsedNeg = 0.25;
    if (parsedNeg >= 1) parsedNeg = parsedNeg / 100; // e.g. 25 becomes 0.25

    // Immediately prepare intro state so the transition happens with zero lag
    const initialExamData = {
      exam_id: examMeta.id,
      title: examMeta.title,
      category: examMeta.category,
      categoryName: examMeta.categoryName,
      subCategory: examMeta.subCategory,
      subject: examMeta.subject,
      duration_minutes: durationMins,
      total_questions: totalQs,
      negative_mark: parsedNeg,
      questions: []
    };
    setExamData(initialExamData);
    try {
      sessionStorage.setItem('eduhunters_active_exam_data', JSON.stringify(initialExamData));
    } catch (e) {}

    setTimeLeft(durationMins * 60);

    // Instantly & smoothly transition to the exam intro screen
    updateExamStep('exam_intro', catKey, examMeta.id);

    // Preload questions non-blockingly in the background
    setIsLoadingExam(true);
    loadExamQuestions(examMeta)
      .then(data => {
        const normalized = data?.questions || [];
        if (normalized.length > 0) {
          const rawDataNeg = data?.negative_mark !== undefined ? data.negative_mark : parsedNeg;
          let safeDataNeg = typeof rawDataNeg === 'string' 
            ? parseFloat(rawDataNeg.replace(/[০-৯]/g, d => ({ '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' })[d]))
            : Number(rawDataNeg);
          if (isNaN(safeDataNeg) || safeDataNeg < 0) safeDataNeg = 0;
          if (safeDataNeg >= 1) safeDataNeg = safeDataNeg / 100;

          const freshData = {
            ...initialExamData,
            ...data,
            title: data.title || examMeta.title,
            duration_minutes: data.duration_minutes || durationMins,
            total_questions: normalized.length,
            negative_mark: safeDataNeg,
            questions: normalized
          };
          setExamData(freshData);
          try {
            sessionStorage.setItem('eduhunters_active_exam_data', JSON.stringify(freshData));
          } catch (e) {}
        }
      })
      .catch(err => {
        console.warn("Background exam question fetch warning:", err);
      })
      .finally(() => {
        setIsLoadingExam(false);
      });
  };

  // Start Exam
  const handleStartExam = async (mode = 'real') => {
    let questions = examData?.questions || [];
    if (questions.length === 0 && selectedExamMeta?.questions && selectedExamMeta.questions.length > 0) {
      questions = selectedExamMeta.questions;
    }
    if (questions.length === 0 && selectedExamMeta) {
      setIsLoadingExam(true);
      try {
        const data = await loadExamQuestions(selectedExamMeta);
        questions = data?.questions || [];
        if (questions.length > 0) {
          const freshData = { ...examData, ...data, questions };
          setExamData(freshData);
          try {
            sessionStorage.setItem('eduhunters_active_exam_data', JSON.stringify(freshData));
          } catch (e) {}
        }
      } catch (err) {
        console.error("Emergency question reload failed:", err);
      } finally {
        setIsLoadingExam(false);
      }
    }

    if (questions.length === 0) {
      alert("দুঃখিত, এই পরীক্ষার প্রশ্নপত্র লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
      return;
    }

    setExamMode(mode);
    setUserAnswers({});
    try {
      sessionStorage.removeItem('eduhunters_active_user_answers');
      sessionStorage.removeItem('eduhunters_active_exam_result');
    } catch (e) {}
    setFlaggedQuestions({});
    setPracticeRevealed({});
    setIsSubmitted(false);
    setExamResult(null);
    const activeDur = examData?.duration_minutes || selectedExamMeta?.durationMinutes || 40;
    setTimeLeft(activeDur * 60);
    examStartTimeRef.current = Date.now();
    updateExamStep('exam_live', selectedCategory, selectedExamMeta?.id);
  };

  // Select Option during Exam
  const handleSelectOption = (questionId, optionIdx) => {
    if (isSubmitted) return;

    const examIdKey = selectedExamMeta?.id || examData?.exam_id;

    if (examMode === 'practice') {
      // In practice mode, lock in answer and reveal explanation
      setUserAnswers(prev => {
        const next = {
          ...prev,
          [questionId]: optionIdx
        };
        try {
          sessionStorage.setItem('eduhunters_active_user_answers', JSON.stringify(next));
          if (examIdKey) {
            sessionStorage.setItem(`eduhunters_answers_${examIdKey}`, JSON.stringify(next));
            localStorage.setItem(`eduhunters_answers_${examIdKey}`, JSON.stringify(next));
          }
        } catch (e) {}
        return next;
      });
      setPracticeRevealed(prev => ({
        ...prev,
        [questionId]: true
      }));
      return;
    }

    // In real exam mode: allow toggling or changing
    setUserAnswers(prev => {
      let next;
      if (prev[questionId] === optionIdx) {
        next = { ...prev };
        delete next[questionId];
      } else {
        next = {
          ...prev,
          [questionId]: optionIdx
        };
      }
      try {
        sessionStorage.setItem('eduhunters_active_user_answers', JSON.stringify(next));
        if (examIdKey) {
          sessionStorage.setItem(`eduhunters_answers_${examIdKey}`, JSON.stringify(next));
          localStorage.setItem(`eduhunters_answers_${examIdKey}`, JSON.stringify(next));
        }
      } catch (e) {}
      return next;
    });
  };

  // Toggle Flag question
  const handleToggleFlag = (questionId) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Jump to Question
  const scrollToQuestion = (idx) => {
    const el = questionRefs.current[idx];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setQuestionPaletteOpen(false);
    }
  };

  // Calculate Score and Finish
  const calculateAndFinishExam = () => {
    if (!examData || isSubmitted) return;
    setIsSubmitted(true);

    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    examData.questions.forEach((q, idx) => {
      const selected = getUserAnswer(userAnswers, q, idx);
      const isAns = selected !== undefined && selected !== null && selected !== '' && !isNaN(Number(selected));
      const targetCorrect = getQuestionCorrectIndex(q);
      if (!isAns) {
        skipped++;
      } else if (Number(selected) === Number(targetCorrect)) {
        correct++;
      } else {
        wrong++;
      }
    });

    const rawNegVal = examData.negative_mark !== undefined ? examData.negative_mark : 0.25;
    let parsedNeg = typeof rawNegVal === 'string' 
      ? parseFloat(rawNegVal.replace(/[০-৯]/g, d => ({ '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' })[d]))
      : Number(rawNegVal);
    if (isNaN(parsedNeg) || parsedNeg < 0) parsedNeg = 0;
    if (parsedNeg >= 1) parsedNeg = parsedNeg / 100; // e.g. 25 becomes 0.25

    const negPerWrong = parsedNeg;
    const wrongPenalty = +(wrong * negPerWrong).toFixed(2);
    const totalPenalty = +wrongPenalty.toFixed(2);
    const score = +(correct - totalPenalty).toFixed(2);
    const passMarks = Math.round(examData.questions.length * 0.4);
    const percentage = Math.max(0, Math.round((Math.max(0, score) / examData.questions.length) * 100));
    const isPassed = score >= passMarks;

    const activeDur = examData?.duration_minutes || selectedExamMeta?.durationMinutes || 40;
    const totalDurationSecs = activeDur * 60;
    const elapsedSecs = examStartTimeRef.current
      ? Math.min(totalDurationSecs, Math.max(1, Math.round((Date.now() - examStartTimeRef.current) / 1000)))
      : Math.max(1, totalDurationSecs - (timeLeft || 0));

    const resultObj = {
      examId: selectedExamMeta?.id || examData?.exam_id || Date.now().toString(),
      title: examData.title,
      category: examData.category || selectedCategory,
      categoryName: examData.categoryName,
      subject: examData.subject,
      date: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      totalQuestions: examData.questions.length,
      totalPossible: examData.total_marks || examData.questions.length,
      correct,
      wrong,
      skipped,
      negPerWrong,
      wrongPenalty,
      totalPenalty,
      finalScore: score,
      score: score,
      timeTakenSeconds: elapsedSecs,
      percentage,
      isPassed,
      userAnswers: { ...userAnswers },
      questions: examData.questions
    };

    setExamResult(resultObj);
    if (onExamComplete) {
      try {
        onExamComplete(resultObj);
      } catch (err) {
        console.error("onExamComplete callback error:", err);
      }
    }
    try {
      sessionStorage.setItem('eduhunters_active_exam_result', JSON.stringify(resultObj));
      sessionStorage.setItem('eduhunters_active_user_answers', JSON.stringify(userAnswers));
      sessionStorage.setItem('eduhunters_active_exam_data', JSON.stringify(examData));
      if (selectedExamMeta) {
        sessionStorage.setItem('eduhunters_active_exam_meta', JSON.stringify(selectedExamMeta));
      }
      localStorage.setItem(`eduhunters_result_${resultObj.examId}`, JSON.stringify(resultObj));
      localStorage.setItem('eduhunters_latest_result', JSON.stringify(resultObj));
    } catch (e) {}

    // Save to Exam History in localStorage
    try {
      const updatedHistory = [resultObj, ...examHistory.slice(0, 49)];
      setExamHistory(updatedHistory);
      localStorage.setItem('eduhunters_exam_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn("Failed to save history:", e);
    }

    // Save to Global Live Leaderboard with 100% Accurate Student Identity
    const catToUse = selectedCategory || examData?.category || 'sureshot';
    const examIdToUse = selectedExamMeta?.id || resultObj.examId;
    try {
      let directWriteInName = (guestStudentName || '').trim();
      if (!directWriteInName) {
        try {
          const domInput = document.querySelector('input[placeholder*="আপনার পূর্ণ নাম"], input[placeholder*="Guest"], input[data-examinee-name="true"]');
          if (domInput && domInput.value) directWriteInName = domInput.value.trim();
        } catch (e) {}
      }
      if (!directWriteInName) {
        try {
          directWriteInName = (localStorage.getItem('eh_guest_student_name') || '').trim();
        } catch (e) {}
      }
      const resolvedStudent = getResolvedStudent(currentUser, directWriteInName);
      recordQuizSubmission({
        student: resolvedStudent,
        course: { 
          id: catToUse, 
          title: examData?.categoryName || selectedCategory || 'Exam Batch' 
        },
        lesson: { 
          id: resultObj.examId, 
          title: resultObj.title || 'Exam' 
        },
        quiz: examData,
        result: resultObj,
        timeTakenSeconds: elapsedSecs
      }).then((sub) => {
        if (sub) {
          setExamResult(prev => prev ? ({
            ...prev,
            isOfficialRanked: sub.isOfficialRanked,
            isFirstAttempt: sub.is_first_attempt,
            attemptNumber: sub.attempt_number
          }) : prev);
        }
        loadLiveExamLeaderboard(catToUse, examIdToUse);
      }).catch(e => console.warn("[SureShot] Leaderboard async load note:", e));
    } catch (e) {
      console.warn("[SureShot] Leaderboard submission notice:", e);
    }

    setSolutionFilter('all');
    updateExamStep('exam_result', catToUse, examIdToUse);
    if (!isCourseQuiz) {
      try {
        window.history.replaceState(null, '', `/exams?category=${catToUse}&step=exam_result&exam=${examIdToUse}`);
      } catch (e) {}
    }

    if (isPassed) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  const loadLiveExamLeaderboard = useCallback(async (courseId, examId) => {
    const cId = courseId || selectedCategory || examData?.category || 'sureshot';
    const eId = examId || selectedExamMeta?.id || examResult?.examId;
    if (!eId) return;
    setIsLoadingExamLeaderboard(true);
    try {
      const board = await fetchLessonLeaderboard(cId, eId);
      setLiveExamLeaderboard(board || []);
    } catch (err) {
      console.warn("Failed to load live exam leaderboard:", err);
    } finally {
      setIsLoadingExamLeaderboard(false);
    }
  }, [selectedCategory, examData?.category, selectedExamMeta?.id, examResult?.examId]);

  useEffect(() => {
    if (step === 'exam_result') {
      const cat = selectedCategory || examData?.category || 'sureshot';
      const eId = selectedExamMeta?.id || examResult?.examId;
      loadLiveExamLeaderboard(cat, eId);
    }
  }, [step, selectedCategory, examData?.category, selectedExamMeta?.id, examResult?.examId, loadLiveExamLeaderboard]);

  const formatTimerDisplay = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (showSeconds) {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')} মিনিট`;
  };

  const answeredCount = Object.keys(userAnswers).length;

  // Global Checkout Modal Markup for Exam Batches
  const checkoutModalMarkup = checkoutCategory ? (
    <CheckoutModal 
      course={{
        id: checkoutCategory.id || checkoutCategory.key,
        slug: checkoutCategory.slug || checkoutCategory.key,
        key: checkoutCategory.key,
        title: checkoutCategory.title || 'এক্সাম ব্যাচ এনরোলমেন্ট',
        price: parseInt(String(checkoutCategory.price || '399').replace(/[^0-9]/g, '')) || 399,
        salePrice: parseInt(String(checkoutCategory.price || '399').replace(/[^0-9]/g, '')) || 399,
        originalPrice: parseInt(String(checkoutCategory.originalPrice || '799').replace(/[^0-9]/g, '')) || 799,
        image: checkoutCategory.image || '/sureshot_banner.jpg',
        isExamBatch: true
      }}
      onClose={() => setCheckoutCategory(null)}
      onSuccess={(orderInfo) => {
        setCheckoutCategory(null);
      }}
      siteSettings={siteSettings}
    />
  ) : null;


  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // VIEW 0: 10MS-STYLE DEDICATED CATEGORY DETAIL PAGE
  // -------------------------------------------------------------
  if (step === 'category_detail') {
    if (isCourseQuiz || initialExam) {
      setStep('exam_intro');
      return null;
    }
    const detailToUse = selectedCategoryDetail || 
      categoriesMetadata.find(c => c.key === selectedCategory) || 
      categoriesMetadata[0];

    if (detailToUse && !isCategoryActive(detailToUse)) {
      return (
        <div className={`min-h-screen py-16 px-4 text-center ${isDark ? 'text-white' : 'text-slate-800'}`}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-2">এই এক্সাম ব্যাচটি বর্তমানে নিষ্ক্রিয়</h2>
          <p className="text-sm text-gray-400 mb-6">এডমিন কর্তৃক এই এক্সাম ব্যাচটি সাময়িকভাবে বন্ধ রাখা হয়েছে।</p>
          <button
            onClick={() => updateExamStep('category_cards')}
            className="px-6 py-2.5 rounded-full bg-[#dc2626] text-white text-sm font-bold shadow-md hover:bg-red-700 transition-colors border-none cursor-pointer"
          >
            ← এক্সাম তালিকায় ফিরে যান
          </button>
        </div>
      );
    }

    const isEnrolled = isBatchEnrolled(detailToUse?.key);
    const categoryExams = allExams.filter(c => c.category === detailToUse?.key);
    let examsForDetail = categoryExams.length > 0 
      ? categoryExams 
      : (detailToUse?.key === 'sureshot' ? INITIAL_SURE_SHOT : []);

    if (detailToUse?.key === 'sureshot') {
      const preferred = [
        "GK - Subject Final",
        "Mega exam - Sure Shot",
        "Chemistry 2nd Paper - Sure shot",
        "Chemistry 1st paper - Sure shot",
        "Zoology - Other writers",
        "Sure shot - Botany extra writer",
        "English subject Final - Sure Shot",
        "English grammar",
        "English Vocabulary",
        "Chemistry 1st part - Sure Shot"
      ];
      examsForDetail = [...examsForDetail].sort((a, b) => {
        const idxA = preferred.indexOf(a.title);
        const idxB = preferred.indexOf(b.title);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }

    return (
      <>
        <ExamDetailPage 
          category={detailToUse}
          exams={examsForDetail}
          isFromBundle={isFromBundle}
          onBack={() => {
            if (isFromBundle && onBackToBundle) {
              onBackToBundle();
            } else {
              updateExamStep('category_cards');
            }
          }}
          onStartExamCategory={(categoryKey) => {
            setSelectedCategory(categoryKey);
            setSelectedSubCat('all');
            updateExamStep('exam_list', categoryKey);
          }}
          onPreviewExams={(categoryKey) => {
            setSelectedCategory(categoryKey);
            setSelectedSubCat('all');
            updateExamStep('exam_list', categoryKey);
          }}
          onOpenEnrollModal={(cat) => {
            handleOpenCheckoutModal(cat || detailToUse);
          }}
          onSelectExam={(exam) => {
            setSelectedCategory(detailToUse.key);
            handleSelectExam(exam);
          }}
          isEnrolled={isEnrolled}
        />
        {checkoutModalMarkup}
      </>
    );
  }

  // -------------------------------------------------------------
  // VIEW 1: CATEGORY CARDS VIEW (Exact Match to User Reference Mockup)
  // -------------------------------------------------------------
  if (step === 'category_cards' || step === 'course_card') {
    if (isCourseQuiz || initialExam) {
      setStep('exam_intro');
      return null;
    }
    const filteredCategories = categoriesMetadata.filter(c => isCategoryActive(c));

    return (
      <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300 ${
        isDark ? 'bg-transparent text-white' : 'bg-[#f8f9fa] text-[#111827]'
      }`}>
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Centered Header Section */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${
              isDark ? 'text-white' : 'text-[#111827]'
            }`}>
              আমাদের চলমান এক্সামসমূহ
            </h1>
          </div>

          {/* Cards Grid: 3 Column Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
              <div 
                key={cat.key}
                onClick={() => {
                  setSelectedCategoryDetail(cat);
                  updateExamStep('category_detail', cat.key);
                }}
                className={`group rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
                  isDark 
                    ? 'bg-[#140306] border-[#e11438]/20 hover:border-[#e11438]/45 shadow-[0_12px_35px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_40px_rgba(225,20,56,0.12)]' 
                    : 'bg-white border-gray-200 hover:border-red-300'
                }`}
              >
                <div>
                  {/* Card Banner Image with Angled Ribbon */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
                    <img 
                      src={cat.image} 
                      alt={cat.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/sureshot_banner.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                    {/* Angled Ribbon on Top-Left */}
                    {cat.ribbonText && (
                      <div className={`absolute -left-9 top-4 -rotate-45 text-[10px] font-black tracking-wider py-0.5 px-9 uppercase shadow-md ${
                        isDark 
                          ? 'bg-black/80 text-white/95 border-y border-white/20 backdrop-blur-sm' 
                          : 'bg-[#dc2626] text-white shadow-lg'
                      }`}>
                        {cat.ribbonText}
                      </div>
                    )}
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 space-y-2.5">
                    {/* Bold Bengali Title */}
                    <h2 className={`text-base sm:text-lg font-bold leading-snug line-clamp-2 min-h-[48px] transition-colors ${
                      isDark 
                        ? 'text-white group-hover:text-gray-200' 
                        : 'text-[#111827] group-hover:text-[#dc2626]'
                    }`}>
                      {cat.title}
                    </h2>

                    {/* Enrolled Students Count & MCQ Count */}
                    <div className="flex items-center gap-2 pt-0.5 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <User size={15} className="shrink-0 text-gray-500 dark:text-gray-400" />
                        <span className="truncate">
                          {cat.enrolledCount 
                            ? (cat.enrolledCount.includes('জন') ? cat.enrolledCount : `${cat.enrolledCount.replace('+', '').trim()} জন`)
                            : '৩,৪৫০ জন'}
                        </span>
                      </div>

                      <span className="text-gray-300 dark:text-gray-600 font-normal">·</span>

                      <span className="truncate">
                        {cat.questionCount ? (cat.questionCount.includes('MCQ') ? cat.questionCount : `${cat.questionCount.replace(' প্রশ্ন', '')} MCQ`) : '১,৭০০+ MCQ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Pricing on Left + Details Link on Right */}
                <div className="p-5 pt-0">
                  <div className={`flex items-end justify-between gap-2 pt-3 border-t ${
                    isDark ? 'border-white/[0.08]' : 'border-gray-100'
                  }`}>
                    {/* Left: Pricing or Enrolled Status */}
                    {isBatchEnrolled(cat.key) ? (
                      <div className="inline-flex items-center py-1">
                        <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wide text-white shadow-xs transition-all select-none ${
                          isDark 
                            ? 'bg-[#e11438] shadow-[0_2px_10px_rgba(225,20,56,0.35)]' 
                            : 'bg-[#6f0113] shadow-[0_2px_8px_rgba(111,1,19,0.25)]'
                        }`}>
                          Enrolled
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                          কোর্সের মূল্য
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-[#dc2626]'}`}>
                            ৳ {cat.price || '৩৯৯'}
                          </span>
                          {cat.originalPrice && (
                            <span className="text-xs sm:text-sm text-gray-400 line-through font-medium">
                              ৳{cat.originalPrice || '৭৯৯'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Right: Details Link */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategoryDetail(cat);
                        updateExamStep('category_detail', cat.key);
                      }}
                      className={`text-sm font-bold flex items-center gap-1 ${
                        isDark ? 'text-white hover:text-gray-300' : 'text-[#dc2626] hover:text-[#b91c1c]'
                      } bg-transparent border-none cursor-pointer py-1 px-1 transition-colors shrink-0 mb-0.5 group`}
                    >
                      <span>বিস্তারিত</span>
                      <ChevronRight size={18} strokeWidth={2.8} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <span className="text-3xl">📝</span>
              </div>
              <p className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                বর্তমানে কোনো সক্রিয় এক্সাম ব্যাচ নেই
              </p>
              <p className="text-xs text-gray-400 mt-1">
                শীঘ্রই নতুন আকর্ষণীয় এক্সাম ব্যাচ উন্মুক্ত করা হবে।
              </p>
            </div>
          )}
          </div>
        </div>

        {/* Category Details Modal */}
        <CategoryDetailModal 
          isOpen={!!selectedCategoryModal}
          category={selectedCategoryModal}
          onClose={() => setSelectedCategoryModal(null)}
          onStartCategory={handleEnterCategory}
        />

        {checkoutModalMarkup}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: STREAMLINED BATCH EXAM LIST (Exact Match to User Reference Mockup)
  // -------------------------------------------------------------
  if (step === 'exam_list') {
    if (isCourseQuiz || initialExam) {
      setStep('exam_intro');
      return null;
    }
    const currentCategoryDetail = selectedCategoryDetail || 
      categoriesMetadata.find(c => c.key === selectedCategory) || 
      categoriesMetadata[0];

    const currentCategoryKey = currentCategoryDetail?.key || 'sureshot';
    const isCurrentCatEnrolled = isBatchEnrolled(currentCategoryKey);

    // Filter exams belonging to this category
    let categoryExams = allExams.filter(e => e.category === currentCategoryKey);
    if (categoryExams.length === 0 && currentCategoryKey === 'sureshot') {
      categoryExams = INITIAL_SURE_SHOT;
    }

    // For Sure Shot Carnival, arrange the order to match the user's reference mockup exactly
    if (currentCategoryKey === 'sureshot') {
      const preferred = [
        "GK - Subject Final",
        "Mega exam - Sure Shot",
        "Chemistry 2nd Paper - Sure shot",
        "Chemistry 1st paper - Sure shot",
        "Zoology - Other writers",
        "Sure shot - Botany extra writer",
        "English subject Final - Sure Shot",
        "English grammar",
        "English Vocabulary",
        "Chemistry 1st part - Sure Shot"
      ];
      categoryExams = [...categoryExams].sort((a, b) => {
        const idxA = preferred.indexOf(a.title);
        const idxB = preferred.indexOf(b.title);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }

    // Extract available groups/subjects
    const availableGroups = Array.from(new Set(categoryExams.map(e => e.subject).filter(Boolean)));
    const subjectsWithCounts = (() => {
      const counts = {};
      categoryExams.forEach(e => {
        if (e.subject) counts[e.subject] = (counts[e.subject] || 0) + 1;
      });
      return Object.entries(counts).map(([name, count]) => ({ name, count }));
    })();

    const isMasterEnglish = selectedCategory === 'english_master';

    // Autocomplete topic and exam suggestions for English in exam_list
    const englishSuggestions = (() => {
      if (!isMasterEnglish || !searchQuery.trim()) {
        return { topics: [], exams: [] };
      }
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/[\s,]+/).filter(Boolean);
      const rangeMatch = q.match(/(\d+)\s*[-–—]\s*(\d+)/);
      const qRange = rangeMatch ? [parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10)] : null;
      const singleNumMatch = !qRange ? q.match(/\b\d+\b/) : null;
      const singleNum = singleNumMatch ? parseInt(singleNumMatch[0], 10) : null;

      // Group unique topics with count
      const topicMap = new Map();
      categoryExams.forEach(e => {
        const topic = (e.title || '').split('(')[0].trim();
        if (!topicMap.has(topic)) {
          topicMap.set(topic, { topic, count: 0 });
        }
        topicMap.get(topic).count++;
      });

      // Score topics
      const scoredTopics = [];
      topicMap.forEach((data, topic) => {
        const tLower = topic.toLowerCase();
        const tWords = tLower.split(/[\s,]+/).filter(Boolean);
        let score = 0;

        if (tLower === q) score += 100;
        else if (tLower.startsWith(q)) score += 80;
        else if (tWords.some(w => w.startsWith(q))) score += 60;
        else if (tokens.every(tok => tWords.some(w => w.startsWith(tok) || w.includes(tok)))) score += 40;
        else if (tLower.includes(q)) score += 20;

        if (score > 0) {
          scoredTopics.push({ topic, count: data.count, score });
        }
      });
      scoredTopics.sort((a, b) => b.score - a.score || b.count - a.count || a.topic.localeCompare(b.topic));

      // Score individual exams
      const scoredExams = [];
      categoryExams.forEach(e => {
        const title = e.title || '';
        const titleLower = title.toLowerCase();
        const rMatch = titleLower.match(/(\d+)\s*[-–—]\s*(\d+)/);
        const rStart = rMatch ? parseInt(rMatch[1], 10) : null;
        const rEnd = rMatch ? parseInt(rMatch[2], 10) : null;
        const titleWords = titleLower.replace(/[().,:-]/g, ' ').split(/\s+/).filter(Boolean);

        let examScore = 0;
        if (titleLower.includes(q)) examScore += 40;

        if (qRange && rStart !== null && rEnd !== null) {
          if (qRange[0] === rStart && qRange[1] === rEnd) examScore += 90;
          else if (qRange[0] >= rStart && qRange[1] <= rEnd) examScore += 70;
        } else if (singleNum !== null && rStart !== null && rEnd !== null) {
          if (singleNum >= rStart && singleNum <= rEnd) examScore += 65;
        }

        const matchesAllTokens = tokens.every(tok => {
          const num = parseInt(tok, 10);
          if (!isNaN(num) && rStart !== null && rEnd !== null) {
            if (num >= rStart && num <= rEnd) return true;
          }
          return titleWords.some(w => w.startsWith(tok) || w.includes(tok));
        });

        if (matchesAllTokens) examScore += 30;

        if (examScore > 0) {
          scoredExams.push({ exam: e, score: examScore });
        }
      });
      scoredExams.sort((a, b) => b.score - a.score);

      return {
        topics: scoredTopics.slice(0, 5),
        exams: scoredExams.slice(0, 4).map(s => s.exam)
      };
    })();

    // Apply smart search filter for English, or subject filter for other categories
    let filteredList = categoryExams;
    if (isMasterEnglish && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/[\s,]+/).filter(Boolean);
      const rangeMatch = q.match(/(\d+)\s*[-–—]\s*(\d+)/);
      const qRange = rangeMatch ? [parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10)] : null;
      const singleNumMatch = !qRange ? q.match(/\b\d+\b/) : null;
      const singleNum = singleNumMatch ? parseInt(singleNumMatch[0], 10) : null;

      const scored = [];
      categoryExams.forEach(exam => {
        const titleLower = (exam.title || '').toLowerCase();
        const rMatch = titleLower.match(/(\d+)\s*[-–—]\s*(\d+)/);
        const rStart = rMatch ? parseInt(rMatch[1], 10) : null;
        const rEnd = rMatch ? parseInt(rMatch[2], 10) : null;
        const titleWords = titleLower.replace(/[().,:-]/g, ' ').split(/\s+/).filter(Boolean);

        const matchesAll = tokens.every(tok => {
          const tRangeMatch = tok.match(/(\d+)\s*[-–—]\s*(\d+)/);
          if (tRangeMatch && rStart !== null && rEnd !== null) {
            const s = parseInt(tRangeMatch[1], 10);
            const end = parseInt(tRangeMatch[2], 10);
            return (s === rStart && end === rEnd) || (s >= rStart && end <= rEnd) || (s <= rEnd && end >= rStart);
          }
          const num = parseInt(tok, 10);
          if (!isNaN(num) && rStart !== null && rEnd !== null) {
            if (num >= rStart && num <= rEnd) return true;
          }
          return titleWords.some(tWord => tWord.startsWith(tok) || tWord.includes(tok)) || titleLower.includes(tok);
        });

        if (matchesAll) {
          let score = 0;
          if (titleLower.startsWith(q)) score += 100;
          if (titleLower.includes(q)) score += 70;
          if (qRange && rStart === qRange[0] && rEnd === qRange[1]) score += 50;
          if (singleNum && rStart !== null && rEnd !== null && singleNum >= rStart && singleNum <= rEnd) score += 30;
          scored.push({ exam, score });
        }
      });
      scored.sort((a, b) => b.score - a.score);
      filteredList = scored.map(s => s.exam);
    } else if (selectedSubject !== 'all') {
      filteredList = categoryExams.filter(e => e.subject === selectedSubject);
    }

    // Show 5 items by default as requested by user
    const initialExams = filteredList.slice(0, 5);
    const extraExams = filteredList.slice(5);
    const hasMore = filteredList.length > 5;

    const itemCountLabel = (() => {
      const count = filteredList.length;
      if (currentCategoryDetail?.type === 'lecture' || currentCategoryDetail?.isLecture) {
        return `${count} ${count === 1 ? 'Lecture' : 'Lectures'}`;
      }
      if (currentCategoryDetail?.type === 'video' || currentCategoryDetail?.isVideo) {
        return `${count} ${count === 1 ? 'Video' : 'Videos'}`;
      }
      return `${count} ${count === 1 ? 'Exam' : 'Exams'}`;
    })();

    return (
      <div className={`min-h-screen py-6 sm:py-10 px-4 sm:px-6 font-sans transition-colors duration-300 ${
        isDark ? 'bg-transparent text-white' : 'bg-[#f4f5f8] text-[#111827]'
      }`}>
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Top Breadcrumb Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => updateExamStep('category_cards')}
              className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer bg-transparent border-none p-0 ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-[#dc2626]'
              }`}
            >
              <span>← সব এক্সাম ব্যাচে ফিরে যান</span>
            </button>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                isDark ? 'bg-white/[0.04] border-white/10 text-gray-300' : 'bg-white border-gray-200 text-gray-700'
              }`}>
                {currentCategoryDetail?.title?.split('|')[0]?.trim() || 'Sure Shot Carnival'}
              </span>
              {isCurrentCatEnrolled && (
                <span className={`inline-flex items-center text-[11px] font-bold px-3 py-0.5 rounded-full text-white shadow-xs select-none ${
                  isDark
                    ? 'bg-[#e11438] shadow-[0_2px_8px_rgba(225,20,56,0.3)]'
                    : 'bg-[#6f0113] shadow-[0_2px_6px_rgba(111,1,19,0.2)]'
                }`}>
                  Enrolled
                </span>
              )}
            </div>
          </div>

          {/* RTDS / GK Course Hierarchy View */}
          {(selectedCategory === 'rtds' || selectedCategory === 'gk_course') ? (
            <RtdsCurriculumView
              exams={filteredList}
              onSelectExam={handleSelectExam}
              isEnrolled={isCurrentCatEnrolled}
              onOpenEnrollModal={() => handleOpenCheckoutModal(currentCategoryDetail)}
              category={currentCategoryDetail}
            />
          ) : selectedCategory === 'english_master' ? (
            <MasterEnglishCurriculumView
              exams={categoryExams}
              onSelectExam={handleSelectExam}
              isEnrolled={isCurrentCatEnrolled}
              onOpenEnrollModal={() => handleOpenCheckoutModal(currentCategoryDetail)}
              category={currentCategoryDetail}
            />
          ) : (
            <>
              {/* Filter / Search Bar: Replace dropdown with Smart Search Bar for Master English */}
              {isMasterEnglish ? (
                <div className="relative w-full max-w-lg z-30" ref={englishSearchRef}>
                  <div className="relative">
                    <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                      searchQuery ? 'text-red-500' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSearchQuery(val);
                        setIsEnglishSuggestOpen(val.trim().length > 0);
                        setIsExpanded(false);
                      }}
                      onFocus={() => {
                        if (searchQuery.trim().length > 0) {
                          setIsEnglishSuggestOpen(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape' || e.key === 'Enter') {
                          setIsEnglishSuggestOpen(false);
                        }
                      }}
                      placeholder="Search exam (e.g. Adjective, 1-40)..."
                      autoComplete="off"
                      spellCheck="false"
                      className={`w-full pl-11 pr-20 py-3 rounded-2xl text-xs sm:text-sm font-semibold border transition-all outline-none shadow-xs ${
                        isDark
                          ? 'bg-[#121724] border-[#222b3d] text-white placeholder-gray-500 focus:border-red-500/80 focus:bg-[#151c2e]'
                          : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white'
                      }`}
                    />
                    
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setIsEnglishSuggestOpen(false);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer bg-transparent border-none rounded-full"
                          title="ক্লিয়ার করুন"
                        >
                          <X size={15} />
                        </button>
                      )}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {filteredList.length}
                      </span>
                    </div>
                  </div>

                  {/* Auto-suggest dropdown when typing */}
                  {isEnglishSuggestOpen && (englishSuggestions.topics.length > 0 || englishSuggestions.exams.length > 0) && (
                    <div className={`absolute top-full left-0 mt-2 w-full rounded-2xl border shadow-xl p-2 z-40 backdrop-blur-xl animate-fadeIn ${
                      isDark
                        ? 'bg-[#0f1420]/95 border-[#222b3d] text-white shadow-black/60'
                        : 'bg-white/95 border-gray-200 text-gray-800 shadow-gray-200/80'
                    }`}>
                      {/* Topic Suggestions Section */}
                      {englishSuggestions.topics.length > 0 && (
                        <div className="mb-2">
                          <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                            <span>সাজেস্টেড টপিকসমূহ</span>
                            <span className="text-[9px] opacity-70">টপিক সিলেক্ট করুন</span>
                          </div>
                          <div className="flex flex-col gap-1 mt-1">
                            {englishSuggestions.topics.map((item, sIdx) => (
                              <button
                                key={`topic-${sIdx}`}
                                type="button"
                                onClick={() => {
                                  setSearchQuery(item.topic);
                                  setIsEnglishSuggestOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-none text-left ${
                                  isDark ? 'hover:bg-white/[0.08] text-gray-200' : 'hover:bg-red-50/60 hover:text-red-600 text-gray-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <BookOpen size={13} className="text-red-500 shrink-0 opacity-80" />
                                  <span className="truncate">{item.topic}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                  isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {item.count}টি এক্সাম
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Exam / Question Range Suggestions Section */}
                      {englishSuggestions.exams.length > 0 && (
                        <div>
                          {englishSuggestions.topics.length > 0 && (
                            <div className="my-1 border-t border-gray-100 dark:border-white/[0.06]" />
                          )}
                          <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                            <span>ম্যাচিং এক্সাম / প্রশ্ন সেট</span>
                            <span className="text-[9px] opacity-70">সরাসরি দেখুন</span>
                          </div>
                          <div className="flex flex-col gap-1 mt-1">
                            {englishSuggestions.exams.map((exam, eIdx) => (
                              <button
                                key={`exam-sug-${exam.id || eIdx}`}
                                type="button"
                                onClick={() => {
                                  setSearchQuery(exam.title);
                                  setIsEnglishSuggestOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer border-none text-left ${
                                  isDark ? 'hover:bg-white/[0.08] text-gray-200' : 'hover:bg-gray-100 text-gray-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText size={13} className="text-gray-400 shrink-0" />
                                  <span className="truncate">{stripEmoji(exam.title)}</span>
                                </div>
                                <ChevronRight size={13} className="text-gray-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : availableGroups.length > 0 && (
                <div className="relative inline-block z-30" ref={subjectDropdownRef}>
                  <button
                    type="button"

                onClick={() => setIsSubjectDropdownOpen(prev => !prev)}
                className={`inline-flex items-center justify-between gap-3.5 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99] min-w-[210px] sm:min-w-[230px] ${
                  isDark
                    ? 'bg-[#121724] hover:bg-[#181f30] border-[#222b3d] hover:border-red-500/50 text-white'
                    : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-red-300 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <SlidersHorizontal size={14} className="text-[#dc2626] shrink-0" />
                  <span className="truncate">
                    {selectedSubject === 'all' ? 'সকল বিষয় (All Subjects)' : selectedSubject}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {filteredList.length}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-300 text-gray-400 ${
                      isSubjectDropdownOpen ? 'rotate-180 text-red-500' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Dropdown Options Popup */}
              {isSubjectDropdownOpen && (
                <div className={`absolute top-full left-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl border shadow-xl p-1.5 z-40 backdrop-blur-xl animate-fadeIn scrollbar-thin ${
                  isDark
                    ? 'bg-[#0f1420]/95 border-[#222b3d] text-white shadow-black/60'
                    : 'bg-white/95 border-gray-200 text-gray-800 shadow-gray-200/80'
                }`}>
                  {/* All Subjects Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubject('all');
                      setIsExpanded(false);
                      setIsSubjectDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-none text-left ${
                      selectedSubject === 'all'
                        ? 'bg-[#dc2626] text-white'
                        : (isDark ? 'hover:bg-white/[0.06] text-gray-200' : 'hover:bg-gray-100 text-gray-800')
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {selectedSubject === 'all' && <Check size={14} className="shrink-0" />}
                      <span>সকল বিষয় (All Subjects)</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      selectedSubject === 'all' ? 'bg-white/20 text-white' : (isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-600')
                    }`}>
                      {categoryExams.length}
                    </span>
                  </button>

                  <div className="my-1 border-t border-gray-100 dark:border-white/[0.06]" />

                  {/* Individual Subjects */}
                  {subjectsWithCounts.map(({ name, count }) => {
                    const isSelected = selectedSubject === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setSelectedSubject(name);
                          setIsExpanded(false);
                          setIsSubjectDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-none text-left ${
                          isSelected
                            ? 'bg-[#dc2626] text-white'
                            : (isDark ? 'hover:bg-white/[0.06] text-gray-200' : 'hover:bg-gray-100 text-gray-800')
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isSelected && <Check size={14} className="shrink-0" />}
                          <span className="truncate">{name}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : (isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-600')
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Main Container Card (Screenshot exact match) */}
          <div className={`rounded-2xl sm:rounded-3xl border p-5 sm:p-7 transition-all ${
            isDark
              ? 'bg-[#0c101c] border-[#1e2638]'
              : 'bg-white border-gray-200'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                {isMasterEnglish && searchQuery.trim()
                  ? `সার্চ রেজাল্ট • "${searchQuery.trim()}"`
                  : selectedSubject !== 'all'
                  ? `সব এক্সাম • ${selectedSubject}`
                  : 'সব এক্সাম'}
              </h2>

              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                isDark ? 'bg-white/[0.05] text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}>
                {itemCountLabel}
              </span>
            </div>

            {/* Empty state if search returns zero results */}
            {filteredList.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <Search size={32} className="text-gray-400 mb-2.5 opacity-50" />
                <p className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  কোনো এক্সাম বা টপিক পাওয়া যায়নি
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  সঠিক টপিক নাম (যেমন Adjective, Preposition) বা প্রশ্ন নম্বর (যেমন 1-40) দিয়ে খুঁজুন
                </p>
                {isMasterEnglish && searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsEnglishSuggestOpen(false);
                    }}
                    className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer transition-colors border-none"
                  >
                    সার্চ ক্লিয়ার করুন
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Initial 5 Exam Cards (Single Column Stack, matching user screenshot) */}
                <div className="flex flex-col gap-2.5 sm:gap-3">
                  {initialExams.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => handleSelectExam(exam)}
                      className={`w-full py-4 px-4 sm:px-5 rounded-2xl font-bold text-xs sm:text-sm md:text-base text-left transition-all duration-200 cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-3 min-h-[56px] border group ${
                        isDark
                          ? 'bg-[#121724] hover:bg-[#181f30] border-[#222b3d] hover:border-red-500/50 text-white'
                          : 'bg-white hover:bg-red-50/40 border-gray-200 hover:border-red-300 text-gray-800'
                      }`}
                    >
                      <span className="line-clamp-2 text-left flex-1 font-semibold sm:font-bold">{stripEmoji(exam.title)}</span>
                      {!isCurrentCatEnrolled ? (
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors bg-gray-100 dark:bg-white/[0.05] text-gray-400 dark:text-gray-500 group-hover:text-red-500">
                          <Lock size={15} strokeWidth={1.8} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 bg-gray-100 dark:bg-white/[0.08] text-gray-500 dark:text-gray-300 group-hover:bg-[#6f0113] group-hover:text-white dark:group-hover:bg-[#e11438] dark:group-hover:text-white shadow-2xs">
                          <FileText size={16} strokeWidth={2} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Smooth Hardware-Accelerated Accordion Expand for Remaining Exams */}
                {extraExams.length > 0 && (
                  <div className={`smooth-expand-container ${isExpanded ? 'is-expanded' : ''}`}>
                    <div className="smooth-expand-content">
                      <div className="flex flex-col gap-2.5 sm:gap-3 pt-2.5 sm:pt-3">
                        {extraExams.map((exam) => (
                          <button
                            key={exam.id}
                            onClick={() => handleSelectExam(exam)}
                            className={`w-full py-4 px-4 sm:px-5 rounded-2xl font-bold text-xs sm:text-sm md:text-base text-left transition-all duration-200 cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-3 min-h-[56px] border group ${
                              isDark
                                ? 'bg-[#121724] hover:bg-[#181f30] border-[#222b3d] hover:border-red-500/50 text-white'
                                : 'bg-white hover:bg-red-50/40 border-gray-200 hover:border-red-300 text-gray-800'
                            }`}
                          >
                            <span className="line-clamp-2 text-left flex-1 font-semibold sm:font-bold">{stripEmoji(exam.title)}</span>
                            {!isCurrentCatEnrolled ? (
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors bg-gray-100 dark:bg-white/[0.05] text-gray-400 dark:text-gray-500 group-hover:text-red-500">
                                <Lock size={15} strokeWidth={1.8} />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 bg-gray-100 dark:bg-white/[0.08] text-gray-500 dark:text-gray-300 group-hover:bg-[#6f0113] group-hover:text-white dark:group-hover:bg-[#e11438] dark:group-hover:text-white shadow-2xs">
                                <FileText size={16} strokeWidth={2} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* View More Button (Smooth transition matching user spec) */}
                {hasMore && (
                  <div className="flex justify-center mt-5 pt-1">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full border text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98] ${
                        isDark
                          ? 'bg-[#151a27] hover:bg-[#1d2436] border-[#232c3f] text-gray-300 hover:text-white'
                          : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <span>{isExpanded ? 'View Less' : 'View More'}</span>
                      <ChevronDown
                        size={15}
                        className={`transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isExpanded ? 'rotate-180 text-red-500' : ''}`}
                      />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          </>
        )}
      </div>

      {checkoutModalMarkup}
    </div>
  );

  }

  // -------------------------------------------------------------
  // VIEW 3: EXAM INTRO / INSTRUCTIONS SCREEN (MATCHING WEBSITE THEME)
  // -------------------------------------------------------------
  if (step === 'exam_intro') {
    const qCount = examData?.total_questions || selectedExamMeta?.totalQuestions || 100;
    const durMins = examData?.duration_minutes || selectedExamMeta?.durationMinutes || 40;

    return (
      <div className={`relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-3 sm:p-4 font-sans transition-colors duration-300 ${
        isDark 
          ? 'bg-[#0d0205] text-white selection:bg-[#e11438] selection:text-white' 
          : 'bg-[#f8f9fa] text-[#111827] selection:bg-[#dc2626] selection:text-white'
      }`}>
        {/* Ambient Wine Red Glow for Dark Mode */}
        {isDark && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#e11438]/10 rounded-full blur-[110px]" />
          </div>
        )}

        <div className="relative z-10 w-full max-w-lg space-y-3 sm:space-y-3.5 animate-exam-intro">
          

          {/* Exam Title */}
          <h1 className={`text-xl sm:text-2xl font-black text-center tracking-tight leading-snug ${
            isDark ? 'text-white' : 'text-[#111827]'
          }`}>
            {(examData?.title || selectedExamMeta?.title || '').replace(/practice\s*quiz/gi, 'Quiz')}
          </h1>

          {examData?.subCategory && examData.subCategory !== 'General' && !onBackToLesson && (
            <p className={`text-center text-xs -mt-1 font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              📂 {examData.subCategory}
            </p>
          )}

          {/* 2 Metric Cards: Questions & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`border rounded-2xl p-3.5 sm:p-4 min-h-[120px] flex flex-col items-center justify-between text-center transition-all ${
              isDark 
                ? 'bg-[#140306]/90 border-[#e11438]/25 shadow-[0_8px_25px_rgba(0,0,0,0.5)]' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-center h-6">
                <HelpCircle size={22} className="text-[#e11438] dark:text-[#ff4d6d]" />
              </div>
              <div className="my-1">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                  {qCount}
                </span>
              </div>
              <div className="h-5 flex items-center justify-center">
                <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Total Questions
                </span>
              </div>
            </div>

            <div className={`border rounded-2xl p-3.5 sm:p-4 min-h-[120px] flex flex-col items-center justify-between text-center transition-all relative ${
              isDark 
                ? 'bg-[#140306]/90 border-[#e11438]/25 shadow-[0_8px_25px_rgba(0,0,0,0.5)]' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-center h-6">
                <Clock size={22} className="text-[#e11438] dark:text-[#ff4d6d]" />
              </div>
              <div className="my-1">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                  {durMins} <span className="text-xs sm:text-sm font-semibold opacity-75">min</span>
                </span>
              </div>
              <div className="h-5 flex items-center justify-center">
                <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Exam Duration
                </span>
              </div>
            </div>
          </div>

          {/* Examinee Identity Banner */}
          {currentUser ? (
            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
              isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {(currentUser.displayName || currentUser.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">
                    {currentUser.displayName || currentUser.name || 'Student'}
                  </p>
                  <p className="text-[10px] text-emerald-500 font-medium">ভেরিফাইড শিক্ষার্থী • মেধা তালিকায় নাম প্রদর্শিত হবে</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                <Check size={14} /> লিডারবোর্ড সক্রিয়
              </span>
            </div>
          ) : (
            <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
              isDark ? 'bg-[#140306]/90 border-[#e11438]/25' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <User size={14} className="text-[#e11438]" />
                <span>আপনার নাম (মেধাতালিকায় প্রদর্শনের জন্য):</span>
              </label>
              <input
                type="text"
                value={guestStudentName}
                onChange={(e) => {
                  setGuestStudentName(e.target.value);
                  try { localStorage.setItem('eh_guest_student_name', e.target.value); } catch {}
                }}
                placeholder="আপনার পূর্ণ নাম লিখুন (যেমন: তানভীর আহমেদ)"
                className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border transition-all focus:outline-none ${
                  isDark 
                    ? 'bg-[#1b050d] border-[#e11438]/20 text-white placeholder:text-gray-500 focus:border-[#e11438]' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-red-500'
                }`}
              />
              <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                💡 ১ম বারের পরীক্ষায় এই নামে মেধা তালিকায় আপনার রেজাল্ট ও র‍্যাংক ১০০% নির্ভুলভাবে সংরক্ষিত হবে।
              </p>
            </div>
          )}

          {/* Action Button: Start Exam */}
          <button
            onClick={() => handleStartExam(examMode)}
            disabled={isLoadingExam}
            className="w-full py-3.5 px-6 text-white font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 transition-all border-none bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#b91c1c] hover:to-[#991b1b] shadow-lg shadow-red-950/40 hover:shadow-red-900/50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoadingExam ? (
              <span>⏳ প্রশ্ন লোড হচ্ছে...</span>
            ) : (
              <span>🚀 Start Exam</span>
            )}
          </button>

          {/* Back button */}
          <div className="text-center pt-0.5">
            <button 
              onClick={() => {
                if (isCourseQuiz) handleBackToClass();
                else if (onBackToCourses) onBackToCourses();
                else updateExamStep('exam_list', selectedCategory);
              }}
              className={`text-xs font-semibold bg-transparent border-none cursor-pointer transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {isCourseQuiz ? '← Back to Class' : '← Back to Exam List'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 4: LIVE EXAM SCREEN (REAL EXAM OR PRACTICE MODE)
  // -------------------------------------------------------------
  if (step === 'exam_live') {
    const questions = examData?.questions || [];

    return (
      <div className={`min-h-screen pb-24 font-sans transition-colors duration-300 ${
        isDark ? 'bg-[#0d0205] text-white selection:bg-[#e11438] selection:text-white' : 'bg-[#f8f9fa] text-[#111827]'
      }`}>
        
        {/* Sticky Top Header Bar */}
        <header className={`sticky top-16 z-40 backdrop-blur-md border-b px-4 sm:px-8 py-3.5 shadow-md transition-all duration-200 ${
          isDark 
            ? 'bg-[#120306]/95 border-[#e11438]/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]' 
            : 'bg-white/95 border-gray-200 shadow-sm'
        }`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            
            {/* Left: Progress Pill + Palette Trigger */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuestionPaletteOpen(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-[#1b050d] hover:bg-[#260712] border-[#e11438]/25 text-gray-200' 
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                }`}
                title="View Question Navigator"
              >
                <Grid size={15} className={isDark ? "text-gray-400" : "text-gray-500"} />
                <span>{answeredCount}/{questions.length}</span>
              </button>

              <span className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                examMode === 'practice' 
                  ? (isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                  : (isDark ? 'bg-[#e11438]/15 text-[#ff4d6d] border-[#e11438]/30' : 'bg-red-50 text-red-700 border-red-200')
              }`}>
                {examMode === 'practice' ? '⚡ Practice Mode' : '⏱️ Real Mode'}
              </span>
            </div>

            {/* Center: Live Countdown Clock & Seconds Toggle (In Real Mode) */}
            {examMode === 'real' ? (
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono text-base sm:text-lg font-black tracking-wider ${
                  timeLeft <= 300 
                    ? 'bg-red-950/70 border-red-600 text-red-400 animate-pulse' 
                    : (isDark ? 'bg-[#1b050d] border-[#e11438]/25 text-[#ff4d6d]' : 'bg-red-50 border-red-200 text-[#dc2626]')
                }`}>
                  <Clock size={16} />
                  <span>{formatTimerDisplay(timeLeft)}</span>
                </div>

                <div className={`hidden sm:flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <button
                    onClick={() => setShowSeconds(!showSeconds)}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors border-none ${
                      showSeconds ? 'bg-[#dc2626]' : (isDark ? 'bg-white/15' : 'bg-gray-300')
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${showSeconds ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-[11px]">sec</span>
                </div>
              </div>
            ) : (
              <div className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${
                isDark ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                <CheckCircle2 size={14} />
                <span>Practice Mode • Instant answers & explanations available</span>
              </div>
            )}

            {/* Right: Submit Button */}
            <button
              onClick={() => setSubmitWarningModal(true)}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/30 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border-none select-none"
            >
              <Send size={15} />
              <span>Submit</span>
            </button>
          </div>
        </header>

        {/* Questions Body */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6 animate-exam-intro">
          {questions.length === 0 ? (
            <div className={`border rounded-2xl p-8 sm:p-12 text-center space-y-4 my-8 ${
              isDark ? 'bg-[#140306]/90 border-[#e11438]/25 shadow-lg' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <AlertTriangle size={48} className="mx-auto text-amber-500 mb-2" />
              <h3 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Unable to Load Questions
              </h3>
              <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Could not load exam questions from the server. Please click below to try again.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    if (selectedExamMeta) handleSelectExam(selectedExamMeta);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white font-bold text-sm rounded-xl cursor-pointer border-none shadow-md transition-transform hover:scale-105 active:scale-95"
                >
                  🔄 Reload Questions
                </button>
                <button
                  onClick={() => {
                    if (isCourseQuiz) handleBackToClass();
                    else setStep('category_detail');
                  }}
                  className={`px-6 py-2.5 font-bold text-sm rounded-xl cursor-pointer border transition-colors ${
                    isDark ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                  }`}
                >
                  {isCourseQuiz ? '← Back to Class' : '← Back to Exam List'}
                </button>
              </div>
            </div>
          ) : (
            questions.map((q, idx) => {
              const selectedOpt = getUserAnswer(userAnswers, q, idx);
              const isFlagged = flaggedQuestions[q.id] || flaggedQuestions[idx];
              const isRevealed = practiceRevealed[q.id] || practiceRevealed[idx] || (examMode === 'practice' && selectedOpt !== undefined);
              const targetCorrect = getQuestionCorrectIndex(q);
              const isCorrect = selectedOpt !== undefined && Number(selectedOpt) === Number(targetCorrect);
              const cleanExp = cleanExplanation(q.explanation, q);

              return (
                <div 
                  key={q.id || idx}
                  ref={el => questionRefs.current[idx] = el}
                  className={`border rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 ease-out ${
                    isDark ? 'bg-[#140306]/90 shadow-[0_8px_25px_rgba(0,0,0,0.5)]' : 'bg-white'
                  } ${
                    isFlagged 
                      ? (isDark ? 'border-amber-500/60 shadow-amber-950/20' : 'border-amber-400 ring-2 ring-amber-100') 
                      : (isDark ? 'border-[#e11438]/20 hover:border-[#e11438]/40' : 'border-gray-200 hover:border-gray-300')
                  }`}
                >
                  {/* Question Header: Number + Question Text + Flag Button */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3.5 flex-1">
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#dc2626] to-[#b91c1c] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm transition-transform duration-200">
                        {idx + 1}
                      </span>
                      <h3 className={`text-base sm:text-lg font-bold leading-relaxed pt-0.5 ${
                        isDark ? 'text-white' : 'text-[#111827]'
                      }`}>
                        {q.question}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleToggleFlag(q.id || idx)}
                      className={`p-2 rounded-lg border transition-all duration-200 ease-out hover:scale-105 active:scale-90 cursor-pointer ${
                        isFlagged 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                          : (isDark ? 'bg-transparent text-gray-500 border-transparent hover:text-gray-300' : 'bg-transparent text-gray-400 border-transparent hover:text-gray-600')
                      }`}
                      title={isFlagged ? "Flagged question" : "Flag for review"}
                    >
                      <Bookmark size={18} fill={isFlagged ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className={`h-px my-4 ${isDark ? 'bg-[#e11438]/15' : 'bg-gray-100'}`} />

                  {/* Options List */}
                  <div className="space-y-3">
                    {(Array.isArray(q.options) ? q.options : []).map((optText, oIdx) => {
                      const isSelected = selectedOpt !== undefined && Number(selectedOpt) === Number(oIdx);
                      const isOptionCorrect = Number(oIdx) === Number(targetCorrect);

                      // Option styling based on Mode & Status
                      let optionStyle = isDark 
                        ? 'bg-[#1a050c] border-[#e11438]/15 text-gray-200 hover:bg-[#240712] hover:border-[#e11438]/35' 
                        : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-red-50/40 hover:border-red-200';
                      let bubbleStyle = isDark 
                        ? 'bg-[#120306] text-gray-300 border-[#e11438]/20' 
                        : 'bg-white text-gray-700 border-gray-300';

                      if (examMode === 'practice' && isRevealed) {
                        if (isOptionCorrect) {
                          optionStyle = isDark 
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-md' 
                            : 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm';
                          bubbleStyle = 'bg-emerald-500 text-white border-emerald-500';
                        } else if (isSelected && !isOptionCorrect) {
                          optionStyle = isDark 
                            ? 'bg-red-950/60 border-red-500 text-red-200 shadow-md' 
                            : 'bg-red-50 border-red-500 text-red-900 shadow-sm';
                          bubbleStyle = 'bg-red-500 text-white border-red-500';
                        }
                      } else if (isSelected) {
                        optionStyle = isDark 
                          ? 'bg-[#2a0610] border-[#e11438] text-white shadow-md shadow-red-950/40' 
                          : 'bg-red-50 border-red-500 text-red-900 shadow-sm';
                        bubbleStyle = 'bg-[#dc2626] text-white border-[#dc2626]';
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(q.id || idx, oIdx)}
                          className={`w-full text-left p-3 sm:p-3.5 rounded-xl border flex items-center gap-3.5 transition-all duration-200 ease-out active:scale-[0.985] cursor-pointer select-none group ${optionStyle} ${
                            isSelected ? 'animate-option-pulse ring-1 ring-red-500/25' : ''
                          }`}
                        >
                          {/* Option Bubble: A, B, C, D */}
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-200 ease-out border ${bubbleStyle} ${
                            isSelected ? 'scale-105 shadow-sm' : 'group-hover:scale-105'
                          }`}>
                            {OPTION_LETTERS[oIdx] || oIdx + 1}
                          </span>

                          <span className="text-sm sm:text-base leading-normal font-medium flex-1">
                            {optText}
                          </span>

                          {/* Status Icon in Practice Mode */}
                          {examMode === 'practice' && isRevealed && (
                            <span>
                              {isOptionCorrect && <Check size={18} className="text-emerald-400" />}
                              {isSelected && !isOptionCorrect && <X size={18} className="text-red-400" />}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Instant Explanation Box in Practice Mode */}
                  {examMode === 'practice' && isRevealed && (
                    cleanExp ? (
                      <div className={`mt-4 p-4 rounded-xl border text-xs sm:text-sm space-y-1.5 animate-fadeIn ${
                        isDark 
                          ? 'bg-[#1b050d] border-[#e11438]/25 text-gray-300' 
                          : 'bg-red-50/50 border-red-200 text-gray-700'
                      }`}>
                        <p className={`font-bold ${isDark ? 'text-[#ff4d6d]' : 'text-[#dc2626]'}`}>
                          ব্যাখ্যা / Explanation:
                        </p>
                        <p className="leading-relaxed whitespace-pre-line">
                          {cleanExp}
                        </p>
                      </div>
                    ) : (
                      <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                        isDark ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                        <Check size={14} className="text-emerald-500 shrink-0" />
                        <span>সঠিক উত্তর: <strong>{OPTION_LETTERS[targetCorrect] || targetCorrect + 1}) {(q.options && q.options[targetCorrect] !== undefined) ? q.options[targetCorrect] : ''}</strong></span>
                      </div>
                    )
                  )}
                </div>
              );
            })
          )}

          {/* Bottom Submit Banner */}
          {questions.length > 0 && (
            <div className="pt-6 pb-12 flex justify-center">
              <button
                onClick={() => setSubmitWarningModal(true)}
                className="py-4 px-10 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold text-base rounded-2xl flex items-center gap-2.5 shadow-xl shadow-emerald-950/40 cursor-pointer border-none transition-all duration-200 hover:scale-105 active:scale-95 select-none"
              >
                <Send size={18} />
                <span>Submit Exam ({answeredCount}/{questions.length})</span>
              </button>
            </div>
          )}
        </main>

        {/* Question Navigator Drawer / Modal */}
        {questionPaletteOpen && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`border rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl transition-all animate-exam-intro ${
              isDark ? 'bg-[#140306] border-[#e11438]/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)]' : 'bg-white border-gray-200 shadow-2xl'
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b ${
                isDark ? 'border-[#e11438]/20' : 'border-gray-200'
              }`}>
                <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                  <Grid size={18} className="text-[#dc2626]" /> Question Navigator
                </h3>
                <button 
                  onClick={() => setQuestionPaletteOpen(false)}
                  className={`bg-transparent border-none cursor-pointer ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Legend */}
              <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" /> Answered ({answeredCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block" /> Flagged ({Object.keys(flaggedQuestions).filter(k => flaggedQuestions[k]).length})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded border inline-block ${
                    isDark ? 'bg-[#1b050d] border-[#e11438]/20' : 'bg-gray-100 border-gray-300'
                  }`} /> Unanswered ({questions.length - answeredCount})
                </span>
              </div>

              {/* Grid of Numbers */}
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-72 overflow-y-auto p-1 scrollbar-thin">
                {questions.map((q, idx) => {
                  const isAns = userAnswers[q.id] !== undefined;
                  const isFlag = flaggedQuestions[q.id];

                  let cellStyle = isDark 
                    ? 'bg-[#1b050d] border-[#e11438]/20 text-gray-400 hover:border-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400';
                  if (isFlag) cellStyle = 'bg-amber-500 text-black border-amber-400 font-black';
                  else if (isAns) cellStyle = 'bg-emerald-600 text-white border-emerald-500 font-bold';

                  return (
                    <button
                      key={idx}
                      onClick={() => scrollToQuestion(idx)}
                      className={`h-9 rounded-xl border text-xs font-mono transition-all flex items-center justify-center cursor-pointer ${cellStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setQuestionPaletteOpen(false)}
                  className={`px-5 py-2 text-xs font-bold rounded-xl cursor-pointer border-none transition-colors ${
                    isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Submit Confirmation Modal */}
        {submitWarningModal && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl transition-all animate-exam-intro ${
              isDark ? 'bg-[#140306] border-[#e11438]/25 shadow-[0_20px_60px_rgba(0,0,0,0.8)]' : 'bg-white border-gray-200 shadow-2xl'
            }`}>
              <div className="flex items-center gap-3 text-amber-400">
                <AlertTriangle size={26} />
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>Submit Exam?</h3>
              </div>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                You have answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions.
                {questions.length - answeredCount > 0 && (
                  <span className="text-red-500 block mt-1 font-semibold">
                    ({questions.length - answeredCount} questions are still unanswered)
                  </span>
                )}
              </p>

              {!currentUser && (
                <div className={`p-3 rounded-2xl border space-y-1 text-left ${
                  isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                    মেধাতালিকায় আপনার নাম (Examinee Name):
                  </label>
                  <input
                    type="text"
                    value={guestStudentName}
                    onChange={(e) => {
                      setGuestStudentName(e.target.value);
                      try { localStorage.setItem('eh_guest_student_name', e.target.value); } catch {}
                    }}
                    placeholder="আপনার পূর্ণ নাম লিখুন (যেমন: তানভীর আহমেদ)"
                    className={`w-full px-3 py-2 rounded-xl text-xs border transition-all ${
                      isDark 
                        ? 'bg-[#1b050d] border-[#e11438]/25 text-white placeholder:text-gray-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                    }`}
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  onClick={() => setSubmitWarningModal(false)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
                    isDark ? 'bg-transparent border-white/15 text-gray-300 hover:bg-white/5' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSubmitWarningModal(false);
                    calculateAndFinishExam();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white text-sm font-bold cursor-pointer border-none shadow-lg shadow-emerald-950/40 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 5: RESULTS & COMPREHENSIVE SOLUTION REVIEW
  // -------------------------------------------------------------
  if (step === 'exam_result') {
    if (!examResult) {
      return (
        <div className={`min-h-screen p-6 font-sans flex items-center justify-center ${
          isDark ? 'bg-[#0d0205] text-white' : 'bg-[#f8f9fa] text-[#111827]'
        }`}>
          <div className={`max-w-md w-full text-center space-y-4 p-8 rounded-3xl border ${
            isDark ? 'bg-[#140306] border-[#e11438]/20' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-xl font-bold">Exam Results</h2>
            <p className="text-sm text-gray-500">No active result found for this exam session.</p>
            <div className="flex gap-3 justify-center pt-2">
              <button 
                onClick={() => handleStartExam('real')}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm cursor-pointer border-none transition-all"
              >
                Start Exam
              </button>
              <button 
                onClick={() => updateExamStep('exam_list', selectedCategory)}
                className={`px-5 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-all ${
                  isDark ? 'border-white/20 text-white hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Back to Hub
              </button>
            </div>
          </div>
        </div>
      );
    }

    const questions = (examResult?.questions && examResult.questions.length > 0)
      ? examResult.questions
      : ((examData && examData.questions && examData.questions.length > 0) ? examData.questions : []);

    const activeUserAnswers = (examResult?.userAnswers && Object.keys(examResult.userAnswers).length > 0)
      ? examResult.userAnswers
      : (userAnswers && Object.keys(userAnswers).length > 0
          ? userAnswers
          : (() => {
              try {
                const urlParams = new URLSearchParams(window.location.search);
                const urlExam = urlParams.get('exam') || examResult?.examId;
                if (urlExam) {
                  const byKey = sessionStorage.getItem(`eduhunters_answers_${urlExam}`) ||
                                localStorage.getItem(`eduhunters_answers_${urlExam}`);
                  if (byKey) return JSON.parse(byKey);
                }
                const saved = sessionStorage.getItem('eduhunters_active_user_answers');
                if (saved) return JSON.parse(saved);
                const hist = localStorage.getItem('eduhunters_exam_history');
                if (hist) {
                  const parsed = JSON.parse(hist);
                  for (const h of parsed) {
                    if (h.examId === urlExam && h.userAnswers && Object.keys(h.userAnswers).length > 0) {
                      return h.userAnswers;
                    }
                  }
                  if (parsed.length > 0 && parsed[0].userAnswers && Object.keys(parsed[0].userAnswers).length > 0) {
                    return parsed[0].userAnswers;
                  }
                }
              } catch (e) {}
              return {};
            })());

    // Robust answer extractor to handle any ID type / index type
    const getAnswerForQuestion = (q, idx) => {
      return getUserAnswer(activeUserAnswers, q, idx);
    };

    // Filtered questions based on solutionFilter: 'all' | 'wrong' | 'correct' | 'skipped'
    const reviewQuestions = questions.filter((q, idx) => {
      const selected = getAnswerForQuestion(q, idx);
      const isAnswered = selected !== undefined && selected !== null && selected !== '' && !isNaN(Number(selected));
      const targetCorrect = getQuestionCorrectIndex(q);
      const isCorrect = isAnswered && Number(selected) === Number(targetCorrect);
      const isWrong = isAnswered && Number(selected) !== Number(targetCorrect);
      const isSkipped = !isAnswered;

      if (solutionFilter === 'wrong') return isWrong;
      if (solutionFilter === 'correct') return isCorrect;
      if (solutionFilter === 'skipped') return isSkipped;
      return true;
    });

    // Dynamically calculate actual question review counts to eliminate discrepancies
    let c = 0, w = 0, s = 0;
    questions.forEach((q, idx) => {
      const selected = getUserAnswer(activeUserAnswers, q, idx);
      const isAns = selected !== undefined && selected !== null && selected !== '' && !isNaN(Number(selected));
      const target = getQuestionCorrectIndex(q);
      if (!isAns) s++;
      else if (Number(selected) === Number(target)) c++;
      else w++;
    });
    const reviewCounts = { all: questions.length, correct: c, wrong: w, skipped: s };

    const penaltyAmount = Number(examResult.wrongPenalty !== undefined ? examResult.wrongPenalty : (reviewCounts.wrong * (examResult.negPerWrong || 0.25)));
    const computedScore = +(Number(reviewCounts.correct) - penaltyAmount).toFixed(2);
    const displayedFinalScore = examResult.finalScore !== undefined ? examResult.finalScore : computedScore;
    const displayedPercentage = Math.max(0, Math.round((Math.max(0, displayedFinalScore) / Number(examResult.totalQuestions || 1)) * 100));

    return (
      <div className={`min-h-screen p-4 sm:p-6 md:p-8 font-sans transition-colors duration-300 ${
        isDark ? 'bg-[#0d0205] text-white selection:bg-[#e11438] selection:text-white' : 'bg-[#f8f9fa] text-[#111827]'
      }`}>
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Result Summary Card */}
          <div className={`border rounded-3xl p-6 sm:p-8 text-center space-y-6 relative overflow-hidden transition-all shadow-none ${
            isDark 
              ? 'bg-[#140306]/90 border-[#e11438]/25' 
              : 'bg-white border-gray-200'
          }`}>
            <div>
              <h2 className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                Exam Results
              </h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {examResult.title}
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className={`border p-4 rounded-2xl ${isDark ? 'bg-[#1b050d] border-[#e11438]/15' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Final Score</p>
                <p className="text-2xl font-black text-[#dc2626] dark:text-[#ff4d6d]">
                  {displayedFinalScore} / {examResult.totalQuestions}
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{displayedPercentage}% Accuracy</p>
              </div>
              <div className={`border p-4 rounded-2xl ${isDark ? 'bg-[#1b050d] border-[#e11438]/15' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Correct Answers</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {reviewCounts.correct}
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>+{reviewCounts.correct} Marks</p>
              </div>
              <div className={`border p-4 rounded-2xl ${isDark ? 'bg-[#1b050d] border-[#e11438]/15' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Wrong Answers</p>
                <p className="text-2xl font-black text-red-600 dark:text-red-400">
                  {reviewCounts.wrong}
                </p>
                <p className="text-[11px] text-red-500 dark:text-red-400/80 mt-0.5">
                  -{Number(reviewCounts.wrong * (examResult.negPerWrong || 0.25)).toFixed(2)} Negative
                </p>
              </div>
              <div className={`border p-4 rounded-2xl ${isDark ? 'bg-[#1b050d] border-[#e11438]/15' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unanswered (Skipped)</p>
                <p className={`text-2xl font-black ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {reviewCounts.skipped}
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>0 marks deducted</p>
              </div>
            </div>

            {/* Leaderboard Policy Note / Dynamic Attempt Badge */}
            {(examResult?.isOfficialRanked || (examResult?.isFirstAttempt && (!examResult?.attemptNumber || examResult?.attemptNumber === 1))) ? (
              <div className="p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                <Trophy size={18} className="text-amber-500 shrink-0" />
                <span>🏆 ১ম অফিসিয়াল প্রচেষ্টা: আপনার স্কোর ও অবস্থান সরাসরি লাইভ মেধা তালিকায় অন্তর্ভুক্ত হয়েছে!</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2.5 bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400">
                <RefreshCw size={18} className="text-blue-500 shrink-0" />
                <span>📝 অনুশীলন প্রচেষ্টা (Practice Mode): এটি প্র্যাকটিস হিসেবে সম্পন্ন হয়েছে। ১ম প্রচেষ্টার অফিসিয়াল মেধা তালিকা ও স্কোর অপরিবর্তিত থাকবে।</span>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  sessionStorage.removeItem('eduhunters_active_exam_result');
                  handleStartExam('practice');
                }}
                className="py-3 px-6 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#b91c1c] hover:to-[#991b1b] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer border-none transition-all"
              >
                <RefreshCw size={15} />
                <span>Retake Exam (Practice)</span>
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem('eduhunters_active_exam_result');
                  if (isCourseQuiz) handleBackToClass();
                  else if (onBackToCourses) onBackToCourses();
                  else updateExamStep('exam_list', selectedCategory);
                }}
                className={`py-3 px-6 border text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                  isDark ? 'bg-[#1b050d] hover:bg-[#250712] border-[#e11438]/25 text-white' : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-800'
                }`}
              >
                <ArrowLeft size={15} />
                <span>{isCourseQuiz ? 'Back to Class' : 'Back to Exam Hub'}</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* LIVE EXAM LEADERBOARD CARD (100% ACCURATE REAL-TIME STANDINGS) */}
          {/* ========================================================= */}
          <div className={`border rounded-3xl p-5 sm:p-7 space-y-5 transition-all shadow-none ${
            isDark 
              ? 'bg-[#140306]/90 border-[#e11438]/25' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-inherit">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span>লাইভ মেধা তালিকা (Live Leaderboard)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    ১ম বারের অফিসিয়াল স্কোরের ভিত্তিতে মেধা তালিকা • পরবর্তী পরীক্ষাগুলো প্র্যাকটিস হিসেবে গণ্য হয়
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cat = selectedCategory || examData?.category || 'sureshot';
                    const eId = selectedExamMeta?.id || examResult?.examId;
                    loadLiveExamLeaderboard(cat, eId);
                  }}
                  disabled={isLoadingExamLeaderboard}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200' 
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                >
                  <RefreshCw size={13} className={isLoadingExamLeaderboard ? 'animate-spin' : ''} />
                  <span>{isLoadingExamLeaderboard ? 'আপডেট হচ্ছে...' : 'রিফ্রেশ'}</span>
                </button>

                {onSwitchToBoard && (
                  <button
                    type="button"
                    onClick={onSwitchToBoard}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white border-none cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <span>সকল লিডারবোর্ড</span>
                    <ChevronRight size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Current Examinee Rank Highlight Card */}
            {(() => {
              const resolvedUser = getResolvedStudent(currentUser, guestStudentName);
              const myEntry = liveExamLeaderboard.find(item => {
                const sId = String(item.student_id || '');
                const sPhone = (item.student_phone || '').replace(/[^0-9]/g, '');
                const sEmail = (item.student_email || '').trim().toLowerCase();
                const resPhone = (resolvedUser.phone || '').replace(/[^0-9]/g, '');
                const resEmail = (resolvedUser.email || '').trim().toLowerCase();
                return (sId && (sId === resolvedUser.id || sId === resolvedUser.uid)) ||
                       (resPhone && sPhone && resPhone === sPhone) ||
                       (resEmail && sEmail && resEmail === sEmail);
              });

              return (
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  isDark ? 'bg-[#1e050f]/80 border-[#e11438]/40' : 'bg-red-50/70 border-red-200'
                }`}>
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#dc2626] to-[#ff2a55] text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
                      {myEntry ? `#${myEntry.rank}` : '#1'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>আপনার মেধা অবস্থান:</span>
                        <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {resolvedUser.name || 'Student'}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-500 font-medium mt-0.5">
                        {myEntry 
                          ? `🏆 ১ম বারের অফিসিয়াল স্কোর: ${myEntry.score} / ${myEntry.total_marks || examResult.totalQuestions} (${myEntry.percentage}% এক্যুরেসি)`
                          : `পরীক্ষার ফলাফল সংরক্ষিত হয়েছে • আপনার নাম মেধা তালিকায় অন্তর্ভুক্ত`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">
                      {myEntry ? `${myEntry.score} pts` : `${displayedFinalScore} pts`}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Top Standings List */}
            <div className="space-y-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                শীর্ষ মেধাতালিকা ({liveExamLeaderboard.length} জন শিক্ষার্থী)
              </h4>

              {liveExamLeaderboard.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500">
                  {isLoadingExamLeaderboard ? 'মেধাতালিকা লোড হচ্ছে...' : 'এখনও কোনো শিক্ষার্থী পরীক্ষা দেয়নি। আপনিই প্রথম!'}
                </div>
              ) : (
                <div className={`divide-y border rounded-2xl overflow-hidden text-xs ${
                  isDark ? 'divide-white/10 border-white/10' : 'divide-slate-200 border-slate-200'
                }`}>
                  {liveExamLeaderboard.slice(0, 10).map((st) => {
                    const resolvedUser = getResolvedStudent(currentUser, guestStudentName);
                    const isMe = String(st.student_id) === String(resolvedUser.id) ||
                                 String(st.student_id) === String(resolvedUser.uid) ||
                                 (resolvedUser.phone && st.student_phone && resolvedUser.phone.includes(st.student_phone.slice(-10))) ||
                                 (resolvedUser.email && st.student_email && resolvedUser.email === st.student_email);

                    return (
                      <div
                        key={st.id || st.student_id}
                        className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                          isMe 
                            ? (isDark ? 'bg-[#e11438]/20 font-bold' : 'bg-red-50 font-bold') 
                            : (isDark ? 'bg-transparent hover:bg-white/[0.02]' : 'bg-transparent hover:bg-slate-50')
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
                            st.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-xs' :
                            st.rank === 2 ? 'bg-slate-200 text-slate-800' :
                            st.rank === 3 ? 'bg-amber-700 text-amber-100' :
                            (isDark ? 'bg-white/10 text-gray-300' : 'bg-slate-100 text-slate-600')
                          }`}>
                            {st.rank}
                          </span>
                          <div className="min-w-0">
                            <p className={`truncate font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {st.student_name || 'Student'} {isMe && <span className="text-[10px] text-amber-400 ml-1">(আপনি)</span>}
                            </p>
                            <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                              {st.percentage}% এক্যুরেসি • {Math.floor((st.time_taken_seconds || 0) / 60)}মি {(st.time_taken_seconds || 0) % 60}সে
                            </p>
                          </div>
                        </div>

                        <span className="font-mono font-bold text-xs shrink-0 text-amber-500">
                          {st.score} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Solution Sheet Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                  <CheckSquare size={20} className="text-emerald-500" /> Complete Solution & Explanations
                </h3>
              </div>

              {/* Solution Filter Pills */}
              <div className={`inline-flex items-center gap-1 p-1 rounded-2xl border transition-all duration-300 ${
                isDark ? 'bg-[#140306]/90 border-[#e11438]/20 backdrop-blur-sm' : 'bg-gray-100 border-gray-200'
              }`}>
                {[
                  { key: 'all', label: 'All', count: reviewCounts.all, activeBg: 'bg-[#dc2626] text-white shadow-sm' },
                  { key: 'wrong', label: 'Wrong', count: reviewCounts.wrong, activeBg: 'bg-red-600 text-white shadow-sm' },
                  { key: 'correct', label: 'Correct', count: reviewCounts.correct, activeBg: 'bg-emerald-600 text-white shadow-sm' },
                  { key: 'skipped', label: 'Skipped', count: reviewCounts.skipped, activeBg: isDark ? 'bg-white/20 text-white shadow-sm' : 'bg-gray-600 text-white shadow-sm' }
                ].map(tab => {
                  const isActive = solutionFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setSolutionFilter(tab.key)}
                      className={`relative px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold border-none cursor-pointer transition-all duration-200 ease-out transform active:scale-95 ${
                        isActive
                          ? `${tab.activeBg} scale-[1.02]`
                          : (isDark ? 'text-gray-400 hover:text-white hover:bg-white/[0.04] bg-transparent' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 bg-transparent')
                      }`}
                    >
                      <span>{tab.label} ({tab.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtered Questions List with smooth transition */}
            <div key={solutionFilter} className="space-y-4 animate-filter-switch">
            {reviewQuestions.map((q, idx) => {
              const selectedOpt = getAnswerForQuestion(q, idx);
              const isAnswered = selectedOpt !== undefined && selectedOpt !== null && selectedOpt !== '' && !isNaN(Number(selectedOpt));
              const targetCorrect = getQuestionCorrectIndex(q);
              const isCorrect = isAnswered && Number(selectedOpt) === Number(targetCorrect);
              const isSkipped = !isAnswered;
              const cleanExp = cleanExplanation(q.explanation, q);

              return (
                <div 
                  key={q.id || idx}
                  className={`border rounded-2xl p-5 sm:p-6 space-y-4 transition-all ${
                    isDark ? 'bg-[#140306]/90' : 'bg-white'
                  } ${
                    isSkipped 
                      ? (isDark ? 'border-[#e11438]/20' : 'border-gray-200') 
                      : isCorrect 
                      ? (isDark ? 'border-emerald-500/40 bg-[#061c12]' : 'border-emerald-200 bg-emerald-50/40') 
                      : (isDark ? 'border-red-500/40 bg-[#24060d]' : 'border-red-200 bg-red-50/40')
                  }`}
                >
                  {/* Status Banner */}
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#dc2626] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {q.question_no || idx + 1}
                    </span>
                    <span className={`text-sm sm:text-base font-bold flex-1 ${isDark ? 'text-white' : 'text-[#111827]'}`}>{q.question}</span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2 pt-1">
                    {(Array.isArray(q.options) ? q.options : []).map((optText, oIdx) => {
                      const isOptionCorrect = Number(oIdx) === Number(targetCorrect);
                      const isUserSelected = isAnswered && Number(selectedOpt) === Number(oIdx);

                      let optClass = isDark ? 'bg-[#1a050c] border-[#e11438]/15 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700';
                      let bubbleClass = isDark ? 'bg-[#120306] text-gray-400 border-[#e11438]/20' : 'bg-white text-gray-600 border-gray-300';

                      if (isOptionCorrect) {
                        optClass = isDark 
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold' 
                          : 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                        bubbleClass = 'bg-emerald-600 text-white border-emerald-500';
                      } else if (isUserSelected && !isCorrect) {
                        optClass = isDark 
                          ? 'bg-red-950/70 border-red-500 text-red-200 font-bold' 
                          : 'bg-red-50 border-red-400 text-red-900 font-bold';
                        bubbleClass = 'bg-red-600 text-white border-red-500';
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${optClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border ${bubbleClass}`}>
                              {OPTION_LETTERS[oIdx] || oIdx + 1}
                            </span>
                            <span>{optText}</span>
                          </div>

                          {isOptionCorrect && (
                            <span className="text-xs text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                              <Check size={14} /> Correct Answer {isUserSelected && '(Your Answer)'}
                            </span>
                          )}
                          {isUserSelected && !isCorrect && (
                            <span className="text-xs text-red-500 dark:text-red-400 font-bold flex items-center gap-1 shrink-0">
                              <X size={14} /> Your Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation or Verified Answer */}
                  {cleanExp ? (
                    <div className={`p-3.5 rounded-xl border text-xs sm:text-sm space-y-1 ${
                      isDark ? 'bg-[#1b050d] border-[#e11438]/20 text-gray-300' : 'bg-red-50/50 border-red-100 text-gray-700'
                    }`}>
                      <p className={`font-bold ${isDark ? 'text-[#ff4d6d]' : 'text-[#dc2626]'}`}>
                        ব্যাখ্যা / Explanation:
                      </p>
                      <p className="leading-relaxed whitespace-pre-line">
                        {cleanExp}
                      </p>
                    </div>
                  ) : (
                    <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                      isDark ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                      <Check size={14} className="text-emerald-500 shrink-0" />
                      <span>সঠিক উত্তর: <strong>{OPTION_LETTERS[targetCorrect] || targetCorrect + 1}) {(q.options && q.options[targetCorrect] !== undefined) ? q.options[targetCorrect] : ''}</strong></span>
                    </div>
                  )}
                </div>
              );
            })}

            {reviewQuestions.length === 0 && (
              <div className={`p-8 text-center rounded-2xl border ${
                isDark ? 'bg-[#140306]/90 border-[#e11438]/20 text-gray-400' : 'bg-white border-gray-200 text-gray-500'
              }`}>
                <p className="text-sm font-semibold">
                  {solutionFilter === 'wrong' ? 'No wrong answers found for this exam.' :
                   solutionFilter === 'correct' ? 'No correct answers found for this exam.' :
                   solutionFilter === 'skipped' ? 'No skipped questions found for this exam.' :
                   'No questions found.'}
                </p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safe ultimate fallback: If step is invalid or unknown, render category cards view so screen is never blank
  if (isCourseQuiz || initialExam) {
    if (step !== 'exam_intro' && step !== 'exam_live' && step !== 'exam_result') {
      setStep('exam_intro');
    }
    return null;
  }

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300 ${
      isDark ? 'bg-transparent text-white' : 'bg-[#f8f9fa] text-[#111827]'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${
            isDark ? 'text-white' : 'text-[#111827]'
          }`}>
            আমাদের চলমান এক্সামসমূহ
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesMetadata.filter(c => !c.isHidden && c.isActive !== false).map((cat) => (
            <div 
              key={cat.key}
              onClick={() => {
                setSelectedCategoryDetail(cat);
                updateExamStep('category_detail', cat.key);
              }}
              className={`group rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
                isDark 
                  ? 'bg-[#140306] border-[#e11438]/20 hover:border-[#e11438]/45 shadow-[0_12px_35px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_40px_rgba(225,20,56,0.12)]' 
                  : 'bg-white border-gray-200 hover:border-red-300'
              }`}
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
                <img 
                  src={cat.image} 
                  alt={cat.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "/sureshot_banner.jpg"; }}
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg leading-tight mb-2 text-white">{cat.title}</h3>
                  <p className="text-xs text-gray-400">{cat.subtitle}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-sm font-black text-[#ff3366]">৳{cat.price}</span>
                  <span className="text-xs font-bold text-red-400">বিস্তারিত দেখুন →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
