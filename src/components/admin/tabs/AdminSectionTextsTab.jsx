import React, { useState } from 'react';
import { 
  Type, 
  BookOpen, 
  GraduationCap, 
  Video, 
  HelpCircle, 
  Sparkles, 
  AlertCircle, 
  FileText 
} from 'lucide-react';

export default function AdminSectionTextsTab({
  sectionTexts,
  setSectionTexts,
  persistAll,
  setHasUnsavedChanges
}) {
  const [textSubTab, setTextSubTab] = useState('courses');

  const handleUpdateSectionText = (key, value) => {
    setSectionTexts(prev => {
      const next = { ...prev, [key]: value };
      persistAll({ sectionTexts: next });
      return next;
    });
    if (typeof setHasUnsavedChanges === 'function') {
      setHasUnsavedChanges(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Type className="w-6 h-6 text-blue-600" />
            Website Section Headings & Content Customization
          </h2>
          <p className="text-xs text-slate-500">
            Modify section headings, badges, and button text live across the homepage.
          </p>
        </div>
      </div>

      {/* Sub-Navigation Pills Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        {[
          { id: 'courses', label: '📚 Courses Section' },
          { id: 'faculty', label: '👨‍🏫 Instructors & Faculty' },
          { id: 'videos', label: '📺 Free Video Classes' },
          { id: 'ai', label: '🤖 AI Study Partner' },
          { id: 'contact', label: '📞 Contact & Footer' },
          { id: 'reviews', label: '🌟 Why Choose Us' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTextSubTab(item.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              textSubTab === item.id
                ? 'bg-[#eef4ff] text-[#2563eb] border-blue-200 shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Sub-tab Content Area: Only Active Section is Rendered */}
      <div className="space-y-6">
        
        {/* 1. COURSES SECTION */}
        {textSubTab === 'courses' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">1. Courses Section</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Section Title (e.g. Featured Courses)</label>
                <input
                  type="text"
                  value={sectionTexts.coursesTitle || ''}
                  onChange={(e) => handleUpdateSectionText('coursesTitle', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Button Text (e.g. View All Courses)</label>
                <input
                  type="text"
                  value={sectionTexts.coursesBtnText || ''}
                  onChange={(e) => handleUpdateSectionText('coursesBtnText', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. FACULTY SECTION */}
        {textSubTab === 'faculty' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">2. Faculty & Mentors Section</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Section Badge (e.g. Meet Our Mentors)</label>
                <input
                  type="text"
                  value={sectionTexts.facultyBadge || ''}
                  onChange={(e) => handleUpdateSectionText('facultyBadge', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Section Title (e.g. Learn From Top Educators)</label>
                <input
                  type="text"
                  value={sectionTexts.facultyTitle || ''}
                  onChange={(e) => handleUpdateSectionText('facultyTitle', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Button Text (e.g. View All Courses)</label>
                <input
                  type="text"
                  value={sectionTexts.facultyBtnText || ''}
                  onChange={(e) => handleUpdateSectionText('facultyBtnText', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. FREE VIDEOS SECTION */}
        {textSubTab === 'videos' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Video className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">3. Free Video Classes Section</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Section Badge (e.g. Free Video Lessons)</label>
                <input
                  type="text"
                  value={sectionTexts.videosBadge || ''}
                  onChange={(e) => handleUpdateSectionText('videosBadge', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Title Line 1 (e.g. Watch & Learn)</label>
                <input
                  type="text"
                  value={sectionTexts.videosTitle1 || ''}
                  onChange={(e) => handleUpdateSectionText('videosTitle1', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Title Line 2 (e.g. Top Free Video Classes)</label>
                <input
                  type="text"
                  value={sectionTexts.videosTitle2 || ''}
                  onChange={(e) => handleUpdateSectionText('videosTitle2', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Button Text (e.g. View All Free Videos)</label>
                <input
                  type="text"
                  value={sectionTexts.videosBtnText || ''}
                  onChange={(e) => handleUpdateSectionText('videosBtnText', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. WHY CHOOSE US HEADERS */}
        {textSubTab === 'reviews' && (
          <div className="grid grid-cols-1 gap-4 max-w-2xl">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">4. Why Choose Us Section Header</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={sectionTexts.whyChooseBadge || ''}
                    onChange={(e) => handleUpdateSectionText('whyChooseBadge', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Main Title</label>
                  <input
                    type="text"
                    value={sectionTexts.whyChooseTitle || ''}
                    onChange={(e) => handleUpdateSectionText('whyChooseTitle', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. 24/7 AI STUDY PARTNER SECTION */}
        {textSubTab === 'ai' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">5. 24/7 AI Study Partner Section (Edu Hunters AI)</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">AI Badge Text</label>
                <input
                  type="text"
                  value={sectionTexts.aiBadge || ''}
                  onChange={(e) => handleUpdateSectionText('aiBadge', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">AI Main Title</label>
                <input
                  type="text"
                  value={sectionTexts.aiTitle || ''}
                  onChange={(e) => handleUpdateSectionText('aiTitle', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Button 1 Text</label>
                <input
                  type="text"
                  value={sectionTexts.aiBtn1 || ''}
                  onChange={(e) => handleUpdateSectionText('aiBtn1', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Button 2 Text</label>
                <input
                  type="text"
                  value={sectionTexts.aiBtn2 || ''}
                  onChange={(e) => handleUpdateSectionText('aiBtn2', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">AI Section Description</label>
              <textarea
                rows={2}
                value={sectionTexts.aiDesc || ''}
                onChange={(e) => handleUpdateSectionText('aiDesc', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>

            {/* 4 AI Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Card 1</span>
                <input
                  type="text"
                  placeholder="Title"
                  value={sectionTexts.aiCard1Title || ''}
                  onChange={(e) => handleUpdateSectionText('aiCard1Title', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none font-bold"
                />
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={sectionTexts.aiCard1Desc || ''}
                  onChange={(e) => handleUpdateSectionText('aiCard1Desc', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-amber-600 uppercase">Card 2</span>
                <input
                  type="text"
                  placeholder="Title"
                  value={sectionTexts.aiCard2Title || ''}
                  onChange={(e) => handleUpdateSectionText('aiCard2Title', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none font-bold"
                />
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={sectionTexts.aiCard2Desc || ''}
                  onChange={(e) => handleUpdateSectionText('aiCard2Desc', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Card 3</span>
                <input
                  type="text"
                  placeholder="Title"
                  value={sectionTexts.aiCard3Title || ''}
                  onChange={(e) => handleUpdateSectionText('aiCard3Title', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none font-bold"
                />
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={sectionTexts.aiCard3Desc || ''}
                  onChange={(e) => handleUpdateSectionText('aiCard3Desc', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Card 4</span>
                <input
                  type="text"
                  placeholder="Title"
                  value={sectionTexts.aiCard4Title || ''}
                  onChange={(e) => handleUpdateSectionText('aiCard4Title', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 outline-none font-bold"
                />
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={sectionTexts.aiCard4Desc || ''}
                  onChange={(e) => handleUpdateSectionText('aiCard4Desc', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 outline-none"
                />
              </div>
            </div>

            {/* AI Question & Quote */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">AI Box Header</label>
                <input
                  type="text"
                  value={sectionTexts.aiQuestionHeader || ''}
                  onChange={(e) => handleUpdateSectionText('aiQuestionHeader', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">AI Box Sub-Heading</label>
                <input
                  type="text"
                  value={sectionTexts.aiQuestionSub || ''}
                  onChange={(e) => handleUpdateSectionText('aiQuestionSub', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">AI Quotation Text</label>
                <input
                  type="text"
                  value={sectionTexts.aiQuote || ''}
                  onChange={(e) => handleUpdateSectionText('aiQuote', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. CONTACT & FOOTER SECTIONS */}
        {textSubTab === 'contact' && (
          <div className="space-y-6">
            {/* Contact Section */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">6. Contact & Community Section</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Contact Section Title</label>
                  <input
                    type="text"
                    value={sectionTexts.contactTitle || ''}
                    onChange={(e) => handleUpdateSectionText('contactTitle', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Contact Description</label>
                  <input
                    type="text"
                    value={sectionTexts.contactDesc || ''}
                    onChange={(e) => handleUpdateSectionText('contactDesc', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900 block">Facebook Page Button Card</span>
                  <input
                    type="text"
                    placeholder="Button Title (e.g. Message Our Page)"
                    value={sectionTexts.contactPageTitle || ''}
                    onChange={(e) => handleUpdateSectionText('contactPageTitle', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Button Subtitle (e.g. Reach out on our Facebook page)"
                    value={sectionTexts.contactPageSub || ''}
                    onChange={(e) => handleUpdateSectionText('contactPageSub', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-600 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Facebook Page URL"
                    value={sectionTexts.contactPageUrl || ''}
                    onChange={(e) => handleUpdateSectionText('contactPageUrl', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-blue-600 outline-none"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-900 block">Study Community Button Card</span>
                  <input
                    type="text"
                    placeholder="Button Title (e.g. Join Our Learner Community)"
                    value={sectionTexts.contactCommunityTitle || ''}
                    onChange={(e) => handleUpdateSectionText('contactCommunityTitle', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Button Subtitle (e.g. Connect with thousands of learners)"
                    value={sectionTexts.contactCommunitySub || ''}
                    onChange={(e) => handleUpdateSectionText('contactCommunitySub', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-600 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Community Group URL"
                    value={sectionTexts.contactCommunityUrl || ''}
                    onChange={(e) => handleUpdateSectionText('contactCommunityUrl', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-blue-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">7. Footer & Copyright Section</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Footer Description</label>
                  <input
                    type="text"
                    value={sectionTexts.footerDesc || ''}
                    onChange={(e) => handleUpdateSectionText('footerDesc', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Copyright Line</label>
                  <input
                    type="text"
                    value={sectionTexts.footerCopyright || ''}
                    onChange={(e) => handleUpdateSectionText('footerCopyright', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
