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
import { collection, getDocs, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { initialData, isZenithCopiedCourse } from '../data/mockData';
import { masterEnglishCourseData } from '../data/masterEnglishCourseData';
const CourseStudioPage = React.lazy(() => import('./CourseStudioPage'));
const BundleStudioPage = React.lazy(() => import('./BundleStudioPage'));
import { EXAM_CATEGORIES_METADATA } from '../data/examCategoriesData';
import { grantCourseAccess, revokeCourseAccess, getCanonicalCourses, isPhoneMatch } from '../utils/enrollmentService';
import CourseSearchSelect from './CourseSearchSelect';
import { approveOrder, revokeOrder, getUserOrders } from '../services/orderService';
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

import {
  getDeletedIdsSet,
  getAmountOverridesMap,
  getStatusOverridesMap,
  saveStatusOverride,
  applyStatusOverride,
  getUserTimestamp,
  isDeletedItem,
  applyAmountOverride,
  DEFAULT_ACCOUNTING_RESET_AT,
  getAccountingResetConfig,
  isHistoricalTx,
  mapOrderDocToTx,
  mapOrderDocToStudent,
  formatOrderDateTime,
  deduplicateTransactions,
  deduplicateUsers,
  formatMinimalTime,
  AdminTokenPill
} from './admin/adminHelpers';
import AdminOverviewTab from './admin/tabs/AdminOverviewTab';
import AdminAccountingTab from './admin/tabs/AdminAccountingTab';
import AdminUsersTab from './admin/tabs/AdminUsersTab';
import AdminCoursesTab from './admin/tabs/AdminCoursesTab';
import AdminResultsTab from './admin/tabs/AdminResultsTab';
import AdminBundlesTab from './admin/tabs/AdminBundlesTab';
import AdminInstructorsTab from './admin/tabs/AdminInstructorsTab';
import AdminVideosTab from './admin/tabs/AdminVideosTab';
import AdminStoreTab from './admin/tabs/AdminStoreTab';
import AdminSettingsTab from './admin/tabs/AdminSettingsTab';
import AdminSectionTextsTab from './admin/tabs/AdminSectionTextsTab';
import AdminWhyChooseTab from './admin/tabs/AdminWhyChooseTab';
import AdminStatsTab from './admin/tabs/AdminStatsTab';
import AdminSlidesTab from './admin/tabs/AdminSlidesTab';
import AdminPoliciesTab from './admin/tabs/AdminPoliciesTab';
import AddTransactionModal from './admin/modals/AddTransactionModal';
import AddCourseModal from './admin/modals/AddCourseModal';
import StudentAddEditModal from './admin/modals/StudentAddEditModal';
import AddRoutineModal from './admin/modals/AddRoutineModal';
import BroadcastNoticeModal from './admin/modals/BroadcastNoticeModal';
import TransactionDetailsModal from './admin/modals/TransactionDetailsModal';
import EditCourseModal from './admin/modals/EditCourseModal';
import ManageCategoriesModal from './admin/modals/ManageCategoriesModal';
import UserDetailsModal from './admin/modals/UserDetailsModal';
import AddUserModal from './admin/modals/AddUserModal';
import QuickEnrollModal from './admin/modals/QuickEnrollModal';
import GalleryPickerModal from './admin/modals/GalleryPickerModal';
import { atomicEnrollNewStudent, atomicUpdateStudent } from '../services/adminSyncService';


export {
  getDeletedIdsSet,
  getAmountOverridesMap,
  getStatusOverridesMap,
  saveStatusOverride,
  applyStatusOverride,
  getUserTimestamp,
  isDeletedItem,
  applyAmountOverride,
  DEFAULT_ACCOUNTING_RESET_AT,
  getAccountingResetConfig,
  isHistoricalTx,
  mapOrderDocToTx,
  mapOrderDocToStudent,
  formatOrderDateTime,
  deduplicateTransactions,
  deduplicateUsers,
  formatMinimalTime,
  AdminTokenPill
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
  const lastLocalSaveRef = useRef(0);

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

  const [courses, setCourses] = useState(() => 
    Array.isArray(data?.courses) 
      ? data.courses 
      : (initialData.courses || [])
  );

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
      const userOrders = getUserOrders();
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

    const resetConfig = getAccountingResetConfig();
    const allTxs = deduplicateTransactions(Array.from(txMap.values()));
    const completedRev = allTxs
      .filter(t => (t.status || '').toLowerCase() === 'completed' && !isHistoricalTx(t, resetConfig))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExp = allTxs
      .filter(t => (t.type || '').toUpperCase() === 'EXPENSE' && !isHistoricalTx(t, resetConfig))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      totalRevenue: completedRev,
      totalExpenses: totalExp,
      netProfit: completedRev - totalExp,
      totalOrders: allTxs.length,
      resetAt: resetConfig.resetAt,
      legacyTxIds: Array.from(resetConfig.legacyIdsSet),
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
        avatar: '/logo-crimson.png',
        createdAt: '2026-01-01T00:00:00.000Z',
        created_at: '2026-01-01T00:00:00.000Z'
      }
    ];

    const userMap = new Map();
    defaultSeed.forEach(u => userMap.set(u.email.toLowerCase(), u));

    if (Array.isArray(data?.users) && data.users.length > 0) {
      data.users.filter(u => !['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5', 'usr-6', 'usr-7', 'usr-8'].includes(u.id)).forEach(u => {
        const k = (u.email || u.id || '').toLowerCase();
        if (k) {
          const createdIso = u.createdAt || u.created_at || (u.joinedDate === 'Official Launch' ? '2026-01-01T00:00:00.000Z' : null);
          userMap.set(k, { ...userMap.get(k), ...u, ...(createdIso ? { createdAt: createdIso, created_at: createdIso } : {}) });
        }
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
        const createdIso = u.createdAt || u.created_at || (u.joinedDate === 'Official Launch' ? '2026-01-01T00:00:00.000Z' : null);
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
          joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (u.joinedDate || 'Recently'),
          lastActive: 'Recently',
          device: 'Web Client',
          avatar: u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email || 'user')}`,
          ...(createdIso ? { createdAt: createdIso, created_at: createdIso } : {})
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
        const userCreated = u.createdAt || u.created_at || existing.createdAt || existing.created_at;
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
          lastActive: 'Active now',
          ...(userCreated ? { createdAt: userCreated, created_at: userCreated } : {})
        };
        const nextList = [updatedUser, ...prev.filter((_, idx) => idx !== existingIndex)];
        try {
          localStorage.setItem('eh_registered_users', JSON.stringify(nextList));
        } catch (e) {}
        return nextList;
      } else {
        const userIsoCreated = u.createdAt || u.created_at || new Date().toISOString();
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
          createdAt: userIsoCreated,
          created_at: userIsoCreated,
          device: 'Web Client',
          avatar: u.photoURL || u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetEmail || 'student')}`,
          photoURL: u.photoURL || u.avatar || '/avatar.svg'
        };
        const nextList = [newUserRecord, ...prev.filter(item => item.id !== newUserRecord.id && item.email !== newUserRecord.email)];
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

          cloudUsers.forEach(u => {
            const key = (u.email || u.id || '').toLowerCase().trim();
            if (key) notifiedUserKeysRef.current.add(key);
          });
          setUsersList(prev => deduplicateUsers([...prev, ...cloudUsers]));

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

            const resetConfig = getAccountingResetConfig();
            const allTxs = deduplicateTransactions(Array.from(txMap.values()));
            const completedRev = allTxs
              .filter(t => (t.status || '').toLowerCase() === 'completed' && !isHistoricalTx(t, resetConfig))
              .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            const totalExpenses = allTxs
              .filter(t => (t.type || '').toUpperCase() === 'EXPENSE' && !isHistoricalTx(t, resetConfig))
              .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

            return {
              ...prev,
              totalRevenue: completedRev,
              totalExpenses: totalExpenses,
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
                if (key) txMap.set(key, applyAmountOverride(applyStatusOverride(tx), overrides));
              });
              mappedTxs.forEach(tx => {
                const key = tx.orderId || tx.id || tx.trxId;
                if (key) {
                  const existing = txMap.get(key);
                  const isExistingCompleted = existing && (existing.status || '').toLowerCase() === 'completed';
                  const isCloudPending = (tx.status || '').toLowerCase() === 'pending';
                  const finalTx = (isExistingCompleted && isCloudPending)
                    ? { ...tx, status: 'Completed', isApproved: true }
                    : tx;
                  txMap.set(key, applyAmountOverride(applyStatusOverride(finalTx), overrides));
                }
              });
              const resetConfig = getAccountingResetConfig();
              const allTxs = deduplicateTransactions(Array.from(txMap.values()));
              const completedRev = allTxs
                .filter(t => (t.status || '').toLowerCase() === 'completed' && !isHistoricalTx(t, resetConfig))
                .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              const totalExpenses = allTxs
                .filter(t => (t.type || '').toUpperCase() === 'EXPENSE' && !isHistoricalTx(t, resetConfig))
                .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
              return {
                ...prev,
                totalRevenue: completedRev,
                totalExpenses: totalExpenses,
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

            // Sync student profiles from orders into User Management
            activeOrders.forEach(o => {
              const email = (o.customer_email || o.customer?.email || '').trim().toLowerCase();
              const phone = (o.customer_phone || o.customer?.phone || '').trim();
              const name = (o.customer_name || o.customer?.name || '').trim();
              if (email || phone || name) {
                const orderCreated = o.created_at || o.createdAt || new Date().toISOString();
                upsertUserInList({
                  id: o.customer?.uid || o.userId || `usr-${o.id}`,
                  email: email || `${(name || 'student').toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
                  name: name || 'Student',
                  displayName: name || 'Student',
                  phone: phone,
                  whatsapp: phone,
                  role: 'Student',
                  status: (o.status === 'PAID' || o.is_approved) ? 'Active' : 'Pending',
                  enrolledCourses: [o.course_name || o.course?.name || o.items?.[0]?.title].filter(Boolean),
                  totalSpent: Number(o.amount || o.totalPaid || 0),
                  createdAt: orderCreated,
                  created_at: orderCreated,
                  joinedDate: new Date(orderCreated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                }, false);
              }
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
                  if (key) txMap.set(key, applyAmountOverride(applyStatusOverride(tx), overrides));
                });
                mappedTxs.forEach(tx => {
                  const key = tx.orderId || tx.id || tx.trxId;
                  if (key) {
                    const existing = txMap.get(key);
                    const isExistingCompleted = existing && (existing.status || '').toLowerCase() === 'completed';
                    const isCloudPending = (tx.status || '').toLowerCase() === 'pending';
                    const finalTx = (isExistingCompleted && isCloudPending)
                      ? { ...tx, status: 'Completed', isApproved: true }
                      : tx;
                    txMap.set(key, applyAmountOverride(applyStatusOverride(finalTx), overrides));
                  }
                });
                const resetConfig = getAccountingResetConfig();
                const allTxs = deduplicateTransactions(Array.from(txMap.values()));
                const completedRev = allTxs
                  .filter(t => (t.status || '').toLowerCase() === 'completed' && !isHistoricalTx(t, resetConfig))
                  .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
                const totalExpenses = allTxs
                  .filter(t => (t.type || '').toUpperCase() === 'EXPENSE' && !isHistoricalTx(t, resetConfig))
                  .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
                return {
                  ...prev,
                  totalRevenue: completedRev,
                  totalExpenses: totalExpenses,
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
    // Don't re-sync if the update came from our own local save within the last 2.5 seconds
    if (Date.now() - lastLocalSaveRef.current < 2500) {
      return;
    }
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
        const resetConfig = getAccountingResetConfig();
        const allTxs = deduplicateTransactions(Array.from(txMap.values()));
        const completedRev = allTxs
          .filter(t => (t.status || '').toLowerCase() === 'completed' && !isHistoricalTx(t, resetConfig))
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const totalExpenses = allTxs
          .filter(t => (t.type || '').toUpperCase() === 'EXPENSE' && !isHistoricalTx(t, resetConfig))
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
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
      setUsersList(prev => deduplicateUsers([...prev, ...data.users]));
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

  // Unified Image / Media Picker Modal
  const renderGalleryModal = () => (
    <GalleryPickerModal
      isOpen={galleryModalOpen}
      onClose={() => setGalleryModalOpen(false)}
      galleryTitle={galleryTitle}
      gallerySelectedUrl={gallerySelectedUrl}
      setGallerySelectedUrl={setGallerySelectedUrl}
      galleryCallback={galleryCallback}
      handleDeviceFileUpload={handleDeviceFileUpload}
    />
  );

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
    lastLocalSaveRef.current = Date.now();
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
      users: deduplicateUsers(overrides.users !== undefined ? overrides.users : usersList),
      enrolledStudents: overrides.enrolledStudents !== undefined ? overrides.enrolledStudents : enrolledStudents,
      sectionTexts: overrides.sectionTexts !== undefined ? overrides.sectionTexts : sectionTexts,
      whyChooseUs: overrides.whyChooseUs !== undefined ? overrides.whyChooseUs : whyChooseUs,
      termsAndConditions: overrides.termsAndConditions !== undefined ? overrides.termsAndConditions : termsAndConditions,
      refundPolicy: overrides.refundPolicy !== undefined ? overrides.refundPolicy : refundPolicy,
      privacyPolicy: overrides.privacyPolicy !== undefined ? overrides.privacyPolicy : privacyPolicy
    };
    onUpdateData(fullState);
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

    const cleanInputPhone = (userForm.phone || '').replace(/[^0-9]/g, '');
    const cleanLast10Phone = cleanInputPhone.length >= 10 ? cleanInputPhone.slice(-10) : cleanInputPhone;
    const cleanInputEmail = userForm.email.trim().toLowerCase();

    if (editingUserId) {
      const targetUser = usersList.find(u => u.id === editingUserId);
      const oldSpent = Number(targetUser?.totalSpent) || 0;
      const newSpent = Number(userForm.totalSpent) || 0;
      const spentDiff = newSpent - oldSpent;

      const targetPhoneClean = (targetUser?.phone || targetUser?.whatsapp || '').replace(/[^0-9]/g, '');
      const targetPhoneLast10 = targetPhoneClean.length >= 10 ? targetPhoneClean.slice(-10) : targetPhoneClean;
      const targetEmailClean = (targetUser?.email || '').trim().toLowerCase();

      let savedUserRecord = null;
      const updated = usersList.map(u => {
        if (u.id === editingUserId) {
          savedUserRecord = {
            ...u,
            name: userForm.name.trim(),
            displayName: userForm.name.trim(),
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

      // =========================================================================
      // BIDIRECTIONAL SYNC: USER MANAGEMENT <-> ACCOUNTING LEDGER & ENROLLED STUDENTS
      // =========================================================================
      let nextAcc = accounting;
      let nextEnrolled = enrolledStudents;

      // 1. Sync Accounting transactions (Name, Phone, Email and Amount)
      const prevTxs = Array.isArray(accounting.transactions) ? accounting.transactions : [];
      let txUpdated = false;
      const overridesMap = getAmountOverridesMap();

      const nextTxs = prevTxs.map(t => {
        const tpRaw = (t.studentPhone || '').replace(/[^0-9]/g, '');
        const tpLast10 = tpRaw.length >= 10 ? tpRaw.slice(-10) : tpRaw;
        const te = (t.studentEmail || '').trim().toLowerCase();
        const tId = t.userId || t.studentId;

        const isUserMatch = (cleanLast10Phone && tpLast10 && cleanLast10Phone === tpLast10) ||
                            (targetPhoneLast10 && tpLast10 && targetPhoneLast10 === tpLast10) ||
                            (cleanInputEmail && te && cleanInputEmail === te) ||
                            (targetEmailClean && te && targetEmailClean === te) ||
                            (editingUserId && tId && (tId === editingUserId || tId === targetUser?.uid));

        if (isUserMatch) {
          // Always update contact information to keep transactions current
          const updatedTx = {
            ...t,
            studentName: userForm.name.trim(),
            studentPhone: userForm.phone.trim(),
            studentEmail: userForm.email.trim()
          };

          const st = (t.status || '').toLowerCase();
          const isComp = st === 'completed' || st === 'paid' || st === 'approved' || Boolean(t.isApproved);
          if (isComp && !txUpdated && (spentDiff !== 0 || Number(t.amount) !== newSpent)) {
            txUpdated = true;
            const updatedTrxAmt = Math.max(0, newSpent > 0 ? newSpent : (Number(t.amount) || 0) + spentDiff);
            updatedTx.amount = updatedTrxAmt;

            // Persist to eh_trx_amount_overrides
            if (t.id) overridesMap[t.id] = updatedTrxAmt;
            if (t.orderId) overridesMap[t.orderId] = updatedTrxAmt;
            if (t.trxId && t.trxId !== 'PENDING') overridesMap[t.trxId] = updatedTrxAmt;
            if (t.invoiceNumber) overridesMap[t.invoiceNumber] = updatedTrxAmt;

            const targetOrderId = t.orderId || t.id;
            if (isSupabaseConfigured && targetOrderId) {
              updateSupabaseOrderAmount(targetOrderId, updatedTrxAmt).catch(() => {});
            }
          }
          return updatedTx;
        }
        return t;
      });

      // If user had no completed transaction but newSpent > 0, generate a completed transaction
      if (!txUpdated && newSpent > 0) {
        const newTxId = `TRX-USER-${Date.now()}`;
        const newOrderId = `ord_user_${Date.now()}`;
        const invoiceNum = `INV-2026-EH-${Math.floor(100000 + Math.random() * 900000)}`;
        const autoTx = {
          id: newTxId,
          orderId: newOrderId,
          trxId: `USR-LEDGER-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
          type: 'INCOME',
          category: 'Course Enrollment',
          amount: newSpent,
          method: 'Direct Admin Ledger',
          status: 'Completed',
          isApproved: true,
          studentName: userForm.name.trim(),
          studentEmail: userForm.email.trim(),
          studentPhone: userForm.phone.trim(),
          itemTitle: (targetUser?.enrolledCourses && targetUser.enrolledCourses[0]) || 'Direct Course Enrollment',
          notes: 'Synchronized from User Management',
          invoiceNumber: invoiceNum,
          userId: editingUserId
        };
        nextTxs.unshift(autoTx);
        overridesMap[newTxId] = newSpent;
        overridesMap[newOrderId] = newSpent;
      }

      // Save updated overrides
      try {
        localStorage.setItem('eh_trx_amount_overrides', JSON.stringify(overridesMap));
      } catch (e) {}

      // Recalculate accounting totals
      const resetConfig = getAccountingResetConfig();
      const newRev = nextTxs
        .filter(t => (t.type || '').toUpperCase() === 'INCOME' &&
                     ['completed', 'paid', 'approved'].includes((t.status || '').toLowerCase()) &&
                     !isHistoricalTx(t, resetConfig))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const newExp = Number(accounting.totalExpenses) || 0;
      nextAcc = {
        ...accounting,
        totalRevenue: newRev,
        netProfit: newRev - newExp,
        transactions: nextTxs
      };
      setAccounting(nextAcc);

      // 2. Sync Enrolled Students (Name, Phone, Email, Amount)
      let studentUpdated = false;
      nextEnrolled = enrolledStudents.map(st => {
        const spRaw = (st.phone || '').replace(/[^0-9]/g, '');
        const spLast10 = spRaw.length >= 10 ? spRaw.slice(-10) : spRaw;
        const se = (st.email || '').trim().toLowerCase();
        const stId = st.userId || st.studentId || st.id;

        const isMatch = (cleanLast10Phone && spLast10 && cleanLast10Phone === spLast10) ||
                        (targetPhoneLast10 && spLast10 && targetPhoneLast10 === spLast10) ||
                        (cleanInputEmail && se && cleanInputEmail === se) ||
                        (targetEmailClean && se && targetEmailClean === se) ||
                        (editingUserId && stId && (stId === editingUserId || stId === targetUser?.uid));
        if (isMatch) {
          studentUpdated = true;
          return {
            ...st,
            name: userForm.name.trim(),
            email: userForm.email.trim(),
            phone: userForm.phone.trim(),
            amount: newSpent
          };
        }
        return st;
      });

      // If user has enrolled courses but not yet in enrolledStudents list, add them!
      if (!studentUpdated && targetUser?.enrolledCourses && targetUser.enrolledCourses.length > 0) {
        const newEnrolledStudent = {
          id: `st-${Date.now()}`,
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          phone: userForm.phone.trim(),
          course: targetUser.enrolledCourses[0],
          courses: targetUser.enrolledCourses,
          amount: newSpent,
          status: 'Active',
          batch: userForm.batch || 'HSC 26',
          enrolledAt: new Date().toISOString()
        };
        nextEnrolled = [newEnrolledStudent, ...nextEnrolled];
      }
      setEnrolledStudents(nextEnrolled);
      try {
        localStorage.setItem('eh_enrolled_students', JSON.stringify(nextEnrolled));
      } catch (e) {}

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

      triggerToast(`User "${userForm.name}" & Ledger updated successfully`);
    } else {
      // New user addition
      const nowIso = new Date().toISOString();
      const newSpent = Number(userForm.totalSpent) || 0;
      const newUser = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        name: userForm.name.trim(),
        displayName: userForm.name.trim(),
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
        totalSpent: newSpent,
        createdAt: nowIso,
        created_at: nowIso,
        joinedDate: 'Just now',
        lastActive: 'Just registered',
        device: 'Manual Admin Entry',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userForm.email)}`
      };
      const updated = [newUser, ...usersList];
      setUsersList(updated);

      let nextAcc = accounting;
      if (newSpent > 0) {
        const newTxId = `TRX-USER-${Date.now()}`;
        const newOrderId = `ord_user_${Date.now()}`;
        const autoTx = {
          id: newTxId,
          orderId: newOrderId,
          trxId: `USR-LEDGER-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString().slice(0, 10),
          createdAt: nowIso,
          type: 'INCOME',
          category: 'Course Enrollment',
          amount: newSpent,
          method: 'Direct Admin Ledger',
          status: 'Completed',
          isApproved: true,
          studentName: newUser.name,
          studentEmail: newUser.email,
          studentPhone: newUser.phone,
          itemTitle: 'Direct Course Enrollment',
          notes: 'New user manual entry',
          invoiceNumber: `INV-2026-EH-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: newUser.id
        };
        const nextTxs = [autoTx, ...(accounting.transactions || [])];
        const newRev = Math.max(0, (Number(accounting.totalRevenue) || 0) + newSpent);
        const newExp = Number(accounting.totalExpenses) || 0;
        nextAcc = {
          ...accounting,
          totalRevenue: newRev,
          netProfit: newRev - newExp,
          transactions: nextTxs
        };
        setAccounting(nextAcc);
        try {
          const overridesMap = getAmountOverridesMap();
          overridesMap[newTxId] = newSpent;
          overridesMap[newOrderId] = newSpent;
          localStorage.setItem('eh_trx_amount_overrides', JSON.stringify(overridesMap));
        } catch (e) {}
      }

      persistAll({ users: updated, accounting: nextAcc });

      if (isSupabaseConfigured) {
        saveSupabaseUser({
          uid: newUser.id,
          email: newUser.email,
          displayName: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          createdAt: nowIso,
          created_at: nowIso
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
    grantCourseAccess(selection, { bundles, courses }, targetUser || { id: userId, uid: userId });

    // Bi-directional sync: Mirror into enrolledStudents so user appears on Overview tab immediately
    let nextEnrolled = enrolledStudents;
    if (targetUser) {
      const cleanPhone = (targetUser.phone || targetUser.whatsapp || '').replace(/[^0-9]/g, '');
      const cleanEmail = (targetUser.email || '').trim().toLowerCase();
      const existingEnrolledIdx = enrolledStudents.findIndex(st => {
        const stPhone = (st.phone || '').replace(/[^0-9]/g, '');
        const stEmail = (st.email || '').trim().toLowerCase();
        return (cleanPhone && stPhone && (cleanPhone === stPhone || (cleanPhone.length >= 10 && stPhone.slice(-10) === cleanPhone.slice(-10)))) ||
               (cleanEmail && stEmail && cleanEmail === stEmail);
      });

      if (existingEnrolledIdx >= 0) {
        nextEnrolled = [...enrolledStudents];
        nextEnrolled[existingEnrolledIdx] = {
          ...nextEnrolled[existingEnrolledIdx],
          status: 'Active',
          courseName: selection
        };
      } else {
        const newEnrolledStudent = {
          id: `st-${Date.now()}`,
          name: targetUser.name || targetUser.displayName || 'Student',
          studentId: `EH-2026-${Math.floor(100 + Math.random() * 900)}`,
          batch: targetUser.batch || targetUser.hscBatch || 'HSC 26',
          courseName: selection,
          phone: targetUser.phone || targetUser.whatsapp || 'N/A',
          email: targetUser.email || `${(targetUser.name || 'student').toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          avatar: targetUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          status: 'Active',
          joinedDate: 'Today',
          amount: Number(targetUser.totalSpent) || 0
        };
        nextEnrolled = [newEnrolledStudent, ...enrolledStudents];
      }
      setEnrolledStudents(nextEnrolled);
      try {
        localStorage.setItem('eh_enrolled_students', JSON.stringify(nextEnrolled));
      } catch (e) {}
    }

    persistAll({ users: updated, enrolledStudents: nextEnrolled });

    // Bi-directional sync: Mirror to Supabase eduhunters_users
    if (isSupabaseConfigured && targetUser) {
      const uRecord = updated.find(u => u.id === userId || u.uid === userId || u.email === userId);
      if (uRecord) {
        saveSupabaseUser({
          uid: uRecord.id || uRecord.uid,
          id: uRecord.id || uRecord.uid,
          email: uRecord.email,
          displayName: uRecord.name || uRecord.displayName,
          phone: uRecord.phone || uRecord.whatsapp,
          role: uRecord.role || 'Student'
        }, {
          enrolledCourses: uRecord.enrolledCourses,
          totalSpent: uRecord.totalSpent
        }).catch(e => console.warn('[AdminPanel] Quick enroll Supabase sync note:', e));
      }
    }

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
    revokeCourseAccess(courseTitle, { bundles, courses }, targetUser || { id: userId, uid: userId });

    // Bi-directional sync: Update enrolledStudents list
    let nextEnrolled = enrolledStudents;
    if (targetUser) {
      const cleanPhone = (targetUser.phone || targetUser.whatsapp || '').replace(/[^0-9]/g, '');
      const cleanEmail = (targetUser.email || '').trim().toLowerCase();
      nextEnrolled = enrolledStudents.filter(st => {
        const stPhone = (st.phone || '').replace(/[^0-9]/g, '');
        const stEmail = (st.email || '').trim().toLowerCase();
        const phoneMatch = cleanPhone && stPhone && (cleanPhone === stPhone || (cleanPhone.length >= 10 && stPhone.slice(-10) === cleanPhone.slice(-10)));
        const emailMatch = cleanEmail && stEmail && cleanEmail === stEmail;
        if ((phoneMatch || emailMatch) && (st.courseName === courseTitle || (st.courseName || '').toLowerCase().includes(normT))) {
          return false;
        }
        return true;
      });
      setEnrolledStudents(nextEnrolled);
      try {
        localStorage.setItem('eh_enrolled_students', JSON.stringify(nextEnrolled));
      } catch (e) {}
    }

    persistAll({ users: updated, enrolledStudents: nextEnrolled });

    // Sync revoked courses to Supabase eduhunters_users
    if (isSupabaseConfigured && targetUser) {
      const uRecord = updated.find(u => u.id === userId || u.uid === userId || u.email === userId);
      if (uRecord) {
        saveSupabaseUser({
          uid: uRecord.id || uRecord.uid,
          id: uRecord.id || uRecord.uid,
          email: uRecord.email,
          displayName: uRecord.name || uRecord.displayName,
          phone: uRecord.phone || uRecord.whatsapp,
          role: uRecord.role || 'Student'
        }, {
          enrolledCourses: uRecord.enrolledCourses || [],
          overwriteEnrolledCourses: true
        }).catch(e => console.warn('[AdminPanel] Revoke course Supabase sync note:', e));
      }
    }

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
    const nowIso = new Date().toISOString();
    const item = {
      id: `TRX-${Date.now().toString().slice(-5)}`,
      studentName: newTrx.studentName || 'Manual Entry',
      studentPhone: newTrx.studentPhone || 'N/A',
      itemTitle: newTrx.itemTitle,
      type: newTrx.type,
      amount: amt,
      method: newTrx.method,
      trxId: newTrx.trxId || `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      date: nowIso.split('T')[0],
      createdAt: nowIso,
      isHistorical: false,
      status: 'Completed'
    };

    const updatedTrx = [item, ...(accounting.transactions || [])];
    const resetConfig = getAccountingResetConfig();
    const newRev = updatedTrx
      .filter(t => (t.status || '').toLowerCase() === 'completed' && !isHistoricalTx(t, resetConfig))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const newExp = updatedTrx
      .filter(t => (t.type || '').toUpperCase() === 'EXPENSE' && !isHistoricalTx(t, resetConfig))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const updatedAccounting = {
      ...accounting,
      totalRevenue: newRev,
      totalExpenses: newExp,
      netProfit: newRev - newExp,
      totalOrders: updatedTrx.length,
      transactions: updatedTrx
    };

    setAccounting(updatedAccounting);
    persistAll({ accounting: updatedAccounting });
    setNewTrx({ studentName: '', studentPhone: '', itemTitle: '', type: 'INCOME', amount: '', method: 'bKash', trxId: '' });
    setShowAddTrxModal(false);
    triggerToast('💰 Transaction added successfully!');
  };

  // Reset Financial Ledger Totals to ৳0 baseline (keeps all transaction history and student course access 100% intact)
  const handleResetAccountingTotals = () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে বর্তমান লেজার ইনকাম ও খরচের সামারি হিসাব ৳০ থেকে রিস্টার্ট করতে চান?\n\n(শিক্ষার্থীদের পূর্বের ট্রানজ্যাকশন তালিকা ও কোর্স এক্সেস ১০০% অপরিবর্তিত থাকবে)')) {
      return;
    }
    const currentNow = new Date().toISOString();
    const currentTxIds = (accounting?.transactions || []).map(t => t.id).filter(Boolean);
    let existingLegacy = [];
    try {
      existingLegacy = JSON.parse(localStorage.getItem('eh_accounting_legacy_ids') || '[]');
    } catch {}
    const allLegacyIds = Array.from(new Set([...existingLegacy, ...currentTxIds]));

    localStorage.setItem('eh_accounting_reset_at', currentNow);
    localStorage.setItem('eh_accounting_legacy_ids', JSON.stringify(allLegacyIds));

    const updatedAccounting = {
      ...accounting,
      resetAt: currentNow,
      legacyTxIds: allLegacyIds,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0
    };

    setAccounting(updatedAccounting);
    persistAll({ accounting: updatedAccounting });
    triggerToast('✅ লেজার সামারি সফলভাবে ৳০ থেকে রিস্টার্ট করা হয়েছে!');
  };

  // Approve Pending Enrollment Transaction (Permanently Persisted to Cloud, Overrides, & User Directory)
  const handleApproveTrx = (trxId) => {
    const targetTx = (accounting.transactions || []).find(t => t.id === trxId);
    if (!targetTx) return;

    const itemTitle = targetTx.itemTitle || '';
    const rawPhone = (targetTx.studentPhone || '').replace(/[^0-9]/g, '');
    const rawName = (targetTx.studentName || '').trim().toLowerCase();
    const rawEmail = (targetTx.studentEmail || '').trim().toLowerCase();

    // 1. Permanently save status override in localStorage so page refresh NEVER reverts to Pending
    saveStatusOverride([
      targetTx.id,
      targetTx.orderId,
      targetTx.trxId,
      targetTx.invoiceNumber,
      trxId
    ], 'Completed');

    // 2. Immediately update local transaction state
    const updated = (accounting.transactions || []).map(t => {
      const isMatch = t.id === trxId || 
                      (targetTx.orderId && t.orderId === targetTx.orderId) || 
                      (targetTx.trxId && targetTx.trxId !== 'PENDING' && t.trxId === targetTx.trxId);
      if (isMatch) return { ...t, status: 'Completed', isApproved: true };
      return t;
    });
    const newAcc = { ...accounting, transactions: updated };
    setAccounting(newAcc);

    // 3. Grant course access & resolve courses
    const matchedTargetUser = usersList.find(u => {
      const uPhone = (u.phone || u.whatsapp || '').replace(/[^0-9]/g, '');
      const uEmail = (u.email || '').trim().toLowerCase();
      const uName = (u.name || '').trim().toLowerCase();
      return isPhoneMatch(rawPhone, uPhone) ||
             (rawEmail && uEmail === rawEmail) ||
             (rawName && (uName === rawName || uName.includes(rawName)));
    });

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

    // 4. Update enrolled students list
    let extraStudentUpdates = enrolledStudents;
    const foundSt = enrolledStudents.find(st => {
      const stPhone = (st.phone || '').replace(/[^0-9]/g, '');
      const stEmail = (st.email || '').trim().toLowerCase();
      const stName = (st.name || '').trim().toLowerCase();
      return isPhoneMatch(rawPhone, stPhone) || (rawEmail && stEmail === rawEmail) || (rawName && stName === rawName);
    });
    if (foundSt) {
      extraStudentUpdates = enrolledStudents.map(st => 
        st.id === foundSt.id ? { ...st, status: 'Active', courseName: itemTitle, amount: Number(st.amount) || Number(targetTx.amount) || 0 } : st
      );
    } else {
      extraStudentUpdates = [{
        id: `st-${Date.now()}`,
        name: targetTx.studentName || 'Student',
        studentId: `EH-2026-${Math.floor(100 + Math.random() * 900)}`,
        batch: 'HSC 26',
        courseName: itemTitle,
        phone: targetTx.studentPhone || 'N/A',
        email: targetTx.studentEmail || `${(targetTx.studentName || 'student').toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        status: 'Active',
        joinedDate: 'Today',
        amount: Number(targetTx.amount) || 0
      }, ...enrolledStudents];
    }
    setEnrolledStudents(extraStudentUpdates);

    // 5. User Management: Ensure student is unified into usersList & placed at the very top
    let userFound = false;
    let savedUserRecord = null;
    const updatedUsersList = usersList.map(u => {
      const uPhone = (u.phone || u.whatsapp || '').replace(/[^0-9]/g, '');
      const uEmail = (u.email || '').trim().toLowerCase();
      const uName = (u.name || '').trim().toLowerCase();
      const matchPhone = isPhoneMatch(rawPhone, uPhone);
      const matchEmail = Boolean(rawEmail && uEmail && uEmail === rawEmail);
      const matchName = Boolean(rawName && (uName === rawName || uName.includes(rawName)));

      if (matchPhone || matchEmail || matchName) {
        userFound = true;
        const current = u.enrolledCourses || [];
        const nextCourses = Array.from(new Set([...current, ...coursesToGrant]));
        const updatedU = {
          ...u,
          status: 'Active',
          enrolledCourses: nextCourses,
          totalSpent: (Number(u.totalSpent) || 0) + (Number(targetTx.amount) || 0),
          lastActive: 'Active now'
        };
        savedUserRecord = updatedU;
        return updatedU;
      }
      return u;
    });

    let extraUserUpdates = updatedUsersList;
    if (!userFound && (rawPhone.length >= 6 || rawEmail || targetTx.studentName)) {
      const nowIso = new Date().toISOString();
      const newStudentUser = {
        id: `usr-${Date.now()}`,
        name: targetTx.studentName || 'Student',
        displayName: targetTx.studentName || 'Student',
        email: targetTx.studentEmail || `${(targetTx.studentName || 'student').toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(100 + Math.random() * 900)}@gmail.com`,
        phone: targetTx.studentPhone || '',
        whatsapp: targetTx.studentPhone || '',
        college: '',
        institution: '',
        role: 'Student',
        status: 'Active',
        batch: 'HSC 26',
        hscBatch: 'HSC 26',
        enrolledCourses: coursesToGrant,
        totalSpent: Number(targetTx.amount) || 0,
        joinedDate: 'Just now',
        lastActive: 'Active now',
        createdAt: nowIso,
        created_at: nowIso,
        device: 'Web Client',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetTx.studentName || 'student')}`
      };
      extraUserUpdates = [newStudentUser, ...updatedUsersList];
      savedUserRecord = newStudentUser;
    }
    setUsersList(extraUserUpdates);

    // CRITICAL: Always persist student user profile to Supabase eduhunters_users immediately!
    if (isSupabaseConfigured && savedUserRecord) {
      saveSupabaseUser({
        uid: savedUserRecord.id || savedUserRecord.uid,
        id: savedUserRecord.id || savedUserRecord.uid,
        email: savedUserRecord.email,
        displayName: savedUserRecord.name || savedUserRecord.displayName,
        phone: savedUserRecord.phone || savedUserRecord.whatsapp,
        role: savedUserRecord.role || 'Student'
      }, {
        enrolledCourses: savedUserRecord.enrolledCourses || coursesToGrant,
        totalSpent: savedUserRecord.totalSpent,
        isNewRegistration: !userFound
      }).catch(e => console.warn('[AdminPanel] Supabase user enrollment approval sync note:', e));
    }

    // 6. Direct Supabase order status update with multi-strategy resolution
    const resolvedOrderId = targetTx.orderId || targetTx.id;
    if (isSupabaseConfigured) {
      updateSupabaseOrderStatus(resolvedOrderId, { status: 'PAID', isApproved: true }, {
        id: targetTx.id,
        orderId: targetTx.orderId,
        trxId: targetTx.trxId,
        invoiceNumber: targetTx.invoiceNumber,
        phone: targetTx.studentPhone,
        email: targetTx.studentEmail,
        courseTitle: itemTitle,
        studentName: targetTx.studentName,
        amount: targetTx.amount,
        uid: savedUserRecord?.id || savedUserRecord?.uid
      }).catch(e => console.warn('[AdminPanel] Direct Supabase order approval note:', e));
    }

    // 7. Unlock in orderService & local caches
    approveOrder(targetTx.orderId || targetTx.id || targetTx.trxId, {
      courseTitle: itemTitle,
      studentPhone: targetTx.studentPhone,
      studentEmail: targetTx.studentEmail,
      studentName: targetTx.studentName,
      amount: targetTx.amount,
      userId: savedUserRecord?.id || savedUserRecord?.uid
    });

    persistAll({ 
      accounting: newAcc,
      enrolledStudents: extraStudentUpdates,
      users: extraUserUpdates
    });
    triggerToast('🎉 এনরোলমেন্ট অ্যাপ্রুভ করা হয়েছে এবং কোর্স স্থায়ীভাবে আনলক হয়েছে!');
  };

  // Revoke Approval for a Transaction (Permanently Persisted)
  const handleRevokeTrx = (trxId) => {
    const targetTx = (accounting.transactions || []).find(t => t.id === trxId);
    if (!targetTx) return;

    if (confirm(`Are you sure you want to revoke approval for "${targetTx.studentName}" and lock the course?`)) {
      // 1. Permanently save status override in localStorage
      saveStatusOverride([
        targetTx.id,
        targetTx.orderId,
        targetTx.trxId,
        targetTx.invoiceNumber,
        trxId
      ], 'Pending');

      const updated = (accounting.transactions || []).map(t => {
        if (t.id === trxId) return { ...t, status: 'Pending', isApproved: false };
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

      // Update usersList and sync revocation to Supabase
      let nextUsersList = usersList;
      if (matchedTargetUser && targetTx.itemTitle) {
        const normT = (targetTx.itemTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        nextUsersList = usersList.map(u => {
          if (u.id === matchedTargetUser.id || u.uid === matchedTargetUser.id || (matchedTargetUser.email && u.email === matchedTargetUser.email)) {
            const current = u.enrolledCourses || [];
            const filtered = current.filter(c => {
              const normC = (c || '').toLowerCase().replace(/[^a-z0-9]/g, '');
              return normC !== normT && !normC.includes(normT) && !normT.includes(normC);
            });
            return {
              ...u,
              enrolledCourses: filtered
            };
          }
          return u;
        });
        setUsersList(nextUsersList);

        if (isSupabaseConfigured) {
          const uRecord = nextUsersList.find(u => u.id === matchedTargetUser.id || u.uid === matchedTargetUser.id || (matchedTargetUser.email && u.email === matchedTargetUser.email));
          if (uRecord) {
            saveSupabaseUser({
              uid: uRecord.id || uRecord.uid,
              id: uRecord.id || uRecord.uid,
              email: uRecord.email,
              displayName: uRecord.name || uRecord.displayName,
              phone: uRecord.phone || uRecord.whatsapp,
              role: uRecord.role || 'Student'
            }, {
              enrolledCourses: uRecord.enrolledCourses || [],
              overwriteEnrolledCourses: true
            }).catch(() => {});
          }
        }
      }

      // Update enrolled students list
      const updatedStudents = enrolledStudents.map(st => {
        const stPhone = (st.phone || '').replace(/[^0-9]/g, '');
        const stEmail = (st.email || '').trim().toLowerCase();
        const isMatch = (rawPhone.length >= 6 && stPhone.includes(rawPhone)) || (rawEmail && stEmail === rawEmail);
        return isMatch ? { ...st, status: 'Pending' } : st;
      });
      setEnrolledStudents(updatedStudents);

      // Update Supabase order status
      const targetOrderId = targetTx.orderId || targetTx.id;
      if (isSupabaseConfigured && targetOrderId) {
        updateSupabaseOrderStatus(targetOrderId, { status: 'PENDING', isApproved: false }, {
          id: targetTx.id,
          orderId: targetTx.orderId,
          trxId: targetTx.trxId,
          phone: targetTx.studentPhone,
          email: targetTx.studentEmail,
          courseTitle: targetTx.itemTitle
        }).catch(() => {});
      }

      // Revoke in orderService
      revokeOrder(targetTx.orderId || targetTx.id || targetTx.trxId, {
        courseTitle: targetTx.itemTitle,
        studentPhone: targetTx.studentPhone,
        studentEmail: targetTx.studentEmail
      });

      persistAll({
        accounting: newAcc,
        enrolledStudents: updatedStudents,
        users: nextUsersList
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
        const isApprovedTx = Boolean(targetTx.isApproved) || (targetTx.status || '').toLowerCase() === 'completed';
        const toAdd = [
          trxId,
          targetTx.id,
          !isApprovedTx ? targetTx.orderId : null,
          rawId,
          !isApprovedTx ? rawOrderId : null,
          targetTx.invoiceNumber
        ].filter(Boolean);

        const newDelOrders = Array.from(new Set([...deletedOrders, ...toAdd]));
        const newDelTxs = Array.from(new Set([...deletedTxs, ...toAdd]));
        localStorage.setItem('eh_deleted_orders', JSON.stringify(newDelOrders));
        localStorage.setItem('eh_deleted_transactions', JSON.stringify(newDelTxs));
      } catch (e) {}

      // 2. Remove matching student from enrolledStudents state & localStorage immediately
      const nextStudents = enrolledStudents.filter(st => {
        // CRITICAL SAFETY GUARD: Active students must NEVER lose access when an admin deletes a transaction!
        if ((st.status || '').toLowerCase() === 'active') {
          return true;
        }
        const isMatch = st.id === trxId ||
                        st.id === targetTx.id ||
                        st.orderId === targetTx.orderId ||
                        (typeof st.id === 'string' && typeof targetTx.id === 'string' && st.id.replace(/^(TRX-|st-)/, '') === targetTx.id.replace(/^(TRX-|st-)/, '')) ||
                        (targetTx.orderId && st.id === `st-${targetTx.orderId}`);
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
            // CRITICAL SAFETY GUARD: Approved / Paid orders must NEVER be deleted when an accounting transaction is removed!
            const isApprovedOrder = Boolean(o.isApproved) || (o.status || '').toUpperCase() === 'PAID' || (o.status || '').toLowerCase() === 'completed';
            if (isApprovedOrder) return true;

            const rawOId = typeof o.id === 'string' ? o.id.replace(/^(TRX-|st-)/, '') : '';
            return o.id !== trxId && 
                   o.id !== targetTx.id && 
                   o.id !== targetTx.orderId && 
                   (!rawId || rawOId !== rawId) &&
                   o.invoiceNumber !== targetTx.invoiceNumber;
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
      // Save status override
      saveStatusOverride([
        st.id,
        st.orderId,
        st.trxId,
        resolvedOrderId,
        targetTx?.id
      ], 'Completed');

      // Grant course access & unlock
      if (st.courseName) {
        grantCourseAccess(st.courseName, { bundles, courses }, matchedUser);
      }
      if (resolvedOrderId || targetOrderId || st.trxId) {
        approveOrder(resolvedOrderId || targetOrderId || st.id, {
          courseTitle: st.courseName,
          studentPhone: st.phone,
          studentEmail: st.email,
          studentName: st.name,
          amount: st.amount
        });
        if (isSupabaseConfigured) {
          updateSupabaseOrderStatus(resolvedOrderId || targetOrderId || st.id, { status: 'PAID', isApproved: true }, {
            id: st.id,
            orderId: resolvedOrderId,
            trxId: st.trxId,
            phone: st.phone,
            email: st.email,
            courseTitle: st.courseName,
            studentName: st.name,
            amount: st.amount
          }).catch(() => {});
        }
      }
    } else {
      // Save status override
      saveStatusOverride([
        st.id,
        st.orderId,
        st.trxId,
        resolvedOrderId,
        targetTx?.id
      ], 'Pending');

      // Revoke course access & lock
      if (st.courseName) {
        revokeCourseAccess(st.courseName, { bundles, courses }, matchedUser);
      }
      if (resolvedOrderId || targetOrderId || st.trxId) {
        revokeOrder(resolvedOrderId || targetOrderId || st.id, {
          courseTitle: st.courseName,
          studentPhone: st.phone,
          studentEmail: st.email
        });
        if (isSupabaseConfigured) {
          updateSupabaseOrderStatus(resolvedOrderId || targetOrderId || st.id, { status: 'PENDING', isApproved: false }, {
            id: st.id,
            orderId: resolvedOrderId,
            trxId: st.trxId,
            phone: st.phone,
            email: st.email,
            courseTitle: st.courseName
          }).catch(() => {});
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

    // 5. Update usersList status so both tabs are 100% in sync
    let nextUsersList = usersList;
    if (matchedUser) {
      nextUsersList = usersList.map(u => {
        if (u.id === matchedUser.id) {
          const updatedU = { ...u, status: isNowActive ? 'Active' : 'Suspended' };
          if (isSupabaseConfigured) {
            saveSupabaseUser(updatedU).catch(() => {});
          }
          return updatedU;
        }
        return u;
      });
      setUsersList(nextUsersList);
      try {
        localStorage.setItem('eh_registered_users', JSON.stringify(nextUsersList));
      } catch (e) {}
    }

    // 6. Persist to cloud & local storage
    persistAll({
      accounting: updatedAccounting,
      enrolledStudents: nextStudents,
      users: nextUsersList
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

    // 8. Mirror deletion into user's enrolled courses in usersList
    let nextUsersList = usersList;
    if (matchedUser && st.courseName) {
      const normTargetCourse = (st.courseName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      nextUsersList = usersList.map(u => {
        if (u.id === matchedUser.id) {
          const filteredCourses = (u.enrolledCourses || []).filter(c => {
            const normC = (c || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return normC !== normTargetCourse && !normC.includes(normTargetCourse) && !normTargetCourse.includes(normC);
          });
          const updatedU = { ...u, enrolledCourses: filteredCourses };
          if (isSupabaseConfigured) {
            saveSupabaseUser(updatedU).catch(() => {});
          }
          return updatedU;
        }
        return u;
      });
      setUsersList(nextUsersList);
      try {
        localStorage.setItem('eh_registered_users', JSON.stringify(nextUsersList));
      } catch (e) {}
    }

    // 9. Persist all
    persistAll({
      accounting: updatedAccounting,
      enrolledStudents: nextStudents,
      users: nextUsersList
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
      saveStatusOverride([tx.id, tx.orderId, tx.trxId, tx.invoiceNumber], 'Completed');
      updatedTxs = updatedTxs.map(t => t.id === tx.id ? { ...t, status: 'Completed', isApproved: true } : t);
      totalAddedRev += (Number(tx.amount) || 0);

      const cleanPhone = (tx.studentPhone || tx.phone || '').trim();
      const rawPhone = cleanPhone.replace(/[^0-9]/g, '');
      const studentName = tx.studentName || tx.customer || 'New Student';
      const rawName = studentName.trim().toLowerCase();
      const studentEmail = (tx.studentEmail || tx.email || '').trim().toLowerCase();

      if (isSupabaseConfigured) {
        updateSupabaseOrderStatus(tx.orderId || tx.id, { status: 'PAID', isApproved: true }, {
          id: tx.id,
          orderId: tx.orderId,
          trxId: tx.trxId,
          phone: cleanPhone,
          email: studentEmail,
          courseTitle: tx.itemTitle || tx.category || 'Course Enrollment',
          studentName,
          amount: tx.amount
        }).catch(() => {});
      }

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
        let foundInBatch = false;
        updatedUsers = updatedUsers.map(u => {
          const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
          const uName = (u.name || '').trim().toLowerCase();
          const matchPhone = rawPhone.length >= 6 && uPhone.includes(rawPhone);
          const matchName = rawName && (uName === rawName || uName.includes(rawName));
          if (matchPhone || matchName) {
            foundInBatch = true;
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

        if (!foundInBatch) {
          const nowIso = new Date().toISOString();
          const newStudentUser = {
            id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: studentName,
            displayName: studentName,
            email: tx.studentEmail || tx.email || `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}${Math.floor(100 + Math.random() * 900)}@gmail.com`,
            phone: cleanPhone,
            whatsapp: cleanPhone,
            role: 'Student',
            status: 'Active',
            batch: 'HSC 26',
            hscBatch: 'HSC 26',
            enrolledCourses: Array.from(new Set([courseTitle, ...grantedCourses])),
            totalSpent: Number(tx.amount) || 0,
            joinedDate: 'Just now',
            lastActive: 'Active now',
            createdAt: nowIso,
            created_at: nowIso,
            device: 'Batch Order Sync',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(studentName)}`
          };
          updatedUsers = [newStudentUser, ...updatedUsers];
        }
      }

      saveStatusOverride([tx.id, tx.orderId, tx.trxId, tx.invoiceNumber], 'Completed');

      if (isSupabaseConfigured) {
        updateSupabaseOrderStatus(tx.orderId || tx.id, {
          status: 'PAID',
          isApproved: true
        }, {
          trxId: tx.trxId,
          phone: cleanPhone,
          email: tx.studentEmail || tx.email,
          courseTitle,
          studentName,
          amount: tx.amount
        }).catch(err => console.warn('[AdminPanel] Batch Supabase approve sync note:', err));
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

    // Save status override
    saveStatusOverride([tx.id, tx.orderId, tx.trxId, tx.invoiceNumber], 'Completed');

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
    let userFound = false;
    let savedUserRecord = null;
    let updatedUsers = usersList.map(u => {
      const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
      const uName = (u.name || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const matchPhone = rawPhone.length >= 6 && uPhone.includes(rawPhone);
      const matchEmail = studentEmail && uEmail === studentEmail;
      const matchName = rawName && (uName === rawName || uName.includes(rawName));
      if (matchPhone || matchEmail || matchName) {
        userFound = true;
        const current = u.enrolledCourses || [];
        const updatedU = {
          ...u,
          status: 'Active',
          enrolledCourses: Array.from(new Set([...current, courseTitle, ...grantedCourses])),
          totalSpent: (Number(u.totalSpent) || 0) + addedAmt,
          lastActive: 'Active now'
        };
        savedUserRecord = updatedU;
        return updatedU;
      }
      return u;
    });

    if (!userFound && (rawPhone.length >= 6 || studentEmail || studentName)) {
      const nowIso = new Date().toISOString();
      const newStudentUser = {
        id: `usr-${Date.now()}`,
        name: studentName,
        displayName: studentName,
        email: studentEmail || `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}${Math.floor(100 + Math.random() * 900)}@gmail.com`,
        phone: cleanPhone,
        whatsapp: cleanPhone,
        role: 'Student',
        status: 'Active',
        batch: 'HSC 26',
        hscBatch: 'HSC 26',
        enrolledCourses: Array.from(new Set([courseTitle, ...grantedCourses])),
        totalSpent: addedAmt,
        joinedDate: 'Just now',
        lastActive: 'Active now',
        createdAt: nowIso,
        created_at: nowIso,
        device: 'Web Client',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(studentName)}`
      };
      updatedUsers = [newStudentUser, ...updatedUsers];
      savedUserRecord = newStudentUser;
    }
    setUsersList(updatedUsers);

    // CRITICAL: Always persist student user profile to Supabase eduhunters_users immediately!
    if (isSupabaseConfigured && savedUserRecord) {
      saveSupabaseUser({
        uid: savedUserRecord.id || savedUserRecord.uid,
        id: savedUserRecord.id || savedUserRecord.uid,
        email: savedUserRecord.email,
        displayName: savedUserRecord.name || savedUserRecord.displayName,
        phone: savedUserRecord.phone || savedUserRecord.whatsapp,
        role: savedUserRecord.role || 'Student'
      }, {
        enrolledCourses: savedUserRecord.enrolledCourses || Array.from(new Set([courseTitle, ...grantedCourses])),
        totalSpent: savedUserRecord.totalSpent,
        isNewRegistration: !userFound
      }).catch(e => console.warn('[AdminPanel] Supabase user enrollment approval sync note:', e));
    }

    // Direct Supabase order update
    if (isSupabaseConfigured) {
      updateSupabaseOrderStatus(tx.orderId || tx.id, { status: 'PAID', isApproved: true }, {
        id: tx.id,
        orderId: tx.orderId,
        trxId: tx.trxId,
        phone: cleanPhone,
        email: tx.studentEmail || tx.email,
        courseTitle,
        studentName,
        amount: tx.amount
      }).catch(() => {});
    }

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

    // Save status override
    saveStatusOverride([tx.id, tx.orderId, tx.trxId, tx.invoiceNumber], newStatus);

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

    if (isSupabaseConfigured && (tx.orderId || tx.id || tx.trxId)) {
      updateSupabaseOrderStatus(tx.orderId || tx.id, newStatus.toUpperCase(), {
        id: tx.id,
        orderId: tx.orderId,
        trxId: tx.trxId,
        phone: tx.studentPhone,
        email: tx.studentEmail,
        courseTitle: tx.itemTitle
      }).catch(() => {});
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

  // Move Instructor in Instructors list
  const handleMoveInstructor = (index, direction) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= instructors.length) return;
    const nextList = [...instructors];
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    setInstructors(nextList);
    persistAll({ instructors: nextList });
    triggerToast('Instructor order updated!');
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
    let list = deduplicateUsers(usersList);
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
      // Default: Newest users ALWAYS on top with 100% accuracy
      list.sort((a, b) => {
        const timeB = getUserTimestamp(b);
        const timeA = getUserTimestamp(a);
        if (timeB !== timeA) return timeB - timeA;
        return (a.name || '').localeCompare(b.name || '');
      });
    }

    return list;
  }, [usersList, userRoleFilter, userStatusFilter, userBatchFilter, deferredUserQuery, userSortBy, courses, bundles]);

  const userMetrics = useMemo(() => {
    const unique = deduplicateUsers(usersList);
    const total = unique.length;
    const activeStudents = unique.filter(u => u.role === 'Student' && u.status === 'Active').length;
    const staffCount = unique.filter(u => ['Admin', 'Instructor', 'Moderator'].includes(u.role)).length;
    const suspendedCount = unique.filter(u => u.status === 'Suspended').length;
    return { total, activeStudents, staffCount, suspendedCount };
  }, [usersList]);

  // Live Dashboard Analytics (Users Joined Today, Enrolled Today, Revenue Breakdown: Today, 7 Days, 30 Days, All-Time)
  const dashboardAnalytics = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const uniqueUsers = deduplicateUsers(usersList);
    const joinedTodayCount = uniqueUsers.filter(u => {
      const ts = getUserTimestamp(u);
      return ts >= todayStart;
    }).length;

    const txs = deduplicateTransactions(accounting?.transactions || []);
    const completedTxs = txs.filter(t => {
      const s = (t.status || '').toLowerCase();
      return (s === 'completed' || s === 'paid' || Boolean(t.isApproved)) && (t.type || '').toUpperCase() !== 'EXPENSE';
    });

    let enrollmentsTodayCount = 0;
    let todayRevenue = 0;
    let revenue7Days = 0;
    let revenue30Days = 0;
    let allTimeRevenue = 0;

    completedTxs.forEach(t => {
      const amt = Number(t.amount) || 0;
      allTimeRevenue += amt;
      const tTime = new Date(t.createdAt || t.date || 0).getTime();
      if (!isNaN(tTime) && tTime > 0) {
        if (tTime >= todayStart) {
          enrollmentsTodayCount += 1;
          todayRevenue += amt;
        }
        if (tTime >= sevenDaysAgo) {
          revenue7Days += amt;
        }
        if (tTime >= thirtyDaysAgo) {
          revenue30Days += amt;
        }
      }
    });

    return {
      joinedTodayCount,
      enrollmentsTodayCount,
      todayRevenue,
      revenue7Days,
      revenue30Days,
      allTimeRevenue,
      totalActiveStudents: uniqueUsers.filter(u => u.role === 'Student' && u.status === 'Active').length
    };
  }, [usersList, accounting?.transactions]);

  // Memoized Pending Requests (Chronologically Sorted - Newest First)
  const pendingRequests = useMemo(() => {
    const txs = deduplicateTransactions(accounting?.transactions || []);
    return txs.filter(tx => {
      const s = (tx.status || '').toLowerCase();
      return s === 'pending' || (s !== 'completed' && s !== 'paid' && s !== 'rejected');
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
    const txs = deduplicateTransactions(accounting?.transactions || []);
    const query = deferredSearchTrx.trim().toLowerCase();

    const filtered = txs.filter(tx => {
      const st = (tx.status || '').toLowerCase();
      const isPending = st === 'pending' || (st !== 'completed' && st !== 'paid' && st !== 'rejected');

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
    const txs = deduplicateTransactions(accounting?.transactions || []);
    const q = deferredVerifQuery.trim().toLowerCase();
    const qClean = q.replace(/[^a-zA-Z0-9]/g, '');

    return txs.filter(tx => {
      if ((tx.type || '').toUpperCase() === 'EXPENSE') return false;

      const st = (tx.status || '').toLowerCase();
      const isPending = st === 'pending' || (st !== 'completed' && st !== 'paid' && st !== 'rejected');
      const isCompleted = st === 'completed' || st === 'paid' || Boolean(tx.isApproved);
      const isRejected = st === 'rejected';

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
    const safeCourses = Array.isArray(courses) ? courses : [];
    let list = safeCourses.map((course, originalIdx) => ({ course, originalIdx }));
    
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


  // Memoized Financial Totals (Reflects verified, real transactions starting from ৳0 baseline)
  const accountingTotals = useMemo(() => {
    const txs = accounting?.transactions || [];
    const resetConfig = getAccountingResetConfig();
    let rev = 0;
    let exp = 0;
    txs.forEach(t => {
      if (!t || isHistoricalTx(t, resetConfig)) return;
      const amt = Number(t.amount) || 0;
      const isCompleted = (t.status || '').toLowerCase() === 'completed';
      const isExpense = (t.type || '').toUpperCase() === 'EXPENSE';
      if (isExpense && (isCompleted || !t.status || t.status === 'Completed')) {
        exp += amt;
      } else if (!isExpense && isCompleted) {
        rev += amt;
      }
    });
    return {
      totalRevenue: rev,
      totalExpenses: exp,
      netProfit: rev - exp
    };
  }, [accounting?.transactions, accounting?.resetAt, accounting?.legacyTxIds]);

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

        <React.Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Loading Bundle Studio...</div>}><BundleStudioPage
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
        /></React.Suspense>
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

        <React.Suspense fallback={<div className="p-12 text-center text-slate-500 font-bold">Loading Course Studio...</div>}><CourseStudioPage
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
            persistAll({ courses: next });
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
        /></React.Suspense>

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

  const handleSaveStudentModal = (e) => {
    e.preventDefault();
    if (!newStudentData.name.trim() || !newStudentData.phone.trim()) {
      triggerToast('⚠️ Please enter student name and phone number');
      return;
    }

    if (editingStudentId) {
      const result = atomicUpdateStudent({
        studentId: editingStudentId,
        studentData: newStudentData,
        courses,
        bundles,
        enrolledStudents,
        usersList
      });
      setEnrolledStudents(result.enrolledStudents);
      setUsersList(result.usersList);
      persistAll({ enrolledStudents: result.enrolledStudents, users: result.usersList });
      triggerToast(`✅ Student info updated & synced for ${newStudentData.name}!`);
    } else {
      const result = atomicEnrollNewStudent({
        studentData: newStudentData,
        courses,
        bundles,
        enrolledStudents,
        usersList,
        accounting
      });
      setEnrolledStudents(result.enrolledStudents);
      setUsersList(result.usersList);
      persistAll({ enrolledStudents: result.enrolledStudents, users: result.usersList });
      triggerToast(`🎉 Student "${result.newStudent.name}" permanently enrolled & synced!`);
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
  };

  const handleSaveRoutineModal = (e) => {
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
  };

  const handleSaveNoticeModal = (e) => {
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
            <AdminOverviewTab
              setActiveTab={setActiveTab}
              dashboardAnalytics={dashboardAnalytics}
              dashboardMainTab={dashboardMainTab}
              setDashboardMainTab={setDashboardMainTab}
              pendingCount={pendingCount}
              accountingTotals={accountingTotals}
              accounting={accounting}
              handleVerifyAllPending={handleVerifyAllPending}
              courses={courses}
              setEditingStudentId={setEditingStudentId}
              setNewStudentData={setNewStudentData}
              setShowAddStudentModal={setShowAddStudentModal}
              verificationSearchQuery={verificationSearchQuery}
              setVerificationSearchQuery={setVerificationSearchQuery}
              verificationFilter={verificationFilter}
              setVerificationFilter={setVerificationFilter}
              verificationList={verificationList}
              editingTrxAmountId={editingTrxAmountId}
              setEditingTrxAmountId={setEditingTrxAmountId}
              editingTrxAmountVal={editingTrxAmountVal}
              setEditingTrxAmountVal={setEditingTrxAmountVal}
              handleSaveTrxAmount={handleSaveTrxAmount}
              handleCopyText={handleCopyText}
              copiedTrxId={copiedTrxId}
              copiedPhone={copiedPhone}
              handleApproveAndEnrollStudent={handleApproveAndEnrollStudent}
              handleRejectTrx={handleRejectTrx}
              setSelectedTxDetails={setSelectedTxDetails}
              handleUpdateTrxStatus={handleUpdateTrxStatus}
              studentSearchQuery={studentSearchQuery}
              setStudentSearchQuery={setStudentSearchQuery}
              studentBatchFilter={studentBatchFilter}
              setStudentBatchFilter={setStudentBatchFilter}
              handleManualRefreshUsers={handleManualRefreshUsers}
              isRefreshingUsers={isRefreshingUsers}
              filteredStudents={filteredStudents}
              enrolledStudents={enrolledStudents}
              handleToggleStudentStatus={handleToggleStudentStatus}
              handleDeleteStudent={handleDeleteStudent}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 2: ACCOUNTING & LEDGER */}
          {/* ========================================================= */}
          {activeTab === 'accounting' && (
            <AdminAccountingTab
              accountingTotals={accountingTotals}
              accounting={accounting}
              filteredTransactions={filteredTransactions}
              pendingCount={pendingCount}
              searchTrx={searchTrx}
              setSearchTrx={setSearchTrx}
              trxFilter={trxFilter}
              setTrxFilter={setTrxFilter}
              handleResetAccountingTotals={handleResetAccountingTotals}
              setShowAddTrxModal={setShowAddTrxModal}
              handleOpenStudentFromTrx={handleOpenStudentFromTrx}
              handleSaveTrxAmount={handleSaveTrxAmount}
              handleApproveTrx={handleApproveTrx}
              handleRevokeTrx={handleRevokeTrx}
              handleDeleteTrx={handleDeleteTrx}
              handleCopyText={handleCopyText}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 3: REGISTERED USERS & STUDENTS */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <AdminUsersTab
              usersList={usersList}
              filteredUsers={filteredUsers}
              userMetrics={userMetrics}
              userSearchQuery={userSearchQuery}
              setUserSearchQuery={setUserSearchQuery}
              userRoleFilter={userRoleFilter}
              setUserRoleFilter={setUserRoleFilter}
              userStatusFilter={userStatusFilter}
              setUserStatusFilter={setUserStatusFilter}
              userBatchFilter={userBatchFilter}
              setUserBatchFilter={setUserBatchFilter}
              userSortBy={userSortBy}
              setUserSortBy={setUserSortBy}
              courses={courses}
              bundles={bundles}
              isRefreshingUsers={isRefreshingUsers}
              handleManualRefreshUsers={handleManualRefreshUsers}
              handleExportUsersCSV={handleExportUsersCSV}
              handleCopyText={handleCopyText}
              handleToggleUserStatus={handleToggleUserStatus}
              handleOpenEditUser={handleOpenEditUser}
              handleDeleteUser={handleDeleteUser}
              setSelectedUserDetails={setSelectedUserDetails}
              setUserTabInsideModal={setUserTabInsideModal}
              setQuickEnrollUser={setQuickEnrollUser}
              setSelectedCourseToEnroll={setSelectedCourseToEnroll}
              setShowAddUserModal={setShowAddUserModal}
              setEditingUserId={setEditingUserId}
              setUserForm={setUserForm}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 4: HERO BANNER SLIDES */}
          {/* ========================================================= */}
          {activeTab === 'slides' && (
            <AdminSlidesTab
              heroSlides={heroSlides}
              setHeroSlides={setHeroSlides}
              persistAll={persistAll}
              triggerToast={triggerToast}
              handleDeviceFileUpload={handleDeviceFileUpload}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 5: COUNTERS & NOTICE */}
          {/* ========================================================= */}
          {activeTab === 'stats' && (
            <AdminStatsTab
              announcement={announcement}
              setAnnouncement={setAnnouncement}
              homeStats={homeStats}
              setHomeStats={setHomeStats}
              persistAll={persistAll}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 6: RESULTS, LEADERBOARD & EXAMS */}
          {/* ========================================================= */}
          {activeTab === 'results' && (
            <AdminResultsTab
              courses={courses}
              data={data}
              activeTab={activeTab}
              triggerToast={triggerToast}
              examSubmissions={examSubmissions}
              setExamSubmissions={setExamSubmissions}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 7: COURSES */}
          {/* ========================================================= */}
          {activeTab === 'courses' && (
            <AdminCoursesTab
              courses={courses}
              setCourses={setCourses}
              categories={categories}
              adminCourseCategoryFilter={adminCourseCategoryFilter}
              setAdminCourseCategoryFilter={setAdminCourseCategoryFilter}
              courseSearchQuery={courseSearchQuery}
              setCourseSearchQuery={setCourseSearchQuery}
              courseViewMode={courseViewMode}
              setCourseViewMode={setCourseViewMode}
              setShowManageCategoriesModal={setShowManageCategoriesModal}
              setShowAddCourseModal={setShowAddCourseModal}
              openGalleryModal={openGalleryModal}
              openCurriculumStudio={openCurriculumStudio}
              handleToggleCourseActive={handleToggleCourseActive}
              persistAll={persistAll}
              triggerToast={triggerToast}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 8: COURSE BUNDLES & COMBOS */}
          {/* ========================================================= */}
          {activeTab === 'bundles' && (
            <AdminBundlesTab
              bundles={bundles}
              courses={courses}
              handleOpenAddBundle={handleOpenAddBundle}
              handleOpenEditBundle={handleOpenEditBundle}
              handleDuplicateBundle={handleDuplicateBundle}
              handleDeleteBundle={handleDeleteBundle}
              handleToggleBundleStatus={handleToggleBundleStatus}
              bundleSearchQuery={bundleSearchQuery}
              setBundleSearchQuery={setBundleSearchQuery}
              bundleStatusFilter={bundleStatusFilter}
              setBundleStatusFilter={setBundleStatusFilter}
              bundleViewMode={bundleViewMode}
              setBundleViewMode={setBundleViewMode}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 9: INSTRUCTORS & FACULTY */}
          {/* ========================================================= */}
          {activeTab === 'instructors' && (
            <AdminInstructorsTab
              instructors={instructors}
              setInstructors={setInstructors}
              persistAll={persistAll}
              triggerToast={triggerToast}
              handleDeviceFileUpload={handleDeviceFileUpload}
              openGalleryModal={openGalleryModal}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 10: FREE VIDEO CLASSES */}
          {/* ========================================================= */}
          {activeTab === 'videos' && (
            <AdminVideosTab
              freeVideos={freeVideos}
              setFreeVideos={setFreeVideos}
              persistAll={persistAll}
              triggerToast={triggerToast}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 11: BOOK & PDF STORE */}
          {/* ========================================================= */}
          {activeTab === 'store' && (
            <AdminStoreTab
              storeProducts={storeProducts}
              setStoreProducts={setStoreProducts}
              persistAll={persistAll}
              triggerToast={triggerToast}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 12: BRAND & SETTINGS */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <AdminSettingsTab
              siteSettings={siteSettings}
              setSiteSettings={setSiteSettings}
              handleUpdateSiteSetting={handleUpdateSiteSetting}
              sectionTexts={sectionTexts}
              persistAll={persistAll}
              triggerToast={triggerToast}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 13: SECTION TEXTS */}
          {/* ========================================================= */}
          {activeTab === 'sectionTexts' && (
            <AdminSectionTextsTab
              sectionTexts={sectionTexts}
              setSectionTexts={setSectionTexts}
              persistAll={persistAll}
              setHasUnsavedChanges={setHasUnsavedChanges}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 14: WHY CHOOSE US */}
          {/* ========================================================= */}
          {activeTab === 'whyChoose' && (
            <AdminWhyChooseTab
              whyChooseUs={whyChooseUs}
              setWhyChooseUs={setWhyChooseUs}
              persistAll={persistAll}
              triggerToast={triggerToast}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 15: LEGAL & POLICIES */}
          {/* ========================================================= */}
          {activeTab === 'policies' && (
            <AdminPoliciesTab
              termsAndConditions={termsAndConditions}
              setTermsAndConditions={setTermsAndConditions}
              refundPolicy={refundPolicy}
              setRefundPolicy={setRefundPolicy}
              privacyPolicy={privacyPolicy}
              setPrivacyPolicy={setPrivacyPolicy}
              persistAll={persistAll}
              triggerToast={triggerToast}
            />
          )}
        </main>
      </div>

{/* ========================================================= */}
      {/* MODAL ARCHITECTURE: EXTRACTED STANDALONE MODALS */}
      {/* ========================================================= */}
      <AddTransactionModal
        isOpen={showAddTrxModal}
        onClose={() => setShowAddTrxModal(false)}
        newTrx={newTrx}
        setNewTrx={setNewTrx}
        onSubmit={handleAddTransaction}
      />

      <AddCourseModal
        isOpen={showAddCourseModal}
        onClose={() => setShowAddCourseModal(false)}
        newCourse={newCourse}
        setNewCourse={setNewCourse}
        onSubmit={handleAddCourse}
        categories={categories}
        openGalleryModal={openGalleryModal}
        handleDeviceFileUpload={handleDeviceFileUpload}
      />

      <StudentAddEditModal
        isOpen={showAddStudentModal}
        onClose={() => {
          setShowAddStudentModal(false);
          setEditingStudentId(null);
        }}
        editingStudentId={editingStudentId}
        newStudentData={newStudentData}
        setNewStudentData={setNewStudentData}
        onSubmit={handleSaveStudentModal}
        courses={courses}
        data={data}
      />

      <AddRoutineModal
        isOpen={showAddRoutineModal}
        onClose={() => setShowAddRoutineModal(false)}
        newRoutineData={newRoutineData}
        setNewRoutineData={setNewRoutineData}
        onSubmit={handleSaveRoutineModal}
      />

      <BroadcastNoticeModal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        noticeTargetBatch={noticeTargetBatch}
        setNoticeTargetBatch={setNoticeTargetBatch}
        noticeText={noticeText}
        setNoticeText={setNoticeText}
        onSubmit={handleSaveNoticeModal}
      />

      <TransactionDetailsModal
        selectedTxDetails={selectedTxDetails}
        onClose={() => setSelectedTxDetails(null)}
        handleCopyText={handleCopyText}
        copiedTrxId={copiedTrxId}
        editingTrxAmountId={editingTrxAmountId}
        setEditingTrxAmountId={setEditingTrxAmountId}
        editingTrxAmountVal={editingTrxAmountVal}
        setEditingTrxAmountVal={setEditingTrxAmountVal}
        handleSaveTrxAmount={handleSaveTrxAmount}
        handleRejectTrx={handleRejectTrx}
        handleApproveAndEnrollStudent={handleApproveAndEnrollStudent}
      />

      <EditCourseModal
        editingCourseData={editingCourseData}
        setEditingCourseData={setEditingCourseData}
        onClose={() => setEditingCourseData(null)}
        onSubmit={handleSaveCourseDetailsModal}
        categories={categories}
        openGalleryModal={openGalleryModal}
      />

      <ManageCategoriesModal
        isOpen={showManageCategoriesModal}
        onClose={() => setShowManageCategoriesModal(false)}
        categories={categories}
        courses={courses}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        handleAddCategory={handleAddCategory}
        handleDeleteCategory={handleDeleteCategory}
      />

      <UserDetailsModal
        selectedUserDetails={selectedUserDetails}
        setSelectedUserDetails={setSelectedUserDetails}
        onClose={() => setSelectedUserDetails(null)}
        userTabInsideModal={userTabInsideModal}
        setUserTabInsideModal={setUserTabInsideModal}
        handleCopyText={handleCopyText}
        handleChangeUserRole={handleChangeUserRole}
        handleToggleUserStatus={handleToggleUserStatus}
        courses={courses}
        bundles={bundles}
        selectedCourseToEnroll={selectedCourseToEnroll}
        setSelectedCourseToEnroll={setSelectedCourseToEnroll}
        handleAssignCourseToUser={handleAssignCourseToUser}
        handleRevokeCourseFromUser={handleRevokeCourseFromUser}
        setQuickEnrollUser={setQuickEnrollUser}
      />

      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        editingUserId={editingUserId}
        userForm={userForm}
        setUserForm={setUserForm}
        onSubmit={handleSaveUser}
      />

      <QuickEnrollModal
        quickEnrollUser={quickEnrollUser}
        onClose={() => {
          setQuickEnrollUser(null);
          setSelectedCourseToEnroll('');
        }}
        courses={courses}
        bundles={bundles}
        selectedCourseToEnroll={selectedCourseToEnroll}
        setSelectedCourseToEnroll={setSelectedCourseToEnroll}
        handleAssignCourseToUser={handleAssignCourseToUser}
        handleRevokeCourseFromUser={handleRevokeCourseFromUser}
      />

      {renderGalleryModal()}
    </div>
  );
}
