import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  HelpCircle, 
  Play, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  ChevronRight,
  User, 
  Award,
  Zap,
  Star,
  Users
} from 'lucide-react';

export default function Home({ 
  data, 
  onSelectTab, 
  onStartExam, 
  onOpenPdfViewer, 
  onWatchLecture,
  onOpenCheckout 
}) {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('All');

  const filteredLectures = selectedSubjectFilter === 'All' 
    ? data.freeLectures 
    : data.freeLectures.filter(l => l.subject === selectedSubjectFilter);

  return (
    <div className="home-container animate-fade-in">
      {/* Top Urgent Announcement Bar */}
      <div className="announcement-banner">
        <div className="container announcement-inner">
          <span className="announcement-tag">অফার</span>
          <p className="announcement-text">{data.announcement}</p>
          <button 
            className="announcement-link"
            onClick={() => onSelectTab('bundles')}
          >
            অফার নিন <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Hero Section - Medilogy Style Clean & Bold */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={16} className="text-warning" />
              <span>{data.hero.badge}</span>
            </div>

            <h1 className="hero-title">
              {data.hero.title}
            </h1>

            <p className="hero-subtitle">
              {data.hero.subtitle}
            </p>

            <div className="hero-actions">
              <button 
                className="btn btn-primary"
                onClick={() => onSelectTab('exams')}
                id="hero-exam-btn"
              >
                <Zap size={18} /> {data.hero.primaryCta}
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => onSelectTab('lectures')}
                id="hero-lecture-btn"
              >
                <Play size={18} /> {data.hero.secondaryCta}
              </button>
            </div>

            {/* Micro Trust Stats */}
            <div className="hero-features-list">
              <div className="feature-item">
                <CheckCircle size={16} className="text-emerald" />
                <span>বিজ্ঞাপনহীন ইউটিউব ক্লাস</span>
              </div>
              <div className="feature-item">
                <CheckCircle size={16} className="text-emerald" />
                <span>ইনস্ট্যান্ট ওএমআর রেজাল্ট</span>
              </div>
              <div className="feature-item">
                <ShieldCheck size={16} className="text-emerald" />
                <span>পাইরেসি মুক্ত প্রটেক্টেড নোট</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card-preview">
              <div className="card-floating-badge top-right">
                <Award size={16} /> টপ রেটেড
              </div>
              
              <div className="hero-preview-header">
                <div className="preview-dot red"></div>
                <div className="preview-dot yellow"></div>
                <div className="preview-dot green"></div>
                <span className="preview-title">Edu Hunters Live Engine</span>
              </div>

              <div className="hero-preview-body">
                <div className="preview-banner">
                  <div className="banner-tag">মেগা বান্ডেল</div>
                  <h3>পিডিএফ কিনলেই এক্সাম সম্পূর্ণ ফ্রি!</h3>
                  <p>বোর্ড স্ট্যান্ডার্ড নোট ও ১০০% ওএমআর লাইভ প্র্যাকটিস</p>
                </div>

                <div className="preview-items-row">
                  <div className="preview-chip active">
                    <FileText size={14} /> লেকচার শিট PDF
                  </div>
                  <div className="preview-chip active">
                    <Zap size={14} /> ৩টি লাইভ এক্সাম FREE
                  </div>
                  <div className="preview-chip">
                    <Award size={14} /> র‍্যাঙ্ক ও লিডারবোর্ড
                  </div>
                </div>

                <button 
                  className="btn btn-accent w-full"
                  onClick={() => onSelectTab('bundles')}
                >
                  বান্ডেল অফারগুলো দেখুন <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Strip */}
      <section className="stats-strip">
        <div className="container stats-grid">
          {data.stats.map((stat, idx) => (
            <div key={idx} className="stat-card">
              <h3 className="stat-value">{stat.value}</h3>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Special Bundles: "PDF কিনলে Exam Free" - Highlights Section */}
      <section className="section-padding bg-subtle">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <Zap size={14} /> স্পেশাল কম্বো অফার
            </div>
            <h2 className="section-title">ডিজিটাল নোট ও ফ্রি এক্সাম বান্ডেল</h2>
            <p className="section-desc">
              প্রতিটি মেগা সাজেশন পিডিএফে রয়েছে কড়া পাইরেসি প্রটেকশন এবং সাথে পাচ্ছেন চ্যাপ্টারভিত্তিক অনলাইন এক্সাম এক্সেস।
            </p>
          </div>

          <div className="bundles-grid">
            {data.bundles.map((bundle) => (
              <div key={bundle.id} className="bundle-card">
                <div className="bundle-header">
                  <span className="bundle-category">{bundle.category}</span>
                  <span className="bundle-discount">-{bundle.discountPercent}% ছাড়</span>
                </div>

                <h3 className="bundle-title">{bundle.title}</h3>

                <div className="bundle-free-banner">
                  <Sparkles size={16} />
                  <span>এই PDF-এর সাথে <b>ফুল এক্সাম সম্পূর্ণ ফ্রি!</b></span>
                </div>

                <ul className="bundle-features">
                  {bundle.features.map((feat, i) => (
                    <li key={i}>{feat}</li>
                  ))}
                </ul>

                <div className="bundle-meta">
                  <div className="meta-tag">
                    <FileText size={14} /> {bundle.pdfPageCount} পৃষ্ঠা
                  </div>
                  <div className="meta-tag">
                    <Star size={14} className="text-warning fill-warning" /> {bundle.rating} ({bundle.buyersCount})
                  </div>
                </div>

                <div className="bundle-price-row">
                  <div>
                    <span className="original-price">৳{bundle.originalPrice}</span>
                    <span className="current-price">৳{bundle.price}</span>
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => onOpenCheckout(bundle)}
                    id={`buy-bundle-${bundle.id}`}
                  >
                    কিনুন ও আনলক করুন
                  </button>
                </div>

                <div className="bundle-footer-action">
                  <button 
                    className="btn-link"
                    onClick={() => onOpenPdfViewer(bundle)}
                  >
                    <ShieldCheck size={14} /> ডেমো সুরক্ষিত পিডিএফ পড়ুন
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Distraction-Free Free YouTube Lectures Section */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header-flex">
            <div>
              <div className="section-badge">
                <Play size={14} /> ১০০% ফ্রি ইউটিউব ক্লাস
              </div>
              <h2 className="section-title">বিজ্ঞাপন ছাড়া ক্লাসরুম এক্সপেরিয়েন্স</h2>
              <p className="section-desc">ইউটিউবের কোনো বিজ্ঞাপন ও ডিস্ট্রাকশন ছাড়াই ধারাবাহিক লেকচারগুলো দেখুন।</p>
            </div>
            <button 
              className="btn btn-outline desktop-only"
              onClick={() => onSelectTab('lectures')}
            >
              সকল ক্লাস দেখুন <ArrowRight size={16} />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="filter-pill-container">
            {['All', 'Physics', 'Higher Math', 'Biology', 'Chemistry'].map(sub => (
              <button 
                key={sub}
                className={`filter-pill ${selectedSubjectFilter === sub ? 'active' : ''}`}
                onClick={() => setSelectedSubjectFilter(sub)}
              >
                {sub === 'All' ? 'সব বিষয়' : sub}
              </button>
            ))}
          </div>

          <div className="lectures-grid">
            {filteredLectures.map((lec) => (
              <div 
                key={lec.id} 
                className="lecture-card"
                onClick={() => onWatchLecture(lec)}
              >
                <div className="lecture-thumb-wrap">
                  <img src={lec.thumbnail} alt={lec.title} className="lecture-thumb" />
                  <div className="play-button-overlay">
                    <Play size={24} fill="#fff" />
                  </div>
                  <span className="lecture-duration">{lec.duration}</span>
                  <span className="free-badge">ফ্রি</span>
                </div>

                <div className="lecture-info">
                  <span className="lecture-subject">{lec.subject}</span>
                  <h3 className="lecture-title">{lec.title}</h3>
                  <div className="lecture-instructor">
                    <User size={13} /> {lec.instructor}
                  </div>
                  <div className="lecture-meta">
                    <span>{lec.views} ভিউজ</span>
                    <span>•</span>
                    <span>{lec.totalParts} পর্ব</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mobile-only text-center mt-4">
            <button 
              className="btn btn-outline w-full"
              onClick={() => onSelectTab('lectures')}
            >
              সকল ক্লাস দেখুন <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Online Exam Center Preview */}
      <section className="section-padding bg-subtle">
        <div className="container">
          <div className="exam-promo-box">
            <div className="exam-promo-content">
              <span className="badge badge-primary">অনলাইন মডেল টেস্ট ও ওএমআর</span>
              <h2 className="promo-title">টাইমার সহ লাইভ এক্সাম দিয়ে নিজেকে যাচাই করো</h2>
              <p className="promo-text">
                মেডিকেল ও ইঞ্জিনিয়ারিং এডমিশন স্ট্যান্ডার্ড টাইমার, নেগেটিভ মার্কিং এবং সাথে সাথে প্রশ্ন ব্যাখ্যা ও মেধাতালিকা।
              </p>
              <div className="promo-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => onSelectTab('exams')}
                >
                  <Zap size={16} /> ফ্রি মডেল টেস্ট দিন
                </button>
              </div>
            </div>
            <div className="exam-promo-card">
              <div className="mock-exam-header">
                <span className="font-bold">এইচএসসি ভেক্টর ও বলবিদ্যা মেগা টেস্ট</span>
                <span className="text-muted"><Clock size={14} className="inline mr-1" /> ১৫ মিনিট</span>
              </div>
              <div className="mock-question-preview">
                <p className="text-sm font-semibold">প্রশ্ন ১: দুইটি সমান বলের লব্ধি একটির সমান হলে মধ্যবর্তী কোণ?</p>
                <div className="mock-opt active">● ১২০° (সঠিক উত্তর)</div>
                <div className="mock-opt">○ ৯০°</div>
              </div>
              <div className="mock-result-badge">
                🎉 ইনস্ট্যান্ট রেজাল্ট ও লিডারবোর্ড র‍্যাঙ্ক দেওয়া হয়
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Reviews & Social Proof */}
      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <Users size={14} /> স্টুডেন্টদের অভিজ্ঞতা
            </div>
            <h2 className="section-title">শিক্ষার্থীরা Edu Hunters সম্পর্কে যা বলছে</h2>
            <p className="section-desc">হাজারো শিক্ষার্থী আমাদের গোছানো কনটেন্ট ও এক্সামে সফলতার পথ খুঁজছে।</p>
          </div>

          <div className="reviews-grid">
            {data.reviews.map((rev) => (
              <div key={rev.id} className="review-card">
                <div className="review-rating">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} size={15} className="text-warning fill-warning" />
                  ))}
                </div>
                <p className="review-text">"{rev.comment}"</p>
                <div className="review-author">
                  <img src={rev.avatar} alt={rev.name} className="author-avatar" />
                  <div>
                    <h4 className="author-name">{rev.name}</h4>
                    <p className="author-college">{rev.college}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-subtle">
        <div className="container max-w-700">
          <div className="section-header">
            <h2 className="section-title">সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)</h2>
          </div>

          <div className="faqs-list">
            {data.faqs.map((faq, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">
                  <span>{faq.q}</span>
                  <ChevronRight size={18} className="faq-chevron" />
                </summary>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
