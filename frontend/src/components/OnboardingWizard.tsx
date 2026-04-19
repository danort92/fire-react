import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import { useFireStore } from '../store/useStore';

interface Props {
  onDone: () => void;
}

export const OnboardingWizard: React.FC<Props> = ({ onDone }) => {
  const { params, setParams } = useFireStore();
  const [form, setForm] = useState({
    current_age: params.current_age,
    ral: params.ral,
    etf_value: params.etf_value,
    bank_balance: params.bank_balance,
    stop_working_age: params.stop_working_age,
  });

  const set = (k: keyof typeof form, v: number) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleStart = () => {
    setParams(form);
    localStorage.setItem('fire_onboarded', '1');
    onDone();
  };

  const handleSkip = () => {
    localStorage.setItem('fire_onboarded', '1');
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-dark-card border border-dark-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent-orange/20 rounded-lg">
            <Flame size={24} className="text-accent-orange" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-dark-text">Welcome to FIRE Planner</h2>
            <p className="text-xs text-dark-muted">Italian FIRE calculator — let's set up your profile</p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-dark-muted block mb-1">Current age</label>
            <input
              type="number" className="input-field w-full" min={18} max={65} step={1}
              value={form.current_age}
              onChange={e => set('current_age', parseInt(e.target.value) || 30)}
            />
          </div>
          <div>
            <label className="text-xs text-dark-muted block mb-1">
              Gross annual salary (RAL) <span className="text-dark-muted/60">€</span>
            </label>
            <input
              type="number" className="input-field w-full" min={10000} max={300000} step={1000}
              value={form.ral}
              onChange={e => set('ral', parseFloat(e.target.value) || 30000)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-dark-muted block mb-1">Current investments <span className="text-dark-muted/60">€</span></label>
              <input
                type="number" className="input-field w-full" min={0} max={5000000} step={1000}
                value={form.etf_value}
                onChange={e => set('etf_value', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-xs text-dark-muted block mb-1">Bank savings <span className="text-dark-muted/60">€</span></label>
              <input
                type="number" className="input-field w-full" min={0} max={1000000} step={1000}
                value={form.bank_balance}
                onChange={e => set('bank_balance', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-dark-muted block mb-1">
              Target retirement age
              <span className="ml-1 text-dark-muted/60">(you can optimise this later)</span>
            </label>
            <input
              type="number" className="input-field w-full"
              min={form.current_age + 1} max={70} step={1}
              value={form.stop_working_age}
              onChange={e => set('stop_working_age', parseInt(e.target.value) || 50)}
            />
          </div>
        </div>

        <p className="text-xs text-dark-muted mt-4">
          All other parameters (expenses, pension fund, ETF strategy…) can be fine-tuned in the sidebar.
        </p>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleStart}
            className="flex-1 bg-accent-blue hover:bg-accent-blue/80 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Get Started →
          </button>
          <button
            onClick={handleSkip}
            className="text-sm text-dark-muted hover:text-dark-text px-3 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
