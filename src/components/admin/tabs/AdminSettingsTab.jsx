import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  Copy,
  MessageCircle,
  ExternalLink,
  Phone,
  Mail,
  Settings as SettingsIcon,
  Zap,
  Check
} from 'lucide-react';
import {
  getBunnyConfig,
  saveBunnyConfig,
  isBunnyStreamConfigured,
  isBunnyStorageConfigured,
  testBunnyStreamConnection,
  testBunnyStorageConnection
} from '../../../services/bunnyService';

export default function AdminSettingsTab({
  siteSettings,
  setSiteSettings,
  handleUpdateSiteSetting,
  sectionTexts,
  persistAll,
  triggerToast
}) {
  // Bunny.net Cloud Integration State & Handlers
  const [bunnyConfig, setBunnyConfig] = useState(() => getBunnyConfig());
  const [bunnyTestResults, setBunnyTestResults] = useState({
    stream: null,
    storage: null,
    testingStream: false,
    testingStorage: false
  });

  const handleUpdateBunnyConfig = (field, value) => {
    setBunnyConfig(prev => {
      const updated = { ...prev, [field]: value };
      saveBunnyConfig(updated);
      return updated;
    });
  };

  const handleTestBunnyStream = async () => {
    setBunnyTestResults(prev => ({ ...prev, testingStream: true, stream: null }));
    const res = await testBunnyStreamConnection(bunnyConfig);
    setBunnyTestResults(prev => ({ ...prev, testingStream: false, stream: res }));
    if (res.success) {
      triggerToast('🟢 Bunny Stream connected successfully!');
    } else {
      triggerToast(`❌ Stream connection: ${res.message}`);
    }
  };

  const handleTestBunnyStorage = async () => {
    setBunnyTestResults(prev => ({ ...prev, testingStorage: true, storage: null }));
    const res = await testBunnyStorageConnection(bunnyConfig);
    setBunnyTestResults(prev => ({ ...prev, testingStorage: false, storage: res }));
    if (res.success) {
      triggerToast('🟢 Bunny Storage connected successfully!');
    } else {
      triggerToast(`❌ Storage connection: ${res.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Live Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span>Payment & Support Channels</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Directly manage bKash, Nagad, WhatsApp, support hotline, and email. Changes sync live instantly across the website without redeployment.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Sync Active
          </span>
          <button
            type="button"
            onClick={() => {
              persistAll({ siteSettings, sectionTexts });
              triggerToast('✅ All settings & payment accounts saved live!');
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-black border-none cursor-pointer shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PAYMENT ACCOUNTS (bKash & Nagad) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-xs border border-pink-100">
                ৳
              </span>
              <span>Payment Accounts (Student Checkout)</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Displayed on the checkout modal when students purchase courses or books, featuring instant 1-click copy.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* bKash Number */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50/40 via-white to-pink-50/20 border border-pink-100/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#d12053] text-white text-[10px] font-bold tracking-wide">
                  bKash
                </span>
                <span>bKash Personal Number</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(siteSettings.bkashNumber || '01342227935');
                  triggerToast('📋 bKash number copied to clipboard');
                }}
                className="text-[11px] text-pink-600 hover:text-pink-700 font-bold bg-transparent border-none cursor-pointer flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="01342227935"
                value={siteSettings.bkashNumber || ''}
                onChange={(e) => handleUpdateSiteSetting ? handleUpdateSiteSetting('bkashNumber', e.target.value) : setSiteSettings(prev => ({ ...prev, bkashNumber: e.target.value }))}
                className="w-full bg-white border border-pink-200/90 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10 transition-all shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              💡 Displayed when students select bKash in the checkout modal.
            </p>
          </div>

          {/* Nagad Number */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border border-amber-100/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#f7941d] text-white text-[10px] font-bold tracking-wide">
                  Nagad
                </span>
                <span>Nagad Personal Number</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(siteSettings.nagadNumber || '01731127231');
                  triggerToast('📋 Nagad number copied to clipboard');
                }}
                className="text-[11px] text-amber-600 hover:text-amber-700 font-bold bg-transparent border-none cursor-pointer flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="01731127231"
                value={siteSettings.nagadNumber || ''}
                onChange={(e) => handleUpdateSiteSetting ? handleUpdateSiteSetting('nagadNumber', e.target.value) : setSiteSettings(prev => ({ ...prev, nagadNumber: e.target.value }))}
                className="w-full bg-white border border-amber-200/90 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              💡 Displayed when students select Nagad in the checkout modal.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: CONTACT & SUPPORT CHANNELS (WhatsApp, Phone, Email) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
              </span>
              <span>Communication & Support Channels</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Integrated across the homepage cards, course pages, navbar helpline, and website footer.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* WhatsApp Support Number */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 border border-emerald-100/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Number</span>
              </label>
              <a
                href={`https://wa.me/88${(siteSettings.whatsappNumber || '01342227935').replace(/[^0-9]/g, '').replace(/^88/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 no-underline"
              >
                <span>Test Chat</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="text"
              placeholder="01342227935"
              value={siteSettings.whatsappNumber || ''}
              onChange={(e) => handleUpdateSiteSetting ? handleUpdateSiteSetting('whatsappNumber', e.target.value) : setSiteSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
              className="w-full bg-white border border-emerald-200/90 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-2xs"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              💬 Connects to homepage WhatsApp support cards, course pages, and navbar drawer.
            </p>
          </div>

          {/* Hotline Phone */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/40 via-white to-blue-50/20 border border-blue-100/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Support Hotline (Phone)</span>
              </label>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Direct Call
              </span>
            </div>
            <input
              type="text"
              placeholder="01342227935"
              value={siteSettings.contactPhone || ''}
              onChange={(e) => handleUpdateSiteSetting ? handleUpdateSiteSetting('contactPhone', e.target.value) : setSiteSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
              className="w-full bg-white border border-blue-200/90 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-2xs"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              📞 Official helpline phone number displayed for direct support calls.
            </p>
          </div>

          {/* Official Email */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/40 via-white to-purple-50/20 border border-purple-100/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                <span>Official Support Email</span>
              </label>
              <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                Official Mail
              </span>
            </div>
            <input
              type="email"
              placeholder="eduhuntersbd@gmail.com"
              value={siteSettings.contactEmail || ''}
              onChange={(e) => handleUpdateSiteSetting ? handleUpdateSiteSetting('contactEmail', e.target.value) : setSiteSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
              className="w-full bg-white border border-purple-200/90 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all shadow-2xs"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              ✉️ Displayed in terms & policies, legal pages, and the website footer.
            </p>
          </div>
        </div>
      </div>

      {/* LIVE CREDENTIALS SUMMARY STRIP */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">Active Live Credentials (Real-Time Summary)</span>
          </div>
          <span className="text-[11px] text-slate-400">Currently visible to all live website visitors</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] text-pink-400 font-bold block uppercase mb-1">bKash Account</span>
            <span className="font-mono font-black text-white">{siteSettings.bkashNumber || '01342227935'}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] text-amber-400 font-bold block uppercase mb-1">Nagad Account</span>
            <span className="font-mono font-black text-white">{siteSettings.nagadNumber || '01731127231'}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] text-emerald-400 font-bold block uppercase mb-1">WhatsApp</span>
            <span className="font-mono font-black text-white">{siteSettings.whatsappNumber || '01342227935'}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <span className="text-[10px] text-blue-400 font-bold block uppercase mb-1">Hotline Phone</span>
            <span className="font-mono font-black text-white">{siteSettings.contactPhone || '01342227935'}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-purple-400 font-bold block uppercase mb-1">Official Email</span>
            <span className="font-medium text-slate-200 truncate block">{siteSettings.contactEmail || 'eduhuntersbd@gmail.com'}</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: PLATFORM BRANDING & OTHER SETTINGS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-slate-600" />
            <span>Platform Branding & Settings</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Customize platform title, logo URL, and tagline slogan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Platform Title</label>
            <input
              type="text"
              value={siteSettings.siteName || ''}
              onChange={(e) => handleUpdateSiteSetting ? handleUpdateSiteSetting('siteName', e.target.value) : setSiteSettings(prev => ({ ...prev, siteName: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Tagline / Slogan</label>
            <input
              type="text"
              value={siteSettings.siteTagline || ''}
              onChange={(e) => handleUpdateSiteSetting ? handleUpdateSiteSetting('siteTagline', e.target.value) : setSiteSettings(prev => ({ ...prev, siteTagline: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">Logo URL / Path</label>
          <div className="flex items-center gap-3">
            <img src={siteSettings.logoUrl} alt="Logo" className="w-10 h-10 object-contain bg-slate-100 rounded-xl p-1 border border-slate-200" />
            <input
              type="text"
              value={siteSettings.logoUrl || ''}
              onChange={(e) => handleUpdateSiteSetting ? handleUpdateSiteSetting('logoUrl', e.target.value) : setSiteSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: BUNNY.NET CLOUD INTEGRATION */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm border border-orange-100">
                🐰
              </span>
              <span>Bunny.net Cloud Stream & Storage Integration</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enables 1-click direct video upload with automatic transcoding, live preview, and fast global PDF lecture note distribution.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${
              isBunnyStreamConfigured(bunnyConfig) && isBunnyStorageConfigured(bunnyConfig)
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isBunnyStreamConfigured(bunnyConfig) && isBunnyStorageConfigured(bunnyConfig)
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500'
              }`} />
              {isBunnyStreamConfigured(bunnyConfig) && isBunnyStorageConfigured(bunnyConfig)
                ? 'Bunny Fully Connected'
                : 'Credentials Incomplete'}
            </span>
          </div>
        </div>

        {/* Sub-section A: Bunny Stream (Video Delivery) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/40 via-white to-indigo-50/20 border border-purple-100/90 space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-bold tracking-wide">
                STREAM
              </span>
              <h4 className="text-xs font-black text-slate-900">
                Bunny Stream (Video Uploads & Player Iframe)
              </h4>
            </div>
            <a
              href="https://dash.bunny.net/stream"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 hover:underline"
            >
              <span>Bunny Stream Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Video Library ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 312456"
                value={bunnyConfig.streamLibraryId || ''}
                onChange={(e) => handleUpdateBunnyConfig('streamLibraryId', e.target.value.trim())}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-purple-600 transition-all shadow-2xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                From Bunny Stream → Manage Library → API → Library ID
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Stream API Key (AccessKey) <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                placeholder="e.g. 7f8a9b1c-..."
                value={bunnyConfig.streamApiKey || ''}
                onChange={(e) => handleUpdateBunnyConfig('streamApiKey', e.target.value.trim())}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-purple-600 transition-all shadow-2xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                From Bunny Stream → API → API Key
              </span>
            </div>
          </div>

          {/* Test Stream Button */}
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTestBunnyStream}
              disabled={bunnyTestResults.testingStream || !bunnyConfig.streamLibraryId || !bunnyConfig.streamApiKey}
              className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 disabled:opacity-50 text-purple-800 text-xs font-bold border-none cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{bunnyTestResults.testingStream ? 'Testing Bunny Stream...' : 'Test Stream API Connection'}</span>
            </button>

            {bunnyTestResults.stream && (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                bunnyTestResults.stream.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {bunnyTestResults.stream.message}
              </span>
            )}
          </div>
        </div>

        {/* Sub-section B: Bunny Storage (PDF Delivery) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/40 via-white to-cyan-50/20 border border-blue-100/90 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-100/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold tracking-wide">
                STORAGE CDN
              </span>
              <h4 className="text-xs font-black text-slate-900">
                Bunny Storage Zone (Lecture Sheet PDFs & Files)
              </h4>
            </div>
            <a
              href="https://dash.bunny.net/storage"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
            >
              <span>Bunny Storage Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Storage Zone Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. eduhunters-storage"
                value={bunnyConfig.storageZoneName || ''}
                onChange={(e) => handleUpdateBunnyConfig('storageZoneName', e.target.value.trim())}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600 transition-all shadow-2xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Storage Zone name created in Bunny.net
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Storage Access Key / Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                placeholder="e.g. 8a9b2c3d-..."
                value={bunnyConfig.storagePassword || ''}
                onChange={(e) => handleUpdateBunnyConfig('storagePassword', e.target.value.trim())}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600 transition-all shadow-2xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                From Storage Zone → FTP & API Access → Password
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Storage Hostname
              </label>
              <input
                type="text"
                placeholder="storage.bunnycdn.com"
                value={bunnyConfig.storageHostname || 'storage.bunnycdn.com'}
                onChange={(e) => handleUpdateBunnyConfig('storageHostname', e.target.value.trim())}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 outline-none focus:border-blue-600 transition-all shadow-2xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Default: storage.bunnycdn.com
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Connected Pull Zone (Public CDN Domain) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. eduhunters-cdn.b-cdn.net"
                value={bunnyConfig.pullZoneHostname || ''}
                onChange={(e) => handleUpdateBunnyConfig('pullZoneHostname', e.target.value.trim())}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-600 transition-all shadow-2xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                The public CDN domain connected to this storage zone
              </span>
            </div>
          </div>

          {/* CORS Banner */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
            <span className="font-bold shrink-0">⚠️ CORS Requirement:</span>
            <span>
              In your Bunny dashboard under <strong>Storage Zone → Security / CORS</strong>, make sure <strong>"Enable CORS Headers"</strong> is toggled <strong>ON</strong> so browsers can upload PDFs without being blocked.
            </span>
          </div>

          {/* Test Storage Button */}
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTestBunnyStorage}
              disabled={bunnyTestResults.testingStorage || !bunnyConfig.storageZoneName || !bunnyConfig.storagePassword}
              className="px-3.5 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 disabled:opacity-50 text-blue-800 text-xs font-bold border-none cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{bunnyTestResults.testingStorage ? 'Testing Bunny Storage...' : 'Test Storage API Connection'}</span>
            </button>

            {bunnyTestResults.storage && (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                bunnyTestResults.storage.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {bunnyTestResults.storage.message}
              </span>
            )}
          </div>
        </div>

        {/* Save All Bunny Credentials Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            Credentials are saved securely in browser local storage and sync with Course Studio.
          </p>
          <button
            type="button"
            onClick={() => {
              saveBunnyConfig(bunnyConfig);
              triggerToast('✅ Bunny.net credentials saved successfully!');
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black border-none cursor-pointer transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Bunny Credentials</span>
          </button>
        </div>
      </div>
    </div>
  );
}
