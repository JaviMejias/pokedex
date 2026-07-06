import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { usePWA } from '@/hooks/usePWA';
import { STORAGE_KEYS } from '@/constants';
import './GlobalSettings.css';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

// Unrestricted 1-Hour Pokemon Lofi Mix (GlitchxCity)
const DEFAULT_VIDEO = 'm1vtEX64gmE';

function parseYouTubeId(url: string): { type: 'video' | 'playlist', id: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has('list')) {
      return { type: 'playlist', id: parsed.searchParams.get('list')! };
    }
    if (parsed.searchParams.has('v')) {
      return { type: 'video', id: parsed.searchParams.get('v')! };
    }
    if (parsed.hostname === 'youtu.be') {
      return { type: 'video', id: parsed.pathname.slice(1) };
    }
    return null;
  } catch {
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return { type: 'video', id: url };
    if (/^PL[a-zA-Z0-9_-]+$/.test(url)) return { type: 'playlist', id: url };
    return null;
  }
}

const GlobalSettings = memo(function GlobalSettings() {
  const { theme, toggleTheme } = useTheme();
  const { skin, toggleSkin } = useSettings();
  const { forceReload } = usePWA();
  
  const playerRef = useRef<any>(null);
  
  const [isAvailable, setIsAvailable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIO_MUTED);
      if (stored && !isNaN(Number(stored))) return Number(stored);
      return 35;
    } catch {
      return 35;
    }
  });
  
  const [youtubeUrl, setYoutubeUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.YOUTUBE_URL) || '';
  });
  const [currentPlaybackType, setCurrentPlaybackType] = useState<'video'|'playlist'>('video');

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag?.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const initPlayer = () => {
      const parsed = youtubeUrl ? parseYouTubeId(youtubeUrl) : null;
      const type = parsed?.type || 'video';
      const id = parsed?.id || DEFAULT_VIDEO;
      setCurrentPlaybackType(type);

      const playerVars: any = {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
      };

      if (type === 'playlist') {
        playerVars.listType = 'playlist';
        playerVars.list = id;
      } else {
        playerVars.playlist = id; // to loop single video
      }

      const playerConfig: any = {
        height: '1',
        width: '1',
        playerVars,
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume);
            setIsAvailable(true);
          },
          onError: (event: any) => {
            console.error('YouTube Player Error. Code:', event.data);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          }
        }
      };

      if (type === 'video') {
        playerConfig.videoId = id;
      }

      playerRef.current = new window.YT.Player('yt-player-container', playerConfig);
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = useCallback(() => {
    if (!playerRef.current || !isAvailable) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying, isAvailable]);

  const handleNext = useCallback(() => {
    if (!playerRef.current || !isAvailable) return;
    if (currentPlaybackType === 'playlist') {
      playerRef.current.nextVideo();
    } else {
      const currentTime = playerRef.current.getCurrentTime() || 0;
      playerRef.current.seekTo(currentTime + 180, true);
    }
  }, [isAvailable, currentPlaybackType]);

  const handlePrev = useCallback(() => {
    if (!playerRef.current || !isAvailable) return;
    if (currentPlaybackType === 'playlist') {
      playerRef.current.previousVideo();
    } else {
      const currentTime = playerRef.current.getCurrentTime() || 0;
      playerRef.current.seekTo(Math.max(0, currentTime - 180), true);
    }
  }, [isAvailable, currentPlaybackType]);

  const loadCustomUrl = () => {
    if (!playerRef.current || !isAvailable) return;
    const parsed = parseYouTubeId(youtubeUrl);
    if (parsed) {
      localStorage.setItem(STORAGE_KEYS.YOUTUBE_URL, youtubeUrl);
      setCurrentPlaybackType(parsed.type);
      if (parsed.type === 'playlist') {
        playerRef.current.loadPlaylist({ list: parsed.id, listType: 'playlist' });
      } else {
        playerRef.current.loadVideoById({ videoId: parsed.id });
      }
    } else {
      // Si está vacío o es un link inválido, volvemos al mix por defecto
      localStorage.removeItem(STORAGE_KEYS.YOUTUBE_URL);
      setYoutubeUrl('');
      setCurrentPlaybackType('video');
      playerRef.current.loadVideoById({ videoId: DEFAULT_VIDEO });
    }
  };

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (playerRef.current && isAvailable) {
      playerRef.current.setVolume(val);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIO_MUTED, String(val));
    } catch {
      // ignore
    }
  }, [isAvailable]);

  // Click outside to close
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    
    // Use mousedown to trigger slightly faster than click, ensuring it fires before other UI actions take focus
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <>
      <div id="yt-player-container" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }} />
      
      <div 
        ref={containerRef}
        className={`global-settings-widget ${isExpanded ? 'global-settings-widget--expanded' : ''}`}
      >
        
        {/* Toggle Expand Button (Gear Icon) */}
        <button
          className={`global-settings-fab ${isPlaying ? 'global-settings-fab--playing' : ''}`}
          onClick={() => setIsExpanded(e => !e)}
          aria-label="Ajustes Globales"
          type="button"
        >
          <span className="global-settings__icon" aria-hidden="true">
            {/* Gear Icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
        </button>

        {/* Expanded Panel */}
        {isExpanded && (
          <div className="global-settings-panel">
            <div className="global-settings-panel__header">
              <span className="global-settings-panel__title">Ajustes</span>
              <button className="global-settings-panel__close" onClick={() => setIsExpanded(false)}>✕</button>
            </div>
            
            <div className="global-settings-panel__section">
              <span className="global-settings-panel__section-title">Visuales</span>
              <div className="global-settings-panel__actions">
                <button className="global-settings-panel__btn" onClick={toggleTheme} title="Cambiar Tema">
                  {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
                </button>
                <button className="global-settings-panel__btn" onClick={toggleSkin} title="Cambiar Diseño">
                  {skin === 'retro' ? '🖥️ Modo PC' : '📱 Modo Consola'}
                </button>
              </div>
            </div>

            <div className="global-settings-panel__section">
              <span className="global-settings-panel__section-title">Sistema</span>
              <div className="global-settings-panel__actions">
                <button className="global-settings-panel__btn" onClick={() => forceReload()} title="Recargar App">
                  🔄 Recargar caché
                </button>
              </div>
            </div>

            {isAvailable && (
              <div className="global-settings-panel__section global-settings-panel__audio">
                <span className="global-settings-panel__section-title">Música Lofi</span>
                <div className="global-settings-panel__audio-controls">
                  <button className="global-settings-panel__audio-btn" onClick={handlePrev} title="Anterior">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                  </button>
                  
                  <button className="global-settings-panel__audio-btn global-settings-panel__audio-btn--main" onClick={togglePlay} title={isPlaying ? "Pausar" : "Reproducir"}>
                    {isPlaying ? (
                       <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                       <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>
                  
                  <button className="global-settings-panel__audio-btn" onClick={handleNext} title="Siguiente">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                  </button>
                </div>
                
                <div className="global-settings-panel__volume">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  </svg>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume} 
                    onChange={handleVolumeChange}
                    className="global-settings-panel__slider"
                    aria-label="Volumen"
                  />
                </div>

                <div className="global-settings-panel__custom-url">
                  <input 
                    type="text" 
                    className="global-settings-panel__input" 
                    placeholder="URL o ID de YouTube..."
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                  />
                  <button className="global-settings-panel__btn-small" onClick={loadCustomUrl}>Cargar</button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
});

export default GlobalSettings;
