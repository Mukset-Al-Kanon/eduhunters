import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { useTheme } from '../context/ThemeContext';
import { getUserOrders } from '../services/orderService';
import InvoiceModal from './InvoiceModal';

export default function OrdersPage({
  data = {},
  onNavigateHome,
  onNavigateCourse,
  onNavigateExams,
  onNavigateStore,
  onNavigateAbout,
  onNavigateDevices,
  onNavigateOrders,
  onNavigatePolicies,
  onOpenAdmin,
  onLoginClick
}) {
  const { isDark } = useTheme();
  const [copiedId, setCopiedId] = useState('');
  const [ordersList, setOrdersList] = useState(() => getUserOrders());
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Sync with real-time purchases and storage changes
  useEffect(() => {
    const handleUpdate = () => {
      setOrdersList(getUserOrders());
    };
    window.addEventListener('eh:orders_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('eh:orders_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const coursePurchases = ordersList.filter(o => o.type === 'course' || o.type === 'exam' || o.type === 'bundle').length;
  const storePurchases = ordersList.filter(o => o.type === 'store').length;
  const summary = {
    totalOrders: ordersList.length,
    coursePurchases,
    storePurchases
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(text);
      setTimeout(() => setCopiedId(''), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const formatDateBn = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'তারিখ নেই';
    }
  };

  const formatGateway = (gateway) => {
    if (!gateway) return 'Payment';
    return gateway.toLowerCase() === 'bkash' ? 'bKash' : gateway.toUpperCase();
  };

  const formatOrderId = (id) => {
    if (!id) return '';
    return id.split('-').pop() || id;
  };

  const handleOpenCourseAccess = (order) => {
    if (!order) return;

    // Check if this is an Exam Batch order (e.g. Sure Shot)
    const isExamBatch = 
      order.targetType === 'exam' || 
      order.course?.targetType === 'exam' ||
      order.course?.categoryKey === 'sureshot' ||
      order.course?.slug === 'sureshot' ||
      (order.course?.name && order.course.name.toLowerCase().includes('sure shot')) ||
      (order.course?.name && order.course.name.toLowerCase().includes('exam batch'));

    if (isExamBatch) {
      const categoryKey = order.course?.categoryKey || 'sureshot';
      if (onNavigateExams) {
        onNavigateExams(categoryKey);
      } else {
        window.history.pushState(null, '', `/exams?category=${categoryKey}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      return;
    }

    // Standard Academic / Admission Course
    const courseSlug = order.course?.slug || order.course?.id;
    if (courseSlug) {
      if (onNavigateCourse) {
        onNavigateCourse(courseSlug);
      } else {
        window.history.pushState(null, '', `/courses/${courseSlug}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } else {
      if (onNavigateCourse) onNavigateCourse();
    }
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-250 selection:bg-[#dc2626] selection:text-white ${
      isDark ? 'bg-transparent text-gray-100' : 'bg-[#fbfbfb] text-[#111827]'
    }`}>
      {/* Sticky Main Top Navigation Bar */}
      <Navbar 
        activePage="orders"
        siteSettings={data.siteSettings}
        onNavigateHome={onNavigateHome}
        onNavigateCourse={onNavigateCourse}
        onNavigateExams={onNavigateExams}
        onNavigateStore={onNavigateStore}
        onNavigateAbout={onNavigateAbout}
        onNavigateDevices={onNavigateDevices}
        onNavigateOrders={onNavigateOrders}
        onNavigatePolicies={onNavigatePolicies}
        onOpenAdmin={onOpenAdmin}
        onLoginClick={onLoginClick}
      />

      {/* Main Content with 64px - 80px Navbar clearance */}
      <main className="pt-16 md:pt-20">
        <div className={`min-h-screen py-8 transition-colors duration-300 ${
          isDark ? 'bg-transparent' : 'bg-[#fafafa]'
        }`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

            {/* 1. Edu Hunters Hero Band Banner */}
            <div 
              className={`eh-band relative overflow-hidden rounded-2xl mb-6 shadow-lg ${
                isDark 
                  ? 'border border-[#e11438]/25 shadow-[0_16px_40px_rgba(0,0,0,0.7)]' 
                  : 'shadow-md border border-red-900/10'
              }`}
              style={{
                background: isDark
                  ? 'radial-gradient(hsla(0,0%,100%,.1) 1.5px,transparent 1.5px),radial-gradient(circle at 82% 16%,rgba(248,113,113,.25),transparent 46%),linear-gradient(135deg,#36060e 0%,#180206 55%,#0d0104 100%)'
                  : 'radial-gradient(hsla(0,0%,100%,.1) 1.5px,transparent 1.5px),radial-gradient(circle at 82% 16%,rgba(248,113,113,.5),transparent 46%),radial-gradient(circle at 10% 96%,rgba(220,38,38,.7),transparent 52%),linear-gradient(135deg,#7f1d1d 0%,#dc2626 55%,#991b1b 100%)',
                backgroundSize: '22px 22px, 100% 100%, 100% 100%, 100% 100%'
              }}
            >
              <div className="px-6 py-7 md:px-8 md:py-9 relative z-10 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
                    My Order History
                  </h1>
                  <p className="text-white opacity-85 text-sm md:text-base mt-1">
                    Course payments and confirmed store purchases in one place.
                  </p>
                </div>

                {/* Summary Chips in Header (Exact Edu Hunters) */}
                {summary && (
                  <div className="flex gap-2 text-sm flex-wrap shrink-0">
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3.5 sm:px-4 py-2 text-center backdrop-blur-sm">
                      <p className="text-white opacity-80 text-xs font-medium">Total Orders</p>
                      <p className="font-bold text-white text-base sm:text-lg">{summary.totalOrders}</p>
                    </div>
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3.5 sm:px-4 py-2 text-center backdrop-blur-sm">
                      <p className="text-white opacity-80 text-xs font-medium">Course Purchases</p>
                      <p className="font-bold text-white text-base sm:text-lg">{summary.coursePurchases}</p>
                    </div>
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3.5 sm:px-4 py-2 text-center backdrop-blur-sm">
                      <p className="text-white opacity-80 text-xs font-medium">Store Purchases</p>
                      <p className="font-bold text-white text-base sm:text-lg">{summary.storePurchases}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Confirmed Orders List (Exact Edu Hunters Layout) */}
            {ordersList && ordersList.length > 0 ? (
              <div className="space-y-5">
                {ordersList.map((order) => (
                  <div 
                    key={order.id} 
                    className={`overflow-hidden rounded-2xl border transition-all shadow-sm ${
                      isDark 
                        ? 'bg-[#140306] border-white/10' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* Top Charcoal Header (Exact Edu Hunters) */}
                    <div className="border-b border-white/10 bg-[#111827] px-5 py-4 text-white">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-white">
                              {order.type === 'course' 
                                ? order.course?.name 
                                : order.type === 'bundle' 
                                  ? order.bundle?.name 
                                  : `Store Order #${formatOrderId(order.id)}`}
                            </h2>
                            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold uppercase text-white tracking-wide">
                              {order.badge || (order.type === 'course' 
                                ? 'Course Purchase' 
                                : order.type === 'bundle' 
                                  ? 'Bundle / Combo' 
                                  : 'Store Purchase')}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-white/60">
                            {formatDateBn(order.createdAt)}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-sm text-white/60">
                            {formatGateway(order.paymentGateway)}
                          </p>
                          <p className="text-2xl font-bold text-white">
                            ৳{order.totalPaid}
                          </p>
                          {order.transactionId && (
                            <button
                              onClick={() => setSelectedInvoiceOrder(order)}
                              className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-100 transition-all border border-zinc-200 cursor-pointer shadow-xs active:scale-95"
                              title="View Official Monochromatic Invoice"
                            >
                              <svg className="w-3.5 h-3.5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>View Invoice →</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Transaction ID Box with Copy Button */}
                        <div className={`rounded-xl p-4 transition-colors ${
                          isDark ? 'bg-white/[0.03] border border-white/5' : 'bg-[#f9fafb]'
                        }`}>
                          <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Transaction</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-semibold break-all flex-1 text-gray-900 dark:text-white">
                              {order.transactionId || '-'}
                            </p>
                            {order.transactionId && (
                              <button
                                onClick={() => copyToClipboard(order.transactionId)}
                                className={`shrink-0 text-xs font-semibold px-2 py-1 rounded transition-colors cursor-pointer border ${
                                  isDark 
                                    ? 'text-[#ff4d6d] bg-white/5 border-white/10 hover:bg-white/10' 
                                    : 'text-[#ea580c] bg-white border-gray-200 hover:bg-gray-100 shadow-sm'
                                }`}
                              >
                                {copiedId === order.transactionId ? 'Copied ✓' : 'Copy'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Course Access / Delivery Info */}
                        {order.type === 'course' ? (
                          <div className={`rounded-xl p-4 transition-colors ${
                            isDark ? 'bg-white/[0.03] border border-white/5' : 'bg-[#f9fafb]'
                          }`}>
                            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {(order.targetType === 'exam' || order.course?.targetType === 'exam' || order.course?.categoryKey === 'sureshot')
                                ? 'Exam Batch Access'
                                : 'Course Access'}
                            </p>
                            <div className="flex flex-col items-start gap-2">
                              <button
                                onClick={() => handleOpenCourseAccess(order)}
                                className="font-semibold text-[#ea580c] dark:text-[#ff6b8b] hover:underline border-none bg-transparent p-0 cursor-pointer text-left text-sm"
                              >
                                Open {order.course.name} →
                              </button>
                              {order.course.fb_group && (
                                <a
                                  href={order.course.fb_group}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                                  </svg>
                                  <span>Join FB Group</span>
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className={`rounded-xl p-4 transition-colors ${
                            isDark ? 'bg-white/[0.03] border border-white/5' : 'bg-[#f9fafb]'
                          }`}>
                            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Delivery</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{order.fullName}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{order.phone}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {[order.address, order.thana, order.district].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Course / Exam Batch Payment Summary */}
                      {order.type === 'course' && (
                        <div className="space-y-4">
                          <div className={`rounded-xl border p-4 transition-colors ${
                            isDark ? 'border-white/10 bg-white/[0.01]' : 'border-gray-200'
                          }`}>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">
                              {order.badge === 'Exam Batch' ? 'Exam Batch Payment Summary' : 'Course Payment Summary'}
                            </h3>
                            <div className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              <div className="flex justify-between">
                                <span>Course Price</span>
                                <span className="font-medium text-gray-900 dark:text-white">৳{order.subtotal}</span>
                              </div>
                              {order.discount > 0 && (
                                <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                                  <span>Discount</span>
                                  <span>-৳{order.discount}</span>
                                </div>
                              )}
                              <div className={`flex justify-between border-t pt-2 font-bold text-base text-gray-900 dark:text-white ${
                                isDark ? 'border-white/10' : 'border-gray-200'
                              }`}>
                                <span>Total Paid</span>
                                <span className="text-[#dc2626] dark:text-[#ff3d67]">৳{order.totalPaid}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Store Products List if type is store */}
                      {order.type === 'store' && order.items && (
                        <div className="grid gap-3 md:grid-cols-2">
                          {order.items.map((item) => {
                            const itemName = item.book?.name || item.title || 'Academic Resource';
                            const itemType = item.book?.book_type || item.type || 'Printed Book';
                            const itemImage = item.book?.image || item.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80';
                            const itemPrice = item.price || item.unitPrice || 450;
                            const itemQty = item.quantity || 1;
                            const downloadUrl = item.book?.download_url || item.download_url;

                            return (
                              <div 
                                key={item.id} 
                                className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${
                                  isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'
                                }`}
                              >
                                <img 
                                  src={itemImage} 
                                  alt={itemName} 
                                  className="h-20 w-14 rounded-lg object-cover shadow-sm shrink-0" 
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                                    {itemName}
                                  </p>
                                  <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {itemType} · Qty: {itemQty} x ৳{itemPrice}
                                  </p>
                                  {downloadUrl && (
                                    <a 
                                      href={downloadUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-xs font-semibold text-[#ea580c] hover:underline mt-1 inline-block"
                                    >
                                      Open PDF
                                    </a>
                                  )}
                                </div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">
                                  ৳{itemQty * itemPrice}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Exact Empty State */
              <div className={`rounded-2xl border p-10 text-center transition-colors ${
                isDark ? 'bg-white/[0.02] border-white/10 text-gray-400' : 'bg-white border-gray-200 text-gray-500'
              }`}>
                No confirmed orders found yet.
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer matching Edu Hunters (Hidden on mobile) */}
      <div className="hidden sm:block">
        {isDark ? (
          <footer className="bg-gradient-to-b from-[#180408] via-[#0d0205] to-[#050102] text-white border-t border-[#e11438]/25 py-8 text-center text-xs text-gray-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p>© 2026 Edu Hunters. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('privacy') : (window.location.href = '/privacy-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Privacy Policy</button>
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Terms of Use</button>
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Refund Policy</button>
              </div>
            </div>
          </footer>
        ) : (
          <footer className="bg-[#dc2626] eh-dots-light text-white py-8 text-center text-xs">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <p className="text-white/80">Academic to admission EDU HUNTERS with you.</p>
                <p className="text-white/60 mt-0.5">© 2026 Edu Hunters. All rights reserved.</p>
              </div>
              <div className="flex items-center gap-4 text-white/80">
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('privacy') : (window.location.href = '/privacy-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Privacy Policy</button>
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('terms') : (window.location.href = '/terms')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Terms of Use</button>
                <button onClick={() => onNavigatePolicies ? onNavigatePolicies('refund') : (window.location.href = '/refund-policy')} className="hover:underline bg-transparent border-none p-0 text-inherit cursor-pointer">Refund Policy</button>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Official Monochromatic Invoice Modal */}
      <InvoiceModal 
        order={selectedInvoiceOrder}
        isOpen={!!selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </div>
  );
}

