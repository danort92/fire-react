import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import Plot from 'react-plotly.js';
import { useFireStore } from '../../store/useStore';
import { MetricCard } from '../MetricCard';
import * as api from '../../api/client';
import type { SensitivityResult } from '../../types';

const AXIS_VARIABLES = [
  'Monthly expenses',
  'ETF net return',
  'Monthly PAC',
  'Inflation',
  'RAL (salary)',
];

const OUTPUT_METRICS = [
  'Earliest retirement age',
  'Portfolio at target age',
];

const AXIS_LABELS: Record<string, string> = {
  'Monthly expenses': 'Monthly Expenses (€)',
  'ETF net return': 'ETF Net Return',
  'Monthly PAC': 'Monthly PAC (€)',
  'Inflation': 'Inflation',
  'RAL (salary)': 'RAL (€)',
};

const METRIC_LABELS: Record<string, string> = {
  'Earliest retirement age': 'Earliest Retirement Age',
  'Portfolio at target age': 'Wealth at Target Age (€)',
};

const fmt = (n: number, decimals = 0) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(n);

export const SensitivityTab: React.FC = () => {
  const { params, baseResult } = useFireStore();
  const [xVar, setXVar] = useState('ETF net return');
  const [yVar, setYVar] = useState('Monthly expenses');
  const [outputMetric, setOutputMetric] = useState('Earliest retirement age');

  const mutation = useMutation<SensitivityResult, Error>({
    mutationFn: () => {
      if (!baseResult) throw new Error('No base result');
      return api.computeSensitivity(
        params,
        {
          net_monthly_salary: baseResult.net_monthly_salary,
          monthly_expenses: baseResult.monthly_expenses,
          pension_info: baseResult.pension_info,
        },
        { x_var: xVar, y_var: yVar, output_metric: outputMetric }
      );
    },
  });

  const data = mutation.data;

  // Build heatmap text annotations
  const buildAnnotations = (result: SensitivityResult) => {
    const annotations: any[] = [];
    for (let yi = 0; yi < result.y_labels.length; yi++) {
      for (let xi = 0; xi < result.x_labels.length; xi++) {
        const val = result.matrix[yi][xi];
        if (val !== null) {
          annotations.push({
            x: xi,
            y: yi,
            text: isAgeMetric
              ? String(Math.round(val))
              : val >= 1_000_000
              ? `${(val / 1_000_000).toFixed(1)}M`
              : val >= 1000
              ? `${(val / 1000).toFixed(0)}k`
              : val.toFixed(0),
            showarrow: false,
            font: { size: 9, color: '#f9fafb' },
          });
        }
      }
    }
    return annotations;
  };

  const isAgeMetric = outputMetric === 'Earliest retirement age';
  const colorscale = isAgeMetric ? 'RdYlGn_r' : 'RdYlGn';

  // Compute base/best/worst from matrix
  let baseVal: number | null = null;
  let bestVal: number | null = null;
  let worstVal: number | null = null;

  if (data) {
    const flatVals = data.matrix.flat().filter((v): v is number => v !== null);
    if (flatVals.length > 0) {
      baseVal = flatVals[Math.floor(flatVals.length / 2)];
      bestVal = isAgeMetric ? Math.min(...flatVals) : Math.max(...flatVals);
      worstVal = isAgeMetric ? Math.max(...flatVals) : Math.min(...flatVals);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-sm font-semibold text-dark-text mb-4">🔬 Sensitivity Analysis</h3>
        <p className="text-xs text-dark-muted mb-4">
          Analyze how two variables jointly affect a key output metric. Select X axis, Y axis, and output metric, then run the analysis.
        </p>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-dark-muted mb-1 block">Output Metric</label>
            <select
              className="input-field"
              value={outputMetric}
              onChange={e => setOutputMetric(e.target.value)}
            >
              {OUTPUT_METRICS.map(m => (
                <option key={m} value={m}>{METRIC_LABELS[m] || m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-dark-muted mb-1 block">Y Axis Variable</label>
            <select
              className="input-field"
              value={yVar}
              onChange={e => setYVar(e.target.value)}
            >
              {AXIS_VARIABLES.filter(v => v !== xVar).map(v => (
                <option key={v} value={v}>{AXIS_LABELS[v] || v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-dark-muted mb-1 block">X Axis Variable</label>
            <select
              className="input-field"
              value={xVar}
              onChange={e => setXVar(e.target.value)}
            >
              {AXIS_VARIABLES.filter(v => v !== yVar).map(v => (
                <option key={v} value={v}>{AXIS_LABELS[v] || v}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !baseResult}
          className="flex items-center gap-2 text-sm px-4 py-2 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-md transition-colors"
        >
          {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
          {mutation.isPending ? 'Running...' : 'Run Sensitivity Analysis'}
        </button>
      </div>

      {mutation.isError && (
        <div className="flex items-center gap-2 bg-accent-red/10 border border-accent-red/30 rounded-md px-3 py-3">
          <AlertCircle size={14} className="text-accent-red" />
          <span className="text-sm text-accent-red">{mutation.error?.message}</span>
        </div>
      )}

      {/* Summary metrics */}
      {data && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              label="Base Case"
              value={baseVal !== null
                ? isAgeMetric ? `Age ${Math.round(baseVal)}` : fmt(baseVal)
                : 'N/A'}
              color="text-dark-text"
            />
            <MetricCard
              label="Best Case"
              value={bestVal !== null
                ? isAgeMetric ? `Age ${Math.round(bestVal)}` : fmt(bestVal)
                : 'N/A'}
              color="text-accent-green"
            />
            <MetricCard
              label="Worst Case"
              value={worstVal !== null
                ? isAgeMetric ? `Age ${Math.round(worstVal)}` : fmt(worstVal)
                : 'N/A'}
              color="text-accent-red"
            />
          </div>

          {/* Heatmap */}
          <div className="card">
            <h3 className="text-sm font-medium text-dark-text mb-3">
              {METRIC_LABELS[outputMetric] || outputMetric}
            </h3>
            <Plot
              data={[{
                type: 'heatmap',
                z: data.matrix,
                x: data.x_labels,
                y: data.y_labels,
                colorscale,
                showscale: true,
                hovertemplate: `${AXIS_LABELS[xVar] || xVar}: %{x}<br>${AXIS_LABELS[yVar] || yVar}: %{y}<br>Value: %{z:.1f}<extra></extra>`,
              }]}
              layout={{
                template: 'plotly_dark',
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                margin: { l: 80, r: 80, t: 20, b: 80 },
                font: { color: '#f9fafb', size: 11 },
                height: 420,
                xaxis: {
                  title: AXIS_LABELS[xVar] || xVar,
                  type: 'category',
                  tickangle: -30,
                },
                yaxis: {
                  title: AXIS_LABELS[yVar] || yVar,
                  type: 'category',
                },
                annotations: buildAnnotations(data),
              }}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: '100%' }}
            />
          </div>
        </>
      )}

      {!data && !mutation.isPending && (
        <div className="card flex items-center justify-center h-48">
          <p className="text-dark-muted text-sm">Run sensitivity analysis to see the heatmap</p>
        </div>
      )}
    </div>
  );
};
