import React from 'react';
import Plot from 'react-plotly.js';
import { useFireStore } from '../../store/useStore';
import { MetricCard } from '../MetricCard';
import type { ProjectionRow } from '../../types';

const fmt = (n: number, decimals = 0) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(n);

const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;

export const DashboardTab: React.FC = () => {
  const { baseResult, params, displayReal } = useFireStore();

  if (!baseResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-dark-muted text-sm">Run computation to see results</p>
      </div>
    );
  }

  const { rows, tax_result, pension_info, monthly_expenses, net_monthly_salary } = baseResult;

  const monthlySavings = net_monthly_salary - monthly_expenses;
  const savingsRate = net_monthly_salary > 0
    ? (monthlySavings / net_monthly_salary) * 100
    : 0;

  const fireNumber = (monthly_expenses * 12) / (params.swr / 100);
  const firstRow = rows[0];
  const currentWealth = displayReal
    ? firstRow.bank_real + firstRow.etf_real + firstRow.pf_real
    : firstRow.bank + firstRow.etf + firstRow.pf;
  const fireProgress = Math.min(100, (currentWealth / fireNumber) * 100);

  const totalKey = displayReal ? 'total_real' : 'total_nominal';
  const bankKey = displayReal ? 'bank_real' : 'bank';
  const etfKey = displayReal ? 'etf_real' : 'etf';
  const pfKey = displayReal ? 'pf_real' : 'pf';

  // Snapshot rows
  const findRow = (age: number) => rows.find((r: ProjectionRow) => r.age === age) || rows[rows.length - 1];
  const row50 = findRow(50);
  const rowTarget = findRow(params.target_age);
  const modeLabel = displayReal ? 'Real' : 'Nominal';

  const ages = rows.map((r: ProjectionRow) => r.age);

  return (
    <div className="space-y-6">
      {/* Row 1: Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          label="Net Monthly Salary"
          value={fmt(net_monthly_salary)}
          color="text-accent-green"
        />
        <MetricCard
          label="Monthly Expenses"
          value={fmt(monthly_expenses)}
          color="text-accent-orange"
        />
        <MetricCard
          label="Monthly Savings"
          value={fmt(monthlySavings)}
          color={monthlySavings >= 0 ? 'text-accent-blue' : 'text-accent-red'}
        />
        <MetricCard
          label="Savings Rate"
          value={fmtPct(Math.max(0, savingsRate))}
          color="text-accent-purple"
        />
        <MetricCard
          label="Annual Pension (Net)"
          value={fmt(pension_info.net_annual_nominal)}
          color="text-dark-text"
        />
      </div>

      {/* FIRE progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-sm font-medium text-dark-text">FIRE Progress</h3>
            <p className="text-xs text-dark-muted mt-0.5">FIRE Number: {fmt(fireNumber)} (SWR {params.swr}%)</p>
          </div>
          <span className="text-xl font-bold text-accent-orange">{fmtPct(fireProgress, 1)}</span>
        </div>
        <div className="w-full bg-dark-border rounded-full h-4 mt-2">
          <div
            className="h-4 rounded-full transition-all"
            style={{
              width: `${fireProgress}%`,
              background: fireProgress >= 100
                ? '#00CC96'
                : `linear-gradient(90deg, #636EFA 0%, #FFA15A ${Math.min(100, fireProgress)}%)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-dark-muted">
          <span>Now: {fmt(currentWealth)}</span>
          <span>Target: {fmt(fireNumber)}</span>
        </div>
      </div>

      {/* Wealth chart (compact) */}
      <div className="card">
        <h3 className="text-sm font-medium text-dark-text mb-3">Wealth Evolution ({modeLabel})</h3>
        <Plot
          data={[
            {
              type: 'scatter',
              mode: 'none',
              x: ages,
              y: rows.map((r: ProjectionRow) => r[bankKey]),
              name: 'Bank',
              fill: 'tozeroy',
              fillcolor: 'rgba(99,110,250,0.35)',
              stackgroup: 'wealth',
              line: { color: '#636EFA' },
            },
            {
              type: 'scatter',
              mode: 'none',
              x: ages,
              y: rows.map((r: ProjectionRow) => r[pfKey]),
              name: 'Pension Fund',
              fill: 'tonexty',
              fillcolor: 'rgba(0,204,150,0.35)',
              stackgroup: 'wealth',
              line: { color: '#00CC96' },
            },
            {
              type: 'scatter',
              mode: 'none',
              x: ages,
              y: rows.map((r: ProjectionRow) => r[etfKey]),
              name: 'ETF',
              fill: 'tonexty',
              fillcolor: 'rgba(255,161,90,0.35)',
              stackgroup: 'wealth',
              line: { color: '#FFA15A' },
            },
            {
              type: 'scatter',
              mode: 'lines',
              x: ages,
              y: rows.map((r: ProjectionRow) => r[totalKey]),
              name: 'Total',
              line: { color: '#f9fafb', width: 2, dash: 'dot' },
            },
          ]}
          layout={{
            template: 'plotly_dark',
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            margin: { l: 60, r: 20, t: 10, b: 40 },
            font: { color: '#f9fafb', size: 11 },
            height: 260,
            xaxis: { title: 'Age', showgrid: true, gridcolor: '#374151' },
            yaxis: { showgrid: true, gridcolor: '#374151' },
            legend: { orientation: 'h', y: -0.2 },
            shapes: [
              {
                type: 'line',
                x0: params.stop_working_age, x1: params.stop_working_age,
                y0: 0, y1: 1, yref: 'paper',
                line: { color: '#EF553B', width: 1.5, dash: 'dash' },
              },
              {
                type: 'line',
                x0: pension_info.pension_age, x1: pension_info.pension_age,
                y0: 0, y1: 1, yref: 'paper',
                line: { color: '#00CC96', width: 1.5, dash: 'dash' },
              },
            ],
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      </div>

      {/* Wealth snapshots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Age 50 snapshot */}
        <div className="card">
          <h3 className="text-sm font-medium text-dark-text mb-3">Wealth at Age 50 ({modeLabel})</h3>
          <div className="space-y-2">
            {[
              { label: 'Bank', value: row50[bankKey], color: 'text-accent-blue' },
              { label: 'ETF', value: row50[etfKey], color: 'text-accent-orange' },
              { label: 'Pension Fund', value: row50[pfKey], color: 'text-accent-green' },
              { label: 'Total', value: row50[totalKey], color: 'text-dark-text font-semibold' },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-dark-muted">{item.label}</span>
                <span className={item.color}>{fmt(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Target age snapshot */}
        <div className="card">
          <h3 className="text-sm font-medium text-dark-text mb-3">Wealth at Age {params.target_age} ({modeLabel})</h3>
          <div className="space-y-2">
            {[
              { label: 'Bank', value: rowTarget[bankKey], color: 'text-accent-blue' },
              { label: 'ETF', value: rowTarget[etfKey], color: 'text-accent-orange' },
              { label: 'Pension Fund', value: rowTarget[pfKey], color: 'text-accent-green' },
              { label: 'Total', value: rowTarget[totalKey], color: 'text-dark-text font-semibold' },
            ].map(item => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-dark-muted">{item.label}</span>
                <span className={item.color}>{fmt(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="card">
        <h3 className="text-sm font-medium text-dark-text mb-3">Key Parameters Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm">
          {[
            { label: 'Stop Working Age', value: params.stop_working_age },
            { label: 'Target Age', value: params.target_age },
            { label: 'SWR', value: `${params.swr}%` },
            { label: 'Inflation', value: `${params.inflation}%` },
            { label: 'Expected Return', value: `${params.expected_gross_return}%` },
            { label: 'Monthly PAC', value: fmt(params.monthly_pac) },
            { label: 'FIRE Number', value: fmt(fireNumber) },
            { label: 'Pension Age', value: pension_info.pension_age },
            { label: 'Marginal Tax Rate', value: `${tax_result.marginal_rate.toFixed(1)}%` },
            { label: 'Effective Tax Rate', value: fmtPct((tax_result.inps + tax_result.net_irpef) / params.ral * 100) },
          ].map(item => (
            <div key={item.label} className="flex justify-between">
              <span className="text-dark-muted text-xs">{item.label}</span>
              <span className="text-dark-text text-xs font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
