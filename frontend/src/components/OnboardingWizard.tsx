import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import { useFireStore } from '../store/useStore';
import { DEFAULT_EXPENSES } from '../types';

interface Props {
  onDone: () => void;
}

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div>
    <label className="text-xs text-dark-muted block mb-1">
      {label}{hint && <span className="ml-1 text-dark-muted/50">{hint}</span>}
    </label>
    {children}
  </div>
);

export const OnboardingWizard: React.FC<Props> = ({ onDone }) => {
  const { params, setParams, setExpenses } = useFireStore();

  const [form, setForm] = useState({
    current_age: params.current_age,
    age_started_working: params.age_started_working,
    ral: params.ral,
    monthly_expenses: 1300,
    monthly_pac: params.monthly_pac,
    etf_value: params.etf_value,
    bank_balance: params.bank_balance,
    pf_value: params.pf_value,
    stop_working_age: params.stop_working_age,
  });

  const set = (k: keyof typeof form, v: number) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleStart = () => {
    const { monthly_expenses, ...paramFields } = form;
    setParams(paramFields);
    const defaultMonthlyTotal = Object.values(DEFAULT_EXPENSES).flat().reduce((sum, item) => {
      const mult = item.frequency === 'Monthly' ? 1 : item.frequency === 'Quarterly' ? 1/3 : item.frequency === 'Semi-annual' ? 1/6 : 1/12;
      return sum + item.amount * mult;
    }, 0);
    if (monthly_expenses > 0 && defaultMonthlyTotal > 0) {
      const ratio = monthly_expenses / defaultMonthlyTotal;
      setExpenses(Object.fromEntries(
        Object.entries(DEFAULT_EXPENSES).map(([cat, items]) => [
          cat, items.map(item => ({ ...item, amount: Math.round(item.amount * ratio) }))
        ])
      ));
    }
    localStorage.setItem('fire_onboarded', '1');
    onDone();
  };

  const handleSkip = () => {
    localStorage.setItem('fire_onboarded', '1');
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 overflow-y-auto py-6">
      <div className="bg-dark-card border border-dark-border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-accent-orange/20 rounded-lg">
            <Flame size={24} className="text-accent-orange" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-text">Welcome to FIRE Planner</h2>
            <p className="text-xs text-dark-muted">Italian FIRE calculator — let's set up your profile in 2 minutes</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Personal */}
          <p className="text-xs font-medium text-dark-muted uppercase tracking-wide">About you</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Current age">
              <input type="number" className="input-field w-full" min={18} max={65} step={1}
                value={form.current_age}
                onChange={e => set('current_age', parseInt(e.target.value) || 30)} />
            </Field>
            <Field label="Age started working">
              <input type="number" className="input-field w-full" min={16} max={50} step={1}
                value={form.age_started_working}
                onChange={e => set('age_started_working', parseInt(e.target.value) || 26)} />
            </Field>
          </div>

          {/* Income */}
          <p className="text-xs font-medium text-dark-muted uppercase tracking-wide mt-2">Income</p>
          <Field label="Gross annual salary (RAL)" hint="€">
            <input type="number" className="input-field w-full" min={10000} max={300000} step={500}
              value={form.ral}
              onChange={e => set('ral', parseFloat(e.target.value) || 30000)} />
          </Field>

          {/* Expenses & savings */}
          <p className="text-xs font-medium text-dark-muted uppercase tracking-wide mt-2">Monthly cash flow</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly expenses" hint="€/month">
              <input type="number" className="input-field w-full" min={0} max={20000} step={50}
                value={form.monthly_expenses}
                onChange={e => set('monthly_expenses', parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Monthly investment (PAC)" hint="€/month">
              <input type="number" className="input-field w-full" min={0} max={10000} step={50}
                value={form.monthly_pac}
                onChange={e => set('monthly_pac', parseFloat(e.target.value) || 0)} />
            </Field>
          </div>

          {/* Wealth */}
          <p className="text-xs font-medium text-dark-muted uppercase tracking-wide mt-2">Current wealth</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ETF / investments" hint="€">
              <input type="number" className="input-field w-full" min={0} max={5000000} step={1000}
                value={form.etf_value}
                onChange={e => set('etf_value', parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Bank savings" hint="€">
              <input type="number" className="input-field w-full" min={0} max={1000000} step={1000}
                value={form.bank_balance}
                onChange={e => set('bank_balance', parseFloat(e.target.value) || 0)} />
            </Field>
          </div>
          <Field label="Pension fund (fondo pensione)" hint="€ — leave 0 if none">
            <input type="number" className="input-field w-full" min={0} max={1000000} step={1000}
              value={form.pf_value}
              onChange={e => set('pf_value', parseFloat(e.target.value) || 0)} />
          </Field>

          {/* Goal */}
          <p className="text-xs font-medium text-dark-muted uppercase tracking-wide mt-2">Your FIRE goal</p>
          <Field label="Target retirement age" hint="— the FIRE tab will find the earliest achievable">
            <input type="number" className="input-field w-full"
              min={form.current_age + 1} max={70} step={1}
              value={form.stop_working_age}
              onChange={e => set('stop_working_age', parseInt(e.target.value) || 50)} />
          </Field>
        </div>

        <p className="text-xs text-dark-muted mt-4">
          Fine-tune all other details (pension contributions, ETF strategy, part-time…) in the sidebar afterwards.
        </p>

        <div className="flex gap-3 mt-5">
          <button onClick={handleStart}
            className="flex-1 bg-accent-blue hover:bg-accent-blue/80 text-white text-sm font-medium py-2 rounded-lg transition-colors">
            Get Started →
          </button>
          <button onClick={handleSkip}
            className="text-sm text-dark-muted hover:text-dark-text px-3 transition-colors">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
