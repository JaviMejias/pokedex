import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { STORAGE_KEYS } from '@/constants';

type Skin = 'modern' | 'retro';

interface SettingsContextType {
  skin: Skin;
  toggleSkin: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [skin, setSkin] = useState<Skin>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SKIN);
      return (stored as Skin) || 'retro';
    } catch {
      return 'retro';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SKIN, skin);
    } catch {
      // ignore
    }
  }, [skin]);

  const toggleSkin = () => {
    setSkin(prev => (prev === 'retro' ? 'modern' : 'retro'));
  };

  return (
    <SettingsContext.Provider value={{ skin, toggleSkin }}>
      {children}
    </SettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
