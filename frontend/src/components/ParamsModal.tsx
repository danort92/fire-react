import React, { useState } from 'react';
import { X, User, Banknote, TrendingUp, Building2, Flame, Settings } from 'lucide-react';
import { useFireStore } from '../store/useStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenWizard: () => void;
}

const SECTIONS = [
  { id: 'personal',     icon: User,       label: 'Personal' },
  { id: 'income',       icon: Banknote,   label: 'Income & Tax' },
  { id: 'investments',  icon: TrendingUp, label: 'Investments' },
  { id: 'pension',      icon: Building2,  label: 'Pension & TFR' },
  { id: 'fire',         icon: Flame,      label: 'FIRE & Scenario' },
  { id: 'advanced',     icon: Settings,   label: 'Advanced' },
];

const Field: React.FC<{ label: string; help?: string; span2?: boolean; children: React.ReactNode }> = ({ label, help, span2, children }) => (
  <div className={span2 ? 'col-span-2' : ''}>
    <label className="block text-xs text-dark-muted mb-1.5" title={help}>
      {label}{help && <span className="ml-1 opacity-40 cursor-help">ⓘ</span>}
    </label>
    {children}
  </div>
);

const Divider: React.FC<{ label: string }> = ({ label }) => (
  <div className="col-span-2 flex items-center gap-3 pt-3 pb-1">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-dark-muted/60">{label}</span>
    <div className="flex-1 h-px bg-dark-border/50" />
  </div>
);

export const ParamsModal: React.FC<Props> = ({ isOpen, onClose, onOpenWizard }) => {
  const { params, setParams } = useFireStore();
  const [section, setSection] = useState('personal');

  if (!isOpen) return null;

  const num = (
    field: keyof typeof params,
    label: string,
    min?: number, max?: number, step?: number | string,
    suffix?: string, help?: string, span2?: boolean,
  ) => (
    <Field label={suffix ? `${label} (${suffix})` : label} help={help} span2={span2}>
      <input
        type="number" className="input-field w-full"
        value={params[field] as number}
        min={min} max={max} step={step ?? 'any'}
        onChange={e => setParams({ [field]: parseFloat(e.target.value) || 0 } as any)}
      />
    </Field>
  );

  const renderSection = () => {
    switch (section) {

      case 'personal': return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {num('current_age', 'Current Age', 18, 70, 1, undefined, 'Your current age')}
          {num('target_age', 'Projection End Age', 70, 100, 1, undefined, 'Use life expectancy or a conservative upper bound')}
          {num('age_started_working', 'Age Started Working', 16, 50, 1, undefined, 'First job age — used to compute INPS contribution years for the state pension')}
        </div>
      );

      case 'income': return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {num('ral', 'Gross Annual Salary (RAL)', 10000, 200000, 100, '€', 'Reddito Annuo Lordo — gross salary before taxes and contributions')}
          {num('company_benefits', 'Welfare / Benefits', 0, 20000, 100, '€', 'Company welfare / fringe benefits — taxed at flat 5% in Italy')}
          {num('inps_employee_rate', 'INPS Employee Rate', 0, 20, 0.01, '%', 'Employee INPS contribution — 9.19% for most private-sector workers')}
          {num('surcharges_rate', 'Regional Surcharges', 0, 10, 0.01, '%', 'Addizionale regionale + comunale — typically 1–3%')}
        </div>
      );

      case 'investments': return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <Divider label="ETF / Portfolio" />
          {num('etf_value', 'Current Portfolio Value', 0, 2000000, 1000, '€', 'Current market value of your investment portfolio')}
          {num('monthly_pac', 'Monthly Investment (PAC)', 0, 5000, 50, '€/mo', 'Monthly amount invested into ETFs')}
          {num('expected_gross_return', 'Expected Gross Return', 1, 20, 0.1, '%', 'Expected annual return before fees and taxes')}
          {num('ter', 'Fund TER', 0, 2, 0.01, '%', 'Total Expense Ratio — annual fund management fee')}
          {num('ivafe', 'IVAFE', 0, 1, 0.01, '%', '0.2% annual wealth tax on foreign financial assets')}
          {num('capital_gains_tax', 'Capital Gains Tax', 0, 50, 0.5, '%', 'Italian CGT on ETF profits — standard 26%')}
          <Divider label="Bank Account" />
          {num('bank_balance', 'Bank Balance', 0, 500000, 1000, '€', 'Current bank / savings account balance')}
          {num('bank_interest', 'Interest Rate', 0, 10, 0.01, '%', 'Annual interest rate on your savings account')}
          {num('emergency_fund', 'Emergency Fund', 0, 100000, 1000, '€', 'Cash reserve kept aside — not counted as investable assets')}
          {num('stamp_duty', 'Annual Stamp Duty', 0, 100, 0.1, '€', 'Imposta di bollo — €34.20/year for accounts above €5,000')}
        </div>
      );

      case 'pension': return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <Field label="TFR Destination" help="Where your TFR severance pay is directed" span2>
            <div className="flex gap-6">
              {(['fund', 'company'] as const).map(v => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tfr_dest" checked={params.tfr_destination === v}
                    onChange={() => setParams({ tfr_destination: v })} />
                  <span className="text-sm text-dark-text">{v === 'fund' ? 'Pension Fund' : 'Company'}</span>
                </label>
              ))}
            </div>
          </Field>
          {num('pf_value', 'Pension Fund Value', 0, 500000, 1000, '€', 'Current accumulated value of your pension fund')}
          {params.tfr_destination === 'company' && num('tfr_company_value', 'TFR at Company', 0, 200000, 1000, '€', 'TFR balance accumulated at your company')}
          <Divider label="Contribution Rates" />
          <Field label="TFR %" help="By law ≈ 6.91% of RAL (RAL / 13.5 − 0.50%)">
            <div className="flex gap-2 items-center">
              <input type="number" className="input-field flex-1" value={params.tfr_pct} min={0} max={15} step={0.01}
                onChange={e => setParams({ tfr_pct: parseFloat(e.target.value) || 0 })} />
              <span className="text-xs text-dark-muted shrink-0">= €{params.tfr_contribution}/yr</span>
            </div>
          </Field>
          <Field label="Employer Contribution %" help="Employer's pension fund contribution as % of RAL">
            <div className="flex gap-2 items-center">
              <input type="number" className="input-field flex-1" value={params.employer_pct} min={0} max={20} step={0.1}
                onChange={e => setParams({ employer_pct: parseFloat(e.target.value) || 0 })} />
              <span className="text-xs text-dark-muted shrink-0">= €{params.employer_contribution}/yr</span>
            </div>
          </Field>
          <Field label="Personal Contribution %" help="Your mandatory pension contribution as % of RAL">
            <div className="flex gap-2 items-center">
              <input type="number" className="input-field flex-1" value={params.personal_pct} min={0} max={20} step={0.1}
                onChange={e => setParams({ personal_pct: parseFloat(e.target.value) || 0 })} />
              <span className="text-xs text-dark-muted shrink-0">= €{params.personal_contribution}/yr</span>
            </div>
          </Field>
          {num('voluntary_extra', 'Voluntary Extra', 0, 20000, 100, '€/yr', 'Extra voluntary contribution — tax-deductible up to €5,164.57/year')}
          <Divider label="Fund Assumptions" />
          {num('fund_return', 'Expected Fund Return', 0, 15, 0.1, '%', 'Expected annual return of the pension fund')}
          {num('annuity_rate', 'Annuity Conversion Rate', 0, 10, 0.1, '%', 'Rate to convert accumulated capital to annual pension (typically 4–6%)')}
          {num('age_joined_fund', 'Age Joined Fund', 18, 65, 1, undefined, 'Enrollment age — affects payout tax rate (lower with longer membership)')}
        </div>
      );

      case 'fire': return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {num('stop_working_age', 'Target Retirement Age', params.current_age + 1, 70, 1, undefined, 'Age to stop full-time work')}
          {num('swr', 'Safe Withdrawal Rate', 1, 10, 0.1, '%', '4% rule is common; 3–3.5% is more conservative for long retirements')}
          <Divider label="Part-time after FIRE" />
          <Field label="Enable part-time" span2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={params.part_time} className="rounded"
                onChange={e => setParams({ part_time: e.target.checked })} />
              <span className="text-sm text-dark-text">Work part-time after stopping full-time</span>
            </label>
          </Field>
          {params.part_time && <>
            {num('part_time_salary', 'Net Monthly Income', 0, 5000, 50, '€/mo', 'Net monthly part-time income')}
            {num('part_time_monthly_gross', 'Gross Monthly Income', 0, 10000, 50, '€/mo', 'Gross monthly (used for INPS contribution calculation)')}
            {num('part_time_until_age', 'Until Age', params.stop_working_age, 80, 1, undefined, 'Age to stop part-time work')}
          </>}
          <Divider label="NASPI (Unemployment Benefit)" />
          <Field label="Enable NASPI" help="75% of avg monthly salary, capped at €1,550/mo, −3%/mo after month 3" span2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={params.naspi_enabled} className="rounded"
                onChange={e => setParams({ naspi_enabled: e.target.checked })} />
              <span className="text-sm text-dark-text">Simulate NASPI income after stopping work</span>
            </label>
          </Field>
          {params.naspi_enabled && <>
            {num('naspi_months', 'Duration', 1, 24, 1, 'months', 'Max 24 months for workers with 4+ years of contributions')}
            <Field label="Estimated gross amount">
              <p className="text-sm text-accent-green font-medium py-1.5">
                ≈ €{Math.min(params.ral / 13 * 0.75, 1550).toFixed(0)}/mo
                <span className="text-dark-muted font-normal ml-1">(capped at €1,550)</span>
              </p>
            </Field>
          </>}
        </div>
      );

      case 'advanced': return (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <Divider label="State Pension (INPS)" />
          <Field label="Defer pension to age 71" help="Higher conversion coefficient = larger annual pension" span2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={params.defer_to_71} className="rounded"
                onChange={e => setParams({ defer_to_71: e.target.checked })} />
              <span className="text-sm text-dark-text">Defer to age 71</span>
            </label>
          </Field>
          <Field label="Pensione anticipata" help="Retire early with enough contribution years (~41y 10m for men)" span2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={params.early_pension_enabled} className="rounded"
                onChange={e => setParams({ early_pension_enabled: e.target.checked })} />
              <span className="text-sm text-dark-text">Enable early pension</span>
            </label>
          </Field>
          {params.early_pension_enabled && num('early_pension_years', 'Contribution Years Required', 20, 45, 1)}
          <Field label="Fornero life expectancy adjustment" span2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={params.le_adjustment} className="rounded"
                onChange={e => setParams({ le_adjustment: e.target.checked })} />
              <span className="text-sm text-dark-text">Apply LE adjustment to pension age</span>
            </label>
          </Field>
          <Divider label="Macro Assumptions" />
          {num('inflation', 'Inflation', 0, 10, 0.1, '%', 'Expected average annual inflation rate')}
          {num('ral_growth', 'Annual Salary Growth', 0, 10, 0.1, '%', 'Expected salary growth rate per year')}
          {num('inps_contribution_rate', 'Total INPS Rate', 10, 40, 0.1, '%', 'Total INPS rate (employee + employer, ~33%)')}
          {num('gdp_revaluation_rate', 'GDP Revaluation Rate', 0, 5, 0.1, '%', 'Rate to revalue INPS montante — linked to 5-year avg GDP growth')}
          <Divider label="Monte Carlo" />
          {num('n_simulations', 'Simulations', 100, 5000, 100, undefined, 'More = more stable results but slower')}
          {num('etf_volatility', 'ETF Volatility', 5, 40, 0.5, '%', 'Annual std dev of ETF returns — MSCI World ≈ 15–17%')}
          {num('pf_volatility', 'Pension Fund Volatility', 0, 20, 0.5, '%', 'Typically 3–7% for bond-heavy pension funds')}
          {num('inflation_std', 'Inflation Std Dev', 0, 5, 0.1, '%', 'Randomness added to annual inflation')}
          <Field label="MC Scenario" span2>
            <select className="input-field w-full" value={params.mc_scenario}
              onChange={e => setParams({ mc_scenario: e.target.value })}>
              {['Normal', 'Moderate Stress', 'Severe Stress', 'Historical Bootstrap', 'Hybrid'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="bg-dark-card border border-dark-border rounded-xl shadow-2xl flex flex-col"
        style={{ width: 860, maxWidth: '95vw', height: '82vh', maxHeight: 720 }}
      >
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
          <button
            onClick={() => { onClose(); onOpenWizard(); }}
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
