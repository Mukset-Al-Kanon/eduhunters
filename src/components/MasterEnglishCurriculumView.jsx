import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, X, Lock, FileText, ChevronDown, BookOpen, Clock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { stripEmoji } from '../utils/textUtils';


const VOCAB_KEYWORDS = [
  'antonym', 'synonym', 'preposition', 'idiom', 'phrase', 'spelling',
  'substitution', 'proverb', 'translation', 'vocabulary', 'group verb'
];

function isVocabTopic(topicName, subCategory) {
  if (subCategory && subCategory.toLowerCase().includes('vocabulary')) return true;
  const lower = topicName.toLowerCase();
  return VOCAB_KEYWORDS.some(k => lower.includes(k));
}

function extractTopic(title) {
  let cleaned = (title || '').replace(/\s*\[.*?\]/g, '').trim();
  const match = cleaned.match(/^(.*?)\s*(\(Ques|\(Unlimited|\(Part|\()/i);
  if (match) return match[1].trim();
  return cleaned;
}

function getRangeStart(title) {
  if (title.toLowerCase().includes('unlimited')) return 99999;
  const m = title.match(/Ques\.?\s*No\.?\s*(\d+)/i) || title.match(/(\d+)\s*[-–]/);
  return m ? parseInt(m[1], 10) : 0;
}

export default function MasterEnglishCurriculumView({
  exams = [],
  onSelectExam,
  isEnrolled = false,
  onOpenEnrollModal,
  category = null
}) {
  const { isDark } = useTheme();

  // Active Filter Tab: 'all' | 'grammar' | 'vocab' | 'unlimited'
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track open accordion topics by topic name
  // By default, open the first topic for instant preview
  const [openTopics, setOpenTopics] = useState(new Set(['Article']));

  // Build topics map with strict natural sort for exams
  const { topicList, totalQuestionsCount } = useMemo(() => {
    const map = {};
    let totalQ = 0;

    exams.forEach(exam => {
      const topicName = extractTopic(exam.title);
      const isVocab = isVocabTopic(topicName, exam.subCategory);
      const qCount = exam.totalQuestions || 0;
      totalQ += qCount;

      if (!map[topicName]) {
        map[topicName] = {
          name: topicName,
          isVocab,
          exams: [],
          totalQuestions: 0
        };
      }
      map[topicName].exams.push(exam);
      map[topicName].totalQuestions += qCount;
    });

    // Sort exams within each topic naturally: 1-50, 51-100, 101-150, ..., Unlimited
    const list = Object.values(map).map(topic => {
      const sortedExams = [...topic.exams].sort((a, b) => getRangeStart(a.title) - getRangeStart(b.title));
      return {
        ...topic,
        exams: sortedExams,
        hasUnlimited: sortedExams.some(e => e.title.toLowerCase().includes('unlimited'))
      };
    });

    // Sort topic list alphabetically or with common grammar first
    list.sort((a, b) => a.name.localeCompare(b.name));

    return { topicList: list, totalQuestionsCount: totalQ };
  }, [exams]);

  // Filter topics based on active tab and search query
  const filteredTopics = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return topicList.filter(topic => {
      // Tab filter
      if (activeTab === 'grammar' && topic.isVocab) return false;
      if (activeTab === 'vocab' && !topic.isVocab) return false;
      if (activeTab === 'unlimited' && !topic.hasUnlimited) return false;

      // Search filter
      if (!q) return true;

      const topicMatch = topic.name.toLowerCase().includes(q);
      const examMatch = topic.exams.some(e => (e.title || '').toLowerCase().includes(q));
      return topicMatch || examMatch;
    });
  }, [topicList, activeTab, searchQuery]);

  // Auto-expand matched topics during search
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const matched = new Set(filteredTopics.map(t => t.name));
      setOpenTopics(matched);
    }
  }, [searchQuery, filteredTopics]);

  const toggleTopic = (topicName) => {
    setOpenTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicName)) {
        next.delete(topicName);
      } else {
        next.add(topicName);
      }
      return next;
    });
  };


  const handleExamClick = (exam, isFirst = false) => {
    if (onSelectExam) {
      onSelectExam(exam);
    } else if (!isEnrolled && onOpenEnrollModal) {
      onOpenEnrollModal();
    }
  };

  return (
    <div className="space-y-4">
      {/* Outer Card Container matching EduHunters aesthetic */}
      <div className={`p-4 sm:p-6 rounded-3xl border transition-all ${
        isDark 
          ? 'bg-[#140306]/90 border-[#e11438]/20 backdrop-blur-md shadow-xl shadow-red-950/10' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}>
        
        {/* Header & Overview Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200/50 dark:border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ইংলিশ মাস্টার ৫০ • টপিকভিত্তিক এক্সামসমূহ
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              সকল প্রশ্ন অধ্যায় ও টপিকভিত্তিক ড্রপডাউন বাক্সে সুবিন্যস্ত করা হয়েছে
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
              isDark 
                ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {exams.length}টি এক্সাম • {totalQuestionsCount.toLocaleString()}টি প্রশ্ন
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative pt-4">
          <Search size={16} className={`absolute left-3.5 top-[calc(50%+8px)] -translate-y-1/2 transition-colors ${
            searchQuery ? 'text-red-500' : 'text-gray-400'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="টপিক বা প্রশ্ন খুঁজুন (যেমন: Article, Conditional, 1-50)..."
            className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl font-medium border transition-all outline-none ${
              isDark
                ? 'bg-[#141926] border-slate-700/80 text-white placeholder-gray-500 focus:border-red-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:bg-white'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-[calc(50%+8px)] -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Tabs (All / Grammar / Vocab / Unlimited) */}
        <div className="flex flex-wrap items-center gap-2 py-3">
          {[
            { id: 'all', label: 'সব টপিক', count: topicList.length },
            { id: 'grammar', label: 'গ্রামার', count: topicList.filter(t => !t.isVocab).length },
            { id: 'vocab', label: 'ভোকাবুলারি', count: topicList.filter(t => t.isVocab).length },
            { id: 'unlimited', label: 'আনলিমিটেড এক্সাম', count: topicList.filter(t => t.hasUnlimited).length }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl shrink-0 flex items-center gap-1.5 transition-all cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white border-red-500 shadow-sm shadow-red-600/30'
                  : isDark
                  ? 'bg-[#141926] hover:bg-[#1c2438] text-gray-400 border-[#222b3d]'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activeTab === tab.id ? 'bg-black/20 text-white' : 'bg-black/10 dark:bg-white/10 text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Accordion / Dropdown Box List */}
        <div className="space-y-3 pt-2">
          {filteredTopics.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <Search size={32} className="text-gray-400 mb-2 opacity-40" />
              <p className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                কোনো টপিক বা এক্সাম পাওয়া যায়নি
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ভিন্ন শব্দ দিয়ে সার্চ করুন অথবা ফিল্টার পরিবর্তন করুন
              </p>
            </div>
          ) : (
            filteredTopics.map((topic) => {
              const isOpen = openTopics.has(topic.name);

              return (
                <div
                  key={topic.name}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? isDark
                        ? 'bg-[#141926] border-red-500/40 shadow-lg shadow-red-950/20'
                        : 'bg-white border-red-300 shadow-xs'
                      : isDark
                      ? 'bg-[#10141f] hover:bg-[#141926] border-[#1f2737]'
                      : 'bg-gray-50/70 hover:bg-white border-gray-200'
                  }`}
                >
                  {/* Dropdown Header Button */}
                  <button
                    type="button"
                    onClick={() => toggleTopic(topic.name)}
                    className="w-full py-3.5 px-4 sm:px-5 flex items-center justify-between gap-3 text-left cursor-pointer select-none border-none bg-transparent group"
                  >
                    <div className="min-w-0">
                      <h3 className={`font-bold text-sm sm:text-base leading-snug truncate ${
                        isOpen 
                          ? isDark ? 'text-white' : 'text-red-700 font-extrabold' 
                          : isDark ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {topic.name}
                      </h3>

                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {topic.exams.length}টি পরীক্ষা • {topic.totalQuestions}টি প্রশ্ন কভারেজ
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 ${
                        isOpen 
                          ? 'rotate-180 bg-red-600 text-white' 
                          : isDark ? 'bg-white/[0.05] text-gray-400' : 'bg-gray-200 text-gray-600'
                      }`}>
                        <ChevronDown size={15} />
                      </div>
                    </div>
                  </button>

                  {/* Dropdown Content: Exam List */}
                  {isOpen && (
                    <div className={`p-3 sm:p-4 pt-1 space-y-2 border-t ${
                      isDark ? 'border-white/[0.06] bg-[#0c1018]/60' : 'border-gray-100 bg-gray-50/50'
                    }`}>
                      {topic.exams.map((exam, eIdx) => {
                        const isUnlimited = exam.title.toLowerCase().includes('unlimited');

                        return (
                          <button
                            key={exam.id || eIdx}
                            type="button"
                            onClick={() => handleExamClick(exam)}
                            className={`w-full p-3 sm:p-3.5 rounded-xl font-bold text-left transition-all duration-150 cursor-pointer select-none flex items-center justify-between gap-3 border group ${
                              isUnlimited
                                ? isDark
                                  ? 'bg-amber-950/20 hover:bg-amber-900/30 border-amber-500/30 text-amber-200'
                                  : 'bg-amber-50/80 hover:bg-amber-100 border-amber-300 text-amber-900'
                                : isDark
                                ? 'bg-[#141926] hover:bg-[#1c2438] border-[#222b3d] hover:border-red-500/50 text-white hover:shadow-md hover:shadow-red-950/20'
                                : 'bg-white hover:bg-red-50/40 border-gray-200 hover:border-red-300 text-gray-800 hover:shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                isUnlimited
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : isDark ? 'bg-white/[0.06] text-gray-400' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {eIdx + 1}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-semibold truncate">
                                    {stripEmoji(exam.title)}
                                  </span>
                                  {isUnlimited && (
                                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase tracking-wider">
                                      Mega Pool
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <BookOpen size={11} />
                                    {exam.totalQuestions || 50}টি প্রশ্ন
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={11} />
                                    {exam.durationMinutes || Math.max(1, Math.round((exam.totalQuestions || 50) * 0.6))} মিনিট
                                  </span>
                                  {exam.negativeMark ? (
                                    <>
                                      <span>•</span>
                                      <span>নেগেটিভ: -{exam.negativeMark}</span>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {!isEnrolled ? (
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/[0.05] text-gray-400 dark:text-gray-500 group-hover:text-red-500 transition-colors">
                                  <Lock size={14} strokeWidth={2} />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-gray-100 dark:bg-white/[0.08] text-gray-500 dark:text-gray-300 group-hover:bg-red-600 group-hover:text-white shadow-2xs">
                                  <FileText size={15} strokeWidth={2} />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
