import { memo, useEffect, useCallback, useRef, useState } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { identifyPokemonFromImage } from '@/services/geminiService';
import { useApiKey } from '@/hooks/useApiKey';
import es from '@/i18n/es';
import './ScannerView.css';

type ScanState = 'idle' | 'analyzing' | 'not-found' | 'found';

const ScannerView = memo(function ScannerView() {
  const { videoRef, status, errorMessage, startCamera, stopCamera } = useCamera();
  const { openDetail } = usePokemonContext();
  const { apiKey, setApiKey } = useApiKey();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [keyInput, setKeyInput] = useState('');

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      setApiKey(keyInput.trim());
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      setScanState('idle');
    };
  }, [startCamera, stopCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    setScanState('analyzing');
    
    // Call Gemini API to identify Pokemon
    identifyPokemonFromImage(apiKey, canvas).then((result) => {
      if (result) {
        setScanState('found');
        openDetail(result);
        setTimeout(() => setScanState('idle'), 500);
      } else {
        setScanState('not-found');
      }
    });
  }, [videoRef, openDetail, apiKey]);
  
  const handleReset = useCallback(() => {
    setScanState('idle');
  }, []);

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
          className={`scanner-view__video ${status === 'active' && scanState === 'idle' ? 'scanner-view__video--active' : ''}`}
          style={{ display: scanState === 'idle' ? 'block' : 'none' }}
          autoPlay
          playsInline
          muted
          aria-label="Vista de cámara para escaneo"
        />
        
        {/* Frozen frame (Snapshot) */}
        <canvas
          ref={canvasRef}
          className={`scanner-view__canvas ${scanState !== 'idle' ? 'scanner-view__canvas--active' : ''}`}
          style={{ display: scanState !== 'idle' ? 'block' : 'none' }}
        />

        {/* Futuristic overlay */}
        <div className="scanner-view__overlay" aria-hidden="true">
          <div className="scanner-view__corner scanner-view__corner--tl" />
          <div className="scanner-view__corner scanner-view__corner--tr" />
          <div className="scanner-view__corner scanner-view__corner--bl" />
          <div className="scanner-view__corner scanner-view__corner--br" />
          {scanState === 'analyzing' && <div className="scanner-view__scan-line" />}
        </div>
        
        {/* Auth Overlay (If no API Key) */}
        {!apiKey && (
          <div className="scanner-view__status-overlay scanner-view__status-overlay--error" style={{ background: 'rgba(0,0,0,0.85)' }}>
            <div className="scanner-view__status-content" style={{ color: 'white', maxWidth: '300px' }}>
              <span className="scanner-view__status-icon" aria-hidden="true">🔑</span>
              <p className="scanner-view__status-text" style={{ color: 'white' }}>¡Se necesita una API Key!</p>
              <p className="scanner-view__status-hint">Para usar el escáner con Inteligencia Artificial, configura tu clave gratuita de Google AI Studio.</p>
              <form onSubmit={handleSaveKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', width: '100%' }}>
                <input 
                  type="password" 
                  placeholder="Pega tu API Key aquí" 
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  style={{ padding: '10px', borderRadius: '12px', border: '2px solid #3b82f6', outline: 'none', textAlign: 'center' }}
                />
                <button type="submit" className="btn btn--primary">Guardar Clave</button>
              </form>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#ff5252', textDecoration: 'underline', marginTop: '12px', fontSize: '14px' }}>
                Obtener clave gratuita aquí
              </a>
            </div>
          </div>
        )}

        {/* Capture Button */}
        {status === 'active' && scanState === 'idle' && apiKey && (
           <div className="scanner-view__capture-overlay">
             <button className="scanner-view__capture-btn" onClick={handleCapture} aria-label="Escanear">
                <div className="scanner-view__capture-btn-inner" />
             </button>
           </div>
        )}
        
        {/* Not Found Error */}
        {scanState === 'not-found' && apiKey && (
          <div className="scanner-view__status-overlay scanner-view__status-overlay--error">
             <div className="scanner-view__status-content">
               <span className="scanner-view__status-icon" aria-hidden="true">❌</span>
               <p className="scanner-view__status-text">No se ha detectado ningún Pokémon.</p>
               <p className="scanner-view__status-hint">Intenta enfocar mejor o asegúrate de que haya luz.</p>
               <button className="btn btn--primary" onClick={handleReset} style={{ marginTop: '16px' }}>Reintentar</button>
             </div>
          </div>
        )}

        {/* Status overlay */}
        {status !== 'active' && apiKey && (
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
