import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Copy, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { saveNewOrder } from '../services/orderService';
import InvoiceModal from './InvoiceModal';
import TermsModal from './TermsModal';

export default function CheckoutModal({ bundle, course, onClose, onSuccess, siteSettings }) {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState('terms');

  const item = course || bundle || { 
    title: 'Course Enrollment', 
    price: 999, 
    salePrice: 999, 
    regularPrice: 1999, 
    originalPrice: 1999 
  };
  const price = item.salePrice || item.price || 999;
  const originalPrice = item.regularPrice || item.originalPrice || price * 2;

  const [studentName, setStudentName] = useState(() => currentUser?.displayName || currentUser?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(() => currentUser?.whatsapp || currentUser?.phone || currentUser?.phoneNumber || '');
  const [trxId, setTrxId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Synchronize student name and phone whenever currentUser updates
  useEffect(() => {
    if (currentUser) {
      if (!studentName) {
        setStudentName(currentUser.displayName || currentUser.name || '');
      }
      if (!phoneNumber && (currentUser.whatsapp || currentUser.phone || currentUser.phoneNumber)) {
        setPhoneNumber(currentUser.whatsapp || currentUser.phone || currentUser.phoneNumber);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      onClose();
      return;
    }
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 15);
    return () => clearTimeout(timer);
  }, [currentUser, onClose]);

  const handleSmoothClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 240);
  };

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleSmoothClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isClosing]);

  const bkashNumber = siteSettings?.bkashNumber || "01342227935";
  const nagadNumber = siteSettings?.nagadNumber || "01731127231";
  const activePaymentNumber = paymentMethod === 'bkash' ? bkashNumber : nagadNumber;
  const activeMethodLabel = paymentMethod === 'bkash' ? 'bKash' : 'Nagad';

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(activePaymentNumber.replace(/[^0-9]/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 11) {
      alert("Please enter a valid 11-digit mobile number");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      // Automatically persist order & invoice in Order History
      const finalStudentName = studentName || currentUser?.displayName || currentUser?.name || 'Enrolled Student';
      const finalPhone = phoneNumber || currentUser?.whatsapp || currentUser?.phone || 'N/A';
      const finalEmail = currentUser?.email || 'student@eduhunters.com.bd';
      const finalTrxId = trxId ? trxId.trim().toUpperCase() : 'PENDING_VERIFICATION';
      
      const newOrder = saveNewOrder({
        item,
        studentName: finalStudentName,
        studentPhone: finalPhone,
        studentEmail: finalEmail,
        paymentMethod: paymentMethod === 'bkash' ? 'bKash' : 'Nagad',
        trxId: finalTrxId,
        amount: price,
        originalPrice: originalPrice,
        discount: Math.max(0, originalPrice - price)
      });
      setCreatedOrder(newOrder);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 }
        });
      } catch (err) {}
      if (onSuccess) {
        onSuccess({
          itemTitle: item.title,
          amount: price,
          studentName: finalStudentName,
          studentPhone: finalPhone,
          method: paymentMethod === 'bkash' ? 'bKash' : 'Nagad',
          trxId: finalTrxId,
          orderId: newOrder.id,
          invoiceNumber: newOrder.invoiceNumber
        });
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-240 ease-out cursor-pointer ${
          isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleSmoothClose}
      />

      {/* Modal Dialog Card with Smooth Pop-up & Pop-out Animation */}
      <div 
        className={`relative w-full max-w-md my-auto flex flex-col rounded-3xl overflow-hidden z-10 border shadow-2xl transition-all duration-240 ${
          isOpen && !isClosing 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-2'
        } ${
          isDark 
            ? 'bg-[#120306] border-[#e11438]/25 text-white' 
            : 'bg-white border-gray-200 text-[#111827]'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header - Centered title without subtitle */}
        <div className={`relative px-6 py-5 border-b flex items-center justify-center ${
          isDark ? 'border-white/10' : 'border-gray-100'
        }`}>
          <h3 className={`text-base sm:text-lg font-black tracking-tight text-center ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Order Confirmation & Payment
          </h3>
          <button 
            type="button"
            onClick={handleSmoothClose}
            className={`absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer border-none hover:scale-110 active:scale-95 ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800'
            }`}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body with clean, comfortable spacing */}
        <div className="p-6 overflow-y-auto space-y-5 max-h-[calc(90vh-70px)]">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle size={30} />
              </div>
              <div>
                <h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Enrollment Request Successful!</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Thank you, <strong>{studentName || currentUser?.displayName || currentUser?.name || 'Student'}</strong>.{' '}
                  {trxId ? (
                    <>Your payment Transaction ID (<span className="font-mono text-emerald-500 font-bold">{trxId}</span>) has been submitted for verification.</>
                  ) : (
                    <>Your enrollment request has been submitted with number <span className="font-mono text-emerald-500 font-bold">{phoneNumber}</span> for instant verification.</>
                  )}
                </p>
              </div>

              <div className={`p-4 rounded-2xl border text-left text-xs space-y-1.5 ${
                isDark ? 'bg-white/[0.02] border-white/10 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'
              }`}>
                <div className="flex justify-between">
                  <span className="text-gray-400">Course / Item:</span>
                  <span className="font-bold text-right ml-2">{item.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone Number:</span>
                  <span className="font-mono font-bold">{phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount Paid:</span>
                  <span className="font-bold text-[#dc2626] dark:text-[#ff4d6d]">৳{price}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowInvoiceModal(true)}
                  className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs border cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5 ${
                    isDark 
                      ? 'bg-white hover:bg-zinc-100 text-zinc-950 border-white' 
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-900'
                  }`}
                >
                  <FileText size={15} />
                  <span>View Official Invoice</span>
                </button>
                <button 
                  type="button" 
                  onClick={handleSmoothClose}
                  className="flex-1 py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-xl font-bold text-xs border-none cursor-pointer shadow-md transition-all"
                >
                  Done & Continue
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Order Item Summary Card - Full title without truncation */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${
                isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/80 border-gray-100'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <h4 className={`text-sm sm:text-base font-black leading-snug flex-1 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {item.title}
                  </h4>
                  <div className="text-right shrink-0">
                    <span className="text-xl sm:text-2xl font-black text-[#dc2626] dark:text-[#ff4d6d]">
                      ৳{price}
                    </span>
                    {originalPrice > price && (
                      <span className="block text-[11px] text-gray-400 line-through font-medium">
                        ৳{originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('bkash')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'bkash'
                        ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-sm'
                        : isDark
                          ? 'bg-white/[0.02] text-gray-300 border-white/10 hover:border-white/20'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span>bKash</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('nagad')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'nagad'
                        ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-sm'
                        : isDark
                          ? 'bg-white/[0.02] text-gray-300 border-white/10 hover:border-white/20'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span>Nagad</span>
                  </button>
                </div>

                {/* Payment Number & Instruction Card - Clear separated box */}
                <div className={`p-4 sm:p-4.5 rounded-2xl border space-y-2.5 ${
                  isDark 
                    ? 'bg-[#1b050d] border-[#e11438]/20' 
                    : 'bg-red-50/50 border-red-100'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-500 dark:text-gray-400">
                      {activeMethodLabel} Send Money Number:
                    </span>
                    <span className="text-[11px] font-bold text-[#dc2626] dark:text-[#ff4d6d]">
                      Personal
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <span className={`font-mono text-lg sm:text-xl font-black tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {activePaymentNumber}
                    </span>
                    <button 
                      type="button" 
                      onClick={handleCopyNumber}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                        copied
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : isDark
                            ? 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                            : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300 shadow-xs'
                      }`}
                    >
                      <Copy size={12} />
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Checkout Input Form with Clean Spacing */}
              <form onSubmit={handleConfirmPayment} className="space-y-3.5 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sabbir Ahmed"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border transition-all outline-none ${
                      isDark 
                        ? 'bg-white/[0.03] border-white/10 text-white placeholder-gray-500 focus:border-[#e11438] focus:bg-white/[0.05]' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#dc2626]'
                    }`}
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {paymentMethod === 'bkash' ? 'Your bKash Number' : 'Your Nagad Number'} <span className="text-[#dc2626]">*</span>
                  </label>
                  <input 
                    type="tel" 
                    placeholder="01XXXXXXXXX"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border transition-all outline-none font-mono ${
                      isDark 
                        ? 'bg-white/[0.03] border-white/10 text-white placeholder-gray-500 focus:border-[#e11438] focus:bg-white/[0.05]' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#dc2626]'
                    }`}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Transaction ID (TrxID)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 9J7A5KL0"
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border transition-all outline-none font-mono uppercase tracking-wider ${
                      isDark 
                        ? 'bg-white/[0.03] border-white/10 text-white placeholder-gray-500 focus:border-[#e11438] focus:bg-white/[0.05]' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#dc2626]'
                    }`}
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                  />
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center pt-1 leading-relaxed">
                  By confirming payment, you agree to EduHunters'{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setTermsModalTab('terms');
                      setShowTermsModal(true);
                    }}
                    className="text-[#dc2626] dark:text-[#ff4d6d] font-semibold underline hover:opacity-80 bg-transparent border-none p-0 cursor-pointer text-[11px]"
                  >
                    Terms & Conditions
                  </button>{' '}
                  and{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setTermsModalTab('refund');
                      setShowTermsModal(true);
                    }}
                    className="text-[#dc2626] dark:text-[#ff4d6d] font-semibold underline hover:opacity-80 bg-transparent border-none p-0 cursor-pointer text-[11px]"
                  >
                    Refund Policy
                  </button>
                  .
                </p>

                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.45)] hover:shadow-[0_0_30px_rgba(220,38,38,0.65)] transition-all cursor-pointer border-none flex items-center justify-center gap-2"
                  disabled={isProcessing}
                >
                  <span>{isProcessing ? 'Verifying Payment...' : `Confirm ৳${price} Payment`}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Terms & Conditions / Refund Policy Popup Modal */}
      <TermsModal 
        isOpen={showTermsModal}
        initialTab={termsModalTab}
        onClose={() => setShowTermsModal(false)}
        data={{ siteSettings }}
      />

      {/* Monochromatic Official Invoice Modal */}
      {showInvoiceModal && createdOrder && (
        <InvoiceModal 
          order={createdOrder}
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
}
