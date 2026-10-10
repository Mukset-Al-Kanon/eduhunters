import React from 'react';
import Navbar from './Navbar';
import { instructorsData } from '../data/homeData';
import { useTheme } from '../context/ThemeContext';

export default function AboutPage({ 
  data = {},
  onNavigateHome, 
  onNavigateCourse, 
  onNavigateExams, 
  onNavigateStore, 
  onNavigateDevices,
  onNavigateOrders,
  onNavigatePolicies,
  onOpenAdmin, 
  onLoginClick 
}) {
  const { isDark } = useTheme();
  const instructors = data.instructors || instructorsData;
  const siteSettings = data.siteSettings || {};
  const sectionTexts = data.sectionTexts || {};

  const facebookUrl = sectionTexts.contactPageUrl || (
    siteSettings.facebookPage && siteSettings.facebookPage !== 'https://facebook.com'
      ? siteSettings.facebookPage
      : "https://www.facebook.com/profile.php?id=61585769408167"
  );

  const youtubeUrl = (
    siteSettings.youtubeChannel && 
    siteSettings.youtubeChannel !== 'https://youtube.com/@eduhunters' && 
    siteSettings.youtubeChannel !== 'https://www.youtube.com'
      ? siteSettings.youtubeChannel
      : "https://www.youtube.com/channel/UC1XpmoV-Phk1q1N5D2PTd0g"
  );

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 selection:bg-[#e11438] selection:text-white ${
      isDark ? 'bg-transparent text-gray-100' : 'bg-[#F8F9FA] text-[#111827]'
    }`}>
      {/* Shared Sticky Navbar */}
      <Navbar 
        activePage="about"
        siteSettings={data.siteSettings}
        onNavigateHome={onNavigateHome}
        onNavigateCourse={onNavigateCourse}
        onNavigateExams={onNavigateExams}
        onNavigateStore={onNavigateStore}
        onNavigateAbout={() => {}}
        onNavigateDevices={onNavigateDevices}
        onNavigateOrders={onNavigateOrders}
        onNavigatePolicies={onNavigatePolicies}
        onOpenAdmin={onOpenAdmin}
        onLoginClick={onLoginClick}
      />

      {/* Main Content */}
      <main className="pt-16 md:pt-20">
        
        {/* About Hero */}
        <section className={`eh-course-hero pt-28 pb-20 relative overflow-hidden text-center text-white transition-colors duration-300 ${
          isDark 
            ? 'bg-gradient-to-r from-[#3d0711] via-[#1f0309] to-[#0d0104] border-b border-[#e11438]/20' 
            : 'bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#991b1b] border-b border-red-700/20'
        }`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 shadow-sm ${
              isDark ? 'bg-[#20040a] border border-[#e11438]/40 text-[#ff6b8b]' : 'bg-white/20 border border-white/30 text-white'
            }`}>
              About Us
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
              Edu Hunters
            </h1>
            <p className="text-base md:text-lg text-white/90 leading-relaxed max-w-2xl mx-auto">
              We are dedicated to providing the best learning and online examination experience for students across Bangladesh.
            </p>
          </div>
        </section>

        {/* Meet Our Expert Teachers */}
        {instructors && instructors.length > 0 && (
          <section className={`py-20 transition-colors duration-300 ${isDark ? 'bg-transparent' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14">
                <span className={`text-[10px] font-bold uppercase tracking-[0.22em] block mb-3 ${
                  isDark ? 'text-[#ff6b8b]' : 'text-[#dc2626]'
                }`}>
                  Our Faculty
                </span>
                <h2 className={`text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                  Meet Our <span className={isDark ? 'text-[#ff3b61]' : 'text-[#dc2626]'}>Expert Teachers</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {instructors.map((t) => (
                  <div 
                    key={t.id}
                    className={`group rounded-2xl overflow-hidden transition-all duration-300 border ${
                      isDark 
                        ? 'bg-[#120407]/90 border-[#e11438]/20 hover:border-[#e11438]/60 hover:shadow-[0_12px_40px_rgba(225,20,56,0.25)]' 
                        : 'bg-white border-gray-200 hover:border-red-300 hover:shadow-xl shadow-sm'
                    }`}
                  >
                    <div className={`aspect-[3/4] overflow-hidden ${isDark ? 'bg-[#0a0204]' : 'bg-gray-100'}`}>
                      <img 
                        src={t.image} 
                        alt={t.name} 
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <p className={`text-[10px] font-bold uppercase tracking-[0.15em] mb-1 truncate ${
                        isDark ? 'text-[#ff6b8b]' : 'text-[#dc2626]'
                      }`}>
                        {t.designation}
                      </p>
                      <h3 className={`font-black leading-tight text-base ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                        {t.name}
                      </h3>
                      <p className={`text-xs mt-1.5 line-clamp-2 leading-relaxed whitespace-pre-line ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {t.bio}
                      </p>
                      {t.yt && (
                        <a 
                          href={t.yt} 
                          target="_blank" 
                          rel="noreferrer"
                          className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                            isDark ? 'text-[#ff6b8b] hover:text-white' : 'text-[#dc2626] hover:text-red-700'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path></svg>
                          YouTube
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Contact Banner */}
        <section className={`py-20 text-center transition-colors duration-300 ${
          isDark 
            ? 'bg-gradient-to-b from-[#0a0204] via-[#120306] to-[#0a0204] border-t border-[#e11438]/20 text-white' 
            : 'bg-[#fff5f5] border-t border-red-100 text-[#111827]'
        }`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              {sectionTexts.contactTitle || "আমাদের সাথে যোগাযোগ করো"}
            </h2>
            <p className={`text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-[#4b5563]'
            }`}>
              {sectionTexts.contactDesc || "যেকোনো কোর্স এনরোলমেন্ট বা একাডেমিক সহায়তায় আমাদের ফেসবুক পেজ এবং ইউটিউব চ্যানেলে যুক্ত থাকো।"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
              {/* Facebook Page Button */}
              <a 
                href={facebookUrl} 
                target="_blank" 
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#dc2626] text-white font-bold rounded-2xl shadow-lg hover:bg-[#b91c1c] hover:shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-decoration-none group"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>{sectionTexts.contactPageTitle || "পেজে মেসেজ করো"}</span>
              </a>

              {/* YouTube Channel Button */}
              <a 
                href={youtubeUrl} 
                target="_blank" 
                rel="noreferrer"
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 font-bold rounded-2xl transition-all text-decoration-none hover:scale-[1.02] active:scale-[0.98] border group ${
                  isDark 
                    ? 'border-[#e11438]/30 bg-[#140307]/80 text-white hover:bg-[#1f050d] hover:border-[#e11438]/60 shadow-[0_8px_30px_rgba(0,0,0,0.4)]' 
                    : 'border-gray-300 bg-white text-gray-800 hover:border-red-400 hover:text-[#dc2626] shadow-sm'
                }`}
              >
                <svg className="w-5 h-5 fill-[#e11438] shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
                <span>আমাদের ইউটিউব চ্যানেল</span>
              </a>

              {/* Community Button (if URL configured) */}
              {sectionTexts.contactCommunityUrl && sectionTexts.contactCommunityUrl !== 'https://www.facebook.com' && (
                <a 
                  href={sectionTexts.contactCommunityUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 font-bold rounded-2xl transition-all text-decoration-none hover:scale-[1.02] border ${
                    isDark 
                      ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white' 
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{sectionTexts.contactCommunityTitle || "কমিউনিটিতে যুক্ত হও"}</span>
                </a>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Footer (Hidden on mobile) */}
      <div className="hidden sm:block">
        {isDark ? (
          <footer className="bg-gradient-to-b from-[#180408] via-[#0d0205] to-[#050102] text-white border-t border-[#e11438]/25 py-8 text-center text-xs text-gray-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p>© 2026 Edu Hunters. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('privacy') : (window.location.href = '/privacy-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Privacy Policy</button>
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Terms of Use</button>
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Refund Policy</button>
              </div>
            </div>
          </footer>
        ) : (
          <footer className="bg-[#dc2626] eh-dots-light text-white py-8 text-center text-xs">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <p className="text-white/80">Academic to admission EDU HUNTERS with you.</p>
                <p className="text-white/60 mt-0.5">© 2026 Edu Hunters. All rights reserved.</p>
              </div>
              <div className="flex items-center gap-4 text-white/80">
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('privacy') : (window.location.href = '/privacy-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Privacy Policy</button>
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Terms of Use</button>
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Refund Policy</button>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

