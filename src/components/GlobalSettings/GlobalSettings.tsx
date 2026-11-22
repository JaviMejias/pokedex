import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useApiKey } from '@/hooks/useApiKey';
import { usePWA } from '@/hooks/usePWA';
import { STORAGE_KEYS } from '@/constants';
import { GlobalSettingsPanel } from './GlobalSettingsPanel';
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
  const { apiKey, setApiKey } = useApiKey();
  const { forceReload } = usePWA();

  const [apiKeyInput, setApiKeyInput] = useState(() => apiKey || '');
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(apiKeyInput.trim());
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  };
  
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

        {isExpanded && <GlobalSettingsPanel
          theme={theme}
          skin={skin}
          toggleTheme={toggleTheme}
          toggleSkin={toggleSkin}
          apiKey={apiKey}
          apiKeyInput={apiKeyInput}
          setApiKeyInput={setApiKeyInput}
          handleSaveApiKey={handleSaveApiKey}
          apiKeySaved={apiKeySaved}
          forceReload={forceReload}
          isAvailable={isAvailable}
          handlePrev={handlePrev}
          togglePlay={togglePlay}
          isPlaying={isPlaying}
          handleNext={handleNext}
          volume={volume}
          handleVolumeChange={handleVolumeChange}
          youtubeUrl={youtubeUrl}
          setYoutubeUrl={setYoutubeUrl}
          loadCustomUrl={loadCustomUrl}
          close={() => setIsExpanded(false)}
        />}
      </div>
    </>
  );
});

export default GlobalSettings;
