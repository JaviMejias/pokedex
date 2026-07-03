import { memo } from 'react';
import { STAT_COLORS } from '@/constants';
import { STAT_NAMES } from '@/utils/dictionaries';
import { getStatPercentage } from '@/utils/formatters';
import './StatBar.css';

interface StatBarProps {
  statName: string;
  value: number;
  max?: number;
  animated?: boolean;
  hideLabel?: boolean;
}

const StatBar = memo(function StatBar({ statName, value, max = 255, animated = true, hideLabel = false }: StatBarProps) {
  const percentage = getStatPercentage(value, max);
  const color = STAT_COLORS[statName] ?? '#9090B0';
  const label = STAT_NAMES[statName] ?? statName;

  return (
    <div className="stat-bar" role="group" aria-label={`${label}: ${value}`}>
      {!hideLabel && (
        <div className="stat-bar__label">
          <span className="stat-bar__name">{label}</span>
          <span className="stat-bar__value">{value}</span>
        </div>
      )}
      <div className="stat-bar__track" aria-hidden="true">
        <div
          className={`stat-bar__fill${animated ? ' stat-bar__fill--animated' : ''}`}
          style={{
            '--stat-width': `${percentage}%`,
            '--stat-color': color,
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
});

export default StatBar;
