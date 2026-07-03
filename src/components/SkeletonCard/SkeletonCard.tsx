import { memo } from 'react';
import './SkeletonCard.css';

const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-card__image skeleton-shimmer" />
      <div className="skeleton-card__content">
        <div className="skeleton-card__id skeleton-shimmer" />
        <div className="skeleton-card__name skeleton-shimmer" />
        <div className="skeleton-card__types">
          <div className="skeleton-card__badge skeleton-shimmer" />
          <div className="skeleton-card__badge skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
});

export default SkeletonCard;
