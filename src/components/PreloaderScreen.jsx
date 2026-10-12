import React, { useState, useEffect } from 'react';

/**
 * PreloaderScreen — Minimal, clean, exact replication of AdobeWala's loading screen
 * Direct match to the reference image:
 * - Solid pure pitch-black background (#000000)
 * - Soft dark red atmospheric haze glow centered behind the logo
 * - Clean logo icon + brand name in one single horizontal clean lockup (white text with subtle red glow)
 * - Ultra-thin, razor-sharp progress line with red glow head
 * - Monospace widely tracked percentage (e.g. "84 %")
 * - Subtitle: "PREPARING YOUR PREMIUM EXPERIENCE" (spaced tracking)
 * - Bottom pinned footer: "LUXURY DIGITAL SUBSCRIPTIONS" / customized platform tagline
 */
export default function PreloaderScreen({ onFinish, siteSettings = {} }) {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    let current = 0;
    let animId;
    let lastTime = performance.now();

    const tick = (now) => {
      const dt = now - lastTime;
      lastTime = now;

      // Natural progressive speed pacing
      let increment;
      if (current < 45) {
        increment = dt * 0.09;
      } else if (current < 85) {
        increment = dt * 0.055;
      } else {
        increment = dt * 0.045;
      }

      current = Math.min(current + increment, 100);
      setProgress(Math.floor(current));

      if (current < 100) {
        animId = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            document.body.style.overflow = '';
            if (onFinish) onFinish();
          }, 500);
        }, 150);
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

  const logoUrl = siteSettings.logoUrl || '/logo.png';

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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[340px] rounded-full pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(225, 20, 56, 0.45) 0%, rgba(180, 15, 40, 0.22) 40%, transparent 75%)',
          filter: 'blur(50px)'
        }}
      />

      {/* Top Spacer */}
      <div className="w-full flex-1 relative z-10" />

      {/* Center Cluster */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm sm:max-w-md w-full">
        
        {/* Brand Lockup: Logo Mark + Brand Name with soft aura */}
        <div className="flex items-center justify-center gap-3.5 mb-8">
          <img 
            src="/eduhunters-mark-white.png" 
            alt="Edu Hunters Mark"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_18px_rgba(225,20,56,0.85)]"
          />
          <span 
            className="text-2xl sm:text-[28px] font-black tracking-tight text-white lowercase"
            style={{
              textShadow: '0 0 30px rgba(225, 20, 56, 0.65), 0 0 12px rgba(255, 255, 255, 0.4)'
            }}
          >
            edu hunters
          </span>
        </div>

        {/* Razor-Sharp Progress Line */}
        <div className="w-[260px] sm:w-[290px] h-[2.5px] bg-[#222226] rounded-full overflow-hidden relative mb-4">
          <div 
            className="h-full rounded-full transition-all duration-75 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 70%, #ffffff 100%)',
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.9)'
            }}
          />
        </div>

        {/* Monospace Spaced Percentage (e.g. 69 %) */}
        <div className="text-xs font-mono font-medium tracking-[0.38em] text-[#e2e8f0] mb-2 tabular-nums">
          {progress} %
        </div>

        {/* Subtitle */}
        <p className="text-[10px] tracking-[0.28em] uppercase font-semibold text-[#8b92a0]">
          PREPARING YOUR PREMIUM EXPERIENCE
        </p>
      </div>

      {/* Bottom Footer */}
      <div className="w-full flex-1 flex items-end justify-center pb-8 sm:pb-10">
        <p className="text-[10px] tracking-[0.32em] uppercase font-medium text-[#555a66]">
          PREMIUM EDTECH LEARNING PLATFORM
        </p>
      </div>
    </div>
  );
}
