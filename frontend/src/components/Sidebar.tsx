import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useFireStore } from '../store/useStore';
import * as api from '../api/client';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-dark-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-dark-text hover:bg-dark-border/30 transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  );
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
}
const Field: React.FC<FieldProps> = ({ label, children }) => (
  <div className="flex flex-col gap-0.5">
    <label className="text-xs text-dark-muted">{label}</label>
    {children}
  </div>
);

export const Sidebar: React.FC = () => {
  const { params, setParams, expenses, displayReal, toggleDisplayReal, setBaseResult } = useFireStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.computeBase(params, expenses),
    onSuccess: (data) => {
      setBaseResult(data);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.detail || err?.message || 'Computation failed');
    },
  });

  // Auto-run on mount
  useEffect(() => {
    mutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const num = (
    field: keyof typeof params,
    label: string,
    min?: number,
    max?: number,
    step?: string | number,
    suffix?: string
  ) => (
    <Field label={suffix ? `${label} ${suffix}` : label}>
      <input
        type="number"
        className="input-field"
        value={params[field] as number}
        min={min}
        max={max}
        step={step ?? 'any'}
        onChange={e => setParams({ [field]: parseFloat(e.target.value) || 0 } as any)}
      />
    </Field>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-border">
        <h2 className="text-sm font-semibold text-dark-text">Parameters</h2>
      </div>

      {/* Display mode toggle */}
      <div className="px-4 py-2 border-b border-dark-border flex items-center justify-between">
        <span className="text-xs text-dark-muted">Display</span>
        <button
          onClick={toggleDisplayReal}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            displayReal
              ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/40'
              : 'bg-dark-border text-dark-muted border border-dark-border'
          }`}
        >
          {displayReal ? 'Real (today\'s €)' : 'Nominal'}
        </button>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto">

        <Section title="👤 Personal">
          {num('current_age', 'Current Age', 18, 70, 1)}
          {num('target_age', 'Target Age', 70, 100, 1)}
          {num('age_started_working', 'Age Started Working', 16, 50, 1)}
        </Section>

        <Section title="💼 Salary & Tax">
          {num('ral', 'Gross Annual Salary (RAL)', 10000, 200000, 100)}
          {num('company_benefits', 'Welfare / Benefits', 0, 20000, 100)}
          {num('inps_employee_rate', 'INPS Employee Rate', 0, 20, 0.01, '%')}
          {num('surcharges_rate', 'Regional/Municipal Surcharges', 0, 10, 0.01, '%')}
        </Section>

        <Section title="📈 ETF / PAC">
          {num('etf_value', 'Current ETF Value', 0, 2000000, 1000)}
          {num('monthly_pac', 'Monthly PAC', 0, 5000, 50)}
          {num('ter', 'Annual TER', 0, 2, 0.01, '%')}
          {num('ivafe', 'Annual IVAFE', 0, 1, 0.01, '%')}
          {num('expected_gross_return', 'Expected Gross Return', 1, 20, 0.1, '%')}
          {num('capital_gains_tax', 'Capital Gains Tax', 0, 50, 0.5, '%')}
        </Section>

        <Section title="🏦 Bank Account">
          {num('bank_balance', 'Bank Balance', 0, 500000, 1000)}
          {num('bank_interest', 'Bank Interest Rate', 0, 10, 0.01, '%')}
          {num('emergency_fund', 'Emergency Fund', 0, 100000, 1000)}
          {num('stamp_duty', 'Annual Stamp Duty', 0, 100, 0.1)}
        </Section>

        <Section title="🏛️ Pension Fund & TFR">
          <Field label="TFR Destination">
            <select
              className="input-field"
              value={params.tfr_destination}
              onChange={e => setParams({ tfr_destination: e.target.value as 'fund' | 'company' })}
            >
              <option value="fund">Pension Fund</option>
              <option value="company">Company</option>
            </select>
          </Field>
          {num('pf_value', 'Pension Fund Current Value', 0, 500000, 1000)}
          {num('tfr_contribution', 'TFR Annual Contribution', 0, 10000, 100)}
          {params.tfr_destination === 'company' && num('tfr_company_value', 'TFR at Company', 0, 200000, 1000)}
          {num('employer_contribution', 'Employer Contribution', 0, 10000, 100)}
          {num('personal_contribution', 'Personal Contribution', 0, 10000, 100)}
          {num('voluntary_extra', 'Extra Voluntary Contribution', 0, 20000, 100)}
          {num('max_deductible', 'Max Deductible', 0, 10000, 1)}
          {num('fund_return', 'Fund Return', 0, 15, 0.1, '%')}
          {num('annuity_rate', 'Annuity Rate', 0, 10, 0.1, '%')}
          {num('age_joined_fund', 'Age Joined Fund', 18, 65, 1)}
        </Section>

        <Section title="🌍 Macro">
          {num('inflation', 'Inflation', 0, 10, 0.1, '%')}
          {num('ral_growth', 'Annual Salary Growth', 0, 10, 0.1, '%')}
          {num('inps_contribution_rate', 'Total INPS Rate', 10, 40, 0.1, '%')}
          {num('gdp_revaluation_rate', 'GDP Revaluation Rate', 0, 5, 0.1, '%')}
        </Section>

        <Section title="🔥 FIRE Scenario">
          {num('stop_working_age', 'Stop Working Age', params.current_age + 1, 70, 1)}
          <Field label="Part-time after FIRE">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.part_time}
                onChange={e => setParams({ part_time: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-dark-text">Enable part-time</span>
            </label>
          </Field>
          {params.part_time && (
            <>
              {num('part_time_salary', 'Net Monthly Salary', 0, 5000, 50)}
              {num('part_time_monthly_gross', 'Gross Monthly', 0, 10000, 50)}
              {num('part_time_until_age', 'Part-time Until Age', params.stop_working_age, 80, 1)}
            </>
          )}
          {num('swr', 'Safe Withdrawal Rate (SWR)', 1, 10, 0.1, '%')}
        </Section>

        <Section title="🏦 Early Pension">
          <Field label="State Pension">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.defer_to_71}
                onChange={e => setParams({ defer_to_71: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-dark-text">Defer to age 71</span>
            </label>
          </Field>
          <Field label="Early Pension (Anticipata)">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.early_pension_enabled}
                onChange={e => setParams({ early_pension_enabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-dark-text">Enable anticipata</span>
            </label>
          </Field>
          {params.early_pension_enabled && num('early_pension_years', 'Contribution Years Required', 20, 45, 1)}
          <Field label="Life Expectancy Adjustment">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.le_adjustment}
                onChange={e => setParams({ le_adjustment: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-dark-text">Apply Fornero adjustment</span>
            </label>
          </Field>
        </Section>

        <Section title="🎲 Monte Carlo">
          {num('n_simulations', 'Number of Simulations', 100, 5000, 100)}
          {num('etf_volatility', 'ETF Volatility', 5, 40, 0.5, '%')}
          {num('pf_volatility', 'PF Volatility', 0, 20, 0.5, '%')}
          {num('inflation_std', 'Inflation Std Dev', 0, 5, 0.1, '%')}
          <Field label="MC Scenario">
            <select
              className="input-field"
              value={params.mc_scenario}
              onChange={e => setParams({ mc_scenario: e.target.value })}
            >
              {['Normal', 'Moderate Stress', 'Severe Stress', 'Historical Bootstrap', 'Hybrid'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </Section>

      </div>

      {/* Run button */}
      <div className="px-4 py-3 border-t border-dark-border space-y-2">
        {errorMsg && (
          <div className="flex items-start gap-2 bg-accent-red/10 border border-accent-red/30 rounded-md px-3 py-2">
            <AlertCircle size={14} className="text-accent-red mt-0.5 shrink-0" />
            <span className="text-xs text-accent-red">{errorMsg}</span>
          </div>
        )}
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-md transition-colors"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Computing...
            </>
          ) : (
            'Run Computation'
          )}
        </button>
      </div>
    </div>
  );
};
