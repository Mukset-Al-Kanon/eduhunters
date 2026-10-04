import React, { useState, useEffect } from 'react';
import { 
  Clock, BookOpen, AlertCircle, 
  FileText, ChevronRight, User, ArrowRight, Play,
  CheckCircle2, Sparkles, HelpCircle, ShieldCheck, Award, Zap,
  ChevronDown, ChevronUp, Check
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ExamDetailPage({ 
  category, 
  onBack, 
  onStartExamCategory, 
  onPreviewExams, 
  onOpenEnrollModal, 
  isEnrolled = false 
}) {
  const { isDark } = useTheme();
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  // Scroll to top on mount or when category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category]);

  if (!category) return null;

  const toggleFaq = (idx) => {
    setOpenFaqIdx(prev => prev === idx ? null : idx);
  };

  const discountAmount = category.originalPrice && category.price 
    ? (parseInt(String(category.originalPrice).replace(/[^0-9]/g, '')) - parseInt(String(category.price).replace(/[^0-9]/g, '')))
    : 400;

  return (
    <div className={`min-h-screen pb-24 font-sans antialiased transition-colors duration-300 selection:bg-[#e11438] selection:text-white ${
      isDark ? 'bg-transparent text-gray-100' : 'bg-[#f8f9fa] text-[#111827]'
    }`}>
      
      {/* Breadcrumb / Back Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
        <button
          onClick={onBack}
          className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer bg-transparent border-none p-0 ${
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-[#dc2626]'
          }`}
        >
          <span>← সব এক্সাম ব্যাচে ফিরে যান</span>
        </button>
      </div>

      {/* Main Full-Width PC Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* 2-COLUMN BALANCED CONTENT (Card first on mobile: order-1) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* POSTER & ACTION CARD (Mobile: order-1, PC: order-2 sticky) */}
          <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className={`rounded-3xl overflow-hidden border transition-all ${
              isDark 
                ? 'bg-[#111317] border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md' 
                : 'bg-white border-gray-200 shadow-xl'
            }`}>
              {/* Poster Preview */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
                <img 
                  src={category.image} 
                  alt={category.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/sureshot_banner.jpg";
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Action Body */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* Course Title */}
                <h2 className={`text-base sm:text-lg font-bold leading-snug ${
                  isDark ? 'text-white' : 'text-[#111827]'
                }`}>
                  {category.title}
                </h2>

                {/* Enrolled Students Count & MCQ Count (Left) + "Free Trial" Button (Right) */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 min-w-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <User size={15} className="shrink-0 text-gray-500 dark:text-gray-400" />
                      <span>
                        {category.enrolledCount 
                          ? (category.enrolledCount.includes('জন') ? category.enrolledCount : `${category.enrolledCount.replace('+', '').trim()} জন`)
                          : '৩,৪৫০ জন'}
                      </span>
                    </div>

                    <span className="text-gray-300 dark:text-gray-600 font-normal">·</span>

                    <span className="truncate">
                      {category.questionCount ? (category.questionCount.includes('MCQ') ? category.questionCount : `${category.questionCount.replace(' প্রশ্ন', '')} MCQ`) : '১,৭০০+ MCQ'}
                    </span>
                  </div>

                  {/* "Free Trial" Button on Right with WHITE text and minimal styling */}
                  <button
                    onClick={() => onPreviewExams ? onPreviewExams(category.key) : onStartExamCategory(category.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border shrink-0 hover:scale-105 active:scale-95 shadow-xs text-white ${
                      isDark 
                        ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/15 hover:border-white/30 backdrop-blur-xs' 
                        : 'bg-red-50 hover:bg-red-100 text-[#dc2626] border-red-200 hover:border-red-300'
                    }`}
                    title="Free Trial"
                  >
                    <span>Free Trial</span>
                    <ArrowRight size={12} className="shrink-0 text-white" />
                  </button>
                </div>

                {/* Desktop Price & Action */}
                <div className="hidden sm:block pt-4 border-t border-gray-100 dark:border-white/[0.08] space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">
                        কোর্সের মূল্য
                      </p>
                      <div className="flex items-center gap-2.5">
                        {/* Price in Dark Theme is WHITE */}
                        <span className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-[#dc2626]'}`}>
                          ৳ {category.price || '৩৯৯'}
                        </span>
                        {category.originalPrice && (
                          <span className="text-sm text-gray-400 line-through font-medium">
                            ৳ {category.originalPrice || '৭৯৯'}
                          </span>
                        )}
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#dc2626] text-white shadow-xs">
                          ৳ {discountAmount > 0 ? discountAmount : 400} ছাড়
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (isEnrolled) {
                        onStartExamCategory(category.key);
                      } else {
                        onOpenEnrollModal ? onOpenEnrollModal(category) : onStartExamCategory(category.key);
                      }
                    }}
                    className={`w-full py-3.5 text-white text-base font-bold rounded-2xl shadow-lg transition-all duration-300 cursor-pointer border-none flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] ${
                      isEnrolled
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-600/30'
                        : 'bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:shadow-red-600/30'
                    }`}
                  >
                    {isEnrolled ? (
                      <>
                        <Play size={16} className="fill-current" />
                        <span>এক্সাম দিই</span>
                        <ChevronRight size={18} />
                      </>
                    ) : (
                      <>
                        <span>এনরোল করো</span>
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                </div>

                {/* Key Exam Specs (2x2 Grid) */}
                <div className="pt-3 border-t border-gray-100 dark:border-white/[0.08] grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-bold ${
                    isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}>
                    <BookOpen size={15} className="shrink-0 opacity-80" />
                    <span className="truncate">{category.examCountText}</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-bold ${
                    isDark ? 'bg-white/[0.04] border-white/[0.08] text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}>
                    <FileText size={15} className="shrink-0 opacity-80" />
                    <span className="truncate">{category.questionCount}</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-semibold ${
                    isDark ? 'bg-white/[0.04] border-white/[0.08] text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}>
                    <Clock size={15} className="shrink-0 opacity-80" />
                    <span className="truncate">{category.duration}</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-semibold ${
                    isDark ? 'bg-white/[0.04] border-white/[0.08] text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}>
                    <AlertCircle size={15} className="shrink-0 opacity-80" />
                    <span className="truncate">নেগেটিভ: {category.negativeMark}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* DETAILS COLUMN: Full-Width Content (order-2 on mobile, order-1 on desktop) */}
          <div className="order-2 lg:order-1 lg:col-span-7 xl:col-span-7 space-y-6">
            




            {/* Covered Subjects */}
            {category.details?.subjects && (
              <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                isDark 
                  ? 'bg-[#111317] border-white/[0.08] shadow-xl backdrop-blur-md' 
                  : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="mb-4">
                  <h2 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                    অন্তর্ভুক্ত বিষয়সমূহ
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {category.details.subjects.map((sub, idx) => (
                    <span 
                      key={idx}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold ${
                        isDark 
                          ? 'bg-white/[0.04] border-white/[0.08] text-gray-200' 
                          : 'bg-red-50/70 border-red-100 text-gray-800'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-[#dc2626] shrink-0"></span>
                      <span>{sub}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About / Description */}
            {category.details?.about && (
              <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                isDark 
                  ? 'bg-[#111317] border-white/[0.08] shadow-xl backdrop-blur-md' 
                  : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <h2 className={`text-lg sm:text-xl font-black tracking-tight mb-3 ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                  কোর্স সম্পর্কে বিস্তারিত
                </h2>
                <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {category.details.about}
                </p>
              </div>
            )}



          </div>

        </div>

      </div>

      {/* MOBILE STICKY BOTTOM ACTION BAR */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3 border-t backdrop-blur-md flex items-center justify-between gap-3 ${
        isDark ? 'bg-[#0d0205]/95 border-white/10' : 'bg-white/95 border-gray-200 shadow-lg'
      }`}>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-300">
            কোর্সের মূল্য
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {/* Price in Dark Theme is WHITE */}
            <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-[#dc2626]'}`}>
              ৳ {category.price || '৩৯৯'}
            </span>
            <span className="text-[11px] text-gray-400 line-through font-medium">
              ৳ {category.originalPrice || '৭৯৯'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#dc2626] text-white shadow-xs">
              ৳ {discountAmount > 0 ? discountAmount : 400} ছাড়
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            if (isEnrolled) {
              onStartExamCategory(category.key);
            } else {
              onOpenEnrollModal ? onOpenEnrollModal(category) : onStartExamCategory(category.key);
            }
          }}
          className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer border-none flex items-center gap-1.5 shrink-0 transition-all active:scale-95 ${
            isEnrolled
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
              : 'bg-gradient-to-r from-[#dc2626] to-[#b91c1c]'
          }`}
        >
          {isEnrolled ? (
            <>
              <Play size={13} className="fill-current" />
              <span>এক্সাম দিই</span>
            </>
          ) : (
            <>
              <span>এনরোল করো</span>
              <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>

    </div>
  );
}

