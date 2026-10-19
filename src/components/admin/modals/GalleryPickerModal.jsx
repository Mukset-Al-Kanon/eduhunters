import React from 'react';
import { Image as ImageIcon, X, Upload, Check } from 'lucide-react';

export default function GalleryPickerModal({
  isOpen,
  onClose,
  galleryTitle,
  gallerySelectedUrl,
  setGallerySelectedUrl,
  galleryCallback,
  handleDeviceFileUpload
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/80 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {galleryTitle || 'Choose Image'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload directly from your device or paste an image link.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center border-none cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Upload from Device */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Upload from Device / Gallery
            </label>
            <label className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all text-center group">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors block">
                  Click to Browse Device Gallery or Drag & Drop
                </span>
                <span className="text-xs text-slate-500">
                  Supports JPG, PNG, WebP (auto-optimized & instantly applied)
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && handleDeviceFileUpload) {
                    handleDeviceFileUpload(file, (newUrl) => {
                      setGallerySelectedUrl(newUrl);
                    });
                  }
                }}
              />
            </label>
          </div>

          {/* Direct URL Option */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Or Paste Image URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={gallerySelectedUrl}
                onChange={(e) => setGallerySelectedUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono text-slate-700"
              />
              {gallerySelectedUrl && (
                <button
                  type="button"
                  onClick={() => setGallerySelectedUrl('')}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer with Live Preview & Apply */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {gallerySelectedUrl ? (
              <>
                <img 
                  src={gallerySelectedUrl} 
                  alt="Selected" 
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="hidden sm:block min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">Photo Selected</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block truncate">Ready to apply</span>
                </div>
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">No image chosen yet</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!gallerySelectedUrl}
              onClick={() => {
                if (gallerySelectedUrl && galleryCallback) {
                  galleryCallback(gallerySelectedUrl);
                }
              }}
              className="px-6 py-2 rounded-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold border-none cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
