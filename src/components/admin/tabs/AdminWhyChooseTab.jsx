import React, { useState } from 'react';
import { HelpCircle, Plus, Trash2, X } from 'lucide-react';

export default function AdminWhyChooseTab({
  whyChooseUs,
  setWhyChooseUs,
  persistAll,
  triggerToast
}) {
  const [showAddWhyModal, setShowAddWhyModal] = useState(false);
  const [newWhyPoint, setNewWhyPoint] = useState({
    number: '05',
    title: '',
    desc: ''
  });

  const handleUpdateWhyPoint = (idx, field, value) => {
    const updated = whyChooseUs.map((item, i) => {
      if (i === idx) return { ...item, [field]: value };
      return item;
    });
    setWhyChooseUs(updated);
    persistAll({ whyChooseUs: updated });
  };

  const handleDeleteWhyPoint = (indexToDelete) => {
    const updated = whyChooseUs.filter((_, i) => i !== indexToDelete);
    setWhyChooseUs(updated);
    persistAll({ whyChooseUs: updated });
    triggerToast('🗑️ Card মুছে ফেলা হয়েছে!');
  };

  const handleAddWhyPoint = (e) => {
    e.preventDefault();
    if (!newWhyPoint.title.trim()) {
      alert('Card Title আবশ্যক!');
      return;
    }
    const updated = [...whyChooseUs, { ...newWhyPoint }];
    setWhyChooseUs(updated);
    persistAll({ whyChooseUs: updated });
    setShowAddWhyModal(false);
    setNewWhyPoint({
      number: String(updated.length + 1).padStart(2, '0'),
      title: '',
      desc: ''
    });
    triggerToast('✨ নতুন Why Choose Us Card যোগ করা হয়েছে!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-500" />
            Why Choose Us - Feature Cards
          </h2>
          <p className="text-xs text-slate-500">
            Add, edit, or remove feature cards displayed in the homepage 'Why Choose Us' section.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddWhyModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold border-none cursor-pointer shadow-md shadow-blue-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add New Card</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {whyChooseUs.map((card, idx) => (
          <div 
            key={idx}
            className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Card #</span>
                <input
                  type="text"
                  value={card.number}
                  onChange={(e) => handleUpdateWhyPoint(idx, 'number', e.target.value)}
                  className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-blue-600 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDeleteWhyPoint(idx)}
                title="Delete Card"
                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">Card Title</label>
              <input
                type="text"
                value={card.title}
                onChange={(e) => handleUpdateWhyPoint(idx, 'title', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Card Description</label>
              <textarea
                rows={2}
                value={card.desc}
                onChange={(e) => handleUpdateWhyPoint(idx, 'desc', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Why Card */}
      {showAddWhyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Why Choose Us Card</h3>
                  <p className="text-[11px] text-slate-500">Create a new key selling point card</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddWhyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWhyPoint} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Card Number (e.g. 05)</label>
                <input
                  type="text"
                  required
                  placeholder="05"
                  value={newWhyPoint.number}
                  onChange={(e) => setNewWhyPoint({ ...newWhyPoint, number: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Card Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Progress Tracking"
                  value={newWhyPoint.title}
                  onChange={(e) => setNewWhyPoint({ ...newWhyPoint, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Card Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Comprehensive mistake analysis and performance metrics after every exam."
                  value={newWhyPoint.desc}
                  onChange={(e) => setNewWhyPoint({ ...newWhyPoint, desc: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddWhyModal(false)}
                  className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-blue-500/20 transition-all"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
