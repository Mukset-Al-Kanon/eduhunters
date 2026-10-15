import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, GraduationCap, Sparkles, BookOpen, Layers, Award } from 'lucide-react';

export default function CourseSearchSelect({
  value,
  onChange,
  bundles = [],
  courses = [],
  examBatches = [],
  enrolledCourses = [],
  placeholder = 'Choose Course, Bundle or Exam Batch...',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'BUNDLE' | 'EXAM' | 'COURSE'
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation & Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Helper to check if student already has access to a course
  const checkIsAlreadyEnrolled = useMemo(() => {
    if (!Array.isArray(enrolledCourses) || enrolledCourses.length === 0) {
      return () => false;
    }
    const normalizedEnrolled = enrolledCourses.map(c => 
      (typeof c === 'string' ? c : c?.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    ).filter(Boolean);

    return (title) => {
      if (!title) return false;
      const normT = title.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalizedEnrolled.some(ec => ec === normT || ec.includes(normT) || normT.includes(ec));
    };
  }, [enrolledCourses]);

  // Normalize options into a unified catalog
  const catalog = useMemo(() => {
    const items = [];

    // 1. Combo Bundles
    (bundles || []).forEach(b => {
      items.push({
        id: `bundle:${b.id || b.title}`,
        value: b.title,
        title: b.title,
        type: 'BUNDLE',
        typeName: 'কম্বো বান্ডিল',
        typeBadge: '🎁 Bundle',
        typeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: '🎁',
        badge: `${b.courseIds?.length || 0} Courses Included`,
        price: b.price ? `৳${b.price}` : '',
        meta: b.subtitle || `${b.courseIds?.length || 0} Full Courses Combo`,
        isEnrolled: checkIsAlreadyEnrolled(b.title),
        raw: b
      });
    });

    // 2. Academic Courses
    (courses || []).forEach(c => {
      items.push({
        id: `course:${c.id || c.title}`,
        value: c.title,
        title: c.title,
        type: 'COURSE',
        typeName: 'কোর্স',
        typeBadge: '📚 Course',
        typeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: '📚',
        badge: c.category || 'Academic Course',
        price: c.salePrice ? `৳${c.salePrice}` : (c.isFree ? 'Free' : ''),
        meta: c.lessons ? `${c.lessons.length} Classes` : (c.instructor ? `Instructor: ${c.instructor}` : 'Full Syllabus'),
        isEnrolled: checkIsAlreadyEnrolled(c.title),
        raw: c
      });
    });

    // 3. Exam Batches
    (examBatches || []).forEach(eb => {
      items.push({
        id: `exam:${eb.key || eb.title}`,
        value: eb.title,
        title: eb.title,
        type: 'EXAM',
        typeName: 'এক্সাম ব্যাচ',
        typeBadge: '🎯 Exam Batch',
        typeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: '🎯',
        badge: eb.badge || 'Special Exam Series',
        price: eb.price ? `৳${eb.price}` : '',
        meta: eb.examCountText || `${eb.questionCount || 'MCQ'} Test Series`,
        isEnrolled: checkIsAlreadyEnrolled(eb.title),
        raw: eb
      });
    });

    return items;
  }, [bundles, courses, examBatches, checkIsAlreadyEnrolled]);

  // Find currently selected item
  const selectedItem = useMemo(() => {
    if (!value) return null;
    return catalog.find(item => 
      item.value === value || 
      item.title === value || 
      item.id === value ||
      (value.startsWith('bundle:') && item.id === value)
    ) || {
      title: value,
      typeBadge: '📌 Selected',
      typeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: '🎓'
    };
  }, [value, catalog]);

  // Filter items based on search and category tab
  const filteredItems = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return catalog.filter(item => {
      if (activeCategory !== 'ALL' && item.type !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.title?.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q) ||
        item.meta?.toLowerCase().includes(q) ||
        item.typeName?.toLowerCase().includes(q)
      );
    });
  }, [catalog, searchQuery, activeCategory]);

  // Group filtered items by type for clean presentation
  const groupedItems = useMemo(() => {
    const coursesList = filteredItems.filter(i => i.type === 'COURSE');
    const bundlesList = filteredItems.filter(i => i.type === 'BUNDLE');
    const examList = filteredItems.filter(i => i.type === 'EXAM');

    return [
      { key: 'COURSE', title: '📚 Academic Courses', items: coursesList },
      { key: 'BUNDLE', title: '🎁 Combo Bundles', items: bundlesList },
      { key: 'EXAM', title: '🎯 Final Exam Batches', items: examList }
    ].filter(group => group.items.length > 0);
  }, [filteredItems]);

  const handleSelect = (item) => {
    onChange(item.value || item.title);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      ALL: catalog.length,
      COURSE: catalog.filter(i => i.type === 'COURSE').length,
      BUNDLE: catalog.filter(i => i.type === 'BUNDLE').length,
      EXAM: catalog.filter(i => i.type === 'EXAM').length
    };
  }, [catalog]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full min-h-[46px] bg-slate-50/90 hover:bg-white focus:bg-white border-2 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-2xs select-none ${
          isOpen
            ? 'border-[#5d5bf6] ring-4 ring-[#5d5bf6]/15 bg-white shadow-md'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedItem ? (
            <>
              <span className="text-lg shrink-0 leading-none">{selectedItem.icon || '🎓'}</span>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${selectedItem.typeColor || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {selectedItem.typeBadge || 'Course'}
                </span>
                <span className="text-xs font-black text-slate-800 truncate" title={selectedItem.title}>
                  {selectedItem.title}
                </span>
                {selectedItem.price && (
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {selectedItem.price}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 text-slate-400">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-500">{placeholder}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedItem && (
            <button
              type="button"
              onClick={handleClear}
              className="w-5 h-5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#5d5bf6]' : ''}`} />
        </div>
      </div>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-[60] bg-white rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.2)] border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-3 bg-slate-50/90 border-b border-slate-100 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search course or batch by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#5d5bf6] focus:ring-2 focus:ring-[#5d5bf6]/20 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 border-none bg-transparent cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
              {[
                { key: 'ALL', label: `All (${counts.ALL})` },
                { key: 'COURSE', label: `📚 Academic (${counts.COURSE})` },
                { key: 'BUNDLE', label: `🎁 Bundles (${counts.BUNDLE})` },
                { key: 'EXAM', label: `🎯 Exam Batches (${counts.EXAM})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer transition-all border ${
                    activeCategory === tab.key
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Options List */}
          <div className="max-h-64 sm:max-h-72 overflow-y-auto p-2 space-y-2.5 divide-y divide-slate-100">
            {groupedItems.length > 0 ? (
              groupedItems.map(group => (
                <div key={group.key} className="pt-2 first:pt-0 space-y-1">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{group.title}</span>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{group.items.length}</span>
                  </div>

                  <div className="space-y-1">
                    {group.items.map(item => {
                      const isSelected = selectedItem?.value === item.value || selectedItem?.title === item.title;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                            isSelected
                              ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950 shadow-2xs ring-1 ring-indigo-200'
                              : 'bg-white hover:bg-slate-50 border-slate-100/70 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-bold leading-snug ${isSelected ? 'text-indigo-950 font-black' : 'text-slate-800'}`}>
                                  {item.title}
                                </span>
                                {item.isEnrolled && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                    ✓ Already Enrolled
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${item.typeColor}`}>
                                  {item.badge}
                                </span>
                                {item.meta && (
                                  <span className="text-slate-400 truncate">• {item.meta}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.price && (
                              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                {item.price}
                              </span>
                            )}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-[#5d5bf6] text-white shadow-2xs' : 'border border-slate-200 text-transparent'
                            }`}>
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 px-4 text-slate-400 space-y-1.5">
                <Search className="w-7 h-7 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No courses or batches found</p>
                <p className="text-[11px] text-slate-400">Try searching with a different keyword or change category filter.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
