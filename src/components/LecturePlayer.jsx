import React, { useState } from 'react';
import { 
  Play, 
  ArrowLeft, 
  CheckCircle, 
  FileText, 
  Clock, 
  Share2, 
  BookOpen, 
  ListOrdered,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function LecturePlayer({ lecture, onBack, onStartExam }) {
  const [activeTab, setActiveTab] = useState('notes');
  const [completedParts, setCompletedParts] = useState([1]);

  const togglePart = (partNum) => {
    if (completedParts.includes(partNum)) {
      setCompletedParts(completedParts.filter(p => p !== partNum));
    } else {
      setCompletedParts([...completedParts, partNum]);
    }
  };

  return (
    <div className="lecture-player-page animate-fade-in">
      <div className="container py-4">
        {/* Top Breadcrumb */}
        <div className="player-top-bar">
          <button className="btn-back" onClick={onBack}>
            <ArrowLeft size={18} /> ক্লাস তালিকায় ফিরে যান
          </button>
          <span className="badge badge-success">
            <Sparkles size={12} /> বিজ্ঞাপনমুক্ত ক্লাস মোড
          </span>
        </div>

        <div className="player-grid">
          {/* Main Video & Info Column */}
          <div className="player-main-col">
            <div className="video-player-wrapper">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${lecture.youtubeId}?rel=0&modestbranding=1&enablejsapi=1`}
                title={lecture.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="yt-iframe"
              ></iframe>
            </div>

            <div className="lecture-header-details">
              <span className="subject-pill">{lecture.subject}</span>
              <h1 className="lecture-headline">{lecture.title}</h1>
              
              <div className="lecture-instructor-row">
                <div className="inst-meta">
                  <div className="avatar-placeholder">{lecture.instructor.charAt(0)}</div>
                  <div>
                    <h4 className="inst-name">{lecture.instructor}</h4>
                    <span className="inst-title">এডু হান্টার্স সিনিয়র ফ্যাকাল্টি</span>
                  </div>
                </div>

                <div className="lecture-stats-row">
                  <span className="stat-pill"><Clock size={14} /> {lecture.duration}</span>
                  <span className="stat-pill">{lecture.views} ওয়াচ</span>
                </div>
              </div>
            </div>

            {/* Content Tabs (Notes / Overview) */}
            <div className="lecture-tabs">
              <button 
                className={`lecture-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <FileText size={16} /> লেকচার নোট ও সূত্র
              </button>
              <button 
                className={`lecture-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <BookOpen size={16} /> ক্লাসের সিলেবাস
              </button>
            </div>

            <div className="lecture-tab-content">
              {activeTab === 'notes' ? (
                <div className="tab-pane-notes">
                  <h3>📌 এই ক্লাসের মূল সারাংশ ও টিপস:</h3>
                  <ul className="bullet-notes">
                    <li>ভেক্টরের ডট গুণফল শূন্য হলে ভেক্টরদ্বয় পরস্পর লম্ব (A · B = 0)।</li>
                    <li>ভেক্টরের ক্রস গুণফল শূন্য হলে ভেক্টরদ্বয় পরস্পর সমান্তরাল (A × B = 0)।</li>
                    <li>নৌকা ও নদীর অংকে ন্যূনতম সময়ে নদী পার হতে সাঁতারুকে সোজা লম্বভাবে যাত্রা করতে হবে।</li>
                  </ul>
                  <div className="practice-prompt-box">
                    <p>ক্লাসটি শেষ হলে এখনই নিজের দক্ষতা যাচাই করতে মডেল টেস্টে অংশগ্রহণ করুন:</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => onStartExam('exam-1')}
                    >
                      ভেক্টর মডেল টেস্ট দিন (ফ্রি)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="tab-pane-overview">
                  <p>এই ক্লাসে এইচএসসি বোর্ড পরীক্ষা ও এডমিশনের জন্য ভেক্টর অধ্যায়ের ১০০% কমন টপিকগুলো বিশদভাবে ব্যাখ্যা করা হয়েছে।</p>
                </div>
              )}
            </div>
          </div>

          {/* Playlist / Course Curriculum Sidebar */}
          <div className="player-sidebar-col">
            <div className="curriculum-card">
              <div className="curriculum-header">
                <h3><ListOrdered size={18} /> ক্লাস কারিকুলাম</h3>
                <span className="text-muted text-xs">{lecture.totalParts} টি পর্ব</span>
              </div>

              <div className="playlist-list">
                {[...Array(lecture.totalParts)].map((_, i) => {
                  const partNum = i + 1;
                  const isDone = completedParts.includes(partNum);
                  return (
                    <div 
                      key={i} 
                      className={`playlist-item ${partNum === 1 ? 'current' : ''}`}
                      onClick={() => togglePart(partNum)}
                    >
                      <div className="playlist-icon">
                        {isDone ? (
                          <CheckCircle size={18} className="text-emerald fill-emerald-light" />
                        ) : (
                          <Play size={16} className="text-primary" />
                        )}
                      </div>
                      <div className="playlist-text">
                        <p className="part-title">পর্ব {partNum}: {partNum === 1 ? 'ভেক্টরের প্রাথমিক ধারণা ও স্কেলার গুণন' : `গাণিতিক সমস্যা সমাধান পার্ট ${partNum}`}</p>
                        <span className="part-dur">২৫:৩০ মিনিট</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="sidebar-bundle-ad">
                <h4>🎯 সম্পূর্ণ অধ্যায়ের নোট চান?</h4>
                <p>হ্যান্ডনোট ও ৩টি এক্সাম আনলক করুন মাত্র ১৯৯ টাকায়।</p>
                <button 
                  className="btn btn-accent w-full text-sm"
                  onClick={() => alert('বান্ডেল চেকআউটে যাচ্ছে...')}
                >
                  পিডিএফ নোট সংগ্রহ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
