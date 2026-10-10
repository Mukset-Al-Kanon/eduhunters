import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, Clock, HelpCircle, BookOpen, Zap, CheckCircle2, 
  Send, RefreshCw, Trophy, Award, Check, X, AlertTriangle, 
  ChevronDown, ChevronUp, ChevronRight, Eye, ShieldAlert,
  Search, Filter, Sparkles, Flame, Bookmark, History,
  BarChart3, CheckSquare, XCircle, Grid, ListFilter, ArrowRight, User, FileText,
  Lock, Play, SlidersHorizontal
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTheme } from '../context/ThemeContext';
import { EXAM_CATEGORIES_METADATA, EXAM_PAGE_FILTER_TABS } from '../data/examCategoriesData';
import CategoryDetailModal from './CategoryDetailModal';
import ExamDetailPage from './ExamDetailPage';
import CheckoutModal from './CheckoutModal';
import RtdsCurriculumView from './RtdsCurriculumView';
import { stripEmoji } from '../utils/textUtils';
import { getMergedExamManifest, loadExamQuestions } from '../utils/examBatchStorage';
import { useAuth } from '../context/AuthContext';
import { getStoredEnrolledBatches, grantCourseAccess, isItemEnrolled } from '../utils/enrollmentService';


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
  onSwitchToBoard, 
  siteSettings, 
  customExamBatches = null,
  isFromBundle = false,
  onBackToBundle = null,
  onLoginClick = null
}) {
  const { isDark } = useTheme();
  const categoriesMetadata = (customExamBatches && customExamBatches.length > 0)
    ? customExamBatches
    : EXAM_CATEGORIES_METADATA;

  // Navigation states: 'category_cards' | 'category_detail' | 'course_card' | 'exam_list' | 'exam_intro' | 'exam_live' | 'exam_result'
  const [step, setStep] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlStep = urlParams.get('step');
      const urlCat = urlParams.get('category');
      if (urlStep) return urlStep;
      if (urlCat && urlCat !== 'all') return 'category_detail';
      if (initialCategory && initialCategory !== 'all') return initialStep || 'category_detail';
    } catch (e) {}
    return initialStep;
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
    grantCourseAccess(catKey);
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

  // Sync state if initialCategory or initialStep changes
  React.useEffect(() => {
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
  }, [initialCategory, initialStep, categoriesMetadata]);

  // Handle browser popstate / back-forward within exam views
  React.useEffect(() => {
    const onPop = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlStep = urlParams.get('step');
        const urlCat = urlParams.get('category');
        if (urlCat && urlCat !== 'all') {
          const cat = categoriesMetadata.find(c => c.key === urlCat);
          if (cat) {
            setSelectedCategoryDetail(cat);
            setSelectedCategory(urlCat);
          }
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
  }, []);

  // Manifest data state
  const [manifestData, setManifestData] = useState(null);
  const [allExams, setAllExams] = useState(INITIAL_SURE_SHOT);
  const [isLoadingManifest, setIsLoadingManifest] = useState(true);

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
  const updateExamStep = (newStep, catKey = null) => {
    setStep(newStep);
    setIsExpanded(false);
    try {
      const currentCat = catKey || selectedCategory || (selectedCategoryDetail?.key);
      const params = new URLSearchParams();
      if (currentCat && currentCat !== 'all') params.set('category', currentCat);
      if (newStep && newStep !== 'category_detail' && newStep !== 'category_cards') {
        params.set('step', newStep);
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      window.history.pushState(null, '', `/exams${qs}`);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  const [selectedExamMeta, setSelectedExamMeta] = useState(INITIAL_SURE_SHOT[0]);
  const [examData, setExamData] = useState(null);
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [examMode, setExamMode] = useState('real'); // 'real' | 'practice'

  // Live Exam States
  const [userAnswers, setUserAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [practiceRevealed, setPracticeRevealed] = useState({});
  const [timeLeft, setTimeLeft] = useState(40 * 60);
  const [customDurationMins, setCustomDurationMins] = useState(null);
  const [showCustomDurationPicker, setShowCustomDurationPicker] = useState(false);
  const [showSeconds, setShowSeconds] = useState(true);
  const [isSecondTimer, setIsSecondTimer] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [examResult, setExamResult] = useState(null);
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
          setManifestData({ ...data, exams: cleanedExams });
          setAllExams(cleanedExams);
          // Set initial meta to first item if default
          if (!selectedExamMeta || selectedExamMeta.id === 'sureshot-1') {
            setSelectedExamMeta(cleanedExams[0]);
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

  // Load Exam JSON when clicked
  const handleSelectExam = async (examMeta) => {
    const catKey = examMeta.category || selectedCategory;
    const isCurrentCatEnrolled = isBatchEnrolled(catKey);
    const examIndex = filteredExams.findIndex(e => e.id === examMeta.id);
    if (!isCurrentCatEnrolled && examIndex > 0) {
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
    setIsLoadingExam(true);
    try {
      const data = await loadExamQuestions(examMeta);
      const normalized = data.questions || [];

      const totalQs = normalized.length || examMeta.totalQuestions || 100;
      const durationMins = data.duration_minutes || examMeta.durationMinutes || (totalQs <= 25 ? 15 : (totalQs <= 50 ? 30 : 40));

      setExamData({
        ...data,
        title: data.title || examMeta.title,
        category: examMeta.category,
        categoryName: examMeta.categoryName,
        subCategory: examMeta.subCategory,
        subject: examMeta.subject,
        duration_minutes: durationMins,
        total_questions: totalQs,
        negative_mark: data.negative_mark !== undefined ? (data.negative_mark > 1 ? data.negative_mark / 100 : data.negative_mark) : (examMeta.negativeMark || 0.25),
        questions: normalized
      });

      const isSec = Boolean(
        (examMeta.categoryName && examMeta.categoryName.includes('সেকেন্ড টাইমার')) ||
        (examMeta.title && examMeta.title.includes('সেকেন্ড টাইমার')) ||
        (examMeta.subCategory && examMeta.subCategory.includes('সেকেন্ড টাইমার')) ||
        (examMeta.category === 'sureshot')
      );
      setIsSecondTimer(isSec);

      setCustomDurationMins(null);
      setShowCustomDurationPicker(false);
      setTimeLeft(durationMins * 60);
      setStep('exam_intro');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Error loading exam:", err);
      alert("এক্সাম ডাটা লোড হতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsLoadingExam(false);
    }
  };

  // Start Exam
  const handleStartExam = (mode = 'real') => {
    setExamMode(mode);
    setUserAnswers({});
    setFlaggedQuestions({});
    setPracticeRevealed({});
    setIsSubmitted(false);
    setExamResult(null);
    const activeDur = customDurationMins || examData?.duration_minutes || selectedExamMeta?.durationMinutes || 40;
    setTimeLeft(activeDur * 60);
    setStep('exam_live');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select Option during Exam
  const handleSelectOption = (questionId, optionIdx) => {
    if (isSubmitted) return;

    if (examMode === 'practice') {
      // In practice mode, lock in answer and reveal explanation
      setUserAnswers(prev => ({
        ...prev,
        [questionId]: optionIdx
      }));
      setPracticeRevealed(prev => ({
        ...prev,
        [questionId]: true
      }));
      return;
    }

    // In real exam mode: allow toggling or changing
    setUserAnswers(prev => {
      if (prev[questionId] === optionIdx) {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      }
      return {
        ...prev,
        [questionId]: optionIdx
      };
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

    examData.questions.forEach(q => {
      const selected = userAnswers[q.id];
      if (selected === undefined) {
        skipped++;
      } else if (selected === q.correct_index) {
        correct++;
      } else {
        wrong++;
      }
    });

    const negPerWrong = examData.negative_mark !== undefined ? examData.negative_mark : 0.25;
    const wrongPenalty = +(wrong * negPerWrong).toFixed(2);
    const secondTimerPenalty = isSecondTimer ? 3.0 : 0;
    const totalPenalty = +(wrongPenalty + secondTimerPenalty).toFixed(2);
    const score = Math.max(0, +(correct - totalPenalty).toFixed(2));
    const passMarks = Math.round(examData.questions.length * 0.4);
    const percentage = Math.round((score / examData.questions.length) * 100);
    const isPassed = score >= passMarks;

    const resultObj = {
      examId: selectedExamMeta?.id || Date.now().toString(),
      title: examData.title,
      category: examData.category,
      categoryName: examData.categoryName,
      subject: examData.subject,
      date: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      totalQuestions: examData.questions.length,
      correct,
      wrong,
      skipped,
      negPerWrong,
      wrongPenalty,
      isSecondTimer,
      secondTimerPenalty,
      totalPenalty,
      finalScore: score,
      percentage,
      isPassed
    };

    setExamResult(resultObj);

    // Save to Exam History in localStorage
    try {
      const updatedHistory = [resultObj, ...examHistory.slice(0, 49)];
      setExamHistory(updatedHistory);
      localStorage.setItem('eduhunters_exam_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn("Failed to save history:", e);
    }

    setStep('exam_result');
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
        title: checkoutCategory.title || 'এক্সাম ব্যাচ এনরোলমেন্ট',
        price: parseInt(String(checkoutCategory.price || '399').replace(/[^0-9]/g, '')) || 399,
        salePrice: parseInt(String(checkoutCategory.price || '399').replace(/[^0-9]/g, '')) || 399,
        originalPrice: parseInt(String(checkoutCategory.originalPrice || '799').replace(/[^0-9]/g, '')) || 799,
        image: checkoutCategory.image || '/sureshot_banner.jpg'
      }}
      onClose={() => setCheckoutCategory(null)}
      onSuccess={(orderInfo) => {
        handleEnrollBatch(checkoutCategory.key);
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
    const detailToUse = selectedCategoryDetail || 
      categoriesMetadata.find(c => c.key === selectedCategory) || 
      categoriesMetadata[0];
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
    const filteredCategories = categoriesMetadata.filter(c => !c.isHidden);

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
            {filteredCategories.map((cat) => (
              <div 
                key={cat.key}
                onClick={() => {
                  setSelectedCategoryDetail(cat);
                  updateExamStep('category_detail', cat.key);
                }}
                className={`group rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
                  isDark 
                    ? 'bg-[#111317] border-white/[0.08] hover:border-white/20' 
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
                    {/* Left: Pricing */}
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

                    {/* Right: Details Link */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategoryDetail(cat);
                        updateExamStep('category_detail', cat.key);
                      }}
                      className={`text-xs sm:text-sm font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer py-1 px-1 transition-colors shrink-0 mb-0.5 ${
                        isDark ? 'text-white hover:text-gray-300' : 'text-[#dc2626] hover:text-red-700'
                      }`}
                    >
                      <span>বিস্তারিত</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ✓ এনরোল্ড
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
                        <Lock size={15} strokeWidth={1.8} className="shrink-0 text-gray-400 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
                      ) : (
                        <Play size={14} className="shrink-0 text-emerald-500 fill-current opacity-80" />
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
                              <Lock size={15} strokeWidth={1.8} className="shrink-0 text-gray-400 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
                            ) : (
                              <Play size={14} className="shrink-0 text-emerald-500 fill-current opacity-80" />
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
    const defaultDurMins = examData?.duration_minutes || selectedExamMeta?.durationMinutes || 40;
    const durMins = customDurationMins || defaultDurMins;

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

        <div className="relative z-10 w-full max-w-lg space-y-3 sm:space-y-3.5">
          
          {/* Top Center Pill Badge (Brand Color) */}
          <div className="flex justify-center">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              isDark 
                ? 'bg-[#e11438]/15 border-[#e11438]/30 text-[#ff4d6d]' 
                : 'bg-red-50 border-red-200 text-[#dc2626]'
            }`}>
              <BookOpen size={13} />
              <span>{examData?.categoryName || 'মেডিকেল বিগত বছরের প্রশ্ন (MAT)'}</span>
            </div>
          </div>

          {/* Exam Title */}
          <h1 className={`text-xl sm:text-2xl font-black text-center tracking-tight leading-snug ${
            isDark ? 'text-white' : 'text-[#111827]'
          }`}>
            {examData?.title || selectedExamMeta?.title}
          </h1>

          {examData?.subCategory && examData.subCategory !== 'General' && (
            <p className={`text-center text-xs -mt-1 font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              📂 {examData.subCategory}
            </p>
          )}

          {/* 2 Metric Cards: Questions & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`border rounded-2xl p-3 sm:p-3.5 flex flex-col items-center text-center transition-all ${
              isDark 
                ? 'bg-[#140306]/90 border-[#e11438]/25 shadow-[0_8px_25px_rgba(0,0,0,0.5)]' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <HelpCircle size={20} className="text-[#e11438] dark:text-[#ff4d6d] mb-0.5" />
              <p className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>মোট প্রশ্ন</p>
              <p className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>{qCount}</p>
            </div>

            <div className={`border rounded-2xl p-3 sm:p-3.5 flex flex-col items-center text-center transition-all relative ${
              isDark 
                ? 'bg-[#140306]/90 border-[#e11438]/25 shadow-[0_8px_25px_rgba(0,0,0,0.5)]' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <Clock size={20} className="text-emerald-500 dark:text-emerald-400 mb-0.5" />
              <p className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>সময়</p>
              <p className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                {durMins} <span className="text-xs font-normal">মি.</span>
              </p>
              <button
                type="button"
                onClick={() => setShowCustomDurationPicker(prev => !prev)}
                className="mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                title="ক্লিক করে এই পরীক্ষার সময় কাস্টমাইজ করুন"
              >
                <span>{customDurationMins ? '⏱️ কাস্টম সময়' : '⏱️ সময় কাস্টমাইজ'}</span>
                <ChevronDown size={11} className={`transition-transform ${showCustomDurationPicker ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Custom Duration Selector Dropdown */}
          {showCustomDurationPicker && (
            <div className={`p-3.5 rounded-2xl border animate-in fade-in zoom-in-95 space-y-2.5 ${
              isDark 
                ? 'bg-[#140306]/95 border-[#e11438]/30 shadow-lg' 
                : 'bg-emerald-50/70 border-emerald-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>
                  ⏱️ পরীক্ষার সময়কাল নির্বাচন করুন:
                </span>
                {customDurationMins && (
                  <button
                    type="button"
                    onClick={() => setCustomDurationMins(null)}
                    className="text-[10px] text-amber-500 font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    ডিফল্টে ফিরুন ({defaultDurMins}মি.)
                  </button>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {[10, 15, 20, 25, 30, 40, 50, 60].map((m) => {
                  const isSel = (durMins === m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCustomDurationMins(m)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSel
                          ? (isDark ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-sm font-black' : 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black')
                          : (isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10' : 'bg-white hover:bg-emerald-100/60 text-slate-700 border-emerald-200')
                      }`}
                    >
                      {m} মি.
                    </button>
                  );
                })}
              </div>

              {/* Stepper with custom input */}
              <div className="flex items-center justify-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setCustomDurationMins(Math.max(1, durMins - 5))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    isDark ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-700 border-gray-300'
                  }`}
                >
                  -5m
                </button>
                <button
                  type="button"
                  onClick={() => setCustomDurationMins(Math.max(1, durMins - 1))}
                  className={`px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    isDark ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-700 border-gray-300'
                  }`}
                >
                  -1m
                </button>

                <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white dark:bg-black/40 border border-gray-300 dark:border-white/20">
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={durMins}
                    onChange={(e) => setCustomDurationMins(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-12 text-center text-xs font-black bg-transparent outline-none text-emerald-600 dark:text-emerald-400 font-mono"
                  />
                  <span className="text-[10px] font-bold text-gray-400">মি.</span>
                </div>

                <button
                  type="button"
                  onClick={() => setCustomDurationMins(durMins + 1)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    isDark ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-700 border-gray-300'
                  }`}
                >
                  +1m
                </button>
                <button
                  type="button"
                  onClick={() => setCustomDurationMins(durMins + 5)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    isDark ? 'bg-white/10 text-white border-white/20' : 'bg-white text-slate-700 border-gray-300'
                  }`}
                >
                  +5m
                </button>
              </div>
            </div>
          )}

          {/* Negative Marking Toggle Card: Second Timer (-3 Marks) */}
          <div className={`border rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3.5 transition-all ${
            isDark 
              ? 'bg-[#140306]/90 border-[#e11438]/25 shadow-[0_8px_25px_rgba(0,0,0,0.5)]' 
              : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isSecondTimer 
                  ? (isDark ? 'bg-red-500/15 border border-red-500/30 text-red-400' : 'bg-red-50 border border-red-200 text-[#dc2626]')
                  : (isDark ? 'bg-white/5 border border-white/10 text-gray-400' : 'bg-gray-100 border border-gray-200 text-gray-500')
              }`}>
                <Zap size={18} className={isSecondTimer ? "fill-current" : ""} />
              </div>
              <div className="min-w-0">
                <h4 className={`text-xs sm:text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                  সেকেন্ড টাইমার অপশন
                </h4>
                <p className={`text-[11px] sm:text-xs mt-0.5 font-semibold transition-colors ${
                  isSecondTimer 
                    ? (isDark ? 'text-[#ff4d6d]' : 'text-[#dc2626]') 
                    : (isDark ? 'text-gray-400' : 'text-gray-500')
                }`}>
                  {isSecondTimer ? 'এক্সট্রা ৩ মার্ক কাটা যাবে' : 'ফার্স্ট টাইমার (কোনো এক্সট্রা মার্ক কাটা যাবে না)'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => setIsSecondTimer(!isSecondTimer)}
              aria-label="সেকেন্ড টাইমার টগল"
              className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors border-none shrink-0 ${
                isSecondTimer ? 'bg-[#dc2626]' : (isDark ? 'bg-white/15' : 'bg-gray-300')
              }`}
            >
              <div 
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                  isSecondTimer ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Button: Start Exam */}
          <button
            onClick={() => handleStartExam(examMode)}
            className="w-full py-3 px-6 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#b91c1c] hover:to-[#991b1b] text-white font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 hover:shadow-red-900/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border-none"
          >
            <span>🚀 পরীক্ষা শুরু করি</span>
          </button>

          {/* Back button */}
          <div className="text-center pt-0.5">
            <button 
              onClick={() => setStep('exam_list')}
              className={`text-xs font-semibold bg-transparent border-none cursor-pointer transition-colors ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              ← এক্সাম তালিকায় ফিরে যান
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
        <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 sm:px-8 py-3.5 shadow-lg transition-colors ${
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
                title="প্রশ্ন প্যালেট দেখুন"
              >
                <Grid size={15} className={isDark ? "text-gray-400" : "text-gray-500"} />
                <span>{answeredCount}/{questions.length}</span>
              </button>

              <span className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                examMode === 'practice' 
                  ? (isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                  : (isDark ? 'bg-[#e11438]/15 text-[#ff4d6d] border-[#e11438]/30' : 'bg-red-50 text-red-700 border-red-200')
              }`}>
                {examMode === 'practice' ? '⚡ প্র্যাকটিস মোড' : '⏱️ রিয়েল মোড'}
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
                  <span className="text-[11px]">সেকেন্ড</span>
                </div>
              </div>
            ) : (
              <div className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${
                isDark ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                <CheckCircle2 size={14} />
                <span>অনুশীলন চলছে • সঠিক উত্তর ও ব্যাখ্যা তাৎক্ষণিক দেখুন</span>
              </div>
            )}

            {/* Right: Submit Button */}
            <button
              onClick={() => setSubmitWarningModal(true)}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/30 transition-all cursor-pointer border-none"
            >
              <Send size={15} />
              <span>জমা দিন</span>
            </button>
          </div>
        </header>

        {/* Questions Body */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
          {questions.map((q, idx) => {
            const selectedOpt = userAnswers[q.id];
            const isFlagged = flaggedQuestions[q.id];
            const isRevealed = practiceRevealed[q.id] || examMode === 'practice' && selectedOpt !== undefined;
            const isCorrect = selectedOpt === q.correct_index;

            return (
              <div 
                key={q.id || idx}
                ref={el => questionRefs.current[idx] = el}
                className={`border rounded-2xl p-5 sm:p-6 shadow-md transition-all ${
                  isDark ? 'bg-[#140306]/90 shadow-[0_8px_25px_rgba(0,0,0,0.5)]' : 'bg-white shadow-sm'
                } ${
                  isFlagged 
                    ? (isDark ? 'border-amber-500/60 shadow-amber-950/20' : 'border-amber-400 ring-2 ring-amber-100') 
                    : (isDark ? 'border-[#e11438]/20 hover:border-[#e11438]/40' : 'border-gray-200 hover:border-gray-300')
                }`}
              >
                {/* Question Header: Number + Question Text + Flag Button */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3.5 flex-1">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#dc2626] to-[#b91c1c] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                      {idx + 1}
                    </span>
                    <h3 className={`text-base sm:text-lg font-bold leading-relaxed pt-0.5 ${
                      isDark ? 'text-white' : 'text-[#111827]'
                    }`}>
                      {q.question}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleToggleFlag(q.id)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      isFlagged 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' 
                        : (isDark ? 'bg-transparent text-gray-500 border-transparent hover:text-gray-300' : 'bg-transparent text-gray-400 border-transparent hover:text-gray-600')
                    }`}
                    title={isFlagged ? "চিহ্নিত প্রশ্ন" : "রিভিউয়ের জন্য চিহ্নিত করুন"}
                  >
                    <Bookmark size={18} fill={isFlagged ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className={`h-px my-4 ${isDark ? 'bg-[#e11438]/15' : 'bg-gray-100'}`} />

                {/* Options List */}
                <div className="space-y-3">
                  {q.options.map((optText, oIdx) => {
                    const isSelected = selectedOpt === oIdx;
                    const isOptionCorrect = oIdx === q.correct_index;

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
                        onClick={() => handleSelectOption(q.id, oIdx)}
                        className={`w-full text-left p-3 sm:p-3.5 rounded-xl border flex items-center gap-3.5 transition-all cursor-pointer ${optionStyle}`}
                      >
                        {/* Bengali Letter Bubble: ক, খ, গ, ঘ */}
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors border ${bubbleStyle}`}>
                          {BENGALI_LETTERS[oIdx] || oIdx + 1}
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
                {examMode === 'practice' && isRevealed && q.explanation && (
                  <div className={`mt-4 p-4 rounded-xl border text-xs sm:text-sm space-y-1.5 animate-fadeIn ${
                    isDark 
                      ? 'bg-[#1b050d] border-[#e11438]/25 text-gray-300' 
                      : 'bg-red-50/50 border-red-200 text-gray-700'
                  }`}>
                    <p className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-[#ff4d6d]' : 'text-[#dc2626]'}`}>
                      <Sparkles size={14} /> ব্যাখ্যা (Explanation):
                    </p>
                    <p className="leading-relaxed whitespace-pre-line">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Bottom Submit Banner */}
          <div className="pt-6 pb-12 flex justify-center">
            <button
              onClick={() => setSubmitWarningModal(true)}
              className="py-4 px-10 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold text-base rounded-2xl flex items-center gap-2.5 shadow-xl shadow-emerald-950/40 cursor-pointer border-none"
            >
              <Send size={18} />
              <span>পরীক্ষা জমা দিন ({answeredCount}/{questions.length})</span>
            </button>
          </div>
        </main>

        {/* Question Navigator Drawer / Modal */}
        {questionPaletteOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`border rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl transition-all ${
              isDark ? 'bg-[#140306] border-[#e11438]/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)]' : 'bg-white border-gray-200 shadow-2xl'
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b ${
                isDark ? 'border-[#e11438]/20' : 'border-gray-200'
              }`}>
                <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                  <Grid size={18} className="text-[#dc2626]" /> প্রশ্ন প্যালেট (Question Navigator)
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
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" /> উত্তর দেওয়া ({answeredCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block" /> বুকমার্ক ({Object.keys(flaggedQuestions).filter(k => flaggedQuestions[k]).length})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded border inline-block ${
                    isDark ? 'bg-[#1b050d] border-[#e11438]/20' : 'bg-gray-100 border-gray-300'
                  }`} /> বাকি ({questions.length - answeredCount})
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
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {submitWarningModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl transition-all ${
              isDark ? 'bg-[#140306] border-[#e11438]/25 shadow-[0_20px_60px_rgba(0,0,0,0.8)]' : 'bg-white border-gray-200 shadow-2xl'
            }`}>
              <div className="flex items-center gap-3 text-amber-400">
                <AlertTriangle size={26} />
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>পরীক্ষা জমা দিতে চান?</h3>
              </div>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                আপনি <strong>{questions.length}</strong> টির মধ্যে <strong>{answeredCount}</strong> টি প্রশ্নের উত্তর দিয়েছেন। 
                {questions.length - answeredCount > 0 && (
                  <span className="text-red-500 block mt-1 font-semibold">
                    (এখনও {questions.length - answeredCount}টি প্রশ্ন অনুত্তরিত রয়েছে)
                  </span>
                )}
              </p>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  onClick={() => setSubmitWarningModal(false)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
                    isDark ? 'bg-transparent border-white/15 text-gray-300 hover:bg-white/5' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ফিরে যাই
                </button>
                <button
                  onClick={() => {
                    setSubmitWarningModal(false);
                    calculateAndFinishExam();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white text-sm font-bold cursor-pointer border-none shadow-lg shadow-emerald-950/40"
                >
                  হ্যাঁ, জমা দিন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 5: RESULTS & COMPREHENSIVE SOLUTION REVIEW
  // -------------------------------------------------------------
  if (step === 'exam_result' && examResult) {
    const questions = examData?.questions || [];

    // Filtered questions based on solutionFilter: 'all' | 'wrong' | 'correct' | 'skipped'
    const reviewQuestions = questions.filter(q => {
      const selected = userAnswers[q.id];
      const isCorrect = selected === q.correct_index;
      if (solutionFilter === 'wrong') return selected !== undefined && !isCorrect;
      if (solutionFilter === 'correct') return isCorrect;
      if (solutionFilter === 'skipped') return selected === undefined;
      return true;
    });

    return (
      <div className={`min-h-screen p-4 sm:p-6 md:p-8 font-sans transition-colors duration-300 ${
        isDark ? 'bg-[#0d0205] text-white selection:bg-[#e11438] selection:text-white' : 'bg-[#f8f9fa] text-[#111827]'
      }`}>
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Result Summary Card */}
          <div className={`border rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden transition-all ${
            isDark 
              ? 'bg-[#140306]/90 border-[#e11438]/25 shadow-[0_16px_50px_rgba(0,0,0,0.7)]' 
              : 'bg-white border-gray-200 shadow-xl'
          }`}>
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              isDark ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-600'
            }`}>
              <Trophy size={32} />
            </div>

            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 border ${
                examResult.isPassed 
                  ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                  : (isDark ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-red-50 text-red-700 border-red-200')
              }`}>
                {examResult.isPassed ? '🎉 আপনি পরীক্ষায় উত্তীর্ণ হয়েছেন!' : '⚠️ আরও অনুশীলন প্রয়োজন'}
              </span>
              <h2 className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                পরীক্ষার ফলাফল
              </h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {examResult.title}
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className={`border p-4 rounded-2xl ${isDark ? 'bg-[#1b050d] border-[#e11438]/15' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>প্রাপ্ত স্কোর</p>
                <p className="text-2xl font-black text-[#dc2626] dark:text-[#ff4d6d]">
                  {examResult.finalScore} / {examResult.totalQuestions}
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{examResult.percentage}% নির্ভুলতা</p>
              </div>
              <div className={`border p-4 rounded-2xl ${isDark ? 'bg-[#1b050d] border-[#e11438]/15' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>সঠিক উত্তর</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {examResult.correct}
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>+{examResult.correct} নম্বর</p>
              </div>
              <div className={`border p-4 rounded-2xl ${isDark ? 'bg-[#1b050d] border-[#e11438]/15' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ভুল উত্তর</p>
                <p className="text-2xl font-black text-red-600 dark:text-red-400">
                  {examResult.wrong}
                </p>
                <p className="text-[11px] text-red-500 dark:text-red-400/80 mt-0.5">
                  -{examResult.wrongPenalty !== undefined ? examResult.wrongPenalty : (examResult.wrong * 0.25).toFixed(2)} নেগেটিভ
                </p>
              </div>
              <div className={`border p-4 rounded-2xl ${isDark ? 'bg-[#1b050d] border-[#e11438]/15' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>অনুত্তরিত (Skipped)</p>
                <p className={`text-2xl font-black ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {examResult.skipped}
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>কোনো নম্বর কাটা হয়নি</p>
              </div>
            </div>

            {/* Second Timer Penalty Banner if Applied */}
            {examResult.secondTimerPenalty > 0 && (
              <div className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-semibold ${
                isDark 
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-300' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <Zap size={15} className="text-amber-500 shrink-0" />
                <span>
                  সেকেন্ড টাইমার পেনাল্টি: মোট প্রাপ্ত স্কোর থেকে অতিরিক্ত <strong>-৩.০০ নম্বর</strong> কর্তন করা হয়েছে।
                </span>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleStartExam(examMode)}
                className="py-3 px-6 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#b91c1c] hover:to-[#991b1b] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer border-none shadow-md shadow-red-950/40 transition-all"
              >
                <RefreshCw size={15} />
                <span>আবার পরীক্ষা দিন</span>
              </button>
              <button
                onClick={() => setStep('exam_list')}
                className={`py-3 px-6 border text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                  isDark ? 'bg-[#1b050d] hover:bg-[#250712] border-[#e11438]/25 text-white' : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-800'
                }`}
              >
                <ArrowLeft size={15} />
                <span>এক্সাম হাবে ফিরে যান</span>
              </button>
            </div>
          </div>

          {/* Solution Sheet Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                  <CheckSquare size={20} className="text-emerald-500" /> সম্পূর্ণ উত্তরপত্র ও ব্যাখ্যা (Solution Review)
                </h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>প্রতিটি প্রশ্নের সঠিক উত্তর এবং বিস্তারিত ব্যাখ্যা নিচে দেওয়া হলো</p>
              </div>

              {/* Solution Filter Pills */}
              <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
                isDark ? 'bg-[#140306] border-[#e11438]/20' : 'bg-gray-100 border-gray-200'
              }`}>
                <button
                  onClick={() => setSolutionFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                    solutionFilter === 'all' 
                      ? 'bg-[#dc2626] text-white shadow-sm' 
                      : (isDark ? 'text-gray-400 hover:text-white bg-transparent' : 'text-gray-600 hover:text-gray-900 bg-transparent')
                  }`}
                >
                  সব ({questions.length})
                </button>
                <button
                  onClick={() => setSolutionFilter('wrong')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                    solutionFilter === 'wrong' 
                      ? 'bg-red-600 text-white shadow-sm' 
                      : (isDark ? 'text-gray-400 hover:text-white bg-transparent' : 'text-gray-600 hover:text-gray-900 bg-transparent')
                  }`}
                >
                  ভুল ({examResult.wrong})
                </button>
                <button
                  onClick={() => setSolutionFilter('correct')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                    solutionFilter === 'correct' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : (isDark ? 'text-gray-400 hover:text-white bg-transparent' : 'text-gray-600 hover:text-gray-900 bg-transparent')
                  }`}
                >
                  সঠিক ({examResult.correct})
                </button>
                <button
                  onClick={() => setSolutionFilter('skipped')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                    solutionFilter === 'skipped' 
                      ? (isDark ? 'bg-white/20 text-white' : 'bg-gray-600 text-white shadow-sm') 
                      : (isDark ? 'text-gray-400 hover:text-white bg-transparent' : 'text-gray-600 hover:text-gray-900 bg-transparent')
                  }`}
                >
                  অনুত্তরিত ({examResult.skipped})
                </button>
              </div>
            </div>

            {/* Questions List */}
            {reviewQuestions.map((q, idx) => {
              const selectedOpt = userAnswers[q.id];
              const isCorrect = selectedOpt === q.correct_index;
              const isSkipped = selectedOpt === undefined;

              return (
                <div 
                  key={q.id || idx}
                  className={`border rounded-2xl p-5 sm:p-6 shadow-md space-y-4 transition-all ${
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
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-[#dc2626] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {q.question_no || idx + 1}
                      </span>
                      <span className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>{q.question}</span>
                    </span>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                      isSkipped 
                        ? (isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600') 
                        : isCorrect 
                        ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') 
                        : (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
                    }`}>
                      {isSkipped ? 'অনুত্তরিত' : isCorrect ? 'সঠিক (+১)' : 'ভুল (-০.২৫)'}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2 pt-1">
                    {q.options.map((optText, oIdx) => {
                      const isOptionCorrect = oIdx === q.correct_index;
                      const isUserSelected = selectedOpt === oIdx;

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
                              {BENGALI_LETTERS[oIdx] || oIdx + 1}
                            </span>
                            <span>{optText}</span>
                          </div>

                          {isOptionCorrect && (
                            <span className="text-xs text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                              <Check size={14} /> সঠিক উত্তর
                            </span>
                          )}
                          {isUserSelected && !isCorrect && (
                            <span className="text-xs text-red-500 dark:text-red-400 font-bold flex items-center gap-1 shrink-0">
                              <X size={14} /> আপনার উত্তর
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation */}
                  {q.explanation && (
                    <div className={`p-3.5 rounded-xl border text-xs sm:text-sm space-y-1 ${
                      isDark ? 'bg-[#1b050d] border-[#e11438]/20 text-gray-300' : 'bg-red-50/50 border-red-100 text-gray-700'
                    }`}>
                      <p className={`font-bold flex items-center gap-1 ${isDark ? 'text-[#ff4d6d]' : 'text-[#dc2626]'}`}>
                        <Sparkles size={14} /> বিস্তারিত ব্যাখ্যা:
                      </p>
                      <p className="leading-relaxed whitespace-pre-line">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Safe ultimate fallback: If step is invalid or unknown, render category cards view so screen is never blank
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
          {categoriesMetadata.filter(c => !c.isHidden).map((cat) => (
            <div 
              key={cat.key}
              onClick={() => {
                setSelectedCategoryDetail(cat);
                updateExamStep('category_detail', cat.key);
              }}
              className={`group rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
                isDark 
                  ? 'bg-[#111317] border-white/[0.08] hover:border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.5)]' 
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
