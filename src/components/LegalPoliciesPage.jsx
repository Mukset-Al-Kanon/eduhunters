import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { useTheme } from '../context/ThemeContext';
import { initialData } from '../data/mockData';
import { Clock } from 'lucide-react';

export default function LegalPoliciesPage({
  data = {},
  initialTab = 'privacy',
  onChangeTab,
  onNavigateHome,
  onNavigateCourse,
  onNavigateExams,
  onNavigateStore,
  onNavigateAbout,
  onNavigateDevices,
  onNavigateOrders,
  onOpenAdmin,
  onLoginClick,
  onNavigatePolicies
}) {
  const { isDark } = useTheme();
  const siteSettings = { ...initialData.siteSettings, ...(data.siteSettings || {}) };

  const [activeTab, setActiveTab] = useState(initialTab || 'privacy');

  useEffect(() => {
    if (initialTab && ['terms', 'refund', 'privacy'].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (onChangeTab) {
      onChangeTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const supportEmail = siteSettings.contactEmail || 'support@eduhunters.com';
  const supportPhone = siteSettings.contactPhone || '+880 1700-000000';
  const whatsappNumber = supportPhone.replace(/[^0-9]/g, '');

  const termsData = data.termsAndConditions || initialData.termsAndConditions;
  const refundData = data.refundPolicy || initialData.refundPolicy;
  const privacyData = data.privacyPolicy || initialData.privacyPolicy;

  const currentPolicy = activeTab === 'terms' ? termsData : (activeTab === 'refund' ? refundData : privacyData);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#0a0204] text-gray-200' : 'bg-[#faf9fb] text-gray-900'
    }`}>
      {/* Sticky Main Navigation */}
      <Navbar 
        activePage="policies"
        siteSettings={siteSettings}
        onNavigateHome={onNavigateHome}
        onNavigateCourse={onNavigateCourse}
        onNavigateExams={onNavigateExams}
        onNavigateStore={onNavigateStore}
        onNavigateAbout={onNavigateAbout}
        onNavigateDevices={onNavigateDevices}
        onNavigateOrders={onNavigateOrders}
        onOpenAdmin={onOpenAdmin}
        onLoginClick={onLoginClick}
      />

      {/* Main Single-Card Layout matching ACS Future School */}
      <main 
        className="relative flex-1" 
        style={{
          backgroundImage: isDark 
            ? 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)' 
            : 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '18px 18px'
        }}
      >
        <div className="mx-auto w-[92%] max-w-4xl px-0 pb-16 pt-10 md:pb-24 md:pt-14">
          
          {/* Minimal Tab Switcher */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              onClick={() => handleTabChange('terms')}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-[#dc2626] text-white shadow-xs'
                  : isDark
                    ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                    : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              Terms & Conditions
            </button>

            <button
              onClick={() => handleTabChange('refund')}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'refund'
                  ? 'bg-[#dc2626] text-white shadow-xs'
                  : isDark
                    ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                    : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              Refund Policy
            </button>

            <button
              onClick={() => handleTabChange('privacy')}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-[#dc2626] text-white shadow-xs'
                  : isDark
                    ? 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                    : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              Privacy Policy
            </button>
          </div>

          {/* Page Header */}
          <header className="mb-6 md:mb-8 space-y-2">
            {currentPolicy?.lastUpdated && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-[#dc2626] dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60">
                <Clock className="w-3.5 h-3.5" />
                <span>Last Updated: {currentPolicy.lastUpdated}</span>
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
              {activeTab === 'terms' && 'Terms & Conditions'}
              {activeTab === 'refund' && 'Refund Policy'}
              {activeTab === 'privacy' && 'Privacy Policy'}
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 md:text-lg">
              {activeTab === 'terms' && 'General guidelines, platform usage terms, and code of conduct for EduHunters.'}
              {activeTab === 'refund' && 'Official guidelines and criteria regarding course enrollments, cancellations, and refunds.'}
              {activeTab === 'privacy' && 'How we protect, store, and handle student data and platform privacy.'}
            </p>
          </header>

          {/* Simple Clean Article Card */}
          <article className={`rounded-2xl border px-6 py-8 md:rounded-[20px] md:px-12 md:py-12 transition-colors ${
            isDark 
              ? 'bg-[#120306] border-white/10 text-gray-200' 
              : 'bg-white border-gray-200/80 text-gray-800 shadow-sm'
          }`}>
            <div className="space-y-8 text-base leading-relaxed md:text-lg md:leading-8">
              
              {/* ========================================================= */}
              {/* 1. TERMS & CONDITIONS                                      */}
              {/* ========================================================= */}
              {activeTab === 'terms' && (
                <>
                  {termsData.intro && (
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      {termsData.intro}
                    </p>
                  )}

                  <div className="space-y-6">
                    {termsData.clauses?.map((clause, idx) => (
                      <section key={clause.id || idx} className="space-y-2.5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white md:text-xl">
                          {clause.title?.includes('.') ? clause.title : `${idx + 1}. ${clause.title}`}
                        </h2>
                        {Array.isArray(clause.points) ? (
                          <div className="space-y-2">
                            {clause.points.map((pt, pIdx) => (
                              <p key={pIdx} className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed pl-3 border-l-2 border-slate-200 dark:border-white/10">
                                {pt}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm md:text-base leading-relaxed">
                            {clause.content || clause.text}
                          </p>
                        )}
                      </section>
                    ))}
                  </div>

                  {termsData.agreementText && (
                    <section className="space-y-3 pt-6 border-t border-gray-200/80 dark:border-white/10">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white md:text-xl">
                        Agreement & Acceptance
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
                        {termsData.agreementText}
                      </p>
                    </section>
                  )}
                </>
              )}

              {/* ========================================================= */}
              {/* 2. REFUND POLICY                                           */}
              {/* ========================================================= */}
              {activeTab === 'refund' && (
                <>
                  {refundData.notice && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200 text-sm md:text-base leading-relaxed font-medium">
                      {refundData.notice}
                    </div>
                  )}

                  <div className="space-y-6">
                    {refundData.clauses?.map((clause, idx) => (
                      <section key={clause.id || idx} className="space-y-2.5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white md:text-xl">
                          {clause.title?.includes('.') ? clause.title : `${idx + 1}. ${clause.title}`}
                        </h2>
                        {Array.isArray(clause.points) ? (
                          <div className="space-y-2">
                            {clause.points.map((pt, pIdx) => (
                              <p key={pIdx} className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed pl-3 border-l-2 border-slate-200 dark:border-white/10">
                                {pt}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm md:text-base leading-relaxed">
                            {clause.content || clause.text}
                          </p>
                        )}
                      </section>
                    ))}
                  </div>

                  {/* Helpline info */}
                  <section className="space-y-2 pt-6 border-t border-gray-200/80 dark:border-white/10 text-sm md:text-base">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white md:text-xl">
                      Contact & Support
                    </h2>
                    <p>Email: <a href={`mailto:${supportEmail}`} className="text-[#dc2626] dark:text-[#ff4d6d] underline font-medium">{supportEmail}</a></p>
                    <p>Hotline / WhatsApp: <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="text-[#dc2626] dark:text-[#ff4d6d] underline font-medium">{supportPhone}</a></p>
                    <p className="text-gray-500 dark:text-gray-400">Support Hours: 10:00 AM – 10:00 PM (Daily)</p>
                  </section>
                </>
              )}

              {/* ========================================================= */}
              {/* 3. PRIVACY POLICY                                          */}
              {/* ========================================================= */}
              {activeTab === 'privacy' && (
                <>
                  {privacyData.intro && (
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      {privacyData.intro}
                    </p>
                  )}

                  <div className="space-y-6">
                    {privacyData.clauses?.map((clause, idx) => (
                      <section key={clause.id || idx} className="space-y-2.5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white md:text-xl">
                          {clause.title?.includes('.') ? clause.title : `${idx + 1}. ${clause.title}`}
                        </h2>
                        {Array.isArray(clause.points) ? (
                          <div className="space-y-2">
                            {clause.points.map((pt, pIdx) => (
                              <p key={pIdx} className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed pl-3 border-l-2 border-slate-200 dark:border-white/10">
                                {pt}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm md:text-base leading-relaxed">
                            {clause.content || clause.text}
                          </p>
                        )}
                      </section>
                    ))}
                  </div>

                  {/* Helpdesk */}
                  <section className="space-y-2 pt-6 border-t border-gray-200/80 dark:border-white/10 text-sm md:text-base">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white md:text-xl">
                      Contact & Helpdesk
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      For any questions or inquiries regarding our privacy practices:
                    </p>
                    <p>Email: <a href={`mailto:${supportEmail}`} className="text-[#dc2626] dark:text-[#ff4d6d] underline font-medium">{supportEmail}</a></p>
                    <p>Hotline / WhatsApp: <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="text-[#dc2626] dark:text-[#ff4d6d] underline font-medium">{supportPhone}</a></p>
                  </section>
                </>
              )}

            </div>
          </article>
        </div>
      </main>

      {/* Clean Footer Matching Site Design */}
      <footer className={`text-white transition-colors duration-200 ${
        isDark ? 'bg-[#120306] border-t border-white/10' : 'bg-[#dc2626]'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src={siteSettings.logoUrl || "/logo.png"} 
                  alt={siteSettings.siteName || "Edu Hunters"} 
                  className="h-7 w-auto object-contain bg-white rounded p-1" 
                />
                <span className="text-base font-bold tracking-tight text-white">
                  {siteSettings.siteName || "EDU HUNTERS"}
                </span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed max-w-sm">
                দেশের শীর্ষস্থানীয় মেন্টর ও চিকিৎসকদের তত্ত্বাবধানে মেডিকেল ও একাডেমিক ভর্তি পরীক্ষার প্রস্তুতি।
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-4 text-white/90">
                  Quick Links
                </p>
                <ul className="space-y-2 text-xs text-white/80">
                  <li><button onClick={onNavigateHome} className="hover:text-white bg-transparent border-none p-0 cursor-pointer text-inherit">Home</button></li>
                  <li><button onClick={onNavigateCourse} className="hover:text-white bg-transparent border-none p-0 cursor-pointer text-inherit">All Courses</button></li>
                  <li><button onClick={onNavigateExams} className="hover:text-white bg-transparent border-none p-0 cursor-pointer text-inherit">Live Exams</button></li>
                  <li><button onClick={onNavigateStore} className="hover:text-white bg-transparent border-none p-0 cursor-pointer text-inherit">Book Store</button></li>
                  <li><button onClick={onNavigateAbout} className="hover:text-white bg-transparent border-none p-0 cursor-pointer text-inherit">Instructors</button></li>
                </ul>
              </div>

              {/* SCREENSHOT SECTION: English & No Emojis */}
              <div className="col-span-1 md:col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-4 text-white/90">
                  Legal & Policies
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/80">
                  <button 
                    onClick={() => handleTabChange('terms')} 
                    className="text-left hover:text-white cursor-pointer bg-transparent border-none p-0 text-inherit truncate"
                  >
                    Terms & Conditions
                  </button>
                  <button 
                    onClick={() => handleTabChange('refund')} 
                    className="text-left hover:text-white cursor-pointer bg-transparent border-none p-0 text-inherit truncate"
                  >
                    Refund Policy
                  </button>
                  <button 
                    onClick={() => handleTabChange('privacy')} 
                    className="text-left hover:text-white cursor-pointer bg-transparent border-none p-0 text-inherit truncate"
                  >
                    Privacy Policy
                  </button>
                  <button 
                    onClick={() => onNavigateOrders && onNavigateOrders()} 
                    className="text-left hover:text-white cursor-pointer bg-transparent border-none p-0 text-inherit truncate"
                  >
                    Order History
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs gap-3 text-white/70">
            <p>© 2026 Edu Hunters. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleTabChange('privacy')} 
                className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer text-xs"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => handleTabChange('terms')} 
                className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer text-xs"
              >
                Terms of Use
              </button>
              <button 
                onClick={() => handleTabChange('refund')} 
                className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer text-xs"
              >
                Refund Policy
              </button>
              <button 
                onClick={onOpenAdmin} 
                className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer text-xs text-white/50 hover:text-white"
              >
                Admin Panel
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
