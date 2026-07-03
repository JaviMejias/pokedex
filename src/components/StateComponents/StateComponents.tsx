import { memo } from 'react';
import './StateComponents.css';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = memo(function ErrorState({
  title = 'Algo salió mal',
  message = 'Por favor, intenta nuevamente',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-container state-error" role="alert" aria-live="assertive">
      <div className="state-icon state-icon--error">⚠️</div>
      <h2 className="state-title">{title}</h2>
      <p className="state-message">{message}</p>
      {onRetry && (
        <button className="state-button state-button--primary" onClick={onRetry} type="button">
          Intentar nuevamente
        </button>
      )}
    </div>
  );
});

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = memo(function LoadingState({ message = 'Cargando...' }: LoadingStateProps) {
  return (
    <div className="state-container state-loading" role="status" aria-live="polite" aria-label={message}>
      <div className="loading-pokeball" aria-hidden="true">
        <div className="pokeball-top" />
        <div className="pokeball-bottom" />
        <div className="pokeball-center" />
      </div>
      <p className="state-message">{message}</p>
    </div>
  );
});

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState = memo(function EmptyState({ icon = '🔍', title, message, action }: EmptyStateProps) {
  return (
    <div className="state-container state-empty" role="status">
      <div className="state-icon">{icon}</div>
      <h2 className="state-title">{title}</h2>
      {message && <p className="state-message">{message}</p>}
      {action && (
        <button className="state-button state-button--secondary" onClick={action.onClick} type="button">
          {action.label}
        </button>
      )}
    </div>
  );
});
