import React, { useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Tag, 
  ShieldCheck, 
  DollarSign,
  Gift,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function BundleDetailModal({ 
  isOpen, 
  bundle, 
  courses = [], 
  onClose, 
  onEnroll,
  onNavigateCourse 
}) {
  const { isDark } = useTheme();

  // Close on ESC & disable background scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !bundle) return null;

  // Resolve included courses
  const includedCourses = (bundle.courseIds || []).map(cId => {
    const match = courses.find(c => c.id === cId || c.slug === cId || c.key === cId);
    return match || {
      id: cId,
      title: cId,
      category: 'Academic',
      salePrice: 0,
      image: '/master_english_30_days.png'
    };
  });

  const standaloneSum = includedCourses.reduce((acc, c) => {
    return acc + (Number(c.salePrice || c.price || c.regularPrice || 0));
  }, 0);

  const regPrice = Number(bundle.regularPrice) || standaloneSum || Number(bundle.salePrice) || 0;
  const salePrice = Number(bundle.salePrice) || 0;
  const savings = Math.max(0, regPrice - salePrice);
  const discountPercent = regPrice > 0 ? Math.round((savings / regPrice) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Window */}
      <div 
        className={`relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl z-10 border transition-all transform animate-scaleUp ${
          isDark 
            ? 'bg-[#111317] border-white/[0.1] text-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.85)]' 
            : 'bg-white border-gray-200 text-gray-900 shadow-2xl'
        }`}
      >
        {/* Banner Header with Image */}
        <div className="relative aspect-[21/9] sm:aspect-[16/7] w-full overflow-hidden bg-black/50 shrink-0">
          <img 
            src={bundle.image || 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp'} 
            alt={bundle.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white bg-[#dc2626] shadow-md flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" />
              <span>Combo Pack</span>
            </span>
            {bundle.badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-slate-900 bg-white/95 backdrop-blur-md shadow-xs">
                {bundle.badge}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white/90 bg-black/60 border border-white/20 backdrop-blur-sm">
              {includedCourses.length} Courses Included
            </span>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          {/* Title & Subtitle on Banner */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md">
              {bundle.title}
            </h2>
            {bundle.subtitle && (
              <p className="text-xs sm:text-sm text-red-300 font-medium mt-1 line-clamp-1 drop-shadow-sm">
                {bundle.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          
          {/* Key Metric 3-Grid */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium">অন্তর্ভুক্ত কোর্স</p>
              <p className={`text-base sm:text-lg font-black mt-0.5 ${isDark ? 'text-white' : 'text-[#dc2626]'}`}>
                {includedCourses.length}টি কোর্স
              </p>
            </div>
            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium">স্বতন্ত্র মূল্য</p>
              <p className="text-base sm:text-lg font-bold text-gray-400 line-through mt-0.5">
                ৳{regPrice}
              </p>
            </div>
            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-emerald-50/60 border-emerald-100'
            }`}>
              <p className="text-[11px] sm:text-xs text-emerald-500 font-medium">মোট সাশ্রয়</p>
              <p className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
                ৳{savings} ({discountPercent}%)
              </p>
            </div>
          </div>

          {/* Description */}
          {bundle.description && (
            <div className="space-y-1.5">
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-gray-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#dc2626]" />
                বান্ডিল বিবরণ
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {bundle.description}
              </p>
            </div>
          )}

          {/* Included Courses Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-gray-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#dc2626]" />
                এই বান্ডিলে অন্তর্ভুক্ত কোর্সসমূহ ({includedCourses.length})
              </h3>
              <span className={`text-[11px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                মোট মূল্য: ৳{standaloneSum}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {includedCourses.map((c, idx) => (
                <div 
                  key={c.id || idx}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isDark 
                      ? 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04]' 
                      : 'bg-gray-50/80 border-gray-200 hover:bg-white hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={c.image || '/master_english_30_days.png'} 
                      alt={c.title}
                      className="w-12 h-10 rounded-xl object-cover shrink-0 border border-black/10 bg-black/20"
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate leading-snug ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {c.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-semibold">
                          {c.category || 'Academic'}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-gray-500 dark:text-gray-300">
                          ৳{c.salePrice || c.price || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    ✓ Included
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Highlights / Features */}
          {Array.isArray(bundle.features) && bundle.features.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/10">
              <h3 className="text-xs uppercase tracking-wider font-extrabold text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#dc2626]" />
                বান্ডিলের মূল সুবিধাসমূহ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {bundle.features.map((feat, fIdx) => (
                  <div 
                    key={fIdx}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
                      isDark 
                        ? 'bg-white/[0.02] border-white/[0.06] text-gray-300' 
                        : 'bg-red-50/40 border-red-100 text-gray-800'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Guarantee Strip */}
          <div className={`p-3 rounded-2xl border flex items-center gap-3 text-xs ${
            isDark ? 'bg-white/[0.02] border-white/[0.08] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
          }`}>
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="leading-snug">
              এককালীন পেমেন্টে সবগুলো কোর্সের আজীবন এক্সেস। কোনো লুকানো চার্জ নেই এবং যেকোনো ডিভাইসে সরাসরি ক্লাস ও এক্সাম দেওয়া যাবে।
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className={`p-4 sm:px-6 py-3.5 border-t flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#0c0d10] border-white/[0.08]' : 'bg-gray-50 border-gray-200'
        }`}>
          <div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              কম্বো অফার মূল্য
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-[#dc2626]'}`}>
                ৳ {salePrice}
              </span>
              {regPrice > salePrice && (
                <span className="text-xs text-gray-400 line-through font-medium">
                  ৳{regPrice}
                </span>
              )}
              {savings > 0 && (
                <span className="text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full bg-[#dc2626] text-white shadow-xs whitespace-nowrap">
                  ৳ {savings} ছাড়
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10' 
                  : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              বন্ধ করুন
            </button>
            <button
              type="button"
              onClick={() => {
                if (onEnroll) {
                  onEnroll(bundle);
                }
              }}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#dc2626] hover:bg-red-700 text-white text-xs sm:text-sm font-extrabold shadow-[0_0_20px_rgba(220,38,38,0.45)] hover:shadow-[0_0_30px_rgba(220,38,38,0.65)] transition-all cursor-pointer border-none hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>এনরোল করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
