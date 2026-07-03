import { memo, useEffect, useCallback, useRef, useState } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { usePokemonContext } from '@/contexts/PokemonContext';
import es from '@/i18n/es';
import './ScannerView.css';

type ScanState = 'idle' | 'analyzing' | 'not-found' | 'found';

/**
 * analyzeFramePixels — Simulador de IA y análisis de píxeles reales.
 * Toma el canvas congelado, calcula el brillo general para descartar imágenes negras/oscuras,
 * y luego simula un resultado de IA buscando un Pokémon.
 */
async function analyzeFramePixels(canvas: HTMLCanvasElement): Promise<string | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      
      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return resolve(null);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      let totalBrightness = 0;
      let pixelCount = 0;
      
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
        totalBrightness += brightness;
        pixelCount++;
      }
      
      const avgBrightness = totalBrightness / pixelCount;
      
      // Si la imagen es casi negra (ej. cámara tapada o habitación oscura), fallar.
      if (avgBrightness < 20) {
        return resolve(null);
      }
      
      // Simular un modelo de IA encontrando algo en una imagen válida
      const mockPool = ['pikachu', 'bulbasaur', 'charmander', 'squirtle', 'eevee', 'gengar', 'snorlax', 'mewtwo'];
      const randomMatch = mockPool[Math.floor(Math.random() * mockPool.length)];
      resolve(randomMatch);
    }, 1500); // 1.5s de análisis visual
  });
}

const ScannerView = memo(function ScannerView() {
  const { videoRef, status, errorMessage, startCamera, stopCamera } = useCamera();
  const { openDetail } = usePokemonContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      setScanState('idle');
    };
  }, [startCamera, stopCamera]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    
    setScanState('analyzing');
    
    analyzeFramePixels(canvas).then((result) => {
      if (result) {
        setScanState('found');
        openDetail(result);
        setTimeout(() => setScanState('idle'), 500);
      } else {
        setScanState('not-found');
      }
    });
  }, [videoRef, openDetail]);
  
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
        
        {/* Capture Button */}
        {status === 'active' && scanState === 'idle' && (
           <div className="scanner-view__capture-overlay">
             <button className="scanner-view__capture-btn" onClick={handleCapture} aria-label="Escanear">
                <div className="scanner-view__capture-btn-inner" />
             </button>
           </div>
        )}
        
        {/* Not Found Error */}
        {scanState === 'not-found' && (
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
