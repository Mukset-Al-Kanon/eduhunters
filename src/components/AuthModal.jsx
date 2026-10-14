import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, formatAuthError, isInAppBrowser } from '../context/AuthContext';
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
  const { login, signup, loginWithGoogle, resetPassword, updateUserPassword } = useAuth();

  // Modal Flow Mode: 'signin' | 'signup' | 'verify-signup' | 'forgot-password' | 'verify-reset' | 'welcome'
  const [mode, setMode] = useState(initialMode);
  
  // Form Inputs
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // 6-Digit OTP State & Timers
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(300); // 5-minute expiry in seconds
  
  // Status, Loading & UI Animation
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

  // Smart Detection of Previously Used Auth Method
  const [lastAuthMethod, setLastAuthMethod] = useState(null);
  const [lastAuthEmail, setLastAuthEmail] = useState(null);

  // References for the 6 OTP input boxes
  const otpInputRefs = useRef([]);

  // Mode switcher with smooth crossfade while preserving email
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
      setShouldRender(false);
    }, 380);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setMode(initialMode || 'signin');
      setStatusMsg(null);
      setOtpDigits(['', '', '', '', '', '']);
      setRememberMe(true);

      // Check last used authentication method
      try {
        const method = localStorage.getItem('eh_last_auth_method');
        const lastEmail = localStorage.getItem('eh_last_auth_email');
        setLastAuthMethod(method || null);
        setLastAuthEmail(lastEmail || null);

        const savedEmail = localStorage.getItem('eh_remembered_email');
        if (savedEmail && savedEmail !== 'demo@eduhunters.com') {
          setEmail(savedEmail);
        } else if (lastEmail && !email) {
          setEmail(lastEmail);
        } else if (savedEmail === 'demo@eduhunters.com') {
          localStorage.removeItem('eh_remembered_email');
          setEmail('');
        }
      } catch (e) {}

      // Guarantee initial zero-opacity/scaled-down frame is painted before transitioning
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 380);
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

  // Countdown timer for OTP Resend (60s) & Expiry (300s)
  useEffect(() => {
    let resendInterval = null;
    let expiryInterval = null;

    if (mode === 'verify-signup' || mode === 'verify-reset') {
      if (resendTimer > 0) {
        setCanResend(false);
        resendInterval = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setCanResend(true);
      }

      if (otpExpiresIn > 0) {
        expiryInterval = setInterval(() => {
          setOtpExpiresIn((prev) => Math.max(0, prev - 1));
        }, 1000);
      } else {
        setCanResend(true);
      }
    }

    return () => {
      if (resendInterval) clearInterval(resendInterval);
      if (expiryInterval) clearInterval(expiryInterval);
    };
  }, [mode, resendTimer, otpExpiresIn]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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
    const cleanValue = value.replace(/\D/g, ''); // Numbers only
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

    const cleanEmail = email.trim();
    if (!cleanEmail || !isValidEmailFormat(cleanEmail)) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (!password) {
      setStatusMsg({ type: 'error', text: 'Please enter your password.' });
      return;
    }

    try {
      setLoading(true);
      const authUser = await login(cleanEmail, password);
      if (rememberMe) {
        localStorage.setItem('eh_remembered_email', cleanEmail);
      } else {
        localStorage.removeItem('eh_remembered_email');
      }
      setStatusMsg({ type: 'success', text: 'Signed in successfully! Welcome back.' });
      setTimeout(() => {
        if (onSuccess) onSuccess(authUser);
        handleClose();
      }, 200);
    } catch (err) {
      const isGoogleSuggestion = err.code === 'auth/use-google-signin' || Boolean(err.suggestGoogleSignIn);
      setStatusMsg({ 
        type: 'error', 
        text: formatAuthError(err),
        suggestGoogleSignIn: isGoogleSuggestion 
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 2: INITIATE SIGN UP & DISPATCH OTP =================
  const handleSignUpInitiate = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    const cleanEmail = email.trim();
    if (!name.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your full name.' });
      return;
    }

    if (!cleanEmail || !isValidEmailFormat(cleanEmail)) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    // Block fake/temporary disposable domains
    if (isDisposableEmail(cleanEmail)) {
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
      await sendVerificationOTP(cleanEmail, name);
      setOtpExpiresIn(300);
      setResendTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      
      setStatusMsg({
        type: 'success',
        text: `A 6-digit verification code has been dispatched to ${cleanEmail}.`
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

    const cleanEmail = email.trim();
    if (otpExpiresIn <= 0) {
      setStatusMsg({
        type: 'error',
        text: 'Verification code has expired (5 minutes). Please click Resend Code to request a new code.'
      });
      return;
    }

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setStatusMsg({ type: 'error', text: 'Please enter the complete 6-digit verification code.' });
      return;
    }

    // Verify OTP against the service
    const verifyResult = await verifyEnteredOTP(cleanEmail, fullCode);
    if (!verifyResult.valid) {
      setStatusMsg({ type: 'error', text: verifyResult.error });
      return;
    }

    try {
      setLoading(true);
      const authUser = await signup(cleanEmail, password, name);
      setStatusMsg({
        type: 'success',
        text: 'Email verified successfully! Welcome to Edu Hunters.'
      });

      setTimeout(() => {
        if (onSuccess) onSuccess(authUser);
        handleClose();
      }, 200);
    } catch (err) {
      const isGoogleSuggestion = err.code === 'auth/use-google-signin' || Boolean(err.suggestGoogleSignIn);
      setStatusMsg({ 
        type: 'error', 
        text: formatAuthError(err),
        suggestGoogleSignIn: isGoogleSuggestion 
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 4A: DISPATCH OFFICIAL FIREBASE RESET LINK =================
  const handleSendResetEmail = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setStatusMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !isValidEmailFormat(cleanEmail)) {
      setStatusMsg({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(cleanEmail);
      setStatusMsg({
        type: 'success',
        text: res.message || `A password reset link has been dispatched to ${cleanEmail}. Please check your Inbox and Spam folders.`
      });
    } catch (err) {
      setStatusMsg({ type: 'error', text: formatAuthError(err) });
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 4B: INITIATE FORGOT PASSWORD WITH 6-DIGIT OTP =================
  const handleForgotPasswordInitiate = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !isValidEmailFormat(cleanEmail)) {
      setStatusMsg({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }

    try {
      setLoading(true);
      await sendVerificationOTP(cleanEmail, 'Student');
      setOtpExpiresIn(300);
      setResendTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      setPassword('');
      setConfirmPassword('');

      setStatusMsg({
        type: 'success',
        text: `A 6-digit verification code has been dispatched to ${cleanEmail}.`
      });

      setTimeout(() => {
        setMode('verify-reset');
      }, 400);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to dispatch verification code.' });
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 5: VERIFY OTP & RESET PASSWORD =================
  const handleVerifyResetPassword = async (e) => {
    e.preventDefault();
    setStatusMsg(null);

    const cleanEmail = email.trim();
    if (otpExpiresIn <= 0) {
      setStatusMsg({
        type: 'error',
        text: 'Verification code has expired (5 minutes). Please click Resend Code to request a new code.'
      });
      return;
    }

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setStatusMsg({ type: 'error', text: 'Please enter the complete 6-digit verification code.' });
      return;
    }

    const verifyResult = await verifyEnteredOTP(cleanEmail, fullCode);
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
      await updateUserPassword(cleanEmail, password);
      const authUser = await login(cleanEmail, password);

      setStatusMsg({
        type: 'success',
        text: 'Password updated successfully! Welcome back to Edu Hunters.'
      });

      setTimeout(() => {
        if (onSuccess) onSuccess(authUser);
        handleClose();
      }, 200);
    } catch (err) {
      setStatusMsg({ type: 'error', text: formatAuthError(err) });
    } finally {
      setLoading(false);
    }
  };

  // Resend Reset Password OTP Handler
  const handleResendResetOTP = async () => {
    if (!canResend || loading) return;
    try {
      setLoading(true);
      setStatusMsg(null);
      await sendVerificationOTP(email.trim(), 'Student');
      setOtpExpiresIn(300);
      setResendTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      setStatusMsg({
        type: 'success',
        text: 'A fresh 6-digit verification code has been dispatched.'
      });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to resend code.' });
    } finally {
      setLoading(false);
    }
  };

  // Resend Signup OTP Handler
  const handleResendOTP = async () => {
    if (!canResend || loading) return;
    try {
      setLoading(true);
      setStatusMsg(null);
      await sendVerificationOTP(email.trim(), name || 'Student');
      setOtpExpiresIn(300);
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
      if (!authUser) return; // In case redirect was triggered on mobile
      setStatusMsg({ type: 'success', text: 'Signed in with Google successfully!' });
      setTimeout(() => {
        if (onSuccess) onSuccess(authUser);
        handleClose();
      }, 200);
    } catch (err) {
      const isGoogleSuggestion = err.code === 'auth/use-google-signin' || Boolean(err.suggestGoogleSignIn);
      setStatusMsg({ 
        type: 'error', 
        text: formatAuthError(err),
        suggestGoogleSignIn: isGoogleSuggestion 
      });
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
        className={`fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-[380ms] ease-out cursor-pointer ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Main Auth Container */}
      <div
        className={`relative w-full max-w-[430px] rounded-[36px] bg-gradient-to-b from-[#2e050c] via-[#0f0305] to-[#070102] text-white p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] border border-[#e11438]/20 overflow-hidden z-10 max-h-[95vh] overflow-y-auto transform transition-all duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity] ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.93] translate-y-6 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Crimson Radial Glow */}
        <div className={`absolute -top-28 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#e11438]/25 rounded-full blur-[90px] pointer-events-none transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} />

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
            {/* Header: Brand Text */}
            <div className="flex items-center justify-center mb-3">
              <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#ff385c]">Edu Hunters</span>
            </div>

            {/* Screen Titles & Subtitles */}
            <div className={`text-center transition-all duration-200 ease-out ${isSwitchingMode ? 'opacity-0 -translate-y-1.5' : 'opacity-100 translate-y-0'}`}>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center">
                {mode === 'signin' && 'Sign In to Account'}
                {mode === 'signup' && 'Create New Account'}
                {mode === 'verify-signup' && 'Verify Your Email'}
                {mode === 'forgot-password' && 'Reset Password'}
                {mode === 'verify-reset' && 'Set New Password'}
              </h2>
              <p className="text-xs text-gray-400 mt-1.5 mb-4 max-w-[320px] mx-auto text-center leading-relaxed">
                {mode === 'signin' && 'Enter your details to access your courses and exams.'}
                {mode === 'signup' && 'Sign up to enroll in live classes and take interactive exams.'}
                {mode === 'verify-signup' && 'Verify your email address to complete registration.'}
                {mode === 'forgot-password' && 'Choose your preferred method to reset your account password.'}
                {mode === 'verify-reset' && 'Enter the 6-digit code sent to your email and your new password.'}
              </p>
            </div>

            {/* Mobile / In-App Browser Advisory */}
            {isInAppBrowser() && (
              <div className="mb-3.5 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed flex items-start gap-2 animate-fadeIn">
                <span className="shrink-0 text-amber-400 text-sm leading-none mt-0.5">ℹ️</span>
                <span>
                  Using Facebook/Messenger? If Google Sign-In closes, tap <strong>(⋮)</strong> and choose <strong>"Open in Chrome/Browser"</strong>.
                </span>
              </div>
            )}

            {/* Smart "Previously Used Google" Quick Button for Returning Students */}
            {mode === 'signin' && lastAuthMethod === 'google' && (
              <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-white/[0.08] to-white/[0.03] border border-[#e11438]/40 shadow-sm flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-300 font-medium leading-tight">Previously Used</p>
                    <p className="text-xs text-white font-bold truncate">{lastAuthEmail || 'Google Account'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="shrink-0 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#e11438] to-[#ff2a55] hover:opacity-90 active:scale-95 text-white text-xs font-bold transition-all shadow-md cursor-pointer border-none"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Status Message Notification Box */}
            {statusMsg && (
              <div
                className={`p-3.5 rounded-2xl mb-4 text-xs font-medium border flex flex-col gap-2 animate-fadeIn shadow-sm backdrop-blur-md ${
                  statusMsg.type === 'error'
                    ? 'bg-red-950/40 border-red-500/30 text-red-200'
                    : 'bg-white/[0.08] border-white/20 text-gray-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
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

                {/* Instant 1-Click "Sign in with Google" button if error suggests it */}
                {statusMsg.suggestGoogleSignIn && (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="mt-1.5 w-full py-2.5 px-3 rounded-xl bg-white hover:bg-gray-100 active:scale-98 text-gray-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border-none shadow-md"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Sign in with Google Now</span>
                  </button>
                )}
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
                    className="w-full px-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-base sm:text-sm focus:outline-none focus:border-[#e11438] transition-colors"
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
                      className="w-full px-4 py-3 pr-11 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-base sm:text-sm focus:outline-none focus:border-[#e11438] transition-colors"
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
                    className="w-full px-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-base sm:text-sm focus:outline-none focus:border-[#e11438] transition-colors"
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
                    className="w-full px-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-base sm:text-sm focus:outline-none focus:border-[#e11438] transition-colors"
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
                      className="w-full px-4 py-3 pr-11 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-base sm:text-sm focus:outline-none focus:border-[#e11438] transition-colors"
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

                <div className="flex items-center justify-between text-xs text-gray-400 mb-5 px-1">
                  <div className="flex items-center gap-1.5">
                    {otpExpiresIn > 0 ? (
                      <>
                        <span className={`w-2 h-2 rounded-full ${otpExpiresIn <= 60 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                        <span>Expires in:</span>
                        <span className="font-mono text-white font-semibold">{formatTimer(otpExpiresIn)}</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-red-400 font-semibold">Expired</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    {canResend || otpExpiresIn === 0 ? (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={loading}
                        className="text-[#ff385c] hover:underline font-semibold bg-transparent border-none cursor-pointer p-0"
                      >
                        Resend Code
                      </button>
                    ) : (
                      <span className="text-gray-500">
                        Resend in {resendTimer}s
                      </span>
                    )}

                    <span className="text-gray-600">·</span>

                    <button
                      type="button"
                      onClick={() => handleModeSwitch('signup')}
                      className="text-gray-400 hover:text-white underline bg-transparent border-none cursor-pointer p-0"
                    >
                      Change Email
                    </button>
                  </div>
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

            {/* ================= VIEW: FORGOT PASSWORD (EMAIL INPUT & OPTIONS) ================= */}
            {mode === 'forgot-password' && (
              <div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Registered Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-base sm:text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Works for both Email/Password accounts and Google-registered accounts.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* Primary Method: Official Reset Link */}
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={loading || !email}
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#e11438] via-[#e50914] to-[#ff2a55] hover:opacity-95 text-white font-bold text-sm shadow-[0_10px_35px_rgba(225,20,56,0.65)] active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
                    <span>{loading ? 'Sending link...' : 'Send Password Reset Link'}</span>
                  </button>

                  {/* Alternative Method: 6-Digit OTP */}
                  <button
                    type="button"
                    onClick={handleForgotPasswordInitiate}
                    disabled={loading || !email}
                    className="w-full py-3 px-4 rounded-full bg-[#18090d] hover:bg-[#250e15] border border-white/10 text-gray-300 hover:text-white font-medium text-xs transition-all cursor-pointer"
                  >
                    Or Verify with 6-Digit Code (Instant OTP)
                  </button>
                </div>

                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('signin')}
                    className="text-xs text-[#e11438] hover:text-[#ff385c] font-semibold bg-transparent border-none cursor-pointer underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* ================= VIEW: VERIFY OTP & RESET PASSWORD ================= */}
            {mode === 'verify-reset' && (
              <form onSubmit={handleVerifyResetPassword}>
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
                  <div className="flex items-center gap-1.5">
                    {otpExpiresIn > 0 ? (
                      <>
                        <span className={`w-2 h-2 rounded-full ${otpExpiresIn <= 60 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                        <span>Expires in:</span>
                        <span className="font-mono text-white font-semibold">{formatTimer(otpExpiresIn)}</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-red-400 font-semibold">Expired</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    {canResend || otpExpiresIn === 0 ? (
                      <button
                        type="button"
                        onClick={handleResendResetOTP}
                        disabled={loading}
                        className="text-[#ff385c] hover:underline font-semibold bg-transparent border-none cursor-pointer p-0"
                      >
                        Resend Code
                      </button>
                    ) : (
                      <span className="text-gray-500">
                        Resend in {resendTimer}s
                      </span>
                    )}

                    <span className="text-gray-600">·</span>

                    <button
                      type="button"
                      onClick={() => handleModeSwitch('forgot-password')}
                      className="text-gray-400 hover:text-white underline bg-transparent border-none cursor-pointer p-0"
                    >
                      Change Email
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-base sm:text-sm focus:outline-none focus:border-[#e11438] transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white bg-transparent border-none cursor-pointer p-0"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-base sm:text-sm focus:outline-none focus:border-[#e11438] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length !== 6 || !password || !confirmPassword}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#e11438] via-[#e50914] to-[#ff2a55] hover:opacity-95 text-white font-bold text-sm shadow-[0_10px_35px_rgba(225,20,56,0.65)] active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
                  <span>{loading ? 'Updating Password...' : 'Reset Password & Sign In'}</span>
                </button>

                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('signin')}
                    className="text-xs text-gray-400 hover:text-white underline bg-transparent border-none cursor-pointer"
                  >
                    Cancel & Return to Sign In
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
                    className="w-full py-3 px-4 rounded-full bg-[#18090d] hover:bg-[#250e15] border border-white/10 hover:border-white/20 active:scale-[0.98] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
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
                  By signing in or creating an account, you agree to our{' '}
                  <a href="/terms" target="_blank" rel="noreferrer" className="text-[#e11438] hover:underline font-medium">
                    Terms
                  </a>{' '}
                  &{' '}
                  <a href="/refund-policy" target="_blank" rel="noreferrer" className="text-[#e11438] hover:underline font-medium">
                    Refund Policy
                  </a>.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
