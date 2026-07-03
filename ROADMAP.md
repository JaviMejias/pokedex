# 🚀 Roadmap: Pokédex Pro

Este documento contiene las ideas y características planificadas para implementarse en el futuro en la aplicación.

## 🌟 Características Prioritarias

### 1. Reproductor de Sonidos (Gritos Pokémon) 🔊
**Descripción:** Integrar los archivos de audio oficiales de la PokéAPI en la ficha de cada Pokémon.
**Implementación propuesta:** 
- Añadir un botón de altavoz cerca del nombre o imagen del Pokémon en `PokemonDetail.tsx`.
- Usar el campo `cries` (ej. `cries.latest`) que provee la PokéAPI.
- Asegurar que el audio tenga controles de volumen y manejo de errores si no está disponible.

### 2. Tarjetas Brillantes Holográficas (Holo Cards) ✨
**Descripción:** Darle un estilo premium de cartas coleccionables a los Pokémon favoritos y del equipo.
**Implementación propuesta:**
- Añadir un efecto de resplandor o *glare* CSS usando pseudo-elementos (`::before`/`::after`) en `PokemonCard.tsx`.
- El efecto holográfico debe reaccionar al movimiento del ratón o inclinación (en móviles) sobre la tarjeta.
- Solo se aplicaría a tarjetas que tengan el estado de "Favorito" o que pertenezcan al "Equipo".

### 3. Sistema de Logros y Perfil de Entrenador 🏆
**Descripción:** Gamificar la experiencia analizando las preferencias del usuario.
**Implementación propuesta:**
- Crear una nueva vista de "Perfil" o integrarlo en la cabecera.
- Lógica para analizar los tipos predominantes en los favoritos y el equipo.
- Otorgar títulos automáticos (ej. "Entrenador de Fuego", "Maestro Dragón") y medallas visuales.

### 4. Terminal Kanto (Modo oscuro retro) 💻
**Descripción:** Un modo oscuro específico para la "skin retro" de la Pokédex.
**Implementación propuesta:**
- Añadir un botón o *switch* en la vista retro.
- Cambiar las variables CSS de `.pokedex-device__screen` a un fondo muy oscuro (ej. `#0a0a0a`).
- Aplicar un estilo de texto verde brillante o ámbar monocromático para simular monitores CRT antiguos.

---
*Nota: La idea del minijuego de adivinar la silueta fue descartada/aplazada temporalmente según preferencia del usuario.*
