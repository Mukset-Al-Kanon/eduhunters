import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle 
} from 'lucide-react';

export default function ProtectedPdfViewer({ bundle, userPhone = '01712-345678', onClose }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = bundle.pdfPageCount || 10;
  const [zoomLevel, setZoomLevel] = useState(100);

  // Prevent right click / inspect
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  return (
    <div 
      className="protected-pdf-modal no-select"
      onContextMenu={handleContextMenu}
    >
      {/* Top Security Header */}
      <div className="pdf-viewer-header">
        <div className="pdf-header-left">
          <button className="btn-icon" onClick={onClose} title="বন্ধ করুন">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="pdf-doc-title">{bundle.title}</h3>
            <span className="pdf-security-tag">
              <ShieldCheck size={13} className="text-emerald" /> ১০০% সুরক্ষিত অ্যান্টি-পাইরেসি ভিউয়ার
            </span>
          </div>
        </div>

        <div className="pdf-controls">
          <button 
            className="btn-icon" 
            onClick={() => setZoomLevel(prev => Math.max(80, prev - 10))}
            title="জুম কমান"
          >
            <ZoomOut size={18} />
          </button>
          <span className="zoom-label">{zoomLevel}%</span>
          <button 
            className="btn-icon" 
            onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
            title="জুম বাড়ান"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        <div className="pdf-header-right">
          <div className="secure-badge">
            <Lock size={14} /> সুরক্ষিত ভিউ-অনলি
          </div>
        </div>
      </div>

      {/* Main Document Canvas with Dynamic Repeating Watermark */}
      <div className="pdf-canvas-viewport">
        <div 
          className="pdf-page-container"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {/* Dynamic Floating Watermark Layer across the page */}
          <div className="watermark-layer">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="watermark-item">
                <span className="wm-brand">EDU HUNTERS OFFICIAL</span>
                <span className="wm-user">LICENSED TO: {userPhone}</span>
                <span className="wm-warn">UNAUTHORIZED SHARING IS STRICTLY PROHIBITED</span>
              </div>
            ))}
          </div>

          {/* Simulated High-Res Educational Note Content */}
          <div className="simulated-pdf-content">
            <div className="pdf-mock-header">
              <span className="pdf-inst-name">Edu Hunters Exclusive Digital Series</span>
              <span className="pdf-inst-meta">HSC 2025/2026 Special Batch</span>
            </div>

            <h1 className="pdf-page-heading">
              {currentPage === 1 ? bundle.title : `অধ্যায় ${currentPage}: গুরুত্বপূর্ণ প্রশ্নাবলী ও সমাধান`}
            </h1>

            <div className="pdf-rule-line"></div>

            <div className="pdf-body-text">
              <p>
                <strong>১. তাত্ত্বিক আলোচনা ও সারসংক্ষেপ:</strong><br />
                কোনো নির্দিষ্ট বিন্দুতে ভেক্টর সমূহের কার্যকারিতা নির্ণয়ের জন্য সামান্তরিক সূত্র ব্যবহার করা হয়। 
                যদি P ও Q দুটি ভেক্টর পরস্পর α কোণে ক্রিয়াশীল হয়, তবে তাদের লব্ধির মান:
              </p>

              <div className="formula-box">
                R = √(P² + Q² + 2PQ cos α)
              </div>

              <p>
                <strong>বিশেষ ক্ষেত্রসমূহ:</strong><br />
                • যখন α = 0° (একই দিকে ক্রিয়াশীল): R_max = P + Q <br />
                • যখন α = 180° (বিপরীত দিকে ক্রিয়াশীল): R_min = P - Q <br />
                • যখন α = 90° (লম্বভাবে ক্রিয়াশীল): R = √(P² + Q²)
              </p>

              <div className="sample-problem-card">
                <h4>🎯 বোর্ড স্ট্যান্ডার্ড প্রশ্ন (CQ-1):</h4>
                <p>
                  একটি নদী পার হওয়ার জন্য একজন সাঁতারু স্রোতের বেগের দ্বিগুণ বেগে নদী পার হতে সাঁতার শুরু করলেন। 
                  সোজাসোজি বিপরীত বিন্দুতে পৌঁছাতে হলে তাকে কত কোণে সাঁতার কাটতে হবে?
                </p>
                <div className="solution-note">
                  <strong>উত্তর:</strong> cos α = -(v/u) = -(v/2v) = -1/2 &rarr; <strong>α = 120°</strong>।
                </div>
              </div>
            </div>

            <div className="pdf-page-footer">
              <span>Edu Hunters Platform • কপিরাইট সংরক্ষিত</span>
              <span>পৃষ্ঠা: {currentPage} / {totalPages}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Page Navigator */}
      <div className="pdf-bottom-navigator">
        <button 
          className="btn-nav"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        >
          <ChevronLeft size={18} /> পূর্ববর্তী পৃষ্ঠা
        </button>

        <span className="page-counter-badge">
          পৃষ্ঠা {currentPage} / {totalPages}
        </span>

        <button 
          className="btn-nav"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        >
          পরবর্তী পৃষ্ঠা <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
