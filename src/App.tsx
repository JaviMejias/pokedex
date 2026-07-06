import { ThemeProvider } from '@/contexts/ThemeContext';
import { PokemonProvider } from '@/contexts/PokemonContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { CacheProvider } from '@/contexts/CacheContext';
import { RotomProvider } from '@/contexts/RotomContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import AppShell from '@/components/AppShell/AppShell';

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <CacheProvider>
          <FavoritesProvider>
            <PokemonProvider>
              <RotomProvider>
                <AppShell />
              </RotomProvider>
            </PokemonProvider>
          </FavoritesProvider>
        </CacheProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
