import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { initialData } from '../data/mockData';

export default function TermsModal({
  isOpen = false,
  initialTab = 'terms',
  onClose,
  data = {}
}) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab || 'terms');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
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

  if (!isOpen) return null;

  const siteSettings = { ...initialData.siteSettings, ...(data.siteSettings || {}) };
  const supportPhone = siteSettings.contactPhone || '+880 1700-000000';
  const whatsappNumber = supportPhone.replace(/[^0-9]/g, '');

  const termsData = data.termsAndConditions || initialData.termsAndConditions;
  const refundData = data.refundPolicy || initialData.refundPolicy;
  const privacyData = data.privacyPolicy || initialData.privacyPolicy;

  const handleCopyLink = () => {
    const tabPath = activeTab === 'refund' ? '/refund-policy' : (activeTab === 'privacy' ? '/privacy-policy' : '/terms');
    navigator.clipboard.writeText(window.location.origin + tabPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 select-none">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Modal Dialog */}
      <div 
        className={`relative w-full max-w-2xl max-h-[85vh] rounded-xl border flex flex-col shadow-2xl overflow-hidden z-10 font-sans ${
          isDark 
            ? 'bg-[#100306] text-gray-100 border-white/10' 
            : 'bg-white text-gray-900 border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between gap-4 shrink-0 ${
          isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 dark:text-gray-500 block">
              Official Policy
            </span>
            <h2 className="text-base sm:text-lg font-bold">
              {activeTab === 'terms' ? 'Terms & Conditions' : (activeTab === 'refund' ? 'Refund Policy' : 'Privacy Policy')}
            </h2>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={handleCopyLink}
              className={`px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : isDark
                    ? 'bg-transparent text-gray-300 border-white/15 hover:bg-white/5'
                    : 'bg-transparent text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              onClick={onClose}
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors border cursor-pointer ${
                isDark 
                  ? 'bg-transparent text-gray-300 border-white/15 hover:bg-white/10 hover:text-white' 
                  : 'bg-transparent text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className={`px-5 py-2 border-b flex items-center gap-4 text-xs font-semibold shrink-0 ${
          isDark ? 'border-white/10 bg-white/[0.01]' : 'border-gray-200 bg-white'
        }`}>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-1 transition-colors border-b-2 cursor-pointer bg-transparent border-t-0 border-x-0 ${
              activeTab === 'terms'
                ? 'text-[#dc2626] dark:text-[#ff4d6d] border-[#dc2626] dark:border-[#ff4d6d]'
                : 'text-gray-500 border-transparent hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Terms & Conditions
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`py-1 transition-colors border-b-2 cursor-pointer bg-transparent border-t-0 border-x-0 ${
              activeTab === 'refund'
                ? 'text-[#dc2626] dark:text-[#ff4d6d] border-[#dc2626] dark:border-[#ff4d6d]'
                : 'text-gray-500 border-transparent hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Refund Policy
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-1 transition-colors border-b-2 cursor-pointer bg-transparent border-t-0 border-x-0 ${
              activeTab === 'privacy'
                ? 'text-[#dc2626] dark:text-[#ff4d6d] border-[#dc2626] dark:border-[#ff4d6d]'
                : 'text-gray-500 border-transparent hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-sm">
          {activeTab === 'terms' && (
            <div className="space-y-5">
              {termsData.intro && (
                <div className={`p-4 rounded border text-xs sm:text-sm leading-relaxed ${
                  isDark ? 'bg-white/[0.02] border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  {termsData.intro}
                </div>
              )}

              <div className="space-y-4">
                {termsData.clauses?.map((clause, idx) => (
                  <div key={clause.id || idx} className="space-y-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      {clause.title?.includes('.') ? clause.title : `${idx + 1}. ${clause.title}`}
                    </h3>
                    {Array.isArray(clause.points) ? (
                      <ul className="space-y-1 text-xs sm:text-sm pl-4 list-disc text-gray-700 dark:text-gray-300 marker:text-gray-400">
                        {clause.points.map((pt, pIdx) => (
                          <li key={pIdx} className="leading-relaxed">{pt}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{clause.content || clause.text}</p>
                    )}
                  </div>
                ))}
              </div>

              {termsData.agreementText && (
                <div className="border-l-2 border-gray-400 dark:border-gray-600 pl-3 py-1 text-xs text-gray-600 dark:text-gray-400">
                  {termsData.agreementText}
                </div>
              )}
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-5">
              {refundData.notice && (
                <div className="border-l-2 border-amber-500 pl-3 py-1 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/5">
                  {refundData.notice}
                </div>
              )}

              <div className="space-y-4">
                {refundData.clauses?.map((clause, idx) => (
                  <div key={clause.id || idx} className="space-y-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      {clause.title?.includes('.') ? clause.title : `${idx + 1}. ${clause.title}`}
                    </h3>
                    {Array.isArray(clause.points) ? (
                      <ul className="space-y-1 text-xs sm:text-sm pl-4 list-disc text-gray-700 dark:text-gray-300 marker:text-gray-400">
                        {clause.points.map((pt, pIdx) => (
                          <li key={pIdx} className="leading-relaxed">{pt}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{clause.content || clause.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-5">
              {privacyData.intro && (
                <div className={`p-4 rounded border text-xs sm:text-sm leading-relaxed ${
                  isDark ? 'bg-white/[0.02] border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}>
                  {privacyData.intro}
                </div>
              )}

              <div className="space-y-4">
                {privacyData.clauses?.map((clause, idx) => (
                  <div key={clause.id || idx} className="space-y-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      {clause.title?.includes('.') ? clause.title : `${idx + 1}. ${clause.title}`}
                    </h3>
                    {Array.isArray(clause.points) ? (
                      <ul className="space-y-1 text-xs sm:text-sm pl-4 list-disc text-gray-700 dark:text-gray-300 marker:text-gray-400">
                        {clause.points.map((pt, pIdx) => (
                          <li key={pIdx} className="leading-relaxed">{pt}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{clause.content || clause.text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t flex items-center justify-between gap-3 shrink-0 text-xs ${
          isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
        }`}>
          <div>
            <a 
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-inherit hover:underline"
            >
              Helpline: {supportPhone}
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-xs cursor-pointer border-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
