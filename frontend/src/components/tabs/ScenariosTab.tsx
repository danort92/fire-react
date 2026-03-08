import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import Plot from 'react-plotly.js';
import { useFireStore } from '../../store/useStore';
import { MetricCard } from '../MetricCard';
import * as api from '../../api/client';
import type { MonteCarloResult, ScenariosResult, ScenarioConfig, ProjectionRow } from '../../types';

const fmt = (n: number, decimals = 0) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(n);

const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;

const DEFAULT_SCENARIOS: ScenarioConfig[] = [
  {
    label: 'Conservative',
    stop_working_age: 55,
    monthly_pac: 800,
    monthly_expenses: 2200,
    etf_net_return: 3.5,
    inflation: 2.5,
    ral: 32000,
  },
  {
    label: 'Base',
    stop_working_age: 50,
    monthly_pac: 1300,
    monthly_expenses: 1800,
    etf_net_return: 5.0,
    inflation: 2.0,
    ral: 35600,
  },
  {
    label: 'Aggressive',
    stop_working_age: 45,
    monthly_pac: 2000,
    monthly_expenses: 1500,
    etf_net_return: 7.0,
    inflation: 1.5,
    ral: 45000,
  },
];

const SCENARIO_COLORS = ['#EF553B', '#636EFA', '#00CC96'];

export const ScenariosTab: React.FC = () => {
  const { params, baseResult } = useFireStore();
  const [runMc, setRunMc] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>(DEFAULT_SCENARIOS);

  // Monte Carlo
  const mcMutation = useMutation<MonteCarloResult, Error>({
    mutationFn: () => {
      if (!baseResult) throw new Error('No base result');
      return api.computeMonteCarlo(params, {
        net_monthly_salary: baseResult.net_monthly_salary,
        monthly_expenses: baseResult.monthly_expenses,
        pension_info: baseResult.pension_info,
      });
    },
  });

  // Scenarios comparison
  const scenariosMutation = useMutation<ScenariosResult, Error>({
    mutationFn: () => {
      if (!baseResult) throw new Error('No base result');
      return api.computeScenarios(
        params,
        {
          net_monthly_salary: baseResult.net_monthly_salary,
          monthly_expenses: baseResult.monthly_expenses,
          pension_info: baseResult.pension_info,
        },
        scenarios,
        runMc
      );
    },
  });

  // Auto-run MC on mount
  useEffect(() => {
    if (baseResult) {
      mcMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseResult]);

  const mcData = mcMutation.data;
  const scenData = scenariosMutation.data;

  const updateScenario = (idx: number, patch: Partial<ScenarioConfig>) => {
    setScenarios(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  // Build Monte Carlo fan chart
  const buildMcPlotData = (mc: MonteCarloResult) => {
    const ages = mc.ages;
    const p = mc.percentiles;
    return [
      // P5-P95 outer band
      {
        type: 'scatter' as const, mode: 'lines' as const,
        x: ages, y: p.p95,
        name: 'P95', line: { color: 'transparent' },
        showlegend: false,
      },
      {
        type: 'scatter' as const, mode: 'none' as const,
        x: ages, y: p.p5,
        name: 'P5-P95', fill: 'tonexty' as const,
        fillcolor: 'rgba(99,110,250,0.1)',
        showlegend: true,
        line: { color: 'transparent' },
      },
      // P10-P90 band
      {
        type: 'scatter' as const, mode: 'lines' as const,
        x: ages, y: p.p90,
        name: 'P90', line: { color: 'transparent' },
        showlegend: false,
      },
      {
        type: 'scatter' as const, mode: 'none' as const,
        x: ages, y: p.p10,
        name: 'P10-P90', fill: 'tonexty' as const,
        fillcolor: 'rgba(99,110,250,0.18)',
        showlegend: true,
        line: { color: 'transparent' },
      },
      // P25-P75 band
      {
        type: 'scatter' as const, mode: 'lines' as const,
        x: ages, y: p.p75,
        name: 'P75', line: { color: 'transparent' },
        showlegend: false,
      },
      {
        type: 'scatter' as const, mode: 'none' as const,
        x: ages, y: p.p25,
        name: 'P25-P75', fill: 'tonexty' as const,
        fillcolor: 'rgba(99,110,250,0.25)',
        showlegend: true,
        line: { color: 'transparent' },
      },
      // P50 median line
      {
        type: 'scatter' as const, mode: 'lines' as const,
        x: ages, y: p.p50,
        name: 'Median (P50)',
        line: { color: '#636EFA', width: 2 },
        showlegend: true,
      },
      // Zero line (ruin)
      {
        type: 'scatter' as const, mode: 'lines' as const,
        x: [ages[0], ages[ages.length - 1]],
        y: [0, 0],
        name: 'Ruin line',
        line: { color: '#EF553B', width: 1, dash: 'dot' as const },
        showlegend: false,
      },
    ];
  };

  const terminalWealthBins = mcData ? (() => {
    const tw = mcData.terminal_wealth;
    const min = Math.min(...tw);
    const max = Math.max(...tw);
    return { min, max, data: tw };
  })() : null;

  return (
    <div className="space-y-6">
      {/* ===== MONTE CARLO SECTION ===== */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-dark-text">🎲 Monte Carlo Simulation</h3>
          <button
            onClick={() => mcMutation.mutate()}
            disabled={mcMutation.isPending || !baseResult}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-accent-purple/20 border border-accent-purple/40 rounded-md text-accent-purple hover:bg-accent-purple/30 transition-colors disabled:opacity-60"
          >
            {mcMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
            {mcMutation.isPending ? 'Running...' : `Run MC (${params.n_simulations} sims)`}
          </button>
        </div>

        {mcMutation.isError && (
          <div className="flex items-center gap-2 bg-accent-red/10 border border-accent-red/30 rounded-md px-3 py-2 mb-3">
            <AlertCircle size={12} className="text-accent-red" />
            <span className="text-xs text-accent-red">{mcMutation.error?.message}</span>
          </div>
        )}

        {mcMutation.isPending && (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="animate-spin text-accent-purple" />
          </div>
        )}

        {mcData && !mcMutation.isPending && (
          <>
            {/* MC metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <MetricCard
                label="Solvency Probability"
                value={fmtPct(mcData.probability_solvent * 100)}
                color={mcData.probability_solvent >= 0.9 ? 'text-accent-green' : mcData.probability_solvent >= 0.7 ? 'text-accent-orange' : 'text-accent-red'}
              />
              <MetricCard
                label="Avg Ruin Age"
                value={mcData.avg_broke_age !== null ? `Age ${mcData.avg_broke_age.toFixed(0)}` : 'N/A (all solvent)'}
                color="text-accent-red"
              />
              <MetricCard
                label="Median Terminal Wealth"
                value={mcData.percentiles.p50.length > 0 ? fmt(mcData.percentiles.p50[mcData.percentiles.p50.length - 1]) : 'N/A'}
                color="text-accent-blue"
              />
              <MetricCard
                label="P10 Terminal Wealth"
                value={mcData.percentiles.p10.length > 0 ? fmt(mcData.percentiles.p10[mcData.percentiles.p10.length - 1]) : 'N/A'}
                color="text-accent-orange"
              />
            </div>

            {/* Fan chart */}
            <Plot
              data={buildMcPlotData(mcData)}
              layout={{
                template: 'plotly_dark',
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                margin: { l: 70, r: 20, t: 10, b: 50 },
                font: { color: '#f9fafb', size: 11 },
                height: 320,
                xaxis: {
                  title: 'Age', showgrid: true, gridcolor: '#374151',
                },
                yaxis: { title: 'Wealth (Real €)', showgrid: true, gridcolor: '#374151' },
                legend: { orientation: 'h', y: -0.2 },
                shapes: [
                  {
                    type: 'line',
                    x0: params.stop_working_age, x1: params.stop_working_age,
                    y0: 0, y1: 1, yref: 'paper',
                    line: { color: '#EF553B', width: 1.5, dash: 'dash' },
                  },
                ],
                annotations: [{
                  x: params.stop_working_age,
                  y: 1, yref: 'paper',
                  text: 'FIRE', showarrow: false,
                  font: { color: '#EF553B', size: 10 },
                  xanchor: 'left',
                }],
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%' }}
            />

            {/* Terminal wealth histogram + percentile table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {terminalWealthBins && (
                <div>
                  <h4 className="text-xs font-medium text-dark-muted mb-2">Terminal Wealth Distribution</h4>
                  <Plot
                    data={[{
                      type: 'histogram',
                      x: terminalWealthBins.data,
                      marker: { color: '#636EFA', opacity: 0.7 },
                      nbinsx: 40,
                      hovertemplate: '%{y} simulations<extra></extra>',
                    }]}
                    layout={{
                      template: 'plotly_dark',
                      paper_bgcolor: 'transparent',
                      plot_bgcolor: 'transparent',
                      margin: { l: 50, r: 10, t: 10, b: 50 },
                      font: { color: '#f9fafb', size: 10 },
                      height: 200,
                      showlegend: false,
                      xaxis: { title: 'Terminal Wealth (€)' },
                      yaxis: { title: 'Count' },
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {/* Percentile table */}
              <div>
                <h4 className="text-xs font-medium text-dark-muted mb-2">Terminal Wealth Percentiles</h4>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-dark-muted border-b border-dark-border">
                      <th className="text-left py-1.5">Percentile</th>
                      <th className="text-right py-1.5">Terminal Wealth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { pct: 'P5 (Worst 5%)', key: 'p5' as const },
                      { pct: 'P10', key: 'p10' as const },
                      { pct: 'P25', key: 'p25' as const },
                      { pct: 'P50 (Median)', key: 'p50' as const },
                      { pct: 'P75', key: 'p75' as const },
                      { pct: 'P90', key: 'p90' as const },
                      { pct: 'P95 (Best 5%)', key: 'p95' as const },
                    ].map(({ pct, key }) => {
                      const arr = mcData.percentiles[key];
                      const val = arr.length > 0 ? arr[arr.length - 1] : 0;
                      return (
                        <tr key={pct} className="border-b border-dark-border/30">
                          <td className="py-1.5 text-dark-muted">{pct}</td>
                          <td className={`py-1.5 text-right ${val >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                            {fmt(val)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===== SCENARIO COMPARISON SECTION ===== */}
      <div className="card">
        <h3 className="text-sm font-semibold text-dark-text mb-4">📊 Scenario Comparison</h3>

        {/* Scenario configs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {scenarios.map((s, idx) => (
            <div key={idx} className="bg-dark-bg border border-dark-border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: SCENARIO_COLORS[idx] }}
                />
                <input
                  type="text"
                  value={s.label}
                  onChange={e => updateScenario(idx, { label: e.target.value })}
                  className="flex-1 bg-transparent border-b border-dark-border text-sm text-dark-text focus:outline-none focus:border-accent-blue"
                />
              </div>
              {([
                { field: 'stop_working_age', label: 'Stop Working Age', step: 1 },
                { field: 'monthly_pac', label: 'Monthly PAC (€)', step: 50 },
                { field: 'monthly_expenses', label: 'Monthly Expenses (€)', step: 50 },
                { field: 'etf_net_return', label: 'Net Return (%)', step: 0.1 },
                { field: 'inflation', label: 'Inflation (%)', step: 0.1 },
                { field: 'ral', label: 'RAL (€)', step: 1000 },
              ] as const).map(({ field, label, step }) => (
                <div key={field} className="flex items-center justify-between gap-2">
                  <label className="text-xs text-dark-muted w-32 shrink-0">{label}</label>
                  <input
                    type="number"
                    value={s[field]}
                    step={step}
                    onChange={e => updateScenario(idx, { [field]: parseFloat(e.target.value) || 0 } as any)}
                    className="input-field w-24 text-right text-xs"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-dark-muted">
            <input
              type="checkbox"
              checked={runMc}
              onChange={e => setRunMc(e.target.checked)}
              className="rounded"
            />
            Include Monte Carlo per scenario
          </label>
          <button
            onClick={() => scenariosMutation.mutate()}
            disabled={scenariosMutation.isPending || !baseResult}
            className="flex items-center gap-2 text-sm px-4 py-2 bg-accent-green/20 border border-accent-green/40 rounded-md text-accent-green hover:bg-accent-green/30 disabled:opacity-60 transition-colors"
          >
            {scenariosMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            {scenariosMutation.isPending ? 'Running...' : 'Run Comparison'}
          </button>
        </div>

        {scenariosMutation.isError && (
          <div className="flex items-center gap-2 bg-accent-red/10 border border-accent-red/30 rounded-md px-3 py-2 mb-3">
            <AlertCircle size={12} className="text-accent-red" />
            <span className="text-xs text-accent-red">{scenariosMutation.error?.message}</span>
          </div>
        )}

        {scenariosMutation.isPending && (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="animate-spin text-accent-green" />
          </div>
        )}

        {scenData && !scenariosMutation.isPending && (
          <>
            {/* Solvency summary */}
            {runMc && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {scenData.results.map((r, idx) => (
                  <MetricCard
                    key={r.label}
                    label={`${r.label} Solvency`}
                    value={r.mc ? fmtPct(r.mc.probability_solvent * 100) : 'N/A'}
                    color={!r.mc ? 'text-dark-muted' : r.mc.probability_solvent >= 0.9 ? 'text-accent-green' : r.mc.probability_solvent >= 0.7 ? 'text-accent-orange' : 'text-accent-red'}
                  />
                ))}
              </div>
            )}

            {/* Line chart */}
            <Plot
              data={scenData.results.map((result, idx) => ({
                type: 'scatter' as const,
                mode: 'lines' as const,
                x: result.rows.map((r: ProjectionRow) => r.age),
                y: result.rows.map((r: ProjectionRow) => r.total_real),
                name: result.label,
                line: { color: SCENARIO_COLORS[idx], width: 2 },
              }))}
              layout={{
                template: 'plotly_dark',
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                margin: { l: 70, r: 20, t: 10, b: 50 },
                font: { color: '#f9fafb', size: 11 },
                height: 300,
                xaxis: { title: 'Age', showgrid: true, gridcolor: '#374151' },
                yaxis: { title: 'Total Wealth (Real €)', showgrid: true, gridcolor: '#374151' },
                legend: { orientation: 'h', y: -0.2 },
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%' }}
            />
          </>
        )}
      </div>
    </div>
  );
};
