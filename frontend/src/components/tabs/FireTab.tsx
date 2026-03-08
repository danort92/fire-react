import React, { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Plot from 'react-plotly.js';
import { useFireStore } from '../../store/useStore';
import { MetricCard } from '../MetricCard';
import * as api from '../../api/client';
import type { FireResult } from '../../types';

const fmt = (n: number, decimals = 0) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(n);

const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;

export const FireTab: React.FC = () => {
  const { params, baseResult } = useFireStore();

  const mutation = useMutation<FireResult, Error>({
    mutationFn: () => {
      if (!baseResult) throw new Error('No base result');
      return api.computeFire(params, {
        net_monthly_salary: baseResult.net_monthly_salary,
        monthly_expenses: baseResult.monthly_expenses,
        pension_info: baseResult.pension_info,
      });
    },
  });

  useEffect(() => {
    if (baseResult) {
      mutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseResult]);

  if (!baseResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-dark-muted text-sm">Run computation to see results</p>
      </div>
    );
  }

  if (mutation.isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-accent-blue" />
          <p className="text-dark-muted text-sm">Computing FIRE analysis...</p>
        </div>
      </div>
    );
  }

  if (mutation.isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle size={28} className="text-accent-red" />
          <p className="text-dark-muted text-sm">Failed to compute FIRE analysis</p>
          <p className="text-xs text-accent-red">{mutation.error?.message}</p>
          <button
            onClick={() => mutation.mutate()}
            className="text-sm px-4 py-2 bg-accent-blue rounded-md text-white hover:bg-accent-blue/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const data = mutation.data;
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <button
          onClick={() => mutation.mutate()}
          className="text-sm px-4 py-2 bg-accent-blue rounded-md text-white"
        >
          Compute FIRE Analysis
        </button>
      </div>
    );
  }

  const annualExpenses = baseResult.monthly_expenses * 12;
  const fireNumber = (annualExpenses / (params.swr / 100));

  // Current liquid wealth (bank + etf from first row)
  const firstRow = baseResult.rows[0];
  const currentWealth = firstRow.bank_real + firstRow.etf_real + firstRow.pf_real;
  const fireProgress = Math.min(100, (currentWealth / fireNumber) * 100);

  const netSalary = baseResult.net_monthly_salary;
  const savingsRate = netSalary > 0
    ? Math.max(0, ((netSalary - baseResult.monthly_expenses) / netSalary) * 100)
    : 0;

  const sweepAges = data.scenario_sweep.map(s => s.age);
  const sweepWealth = data.scenario_sweep.map(s => s.wealth);
  const sweepColors = data.scenario_sweep.map(s => s.solvent ? '#00CC96' : '#EF553B');

  return (
    <div className="space-y-6">
      {/* Key metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="FIRE Number"
          value={fmt(fireNumber)}
          color="text-accent-orange"
          help={`Annual expenses / SWR (${params.swr}%)`}
        />
        <MetricCard
          label="Current Liquid Wealth"
          value={fmt(currentWealth)}
          color="text-accent-blue"
        />
        <MetricCard
          label="Earliest Retirement Age"
          value={data.earliest_retirement > 0 ? `Age ${data.earliest_retirement}` : 'N/A'}
          color="text-accent-green"
        />
        <MetricCard
          label="Optimal Monthly PAC"
          value={fmt(data.optimal_pac)}
          color="text-accent-purple"
        />
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-dark-text">FIRE Progress</h3>
          <span className="text-sm font-semibold text-accent-orange">{fmtPct(fireProgress, 1)}</span>
        </div>
        <div className="w-full bg-dark-border rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all"
            style={{
              width: `${fireProgress}%`,
              background: fireProgress >= 100
                ? '#00CC96'
                : `linear-gradient(90deg, #636EFA, #FFA15A ${fireProgress}%)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-dark-muted">
          <span>{fmt(currentWealth)} current</span>
          <span>{fmt(fireNumber)} target</span>
        </div>
      </div>

      {/* Status & additional metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="metric-card flex flex-col gap-1">
          <span className="text-xs text-dark-muted">Solvent to Target Age</span>
          <div className="flex items-center gap-1.5">
            {data.scenario_result.solvent_to_target
              ? <CheckCircle size={16} className="text-accent-green" />
              : <XCircle size={16} className="text-accent-red" />
            }
            <span className={`text-sm font-semibold ${data.scenario_result.solvent_to_target ? 'text-accent-green' : 'text-accent-red'}`}>
              {data.scenario_result.solvent_to_target ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
        <MetricCard
          label="Wealth at Target Age (Real)"
          value={fmt(data.scenario_result.assets_at_target_real)}
          color={data.scenario_result.assets_at_target_real > 0 ? 'text-accent-green' : 'text-accent-red'}
        />
        <MetricCard
          label="Effective Avg Monthly PAC"
          value={fmt(data.scenario_result.effective_avg_monthly_pac)}
          color="text-accent-blue"
        />
        <MetricCard
          label="Savings Rate"
          value={fmtPct(savingsRate)}
          color="text-accent-orange"
        />
      </div>

      {/* Scenario sweep chart */}
      <div className="card">
        <h3 className="text-sm font-medium text-dark-text mb-3">Retirement Age Scenario Sweep</h3>
        <p className="text-xs text-dark-muted mb-3">Wealth at target age for each possible retirement age</p>
        <Plot
          data={[{
            type: 'bar',
            x: sweepAges,
            y: sweepWealth,
            marker: { color: sweepColors },
            hovertemplate: 'Age %{x}: %{y:.0f}€<extra></extra>',
          }]}
          layout={{
            template: 'plotly_dark',
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            margin: { l: 70, r: 20, t: 20, b: 50 },
            font: { color: '#f9fafb', size: 11 },
            height: 280,
            xaxis: { title: 'Retirement Age', showgrid: true, gridcolor: '#374151' },
            yaxis: { title: 'Wealth at Target Age (Real €)', showgrid: true, gridcolor: '#374151' },
            shapes: [{
              type: 'line',
              x0: Math.min(...sweepAges), x1: Math.max(...sweepAges),
              y0: 0, y1: 0,
              line: { color: '#f9fafb', width: 1, dash: 'dot' },
            }],
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
        <div className="mt-2 flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded" style={{ background: '#00CC96' }} />
            <span className="text-dark-muted">Solvent to target</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded" style={{ background: '#EF553B' }} />
            <span className="text-dark-muted">Runs out before target</span>
          </span>
        </div>
      </div>
    </div>
  );
};
