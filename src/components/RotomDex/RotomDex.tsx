import { useState, useRef, useEffect, memo } from 'react';
import { askRotomDex } from '@/services/geminiService';
import { useApiKey } from '@/hooks/useApiKey';
import './RotomDex.css';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface RotomDexProps {
  pokemonName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const RotomDex = memo(function RotomDex({ pokemonName, isOpen, onClose }: RotomDexProps) {
  const { apiKey, setApiKey } = useApiKey();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `¡Bzzzt! ¡Hola compañero! Soy tu Rotom Dex. ${pokemonName ? `Veo que estás revisando a ${pokemonName.toUpperCase()}. ` : ''}¿Qué te gustaría saber?`
    }
  ]);
  const [input, setInput] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (isOpen) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Si cambia el pokemon, reiniciamos el chat con un saludo nuevo
  useEffect(() => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        text: `¡Zzzt! Nuevo Pokémon detectado: ${pokemonName ? pokemonName.toUpperCase() : 'Ninguno'}. ¿Dudas al respecto, compañero?`
      }
    ]);
  }, [pokemonName]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setIsLoading(true);

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText
    };

    setMessages(prev => [...prev, newUserMsg]);

    // Format history for Gemini API (must start with 'user')
    // Since our first message is always a hardcoded 'model' greeting, we skip it.
    const history = messages.slice(1).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await askRotomDex(apiKey, userText, history as any, pokemonName);

    const newModelMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText
    };

    setMessages(prev => [...prev, newModelMsg]);
    setIsLoading(false);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      setApiKey(keyInput.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rotom-dex-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rotom-dex">
        <div className="rotom-dex__header">
          <div className="rotom-dex__eyes">
            <div className="rotom-dex__eye"></div>
            <div className="rotom-dex__eye"></div>
          </div>
          <h3 className="rotom-dex__title">Rotom Dex</h3>
          <button className="rotom-dex__close" onClick={onClose} aria-label="Cerrar Rotom Dex">
            &times;
          </button>
        </div>

        {!apiKey ? (
          <div className="rotom-dex__auth">
            <p className="rotom-dex__auth-msg">¡Bzzzt! Necesito una API Key de Google AI Studio para funcionar. ¡Es gratis!</p>
            <form onSubmit={handleSaveKey} className="rotom-dex__auth-form">
              <input 
                type="password" 
                placeholder="Pega tu API Key aquí" 
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                className="rotom-dex__input"
              />
              <button type="submit" className="rotom-dex__auth-btn">Guardar</button>
            </form>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="rotom-dex__auth-link">
              Obtener clave gratuita
            </a>
          </div>
        ) : (
          <>
            <div className="rotom-dex__chat">
          {messages.map(msg => (
            <div key={msg.id} className={`rotom-dex__msg-wrapper rotom-dex__msg-wrapper--${msg.role}`}>
              <div className={`rotom-dex__msg rotom-dex__msg--${msg.role}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="rotom-dex__msg-wrapper rotom-dex__msg-wrapper--model">
              <div className="rotom-dex__msg rotom-dex__msg--loading">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

          <form className="rotom-dex__input-area" onSubmit={handleSend}>
            <input
              type="text"
              className="rotom-dex__input"
              placeholder="Pregúntale a Rotom..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="rotom-dex__send-btn" disabled={!input.trim() || isLoading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </>
        )}
      </div>
    </div>
  );
});

export default RotomDex;
