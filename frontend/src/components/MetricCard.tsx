import React from 'react';
import { Info } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  help?: string;
  color?: string;
}

export const MetricCard: React.FC<Props> = ({ label, value, help, color }) => (
  <div className="metric-card flex flex-col gap-1 min-w-0">
    <div className="flex items-center gap-1 min-w-0">
      <span className="text-xs text-dark-muted truncate">{label}</span>
      {help && (
        <span title={help} className="shrink-0 cursor-help text-dark-muted/40 hover:text-dark-muted transition-colors">
          <Info size={10} />
        </span>
      )}
    </div>
    <span className={`text-lg font-semibold truncate ${color || 'text-dark-text'}`}>
      {value}
    </span>
  </div>
);
