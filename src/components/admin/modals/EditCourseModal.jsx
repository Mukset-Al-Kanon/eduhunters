import React from 'react';

export default function EditCourseModal({
  editingCourseData,
  setEditingCourseData,
  onClose,
  onSubmit,
  categories = [],
  openGalleryModal
}) {
  if (!editingCourseData) return null;

  const isAllCat = (cat) => !cat || cat === 'All' || cat === 'সকল';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl overflow-hidden my-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Edit Course Details</h3>
            <p className="text-xs text-slate-400 font-medium">Update pricing, category, and cover image</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer border-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Course Title *</label>
            <input 
              type="text"
              required
              value={editingCourseData.title}
              onChange={(e) => setEditingCourseData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={editingCourseData.category}
                onChange={(e) => setEditingCourseData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
              >
                {categories.filter(c => !isAllCat(c)).map((cat, cIdx) => (
                  <option key={cIdx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bundle Program</label>
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-xs font-bold text-slate-700">
                <input 
                  type="checkbox"
                  checked={editingCourseData.isBundle}
                  onChange={(e) => setEditingCourseData(prev => ({ ...prev, isBundle: e.target.checked }))}
                />
                <span>Is Bundle Package</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sale Price (৳) *</label>
              <input 
                type="number"
                value={editingCourseData.salePrice}
                onChange={(e) => setEditingCourseData(prev => ({ ...prev, salePrice: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-black text-emerald-600 outline-none focus:bg-white focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Enter 0 for Free Course</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Regular / Original Price (৳)</label>
              <input 
                type="number"
                value={editingCourseData.regularPrice}
                onChange={(e) => setEditingCourseData(prev => ({ ...prev, regularPrice: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-400 line-through outline-none focus:bg-white focus:border-[#5d5bf6]"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Shown with strikethrough</span>
            </div>
          </div>

          {/* Cover Image Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Cover Image</label>
            <div className="flex items-center gap-3">
              <img 
                src={editingCourseData.image} 
                alt="Cover preview" 
                className="w-20 h-12 rounded-xl object-cover ring-1 ring-slate-200"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openGalleryModal && openGalleryModal(editingCourseData.image, 'Select Course Cover', 'Courses', (newUrl) => {
                    setEditingCourseData(prev => ({ ...prev, image: newUrl }));
                  })}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 cursor-pointer"
                >
                  Choose from Gallery
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold shadow-md shadow-[#5d5bf6]/25 cursor-pointer border-none"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
