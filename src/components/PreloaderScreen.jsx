import React, { useState, useEffect, useRef } from 'react';

/**
 * PreloaderScreen — Symmetrical, buttery-smooth loading screen
 * Key upgrades:
 * - Fluid 60fps/120fps hardware-accelerated progress animation (no stepping / no stuttering)
 * - Vertically centered symmetrical lockup: enlarged logo mark placed directly ABOVE brand name
 * - Clean, sleek, non-robotic modern typography for percentage counter
 * - Deep dark background with atmospheric red glow
 */
export default function PreloaderScreen({ onFinish, siteSettings = {} }) {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const progressBarRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    let animId;
    const startTime = performance.now();
    const duration = 1800; // 1.8 seconds silky-smooth, fluid progression

    // Continuous 4th-order ease-out for natural deceleration into 100%
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const tick = (now) => {
      const elapsed = now - startTime;
      const progressFraction = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progressFraction);
      const currentPercent = Math.min(Math.round(eased * 100), 100);

      setProgress(currentPercent);

      // Hardware-accelerated GPU scale transform (eliminates layout reflow and CSS transition stutter)
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${eased})`;
      }

      if (progressFraction < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            document.body.style.overflow = '';
            if (onFinish) onFinish();
          }, 450);
        }, 120);
      }
    };

    animId = requestAnimationFrame(tick);

    // Hard fallback safety timer
    const safetyTimer = setTimeout(() => {
      setProgress(100);
      setIsFadingOut(true);
      setTimeout(() => {
        document.body.style.overflow = '';
        if (onFinish) onFinish();
      }, 400);
    }, 2400);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      clearTimeout(safetyTimer);
      document.body.style.overflow = '';
    };
  }, [onFinish]);

  return (
    <div
      id="minimal-preloader"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between select-none overflow-hidden transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#070102'
      }}
    >
      {/* Exact Website Dark Theme Background Images */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Desktop / Tablet Background */}
        <img
          src="/dark-bg-desktop.png"
          alt=""
          className="hidden md:block w-full h-full object-cover object-center"
        />
        {/* Mobile Background */}
        <img
          src="/dark-bg-mobile.png"
          alt=""
          className="block md:hidden w-full h-full object-cover object-center"
        />
        {/* Subtle cinematic overlay to blend seamlessly */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Center Atmospheric Red Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[360px] rounded-full pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(225, 20, 56, 0.45) 0%, rgba(180, 15, 40, 0.22) 40%, transparent 75%)',
          filter: 'blur(50px)'
        }}
      />

      {/* Top Spacer */}
      <div className="w-full flex-1 relative z-10" />

      {/* Center Cluster */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm sm:max-w-md w-full">
        
        {/* Symmetrical Brand Lockup: Logo Mark on Top + Brand Name Below */}
        <div className="flex flex-col items-center justify-center mb-7">
          <img 
            src="/eduhunters-mark-white.png" 
            alt="Edu Hunters Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain mb-3 drop-shadow-[0_0_24px_rgba(225,20,56,0.9)]"
          />
          <h2 
            className="text-2xl sm:text-[28px] font-black tracking-tight text-white leading-none select-none text-center m-0"
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              textShadow: '0 0 32px rgba(225, 20, 56, 0.65), 0 0 12px rgba(255, 255, 255, 0.4)'
            }}
          >
            Edu Hunters
          </h2>
        </div>

        {/* Razor-Sharp Progress Line (Hardware-Accelerated Fluid Progression) */}
        <div className="w-[260px] sm:w-[290px] h-[2.5px] bg-[#222226] rounded-full overflow-hidden relative mb-3">
          <div 
            ref={progressBarRef}
            className="h-full rounded-full w-full"
            style={{
              transform: `scaleX(${progress / 100})`,
              transformOrigin: 'left',
              background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 70%, #ffffff 100%)',
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.95), 0 0 3px #ffffff'
            }}
          />
        </div>

        {/* Clean, Modern, Non-Robotic Percentage */}
        <div 
          className="text-xs sm:text-[13px] font-medium tracking-wider text-slate-300 mb-2 select-none"
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
        >
          {progress}%
        </div>

        {/* Subtitle */}
        <p className="text-[10px] tracking-[0.28em] uppercase font-semibold text-[#8b92a0] m-0">
          PREPARING YOUR PREMIUM EXPERIENCE
        </p>
      </div>

      {/* Bottom Footer */}
      <div className="w-full flex-1 flex items-end justify-center pb-8 sm:pb-10">
        <p className="text-[10px] tracking-[0.32em] uppercase font-medium text-[#555a66] m-0">
          PREMIUM EDTECH LEARNING PLATFORM
        </p>
      </div>
    </div>
  );
}
