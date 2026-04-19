import React, { useState } from 'react';
import { X, User, Banknote, TrendingUp, Building2, Flame, Settings } from 'lucide-react';
import { useFireStore } from '../store/useStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenWizard: () => void;
}

const SECTIONS = [
  { id: 'personal',    icon: User,       label: 'Personal' },
  { id: 'income',      icon: Banknote,   label: 'Income & Tax' },
  { id: 'investments', icon: TrendingUp, label: 'Investments' },
  { id: 'pension',     icon: Building2,  label: 'Pension & TFR' },
  { id: 'fire',        icon: Flame,      label: 'FIRE & Scenario' },
  { id: 'advanced',    icon: Settings,   label: 'Advanced' },
];

const Field: React.FC<{ label: string; help?: string; children: React.ReactNode }> = ({ label, help, children }) => (
  <div>
    <label className="block text-xs text-dark-muted mb-1.5" title={help}>
      {label}{help && <span className="ml-1 opacity-40 cursor-help">ⓘ</span>}
    </label>
    {children}
  </div>
);

const Sub: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-dark-muted/60 shrink-0">{title}</span>
      <div className="flex-1 h-px bg-dark-border/50" />
    </div>
    {children}
  </div>
);

const Toggle: React.FC<{ label: string; help?: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, help, checked, onChange }) => (
  <label className="flex items-center gap-2.5 cursor-pointer group" title={help}>
    <input type="checkbox" checked={checked} className="rounded shrink-0"
      onChange={e => onChange(e.target.checked)} />
    <span className="text-sm text-dark-text group-hover:text-white transition-colors">{label}</span>
    {help && <span className="text-dark-muted/50 text-xs cursor-help">ⓘ</span>}
  </label>
);

export const ParamsModal: React.FC<Props> = ({ isOpen, onClose, onOpenWizard }) => {
  const { params, setParams } = useFireStore();
  const [section, setSection] = useState('personal');

  if (!isOpen) return null;

  const n = (field: keyof typeof params, label: string, min?: number, max?: number, step?: number | string, suffix?: string, help?: string) => (
    <Field label={suffix ? `${label} (${suffix})` : label} help={help}>
      <input type="number" className="input-field" value={params[field] as number}
        min={min} max={max} step={step ?? 'any'}
        onChange={e => setParams({ [field]: parseFloat(e.target.value) || 0 } as any)} />
    </Field>
  );

  const g2 = 'grid grid-cols-2 gap-x-6 gap-y-5';
  const g3 = 'grid grid-cols-3 gap-x-6 gap-y-5';

  const renderSection = () => {
    switch (section) {

      case 'personal': return (
        <div className="space-y-6">
          <div className={g3}>
            {n('current_age',        'Current Age',          18, 70,  1)}
            {n('target_age',         'Projection End Age',   70, 100, 1, undefined, 'Use life expectancy or a conservative upper bound')}
            {n('age_started_working','Age Started Working',  16, 50,  1, undefined, 'Used to compute INPS contribution years for the state pension')}
          </div>
        </div>
      );

      case 'income': return (
        <div className="space-y-6">
          <div className={g2}>
            {n('ral',              'Gross Annual Salary (RAL)', 10000,  200000, 100,  '€',   'Reddito Annuo Lordo — gross salary before taxes')}
            {n('company_benefits', 'Welfare / Benefits',        0,      20000,  100,  '€',   'Company fringe benefits — taxed at flat 5%')}
            {n('inps_employee_rate','INPS Employee Rate',        0,      20,     0.01, '%',   '9.19% for most private-sector workers')}
            {n('surcharges_rate',  'Regional Surcharges',       0,      10,     0.01, '%',   'Addizionale regionale + comunale — typically 1–3%')}
          </div>
        </div>
      );

      case 'investments': return (
        <div className="space-y-8">
          <Sub title="ETF / Portfolio">
            <div className={g3}>
              {n('etf_value',           'Portfolio Value',      0, 2000000, 1000, '€',    'Current market value of your investment portfolio')}
              {n('monthly_pac',         'Monthly PAC',          0, 5000,    50,   '€/mo', 'Monthly amount invested into ETFs')}
              {n('expected_gross_return','Expected Return',      1, 20,      0.1,  '%',    'Expected annual return before fees and taxes')}
              {n('ter',                 'Fund TER',             0, 2,       0.01, '%',    'Total Expense Ratio — annual fund management fee')}
              {n('ivafe',               'IVAFE',                0, 1,       0.01, '%',    '0.2% annual wealth tax on foreign financial assets')}
              {n('capital_gains_tax',   'Capital Gains Tax',    0, 50,      0.5,  '%',    'Italian CGT on ETF profits — standard 26%')}
            </div>
          </Sub>
          <Sub title="Bank Account">
            <div className={g2}>
              {n('bank_balance',   'Bank Balance',    0, 500000, 1000, '€',  'Current bank / savings account balance')}
              {n('bank_interest',  'Interest Rate',   0, 10,     0.01, '%',  'Annual interest rate on your savings account')}
              {n('emergency_fund', 'Emergency Fund',  0, 100000, 1000, '€',  'Cash reserve kept aside — not counted as investable assets')}
              {n('stamp_duty',     'Annual Stamp Duty',0, 100,   0.1,  '€',  'Imposta di bollo — €34.20/year for accounts above €5,000')}
            </div>
          </Sub>
        </div>
      );

      case 'pension': return (
        <div className="space-y-8">
          <div className="space-y-5">
            <Field label="TFR Destination" help="Where your TFR severance pay is directed">
              <div className="flex gap-6 mt-0.5">
                {(['fund', 'company'] as const).map(v => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tfr_dest" checked={params.tfr_destination === v}
                      onChange={() => setParams({ tfr_destination: v })} />
                    <span className="text-sm text-dark-text">{v === 'fund' ? 'Pension Fund' : 'Company'}</span>
                  </label>
                ))}
              </div>
            </Field>
            <div className={g2}>
              {n('pf_value', 'Pension Fund Value', 0, 500000, 1000, '€', 'Current accumulated value of your pension fund')}
              {params.tfr_destination === 'company' && n('tfr_company_value', 'TFR at Company', 0, 200000, 1000, '€', 'TFR balance held at your employer')}
            </div>
          </div>

          <Sub title="Contribution Rates">
            <div className={g3}>
              <Field label="TFR %" help="By law ≈ 6.91% of RAL (RAL / 13.5 − 0.50%)">
                <div className="flex gap-1.5 items-center">
                  <input type="number" className="input-field flex-1 min-w-0" value={params.tfr_pct} min={0} max={15} step={0.01}
                    onChange={e => setParams({ tfr_pct: parseFloat(e.target.value) || 0 })} />
                  <span className="text-xs text-dark-muted shrink-0">€{params.tfr_contribution}/yr</span>
                </div>
              </Field>
              <Field label="Employer %" help="Employer's pension fund contribution as % of RAL">
                <div className="flex gap-1.5 items-center">
                  <input type="number" className="input-field flex-1 min-w-0" value={params.employer_pct} min={0} max={20} step={0.1}
                    onChange={e => setParams({ employer_pct: parseFloat(e.target.value) || 0 })} />
                  <span className="text-xs text-dark-muted shrink-0">€{params.employer_contribution}/yr</span>
                </div>
              </Field>
              <Field label="Personal %" help="Your mandatory pension contribution as % of RAL">
                <div className="flex gap-1.5 items-center">
                  <input type="number" className="input-field flex-1 min-w-0" value={params.personal_pct} min={0} max={20} step={0.1}
                    onChange={e => setParams({ personal_pct: parseFloat(e.target.value) || 0 })} />
                  <span className="text-xs text-dark-muted shrink-0">€{params.personal_contribution}/yr</span>
                </div>
              </Field>
            </div>
            <div className="mt-5">
              {n('voluntary_extra', 'Voluntary Extra Contribution', 0, 20000, 100, '€/yr', 'Extra voluntary contribution — tax-deductible up to €5,164.57/year')}
            </div>
          </Sub>

          <Sub title="Fund Assumptions">
            <div className={g3}>
              {n('fund_return',    'Expected Fund Return', 0, 15, 0.1, '%', 'Expected annual return of the pension fund')}
              {n('annuity_rate',   'Annuity Rate',         0, 10, 0.1, '%', 'Rate to convert accumulated capital to annual pension (typically 4–6%)')}
              {n('age_joined_fund','Age Joined Fund',      18, 65, 1,  undefined, 'Enrollment age — affects payout tax rate')}
            </div>
          </Sub>
        </div>
      );

      case 'fire': return (
        <div className="space-y-8">
          <div className={g2}>
            {n('stop_working_age', 'Target Retirement Age', params.current_age + 1, 70, 1, undefined, 'Age to stop full-time work')}
            {n('swr', 'Safe Withdrawal Rate', 1, 10, 0.1, '%', '4% rule is common; 3–3.5% is more conservative')}
          </div>

          <Sub title="Part-time after FIRE">
            <div className="space-y-4">
              <Toggle label="Work part-time after stopping full-time"
                checked={params.part_time} onChange={v => setParams({ part_time: v })} />
              {params.part_time && (
                <div className={g3}>
                  {n('part_time_salary',       'Net Monthly',   0, 5000,  50, '€/mo', 'Net monthly part-time income')}
                  {n('part_time_monthly_gross', 'Gross Monthly', 0, 10000, 50, '€/mo', 'Gross monthly — used for INPS contribution calculation')}
                  {n('part_time_until_age',     'Until Age',     params.stop_working_age, 80, 1, undefined, 'Age to stop part-time work')}
                </div>
              )}
            </div>
          </Sub>

          <Sub title="NASPI (Unemployment Benefit)">
            <div className="space-y-4">
              <Toggle label="Simulate NASPI income after stopping work"
                help="75% of avg monthly salary, capped at €1,550/mo, −3%/mo after month 3"
                checked={params.naspi_enabled} onChange={v => setParams({ naspi_enabled: v })} />
              {params.naspi_enabled && (
                <div className={g2}>
                  {n('naspi_months', 'Duration', 1, 24, 1, 'months', 'Max 24 months for workers with 4+ years of contributions')}
                  <Field label="Estimated gross amount">
                    <p className="text-sm text-accent-green font-medium py-1.5">
                      ≈ €{Math.min(params.ral / 13 * 0.75, 1550).toFixed(0)}/mo
                      <span className="text-dark-muted font-normal text-xs ml-1">(cap €1,550)</span>
                    </p>
                  </Field>
                </div>
              )}
            </div>
          </Sub>
        </div>
      );

      case 'advanced': return (
        <div className="space-y-8">
          <Sub title="State Pension (INPS)">
            <div className="space-y-3">
              <Toggle label="Defer pension to age 71"
                help="Higher conversion coefficient = larger annual pension"
                checked={params.defer_to_71} onChange={v => setParams({ defer_to_71: v })} />
              <Toggle label="Enable pensione anticipata"
                help="Retire early with enough contribution years (~41y 10m for men)"
                checked={params.early_pension_enabled} onChange={v => setParams({ early_pension_enabled: v })} />
              {params.early_pension_enabled && (
                <div className="pl-6">
                  {n('early_pension_years', 'Contribution Years Required', 20, 45, 1)}
                </div>
              )}
              <Toggle label="Apply Fornero life expectancy adjustment"
                checked={params.le_adjustment} onChange={v => setParams({ le_adjustment: v })} />
            </div>
          </Sub>

          <Sub title="Macro Assumptions">
            <div className={g2}>
              {n('inflation',             'Inflation',           0, 10, 0.1, '%', 'Expected average annual inflation rate')}
              {n('ral_growth',            'Annual Salary Growth', 0, 10, 0.1, '%', 'Expected salary growth rate per year')}
              {n('inps_contribution_rate','Total INPS Rate',     10, 40, 0.1, '%', 'Total INPS rate (employee + employer, ~33%)')}
              {n('gdp_revaluation_rate',  'GDP Revaluation Rate', 0,  5, 0.1, '%', 'Rate to revalue INPS montante — linked to 5-year avg GDP growth')}
            </div>
          </Sub>

          <Sub title="Monte Carlo">
            <div className={g2}>
              {n('n_simulations',  'Simulations',            100, 5000, 100, undefined, 'More = more stable results but slower')}
              {n('etf_volatility', 'ETF Volatility',         5,   40,   0.5, '%', 'Annual std dev of ETF returns — MSCI World ≈ 15–17%')}
              {n('pf_volatility',  'Pension Fund Volatility', 0,  20,   0.5, '%', 'Typically 3–7% for bond-heavy pension funds')}
              {n('inflation_std',  'Inflation Std Dev',       0,   5,   0.1, '%', 'Randomness added to annual inflation')}
            </div>
            <div className="mt-5">
              <Field label="MC Scenario">
                <select className="input-field" value={params.mc_scenario}
                  onChange={e => setParams({ mc_scenario: e.target.value })}>
                  {['Normal', 'Moderate Stress', 'Severe Stress', 'Historical Bootstrap', 'Hybrid'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Sub>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-card border border-dark-border rounded-xl shadow-2xl flex flex-col"
        style={{ width: 820, maxWidth: '95vw', height: '82vh', maxHeight: 700 }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-dark-text">Parameters</h2>
            <p className="text-xs text-dark-muted mt-0.5">Edit your financial profile and assumptions</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-md hover:bg-dark-border/50 text-dark-muted hover:text-dark-text transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left tab nav */}
          <div className="w-44 shrink-0 border-r border-dark-border py-3 px-2 flex flex-col gap-0.5">
            {SECTIONS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setSection(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                  section === id
                    ? 'bg-accent-blue/15 text-accent-blue font-medium'
                    : 'text-dark-muted hover:text-dark-text hover:bg-dark-border/40'
                }`}>
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {renderSection()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-dark-border shrink-0">
          <button onClick={() => { onClose(); onOpenWizard(); }}
            className="text-xs text-dark-muted hover:text-dark-text transition-colors">
            ↺ Re-run setup wizard
          </button>
          <button onClick={onClose}
            className="px-5 py-1.5 text-sm bg-accent-blue hover:bg-accent-blue/80 text-white rounded-md transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
