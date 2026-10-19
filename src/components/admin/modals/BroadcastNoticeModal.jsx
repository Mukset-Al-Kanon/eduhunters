import React from 'react';
import { Bell, X } from 'lucide-react';

export default function BroadcastNoticeModal({
  isOpen,
  onClose,
  noticeTargetBatch,
  setNoticeTargetBatch,
  noticeText,
  setNoticeText,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Send Batch Notice & SMS Broadcast</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Batch or Group</label>
            <select 
              value={noticeTargetBatch}
              onChange={(e) => setNoticeTargetBatch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-amber-500 font-bold"
            >
              <option value="All Students">All Active Batches (All Students)</option>
              <option value="Medical 25 Batch">Medical 25 Exam Batch</option>
              <option value="HSC 26 Combo Batch">HSC 26 Combo Batch</option>
              <option value="HSC 27 Series">HSC 27 Series</option>
              <option value="HSC 28 Batch">HSC 28 Batch</option>
              <option value="Engineering Batch">Engineering Special Batch</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notice Message (SMS & App Notification) *</label>
            <textarea 
              required
              rows={4}
              placeholder="e.g. Dear students, Biology Live Class begins tonight at 9:00 PM. Please connect via Zoom or the App."
              value={noticeText}
              onChange={(e) => setNoticeText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-amber-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 border-none cursor-pointer shadow-md shadow-amber-600/20"
            >
              Send Broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
