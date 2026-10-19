import React from 'react';
import { ShieldCheck, X, Copy, Check, Edit2, Sparkles } from 'lucide-react';

export default function TransactionDetailsModal({
  selectedTxDetails,
  onClose,
  handleCopyText,
  copiedTrxId,
  editingTrxAmountId,
  setEditingTrxAmountId,
  editingTrxAmountVal,
  setEditingTrxAmountVal,
  handleSaveTrxAmount,
  handleRejectTrx,
  handleApproveAndEnrollStudent
}) {
  if (!selectedTxDetails) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Transaction & Payment Verification
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                TrxID: {selectedTxDetails.trxId || 'N/A'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border border-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4.5 text-xs">
          {/* Highlighted TrxID & Amount Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Transaction ID (TrxID)
              </div>
              <div className="font-mono font-black text-base text-slate-900 tracking-wider select-all">
                {selectedTxDetails.trxId || 'N/A'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyText(selectedTxDetails.trxId, 'trxId')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                {copiedTrxId === selectedTxDetails.trxId ? (
                  <span className="text-emerald-600 font-black flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Copied
                  </span>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <div className="text-right pl-3 border-l border-slate-200">
                <div className="text-[10px] font-bold text-slate-400">Payment Amount</div>
                {editingTrxAmountId === selectedTxDetails.id ? (
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <span className="text-slate-400 text-xs font-bold">৳</span>
                    <input
                      type="number"
                      value={editingTrxAmountVal}
                      onChange={(e) => setEditingTrxAmountVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTrxAmount(selectedTxDetails.id);
                        if (e.key === 'Escape') setEditingTrxAmountId(null);
                      }}
                      className="w-20 px-2 py-0.5 text-xs font-bold border border-[#5d5bf6] rounded-md focus:outline-none bg-white text-slate-800"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveTrxAmount(selectedTxDetails.id)}
                      className="p-1 rounded-md bg-emerald-600 text-white cursor-pointer border-none"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTrxAmountId(null)}
                      className="p-1 rounded-md bg-slate-200 text-slate-600 cursor-pointer border-none"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 justify-end">
                    <div className="text-lg font-black text-emerald-600">
                      ৳{selectedTxDetails.amount}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTrxAmountId(selectedTxDetails.id);
                        setEditingTrxAmountVal(String(selectedTxDetails.amount || 0));
                      }}
                      className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-[#5d5bf6] transition-colors cursor-pointer border-none"
                      title="Edit Amount"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student & Course Info Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-0.5">Student Full Name</div>
              <div className="font-bold text-slate-800 text-sm">
                {selectedTxDetails.studentName || selectedTxDetails.customer || 'Not specified'}
              </div>
            </div>

            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-0.5">Mobile Phone Number</div>
              <div className="font-mono font-bold text-slate-800 flex items-center justify-between">
                <span>{selectedTxDetails.studentPhone || selectedTxDetails.phone || 'N/A'}</span>
                {(selectedTxDetails.studentPhone || selectedTxDetails.phone) && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(selectedTxDetails.studentPhone || selectedTxDetails.phone, 'phone')}
                    className="text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
                    title="Copy mobile number"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="col-span-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-0.5">Course or Exam Batch</div>
              <div className="font-bold text-pink-600 text-xs">
                {selectedTxDetails.itemTitle || selectedTxDetails.category || 'Course Enrollment'}
              </div>
            </div>

            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-0.5">Payment Method</div>
              <div className="font-bold text-slate-800 uppercase">
                {selectedTxDetails.method || 'Online'}
              </div>
            </div>

            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-0.5">Date & Timestamp</div>
              <div className="font-medium text-slate-700">
                {selectedTxDetails.date} {selectedTxDetails.time ? `• ${selectedTxDetails.time}` : ''}
              </div>
            </div>
          </div>

          {/* 3-Step Verification Checklist */}
          <div className="bg-blue-50/60 rounded-2xl p-3.5 border border-blue-100 text-slate-700 space-y-1.5">
            <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Verification Checklist</span>
            </div>
            <div className="text-[11px] space-y-1 text-slate-600">
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>1. Match TrxID in your bKash/Nagad app or SMS merchant statement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>2. Confirm received payment amount matches (৳{selectedTxDetails.amount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>3. Approving will automatically activate the student in the database</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
          >
            Close
          </button>

          {selectedTxDetails.status === 'Pending' && (
            <>
              <button
                type="button"
                onClick={() => {
                  handleRejectTrx(selectedTxDetails.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-colors"
              >
                ✕ Reject
              </button>

              <button
                type="button"
                onClick={() => {
                  handleApproveAndEnrollStudent(selectedTxDetails);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 border-none cursor-pointer transition-colors shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve & Enroll</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
