import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Layers, 
  BookOpen, 
  Save, 
  Trash2, 
  Check, 
  X, 
  Search, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Eye, 
  Copy,
  Tag
} from 'lucide-react';

export default function BundleStudioPage({
  bundle,
  courses = [],
  onSave,
  onBack,
  triggerToast
}) {
  const isNew = !bundle?.title;

  const [form, setForm] = useState({
    id: bundle?.id || `bundle-${Date.now()}`,
    title: bundle?.title || '',
    subtitle: bundle?.subtitle || '',
    description: bundle?.description || '',
    image: bundle?.image || 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp',
    badge: bundle?.badge || 'Save 45% • Mega Combo',
    regularPrice: bundle?.regularPrice !== undefined ? String(bundle?.regularPrice) : '',
    salePrice: bundle?.salePrice !== undefined ? String(bundle?.salePrice) : '',
    courseIds: Array.isArray(bundle?.courseIds) ? [...bundle.courseIds] : [],
    features: Array.isArray(bundle?.features) ? [...bundle.features] : [
      'সবগুলো কোর্সের সম্পূর্ণ অ্যাক্সেস',
      'লেকচার নোট ও স্পেশাল PDF শিট',
      'লাইভ এক্সাম ও মেরিট লিস্ট লিডারবোর্ড'
    ],
    status: bundle?.status || 'ACTIVE'
  });

  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [newFeatureText, setNewFeatureText] = useState('');

  // Resolve currently selected courses objects
  const selectedCourses = useMemo(() => {
    return form.courseIds.map(cId => {
      const found = courses.find(c => c.id === cId || c.slug === cId || c.key === cId);
      return found || {
        id: cId,
        title: cId,
        category: 'Academic',
        salePrice: 0,
        image: '/master_english_30_days.png'
      };
    });
  }, [form.courseIds, courses]);

  // Standalone total value of selected courses
  const standaloneSum = useMemo(() => {
    return selectedCourses.reduce((acc, c) => {
      return acc + (Number(c.salePrice || c.price || c.regularPrice || 0));
    }, 0);
  }, [selectedCourses]);

  // Pricing calculations
  const regularPriceNum = Number(form.regularPrice) || standaloneSum;
  const salePriceNum = Number(form.salePrice) || 0;
  const savingsNum = Math.max(0, regularPriceNum - salePriceNum);
  const discountPercent = regularPriceNum > 0 ? Math.round((savingsNum / regularPriceNum) * 100) : 0;

  // Filtered available courses for the right sidebar picker
  const filteredAvailableCourses = useMemo(() => {
    if (!courseSearchQuery.trim()) return courses;
    const q = courseSearchQuery.toLowerCase().trim();
    return courses.filter(c => {
      return (c.title || '').toLowerCase().includes(q) ||
             (c.category || '').toLowerCase().includes(q) ||
             (c.id || '').toLowerCase().includes(q);
    });
  }, [courses, courseSearchQuery]);

  // Toggle course in bundle
  const handleToggleCourse = (courseId) => {
    setForm(prev => {
      const exists = prev.courseIds.includes(courseId);
      const nextIds = exists 
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId];

      // Calculate new sum
      let sum = 0;
      nextIds.forEach(id => {
        const match = courses.find(item => item.id === id || item.slug === id || item.key === id);
        if (match) {
          sum += Number(match.salePrice || match.price || match.regularPrice || 0);
        }
      });

      return {
        ...prev,
        courseIds: nextIds,
        // Auto-suggest regularPrice if not set yet or was 0
        regularPrice: prev.regularPrice && Number(prev.regularPrice) > 0 ? prev.regularPrice : (sum > 0 ? String(sum) : '')
      };
    });
  };

  // Add highlight feature
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setForm(prev => ({
      ...prev,
      features: [...(prev.features || []), newFeatureText.trim()]
    }));
    setNewFeatureText('');
  };

  // Remove highlight feature
  const handleRemoveFeature = (idx) => {
    setForm(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== idx)
    }));
  };

  // Handle Save
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!form.title.trim()) {
      alert('Please enter a Bundle Title');
      return;
    }
    if (form.courseIds.length === 0) {
      alert('Please select at least one course to include in this bundle pack');
      return;
    }
    const sale = Number(form.salePrice) || 0;
    if (!form.salePrice || sale <= 0) {
      alert('Please enter a valid Bundle Sale Price (৳)');
      return;
    }

    const reg = Number(form.regularPrice) || standaloneSum || sale;
    const bundleToSave = {
      ...form,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      regularPrice: reg,
      salePrice: sale,
      badge: form.badge || (reg > sale ? `Save ${Math.round(((reg - sale) / reg) * 100)}%` : 'Combo Pack')
    };

    onSave(bundleToSave);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased pb-24">
      
      {/* ========================================================= */}
      {/* TOP MINIMALIST STICKY ACTION HEADER BAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Back button & Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border-none shrink-0"
              title="Return to Bundles directory"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Bundles</span>
            </button>

            <span className="text-slate-300 hidden sm:inline">/</span>

            <div className="min-w-0 hidden sm:block">
              <h1 className="text-sm font-extrabold text-slate-900 truncate flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#5d5bf6]" />
                <span>{form.title ? form.title : (isNew ? 'Create New Combo Bundle' : 'Edit Bundle')}</span>
              </h1>
            </div>
          </div>

          {/* Right: Status Switcher & Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Status Toggle Pill */}
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, status: prev.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE' }))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                form.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${form.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{form.status === 'ACTIVE' ? 'Live on Site' : 'Draft (Hidden)'}</span>
            </button>

            {/* Discard Button */}
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer border-none"
            >
              Discard
            </button>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 transition-all cursor-pointer border-none"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isNew ? 'Create Bundle' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN STUDIO CANVAS (CLEAN 2-COLUMN MINIMALIST GRID) */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ------------------------------------------------------- */}
          {/* LEFT COLUMN: CORE DETAILS & INCLUSIONS (7 COLS) */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Basic Information Card */}
            <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#5d5bf6]" />
                  Bundle Information
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">Core metadata</span>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bundle Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Medical Admission Complete Combo Pack"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#5d5bf6] focus:ring-2 focus:ring-[#5d5bf6]/15 transition-all placeholder:font-normal placeholder:text-slate-400"
                />
              </div>

              {/* Subtitle / Tagline Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subtitle / Highlights Line
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="e.g. SureShot + Medical Special + RTDS + Medilogy Intensive"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] focus:ring-2 focus:ring-[#5d5bf6]/15 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Description Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide a comprehensive summary of what students will achieve, master, and benefit from this combo pack..."
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-[#5d5bf6] focus:ring-2 focus:ring-[#5d5bf6]/15 transition-all resize-none leading-relaxed placeholder:text-slate-400"
                />
              </div>
            </section>

            {/* 2. Packaged Courses Showcase Card */}
            <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#5d5bf6]" />
                    Courses in this Combo Pack
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#5d5bf6]/10 text-[#5d5bf6] text-[11px] font-black">
                    {selectedCourses.length}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Standalone Value: <strong className="text-slate-800 font-bold">৳{standaloneSum}</strong>
                </div>
              </div>

              {selectedCourses.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-2 bg-slate-50/50">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No courses added to this combo yet</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Select courses from the Course Library on the right to bundle them into this package.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedCourses.map((c) => (
                    <div 
                      key={c.id}
                      className="group p-3 rounded-xl border border-slate-200/80 bg-[#f8fafc] hover:bg-white hover:border-[#5d5bf6]/40 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={c.image || '/master_english_30_days.png'} 
                          alt={c.title}
                          className="w-11 h-9 rounded-lg object-cover shrink-0 border border-slate-200 bg-slate-100" 
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#5d5bf6] transition-colors">
                            {c.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            <span>{c.category || 'Academic'}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-600">৳{c.salePrice || c.price || 0}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCourse(c.id || c.slug || c.key)}
                        title="Remove from bundle"
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 3. Features & Inclusions Card */}
            <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#5d5bf6]" />
                  Key Highlights & Inclusions
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">Bulleted perks for students</span>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2">
                {(form.features || []).map((feat, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[#5d5bf6] text-xs font-semibold"
                  >
                    <span>✓ {feat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-indigo-300 hover:text-indigo-700 bg-transparent border-none cursor-pointer p-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add New Feature Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  placeholder="e.g. 24/7 Dedicated Telegram Doubt Solving..."
                  className="flex-1 bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] font-medium"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border-none transition-colors"
                >
                  + Add Feature
                </button>
              </div>
            </section>
          </div>

          {/* ------------------------------------------------------- */}
          {/* RIGHT COLUMN: PRICING, MEDIA & COURSE PICKER (5 COLS) */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. Pricing & Value Card */}
            <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#5d5bf6]" />
                  Combo Pricing & Value
                </h2>
                {standaloneSum > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, regularPrice: String(standaloneSum) }))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#5d5bf6]/10 hover:bg-[#5d5bf6]/20 text-[#5d5bf6] text-[11px] font-bold transition-colors border-none cursor-pointer"
                  >
                    <span>⚡ Auto-fill ৳{standaloneSum}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Regular Standalone Price */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Regular Price (৳) <span className="text-slate-400 font-normal">(Standalone)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.regularPrice}
                    onChange={(e) => setForm({ ...form, regularPrice: e.target.value })}
                    placeholder={standaloneSum > 0 ? String(standaloneSum) : 'e.g. 2500'}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                  />
                </div>

                {/* Bundle Sale Price */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Bundle Sale Price (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    placeholder="e.g. 1450"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-[#5d5bf6] outline-none focus:border-[#5d5bf6]"
                  />
                </div>
              </div>

              {/* Dynamic Savings Highlight */}
              {salePriceNum > 0 && regularPriceNum > salePriceNum && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Student Saves: ৳{savingsNum}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black">
                    {discountPercent}% OFF
                  </span>
                </div>
              )}
            </section>

            {/* 2. Banner & Visuals Card */}
            <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#5d5bf6]" />
                  Appearance & Badge
                </h2>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, image: 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp' }))}
                  className="text-[11px] font-bold text-[#5d5bf6] hover:underline bg-transparent border-none cursor-pointer p-0"
                >
                  Use Standard Banner
                </button>
              </div>

              {/* Image URL & Thumbnail Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Cover Banner URL
                </label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://... or /image.png"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
              </div>

              {form.image && (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                  <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                  {form.badge && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#5d5bf6] text-white shadow-xs">
                      {form.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Promo Badge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Promo Badge Text
                </label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="e.g. Save 45% • Mega Combo"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
              </div>
            </section>

            {/* 3. Course Library Checklist Card */}
            <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#5d5bf6]" />
                    Course Library Selector
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click any course to toggle inclusion
                  </p>
                </div>
                <span className="text-xs font-bold text-[#5d5bf6]">
                  {form.courseIds.length} selected
                </span>
              </div>

              {/* Course Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search library courses..."
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
                />
              </div>

              {/* Scrollable Course Selection Rows */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredAvailableCourses.map((c) => {
                  const cKey = c.id || c.slug || c.key;
                  const isSelected = form.courseIds.includes(cKey);
                  const price = Number(c.salePrice || c.price || c.regularPrice || 0);

                  return (
                    <div
                      key={cKey}
                      onClick={() => handleToggleCourse(cKey)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#5d5bf6]/5 border-[#5d5bf6] shadow-xs'
                          : 'bg-white border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={c.image || '/master_english_30_days.png'} 
                          alt={c.title} 
                          className="w-10 h-8 rounded-lg object-cover shrink-0 border border-slate-200 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate leading-snug ${isSelected ? 'text-[#5d5bf6]' : 'text-slate-800'}`}>
                            {c.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            <span>{c.category || 'Academic'}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-600">৳{price}</span>
                          </div>
                        </div>
                      </div>

                      {/* Custom Minimal Checkbox */}
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#5d5bf6] text-white shadow-xs'
                          : 'border border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {form.courseIds.length === 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold text-center">
                  ⚠️ Please select at least one course for this combo
                </div>
              )}
            </section>
          </div>
        </form>
      </main>
    </div>
  );
}
