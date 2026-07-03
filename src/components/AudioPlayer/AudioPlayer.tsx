import { memo, useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS } from '@/constants';
import es from '@/i18n/es';
import './AudioPlayer.css';

const AudioPlayer = memo(function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIO_MUTED);
      return stored !== 'false';
    } catch {
      return true;
    }
  });
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const audio = new Audio('/bgm.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;

    const handleCanPlay = () => setIsAvailable(true);
    const handleError = () => setIsAvailable(false);

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isAvailable) return;

    if (isMuted) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        setIsMuted(true);
      });
    }

    try {
      localStorage.setItem(STORAGE_KEYS.AUDIO_MUTED, String(isMuted));
    } catch {
      // ignore
    }
  }, [isMuted, isAvailable]);

  if (!isAvailable) return null;

  return (
    <button
      className={`audio-player${!isMuted ? ' audio-player--playing' : ''}`}
      onClick={() => setIsMuted(m => !m)}
      aria-label={isMuted ? es.audio.unmute : es.audio.mute}
      aria-pressed={!isMuted}
      type="button"
      id="audio-player-btn"
    >
      <span className="audio-player__icon" aria-hidden="true">
        {isMuted ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </span>
      {!isMuted && (
        <span className="audio-player__bars" aria-hidden="true">
          <span className="audio-player__bar" />
          <span className="audio-player__bar" />
          <span className="audio-player__bar" />
          <span className="audio-player__bar" />
        </span>
      )}
    </button>
  );
});

export default AudioPlayer;
