import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';



const POPULAR_BATCHES = ['HSC 25', 'HSC 26', 'HSC 27', 'HSC 28'];

export default function ProfileModal({ 
  isOpen, 
  onClose,
  onSaveSuccess,
  hintNotice,
  requireCompletion = false,
  title,
  subtitle,
  submitText
}) {
  const { currentUser, updateUserProfile } = useAuth();

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [college, setCollege] = useState('');
  const [hscBatch, setHscBatch] = useState('HSC 26');
  
  const fileInputRef = useRef(null);

  // Synchronize state when opened
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setStatusMsg(null);
      
      // Populate with existing user profile
      if (currentUser) {
        setDisplayName(currentUser.displayName || currentUser.name || '');
        setPhotoURL(currentUser.photoURL || '/avatar.svg');
        setWhatsapp(currentUser.whatsapp || currentUser.phone || currentUser.phoneNumber || '');
        setCollege(currentUser.college || currentUser.institution || '');
        const existingBatch = currentUser.hscBatch || currentUser.batch;
        setHscBatch(existingBatch && ['HSC 25', 'HSC 26', 'HSC 27', 'HSC 28'].includes(existingBatch) ? existingBatch : (existingBatch || 'HSC 26'));
      } else {
        setHscBatch('HSC 26');
      }

      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 380);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentUser]);

  // Smooth dismiss handler
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
      setShouldRender(false);
    }, 380);
  }, [onClose]);

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

  // Handle local file image upload with automatic canvas optimization
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Please select a valid image file.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'Image size should be less than 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize to max 320x320 for lightning fast storage
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setPhotoURL(dataUrl);
        setStatusMsg({ type: 'success', text: 'New photo selected! Click Save Changes.' });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Save profile submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim().length < 2) {
      setStatusMsg({ type: 'error', text: 'Please enter your full name.' });
      return;
    }

    if (requireCompletion) {
      const cleanPhone = whatsapp.replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        setStatusMsg({ type: 'error', text: 'Please enter a valid 10/11-digit mobile or WhatsApp number.' });
        return;
      }
      if (!college.trim() || college.trim().length < 2) {
        setStatusMsg({ type: 'error', text: 'Please enter your college or institution name.' });
        return;
      }
      if (!hscBatch.trim()) {
        setStatusMsg({ type: 'error', text: 'Please select your class or HSC batch.' });
        return;
      }
    }

    try {
      setLoading(true);
      setStatusMsg(null);

      const updates = {
        displayName: displayName.trim(),
        name: displayName.trim(),
        photoURL: photoURL.trim() || '/avatar.svg',
        whatsapp: whatsapp.trim(),
        phone: whatsapp.trim(),
        phoneNumber: whatsapp.trim(),
        college: college.trim(),
        institution: college.trim(),
        hscBatch: hscBatch.trim() || 'HSC 26',
        batch: hscBatch.trim() || 'HSC 26'
      };

      if (updateUserProfile) {
        await updateUserProfile(updates);
      }

      setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
      
      setTimeout(() => {
        handleClose();
        if (onSaveSuccess) {
          onSaveSuccess(updates);
        }
      }, 450);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 select-none ${
        isVisible ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Dark blur backdrop overlay matching AuthModal */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-[380ms] ease-out cursor-pointer ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Main Profile Modal Card */}
      <div
        className={`relative w-full max-w-[460px] rounded-[36px] bg-gradient-to-b from-[#2e050c] via-[#0f0305] to-[#070102] text-white p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95)] border border-[#e11438]/25 overflow-hidden z-10 max-h-[92vh] overflow-y-auto transform transition-all duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity] ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.93] translate-y-6 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Crimson Radial Glow */}
        <div
          className={`absolute -top-28 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#e11438]/25 rounded-full blur-[90px] pointer-events-none transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Close Button ('X') */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200 border-none cursor-pointer z-20"
          title="Close"
          type="button"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header Title */}
        <div className="text-center pt-1 mb-4">
          <h2 className="text-2xl font-black tracking-tight text-white">
            {title || (requireCompletion ? 'Complete Your Profile' : 'Edit Profile')}
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-[340px] mx-auto leading-relaxed">
            {subtitle || (requireCompletion 
              ? 'Please fill in your details to access trial classes and course enrollment.' 
              : 'Customize your avatar, contact, and academic details for EduHunters.')}
          </p>
        </div>

        {/* Action Hint Notice Banner */}
        {hintNotice && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#e11438]/15 border border-[#e11438]/35 text-red-200 text-xs flex items-start gap-2.5 shadow-sm animate-fadeIn">
            <span className="text-base shrink-0">⚠️</span>
            <span className="leading-relaxed font-medium">{hintNotice}</span>
          </div>
        )}

        {/* Notification Status Banner */}
        {statusMsg && (
          <div
            className={`p-3.5 rounded-2xl mb-4 text-xs font-medium border flex items-center gap-2.5 animate-fadeIn backdrop-blur-md ${
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
                  <line x1="12" y1="8" x2="12" y2="12" />
                </svg>
              </span>
            ) : (
              <span className="shrink-0 text-[#ff4d6d]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
            <span className="leading-snug text-[12.5px]">{statusMsg.text}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {/* Outer Glowing Border */}
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#991b1b] via-[#e11438] to-[#ff4d6d] shadow-[0_0_25px_rgba(225,20,56,0.45)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#140609] relative">
                  <img
                    src={photoURL || '/avatar.svg'}
                    alt="User Avatar"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/avatar.svg';
                    }}
                  />
                  {/* Hover Overlay with Camera Icon */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-200">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className="text-[10px] font-semibold text-white/90 mt-0.5">Upload</span>
                  </div>
                </div>
              </div>

              {/* Upload Badge */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#e11438] hover:bg-[#ff1744] text-white flex items-center justify-center shadow-lg border-2 border-[#0f0305] transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title="Upload Photo"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

          </div>

          {/* User Email (Read-only Badge) */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span className="text-xs text-gray-300 truncate">
                {currentUser?.email || 'student@eduhunters.com'}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
              Verified
            </span>
          </div>

          {/* Full Name Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Full Name <span className="text-[#ff4d6d]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sanjid Rayhan"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
            </div>
          </div>

          {/* WhatsApp Number Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
              <span>
                WhatsApp / Mobile Number {requireCompletion && <span className="text-[#ff4d6d]">*</span>}
              </span>
              <span className="text-[11px] text-gray-400 font-normal">Active BD number</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. 01342227935"
                required={requireCompletion}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </span>
            </div>
          </div>

          {/* College / Institution Name Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              College / Institution {requireCompletion && <span className="text-[#ff4d6d]">*</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. Dhaka College / Notre Dame College"
                required={requireCompletion}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#e11438] transition-colors"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </span>
            </div>
          </div>

          {/* HSC Batch Selector & Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              HSC Batch
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {POPULAR_BATCHES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setHscBatch(b)}
                  className={`py-2 px-1 text-center text-xs font-bold rounded-xl transition-all border cursor-pointer ${
                    hscBatch === b
                      ? 'bg-[#e11438] text-white border-[#ff4d6d] shadow-[0_0_12px_rgba(225,20,56,0.4)]'
                      : 'bg-white/[0.04] text-gray-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                value={hscBatch}
                onChange={(e) => setHscBatch(e.target.value)}
                placeholder="Custom batch (e.g. HSC 26 - Medical)"
                className="w-full px-4 py-2.5 rounded-xl bg-[#140609] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#e11438] transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/10 text-gray-300 hover:text-white text-xs sm:text-sm font-semibold transition-all border border-white/10 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-[1.5] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#991b1b] to-[#e11438] hover:from-[#b91c1c] hover:to-[#ff1744] text-white text-xs sm:text-sm font-bold shadow-[0_4px_20px_rgba(225,20,56,0.45)] hover:shadow-[0_6px_25px_rgba(225,20,56,0.6)] transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 border-none cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{submitText || (requireCompletion ? 'Save & Start Learning' : 'Save Changes')}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
