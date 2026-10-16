import React, { useState, useEffect, useMemo, useCallback, useDeferredValue, useRef } from 'react';
import { 
  LayoutDashboard, 
  Menu,
  Moon,
  Globe,
  LayoutGrid, 
  BookOpen, 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  DollarSign, 
  Check, 
  ArrowLeft,
  Sliders,
  GraduationCap,
  Video,
  PieChart,
  Download,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Type,
  HelpCircle,
  Image as ImageIcon,
  Upload,
  Camera,
  X,
  FolderOpen,
  Calendar as CalendarIcon,
  Bell,
  Clock,
  Users,
  Activity,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Filter,
  Layers,
  Settings as SettingsIcon,
  Edit2,
  Play,
  ShoppingCart,
  Eye,
  Link2,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Copy,
  Phone,
  MessageCircle,
  Mail,
  Zap,
  LogOut,
  Trophy,
  Award,
  Medal,
  RefreshCw,
  FileSpreadsheet,
  Flame,
  BarChart3
} from 'lucide-react';
import { 
  fetchAllSubmissions, 
  deleteQuizSubmission, 
  fetchLessonLeaderboard, 
  fetchCourseLeaderboard 
} from '../services/quizService';
import { collection, getDocs, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { initialData, isZenithCopiedCourse } from '../data/mockData';
import { masterEnglishCourseData } from '../data/masterEnglishCourseData';
import CourseStudioPage from './CourseStudioPage';
import BundleStudioPage from './BundleStudioPage';
import { EXAM_CATEGORIES_METADATA } from '../data/examCategoriesData';
import { grantCourseAccess, revokeCourseAccess, getCanonicalCourses, isPhoneMatch } from '../utils/enrollmentService';
import CourseSearchSelect from './CourseSearchSelect';
import { approveOrder } from '../services/orderService';
import { 
  getBunnyConfig, 
  saveBunnyConfig, 
  isBunnyStreamConfigured, 
  isBunnyStorageConfigured,
  testBunnyStreamConnection,
  testBunnyStorageConnection
} from '../services/bunnyService';
import { saveCloudData } from '../services/firestoreSyncService';
import { uploadImageFile, processHighQualityImage } from '../services/cloudStorageService';
import { isSupabaseConfigured } from '../supabase/config';
import { 
  fetchSupabaseOrders, 
  subscribeToSupabaseOrders, 
  fetchSupabaseUsers, 
  subscribeToSupabaseUsers,
  deleteSupabaseUser,
  deleteSupabaseOrder,
  updateSupabaseOrderAmount,
  updateSupabaseOrderStatus,
  saveSupabaseUser,
  saveSupabaseOrder,
  saveSupabaseSiteData
} from '../services/supabaseService';

// Permanent Tombstones & Amount Overrides Persistence Helpers
export const getDeletedIdsSet = () => {
  try {
    const o = JSON.parse(localStorage.getItem('eh_deleted_orders') || '[]');
    const t = JSON.parse(localStorage.getItem('eh_deleted_transactions') || '[]');
    const set = new Set([...(Array.isArray(o) ? o : []), ...(Array.isArray(t) ? t : [])]);
    Array.from(set).forEach(id => {
      if (typeof id === 'string') {
        set.add(id.replace(/^(TRX-|st-)/, ''));
      }
    });
    return set;
  } catch {
    return new Set();
  }
};

export const getAmountOverridesMap = () => {
  try {
    return JSON.parse(localStorage.getItem('eh_trx_amount_overrides') || '{}');
  } catch {
    return {};
  }
};

export const isDeletedItem = (item, deletedIds) => {
  if (!item) return false;
  const dSet = deletedIds || getDeletedIdsSet();
  if (dSet.size === 0) return false;
  const k1 = item.id;
  const k2 = item.orderId;
  const k3 = item.trxId;
  const k4 = item.invoiceNumber;
  const s1 = typeof item.id === 'string' ? item.id.replace(/^(TRX-|st-)/, '') : null;
  const s2 = typeof item.orderId === 'string' ? item.orderId.replace(/^(TRX-|st-)/, '') : null;
  return [k1, k2, k3, k4, s1, s2].filter(Boolean).some(id => dSet.has(id) || dSet.has(String(id)));
};

export const applyAmountOverride = (tx, overrides) => {
  if (!tx) return tx;
  const oMap = overrides || getAmountOverridesMap();
  const cleanId = typeof tx.id === 'string' ? tx.id.replace(/^(TRX-|st-)/, '') : '';
  const cleanOrderId = typeof tx.orderId === 'string' ? tx.orderId.replace(/^(TRX-|st-)/, '') : '';
  const overrideVal = oMap[tx.id] ?? oMap[tx.orderId] ?? oMap[tx.trxId] ?? oMap[tx.invoiceNumber] ?? oMap[cleanId] ?? oMap[cleanOrderId];
  if (overrideVal !== undefined && !isNaN(Number(overrideVal))) {
    return { ...tx, amount: Number(overrideVal) };
  }
  return tx;
};

// File-scoped pure mappers so state initializers, listeners, and heartbeats can convert order docs reliably
export const mapOrderDocToTx = (docId, order) => {
  if (!order) return null;
  const t = order.transaction || {};
  const isPaid = order.status === 'PAID' || order.status === 'COMPLETED' || Boolean(order.isApproved) || (t.status || '').toLowerCase() === 'completed';
  const isRejected = order.status === 'REJECTED' || (t.status || '').toLowerCase() === 'rejected';
  const status = isPaid ? 'Completed' : (isRejected ? 'Rejected' : 'Pending');

  const baseTx = {
    id: t.id || `TRX-${docId}`,
    orderId: docId,
    invoiceNumber: order.invoiceNumber || t.invoiceNumber || 'INV-EH',
    type: 'INCOME',
    category: t.category || (order.type === 'store' ? 'Store Product' : (order.targetType === 'exam' ? 'Exam Batch Enrollment' : 'Course Enrollment')),
    itemTitle: t.itemTitle || order.course?.name || order.items?.[0]?.title || 'Course Access',
    amount: Number(t.amount !== undefined ? t.amount : (order.totalPaid || 0)),
    method: t.method || (order.paymentMethodName?.toLowerCase().includes('nagad') ? 'Nagad' : (order.paymentMethodName?.toLowerCase().includes('card') ? 'Card' : 'bKash')),
    trxId: t.trxId || order.transactionId || 'PENDING',
    studentName: t.studentName || order.customer?.name || 'Online Student',
    studentPhone: t.studentPhone || order.customer?.phone || 'N/A',
    studentEmail: t.studentEmail || order.customer?.email || '',
    date: t.date || (order.createdAt ? order.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    createdAt: t.createdAt || order.createdAt || new Date().toISOString(),
    status: status,
    notes: t.notes || (order.paymentMethodName ? `Paid via ${order.paymentMethodName}` : 'Submitted via Web Checkout')
  };
  return applyAmountOverride(baseTx);
};

export const mapOrderDocToStudent = (docId, order) => {
  if (!order) return null;
  const s = order.student || {};
  const t = order.transaction || {};
  const isPaid = order.status === 'PAID' || order.status === 'COMPLETED' || Boolean(order.isApproved) || (t.status || '').toLowerCase() === 'completed';
  const baseStudent = {
    id: s.id || `st-${docId}`,
    orderId: docId,
    name: s.name || order.customer?.name || t.studentName || 'Online Student',
    phone: s.phone || order.customer?.phone || t.studentPhone || 'N/A',
    email: s.email || order.customer?.email || t.studentEmail || '',
    batch: s.batch || 'HSC 26',
    courseName: s.courseName || order.course?.name || order.items?.[0]?.title || 'Course Access',
    status: isPaid ? 'Active' : 'Pending',
    joinedDate: s.joinedDate || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently'),
    amount: Number(s.amount !== undefined ? s.amount : (order.totalPaid || 0)),
    trxId: s.trxId || order.transactionId || t.trxId || 'PENDING',
    paymentMethod: s.paymentMethod || t.method || (order.paymentMethodName?.toLowerCase().includes('nagad') ? 'Nagad' : 'bKash')
  };
  const oMap = getAmountOverridesMap();
  const cleanId = typeof baseStudent.id === 'string' ? baseStudent.id.replace(/^(TRX-|st-)/, '') : '';
  const overrideVal = oMap[baseStudent.id] ?? oMap[baseStudent.orderId] ?? oMap[baseStudent.trxId] ?? oMap[cleanId];
  if (overrideVal !== undefined && !isNaN(Number(overrideVal))) {
    baseStudent.amount = Number(overrideVal);
  }
  return baseStudent;
};

// Pure helper: Deduplicate transactions so approved students never have duplicate pending records & deleted transactions NEVER resurrect
export const deduplicateTransactions = (txList) => {
  if (!Array.isArray(txList)) return [];
  const deletedIds = getDeletedIdsSet();
  const overrides = getAmountOverridesMap();

  // 1. Identify all completed/approved transactions (ignoring deleted)
  const approvedKeys = new Set();
  txList.forEach(t => {
    if (!t || isDeletedItem(t, deletedIds)) return;
    const s = (t.status || '').toLowerCase();
    const isApproved = s === 'completed' || s === 'paid' || Boolean(t.isApproved);
    if (isApproved) {
      const p = (t.studentPhone || '').replace(/[^0-9]/g, '');
      const e = (t.studentEmail || '').trim().toLowerCase();
      const c = (t.itemTitle || t.category || '').trim().toLowerCase();
      if (p && c) approvedKeys.add(`${p}_${c}`);
      if (e && c) approvedKeys.add(`${e}_${c}`);
      if (p) approvedKeys.add(p);
      if (e) approvedKeys.add(e);
    }
  });

  // 2. Filter transactions: keep all completed/paid/rejected (unless deleted).
  // If pending, discard if student already has an approved transaction for the course.
  // Also keep only the most recent pending attempt for the same student + course.
  const seenPendingKeys = new Set();
  const result = [];

  for (let t of txList) {
    if (!t || isDeletedItem(t, deletedIds)) continue;
    t = applyAmountOverride(t, overrides);

    const s = (t.status || '').toLowerCase();
    const isCompleted = s === 'completed' || s === 'paid' || Boolean(t.isApproved);

    if (isCompleted || s === 'rejected') {
      result.push(t);
      continue;
    }

    // It's a pending transaction:
    const p = (t.studentPhone || '').replace(/[^0-9]/g, '');
    const e = (t.studentEmail || '').trim().toLowerCase();
    const c = (t.itemTitle || t.category || '').trim().toLowerCase();

    const hasApproved = (p && c && approvedKeys.has(`${p}_${c}`)) ||
                        (e && c && approvedKeys.has(`${e}_${c}`)) ||
                        (p && approvedKeys.has(p) && !c);
    if (hasApproved) {
      // Discard duplicate pending because student has already been approved!
      continue;
    }

    const pendingKey = p && c ? `${p}_${c}` : (e && c ? `${e}_${c}` : (p || e || t.id));
    if (seenPendingKeys.has(pendingKey)) {
      continue;
    }
    seenPendingKeys.add(pendingKey);
    result.push(t);
  }

  return result;
};

// Pure helper: Deduplicate users without EVER losing any enrolled course access (Union of courses)
export const deduplicateUsers = (userList) => {
  if (!Array.isArray(userList)) return [];
  const mergedMap = new Map();

  userList.forEach(u => {
    if (!u) return;
    const emailKey = (u.email || '').trim().toLowerCase();
    const phoneKey = (u.phone || u.whatsapp || '').replace(/[^0-9]/g, '');

    const isRealEmail = emailKey && !emailKey.includes('@eduhunters.com') && emailKey.includes('@');
    const primaryKey = isRealEmail ? `email:${emailKey}` : (phoneKey && phoneKey.length >= 8 ? `phone:${phoneKey}` : `id:${u.id || u.uid}`);

    let existing = mergedMap.get(primaryKey);
    if (!existing && phoneKey && phoneKey.length >= 8) {
      existing = mergedMap.get(`phone:${phoneKey}`);
    }
    if (!existing && isRealEmail) {
      existing = mergedMap.get(`email:${emailKey}`);
    }

    if (existing) {
      // 100% GUARANTEE: UNION OF ENROLLED COURSES SO ACCESS IS NEVER LOST
      const allCourses = Array.from(new Set([
        ...(Array.isArray(existing.enrolledCourses) ? existing.enrolledCourses : []),
        ...(Array.isArray(u.enrolledCourses) ? u.enrolledCourses : [])
      ]));

      const mergedUser = {
        ...existing,
        ...u,
        id: existing.id || u.id,
        name: existing.name && existing.name !== 'Student' && existing.name !== 'Online Student' ? existing.name : (u.name || existing.name),
        email: existing.email || u.email,
        phone: existing.phone || u.phone || existing.whatsapp || u.whatsapp,
        whatsapp: existing.whatsapp || u.whatsapp || existing.phone || u.phone,
        college: existing.college || u.college || existing.institution || u.institution,
        institution: existing.institution || u.institution || existing.college || u.college,
        role: (existing.role === 'Admin' || u.role === 'Admin') ? 'Admin' : (existing.role || u.role || 'Student'),
        status: (existing.status === 'Active' || u.status === 'Active') ? 'Active' : (existing.status || u.status || 'Active'),
        batch: existing.batch || u.batch || existing.hscBatch || u.hscBatch || 'HSC 26',
        hscBatch: existing.hscBatch || u.hscBatch || existing.batch || u.batch || 'HSC 26',
        enrolledCourses: allCourses,
        totalSpent: Math.max(Number(existing.totalSpent) || 0, Number(u.totalSpent) || 0)
      };

      mergedMap.set(primaryKey, mergedUser);
      if (phoneKey && phoneKey.length >= 8) mergedMap.set(`phone:${phoneKey}`, mergedUser);
      if (isRealEmail) mergedMap.set(`email:${emailKey}`, mergedUser);
    } else {
      const newUser = {
        ...u,
        enrolledCourses: Array.isArray(u.enrolledCourses) ? [...u.enrolledCourses] : []
      };
      mergedMap.set(primaryKey, newUser);
      if (phoneKey && phoneKey.length >= 8) mergedMap.set(`phone:${phoneKey}`, newUser);
      if (isRealEmail) mergedMap.set(`email:${emailKey}`, newUser);
    }
  });

  const unique = new Map();
  mergedMap.forEach(u => {
    const k = (u.email || u.id || u.uid || '').toLowerCase();
    if (k && !unique.has(k)) {
      unique.set(k, u);
    }
  });

  return Array.from(unique.values());
};

// Minimal time formatter for podium and leaderboards (matching user website)
const formatMinimalTime = (totalSeconds) => {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
};

// Points TokenPill matching clean enterprise dashboard style
const AdminTokenPill = ({ points, size = 'sm', variant = 'gold' }) => {
  const isLarge = size === 'lg';
  const formatted = points === undefined || points === null || points === '--' 
    ? '--' 
    : (Number.isInteger(Number(points)) ? Number(points) : +(Number(points).toFixed(2)));
  
  const getBadgeStyle = () => {
    if (variant === 'gold') return 'bg-amber-50 text-amber-800 border-amber-300';
    if (variant === 'silver') return 'bg-slate-100 text-slate-800 border-slate-300';
    if (variant === 'bronze') return 'bg-orange-50 text-orange-900 border-orange-300';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <div className={`inline-flex items-center justify-center rounded-full font-mono font-bold select-none border shadow-xs ${getBadgeStyle()} ${
      isLarge ? 'px-3 py-0.5 text-xs' : 'px-2.5 py-0.5 text-[11px]'
    }`}>
      <span className="tracking-tight">{formatted} pts</span>
    </div>
  );
};

export default function AdminPanel({ data, onUpdateData, onResetData, onExitAdmin, adminUser, onLogoutAdmin }) {
  // Navigation Tabs: overview, accounting, slides, stats, courses, instructors, videos, store, settings
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get('tab');
      if (tabParam) return tabParam;
    } catch {}
    return 'overview';
  });

  const setActiveTab = (newTab) => {
    setActiveTabState(newTab);
    try {
      const sp = new URLSearchParams(window.location.search);
      sp.set('tab', newTab);
      window.history.replaceState(null, '', `?${sp.toString()}`);
    } catch {}
  };
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Bulletproof state initialization - NEVER empty or undefined
  const [siteSettings, setSiteSettings] = useState(() => ({
    ...initialData.siteSettings,
    ...(data?.siteSettings || {})
  }));

  const [announcement, setAnnouncement] = useState(() => 
    data?.announcement !== undefined ? data.announcement : initialData.announcement
  );

  const [heroSlides, setHeroSlides] = useState(() => 
    Array.isArray(data?.heroSlides) 
      ? data.heroSlides 
      : initialData.heroSlides
  );

  const [homeStats, setHomeStats] = useState(() => {
    const raw = Array.isArray(data?.homeStats) ? data.homeStats : initialData.homeStats;
    if (raw.some(s => s.value === '3000+' || s.value === '70000+')) return initialData.homeStats;
    return raw;
  });

  const [courses, setCourses] = useState(() => {
    const raw = Array.isArray(data?.courses) 
      ? data.courses 
      : initialData.courses;
    return raw.filter(c => !isZenithCopiedCourse(c));
  });

  useEffect(() => {
    if (Array.isArray(data?.courses) && data.courses.length > 0) {
      setCourses(data.courses.filter(c => !isZenithCopiedCourse(c)));
    }
  }, [data?.courses]);

  useEffect(() => {
    if (data?.siteSettings) setSiteSettings(data.siteSettings);
  }, [data?.siteSettings]);

  useEffect(() => {
    if (data?.sectionTexts) setSectionTexts(data.sectionTexts);
  }, [data?.sectionTexts]);

  useEffect(() => {
    if (data?.announcement !== undefined) setAnnouncement(data.announcement);
  }, [data?.announcement]);

  useEffect(() => {
    if (Array.isArray(data?.heroSlides) && data.heroSlides.length > 0) setHeroSlides(data.heroSlides);
  }, [data?.heroSlides]);

  useEffect(() => {
    if (Array.isArray(data?.bundles) && data.bundles.length > 0) setBundles(data.bundles);
  }, [data?.bundles]);

  useEffect(() => {
    if (Array.isArray(data?.instructors) && data.instructors.length > 0) setInstructors(data.instructors);
  }, [data?.instructors]);

  useEffect(() => {
    if (Array.isArray(data?.whyChooseUs) && data.whyChooseUs.length > 0) setWhyChooseUs(data.whyChooseUs);
  }, [data?.whyChooseUs]);

  const [categories, setCategories] = useState(() => {
    const raw = Array.isArray(data?.categories) 
      ? data.categories 
      : (initialData.categories || [
          "সকল",
          "EXAM BATCH",
          "Medical"
        ]);
    return raw
      .filter(c => !["HSC 25", "Engineering", "HSC 27", "HSC 28", "HSC 26", "Free", "free"].includes(c) && (c || '').toLowerCase() !== 'free')
      .map(c => c === "University A Unit" ? "Medical" : c);
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryIdx, setEditingCategoryIdx] = useState(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [adminCourseCategoryFilter, setAdminCourseCategoryFilter] = useState('All');
  const isAllCat = (cat) => !cat || cat === 'All' || cat === 'সকল';

  const courseMatchesCategory = (course, cat) => {
    if (isAllCat(cat)) return true;
    const target = (cat || '').trim().toLowerCase();
    const courseCat = (course.category || '').trim().toLowerCase();
    
    if (target === 'exam batch' || target === 'exam_batch') {
      return courseCat === 'exam batch' || Boolean(course.isExamBatch);
    }
    if (target === 'medical') {
      return (
        courseCat === 'medical' ||
        course.filterGroup === 'medical' ||
        (course.title || '').includes('মেডিকেল') ||
        (course.description || '').includes('মেডিকেল') ||
        (course.badge || '').includes('মেডিকেল')
      );
    }
    if (target === 'free') {
      return courseCat === 'free' || Boolean(course.isFree) || Number(course.salePrice) === 0;
    }
    return courseCat === target || course.category === cat;
  };
  const [categoryViewTab, setCategoryViewTab] = useState('preview'); // 'preview' | 'manage'
  // Clean & Minimal Courses Management States
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseViewMode, setCourseViewMode] = useState('grid'); // 'grid' | 'table'
  const [editingCourseData, setEditingCourseData] = useState(null); // { index, title, category, salePrice, regularPrice, isBundle, image }
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);

  // Dedicated Multi-Course Combo Bundles States
  const [bundles, setBundles] = useState(() => 
    Array.isArray(data?.bundles)
      ? data.bundles
      : (initialData.bundles || [])
  );
  const [bundleSearchQuery, setBundleSearchQuery] = useState('');
  const [bundleStatusFilter, setBundleStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DRAFT'
  const [bundleViewMode, setBundleViewMode] = useState('grid'); // 'grid' | 'table'
  const [activeStudioBundle, setActiveStudioBundle] = useState(null);


  const [instructors, setInstructors] = useState(() => 
    Array.isArray(data?.instructors)
      ? data.instructors 
      : []
  );

  const [freeVideos, setFreeVideos] = useState(() => 
    Array.isArray(data?.freeVideos)
      ? data.freeVideos 
      : initialData.freeVideos
  );

  const [storeProducts, setStoreProducts] = useState(() => 
    Array.isArray(data?.storeProducts)
      ? data.storeProducts 
      : initialData.storeProducts
  );

  // =========================================================================
  // DEDICATED EXAM RESULTS & LIVE LEADERBOARD MANAGEMENT (USER WEBSITE STYLING)
  // =========================================================================
  const [examSubmissions, setExamSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [examSubmissionsSearch, setExamSubmissionsSearch] = useState('');
  const [selectedExamCourseFilter, setSelectedExamCourseFilter] = useState('ALL');
  const [selectedExamFilter, setSelectedExamFilter] = useState('ALL');
  const [examAttemptFilter, setExamAttemptFilter] = useState('ALL'); // 'ALL' | 'OFFICIAL' | 'RETAKE'
  const [examViewMode, setExamViewMode] = useState('leaderboard'); // 'leaderboard' | 'gradebook' | 'submissions'
  const [leaderboardCourseId, setLeaderboardCourseId] = useState('ALL');
  const [leaderboardLessonId, setLeaderboardLessonId] = useState('');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState(null);
  const [submissionsLastRefreshed, setSubmissionsLastRefreshed] = useState(null);
  const [inspectingSubmission, setInspectingSubmission] = useState(null);
  const [gradebookSearchQuery, setGradebookSearchQuery] = useState('');
  const [selectedGradebookStudentKey, setSelectedGradebookStudentKey] = useState(null);

  const loadExamSubmissions = useCallback(async () => {
    setIsLoadingSubmissions(true);
    try {
      const subs = await fetchAllSubmissions();
      // Sort newest first
      subs.sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
      setExamSubmissions(subs);
      setSubmissionsLastRefreshed(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('Error fetching exam submissions:', e);
    } finally {
      setIsLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => {
    loadExamSubmissions();
  }, [loadExamSubmissions]);

  // Default leaderboard course selection to first course
  useEffect(() => {
    if ((!leaderboardCourseId || leaderboardCourseId === 'ALL') && courses && courses.length > 0) {
      setLeaderboardCourseId(String(courses[0].id || courses[0].slug));
    }
  }, [courses, leaderboardCourseId]);

  // Currently selected course object for leaderboard
  const currentLeaderboardCourse = useMemo(() => {
    if (!courses || courses.length === 0) return null;
    return courses.find(c => 
      String(c.id).toLowerCase() === String(leaderboardCourseId).toLowerCase() ||
      String(c.slug || '').toLowerCase() === String(leaderboardCourseId).toLowerCase()
    ) || courses[0];
  }, [courses, leaderboardCourseId]);

  // Extract all lessons and exams for the selected course
  const currentCourseLessons = useMemo(() => {
    if (!currentLeaderboardCourse) return [];
    const list = [];
    if (currentLeaderboardCourse.curriculum && Array.isArray(currentLeaderboardCourse.curriculum)) {
      currentLeaderboardCourse.curriculum.forEach((sec, sIdx) => {
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
                lessonId: String(les.id || `les-${sIdx}-${cIdx}-${lIdx}`),
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
              const fullTitle = les.title || `Class ${lIdx + 1}`;
              list.push({
                lessonId: String(les.id || `les-${sIdx}-${lIdx}`),
                title: fullTitle,
                shortTitle: fullTitle,
                chapterName: sec.title || `Section ${sIdx + 1}`,
                quiz: les.quiz || null
              });
            }
          });
        }
      });
    }

    // Also include any lessons from submissions for this course that might not be in mock curriculum
    examSubmissions.forEach(sub => {
      const matchC = String(sub.course_id || '').toLowerCase() === String(currentLeaderboardCourse.id || '').toLowerCase() ||
                     String(sub.course_slug || '').toLowerCase() === String(currentLeaderboardCourse.id || '').toLowerCase() ||
                     String(sub.course_name || '').toLowerCase() === String(currentLeaderboardCourse.title || '').toLowerCase();
      if (matchC && sub.lesson_id && !list.some(l => String(l.lessonId) === String(sub.lesson_id))) {
        list.push({
          lessonId: String(sub.lesson_id),
          title: sub.lesson_title || `Exam #${sub.lesson_id}`,
          shortTitle: sub.lesson_title || `Exam #${sub.lesson_id}`,
          chapterName: 'Exam',
          quiz: null
        });
      }
    });

    return list;
  }, [currentLeaderboardCourse, examSubmissions]);

  // Derived course options from submissions and courses
  const submissionCourseOptions = useMemo(() => {
    const map = new Map();
    (courses || []).forEach(c => {
      if (c?.id) map.set(String(c.id).toLowerCase(), c.title || c.name || c.id);
      if (c?.slug) map.set(String(c.slug).toLowerCase(), c.title || c.name || c.slug);
    });
    examSubmissions.forEach(s => {
      const cId = String(s.course_id || s.course_slug || '').toLowerCase();
      if (cId && !map.has(cId)) {
        map.set(cId, s.course_name || s.course_id);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [courses, examSubmissions]);

  // Derived exam/lesson options
  const submissionExamOptions = useMemo(() => {
    const map = new Map();
    examSubmissions.forEach(s => {
      const matchCourse = selectedExamCourseFilter === 'ALL' || 
        String(s.course_id || '').toLowerCase() === selectedExamCourseFilter.toLowerCase() ||
        String(s.course_slug || '').toLowerCase() === selectedExamCourseFilter.toLowerCase() ||
        String(s.course_name || '').toLowerCase().includes(selectedExamCourseFilter.toLowerCase());
      if (matchCourse && s.lesson_id) {
        map.set(String(s.lesson_id), s.lesson_title || `Exam #${s.lesson_id}`);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [examSubmissions, selectedExamCourseFilter]);

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return examSubmissions.filter(s => {
      if (selectedExamCourseFilter !== 'ALL') {
        const cMatch = String(s.course_id || '').toLowerCase() === selectedExamCourseFilter.toLowerCase() ||
          String(s.course_slug || '').toLowerCase() === selectedExamCourseFilter.toLowerCase() ||
          String(s.course_name || '').toLowerCase().includes(selectedExamCourseFilter.toLowerCase());
        if (!cMatch) return false;
      }
      if (selectedExamFilter !== 'ALL') {
        if (String(s.lesson_id) !== String(selectedExamFilter)) return false;
      }
      if (examAttemptFilter === 'OFFICIAL' && s.is_first_attempt === false) return false;
      if (examAttemptFilter === 'RETAKE' && s.is_first_attempt !== false && (!s.attempt_number || s.attempt_number <= 1)) return false;

      if (examSubmissionsSearch.trim()) {
        const q = examSubmissionsSearch.toLowerCase();
        const nameMatch = (s.student_name || '').toLowerCase().includes(q);
        const phoneMatch = (s.student_phone || '').includes(q);
        const emailMatch = (s.student_email || '').toLowerCase().includes(q);
        const examMatch = (s.lesson_title || '').toLowerCase().includes(q);
        const courseMatch = (s.course_name || '').toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch || examMatch || courseMatch;
      }
      return true;
    });
  }, [examSubmissions, selectedExamCourseFilter, selectedExamFilter, examAttemptFilter, examSubmissionsSearch]);

  // Metrics summary
  const examStats = useMemo(() => {
    const totalSubs = examSubmissions.length;
    const uniqueStudents = new Set();
    let totalScoreSum = 0;
    let totalPossibleSum = 0;
    let maxScoreItem = null;

    examSubmissions.forEach(s => {
      const stdKey = s.student_phone || s.student_email || s.student_id;
      if (stdKey) uniqueStudents.add(stdKey);
      const score = Number(s.score || 0);
      const possible = Number(s.total_marks || 0);
      totalScoreSum += score;
      totalPossibleSum += possible;

      if (!maxScoreItem || score > Number(maxScoreItem.score || 0)) {
        maxScoreItem = s;
      }
    });

    const avgPct = totalPossibleSum > 0 ? Math.round((totalScoreSum / totalPossibleSum) * 100) : 0;
    return {
      totalSubs,
      uniqueExaminees: uniqueStudents.size,
      avgPct,
      topScorer: maxScoreItem
    };
  }, [examSubmissions]);

  // Load leaderboard when in leaderboard view or filters change
  useEffect(() => {
    let isMounted = true;
    const loadBoard = async () => {
      setIsLoadingLeaderboard(true);
      try {
        let board = [];
        if (leaderboardLessonId && leaderboardLessonId !== 'ALL' && leaderboardLessonId !== 'overall') {
          board = await fetchLessonLeaderboard(leaderboardCourseId !== 'ALL' ? leaderboardCourseId : null, leaderboardLessonId);
        } else {
          board = await fetchCourseLeaderboard(leaderboardCourseId !== 'ALL' ? leaderboardCourseId : null);
        }
        if (isMounted) setLeaderboardData(board);
      } catch (err) {
        console.warn('Leaderboard fetch error in Admin:', err);
      } finally {
        if (isMounted) setIsLoadingLeaderboard(false);
      }
    };
    if (activeTab === 'results') {
      loadBoard();
    }
    return () => { isMounted = false; };
  }, [activeTab, leaderboardCourseId, leaderboardLessonId, examSubmissions]);

  // Group submissions by student for Student Gradebook
  const studentGradebookList = useMemo(() => {
    const studentMap = new Map();
    examSubmissions.forEach(sub => {
      const sPhone = (sub.student_phone || '').replace(/[^0-9]/g, '');
      const sEmail = (sub.student_email || '').trim().toLowerCase();
      const sId = sub.student_id || '';
      const key = sPhone && sPhone.length >= 8 
        ? `phone_${sPhone.slice(-10)}` 
        : (sEmail ? `email_${sEmail}` : `id_${sId}`);

      if (!studentMap.has(key)) {
        studentMap.set(key, {
          key,
          student_id: sId,
          student_name: sub.student_name || 'Anonymous Student',
          student_phone: sub.student_phone || '',
          student_email: sub.student_email || '',
          student_avatar: sub.avatar || sub.student_avatar || '/avatar.svg',
          submissions: [],
          totalScore: 0,
          totalPossible: 0,
          bestScore: 0
        });
      }
      const entry = studentMap.get(key);
      entry.submissions.push(sub);
      const score = Number(sub.score || 0);
      const poss = Number(sub.total_marks || 0);
      entry.totalScore += score;
      entry.totalPossible += poss;
      if (score > entry.bestScore) entry.bestScore = score;
    });

    const list = Array.from(studentMap.values()).map(s => ({
      ...s,
      totalExams: s.submissions.length,
      averagePercentage: s.totalPossible > 0 ? Math.round((s.totalScore / s.totalPossible) * 100) : 0
    }));

    list.sort((a, b) => b.totalExams - a.totalExams || b.totalScore - a.totalScore);
    return list;
  }, [examSubmissions]);

  const filteredGradebookStudents = useMemo(() => {
    if (!gradebookSearchQuery.trim()) return studentGradebookList;
    const q = gradebookSearchQuery.toLowerCase();
    return studentGradebookList.filter(s => 
      (s.student_name || '').toLowerCase().includes(q) ||
      (s.student_phone || '').includes(q) ||
      (s.student_email || '').toLowerCase().includes(q)
    );
  }, [studentGradebookList, gradebookSearchQuery]);

  const activeGradebookStudent = useMemo(() => {
    if (selectedGradebookStudentKey) {
      return studentGradebookList.find(s => s.key === selectedGradebookStudentKey) || null;
    }
    return filteredGradebookStudents[0] || null;
  }, [studentGradebookList, selectedGradebookStudentKey, filteredGradebookStudents]);

  const handleExportCSV = () => {
    if (!filteredSubmissions || filteredSubmissions.length === 0) {
      alert('কোনো পরীক্ষার ফলাফল পাওয়া যায়নি এক্সপোর্ট করার জন্য।');
      return;
    }
    const headers = ['Student Name', 'Phone', 'Email', 'Course Name', 'Exam Title', 'Score', 'Total Marks', 'Percentage', 'Time Taken (Sec)', 'Attempt Type', 'Submission Date'];
    const rows = filteredSubmissions.map(s => [
      `"${(s.student_name || 'N/A').replace(/"/g, '""')}"`,
      `"${(s.student_phone || 'N/A').replace(/"/g, '""')}"`,
      `"${(s.student_email || '').replace(/"/g, '""')}"`,
      `"${(s.course_name || 'N/A').replace(/"/g, '""')}"`,
      `"${(s.lesson_title || 'N/A').replace(/"/g, '""')}"`,
      s.score ?? 0,
      s.total_marks ?? 0,
      `${s.percentage ?? 0}%`,
      s.time_taken_seconds ?? 0,
      s.is_first_attempt === false ? 'Retake (Practice)' : 'Official 1st Attempt',
      `"${s.submitted_at || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eduhunters_exam_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই শিক্ষার্থীর পরীক্ষার ফলাফল ডিলিট করতে চান? এটি রিভার্স করা যাবে না।')) return;
    setDeletingSubmissionId(submissionId);
    try {
      await deleteQuizSubmission(submissionId);
      setExamSubmissions(prev => prev.filter(s => s.id !== submissionId));
      if (inspectingSubmission?.id === submissionId) {
        setInspectingSubmission(null);
      }
    } catch (e) {
      alert('Error deleting submission: ' + (e.message || 'Unknown error'));
    } finally {
      setDeletingSubmissionId(null);
    }
  };


  const [accounting, setAccounting] = useState(() => {
    const deletedIds = getDeletedIdsSet();
    const overrides = getAmountOverridesMap();

    const raw = data?.accounting;
    const baseTxs = (raw && raw.totalRevenue !== 284500 && Array.isArray(raw.transactions) && !raw.transactions.some(t => t.id === 'TRX-94825'))
      ? raw.transactions.filter(t => !t.id?.startsWith('TRX-948') && !isDeletedItem(t, deletedIds)).map(t => applyAmountOverride(t, overrides))
      : [];

    const txMap = new Map();
    baseTxs.forEach(t => {
      const k = t.orderId || t.id || t.trxId;
      if (k) txMap.set(k, t);
    });

    // Merge from eh_user_orders_v3 so fresh orders are immediately present on refresh
    try {
      const userOrders = JSON.parse(localStorage.getItem('eh_user_orders_v3') || '[]');
      if (Array.isArray(userOrders)) {
        userOrders.forEach(ord => {
          if (isDeletedItem(ord, deletedIds)) return;
          const k = ord.id || ord.orderId || ord.transactionId;
          if (k && !txMap.has(k)) {
            const mapped = mapOrderDocToTx(ord.id, ord);
            if (mapped && !isDeletedItem(mapped, deletedIds)) {
              txMap.set(k, mapped);
            }
          }
        });
      }
    } catch (e) {}

    // Merge from eh_enrolled_students
    try {
      const enrolled = JSON.parse(localStorage.getItem('eh_enrolled_students') || '[]');
      if (Array.isArray(enrolled)) {
        enrolled.forEach(st => {
          if (isDeletedItem(st, deletedIds)) return;
          const k = st.orderId || st.id || st.trxId;
          if (k && !txMap.has(k)) {
            let itemTx = {
              id: st.id || `TRX-${Date.now()}`,
              orderId: st.orderId || st.id,
              invoiceNumber: st.invoiceNumber || 'INV-EH',
              type: 'INCOME',
              category: 'Course Enrollment',
              itemTitle: st.courseName || 'Course Access',
              amount: Number(st.amount) || 0,
              method: st.paymentMethod || 'bKash',
              trxId: st.trxId || 'PENDING',
              studentName: st.name || 'Student',
              studentPhone: st.phone || '',
              studentEmail: st.email || '',
              date: (st.joinedDate || new Date().toISOString()).split('T')[0],
              createdAt: new Date().toISOString(),
              status: (st.status || '').toLowerCase() === 'active' ? 'Completed' : 'Pending',
              notes: 'Preserved from local student records'
            };
            itemTx = applyAmountOverride(itemTx, overrides);
            if (!isDeletedItem(itemTx, deletedIds)) {
              txMap.set(k, itemTx);
            }
          }
        });
      }
    } catch (e) {}

    const allTxs = deduplicateTransactions(Array.from(txMap.values()));
    const completedRev = allTxs
      .filter(t => (t.status || '').toLowerCase() === 'completed')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExp = Number(raw?.totalExpenses) || 0;

    return {
      totalRevenue: completedRev,
      totalExpenses: totalExp,
      netProfit: completedRev - totalExp,
      totalOrders: allTxs.length,
      transactions: allTxs
    };
  });

  const [editingTrxAmountId, setEditingTrxAmountId] = useState(null);
  const [editingTrxAmountVal, setEditingTrxAmountVal] = useState('');
  const [showNotificationPopover, setShowNotificationPopover] = useState(false);

  // 100% Dynamic Text & Headings State
  const [sectionTexts, setSectionTexts] = useState(() => ({
    ...initialData.sectionTexts,
    ...(data?.sectionTexts || {})
  }));

  // Why Choose Us Cards State
  const [whyChooseUs, setWhyChooseUs] = useState(() => 
    Array.isArray(data?.whyChooseUs)
      ? data.whyChooseUs
      : initialData.whyChooseUs
  );

  const [showAddWhyModal, setShowAddWhyModal] = useState(false);
  const [newWhyPoint, setNewWhyPoint] = useState({
    number: '05',
    title: '',
    desc: ''
  });

  // Legal Policies Management State
  const [termsAndConditions, setTermsAndConditions] = useState(() => 
    data?.termsAndConditions || initialData.termsAndConditions
  );
  const [refundPolicy, setRefundPolicy] = useState(() => 
    data?.refundPolicy || initialData.refundPolicy
  );
  const [privacyPolicy, setPrivacyPolicy] = useState(() => 
    data?.privacyPolicy || initialData.privacyPolicy
  );
  const [activePolicySubTab, setActivePolicySubTab] = useState('terms'); // 'terms' | 'refund' | 'privacy'

  // Clean Sub-Navigation for Section Texts (Eliminates Clutter)
  const [textSubTab, setTextSubTab] = useState('courses');

  // Modern SaaS Dashboard View Filters
  const [calendarView, setCalendarView] = useState('Week');
  const [calendarMonth, setCalendarMonth] = useState('January, 2026');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 7 Months');

  // =========================================================
  // USER MANAGEMENT MASTER STATE & CONTROLLERS
  // =========================================================
  const [usersList, setUsersList] = useState(() => {
    const defaultSeed = [
      {
        id: 'admin_master',
        name: 'EduHunters Admin',
        email: 'admin@eduhunters.com',
        phone: '01342227935',
        whatsapp: '01342227935',
        college: 'EduHunters HQ',
        institution: 'EduHunters HQ',
        role: 'Admin',
        status: 'Active',
        batch: 'Admin Staff',
        hscBatch: 'Admin Staff',
        enrolledCourses: ['All Courses (Super Admin Pass)'],
        totalSpent: 0,
        joinedDate: 'Official Launch',
        lastActive: 'Active now',
        device: 'Admin Console',
        avatar: '/logo-crimson.png'
      }
    ];

    const userMap = new Map();
    defaultSeed.forEach(u => userMap.set(u.email.toLowerCase(), u));

    if (Array.isArray(data?.users) && data.users.length > 0) {
      data.users.filter(u => !['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5', 'usr-6', 'usr-7', 'usr-8'].includes(u.id)).forEach(u => {
        const k = (u.email || u.id || '').toLowerCase();
        if (k) userMap.set(k, { ...userMap.get(k), ...u });
      });
    }

    try {
      const registered = JSON.parse(localStorage.getItem('eh_registered_users') || '[]');
      const currentStored = JSON.parse(localStorage.getItem('eh_current_user') || 'null');
      
      const allLocal = [...(Array.isArray(registered) ? registered : [])];
      if (currentStored && currentStored.email && !allLocal.some(u => u.email?.toLowerCase() === currentStored.email?.toLowerCase())) {
        allLocal.push(currentStored);
      }

      allLocal.forEach((u, i) => {
        const k = (u.email || u.id || u.uid || '').toLowerCase();
        if (!k) return;
        const mapped = {
          id: u.uid || u.id || `usr-reg-${i}`,
          name: u.displayName || u.name || u.email?.split('@')[0] || 'Student',
          email: u.email,
          phone: u.whatsapp || u.phone || '',
          whatsapp: u.whatsapp || u.phone || '',
          college: u.college || u.institution || '',
          institution: u.college || u.institution || '',
          role: u.role === 'admin' ? 'Admin' : (u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'Student'),
          status: u.status || 'Active',
          batch: u.hscBatch || u.batch || '',
          hscBatch: u.hscBatch || u.batch || '',
          authProvider: u.authProvider || (u.email?.endsWith('@gmail.com') ? 'google.com' : 'password'),
          enrolledCourses: Array.isArray(u.enrolledCourses) ? u.enrolledCourses : [],
          totalSpent: u.totalSpent || 0,
          joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
          lastActive: 'Recently',
          device: 'Web Client',
          avatar: u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email || 'user')}`
        };
        const ex = userMap.get(k);
        userMap.set(k, ex ? { ...ex, ...mapped } : mapped);
      });
    } catch (e) {}

    return deduplicateUsers(Array.from(userMap.values()));
  });

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userBatchFilter, setUserBatchFilter] = useState('ALL');
  const [userSortBy, setUserSortBy] = useState('newest');
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
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
  const [quickEnrollUser, setQuickEnrollUser] = useState(null);
  const [selectedCourseToEnroll, setSelectedCourseToEnroll] = useState('');
  const [userTabInsideModal, setUserTabInsideModal] = useState('profile'); // 'profile' | 'courses' | 'transactions'

  // Notified users cache & initial mount guard to prevent repetitive toasts on navigation/refresh
  const notifiedUserKeysRef = useRef(new Set());
  const isInitialAdminMountRef = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialAdminMountRef.current = false;
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Audio Chime notification for instant feedback when an enrollment is submitted
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  // Centralized, deduplicated user registration notification handler
  const notifyNewUserRegistration = useCallback((user) => {
    if (!user) return;
    const userKey = (user.id || user.uid || user.email || '').toLowerCase().trim();
    if (!userKey) return;

    // Suppress if within initial mount window (first 3.5s)
    if (isInitialAdminMountRef.current) {
      notifiedUserKeysRef.current.add(userKey);
      return;
    }

    // Never re-notify the same user
    if (notifiedUserKeysRef.current.has(userKey)) return;

    // Verify registration recency (if timestamp exists, must be within last 2 minutes)
    const createdAt = user.created_at || user.createdAt || user.joinedDate;
    if (createdAt && typeof createdAt === 'string' && createdAt !== 'Today' && createdAt !== 'Just registered') {
      const createdTime = new Date(createdAt).getTime();
      if (!isNaN(createdTime) && Date.now() - createdTime > 120000) {
        notifiedUserKeysRef.current.add(userKey);
        return;
      }
    }

    // Mark as notified immediately so it NEVER repeats
    notifiedUserKeysRef.current.add(userKey);

    const userName = user.displayName || user.name || user.email?.split('@')[0] || 'Student';
    playNotificationChime();
    triggerToast(`👤 নতুন ইউজার রেজিস্টার করেছেন: ${userName}`);
  }, []);

  // Central User Upsert Handler for User Management Tab & Realtime Profile Sync
  const upsertUserInList = useCallback((u, isNew = false) => {
    if (!u) return;
    const targetEmail = (u.email || '').toLowerCase().trim();
    const targetId = u.uid || u.id;

    // 1. Update Users Directory (usersList)
    setUsersList(prev => {
      const existingIndex = prev.findIndex(item => 
        (targetId && (item.id === targetId || item.uid === targetId)) ||
        (targetEmail && item.email && item.email.toLowerCase() === targetEmail)
      );

      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        const updatedUser = {
          ...existing,
          name: u.displayName || u.name || existing.name,
          displayName: u.displayName || u.name || existing.displayName,
          email: u.email || existing.email,
          phone: u.whatsapp || u.phone || u.phoneNumber || existing.phone,
          whatsapp: u.whatsapp || u.phone || u.phoneNumber || existing.whatsapp,
          college: u.college || u.institution || existing.college,
          institution: u.college || u.institution || existing.institution,
          batch: u.hscBatch || u.batch || existing.batch,
          hscBatch: u.hscBatch || u.batch || existing.hscBatch,
          avatar: u.photoURL || u.avatar || existing.avatar,
          photoURL: u.photoURL || u.avatar || existing.photoURL,
          enrolledCourses: Array.isArray(u.enrolledCourses) ? Array.from(new Set([...(existing.enrolledCourses || []), ...u.enrolledCourses])) : existing.enrolledCourses,
          totalSpent: u.totalSpent !== undefined ? Math.max(existing.totalSpent || 0, Number(u.totalSpent) || 0) : existing.totalSpent,
          lastActive: 'Active now'
        };
        const nextList = [...prev];
        nextList[existingIndex] = updatedUser;
        try {
          localStorage.setItem('eh_registered_users', JSON.stringify(nextList));
        } catch (e) {}
        return nextList;
      } else {
        const newUserRecord = {
          id: targetId || `usr-${Date.now()}`,
          name: u.displayName || u.name || (targetEmail ? targetEmail.split('@')[0] : 'New Student'),
          displayName: u.displayName || u.name || (targetEmail ? targetEmail.split('@')[0] : 'New Student'),
          email: u.email || 'student@eduhunters.com',
          phone: u.whatsapp || u.phone || u.phoneNumber || '',
          whatsapp: u.whatsapp || u.phone || u.phoneNumber || '',
          college: u.college || u.institution || '',
          institution: u.college || u.institution || '',
          role: u.role === 'admin' ? 'Admin' : 'Student',
          status: 'Active',
          batch: u.hscBatch || u.batch || '',
          hscBatch: u.hscBatch || u.batch || '',
          authProvider: u.authProvider || (targetEmail?.endsWith('@gmail.com') ? 'google.com' : 'password'),
          enrolledCourses: Array.isArray(u.enrolledCourses) ? u.enrolledCourses : [],
          totalSpent: Number(u.totalSpent) || 0,
          joinedDate: 'Just now',
          lastActive: 'Active now',
          device: 'Web Client',
          avatar: u.photoURL || u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetEmail || 'student')}`,
          photoURL: u.photoURL || u.avatar || '/avatar.svg'
        };
        const nextList = [newUserRecord, ...prev];
        try {
          localStorage.setItem('eh_registered_users', JSON.stringify(nextList));
        } catch (e) {}
        return nextList;
      }
    });

    // 2. Synchronize matching records in Active Enrolled Students Database
    setEnrolledStudents(prev => {
      const targetPhoneClean = (u.whatsapp || u.phone || '').replace(/[^0-9]/g, '');
      let hasChange = false;
      const nextList = prev.map(st => {
        const stEmail = (st.email || '').toLowerCase().trim();
        const stPhoneClean = (st.phone || '').replace(/[^0-9]/g, '');
        const isMatch = (targetEmail && stEmail === targetEmail) ||
                        (targetPhoneClean.length >= 10 && stPhoneClean.endsWith(targetPhoneClean.slice(-10)));
        if (isMatch) {
          hasChange = true;
          return {
            ...st,
            name: u.displayName || u.name || st.name,
            phone: u.whatsapp || u.phone || st.phone,
            batch: u.hscBatch || u.batch || st.batch,
            avatar: u.photoURL || u.avatar || st.avatar
          };
        }
        return st;
      });
      if (hasChange) {
        try {
          localStorage.setItem('eh_enrolled_students', JSON.stringify(nextList));
        } catch (e) {}
        return nextList;
      }
      return prev;
    });

    // 3. Synchronize matching transaction records in Accounting Ledger
    setAccounting(prev => {
      if (!prev?.transactions) return prev;
      const targetPhoneClean = (u.whatsapp || u.phone || '').replace(/[^0-9]/g, '');
      let hasChange = false;
      const nextTxs = prev.transactions.map(tx => {
        const txEmail = (tx.studentEmail || '').toLowerCase().trim();
        const txPhoneClean = (tx.studentPhone || '').replace(/[^0-9]/g, '');
        const isMatch = (targetEmail && txEmail === targetEmail) ||
                        (targetPhoneClean.length >= 10 && txPhoneClean.endsWith(targetPhoneClean.slice(-10)));
        if (isMatch) {
          hasChange = true;
          return {
            ...tx,
            studentName: u.displayName || u.name || tx.studentName,
            studentPhone: u.whatsapp || u.phone || tx.studentPhone
          };
        }
        return tx;
      });
      if (hasChange) {
        return { ...prev, transactions: nextTxs };
      }
      return prev;
    });

    // 4. Update currently viewed user details if modal is open
    setSelectedUserDetails(prev => {
      if (!prev) return prev;
      const prevEmail = (prev.email || '').toLowerCase().trim();
      const prevId = prev.uid || prev.id;
      if ((targetEmail && prevEmail === targetEmail) || (targetId && prevId === targetId)) {
        return {
          ...prev,
          name: u.displayName || u.name || prev.name,
          displayName: u.displayName || u.name || prev.displayName,
          phone: u.whatsapp || u.phone || prev.phone,
          whatsapp: u.whatsapp || u.phone || prev.whatsapp,
          college: u.college || u.institution || prev.college,
          institution: u.college || u.institution || prev.institution,
          batch: u.hscBatch || u.batch || prev.batch,
          hscBatch: u.hscBatch || u.batch || prev.hscBatch,
          avatar: u.photoURL || u.avatar || prev.avatar
        };
      }
      return prev;
    });
  }, []);

  // Central Handler for incoming course enrollments (Card filled out / checkout placed)
  const handleIncomingEnrollment = useCallback(({ order, transaction, student }, { silent = false } = {}) => {
    if (!transaction && !order) return;
    const tx = transaction || {
      id: `TRX-${Date.now()}`,
      orderId: order?.id,
      invoiceNumber: order?.invoiceNumber,
      type: 'INCOME',
      category: 'Course Enrollment',
      itemTitle: order?.course?.name || order?.items?.[0]?.title || 'Course Access',
      amount: Number(order?.totalPaid) || 0,
      method: order?.paymentMethodName || 'bKash',
      trxId: order?.transactionId || 'PENDING',
      studentName: order?.customer?.name || 'Online Student',
      studentPhone: order?.customer?.phone || 'N/A',
      studentEmail: order?.customer?.email || '',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      status: 'Pending'
    };

    const st = student || {
      id: `st-${Date.now()}`,
      name: tx.studentName,
      phone: tx.studentPhone,
      email: tx.studentEmail,
      batch: 'HSC 26',
      courseName: tx.itemTitle,
      status: tx.status === 'Completed' ? 'Active' : 'Pending',
      joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: tx.amount,
      trxId: tx.trxId,
      paymentMethod: tx.method
    };

    const isAlreadyCompleted = tx.status === 'Completed' || order?.isApproved || order?.status === 'PAID';

    // 1. Update accounting transactions state
    setAccounting(prev => {
      const prevTxs = Array.isArray(prev?.transactions) ? prev.transactions : [];
      if (prevTxs.some(t => t.id === tx.id || (t.trxId && t.trxId === tx.trxId && t.trxId !== 'PENDING'))) {
        return prev;
      }
      const nextTxs = [tx, ...prevTxs];
      const nextRev = isAlreadyCompleted ? ((Number(prev?.totalRevenue) || 0) + Number(tx.amount || 0)) : (Number(prev?.totalRevenue) || 0);
      const nextOrders = (Number(prev?.totalOrders) || prevTxs.length) + 1;
      const nextProfit = nextRev - (Number(prev?.totalExpenses) || 0);
      return {
        ...prev,
        totalRevenue: nextRev,
        netProfit: nextProfit,
        totalOrders: nextOrders,
        transactions: nextTxs
      };
    });

    // 2. Update enrolled students state (Pending status until verified)
    setEnrolledStudents(prev => {
      if (prev.some(s => s.phone === st.phone && s.courseName === st.courseName)) return prev;
      const nextStudents = [st, ...prev];
      try {
        localStorage.setItem('eh_enrolled_students', JSON.stringify(nextStudents));
      } catch (e) {}
      return nextStudents;
    });

    // Sync to local orders cache and eduhunters_data
    if (order) {
      try {
        const rawOrders = localStorage.getItem('eh_user_orders_v3');
        const ords = rawOrders ? JSON.parse(rawOrders) : [];
        if (!ords.some(o => o.id === order.id || (order.transactionId && o.transactionId === order.transactionId))) {
          ords.unshift(order);
          localStorage.setItem('eh_user_orders_v3', JSON.stringify(ords));
        }
      } catch (e) {}
    }

    // 3. If already approved/completed, unlock for user
    if (isAlreadyCompleted && (tx.studentEmail || tx.studentPhone)) {
      setUsersList(prev => {
        const idx = prev.findIndex(u => 
          (tx.studentEmail && u.email && u.email.toLowerCase() === tx.studentEmail.toLowerCase()) ||
          (tx.studentPhone && u.phone && u.phone.includes(tx.studentPhone.slice(-8)))
        );
        if (idx !== -1) {
          const existing = prev[idx];
          const prevCourses = Array.isArray(existing.enrolledCourses) ? existing.enrolledCourses : [];
          const nextCourses = prevCourses.includes(tx.itemTitle) ? prevCourses : [tx.itemTitle, ...prevCourses];
          const nextSpent = (Number(existing.totalSpent) || 0) + Number(tx.amount || 0);
          const updated = [...prev];
          updated[idx] = { ...existing, enrolledCourses: nextCourses, totalSpent: nextSpent, status: 'Active' };
          persistAll({ users: updated });
          return updated;
        }
        return prev;
      });
    }

    // 4. Play audio chime and trigger notification toast (unless silent initial sync)
    if (!silent) {
      playNotificationChime();
      triggerToast(`🔔 নতুন কোর্স এনরোলমেন্ট রিকোয়েস্ট! ${tx.studentName} — "${tx.itemTitle}" (৳${tx.amount})`);
    }
  }, []);

  // Multi-tier Real-time Synchronizer: Firestore Live + BroadcastChannel + Window Events + LocalStorage
  useEffect(() => {
    let unsubscribeUsers = null;
    let unsubscribeOrders = null;

    // Helper: Map a Cloud Firestore document into standard User object
    const mapFirestoreUserDoc = (docId, data) => ({
      uid: docId,
      id: docId,
      name: data.displayName || data.name || data.email?.split('@')[0] || 'Student',
      displayName: data.displayName || data.name || data.email?.split('@')[0] || 'Student',
      email: data.email,
      phone: data.whatsapp || data.phone || '',
      whatsapp: data.whatsapp || data.phone || '',
      college: data.college || data.institution || '',
      institution: data.college || data.institution || '',
      role: data.role === 'admin' ? 'Admin' : (data.role ? (data.role.charAt(0).toUpperCase() + data.role.slice(1)) : 'Student'),
      status: data.status || 'Active',
      batch: data.hscBatch || data.batch || '',
      hscBatch: data.hscBatch || data.batch || '',
      authProvider: data.authProvider || (data.email?.endsWith('@gmail.com') ? 'google.com' : 'password'),
      enrolledCourses: Array.isArray(data.enrolledCourses) ? data.enrolledCourses : [],
      totalSpent: Number(data.totalSpent) || 0,
      joinedDate: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently'),
      lastActive: 'Active now',
      device: (Array.isArray(data.registeredDevices) && data.registeredDevices[0]?.name) || 'Web Client',
      avatar: data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.email || 'user')}`
    });

    // 1. Live Cloud Firestore Listeners
    if (isFirebaseConfigured && db) {
      try {
        let isInitialUsersSnapshot = true;

        // Users collection real-time listener (all registered & Google sign-in accounts)
        unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
          const cloudUsers = snapshot.docs.map(docSnap => mapFirestoreUserDoc(docSnap.id, docSnap.data()));

          setUsersList(prev => {
            const emailMap = new Map();
            prev.forEach(u => {
              const key = (u.email || u.id || '').toLowerCase();
              if (key) emailMap.set(key, u);
            });
            cloudUsers.forEach(u => {
              const key = (u.email || u.id || '').toLowerCase().trim();
              if (key) {
                notifiedUserKeysRef.current.add(key);
                const existing = emailMap.get(key);
                emailMap.set(key, existing ? { ...existing, ...u } : u);
              }
            });
            return Array.from(emailMap.values());
          });

          // Trigger toast only for newly registered users after initial snapshot
          if (!isInitialUsersSnapshot) {
            snapshot.docChanges().forEach(change => {
              if (change.type === 'added') {
                const d = change.doc.data();
                notifyNewUserRegistration({ ...d, id: change.doc.id });
              }
            });
          }
          isInitialUsersSnapshot = false;
        }, (err) => {
          console.warn('[AdminPanel] Firestore users listener note:', err);
        });

        let isInitialOrdersSnapshot = true;

        // Orders collection real-time listener (all course purchases across all devices & live site)
        unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
          const deletedIds = getDeletedIdsSet();
          const overrides = getAmountOverridesMap();
          const cloudOrders = snapshot.docs
            .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
            .filter(o => !isDeletedItem(o, deletedIds));

          const mappedTxs = cloudOrders.map(o => mapOrderDocToTx(o.id, o)).filter(t => !isDeletedItem(t, deletedIds));
          const mappedStudents = cloudOrders.map(o => mapOrderDocToStudent(o.id, o)).filter(st => !isDeletedItem(st, deletedIds));

          // Atomically update accounting.transactions
          setAccounting(prev => {
            const prevTxs = Array.isArray(prev?.transactions) ? prev.transactions : [];
            const txMap = new Map();
            // Retain any manual/offline transactions that are not deleted
            prevTxs.filter(tx => !isDeletedItem(tx, deletedIds)).forEach(tx => {
              const key = tx.orderId || tx.id || tx.trxId;
              if (key) txMap.set(key, applyAmountOverride(tx, overrides));
            });
            // Cloud orders take precedence and reflect live Firestore state
            mappedTxs.forEach(tx => {
              const key = tx.orderId || tx.id || tx.trxId;
              if (key) txMap.set(key, applyAmountOverride(tx, overrides));
            });

            const allTxs = deduplicateTransactions(Array.from(txMap.values()));
            const completedRev = allTxs
              .filter(t => (t.status || '').toLowerCase() === 'completed')
              .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            const totalExpenses = Number(prev?.totalExpenses) || 0;

            return {
              ...prev,
              totalRevenue: completedRev,
              netProfit: completedRev - totalExpenses,
              totalOrders: allTxs.filter(t => (t.type || '').toUpperCase() === 'INCOME' || !t.type).length,
              transactions: allTxs
            };
          });

          // Atomically update enrolled students list
          setEnrolledStudents(prev => {
            const stMap = new Map();
            prev.filter(st => !isDeletedItem(st, deletedIds)).forEach(st => {
              const key = st.id || `${st.phone}_${st.courseName}`;
              stMap.set(key, st);
            });
            mappedStudents.forEach(st => {
              const key = st.id || `${st.phone}_${st.courseName}`;
              stMap.set(key, st);
            });
            const mergedSt = Array.from(stMap.values());
            try {
              localStorage.setItem('eh_enrolled_students', JSON.stringify(mergedSt));
            } catch (e) {}
            return mergedSt;
          });

          // Trigger audio chime and toast for live incoming orders after initial snapshot
          if (!isInitialOrdersSnapshot) {
            snapshot.docChanges().forEach(change => {
              if (change.type === 'added') {
                const d = change.doc.data();
                const tx = mapOrderDocToTx(change.doc.id, d);
                playNotificationChime();
                triggerToast(`🔔 নতুন কোর্স এনরোলমেন্ট রিকোয়েস্ট! ${tx.studentName} — "${tx.itemTitle}" (৳${tx.amount})`);
              }
            });
          }
          isInitialOrdersSnapshot = false;
        }, (err) => {
          console.warn('[AdminPanel] Firestore orders listener note:', err);
        });

      } catch (err) {
        console.warn('[AdminPanel] Real-time Firestore initialization note:', err);
      }
    }

    // 1.1 Supabase Real-time Listeners & Initial Fetch (Unlimited Free Realtime)
    let unsubscribeSupabaseOrders = null;
    let unsubscribeSupabaseUsers = null;
    let unsubscribeSupabaseHeartbeat = null;

    if (isSupabaseConfigured) {
      try {
        let isInitialSupabaseOrders = true;

        fetchSupabaseOrders().then(orders => {
          if (Array.isArray(orders) && orders.length > 0) {
            const deletedIds = getDeletedIdsSet();
            const overrides = getAmountOverridesMap();
            const activeOrders = orders.filter(o => !isDeletedItem(o, deletedIds));

            const mappedTxs = activeOrders.map(o => mapOrderDocToTx(o.id, o)).filter(t => !isDeletedItem(t, deletedIds));
            const mappedStudents = activeOrders.map(o => mapOrderDocToStudent(o.id, o)).filter(st => !isDeletedItem(st, deletedIds));

            setAccounting(prev => {
              const prevTxs = Array.isArray(prev?.transactions) ? prev.transactions : [];
              const txMap = new Map();
              prevTxs.filter(tx => !isDeletedItem(tx, deletedIds)).forEach(tx => {
                const key = tx.orderId || tx.id || tx.trxId;
                if (key) txMap.set(key, applyAmountOverride(tx, overrides));
              });
              mappedTxs.forEach(tx => {
                const key = tx.orderId || tx.id || tx.trxId;
                if (key) txMap.set(key, applyAmountOverride(tx, overrides));
              });
              const allTxs = deduplicateTransactions(Array.from(txMap.values()));
              const completedRev = allTxs
                .filter(t => (t.status || '').toLowerCase() === 'completed')
                .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              const totalExpenses = Number(prev?.totalExpenses) || 0;
              return {
                ...prev,
                totalRevenue: completedRev,
                netProfit: completedRev - totalExpenses,
                totalOrders: allTxs.filter(t => (t.type || '').toUpperCase() === 'INCOME' || !t.type).length,
                transactions: allTxs
              };
            });

            setEnrolledStudents(prev => {
              const stMap = new Map();
              prev.filter(st => !isDeletedItem(st, deletedIds)).forEach(st => {
                const key = st.id || `${st.phone}_${st.courseName}`;
                stMap.set(key, st);
              });
              mappedStudents.forEach(st => {
                const key = st.id || `${st.phone}_${st.courseName}`;
                stMap.set(key, st);
              });
              const mergedSt = Array.from(stMap.values());
              try {
                localStorage.setItem('eh_enrolled_students', JSON.stringify(mergedSt));
              } catch (e) {}
              return mergedSt;
            });

            // Sync to local orders cache so refreshing the page immediately has all orders
            try {
              const localOrds = JSON.parse(localStorage.getItem('eh_user_orders_v3') || '[]');
              const ordMap = new Map();
              localOrds.filter(o => !isDeletedItem(o, deletedIds)).forEach(o => { if (o && o.id) ordMap.set(o.id, o); });
              activeOrders.forEach(o => { if (o && o.id) ordMap.set(o.id, o); });
              localStorage.setItem('eh_user_orders_v3', JSON.stringify(Array.from(ordMap.values())));
            } catch (e) {}
          }
        }).catch(() => {});

        const refreshSupabaseUsers = () => {
          return fetchSupabaseUsers().then(users => {
            if (Array.isArray(users) && users.length > 0) {
              users.forEach(u => {
                const key = (u.email || u.id || u.uid || '').toLowerCase().trim();
                if (key) notifiedUserKeysRef.current.add(key);
                upsertUserInList(u, false);
              });
            }
          }).catch((err) => {
            console.warn('[AdminPanel] Supabase user fetch note:', err);
          });
        };

        refreshSupabaseUsers();

        unsubscribeSupabaseOrders = subscribeToSupabaseOrders(({ eventType, order }) => {
          const deletedIds = getDeletedIdsSet();
          if (isDeletedItem(order, deletedIds)) {
            return;
          }
          const tx = mapOrderDocToTx(order.id, order);
          const student = mapOrderDocToStudent(order.id, order);
          if (isDeletedItem(tx, deletedIds) || isDeletedItem(student, deletedIds)) {
            return;
          }
          if (eventType === 'INSERT' && !isInitialSupabaseOrders) {
            playNotificationChime();
            triggerToast(`🔔 নতুন কোর্স এনরোলমেন্ট রিকোয়েস্ট! ${tx.studentName} — "${tx.itemTitle}" (৳${tx.amount})`);
          }
          handleIncomingEnrollment({ order, transaction: tx, student });
        });
        isInitialSupabaseOrders = false;

        let isInitialSupabaseUsers = true;
        unsubscribeSupabaseUsers = subscribeToSupabaseUsers(({ eventType, user }) => {
          if (eventType === 'INSERT' && !isInitialSupabaseUsers) {
            notifyNewUserRegistration(user);
          } else if (isInitialSupabaseUsers && user) {
            const key = (user.id || user.uid || user.email || '').toLowerCase().trim();
            if (key) notifiedUserKeysRef.current.add(key);
          }
          upsertUserInList(user, eventType === 'INSERT');
        });
        isInitialSupabaseUsers = false;

        // 15-second background heartbeat poll to ensure 100% sync reliability for orders and student profiles
        const supabaseHeartbeat = setInterval(() => {
          fetchSupabaseOrders().then(orders => {
            if (Array.isArray(orders) && orders.length > 0) {
              const deletedIds = getDeletedIdsSet();
              const overrides = getAmountOverridesMap();
              const activeOrders = orders.filter(o => !isDeletedItem(o, deletedIds));
              const mappedTxs = activeOrders.map(o => mapOrderDocToTx(o.id, o)).filter(t => !isDeletedItem(t, deletedIds));
              const mappedStudents = activeOrders.map(o => mapOrderDocToStudent(o.id, o)).filter(st => !isDeletedItem(st, deletedIds));

              setAccounting(prev => {
                const prevTxs = Array.isArray(prev?.transactions) ? prev.transactions : [];
                const txMap = new Map();
                prevTxs.filter(tx => !isDeletedItem(tx, deletedIds)).forEach(tx => {
                  const key = tx.orderId || tx.id || tx.trxId;
                  if (key) txMap.set(key, applyAmountOverride(tx, overrides));
                });
                mappedTxs.forEach(tx => {
                  const key = tx.orderId || tx.id || tx.trxId;
                  if (key) txMap.set(key, applyAmountOverride(tx, overrides));
                });
                const allTxs = deduplicateTransactions(Array.from(txMap.values()));
                const completedRev = allTxs
                  .filter(t => (t.status || '').toLowerCase() === 'completed')
                  .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
                const totalExpenses = Number(prev?.totalExpenses) || 0;
                return {
                  ...prev,
                  totalRevenue: completedRev,
                  netProfit: completedRev - totalExpenses,
                  totalOrders: allTxs.filter(t => (t.type || '').toUpperCase() === 'INCOME' || !t.type).length,
                  transactions: allTxs
                };
              });

              setEnrolledStudents(prev => {
                const stMap = new Map();
                prev.filter(st => !isDeletedItem(st, deletedIds)).forEach(st => {
                  const key = st.id || `${st.phone}_${st.courseName}`;
                  stMap.set(key, st);
                });
                mappedStudents.forEach(st => {
                  const key = st.id || `${st.phone}_${st.courseName}`;
                  stMap.set(key, st);
                });
                return Array.from(stMap.values());
              });
            }
          }).catch(() => {});

          refreshSupabaseUsers();
        }, 15000);

        unsubscribeSupabaseHeartbeat = () => clearInterval(supabaseHeartbeat);
      } catch (err) {
        console.warn('[AdminPanel] Supabase real-time setup note:', err);
      }
    }

    // 2. BroadcastChannel for Instant Cross-Tab & Multi-Window Sync
    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('eduhunters_sync_channel');
        bc.onmessage = (event) => {
          const { type, action, payload } = event.data || {};
          if (type === 'USER_SYNC' && payload) {
            upsertUserInList(payload, action === 'REGISTER');
            if (action === 'REGISTER') {
              notifyNewUserRegistration(payload);
            }
          }
          if (type === 'NEW_ENROLLMENT_ORDER' && payload) {
            handleIncomingEnrollment(payload);
          }
        };
      } catch (e) {}
    }

    // 3. Window Custom Event Listeners
    const handleProfileUpdate = (e) => {
      if (e.detail) {
        upsertUserInList(e.detail, false);
      }
    };

    const handleUserRegistered = (e) => {
      if (e.detail) {
        upsertUserInList(e.detail, true);
        notifyNewUserRegistration(e.detail);
      }
    };

    const handleNewEnrollmentEvent = (e) => {
      if (e.detail) {
        handleIncomingEnrollment(e.detail);
      }
    };

    // 4. LocalStorage Cross-Tab Storage Listener
    const handleStorageChange = (e) => {
      if (e.key === 'eh_registered_users' && e.newValue) {
        try {
          const list = JSON.parse(e.newValue);
          if (Array.isArray(list)) {
            list.forEach(u => upsertUserInList(u));
          }
        } catch (err) {}
      }
      if (e.key === 'eh_current_user' && e.newValue) {
        try {
          const cur = JSON.parse(e.newValue);
          if (cur && cur.email) {
            upsertUserInList(cur);
          }
        } catch (err) {}
      }
      if (e.key === 'eh_enrolled_students' && e.newValue) {
        try {
          const stList = JSON.parse(e.newValue);
          if (Array.isArray(stList)) {
            setEnrolledStudents(stList);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('eh_profile_updated', handleProfileUpdate);
    window.addEventListener('eh_user_registered', handleUserRegistered);
    window.addEventListener('eh_user_changed', (e) => {
      if (e.detail?.user) upsertUserInList(e.detail.user, e.detail.action === 'REGISTER');
    });
    window.addEventListener('eh:new_enrollment', handleNewEnrollmentEvent);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (typeof unsubscribeSupabaseHeartbeat === 'function') unsubscribeSupabaseHeartbeat();
      if (typeof unsubscribeSupabaseOrders === 'function') unsubscribeSupabaseOrders();
      if (typeof unsubscribeSupabaseUsers === 'function') unsubscribeSupabaseUsers();
      if (typeof unsubscribeUsers === 'function') unsubscribeUsers();
      if (typeof unsubscribeOrders === 'function') unsubscribeOrders();
      if (bc) bc.close();
      window.removeEventListener('eh_profile_updated', handleProfileUpdate);
      window.removeEventListener('eh_user_registered', handleUserRegistered);
      window.removeEventListener('eh:new_enrollment', handleNewEnrollmentEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [upsertUserInList, handleIncomingEnrollment]);

  // Synchronize AdminPanel state with live updates from App.jsx or cross-tab synchronization
  useEffect(() => {
    if (!data) return;
    if (Array.isArray(data.bundles)) setBundles(data.bundles);
    if (Array.isArray(data.courses)) setCourses(data.courses.filter(c => !isZenithCopiedCourse(c)));
    if (Array.isArray(data.heroSlides)) setHeroSlides(data.heroSlides);
    if (Array.isArray(data.homeStats)) setHomeStats(data.homeStats);
    if (Array.isArray(data.categories)) {
      setCategories(data.categories
        .filter(c => !["HSC 25", "Engineering", "HSC 27", "HSC 28", "HSC 26"].includes(c))
        .map(c => c === "University A Unit" ? "Free" : c)
      );
    }
    if (Array.isArray(data.freeVideos)) setFreeVideos(data.freeVideos);
    if (Array.isArray(data.storeProducts)) setStoreProducts(data.storeProducts);
    if (Array.isArray(data.whyChooseUs)) setWhyChooseUs(data.whyChooseUs);
    if (data.siteSettings) setSiteSettings(data.siteSettings);
    if (data.announcement !== undefined) setAnnouncement(data.announcement);
    if (data.sectionTexts) setSectionTexts(data.sectionTexts);
    if (data.accounting) {
      setAccounting(prev => {
        const deletedIds = getDeletedIdsSet();
        const overrides = getAmountOverridesMap();
        const prevTxs = Array.isArray(prev?.transactions) ? prev.transactions : [];
        const dataTxs = Array.isArray(data.accounting?.transactions) ? data.accounting.transactions : [];
        const txMap = new Map();
        prevTxs.filter(t => !isDeletedItem(t, deletedIds)).forEach(t => {
          const k = t.orderId || t.id || t.trxId;
          if (k) txMap.set(k, applyAmountOverride(t, overrides));
        });
        dataTxs.filter(t => !isDeletedItem(t, deletedIds)).forEach(t => {
          const k = t.orderId || t.id || t.trxId;
          const overridden = applyAmountOverride(t, overrides);
          if (k) {
            const ex = txMap.get(k);
            txMap.set(k, ex ? { ...ex, ...overridden } : overridden);
          } else if (t.id) {
            txMap.set(t.id, overridden);
          }
        });
        const allTxs = deduplicateTransactions(Array.from(txMap.values()));
        const completedRev = allTxs
          .filter(t => (t.status || '').toLowerCase() === 'completed')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const totalExpenses = Number(data.accounting.totalExpenses ?? prev?.totalExpenses) || 0;
        return {
          ...data.accounting,
          totalRevenue: completedRev,
          totalExpenses: totalExpenses,
          netProfit: completedRev - totalExpenses,
          totalOrders: allTxs.filter(t => (t.type || '').toUpperCase() === 'INCOME' || !t.type).length,
          transactions: allTxs
        };
      });
    }
    if (data.termsAndConditions) setTermsAndConditions(data.termsAndConditions);
    if (data.refundPolicy) setRefundPolicy(data.refundPolicy);
    if (data.privacyPolicy) setPrivacyPolicy(data.privacyPolicy);
    if (Array.isArray(data.users) && data.users.length > 0) {
      setUsersList(prev => {
        const emailMap = new Map();
        prev.forEach(u => {
          const key = (u.email || u.id || '').toLowerCase();
          if (key) emailMap.set(key, u);
        });
        data.users.forEach(u => {
          const key = (u.email || u.id || '').toLowerCase();
          if (key) {
            const existing = emailMap.get(key);
            emailMap.set(key, existing ? { ...existing, ...u } : u);
          }
        });
        return Array.from(emailMap.values());
      });
    }
    if (Array.isArray(data.instructors)) setInstructors(data.instructors);
  }, [data]);

  // Edu Hunters Real Enrolled Students State
  const [enrolledStudents, setEnrolledStudents] = useState(() => {
    const deletedIds = getDeletedIdsSet();
    const overrides = getAmountOverridesMap();
    const studentMap = new Map();
    try {
      const saved = localStorage.getItem('eh_enrolled_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed
            .filter(s => !['st-101', 'st-102', 'st-103', 'st-104', 'st-105'].includes(s.id))
            .filter(s => !isDeletedItem(s, deletedIds))
            .forEach(st => {
              const cleanId = typeof st.id === 'string' ? st.id.replace(/^(TRX-|st-)/, '') : '';
              const overrideVal = overrides[st.id] ?? overrides[st.orderId] ?? overrides[st.trxId] ?? overrides[cleanId];
              const stWithAmt = (overrideVal !== undefined && !isNaN(Number(overrideVal)))
                ? { ...st, amount: Number(overrideVal) }
                : st;
              const key = st.id || `${st.phone}_${st.courseName}`;
              studentMap.set(key, stWithAmt);
            });
        }
      }
    } catch {}

    // Merge from eh_user_orders_v3 so any enrolled student appears immediately
    try {
      const rawOrders = localStorage.getItem('eh_user_orders_v3');
      if (rawOrders) {
        const parsedOrders = JSON.parse(rawOrders);
        if (Array.isArray(parsedOrders)) {
          parsedOrders
            .filter(ord => !isDeletedItem(ord, deletedIds))
            .forEach(ord => {
              const mappedSt = mapOrderDocToStudent(ord.id, ord);
              if (mappedSt && !isDeletedItem(mappedSt, deletedIds)) {
                const key = mappedSt.id || `${mappedSt.phone}_${mappedSt.courseName}`;
                if (!studentMap.has(key)) {
                  studentMap.set(key, mappedSt);
                }
              }
            });
        }
      }
    } catch {}

    return Array.from(studentMap.values());
  });

  useEffect(() => {
    try {
      localStorage.setItem('eh_enrolled_students', JSON.stringify(enrolledStudents));
    } catch {
      // ignore
    }
  }, [enrolledStudents]);

  // Student Filter & Search state
  const [studentBatchFilter, setStudentBatchFilter] = useState('ALL');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Manual Student Enrollment & TrxID Verification Hub State
  const [dashboardMainTab, setDashboardMainTab] = useState('verification'); // 'verification' | 'students'
  const [verificationSearchQuery, setVerificationSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('PENDING'); // 'PENDING' | 'ALL' | 'COMPLETED' | 'REJECTED'
  const [selectedTxDetails, setSelectedTxDetails] = useState(null);
  const [copiedTrxId, setCopiedTrxId] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(null);

  // Add / Edit Student Modal State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    phone: '',
    email: '',
    batch: 'HSC 26',
    courseName: 'Mastering Text Book Combo HSC 25,26,27',
    status: 'Active'
  });

  // Notice & SMS Modal State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTargetBatch, setNoticeTargetBatch] = useState('All Students');
  const [noticeText, setNoticeText] = useState('');

  // Weekly Academic Schedule (Live Classes, Mega Exams, Doubt Solving)
  const [academicRoutines, setAcademicRoutines] = useState([
    {
      id: 'r1',
      day: 'Mon',
      time: '09:30',
      title: 'Biology Live Class',
      tag: 'Biology Live',
      type: 'live',
      bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      id: 'r2',
      day: 'Mon',
      time: '10:30',
      title: 'HSC 26 Weekly Mega MCQ Exam',
      tag: 'Mega Exam',
      type: 'exam',
      bgClass: 'bg-amber-50 text-amber-900 border-amber-200'
    },
    {
      id: 'r3',
      day: 'Tue',
      time: '10:30',
      title: 'Higher Math Ketab Sir Solve Class',
      tag: 'Math Solve',
      type: 'live',
      bgClass: 'bg-purple-50 text-purple-800 border-purple-200'
    },
    {
      id: 'r4',
      day: 'Wed',
      time: '11:00',
      title: 'Medical Doubt Clear Zoom Session',
      tag: 'Doubt Solve',
      type: 'doubt',
      bgClass: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    {
      id: 'r5',
      day: 'Thur',
      time: '10:00',
      title: 'Engineering Physics Concept Class',
      tag: 'Physics Live',
      type: 'live',
      bgClass: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    },
    {
      id: 'r6',
      day: 'Fri',
      time: '12:00',
      title: 'All-Board Mock Test & Result Release',
      tag: 'Mock Test',
      type: 'exam',
      bgClass: 'bg-rose-50 text-rose-800 border-rose-200'
    }
  ]);

  // Add Routine Modal State
  const [showAddRoutineModal, setShowAddRoutineModal] = useState(false);
  const [newRoutineData, setNewRoutineData] = useState({
    day: 'Sat',
    time: '10:30',
    title: '',
    tag: 'Live Class',
    type: 'live'
  });

  // Recent Academic Platform Activities
  const [academicActivities, setAcademicActivities] = useState([]);


  // Interactive Media Gallery Modal State
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState('Choose Image');
  const [gallerySelectedUrl, setGallerySelectedUrl] = useState('');
  const [galleryCallback, setGalleryCallback] = useState(null);

  // Open Image Picker Modal
  const openGalleryModal = (currentImage, title, defaultCategory = 'Faculty', onSelect) => {
    const callback = typeof defaultCategory === 'function' ? defaultCategory : onSelect;
    setGallerySelectedUrl(currentImage || '');
    setGalleryTitle(title || 'Choose Image');
    setGalleryCallback(() => (selected) => {
      if (callback) callback(selected);
      setGalleryModalOpen(false);
    });
    setGalleryModalOpen(true);
  };

  // Direct File Upload from Device (Instant HD Client Processing + Cloud Sync)
  const handleDeviceFileUpload = async (file, onSelect) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast('⚠️ অনুগ্রহ করে একটি সঠিক ছবি ফাইল (JPG, PNG, WebP) নির্বাচন করুন');
      return;
    }
    triggerToast('⏳ হাই কোয়ালিটি ছবি লোড হচ্ছে...');
    try {
      // Step 1: Instant Client-Side Ultra-HD processing (<100ms) up to 1600px with 92% quality
      const hd = await processHighQualityImage(file, 1600, 0.92);
      if (hd && hd.url && onSelect) {
        onSelect(hd.url);
        triggerToast('✅ হাই কোয়ালিটি ছবি সফলভাবে লোড হয়েছে!');
      }

      // Step 2: Background Cloud Storage sync (non-blocking)
      uploadImageFile(file, 'instructor')
        .then(res => {
          if (res?.url && !res.isLocalFallback && onSelect) {
            onSelect(res.url);
          }
        })
        .catch(err => console.warn('[AdminPanel] Background cloud sync note:', err));
    } catch (err) {
      console.warn('[AdminPanel] Image process error:', err);
      try {
        const fallbackUrl = URL.createObjectURL(file);
        if (onSelect) onSelect(fallbackUrl);
        triggerToast('✅ ছবি যুক্ত হয়েছে!');
      } catch (fbErr) {
        triggerToast('⚠️ ছবি লোড করতে সমস্যা হয়েছে, আবার চেষ্টা করুন');
      }
    }
  };

  // Unified Image / Media Picker Modal (Curated Presets Library Removed)
  const renderGalleryModal = () => {
    if (!galleryModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
        <div className="bg-white border border-slate-200/80 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {galleryTitle || 'Choose Image'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload directly from your device or paste an image link.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGalleryModalOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center border-none cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* Upload from Device */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Upload from Device / Gallery
              </label>
              <label className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all text-center group">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors block">
                    Click to Browse Device Gallery or Drag & Drop
                  </span>
                  <span className="text-xs text-slate-500">
                    Supports JPG, PNG, WebP (auto-optimized & instantly applied)
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleDeviceFileUpload(file, (newUrl) => {
                        setGallerySelectedUrl(newUrl);
                      });
                    }
                  }}
                />
              </label>
            </div>

            {/* Direct URL Option */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Or Paste Image URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={gallerySelectedUrl}
                  onChange={(e) => setGallerySelectedUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono text-slate-700"
                />
                {gallerySelectedUrl && (
                  <button
                    type="button"
                    onClick={() => setGallerySelectedUrl('')}
                    className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer with Live Preview & Apply */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {gallerySelectedUrl ? (
                <>
                  <img 
                    src={gallerySelectedUrl} 
                    alt="Selected" 
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="hidden sm:block min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">Photo Selected</span>
                    <span className="text-[10px] text-emerald-600 font-semibold block truncate">Ready to apply</span>
                  </div>
                </>
              ) : (
                <span className="text-xs text-slate-400 italic">No image chosen yet</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGalleryModalOpen(false)}
                className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!gallerySelectedUrl}
                onClick={() => {
                  if (gallerySelectedUrl && galleryCallback) {
                    galleryCallback(gallerySelectedUrl);
                  }
                }}
                className="px-6 py-2 rounded-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold border-none cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Photo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Feedback Toasts & Unsaved Changes Tracking
  const [saveToast, setSaveToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('✅ All changes saved successfully!');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSnapshot, setOriginalSnapshot] = useState(() => ({
    siteSettings: { ...initialData.siteSettings, ...(data?.siteSettings || {}) },
    sectionTexts: { ...initialData.sectionTexts, ...(data?.sectionTexts || {}) }
  }));

  const handleUpdateSiteSetting = (field, value) => {
    setSiteSettings(prev => {
      const next = { ...prev, [field]: value };
      persistAll({ siteSettings: next });
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleUpdateSectionText = (key, value) => {
    setSectionTexts(prev => {
      const next = { ...prev, [key]: value };
      persistAll({ sectionTexts: next });
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleConfirmSaveAllChanges = () => {
    persistAll({ siteSettings, sectionTexts });
    setOriginalSnapshot({
      siteSettings: { ...siteSettings },
      sectionTexts: { ...sectionTexts }
    });
    setHasUnsavedChanges(false);
    triggerToast('✅ Changes saved successfully!');
  };

  const handleCancelAllChanges = () => {
    if (originalSnapshot.siteSettings) {
      setSiteSettings({ ...originalSnapshot.siteSettings });
    }
    if (originalSnapshot.sectionTexts) {
      setSectionTexts({ ...originalSnapshot.sectionTexts });
    }
    setHasUnsavedChanges(false);
    triggerToast('Changes discarded');
  };

  // Helper functions for Why Choose Us cards
  const handleAddWhyPoint = (e) => {
    e.preventDefault();
    if (!newWhyPoint.title) return;
    const updated = [
      ...whyChooseUs,
      {
        number: newWhyPoint.number || `0${whyChooseUs.length + 1}`,
        title: newWhyPoint.title,
        desc: newWhyPoint.desc
      }
    ];
    setWhyChooseUs(updated);
    persistAll({ whyChooseUs: updated });
    setNewWhyPoint({ number: `0${updated.length + 1}`, title: '', desc: '' });
    setShowAddWhyModal(false);
    triggerToast('✅ New card added successfully!');
  };

  const handleDeleteWhyPoint = (indexToDelete) => {
    const updated = whyChooseUs.filter((_, idx) => idx !== indexToDelete);
    setWhyChooseUs(updated);
    persistAll({ whyChooseUs: updated });
    triggerToast('🗑️ Card deleted successfully!');
  };

  const handleUpdateWhyPoint = (idx, field, value) => {
    const updated = whyChooseUs.map((item, i) => {
      if (i === idx) return { ...item, [field]: value };
      return item;
    });
    setWhyChooseUs(updated);
    persistAll({ whyChooseUs: updated });
  };

  // Modal States
  const [showAddSlideModal, setShowAddSlideModal] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState(null);
  const [newSlide, setNewSlide] = useState({
    title: '',
    image: '',
    link: '/courses',
    type: 'course'
  });

  const handleDeleteSlide = (indexToDelete) => {
    const target = heroSlides[indexToDelete];
    const updated = heroSlides.filter((_, i) => i !== indexToDelete);
    setHeroSlides(updated);
    persistAll({ heroSlides: updated });
    setSlideToDelete(null);
    triggerToast(`🗑️ "${target?.title || 'Slide'}" মুছে ফেলা হয়েছে!`);
  };

  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    category: 'Free',
    isBundle: false,
    image: '/master_english_30_days.png',
    description: '',
    salePrice: 0,
    regularPrice: 1500
  });

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    badge: '',
    designation: 'INSTRUCTOR',
    bio: '',
    image: 'https://assets.codervai.com/teachers/1781366052322-cropped-image.webp',
    yt: ''
  });
  const [isDraggingTeacherPhoto, setIsDraggingTeacherPhoto] = useState(false);

  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [previewVideoModal, setPreviewVideoModal] = useState(null);
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [newVideo, setNewVideo] = useState({
    title: '',
    videoId: '',
    desc: ''
  });

  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    category: 'E-book',
    price: 299,
    regularPrice: 599,
    cover: 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp',
    description: 'Exclusive digital study material.'
  });

  const [showAddTrxModal, setShowAddTrxModal] = useState(false);
  const [newTrx, setNewTrx] = useState({
    studentName: '',
    studentPhone: '',
    itemTitle: '',
    type: 'INCOME',
    amount: '',
    method: 'bKash',
    trxId: ''
  });

  const [searchTrx, setSearchTrx] = useState('');
  const [trxFilter, setTrxFilter] = useState('ALL');

  // Curriculum & Course Studio Modal State
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [curriculumCourseIndex, setCurriculumCourseIndex] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const c = params.get('course');
      if (c !== null && !isNaN(Number(c))) {
        return Number(c);
      }
    } catch (e) {}
    return null;
  });
  const [curriculumStudioTab, setCurriculumStudioTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (t) return t;
    } catch (e) {}
    return 'curriculum';
  });
  const [curriculumExpandedSections, setCurriculumExpandedSections] = useState({ 0: true });
  const [newLessonDrafts, setNewLessonDrafts] = useState({});
  const [newFeatureInput, setNewFeatureInput] = useState('');

  // Handle browser back / forward buttons for studio navigation
  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const c = params.get('course');
        if (c !== null && !isNaN(Number(c))) {
          setCurriculumCourseIndex(Number(c));
          const t = params.get('tab');
          if (t) setCurriculumStudioTab(t);
        } else {
          setCurriculumCourseIndex(null);
        }
      } catch (e) {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Trigger Save Notification
  const triggerToast = (msg = '✅ All changes saved and updated live!') => {
    setToastMsg(msg);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // Bunny.net Cloud Integration State & Handlers
  const [bunnyConfig, setBunnyConfig] = useState(() => getBunnyConfig());
  const [bunnyTestResults, setBunnyTestResults] = useState({ stream: null, storage: null, testingStream: false, testingStorage: false });

  const handleUpdateBunnyConfig = (field, value) => {
    setBunnyConfig(prev => {
      const updated = { ...prev, [field]: value };
      saveBunnyConfig(updated);
      return updated;
    });
  };

  const handleTestBunnyStream = async () => {
    setBunnyTestResults(prev => ({ ...prev, testingStream: true, stream: null }));
    const res = await testBunnyStreamConnection(bunnyConfig);
    setBunnyTestResults(prev => ({ ...prev, testingStream: false, stream: res }));
    if (res.success) {
      triggerToast('🟢 Bunny Stream connected successfully!');
    } else {
      triggerToast(`❌ Stream connection: ${res.message}`);
    }
  };

  const handleTestBunnyStorage = async () => {
    setBunnyTestResults(prev => ({ ...prev, testingStorage: true, storage: null }));
    const res = await testBunnyStorageConnection(bunnyConfig);
    setBunnyTestResults(prev => ({ ...prev, testingStorage: false, storage: res }));
    if (res.success) {
      triggerToast('🟢 Bunny Storage connected successfully!');
    } else {
      triggerToast(`❌ Storage connection: ${res.message}`);
    }
  };

  // Central Save & Persist
  const persistAll = (overrides = {}) => {
    const currentCourses = overrides.courses !== undefined ? overrides.courses : courses;
    const currentBatches = overrides.examBatches !== undefined ? overrides.examBatches : (data?.examBatches || initialData.examBatches || []);
    const syncedBatches = currentBatches.map(b => {
      const match = currentCourses.find(c => 
        (c.key && b.key && c.key === b.key) ||
        (c.id && b.key && c.id === b.key) ||
        (c.slug && b.key && c.slug === b.key) ||
        (c.id && b.id && c.id === b.id) ||
        (c.title && b.title && c.title.trim().toLowerCase() === b.title.trim().toLowerCase())
      );
      if (match) {
        return {
          ...b,
          title: match.title || b.title,
          subtitle: match.subtitle || match.description || b.subtitle,
          price: String(match.salePrice || b.price),
          originalPrice: String(match.regularPrice || b.originalPrice),
          image: match.image || b.image,
          isActive: match.isActive !== undefined ? match.isActive : b.isActive
        };
      }
      return b;
    });

    const fullState = {
      ...data,
      _lastUpdated: new Date().toISOString(),
      siteSettings: overrides.siteSettings !== undefined ? overrides.siteSettings : siteSettings,
      announcement: overrides.announcement !== undefined ? overrides.announcement : announcement,
      heroSlides: overrides.heroSlides !== undefined ? overrides.heroSlides : heroSlides,
      homeStats: overrides.homeStats !== undefined ? overrides.homeStats : homeStats,
      categories: overrides.categories !== undefined ? overrides.categories : categories,
      courses: currentCourses,
      bundles: overrides.bundles !== undefined ? overrides.bundles : bundles,
      examBatches: syncedBatches,
      instructors: overrides.instructors !== undefined ? overrides.instructors : instructors,
      freeVideos: overrides.freeVideos !== undefined ? overrides.freeVideos : freeVideos,
      storeProducts: overrides.storeProducts !== undefined ? overrides.storeProducts : storeProducts,
      accounting: overrides.accounting !== undefined ? overrides.accounting : accounting,
      users: overrides.users !== undefined ? overrides.users : usersList,
      sectionTexts: overrides.sectionTexts !== undefined ? overrides.sectionTexts : sectionTexts,
      whyChooseUs: overrides.whyChooseUs !== undefined ? overrides.whyChooseUs : whyChooseUs,
      termsAndConditions: overrides.termsAndConditions !== undefined ? overrides.termsAndConditions : termsAndConditions,
      refundPolicy: overrides.refundPolicy !== undefined ? overrides.refundPolicy : refundPolicy,
      privacyPolicy: overrides.privacyPolicy !== undefined ? overrides.privacyPolicy : privacyPolicy
    };
    onUpdateData(fullState);
    try {
      saveSupabaseSiteData(fullState);
    } catch (e) {}
    return fullState;
  };


  // -------------------------------------------------------------
  // USER MANAGEMENT HANDLERS & ACTIONS
  // -------------------------------------------------------------
  const handleToggleUserStatus = (userId) => {
    const updated = usersList.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        return { ...u, status: newStatus };
      }
      return u;
    });
    setUsersList(updated);
    persistAll({ users: updated });
    triggerToast('User status updated');
  };

  const handleChangeUserRole = (userId, newRole) => {
    const updated = usersList.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsersList(updated);
    persistAll({ users: updated });
    triggerToast(`Role updated to ${newRole}`);
  };

  const handleDeleteUser = (userId, userName) => {
    const targetUser = usersList.find(u => u.id === userId);
    if (confirm(`Are you sure you want to permanently delete user "${userName}"?`)) {
      const updated = usersList.filter(u => u.id !== userId);
      setUsersList(updated);
      persistAll({ users: updated });
      if (selectedUserDetails?.id === userId) setSelectedUserDetails(null);

      // Clean from localStorage registered users
      try {
        const rawReg = localStorage.getItem('eh_registered_users');
        if (rawReg) {
          const list = JSON.parse(rawReg);
          const filtered = list.filter(u => 
            u.id !== userId && 
            u.uid !== userId && 
            (!targetUser?.email || (u.email || '').toLowerCase() !== targetUser.email.toLowerCase())
          );
          localStorage.setItem('eh_registered_users', JSON.stringify(filtered));
        }
      } catch (e) {}

      // Delete permanently from Supabase
      if (isSupabaseConfigured) {
        deleteSupabaseUser(userId, targetUser?.email).catch(e => console.warn('[AdminPanel] Supabase delete user note:', e));
      }

      // User deleted permanently from Supabase eduhunters_users (100% Centralized Cloud)

      triggerToast(`User "${userName}" permanently deleted`);
    }
  };

  const handleOpenEditUser = (user) => {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.whatsapp || user.phone || '',
      whatsapp: user.whatsapp || user.phone || '',
      college: user.college || user.institution || '',
      role: user.role || 'Student',
      status: user.status || 'Active',
      batch: user.hscBatch || user.batch || 'HSC 26',
      totalSpent: user.totalSpent !== undefined ? user.totalSpent : 0,
      password: ''
    });
    setShowAddUserModal(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      triggerToast('Full name and email address are required');
      return;
    }

    if (editingUserId) {
      const targetUser = usersList.find(u => u.id === editingUserId);
      const oldSpent = Number(targetUser?.totalSpent) || 0;
      const newSpent = Number(userForm.totalSpent) || 0;
      const spentDiff = newSpent - oldSpent;

      let savedUserRecord = null;
      const updated = usersList.map(u => {
        if (u.id === editingUserId) {
          savedUserRecord = {
            ...u,
            name: userForm.name.trim(),
            email: userForm.email.trim(),
            phone: userForm.phone.trim(),
            whatsapp: (userForm.whatsapp || userForm.phone).trim(),
            college: (userForm.college || '').trim(),
            institution: (userForm.college || '').trim(),
            role: userForm.role,
            status: userForm.status,
            batch: userForm.batch || 'HSC 26',
            hscBatch: userForm.batch || 'HSC 26',
            totalSpent: newSpent
          };
          return savedUserRecord;
        }
        return u;
      });
      setUsersList(updated);

      // Bidirectional sync: If totalSpent changed, immediately sync with Ledger & Enrolled Students
      let nextAcc = accounting;
      let nextEnrolled = enrolledStudents;

      if (spentDiff !== 0) {
        const uPhone = (userForm.phone || '').replace(/[^0-9]/g, '');
        const uEmail = userForm.email.trim().toLowerCase();

        // 1. Sync Accounting transactions
        let txUpdated = false;
        const nextTxs = (accounting.transactions || []).map(t => {
          const tp = (t.studentPhone || '').replace(/[^0-9]/g, '');
          const te = (t.studentEmail || '').trim().toLowerCase();
          const match = (uPhone && tp && (uPhone.includes(tp) || tp.includes(uPhone))) || (uEmail && te === uEmail);
          const st = (t.status || '').toLowerCase();
          const isComp = st === 'completed' || st === 'paid';
          if (match && isComp && !txUpdated) {
            txUpdated = true;
            const updatedTrxAmt = Math.max(0, (Number(t.amount) || 0) + spentDiff);
            const targetOrderId = t.orderId || t.id;
            if (isSupabaseConfigured && targetOrderId) {
              updateSupabaseOrderAmount(targetOrderId, updatedTrxAmt).catch(() => {});
            }
            return { ...t, amount: updatedTrxAmt };
          }
          return t;
        });

        const newRev = Math.max(0, (Number(accounting.totalRevenue) || 0) + spentDiff);
        const newExp = Number(accounting.totalExpenses) || 0;
        nextAcc = {
          ...accounting,
          totalRevenue: newRev,
          netProfit: newRev - newExp,
          transactions: nextTxs
        };
        setAccounting(nextAcc);

        // 2. Sync Enrolled Students
        nextEnrolled = enrolledStudents.map(st => {
          const sp = (st.phone || '').replace(/[^0-9]/g, '');
          const se = (st.email || '').trim().toLowerCase();
          const match = (uPhone && sp && (uPhone.includes(sp) || sp.includes(uPhone))) || (uEmail && se === uEmail);
          if (match) {
            return { ...st, amount: newSpent };
          }
          return st;
        });
        setEnrolledStudents(nextEnrolled);
      }

      persistAll({ 
        users: updated,
        accounting: nextAcc,
        enrolledStudents: nextEnrolled
      });

      // Sync updated user to Supabase
      if (isSupabaseConfigured && savedUserRecord) {
        saveSupabaseUser({
          uid: savedUserRecord.id || savedUserRecord.uid,
          email: savedUserRecord.email,
          displayName: savedUserRecord.name,
          phone: savedUserRecord.phone,
          role: savedUserRecord.role
        }, {
          totalSpent: savedUserRecord.totalSpent,
          enrolledCourses: savedUserRecord.enrolledCourses || []
        }).catch(e => console.warn('[AdminPanel] Supabase user update note:', e));
      }

      triggerToast(`User "${userForm.name}" updated successfully`);
    } else {
      const newUser = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim() || '',
        whatsapp: (userForm.whatsapp || userForm.phone || '').trim(),
        college: (userForm.college || '').trim(),
        institution: (userForm.college || '').trim(),
        role: userForm.role || 'Student',
        status: userForm.status || 'Active',
        batch: userForm.batch || 'HSC 26',
        hscBatch: userForm.batch || 'HSC 26',
        enrolledCourses: [],
        totalSpent: Number(userForm.totalSpent) || 0,
        joinedDate: 'Today',
        lastActive: 'Just registered',
        device: 'Manual Admin Entry',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userForm.email)}`
      };
      const updated = [newUser, ...usersList];
      setUsersList(updated);
      persistAll({ users: updated });

      if (isSupabaseConfigured) {
        saveSupabaseUser({
          uid: newUser.id,
          email: newUser.email,
          displayName: newUser.name,
          phone: newUser.phone,
          role: newUser.role
        }, {
          totalSpent: newUser.totalSpent,
          enrolledCourses: []
        }).catch(() => {});
      }

      triggerToast(`New user "${userForm.name}" registered`);
    }

    setShowAddUserModal(false);
    setEditingUserId(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      college: '',
      role: 'Student',
      status: 'Active',
      batch: 'HSC 26',
      totalSpent: 0,
      password: ''
    });
  };

  const handleAssignCourseToUser = (userId, selection) => {
    if (!selection) return;

    let coursesToAdd = [];
    let toastLabel = '';

    // Check if selection is a bundle (either 'bundle:id' or bundle title/id)
    const bundleId = selection.startsWith('bundle:') ? selection.replace('bundle:', '') : selection;
    const foundBundle = bundles.find(b => b.id === bundleId || b.title === selection || b.slug === bundleId);

    if (foundBundle) {
      // Combo Bundle: automatically resolve all included courses
      const resolvedIncluded = (foundBundle.courseIds || []).map(cId => {
        const found = courses.find(c => c.id === cId || c.slug === cId || c.key === cId) ||
                      EXAM_CATEGORIES_METADATA.find(b => b.id === cId || b.key === cId);
        return found?.title || cId;
      });

      coursesToAdd = [foundBundle.title, ...resolvedIncluded];
      toastLabel = `"${foundBundle.title}"`;
    } else {
      coursesToAdd = [selection];
      toastLabel = `"${selection}"`;
    }

    const targetUser = usersList.find(u => u.id === userId || u.uid === userId || u.email === userId);

    const updated = usersList.map(u => {
      if (u.id === userId || u.uid === userId || u.email === userId) {
        const current = u.enrolledCourses || [];
        const canonical = getCanonicalCourses([...current, ...coursesToAdd], { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA });
        return { ...u, enrolledCourses: canonical };
      }
      return u;
    });

    setUsersList(updated);
    persistAll({ users: updated });
    grantCourseAccess(selection, { bundles, courses }, targetUser || { id: userId, uid: userId });

    if (selectedUserDetails?.id === userId || selectedUserDetails?.uid === userId) {
      setSelectedUserDetails(prev => ({
        ...prev,
        enrolledCourses: getCanonicalCourses([...(prev.enrolledCourses || []), ...coursesToAdd], { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA })
      }));
    }

    if (quickEnrollUser?.id === userId || quickEnrollUser?.uid === userId) {
      setQuickEnrollUser(prev => ({
        ...prev,
        enrolledCourses: getCanonicalCourses([...(prev.enrolledCourses || []), ...coursesToAdd], { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA })
      }));
    }

    setQuickEnrollUser(null);
    setSelectedCourseToEnroll('');
    triggerToast(`Course access granted: ${toastLabel}`);
  };

  const handleRevokeCourseFromUser = (userId, courseTitle) => {
    const targetUser = usersList.find(u => u.id === userId || u.uid === userId || u.email === userId);
    const normT = (courseTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const updated = usersList.map(u => {
      if (u.id === userId || u.uid === userId || u.email === userId) {
        const filtered = (u.enrolledCourses || []).filter(c => {
          const normC = (c || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return normC !== normT && !normC.includes(normT) && !normT.includes(normC);
        });
        return {
          ...u,
          enrolledCourses: getCanonicalCourses(filtered, { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA })
        };
      }
      return u;
    });

    setUsersList(updated);
    persistAll({ users: updated });
    revokeCourseAccess(courseTitle, { bundles, courses }, targetUser || { id: userId, uid: userId });

    if (selectedUserDetails?.id === userId || selectedUserDetails?.uid === userId) {
      setSelectedUserDetails(prev => ({
        ...prev,
        enrolledCourses: getCanonicalCourses(
          (prev.enrolledCourses || []).filter(c => {
            const normC = (c || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return normC !== normT && !normC.includes(normT) && !normT.includes(normC);
          }),
          { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA }
        )
      }));
    }

    if (quickEnrollUser?.id === userId || quickEnrollUser?.uid === userId) {
      setQuickEnrollUser(prev => ({
        ...prev,
        enrolledCourses: getCanonicalCourses(
          (prev.enrolledCourses || []).filter(c => {
            const normC = (c || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return normC !== normT && !normC.includes(normT) && !normT.includes(normC);
          }),
          { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA }
        )
      }));
    }

    triggerToast(`Access revoked for "${courseTitle}"`);
  };

  const handleExportUsersCSV = () => {
    const headers = ['User ID', 'Full Name', 'Email', 'WhatsApp / Phone', 'College / Institution', 'HSC Batch', 'Role', 'Status', 'Enrolled Courses Count', 'Total Spent (BDT)', 'Joined Date', 'Device'];
    const rows = usersList.map(u => [
      u.id,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      u.email,
      `"${u.whatsapp || u.phone || ''}"`,
      `"${(u.college || u.institution || '').replace(/"/g, '""')}"`,
      `"${(u.hscBatch || u.batch || '').replace(/"/g, '""')}"`,
      u.role,
      u.status,
      getCanonicalCourses(u.enrolledCourses, { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA }).length,
      u.totalSpent || 0,
      u.joinedDate,
      `"${u.device || 'Web'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eduhunters_users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('📥 Exported user directory to CSV!');
  };

  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);
  const handleManualRefreshUsers = async () => {
    try {
      setIsRefreshingUsers(true);
      const users = await fetchSupabaseUsers();
      if (Array.isArray(users) && users.length > 0) {
        users.forEach(u => upsertUserInList(u, false));
        triggerToast(`✓ Users synced (${users.length} profiles from cloud)`);
      } else {
        triggerToast('Users up to date.');
      }
    } catch (e) {
      triggerToast('Failed to refresh users.');
    } finally {
      setTimeout(() => setIsRefreshingUsers(false), 500);
    }
  };

  // -------------------------------------------------------------
  // COURSE BUNDLES MASTER HANDLERS & ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddBundle = () => {
    setActiveStudioBundle({
      id: `bundle-${Date.now()}`,
      title: '',
      subtitle: '',
      description: '',
      image: 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp',
      badge: 'Save 45% • Mega Combo',
      regularPrice: '',
      salePrice: '',
      courseIds: [],
      features: [
        'সবগুলো কোর্সের সম্পূর্ণ অ্যাক্সেস',
        'লেকচার নোট ও স্পেশাল PDF শিট',
        'লাইভ এক্সাম ও মেরিট লিস্ট লিডারবোর্ড'
      ],
      status: 'ACTIVE'
    });
  };

  const handleOpenEditBundle = (bundle) => {
    setActiveStudioBundle({ ...bundle });
  };

  const handleDeleteBundle = (bundleId, bundleTitle) => {
    if (confirm(`Are you sure you want to permanently delete bundle "${bundleTitle}"?`)) {
      const updated = bundles.filter(b => b.id !== bundleId);
      setBundles(updated);
      persistAll({ bundles: updated });
      triggerToast(`Bundle "${bundleTitle}" deleted`);
    }
  };

  const handleToggleBundleStatus = (bundleId) => {
    const updated = bundles.map(b => {
      if (b.id === bundleId) {
        const nextStatus = b.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
        return { ...b, status: nextStatus };
      }
      return b;
    });
    setBundles(updated);
    persistAll({ bundles: updated });
    triggerToast('Bundle status updated');
  };

  const handleDuplicateBundle = (bundle) => {
    const duplicated = {
      ...bundle,
      id: `bundle-${Date.now()}`,
      title: `${bundle.title} (Copy)`,
      status: 'DRAFT'
    };
    const updated = [duplicated, ...bundles];
    setBundles(updated);
    persistAll({ bundles: updated });
    triggerToast(`Duplicated "${bundle.title}" as draft`);
  };

  const handleSaveAll = () => {
    persistAll();
    triggerToast('✅ Database saved and live synced!');
  };

  // Reset to Factory Default
  const handleResetToDefault = () => {
    if (confirm('⚠️ Are you sure you want to reset all data to default factory settings? Custom edits will be overwritten.')) {
      onResetData();
      setSiteSettings(initialData.siteSettings);
      setAnnouncement(initialData.announcement);
      setHeroSlides(initialData.heroSlides);
      setHomeStats(initialData.homeStats);
      setCategories(initialData.categories || [
        "সকল",
        "EXAM BATCH",
        "Medical",
        "Free"
      ]);
      setCourses(initialData.courses);
      setBundles(initialData.bundles || []);
      setInstructors(initialData.instructors);
      setFreeVideos(initialData.freeVideos);
      setStoreProducts(initialData.storeProducts);
      setAccounting(initialData.accounting);
      setSectionTexts(initialData.sectionTexts);
      setWhyChooseUs(initialData.whyChooseUs);
      setTermsAndConditions(initialData.termsAndConditions);
      setRefundPolicy(initialData.refundPolicy);
      setPrivacyPolicy(initialData.privacyPolicy);
      triggerToast('🔄 All data reset to factory default!');
    }
  };

  // Export JSON Backup
  const handleExportData = () => {
    const current = persistAll();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(current, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `eduhunters_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Add Transaction
  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!newTrx.itemTitle || !newTrx.amount) return;
    const amt = Number(newTrx.amount) || 0;
    const item = {
      id: `TRX-${Date.now().toString().slice(-5)}`,
      studentName: newTrx.studentName || 'Manual Entry',
      studentPhone: newTrx.studentPhone || 'N/A',
      itemTitle: newTrx.itemTitle,
      type: newTrx.type,
      amount: amt,
      method: newTrx.method,
      trxId: newTrx.trxId || `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Completed'
    };

    const updatedTrx = [item, ...(accounting.transactions || [])];
    const newRev = newTrx.type === 'INCOME' ? (accounting.totalRevenue || 0) + amt : (accounting.totalRevenue || 0);
    const newExp = newTrx.type === 'EXPENSE' ? (accounting.totalExpenses || 0) + amt : (accounting.totalExpenses || 0);
    const updatedAccounting = {
      ...accounting,
      totalRevenue: newRev,
      totalExpenses: newExp,
      netProfit: newRev - newExp,
      totalOrders: newTrx.type === 'INCOME' ? (accounting.totalOrders || 0) + 1 : (accounting.totalOrders || 0),
      transactions: updatedTrx
    };

    setAccounting(updatedAccounting);
    persistAll({ accounting: updatedAccounting });
    setNewTrx({ studentName: '', studentPhone: '', itemTitle: '', type: 'INCOME', amount: '', method: 'bKash', trxId: '' });
    setShowAddTrxModal(false);
    triggerToast('💰 Transaction added successfully!');
  };

  // Approve Pending Enrollment Transaction
  const handleApproveTrx = (trxId) => {
    const targetTx = (accounting.transactions || []).find(t => t.id === trxId);
    const updated = (accounting.transactions || []).map(t => {
      if (t.id === trxId) return { ...t, status: 'Completed' };
      return t;
    });
    const newAcc = { ...accounting, transactions: updated };
    setAccounting(newAcc);

    // If transaction belongs to a student, auto-grant enrollment to them
    let extraUserUpdates = null;
    let extraStudentUpdates = enrolledStudents;
    if (targetTx) {
      const rawPhone = (targetTx.studentPhone || '').replace(/[^0-9]/g, '');
      const rawName = (targetTx.studentName || '').trim().toLowerCase();
      const rawEmail = (targetTx.studentEmail || '').trim().toLowerCase();

      const matchedTargetUser = usersList.find(u => {
        const uPhone = (u.phone || u.whatsapp || '').replace(/[^0-9]/g, '');
        const uEmail = (u.email || '').trim().toLowerCase();
        const uName = (u.name || '').trim().toLowerCase();
        return isPhoneMatch(rawPhone, uPhone) ||
               (rawEmail && uEmail === rawEmail) ||
               (rawName && (uName === rawName || uName.includes(rawName)));
      });

      const itemTitle = targetTx.itemTitle || '';
      const { courses: grantedCourses } = grantCourseAccess(itemTitle, { bundles, courses }, matchedTargetUser);

      const foundBundle = bundles.find(b => 
        b.title.toLowerCase() === itemTitle.toLowerCase() ||
        itemTitle.toLowerCase().includes(b.title.toLowerCase())
      );

      let coursesToGrant = Array.from(new Set([itemTitle, ...grantedCourses]));
      if (foundBundle) {
        const resolved = (foundBundle.courseIds || []).map(cId => {
          const found = courses.find(c => c.id === cId || c.slug === cId || c.key === cId) ||
                        EXAM_CATEGORIES_METADATA.find(b => b.id === cId || b.key === cId);
          return found?.title || cId;
        });
        coursesToGrant = Array.from(new Set([foundBundle.title, ...resolved, ...coursesToGrant]));
      }

      // Update enrolled students
      const foundSt = enrolledStudents.find(st => {
        const stPhone = (st.phone || '').replace(/[^0-9]/g, '');
        const stEmail = (st.email || '').trim().toLowerCase();
        const stName = (st.name || '').trim().toLowerCase();
        return isPhoneMatch(rawPhone, stPhone) || (rawEmail && stEmail === rawEmail) || (rawName && stName === rawName);
      });
      if (foundSt) {
        extraStudentUpdates = enrolledStudents.map(st => 
          st.id === foundSt.id ? { ...st, status: 'Active', courseName: itemTitle } : st
        );
      } else {
        extraStudentUpdates = [{
          id: `st-${Date.now()}`,
          name: targetTx.studentName || 'Student',
          studentId: `EH-2026-${Math.floor(100 + Math.random() * 900)}`,
          batch: 'HSC 26',
          courseName: itemTitle,
          phone: targetTx.studentPhone || 'N/A',
          email: `${(targetTx.studentName || 'student').toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          status: 'Active',
          joinedDate: 'Today'
        }, ...enrolledStudents];
      }
      setEnrolledStudents(extraStudentUpdates);

      if (rawPhone.length >= 6 || rawEmail || rawName) {
        extraUserUpdates = usersList.map(u => {
          const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
          const uEmail = (u.email || '').trim().toLowerCase();
          const uName = (u.name || '').trim().toLowerCase();
          const matchPhone = isPhoneMatch(rawPhone, uPhone);
          const matchEmail = Boolean(rawEmail && uEmail && uEmail === rawEmail);
          const matchName = Boolean(rawName && (uName === rawName || uName.includes(rawName)));

          if (matchPhone || matchEmail || matchName) {
            const current = u.enrolledCourses || [];
            return {
              ...u,
              status: 'Active',
              enrolledCourses: Array.from(new Set([...current, ...coursesToGrant])),
              totalSpent: (u.totalSpent || 0) + (Number(targetTx.amount) || 0)
            };
          }
          return u;
        });
        setUsersList(extraUserUpdates);
      }

      // Unlock order in orderService & Cloud Firestore and broadcast real-time unlock
      approveOrder(targetTx.orderId || targetTx.id || targetTx.trxId, {
        courseTitle: itemTitle,
        studentPhone: targetTx.studentPhone,
        studentEmail: targetTx.studentEmail,
        studentName: targetTx.studentName,
        amount: targetTx.amount
      });
    }

    persistAll({ 
      accounting: newAcc,
      enrolledStudents: extraStudentUpdates,
      ...(extraUserUpdates ? { users: extraUserUpdates } : {})
    });
    triggerToast('Enrollment approved and courses unlocked successfully');
  };

  // Revoke Approval for a Transaction
  const handleRevokeTrx = (trxId) => {
    const targetTx = (accounting.transactions || []).find(t => t.id === trxId);
    if (!targetTx) return;

    if (confirm(`Are you sure you want to revoke approval for "${targetTx.studentName}" and lock the course?`)) {
      const updated = (accounting.transactions || []).map(t => {
        if (t.id === trxId) return { ...t, status: 'Pending' };
        return t;
      });

      const amt = Number(targetTx.amount) || 0;
      const newRev = Math.max(0, (Number(accounting.totalRevenue) || 0) - amt);
      const newProfit = newRev - (Number(accounting.totalExpenses) || 0);

      const newAcc = {
        ...accounting,
        totalRevenue: newRev,
        netProfit: newProfit,
        transactions: updated
      };
      setAccounting(newAcc);

      // Revoke course access for user
      const rawPhone = (targetTx.studentPhone || '').replace(/[^0-9]/g, '');
      const rawEmail = (targetTx.studentEmail || '').trim().toLowerCase();
      const matchedTargetUser = usersList.find(u => {
        const uPhone = (u.phone || u.whatsapp || '').replace(/[^0-9]/g, '');
        const uEmail = (u.email || '').trim().toLowerCase();
        return (rawPhone.length >= 6 && uPhone.includes(rawPhone)) || (rawEmail && uEmail === rawEmail);
      });

      if (targetTx.itemTitle) {
        revokeCourseAccess(targetTx.itemTitle, { bundles, courses }, matchedTargetUser);
      }

      // Update enrolled students list
      const updatedStudents = enrolledStudents.map(st => {
        const stPhone = (st.phone || '').replace(/[^0-9]/g, '');
        const stEmail = (st.email || '').trim().toLowerCase();
        const isMatch = (rawPhone.length >= 6 && stPhone.includes(rawPhone)) || (rawEmail && stEmail === rawEmail);
        return isMatch ? { ...st, status: 'Pending' } : st;
      });
      setEnrolledStudents(updatedStudents);

      // Update Supabase order
      const targetOrderId = targetTx.orderId || (targetTx.id.startsWith('ord_') ? targetTx.id : (targetTx.id.startsWith('TRX-ord_') ? targetTx.id.replace('TRX-', '') : targetTx.id));
      if (isSupabaseConfigured && targetOrderId) {
        updateSupabaseOrderStatus(targetOrderId, { status: 'PENDING', isApproved: false }).catch(() => {});
      }

      persistAll({
        accounting: newAcc,
        enrolledStudents: updatedStudents
      });

      triggerToast('Enrollment approval revoked and course locked');
    }
  };

  // Permanently Delete a Transaction
  const handleDeleteTrx = (trxId) => {
    const targetTx = (accounting.transactions || []).find(t => t.id === trxId);
    if (!targetTx) return;

    if (confirm(`Are you sure you want to permanently delete transaction "${targetTx.id}"?`)) {
      const updated = (accounting.transactions || []).filter(t => t.id !== trxId);
      const isIncome = targetTx.type === 'INCOME' || !targetTx.type;
      const isCompleted = targetTx.status === 'Completed';
      const amt = Number(targetTx.amount) || 0;
      const diff = (isIncome && isCompleted) ? -amt : 0;
      const expDiff = targetTx.type === 'EXPENSE' ? -amt : 0;

      const newRev = Math.max(0, (Number(accounting.totalRevenue) || 0) + diff);
      const newExp = Math.max(0, (Number(accounting.totalExpenses) || 0) + expDiff);

      const newAcc = {
        ...accounting,
        totalRevenue: newRev,
        totalExpenses: newExp,
        netProfit: newRev - newExp,
        totalOrders: Math.max(0, (Number(accounting.totalOrders) || updated.length) - (isIncome ? 1 : 0)),
        transactions: updated
      };

      setAccounting(newAcc);

      // 1. Record permanent tombstones in both eh_deleted_orders and eh_deleted_transactions
      try {
        const deletedOrders = JSON.parse(localStorage.getItem('eh_deleted_orders') || '[]');
        const deletedTxs = JSON.parse(localStorage.getItem('eh_deleted_transactions') || '[]');
        const rawId = typeof targetTx.id === 'string' ? targetTx.id.replace(/^(TRX-|st-)/, '') : null;
        const rawOrderId = typeof targetTx.orderId === 'string' ? targetTx.orderId.replace(/^(TRX-|st-)/, '') : null;
        const toAdd = [
          trxId,
          targetTx.id,
          targetTx.orderId,
          rawId,
          rawOrderId,
          targetTx.invoiceNumber,
          targetTx.trxId && targetTx.trxId !== 'PENDING' ? targetTx.trxId : null
        ].filter(Boolean);

        const newDelOrders = Array.from(new Set([...deletedOrders, ...toAdd]));
        const newDelTxs = Array.from(new Set([...deletedTxs, ...toAdd]));
        localStorage.setItem('eh_deleted_orders', JSON.stringify(newDelOrders));
        localStorage.setItem('eh_deleted_transactions', JSON.stringify(newDelTxs));
      } catch (e) {}

      // 2. Remove matching student from enrolledStudents state & localStorage immediately
      const nextStudents = enrolledStudents.filter(st => {
        const cleanStPhone = (st.phone || '').replace(/[^0-9]/g, '');
        const cleanTxPhone = (targetTx.studentPhone || '').replace(/[^0-9]/g, '');
        const cleanStEmail = (st.email || '').trim().toLowerCase();
        const cleanTxEmail = (targetTx.studentEmail || '').trim().toLowerCase();
        const isMatch = st.id === trxId ||
                        st.id === targetTx.id ||
                        st.orderId === targetTx.orderId ||
                        (typeof st.id === 'string' && typeof targetTx.id === 'string' && st.id.replace(/^(TRX-|st-)/, '') === targetTx.id.replace(/^(TRX-|st-)/, '')) ||
                        (st.trxId && targetTx.trxId && st.trxId !== 'PENDING' && st.trxId === targetTx.trxId) ||
                        (cleanTxPhone && cleanStPhone && cleanTxPhone === cleanStPhone && (st.courseName === targetTx.itemTitle || st.courseName === targetTx.category)) ||
                        (cleanTxEmail && cleanStEmail && cleanTxEmail === cleanStEmail && (st.courseName === targetTx.itemTitle || st.courseName === targetTx.category));
        return !isMatch;
      });
      setEnrolledStudents(nextStudents);
      try {
        localStorage.setItem('eh_enrolled_students', JSON.stringify(nextStudents));
      } catch (e) {}

      // 3. Clean from localStorage eh_user_orders_v3
      try {
        const rawOrders = localStorage.getItem('eh_user_orders_v3');
        if (rawOrders) {
          const ords = JSON.parse(rawOrders);
          const rawId = typeof targetTx.id === 'string' ? targetTx.id.replace(/^(TRX-|st-)/, '') : '';
          const filteredOrds = ords.filter(o => {
            const rawOId = typeof o.id === 'string' ? o.id.replace(/^(TRX-|st-)/, '') : '';
            return o.id !== trxId && 
                   o.id !== targetTx.id && 
                   o.id !== targetTx.orderId && 
                   (!rawId || rawOId !== rawId) &&
                   o.invoiceNumber !== targetTx.invoiceNumber && 
                   (targetTx.trxId === 'PENDING' || o.transactionId !== targetTx.trxId);
          });
          localStorage.setItem('eh_user_orders_v3', JSON.stringify(filteredOrds));
        }
      } catch (e) {}

      // 4. Remove from eh_trx_amount_overrides
      try {
        const overrides = JSON.parse(localStorage.getItem('eh_trx_amount_overrides') || '{}');
        delete overrides[trxId];
        delete overrides[targetTx.id];
        delete overrides[targetTx.orderId];
        const rawId = typeof targetTx.id === 'string' ? targetTx.id.replace(/^(TRX-|st-)/, '') : '';
        if (rawId) delete overrides[rawId];
        localStorage.setItem('eh_trx_amount_overrides', JSON.stringify(overrides));
      } catch (e) {}

      // 5. Delete permanently from Supabase
      const targetOrderId = targetTx.orderId || (targetTx.id.startsWith('ord_') ? targetTx.id : (targetTx.id.startsWith('TRX-ord_') ? targetTx.id.replace('TRX-', '') : targetTx.id));
      if (isSupabaseConfigured && targetOrderId) {
        deleteSupabaseOrder(targetOrderId, {
          studentPhone: targetTx.studentPhone,
          studentEmail: targetTx.studentEmail,
          invoiceNumber: targetTx.invoiceNumber,
          trxId: targetTx.trxId
        }).catch(e => console.warn('[AdminPanel] Supabase delete order note:', e));
      }

      persistAll({
        accounting: newAcc,
        enrolledStudents: nextStudents
      });

      triggerToast('Transaction permanently deleted');
    }
  };

  // Toggle Student Status (Active <-> Pending) with Full Cloud & Access Synchronization
  const handleToggleStudentStatus = async (studentId) => {
    const st = enrolledStudents.find(item => item.id === studentId);
    if (!st) return;

    const nextStatus = st.status === 'Active' ? 'Pending' : 'Active';
    const isNowActive = nextStatus === 'Active';

    // 1. Update enrolledStudents state & localStorage
    const nextStudents = enrolledStudents.map(item => item.id === studentId ? { ...item, status: nextStatus } : item);
    setEnrolledStudents(nextStudents);
    try {
      localStorage.setItem('eh_enrolled_students', JSON.stringify(nextStudents));
    } catch (e) {}

    // 2. Identify target orderId & transaction
    const targetOrderId = st.orderId || (st.id.startsWith('st-ord_') ? st.id.replace('st-', '') : (st.id.startsWith('ord_') ? st.id : null));
    const targetTx = (accounting.transactions || []).find(t => 
      t.orderId === targetOrderId || 
      (t.studentPhone && isPhoneMatch(t.studentPhone, st.phone) && t.itemTitle === st.courseName) ||
      (t.trxId && st.trxId && t.trxId !== 'PENDING' && t.trxId === st.trxId)
    );
    const resolvedOrderId = targetOrderId || targetTx?.orderId || (targetTx?.id?.startsWith('ord_') ? targetTx.id : (targetTx?.id?.startsWith('TRX-ord_') ? targetTx.id.replace('TRX-', '') : null));

    // 3. Match user to grant or revoke course access
    const rawPhone = (st.phone || '').replace(/[^0-9]/g, '');
    const rawEmail = (st.email || '').trim().toLowerCase();
    const matchedUser = usersList.find(u => {
      const uPhone = (u.phone || u.whatsapp || '').replace(/[^0-9]/g, '');
      const uEmail = (u.email || '').trim().toLowerCase();
      return isPhoneMatch(rawPhone, uPhone) || (rawEmail && uEmail === rawEmail);
    });

    if (isNowActive) {
      // Grant course access & unlock
      if (st.courseName) {
        grantCourseAccess(st.courseName, { bundles, courses }, matchedUser);
      }
      if (resolvedOrderId) {
        approveOrder(resolvedOrderId, {
          courseTitle: st.courseName,
          studentPhone: st.phone,
          studentEmail: st.email,
          studentName: st.name,
          amount: st.amount
        });
        if (isSupabaseConfigured) {
          updateSupabaseOrderStatus(resolvedOrderId, { status: 'PAID', isApproved: true, is_approved: true }).catch(() => {});
        }
      }
    } else {
      // Revoke course access & lock
      if (st.courseName) {
        revokeCourseAccess(st.courseName, { bundles, courses }, matchedUser);
      }
      if (resolvedOrderId) {
        if (isSupabaseConfigured) {
          updateSupabaseOrderStatus(resolvedOrderId, { status: 'PENDING', isApproved: false, is_approved: false }).catch(() => {});
        }
      }
      // Update eh_user_orders_v3 in localStorage
      try {
        const rawOrders = localStorage.getItem('eh_user_orders_v3');
        if (rawOrders) {
          const ords = JSON.parse(rawOrders);
          const nextOrds = ords.map(o => {
            if (o.id === resolvedOrderId || (isPhoneMatch(o.customer?.phone, st.phone) && (o.course?.name === st.courseName || o.items?.[0]?.title === st.courseName))) {
              return { ...o, status: 'PENDING', isApproved: false };
            }
            return o;
          });
          localStorage.setItem('eh_user_orders_v3', JSON.stringify(nextOrds));
        }
      } catch (e) {}
    }

    // 4. Update accounting transactions
    let updatedAccounting = accounting;
    if (targetTx) {
      const updatedTxs = (accounting.transactions || []).map(t => {
        if (t.id === targetTx.id) {
          return { ...t, status: isNowActive ? 'Completed' : 'Pending' };
        }
        return t;
      });
      const amt = Number(targetTx.amount) || Number(st.amount) || 0;
      const revDiff = isNowActive ? amt : -amt;
      const newRev = Math.max(0, (Number(accounting.totalRevenue) || 0) + revDiff);
      const newProfit = newRev - (Number(accounting.totalExpenses) || 0);

      updatedAccounting = {
        ...accounting,
        totalRevenue: newRev,
        netProfit: newProfit,
        transactions: updatedTxs
      };
      setAccounting(updatedAccounting);
    }

    // 5. Persist to cloud & local storage
    persistAll({
      accounting: updatedAccounting,
      enrolledStudents: nextStudents
    });

    triggerToast(isNowActive ? `✅ ${st.name} approved & course unlocked!` : `🔒 ${st.name} status set to Pending & locked`);
  };

  // Permanently Delete a Student from Cloud Database & Local Storage
  const handleDeleteStudent = async (studentId) => {
    const st = enrolledStudents.find(item => item.id === studentId);
    if (!st) return;

    if (!confirm(`Are you sure you want to permanently delete "${st.name}" from the student database and cloud?`)) {
      return;
    }

    // 1. Filter out from enrolledStudents state & localStorage
    const nextStudents = enrolledStudents.filter(item => item.id !== studentId);
    setEnrolledStudents(nextStudents);
    try {
      localStorage.setItem('eh_enrolled_students', JSON.stringify(nextStudents));
    } catch (e) {}

    // 2. Resolve target orderId & mark as deleted to prevent resurrection
    const targetOrderId = st.orderId || (st.id.startsWith('st-ord_') ? st.id.replace('st-', '') : (st.id.startsWith('ord_') ? st.id : null));
    const targetTx = (accounting.transactions || []).find(t => 
      t.orderId === targetOrderId || 
      (t.studentPhone && isPhoneMatch(t.studentPhone, st.phone) && t.itemTitle === st.courseName) ||
      (t.trxId && st.trxId && t.trxId !== 'PENDING' && t.trxId === st.trxId)
    );
    const resolvedOrderId = targetOrderId || targetTx?.orderId || (targetTx?.id?.startsWith('ord_') ? targetTx.id : (targetTx?.id?.startsWith('TRX-ord_') ? targetTx.id.replace('TRX-', '') : null));

    // Record in deleted lists (orders & transactions) with stripped aliases to permanently prevent resurrection on refresh
    try {
      const deletedOrders = JSON.parse(localStorage.getItem('eh_deleted_orders') || '[]');
      const deletedTxs = JSON.parse(localStorage.getItem('eh_deleted_transactions') || '[]');
      const toAdd = [
        resolvedOrderId,
        studentId,
        targetTx?.id,
        targetTx?.orderId,
        st.id,
        st.orderId,
        typeof studentId === 'string' ? studentId.replace(/^(TRX-|st-)/, '') : null,
        typeof resolvedOrderId === 'string' ? resolvedOrderId.replace(/^(TRX-|st-)/, '') : null,
        targetTx?.trxId && targetTx.trxId !== 'PENDING' ? targetTx.trxId : null,
        targetTx?.invoiceNumber
      ].filter(Boolean);

      const newDelOrders = Array.from(new Set([...deletedOrders, ...toAdd]));
      const newDelTxs = Array.from(new Set([...deletedTxs, ...toAdd]));
      localStorage.setItem('eh_deleted_orders', JSON.stringify(newDelOrders));
      localStorage.setItem('eh_deleted_transactions', JSON.stringify(newDelTxs));
    } catch (e) {}

    // Clean from eh_trx_amount_overrides
    try {
      const overrides = JSON.parse(localStorage.getItem('eh_trx_amount_overrides') || '{}');
      if (studentId) delete overrides[studentId];
      if (resolvedOrderId) delete overrides[resolvedOrderId];
      if (targetTx?.id) delete overrides[targetTx.id];
      if (targetTx?.orderId) delete overrides[targetTx.orderId];
      const strippedStId = typeof studentId === 'string' ? studentId.replace(/^(TRX-|st-)/, '') : '';
      if (strippedStId) delete overrides[strippedStId];
      localStorage.setItem('eh_trx_amount_overrides', JSON.stringify(overrides));
    } catch (e) {}

    // 3. Delete from Supabase eduhunters_orders
    if (isSupabaseConfigured && (resolvedOrderId || studentId)) {
      deleteSupabaseOrder(resolvedOrderId || studentId, {
        studentPhone: st.phone,
        studentEmail: st.email,
        trxId: st.trxId
      }).catch(e => console.warn('[AdminPanel] Supabase delete order note:', e));
    }

    // 4. Order deleted permanently from Supabase eduhunters_orders (100% Centralized Cloud)

    // 5. Revoke course access for user profile
    const rawPhone = (st.phone || '').replace(/[^0-9]/g, '');
    const rawEmail = (st.email || '').trim().toLowerCase();
    const matchedUser = usersList.find(u => {
      const uPhone = (u.phone || u.whatsapp || '').replace(/[^0-9]/g, '');
      const uEmail = (u.email || '').trim().toLowerCase();
      return isPhoneMatch(rawPhone, uPhone) || (rawEmail && uEmail === rawEmail);
    });
    if (st.courseName) {
      revokeCourseAccess(st.courseName, { bundles, courses }, matchedUser);
    }

    // 6. Delete from eh_user_orders_v3
    try {
      const rawOrders = localStorage.getItem('eh_user_orders_v3');
      if (rawOrders) {
        const ords = JSON.parse(rawOrders);
        const filteredOrds = ords.filter(o => 
          o.id !== resolvedOrderId && 
          o.id !== studentId && 
          !(isPhoneMatch(o.customer?.phone, st.phone) && (o.course?.name === st.courseName || o.items?.[0]?.title === st.courseName))
        );
        localStorage.setItem('eh_user_orders_v3', JSON.stringify(filteredOrds));
      }
    } catch (e) {}

    // 7. Update accounting transactions
    let updatedAccounting = accounting;
    if (targetTx) {
      const updatedTxs = (accounting.transactions || []).filter(t => t.id !== targetTx.id);
      const isCompleted = targetTx.status === 'Completed';
      const amt = Number(targetTx.amount) || Number(st.amount) || 0;
      const diff = isCompleted ? -amt : 0;
      const newRev = Math.max(0, (Number(accounting.totalRevenue) || 0) + diff);
      const newProfit = newRev - (Number(accounting.totalExpenses) || 0);

      updatedAccounting = {
        ...accounting,
        totalRevenue: newRev,
        netProfit: newProfit,
        totalOrders: Math.max(0, (accounting.totalOrders || 1) - 1),
        transactions: updatedTxs
      };
      setAccounting(updatedAccounting);
    }

    // 8. Persist all
    persistAll({
      accounting: updatedAccounting,
      enrolledStudents: nextStudents
    });

    triggerToast(`🗑️ ${st.name} permanently removed from cloud database & student list`);
  };

  // Save Inline Amount for Transaction
  const handleSaveTrxAmount = (trxId) => {
    const newAmt = Number(editingTrxAmountVal);
    if (isNaN(newAmt) || newAmt < 0) {
      triggerToast('Please enter a valid amount');
      return;
    }

    const targetTx = (accounting.transactions || []).find(t => t.id === trxId);
    if (!targetTx) return;

    const oldAmt = Number(targetTx.amount) || 0;
    const diff = newAmt - oldAmt;

    const updated = (accounting.transactions || []).map(t => {
      if (t.id === trxId) return { ...t, amount: newAmt };
      return t;
    });

    const isCompleted = (targetTx.status || '').toLowerCase() === 'completed' || (targetTx.status || '').toLowerCase() === 'paid' || Boolean(targetTx.isApproved);
    const isIncome = (targetTx.type || '').toUpperCase() === 'INCOME' || !targetTx.type;
    const revDiff = (isIncome && isCompleted) ? diff : 0;
    const expDiff = (targetTx.type || '').toUpperCase() === 'EXPENSE' ? diff : 0;

    const newRev = Math.max(0, (Number(accounting.totalRevenue) || 0) + revDiff);
    const newExp = Math.max(0, (Number(accounting.totalExpenses) || 0) + expDiff);

    const newAcc = {
      ...accounting,
      totalRevenue: newRev,
      totalExpenses: newExp,
      netProfit: newRev - newExp,
      transactions: updated
    };

    setAccounting(newAcc);
    setEditingTrxAmountId(null);
    setEditingTrxAmountVal('');

    // Persist to eh_trx_amount_overrides so refresh/cloud sync can NEVER revert the amount
    try {
      const overrides = JSON.parse(localStorage.getItem('eh_trx_amount_overrides') || '{}');
      overrides[trxId] = newAmt;
      if (targetTx.id) overrides[targetTx.id] = newAmt;
      if (targetTx.orderId) overrides[targetTx.orderId] = newAmt;
      if (targetTx.trxId && targetTx.trxId !== 'PENDING') overrides[targetTx.trxId] = newAmt;
      if (targetTx.invoiceNumber) overrides[targetTx.invoiceNumber] = newAmt;
      const strippedId = typeof targetTx.id === 'string' ? targetTx.id.replace(/^(TRX-|st-)/, '') : '';
      if (strippedId) overrides[strippedId] = newAmt;
      const strippedOrderId = typeof targetTx.orderId === 'string' ? targetTx.orderId.replace(/^(TRX-|st-)/, '') : '';
      if (strippedOrderId) overrides[strippedOrderId] = newAmt;
      localStorage.setItem('eh_trx_amount_overrides', JSON.stringify(overrides));
    } catch (e) {}

    // Sync to selectedTxDetails if currently viewed in modal
    setSelectedTxDetails(prev => (prev && prev.id === trxId) ? { ...prev, amount: newAmt } : prev);

    // Sync to enrolledStudents with direct ID and contact matching
    const cleanPhone = (targetTx.studentPhone || '').replace(/[^0-9]/g, '');
    const cleanEmail = (targetTx.studentEmail || '').trim().toLowerCase();
    const strippedTargetId = typeof targetTx.id === 'string' ? targetTx.id.replace(/^(TRX-|st-)/, '') : '';

    const nextEnrolled = enrolledStudents.map(st => {
      const strippedStId = typeof st.id === 'string' ? st.id.replace(/^(TRX-|st-)/, '') : '';
      const isDirectMatch = st.id === trxId ||
                            st.id === targetTx.id ||
                            st.orderId === targetTx.orderId ||
                            (strippedTargetId && strippedStId && strippedTargetId === strippedStId) ||
                            (st.trxId && targetTx.trxId && st.trxId !== 'PENDING' && st.trxId === targetTx.trxId);
      const stPhone = (st.phone || '').replace(/[^0-9]/g, '');
      const stEmail = (st.email || '').trim().toLowerCase();
      const isContactMatch = (cleanPhone && stPhone && (cleanPhone.includes(stPhone) || stPhone.includes(cleanPhone))) ||
                            (cleanEmail && stEmail === cleanEmail);
      if (isDirectMatch || isContactMatch) {
        return { ...st, amount: newAmt };
      }
      return st;
    });
    setEnrolledStudents(nextEnrolled);
    try {
      localStorage.setItem('eh_enrolled_students', JSON.stringify(nextEnrolled));
    } catch (e) {}

    // Sync to usersList (totalSpent)
    let userUpdated = false;
    const nextUsers = usersList.map(u => {
      const uPhone = (u.phone || u.whatsapp || '').replace(/[^0-9]/g, '');
      const uEmail = (u.email || '').trim().toLowerCase();
      const match = (cleanPhone && uPhone && (cleanPhone.includes(uPhone) || uPhone.includes(cleanPhone))) ||
                    (cleanEmail && uEmail === cleanEmail);
      if (match) {
        userUpdated = true;
        const curSpent = Number(u.totalSpent) || 0;
        const nextSpent = Math.max(0, curSpent + (isCompleted ? diff : 0));
        return { ...u, totalSpent: nextSpent };
      }
      return u;
    });
    if (userUpdated) {
      setUsersList(nextUsers);
    }

    // Update in Supabase
    const targetOrderId = targetTx.orderId || (targetTx.id.startsWith('ord_') ? targetTx.id : (targetTx.id.startsWith('TRX-ord_') ? targetTx.id.replace('TRX-', '') : targetTx.id));
    if (isSupabaseConfigured && targetOrderId) {
      updateSupabaseOrderAmount(targetOrderId, newAmt, {
        studentPhone: targetTx.studentPhone,
        studentEmail: targetTx.studentEmail,
        trxId: targetTx.trxId,
        invoiceNumber: targetTx.invoiceNumber
      }).catch(() => {});
    }

    // Update in localStorage orders
    try {
      const rawOrders = localStorage.getItem('eh_user_orders_v3');
      if (rawOrders) {
        const ords = JSON.parse(rawOrders);
        const nextOrds = ords.map(o => {
          const strippedOId = typeof o.id === 'string' ? o.id.replace(/^(TRX-|st-)/, '') : '';
          const isDirect = o.id === targetOrderId || o.id === trxId || o.id === targetTx.id || o.id === targetTx.orderId || (strippedTargetId && strippedOId === strippedTargetId) || o.invoiceNumber === targetTx.invoiceNumber || (targetTx.trxId !== 'PENDING' && o.transactionId === targetTx.trxId);
          if (isDirect) {
            return { ...o, totalPaid: newAmt, amount: newAmt };
          }
          return o;
        });
        localStorage.setItem('eh_user_orders_v3', JSON.stringify(nextOrds));
      }
    } catch (e) {}

    persistAll({ 
      accounting: newAcc,
      enrolledStudents: nextEnrolled,
      users: nextUsers
    });
    triggerToast(`Amount updated to ৳${newAmt}`);
  };

  // Open full student profile modal from a transaction record
  const handleOpenStudentFromTrx = (tx) => {
    if (!tx) return;
    const rawPhone = (tx.studentPhone || '').replace(/[^0-9]/g, '');
    const rawEmail = (tx.studentEmail || '').trim().toLowerCase();
    const matched = usersList.find(u => {
      const uPhone = (u.phone || u.whatsapp || '').replace(/[^0-9]/g, '');
      const uEmail = (u.email || '').trim().toLowerCase();
      return (rawPhone && rawPhone.length >= 6 && uPhone.includes(rawPhone)) || (rawEmail && uEmail === rawEmail);
    });

    if (matched) {
      setSelectedUserDetails(matched);
    } else {
      setSelectedUserDetails({
        id: tx.orderId || tx.id,
        name: tx.studentName || 'Student',
        email: tx.studentEmail || 'N/A',
        phone: tx.studentPhone || '',
        whatsapp: tx.studentPhone || '',
        role: 'Student',
        status: tx.status === 'Completed' ? 'Active' : 'Pending',
        batch: 'HSC 26',
        totalSpent: Number(tx.amount) || 0,
        enrolledCourses: [tx.itemTitle].filter(Boolean),
        joinedDate: tx.date || 'Recently',
        device: 'Web Client',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(tx.studentEmail || tx.studentName || 'student')}`
      });
    }
  };

  // Add Slide
  const handleAddSlide = (e) => {
    e.preventDefault();
    if (!newSlide.title) {
      triggerToast('Please enter a banner title');
      return;
    }
    if (!newSlide.image) {
      triggerToast('Please select a banner image from your device');
      return;
    }
    const item = { id: Date.now(), ...newSlide };
    const updated = [item, ...heroSlides];
    setHeroSlides(updated);
    persistAll({ heroSlides: updated });
    setNewSlide({ title: '', image: '', link: '/courses', type: 'course' });
    setShowAddSlideModal(false);
    triggerToast('🎡 Hero slide added successfully!');
  };

  // Add Course
  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!newCourse.title) return;
    const item = {
      id: `course-${Date.now()}`,
      slug: newCourse.title.toLowerCase().replace(/\s+/g, '-'),
      ...newCourse,
      isActive: true,
      category: newCourse.category || categories.find(c => !isAllCat(c)) || 'Medical',
      salePrice: Number(newCourse.salePrice) || 0,
      regularPrice: Number(newCourse.regularPrice) || (Number(newCourse.salePrice) * 2)
    };
    const updated = [item, ...courses];
    setCourses(updated);
    persistAll({ courses: updated });
    setNewCourse({
      title: '',
      category: 'Free',
      isBundle: false,
      image: '/master_english_30_days.png',
      description: '',
      salePrice: 0,
      regularPrice: 1500
    });
    setShowAddCourseModal(false);
    triggerToast('📚 New course created successfully!');
  };

  // ==========================================
  // CATEGORY MANAGEMENT HANDLERS
  // ==========================================
  const handleAddCategory = (e) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      triggerToast('⚠️ Please enter a category name');
      return;
    }
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      triggerToast('⚠️ This category already exists');
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    persistAll({ categories: updated });
    setNewCategoryName('');
    triggerToast(`✅ Category "${trimmed}" added successfully!`);
  };

  const handleDeleteCategory = (catToDelete) => {
    if (isAllCat(catToDelete)) {
      triggerToast('⚠️ "All" is a default system filter and cannot be deleted');
      return;
    }
    const coursesCount = courses.filter(c => c.category === catToDelete).length;
    let confirmMsg = `Are you sure you want to delete category "${catToDelete}"?`;
    if (coursesCount > 0) {
      confirmMsg += `\n\nWarning: ${coursesCount} courses belong to this category. Deleting it will reassign them to another category.`;
    }
    if (!confirm(confirmMsg)) return;

    const updatedCategories = categories.filter(c => c !== catToDelete);
    const fallbackCat = updatedCategories.find(c => !isAllCat(c)) || 'EXAM BATCH';
    const updatedCourses = courses.map(c => c.category === catToDelete ? { ...c, category: fallbackCat } : c);

    setCategories(updatedCategories);
    setCourses(updatedCourses);
    persistAll({ categories: updatedCategories, courses: updatedCourses });
    if (adminCourseCategoryFilter === catToDelete) {
      setAdminCourseCategoryFilter('All');
    }
    triggerToast(`🗑️ Category "${catToDelete}" deleted successfully!`);
  };

  const handleStartEditCategory = (idx, name) => {
    if (isAllCat(name)) {
      triggerToast('⚠️ "All" is a core system filter and cannot be renamed');
      return;
    }
    setEditingCategoryIdx(idx);
    setEditingCategoryValue(name);
  };

  const handleSaveEditCategory = (idx) => {
    const oldName = categories[idx];
    const newName = editingCategoryValue.trim();
    if (!newName || newName === oldName) {
      setEditingCategoryIdx(null);
      return;
    }
    if (categories.some((c, i) => i !== idx && c.toLowerCase() === newName.toLowerCase())) {
      triggerToast('⚠️ A category with this name already exists');
      return;
    }

    const updatedCategories = categories.map((c, i) => i === idx ? newName : c);
    // Auto-update all courses that belonged to old category name
    const updatedCourses = courses.map(c => c.category === oldName ? { ...c, category: newName } : c);

    setCategories(updatedCategories);
    setCourses(updatedCourses);
    persistAll({ categories: updatedCategories, courses: updatedCourses });
    if (adminCourseCategoryFilter === oldName) {
      setAdminCourseCategoryFilter(newName);
    }
    setEditingCategoryIdx(null);
    setEditingCategoryValue('');
    triggerToast(`✏️ Renamed "${oldName}" to "${newName}"!`);
  };


  // Handler for opening Edit Course Details Modal
  const handleOpenEditCourseModal = (course, index) => {
    setEditingCourseData({
      index,
      title: course.title || '',
      category: course.category || (categories.find(c => !isAllCat(c)) || 'Medical'),
      salePrice: course.salePrice || 0,
      regularPrice: course.regularPrice || (course.salePrice ? course.salePrice * 2 : 0),
      isBundle: Boolean(course.isBundle),
      image: course.image || ''
    });
  };

  const handleSaveCourseDetailsModal = (e) => {
    e.preventDefault();
    if (!editingCourseData) return;
    const { index, title, category, salePrice, regularPrice, isBundle, image } = editingCourseData;
    const updated = courses.map((c, i) => i === index ? {
      ...c,
      title: title.trim(),
      category,
      salePrice: Number(salePrice) || 0,
      regularPrice: Number(regularPrice) || 0,
      isBundle: Boolean(isBundle),
      image: image || c.image
    } : c);
    setCourses(updated);
    persistAll({ courses: updated });
    setEditingCourseData(null);
    triggerToast('✅ Course details saved successfully!');
  };

  const handleCourseCategoryChange = (courseIdx, newCat) => {
    const updated = courses.map((c, i) => i === courseIdx ? { ...c, category: newCat } : c);
    setCourses(updated);
    persistAll({ categories, courses: updated });
    triggerToast(`✅ Course category changed to: ${newCat}`);
  };

  const handleToggleCourseActive = (targetCourse, targetIdx) => {
    const nextActive = targetCourse.isActive === false ? true : false;
    const updated = courses.map((c, i) => {
      const isMatch = (targetCourse.id && c.id && targetCourse.id === c.id) ||
                      (targetCourse.slug && c.slug && targetCourse.slug === c.slug) ||
                      (targetCourse.key && c.key && targetCourse.key === c.key) ||
                      (targetCourse.title && c.title && targetCourse.title.trim().toLowerCase() === c.title.trim().toLowerCase()) ||
                      (i === targetIdx);
      return isMatch ? { ...c, isActive: nextActive } : c;
    });
    setCourses(updated);

    const currentBatches = (data?.examBatches && data.examBatches.length > 0) ? data.examBatches : (initialData.examBatches || EXAM_CATEGORIES_METADATA);
    const updatedBatches = currentBatches.map(b => {
      const isMatch = (targetCourse.key && b.key && targetCourse.key === b.key) ||
                      (targetCourse.id && b.key && targetCourse.id === b.key) ||
                      (targetCourse.id && b.id && targetCourse.id === b.id) ||
                      (targetCourse.slug && b.key && targetCourse.slug === b.key) ||
                      (targetCourse.title && b.title && targetCourse.title.trim().toLowerCase() === b.title.trim().toLowerCase());
      return isMatch ? { ...b, isActive: nextActive } : b;
    });

    persistAll({ courses: updated, examBatches: updatedBatches });
    // Targeted lightweight cloud save to guarantee instant Firestore persistence
    saveCloudData({ courses: updated, examBatches: updatedBatches });
    triggerToast(nextActive ? `🟢 "${targetCourse.title}" Activated` : `⚪ "${targetCourse.title}" Deactivated`);
  };

  // ==========================================
  // TRXID VERIFICATION & MANUAL ENROLLMENT HANDLERS
  // ==========================================
  const handleCopyText = (text, type = 'trxId') => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(String(text)).catch(() => {});
    }
    if (type === 'trxId') {
      setCopiedTrxId(text);
      setTimeout(() => setCopiedTrxId(null), 2000);
    } else if (type === 'phone') {
      setCopiedPhone(text);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
    triggerToast(`📋 Copied ${type === 'trxId' ? 'TrxID' : 'Phone'}: ${text}`);
  };

  // Bulk Verify All Pending Transactions
  // Bulk Verify All Pending Transactions
  const handleVerifyAllPending = () => {
    const pendingTxs = (accounting?.transactions || []).filter(t => t.type === 'INCOME' && t.status === 'Pending');
    if (pendingTxs.length === 0) {
      triggerToast('No pending transactions to verify.');
      return;
    }
    if (!confirm(`Verify and approve all ${pendingTxs.length} pending payments? This will immediately enroll all students.`)) return;

    let updatedTxs = [...(accounting.transactions || [])];
    let totalAddedRev = 0;
    let updatedEnrolled = [...enrolledStudents];
    let updatedUsers = [...usersList];

    pendingTxs.forEach(tx => {
      updatedTxs = updatedTxs.map(t => t.id === tx.id ? { ...t, status: 'Completed' } : t);
      totalAddedRev += (Number(tx.amount) || 0);

      const cleanPhone = (tx.studentPhone || tx.phone || '').trim();
      const rawPhone = cleanPhone.replace(/[^0-9]/g, '');
      const studentName = tx.studentName || tx.customer || 'New Student';
      const rawName = studentName.trim().toLowerCase();
      const studentEmail = (tx.studentEmail || tx.email || '').trim().toLowerCase();

      const matchedTargetUser = updatedUsers.find(u => {
        const uPhone = (u.phone || u.whatsapp || '').replace(/[^0-9]/g, '');
        const uEmail = (u.email || '').trim().toLowerCase();
        const uName = (u.name || '').trim().toLowerCase();
        return (rawPhone.length >= 6 && uPhone.includes(rawPhone)) ||
               (studentEmail && uEmail === studentEmail) ||
               (rawName && (uName === rawName || uName.includes(rawName)));
      });

      const existing = updatedEnrolled.find(st => st.phone && cleanPhone && st.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, ''));
      const courseTitle = tx.itemTitle || tx.category || 'Course Enrollment';

      const { courses: grantedCourses } = grantCourseAccess(courseTitle, { bundles, courses }, matchedTargetUser);

      if (existing) {
        updatedEnrolled = updatedEnrolled.map(st => st.id === existing.id ? { ...st, status: 'Active', courseName: courseTitle, joinedDate: 'Today' } : st);
      } else {
        updatedEnrolled.unshift({
          id: `st-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: studentName,
          studentId: `EH-2026-${Math.floor(100 + Math.random() * 900)}`,
          batch: courseTitle.includes('Medical') ? 'Medical 25' : courseTitle.includes('Engineering') ? 'Engineering' : 'HSC 26',
          courseName: courseTitle,
          phone: cleanPhone || '',
          email: tx.email || `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}@gmail.com`,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          status: 'Active',
          joinedDate: 'Today'
        });
      }

      // Update usersList
      if (rawPhone.length >= 6 || rawName) {
        updatedUsers = updatedUsers.map(u => {
          const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
          const uName = (u.name || '').trim().toLowerCase();
          const matchPhone = rawPhone.length >= 6 && uPhone.includes(rawPhone);
          const matchName = rawName && (uName === rawName || uName.includes(rawName));
          if (matchPhone || matchName) {
            const current = u.enrolledCourses || [];
            return {
              ...u,
              status: 'Active',
              enrolledCourses: Array.from(new Set([...current, courseTitle, ...grantedCourses])),
              totalSpent: (u.totalSpent || 0) + (Number(tx.amount) || 0)
            };
          }
          return u;
        });
      }
      approveOrder(tx.orderId || tx.id || tx.trxId, {
        courseTitle,
        studentPhone: cleanPhone,
        studentEmail: tx.studentEmail || tx.email,
        studentName,
        amount: tx.amount
      });
    });

    const updatedAccounting = {
      ...accounting,
      transactions: updatedTxs,
      totalRevenue: (accounting.totalRevenue || 0) + totalAddedRev
    };

    setAccounting(updatedAccounting);
    setEnrolledStudents(updatedEnrolled);
    setUsersList(updatedUsers);
    persistAll({ 
      accounting: updatedAccounting, 
      enrolledStudents: updatedEnrolled,
      users: updatedUsers
    });
    triggerToast(`⚡ Verified & enrolled all ${pendingTxs.length} pending students!`);
  };

  const handleApproveAndEnrollStudent = (tx) => {
    if (!tx) return;

    const cleanPhone = (tx.studentPhone || tx.phone || '').trim();
    const rawPhone = cleanPhone.replace(/[^0-9]/g, '');
    const studentName = tx.studentName || tx.customer || 'New Student';
    const rawName = studentName.trim().toLowerCase();
    const studentEmail = (tx.studentEmail || tx.email || '').trim().toLowerCase();
    const itemTitle = tx.itemTitle || tx.category || 'Course Enrollment';
    const courseTitle = itemTitle;

    // 1. Identify and purge any duplicate pending transactions for this student + course
    const duplicatePendingTxs = (accounting.transactions || []).filter(t => {
      if (t.id === tx.id) return false;
      const s = (t.status || '').toLowerCase();
      const isPending = s === 'pending' || (s !== 'completed' && s !== 'paid' && s !== 'rejected');
      if (!isPending) return false;

      const tp = (t.studentPhone || '').replace(/[^0-9]/g, '');
      const te = (t.studentEmail || '').trim().toLowerCase();
      const tc = (t.itemTitle || t.category || '').trim().toLowerCase();

      const phoneMatch = rawPhone && tp && (rawPhone.includes(tp) || tp.includes(rawPhone));
      const emailMatch = studentEmail && te && studentEmail === te;
      const courseMatch = !tc || !courseTitle || tc.includes(courseTitle.toLowerCase()) || courseTitle.toLowerCase().includes(tc);

      return (phoneMatch || emailMatch) && courseMatch;
    });

    const duplicateOrderIds = new Set(duplicatePendingTxs.map(d => d.orderId || d.id));

    // Update transaction status to Completed and filter out duplicate pending transactions
    const updatedTxs = (accounting.transactions || [])
      .filter(t => !duplicateOrderIds.has(t.id) && !duplicateOrderIds.has(t.orderId))
      .map(t => t.id === tx.id ? { ...t, status: 'Completed', isApproved: true } : t);

    const prevRev = Number(accounting.totalRevenue) || 0;
    const addedAmt = Number(tx.amount) || 0;
    const updatedAccounting = {
      ...accounting,
      transactions: updatedTxs,
      totalRevenue: prevRev + addedAmt,
      netProfit: (prevRev + addedAmt) - (Number(accounting.totalExpenses) || 0)
    };
    setAccounting(updatedAccounting);

    // Delete duplicate pending orders from Supabase in background
    duplicatePendingTxs.forEach(dtx => {
      const dupOrderId = dtx.orderId || dtx.id;
      if (isSupabaseConfigured && dupOrderId) {
        deleteSupabaseOrder(dupOrderId).catch(() => {});
      }
    });

    // Clean duplicate pending orders from localStorage
    try {
      const rawOrders = localStorage.getItem('eh_user_orders_v3');
      if (rawOrders) {
        const ords = JSON.parse(rawOrders);
        const filtered = ords.filter(o => !duplicateOrderIds.has(o.id));
        localStorage.setItem('eh_user_orders_v3', JSON.stringify(filtered));
      }
    } catch (e) {}

    // 2. Grant access globally & locally via enrollmentService
    const matchedTargetUser = usersList.find(u => {
      const uPhone = (u.phone || u.whatsapp || '').replace(/[^0-9]/g, '');
      const uEmail = (u.email || '').trim().toLowerCase();
      const uName = (u.name || '').trim().toLowerCase();
      return (rawPhone.length >= 6 && uPhone.includes(rawPhone)) ||
             (studentEmail && uEmail === studentEmail) ||
             (rawName && (uName === rawName || uName.includes(rawName)));
    });

    const { courses: grantedCourses } = grantCourseAccess(itemTitle, { bundles, courses }, matchedTargetUser);

    // 3. Check if student already in enrolledStudents or create new active student
    const existingStudent = enrolledStudents.find(st => 
      st.phone && cleanPhone && st.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')
    );

    let updatedEnrolled = [...enrolledStudents];

    if (existingStudent) {
      updatedEnrolled = updatedEnrolled.map(st => 
        st.id === existingStudent.id 
          ? { 
              ...st, 
              status: 'Active', 
              courseName: courseTitle,
              joinedDate: 'Today',
              amount: Math.max(Number(st.amount) || 0, addedAmt)
            } 
          : st
      );
    } else {
      const newStudent = {
        id: `st-${Date.now()}`,
        name: studentName,
        studentId: `EH-2026-${Math.floor(100 + Math.random() * 900)}`,
        batch: courseTitle.includes('Medical') ? 'Medical 25' : 
               courseTitle.includes('Engineering') ? 'Engineering' : 
               courseTitle.includes('27') ? 'HSC 27' :
               courseTitle.includes('28') ? 'HSC 28' : 'HSC 26',
        courseName: courseTitle,
        phone: cleanPhone || '',
        email: tx.studentEmail || tx.email || `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}@gmail.com`,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        status: 'Active',
        joinedDate: 'Today',
        amount: addedAmt
      };
      updatedEnrolled = [newStudent, ...updatedEnrolled];
    }
    setEnrolledStudents(updatedEnrolled);

    // 4. Update usersList - Union of enrolled courses, 100% guarantee no access is lost
    let updatedUsers = usersList.map(u => {
      const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
      const uName = (u.name || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const matchPhone = rawPhone.length >= 6 && uPhone.includes(rawPhone);
      const matchEmail = studentEmail && uEmail === studentEmail;
      const matchName = rawName && (uName === rawName || uName.includes(rawName));
      if (matchPhone || matchEmail || matchName) {
        const current = u.enrolledCourses || [];
        return {
          ...u,
          status: 'Active',
          enrolledCourses: Array.from(new Set([...current, courseTitle, ...grantedCourses])),
          totalSpent: (Number(u.totalSpent) || 0) + addedAmt
        };
      }
      return u;
    });
    setUsersList(updatedUsers);

    // 5. Unlock order in orderService & Cloud Firestore and broadcast real-time activation
    approveOrder(tx.orderId || tx.id || tx.trxId, {
      courseTitle,
      studentPhone: cleanPhone,
      studentEmail: tx.studentEmail || tx.email,
      studentName,
      amount: tx.amount
    });

    persistAll({ 
      accounting: updatedAccounting, 
      enrolledStudents: updatedEnrolled,
      users: updatedUsers
    });
    triggerToast(`🎉 TrxID Verified! ${studentName} successfully enrolled in "${courseTitle}"`);
  };

  const handleUpdateTrxStatus = (tx, newStatus) => {
    if (!tx || !newStatus) return;

    if (newStatus === 'Completed') {
      handleApproveAndEnrollStudent(tx);
      return;
    }

    const wasCompleted = (tx.status || '').toLowerCase() === 'completed' || (tx.status || '').toLowerCase() === 'paid';
    const isNowCompleted = newStatus.toLowerCase() === 'completed' || newStatus.toLowerCase() === 'paid';
    let revDiff = 0;
    if (wasCompleted && !isNowCompleted) revDiff = -Number(tx.amount || 0);
    if (!wasCompleted && isNowCompleted) revDiff = Number(tx.amount || 0);

    const updatedTxs = (accounting.transactions || []).map(t => 
      t.id === tx.id ? { ...t, status: newStatus } : t
    );
    const newRev = Math.max(0, (Number(accounting.totalRevenue) || 0) + revDiff);
    const newExp = Number(accounting.totalExpenses) || 0;
    const updatedAccounting = {
      ...accounting,
      totalRevenue: newRev,
      netProfit: newRev - newExp,
      transactions: updatedTxs
    };
    setAccounting(updatedAccounting);

    if (isSupabaseConfigured && (tx.orderId || tx.id)) {
      updateSupabaseOrderStatus(tx.orderId || tx.id, newStatus.toUpperCase()).catch(() => {});
    }

    persistAll({ accounting: updatedAccounting });
    triggerToast(
      newStatus === 'Rejected' 
        ? '⚠️ Transaction marked as Rejected' 
        : `🔄 Transaction status changed to ${newStatus}`
    );
  };

  const handleRejectTrx = (txId) => {
    if (!confirm('Are you sure you want to reject this transaction / TrxID?')) return;
    const targetTx = (accounting.transactions || []).find(t => t.id === txId);
    if (targetTx) {
      handleUpdateTrxStatus(targetTx, 'Rejected');
    }
  };

  // ==========================================
  // CURRICULUM & COURSE STUDIO HANDLERS
  // ==========================================
  const openCurriculumStudio = (courseIdx, tab = 'curriculum') => {
    const course = courses[courseIdx];
    if (!course) return;

    let needsUpdate = false;
    let initialCurr = course.curriculum;
    if (!Array.isArray(course.curriculum) || course.curriculum.length === 0) {
      initialCurr = (course.id === 'master-english-30-days' || course.slug === 'master-english-30-days')
        ? JSON.parse(JSON.stringify(masterEnglishCourseData.curriculum))
        : [];
      needsUpdate = true;
    }

    if (!course.features || !Array.isArray(course.features) || course.features.length === 0) {
      needsUpdate = true;
    }

    if (needsUpdate) {
      const defaultFeats = (course.id === 'master-english-30-days' || course.slug === 'master-english-30-days')
        ? masterEnglishCourseData.features
        : [
            'HD কোয়ালিটি লাইভ ও রেকর্ডেড ক্লাস',
            'অধ্যায়ভিত্তিক লেকচার নোট ও প্র্যাকটিস শিট',
            'এক্সক্লুসিভ এক্সাম ও সলভ ক্লাস',
            '২৪/৭ টেলিগ্রাম ডাউট সলভিং সাপোর্ট'
          ];
      const updated = courses.map((c, i) => i === courseIdx ? { 
        ...c, 
        curriculum: initialCurr,
        tagline: c.tagline || (c.id === 'master-english-30-days' ? masterEnglishCourseData.tagline : ''),
        aboutText: c.aboutText || (c.id === 'master-english-30-days' ? masterEnglishCourseData.aboutText : ''),
        totalClasses: c.totalClasses || (c.id === 'master-english-30-days' ? masterEnglishCourseData.totalClasses : ''),
        features: (c.features && c.features.length > 0) ? c.features : defaultFeats,
        studentsCount: c.studentsCount || '১২৫০+',
        supportPhone: c.supportPhone || '01342227935',
        previewVideoUrl: c.previewVideoUrl || (c.id === 'master-english-30-days' ? masterEnglishCourseData.previewVideoUrl : '')
      } : c);
      setCourses(updated);
      persistAll({ courses: updated });
    }

    setCurriculumCourseIndex(courseIdx);
    setCurriculumStudioTab(tab);
    setCurriculumExpandedSections({ 0: true, 1: true });
    try {
      window.history.pushState(null, '', `/admin?course=${courseIdx}&tab=${tab}`);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mutateCurrentCourse = (updater) => {
    if (curriculumCourseIndex === null || curriculumCourseIndex === undefined) return;
    setCourses(prev => {
      const updated = prev.map((c, i) => {
        if (i === curriculumCourseIndex) {
          return updater(c);
        }
        return c;
      });
      persistAll({ courses: updated });
      return updated;
    });
  };

  const handleLoadTemplate = () => {
    if (window.confirm('Do you want to load Master English curriculum & info for this course?')) {
      mutateCurrentCourse(c => ({
        ...c,
        tagline: c.tagline || masterEnglishCourseData.tagline,
        aboutText: c.aboutText || masterEnglishCourseData.aboutText,
        totalClasses: c.totalClasses || masterEnglishCourseData.totalClasses,
        features: (c.features && c.features.length > 0) ? c.features : masterEnglishCourseData.features,
        supportPhone: c.supportPhone || masterEnglishCourseData.supportPhone,
        previewVideoUrl: c.previewVideoUrl || masterEnglishCourseData.previewVideoUrl,
        curriculum: JSON.parse(JSON.stringify(masterEnglishCourseData.curriculum))
      }));
      setCurriculumExpandedSections({ 0: true, 1: true });
      triggerToast('🎉 Course syllabus loaded successfully!');
    }
  };

  const handleAddSection = () => {
    mutateCurrentCourse(c => {
      const curr = Array.isArray(c.curriculum) ? [...c.curriculum] : [];
      const newSecId = curr.length > 0 ? Math.max(...curr.map(s => Number(s.id) || 0)) + 1 : 1;
      const newSection = {
        id: newSecId,
        name: `Module 0${newSecId}: Core Topics & Chapter Outline`,
        summary: '1 Chapter · 1 Lecture',
        chapters: [
          {
            name: 'Chapter 1: Orientation & Core Fundamentals',
            count: 1,
            lessons: [
              {
                id: `les-${Date.now()}`,
                title: 'Lecture 01: Orientation & Course Roadmap',
                duration: '40 min',
                videoUrl: '',
                pdfUrl: '',
                isFree: true
              }
            ]
          }
        ]
      };
      return {
        ...c,
        curriculum: [...curr, newSection]
      };
    });
    setCurriculumExpandedSections(prev => ({
      ...prev,
      [(courses[curriculumCourseIndex]?.curriculum?.length || 0)]: true
    }));
    triggerToast('➕ New module created!');
  };

  const handleDeleteSection = (secIdx) => {
    if (window.confirm('Delete this entire module? All nested chapters and lessons will be permanently deleted.')) {
      mutateCurrentCourse(c => {
        const curr = [...(c.curriculum || [])];
        curr.splice(secIdx, 1);
        return { ...c, curriculum: curr };
      });
      triggerToast('🗑️ Module removed');
    }
  };

  const handleUpdateSection = (secIdx, field, val) => {
    mutateCurrentCourse(c => {
      const curr = [...(c.curriculum || [])];
      curr[secIdx] = { ...curr[secIdx], [field]: val };
      return { ...c, curriculum: curr };
    });
  };

  const handleMoveSection = (secIdx, direction) => {
    mutateCurrentCourse(c => {
      const curr = [...(c.curriculum || [])];
      const targetIdx = direction === 'up' ? secIdx - 1 : secIdx + 1;
      if (targetIdx < 0 || targetIdx >= curr.length) return c;
      const temp = curr[secIdx];
      curr[secIdx] = curr[targetIdx];
      curr[targetIdx] = temp;
      return { ...c, curriculum: curr };
    });
  };

  const handleAddChapter = (secIdx) => {
    mutateCurrentCourse(c => {
      const curr = [...(c.curriculum || [])];
      const sec = { ...curr[secIdx] };
      const chaps = [...(sec.chapters || [])];
      chaps.push({
        name: `Chapter ${chaps.length + 1}`,
        count: 0,
        lessons: []
      });
      sec.chapters = chaps;
      sec.summary = `${chaps.length} chapters · ${chaps.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0)} lessons`;
      curr[secIdx] = sec;
      return { ...c, curriculum: curr };
    });
    triggerToast('➕ New chapter added');
  };

  const handleDeleteChapter = (secIdx, chapIdx) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      mutateCurrentCourse(c => {
        const curr = [...(c.curriculum || [])];
        const sec = { ...curr[secIdx] };
        const chaps = [...(sec.chapters || [])];
        chaps.splice(chapIdx, 1);
        sec.chapters = chaps;
        sec.summary = `${chaps.length} chapters · ${chaps.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0)} lessons`;
        curr[secIdx] = sec;
        return { ...c, curriculum: curr };
      });
      triggerToast('🗑️ Chapter removed');
    }
  };

  const handleUpdateChapter = (secIdx, chapIdx, val) => {
    mutateCurrentCourse(c => {
      const curr = [...(c.curriculum || [])];
      const sec = { ...curr[secIdx] };
      const chaps = [...(sec.chapters || [])];
      chaps[chapIdx] = { ...chaps[chapIdx], name: val };
      sec.chapters = chaps;
      curr[secIdx] = sec;
      return { ...c, curriculum: curr };
    });
  };

  const handleAddLesson = (secIdx, chapIdx) => {
    const draftKey = `${secIdx}-${chapIdx}`;
    const draft = newLessonDrafts[draftKey] || {};
    if (!draft.title?.trim()) {
      triggerToast('⚠️ Please enter lesson title');
      return;
    }

    const newLessonItem = {
      id: `les-${Date.now()}`,
      title: draft.title.trim(),
      duration: draft.duration?.trim() || '45 min',
      videoUrl: draft.videoUrl?.trim() || '',
      pdfUrl: draft.pdfUrl?.trim() || '',
      isFree: Boolean(draft.isFree)
    };

    mutateCurrentCourse(c => {
      const curr = [...(c.curriculum || [])];
      const sec = { ...curr[secIdx] };
      const chaps = [...(sec.chapters || [])];
      const chap = { ...chaps[chapIdx] };
      const lessons = [...(chap.lessons || [])];
      lessons.push(newLessonItem);
      chap.lessons = lessons;
      chap.count = lessons.length;
      chaps[chapIdx] = chap;
      sec.chapters = chaps;
      sec.summary = `${chaps.length} chapters · ${chaps.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0)} lessons`;
      curr[secIdx] = sec;
      return { ...c, curriculum: curr };
    });

    setNewLessonDrafts(prev => ({
      ...prev,
      [draftKey]: { title: '', duration: '45 min', videoUrl: '', pdfUrl: '', isFree: false }
    }));
    triggerToast('✅ New lesson added successfully!');
  };

  const handleDeleteLesson = (secIdx, chapIdx, lesIdx) => {
    mutateCurrentCourse(c => {
      const curr = [...(c.curriculum || [])];
      const sec = { ...curr[secIdx] };
      const chaps = [...(sec.chapters || [])];
      const chap = { ...chaps[chapIdx] };
      const lessons = [...(chap.lessons || [])];
      lessons.splice(lesIdx, 1);
      chap.lessons = lessons;
      chap.count = lessons.length;
      chaps[chapIdx] = chap;
      sec.chapters = chaps;
      sec.summary = `${chaps.length} chapters · ${chaps.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0)} lessons`;
      curr[secIdx] = sec;
      return { ...c, curriculum: curr };
    });
    triggerToast('🗑️ Lesson deleted');
  };

  const handleUpdateLesson = (secIdx, chapIdx, lesIdx, field, val) => {
    mutateCurrentCourse(c => {
      const curr = [...(c.curriculum || [])];
      const sec = { ...curr[secIdx] };
      const chaps = [...(sec.chapters || [])];
      const chap = { ...chaps[chapIdx] };
      const lessons = [...(chap.lessons || [])];
      
      const currentLes = typeof lessons[lesIdx] === 'string' 
        ? { title: lessons[lesIdx], duration: '45 min', videoUrl: '', pdfUrl: '', isFree: false }
        : { ...lessons[lesIdx] };

      currentLes[field] = val;
      lessons[lesIdx] = currentLes;
      chap.lessons = lessons;
      chaps[chapIdx] = chap;
      sec.chapters = chaps;
      curr[secIdx] = sec;
      return { ...c, curriculum: curr };
    });
  };

  const handleUpdateCurrentCourseField = (field, val) => {
    mutateCurrentCourse(c => ({
      ...c,
      [field]: val
    }));
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    mutateCurrentCourse(c => {
      const currentFeats = Array.isArray(c.features) ? [...c.features] : [];
      return {
        ...c,
        features: [...currentFeats, newFeatureInput.trim()]
      };
    });
    setNewFeatureInput('');
    triggerToast('✅ Feature added');
  };

  const handleRemoveFeature = (featIdx) => {
    mutateCurrentCourse(c => {
      const currentFeats = Array.isArray(c.features) ? [...c.features] : [];
      currentFeats.splice(featIdx, 1);
      return { ...c, features: currentFeats };
    });
    triggerToast('Feature removed');
  };

  // Add Teacher
  const handleAddTeacher = (e) => {
    e.preventDefault();
    if (!newTeacher.name) return;
    const item = { id: Date.now(), ...newTeacher };
    const updated = [...instructors, item];
    setInstructors(updated);
    persistAll({ instructors: updated });
    setNewTeacher({ name: '', badge: '', designation: 'INSTRUCTOR', bio: '', image: 'https://assets.codervai.com/teachers/1781366052322-cropped-image.webp', yt: '' });
    setShowAddTeacherModal(false);
    triggerToast('👨‍🏫 Instructor added successfully!');
  };

  // Extract Clean YouTube ID helper
  const extractCleanYouTubeId = (urlOrId) => {
    if (!urlOrId) return '';
    const str = String(urlOrId).trim();
    const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) return match[1];
    const clean = str.split('?')[0].split('&')[0].replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (/^[\w-]{11}$/.test(clean)) return clean;
    return clean.length >= 11 ? clean.slice(-11) : clean;
  };

  // Move Video in Free Videos list
  const handleMoveVideo = (index, direction) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= freeVideos.length) return;
    const nextList = [...freeVideos];
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    setFreeVideos(nextList);
    persistAll({ freeVideos: nextList });
    triggerToast('Video order updated!');
  };

  // Add Video
  const handleAddVideo = (e) => {
    e.preventDefault();
    const cleanId = extractCleanYouTubeId(newVideo.videoId);
    if (!cleanId) {
      alert('Please enter a valid YouTube Video ID or URL.');
      return;
    }
    const item = {
      id: Date.now(),
      videoId: cleanId,
      title: newVideo.title.trim() || 'YouTube Class',
      desc: (newVideo.desc || newVideo.title || 'Class Video').trim()
    };
    const updated = [item, ...freeVideos];
    setFreeVideos(updated);
    persistAll({ freeVideos: updated });
    setNewVideo({ title: '', videoId: '', desc: '' });
    setShowAddVideoModal(false);
    triggerToast('🎬 YouTube video added successfully!');
  };

  // Add Store Product
  const handleAddStoreProduct = (e) => {
    e.preventDefault();
    if (!newProduct.title) return;
    const item = {
      id: Date.now(),
      ...newProduct,
      price: Number(newProduct.price) || 0,
      regularPrice: Number(newProduct.regularPrice) || (Number(newProduct.price) * 2)
    };
    const updated = [item, ...storeProducts];
    setStoreProducts(updated);
    persistAll({ storeProducts: updated });
    setNewProduct({
      title: '',
      category: 'E-book',
      price: 299,
      regularPrice: 599,
      cover: 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp',
      description: 'Exclusive digital study material.'
    });
    setShowAddStoreModal(false);
    triggerToast('📖 Book/PDF added to store!');
  };

  // -------------------------------------------------------------
  // LEGAL & POLICIES MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleUpdatePolicyMeta = (policyKey, field, value) => {
    if (policyKey === 'terms') {
      const updated = { ...termsAndConditions, [field]: value };
      setTermsAndConditions(updated);
      persistAll({ termsAndConditions: updated });
    } else if (policyKey === 'refund') {
      const updated = { ...refundPolicy, [field]: value };
      setRefundPolicy(updated);
      persistAll({ refundPolicy: updated });
    } else if (policyKey === 'privacy') {
      const updated = { ...privacyPolicy, [field]: value };
      setPrivacyPolicy(updated);
      persistAll({ privacyPolicy: updated });
    }
  };

  const handleAddClause = (policyKey) => {
    const target = policyKey === 'terms' ? termsAndConditions : (policyKey === 'refund' ? refundPolicy : privacyPolicy);
    const clauses = target.clauses || [];
    const newClause = {
      id: clauses.length + 1,
      title: `New Policy Section #${clauses.length + 1}`,
      points: ['Enter section policy details here.']
    };
    const updated = { ...target, clauses: [...clauses, newClause] };

    if (policyKey === 'terms') {
      setTermsAndConditions(updated);
      persistAll({ termsAndConditions: updated });
    } else if (policyKey === 'refund') {
      setRefundPolicy(updated);
      persistAll({ refundPolicy: updated });
    } else if (policyKey === 'privacy') {
      setPrivacyPolicy(updated);
      persistAll({ privacyPolicy: updated });
    }
    triggerToast('➕ New policy section added.');
  };

  const handleUpdateClause = (policyKey, index, field, value) => {
    const target = policyKey === 'terms' ? termsAndConditions : (policyKey === 'refund' ? refundPolicy : privacyPolicy);
    const clauses = target.clauses || [];
    const updatedClauses = clauses.map((c, i) => {
      if (i !== index) return c;
      if (field === 'pointsText') {
        const lines = value.split('\n');
        return { ...c, points: lines };
      }
      return { ...c, [field]: value };
    });
    const updated = { ...target, clauses: updatedClauses };

    if (policyKey === 'terms') {
      setTermsAndConditions(updated);
      persistAll({ termsAndConditions: updated });
    } else if (policyKey === 'refund') {
      setRefundPolicy(updated);
      persistAll({ refundPolicy: updated });
    } else if (policyKey === 'privacy') {
      setPrivacyPolicy(updated);
      persistAll({ privacyPolicy: updated });
    }
  };

  const handleMoveClause = (policyKey, index, direction) => {
    const target = policyKey === 'terms' ? termsAndConditions : (policyKey === 'refund' ? refundPolicy : privacyPolicy);
    const clauses = [...(target.clauses || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= clauses.length) return;

    const temp = clauses[index];
    clauses[index] = clauses[targetIdx];
    clauses[targetIdx] = temp;

    const reindexed = clauses.map((c, i) => ({ ...c, id: i + 1 }));
    const updated = { ...target, clauses: reindexed };

    if (policyKey === 'terms') {
      setTermsAndConditions(updated);
      persistAll({ termsAndConditions: updated });
    } else if (policyKey === 'refund') {
      setRefundPolicy(updated);
      persistAll({ refundPolicy: updated });
    } else if (policyKey === 'privacy') {
      setPrivacyPolicy(updated);
      persistAll({ privacyPolicy: updated });
    }
    triggerToast('↕️ Section order rearranged.');
  };

  const handleDeleteClause = (policyKey, index) => {
    const target = policyKey === 'terms' ? termsAndConditions : (policyKey === 'refund' ? refundPolicy : privacyPolicy);
    const clauses = target.clauses || [];
    const clauseToDelete = clauses[index];
    if (!confirm(`Are you sure you want to delete section "${clauseToDelete?.title || index + 1}"?`)) return;

    const filtered = clauses.filter((_, i) => i !== index).map((c, i) => ({ ...c, id: i + 1 }));
    const updated = { ...target, clauses: filtered };

    if (policyKey === 'terms') {
      setTermsAndConditions(updated);
      persistAll({ termsAndConditions: updated });
    } else if (policyKey === 'refund') {
      setRefundPolicy(updated);
      persistAll({ refundPolicy: updated });
    } else if (policyKey === 'privacy') {
      setPrivacyPolicy(updated);
      persistAll({ privacyPolicy: updated });
    }
    triggerToast('🗑️ Policy section deleted.');
  };

  const handleResetPolicyTemplate = (policyKey) => {
    if (!confirm('Are you sure you want to restore this policy to the default factory template?')) return;
    if (policyKey === 'terms') {
      setTermsAndConditions(initialData.termsAndConditions);
      persistAll({ termsAndConditions: initialData.termsAndConditions });
    } else if (policyKey === 'refund') {
      setRefundPolicy(initialData.refundPolicy);
      persistAll({ refundPolicy: initialData.refundPolicy });
    } else if (policyKey === 'privacy') {
      setPrivacyPolicy(initialData.privacyPolicy);
      persistAll({ privacyPolicy: initialData.privacyPolicy });
    }
    triggerToast('🔄 Policy restored to default.');
  };

  // -------------------------------------------------------------
  // PERFORMANCE OPTIMIZATIONS: Deferred Values & Memoized Selectors
  // -------------------------------------------------------------
  const deferredSearchTrx = useDeferredValue(searchTrx);
  const deferredVerifQuery = useDeferredValue(verificationSearchQuery);
  const deferredStudentQuery = useDeferredValue(studentSearchQuery);


  // Memoized User Directory & Deferred Search
  const deferredUserQuery = useDeferredValue(userSearchQuery);

  const filteredUsers = useMemo(() => {
    let list = [...usersList];
    const q = deferredUserQuery.trim().toLowerCase();

    if (userRoleFilter !== 'ALL') {
      list = list.filter(u => (u.role || '').toLowerCase() === userRoleFilter.toLowerCase());
    }

    if (userStatusFilter !== 'ALL') {
      list = list.filter(u => (u.status || '').toLowerCase() === userStatusFilter.toLowerCase());
    }

    if (userBatchFilter !== 'ALL') {
      list = list.filter(u => {
        const b = (u.hscBatch || u.batch || '').toLowerCase();
        return b.includes(userBatchFilter.toLowerCase());
      });
    }

    if (q) {
      list = list.filter(u => 
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.whatsapp || '').includes(q) ||
        (u.college || '').toLowerCase().includes(q) ||
        (u.institution || '').toLowerCase().includes(q) ||
        (u.hscBatch || '').toLowerCase().includes(q) ||
        (u.batch || '').toLowerCase().includes(q) ||
        (u.id || '').toLowerCase().includes(q)
      );
    }

    if (userSortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (userSortBy === 'spend') {
      list.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    } else if (userSortBy === 'courses') {
      list.sort((a, b) => (
        getCanonicalCourses(b.enrolledCourses, { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA }).length -
        getCanonicalCourses(a.enrolledCourses, { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA }).length
      ));
    } else {
      // Default: Newest users ALWAYS on top
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.joinedDate || 0).getTime() || (a.id?.startsWith('usr-') ? Number(a.id.replace('usr-', '')) : 0);
        const timeB = new Date(b.createdAt || b.joinedDate || 0).getTime() || (b.id?.startsWith('usr-') ? Number(b.id.replace('usr-', '')) : 0);
        return timeB - timeA;
      });
    }

    return list;
  }, [usersList, userRoleFilter, userStatusFilter, userBatchFilter, deferredUserQuery, userSortBy, courses, bundles]);

  const userMetrics = useMemo(() => {
    const total = usersList.length;
    const activeStudents = usersList.filter(u => u.role === 'Student' && u.status === 'Active').length;
    const staffCount = usersList.filter(u => ['Admin', 'Instructor', 'Moderator'].includes(u.role)).length;
    const suspendedCount = usersList.filter(u => u.status === 'Suspended').length;
    return { total, activeStudents, staffCount, suspendedCount };
  }, [usersList]);

  // Memoized Pending Requests (Chronologically Sorted - Newest First)
  const pendingRequests = useMemo(() => {
    const txs = accounting?.transactions || [];

    const approvedKeys = new Set();
    txs.forEach(t => {
      const st = (t.status || '').toLowerCase();
      if (st === 'completed' || st === 'paid' || Boolean(t.isApproved)) {
        const p = (t.studentPhone || '').replace(/[^0-9]/g, '');
        const e = (t.studentEmail || '').trim().toLowerCase();
        const c = (t.itemTitle || t.category || '').trim().toLowerCase();
        if (p && c) approvedKeys.add(`${p}_${c}`);
        if (e && c) approvedKeys.add(`${e}_${c}`);
        if (p) approvedKeys.add(p);
      }
    });

    const seenPending = new Set();
    return txs.filter(tx => {
      const s = (tx.status || '').toLowerCase();
      const isPending = s === 'pending' || (s !== 'completed' && s !== 'paid' && s !== 'rejected');
      if (!isPending) return false;

      const p = (tx.studentPhone || '').replace(/[^0-9]/g, '');
      const e = (tx.studentEmail || '').trim().toLowerCase();
      const c = (tx.itemTitle || tx.category || '').trim().toLowerCase();

      // Discard if student has an approved transaction for this course
      if ((p && c && approvedKeys.has(`${p}_${c}`)) || (e && c && approvedKeys.has(`${e}_${c}`))) {
        return false;
      }

      // Keep only one pending request per student + course
      const key = p && c ? `${p}_${c}` : (e && c ? `${e}_${c}` : tx.id);
      if (seenPending.has(key)) return false;
      seenPending.add(key);

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });
  }, [accounting?.transactions]);

  // Memoized Pending Count
  const pendingCount = useMemo(() => {
    return pendingRequests.length;
  }, [pendingRequests]);

  // Memoized Filtered Transactions (Pending & Newest on TOP)
  const filteredTransactions = useMemo(() => {
    const txs = accounting?.transactions || [];
    const query = deferredSearchTrx.trim().toLowerCase();

    const approvedKeys = new Set();
    txs.forEach(t => {
      const st = (t.status || '').toLowerCase();
      if (st === 'completed' || st === 'paid' || Boolean(t.isApproved)) {
        const p = (t.studentPhone || '').replace(/[^0-9]/g, '');
        const e = (t.studentEmail || '').trim().toLowerCase();
        const c = (t.itemTitle || t.category || '').trim().toLowerCase();
        if (p && c) approvedKeys.add(`${p}_${c}`);
        if (e && c) approvedKeys.add(`${e}_${c}`);
      }
    });

    const filtered = txs.filter(tx => {
      const st = (tx.status || '').toLowerCase();
      const isPending = st === 'pending' || (st !== 'completed' && st !== 'paid' && st !== 'rejected');

      // If pending, hide if student already has an approved transaction for this course
      if (isPending) {
        const p = (tx.studentPhone || '').replace(/[^0-9]/g, '');
        const e = (tx.studentEmail || '').trim().toLowerCase();
        const c = (tx.itemTitle || tx.category || '').trim().toLowerCase();
        if ((p && c && approvedKeys.has(`${p}_${c}`)) || (e && c && approvedKeys.has(`${e}_${c}`))) {
          return false;
        }
      }

      const matchesSearch = !query ||
        (tx.studentName || '').toLowerCase().includes(query) ||
        (tx.itemTitle || '').toLowerCase().includes(query) ||
        (tx.trxId || '').toLowerCase().includes(query) ||
        (tx.studentPhone || '').includes(query);

      if (trxFilter === 'PENDING') return matchesSearch && isPending;
      if (trxFilter === 'INCOME') return matchesSearch && (tx.type || '').toUpperCase() === 'INCOME';
      if (trxFilter === 'EXPENSE') return matchesSearch && (tx.type || '').toUpperCase() === 'EXPENSE';
      return matchesSearch;
    });

    return filtered.sort((a, b) => {
      const aPending = (a.status || '').toLowerCase() === 'pending' || ((a.status || '').toLowerCase() !== 'completed' && (a.status || '').toLowerCase() !== 'paid');
      const bPending = (b.status || '').toLowerCase() === 'pending' || ((b.status || '').toLowerCase() !== 'completed' && (b.status || '').toLowerCase() !== 'paid');
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      const timeA = new Date(a.createdAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.date || 0).getTime();
      return timeB - timeA;
    });
  }, [accounting?.transactions, deferredSearchTrx, trxFilter]);

  // Memoized Verification Hub Filtered List
  const verificationList = useMemo(() => {
    const txs = accounting?.transactions || [];
    const q = deferredVerifQuery.trim().toLowerCase();
    const qClean = q.replace(/[^a-zA-Z0-9]/g, '');

    const approvedKeys = new Set();
    txs.forEach(t => {
      const st = (t.status || '').toLowerCase();
      if (st === 'completed' || st === 'paid' || Boolean(t.isApproved)) {
        const p = (t.studentPhone || '').replace(/[^0-9]/g, '');
        const e = (t.studentEmail || '').trim().toLowerCase();
        const c = (t.itemTitle || t.category || '').trim().toLowerCase();
        if (p && c) approvedKeys.add(`${p}_${c}`);
        if (e && c) approvedKeys.add(`${e}_${c}`);
      }
    });

    const seenPending = new Set();
    return txs.filter(tx => {
      if ((tx.type || '').toUpperCase() === 'EXPENSE') return false;

      const st = (tx.status || '').toLowerCase();
      const isPending = st === 'pending' || (st !== 'completed' && st !== 'paid' && st !== 'rejected');
      const isCompleted = st === 'completed' || st === 'paid' || Boolean(tx.isApproved);
      const isRejected = st === 'rejected';

      // If pending, hide duplicate if student already has an approved transaction
      if (isPending) {
        const p = (tx.studentPhone || '').replace(/[^0-9]/g, '');
        const e = (tx.studentEmail || '').trim().toLowerCase();
        const c = (tx.itemTitle || tx.category || '').trim().toLowerCase();
        if ((p && c && approvedKeys.has(`${p}_${c}`)) || (e && c && approvedKeys.has(`${e}_${c}`))) {
          return false;
        }
        const key = p && c ? `${p}_${c}` : (e && c ? `${e}_${c}` : tx.id);
        if (seenPending.has(key)) return false;
        seenPending.add(key);
      }

      if (verificationFilter === 'PENDING' && !isPending) return false;
      if (verificationFilter === 'COMPLETED' && !isCompleted) return false;
      if (verificationFilter === 'REJECTED' && !isRejected) return false;

      if (!q) return true;

      const txId = (tx.trxId || '').toLowerCase();
      const txIdClean = txId.replace(/[^a-zA-Z0-9]/g, '');
      const phone = (tx.studentPhone || '').toLowerCase();
      const phoneClean = phone.replace(/[^0-9]/g, '');
      const name = (tx.studentName || '').toLowerCase();
      const title = (tx.itemTitle || '').toLowerCase();

      return txId.includes(q) ||
        (qClean && txIdClean.includes(qClean)) ||
        phone.includes(q) ||
        (qClean && phoneClean.includes(qClean)) ||
        name.includes(q) ||
        title.includes(q);
    });
  }, [accounting?.transactions, verificationFilter, deferredVerifQuery]);

  // Memoized Enrolled Students
  const filteredStudents = useMemo(() => {
    const q = deferredStudentQuery.trim().toLowerCase();
    return enrolledStudents.filter(st => {
      const matchesBatch = studentBatchFilter === 'ALL' || st.batch === studentBatchFilter;
      if (!matchesBatch) return false;
      if (!q) return true;
      return (st.name || '').toLowerCase().includes(q) ||
        (st.phone || '').includes(q) ||
        (st.studentId || '').toLowerCase().includes(q);
    });
  }, [enrolledStudents, studentBatchFilter, deferredStudentQuery]);


  // Memoized Filtered Courses with instant search
  const deferredCourseQuery = useDeferredValue(courseSearchQuery);
  const filteredCourses = useMemo(() => {
    let list = courses.map((course, originalIdx) => ({ course, originalIdx }));
    
    if (!isAllCat(adminCourseCategoryFilter)) {
      list = list.filter(({ course }) => courseMatchesCategory(course, adminCourseCategoryFilter));
    }

    const q = deferredCourseQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(({ course }) => 
        (course.title || '').toLowerCase().includes(q) ||
        (course.category || '').toLowerCase().includes(q) ||
        (course.id || '').toLowerCase().includes(q) ||
        (course.badge || '').toLowerCase().includes(q) ||
        (course.subtitle || '').toLowerCase().includes(q) ||
        (course.description || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [courses, adminCourseCategoryFilter, deferredCourseQuery]);


  // Memoized Financial Totals (Reflects verified, real transactions)
  const accountingTotals = useMemo(() => {
    const txs = accounting?.transactions || [];
    let rev = 0;
    let exp = 0;
    txs.forEach(t => {
      const amt = Number(t.amount) || 0;
      const isCompleted = (t.status || '').toLowerCase() === 'completed';
      if (t.type === 'INCOME' && isCompleted) rev += amt;
      else if (t.type === 'EXPENSE' && isCompleted) exp += amt;
    });
    return {
      totalRevenue: rev,
      totalExpenses: exp,
      netProfit: rev - exp
    };
  }, [accounting?.transactions]);

  // =========================================================
  // DEDICATED FULL-PAGE BUNDLE STUDIO VIEW (NO POPUP)
  // =========================================================
  if (activeStudioBundle !== null) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased">
        {/* Floating Success Toast */}
        {saveToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            <span className="font-bold text-sm">{toastMsg}</span>
          </div>
        )}

        <BundleStudioPage
          bundle={activeStudioBundle}
          courses={courses}
          onSave={(savedBundle) => {
            const isExisting = bundles.some(b => b.id === savedBundle.id);
            const updated = isExisting
              ? bundles.map(b => b.id === savedBundle.id ? savedBundle : b)
              : [savedBundle, ...bundles];
            setBundles(updated);
            persistAll({ bundles: updated });
            triggerToast(isExisting ? '✅ Bundle updated successfully!' : '🎉 New Bundle created successfully!');
            setActiveStudioBundle(null);
          }}
          onBack={() => setActiveStudioBundle(null)}
          triggerToast={triggerToast}
        />
      </div>
    );
  }

  // =========================================================
  // DEDICATED FULL-PAGE COURSE STUDIO VIEW (NO POPUP)
  // =========================================================
  if (curriculumCourseIndex !== null && courses[curriculumCourseIndex]) {
    return (
      <div className="min-h-screen bg-[#f4f6fa] text-slate-800 font-sans antialiased">
        {/* Floating Success Toast */}
        {saveToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            <span className="font-bold text-sm">{toastMsg}</span>
          </div>
        )}

        <CourseStudioPage
          key={`course-studio-${curriculumCourseIndex}-${curriculumStudioTab}`}
          course={courses[curriculumCourseIndex]}
          courseIndex={curriculumCourseIndex}
          initialTab={curriculumStudioTab}
          categories={categories}
          onUpdateCourse={(updatedCourse) => {
            const next = courses.map((c, i) => (
              i === curriculumCourseIndex ||
              (updatedCourse?.id && c?.id === updatedCourse.id) ||
              (updatedCourse?.slug && c?.slug === updatedCourse.slug)
            ) ? updatedCourse : c);
            setCourses(next);
            const fullState = persistAll({ courses: next });
            try {
              saveSupabaseSiteData(fullState);
            } catch (e) {}
            saveCloudData({ courses: next });
          }}
          onBack={() => {
            setCurriculumCourseIndex(null);
            try {
              window.history.pushState(null, '', '/admin');
            } catch (e) {}
          }}
          onPreview={() => {
            setCurriculumCourseIndex(null);
            onExitAdmin();
          }}
          openGalleryModal={openGalleryModal}
          triggerToast={triggerToast}
        />

        {/* Media Gallery Modal for Image Picking in Studio */}
        {renderGalleryModal()}
      </div>
    );
  }

  // Shared navigation renderer for both Desktop aside and Mobile slide-over drawer
  const renderSidebarNav = (isMobileDrawer = false) => {
    const handleNavClick = (tabKey) => {
      setActiveTab(tabKey);
      if (isMobileDrawer) setMobileSidebarOpen(false);
    };

    return (
      <div className="flex flex-col gap-1 w-full">
        {/* GROUP 1: DASHBOARD */}
        <div className="px-2.5 py-1 mb-0.5">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
            MAIN MENU
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleNavClick('overview')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'overview' ? 'text-white' : 'text-slate-400'}`} />
            <span>Dashboard</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('accounting')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'accounting'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <DollarSign className={`w-4 h-4 shrink-0 ${activeTab === 'accounting' ? 'text-white' : 'text-slate-400'}`} />
            <span>Enrollments & Ledger</span>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('users')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <Users className={`w-4 h-4 shrink-0 ${activeTab === 'users' ? 'text-white' : 'text-slate-400'}`} />
            <span>Users Management</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-[#5d5bf6]/10 text-[#5d5bf6]'
          }`}>
            {usersList.length}
          </span>
        </button>

        {/* GROUP 2: ACADEMIC */}
        <div className="px-2.5 pt-3.5 pb-1">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
            ACADEMIC
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleNavClick('courses')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'courses' ? 'text-white' : 'text-slate-400'}`} />
            <span>Courses</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{courses.length}</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('results')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'results'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <Trophy className={`w-4 h-4 shrink-0 ${activeTab === 'results' ? 'text-white' : 'text-amber-500'}`} />
            <span>Exam Results & Merit</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            activeTab === 'results' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
          }`}>
            {examSubmissions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('bundles')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'bundles'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <Layers className={`w-4 h-4 shrink-0 ${activeTab === 'bundles' ? 'text-white' : 'text-slate-400'}`} />
            <span>Bundles</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{bundles.length}</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('instructors')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'instructors'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <GraduationCap className={`w-4 h-4 shrink-0 ${activeTab === 'instructors' ? 'text-white' : 'text-slate-400'}`} />
            <span>Faculty & Mentors</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{instructors.length}</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('store')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'store'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'store' ? 'text-white' : 'text-slate-400'}`} />
            <span>Book & PDF Store</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{storeProducts.length}</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('videos')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'videos'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <Video className={`w-4 h-4 shrink-0 ${activeTab === 'videos' ? 'text-white' : 'text-slate-400'}`} />
            <span>Free Video Classes</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{freeVideos.length}</span>
        </button>

        {/* GROUP 3: CUSTOMIZE */}
        <div className="px-2.5 pt-3.5 pb-1">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
            CUSTOMIZE
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleNavClick('slides')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'slides'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <Sliders className={`w-4 h-4 shrink-0 ${activeTab === 'slides' ? 'text-white' : 'text-slate-400'}`} />
            <span>Hero Slider</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('sectionTexts')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'sectionTexts'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <Type className={`w-4 h-4 shrink-0 ${activeTab === 'sectionTexts' ? 'text-white' : 'text-slate-400'}`} />
            <span>Section Texts</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('whyChoose')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'whyChoose'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <HelpCircle className={`w-4 h-4 shrink-0 ${activeTab === 'whyChoose' ? 'text-white' : 'text-slate-400'}`} />
            <span>Why Choose Us</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('stats')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <PieChart className={`w-4 h-4 shrink-0 ${activeTab === 'stats' ? 'text-white' : 'text-slate-400'}`} />
            <span>Counters & Notice</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleNavClick('policies')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'policies'
              ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold border-[#5d5bf6]'
              : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === 'policies' ? 'text-white' : 'text-slate-400'}`} />
            <span>Legal & Policies</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
            {(termsAndConditions?.clauses?.length || 0) + (refundPolicy?.clauses?.length || 0) + (privacyPolicy?.clauses?.length || 0)}
          </span>
        </button>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200 font-bold shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Brand & Settings</span>
            </div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* FLOATING SUCCESS TOAST */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span className="font-bold text-sm">{toastMsg}</span>
        </div>
      )}

      {/* FLOATING UNSAVED CHANGES SAVE/CANCEL POPUP */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-slate-700/80 flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <div>
                <p className="text-xs font-bold text-white leading-tight">Unsaved changes detected</p>
                <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">Save your changes or cancel to revert.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelAllChanges}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveAllChanges}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 border-none transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MATDASH HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center active:scale-95"
            aria-label="Open Navigation Menu"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo - MatDash Style */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5d5bf6] to-[#7c7afc] flex items-center justify-center font-black text-white text-xs shadow-md shadow-[#5d5bf6]/25 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">MatDash</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#5d5bf6]/10 text-[#5d5bf6] uppercase tracking-wider hidden xs:inline-block">
                EduHunters
              </span>
            </div>
          </div>
        </div>

        {/* Center Search Bar with Shortcut (Desktop & Tablet) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search students, courses, transactions... (Ctrl+K)"
              value={searchTrx}
              onChange={(e) => setSearchTrx(e.target.value)}
              className="w-full bg-[#f4f6fa] border border-slate-200/80 rounded-xl pl-10 pr-12 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] focus:ring-2 focus:ring-[#5d5bf6]/15 transition-all placeholder:text-slate-400 font-medium"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">⌘K</kbd>
          </div>
        </div>

        {/* Right Action Icons & Profile Chip */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Exit Admin Button */}
          {onExitAdmin && (
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200/80 transition-all cursor-pointer"
              title="Return to website"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Admin</span>
            </button>
          )}

          {/* Admin Logout Button */}
          {onLogoutAdmin && (
            <button
              type="button"
              onClick={onLogoutAdmin}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200/80 transition-all cursor-pointer"
              title="Sign out of Admin Session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}

          {/* Quick Actions */}
          <button
            type="button"
            onClick={() => setShowAddCourseModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5d5bf6]/10 hover:bg-[#5d5bf6]/20 text-[#5d5bf6] font-bold text-xs border border-[#5d5bf6]/20 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>

          {/* Notification Bell with 100% Functional Interactive Dropdown */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowNotificationPopover(prev => !prev)}
              title="Notifications & Pending Enrollments"
              className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors border-none bg-transparent flex items-center justify-center"
            >
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black absolute -top-0.5 -right-0.5 flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotificationPopover && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotificationPopover(false)} 
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Notifications</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5d5bf6]/10 text-[#5d5bf6]">
                        {pendingCount} Pending
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotificationPopover(false);
                        setActiveTab('accounting');
                      }}
                      className="text-[11px] font-bold text-[#5d5bf6] hover:underline bg-transparent border-none cursor-pointer"
                    >
                      View All in Ledger
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {pendingRequests.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                        <p className="text-xs font-bold text-slate-700">All caught up!</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">No pending enrollment requests right now.</p>
                      </div>
                    ) : (
                      pendingRequests.slice(0, 6).map(req => (
                        <div key={req.id} className="p-3 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                              <span className="font-bold text-xs text-slate-900 truncate">{req.studentName}</span>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">৳{req.amount}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5 pl-3.5">
                              {req.itemTitle}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 pl-3.5">
                              {req.method} · {req.trxId}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleApproveTrx(req.id);
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] inline-flex items-center gap-1 border-none cursor-pointer shadow-2xs active:scale-95"
                              title="Approve this enrollment"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotificationPopover(false);
                        setActiveTab('accounting');
                      }}
                      className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors border-none cursor-pointer"
                    >
                      Go to Enrollments & Ledger
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* MatDash User Profile Chip */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1 cursor-pointer group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden ring-2 ring-[#5d5bf6]/20 shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                alt="Mathew Anderson" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">Mathew Anderson</div>
              <div className="text-[10px] text-slate-400 font-semibold leading-tight">Super Admin</div>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER NAVIGATION DRAWER */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-200">
          {/* Backdrop with smooth blur */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          
          {/* Slide-in sidebar container */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5d5bf6] to-[#7c7afc] flex items-center justify-center font-black text-white text-xs shadow-md shadow-[#5d5bf6]/25">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 tracking-tight">MatDash</span>
                  <span className="block text-[10px] font-bold text-[#5d5bf6] uppercase tracking-wider">
                    EduHunters Admin
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center border-none cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Nav Items */}
            <div className="p-3.5 overflow-y-auto flex-1">
              {renderSidebarNav(true)}
            </div>

            {/* Drawer Footer with Exit Admin & Logout */}
            {(onExitAdmin || onLogoutAdmin) && (
              <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-2">
                {onExitAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      onExitAdmin();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span>Exit Admin Panel</span>
                  </button>
                )}
                {onLogoutAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      onLogoutAdmin();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Admin Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DASHBOARD BODY - RESPONSIVE LAYOUT */}
      <div className="flex flex-col lg:flex-row flex-1 w-full min-h-[calc(100vh-61px)] bg-[#f4f6fa] items-stretch">
        
        {/* DESKTOP SIDEBAR NAVIGATION (LEFT COLUMN) */}
        <aside className="hidden lg:flex w-60 min-w-[240px] max-w-[240px] bg-white border-r border-slate-200/80 p-5 flex-col gap-1 shrink-0 sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto">
          {renderSidebarNav(false)}
        </aside>

        {/* MAIN PANEL VIEW (RIGHT COLUMN) */}
        <main className="flex-1 min-w-0 p-3.5 sm:p-5 lg:p-7 bg-[#f4f6fa] overflow-y-auto w-full">

          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* TOP TITLE & THREE CANDY PASTEL CARDS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Dashboard
                  </h2>
                </div>

                {/* ULTRA-MINIMAL METRIC STAT CARDS (NO ICONS, NO DUPLICATE LABELS) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                  
                  {/* CARD 1: Total Enrolled */}
                  <div 
                    onClick={() => setDashboardMainTab('students')}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Total Enrolled</span>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                        <TrendingUp className="w-3 h-3" />
                        <span>Live</span>
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-3">
                      {enrolledStudents.filter(s => s.status === 'Active').length.toLocaleString()}
                    </div>
                  </div>

                  {/* CARD 2: Pending Verification */}
                  <div 
                    onClick={() => setDashboardMainTab('verification')}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Pending Verification</span>
                      {pendingCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="Needs review" />
                      )}
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-3">
                      {pendingCount}
                    </div>
                  </div>

                  {/* CARD 3: Net Profit */}
                  <div 
                    onClick={() => setActiveTab('accounting')}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Net Profit</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-none mt-3">
                      ৳{accountingTotals.netProfit.toLocaleString()}
                    </div>
                  </div>

                  {/* CARD 4: Total Spendings */}
                  <div 
                    onClick={() => {
                      setTrxFilter('EXPENSE');
                      setActiveTab('accounting');
                    }}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Total Spendings</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight leading-none mt-3">
                      ৳{accountingTotals.totalExpenses.toLocaleString()}
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
                                                  <Edit2 className="w-3 h-3" />
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
                                              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                                                    <Check className="w-3 h-3" />
                                                    <span>Approve</span>
                                                  </button>

                                                  <button
                                                    type="button"
                                                    onClick={() => handleRejectTrx(tx.id)}
                                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer bg-white"
                                                    title="Reject Transaction"
                                                  >
                                                    <X className="w-3 h-3" />
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
                                                <Eye className="w-3 h-3" />
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
          )}

          {/* ========================================================= */}
          {/* TAB 2: ACCOUNTING & LEDGER */}
          {/* ========================================================= */}
          {activeTab === 'accounting' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  Financial Register & Ledger
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddTrxModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-xs active:scale-95 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Entry</span>
                </button>
              </div>

              {/* Summary Cards (Minimal, 2 Side-by-Side on Mobile) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                <div 
                  onClick={() => setTrxFilter('INCOME')}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Total Income</span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-none mt-3">
                    ৳{accountingTotals.totalRevenue.toLocaleString()}
                  </div>
                </div>

                <div 
                  onClick={() => setTrxFilter('EXPENSE')}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Total Expenses</span>
                  <div className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight leading-none mt-3">
                    ৳{accountingTotals.totalExpenses.toLocaleString()}
                  </div>
                </div>

                <div 
                  onClick={() => setTrxFilter('ALL')}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Net Profit</span>
                  <div className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight leading-none mt-3">
                    ৳{accountingTotals.netProfit.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTrx}
                    onChange={(e) => setSearchTrx(e.target.value)}
                    placeholder="Search student, phone, TrxID..."
                    className="w-full bg-[#f4f6fa] border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-slate-400 transition-all font-medium placeholder:text-slate-400"
                  />
                  {searchTrx && (
                    <button
                      type="button"
                      onClick={() => setSearchTrx('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-transparent border-none cursor-pointer p-0.5"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Pills Bar (Scrollable on mobile) */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <button
                    type="button"
                    onClick={() => setTrxFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all whitespace-nowrap ${
                      trxFilter === 'ALL' 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All ({accounting.transactions?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrxFilter('PENDING')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      trxFilter === 'PENDING' 
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' 
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span>Pending</span>
                    {pendingCount > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${trxFilter === 'PENDING' ? 'bg-white text-amber-800' : 'bg-amber-500 text-white'}`}>
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrxFilter('INCOME')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all whitespace-nowrap ${
                      trxFilter === 'INCOME' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrxFilter('EXPENSE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all whitespace-nowrap ${
                      trxFilter === 'EXPENSE' 
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Expenses
                  </button>
                </div>
              </div>

              {/* Ledger Container */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
                {filteredTransactions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 p-8">
                    <DollarSign className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No transactions found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTrx ? `No results matching "${searchTrx}"` : 'No transactions match the selected filter.'}
                    </p>
                    {searchTrx && (
                      <button
                        type="button"
                        onClick={() => setSearchTrx('')}
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
                      {filteredTransactions.map((tx) => {
                        const isIncome = tx.type === 'INCOME';
                        const isPending = tx.status === 'Pending';
                        const isCompleted = tx.status === 'Completed';

                        return (
                          <div 
                            key={tx.id} 
                            className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-2.5 transition-all"
                          >
                            {/* Row 1: Student / Description, Type Badge, Amount */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div 
                                  className="font-bold text-slate-900 text-sm truncate cursor-pointer hover:text-[#5d5bf6] transition-colors"
                                  onClick={() => handleOpenStudentFromTrx(tx)}
                                  title="Click to view full student details"
                                >
                                  {tx.studentName || tx.customer || 'Direct Ledger Entry'}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                  {tx.itemTitle || tx.category || 'General Ledger Entry'}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {editingTrxAmountId === tx.id ? (
                                  <div className="flex items-center gap-1 mt-1 justify-end">
                                    <input
                                      type="number"
                                      value={editingTrxAmountVal}
                                      onChange={(e) => setEditingTrxAmountVal(e.target.value)}
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
                                    <div className={`font-black text-base leading-tight ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {isIncome ? `+৳${(tx.amount || 0).toLocaleString()}` : `-৳${(tx.amount || 0).toLocaleString()}`}
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
                                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{tx.date}</div>
                              </div>
                            </div>

                            {/* Row 2: Method · TrxID · Phone */}
                            <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl font-medium">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-semibold text-slate-700">{tx.method || 'Cash'}</span>
                                {tx.trxId && (
                                  <>
                                    <span className="text-slate-300">·</span>
                                    <span className="font-mono text-slate-600 truncate max-w-[120px]">{tx.trxId}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(tx.trxId, 'trxId')}
                                      className="p-0.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                                      title="Copy TrxID"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                              {tx.studentPhone && (() => {
                                const cleanDigits = (tx.studentPhone || '').replace(/[^0-9]/g, '');
                                const waPhone = cleanDigits.startsWith('880') ? cleanDigits : (cleanDigits.startsWith('0') ? '88' + cleanDigits : ('880' + cleanDigits));
                                return (
                                  <div className="flex items-center gap-1 shrink-0 font-mono text-slate-700">
                                    <span>{tx.studentPhone}</span>
                                    {cleanDigits.length >= 6 && (
                                      <a
                                        href={`https://wa.me/${waPhone}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Chat on WhatsApp"
                                        className="text-emerald-600 hover:text-emerald-700 p-0.5 inline-flex items-center"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Row 3: Status Badge & Minimal Actions */}
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border ${
                                isPending
                                  ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                                }`} />
                                <span>{isCompleted ? 'Approved' : 'Pending'}</span>
                              </span>

                              <div className="flex items-center gap-1">
                                {tx.status !== 'Completed' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveTrx(tx.id)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer border-none active:scale-95"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeTrx(tx.id)}
                                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer border-none active:scale-95"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Revoke</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTrx(tx.id)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer bg-white"
                                  title="Delete"
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
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[11px] tracking-wider">
                            <th className="py-3 px-4">ID</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Student / Description</th>
                            <th className="py-3 px-4">Course / Product</th>
                            <th className="py-3 px-4">Method</th>
                            <th className="py-3 px-4">TrxID</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-right">Amount</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-slate-400">{tx.id}</td>
                              <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{tx.date}</td>
                              <td className="py-3 px-4">
                                {(() => {
                                  const cleanDigits = (tx.studentPhone || '').replace(/[^0-9]/g, '');
                                  const waPhone = cleanDigits.startsWith('880') ? cleanDigits : (cleanDigits.startsWith('0') ? '88' + cleanDigits : ('880' + cleanDigits));
                                  return (
                                    <div>
                                      <div 
                                        className="font-bold text-slate-900 cursor-pointer hover:text-[#5d5bf6] transition-colors"
                                        onClick={() => handleOpenStudentFromTrx(tx)}
                                        title="Click to view full student details"
                                      >
                                        {tx.studentName}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                        <span className="font-mono">{tx.studentPhone}</span>
                                        {cleanDigits.length >= 6 && (
                                          <a
                                            href={`https://wa.me/${waPhone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Chat on WhatsApp"
                                            className="text-emerald-600 hover:text-emerald-700 p-0.5 inline-flex items-center"
                                          >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="py-3 px-4 font-medium max-w-[200px] truncate text-slate-800" title={tx.itemTitle}>
                                {tx.itemTitle}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {tx.method}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{tx.trxId}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  tx.status === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                }`}>
                                  {tx.status === 'Completed' ? 'Approved' : 'Pending'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-black text-sm whitespace-nowrap">
                                {editingTrxAmountId === tx.id ? (
                                  <div className="flex items-center justify-end gap-1">
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
                                      title="Save"
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
                                  <div className="flex items-center justify-end gap-1.5 group">
                                    <span className={tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}>
                                      {tx.type === 'INCOME' ? `+৳${(tx.amount || 0).toLocaleString()}` : `-৳${(tx.amount || 0).toLocaleString()}`}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingTrxAmountId(tx.id);
                                        setEditingTrxAmountVal(String(tx.amount || 0));
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-[#5d5bf6] transition-opacity cursor-pointer border-none"
                                      title="Edit Amount"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {tx.status !== 'Completed' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleApproveTrx(tx.id)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs border-none cursor-pointer transition-all active:scale-95"
                                      title="Approve Enrollment"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Approve</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeTrx(tx.id)}
                                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs border-none cursor-pointer transition-all active:scale-95"
                                      title="Revoke Approval & Lock Access"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>Revoke</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTrx(tx.id)}
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 border-none bg-transparent cursor-pointer transition-colors"
                                    title="Delete Transaction"
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
            </div>
          )}


          {/* ========================================================= */}
          {/* TAB: USERS MANAGEMENT (MATDASH STYLE) */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
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
                        setEditingUserId(null);
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
                        setShowAddUserModal(true);
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

                {/* Filter Controls (Clean Segmented / Compact Dropdowns on Mobile, Full on Desktop) */}
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

              {/* User Directory Table Card */}
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
                      {filteredUsers.map((user) => {
                        const isActive = user.status === 'Active';
                        const isPending = user.status === 'Pending';
                        const contactNum = user.whatsapp || user.phone || '';
                        const cleanDigits = contactNum.replace(/[^0-9]/g, '');
                        const waPhone = cleanDigits.startsWith('880') ? cleanDigits : (cleanDigits.startsWith('0') ? '88' + cleanDigits : ('880' + cleanDigits));
                        const displayId = user.id ? (user.id.startsWith('usr-') ? user.id.toUpperCase() : (user.id.length > 10 ? `STU-${user.id.slice(0, 6).toUpperCase()}` : user.id.toUpperCase())) : 'STU-001';
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
                                  onClick={() => setSelectedUserDetails(user)}
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
                                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{displayId}</div>
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
                                  onClick={() => setSelectedUserDetails(user)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer bg-white"
                                  title="View Profile"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickEnrollUser(user);
                                    setSelectedCourseToEnroll(courses[0]?.title || '');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-[#5d5bf6] text-[#5d5bf6] hover:text-white border border-indigo-200/80 font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                                  title="Grant Course Access"
                                >
                                  <GraduationCap className="w-3 h-3" />
                                  <span>Grant Course</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditUser(user)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer bg-white"
                                  title="Edit User"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user.id, user.name)}
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
                            <th className="py-3 px-4">ID</th>
                            <th className="py-3 px-4">Date</th>
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
                          {filteredUsers.map((user) => {
                            const isActive = user.status === 'Active';
                            const isPending = user.status === 'Pending';
                            const contactNum = user.whatsapp || user.phone || '';
                            const cleanDigits = contactNum.replace(/[^0-9]/g, '');
                            const waPhone = cleanDigits.startsWith('880') ? cleanDigits : (cleanDigits.startsWith('0') ? '88' + cleanDigits : ('880' + cleanDigits));
                            
                            // Display ID in TRX/STU style
                            const displayId = user.id ? (user.id.startsWith('usr-') ? user.id.toUpperCase() : (user.id.length > 10 ? `STU-${user.id.slice(0, 6).toUpperCase()}` : user.id.toUpperCase())) : 'STU-001';

                            // Enrolled courses display (Canonicalized - No Duplicates)
                            const canonicalCourses = getCanonicalCourses(user.enrolledCourses, { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA });
                            const enrolledTitle = canonicalCourses.length > 0
                              ? (canonicalCourses[0] + (canonicalCourses.length > 1 ? ` (+${canonicalCourses.length - 1})` : ''))
                              : 'No enrolled courses';

                            return (
                              <tr key={user.id} className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors">
                                {/* ID */}
                                <td className="py-3.5 px-4 text-xs font-mono text-slate-400 font-medium whitespace-nowrap">
                                  {displayId}
                                </td>

                                {/* Date */}
                                <td className="py-3.5 px-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                                  {user.joinedDate || '2026-10-09'}
                                </td>

                                {/* Student / Description */}
                                <td className="py-3.5 px-4">
                                  <div className="min-w-[150px]">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <div 
                                        className="font-bold text-xs text-slate-900 hover:text-blue-600 transition-colors cursor-pointer truncate max-w-[140px]"
                                        onClick={() => setSelectedUserDetails(user)}
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
                                          setSelectedUserDetails(user);
                                          setUserTabInsideModal('courses');
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
                                          setQuickEnrollUser(user);
                                          setSelectedCourseToEnroll(courses[0]?.title || '');
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
                                        onClick={() => handleCopyText(contactNum, 'Phone')} 
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

                                {/* Status (Exact Reference Image Pill Badge) */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <button
                                    onClick={() => handleToggleUserStatus(user.id)}
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
                                        setQuickEnrollUser(user);
                                        setSelectedCourseToEnroll(courses[0]?.title || '');
                                      }}
                                      title="Grant Course Access"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-[#5d5bf6] text-[#5d5bf6] hover:text-white border border-indigo-200/80 font-bold text-[11px] transition-all cursor-pointer shadow-2xs active:scale-95"
                                    >
                                      <GraduationCap className="w-3.5 h-3.5" />
                                      <span>Grant Course</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedUserDetails(user)}
                                      title="View Profile & Enrollments"
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditUser(user)}
                                      title="Edit User Info"
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(user.id, user.name)}
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
          )}

          {/* ========================================================= */}
          {/* TAB 3: HERO SLIDES */}
          {/* ========================================================= */}
          {activeTab === 'slides' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Sliders className="w-6 h-6 text-blue-600" />
                    Hero Carousel Slider ({heroSlides.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage top promotional banners, titles, and action links on the homepage.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddSlideModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Add New Slide
                </button>
              </div>

              {/* Slider Grid */}
              {heroSlides.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 sm:p-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Sliders className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">কোনো স্লাইড যোগ করা নেই</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    হোমপেজের টপ স্লাইডার ব্যানারে নতুন স্লাইড যোগ করতে উপরের "Add New Slide" বাটনে ক্লিক করুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddSlideModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-md shadow-blue-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    নতুন স্লাইড যোগ করুন
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {heroSlides.map((slide, idx) => (
                    <div key={slide.id || idx} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer?.files?.[0];
                          if (file) {
                            handleDeviceFileUpload(file, (url) => {
                              const updated = heroSlides.map((s, i) => i === idx ? { ...s, image: url } : s);
                              setHeroSlides(updated);
                              persistAll({ heroSlides: updated });
                            });
                          }
                        }}
                        className="relative aspect-[3.6/1.5] bg-slate-100 overflow-hidden"
                      >
                        <img 
                          src={slide.image} 
                          alt={slide.title} 
                          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = "https://assets.codervai.com/banners/1781465730213-cropped-image.webp";
                          }}
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 shadow-2xs">
                            Slide #{idx + 1}
                          </span>
                        </div>

                        {/* Reorder Buttons Overlay */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              if (idx === 0) return;
                              const copy = [...heroSlides];
                              const temp = copy[idx];
                              copy[idx] = copy[idx - 1];
                              copy[idx - 1] = temp;
                              setHeroSlides(copy);
                              persistAll({ heroSlides: copy });
                            }}
                            className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 disabled:opacity-40 flex items-center justify-center border-none shadow-xs cursor-pointer transition-transform hover:scale-105"
                            title="Move Left / Earlier"
                          >
                            <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === heroSlides.length - 1}
                            onClick={() => {
                              if (idx === heroSlides.length - 1) return;
                              const copy = [...heroSlides];
                              const temp = copy[idx];
                              copy[idx] = copy[idx + 1];
                              copy[idx + 1] = temp;
                              setHeroSlides(copy);
                              persistAll({ heroSlides: copy });
                            }}
                            className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 disabled:opacity-40 flex items-center justify-center border-none shadow-xs cursor-pointer transition-transform hover:scale-105"
                            title="Move Right / Later"
                          >
                            <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <label className="text-[11px] text-slate-500 font-semibold block mb-1">Banner Title</label>
                          <input
                            type="text"
                            value={slide.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = heroSlides.map((s, i) => i === idx ? { ...s, title: val } : s);
                              setHeroSlides(updated);
                              persistAll({ heroSlides: updated });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] text-slate-500 font-semibold">Banner Image (Drag & Drop or Pick)</label>
                            <label className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                              <Upload className="w-3 h-3" />
                              Select Photo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleDeviceFileUpload(file, (url) => {
                                      const updated = heroSlides.map((s, i) => i === idx ? { ...s, image: url } : s);
                                      setHeroSlides(updated);
                                      persistAll({ heroSlides: updated });
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            value={slide.image}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = heroSlides.map((s, i) => i === idx ? { ...s, image: val } : s);
                              setHeroSlides(updated);
                              persistAll({ heroSlides: updated });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-500 font-semibold block mb-1">Action Link URL</label>
                          <input
                            type="text"
                            value={slide.link}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = heroSlides.map((s, i) => i === idx ? { ...s, link: val } : s);
                              setHeroSlides(updated);
                              persistAll({ heroSlides: updated });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          />
                          {/* Quick Link Presets */}
                          <div className="flex items-center gap-1 flex-wrap mt-1.5">
                            <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                            {['/courses', '/exams', '/exams?category=medical', '/exams?category=sureshot', '/store', '/bundles'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  const updated = heroSlides.map((s, i) => i === idx ? { ...s, link: preset } : s);
                                  setHeroSlides(updated);
                                  persistAll({ heroSlides: updated });
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono transition-colors border-none cursor-pointer"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Type: <span className="text-blue-600">{slide.type || 'banner'}</span>
                        </span>
                        {slideToDelete === idx ? (
                          <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                            <span className="text-[11px] text-rose-600 font-bold mr-0.5">মুছবেন?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlide(idx)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-colors border-none cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                              মুছুন
                            </button>
                            <button
                              type="button"
                              onClick={() => setSlideToDelete(null)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold rounded-lg transition-colors border-none cursor-pointer"
                            >
                              বাতিল
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSlideToDelete(idx)}
                            className="text-slate-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer p-0 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: STATS & TEXT */}
          {/* ========================================================= */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200/80 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <PieChart className="w-6 h-6 text-amber-500" />
                  Homepage Counters & Announcements
                </h2>
                <p className="text-xs text-slate-500">
                  Manage live metrics counters (students, members) and top announcement notice bar text.
                </p>
              </div>

              {/* Top Banner Notice */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <label className="text-xs font-bold text-slate-800 block">
                  📢 Top Notice & Special Announcement Bar
                </label>
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => {
                    setAnnouncement(e.target.value);
                    persistAll({ announcement: e.target.value });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  placeholder="Enter notice text..."
                />
              </div>

              {/* Red Stats Strip Counters */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  🔴 Counter Strip Metrics (Hero Section Counters)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {homeStats.map((st, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-blue-600">Counter #{idx + 1}</span>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-1">Counter Value (e.g. 3000+)</label>
                        <input
                          type="text"
                          value={st.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = homeStats.map((item, i) => i === idx ? { ...item, value: val } : item);
                            setHomeStats(updated);
                            persistAll({ homeStats: updated });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-black text-slate-900 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block mb-1">Label / Title</label>
                        <input
                          type="text"
                          value={st.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = homeStats.map((item, i) => i === idx ? { ...item, label: val } : item);
                            setHomeStats(updated);
                            persistAll({ homeStats: updated });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: EXAM RESULTS & LIVE LEADERBOARD (CLEAN & PROFESSIONAL SAAS) */}
          {/* ========================================================= */}
          {activeTab === 'results' && (
            <div className="space-y-6">

              {/* 1. TOP HEADER & CONTROLS */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shrink-0 shadow-xs">
                    <Trophy className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Exam Results & Live Leaderboard
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1.5 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Synced
                      </span>
                      {submissionsLastRefreshed && (
                        <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
                          Updated: {submissionsLastRefreshed}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                      শিক্ষার্থীদের পরীক্ষার ফলাফল, খাতা মূল্যায়ন ও রিয়েল-টাইম মেধা তালিকা ব্যবস্থাপনা।
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Export results to CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={loadExamSubmissions}
                    disabled={isLoadingSubmissions}
                    className="px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4b49e0] text-white font-bold text-xs shadow-md shadow-[#5d5bf6]/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSubmissions ? 'animate-spin' : ''}`} />
                    <span>{isLoadingSubmissions ? 'Syncing...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {/* 2. THREE SEGMENTED NAVIGATION TABS */}
              <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setExamViewMode('leaderboard')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                    examViewMode === 'leaderboard'
                      ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-sm'
                      : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-50'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>কোর্স ও পরীক্ষা ভিত্তিক লিডারবোর্ড</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExamViewMode('gradebook')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                    examViewMode === 'gradebook'
                      ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-sm'
                      : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>শিক্ষার্থী গ্রেডবুক ও খাতা ({studentGradebookList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExamViewMode('submissions')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                    examViewMode === 'submissions'
                      ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-sm'
                      : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>সকল জমার লাইভ লেজার ({filteredSubmissions.length})</span>
                </button>
              </div>

              {/* 3. FOUR METRIC SUMMARY CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                {/* Total Submissions */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Total Submissions</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-3">
                    {examStats.totalSubs}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-1">
                    মোট জমা হওয়া পরীক্ষার খাতা
                  </span>
                </div>

                {/* Unique Examinees */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Unique Examinees</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight leading-none mt-3">
                    {examStats.uniqueExaminees}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-1">
                    অংশগ্রহণকারী পৃথক শিক্ষার্থী
                  </span>
                </div>

                {/* Avg Accuracy */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Average Score</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-none mt-3">
                    {examStats.avgPct}%
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-1">
                    সার্বিক গড় অ্যাক্যুরেসি
                  </span>
                </div>

                {/* Top Performer */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Highest Mark</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Trophy className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight leading-none mt-3 truncate">
                    {examStats.topScorer ? `${examStats.topScorer.score} / ${examStats.topScorer.total_marks}` : '0'}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-1 truncate">
                    {examStats.topScorer ? examStats.topScorer.student_name : 'No submissions yet'}
                  </span>
                </div>
              </div>

              {/* 4. TAB 1: 🏆 কোর্স ও পরীক্ষা ভিত্তিক লিডারবোর্ড (Course & Exam Batches Leaderboard) */}
              {examViewMode === 'leaderboard' && (
                <div className="space-y-6">
                  {/* Step A: Course Selection Cards */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#5d5bf6]" />
                        ১. কোর্স নির্বাচন করুন (Select Course):
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        মোট {courses.length} টি কোর্স
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {courses.map(c => {
                        const cKey = String(c.id || c.slug);
                        const isSelected = String(leaderboardCourseId).toLowerCase() === String(c.id).toLowerCase() ||
                                           String(leaderboardCourseId).toLowerCase() === String(c.slug || '').toLowerCase();
                        const cSubmissions = examSubmissions.filter(s => 
                          String(s.course_id || '').toLowerCase() === String(c.id).toLowerCase() ||
                          String(s.course_slug || '').toLowerCase() === String(c.slug || '').toLowerCase()
                        );

                        return (
                          <button
                            key={cKey}
                            type="button"
                            onClick={() => {
                              setLeaderboardCourseId(cKey);
                              setLeaderboardLessonId('');
                            }}
                            className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border flex items-center gap-3 ${
                              isSelected
                                ? 'bg-indigo-50/60 border-[#5d5bf6] text-slate-900 shadow-sm ring-2 ring-[#5d5bf6]/20'
                                : 'bg-slate-50/60 hover:bg-white hover:border-slate-300 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? 'bg-[#5d5bf6] border-[#5d5bf6] text-white shadow-xs'
                                : 'bg-white border-slate-200 text-slate-500'
                            }`}>
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                                {c.title || c.name || 'Course'}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                                <span className="font-medium">{c.category || 'Batch'}</span>
                                <span>•</span>
                                <span className="text-indigo-600 font-bold">{cSubmissions.length} খাতা জমা</span>
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#5d5bf6] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step B: Chapter / Exam Selector Pills */}
                  {currentLeaderboardCourse && (
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-500" />
                          ২. অধ্যায় বা পরীক্ষা নির্বাচন করুন ({currentLeaderboardCourse.title}):
                        </span>
                        <span className="text-xs text-slate-400">
                          {currentCourseLessons.length} টি পরীক্ষা অন্তর্ভুক্ত
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Overall course ranking pill */}
                        <button
                          type="button"
                          onClick={() => setLeaderboardLessonId('')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                            !leaderboardLessonId || leaderboardLessonId === 'ALL' || leaderboardLessonId === 'overall'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <Trophy className="w-3.5 h-3.5 text-white" />
                          <span>কোর্সের সামগ্রিক মেধা তালিকা (Cumulative Overall)</span>
                        </button>

                        {/* Lessons / Exams pills */}
                        {currentCourseLessons.map((les, idx) => {
                          const isLesActive = leaderboardLessonId === les.lessonId;
                          return (
                            <button
                              key={les.lessonId}
                              type="button"
                              onClick={() => setLeaderboardLessonId(les.lessonId)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                                isLesActive
                                  ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-sm font-bold'
                                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                                isLesActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="truncate max-w-[200px]">{les.title}</span>
                              {isLesActive && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step C: The Iconic 3D Podium & Avatars (Clean & Elegant Enterprise Design) */}
                  {isLoadingLeaderboard ? (
                    <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center">
                      <RefreshCw className="w-8 h-8 text-[#5d5bf6] animate-spin mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-800">মেধাতালিকা ও পোডিয়াম লোড হচ্ছে...</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-slate-900">
                            শীর্ষ ৩ মেধা পোডিয়াম (Top 3 Standings)
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            রিয়েল-টাইম স্কোর ও সময় অনুসারে স্বয়ংক্রিয়ভাবে নির্ধারিত পোডিয়াম।
                          </p>
                        </div>
                      </div>

                      {/* 3-Column Podium Stage */}
                      <div className="pt-6 pb-2">
                        <div className="flex items-end justify-center w-full max-w-[460px] sm:max-w-[520px] mx-auto">
                          {/* RANK 2 (SILVER - LEFT) */}
                          {(() => {
                            const rank2 = leaderboardData[1] || null;
                            return (
                              <div className="w-[32%] min-w-0 flex flex-col items-center relative z-10 -mr-1">
                                <div className="flex flex-col items-center mb-3 animate-in fade-in duration-300 w-full">
                                  {rank2 ? (
                                    <>
                                      <div className="relative group shrink-0">
                                        <img 
                                          src={rank2.avatar || rank2.student_avatar || '/avatar.svg'} 
                                          alt={rank2.student_name || 'Rank 2'}
                                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-slate-300 shadow-md relative z-10 shrink-0"
                                          onError={(e) => { e.target.onerror = null; e.target.src = '/avatar.svg'; }}
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-500 text-white font-bold text-[10px] flex items-center justify-center border border-white z-20 shadow-xs">
                                          2
                                        </div>
                                      </div>
                                      <span className="text-xs font-bold text-slate-800 truncate max-w-full px-1 text-center mt-2 tracking-tight block">
                                        {rank2.student_name || 'Student'}
                                      </span>
                                      <div className="mt-1">
                                        <AdminTokenPill points={rank2.score ?? rank2.total_score} variant="silver" />
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                        {formatMinimalTime(rank2.time_taken_seconds ?? rank2.total_time_seconds)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setInspectingSubmission(rank2)}
                                        className="mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                                      >
                                        খাতা দেখুন
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-400">
                                        <span className="font-bold text-sm">২</span>
                                      </div>
                                      <span className="text-[11px] font-medium text-slate-400 truncate max-w-full px-1 text-center mt-2 block">
                                        ২য় স্থান (খালি)
                                      </span>
                                      <div className="mt-1">
                                        <AdminTokenPill points="--" variant="silver" />
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* 3D Pillar #2 */}
                                <div className="w-full flex flex-col items-center relative">
                                  <div className="w-full h-7 sm:h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 border-t-2 border-slate-400 rounded-t-xl shadow-xs" />
                                  <div className="w-full h-32 sm:h-38 bg-gradient-to-b from-slate-50 to-slate-100 border-x border-b border-slate-200 flex flex-col items-center justify-center relative">
                                    <span className="font-black text-4xl sm:text-5xl text-slate-400/50 select-none">
                                      2
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* RANK 1 (GOLD - CENTER - TALLEST & PROTRUDING) */}
                          {(() => {
                            const rank1 = leaderboardData[0] || null;
                            return (
                              <div className="w-[36%] min-w-0 flex flex-col items-center relative z-20">
                                <div className="flex flex-col items-center mb-3.5 animate-in fade-in duration-300 w-full">
                                  {rank1 ? (
                                    <>
                                      <div className="relative group shrink-0">
                                        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-base z-30 animate-bounce">
                                          👑
                                        </span>
                                        <img 
                                          src={rank1.avatar || rank1.student_avatar || '/avatar.svg'} 
                                          alt={rank1.student_name || 'Rank 1'}
                                          className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-amber-400 shadow-lg relative z-10 shrink-0"
                                          onError={(e) => { e.target.onerror = null; e.target.src = '/avatar.svg'; }}
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center border-2 border-white z-20 shadow-xs">
                                          1
                                        </div>
                                      </div>
                                      <span className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-full px-1 text-center mt-2 tracking-tight block">
                                        {rank1.student_name || 'Champion'}
                                      </span>
                                      <div className="mt-1">
                                        <AdminTokenPill points={rank1.score ?? rank1.total_score} variant="gold" size="lg" />
                                      </div>
                                      <span className="text-[10px] text-amber-700 font-mono mt-0.5 font-bold">
                                        {formatMinimalTime(rank1.time_taken_seconds ?? rank1.total_time_seconds)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setInspectingSubmission(rank1)}
                                        className="mt-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors cursor-pointer shadow-xs"
                                      >
                                        খাতা দেখুন
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-amber-400 flex items-center justify-center bg-amber-50/50 text-amber-500">
                                        <span className="font-bold text-base">১</span>
                                      </div>
                                      <span className="text-xs font-medium text-slate-400 truncate max-w-full px-1 text-center mt-2 block">
                                        ১ম স্থান (খালি)
                                      </span>
                                      <div className="mt-1">
                                        <AdminTokenPill points="--" variant="gold" size="lg" />
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* 3D Pillar #1 */}
                                <div className="w-full flex flex-col items-center relative">
                                  <div className="w-full h-8 sm:h-9 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 border-t-2 border-amber-400 rounded-t-xl shadow-xs" />
                                  <div className="w-full h-42 sm:h-48 bg-gradient-to-b from-amber-50 to-amber-100/70 border-x border-b border-amber-200 flex flex-col items-center justify-center relative">
                                    <span className="font-black text-5xl sm:text-6xl text-amber-500/40 select-none">
                                      1
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* RANK 3 (BRONZE - RIGHT) */}
                          {(() => {
                            const rank3 = leaderboardData[2] || null;
                            return (
                              <div className="w-[32%] min-w-0 flex flex-col items-center relative z-10 -ml-1">
                                <div className="flex flex-col items-center mb-3 animate-in fade-in duration-300 w-full">
                                  {rank3 ? (
                                    <>
                                      <div className="relative group shrink-0">
                                        <img 
                                          src={rank3.avatar || rank3.student_avatar || '/avatar.svg'} 
                                          alt={rank3.student_name || 'Rank 3'}
                                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-amber-600/40 shadow-md relative z-10 shrink-0"
                                          onError={(e) => { e.target.onerror = null; e.target.src = '/avatar.svg'; }}
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white font-bold text-[10px] flex items-center justify-center border border-white z-20 shadow-xs">
                                          3
                                        </div>
                                      </div>
                                      <span className="text-xs font-bold text-slate-800 truncate max-w-full px-1 text-center mt-2 tracking-tight block">
                                        {rank3.student_name || 'Student'}
                                      </span>
                                      <div className="mt-1">
                                        <AdminTokenPill points={rank3.score ?? rank3.total_score} variant="bronze" />
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                        {formatMinimalTime(rank3.time_taken_seconds ?? rank3.total_time_seconds)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setInspectingSubmission(rank3)}
                                        className="mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold text-orange-800 bg-orange-100 hover:bg-orange-200 border border-orange-200 transition-colors cursor-pointer"
                                      >
                                        খাতা দেখুন
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-amber-700/30 flex items-center justify-center bg-orange-50/40 text-orange-400">
                                        <span className="font-bold text-sm">৩</span>
                                      </div>
                                      <span className="text-[11px] font-medium text-slate-400 truncate max-w-full px-1 text-center mt-2 block">
                                        ৩য় স্থান (খালি)
                                      </span>
                                      <div className="mt-1">
                                        <AdminTokenPill points="--" variant="bronze" />
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* 3D Pillar #3 */}
                                <div className="w-full flex flex-col items-center relative">
                                  <div className="w-full h-7 sm:h-8 bg-gradient-to-r from-amber-100 via-orange-200 to-amber-100 border-t-2 border-amber-600/40 rounded-t-xl shadow-xs" />
                                  <div className="w-full h-26 sm:h-30 bg-gradient-to-b from-orange-50/70 to-orange-100/60 border-x border-b border-orange-200 flex flex-col items-center justify-center relative">
                                    <span className="font-black text-4xl sm:text-5xl text-orange-400/50 select-none">
                                      3
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step D: Ranks 4+ Standings List Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        পূর্ণাঙ্গ মেধাতালিকা (Full Merit Standings - {leaderboardData.length} Students)
                      </h4>
                      <span className="text-xs text-slate-400">
                        টাই-ব্রেকার: স্কোর &gt; সময় &gt; প্রথম জমা
                      </span>
                    </div>

                    {leaderboardData.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        এখনও কোনো শিক্ষার্থী এই পরীক্ষায় অংশগ্রহণ করেনি। শিক্ষার্থীরা পরীক্ষা দিলে স্বয়ংক্রিয়ভাবে লাইভ মেধাতালিকায় নাম প্রদর্শিত হবে।
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {leaderboardData.map((student, idx) => {
                          const rank = student.rank || idx + 1;
                          const rawPoints = student.score ?? student.total_score ?? 0;
                          const sec = student.time_taken_seconds ?? student.total_time_seconds ?? 0;

                          return (
                            <div 
                              key={student.id || student.student_id || idx}
                              className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`w-7 text-center font-black text-sm shrink-0 ${
                                  rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-slate-500' : rank === 3 ? 'text-amber-700' : 'text-slate-400'
                                }`}>
                                  #{rank}
                                </span>

                                <img 
                                  src={student.avatar || student.student_avatar || '/avatar.svg'} 
                                  alt={student.student_name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-slate-100 shrink-0"
                                  onError={(e) => { e.target.onerror = null; e.target.src = '/avatar.svg'; }}
                                />

                                <div className="min-w-0">
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                    {student.student_name || 'Anonymous Student'}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 font-mono">
                                    {student.student_phone || student.student_email || ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <span className="font-black text-slate-900 text-sm block">
                                    {rawPoints} pts
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-mono block">
                                    {formatMinimalTime(sec)}
                                  </span>
                                </div>

                                {/* View Paper Button */}
                                <button
                                  type="button"
                                  onClick={() => setInspectingSubmission(student)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#5d5bf6] text-xs font-bold border border-indigo-200 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                                  title="View full answer sheet and evaluate marks"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#5d5bf6]" />
                                  <span className="hidden sm:inline">খাতা দেখুন</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. TAB 2: 👤 শিক্ষার্থী গ্রেডবুক ও খাতা মূল্যায়ন (Individual Student Gradebook) */}
              {examViewMode === 'gradebook' && (
                <div className="space-y-5">
                  {/* Student Search & Quick Select */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          শিক্ষার্থী খুঁজুন ও খাতা মূল্যায়ন
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          যেকোনো শিক্ষার্থীর নাম বা ফোন নম্বর লিখে তার সম্পূর্ণ পরীক্ষার ফলাফল ও খাতা দেখুন।
                        </p>
                      </div>

                      {/* Search Input */}
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="নাম বা মোবাইল নম্বর..."
                          value={gradebookSearchQuery}
                          onChange={(e) => setGradebookSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-800 outline-none focus:border-[#5d5bf6] focus:ring-1 focus:ring-[#5d5bf6] font-medium"
                        />
                        {gradebookSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setGradebookSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Student Chips */}
                    {filteredGradebookStudents.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="text-[11px] font-semibold text-slate-400 shrink-0">তালিকা:</span>
                        {filteredGradebookStudents.slice(0, 15).map(st => {
                          const isSel = selectedGradebookStudentKey === st.studentKey;
                          return (
                            <button
                              key={st.studentKey}
                              type="button"
                              onClick={() => setSelectedGradebookStudentKey(st.studentKey)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                                isSel
                                  ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-xs'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span>{st.student_name}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {st.submissions.length}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Active Student Details & Gradebook Table */}
                  {activeGradebookStudent ? (
                    <div className="space-y-4">
                      {/* Student Profile Summary Banner */}
                      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-full bg-[#5d5bf6] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-xs">
                            {(activeGradebookStudent.student_name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-black text-slate-900">
                                {activeGradebookStudent.student_name}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-[#5d5bf6] border border-indigo-200">
                                {activeGradebookStudent.submissions.length} টি পরীক্ষা সম্পন্ন
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              {activeGradebookStudent.student_phone || 'ফোন নম্বর নেই'} · {activeGradebookStudent.student_email || ''}
                            </p>
                          </div>
                        </div>

                        {/* Summary Badges */}
                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">গড় নম্বর</span>
                            <span className="text-lg font-black text-emerald-600">
                              {activeGradebookStudent.avgScore}%
                            </span>
                          </div>
                          <div className="h-8 w-px bg-slate-200 hidden md:block" />
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">সর্বোচ্চ স্কোর</span>
                            <span className="text-lg font-black text-amber-600">
                              {activeGradebookStudent.highestScore}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Exams History Table */}
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            পরীক্ষার ইতিহাস ও খাতার তালিকা ({activeGradebookStudent.submissions.length} টি জমা)
                          </h4>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-50/80 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-3 px-4">#</th>
                                <th className="py-3 px-4">কোর্স</th>
                                <th className="py-3 px-4">পরীক্ষার নাম</th>
                                <th className="py-3 px-4 text-center">প্রাপ্ত নম্বর</th>
                                <th className="py-3 px-4 text-center">অ্যাকুরেসি</th>
                                <th className="py-3 px-4 text-center">ব্যয়িত সময়</th>
                                <th className="py-3 px-4">জমার তারিখ</th>
                                <th className="py-3 px-4 text-center">খাতা দেখুন</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {activeGradebookStudent.submissions.map((sub, idx) => {
                                const pct = sub.percentage ?? 0;
                                const isExcellent = pct >= 80;
                                const isPass = pct >= 50;

                                return (
                                  <tr key={sub.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                    <td className="py-3 px-4">
                                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                                        {sub.course_name || 'Course'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 font-bold text-slate-900">
                                      {sub.lesson_title || 'Exam'}
                                    </td>
                                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                                      <span className="text-amber-600">{sub.score}</span> / {sub.total_marks}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        isExcellent 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                          : isPass
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : 'bg-rose-50 text-rose-700 border-rose-200'
                                      }`}>
                                        {pct}%
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                                      {formatMinimalTime(sub.time_taken_seconds)}
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <button
                                        type="button"
                                        onClick={() => setInspectingSubmission(sub)}
                                        className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#5d5bf6] text-xs font-bold border border-indigo-200 transition-all cursor-pointer flex items-center gap-1 mx-auto active:scale-95"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-[#5d5bf6]" />
                                        <span>খাতা দেখুন</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-16 border border-slate-200/80 text-center text-slate-400">
                      কোনো শিক্ষার্থী পাওয়া যায়নি। উপরের সার্চ বারে ফোন বা নাম দিয়ে খুঁজুন।
                    </div>
                  )}
                </div>
              )}

              {/* 6. TAB 3: 📋 সকল জমার লাইভ লেজার (All Submissions Master Ledger) */}
              {examViewMode === 'submissions' && (
                <div className="space-y-4">
                  {/* Filter Toolbar (Responsive Flex, NEVER OVERFLOWS) */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="শিক্ষার্থীর নাম, ফোন, ইমেইল বা পরীক্ষার নাম দিয়ে খুঁজুন..."
                        value={examSubmissionsSearch}
                        onChange={(e) => setExamSubmissionsSearch(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-800 outline-none focus:border-[#5d5bf6] focus:ring-1 focus:ring-[#5d5bf6] font-medium transition-all"
                      />
                      {examSubmissionsSearch && (
                        <button
                          type="button"
                          onClick={() => setExamSubmissionsSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedExamCourseFilter}
                        onChange={(e) => {
                          setSelectedExamCourseFilter(e.target.value);
                          setSelectedExamFilter('ALL');
                        }}
                        className="bg-slate-50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:border-[#5d5bf6]"
                      >
                        <option value="ALL">সকল কোর্স (All Courses)</option>
                        {submissionCourseOptions.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>

                      <select
                        value={selectedExamFilter}
                        onChange={(e) => setSelectedExamFilter(e.target.value)}
                        className="bg-slate-50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:border-[#5d5bf6] max-w-[200px]"
                      >
                        <option value="ALL">সকল পরীক্ষা (All Exams)</option>
                        {submissionExamOptions.map(e => (
                          <option key={e.id} value={e.id}>{e.title}</option>
                        ))}
                      </select>

                      <select
                        value={examAttemptFilter}
                        onChange={(e) => setExamAttemptFilter(e.target.value)}
                        className="bg-slate-50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:border-[#5d5bf6]"
                      >
                        <option value="ALL">সকল অ্যাটেম্পট</option>
                        <option value="OFFICIAL">অফিসিয়াল ১ম চেষ্টা (Official 1st)</option>
                        <option value="RETAKE">প্র্যাকটিস রিটেক (Retake)</option>
                      </select>

                      {(examSubmissionsSearch || selectedExamCourseFilter !== 'ALL' || selectedExamFilter !== 'ALL' || examAttemptFilter !== 'ALL') && (
                        <button
                          type="button"
                          onClick={() => {
                            setExamSubmissionsSearch('');
                            setSelectedExamCourseFilter('ALL');
                            setSelectedExamFilter('ALL');
                            setExamAttemptFilter('ALL');
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Submissions Table */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50/80 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-3.5 px-4">#</th>
                          <th className="py-3.5 px-4">শিক্ষার্থী</th>
                          <th className="py-3.5 px-4">কোর্স</th>
                          <th className="py-3.5 px-4">পরীক্ষার নাম</th>
                          <th className="py-3.5 px-4 text-center">নম্বর</th>
                          <th className="py-3.5 px-4 text-center">অ্যাকুরেসি</th>
                          <th className="py-3.5 px-4 text-center">সময়</th>
                          <th className="py-3.5 px-4 text-center">ধরন</th>
                          <th className="py-3.5 px-4">তারিখ</th>
                          <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="py-16 text-center text-slate-400">
                              <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                              <p className="font-bold text-sm text-slate-700">কোনো পরীক্ষার ফলাফল পাওয়া যায়নি</p>
                              <p className="text-xs text-slate-400 mt-1">শিক্ষার্থীরা পরীক্ষা দিলে এখানে স্বয়ংক্রিয়ভাবে জমা হবে।</p>
                            </td>
                          </tr>
                        ) : (
                          filteredSubmissions.map((sub, idx) => {
                            const pct = sub.percentage ?? 0;
                            const isExcellent = pct >= 80;
                            const isPass = pct >= 50;
                            const isOfficial = sub.is_first_attempt !== false && (!sub.attempt_number || Number(sub.attempt_number) <= 1);

                            return (
                              <tr key={sub.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-[#5d5bf6] text-white font-black text-xs flex items-center justify-center shrink-0">
                                      {(sub.student_name || 'S').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs text-slate-900 truncate">
                                        {sub.student_name || 'Anonymous Student'}
                                      </div>
                                      <div className="text-[11px] text-slate-500 font-mono">
                                        {sub.student_phone || sub.student_email || ''}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 truncate max-w-[150px] inline-block">
                                    {sub.course_name || 'Course'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-bold text-slate-900 truncate max-w-[180px]">
                                  {sub.lesson_title || 'Quiz'}
                                </td>
                                <td className="py-3.5 px-4 text-center font-black text-slate-900">
                                  <span className="text-amber-600">{sub.score}</span> <span className="text-slate-400 font-normal">/ {sub.total_marks}</span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isExcellent
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isPass
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    {pct}%
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-600">
                                  {formatMinimalTime(sub.time_taken_seconds)}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  {isOfficial ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-[#5d5bf6] border border-indigo-200">
                                      Official 1st
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                      Retake #{sub.attempt_number || 2}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                                  {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setInspectingSubmission(sub)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-[#5d5bf6] hover:bg-indigo-50 transition-colors border-none bg-transparent cursor-pointer"
                                      title="View Student Answer Sheet"
                                    >
                                      <Eye className="w-4 h-4 text-[#5d5bf6]" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSubmission(sub.id)}
                                      disabled={deletingSubmissionId === sub.id}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer disabled:opacity-40"
                                      title="Delete submission record"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 7. ANSWER SHEET INSPECTION MODAL (খাতা পরিদর্শক মোডাল - CLEAN LIGHT THEME) */}
              {inspectingSubmission && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
                  <div className="relative w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl p-6 text-slate-900 overflow-y-auto shadow-2xl space-y-5">
                    {/* Modal Header */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-[#5d5bf6] border border-indigo-200">
                            পরীক্ষার খাতা ও মূল্যায়ন
                          </span>
                          <span className="text-xs text-slate-400">
                            {inspectingSubmission.submitted_at ? new Date(inspectingSubmission.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mt-1">
                          {inspectingSubmission.lesson_title || inspectingSubmission.quiz_id || 'Class Exam'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          কোর্স: <span className="text-slate-800 font-bold">{inspectingSubmission.course_name || 'EduHunters Course'}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setInspectingSubmission(null)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors border-none cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Student Info Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#5d5bf6] text-white font-black text-lg flex items-center justify-center shrink-0">
                          {(inspectingSubmission.student_name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {inspectingSubmission.student_name || 'Anonymous Student'}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono">
                            {inspectingSubmission.student_phone || 'No phone'} · {inspectingSubmission.student_email || ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold">প্রাপ্ত নম্বর</span>
                          <span className="text-xl font-black text-amber-600">
                            {inspectingSubmission.score} <span className="text-xs text-slate-400 font-normal">/ {inspectingSubmission.total_marks}</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold">অ্যাকুরেসি</span>
                          <span className="text-xl font-black text-emerald-600">
                            {inspectingSubmission.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown (Correct, Wrong, Skipped) */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <span className="text-[10px] text-emerald-700 font-bold block uppercase">সঠিক উত্তর</span>
                        <span className="text-lg font-black text-emerald-600">
                          {inspectingSubmission.correct_count ?? '--'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                        <span className="text-[10px] text-rose-700 font-bold block uppercase">ভুল উত্তর</span>
                        <span className="text-lg font-black text-rose-600">
                          {inspectingSubmission.wrong_count ?? '--'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">গৃহীত সময়</span>
                        <span className="text-lg font-black text-slate-800 font-mono">
                          {formatMinimalTime(inspectingSubmission.time_taken_seconds)}
                        </span>
                      </div>
                    </div>

                    {/* Question by Question Detailed Paper (if raw answers are present) */}
                    {Array.isArray(inspectingSubmission.raw_answers) && inspectingSubmission.raw_answers.length > 0 ? (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          প্রশ্নভিত্তিক উত্তরপত্র (Question Analysis):
                        </h4>
                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                          {inspectingSubmission.raw_answers.map((ans, qIdx) => {
                            const isCorrect = ans.isCorrect || ans.selected === ans.correct;
                            const isSkipped = ans.selected === undefined || ans.selected === null || ans.selected === '';

                            return (
                              <div 
                                key={qIdx}
                                className={`p-3.5 rounded-xl border ${
                                  isCorrect 
                                    ? 'bg-emerald-50/60 border-emerald-200' 
                                    : isSkipped 
                                    ? 'bg-slate-50 border-slate-200' 
                                    : 'bg-rose-50/60 border-rose-200'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-900">
                                    Q{qIdx + 1}. {ans.question || `Question #${qIdx + 1}`}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isCorrect 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : isSkipped 
                                      ? 'bg-slate-200 text-slate-700' 
                                      : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {isCorrect ? '+১ সঠিক' : isSkipped ? 'স্কিপড' : 'ভুল'}
                                  </span>
                                </div>
                                <div className="mt-2 text-[11px] text-slate-700 space-y-0.5 font-medium">
                                  <div>শিক্ষার্থীর উত্তর: <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{String(ans.selectedText || ans.selected || 'স্কিপ করা হয়েছে')}</span></div>
                                  {!isCorrect && ans.correct && (
                                    <div className="text-emerald-700">সঠিক উত্তর ছিল: <span className="font-bold">{String(ans.correctText || ans.correct)}</span></div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                        শিক্ষার্থীর সার্বিক স্কোর ডাটাবেজে সংরক্ষিত রয়েছে। প্রশ্নের বিস্তারিত উত্তরপত্র শিক্ষার্থী পোর্টাল থেকেও দেখতে পাবেন।
                      </div>
                    )}

                    {/* Bottom Modal Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleDeleteSubmission(inspectingSubmission.id)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>এই পরীক্ষার খাতা ডিলিট করুন</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInspectingSubmission(null)}
                        className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                      >
                        বন্ধ করুন (Close)
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
          {/* ========================================================= */}
          {/* TAB 5: COURSES & BUNDLES (CLEAN, MINIMAL & USER-FRIENDLY) */}
          {/* ========================================================= */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              
              {/* Clean Minimal Action & Filter Toolbar */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
                {/* Row 1: Search, View Mode & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search courses by title, category, ID..."
                      value={courseSearchQuery}
                      onChange={(e) => setCourseSearchQuery(e.target.value)}
                      className="w-full bg-[#f4f6fa] border border-slate-200/80 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] focus:ring-2 focus:ring-[#5d5bf6]/15 transition-all font-medium placeholder:text-slate-400"
                    />
                    {courseSearchQuery && (
                      <button 
                        onClick={() => setCourseSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-transparent border-none cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Grid / Table Mode Switcher */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setCourseViewMode('grid')}
                        title="Grid View"
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1 ${
                          courseViewMode === 'grid'
                            ? 'bg-white text-[#5d5bf6] shadow-xs'
                            : 'bg-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseViewMode('table')}
                        title="Table View"
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1 ${
                          courseViewMode === 'table'
                            ? 'bg-white text-[#5d5bf6] shadow-xs'
                            : 'bg-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Manage Categories Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => setShowManageCategoriesModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer transition-all"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Categories</span>
                    </button>

                    {/* Add New Course Button */}
                    <button
                      type="button"
                      onClick={() => setShowAddCourseModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Course</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Minimal Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-100 text-xs">
                  {categories.map((cat, cIdx) => {
                    const displayLabel = isAllCat(cat) ? 'All' : cat;
                    const count = courses.filter(c => courseMatchesCategory(c, cat)).length;
                    const isFilterActive = isAllCat(adminCourseCategoryFilter) ? isAllCat(cat) : adminCourseCategoryFilter === cat;

                    return (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setAdminCourseCategoryFilter(isAllCat(cat) ? 'All' : cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none flex items-center gap-1.5 shrink-0 ${
                          isFilterActive
                            ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-xs shadow-[#5d5bf6]/20'
                            : 'bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span>{displayLabel}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                          isFilterActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowManageCategoriesModal(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#5d5bf6] bg-[#5d5bf6]/10 hover:bg-[#5d5bf6]/20 border border-[#5d5bf6]/20 cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Category</span>
                  </button>
                </div>
              </div>

              {/* Course Directory View */}
              {filteredCourses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-xs">
                  <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">No courses found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {courseSearchQuery ? `No courses matching "${courseSearchQuery}"` : 'No courses in this category yet.'}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {courseSearchQuery && (
                      <button
                        onClick={() => setCourseSearchQuery('')}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer border-none"
                      >
                        Reset Search
                      </button>
                    )}
                    <button
                      onClick={() => setShowAddCourseModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-xs font-bold text-white cursor-pointer border-none"
                    >
                      + Create First Course
                    </button>
                  </div>
                </div>
              ) : courseViewMode === 'grid' ? (
                /* GRID VIEW: CLEAN, MINIMAL CARDS */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCourses.map(({ course, originalIdx: idx }) => (
                    <div 
                      key={course.id || idx} 
                      className={`bg-white rounded-2xl border ${
                        course.isActive === false ? 'border-dashed border-slate-300 opacity-90' : 'border-slate-100'
                      } shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group`}
                    >
                      <div>
                        {/* Cover Image Thumbnail with Clean Overlays */}
                        <div className="relative aspect-video bg-slate-100 overflow-hidden group/cover">
                          <img 
                            src={course.image} 
                            alt={course.title} 
                            className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
                          />
                          
                          {/* Top Badges */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            {course.isActive === false && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-900/85 text-amber-300 border border-amber-400/30 backdrop-blur-md shadow-xs">
                                Inactive
                              </span>
                            )}
                            {course.isBundle && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500 text-white shadow-xs">
                                Bundle
                              </span>
                            )}
                            {course.category && course.category.toLowerCase() !== 'free' && (
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white shadow-2xs">
                                {course.category}
                              </span>
                            )}
                          </div>

                          <div className="absolute top-2.5 right-2.5">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold shadow-2xs ${
                              Number(course.salePrice) === 0 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-white text-slate-900 font-black'
                            }`}>
                              {Number(course.salePrice) === 0 ? 'Free' : `৳${Number(course.salePrice).toLocaleString()}`}
                            </span>
                          </div>

                          {/* Change Cover Hover Overlay */}
                          <div 
                            onClick={() => openGalleryModal(course.image, `Choose Cover for ${course.title}`, 'Courses', (newUrl) => {
                              const updated = courses.map((c, i) => i === idx ? { ...c, image: newUrl } : c);
                              setCourses(updated);
                              persistAll({ courses: updated });
                            })}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer text-white text-xs font-bold"
                          >
                            <Camera className="w-4 h-4 text-white" />
                            <span>Change Cover</span>
                          </div>
                        </div>

                        {/* Course Info */}
                        <div className="p-4 space-y-2.5">
                          <h3 
                            onClick={() => openCurriculumStudio(idx, "basic")}
                            className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2 min-h-[2.5rem] hover:text-[#5d5bf6] cursor-pointer transition-colors"
                          >
                            {course.title}
                          </h3>

                          {/* Minimal Meta Row */}
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            {(() => {
                              const lesCount = (course.curriculum || []).reduce((acc, s) => acc + (s.chapters || []).reduce((cAcc, c) => cAcc + (c.lessons || []).length, 0), 0);
                              return (
                                <>
                                  <span className="flex items-center gap-1 text-slate-700 font-bold">
                                    <Play className="w-3.5 h-3.5 text-[#5d5bf6]" />
                                    {lesCount} Classes
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                                    {(course.curriculum || []).length} Modules
                                  </span>
                                  <span>•</span>
                                  <span className="font-mono text-[10px] text-slate-400">ID #{idx + 1}</span>
                                </>
                              );
                            })()}
                          </div>

                          {/* Pricing & Fixed Minimal Toggle Switch Row */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                            <div>
                              {Number(course.salePrice) === 0 ? (
                                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  Free Access
                                </span>
                              ) : (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-sm font-black text-slate-900">৳{Number(course.salePrice).toLocaleString()}</span>
                                  {course.regularPrice && course.regularPrice > course.salePrice && (
                                    <span className="text-[11px] text-slate-400 line-through">৳{Number(course.regularPrice).toLocaleString()}</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Pixel-Perfect Fixed iOS-Style Toggle Switch */}
                            <button
                              type="button"
                              role="switch"
                              aria-checked={course.isActive !== false}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCourseActive(course, idx);
                              }}
                              className="inline-flex items-center gap-2 cursor-pointer border-none bg-transparent p-0 select-none group/switch focus:outline-none"
                              title={course.isActive !== false ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
                            >
                              <span className={`text-[11px] font-bold transition-colors ${
                                course.isActive !== false ? 'text-emerald-600' : 'text-slate-400'
                              }`}>
                                {course.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                              <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                                course.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}>
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                                    course.isActive !== false ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Clean Single-Row Action Footer */}
                      <div className="p-4 pt-0">
                        <div className="flex items-center gap-2">
                          {/* Primary Action: Curriculum / Quizzes */}
                          {(() => {
                            const lesCount = (course.curriculum || []).reduce((acc, s) => acc + (s.chapters || []).reduce((cAcc, c) => cAcc + (c.lessons || []).length, 0), 0);
                            return (
                              <button
                                type="button"
                                onClick={() => openCurriculumStudio(idx, 'curriculum')}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer border-none"
                                title={(course.isExamBatch || course.category === 'EXAM BATCH') ? "Quizzes & Questions Studio" : "Manage Classes, Video URLs, PDFs & Quizzes"}
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>{(course.isExamBatch || course.category === 'EXAM BATCH') ? 'Quizzes & Exams' : `Classes & Lectures (${lesCount})`}</span>
                              </button>
                            );
                          })()}

                          {/* Secondary Action: Edit Details */}
                          <button
                            type="button"
                            onClick={() => openCurriculumStudio(idx, "basic")}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border-none"
                            title="Edit Course Metadata & Pricing"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>

                          {/* Quick Landing Page Overview */}
                          <button
                            type="button"
                            onClick={() => openCurriculumStudio(idx, "overview")}
                            className="p-2 rounded-xl text-slate-400 hover:text-[#5d5bf6] hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
                            title="Landing Page & Features Overview"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Delete Course */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete course "${course.title}"?`)) {
                                const updated = courses.filter((_, i) => i !== idx);
                                setCourses(updated);
                                persistAll({ courses: updated });
                                triggerToast('🗑️ Course deleted');
                              }
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-none bg-transparent"
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* TABLE VIEW: COMPACT SAAS LIST */
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Course Title & ID</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Curriculum Structure</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {filteredCourses.map(({ course, originalIdx: idx }) => (
                          <tr key={course.id || idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img 
                                  src={course.image} 
                                  alt={course.title} 
                                  className="w-12 h-8 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                                />
                                <div>
                                  <div className="font-extrabold text-slate-900 leading-tight hover:text-[#5d5bf6] cursor-pointer" onClick={() => openCurriculumStudio(idx, "basic")}>
                                    {course.title}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    ID: #{idx + 1} • {course.isBundle ? 'Bundle' : 'Single Course'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {course.category || 'General'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800 flex items-center gap-2">
                                <span className="text-[#5d5bf6]">{(course.curriculum || []).length} Modules</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500">{course.features?.length || 0} Features</span>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {Number(course.salePrice) === 0 ? (
                                <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  Free
                                </span>
                              ) : (
                                <div className="font-extrabold text-slate-900">
                                  ৳{Number(course.salePrice).toLocaleString()}
                                </div>
                              )}
                            </td>

                            {/* Status Column with Active/Inactive Toggle */}
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={course.isActive !== false}
                                onClick={() => {
                                  handleToggleCourseActive(course, idx);
                                }}
                                className="inline-flex items-center gap-2 cursor-pointer border-none bg-transparent p-0 select-none group/switch focus:outline-none"
                                title={course.isActive !== false ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
                              >
                                <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                                  course.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}>
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                                      course.isActive !== false ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </span>
                                <span className={`text-[11px] font-bold ${course.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {course.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                              </button>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {(() => {
                                  const lesCount = (course.curriculum || []).reduce((acc, s) => acc + (s.chapters || []).reduce((cAcc, c) => cAcc + (c.lessons || []).length, 0), 0);
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => openCurriculumStudio(idx, 'curriculum')}
                                      title={(course.isExamBatch || course.category === 'EXAM BATCH') ? "Quizzes & Questions Studio" : "Manage Classes, Video URLs, PDFs & Quizzes"}
                                      className="px-2.5 py-1.5 rounded-lg bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold transition-all cursor-pointer border-none shadow-2xs flex items-center gap-1.5"
                                    >
                                      <Play className="w-3 h-3" />
                                      <span>{(course.isExamBatch || course.category === 'EXAM BATCH') ? 'Quizzes & Questions' : `Classes & Lectures (${lesCount})`}</span>
                                    </button>
                                  );
                                })()}
                                <button
                                  type="button"
                                  onClick={() => openCurriculumStudio(idx, "basic")}
                                  title="Edit Details"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Delete course "${course.title}"?`)) {
                                      const updated = courses.filter((_, i) => i !== idx);
                                      setCourses(updated);
                                      persistAll({ courses: updated });
                                      triggerToast('🗑️ Course deleted');
                                    }
                                  }}
                                  title="Delete Course"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-none bg-transparent"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: BUNDLES (CLEAN, MINIMAL & PROFESSIONAL BUNDLE STUDIO) */}
          {/* ========================================================= */}
          {activeTab === 'bundles' && (() => {
            const activeBundlesCount = bundles.filter(b => b.status === 'ACTIVE').length;
            const draftBundlesCount = bundles.filter(b => b.status !== 'ACTIVE').length;
            
            // Calculate total courses packaged
            const uniquePackagedCourses = new Set();
            bundles.forEach(b => (b.courseIds || []).forEach(id => uniquePackagedCourses.add(id)));

            // Calculate average discount percentage
            let totalDiscountPct = 0;
            let countWithDiscount = 0;
            bundles.forEach(b => {
              const reg = Number(b.regularPrice) || 0;
              const sale = Number(b.salePrice) || 0;
              if (reg > sale && reg > 0) {
                totalDiscountPct += Math.round(((reg - sale) / reg) * 100);
                countWithDiscount++;
              }
            });
            const avgDiscount = countWithDiscount > 0 ? Math.round(totalDiscountPct / countWithDiscount) : 40;

            const filteredBundles = bundles.filter(b => {
              if (bundleStatusFilter !== 'ALL' && (b.status || 'ACTIVE') !== bundleStatusFilter) return false;
              if (!bundleSearchQuery.trim()) return true;
              const q = bundleSearchQuery.toLowerCase().trim();
              const titleMatch = (b.title || '').toLowerCase().includes(q);
              const subMatch = (b.subtitle || '').toLowerCase().includes(q);
              const badgeMatch = (b.badge || '').toLowerCase().includes(q);
              const descMatch = (b.description || '').toLowerCase().includes(q);
              const coursesMatch = (b.courseIds || []).some(cId => {
                const found = courses.find(c => c.id === cId || c.slug === cId || c.key === cId);
                return found && (found.title || '').toLowerCase().includes(q);
              });
              return titleMatch || subMatch || badgeMatch || descMatch || coursesMatch;
            });

            return (
              <div className="space-y-6">
                {/* 4 Summary Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Bundles</p>
                      <h3 className="text-2xl font-black text-slate-900 mt-1">{bundles.length}</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Combo packages</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-[#5d5bf6]/10 flex items-center justify-center text-[#5d5bf6]">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Active</p>
                      <h3 className="text-2xl font-black text-emerald-600 mt-1">{activeBundlesCount}</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Visible on site</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Discount</p>
                      <h3 className="text-2xl font-black text-rose-600 mt-1">~{avgDiscount}%</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Combo savings</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Courses Included</p>
                      <h3 className="text-2xl font-black text-indigo-600 mt-1">{uniquePackagedCourses.size}</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Distinct courses</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Toolbar: Search, Filters & Actions */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="Search bundles by title, course, or discount..."
                        value={bundleSearchQuery}
                        onChange={(e) => setBundleSearchQuery(e.target.value)}
                        className="w-full bg-[#f4f6fa] border border-slate-200/80 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] focus:ring-2 focus:ring-[#5d5bf6]/15 transition-all font-medium placeholder:text-slate-400"
                      />
                      {bundleSearchQuery && (
                        <button 
                          onClick={() => setBundleSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-transparent border-none cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Right Toolbar Actions */}
                    <div className="flex items-center gap-2">
                      {/* Grid / Table Mode Switcher */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => setBundleViewMode('grid')}
                          title="Grid View"
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1 ${
                            bundleViewMode === 'grid'
                              ? 'bg-white text-[#5d5bf6] shadow-xs'
                              : 'bg-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBundleViewMode('table')}
                          title="Table View"
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1 ${
                            bundleViewMode === 'table'
                              ? 'bg-white text-[#5d5bf6] shadow-xs'
                              : 'bg-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Add New Bundle Button */}
                      <button
                        type="button"
                        onClick={handleOpenAddBundle}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Create Bundle</span>
                      </button>
                    </div>
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                    {[
                      { key: 'ALL', label: `All Bundles (${bundles.length})` },
                      { key: 'ACTIVE', label: `Active (${activeBundlesCount})` },
                      { key: 'DRAFT', label: `Draft (${draftBundlesCount})` }
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setBundleStatusFilter(f.key)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                          bundleStatusFilter === f.key
                            ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content: Grid or Table View */}
                {filteredBundles.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-[#5d5bf6] flex items-center justify-center">
                      <Layers className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">No Bundles Found</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {bundleSearchQuery ? 'No bundles matched your search term.' : 'Create your first course combo bundle to offer discounted packages to students!'}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddBundle}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none transition-all mt-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create First Bundle</span>
                    </button>
                  </div>
                ) : bundleViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredBundles.map(bundle => {
                      const regPrice = Number(bundle.regularPrice) || 0;
                      const salePrice = Number(bundle.salePrice) || 0;
                      const savings = Math.max(0, regPrice - salePrice);
                      const discountPct = regPrice > 0 ? Math.round((savings / regPrice) * 100) : 0;
                      const isActive = (bundle.status || 'ACTIVE') === 'ACTIVE';

                      // Resolve included courses
                      const includedCourses = (bundle.courseIds || []).map(id => {
                        return courses.find(c => c.id === id || c.slug === id || c.key === id) || {
                          id,
                          title: id,
                          salePrice: 0,
                          image: '/master_english_30_days.png'
                        };
                      });

                      return (
                        <div 
                          key={bundle.id}
                          className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all overflow-hidden flex flex-col group"
                        >
                          {/* Top Cover Banner */}
                          <div className="relative aspect-video bg-slate-100 overflow-hidden">
                            <img 
                              src={bundle.image || 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp'} 
                              alt={bundle.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

                            {/* Top Badges */}
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                                isActive 
                                  ? 'bg-emerald-500/90 text-white' 
                                  : 'bg-slate-700/90 text-slate-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                                {isActive ? 'Active' : 'Draft'}
                              </span>

                              {bundle.badge && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#5d5bf6]/90 text-white backdrop-blur-md shadow-xs">
                                  {bundle.badge}
                                </span>
                              )}
                            </div>

                            {/* Top Right Savings Pill */}
                            {discountPct > 0 && (
                              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wide shadow-sm">
                                {discountPct}% OFF
                              </div>
                            )}

                            {/* Bottom Count Pill on Banner */}
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                              <span className="font-bold flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
                                <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
                                {includedCourses.length} Courses Combo Pack
                              </span>
                            </div>
                          </div>

                          {/* Body Content */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#5d5bf6] transition-colors line-clamp-1">
                                {bundle.title}
                              </h3>
                              {bundle.subtitle && (
                                <p className="text-xs font-medium text-slate-500 line-clamp-1 mt-0.5">
                                  {bundle.subtitle}
                                </p>
                              )}
                            </div>

                            {/* Price Breakdown Footer */}
                            <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Combo Price</p>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                  <span className="text-xl font-black text-[#5d5bf6]">৳{salePrice}</span>
                                  {regPrice > salePrice && (
                                    <span className="text-xs text-slate-400 line-through font-semibold">৳{regPrice}</span>
                                  )}
                                </div>
                                {savings > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-600">Save ৳{savings}</span>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBundleStatus(bundle.id)}
                                  title={isActive ? 'Deactivate (Draft)' : 'Activate (Publish)'}
                                  className={`p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                    isActive 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  {isActive ? 'Live' : 'Draft'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateBundle(bundle)}
                                  title="Duplicate Bundle"
                                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/80 transition-all cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditBundle(bundle)}
                                  title="Edit Bundle"
                                  className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#5d5bf6] border border-indigo-100 transition-all cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBundle(bundle.id, bundle.title)}
                                  title="Delete Bundle"
                                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Table View */
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
                          <tr>
                            <th className="py-3.5 px-4">Bundle Pack</th>
                            <th className="py-3.5 px-4">Included Courses</th>
                            <th className="py-3.5 px-4">Regular Price</th>
                            <th className="py-3.5 px-4">Combo Price</th>
                            <th className="py-3.5 px-4">Discount</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredBundles.map(bundle => {
                            const reg = Number(bundle.regularPrice) || 0;
                            const sale = Number(bundle.salePrice) || 0;
                            const savings = Math.max(0, reg - sale);
                            const discountPct = reg > 0 ? Math.round((savings / reg) * 100) : 0;
                            const isActive = (bundle.status || 'ACTIVE') === 'ACTIVE';

                            return (
                              <tr key={bundle.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={bundle.image || 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp'} 
                                      alt={bundle.title} 
                                      className="w-12 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                                    />
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 text-xs truncate max-w-xs">{bundle.title}</p>
                                      <p className="text-[10px] text-slate-400 truncate max-w-xs">{bundle.subtitle}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-[#5d5bf6] font-bold text-[11px]">
                                    <BookOpen className="w-3 h-3" />
                                    {bundle.courseIds?.length || 0} Courses
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-400 line-through">
                                  ৳{reg}
                                </td>
                                <td className="py-3 px-4 font-black text-slate-900 text-sm">
                                  ৳{sale}
                                </td>
                                <td className="py-3 px-4">
                                  {discountPct > 0 ? (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px]">
                                      {discountPct}% OFF
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">Standard</span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBundleStatus(bundle.id)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border ${
                                      isActive 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                    }`}
                                  >
                                    {isActive ? '● Active' : '○ Draft'}
                                  </button>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditBundle(bundle)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#5d5bf6] hover:bg-indigo-50 transition-colors cursor-pointer border-none bg-transparent"
                                      title="Edit Bundle"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateBundle(bundle)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
                                      title="Duplicate Bundle"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBundle(bundle.id, bundle.title)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-none bg-transparent"
                                      title="Delete Bundle"
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
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================= */}
          {/* TAB 6: INSTRUCTORS & FACULTY */}
          {/* ========================================================= */}
          {activeTab === 'instructors' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                    Instructors & Faculty Directory ({instructors.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage instructor profiles, designations, photos, and academic qualifications.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {instructors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete all ${instructors.length} instructors? This action will immediately clear the faculty list.`)) {
                          setInstructors([]);
                          persistAll({ instructors: [] });
                          triggerToast('All instructors removed!');
                        }
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition-all cursor-pointer"
                      title="Clear all instructors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove All
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddTeacherModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-md shadow-purple-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Instructor
                  </button>
                </div>
              </div>

              {/* Instructors Directory */}
              {instructors.length === 0 ? (
                <div className="py-16 px-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/60 max-w-xl mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">কোনো ইন্সট্রাক্টর প্রোফাইল নেই</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    বর্তমানে কোনো ইন্সট্রাক্টর তালিকাভুক্ত নেই। আপনার প্ল্যাটফর্মের নতুন শিক্ষক বা মেন্টর যুক্ত করতে নিচের বাটনে ক্লিক করুন।
                  </p>
                  <button
                    onClick={() => setShowAddTeacherModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Instructor
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {instructors.map((inst, idx) => (
                  <div 
                    key={inst.id || idx} 
                    className="bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md overflow-hidden group"
                  >
                    <div className="p-5 space-y-3.5">
                      {/* Top Badges & Actions */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-purple-50 text-purple-700 border border-purple-200/60">
                          {inst.badge || 'FACULTY'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openGalleryModal(inst.image, `Choose Photo for ${inst.name}`, 'Faculty', (newUrl) => {
                              const updated = instructors.map((item, i) => i === idx ? { ...item, image: newUrl } : item);
                              setInstructors(updated);
                              persistAll({ instructors: updated });
                            })}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200/60 cursor-pointer transition-all"
                            title="Choose or upload photo"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                            <span>Gallery</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove "${inst.name}" from faculty?`)) {
                                const updated = instructors.filter((_, i) => i !== idx);
                                setInstructors(updated);
                                persistAll({ instructors: updated });
                                triggerToast('Instructor removed!');
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer"
                            title="Delete Instructor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Photo Avatar & Name / Role */}
                      <div className="flex gap-3.5 items-start">
                        {/* Interactive Avatar with direct drag-and-drop & device upload */}
                        <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: '92px' }}>
                          <div 
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = e.dataTransfer.files?.[0];
                              if (file) {
                                handleDeviceFileUpload(file, (newUrl) => {
                                  const updated = instructors.map((item, i) => i === idx ? { ...item, image: newUrl } : item);
                                  setInstructors(updated);
                                  persistAll({ instructors: updated });
                                });
                              }
                            }}
                            style={{ width: '92px', height: '118px', minWidth: '92px', minHeight: '118px' }}
                            className="relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-purple-400 bg-slate-100 shadow-2xs group/avatar cursor-pointer transition-all"
                            title="Drag & drop image or click Change to upload from device"
                          >
                            <img 
                              src={inst.image} 
                              alt={inst.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                              className="group-hover/avatar:scale-105 transition-transform duration-200" 
                              onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                            />
                            
                            {/* Overlay file picker */}
                            <label className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 text-white cursor-pointer">
                              <Camera className="w-4 h-4 text-purple-200" />
                              <span className="text-[9px] font-bold">Change</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onClick={(e) => { e.target.value = ''; }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleDeviceFileUpload(file, (newUrl) => {
                                      const updated = instructors.map((item, i) => i === idx ? { ...item, image: newUrl } : item);
                                      setInstructors(updated);
                                      persistAll({ instructors: updated });
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {/* Quick Photo Actions under Avatar */}
                          <div className="flex items-center gap-1 w-full justify-center">
                            <label className="px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200 cursor-pointer flex items-center gap-1 transition-all" title="Upload from Device">
                              <Upload className="w-2.5 h-2.5" />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onClick={(e) => { e.target.value = ''; }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleDeviceFileUpload(file, (newUrl) => {
                                      const updated = instructors.map((item, i) => i === idx ? { ...item, image: newUrl } : item);
                                      setInstructors(updated);
                                      persistAll({ instructors: updated });
                                    });
                                  }
                                }}
                              />
                            </label>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const url = prompt('Enter Image URL for ' + inst.name, inst.image);
                                if (url !== null && url.trim()) {
                                  const updated = instructors.map((item, i) => i === idx ? { ...item, image: url.trim() } : item);
                                  setInstructors(updated);
                                  persistAll({ instructors: updated });
                                  triggerToast('✅ Photo URL updated!');
                                }
                              }}
                              className="px-1.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold border border-slate-200 cursor-pointer"
                              title="Paste direct Image URL"
                            >
                              URL
                            </button>
                          </div>
                        </div>

                        {/* Name & Designation Inputs */}
                        <div className="flex-1 space-y-2">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Full Name</label>
                            <input
                              type="text"
                              value={inst.name}
                              placeholder="Instructor Name"
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = instructors.map((item, i) => i === idx ? { ...item, name: val, badge: val.split(' ')[0] } : item);
                                setInstructors(updated);
                                persistAll({ instructors: updated });
                              }}
                              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Designation</label>
                            <input
                              type="text"
                              value={inst.designation}
                              placeholder="e.g. FOUNDER & MENTOR"
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = instructors.map((item, i) => i === idx ? { ...item, designation: val } : item);
                                setInstructors(updated);
                                persistAll({ instructors: updated });
                              }}
                              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-amber-700 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bio & Academic Background */}
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Academic Bio & College</label>
                        <textarea
                          rows={3}
                          value={inst.bio}
                          placeholder="e.g. Dhaka Medical College (MBBS)"
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = instructors.map((item, i) => i === idx ? { ...item, bio: val } : item);
                            setInstructors(updated);
                            persistAll({ instructors: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 rounded-xl p-2.5 text-xs text-slate-700 outline-none resize-none leading-relaxed transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Card Footer Bar */}
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Faculty ID: #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => openGalleryModal(inst.image, `Choose Photo for ${inst.name}`, 'Faculty', (newUrl) => {
                          const updated = instructors.map((item, i) => i === idx ? { ...item, image: newUrl } : item);
                          setInstructors(updated);
                          persistAll({ instructors: updated });
                        })}
                        className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Change Photo</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

          {/* ========================================================= */}
          {/* TAB 7: FREE YOUTUBE VIDEOS */}
          {/* ========================================================= */}
          {activeTab === 'videos' && (() => {
            const filteredVideos = freeVideos.filter(v => {
              if (!videoSearchQuery.trim()) return true;
              const q = videoSearchQuery.toLowerCase().trim();
              return (v.title || '').toLowerCase().includes(q) || (v.videoId || '').toLowerCase().includes(q);
            });

            return (
              <div className="space-y-6">
                {/* Header & Control Banner */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
                        <Video className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            Free YouTube Video Classes
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                            {freeVideos.length} {freeVideos.length === 1 ? 'Class' : 'Classes'}
                          </span>
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Sync Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          Manage featured YouTube classes, open lectures, and revision playlists displayed on the student homepage.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setNewVideo({ title: '', videoId: '', desc: '' });
                          setShowAddVideoModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 hover:shadow-lg transition-all cursor-pointer border-none"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Video</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Toolbar */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={videoSearchQuery}
                        onChange={(e) => setVideoSearchQuery(e.target.value)}
                        placeholder="Search video by title or YouTube ID..."
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-rose-500 transition-all font-medium"
                      />
                      {videoSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setVideoSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span className="hidden sm:inline">Showing:</span>
                      <span className="font-bold text-slate-800">{filteredVideos.length} of {freeVideos.length} videos</span>
                    </div>
                  </div>
                </div>

                {/* Empty State */}
                {filteredVideos.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                      <Video className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800">
                        {videoSearchQuery ? 'No matching video classes found' : 'No video classes in library'}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        {videoSearchQuery ? 'Try searching with a different keyword or clear the search filter.' : 'Click the button below to add your first YouTube video lecture.'}
                      </p>
                    </div>
                    {videoSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => setVideoSearchQuery('')}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer"
                      >
                        Clear Filter
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setNewVideo({ title: '', videoId: '', desc: '' });
                          setShowAddVideoModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-rose-600/20"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Video</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Video Cards Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredVideos.map((vid, idx) => {
                      const actualIdx = freeVideos.findIndex(v => (v.id && vid.id) ? v.id === vid.id : v.videoId === vid.videoId);
                      const cleanId = extractCleanYouTubeId(vid.videoId) || vid.videoId;
                      const isFirst = actualIdx === 0;
                      const isLast = actualIdx === freeVideos.length - 1;

                      return (
                        <div
                          key={vid.id || idx}
                          className="bg-white rounded-3xl border border-slate-200/90 hover:border-rose-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                        >
                          {/* Card Top Action Bar */}
                          <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-black flex items-center justify-center shadow-2xs shrink-0">
                                #{String(actualIdx + 1).padStart(2, '0')}
                              </span>
                              <span className="text-xs font-bold text-slate-700 truncate" title={vid.title}>
                                {vid.title || 'Untitled Lecture'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Move Up */}
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMoveVideo(actualIdx, 'up')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer border-none bg-transparent transition-colors"
                                title="Move Earlier in List"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>

                              {/* Move Down */}
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveVideo(actualIdx, 'down')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer border-none bg-transparent transition-colors"
                                title="Move Later in List"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Open on YouTube */}
                              <a
                                href={`https://www.youtube.com/watch?v=${cleanId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer transition-colors inline-flex items-center"
                                title="Open on YouTube (New Tab)"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${vid.title || 'this video'}"?`)) {
                                    const updated = freeVideos.filter((_, i) => i !== actualIdx);
                                    setFreeVideos(updated);
                                    persistAll({ freeVideos: updated });
                                    triggerToast('🗑️ Video removed from library.');
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer border-none bg-transparent transition-colors"
                                title="Delete Video"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-5 space-y-4 flex-1">
                            {/* High-Resolution Thumbnail with Hover Play Button & Modal Trigger */}
                            <div 
                              onClick={() => setPreviewVideoModal({ title: vid.title, videoId: cleanId })}
                              className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 ring-1 ring-slate-200/80 cursor-pointer group/thumb shadow-inner"
                              title="Click to preview video player"
                            >
                              <img
                                src={`https://img.youtube.com/vi/${cleanId}/mqdefault.jpg`}
                                alt={vid.title}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
                                }}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500 opacity-95 group-hover/thumb:opacity-100"
                              />
                              
                              {/* Dark gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 group-hover/thumb:from-black/70 transition-colors" />

                              {/* Center Frosted Play Button */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-13 h-13 rounded-full bg-rose-600/90 group-hover/thumb:bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-900/40 backdrop-blur-xs group-hover/thumb:scale-110 transition-all duration-300">
                                  <Play className="w-6 h-6 fill-white ml-0.5" />
                                </div>
                              </div>

                              {/* Top badges */}
                              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/20">
                                  YouTube
                                </span>
                              </div>

                              {/* Bottom overlay strip: ID chip + Click hint */}
                              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] font-semibold">
                                <span className="font-mono bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-slate-200">
                                  ID: {cleanId}
                                </span>
                                <span className="flex items-center gap-1 bg-rose-600/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs">
                                  <Eye className="w-3 h-3" />
                                  Instant Preview
                                </span>
                              </div>
                            </div>

                            {/* Form Fields: Title & ID with smart paste auto-extraction */}
                            <div className="space-y-3 pt-1">
                              {/* Video Title Input */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                  <span>Video Title</span>
                                  <span className="text-[10px] text-slate-400 font-normal">Shown on student homepage</span>
                                </label>
                                <input
                                  type="text"
                                  value={vid.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = freeVideos.map((v, i) => i === actualIdx ? { ...v, title: val } : v);
                                    setFreeVideos(updated);
                                    persistAll({ freeVideos: updated });
                                  }}
                                  placeholder="e.g. Admission Preparation Routine Hack"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all shadow-2xs"
                                />
                              </div>

                              {/* YouTube Video ID / Link Input */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                                  <span>YouTube Video ID or Link</span>
                                  <span className="text-[10px] text-slate-400 font-normal">Supports full links or 11-char ID</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={vid.videoId}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      const clean = extractCleanYouTubeId(raw) || raw.trim();
                                      const updated = freeVideos.map((v, i) => i === actualIdx ? { ...v, videoId: clean } : v);
                                      setFreeVideos(updated);
                                      persistAll({ freeVideos: updated });
                                    }}
                                    placeholder="e.g. rMGOI-A5czA or https://youtube.com/watch?v=..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-20 py-2.5 text-xs font-mono font-medium text-slate-800 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all shadow-2xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(cleanId);
                                      triggerToast('📋 Video ID copied to clipboard!');
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[10px] font-bold border-none cursor-pointer transition-colors"
                                    title="Copy ID to Clipboard"
                                  >
                                    Copy ID
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Bottom Strip */}
                          <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => setPreviewVideoModal({ title: vid.title, videoId: cleanId })}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer bg-transparent border-none p-0 transition-colors"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Watch Preview</span>
                            </button>

                            <a
                              href={`https://www.youtube.com/watch?v=${cleanId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                            >
                              <span>Open on YouTube</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================= */}
          {/* TAB 8: STORE */}
          {/* ========================================================= */}
          {activeTab === 'store' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-emerald-600" />
                    Book & PDF Store Directory ({storeProducts.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage store e-books, study guides, prices, and cover images.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddStoreModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-md shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Add New Book/PDF
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {storeProducts.map((prod, idx) => (
                  <div key={prod.id || idx} className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-3 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                        <img src={prod.cover} alt={prod.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 font-semibold block mb-1">Book Title</label>
                        <input
                          type="text"
                          value={prod.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = storeProducts.map((p, i) => i === idx ? { ...p, title: val } : p);
                            setStoreProducts(updated);
                            persistAll({ storeProducts: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-500 font-semibold block mb-1">Price (৳)</label>
                          <input
                            type="number"
                            value={prod.price}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              const updated = storeProducts.map((p, i) => i === idx ? { ...p, price: val } : p);
                              setStoreProducts(updated);
                              persistAll({ storeProducts: updated });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-600 outline-none focus:bg-white focus:border-emerald-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 font-semibold block mb-1">Category</label>
                          <input
                            type="text"
                            value={prod.category}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = storeProducts.map((p, i) => i === idx ? { ...p, category: val } : p);
                              setStoreProducts(updated);
                              persistAll({ storeProducts: updated });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => {
                          if (confirm(`Delete store product?`)) {
                            const updated = storeProducts.filter((_, i) => i !== idx);
                            setStoreProducts(updated);
                            persistAll({ storeProducts: updated });
                            triggerToast('Product deleted!');
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 9: SETTINGS */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Top Header with Live Save Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                    <span>Payment & Support Channels</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Directly manage bKash, Nagad, WhatsApp, support hotline, and email. Changes sync live instantly across the website without redeployment.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Sync Active
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      persistAll({ siteSettings, sectionTexts });
                      triggerToast('✅ All settings & payment accounts saved live!');
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-black border-none cursor-pointer shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save All Settings</span>
                  </button>
                </div>
              </div>

              {/* SECTION 1: PAYMENT ACCOUNTS (bKash & Nagad) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-xs border border-pink-100">
                        ৳
                      </span>
                      <span>Payment Accounts (Student Checkout)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Displayed on the checkout modal when students purchase courses or books, featuring instant 1-click copy.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* bKash Number */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50/40 via-white to-pink-50/20 border border-pink-100/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#d12053] text-white text-[10px] font-bold tracking-wide">
                          bKash
                        </span>
                        <span>bKash Personal Number</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(siteSettings.bkashNumber || '01342227935');
                          triggerToast('📋 bKash number copied to clipboard');
                        }}
                        className="text-[11px] text-pink-600 hover:text-pink-700 font-bold bg-transparent border-none cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="01342227935"
                        value={siteSettings.bkashNumber || ''}
                        onChange={(e) => handleUpdateSiteSetting('bkashNumber', e.target.value)}
                        className="w-full bg-white border border-pink-200/90 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10 transition-all shadow-2xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      💡 Displayed when students select bKash in the checkout modal.
                    </p>
                  </div>

                  {/* Nagad Number */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border border-amber-100/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#f7941d] text-white text-[10px] font-bold tracking-wide">
                          Nagad
                        </span>
                        <span>Nagad Personal Number</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(siteSettings.nagadNumber || '01731127231');
                          triggerToast('📋 Nagad number copied to clipboard');
                        }}
                        className="text-[11px] text-amber-600 hover:text-amber-700 font-bold bg-transparent border-none cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="01731127231"
                        value={siteSettings.nagadNumber || ''}
                        onChange={(e) => handleUpdateSiteSetting('nagadNumber', e.target.value)}
                        className="w-full bg-white border border-amber-200/90 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all shadow-2xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      💡 Displayed when students select Nagad in the checkout modal.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: CONTACT & SUPPORT CHANNELS (WhatsApp, Phone, Email) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                      </span>
                      <span>Communication & Support Channels</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Integrated across the homepage cards, course pages, navbar helpline, and website footer.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* WhatsApp Support Number */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 border border-emerald-100/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp Number</span>
                      </label>
                      <a
                        href={`https://wa.me/88${(siteSettings.whatsappNumber || '01342227935').replace(/[^0-9]/g, '').replace(/^88/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 no-underline"
                      >
                        <span>Test Chat</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="text"
                      placeholder="01342227935"
                      value={siteSettings.whatsappNumber || ''}
                      onChange={(e) => handleUpdateSiteSetting('whatsappNumber', e.target.value)}
                      className="w-full bg-white border border-emerald-200/90 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-2xs"
                    />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      💬 Connects to homepage WhatsApp support cards, course pages, and navbar drawer.
                    </p>
                  </div>

                  {/* Hotline Phone */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/40 via-white to-blue-50/20 border border-blue-100/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Support Hotline (Phone)</span>
                      </label>
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        Direct Call
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="01342227935"
                      value={siteSettings.contactPhone || ''}
                      onChange={(e) => handleUpdateSiteSetting('contactPhone', e.target.value)}
                      className="w-full bg-white border border-blue-200/90 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-2xs"
                    />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      📞 Official helpline phone number displayed for direct support calls.
                    </p>
                  </div>

                  {/* Official Email */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/40 via-white to-purple-50/20 border border-purple-100/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-purple-600" />
                        <span>Official Support Email</span>
                      </label>
                      <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                        Official Mail
                      </span>
                    </div>
                    <input
                      type="email"
                      placeholder="eduhuntersbd@gmail.com"
                      value={siteSettings.contactEmail || ''}
                      onChange={(e) => handleUpdateSiteSetting('contactEmail', e.target.value)}
                      className="w-full bg-white border border-purple-200/90 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all shadow-2xs"
                    />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      ✉️ Displayed in terms & policies, legal pages, and the website footer.
                    </p>
                  </div>
                </div>
              </div>

              {/* LIVE CREDENTIALS SUMMARY STRIP */}
              <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">Active Live Credentials (Real-Time Summary)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Currently visible to all live website visitors</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                    <span className="text-[10px] text-pink-400 font-bold block uppercase mb-1">bKash Account</span>
                    <span className="font-mono font-black text-white">{siteSettings.bkashNumber || '01342227935'}</span>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                    <span className="text-[10px] text-amber-400 font-bold block uppercase mb-1">Nagad Account</span>
                    <span className="font-mono font-black text-white">{siteSettings.nagadNumber || '01731127231'}</span>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                    <span className="text-[10px] text-emerald-400 font-bold block uppercase mb-1">WhatsApp</span>
                    <span className="font-mono font-black text-white">{siteSettings.whatsappNumber || '01342227935'}</span>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                    <span className="text-[10px] text-blue-400 font-bold block uppercase mb-1">Hotline Phone</span>
                    <span className="font-mono font-black text-white">{siteSettings.contactPhone || '01342227935'}</span>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-purple-400 font-bold block uppercase mb-1">Official Email</span>
                    <span className="font-medium text-slate-200 truncate block">{siteSettings.contactEmail || 'eduhuntersbd@gmail.com'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PLATFORM BRANDING & OTHER SETTINGS */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-slate-600" />
                    <span>Platform Branding & Settings</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Customize platform title, logo URL, and tagline slogan.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Platform Title</label>
                    <input
                      type="text"
                      value={siteSettings.siteName || ''}
                      onChange={(e) => handleUpdateSiteSetting('siteName', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Tagline / Slogan</label>
                    <input
                      type="text"
                      value={siteSettings.siteTagline || ''}
                      onChange={(e) => handleUpdateSiteSetting('siteTagline', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Logo URL / Path</label>
                  <div className="flex items-center gap-3">
                    <img src={siteSettings.logoUrl} alt="Logo" className="w-10 h-10 object-contain bg-slate-100 rounded-xl p-1 border border-slate-200" />
                    <input
                      type="text"
                      value={siteSettings.logoUrl || ''}
                      onChange={(e) => handleUpdateSiteSetting('logoUrl', e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: BUNNY.NET CLOUD INTEGRATION (Direct Video Transcoding & PDF CDN Delivery) */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm border border-orange-100">
                        🐰
                      </span>
                      <span>Bunny.net Cloud Stream & Storage Integration</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enables 1-click direct video upload with automatic transcoding, live preview, and fast global PDF lecture note distribution.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${
                      isBunnyStreamConfigured(bunnyConfig) && isBunnyStorageConfigured(bunnyConfig)
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        isBunnyStreamConfigured(bunnyConfig) && isBunnyStorageConfigured(bunnyConfig)
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-amber-500'
                      }`} />
                      {isBunnyStreamConfigured(bunnyConfig) && isBunnyStorageConfigured(bunnyConfig)
                        ? 'Bunny Fully Connected'
                        : 'Credentials Incomplete'}
                    </span>
                  </div>
                </div>

                {/* Sub-section A: Bunny Stream (Video Delivery) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/20 border border-purple-100/90 space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-100/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-bold tracking-wide">
                        STREAM
                      </span>
                      <h4 className="text-xs font-black text-slate-900">
                        Bunny Stream (Video Uploads & Player Iframe)
                      </h4>
                    </div>
                    <a
                      href="https://dash.bunny.net/stream"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 hover:underline"
                    >
                      <span>Bunny Stream Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Video Library ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 312456"
                        value={bunnyConfig.streamLibraryId || ''}
                        onChange={(e) => handleUpdateBunnyConfig('streamLibraryId', e.target.value.trim())}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-purple-600 transition-all shadow-2xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        From Bunny Stream → Manage Library → API → Library ID
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Stream API Key (AccessKey) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="e.g. 7f8a9b1c-..."
                        value={bunnyConfig.streamApiKey || ''}
                        onChange={(e) => handleUpdateBunnyConfig('streamApiKey', e.target.value.trim())}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-purple-600 transition-all shadow-2xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        From Bunny Stream → API → API Key
                      </span>
                    </div>
                  </div>

                  {/* Test Stream Button */}
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleTestBunnyStream}
                      disabled={bunnyTestResults.testingStream || !bunnyConfig.streamLibraryId || !bunnyConfig.streamApiKey}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 disabled:opacity-50 text-purple-800 text-xs font-bold border-none cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{bunnyTestResults.testingStream ? 'Testing Bunny Stream...' : 'Test Stream API Connection'}</span>
                    </button>

                    {bunnyTestResults.stream && (
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                        bunnyTestResults.stream.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {bunnyTestResults.stream.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-section B: Bunny Storage (PDF Delivery) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/40 via-white to-cyan-50/20 border border-blue-100/90 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold tracking-wide">
                        STORAGE CDN
                      </span>
                      <h4 className="text-xs font-black text-slate-900">
                        Bunny Storage Zone (Lecture Sheet PDFs & Files)
                      </h4>
                    </div>
                    <a
                      href="https://dash.bunny.net/storage"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                    >
                      <span>Bunny Storage Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Storage Zone Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. eduhunters-storage"
                        value={bunnyConfig.storageZoneName || ''}
                        onChange={(e) => handleUpdateBunnyConfig('storageZoneName', e.target.value.trim())}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600 transition-all shadow-2xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Storage Zone name created in Bunny.net
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Storage Access Key / Password <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        placeholder="e.g. 8a9b2c3d-..."
                        value={bunnyConfig.storagePassword || ''}
                        onChange={(e) => handleUpdateBunnyConfig('storagePassword', e.target.value.trim())}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600 transition-all shadow-2xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        From Storage Zone → FTP & API Access → Password
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Storage Hostname
                      </label>
                      <input
                        type="text"
                        placeholder="storage.bunnycdn.com"
                        value={bunnyConfig.storageHostname || 'storage.bunnycdn.com'}
                        onChange={(e) => handleUpdateBunnyConfig('storageHostname', e.target.value.trim())}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 outline-none focus:border-blue-600 transition-all shadow-2xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Default: storage.bunnycdn.com
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Connected Pull Zone (Public CDN Domain) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. eduhunters-cdn.b-cdn.net"
                        value={bunnyConfig.pullZoneHostname || ''}
                        onChange={(e) => handleUpdateBunnyConfig('pullZoneHostname', e.target.value.trim())}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600 transition-all shadow-2xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        The public CDN domain connected to this storage zone
                      </span>
                    </div>
                  </div>

                  {/* CORS Banner */}
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                    <span className="font-bold shrink-0">⚠️ CORS Requirement:</span>
                    <span>
                      In your Bunny dashboard under <strong>Storage Zone → Security / CORS</strong>, make sure <strong>"Enable CORS Headers"</strong> is toggled <strong>ON</strong> so browsers can upload PDFs without being blocked.
                    </span>
                  </div>

                  {/* Test Storage Button */}
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleTestBunnyStorage}
                      disabled={bunnyTestResults.testingStorage || !bunnyConfig.storageZoneName || !bunnyConfig.storagePassword}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-800 text-xs font-bold border-none cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{bunnyTestResults.testingStorage ? 'Testing Bunny Storage...' : 'Test Storage API Connection'}</span>
                    </button>

                    {bunnyTestResults.storage && (
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                        bunnyTestResults.storage.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {bunnyTestResults.storage.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Save All Bunny Credentials Button */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-500">
                    Credentials are saved securely in browser local storage and sync with Course Studio.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      saveBunnyConfig(bunnyConfig);
                      triggerToast('✅ Bunny.net credentials saved successfully!');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black border-none cursor-pointer transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Bunny Credentials</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: SECTION TEXTS (100% A to Z Dynamic Text) */}
               {activeTab === 'sectionTexts' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Type className="w-6 h-6 text-blue-600" />
                    Website Section Headings & Content Customization
                  </h2>
                  <p className="text-xs text-slate-500">
                    Modify section headings, badges, and button text live across the homepage.
                  </p>
                </div>
              </div>

              {/* Sub-Navigation Pills Bar */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                {[
                  { id: 'courses', label: '📚 Courses Section' },
                  { id: 'faculty', label: '👨‍🏫 Instructors & Faculty' },
                  { id: 'videos', label: '📺 Free Video Classes' },
                  { id: 'ai', label: '🤖 AI Study Partner' },
                  { id: 'contact', label: '📞 Contact & Footer' },
                  { id: 'reviews', label: '🌟 Why Choose Us' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTextSubTab(item.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      textSubTab === item.id
                        ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200 shadow-2xs'
                        : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Sub-tab Content Area: Only Active Section is Rendered */}
              <div className="space-y-6">
                
                {/* 1. COURSES SECTION */}
                {textSubTab === 'courses' && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-bold text-slate-900">1. Courses Section</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Section Title (e.g. Featured Courses)</label>
                        <input
                          type="text"
                          value={sectionTexts.coursesTitle || ''}
                          onChange={(e) => handleUpdateSectionText('coursesTitle', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Button Text (e.g. View All Courses)</label>
                        <input
                          type="text"
                          value={sectionTexts.coursesBtnText || ''}
                          onChange={(e) => handleUpdateSectionText('coursesBtnText', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. FACULTY SECTION */}
                {textSubTab === 'faculty' && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-bold text-slate-900">2. Faculty & Mentors Section</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Section Badge (e.g. Meet Our Mentors)</label>
                        <input
                          type="text"
                          value={sectionTexts.facultyBadge || ''}
                          onChange={(e) => handleUpdateSectionText('facultyBadge', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Section Title (e.g. Learn From Top Educators)</label>
                        <input
                          type="text"
                          value={sectionTexts.facultyTitle || ''}
                          onChange={(e) => handleUpdateSectionText('facultyTitle', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Button Text (e.g. View All Courses)</label>
                        <input
                          type="text"
                          value={sectionTexts.facultyBtnText || ''}
                          onChange={(e) => handleUpdateSectionText('facultyBtnText', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. FREE VIDEOS SECTION */}
                {textSubTab === 'videos' && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Video className="w-4 h-4 text-rose-600" />
                      <h3 className="text-sm font-bold text-slate-900">3. Free Video Classes Section</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Section Badge (e.g. Free Video Lessons)</label>
                        <input
                          type="text"
                          value={sectionTexts.videosBadge || ''}
                          onChange={(e) => handleUpdateSectionText('videosBadge', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Title Line 1 (e.g. Watch & Learn)</label>
                        <input
                          type="text"
                          value={sectionTexts.videosTitle1 || ''}
                          onChange={(e) => handleUpdateSectionText('videosTitle1', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Title Line 2 (e.g. Top Free Video Classes)</label>
                        <input
                          type="text"
                          value={sectionTexts.videosTitle2 || ''}
                          onChange={(e) => handleUpdateSectionText('videosTitle2', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Button Text (e.g. View All Free Videos)</label>
                        <input
                          type="text"
                          value={sectionTexts.videosBtnText || ''}
                          onChange={(e) => handleUpdateSectionText('videosBtnText', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. WHY CHOOSE US HEADERS */}
                {textSubTab === 'reviews' && (
                  <div className="grid grid-cols-1 gap-4 max-w-2xl">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <HelpCircle className="w-4 h-4 text-blue-600" />
                        <h3 className="text-sm font-bold text-slate-900">4. Why Choose Us Section Header</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">Badge Text</label>
                          <input
                            type="text"
                            value={sectionTexts.whyChooseBadge || ''}
                            onChange={(e) => handleUpdateSectionText('whyChooseBadge', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">Main Title</label>
                          <input
                            type="text"
                            value={sectionTexts.whyChooseTitle || ''}
                            onChange={(e) => handleUpdateSectionText('whyChooseTitle', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. 24/7 AI STUDY PARTNER SECTION */}
                {textSubTab === 'ai' && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-bold text-slate-900">6. 24/7 AI Study Partner Section (Edu Hunters AI)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">AI Badge Text</label>
                        <input
                          type="text"
                          value={sectionTexts.aiBadge || ''}
                          onChange={(e) => handleUpdateSectionText('aiBadge', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">AI Main Title</label>
                        <input
                          type="text"
                          value={sectionTexts.aiTitle || ''}
                          onChange={(e) => handleUpdateSectionText('aiTitle', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Button 1 Text</label>
                        <input
                          type="text"
                          value={sectionTexts.aiBtn1 || ''}
                          onChange={(e) => handleUpdateSectionText('aiBtn1', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Button 2 Text</label>
                        <input
                          type="text"
                          value={sectionTexts.aiBtn2 || ''}
                          onChange={(e) => handleUpdateSectionText('aiBtn2', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">AI Section Description</label>
                      <textarea
                        rows={2}
                        value={sectionTexts.aiDesc || ''}
                        onChange={(e) => handleUpdateSectionText('aiDesc', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* 4 AI Feature Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold text-rose-600 uppercase">Card 1</span>
                        <input
                          type="text"
                          placeholder="Title"
                          value={sectionTexts.aiCard1Title || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard1Title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none font-bold"
                        />
                        <textarea
                          rows={2}
                          placeholder="Description"
                          value={sectionTexts.aiCard1Desc || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard1Desc', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                        />
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold text-amber-600 uppercase">Card 2</span>
                        <input
                          type="text"
                          placeholder="Title"
                          value={sectionTexts.aiCard2Title || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard2Title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none font-bold"
                        />
                        <textarea
                          rows={2}
                          placeholder="Description"
                          value={sectionTexts.aiCard2Desc || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard2Desc', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                        />
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Card 3</span>
                        <input
                          type="text"
                          placeholder="Title"
                          value={sectionTexts.aiCard3Title || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard3Title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none font-bold"
                        />
                        <textarea
                          rows={2}
                          placeholder="Description"
                          value={sectionTexts.aiCard3Desc || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard3Desc', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                        />
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold text-blue-600 uppercase">Card 4</span>
                        <input
                          type="text"
                          placeholder="Title"
                          value={sectionTexts.aiCard4Title || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard4Title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none font-bold"
                        />
                        <textarea
                          rows={2}
                          placeholder="Description"
                          value={sectionTexts.aiCard4Desc || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard4Desc', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                        />
                      </div>
                    </div>

                    {/* AI Question & Quote */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">AI Box Header</label>
                        <input
                          type="text"
                          value={sectionTexts.aiQuestionHeader || ''}
                          onChange={(e) => handleUpdateSectionText('aiQuestionHeader', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">AI Box Sub-Heading</label>
                        <input
                          type="text"
                          value={sectionTexts.aiQuestionSub || ''}
                          onChange={(e) => handleUpdateSectionText('aiQuestionSub', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">AI Quotation Text</label>
                        <input
                          type="text"
                          value={sectionTexts.aiQuote || ''}
                          onChange={(e) => handleUpdateSectionText('aiQuote', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. CONTACT & FOOTER SECTIONS */}
                {textSubTab === 'contact' && (
                  <div className="space-y-6">
                    {/* Contact Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                        <h3 className="text-sm font-bold text-slate-900">7. Contact & Community Section</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">Contact Section Title</label>
                          <input
                            type="text"
                            value={sectionTexts.contactTitle || ''}
                            onChange={(e) => handleUpdateSectionText('contactTitle', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">Contact Description</label>
                          <input
                            type="text"
                            value={sectionTexts.contactDesc || ''}
                            onChange={(e) => handleUpdateSectionText('contactDesc', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <span className="text-xs font-bold text-slate-900 block">Facebook Page Button Card</span>
                          <input
                            type="text"
                            placeholder="Button Title (e.g. Message Our Page)"
                            value={sectionTexts.contactPageTitle || ''}
                            onChange={(e) => handleUpdateSectionText('contactPageTitle', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Button Subtitle (e.g. Reach out on our Facebook page)"
                            value={sectionTexts.contactPageSub || ''}
                            onChange={(e) => handleUpdateSectionText('contactPageSub', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-600 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Facebook Page URL"
                            value={sectionTexts.contactPageUrl || ''}
                            onChange={(e) => handleUpdateSectionText('contactPageUrl', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-blue-600 outline-none"
                          />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <span className="text-xs font-bold text-slate-900 block">Study Community Button Card</span>
                          <input
                            type="text"
                            placeholder="Button Title (e.g. Join Our Learner Community)"
                            value={sectionTexts.contactCommunityTitle || ''}
                            onChange={(e) => handleUpdateSectionText('contactCommunityTitle', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Button Subtitle (e.g. Connect with thousands of learners)"
                            value={sectionTexts.contactCommunitySub || ''}
                            onChange={(e) => handleUpdateSectionText('contactCommunitySub', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-600 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Community Group URL"
                            value={sectionTexts.contactCommunityUrl || ''}
                            onChange={(e) => handleUpdateSectionText('contactCommunityUrl', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-blue-600 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-sm font-bold text-slate-900">8. Footer & Copyright Section</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">Footer Description</label>
                          <input
                            type="text"
                            value={sectionTexts.footerDesc || ''}
                            onChange={(e) => handleUpdateSectionText('footerDesc', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">Copyright Line</label>
                          <input
                            type="text"
                            value={sectionTexts.footerCopyright || ''}
                            onChange={(e) => handleUpdateSectionText('footerCopyright', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: WHY CHOOSE US CARDS */}
          {/* ========================================================= */}
          {activeTab === 'whyChoose' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-amber-500" />
                    Why Choose Us - Feature Cards
                  </h2>
                  <p className="text-xs text-slate-500">
                    Add, edit, or remove feature cards displayed in the homepage 'Why Choose Us' section.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddWhyModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold border-none cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Card</span>
                </button>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {whyChooseUs.map((card, idx) => (
                  <div 
                    key={idx}
                    className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Card #</span>
                        <input
                          type="text"
                          value={card.number}
                          onChange={(e) => handleUpdateWhyPoint(idx, 'number', e.target.value)}
                          className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-blue-600 outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteWhyPoint(idx)}
                        title="Delete Card"
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">Card Title</label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => handleUpdateWhyPoint(idx, 'title', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Card Description</label>
                      <textarea
                        rows={2}
                        value={card.desc}
                        onChange={(e) => handleUpdateWhyPoint(idx, 'desc', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB: LEGAL & POLICIES STUDIO                              */}
          {/* ========================================================= */}
          {activeTab === 'policies' && (() => {
            const currentPolicy = activePolicySubTab === 'terms' 
              ? termsAndConditions 
              : (activePolicySubTab === 'refund' ? refundPolicy : privacyPolicy);
            const clauses = currentPolicy?.clauses || [];

            const subTabMeta = {
              terms: {
                label: 'Terms & Conditions',
                icon: ShieldCheck,
                color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
                activeTabStyle: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25',
                livePath: '/terms',
                badge: 'Usage Terms',
                introLabel: 'Introductory Statement',
                introPlaceholder: 'Introductory statement displayed before the clauses...'
              },
              refund: {
                label: 'Refund Policy',
                icon: DollarSign,
                color: 'text-amber-600 bg-amber-50 border-amber-200',
                activeTabStyle: 'bg-amber-600 text-white shadow-md shadow-amber-600/25',
                livePath: '/refund-policy',
                badge: 'Payment & Returns',
                introLabel: 'High Priority Notice Banner',
                introPlaceholder: 'Important warning or refund eligibility notice...'
              },
              privacy: {
                label: 'Privacy Policy',
                icon: ShieldCheck,
                color: 'text-rose-600 bg-rose-50 border-rose-200',
                activeTabStyle: 'bg-rose-600 text-white shadow-md shadow-rose-600/25',
                livePath: '/privacy-policy',
                badge: 'Data Protection',
                introLabel: 'Privacy Overview Statement',
                introPlaceholder: 'Statement explaining how user data and privacy are maintained...'
              }
            };

            const meta = subTabMeta[activePolicySubTab];

            return (
              <div className="space-y-6">
                {/* Header & Sub-Tab Switcher Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            Legal & Policies Studio
                          </h2>
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Sync Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Edit terms of service, refund rules, and privacy policies displayed on website footer, checkout modals, and legal pages.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <a
                        href={meta.livePath}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all text-decoration-none"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Live Page</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleResetPolicyTemplate(activePolicySubTab)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold transition-all cursor-pointer border-none"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Template</span>
                      </button>
                    </div>
                  </div>

                  {/* Clean Sub-Tab Pills */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
                    {['terms', 'refund', 'privacy'].map((tabKey) => {
                      const tMeta = subTabMeta[tabKey];
                      const count = tabKey === 'terms' 
                        ? (termsAndConditions.clauses?.length || 0) 
                        : (tabKey === 'refund' ? (refundPolicy.clauses?.length || 0) : (privacyPolicy.clauses?.length || 0));
                      const isActive = activePolicySubTab === tabKey;

                      return (
                        <button
                          key={tabKey}
                          type="button"
                          onClick={() => setActivePolicySubTab(tabKey)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
                            isActive
                              ? tMeta.activeTabStyle
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          <tMeta.icon className="w-3.5 h-3.5" />
                          <span>{tMeta.label}</span>
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Policy Overview Settings (Clean, Compact, Minimal) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-800">Policy Information</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-xs font-semibold text-slate-400">{meta.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">Last Updated:</span>
                      <input
                        type="text"
                        value={currentPolicy.lastUpdated || ''}
                        onChange={(e) => handleUpdatePolicyMeta(activePolicySubTab, 'lastUpdated', e.target.value)}
                        placeholder="e.g. ৫ অক্টোবর, ২০২৬"
                        className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 focus:border-[#5d5bf6] rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none transition-all w-44"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        {meta.introLabel}
                      </label>
                      <textarea
                        rows={2}
                        value={activePolicySubTab === 'refund' ? (currentPolicy.notice || '') : (currentPolicy.intro || '')}
                        onChange={(e) => handleUpdatePolicyMeta(activePolicySubTab, activePolicySubTab === 'refund' ? 'notice' : 'intro', e.target.value)}
                        placeholder={meta.introPlaceholder}
                        className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 focus:border-[#5d5bf6] rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium outline-none transition-all resize-y leading-relaxed"
                      />
                    </div>

                    {activePolicySubTab === 'terms' ? (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">
                          Agreement & Acceptance Note
                        </label>
                        <textarea
                          rows={2}
                          value={currentPolicy.agreementText || ''}
                          onChange={(e) => handleUpdatePolicyMeta('terms', 'agreementText', e.target.value)}
                          placeholder="Consent statement shown at bottom..."
                          className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 focus:border-[#5d5bf6] rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium outline-none transition-all resize-y leading-relaxed"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span>Updates sync in real-time across student checkout modals and legal policy pages.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Policy Clauses (Ultra-Clean, Minimal, Modern) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-extrabold text-slate-800 tracking-wide uppercase">
                        Clauses & Sections
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                        {clauses.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddClause(activePolicySubTab)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4d4be6] text-white text-xs font-bold transition-all cursor-pointer border-none shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Section</span>
                    </button>
                  </div>

                  {clauses.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <p className="text-xs font-bold text-slate-600">No clauses in this policy</p>
                      <button
                        type="button"
                        onClick={() => handleAddClause(activePolicySubTab)}
                        className="px-4 py-1.5 rounded-lg bg-[#5d5bf6] text-white text-xs font-bold border-none cursor-pointer"
                      >
                        Add First Section
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clauses.map((clause, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === clauses.length - 1;
                        const pointsText = Array.isArray(clause.points) 
                          ? clause.points.join('\n') 
                          : (clause.content || clause.text || '');

                        return (
                          <div
                            key={clause.id || idx}
                            className="bg-white hover:bg-slate-50/50 rounded-xl p-3.5 sm:p-4 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2.5 group"
                          >
                            {/* Integrated Header Row: Number + Editable Title + Controls */}
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px] font-black flex items-center justify-center shrink-0 border border-slate-200/80">
                                  #{String(idx + 1).padStart(2, '0')}
                                </span>
                                <input
                                  type="text"
                                  value={clause.title || ''}
                                  onChange={(e) => handleUpdateClause(activePolicySubTab, idx, 'title', e.target.value)}
                                  placeholder="Section Title (e.g. 1. Account & Security)"
                                  className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-[#5d5bf6] text-xs font-bold text-slate-900 py-1 px-1.5 outline-none transition-colors"
                                />
                              </div>

                              <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  disabled={isFirst}
                                  onClick={() => handleMoveClause(activePolicySubTab, idx, 'up')}
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 cursor-pointer border-none bg-transparent transition-colors"
                                  title="Move earlier"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isLast}
                                  onClick={() => handleMoveClause(activePolicySubTab, idx, 'down')}
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 cursor-pointer border-none bg-transparent transition-colors"
                                  title="Move later"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClause(activePolicySubTab, idx)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer border-none bg-transparent transition-colors ml-1"
                                  title="Delete section"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Content Textarea (Clean, borderless-feel or light border) */}
                            <textarea
                              rows={Math.max(2, (pointsText.split('\n').length || 1))}
                              value={pointsText}
                              onChange={(e) => handleUpdateClause(activePolicySubTab, idx, 'pointsText', e.target.value)}
                              placeholder="Enter points or paragraphs (one item per line)..."
                              className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/70 focus:border-[#5d5bf6] rounded-lg p-2.5 text-xs text-slate-800 font-normal leading-relaxed outline-none transition-all resize-y"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD TRANSACTION */}
      {/* ========================================================= */}
      {showAddTrxModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Transaction</h3>
                  <p className="text-[11px] text-slate-500">Record a new income or expense entry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTrxModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Transaction Type</label>
                <select
                  value={newTrx.type}
                  onChange={(e) => setNewTrx({ ...newTrx, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                >
                  <option value="INCOME">Income (Student Course Fee / PDF Purchase)</option>
                  <option value="EXPENSE">Expense (Server Hosting, CDN, Marketing)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Student Name / Details</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Md. Sakib Hossain"
                  value={newTrx.studentName}
                  onChange={(e) => setNewTrx({ ...newTrx, studentName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Course or Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medical Exam Batch"
                  value={newTrx.itemTitle}
                  onChange={(e) => setNewTrx({ ...newTrx, itemTitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    required
                    placeholder="1200"
                    value={newTrx.amount}
                    onChange={(e) => setNewTrx({ ...newTrx, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={newTrx.method}
                    onChange={(e) => setNewTrx({ ...newTrx, method: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="01700-000000"
                    value={newTrx.studentPhone}
                    onChange={(e) => setNewTrx({ ...newTrx, studentPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">TrxID / Voucher No.</label>
                  <input
                    type="text"
                    placeholder="9KJ34LA01X"
                    value={newTrx.trxId}
                    onChange={(e) => setNewTrx({ ...newTrx, trxId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTrxModal(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-emerald-500/20 transition-all"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD SLIDE */}
      {/* ========================================================= */}
      {showAddSlideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Hero Banner Slide</h3>
                  <p className="text-[11px] text-slate-500">Add promotional slide to homepage carousel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSlideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSlide} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Banner Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HSC 26 Special Mega Batch"
                  value={newSlide.title}
                  onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Banner Image</label>
                {newSlide.image ? (
                  <div className="relative aspect-[3.2/1.4] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs">
                    <img src={newSlide.image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 rounded-full bg-white text-slate-800 text-xs font-bold cursor-pointer hover:bg-slate-100 transition-colors shadow-md">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDeviceFileUpload(file, (url) => setNewSlide(prev => ({ ...prev, image: url })));
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewSlide(prev => ({ ...prev, image: '' }))}
                        className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold border-none cursor-pointer hover:bg-rose-700 transition-colors shadow-md"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center group">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors block">
                        Select Photo from Device
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Click to browse device gallery (JPG, PNG, WebP)
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDeviceFileUpload(file, (url) => setNewSlide(prev => ({ ...prev, image: url })));
                      }}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Action Link</label>
                <input
                  type="text"
                  placeholder="/courses"
                  value={newSlide.link}
                  onChange={(e) => setNewSlide({ ...newSlide, link: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSlideModal(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-rose-500/20 transition-all"
                >
                  Add Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD COURSE */}
      {/* ========================================================= */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Course / Batch</h3>
                  <p className="text-[11px] text-slate-500">Add learning course to enrollment catalog</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCourseModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medical 2nd Time Special Batch"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer font-bold"
                  >
                    {categories.filter(c => !isAllCat(c)).map((cat, cIdx) => (
                      <option key={cIdx} value={cat}>{cat}</option>
                    ))}
                    {newCourse.category && !categories.includes(newCourse.category) && (
                      <option value={newCourse.category}>{newCourse.category}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Course Type</label>
                  <select
                    value={newCourse.isBundle ? 'bundle' : 'single'}
                    onChange={(e) => setNewCourse({ ...newCourse, isBundle: e.target.value === 'bundle' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  >
                    <option value="single">Single Course</option>
                    <option value="bundle">Mega Bundle (Bundle Badge)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Discount Price (৳)</label>
                  <input
                    type="number"
                    required
                    value={newCourse.salePrice}
                    onChange={(e) => setNewCourse({ ...newCourse, salePrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Regular Price (৳)</label>
                  <input
                    type="number"
                    value={newCourse.regularPrice}
                    onChange={(e) => setNewCourse({ ...newCourse, regularPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Course Cover Picker */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Course Cover Image</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 aspect-video rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
                    <img src={newCourse.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openGalleryModal(newCourse.image, 'Choose Course Cover', 'Courses', (newUrl) => {
                        setNewCourse(prev => ({ ...prev, image: newUrl }));
                      })}
                      className="px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Choose from Gallery</span>
                    </button>
                    <label className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDeviceFileUpload(file, (newUrl) => setNewCourse(prev => ({ ...prev, image: newUrl })));
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-blue-500/20 transition-all"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD TEACHER */}
      {/* ========================================================= */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Add Instructor / Mentor</h3>
                  <p className="text-[11px] text-slate-500">নতুন শিক্ষক বা মেন্টরের প্রোফাইল ও হাই-কোয়ালিটি ছবি যুক্ত করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddTeacherModal(false);
                  setIsDraggingTeacherPhoto(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-4">
              {/* Photo Upload Studio Box */}
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingTeacherPhoto(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingTeacherPhoto(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingTeacherPhoto(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    handleDeviceFileUpload(file, (newUrl) => setNewTeacher(prev => ({ ...prev, image: newUrl })));
                  }
                }}
                className={`p-4 rounded-3xl border-2 transition-all duration-200 ${
                  isDraggingTeacherPhoto 
                    ? 'border-purple-500 bg-purple-50 scale-[1.01] shadow-lg shadow-purple-500/10' 
                    : 'border-dashed border-purple-200 hover:border-purple-300 bg-gradient-to-br from-purple-50/50 via-slate-50/50 to-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-[11px] uppercase tracking-wider font-extrabold text-purple-900 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-600" />
                    <span>শিক্ষকের ছবি (Faculty Photo)</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Full HD Supported</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  {/* Photo Preview Container (3:4 Ratio for Portrait Faculty Photo) */}
                  <div className="relative group/pic shrink-0">
                    <div 
                      style={{ width: '104px', height: '138px' }} 
                      className="rounded-2xl overflow-hidden border-2 border-purple-200 bg-slate-100 shadow-md relative"
                    >
                      {newTeacher.image ? (
                        <img 
                          src={newTeacher.image} 
                          alt="Instructor Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                          className="transition-transform duration-300 group-hover/pic:scale-105"
                          onError={(e) => {
                            e.currentTarget.src = '/default-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-50">
                          <Users className="w-8 h-8 text-slate-300" />
                          <span className="text-[10px] font-bold">No Photo</span>
                        </div>
                      )}

                      {/* Clickable Hover Overlay */}
                      <label 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs opacity-0 group-hover/pic:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white cursor-pointer"
                        title="Click to choose from device"
                      >
                        <Camera className="w-5 h-5 text-purple-200" />
                        <span className="text-[10px] font-bold">Change</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onClick={(e) => { e.target.value = ''; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDeviceFileUpload(file, (newUrl) => setNewTeacher(prev => ({ ...prev, image: newUrl })));
                          }}
                        />
                      </label>
                    </div>

                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                      3:4 Portrait
                    </div>
                  </div>

                  {/* Actions & File Pickers */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex flex-wrap gap-2">
                      {/* Direct Device Upload Button */}
                      <label className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-sm shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Upload className="w-4 h-4" />
                        <span>Device থেকে ছবি দিন</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onClick={(e) => { e.target.value = ''; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDeviceFileUpload(file, (newUrl) => setNewTeacher(prev => ({ ...prev, image: newUrl })));
                          }}
                        />
                      </label>

                      {/* Choose from Gallery */}
                      <button
                        type="button"
                        onClick={() => openGalleryModal(newTeacher.image, 'Choose Instructor Photo', 'Faculty', (newUrl) => {
                          setNewTeacher(prev => ({ ...prev, image: newUrl }));
                        })}
                        className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs hover:border-purple-300"
                        title="Select from platform gallery"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                        <span>Gallery</span>
                      </button>

                      {/* Reset / Clear photo button */}
                      {newTeacher.image && (
                        <button
                          type="button"
                          onClick={() => setNewTeacher(prev => ({ ...prev, image: '/default-avatar.png' }))}
                          className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-semibold border border-slate-200 cursor-pointer transition-colors"
                          title="Use default avatar"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-tight">
                      ফোন বা কম্পিউটার থেকে সরাসরি ছবি নির্বাচন করুন অথবা ড্র্যাগ করে আনুন। ছবি স্বয়ংক্রিয়ভাবে <strong className="text-purple-700">ফুল হাই কোয়ালিটিতে</strong> প্রসেস হবে।
                    </p>

                    {/* Direct Image URL input option */}
                    <div className="pt-1 border-t border-purple-100/60">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        বা ছবির ডিরেক্ট লিংক (URL) পেস্ট করুন:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="url"
                          placeholder="https://example.com/teacher-photo.jpg"
                          value={newTeacher.image}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, image: e.target.value }))}
                          className="w-full bg-white border border-slate-200 focus:bg-white focus:border-purple-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all font-mono"
                        />
                        {newTeacher.image && (
                          <button
                            type="button"
                            onClick={() => setNewTeacher(prev => ({ ...prev, image: '' }))}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg border-none cursor-pointer shrink-0 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Instructor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Dr. Sazzad Hossain"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value, badge: e.target.value.split(' ')[0] })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-500 transition-all shadow-2xs"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Designation / Role</label>
                <input
                  type="text"
                  placeholder="যেমন: FOUNDER & BIOLOGY MENTOR"
                  value={newTeacher.designation}
                  onChange={(e) => setNewTeacher({ ...newTeacher, designation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-500 transition-all shadow-2xs"
                />
              </div>

              {/* Bio & Academic Background */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Short Bio & Academic Background</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: Dhaka Medical College (MBBS)"
                  value={newTeacher.bio}
                  onChange={(e) => setNewTeacher({ ...newTeacher, bio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-500 transition-all resize-none shadow-2xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Save Instructor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CINEMA VIDEO PREVIEW PLAYER */}
      {/* ========================================================= */}
      {previewVideoModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setPreviewVideoModal(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-500 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {previewVideoModal.title || 'Video Class Preview'}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    YouTube ID: {previewVideoModal.videoId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://www.youtube.com/watch?v=${previewVideoModal.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <span>Open on YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewVideoModal(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700/80 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${previewVideoModal.videoId}?autoplay=1&rel=0`}
                title={previewVideoModal.title || 'Video Preview'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Direct stream from YouTube CDN</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewVideoModal(null)}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-transparent border-none cursor-pointer"
              >
                Close Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD VIDEO */}
      {/* ========================================================= */}
      {showAddVideoModal && (() => {
        const detectedId = extractCleanYouTubeId(newVideo.videoId);
        return (
          <div 
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowAddVideoModal(false)}
          >
            <div 
              className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Add YouTube Video Class</h3>
                    <p className="text-xs text-slate-400 font-medium">Publish a free lecture or masterclass for students</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddVideoModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddVideo} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Video Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Admission Preparation Routine Hack"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                  />
                </div>

                {/* Video URL or ID */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      YouTube URL or Video ID <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Paste full link or ID
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. https://youtube.com/watch?v=rMGOI-A5czA or rMGOI-A5czA"
                      value={newVideo.videoId}
                      onChange={(e) => setNewVideo({ ...newVideo, videoId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3.5 pr-20 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                    />
                    {detectedId && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Check className="w-3 h-3" />
                        Valid ID
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Thumbnail Preview */}
                {detectedId ? (
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Live Video Preview</span>
                      <span className="font-mono text-[11px] text-slate-500">ID: {detectedId}</span>
                    </div>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                      <img
                        src={`https://img.youtube.com/vi/${detectedId}/mqdefault.jpg`}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://img.youtube.com/vi/${detectedId}/hqdefault.jpg`;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Short Description */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Short Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Free revision class for admission preparation"
                    value={newVideo.desc}
                    onChange={(e) => setNewVideo({ ...newVideo, desc: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddVideoModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-rose-600/20 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Publish Video</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* MODAL: ADD STORE PRODUCT */}
      {/* ========================================================= */}
      {showAddStoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Book or PDF Resource</h3>
                  <p className="text-[11px] text-slate-500">Publish new book or digital PDF download</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStoreModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStoreProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Book or Document Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HSC Physics Formula Sheet"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Selling Price (৳)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  >
                    <option value="E-book">E-book (PDF)</option>
                    <option value="Book">Printed Book</option>
                    <option value="Stationery">Stationery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cover Image Link</label>
                <input
                  type="text"
                  value={newProduct.cover}
                  onChange={(e) => setNewProduct({ ...newProduct, cover: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStoreModal(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-emerald-500/20 transition-all"
                >
                  Add to Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD WHY CHOOSE US CARD */}
      {/* ========================================================= */}
      {showAddWhyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add 'Why Choose Us' Card</h3>
                  <p className="text-[11px] text-slate-500">Highlight unique strengths and benefits</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddWhyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWhyPoint} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Card Number (e.g. 05)</label>
                <input
                  type="text"
                  required
                  placeholder="05"
                  value={newWhyPoint.number}
                  onChange={(e) => setNewWhyPoint({ ...newWhyPoint, number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Card Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Progress Tracking"
                  value={newWhyPoint.title}
                  onChange={(e) => setNewWhyPoint({ ...newWhyPoint, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Card Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Comprehensive mistake analysis and performance metrics after every exam."
                  value={newWhyPoint.desc}
                  onChange={(e) => setNewWhyPoint({ ...newWhyPoint, desc: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddWhyModal(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-blue-500/20 transition-all"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MEDIA GALLERY & PHOTO PICKER */}
      {/* ========================================================= */}
      {renderGalleryModal()}

      {/* ========================================================= */}
      {/* MODAL: MINIMAL & USER-FRIENDLY STUDENT ENROLLMENT */}
      {/* ========================================================= */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-pink-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center font-bold shadow-md shadow-pink-500/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingStudentId ? 'Update Student Information' : 'Manual Student Enrollment'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingStudentId ? 'Update details and save changes' : 'Directly enroll a new student into a course or exam batch'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAddStudentModal(false);
                  setEditingStudentId(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center border-none cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newStudentData.name.trim() || !newStudentData.phone.trim()) {
                  triggerToast('⚠️ Please enter student name and phone number');
                  return;
                }

                if (editingStudentId) {
                  const existingSt = enrolledStudents.find(s => s.id === editingStudentId);
                  const updatedStudents = enrolledStudents.map(st => {
                    if (st.id === editingStudentId) {
                      return {
                        ...st,
                        name: newStudentData.name.trim(),
                        phone: newStudentData.phone.trim(),
                        email: newStudentData.email.trim() || `${newStudentData.phone.trim()}@eduhunters.com`,
                        batch: newStudentData.batch,
                        courseName: newStudentData.courseName,
                        status: newStudentData.status
                      };
                    }
                    return st;
                  });
                  setEnrolledStudents(updatedStudents);
                  try {
                    localStorage.setItem('eh_enrolled_students', JSON.stringify(updatedStudents));
                  } catch (e) {}

                  // Update cloud databases
                  const targetOrderId = existingSt?.orderId || (editingStudentId.startsWith('st-ord_') ? editingStudentId.replace('st-', '') : null);
                  if (targetOrderId) {
                    if (isSupabaseConfigured) {
                      updateSupabaseOrderStatus(targetOrderId, {
                        customer_name: newStudentData.name.trim(),
                        customer_phone: newStudentData.phone.trim(),
                        customer_email: newStudentData.email.trim(),
                        course_name: newStudentData.courseName,
                        status: newStudentData.status === 'Active' ? 'PAID' : 'PENDING',
                        is_approved: newStudentData.status === 'Active'
                      }).catch(() => {});
                    }
                    // Order info is updated directly in Supabase eduhunters_orders (100% Centralized Cloud)
                  }

                  if (newStudentData.status === 'Active') {
                    grantCourseAccess(newStudentData.courseName, { bundles, courses }, { name: newStudentData.name, phone: newStudentData.phone, email: newStudentData.email });
                  }

                  persistAll({ enrolledStudents: updatedStudents });
                  triggerToast(`✅ Student info updated & synced for ${newStudentData.name}!`);
                } else {
                  const newIdNumber = Math.floor(100 + Math.random() * 900);
                  const newOrderId = `ord_manual_${Date.now()}`;
                  const newEntry = {
                    id: `st-${Date.now()}`,
                    orderId: newOrderId,
                    name: newStudentData.name.trim(),
                    studentId: `EH-2026-${newIdNumber}`,
                    batch: newStudentData.batch,
                    courseName: newStudentData.courseName,
                    phone: newStudentData.phone.trim(),
                    email: newStudentData.email.trim() || `student${newIdNumber}@eduhunters.com`,
                    avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=100&auto=format&fit=crop&q=80`,
                    status: newStudentData.status || 'Active',
                    joinedDate: 'Today',
                    amount: 0,
                    trxId: `MANUAL-${Date.now()}`,
                    paymentMethod: 'Manual Enrollment'
                  };

                  const updatedStudents = [newEntry, ...enrolledStudents];
                  setEnrolledStudents(updatedStudents);
                  try {
                    localStorage.setItem('eh_enrolled_students', JSON.stringify(updatedStudents));
                  } catch (e) {}

                  // Save to Supabase
                  if (isSupabaseConfigured) {
                    saveSupabaseOrder({
                      id: newOrderId,
                      invoice_number: `INV-MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
                      customer_name: newStudentData.name.trim(),
                      customer_phone: newStudentData.phone.trim(),
                      customer_email: newEntry.email,
                      course_name: newStudentData.courseName,
                      course_slug: '',
                      amount: 0,
                      payment_method: 'Manual Enrollment',
                      trx_id: newEntry.trxId,
                      status: newEntry.status === 'Active' ? 'PAID' : 'PENDING',
                      is_approved: newEntry.status === 'Active',
                      raw_data: { ...newEntry, orderId: newOrderId, isApproved: newEntry.status === 'Active' }
                    }).catch(() => {});
                  }

                  // Manual enrollment order is saved directly to Supabase eduhunters_orders (100% Centralized Cloud)

                  if (newEntry.status === 'Active') {
                    grantCourseAccess(newStudentData.courseName, { bundles, courses }, { name: newStudentData.name, phone: newStudentData.phone, email: newStudentData.email });
                  }

                  persistAll({ enrolledStudents: updatedStudents });
                  triggerToast(`🎉 Student "${newEntry.name}" permanently enrolled & synced!`);
                }

                setShowAddStudentModal(false);
                setEditingStudentId(null);
                setNewStudentData({
                  name: '',
                  phone: '',
                  email: '',
                  batch: 'HSC 26',
                  courseName: courses[0]?.title || 'Mastering Text Book Combo HSC 25,26,27',
                  status: 'Active'
                });
              }}
              className="p-5 sm:p-6 space-y-4"
            >
              {/* Row 1: Student Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Student Full Name <span className="text-pink-600">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Tanvir Hasan"
                  value={newStudentData.name}
                  onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all font-medium"
                />
              </div>

              {/* Row 2: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Phone Number <span className="text-pink-600">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="017xxxxxxxx"
                    value={newStudentData.phone}
                    onChange={(e) => setNewStudentData({ ...newStudentData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input 
                    type="email" 
                    placeholder="student@gmail.com"
                    value={newStudentData.email}
                    onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Course Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Course / Batch <span className="text-pink-600">*</span>
                </label>
                <select 
                  value={newStudentData.courseName}
                  onChange={(e) => {
                    const selCourse = courses.find(c => c.title === e.target.value);
                    setNewStudentData({ 
                      ...newStudentData, 
                      courseName: e.target.value,
                      batch: selCourse?.category ? (selCourse.category === 'Medical' ? 'Medical 25' : selCourse.category) : newStudentData.batch
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all font-medium cursor-pointer"
                >
                  <optgroup label="Online Courses">
                    {courses.map(c => (
                      <option key={c.id} value={c.title}>
                        {c.title} {c.category ? `(${c.category})` : ''}
                      </option>
                    ))}
                  </optgroup>
                  {data?.examBatches && data.examBatches.length > 0 && (
                    <optgroup label="SureShot Exam Batches">
                      {data.examBatches.map(b => (
                        <option key={b.key || b.id} value={b.title}>
                          {b.title} {b.targetBatch ? `(${b.targetBatch})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Other Batches">
                    <option value="Biology Extra Info + Exam Batch">Biology Extra Info + Exam Batch</option>
                    <option value="Ketab Sir Higher Math MCQ Solve">Ketab Sir Higher Math MCQ Solve</option>
                  </optgroup>
                </select>
              </div>

              {/* Row 4: Batch & Status */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Batch Category</label>
                  <select 
                    value={newStudentData.batch}
                    onChange={(e) => setNewStudentData({ ...newStudentData, batch: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 font-bold cursor-pointer"
                  >
                    <option value="HSC 25">HSC 25</option>
                    <option value="HSC 26">HSC 26</option>
                    <option value="HSC 27">HSC 27</option>
                    <option value="HSC 28">HSC 28</option>
                    <option value="Medical 25">Medical 25</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Enrollment Status</label>
                  <select 
                    value={newStudentData.status}
                    onChange={(e) => setNewStudentData({ ...newStudentData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 font-bold cursor-pointer"
                  >
                    <option value="Active">🟢 Active (Approved)</option>
                    <option value="Pending">🟡 Pending (Under Review)</option>
                  </select>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setEditingStudentId(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border-none cursor-pointer transition-colors"
                >
                  Rejected
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 border-none cursor-pointer shadow-md shadow-pink-600/25 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingStudentId ? 'Save Changes' : 'Confirm Enrollment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD ROUTINE SCHEDULE */}
      {/* ========================================================= */}
      {showAddRoutineModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Add Routine Schedule / Class</h3>
              </div>
              <button 
                onClick={() => setShowAddRoutineModal(false)}
                className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!newRoutineData.title) return;
                const newSchedule = {
                  id: `r-${Date.now()}`,
                  day: newRoutineData.day,
                  time: newRoutineData.time,
                  title: newRoutineData.title,
                  tag: newRoutineData.tag,
                  type: newRoutineData.type,
                  bgClass: 'bg-blue-50 text-blue-900 border-blue-200'
                };
                setAcademicRoutines([...academicRoutines, newSchedule]);
                setShowAddRoutineModal(false);
                setNewRoutineData({ day: 'Sat', time: '10:30', title: '', tag: 'Live Class', type: 'live' });
                triggerToast('📅 New schedule added to academic routine!');
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Class or Exam Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Zoology Chapter 4 Special Live Class"
                  value={newRoutineData.title}
                  onChange={(e) => setNewRoutineData({ ...newRoutineData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day</label>
                  <select 
                    value={newRoutineData.day}
                    onChange={(e) => setNewRoutineData({ ...newRoutineData, day: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 font-bold"
                  >
                    <option value="Sat">Saturday</option>
                    <option value="Sun">Sunday</option>
                    <option value="Mon">Monday</option>
                    <option value="Tue">Tuesday</option>
                    <option value="Wed">Wednesday</option>
                    <option value="Thur">Thursday</option>
                    <option value="Fri">Friday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                  <select 
                    value={newRoutineData.time}
                    onChange={(e) => setNewRoutineData({ ...newRoutineData, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 font-bold"
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoutineModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border-none cursor-pointer"
                >
                  Rejected
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer shadow-md shadow-blue-600/20"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: BATCH NOTICE / BROADCAST SMS */}
      {/* ========================================================= */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Send Batch Notice & SMS Broadcast</h3>
              </div>
              <button 
                onClick={() => setShowNoticeModal(false)}
                className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!noticeText) return;
                const newAct = {
                  id: `act-${Date.now()}`,
                  title: `Notice Broadcasted: ${noticeTargetBatch}`,
                  sub: noticeText.slice(0, 50) + (noticeText.length > 50 ? '...' : ''),
                  time: 'Just now',
                  tag: 'Notice',
                  icon: 'sparkle',
                  color: 'amber'
                };
                setAcademicActivities([newAct, ...academicActivities]);
                setShowNoticeModal(false);
                setNoticeText('');
                triggerToast(`📢 Notice broadcasted successfully to students in ${noticeTargetBatch}!`);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Batch or Group</label>
                <select 
                  value={noticeTargetBatch}
                  onChange={(e) => setNoticeTargetBatch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-amber-500 font-bold"
                >
                  <option value="All Students">All Active Batches (All Students)</option>
                  <option value="Medical 25 Batch">Medical 25 Exam Batch</option>
                  <option value="HSC 26 Combo Batch">HSC 26 Combo Batch</option>
                  <option value="HSC 27 Series">HSC 27 Series</option>
                  <option value="HSC 28 Batch">HSC 28 Batch</option>
                  <option value="Engineering Batch">Engineering Special Batch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Message (SMS & App Notification) *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="e.g. Dear students, Biology Live Class begins tonight at 9:00 PM. Please connect via Zoom or the App."
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border-none cursor-pointer"
                >
                  Rejected
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 border-none cursor-pointer shadow-md shadow-amber-600/20"
                >
                  Send Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TRANSACTION & ENROLLMENT VERIFICATION DETAILS */}
      {/* ========================================================= */}
      {selectedTxDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center font-bold shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Transaction & Payment Verification
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    TrxID: {selectedTxDetails.trxId || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxDetails(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border border-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4.5 text-xs">
              
              {/* Highlighted TrxID & Amount Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Transaction ID (TrxID)
                  </div>
                  <div className="font-mono font-black text-base text-slate-900 tracking-wider select-all">
                    {selectedTxDetails.trxId || 'N/A'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(selectedTxDetails.trxId, 'trxId')}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    {copiedTrxId === selectedTxDetails.trxId ? (
                      <span className="text-emerald-600 font-black flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Copied
                      </span>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <div className="text-right pl-3 border-l border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400">Payment Amount</div>
                    {editingTrxAmountId === selectedTxDetails.id ? (
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <span className="text-slate-400 text-xs font-bold">৳</span>
                        <input
                          type="number"
                          value={editingTrxAmountVal}
                          onChange={(e) => setEditingTrxAmountVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTrxAmount(selectedTxDetails.id);
                            if (e.key === 'Escape') setEditingTrxAmountId(null);
                          }}
                          className="w-20 px-2 py-0.5 text-xs font-bold border border-[#5d5bf6] rounded-md focus:outline-none bg-white text-slate-800"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveTrxAmount(selectedTxDetails.id)}
                          className="p-1 rounded-md bg-emerald-600 text-white cursor-pointer border-none"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTrxAmountId(null)}
                          className="p-1 rounded-md bg-slate-200 text-slate-600 cursor-pointer border-none"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 justify-end">
                        <div className="text-lg font-black text-emerald-600">
                          ৳{selectedTxDetails.amount}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTrxAmountId(selectedTxDetails.id);
                            setEditingTrxAmountVal(String(selectedTxDetails.amount || 0));
                          }}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-[#5d5bf6] transition-colors cursor-pointer border-none"
                          title="Edit Amount"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Student & Course Info Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold mb-0.5">Student Full Name</div>
                  <div className="font-bold text-slate-800 text-sm">
                    {selectedTxDetails.studentName || selectedTxDetails.customer || 'Not specified'}
                  </div>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold mb-0.5">Mobile Phone Number</div>
                  <div className="font-mono font-bold text-slate-800 flex items-center justify-between">
                    <span>{selectedTxDetails.studentPhone || selectedTxDetails.phone || 'N/A'}</span>
                    {(selectedTxDetails.studentPhone || selectedTxDetails.phone) && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(selectedTxDetails.studentPhone || selectedTxDetails.phone, 'phone')}
                        className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
                        title="Copy mobile number"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold mb-0.5">Course or Exam Batch</div>
                  <div className="font-bold text-pink-600 text-xs">
                    {selectedTxDetails.itemTitle || selectedTxDetails.category || 'Course Enrollment'}
                  </div>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold mb-0.5">Payment Method</div>
                  <div className="font-bold text-slate-800 uppercase">
                    {selectedTxDetails.method || 'Online'}
                  </div>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold mb-0.5">Date & Timestamp</div>
                  <div className="font-medium text-slate-700">
                    {selectedTxDetails.date} {selectedTxDetails.time ? `• ${selectedTxDetails.time}` : ''}
                  </div>
                </div>
              </div>

              {/* 3-Step Verification Checklist */}
              <div className="bg-blue-50/60 rounded-2xl p-3.5 border border-blue-100 text-slate-700 space-y-1.5">
                <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Verification Checklist</span>
                </div>
                <div className="text-[11px] space-y-1 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>1. Match TrxID in your bKash/Nagad app or SMS merchant statement</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>2. Confirm received payment amount matches (৳{selectedTxDetails.amount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>3. Approving will automatically activate the student in the database</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedTxDetails(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
              >
                Close
              </button>

              {selectedTxDetails.status === 'Pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleRejectTrx(selectedTxDetails.id);
                      setSelectedTxDetails(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-colors"
                  >
                    ✕ Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleApproveAndEnrollStudent(selectedTxDetails);
                      setSelectedTxDetails(null);
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 border-none cursor-pointer transition-colors shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Enroll</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}



      {/* ========================================================= */}
      {/* MODAL: EDIT COURSE DETAILS MODAL (CLEAN & MINIMAL) */}
      {/* ========================================================= */}
      {editingCourseData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Edit Course Details</h3>
                <p className="text-xs text-slate-400 font-medium">Update pricing, category, and cover image</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourseData(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer border-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourseDetailsModal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Title *</label>
                <input 
                  type="text"
                  required
                  value={editingCourseData.title}
                  onChange={(e) => setEditingCourseData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={editingCourseData.category}
                    onChange={(e) => setEditingCourseData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                  >
                    {categories.filter(c => !isAllCat(c)).map((cat, cIdx) => (
                      <option key={cIdx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bundle Program</label>
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-xs font-bold text-slate-700">
                    <input 
                      type="checkbox"
                      checked={editingCourseData.isBundle}
                      onChange={(e) => setEditingCourseData(prev => ({ ...prev, isBundle: e.target.checked }))}
                    />
                    <span>Is Bundle Package</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sale Price (৳) *</label>
                  <input 
                    type="number"
                    value={editingCourseData.salePrice}
                    onChange={(e) => setEditingCourseData(prev => ({ ...prev, salePrice: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-black text-emerald-600 outline-none focus:bg-white focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Enter 0 for Free Course</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Regular / Original Price (৳)</label>
                  <input 
                    type="number"
                    value={editingCourseData.regularPrice}
                    onChange={(e) => setEditingCourseData(prev => ({ ...prev, regularPrice: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-400 line-through outline-none focus:bg-white focus:border-[#5d5bf6]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Shown with strikethrough</span>
                </div>
              </div>

              {/* Cover Image Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Cover Image</label>
                <div className="flex items-center gap-3">
                  <img 
                    src={editingCourseData.image} 
                    alt="Cover preview" 
                    className="w-20 h-12 rounded-xl object-cover ring-1 ring-slate-200"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openGalleryModal(editingCourseData.image, 'Select Course Cover', 'Courses', (newUrl) => {
                        setEditingCourseData(prev => ({ ...prev, image: newUrl }));
                      })}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 cursor-pointer"
                    >
                      Choose from Gallery
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCourseData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MANAGE CATEGORIES MODAL (CLEAN & COMPACT) */}
      {/* ========================================================= */}
      {showManageCategoriesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Course Categories & Batches</h3>
                <p className="text-xs text-slate-400">Add, rename, or delete category filters</p>
              </div>
              <button
                type="button"
                onClick={() => setShowManageCategoriesModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer border-none"
              >
                ✕
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} className="flex items-center gap-2">
              <input 
                type="text"
                placeholder="New category name (e.g. HSC 2026)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold cursor-pointer border-none shadow-xs"
              >
                + Add
              </button>
            </form>

            {/* Category List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pt-1">
              {categories.map((cat, idx) => {
                const count = isAllCat(cat) ? courses.length : courses.filter(c => c.category === cat).length;
                const isDefault = isAllCat(cat);

                return (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{isDefault ? 'All (Default Filter)' : cat}</span>
                      <span className="text-[10px] font-black bg-slate-200 px-1.5 py-0.2 rounded-md text-slate-600">
                        {count} courses
                      </span>
                    </div>

                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        title="Delete category"
                        className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer border-none bg-transparent transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowManageCategoriesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border-none"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: USER DETAILS PROFILE DRAWER / MODAL */}
      {/* ========================================================= */}
      {selectedUserDetails && (() => {
        const canonicalUserCourses = getCanonicalCourses(selectedUserDetails.enrolledCourses, { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA });

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden my-8">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#5d5bf6] to-[#7c7afc] p-6 text-white relative">
                <button
                  onClick={() => setSelectedUserDetails(null)}
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
                    <p className="text-[11px] text-white/70 mt-0.5 font-mono">ID: {selectedUserDetails.id} • Joined: {selectedUserDetails.joinedDate}</p>
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
                        setQuickEnrollUser(selectedUserDetails);
                        setSelectedCourseToEnroll(courses[0]?.title || '');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold cursor-pointer border-none shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>+ কোর্স এক্সেস দিন</span>
                    </button>
                  </div>

                  {/* Direct In-Tab Course Assign Form */}
                  {(() => {
                    const canonicalUserCourses = getCanonicalCourses(selectedUserDetails.enrolledCourses, { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA });
                    return (
                      <>
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
                      </>
                    );
                  })()}
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
                onClick={() => setSelectedUserDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer border-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    })()}

      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT USER MODAL */}
      {/* ========================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {editingUserId ? 'Edit User Profile' : 'Register New User'}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {editingUserId ? 'Modify user credentials, permissions, and batch' : 'Create an administrative or student account directly'}
                </p>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer border-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Tanvir Hasan"
                  value={userForm.name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input 
                    type="email"
                    required
                    placeholder="student@eduhunters.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Contact Number</label>
                  <input 
                    type="text"
                    placeholder="e.g. 01700-000000"
                    value={userForm.phone}
                    onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value, whatsapp: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">College / Institution</label>
                  <input 
                    type="text"
                    placeholder="e.g. Dhaka College / Notre Dame College"
                    value={userForm.college || ''}
                    onChange={(e) => setUserForm(prev => ({ ...prev, college: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">HSC Batch</label>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      {['HSC 25', 'HSC 26', 'HSC 27', 'HSC 28'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setUserForm(prev => ({ ...prev, batch: b }))}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${
                            userForm.batch === b
                              ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    <input 
                      type="text"
                      placeholder="e.g. HSC 26"
                      value={userForm.batch}
                      onChange={(e) => setUserForm(prev => ({ ...prev, batch: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                  >
                    <option value="Student">Student</option>
                    <option value="Instructor">Instructor</option>
                    <option value="Moderator">Moderator</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Total Paid (৳)</label>
                  <input
                    type="number"
                    placeholder="e.g. 499"
                    value={userForm.totalSpent !== undefined ? userForm.totalSpent : ''}
                    onChange={(e) => setUserForm(prev => ({ ...prev, totalSpent: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-emerald-600 outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none"
                >
                  {editingUserId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: QUICK COURSE ENROLL MODAL */}
      {/* ========================================================= */}
      {quickEnrollUser && (() => {
        const canonicalActive = getCanonicalCourses(quickEnrollUser.enrolledCourses, { courses, bundles, examBatches: EXAM_CATEGORIES_METADATA });

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5d5bf6]">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Grant Course Access</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Student: <strong className="text-slate-800">{quickEnrollUser.name}</strong> • {quickEnrollUser.email || quickEnrollUser.phone || 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuickEnrollUser(null);
                    setSelectedCourseToEnroll('');
                  }}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Active Courses (Canonical & De-duplicated) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Active Courses ({canonicalActive.length}):
                  </span>
                  <span className="text-[11px] font-extrabold text-[#5d5bf6]">
                    {canonicalActive.length} Active Course{canonicalActive.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {canonicalActive.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {canonicalActive.map((c, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate max-w-[210px]">{c}</span>
                        <button
                          type="button"
                          onClick={() => handleRevokeCourseFromUser(quickEnrollUser.id, c)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 ml-1 border-none bg-transparent cursor-pointer"
                          title="Revoke access"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No active courses currently assigned to this student.</p>
                )}
              </div>

              {/* Professional Course Search & Select Component */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Select Course or Batch to Grant:
                </label>
                <CourseSearchSelect
                  value={selectedCourseToEnroll}
                  onChange={(val) => setSelectedCourseToEnroll(val)}
                  courses={courses}
                  bundles={bundles}
                  examBatches={EXAM_CATEGORIES_METADATA}
                  enrolledCourses={canonicalActive}
                  placeholder="Choose Course, Bundle or Exam Batch..."
                />
              </div>

              {/* Live Preview Info Banner */}
              {selectedCourseToEnroll && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Selected: {selectedCourseToEnroll}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed pl-5">
                    Clicking &quot;Grant Course Access&quot; will immediately unlock all chapters, video classes, lecture notes, and quizzes for this student.
                  </p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setQuickEnrollUser(null);
                    setSelectedCourseToEnroll('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedCourseToEnroll}
                  onClick={() => handleAssignCourseToUser(quickEnrollUser.id, selectedCourseToEnroll)}
                  className="px-5 py-2.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Grant Course Access</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}


    </div>
  );
}
