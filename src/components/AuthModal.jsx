import React, { useState, useEffect, useCallback } from 'react';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signin', // 'welcome' | 'signin' | 'signup'
  onSuccess
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Smooth in/out animation state management
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  // Smooth card switching transition state (Sign In <-> Sign Up)
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;
    setStatusMsg(null);
    setIsSwitchingMode(true);
    setTimeout(() => {
      setMode(newMode);
      setIsSwitchingMode(false);
    }, 140);
  };

  // Silky smooth close handler
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 400); // Wait for the 400ms out-animation to finish before unmounting
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setMode(initialMode || 'signin');
      setStatusMsg(null);
      const rAF = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(rAF);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMode]);

  // Handle ESC key and scroll locking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };
    if (shouldRender) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [shouldRender, isVisible, handleClose]);

  if (!shouldRender) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setStatusMsg({ type: 'error', text: 'দয়া করে ইমেইল এবং পাসওয়ার্ড দিন।' });
      return;
    }
    
    setStatusMsg({ 
      type: 'success', 
      text: mode === 'signin' ? 'সফলভাবে লগইন হয়েছে!' : 'রেজিস্ট্রেশন সফল হয়েছে!' 
    });
    
    setTimeout(() => {
      if (onSuccess) {
        onSuccess({ email, name: name || email.split('@')[0] });
      }
      handleClose();
    }, 800);
  };

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 select-none ${
        isVisible ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Dark blur backdrop overlay with buttery smooth fade */}
      <div 
        onClick={handleClose}
        className={`fixed inset-0 bg-black/80 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${
          isVisible ? 'opacity-100 backdrop-blur-md' : 'opacity-0 backdrop-blur-none'
        }`}
      />

      {/* Main Auth Container - Ultra-Smooth Spring In and Glide Out Animation */}
      <div 
        className={`relative w-full max-w-[420px] rounded-[38px] bg-gradient-to-b from-[#2e050c] via-[#0f0305] to-[#070102] text-white p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] border border-[#e11438]/20 overflow-hidden z-10 max-h-[95vh] overflow-y-auto transform transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          isVisible 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-[0.92] translate-y-7'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Crimson Radial Ambient Glow */}
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#e11438]/25 rounded-full blur-[90px] pointer-events-none" />

        {/* Close Button ('X') */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200 border-none cursor-pointer z-20"
          title="Close"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* ================= MODE 1: WELCOME / ONBOARDING SCREEN ================= */}
        {mode === 'welcome' ? (
          <div className="flex flex-col items-center text-center pt-4 pb-2 animate-fadeIn">
            {/* Concentric Radar Circles with Glowing Logo */}
            <div className="relative w-56 h-56 flex items-center justify-center my-4">
              <div className="absolute inset-0 rounded-full border border-[#e11438]/15" />
              <div className="absolute inset-6 rounded-full border border-[#e11438]/25" />
              <div className="absolute inset-12 rounded-full border border-[#e11438]/35" />
              <div className="absolute inset-18 rounded-full border border-[#e11438]/50" />
              
              {/* Center Crimson Glowing Mark */}
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#991b1b] to-[#e11438] flex items-center justify-center shadow-[0_0_35px_rgba(225,20,56,0.6)]">
                <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              Smart learning <br />
              <span className="text-white">With Edu Hunters.</span>
            </h2>

            <p className="text-xs sm:text-sm text-gray-400 mt-3 max-w-[280px]">
              Access premium live classes, digital archive exams and personalized performance analytics.
            </p>

            <button
              onClick={() => handleModeSwitch('signin')}
              className="mt-6 w-full py-4 rounded-full bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#e11438] hover:from-[#b91c1c] hover:to-[#ff1744] text-white font-bold text-sm shadow-[0_6px_25px_rgba(225,20,56,0.5)] active:scale-[0.98] transition-all cursor-pointer border-none"
            >
              Get Started
            </button>
          </div>
        ) : (
          /* ================= MODE 2: SIGN IN / SIGN UP ================= */
          <div className="flex flex-col pt-2">
            {/* Header: Logo Icon + "Edu Hunters" Badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#991b1b] to-[#e11438] flex items-center justify-center shadow-md">
                <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight text-[#ff385c]">Edu Hunters</span>
            </div>

            {/* Title & Subtitle with smooth crossfade */}
            <div className={`transition-all duration-200 ease-out ${
              isSwitchingMode ? 'opacity-0 -translate-y-1.5' : 'opacity-100 translate-y-0'
            }`}>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {mode === 'signin' ? 'Sign In To Your Account.' : 'Create New Account.'}
              </h2>
              <p className="text-xs text-gray-400 mt-1 mb-6">
                {mode === 'signin' 
                  ? 'Access your account to manage settings, explore features.' 
                  : 'Join Edu Hunters to access exclusive academic courses.'}
              </p>
            </div>

            {/* Status Message Notification */}
            {statusMsg && (
              <div className={`p-3 rounded-2xl mb-4 text-xs font-medium border flex items-center gap-2 animate-fadeIn ${
                statusMsg.type === 'error' 
                  ? 'bg-red-950/60 border-red-500/40 text-red-200' 
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              }`}>
                <span>{statusMsg.type === 'error' ? '⚠️' : '✓'}</span>
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Full Name field with Butter-Smooth Height Accordion Transition */}
              <div 
                className={`grid transition-[grid-template-rows,opacity] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  mode === 'signup' 
                    ? 'grid-rows-[1fr] opacity-100' 
                    : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="pb-4">
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Full Name"
                      required={mode === 'signup'}
                      className="w-full px-4 py-3.5 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athra.lawson@example.com"
                  required
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    className="w-full px-4 py-3.5 pr-11 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 bg-transparent border-none cursor-pointer"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Red Glow CTA Button with smooth label crossfade */}
              <button
                type="submit"
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#e11438] via-[#e50914] to-[#ff2a55] hover:opacity-95 text-white font-bold text-sm shadow-[0_10px_35px_rgba(225,20,56,0.65)] active:scale-[0.98] transition-all cursor-pointer border-none mt-2"
              >
                <span className={`inline-block transition-all duration-200 ${
                  isSwitchingMode ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}>
                  {mode === 'signin' ? 'Get Started' : 'Create Account'}
                </span>
              </button>

              {/* Bottom Options: Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#e11438] cursor-pointer"
                  />
                  <span>{mode === 'signin' ? 'Remember me' : 'Agree to Terms'}</span>
                </label>

                <div className={`transition-opacity duration-200 ${mode === 'signin' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <button
                    type="button"
                    onClick={() => alert('পাসওয়ার্ড রিকভারি লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে।')}
                    className="text-[#e11438] hover:text-[#ff385c] font-medium bg-transparent border-none cursor-pointer p-0 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </form>

            {/* Divider: "——— Or ———" */}
            <div className="flex items-center gap-4 my-5">
              <div className="flex-1 h-[1px] bg-white/10"></div>
              <span className="text-xs text-gray-400 font-medium">Or</span>
              <div className="flex-1 h-[1px] bg-white/10"></div>
            </div>

            {/* Social Authentication Buttons */}
            <div className="space-y-3">
              {/* Sign in with Google */}
              <button
                type="button"
                onClick={() => {
                  setStatusMsg({ type: 'success', text: 'Google দিয়ে সফলভাবে অথেনটিকেশন সম্পন্ন হয়েছে!' });
                  setTimeout(handleClose, 800);
                }}
                className="w-full py-3.5 px-4 rounded-full bg-[#18090d] hover:bg-[#250e15] border border-white/5 active:scale-[0.98] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google</span>
              </button>

              {/* Continue with Apple */}
              <button
                type="button"
                onClick={() => {
                  setStatusMsg({ type: 'success', text: 'Apple দিয়ে সফলভাবে অথেনটিকেশন সম্পন্ন হয়েছে!' });
                  setTimeout(handleClose, 800);
                }}
                className="w-full py-3.5 px-4 rounded-full bg-[#18090d] hover:bg-[#250e15] border border-white/5 active:scale-[0.98] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.66-7.79-11.88-14.24-5.83-8.89-10.43-18.9-13.8-30.04-3.38-11.13-5.07-21.78-5.07-31.94 0-14.01 3.54-25.7 10.63-35.07 7.08-9.37 16.03-14.19 26.83-14.45 4.35 0 9.29 1.13 14.82 3.38 5.53 2.25 9.17 3.44 10.92 3.56 1.75-.12 5.54-1.35 11.37-3.69 5.83-2.33 10.66-3.38 14.5-3.13 10.99.63 20.08 4.67 27.27 12.12-9.87 5.99-14.68 14.28-14.42 24.87.26 8.35 3.44 15.34 9.53 20.97 6.09 5.63 13.44 8.78 22.06 9.47-2.12 6.5-4.69 13.35-7.72 20.55zm-30.8-107.02c0 5.48-1.98 10.65-5.93 15.51-3.95 4.87-8.88 8.01-14.81 9.44-.12-.86-.18-1.63-.18-2.32 0-5.36 2.05-10.62 6.16-15.79 4.1-5.17 9.17-8.31 15.19-9.42-.43.86-.43 1.72-.43 2.58z"/>
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>

            {/* Bottom Switch Link: Don't have an account? Sign up / Already have an account? Sign In */}
            <div className="text-center mt-6 pt-2">
              <div className={`transition-all duration-200 ease-out ${
                isSwitchingMode ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
              }`}>
                {mode === 'signin' ? (
                  <p className="text-xs text-gray-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('signup')}
                      className="text-[#e11438] hover:text-[#ff385c] font-semibold bg-transparent border-none cursor-pointer p-0 transition-colors underline"
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('signin')}
                      className="text-[#e11438] hover:text-[#ff385c] font-semibold bg-transparent border-none cursor-pointer p-0 transition-colors underline"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
