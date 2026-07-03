import { memo, useState, useCallback, Suspense } from 'react';
import BottomNav from '@/components/BottomNav/BottomNav';
import AudioPlayer from '@/components/AudioPlayer/AudioPlayer';
import ConnectivityIndicator from '@/components/ConnectivityIndicator/ConnectivityIndicator';
import PokemonDetail from '@/components/PokemonDetail/PokemonDetail';
import ExploreView from '@/views/ExploreView/ExploreView';
import ScannerView from '@/views/ScannerView/ScannerView';
import GamesView from '@/views/GamesView/GamesView';
import { LoadingState } from '@/components/StateComponents/StateComponents';
import { usePWA } from '@/hooks/usePWA';
import type { NavigationTab } from '@/types/pokemon';
import es from '@/i18n/es';
import './AppShell.css';

const PWABanners = memo(function PWABanners() {
  const { canInstall, hasUpdate, install, dismissInstall, dismissUpdate, applyUpdate } = usePWA();

  return (
    <>
      {hasUpdate && (
        <div className="app-shell__banner app-shell__banner--update" role="alert">
          <span>{es.pwa.update}</span>
          <div className="app-shell__banner-actions">
            <button onClick={applyUpdate} className="app-shell__banner-btn app-shell__banner-btn--primary" type="button">
              {es.pwa.updateNow}
            </button>
            <button onClick={dismissUpdate} className="app-shell__banner-btn" type="button">✕</button>
          </div>
        </div>
      )}
      {canInstall && (
        <div className="app-shell__banner app-shell__banner--install" role="complementary">
          <span className="app-shell__banner-text">{es.pwa.install}</span>
          <div className="app-shell__banner-actions">
            <button onClick={install} className="app-shell__banner-btn app-shell__banner-btn--primary" type="button">
              {es.pwa.install}
            </button>
            <button onClick={dismissInstall} className="app-shell__banner-btn" type="button" aria-label="Cerrar">✕</button>
          </div>
        </div>
      )}
    </>
  );
});

const AppShell = memo(function AppShell() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('explore');

  const handleTabChange = useCallback((tab: NavigationTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="app-shell">
      <AudioPlayer />
      <ConnectivityIndicator />
      <PWABanners />

      <main className="app-shell__main" id="main-content">
        <Suspense fallback={<LoadingState message="Cargando..." />}>
          {activeTab === 'explore' && <ExploreView />}
          {activeTab === 'scanner' && <ScannerView />}
          {activeTab === 'games' && <GamesView />}
        </Suspense>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Modal — always mounted to preserve state */}
      <PokemonDetail />
    </div>
  );
});

export default AppShell;
