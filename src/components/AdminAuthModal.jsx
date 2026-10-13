import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Key, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { 
  authenticateAdmin, 
  registerAdmin, 
  ADMIN_SECURITY_MASTER_KEY 
} from '../services/adminAuthService';

export default function AdminAuthModal({
  isOpen = true,
  onSuccess,
  onClose
}) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  
  // Sign In State (Clean & Empty by default for strict security)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSecurityKey, setRegSecurityKey] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);

  // Status & UI
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Clear messages when mode changes
  const handleModeChange = (newMode) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setMode(newMode);
  };

  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Check lockout on mount and interval
  useEffect(() => {
    const checkLockout = () => {
      try {
        const raw = sessionStorage.getItem('eh_admin_lockout_until');
        if (raw) {
          const until = parseInt(raw, 10);
          const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
          setLockoutRemaining(remaining);
        }
      } catch (e) {}
    };
    checkLockout();
    const timer = setInterval(checkLockout, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Login Submit with Brute-Force Rate Limiting
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Check if locked out
    try {
      const lockUntil = parseInt(sessionStorage.getItem('eh_admin_lockout_until') || '0', 10);
      if (Date.now() < lockUntil) {
        const remainingSecs = Math.ceil((lockUntil - Date.now()) / 1000);
        setErrorMsg(`Too many failed attempts. Security cooldown active for ${remainingSecs}s.`);
        return;
      }
    } catch (e) {}

    setLoading(true);

    try {
      const session = await authenticateAdmin(loginEmail, loginPassword, rememberMe);
      // Reset failed attempts on success
      try {
        sessionStorage.removeItem('eh_admin_failed_attempts');
        sessionStorage.removeItem('eh_admin_lockout_until');
      } catch (e) {}

      setSuccessMsg(`Welcome, ${session.name}! Access granted.`);
      setTimeout(() => {
        if (onSuccess) onSuccess(session);
      }, 400);
    } catch (err) {
      // Increment failed attempts
      let attempts = 1;
      try {
        attempts = parseInt(sessionStorage.getItem('eh_admin_failed_attempts') || '0', 10) + 1;
        sessionStorage.setItem('eh_admin_failed_attempts', String(attempts));
        if (attempts >= 5) {
          const lockUntil = Date.now() + 3 * 60 * 1000; // 3 minute lock
          sessionStorage.setItem('eh_admin_lockout_until', String(lockUntil));
          setLockoutRemaining(180);
          setErrorMsg('Too many failed attempts. Security lockout active for 3 minutes.');
          setLoading(false);
          return;
        }
      } catch (e) {}

      const remainingAttempts = 5 - attempts;
      setErrorMsg(`${err.message || 'Authorization failed.'} (${remainingAttempts} attempt(s) remaining before security lockout)`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      const session = await registerAdmin({
        name: regName,
        email: regEmail,
        password: regPassword,
        securityKey: regSecurityKey,
        rememberMe
      });

      setSuccessMsg(`Admin account created for ${session.name}! Access granted.`);
      setTimeout(() => {
        if (onSuccess) onSuccess(session);
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Admin registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 select-none">
      {/* Dark Ambient Backdrop */}
      <div 
        className="absolute inset-0 bg-[#06080e]/85 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Cyber-Security Ambient Glow Behind Modal */}
      <div 
        className="absolute w-[500px] h-[400px] rounded-full pointer-events-none opacity-40 blur-[80px]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.45) 0%, rgba(225, 20, 56, 0.3) 50%, transparent 80%)'
        }}
      />

      {/* Central Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0f141f] border border-slate-700/70 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-slate-100 overflow-hidden">
        
        {/* Subtle Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold tracking-widest text-indigo-300 uppercase mb-2">
            <Lock className="w-2.5 h-2.5" />
            <span>Restricted Access • Admin Portal</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Edu Hunters Admin
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authorized personnel login required for security
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-[#161c2b] p-1 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => handleModeChange('signin')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Admin Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Admin
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed font-semibold">{successMsg}</span>
          </div>
        )}

        {/* MODE: SIGN IN */}
        {mode === 'signin' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="Enter official admin email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#161c2b] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={loginShowPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter admin password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#161c2b] border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setLoginShowPassword(!loginShowPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {loginShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Session */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5 bg-slate-900"
                />
                <span className="text-[11px]">Remember admin session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.99] text-white text-xs font-black tracking-wide uppercase shadow-[0_4px_20px_rgba(79,70,229,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize & Enter Admin Panel</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* MODE: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Admin Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Mukset - Head Admin"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-[#161c2b] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="e.g. mukset@eduhunters.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-[#161c2b] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type={regShowPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 6 chars"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-[#161c2b] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Confirm
                </label>
                <input
                  type={regShowPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full bg-[#161c2b] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Security Master Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Security Master Passcode
                </label>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter secret authorization passcode"
                  value={regSecurityKey}
                  onChange={(e) => setRegSecurityKey(e.target.value)}
                  className="w-full bg-[#161c2b] border border-amber-500/50 rounded-xl pl-10 pr-3.5 py-2 text-xs font-mono text-amber-200 placeholder-slate-500 outline-none focus:border-amber-400 transition-all"
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Restricted authorization passcode required to create admin accounts.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white text-xs font-black tracking-wide uppercase shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering Admin...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Admin Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to Website Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Edu Hunters Website</span>
          </button>
        </div>
      </div>
    </div>
  );
}
