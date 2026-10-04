import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
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
  ArrowDown
} from 'lucide-react';
import { initialData, isZenithCopiedCourse } from '../data/mockData';
import { masterEnglishCourseData } from '../data/masterEnglishCourseData';

export default function AdminPanel({ data, onUpdateData, onResetData, onExitAdmin }) {
  // Navigation Tabs: overview, accounting, slides, stats, courses, instructors, videos, store, settings
  const [activeTab, setActiveTab] = useState('overview');

  // Bulletproof state initialization - NEVER empty or undefined
  const [siteSettings, setSiteSettings] = useState(() => ({
    ...initialData.siteSettings,
    ...(data?.siteSettings || {})
  }));

  const [announcement, setAnnouncement] = useState(() => 
    data?.announcement || initialData.announcement
  );

  const [heroSlides, setHeroSlides] = useState(() => 
    (Array.isArray(data?.heroSlides) && data.heroSlides.length > 0) 
      ? data.heroSlides 
      : initialData.heroSlides
  );

  const [homeStats, setHomeStats] = useState(() => 
    (Array.isArray(data?.homeStats) && data.homeStats.length > 0) 
      ? data.homeStats 
      : initialData.homeStats
  );

  const [courses, setCourses] = useState(() => {
    const raw = (Array.isArray(data?.courses) && data.courses.length > 0) 
      ? data.courses 
      : initialData.courses;
    const cleaned = raw.filter(c => !isZenithCopiedCourse(c));
    return cleaned.length > 0 ? cleaned : initialData.courses;
  });

  const [categories, setCategories] = useState(() => {
    const raw = (Array.isArray(data?.categories) && data.categories.length > 0) 
      ? data.categories 
      : (initialData.categories || [
          "সকল",
          "EXAM BATCH",
          "Medical",
          "Free"
        ]);
    return raw
      .filter(c => !["HSC 25", "Engineering", "HSC 27", "HSC 28", "HSC 26"].includes(c))
      .map(c => c === "University A Unit" ? "Free" : c);
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryIdx, setEditingCategoryIdx] = useState(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [adminCourseCategoryFilter, setAdminCourseCategoryFilter] = useState('সকল');
  const [categoryViewTab, setCategoryViewTab] = useState('preview'); // 'preview' | 'manage'

  const [instructors, setInstructors] = useState(() => 
    (Array.isArray(data?.instructors) && data.instructors.length > 0) 
      ? data.instructors 
      : initialData.instructors
  );

  const [freeVideos, setFreeVideos] = useState(() => 
    (Array.isArray(data?.freeVideos) && data.freeVideos.length > 0) 
      ? data.freeVideos 
      : initialData.freeVideos
  );

  const [storeProducts, setStoreProducts] = useState(() => 
    (Array.isArray(data?.storeProducts) && data.storeProducts.length > 0) 
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
    (Array.isArray(data?.whyChooseUs) && data.whyChooseUs.length > 0)
      ? data.whyChooseUs
      : initialData.whyChooseUs
  );

  const [showAddWhyModal, setShowAddWhyModal] = useState(false);
  const [newWhyPoint, setNewWhyPoint] = useState({
    number: '05',
    title: '',
    desc: ''
  });

  // Clean Sub-Navigation for Section Texts (Eliminates Clutter)
  const [textSubTab, setTextSubTab] = useState('courses');

  // Modern SaaS Dashboard View Filters
  const [calendarView, setCalendarView] = useState('Week');
  const [calendarMonth, setCalendarMonth] = useState('January, 2026');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 7 Months');

  // Edu Hunters Real Enrolled Students State
  const [enrolledStudents, setEnrolledStudents] = useState([
    {
      id: 'st-101',
      name: 'মোঃ তানভীর হাসান',
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
      name: 'আফরোজা সুলতানা',
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
      name: 'রাকিবুল ইসলাম',
      studentId: 'EH-2026-115',
      batch: 'HSC 28',
      courseName: 'সানজিদ ভাইয়ার সকল ব্যাচ একসাথে',
      phone: '01823-998877',
      email: 'rakibul.hsc28@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      status: 'Active',
      joinedDate: '29 Sep 2026'
    },
    {
      id: 'st-104',
      name: 'সাদিয়া তাসনিম',
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
      name: 'আবির মাহমুদ',
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
      title: 'Biology Live Class (DMC Sanjid Siraj)',
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
      title: 'কোর্স এনরোলমেন্ট কনফার্মড: আফরোজা সুলতানা',
      sub: 'Biology Extra Info Compact PDF',
      time: '১০ মিনিট আগে',
      tag: 'Enrollment',
      icon: 'check',
      color: 'emerald'
    },
    {
      id: 'act2',
      title: 'নতুন লাইভ এক্সাম সাবমিশন: রাকিবুল ইসলাম',
      sub: 'HSC Physics ১ম পত্র ভেক্টর মেগা টেস্ট (মার্কস: ১৪/১৫)',
      time: '২৫ মিনিট আগে',
      tag: 'Exam',
      icon: 'exam',
      color: 'blue'
    },
    {
      id: 'act3',
      title: 'bKash পেমেন্ট ভেরিফাইড (৳২৯৯৯)',
      sub: 'TrxID: 9KJ34LA01X • শিক্ষার্থী: মোঃ তানভীর',
      time: '১ ঘণ্টা আগে',
      tag: 'Payment',
      icon: 'payment',
      color: 'pink'
    },
    {
      id: 'act4',
      title: 'Edu Hunters AI স্টাডি অ্যাসিস্ট্যান্ট কিউরি',
      sub: 'টপিক: হৃদপিণ্ডের প্রাকৃতিক পেসমেকার মেকানিজম',
      time: '২ ঘণ্টা আগে',
      tag: 'AI Study',
      icon: 'sparkle',
      color: 'purple'
    },
    {
      id: 'act5',
      title: 'Edu Hunters Store PDF ডেলিভারি কমপ্লিট',
      sub: 'Medical Biology Question Bank (ডাউনলোড সম্পন্ন)',
      time: '৩ ঘণ্টা আগে',
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
        { label: 'Sanjid Siraj (DMC)', url: 'https://assets.codervai.com/teachers/1781366052322-cropped-image.webp' },
        { label: 'Tofayel Ahmed (BUET)', url: 'https://assets.codervai.com/teachers/1781363906472-cropped-image.webp' },
        { label: 'Nazmuddin Al Aquib (DMC)', url: 'https://assets.codervai.com/teachers/1781465492086-cropped-image.webp' },
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
    const fullState = {
      ...data,
      siteSettings: overrides.siteSettings || siteSettings,
      announcement: overrides.announcement !== undefined ? overrides.announcement : announcement,
      heroSlides: overrides.heroSlides || heroSlides,
      homeStats: overrides.homeStats || homeStats,
      categories: overrides.categories || categories,
      courses: overrides.courses || courses,
      instructors: overrides.instructors || instructors,
      freeVideos: overrides.freeVideos || freeVideos,
      storeProducts: overrides.storeProducts || storeProducts,
      accounting: overrides.accounting || accounting,
      sectionTexts: overrides.sectionTexts || sectionTexts,
      whyChooseUs: overrides.whyChooseUs || whyChooseUs
    };
    onUpdateData(fullState);
    return fullState;
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
      setInstructors(initialData.instructors);
      setFreeVideos(initialData.freeVideos);
      setStoreProducts(initialData.storeProducts);
      setAccounting(initialData.accounting);
      setSectionTexts(initialData.sectionTexts);
      setWhyChooseUs(initialData.whyChooseUs);
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
    const updated = (accounting.transactions || []).map(t => {
      if (t.id === trxId) return { ...t, status: 'Completed' };
      return t;
    });
    const newAcc = { ...accounting, transactions: updated };
    setAccounting(newAcc);
    persistAll({ accounting: newAcc });
    triggerToast('✅ Enrollment approved successfully!');
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
      category: newCourse.category || categories.find(c => c !== 'সকল') || 'Medical',
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
      triggerToast('⚠️ অনুগ্রহ করে ক্যাটাগরির নাম লিখুন');
      return;
    }
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      triggerToast('⚠️ এই ক্যাটাগরিটি ইতিমধ্যে বিদ্যমান আছে');
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    persistAll({ categories: updated });
    setNewCategoryName('');
    triggerToast(`✅ "${trimmed}" ক্যাটাগরি সফলভাবে যুক্ত হয়েছে!`);
  };

  const handleDeleteCategory = (catToDelete) => {
    if (catToDelete === "সকল") {
      triggerToast('⚠️ "সকল" ক্যাটাগরি ডিফল্ট ফিল্টার হিসেবে মুছে ফেলা যাবে না');
      return;
    }
    const coursesCount = courses.filter(c => c.category === catToDelete).length;
    let confirmMsg = `আপনি কি নিশ্চিতভাবে "${catToDelete}" ক্যাটাগরি মুছে ফেলতে চান?`;
    if (coursesCount > 0) {
      confirmMsg += `\n\nসতর্কতা: ${coursesCount} টি কোর্স এই ক্যাটাগরিতে অন্তর্ভুক্ত রয়েছে। মুছে ফেললে কোর্সগুলো অন্য ক্যাটাগরিতে স্থানান্তরিত হবে।`;
    }
    if (!confirm(confirmMsg)) return;

    const updatedCategories = categories.filter(c => c !== catToDelete);
    const fallbackCat = updatedCategories.find(c => c !== 'সকল') || 'EXAM BATCH';
    const updatedCourses = courses.map(c => c.category === catToDelete ? { ...c, category: fallbackCat } : c);

    setCategories(updatedCategories);
    setCourses(updatedCourses);
    persistAll({ categories: updatedCategories, courses: updatedCourses });
    if (adminCourseCategoryFilter === catToDelete) {
      setAdminCourseCategoryFilter('সকল');
    }
    triggerToast(`🗑️ "${catToDelete}" ক্যাটাগরি মুছে ফেলা হয়েছে!`);
  };

  const handleStartEditCategory = (idx, name) => {
    if (name === "সকল") {
      triggerToast('⚠️ "সকল" মূল সিস্টেম ফিল্টার, এটি পরিবর্তনযোগ্য নয়');
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
      triggerToast('⚠️ এই নামের ক্যাটাগরি ইতিমধ্যে রয়েছে');
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
    triggerToast(`✏️ "${oldName}" পরিবর্তন করে "${newName}" করা হয়েছে!`);
  };

  const handleCourseCategoryChange = (courseIdx, newCat) => {
    const updated = courses.map((c, i) => i === courseIdx ? { ...c, category: newCat } : c);
    setCourses(updated);
    persistAll({ categories, courses: updated });
    triggerToast(`✅ কোর্সের ক্যাটাগরি পরিবর্তিত: ${newCat}`);
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
    setShowCurriculumModal(true);
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
    if (window.confirm('আপনি কি এই কোর্সে মাস্টার ইংলিশ কারিকুলাম ও ইনফো লোড করতে চান?')) {
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
      triggerToast('🎉 কোর্স সিলেবাস সফলভাবে লোড হয়েছে!');
    }
  };

  const handleAddSection = () => {
    mutateCurrentCourse(c => {
      const curr = Array.isArray(c.curriculum) ? [...c.curriculum] : [];
      const newSecId = curr.length > 0 ? Math.max(...curr.map(s => Number(s.id) || 0)) + 1 : 1;
      const newSection = {
        id: newSecId,
        name: `মডিউল 0${newSecId}: নতুন বিষয় / অধ্যায় সমূহ`,
        summary: '১ টি অধ্যায় · ১ টি লেকচার',
        chapters: [
          {
            name: 'অধ্যায় ১: প্রাথমিক পরিচিতি ও থিওরি',
            count: 1,
            lessons: [
              {
                id: `les-${Date.now()}`,
                title: 'লেকচার ০১: অরিয়েন্টেশন ও সিলেবাস রূপরেখা',
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
    triggerToast('➕ নতুন মডিউল তৈরি হয়েছে!');
  };

  const handleDeleteSection = (secIdx) => {
    if (window.confirm('এই সম্পূর্ণ মডিউলটি ডিলিট করতে চান? এর ভিতরের সব চ্যাপ্টার ও ক্লাস মুছে যাবে।')) {
      mutateCurrentCourse(c => {
        const curr = [...(c.curriculum || [])];
        curr.splice(secIdx, 1);
        return { ...c, curriculum: curr };
      });
      triggerToast('🗑️ মডিউল মুছে ফেলা হয়েছে');
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
        name: `নতুন অধ্যায় ${chaps.length + 1}`,
        count: 0,
        lessons: []
      });
      sec.chapters = chaps;
      sec.summary = `${chaps.length} chapters · ${chaps.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0)} lessons`;
      curr[secIdx] = sec;
      return { ...c, curriculum: curr };
    });
    triggerToast('➕ নতুন চ্যাপ্টার যোগ হয়েছে');
  };

  const handleDeleteChapter = (secIdx, chapIdx) => {
    if (window.confirm('এই চ্যাপ্টারটি ডিলিট করতে চান?')) {
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
      triggerToast('🗑️ চ্যাপ্টার মুছে ফেলা হয়েছে');
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
      triggerToast('⚠️ অনুগ্রহ করে ক্লাসের শিরোনাম লিখুন');
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
    triggerToast('✅ নতুন ক্লাস সফলভাবে যোগ করা হয়েছে!');
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
    triggerToast('🗑️ ক্লাস ডিলিট করা হয়েছে');
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
    triggerToast('✅ ফিচার যুক্ত হয়েছে');
  };

  const handleRemoveFeature = (featIdx) => {
    mutateCurrentCourse(c => {
      const currentFeats = Array.isArray(c.features) ? [...c.features] : [];
      currentFeats.splice(featIdx, 1);
      return { ...c, features: currentFeats };
    });
    triggerToast('ফিচার মুছে ফেলা হয়েছে');
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

  // Add Video
  const handleAddVideo = (e) => {
    e.preventDefault();
    if (!newVideo.videoId) return;
    const item = {
      id: Date.now(),
      videoId: newVideo.videoId.trim(),
      title: newVideo.title || 'YouTube Class',
      desc: newVideo.desc || newVideo.title || 'Class Video'
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

  // Pending Enrollment Count
  const pendingCount = (accounting?.transactions || []).filter(tx => tx.status !== 'Completed').length;

  // Filtered Transactions
  const filteredTransactions = (accounting.transactions || []).filter(tx => {
    const matchesSearch = 
      (tx.studentName || '').toLowerCase().includes(searchTrx.toLowerCase()) ||
      (tx.itemTitle || '').toLowerCase().includes(searchTrx.toLowerCase()) ||
      (tx.trxId || '').toLowerCase().includes(searchTrx.toLowerCase()) ||
      (tx.studentPhone || '').includes(searchTrx);
    if (trxFilter === 'PENDING') return matchesSearch && tx.status !== 'Completed';
    if (trxFilter === 'INCOME') return matchesSearch && tx.type === 'INCOME';
    if (trxFilter === 'EXPENSE') return matchesSearch && tx.type === 'EXPENSE';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* FLOATING SUCCESS TOAST */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span className="font-bold text-sm">{toastMsg}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center font-black text-white text-xs shadow-sm">
              EH
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{siteSettings.siteName || 'EDU HUNTERS'}</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Admin Management</span>
            </div>
          </div>
        </div>

        {/* Search Bar from Reference Image */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search students, courses, transactions..."
              value={searchTrx}
              onChange={(e) => setSearchTrx(e.target.value)}
              className="w-full bg-slate-100/80 border border-slate-200/70 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Global Save, Backup, Notifications & Profile Avatar */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddCourseModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs border border-pink-200/60 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>

          <button
            onClick={handleExportData}
            title="Download database JSON backup"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-all"
          >
            <Download className="w-3 h-3" />
            <span>Backup</span>
          </button>

          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer border-none"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Notification Bell */}
          <div className="relative p-1.5 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors">
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1 ring-2 ring-white" />
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-xs cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
              alt="Admin" 
              className="w-full h-full object-cover"
            />
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
          background: '#f1f5f9',
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
          {/* GROUP 1: DASHBOARD */}
          <div style={{ padding: '4px 10px', marginBottom: '2px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, color: '#94a3b8' }}>
              MAIN MENU
            </span>
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200/50 font-bold shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Dashboard</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('accounting')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'accounting'
                ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200/50 font-bold shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <DollarSign className={`w-4 h-4 shrink-0 ${activeTab === 'accounting' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Enrollments & Ledger</span>
            </div>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {pendingCount}
              </span>
            )}
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
              activeTab === 'courses'
                ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200/50 font-bold shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'courses' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Courses & Bundles</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{courses.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('instructors')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'instructors'
                ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200/50 font-bold shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <GraduationCap className={`w-4 h-4 shrink-0 ${activeTab === 'instructors' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Faculty & Mentors</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{instructors.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('store')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'store'
                ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200/50 font-bold shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className={`w-4 h-4 shrink-0 ${activeTab === 'store' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Book & PDF Store</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">{storeProducts.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'videos'
                ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200/50 font-bold shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Video className={`w-4 h-4 shrink-0 ${activeTab === 'videos' ? 'text-blue-600' : 'text-slate-400'}`} />
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
              activeTab === 'slides'
                ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200/50 font-bold shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sliders className={`w-4 h-4 shrink-0 ${activeTab === 'slides' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Hero Slider</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('sectionTexts')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'sectionTexts'
                ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200/50 font-bold shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Type className={`w-4 h-4 shrink-0 ${activeTab === 'sectionTexts' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Section Texts</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('whyChoose')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'whyChoose'
                ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200/50 font-bold shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <HelpCircle className={`w-4 h-4 shrink-0 ${activeTab === 'whyChoose' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Why Choose Us</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200/50 font-bold shadow-xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100/70 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <PieChart className={`w-4 h-4 shrink-0 ${activeTab === 'stats' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Counters & Notice</span>
            </div>
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
            background: '#f8fafd',
            overflowY: 'auto'
          }}
        >
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

                {/* THE 3 CANDY PASTEL STAT CARDS (Pink, Butter Yellow, Periwinkle Blue) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* CARD 1: SOFT PASTEL PINK (Total Enrolled Students) */}
                  <div className="bg-[#ffd5df] rounded-3xl p-5 border border-pink-200/80 shadow-2xs relative flex flex-col justify-between min-h-[145px] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Total Enrolled Students</span>
                      <button 
                        type="button" 
                        onClick={() => triggerToast('📊 মোট শিক্ষার্থী তালিকা ভিউ করা হচ্ছে')}
                        title="Options"
                        className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-slate-600 flex items-center justify-center cursor-pointer transition-colors shadow-2xs border-none"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight my-1">
                      {(3840 + enrolledStudents.length).toLocaleString()}
                    </div>

                    <div className="flex items-center">
                      <span className="bg-white/85 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-bold text-slate-700 inline-flex items-center gap-1 shadow-2xs">
                        <span>HSC & Admission</span>
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-extrabold">+24% This Month</span>
                      </span>
                    </div>
                  </div>

                  {/* CARD 2: SOFT BUTTER YELLOW (Pending Verifications & Enrollments) */}
                  <div className="bg-[#ffe494] rounded-3xl p-5 border border-amber-200/80 shadow-2xs relative flex flex-col justify-between min-h-[145px] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Pending Verification</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setTrxFilter('PENDING');
                          setActiveTab('accounting');
                        }}
                        title="View Pending Enrollments"
                        className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-slate-600 flex items-center justify-center cursor-pointer transition-colors shadow-2xs border-none"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight my-1">
                      {pendingCount > 0 ? pendingCount : 12}
                    </div>

                    <div className="flex items-center">
                      <span className="bg-white/85 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-bold text-slate-700 inline-flex items-center gap-1 shadow-2xs">
                        <span>bKash / Nagad Trx</span>
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span className="text-amber-800 font-extrabold">Needs Review</span>
                      </span>
                    </div>
                  </div>

                  {/* CARD 3: SOFT PERIWINKLE BLUE (Active Live Batches & Mega Exams) */}
                  <div className="bg-[#cfe0fc] rounded-3xl p-5 border border-blue-200/80 shadow-2xs relative flex flex-col justify-between min-h-[145px] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Active Batches & Courses</span>
                      <button 
                        type="button" 
                        onClick={() => setActiveTab('courses')}
                        title="Manage Courses"
                        className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-slate-600 flex items-center justify-center cursor-pointer transition-colors shadow-2xs border-none"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight my-1">
                      {courses.length} Batches
                    </div>

                    <div className="flex items-center">
                      <span className="bg-white/85 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-bold text-slate-700 inline-flex items-center gap-1 shadow-2xs">
                        <span>HSC 25, 26, 27, 28</span>
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-700 font-extrabold">Running Smooth</span>
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* 2-COLUMN SPLIT DASHBOARD LAYOUT */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: ACADEMIC CALENDAR ROUTINE & RECENT ENROLLED STUDENTS (8 Cols) */}
                <div className="xl:col-span-8 space-y-6">
                  

                  {/* RECENTLY ENROLLED STUDENTS TABLE & MANAGEMENT */}
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                              <span>Recently Enrolled Students</span>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 border border-pink-100">
                                {enrolledStudents.length} Students
                              </span>
                            </h3>
                            <p className="text-[11px] text-slate-400">Edu Hunters প্ল্যাটফর্মে শিক্ষার্থীদের সরাসরি ম্যানুয়াল এনরোলমেন্ট ও তথ্য ব্যবস্থাপনা</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Quick Search */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text"
                            placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
                            value={studentSearchQuery}
                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 w-44 sm:w-48 transition-all placeholder:text-slate-400"
                          />
                        </div>

                        {/* Batch Filter Dropdown */}
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-full border border-slate-200/80">
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

                        {/* Direct Manual Enroll Button */}
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
                          className="px-3.5 py-1.5 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 shadow-sm shadow-pink-600/20 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Enroll Student</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[620px]">
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
                          {enrolledStudents
                            .filter(st => {
                              const matchesBatch = studentBatchFilter === 'ALL' || st.batch === studentBatchFilter;
                              const matchesQuery = 
                                (st.name || '').toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                                (st.phone || '').includes(studentSearchQuery) ||
                                (st.studentId || '').toLowerCase().includes(studentSearchQuery.toLowerCase());
                              return matchesBatch && matchesQuery;
                            })
                            .map((st) => (
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
                                    triggerToast(`${st.name}-এর স্ট্যাটাস পরিবর্তন করা হয়েছে`);
                                  }}
                                  title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
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
                                      if (confirm(`আপনি কি সত্যিই ${st.name}-কে তালিকা থেকে অপসারণ করতে চান?`)) {
                                        setEnrolledStudents(prev => prev.filter(item => item.id !== st.id));
                                        triggerToast(`🗑️ ${st.name}-কে তালিকা থেকে অপসারণ করা হয়েছে`);
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
                        <p className="text-[11px] text-slate-400">ক্যাটাগরি অনুযায়ী শিক্ষার্থী বণ্টন</p>
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
                    <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">৳{(accounting?.totalRevenue || 0).toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{accounting?.totalOrders || 0} completed orders</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Total Expenses</p>
                    <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">৳{(accounting?.totalExpenses || 0).toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Servers, SMS, domain & operations</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Net Profit / Balance</p>
                    <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">৳{(accounting?.netProfit || 0).toLocaleString()}</p>
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
          {/* TAB 5: COURSES & BUNDLES */}
          {/* ========================================================= */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    Courses & Bundles Directory ({courses.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage course pricing, discount fees, bundle badges, and cover images.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCourseModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Add New Course
                </button>
              </div>

              {/* Category Management Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
                {/* Card Top Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60 shadow-xs">
                      <Filter className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                          কোর্স ক্যাটাগরি ও ফিল্টার পিলস
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700">
                          {categories.length} টি ব্যাচ
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        হোমপেজের লাইভ ফিল্টার প্রিভিউ এবং ক্যাটাগরি ব্যবস্থাপনা
                      </p>
                    </div>
                  </div>

                  {/* Segmented View Mode Switcher */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setCategoryViewTab('preview')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                        categoryViewTab === 'preview'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'bg-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>লাইভ ফিল্টার প্রিভিউ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryViewTab('manage')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                        categoryViewTab === 'manage'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'bg-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>ক্যাটাগরি ম্যানেজ ও এডিট</span>
                    </button>
                  </div>
                </div>

                {/* VIEW 1: LIVE FILTER PREVIEW (100% Clean, Exactly Like Website) */}
                {categoryViewTab === 'preview' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {categories.map((cat, cIdx) => {
                        const count = cat === "সকল" 
                          ? courses.length 
                          : courses.filter(c => c.category === cat).length;
                        const isFilterActive = adminCourseCategoryFilter === cat;

                        return (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => setAdminCourseCategoryFilter(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer select-none flex items-center gap-1.5 ${
                              isFilterActive
                                ? 'bg-[#111827] text-white border-[#111827] shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <span>{cat}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                              isFilterActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}

                      {/* Clean Action Button to switch to Manage Mode */}
                      <button
                        type="button"
                        onClick={() => setCategoryViewTab('manage')}
                        className="px-3.5 py-2 rounded-full text-xs font-bold transition-all border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ক্যাটাগরি যোগ বা এডিট</span>
                      </button>
                    </div>

                    {/* Helpful subtle footer */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>💡 যেকোনো পিলের ওপর ক্লিক করে নিচের কোর্সগুলো ফিল্টার করুন। হোমপেজে এই সিরিয়ালে পিলগুলো প্রদর্শিত হবে।</span>
                      <button
                        type="button"
                        onClick={() => setCategoryViewTab('manage')}
                        className="text-blue-600 hover:underline font-bold bg-transparent border-none cursor-pointer p-0"
                      >
                        ক্যাটাগরি এডিট করতে চান?
                      </button>
                    </div>
                  </div>
                )}

                {/* VIEW 2: MANAGE & EDIT CATEGORIES (Organized & Spacious) */}
                {categoryViewTab === 'manage' && (
                  <div className="space-y-4">
                    {/* Add Category Form */}
                    <form onSubmit={handleAddCategory} className="flex flex-wrap items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                        <span className="text-slate-400 pl-1">
                          <Plus className="w-4 h-4 text-blue-600" />
                        </span>
                        <input
                          type="text"
                          placeholder="নতুন ক্যাটাগরির নাম লিখুন (যেমন: Varsity C Unit, HSC 29)..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-none cursor-pointer transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        ক্যাটাগরি যুক্ত করুন
                      </button>
                    </form>

                    {/* Category Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categories.map((cat, cIdx) => {
                        const count = cat === "সকল" 
                          ? courses.length 
                          : courses.filter(c => c.category === cat).length;
                        const isEditing = editingCategoryIdx === cIdx;

                        if (isEditing) {
                          return (
                            <div 
                              key={cIdx}
                              className="p-3 bg-blue-50/70 border-2 border-blue-500 rounded-2xl flex items-center justify-between gap-2 shadow-xs"
                            >
                              <input
                                type="text"
                                value={editingCategoryValue}
                                onChange={(e) => setEditingCategoryValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEditCategory(cIdx);
                                  if (e.key === 'Escape') setEditingCategoryIdx(null);
                                }}
                                autoFocus
                                className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none"
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditCategory(cIdx)}
                                  title="সংরক্ষণ করুন"
                                  className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer border-none flex items-center justify-center"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCategoryIdx(null)}
                                  title="বাতিল করুন"
                                  className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer border-none flex items-center justify-center"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={cIdx}
                            className="p-3.5 bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl flex items-center justify-between gap-3 transition-all hover:shadow-xs group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {cat}
                                </h4>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {cat === "সকল" ? `মোট ${count} টি কোর্স` : `${count} টি কোর্স অন্তর্ভুক্ত`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {cat === "সকল" ? (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                  সিস্টেম
                                </span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditCategory(cIdx, cat)}
                                    title="নাম পরিবর্তন করুন"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(cat)}
                                    title="ক্যাটাগরি মুছুন"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Manage Mode Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <span>সকল পরিবর্তন স্বয়ংক্রিয়ভাবে সংরক্ষিত ও হোমপেজে লাইভ আপডেট হয়।</span>
                      <button
                        type="button"
                        onClick={() => setCategoryViewTab('preview')}
                        className="text-blue-600 font-bold hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>লাইভ ফিল্টার প্রিভিউ দেখুন</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Course Filter Bar Info */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 tracking-wide uppercase">
                    {adminCourseCategoryFilter === 'সকল' 
                      ? `সকল কোর্সসমূহ (${courses.length} টি)`
                      : `ফিল্টারকৃত কোর্স: "${adminCourseCategoryFilter}" (${courses.filter(c => c.category === adminCourseCategoryFilter).length} টি)`}
                  </span>
                  {adminCourseCategoryFilter !== 'সকল' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700">
                      ক্যাটাগরি ফিল্টার সক্রিয়
                    </span>
                  )}
                </div>
                {adminCourseCategoryFilter !== 'সকল' && (
                  <button
                    onClick={() => setAdminCourseCategoryFilter('সকল')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200/80 cursor-pointer transition-all flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>সকল কোর্স দেখুন (Reset Filter)</span>
                  </button>
                )}
              </div>

              {/* Course Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses
                  .map((course, originalIdx) => ({ course, originalIdx }))
                  .filter(({ course }) => adminCourseCategoryFilter === 'সকল' || course.category === adminCourseCategoryFilter)
                  .map(({ course, originalIdx: idx }) => (
                  <div key={course.id || idx} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
                    <div>
                      <div className="relative aspect-video bg-slate-100 overflow-hidden group/cover">
                        <img 
                          src={course.image} 
                          alt={course.title} 
                          className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
                        />
                        {course.isBundle && (
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-white shadow-xs">
                            Bundle
                          </span>
                        )}
                        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-700 shadow-2xs">
                          {course.category}
                        </span>

                        <div 
                          onClick={() => openGalleryModal(course.image, `Choose Cover for ${course.title}`, 'Courses', (newUrl) => {
                            const updated = courses.map((c, i) => i === idx ? { ...c, image: newUrl } : c);
                            setCourses(updated);
                            persistAll({ courses: updated });
                          })}
                          className="absolute inset-0 bg-slate-900/50 backdrop-blur-2xs opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer text-white text-xs font-bold"
                        >
                          <Camera className="w-4 h-4 text-blue-300" />
                          <span>Change Cover</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <label className="text-[11px] text-slate-500 font-semibold block mb-1">Course Title</label>
                          <input
                            type="text"
                            value={course.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = courses.map((c, i) => i === idx ? { ...c, title: val } : c);
                              setCourses(updated);
                              persistAll({ courses: updated });
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-500 font-semibold block mb-1">Sale Price (৳)</label>
                            <input
                              type="number"
                              value={course.salePrice}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                const updated = courses.map((c, i) => i === idx ? { ...c, salePrice: val } : c);
                                setCourses(updated);
                                persistAll({ courses: updated });
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-600 outline-none focus:bg-white focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500 font-semibold block mb-1">Regular Price (৳)</label>
                            <input
                              type="number"
                              value={course.regularPrice || (course.salePrice * 2)}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                const updated = courses.map((c, i) => i === idx ? { ...c, regularPrice: val } : c);
                                setCourses(updated);
                                persistAll({ courses: updated });
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-400 line-through outline-none focus:bg-white focus:border-blue-500 transition-all"
                            />
                          </div>
                        </div>

                        {/* Course Category Dropdown Selector */}
                        <div>
                          <label className="text-[11px] text-slate-500 font-semibold block mb-1">
                            ক্যাটাগরি / ব্যাচ ফিল্টার (Category)
                          </label>
                          <select
                            value={course.category || ''}
                            onChange={(e) => handleCourseCategoryChange(idx, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                          >
                            {categories.filter(c => c !== "সকল").map((cat, cIdx) => (
                              <option key={cIdx} value={cat}>{cat}</option>
                            ))}
                            {course.category && !categories.includes(course.category) && (
                              <option value={course.category}>{course.category}</option>
                            )}
                          </select>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <label className="text-[11px] text-slate-500 font-semibold block">Cover Image</label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openGalleryModal(course.image, `Choose Cover for ${course.title}`, 'Courses', (newUrl) => {
                                const updated = courses.map((c, i) => i === idx ? { ...c, image: newUrl } : c);
                                setCourses(updated);
                                persistAll({ courses: updated });
                              })}
                              className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200/80 flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <ImageIcon className="w-3 h-3 text-blue-600" />
                              <span>Gallery</span>
                            </button>
                            <label className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-200 flex items-center gap-1 cursor-pointer transition-all">
                              <Upload className="w-3 h-3 text-slate-500" />
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleDeviceFileUpload(file, (newUrl) => {
                                      const updated = courses.map((c, i) => i === idx ? { ...c, image: newUrl } : c);
                                      setCourses(updated);
                                      persistAll({ courses: updated });
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Curriculum & Details Studio Actions (Edu Hunters Theme) */}
                    <div className="p-4 pt-0 space-y-2">
                      <button
                        type="button"
                        onClick={() => openCurriculumStudio(idx, 'curriculum')}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold shadow-sm shadow-red-500/20 hover:shadow transition-all cursor-pointer border-none"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-white" />
                          <span>সিলেবাস ও লেকচার সাজান</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold">
                            {(course.curriculum || []).length} মডিউল
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => openCurriculumStudio(idx, 'details')}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer border-none"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>কোর্স বিবরণ, ক্লাস সংখ্যা ও ফিচার ({course.features?.length || 0} টি)</span>
                      </button>
                    </div>

                    <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">ID: {course.id?.slice(0, 14)}...</span>
                      <button
                        onClick={() => {
                          if (confirm(`Delete course "${course.title}"?`)) {
                            const updated = courses.filter((_, i) => i !== idx);
                            setCourses(updated);
                            persistAll({ courses: updated });
                            triggerToast('Course deleted!');
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
          {activeTab === 'videos' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Video className="w-6 h-6 text-rose-600" />
                    Free YouTube Video Classes ({freeVideos.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage featured YouTube class IDs and descriptions shown on the homepage.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddVideoModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-md shadow-rose-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Add New Video
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {freeVideos.map((vid, idx) => (
                  <div key={vid.id || idx} className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-3 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100">
                        <iframe
                          src={`https://www.youtube.com/embed/${vid.videoId}`}
                          title={vid.title}
                          className="w-full h-full border-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 font-semibold block mb-1">Video Title</label>
                        <input
                          type="text"
                          value={vid.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = freeVideos.map((v, i) => i === idx ? { ...v, title: val } : v);
                            setFreeVideos(updated);
                            persistAll({ freeVideos: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:border-rose-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 font-semibold block mb-1">YouTube Video ID</label>
                        <input
                          type="text"
                          value={vid.videoId}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = freeVideos.map((v, i) => i === idx ? { ...v, videoId: val } : v);
                            setFreeVideos(updated);
                            persistAll({ freeVideos: updated });
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-rose-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          if (confirm(`Delete video?`)) {
                            const updated = freeVideos.filter((_, i) => i !== idx);
                            setFreeVideos(updated);
                            persistAll({ freeVideos: updated });
                            triggerToast('Video deleted!');
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
                    YouTube প্লেলিস্টে নতুন ভিডিও আপলোড হলে স্বয়ংক্রিয়ভাবে কোর্সের ক্লাসে যুক্ত করার জন্য Google Cloud Console থেকে প্রাপ্ত API Key এখানে দিন।
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
                      <h3 className="text-sm font-bold text-slate-900">১. কোর্সসমূহ সেকশন (Courses Section)</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">সেকশন টাইটেল (যেমন: কোর্সসমূহ)</label>
                        <input
                          type="text"
                          value={sectionTexts.coursesTitle || ''}
                          onChange={(e) => handleUpdateSectionText('coursesTitle', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">বাটন টেক্সট (যেমন: View all)</label>
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
                      <h3 className="text-sm font-bold text-slate-900">২. শিক্ষক ও ফ্যাকাল্টি সেকশন (Faculty Section)</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">সেকশন ব্যাজ (যেমন: আমার পরিচয়)</label>
                        <input
                          type="text"
                          value={sectionTexts.facultyBadge || ''}
                          onChange={(e) => handleUpdateSectionText('facultyBadge', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">সেকশন টাইটেল (যেমন: Meet Our Expert Faculty)</label>
                        <input
                          type="text"
                          value={sectionTexts.facultyTitle || ''}
                          onChange={(e) => handleUpdateSectionText('facultyTitle', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">বাটন টেক্সট (যেমন: View all)</label>
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
                      <h3 className="text-sm font-bold text-slate-900">৩. ইউটিউব ফ্রি ভিডিও সেকশন (Free Videos Section)</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">সেকশন ব্যাজ (যেমন: ইউটিউব কন্টেন্ট)</label>
                        <input
                          type="text"
                          value={sectionTexts.videosBadge || ''}
                          onChange={(e) => handleUpdateSectionText('videosBadge', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">টাইটেল লাইন ১ (যেমন: প্লে করে দেখো)</label>
                        <input
                          type="text"
                          value={sectionTexts.videosTitle1 || ''}
                          onChange={(e) => handleUpdateSectionText('videosTitle1', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">টাইটেল লাইন ২ (যেমন: আমার সেরা কিছু ভিডিও)</label>
                        <input
                          type="text"
                          value={sectionTexts.videosTitle2 || ''}
                          onChange={(e) => handleUpdateSectionText('videosTitle2', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">বাটন টেক্সট (যেমন: View All Free Videos)</label>
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
                        <h3 className="text-sm font-bold text-slate-900">৪. কেন আমাদের বেছে নেবেন শিরোনাম</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">ব্যাজ টেক্সট</label>
                          <input
                            type="text"
                            value={sectionTexts.whyChooseBadge || ''}
                            onChange={(e) => handleUpdateSectionText('whyChooseBadge', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">মূল শিরোনাম</label>
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
                        <h3 className="text-sm font-bold text-slate-900">৫. শিক্ষার্থী রিভিউ সেকশন শিরোনাম</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">ব্যাজ টেক্সট</label>
                          <input
                            type="text"
                            value={sectionTexts.reviewsBadge || ''}
                            onChange={(e) => handleUpdateSectionText('reviewsBadge', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">মূল শিরোনাম</label>
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
                      <h3 className="text-sm font-bold text-slate-900">৬. ২৪/৭ AI স্টাডি পার্টনার সেকশন (Edu Hunters AI)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">AI ব্যাজ টেক্সট</label>
                        <input
                          type="text"
                          value={sectionTexts.aiBadge || ''}
                          onChange={(e) => handleUpdateSectionText('aiBadge', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">AI মূল শিরোনাম</label>
                        <input
                          type="text"
                          value={sectionTexts.aiTitle || ''}
                          onChange={(e) => handleUpdateSectionText('aiTitle', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">বাটন ১ টেক্সট</label>
                        <input
                          type="text"
                          value={sectionTexts.aiBtn1 || ''}
                          onChange={(e) => handleUpdateSectionText('aiBtn1', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">বাটন ২ টেক্সট</label>
                        <input
                          type="text"
                          value={sectionTexts.aiBtn2 || ''}
                          onChange={(e) => handleUpdateSectionText('aiBtn2', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">AI সেকশন বর্ণনা / ডেসক্রিপশন</label>
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
                        <span className="text-[10px] font-bold text-rose-600 uppercase">কার্ড ১</span>
                        <input
                          type="text"
                          placeholder="শিরোনাম"
                          value={sectionTexts.aiCard1Title || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard1Title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none font-bold"
                        />
                        <textarea
                          rows={2}
                          placeholder="বিবরণ"
                          value={sectionTexts.aiCard1Desc || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard1Desc', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                        />
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold text-amber-600 uppercase">কার্ড ২</span>
                        <input
                          type="text"
                          placeholder="শিরোনাম"
                          value={sectionTexts.aiCard2Title || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard2Title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none font-bold"
                        />
                        <textarea
                          rows={2}
                          placeholder="বিবরণ"
                          value={sectionTexts.aiCard2Desc || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard2Desc', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                        />
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">কার্ড ৩</span>
                        <input
                          type="text"
                          placeholder="শিরোনাম"
                          value={sectionTexts.aiCard3Title || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard3Title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none font-bold"
                        />
                        <textarea
                          rows={2}
                          placeholder="বিবরণ"
                          value={sectionTexts.aiCard3Desc || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard3Desc', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                        />
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <span className="text-[10px] font-bold text-blue-600 uppercase">কার্ড ৪</span>
                        <input
                          type="text"
                          placeholder="শিরোনাম"
                          value={sectionTexts.aiCard4Title || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard4Title', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none font-bold"
                        />
                        <textarea
                          rows={2}
                          placeholder="বিবরণ"
                          value={sectionTexts.aiCard4Desc || ''}
                          onChange={(e) => handleUpdateSectionText('aiCard4Desc', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                        />
                      </div>
                    </div>

                    {/* AI Question & Quote */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">AI বক্স হেডার</label>
                        <input
                          type="text"
                          value={sectionTexts.aiQuestionHeader || ''}
                          onChange={(e) => handleUpdateSectionText('aiQuestionHeader', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">AI বক্স সাব-হেডিং</label>
                        <input
                          type="text"
                          value={sectionTexts.aiQuestionSub || ''}
                          onChange={(e) => handleUpdateSectionText('aiQuestionSub', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">AI কোটেশন টেক্সট</label>
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
                        <h3 className="text-sm font-bold text-slate-900">৭. যোগাযোগ সেকশন (Contact Section)</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">যোগাযোগ সেকশন শিরোনাম</label>
                          <input
                            type="text"
                            value={sectionTexts.contactTitle || ''}
                            onChange={(e) => handleUpdateSectionText('contactTitle', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">যোগাযোগ বিবরণ</label>
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
                          <span className="text-xs font-bold text-slate-900 block">ফেসবুক পেজ বাটন কার্ড</span>
                          <input
                            type="text"
                            placeholder="বাটন টাইটেল (যেমন: পেজে মেসেজ করো)"
                            value={sectionTexts.contactPageTitle || ''}
                            onChange={(e) => handleUpdateSectionText('contactPageTitle', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="বাটন সাব-টাইটেল (যেমন: Reach out on our page)"
                            value={sectionTexts.contactPageSub || ''}
                            onChange={(e) => handleUpdateSectionText('contactPageSub', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-600 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="ফেসবুক পেজ লিংক URL"
                            value={sectionTexts.contactPageUrl || ''}
                            onChange={(e) => handleUpdateSectionText('contactPageUrl', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-blue-600 outline-none"
                          />
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <span className="text-xs font-bold text-slate-900 block">স্টাডি কমিউনিটি বাটন কার্ড</span>
                          <input
                            type="text"
                            placeholder="বাটন টাইটেল (যেমন: আমাদের কমিউনিটি তে যুক্ত হও)"
                            value={sectionTexts.contactCommunityTitle || ''}
                            onChange={(e) => handleUpdateSectionText('contactCommunityTitle', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="বাটন সাব-টাইটেল (যেমন: Connect with other learners)"
                            value={sectionTexts.contactCommunitySub || ''}
                            onChange={(e) => handleUpdateSectionText('contactCommunitySub', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-600 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="কমিউনিটি গ্রুপ লিংক URL"
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
                        <h3 className="text-sm font-bold text-slate-900">৮. ফুটার ও কপিরাইট টেক্সট (Footer Section)</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">ফুটার ডেসক্রিপশন</label>
                          <input
                            type="text"
                            value={sectionTexts.footerDesc || ''}
                            onChange={(e) => handleUpdateSectionText('footerDesc', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 block mb-1">কপিরাইট লাইন</label>
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
                    কেন আমাদের বেছে নেবেন - কার্ড তালিকা
                  </h2>
                  <p className="text-xs text-slate-500">
                    হোমপেজের 'কি কি দিয়ে তোমার পাঁশে আছি' সেকশনের কার্ডগুলো ইচ্ছামতো সম্পাদন, নতুন যোগ বা ডিলিট করুন।
                  </p>
                </div>
                <button
                  onClick={() => setShowAddWhyModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold border-none cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন কার্ড যোগ করুন</span>
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
                        <span className="text-xs font-bold text-slate-500">নম্বর:</span>
                        <input
                          type="text"
                          value={card.number}
                          onChange={(e) => handleUpdateWhyPoint(idx, 'number', e.target.value)}
                          className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-blue-600 outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteWhyPoint(idx)}
                        title="কার্ড মুছে ফেলুন"
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">কার্ড টাইটেল</label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => handleUpdateWhyPoint(idx, 'title', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">কার্ড বিবরণ</label>
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
                    {categories.filter(c => c !== "সকল").map((cat, cIdx) => (
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
      {/* MODAL: ADD VIDEO */}
      {/* ========================================================= */}
      {showAddVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add YouTube Video Class</h3>
                  <p className="text-[11px] text-slate-500">Publish video lecture or recorded class</p>
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

            <form onSubmit={handleAddVideo} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Video Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HSC Chemistry One-Shot Revision"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">YouTube Video ID (e.g. aQkNaEvR9Ag)</label>
                <input
                  type="text"
                  required
                  placeholder="aQkNaEvR9Ag"
                  value={newVideo.videoId}
                  onChange={(e) => setNewVideo({ ...newVideo, videoId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="Class description"
                  value={newVideo.desc}
                  onChange={(e) => setNewVideo({ ...newVideo, desc: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVideoModal(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-rose-500/20 transition-all"
                >
                  Add Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
      {/* MODAL: CURRICULUM & COURSE CONTENT STUDIO (EDU HUNTERS THEME) */}
      {/* ========================================================= */}
      {showCurriculumModal && curriculumCourseIndex !== null && courses[curriculumCourseIndex] && (() => {
        const activeCourse = courses[curriculumCourseIndex];
        const curriculum = Array.isArray(activeCourse.curriculum) ? activeCourse.curriculum : [];
        const totalSections = curriculum.length;
        const totalChapters = curriculum.reduce((acc, s) => acc + (s.chapters?.length || 0), 0);
        const totalLessons = curriculum.reduce((acc, s) => acc + (s.chapters || []).reduce((chAcc, ch) => chAcc + (ch.lessons?.length || 0), 0), 0);
        const totalFreeDemos = curriculum.reduce((acc, s) => acc + (s.chapters || []).reduce((chAcc, ch) => chAcc + (ch.lessons || []).filter(l => typeof l === 'object' && l.isFree).length, 0), 0);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
            <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Studio Header (Edu Hunters Crimson Theme) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-red-100 bg-red-50/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#dc2626] text-white flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-[#dc2626]">
                        Course Studio
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {activeCourse.category}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                      {activeCourse.title}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="hidden sm:flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1 text-xs text-slate-600 font-bold shadow-2xs">
                    <span className="text-[#dc2626]">{totalSections}</span> মডিউল
                    <span className="text-slate-300">•</span>
                    <span className="text-blue-600">{totalChapters}</span> চ্যাপ্টার
                    <span className="text-slate-300">•</span>
                    <span className="text-purple-600">{totalLessons}</span> ক্লাস
                    {totalFreeDemos > 0 && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-600">{totalFreeDemos} ফ্রি ডেমো</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCurriculumModal(false)}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Studio Tabs Navigation */}
              <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setCurriculumStudioTab('curriculum')}
                  className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer bg-transparent border-none ${
                    curriculumStudioTab === 'curriculum'
                      ? 'border-[#dc2626] text-[#dc2626]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>সিলেবাস ও লেকচার কাঠামো ({totalSections} মডিউল)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurriculumStudioTab('details')}
                  className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer bg-transparent border-none ${
                    curriculumStudioTab === 'details'
                      ? 'border-[#dc2626] text-[#dc2626]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>কোর্স ওভারভিউ, ফিচার ও সেটিংস</span>
                </button>
              </div>

              {/* Studio Body Content (Scrollable) */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">

                {/* TAB 1: CURRICULUM & LESSONS */}
                {curriculumStudioTab === 'curriculum' && (
                  <div className="space-y-5">
                    
                    {/* Top Action Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">কোর্সের মডিউল ও লেকচার তালিকা</h3>
                        <p className="text-xs text-slate-500">ইউডেমির মতো মডিউল ও চ্যাপ্টার সাজান এবং প্রতি ক্লাসে ভিডিও লিংক ও ফ্রি ডেমো নির্ধারণ করুন।</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleLoadTemplate}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 cursor-pointer transition-all shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>স্ট্যান্ডার্ড টেমপ্লেট লোড</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAddSection}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold border-none cursor-pointer transition-all shadow-md shadow-red-500/20"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ নতুন মডিউল তৈরি করুন</span>
                        </button>
                      </div>
                    </div>

                    {/* Empty State */}
                    {curriculum.length === 0 && (
                      <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-red-50 text-[#dc2626] flex items-center justify-center mx-auto shadow-inner">
                          <Layers className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-800">এখনও কোনো মডিউল যোগ করা হয়নি</h4>
                          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                            উপরের "+ নতুন মডিউল তৈরি করুন" বাটনে ক্লিক করে প্রথম মডিউল তৈরি করুন অথবা সরাসরি "স্ট্যান্ডার্ড টেমপ্লেট লোড" বাটনে ক্লিক করে রেডিমেড সিলেবাস যুক্ত করুন।
                          </p>
                        </div>
                        <div className="flex justify-center gap-3">
                          <button
                            type="button"
                            onClick={handleLoadTemplate}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            স্ট্যান্ডার্ড টেমপ্লেট লোড করুন
                          </button>
                          <button
                            type="button"
                            onClick={handleAddSection}
                            className="px-4 py-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            কাস্টম মডিউল তৈরি করুন
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sections Accordion Tree */}
                    {curriculum.map((section, secIdx) => {
                      const isSecExpanded = Boolean(curriculumExpandedSections[secIdx]);
                      const chapters = Array.isArray(section.chapters) ? section.chapters : [];

                      return (
                        <div 
                          key={section.id || secIdx}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
                        >
                          {/* Section Header Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200/80">
                            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                              <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs font-mono">
                                {secIdx + 1 < 10 ? `0${secIdx + 1}` : secIdx + 1}
                              </span>
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={section.name}
                                  placeholder="মডিউল শিরোনাম (যেমন: Biology 1st Paper)"
                                  onChange={(e) => handleUpdateSection(secIdx, 'name', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-[#dc2626] transition-all"
                                />
                                <input
                                  type="text"
                                  value={section.summary || ''}
                                  placeholder="সারাংশ (যেমন: ১২ টি অধ্যায় · ২৩ টি লেকচার)"
                                  onChange={(e) => handleUpdateSection(secIdx, 'summary', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-500 outline-none focus:border-[#dc2626] transition-all"
                                />
                              </div>
                            </div>

                            {/* Section Action Controls */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={secIdx === 0}
                                onClick={() => handleMoveSection(secIdx, 'up')}
                                title="Move Module Up"
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={secIdx === curriculum.length - 1}
                                onClick={() => handleMoveSection(secIdx, 'down')}
                                title="Move Module Down"
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSection(secIdx)}
                                title="Delete Module"
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCurriculumExpandedSections(prev => ({ ...prev, [secIdx]: !prev[secIdx] }))}
                                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-slate-100 transition-colors"
                              >
                                <span>{chapters.length} টি চ্যাপ্টার</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSecExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Section Body (Chapters & Lessons) */}
                          {isSecExpanded && (
                            <div className="p-4 sm:p-5 space-y-5 bg-white">
                              
                              {chapters.length === 0 && (
                                <p className="text-xs text-slate-400 italic py-2 text-center">
                                  এই মডিউলে এখনও কোনো চ্যাপ্টার নেই। নিচের বাটনে ক্লিক করে চ্যাপ্টার তৈরি করুন।
                                </p>
                              )}

                              {chapters.map((chapter, chapIdx) => {
                                const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];
                                const draftKey = `${secIdx}-${chapIdx}`;
                                const draft = newLessonDrafts[draftKey] || { title: '', duration: '45 min', videoUrl: '', pdfUrl: '', isFree: false };

                                return (
                                  <div 
                                    key={chapIdx}
                                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-4"
                                  >
                                    {/* Chapter Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                                      <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                                        <span className="w-6 h-6 rounded-lg bg-red-100 text-[#dc2626] font-bold text-xs flex items-center justify-center font-mono">
                                          C{chapIdx + 1}
                                        </span>
                                        <input
                                          type="text"
                                          value={chapter.name}
                                          placeholder="চ্যাপ্টার শিরোনাম (যেমন: কোষ ও এর গঠন)"
                                          onChange={(e) => handleUpdateChapter(secIdx, chapIdx, e.target.value)}
                                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                                        />
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/70 text-slate-700 font-mono">
                                          {lessons.length} ক্লাস
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteChapter(secIdx, chapIdx)}
                                        className="text-slate-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors p-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>চ্যাপ্টার ডিলিট</span>
                                      </button>
                                    </div>

                                    {/* Lessons Table / List */}
                                    <div className="space-y-2.5">
                                      {lessons.length === 0 && (
                                        <p className="text-xs text-slate-400 italic text-center py-1">
                                          কোনো ক্লাস যোগ করা হয়নি। নিচে ক্লাসের বিবরণ দিয়ে "+ ক্লাস যুক্ত করুন" এ ক্লিক করুন।
                                        </p>
                                      )}

                                      {lessons.map((lesson, lesIdx) => {
                                        const isObj = typeof lesson === 'object' && lesson !== null;
                                        const title = isObj ? lesson.title : lesson;
                                        const duration = isObj ? (lesson.duration || '45 min') : '45 min';
                                        const videoUrl = isObj ? (lesson.videoUrl || '') : '';
                                        const pdfUrl = isObj ? (lesson.pdfUrl || '') : '';
                                        const isFree = isObj ? Boolean(lesson.isFree) : false;

                                        return (
                                          <div 
                                            key={lesIdx}
                                            className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5 shadow-2xs hover:border-slate-300 transition-all"
                                          >
                                            {/* Lesson Title */}
                                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                              <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0 font-mono">
                                                #{lesIdx + 1}
                                              </span>
                                              <input
                                                type="text"
                                                value={title}
                                                placeholder="ক্লাস শিরোনাম"
                                                onChange={(e) => handleUpdateLesson(secIdx, chapIdx, lesIdx, 'title', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                                              />
                                            </div>

                                            {/* Duration & Video Link */}
                                            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                                              <input
                                                type="text"
                                                value={duration}
                                                placeholder="সময় (45 min)"
                                                onChange={(e) => handleUpdateLesson(secIdx, chapIdx, lesIdx, 'duration', e.target.value)}
                                                className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-blue-500"
                                              />
                                              <input
                                                type="text"
                                                value={videoUrl}
                                                placeholder="YouTube লিংক/ID"
                                                onChange={(e) => handleUpdateLesson(secIdx, chapIdx, lesIdx, 'videoUrl', e.target.value)}
                                                className="w-36 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-blue-500"
                                              />
                                              <input
                                                type="text"
                                                value={pdfUrl}
                                                placeholder="PDF নোট লিংক"
                                                onChange={(e) => handleUpdateLesson(secIdx, chapIdx, lesIdx, 'pdfUrl', e.target.value)}
                                                className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-blue-500"
                                              />
                                            </div>

                                            {/* Free Demo Toggle & Delete */}
                                            <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0">
                                              <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors border ${
                                                isFree 
                                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                                              }`}>
                                                <input
                                                  type="checkbox"
                                                  checked={isFree}
                                                  onChange={(e) => handleUpdateLesson(secIdx, chapIdx, lesIdx, 'isFree', e.target.checked)}
                                                  className="cursor-pointer"
                                                />
                                                <span>ফ্রি ডেমো</span>
                                              </label>

                                              <button
                                                type="button"
                                                onClick={() => handleDeleteLesson(secIdx, chapIdx, lesIdx)}
                                                className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer border-none transition-colors"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Inline Add Lesson Form */}
                                    <div className="bg-white rounded-xl border border-dashed border-red-200 p-3 space-y-2">
                                      <span className="text-[11px] font-bold text-[#dc2626] block">
                                        + এই চ্যাপ্টারে নতুন ক্লাস যুক্ত করুন
                                      </span>
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                        <input
                                          type="text"
                                          placeholder="ক্লাসের নাম (যেমন: লেকচার ০১ - কোষপ্রাচীর)"
                                          value={draft.title}
                                          onChange={(e) => setNewLessonDrafts(prev => ({
                                            ...prev,
                                            [draftKey]: { ...draft, title: e.target.value }
                                          }))}
                                          className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#dc2626]"
                                        />
                                        <input
                                          type="text"
                                          placeholder="সময় (যেমন: 45 min)"
                                          value={draft.duration}
                                          onChange={(e) => setNewLessonDrafts(prev => ({
                                            ...prev,
                                            [draftKey]: { ...draft, duration: e.target.value }
                                          }))}
                                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#dc2626]"
                                        />
                                        <input
                                          type="text"
                                          placeholder="YouTube ভিডিও URL (ঐচ্ছিক)"
                                          value={draft.videoUrl}
                                          onChange={(e) => setNewLessonDrafts(prev => ({
                                            ...prev,
                                            [draftKey]: { ...draft, videoUrl: e.target.value }
                                          }))}
                                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#dc2626]"
                                        />
                                      </div>

                                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                        <div className="flex items-center gap-3">
                                          <input
                                            type="text"
                                            placeholder="PDF লেকচার শিট লিংক (ঐচ্ছিক)"
                                            value={draft.pdfUrl}
                                            onChange={(e) => setNewLessonDrafts(prev => ({
                                              ...prev,
                                              [draftKey]: { ...draft, pdfUrl: e.target.value }
                                            }))}
                                            className="w-60 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#dc2626]"
                                          />
                                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={draft.isFree}
                                              onChange={(e) => setNewLessonDrafts(prev => ({
                                                ...prev,
                                                [draftKey]: { ...draft, isFree: e.target.checked }
                                              }))}
                                            />
                                            <span>উন্মুক্ত ডেমো হিসেবে রাখুন (Free Preview)</span>
                                          </label>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleAddLesson(secIdx, chapIdx)}
                                          className="px-4 py-1.5 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold border-none cursor-pointer transition-all shadow-sm shadow-red-500/20"
                                        >
                                          + ক্লাস যুক্ত করুন
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Add Chapter Button inside Section */}
                              <button
                                type="button"
                                onClick={() => handleAddChapter(secIdx)}
                                className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Plus className="w-4 h-4 text-slate-500" />
                                <span>এই মডিউলে নতুন চ্যাপ্টার যোগ করুন (+ Add Chapter)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Bottom Add Section Button */}
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#dc2626]/30 hover:border-[#dc2626] bg-red-50/40 hover:bg-red-50 text-[#dc2626] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ নতুন কোর্স মডিউল তৈরি করুন (Add New Section)</span>
                    </button>
                  </div>
                )}

                {/* TAB 2: COURSE DETAILS & INFO */}
                {curriculumStudioTab === 'details' && (
                  <div className="space-y-5">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                        কোর্সের মূল তথ্য ও ফিচারসমূহ (Biology Course Page Data)
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">কোর্স স্লোগান / ট্যাগলাইন (Tagline)</label>
                          <input
                            type="text"
                            value={activeCourse.tagline || ''}
                            placeholder="যেমন: এক ক্লাসেই একাডেমিক টু মেডিকেল এডমিশন সব থিওর কভার!"
                            onChange={(e) => handleUpdateCurrentCourseField('tagline', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#dc2626] transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">মোট ক্লাসের বিবরণ (Total Classes Text)</label>
                          <input
                            type="text"
                            value={activeCourse.totalClasses || ''}
                            placeholder="যেমন: 42 টি ক্লাস"
                            onChange={(e) => handleUpdateCurrentCourseField('totalClasses', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#dc2626] transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">সাপোর্ট হটলাইন / WhatsApp নাম্বার</label>
                          <input
                            type="text"
                            value={activeCourse.supportPhone || '01321228612'}
                            placeholder="01321228612"
                            onChange={(e) => handleUpdateCurrentCourseField('supportPhone', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#dc2626] transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">প্রিভিউ ভিডিও লিংক (YouTube URL / ID)</label>
                          <input
                            type="text"
                            value={activeCourse.previewVideoUrl || ''}
                            placeholder="https://www.youtube.com/watch?v=zskTywWaXEE"
                            onChange={(e) => handleUpdateCurrentCourseField('previewVideoUrl', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#dc2626] transition-all"
                          />
                        </div>
                      </div>

                      {/* Course About Box Textarea */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">কোর্স সম্পর্কে বিস্তারিত (About Text)</label>
                        <textarea
                          rows={6}
                          value={activeCourse.aboutText || ''}
                          placeholder="কোর্সটির বিস্তারিত উদ্দেশ্য ও শিক্ষার্থীদের কি কি প্রদান করা হবে..."
                          onChange={(e) => handleUpdateCurrentCourseField('aboutText', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 leading-relaxed outline-none focus:bg-white focus:border-[#dc2626] transition-all"
                        ></textarea>
                      </div>

                      {/* Course Features Bullets Editor */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <label className="text-xs font-bold text-slate-700 block">
                          কোর্স ফিচারসমূহ (এই কোর্সে যা থাকছে)
                        </label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(activeCourse.features || []).map((feat, fIdx) => (
                            <div 
                              key={fIdx}
                              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-red-100 text-[#dc2626] flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3" />
                                </span>
                                <span className="truncate">{feat}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFeature(fIdx)}
                                className="text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add Feature input */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="নতুন ফিচার লিখুন (যেমন: চ্যাপ্টারভিত্তিক রিভিশন শিট)"
                            value={newFeatureInput}
                            onChange={(e) => setNewFeatureInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#dc2626]"
                          />
                          <button
                            type="button"
                            onClick={handleAddFeature}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold border-none cursor-pointer transition-colors"
                          >
                            + যুক্ত করুন
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>

              {/* Studio Footer */}
              <div className="flex items-center justify-between p-4 px-5 sm:px-6 border-t border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>সকল পরিবর্তন স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়েছে (Auto-saved)</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCurriculumModal(false);
                      onExitAdmin();
                    }}
                    className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-none cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>কোর্স পেজে প্রিভিউ দেখুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCurriculumModal(false);
                      triggerToast('🎉 কারিকুলাম সফলভাবে আপডেট হয়েছে!');
                    }}
                    className="px-6 py-2 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-red-500/20 transition-all"
                  >
                    সম্পন্ন ও সেভ করুন
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

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
                    {editingStudentId ? 'শিক্ষার্থীর তথ্য আপডেট করুন' : 'ম্যানুয়াল শিক্ষার্থী এনরোলমেন্ট'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingStudentId ? 'তথ্য পরিবর্তন করে সেভ করুন' : 'নতুন শিক্ষার্থীকে নির্দিষ্ট কোর্স ও ব্যাচে যুক্ত করুন'}
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
                  triggerToast('⚠️ দয়া করে শিক্ষার্থীর নাম ও মোবাইল নম্বর প্রদান করুন');
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
                  triggerToast(`✅ ${newStudentData.name}-এর তথ্য সফলভাবে আপডেট হয়েছে!`);
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
                    joinedDate: 'আজকে'
                  };
                  setEnrolledStudents([newEntry, ...enrolledStudents]);
                  triggerToast(`🎉 শিক্ষার্থী "${newEntry.name}" সফলভাবে এনরোল সম্পন্ন হয়েছে!`);
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
                  শিক্ষার্থীর নাম <span className="text-pink-600">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="যেমন: মোঃ তানভীর হাসান"
                  value={newStudentData.name}
                  onChange={(e) => setNewStudentData({ ...newStudentData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all font-medium"
                />
              </div>

              {/* Row 2: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    মোবাইল নম্বর <span className="text-pink-600">*</span>
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
                    ইমেইল (ঐচ্ছিক)
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
                  কোর্স / ব্যাচ নির্বাচন করুন <span className="text-pink-600">*</span>
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
                  {courses.map(c => (
                    <option key={c.id} value={c.title}>
                      {c.title} {c.category ? `(${c.category})` : ''}
                    </option>
                  ))}
                  <option value="Biology Extra Info + Exam Batch">Biology Extra Info + Exam Batch</option>
                  <option value="Ketab Sir Higher Math MCQ Solve">Ketab Sir Higher Math MCQ Solve</option>
                </select>
              </div>

              {/* Row 4: Batch & Status */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ব্যাচ ক্যাটাগরি</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">এনরোলমেন্ট স্ট্যাটাস</label>
                  <select 
                    value={newStudentData.status}
                    onChange={(e) => setNewStudentData({ ...newStudentData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-pink-500 font-bold cursor-pointer"
                  >
                    <option value="Active">🟢 Active (অনুমোদিত)</option>
                    <option value="Pending">🟡 Pending (পর্যালোচনায়)</option>
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
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 border-none cursor-pointer shadow-md shadow-pink-600/25 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingStudentId ? 'আপডেট সম্পন্ন করুন' : 'এনরোল নিশ্চিত করুন'}</span>
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
                <h3 className="font-bold text-slate-900 text-base">নতুন ক্লাস / এক্সাম রুটিন যোগ করুন</h3>
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
                triggerToast('📅 একাডেমিক রুটিনে নতুন শিডিউল যোগ হয়েছে!');
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ক্লাস বা এক্সামের শিরোনাম *</label>
                <input 
                  type="text" 
                  required
                  placeholder="যেমন: Zoology চ্যাপ্টার ৪ স্পেশাল লাইভ ক্লাস"
                  value={newRoutineData.title}
                  onChange={(e) => setNewRoutineData({ ...newRoutineData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">দিন (Day)</label>
                  <select 
                    value={newRoutineData.day}
                    onChange={(e) => setNewRoutineData({ ...newRoutineData, day: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 font-bold"
                  >
                    <option value="Sat">Saturday (শনি)</option>
                    <option value="Sun">Sunday (রবি)</option>
                    <option value="Mon">Monday (সোম)</option>
                    <option value="Tue">Tuesday (মঙ্গল)</option>
                    <option value="Wed">Wednesday (বুধ)</option>
                    <option value="Thur">Thursday (বৃহস্পতি)</option>
                    <option value="Fri">Friday (শুক্র)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">সময় (Time)</label>
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
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border-none cursor-pointer shadow-md shadow-blue-600/20"
                >
                  শিডিউল সেভ করুন
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
                <h3 className="font-bold text-slate-900 text-base">ব্যাচ নোটিশ ও SMS পাঠান</h3>
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
                  title: `নোটিশ সম্প্রচারিত: ${noticeTargetBatch}`,
                  sub: noticeText.slice(0, 50) + (noticeText.length > 50 ? '...' : ''),
                  time: 'এইমাত্র',
                  tag: 'Notice',
                  icon: 'sparkle',
                  color: 'amber'
                };
                setAcademicActivities([newAct, ...academicActivities]);
                setShowNoticeModal(false);
                setNoticeText('');
                triggerToast(`📢 ${noticeTargetBatch} এর শিক্ষার্থীদের কাছে নোটিশ সফলভাবে প্রেরিত হয়েছে!`);
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">টার্গেট ব্যাচ বা গ্রুপ</label>
                <select 
                  value={noticeTargetBatch}
                  onChange={(e) => setNoticeTargetBatch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-amber-500 font-bold"
                >
                  <option value="All Students">সকল শিক্ষার্থী (All Active Batches)</option>
                  <option value="Medical 25 Batch">Medical 25 Exam Batch</option>
                  <option value="HSC 26 Combo Batch">HSC 26 Combo Batch</option>
                  <option value="HSC 27 Series">HSC 27 Series</option>
                  <option value="HSC 28 Batch">HSC 28 Batch</option>
                  <option value="Engineering Batch">Engineering Special Batch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">নোটিশ বার্তা (SMS / নোটিফিকেশন) *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="যেমন: প্রিয় শিক্ষার্থীবৃন্দ, আজকের বায়োলজি লাইভ ক্লাসটি রাত ৯:০০ টায় শুরু হবে। সবাই নির্ধারিত সময়ে জুম ও অ্যাপে যুক্ত থেকো।"
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
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 border-none cursor-pointer shadow-md shadow-amber-600/20"
                >
                  ব্রডকাস্ট পাঠান
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
