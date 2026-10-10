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
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-black text-white select-none transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#000000'
      }}
    >
      {/* Center Deep Dark Red Radial Vignette Haze (Matches exact reference image) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[220px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(185, 18, 43, 0.42) 0%, rgba(120, 8, 26, 0.18) 50%, transparent 75%)',
          filter: 'blur(45px)'
        }}
      />

      {/* Top Spacer */}
      <div className="w-full flex-1" />

      {/* Center Cluster: Exact Match to AdobeWala */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm sm:max-w-md w-full">
        
        {/* Brand Lockup: Clean horizontal layout with subtle diffuse glow */}
        <div className="flex items-center justify-center gap-3 mb-7 sm:mb-8">
          <img 
            src="/eduhunters-mark-white.png" 
            alt="Edu Hunters Mark"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
            style={{
              filter: 'drop-shadow(0 0 16px rgba(225, 20, 56, 0.7))'
            }}
          />
          <span 
            className="text-2xl sm:text-[27px] font-black tracking-normal text-white lowercase"
            style={{
              letterSpacing: '-0.02em',
              textShadow: '0 0 25px rgba(225, 20, 56, 0.5), 0 0 10px rgba(255, 255, 255, 0.3)'
            }}
          >
            edu hunters
          </span>
        </div>

        {/* Ultra-Slim Progress Line */}
        <div className="w-[240px] sm:w-[270px] h-[2px] bg-[#1a1a1a] rounded-full overflow-hidden relative mb-4">
          <div 
            className="h-full rounded-full transition-all duration-75 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 65%, #fca5a5 100%)',
              boxShadow: '0 0 10px #ef4444'
            }}
          />
        </div>

        {/* Monospace Wide Percentage (Exact match: "84 %") */}
        <div className="text-[11px] sm:text-xs font-mono tracking-[0.35em] text-[#cccccc] mb-2 tabular-nums">
          {progress} %
        </div>

        {/* Subtitle (Exact letter-spacing & uppercase tone) */}
        <p className="text-[9px] sm:text-[10px] tracking-[0.28em] uppercase font-semibold text-[#666666]">
          PREPARING YOUR PREMIUM EXPERIENCE
        </p>
      </div>

      {/* Bottom Footer (Exact match: "LUXURY DIGITAL SUBSCRIPTIONS" style) */}
      <div className="w-full flex-1 flex items-end justify-center pb-8 sm:pb-10">
        <p className="text-[9px] sm:text-[10px] tracking-[0.32em] uppercase font-medium text-[#444444]">
          PREMIUM EDTECH LEARNING PLATFORM
        </p>
      </div>
    </div>
  );
}
