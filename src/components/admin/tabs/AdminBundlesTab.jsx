import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  TrendingDown,
  BookOpen,
  Search,
  LayoutGrid,
  Plus,
  Copy,
  Edit2,
  Trash2
} from 'lucide-react';

export default function AdminBundlesTab({
  bundles = [],
  courses = [],
  handleOpenAddBundle,
  handleOpenEditBundle,
  handleDuplicateBundle,
  handleDeleteBundle,
  handleToggleBundleStatus,
  bundleSearchQuery: externalSearchQuery,
  setBundleSearchQuery: externalSetSearchQuery,
  bundleStatusFilter: externalStatusFilter,
  setBundleStatusFilter: externalSetStatusFilter,
  bundleViewMode: externalViewMode,
  setBundleViewMode: externalSetViewMode
}) {
  // Support both internal state and controlled props
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalStatusFilter, setInternalStatusFilter] = useState('ALL');
  const [internalViewMode, setInternalViewMode] = useState('grid');

  const bundleSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setBundleSearchQuery = externalSetSearchQuery || setInternalSearchQuery;

  const bundleStatusFilter = externalStatusFilter !== undefined ? externalStatusFilter : internalStatusFilter;
  const setBundleStatusFilter = externalSetStatusFilter || setInternalStatusFilter;

  const bundleViewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  const setBundleViewMode = externalSetViewMode || setInternalViewMode;

  const activeBundlesCount = bundles.filter(b => b.status === 'ACTIVE').length;
  const draftBundlesCount = bundles.filter(b => b.status !== 'ACTIVE').length;

  // Calculate total courses packaged
  const uniquePackagedCourses = new Set();
  bundles.forEach(b => (b.courseIds || []).forEach(id => uniquePackagedCourses.add(id)));

  // Calculate average discount percentage
  let totalDiscountPct = 0;
  let countWithDiscount = 0;
  bundles.forEach(b => {
    const reg = Number(b.regularPrice) || 0;
    const sale = Number(b.salePrice) || 0;
    if (reg > sale && reg > 0) {
      totalDiscountPct += Math.round(((reg - sale) / reg) * 100);
      countWithDiscount++;
    }
  });
  const avgDiscount = countWithDiscount > 0 ? Math.round(totalDiscountPct / countWithDiscount) : 40;

  const filteredBundles = bundles.filter(b => {
    if (bundleStatusFilter !== 'ALL' && (b.status || 'ACTIVE') !== bundleStatusFilter) return false;
    if (!bundleSearchQuery.trim()) return true;
    const q = bundleSearchQuery.toLowerCase().trim();
    const titleMatch = (b.title || '').toLowerCase().includes(q);
    const subMatch = (b.subtitle || '').toLowerCase().includes(q);
    const badgeMatch = (b.badge || '').toLowerCase().includes(q);
    const descMatch = (b.description || '').toLowerCase().includes(q);
    const coursesMatch = (b.courseIds || []).some(cId => {
      const found = courses.find(c => c.id === cId || c.slug === cId || c.key === cId);
      return found && (found.title || '').toLowerCase().includes(q);
    });
    return titleMatch || subMatch || badgeMatch || descMatch || coursesMatch;
  });

  return (
    <div className="space-y-6">
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Bundles</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{bundles.length}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Combo packages</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#5d5bf6]/10 flex items-center justify-center text-[#5d5bf6]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Active</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{activeBundlesCount}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Visible on site</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Discount</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">~{avgDiscount}%</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Combo savings</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Courses Included</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">{uniquePackagedCourses.size}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Distinct courses</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search bundles by title, course, or discount..."
              value={bundleSearchQuery}
              onChange={(e) => setBundleSearchQuery(e.target.value)}
              className="w-full bg-[#f4f6fa] border border-slate-200/80 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6] focus:ring-2 focus:ring-[#5d5bf6]/15 transition-all font-medium placeholder:text-slate-400"
            />
            {bundleSearchQuery && (
              <button 
                onClick={() => setBundleSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-2">
            {/* Grid / Table Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setBundleViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1 ${
                  bundleViewMode === 'grid'
                    ? 'bg-white text-[#5d5bf6] shadow-xs'
                    : 'bg-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setBundleViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1 ${
                  bundleViewMode === 'table'
                    ? 'bg-white text-[#5d5bf6] shadow-xs'
                    : 'bg-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add New Bundle Button */}
            <button
              type="button"
              onClick={handleOpenAddBundle}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Bundle</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {[
            { key: 'ALL', label: `All Bundles (${bundles.length})` },
            { key: 'ACTIVE', label: `Active (${activeBundlesCount})` },
            { key: 'DRAFT', label: `Draft (${draftBundlesCount})` }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setBundleStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
                bundleStatusFilter === f.key
                  ? 'bg-[#5d5bf6] text-white border-[#5d5bf6] shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content: Grid or Table View */}
      {filteredBundles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-[#5d5bf6] flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Bundles Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {bundleSearchQuery ? 'No bundles matched your search term.' : 'Create your first course combo bundle to offer discounted packages to students!'}
          </p>
          <button
            type="button"
            onClick={handleOpenAddBundle}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none transition-all mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Bundle</span>
          </button>
        </div>
      ) : bundleViewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBundles.map(bundle => {
            const regPrice = Number(bundle.regularPrice) || 0;
            const salePrice = Number(bundle.salePrice) || 0;
            const savings = Math.max(0, regPrice - salePrice);
            const discountPct = regPrice > 0 ? Math.round((savings / regPrice) * 100) : 0;
            const isActive = (bundle.status || 'ACTIVE') === 'ACTIVE';

            // Resolve included courses
            const includedCourses = (bundle.courseIds || []).map(id => {
              return courses.find(c => c.id === id || c.slug === id || c.key === id) || {
                id,
                title: id,
                salePrice: 0,
                image: '/master_english_30_days.png'
              };
            });

            return (
              <div 
                key={bundle.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all overflow-hidden flex flex-col group"
              >
                {/* Top Cover Banner */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  <img 
                    src={bundle.image || 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp'} 
                    alt={bundle.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                      isActive 
                        ? 'bg-emerald-500/90 text-white' 
                        : 'bg-slate-700/90 text-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                      {isActive ? 'Active' : 'Draft'}
                    </span>

                    {bundle.badge && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#5d5bf6]/90 text-white backdrop-blur-md shadow-xs">
                        {bundle.badge}
                      </span>
                    )}
                  </div>

                  {/* Top Right Savings Pill */}
                  {discountPct > 0 && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-wide shadow-sm">
                      {discountPct}% OFF
                    </div>
                  )}

                  {/* Bottom Count Pill on Banner */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="font-bold flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
                      <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
                      {includedCourses.length} Courses Combo Pack
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#5d5bf6] transition-colors line-clamp-1">
                      {bundle.title}
                    </h3>
                    {bundle.subtitle && (
                      <p className="text-xs font-medium text-slate-500 line-clamp-1 mt-0.5">
                        {bundle.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Price Breakdown Footer */}
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Combo Price</p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xl font-black text-[#5d5bf6]">৳{salePrice}</span>
                        {regPrice > salePrice && (
                          <span className="text-xs text-slate-400 line-through font-semibold">৳{regPrice}</span>
                        )}
                      </div>
                      {savings > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600">Save ৳{savings}</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleBundleStatus(bundle.id)}
                        title={isActive ? 'Deactivate (Draft)' : 'Activate (Publish)'}
                        className={`p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isActive ? 'Live' : 'Draft'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateBundle(bundle)}
                        title="Duplicate Bundle"
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/80 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditBundle(bundle)}
                        title="Edit Bundle"
                        className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#5d5bf6] border border-indigo-100 transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBundle(bundle.id, bundle.title)}
                        title="Delete Bundle"
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Bundle Pack</th>
                  <th className="py-3.5 px-4">Included Courses</th>
                  <th className="py-3.5 px-4">Regular Price</th>
                  <th className="py-3.5 px-4">Combo Price</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBundles.map(bundle => {
                  const reg = Number(bundle.regularPrice) || 0;
                  const sale = Number(bundle.salePrice) || 0;
                  const savings = Math.max(0, reg - sale);
                  const discountPct = reg > 0 ? Math.round((savings / reg) * 100) : 0;
                  const isActive = (bundle.status || 'ACTIVE') === 'ACTIVE';

                  return (
                    <tr key={bundle.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={bundle.image || 'https://assets.codervai.com/courses/1781447985147-extra_info_batch.webp'} 
                            alt={bundle.title} 
                            className="w-12 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-xs truncate max-w-xs">{bundle.title}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">{bundle.subtitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-[#5d5bf6] font-bold text-[11px]">
                          <BookOpen className="w-3 h-3" />
                          {bundle.courseIds?.length || 0} Courses
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-400 line-through">
                        ৳{reg}
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 text-sm">
                        ৳{sale}
                      </td>
                      <td className="py-3 px-4">
                        {discountPct > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px]">
                            {discountPct}% OFF
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Standard</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleBundleStatus(bundle.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer border ${
                            isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isActive ? '● Active' : '○ Draft'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditBundle(bundle)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#5d5bf6] hover:bg-indigo-50 transition-colors cursor-pointer border-none bg-transparent"
                            title="Edit Bundle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateBundle(bundle)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
                            title="Duplicate Bundle"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBundle(bundle.id, bundle.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-none bg-transparent"
                            title="Delete Bundle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
