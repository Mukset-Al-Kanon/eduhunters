import React, { useState } from 'react';
import Navbar from './Navbar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function DevicesPage({
  data = {},
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
  const { isDark } = useTheme();
  const { currentUser, logout } = useAuth();
  const [removingId, setRemovingId] = useState('');

  // Initial registered devices matching Edu Hunters structure
  const [devices, setDevices] = useState([
    {
      id: 'dev_w11_chrome',
      name: 'Windows • Chrome',
      browser: 'Chrome 124.0.0.0',
      os: 'Windows 11',
      deviceType: 'Desktop',
      isCurrent: true,
      isActive: true,
      firstSeenAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      lastSeenAt: new Date().toISOString(),
      firstIpAddress: '103.114.98.24',
      lastIpAddress: '103.114.98.24'
    },
    {
      id: 'dev_android_app',
      name: 'Samsung SM-S918B • Android App',
      browser: 'Edu Hunters Android App',
      os: 'Android 14',
      deviceType: 'Mobile',
      isCurrent: false,
      isActive: false,
      firstSeenAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      lastSeenAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      firstIpAddress: '103.114.98.24',
      lastIpAddress: '103.114.98.24'
    }
  ]);

  const maxDevices = 2;
  const registeredCount = devices.length;
  const activeCount = devices.filter(d => d.isActive).length;
  const slotsLeft = Math.max(0, maxDevices - devices.length);

  // Format date exactly like Edu Hunters: 03 Oct 2026, 10:15
  const formatDate = (isoString) => {
    if (!isoString) return 'Unknown';
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(isoString));
    } catch {
      return 'Unknown';
    }
  };

  // Remove device logic matching Edu Hunters
  const handleRemoveDevice = (device) => {
    const confirmText = device.isCurrent
      ? 'This is your current device. Removing it will sign you out immediately. Continue?'
      : 'Remove this device and revoke any active session on it?';

    if (window.confirm(confirmText)) {
      setRemovingId(device.id);
      setTimeout(async () => {
        setDevices(prev => prev.filter(d => d.id !== device.id));
        setRemovingId('');
        if (device.isCurrent) {
          await logout();
          if (onLoginClick) onLoginClick();
        }
      }, 500);
    }
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-250 selection:bg-[#dc2626] selection:text-white ${
      isDark ? 'bg-transparent text-gray-100' : 'bg-[#fbfbfb] text-[#111827]'
    }`}>
      {/* Sticky Main Top Navigation Bar */}
      <Navbar 
        activePage="devices"
        siteSettings={data.siteSettings}
        onNavigateHome={onNavigateHome}
        onNavigateCourse={onNavigateCourse}
        onNavigateExams={onNavigateExams}
        onNavigateStore={onNavigateStore}
        onNavigateAbout={onNavigateAbout}
        onNavigateDevices={onNavigateDevices}
        onNavigateOrders={onNavigateOrders}
        onNavigatePolicies={onNavigatePolicies}
        onOpenAdmin={onOpenAdmin}
        onLoginClick={onLoginClick}
      />

      {/* Main Content with 64px - 80px Navbar clearance */}
      <main className="pt-16 md:pt-20">
        <div className={`min-h-screen py-8 transition-colors duration-300 ${
          isDark ? 'bg-transparent' : 'bg-[#fafafa]'
        }`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

            {/* 1. Edu Hunters Hero Band Banner */}
            <div 
              className={`eh-band relative overflow-hidden rounded-2xl shadow-lg ${
                isDark 
                  ? 'border border-[#e11438]/25 shadow-[0_16px_40px_rgba(0,0,0,0.7)]' 
                  : 'shadow-md border border-red-900/10'
              }`}
              style={{
                background: isDark
                  ? 'radial-gradient(hsla(0,0%,100%,.1) 1.5px,transparent 1.5px),radial-gradient(circle at 82% 16%,rgba(248,113,113,.25),transparent 46%),linear-gradient(135deg,#36060e 0%,#180206 55%,#0d0104 100%)'
                  : 'radial-gradient(hsla(0,0%,100%,.1) 1.5px,transparent 1.5px),radial-gradient(circle at 82% 16%,rgba(248,113,113,.5),transparent 46%),radial-gradient(circle at 10% 96%,rgba(220,38,38,.7),transparent 52%),linear-gradient(135deg,#7f1d1d 0%,#dc2626 55%,#991b1b 100%)',
                backgroundSize: '22px 22px, 100% 100%, 100% 100%, 100% 100%'
              }}
            >
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-7 md:px-8 md:py-9">
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
                    My Devices
                  </h1>
                  <p className="text-white opacity-85 text-sm md:text-base mt-1">
                    You can keep up to {maxDevices} registered devices. Only one device stays active at a time.
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={onNavigateHome}
                    className="eh-btn-inverse text-sm inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-extrabold cursor-pointer border-none transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-md bg-white text-[#dc2626] hover:bg-[#fff5f5]"
                  >
                    <span>Back to Home</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Edu Hunters Yellow Notice Warning Card */}
            <div className={`rounded-2xl p-4 text-sm border transition-colors ${
              isDark 
                ? 'bg-amber-950/30 border-amber-600/30 text-amber-200' 
                : 'bg-yellow-50 border-yellow-200 text-yellow-900'
            }`}>
              <p className="font-semibold text-[15px]">Before removing a device</p>
              <p className="mt-1 leading-relaxed opacity-95 text-xs sm:text-sm">
                Removing the current device will sign you out immediately. Removing another device will block it from using this account until it logs in again, if your device limit allows it.
              </p>
            </div>

            {/* 3. Stat Cards Grid (Exact 3 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`rounded-2xl border p-5 transition-colors ${
                isDark 
                  ? 'bg-white/[0.03] border-white/10 text-white' 
                  : 'bg-white border-gray-200 text-[#111827] shadow-sm'
              }`}>
                <p className="text-2xl md:text-3xl font-black tracking-tight">
                  {registeredCount}
                </p>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Registered Devices
                </p>
              </div>

              <div className={`rounded-2xl border p-5 transition-colors ${
                isDark 
                  ? 'bg-white/[0.03] border-white/10 text-white' 
                  : 'bg-white border-gray-200 text-[#111827] shadow-sm'
              }`}>
                <p className="text-2xl md:text-3xl font-black tracking-tight text-emerald-500">
                  {activeCount}
                </p>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Active Sessions
                </p>
              </div>

              <div className={`rounded-2xl border p-5 transition-colors ${
                isDark 
                  ? 'bg-white/[0.03] border-white/10 text-white' 
                  : 'bg-white border-gray-200 text-[#111827] shadow-sm'
              }`}>
                <p className={`text-2xl md:text-3xl font-black tracking-tight ${slotsLeft > 0 ? 'text-[#dc2626] dark:text-[#ff3d67]' : 'text-gray-400'}`}>
                  {slotsLeft}
                </p>
                <p className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Device Slots Left
                </p>
              </div>
            </div>

            {/* 4. Registered Devices List */}
            {devices.length > 0 ? (
              <div className="space-y-3">
                {devices.map((device) => {
                  const isMobile = device.deviceType === 'Mobile';

                  return (
                    <div 
                      key={device.id} 
                      className={`rounded-2xl border p-5 transition-all shadow-sm ${
                        isDark 
                          ? 'bg-white/[0.03] border-white/10 hover:border-white/20' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex gap-4 min-w-0">
                          {/* Device Icon */}
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                            isDark 
                              ? 'bg-orange-500/15 text-orange-400' 
                              : 'bg-orange-500/10 text-orange-600'
                          }`}>
                            {isMobile ? (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 2h4a2 2 0 012 2v16a2 2 0 01-2 2h-4a2 2 0 01-2-2V4a2 2 0 012-2zM11 18h2" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17h4.5M4 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
                              </svg>
                            )}
                          </div>

                          {/* Device Specs & Information */}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="font-bold text-base sm:text-lg text-primary-charcoal truncate text-gray-900 dark:text-white">
                                {device.name}
                              </h2>

                              {device.isCurrent && (
                                <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 text-xs font-bold border border-green-200 dark:border-green-800">
                                  Current
                                </span>
                              )}

                              {device.isActive && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                                  Active
                                </span>
                              )}
                            </div>

                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {device.browser} Â· {device.os} Â· {device.deviceType}
                            </p>

                            <div className={`grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs mt-3 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              <p>
                                First seen: <span className="font-medium text-gray-900 dark:text-gray-200">{formatDate(device.firstSeenAt)}</span>
                              </p>
                              <p>
                                Last seen: <span className="font-medium text-gray-900 dark:text-gray-200">{formatDate(device.lastSeenAt)}</span>
                              </p>
                              <p>
                                First IP: <span className="font-mono font-medium text-gray-900 dark:text-gray-200">{device.firstIpAddress}</span>
                              </p>
                              <p>
                                Last IP: <span className="font-mono font-medium text-gray-900 dark:text-gray-200">{device.lastIpAddress}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="shrink-0 pt-2 lg:pt-0">
                          <button
                            onClick={() => handleRemoveDevice(device)}
                            disabled={removingId === device.id}
                            className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer border ${
                              isDark 
                                ? 'border-red-500/30 bg-red-950/30 text-red-400 hover:bg-red-900/50' 
                                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                            } disabled:opacity-50`}
                          >
                            {removingId === device.id 
                              ? 'Removing...' 
                              : device.isCurrent 
                                ? 'Remove & Sign Out' 
                                : 'Remove Device'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty state if all devices removed */
              <div className={`rounded-2xl p-8 border text-center transition-colors ${
                isDark ? 'bg-white/[0.02] border-white/10' : 'bg-white border-gray-200'
              }`}>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  No registered devices yet
                </h2>
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your current browser will appear here after your next login.
                </p>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer matching Edu Hunters (Hidden on mobile) */}
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

