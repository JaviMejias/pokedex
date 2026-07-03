import { memo, useCallback } from 'react';
import type { NavigationTab } from '@/types/pokemon';
import es from '@/i18n/es';
import './BottomNav.css';

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

const BottomNav = memo(function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const handleExplore = useCallback(() => onTabChange('explore'), [onTabChange]);
  const handleScanner = useCallback(() => onTabChange('scanner'), [onTabChange]);
  const handleGames = useCallback(() => onTabChange('games'), [onTabChange]);

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <button
        className={`bottom-nav__item${activeTab === 'explore' ? ' bottom-nav__item--active' : ''}`}
        onClick={handleExplore}
        aria-current={activeTab === 'explore' ? 'page' : undefined}
        aria-label={es.nav.explore}
        type="button"
        id="nav-explore"
      >
        <span className="bottom-nav__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <span className="bottom-nav__label">{es.nav.explore}</span>
      </button>

      <button
        className={`bottom-nav__item bottom-nav__item--scanner${activeTab === 'scanner' ? ' bottom-nav__item--active' : ''}`}
        onClick={handleScanner}
        aria-current={activeTab === 'scanner' ? 'page' : undefined}
        aria-label={es.nav.scanner}
        type="button"
        id="nav-scanner"
      >
        <span className="bottom-nav__icon bottom-nav__icon--scanner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
        <span className="bottom-nav__label">{es.nav.scanner}</span>
      </button>

      <button
        className={`bottom-nav__item${activeTab === 'games' ? ' bottom-nav__item--active' : ''}`}
        onClick={handleGames}
        aria-current={activeTab === 'games' ? 'page' : undefined}
        aria-label={es.nav.games}
        type="button"
        id="nav-games"
      >
        <span className="bottom-nav__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="12" x2="10" y2="12" />
            <line x1="8" y1="10" x2="8" y2="14" />
            <line x1="15" y1="13" x2="15.01" y2="13" />
            <line x1="18" y1="11" x2="18.01" y2="11" />
            <rect x="2" y="6" width="20" height="12" rx="2" />
          </svg>
        </span>
        <span className="bottom-nav__label">{es.nav.games}</span>
      </button>
    </nav>
  );
});

export default BottomNav;
