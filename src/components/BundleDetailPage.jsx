import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft,
  BookOpen, 
  Check, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  Clock, 
  Gift, 
  HelpCircle, 
  Layers, 
  Phone, 
  MessageCircle, 
  ShieldCheck, 
  ShoppingCart, 
  Sparkles, 
  Star, 
  Tag, 
  User,
  Users, 
  ArrowRight,
  ExternalLink,
  Zap,
  Award,
  FileText
} from 'lucide-react';
import Navbar from './Navbar';
import CheckoutModal from './CheckoutModal';
import { initialData } from '../data/mockData';
import { EXAM_CATEGORIES_METADATA, mapExamBatchToCourse } from '../data/examCategoriesData';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useEnrollmentStatus, grantCourseAccess } from '../utils/enrollmentService';

// Helper to convert Bengali / English number strings to valid JavaScript numbers
const parsePrice = (val, defaultVal = 0) => {
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  if (!val) return defaultVal;
  const str = String(val);
  const bnToEnMap = { '০':'0', '১':'1', '২':'2', '৩':'3', '৪':'4', '৫':'5', '৬':'6', '৭':'7', '৮':'8', '৯':'9' };
  const normalized = str.replace(/[০-৯]/g, d => bnToEnMap[d]).replace(/[^0-9.]/g, '');
  const num = parseFloat(normalized);
  return isNaN(num) ? defaultVal : num;
};

export default function BundleDetailPage({
  data = {},
  selectedBundleId,
  onNavigateHome,
  onNavigateCourse,
  onNavigateExams,
  onNavigateStore,
  onNavigateAbout,
  onNavigateDevices,
  onNavigateOrders,
  onNavigatePolicies,
  onOpenAdmin,
  onLoginClick,
  onEnrollSuccess
}) {
  const { isDark } = useTheme();
  const siteSettings = data.siteSettings || initialData.siteSettings || {};
  const [showCheckout, setShowCheckout] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  const handleOpenCheckout = () => {
    if (!currentUser) {
      if (onLoginClick) {
        onLoginClick(() => {
          setShowCheckout(true);
        });
      }
      return;
    }
    setShowCheckout(true);
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedBundleId]);

  // All bundles list
  const allBundles = useMemo(() => {
    return Array.isArray(data?.bundles)
      ? data.bundles
      : (initialData.bundles || []);
  }, [data?.bundles]);

  // Unified catalog map combining all regular courses and all exam batches
  const allCatalogMap = useMemo(() => {
    const rawCourses = (Array.isArray(data?.courses) && data.courses.length > 0)
      ? data.courses
      : (initialData.courses || []);

    const rawBatches = (Array.isArray(data?.examBatches) && data.examBatches.length > 0)
      ? data.examBatches
      : EXAM_CATEGORIES_METADATA;

    const mappedBatches = rawBatches.map(mapExamBatchToCourse);

    const map = new Map();
    // 1. Index standard courses
    rawCourses.forEach(c => {
      if (!c) return;
      if (c.id) map.set(c.id, c);
      if (c.slug) map.set(c.slug, c);
      if (c.key) map.set(c.key, c);
    });
    // 2. Index mapped exam batches (ensures exam batches like sureshot, medical, rtds, medilogy resolve with full metadata)
    mappedBatches.forEach(b => {
      if (!b) return;
      if (b.id && !map.has(b.id)) map.set(b.id, b);
      if (b.slug && !map.has(b.slug)) map.set(b.slug, b);
      if (b.key && !map.has(b.key)) map.set(b.key, b);
    });

    return map;
  }, [data?.courses, data?.examBatches]);

  // Resolve active bundle
  const bundle = useMemo(() => {
    if (!selectedBundleId) return allBundles[0] || null;
    const found = allBundles.find(b => b.id === selectedBundleId || b.slug === selectedBundleId);
    return found || null;
  }, [allBundles, selectedBundleId]);

  const { currentUser } = useAuth();
  const isBundleEnrolled = useEnrollmentStatus(bundle, currentUser, data);

  // Resolve included courses / batches
  const includedCourses = useMemo(() => {
    if (!bundle?.courseIds || !Array.isArray(bundle.courseIds)) return [];
    return bundle.courseIds.map(cId => {
      const found = allCatalogMap.get(cId);
      if (found) {
        const rawSale = found.salePrice !== undefined && found.salePrice !== null ? parsePrice(found.salePrice, null) : null;
        const rawReg = found.regularPrice !== undefined && found.regularPrice !== null ? parsePrice(found.regularPrice, null) : null;
        const rawPrice = found.price ? parsePrice(found.price, null) : null;
        const rawOrig = found.originalPrice ? parsePrice(found.originalPrice, null) : null;

        let sPrice = (rawSale && rawSale > 0) ? rawSale : ((rawPrice && rawPrice > 0) ? rawPrice : 399);
        let rPrice = (rawReg && rawReg > 0) ? rawReg : ((rawOrig && rawOrig > 0) ? rawOrig : 799);
        if (rPrice <= sPrice) {
          rPrice = Math.round(sPrice * 1.5) || 799;
        }

        return {
          ...found,
          salePrice: sPrice,
          regularPrice: rPrice
        };
      }
      return {
        id: cId,
        key: cId,
        title: cId,
        category: 'Academic',
        salePrice: 399,
        regularPrice: 799,
        image: '/master_english_30_days.png',
        description: 'এই কোর্সের পূর্ণ সিলেবাস, ক্লাস ও এক্সাম সিস্টেমে সম্পূর্ণ এক্সেস।'
      };
    });
  }, [bundle, allCatalogMap]);

  // 1. Standalone sum of individual courses if purchased separately
  const standaloneSaleSum = useMemo(() => {
    return includedCourses.reduce((acc, c) => acc + parsePrice(c.salePrice, 0), 0);
  }, [includedCourses]);

  const standaloneRegularSum = useMemo(() => {
    return includedCourses.reduce((acc, c) => acc + parsePrice(c.regularPrice, c.salePrice), 0);
  }, [includedCourses]);

  // 2. Bundle Sale Price
  const salePrice = useMemo(() => {
    return parsePrice(bundle?.salePrice, 0);
  }, [bundle?.salePrice]);

  // 3. Regular / Standalone Valuation (স্বতন্ত্র মোট মূল্য)
  // Consistently resolved across the whole page to guarantee zero pricing discrepancies
  const regPrice = useMemo(() => {
    const customReg = parsePrice(bundle?.regularPrice, 0);
    if (customReg > salePrice) {
      return customReg;
    }
    if (standaloneRegularSum > salePrice) {
      return standaloneRegularSum;
    }
    if (standaloneSaleSum > salePrice) {
      return standaloneSaleSum;
    }
    return Math.round(salePrice * 1.5);
  }, [bundle?.regularPrice, salePrice, standaloneRegularSum, standaloneSaleSum]);

  // 4. Dynamic Savings & Automatic Discount Count
  const savings = Math.max(0, regPrice - salePrice);
  const discountPercent = regPrice > 0 ? Math.round((savings / regPrice) * 100) : 0;

  // 5. Enrolled students count for bundle
  const bundleEnrolled = useMemo(() => {
    if (bundle?.enrolledCount) {
      const ec = String(bundle.enrolledCount).trim();
      if (ec.includes('জন') || ec.includes('শিক্ষার্থী')) return ec;
      return `${ec} জন`;
    }
    if (bundle?.studentsCount) {
      const sc = String(bundle.studentsCount).trim();
      if (sc.includes('জন') || sc.includes('শিক্ষার্থী')) return sc;
      return `${sc} জন`;
    }
    if (bundle?.buyersCount) {
      return `${bundle.buyersCount} জন`;
    }
    return '৪,৮৫০+ জন';
  }, [bundle]);

  // Bundle FAQs
  const faqs = [
    {
      q: 'এই কম্বো বান্ডিলটিতে কী কী অন্তর্ভুক্ত রয়েছে?',
      a: `এই বিশেষ বান্ডিলটিতে মোট ${includedCourses.length}টি প্রিমিয়ার কোর্স ও এক্সাম ব্যাচের সম্পূর্ণ এক্সেস অন্তর্ভুক্ত। এককালীন পেমেন্টে সবগুলো কোর্সের ভিডিও ক্লাস, লাইভ ও প্র্যাকটিস এক্সাম, লিডারবোর্ড এবং স্পেশাল PDF লেকচার শিট আজীবন এক্সেস পাবেন।`
    },
    {
      q: 'পেমেন্ট করার পর কীভাবে কোর্সগুলো পাব?',
      a: 'বিকাশ বা নগদ দিয়ে পেমেন্ট সম্পন্ন হওয়ার সাথে সাথেই আপনার একাউন্টে বান্ডিলের সকল কোর্সের পূর্ণ এক্সেস স্বয়ংক্রিয়ভাবে আনলক হয়ে যাবে। ড্যাশবোর্ড থেকে প্রতিটি কোর্সে সরাসরি প্রবেশ করা যাবে।'
    },
    {
      q: 'ভবিষ্যতে যদি নতুন ক্লাস বা পরীক্ষা যোগ হয়, সেগুলো কি পাওয়া যাবে?',
      a: 'হ্যাঁ! বান্ডিলে একবার এনরোল করলে উক্ত কোর্সগুলোতে পরবর্তীতে যুক্ত হওয়া সকল আপডেট, রিভিশন ক্লাস ও এক্সাম সম্পূর্ণ ফ্রিতে পাওয়া যাবে।'
    },
    {
      q: 'যেকোনো ডিভাইস থেকে কি পড়ালেখা ও পরীক্ষা দেওয়া যাবে?',
      a: 'হ্যাঁ, আমাদের প্ল্যাটফর্ম মোবাইল, ট্যাবলেট ও ল্যাপটপ/ডেস্কটপ যেকোনো ব্রাউজারে সম্পূর্ণ রেসপনসিভ ও স্মুথভাবে কাজ করে।'
    }
  ];

  if (!bundle) {
    return (
      <div className={`min-h-screen font-sans ${isDark ? 'bg-[#0b0d11] text-white' : 'bg-[#f8fafc] text-[#111827]'}`}>
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
          onLoginClick={onLoginClick}
        />
        <div className="max-w-xl mx-auto px-4 py-36 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <span className="text-3xl">🎁</span>
          </div>
          <h2 className="text-2xl font-black mb-2">বান্ডিলটি পাওয়া যায়নি</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">এই কম্বো বান্ডিলটি মুছে ফেলা হয়েছে অথবা বর্তমানে সক্রিয় নেই।</p>
          <button
            onClick={() => onNavigateCourse ? onNavigateCourse() : onNavigateHome()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-sm shadow-lg shadow-red-600/25 hover:from-red-500 hover:to-rose-500 transition-all cursor-pointer"
          >
            সকল কোর্স ও বান্ডিল দেখুন →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-250 ${
      isDark 
        ? 'bg-[#0b0d11] text-gray-100 selection:bg-[#e11438] selection:text-white' 
        : 'bg-[#f8fafc] text-[#111827] selection:bg-[#dc2626] selection:text-white'
    }`}>
      {/* 1. Shared Sticky Navbar */}
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
        onLoginClick={onLoginClick}
      />

      {/* 2. Hero Header & Overview Section */}
      <section className="relative overflow-hidden pt-20 sm:pt-24 pb-12 sm:pb-16 border-b border-black/5 dark:border-white/5">
        {/* Ambient Glow Backdrops */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left 7 Columns: Title, Details (Mobile: order-2, Desktop: order-1) */}
            <div className="order-2 lg:order-1 lg:col-span-7 space-y-6">
              
              {/* Title & Subtitle (Shown on Desktop; on mobile it is prominently featured on the card above) */}
              <div className="hidden lg:block">
                <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {bundle?.title}
                </h1>
                {bundle?.subtitle && (
                  <p className={`text-base sm:text-lg font-bold mt-2.5 ${
                    isDark ? 'text-red-300' : 'text-red-600'
                  }`}>
                    {bundle.subtitle}
                  </p>
                )}
              </div>

              {/* Long Description */}
              <div className="space-y-2">
                <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  বান্ডিল পরিচিতি
                </h3>
                <p className={`text-sm sm:text-base leading-relaxed ${
                  isDark ? 'text-gray-300' : 'text-slate-600'
                }`}>
                  {bundle?.description}
                </p>
              </div>

            </div>

            {/* Right 5 Columns: Sticky Action Card (Mobile: order-1 at top, Desktop: order-2 sticky) */}
            <div className="order-1 lg:order-2 lg:col-span-5 lg:sticky lg:top-24">
              <div className={`rounded-3xl border overflow-hidden shadow-2xl transition-all ${
                isDark 
                  ? 'bg-[#111317] border-white/[0.1] shadow-black/80' 
                  : 'bg-white border-slate-200/90 shadow-slate-200/60'
              }`}>
                {/* Banner Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                  <img 
                    src={bundle?.image || 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp'} 
                    alt={bundle?.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/sureshot_banner.jpg';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                </div>

                {/* Card Content & Pricing */}
                <div className="p-6 space-y-5">
                  
                  {/* Title, Subtitle / Short Description & Student Count (Matching Exam Batches / Course cards) */}
                  <div className="pb-3.5 border-b border-gray-100 dark:border-white/10">
                    <h2 className={`text-2xl sm:text-[28px] font-black leading-snug tracking-tight ${
                      isDark ? 'text-white' : 'text-[#111827]'
                    }`}>
                      {bundle?.title}
                    </h2>
                    
                    {bundle?.subtitle && (
                      <p className={`text-xs sm:text-sm font-semibold leading-normal mt-1.5 ${
                        isDark ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {bundle.subtitle}
                      </p>
                    )}

                    {/* Students Count & Course Inclusions Meta */}
                    <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <User size={15} className="shrink-0 text-gray-500 dark:text-gray-400" />
                        <span>{bundleEnrolled}</span>
                      </div>
                      <span className="text-gray-300 dark:text-gray-600 font-normal">·</span>
                      <span className="truncate">{includedCourses.length}টি কোর্স অন্তর্ভুক্ত</span>
                    </div>
                  </div>

                  {/* Pricing Display */}
                  <div className="flex items-center justify-between gap-3 px-1">
                    <div className="flex items-baseline gap-2.5">
                      <span className={`text-3xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-[#dc2626]'}`}>
                        ৳ {salePrice}
                      </span>
                      {regPrice > salePrice && (
                        <span className="text-base sm:text-lg text-gray-400 line-through font-semibold">
                          ৳{regPrice}
                        </span>
                      )}
                    </div>

                    {discountPercent > 0 && (
                      <span className={`text-sm sm:text-base font-black tracking-tight ${
                        isDark ? 'text-red-400' : 'text-[#dc2626]'
                      }`}>
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Enroll CTA Button */}
                  {isBundleEnrolled ? (
                    <button
                      type="button"
                      onClick={() => {
                        const elem = document.querySelector('section.py-12') || document.querySelector('section.py-16');
                        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-base font-extrabold shadow-[0_0_25px_rgba(16,185,129,0.45)] transition-all cursor-pointer border-none flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      <span>আপনি এনরোল্ড আছেন ✓ (কোর্সগুলো শুরু করুন)</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenCheckout}
                      className="w-full py-4 rounded-2xl bg-[#dc2626] hover:bg-red-700 text-white text-base font-extrabold shadow-[0_0_25px_rgba(220,38,38,0.45)] hover:shadow-[0_0_35px_rgba(220,38,38,0.65)] transition-all cursor-pointer border-none flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>এখনই এনরোল করুন</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}


                  {/* Support hotline */}
                  {(siteSettings.contactPhone || siteSettings.phone) && (
                    <div className={`pt-4 border-t flex items-center justify-between text-xs ${
                      isDark ? 'border-white/[0.08]' : 'border-slate-200'
                    }`}>
                      <span className="text-gray-400">যেকোনো সহায়তায়:</span>
                      <a 
                        href={`tel:${siteSettings.contactPhone || siteSettings.phone}`}
                        className="inline-flex items-center gap-1.5 font-bold text-[#dc2626] hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{siteSettings.contactPhone || siteSettings.phone}</span>
                      </a>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Included Courses Showcase Section (2-Column Balanced Grid) */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6 dark:border-white/10 border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
                <p className="text-xs font-bold uppercase tracking-wider text-red-500">
                  Course Inclusions
                </p>
              </div>
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                এই বান্ডিলে যে কোর্সগুলো থাকছে ({includedCourses.length}টি)
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed">
                প্রতিটি কোর্স আলাদা কিনলে মোট ৳{regPrice} খরচ হতো — এই বিশেষ বান্ডিলে পাচ্ছেন মাত্র ৳{salePrice}-এ (মোট ৳{savings} সাশ্রয় • {discountPercent}% ছাড়)!
              </p>
            </div>

          </div>

          {/* Courses Grid: Exact 100% Match to Exam Batches Page Card Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {includedCourses.map((c, idx) => {
              const cSale = parsePrice(c.salePrice, 399);
              const cReg = parsePrice(c.regularPrice, 799);
              const ribbon = c.ribbonText || c.badge || (c.isExamBatch ? 'সেকেন্ড টাইমার স্পেশাল' : null);

              // Meta info resolution matching Image 1 exactly
              const metaEnrolled = c.enrolledCount 
                ? (c.enrolledCount.includes('জন') ? c.enrolledCount : `${c.enrolledCount.replace('+', '').trim()} জন`)
                : (c.studentsCount ? `${String(c.studentsCount).replace('+', '').trim()} জন` : '৩,৪৫০ জন');

              let metaStats = '৬,৭০০+ MCQ';
              if (c.questionCount) {
                metaStats = c.questionCount.includes('MCQ') ? c.questionCount : `${c.questionCount.replace(' প্রশ্ন', '')} MCQ`;
              } else if (c.totalClasses) {
                const tc = String(c.totalClasses).trim();
                metaStats = tc.includes('ক্লাস') ? tc : `${tc}টি ক্লাস`;
              } else if (c.examCount) {
                metaStats = `${c.examCount}টি এক্সাম`;
              }

              return (
                <div 
                  key={c.id || c.key || idx}
                  onClick={() => {
                    if (onNavigateCourse) onNavigateCourse(c.id || c.key || c.slug, { fromBundle: true, bundleId: bundle?.id });
                  }}
                  className={`group rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
                    isDark 
                      ? 'bg-[#111317] border-white/[0.08] hover:border-white/20' 
                      : 'bg-white border-gray-200 hover:border-red-300 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Card Banner Image with Angled Ribbon */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
                      <img 
                        src={c.image || '/sureshot_banner.jpg'} 
                        alt={c.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/sureshot_banner.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                      {/* Angled Ribbon on Top-Left */}
                      {ribbon && (
                        <div className="absolute -left-9 top-4 -rotate-45 text-[10px] font-black tracking-wider py-0.5 px-9 uppercase bg-[#dc2626] text-white shadow-lg pointer-events-none select-none z-10">
                          {ribbon}
                        </div>
                      )}
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 space-y-2.5">
                      {/* Bold Bengali Title */}
                      <h2 className={`text-base sm:text-lg font-bold leading-snug line-clamp-2 min-h-[48px] transition-colors ${
                        isDark 
                          ? 'text-white group-hover:text-gray-200' 
                          : 'text-[#111827] group-hover:text-[#dc2626]'
                      }`}>
                        {c.title}
                      </h2>

                      {/* Enrolled Students Count & MCQ Count */}
                      <div className="flex items-center gap-2 pt-0.5 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <User size={15} className="shrink-0 text-gray-500 dark:text-gray-400" />
                          <span className="truncate">
                            {metaEnrolled}
                          </span>
                        </div>

                        <span className="text-gray-300 dark:text-gray-600 font-normal">·</span>

                        <span className="truncate">
                          {metaStats}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Pricing on Left + Details Link on Right */}
                  <div className="p-5 pt-0">
                    <div className={`flex items-end justify-between gap-2 pt-3 border-t ${
                      isDark ? 'border-white/[0.08]' : 'border-gray-100'
                    }`}>
                      {/* Left: Pricing */}
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                          কোর্সের মূল্য
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-[#dc2626]'}`}>
                            ৳ {cSale}
                          </span>
                          {cReg > cSale && (
                            <span className="text-xs sm:text-sm text-gray-400 line-through font-medium">
                              ৳{cReg}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Details Link */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigateCourse) onNavigateCourse(c.id || c.key || c.slug, { fromBundle: true, bundleId: bundle?.id });
                        }}
                        className={`text-xs sm:text-sm font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer py-1 px-1 transition-colors shrink-0 mb-0.5 ${
                          isDark ? 'text-white hover:text-gray-300' : 'text-[#dc2626] hover:text-red-700'
                        }`}
                      >
                        <span>বিস্তারিত</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. FAQs Section */}
      <section className={`py-12 sm:py-16 border-t ${
        isDark ? 'bg-black/20 border-white/[0.06]' : 'bg-slate-50 border-slate-200/80'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              বান্ডিল প্যাকেজ নিয়ে সাধারণ প্রশ্নের সহজ সমাধান
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div 
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isDark 
                      ? 'bg-[#111317] border-white/[0.08]' 
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer border-none bg-transparent"
                  >
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {faq.q}
                    </span>
                    <span className="shrink-0 text-gray-400">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className={`px-4 sm:px-5 pb-5 pt-0 text-xs sm:text-sm leading-relaxed ${
                      isDark ? 'text-gray-300' : 'text-slate-600'
                    }`}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Sticky Floating Bottom Action Bar (for Mobile) */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 p-3 sm:hidden border-t backdrop-blur-xl ${
        isDark ? 'bg-[#0f1117]/95 border-white/10' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase">অফার মূল্য</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-red-600">
                ৳{salePrice}
              </span>
              {regPrice > salePrice && (
                <span className="text-xs text-gray-400 line-through">
                  ৳{regPrice}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenCheckout}
            className="px-6 py-2.5 rounded-xl bg-[#dc2626] hover:bg-red-700 text-white text-xs font-bold shadow-[0_0_20px_rgba(220,38,38,0.45)] hover:shadow-[0_0_30px_rgba(220,38,38,0.65)] flex items-center gap-1.5 border-none cursor-pointer transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>এনরোল করুন</span>
          </button>
        </div>
      </div>

      {/* 7. Footer */}
      <footer className={`py-12 border-t text-xs ${
        isDark ? 'bg-[#090b0e] border-white/[0.08] text-gray-500' : 'bg-white border-slate-200 text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Edu Hunters. সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')}
              className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer"
            >
              Terms of Use
            </button>
            <button 
              onClick={() => onNavigatePolicies ? onNavigatePolicies('privacy') : (window.location.href = '/privacy-policy')}
              className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')}
              className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer"
            >
              Refund Policy
            </button>
            <button 
              onClick={onOpenAdmin}
              className="hover:text-red-500 bg-transparent border-none p-0 text-inherit cursor-pointer"
            >
              এডমিন প্যানেল
            </button>
          </div>
        </div>
      </footer>

      {/* 8. Checkout Modal */}
      {showCheckout && (
        <CheckoutModal 
          isOpen={showCheckout}
          bundle={{
            ...bundle,
            salePrice,
            regularPrice: regPrice,
            price: salePrice,
            originalPrice: regPrice
          }}
          course={{
            ...bundle,
            salePrice,
            regularPrice: regPrice,
            price: salePrice,
            originalPrice: regPrice
          }}
          siteSettings={siteSettings}
          onSuccess={(trxData) => {
            grantCourseAccess(bundle, data);
            if (onEnrollSuccess) onEnrollSuccess(trxData);
          }}
          onClose={() => setShowCheckout(false)} 
        />
      )}
    </div>
  );
}
