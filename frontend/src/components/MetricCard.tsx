import React from 'react';

interface Props {
  label: string;
  value: string | number;
  help?: string;
  color?: string;
}

export const MetricCard: React.FC<Props> = ({ label, value, help, color }) => (
  <div className="metric-card flex flex-col gap-1 min-w-0">
    <span className="text-xs text-dark-muted truncate" title={help}>{label}</span>
    <span className={`text-lg font-semibold truncate ${color || 'text-dark-text'}`}>
      {value}
    </span>
  </div>
);
