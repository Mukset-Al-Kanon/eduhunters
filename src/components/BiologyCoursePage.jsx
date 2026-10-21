import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Phone, 
  MessageCircle, 
  Check, 
  Calendar, 
  ShoppingCart, 
  Play, 
  Share2, 
  X,
  FileText,
  Send,
  RefreshCw,
  Video,
  Key,
  Clock,
  Edit2,
  Plus,
  Trash2,
  Zap,
  Download,
  ExternalLink
} from 'lucide-react';
import { masterEnglishCourseData } from '../data/masterEnglishCourseData';
import { homeCoursesData } from '../data/homeData';
import { freeCoursesData } from '../data/freeCoursesData';
import { physicsFinishingTouchCourseData } from '../data/physicsFinishingTouchData';
import { isStudentProfileComplete } from '../utils/studentProfile';
import { syncCourseWithYouTube, DEFAULT_YT_API_KEY } from '../utils/youtubeSync';
import ProtectedPdfViewer from './ProtectedPdfViewer';
import ExamEngine from './ExamEngine';
import CheckoutModal from './CheckoutModal';
import ProfileModal from './ProfileModal';
import Navbar from './Navbar';
import { initialData } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useEnrollmentStatus } from '../utils/enrollmentService';
import { getAdminSession } from '../services/adminAuthService';

function getEmbedUrl(url) {
  if (!url) return '';
  try {
    const trimmed = String(url).trim();
    if (!trimmed) return '';

    // 1. Bunny Stream Direct Iframe Embed URL
    if (trimmed.includes('iframe.mediadelivery.net/embed/')) {
      const glue = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${glue}autoplay=false&preload=true`;
    }

    // 2. Bunny Stream Play URL
    if (trimmed.includes('video.bunnycdn.com/play/')) {
      const parts = trimmed.split('video.bunnycdn.com/play/')[1].split('?')[0].split('/');
      if (parts.length >= 2) {
        return `https://iframe.mediadelivery.net/embed/${parts[0]}/${parts[1]}?autoplay=false&preload=true`;
      }
    }

    // 3. Bunny shorthand: "bunny:777670/videoId"
    if (trimmed.startsWith('bunny:')) {
      const rest = trimmed.replace('bunny:', '');
      return `https://iframe.mediadelivery.net/embed/${rest}?autoplay=false&preload=true`;
    }

    // 4. Extract YouTube ID
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
    } else if (trimmed.includes('youtube.com/shorts/')) {
      ytId = trimmed.split('youtube.com/shorts/')[1].split('?')[0].split('&')[0];
    } else if (trimmed.includes('youtube.com/live/')) {
      ytId = trimmed.split('youtube.com/live/')[1].split('?')[0].split('&')[0];
    } else if (trimmed.includes('vimeo.com/')) {
      const vParts = trimmed.split('vimeo.com/')[1].split('?')[0].split('/');
      if (vParts[0]) {
        return `https://player.vimeo.com/video/${vParts[0]}?autoplay=0`;
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

export function parseCountNumber(str) {
  if (!str) return 0;
  const bnToEn = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  const normalized = String(str).replace(/[০-৯]/g, d => bnToEn[d]);
  const match = normalized.match(/\d[\d,]*/);
  if (!match) return 0;
  const parsed = parseInt(match[0].replace(/,/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function toBengaliNumerals(n) {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/[0-9]/g, d => bnDigits[Number(d)]);
}

export function getRealCourseEnrolledStudentsCount(course, data) {
  if (!course) return 0;
  
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const validTargetNorms = new Set();
  const addTarget = (val) => {
    if (!val) return;
    const n = norm(val);
    if (n && n.length >= 4) {
      validTargetNorms.add(n);
    }
  };

  addTarget(course.id);
  addTarget(course.slug);
  addTarget(course.title);
  addTarget(course.name);
  addTarget(course.key);
  if (Array.isArray(course.curriculum)) {
    course.curriculum.forEach(sec => {
      addTarget(sec.name);
      addTarget(sec.title);
    });
  }

  // Include any bundle that contains this course
  const allBundles = [
    ...(Array.isArray(data?.bundles) ? data.bundles : []),
    ...(Array.isArray(initialData?.bundles) ? initialData.bundles : [])
  ];
  allBundles.forEach(b => {
    const cIds = Array.isArray(b?.courseIds) ? b.courseIds : [];
    const hasThisCourse = cIds.some(cid => {
      const cNorm = norm(cid);
      return validTargetNorms.has(cNorm) || cNorm === norm(course.id) || cNorm === norm(course.slug);
    });
    if (hasThisCourse) {
      addTarget(b.id);
      addTarget(b.slug);
      addTarget(b.title);
      addTarget(b.name);
    }
  });

  // Extract core keywords if present
  const cTitleNorm = norm(course.title || course.name || '');
  const isPhysicsFinishing = cTitleNorm.includes('physics') && (cTitleNorm.includes('finishing') || cTitleNorm.includes('touch'));
  const isMasterEnglish = cTitleNorm.includes('masterenglish') || norm(course.id).includes('masterenglish') || norm(course.slug).includes('masterenglish');

  const isMatch = (item) => {
    if (!item) return false;
    const itemNorm = norm(item);
    if (!itemNorm || itemNorm.length < 4) return false;
    
    // Direct exact match
    if (validTargetNorms.has(itemNorm)) return true;

    // High specificity match: both item and target must be at least 10 chars to prevent generic word overlaps
    for (const t of validTargetNorms) {
      if (t.length >= 10 && itemNorm.length >= 10) {
        if (itemNorm.includes(t) || t.includes(itemNorm)) return true;
      }
    }

    // Specific domain keywords
    if (isPhysicsFinishing && itemNorm.includes('physics') && (itemNorm.includes('finishing') || itemNorm.includes('touch'))) {
      return true;
    }
    if (isMasterEnglish && itemNorm.includes('masterenglish')) {
      return true;
    }

    return false;
  };

  const enrolledSet = new Set();

  const isAdminUser = (u) => {
    if (!u) return false;
    if (u.role === 'admin') return true;
    const email = (u.email || u.customerEmail || (u.customer && u.customer.email) || '').toLowerCase().trim();
    if (email === 'admin@eduhunters.com' || email === 'admin@eduhunters.com.bd') return true;
    const name = (u.name || u.displayName || u.customerName || (u.customer && u.customer.name) || '').trim();
    if (name === 'EduHunters Admin' || name === 'Admin') return true;
    return false;
  };

  const getStudentKey = (u) => {
    if (!u) return null;
    const phone = String(u.phone || u.whatsapp || u.customerPhone || u.studentPhone || (u.customer && u.customer.phone) || '').replace(/[^0-9]/g, '');
    if (phone.length >= 10) return `p_${phone.slice(-10)}`;
    const email = String(u.email || u.customerEmail || u.studentEmail || (u.customer && u.customer.email) || '').toLowerCase().trim();
    if (email && email.includes('@')) return `e_${email}`;
    const id = u.uid || u.id || u.studentId || u.userId || (u.customer && u.customer.uid);
    if (id && !String(id).startsWith('tx_') && !String(id).startsWith('dummy_')) return `id_${id}`;
    const name = String(u.name || u.displayName || u.studentName || (u.customer && u.customer.name) || '').trim().toLowerCase();
    if (name && name.length >= 3 && !name.startsWith('user_') && !name.startsWith('student')) return `n_${name}`;
    return null;
  };

  // 1. Check data.users (central state from App.jsx and Supabase eduhunters_users)
  const users = Array.isArray(data?.users) ? data.users : [];
  users.forEach((u, idx) => {
    if (isAdminUser(u)) return;
    const enrolled = Array.isArray(u?.enrolledCourses) ? u.enrolledCourses : [];
    if (enrolled.some(isMatch)) {
      const key = getStudentKey(u) || `u_${idx}`;
      enrolledSet.add(key);
    }
  });

  // 2. Check registered users in localStorage (eh_registered_users)
  try {
    const reg = JSON.parse(localStorage.getItem('eh_registered_users') || '[]');
    if (Array.isArray(reg)) {
      reg.forEach((u, idx) => {
        if (isAdminUser(u)) return;
        const enrolled = Array.isArray(u?.enrolledCourses) ? u.enrolledCourses : [];
        if (enrolled.some(isMatch)) {
          const key = getStudentKey(u) || `reg_${idx}`;
          enrolledSet.add(key);
        }
      });
    }
  } catch (e) {}

  // 3. Check enrolled students in eh_enrolled_students (Admin Panel students tab)
  try {
    const stList = JSON.parse(localStorage.getItem('eh_enrolled_students') || '[]');
    if (Array.isArray(stList)) {
      stList.forEach((st, idx) => {
        if (st.status === 'Active' || !st.status) {
          if (isMatch(st.courseTitle) || isMatch(st.course) || isMatch(st.targetTitle) || isMatch(st.courseName)) {
            const key = getStudentKey(st) || `st_${idx}`;
            enrolledSet.add(key);
          }
        }
      });
    }
  } catch (e) {}

  // 4. Check user orders in eh_user_orders_v3 (PAID or Approved orders)
  try {
    const ordList = JSON.parse(localStorage.getItem('eh_user_orders_v3') || '[]');
    if (Array.isArray(ordList)) {
      ordList.forEach((ord, idx) => {
        if (ord.status === 'PAID' || ord.isApproved || ord.status === 'Approved') {
          const matchCourse = isMatch(ord.course?.name) || isMatch(ord.course?.title) || isMatch(ord.course?.slug) || isMatch(ord.course?.id) || isMatch(ord.items?.[0]?.title);
          if (matchCourse) {
            const key = getStudentKey(ord) || `ord_${idx}`;
            enrolledSet.add(key);
          }
        }
      });
    }
  } catch (e) {}

  // 5. Check accounting transactions in data.accounting.transactions
  try {
    const txList = Array.isArray(data?.accounting?.transactions) ? data.accounting.transactions : [];
    txList.forEach((tx, idx) => {
      if (tx.status === 'Approved' || tx.status === 'PAID') {
        if (isMatch(tx.itemTitle) || isMatch(tx.courseName) || isMatch(tx.course)) {
          const key = getStudentKey(tx) || `tx_${idx}`;
          enrolledSet.add(key);
        }
      }
    });
  } catch (e) {}

  // 6. Check global current user's enrolled courses if logged in as student
  try {
    const cur = JSON.parse(localStorage.getItem('eh_current_user') || 'null');
    if (cur && !isAdminUser(cur)) {
      const curCourses = Array.isArray(cur.enrolledCourses) ? cur.enrolledCourses : [];
      if (curCourses.some(isMatch)) {
        const key = getStudentKey(cur);
        if (key) enrolledSet.add(key);
      }
    }
  } catch (e) {}

  // 7. Check browser-level enrolled courses
  try {
    const curCourses = JSON.parse(localStorage.getItem('eduhunters_enrolled_courses') || '[]');
    if (Array.isArray(curCourses) && curCourses.some(isMatch)) {
      const cur = JSON.parse(localStorage.getItem('eh_current_user') || 'null');
      if (cur && !isAdminUser(cur)) {
        const key = getStudentKey(cur);
        if (key) enrolledSet.add(key);
      }
    }
  } catch (e) {}

  return enrolledSet.size;
}

export default function BiologyCoursePage({ 
  data = {},
  selectedCourseId,
  onNavigateHome,
  onNavigateDashboard,
  onNavigateExams, 
  onNavigateLeaderboard,
  onNavigateStore,
  onNavigateAbout,
  onNavigateDevices,
  onNavigateOrders,
  onNavigatePolicies,
  onOpenAdmin,
  onLoginClick,
  onOpenProfile,
  onOpenLesson,
  onEnrollSuccess,
  onUpdateCourse
}) {
  const { isDark } = useTheme();
  const siteSettings = data.siteSettings || {};

  // Build full list of all available courses across dynamic state and seeds
  const allCoursesList = React.useMemo(() => {
    return [
      ...(Array.isArray(data?.courses) ? data.courses : []),
      physicsFinishingTouchCourseData,
      ...(Array.isArray(initialData?.courses) ? initialData.courses : []),
      ...(Array.isArray(homeCoursesData) ? homeCoursesData : []),
      ...(Array.isArray(freeCoursesData) ? freeCoursesData : [])
    ];
  }, [data?.courses]);

  // Clean target identifier
  const targetId = React.useMemo(() => {
    try {
      return decodeURIComponent(String(selectedCourseId || '').trim()).toLowerCase();
    } catch {
      return String(selectedCourseId || '').trim().toLowerCase();
    }
  }, [selectedCourseId]);

  // Find course matching targetId
  const foundCourse = React.useMemo(() => {
    if (!targetId || targetId === 'master-english-30-days') {
      return (
        allCoursesList.find(c => {
          const cid = String(c?.id || '').trim().toLowerCase();
          const cslug = String(c?.slug || '').trim().toLowerCase();
          return cid === 'master-english-30-days' || cslug === 'master-english-30-days';
        }) || masterEnglishCourseData
      );
    }

    // 1. Exact match on id, slug, key, title
    const exact = allCoursesList.find(c => {
      if (!c) return false;
      const cid = String(c.id || '').trim().toLowerCase();
      const cslug = String(c.slug || '').trim().toLowerCase();
      const ckey = String(c.key || '').trim().toLowerCase();
      const ctitle = String(c.title || c.name || '').trim().toLowerCase();
      return cid === targetId || cslug === targetId || ckey === targetId || ctitle === targetId;
    });
    if (exact) return exact;

    // 2. Substring match
    const fuzzy = allCoursesList.find(c => {
      if (!c) return false;
      const ctitle = String(c.title || c.name || '').trim().toLowerCase();
      const cslug = String(c.slug || '').trim().toLowerCase();
      return (
        (ctitle && (ctitle.includes(targetId) || targetId.includes(ctitle))) ||
        (cslug && (cslug.includes(targetId) || targetId.includes(cslug)))
      );
    });
    return fuzzy || null;
  }, [allCoursesList, targetId]);

  const isMasterEnglish = (
    targetId === 'master-english-30-days' ||
    foundCourse?.id === 'master-english-30-days' ||
    foundCourse?.slug === 'master-english-30-days'
  );

  const isPhysicsFinishingTouch = (
    targetId === 'physics-finishing-touch-series' ||
    targetId === 'course-1791887161017' ||
    targetId.includes('physics-finishing') ||
    foundCourse?.id === 'course-1791887161017' ||
    foundCourse?.slug === 'physics-finishing-touch-series' ||
    (foundCourse?.title && String(foundCourse.title).toLowerCase().includes('physics finishing'))
  );

  const baseCourse = React.useMemo(() => {
    if (isMasterEnglish || (!foundCourse && (!targetId || targetId === 'master-english-30-days'))) {
      return {
        ...masterEnglishCourseData,
        ...(foundCourse || {}),
        name: foundCourse?.title || foundCourse?.name || masterEnglishCourseData.name,
        tagline: foundCourse?.tagline || foundCourse?.description || masterEnglishCourseData.tagline,
        aboutText: foundCourse?.aboutText || foundCourse?.description || masterEnglishCourseData.aboutText,
        totalClasses: foundCourse?.totalClasses || masterEnglishCourseData.totalClasses,
        features: (foundCourse?.features && foundCourse.features.length > 0) ? foundCourse.features : masterEnglishCourseData.features,
        supportPhone: foundCourse?.supportPhone || siteSettings.contactPhone || "01342227935",
        curriculum: (foundCourse?.curriculum && foundCourse.curriculum.length > 0) ? foundCourse.curriculum : masterEnglishCourseData.curriculum,
        salePrice: foundCourse?.salePrice !== undefined ? foundCourse.salePrice : masterEnglishCourseData.salePrice,
        regularPrice: foundCourse?.regularPrice !== undefined ? foundCourse.regularPrice : masterEnglishCourseData.regularPrice,
        previewVideoUrl: foundCourse?.previewVideoUrl || masterEnglishCourseData.previewVideoUrl,
        category: foundCourse?.category || masterEnglishCourseData.category,
        isFree: Boolean(foundCourse?.isFree ?? masterEnglishCourseData.isFree),
        playlistId: foundCourse?.playlistId || masterEnglishCourseData.playlistId || null,
        isActive: foundCourse?.isActive !== false
      };
    }

    if (isPhysicsFinishingTouch) {
      const fc = foundCourse || {};
      const baseCurriculum = (fc.curriculum && fc.curriculum.length > 0) ? fc.curriculum : physicsFinishingTouchCourseData.curriculum;
      const seedSec0 = physicsFinishingTouchCourseData.curriculum?.[0];
      const seedLessons0 = (seedSec0?.chapters && seedSec0.chapters[0]?.lessons) || seedSec0?.lessons || [];

      const enrichedCurriculum = baseCurriculum.map((sec, sIdx) => {
        const seedLessons = sIdx === 0 ? seedLessons0 : [];
        const hasChapterLessons = Array.isArray(sec.chapters) && sec.chapters.some(ch => (ch.lessons || []).length > 0);
        if (hasChapterLessons) {
          const newChaps = sec.chapters.map((ch, cIdx) => {
            const enrichedLessons = (ch.lessons || []).map((l, lIdx) => {
              const seedL = (sIdx === 0 && cIdx === 0) ? seedLessons[lIdx] : null;
              if (!seedL) return l;
              return {
                ...seedL,
                ...l,
                videoUrl: l.videoUrl || seedL.videoUrl,
                pdfUrl: l.pdfUrl || seedL.pdfUrl,
                quiz: l.quiz || seedL.quiz,
                duration: l.duration || seedL.duration
              };
            });
            const finalLessons = enrichedLessons.length > 0 
              ? enrichedLessons 
              : ((sIdx === 0 && cIdx === 0) ? seedLessons : []);
            return { ...ch, lessons: finalLessons };
          });
          const allLessons = newChaps.flatMap(c => c.lessons || []);
          return { ...sec, chapters: newChaps, lessons: allLessons };
        }
        const enrichedLessons = (sec.lessons || []).map((l, lIdx) => {
          const seedL = sIdx === 0 ? seedLessons[lIdx] : null;
          if (!seedL) return l;
          return {
            ...seedL,
            ...l,
            videoUrl: l.videoUrl || seedL.videoUrl,
            pdfUrl: l.pdfUrl || seedL.pdfUrl,
            quiz: l.quiz || seedL.quiz,
            duration: l.duration || seedL.duration
          };
        });
        const finalLessons = enrichedLessons.length > 0 ? enrichedLessons : (sIdx === 0 ? seedLessons : []);
        return { 
          ...sec, 
          lessons: finalLessons,
          chapters: (sec.chapters && sec.chapters.length > 0) 
            ? sec.chapters 
            : [{ id: `chap-${sIdx}`, name: '', lessons: finalLessons }]
        };
      });

      return {
        ...physicsFinishingTouchCourseData,
        ...fc,
        name: fc.title || fc.name || physicsFinishingTouchCourseData.name,
        title: fc.title || fc.name || physicsFinishingTouchCourseData.name,
        tagline: fc.tagline || fc.description || physicsFinishingTouchCourseData.tagline,
        aboutText: fc.aboutText || fc.description || physicsFinishingTouchCourseData.aboutText,
        totalClasses: fc.totalClasses || physicsFinishingTouchCourseData.totalClasses,
        features: (fc.features && fc.features.length > 0) ? fc.features : physicsFinishingTouchCourseData.features,
        curriculum: enrichedCurriculum,
        salePrice: fc.salePrice !== undefined ? fc.salePrice : physicsFinishingTouchCourseData.salePrice,
        regularPrice: fc.regularPrice !== undefined ? fc.regularPrice : physicsFinishingTouchCourseData.regularPrice,
        previewVideoUrl: fc.previewVideoUrl || physicsFinishingTouchCourseData.previewVideoUrl,
        category: fc.category || physicsFinishingTouchCourseData.category,
        isFree: Boolean(fc.isFree ?? physicsFinishingTouchCourseData.isFree),
        isActive: fc.isActive !== false
      };
    }

    // Non-Master English (e.g. custom courses)
    const fc = foundCourse || {};
    const defaultFeatures = [
      'HD কোয়ালিটি লাইভ ও রেকর্ডেড ক্লাস',
      'অধ্যায়ভিত্তিক লেকচার নোট ও প্র্যাকটিস শিট',
      'এক্সক্লুসিভ এক্সাম ও সলভ ক্লাস',
      '২৪/৭ টেলিগ্রাম ডাউট সলভিং সাপোর্ট'
    ];

    return {
      id: fc.id || selectedCourseId,
      slug: fc.slug || selectedCourseId,
      key: fc.key || fc.id || selectedCourseId,
      name: fc.title || fc.name || 'কোর্স বিস্তারিত',
      title: fc.title || fc.name || 'কোর্স বিস্তারিত',
      tagline: fc.tagline || fc.description || 'সেরা শিক্ষকমণ্ডলীর সাথে নিশ্চিত প্রস্তুতির যাত্রা',
      aboutText: fc.aboutText || fc.description || 'এই কোর্সটিতে রয়েছে পূর্ণাঙ্গ সিলেবাস কভারেজ, স্ট্যান্ডার্ড প্র্যাকটিস ম্যাটেরিয়াল ও সার্বক্ষণিক মেন্টরিং সুবিধা।',
      totalClasses: fc.totalClasses || (Array.isArray(fc.curriculum) ? `${fc.curriculum.length}টি মডিউল` : 'চলমান ব্যাচ'),
      studentsCount: fc.studentsCount || '১২৫০+',
      features: (Array.isArray(fc.features) && fc.features.length > 0) ? fc.features : defaultFeatures,
      supportPhone: fc.supportPhone || siteSettings.contactPhone || "01342227935",
      curriculum: Array.isArray(fc.curriculum) ? fc.curriculum : [],
      salePrice: fc.salePrice !== undefined ? fc.salePrice : (fc.price !== undefined ? fc.price : 499),
      regularPrice: fc.regularPrice !== undefined ? fc.regularPrice : (fc.originalPrice !== undefined ? fc.originalPrice : null),
      previewVideoUrl: fc.previewVideoUrl || fc.videoUrl || null,
      image: fc.image || fc.thumbnail || '/logo.png',
      category: fc.category || 'Academic & Admission',
      isFree: Boolean(fc.isFree || Number(fc.salePrice || fc.price) === 0),
      playlistId: fc.playlistId || null,
      isActive: fc.isActive !== false
    };
  }, [foundCourse, isMasterEnglish, selectedCourseId, siteSettings.contactPhone]);

  const [courseOverride, setCourseOverride] = useState(null);

  // Reset override when course id changes
  useEffect(() => {
    setCourseOverride(null);
  }, [selectedCourseId]);

  const course = courseOverride || baseCourse;
  const setCourse = setCourseOverride;

  const [enrollmentTick, setEnrollmentTick] = useState(0);

  useEffect(() => {
    const handleSync = () => {
      setEnrollmentTick(t => t + 1);
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('eduhunters_data_updated', handleSync);
    window.addEventListener('eh:enrollment_updated', handleSync);
    window.addEventListener('eh:orders_updated', handleSync);
    window.addEventListener('eh:new_enrollment', handleSync);
    window.addEventListener('eh:enrollment_approved', handleSync);
    window.addEventListener('eh_user_changed', handleSync);

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('eduhunters_sync_channel');
        bc.onmessage = (msg) => {
          if (msg && msg.data) {
            handleSync();
          }
        };
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('eduhunters_data_updated', handleSync);
      window.removeEventListener('eh:enrollment_updated', handleSync);
      window.removeEventListener('eh:orders_updated', handleSync);
      window.removeEventListener('eh:new_enrollment', handleSync);
      window.removeEventListener('eh:enrollment_approved', handleSync);
      window.removeEventListener('eh_user_changed', handleSync);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
    };
  }, []);

  const displayedStudentsCount = React.useMemo(() => {
    const realStudents = getRealCourseEnrolledStudentsCount(course, data);
    return `${realStudents}`;
  }, [course?.id, course?.slug, course?.title, course?.name, data?.users, data?.accounting, data?.bundles, enrollmentTick]);

  const computedTotalClasses = React.useMemo(() => {
    if (!Array.isArray(course?.curriculum)) return 0;
    return course.curriculum.reduce((acc, sec) => {
      const fromChapters = (sec.chapters || []).reduce((cAcc, c) => cAcc + (c.lessons || []).length, 0);
      const fromLessons = (sec.lessons || []).length;
      return acc + (fromChapters > 0 ? fromChapters : fromLessons);
    }, 0);
  }, [course?.curriculum]);

  const { currentUser } = useAuth();
  const isCourseEnrolled = useEnrollmentStatus(course, currentUser, data);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return siteSettings.youtubeApiKey || localStorage.getItem('eduhunters_yt_api_key') || DEFAULT_YT_API_KEY || '';
  });
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Background auto-sync on mount if course has playlistId, no curriculum yet, and API key is present
  useEffect(() => {
    const key = siteSettings.youtubeApiKey || localStorage.getItem('eduhunters_yt_api_key') || DEFAULT_YT_API_KEY;
    const hasCurriculum = course.curriculum && course.curriculum.length > 0 && course.curriculum[0]?.chapters?.[0]?.lessons?.length > 0;
    if (course.playlistId && key && !hasCurriculum) {
      syncCourseWithYouTube(course, key, false)
        .then(updated => {
          if (updated && updated.curriculum) {
            setCourse(updated);
          }
        })
        .catch(err => console.warn('YouTube auto-sync note:', err));
    }
  }, [course.playlistId]);

  const handleManualSync = async () => {
    const key = siteSettings.youtubeApiKey || localStorage.getItem('eduhunters_yt_api_key') || apiKeyInput.trim() || DEFAULT_YT_API_KEY;
    if (!key) {
      setShowApiKeyModal(true);
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('ইউটিউব থেকে প্লেলিস্টের ভিডিও লোড হচ্ছে...');
    try {
      const updated = await syncCourseWithYouTube(course, key, true);
      if (updated && updated.curriculum) {
        setCourse(updated);
        setSyncStatusMsg(`✅ সফলভাবে সিঙ্ক সম্পন্ন! মোট ${updated.curriculum[0]?.chapters?.[0]?.lessons?.length || 0}টি ক্লাস পাওয়া গেছে।`);
        setTimeout(() => setSyncStatusMsg(''), 4000);
      }
    } catch (err) {
      setSyncStatusMsg(`❌ সিঙ্ক সমস্যা: ${err.message || 'API কী পরীক্ষা করুন।'}`);
      setTimeout(() => setSyncStatusMsg(''), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveApiKeyAndSync = async () => {
    if (!apiKeyInput.trim()) return;
    try {
      localStorage.setItem('eduhunters_yt_api_key', apiKeyInput.trim());
    } catch {}
    setShowApiKeyModal(false);
    handleManualSync();
  };

  const [expandedSections, setExpandedSections] = useState({ 0: true });
  const [expandedChapters, setExpandedChapters] = useState({ '0-0': true, '1-0': true });
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showExamEngine, setShowExamEngine] = useState(false);
  const [activePdfLesson, setActivePdfLesson] = useState(null);

  // Robust Paper / Subject resolution for both Physics 1st Paper & 2nd Paper
  const sectionsToRender = React.useMemo(() => {
    const rawCurriculum = Array.isArray(course?.curriculum) ? course.curriculum : [];
    if (rawCurriculum.length === 0) return [];

    const isPhysics = (
      course?.id === 'course-1791887161017' ||
      course?.slug === 'physics-finishing-touch-series' ||
      (course?.title && /physics/i.test(course.title))
    );

    if (isPhysics) {
      const sec1 = rawCurriculum[0] ? {
        ...rawCurriculum[0],
        name: rawCurriculum[0].name && !/finishing touch series/i.test(rawCurriculum[0].name)
          ? rawCurriculum[0].name
          : 'Physics 1st Paper'
      } : {
        id: 'sec-physics-1st-paper',
        name: 'Physics 1st Paper',
        title: 'Physics 1st Paper',
        chapters: [],
        lessons: []
      };

      const defaultSec2 = physicsFinishingTouchCourseData.curriculum[1];
      const sec2Candidate = rawCurriculum[1];
      const hasSec2Content = sec2Candidate && (
        (sec2Candidate.lessons && sec2Candidate.lessons.length > 0) ||
        (sec2Candidate.chapters && sec2Candidate.chapters.some(c => c.lessons && c.lessons.length > 0))
      );
      const baseSec2 = hasSec2Content ? sec2Candidate : defaultSec2;
      const sec2 = {
        ...baseSec2,
        name: baseSec2?.name && !/finishing touch series/i.test(baseSec2.name)
          ? baseSec2.name
          : 'Physics 2nd Paper',
        title: baseSec2?.title || 'Physics 2nd Paper'
      };

      return [sec1, sec2, ...rawCurriculum.slice(2)];
    }

    return rawCurriculum;
  }, [course?.curriculum, course?.id, course?.slug, course?.title]);

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Profile Completion Guard for Free Trial Classes
  const [showProfileCompleteModal, setShowProfileCompleteModal] = useState(false);
  const [pendingFreeLesson, setPendingFreeLesson] = useState(null);

  const handleAccessFreeTrialLesson = (lessonInfo) => {
    // 1. If student already has full paid enrollment in this course, allow direct access
    if (isCourseEnrolled) {
      if (onOpenLesson) {
        onOpenLesson(course.id || course.slug || selectedCourseId, lessonInfo);
      }
      return;
    }

    // 2. Check if student is logged in
    if (!currentUser) {
      if (onLoginClick) {
        onLoginClick(() => {
          setTimeout(() => {
            try {
              const rawUser = localStorage.getItem('eh_current_user');
              const u = rawUser ? JSON.parse(rawUser) : null;
              if (u && isStudentProfileComplete(u)) {
                if (onOpenLesson) onOpenLesson(course.id || course.slug || selectedCourseId, lessonInfo);
              } else {
                setPendingFreeLesson(lessonInfo);
                setShowProfileCompleteModal(true);
              }
            } catch {}
          }, 350);
        });
      }
      triggerToast('ফ্রি ট্রায়াল ক্লাস করতে প্রথমে অ্যাকাউন্টে লগইন বা সাইন-আপ করুন');
      return;
    }

    // 3. Check if profile is complete (Name, Mobile Number, College Name, HSC Batch/Class)
    if (!isStudentProfileComplete(currentUser)) {
      setPendingFreeLesson(lessonInfo);
      setShowProfileCompleteModal(true);
      return;
    }

    // 4. Profile is complete! Open free trial class immediately
    if (onOpenLesson) {
      onOpenLesson(course.id || course.slug || selectedCourseId, lessonInfo);
    }
  };



  const handleOpenCheckout = () => {
    if (course.isActive === false && !isAdmin) {
      alert('দুঃখিত, এই কোর্সটি বর্তমানে সাময়িকভাবে বন্ধ রাখা হয়েছে। নতুন ভর্তি কার্যক্রম স্থগিত রয়েছে।');
      return;
    }
    // 1. If not authenticated: must log in or sign up first
    if (!currentUser) {
      if (onLoginClick) {
        onLoginClick((loggedInUser) => {
          const targetUser = loggedInUser || currentUser;
          // After auth, verify profile completeness (Name, WhatsApp, College)
          if (!isStudentProfileComplete(targetUser)) {
            if (onOpenProfile) {
              onOpenProfile({
                hintNotice: 'Please complete your profile with your name, college, and WhatsApp number to finish enrolling.',
                requireCompletion: true,
                onComplete: () => {
                  setShowCheckout(true);
                }
              });
            } else {
              setShowCheckout(true);
            }
          } else {
            setShowCheckout(true);
          }
        });
      }
      return;
    }

    // 2. If authenticated: verify profile completeness (Name, WhatsApp, College)
    if (!isStudentProfileComplete(currentUser)) {
      if (onOpenProfile) {
        onOpenProfile({
          hintNotice: 'Please complete your profile with your name, college, and WhatsApp number to finish enrolling.',
          requireCompletion: true,
          onComplete: () => {
            setShowCheckout(true);
          }
        });
      } else {
        setShowCheckout(true);
      }
      return;
    }

    // 3. Authenticated and profile is complete -> proceed to payment/checkout
    setShowCheckout(true);
  };

  const toggleSection = (secId) => {
    setExpandedSections(prev => ({
      ...prev,
      [secId]: !prev[secId]
    }));
  };

  const toggleChapter = (key) => {
    setExpandedChapters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderLessonRow = (lesson, lIdx, sIdx, cIdx) => {
    const isObj = typeof lesson === 'object' && lesson !== null;
    const rawTitle = isObj ? lesson.title : lesson;
    const isUrlTitle = typeof rawTitle === 'string' && (rawTitle.startsWith('http://') || rawTitle.startsWith('https://') || rawTitle.includes('youtu.be') || rawTitle.includes('youtube.com'));
    const displayTitle = isUrlTitle 
      ? `লেকচার ${lIdx + 1}: ক্লাস ভিডিও` 
      : (rawTitle || `লেকচার ${lIdx + 1}`);
    const duration = isObj ? lesson.duration : null;
    const isFree = isObj ? Boolean(lesson.isFree) : false;
    const isUnlocked = isFree || isCourseEnrolled || isAdmin;
    const videoUrl = isObj ? (lesson.videoUrl || (isUrlTitle ? rawTitle : null)) : (isUrlTitle ? rawTitle : null);
    const pdfUrl = isObj ? lesson.pdfUrl : null;
    const quiz = isObj ? (lesson.quiz || lesson.exam) : null;
    const quizCount = quiz?.totalQuestions || (Array.isArray(quiz?.questions) ? quiz.questions.length : (quiz ? 50 : 0));

    const handleLessonPdfClick = (e) => {
      e.stopPropagation();
      if (!isUnlocked) {
        handleOpenCheckout();
        return;
      }
      if (isFree && !isCourseEnrolled) {
        if (!currentUser) {
          if (onLoginClick) onLoginClick();
          triggerToast('ফ্রি নোট দেখতে প্রথমে লগইন করুন');
          return;
        }
        if (!isStudentProfileComplete(currentUser)) {
          const targetLessonInfo = {
            title: displayTitle,
            videoUrl: videoUrl || course.previewVideoUrl,
            pdfUrl,
            duration,
            lessonIdx: lIdx,
            activeTab: 'notes'
          };
          setPendingFreeLesson(targetLessonInfo);
          setShowProfileCompleteModal(true);
          return;
        }
      }
      setActivePdfLesson({
        title: displayTitle,
        pdfUrl
      });
    };

    return (
      <div 
        key={lesson.id || `${sIdx}-${cIdx}-${lIdx}`} 
        className={`group flex items-center justify-between p-3.5 pl-4 sm:pl-6 transition-all cursor-pointer ${
          isUnlocked 
            ? (isDark ? 'bg-[#1c080e]/60 hover:bg-[#280a13]' : 'bg-white hover:bg-red-50/50') 
            : (isDark ? 'hover:bg-[#1a0409]' : 'hover:bg-gray-100/60')
        }`}
        onClick={() => {
          if (isUnlocked) {
            let calculatedGlobalIndex = 0;
            for (let i = 0; i < sIdx; i++) {
              const prevSec = sectionsToRender[i];
              if (prevSec) {
                const prevCount = (prevSec.lessons || []).length > 0
                  ? prevSec.lessons.length
                  : (prevSec.chapters || []).reduce((acc, ch) => acc + (ch.lessons || []).length, 0);
                calculatedGlobalIndex += prevCount;
              }
            }
            calculatedGlobalIndex += lIdx;

            const targetLessonInfo = {
              id: (lesson && typeof lesson === 'object' && lesson.id) ? lesson.id : `s${sIdx}-l${lIdx}`,
              title: displayTitle,
              videoUrl: videoUrl || '',
              pdfUrl,
              duration,
              lessonIdx: lIdx,
              secIdx: sIdx,
              globalIndex: calculatedGlobalIndex
            };
            if (isFree && !isCourseEnrolled) {
              handleAccessFreeTrialLesson(targetLessonInfo);
            } else if (onOpenLesson) {
              onOpenLesson(course.id || course.slug || selectedCourseId, targetLessonInfo);
            }
          } else {
            handleOpenCheckout();
          }
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${
            isUnlocked 
              ? 'bg-red-100 text-red-600 shadow-2xs' 
              : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500')
          }`}>
            {isUnlocked ? (
              <Play className="w-3.5 h-3.5 fill-red-600 text-red-600 ml-0.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {String(lIdx + 1).padStart(2, '0')}
              </span>
              <p className={`text-sm font-semibold truncate transition-colors ${isDark ? 'text-gray-100 group-hover:text-red-400' : 'text-[#111827] group-hover:text-[#dc2626]'}`}>
                {displayTitle}
              </p>
            </div>
            {isUrlTitle && (
              <p className="text-[11px] text-gray-400 truncate font-mono mt-0.5">
                {rawTitle}
              </p>
            )}

                      </div>
        </div>

        {/* Right side icons and actions */}
        <div className="shrink-0 ml-3 flex items-center gap-1.5 sm:gap-2">
          {/* PDF Icon (clean neutral icon button, only if PDF exists) */}
          {pdfUrl && (
            <button
              type="button"
              onClick={handleLessonPdfClick}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="লেকচার শিট PDF দেখুন"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

          {/* Quiz Icon (clean neutral icon button, only if Quiz exists) */}
          {quiz && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!isUnlocked) {
                  handleOpenCheckout();
                  return;
                }
                let calculatedGlobalIndex = 0;
                for (let i = 0; i < sIdx; i++) {
                  const prevSec = sectionsToRender[i];
                  if (prevSec) {
                    const prevCount = (prevSec.lessons || []).length > 0
                      ? prevSec.lessons.length
                      : (prevSec.chapters || []).reduce((acc, ch) => acc + (ch.lessons || []).length, 0);
                    calculatedGlobalIndex += prevCount;
                  }
                }
                calculatedGlobalIndex += lIdx;

                const targetLessonInfo = {
                  id: (lesson && typeof lesson === 'object' && lesson.id) ? lesson.id : `s${sIdx}-l${lIdx}`,
                  title: displayTitle,
                  videoUrl: videoUrl || '',
                  pdfUrl,
                  duration,
                  lessonIdx: lIdx,
                  secIdx: sIdx,
                  globalIndex: calculatedGlobalIndex,
                  activeTab: 'quiz'
                };
                if (isFree && !isCourseEnrolled) {
                  handleAccessFreeTrialLesson(targetLessonInfo);
                } else if (onOpenLesson) {
                  onOpenLesson(course.id || course.slug || selectedCourseId, targetLessonInfo);
                }
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title={quizCount ? `কুইজ পরীক্ষা (${quizCount}টি প্রশ্ন)` : 'কুইজ পরীক্ষা'}
            >
              <Zap className="w-4 h-4" />
            </button>
          )}

          {/* FREE / Locked Badge */}
          {isFree ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 select-none">
              Free Preview
            </span>
          ) : !isUnlocked ? (
            <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-gray-400 border border-gray-500/20 shrink-0 select-none">
              <Lock className="w-2.5 h-2.5" /> Locked
            </span>
          ) : null}


        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen pb-20 lg:pb-12 font-sans antialiased transition-colors duration-300 selection:bg-[#e11438] selection:text-white ${
      isDark ? 'bg-transparent text-gray-100' : 'bg-[#F8F9FA] text-[#111827]'
    }`}>
      {/* Shared Sticky Navbar */}
      <Navbar 
        activePage="courses"
        siteSettings={siteSettings}
        onNavigateHome={onNavigateHome}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateCourse={() => {}}
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

      {/* Main Course Content with clearance */}
      <main className="pt-20 md:pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Main Details Column */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            
            {/* Inactive Notice Banner for Students */}
            {course.isActive === false && !isAdmin && (
              <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⚠️</span>
                  <span className="text-xs sm:text-sm font-bold">
                    এই কোর্সটি বর্তমানে অ্যাডমিন প্যানেল থেকে ইনঅ্যাক্টিভ (স্থগিত) রাখা হয়েছে। নতুন ভর্তি কার্যক্রম সাময়িকভাবে বন্ধ আছে।
                  </span>
                </div>
                {onNavigateHome && (
                  <button
                    onClick={onNavigateHome}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shrink-0 cursor-pointer border-none hover:bg-amber-600 transition-colors"
                  >
                    সকল কোর্স দেখুন
                  </button>
                )}
              </div>
            )}



            {/* Course About Box */}
            <div className={`rounded-2xl p-6 md:p-7 transition-all border ${
              isDark 
                ? 'border-[#e11438]/25 bg-[#140307]/80 shadow-[0_8px_30px_rgba(0,0,0,0.4)]' 
                : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                  isDark ? 'bg-[#28050e] border border-[#e11438]/30 text-[#ff3b61]' : 'bg-red-50 text-[#dc2626] border border-red-100'
                }`}>
                  <BookOpen className="w-5 h-5" />
                </span>
                <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>কোর্স সম্পর্কে</h2>
              </div>
              <div className={`text-sm leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {course.aboutText}
              </div>
            </div>

            {/* Course Curriculum & Papers Dropdown Accordion Boxes */}
            <div id="curriculum-section" className={`rounded-2xl p-4 sm:p-6 border transition-all ${
              isDark 
                ? 'bg-[#120407]/90 shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-[#e11438]/20' 
                : 'bg-white shadow-sm border-gray-200'
            }`}>
              {/* If Admin is logged in, show sleek admin control bar */}


              {/* Paper Dropdown Accordion Boxes */}
              {sectionsToRender && sectionsToRender.length > 0 ? (
                <div className="space-y-3.5">
                  {sectionsToRender.map((section, sIdx) => {
                    // Section 0 (Physics 1st Paper) is open by default; Section 1 (Physics 2nd Paper) is closed by default
                    const isSectionOpen = expandedSections[sIdx] ?? (sIdx === 0 || (sIdx === 1 && (section.lessons?.length > 0 || section.chapters?.[0]?.lessons?.length > 0)));
                    
                    const sectionLessons = (Array.isArray(section.lessons) && section.lessons.length > 0)
                      ? section.lessons
                      : (section.chapters || []).flatMap(c => c.lessons || []);
                    const lessonCount = sectionLessons.length;

                    return (
                      <div 
                        key={section.id || sIdx}
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isDark 
                            ? (isSectionOpen 
                                ? 'border-[#e11438]/40 bg-[#17040a] shadow-lg shadow-[#e11438]/10' 
                                : 'border-[#e11438]/20 bg-[#160308]/80 hover:border-[#e11438]/35') 
                            : (isSectionOpen 
                                ? 'border-red-200 bg-white shadow-md' 
                                : 'border-slate-200 bg-slate-50/70 hover:border-slate-300')
                        }`}
                      >
                        {/* Dropdown Box Header Button */}
                        <div
                          onClick={() => toggleSection(sIdx)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(sIdx); } }}
                          className={`w-full px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer select-none ${
                            isDark 
                              ? (isSectionOpen ? 'bg-[#22060e] border-b border-[#e11438]/25' : 'hover:bg-[#20050c]') 
                              : (isSectionOpen ? 'bg-red-50/60 border-b border-red-100' : 'hover:bg-slate-100/70')
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                              isDark 
                                ? (isSectionOpen ? 'bg-[#ff2a55] text-white border-transparent shadow-sm shadow-red-500/30' : 'bg-white/5 text-gray-300 border-[#e11438]/20') 
                                : (isSectionOpen ? 'bg-[#e11438] text-white border-transparent shadow-sm' : 'bg-white text-slate-700 border-slate-200')
                            }`}>
                              <BookOpen className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <h3 className={`text-sm sm:text-base font-extrabold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {section.name || section.title || `Paper ${sIdx + 1}`}
                              </h3>
                              {section.summary && (
                                <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {section.summary}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wide ${
                              lessonCount > 0
                                ? (isDark ? 'bg-white/10 text-gray-200 border border-white/10' : 'bg-red-100 text-red-700')
                                : (isDark ? 'bg-white/5 text-gray-400' : 'bg-slate-200/70 text-slate-500')
                            }`}>
                              {lessonCount > 0 ? `${lessonCount} Classes` : '0 Classes'}
                            </span>



                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 ${
                              isSectionOpen ? 'rotate-180 text-[#ff2a55]' : (isDark ? 'text-gray-400' : 'text-slate-500')
                            }`}>
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Box Content (Body): Ultra-Smooth In-Out Accordion Transition */}
                        <div 
                          className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
                            isSectionOpen 
                              ? 'grid-rows-[1fr] opacity-100' 
                              : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                          }`}
                        >
                          <div className="min-h-0 overflow-hidden">
                            {sectionLessons.length > 0 ? (
                              <div className={`divide-y ${isDark ? 'divide-[#e11438]/10' : 'divide-gray-100'}`}>
                                {sectionLessons.map((lesson, lIdx) => renderLessonRow(lesson, lIdx, sIdx, 0))}
                              </div>
                            ) : (
                              /* Empty state for Physics 2nd Paper or new empty paper */
                              <div className="py-8 px-6 text-center space-y-3">
                                <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center text-xl">
                                  📖
                                </div>
                                <div>
                                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {section.name ? `${section.name}-এর ক্লাস খুব শীঘ্রই শুরু হবে` : 'ক্লাসসমূহ খুব শীঘ্রই যুক্ত করা হবে'}
                                  </h4>
                                  <p className={`text-xs mt-1 max-w-sm mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    এই পেপারের রেকর্ডেড লেকচার, নোট ও লাইভ এক্সাম শিডিউল দ্রুততম সময়ে আপলোড করা হবে।
                                  </p>
                                </div>

                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`p-8 text-center rounded-2xl border ${
                  isDark ? 'bg-white/[0.02] border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center text-2xl">
                    📚
                  </div>
                  <h4 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ক্লাস কারিকুলাম ও শিডিউল আপডেট হচ্ছে
                  </h4>
                  <p className="text-xs max-w-sm mx-auto leading-relaxed text-gray-400">
                    এই কোর্সের প্রতিটি অধ্যায়ের রেকর্ডেড ক্লাস, লাইভ ক্লাস রুটিন ও লেকচার নোট খুব শীঘ্রই আপলোড করা হবে।
                  </p>
                </div>
              )}
            </div>

            {/* Support Box */}
            <div className={`rounded-3xl p-5 sm:p-6 transition-all space-y-4 border ${
              isDark 
                ? 'border-[#e11438]/25 bg-[#140307]/80' 
                : 'border-red-100 bg-white shadow-xs hover:shadow-md'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border ${
                  isDark ? 'bg-[#2a060e] text-[#ff3b61] border-[#e11438]/30' : 'bg-red-50 text-[#dc2626] border-red-100/80 shadow-2xs'
                }`}>
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-black leading-tight mb-0.5 ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                    সাপোর্টে যোগাযোগ করুন
                  </h3>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    কোর্স সম্পর্কিত যেকোনো সমস্যার সমাধানে আমাদের সাথে যোগাযোগ করুন
                  </p>
                </div>
              </div>

              <div className="pt-1">
                {(() => {
                  const activeWa = siteSettings?.whatsappNumber || ((course.supportPhone && !course.supportPhone.includes('1700') && !course.supportPhone.includes('1321228612')) ? course.supportPhone : ((siteSettings.contactPhone && !siteSettings.contactPhone.includes('1700')) ? siteSettings.contactPhone : '01342227935'));
                  const cleanWa = activeWa.replace(/[^0-9]/g, '').replace(/^88/, '') || '01342227935';
                  return (
                    <a 
                      href={`https://wa.me/88${cleanWa}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className={`flex items-center justify-center sm:justify-start gap-3 rounded-2xl px-4 py-3 transition-all text-decoration-none group cursor-pointer border ${
                        isDark 
                          ? 'border-emerald-500/30 bg-[#06180f] hover:bg-[#0b2417]' 
                          : 'border-emerald-200/80 bg-emerald-50/60 hover:bg-emerald-100/80'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <span className="block text-sm font-black text-emerald-600 leading-tight">WhatsApp এ মেসেজ করুন</span>
                        <span className="block text-[11px] text-gray-500 font-medium">{activeWa} (দ্রুত উত্তর পাবেন)</span>
                      </div>
                    </a>
                  );
                })()}
              </div>
            </div>



          </div>

          {/* Right Sticky Sidebar Column */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className={`rounded-xl overflow-hidden border transition-all ${
                isDark 
                  ? 'bg-[#120407]/95 border-[#e11438]/25 shadow-2xl' 
                  : 'bg-white border-gray-200 shadow-sm'
              }`}>
                
                {/* Media Preview: Video iframe if previewVideoUrl exists, otherwise course banner image */}
                <div 
                  className="relative aspect-video bg-black border-b border-black/10 overflow-hidden select-none"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {course.previewVideoUrl ? (
                    <>
                      <iframe 
                        src={getEmbedUrl(course.previewVideoUrl)} 
                        title="Course Preview" 
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>

                      {/* Security Guard: Disables YouTube Top Bar */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-14 z-20 pointer-events-auto bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between px-3 py-2 cursor-default select-none"
                        onContextMenu={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white/95 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          EduHunters Class Preview
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-white/80">
                          🔒 Secure Stream
                        </span>
                      </div>
                    </>
                  ) : (
                    <img 
                      src={course.image || '/logo.png'} 
                      alt={course.name} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className={`px-4 py-4 border-b ${isDark ? 'border-[#e11438]/15' : 'border-gray-100'}`}>
                  <h2 className={`text-xl text-center sm:text-2xl font-black leading-tight break-words max-w-full ${
                    isDark ? 'text-white' : 'text-[#111827]'
                  }`}>
                    {course.name}
                  </h2>
                </div>

                <div className="p-4 sm:p-6">
                  {/* Features 2x2 Grid */}
                  <div className="mb-6">
                    <h3 className={`text-sm font-black mb-3 ${isDark ? 'text-white' : 'text-[#111827]'}`}>এই কোর্সে যা থাকছে</h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {((Array.isArray(course.features) && course.features.length > 0) ? course.features : [
                        'HD কোয়ালিটি লাইভ ও রেকর্ডেড ক্লাস',
                        'অধ্যায়ভিত্তিক লেকচার নোট ও প্র্যাকটিস শিট',
                        'এক্সক্লুসিভ এক্সাম ও সলভ ক্লাস',
                        '২৪/৭ টেলিগ্রাম ডাউট সলভিং সাপোর্ট'
                      ]).map((feat, i) => (
                        <div key={i} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
                          isDark ? 'border-[#e11438]/20 bg-[#160408]' : 'border-gray-200 bg-white'
                        }`}>
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dc2626]/10">
                            <Check className="w-3 h-3 text-[#dc2626]" strokeWidth={3} />
                          </span>
                          <span className={`text-xs font-semibold leading-tight ${isDark ? 'text-gray-200' : 'text-[#111827]'}`}>
                            {typeof feat === 'object' ? (feat?.text || feat?.title || '') : String(feat)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3 Metric Tiles */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className={`rounded-xl p-2 sm:p-3 flex items-center gap-2 text-left border ${
                      isDark ? 'border-[#e11438]/20 bg-[#19050d]' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center">
                        <svg className={`w-7 h-7 ${isDark ? 'text-[#ff6b8b]' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs text-gray-400 font-bold truncate">ভর্তি সংখ্যা</div>
                        <div className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>{displayedStudentsCount}</div>
                      </div>
                    </div>

                    <div className={`rounded-xl p-2 sm:p-3 flex items-center gap-2 text-left border ${
                      isDark ? 'border-[#e11438]/20 bg-[#19050d]' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center">
                        <svg className={`w-7 h-7 ${isDark ? 'text-[#ff6b8b]' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs text-gray-400 font-bold truncate">ক্লাস শুরু</div>
                        <div className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#111827]'}`}>চলমান ব্যাচ</div>
                      </div>
                    </div>
                  </div>

                  {/* Price Tag */}
                  {!isCourseEnrolled && (
                    <div className="flex items-center justify-center gap-3 mb-6">
                      {(course.isFree || Number(course.salePrice) === 0) ? (
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-4xl font-black text-emerald-500 drop-shadow-sm tracking-tight">FREE</span>
                          {course.regularPrice && (
                            <span className="text-xl text-gray-400 line-through font-bold">৳{Number(course.regularPrice).toLocaleString()}</span>
                          )}
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300/40">
                            ১০০% ফ্রি
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className={`text-4xl font-black ${isDark ? 'text-[#ff3b61]' : 'text-[#dc2626]'}`}>৳{Number(course.salePrice || 0).toLocaleString()}</span>
                          {course.regularPrice && (
                            <span className="text-xl text-gray-400 line-through font-bold">৳{Number(course.regularPrice).toLocaleString()}</span>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3">
                    {isCourseEnrolled ? (
                      <button 
                        onClick={() => {
                          if (onOpenLesson) {
                            onOpenLesson(course.id || course.slug || selectedCourseId, 0);
                          } else {
                            const elem = document.getElementById('curriculum-section');
                            if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="flex w-full items-center justify-center gap-2 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl transition-all border-none cursor-pointer shadow-lg shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] group"
                      >
                        <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                        ক্লাস শুরু করুন
                      </button>
                    ) : (course.isFree || Number(course.salePrice) === 0) ? (
                      <button 
                        onClick={() => {
                          handleAccessFreeTrialLesson(0);
                        }}
                        className="flex w-full items-center justify-center gap-2 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl transition-all border-none cursor-pointer shadow-lg shadow-emerald-600/30 group"
                      >
                        <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                        ফ্রি ক্লাস শুরু করুন
                      </button>
                    ) : course.isActive === false ? (
                      <div className="space-y-2">
                        <button 
                          disabled
                          className="flex w-full items-center justify-center gap-2 px-4 py-3.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-base rounded-xl border border-slate-300 dark:border-slate-700 cursor-not-allowed select-none"
                        >
                          ভর্তি সাময়িকভাবে বন্ধ আছে
                        </button>
                        <p className="text-[11px] text-center text-slate-400">
                          এই কোর্সটিতে বর্তমানে নতুন ভর্তি কার্যক্রম স্থগিত রয়েছে।
                        </p>
                      </div>
                    ) : (
                      <button 
                        onClick={handleOpenCheckout}
                        className="flex w-full items-center justify-center gap-2 px-4 py-3.5 bg-[#dc2626] hover:bg-red-700 text-white font-bold text-base rounded-xl transition-all border-none cursor-pointer shadow-[0_0_25px_rgba(220,38,38,0.45)] hover:shadow-[0_0_35px_rgba(220,38,38,0.65)] hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        Enroll Now
                      </button>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer (Hidden on mobile) */}
      <div className="hidden sm:block">
        {isDark ? (
          <footer className="bg-[#0f0205] text-white border-t border-[#e11438]/25 mt-16 py-10 text-center text-xs text-gray-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <p className="font-semibold text-[#ff3b61] mb-1">EDU HUNTERS · Premier Edtech Learning Platform</p>
                <p>© 2026 Edu Hunters. All rights reserved.</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('privacy') : (window.location.href = '/privacy-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Privacy Policy</button>
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Terms of Use</button>
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Refund Policy</button>
              </div>
            </div>
          </footer>
        ) : (
          <footer className="bg-[#dc2626] text-white border-t border-white/[0.06] mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20">
                <div className="flex flex-col justify-between gap-8">
                  <div>
                    <a href="/" className="inline-flex items-center gap-2 mb-6 text-decoration-none">
                      <span className="inline-flex items-center justify-center bg-white rounded-2xl px-4 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.18)]">
                        <img 
                          src="/logo.png" 
                          alt="Edu Hunters" 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <span className="ml-2 font-black text-xl">
                          <span className="text-[#6f0113]">Edu</span><span className="text-[#111827]">Hunters</span>
                        </span>
                      </span>
                    </a>
                    <p className="text-sm text-white/80 max-w-sm">
                      Academic to admission EDU HUNTERS with you. বাংলাদেশের সবচেয়ে নির্ভরযোগ্য মেডিকেল ও একাডেমিক লার্নিং প্ল্যাটফর্ম।
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-5">দ্রুত লিঙ্ক</p>
                    <ul className="space-y-3 list-none p-0 m-0">
                      <li><a href="#courses" onClick={(e) => { e.preventDefault(); if (onNavigateHome) onNavigateHome(); }} className="text-sm text-white/70 hover:text-white transition-colors text-decoration-none">All Courses</a></li>
                      <li><a href="#orders" onClick={(e) => { e.preventDefault(); if (onNavigateOrders) onNavigateOrders(); }} className="text-sm text-white/70 hover:text-white transition-colors text-decoration-none">Order History</a></li>
                      <li><button onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')} className="text-sm text-white/70 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer">Terms & Conditions</button></li>
                      <li><button onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')} className="text-sm text-white/70 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer">Refund Policy</button></li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-5">আমাদের ব্যাচ সমূহ</p>
                    <ul className="space-y-3 list-none p-0 m-0">
                      <li><span className="text-sm text-white font-semibold">Mastering Text Book Biology</span></li>
                      <li><span className="text-sm text-white/70">Mastering Text Book Chemistry</span></li>
                      <li><span className="text-sm text-white/70">Mastering Text Book Physics</span></li>
                      <li><span className="text-sm text-white/70">GK English Batch</span></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.1] pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-xs text-white/60">© 2026 Edu Hunters. All rights reserved.</p>
                <div className="flex items-center gap-6">
                  <button onClick={() => onNavigatePolicies ? onNavigatePolicies('privacy') : (window.location.href = '/privacy-policy')} className="text-xs text-white/60 hover:text-white bg-transparent border-none p-0 cursor-pointer">Privacy Policy</button>
                  <button onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')} className="text-xs text-white/60 hover:text-white bg-transparent border-none p-0 cursor-pointer">Terms of Use</button>
                  <button onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')} className="text-xs text-white/60 hover:text-white bg-transparent border-none p-0 cursor-pointer">Refund Policy</button>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Protected PDF Modal */}
      {showPdfViewer && (
        <ProtectedPdfViewer 
          bundle={{
            title: "Mastering Biology টেক্সটবুক এরিয়া মার্কিং নোট",
            pdfPageCount: 84
          }}
          userPhone="01712-345678"
          onClose={() => setShowPdfViewer(false)}
        />
      )}

      {/* Interactive Exam Modal */}
      {showExamEngine && (
        <ExamEngine 
          exam={initialData.exams[0]}
          onClose={() => setShowExamEngine(false)}
        />
      )}

      {/* Profile Completion Gate Modal for Free Trial Classes */}
      <ProfileModal
        isOpen={showProfileCompleteModal}
        onClose={() => {
          setShowProfileCompleteModal(false);
          setPendingFreeLesson(null);
        }}
        requireCompletion={true}
        title="প্রোফাইল তথ্য পূরণ করুন"
        subtitle="ফ্রি ট্রায়াল ক্লাসটি চালু করতে আপনার নাম, মোবাইল নম্বর, কলেজ এবং ক্লাস/ব্যাচ পূরণ করুন।"
        submitText="সংরক্ষণ করে ক্লাস শুরু করুন"
        hintNotice="✅ তথ্যগুলো সংরক্ষণ করার সাথে সাথেই ফ্রি ট্রায়াল ক্লাসটি চালু হয়ে যাবে।"
        onSaveSuccess={(updatedProfile) => {
          setShowProfileCompleteModal(false);
          triggerToast('🎉 প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে! ফ্রি ট্রায়াল ক্লাস শুরু হচ্ছে...');
          if (pendingFreeLesson !== null && onOpenLesson) {
            const targetLesson = pendingFreeLesson;
            setPendingFreeLesson(null);
            setTimeout(() => {
              onOpenLesson(course.id || course.slug || selectedCourseId, targetLesson);
            }, 300);
          }
        }}
      />

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal 
          course={course}
          bundle={{
            id: course.id || course.slug || selectedCourseId,
            title: course.name || course.title || "কোর্স এনরোল",
            price: Number(course.salePrice) || Number(course.price) || 499,
            salePrice: Number(course.salePrice) || Number(course.price) || 499,
            regularPrice: Number(course.regularPrice) || (Number(course.salePrice || 499) * 2),
            originalPrice: Number(course.regularPrice) || (Number(course.salePrice || 499) * 2),
            image: course.image || '/logo.png'
          }}
          siteSettings={siteSettings}
          onSuccess={(trxData) => {
            if (onEnrollSuccess) onEnrollSuccess(trxData);
            setEnrollmentTick(t => t + 1);
          }}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {/* YouTube Data API v3 Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all ${
            isDark ? 'bg-[#150409] border-[#e11438]/30 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">YouTube API v3 Key</h3>
                <p className="text-xs text-gray-400">অটোমেটিক প্লেলিস্ট ভিডিও সিঙ্কিং</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              প্লেলিস্টে নতুন ভিডিও আপলোড হওয়ার সাথে সাথে কোর্সে যোগ করতে আপনার একটি ফ্রি Google YouTube Data API v3 কী প্রয়োজন (দৈনিক ১০,০০০ ফ্রি রিকোয়েস্ট)।
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-300">
                  API Key
                </label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none transition-all ${
                    isDark
                      ? 'bg-[#220710] border-[#e11438]/30 text-white focus:border-red-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500 focus:bg-white'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-xl text-[11px] leading-relaxed border ${
                isDark ? 'bg-[#220710]/60 border-[#e11438]/20 text-gray-300' : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                <p className="font-bold mb-1">কীভাবে বিনামূল্যে API Key পাবেন?</p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>Google Cloud Console-এ যান</li>
                  <li>"YouTube Data API v3" এনাবল করুন</li>
                  <li>Credentials থেকে Create API Key চাপুন ও কপি করে এখানে পেস্ট করুন</li>
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                  isDark ? 'border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveApiKeyAndSync}
                disabled={!apiKeyInput.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#dc2626] hover:bg-red-700 disabled:opacity-50 text-white border-none cursor-pointer transition-all shadow-md flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>সংরক্ষণ ও সিঙ্ক করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Sleek Built-in PDF Lecture Sheet Modal */}
      {activePdfLesson && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`relative w-full max-w-4xl h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
            isDark ? 'bg-[#140307] border-[#e11438]/30 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
              isDark ? 'border-white/10 bg-[#1c060d]' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold truncate">
                    {activePdfLesson.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    অফিশিয়াল লেকচার শিট ও প্র্যাকটিস নোট
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activePdfLesson.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#e11438] hover:bg-[#ff2a55] text-white text-decoration-none shadow-sm transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>নতুন ট্যাবে খুলুন</span>
                </a>

                <a
                  href={activePdfLesson.pdfUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-decoration-none border transition-all ${
                    isDark ? 'border-white/15 bg-white/5 text-gray-200 hover:text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">ডাউনলোড</span>
                </a>

                <button
                  type="button"
                  onClick={() => setActivePdfLesson(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 hover:text-white transition-colors cursor-pointer border-none"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded PDF Preview */}
            <div className="flex-1 bg-black/20 w-full h-full overflow-hidden">
              <iframe
                src={getGoogleDrivePreviewUrl(activePdfLesson.pdfUrl)}
                title={activePdfLesson.title}
                className="w-full h-full border-0"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[10001] px-5 py-3 rounded-2xl bg-[#140307] text-white border border-[#e11438] shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
}

