import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Plot from 'react-plotly.js';
import { useFireStore } from '../../store/useStore';
import { MetricCard } from '../MetricCard';
import type { ExpenseItem } from '../../types';

const FREQ_MONTHS: Record<string, number> = {
  Monthly: 1,
  Quarterly: 3,
  'Semi-annual': 6,
  Annual: 12,
};

const toMonthly = (amount: number, freq: string) => amount / FREQ_MONTHS[freq];

const fmt = (n: number, decimals = 0) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(n);

const FREQUENCIES: ExpenseItem['frequency'][] = ['Monthly', 'Quarterly', 'Semi-annual', 'Annual'];

const CATEGORY_COLORS = [
  '#636EFA', '#00CC96', '#FFA15A', '#EF553B', '#AB63FA',
  '#19D3F3', '#FF6692', '#B6E880', '#FF97FF', '#FECB52',
];

export const ExpensesTab: React.FC = () => {
  const { expenses, setExpenses } = useFireStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const categories = Object.keys(expenses);

  const totalMonthly = categories.reduce((sum, cat) => {
    return sum + expenses[cat].reduce((s, item) => s + toMonthly(item.amount, item.frequency), 0);
  }, 0);

  const totalAnnual = totalMonthly * 12;

  const categoryMonthly = (cat: string) =>
    expenses[cat].reduce((s, item) => s + toMonthly(item.amount, item.frequency), 0);

  const updateItem = (cat: string, idx: number, patch: Partial<ExpenseItem>) => {
    const updated = { ...expenses };
    updated[cat] = updated[cat].map((item, i) => (i === idx ? { ...item, ...patch } : item));
    setExpenses(updated);
  };

  const deleteItem = (cat: string, idx: number) => {
    const updated = { ...expenses };
    updated[cat] = updated[cat].filter((_, i) => i !== idx);
    setExpenses(updated);
  };

  const addItem = (cat: string) => {
    const updated = { ...expenses };
    updated[cat] = [...updated[cat], { name: 'New item', frequency: 'Monthly', amount: 0 }];
    setExpenses(updated);
  };

  const toggleCollapsed = (cat: string) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Chart data
  const chartX = categories;
  const chartY = categories.map(cat => categoryMonthly(cat));

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Total Monthly" value={fmt(totalMonthly)} color="text-accent-orange" />
        <MetricCard label="Total Annual" value={fmt(totalAnnual)} color="text-accent-blue" />
      </div>

      {/* Bar chart */}
      <div className="card">
        <h3 className="text-sm font-medium text-dark-text mb-3">Monthly Expenses by Category</h3>
        <Plot
          data={[{
            type: 'bar',
            x: chartX,
            y: chartY,
            marker: {
              color: CATEGORY_COLORS.slice(0, chartX.length),
            },
            text: chartY.map(v => fmt(v)),
            textposition: 'outside',
            hovertemplate: '%{x}: %{y:.2f}€<extra></extra>',
          }]}
          layout={{
            template: 'plotly_dark',
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            margin: { l: 60, r: 20, t: 20, b: 80 },
            font: { color: '#f9fafb', size: 11 },
            height: 220,
            showlegend: false,
            xaxis: { tickangle: -30 },
            yaxis: { title: '€/month' },
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%' }}
        />
      </div>

      {/* Category tables */}
      <div className="space-y-4">
        {categories.map((cat, catIdx) => {
          const catTotal = categoryMonthly(cat);
          const isCollapsed = collapsed[cat];
          return (
            <div key={cat} className="card">
              <div
                className="flex items-center justify-between cursor-pointer mb-2"
                onClick={() => toggleCollapsed(cat)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[catIdx % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-dark-text">{cat}</span>
                </div>
                <span className="text-sm text-dark-muted">{fmt(catTotal)}/mo</span>
              </div>

              {!isCollapsed && (
                <>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-dark-muted border-b border-dark-border">
                        <th className="text-left py-1 pr-2 w-1/2">Name</th>
                        <th className="text-left py-1 pr-2 w-1/4">Frequency</th>
                        <th className="text-right py-1 pr-2 w-1/4">Amount</th>
                        <th className="py-1 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses[cat].map((item, idx) => (
                        <tr key={idx} className="border-b border-dark-border/50 last:border-0">
                          <td className="py-1 pr-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={e => updateItem(cat, idx, { name: e.target.value })}
                              className="w-full bg-transparent border border-transparent hover:border-dark-border focus:border-accent-blue rounded px-1 py-0.5 text-xs text-dark-text focus:outline-none"
                            />
                          </td>
                          <td className="py-1 pr-2">
                            <select
                              value={item.frequency}
                              onChange={e => updateItem(cat, idx, { frequency: e.target.value as ExpenseItem['frequency'] })}
                              className="w-full bg-dark-bg border border-dark-border rounded px-1 py-0.5 text-xs text-dark-text focus:outline-none focus:border-accent-blue"
                            >
                              {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                          </td>
                          <td className="py-1 pr-2">
                            <input
                              type="number"
                              value={item.amount}
                              min={0}
                              step="any"
                              onChange={e => updateItem(cat, idx, { amount: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-dark-bg border border-dark-border rounded px-1 py-0.5 text-xs text-dark-text text-right focus:outline-none focus:border-accent-blue"
                            />
                          </td>
                          <td className="py-1">
                            <button
                              onClick={() => deleteItem(cat, idx)}
                              className="text-dark-muted hover:text-accent-red transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={() => addItem(cat)}
                    className="mt-2 flex items-center gap-1 text-xs text-accent-blue hover:text-accent-blue/80 transition-colors"
                  >
                    <Plus size={12} />
                    Add item
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
