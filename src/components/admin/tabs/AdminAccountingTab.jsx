import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Plus,
  Search,
  DollarSign,
  Check,
  X,
  Edit2,
  Copy,
  MessageCircle,
  Trash2,
  Clock
} from 'lucide-react';
import { formatOrderDateTime, getTransactionTimestamp } from '../adminHelpers';

export default function AdminAccountingTab({
  accountingTotals = { totalRevenue: 0, totalExpenses: 0, netProfit: 0 },
  accounting = { transactions: [] },
  filteredTransactions = [],
  pendingCount = 0,
  searchTrx = '',
  setSearchTrx,
  trxFilter = 'ALL',
  setTrxFilter,
  handleResetAccountingTotals,
  setShowAddTrxModal,
  handleOpenStudentFromTrx,
  handleSaveTrxAmount,
  handleApproveTrx,
  handleRevokeTrx,
  handleDeleteTrx,
  handleCopyText
}) {
  const [internalEditingId, setInternalEditingId] = useState(null);
  const [internalEditingVal, setInternalEditingVal] = useState('');

  // Chronological transaction & enrollment serial number mapping:
  // The very first transaction (earliest timestamp) gets #1.
  // Each subsequent transaction gets an incremented serial (#2, #3, ... #N).
  // The table is sorted newest-first (with pending requests at the top),
  // so the latest request displays the highest serial at the top,
  // while the oldest transaction displays #1 at the bottom.
  const txSerialMap = useMemo(() => {
    const allSource = [
      ...(Array.isArray(accounting?.transactions) ? accounting.transactions : []),
      ...(Array.isArray(filteredTransactions) ? filteredTransactions : [])
    ];
    const seen = new Set();
    const unique = [];

    allSource.forEach(tx => {
      if (!tx) return;
      const key = (tx.id || tx.orderId || tx.trxId || '').toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        unique.push(tx);
      }
    });

    // Sort CHRONOLOGICALLY ASCENDING: Oldest first -> index 0 gets serial 1
    unique.sort((a, b) => {
      const timeA = getTransactionTimestamp(a);
      const timeB = getTransactionTimestamp(b);
      if (timeA !== timeB) return timeA - timeB;
      const dateA = a.createdAt || a.date || '';
      const dateB = b.createdAt || b.date || '';
      if (dateA !== dateB) return String(dateA).localeCompare(String(dateB));
      const idA = a.id || a.orderId || '';
      const idB = b.id || b.orderId || '';
      return String(idA).localeCompare(String(idB));
    });

    const map = new Map();
    unique.forEach((tx, idx) => {
      const serial = idx + 1;
      if (tx.id) map.set(String(tx.id), serial);
      if (tx.orderId) map.set(String(tx.orderId), serial);
      if (tx.trxId && tx.trxId !== 'PENDING') map.set(String(tx.trxId).toLowerCase().trim(), serial);
      if (tx.invoiceNumber && tx.invoiceNumber !== 'INV-EH') map.set(String(tx.invoiceNumber).toLowerCase().trim(), serial);
    });

    return map;
  }, [accounting?.transactions, filteredTransactions]);

  const getTxSerial = (tx, fallbackIdx) => {
    if (!tx) return fallbackIdx + 1;
    const idKey = tx.id ? String(tx.id) : null;
    const orderIdKey = tx.orderId ? String(tx.orderId) : null;
    const trxIdKey = (tx.trxId && tx.trxId !== 'PENDING') ? String(tx.trxId).toLowerCase().trim() : null;
    const invKey = (tx.invoiceNumber && tx.invoiceNumber !== 'INV-EH') ? String(tx.invoiceNumber).toLowerCase().trim() : null;

    return (
      (idKey && txSerialMap.get(idKey)) ||
      (orderIdKey && txSerialMap.get(orderIdKey)) ||
      (trxIdKey && txSerialMap.get(trxIdKey)) ||
      (invKey && txSerialMap.get(invKey)) ||
      (fallbackIdx + 1)
    );
  };

  const onStartEdit = (tx) => {
    setInternalEditingId(tx.id);
    setInternalEditingVal(String(tx.amount || 0));
  };

  const onSaveEdit = (txId) => {
    if (typeof handleSaveTrxAmount === 'function') {
      handleSaveTrxAmount(txId, internalEditingVal);
    }
    setInternalEditingId(null);
  };

  const onCancelEdit = () => {
    setInternalEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
          Financial Register & Ledger
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetAccountingTotals}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer transition-all active:scale-95 shrink-0"
            title="পূর্বের ট্রানজ্যাকশন ও শিক্ষার্থীদের এক্সেস অপরিবর্তিত রেখে সামারি হিসাব ৳০ থেকে রিস্টার্ট করুন"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Summary (৳০)</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddTrxModal && setShowAddTrxModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs border-none cursor-pointer transition-all shadow-xs active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Summary Cards (Minimal, 2 Side-by-Side on Mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        <div 
          onClick={() => setTrxFilter && setTrxFilter('INCOME')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Total Income</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-none mt-3">
            ৳{accountingTotals.totalRevenue.toLocaleString()}
          </div>
        </div>

        <div 
          onClick={() => setTrxFilter && setTrxFilter('EXPENSE')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Total Expenses</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight leading-none mt-3">
            ৳{accountingTotals.totalExpenses.toLocaleString()}
          </div>
        </div>

        <div 
          onClick={() => setTrxFilter && setTrxFilter('ALL')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <span className="text-xs sm:text-sm font-bold text-slate-500 truncate">Net Profit</span>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight leading-none mt-3">
            ৳{accountingTotals.netProfit.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTrx}
            onChange={(e) => setSearchTrx && setSearchTrx(e.target.value)}
            placeholder="Search student, phone, TrxID..."
            className="w-full bg-[#f4f6fa] border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-slate-400 transition-all font-medium placeholder:text-slate-400"
          />
          {searchTrx && (
            <button
              type="button"
              onClick={() => setSearchTrx && setSearchTrx('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-transparent border-none cursor-pointer p-0.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills Bar (Scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setTrxFilter && setTrxFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all whitespace-nowrap ${
              trxFilter === 'ALL' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All ({accounting.transactions?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setTrxFilter && setTrxFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
              trxFilter === 'PENDING' 
                ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' 
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${trxFilter === 'PENDING' ? 'bg-white text-amber-800' : 'bg-amber-500 text-white'}`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTrxFilter && setTrxFilter('INCOME')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all whitespace-nowrap ${
              trxFilter === 'INCOME' 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setTrxFilter && setTrxFilter('EXPENSE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all whitespace-nowrap ${
              trxFilter === 'EXPENSE' 
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Expenses
          </button>
        </div>
      </div>

      {/* Ledger Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 p-8">
            <DollarSign className="w-9 h-9 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No transactions found</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTrx ? `No results matching "${searchTrx}"` : 'No transactions match the selected filter.'}
            </p>
            {searchTrx && (
              <button
                type="button"
                onClick={() => setSearchTrx && setSearchTrx('')}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 cursor-pointer"
              >
                Reset Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* MOBILE VIEW (< md): Clean Touch-Friendly Cards */}
            <div className="md:hidden p-3 space-y-3">
              {filteredTransactions.map((tx, idx) => {
                const isIncome = tx.type === 'INCOME';
                const isPending = tx.status === 'Pending';
                const isCompleted = tx.status === 'Completed';

                return (
                  <div 
                    key={tx.id} 
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-2.5 transition-all"
                  >
                    {/* Row 1: Student / Description, Type Badge, Amount */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div 
                          className="font-bold text-slate-900 text-sm truncate cursor-pointer hover:text-[#5d5bf6] transition-colors"
                          onClick={() => handleOpenStudentFromTrx && handleOpenStudentFromTrx(tx)}
                          title="Click to view full student details"
                        >
                          {tx.studentName || tx.customer || 'Direct Ledger Entry'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {tx.itemTitle || tx.category || 'General Ledger Entry'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {internalEditingId === tx.id ? (
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            <input
                              type="number"
                              value={internalEditingVal}
                              onChange={(e) => setInternalEditingVal(e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-xs font-bold border border-[#5d5bf6] rounded-md bg-white text-slate-800"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => onSaveEdit(tx.id)}
                              className="p-1 rounded-md bg-emerald-600 text-white cursor-pointer border-none"
                              title="Save"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={onCancelEdit}
                              className="p-1 rounded-md bg-slate-200 text-slate-600 cursor-pointer border-none"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end">
                            <div className={`font-black text-base leading-tight ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isIncome ? `+৳${(tx.amount || 0).toLocaleString()}` : `-৳${(tx.amount || 0).toLocaleString()}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => onStartEdit(tx)}
                              className="p-0.5 text-slate-400 hover:text-[#5d5bf6] bg-transparent border-none cursor-pointer"
                              title="Edit Amount"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          <span className="font-bold text-slate-500">#{getTxSerial(tx, idx)}</span> · {formatOrderDateTime(tx.createdAt || tx.date).full}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Method · TrxID · Phone */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl font-medium">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-slate-700">{tx.method || 'Cash'}</span>
                        {tx.trxId && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono text-slate-600 truncate max-w-[120px]">{tx.trxId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText && handleCopyText(tx.trxId, 'trxId')}
                              className="p-0.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                              title="Copy TrxID"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                      {tx.studentPhone && (() => {
                        const cleanDigits = (tx.studentPhone || '').replace(/[^0-9]/g, '');
                        const waPhone = cleanDigits.startsWith('880') ? cleanDigits : (cleanDigits.startsWith('0') ? '88' + cleanDigits : ('880' + cleanDigits));
                        return (
                          <div className="flex items-center gap-1 shrink-0 font-mono text-slate-700">
                            <span>{tx.studentPhone}</span>
                            {cleanDigits.length >= 6 && (
                              <a
                                href={`https://wa.me/${waPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chat on WhatsApp"
                                className="text-emerald-600 hover:text-emerald-700 p-0.5 inline-flex items-center"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Row 3: Status Badge & Minimal Actions */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border ${
                        isPending
                          ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                        }`} />
                        <span>{isCompleted ? 'Approved' : 'Pending'}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        {tx.status !== 'Completed' ? (
                          <button
                            type="button"
                            onClick={() => handleApproveTrx && handleApproveTrx(tx.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer border-none active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevokeTrx && handleRevokeTrx(tx.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer border-none active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Revoke</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteTrx && handleDeleteTrx(tx.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer bg-white"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW (>= md): Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[11px] tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Student / Description</th>
                    <th className="py-3 px-4">Course / Product</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Payment TrxID</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTransactions.map((tx, txIdx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">#{getTxSerial(tx, txIdx)}</td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {(() => {
                          const dt = formatOrderDateTime(tx.createdAt || tx.date);
                          return (
                            <div>
                              <div className="font-semibold text-slate-800">{dt.date}</div>
                              {dt.time && (
                                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{dt.time}</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const cleanDigits = (tx.studentPhone || '').replace(/[^0-9]/g, '');
                          const waPhone = cleanDigits.startsWith('880') ? cleanDigits : (cleanDigits.startsWith('0') ? '88' + cleanDigits : ('880' + cleanDigits));
                          return (
                            <div>
                              <div 
                                className="font-bold text-slate-900 cursor-pointer hover:text-[#5d5bf6] transition-colors"
                                onClick={() => handleOpenStudentFromTrx && handleOpenStudentFromTrx(tx)}
                                title="Click to view full student details"
                              >
                                {tx.studentName}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                <span className="font-mono">{tx.studentPhone}</span>
                                {cleanDigits.length >= 6 && (
                                  <a
                                    href={`https://wa.me/${waPhone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Chat on WhatsApp"
                                    className="text-emerald-600 hover:text-emerald-700 p-0.5 inline-flex items-center"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 font-medium max-w-[200px] truncate text-slate-800" title={tx.itemTitle}>
                        {tx.itemTitle}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {tx.trxId && tx.trxId !== 'PENDING' && tx.trxId !== 'PENDING_VERIFICATION' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">{tx.trxId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText && handleCopyText(tx.trxId, 'trxId')}
                              className="p-1 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                              title="Copy TrxID"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        }`}>
                          {tx.status === 'Completed' ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-sm whitespace-nowrap">
                        {internalEditingId === tx.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400 text-xs font-bold">৳</span>
                            <input
                              type="number"
                              value={internalEditingVal}
                              onChange={(e) => setInternalEditingVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') onSaveEdit(tx.id);
                                if (e.key === 'Escape') onCancelEdit();
                              }}
                              className="w-20 px-2 py-1 text-xs font-bold border border-[#5d5bf6] rounded-md focus:outline-none bg-white text-slate-800"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => onSaveEdit(tx.id)}
                              className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer border-none"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={onCancelEdit}
                              className="p-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-600 cursor-pointer border-none"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 group">
                            <span className={tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}>
                              {tx.type === 'INCOME' ? `+৳${(tx.amount || 0).toLocaleString()}` : `-৳${(tx.amount || 0).toLocaleString()}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => onStartEdit(tx)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-[#5d5bf6] transition-opacity cursor-pointer border-none"
                              title="Edit Amount"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {tx.status !== 'Completed' ? (
                            <button
                              type="button"
                              onClick={() => handleApproveTrx && handleApproveTrx(tx.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs border-none cursor-pointer transition-all active:scale-95"
                              title="Approve Enrollment"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRevokeTrx && handleRevokeTrx(tx.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs border-none cursor-pointer transition-all active:scale-95"
                              title="Revoke Approval & Lock Access"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Revoke</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteTrx && handleDeleteTrx(tx.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 border-none bg-transparent cursor-pointer transition-colors"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
