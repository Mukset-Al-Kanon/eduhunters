import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, GraduationCap } from 'lucide-react';

export default function CourseSearchSelect({
  value,
  onChange,
  bundles = [],
  courses = [],
  examBatches = [],
  placeholder = 'কোর্স অথবা কম্বো বান্ডিল বেছে নিন...',
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

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Normalize options into a unified catalog
  const catalog = useMemo(() => {
    const items = [];

    // 1. Combo Bundles
    (bundles || []).forEach(b => {
      items.push({
        id: `bundle:${b.id}`,
        value: `bundle:${b.id}`,
        title: b.title,
        type: 'BUNDLE',
        typeName: 'কম্বো বান্ডিল',
        typeBadge: '🎁 Bundle',
        typeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: '🎁',
        badge: `${b.courseIds?.length || 0}টি কোর্স অন্তর্ভুক্ত`,
        price: b.price ? `৳${b.price}` : '',
        meta: b.subtitle || `${b.courseIds?.length || 0}টি ফুল কোর্স কম্বো`,
        raw: b
      });
    });

    // 2. Exam Batches
    (examBatches || []).forEach(eb => {
      items.push({
        id: `exam:${eb.key}`,
        value: eb.title,
        title: eb.title,
        type: 'EXAM',
        typeName: 'এক্সাম ব্যাচ',
        typeBadge: '🎯 Exam Batch',
        typeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: '🎯',
        badge: eb.badge || 'স্পেশাল এক্সাম সিরিজ',
        price: eb.price ? `৳${eb.price}` : '',
        meta: eb.examCountText || `${eb.questionCount || 'MCQ'} টেস্ট সিরিজ`,
        raw: eb
      });
    });

    // 3. Courses
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
        badge: c.category || 'একাডেমিক কোর্স',
        price: c.salePrice ? `৳${c.salePrice}` : (c.isFree ? 'ফ্রি' : ''),
        meta: c.lessons ? `${c.lessons.length}টি ক্লাস ও লেকচার` : (c.instructor ? `প্রভাষক: ${c.instructor}` : 'সম্পূর্ণ সিলেবাস'),
        raw: c
      });
    });

    return items;
  }, [bundles, courses, examBatches]);

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
      // Category filter
      if (activeCategory !== 'ALL' && item.type !== activeCategory) {
        return false;
      }
      // Search filter
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
    const bundlesList = filteredItems.filter(i => i.type === 'BUNDLE');
    const examList = filteredItems.filter(i => i.type === 'EXAM');
    const coursesList = filteredItems.filter(i => i.type === 'COURSE');

    return [
      { key: 'BUNDLE', title: '🎁 কম্বো বান্ডিলসমূহ (এক ক্লিকে সকল কোর্স আনলক)', items: bundlesList },
      { key: 'EXAM', title: '🎯 মেডিকেল ও ভার্সিটি ফাইনাল এক্সাম ব্যাচসমূহ', items: examList },
      { key: 'COURSE', title: '📚 একাডেমি ও এডমিশন কোর্সসমূহ', items: coursesList }
    ].filter(group => group.items.length > 0);
  }, [filteredItems]);

  const handleSelect = (item) => {
    onChange(item.value);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full min-h-[44px] bg-white border rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition-all shadow-2xs select-none ${
          isOpen
            ? 'border-[#5d5bf6] ring-2 ring-[#5d5bf6]/15 shadow-sm'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedItem ? (
            <>
              <span className="text-base shrink-0">{selectedItem.icon || '🎓'}</span>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${selectedItem.typeColor || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {selectedItem.typeBadge || 'Course'}
                </span>
                <span className="text-xs font-bold text-slate-800 truncate" title={selectedItem.title}>
                  {selectedItem.title}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-medium text-slate-500">{placeholder}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedItem && (
            <button
              type="button"
              onClick={handleClear}
              className="w-5 h-5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
              title="ক্লিয়ার করুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#5d5bf6]' : ''}`} />
        </div>
      </div>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.18)] border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-3 bg-slate-50/80 border-b border-slate-100 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="কোর্স বা ব্যাচের নাম দিয়ে সার্চ করুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#5d5bf6] focus:ring-1 focus:ring-[#5d5bf6]/20 transition-all placeholder:text-slate-400"
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
                { key: 'ALL', label: 'সকল' },
                { key: 'BUNDLE', label: '🎁 বান্ডিল' },
                { key: 'EXAM', label: '🎯 এক্সাম ব্যাচ' },
                { key: 'COURSE', label: '📚 কোর্সসমূহ' }
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
          <div className="max-h-56 sm:max-h-60 overflow-y-auto p-2 space-y-2.5 divide-y divide-slate-100/80">
            {groupedItems.length > 0 ? (
              groupedItems.map(group => (
                <div key={group.key} className="pt-2 first:pt-0 space-y-1">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{group.title}</span>
                    <span className="text-[10px] font-semibold text-slate-400">{group.items.length}টি</span>
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
                              ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-100'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-800 leading-relaxed">
                                  {item.title}
                                </span>
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
                              isSelected ? 'bg-[#5d5bf6] text-white' : 'border border-slate-200 text-transparent'
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
                <Search className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">কোনো কোর্স বা ব্যাচ খুঁজে পাওয়া যায়নি</p>
                <p className="text-[11px] text-slate-400">অন্য কোনো নাম দিয়ে সার্চ করুন অথবা ফিল্টার পরিবর্তন করুন।</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
