import React from 'react';
import { Trash2 } from 'lucide-react';

export default function ManageCategoriesModal({
  isOpen,
  onClose,
  categories = [],
  courses = [],
  newCategoryName,
  setNewCategoryName,
  handleAddCategory,
  handleDeleteCategory
}) {
  if (!isOpen) return null;

  const isAllCat = (cat) => !cat || cat === 'All' || cat === 'সকল';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Course Categories & Batches</h3>
            <p className="text-xs text-slate-400">Add, rename, or delete category filters</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer border-none"
          >
            ✕
          </button>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="flex items-center gap-2">
          <input 
            type="text"
            placeholder="New category name (e.g. HSC 2026)..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#5d5bf6]"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-[#5d5bf6] hover:bg-[#4e4be3] text-white text-xs font-bold cursor-pointer border-none shadow-xs"
          >
            + Add
          </button>
        </form>

        {/* Category List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pt-1">
          {categories.map((cat, idx) => {
            const count = isAllCat(cat) ? courses.length : courses.filter(c => c.category === cat).length;
            const isDefault = isAllCat(cat);

            return (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">{isDefault ? 'All (Default Filter)' : cat}</span>
                  <span className="text-[10px] font-black bg-slate-200 px-1.5 py-0.2 rounded-md text-slate-600">
                    {count} courses
                  </span>
                </div>

                {!isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    title="Delete category"
                    className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer border-none bg-transparent transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer border-none"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
