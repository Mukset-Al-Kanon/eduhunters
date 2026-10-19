import React, { useState } from 'react';
import { 
  ShieldCheck, 
  DollarSign, 
  ExternalLink, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';
import { initialData } from '../../../data/mockData';

export default function AdminPoliciesTab({
  termsAndConditions,
  setTermsAndConditions,
  refundPolicy,
  setRefundPolicy,
  privacyPolicy,
  setPrivacyPolicy,
  persistAll,
  triggerToast
}) {
  const [activePolicySubTab, setActivePolicySubTab] = useState('terms'); // 'terms' | 'refund' | 'privacy'

  const handleUpdatePolicyMeta = (policyKey, field, value) => {
    if (policyKey === 'terms') {
      const updated = { ...termsAndConditions, [field]: value };
      setTermsAndConditions(updated);
      persistAll({ termsAndConditions: updated });
    } else if (policyKey === 'refund') {
      const updated = { ...refundPolicy, [field]: value };
      setRefundPolicy(updated);
      persistAll({ refundPolicy: updated });
    } else if (policyKey === 'privacy') {
      const updated = { ...privacyPolicy, [field]: value };
      setPrivacyPolicy(updated);
      persistAll({ privacyPolicy: updated });
    }
  };

  const handleAddClause = (policyKey) => {
    const target = policyKey === 'terms' ? termsAndConditions : (policyKey === 'refund' ? refundPolicy : privacyPolicy);
    const clauses = target.clauses || [];
    const newClause = {
      id: clauses.length + 1,
      title: `New Policy Section #${clauses.length + 1}`,
      points: ['Enter section policy details here.']
    };
    const updated = { ...target, clauses: [...clauses, newClause] };

    if (policyKey === 'terms') {
      setTermsAndConditions(updated);
      persistAll({ termsAndConditions: updated });
    } else if (policyKey === 'refund') {
      setRefundPolicy(updated);
      persistAll({ refundPolicy: updated });
    } else if (policyKey === 'privacy') {
      setPrivacyPolicy(updated);
      persistAll({ privacyPolicy: updated });
    }
    triggerToast('➕ New policy section added.');
  };

  const handleUpdateClause = (policyKey, index, field, value) => {
    const target = policyKey === 'terms' ? termsAndConditions : (policyKey === 'refund' ? refundPolicy : privacyPolicy);
    const clauses = target.clauses || [];
    const updatedClauses = clauses.map((c, i) => {
      if (i !== index) return c;
      if (field === 'pointsText') {
        const lines = value.split('\n');
        return { ...c, points: lines };
      }
      return { ...c, [field]: value };
    });
    const updated = { ...target, clauses: updatedClauses };

    if (policyKey === 'terms') {
      setTermsAndConditions(updated);
      persistAll({ termsAndConditions: updated });
    } else if (policyKey === 'refund') {
      setRefundPolicy(updated);
      persistAll({ refundPolicy: updated });
    } else if (policyKey === 'privacy') {
      setPrivacyPolicy(updated);
      persistAll({ privacyPolicy: updated });
    }
  };

  const handleMoveClause = (policyKey, index, direction) => {
    const target = policyKey === 'terms' ? termsAndConditions : (policyKey === 'refund' ? refundPolicy : privacyPolicy);
    const clauses = [...(target.clauses || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= clauses.length) return;

    const temp = clauses[index];
    clauses[index] = clauses[targetIdx];
    clauses[targetIdx] = temp;

    const reindexed = clauses.map((c, i) => ({ ...c, id: i + 1 }));
    const updated = { ...target, clauses: reindexed };

    if (policyKey === 'terms') {
      setTermsAndConditions(updated);
      persistAll({ termsAndConditions: updated });
    } else if (policyKey === 'refund') {
      setRefundPolicy(updated);
      persistAll({ refundPolicy: updated });
    } else if (policyKey === 'privacy') {
      setPrivacyPolicy(updated);
      persistAll({ privacyPolicy: updated });
    }
    triggerToast('↕️ Section order rearranged.');
  };

  const handleDeleteClause = (policyKey, index) => {
    const target = policyKey === 'terms' ? termsAndConditions : (policyKey === 'refund' ? refundPolicy : privacyPolicy);
    const clauses = target.clauses || [];
    const clauseToDelete = clauses[index];
    if (!confirm(`Are you sure you want to delete section "${clauseToDelete?.title || index + 1}"?`)) return;

    const filtered = clauses.filter((_, i) => i !== index).map((c, i) => ({ ...c, id: i + 1 }));
    const updated = { ...target, clauses: filtered };

    if (policyKey === 'terms') {
      setTermsAndConditions(updated);
      persistAll({ termsAndConditions: updated });
    } else if (policyKey === 'refund') {
      setRefundPolicy(updated);
      persistAll({ refundPolicy: updated });
    } else if (policyKey === 'privacy') {
      setPrivacyPolicy(updated);
      persistAll({ privacyPolicy: updated });
    }
    triggerToast('🗑️ Policy section deleted.');
  };

  const handleResetPolicyTemplate = (policyKey) => {
    if (!confirm('Are you sure you want to restore this policy to the default factory template?')) return;
    if (policyKey === 'terms') {
      setTermsAndConditions(initialData.termsAndConditions);
      persistAll({ termsAndConditions: initialData.termsAndConditions });
    } else if (policyKey === 'refund') {
      setRefundPolicy(initialData.refundPolicy);
      persistAll({ refundPolicy: initialData.refundPolicy });
    } else if (policyKey === 'privacy') {
      setPrivacyPolicy(initialData.privacyPolicy);
      persistAll({ privacyPolicy: initialData.privacyPolicy });
    }
    triggerToast('🔄 Policy restored to default.');
  };

  const currentPolicy = activePolicySubTab === 'terms' 
    ? termsAndConditions 
    : (activePolicySubTab === 'refund' ? refundPolicy : privacyPolicy);
  const clauses = currentPolicy?.clauses || [];

  const subTabMeta = {
    terms: {
      label: 'Terms & Conditions',
      icon: ShieldCheck,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      activeTabStyle: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25',
      livePath: '/terms',
      badge: 'Usage Terms',
      introLabel: 'Introductory Statement',
      introPlaceholder: 'Introductory statement displayed before the clauses...'
    },
    refund: {
      label: 'Refund Policy',
      icon: DollarSign,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      activeTabStyle: 'bg-amber-600 text-white shadow-md shadow-amber-600/25',
      livePath: '/refund-policy',
      badge: 'Payment & Returns',
      introLabel: 'High Priority Notice Banner',
      introPlaceholder: 'Important warning or refund eligibility notice...'
    },
    privacy: {
      label: 'Privacy Policy',
      icon: ShieldCheck,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      activeTabStyle: 'bg-rose-600 text-white shadow-md shadow-rose-600/25',
      livePath: '/privacy-policy',
      badge: 'Data Protection',
      introLabel: 'Privacy Overview Statement',
      introPlaceholder: 'Statement explaining how user data and privacy are maintained...'
    }
  };

  const meta = subTabMeta[activePolicySubTab];

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tab Switcher Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Legal & Policies Studio
                </h2>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Edit terms of service, refund rules, and privacy policies displayed on website footer, checkout modals, and legal pages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href={meta.livePath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all text-decoration-none"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Live Page</span>
            </a>
            <button
              type="button"
              onClick={() => handleResetPolicyTemplate(activePolicySubTab)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold transition-all cursor-pointer border-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Template</span>
            </button>
          </div>
        </div>

        {/* Clean Sub-Tab Pills */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
          {['terms', 'refund', 'privacy'].map((tabKey) => {
            const tMeta = subTabMeta[tabKey];
            const count = tabKey === 'terms' 
              ? (termsAndConditions.clauses?.length || 0) 
              : (tabKey === 'refund' ? (refundPolicy.clauses?.length || 0) : (privacyPolicy.clauses?.length || 0));
            const isActive = activePolicySubTab === tabKey;

            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActivePolicySubTab(tabKey)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none ${
                  isActive
                    ? tMeta.activeTabStyle
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <tMeta.icon className="w-3.5 h-3.5" />
                <span>{tMeta.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Policy Overview Settings (Clean, Compact, Minimal) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-800">Policy Information</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-400">{meta.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Last Updated:</span>
            <input
              type="text"
              value={currentPolicy.lastUpdated || ''}
              onChange={(e) => handleUpdatePolicyMeta(activePolicySubTab, 'lastUpdated', e.target.value)}
              placeholder="e.g. ৫ অক্টোবর, ২০২৬"
              className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 focus:border-[#5d5bf6] rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none transition-all w-44"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block">
              {meta.introLabel}
            </label>
            <textarea
              rows={2}
              value={activePolicySubTab === 'refund' ? (currentPolicy.notice || '') : (currentPolicy.intro || '')}
              onChange={(e) => handleUpdatePolicyMeta(activePolicySubTab, activePolicySubTab === 'refund' ? 'notice' : 'intro', e.target.value)}
              placeholder={meta.introPlaceholder}
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 focus:border-[#5d5bf6] rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium outline-none transition-all resize-y leading-relaxed"
            />
          </div>

          {activePolicySubTab === 'terms' ? (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 block">
                Agreement & Acceptance Note
              </label>
              <textarea
                rows={2}
                value={currentPolicy.agreementText || ''}
                onChange={(e) => handleUpdatePolicyMeta('terms', 'agreementText', e.target.value)}
                placeholder="Consent statement shown at bottom..."
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/80 focus:border-[#5d5bf6] rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium outline-none transition-all resize-y leading-relaxed"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Updates sync in real-time across student checkout modals and legal policy pages.</span>
            </div>
          )}
        </div>
      </div>

      {/* Policy Clauses (Ultra-Clean, Minimal, Modern) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold text-slate-800 tracking-wide uppercase">
              Clauses & Sections
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
              {clauses.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleAddClause(activePolicySubTab)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5d5bf6] hover:bg-[#4d4be6] text-white text-xs font-bold transition-all cursor-pointer border-none shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Section</span>
          </button>
        </div>

        {clauses.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <p className="text-xs font-bold text-slate-600">No clauses in this policy</p>
            <button
              type="button"
              onClick={() => handleAddClause(activePolicySubTab)}
              className="px-4 py-1.5 rounded-lg bg-[#5d5bf6] text-white text-xs font-bold border-none cursor-pointer"
            >
              Add First Section
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {clauses.map((clause, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === clauses.length - 1;
              const pointsText = Array.isArray(clause.points) 
                ? clause.points.join('\n') 
                : (clause.content || clause.text || '');

              return (
                <div
                  key={clause.id || idx}
                  className="bg-white hover:bg-slate-50/50 rounded-xl p-3.5 sm:p-4 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2.5 group"
                >
                  {/* Integrated Header Row: Number + Editable Title + Controls */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px] font-black flex items-center justify-center shrink-0 border border-slate-200/80">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <input
                        type="text"
                        value={clause.title || ''}
                        onChange={(e) => handleUpdateClause(activePolicySubTab, idx, 'title', e.target.value)}
                        placeholder="Section Title (e.g. 1. Account & Security)"
                        className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-[#5d5bf6] text-xs font-bold text-slate-900 py-1 px-1.5 outline-none transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveClause(activePolicySubTab, idx, 'up')}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 cursor-pointer border-none bg-transparent transition-colors"
                        title="Move earlier"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveClause(activePolicySubTab, idx, 'down')}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 cursor-pointer border-none bg-transparent transition-colors"
                        title="Move later"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClause(activePolicySubTab, idx)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer border-none bg-transparent transition-colors ml-1"
                        title="Delete section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content Textarea (Clean, borderless-feel or light border) */}
                  <textarea
                    rows={Math.max(2, (pointsText.split('\n').length || 1))}
                    value={pointsText}
                    onChange={(e) => handleUpdateClause(activePolicySubTab, idx, 'pointsText', e.target.value)}
                    placeholder="Enter points or paragraphs (one item per line)..."
                    className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/70 focus:border-[#5d5bf6] rounded-lg p-2.5 text-xs text-slate-800 font-normal leading-relaxed outline-none transition-all resize-y"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
