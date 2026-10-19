import React from 'react';
import { BookOpen, X, ImageIcon, Upload } from 'lucide-react';

export default function AddCourseModal({
  isOpen,
  onClose,
  newCourse,
  setNewCourse,
  onSubmit,
  categories = [],
  openGalleryModal,
  handleDeviceFileUpload
}) {
  if (!isOpen) return null;

  const isAllCat = (cat) => !cat || cat === 'All' || cat === 'সকল';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create New Course / Batch</h3>
              <p className="text-[11px] text-slate-500">Add learning course to enrollment catalog</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Full Course Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Medical 2nd Time Special Batch"
              value={newCourse.title}
              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={newCourse.category}
                onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer font-bold"
              >
                {categories.filter(c => !isAllCat(c)).map((cat, cIdx) => (
                  <option key={cIdx} value={cat}>{cat}</option>
                ))}
                {newCourse.category && !categories.includes(newCourse.category) && (
                  <option value={newCourse.category}>{newCourse.category}</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Course Type</label>
              <select
                value={newCourse.isBundle ? 'bundle' : 'single'}
                onChange={(e) => setNewCourse({ ...newCourse, isBundle: e.target.value === 'bundle' })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
              >
                <option value="single">Single Course</option>
                <option value="bundle">Mega Bundle (Bundle Badge)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Discount Price (৳)</label>
              <input
                type="number"
                required
                value={newCourse.salePrice}
                onChange={(e) => setNewCourse({ ...newCourse, salePrice: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Regular Price (৳)</label>
              <input
                type="number"
                value={newCourse.regularPrice}
                onChange={(e) => setNewCourse({ ...newCourse, regularPrice: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Course Cover Picker */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">Course Cover Image</label>
            <div className="flex items-center gap-3">
              <div className="w-20 aspect-video rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
                <img src={newCourse.image} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openGalleryModal && openGalleryModal(newCourse.image, 'Choose Course Cover', 'Courses', (newUrl) => {
                    setNewCourse(prev => ({ ...prev, image: newUrl }));
                  })}
                  className="px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Choose from Gallery</span>
                </button>
                <label className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && handleDeviceFileUpload) {
                        handleDeviceFileUpload(file, (newUrl) => setNewCourse(prev => ({ ...prev, image: newUrl })));
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-blue-500/20 transition-all"
            >
              Create Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
