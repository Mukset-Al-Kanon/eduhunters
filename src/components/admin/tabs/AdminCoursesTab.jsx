import React, { useState, useMemo, useDeferredValue } from 'react';
import {
  Search,
  LayoutGrid,
  Layers,
  Settings as SettingsIcon,
  Plus,
  BookOpen,
  Camera,
  Play,
  Edit2,
  FileText,
  Trash2
} from 'lucide-react';

const isAllCatHelper = (cat) => !cat || cat === 'All' || cat === 'সকল';

const courseMatchesCategoryHelper = (course, cat) => {
  if (isAllCatHelper(cat)) return true;
  const target = (cat || '').trim().toLowerCase();
  const courseCat = (course?.category || '').trim().toLowerCase();
  
  if (target === 'exam batch' || target === 'exam_batch') {
    return courseCat === 'exam batch' || Boolean(course?.isExamBatch);
  }
  if (target === 'medical') {
    return (
      courseCat === 'medical' ||
      (course?.title || '').toLowerCase().includes('medical')
    );
  }
  return courseCat === target;
};

export default function AdminCoursesTab({
  courses = [],
  setCourses,
  categories = [],
  adminCourseCategoryFilter: externalCategoryFilter,
  setAdminCourseCategoryFilter: externalSetCategoryFilter,
  courseSearchQuery: externalSearchQuery,
  setCourseSearchQuery: externalSetSearchQuery,
  courseViewMode: externalViewMode,
  setCourseViewMode: externalSetViewMode,
  setShowManageCategoriesModal,
  setShowAddCourseModal,
  openGalleryModal,
  openCurriculumStudio,
  handleToggleCourseActive,
  persistAll,
  triggerToast
}) {
  const [internalCategoryFilter, setInternalCategoryFilter] = useState('All');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalViewMode, setInternalViewMode] = useState('grid');

  const adminCourseCategoryFilter = externalCategoryFilter !== undefined ? externalCategoryFilter : internalCategoryFilter;
  const setAdminCourseCategoryFilter = externalSetCategoryFilter || setInternalCategoryFilter;

  const courseSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setCourseSearchQuery = externalSetSearchQuery || setInternalSearchQuery;

  const courseViewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  const setCourseViewMode = externalSetViewMode || setInternalViewMode;

  const deferredCourseQuery = useDeferredValue(courseSearchQuery);

  const filteredCourses = useMemo(() => {
    let list = courses.map((course, originalIdx) => ({ course, originalIdx }));
    
    if (!isAllCatHelper(adminCourseCategoryFilter)) {
      list = list.filter(({ course }) => courseMatchesCategoryHelper(course, adminCourseCategoryFilter));
    }

    const q = (deferredCourseQuery || '').trim().toLowerCase();
    if (q) {
      list = list.filter(({ course }) => 
        (course.title || '').toLowerCase().includes(q) ||
        (course.category || '').toLowerCase().includes(q) ||
        (course.id || '').toLowerCase().includes(q) ||
        (course.badge || '').toLowerCase().includes(q) ||
        (course.subtitle || '').toLowerCase().includes(q) ||
        (course.description || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [courses, adminCourseCategoryFilter, deferredCourseQuery]);

  const handleDeleteCourse = (courseTitle, originalIdx) => {
    if (window.confirm(`Are you sure you want to delete course "${courseTitle}"?`)) {
      const updated = courses.filter((_, i) => i !== originalIdx);
      setCourses(updated);
      if (typeof persistAll === 'function') {
        persistAll({ courses: updated });
      }
      if (typeof triggerToast === 'function') {
        triggerToast('🗑️ Course deleted');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Minimal Action & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
        {/* Row 1: Search, View Mode & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search courses by title, category, ID..."
              value={courseSearchQuery}
              onChange={(e) => setCourseSearchQuery(e.target.value)}
              className="w-full bg-[#f4f6fa] border border-slate-200/80 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] focus:ring-2 focus:ring-[#5d5bf6]/15 transition-all font-medium placeholder:text-slate-400"
            />
            {courseSearchQuery && (
              <button 
                onClick={() => setCourseSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Grid / Table Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setCourseViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1 ${
                  courseViewMode === 'grid'
                    ? 'bg-white text-[#5d5bf6] shadow-xs'
                    : 'bg-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCourseViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1 ${
                  courseViewMode === 'table'
                    ? 'bg-white text-[#5d5bf6] shadow-xs'
                    : 'bg-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Manage Categories Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowManageCategoriesModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 cursor-pointer transition-all"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Categories</span>
            </button>

            {/* Add New Course Button */}
            <button
              type="button"
              onClick={() => setShowAddCourseModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Course</span>
            </button>
          </div>
        </div>

        {/* Row 2: Minimal Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-100 text-xs">
          {categories.map((cat, cIdx) => {
            const displayLabel = isAllCatHelper(cat) ? 'All' : cat;
            const count = courses.filter(c => courseMatchesCategoryHelper(c, cat)).length;
            const isFilterActive = isAllCatHelper(adminCourseCategoryFilter) ? isAllCatHelper(cat) : adminCourseCategoryFilter === cat;

            return (
              <button
                key={cIdx}
                type="button"
                onClick={() => setAdminCourseCategoryFilter(isAllCatHelper(cat) ? 'All' : cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none flex items-center gap-1.5 shrink-0 ${
                  isFilterActive
                    ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-xs shadow-[#5d5bf6]/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{displayLabel}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${
                  isFilterActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowManageCategoriesModal(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#5d5bf6] bg-[#5d5bf6]/10 hover:bg-[#5d5bf6]/20 border border-[#5d5bf6]/20 cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Course Directory View */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-xs">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-700">No courses found</p>
          <p className="text-xs text-slate-400 mt-1">
            {courseSearchQuery ? `No courses matching "${courseSearchQuery}"` : 'No courses in this category yet.'}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {courseSearchQuery && (
              <button
                onClick={() => setCourseSearchQuery('')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer border-none"
              >
                Reset Search
              </button>
            )}
            <button
              onClick={() => setShowAddCourseModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-xs font-bold text-white cursor-pointer border-none"
            >
              + Create First Course
            </button>
          </div>
        </div>
      ) : courseViewMode === 'grid' ? (
        /* GRID VIEW: CLEAN, MINIMAL CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(({ course, originalIdx: idx }) => (
            <div 
              key={course.id || idx} 
              className={`bg-white rounded-2xl border ${
                course.isActive === false ? 'border-dashed border-slate-300 opacity-90' : 'border-slate-100'
              } shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group`}
            >
              <div>
                {/* Cover Image Thumbnail with Clean Overlays */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden group/cover">
                  <img 
                    src={course.image} 
                    alt={course.title} 
                    className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {course.isActive === false && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-900/85 text-amber-300 border border-amber-400/30 backdrop-blur-md shadow-xs">
                        Inactive
                      </span>
                    )}
                    {course.isBundle && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500 text-white shadow-xs">
                        Bundle
                      </span>
                    )}
                    {course.category && course.category.toLowerCase() !== 'free' && (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white shadow-2xs">
                        {course.category}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold shadow-2xs ${
                      Number(course.salePrice) === 0 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-white text-slate-900 font-black'
                    }`}>
                      {Number(course.salePrice) === 0 ? 'Free' : `৳${Number(course.salePrice).toLocaleString()}`}
                    </span>
                  </div>

                  {/* Change Cover Hover Overlay */}
                  <div 
                    onClick={() => {
                      if (typeof openGalleryModal === 'function') {
                        openGalleryModal(course.image, `Choose Cover for ${course.title}`, 'Courses', (newUrl) => {
                          const updated = courses.map((c, i) => i === idx ? { ...c, image: newUrl } : c);
                          setCourses(updated);
                          if (typeof persistAll === 'function') persistAll({ courses: updated });
                        });
                      }
                    }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer text-white text-xs font-bold"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <span>Change Cover</span>
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-4 space-y-2.5">
                  <h3 
                    onClick={() => openCurriculumStudio && openCurriculumStudio(idx, "basic")}
                    className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2 min-h-[2.5rem] hover:text-[#5d5bf6] cursor-pointer transition-colors"
                  >
                    {course.title}
                  </h3>

                  {/* Minimal Meta Row */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    {(() => {
                      if (course.isExamBatch || course.category === 'EXAM BATCH') {
                        return (
                          <>
                            <span className="flex items-center gap-1 text-slate-700 font-bold">
                              <Play className="w-3.5 h-3.5 text-[#5d5bf6]" />
                              {course.examCountText || `${course.examCount || 0} Exams`}
                            </span>
                            {course.questionCount && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-500 font-medium">
                                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                                  {course.questionCount}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span className="font-mono text-[10px] text-slate-400">ID #{idx + 1}</span>
                          </>
                        );
                      }
                      const lesCount = (course.curriculum || []).reduce((acc, s) => acc + (s.chapters || []).reduce((cAcc, c) => cAcc + (c.lessons || []).length, 0), 0);
                      return (
                        <>
                          <span className="flex items-center gap-1 text-slate-700 font-bold">
                            <Play className="w-3.5 h-3.5 text-[#5d5bf6]" />
                            {lesCount} Classes
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500 font-medium">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {(course.curriculum || []).length} Modules
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-slate-400">ID #{idx + 1}</span>
                        </>
                      );
                    })()}
                  </div>

                  {/* Pricing & Fixed Minimal Toggle Switch Row */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                    <div>
                      {Number(course.salePrice) === 0 ? (
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Free Access
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-black text-slate-900">৳{Number(course.salePrice).toLocaleString()}</span>
                          {course.regularPrice && course.regularPrice > course.salePrice && (
                            <span className="text-[11px] text-slate-400 line-through">৳{Number(course.regularPrice).toLocaleString()}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pixel-Perfect Fixed iOS-Style Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={course.isActive !== false}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof handleToggleCourseActive === 'function') {
                          handleToggleCourseActive(course, idx);
                        }
                      }}
                      className="inline-flex items-center gap-2 cursor-pointer border-none bg-transparent p-0 select-none group/switch focus:outline-none"
                      title={course.isActive !== false ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
                    >
                      <span className={`text-[11px] font-bold transition-colors ${
                        course.isActive !== false ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {course.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                        course.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}>
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                            course.isActive !== false ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Clean Single-Row Action Footer */}
              <div className="p-4 pt-0">
                <div className="flex items-center gap-2">
                  {/* Primary Action: Curriculum / Quizzes */}
                  {(() => {
                    const lesCount = (course.curriculum || []).reduce((acc, s) => acc + (s.chapters || []).reduce((cAcc, c) => cAcc + (c.lessons || []).length, 0), 0);
                    return (
                      <button
                        type="button"
                        onClick={() => openCurriculumStudio && openCurriculumStudio(idx, 'curriculum')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer border-none"
                        title={(course.isExamBatch || course.category === 'EXAM BATCH') ? "Quizzes & Questions Studio" : "Manage Classes, Video URLs, PDFs & Quizzes"}
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{(course.isExamBatch || course.category === 'EXAM BATCH') ? 'Quizzes & Exams' : `Classes & Lectures (${lesCount})`}</span>
                      </button>
                    );
                  })()}

                  {/* Secondary Action: Edit Details */}
                  <button
                    type="button"
                    onClick={() => openCurriculumStudio && openCurriculumStudio(idx, "basic")}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border-none"
                    title="Edit Course Metadata & Pricing"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>

                  {/* Quick Landing Page Overview */}
                  <button
                    type="button"
                    onClick={() => openCurriculumStudio && openCurriculumStudio(idx, "overview")}
                    className="p-2 rounded-xl text-slate-400 hover:text-[#5d5bf6] hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
                    title="Landing Page & Features Overview"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  {/* Delete Course */}
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(course.title, idx)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-none bg-transparent"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW: COMPACT SAAS LIST */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Course Title & ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Curriculum Structure</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredCourses.map(({ course, originalIdx: idx }) => (
                  <tr key={course.id || idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={course.image} 
                          alt={course.title} 
                          className="w-12 h-8 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div>
                          <div 
                            className="font-extrabold text-slate-900 leading-tight hover:text-[#5d5bf6] cursor-pointer" 
                            onClick={() => openCurriculumStudio && openCurriculumStudio(idx, "basic")}
                          >
                            {course.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: #{idx + 1} • {course.isBundle ? 'Bundle' : 'Single Course'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {course.category || 'General'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-[#5d5bf6]">{(course.curriculum || []).length} Modules</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{course.features?.length || 0} Features</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {Number(course.salePrice) === 0 ? (
                        <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Free
                        </span>
                      ) : (
                        <div className="font-extrabold text-slate-900">
                          ৳{Number(course.salePrice).toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Status Column with Active/Inactive Toggle */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={course.isActive !== false}
                        onClick={() => {
                          if (typeof handleToggleCourseActive === 'function') {
                            handleToggleCourseActive(course, idx);
                          }
                        }}
                        className="inline-flex items-center gap-2 cursor-pointer border-none bg-transparent p-0 select-none group/switch focus:outline-none"
                        title={course.isActive !== false ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
                      >
                        <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                          course.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}>
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                              course.isActive !== false ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </span>
                        <span className={`text-[11px] font-bold ${course.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {course.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {(() => {
                          const lesCount = (course.curriculum || []).reduce((acc, s) => acc + (s.chapters || []).reduce((cAcc, c) => cAcc + (c.lessons || []).length, 0), 0);
                          return (
                            <button
                              type="button"
                              onClick={() => openCurriculumStudio && openCurriculumStudio(idx, 'curriculum')}
                              title={(course.isExamBatch || course.category === 'EXAM BATCH') ? "Quizzes & Questions Studio" : "Manage Classes, Video URLs, PDFs & Quizzes"}
                              className="px-2.5 py-1.5 rounded-lg bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold transition-all cursor-pointer border-none shadow-2xs flex items-center gap-1.5"
                            >
                              <Play className="w-3 h-3" />
                              <span>{(course.isExamBatch || course.category === 'EXAM BATCH') ? 'Quizzes & Questions' : `Classes & Lectures (${lesCount})`}</span>
                            </button>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => openCurriculumStudio && openCurriculumStudio(idx, "basic")}
                          title="Edit Details"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(course.title, idx)}
                          title="Delete Course"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
