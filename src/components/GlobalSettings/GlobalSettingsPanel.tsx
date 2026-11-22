import type { ChangeEvent, FormEvent } from 'react';

interface GlobalSettingsPanelProps {
  theme: 'light' | 'dark';
  skin: 'modern' | 'retro';
  toggleTheme: () => void;
  toggleSkin: () => void;
  apiKey: string;
  apiKeyInput: string;
  setApiKeyInput: (value: string) => void;
  handleSaveApiKey: (event: FormEvent) => void;
  apiKeySaved: boolean;
  forceReload: () => void;
  isAvailable: boolean;
  handlePrev: () => void;
  togglePlay: () => void;
  isPlaying: boolean;
  handleNext: () => void;
  volume: number;
  handleVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  youtubeUrl: string;
  setYoutubeUrl: (value: string) => void;
  loadCustomUrl: () => void;
  close: () => void;
}

export function GlobalSettingsPanel({
  theme,
  skin,
  toggleTheme,
  toggleSkin,
  apiKey,
  apiKeyInput,
  setApiKeyInput,
  handleSaveApiKey,
  apiKeySaved,
  forceReload,
  isAvailable,
  handlePrev,
  togglePlay,
  isPlaying,
  handleNext,
  volume,
  handleVolumeChange,
  youtubeUrl,
  setYoutubeUrl,
  loadCustomUrl,
  close,
}: GlobalSettingsPanelProps) {
  return (
    <div className="global-settings-panel">
      <div className="global-settings-panel__header">
        <span className="global-settings-panel__title">Ajustes</span>
        <button className="global-settings-panel__close" onClick={close} aria-label="Cerrar ajustes">✕</button>
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
        <span className="global-settings-panel__section-title">Inteligencia Artificial (Gemini)</span>
        <form className="global-settings-panel__api-form" onSubmit={handleSaveApiKey}>
          <label htmlFor="gemini-api-key" className="sr-only">Clave API de Gemini</label>
          <input
            id="gemini-api-key"
            type="password"
            className="global-settings-panel__input"
            placeholder="Pega tu API Key de Gemini..."
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="global-settings-panel__btn-small">
            {apiKeySaved ? '✓ Guardada' : apiKey ? '🔑 Actualizar' : '🔑 Guardar'}
          </button>
        </form>
        {apiKey && <p className="global-settings-panel__api-hint">API Key activa ✓ — Rotom Dex y Scanner están listos.</p>}
        {!apiKey && <p className="global-settings-panel__api-hint"><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Obtener clave gratuita →</a></p>}
      </div>

      <div className="global-settings-panel__section">
        <span className="global-settings-panel__section-title">Sistema</span>
        <div className="global-settings-panel__actions">
          <button className="global-settings-panel__btn" onClick={forceReload} title="Recargar App">
            🔄 Recargar caché
          </button>
        </div>
      </div>

      {isAvailable && (
        <div className="global-settings-panel__section global-settings-panel__audio">
          <span className="global-settings-panel__section-title">Música Lofi</span>
          <div className="global-settings-panel__audio-controls">
            <button className="global-settings-panel__audio-btn" onClick={handlePrev} title="Anterior" aria-label="Anterior">
              <span aria-hidden="true">⏮</span>
            </button>
            <button className="global-settings-panel__audio-btn global-settings-panel__audio-btn--main" onClick={togglePlay} title={isPlaying ? 'Pausar' : 'Reproducir'} aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
              <span aria-hidden="true">{isPlaying ? '⏸' : '▶'}</span>
            </button>
            <button className="global-settings-panel__audio-btn" onClick={handleNext} title="Siguiente" aria-label="Siguiente">
              <span aria-hidden="true">⏭</span>
            </button>
          </div>
          <div className="global-settings-panel__volume">
            <span aria-hidden="true">🔊</span>
            <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} className="global-settings-panel__slider" aria-label="Volumen" />
          </div>
          <div className="global-settings-panel__custom-url">
            <label htmlFor="youtube-url" className="sr-only">URL o ID de YouTube</label>
            <input id="youtube-url" type="text" className="global-settings-panel__input" placeholder="URL o ID de YouTube..." value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
            <button className="global-settings-panel__btn-small" onClick={loadCustomUrl}>Cargar</button>
          </div>
        </div>
      )}
    </div>
  );
}
