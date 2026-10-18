import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle, Copy, FileText, Clock, ShieldCheck, MessageCircle, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { saveNewOrder, getUserOrders, isPhoneMatch } from '../services/orderService';
import { fetchSupabaseOrders, isSupabaseConfigured } from '../services/supabaseService';
import { isItemEnrolled } from '../utils/enrollmentService';
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
  const [showEditPayment, setShowEditPayment] = useState(false);
  const [cloudPendingOrder, setCloudPendingOrder] = useState(null);

  // Cross-device / Cloud Pending Order Check
  useEffect(() => {
    if (currentUser?.email && isSupabaseConfigured) {
      const userEmail = (currentUser.email || '').trim().toLowerCase();
      const targetTitle = (item?.title || item?.name || '').trim().toLowerCase();
      const targetSlug = (item?.slug || item?.id || '').trim().toLowerCase();

      fetchSupabaseOrders().then(orders => {
        if (Array.isArray(orders) && orders.length > 0) {
          const match = orders.find(ord => {
            const isPending = (ord.status || '').toUpperCase() === 'PENDING' && !ord.isApproved && !ord.is_approved;
            if (!isPending) return false;
            const ordEmail = (ord.customer?.email || ord.customer_email || '').trim().toLowerCase();
            if (ordEmail !== userEmail) return false;
            const ordTitle = (ord.course?.name || ord.course_name || '').trim().toLowerCase();
            const ordSlug = (ord.course?.slug || ord.course_slug || '').trim().toLowerCase();
            return (targetTitle && (ordTitle.includes(targetTitle) || targetTitle.includes(ordTitle))) ||
                   (targetSlug && (ordSlug === targetSlug || ordSlug.replace(/[-_]/g, '') === targetSlug.replace(/[-_]/g, '')));
          });
          if (match) setCloudPendingOrder(match);
        }
      }).catch(() => {});
    }
  }, [currentUser?.email, item?.title, item?.name, item?.slug, item?.id]);

  // Check if current user is ALREADY enrolled and approved for this item
  const alreadyEnrolledOrder = useMemo(() => {
    if (!currentUser) return null;
    try {
      const orders = getUserOrders();
      const targetTitle = (item?.title || item?.name || '').trim().toLowerCase();
      const targetSlug = (item?.slug || item?.id || '').trim().toLowerCase();
      const userEmail = (currentUser?.email || '').trim().toLowerCase();
      const userPhoneClean = (currentUser?.whatsapp || currentUser?.phone || currentUser?.phoneNumber || '').replace(/[^0-9]/g, '');

      return orders.find(ord => {
        const isApproved = ord.isApproved || (ord.status || '').toUpperCase() === 'PAID' || (ord.status || '').toLowerCase() === 'completed';
        if (!isApproved) return false;

        const ordTitle = (ord.course?.name || ord.items?.[0]?.title || '').trim().toLowerCase();
        const ordSlug = (ord.course?.slug || ord.items?.[0]?.slug || '').trim().toLowerCase();
        const titleMatch = targetTitle && (ordTitle.includes(targetTitle) || targetTitle.includes(ordTitle));
        const slugMatch = targetSlug && (ordSlug === targetSlug || ordSlug.replace(/[-_]/g, '') === targetSlug.replace(/[-_]/g, ''));
        if (!titleMatch && !slugMatch) return false;

        const ordEmail = (ord.customer?.email || '').trim().toLowerCase();
        const ordPhoneClean = (ord.customer?.phone || '').replace(/[^0-9]/g, '');
        const emailMatch = userEmail && ordEmail && userEmail === ordEmail;
        const phoneMatch = userPhoneClean.length >= 10 && ordPhoneClean.length >= 10 && userPhoneClean.slice(-10) === ordPhoneClean.slice(-10);

        return emailMatch || phoneMatch;
      }) || null;
    } catch {
      return null;
    }
  }, [currentUser, item]);

  const isAlreadyEnrolled = useMemo(() => {
    if (!currentUser) return false;
    return Boolean(alreadyEnrolledOrder) || isItemEnrolled(item, currentUser);
  }, [alreadyEnrolledOrder, currentUser, item]);

  // Check if current user already has an active PENDING request for this item
  const existingPendingOrder = useMemo(() => {
    if (!currentUser) return null;
    try {
      const orders = getUserOrders();
      const targetTitle = (item?.title || item?.name || '').trim().toLowerCase();
      const targetSlug = (item?.slug || item?.id || '').trim().toLowerCase();
      const userEmail = (currentUser?.email || '').trim().toLowerCase();
      const userPhoneClean = (currentUser?.whatsapp || currentUser?.phone || currentUser?.phoneNumber || '').replace(/[^0-9]/g, '');

      const localMatch = orders.find(ord => {
        const st = (ord.status || '').toUpperCase();
        const isPending = st === 'PENDING' && !ord.isApproved;
        if (!isPending) return false;

        const ordTitle = (ord.course?.name || ord.items?.[0]?.title || '').trim().toLowerCase();
        const ordSlug = (ord.course?.slug || ord.items?.[0]?.slug || '').trim().toLowerCase();
        const titleMatch = targetTitle && (ordTitle.includes(targetTitle) || targetTitle.includes(ordTitle));
        const slugMatch = targetSlug && (ordSlug === targetSlug || ordSlug.replace(/[-_]/g, '') === targetSlug.replace(/[-_]/g, ''));
        if (!titleMatch && !slugMatch) return false;

        const ordEmail = (ord.customer?.email || '').trim().toLowerCase();
        const ordPhoneClean = (ord.customer?.phone || '').replace(/[^0-9]/g, '');
        const emailMatch = userEmail && ordEmail && userEmail === ordEmail;
        const phoneMatch = userPhoneClean.length >= 10 && ordPhoneClean.length >= 10 && userPhoneClean.slice(-10) === ordPhoneClean.slice(-10);

        return emailMatch || phoneMatch;
      });

      return localMatch || cloudPendingOrder || null;
    } catch {
      return cloudPendingOrder || null;
    }
  }, [currentUser, item, cloudPendingOrder]);

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
    if (isProcessing) return;

    if (existingPendingOrder && !showEditPayment) {
      alert("Your enrollment request has already been received and is under review. Please wait, verification is typically completed within 5-15 minutes.");
      return;
    }

    const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 11) {
      alert("Please enter a valid 11-digit mobile number");
      return;
    }

    setIsProcessing(true);
    (async () => {
      try {
        // Automatically persist order & invoice in Order History & Cloud Firestore
        const finalStudentName = studentName || currentUser?.displayName || currentUser?.name || 'Enrolled Student';
        const finalPhone = phoneNumber || currentUser?.whatsapp || currentUser?.phone || 'N/A';
        const finalEmail = currentUser?.email || 'student@eduhunters.com.bd';
        const finalTrxId = trxId ? trxId.trim().toUpperCase() : 'PENDING_VERIFICATION';
        
        const newOrder = await saveNewOrder({
          item,
          studentName: finalStudentName,
          studentPhone: finalPhone,
          studentEmail: finalEmail,
          studentUid: currentUser?.uid || currentUser?.id,
          paymentMethod: paymentMethod === 'bkash' ? 'bKash' : 'Nagad',
          trxId: finalTrxId,
          amount: price,
          originalPrice: originalPrice,
          discount: Math.max(0, originalPrice - price),
          existingOrderId: existingPendingOrder?.id || null
        });
        setCreatedOrder(newOrder);

        // Slick micro-delay (120ms) for polished button interaction feedback
        await new Promise((r) => setTimeout(r, 120));

        setIsProcessing(false);
        setIsSuccess(true);

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
            studentEmail: finalEmail,
            method: paymentMethod === 'bkash' ? 'bKash' : 'Nagad',
            trxId: finalTrxId,
            orderId: newOrder?.id,
            invoiceNumber: newOrder?.invoiceNumber
          });
        }
      } catch (err) {
        console.error('[CheckoutModal] Payment submit error:', err);
        setIsProcessing(false);
        setIsSuccess(true);
      }
    })();
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
          ) : isAlreadyEnrolled ? (
            <div className="py-2 space-y-4">
              {/* Green Success / Active Header */}
              <div className={`p-5 rounded-2xl border text-center space-y-2.5 ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-emerald-50/90 border-emerald-200'
              }`}>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle size={26} className="text-emerald-500" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Enrollment Active
                  </span>
                  <h4 className={`text-base sm:text-lg font-black mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    You are already enrolled in this course!
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Your account has full access to this course. You can access all classes, lecture notes, and exams.
                  </p>
                </div>
              </div>

              {/* Order Info */}
              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                isDark ? 'bg-white/[0.02] border-white/10 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'
              }`}>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5">
                  <span className="text-gray-400">Course Name:</span>
                  <span className="font-bold text-right ml-2 max-w-[200px] truncate">{alreadyEnrolledOrder?.course?.name || item.title}</span>
                </div>
                {alreadyEnrolledOrder?.transactionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Transaction ID:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{alreadyEnrolledOrder.transactionId}</span>
                  </div>
                )}
                {alreadyEnrolledOrder?.invoiceNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Invoice Number:</span>
                    <span className="font-mono font-semibold">{alreadyEnrolledOrder.invoiceNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle size={13} />
                    Enrolled & Course Unlocked
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {alreadyEnrolledOrder && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setCreatedOrder(alreadyEnrolledOrder);
                      setShowInvoiceModal(true);
                    }}
                    className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs border cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                      isDark 
                        ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
                    }`}
                  >
                    <FileText size={15} />
                    <span>View Invoice</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleSmoothClose();
                    if (item.targetType === 'exam' || item.categoryKey === 'sureshot') {
                      window.location.href = '/exams';
                    } else if (item.id || item.slug) {
                      window.location.href = `/courses/${item.id || item.slug}`;
                    }
                  }}
                  className="flex-1 py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-xl font-bold text-xs border-none cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={15} />
                  <span>Go to Course</span>
                </button>
              </div>

              {/* Close button */}
              <button 
                type="button" 
                onClick={handleSmoothClose}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs border cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white border-zinc-800' 
                    : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border-gray-200'
                }`}
              >
                Close
              </button>
            </div>
          ) : existingPendingOrder && !showEditPayment ? (
            <div className="py-2 space-y-4">
              {/* Amber Status Header */}
              <div className={`p-4 rounded-2xl border text-center space-y-2.5 ${
                isDark ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50/80 border-amber-200'
              }`}>
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
                  <Clock size={24} className="animate-pulse" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Request Pending Verification
                  </span>
                  <h4 className={`text-base sm:text-lg font-black mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Your Enrollment Request is Under Review
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Our team is verifying your payment details. Course access is typically approved within <strong>5 to 15 minutes</strong>.
                  </p>
                </div>
              </div>

              {/* Order Details Card */}
              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                isDark ? 'bg-white/[0.02] border-white/10 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'
              }`}>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5">
                  <span className="text-gray-400">Course Name:</span>
                  <span className="font-bold text-right ml-2 max-w-[200px] truncate">{existingPendingOrder.course?.name || item.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{existingPendingOrder.transactionId || 'PENDING'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Payment Number:</span>
                  <span className="font-mono font-semibold">{existingPendingOrder.customer?.phone || phoneNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Payment Method:</span>
                  <span className="font-semibold capitalize">{existingPendingOrder.paymentGateway || paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Submitted At:</span>
                  <span className="font-medium text-gray-500">
                    {existingPendingOrder.createdAt 
                      ? new Date(existingPendingOrder.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                      : 'Recently'}
                  </span>
                </div>
              </div>

              {/* Helpful notice */}
              <div className={`p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2.5 ${
                isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-200/80 text-blue-900'
              }`}>
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <div>
                  <strong>Please wait:</strong> You do not need to send money or submit another request for this course. The course page will automatically unlock once approved.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button 
                  type="button" 
                  onClick={() => {
                    setCreatedOrder(existingPendingOrder);
                    setShowInvoiceModal(true);
                  }}
                  className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs border cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
                  }`}
                >
                  <FileText size={15} />
                  <span>View Invoice</span>
                </button>

                <a
                  href={`https://wa.me/8801342227935?text=${encodeURIComponent(`Hello, I have submitted an enrollment request for "${existingPendingOrder.course?.name || item.title}" on EduHunters. My TrxID is: ${existingPendingOrder.transactionId}. Could you please verify?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-xl font-bold text-xs border-none cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5 no-underline"
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp Helpline</span>
                </a>
              </div>

              {/* Close button */}
              <button 
                type="button" 
                onClick={handleSmoothClose}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs border cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white border-zinc-800' 
                    : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border-gray-200'
                }`}
              >
                Got it, Close
              </button>

              {/* Discreet Edit Option */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPayment(true);
                    if (existingPendingOrder.transactionId) setTrxId(existingPendingOrder.transactionId);
                  }}
                  className="text-[11px] text-gray-400 hover:text-rose-500 transition-colors underline cursor-pointer bg-transparent border-none"
                >
                  Entered wrong Transaction ID? Click here to update details
                </button>
              </div>
            </div>
          ) : (
            <>
              {existingPendingOrder && showEditPayment && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <span className="font-medium">Updating pending payment details</span>
                  <button
                    type="button"
                    onClick={() => setShowEditPayment(false)}
                    className="text-[11px] font-bold underline cursor-pointer bg-transparent border-none p-0"
                  >
                    Go Back
                  </button>
                </div>
              )}
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
                  className={`w-full py-3.5 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.45)] hover:shadow-[0_0_30px_rgba(220,38,38,0.65)] transition-all cursor-pointer border-none flex items-center justify-center gap-2 ${
                    isProcessing ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''
                  }`}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>{existingPendingOrder ? `Update Details & Confirm (৳${price})` : `Confirm ৳${price} Payment`}</span>
                  )}
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
