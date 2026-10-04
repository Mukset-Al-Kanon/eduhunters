import React, { useEffect } from 'react';
import { X, Clock, HelpCircle, CheckCircle2, AlertCircle, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function CategoryDetailModal({ isOpen, category, onClose, onStartCategory }) {
  const { isDark } = useTheme();

  // Close on ESC
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

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div 
        className={`relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl z-10 border transition-all transform animate-scaleUp ${
          isDark 
            ? 'bg-[#111317] border-white/[0.08] text-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.8)]' 
            : 'bg-white border-gray-200 text-gray-900 shadow-2xl'
        }`}
      >
        {/* Banner Header with Image */}
        <div className="relative aspect-[21/9] sm:aspect-[16/7] w-full overflow-hidden bg-black/40">
          <img 
            src={category.image} 
            alt={category.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#dc2626] shadow-md flex items-center gap-1.5">
              <span>{category.badge}</span>
            </span>
            {category.ribbonText && (
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white/90 bg-black/60 border border-white/20 backdrop-blur-sm">
                {category.ribbonText}
              </span>
            )}
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          {/* Title on Banner */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h2 className="text-lg sm:text-2xl font-black leading-tight drop-shadow-md">
              {category.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-200 mt-1 line-clamp-1">
              {category.subtitle}
            </p>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
          
          {/* Key Metric 4-Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-xs text-gray-400 font-medium">মোট এক্সাম</p>
              <p className={`text-base sm:text-lg font-black mt-0.5 ${isDark ? 'text-white' : 'text-[#dc2626]'}`}>{category.examCountText}</p>
            </div>
            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-xs text-gray-400 font-medium">মোট প্রশ্ন</p>
              <p className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">{category.questionCount}</p>
            </div>
            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-xs text-gray-400 font-medium">সময়</p>
              <p className="text-base sm:text-lg font-black text-cyan-400 mt-0.5">{category.duration}</p>
            </div>
            <div className={`p-3 rounded-2xl border text-center ${
              isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-xs text-gray-400 font-medium">নেগেটিভ মার্ক</p>
              <p className="text-base sm:text-lg font-black text-amber-400 mt-0.5">{category.negativeMark}</p>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-1.5 ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              <BookOpen size={16} className="text-[#e11438]" />
              <span>এক্সাম ব্যাচ সম্পর্কে</span>
            </h3>
            <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {category.details?.about}
            </p>
          </div>

          {/* Subjects Covered */}
          {category.details?.subjects && (
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-1.5 mb-2 ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>যে যে বিষয়সমূহ অন্তর্ভুক্ত</span>
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {category.details.subjects.map((sub, idx) => (
                  <span 
                    key={idx}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      isDark 
                        ? 'bg-white/[0.04] border-white/10 text-gray-200' 
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Features Highlights */}
          {category.details?.features && (
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-1.5 mb-2 ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>
                <ShieldCheck size={16} className="text-blue-500" />
                <span>এক্সামের বিশেষ সুবিধাসমূহ</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {category.details.features.map((feat, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs leading-snug ${
                      isDark ? 'bg-white/[0.02] border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="text-[#e11438] font-bold text-sm leading-none">✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules / Instructions */}
          {category.details?.rules && (
            <div className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1.5">
                <AlertCircle size={14} /> এক্সামের নিয়মাবলী
              </h4>
              <ul className="text-xs space-y-1 list-disc list-inside opacity-90">
                {category.details.rules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#0e1013] border-white/[0.08]' : 'bg-gray-50 border-gray-200'
        }`}>
          <button 
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border ${
              isDark 
                ? 'bg-transparent hover:bg-white/10 text-gray-300 border-white/20' 
                : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
            }`}
          >
            বন্ধ করুন
          </button>

          <button 
            onClick={() => {
              onClose();
              if (onStartCategory) onStartCategory(category.key);
            }}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:from-[#e11438] hover:to-[#991b1b] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/40 hover:scale-[1.02] cursor-pointer border-none"
          >
            <span>এক্সাম শুরু করুন ({category.examCountText})</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
