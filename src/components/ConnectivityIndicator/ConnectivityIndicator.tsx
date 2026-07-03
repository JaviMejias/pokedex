import { memo } from 'react';
import { useConnectivity } from '@/hooks/useConnectivity';
import es from '@/i18n/es';
import './ConnectivityIndicator.css';

const ConnectivityIndicator = memo(function ConnectivityIndicator() {
  const isOnline = useConnectivity();

  if (isOnline) return null;

  return (
    <div
      className="connectivity-indicator"
      role="alert"
      aria-live="assertive"
      aria-label={es.connectivity.offline}
    >
      <span className="connectivity-indicator__dot" aria-hidden="true" />
      <span className="connectivity-indicator__text">{es.connectivity.offline}</span>
    </div>
  );
});

export default ConnectivityIndicator;
