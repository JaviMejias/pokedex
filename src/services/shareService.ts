import es from '@/i18n/es';

interface ShareOptions {
  title: string;
  text: string;
  url: string;
}

export async function sharePokemon(pokemonName: string, pokemonId: number): Promise<boolean> {
  const url = `${window.location.origin}?pokemon=${pokemonId}`;
  const options: ShareOptions = {
    title: es.share.title,
    text: `${es.share.text}: ${pokemonName}`,
    url,
  };

  if (navigator.share) {
    try {
      await navigator.share(options);
      return true;
    } catch {
      return false;
    }
  }

  return copyToClipboard(url);
}

export async function shareTeam(teamUrl: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: es.share.title,
        text: 'Mira mi equipo Pokémon',
        url: teamUrl,
      });
      return true;
    } catch {
      return false;
    }
  }

  return copyToClipboard(teamUrl);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
}
