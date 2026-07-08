import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Escanea un fotograma de video (canvas) usando Gemini 1.5 Flash para identificar un Pokémon.
 * @param apiKey La clave de API del usuario
 * @param canvas El canvas con el fotograma capturado
 * @returns El nombre del Pokémon en minúsculas, o null si no se detecta ninguno
 */
let cachedModelName: string | null = null;

async function getBestAvailableModel(apiKey: string): Promise<string> {
  if (cachedModelName) return cachedModelName;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data && data.models) {
      console.log("Available models:", data.models.map((m: any) => m.name));
      const models = data.models;
      // Priority: 1.5-flash, 2.5-flash (has 20 limit), 2.0-flash-lite, 2.0-flash
      const flash15 = models.find((m: any) => m.name.includes('1.5-flash') && m.supportedGenerationMethods?.includes('generateContent'));
      const flash25 = models.find((m: any) => m.name.includes('2.5-flash') && !m.name.includes('preview') && m.supportedGenerationMethods?.includes('generateContent'));
      const flash20lite = models.find((m: any) => m.name.includes('2.0-flash-lite') && m.supportedGenerationMethods?.includes('generateContent'));
      const flash20 = models.find((m: any) => m.name.includes('2.0-flash') && m.supportedGenerationMethods?.includes('generateContent'));
      const pro = models.find((m: any) => m.name.includes('pro') && m.supportedGenerationMethods?.includes('generateContent'));
      const anyFlash = models.find((m: any) => m.name.includes('flash') && m.supportedGenerationMethods?.includes('generateContent'));
      const anyGemini = models.find((m: any) => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'));
      
      const selected = flash15 || flash25 || flash20lite || flash20 || pro || anyFlash || anyGemini;
      if (selected) {
        cachedModelName = selected.name.replace('models/', '');
        console.log("Auto-selected model:", cachedModelName);
        return cachedModelName!;
      }
    }
  } catch (e) {
    console.error("Failed to fetch models list", e);
  }
  return 'gemini-2.0-flash-lite-001'; // Fallback to a fast model if fetch fails
}

export async function identifyPokemonFromImage(apiKey: string, canvas: HTMLCanvasElement): Promise<string | null> {
  try {
    if (!apiKey) {
      console.warn("No Gemini API key provided.");
      return null;
    }

    const resolvedModelName = await getBestAvailableModel(apiKey);
    const genAI = new GoogleGenerativeAI(apiKey);

    // Convertir canvas a base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    // Eliminar el prefijo data:image/jpeg;base64,
    const base64Data = dataUrl.split(',')[1];

    const model = genAI.getGenerativeModel({ model: resolvedModelName });
    
    const prompt = `
      You are a Pokedex scanner. I am showing you an image of a real-world object, drawing, toy, or screen.
      Your task is to identify if there is a Pokemon in this image.
      If you clearly see a Pokemon, return ONLY its exact English name in lowercase (e.g. "pikachu", "bulbasaur", "charizard").
      If there are multiple, return the most prominent one.
      If there is NO Pokemon in the image, or it's just a random object/person, return exactly "not-found".
      Do NOT return any other text, punctuation, or explanation.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      }
    ]);

    const responseText = result.response.text().trim().toLowerCase();
    
    if (responseText === 'not-found' || responseText === '' || responseText.includes('not-found')) {
      return null;
    }
    
    // Clean up any potential markdown or extra spaces
    return responseText.replace(/[^a-z0-9-]/g, '');
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return null;
  }
}

/**
 * Chatbot de Rotom Dex.
 * @param apiKey La clave de API del usuario
 * @param message El mensaje del usuario
 * @param history El historial previo de chat para mantener contexto
 * @param pokemonContextName El pokemon actual que se está viendo
 */
export async function askRotomDex(
  apiKey: string,
  message: string, 
  history: {role: 'user' | 'model', parts: [{text: string}]}[],
  pokemonContextName?: string,
  appContextMessage?: string
): Promise<string> {
  try {
    if (!apiKey) {
      return "¡Zzzt! No has configurado tu clave API. ¡Necesito energía para funcionar, compañero!";
    }

    const resolvedModelName = await getBestAvailableModel(apiKey);
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ 
      model: resolvedModelName,
      systemInstruction: `
        Eres la Rotom Dex, una IA enérgica, entusiasta y muy conocedora del mundo Pokémon. 
        Hablas en español. Llama al usuario "compañero" o "bzzzt". Usa onomatopeyas eléctricas como ¡Zzzt! o bzzz.
        Actúa como una guía enciclopédica, analista táctico y muy didáctica.
        ${pokemonContextName ? `Actualmente el usuario está viendo información sobre el Pokémon: ${pokemonContextName.toUpperCase()}. Si preguntan algo sin especificar a quién, se refieren a él.` : ''}
        ${appContextMessage ? `Contexto actual de la aplicación: ${appContextMessage}. Si el usuario te pregunta sobre su equipo o sobre un combate, usa esta información para evaluar debilidades, fortalezas y dar consejos útiles para el juego.` : ''}
        Cuando hables de un Pokémon, proporciona curiosidades interesantes, en qué juegos o regiones suele aparecer, en qué medios adicionales salió (como la serie animada) y aclara detalles de su numeración (por ejemplo, "este es su número en la Pokédex Regional, pero en nuestra Pokédex Nacional lo encontrarás bajo el número X").
        No seas excesivamente largo, responde en 1 o 2 párrafos concisos y mantén la energía alta.
      `
    });

    const chat = model.startChat({
      history: history
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Rotom Dex Error:", error);
    return "¡Bzzzt! Hubo un cortocircuito en mi sistema. ¡Intenta de nuevo más tarde!";
  }
}

/**
 * Escanea la viabilidad de un equipo Pokémon para TODO el juego a la vez.
 * @param apiKey La clave de API del usuario
 * @param teamNames Nombres de los Pokémon en el equipo
 * @param gameName Nombre del juego (ej. "Rojo Fuego")
 */
export async function analyzeFullTeamAdventure(
  apiKey: string,
  teamNames: string[],
  gameName: string
): Promise<any> {
  try {
    if (!apiKey) {
      return { error: "¡Zzzt! Necesito que abras a Rotom Dex (abajo a la derecha) y pongas tu clave API de Gemini primero. ¡Sin energía no hay análisis, compañero!" };
    }

    if (teamNames.length === 0) {
      return { error: "¡Bzzzt! Tu equipo está vacío. Añade algunos Pokémon antes de pedirme un análisis." };
    }

    const resolvedModelName = await getBestAvailableModel(apiKey);
    const genAI = new GoogleGenerativeAI(apiKey);

    const masterInstruction = `
      Eres la Rotom Dex, una IA experta en combate del mundo Pokémon. Hablas en español usando onomatopeyas eléctricas como ¡Zzzt! y llamas al usuario "compañero".
      Tu tarea es evaluar la viabilidad de un equipo Pokémon para superar el MODO HISTORIA/AVENTURA del juego especificado.
      DEBES DEVOLVER ESTRICTAMENTE UN JSON CON ESTA ESTRUCTURA MAESTRA:
      {
        "general": {
          "intro": "Párrafo introductorio de Rotom",
          "earlyGame": "Análisis táctico para el inicio de la aventura (hasta la 3ra medalla), considerando si este equipo actual es suficiente.",
          "midGame": "Análisis táctico para el juego medio (4ta a 6ta medalla), hablando de posibles debilidades que se irán notando.",
          "lateGame": "Análisis táctico para el final de la historia y calle victoria.",
          "rating": "Nota final del 1 al 10 (ej. '8/10')"
        },
        "gyms": {
          "summary": "Párrafo resumen de cómo enfrentará el equipo los gimnasios de esta región.",
          "challenges": [
            {
              "leader": "Nombre del Líder (ej. Roco)",
              "specialty": "Nombre del tipo de especialidad estrictamente en INGLÉS y minúsculas (ej. rock, water, electric, bug)",
              "acePokemon": "Nombre exacto del Pokémon insignia del líder (ej. cranidos)",
              "difficulty": 3, 
              "analysis": "Análisis táctico de 2 a 3 líneas sobre cómo este equipo enfrentará a este líder y su Pokémon estrella."
            }
          ]
        },
        "league": {
          "summary": "Párrafo resumen de cómo enfrentará el equipo la Liga Pokémon (Alto Mando y Campeón).",
          "challenges": [
            {
              "leader": "Nombre del Alto Mando/Campeón",
              "specialty": "Nombre del tipo de especialidad estrictamente en INGLÉS y minúsculas (ej. dark, ghost. Usa 'mixed' si es un campeón sin especialidad)",
              "acePokemon": "Nombre exacto del Pokémon insignia (ej. garchomp)",
              "difficulty": 5,
              "analysis": "Análisis táctico de 2 líneas sobre cómo este equipo enfrentará a este rival."
            }
          ]
        },
        "individual": {
          "pokemon": [
            {
              "name": "Nombre del Pokémon",
              "regionalDex": "Número regional (ej. #004) o 'N/A'",
              "nationalDex": "Número nacional (ej. #006)",
              "evolution": "Niveles/métodos de evolución",
              "bestAbilities": "Mejor habilidad para el modo historia",
              "analysis": "Rol recomendado en el equipo (atacante físico, defensivo, esclavo de MOs, etc.)"
            }
          ]
        }
      }
      (¡MUY IMPORTANTE! En gimnasios y liga debes mencionar a TODOS los miembros relevantes del juego y calificar la difficulty del 1 al 5 en número entero).
    `;

    const model = genAI.getGenerativeModel({ 
      model: resolvedModelName,
      generationConfig: {
        responseMimeType: "application/json"
      },
      systemInstruction: masterInstruction
    });

    const prompt = `Juego: Pokémon ${gameName}. Equipo: ${teamNames.join(', ')}. Genera el JSON maestro completo de la aventura.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Adventure Analyzer Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const retryMatch = errorMessage.match(/retry in (\d+(?:\.\d+)?)s/i);
    
    if (retryMatch && retryMatch[1]) {
      const retryAfter = Math.ceil(parseFloat(retryMatch[1]));
      return { 
        error: `¡Bzzzt! Mis circuitos están sobrecalentados por tantas consultas (límite de la API).`,
        retryAfter
      };
    }

    if (errorMessage.includes('429') || errorMessage.includes('quota')) {
      return { 
        error: "¡Bzzzt! Límite de consultas a la API alcanzado.",
        isQuotaExceeded: true
      };
    }

    return { error: "¡Bzzzt! Ocurrió un error al intentar analizar tu equipo. Mis engranajes se atascaron." };
  }
}
