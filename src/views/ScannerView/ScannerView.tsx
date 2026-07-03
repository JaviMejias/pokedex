import { memo, useEffect, useCallback } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { usePokemonContext } from '@/contexts/PokemonContext';
import es from '@/i18n/es';
import './ScannerView.css';

/**
 * analyzeFrame — Simulated AI frame analysis.
 * Returns a detected Pokémon name after a delay.
 * Architecture is prepared for future TensorFlow.js integration:
 * - Replace the setTimeout with actual model inference
 * - Pass videoRef.current as input to the model
 */
async function analyzeFrame(_videoElement: HTMLVideoElement | null): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve('pikachu'), 3000);
  });
}

const ScannerView = memo(function ScannerView() {
  const { videoRef, status, errorMessage, startCamera, stopCamera } = useCamera();
  const { openDetail } = usePokemonContext();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (status !== 'active') return;

    let cancelled = false;
    analyzeFrame(videoRef.current).then((pokemonName) => {
      if (!cancelled) openDetail(pokemonName);
    }).catch(() => {/* ignore */});

    return () => { cancelled = true; };
  }, [status, videoRef, openDetail]);

  const handleRetry = useCallback(() => {
    startCamera();
  }, [startCamera]);

  const getStatusLabel = (): string => {
    switch (status) {
      case 'requesting': return es.scanner.requesting;
      case 'active': return es.scanner.active;
      case 'denied': return es.scanner.permissionDenied;
      case 'unavailable': return es.scanner.notAvailable;
      case 'error': return es.scanner.error;
      default: return '';
    }
  };

  return (
    <div className="scanner-view">
      <div className="scanner-view__header">
        <h1 className="scanner-view__title">{es.scanner.title}</h1>
        <p className="scanner-view__subtitle">{es.scanner.subtitle}</p>
      </div>

      <div className="scanner-view__viewport">
        {/* Camera feed */}
        <video
          ref={videoRef}
          className={`scanner-view__video${status === 'active' ? ' scanner-view__video--active' : ''}`}
          autoPlay
          playsInline
          muted
          aria-label="Vista de cámara para escaneo"
        />

        {/* Futuristic overlay */}
        <div className="scanner-view__overlay" aria-hidden="true">
          <div className="scanner-view__corner scanner-view__corner--tl" />
          <div className="scanner-view__corner scanner-view__corner--tr" />
          <div className="scanner-view__corner scanner-view__corner--bl" />
          <div className="scanner-view__corner scanner-view__corner--br" />
          {status === 'active' && <div className="scanner-view__scan-line" />}
        </div>

        {/* Status overlay */}
        {status !== 'active' && (
          <div className="scanner-view__status-overlay">
            {status === 'requesting' && (
              <div className="scanner-view__status-content">
                <div className="scanner-view__status-spinner" />
                <p className="scanner-view__status-text">{es.scanner.requesting}</p>
              </div>
            )}
            {(status === 'denied' || status === 'unavailable' || status === 'error') && (
              <div className="scanner-view__status-content">
                <span className="scanner-view__status-icon" aria-hidden="true">
                  {status === 'denied' ? '🔒' : status === 'unavailable' ? '📷' : '⚠️'}
                </span>
                <p className="scanner-view__status-text">{getStatusLabel()}</p>
                {errorMessage && (
                  <p className="scanner-view__status-hint">{errorMessage}</p>
                )}
                {status === 'denied' && (
                  <p className="scanner-view__status-hint">{es.scanner.permissionDeniedHint}</p>
                )}
                <button
                  className="scanner-view__retry-btn"
                  onClick={handleRetry}
                  type="button"
                  id="scanner-retry-btn"
                >
                  {es.scanner.retry}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Analyzing badge */}
        {status === 'active' && (
          <div className="scanner-view__analyzing" aria-live="polite">
            <span className="scanner-view__analyzing-dot" aria-hidden="true" />
            <span>{es.scanner.analyzing}</span>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="scanner-view__status-bar" aria-live="polite">
        <span
          className={`scanner-view__status-dot scanner-view__status-dot--${status}`}
          aria-hidden="true"
        />
        <span className="scanner-view__status-label">{getStatusLabel()}</span>
      </div>
    </div>
  );
});

export default ScannerView;
