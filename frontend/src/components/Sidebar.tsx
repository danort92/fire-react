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
  help?: string;
  children: React.ReactNode;
}
const Field: React.FC<FieldProps> = ({ label, help, children }) => (
  <div className="flex flex-col gap-0.5">
    <label className="text-xs text-dark-muted cursor-help" title={help}>
      {label}{help && <span className="ml-1 opacity-50">ⓘ</span>}
    </label>
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
    suffix?: string,
    help?: string,
  ) => (
    <Field label={suffix ? `${label} ${suffix}` : label} help={help}>
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
          {num('current_age', 'Current Age', 18, 70, 1, undefined,
            'Your current age')}
          {num('target_age', 'Target Age', 70, 100, 1, undefined,
            'The age up to which your finances are projected — use life expectancy or a conservative upper bound')}
          {num('age_started_working', 'Age Started Working', 16, 50, 1, undefined,
            'Age of your first job — used to compute INPS contribution years for the state pension')}
        </Section>

        <Section title="💼 Salary & Tax">
          {num('ral', 'Gross Annual Salary (RAL)', 10000, 200000, 100, undefined,
            'Reddito Annuo Lordo — your gross annual salary before any taxes or social contributions')}
          {num('company_benefits', 'Welfare / Benefits', 0, 20000, 100, undefined,
            'Company welfare / fringe benefits (e.g. meal vouchers, health plan). Taxed at a flat 5% in Italy')}
          {num('inps_employee_rate', 'INPS Employee Rate', 0, 20, 0.01, '%',
            'Employee social security contribution rate. Default 9.19% for most private-sector workers (IVS gestione separata may differ)')}
          {num('surcharges_rate', 'Regional/Municipal Surcharges', 0, 10, 0.01, '%',
            'Sum of regional (addizionale regionale) and municipal (addizionale comunale) IRPEF surcharges — varies by location, typically 1–3%')}
        </Section>

        <Section title="📈 ETF / PAC">
          {num('etf_value', 'Current ETF Value', 0, 2000000, 1000, undefined,
            'Current market value of your ETF/investment portfolio')}
          {num('monthly_pac', 'Monthly PAC', 0, 5000, 50, undefined,
            'Piano Accumulo Capitale — the fixed monthly amount you invest into ETFs')}
          {num('ter', 'Annual TER', 0, 2, 0.01, '%',
            'Total Expense Ratio — annual management fee deducted from the fund. Automatically set when you apply an ETF portfolio in the ETF Explorer tab')}
          {num('ivafe', 'Annual IVAFE', 0, 1, 0.01, '%',
            'Imposta sul Valore delle Attività Finanziarie Estere — 0.2% annual wealth tax on foreign financial assets (most ETFs domiciled abroad)')}
          {num('expected_gross_return', 'Expected Gross Return', 1, 20, 0.1, '%',
            'Expected average annual return before fees and taxes. Net return = Gross Return − TER − IVAFE. Automatically set when you apply an ETF portfolio in the ETF Explorer tab')}
          {num('capital_gains_tax', 'Capital Gains Tax', 0, 50, 0.5, '%',
            'Italian capital gains tax (imposta sui capital gain) on ETF profits — standard rate is 26%')}
        </Section>

        <Section title="🏦 Bank Account">
          {num('bank_balance', 'Bank Balance', 0, 500000, 1000, undefined,
            'Current balance in your bank or savings account')}
          {num('bank_interest', 'Bank Interest Rate', 0, 10, 0.01, '%',
            'Annual interest rate on your bank/savings account balance')}
          {num('emergency_fund', 'Emergency Fund', 0, 100000, 1000, undefined,
            'Emergency fund amount kept aside and not counted as investable assets — typically 3–6 months of expenses')}
          {num('stamp_duty', 'Annual Stamp Duty', 0, 100, 0.1, undefined,
            'Annual stamp duty (imposta di bollo) on bank/brokerage accounts — currently €34.20/year for accounts above €5,000')}
        </Section>

        <Section title="🏛️ Pension Fund & TFR">
          <Field label="TFR Destination" help="Where your TFR (Trattamento di Fine Rapporto — severance pay) is directed. Sending to the pension fund increases contributions and tax savings">
            <select
              className="input-field"
              value={params.tfr_destination}
              onChange={e => setParams({ tfr_destination: e.target.value as 'fund' | 'company' })}
            >
              <option value="fund">Pension Fund</option>
              <option value="company">Company</option>
            </select>
          </Field>
          {num('pf_value', 'Pension Fund Current Value', 0, 500000, 1000, undefined,
            'Current accumulated value of your occupational pension fund (fondo pensione complementare)')}
          {num('tfr_contribution', 'TFR Annual Contribution', 0, 10000, 100, undefined,
            'Annual TFR amount directed to the pension fund — typically ~6.91% of gross salary')}
          {params.tfr_destination === 'company' && num('tfr_company_value', 'TFR at Company', 0, 200000, 1000, undefined,
            'TFR balance accumulated at your company (if not directed to the fund)')}
          {num('employer_contribution', 'Employer Contribution', 0, 10000, 100, undefined,
            "Employer's annual contribution to the pension fund — often requires a minimum personal contribution to unlock it")}
          {num('personal_contribution', 'Personal Contribution', 0, 10000, 100, undefined,
            'Your mandatory annual personal contribution to the pension fund (separate from voluntary extras)')}
          {num('voluntary_extra', 'Extra Voluntary Contribution', 0, 20000, 100, undefined,
            'Extra voluntary annual contribution — tax-deductible up to the max deductible limit, making it very tax-efficient')}
          {num('max_deductible', 'Max Deductible', 0, 10000, 1, undefined,
            'Maximum annual pension contribution deductible from IRPEF income — currently €5,164.57/year')}
          {num('fund_return', 'Fund Return', 0, 15, 0.1, '%',
            'Expected average annual return of the pension fund (net of fund management costs)')}
          {num('annuity_rate', 'Annuity Rate', 0, 10, 0.1, '%',
            'Conversion rate (coefficiente di conversione) applied to the accumulated capital to calculate your annual pension annuity — typically 4–6%')}
          {num('age_joined_fund', 'Age Joined Fund', 18, 65, 1, undefined,
            'Age when you first enrolled in the pension fund — determines the tax rate applied at payout (lower tax with longer membership)')}
        </Section>

        <Section title="🌍 Macro">
          {num('inflation', 'Inflation', 0, 10, 0.1, '%',
            'Expected average annual inflation rate — used to compute real (inflation-adjusted) values throughout the projections')}
          {num('ral_growth', 'Annual Salary Growth', 0, 10, 0.1, '%',
            'Expected average annual salary growth rate — affects INPS contributions and pension montante over time')}
          {num('inps_contribution_rate', 'Total INPS Rate', 10, 40, 0.1, '%',
            'Total INPS contribution rate (employee + employer combined, ~33% for most workers) — used for the contributory pension calculation')}
          {num('gdp_revaluation_rate', 'GDP Revaluation Rate', 0, 5, 0.1, '%',
            'Rate used to revalue INPS contribution montante over time (linked to 5-year average GDP growth) — typically 1–2%')}
        </Section>

        <Section title="🔥 FIRE Scenario">
          {num('stop_working_age', 'Stop Working Age', params.current_age + 1, 70, 1, undefined,
            'The age at which you plan to stop your main job. The FIRE Analysis tab finds the earliest achievable age given your parameters')}
          <Field label="Part-time after FIRE" help="Optional part-time or consulting income after stopping full-time work — reduces drawdown on your portfolio during the early retirement years">
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
              {num('part_time_salary', 'Net Monthly Salary', 0, 5000, 50, undefined,
                'Net (after-tax) monthly income from part-time work during the early retirement phase')}
              {num('part_time_monthly_gross', 'Gross Monthly', 0, 10000, 50, undefined,
                'Gross monthly income from part-time work — used to calculate INPS contributions for the part-time period')}
              {num('part_time_until_age', 'Part-time Until Age', params.stop_working_age, 80, 1, undefined,
                'Age at which you stop part-time work and fully retire')}
            </>
          )}
          {num('swr', 'Safe Withdrawal Rate (SWR)', 1, 10, 0.1, '%',
            'The percentage of your portfolio you withdraw annually in retirement. The 4% rule is common; 3–3.5% is more conservative for long retirements')}
        </Section>

        <Section title="🏦 Early Pension">
          <Field label="State Pension" help="Deferring your state pension to age 71 increases the annual amount due to a higher conversion coefficient — useful if you have other income sources early in retirement">
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
          <Field label="Early Pension (Anticipata)" help="Pensione anticipata — allows retiring before standard age if you have enough contribution years (typically 41 years 10 months for men / 40 years 10 months for women)">
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
          {params.early_pension_enabled && num('early_pension_years', 'Contribution Years Required', 20, 45, 1, undefined,
            'Number of INPS contribution years needed to qualify for early pension (pensione anticipata)')}
          <Field label="Life Expectancy Adjustment" help="Apply the Fornero reform life-expectancy adjustment to shift pension age in line with ISTAT life expectancy data (updated every 2 years)">
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
          {num('n_simulations', 'Number of Simulations', 100, 5000, 100, undefined,
            'Number of random scenarios to simulate. More simulations give more stable probability estimates but take longer to compute')}
          {num('etf_volatility', 'ETF Volatility', 5, 40, 0.5, '%',
            'Annual standard deviation of ETF returns. Historical average for global equity (e.g. MSCI World) is ~15–17%')}
          {num('pf_volatility', 'PF Volatility', 0, 20, 0.5, '%',
            'Annual volatility of the pension fund — typically much lower than equities (3–7%) due to bond-heavy allocation')}
          {num('inflation_std', 'Inflation Std Dev', 0, 5, 0.1, '%',
            'Standard deviation of annual inflation — adds randomness to real purchasing power in simulations')}
          <Field label="MC Scenario" help="Market stress scenario applied during Monte Carlo simulations: Normal uses historical distribution; Stress scenarios add negative drift or fat tails; Hybrid combines approaches">
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
