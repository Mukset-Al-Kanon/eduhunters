import React from 'react';
import { PieChart } from 'lucide-react';

export default function AdminStatsTab({
  announcement,
  setAnnouncement,
  homeStats,
  setHomeStats,
  persistAll
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <PieChart className="w-6 h-6 text-amber-500" />
          Homepage Counters & Announcements
        </h2>
        <p className="text-xs text-slate-500">
          Manage live metrics counters (students, members) and top announcement notice bar text.
        </p>
      </div>

      {/* Top Banner Notice */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <label className="text-xs font-bold text-slate-800 block">
          📢 Top Notice & Special Announcement Bar
        </label>
        <input
          type="text"
          value={announcement}
          onChange={(e) => {
            setAnnouncement(e.target.value);
            persistAll({ announcement: e.target.value });
          }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
          placeholder="Enter notice text..."
        />
      </div>

      {/* Red Stats Strip Counters */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          🔴 Counter Strip Metrics (Hero Section Counters)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {homeStats.map((st, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[10px] uppercase font-bold text-blue-600">Counter #{idx + 1}</span>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1">Counter Value (e.g. 3000+)</label>
                <input
                  type="text"
                  value={st.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = homeStats.map((item, i) => i === idx ? { ...item, value: val } : item);
                    setHomeStats(updated);
                    persistAll({ homeStats: updated });
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-black text-slate-900 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1">Label / Title</label>
                <input
                  type="text"
                  value={st.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = homeStats.map((item, i) => i === idx ? { ...item, label: val } : item);
                    setHomeStats(updated);
                    persistAll({ homeStats: updated });
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
