import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Phone, 
  MessageCircle, 
  Check, 
  Calendar, 
  ShoppingCart, 
  Play, 
  Share2, 
  X,
  FileText,
  Send,
  RefreshCw,
  Video,
  Key,
  Clock
} from 'lucide-react';
import { masterEnglishCourseData } from '../data/masterEnglishCourseData';
import { syncCourseWithYouTube, DEFAULT_YT_API_KEY } from '../utils/youtubeSync';
import ProtectedPdfViewer from './ProtectedPdfViewer';
import ExamEngine from './ExamEngine';
import CheckoutModal from './CheckoutModal';
import Navbar from './Navbar';
import { initialData } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useEnrollmentStatus, grantCourseAccess } from '../utils/enrollmentService';

function getEmbedUrl(url) {
  if (!url) return '';
  if (url.includes('youtube.com/embed/') || url.includes('youtube-nocookie.com/embed/')) return url;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0`;
  }
  return url;
}

export default function BiologyCoursePage({ 
  data = {},
  selectedCourseId,
  onNavigateHome,
  onNavigateExams, 
  onNavigateStore,
  onNavigateAbout,
  onNavigateDevices,
  onNavigateOrders,
  onNavigatePolicies,
  onOpenAdmin,
  onLoginClick,
  onOpenLesson,
  onEnrollSuccess
}) {
  const { isDark } = useTheme();
  const siteSettings = data.siteSettings || {};

  const baseDefault = masterEnglishCourseData;

  // Find course from data.courses matching selectedCourseId or fallback to masterEnglishCourseData
  const foundCourse = (data.courses || []).find(c => 
    c.id === selectedCourseId || c.slug === selectedCourseId
  ) || masterEnglishCourseData;

  const baseCourse = {
    ...baseDefault,
    ...(foundCourse || {}),
    name: foundCourse?.title || foundCourse?.name || baseDefault.name,
    tagline: foundCourse?.tagline || foundCourse?.description || baseDefault.tagline,
    aboutText: foundCourse?.aboutText || foundCourse?.description || baseDefault.aboutText,
    totalClasses: foundCourse?.totalClasses || baseDefault.totalClasses,
    features: (foundCourse?.features && foundCourse.features.length > 0) ? foundCourse.features : baseDefault.features,
    supportPhone: foundCourse?.supportPhone || baseDefault.supportPhone,
    curriculum: (foundCourse?.curriculum && foundCourse.curriculum.length > 0) ? foundCourse.curriculum : baseDefault.curriculum,
    salePrice: foundCourse?.salePrice !== undefined ? foundCourse.salePrice : baseDefault.salePrice,
    regularPrice: foundCourse?.regularPrice !== undefined ? foundCourse.regularPrice : baseDefault.regularPrice,
    previewVideoUrl: foundCourse?.previewVideoUrl || baseDefault.previewVideoUrl || "https://www.youtube-nocookie.com/embed/zskTywWaXEE",
    category: foundCourse?.category || baseDefault.category,
    isFree: Boolean(foundCourse?.isFree ?? baseDefault.isFree),
    playlistId: foundCourse?.playlistId || baseDefault.playlistId || null
  };

  const [course, setCourse] = useState(baseCourse);
  const { currentUser } = useAuth();
  const isCourseEnrolled = useEnrollmentStatus(course, currentUser, data);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return siteSettings.youtubeApiKey || localStorage.getItem('eduhunters_yt_api_key') || DEFAULT_YT_API_KEY || '';
  });
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Update course when selectedCourseId changes
  useEffect(() => {
    setCourse(baseCourse);
  }, [selectedCourseId]);

  // Background auto-sync on mount if course has playlistId, no curriculum yet, and API key is present
  useEffect(() => {
    const key = siteSettings.youtubeApiKey || localStorage.getItem('eduhunters_yt_api_key') || DEFAULT_YT_API_KEY;
    const hasCurriculum = baseCourse.curriculum && baseCourse.curriculum.length > 0 && baseCourse.curriculum[0]?.chapters?.[0]?.lessons?.length > 0;
    if (baseCourse.playlistId && key && !hasCurriculum) {
      syncCourseWithYouTube(baseCourse, key, false)
        .then(updated => {
          if (updated && updated.curriculum) {
            setCourse(updated);
          }
        })
        .catch(err => console.warn('YouTube auto-sync note:', err));
    }
  }, [baseCourse.playlistId]);

  const handleManualSync = async () => {
    const key = siteSettings.youtubeApiKey || localStorage.getItem('eduhunters_yt_api_key') || apiKeyInput.trim() || DEFAULT_YT_API_KEY;
    if (!key) {
      setShowApiKeyModal(true);
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('ইউটিউব থেকে প্লেলিস্টের ভিডিও লোড হচ্ছে...');
    try {
      const updated = await syncCourseWithYouTube(course, key, true);
      if (updated && updated.curriculum) {
        setCourse(updated);
        setSyncStatusMsg(`✅ সফলভাবে সিঙ্ক সম্পন্ন! মোট ${updated.curriculum[0]?.chapters?.[0]?.lessons?.length || 0}টি ক্লাস পাওয়া গেছে।`);
        setTimeout(() => setSyncStatusMsg(''), 4000);
      }
    } catch (err) {
      setSyncStatusMsg(`❌ সিঙ্ক সমস্যা: ${err.message || 'API কী পরীক্ষা করুন।'}`);
      setTimeout(() => setSyncStatusMsg(''), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveApiKeyAndSync = async () => {
    if (!apiKeyInput.trim()) return;
    try {
      localStorage.setItem('eduhunters_yt_api_key', apiKeyInput.trim());
    } catch {}
    setShowApiKeyModal(false);
    handleManualSync();
  };

  const [expandedSections, setExpandedSections] = useState({ 1: true });
  const [expandedChapters, setExpandedChapters] = useState({ '1-0': true });
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showExamEngine, setShowExamEngine] = useState(false);

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

  const toggleSection = (secId) => {
    setExpandedSections(prev => ({
      ...prev,
      [secId]: !prev[secId]
    }));
  };

  const toggleChapter = (key) => {
    setExpandedChapters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className={`min-h-screen pb-20 lg:pb-12 font-sans antialiased transition-colors duration-300 selection:bg-[#e11438] selection:text-white ${
      isDark ? 'bg-transparent text-gray-100' : 'bg-[#F8F9FA] text-[#111827]'
    }`}>
      {/* Shared Sticky Navbar */}
      <Navbar 
        activePage="courses"
        siteSettings={siteSettings}
        onNavigateHome={onNavigateHome}
        onNavigateCourse={() => {}}
        onNavigateExams={onNavigateExams}
        onNavigateStore={onNavigateStore}
        onNavigateAbout={onNavigateAbout}
        onNavigateDevices={onNavigateDevices}
        onNavigateOrders={onNavigateOrders}
        onNavigatePolicies={onNavigatePolicies}
        onOpenAdmin={onOpenAdmin}
        onLoginClick={onLoginClick}
      />

      {/* Main Course Content with clearance */}
      <main className="pt-20 md:pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Main Details Column */}
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            
            {/* Hero Banner */}
            <div className={`eh-course-hero relative overflow-hidden rounded-2xl p-6 md:p-10 text-white shadow-lg transition-colors duration-300 ${
              isDark 
                ? 'bg-gradient-to-r from-[#3d0711] via-[#1f0309] to-[#0d0104] border border-[#e11438]/25' 
                : 'bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#991b1b] border border-red-700/20'
            }`}>
              <div className="relative z-10">
                <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-2">
                  {course.name}
                </h1>
                <p className="text-sm md:text-base text-white/90 mb-5 max-w-2xl font-normal">
                  {course.tagline}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    isDark ? 'border border-[#e11438]/30 bg-[#160408] text-gray-200' : 'border border-white/30 bg-white/20 text-white'
                  }`}>
                    <svg className={`w-3.5 h-3.5 ${isDark ? 'text-[#ff6b8b]' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    {course.level}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    isDark ? 'border border-[#e11438]/30 bg-[#160408] text-gray-200' : 'border border-white/30 bg-white/20 text-white'
                  }`}>
                    <svg className={`w-3.5 h-3.5 ${isDark ? 'text-[#ff6b8b]' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z"></path></svg>
                    {course.studentsCount} শিক্ষার্থী
                  </span>
                </div>
              </div>
            </div>

            {/* Course About Box */}
            <div className={`rounded-2xl p-6 md:p-7 transition-all border ${
              isDark 
                ? 'border-[#e11438]/25 bg-[#140307]/80 shadow-[0_8px_30px_rgba(0,0,0,0.4)]' 
                : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                  isDark ? 'bg-[#28050e] border border-[#e11438]/30 text-[#ff3b61]' : 'bg-red-50 text-[#dc2626] border border-red-100'
                }`}>
                  <BookOpen className="w-5 h-5" />
                </span>
                <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>কোর্স সম্পর্কে</h2>
              </div>
              <div className={`text-sm leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {course.aboutText}
              </div>
            </div>

            {/* Recorded Classes Accordion */}
            <div id="curriculum-section" className={`rounded-xl p-6 md:p-8 border transition-all ${
              isDark 
                ? 'bg-[#120407]/90 shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-[#e11438]/20' 
                : 'bg-white shadow-sm border-gray-200'
            }`}>
              <div className="mb-6">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>রেকর্ডেড ক্লাস</h2>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{course.totalClasses}</p>
              </div>

              <div className="space-y-4">
                {course.curriculum.map((section) => {
                  const isOpen = expandedSections[section.id];
                  return (
                    <div key={section.id} className={`rounded-xl overflow-hidden border ${
                      isDark ? 'border-[#e11438]/20 bg-[#160408]' : 'border-gray-200 bg-white'
                    }`}>
                      <button 
                        className={`w-full flex items-center justify-between gap-2 p-4 transition-colors text-left border-none cursor-pointer ${
                          isDark ? 'bg-[#1b050d] hover:bg-[#250713]' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`flex items-center justify-center w-8 h-8 rounded-lg font-semibold text-sm shrink-0 border ${
                            isDark ? 'bg-[#28060f] border-[#e11438]/30 text-[#ff6b8b]' : 'bg-red-50 border-red-100 text-[#dc2626]'
                          }`}>
                            {section.id}
                          </span>
                          <div className="text-left min-w-0">
                            <h3 className={`font-semibold text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                              {section.name}
                            </h3>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{section.summary}</p>
                          </div>
                        </div>
                        <svg className={`w-5 h-5 transition-transform duration-300 ease-in-out shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'} ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>

                      <div className={`smooth-accordion-grid border-t transition-colors ${isDark ? 'border-[#e11438]/20' : 'border-gray-200'} ${isOpen ? 'is-open' : ''}`}>
                        <div className={`smooth-accordion-inner divide-y ${isDark ? 'divide-[#e11438]/10' : 'divide-gray-100'}`}>
                          {((section.lessons && section.lessons.length > 0)
                            ? section.lessons
                            : (section.chapters?.flatMap(c => c.lessons || []) || [])
                          ).map((lesson, lIdx) => {
                            const isObj = typeof lesson === 'object' && lesson !== null;
                            const title = isObj ? lesson.title : lesson;
                            const duration = isObj ? lesson.duration : null;
                            const isFree = isObj ? Boolean(lesson.isFree) : false;
                            const isUnlocked = isFree || isCourseEnrolled;
                            const videoUrl = isObj ? lesson.videoUrl : null;
                            const pdfUrl = isObj ? lesson.pdfUrl : null;

                            return (
                              <div 
                                key={lIdx} 
                                className={`group flex items-center justify-between p-3.5 pl-6 sm:pl-8 transition-all cursor-pointer ${
                                  isUnlocked 
                                    ? (isDark ? 'bg-[#1c080e]/60 hover:bg-[#280a13]' : 'bg-white hover:bg-red-50/50') 
                                    : (isDark ? 'hover:bg-[#1a0409]' : 'hover:bg-gray-100/60')
                                }`}
                                onClick={() => {
                                  if (isUnlocked) {
                                    if (onOpenLesson) {
                                      onOpenLesson(course.id || course.slug || selectedCourseId, {
                                        title,
                                        videoUrl: videoUrl || course.previewVideoUrl,
                                        pdfUrl,
                                        duration,
                                        lessonIdx: lIdx
                                      });
                                    }
                                  } else {
                                    handleOpenCheckout();
                                  }
                                }}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${
                                    isUnlocked 
                                      ? 'bg-red-100 text-red-600 shadow-2xs' 
                                      : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-500')
                                  }`}>
                                    {isUnlocked ? (
                                      <Play className="w-3.5 h-3.5 fill-red-600 text-red-600 ml-0.5" />
                                    ) : (
                                      <Lock className="w-3.5 h-3.5" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`text-sm font-semibold truncate transition-colors ${isDark ? 'text-gray-100 group-hover:text-red-400' : 'text-[#111827] group-hover:text-[#dc2626]'}`}>{title}</p>
                                    {pdfUrl && (
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-blue-500 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">📄 PDF নোট</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="shrink-0 ml-3 flex items-center gap-2">
                                  {duration && (
                                    <div className={`flex items-center gap-1.5 text-xs font-mono font-medium ${
                                      isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                                      <span>{duration}</span>
                                    </div>
                                  )}
                                  {!isUnlocked && (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>লক</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Support Box */}
            <div className={`rounded-3xl p-5 sm:p-6 transition-all space-y-4 border ${
              isDark 
                ? 'border-[#e11438]/25 bg-[#140307]/80' 
                : 'border-red-100 bg-white shadow-xs hover:shadow-md'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border ${
                  isDark ? 'bg-[#2a060e] text-[#ff3b61] border-[#e11438]/30' : 'bg-red-50 text-[#dc2626] border-red-100/80 shadow-2xs'
                }`}>
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-black leading-tight mb-0.5 ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                    সাপোর্টে যোগাযোগ করুন
                  </h3>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    কোর্স সম্পর্কিত যেকোনো সমস্যার সমাধানে আমাদের সাথে যোগাযোগ করুন
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a 
                  href={`tel:${course.supportPhone}`} 
                  className={`flex items-center justify-center sm:justify-start gap-3 rounded-2xl px-4 py-3 transition-all text-decoration-none group cursor-pointer border ${
                    isDark 
                      ? 'border-[#e11438]/30 bg-[#1c050c] hover:bg-[#250711]' 
                      : 'border-red-200/80 bg-red-50/60 hover:bg-red-100/80'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#dc2626] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-4 h-4 text-[#dc2626]" />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-black text-[#dc2626] leading-tight font-mono tracking-wide">{course.supportPhone}</span>
                    <span className="block text-[11px] text-gray-500 font-medium">কল করুন (9AM - 11PM)</span>
                  </div>
                </a>

                <a 
                  href={`https://wa.me/88${course.supportPhone}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className={`flex items-center justify-center sm:justify-start gap-3 rounded-2xl px-4 py-3 transition-all text-decoration-none group cursor-pointer border ${
                    isDark 
                      ? 'border-emerald-500/30 bg-[#06180f] hover:bg-[#0b2417]' 
                      : 'border-emerald-200/80 bg-emerald-50/60 hover:bg-emerald-100/80'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-black text-emerald-600 leading-tight">WhatsApp এ মেসেজ করুন</span>
                    <span className="block text-[11px] text-gray-500 font-medium">দ্রুত উত্তর পাবেন</span>
                  </div>
                </a>
              </div>
            </div>

          </div>

          {/* Right Sticky Sidebar Column */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className={`rounded-xl overflow-hidden border transition-all ${
                isDark 
                  ? 'bg-[#120407]/95 border-[#e11438]/25 shadow-2xl' 
                  : 'bg-white border-gray-200 shadow-sm'
              }`}>
                
                {/* YouTube Video Preview */}
                <div className="relative aspect-video bg-black border-b border-black/10 overflow-hidden">
                  <iframe 
                    src={getEmbedUrl(course.previewVideoUrl) || "https://www.youtube-nocookie.com/embed/zskTywWaXEE?rel=0&modestbranding=1"} 
                    title="Course Preview" 
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>

                <div className={`px-4 py-4 border-b ${isDark ? 'border-[#e11438]/15' : 'border-gray-100'}`}>
                  <h2 className={`text-xl text-center sm:text-2xl font-black leading-tight break-words max-w-full ${
                    isDark ? 'text-white' : 'text-[#111827]'
                  }`}>
                    {course.name}
                  </h2>
                </div>

                <div className="p-4 sm:p-6">
                  {/* Features 2x2 Grid */}
                  <div className="mb-6">
                    <h3 className={`text-sm font-black mb-3 ${isDark ? 'text-white' : 'text-[#111827]'}`}>এই কোর্সে যা থাকছে</h3>
                    <div className="grid grid-cols-2 gap-2.5">
                      {course.features.map((feat, i) => (
                        <div key={i} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                          isDark ? 'border-[#e11438]/20 bg-[#160408]' : 'border-gray-200 bg-white'
                        }`}>
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dc2626]/10">
                            <Check className="w-3 h-3 text-[#dc2626]" strokeWidth={3} />
                          </span>
                          <span className={`text-xs font-semibold leading-tight ${isDark ? 'text-gray-200' : 'text-[#111827]'}`}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3 Metric Tiles */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className={`rounded-xl p-2 sm:p-3 flex items-center gap-2 text-left border ${
                      isDark ? 'border-[#e11438]/20 bg-[#19050d]' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center">
                        <svg className={`w-7 h-7 ${isDark ? 'text-[#ff6b8b]' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs text-gray-400 font-bold truncate">ভর্তি সংখ্যা</div>
                        <div className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>{course.studentsCount || "১২৫০+"}</div>
                      </div>
                    </div>

                    <div className={`rounded-xl p-2 sm:p-3 flex items-center gap-2 text-left border ${
                      isDark ? 'border-[#e11438]/20 bg-[#19050d]' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center">
                        <svg className={`w-7 h-7 ${isDark ? 'text-[#ff6b8b]' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs text-gray-400 font-bold truncate">ক্লাস শুরু</div>
                        <div className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-white' : 'text-[#111827]'}`}>চলমান ব্যাচ</div>
                      </div>
                    </div>
                  </div>

                  {/* Price Tag */}
                  {!isCourseEnrolled && (
                    <div className="flex items-center justify-center gap-3 mb-6">
                      {(course.isFree || Number(course.salePrice) === 0) ? (
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-4xl font-black text-emerald-500 drop-shadow-sm tracking-tight">FREE</span>
                          {course.regularPrice && (
                            <span className="text-xl text-gray-400 line-through font-bold">৳{Number(course.regularPrice).toLocaleString()}</span>
                          )}
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300/40">
                            ১০০% ফ্রি
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className={`text-4xl font-black ${isDark ? 'text-[#ff3b61]' : 'text-[#dc2626]'}`}>৳{Number(course.salePrice || 0).toLocaleString()}</span>
                          {course.regularPrice && (
                            <span className="text-xl text-gray-400 line-through font-bold">৳{Number(course.regularPrice).toLocaleString()}</span>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3">
                    {isCourseEnrolled ? (
                      <button 
                        onClick={() => {
                          if (onOpenLesson) {
                            onOpenLesson(course.id || course.slug || selectedCourseId, 0);
                          } else {
                            const elem = document.getElementById('curriculum-section');
                            if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="flex w-full items-center justify-center gap-2 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl transition-all border-none cursor-pointer shadow-lg shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] group"
                      >
                        <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                        ক্লাস শুরু করুন
                      </button>
                    ) : (course.isFree || Number(course.salePrice) === 0) ? (
                      <button 
                        onClick={() => {
                          if (onOpenLesson) {
                            onOpenLesson(course.id || course.slug || selectedCourseId, 0);
                          } else {
                            const elem = document.getElementById('curriculum-section');
                            if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="flex w-full items-center justify-center gap-2 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl transition-all border-none cursor-pointer shadow-lg shadow-emerald-600/30 group"
                      >
                        <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                        ফ্রি ক্লাস শুরু করুন
                      </button>
                    ) : (
                      <button 
                        onClick={handleOpenCheckout}
                        className="flex w-full items-center justify-center gap-2 px-4 py-3.5 bg-[#dc2626] hover:bg-red-700 text-white font-bold text-base rounded-xl transition-all border-none cursor-pointer shadow-[0_0_25px_rgba(220,38,38,0.45)] hover:shadow-[0_0_35px_rgba(220,38,38,0.65)] hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        কোর্সটি কিনুন
                      </button>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer (Hidden on mobile) */}
      <div className="hidden sm:block">
        {isDark ? (
          <footer className="bg-gradient-to-b from-[#180408] via-[#0d0205] to-[#050102] text-white border-t border-[#e11438]/25 mt-16 py-10 text-center text-xs text-gray-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <p className="font-semibold text-[#ff3b61] mb-1">EDU HUNTERS · Premier Edtech Learning Platform</p>
                <p>© 2026 Edu Hunters. All rights reserved.</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('privacy') : (window.location.href = '/privacy-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Privacy Policy</button>
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Terms of Use</button>
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Refund Policy</button>
              </div>
            </div>
          </footer>
        ) : (
          <footer className="bg-[#dc2626] eh-dots-light text-white border-t border-white/[0.06] mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20">
                <div className="flex flex-col justify-between gap-8">
                  <div>
                    <a href="/" className="inline-flex items-center gap-2 mb-6 text-decoration-none">
                      <span className="inline-flex items-center justify-center bg-white rounded-2xl px-4 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.18)]">
                        <img 
                          src="/logo.png" 
                          alt="Edu Hunters" 
                          className="h-8 w-auto object-contain"
                        />
                        <span className="ml-2 font-black text-xl text-[#dc2626]">
                          EDU <span className="text-[#111827]">HUNTERS</span>
                        </span>
                      </span>
                    </a>
                    <p className="text-sm text-white/80 max-w-sm">
                      Academic to admission EDU HUNTERS with you. বাংলাদেশের সবচেয়ে নির্ভরযোগ্য মেডিকেল ও একাডেমিক লার্নিং প্ল্যাটফর্ম।
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-5">দ্রুত লিঙ্ক</p>
                    <ul className="space-y-3 list-none p-0 m-0">
                      <li><a href="#courses" onClick={(e) => { e.preventDefault(); if (onNavigateHome) onNavigateHome(); }} className="text-sm text-white/70 hover:text-white transition-colors text-decoration-none">All Courses</a></li>
                      <li><a href="#orders" onClick={(e) => { e.preventDefault(); if (onNavigateOrders) onNavigateOrders(); }} className="text-sm text-white/70 hover:text-white transition-colors text-decoration-none">Order History</a></li>
                      <li><button onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')} className="text-sm text-white/70 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer">Terms & Conditions</button></li>
                      <li><button onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')} className="text-sm text-white/70 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer">Refund Policy</button></li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-5">আমাদের ব্যাচ সমূহ</p>
                    <ul className="space-y-3 list-none p-0 m-0">
                      <li><span className="text-sm text-white font-semibold">Mastering Text Book Biology</span></li>
                      <li><span className="text-sm text-white/70">Mastering Text Book Chemistry</span></li>
                      <li><span className="text-sm text-white/70">Mastering Text Book Physics</span></li>
                      <li><span className="text-sm text-white/70">GK English Batch</span></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.1] pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-xs text-white/60">© 2026 Edu Hunters. All rights reserved.</p>
                <div className="flex items-center gap-6">
                  <button onClick={() => onNavigatePolicies ? onNavigatePolicies('privacy') : (window.location.href = '/privacy-policy')} className="text-xs text-white/60 hover:text-white bg-transparent border-none p-0 cursor-pointer">Privacy Policy</button>
                  <button onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')} className="text-xs text-white/60 hover:text-white bg-transparent border-none p-0 cursor-pointer">Terms of Use</button>
                  <button onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')} className="text-xs text-white/60 hover:text-white bg-transparent border-none p-0 cursor-pointer">Refund Policy</button>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Protected PDF Modal */}
      {showPdfViewer && (
        <ProtectedPdfViewer 
          bundle={{
            title: "Mastering Biology টেক্সটবুক এরিয়া মার্কিং নোট",
            pdfPageCount: 84
          }}
          userPhone="01712-345678"
          onClose={() => setShowPdfViewer(false)}
        />
      )}

      {/* Interactive Exam Modal */}
      {showExamEngine && (
        <ExamEngine 
          exam={initialData.exams[0]}
          onClose={() => setShowExamEngine(false)}
        />
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal 
          bundle={{
            title: course.name || course.title || "Mastering Text Book Biology",
            price: Number(course.salePrice) || 1199,
            originalPrice: Number(course.regularPrice) || (Number(course.salePrice) * 2)
          }}
          siteSettings={siteSettings}
          onSuccess={(trxData) => {
            if (onEnrollSuccess) onEnrollSuccess(trxData);
          }}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {/* YouTube Data API v3 Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all ${
            isDark ? 'bg-[#150409] border-[#e11438]/30 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">YouTube API v3 Key</h3>
                <p className="text-xs text-gray-400">অটোমেটিক প্লেলিস্ট ভিডিও সিঙ্কিং</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              প্লেলিস্টে নতুন ভিডিও আপলোড হওয়ার সাথে সাথে কোর্সে যোগ করতে আপনার একটি ফ্রি Google YouTube Data API v3 কী প্রয়োজন (দৈনিক ১০,০০০ ফ্রি রিকোয়েস্ট)।
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-300">
                  API Key
                </label>
                <input
                  type="text"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none transition-all ${
                    isDark
                      ? 'bg-[#220710] border-[#e11438]/30 text-white focus:border-red-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500 focus:bg-white'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-xl text-[11px] leading-relaxed border ${
                isDark ? 'bg-[#220710]/60 border-[#e11438]/20 text-gray-300' : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                <p className="font-bold mb-1">কীভাবে বিনামূল্যে API Key পাবেন?</p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>Google Cloud Console-এ যান</li>
                  <li>"YouTube Data API v3" এনাবল করুন</li>
                  <li>Credentials থেকে Create API Key চাপুন ও কপি করে এখানে পেস্ট করুন</li>
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                  isDark ? 'border-gray-700 bg-transparent text-gray-300 hover:bg-gray-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveApiKeyAndSync}
                disabled={!apiKeyInput.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#dc2626] hover:bg-red-700 disabled:opacity-50 text-white border-none cursor-pointer transition-all shadow-md flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>সংরক্ষণ ও সিঙ্ক করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

