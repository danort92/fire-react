import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Loader2, AlertCircle,
  LayoutDashboard, Banknote, Receipt, TrendingUp,
  Flame, Building2, BarChart3, Sliders, PieChart,
  SlidersHorizontal,
} from 'lucide-react';
import { useFireStore } from '../store/useStore';
import * as api from '../api/client';
import { ParamsModal } from './ParamsModal';

const NAV = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard',   icon: LayoutDashboard, label: 'Overview' },
      { id: 'salary',      icon: Banknote,         label: 'My Paycheck' },
      { id: 'expenses',    icon: Receipt,           label: 'My Expenses' },
      { id: 'projections', icon: TrendingUp,        label: 'Wealth Projection' },
    ],
  },
  {
    group: 'Retirement',
    items: [
      { id: 'fire',    icon: Flame,     label: 'When Can I Retire?' },
      { id: 'pension', icon: Building2, label: 'Pension' },
    ],
  },
  {
    group: 'Analysis',
    items: [
      { id: 'scenarios',   icon: BarChart3, label: 'Scenarios & Risk' },
      { id: 'sensitivity', icon: Sliders,   label: 'What-If Analysis' },
      { id: 'etf',         icon: PieChart,  label: 'ETF Explorer' },
    ],
  },
];

interface SidebarProps { onOpenWizard: () => void }

export const Sidebar: React.FC<SidebarProps> = ({ onOpenWizard }) => {
  const { params, setParams, expenses, displayReal, toggleDisplayReal, setBaseResult, activeTab, setActiveTab } = useFireStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paramsOpen, setParamsOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.computeBase(params, expenses),
    onSuccess: (data) => { setBaseResult(data); setErrorMsg(null); },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.detail || err?.message || 'Computation failed');
    },
  });

  useEffect(() => { mutation.mutate(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    setParams({
      tfr_contribution: Math.round(params.ral * params.tfr_pct / 100),
      employer_contribution: Math.round(params.ral * params.employer_pct / 100),
      personal_contribution: Math.round(params.ral * params.personal_pct / 100),
    }); /* eslint-disable-next-line */
  }, [params.ral, params.tfr_pct, params.employer_pct, params.personal_pct]);

  return (
    <>
      <div className="flex flex-col h-full">

        {/* App title */}
        <div className="px-4 py-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-accent-orange" />
            <span className="text-sm font-bold text-dark-text tracking-tight">FIRE Planner</span>
            <span className="text-xs text-dark-muted ml-1">IT</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
          {NAV.map(group => (
            <div key={group.group}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-dark-muted/50 px-2 mb-1">{group.group}</p>
              {group.items.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    activeTab === id
                      ? 'bg-accent-blue/15 text-accent-blue font-medium'
                      : 'text-dark-muted hover:text-dark-text hover:bg-dark-border/40'
                  }`}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Controls */}
        <div className="px-3 py-4 border-t border-dark-border space-y-2">
          {errorMsg && (
            <div className="flex items-start gap-2 bg-accent-red/10 border border-accent-red/30 rounded-md px-3 py-2">
              <AlertCircle size={13} className="text-accent-red mt-0.5 shrink-0" />
              <span className="text-xs text-accent-red">{errorMsg}</span>
            </div>
          )}

          {/* Parameters button */}
          <button
            onClick={() => setParamsOpen(true)}
            className="w-full flex items-center justify-center gap-2 border border-dark-border hover:border-accent-blue/50 hover:bg-accent-blue/5 text-dark-text text-sm font-medium py-2 rounded-md transition-colors"
          >
            <SlidersHorizontal size={14} />
            Parameters
          </button>

          {/* Run */}
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-md transition-colors"
          >
            {mutation.isPending
              ? <><Loader2 size={13} className="animate-spin" />Computing…</>
              : '▶  Run Computation'}
          </button>

          {/* Real / Nominal */}
          <button
            onClick={toggleDisplayReal}
            className={`w-full text-xs px-2.5 py-1.5 rounded-md transition-colors border ${
              displayReal
                ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/30'
                : 'bg-transparent text-dark-muted border-dark-border'
            }`}
          >
            {displayReal ? 'Showing: Real (today\'s €)' : 'Showing: Nominal'}
          </button>
        </div>

      </div>

      <ParamsModal
        isOpen={paramsOpen}
        onClose={() => setParamsOpen(false)}
        onOpenWizard={onOpenWizard}
      />
    </>
  );
};
