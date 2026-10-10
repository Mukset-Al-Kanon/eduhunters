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
import LegalPoliciesPage from './components/LegalPoliciesPage';
import AuthModal from './components/AuthModal';
import PreloaderScreen from './components/PreloaderScreen';
import { saveCloudData, fetchCloudData, subscribeToCloudData } from './services/firestoreSyncService';

// Performance Optimization: Lazy load heavy AdminPanel
const AdminPanel = lazy(() => import('./components/AdminPanel'));
import { useTheme } from './context/ThemeContext';
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
        window.scrollTo(0, 0);
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
      try {
        const transition = document.startViewTransition(() => {
          executeUpdate();
        });
        transition.finished
          .catch(() => {})
          .finally(() => {
            clearTimeout(progressTimer);
            finalize();
          });
      } catch (err) {
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
          heroSlides: (Array.isArray(parsed.heroSlides) && parsed.heroSlides.length > 0 && !parsed.heroSlides.some(s => s.image?.includes('sanjid_vaiyar_all_batch_2627'))) 
            ? parsed.heroSlides 
            : initialData.heroSlides,
          homeStats: Array.isArray(parsed.homeStats) && parsed.homeStats.length > 0 ? parsed.homeStats : initialData.homeStats,
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
            const acc = parsed.accounting || initialData.accounting;
            let txs = Array.isArray(acc?.transactions) && acc.transactions.length > 0
              ? acc.transactions
              : initialData.accounting.transactions;
            const hasPending = txs.some(t => t.status === 'Pending');
            if (!hasPending) {
              const initPending = initialData.accounting.transactions.filter(t => t.status === 'Pending');
              txs = [...initPending, ...txs];
            }
            return {
              ...initialData.accounting,
              ...acc,
              transactions: txs
            };
          })(),
          termsAndConditions: parsed.termsAndConditions || initialData.termsAndConditions,
          refundPolicy: parsed.refundPolicy || initialData.refundPolicy,
          privacyPolicy: parsed.privacyPolicy || initialData.privacyPolicy
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
        }
        if (Array.isArray(parsed.instructors) && parsed.instructors.length > 0) {
          parsed.instructors = [];
          modified = true;
        }
        if (Array.isArray(parsed.storeProducts) && parsed.storeProducts.some(p => [1, 2, 3, 4].includes(p.id) || p.title?.includes('Biology Extra Info'))) {
          parsed.storeProducts = parsed.storeProducts.filter(p => !([1, 2, 3, 4].includes(p.id) || p.title?.includes('Biology Extra Info')));
          modified = true;
        }
        if (modified) {
          localStorage.setItem('eduhunters_data', JSON.stringify(parsed));
          setData(prev => ({
            ...prev,
            courses: parsed.courses || prev.courses,
            storeProducts: parsed.storeProducts || prev.storeProducts
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
    setData(newData);
    try {
      localStorage.setItem('eduhunters_data', JSON.stringify(newData));
    } catch (e) {
      console.error('Error saving data to localStorage:', e);
    }
    broadcastSync(newData);
    // Cloud Firestore synchronization: Save permanently in cloud so git pushes never erase admin edits
    saveCloudData(newData);
  };

  // Real-time synchronization listener: Local tabs + Cloud Firestore
  useEffect(() => {
    // 1. Listen for real-time Cloud Firestore updates (across all devices & live vs local)
    const unsubscribeCloud = subscribeToCloudData((cloudData) => {
      if (cloudData) {
        setData(prev => ({
          ...prev,
          ...cloudData
        }));
        try {
          localStorage.setItem('eduhunters_data', JSON.stringify({
            ...data,
            ...cloudData
          }));
        } catch (e) {}
      }
    });

    const handleStorageChange = (e) => {
      if (e.key === 'eduhunters_data' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
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

  const handleEnrollSuccess = ({ itemTitle, amount, studentName, studentPhone, method, trxId }) => {
    const amt = Number(amount) || 0;
    const newTrx = {
      id: `TRX-${Date.now().toString().slice(-5)}`,
      studentName: studentName || 'অনলাইন শিক্ষার্থী',
      studentPhone: studentPhone || 'N/A',
      itemTitle: itemTitle || 'কোর্স এনরোলমেন্ট',
      type: 'INCOME',
      amount: amt,
      method: method || 'bKash',
      trxId: trxId || `TXN${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };

    const currentAccounting = data.accounting || initialData.accounting;
    const updatedAccounting = {
      ...currentAccounting,
      totalRevenue: (currentAccounting.totalRevenue || 0) + amt,
      netProfit: ((currentAccounting.totalRevenue || 0) + amt) - (currentAccounting.totalExpenses || 0),
      totalOrders: (currentAccounting.totalOrders || 0) + 1,
      transactions: [newTrx, ...(currentAccounting.transactions || [])]
    };

    const updatedData = {
      ...data,
      accounting: updatedAccounting
    };
    handleUpdateData(updatedData);
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [pendingAuthAction, setPendingAuthAction] = useState(null);

  const handleOpenAuth = (mode = 'signin', postAuthAction = null) => {
    setAuthMode(mode);
    setPendingAuthAction(typeof postAuthAction === 'function' ? () => postAuthAction : null);
    setIsAuthModalOpen(true);
  };

  const navHandlers = {
    onNavigateHome: () => {
      setExamFromBundle(false);
      try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch(e) {}
      navigateWithSmoothTransition(() => {
        setViewMode('home');
      }, '/');
    },
    onNavigateCourse: (courseId, options = {}) => {
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
      if (typeof courseId === 'string' && examKeys.has(courseId.trim())) {
        const cat = courseId.trim();
        const url = isFromBundle 
          ? `/exams?category=${cat}&from=bundle${bundleId ? `&bundleId=${bundleId}` : ''}`
          : `/exams?category=${cat}`;
        navigateWithSmoothTransition(() => {
          setSelectedExamCategory(cat);
          setViewMode('exams');
        }, url);
        return;
      }
      if (typeof courseId === 'string' && courseId.trim().length > 0 && !courseId.includes('[object')) {
        const url = isFromBundle 
          ? `/courses/${courseId}?from=bundle${bundleId ? `&bundleId=${bundleId}` : ''}`
          : `/courses/${courseId}`;
        navigateWithSmoothTransition(() => {
          setSelectedCourseId(courseId);
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
      try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch(e) {}
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
    onNavigateOrders: () => {
      navigateWithSmoothTransition(() => {
        setViewMode('orders');
      }, '/orders');
    },
    onOpenAdmin: () => {
      navigateWithSmoothTransition(() => {
        setViewMode('admin');
      }, '/admin');
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
            onUpdateData={handleUpdateData}
            onResetData={handleResetData}
            onExitAdmin={() => {
              navigateWithSmoothTransition(() => {
                setViewMode('home');
              }, '/');
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
      <ErrorBoundary key={pageKey}>
        <div
          className={`page-transition-container ${isAnimatingKey ? 'page-animating' : ''}`}
          onAnimationEnd={() => setIsAnimatingKey(false)}
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
          console.log('User authenticated:', user);
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
    </>
  );
}
