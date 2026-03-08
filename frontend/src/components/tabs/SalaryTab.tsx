import React from 'react';
import Plot from 'react-plotly.js';
import { useFireStore } from '../../store/useStore';
import { MetricCard } from '../MetricCard';

const fmt = (n: number, decimals = 0) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(n);

const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;

export const SalaryTab: React.FC = () => {
  const { baseResult, params } = useFireStore();

  if (!baseResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-dark-muted text-sm">Run computation to see results</p>
      </div>
    );
  }

  const { tax_result } = baseResult;

  const taxRows = [
    { label: 'Gross RAL', value: fmt(params.ral), className: 'text-dark-text font-medium' },
    { label: 'INPS (Employee)', value: fmt(tax_result.inps), className: 'text-accent-red' },
    { label: 'Taxable Income', value: fmt(tax_result.taxable_income), className: 'text-dark-text' },
    { label: 'Gross IRPEF', value: fmt(tax_result.irpef), className: 'text-accent-red' },
    { label: 'Deductions', value: fmt(tax_result.deductions), className: 'text-accent-green' },
    ...(tax_result.trattamento_integrativo > 0
      ? [{ label: 'Trattamento Integrativo', value: fmt(tax_result.trattamento_integrativo), className: 'text-accent-green' }]
      : []),
    { label: 'Regional/Municipal Surcharges', value: fmt(tax_result.surcharges), className: 'text-accent-red' },
    { label: 'Net IRPEF', value: fmt(tax_result.net_irpef), className: 'text-accent-orange font-medium' },
    { label: 'Net Annual Salary', value: fmt(tax_result.net_annual_salary), className: 'text-accent-green font-semibold' },
  ];

  // Pie chart data
  const inpsAmt = tax_result.inps;
  const netIrpefAmt = tax_result.net_irpef + tax_result.surcharges;
  const benefits = params.company_benefits;
  const takeHome = tax_result.net_annual_salary;

  const pieLabels = ['INPS', 'Net IRPEF + Surcharges', 'Welfare/Benefits', 'Take-home'];
  const pieValues = [inpsAmt, netIrpefAmt, benefits, takeHome];
  const pieColors = ['#EF553B', '#FFA15A', '#00CC96', '#636EFA'];

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard
          label="Gross RAL"
          value={fmt(params.ral)}
          color="text-dark-text"
        />
        <MetricCard
          label="Net Annual"
          value={fmt(tax_result.net_annual_salary)}
          color="text-accent-green"
        />
        <MetricCard
          label="Net Monthly /13"
          value={fmt(tax_result.net_monthly_13)}
          color="text-accent-blue"
        />
        <MetricCard
          label="Net Monthly /12"
          value={fmt(tax_result.net_monthly_12)}
          color="text-accent-blue"
        />
        <MetricCard
          label="Marginal Rate"
          value={fmtPct(tax_result.marginal_rate)}
          color="text-accent-orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax breakdown table */}
        <div className="card">
          <h3 className="text-sm font-medium text-dark-text mb-3">Tax Breakdown</h3>
          <table className="w-full text-sm">
            <tbody>
              {taxRows.map(row => (
                <tr key={row.label} className="border-b border-dark-border/50 last:border-0">
                  <td className="py-2 text-dark-muted">{row.label}</td>
                  <td className={`py-2 text-right ${row.className}`}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 className="text-sm font-medium text-dark-text mb-3">Salary Breakdown</h3>
          <Plot
            data={[{
              type: 'pie',
              labels: pieLabels,
              values: pieValues,
              marker: { colors: pieColors },
              hole: 0.45,
              textinfo: 'percent',
              hovertemplate: '%{label}: %{value:.0f}€ (%{percent})<extra></extra>',
            }]}
            layout={{
              template: 'plotly_dark',
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              margin: { l: 20, r: 20, t: 20, b: 20 },
              font: { color: '#f9fafb', size: 11 },
              height: 260,
              legend: { orientation: 'v', x: 1.05, y: 0.5 },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%' }}
          />
          <div className="mt-2 text-xs text-dark-muted text-center">
            Effective tax rate: {fmtPct((inpsAmt + netIrpefAmt) / params.ral * 100, 1)}
          </div>
        </div>
      </div>

      {/* Additional info */}
      <div className="card">
        <h3 className="text-sm font-medium text-dark-text mb-3">Net Monthly Take-home Comparison</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-dark-muted">Per 12 months (incl. 13th in Dec)</p>
            <p className="text-lg font-semibold text-accent-green">{fmt(tax_result.net_monthly_12)}</p>
            <p className="text-xs text-dark-muted mt-1">Annual: {fmt(tax_result.net_monthly_12 * 12)}</p>
          </div>
          <div>
            <p className="text-xs text-dark-muted">Per 13 months (monthly)</p>
            <p className="text-lg font-semibold text-accent-blue">{fmt(tax_result.net_monthly_13)}</p>
            <p className="text-xs text-dark-muted mt-1">Annual: {fmt(tax_result.net_monthly_13 * 13)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
