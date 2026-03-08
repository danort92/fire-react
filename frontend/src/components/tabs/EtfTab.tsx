import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { Search, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import Plot from 'react-plotly.js';
import { MetricCard } from '../MetricCard';
import * as api from '../../api/client';
import type { ETFRecord, ETFLiveData } from '../../types';

const fmt = (n: number | null, decimals = 0) =>
  n === null ? 'N/A' : new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(n);

const fmtNum = (n: number | null, decimals = 2) =>
  n === null ? 'N/A' : n.toLocaleString('it-IT', { maximumFractionDigits: decimals });

export const EtfTab: React.FC = () => {
  const [searchQ, setSearchQ] = useState('');
  const [selectedAssetClasses, setSelectedAssetClasses] = useState<string[]>([]);
  const [selectedIssuers, setSelectedIssuers] = useState<string[]>([]);
  const [selectedDomiciles, setSelectedDomiciles] = useState<string[]>([]);
  const [distPolicy, setDistPolicy] = useState<string>('');
  const [selectedEtf, setSelectedEtf] = useState<ETFRecord | null>(null);
  const [queryEnabled, setQueryEnabled] = useState(true);

  // Search query
  const searchQuery = useQuery({
    queryKey: ['etf-search', searchQ, selectedAssetClasses, selectedIssuers, selectedDomiciles, distPolicy],
    queryFn: () => api.searchEtfs({
      q: searchQ,
      asset_classes: selectedAssetClasses,
      issuers: selectedIssuers,
      domiciles: selectedDomiciles,
      dist_policies: distPolicy ? [distPolicy] : [],
    }),
    enabled: queryEnabled,
    staleTime: 60_000,
  });

  // Live data mutation
  const liveMutation = useMutation<ETFLiveData, Error, string>({
    mutationFn: (ticker: string) => api.getEtfLive(ticker),
  });

  const handleSelectEtf = (etf: ETFRecord) => {
    setSelectedEtf(etf);
    if (etf.ticker) {
      liveMutation.mutate(etf.ticker);
    }
  };

  const etfList = searchQuery.data?.etfs || [];
  const filterData = searchQuery.data;

  const toggleFilter = (
    val: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="card">
        <h3 className="text-sm font-semibold text-dark-text mb-3">🔍 ETF Search</h3>

        {/* Search input */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search by name, ISIN, ticker, or benchmark..."
            className="input-field pl-8"
          />
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Asset class filter */}
          <div>
            <label className="text-xs text-dark-muted mb-1 block">Asset Class</label>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {(filterData?.asset_classes || []).map(ac => (
                <label key={ac} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAssetClasses.includes(ac)}
                    onChange={() => toggleFilter(ac, selectedAssetClasses, setSelectedAssetClasses)}
                    className="rounded"
                  />
                  <span className="text-xs text-dark-text">{ac}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Issuer filter */}
          <div>
            <label className="text-xs text-dark-muted mb-1 block">Issuer</label>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {(filterData?.issuers || []).map(iss => (
                <label key={iss} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIssuers.includes(iss)}
                    onChange={() => toggleFilter(iss, selectedIssuers, setSelectedIssuers)}
                    className="rounded"
                  />
                  <span className="text-xs text-dark-text">{iss}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Domicile filter */}
          <div>
            <label className="text-xs text-dark-muted mb-1 block">Domicile</label>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {(filterData?.domiciles || []).map(d => (
                <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDomiciles.includes(d)}
                    onChange={() => toggleFilter(d, selectedDomiciles, setSelectedDomiciles)}
                    className="rounded"
                  />
                  <span className="text-xs text-dark-text">{d}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Distribution policy */}
          <div>
            <label className="text-xs text-dark-muted mb-1 block">Distribution</label>
            <div className="space-y-1">
              {['', 'Accumulating', 'Distributing'].map(p => (
                <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={distPolicy === p}
                    onChange={() => setDistPolicy(p)}
                    className="rounded"
                  />
                  <span className="text-xs text-dark-text">{p || 'All'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-dark-text">
            Results {etfList.length > 0 ? `(${etfList.length})` : ''}
          </h3>
          {searchQuery.isFetching && <Loader2 size={14} className="animate-spin text-accent-blue" />}
        </div>

        {searchQuery.isError && (
          <div className="flex items-center gap-2 bg-accent-red/10 border border-accent-red/30 rounded-md px-3 py-2 mb-3">
            <AlertCircle size={14} className="text-accent-red" />
            <span className="text-xs text-accent-red">Failed to load ETFs. Check if the API is running.</span>
          </div>
        )}

        {etfList.length === 0 && !searchQuery.isFetching && (
          <p className="text-dark-muted text-sm py-4 text-center">
            {searchQuery.isSuccess ? 'No ETFs found matching your criteria.' : 'Start searching to see ETFs.'}
          </p>
        )}

        {etfList.length > 0 && (
          <div className="overflow-y-auto max-h-72">
            <table className="w-full text-xs min-w-[900px]">
              <thead className="sticky top-0 bg-dark-card">
                <tr className="text-dark-muted border-b border-dark-border">
                  <th className="text-left py-2 pr-3">ISIN</th>
                  <th className="text-left py-2 pr-3">Ticker</th>
                  <th className="text-left py-2 pr-3 w-56">Name</th>
                  <th className="text-right py-2 pr-3">TER%</th>
                  <th className="text-left py-2 pr-3">Asset Class</th>
                  <th className="text-left py-2 pr-3">Category</th>
                  <th className="text-left py-2 pr-3">Issuer</th>
                  <th className="text-left py-2 pr-3">Domicile</th>
                  <th className="text-left py-2">Policy</th>
                </tr>
              </thead>
              <tbody>
                {etfList.map(etf => (
                  <tr
                    key={etf.isin}
                    onClick={() => handleSelectEtf(etf)}
                    className={`border-b border-dark-border/30 last:border-0 cursor-pointer hover:bg-dark-border/30 transition-colors ${
                      selectedEtf?.isin === etf.isin ? 'bg-accent-blue/10' : ''
                    }`}
                  >
                    <td className="py-1.5 pr-3 font-mono text-dark-muted">{etf.isin}</td>
                    <td className="py-1.5 pr-3 font-medium text-accent-blue">{etf.ticker}</td>
                    <td className="py-1.5 pr-3 text-dark-text max-w-xs truncate" title={etf.name}>{etf.name}</td>
                    <td className="py-1.5 pr-3 text-right text-accent-orange">{etf.ter.toFixed(2)}%</td>
                    <td className="py-1.5 pr-3 text-dark-muted">{etf.asset_class}</td>
                    <td className="py-1.5 pr-3 text-dark-muted max-w-xs truncate" title={etf.sub_category}>{etf.sub_category}</td>
                    <td className="py-1.5 pr-3 text-dark-muted">{etf.issuer}</td>
                    <td className="py-1.5 pr-3 text-dark-muted">{etf.domicile}</td>
                    <td className="py-1.5 text-dark-muted">{etf.dist_policy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected ETF details */}
      {selectedEtf && (
        <div className="space-y-4">
          {/* Static metadata */}
          <div className="card">
            <h3 className="text-sm font-semibold text-dark-text mb-3">
              {selectedEtf.name}
              <span className="ml-2 text-xs font-normal text-dark-muted">{selectedEtf.isin}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
              <MetricCard label="Ticker" value={selectedEtf.ticker} color="text-accent-blue" />
              <MetricCard label="TER" value={`${selectedEtf.ter.toFixed(2)}%`} color="text-accent-orange" />
              <MetricCard label="Issuer" value={selectedEtf.issuer} color="text-dark-text" />
              <MetricCard label="Domicile" value={selectedEtf.domicile} color="text-dark-muted" />
              <MetricCard label="Distribution" value={selectedEtf.dist_policy} color="text-dark-text" />
            </div>
            <div className="text-xs text-dark-muted">
              <span className="font-medium text-dark-text">Benchmark: </span>
              {selectedEtf.benchmark || 'N/A'}
            </div>

            {/* TER info */}
            <div className="mt-3 bg-accent-orange/10 border border-accent-orange/20 rounded-md px-3 py-2 text-xs text-dark-muted">
              <span className="text-accent-orange font-medium">TER Info: </span>
              Total Expense Ratio of {selectedEtf.ter.toFixed(2)}% is charged annually from the fund.
              Over 30 years, this reduces returns by approximately {(Math.pow(1 - selectedEtf.ter / 100, 30) * 100 - 100).toFixed(1)}% cumulatively.
            </div>
          </div>

          {/* Live data section */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-dark-text">Live Market Data</h3>
              <button
                onClick={() => selectedEtf.ticker && liveMutation.mutate(selectedEtf.ticker)}
                disabled={liveMutation.isPending}
                className="flex items-center gap-1.5 text-xs px-2 py-1 bg-dark-border rounded text-dark-muted hover:text-dark-text disabled:opacity-60 transition-colors"
              >
                {liveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                Refresh
              </button>
            </div>

            {liveMutation.isPending && (
              <div className="flex items-center justify-center h-24">
                <Loader2 size={20} className="animate-spin text-accent-blue" />
              </div>
            )}

            {liveMutation.isError && (
              <div className="flex items-center gap-2 bg-accent-red/10 border border-accent-red/30 rounded-md px-3 py-2">
                <AlertCircle size={12} className="text-accent-red" />
                <span className="text-xs text-accent-red">Failed to load live data. The ticker may not be available.</span>
              </div>
            )}

            {liveMutation.data && !liveMutation.isPending && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <MetricCard
                    label="AUM"
                    value={liveMutation.data.info.aum !== null ? `${(liveMutation.data.info.aum / 1e9).toFixed(2)}B ${liveMutation.data.info.currency}` : 'N/A'}
                    color="text-accent-blue"
                  />
                  <MetricCard
                    label="NAV"
                    value={liveMutation.data.info.nav !== null ? `${fmtNum(liveMutation.data.info.nav)} ${liveMutation.data.info.currency}` : 'N/A'}
                    color="text-dark-text"
                  />
                  <MetricCard
                    label="12m Yield"
                    value={liveMutation.data.info.yield_12m !== null ? `${(liveMutation.data.info.yield_12m * 100).toFixed(2)}%` : 'N/A'}
                    color="text-accent-green"
                  />
                  <MetricCard
                    label="YTD Return"
                    value={liveMutation.data.info.ytd_return !== null ? `${(liveMutation.data.info.ytd_return * 100).toFixed(2)}%` : 'N/A'}
                    color={liveMutation.data.info.ytd_return !== null && liveMutation.data.info.ytd_return >= 0 ? 'text-accent-green' : 'text-accent-red'}
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <MetricCard
                    label="52-week High"
                    value={liveMutation.data.info.wk52_hi !== null ? `${fmtNum(liveMutation.data.info.wk52_hi)} ${liveMutation.data.info.currency}` : 'N/A'}
                    color="text-accent-green"
                  />
                  <MetricCard
                    label="52-week Low"
                    value={liveMutation.data.info.wk52_lo !== null ? `${fmtNum(liveMutation.data.info.wk52_lo)} ${liveMutation.data.info.currency}` : 'N/A'}
                    color="text-accent-red"
                  />
                  <MetricCard
                    label="Live TER"
                    value={liveMutation.data.info.live_ter !== null ? `${(liveMutation.data.info.live_ter * 100).toFixed(2)}%` : 'N/A'}
                    color="text-accent-orange"
                  />
                </div>

                {/* Price history chart */}
                {liveMutation.data.history.dates.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-dark-muted mb-2">Price History</h4>
                    <Plot
                      data={[{
                        type: 'scatter',
                        mode: 'lines',
                        x: liveMutation.data.history.dates,
                        y: liveMutation.data.history.closes,
                        name: selectedEtf.ticker,
                        line: { color: '#636EFA', width: 2 },
                        fill: 'tozeroy',
                        fillcolor: 'rgba(99,110,250,0.1)',
                        hovertemplate: '%{x}: %{y:.2f}<extra></extra>',
                      }]}
                      layout={{
                        template: 'plotly_dark',
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                        margin: { l: 60, r: 20, t: 10, b: 50 },
                        font: { color: '#f9fafb', size: 11 },
                        height: 250,
                        showlegend: false,
                        xaxis: { title: 'Date', showgrid: true, gridcolor: '#374151' },
                        yaxis: { title: liveMutation.data.info.currency, showgrid: true, gridcolor: '#374151' },
                      }}
                      config={{ responsive: true, displayModeBar: false }}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}

                {/* Holdings table */}
                {liveMutation.data.funds.top_holdings && liveMutation.data.funds.top_holdings.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-dark-muted mb-2">Top Holdings</h4>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-dark-muted border-b border-dark-border">
                          <th className="text-left py-1.5">Holding</th>
                          <th className="text-right py-1.5">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveMutation.data.funds.top_holdings.slice(0, 10).map((h: any, i: number) => (
                          <tr key={i} className="border-b border-dark-border/30">
                            <td className="py-1.5 text-dark-text">{h.holdingName || h.symbol || 'Unknown'}</td>
                            <td className="py-1.5 text-right text-accent-blue">
                              {h.holdingPercent != null ? `${(h.holdingPercent * 100).toFixed(2)}%` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sector allocation pie */}
                {liveMutation.data.funds.sector_weightings && liveMutation.data.funds.sector_weightings.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-dark-muted mb-2">Sector Allocation</h4>
                    <Plot
                      data={[{
                        type: 'pie',
                        labels: liveMutation.data.funds.sector_weightings.map((s: any) => Object.keys(s)[0]),
                        values: liveMutation.data.funds.sector_weightings.map((s: any) => Object.values(s)[0]),
                        hole: 0.4,
                        textinfo: 'percent',
                        hovertemplate: '%{label}: %{percent}<extra></extra>',
                      }]}
                      layout={{
                        template: 'plotly_dark',
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                        margin: { l: 20, r: 20, t: 10, b: 20 },
                        font: { color: '#f9fafb', size: 10 },
                        height: 220,
                        legend: { orientation: 'v', x: 1, y: 0.5, font: { size: 9 } },
                      }}
                      config={{ responsive: true, displayModeBar: false }}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
