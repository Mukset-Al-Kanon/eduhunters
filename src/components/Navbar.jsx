import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ThemeToggleSwitch from './ThemeToggleSwitch';

export default function Navbar({
  activePage = 'home', // 'home' | 'courses' | 'exams' | 'store' | 'about' | 'devices' | 'orders'
  siteSettings = {},
  courseTitle = null,
  onBackCourse = null,
  onNavigateHome,
  onNavigateCourse,
  onNavigateExams,
  onNavigateStore,
  onNavigateAbout,
  onNavigateDevices,
  onNavigateOrders,
  onNavigatePolicies,
  onOpenAdmin,
  onLoginClick
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    if (isDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const handleNav = (action) => {
    setIsDrawerOpen(false);
    if (action) action();
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      bnLabel: 'হোম পেইজ',
      action: onNavigateHome,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
    {
      id: 'courses',
      label: 'Courses',
      bnLabel: 'কোর্সসমূহ',
      badge: '2 Courses',
      action: () => onNavigateCourse && onNavigateCourse(),
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
          <path d="M6 6h10M6 10h10"></path>
        </svg>
      )
    },
    {
      id: 'exams',
      label: 'Exam Batch',
      bnLabel: 'এক্সাম ব্যাচ',
      action: onNavigateExams,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 11 3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      )
    },
    {
      id: 'store',
      label: 'Store',
      bnLabel: 'বই ও নোট স্টোর',
      action: onNavigateStore,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="8" cy="21" r="1"></circle>
          <circle cx="19" cy="21" r="1"></circle>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
        </svg>
      )
    },
    {
      id: 'about',
      label: 'About',
      bnLabel: 'আমাদের সম্পর্কে',
      action: onNavigateAbout,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4M12 8h.01"></path>
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Sticky Main Top Navigation Bar */}
      <nav 
        id="main-navbar"
        style={{ viewTransitionName: 'main-navbar' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-250 select-none ${
          isDark 
            ? 'bg-[#0d0205]/92 backdrop-blur-md border-b border-[#e11438]/20 shadow-[0_4px_30px_rgba(0,0,0,0.7)]' 
            : 'bg-white/95 backdrop-blur-md border-b border-[#e5e7eb] shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Brand Logo & Desktop Nav Links OR Course Title when in Course Player */}
          {courseTitle ? (
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 max-w-[70%] sm:max-w-[75%] md:max-w-[80%]">
              <button 
                onClick={() => handleNav(onBackCourse || onNavigateCourse || onNavigateHome)} 
                className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 active:scale-95 ${
                  isDark 
                    ? 'bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white border-white/10 hover:border-red-500/40' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-950 border-gray-200'
                }`}
                title="Back to Course"
                aria-label="Back to Course"
              >
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>

              <button 
                onClick={() => handleNav(onNavigateHome)} 
                className="w-8 h-8 rounded-full overflow-hidden shrink-0 hidden xs:flex items-center justify-center border-none bg-transparent cursor-pointer p-0 group"
                title="Edu Hunters Home"
              >
                <img 
                  src={siteSettings.logoUrl || "/logo.png"} 
                  alt={siteSettings.siteName || "Edu Hunters"} 
                  className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                />
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-sm sm:text-base md:text-lg font-black tracking-tight truncate ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {courseTitle}
                </span>
                <span className="hidden md:inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 shrink-0">
                  Course
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6 lg:gap-8 min-w-0">
              <button 
                onClick={() => handleNav(onNavigateHome)} 
                className="flex items-center gap-2 shrink-0 group border-none bg-transparent cursor-pointer p-0"
                title="Home"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.05] border-none outline-none">
                  <img 
                    src={siteSettings.logoUrl || "/logo.png"} 
                    alt={siteSettings.siteName || "Edu Hunters"} 
                    className="w-full h-full object-cover rounded-full border-none outline-none"
                  />
                </div>
                <span className={`text-lg sm:text-2xl font-black tracking-tight whitespace-nowrap ${
                  isDark ? 'text-[#ff2e55]' : 'text-[#dc2626]'
                }`}>
                  {siteSettings.siteName ? (
                    <>
                      {siteSettings.siteName.split(' ')[0]}{' '}
                      <span className={isDark ? 'text-white' : 'text-[#111827]'}>
                        {siteSettings.siteName.split(' ').slice(1).join(' ') || ''}
                      </span>
                    </>
                  ) : (
                    <>EDU <span className={isDark ? 'text-white' : 'text-[#111827]'}>HUNTERS</span></>
                  )}
                </span>
              </button>

              {/* Desktop Navigation Links (Hidden on Mobile) */}
              <div className="hidden sm:flex items-center gap-1.5 lg:gap-2">
                {navItems.map((item) => {
                  const isActive = activePage === item.id;
                  if (isActive) {
                    return (
                      <span 
                        key={item.id}
                        className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full text-white transition-all duration-300 ease-out ${
                          isDark 
                            ? 'bg-[#e11438] shadow-[0_6px_20px_rgba(225,20,56,0.45)]' 
                            : 'bg-[#dc2626] shadow-[0_6px_16px_rgba(220,38,38,0.32)]'
                        }`}
                      >
                        <span className="w-4 h-4 flex items-center justify-center text-white">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </span>
                    );
                  }
                  return (
                    <button 
                      key={item.id}
                      onClick={() => handleNav(item.action)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full transition-all duration-200 ease-out border-none bg-transparent cursor-pointer ${
                        isDark 
                          ? 'text-gray-300 hover:text-white hover:bg-white/10' 
                          : 'text-[#111827] hover:bg-[#f3f4f6]'
                      }`}
                    >
                      <span className={`w-4 h-4 flex items-center justify-center ${isDark ? 'text-gray-400' : 'text-[#4b5563]'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Desktop Quick Exam / Login or User Badge */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2">
                <button 
                  onClick={() => setIsDrawerOpen(true)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all border cursor-pointer ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 text-white border-white/15' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-200'
                  }`}
                  title="My Account"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="max-w-[120px] truncate">{currentUser.displayName || currentUser.email.split('@')[0]}</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={onLoginClick || onNavigateExams}
                className={`hidden sm:inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white rounded-full transition-all hover:scale-[1.03] active:scale-[0.97] border-none cursor-pointer ${
                  isDark 
                    ? 'bg-[#e11438] hover:bg-[#ff1744] shadow-[0_4px_16px_rgba(225,20,56,0.35)]' 
                    : 'bg-[#dc2626] hover:bg-[#b91c1c] shadow-sm'
                }`}
              >
                <span>Sign In</span>
              </button>
            )}

            {/* Profile Avatar Trigger Button that opens Right Side Menu Drawer */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full transition-all duration-200 active:scale-95 group cursor-pointer ${
                isDark 
                  ? 'bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.35)]' 
                  : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
              }`}
              aria-label="Open profile and menu"
              title="Profile Menu"
            >
              {/* Profile Avatar with subtle clean ring */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                <img
                  src={currentUser?.photoURL || "/avatar.jpg"}
                  alt="Profile"
                  className={`w-full h-full object-cover rounded-full ${
                    isDark ? 'ring-1 ring-white/20' : 'ring-1 ring-black/10'
                  }`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";
                  }}
                />
              </div>

              {/* Clean Vector Hamburger Menu Icon */}
              <svg 
                className={`w-4 h-4 transition-colors shrink-0 ${
                  isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-950'
                }`} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* RIGHT SIDE MENU DRAWER & BACKDROP */}
      <div 
        className={`fixed inset-0 z-[9999] select-none transition-[visibility] duration-300 ${
          isDrawerOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none delay-300'
        }`}
      >
        {/* Backdrop overlay with smooth fade in/out */}
        <div 
          onClick={() => setIsDrawerOpen(false)}
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out cursor-pointer ${
            isDrawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Slide-out Drawer Panel */}
        <div 
          className={`fixed inset-y-0 right-0 w-[295px] max-w-[85vw] flex flex-col justify-between p-6 sm:p-7 z-[10000] rounded-l-[36px] transition-[transform,background-color,border-color,color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-b from-[#2e050c] via-[#0f0305] to-[#070102] text-white shadow-[-16px_0_50px_rgba(0,0,0,0.9)] border-l border-[#e11438]/20' 
              : 'bg-white text-[#111827] shadow-[-16px_0_40px_rgba(0,0,0,0.15)] border-l border-gray-200'
          } ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Top Red Wine Ambient Radial Glow (Crossfades smoothly) */}
          <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#e11438]/20 rounded-full blur-[80px] pointer-events-none transition-opacity duration-500 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`} />

          {/* Top Section */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1 relative z-10">
            {/* Top Close Button & Notch */}
            <div className="flex items-center justify-between pb-2">
              <span className={`w-8 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-300'}`}></span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-none cursor-pointer ${
                  isDark 
                    ? 'bg-white/10 hover:bg-[#e11438]/20 text-gray-300 hover:text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                }`}
                title="Close"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Profile Avatar, Student Info & Theme Toggle Switch */}
            <div className="flex items-center justify-between gap-3 pt-2 pb-1">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-12 h-12 rounded-full overflow-hidden shrink-0 ${
                  isDark 
                    ? 'border border-[#e11438]/30 shadow-[0_0_15px_rgba(225,20,56,0.3)] bg-[#1a080d]' 
                    : 'border border-gray-200 shadow-sm bg-gray-50'
                }`}>
                  <img
                    src={currentUser?.photoURL || "/avatar.jpg"}
                    alt={currentUser?.displayName || "Edu Hunters Student"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80";
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <h2 className={`text-[17px] font-bold tracking-tight leading-tight truncate ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {currentUser ? (currentUser.displayName || currentUser.email.split('@')[0]) : 'Edu Hunters'}
                  </h2>
                  <p className={`text-xs mt-0.5 font-normal tracking-wide truncate ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {currentUser 
                      ? (currentUser.role === 'admin' ? '🛡️ Admin' : (currentUser.email || 'Student')) 
                      : 'Not signed in'}
                  </p>
                </div>
              </div>

              {/* Toggle switch directly at the very right side */}
              <ThemeToggleSwitch id="drawer-theme-toggle" className="shrink-0" />
            </div>

            {/* Sleek Divider Line */}
            <div className={`h-[1px] my-4 w-full shrink-0 ${
              isDark 
                ? 'bg-gradient-to-r from-transparent via-[#e11438]/30 to-transparent' 
                : 'bg-gray-200'
            }`}></div>

            {/* Menu Items */}
            <div className="flex flex-col space-y-4">
              {/* 1. Home */}
              <button
                onClick={() => handleNav(onNavigateHome)}
                className={`flex items-center justify-between text-left group bg-transparent border-none p-1.5 rounded-xl cursor-pointer transition-colors ${
                  activePage === 'home' 
                    ? (isDark ? 'text-white font-semibold' : 'text-[#dc2626] font-semibold bg-red-50/70') 
                    : (isDark ? 'text-gray-300 font-normal hover:text-white' : 'text-gray-700 font-normal hover:text-black hover:bg-gray-50')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors ${
                    activePage === 'home' ? (isDark ? 'text-[#ef4444]' : 'text-[#dc2626]') : (isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black')
                  }`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <span className="text-[15px] tracking-wide">হোম</span>
                </div>
              </button>

              {/* 2. Courses */}
              <button
                onClick={() => handleNav(onNavigateCourse)}
                className={`flex items-center justify-between text-left group bg-transparent border-none p-1.5 rounded-xl cursor-pointer transition-colors ${
                  activePage === 'courses' 
                    ? (isDark ? 'text-white font-semibold' : 'text-[#dc2626] font-semibold bg-red-50/70') 
                    : (isDark ? 'text-gray-300 font-normal hover:text-white' : 'text-gray-700 font-normal hover:text-black hover:bg-gray-50')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors ${
                    activePage === 'courses' ? (isDark ? 'text-[#ef4444]' : 'text-[#dc2626]') : (isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black')
                  }`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                      <path d="M6 6h10M6 10h10" />
                    </svg>
                  </div>
                  <span className="text-[15px] tracking-wide">কোর্সসমূহ</span>
                </div>
              </button>

              {/* 3. Online Exams Portal (with Yellow Badge) */}
              <button
                onClick={() => handleNav(onNavigateExams)}
                className={`flex items-center justify-between text-left group bg-transparent border-none p-1.5 rounded-xl cursor-pointer transition-colors ${
                  activePage === 'exams' 
                    ? (isDark ? 'text-white font-semibold' : 'text-[#dc2626] font-semibold bg-red-50/70') 
                    : (isDark ? 'text-gray-300 font-normal hover:text-white' : 'text-gray-700 font-normal hover:text-black hover:bg-gray-50')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors ${
                    activePage === 'exams' ? 'text-[#facc15]' : (isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black')
                  }`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 11 3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </div>
                  <span className="text-[15px] tracking-wide">এক্সাম ব্যাচ</span>
                </div>
              </button>

              {/* 4. Leaderboard */}
              <button
                onClick={() => handleNav(onNavigateExams)}
                className={`flex items-center justify-between text-left group bg-transparent border-none p-1.5 rounded-xl cursor-pointer transition-colors ${
                  activePage === 'leaderboard' 
                    ? (isDark ? 'text-white font-semibold' : 'text-[#dc2626] font-semibold bg-red-50/70') 
                    : (isDark ? 'text-gray-300 font-normal hover:text-white' : 'text-gray-700 font-normal hover:text-black hover:bg-gray-50')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors ${
                    activePage === 'leaderboard' ? 'text-yellow-400' : (isDark ? 'text-gray-400 group-hover:text-yellow-400' : 'text-gray-500 group-hover:text-amber-600')
                  }`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                      <path d="M4 22h16" />
                      <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
                      <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                    </svg>
                  </div>
                  <span className="text-[15px] tracking-wide">লিডারবোর্ড</span>
                </div>
              </button>

              {/* 5. Book Store */}
              <button
                onClick={() => handleNav(onNavigateStore)}
                className={`flex items-center justify-between text-left group bg-transparent border-none p-1.5 rounded-xl cursor-pointer transition-colors ${
                  activePage === 'store' 
                    ? (isDark ? 'text-white font-semibold' : 'text-[#dc2626] font-semibold bg-red-50/70') 
                    : (isDark ? 'text-gray-300 font-normal hover:text-white' : 'text-gray-700 font-normal hover:text-black hover:bg-gray-50')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors ${
                    activePage === 'store' ? (isDark ? 'text-[#ef4444]' : 'text-[#dc2626]') : (isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black')
                  }`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="21" r="1" />
                      <circle cx="19" cy="21" r="1" />
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                    </svg>
                  </div>
                  <span className="text-[15px] tracking-wide">বই ও স্টোর</span>
                </div>
              </button>

              {/* 6. Order History */}
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (onNavigateOrders) {
                    onNavigateOrders();
                  } else {
                    window.history.pushState(null, '', '/orders');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className={`flex items-center justify-between text-left group bg-transparent border-none p-1.5 rounded-xl cursor-pointer transition-colors ${
                  activePage === 'orders' 
                    ? (isDark ? 'text-white font-semibold' : 'text-[#dc2626] font-semibold bg-red-50/70') 
                    : (isDark ? 'text-gray-300 font-normal hover:text-white' : 'text-gray-700 font-normal hover:text-black hover:bg-gray-50')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors ${
                    activePage === 'orders' ? (isDark ? 'text-[#ef4444]' : 'text-[#dc2626]') : (isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black')
                  }`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                      <path d="M8 7h8" />
                      <path d="M8 11h8" />
                      <path d="M8 15h5" />
                    </svg>
                  </div>
                  <span className="text-[15px] tracking-wide">অর্ডার হিস্ট্রি</span>
                </div>
              </button>

              {/* 7. My Devices */}
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (onNavigateDevices) {
                    onNavigateDevices();
                  } else {
                    window.history.pushState(null, '', '/devices');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className={`flex items-center justify-between text-left group bg-transparent border-none p-1.5 rounded-xl cursor-pointer transition-colors ${
                  activePage === 'devices' 
                    ? (isDark ? 'text-white font-semibold' : 'text-[#dc2626] font-semibold bg-red-50/70') 
                    : (isDark ? 'text-gray-300 font-normal hover:text-white' : 'text-gray-700 font-normal hover:text-black hover:bg-gray-50')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors ${
                    isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black'
                  }`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="14" height="11" rx="2" />
                      <line x1="9" y1="14" x2="9" y2="18" />
                      <line x1="6" y1="18" x2="12" y2="18" />
                      <rect x="15" y="8" width="7" height="13" rx="2" />
                      <line x1="18.5" y1="18" x2="18.5" y2="18.01" />
                    </svg>
                  </div>
                  <span className="text-[15px] tracking-wide">আমার ডিভাইস</span>
                </div>
              </button>

              {/* 8. About Us */}
              <button
                onClick={() => handleNav(onNavigateAbout)}
                className={`flex items-center justify-between text-left group bg-transparent border-none p-1.5 rounded-xl cursor-pointer transition-colors ${
                  activePage === 'about' 
                    ? (isDark ? 'text-white font-semibold' : 'text-[#dc2626] font-semibold bg-red-50/70') 
                    : (isDark ? 'text-gray-300 font-normal hover:text-white' : 'text-gray-700 font-normal hover:text-black hover:bg-gray-50')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors ${
                    activePage === 'about' ? (isDark ? 'text-[#ef4444]' : 'text-[#dc2626]') : (isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black')
                  }`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </div>
                  <span className="text-[15px] tracking-wide">আমাদের সম্পর্কে</span>
                </div>
              </button>

              {/* 9. Support & Helpline */}
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  const cleanPhone = (siteSettings?.contactPhone || '8801700000000').replace(/[^0-9]/g, '');
                  window.open(`https://wa.me/${cleanPhone}`, '_blank');
                }}
                className={`flex items-center justify-between text-left group bg-transparent border-none p-1.5 rounded-xl cursor-pointer transition-colors ${
                  isDark ? 'text-gray-300 font-normal hover:text-white' : 'text-gray-700 font-normal hover:text-black hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors ${isDark ? 'text-gray-400 group-hover:text-green-400' : 'text-gray-500 group-hover:text-green-600'}`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </div>
                  <span className="text-[15px] tracking-wide">হেল্প ও সাপোর্ট</span>
                </div>
              </button>

              {/* 10. Terms & Policies */}
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (onNavigatePolicies) {
                    onNavigatePolicies('terms');
                  } else {
                    window.history.pushState(null, '', '/terms');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className={`flex items-center justify-between text-left group bg-transparent border-none p-1.5 rounded-xl cursor-pointer transition-colors ${
                  activePage === 'policies' 
                    ? (isDark ? 'text-white font-semibold' : 'text-[#dc2626] font-semibold bg-red-50/70') 
                    : (isDark ? 'text-gray-300 font-normal hover:text-white' : 'text-gray-700 font-normal hover:text-black hover:bg-gray-50')
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center transition-colors ${
                    activePage === 'policies' ? (isDark ? 'text-[#ef4444]' : 'text-[#dc2626]') : (isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black')
                  }`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <span className="text-[15px] tracking-wide">শর্ত ও পলিসি</span>
                </div>
              </button>

              {/* 10. Admin Dashboard (if provided) */}
              {onOpenAdmin && (
                <button
                  onClick={() => handleNav(onOpenAdmin)}
                  className={`flex items-center justify-between text-left group bg-transparent border-none p-1.5 rounded-xl cursor-pointer transition-colors pt-1 ${
                    isDark ? 'text-gray-400 font-normal hover:text-white' : 'text-gray-500 font-normal hover:text-black hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 flex items-center justify-center transition-colors ${isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-black'}`}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                    </div>
                    <span className="text-[15px] tracking-wide">এডমিন প্যানেল</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Action Button: Logout if user logged in, or Login if guest */}
          <div className="pt-5 shrink-0 relative z-10">
            {currentUser ? (
              <button
                onClick={async () => {
                  setIsDrawerOpen(false);
                  if (window.confirm('Are you sure you want to sign out from your account?')) {
                    await logout();
                  }
                }}
                className={`w-full py-3.5 px-6 active:scale-[0.98] font-semibold text-sm rounded-full text-center transition-all cursor-pointer border tracking-wide flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-500/30' 
                    : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (onLoginClick) onLoginClick();
                  else if (onNavigateExams) onNavigateExams();
                }}
                className={`w-full py-3.5 px-6 active:scale-[0.98] text-white font-semibold text-sm rounded-full text-center transition-all cursor-pointer border-none tracking-wide ${
                  isDark 
                    ? 'bg-[#e11438] hover:bg-[#ff1744] shadow-[0_8px_25px_rgba(225,20,56,0.45)]' 
                    : 'bg-[#dc2626] hover:bg-[#b91c1c] shadow-md'
                }`}
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>


    </>
  );
}
