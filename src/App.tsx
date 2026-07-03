import { ThemeProvider } from '@/contexts/ThemeContext';
import { PokemonProvider } from '@/contexts/PokemonContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { CacheProvider } from '@/contexts/CacheContext';
import AppShell from '@/components/AppShell/AppShell';

function App() {
  return (
    <ThemeProvider>
      <CacheProvider>
        <FavoritesProvider>
          <PokemonProvider>
            <AppShell />
          </PokemonProvider>
        </FavoritesProvider>
      </CacheProvider>
    </ThemeProvider>
  );
}

export default App;
