import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  heroSlidesData, 
  homeStatsData, 
  categoriesList, 
  homeCoursesData, 
  instructorsData, 
  freeVideosData, 
  whyChooseUsData 
} from '../data/homeData';
import ProtectedPdfViewer from './ProtectedPdfViewer';
import ExamEngine from './ExamEngine';
import CheckoutModal from './CheckoutModal';
import BundleDetailModal from './BundleDetailModal';
import Navbar from './Navbar';
import { initialData, isZenithCopiedCourse } from '../data/mockData';
import { EXAM_CATEGORIES_METADATA } from '../data/examCategoriesData';
import { isStudentProfileComplete } from '../utils/studentProfile';
import { 
  X, 
  Play, 
  Sparkles, 
  ExternalLink, 
  Share2, 
  Copy, 
  Check, 
  Tv, 
  Maximize2, 
  Info, 
  ChevronLeft,
  ChevronRight,
  Sliders,
  Edit2
} from 'lucide-react';

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

// Animated Rising Number Counter Component
function AnimatedStatCounter({ value, isDark }) {
  const containerRef = React.useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Parse raw value like "3000+" -> numeric: 3000, suffix: "+", prefix: ""
  const parseResult = React.useMemo(() => {
    const str = String(value || '');
    const match = str.match(/^([^\d]*)(\d+)([^\d]*)$/);
    if (match) {
      const num = parseInt(match[2], 10);
      // Start from 94% of target value
      const startNum = num > 50 ? Math.floor(num * 0.94) : Math.max(1, num - 2);
      return {
        prefix: match[1] || '',
        num,
        startNum,
        suffix: match[3] || ''
      };
    }
    return { prefix: '', num: 0, startNum: 0, suffix: str };
  }, [value]);

  const [displayVal, setDisplayVal] = useState(parseResult.startNum);
  const [animProgress, setAnimProgress] = useState(0); // 0 -> 1 for synchronized opacity & slide-up

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || parseResult.num <= 0) {
      if (isVisible) {
        setDisplayVal(parseResult.num);
        setAnimProgress(1);
      }
      return;
    }

    let startTimestamp = null;
    let animationFrameId;
    const duration = 1000; // 1s as requested
    const startVal = parseResult.startNum;
    const delta = parseResult.num - startVal;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      
      // Buttery smooth ease-out (smooth glide with zero jarring jumps)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (delta * ease));
      
      setDisplayVal(current);
      setAnimProgress(progress);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayVal(parseResult.num);
        setAnimProgress(1);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible, parseResult.num, parseResult.startNum]);

  // Synchronized gentle upward glide
  const translateY = (1 - Math.min(animProgress * 1.15, 1)) * 8;
  // Gradual, velvety fade-in over first 40% of animation
  const opacity = Math.min(animProgress * 2.2, 1);

  return (
    <div 
      ref={containerRef}
      style={{
        transform: `translateY(${translateY}px)`,
        opacity: isVisible ? opacity : 0,
        transition: 'none'
      }}
    >
      <p className={`text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none tabular-nums ${
        isDark 
          ? 'text-transparent bg-clip-text bg-gradient-to-b from-white via-[#fff0f3] to-[#ffccd5] drop-shadow-[0_4px_16px_rgba(225,20,56,0.35)]' 
          : 'text-white drop-shadow-md'
      }`}>
        {parseResult.prefix}
        {displayVal}
        {parseResult.suffix}
      </p>
    </div>
  );
}

export default function HomePage({ 
  data = {},
  onNavigateHome,
  onNavigateDashboard,
  onNavigateCourse, 
  onNavigateBundle,
  onNavigateExams, 
  onNavigateLeaderboard,
  onNavigateStore, 
  onNavigateAbout, 
  onNavigateDevices,
  onNavigateOrders,
  onNavigatePolicies,
  onOpenAdmin, 
  onLoginClick,
  onEnrollSuccess,
  onOpenProfile
}) {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'admin@eduhunters.com';
  const [selectedCategory, setSelectedCategory] = useState("সকল");
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState(null);
  const [selectedBundleForDetails, setSelectedBundleForDetails] = useState(null);
  const [activePlayingId, setActivePlayingId] = useState(null);

  const heroSlides = Array.isArray(data.heroSlides) ? data.heroSlides : heroSlidesData;
  const slideCount = heroSlides.length;

  // Seamless circular carousel clones: [LastSlide, ...heroSlides, FirstSlide]
  const extendedSlides = React.useMemo(() => {
    if (slideCount <= 1) return heroSlides;
    return [heroSlides[slideCount - 1], ...heroSlides, heroSlides[0]];
  }, [heroSlides, slideCount]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(slideCount > 1 ? 1 : 0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = React.useRef(null);
  const touchEndX = React.useRef(null);
  const homeStats = React.useMemo(() => {
    const raw = Array.isArray(data.homeStats) && data.homeStats.length > 0 ? data.homeStats : homeStatsData;
    if (raw.some(s => s.value === '3000+' || s.value === '70000+' || s.value === '15+' || s.label?.toLowerCase().includes('students') || s.label?.toLowerCase().includes('community') || s.label?.toLowerCase().includes('paid batch'))) {
      return homeStatsData;
    }
    return raw;
  }, [data.homeStats]);
  const homeCourses = Array.isArray(data.courses) ? data.courses : homeCoursesData;
  const instructors = Array.isArray(data.instructors) ? data.instructors : [];
  const rawFreeVideos = Array.isArray(data.freeVideos) ? data.freeVideos : freeVideosData;
  const whyChooseUs = Array.isArray(data.whyChooseUs) ? data.whyChooseUs : whyChooseUsData;
  const REMOVED_CATEGORIES = ["HSC 25", "Engineering", "HSC 27", "HSC 28", "HSC 26", "Free", "free"];
  const rawCategories = Array.isArray(data.categories) ? data.categories : categoriesList;
  const categories = rawCategories
    .filter(c => !REMOVED_CATEGORIES.includes(c) && (c || '').toLowerCase() !== 'free')
    .map(c => c === "University A Unit" ? "Medical" : c);

  const allBundles = Array.isArray(data?.bundles)
    ? data.bundles
    : (initialData.bundles || []);
  const activeBundles = allBundles.filter(b => (b.status || 'ACTIVE') === 'ACTIVE');

  const categoriesWithBundles = activeBundles.length > 0
    ? (categories.includes('Bundles') ? categories : [categories[0], 'Bundles', ...categories.slice(1)])
    : categories;

  const isBundles = selectedCategory === 'Bundles' || selectedCategory.toLowerCase() === 'bundles' || selectedCategory === 'বান্ডিল';

  const siteSettings = { ...initialData.siteSettings, ...(data.siteSettings || {}) };
  const rawContactPhone = (siteSettings.contactPhone && !siteSettings.contactPhone.includes('1700'))
    ? siteSettings.contactPhone
    : '01342227935';
  const rawWaNumber = siteSettings.whatsappNumber || rawContactPhone;
  const cleanWaNumber = rawWaNumber.replace(/[^0-9]/g, '').replace(/^88/, '') || '01342227935';
  const whatsappUrl = `https://wa.me/88${cleanWaNumber}`;

  const st = { ...initialData.sectionTexts, ...(data.sectionTexts || {}) };
  const announcement = data.announcement || initialData.announcement;

  // Extract clean 11-char YouTube ID from any link or format
  const extractYouTubeId = (urlOrId) => {
    if (!urlOrId) return '';
    const str = String(urlOrId).trim();
    const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) return match[1];
    const clean = str.split('?')[0].split('&')[0];
    return clean.length >= 11 ? clean.slice(-11) : clean;
  };

  const fallbackVideoIds = ['rMGOI-A5czA', '8aIGBh4RLuA', 'CdNOjNnw0tU', 'wCQ-oXOFj68'];
  const processedVideos = rawFreeVideos.map((vid, idx) => {
    const cleanId = extractYouTubeId(vid.videoId || vid.url || vid.link) || fallbackVideoIds[idx % fallbackVideoIds.length];
    return {
      ...vid,
      id: vid.id || (idx + 1),
      cleanId
    };
  });


  // If selected category was deleted or renamed in admin, reset safely to 'সকল'
  useEffect(() => {
    if (selectedCategory !== "সকল" && !categoriesWithBundles.includes(selectedCategory)) {
      setSelectedCategory("সকল");
    }
  }, [categoriesWithBundles, selectedCategory]);

  // Sync state if slideCount changes
  useEffect(() => {
    setCurrentSlideIndex(slideCount > 1 ? 1 : 0);
    setIsTransitionEnabled(true);
  }, [slideCount]);

  // Handle transition end for seamless infinite loop wrapping
  const handleSlideTransitionEnd = () => {
    if (slideCount <= 1) return;
    if (currentSlideIndex >= slideCount + 1) {
      // Reached cloned first slide at the end -> jump instantly to real first slide
      setIsTransitionEnabled(false);
      setCurrentSlideIndex(1);
    } else if (currentSlideIndex <= 0) {
      // Reached cloned last slide at the start -> jump instantly to real last slide
      setIsTransitionEnabled(false);
      setCurrentSlideIndex(slideCount);
    }
  };

  // Re-enable smooth transition after an instant wrap jump
  useEffect(() => {
    if (!isTransitionEnabled) {
      const timer = setTimeout(() => {
        setIsTransitionEnabled(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isTransitionEnabled]);

  // Continuous auto-sliding in forward circular loop (pauses on hover)
  useEffect(() => {
    if (slideCount <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setIsTransitionEnabled(true);
      setCurrentSlideIndex(prev => prev + 1);
    }, 4500);
    return () => clearInterval(timer);
  }, [slideCount, isHovered]);

  const nextSlide = () => {
    if (slideCount <= 1) return;
    setIsTransitionEnabled(true);
    setCurrentSlideIndex(prev => prev + 1);
  };

  const prevSlide = () => {
    if (slideCount <= 1) return;
    setIsTransitionEnabled(true);
    setCurrentSlideIndex(prev => prev - 1);
  };

  const goToSlide = (realIdx) => {
    if (slideCount <= 1) return;
    setIsTransitionEnabled(true);
    setCurrentSlideIndex(realIdx + 1);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 45) {
      nextSlide();
    } else if (distance < -45) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const activeDot = slideCount > 0 
    ? (slideCount > 1 
        ? ((currentSlideIndex - 1 + slideCount) % slideCount) 
        : 0) 
    : 0;

  const isExamBatch = selectedCategory === "EXAM BATCH" || selectedCategory.toLowerCase() === "exam batch";

  const activeExamBatches = React.useMemo(() => {
    const rawBatches = Array.isArray(data?.examBatches) && data.examBatches.length > 0
      ? data.examBatches
      : EXAM_CATEGORIES_METADATA;

    return rawBatches.filter(batch => {
      if (batch.isHidden) return false;
      if (batch.isActive === false) return false;
      // Cross check with homeCourses
      const matchingCourse = homeCourses.find(c => 
        (c.key && batch.key && c.key === batch.key) ||
        (c.id && batch.key && c.id === batch.key) ||
        (c.slug && batch.key && c.slug === batch.key) ||
        (c.id && batch.id && c.id === batch.id) ||
        (c.title && batch.title && c.title.trim().toLowerCase() === batch.title.trim().toLowerCase())
      );
      if (matchingCourse && matchingCourse.isActive === false) {
        return false;
      }
      return true;
    });
  }, [data?.examBatches, homeCourses]);

  const filteredCourses = homeCourses
    .filter(course => !isZenithCopiedCourse(course))
    .filter(course => {
      if (course.isActive === false) return false;
      if (course.isExamBatch || course.category === 'EXAM BATCH') {
        const matchingBatch = (data?.examBatches || []).find(b => 
          (b.key && course.key && b.key === course.key) ||
          (b.key && course.id && b.key === course.id) ||
          (b.id && course.id && b.id === course.id) ||
          (b.title && course.title && b.title.trim().toLowerCase() === course.title.trim().toLowerCase())
        );
        if (matchingBatch && (matchingBatch.isActive === false || matchingBatch.isHidden)) {
          return false;
        }
      }
      return true;
    })
    .filter(course => {
      if (selectedCategory === "সকল") return true;
      if (selectedCategory.toLowerCase() === "free") {
        return (course.category || "").toLowerCase() === "free" || course.isFree || Number(course.salePrice) === 0;
      }
      if (selectedCategory.toLowerCase() === "medical") {
        return (course.category || "").toLowerCase() === "medical" || course.filterGroup === "medical" || (course.title || "").includes("মেডিকেল");
      }
      return course.category === selectedCategory;
    });

  const handleCourseClick = (slug) => {
    const foundCourse = homeCourses.find(c => c.id === slug || c.slug === slug || c.key === slug);
    if (foundCourse?.isBundle) {
      if (onNavigateBundle) {
        onNavigateBundle(foundCourse.id || foundCourse.slug);
        return;
      }
    }
    if (foundCourse?.isExamBatch || foundCourse?.category === 'EXAM BATCH') {
      if (onNavigateExams) {
        onNavigateExams(foundCourse.key || foundCourse.id || foundCourse.slug);
        return;
      }
    }
    if (onNavigateCourse) {
      onNavigateCourse(slug);
    }
  };

  const handleEnrollClick = (course, e) => {
    e.stopPropagation();
    if (course.isFree || Number(course.salePrice) === 0) {
      handleCourseClick(course.id || course.slug);
      return;
    }

    // 1. If not authenticated: must log in or sign up first
    if (!currentUser) {
      if (onLoginClick) {
        onLoginClick((loggedInUser) => {
          const targetUser = loggedInUser || currentUser;
          // Check profile completeness after login
          if (!isStudentProfileComplete(targetUser)) {
            if (onOpenProfile) {
              onOpenProfile({
                hintNotice: 'Please complete your profile with your name, college, and WhatsApp number to finish enrolling.',
                requireCompletion: true,
                onComplete: () => {
                  setSelectedCourseForCheckout(course);
                  setShowCheckout(true);
                }
              });
            } else {
              setSelectedCourseForCheckout(course);
              setShowCheckout(true);
            }
          } else {
            setSelectedCourseForCheckout(course);
            setShowCheckout(true);
          }
        });
      }
      return;
    }

    // 2. If authenticated: check if profile is complete
    if (!isStudentProfileComplete(currentUser)) {
      if (onOpenProfile) {
        onOpenProfile({
          hintNotice: 'Please complete your profile with your name, college, and WhatsApp number to finish enrolling.',
          requireCompletion: true,
          onComplete: () => {
            setSelectedCourseForCheckout(course);
            setShowCheckout(true);
          }
        });
      } else {
        setSelectedCourseForCheckout(course);
        setShowCheckout(true);
      }
      return;
    }

    // 3. Profile is complete -> open checkout
    setSelectedCourseForCheckout(course);
    setShowCheckout(true);
  };

  // Smart slide click navigation handler
  const handleSlideClick = (slide) => {
    if (!slide || !slide.link) {
      if (onNavigateCourse) onNavigateCourse();
      return;
    }
    const rawLink = String(slide.link).trim();
    if (!rawLink) {
      if (onNavigateCourse) onNavigateCourse();
      return;
    }

    // External URLs (e.g. https://... or http://...)
    if (rawLink.startsWith('http://') || rawLink.startsWith('https://')) {
      window.open(rawLink, '_blank', 'noopener,noreferrer');
      return;
    }

    // Clean internal route & query parameters
    const [pathPart, queryPart] = rawLink.split('?');
    const path = pathPart.toLowerCase().replace(/^\/+/, ''); // strip leading slashes
    const searchParams = new URLSearchParams(queryPart || '');

    if (path.startsWith('exams') || path.includes('exam')) {
      const category = searchParams.get('category') || (path.split('/')[1] || null);
      if (onNavigateExams) onNavigateExams(category);
    } else if (path.startsWith('bundles') || path.includes('bundle')) {
      const bundleId = path.split('/')[1] || null;
      if (onNavigateBundle) onNavigateBundle(bundleId);
      else if (onNavigateCourse) onNavigateCourse();
    } else if (path.startsWith('store') || path.includes('store')) {
      if (onNavigateStore) onNavigateStore();
    } else if (path.startsWith('about') || path.includes('about')) {
      if (onNavigateAbout) onNavigateAbout();
    } else if (path.startsWith('courses')) {
      const parts = path.split('/').filter(Boolean);
      // e.g. 'courses/0' or 'courses/master-english'
      if (parts.length > 1) {
        if (onNavigateCourse) onNavigateCourse(parts[1]);
      } else {
        if (onNavigateCourse) onNavigateCourse();
      }
    } else {
      if (onNavigateCourse) onNavigateCourse();
    }
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-250 ${
      isDark 
        ? 'bg-transparent text-gray-100 selection:bg-[#e11438] selection:text-white' 
        : 'bg-[#F8F9FA] text-[#111827] selection:bg-[#dc2626] selection:text-white'
    }`}>
      {/* Shared Edu Hunters Sticky Navbar with Mobile Profile Drawer */}
      <Navbar 
        activePage="home"
        siteSettings={siteSettings}
        onNavigateHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateDashboard={onNavigateDashboard}
        onNavigateCourse={onNavigateCourse}
        onNavigateExams={onNavigateExams}
        onNavigateLeaderboard={onNavigateLeaderboard}
        onNavigateStore={onNavigateStore}
        onNavigateAbout={onNavigateAbout}
        onNavigateDevices={onNavigateDevices}
        onNavigateOrders={onNavigateOrders}
        onOpenAdmin={onOpenAdmin}
        onLoginClick={onLoginClick}
        onOpenProfile={onOpenProfile}
      />

      {/* Main Container with 72px clearance */}
      <main className="pt-16 md:pt-20">
        
        {/* HERO CAROUSEL SECTION */}
        <section className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 pt-3 md:pt-6 mb-8 md:mb-12">
          {/* Banner Carousel Container */}
          <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative overflow-hidden rounded-2xl md:rounded-3xl aspect-[16/9] group transition-all duration-300 ${
              isDark 
                ? 'shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-[#e11438]/20 bg-[#0c0205]' 
                : 'shadow-md border border-gray-200 bg-white'
            }`}
          >
            {/* Quick Admin Slide Manager Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenAdmin) onOpenAdmin('slides');
                }}
                className="absolute top-3.5 right-3.5 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 hover:bg-blue-600 text-white text-xs font-bold shadow-lg backdrop-blur-md border border-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="হিরো স্লাইডার এডিট করুন"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
                <span>স্লাইডার এডিট</span>
              </button>
            )}

            <div 
              onTransitionEnd={handleSlideTransitionEnd}
              className={`flex h-full ${
                isTransitionEnabled 
                  ? 'transition-transform duration-700 ease-in-out' 
                : ''
              }`}
              style={{
                transform: `translateX(-${slideCount > 1 ? currentSlideIndex * 100 : 0}%)`
              }}
            >
              {extendedSlides.map((slide, idx) => (
                <div 
                  key={`${slide.id || idx}-${idx}`}
                  onClick={() => handleSlideClick(slide)}
                  className="w-full h-full shrink-0 relative cursor-pointer"
                >
                  <img 
                    src={slide.image} 
                    alt={slide.title}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.01] block"
                    loading={idx <= 2 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="text-white font-bold text-sm sm:text-base drop-shadow-md">
                      {slide.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows for Easy Manual Cycling */}
            {slideCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  aria-label="Previous Slide"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-xs border border-white/20 cursor-pointer shadow-lg z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextSlide();
                  }}
                  aria-label="Next Slide"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-xs border border-white/20 cursor-pointer shadow-lg z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {slideCount > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              {heroSlides.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 border-none cursor-pointer ${
                    idx === activeDot 
                      ? (isDark ? 'w-7 bg-[#e11438] shadow-[0_0_12px_rgba(225,20,56,0.6)]' : 'w-7 bg-[#dc2626]') 
                      : (isDark ? 'w-2 bg-white/20 hover:bg-white/40' : 'w-2 bg-gray-300 hover:bg-gray-400')
                  }`}
                />
              ))}
            </div>
          )}
        </section>

        {/* STATS COUNTER STRIP - Ultra Dark Premium Red Wine Aesthetic */}
        <section className={`relative py-12 md:py-14 text-white overflow-hidden transition-colors duration-300 ${
          isDark 
            ? 'bg-gradient-to-r from-[#120306] via-[#22060c] to-[#120306] border-y border-[#e11438]/25 shadow-[0_15px_40px_rgba(0,0,0,0.85)]' 
            : 'bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#7f1d1d] border-y border-red-700/20 shadow-inner'
        }`}>
          {/* Top & Bottom Glowing Hairline Accent Highlights */}
          {isDark && (
            <>
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff2e55]/40 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff2e55]/20 to-transparent pointer-events-none" />
            </>
          )}

          {/* Dotted Grid Pattern with Elegant Vignette Fade */}
          <div 
            className="absolute inset-0 pointer-events-none eh-dots-light"
            style={{
              maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 35%, rgba(0,0,0,0.2) 80%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 35%, rgba(0,0,0,0.2) 80%, transparent 100%)'
            }}
          />

          {/* Center Deep Crimson Ambient Spotlight */}
          {isDark && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[90vw] h-48 bg-[#e11438]/15 rounded-full blur-[85px] pointer-events-none" />
          )}

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-nowrap items-center justify-center gap-4 sm:gap-10 md:gap-16 text-center">
              {homeStats.map((stat, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <div className={`hidden sm:block h-12 w-[1px] shrink-0 self-center ${
                      isDark 
                        ? 'bg-gradient-to-b from-transparent via-[#e11438]/30 to-transparent' 
                        : 'bg-white/20'
                    }`} />
                  )}
                  <div className="space-y-1.5 sm:space-y-2 min-w-0 px-2 sm:px-4 group cursor-default transition-transform duration-300 hover:scale-[1.04]">
                    <AnimatedStatCounter value={stat.value} isDark={isDark} />
                    <p className={`text-[9px] sm:text-[11px] md:text-[12px] uppercase tracking-[0.16em] sm:tracking-[0.24em] font-bold ${
                      isDark 
                        ? 'text-[#ff4d6d] drop-shadow-[0_0_8px_rgba(255,77,109,0.3)]' 
                        : 'text-white/85'
                    }`}>
                      {stat.label}
                    </p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* COURSES SHOWCASE SECTION */}
        <section id="courses-section" className="courses-showcase pt-6 md:pt-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Banner */}
          <div className="eh-band relative overflow-hidden rounded-2xl mb-6 md:mb-10">
            <div className="px-6 py-7 md:px-8 md:py-9 relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
                  {st.coursesTitle || "কোর্সসমূহ"}
                </h2>
              </div>
              <div className="shrink-0">
                <button 
                  onClick={onNavigateCourse}
                  className="eh-btn-inverse text-sm inline-flex items-center gap-1.5 border-none cursor-pointer"
                >
                  {st.coursesBtnText || "View all"}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categoriesWithBundles.map((cat, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border cursor-pointer ${
                  selectedCategory === cat 
                    ? (isDark 
                        ? 'bg-gradient-to-r from-[#e11438] to-[#9b0e27] text-white border-[#ff3358]/40 shadow-[0_4px_16px_rgba(225,20,56,0.35)]' 
                        : 'bg-[#dc2626] text-white border-transparent shadow-sm')
                    : (isDark 
                        ? 'bg-[#140307]/80 text-gray-300 border-[#e11438]/20 hover:border-[#e11438]/60 hover:text-white' 
                        : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600')
                }`}
              >
                {cat === 'Bundles' ? 'Bundles' : cat}
              </button>
            ))}
          </div>

          {/* Course Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isBundles ? (
              activeBundles.length > 0 ? (
                activeBundles.map((bundle) => (
                  <div 
                    key={bundle.id}
                    onClick={() => {
                      if (onNavigateBundle) onNavigateBundle(bundle.id);
                      else if (onNavigateCourse) onNavigateCourse(bundle.id);
                    }}
                    className={`rounded-2xl overflow-hidden flex flex-col group cursor-pointer transition-all border ${
                      isDark 
                        ? 'bg-[#140306] border-[#e11438]/25 hover:border-[#e11438]/50 shadow-[0_12px_35px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_40px_rgba(225,20,56,0.12)] text-white' 
                        : 'bg-white shadow-md hover:shadow-xl border-red-200 hover:border-red-400 ring-2 ring-red-500/10 text-[#111827]'
                    }`}
                  >
                    <div className={`aspect-video overflow-hidden relative ${isDark ? 'bg-black/60' : 'bg-gray-100'}`}>
                      <img 
                        src={bundle.image || 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp'} 
                        alt={bundle.title} 
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#dc2626] text-white shadow-md">
                          Combo Pack
                        </span>
                        {bundle.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-slate-900 backdrop-blur-md shadow-xs">
                            {bundle.badge}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2.5 left-3 right-3 text-white text-xs font-bold flex items-center justify-between">
                        <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                          {bundle.courseIds?.length || 0} Courses Included
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <h3 className={`font-bold mb-1.5 line-clamp-1 transition-colors text-base ${
                        isDark ? 'text-white group-hover:text-red-300' : 'text-[#111827] group-hover:text-[#dc2626]'
                      }`}>
                        {bundle.title}
                      </h3>
                      {bundle.subtitle && (
                        <p className={`text-xs mb-4 line-clamp-1 font-semibold ${isDark ? 'text-[#ff6b8b]' : 'text-red-600'}`}>
                          {bundle.subtitle}
                        </p>
                      )}

                      <div className={`mt-auto flex items-end justify-between gap-2 pt-3 border-t ${
                        isDark ? 'border-white/[0.08]' : 'border-gray-100'
                      }`}>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                            বান্ডিল মূল্য
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-[#dc2626]'}`}>
                              ৳ {bundle.salePrice}
                            </span>
                            {bundle.regularPrice && (
                              <span className="text-xs sm:text-sm text-gray-400 line-through font-medium">৳{bundle.regularPrice}</span>
                            )}
                            {Number(bundle.regularPrice) > Number(bundle.salePrice) && (
                              <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#dc2626] text-white shadow-xs shrink-0 whitespace-nowrap">
                                ৳ {Number(bundle.regularPrice) - Number(bundle.salePrice)} ছাড়
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateBundle) onNavigateBundle(bundle.id);
                            else if (onNavigateCourse) onNavigateCourse(bundle.id);
                          }}
                          className={`text-sm sm:text-base font-bold ${
                            isDark 
                              ? 'text-white hover:text-gray-300' 
                              : 'text-[#dc2626] hover:text-[#b91c1c]'
                          } bg-transparent border-none p-0 cursor-pointer inline-flex items-center gap-1 transition-colors shrink-0 leading-none group/btn`}
                        >
                          <span className="leading-none">বিস্তারিত</span>
                          <svg 
                            className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current transition-transform duration-200 group-hover/btn:translate-x-0.5 shrink-0" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.8" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                    <span className="text-3xl">🎁</span>
                  </div>
                  <p className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>বর্তমানে কোনো সক্রিয় বান্ডিল নেই</p>
                  <p className="text-xs text-gray-400 mt-1">শীঘ্রই নতুন আকর্ষণীয় কম্বো প্যাক যুক্ত করা হবে।</p>
                </div>
              )
            ) : isExamBatch ? (
              activeExamBatches.length > 0 ? (
                activeExamBatches.map((cat) => (
                  <div 
                    key={cat.key}
                    onClick={() => onNavigateExams && onNavigateExams(cat.key)}
                    className={`rounded-2xl overflow-hidden flex flex-col group cursor-pointer transition-all ${
                      isDark 
                        ? 'bg-[#140306] shadow-[0_12px_35px_rgba(0,0,0,0.7)] border border-[#e11438]/20 hover:border-[#e11438]/45 hover:shadow-[0_16px_40px_rgba(225,20,56,0.12)] text-white' 
                        : 'bg-white shadow-sm border border-[#e5e7eb] hover:shadow-xl hover:border-red-200 text-[#111827]'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className={`aspect-video overflow-hidden relative ${isDark ? 'bg-black/60' : 'bg-gray-100'}`}>
                      <img 
                        src={cat.image} 
                        alt={cat.title} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/sureshot_banner.jpg";
                        }}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      />
                      <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
                        isDark ? 'bg-black/75 text-white/90 border border-white/15 backdrop-blur-xs' : 'bg-[#dc2626] text-white shadow-sm'
                      }`}>
                        EXAM BATCH
                      </span>
                      {cat.ribbonText && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-black/75 text-white/95 backdrop-blur-xs">
                          {cat.ribbonText}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-1.5 text-xs text-gray-400">
                        <span className="font-semibold text-gray-300 dark:text-gray-300">{cat.examCountText || `${cat.examCount}টি এক্সাম`}</span>
                        <span>•</span>
                        <span>{cat.questionCount}</span>
                        {cat.enrolledCount && (
                          <>
                            <span>•</span>
                            <span>{cat.enrolledCount} এনরোল্ড</span>
                          </>
                        )}
                      </div>

                      <h3 className={`font-bold mb-1.5 line-clamp-2 transition-colors text-base leading-snug ${
                        isDark ? 'text-white group-hover:text-gray-200' : 'text-[#111827] group-hover:text-[#dc2626]'
                      }`}>
                        {cat.title}
                      </h3>
                      <p className={`text-xs mb-3 line-clamp-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#4b5563]'}`}>
                        {cat.subtitle || cat.badge}
                      </p>

                      <div className={`mt-auto flex items-end justify-between gap-2 pt-3 border-t ${
                        isDark ? 'border-white/[0.08]' : 'border-gray-100'
                      }`}>
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
                                ৳{cat.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateExams && onNavigateExams(cat.key);
                          }}
                          className={`text-sm sm:text-base font-bold ${
                            isDark 
                              ? 'text-white hover:text-gray-300' 
                              : 'text-[#dc2626] hover:text-[#b91c1c]'
                          } bg-transparent border-none p-0 cursor-pointer inline-flex items-center gap-1 transition-colors shrink-0 leading-none group/btn`}
                        >
                          <span className="leading-none">বিস্তারিত</span>
                          <svg 
                            className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current transition-transform duration-200 group-hover/btn:translate-x-0.5 shrink-0" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.8" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
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
              )
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => handleCourseClick(c.id || c.slug)}
                  className={`rounded-2xl overflow-hidden flex flex-col group cursor-pointer transition-all ${
                    isDark 
                      ? 'bg-[#140306] shadow-[0_12px_35px_rgba(0,0,0,0.7)] border border-[#e11438]/20 hover:border-[#e11438]/45 hover:shadow-[0_16px_40px_rgba(225,20,56,0.12)] text-white' 
                      : 'bg-white shadow-sm border border-[#e5e7eb] hover:shadow-xl hover:border-red-200 text-[#111827]'
                  } ${c.isBundle && isDark ? 'border-[#e11438]/40' : ''}`}
                >
                  {/* Thumbnail */}
                  <div className={`aspect-video overflow-hidden relative ${isDark ? 'bg-black/60' : 'bg-gray-100'}`}>
                    <img 
                      src={c.image} 
                      alt={c.title} 
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                    {c.isBundle && (
                      <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        isDark ? 'bg-black/75 text-white/90 border border-white/15 backdrop-blur-xs' : 'bg-[#dc2626] text-white shadow-sm'
                      }`}>
                        Bundle
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className={`font-bold mb-1 line-clamp-1 transition-colors text-base ${
                      isDark ? 'text-white group-hover:text-gray-200' : 'text-[#111827] group-hover:text-[#dc2626]'
                    }`}>
                      {c.title}
                    </h3>
                    <p className={`text-xs mb-3 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-[#4b5563]'}`}>
                      {c.description}
                    </p>

                    <div className={`mt-auto flex items-end justify-between gap-2 pt-3 border-t ${
                      isDark ? 'border-white/[0.08]' : 'border-gray-100'
                    }`}>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                          কোর্সের মূল্য
                        </p>
                        <div className="flex items-center gap-2">
                          {c.isFree ? (
                            <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-emerald-600'}`}>FREE</span>
                          ) : (
                            <>
                              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-[#dc2626]'}`}>
                                ৳ {c.salePrice || c.price}
                              </span>
                              {c.regularPrice && (
                                <span className="text-xs sm:text-sm text-gray-400 line-through font-medium">৳{c.regularPrice}</span>
                              )}
                              {c.regularPrice && calcDiscount(c.regularPrice, c.salePrice || c.price) > 0 && (
                                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#dc2626] text-white shadow-xs shrink-0 whitespace-nowrap">
                                  ৳ {calcDiscount(c.regularPrice, c.salePrice || c.price)} ছাড়
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCourseClick(c.id || c.slug || c.key);
                        }}
                        className={`text-sm sm:text-base font-bold ${
                          isDark 
                            ? 'text-white hover:text-gray-300' 
                            : 'text-[#dc2626] hover:text-[#b91c1c]'
                        } bg-transparent border-none p-0 cursor-pointer inline-flex items-center gap-1 transition-colors shrink-0 leading-none group/btn`}
                      >
                        <span className="leading-none">বিস্তারিত</span>
                        <svg 
                          className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-current transition-transform duration-200 group-hover/btn:translate-x-0.5 shrink-0" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.8" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`col-span-full py-16 px-6 text-center rounded-3xl border shadow-xl ${
                isDark ? 'bg-[#120407]/90 border-[#e11438]/25' : 'bg-white border-gray-200'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${
                  isDark ? 'bg-[#2a060e] text-[#ff3b61] border-[#e11438]/30' : 'bg-red-50 text-[#dc2626] border-red-100'
                }`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#111827]'}`}>কোনো ডেমো কোর্স প্রদর্শিত হচ্ছে না</h3>
                <p className={`text-sm max-w-md mx-auto mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#4b5563]'}`}>
                  আমাদের ৯৭০+ ক্যাটাগরাইজড লাইভ ও প্র্যাকটিস এক্সাম হাবে প্রবেশ করে আপনার সেরা প্রস্তুতি নিন।
                </p>
                <button
                  onClick={onNavigateExams}
                  className={`px-6 py-3 text-white font-bold rounded-xl transition-all cursor-pointer border-none ${
                    isDark 
                      ? 'bg-gradient-to-r from-[#e11438] to-[#9b0e27] shadow-[0_6px_20px_rgba(225,20,56,0.4)] hover:brightness-110' 
                      : 'bg-[#dc2626] hover:bg-[#b91c1c] shadow-md'
                  }`}
                >
                  🚀 এক্সাম হাবে প্রবেশ করুন (970+ Exams)
                </button>
              </div>
            )}
          </div>
        </section>

        {/* INSTRUCTOR / FACULTY SECTION */}
        {/* INSTRUCTOR / FACULTY SECTION */}
        {instructors && instructors.length > 0 && (
          <section id="instructor-section" className={`py-16 overflow-hidden transition-colors duration-300 ${
            isDark ? 'bg-[#0a0a0a]' : 'bg-white'
          }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              {/* Header Banner */}
              <div className="eh-band relative overflow-hidden rounded-2xl mb-10">
                <div className="px-6 py-7 md:px-8 md:py-9 relative z-10 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    {st.facultyBadge && st.facultyBadge !== "আমার পরিচয়" && st.facultyBadge !== "আমার পরিচয়" && (
                      <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-white opacity-80 mb-1">
                        {st.facultyBadge}
                      </span>
                    )}
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
                      {st.facultyTitle === "Meet Our Expert Faculty" ? "Meet Our Team" : (st.facultyTitle || "Meet Our Team")}
                    </h2>
                  </div>
                  <div className="shrink-0">
                    <button 
                      onClick={onNavigateAbout}
                      className="eh-btn-inverse text-sm inline-flex items-center gap-1.5 border-none cursor-pointer"
                    >
                      {st.facultyBtnText || "View all"}
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Horizontal Track Cards */}
              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
                {instructors.map((inst, idx) => (
                  <div 
                    key={inst.id || `${inst.name}-${idx}`}
                    className={`flex-shrink-0 w-60 sm:w-64 rounded-2xl overflow-hidden transition-all duration-300 group cursor-pointer ${
                      isDark 
                        ? 'bg-[#140307]/90 border border-[#e11438]/20 hover:border-[#e11438]/60 shadow-[0_8px_30px_rgba(0,0,0,0.5)]' 
                        : 'bg-white border border-[#e5e7eb] hover:shadow-xl shadow-sm'
                    }`}
                  >
                    <div className={`relative aspect-[3/4] overflow-hidden ${isDark ? 'bg-[#0c0205]' : 'bg-gray-100'}`}>
                      <img 
                        src={inst.image} 
                        alt={inst.name} 
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#140307] via-transparent to-transparent' : 'from-black/40 via-transparent to-transparent'}`}></div>
                      {inst.badge && inst.badge.trim() !== '' && (
                        <div className="absolute top-4 left-3 flex flex-col items-center">
                          <span className={`font-black uppercase tracking-[0.22em] text-[10px] [writing-mode:vertical-rl] select-none ${
                            isDark ? 'text-[#ff6b8b]' : 'text-white'
                          }`}>
                            {inst.badge}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {inst.designation && inst.designation.trim() !== '' && (
                        <div className="mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-[0.15em] truncate block ${
                            isDark ? 'text-[#ff6b8b]' : 'text-[#dc2626]'
                          }`}>
                            {inst.designation}
                          </span>
                        </div>
                      )}
                      <h3 className={`text-base font-black leading-tight mb-1 ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                        {inst.name}
                      </h3>
                      <p className={`text-xs line-clamp-2 leading-relaxed whitespace-pre-line ${
                        isDark ? 'text-gray-300' : 'text-[#4b5563]'
                      }`}>
                        {inst.bio}
                      </p>
                      {inst.yt && (
                        <a 
                          href={inst.yt} 
                          target="_blank" 
                          rel="noreferrer" 
                          className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                            isDark ? 'text-[#ff6b8b] hover:text-white' : 'text-[#dc2626] hover:text-red-700'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path></svg>
                          YouTube
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>
        )}

        {/* FREE YOUTUBE VIDEO LESSONS */}
        <section id="free-resource-section" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="eh-band relative overflow-hidden rounded-2xl mb-14">
            <div className="px-6 py-7 md:px-8 md:py-9 flex-col text-center justify-center relative z-10 flex flex-wrap items-center gap-3">
              <div className="min-w-0">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  {st.videosTitle1 || "প্লে করে দেখো"} <br/>
                  <span className="inline-block mt-1">{st.videosTitle2 || "আমার সেরা কিছু ভিডিও"}</span>
                </h2>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {processedVideos.map((vid) => {
              const containerId = `video-container-${vid.id}`;

              return (
                <div 
                  key={vid.id}
                  id={`video-card-${vid.id}`}
                  className={`text-left rounded-2xl overflow-hidden transition-all duration-300 ${
                    isDark 
                      ? 'border border-[#e11438]/20 hover:border-[#e11438]/60 hover:shadow-[0_12px_40px_rgba(225,20,56,0.25)] bg-[#120407]/90' 
                      : 'border border-[#e5e7eb] hover:shadow-xl shadow-sm bg-white'
                  }`}
                >
                  {/* 16:9 Video Canvas with instant thumbnail backdrop & native YouTube player */}
                  <div 
                    id={containerId}
                    className="relative w-full aspect-video rounded-t-2xl overflow-hidden bg-slate-950"
                    style={{ 
                      backgroundImage: `url(https://img.youtube.com/vi/${vid.cleanId}/hqdefault.jpg)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transform: 'translateZ(0)' 
                    }}
                  >
                    <iframe 
                      src={`https://www.youtube.com/embed/${vid.cleanId}?rel=0&playsinline=1&cc_load_policy=0&iv_load_policy=3`} 
                      title={vid.title} 
                      className="absolute inset-0 w-full h-full border-0 rounded-t-2xl" 
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen 
                      loading="lazy"
                    />
                  </div>

                  {/* Card Info */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg className={`w-3.5 h-3.5 ${isDark ? 'text-[#ff3b61]' : 'text-[#dc2626]'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                      </svg>
                      <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${isDark ? 'text-[#ff3b61]' : 'text-[#dc2626]'}`}>
                        ফ্রি কন্টেন্ট
                      </span>
                    </div>
                    <h3 className={`text-sm sm:text-base font-bold transition-colors line-clamp-2 ${
                      isDark ? 'text-white' : 'text-[#111827]'
                    }`}>
                      {vid.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <button 
              onClick={() => {
                const firstVid = processedVideos[0];
                if (firstVid) {
                  const el = document.getElementById(`video-card-${firstVid.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isDark 
                  ? 'border border-[#e11438]/40 text-gray-200 hover:bg-[#e11438] hover:text-white bg-[#140307]/60 shadow-[0_4px_16px_rgba(0,0,0,0.5)]' 
                  : 'border border-gray-300 text-[#111827] hover:bg-[#dc2626] hover:text-white hover:border-[#dc2626] bg-white shadow-sm'
              }`}
            >
              {st.videosBtnText || "View All Free Videos"}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
          </div>
        </section>





        {/* CONTACT / COMMUNITY SECTION */}
        <section id="contact-section" className={`py-24 border-t transition-colors duration-300 relative overflow-hidden ${
          isDark 
            ? 'bg-gradient-to-b from-[#0a0204] via-[#120306] to-[#0a0204] border-[#e11438]/20 text-white' 
            : 'bg-white border-gray-100 text-[#111827]'
        }`}>
          {isDark && <div className="grain-overlay absolute inset-0 pointer-events-none opacity-30"></div>}
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="space-y-6">
                <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] ${
                  isDark ? 'text-white' : 'text-[#111827]'
                }`}>
                  {st.contactTitle || "আমাদের সাথে যোগাযোগ করো"}
                </h2>
                <p className={`text-sm md:text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-[#4b5563]'}`}>
                  {st.contactDesc || "যেকোনো কোর্স এনরোলমেন্ট বা একাডেমিক সহায়তায় আমাদের ফেসবুক পেজ এবং স্টাডি কমিউনিটিতে যুক্ত থাকুন।"}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <a 
                  href={st.contactPageUrl || (siteSettings.facebookPage && siteSettings.facebookPage !== 'https://facebook.com' ? siteSettings.facebookPage : "https://www.facebook.com/profile.php?id=61585769408167")} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`group flex items-center justify-between gap-4 px-6 py-5 text-white rounded-2xl transition-all duration-200 relative overflow-hidden ${
                    isDark 
                      ? 'bg-gradient-to-r from-[#e11438] to-[#9b0e27] shadow-[0_8px_30px_rgba(225,20,56,0.35)] hover:brightness-110' 
                      : 'bg-[#dc2626] hover:bg-[#b91c1c] shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{st.contactPageTitle || "পেজে মেসেজ করো"}</p>
                      <p className="text-xs text-white/80 mt-0.5">{st.contactPageSub || "Reach out on our page"}</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  <span className="btn-shine"></span>
                </a>

                {/* YouTube Channel Card */}
                <a 
                  href={siteSettings.youtubeChannel && siteSettings.youtubeChannel !== 'https://youtube.com/@eduhunters' && siteSettings.youtubeChannel !== 'https://www.youtube.com' ? siteSettings.youtubeChannel : "https://www.youtube.com/channel/UC1XpmoV-Phk1q1N5D2PTd0g"} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`group flex items-center justify-between gap-4 px-6 py-5 rounded-2xl transition-all duration-200 ${
                    isDark 
                      ? 'border border-[#e11438]/30 bg-[#140307]/80 hover:bg-[#1f050d] hover:border-[#e11438]/60 shadow-[0_8px_30px_rgba(0,0,0,0.4)] text-white' 
                      : 'border border-gray-200 bg-[#F8F9FA] hover:bg-gray-100 text-[#111827]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isDark ? 'bg-[#28050e] border-[#e11438]/30 text-[#ff3b61]' : 'bg-red-50 border-red-100 text-[#dc2626]'
                    }`}>
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path></svg>
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#111827]'}`}>আমাদের ইউটিউব চ্যানেল</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-[#4b5563]'}`}>ফ্রি ক্লাস ও গুরুত্বপূর্ণ গাইডলাইন ভিডিও</p>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 group-hover:translate-x-1 transition-all duration-200 shrink-0 ${
                    isDark ? 'text-[#e11438]/60 group-hover:text-white' : 'text-gray-400 group-hover:text-[#dc2626]'
                  }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </a>

                <a 
                  href={st.contactCommunityUrl || siteSettings.communityGroup || "https://www.facebook.com"} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`group flex items-center justify-between gap-4 px-6 py-5 rounded-2xl transition-all duration-200 ${
                    isDark 
                      ? 'border border-[#e11438]/30 bg-[#140307]/80 hover:bg-[#1f050d] hover:border-[#e11438]/60 shadow-[0_8px_30px_rgba(0,0,0,0.4)] text-white' 
                      : 'border border-gray-200 bg-[#F8F9FA] hover:bg-gray-100 text-[#111827]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isDark ? 'bg-[#28050e] border-[#e11438]/30 text-[#ff3b61]' : 'bg-red-50 border-red-100 text-[#dc2626]'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#111827]'}`}>{st.contactCommunityTitle || "আমাদের কমিউনিটি তে যুক্ত হও"}</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-[#4b5563]'}`}>{st.contactCommunitySub || "Connect with other learners"}</p>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 group-hover:translate-x-1 transition-all duration-200 shrink-0 ${
                    isDark ? 'text-[#e11438]/60 group-hover:text-white' : 'text-gray-400 group-hover:text-[#dc2626]'
                  }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </a>

                {/* WhatsApp Support Card */}
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`group flex items-center justify-between gap-4 px-6 py-5 rounded-2xl transition-all duration-200 ${
                    isDark 
                      ? 'border border-emerald-500/30 bg-[#06180f]/80 hover:bg-[#0b2417] hover:border-emerald-500/60 shadow-[0_8px_30px_rgba(0,0,0,0.4)] text-white' 
                      : 'border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-[#111827]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isDark ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-600'
                    }`}>
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#111827]'}`}>WhatsApp এ সরাসরি মেসেজ করো</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-emerald-400/90' : 'text-emerald-700 font-medium'}`}>{rawWaNumber} (Instant Support)</p>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 group-hover:translate-x-1 transition-all duration-200 shrink-0 ${
                    isDark ? 'text-emerald-400 group-hover:text-white' : 'text-emerald-600 group-hover:text-emerald-800'
                  }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className={`text-white transition-colors duration-300 ${
        isDark 
          ? 'bg-[#0f0205] border-t border-[#e11438]/25' 
          : 'bg-[#dc2626]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <div className={`inline-flex items-center gap-3 rounded-full pl-1.5 pr-4 py-1.5 mb-6 ${
                  isDark 
                    ? 'bg-white/5 border border-white/10' 
                    : 'bg-white/10 border border-white/15'
                }`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                    <img 
                      src={siteSettings.logoUrl || "/logo-crimson.png"} 
                      alt="EduHunters" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <span className="text-sm font-black tracking-tight text-white">
                    EduHunters
                  </span>
                </div>
                <p className={`text-xs max-w-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-white/90'}`}>
                  Empowering ambitious students with top-tier educators, smart exams, and comprehensive admission preparation.
                </p>
              </div>

              <div className="flex gap-2">
                <a 
                  href={siteSettings.facebookPage && siteSettings.facebookPage !== 'https://facebook.com' ? siteSettings.facebookPage : "https://www.facebook.com/profile.php?id=61585769408167"} 
                  target="_blank" 
                  rel="noreferrer" 
                  aria-label="Edu Hunters Facebook"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isDark 
                      ? 'text-gray-300 border-white/15 bg-white/5 hover:border-white/30 hover:text-white hover:bg-white/10' 
                      : 'text-white border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/20'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
                </a>
                <a 
                  href={siteSettings.youtubeChannel && siteSettings.youtubeChannel !== 'https://youtube.com/@eduhunters' && siteSettings.youtubeChannel !== 'https://www.youtube.com' ? siteSettings.youtubeChannel : "https://www.youtube.com/channel/UC1XpmoV-Phk1q1N5D2PTd0g"} 
                  target="_blank" 
                  rel="noreferrer" 
                  aria-label="Edu Hunters YouTube"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isDark 
                      ? 'text-gray-300 border-white/15 bg-white/5 hover:border-white/30 hover:text-white hover:bg-white/10' 
                      : 'text-white border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/20'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path></svg>
                </a>
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  aria-label="Edu Hunters WhatsApp"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isDark 
                      ? 'text-gray-300 border-white/15 bg-white/5 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-white/10' 
                      : 'text-white border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/20'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-[0.18em] mb-4 ${isDark ? 'text-gray-200' : 'text-white'}`}>
                  QUICK LINKS
                </p>
                <ul className={`space-y-2.5 text-xs ${isDark ? 'text-gray-300' : 'text-white/90'}`}>
                  <li><button onClick={onNavigateCourse} className="hover:text-white bg-transparent border-none p-0 cursor-pointer text-inherit transition-colors">All Courses</button></li>
                  <li><button onClick={onNavigateExams} className="hover:text-white bg-transparent border-none p-0 cursor-pointer text-inherit transition-colors">Live & Practice Exams</button></li>
                  <li><button onClick={onNavigateStore} className="hover:text-white bg-transparent border-none p-0 cursor-pointer text-inherit transition-colors">Book & Resource Store</button></li>
                  <li><button onClick={onNavigateAbout} className="hover:text-white bg-transparent border-none p-0 cursor-pointer text-inherit transition-colors">Instructors & Mentors</button></li>
                </ul>
              </div>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-[0.18em] mb-4 ${isDark ? 'text-gray-200' : 'text-white'}`}>
                  LEGAL & POLICIES
                </p>
                <ul className={`space-y-2.5 text-xs ${isDark ? 'text-gray-300' : 'text-white/90'}`}>
                  <li><button onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')} className="hover:text-white bg-transparent border-none p-0 cursor-pointer text-inherit transition-colors">Terms & Conditions</button></li>
                  <li><button onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')} className="hover:text-white bg-transparent border-none p-0 cursor-pointer text-inherit transition-colors">Refund Policy</button></li>
                  <li><button onClick={() => onNavigatePolicies ? onNavigatePolicies('privacy') : (window.location.href = '/privacy-policy')} className="hover:text-white bg-transparent border-none p-0 cursor-pointer text-inherit transition-colors">Privacy Policy</button></li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`border-t ${isDark ? 'border-white/10' : 'border-white/20'} mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs ${isDark ? 'text-gray-400' : 'text-white/85'} gap-3`}>
            <p>© 2026 Edu Hunters. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigatePolicies ? onNavigatePolicies('privacy') : (window.location.href = '/privacy-policy')}
                className="hover:underline hover:text-white bg-transparent border-none p-0 text-inherit cursor-pointer text-xs"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')}
                className="hover:underline hover:text-white bg-transparent border-none p-0 text-inherit cursor-pointer text-xs"
              >
                Terms of Use
              </button>
              <button 
                onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')}
                className="hover:underline hover:text-white bg-transparent border-none p-0 text-inherit cursor-pointer text-xs"
              >
                Refund Policy
              </button>
              <button 
                onClick={onOpenAdmin} 
                className={`transition-colors bg-transparent border-none text-xs cursor-pointer ${
                  isDark ? 'text-white/30 hover:text-white' : 'text-white/70 hover:text-white'
                }`}
                title="Admin Portal"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </footer>



      {/* BUNDLE DETAIL MODAL */}
      {selectedBundleForDetails && (
        <BundleDetailModal
          isOpen={!!selectedBundleForDetails}
          bundle={selectedBundleForDetails}
          courses={homeCourses}
          onClose={() => setSelectedBundleForDetails(null)}
          onEnroll={(bundle) => {
            setSelectedBundleForDetails(null);
            if (!currentUser) {
              if (onLoginClick) {
                onLoginClick(() => {
                  setSelectedCourseForCheckout(bundle);
                  setShowCheckout(true);
                });
              }
              return;
            }
            setSelectedCourseForCheckout(bundle);
            setShowCheckout(true);
          }}
          onNavigateCourse={onNavigateCourse}
        />
      )}

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <CheckoutModal 
          course={selectedCourseForCheckout || homeCoursesData[5]} 
          bundle={selectedCourseForCheckout}
          siteSettings={siteSettings}
          onSuccess={(trxData) => {
            if (onEnrollSuccess) onEnrollSuccess(trxData);
          }}
          onClose={() => setShowCheckout(false)} 
        />
      )}
    </div>
  );
}

