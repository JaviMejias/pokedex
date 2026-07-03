import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Escanea un fotograma de video (canvas) usando Gemini 1.5 Flash para identificar un Pokémon.
 * @param apiKey La clave de API del usuario
 * @param canvas El canvas con el fotograma capturado
 * @returns El nombre del Pokémon en minúsculas, o null si no se detecta ninguno
 */
export async function identifyPokemonFromImage(apiKey: string, canvas: HTMLCanvasElement): Promise<string | null> {
  try {
    if (!apiKey) {
      console.warn("No Gemini API key provided.");
      return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Convertir canvas a base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    // Eliminar el prefijo data:image/jpeg;base64,
    const base64Data = dataUrl.split(',')[1];

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    
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
  pokemonContextName?: string
): Promise<string> {
  try {
    if (!apiKey) {
      return "¡Zzzt! No has configurado tu clave API. ¡Necesito energía para funcionar, compañero!";
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-latest',
      systemInstruction: `
        Eres la Rotom Dex, una IA enérgica, entusiasta y muy conocedora del mundo Pokémon. 
        Hablas en español. Llama al usuario "compañero" o "bzzzt". Usa onomatopeyas eléctricas como ¡Zzzt! o bzzz.
        Da respuestas útiles, precisas pero con mucha personalidad.
        ${pokemonContextName ? `Actualmente el usuario está viendo información sobre el Pokémon: ${pokemonContextName.toUpperCase()}. Si preguntan algo sin especificar a quién, se refieren a él.` : ''}
        No seas excesivamente largo, responde en 1 o 2 párrafos concisos.
      `
    });

    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 250,
      }
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Rotom Dex Error:", error);
    return "¡Bzzzt! Hubo un cortocircuito en mi sistema. ¡Intenta de nuevo más tarde!";
  }
}
