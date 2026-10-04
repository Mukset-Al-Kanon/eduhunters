import React, { useState } from 'react';
import Navbar from './Navbar';
import CheckoutModal from './CheckoutModal';
import { initialData, isZenithCopiedCourse } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { EXAM_CATEGORIES_METADATA } from '../data/examCategoriesData';

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

export default function CoursesPage({
  data = {},
  onNavigateHome,
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
  const siteSettings = data.siteSettings || initialData.siteSettings || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('সকল');
  const [selectedCourseForCheckout, setSelectedCourseForCheckout] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const REMOVED_CATEGORIES = ["HSC 25", "Engineering", "HSC 27", "HSC 28", "HSC 26"];
  const rawCategories = (data.categories && data.categories.length > 0) ? data.categories : [
    "সকল",
    "EXAM BATCH",
    "Medical",
    "Free"
  ];
  const categories = rawCategories
    .filter(c => !REMOVED_CATEGORIES.includes(c))
    .map(c => c === "University A Unit" ? "Free" : c);

  // Guarantee the courses are present and 100% free of Zenith Crew copied courses
  const rawCourses = (data.courses && data.courses.length > 0) 
    ? data.courses 
    : (initialData.courses || []);
  const courses = rawCourses.filter(c => !isZenithCopiedCourse(c));

  const isExamBatch = selectedCategory === 'EXAM BATCH' || selectedCategory.toLowerCase() === 'exam batch';

  const displayedExamBatches = EXAM_CATEGORIES_METADATA.filter(cat => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (cat.title || '').toLowerCase().includes(q) ||
           (cat.subtitle || '').toLowerCase().includes(q) ||
           (cat.badge || '').toLowerCase().includes(q);
  });

  // Filter courses by search query and category
  const filteredCourses = courses.filter(c => {
    const matchesCategory = selectedCategory === 'সকল' || 
      c.category === selectedCategory ||
      ((selectedCategory === 'Free' || selectedCategory === 'free') && ((c.category || '').toLowerCase() === 'free' || c.isFree));
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (c.title || '').toLowerCase().includes(q) || 
      (c.description || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleCourseClick = (courseId) => {
    if (onNavigateCourse) {
      onNavigateCourse(courseId);
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
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 selection:bg-[#e11438] selection:text-white ${
      isDark ? 'bg-transparent text-gray-100' : 'bg-white text-[#111827]'
    }`}>
      {/* Shared Sticky Navbar */}
      <Navbar 
        activePage="courses"
        siteSettings={siteSettings}
        onNavigateHome={onNavigateHome}
        onNavigateCourse={onNavigateCourse}
        onNavigateExams={onNavigateExams}
        onNavigateStore={onNavigateStore}
        onNavigateAbout={onNavigateAbout}
        onNavigateDevices={onNavigateDevices}
        onNavigateOrders={onNavigateOrders}
        onOpenAdmin={onOpenAdmin}
        onLoginClick={onLoginClick}
      />

      {/* Main Container with clearance */}
      <main className="pt-16 md:pt-20">
        
        {/* Course Hero Banner */}
        <div className={`eh-course-hero relative overflow-hidden shadow-lg transition-colors duration-300 ${
          isDark 
            ? 'bg-gradient-to-r from-[#3d0711] via-[#1f0309] to-[#0d0104] border-b border-[#e11438]/20' 
            : 'bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#991b1b] border-b border-red-700/20'
        }`}>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
            <div className="flex items-center justify-between gap-4">
              
              {/* Left Title & Subtitle */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.22em] leading-none mb-1 ${
                    isDark ? 'text-[#ff6b8b] opacity-90' : 'text-red-200'
                  }`}>
                    সকল কোর্স
                  </p>
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none truncate">
                    কোর্সসমূহ
                  </h1>
                </div>
                <span className={`hidden sm:block text-2xl font-light ${isDark ? 'text-[#e11438]/50' : 'text-white/40'}`}>|</span>
                <p className="hidden sm:block text-sm text-white/80 whitespace-nowrap">
                  তোমার জন্য সেরা কোর্সটি বেছে নাও
                </p>
              </div>

              {/* Right Search Input Box */}
              <div className="relative w-56 sm:w-72 shrink-0">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="কোর্স খুঁজুন..." 
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 ${
                    isDark 
                      ? 'bg-[#160408] border border-[#e11438]/30 text-white placeholder:text-gray-400 focus:ring-[#e11438]/40' 
                      : 'bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-red-400'
                  }`}
                />
                <svg className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#ff3b61]' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Catalog Body */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((cat, idx) => {
              const isSelected = selectedCategory === cat;
              return (
                <button 
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border cursor-pointer ${
                    isSelected 
                      ? (isDark 
                          ? 'bg-gradient-to-r from-[#e11438] to-[#9b0e27] text-white border-[#ff3358]/40 shadow-[0_4px_16px_rgba(225,20,56,0.35)]' 
                          : 'bg-[#dc2626] text-white border-[#dc2626] shadow-sm')
                      : (isDark 
                          ? 'bg-[#140307]/80 text-gray-300 border-[#e11438]/20 hover:border-[#e11438]/60 hover:text-white' 
                          : 'bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:text-red-600')
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Course Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {isExamBatch ? (
              displayedExamBatches.map((cat) => (
                <div 
                  key={cat.key}
                  onClick={() => onNavigateExams && onNavigateExams(cat.key)}
                  className={`rounded-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 flex flex-col group cursor-pointer border ${
                    isDark 
                      ? 'bg-[#111317] border-white/[0.08] hover:border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.7)]' 
                      : 'bg-white shadow-sm hover:shadow-xl border-gray-200 hover:border-red-300'
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

                    <h3 className={`font-bold mb-1 line-clamp-2 transition-colors text-base leading-snug ${
                      isDark ? 'text-white group-hover:text-gray-200' : 'text-[#111827] group-hover:text-[#dc2626]'
                    }`}>
                      {cat.title}
                    </h3>
                    <p className={`text-xs mb-3 line-clamp-2 leading-relaxed ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
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
                        className={`text-xs sm:text-sm font-bold bg-transparent border-none p-0 cursor-pointer inline-flex items-center gap-1 transition-colors shrink-0 mb-0.5 ${
                          isDark 
                            ? 'text-white hover:text-[#ff4d6d]' 
                            : 'text-[#dc2626] hover:text-red-700'
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
                  className={`rounded-2xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 flex flex-col group cursor-pointer border ${
                    isDark 
                      ? 'bg-[#111317] border-white/[0.08] hover:border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.7)]' 
                      : `bg-white shadow-sm hover:shadow-xl ${c.isBundle ? 'border-red-400 ring-2 ring-red-400/20' : 'border-gray-200 hover:border-red-300'}`
                  }`}
                >
                  {/* Thumbnail */}
                  <div className={`aspect-video overflow-hidden relative ${isDark ? 'bg-black/60' : 'bg-gray-100'}`}>
                    <img 
                      src={c.image} 
                      alt={c.title} 
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                    {c.isBundle && (
                      <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
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
                    <p className={`text-xs mb-3 line-clamp-2 leading-relaxed ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {c.description || c.tagline}
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
                        className={`text-xs sm:text-sm font-bold bg-transparent border-none p-0 cursor-pointer inline-flex items-center gap-1 transition-colors shrink-0 mb-0.5 ${
                          isDark 
                            ? 'text-white hover:text-[#ff4d6d]' 
                            : 'text-[#dc2626] hover:text-red-700'
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
                isDark ? 'bg-[#120407]/90 border-[#e11438]/25' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${
                  isDark ? 'bg-[#2a060e] text-[#ff3b61] border-[#e11438]/30' : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>এই ক্যাটাগরিতে কোনো কোর্স পাওয়া যায়নি</h3>
                <p className={`text-sm max-w-md mx-auto mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  অন্য কোনো ক্যাটাগরি বেছে নিন অথবা আমাদের ৯৭০+ লাইভ এক্সাম হাবে অংশগ্রহণ করুন।
                </p>
                <button
                  onClick={() => setSelectedCategory('সকল')}
                  className="px-5 py-2.5 bg-[#dc2626] text-white font-bold rounded-xl shadow hover:brightness-110 transition-all cursor-pointer border-none mr-3"
                >
                  সব কোর্স দেখুন
                </button>
                <button
                  onClick={onNavigateExams}
                  className={`px-5 py-2.5 border font-bold rounded-xl shadow transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-[#140307] border-[#e11438]/40 text-gray-200 hover:border-[#e11438] hover:text-white' 
                      : 'bg-white border-gray-300 text-gray-800 hover:border-red-500'
                  }`}
                >
                  🚀 এক্সাম হাব
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer (Hidden on mobile) */}
      <div className="hidden sm:block">
        {isDark ? (
          <footer className="mt-20 border-t border-[#e11438]/20 bg-gradient-to-b from-[#140307] to-[#070102] py-8 text-center text-xs text-gray-400">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-medium text-[#ff3b61] mb-1">EDU HUNTERS · Premier Edtech Learning Platform</p>
              <p>© 2026 Edu Hunters. All rights reserved.</p>
            </div>
          </footer>
        ) : (
          <footer className="mt-20 bg-[#dc2626] eh-dots-light text-white py-10 text-center text-xs">
            <div className="max-w-7xl mx-auto px-4">
              <div className="inline-flex items-center gap-2 mb-3 bg-white rounded-xl px-3 py-1.5 shadow-sm">
                <img src="/logo.png" alt="Edu Hunters" className="h-6 w-auto" />
                <span className="font-black text-sm text-[#dc2626]">EDU <span className="text-[#111827]">HUNTERS</span></span>
              </div>
              <p className="text-white/80">Academic to admission EDU HUNTERS with you.</p>
              <p className="text-white/60 mt-1">© 2026 Edu Hunters. All rights reserved.</p>
            </div>
          </footer>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal 
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          course={selectedCourseForCheckout || filteredCourses[0] || {}}
          onEnrollSuccess={onEnrollSuccess}
        />
      )}
    </div>
  );
}

