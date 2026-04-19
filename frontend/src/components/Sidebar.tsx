import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  ChevronDown, ChevronRight, Loader2, AlertCircle,
  LayoutDashboard, Banknote, Receipt, TrendingUp,
  Flame, Building2, BarChart3, Sliders, PieChart,
  Settings, Wand2,
} from 'lucide-react';
import { useFireStore } from '../store/useStore';
import * as api from '../api/client';

// ── Nav definition ────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

interface SectionProps { title: string; children: React.ReactNode; defaultOpen?: boolean }
const Section: React.FC<SectionProps> = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-dark-border/60">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-dark-muted uppercase tracking-wide hover:text-dark-text transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  );
};

interface FieldProps { label: string; help?: string; children: React.ReactNode }
const Field: React.FC<FieldProps> = ({ label, help, children }) => (
  <div className="flex flex-col gap-0.5">
    <label className="text-xs text-dark-muted cursor-help" title={help}>
      {label}{help && <span className="ml-1 opacity-40">ⓘ</span>}
    </label>
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

interface SidebarProps { onOpenWizard: () => void }

export const Sidebar: React.FC<SidebarProps> = ({ onOpenWizard }) => {
  const { params, setParams, expenses, displayReal, toggleDisplayReal, setBaseResult, activeTab, setActiveTab } = useFireStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const num = (field: keyof typeof params, label: string, min?: number, max?: number, step?: string | number, suffix?: string, help?: string) => (
    <Field label={suffix ? `${label} (${suffix})` : label} help={help}>
      <input type="number" className="input-field" value={params[field] as number}
        min={min} max={max} step={step ?? 'any'}
        onChange={e => setParams({ [field]: parseFloat(e.target.value) || 0 } as any)} />
    </Field>
  );

  return (
    <div className="flex flex-col h-full">

      {/* App title */}
      <div className="px-4 py-4 border-b border-dark-border">
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-accent-orange" />
          <span className="text-sm font-bold text-dark-text tracking-tight">FIRE Planner</span>
          <span className="text-xs text-dark-muted ml-1">IT</span>
        </div>
      </div>

      {/* Vertical navigation */}
      <nav className="px-2 py-3 border-b border-dark-border space-y-4">
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

      {/* Setup wizard banner */}
      <div className="px-3 py-3 border-b border-dark-border">
        <button
          onClick={onOpenWizard}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-accent-orange/30 bg-accent-orange/5 hover:bg-accent-orange/10 transition-colors text-left"
        >
          <div className="p-1.5 rounded-md bg-accent-orange/20 shrink-0">
            <Wand2 size={14} className="text-accent-orange" />
          </div>
          <div>
            <p className="text-xs font-semibold text-dark-text">Profile Setup Wizard</p>
            <p className="text-[10px] text-dark-muted mt-0.5">Quickly configure your key parameters</p>
          </div>
        </button>
      </div>

      {/* Run + controls */}
      <div className="px-3 py-3 border-b border-dark-border space-y-2">
        {errorMsg && (
          <div className="flex items-start gap-2 bg-accent-red/10 border border-accent-red/30 rounded-md px-3 py-2">
            <AlertCircle size={13} className="text-accent-red mt-0.5 shrink-0" />
            <span className="text-xs text-accent-red">{errorMsg}</span>
          </div>
        )}
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-md transition-colors"
        >
          {mutation.isPending ? <><Loader2 size={13} className="animate-spin" />Computing…</> : '▶  Run Computation'}
        </button>
        <button onClick={toggleDisplayReal}
          className={`w-full text-xs px-2.5 py-1 rounded transition-colors border ${
            displayReal ? 'bg-accent-blue/15 text-accent-blue border-accent-blue/30' : 'bg-transparent text-dark-muted border-dark-border'
          }`}>
          {displayReal ? 'Showing: Real (today\'s €)' : 'Showing: Nominal'}
        </button>
      </div>

      {/* Parameters */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 flex items-center gap-1.5 border-b border-dark-border">
          <Settings size={12} className="text-dark-muted" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-dark-muted/60">Parameters</span>
        </div>

        <Section title="Personal">
          {num('current_age', 'Current Age', 18, 70, 1, undefined, 'Your current age')}
          {num('target_age', 'Target Age', 70, 100, 1, undefined, 'Projection end age — use life expectancy or a conservative upper bound')}
          {num('age_started_working', 'Age Started Working', 16, 50, 1, undefined, 'First job age — used to compute INPS contribution years for the state pension')}
        </Section>

        <Section title="Salary & Tax">
          {num('ral', 'Gross Annual Salary (RAL)', 10000, 200000, 100, undefined, 'Reddito Annuo Lordo — gross salary before taxes')}
          {num('company_benefits', 'Welfare / Benefits', 0, 20000, 100, '€', 'Company welfare/fringe benefits. Taxed at flat 5% in Italy')}
          {num('inps_employee_rate', 'INPS Employee Rate', 0, 20, 0.01, '%', 'Employee INPS contribution rate — 9.19% for most private-sector workers')}
          {num('surcharges_rate', 'Regional/Municipal Surcharges', 0, 10, 0.01, '%', 'Addizionale regionale + comunale — typically 1–3%')}
        </Section>

        <Section title="ETF / Investments">
          {num('etf_value', 'Current ETF Value', 0, 2000000, 1000, '€', 'Current market value of your investment portfolio')}
          {num('monthly_pac', 'Monthly Investment (PAC)', 0, 5000, 50, '€/mo', 'Monthly amount invested into ETFs')}
          {num('expected_gross_return', 'Expected Gross Return', 1, 20, 0.1, '%', 'Expected annual return before fees. Net = Gross − TER − IVAFE')}
          {num('ter', 'Fund TER', 0, 2, 0.01, '%', 'Total Expense Ratio — annual fund management fee')}
          {num('ivafe', 'IVAFE', 0, 1, 0.01, '%', '0.2% annual wealth tax on foreign financial assets')}
          {num('capital_gains_tax', 'Capital Gains Tax', 0, 50, 0.5, '%', 'Italian CGT on ETF profits — standard 26%')}
        </Section>

        <Section title="Bank Account" defaultOpen={false}>
          {num('bank_balance', 'Bank Balance', 0, 500000, 1000, '€', 'Current bank/savings account balance')}
          {num('bank_interest', 'Interest Rate', 0, 10, 0.01, '%', 'Annual interest rate on your savings account')}
          {num('emergency_fund', 'Emergency Fund', 0, 100000, 1000, '€', 'Cash reserve kept aside — not counted as investable assets')}
          {num('stamp_duty', 'Annual Stamp Duty', 0, 100, 0.1, '€', 'Imposta di bollo — €34.20/year for accounts above €5,000')}
        </Section>

        <Section title="Pension Fund & TFR" defaultOpen={false}>
          <Field label="TFR Destination" help="Where your TFR severance pay is directed">
            <select className="input-field" value={params.tfr_destination}
              onChange={e => setParams({ tfr_destination: e.target.value as 'fund' | 'company' })}>
              <option value="fund">Pension Fund</option>
              <option value="company">Company</option>
            </select>
          </Field>
          {num('pf_value', 'Pension Fund Value', 0, 500000, 1000, '€', 'Current accumulated value of your pension fund')}
          <Field label="TFR %" help="By law ≈ 6.91% of RAL (RAL / 13.5 − 0.50%)">
            <div className="flex gap-1 items-center">
              <input type="number" className="input-field flex-1" value={params.tfr_pct} min={0} max={15} step={0.01}
                onChange={e => setParams({ tfr_pct: parseFloat(e.target.value) || 0 })} />
              <span className="text-xs text-dark-muted whitespace-nowrap">€{params.tfr_contribution}/yr</span>
            </div>
          </Field>
          {params.tfr_destination === 'company' && num('tfr_company_value', 'TFR at Company', 0, 200000, 1000, '€', 'TFR balance accumulated at your company')}
          <Field label="Employer Contribution %" help="Employer's pension fund contribution as % of RAL">
            <div className="flex gap-1 items-center">
              <input type="number" className="input-field flex-1" value={params.employer_pct} min={0} max={20} step={0.1}
                onChange={e => setParams({ employer_pct: parseFloat(e.target.value) || 0 })} />
              <span className="text-xs text-dark-muted whitespace-nowrap">€{params.employer_contribution}/yr</span>
            </div>
          </Field>
          <Field label="Personal Contribution %" help="Your mandatory pension contribution as % of RAL">
            <div className="flex gap-1 items-center">
              <input type="number" className="input-field flex-1" value={params.personal_pct} min={0} max={20} step={0.1}
                onChange={e => setParams({ personal_pct: parseFloat(e.target.value) || 0 })} />
              <span className="text-xs text-dark-muted whitespace-nowrap">€{params.personal_contribution}/yr</span>
            </div>
          </Field>
          {num('voluntary_extra', 'Voluntary Extra', 0, 20000, 100, '€/yr', 'Extra voluntary contribution — tax-deductible up to €5,164.57/year')}
          {num('fund_return', 'Fund Return', 0, 15, 0.1, '%', 'Expected annual return of the pension fund')}
          {num('annuity_rate', 'Annuity Rate', 0, 10, 0.1, '%', 'Conversion rate for accumulated capital to annual pension (typically 4–6%)')}
          {num('age_joined_fund', 'Age Joined Fund', 18, 65, 1, undefined, 'Enrollment age — affects payout tax rate (lower with longer membership)')}
        </Section>

        <Section title="Macro" defaultOpen={false}>
          {num('inflation', 'Inflation', 0, 10, 0.1, '%', 'Expected average annual inflation rate')}
          {num('ral_growth', 'Annual Salary Growth', 0, 10, 0.1, '%', 'Expected salary growth rate per year')}
          {num('inps_contribution_rate', 'Total INPS Rate', 10, 40, 0.1, '%', 'Total INPS rate (employee + employer, ~33%)')}
          {num('gdp_revaluation_rate', 'GDP Revaluation Rate', 0, 5, 0.1, '%', 'Rate used to revalue INPS montante — linked to 5-year avg GDP growth')}
        </Section>

        <Section title="FIRE Scenario">
          {num('stop_working_age', 'Stop Working Age', params.current_age + 1, 70, 1, undefined, 'Age to stop full-time work')}
          <Field label="Part-time after FIRE" help="Part-time income after stopping full-time work">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={params.part_time} className="rounded"
                onChange={e => setParams({ part_time: e.target.checked })} />
              <span className="text-sm text-dark-text">Enable part-time</span>
            </label>
          </Field>
          {params.part_time && (<>
            {num('part_time_salary', 'Net Monthly', 0, 5000, 50, '€/mo', 'Net monthly part-time income')}
            {num('part_time_monthly_gross', 'Gross Monthly', 0, 10000, 50, '€/mo', 'Gross monthly (used for INPS contribution calc)')}
            {num('part_time_until_age', 'Until Age', params.stop_working_age, 80, 1, undefined, 'Age to stop part-time work')}
          </>)}
          <Field label="NASPI" help="Unemployment benefit after stopping work — 75% of avg monthly salary, cap €1,550/mo, −3%/mo after month 3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={params.naspi_enabled} className="rounded"
                onChange={e => setParams({ naspi_enabled: e.target.checked })} />
              <span className="text-sm text-dark-text">Enable NASPI</span>
            </label>
          </Field>
          {params.naspi_enabled && (<>
            {num('naspi_months', 'Duration (months)', 1, 24, 1, undefined, 'Max 24 months for workers with 4+ years of contributions')}
            <p className="text-xs text-dark-muted">≈ €{Math.min(params.ral / 13 * 0.75, 1550).toFixed(0)}/mo gross (capped at €1,550)</p>
          </>)}
          {num('swr', 'Safe Withdrawal Rate', 1, 10, 0.1, '%', '4% rule is common; 3–3.5% is more conservative for long retirements')}
        </Section>

        <Section title="State Pension" defaultOpen={false}>
          <Field label="Defer to age 71" help="Deferring increases the annual pension via higher conversion coefficient">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={params.defer_to_71} className="rounded"
                onChange={e => setParams({ defer_to_71: e.target.checked })} />
              <span className="text-sm text-dark-text">Defer to 71</span>
            </label>
          </Field>
          <Field label="Early pension (anticipata)" help="Allows retiring early with enough contribution years (~41y 10m for men)">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={params.early_pension_enabled} className="rounded"
                onChange={e => setParams({ early_pension_enabled: e.target.checked })} />
              <span className="text-sm text-dark-text">Enable anticipata</span>
            </label>
          </Field>
          {params.early_pension_enabled && num('early_pension_years', 'Contribution Years Required', 20, 45, 1)}
          <Field label="Fornero life expectancy adjustment">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={params.le_adjustment} className="rounded"
                onChange={e => setParams({ le_adjustment: e.target.checked })} />
              <span className="text-sm text-dark-text">Apply adjustment</span>
            </label>
          </Field>
        </Section>

        <Section title="Monte Carlo" defaultOpen={false}>
          {num('n_simulations', 'Simulations', 100, 5000, 100, undefined, 'More = more stable results but slower')}
          {num('etf_volatility', 'ETF Volatility', 5, 40, 0.5, '%', 'Annual std dev of ETF returns — MSCI World ≈ 15–17%')}
          {num('pf_volatility', 'Pension Fund Volatility', 0, 20, 0.5, '%', 'Typically 3–7% for bond-heavy pension funds')}
          {num('inflation_std', 'Inflation Std Dev', 0, 5, 0.1, '%', 'Randomness added to annual inflation')}
          <Field label="MC Scenario">
            <select className="input-field" value={params.mc_scenario}
              onChange={e => setParams({ mc_scenario: e.target.value })}>
              {['Normal', 'Moderate Stress', 'Severe Stress', 'Historical Bootstrap', 'Hybrid'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </Section>

      </div>
    </div>
  );
};
