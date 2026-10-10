import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, Clock, BookOpen, AlertCircle, 
  FileText, ChevronRight, User, Play, Lock,
  CheckCircle2, Sparkles, HelpCircle, ShieldCheck, Award, Zap,
  ChevronDown, ChevronUp, Check, SlidersHorizontal, Search, X
} from 'lucide-react';

import { useTheme } from '../context/ThemeContext';
import RtdsCurriculumView from './RtdsCurriculumView';
import { stripEmoji } from '../utils/textUtils';


export default function ExamDetailPage({ 
  category, 
  exams = [],
  onSelectExam,
  onBack, 
  onStartExamCategory, 
  onPreviewExams, 
  onOpenEnrollModal, 
  isEnrolled = false,
  isFromBundle = false
}) {
  const { isDark } = useTheme();
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  // Multi-source detection: whether the user navigated here from a bundle
  const isFromBundleResolved = Boolean(
    isFromBundle ||
    (() => {
      try {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get('from') === 'bundle' || sp.get('fromBundle') === 'true' || Boolean(sp.get('bundleId'))) {
          return true;
        }
        const stored = sessionStorage.getItem('eduhunters_nav_from_bundle');
        if (stored) return true;
      } catch (e) {}
      return false;
    })()
  );

  // States for streamlined minimal exam list & subject dropdown
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const subjectDropdownRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Dedicated smart search state for english_master (Master English)
  const [englishSearchQuery, setEnglishSearchQuery] = useState('');
  const [isEnglishSuggestOpen, setIsEnglishSuggestOpen] = useState(false);
  const englishSearchRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target)) {
        setIsSubjectDropdownOpen(false);
      }
      if (englishSearchRef.current && !englishSearchRef.current.contains(e.target)) {
        setIsEnglishSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smart search match function for English topic & question number search
  const isMasterEnglish = category?.key === 'english_master';

  // Autocomplete topic and exam suggestions for English
  const englishSuggestions = useMemo(() => {
    if (!isMasterEnglish || !englishSearchQuery.trim()) {
      return { topics: [], exams: [] };
    }
    const q = englishSearchQuery.toLowerCase().trim();
    const tokens = q.split(/[\s,]+/).filter(Boolean);
    const rangeMatch = q.match(/(\d+)\s*[-–—]\s*(\d+)/);
    const qRange = rangeMatch ? [parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10)] : null;
    const singleNumMatch = !qRange ? q.match(/\b\d+\b/) : null;
    const singleNum = singleNumMatch ? parseInt(singleNumMatch[0], 10) : null;

    // 1. Group unique topics with count
    const topicMap = new Map();
    exams.forEach(e => {
      const topic = (e.title || '').split('(')[0].trim();
      if (!topicMap.has(topic)) {
        topicMap.set(topic, { topic, count: 0 });
      }
      topicMap.get(topic).count++;
    });

    // 2. Score topics (e.g. "ad" -> Adjective Classification, Adverb Classification)
    const scoredTopics = [];
    topicMap.forEach((data, topic) => {
      const tLower = topic.toLowerCase();
      const tWords = tLower.split(/[\s,]+/).filter(Boolean);
      let score = 0;

      if (tLower === q) score += 100;
      else if (tLower.startsWith(q)) score += 80;
      else if (tWords.some(w => w.startsWith(q))) score += 60;
      else if (tokens.every(tok => tWords.some(w => w.startsWith(tok) || w.includes(tok)))) score += 40;
      else if (tLower.includes(q)) score += 20;

      if (score > 0) {
        scoredTopics.push({ topic, count: data.count, score });
      }
    });
    scoredTopics.sort((a, b) => b.score - a.score || b.count - a.count || a.topic.localeCompare(b.topic));

    // 3. Score individual exams (supports question number searches like 1-40, 35, etc.)
    const scoredExams = [];
    exams.forEach(e => {
      const title = e.title || '';
      const titleLower = title.toLowerCase();
      const rMatch = titleLower.match(/(\d+)\s*[-–—]\s*(\d+)/);
      const rStart = rMatch ? parseInt(rMatch[1], 10) : null;
      const rEnd = rMatch ? parseInt(rMatch[2], 10) : null;
      const titleWords = titleLower.replace(/[().,:-]/g, ' ').split(/\s+/).filter(Boolean);

      let examScore = 0;
      if (titleLower.includes(q)) examScore += 40;

      if (qRange && rStart !== null && rEnd !== null) {
        if (qRange[0] === rStart && qRange[1] === rEnd) examScore += 90;
        else if (qRange[0] >= rStart && qRange[1] <= rEnd) examScore += 70;
      } else if (singleNum !== null && rStart !== null && rEnd !== null) {
        if (singleNum >= rStart && singleNum <= rEnd) examScore += 65;
      }

      const matchesAllTokens = tokens.every(tok => {
        const num = parseInt(tok, 10);
        if (!isNaN(num) && rStart !== null && rEnd !== null) {
          if (num >= rStart && num <= rEnd) return true;
        }
        return titleWords.some(w => w.startsWith(tok) || w.includes(tok));
      });

      if (matchesAllTokens) examScore += 30;

      if (examScore > 0) {
        scoredExams.push({ exam: e, score: examScore });
      }
    });
    scoredExams.sort((a, b) => b.score - a.score);

    return {
      topics: scoredTopics.slice(0, 5),
      exams: scoredExams.slice(0, 4).map(s => s.exam)
    };
  }, [isMasterEnglish, englishSearchQuery, exams]);

  // Extract available groups/subjects with counts
  const availableGroups = useMemo(() => {
    const set = new Set();
    exams.forEach(e => {
      if (e.subject) set.add(e.subject);
    });
    return Array.from(set);
  }, [exams]);

  const subjectsWithCounts = useMemo(() => {
    const counts = {};
    exams.forEach(e => {
      if (e.subject) {
        counts[e.subject] = (counts[e.subject] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [exams]);

  // Filter exams based on selected subject AND smart search
  const filteredExams = useMemo(() => {
    let list = exams;

    // Subject dropdown filter (for regular categories)
    if (!isMasterEnglish && selectedSubject !== 'all') {
      list = list.filter(e => e.subject === selectedSubject);
    }

    // Smart English Search filter (topic wise + question number wise)
    if (isMasterEnglish && englishSearchQuery.trim()) {
      const q = englishSearchQuery.toLowerCase().trim();
      const tokens = q.split(/[\s,]+/).filter(Boolean);

      const rangeMatch = q.match(/(\d+)\s*[-–—]\s*(\d+)/);
      const qRange = rangeMatch ? [parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10)] : null;
      const singleNumMatch = !qRange ? q.match(/\b\d+\b/) : null;
      const singleNum = singleNumMatch ? parseInt(singleNumMatch[0], 10) : null;

      const scored = [];
      list.forEach(exam => {
        const titleLower = (exam.title || '').toLowerCase();
        const rMatch = titleLower.match(/(\d+)\s*[-–—]\s*(\d+)/);
        const rStart = rMatch ? parseInt(rMatch[1], 10) : null;
        const rEnd = rMatch ? parseInt(rMatch[2], 10) : null;
        const titleWords = titleLower.replace(/[().,:-]/g, ' ').split(/\s+/).filter(Boolean);

        const matchesAll = tokens.every(tok => {
          // Check range match e.g. "1-40"
          const tRangeMatch = tok.match(/(\d+)\s*[-–—]\s*(\d+)/);
          if (tRangeMatch && rStart !== null && rEnd !== null) {
            const s = parseInt(tRangeMatch[1], 10);
            const end = parseInt(tRangeMatch[2], 10);
            return (s === rStart && end === rEnd) || (s >= rStart && end <= rEnd) || (s <= rEnd && end >= rStart);
          }
          // Check single number e.g. 40, 35
          const num = parseInt(tok, 10);
          if (!isNaN(num) && rStart !== null && rEnd !== null) {
            if (num >= rStart && num <= rEnd) return true;
          }
          return titleWords.some(tWord => tWord.startsWith(tok) || tWord.includes(tok)) || titleLower.includes(tok);
        });

        if (matchesAll) {
          let score = 0;
          if (titleLower.startsWith(q)) score += 100;
          if (titleLower.includes(q)) score += 70;
          if (qRange && rStart === qRange[0] && rEnd === qRange[1]) score += 50;
          if (singleNum && rStart !== null && rEnd !== null && singleNum >= rStart && singleNum <= rEnd) score += 30;
          scored.push({ exam, score });
        }
      });

      scored.sort((a, b) => b.score - a.score);
      list = scored.map(s => s.exam);
    }

    return list;
  }, [exams, selectedSubject, isMasterEnglish, englishSearchQuery]);

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setIsExpanded(false);
    setIsSubjectDropdownOpen(false);
  };


  // Default to 5 exams as requested
  const initialExams = useMemo(() => filteredExams.slice(0, 5), [filteredExams]);
  const extraExams = useMemo(() => filteredExams.slice(5), [filteredExams]);
  const hasMore = filteredExams.length > 5;

  const itemCountLabel = useMemo(() => {
    const count = filteredExams.length;
    if (category?.type === 'lecture' || category?.isLecture) {
      return `${count} ${count === 1 ? 'Lecture' : 'Lectures'}`;
    }
    if (category?.type === 'video' || category?.isVideo) {
      return `${count} ${count === 1 ? 'Video' : 'Videos'}`;
    }
    return `${count} ${count === 1 ? 'Exam' : 'Exams'}`;
  }, [filteredExams.length, category]);

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
    <div className={`min-h-screen ${isFromBundleResolved ? 'pb-8 sm:pb-24' : 'pb-24'} font-sans antialiased transition-colors duration-300 selection:bg-[#e11438] selection:text-white ${
      isDark ? 'bg-transparent text-gray-100' : 'bg-[#f8f9fa] text-[#111827]'
    }`}>
      

      {/* Main Full-Width PC Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* If navigated from bundle, show back to bundle button */}
        {isFromBundleResolved && onBack && (
          <div className="mb-4">
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10' 
                  : 'bg-white border-gray-200 text-gray-700 hover:text-[#dc2626] hover:border-red-200 shadow-xs'
              }`}
            >
              <ArrowLeft size={14} />
              <span>← বান্ডিলে ফিরে যান</span>
            </button>
          </div>
        )}
        
        {/* 2-COLUMN BALANCED CONTENT (Card first on mobile: order-1) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* POSTER & ACTION CARD (Mobile: order-1, PC: order-2 sticky) */}
          <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className={`rounded-3xl overflow-hidden border transition-all ${
              isDark 
                ? 'bg-[#111317] border-white/[0.08] backdrop-blur-md' 
                : 'bg-white border-gray-200'
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

                {/* Enrolled Students Count & MCQ Count */}
                <div className="flex items-center gap-2 pt-0.5 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <User size={15} className="shrink-0 text-gray-500 dark:text-gray-400" />
                    <span>
                      {category.enrolledCount 
                        ? (category.enrolledCount.includes('enrolled') ? category.enrolledCount : `${category.enrolledCount.replace('+', '').replace('জন', '').trim()} enrolled`)
                        : '3,450 enrolled'}
                    </span>
                  </div>

                  <span className="text-gray-300 dark:text-gray-600 font-normal">·</span>

                  <span className="truncate">
                    {category.questionCount ? (category.questionCount.includes('MCQ') ? category.questionCount : `${category.questionCount.replace(' প্রশ্ন', '')} MCQs`) : '1,700+ MCQs'}
                  </span>
                </div>

                {/* Desktop Price & Action */}
                <div className="hidden sm:block pt-4 border-t border-gray-100 dark:border-white/[0.08] space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">
                        Course Fee
                      </p>
                      <div className="flex items-center gap-2.5">
                        {/* Price in Dark Theme is WHITE */}
                        <span className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-[#dc2626]'}`}>
                          ৳ {category.price || '399'}
                        </span>
                        {category.originalPrice && (
                          <span className="text-sm text-gray-400 line-through font-medium">
                            ৳ {category.originalPrice || '799'}
                          </span>
                        )}
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#dc2626] text-white shadow-xs">
                          ৳ {discountAmount > 0 ? discountAmount : 400} OFF
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
                        <span>Take Exam</span>
                        <ChevronRight size={18} />
                      </>
                    ) : (
                      <>
                        <span>Enroll Now</span>
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
                    <span className="truncate">Negative: {category.negativeMark}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* DETAILS COLUMN: Full-Width Content (order-2 on mobile, order-1 on desktop) */}
          <div className="order-2 lg:order-1 lg:col-span-7 xl:col-span-7 space-y-6">
            






            {/* Render Curriculum Hierarchy if category is RTDS or GK Course */}
            {(category?.key === 'rtds' || category?.key === 'gk_course') ? (
              <RtdsCurriculumView
                exams={exams}
                onSelectExam={onSelectExam}
                isEnrolled={isEnrolled}
                onOpenEnrollModal={onOpenEnrollModal}
                category={category}
              />
            ) : exams && exams.length > 0 && (
              <div className="space-y-3.5">

                {/* Filter / Search Bar: Replace dropdown with Smart Search Bar for Master English */}
                {isMasterEnglish ? (
                  <div className="relative w-full max-w-lg z-30" ref={englishSearchRef}>
                    <div className="relative">
                      <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                        englishSearchQuery ? 'text-red-500' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        value={englishSearchQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEnglishSearchQuery(val);
                          setIsEnglishSuggestOpen(val.trim().length > 0);
                          setIsExpanded(false);
                        }}
                        onFocus={() => {
                          if (englishSearchQuery.trim().length > 0) {
                            setIsEnglishSuggestOpen(true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape' || e.key === 'Enter') {
                            setIsEnglishSuggestOpen(false);
                          }
                        }}
                        placeholder="Search exam (e.g. Adjective, 1-40)..."
                        autoComplete="off"
                        spellCheck="false"
                        className={`w-full pl-11 pr-20 py-3 rounded-2xl text-xs sm:text-sm font-semibold border transition-all outline-none shadow-xs ${
                          isDark
                            ? 'bg-[#121724] border-[#222b3d] text-white placeholder-gray-500 focus:border-red-500/80 focus:bg-[#151c2e]'
                            : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-white'
                        }`}
                      />
                      
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {englishSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setEnglishSearchQuery('');
                              setIsEnglishSuggestOpen(false);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer bg-transparent border-none rounded-full"
                            title="Clear"
                          >
                            <X size={15} />
                          </button>
                        )}
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {filteredExams.length}
                        </span>
                      </div>
                    </div>

                    {/* Auto-suggest dropdown when typing */}
                    {isEnglishSuggestOpen && (englishSuggestions.topics.length > 0 || englishSuggestions.exams.length > 0) && (
                      <div className={`absolute top-full left-0 mt-2 w-full rounded-2xl border shadow-xl p-2 z-40 backdrop-blur-xl animate-fadeIn ${
                        isDark
                          ? 'bg-[#0f1420]/95 border-[#222b3d] text-white shadow-black/60'
                          : 'bg-white/95 border-gray-200 text-gray-800 shadow-gray-200/80'
                      }`}>
                        {/* Topic Suggestions Section */}
                        {englishSuggestions.topics.length > 0 && (
                          <div className="mb-2">
                            <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                              <span>Suggested Topics</span>
                              <span className="text-[9px] opacity-70">Select Topic</span>
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              {englishSuggestions.topics.map((item, sIdx) => (
                                <button
                                  key={`topic-${sIdx}`}
                                  type="button"
                                  onClick={() => {
                                    setEnglishSearchQuery(item.topic);
                                    setIsEnglishSuggestOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-none text-left ${
                                    isDark ? 'hover:bg-white/[0.08] text-gray-200' : 'hover:bg-red-50/60 hover:text-red-600 text-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <BookOpen size={13} className="text-red-500 shrink-0 opacity-80" />
                                    <span className="truncate">{item.topic}</span>
                                  </div>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                    isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {item.count} {item.count === 1 ? 'Exam' : 'Exams'}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Exam / Question Range Suggestions Section */}
                        {englishSuggestions.exams.length > 0 && (
                          <div>
                            {englishSuggestions.topics.length > 0 && (
                              <div className="my-1 border-t border-gray-100 dark:border-white/[0.06]" />
                            )}
                            <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                              <span>Matching Exams / Question Sets</span>
                              <span className="text-[9px] opacity-70">View Directly</span>
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              {englishSuggestions.exams.map((exam, eIdx) => (
                                <button
                                  key={`exam-sug-${exam.id || eIdx}`}
                                  type="button"
                                  onClick={() => {
                                    setEnglishSearchQuery(exam.title);
                                    setIsEnglishSuggestOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer border-none text-left ${
                                    isDark ? 'hover:bg-white/[0.08] text-gray-200' : 'hover:bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText size={13} className="text-gray-400 shrink-0" />
                                    <span className="truncate">{stripEmoji(exam.title)}</span>
                                  </div>
                                  <ChevronRight size={13} className="text-gray-400 shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : availableGroups.length > 0 && (
                  <div className="relative inline-block z-30" ref={subjectDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsSubjectDropdownOpen(prev => !prev)}
                      className={`inline-flex items-center justify-between gap-3.5 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99] min-w-[210px] sm:min-w-[230px] ${
                        isDark
                          ? 'bg-[#121724] hover:bg-[#181f30] border-[#222b3d] hover:border-red-500/50 text-white'
                          : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-red-300 text-gray-800'
                      }`}
                    >

                      <div className="flex items-center gap-2.5 min-w-0">
                        <SlidersHorizontal size={14} className="text-[#dc2626] shrink-0" />
                        <span className="truncate">
                          {selectedSubject === 'all' ? 'All Subjects' : selectedSubject}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {filteredExams.length}
                        </span>
                        <ChevronDown
                          size={15}
                          className={`transition-transform duration-300 text-gray-400 ${
                            isSubjectDropdownOpen ? 'rotate-180 text-red-500' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {/* Dropdown Options Popup */}
                    {isSubjectDropdownOpen && (
                      <div className={`absolute top-full left-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl border shadow-xl p-1.5 z-40 backdrop-blur-xl animate-fadeIn scrollbar-thin ${
                        isDark
                          ? 'bg-[#0f1420]/95 border-[#222b3d] text-white shadow-black/60'
                          : 'bg-white/95 border-gray-200 text-gray-800 shadow-gray-200/80'
                      }`}>
                        {/* All Subjects Option */}
                        <button
                          type="button"
                          onClick={() => handleSelectSubject('all')}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-none text-left ${
                            selectedSubject === 'all'
                              ? 'bg-[#dc2626] text-white'
                              : (isDark ? 'hover:bg-white/[0.06] text-gray-200' : 'hover:bg-gray-100 text-gray-800')
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {selectedSubject === 'all' && <Check size={14} className="shrink-0" />}
                            <span>All Subjects</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            selectedSubject === 'all' ? 'bg-white/20 text-white' : (isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-600')
                          }`}>
                            {exams.length}
                          </span>
                        </button>

                        <div className="my-1 border-t border-gray-100 dark:border-white/[0.06]" />

                        {/* Individual Subjects */}
                        {subjectsWithCounts.map(({ name, count }) => {
                          const isSelected = selectedSubject === name;
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => handleSelectSubject(name)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border-none text-left ${
                                isSelected
                                  ? 'bg-[#dc2626] text-white'
                                  : (isDark ? 'hover:bg-white/[0.06] text-gray-200' : 'hover:bg-gray-100 text-gray-800')
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {isSelected && <Check size={14} className="shrink-0" />}
                                <span className="truncate">{name}</span>
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                isSelected ? 'bg-white/20 text-white' : (isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-600')
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Card Container (Flat border, no shadow as requested) */}
                <div className={`p-5 sm:p-7 rounded-3xl border transition-all ${
                  isDark 
                    ? 'bg-[#111317] border-white/[0.08] backdrop-blur-md' 
                    : 'bg-white border-gray-200'
                }`}>
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                      {isMasterEnglish && englishSearchQuery.trim()
                        ? `Search Results • "${englishSearchQuery.trim()}"`
                        : selectedSubject !== 'all'
                        ? `All Exams • ${selectedSubject}`
                        : 'All Exams'}
                    </h2>

                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      isDark ? 'bg-white/[0.05] text-gray-400' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {itemCountLabel}
                    </span>
                  </div>

                  {/* Empty state if search returns zero results */}
                  {filteredExams.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center justify-center">
                      <Search size={32} className="text-gray-400 mb-2.5 opacity-50" />
                      <p className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        No exams or topics found
                      </p>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm">
                        Search by topic name (e.g. Adjective, Preposition) or exam number (e.g. 1-40)
                      </p>
                      {isMasterEnglish && englishSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setEnglishSearchQuery('');
                            setIsEnglishSuggestOpen(false);
                          }}
                          className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer transition-colors border-none"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Initial 5 Exam Cards (Single Column Stack, matching user screenshot) */}
                      <div className="flex flex-col gap-2.5 sm:gap-3">
                        {initialExams.map((exam, eIdx) => (
                      <button
                        key={exam.id || eIdx}
                        onClick={() => {
                          if (onSelectExam) {
                            onSelectExam(exam);
                          } else if (onStartExamCategory) {
                            onStartExamCategory(category.key);
                          }
                        }}
                        className={`w-full py-4 px-4 sm:px-5 rounded-2xl font-bold text-xs sm:text-sm md:text-base text-left transition-all duration-200 cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-3 min-h-[56px] border group ${
                          isDark
                            ? 'bg-[#141926] hover:bg-[#1a2233] border-[#222b3d] hover:border-red-500/50 text-white'
                            : 'bg-gray-50 hover:bg-red-50/40 border-gray-200 hover:border-red-300 text-gray-800'
                        }`}
                      >
                        <span className="line-clamp-2 text-left flex-1 font-semibold sm:font-bold">{stripEmoji(exam.title)}</span>
                        {!isEnrolled ? (
                          <Lock size={15} strokeWidth={1.8} className="shrink-0 text-gray-400 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
                        ) : (
                          <Play size={14} className="shrink-0 text-emerald-500 fill-current opacity-80" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Smooth Hardware-Accelerated Accordion Expand for Remaining Exams */}
                  {extraExams.length > 0 && (
                    <div className={`smooth-expand-container ${isExpanded ? 'is-expanded' : ''}`}>
                      <div className="smooth-expand-content">
                        <div className="flex flex-col gap-2.5 sm:gap-3 pt-2.5 sm:pt-3">
                          {extraExams.map((exam, eIdx) => (
                            <button
                              key={exam.id || (eIdx + 5)}
                              onClick={() => {
                                if (onSelectExam) {
                                  onSelectExam(exam);
                                } else if (onStartExamCategory) {
                                  onStartExamCategory(category.key);
                                }
                              }}
                              className={`w-full py-4 px-4 sm:px-5 rounded-2xl font-bold text-xs sm:text-sm md:text-base text-left transition-all duration-200 cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-3 min-h-[56px] border group ${
                                isDark
                                  ? 'bg-[#141926] hover:bg-[#1a2233] border-[#222b3d] hover:border-red-500/50 text-white'
                                  : 'bg-gray-50 hover:bg-red-50/40 border-gray-200 hover:border-red-300 text-gray-800'
                              }`}
                            >
                              <span className="line-clamp-2 text-left flex-1 font-semibold sm:font-bold">{stripEmoji(exam.title)}</span>
                              {!isEnrolled ? (
                                <Lock size={15} strokeWidth={1.8} className="shrink-0 text-gray-400 dark:text-gray-400 group-hover:text-red-500 transition-colors" />
                              ) : (
                                <Play size={14} className="shrink-0 text-emerald-500 fill-current opacity-80" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View More Button */}
                  {hasMore && (
                    <div className="flex justify-center mt-5 pt-1">
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full border text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98] ${
                          isDark
                            ? 'bg-[#151a27] hover:bg-[#1d2436] border-[#232c3f] text-gray-300 hover:text-white'
                            : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        <span>{isExpanded ? 'View Less' : 'View More'}</span>
                        <ChevronDown
                          size={15}
                          className={`transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isExpanded ? 'rotate-180 text-red-500' : ''}`}
                        />
                      </button>
                    </div>
                  )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* About / Description */}
            {category.details?.about && (
              <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                isDark 
                  ? 'bg-[#111317] border-white/[0.08] backdrop-blur-md' 
                  : 'bg-white border-gray-200'
              }`}>
                <h2 className={`text-lg sm:text-xl font-black tracking-tight mb-3 ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                  About Course
                </h2>
                <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {category.details.about}
                </p>
              </div>
            )}

            {/* Covered Subjects (Always placed at the very bottom as requested) */}
            {category.details?.subjects && (
              <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                isDark 
                  ? 'bg-[#111317] border-white/[0.08] backdrop-blur-md' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="mb-4">
                  <h2 className={`text-lg sm:text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                    Included Subjects
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

          </div>


        </div>

      </div>

      {/* MOBILE STICKY BOTTOM ACTION BAR - Suppressed when viewing from a bundle context */}
      {!isFromBundleResolved && (
        <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 p-3 border-t backdrop-blur-md flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#0d0205]/95 border-white/10' : 'bg-white/95 border-gray-200 shadow-lg'
        }`}>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-300">
              Course Fee
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {/* Price in Dark Theme is WHITE */}
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-[#dc2626]'}`}>
                ৳ {category.price || '399'}
              </span>
              <span className="text-[11px] text-gray-400 line-through font-medium">
                ৳ {category.originalPrice || '799'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#dc2626] text-white shadow-xs">
                ৳ {discountAmount > 0 ? discountAmount : 400} OFF
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
                <span>Take Exam</span>
              </>
            ) : (
              <>
                <span>Enroll Now</span>
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}

