import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Layers, 
  BookOpen, 
  FileText, 
  Settings, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ChevronDown, 
  Sparkles, 
  Clock, 
  Play, 
  Eye, 
  ImageIcon, 
  Check, 
  X
} from 'lucide-react';
import { masterEnglishCourseData } from '../data/masterEnglishCourseData';
import ExamBatchStudio from './ExamBatchStudio';

export default function CourseStudioPage({
  course,
  courseIndex,
  initialTab = 'curriculum',
  categories = [],
  onUpdateCourse,
  onBack,
  onPreview,
  openGalleryModal,
  triggerToast
}) {
  const isExamBatch = Boolean(
    course?.isExamBatch ||
    course?.category === 'EXAM BATCH' ||
    course?.category === 'exam batch' ||
    ['sureshot', 'medical', 'rtds', 'english_master', 'gk_course', 'medilogy'].includes(course?.id) ||
    ['sureshot', 'medical', 'rtds', 'english_master', 'gk_course', 'medilogy'].includes(course?.key) ||
    ['sureshot', 'medical', 'rtds', 'english_master', 'gk_course', 'medilogy'].includes(course?.slug)
  );

  if (isExamBatch) {
    return (
      <ExamBatchStudio
        course={course}
        courseIndex={courseIndex}
        initialTab={initialTab}
        onUpdateCourse={onUpdateCourse}
        onBack={onBack}
        onPreview={onPreview}
        openGalleryModal={openGalleryModal}
        triggerToast={triggerToast}
      />
    );
  }

  // Active Studio Tab: 'curriculum' | 'basic' | 'overview'
  const [activeTab, setActiveTab] = useState(initialTab === 'details' ? 'overview' : (initialTab || 'curriculum'));
  const [expandedSections, setExpandedSections] = useState({ 0: true, 1: true });
  const [newLessonDrafts, setNewLessonDrafts] = useState({});
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'

  const isAllCat = (cat) => !cat || cat === 'All' || cat === 'সকল' || cat === 'all';

  // Derived Curriculum Statistics
  const curriculum = useMemo(() => Array.isArray(course?.curriculum) ? course.curriculum : [], [course?.curriculum]);
  const totalSections = curriculum.length;
  const totalChapters = useMemo(() => curriculum.reduce((acc, s) => acc + (s.chapters?.length || 0), 0), [curriculum]);
  const totalLessons = useMemo(() => curriculum.reduce((acc, s) => acc + (s.chapters || []).reduce((chAcc, ch) => chAcc + (ch.lessons?.length || 0), 0), 0), [curriculum]);
  const totalFreeDemos = useMemo(() => curriculum.reduce((acc, s) => acc + (s.chapters || []).reduce((chAcc, ch) => chAcc + (ch.lessons || []).filter(l => typeof l === 'object' && l.isFree).length, 0), 0), [curriculum]);

  // Helper to trigger save with animation
  const notifySave = (updatedCourse) => {
    setSaveStatus('saving');
    onUpdateCourse(updatedCourse);
    setTimeout(() => {
      setSaveStatus('saved');
    }, 350);
  };

  // Field updater
  const handleUpdateField = (field, value) => {
    const updated = { ...course, [field]: value };
    notifySave(updated);
  };

  // ==========================================
  // CURRICULUM MANAGEMENT HANDLERS
  // ==========================================
  const handleLoadTemplate = () => {
    if (confirm('Load Master English standard syllabus template? This will append ready-made modules and lessons.')) {
      const template = JSON.parse(JSON.stringify(masterEnglishCourseData.curriculum));
      const updatedCurriculum = [...curriculum, ...template];
      const updated = { ...course, curriculum: updatedCurriculum };
      notifySave(updated);
      setExpandedSections(prev => ({ ...prev, [curriculum.length]: true }));
      triggerToast('✨ Standard syllabus template loaded successfully!');
    }
  };

  const handleAddSection = () => {
    const newSection = {
      id: `sec-${Date.now()}`,
      name: `Module ${curriculum.length + 1}: New Topic`,
      summary: '1 Chapter · 5 Lectures',
      chapters: [
        {
          id: `chap-${Date.now()}`,
          name: 'Chapter 1: Foundational Concepts',
          lessons: []
        }
      ]
    };
    const updatedCurriculum = [...curriculum, newSection];
    const updated = { ...course, curriculum: updatedCurriculum };
    notifySave(updated);
    setExpandedSections(prev => ({ ...prev, [curriculum.length]: true }));
    triggerToast('➕ New Module added to syllabus');
  };

  const handleUpdateSection = (secIdx, field, value) => {
    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) return { ...sec, [field]: value };
      return sec;
    });
    notifySave({ ...course, curriculum: updatedCurriculum });
  };

  const handleDeleteSection = (secIdx) => {
    const secName = curriculum[secIdx]?.name || 'this module';
    if (confirm(`Are you sure you want to delete "${secName}"?`)) {
      const updatedCurriculum = curriculum.filter((_, i) => i !== secIdx);
      notifySave({ ...course, curriculum: updatedCurriculum });
      triggerToast('🗑️ Module deleted');
    }
  };

  const handleMoveSection = (secIdx, direction) => {
    const targetIdx = direction === 'up' ? secIdx - 1 : secIdx + 1;
    if (targetIdx < 0 || targetIdx >= curriculum.length) return;
    const nextCurriculum = [...curriculum];
    const temp = nextCurriculum[secIdx];
    nextCurriculum[secIdx] = nextCurriculum[targetIdx];
    nextCurriculum[targetIdx] = temp;
    notifySave({ ...course, curriculum: nextCurriculum });
  };

  const handleAddChapter = (secIdx) => {
    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) {
        const chapters = Array.isArray(sec.chapters) ? [...sec.chapters] : [];
        chapters.push({
          id: `chap-${Date.now()}`,
          name: `Chapter ${chapters.length + 1}: Detailed Lessons`,
          lessons: []
        });
        return { ...sec, chapters };
      }
      return sec;
    });
    notifySave({ ...course, curriculum: updatedCurriculum });
    triggerToast('➕ Chapter added to module');
  };

  const handleUpdateChapter = (secIdx, chapIdx, name) => {
    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) {
        const chapters = sec.chapters.map((ch, cIdx) => {
          if (cIdx === chapIdx) return { ...ch, name };
          return ch;
        });
        return { ...sec, chapters };
      }
      return sec;
    });
    notifySave({ ...course, curriculum: updatedCurriculum });
  };

  const handleDeleteChapter = (secIdx, chapIdx) => {
    if (confirm('Delete this chapter and all of its lectures?')) {
      const updatedCurriculum = curriculum.map((sec, i) => {
        if (i === secIdx) {
          return {
            ...sec,
            chapters: sec.chapters.filter((_, cIdx) => cIdx !== chapIdx)
          };
        }
        return sec;
      });
      notifySave({ ...course, curriculum: updatedCurriculum });
      triggerToast('🗑️ Chapter removed');
    }
  };

  const handleAddLesson = (secIdx, chapIdx) => {
    const draftKey = `${secIdx}-${chapIdx}`;
    const draft = newLessonDrafts[draftKey] || { title: '', duration: '45 min', videoUrl: '', pdfUrl: '', isFree: false };
    if (!draft.title.trim()) {
      alert('Please enter a lesson title before adding.');
      return;
    }

    const newLessonItem = {
      id: `les-${Date.now()}`,
      title: draft.title.trim(),
      duration: draft.duration.trim() || '45 min',
      videoUrl: draft.videoUrl.trim(),
      pdfUrl: draft.pdfUrl.trim(),
      isFree: Boolean(draft.isFree)
    };

    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) {
        const chapters = sec.chapters.map((ch, cIdx) => {
          if (cIdx === chapIdx) {
            const lessons = Array.isArray(ch.lessons) ? [...ch.lessons] : [];
            lessons.push(newLessonItem);
            return { ...ch, lessons };
          }
          return ch;
        });
        return { ...sec, chapters };
      }
      return sec;
    });

    notifySave({ ...course, curriculum: updatedCurriculum });
    setNewLessonDrafts(prev => ({
      ...prev,
      [draftKey]: { title: '', duration: '45 min', videoUrl: '', pdfUrl: '', isFree: false }
    }));
    triggerToast('🎉 Lesson added successfully!');
  };

  const handleUpdateLesson = (secIdx, chapIdx, lesIdx, field, value) => {
    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) {
        const chapters = sec.chapters.map((ch, cIdx) => {
          if (cIdx === chapIdx) {
            const lessons = ch.lessons.map((les, lIdx) => {
              if (lIdx === lesIdx) {
                const currentObj = typeof les === 'object' && les !== null ? les : { title: les, duration: '45 min', videoUrl: '', pdfUrl: '', isFree: false };
                return { ...currentObj, [field]: value };
              }
              return les;
            });
            return { ...ch, lessons };
          }
          return ch;
        });
        return { ...sec, chapters };
      }
      return sec;
    });
    notifySave({ ...course, curriculum: updatedCurriculum });
  };

  const handleDeleteLesson = (secIdx, chapIdx, lesIdx) => {
    const updatedCurriculum = curriculum.map((sec, i) => {
      if (i === secIdx) {
        const chapters = sec.chapters.map((ch, cIdx) => {
          if (cIdx === chapIdx) {
            return {
              ...ch,
              lessons: ch.lessons.filter((_, lIdx) => lIdx !== lesIdx)
            };
          }
          return ch;
        });
        return { ...sec, chapters };
      }
      return sec;
    });
    notifySave({ ...course, curriculum: updatedCurriculum });
    triggerToast('Lesson removed');
  };

  // Features List Handlers
  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    const currentFeatures = Array.isArray(course?.features) ? course.features : [];
    const updated = { ...course, features: [...currentFeatures, newFeatureInput.trim()] };
    notifySave(updated);
    setNewFeatureInput('');
    triggerToast('Feature bullet added');
  };

  const handleRemoveFeature = (fIdx) => {
    const currentFeatures = Array.isArray(course?.features) ? course.features : [];
    const updated = { ...course, features: currentFeatures.filter((_, i) => i !== fIdx) };
    notifySave(updated);
  };

  // Toggle all expand/collapse
  const handleToggleExpandAll = () => {
    const areAllExpanded = curriculum.every((_, idx) => Boolean(expandedSections[idx]));
    const nextState = {};
    curriculum.forEach((_, idx) => {
      nextState[idx] = !areAllExpanded;
    });
    setExpandedSections(nextState);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 pb-20 animate-in fade-in duration-150">
      
      {/* ========================================================= */}
      {/* 1. STICKY TOP STUDIO BAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer transition-all border-none"
              title="Return to Courses Directory"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Courses Directory</span>
            </button>

            <span className="text-slate-300">/</span>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#5d5bf6]/10 text-[#5d5bf6]">
                  Course Studio
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  #{courseIndex + 1}
                </span>
                {course.isBundle && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500 text-white">
                    Bundle
                  </span>
                )}
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 truncate max-w-md sm:max-w-lg">
                {course.title || 'Untitled Course'}
              </h1>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Auto-save Status */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-500">
              <span className={`w-2 h-2 rounded-full transition-colors ${
                saveStatus === 'saving' ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
              }`} />
              <span>{saveStatus === 'saving' ? 'Saving changes...' : 'All changes saved'}</span>
            </div>

            {/* Preview Live Page */}
            <button
              type="button"
              onClick={onPreview}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border-none"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Live Page</span>
            </button>

            {/* Save & Finish Button */}
            <button
              type="button"
              onClick={() => {
                triggerToast('🎉 Course changes saved successfully!');
                onBack();
              }}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 transition-all cursor-pointer border-none"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Done</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. COURSE SUMMARY & STATS KPI BANNER */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Course Card Preview */}
          <div className="flex items-center gap-4 min-w-0">
            <div 
              onClick={() => openGalleryModal(course.image, `Change Cover for ${course.title}`, 'Courses', (newUrl) => {
                handleUpdateField('image', newUrl);
              })}
              className="relative w-28 sm:w-36 aspect-video rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 group/img cursor-pointer shrink-0 shadow-2xs"
              title="Click to change cover image"
            >
              <img 
                src={course.image} 
                alt={course.title} 
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Change</span>
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                  {course.category || 'General'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                  Number(course.salePrice) === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-900'
                }`}>
                  {Number(course.salePrice) === 0 ? 'Free Access' : `৳${Number(course.salePrice).toLocaleString()}`}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-1">
                {course.title}
              </h2>
              <p className="text-xs text-slate-400 font-medium line-clamp-1">
                {course.tagline || 'Manage modules, lecture videos, PDFs, and enrollment settings.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-[#f4f6fa] rounded-2xl p-3 text-center border border-slate-200/60 min-w-[90px]">
              <span className="block text-lg font-black text-[#5d5bf6]">{totalSections}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Modules</span>
            </div>
            <div className="bg-[#f4f6fa] rounded-2xl p-3 text-center border border-slate-200/60 min-w-[90px]">
              <span className="block text-lg font-black text-blue-600">{totalChapters}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Chapters</span>
            </div>
            <div className="bg-[#f4f6fa] rounded-2xl p-3 text-center border border-slate-200/60 min-w-[90px]">
              <span className="block text-lg font-black text-purple-600">{totalLessons}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Lessons</span>
            </div>
            <div className="bg-[#f4f6fa] rounded-2xl p-3 text-center border border-slate-200/60 min-w-[90px]">
              <span className="block text-lg font-black text-emerald-600">{totalFreeDemos}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Demos</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. STUDIO NAVIGATION TABS (CLEAN & SEGMENTED) */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none shrink-0 ${
              activeTab === 'curriculum'
                ? 'bg-[#5d5bf6] text-white shadow-xs shadow-[#5d5bf6]/20'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Curriculum & Lectures Roadmap</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
              activeTab === 'curriculum' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {totalSections} Modules
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none shrink-0 ${
              activeTab === 'basic'
                ? 'bg-[#5d5bf6] text-white shadow-xs shadow-[#5d5bf6]/20'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Basic Info & Pricing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none shrink-0 ${
              activeTab === 'overview'
                ? 'bg-[#5d5bf6] text-white shadow-xs shadow-[#5d5bf6]/20'
                : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Landing Page & Features</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
              activeTab === 'overview' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {course.features?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MAIN STUDIO CONTENT AREA */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
        
        {/* ========================================================= */}
        {/* TAB 1: CURRICULUM & LECTURES ROADMAP */}
        {/* ========================================================= */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            
            {/* Toolbar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Lecture Syllabus Structure</h3>
                <p className="text-xs text-slate-400 font-medium">Add modules, chapters, YouTube lecture links, PDF notes, and free preview lessons.</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {curriculum.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleExpandAll}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer transition-all"
                  >
                    Expand/Collapse All
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleLoadTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200/80 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Load Standard Template</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddSection}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-xs shadow-[#5d5bf6]/20 cursor-pointer border-none transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Module</span>
                </button>
              </div>
            </div>

            {/* Empty Syllabus State */}
            {curriculum.length === 0 && (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#5d5bf6]/10 text-[#5d5bf6] flex items-center justify-center mx-auto shadow-inner">
                  <Layers className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-800">No syllabus modules created yet</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Click "+ Add New Module" to create custom modules or load the ready-made standard template.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleLoadTemplate}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Load Standard Template
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Custom Module
                  </button>
                </div>
              </div>
            )}

            {/* Modules List */}
            {curriculum.map((section, secIdx) => {
              const isSecExpanded = Boolean(expandedSections[secIdx]);
              const chapters = Array.isArray(section.chapters) ? section.chapters : [];

              return (
                <div 
                  key={section.id || secIdx}
                  className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden transition-all"
                >
                  {/* Module Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50/70 border-b border-slate-100">
                    <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                      <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#5d5bf6] font-black text-xs flex items-center justify-center shrink-0 shadow-2xs font-mono">
                        {secIdx + 1 < 10 ? `0${secIdx + 1}` : secIdx + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={section.name}
                          placeholder="Module Title (e.g. Foundation Biology & Botany)"
                          onChange={(e) => handleUpdateSection(secIdx, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-[#5d5bf6] transition-all"
                        />
                        <input
                          type="text"
                          value={section.summary || ''}
                          placeholder="Summary (e.g. 5 Chapters · 18 Lectures)"
                          onChange={(e) => handleUpdateSection(secIdx, 'summary', e.target.value)}
                          className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs text-slate-500 outline-none focus:border-[#5d5bf6] transition-all"
                        />
                      </div>
                    </div>

                    {/* Section Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={secIdx === 0}
                        onClick={() => handleMoveSection(secIdx, 'up')}
                        title="Move Module Up"
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={secIdx === curriculum.length - 1}
                        onClick={() => handleMoveSection(secIdx, 'down')}
                        title="Move Module Down"
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(secIdx)}
                        title="Delete Module"
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, [secIdx]: !prev[secIdx] }))}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <span>{chapters.length} Chapters</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSecExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Section Body (Chapters & Lessons) */}
                  {isSecExpanded && (
                    <div className="p-4 sm:p-5 space-y-5 bg-white">
                      
                      {chapters.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-2 text-center">
                          No chapters in this module yet. Click "+ Add Chapter to this Module" below.
                        </p>
                      )}

                      {chapters.map((chapter, chapIdx) => {
                        const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];
                        const draftKey = `${secIdx}-${chapIdx}`;
                        const draft = newLessonDrafts[draftKey] || { title: '', duration: '45 min', videoUrl: '', pdfUrl: '', isFree: false };

                        return (
                          <div 
                            key={chapIdx}
                            className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-4"
                          >
                            {/* Chapter Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                                <span className="w-6 h-6 rounded-lg bg-[#5d5bf6]/10 text-[#5d5bf6] font-bold text-xs flex items-center justify-center font-mono">
                                  C{chapIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={chapter.name}
                                  placeholder="Chapter Title (e.g. Chapter 01: Cell Structure & Functions)"
                                  onChange={(e) => handleUpdateChapter(secIdx, chapIdx, e.target.value)}
                                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-[#5d5bf6] transition-all"
                                />
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 font-mono">
                                  {lessons.length} Lessons
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteChapter(secIdx, chapIdx)}
                                className="text-slate-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Chapter</span>
                              </button>
                            </div>

                            {/* Lessons List */}
                            <div className="space-y-2">
                              {lessons.length === 0 && (
                                <p className="text-xs text-slate-400 italic text-center py-2 bg-white rounded-xl border border-dashed border-slate-200">
                                  No lessons added yet. Use the form below to add lectures.
                                </p>
                              )}

                              {lessons.map((lesson, lesIdx) => {
                                const isObj = typeof lesson === 'object' && lesson !== null;
                                const title = isObj ? lesson.title : lesson;
                                const duration = isObj ? (lesson.duration || '45 min') : '45 min';
                                const videoUrl = isObj ? (lesson.videoUrl || '') : '';
                                const pdfUrl = isObj ? (lesson.pdfUrl || '') : '';
                                const isFree = isObj ? Boolean(lesson.isFree) : false;

                                return (
                                  <div 
                                    key={lesIdx}
                                    className="bg-white rounded-xl border border-slate-200/90 p-3 space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5 shadow-2xs hover:border-slate-300 transition-all"
                                  >
                                    {/* Sequence & Lesson Title */}
                                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0 font-mono">
                                        #{lesIdx + 1}
                                      </span>
                                      <input
                                        type="text"
                                        value={title}
                                        placeholder="Lesson Title"
                                        onChange={(e) => handleUpdateLesson(secIdx, chapIdx, lesIdx, 'title', e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                                      />
                                    </div>

                                    {/* Duration, Video URL & PDF URL */}
                                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                                      <div className="relative">
                                        <Clock className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                                        <input
                                          type="text"
                                          value={duration}
                                          placeholder="45 min"
                                          onChange={(e) => handleUpdateLesson(secIdx, chapIdx, lesIdx, 'duration', e.target.value)}
                                          className="w-20 bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2 py-1 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-[#5d5bf6]"
                                        />
                                      </div>

                                      <div className="relative">
                                        <Play className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                                        <input
                                          type="text"
                                          value={videoUrl}
                                          placeholder="YouTube Link / ID"
                                          onChange={(e) => handleUpdateLesson(secIdx, chapIdx, lesIdx, 'videoUrl', e.target.value)}
                                          className="w-36 bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2 py-1 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-[#5d5bf6]"
                                        />
                                      </div>

                                      <div className="relative">
                                        <FileText className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                                        <input
                                          type="text"
                                          value={pdfUrl}
                                          placeholder="PDF Notes Link"
                                          onChange={(e) => handleUpdateLesson(secIdx, chapIdx, lesIdx, 'pdfUrl', e.target.value)}
                                          className="w-32 bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-2 py-1 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-[#5d5bf6]"
                                        />
                                      </div>
                                    </div>

                                    {/* Free Demo Toggle & Delete */}
                                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateLesson(secIdx, chapIdx, lesIdx, 'isFree', !isFree)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors border-none flex items-center gap-1.5 ${
                                          isFree 
                                            ? 'bg-emerald-500 text-white shadow-2xs' 
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${isFree ? 'bg-white' : 'bg-slate-400'}`} />
                                        <span>{isFree ? 'Free Preview' : 'Paid / Locked'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLesson(secIdx, chapIdx, lesIdx)}
                                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer border-none transition-colors"
                                        title="Delete Lesson"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Clean Add Lesson Card */}
                            <div className="bg-white rounded-xl border border-dashed border-[#5d5bf6]/30 p-3.5 space-y-2.5">
                              <span className="text-[11px] font-extrabold text-[#5d5bf6] block">
                                + Add Lecture Lesson to this Chapter
                              </span>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                <input
                                  type="text"
                                  placeholder="Lesson Title (e.g. Lecture 01 - Anatomy & Classification)"
                                  value={draft.title}
                                  onChange={(e) => setNewLessonDrafts(prev => ({
                                    ...prev,
                                    [draftKey]: { ...draft, title: e.target.value }
                                  }))}
                                  className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                                />
                                <input
                                  type="text"
                                  placeholder="Duration (e.g. 45 min)"
                                  value={draft.duration}
                                  onChange={(e) => setNewLessonDrafts(prev => ({
                                    ...prev,
                                    [draftKey]: { ...draft, duration: e.target.value }
                                  }))}
                                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                                />
                                <input
                                  type="text"
                                  placeholder="YouTube Video URL (Optional)"
                                  value={draft.videoUrl}
                                  onChange={(e) => setNewLessonDrafts(prev => ({
                                    ...prev,
                                    [draftKey]: { ...draft, videoUrl: e.target.value }
                                  }))}
                                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                                />
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="text"
                                    placeholder="PDF Lecture Sheet Link (Optional)"
                                    value={draft.pdfUrl}
                                    onChange={(e) => setNewLessonDrafts(prev => ({
                                      ...prev,
                                      [draftKey]: { ...draft, pdfUrl: e.target.value }
                                    }))}
                                    className="w-60 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                                  />
                                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={draft.isFree}
                                      onChange={(e) => setNewLessonDrafts(prev => ({
                                        ...prev,
                                        [draftKey]: { ...draft, isFree: e.target.checked }
                                      }))}
                                    />
                                    <span>Allow Free Demo Preview</span>
                                  </label>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddLesson(secIdx, chapIdx)}
                                  className="px-4 py-1.5 rounded-lg bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer transition-all shadow-xs"
                                >
                                  + Add Lesson
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Chapter Button inside Section */}
                      <button
                        type="button"
                        onClick={() => handleAddChapter(secIdx)}
                        className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-4 h-4 text-slate-500" />
                        <span>+ Add Chapter to this Module</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Add Section Button */}
            <button
              type="button"
              onClick={handleAddSection}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-[#5d5bf6]/30 hover:border-[#5d5bf6] bg-[#5d5bf6]/5 hover:bg-[#5d5bf6]/10 text-[#5d5bf6] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Course Module</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: BASIC INFO & PRICING */}
        {/* ========================================================= */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-slate-900">Course Metadata & Pricing Structure</h3>
                <p className="text-xs text-slate-400 font-medium">Update the primary title, category classification, enrollment pricing, and cover visuals.</p>
              </div>

              {/* Course Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Course Full Title *</label>
                <input 
                  type="text"
                  required
                  value={course.title || ''}
                  onChange={(e) => handleUpdateField('title', e.target.value)}
                  placeholder="e.g. ৩০ দিনে Master English শেষ করার মিশন"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                />
              </div>

              {/* Category & Bundle Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Category *</label>
                  <select
                    value={course.category || ''}
                    onChange={(e) => handleUpdateField('category', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all cursor-pointer"
                  >
                    {categories.filter(c => !isAllCat(c)).map((cat, cIdx) => (
                      <option key={cIdx} value={cat}>{cat}</option>
                    ))}
                    {course.category && !categories.includes(course.category) && (
                      <option value={course.category}>{course.category}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bundle Program</label>
                  <label className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-xs font-bold text-slate-700">
                    <input 
                      type="checkbox"
                      checked={Boolean(course.isBundle)}
                      onChange={(e) => handleUpdateField('isBundle', e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span>Flag as Mega Bundle Package (shows "Bundle" badge)</span>
                  </label>
                </div>
              </div>

              {/* Pricing Economics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Sale / Discount Price (৳) *</label>
                  <input 
                    type="number"
                    value={course.salePrice ?? 0}
                    onChange={(e) => handleUpdateField('salePrice', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-black text-emerald-600 outline-none focus:bg-white focus:border-emerald-500 transition-all"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Enter <code className="font-mono font-bold text-slate-600">0</code> to offer this course completely Free of charge.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Regular / Original Price (৳)</label>
                  <input 
                    type="number"
                    value={course.regularPrice ?? 0}
                    onChange={(e) => handleUpdateField('regularPrice', Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-500 line-through outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Used to calculate strikethrough discount badges on student checkout.
                  </span>
                </div>
              </div>

              {/* Cover Image */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">Course Cover Image</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-48 aspect-video rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 shrink-0">
                    <img 
                      src={course.image} 
                      alt={course.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2 flex-1">
                    <button
                      type="button"
                      onClick={() => openGalleryModal(course.image, `Select Cover for ${course.title}`, 'Courses', (newUrl) => {
                        handleUpdateField('image', newUrl);
                      })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors border border-slate-200"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Choose from Media Gallery</span>
                    </button>
                    
                    <div className="text-[11px] text-slate-400">
                      Or paste direct image URL below:
                    </div>
                    <input 
                      type="text"
                      value={course.image || ''}
                      onChange={(e) => handleUpdateField('image', e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-[#5d5bf6]"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: LANDING PAGE & EXTRA DETAILS */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-slate-900">Landing Page Copy & Student Features</h3>
                <p className="text-xs text-slate-400 font-medium">Configure marketing copy, description text, support contacts, and key bullet points.</p>
              </div>

              {/* Tagline & Total Classes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Hero Tagline</label>
                  <input
                    type="text"
                    value={course.tagline || ''}
                    placeholder="e.g. Master Academic to Medical Admission in One Comprehensive Course!"
                    onChange={(e) => handleUpdateField('tagline', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Total Classes Subtitle</label>
                  <input
                    type="text"
                    value={course.totalClasses || ''}
                    placeholder="e.g. 45 Live Lectures + 10 Exams"
                    onChange={(e) => handleUpdateField('totalClasses', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                  />
                </div>
              </div>

              {/* Support Phone & Preview Video */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Support Helpline / WhatsApp Contact</label>
                  <input
                    type="text"
                    value={course.supportPhone || '01321228612'}
                    placeholder="01321228612"
                    onChange={(e) => handleUpdateField('supportPhone', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Course Preview Video (YouTube URL / ID)</label>
                  <input
                    type="text"
                    value={course.previewVideoUrl || ''}
                    placeholder="https://www.youtube.com/watch?v=..."
                    onChange={(e) => handleUpdateField('previewVideoUrl', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">About Course (Detailed Student Overview)</label>
                <textarea
                  rows={6}
                  value={course.aboutText || ''}
                  placeholder="Comprehensive overview of course objectives, curriculum breakdown, target exam outcomes..."
                  onChange={(e) => handleUpdateField('aboutText', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 leading-relaxed outline-none focus:bg-white focus:border-[#5d5bf6] transition-all"
                ></textarea>
              </div>

              {/* Course Features Bullets Editor */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  Course Feature Highlights (What's included in enrollment)
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(course.features || []).map((feat, fIdx) => (
                    <div 
                      key={fIdx}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[#5d5bf6]/10 text-[#5d5bf6] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                        <span className="truncate">{typeof feat === 'object' ? (feat?.text || feat?.title || '') : String(feat)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(fIdx)}
                        className="text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer p-1 transition-colors"
                        title="Remove Feature"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Feature input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter new feature (e.g. Chapter-wise revision notes & formula book)..."
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold border-none cursor-pointer transition-colors shadow-2xs"
                  >
                    + Add Feature
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
