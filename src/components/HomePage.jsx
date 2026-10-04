import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
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
import Navbar from './Navbar';
import { initialData, isZenithCopiedCourse } from '../data/mockData';
import { EXAM_CATEGORIES_METADATA } from '../data/examCategoriesData';
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

export default function HomePage({ 
  data = {},
  onNavigateCourse, 
  onNavigateExams, 
  onNavigateStore, 
  onNavigateAbout, 
  onNavigateDevices,
  onNavigateOrders,
  onOpenAdmin, 
  onLoginClick,
  onEnrollSuccess
}) {
  const { isDark } = useTheme();
  const heroSlides = data.heroSlides || heroSlidesData;
  const homeStats = data.homeStats || homeStatsData;
  const homeCourses = data.courses || homeCoursesData;
  const instructors = data.instructors || instructorsData;
  const rawFreeVideos = data.freeVideos || freeVideosData;
  const whyChooseUs = data.whyChooseUs || whyChooseUsData;
  const REMOVED_CATEGORIES = ["HSC 25", "Engineering", "HSC 27", "HSC 28", "HSC 26"];
  const rawCategories = (Array.isArray(data.categories) && data.categories.length > 0) ? data.categories : categoriesList;
  const categories = rawCategories
    .filter(c => !REMOVED_CATEGORIES.includes(c))
    .map(c => c === "University A Unit" ? "Free" : c);
  const siteSettings = { ...initialData.siteSettings, ...(data.siteSettings || {}) };
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

  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("সকল");
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState(null);
  const [activePlayingId, setActivePlayingId] = useState(null);


  // If selected category was deleted or renamed in admin, reset safely to 'সকল'
  useEffect(() => {
    if (selectedCategory !== "সকল" && !categories.includes(selectedCategory)) {
      setSelectedCategory("সকল");
    }
  }, [categories, selectedCategory]);

  // Auto slide
  useEffect(() => {
    if (!heroSlides.length) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () => {
    if (!heroSlides.length) return;
    setCurrentSlide(prev => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    if (!heroSlides.length) return;
    setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const isExamBatch = selectedCategory === "EXAM BATCH" || selectedCategory.toLowerCase() === "exam batch";

  const filteredCourses = homeCourses
    .filter(course => !isZenithCopiedCourse(course))
    .filter(course => {
      if (selectedCategory === "সকল") return true;
      if (selectedCategory.toLowerCase() === "free") {
        return (course.category || "").toLowerCase() === "free" || course.isFree;
      }
      return course.category === selectedCategory;
    });

  const handleCourseClick = (slug) => {
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
    setSelectedCourseForCheckout(course);
    setShowCheckout(true);
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
        onNavigateCourse={onNavigateCourse}
        onNavigateExams={onNavigateExams}
        onNavigateStore={onNavigateStore}
        onNavigateAbout={onNavigateAbout}
        onNavigateDevices={onNavigateDevices}
        onNavigateOrders={onNavigateOrders}
        onOpenAdmin={onOpenAdmin}
        onLoginClick={onLoginClick}
      />

      {/* Main Container with 72px clearance */}
      <main className="pt-16 md:pt-20">
        
        {/* HERO CAROUSEL SECTION */}
        <section className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 pt-3 md:pt-6 mb-8 md:mb-12">
          {/* Banner Carousel Container */}
          <div className={`relative overflow-hidden rounded-2xl md:rounded-3xl aspect-[16/9] transition-all duration-300 ${
            isDark 
              ? 'shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-[#e11438]/20 bg-[#0c0205]' 
              : 'shadow-md border border-gray-200 bg-white'
          }`}>
            <div 
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${currentSlide * 100}%)`
              }}
            >
              {heroSlides.map((slide, idx) => (
                <div 
                  key={slide.id || idx}
                  onClick={() => {
                    if (slide.link?.includes('biology')) onNavigateCourse();
                    else if (slide.link?.includes('exam')) onNavigateExams();
                    else if (slide.link?.includes('store')) onNavigateStore();
                    else if (slide.link?.includes('about')) onNavigateAbout();
                    else onNavigateCourse();
                  }}
                  className="w-full h-full shrink-0 relative cursor-pointer group"
                >
                  <img 
                    src={slide.image} 
                    alt={slide.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02] block"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="text-white font-bold text-sm sm:text-base drop-shadow-md">
                      {slide.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-2 mt-4">
            {heroSlides.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 border-none cursor-pointer ${
                  idx === currentSlide 
                    ? (isDark ? 'w-7 bg-[#e11438] shadow-[0_0_12px_rgba(225,20,56,0.6)]' : 'w-7 bg-[#dc2626]') 
                    : (isDark ? 'w-2 bg-white/20 hover:bg-white/40' : 'w-2 bg-gray-300 hover:bg-gray-400')
                }`}
              />
            ))}
          </div>
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
                    <p className={`text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none ${
                      isDark 
                        ? 'text-transparent bg-clip-text bg-gradient-to-b from-white via-[#fff0f3] to-[#ffccd5] drop-shadow-[0_4px_16px_rgba(225,20,56,0.35)]' 
                        : 'text-white drop-shadow-md'
                    }`}>
                      {stat.value}
                    </p>
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
            {categories.map((cat, idx) => (
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
                {cat}
              </button>
            ))}
          </div>

          {/* Course Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isExamBatch ? (
              EXAM_CATEGORIES_METADATA.map((cat) => (
                <div 
                  key={cat.key}
                  onClick={() => onNavigateExams && onNavigateExams(cat.key)}
                  className={`rounded-2xl overflow-hidden flex flex-col group cursor-pointer transition-all ${
                    isDark 
                      ? 'bg-[#111317] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/[0.08] hover:border-white/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.7)] text-white' 
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
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 mb-0.5 ${
                          isDark 
                            ? 'bg-white/[0.08] text-white border-white/15 hover:bg-white/[0.14] hover:border-white/30' 
                            : 'bg-red-50 text-[#dc2626] border-red-200 hover:bg-[#dc2626] hover:text-white'
                        }`}
                      >
                        বিস্তারিত →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => handleCourseClick(c.id || c.slug)}
                  className={`rounded-2xl overflow-hidden flex flex-col group cursor-pointer transition-all ${
                    isDark 
                      ? 'bg-[#111317] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/[0.08] hover:border-white/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.7)] text-white' 
                      : 'bg-white shadow-sm border border-[#e5e7eb] hover:shadow-xl hover:border-red-200 text-[#111827]'
                  } ${c.isBundle && isDark ? 'border-white/20' : ''}`}
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
                            <span className="text-xl sm:text-2xl font-black text-emerald-400">FREE</span>
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
                        onClick={(e) => handleEnrollClick(c, e)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 mb-0.5 ${
                          isDark 
                            ? 'bg-white/[0.08] text-white border-white/15 hover:bg-white/[0.14] hover:border-white/30' 
                            : 'bg-red-50 text-[#dc2626] border-red-200 hover:bg-[#dc2626] hover:text-white'
                        }`}
                      >
                        বিস্তারিত →
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
        <section id="instructor-section" className={`py-16 overflow-hidden transition-colors duration-300 ${
          isDark ? 'bg-[#0a0a0a]' : 'bg-white'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header Banner */}
            <div className="eh-band relative overflow-hidden rounded-2xl mb-10">
              <div className="px-6 py-7 md:px-8 md:py-9 relative z-10 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.22em] text-white opacity-80 mb-1">
                    {st.facultyBadge || "আমার পরিচয়"}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
                    {st.facultyTitle || "Meet Our Expert Faculty"}
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
              {instructors.map((inst) => (
                <div 
                  key={inst.id}
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
                    <div className="absolute top-4 left-3 flex flex-col items-center">
                      <span className={`font-black uppercase tracking-[0.22em] text-[10px] [writing-mode:vertical-rl] select-none ${
                        isDark ? 'text-[#ff6b8b]' : 'text-white'
                      }`}>
                        {inst.badge}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg className="w-3 h-3 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 14.5a1 1 0 110-2 1 1 0 010 2zm1-5a1 1 0 11-2 0V7a1 1 0 112 0v4.5z"></path></svg>
                      <span className={`text-[10px] font-bold uppercase tracking-[0.15em] truncate ${
                        isDark ? 'text-[#ff6b8b]/80' : 'text-gray-500'
                      }`}>
                        {inst.designation}
                      </span>
                    </div>
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

        {/* FREE YOUTUBE VIDEO LESSONS */}
        <section id="free-resource-section" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="eh-band relative overflow-hidden rounded-2xl mb-14">
            <div className="px-6 py-7 md:px-8 md:py-9 flex-col text-center justify-center relative z-10 flex flex-wrap items-center gap-3">
              <div className="min-w-0">
                <span className={`block text-[11px] font-bold uppercase tracking-[0.22em] mb-2 ${
                  isDark ? 'text-[#ff6b8b]' : 'text-white/80'
                }`}>
                  {st.videosBadge || "ইউটিউব কন্টেন্ট"}
                </span>
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
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
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

        {/* STUDENT REVIEWS / TESTIMONIALS */}
        <section className={`py-24 transition-colors duration-300 ${isDark ? '' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
            <div className="eh-band relative overflow-hidden rounded-2xl">
              <div className="px-6 py-7 md:px-8 md:py-9 flex-col text-center justify-center relative z-10 flex flex-wrap items-center gap-3">
                <div className="min-w-0">
                  <span className={`block text-[11px] font-bold uppercase tracking-[0.22em] mb-2 ${
                    isDark ? 'text-[#ff6b8b]' : 'text-white/80'
                  }`}>
                    {st.reviewsBadge || "সামাজিক মাধ্যমে পাওয়া রিভিউ"}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                    {st.reviewsTitle || "শিক্ষার্থীদের রিভিউ"}
                  </h2>
                </div>
              </div>
            </div>
          </div>
          
          <div className="ti-outer-mask">
            <div className="testimonial-img-track flex gap-5 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-52 sm:w-60">
                  <div className={`rounded-2xl overflow-hidden ti-card-tilt ${
                    isDark 
                      ? 'shadow-[0_6px_24px_rgba(0,0,0,0.5)] border border-[#e11438]/25 bg-[#120407]' 
                      : 'shadow-md border border-[#e5e7eb] bg-white'
                  }`}>
                    <img 
                      src="https://assets.codervai.com/testimonial-images/1781465623292-cropped-image.webp" 
                      alt="Student Review" 
                      className="w-full h-auto object-cover" 
                      loading="lazy" 
                    />
                  </div>
                </div>
              ))}
            </div>
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
                  href={st.contactPageUrl || siteSettings.facebookPage || "https://www.facebook.com"} 
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
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className={`eh-dots-light text-white transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-b from-[#180408] via-[#0d0205] to-[#050102] border-t border-[#e11438]/25' 
          : 'bg-[#dc2626]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 ${
                  isDark 
                    ? 'bg-[#140307] border border-[#e11438]/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]' 
                    : 'bg-white shadow-sm'
                }`}>
                  <img src={siteSettings.logoUrl || "/logo.png"} alt={siteSettings.siteName || "Edu Hunters"} className="h-8 w-auto max-w-32 object-contain" />
                  <span className={`text-base font-black ${isDark ? 'text-[#ff3b61]' : 'text-[#dc2626]'}`}>
                    {siteSettings.siteName || "EDU HUNTERS"}
                  </span>
                </div>
                <p className={`text-xs max-w-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-white/90'}`}>
                  {st.footerDesc || "দেশের সেরা শিক্ষকমন্ডলী ও মেন্টরদের তত্ত্বাবধানে তোমার স্বপ্নের প্রস্তুতি নিশ্চিত করো।"}
                </p>
              </div>

              <div className="flex gap-2">
                <a 
                  href={siteSettings.facebookPage || "https://www.facebook.com"} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-white ${
                    isDark 
                      ? 'border border-[#e11438]/30 bg-[#160307] hover:border-[#e11438] hover:bg-[#e11438]/20' 
                      : 'border border-white/20 bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
                </a>
                <a 
                  href={siteSettings.youtubeChannel || "https://www.youtube.com"} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-white ${
                    isDark 
                      ? 'border border-[#e11438]/30 bg-[#160307] hover:border-[#e11438] hover:bg-[#e11438]/20' 
                      : 'border border-white/20 bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path></svg>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${
                  isDark ? 'text-[#ff6b8b]' : 'text-white'
                }`}>দ্রুত লিঙ্ক</p>
                <ul className={`space-y-2 text-xs ${isDark ? 'text-gray-300' : 'text-white/80'}`}>
                  <li><button onClick={onNavigateCourse} className="hover:text-white bg-transparent border-none p-0 cursor-pointer">সকল কোর্সসমূহ</button></li>
                  <li><button onClick={onNavigateExams} className="hover:text-white bg-transparent border-none p-0 cursor-pointer">ফ্রি ও পেইড এক্সাম</button></li>
                  <li><button onClick={onNavigateStore} className="hover:text-white bg-transparent border-none p-0 cursor-pointer">বুক ও ম্যাটেরিয়াল স্টোর</button></li>
                  <li><button onClick={onNavigateAbout} className="hover:text-white bg-transparent border-none p-0 cursor-pointer">আমাদের শিক্ষক পরিচিতি</button></li>
                </ul>
              </div>
              <div className="col-span-1 md:col-span-2">
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${
                  isDark ? 'text-[#ff6b8b]' : 'text-white'
                }`}>আমাদের ব্যাচ সমূহ</p>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-white/80'}`}>
                  <span onClick={onNavigateCourse} className="hover:text-white cursor-pointer truncate">Mastering Text Book Biology</span>
                  <span onClick={onNavigateCourse} className="hover:text-white cursor-pointer truncate">Mastering Text Book Chemistry</span>
                  <span onClick={onNavigateCourse} className="hover:text-white cursor-pointer truncate">Medical Exam Batch</span>
                  <span onClick={onNavigateCourse} className="hover:text-white cursor-pointer truncate">Ketab Sir MCQ Solve Course</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`border-t mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs gap-3 ${
            isDark ? 'border-[#e11438]/20 text-gray-400' : 'border-white/20 text-white/80'
          }`}>
            <p>{st.footerCopyright || "© 2026 Edu Hunters. All rights reserved."}</p>
            <div className="flex items-center gap-4">
              <span>Privacy Policy</span>
              <span>Terms of Use</span>
              <span>Refund Policy</span>
              <button 
                onClick={onOpenAdmin} 
                className={`transition-colors bg-transparent border-none text-xs cursor-pointer ${
                  isDark ? 'text-white/30 hover:text-[#ff3b61]' : 'text-white/60 hover:text-white'
                }`}
                title="গোপন এডমিন প্যানেল প্রবেশদ্বার"
              >
                এডমিন প্যানেল
              </button>
            </div>
          </div>
        </div>
      </footer>



      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <CheckoutModal 
          course={selectedCourseForCheckout || homeCoursesData[5]} 
          siteSettings={siteSettings}
          onSuccess={onEnrollSuccess}
          onClose={() => setShowCheckout(false)} 
        />
      )}
    </div>
  );
}

