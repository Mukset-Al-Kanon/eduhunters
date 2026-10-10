// src/components/InvoiceModal.jsx
// Very Clean, Minimal, Classic & Monochromatic Invoice for Edu Hunters

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function InvoiceModal({ order, isOpen, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key & scroll locking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) handleSmoothClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSmoothClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 180);
  };

  if (!shouldRender || !order) return null;

  const formatBDT = (amount) => {
    const num = Number(amount) || 0;
    return `৳${num.toLocaleString('en-US')}`;
  };

  const formatInvoiceDate = (dateString) => {
    try {
      const d = dateString ? new Date(dateString) : new Date();
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Oct 05, 2026';
    }
  };

  const invoiceNumber = order.invoiceNumber || `INV-2026-${(order.id || '9842').replace(/\D/g, '').slice(-6) || '984201'}`;
  const issueDate = formatInvoiceDate(order.createdAt);
  const customerName = order.customer?.name || order.fullName || 'Student';
  const customerPhone = order.customer?.phone || order.phone || '';
  const customerEmail = order.customer?.email || '';

  const paymentGateway = (order.paymentGateway || 'bKash').toLowerCase();
  const paymentName = paymentGateway.includes('nagad') 
    ? 'Nagad' 
    : paymentGateway.includes('card') 
      ? 'Card' 
      : paymentGateway === 'free' 
        ? 'Free' 
        : 'bKash';
  const transactionId = order.transactionId || '';

  const itemTitle = order.course?.name || order.bundle?.name || (order.items && order.items[0]?.title) || (order.items && order.items[0]?.book?.name) || 'Course Enrollment';
  const totalPaid = Number(order.totalPaid) || 0;
  const subtotal = Number(order.subtotal) || totalPaid;
  const discount = Number(order.discount) || (subtotal > totalPaid ? subtotal - totalPaid : 0);

  return (
    <>
      {/* Global CSS for Pristine Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #eh-invoice-paper, #eh-invoice-paper * {
            visibility: visible !important;
          }
          #eh-invoice-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/80 backdrop-blur-sm transition-opacity duration-200">
        <div 
          className="fixed inset-0" 
          onClick={handleSmoothClose} 
          aria-hidden="true" 
        />

        <div className="min-h-full flex items-center justify-center p-4 sm:p-6 relative pointer-events-none">
          {/* Modal Container */}
          <div 
            className={`relative w-full max-w-xl z-10 pointer-events-auto transition-all duration-200 flex flex-col items-center my-6 ${
              isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {/* Action Bar (Close) */}
            <div className="no-print w-full flex items-center justify-end mb-3">
              <button
                type="button"
                onClick={handleSmoothClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pristine Clean & Minimal Invoice Sheet */}
            <div 
              id="eh-invoice-paper"
              className="w-full bg-white text-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/80 p-8 sm:p-10 font-sans"
            >
              {/* Header: Logo & Invoice # */}
              <div className="flex items-start justify-between gap-4 pb-6 border-b border-zinc-200">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-zinc-950">
                    Edu Hunters
                  </h1>
                  <p className="text-xs text-zinc-500 mt-0.5">eduhunters.com.bd</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-900 border border-zinc-200 uppercase tracking-wider mb-1.5">
                    Paid
                  </span>
                  <p className="font-mono text-xs font-semibold text-zinc-950">{invoiceNumber}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{issueDate}</p>
                </div>
              </div>

              {/* Billed To & Payment Method (Clean 2-Column) */}
              <div className="grid grid-cols-2 gap-6 py-6 border-b border-zinc-100 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Billed To
                  </span>
                  <p className="font-semibold text-zinc-900 text-sm">{customerName}</p>
                  {customerPhone && <p className="text-zinc-600 mt-0.5">{customerPhone}</p>}
                  {customerEmail && <p className="text-zinc-600">{customerEmail}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                    Payment Method
                  </span>
                  <p className="font-semibold text-zinc-900">{paymentName}</p>
                  {transactionId && (
                    <p className="font-mono text-zinc-500 text-[11px] mt-0.5">
                      TrxID: {transactionId}
                    </p>
                  )}
                </div>
              </div>

              {/* Item & Price */}
              <div className="py-6">
                <div className="flex items-start justify-between gap-4 py-2">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-zinc-900 text-sm leading-snug">
                      {itemTitle}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">Full platform access</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-zinc-900 text-sm">
                      {formatBDT(subtotal)}
                    </p>
                  </div>
                </div>

                {/* Subtotal / Discount / Total Ledger */}
                <div className="pt-4 mt-4 border-t border-zinc-100 space-y-1.5 text-xs">
                  {discount > 0 && (
                    <>
                      <div className="flex justify-between text-zinc-500">
                        <span>Subtotal</span>
                        <span>{formatBDT(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>Discount</span>
                        <span>- {formatBDT(discount)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-baseline pt-3 border-t border-zinc-200">
                    <span className="font-bold text-zinc-950 text-sm">Amount Paid</span>
                    <span className="font-bold text-zinc-950 text-lg font-mono">
                      {formatBDT(totalPaid)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Minimal Single-line Footer */}
              <div className="pt-6 border-t border-zinc-100 text-center text-xs text-zinc-400">
                Thank you for learning with us.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
