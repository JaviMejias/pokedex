import { memo, useState, useCallback, Suspense } from 'react';
import BottomNav from '@/components/BottomNav/BottomNav';
import GlobalSettings from '@/components/GlobalSettings/GlobalSettings';
import ConnectivityIndicator from '@/components/ConnectivityIndicator/ConnectivityIndicator';
import PokemonDetail from '@/components/PokemonDetail/PokemonDetail';
import ExploreView from '@/views/ExploreView/ExploreView';
import ScannerView from '@/views/ScannerView/ScannerView';
import GamesView from '@/views/GamesView/GamesView';
import { LoadingState } from '@/components/StateComponents/StateComponents';
import { usePWA } from '@/hooks/usePWA';
import type { NavigationTab } from '@/types/pokemon';
import es from '@/i18n/es';
import RotomDex from '@/components/RotomDex/RotomDex';
import { usePokemonContext } from '@/contexts/PokemonContext';
import { useRotomContext } from '@/contexts/RotomContext';
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
          <div className="app-shell__banner-actions" style={{ width: '100%', justifyContent: 'center' }}>
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
  const [isRotomOpen, setIsRotomOpen] = useState(false);
  const { selectedPokemon } = usePokemonContext();
  const { contextMessage } = useRotomContext();

  const handleTabChange = useCallback((tab: NavigationTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="app-shell">
      <GlobalSettings />
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

      {/* Global Floating Action Button for Rotom Dex */}
      {!isRotomOpen && activeTab !== 'scanner' && (
        <button 
          className="app-shell__rotom-fab"
          onClick={() => setIsRotomOpen(true)}
          aria-label="Abrir Rotom Dex"
          title="Rotom Dex"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1.5">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 6v2m0 8v2M6 12h2m8 0h2" />
          </svg>
        </button>
      )}

      {/* Global Rotom Dex */}
      <RotomDex 
        pokemonName={selectedPokemon?.name}
        contextMessage={contextMessage}
        isOpen={isRotomOpen} 
        onClose={() => setIsRotomOpen(false)} 
      />

      {/* Modal — always mounted to preserve state */}
      <PokemonDetail />
    </div>
  );
});

export default AppShell;
