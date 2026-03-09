import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import Plot from 'react-plotly.js';
import { useFireStore } from '../../store/useStore';
import { MetricCard } from '../MetricCard';
import * as api from '../../api/client';
import type { NpvResult } from '../../types';

const fmt = (n: number, decimals = 0) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(n);

export const PensionTab: React.FC = () => {
  const { params, baseResult, displayReal } = useFireStore();

  const npvMutation = useMutation<NpvResult, Error>({
    mutationFn: () => {
      if (!baseResult) throw new Error('No base result');
      return api.computeNpv(params, {
        net_monthly_salary: baseResult.net_monthly_salary,
        monthly_expenses: baseResult.monthly_expenses,
        pension_info: baseResult.pension_info,
      });
    },
  });

  if (!baseResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-dark-muted text-sm">Run computation to see results</p>
      </div>
    );
  }

  const { pension_info, pension_fund_info } = baseResult;
  const modeLabel = displayReal ? 'Real' : 'Nominal';

  return (
    <div className="space-y-6">
      {/* Section 1: INPS State Pension */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-dark-text">🏛️ INPS State Pension</h3>
          {pension_info.eligible ? (
            <span className="flex items-center gap-1 text-xs text-accent-green bg-accent-green/10 border border-accent-green/30 rounded px-2 py-0.5">
              <CheckCircle size={12} />
              Eligible
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-accent-red bg-accent-red/10 border border-accent-red/30 rounded px-2 py-0.5">
              <XCircle size={12} />
              Not eligible with current params
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label="Pension Age"
            value={`Age ${pension_info.pension_age}`}
            color="text-accent-blue"
          />
          <MetricCard
            label="Contribution Years"
            value={`${pension_info.contribution_years} yrs`}
            color="text-dark-text"
          />
          <MetricCard
            label="Contributory Capital"
            value={fmt(pension_info.montante)}
            color="text-accent-orange"
          />
          <MetricCard
            label="Gross Annual"
            value={fmt(pension_info.gross_annual)}
            color="text-dark-text"
          />
          <MetricCard
            label={`Net Annual (${modeLabel})`}
            value={fmt(pension_info.net_annual_nominal)}
            color="text-accent-green"
          />
          <MetricCard
            label={`Net Monthly (${modeLabel})`}
            value={fmt(pension_info.net_monthly_nominal)}
            color="text-accent-green"
          />
        </div>
      </div>

      {/* Section 2: Pension Fund */}
      <div className="card">
        <h3 className="text-sm font-semibold text-dark-text mb-4">💼 Pension Fund (Fondo Pensione)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <MetricCard
            label="Base Annual Contribution"
            value={fmt(pension_fund_info.total_base_contribution)}
            color="text-dark-text"
          />
          <MetricCard
            label="With Voluntary Extra"
            value={fmt(pension_fund_info.total_with_voluntary)}
            color="text-accent-blue"
          />
          <MetricCard
            label="Actual Deductible"
            value={fmt(pension_fund_info.actual_deductible)}
            color="text-accent-orange"
          />
          <MetricCard
            label="Annual Tax Savings"
            value={fmt(pension_fund_info.tax_savings)}
            color="text-accent-green"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Marginal Tax Rate"
            value={`${pension_fund_info.marginal_rate.toFixed(1)}%`}
            color="text-dark-muted"
          />
          <MetricCard
            label="Fund Return"
            value={`${pension_fund_info.fund_return.toFixed(1)}%`}
            color="text-accent-blue"
          />
          <MetricCard
            label="Annuity Rate"
            value={`${pension_fund_info.annuity_rate.toFixed(1)}%`}
            color="text-accent-purple"
          />
          <MetricCard
            label="Age Joined Fund"
            value={`Age ${pension_fund_info.age_joined}`}
            color="text-dark-muted"
          />
        </div>
      </div>

      {/* Section 3: NPV Comparison */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-dark-text">⚖️ NPV Comparison: Pension Fund vs ETF</h3>
          <button
            onClick={() => npvMutation.mutate()}
            disabled={npvMutation.isPending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-accent-blue/20 border border-accent-blue/40 rounded-md text-accent-blue hover:bg-accent-blue/30 transition-colors disabled:opacity-60"
          >
            {npvMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
            {npvMutation.isPending ? 'Computing...' : 'Compute NPV'}
          </button>
        </div>

        {npvMutation.isError && (
          <div className="flex items-center gap-2 bg-accent-red/10 border border-accent-red/30 rounded-md px-3 py-2 mb-3">
            <AlertCircle size={14} className="text-accent-red" />
            <span className="text-xs text-accent-red">{npvMutation.error?.message}</span>
          </div>
        )}

        {!npvMutation.data && !npvMutation.isPending && (
          <p className="text-xs text-dark-muted mb-3">
            Click "Compute NPV" to compare pension fund vs direct ETF investment.
          </p>
        )}

        <div className="text-xs text-dark-muted bg-dark-border/20 rounded px-3 py-2 mb-3">
          <span className="font-medium text-dark-text">About negative NPV values: </span>
          Both values can be negative — this is expected. The discount rate used equals the ETF net return,
          so the NPV measures the "excess value" relative to that opportunity cost.
          A negative NPV simply means that stream of cash flows is worth less than investing the same money at the ETF return indefinitely.
          What matters is the <span className="font-medium text-dark-text">comparison between the two</span>: whichever NPV is higher (less negative) is the better option.
        </div>

        {npvMutation.data && (
          <>
            {/* Winner banner */}
            <div className={`mb-4 px-4 py-3 rounded-lg border ${
              npvMutation.data.winner === 'Pension Fund'
                ? 'bg-accent-green/10 border-accent-green/30 text-accent-green'
                : 'bg-accent-blue/10 border-accent-blue/30 text-accent-blue'
            }`}>
              <p className="text-sm font-semibold">
                Winner: {npvMutation.data.winner}
              </p>
              <p className="text-xs opacity-80 mt-0.5">
                NPV difference: {fmt(Math.abs(npvMutation.data.npv_difference))} in favor of {npvMutation.data.winner}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <MetricCard
                label="Pension Fund NPV"
                value={fmt(npvMutation.data.pension_fund_npv)}
                color="text-accent-green"
              />
              <MetricCard
                label="ETF NPV"
                value={fmt(npvMutation.data.etf_npv)}
                color="text-accent-blue"
              />
              <MetricCard
                label="PF Montante"
                value={fmt(npvMutation.data.montante_pf)}
                color="text-dark-text"
              />
              <MetricCard
                label="ETF Terminal Value"
                value={fmt(npvMutation.data.montante_etf)}
                color="text-dark-text"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <MetricCard
                label="Annual Pension Annuity"
                value={fmt(npvMutation.data.rendita_annual)}
                color="text-accent-orange"
              />
              <MetricCard
                label="Annual ETF Withdrawal (Net)"
                value={fmt(npvMutation.data.net_withdrawal_annual)}
                color="text-accent-purple"
              />
            </div>

            {/* Bar chart */}
            <Plot
              data={[{
                type: 'bar',
                x: ['Pension Fund NPV', 'ETF NPV'],
                y: [npvMutation.data.pension_fund_npv, npvMutation.data.etf_npv],
                marker: {
                  color: [
                    npvMutation.data.winner === 'Pension Fund' ? '#00CC96' : '#636EFA',
                    npvMutation.data.winner === 'ETF' ? '#00CC96' : '#636EFA',
                  ],
                },
                text: [
                  fmt(npvMutation.data.pension_fund_npv),
                  fmt(npvMutation.data.etf_npv),
                ],
                textposition: 'outside',
                hovertemplate: '%{x}: %{y:.0f}€<extra></extra>',
              }]}
              layout={{
                template: 'plotly_dark',
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                margin: { l: 70, r: 20, t: 30, b: 60 },
                font: { color: '#f9fafb', size: 11 },
                height: 240,
                showlegend: false,
                yaxis: { title: 'Net Present Value (€)', showgrid: true, gridcolor: '#374151' },
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
