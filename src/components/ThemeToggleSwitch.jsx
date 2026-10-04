import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggleSwitch({ className = '', id = 'theme-toggle-switch' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "লাইট মোডে পরিবর্তন করুন" : "ডার্ক মোডে পরিবর্তন করুন"}
      title={isDark ? "লাইট মোডে পরিবর্তন করুন" : "ডার্ক মোডে পরিবর্তন করুন"}
      onClick={toggleTheme}
      className={`group relative inline-flex items-center w-[56px] h-[28px] p-[3px] rounded-full transition-all duration-500 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#e11438]/80 hover:scale-[1.05] active:scale-[0.95] shrink-0 ${
        isDark
          ? 'bg-[#1e1e24] border border-white/20 shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)]'
          : 'bg-[#9ca3af] border border-gray-400/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)]'
      } ${className}`}
    >
      {/* Crescent Moon Icon (Positioned on the Left Slot) */}
      <div 
        className={`absolute left-[3px] top-[3px] w-[22px] h-[22px] flex items-center justify-center pointer-events-none transition-all duration-450 ease-[cubic-bezier(0.34,1.3,0.64,1)] ${
          isDark 
            ? 'opacity-100 scale-100 rotate-0' 
            : 'opacity-0 scale-40 -rotate-90'
        }`}
      >
        <svg 
          viewBox="0 0 24 24" 
          className="w-3.5 h-3.5 fill-white transition-transform duration-450"
        >
          {/* Exact right-facing crescent moon matching reference mockup */}
          <path d="M12.5 3.5C8.36 3.5 5 6.86 5 11C5 15.14 8.36 18.5 12.5 18.5C14.72 18.5 16.71 17.53 18.08 16C13.8 15.7 10.4 12.2 10.4 7.9C10.4 6.28 10.92 4.78 11.8 3.55C12.03 3.52 12.26 3.5 12.5 3.5Z" />
        </svg>
      </div>

      {/* Sun Icon with Radiating Rays (Positioned on the Right Slot) */}
      <div 
        className={`absolute right-[3px] top-[3px] w-[22px] h-[22px] flex items-center justify-center pointer-events-none transition-all duration-450 ease-[cubic-bezier(0.34,1.3,0.64,1)] ${
          !isDark 
            ? 'opacity-100 scale-100 rotate-0' 
            : 'opacity-0 scale-40 rotate-90'
        }`}
      >
        <svg 
          viewBox="0 0 24 24" 
          className="w-3.5 h-3.5 text-white transition-transform duration-450" 
          fill="none"
        >
          {/* Center solid circle */}
          <circle cx="12" cy="12" r="3.8" fill="white" />
          {/* 8 straight radiating rays matching reference mockup */}
          <line x1="12" y1="2.2" x2="12" y2="4.7" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="12" y1="19.3" x2="12" y2="21.8" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="2.2" y1="12" x2="4.7" y2="12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="19.3" y1="12" x2="21.8" y2="12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="5.1" y1="5.1" x2="6.9" y2="6.9" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="17.1" y1="17.1" x2="18.9" y2="18.9" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="5.1" y1="18.9" x2="6.9" y2="17.1" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="17.1" y1="6.9" x2="18.9" y2="5.1" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Pure White Circular Sliding Knob with Buttery Smooth Spring Glide */}
      <span
        aria-hidden="true"
        className={`w-[22px] h-[22px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.2)] transform transition-transform duration-450 ease-[cubic-bezier(0.34,1.3,0.64,1)] pointer-events-none z-10 ${
          isDark ? 'translate-x-[28px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
