import React, { memo } from 'react';
import { TYPE_COLORS } from '@/constants';
import { TYPE_NAMES } from '@/utils/dictionaries';
import './TypeBadge.css';

interface TypeBadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
}

const TypeBadge = memo(function TypeBadge({ type, size = 'md' }: TypeBadgeProps) {
  const color = TYPE_COLORS[type] ?? '#888888';
  const label = TYPE_NAMES[type] ?? type;

  return (
    <span
      className={`type-badge type-badge--${size}`}
      style={{ '--type-color': color } as React.CSSProperties}
      aria-label={`Tipo: ${label}`}
    >
      {label}
    </span>
  );
});

export default TypeBadge;
