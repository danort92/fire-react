import React from 'react';
import Plot from 'react-plotly.js';
import { Download } from 'lucide-react';
import { useFireStore } from '../../store/useStore';
import { MetricCard } from '../MetricCard';
import type { ProjectionRow } from '../../types';

const fmt = (n: number, decimals = 0) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(n);

export const ProjectionsTab: React.FC = () => {
  const { baseResult, params, displayReal, toggleDisplayReal } = useFireStore();

  if (!baseResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-dark-muted text-sm">Run computation to see results</p>
      </div>
    );
  }

  const { rows, pension_info } = baseResult;

  const ages = rows.map((r: ProjectionRow) => r.age);

  const bankKey = displayReal ? 'bank_real' : 'bank';
  const pfKey = displayReal ? 'pf_real' : 'pf';
  const etfKey = displayReal ? 'etf_real' : 'etf';
  const tfrKey = displayReal ? 'tfr_real' : 'tfr_company';
  const totalKey = displayReal ? 'total_real' : 'total_nominal';

  const bankVals = rows.map((r: ProjectionRow) => r[bankKey]);
  const pfVals = rows.map((r: ProjectionRow) => r[pfKey]);
  const etfVals = rows.map((r: ProjectionRow) => r[etfKey]);
  const tfrVals = rows.map((r: ProjectionRow) => r[tfrKey]);
  const totalVals = rows.map((r: ProjectionRow) => r[totalKey]);

  const hasTfr = params.tfr_destination === 'company';

  const modeLabel = displayReal ? 'Real (today\'s €)' : 'Nominal';

  // Vertical line shapes
  const shapes: any[] = [];
  if (params.stop_working_age && params.stop_working_age > params.current_age) {
    shapes.push({
      type: 'line',
      x0: params.stop_working_age, x1: params.stop_working_age,
      y0: 0, y1: 1, yref: 'paper',
      line: { color: '#EF553B', width: 1.5, dash: 'dash' },
    });
  }
  if (pension_info.pension_age) {
    shapes.push({
      type: 'line',
      x0: pension_info.pension_age, x1: pension_info.pension_age,
      y0: 0, y1: 1, yref: 'paper',
      line: { color: '#00CC96', width: 1.5, dash: 'dash' },
    });
  }

  const annotations: any[] = [
    {
      x: params.stop_working_age,
      y: 1, yref: 'paper',
      text: 'FIRE',
      showarrow: false,
      font: { color: '#EF553B', size: 10 },
      xanchor: 'left',
    },
    {
      x: pension_info.pension_age,
      y: 0.95, yref: 'paper',
      text: 'Pension',
      showarrow: false,
      font: { color: '#00CC96', size: 10 },
      xanchor: 'left',
    },
  ];

  const plotData: any[] = [
    {
      type: 'scatter',
      mode: 'none',
      x: ages,
      y: bankVals,
      name: 'Bank',
      fill: 'tozeroy',
      fillcolor: 'rgba(99,110,250,0.35)',
      stackgroup: 'one',
      line: { color: '#636EFA' },
    },
    {
      type: 'scatter',
      mode: 'none',
      x: ages,
      y: pfVals,
      name: 'Pension Fund',
      fill: 'tonexty',
      fillcolor: 'rgba(0,204,150,0.35)',
      stackgroup: 'one',
      line: { color: '#00CC96' },
    },
    {
      type: 'scatter',
      mode: 'none',
      x: ages,
      y: etfVals,
      name: 'ETF',
      fill: 'tonexty',
      fillcolor: 'rgba(255,161,90,0.35)',
      stackgroup: 'one',
      line: { color: '#FFA15A' },
    },
    ...(hasTfr ? [{
      type: 'scatter',
      mode: 'none',
      x: ages,
      y: tfrVals,
      name: 'TFR',
      fill: 'tonexty',
      fillcolor: 'rgba(171,99,250,0.35)',
      stackgroup: 'one',
      line: { color: '#AB63FA' },
    }] : []),
    {
      type: 'scatter',
      mode: 'lines',
      x: ages,
      y: totalVals,
      name: 'Total Wealth',
      line: { color: '#f9fafb', width: 2, dash: 'dot' },
    },
  ];

  const peakRow = rows.reduce((max: ProjectionRow, r: ProjectionRow) =>
    r[totalKey] > max[totalKey] ? r : max, rows[0]);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label={`Current Total (${modeLabel})`}
          value={fmt(rows[0]?.[totalKey] || 0)}
          color="text-accent-blue"
        />
        <MetricCard
          label="Peak Wealth"
          value={`${fmt(peakRow[totalKey])} @ ${peakRow.age}`}
          color="text-accent-green"
        />
        <MetricCard
          label="ETF Net Return"
          value={`${baseResult.etf_net_return.toFixed(2)}%`}
          color="text-accent-orange"
        />
        <MetricCard
          label="Pension Age"
          value={`Age ${pension_info.pension_age}`}
          color="text-accent-purple"
        />
      </div>

      {/* Stacked area chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-dark-text">Wealth Projections — {modeLabel}</h3>
          <button
            onClick={toggleDisplayReal}
            className="text-xs px-3 py-1 bg-dark-border rounded text-dark-muted hover:text-dark-text transition-colors"
          >
            Switch to {displayReal ? 'Nominal' : 'Real'}
          </button>
        </div>
        <Plot
          data={plotData}
          layout={{
            template: 'plotly_dark',
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            margin: { l: 70, r: 20, t: 20, b: 50 },
            font: { color: '#f9fafb', size: 11 },
            height: 350,
            xaxis: { title: 'Age', showgrid: true, gridcolor: '#374151' },
            yaxis: { title: `Value (${modeLabel} €)`, showgrid: true, gridcolor: '#374151' },
            legend: { orientation: 'h', y: -0.15 },
            shapes,
            annotations,
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      </div>

      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={() => alert('Export feature — would generate .xlsx')}
          className="flex items-center gap-2 text-sm px-4 py-2 bg-dark-card border border-dark-border rounded-md text-dark-muted hover:text-dark-text hover:border-accent-blue transition-colors"
        >
          <Download size={14} />
          Export to Excel
        </button>
      </div>

      {/* Projection table */}
      <div className="card overflow-x-auto">
        <h3 className="text-sm font-medium text-dark-text mb-3">Projection Table ({modeLabel})</h3>
        <div className="overflow-y-auto max-h-80">
          <table className="w-full text-xs min-w-[600px]">
            <thead className="sticky top-0 bg-dark-card">
              <tr className="text-dark-muted border-b border-dark-border">
                <th className="text-left py-2 pr-3">Age</th>
                <th className="text-right py-2 pr-3">Bank</th>
                <th className="text-right py-2 pr-3">ETF</th>
                <th className="text-right py-2 pr-3">Pension Fund</th>
                {hasTfr && <th className="text-right py-2 pr-3">TFR</th>}
                <th className="text-right py-2 pr-3">Total</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: ProjectionRow) => (
                <tr
                  key={row.age}
                  className={`border-b border-dark-border/30 last:border-0 ${
                    row.age === params.stop_working_age ? 'bg-accent-red/5' :
                    row.age === pension_info.pension_age ? 'bg-accent-green/5' : ''
                  }`}
                >
                  <td className="py-1.5 pr-3 font-medium text-dark-text">{row.age}</td>
                  <td className="py-1.5 pr-3 text-right text-dark-muted">{fmt(row[bankKey])}</td>
                  <td className="py-1.5 pr-3 text-right text-accent-orange">{fmt(row[etfKey])}</td>
                  <td className="py-1.5 pr-3 text-right text-accent-green">{fmt(row[pfKey])}</td>
                  {hasTfr && <td className="py-1.5 pr-3 text-right text-accent-purple">{fmt(row[tfrKey])}</td>}
                  <td className="py-1.5 pr-3 text-right text-accent-blue font-medium">{fmt(row[totalKey])}</td>
                  <td className="py-1.5 text-xs">
                    {row.working ? (
                      <span className="text-accent-green">Working</span>
                    ) : row.part_time ? (
                      <span className="text-accent-orange">Part-time</span>
                    ) : (
                      <span className="text-accent-red">FIRE</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
