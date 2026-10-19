import React, { useState } from 'react';
import { Sliders, Plus, ArrowUp, ArrowDown, Upload, Trash2, X } from 'lucide-react';

export default function AdminSlidesTab({
  heroSlides,
  setHeroSlides,
  persistAll,
  triggerToast,
  handleDeviceFileUpload
}) {
  const [showAddSlideModal, setShowAddSlideModal] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState(null);
  const [newSlide, setNewSlide] = useState({
    title: '',
    image: '',
    link: '/courses',
    type: 'course'
  });

  const handleDeleteSlide = (indexToDelete) => {
    const target = heroSlides[indexToDelete];
    const updated = heroSlides.filter((_, i) => i !== indexToDelete);
    setHeroSlides(updated);
    persistAll({ heroSlides: updated });
    setSlideToDelete(null);
    triggerToast(`🗑️ "${target?.title || 'Slide'}" মুছে ফেলা হয়েছে!`);
  };

  const handleAddSlide = (e) => {
    e.preventDefault();
    if (!newSlide.title) {
      triggerToast('Please enter a banner title');
      return;
    }
    if (!newSlide.image) {
      triggerToast('Please select a banner image from your device');
      return;
    }
    const item = { id: Date.now(), ...newSlide };
    const updated = [item, ...heroSlides];
    setHeroSlides(updated);
    persistAll({ heroSlides: updated });
    setNewSlide({ title: '', image: '', link: '/courses', type: 'course' });
    setShowAddSlideModal(false);
    triggerToast('🎡 Hero slide added successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            Hero Carousel Slider ({heroSlides.length})
          </h2>
          <p className="text-xs text-slate-500">
            Manage top promotional banners, titles, and action links on the homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddSlideModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Add New Slide
        </button>
      </div>

      {/* Slider Grid */}
      {heroSlides.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 sm:p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Sliders className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">কোনো স্লাইড যোগ করা নেই</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            হোমপেজের টপ স্লাইডার ব্যানারে নতুন স্লাইড যোগ করতে উপরের "Add New Slide" বাটনে ক্লিক করুন।
          </p>
          <button
            type="button"
            onClick={() => setShowAddSlideModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            নতুন স্লাইড যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {heroSlides.map((slide, idx) => (
            <div key={slide.id || idx} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow">
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer?.files?.[0];
                  if (file && typeof handleDeviceFileUpload === 'function') {
                    handleDeviceFileUpload(file, (url) => {
                      const updated = heroSlides.map((s, i) => i === idx ? { ...s, image: url } : s);
                      setHeroSlides(updated);
                      persistAll({ heroSlides: updated });
                    });
                  }
                }}
                className="relative aspect-[3.6/1.5] bg-slate-100 overflow-hidden"
              >
                <img 
                  src={slide.image} 
                  alt={slide.title} 
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = "https://assets.codervai.com/banners/1781465730213-cropped-image.webp";
                  }}
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 shadow-2xs">
                    Slide #{idx + 1}
                  </span>
                </div>

                {/* Reorder Buttons Overlay */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      if (idx === 0) return;
                      const copy = [...heroSlides];
                      const temp = copy[idx];
                      copy[idx] = copy[idx - 1];
                      copy[idx - 1] = temp;
                      setHeroSlides(copy);
                      persistAll({ heroSlides: copy });
                    }}
                    className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 disabled:opacity-40 flex items-center justify-center border-none shadow-xs cursor-pointer transition-transform hover:scale-105"
                    title="Move Left / Earlier"
                  >
                    <ArrowUp className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === heroSlides.length - 1}
                    onClick={() => {
                      if (idx === heroSlides.length - 1) return;
                      const copy = [...heroSlides];
                      const temp = copy[idx];
                      copy[idx] = copy[idx + 1];
                      copy[idx + 1] = temp;
                      setHeroSlides(copy);
                      persistAll({ heroSlides: copy });
                    }}
                    className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 disabled:opacity-40 flex items-center justify-center border-none shadow-xs cursor-pointer transition-transform hover:scale-105"
                    title="Move Right / Later"
                  >
                    <ArrowDown className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">Banner Title</label>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = heroSlides.map((s, i) => i === idx ? { ...s, title: val } : s);
                      setHeroSlides(updated);
                      persistAll({ heroSlides: updated });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-500 font-semibold">Banner Image (Drag & Drop or Pick)</label>
                    <label className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Select Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && typeof handleDeviceFileUpload === 'function') {
                            handleDeviceFileUpload(file, (url) => {
                              const updated = heroSlides.map((s, i) => i === idx ? { ...s, image: url } : s);
                              setHeroSlides(updated);
                              persistAll({ heroSlides: updated });
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={slide.image}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = heroSlides.map((s, i) => i === idx ? { ...s, image: val } : s);
                      setHeroSlides(updated);
                      persistAll({ heroSlides: updated });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">Action Link URL</label>
                  <input
                    type="text"
                    value={slide.link}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = heroSlides.map((s, i) => i === idx ? { ...s, link: val } : s);
                      setHeroSlides(updated);
                      persistAll({ heroSlides: updated });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-600 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                  {/* Quick Link Presets */}
                  <div className="flex items-center gap-1 flex-wrap mt-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                    {['/courses', '/exams', '/exams?category=medical', '/exams?category=sureshot', '/store', '/bundles'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const updated = heroSlides.map((s, i) => i === idx ? { ...s, link: preset } : s);
                          setHeroSlides(updated);
                          persistAll({ heroSlides: updated });
                        }}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono transition-colors border-none cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Type: <span className="text-blue-600">{slide.type || 'banner'}</span>
                </span>
                {slideToDelete === idx ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <span className="text-[11px] text-rose-600 font-bold mr-0.5">মুছবেন?</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(idx)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-colors border-none cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                      মুছুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideToDelete(null)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold rounded-lg transition-colors border-none cursor-pointer"
                    >
                      বাতিল
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSlideToDelete(idx)}
                    className="text-slate-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer p-0 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Slide */}
      {showAddSlideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Hero Banner Slide</h3>
                  <p className="text-[11px] text-slate-500">Add promotional slide to homepage carousel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSlideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSlide} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Banner Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HSC 26 Special Mega Batch"
                  value={newSlide.title}
                  onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Banner Image</label>
                {newSlide.image ? (
                  <div className="relative aspect-[3.2/1.4] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs">
                    <img src={newSlide.image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 rounded-full bg-white text-slate-800 text-xs font-bold cursor-pointer hover:bg-slate-100 transition-colors shadow-md">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && typeof handleDeviceFileUpload === 'function') {
                              handleDeviceFileUpload(file, (url) => setNewSlide(prev => ({ ...prev, image: url })));
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewSlide(prev => ({ ...prev, image: '' }))}
                        className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold border-none cursor-pointer hover:bg-rose-700 transition-colors shadow-md"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center group">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors block">
                        Select Photo from Device
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Click to browse device gallery (JPG, PNG, WebP)
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && typeof handleDeviceFileUpload === 'function') {
                          handleDeviceFileUpload(file, (url) => setNewSlide(prev => ({ ...prev, image: url })));
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Action Link</label>
                <input
                  type="text"
                  placeholder="/courses"
                  value={newSlide.link}
                  onChange={(e) => setNewSlide({ ...newSlide, link: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSlideModal(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-rose-500/20 transition-all"
                >
                  Add Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
