import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { flushSync } from 'react-dom';
import { initialData, isZenithCopiedCourse } from './data/mockData';
import { EXAM_CATEGORIES_METADATA } from './data/examCategoriesData';
import HomePage from './components/HomePage';
import CoursesPage from './components/CoursesPage';
import BiologyCoursePage from './components/BiologyCoursePage';
import CoursePlayerPage from './components/CoursePlayerPage';
import BundleDetailPage from './components/BundleDetailPage';
import ExamsPage from './components/ExamsPage';
import StorePage from './components/StorePage';
import AboutPage from './components/AboutPage';
import DevicesPage from './components/DevicesPage';
import OrdersPage from './components/OrdersPage';
import DashboardPage from './components/DashboardPage';
import LegalPoliciesPage from './components/LegalPoliciesPage';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import PreloaderScreen from './components/PreloaderScreen';
import AdminAuthModal from './components/AdminAuthModal';
import { isStudentProfileComplete } from './utils/studentProfile';
import { getAdminSession, clearAdminSession } from './services/adminAuthService';
import { saveCloudData, fetchCloudData, subscribeToCloudData } from './services/firestoreSyncService';
import { saveSupabaseSiteData, subscribeToSupabaseSiteData } from './services/supabaseService';

// Performance Optimization: Lazy load heavy AdminPanel
const AdminPanel = lazy(() => import('./components/AdminPanel'));
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { grantCourseAccess } from './utils/enrollmentService';
import './App.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Page render error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0c0205] text-white font-sans text-center">
          <div className="max-w-md w-full bg-[#160307] border border-[#e11438]/30 rounded-3xl p-8 shadow-2xl space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#e11438]/15 border border-[#e11438]/30 flex items-center justify-center text-[#ff3366] text-2xl font-bold">
              !
            </div>
            <h2 className="text-xl font-black text-white">পেইজটি লোড হতে সমস্যা হয়েছে</h2>
            <p className="text-sm text-gray-300">
              অনুগ্রহ করে পেইজটি রিফ্রেশ করুন অথবা হোমপেইজে ফিরে যান।
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-full bg-[#dc2626] text-white font-bold text-sm hover:brightness-110 transition-all cursor-pointer border-none"
              >
                পেইজ রিফ্রেশ করুন
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
                className="px-5 py-2.5 rounded-full bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all cursor-pointer border border-white/20"
              >
                হোমে যান
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();
  const [adminSessionState, setAdminSessionState] = useState(() => getAdminSession());
  const [selectedCourseId, setSelectedCourseId] = useState(() => {
    try {
      const path = (window.location.pathname || '').toLowerCase();
      if (path.startsWith('/courses/') && path.length > 9 && !path.includes('[object')) {
        let cid = path.split('/courses/')[1] || '';
        if (cid.includes('/watch')) cid = cid.split('/watch')[0];
        if (cid.includes('/lecture')) cid = cid.split('/lecture')[0];
        return cid || null;
      }
    } catch {}
    return null;
  });
  const [selectedLessonInfo, setSelectedLessonInfo] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const v = urlParams.get('v') || urlParams.get('lesson');
      if (v !== null) return isNaN(Number(v)) ? v : Number(v);
    } catch {}
    return null;
  });
  const [selectedBundleId, setSelectedBundleId] = useState(() => {
    try {
      const path = (window.location.pathname || '').toLowerCase();
      if (path.startsWith('/bundles/')) return path.split('/bundles/')[1] || null;
      if (path.startsWith('/bundle/')) return path.split('/bundle/')[1] || null;
    } catch {}
    return null;
  });
  const [selectedExamCategory, setSelectedExamCategory] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('category') || null;
    } catch {
      return null;
    }
  });
  const [examFromBundle, setExamFromBundle] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('from') === 'bundle' || urlParams.get('fromBundle') === 'true' || urlParams.get('bundleId')) {
        return urlParams.get('bundleId') || true;
      }
      return sessionStorage.getItem('eduhunters_nav_from_bundle') || false;
    } catch {
      return false;
    }
  });
  const [selectedPolicyTab, setSelectedPolicyTab] = useState(() => {
    try {
      const path = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();
      if (path.includes('/refund') || hash.includes('refund')) return 'refund';
      if (path.includes('/privacy') || hash.includes('privacy')) return 'privacy';
    } catch {}
    return 'terms';
  });
  const [viewMode, setViewMode] = useState(() => {
    const path = (window.location.pathname || '').toLowerCase();
    const hash = (window.location.hash || '').toLowerCase();
    if (path.includes('/admin') || hash.includes('admin')) return 'admin';
    if (path.includes('/dashboard') || hash.includes('dashboard')) return 'dashboard';
    if (path.includes('/exams') || hash.includes('exams')) return 'exams';
    if (path.includes('/devices') || hash.includes('devices')) return 'devices';
    if (path.includes('/orders') || hash.includes('orders')) return 'orders';
    if (path.includes('/terms') || path.includes('/refund') || path.includes('/privacy') || path.includes('/policies') || hash.includes('terms') || hash.includes('refund') || hash.includes('privacy')) return 'policies';
    if (path.startsWith('/bundles/') || path.startsWith('/bundle/')) return 'bundle_detail';
    if (path.startsWith('/courses/') && (path.includes('/watch') || path.includes('/lecture'))) return 'course_player';
    if (path.startsWith('/courses/') && path.length > 9 && !path.includes('[object')) return 'course_detail';
    if (path.includes('/courses') || hash.includes('courses')) return 'courses';
    if (path.includes('/store') || hash.includes('store')) return 'store';
    if (path.includes('/about') || hash.includes('about')) return 'about';
    return 'home';
  });

  // AdobeWala-inspired cinematic initial loading state
  const [isLoading, setIsLoading] = useState(true);

  // Smooth page navigation states
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0);
  const [isAnimatingKey, setIsAnimatingKey] = useState(true);

  // Centralized hardware-accelerated smooth transition handler
  const navigateWithSmoothTransition = (stateUpdateCallback, urlToPush = null) => {
    setIsNavigating(true);
    setNavProgress(35);
    setIsAnimatingKey(true);

    const progressTimer = setTimeout(() => {
      setNavProgress(80);
    }, 50);

    const executeUpdate = () => {
      try {
        stateUpdateCallback();
      } catch (err) {
        console.error('State update error:', err);
      }
      if (urlToPush) {
        try {
          window.history.pushState(null, '', urlToPush);
        } catch (e) {}
      }
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (e) {}
    };

    const finalize = () => {
      setNavProgress(100);
      setTimeout(() => {
        setIsNavigating(false);
        setNavProgress(0);
      }, 240);
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      document.documentElement.classList.add('page-navigating');
      try {
        const transition = document.startViewTransition(() => {
          executeUpdate();
        });
        transition.finished
          .catch(() => {})
          .finally(() => {
            document.documentElement.classList.remove('page-navigating');
            clearTimeout(progressTimer);
            finalize();
          });
      } catch (err) {
        document.documentElement.classList.remove('page-navigating');
        clearTimeout(progressTimer);
        executeUpdate();
        finalize();
      }
    } else {
      clearTimeout(progressTimer);
      executeUpdate();
      finalize();
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      navigateWithSmoothTransition(() => {
        const path = (window.location.pathname || '').toLowerCase();
        const hash = (window.location.hash || '').toLowerCase();
        if (path.includes('/admin') || hash.includes('admin')) setViewMode('admin');
        else if (path.includes('/exams') || hash.includes('exams')) {
          try {
            const urlParams = new URLSearchParams(window.location.search);
            setSelectedExamCategory(urlParams.get('category') || null);
            if (urlParams.get('from') === 'bundle' || urlParams.get('fromBundle') === 'true' || urlParams.get('bundleId')) {
              setExamFromBundle(urlParams.get('bundleId') || true);
            } else {
              setExamFromBundle(false);
            }
          } catch {
            setSelectedExamCategory(null);
            setExamFromBundle(false);
          }
          setViewMode('exams');
        }
        else if (path.startsWith('/bundles/') || path.startsWith('/bundle/')) {
          const bId = path.split('/bundle')[1].replace(/^s?\//, '');
          setSelectedBundleId(bId || null);
          setViewMode('bundle_detail');
        }
        else if (path.startsWith('/courses/') && (path.includes('/watch') || path.includes('/lecture'))) {
          let cid = path.split('/courses/')[1] || '';
          if (cid.includes('/watch')) cid = cid.split('/watch')[0];
          if (cid.includes('/lecture')) cid = cid.split('/lecture')[0];
          const urlParams = new URLSearchParams(window.location.search);
          const v = urlParams.get('v') || urlParams.get('lesson');
          setSelectedCourseId(cid);
          setSelectedLessonInfo(v !== null ? (isNaN(Number(v)) ? v : Number(v)) : 0);
          setViewMode('course_player');
        }
        else if (path.startsWith('/courses/') && path.length > 9 && !path.includes('[object')) {
          const id = path.split('/courses/')[1];
          const examKeys = new Set(['sureshot', 'medical', 'rtds', 'english_master', 'gk_course', 'medilogy']);
          if (id && examKeys.has(id)) {
            setSelectedExamCategory(id);
            setViewMode('exams');
          } else if (id) {
            setSelectedCourseId(id);
            setViewMode('course_detail');
          }
        }
        else if (path.includes('/courses') || hash.includes('courses')) {
          setSelectedCourseId(null);
          setViewMode('courses');
        }
        else if (path.includes('/store') || hash.includes('store')) setViewMode('store');
        else if (path.includes('/about') || hash.includes('about')) setViewMode('about');
        else if (path.includes('/devices') || hash.includes('devices')) setViewMode('devices');
        else if (path.includes('/orders') || hash.includes('orders')) setViewMode('orders');
        else if (path.includes('/dashboard') || hash.includes('dashboard')) setViewMode('dashboard');
        else if (path.includes('/refund') || hash.includes('refund')) {
          setSelectedPolicyTab('refund');
          setViewMode('policies');
        }
        else if (path.includes('/privacy') || hash.includes('privacy')) {
          setSelectedPolicyTab('privacy');
          setViewMode('policies');
        }
        else if (path.includes('/terms') || hash.includes('terms') || path.includes('/policies') || hash.includes('policies')) {
          setSelectedPolicyTab('terms');
          setViewMode('policies');
        }
        else setViewMode('home');
      }, null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('eduhunters_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialData,
          ...parsed,
          siteSettings: { 
            ...initialData.siteSettings, 
            ...(parsed.siteSettings || {}),
            contactEmail: (parsed.siteSettings?.contactEmail && !parsed.siteSettings.contactEmail.includes('support@eduhunters.com'))
              ? parsed.siteSettings.contactEmail
              : 'eduhuntersbd@gmail.com',
            contactPhone: (parsed.siteSettings?.contactPhone && !parsed.siteSettings.contactPhone.includes('1700'))
              ? parsed.siteSettings.contactPhone
              : '01342227935',
            whatsappNumber: parsed.siteSettings?.whatsappNumber || parsed.siteSettings?.contactPhone || initialData.siteSettings.whatsappNumber || '01342227935',
            bkashNumber: parsed.siteSettings?.bkashNumber || initialData.siteSettings.bkashNumber,
            nagadNumber: parsed.siteSettings?.nagadNumber || initialData.siteSettings.nagadNumber,
            facebookPage: (parsed.siteSettings?.facebookPage && parsed.siteSettings.facebookPage !== 'https://facebook.com')
              ? parsed.siteSettings.facebookPage
              : initialData.siteSettings.facebookPage,
            youtubeChannel: (parsed.siteSettings?.youtubeChannel && parsed.siteSettings.youtubeChannel !== 'https://youtube.com/@eduhunters')
              ? parsed.siteSettings.youtubeChannel
              : initialData.siteSettings.youtubeChannel,
          },
          announcement: parsed.announcement || initialData.announcement,
          sectionTexts: { ...initialData.sectionTexts, ...(parsed.sectionTexts || {}) },
          whyChooseUs: Array.isArray(parsed.whyChooseUs) && parsed.whyChooseUs.length > 0 ? parsed.whyChooseUs : initialData.whyChooseUs,
          heroSlides: (Array.isArray(parsed.heroSlides) && parsed.heroSlides.length > 0) 
            ? parsed.heroSlides 
            : initialData.heroSlides,
          homeStats: (Array.isArray(parsed.homeStats) && parsed.homeStats.length > 0 && !parsed.homeStats.some(s => s.value === '3000+' || s.value === '70000+')) 
            ? parsed.homeStats 
            : initialData.homeStats,
          courses: (() => {
            if (Array.isArray(parsed.courses)) {
              return parsed.courses
                .filter(c => !isZenithCopiedCourse(c))
                .map(c => {
                  let mapped = c.category === 'University A Unit' ? { ...c, category: 'Free' } : c;
                  const initialMatch = initialData.courses.find(initC => initC.id === c.id || initC.slug === c.slug);
                  if (initialMatch && (!mapped.curriculum || mapped.curriculum[0]?.chapters?.[0]?.lessons?.some(l => l.title === 'HSC 26,27'))) {
                    mapped = { ...mapped, curriculum: initialMatch.curriculum };
                  }
                  return mapped;
                });
            }
            return initialData.courses;
          })(),
          bundles: Array.isArray(parsed.bundles)
            ? parsed.bundles
            : (initialData.bundles || []),
          examBatches: Array.isArray(parsed.examBatches)
            ? parsed.examBatches
            : (initialData.examBatches || EXAM_CATEGORIES_METADATA),
          instructors: Array.isArray(parsed.instructors) ? parsed.instructors : [],
          freeVideos: Array.isArray(parsed.freeVideos)
            ? parsed.freeVideos 
            : initialData.freeVideos,
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 
            ? parsed.categories
                .filter(c => !["HSC 25", "Engineering", "HSC 27", "HSC 28", "HSC 26"].includes(c))
                .map(c => c === 'University A Unit' ? 'Free' : c)
            : initialData.categories,
          storeProducts: Array.isArray(parsed.storeProducts)
            ? parsed.storeProducts.filter(p => !([1, 2, 3, 4].includes(p.id) || p.title?.includes('Biology Extra Info')))
            : (initialData.storeProducts || []),
          accounting: (() => {
            const acc = parsed.accounting;
            if (!acc || acc.totalRevenue === 284500 || (Array.isArray(acc.transactions) && acc.transactions.some(t => t.id === 'TRX-94825'))) {
              return initialData.accounting;
            }
            const txs = Array.isArray(acc.transactions)
              ? acc.transactions.filter(t => !t.id?.startsWith('TRX-948'))
              : [];
            return {
              totalRevenue: acc.totalRevenue || 0,
              totalExpenses: acc.totalExpenses || 0,
              netProfit: acc.netProfit || 0,
              totalOrders: acc.totalOrders || txs.length,
              transactions: txs
            };
          })(),
          termsAndConditions: parsed.termsAndConditions || initialData.termsAndConditions,
          refundPolicy: parsed.refundPolicy || initialData.refundPolicy,
          privacyPolicy: parsed.privacyPolicy || initialData.privacyPolicy,
          _lastUpdated: parsed._lastUpdated || null
        };
      }
    } catch (e) {
      console.error('Error loading stored data:', e);
    }
    return initialData;
  });

  // Permanently purge any Zenith Crew / Codervai copied courses and invalid items from browser localStorage on load
  useEffect(() => {
    try {
      // Clean unverified legacy default batch keys from localStorage if no paid order exists
      try {
        const rawBatches = localStorage.getItem('eduhunters_enrolled_batches');
        const legacyBatches = localStorage.getItem('enrolled_exam_batches');
        if (rawBatches || legacyBatches) {
          const orders = JSON.parse(localStorage.getItem('eh_user_orders_v3') || '[]');
          const hasPaidSureshot = orders.some(o => 
            (o.status === 'PAID' || o.isApproved) && 
            (o.course?.categoryKey === 'sureshot' || o.course?.slug === 'sureshot' || o.categoryKey === 'sureshot')
          );
          if (!hasPaidSureshot) {
            localStorage.removeItem('eduhunters_enrolled_batches');
            localStorage.removeItem('enrolled_exam_batches');
          }
        }
      } catch (e) {}

      const raw = localStorage.getItem('eduhunters_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        let modified = false;
        if (Array.isArray(parsed.courses)) {
          const purged = parsed.courses.filter(c => !isZenithCopiedCourse(c));
          if (purged.length !== parsed.courses.length) {
            parsed.courses = purged;
            modified = true;
          }

          // Ensure Physics 1st paper Finishing Touch Series has its full 3 classes
          const physIdx = parsed.courses.findIndex(c => 
            c.slug === 'physics-finishing-touch-series' || 
            c.id === 'course-1791887161017' || 
            (c.title || '').toLowerCase().includes('physics')
          );
          const initialPhys = initialData.courses.find(c => c.slug === 'physics-finishing-touch-series');
          if (initialPhys) {
            if (physIdx === -1) {
              parsed.courses.unshift(initialPhys);
              modified = true;
            } else {
              const currentLessons = (parsed.courses[physIdx].curriculum?.[0]?.chapters?.[0]?.lessons || []);
              if (currentLessons.length < 3) {
                parsed.courses[physIdx] = {
                  ...parsed.courses[physIdx],
                  curriculum: initialPhys.curriculum,
                  totalClasses: '৩টি ক্লাস'
                };
                modified = true;
              }
            }
          }
        }
        if (Array.isArray(parsed.instructors)) {
          const ZENITH_INSTRUCTOR_NAMES = [
            "as sami", "tahmid", "sanjid", "tofayel", "nazmuddin", "jaidul", "sk tasnim", "tasnim ferdaus"
          ];
          const purgedInst = parsed.instructors.filter(inst => {
            const lowName = (inst.name || '').toLowerCase();
            return !ZENITH_INSTRUCTOR_NAMES.some(zn => lowName.includes(zn));
          });
          if (purgedInst.length !== parsed.instructors.length) {
            parsed.instructors = purgedInst;
            modified = true;
          }
        } else {
          parsed.instructors = [];
          modified = true;
        }
        if (Array.isArray(parsed.storeProducts) && parsed.storeProducts.some(p => [1, 2, 3, 4].includes(p.id) || p.title?.includes('Biology Extra Info'))) {
          parsed.storeProducts = parsed.storeProducts.filter(p => !([1, 2, 3, 4].includes(p.id) || p.title?.includes('Biology Extra Info')));
          modified = true;
        }
        if (Array.isArray(parsed.homeStats) && parsed.homeStats.some(s => s.value === '3000+' || s.value === '70000+' || s.value === '15+')) {
          parsed.homeStats = initialData.homeStats;
          modified = true;
        }
        if (parsed.siteSettings && (!parsed.siteSettings.contactEmail || parsed.siteSettings.contactEmail.includes('support@eduhunters.com') || parsed.siteSettings.contactEmail.includes('gmial.com'))) {
          parsed.siteSettings.contactEmail = 'eduhuntersbd@gmail.com';
          modified = true;
        }
        if (parsed.siteSettings && (!parsed.siteSettings.contactPhone || parsed.siteSettings.contactPhone.includes('1700') || parsed.siteSettings.contactPhone === '01353828863')) {
          parsed.siteSettings.contactPhone = '01342227935';
          modified = true;
        }
        if (parsed.siteSettings && (!parsed.siteSettings.whatsappNumber || parsed.siteSettings.whatsappNumber === '01353828863')) {
          parsed.siteSettings.whatsappNumber = parsed.siteSettings.contactPhone || '01342227935';
          modified = true;
        }
        if (parsed.accounting && (parsed.accounting.totalRevenue === 284500 || (Array.isArray(parsed.accounting.transactions) && parsed.accounting.transactions.some(t => t.id === 'TRX-94825')))) {
          parsed.accounting = initialData.accounting;
          modified = true;
        }
        const cleanClauses = (clauses) => {
          if (!Array.isArray(clauses)) return false;
          let changed = false;
          clauses.forEach(cl => {
            if (Array.isArray(cl.points)) {
              cl.points = cl.points.map(pt => {
                if (typeof pt === 'string') {
                  if (pt.includes('support@eduhunters.com') || pt.includes('gmial.com')) {
                    changed = true;
                    return pt.replace(/support@eduhunters\.com/g, 'eduhuntersbd@gmail.com').replace(/eduhuntersbd@gmial\.com/g, 'eduhuntersbd@gmail.com');
                  }
                  if (pt.includes('1700-000000') || pt.includes('1353-828863') || pt.includes('01353828863')) {
                    changed = true;
                    return pt.replace('+880 1700-000000', '+880 1342-227935')
                      .replace('01700-000000', '01342227935')
                      .replace('+880 1353-828863', '+880 1342-227935')
                      .replace('01353828863', '01342227935');
                  }
                }
                return pt;
              });
            }
          });
          return changed;
        };
        if (parsed.refundPolicy?.clauses && cleanClauses(parsed.refundPolicy.clauses)) modified = true;
        if (parsed.privacyPolicy?.clauses && cleanClauses(parsed.privacyPolicy.clauses)) modified = true;
        if (parsed.termsAndConditions?.clauses && cleanClauses(parsed.termsAndConditions.clauses)) modified = true;
        if (modified) {
          localStorage.setItem('eduhunters_data', JSON.stringify(parsed));
          setData(prev => ({
            ...prev,
            courses: parsed.courses || prev.courses,
            storeProducts: parsed.storeProducts || prev.storeProducts,
            homeStats: parsed.homeStats || prev.homeStats,
            siteSettings: parsed.siteSettings || prev.siteSettings,
            instructors: Array.isArray(parsed.instructors) ? parsed.instructors : []
          }));
        }
      }
    } catch (e) {
      console.error('Error purifying localStorage:', e);
    }
  }, []);

  // Multi-tab, multi-window, and real-time state synchronization broadcaster
  const broadcastSync = (dataToSync) => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eduhunters_data_updated', { detail: dataToSync }));
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('eduhunters_sync_channel');
          bc.postMessage({ type: 'DATA_SYNC', payload: dataToSync });
          bc.close();
        }
      }
    } catch (e) {
      console.error('Broadcast sync error:', e);
    }
  };

  const handleUpdateData = (newData) => {
    const dataWithTimestamp = {
      ...newData,
      _lastUpdated: new Date().toISOString()
    };
    setData(dataWithTimestamp);
    try {
      localStorage.setItem('eduhunters_data', JSON.stringify(dataWithTimestamp));
    } catch (e) {
      console.error('Error saving data to localStorage:', e);
    }
    broadcastSync(dataWithTimestamp);
    // Supabase synchronization: Primary real-time database with no daily quota limits
    saveSupabaseSiteData(dataWithTimestamp);
    // Cloud Firestore synchronization: Fallback
    saveCloudData(dataWithTimestamp);
  };

  // Real-time synchronization listener: Local tabs + Supabase Realtime + Cloud Firestore
  useEffect(() => {
    const mergeCloudWithLocal = (prev, cloudData) => {
      if (!cloudData) return prev;
      const localTime = prev._lastUpdated ? new Date(prev._lastUpdated).getTime() : 0;
      const cloudTime = cloudData._lastUpdated ? new Date(cloudData._lastUpdated).getTime() : 0;

      // If local state has newer edits than cloudData, preserve local without writing back in a loop
      if (localTime > cloudTime && localTime > 0) {
        return prev;
      }

      const sanitized = { ...cloudData };
      if (Array.isArray(sanitized.homeStats) && sanitized.homeStats.some(s => s.value === '3000+' || s.value === '70000+')) {
        sanitized.homeStats = initialData.homeStats;
      }

      // Clean instructors resolution: filter Zenith legacy faculty and respect user edits
      const ZENITH_INSTRUCTOR_NAMES = [
        "as sami", "tahmid", "sanjid", "tofayel", "nazmuddin", "jaidul", "sk tasnim", "tasnim ferdaus"
      ];
      const cleanCloudInstructors = Array.isArray(sanitized.instructors)
        ? sanitized.instructors.filter(inst => !ZENITH_INSTRUCTOR_NAMES.some(zn => (inst.name || '').toLowerCase().includes(zn)))
        : null;
      const cleanPrevInstructors = Array.isArray(prev.instructors)
        ? prev.instructors.filter(inst => !ZENITH_INSTRUCTOR_NAMES.some(zn => (inst.name || '').toLowerCase().includes(zn)))
        : [];

      const resolvedInstructors = cleanCloudInstructors !== null
        ? cleanCloudInstructors
        : cleanPrevInstructors;

      const merged = {
        ...prev,
        ...sanitized,
        instructors: resolvedInstructors
      };

      try {
        localStorage.setItem('eduhunters_data', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    };

    // 1. Supabase Realtime subscription (Instant sync for hero slider, courses, etc.)
    const unsubscribeSupabase = subscribeToSupabaseSiteData((cloudData) => {
      if (cloudData) {
        setData(prev => mergeCloudWithLocal(prev, cloudData));
      }
    });

    // 2. Listen for real-time Cloud Firestore updates (fallback)
    const unsubscribeCloud = subscribeToCloudData((cloudData) => {
      if (cloudData) {
        setData(prev => mergeCloudWithLocal(prev, cloudData));
      }
    });

    const handleStorageChange = (e) => {
      if (e.key === 'eduhunters_data' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed.homeStats) && parsed.homeStats.some(s => s.value === '3000+' || s.value === '70000+')) {
            parsed.homeStats = initialData.homeStats;
          }
          setData(parsed);
        } catch (err) {
          console.error('Failed to parse storage update:', err);
        }
      }
    };

    let bc;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('eduhunters_sync_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'DATA_SYNC' && event.data?.payload) {
            setData(event.data.payload);
          }
        };
      } catch (err) {}
    }

    const handleCustomSync = (e) => {
      if (e.detail) {
        setData(e.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('eduhunters_data_updated', handleCustomSync);

    return () => {
      if (typeof unsubscribeSupabase === 'function') unsubscribeSupabase();
      if (typeof unsubscribeCloud === 'function') unsubscribeCloud();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('eduhunters_data_updated', handleCustomSync);
      if (bc) bc.close();
    };
  }, []);

  const handleResetData = () => {
    setData(initialData);
    try {
      localStorage.setItem('eduhunters_data', JSON.stringify(initialData));
    } catch (e) {
      console.error('Error resetting data:', e);
    }
    broadcastSync(initialData);
  };

  const handleEnrollSuccess = ({ itemTitle, amount, studentName, studentPhone, method, trxId, studentEmail }) => {
    const amt = Number(amount) || 0;
    const finalCourseTitle = itemTitle || 'কোর্স এনরোলমেন্ট';
    const finalStudent = studentName || 'অনলাইন শিক্ষার্থী';
    const finalPhone = studentPhone || 'N/A';
    const finalMethod = method || 'bKash';
    const finalTrx = trxId || `TXN${Date.now().toString().slice(-6)}`;

    const newTrx = {
      id: `TRX-${Date.now().toString().slice(-5)}`,
      studentName: finalStudent,
      studentPhone: finalPhone,
      studentEmail: studentEmail || '',
      itemTitle: finalCourseTitle,
      type: 'INCOME',
      category: 'Course Enrollment',
      amount: amt,
      method: finalMethod,
      trxId: finalTrx,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      status: 'Pending'
    };

    const currentAccounting = data.accounting || initialData.accounting;
    const updatedAccounting = {
      ...currentAccounting,
      totalOrders: (currentAccounting.totalOrders || 0) + 1,
      transactions: [newTrx, ...(currentAccounting.transactions || [])]
    };

    // Save pending student record in eh_enrolled_students
    const newStudent = {
      id: `st-${Date.now()}`,
      name: finalStudent,
      phone: finalPhone,
      email: studentEmail || '',
      batch: 'HSC 26',
      courseName: finalCourseTitle,
      status: 'Pending',
      joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: amt,
      trxId: finalTrx,
      paymentMethod: finalMethod
    };

    try {
      const rawStudents = localStorage.getItem('eh_enrolled_students');
      const prevStudents = rawStudents ? JSON.parse(rawStudents) : [];
      const nextStudents = [newStudent, ...prevStudents.filter(s => !(s.phone === newStudent.phone && s.courseName === newStudent.courseName))];
      localStorage.setItem('eh_enrolled_students', JSON.stringify(nextStudents));
    } catch (e) {}

    const updatedData = {
      ...data,
      accounting: updatedAccounting,
      _lastUpdated: new Date().toISOString()
    };
    handleUpdateData(updatedData);

    // Broadcast enrollment event across tabs & windows
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eh:new_enrollment', {
        detail: { transaction: newTrx, student: newStudent }
      }));
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('eduhunters_sync_channel');
          bc.postMessage({
            type: 'NEW_ENROLLMENT_ORDER',
            payload: { transaction: newTrx, student: newStudent }
          });
          bc.close();
        } catch (e) {}
      }
    }
  };

  // Real-time listener for Admin Approval of Enrollment Requests
  useEffect(() => {
    const handleApproval = (payload) => {
      if (!payload?.courseTitle) return;
      const approvedCourse = payload.courseTitle;
      const cleanPhone = (payload.studentPhone || '').replace(/[^0-9]/g, '');
      const cleanEmail = (payload.studentEmail || '').toLowerCase().trim();

      // 1. Unlock course globally in localStorage keys
      grantCourseAccess(approvedCourse, { bundles: data.bundles, courses: data.courses });

      // 2. Unlock in currentUser if this session is the student
      const curPhone = (currentUser?.whatsapp || currentUser?.phone || '').replace(/[^0-9]/g, '');
      const curEmail = (currentUser?.email || '').toLowerCase().trim();
      const isTargetStudent = (cleanEmail && curEmail === cleanEmail) || (cleanPhone && curPhone === cleanPhone);

      if (isTargetStudent || !cleanEmail) {
        try {
          const rawCur = localStorage.getItem('eh_current_user');
          if (rawCur) {
            const cur = JSON.parse(rawCur);
            const prev = Array.isArray(cur.enrolledCourses) ? cur.enrolledCourses : [];
            if (!prev.includes(approvedCourse)) {
              cur.enrolledCourses = [approvedCourse, ...prev];
              localStorage.setItem('eh_current_user', JSON.stringify(cur));
            }
          }
        } catch (e) {}
      }

      // 3. Update data.users if matching user found
      if (Array.isArray(data.users)) {
        let changed = false;
        const nextUsers = data.users.map(u => {
          const uPhone = (u.whatsapp || u.phone || '').replace(/[^0-9]/g, '');
          const uEmail = (u.email || '').toLowerCase().trim();
          if ((cleanEmail && uEmail === cleanEmail) || (cleanPhone && uPhone === cleanPhone)) {
            changed = true;
            const prev = Array.isArray(u.enrolledCourses) ? u.enrolledCourses : [];
            return {
              ...u,
              status: 'Active',
              enrolledCourses: prev.includes(approvedCourse) ? prev : [approvedCourse, ...prev]
            };
          }
          return u;
        });

        if (changed) {
          handleUpdateData({ ...data, users: nextUsers, _lastUpdated: new Date().toISOString() });
        }
      }
    };

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('eduhunters_sync_channel');
        bc.onmessage = (e) => {
          if (e.data?.type === 'ENROLLMENT_APPROVED' && e.data?.payload) {
            handleApproval(e.data.payload);
          }
        };
      } catch (e) {}
    }

    const onCustomApproval = (e) => {
      if (e.detail) handleApproval(e.detail);
    };

    window.addEventListener('eh:enrollment_approved', onCustomApproval);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('eh:enrollment_approved', onCustomApproval);
    };
  }, [currentUser, data]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileHintNotice, setProfileHintNotice] = useState(null);
  const [profileRequireCompletion, setProfileRequireCompletion] = useState(false);
  const [pendingProfileAction, setPendingProfileAction] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [pendingAuthAction, setPendingAuthAction] = useState(null);

  const handleOpenProfile = (optionsOrAction = null) => {
    if (typeof optionsOrAction === 'function') {
      setPendingProfileAction(() => optionsOrAction);
      setProfileHintNotice('Please complete your profile with your name, college, and WhatsApp number to finish enrolling.');
      setProfileRequireCompletion(true);
    } else if (optionsOrAction && typeof optionsOrAction === 'object') {
      setPendingProfileAction(typeof optionsOrAction.onComplete === 'function' ? () => optionsOrAction.onComplete : null);
      setProfileHintNotice(optionsOrAction.hintNotice || null);
      setProfileRequireCompletion(Boolean(optionsOrAction.requireCompletion));
    } else {
      setPendingProfileAction(null);
      setProfileHintNotice(null);
      setProfileRequireCompletion(false);
    }
    setIsProfileModalOpen(true);
  };

  useEffect(() => {
    const handleOpenProfileEvent = (e) => handleOpenProfile(e?.detail || null);
    window.addEventListener('eh_open_profile_modal', handleOpenProfileEvent);
    return () => window.removeEventListener('eh_open_profile_modal', handleOpenProfileEvent);
  }, []);

  const handleOpenAuth = (mode = 'signin', postAuthAction = null) => {
    setAuthMode(mode);
    setPendingAuthAction(typeof postAuthAction === 'function' ? () => postAuthAction : null);
    setIsAuthModalOpen(true);
  };

  const navHandlers = {
    onOpenProfile: handleOpenProfile,
    onNavigateHome: () => {
      setExamFromBundle(false);
      try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch(e) {}
      navigateWithSmoothTransition(() => {
        setViewMode('home');
      }, '/');
    },
    onNavigateCourse: (courseId = null, options = {}) => {
      const isFromBundle = Boolean(options?.fromBundle);
      const bundleId = options?.bundleId || null;
      if (isFromBundle) {
        setExamFromBundle(bundleId || true);
        try { sessionStorage.setItem('eduhunters_nav_from_bundle', bundleId || 'true'); } catch(e) {}
      } else {
        setExamFromBundle(false);
        try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch(e) {}
      }

      const examKeys = new Set(['sureshot', 'medical', 'rtds', 'english_master', 'gk_course', 'medilogy']);
      const cidStr = (courseId !== null && courseId !== undefined) ? String(courseId).trim() : '';

      if (cidStr && examKeys.has(cidStr.toLowerCase())) {
        const cat = cidStr.toLowerCase();
        const url = isFromBundle 
          ? `/exams?category=${cat}&from=bundle${bundleId ? `&bundleId=${bundleId}` : ''}`
          : `/exams?category=${cat}`;
        navigateWithSmoothTransition(() => {
          setSelectedExamCategory(cat);
          setViewMode('exams');
        }, url);
        return;
      }
      if (cidStr.length > 0 && !cidStr.includes('[object')) {
        const url = isFromBundle 
          ? `/courses/${cidStr}?from=bundle${bundleId ? `&bundleId=${bundleId}` : ''}`
          : `/courses/${cidStr}`;
        navigateWithSmoothTransition(() => {
          setSelectedCourseId(cidStr);
          setViewMode('course_detail');
        }, url);
      } else {
        navigateWithSmoothTransition(() => {
          setSelectedCourseId(null);
          setViewMode('courses');
        }, '/courses');
      }
    },
    onNavigateCoursePlayer: (courseId, lessonInfo = null) => {
      setExamFromBundle(false);
      try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch(e) {}

      const examKeys = new Set(['sureshot', 'medical', 'rtds', 'english_master', 'gk_course', 'medilogy']);
      if (typeof courseId === 'string' && examKeys.has(courseId.trim())) {
        navHandlers.onNavigateExams(courseId.trim());
        return;
      }

      const cid = courseId || 'master-english-30-days';
      const lessonParam = typeof lessonInfo === 'number'
        ? lessonInfo
        : (lessonInfo?.globalIndex !== undefined 
          ? lessonInfo.globalIndex 
          : (lessonInfo?.lessonIdx !== undefined ? lessonInfo.lessonIdx : 0));
      navigateWithSmoothTransition(() => {
        setSelectedCourseId(cid);
        setSelectedLessonInfo(lessonInfo);
        setViewMode('course_player');
      }, `/courses/${cid}/watch?v=${lessonParam}`);
    },
    onNavigateBundle: (bundleId) => {
      setExamFromBundle(false);
      try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch(e) {}
      if (typeof bundleId === 'string' && bundleId.trim().length > 0) {
        navigateWithSmoothTransition(() => {
          setSelectedBundleId(bundleId.trim());
          setViewMode('bundle_detail');
        }, `/bundles/${bundleId.trim()}`);
      } else {
        navigateWithSmoothTransition(() => {
          setSelectedBundleId(null);
          setViewMode('courses');
        }, '/courses');
      }
    },
    onNavigateExams: (categoryKey) => {
      setExamFromBundle(false);
      try { 
        sessionStorage.removeItem('eduhunters_nav_from_bundle'); 
        sessionStorage.removeItem('eduhunters_active_exam_result');
      } catch(e) {}
      const cat = typeof categoryKey === 'string' && categoryKey.trim().length > 0 ? categoryKey.trim() : null;
      navigateWithSmoothTransition(() => {
        setSelectedExamCategory(cat);
        setViewMode('exams');
      }, cat ? `/exams?category=${cat}` : '/exams');
    },
    onNavigateStore: () => {
      navigateWithSmoothTransition(() => {
        setViewMode('store');
      }, '/store');
    },
    onNavigateAbout: () => {
      navigateWithSmoothTransition(() => {
        setViewMode('about');
      }, '/about');
    },
    onNavigateDevices: () => {
      navigateWithSmoothTransition(() => {
        setViewMode('devices');
      }, '/devices');
    },
    onNavigateDashboard: () => {
      setExamFromBundle(false);
      try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch(e) {}
      navigateWithSmoothTransition(() => {
        setViewMode('dashboard');
      }, '/dashboard');
    },
    onNavigateOrders: () => {
      navigateWithSmoothTransition(() => {
        setViewMode('orders');
      }, '/orders');
    },
    onOpenAdmin: (tab = null) => {
      const url = tab ? `/admin?tab=${tab}` : '/admin';
      navigateWithSmoothTransition(() => {
        setViewMode('admin');
      }, url);
    },
    onNavigatePolicies: (policyTab = 'terms') => {
      const tab = ['terms', 'refund', 'privacy'].includes(policyTab) ? policyTab : 'terms';
      const path = tab === 'refund' ? '/refund-policy' : (tab === 'privacy' ? '/privacy-policy' : '/terms');
      navigateWithSmoothTransition(() => {
        setSelectedPolicyTab(tab);
        setViewMode('policies');
      }, path);
    },
    onLoginClick: (callback) => {
      handleOpenAuth('signin', typeof callback === 'function' ? callback : null);
    },
    onSignUpClick: (callback) => {
      handleOpenAuth('signup', typeof callback === 'function' ? callback : null);
    },
    onEnrollSuccess: handleEnrollSuccess
  };

  const renderContent = () => {
    if (viewMode === 'admin') {
      if (!adminSessionState) {
        return (
          <div className="min-h-screen bg-[#07090e] flex items-center justify-center relative overflow-hidden select-none">
            {/* Ambient Security Background Glow */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] rounded-full opacity-30 blur-[100px]"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.45) 0%, rgba(225, 20, 56, 0.25) 50%, transparent 80%)'
                }}
              />
            </div>

            <AdminAuthModal 
              isOpen={true}
              onSuccess={(session) => {
                setAdminSessionState(session);
              }}
              onClose={() => {
                navigateWithSmoothTransition(() => {
                  setViewMode('home');
                }, '/');
              }}
            />
          </div>
        );
      }

      return (
        <Suspense fallback={
          <div className="min-h-screen bg-[#f4f6fa] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[#5d5bf6] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading MatDash Admin Portal...</p>
            </div>
          </div>
        }>
          <AdminPanel 
            data={data}
            adminUser={adminSessionState}
            onUpdateData={handleUpdateData}
            onResetData={handleResetData}
            onExitAdmin={() => {
              navigateWithSmoothTransition(() => {
                setViewMode('home');
              }, '/');
            }}
            onLogoutAdmin={() => {
              clearAdminSession();
              setAdminSessionState(null);
            }}
          />
        </Suspense>
      );
    }

    if (viewMode === 'policies' || viewMode === 'terms' || viewMode === 'refund') {
      return (
        <LegalPoliciesPage 
          data={data}
          initialTab={selectedPolicyTab}
          onChangeTab={(tab) => {
            setSelectedPolicyTab(tab);
            const path = tab === 'refund' ? '/refund-policy' : (tab === 'privacy' ? '/privacy-policy' : '/terms');
            try {
              window.history.pushState(null, '', path);
            } catch (e) {}
          }}
          {...navHandlers}
        />
      );
    }

    if (viewMode === 'exams') {
      return (
        <ExamsPage 
          data={data}
          selectedCategory={selectedExamCategory}
          isFromBundle={Boolean(examFromBundle)}
          onBackToBundle={() => {
            const bId = typeof examFromBundle === 'string' ? examFromBundle : selectedBundleId;
            if (bId) {
              navHandlers.onNavigateBundle(bId);
            } else {
              navigateWithSmoothTransition(() => {
                setViewMode('bundle_detail');
              });
            }
          }}
          {...navHandlers}
        />
      );
    }

    if (viewMode === 'courses' || viewMode === 'course') {
      return (
        <CoursesPage 
          data={data}
          {...navHandlers}
        />
      );
    }

    if (viewMode === 'bundle_detail') {
      return (
        <BundleDetailPage 
          data={data}
          selectedBundleId={selectedBundleId}
          {...navHandlers}
        />
      );
    }

    if (viewMode === 'course_player') {
      return (
        <CoursePlayerPage 
          data={data}
          courseId={selectedCourseId || 'master-english-30-days'}
          initialLesson={selectedLessonInfo}
          onNavigateCourse={navHandlers.onNavigateCourse}
          onLoginClick={(postLoginAction) => handleOpenAuth('signin', postLoginAction)}
          {...navHandlers}
        />
      );
    }

    if (viewMode === 'course_detail') {
      return (
        <BiologyCoursePage 
          data={data}
          selectedCourseId={selectedCourseId || 'master-english-30-days'}
          onOpenLesson={navHandlers.onNavigateCoursePlayer}
          onUpdateCourse={(updatedCourse) => {
            setData(prev => {
              const updatedCourses = (prev.courses || []).map(c => 
                (c.id === updatedCourse.id || c.slug === updatedCourse.slug) ? updatedCourse : c
              );
              const nextData = { ...prev, courses: updatedCourses };
              try {
                localStorage.setItem('eduhunters_data', JSON.stringify(nextData));
              } catch (e) {}
              saveCloudData({ courses: updatedCourses });
              return nextData;
            });
          }}
          {...navHandlers}
        />
      );
    }

    if (viewMode === 'store') {
      return (
        <StorePage 
          data={data}
          {...navHandlers}
        />
      );
    }

    if (viewMode === 'about') {
      return (
        <AboutPage 
          data={data}
          {...navHandlers}
        />
      );
    }

    if (viewMode === 'devices') {
      return (
        <DevicesPage 
          data={data}
          {...navHandlers}
        />
      );
    }

    if (viewMode === 'dashboard') {
      return (
        <DashboardPage 
          data={data}
          onLoginClick={(postLoginAction) => handleOpenAuth('signin', postLoginAction)}
          {...navHandlers}
        />
      );
    }

    if (viewMode === 'orders') {
      return (
        <OrdersPage 
          data={data}
          {...navHandlers}
        />
      );
    }

    // Default: Homepage
    return (
      <HomePage 
        data={data}
        {...navHandlers}
      />
    );
  };

  const pageKey = `${viewMode}_${selectedCourseId || ''}_${selectedExamCategory || ''}_${selectedPolicyTab || ''}`;

  return (
    <>
      {/* Top Glowing Page Navigation Nano Progress Bar (YouTube/Vercel Aesthetic) */}
      <div 
        aria-hidden="true" 
        className={`nav-nano-bar ${isNavigating ? 'opacity-100' : 'opacity-0'}`}
      >
        <div 
          className="nav-nano-bar-fill"
          style={{ width: `${navProgress}%` }}
        >
          <div className="nav-nano-bar-glow" />
        </div>
      </div>

      {/* Premium Dark Theme Background Image (Desktop: Original, Mobile: 90° Rotated Vertical) */}
      <div 
        aria-hidden="true"
        className={`fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-opacity duration-700 ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundColor: '#070102' }}
      >
        {/* Desktop / Tablet Background (Landscape) */}
        <img
          src="/dark-bg-desktop.png"
          alt=""
          className="hidden md:block w-full h-full object-cover object-center select-none pointer-events-none"
        />

        {/* Mobile Background (90° Rotated Portrait / Vertical orientation) */}
        <img
          src="/dark-bg-mobile.png"
          alt=""
          className="block md:hidden w-full h-full object-cover object-center select-none pointer-events-none"
        />
      </div>

      {/* Ultra-Smooth Silk Page Container with ErrorBoundary Protection */}
      <ErrorBoundary key={`${viewMode}-${selectedCourseId || ''}-${selectedBundleId || ''}-${selectedExamCategory || ''}`}>
        <div
          key={`${viewMode}-${selectedCourseId || ''}-${selectedBundleId || ''}-${selectedExamCategory || ''}`}
          className="page-transition-container page-animating"
        >
          {renderContent()}
        </div>
      </ErrorBoundary>

      {/* AdobeWala-Inspired Cinematic Preloader Screen */}
      {isLoading && (
        <PreloaderScreen 
          siteSettings={data?.siteSettings}
          onFinish={() => setIsLoading(false)} 
        />
      )}

      {/* Global Auth Modal with Exact Design from Reference Image */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAuthAction(null);
        }}
        onSuccess={(user) => {
          setIsAuthModalOpen(false);
          if (pendingAuthAction) {
            const action = pendingAuthAction;
            setPendingAuthAction(null);
            setTimeout(() => {
              action(user);
            }, 300);
          }
        }}
      />
      {/* Global Student Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        hintNotice={profileHintNotice}
        requireCompletion={profileRequireCompletion}
        onClose={() => {
          setIsProfileModalOpen(false);
          setPendingProfileAction(null);
          setProfileHintNotice(null);
          setProfileRequireCompletion(false);
        }}
        onSaveSuccess={(updatedUser) => {
          if (pendingProfileAction) {
            const action = pendingProfileAction;
            setPendingProfileAction(null);
            setProfileHintNotice(null);
            setProfileRequireCompletion(false);
            setTimeout(() => {
              try {
                action(updatedUser);
              } catch (err) {
                console.error('Error executing post-profile action:', err);
              }
            }, 250);
          }
        }}
      />
    </>
  );
}
