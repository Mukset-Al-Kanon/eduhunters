import React, { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
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
  Copy
} from 'lucide-react';
import { initialData, isZenithCopiedCourse } from '../data/mockData';
import { masterEnglishCourseData } from '../data/masterEnglishCourseData';
import CourseStudioPage from './CourseStudioPage';
import BundleStudioPage from './BundleStudioPage';
import { EXAM_CATEGORIES_METADATA } from '../data/examCategoriesData';
import { grantCourseAccess } from '../utils/enrollmentService';

export default function AdminPanel({ data, onUpdateData, onResetData, onExitAdmin }) {
  // Navigation Tabs: overview, accounting, slides, stats, courses, instructors, videos, store, settings
  const [activeTab, setActiveTab] = useState('overview');

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

  const [homeStats, setHomeStats] = useState(() => 
    Array.isArray(data?.homeStats) 
      ? data.homeStats 
      : initialData.homeStats
  );

  const [courses, setCourses] = useState(() => {
    const raw = Array.isArray(data?.courses) 
      ? data.courses 
      : initialData.courses;
    return raw.filter(c => !isZenithCopiedCourse(c));
  });

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
      : initialData.instructors
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

  const [accounting, setAccounting] = useState(() => ({
    ...initialData.accounting,
    ...(data?.accounting || {}),
    transactions: (Array.isArray(data?.accounting?.transactions) && data.accounting.transactions.length > 0)
      ? data.accounting.transactions
      : initialData.accounting.transactions
  }));

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
        id: 'usr-1',
        name: 'Mathew Anderson',
        email: 'admin@eduhunters.com',
        phone: '01700-112233',
        role: 'Admin',
        status: 'Active',
        batch: 'System Administration',
        enrolledCourses: ['All Courses (Super Admin Pass)'],
        totalSpent: 0,
        joinedDate: '01 Jan 2026',
        lastActive: 'Active now',
        device: 'Windows 11 • Chrome 124',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr-2',
        name: 'Dr. Sanjid Rayhan',
        email: 'sanjid.rayhan@eduhunters.com',
        phone: '01711-223344',
        role: 'Instructor',
        status: 'Active',
        batch: 'Medical Faculty',
        enrolledCourses: ['Biology Extra Info + Exam Batch', 'Medical Master Bundle'],
        totalSpent: 0,
        joinedDate: '15 Jan 2026',
        lastActive: '15 mins ago',
        device: 'MacBook Pro • Safari',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr-3',
        name: 'Kanon Ahmed',
        email: 'kanon.ahmed@eduhunters.com',
        phone: '01811-998877',
        role: 'Moderator',
        status: 'Active',
        batch: 'Student Support & Ops',
        enrolledCourses: ['Staff Access Pass'],
        totalSpent: 0,
        joinedDate: '01 Feb 2026',
        lastActive: '1 hour ago',
        device: 'Android 14 • Chrome Mobile',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr-4',
        name: 'Tanvir Hasan',
        email: 'tanvir.hsc26@gmail.com',
        phone: '01712-345678',
        role: 'Student',
        status: 'Active',
        batch: 'HSC 26',
        enrolledCourses: ['Mastering Text Book Combo', 'SureShot SecondTimer Carnival'],
        totalSpent: 4500,
        joinedDate: '28 Sep 2026',
        lastActive: '10 mins ago',
        device: 'Windows 10 • Chrome 122',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr-5',
        name: 'Afroza Sultana',
        email: 'afroza.med@gmail.com',
        phone: '01987-654321',
        role: 'Student',
        status: 'Active',
        batch: 'Medical 25',
        enrolledCourses: ['Biology Extra Info + Exam Batch'],
        totalSpent: 2999,
        joinedDate: '29 Sep 2026',
        lastActive: '30 mins ago',
        device: 'iPhone 15 • Safari Mobile',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr-6',
        name: 'Rakibul Islam',
        email: 'rakibul.hsc28@gmail.com',
        phone: '01823-998877',
        role: 'Student',
        status: 'Active',
        batch: 'HSC 28',
        enrolledCourses: ['Medical All Batches Bundle', 'HSC Physics Vector Mega Test'],
        totalSpent: 5200,
        joinedDate: '29 Sep 2026',
        lastActive: '2 hours ago',
        device: 'Windows 11 • Edge 123',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr-7',
        name: 'Sadia Tasnim',
        email: 'sadia.tasnim@gmail.com',
        phone: '01633-112233',
        role: 'Student',
        status: 'Pending',
        batch: 'Engineering',
        enrolledCourses: ['Ketab Sir Higher Math MCQ Solve'],
        totalSpent: 1999,
        joinedDate: '30 Sep 2026',
        lastActive: '5 hours ago',
        device: 'Android 13 • Chrome Mobile',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
      },
      {
        id: 'usr-8',
        name: 'Shahriar Kabir',
        email: 'shahriar.kabir@gmail.com',
        phone: '01300-778899',
        role: 'Student',
        status: 'Suspended',
        batch: 'HSC 26',
        enrolledCourses: ['Chemistry 1st Paper Dagano Line'],
        totalSpent: 1500,
        joinedDate: '25 Sep 2026',
        lastActive: '3 days ago',
        device: 'Multiple Devices Flagged (3 IPs)',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80'
      }
    ];

    if (Array.isArray(data?.users) && data.users.length > 0) {
      return data.users;
    }

    try {
      const registered = JSON.parse(localStorage.getItem('eh_registered_users') || '[]');
      if (Array.isArray(registered) && registered.length > 0) {
        const mapped = registered.map((u, i) => ({
          id: u.uid || `usr-reg-${i}`,
          name: u.displayName || u.email.split('@')[0],
          email: u.email,
          phone: u.phone || '01700-000000',
          role: u.role === 'admin' ? 'Admin' : 'Student',
          status: 'Active',
          batch: 'General Learner',
          enrolledCourses: [],
          totalSpent: 0,
          joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
          lastActive: 'Recently',
          device: 'Web Client',
          avatar: u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email)}`
        }));
        const existingEmails = new Set(defaultSeed.map(u => u.email.toLowerCase()));
        const uniqueRegistered = mapped.filter(u => !existingEmails.has(u.email.toLowerCase()));
        return [...defaultSeed, ...uniqueRegistered];
      }
    } catch (e) {}

    return defaultSeed;
  });

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userSortBy, setUserSortBy] = useState('newest');
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Student',
    status: 'Active',
    batch: 'HSC 26',
    password: ''
  });
  const [quickEnrollUser, setQuickEnrollUser] = useState(null);
  const [selectedCourseToEnroll, setSelectedCourseToEnroll] = useState('');
  const [userTabInsideModal, setUserTabInsideModal] = useState('profile'); // 'profile' | 'courses' | 'transactions'

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
    if (data.accounting) setAccounting(data.accounting);
    if (data.termsAndConditions) setTermsAndConditions(data.termsAndConditions);
    if (data.refundPolicy) setRefundPolicy(data.refundPolicy);
    if (data.privacyPolicy) setPrivacyPolicy(data.privacyPolicy);
    if (Array.isArray(data.users)) setUsersList(data.users);
  }, [data]);

  // Edu Hunters Real Enrolled Students State
  const [enrolledStudents, setEnrolledStudents] = useState([
    {
      id: 'st-101',
      name: 'Tanvir Hasan',
      studentId: 'EH-2026-084',
      batch: 'HSC 26',
      courseName: 'Mastering Text Book Combo',
      phone: '01712-345678',
      email: 'tanvir.hsc26@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
      status: 'Active',
      joinedDate: '28 Sep 2026'
    },
    {
      id: 'st-102',
      name: 'Afroza Sultana',
      studentId: 'EH-2026-092',
      batch: 'Medical 25',
      courseName: 'Biology Extra Info + Exam Batch',
      phone: '01987-654321',
      email: 'afroza.med@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      status: 'Active',
      joinedDate: '29 Sep 2026'
    },
    {
      id: 'st-103',
      name: 'Rakibul Islam',
      studentId: 'EH-2026-115',
      batch: 'HSC 28',
      courseName: 'Medical All Batches Bundle',
      phone: '01823-998877',
      email: 'rakibul.hsc28@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      status: 'Active',
      joinedDate: '29 Sep 2026'
    },
    {
      id: 'st-104',
      name: 'Sadia Tasnim',
      studentId: 'EH-2026-140',
      batch: 'Engineering',
      courseName: 'Ketab Sir Higher Math MCQ Solve',
      phone: '01633-112233',
      email: 'sadia.tasnim@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      status: 'Pending',
      joinedDate: '30 Sep 2026'
    },
    {
      id: 'st-105',
      name: 'Abir Mahmud',
      studentId: 'EH-2026-155',
      batch: 'HSC 27',
      courseName: 'Mastering Text Book Series Combo',
      phone: '01511-223344',
      email: 'abir.buetprep@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      status: 'Active',
      joinedDate: '30 Sep 2026'
    }
  ]);

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
  const [academicActivities, setAcademicActivities] = useState([
    {
      id: 'act1',
      title: 'Course Enrollment Confirmed: Afroza Sultana',
      sub: 'Biology Extra Info Compact PDF',
      time: '10 mins ago',
      tag: 'Enrollment',
      icon: 'check',
      color: 'emerald'
    },
    {
      id: 'act2',
      title: 'Live Exam Submission: Rakibul Islam',
      sub: 'HSC Physics Paper 1 Vector Mega Test (Score: 14/15)',
      time: '25 mins ago',
      tag: 'Exam',
      icon: 'exam',
      color: 'blue'
    },
    {
      id: 'act3',
      title: 'bKash Payment Verified (৳2,999)',
      sub: 'TrxID: 9KJ34LA01X • Student: Tanvir Hasan',
      time: '1 hour ago',
      tag: 'Payment',
      icon: 'payment',
      color: 'pink'
    },
    {
      id: 'act4',
      title: 'Edu Hunters AI Study Query',
      sub: 'Topic: Natural Cardiac Pacemaker Mechanism',
      time: '2 hours ago',
      tag: 'AI Study',
      icon: 'sparkle',
      color: 'purple'
    },
    {
      id: 'act5',
      title: 'Edu Hunters Store PDF Download Completed',
      sub: 'Medical Biology Question Bank (Downloaded)',
      time: '3 hours ago',
      tag: 'Store',
      icon: 'book',
      color: 'amber'
    }
  ]);


  // Interactive Media Gallery Modal State
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState('Choose Image from Gallery');
  const [gallerySelectedUrl, setGallerySelectedUrl] = useState('');
  const [galleryCallback, setGalleryCallback] = useState(null);
  const [galleryCategory, setGalleryCategory] = useState('Faculty');

  const PRESET_GALLERY_IMAGES = [
    {
      category: 'Faculty',
      title: 'Faculty & Mentors',
      items: [
        { label: 'Jaidul Islam Nahian (CMC)', url: 'https://assets.codervai.com/teachers/1781515586459-cropped-image.webp' },
        { label: 'Sk Tasnim Ferdaus (DMC)', url: 'https://assets.codervai.com/teachers/1788702054420-cropped-image.webp' },
        { label: 'Senior Faculty Female', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80' },
        { label: 'Science Educator', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
        { label: 'Physics Specialist', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
        { label: 'Doctor / Medical Mentor', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80' },
        { label: 'Tech & Math Instructor', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
        { label: 'Academic Coordinator', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80' },
        { label: 'Department Head', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80' }
      ]
    },
    {
      category: 'Courses',
      title: 'Courses & Covers',
      items: [
        { label: 'Master English 30 Days', url: '/master_english_30_days.png' },
        { label: 'SureShot Exam System', url: '/sureshot_banner.jpg' },
        { label: 'Edu Hunters Hero', url: '/hero.png' }
      ]
    },
    {
      category: 'Books',
      title: 'Books & Resources',
      items: [
        { label: 'Formula Sheet PDF', url: 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp' },
        { label: 'Biology Question Bank', url: 'https://assets.codervai.com/courses/1781448263566-bio_28.webp' },
        { label: 'Physics Quick Notes', url: 'https://assets.codervai.com/courses/1781448163777-physics_28.webp' },
        { label: 'Chemistry Handbook', url: 'https://assets.codervai.com/courses/1781448210475-chem_28.webp' }
      ]
    }
  ];

  // Open Gallery Picker Modal
  const openGalleryModal = (currentImage, title, defaultCategory = 'Faculty', onSelect) => {
    setGallerySelectedUrl(currentImage || '');
    setGalleryTitle(title || 'Choose Image from Gallery');
    setGalleryCategory(defaultCategory);
    setGalleryCallback(() => (selected) => {
      onSelect(selected);
      setGalleryModalOpen(false);
    });
    setGalleryModalOpen(true);
  };

  // Direct File Upload from Device Gallery (converts & compresses via canvas to optimized data URL)
  const handleDeviceFileUpload = (file, onSelect) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      triggerToast('Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const optimized = canvas.toDataURL('image/jpeg', 0.85);
        onSelect(optimized);
        triggerToast('Photo updated from gallery successfully!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Feedback Toasts
  const [saveToast, setSaveToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('✅ All changes saved successfully!');

  // Helper function for updating section texts live
  const handleUpdateSectionText = (key, value) => {
    const updated = {
      ...sectionTexts,
      [key]: value
    };
    setSectionTexts(updated);
    persistAll({ sectionTexts: updated });
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
  const [newSlide, setNewSlide] = useState({
    title: '',
    image: '',
    link: '/courses',
    type: 'course'
  });

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
  const [curriculumCourseIndex, setCurriculumCourseIndex] = useState(null);
  const [curriculumStudioTab, setCurriculumStudioTab] = useState('curriculum'); // 'curriculum' | 'details'
  const [curriculumExpandedSections, setCurriculumExpandedSections] = useState({ 0: true });
  const [newLessonDrafts, setNewLessonDrafts] = useState({});
  const [newFeatureInput, setNewFeatureInput] = useState('');

  // Trigger Save Notification
  const triggerToast = (msg = '✅ All changes saved and updated live!') => {
    setToastMsg(msg);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // Central Save & Persist
  const persistAll = (overrides = {}) => {
    const currentCourses = overrides.courses !== undefined ? overrides.courses : courses;
    const currentBatches = overrides.examBatches !== undefined ? overrides.examBatches : (data?.examBatches || initialData.examBatches || []);
    const syncedBatches = currentBatches.map(b => {
      const match = currentCourses.find(c => (c.key === b.key || c.id === b.key || c.slug === b.key));
      if (match) {
        return {
          ...b,
          title: match.title || b.title,
          subtitle: match.subtitle || match.description || b.subtitle,
          price: String(match.salePrice || b.price),
          originalPrice: String(match.regularPrice || b.originalPrice),
          image: match.image || b.image
        };
      }
      return b;
    });

    const fullState = {
      ...data,
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
    if (confirm(`Are you sure you want to permanently delete user "${userName}"?`)) {
      const updated = usersList.filter(u => u.id !== userId);
      setUsersList(updated);
      persistAll({ users: updated });
      if (selectedUserDetails?.id === userId) setSelectedUserDetails(null);
      triggerToast(`User "${userName}" deleted`);
    }
  };

  const handleOpenEditUser = (user) => {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'Student',
      status: user.status || 'Active',
      batch: user.batch || 'HSC 26',
      password: ''
    });
    setShowAddUserModal(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      triggerToast('⚠️ Full name and email address are required');
      return;
    }

    if (editingUserId) {
      const updated = usersList.map(u => u.id === editingUserId ? {
        ...u,
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        role: userForm.role,
        status: userForm.status,
        batch: userForm.batch
      } : u);
      setUsersList(updated);
      persistAll({ users: updated });
      triggerToast(`✅ User "${userForm.name}" updated successfully!`);
    } else {
      const newUser = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim() || '01700-000000',
        role: userForm.role || 'Student',
        status: userForm.status || 'Active',
        batch: userForm.batch || 'General Batch',
        enrolledCourses: [],
        totalSpent: 0,
        joinedDate: 'Today',
        lastActive: 'Just registered',
        device: 'Manual Admin Entry',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userForm.email)}`
      };
      const updated = [newUser, ...usersList];
      setUsersList(updated);
      persistAll({ users: updated });
      triggerToast(`🎉 New user "${userForm.name}" registered!`);
    }

    setShowAddUserModal(false);
    setEditingUserId(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'Student',
      status: 'Active',
      batch: 'HSC 26',
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
      toastLabel = `🎁 "${foundBundle.title}" (${resolvedIncluded.length}টি কোর্স সহ)`;
    } else {
      coursesToAdd = [selection];
      toastLabel = `"${selection}"`;
    }

    const updated = usersList.map(u => {
      if (u.id === userId) {
        const current = u.enrolledCourses || [];
        const combined = Array.from(new Set([...current, ...coursesToAdd]));
        return { ...u, enrolledCourses: combined };
      }
      return u;
    });

    setUsersList(updated);
    persistAll({ users: updated });
    grantCourseAccess(selection, { bundles, courses });

    if (selectedUserDetails?.id === userId) {
      setSelectedUserDetails(prev => ({
        ...prev,
        enrolledCourses: Array.from(new Set([...(prev.enrolledCourses || []), ...coursesToAdd]))
      }));
    }

    setQuickEnrollUser(null);
    setSelectedCourseToEnroll('');
    triggerToast(`✅ সফলভাবে এক্সেস দেওয়া হয়েছে: ${toastLabel}`);
  };

  const handleRevokeCourseFromUser = (userId, courseTitle) => {
    const updated = usersList.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          enrolledCourses: (u.enrolledCourses || []).filter(c => c !== courseTitle)
        };
      }
      return u;
    });
    setUsersList(updated);
    persistAll({ users: updated });
    if (selectedUserDetails?.id === userId) {
      setSelectedUserDetails(prev => ({
        ...prev,
        enrolledCourses: (prev.enrolledCourses || []).filter(c => c !== courseTitle)
      }));
    }
    triggerToast(`Revoked access to "${courseTitle}"`);
  };

  const handleExportUsersCSV = () => {
    const headers = ['User ID', 'Full Name', 'Email', 'Phone', 'Role', 'Status', 'Batch', 'Enrolled Courses Count', 'Total Spent (BDT)', 'Joined Date', 'Device'];
    const rows = usersList.map(u => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.phone,
      u.role,
      u.status,
      `"${u.batch}"`,
      u.enrolledCourses?.length || 0,
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
      const itemTitle = targetTx.itemTitle || '';
      const { courses: grantedCourses } = grantCourseAccess(itemTitle, { bundles, courses });

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

      const rawPhone = (targetTx.studentPhone || '').replace(/[^0-9]/g, '');
      const rawName = (targetTx.studentName || '').trim().toLowerCase();

      // Update enrolled students
      const foundSt = enrolledStudents.find(st => {
        const stPhone = (st.phone || '').replace(/[^0-9]/g, '');
        const stName = (st.name || '').trim().toLowerCase();
        return (rawPhone.length >= 6 && stPhone.includes(rawPhone)) || (rawName && stName === rawName);
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

      if (rawPhone.length >= 6 || rawName) {
        extraUserUpdates = usersList.map(u => {
          const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
          const uName = (u.name || '').trim().toLowerCase();
          const matchPhone = rawPhone.length >= 6 && uPhone.includes(rawPhone);
          const matchName = rawName && (uName === rawName || uName.includes(rawName));

          if (matchPhone || matchName) {
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
    }

    persistAll({ 
      accounting: newAcc,
      enrolledStudents: extraStudentUpdates,
      ...(extraUserUpdates ? { users: extraUserUpdates } : {})
    });
    triggerToast('✅ Enrollment approved and courses unlocked successfully!');
  };

  // Add Slide
  const handleAddSlide = (e) => {
    e.preventDefault();
    if (!newSlide.title || !newSlide.image) return;
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
      const existing = updatedEnrolled.find(st => st.phone && cleanPhone && st.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, ''));
      const studentName = tx.studentName || tx.customer || 'New Student';
      const courseTitle = tx.itemTitle || tx.category || 'Course Enrollment';

      const { courses: grantedCourses } = grantCourseAccess(courseTitle, { bundles, courses });

      if (existing) {
        updatedEnrolled = updatedEnrolled.map(st => st.id === existing.id ? { ...st, status: 'Active', courseName: courseTitle, joinedDate: 'Today' } : st);
      } else {
        updatedEnrolled.unshift({
          id: `st-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: studentName,
          studentId: `EH-2026-${Math.floor(100 + Math.random() * 900)}`,
          batch: courseTitle.includes('Medical') ? 'Medical 25' : courseTitle.includes('Engineering') ? 'Engineering' : 'HSC 26',
          courseName: courseTitle,
          phone: cleanPhone || '01700-000000',
          email: tx.email || `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}@gmail.com`,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          status: 'Active',
          joinedDate: 'Today'
        });
      }

      // Update usersList
      const rawPhone = cleanPhone.replace(/[^0-9]/g, '');
      const rawName = studentName.trim().toLowerCase();
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

    // 1. Update transaction status to Completed in Accounting
    const updatedTxs = (accounting.transactions || []).map(t => 
      t.id === tx.id ? { ...t, status: 'Completed' } : t
    );
    const updatedAccounting = {
      ...accounting,
      transactions: updatedTxs,
      totalRevenue: (accounting.totalRevenue || 0) + (Number(tx.amount) || 0)
    };
    setAccounting(updatedAccounting);

    // 2. Grant access globally & locally via enrollmentService
    const itemTitle = tx.itemTitle || tx.category || 'Course Enrollment';
    const { courses: grantedCourses } = grantCourseAccess(itemTitle, { bundles, courses });

    // 3. Check if student already in enrolledStudents or create new active student
    const cleanPhone = (tx.studentPhone || tx.phone || '').trim();
    const existingStudent = enrolledStudents.find(st => 
      st.phone && cleanPhone && st.phone.replace(/[^0-9]/g, '') === cleanPhone.replace(/[^0-9]/g, '')
    );

    let updatedEnrolled = [...enrolledStudents];
    const studentName = tx.studentName || tx.customer || 'New Student';
    const courseTitle = itemTitle;

    if (existingStudent) {
      updatedEnrolled = updatedEnrolled.map(st => 
        st.id === existingStudent.id 
          ? { 
              ...st, 
              status: 'Active', 
              courseName: courseTitle,
              joinedDate: 'Today'
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
        phone: cleanPhone || '01700-000000',
        email: tx.email || `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}@gmail.com`,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        status: 'Active',
        joinedDate: 'Today'
      };
      updatedEnrolled = [newStudent, ...updatedEnrolled];
    }
    setEnrolledStudents(updatedEnrolled);

    // 4. Update usersList
    const rawPhone = cleanPhone.replace(/[^0-9]/g, '');
    const rawName = studentName.trim().toLowerCase();
    let updatedUsers = usersList.map(u => {
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
    setUsersList(updatedUsers);

    persistAll({ 
      accounting: updatedAccounting, 
      enrolledStudents: updatedEnrolled,
      users: updatedUsers
    });
    triggerToast(`🎉 TrxID Verified! ${studentName} successfully enrolled in "${courseTitle}"`);
  };

  const handleRejectTrx = (txId) => {
    if (!confirm('Are you sure you want to reject this transaction / TrxID?')) return;
    const updatedTxs = (accounting.transactions || []).map(t => 
      t.id === txId ? { ...t, status: 'Rejected' } : t
    );
    const updatedAccounting = {
      ...accounting,
      transactions: updatedTxs
    };
    setAccounting(updatedAccounting);
    persistAll({ accounting: updatedAccounting });
    triggerToast('⚠️ Transaction marked as Rejected');
  };

  // ==========================================
  // CURRICULUM & COURSE STUDIO HANDLERS
  // ==========================================
  const openCurriculumStudio = (courseIdx, tab = 'curriculum') => {
    const course = courses[courseIdx];
    if (!course) return;

    if (!Array.isArray(course.curriculum) || course.curriculum.length === 0) {
      const initialCurr = (course.id === 'master-english-30-days' || course.slug === 'master-english-30-days')
        ? JSON.parse(JSON.stringify(masterEnglishCourseData.curriculum))
        : [];
      const updated = courses.map((c, i) => i === courseIdx ? { 
        ...c, 
        curriculum: initialCurr,
        tagline: c.tagline || (c.id === 'master-english-30-days' ? masterEnglishCourseData.tagline : ''),
        aboutText: c.aboutText || (c.id === 'master-english-30-days' ? masterEnglishCourseData.aboutText : ''),
        totalClasses: c.totalClasses || (c.id === 'master-english-30-days' ? masterEnglishCourseData.totalClasses : ''),
        features: (c.features && c.features.length > 0) ? c.features : (c.id === 'master-english-30-days' ? masterEnglishCourseData.features : []),
        supportPhone: c.supportPhone || '01321228612',
        previewVideoUrl: c.previewVideoUrl || (c.id === 'master-english-30-days' ? masterEnglishCourseData.previewVideoUrl : '')
      } : c);
      setCourses(updated);
      persistAll({ courses: updated });
    }

    setCurriculumCourseIndex(courseIdx);
    setCurriculumStudioTab(tab);
    setCurriculumExpandedSections({ 0: true, 1: true });
    try {
      window.history.pushState(null, '', `/admin?course=${courseIdx}`);
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

    if (q) {
      list = list.filter(u => 
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q) ||
        (u.id || '').toLowerCase().includes(q) ||
        (u.batch || '').toLowerCase().includes(q)
      );
    }

    if (userSortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (userSortBy === 'spend') {
      list.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    } else if (userSortBy === 'courses') {
      list.sort((a, b) => (b.enrolledCourses?.length || 0) - (a.enrolledCourses?.length || 0));
    }

    return list;
  }, [usersList, userRoleFilter, userStatusFilter, deferredUserQuery, userSortBy]);

  const userMetrics = useMemo(() => {
    const total = usersList.length;
    const activeStudents = usersList.filter(u => u.role === 'Student' && u.status === 'Active').length;
    const staffCount = usersList.filter(u => ['Admin', 'Instructor', 'Moderator'].includes(u.role)).length;
    const suspendedCount = usersList.filter(u => u.status === 'Suspended').length;
    return { total, activeStudents, staffCount, suspendedCount };
  }, [usersList]);

  // Memoized Pending Count
  const pendingCount = useMemo(() => {
    return (accounting?.transactions || []).filter(tx => tx.status !== 'Completed').length;
  }, [accounting?.transactions]);

  // Memoized Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const txs = accounting?.transactions || [];
    const query = deferredSearchTrx.trim().toLowerCase();
    return txs.filter(tx => {
      const matchesSearch = !query ||
        (tx.studentName || '').toLowerCase().includes(query) ||
        (tx.itemTitle || '').toLowerCase().includes(query) ||
        (tx.trxId || '').toLowerCase().includes(query) ||
        (tx.studentPhone || '').includes(query);
      if (trxFilter === 'PENDING') return matchesSearch && tx.status !== 'Completed';
      if (trxFilter === 'INCOME') return matchesSearch && tx.type === 'INCOME';
      if (trxFilter === 'EXPENSE') return matchesSearch && tx.type === 'EXPENSE';
      return matchesSearch;
    });
  }, [accounting?.transactions, deferredSearchTrx, trxFilter]);

  // Memoized Verification Hub Filtered List
  const verificationList = useMemo(() => {
    const txs = accounting?.transactions || [];
    const q = deferredVerifQuery.trim().toLowerCase();
    const qClean = q.replace(/[^a-zA-Z0-9]/g, '');

    return txs.filter(tx => {
      if (tx.type === 'EXPENSE') return false;

      if (verificationFilter === 'PENDING' && tx.status !== 'Pending') return false;
      if (verificationFilter === 'COMPLETED' && tx.status !== 'Completed') return false;
      if (verificationFilter === 'REJECTED' && tx.status !== 'Rejected') return false;

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


  // Memoized Financial Totals
  const accountingTotals = useMemo(() => {
    const txs = accounting?.transactions || [];
    let rev = 0;
    let exp = 0;
    txs.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'INCOME') rev += amt;
      else if (t.type === 'EXPENSE') exp += amt;
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
          course={courses[curriculumCourseIndex]}
          courseIndex={curriculumCourseIndex}
          initialTab={curriculumStudioTab}
          categories={categories}
          onUpdateCourse={(updatedCourse) => {
            const next = courses.map((c, i) => i === curriculumCourseIndex ? updatedCourse : c);
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
        />

        {/* Media Gallery Modal for Image Picking in Studio */}
        {galleryModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white border border-slate-200/80 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#5d5bf6]/10 text-[#5d5bf6] flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {galleryTitle || 'Choose Image from Gallery'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pick from curated presets or upload directly from your device gallery.
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

              <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Direct Local Image Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryFileUpload}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#5d5bf6] file:text-white hover:file:bg-[#4e4be3] file:cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Curated Image Presets</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(PRESET_GALLERY[galleryCategory] || PRESET_GALLERY['General'] || []).map((preset, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => handleSelectPresetImage(preset.url)}
                        className="group relative aspect-video rounded-xl overflow-hidden ring-1 ring-slate-200 hover:ring-2 hover:ring-[#5d5bf6] cursor-pointer transition-all shadow-2xs"
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                          <span className="text-[10px] text-white font-bold truncate">{preset.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* FLOATING SUCCESS TOAST */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span className="font-bold text-sm">{toastMsg}</span>
        </div>
      )}

      {/* MATDASH HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          {/* Brand Logo - MatDash Style */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5d5bf6] to-[#7c7afc] flex items-center justify-center font-black text-white text-xs shadow-md shadow-[#5d5bf6]/25">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900 tracking-tight">MatDash</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#5d5bf6]/10 text-[#5d5bf6] uppercase tracking-wider hidden sm:inline-block">
                EduHunters
              </span>
            </div>
          </div>
        </div>

        {/* Center Search Bar with Shortcut */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
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
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <button
            onClick={() => setShowAddCourseModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5d5bf6]/10 hover:bg-[#5d5bf6]/20 text-[#5d5bf6] font-bold text-xs border border-[#5d5bf6]/20 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>

          <button
            onClick={handleExportData}
            title="Download database JSON backup"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white font-bold text-xs shadow-md shadow-[#5d5bf6]/25 transition-all cursor-pointer border-none"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>

          <button
            type="button"
            onClick={() => {
              persistAll();
              if (onExitAdmin) onExitAdmin();
            }}
            title="Go to Live User Website"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer border-none"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Live Site</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Language Flag Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-sm">🇬🇧</span>
            <span className="text-[11px] font-extrabold text-slate-700">EN</span>
          </div>

          {/* Notification Bell */}
          <div 
            onClick={() => setActiveTab('accounting')}
            title="Notifications & Pending Verifications"
            className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
          >
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#5d5bf6] absolute top-1.5 right-1.5 ring-2 ring-white" />
            )}
          </div>

          {/* MatDash User Profile Chip */}
          <div className="flex items-center gap-2 pl-1.5 cursor-pointer group">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#5d5bf6]/20">
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
            <ChevronDown className="w-3 h-3 text-slate-400 hidden xl:block group-hover:text-slate-700 transition-colors" />
          </div>
        </div>
      </header>

      {/* DASHBOARD BODY - FIXED 2 COLUMN SIDE-BY-SIDE LAYOUT */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1,
          width: '100%',
          minHeight: 'calc(100vh - 61px)',
          background: '#f4f6fa',
          alignItems: 'stretch'
        }}
      >
        
        {/* SIDEBAR NAVIGATION TABS (LEFT COLUMN) */}
        <aside 
          style={{
            width: '240px',
            minWidth: '240px',
            maxWidth: '240px',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            padding: '20px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            flexShrink: 0,
            position: 'sticky',
            top: '61px',
            height: 'calc(100vh - 61px)',
            overflowY: 'auto'
          }}
        >
          {/* View Live Site Shortcut in Sidebar */}
          <button
            type="button"
            onClick={() => {
              persistAll();
              if (onExitAdmin) onExitAdmin();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer bg-slate-900 text-white hover:bg-slate-800 border-slate-900 shadow-sm mb-3"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Visit User Website</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* GROUP 1: DASHBOARD */}
          <div style={{ padding: '4px 10px', marginBottom: '2px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, color: '#94a3b8' }}>
              MAIN MENU
            </span>
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'overview' ? 'text-white' : 'text-slate-400'}`} />
              <span>Dashboard</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('accounting')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'accounting' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
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
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'users' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
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


          {/* GROUP 2: ACADEMICS */}
          <div style={{ padding: '14px 10px 4px 10px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, color: '#94a3b8' }}>
              ACADEMIC
            </span>
          </div>

          <button
            onClick={() => setActiveTab('courses')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'courses' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'courses' ? 'text-white' : 'text-slate-400'}`} />
              <span>Courses</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{courses.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('bundles')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'bundles' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className={`w-4 h-4 shrink-0 ${activeTab === 'bundles' ? 'text-white' : 'text-slate-400'}`} />
              <span>Bundles</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{bundles.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('instructors')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'instructors' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <GraduationCap className={`w-4 h-4 shrink-0 ${activeTab === 'instructors' ? 'text-white' : 'text-slate-400'}`} />
              <span>Faculty & Mentors</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{instructors.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('store')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'store' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'store' ? 'text-white' : 'text-slate-400'}`} />
              <span>Book & PDF Store</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{storeProducts.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'videos' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <Video className={`w-4 h-4 shrink-0 ${activeTab === 'videos' ? 'text-white' : 'text-slate-400'}`} />
              <span>Free Video Classes</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{freeVideos.length}</span>
          </button>

          {/* GROUP 3: CUSTOMIZATION */}
          <div style={{ padding: '14px 10px 4px 10px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, color: '#94a3b8' }}>
              CUSTOMIZE
            </span>
          </div>

          <button
            onClick={() => setActiveTab('slides')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'slides' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sliders className={`w-4 h-4 shrink-0 ${activeTab === 'slides' ? 'text-white' : 'text-slate-400'}`} />
              <span>Hero Slider</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('sectionTexts')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'sectionTexts' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <Type className={`w-4 h-4 shrink-0 ${activeTab === 'sectionTexts' ? 'text-white' : 'text-slate-400'}`} />
              <span>Section Texts</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('whyChoose')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'whyChoose' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <HelpCircle className={`w-4 h-4 shrink-0 ${activeTab === 'whyChoose' ? 'text-white' : 'text-slate-400'}`} />
              <span>Why Choose Us</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'stats' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
            }`}
          >
            <div className="flex items-center gap-3">
              <PieChart className={`w-4 h-4 shrink-0 ${activeTab === 'stats' ? 'text-white' : 'text-slate-400'}`} />
              <span>Counters & Notice</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('policies')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'policies' ? 'bg-[#5d5bf6] text-white shadow-md shadow-[#5d5bf6]/25 font-bold rounded-xl border-[#5d5bf6]' : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 rounded-xl font-medium'
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

          <div className="mt-auto pt-4">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
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
        </aside>

        {/* MAIN PANEL VIEW (RIGHT COLUMN) */}
        <main 
          style={{
            flex: 1,
            minWidth: 0,
            padding: '24px 28px',
            background: '#f4f6fa',
            overflowY: 'auto'
          }}
        >
          {/* MatDash Page Title & Breadcrumb Header Card */}
          {(() => {
            const tabMeta = {
              overview: { title: 'User Dashboard', sub: 'Comprehensive overview of enrolled students, revenue, and active course stats' },
              accounting: { title: 'Enrollments & Financial Ledger', sub: 'Review pending payment verifications, student tuition, and accounting statements' },
              users: { title: 'User Management & Directory', sub: 'Comprehensive directory of platform accounts, roles, access permissions, and student profiles' },
              courses: { title: 'Courses Studio', sub: 'Create, edit, and organize academic video courses, pricing, and lecture syllabi' },
              bundles: { title: 'Course Bundles Studio', sub: 'Package multiple academic courses together at a discounted combo price' },
              instructors: { title: 'Faculty & Mentors Directory', sub: 'Manage instructor profiles, teaching subjects, bios, and avatar photos' },
              store: { title: 'Book & PDF Resources Store', sub: 'Manage student physical publications, PDF study guides, and delivery logs' },
              videos: { title: 'Free Video Classes Library', sub: 'Curate open YouTube classes and lecture playlists for free learning' },
              slides: { title: 'Hero Carousel Slider', sub: 'Configure prominent homepage banner announcements, callouts, and campaign visuals' },
              sectionTexts: { title: 'Homepage Section Typography', sub: 'Customize titles, descriptions, and action button labels across the portal' },
              whyChoose: { title: 'Why Choose Us Features', sub: 'Manage core educational pillars and platform highlights on the landing page' },
              stats: { title: 'Counters & Announcements', sub: 'Manage homepage achievement milestones, counter stats, and top notice bar' },
              policies: { title: 'Legal & Policies Studio', sub: 'Customize Terms & Conditions, Refund Policy, and Privacy Policy for students' },
              settings: { title: 'Brand & Platform Settings', sub: 'Configure site branding, logos, support contacts, API keys, and system parameters' }
            };
            const currentMeta = tabMeta[activeTab] || { title: activeTab.toUpperCase(), sub: 'Admin Management Panel' };
            return (
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    {currentMeta.title}
                  </h1>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {currentMeta.sub}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-600">
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#5d5bf6]" />
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-400 font-medium">Home</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-[#5d5bf6] font-bold">{currentMeta.title.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            );
          })()}
          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* TOP TITLE & THREE CANDY PASTEL CARDS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Dashboard
                  </h2>
                  <div className="flex items-center gap-2">
                    {pendingCount > 0 && (
                      <button
                        onClick={() => {
                          setTrxFilter('PENDING');
                          setActiveTab('accounting');
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>{pendingCount} Pending Enrollments</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* CLEAN & COMPACT METRIC STAT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  
                  {/* CARD 1: Total Enrolled Students */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-pink-300/80 hover:shadow-sm transition-all flex flex-col justify-between group">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 border border-pink-100/80">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Total Enrolled Students</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <TrendingUp className="w-2.5 h-2.5" />
                        <span>+24%</span>
                      </span>
                    </div>

                    <div className="my-2">
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                        {(3840 + enrolledStudents.length).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>HSC & Admission Batches</span>
                      <span className="text-pink-600 font-semibold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                        Student Database →
                      </span>
                    </div>
                  </div>

                  {/* CARD 2: Pending Verification */}
                  <div 
                    onClick={() => setDashboardMainTab('verification')}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-amber-300/80 hover:shadow-sm transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/80">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Pending Verification</span>
                      </div>
                      {pendingCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Needs Review</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <Check className="w-2.5 h-2.5" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>

                    <div className="my-2 flex items-baseline gap-2">
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                        {pendingCount}
                      </div>
                      <span className="text-xs font-semibold text-amber-700">
                        {pendingCount > 0 ? 'Pending Verifications' : 'All Verified'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>bKash & Nagad TrxID</span>
                      <span className="text-amber-600 font-semibold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                        Review Now →
                      </span>
                    </div>
                  </div>

                  {/* CARD 3: Active Batches & Courses */}
                  <div 
                    onClick={() => setActiveTab('courses')}
                    className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-300/80 hover:shadow-sm transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/80">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Active Batches & Courses</span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Running</span>
                      </span>
                    </div>

                    <div className="my-2 flex items-baseline gap-2">
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                        {courses.length}
                      </div>
                      <span className="text-xs font-semibold text-blue-700">
                        Batches & Live Programs
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>HSC 25, 26, 27, 28 & Med</span>
                      <span className="text-blue-600 font-semibold text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                        Manage Courses →
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* 2-COLUMN SPLIT DASHBOARD LAYOUT */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: VERIFICATION HUB & STUDENT MANAGEMENT (8 Cols) */}
                <div className="xl:col-span-8">
                  {/* UNIFIED SaaS CARD CONTAINER (CLEAN, MINIMAL & PROFESSIONAL) */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
                    
                    {/* SLEEK SAAS HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 bg-white">
                      {/* Segmented Pill Tabs */}
                      <div className="inline-flex items-center gap-1.5 bg-[#f4f6fa] p-1.5 rounded-2xl border border-slate-200/70">
                        <button
                          type="button"
                          onClick={() => setDashboardMainTab('verification')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
                            dashboardMainTab === 'verification'
                              ? 'bg-white text-slate-900 shadow-xs font-black'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <ShieldCheck className={`w-4 h-4 ${dashboardMainTab === 'verification' ? 'text-[#5d5bf6]' : 'text-slate-400'}`} />
                          <span>Payment Verifications</span>
                          {pendingCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                              {pendingCount} Pending
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
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
                            dashboardMainTab === 'students'
                              ? 'bg-white text-slate-900 shadow-xs font-black'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Users className={`w-4 h-4 ${dashboardMainTab === 'students' ? 'text-[#5d5bf6]' : 'text-slate-400'}`} />
                          <span>Student Database</span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">
                            {enrolledStudents.length}
                          </span>
                        </button>
                      </div>

                      {/* Header Right Action */}
                      <div className="flex items-center gap-2">
                        {dashboardMainTab === 'verification' ? (
                          <>
                            {pendingCount > 0 ? (
                              <button
                                type="button"
                                onClick={handleVerifyAllPending}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs shadow-emerald-600/20 cursor-pointer border-none transition-all active:scale-95"
                                title="Approve and enroll all pending transactions"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Verify All Pending ({pendingCount})</span>
                              </button>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70">
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
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/20 cursor-pointer border-none transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ New Student</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="p-5 space-y-4">
                      
                      {/* TAB 1: PAYMENT & TRXID VERIFICATION HUB */}
                      {dashboardMainTab === 'verification' && (
                        <div className="space-y-4">
                          
                          {/* Search Bar & Filter Buttons */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Search Input */}
                            <div className="relative flex-1 max-w-sm">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              <input 
                                type="text"
                                placeholder="Search by TrxID, student name, or phone..."
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

                            {/* Status Filter Tabs (Segmented Controller) */}
                            <div className="flex items-center gap-1 bg-[#f4f6fa] p-1 rounded-xl text-xs font-semibold text-slate-600 shrink-0 border border-slate-200/60">
                              {[
                                { key: 'PENDING', label: 'Pending', count: (accounting?.transactions || []).filter(t => t.type === 'INCOME' && t.status === 'Pending').length },
                                { key: 'ALL', label: 'All', count: (accounting?.transactions || []).filter(t => t.type === 'INCOME').length },
                                { key: 'COMPLETED', label: 'Verified', count: (accounting?.transactions || []).filter(t => t.type === 'INCOME' && t.status === 'Completed').length },
                                { key: 'REJECTED', label: 'Rejected', count: (accounting?.transactions || []).filter(t => t.type === 'INCOME' && t.status === 'Rejected').length },
                              ].map((tab) => {
                                const isActive = verificationFilter === tab.key;
                                return (
                                  <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setVerificationFilter(tab.key)}
                                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer border-none flex items-center gap-1.5 text-xs select-none ${
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

                          {/* Transactions Verification Table */}
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
                            <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
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
                                    const isPending = tx.status === 'Pending';
                                    const isCompleted = tx.status === 'Completed';
                                    const isRejected = tx.status === 'Rejected';
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

                                        {/* Col 4: Amount */}
                                        <td className="py-2.5 px-2 font-black text-slate-900 text-xs whitespace-nowrap">
                                          ৳{Number(tx.amount || 0).toLocaleString()}
                                        </td>

                                        {/* Col 5: Status Badge */}
                                        <td className="py-2.5 px-2 whitespace-nowrap">
                                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                            isPending ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            'bg-rose-50 text-rose-700 border-rose-200'
                                          }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-amber-500 animate-pulse' : isCompleted ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <span>{isPending ? 'Pending' : isCompleted ? 'Verified' : 'Rejected'}</span>
                                          </span>
                                        </td>

                                        {/* Col 6: Action Buttons */}
                                        <td className="py-2.5 pr-3.5 pl-2 text-right whitespace-nowrap">
                                          <div className="flex items-center justify-end gap-1">
                                            {isPending ? (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={() => handleApproveAndEnrollStudent(tx)}
                                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-2xs shadow-emerald-600/20 flex items-center gap-1 cursor-pointer border-none active:scale-95"
                                                  title="Verify TrxID & Enroll Student"
                                                >
                                                  <Check className="w-3 h-3" />
                                                  <span>Verify</span>
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
                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                isCompleted ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                                              }`}>
                                                {isCompleted ? 'Enrolled' : 'Rejected'}
                                              </span>
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
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
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
                                    onClick={() => {
                                      setEnrolledStudents(prev => prev.map(item => item.id === st.id ? { ...item, status: item.status === 'Active' ? 'Pending' : 'Active' } : item));
                                      triggerToast(`Status updated for ${st.name}`);
                                    }}
                                    title="Click to toggle status"
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
                                      onClick={() => {
                                        if (confirm(`Are you sure you want to remove ${st.name} from the student database?`)) {
                                          setEnrolledStudents(prev => prev.filter(item => item.id !== st.id));
                                          triggerToast(`🗑️ ${st.name} removed from student list`);
                                        }
                                      }}
                                      title="Delete Student"
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
                    </div>
                  )}

                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: ACTION BUTTONS, RECENT ACTIVITY, BATCH BREAKDOWN (4 Cols) */}
                <div className="xl:col-span-4 space-y-6">
                  
                  {/* QUICK ACTION BUTTONS */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowAddStudentModal(true)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#ffd5df] hover:bg-[#ffc2d1] text-pink-900 font-bold text-xs border border-pink-200 shadow-2xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-pink-800" />
                        <span>Add Student</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAddTeacherModal(true)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                        <span>Add Mentor/Faculty</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowNoticeModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5 text-blue-600" />
                      <span>Send Batch Notice / SMS</span>
                    </button>
                  </div>


                  {/* BATCH ENROLLMENT BREAKDOWN DONUT CHART CARD */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Batch Enrollment Breakdown
                        </h3>
                        <p className="text-[11px] text-slate-400">Student distribution by batch category</p>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                        <span>All Batches</span>
                      </div>
                    </div>

                    {/* SVG Multi-Segment Donut */}
                    <div className="relative flex items-center justify-center py-2">
                      <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
                        {/* Medical Exam Batch - Rose/Pink */}
                        <circle
                          cx="80"
                          cy="80"
                          r="58"
                          stroke="#f472b6"
                          strokeWidth="16"
                          fill="transparent"
                          strokeDasharray="140 225"
                          strokeDashoffset="0"
                          strokeLinecap="round"
                        />
                        {/* HSC 25 & 26 Combo - Blue */}
                        <circle
                          cx="80"
                          cy="80"
                          r="58"
                          stroke="#60a5fa"
                          strokeWidth="16"
                          fill="transparent"
                          strokeDasharray="100 265"
                          strokeDashoffset="-145"
                          strokeLinecap="round"
                        />
                        {/* HSC 27 & 28 Series - Butter Amber */}
                        <circle
                          cx="80"
                          cy="80"
                          r="58"
                          stroke="#fbbf24"
                          strokeWidth="16"
                          fill="transparent"
                          strokeDasharray="70 295"
                          strokeDashoffset="-250"
                          strokeLinecap="round"
                        />
                        {/* Engineering & Math - Purple */}
                        <circle
                          cx="80"
                          cy="80"
                          r="58"
                          stroke="#a855f7"
                          strokeWidth="16"
                          fill="transparent"
                          strokeDasharray="50 315"
                          strokeDashoffset="-325"
                          strokeLinecap="round"
                        />
                      </svg>

                      {/* Donut Center Counter */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                          3,845
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-1">
                          Total Active
                        </span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#f472b6]" />
                          <span className="font-medium text-slate-700">Medical Exam Batch</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">1,538</span>
                          <span className="text-[11px] font-semibold text-pink-600">40%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#60a5fa]" />
                          <span className="font-medium text-slate-700">HSC 25 & 26 Combo</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">1,153</span>
                          <span className="text-[11px] font-semibold text-blue-600">30%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#fbbf24]" />
                          <span className="font-medium text-slate-700">HSC 27 & 28 Series</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">769</span>
                          <span className="text-[11px] font-semibold text-amber-600">20%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#a855f7]" />
                          <span className="font-medium text-slate-700">Engineering & Math</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">385</span>
                          <span className="text-[11px] font-semibold text-purple-600">10%</span>
                        </div>
                      </div>
                    </div>

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
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                    Financial Register & Ledger
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time ledger for course fees, store purchases, and business operational expenses.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddTrxModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Add Manual Entry
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Total Income / Revenue</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">৳{accountingTotals.totalRevenue.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{accounting?.totalOrders || 0} completed orders</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Total Expenses</p>
                    <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">৳{accountingTotals.totalExpenses.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Servers, SMS, domain & operations</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Net Profit / Balance</p>
                    <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">৳{accountingTotals.netProfit.toLocaleString()}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Healthy cashflow margin</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200 flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTrx}
                    onChange={(e) => setSearchTrx(e.target.value)}
                    placeholder="Search student, phone, TrxID..."
                    className="bg-transparent border-none outline-none text-xs text-slate-800 w-full placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setTrxFilter('ALL')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                      trxFilter === 'ALL' 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All ({accounting.transactions?.length || 0})
                  </button>
                  <button
                    onClick={() => setTrxFilter('PENDING')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all flex items-center gap-1.5 ${
                      trxFilter === 'PENDING' 
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' 
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span>Pending</span>
                    {pendingCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-black">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setTrxFilter('INCOME')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                      trxFilter === 'INCOME' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    onClick={() => setTrxFilter('EXPENSE')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                      trxFilter === 'EXPENSE' 
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Expenses
                  </button>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
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
                            <div className="font-bold text-slate-900">{tx.studentName}</div>
                            <div className="text-[10px] text-slate-400">{tx.studentPhone}</div>
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
                          <td className={`py-3 px-4 text-right font-black text-sm whitespace-nowrap ${
                            tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {tx.type === 'INCOME' ? `+৳${(tx.amount || 0).toLocaleString()}` : `-৳${(tx.amount || 0).toLocaleString()}`}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {tx.status !== 'Completed' && (
                                <button
                                  onClick={() => handleApproveTrx(tx.id)}
                                  className="text-emerald-600 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 border-none bg-transparent cursor-pointer transition-colors"
                                  title="Approve Enrollment"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm(`Delete transaction (${tx.id})?`)) {
                                    const updated = accounting.transactions.filter(t => t.id !== tx.id);
                                    const diff = tx.type === 'INCOME' ? -(tx.amount || 0) : 0;
                                    const expDiff = tx.type === 'EXPENSE' ? -(tx.amount || 0) : 0;
                                    const newAcc = {
                                      ...accounting,
                                      totalRevenue: (accounting.totalRevenue || 0) + diff,
                                      totalExpenses: (accounting.totalExpenses || 0) + expDiff,
                                      netProfit: ((accounting.totalRevenue || 0) + diff) - ((accounting.totalExpenses || 0) + expDiff),
                                      transactions: updated
                                    };
                                    setAccounting(newAcc);
                                    persistAll({ accounting: newAcc });
                                    triggerToast('Transaction deleted!');
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 border-none bg-transparent cursor-pointer transition-colors"
                                title="Delete"
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
              </div>
            </div>
          )}


          {/* ========================================================= */}
          {/* TAB: USERS MANAGEMENT (MATDASH STYLE) */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              
              {/* Top 4-Card MatDash KPI Stat Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Platform Users</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">{userMetrics.total}</div>
                    <div className="text-[11px] font-bold text-[#5d5bf6] mt-1 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Live Registered Directory</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#5d5bf6]/10 text-[#5d5bf6] flex items-center justify-center shadow-xs">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                {/* Active Students */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active Students</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">{userMetrics.activeStudents}</div>
                    <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Enrolled & verified</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </div>

                {/* Staff & Faculty */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Faculty & Staff</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">{userMetrics.staffCount}</div>
                    <div className="text-[11px] font-bold text-violet-600 mt-1">
                      <span>Admins, mentors, mods</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>

                {/* Suspended Accounts */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Suspended Accounts</div>
                    <div className="text-2xl font-black text-rose-600 mt-1">{userMetrics.suspendedCount}</div>
                    <div className="text-[11px] font-bold text-rose-500 mt-1">
                      {userMetrics.suspendedCount > 0 ? 'Policy / Device flags' : 'No suspended accounts'}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Advanced Filter, Search, and Action Bar */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search by name, email, phone, ID, or batch..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full bg-[#f4f6fa] border border-slate-200/80 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] focus:ring-2 focus:ring-[#5d5bf6]/15 transition-all font-medium placeholder:text-slate-400"
                    />
                    {userSearchQuery && (
                      <button 
                        onClick={() => setUserSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-transparent border-none cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Actions & Sorting */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <select
                      value={userSortBy}
                      onChange={(e) => setUserSortBy(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:border-[#5d5bf6]"
                    >
                      <option value="newest">Sort: Newest First</option>
                      <option value="name">Sort: Name (A-Z)</option>
                      <option value="spend">Sort: Highest Spend</option>
                      <option value="courses">Sort: Most Courses</option>
                    </select>

                    <button
                      onClick={handleExportUsersCSV}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingUserId(null);
                        setUserForm({
                          name: '',
                          email: '',
                          phone: '',
                          role: 'Student',
                          status: 'Active',
                          batch: 'HSC 26',
                          password: ''
                        });
                        setShowAddUserModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add New User</span>
                    </button>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  {/* Role Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Role:</span>
                    {['ALL', 'Student', 'Instructor', 'Moderator', 'Admin'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setUserRoleFilter(role)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          userRoleFilter === role
                            ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                        }`}
                      >
                        {role === 'ALL' ? 'All Roles' : role}
                      </button>
                    ))}
                  </div>

                  {/* Status Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                    {['ALL', 'Active', 'Pending', 'Suspended'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setUserStatusFilter(status)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          userStatusFilter === status
                            ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                        }`}
                      >
                        {status === 'ALL' ? 'All Status' : status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Directory Table Card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">User & ID</th>
                        <th className="py-3 px-4">Contact & Device</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Batch / Dept</th>
                        <th className="py-3 px-4">Enrollments & Spend</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-12 text-center text-slate-400">
                            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-sm font-bold text-slate-700">No users found</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {userSearchQuery ? `No results matching "${userSearchQuery}"` : 'No users match the selected filters.'}
                            </p>
                            {userSearchQuery && (
                              <button
                                onClick={() => setUserSearchQuery('')}
                                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 cursor-pointer"
                              >
                                Reset Search
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const isSuspended = user.status === 'Suspended';
                          const isPending = user.status === 'Pending';
                          const isActive = user.status === 'Active';

                          return (
                            <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                              {/* User & ID */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <img 
                                      src={user.avatar} 
                                      alt={user.name} 
                                      className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 shadow-2xs"
                                    />
                                    <span className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 ring-2 ring-white ${
                                      isActive ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'
                                    }`} />
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-slate-900 leading-tight hover:text-[#5d5bf6] cursor-pointer" onClick={() => setSelectedUserDetails(user)}>
                                      {user.name}
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                                      <span>{user.email}</span>
                                      <button 
                                        onClick={() => handleCopyText(user.email, 'Email')} 
                                        title="Copy email"
                                        className="text-slate-400 hover:text-slate-600 bg-transparent border-none p-0 cursor-pointer"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="inline-block mt-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-semibold">
                                      {user.id}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Contact & Device */}
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-800 flex items-center gap-1">
                                  <span>{user.phone || 'N/A'}</span>
                                  {user.phone && (
                                    <button 
                                      onClick={() => handleCopyText(user.phone, 'Phone')} 
                                      title="Copy phone"
                                      className="text-slate-400 hover:text-slate-600 bg-transparent border-none p-0 cursor-pointer"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]" title={user.device}>
                                  {user.device || 'Web Session'}
                                </div>
                              </td>

                              {/* Role */}
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                  user.role === 'Admin'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200/70'
                                    : user.role === 'Instructor'
                                    ? 'bg-sky-50 text-sky-700 border border-sky-200/70'
                                    : user.role === 'Moderator'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                                }`}>
                                  {user.role === 'Admin' && <ShieldCheck className="w-3 h-3 text-purple-600" />}
                                  {user.role}
                                </span>
                              </td>

                              {/* Batch / Dept */}
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-800">{user.batch || 'General'}</span>
                              </td>

                              {/* Enrollments & Spend */}
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => setSelectedUserDetails(user)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5d5bf6] bg-[#5d5bf6]/10 px-2 py-0.5 rounded-md hover:bg-[#5d5bf6]/20 transition-colors border-none cursor-pointer"
                                >
                                  <BookOpen className="w-3 h-3" />
                                  <span>{user.enrolledCourses?.length || 0} Courses</span>
                                </button>
                                <div className="text-[11px] font-extrabold text-slate-600 mt-0.5">
                                  ৳{(user.totalSpent || 0).toLocaleString()}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => handleToggleUserStatus(user.id)}
                                  title="Click to toggle status"
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all border ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : isPending
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    isActive ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} />
                                  <span>{user.status}</span>
                                </button>
                              </td>

                              {/* Joined Date */}
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-700">{user.joinedDate}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{user.lastActive || 'Recently'}</div>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* View Profile */}
                                  <button
                                    onClick={() => setSelectedUserDetails(user)}
                                    title="View Full Profile & Enrollments"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#5d5bf6] hover:bg-[#5d5bf6]/10 transition-colors cursor-pointer border-none bg-transparent"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {/* Quick Course Enroll */}
                                  <button
                                    onClick={() => {
                                      setQuickEnrollUser(user);
                                      setSelectedCourseToEnroll(courses[0]?.title || '');
                                    }}
                                    title="Assign Course Access"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer border-none bg-transparent"
                                  >
                                    <BookOpen className="w-4 h-4" />
                                  </button>

                                  {/* Edit User */}
                                  <button
                                    onClick={() => handleOpenEditUser(user)}
                                    title="Edit User Info"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer border-none bg-transparent"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>

                                  {/* Delete User */}
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    title="Delete User"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-none bg-transparent"
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

                {/* Footer Count Bar */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {heroSlides.map((slide, idx) => (
                  <div key={slide.id || idx} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div className="relative aspect-[3.6/1.5] bg-slate-100 overflow-hidden">
                      <img 
                        src={slide.image} 
                        alt={slide.title} 
                        className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = "https://assets.codervai.com/banners/1781465730213-cropped-image.webp";
                        }}
                      />
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 shadow-2xs">
                        Slide #{idx + 1}
                      </span>
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
                        <label className="text-[11px] text-slate-500 font-semibold block mb-1">Image URL</label>
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
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Type: <span className="text-blue-600">{slide.type}</span>
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Delete slide "${slide.title}"?`)) {
                            const updated = heroSlides.filter((_, i) => i !== idx);
                            setHeroSlides(updated);
                            persistAll({ heroSlides: updated });
                            triggerToast('Slide deleted!');
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer p-0 transition-colors"
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
                      className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
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

                          {/* Meta Stats Row */}
                          <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                            <div className="flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-[#5d5bf6]" />
                              <span className="font-bold text-slate-700">{(course.curriculum || []).length}</span>
                              <span className="text-[11px] text-slate-400">Modules</span>
                            </div>
                            <div className="h-3 w-px bg-slate-200" />
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                              <span className="font-bold text-slate-700">{course.features?.length || 0}</span>
                              <span className="text-[11px] text-slate-400">Features</span>
                            </div>
                          </div>

                          {/* Pricing Row */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div>
                              {Number(course.salePrice) === 0 ? (
                                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
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
                            <span className="text-[10px] text-slate-400 font-mono">ID: #{idx + 1}</span>
                          </div>
                        </div>
                      </div>

                      {/* Clean Action Footer */}
                      <div className="p-4 pt-0 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Primary: Curriculum Studio */}
                          <button
                            type="button"
                            onClick={() => openCurriculumStudio(idx, 'curriculum')}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer border-none"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>{(course.isExamBatch || course.category === 'EXAM BATCH') ? 'Quizzes & Questions' : 'Curriculum'}</span>
                          </button>

                          {/* Secondary: Edit Course Details */}
                          <button
                            type="button"
                            onClick={() => openCurriculumStudio(idx, "basic")}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border-none"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit Details</span>
                          </button>
                        </div>

                        {/* Quick Utility Links (Overview & Delete) */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => openCurriculumStudio(idx, "overview")}
                            className="text-slate-500 hover:text-[#5d5bf6] font-medium bg-transparent border-none cursor-pointer p-0 flex items-center gap-1"
                          >
                            <span>Overview & Texts →</span>
                          </button>

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
                            className="text-slate-400 hover:text-rose-600 font-bold bg-transparent border-none cursor-pointer p-0 flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
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

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openCurriculumStudio(idx, 'curriculum')}
                                  title={(course.isExamBatch || course.category === 'EXAM BATCH') ? "Quizzes & Questions Studio" : "Curriculum Studio"}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold transition-all cursor-pointer border-none shadow-2xs"
                                >
                                  {(course.isExamBatch || course.category === 'EXAM BATCH') ? 'Quizzes & Questions' : 'Curriculum'}
                                </button>
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
                          <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-3">
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

                            {bundle.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                {bundle.description}
                              </p>
                            )}

                            {/* Included Courses Preview Chip List */}
                            <div className="pt-2 border-t border-slate-100">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Included in this Pack ({includedCourses.length})
                              </p>
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                {includedCourses.map((c, cIdx) => (
                                  <div 
                                    key={c.id || cIdx}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 font-medium max-w-full"
                                    title={c.title}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#5d5bf6] shrink-0" />
                                    <span className="truncate max-w-[140px]">{c.title}</span>
                                    {c.salePrice !== undefined && Number(c.salePrice) > 0 && (
                                      <span className="text-[10px] text-slate-400 font-semibold shrink-0">৳{c.salePrice}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
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
                <button
                  onClick={() => setShowAddTeacherModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-md shadow-purple-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Add New Instructor
                </button>
              </div>

              {/* Instructors Grid */}
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
                            title="Choose from photo gallery or presets"
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
                        {/* Interactive Avatar with direct gallery click & hidden upload */}
                        <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: '84px' }}>
                          <div 
                            onClick={() => openGalleryModal(inst.image, `Choose Photo for ${inst.name}`, 'Faculty', (newUrl) => {
                              const updated = instructors.map((item, i) => i === idx ? { ...item, image: newUrl } : item);
                              setInstructors(updated);
                              persistAll({ instructors: updated });
                            })}
                            style={{ width: '84px', height: '104px', minWidth: '84px', minHeight: '104px' }}
                            className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-2xs group/avatar cursor-pointer"
                            title="Click to choose from gallery"
                          >
                            <img 
                              src={inst.image} 
                              alt={inst.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                              className="group-hover/avatar:scale-105 transition-transform duration-200" 
                            />
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 text-white">
                              <Camera className="w-4 h-4 text-purple-200" />
                              <span className="text-[9px] font-bold">Change</span>
                            </div>
                          </div>

                          <label className="text-[10px] text-purple-700 hover:text-purple-800 cursor-pointer font-semibold flex items-center gap-1">
                            <Upload className="w-2.5 h-2.5" />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
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
              <div className="border-b border-slate-200/80 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  Website Branding & Contact Info
                </h2>
                <p className="text-xs text-slate-500">
                  Update platform logo, site title, tagline, support hotline, and contact email.
                </p>
              </div>

              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 max-w-2xl">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Platform Title</label>
                  <input
                    type="text"
                    value={siteSettings.siteName}
                    onChange={(e) => {
                      const updated = { ...siteSettings, siteName: e.target.value };
                      setSiteSettings(updated);
                      persistAll({ siteSettings: updated });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-black outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Logo URL / Path</label>
                  <div className="flex items-center gap-3">
                    <img src={siteSettings.logoUrl} alt="Logo" className="w-10 h-10 object-contain bg-slate-100 rounded-xl p-1 border border-slate-200" />
                    <input
                      type="text"
                      value={siteSettings.logoUrl}
                      onChange={(e) => {
                        const updated = { ...siteSettings, logoUrl: e.target.value };
                        setSiteSettings(updated);
                        persistAll({ siteSettings: updated });
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Tagline / Slogan</label>
                  <input
                    type="text"
                    value={siteSettings.siteTagline}
                    onChange={(e) => {
                      const updated = { ...siteSettings, siteTagline: e.target.value };
                      setSiteSettings(updated);
                      persistAll({ siteSettings: updated });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Support Phone</label>
                    <input
                      type="text"
                      value={siteSettings.contactPhone}
                      onChange={(e) => {
                        const updated = { ...siteSettings, contactPhone: e.target.value };
                        setSiteSettings(updated);
                        persistAll({ siteSettings: updated });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Support Email</label>
                    <input
                      type="text"
                      value={siteSettings.contactEmail}
                      onChange={(e) => {
                        const updated = { ...siteSettings, contactEmail: e.target.value };
                        setSiteSettings(updated);
                        persistAll({ siteSettings: updated });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-rose-50/50 p-4 rounded-2xl border border-red-100">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                      <span>YouTube Data API v3 Key</span>
                      <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Auto Playlist Sync</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Enter your Google Cloud Console YouTube Data API v3 key to automatically sync playlists into course lectures.
                  </p>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={siteSettings.youtubeApiKey || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = { ...siteSettings, youtubeApiKey: val };
                      setSiteSettings(updated);
                      try {
                        if (val) localStorage.setItem('eduhunters_yt_api_key', val);
                        else localStorage.removeItem('eduhunters_yt_api_key');
                      } catch {}
                      persistAll({ siteSettings: updated });
                    }}
                    className="w-full bg-white border border-red-200 rounded-xl px-4 py-2 text-xs text-slate-800 font-mono outline-none focus:border-red-500 transition-all"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Reset database to default?</span>
                  <button
                    onClick={handleResetToDefault}
                    className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer transition-all"
                  >
                    Factory Reset
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
                <button
                  onClick={handleSaveAll}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold border-none cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Live</span>
                </button>
              </div>

              {/* Sub-Navigation Pills Bar */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                {[
                  { id: 'courses', label: '📚 Courses Section' },
                  { id: 'faculty', label: '👨‍🏫 Instructors & Faculty' },
                  { id: 'videos', label: '📺 Free Video Classes' },
                  { id: 'ai', label: '🤖 AI Study Partner' },
                  { id: 'contact', label: '📞 Contact & Footer' },
                  { id: 'reviews', label: '🌟 Headers & Reviews' },
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

                {/* 4. WHY CHOOSE US & REVIEWS HEADERS */}
                {textSubTab === 'reviews' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-bold text-slate-900">5. Student Reviews Section Header</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">Badge Text</label>
                          <input
                            type="text"
                            value={sectionTexts.reviewsBadge || ''}
                            onChange={(e) => handleUpdateSectionText('reviewsBadge', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">Main Title</label>
                          <input
                            type="text"
                            value={sectionTexts.reviewsTitle || ''}
                            onChange={(e) => handleUpdateSectionText('reviewsTitle', e.target.value)}
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
                <label className="text-xs font-bold text-slate-700 block mb-1">Image URL (WebP/JPG Link)</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={newSlide.image}
                  onChange={(e) => setNewSlide({ ...newSlide, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Instructor / Mentor</h3>
                  <p className="text-[11px] text-slate-500">Register new academic mentor profile</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTeacherModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-3">
              {/* Photo Selector with Gallery Option */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Instructor Photo</label>
                <div className="flex items-center gap-3">
                  <div style={{ width: '60px', height: '76px', minWidth: '60px' }} className="rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs">
                    <img src={newTeacher.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openGalleryModal(newTeacher.image, 'Choose Instructor Photo', 'Faculty', (newUrl) => {
                          setNewTeacher(prev => ({ ...prev, image: newUrl }));
                        })}
                        className="px-3.5 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                        <span>Choose Gallery</span>
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
                            if (file) handleDeviceFileUpload(file, (newUrl) => setNewTeacher(prev => ({ ...prev, image: newUrl })));
                          }}
                        />
                      </label>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Select from library presets or upload from device gallery</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Instructor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sazzad Hossain"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value, badge: e.target.value.split(' ')[0] })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Designation / Role</label>
                <input
                  type="text"
                  placeholder="e.g. BIOLOGY INSTRUCTOR"
                  value={newTeacher.designation}
                  onChange={(e) => setNewTeacher({ ...newTeacher, designation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Short Bio & Academy</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dhaka Medical College (MBBS)"
                  value={newTeacher.bio}
                  onChange={(e) => setNewTeacher({ ...newTeacher, bio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-purple-500/20 transition-all"
                >
                  Save Instructor
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
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
      {galleryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {galleryTitle || 'Choose Image from Gallery'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pick from curated presets or upload directly from your device gallery.
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
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
              {/* Option 1: Upload from Device Gallery */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Option 1: Choose from Device Gallery / File
                </label>
                <label className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-center gap-3.5 cursor-pointer transition-all text-center sm:text-left group">
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
                          if (galleryCallback) galleryCallback(newUrl);
                        });
                      }
                    }}
                  />
                </label>
              </div>

              {/* Option 2: Curated Presets Library */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Option 2: Curated Presets Library
                  </label>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {PRESET_GALLERY_IMAGES.map((cat) => (
                      <button
                        key={cat.category}
                        type="button"
                        onClick={() => setGalleryCategory(cat.category)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                          galleryCategory === cat.category
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'bg-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {cat.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thumbnails Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {(PRESET_GALLERY_IMAGES.find(c => c.category === galleryCategory)?.items || []).map((item, idx) => {
                    const isSelected = gallerySelectedUrl === item.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setGallerySelectedUrl(item.url)}
                        className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all p-0 group bg-slate-100 cursor-pointer shadow-2xs ${
                          isSelected 
                            ? 'border-purple-600 ring-2 ring-purple-500/30 shadow-md scale-98' 
                            : 'border-slate-200 hover:border-purple-300 hover:scale-102'
                        }`}
                      >
                        <img 
                          src={item.url} 
                          alt={item.label} 
                          className="w-full h-full object-cover object-top" 
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-left">
                          <span className="text-[10px] font-bold text-white leading-tight block truncate">
                            {item.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
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
                    />
                    <div className="hidden sm:block min-w-0">
                      <span className="text-xs font-bold text-slate-900 block">Selected Photo</span>
                      <span className="text-[10px] text-emerald-600 font-semibold block truncate">Ready to apply</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 italic">No image selected</span>
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
      )}

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
                  setEnrolledStudents(prev => prev.map(st => {
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
                  }));
                  triggerToast(`✅ Student info updated for ${newStudentData.name}!`);
                } else {
                  const newIdNumber = Math.floor(100 + Math.random() * 900);
                  const newEntry = {
                    id: `st-${Date.now()}`,
                    name: newStudentData.name.trim(),
                    studentId: `EH-2026-${newIdNumber}`,
                    batch: newStudentData.batch,
                    courseName: newStudentData.courseName,
                    phone: newStudentData.phone.trim(),
                    email: newStudentData.email.trim() || `student${newIdNumber}@eduhunters.com`,
                    avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=100&auto=format&fit=crop&q=80`,
                    status: newStudentData.status || 'Active',
                    joinedDate: 'Today'
                  };
                  setEnrolledStudents([newEntry, ...enrolledStudents]);
                  triggerToast(`🎉 Student "${newEntry.name}" enrolled successfully!`);
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
                    <div className="text-lg font-black text-emerald-600">
                      ৳{selectedTxDetails.amount}
                    </div>
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
      {selectedUserDetails && (
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
                Enrolled Courses ({selectedUserDetails.enrolledCourses?.length || 0})
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</div>
                      <div className="text-xs font-extrabold text-slate-800 mt-1">{selectedUserDetails.phone || 'N/A'}</div>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Batch / Program</div>
                      <div className="text-xs font-extrabold text-slate-800 mt-1">{selectedUserDetails.batch || 'General'}</div>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Registered Device</div>
                      <div className="text-xs font-extrabold text-slate-800 mt-1">{selectedUserDetails.device || 'Web Session'}</div>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Last Activity</div>
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
                    <span className="text-xs font-bold text-slate-800">Assigned Courses & Batches</span>
                    <button
                      onClick={() => {
                        setQuickEnrollUser(selectedUserDetails);
                        setSelectedCourseToEnroll(courses[0]?.title || '');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold cursor-pointer border-none shadow-xs"
                    >
                      + Assign Course
                    </button>
                  </div>

                  {(selectedUserDetails.enrolledCourses || []).length === 0 ? (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                      <p className="text-xs font-bold text-slate-600">No active course enrollments</p>
                      <p className="text-[11px] text-slate-400">Click "+ Assign Course" to grant course access to this student.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedUserDetails.enrolledCourses.map((cTitle, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#5d5bf6]/10 text-[#5d5bf6] flex items-center justify-center font-bold text-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800">{cTitle}</div>
                              <div className="text-[10px] text-emerald-600 font-semibold">Active Access Pass</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRevokeCourseFromUser(selectedUserDetails.id, cTitle)}
                            className="text-xs text-rose-600 font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
      )}

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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input 
                    type="text"
                    placeholder="01700-000000"
                    value={userForm.phone}
                    onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    <option value="Active">🟢 Active</option>
                    <option value="Pending">🟡 Pending Verification</option>
                    <option value="Suspended">🔴 Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batch / Department</label>
                <input 
                  type="text"
                  placeholder="e.g. HSC 26, Medical 25, Engineering"
                  value={userForm.batch}
                  onChange={(e) => setUserForm(prev => ({ ...prev, batch: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
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
      {quickEnrollUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Assign Course Access</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Grant course or batch access directly to <strong className="text-slate-800">{quickEnrollUser.name}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Course or Combo Bundle from Catalog</label>
              <select
                value={selectedCourseToEnroll}
                onChange={(e) => setSelectedCourseToEnroll(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
              >
                <option value="">-- কোর্স অথবা কম্বো বান্ডিল বেছে নিন --</option>
                {bundles && bundles.length > 0 && (
                  <optgroup label="🎁 Combo Bundles (এক ক্লিকে সকল কোর্স আনলক)">
                    {bundles.map((b) => (
                      <option key={b.id} value={`bundle:${b.id}`}>
                        🎁 {b.title} ({b.courseIds?.length || 0}টি কোর্স অন্তর্ভুক্ত)
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="📚 Individual Courses & Batches">
                  {courses.map((c, i) => (
                    <option key={c.id || i} value={c.title}>
                      {c.title} ({c.category || 'Course'})
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                💡 টিপ: কোনো কম্বো বান্ডিল সিলেক্ট করলে ঐ বান্ডিলের সকল ৩টি/৪টি কোর্স এক ক্লিকেই শিক্ষার্থীর একাউন্টে যুক্ত হয়ে যাবে।
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickEnrollUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedCourseToEnroll}
                onClick={() => handleAssignCourseToUser(quickEnrollUser.id, selectedCourseToEnroll)}
                className="px-5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none"
              >
                Assign Access
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
