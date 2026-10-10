import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, formatAuthError } from '../context/AuthContext';
import { 
  sendVerificationOTP, 
  verifyEnteredOTP, 
  isDisposableEmail,
  isValidEmailFormat 
} from '../services/otpService';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'signin', // 'welcome' | 'signin' | 'signup'
  onSuccess
}) {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();

  // Modal Flow Mode: 'signin' | 'signup' | 'verify-signup' | 'forgot-password' | 'verify-reset' | 'welcome'
  const [mode, setMode] = useState(initialMode);
  
  // Form Inputs
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // 6-Digit OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Status, Loading & UI Animation
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

  // References for the 6 OTP input boxes
  const otpInputRefs = useRef([]);

  // Mode switcher with smooth crossfade
  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;
    setStatusMsg(null);
    setIsSwitchingMode(true);
    setTimeout(() => {
      setMode(newMode);
      setOtpDigits(['', '', '', '', '', '']);
      setIsSwitchingMode(false);
    }, 140);
  };

  // Silky smooth close handler
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 400);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setMode(initialMode || 'signin');
      setStatusMsg(null);
      setOtpDigits(['', '', '', '', '', '']);
      setRememberMe(true);
      const savedEmail = localStorage.getItem('eh_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
      }
      const rAF = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(rAF);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialMode]);

  // Handle ESC key and scroll locking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isVisible) handleClose();
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

  // Countdown timer for OTP Resend (60 seconds)
  useEffect(() => {
    let interval = null;
    if ((mode === 'verify-signup' || mode === 'verify-reset') && resendTimer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [mode, resendTimer]);

  // Auto focus first OTP input when entering OTP screens
  useEffect(() => {
    if (mode === 'verify-signup' || mode === 'verify-reset') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [mode]);

  if (!shouldRender) return null;

  // ================= OTP Input Helpers =================
  const handleOtpChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, ''); // Allow numbers only
    if (!cleanValue && value !== '') return;

    const newOtp = [...otpDigits];
    newOtp[index] = cleanValue.slice(-1); // Take latest single digit
    setOtpDigits(newOtp);

    // Auto advance to next input box
    if (cleanValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Auto move back on backspace if current box is empty
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedData) {
      const digits = pastedData.slice(0, 6).split('');
      const newOtp = [...otpDigits];
      digits.forEach((digit, idx) => {
        newOtp[idx] = digit;
      });
      setOtpDigits(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
    }
  };

  // ================= STEP 1: SIGN IN =================
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!email || !isValidEmailFormat(email)) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (!password) {
      setStatusMsg({ type: 'error', text: 'Please enter your password.' });
      return;
    }

    try {
      setLoading(true);
      const authUser = await login(email, password);
      if (rememberMe) {
        localStorage.setItem('eh_remembered_email', email);
      } else {
        localStorage.removeItem('eh_remembered_email');
      }
      setStatusMsg({ type: 'success', text: 'Signed in successfully! Welcome back.' });
      setTimeout(() => {
        if (onSuccess) onSuccess(authUser);
        handleClose();
      }, 700);
    } catch (err) {
      setStatusMsg({ type: 'error', text: formatAuthError(err) });
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 2: INITIATE SIGN UP & DISPATCH OTP =================
  const handleSignUpInitiate = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!name.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your full name.' });
      return;
    }

    if (!email || !isValidEmailFormat(email)) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    // Block fake/temporary disposable domains
    if (isDisposableEmail(email)) {
      setStatusMsg({
        type: 'error',
        text: 'Temporary or disposable email addresses are not permitted. Please use your genuine email.'
      });
      return;
    }

    if (!password || password.length < 6) {
      setStatusMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    try {
      setLoading(true);
      // Dispatch 6-Digit OTP to user's email
      await sendVerificationOTP(email, name);
      setResendTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      
      setStatusMsg({
        type: 'success',
        text: `A 6-digit verification code has been dispatched to ${email}.`
      });

      // Transition smoothly to OTP input screen
      setTimeout(() => {
        setMode('verify-signup');
      }, 400);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to dispatch verification code.' });
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 3: VERIFY SIGNUP OTP & FINALIZE =================
  const handleVerifySignUpOTP = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setStatusMsg({ type: 'error', text: 'Please enter the complete 6-digit verification code.' });
      return;
    }

    // Verify OTP against the service
    const verifyResult = verifyEnteredOTP(email, fullCode);
    if (!verifyResult.valid) {
      setStatusMsg({ type: 'error', text: verifyResult.error });
      return;
    }

    try {
      setLoading(true);
      // Create authenticated user in Firebase
      const authUser = await signup(email, password, name);
      setStatusMsg({
        type: 'success',
        text: 'Email verified successfully! Welcome to Edu Hunters.'
      });

      setTimeout(() => {
        if (onSuccess) onSuccess(authUser);
        handleClose();
      }, 700);
    } catch (err) {
      setStatusMsg({ type: 'error', text: formatAuthError(err) });
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 4: INITIATE FORGOT PASSWORD =================
  const handleForgotPasswordInitiate = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!email || !isValidEmailFormat(email)) {
      setStatusMsg({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }

    try {
      setLoading(true);
      // Trigger official Firebase reset email to user's inbox
      await resetPassword(email).catch(() => {});
      // Dispatch 6-digit OTP code to user's email
      await sendVerificationOTP(email, 'Student');
      setResendTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);

      setStatusMsg({
        type: 'success',
        text: `A 6-digit recovery code has been sent to ${email}. Please check your inbox or spam folder.`
      });

      setTimeout(() => {
        setMode('verify-reset');
      }, 400);
    } catch (err) {
      setStatusMsg({ type: 'error', text: formatAuthError(err) });
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 5: VERIFY FORGOT PASSWORD OTP & RESET =================
  const handleVerifyResetSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setStatusMsg({ type: 'error', text: 'Please enter the complete 6-digit recovery code.' });
      return;
    }

    const verifyResult = verifyEnteredOTP(email, fullCode);
    if (!verifyResult.valid) {
      setStatusMsg({ type: 'error', text: verifyResult.error });
      return;
    }

    if (!password || password.length < 6) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Passwords do not match. Please verify.' });
      return;
    }

    try {
      setLoading(true);
      // Reset simulated or updated password
      const users = JSON.parse(localStorage.getItem('eh_registered_users') || '[]');
      const userIndex = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
      if (userIndex !== -1) {
        users[userIndex].password = password;
        localStorage.setItem('eh_registered_users', JSON.stringify(users));
      }

      setStatusMsg({
        type: 'success',
        text: 'Password updated successfully! You can now sign in with your new password.'
      });

      setTimeout(() => {
        handleModeSwitch('signin');
      }, 1200);
    } catch (err) {
      setStatusMsg({ type: 'error', text: formatAuthError(err) });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Handler
  const handleResendOTP = async () => {
    if (!canResend || loading) return;
    try {
      setLoading(true);
      setStatusMsg(null);
      await sendVerificationOTP(email, name || 'Student');
      if (mode === 'verify-reset') {
        await resetPassword(email).catch(() => {});
      }
      setResendTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      setStatusMsg({
        type: 'success',
        text: 'A new 6-digit verification code has been dispatched.'
      });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to resend code.' });
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const authUser = await loginWithGoogle();
      setStatusMsg({ type: 'success', text: 'Signed in with Google successfully!' });
      setTimeout(() => {
        if (onSuccess) onSuccess(authUser);
        handleClose();
      }, 700);
    } catch (err) {
      setStatusMsg({ type: 'error', text: formatAuthError(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 select-none ${
        isVisible ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Dark blur backdrop overlay */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/80 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${
          isVisible ? 'opacity-100 backdrop-blur-md' : 'opacity-0 backdrop-blur-none'
        }`}
      />

      {/* Main Auth Container */}
      <div
        className={`relative w-full max-w-[430px] rounded-[36px] bg-gradient-to-b from-[#2e050c] via-[#0f0305] to-[#070102] text-white p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] border border-[#e11438]/20 overflow-hidden z-10 max-h-[95vh] overflow-y-auto transform transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.92] translate-y-7'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Crimson Radial Glow */}
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

        {/* ================= MODE 1: WELCOME SCREEN ================= */}
        {mode === 'welcome' ? (
          <div className="flex flex-col items-center text-center pt-4 pb-2 animate-fadeIn">
            <div className="relative w-56 h-56 flex items-center justify-center my-4">
              <div className="absolute inset-0 rounded-full border border-[#e11438]/15" />
              <div className="absolute inset-6 rounded-full border border-[#e11438]/25" />
              <div className="absolute inset-12 rounded-full border border-[#e11438]/35" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#991b1b] to-[#e11438] flex items-center justify-center shadow-[0_0_35px_rgba(225,20,56,0.6)]">
                <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
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
          /* ================= MAIN AUTH FLOW ================= */
          <div className="flex flex-col pt-1">
            {/* Header: Brand Text (Centered, Icon Removed) */}
            <div className="flex items-center justify-center mb-3">
              <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#ff385c]">Edu Hunters</span>
            </div>

            {/* Screen Titles & Subtitles (Center Aligned) */}
            <div className={`text-center transition-all duration-200 ease-out ${isSwitchingMode ? 'opacity-0 -translate-y-1.5' : 'opacity-100 translate-y-0'}`}>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center">
                {mode === 'signin' && 'Sign In to Account'}
                {mode === 'signup' && 'Create New Account'}
                {mode === 'verify-signup' && 'Verify Your Email'}
                {mode === 'forgot-password' && 'Reset Password'}
                {mode === 'verify-reset' && 'Set New Password'}
              </h2>
              <p className="text-xs text-gray-400 mt-1.5 mb-5 max-w-[320px] mx-auto text-center leading-relaxed">
                {mode === 'signin' && 'Enter your details to access your courses and exams.'}
                {mode === 'signup' && 'Sign up to enroll in live classes and take interactive exams.'}
                {mode === 'verify-signup' && `Enter the 6-digit verification code sent to ${email}`}
                {mode === 'forgot-password' && 'Enter your email address to receive a 6-digit recovery code.'}
                {mode === 'verify-reset' && `Enter the 6-digit code sent to ${email} and your new password.`}
              </p>
            </div>

            {/* Status Message Notification (Ash / White Sleek Box) */}
            {statusMsg && (
              <div
                className={`p-3.5 rounded-2xl mb-4 text-xs font-medium border flex items-center gap-2.5 animate-fadeIn shadow-sm backdrop-blur-md ${
                  statusMsg.type === 'error'
                    ? 'bg-red-950/40 border-red-500/30 text-red-200'
                    : 'bg-white/[0.08] border-white/20 text-gray-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                }`}
              >
                {statusMsg.type === 'error' ? (
                  <span className="shrink-0 text-red-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                ) : (
                  <span className="shrink-0 text-white/90">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
                <span className="leading-snug text-[12.5px]">{statusMsg.text}</span>
              </div>
            )}


            {/* ================= VIEW: SIGN IN ================= */}
            {mode === 'signin' && (
              <form onSubmit={handleSignInSubmit}>
                <div className="mb-3.5">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                  />
                </div>

                <div className="mb-3.5">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      required
                      className="w-full px-4 py-3 pr-11 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 bg-transparent border-none cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#e11438] cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleModeSwitch('forgot-password')}
                    className="text-[#e11438] hover:text-[#ff385c] font-medium bg-transparent border-none cursor-pointer p-0 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#e11438] via-[#e50914] to-[#ff2a55] hover:opacity-95 text-white font-bold text-sm shadow-[0_10px_35px_rgba(225,20,56,0.65)] active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                </button>
              </form>
            )}

            {/* ================= VIEW: SIGN UP (DETAILS) ================= */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUpInitiate}>
                <div className="mb-3.5">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                  />
                </div>

                <div className="mb-3.5">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">A 6-digit verification code will be sent to this email.</span>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 pr-11 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 bg-transparent border-none cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#e11438] via-[#e50914] to-[#ff2a55] hover:opacity-95 text-white font-bold text-sm shadow-[0_10px_35px_rgba(225,20,56,0.65)] active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
                  <span>{loading ? 'Sending verification code...' : 'Continue'}</span>
                </button>
              </form>
            )}

            {/* ================= VIEW: VERIFY OTP (FOR SIGN UP) ================= */}
            {mode === 'verify-signup' && (
              <form onSubmit={handleVerifySignUpOTP}>
                <div className="mb-4 text-center">
                  <p className="text-xs text-gray-300">
                    Enter the 6-digit verification code sent to <strong className="text-white">{email}</strong>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Please check your email inbox and spam folder.
                  </p>
                </div>
                {/* 6 OTP Input Boxes */}
                <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-5" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-2xl bg-[#140609] border border-white/15 text-white focus:outline-none focus:border-[#e11438] focus:ring-2 focus:ring-[#e11438]/30 transition-all shadow-inner"
                    />
                  ))}
                </div>

                {/* Resend Timer & Link */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-5 px-1">
                  <span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={loading}
                        className="text-[#ff385c] hover:underline font-semibold bg-transparent border-none cursor-pointer p-0"
                      >
                        Resend Code
                      </button>
                    ) : (
                      `Resend code in 00:${resendTimer < 10 ? '0' + resendTimer : resendTimer}`
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleModeSwitch('signup')}
                    className="text-gray-400 hover:text-white underline bg-transparent border-none cursor-pointer p-0"
                  >
                    Change Email
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length !== 6}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#e11438] via-[#e50914] to-[#ff2a55] hover:opacity-95 text-white font-bold text-sm shadow-[0_10px_35px_rgba(225,20,56,0.65)] active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
                  <span>{loading ? 'Verifying...' : 'Verify & Create Account'}</span>
                </button>
              </form>
            )}

            {/* ================= VIEW: FORGOT PASSWORD (EMAIL INPUT) ================= */}
            {mode === 'forgot-password' && (
              <form onSubmit={handleForgotPasswordInitiate}>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Registered Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#e11438] via-[#e50914] to-[#ff2a55] hover:opacity-95 text-white font-bold text-sm shadow-[0_10px_35px_rgba(225,20,56,0.65)] active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
                  <span>{loading ? 'Sending code...' : 'Send Recovery Code'}</span>
                </button>

                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('signin')}
                    className="text-xs text-[#e11438] hover:text-[#ff385c] font-semibold bg-transparent border-none cursor-pointer underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* ================= VIEW: VERIFY OTP & RESET PASSWORD ================= */}
            {mode === 'verify-reset' && (
              <form onSubmit={handleVerifyResetSubmit}>
                <div className="mb-4 text-center">
                  <p className="text-xs text-gray-300">
                    Enter the 6-digit recovery code sent to <strong className="text-white">{email}</strong>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Please check your email inbox and spam folder.
                  </p>
                </div>
                {/* 6 OTP Input Boxes */}
                <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-4" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-2xl bg-[#140609] border border-white/15 text-white focus:outline-none focus:border-[#e11438] focus:ring-2 focus:ring-[#e11438]/30 transition-all shadow-inner"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-4 px-1">
                  <span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={loading}
                        className="text-[#ff385c] hover:underline font-semibold bg-transparent border-none cursor-pointer p-0"
                      >
                        Resend Code
                      </button>
                    ) : (
                      `Resend code in 00:${resendTimer < 10 ? '0' + resendTimer : resendTimer}`
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('forgot-password')}
                    className="text-gray-400 hover:text-white underline bg-transparent border-none cursor-pointer p-0"
                  >
                    Change Email
                  </button>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length !== 6}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#e11438] via-[#e50914] to-[#ff2a55] hover:opacity-95 text-white font-bold text-sm shadow-[0_10px_35px_rgba(225,20,56,0.65)] active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
                  <span>{loading ? 'Updating password...' : 'Update Password'}</span>
                </button>

                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('signin')}
                    className="text-xs text-[#e11438] hover:text-[#ff385c] font-semibold bg-transparent border-none cursor-pointer underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* ================= SOCIAL LOGIN (Google) ================= */}
            {(mode === 'signin' || mode === 'signup') && (
              <>
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-[1px] bg-white/10"></div>
                  <span className="text-xs text-gray-400 font-medium">Or</span>
                  <div className="flex-1 h-[1px] bg-white/10"></div>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleSignIn}
                    className="w-full py-3 px-4 rounded-full bg-[#18090d] hover:bg-[#250e15] border border-white/10 active:scale-[0.98] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>

                  {mode === 'signin' && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        setEmail('demo@eduhunters.com');
                        setPassword('demo123');
                        try {
                          setLoading(true);
                          setStatusMsg(null);
                          const authUser = await login('demo@eduhunters.com', 'demo123');
                          setStatusMsg({ type: 'success', text: 'Logged in as Demo Student!' });
                          setTimeout(() => {
                            if (onSuccess) onSuccess(authUser);
                            handleClose();
                          }, 600);
                        } catch (err) {
                          setStatusMsg({ type: 'error', text: formatAuthError(err) });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-full bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 active:scale-[0.98] text-gray-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>⚡ Quick Login as Demo Student</span>
                    </button>
                  )}
                </div>

                {/* Bottom Switch: Sign In <-> Sign Up */}
                <div className="text-center mt-5 pt-1">
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

                <p className="text-[11px] text-gray-500 text-center mt-4 leading-relaxed">
                  অ্যাকাউন্ট তৈরি বা লগইন করার মাধ্যমে আপনি আমাদের{' '}
                  <a href="/terms" target="_blank" rel="noreferrer" className="text-[#e11438] hover:underline font-medium">
                    শর্তাবলী
                  </a>{' '}
                  ও{' '}
                  <a href="/refund-policy" target="_blank" rel="noreferrer" className="text-[#e11438] hover:underline font-medium">
                    রিফান্ড পলিসিতে
                  </a>{' '}
                  সম্মত হচ্ছেন।
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
