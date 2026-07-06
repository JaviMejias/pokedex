import { useState, useEffect, useCallback } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSupported(true);
      
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      
      updateVoices();
      
      // In some browsers, voices are loaded asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find the best Spanish voice
    const esVoices = voices.filter(v => v.lang.startsWith('es'));
    let selectedVoice = esVoices.find(v => v.name.includes('Google') || v.name.includes('Microsoft Sabina') || v.name.includes('Microsoft Laura'));
    
    // Fallback to any Spanish voice, or default voice
    if (!selectedVoice && esVoices.length > 0) {
      selectedVoice = esVoices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Rotom Dex voice adjustments
    utterance.rate = 1.1; // Slightly faster
    utterance.pitch = 1.2; // Slightly higher pitch for a robotic/energetic feel

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, voices]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}
