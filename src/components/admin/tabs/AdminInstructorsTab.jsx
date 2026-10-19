import React, { useState } from 'react';
import { 
  GraduationCap, 
  Save, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Image as ImageIcon, 
  Camera, 
  Upload, 
  Check, 
  Users, 
  RotateCcw, 
  X 
} from 'lucide-react';

export default function AdminInstructorsTab({
  instructors,
  setInstructors,
  persistAll,
  triggerToast,
  handleDeviceFileUpload,
  openGalleryModal
}) {
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [isDraggingTeacherPhoto, setIsDraggingTeacherPhoto] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    badge: '',
    designation: 'INSTRUCTOR',
    bio: '',
    image: 'https://assets.codervai.com/teachers/1781366052322-cropped-image.webp',
    yt: ''
  });

  const handleAddTeacher = (e) => {
    e.preventDefault();
    if (!newTeacher.name) return;
    const item = { id: Date.now(), ...newTeacher };
    const updated = [...instructors, item];
    setInstructors(updated);
    persistAll({ instructors: updated });
    setNewTeacher({ name: '', badge: '', designation: 'INSTRUCTOR', bio: '', image: 'https://assets.codervai.com/teachers/1781366052322-cropped-image.webp', yt: '' });
    setShowAddTeacherModal(false);
    triggerToast('👨‍🏫 Instructor added successfully!');
  };

  const handleMoveInstructor = (index, direction) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= instructors.length) return;
    const nextList = [...instructors];
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    setInstructors(nextList);
    persistAll({ instructors: nextList });
    triggerToast('Instructor order updated!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-purple-600" />
            Instructors & Faculty Directory ({instructors.length})
          </h2>
          <p className="text-xs text-slate-500">
            Manage instructor profiles, designations, photos, and academic qualifications.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              persistAll({ instructors });
              triggerToast('✅ All instructor profiles & faculty changes saved live!');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-xs border-none cursor-pointer transition-all shadow-md shadow-emerald-600/20 active:scale-95"
            title="Save all changes live"
          >
            <Save className="w-4 h-4" />
            <span>Save All Changes</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddTeacherModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-md shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" />
            Add New Instructor
          </button>

          {instructors.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you sure you want to delete all ${instructors.length} instructors? This action will immediately clear the faculty list.`)) {
                  setInstructors([]);
                  persistAll({ instructors: [] });
                  triggerToast('All instructors removed!');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition-all cursor-pointer"
              title="Clear all instructors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove All
            </button>
          )}
        </div>
      </div>

      {/* Instructors Directory */}
      {instructors.length === 0 ? (
        <div className="py-16 px-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/60 max-w-xl mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">কোনো ইন্সট্রাক্টর প্রোফাইল নেই</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            বর্তমানে কোনো ইন্সট্রাক্টর তালিকাভুক্ত নেই। আপনার প্ল্যাটফর্মের নতুন শিক্ষক বা মেন্টর যুক্ত করতে নিচের বাটনে ক্লিক করুন।
          </p>
          <button
            type="button"
            onClick={() => setShowAddTeacherModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Instructor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {instructors.map((inst, idx) => (
            <div 
              key={inst.id || idx} 
              className="bg-white rounded-3xl border border-slate-200/80 hover:border-purple-300 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md overflow-hidden group"
            >
              <div className="p-5 space-y-3.5">
                {/* Top Badges & Actions */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-purple-50 text-purple-700 border border-purple-200/60">
                    {inst.badge || 'FACULTY'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {typeof openGalleryModal === 'function' && (
                      <button
                        type="button"
                        onClick={() => openGalleryModal(inst.image, `Choose Photo for ${inst.name}`, 'Faculty', (newUrl) => {
                          const updated = instructors.map((item, i) => i === idx ? { ...item, image: newUrl } : item);
                          setInstructors(updated);
                          persistAll({ instructors: updated });
                        })}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200/60 cursor-pointer transition-all"
                        title="Choose or upload photo"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                        <span>Gallery</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveInstructor(idx, 'up')}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors border-none bg-transparent cursor-pointer"
                      title="Move Earlier"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={idx === instructors.length - 1}
                      onClick={() => handleMoveInstructor(idx, 'down')}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors border-none bg-transparent cursor-pointer"
                      title="Move Later"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove "${inst.name}" from faculty?`)) {
                          const updated = instructors.filter((_, i) => i !== idx);
                          setInstructors(updated);
                          persistAll({ instructors: updated });
                          triggerToast('Instructor removed!');
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border-none bg-transparent cursor-pointer"
                      title="Delete Instructor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Photo Avatar & Name / Role */}
                <div className="flex gap-3.5 items-start">
                  {/* Interactive Avatar with direct drag-and-drop & device upload */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: '92px' }}>
                    <div 
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file && typeof handleDeviceFileUpload === 'function') {
                          handleDeviceFileUpload(file, (newUrl) => {
                            const updated = instructors.map((item, i) => i === idx ? { ...item, image: newUrl } : item);
                            setInstructors(updated);
                            persistAll({ instructors: updated });
                          });
                        }
                      }}
                      style={{ width: '92px', height: '118px', minWidth: '92px', minHeight: '118px' }}
                      className="relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-purple-400 bg-slate-100 shadow-2xs group/avatar cursor-pointer transition-all"
                      title="Drag & drop image or click Change to upload from device"
                    >
                      <img 
                        src={inst.image} 
                        alt={inst.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                        className="group-hover/avatar:scale-105 transition-transform duration-200" 
                        onError={(e) => { e.currentTarget.src = '/default-avatar.png'; }}
                      />
                      
                      {/* Overlay file picker */}
                      <label className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 text-white cursor-pointer">
                        <Camera className="w-4 h-4 text-purple-200" />
                        <span className="text-[9px] font-bold">Change</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onClick={(e) => { e.target.value = ''; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && typeof handleDeviceFileUpload === 'function') {
                              handleDeviceFileUpload(file, (newUrl) => {
                                const updated = instructors.map((item, i) => i === idx ? { ...item, image: newUrl } : item);
                                setInstructors(updated);
                                persistAll({ instructors: updated });
                              });
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Quick Photo Actions under Avatar */}
                    <div className="flex items-center gap-1 w-full justify-center">
                      <label className="px-2 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200 cursor-pointer flex items-center gap-1 transition-all" title="Upload from Device">
                        <Upload className="w-2.5 h-2.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onClick={(e) => { e.target.value = ''; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && typeof handleDeviceFileUpload === 'function') {
                              handleDeviceFileUpload(file, (newUrl) => {
                                const updated = instructors.map((item, i) => i === idx ? { ...item, image: newUrl } : item);
                                setInstructors(updated);
                                persistAll({ instructors: updated });
                              });
                            }
                          }}
                        />
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Enter Image URL for ' + inst.name, inst.image);
                          if (url !== null && url.trim()) {
                            const updated = instructors.map((item, i) => i === idx ? { ...item, image: url.trim() } : item);
                            setInstructors(updated);
                            persistAll({ instructors: updated });
                            triggerToast('✅ Photo URL updated!');
                          }
                        }}
                        className="px-1.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold border border-slate-200 cursor-pointer"
                        title="Paste direct Image URL"
                      >
                        URL
                      </button>
                    </div>
                  </div>

                  {/* Name & Designation Inputs */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={inst.name}
                        placeholder="Instructor Name"
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = instructors.map((item, i) => i === idx ? { ...item, name: val } : item);
                          setInstructors(updated);
                          persistAll({ instructors: updated });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Designation</label>
                      <input
                        type="text"
                        value={inst.designation}
                        placeholder="e.g. FOUNDER & MENTOR"
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = instructors.map((item, i) => i === idx ? { ...item, designation: val } : item);
                          setInstructors(updated);
                          persistAll({ instructors: updated });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-amber-700 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio & Academic Background */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Academic Bio & College</label>
                  <textarea
                    rows={3}
                    value={inst.bio}
                    placeholder="e.g. Dhaka Medical College (MBBS)"
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = instructors.map((item, i) => i === idx ? { ...item, bio: val } : item);
                      setInstructors(updated);
                      persistAll({ instructors: updated });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 rounded-xl p-2.5 text-xs text-slate-700 outline-none resize-none leading-relaxed transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Card Footer Bar */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Faculty ID: #{idx + 1}
                  </span>
                  {typeof openGalleryModal === 'function' && (
                    <button
                      type="button"
                      onClick={() => openGalleryModal(inst.image, `Choose Photo for ${inst.name}`, 'Faculty', (newUrl) => {
                        const updated = instructors.map((item, i) => i === idx ? { ...item, image: newUrl } : item);
                        setInstructors(updated);
                        persistAll({ instructors: updated });
                      })}
                      className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Change Photo</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    persistAll({ instructors });
                    triggerToast(`✅ "${inst.name || 'Instructor'}" changes saved & published live!`);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs border-none cursor-pointer flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all"
                  title="Save this instructor"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Teacher */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Add Instructor / Mentor</h3>
                  <p className="text-[11px] text-slate-500">নতুন শিক্ষক বা মেন্টরের প্রোফাইল ও হাই-কোয়ালিটি ছবি যুক্ত করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddTeacherModal(false);
                  setIsDraggingTeacherPhoto(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-4">
              {/* Photo Upload Studio Box */}
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingTeacherPhoto(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingTeacherPhoto(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingTeacherPhoto(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && typeof handleDeviceFileUpload === 'function') {
                    handleDeviceFileUpload(file, (newUrl) => setNewTeacher(prev => ({ ...prev, image: newUrl })));
                  }
                }}
                className={`p-4 rounded-3xl border-2 transition-all duration-200 ${
                  isDraggingTeacherPhoto 
                    ? 'border-purple-500 bg-purple-50 scale-[1.01] shadow-lg shadow-purple-500/10' 
                    : 'border-dashed border-purple-200 hover:border-purple-300 bg-gradient-to-br from-purple-50/50 via-slate-50/50 to-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-[11px] uppercase tracking-wider font-extrabold text-purple-900 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-600" />
                    <span>শিক্ষকের ছবি (Faculty Photo)</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Full HD Supported</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                  {/* Photo Preview Container (3:4 Ratio for Portrait Faculty Photo) */}
                  <div className="relative group/pic shrink-0">
                    <div 
                      style={{ width: '104px', height: '138px' }} 
                      className="rounded-2xl overflow-hidden border-2 border-purple-200 bg-slate-100 shadow-md relative"
                    >
                      {newTeacher.image ? (
                        <img 
                          src={newTeacher.image} 
                          alt="Instructor Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                          className="transition-transform duration-300 group-hover/pic:scale-105" 
                          onError={(e) => {
                            e.currentTarget.src = '/default-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-50">
                          <Users className="w-8 h-8 text-slate-300" />
                          <span className="text-[10px] font-bold">No Photo</span>
                        </div>
                      )}

                      {/* Clickable Hover Overlay */}
                      <label 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs opacity-0 group-hover/pic:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white cursor-pointer"
                        title="Click to choose from device"
                      >
                        <Camera className="w-5 h-5 text-purple-200" />
                        <span className="text-[10px] font-bold">Change</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onClick={(e) => { e.target.value = ''; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && typeof handleDeviceFileUpload === 'function') {
                              handleDeviceFileUpload(file, (newUrl) => setNewTeacher(prev => ({ ...prev, image: newUrl })));
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                      3:4 Portrait
                    </div>
                  </div>

                  {/* Actions & File Pickers */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex flex-wrap gap-2">
                      {/* Direct Device Upload Button */}
                      <label className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-sm shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Upload className="w-4 h-4" />
                        <span>Device থেকে ছবি দিন</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onClick={(e) => { e.target.value = ''; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && typeof handleDeviceFileUpload === 'function') {
                              handleDeviceFileUpload(file, (newUrl) => setNewTeacher(prev => ({ ...prev, image: newUrl })));
                            }
                          }}
                        />
                      </label>

                      {/* Choose from Gallery */}
                      {typeof openGalleryModal === 'function' && (
                        <button
                          type="button"
                          onClick={() => openGalleryModal(newTeacher.image, 'Choose Instructor Photo', 'Faculty', (newUrl) => {
                            setNewTeacher(prev => ({ ...prev, image: newUrl }));
                          })}
                          className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs hover:border-purple-300"
                          title="Select from platform gallery"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                          <span>Gallery</span>
                        </button>
                      )}

                      {/* Reset / Clear photo button */}
                      {newTeacher.image && (
                        <button
                          type="button"
                          onClick={() => setNewTeacher(prev => ({ ...prev, image: '/default-avatar.png' }))}
                          className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-semibold border border-slate-200 cursor-pointer transition-colors"
                          title="Use default avatar"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-tight">
                      ফোন বা কম্পিউটার থেকে সরাসরি ছবি নির্বাচন করুন অথবা ড্র্যাগ করে আনুন। ছবি স্বয়ংক্রিয়ভাবে <strong className="text-purple-700">ফুল হাই কোয়ালিটিতে</strong> প্রসেস হবে।
                    </p>

                    {/* Direct Image URL input option */}
                    <div className="pt-1 border-t border-purple-100/60">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        বা ছবির ডিরেক্ট লিংক (URL) পেস্ট করুন:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="url"
                          placeholder="https://example.com/teacher-photo.jpg"
                          value={newTeacher.image}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, image: e.target.value }))}
                          className="w-full bg-white border border-slate-200 focus:bg-white focus:border-purple-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all font-mono"
                        />
                        {newTeacher.image && (
                          <button
                            type="button"
                            onClick={() => setNewTeacher(prev => ({ ...prev, image: '' }))}
                            className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg border-none cursor-pointer shrink-0 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Instructor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Dr. Sazzad Hossain"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value, badge: e.target.value.split(' ')[0] })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-500 transition-all shadow-2xs"
                />
              </div>

              {/* Designation */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Designation / Role</label>
                <input
                  type="text"
                  placeholder="যেমন: FOUNDER & BIOLOGY MENTOR"
                  value={newTeacher.designation}
                  onChange={(e) => setNewTeacher({ ...newTeacher, designation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-500 transition-all shadow-2xs"
                />
              </div>

              {/* Bio & Academic Background */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Short Bio & Academic Background</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: Dhaka Medical College (MBBS)"
                  value={newTeacher.bio}
                  onChange={(e) => setNewTeacher({ ...newTeacher, bio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-500 transition-all resize-none shadow-2xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Save Instructor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
