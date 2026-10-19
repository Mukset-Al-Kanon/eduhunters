import React from 'react';
import { DollarSign, X } from 'lucide-react';

export default function AddTransactionModal({
  isOpen,
  onClose,
  newTrx,
  setNewTrx,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Transaction</h3>
              <p className="text-[11px] text-slate-500">Record a new income or expense entry</p>
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
            <label className="text-xs font-bold text-slate-700 block mb-1">Transaction Type</label>
            <select
              value={newTrx.type}
              onChange={(e) => setNewTrx({ ...newTrx, type: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
            >
              <option value="INCOME">Income (Student Course Fee / PDF Purchase)</option>
              <option value="EXPENSE">Expense (Server Hosting, CDN, Marketing)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Student Name / Details</label>
            <input
              type="text"
              required
              placeholder="e.g. Md. Sakib Hossain"
              value={newTrx.studentName}
              onChange={(e) => setNewTrx({ ...newTrx, studentName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Course or Item Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Medical Exam Batch"
              value={newTrx.itemTitle}
              onChange={(e) => setNewTrx({ ...newTrx, itemTitle: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Amount (৳)</label>
              <input
                type="number"
                required
                placeholder="1200"
                value={newTrx.amount}
                onChange={(e) => setNewTrx({ ...newTrx, amount: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={newTrx.method}
                onChange={(e) => setNewTrx({ ...newTrx, method: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
              >
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number (Optional)</label>
              <input
                type="text"
                placeholder="01700-000000"
                value={newTrx.studentPhone}
                onChange={(e) => setNewTrx({ ...newTrx, studentPhone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">TrxID / Voucher No.</label>
              <input
                type="text"
                placeholder="9KJ34LA01X"
                value={newTrx.trxId}
                onChange={(e) => setNewTrx({ ...newTrx, trxId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
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
              className="px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold border-none cursor-pointer shadow-md shadow-emerald-500/20 transition-all"
            >
              Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
