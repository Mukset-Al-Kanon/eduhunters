import React, { useState } from 'react';
import { examsData, examSubjects } from '../data/examsData';
import ExamEngine from './ExamEngine';
import SureShotExamSystem from './SureShotExamSystem';
import Navbar from './Navbar';
import { initialData } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';

export default function ExamsPage({ 
  data = {},
  selectedCategory,
  isFromBundle = false,
  onBackToBundle = null,
  onNavigateHome, 
  onNavigateCourse, 
  onNavigateStore, 
  onNavigateAbout, 
  onNavigateDevices,
  onNavigateOrders,
  onNavigatePolicies,
  onOpenAdmin, 
  onLoginClick 
}) {
  const { isDark } = useTheme();
  const siteSettings = data.siteSettings || initialData.siteSettings;
  const [examMode, setExamMode] = useState('sureshot'); // 'sureshot' | 'general'
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [activeLiveExam, setActiveLiveExam] = useState(null);

  const filteredExams = examsData.filter(exam => {
    if (selectedSubject === 'All Subjects') return true;
    return exam.subject === selectedSubject || exam.tag === selectedSubject;
  });

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 selection:bg-[#e11438] selection:text-white ${
      isDark ? 'bg-transparent text-gray-100' : 'bg-[#f3f4f6] text-[#111827]'
    }`}>
      {/* Shared Sticky Navbar */}
      <Navbar 
        activePage="exams"
        siteSettings={siteSettings}
        onNavigateHome={onNavigateHome}
        onNavigateCourse={onNavigateCourse}
        onNavigateExams={() => {}}
        onNavigateStore={onNavigateStore}
        onNavigateAbout={onNavigateAbout}
        onNavigateDevices={onNavigateDevices}
        onNavigateOrders={onNavigateOrders}
        onNavigatePolicies={onNavigatePolicies}
        onOpenAdmin={onOpenAdmin}
        onLoginClick={onLoginClick}
      />

      {/* Main Exams Content */}
      <main className="pt-16">
        
        {/* When examMode === 'sureshot', render full interactive SureShotExamSystem with Category Cards as default */}
        {examMode === 'sureshot' ? (
          <SureShotExamSystem 
            onBackToCourses={onNavigateCourse} 
            initialStep={selectedCategory ? 'category_detail' : 'category_cards'} 
            initialCategory={selectedCategory || null}
            siteSettings={siteSettings}
            customExamBatches={data?.examBatches}
            isFromBundle={isFromBundle}
            onBackToBundle={onBackToBundle}
            onLoginClick={onLoginClick}
          />
        ) : (
          <div>
            {/* Hero Banner for Board Exams Mode */}
            <div className={`eh-course-hero relative overflow-hidden transition-colors duration-300 ${
              isDark 
                ? 'bg-gradient-to-r from-[#3d0711] via-[#1f0309] to-[#0d0104] border-b border-[#e11438]/20' 
                : 'bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#991b1b] border-b border-red-700/20'
            }`}>
              <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-white">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">বোর্ড এক্সাম রুটিন ও প্রশ্ন</h1>
                  <p className="text-white/80 mt-1 text-xs sm:text-sm font-normal">
                    এইচএসসি ও বোর্ড পরীক্ষার সিলেবাস অনুযায়ী সাজানো রুটিন।
                  </p>
                </div>

                {/* Back to Master Hub Button */}
                <button
                  onClick={() => setExamMode('sureshot')}
                  className="px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer bg-white text-[#dc2626] hover:bg-gray-100 shadow-md border-none"
                >
                  ← ক্যাটাগরিভিত্তিক এক্সাম হাবে ফিরে যান
                </button>
              </div>
            </div>
          /* Content Container for General / HSC Exams */
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">
          
          {/* All Classes Filter Pill */}
          <div className="flex flex-wrap gap-2">
            <button 
              className={`rounded-full font-semibold border transition-all duration-150 px-4 py-2 text-sm cursor-pointer ${
                selectedClass === 'All Classes' 
                  ? (isDark 
                      ? 'bg-gradient-to-r from-[#e11438] to-[#9b0e27] text-white border-[#ff3358]/40 shadow-[0_4px_16px_rgba(225,20,56,0.35)]' 
                      : 'bg-[#dc2626] text-white border-[#dc2626] shadow-sm')
                  : (isDark 
                      ? 'bg-[#140307]/80 text-gray-300 border-[#e11438]/20 hover:border-[#e11438]/60 hover:text-white' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:text-red-600')
              }`}
              onClick={() => setSelectedClass('All Classes')}
            >
              All Classes
            </button>
          </div>

          {/* Subjects Filter Pills Horizontal List */}
          <div className="flex flex-wrap gap-2">
            {examSubjects.map((sub, idx) => {
              const isActive = selectedSubject === sub;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedSubject(sub)}
                  className={`rounded-full font-semibold border transition-all duration-150 px-3 py-1.5 text-xs cursor-pointer ${
                    isActive 
                      ? (isDark 
                          ? 'bg-gradient-to-r from-[#e11438] to-[#9b0e27] text-white border-[#ff3358]/40 shadow-[0_4px_16px_rgba(225,20,56,0.35)]' 
                          : 'bg-[#dc2626] text-white border-[#dc2626] shadow-sm')
                      : (isDark 
                          ? 'bg-[#140307]/80 text-gray-300 border-[#e11438]/20 hover:border-[#e11438]/60 hover:text-white' 
                          : 'bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:text-red-600')
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>

          {/* Exams Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredExams.map((exam) => (
              <article 
                key={exam.id}
                className={`rounded-2xl p-5 transition-all border ${
                  isDark 
                    ? 'bg-[#120407]/90 border-[#e11438]/20 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-[#e11438]/60' 
                    : 'bg-white border-gray-200 shadow-sm hover:border-red-300 hover:shadow-md'
                }`}
              >
                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    exam.isLive 
                      ? (isDark ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                      : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')
                  }`}>
                    {exam.status}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isDark ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {exam.type}
                  </span>
                  {exam.tag && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isDark ? 'bg-[#2a060e] text-[#ff6b8b] border border-[#e11438]/30' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {exam.tag}
                    </span>
                  )}
                </div>

                {/* Title & Desc */}
                <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                  {exam.title}
                </h2>
                <p className={`text-sm line-clamp-2 mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {exam.desc}
                </p>

                {/* 3 Metrics (Questions, Marks, Minutes) */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className={`rounded-xl p-3 border ${
                    isDark ? 'bg-[#1b050c] border-[#e11438]/15' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111827]'}`}>{exam.questions}</p>
                    <p className="text-xs text-gray-500">Questions</p>
                  </div>
                  <div className={`rounded-xl p-3 border ${
                    isDark ? 'bg-[#1b050c] border-[#e11438]/15' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111827]'}`}>{exam.marks}</p>
                    <p className="text-xs text-gray-500">Marks</p>
                  </div>
                  <div className={`rounded-xl p-3 border ${
                    isDark ? 'bg-[#1b050c] border-[#e11438]/15' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-[#111827]'}`}>{exam.minutes}</p>
                    <p className="text-xs text-gray-500">Minutes</p>
                  </div>
                </div>

                {/* Starts / Ends Timeline */}
                <div className={`text-xs mb-4 space-y-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>Starts: {exam.starts}</p>
                  <p>Ends: {exam.ends}</p>
                </div>

                {/* Card Action Buttons */}
                <div className="flex flex-wrap gap-2 items-center">
                  {exam.isLive ? (
                    <button 
                      onClick={() => setActiveLiveExam(initialData.exams[0])}
                      className="px-4 py-2 rounded-xl bg-[#dc2626] text-white font-semibold hover:brightness-110 text-sm border-none cursor-pointer shadow-md"
                    >
                      Login to Start
                    </button>
                  ) : null}

                  <button 
                    onClick={() => setActiveLiveExam(initialData.exams[0])}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
                      isDark 
                        ? 'border border-[#e11438]/30 text-gray-200 hover:bg-[#e11438]/10 hover:text-white bg-[#160408]' 
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    Leaderboard
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      )}
      </main>

      {/* Footer (Hidden on mobile and during sureshot exams) */}
      {examMode !== 'sureshot' && (
        <div className="hidden sm:block">
          {isDark ? (
            <footer className="mt-20 border-t border-[#e11438]/20 bg-gradient-to-b from-[#140307] to-[#070102] py-8 text-center text-xs text-gray-400">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="font-medium text-[#ff3b61] mb-1">EDU HUNTERS · Premier Edtech Learning Platform</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => onNavigatePolicies ? onNavigatePolicies('privacy') : (window.location.href = '/privacy-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Privacy Policy</button>
                  <button onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Terms of Use</button>
                  <button onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Refund Policy</button>
                </div>
              </div>
            </footer>
          ) : (
            <footer className="bg-[#dc2626] text-white border-t border-white/[0.06] mt-20">
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
                        <li><a href="#courses" onClick={(e) => { e.preventDefault(); onNavigateCourse(); }} className="text-sm text-white/70 hover:text-white transition-colors text-decoration-none">All Courses</a></li>
                        <li><a href="#orders" onClick={(e) => { e.preventDefault(); onNavigateOrders && onNavigateOrders(); }} className="text-sm text-white/70 hover:text-white transition-colors text-decoration-none">Order History</a></li>
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
      )}

      {/* Interactive Exam Modal if opened */}
      {activeLiveExam && (
        <ExamEngine 
          exam={activeLiveExam}
          onClose={() => setActiveLiveExam(null)}
        />
      )}
    </div>
  );
}

