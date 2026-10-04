import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { initialData, isZenithCopiedCourse } from './data/mockData';
import HomePage from './components/HomePage';
import CoursesPage from './components/CoursesPage';
import BiologyCoursePage from './components/BiologyCoursePage';
import ExamsPage from './components/ExamsPage';
import StorePage from './components/StorePage';
import AboutPage from './components/AboutPage';
import DevicesPage from './components/DevicesPage';
import OrdersPage from './components/OrdersPage';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
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
        return path.split('/courses/')[1] || null;
      }
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
  const [viewMode, setViewMode] = useState(() => {
    const path = (window.location.pathname || '').toLowerCase();
    const hash = (window.location.hash || '').toLowerCase();
    if (path.includes('/admin') || hash.includes('admin')) return 'admin';
    if (path.includes('/exams') || hash.includes('exams')) return 'exams';
    if (path.includes('/devices') || hash.includes('devices')) return 'devices';
    if (path.includes('/orders') || hash.includes('orders')) return 'orders';
    if (path.startsWith('/courses/') && path.length > 9 && !path.includes('[object')) return 'course_detail';
    if (path.includes('/courses') || hash.includes('courses')) return 'courses';
    if (path.includes('/store') || hash.includes('store')) return 'store';
    if (path.includes('/about') || hash.includes('about')) return 'about';
    return 'home';
  });

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
          } catch {
            setSelectedExamCategory(null);
          }
          setViewMode('exams');
        }
        else if (path.startsWith('/courses/') && path.length > 9 && !path.includes('[object')) {
          const id = path.split('/courses/')[1];
          if (id) setSelectedCourseId(id);
          setViewMode('course_detail');
        }
        else if (path.includes('/courses') || hash.includes('courses')) {
          setSelectedCourseId(null);
          setViewMode('courses');
        }
        else if (path.includes('/store') || hash.includes('store')) setViewMode('store');
        else if (path.includes('/about') || hash.includes('about')) setViewMode('about');
        else if (path.includes('/devices') || hash.includes('devices')) setViewMode('devices');
        else if (path.includes('/orders') || hash.includes('orders')) setViewMode('orders');
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
          siteSettings: { ...initialData.siteSettings, ...(parsed.siteSettings || {}) },
          announcement: parsed.announcement || initialData.announcement,
          sectionTexts: { ...initialData.sectionTexts, ...(parsed.sectionTexts || {}) },
          whyChooseUs: Array.isArray(parsed.whyChooseUs) && parsed.whyChooseUs.length > 0 ? parsed.whyChooseUs : initialData.whyChooseUs,
          heroSlides: (Array.isArray(parsed.heroSlides) && parsed.heroSlides.length > 0 && !parsed.heroSlides.some(s => s.image?.includes('sanjid_vaiyar_all_batch_2627'))) 
            ? parsed.heroSlides 
            : initialData.heroSlides,
          homeStats: Array.isArray(parsed.homeStats) && parsed.homeStats.length > 0 ? parsed.homeStats : initialData.homeStats,
          courses: (() => {
            if (Array.isArray(parsed.courses) && parsed.courses.length > 0) {
              const list = parsed.courses
                .filter(c => !isZenithCopiedCourse(c))
                .map(c => {
                  let mapped = c.category === 'University A Unit' ? { ...c, category: 'Free' } : c;
                  const initialMatch = initialData.courses.find(initC => initC.id === c.id || initC.slug === c.slug);
                  if (initialMatch && (!mapped.curriculum || mapped.curriculum[0]?.chapters?.[0]?.lessons?.some(l => l.title === 'HSC 26,27'))) {
                    mapped = { ...mapped, curriculum: initialMatch.curriculum };
                  }
                  return mapped;
                });
              const existingIds = new Set(list.map(c => c.id || c.slug));
              initialData.courses.forEach(c => {
                if (!existingIds.has(c.id) && !existingIds.has(c.slug) && !isZenithCopiedCourse(c)) {
                  list.push(c);
                }
              });
              return list.length > 0 ? list : initialData.courses;
            }
            return initialData.courses;
          })(),
          instructors: [],
          freeVideos: (Array.isArray(parsed.freeVideos) && parsed.freeVideos.length > 0 && parsed.freeVideos.some(v => v.videoId?.includes('rMGOI-A5czA'))) 
            ? parsed.freeVideos 
            : initialData.freeVideos,
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 
            ? parsed.categories
                .filter(c => !["HSC 25", "Engineering", "HSC 27", "HSC 28", "HSC 26"].includes(c))
                .map(c => c === 'University A Unit' ? 'Free' : c)
            : initialData.categories,
          storeProducts: Array.isArray(parsed.storeProducts) && parsed.storeProducts.length > 0 ? parsed.storeProducts : initialData.storeProducts,
          accounting: {
            ...initialData.accounting,
            ...(parsed.accounting || {}),
            transactions: Array.isArray(parsed.accounting?.transactions) && parsed.accounting.transactions.length > 0
              ? parsed.accounting.transactions
              : initialData.accounting.transactions
          }
        };
      }
    } catch (e) {
      console.error('Error loading stored data:', e);
    }
    return initialData;
  });

  // Permanently purge any Zenith Crew / Codervai copied courses and removed teachers from browser localStorage on load
  useEffect(() => {
    try {
      const raw = localStorage.getItem('eduhunters_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        let modified = false;
        if (Array.isArray(parsed.courses)) {
          let purged = parsed.courses.filter(c => !isZenithCopiedCourse(c)).map(c => {
            const initialMatch = initialData.courses.find(initC => initC.id === c.id || initC.slug === c.slug);
            if (initialMatch && (!c.curriculum || c.curriculum[0]?.chapters?.[0]?.lessons?.some(l => l.title === 'HSC 26,27'))) {
              modified = true;
              return { ...c, curriculum: initialMatch.curriculum };
            }
            return c;
          });
          const existingIds = new Set(purged.map(c => c.id || c.slug));
          initialData.courses.forEach(c => {
            if (!existingIds.has(c.id) && !existingIds.has(c.slug) && !isZenithCopiedCourse(c)) {
              purged.push(c);
              modified = true;
            }
          });
          if (purged.length !== parsed.courses.length || modified) {
            parsed.courses = purged;
            modified = true;
          }
        }
        if (Array.isArray(parsed.instructors) && parsed.instructors.length > 0) {
          parsed.instructors = [];
          modified = true;
        }
        if (modified) {
          localStorage.setItem('eduhunters_data', JSON.stringify(parsed));
          setData(prev => ({
            ...prev,
            courses: parsed.courses || prev.courses,
            instructors: parsed.instructors || prev.instructors
          }));
        }
      }
    } catch (e) {
      console.error('Error purifying localStorage:', e);
    }
  }, []);

  const handleUpdateData = (newData) => {
    setData(newData);
    try {
      localStorage.setItem('eduhunters_data', JSON.stringify(newData));
    } catch (e) {
      console.error('Error saving data:', e);
    }
  };

  const handleResetData = () => {
    setData(initialData);
    try {
      localStorage.setItem('eduhunters_data', JSON.stringify(initialData));
    } catch (e) {
      console.error('Error resetting data:', e);
    }
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

  const navHandlers = {
    onNavigateHome: () => {
      navigateWithSmoothTransition(() => {
        setViewMode('home');
      }, '/');
    },
    onNavigateCourse: (courseId) => {
      if (typeof courseId === 'string' && courseId.trim().length > 0 && !courseId.includes('[object')) {
        navigateWithSmoothTransition(() => {
          setSelectedCourseId(courseId);
          setViewMode('course_detail');
        }, `/courses/${courseId}`);
      } else {
        navigateWithSmoothTransition(() => {
          setSelectedCourseId(null);
          setViewMode('courses');
        }, '/courses');
      }
    },
    onNavigateExams: (categoryKey) => {
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
    onLoginClick: () => {
      setAuthMode('signin');
      setIsAuthModalOpen(true);
    },
    onSignUpClick: () => {
      setAuthMode('signup');
      setIsAuthModalOpen(true);
    },
    onEnrollSuccess: handleEnrollSuccess
  };

  const renderContent = () => {
    if (viewMode === 'admin') {
      return (
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
      );
    }

    if (viewMode === 'exams') {
      return (
        <ExamsPage 
          data={data}
          selectedCategory={selectedExamCategory}
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

    if (viewMode === 'course_detail') {
      return (
        <BiologyCoursePage 
          data={data}
          selectedCourseId={selectedCourseId || 'master-english-30-days'}
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

  const pageKey = `${viewMode}_${selectedCourseId || ''}_${selectedExamCategory || ''}`;

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

      {/* High-End Seamless Drifting Red Wine Lights Background Video (Dark Mode) */}
      <div 
        aria-hidden="true"
        className={`fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-opacity duration-700 ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-[0.32]"
          src="/red-wine-drift.webm"
        />
        {/* 5/10 Close to Black Deep Red Wine Atmosphere Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#180307]/75 via-[#0e0104]/80 to-[#070002]/88 pointer-events-none" />
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

      {/* Global Auth Modal with Exact Design from Reference Image */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          console.log('User authenticated:', user);
        }}
      />
    </>
  );
}
